/**
 * Package-local unit tests for @skillerr/core's primitives, run directly
 * against this package (no dependency on @skillerr/cli). End-to-end
 * compile/mint/pack flows are covered by @skillerr/cli's conformance and
 * adversarial suites; this file targets the lower-level building blocks in
 * isolation (Tier 3: root npm test only ran @skillerr/cli).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalize, sha256Digest, sha256Hex, packageDigestFromContent } from "./hash.js";
import { normalizePath, assertSafePaths, UnsafePathError } from "./paths.js";
import { packSkill, unpackSkill } from "./pack.js";
import { mintSkillPackage, verifyMintTrust } from "./mint.js";
import { validatePackageBytes } from "./validate.js";
import { compileSkillSource, approveCompilation } from "./compile.js";
import {
  DEFAULT_SKILL_POLICY,
  PROTOCOL_VERSION,
  type SkillContract,
  type SkillPackageFiles,
  type SkillSource,
} from "@skillerr/protocol";

test("canonicalize: object keys sort by UTF-16 code unit, not insertion order", () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), '{"a":2,"b":1}');
  assert.equal(canonicalize({}), "{}");
  assert.equal(canonicalize([1, "two", null, true]), '[1,"two",null,true]');
});

test("canonicalize: rejects non-finite numbers", () => {
  assert.throws(() => canonicalize({ x: Infinity }), /finite/i);
  assert.throws(() => canonicalize({ x: NaN }), /finite/i);
});

test("sha256Digest / sha256Hex: stable, prefixed, hex-encoded", () => {
  const digest = sha256Digest("abc");
  assert.match(digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(digest, `sha256:${sha256Hex("abc")}`);
  assert.equal(sha256Digest("abc"), sha256Digest("abc"));
  assert.notEqual(sha256Digest("abc"), sha256Digest("abd"));
});

test("packageDigestFromContent: order-independent, excludes signatures/**", () => {
  const a = packageDigestFromContent([
    { path: "b.json", digest: "sha256:1" },
    { path: "a.json", digest: "sha256:2" },
  ]);
  const b = packageDigestFromContent([
    { path: "a.json", digest: "sha256:2" },
    { path: "b.json", digest: "sha256:1" },
  ]);
  assert.equal(a, b, "content order must not affect the digest");

  const withSig = packageDigestFromContent([
    { path: "a.json", digest: "sha256:2" },
    { path: "signatures/creation.dsse.json", digest: "sha256:ignored" },
  ]);
  const withoutSig = packageDigestFromContent([{ path: "a.json", digest: "sha256:2" }]);
  assert.equal(withSig, withoutSig, "signatures/** must not affect package_digest");
});

test("normalizePath: accepts safe relative paths, converts backslashes", () => {
  assert.equal(normalizePath("knowledge/a.json"), "knowledge/a.json");
  assert.equal(normalizePath("knowledge\\a.json"), "knowledge/a.json");
});

test("normalizePath: rejects each unsafe pattern with a distinct code", () => {
  const cases: Array<[string, string]> = [
    ["../evil.txt", "path_traversal"],
    ["/etc/passwd", "absolute_path"],
    ["C:/evil.txt", "windows_absolute_path"],
    ["a//b", "invalid_segment"],
    ["./a", "invalid_segment"],
    ["", "empty_path"],
  ];
  for (const [input, code] of cases) {
    assert.throws(
      () => normalizePath(input),
      (e: unknown) => e instanceof UnsafePathError && e.code === code,
      `expected code "${code}" for input ${JSON.stringify(input)}`,
    );
  }
});

test("assertSafePaths: rejects duplicate normalized paths", () => {
  assert.throws(
    () => assertSafePaths(["a.json", "a.json"]),
    (e: unknown) => e instanceof UnsafePathError && e.code === "duplicate_path",
  );
  assert.doesNotThrow(() => assertSafePaths(["a.json", "b.json"]));
});

function minimalPackage(): SkillPackageFiles {
  return {
    manifest: {
      kind: "dot-skill",
      id: "skl_unit",
      version: "1.0.0",
      title: "Unit test skill",
      description: "Minimal package for core unit tests",
      container_version: "1",
      protocol_version: "0.5.0",
      entrypoint: "s1",
      inputs: [],
      outputs: [],
      capabilities: [],
      permissions: [],
      policy: { ...DEFAULT_SKILL_POLICY },
      content: [],
      package_digest: "sha256:" + "0".repeat(64),
      provenance_mode: "proof_only",
    },
    workflow: {
      kind: "workflow",
      dialect_version: "1.1",
      entrypoint: "s1",
      steps: [{ id: "s1", kind: "emit", output: "result", from: "s1" }],
    },
    knowledge: [],
  };
}

test("pack/unpack: round-trips manifest, workflow, and knowledge unchanged", () => {
  const pkg = minimalPackage();
  pkg.knowledge = [
    {
      kind: "knowledge",
      id: "k1",
      type: "rule",
      title: "Rule",
      body: "Always be polite.",
      fidelity: "exact",
      pinned: true,
    },
  ];
  const bytes = packSkill(pkg);
  const unpacked = unpackSkill(bytes);
  assert.equal(unpacked.manifest.id, "skl_unit");
  assert.equal(unpacked.knowledge.length, 1);
  assert.equal(unpacked.knowledge[0]!.body, "Always be polite.");
  // manifest_digest (SEC-F) is computed at pack time and must self-verify.
  assert.ok(unpacked.manifest.manifest_digest);
});

test("PROTO-7: a well-formed package validates clean against the JSON Schemas", () => {
  const pkg = minimalPackage();
  pkg.knowledge = [
    { kind: "knowledge", id: "k1", type: "rule", title: "Rule", body: "Be polite.", fidelity: "exact" },
  ];
  const validation = validatePackageBytes(packSkill(pkg));
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));
  assert.ok(!validation.issues.some((i) => i.code.startsWith("schema_")));
});

test("PROTO-7: schema-check catches a wrong field type the hand-written checks alone don't", () => {
  const pkg = minimalPackage();
  // A number where the schema (and the real type) require a string. None of
  // validateManifestShape's hand-written checks type-check `version` at
  // all — they only check truthiness — so before PROTO-7 this passed
  // silently.
  (pkg.manifest as unknown as Record<string, unknown>).version = 42;
  const validation = validatePackageBytes(packSkill(pkg));
  assert.equal(validation.ok, false);
  assert.ok(
    validation.issues.some((i) => i.code === "schema_manifest" && i.message.includes("version")),
    JSON.stringify(validation.issues),
  );
});

test("PROTO-7: schema-check catches a knowledge item missing a required field", () => {
  const pkg = minimalPackage();
  pkg.knowledge = [
    // Missing `fidelity`, required by knowledge-item.schema.json.
    { kind: "knowledge", id: "k1", type: "rule", title: "Rule", body: "x" } as never,
  ];
  const validation = validatePackageBytes(packSkill(pkg));
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((i) => i.code === "schema_knowledge_item"));
});

function validContract(): SkillContract {
  return {
    kind: "skill_contract",
    contract_version: "0.5",
    skill_kind: "knowledge",
    title: "Unit test contract",
    intent: "A minimal complete contract for mint/verify unit coverage.",
    sensitivity: "private",
    triggers: { status: "specified", items: [{ id: "t1", description: "Always." }] },
    inputs: { status: "none", reason: "None." },
    preconditions: { status: "none", reason: "None." },
    steps: {
      status: "specified",
      items: [
        { id: "s1", title: "Say hi", kind: "instruct", instruction: "Say hi." },
        { id: "s2", title: "Emit", kind: "emit", output: "result", from: "s1" },
      ],
    },
    branches: { status: "none", reason: "None." },
    human_decisions: { status: "none", reason: "None." },
    capabilities: { status: "none", reason: "None." },
    permissions: { status: "none", reason: "None." },
    forbidden_actions: { status: "none", reason: "None." },
    outputs: {
      status: "specified",
      items: [{ name: "result", description: "Greeting", schema: { type: "string" }, required: true }],
    },
    recovery: { status: "not_applicable", reason: "No side effects." },
    verification: {
      status: "specified",
      items: [{ id: "v1", assertion: "A greeting was produced.", check: "human", required: true }],
    },
    corrections: { status: "none", reason: "None." },
    provenance: {
      evidence: { status: "none", reason: "None." },
      limitations: { status: "none", reason: "None." },
      human_review: {
        status: "reviewed",
        actor: "unit-test",
        at: "2026-07-13T00:00:00.000Z",
        scope: ["complete contract"],
      },
    },
  };
}

test("mint/verify: a package minted with the public dev key verifies as development, never higher", () => {
  const contract = validContract();
  const source: SkillSource = {
    kind: "skill_source",
    id: "src_unit",
    hash: "sha256:" + "b".repeat(64),
    title: contract.title,
    contract,
    sections: [],
    steering: [],
    prompts: [],
    code_refs: [],
    parents: [],
    agent: { host: "cursor" },
    journey: { summary: "Unit test fixture.", redacted: true, sensitivity: "private" },
    inputs_declared: "none",
    sensitivity: "private",
    created_at: "2026-07-13T00:00:00.000Z",
    actor: { id: "test-agent" },
    source_protocol_version: PROTOCOL_VERSION,
  };
  const compiled = compileSkillSource(source, {
    profile: "release",
    approve_inferred_inputs: true,
    approve_permissions: true,
  });
  const approved = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  approved.files.manifest.needs_human_review = false;

  const sealed = mintSkillPackage(approved.files, { host: "cursor" });
  assert.equal(sealed.files.manifest.mint?.mint_status, "minted");
  assert.equal(sealed.attestation.issuer_class, "public_dev_hmac");

  const trust = verifyMintTrust(sealed.packageBytes, "minted", {
    allow_development_issuer: true,
    allow_self_reported: true,
  });
  assert.equal(trust.ok, true, JSON.stringify(trust.issues));
  assert.equal(trust.trust_state, "development");

  // Without explicit opt-in, the public dev key must never pass as trusted.
  const strict = verifyMintTrust(sealed.packageBytes, "minted");
  assert.equal(strict.ok, false);
});
