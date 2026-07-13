/**
 * PROTO-5: structured permission grammar.
 *
 * permissions.hosts and permissions.paths used to be bare strings matched
 * ad hoc by the runtime — the root cause of SEC-A (substring/prefix host
 * bypass) and SEC-B (path traversal past a filesystem root). The runtime
 * matching logic (assertCapabilityAllowed in @skillerr/runtime) was fixed
 * directly for those; this is the complementary half: a validated grammar
 * so a malformed or dangerous-looking declaration is rejected at
 * authoring/validate time, and no runtime has to re-derive "is this
 * pattern well-formed" matching logic independently and risk getting it
 * wrong differently.
 */

const HOSTNAME_LABEL = "[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?";
const HOSTNAME_RE = new RegExp(`^${HOSTNAME_LABEL}(\\.${HOSTNAME_LABEL})*$`);

/**
 * A whole-string `{{input_name}}` placeholder — the same convention
 * compile.ts's PLACEHOLDER_RE uses to detect input references in section
 * bodies, applied here to permission hosts/paths (see the gold
 * "npm-monorepo-publishing" example: `paths: ["{{workspace_root}}"]`,
 * where `workspace_root` is a declared input). Only a *whole* pattern may
 * be a placeholder — "{{workspace_root}}/sub" is not supported, since
 * that would require partially resolving the string before re-validating
 * the remainder, which is unnecessary complexity beyond what the one real
 * example needs.
 *
 * KNOWN GAP: @skillerr/runtime's assertCapabilityAllowed does not yet
 * resolve these against the declared input's runtime value before
 * matching — a permission written this way cannot currently match
 * anything. Grammar-valid, not yet functional. Tracked in ROADMAP.md.
 */
const PLACEHOLDER_RE = /^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/;

/**
 * Valid forms:
 *   - Exact hostname: "example.com", "api.example.com", "localhost"
 *   - Suffix wildcard: "*.example.com" — "*" only ever as a whole leading
 *     label, matching any (one or more label) subdomain. Never a bare "*",
 *     never embedded mid-label ("ex*.com" is invalid).
 *   - A whole `{{input_name}}` placeholder — see above.
 * Invalid: full URLs (scheme/path/query), ports, IPs with CIDR, embedded
 * wildcards, empty strings — matching @skillerr/runtime's hostMatchesAllowlist,
 * which only ever treats a pattern as exact-hostname or "*."-suffix.
 */
export function isValidHostPattern(pattern: unknown): boolean {
  if (typeof pattern !== "string" || pattern.length === 0) return false;
  if (PLACEHOLDER_RE.test(pattern)) return true;
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(2);
    return suffix.length > 0 && HOSTNAME_RE.test(suffix);
  }
  if (pattern.includes("*")) return false;
  return HOSTNAME_RE.test(pattern);
}

/**
 * Valid forms: an absolute, forward-slash path with normalized segments —
 * "/data", "/data/", "/home/user/project" — or a whole `{{input_name}}`
 * placeholder (see above). No backslashes, no "." or ".." segments, no
 * empty segments (double slashes), no null bytes, not relative. Declaring
 * a path grants everything rooted under it (matching @skillerr/runtime's
 * isPathWithinRoot prefix semantics) — there is no separate "*"/"**" glob
 * syntax because the runtime doesn't implement one; documenting a syntax
 * the matcher doesn't honor would be its own silent gap.
 */
export function isValidPathPattern(pattern: unknown): boolean {
  if (typeof pattern !== "string" || pattern.length === 0) return false;
  if (PLACEHOLDER_RE.test(pattern)) return true;
  if (pattern.includes("\\")) return false;
  if (pattern.includes("\0")) return false;
  if (!pattern.startsWith("/")) return false;
  if (pattern === "/") return true;
  const segments = pattern.split("/").slice(1);
  if (segments[segments.length - 1] === "") segments.pop(); // trailing "/"
  if (segments.length === 0) return false;
  return segments.every((seg) => seg !== "" && seg !== "." && seg !== "..");
}
