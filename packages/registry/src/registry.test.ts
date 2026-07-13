/**
 * Package-local unit tests for @skillerr/registry, run directly against
 * this package (no dependency on @skillerr/cli).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publish, lookup, list, buildTransparencyLogAnchor } from "./index.js";

function tempLogPath(): string {
  return join(tmpdir(), `skillerr-registry-unit-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`);
}

test("publish + lookup: a published digest is found; an unpublished one is not", async () => {
  const logPath = tempLogPath();
  const digest = "sha256:" + "a".repeat(64);
  const result = await publish(digest, { title: "test skill" }, logPath);
  assert.equal(result.ok, true);
  assert.equal(result.entry.digest, digest);

  const found = await lookup(digest, logPath);
  assert.equal(found.found, true);
  assert.equal(found.entries.length, 1);
  assert.equal(found.entries[0]!.metadata.title, "test skill");

  const notFound = await lookup("sha256:" + "b".repeat(64), logPath);
  assert.equal(notFound.found, false);
  assert.equal(notFound.entries.length, 0);
});

test("lookup: a log path that doesn't exist yet is treated as empty, not an error", async () => {
  const missingPath = tempLogPath();
  const result = await lookup("sha256:" + "c".repeat(64), missingPath);
  assert.equal(result.found, false);
  assert.deepEqual(result.entries, []);
});

test("list: returns entries in append order, most recent last, respecting the limit", async () => {
  const logPath = tempLogPath();
  await publish("sha256:" + "1".repeat(64), { n: 1 }, logPath);
  await publish("sha256:" + "2".repeat(64), { n: 2 }, logPath);
  await publish("sha256:" + "3".repeat(64), { n: 3 }, logPath);

  const all = await list(logPath);
  assert.equal(all.length, 3);
  assert.equal(all[all.length - 1]!.metadata.n, 3);

  const limited = await list(logPath, 2);
  assert.equal(limited.length, 2);
  assert.equal(limited[limited.length - 1]!.metadata.n, 3);
});

test("buildTransparencyLogAnchor: produces a PermanenceAnchor pointing at the log file", () => {
  const digest = "sha256:" + "d".repeat(64);
  const logPath = tempLogPath();
  const anchor = buildTransparencyLogAnchor(digest, logPath);
  assert.equal(anchor.kind, "transparency_log");
  assert.equal(anchor.located_at, `file://${logPath}`);
  assert.equal(anchor.issuer, "@skillerr/registry");
});
