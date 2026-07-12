import type {
  CreationAttestation,
  PermanenceAnchor,
  SkillPackageFiles,
  TrustProfile,
} from "@dot-skill/protocol";
import { isValidAgentHost } from "@dot-skill/protocol";
import { canonicalize, sha256Digest } from "./hash.js";
import { packSkill, unpackSkill } from "./pack.js";
import { validatePackageBytes, type ValidationIssue } from "./validate.js";

export interface MintOptions {
  host: string;
  provider?: string;
  agent_runtime?: string;
  agent_version?: string;
  key_id?: string;
  model?: string;
  deployment?: "local" | "hosted" | "hybrid" | "unknown";
  endpoint?: string;
  actors?: string[];
  /**
   * HMAC-style digest seal for development/testing only.
   * REFERENCE IMPLEMENTATION ONLY — not production PKI.
   * Default key is `dot-skill-dev-mint-key` and must be replaced in production.
   */
  issuer_secret?: string;
  policy_profile?: TrustProfile;
}

/**
 * Seal a draft package as minted.
 * Content under signatures/ may change; package_digest (content) stays fixed after finalize.
 */
export function mintSkillPackage(
  pkg: SkillPackageFiles,
  opts: MintOptions,
): { files: SkillPackageFiles; packageBytes: Uint8Array; attestation: CreationAttestation } {
  if (!isValidAgentHost(opts.host)) {
    throw new Error(
      `Mint host "${opts.host}" is not a valid AI agent host. Use cursor, ollama, lmstudio, llama-cpp, custom-agent, …`,
    );
  }
  if (pkg.manifest.needs_human_review) {
    throw new Error("Cannot mint while needs_human_review is true — approve inputs/permissions first");
  }
  if (pkg.manifest.compile_profile !== "release") {
    throw new Error(
      "Cannot mint: compile_profile must be release. Complete the journey and release compile first.",
    );
  }
  if (!pkg.manifest.completeness?.complete) {
    throw new Error(
      `Cannot mint incomplete skill. Missing: ${pkg.manifest.completeness?.missing.join(", ") || "completeness report"}`,
    );
  }
  const report = pkg.provenance?.compilation_report;
  if (
    !report ||
    report.profile !== "release" ||
    !report.completeness.complete ||
    !report.approved ||
    report.pending_approvals.length > 0
  ) {
    throw new Error("Cannot mint: approved release compilation report required");
  }
  const pending = pkg.manifest.inputs.filter((i) => i.required && i.approved !== true);
  if (pending.length) {
    throw new Error(
      `Cannot mint with unapproved inputs: ${pending.map((p) => p.name).join(", ")}`,
    );
  }

  const draftBytes = packSkill({
    ...pkg,
    signatures: undefined,
    attestation: undefined,
    anchors: pkg.anchors ?? pkg.manifest.anchors,
  });
  const unpacked = unpackSkill(draftBytes);
  const package_digest = unpacked.manifest.package_digest;

  const attestation: CreationAttestation = {
    kind: "creation_attestation",
    package_digest,
    skill_id: pkg.manifest.id,
    skill_version: pkg.manifest.version,
    minted_at: new Date().toISOString(),
    agent: {
      runtime: opts.agent_runtime ?? "@dot-skill/runtime",
      version: opts.agent_version ?? "0.4.0",
      key_id: opts.key_id ?? "dot-skill-dev-mint-key",
    },
    host: opts.host,
    provider: opts.provider,
    model: opts.model,
    deployment: opts.deployment,
    endpoint: opts.endpoint,
    journey: {
      source_id: pkg.provenance?.compilation_report?.source_id,
      source_hash:
        pkg.provenance?.proof &&
        typeof pkg.provenance.proof === "object" &&
        pkg.provenance.proof !== null &&
        "source_hash" in pkg.provenance.proof
          ? String((pkg.provenance.proof as { source_hash: string }).source_hash)
          : undefined,
      recipe_id: pkg.provenance?.compilation_report?.recipe_id,
      recipe_hash:
        pkg.provenance?.recipe &&
        typeof pkg.provenance.recipe === "object" &&
        pkg.provenance.recipe !== null &&
        "hash" in pkg.provenance.recipe
          ? String((pkg.provenance.recipe as { hash: string }).hash)
          : undefined,
      proof_digest: pkg.provenance?.proof
        ? sha256Digest(canonicalize(pkg.provenance.proof))
        : undefined,
      summary: pkg.provenance?.journey?.summary,
    },
    generation_usage: pkg.provenance?.generation_usage,
    human_approvals: {
      inputs: pkg.manifest.inputs.filter((i) => i.approved === true).map((i) => i.name),
      permissions: pkg.manifest.permissions
        .filter((p) => p.requires_consent)
        .map((p) => p.side_effect_class),
      actors: opts.actors ?? ["human"],
    },
    policy_profile: opts.policy_profile ?? "minted",
  };

  const payload = canonicalize(attestation);
  const payloadDigest = sha256Digest(payload);

  /**
   * REFERENCE IMPLEMENTATION ONLY.
   * The default key "dot-skill-dev-mint-key" is a public constant for testing.
   * Replace issuer_secret with a real private key in any production issuer.
   */
  const secret = opts.issuer_secret ?? "dot-skill-dev-mint-key";
  const sig = sha256Digest(`${secret}:${payloadDigest}`);

  const dsse = {
    payloadType: "application/vnd.dot-skill.creation-attestation+json",
    payload_digest: payloadDigest,
    signatures: [{ keyid: attestation.agent.key_id, sig }],
    attestation,
  };

  const minted: SkillPackageFiles = {
    ...unpacked.raw,
    manifest: {
      ...unpacked.manifest,
      mint: {
        mint_status: "minted",
        minted_at: attestation.minted_at,
        mint_issuer: attestation.agent.runtime,
        content_id: package_digest,
      },
      attestation_digest: payloadDigest,
      policy: {
        ...unpacked.manifest.policy,
        require_signatures: true,
        require_minted: true,
        trust_profile: opts.policy_profile ?? "minted",
      },
    },
    attestation,
    signatures: {
      "creation.dsse.json": dsse,
    },
    anchors: unpacked.raw.anchors ?? unpacked.manifest.anchors,
  };

  const packageBytes = packSkill(minted);
  const verify = unpackSkill(packageBytes);
  if (verify.manifest.package_digest !== package_digest) {
    throw new Error(
      `Mint changed content digest (${verify.manifest.package_digest} != ${package_digest})`,
    );
  }

  return { files: { ...minted, manifest: verify.manifest }, packageBytes, attestation };
}

export function addPermanenceAnchor(
  archive: Uint8Array,
  anchor: Omit<PermanenceAnchor, "package_digest"> & { package_digest?: string },
): Uint8Array {
  const unpacked = unpackSkill(archive);
  const package_digest = unpacked.manifest.package_digest;
  const full: PermanenceAnchor = {
    ...anchor,
    package_digest: anchor.package_digest ?? package_digest,
  };
  if (full.package_digest !== package_digest) {
    throw new Error("Anchor package_digest must match skill package_digest");
  }
  const anchors = [...(unpacked.manifest.anchors ?? []), full];
  const files: SkillPackageFiles = {
    ...unpacked.raw,
    manifest: {
      ...unpacked.manifest,
      anchors,
    },
    anchors,
    signatures: {
      ...(unpacked.raw.signatures ?? {}),
      [`anchors/${anchors.length}-${full.kind}.json`]: full,
    },
  };
  return packSkill(files);
}

export function verifyMintTrust(
  archive: Uint8Array,
  profile: TrustProfile = "minted",
  issuer_secret?: string,
): { ok: boolean; issues: ValidationIssue[]; attestation?: CreationAttestation } {
  const base = validatePackageBytes(archive);
  const issues = [...base.issues];
  const unpacked = unpackSkill(archive);
  const mintStatus = unpacked.manifest.mint?.mint_status ?? "draft";
  const attestation = (unpacked.raw.signatures?.["creation.dsse.json"] as
    | { attestation?: CreationAttestation; payload_digest?: string; signatures?: Array<{ sig: string }> }
    | undefined)?.attestation
    ?? unpacked.raw.attestation;
  const envelope = unpacked.raw.signatures?.["creation.dsse.json"] as
    | {
        attestation?: CreationAttestation;
        payload_digest?: string;
        signatures?: Array<{ sig: string; keyid?: string }>;
      }
    | undefined;

  if (profile !== "open") {
    if (mintStatus !== "minted") {
      issues.push({
        severity: "error",
        code: "not_minted",
        message: "Trust profile requires mint_status=minted",
      });
    }
    if (!attestation) {
      issues.push({
        severity: "error",
        code: "missing_attestation",
        message: "Minted skills require CreationAttestation",
      });
    } else if (!envelope?.signatures?.[0]?.sig) {
      issues.push({
        severity: "error",
        code: "missing_attestation_signature",
        message: "Minted trust profile requires a signed DSSE attestation envelope",
      });
    } else if (attestation.package_digest !== unpacked.manifest.package_digest) {
      issues.push({
        severity: "error",
        code: "attestation_digest_mismatch",
        message: "Attestation package_digest does not match manifest",
      });
    } else {
      const payloadDigest = sha256Digest(canonicalize(attestation));
      if (envelope.payload_digest !== payloadDigest) {
        issues.push({
          severity: "error",
          code: "attestation_payload_digest",
          message: "DSSE payload_digest does not match CreationAttestation",
        });
      }
      // REFERENCE IMPLEMENTATION ONLY — replace with real PKI in production.
      const secret = issuer_secret ?? "dot-skill-dev-mint-key";
      const expected = sha256Digest(`${secret}:${payloadDigest}`);
      const sig = envelope?.signatures?.[0]?.sig;
      if (sig !== expected) {
        issues.push({
          severity: "error",
          code: "attestation_sig_invalid",
          message: "CreationAttestation signature failed verification",
        });
      }
      if (!issuer_secret && attestation.agent.key_id === "dot-skill-dev-mint-key") {
        issues.push({
          severity: "warning",
          code: "development_attestation",
          message: "Attestation uses the public development key; provenance is self-asserted, not trusted identity",
        });
      }
    }
  }

  if (profile === "anchored") {
    const anchors = unpacked.manifest.anchors ?? [];
    if (!anchors.length) {
      issues.push({
        severity: "error",
        code: "anchor_required",
        message: "Trust profile requires at least one PermanenceAnchor",
      });
    }
  }

  if (profile.startsWith("issuer:")) {
    const want = profile.slice("issuer:".length);
    if (attestation?.agent.runtime !== want && attestation?.agent.key_id !== want) {
      issues.push({
        severity: "error",
        code: "issuer_mismatch",
        message: `Attestation issuer does not match ${profile}`,
      });
    }
  }

  return {
    ok: !issues.some((i) => i.severity === "error"),
    issues,
    attestation,
  };
}
