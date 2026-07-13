/**
 * @skillerr/registry — free append-only transparency log for `.skill` packages.
 *
 * Default log path: ~/.skillerr/registry/log.jsonl
 * Each line is a JSON object with a publish record.
 * Lookup and verify confirm a package_digest is anchored in the log.
 */

import { appendFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { PermanenceAnchor } from "@skillerr/protocol";
import { unpackSkill } from "@skillerr/core";

export interface RegistryEntry {
  kind: "registry_entry";
  digest: string;
  published_at: string;
  metadata: Record<string, unknown>;
}

export interface RegistryPublishResult {
  ok: boolean;
  entry: RegistryEntry;
  log_path: string;
}

export interface RegistryLookupResult {
  found: boolean;
  entries: RegistryEntry[];
}

export interface RegistryVerifyResult {
  ok: boolean;
  anchored: boolean;
  entries: RegistryEntry[];
  anchor?: PermanenceAnchor;
  issues: string[];
}

function defaultLogPath(): string {
  const preferred = join(homedir(), ".skillerr", "registry", "log.jsonl");
  const legacy = join(homedir(), ".dot-skill", "registry", "log.jsonl");
  if (!existsSync(preferred) && existsSync(legacy)) return legacy;
  return preferred;
}

async function ensureDir(filePath: string): Promise<void> {
  const dir = filePath.slice(0, filePath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Publish a package digest to the local transparency log.
 * Creates the log file and parent directories if they do not exist.
 */
export async function publish(
  digest: string,
  metadata: Record<string, unknown> = {},
  logPath?: string,
): Promise<RegistryPublishResult> {
  const path = logPath ?? defaultLogPath();
  await ensureDir(path);

  const entry: RegistryEntry = {
    kind: "registry_entry",
    digest,
    published_at: new Date().toISOString(),
    metadata,
  };
  await appendFile(path, JSON.stringify(entry) + "\n", "utf8");
  return { ok: true, entry, log_path: path };
}

/**
 * Look up all log entries for a given digest.
 */
export async function lookup(
  digest: string,
  logPath?: string,
): Promise<RegistryLookupResult> {
  const path = logPath ?? defaultLogPath();
  if (!existsSync(path)) {
    return { found: false, entries: [] };
  }
  const raw = await readFile(path, "utf8");
  const entries: RegistryEntry[] = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RegistryEntry)
    .filter((e) => e.digest === digest);
  return { found: entries.length > 0, entries };
}

/**
 * List all entries in the log (most recent last).
 */
export async function list(
  logPath?: string,
  limit = 50,
): Promise<RegistryEntry[]> {
  const path = logPath ?? defaultLogPath();
  if (!existsSync(path)) return [];
  const raw = await readFile(path, "utf8");
  const all: RegistryEntry[] = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RegistryEntry);
  return all.slice(-limit);
}

/**
 * Verify that a `.skill` package archive has a matching entry in the transparency log
 * and/or a PermanenceAnchor of kind "transparency_log" or "registry".
 */
export async function verify(
  archive: Uint8Array,
  logPath?: string,
): Promise<RegistryVerifyResult> {
  const issues: string[] = [];
  let unpacked;
  try {
    unpacked = unpackSkill(archive);
  } catch (e) {
    return {
      ok: false,
      anchored: false,
      entries: [],
      issues: [e instanceof Error ? e.message : String(e)],
    };
  }

  const digest = unpacked.manifest.package_digest;
  const { found, entries } = await lookup(digest, logPath);

  const anchors = unpacked.manifest.anchors ?? [];
  const registryAnchor = anchors.find(
    (a) => a.kind === "transparency_log" || a.kind === "registry",
  );

  if (!found) {
    issues.push(`Digest ${digest} not found in transparency log`);
  }
  if (!registryAnchor) {
    issues.push("No transparency_log or registry PermanenceAnchor in manifest");
  }

  return {
    ok: found && Boolean(registryAnchor),
    anchored: found || Boolean(registryAnchor),
    entries,
    anchor: registryAnchor,
    issues,
  };
}

/**
 * Build a PermanenceAnchor pointing to the local transparency log.
 * Use with addPermanenceAnchor from @skillerr/core to embed the anchor in the package.
 */
export function buildTransparencyLogAnchor(
  digest: string,
  logPath?: string,
): Omit<PermanenceAnchor, "package_digest"> {
  return {
    kind: "transparency_log",
    located_at: `file://${logPath ?? defaultLogPath()}`,
    anchored_at: new Date().toISOString(),
    issuer: "@skillerr/registry",
  };
}
