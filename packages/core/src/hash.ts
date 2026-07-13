import { createHash } from "node:crypto";
import type { SealedManifestClaims, SkillManifest } from "@dot-skill/protocol";

/** RFC 8785-inspired JSON Canonicalization for I-JSON-compatible objects. */
export function canonicalize(value: unknown): string {
  return serialize(value);
}

function serialize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("JCS forbids non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => serialize(v)).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const parts: string[] = [];
    for (const key of keys) {
      const v = obj[key];
      if (v === undefined) continue;
      parts.push(`${JSON.stringify(key)}:${serialize(v)}`);
    }
    return `{${parts.join(",")}}`;
  }
  throw new Error(`Unsupported JSON value type: ${typeof value}`);
}

export function sha256Hex(data: string | Uint8Array): string {
  const hash = createHash("sha256");
  hash.update(typeof data === "string" ? Buffer.from(data, "utf8") : data);
  return hash.digest("hex");
}

export function sha256Digest(data: string | Uint8Array): string {
  return `sha256:${sha256Hex(data)}`;
}

export function packageDigestFromContent(
  content: Array<{ path: string; digest: string }>,
): string {
  const paths: Record<string, string> = {};
  for (const entry of [...content].sort((a, b) => a.path.localeCompare(b.path))) {
    if (entry.path.startsWith("signatures/")) continue;
    paths[entry.path] = entry.digest;
  }
  return sha256Digest(canonicalize({ paths }));
}

/** Public development HMAC key — forgeable; never production trust. */
export const PUBLIC_DEV_MINT_KEY = "dot-skill-dev-mint-key";
export const PUBLIC_DEV_MINT_KEY_ID = "dot-skill-dev-mint-key";

/**
 * Build the claim set covered by the creation seal.
 * Binds identity, intent, permissions, policy, capabilities, inputs, and content digests.
 */
export function buildSealedManifestClaims(manifest: SkillManifest): SealedManifestClaims {
  const claims: SealedManifestClaims = {
    id: manifest.id,
    version: manifest.version,
    title: manifest.title,
    intent: manifest.intent,
    description: manifest.description,
    package_digest: manifest.package_digest,
    permissions: [...manifest.permissions]
      .map((p) => ({
        side_effect_class: p.side_effect_class,
        description: p.description,
        paths: p.paths,
        hosts: p.hosts,
        requires_consent: p.requires_consent,
      }))
      .sort((a, b) =>
        `${a.side_effect_class}:${a.description}`.localeCompare(
          `${b.side_effect_class}:${b.description}`,
        ),
      ),
    policy: {
      require_signatures: manifest.policy.require_signatures,
      require_minted: manifest.policy.require_minted,
      require_anchor: manifest.policy.require_anchor,
      allow_network: manifest.policy.allow_network,
      filesystem_roots: manifest.policy.filesystem_roots
        ? [...manifest.policy.filesystem_roots].sort()
        : undefined,
      consent_for: [...manifest.policy.consent_for].sort() as typeof manifest.policy.consent_for,
      trust_profile: manifest.policy.trust_profile,
      max_tool_calls: manifest.policy.max_tool_calls,
      max_runtime_ms: manifest.policy.max_runtime_ms,
      fail_on_unsupported_step: manifest.policy.fail_on_unsupported_step,
    },
    capabilities: [...manifest.capabilities]
      .map((c) => ({
        name: c.name,
        side_effect_class: c.side_effect_class,
        required: c.required,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    inputs: [...manifest.inputs]
      .map((i) => ({
        name: i.name,
        sensitivity: i.sensitivity,
        required: i.required,
        source: i.source,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    content: [...manifest.content]
      .map((c) => ({ path: c.path, digest: c.digest, media_type: c.media_type, bytes: c.bytes }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
  if (manifest.contract) {
    claims.contract = {
      title: manifest.contract.title,
      intent: manifest.contract.intent,
      skill_kind: manifest.contract.skill_kind,
      sensitivity: manifest.contract.sensitivity,
    };
  }
  return claims;
}

export function sealedManifestDigest(manifest: SkillManifest): string {
  return sha256Digest(canonicalize(buildSealedManifestClaims(manifest)));
}
