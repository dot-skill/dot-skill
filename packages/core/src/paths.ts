/** Every path-safety refusal gets a distinct, machine-readable code (SEC-L adversarial corpus). */
export class UnsafePathError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "UnsafePathError";
    this.code = code;
  }
}

export function normalizePath(path: string): string {
  const nfc = path.normalize("NFC").replace(/\\/g, "/");
  if (nfc.includes("\0")) {
    throw new UnsafePathError("null_byte", `Unsafe path (null_byte): ${path}`);
  }
  if (nfc === "") {
    throw new UnsafePathError("empty_path", `Unsafe path (empty_path): ${path}`);
  }
  // Backslashes are converted to "/" above, so a Windows absolute path like
  // "C:\evil.txt" arrives as "C:/evil.txt" — no leading "/" and no "..", so
  // a leading-slash-only check would let it through. UNC paths
  // ("\\host\share" -> "//host/share") already start with "/" and are
  // caught by the absolute_path check below.
  if (/^[A-Za-z]:/.test(nfc)) {
    throw new UnsafePathError(
      "windows_absolute_path",
      `Unsafe path (windows_absolute_path): ${path}`,
    );
  }
  if (nfc.startsWith("/")) {
    throw new UnsafePathError("absolute_path", `Unsafe path (absolute_path): ${path}`);
  }
  if (nfc.includes("..")) {
    throw new UnsafePathError("path_traversal", `Unsafe path (path_traversal): ${path}`);
  }
  if (nfc.split("/").some((s) => s === "" || s === ".")) {
    throw new UnsafePathError("invalid_segment", `Unsafe path (invalid_segment): ${path}`);
  }
  return nfc;
}

export function assertSafePaths(paths: string[]): void {
  const seen = new Set<string>();
  for (const p of paths) {
    const n = normalizePath(p);
    if (seen.has(n)) {
      throw new UnsafePathError("duplicate_path", `Duplicate path: ${n}`);
    }
    seen.add(n);
  }
}

export const MAX_ENTRIES = 10_000;
export const MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
export const MAX_COMPRESSION_RATIO = 100;
