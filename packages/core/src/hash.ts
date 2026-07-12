import { createHash } from "node:crypto";

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
