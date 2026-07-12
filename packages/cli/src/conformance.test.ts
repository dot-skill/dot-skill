import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  canonicalize,
  inspectSkill,
  migrateLegacySkill,
  packSkill,
  sha256Digest,
  unpackSkill,
  validatePackageBytes,
  mintSkillPackage,
  addPermanenceAnchor,
  verifyMintTrust,
  compileRecipeToSkill,
  compileSkillSource,
  approveCompilation,
  CompileRefusalError,
} from "@dot-skill/core";
import {
  DEFAULT_SKILL_POLICY,
  CONTAINER_VERSION,
  PROTOCOL_VERSION,
  WORKFLOW_DIALECT_VERSION,
  recipeToSkillSource,
  type Recipe,
  type SkillPackageFiles,
  type SkillSource,
} from "@dot-skill/protocol";
import { runSkillArchive, runSkillPackage } from "@dot-skill/runtime";
import { publish, lookup, list } from "@dot-skill/registry";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const demoRecipe = (): Recipe => ({
  kind: "recipe",
  id: "rcp_demo",
  hash: "sha256:" + "a".repeat(64),
  title: "Demo integration",
  summary: "Wire service to {{base_url}}",
  journey_summary:
    "Human and agent designed a retrying API client; secrets stay as refs.",
  ingredients: [
    {
      id: "ing_1",
      revision: 1,
      type: "integration",
      title: "Connect API",
      body: "Call the API at {{base_url}} using credential {{api_credential_ref}}",
      attachments: [],
      code_refs: [],
      sensitivity: "private",
    },
    {
      id: "ing_2",
      revision: 1,
      type: "decision",
      title: "Use retries",
      body: "Retry twice on 429",
      attachments: [],
      code_refs: [],
      sensitivity: "publishable",
    },
  ],
  steering: [
    {
      kind: "steering",
      id: "st_1",
      session_id: "ses_1",
      verb: "reject",
      target_kind: "ingredient",
      target_id: "ing_1",
      note: "Do not hardcode secrets",
      actor: { id: "you" },
      at: new Date().toISOString(),
    },
  ],
  prompts: [],
  code_refs: [],
  parents: [],
  provenance: { hosts: ["cursor"], models: ["test-model"], session_ids: ["ses_1"] },
  visibility_intent: "private",
  baked_at: new Date().toISOString(),
  baker: { id: "you" },
  source_protocol_version: "0.4.0",
  generation_usage: {
    input_tokens: 1200,
    output_tokens: 400,
    total_tokens: 1600,
    reported_by: "agent",
    captured_at: new Date().toISOString(),
    host: "cursor",
    model: "test-model",
  },
});

function packageIdentity(relativeUrl: string): { name: string; version: string } {
  return JSON.parse(readFileSync(new URL(relativeUrl, import.meta.url), "utf8")) as {
    name: string;
    version: string;
  };
}

test("CLI version comes from its package metadata", () => {
  const cli = packageIdentity("../package.json");
  const output = execFileSync(
    process.execPath,
    [fileURLToPath(new URL("./cli.js", import.meta.url)), "--version"],
    { encoding: "utf8" },
  );
  assert.equal(output, `${cli.version}\n`);
});

test("canonicalize sorts object keys", () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), '{"a":2,"b":1}');
});

test("pack/unpack/validate round-trip", () => {
  const pkg: SkillPackageFiles = {
    manifest: {
      kind: "dot-skill",
      id: "skl_test",
      version: "1.0.0",
      title: "Test skill",
      description: "A minimal skill for conformance",
      container_version: CONTAINER_VERSION,
      protocol_version: PROTOCOL_VERSION,
      entrypoint: "s1",
      inputs: [],
      outputs: [{ name: "result", schema: { type: "string" }, required: true }],
      capabilities: [],
      permissions: [],
      policy: { ...DEFAULT_SKILL_POLICY },
      content: [],
      package_digest: "sha256:" + "0".repeat(64),
      provenance_mode: "proof_only",
    },
    workflow: {
      kind: "workflow",
      dialect_version: WORKFLOW_DIALECT_VERSION,
      entrypoint: "s1",
      steps: [
        { id: "s1", kind: "instruct", text: "Do the thing", next: "s2" },
        { id: "s2", kind: "emit", output: "result", from: "s1" },
      ],
    },
    knowledge: [
      {
        kind: "knowledge",
        id: "k1",
        type: "rule",
        title: "Rule",
        body: "Always ask for {{project_name}}",
        fidelity: "exact",
        pinned: true,
      },
    ],
  };
  const bytes = packSkill(pkg);
  const validation = validatePackageBytes(bytes);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));
  const unpacked = unpackSkill(bytes);
  assert.equal(unpacked.manifest.id, "skl_test");
  assert.equal(unpacked.knowledge.length, 1);
  const inspected = inspectSkill(bytes);
  assert.equal(inspected.ok, true);
  assert.equal(inspected.summary.title, "Test skill");
});

test("rejects path traversal in package build via normalize", () => {
  assert.throws(() => {
    packSkill({
      manifest: {
        kind: "dot-skill",
        id: "x",
        version: "1.0.0",
        title: "x",
        description: "x",
        container_version: CONTAINER_VERSION,
        protocol_version: PROTOCOL_VERSION,
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
        dialect_version: WORKFLOW_DIALECT_VERSION,
        entrypoint: "s1",
        steps: [{ id: "s1", kind: "instruct", text: "x" }],
      },
      knowledge: [],
      resources: { "../evil.txt": "nope" },
    });
  });
});

test("legacy migrate marks needs_human_review", () => {
  const { packageBytes, files } = migrateLegacySkill({
    kind: "skill",
    id: "skl_legacy",
    version: "1.0.0",
    title: "Legacy",
    body: "Paste this prompt into another AI",
    sources: [],
    exported_at: new Date().toISOString(),
    source_protocol_version: "0.1.0",
  });
  assert.equal(files.manifest.legacy, true);
  assert.equal(files.manifest.needs_human_review, true);
  assert.equal(validatePackageBytes(packageBytes).ok, true);
});

test("release compile refuses without AI agent host", () => {
  const recipe = demoRecipe();
  recipe.provenance.hosts = ["cli"];
  assert.throws(() => recipeToSkillSource(recipe), /AI agent host/);
});

test("release compile refuses when incomplete (no journey)", () => {
  const recipe = demoRecipe();
  delete recipe.journey_summary;
  recipe.summary = undefined;
  // Still has title as intent fallback — force empty journey via source override
  const source = recipeToSkillSource(recipe);
  source.journey.summary = "";
  assert.throws(
    () => compileSkillSource(source, { profile: "release", approve_inferred_inputs: true }),
    (e: unknown) => e instanceof CompileRefusalError && e.missing.includes("journey"),
  );
});

test("recipe/source compile produces traceable skill and runtime dry_run", async () => {
  const recipe = demoRecipe();
  assert.throws(() =>
    compileRecipeToSkill(recipe, {
      approve_inferred_inputs: false,
      host: "cursor",
      profile: "release",
    }),
  );

  let compiled = compileRecipeToSkill(recipe, {
    approve_inferred_inputs: true,
    approve_permissions: true,
    host: "cursor",
    profile: "release",
  });
  compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  assert.equal(compiled.pending_approvals.length, 0);
  assert.equal(validatePackageBytes(compiled.packageBytes).ok, true);
  assert.ok(compiled.files.provenance?.generation_usage?.total_tokens === 1600);
  assert.equal(compiled.files.manifest.compile_profile, "release");

  const run = await runSkillPackage(
    compiled.files,
    { host: "cursor" },
    {
      mode: "dry_run",
      inputs: { base_url: "https://example.com", api_credential_ref: "secret:local" },
    },
  );
  assert.equal(run.status, "succeeded");
  assert.ok(run.steps.length > 0);
  assert.ok(run.package_digest.startsWith("sha256:"));
  assert.equal(run.runtime.name, packageIdentity("../../runtime/package.json").name);
  assert.equal(run.runtime.version, packageIdentity("../../runtime/package.json").version);
});

test("digest helper", () => {
  assert.match(sha256Digest("abc"), /^sha256:[a-f0-9]{64}$/);
});

test("mint seals package and verify-trust accepts minted profile", () => {
  const recipe = demoRecipe();
  recipe.id = "rcp_mint";
  let compiled = compileRecipeToSkill(recipe, {
    approve_inferred_inputs: true,
    approve_permissions: true,
    host: "cursor",
    profile: "release",
  });
  compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  compiled.files.manifest.needs_human_review = false;
  const before = compiled.files.manifest.package_digest;
  const { packageBytes, files, attestation } = mintSkillPackage(compiled.files, { host: "cursor" });
  assert.equal(files.manifest.mint?.mint_status, "minted");
  assert.equal(files.manifest.package_digest, before);
  assert.equal(files.manifest.mint?.content_id, before);
  assert.ok(files.attestation?.generation_usage?.total_tokens === 1600);
  assert.equal(attestation.agent.runtime, packageIdentity("../../core/package.json").name);
  assert.equal(attestation.agent.version, packageIdentity("../../core/package.json").version);
  const trust = verifyMintTrust(packageBytes, "minted");
  assert.equal(trust.ok, true, JSON.stringify(trust.issues));
  const anchored = addPermanenceAnchor(packageBytes, {
    kind: "ledger",
    located_at: "ledger:example/tx/1",
    anchored_at: new Date().toISOString(),
    issuer: "test",
  });
  assert.equal(verifyMintTrust(anchored, "anchored").ok, true);
});

test("cannot mint with reserved non-agent host", () => {
  const recipe = demoRecipe();
  let compiled = compileRecipeToSkill(recipe, {
    approve_inferred_inputs: true,
    approve_permissions: true,
    host: "cursor",
  });
  compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  compiled.files.manifest.needs_human_review = false;
  assert.throws(() => mintSkillPackage(compiled.files, { host: "cli" }), /not a valid AI/);
});

test("local Ollama agent can compile and mint offline provenance", () => {
  const recipe = demoRecipe();
  recipe.provenance.hosts = ["ollama"];
  recipe.provenance.models = ["llama3.2"];
  const source = recipeToSkillSource(recipe, {
    agent: {
      host: "ollama",
      provider: "ollama",
      deployment: "local",
      endpoint: "http://127.0.0.1:11434/v1",
    },
  });
  let compiled = compileSkillSource(source, {
    profile: "release",
    approve_inferred_inputs: true,
    approve_permissions: true,
  });
  compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  compiled.files.manifest.needs_human_review = false;
  const minted = mintSkillPackage(compiled.files, {
    host: "ollama",
    provider: "ollama",
    model: "llama3.2",
    deployment: "local",
    endpoint: "http://127.0.0.1:11434/v1",
  });
  assert.equal(minted.attestation.host, "ollama");
  assert.equal(minted.attestation.provider, "ollama");
  assert.equal(minted.attestation.deployment, "local");
  assert.equal(verifyMintTrust(minted.packageBytes, "minted").ok, true);
});

test("mint refuses a relabeled continuity draft", () => {
  const source = recipeToSkillSource(demoRecipe());
  const continuity = compileSkillSource(source, {
    profile: "continuity",
    approve_inferred_inputs: true,
    approve_permissions: true,
  });
  continuity.files.manifest.compile_profile = "release";
  continuity.files.manifest.completeness!.complete = true;
  continuity.files.manifest.needs_human_review = false;
  assert.throws(
    () => mintSkillPackage(continuity.files, { host: "ollama" }),
    /approved release compilation report required/,
  );
});

test("minted verification and runtime reject missing signature", async () => {
  let compiled = compileRecipeToSkill(demoRecipe(), {
    approve_inferred_inputs: true,
    approve_permissions: true,
    host: "cursor",
    profile: "release",
  });
  compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
  compiled.files.manifest.needs_human_review = false;
  const minted = mintSkillPackage(compiled.files, { host: "cursor" });
  const unpacked = unpackSkill(minted.packageBytes);
  unpacked.raw.signatures = {};
  unpacked.raw.attestation = minted.attestation;
  const unsigned = packSkill(unpacked.raw);
  assert.equal(verifyMintTrust(unsigned, "minted").ok, false);
  const run = await runSkillArchive(unsigned, { host: "test" }, { mode: "dry_run" });
  assert.equal(run.status, "failed");
  assert.match(run.error ?? "", /trust verification|validation failed/i);
});

test("journey and endpoint provenance are scrubbed", () => {
  const source = recipeToSkillSource(demoRecipe(), {
    agent: {
      host: "ollama",
      provider: "ollama",
      deployment: "local",
      endpoint: "http://user:sk_supersecret123@example.test/v1",
    },
    journey: {
      summary: "Used token sk_supersecret123 while testing",
    },
  });
  const compiled = compileSkillSource(source, {
    profile: "release",
    approve_inferred_inputs: true,
    approve_permissions: true,
  });
  assert.doesNotMatch(compiled.files.provenance?.journey?.summary ?? "", /supersecret/);
  assert.doesNotMatch(
    JSON.stringify(compiled.files.provenance?.source ?? {}),
    /supersecret/,
  );
});

test("registry local log publish and lookup", async () => {
  const logPath = join(tmpdir(), `dot-skill-test-${Date.now()}.jsonl`);
  const digest = "sha256:" + "c".repeat(64);
  const result = await publish(digest, { title: "test" }, logPath);
  assert.equal(result.ok, true);
  assert.equal(result.entry.digest, digest);

  const found = await lookup(digest, logPath);
  assert.equal(found.found, true);
  assert.equal(found.entries.length, 1);

  const notFound = await lookup("sha256:" + "d".repeat(64), logPath);
  assert.equal(notFound.found, false);

  const entries = await list(logPath, 10);
  assert.equal(entries.length, 1);
});

test("workspace continuity checkpoint + release compile --mint", async () => {
  const { mkdtempSync } = await import("node:fs");
  const dir = mkdtempSync(join(tmpdir(), "skill-ws-"));
  const prev = process.cwd();
  const prevHost = process.env.SKILL_HOST;
  const prevAgentRuntime = process.env.SKILL_AGENT_RUNTIME;
  const prevAgentVersion = process.env.SKILL_AGENT_VERSION;
  process.chdir(dir);
  process.env.SKILL_HOST = "cursor";
  process.env.SKILL_MODEL = "test";
  process.env.SKILL_INPUT_TOKENS = "100";
  process.env.SKILL_OUTPUT_TOKENS = "50";
  delete process.env.SKILL_AGENT_RUNTIME;
  delete process.env.SKILL_AGENT_VERSION;
  try {
    const {
      initWorkspace,
      proposeMany,
      compileWorkspace,
      checkpoint,
      status,
      setJourney,
      loadSkillHandoff,
    } = await import("@dot-skill/workspace");
    await initWorkspace(dir, { title: "WS" });
    await setJourney(dir, {
      summary: "Building auth flow with agent; tokens as secret refs only.",
      open_questions: ["Which OAuth provider?"],
    });
    await proposeMany(dir, [
      { title: "A", body: "Decision A stays fixed forever in this skill.", type: "decision" },
      {
        title: "B",
        body: "Call the service at {{base_url}} with retries.",
        type: "integration",
      },
    ]);
    const st = await status(dir);
    assert.equal(st.staged.length, 2);

    const cont = await checkpoint(dir, { message: "WIP auth" });
    assert.equal(cont.profile, "continuity");
    assert.ok(cont.package_path.endsWith(".skill"));
    const handoff = await loadSkillHandoff(cont.package_path);
    assert.ok(handoff.journey);
    assert.equal(handoff.compile_profile, "continuity");

    const result = await compileWorkspace(dir, {
      message: "WS skill",
      mint: true,
      approve: true,
      profile: "release",
    });
    assert.ok(result.package_path);
    assert.equal(result.minted, true);
    assert.ok(result.package_digest.startsWith("sha256:"));
    assert.ok(result.compile.files.provenance?.generation_usage?.total_tokens === 150);
    assert.equal(result.compile.files.attestation?.agent.runtime, packageIdentity("../../workspace/package.json").name);
    assert.equal(result.compile.files.attestation?.agent.version, packageIdentity("../../workspace/package.json").version);
  } finally {
    process.chdir(prev);
    if (prevHost === undefined) delete process.env.SKILL_HOST;
    else process.env.SKILL_HOST = prevHost;
    if (prevAgentRuntime === undefined) delete process.env.SKILL_AGENT_RUNTIME;
    else process.env.SKILL_AGENT_RUNTIME = prevAgentRuntime;
    if (prevAgentVersion === undefined) delete process.env.SKILL_AGENT_VERSION;
    else process.env.SKILL_AGENT_VERSION = prevAgentVersion;
  }
});

test("propose without agent provenance is rejected", async () => {
  const { mkdtempSync } = await import("node:fs");
  const dir = mkdtempSync(join(tmpdir(), "skill-ws-human-"));
  const prevHost = process.env.SKILL_HOST;
  delete process.env.SKILL_HOST;
  try {
    const { initWorkspace, proposeSection } = await import("@dot-skill/workspace");
    await initWorkspace(dir, { title: "Nope" });
    await assert.rejects(
      () => proposeSection(dir, { title: "x", body: "y" }),
      /AI agent provenance required/,
    );
  } finally {
    if (prevHost === undefined) delete process.env.SKILL_HOST;
    else process.env.SKILL_HOST = prevHost;
  }
});
