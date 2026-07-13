// Backslashes are converted to "/" before this runs, so a Windows absolute
// path like "C:\evil.txt" arrives as "C:/evil.txt" — it has no leading "/"
// and no "..", so the original two checks let it through. Reject drive
// letters (C:) and UNC-style double-backslash roots explicitly; "//host/share"
// already starts with "/" and is caught by the leading-slash rule.
const UNSAFE = /(^\/)|(\.\.)|(^$)|(^[A-Za-z]:)/;

export function normalizePath(path: string): string {
  const nfc = path.normalize("NFC").replace(/\\/g, "/");
  if (nfc.includes("\0")) throw new Error(`Null byte in path: ${path}`);
  if (UNSAFE.test(nfc) || nfc.split("/").some((s) => s === "" || s === "." || s === "..")) {
    throw new Error(`Unsafe path: ${path}`);
  }
  return nfc;
}

export function assertSafePaths(paths: string[]): void {
  const seen = new Set<string>();
  for (const p of paths) {
    const n = normalizePath(p);
    if (seen.has(n)) throw new Error(`Duplicate path: ${n}`);
    seen.add(n);
  }
}

export const MAX_ENTRIES = 10_000;
export const MAX_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
export const MAX_COMPRESSION_RATIO = 100;
