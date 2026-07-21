/**
 * Tests for the WRITE side of the continuity surface (capture.ts). These
 * build a REAL throwaway git repo (staged + unstaged changes + commits +
 * untracked files) and run the real captureSession against it — no mocks,
 * no fabricated working set — then round-trip capture -> seal ->
 * openContinuity -> renderResumeContract to prove the briefing carries
 * actual substance (the exact prod bug this fixes: a capture that came
 * back hollow). See docs/rfcs/0009-resume-contract.md.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { captureSession } from "./capture.js";
import { seal } from "./trust-spine.js";
import { openContinuity, resumePreview, renderResumeContract } from "./continuity.js";

function git(args: string[], cwd: string): void {
  execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "Test", GIT_AUTHOR_EMAIL: "t@e.st", GIT_COMMITTER_NAME: "Test", GIT_COMMITTER_EMAIL: "t@e.st" },
  });
}

/** A repo with two commits, one staged change, one unstaged change, one untracked file. */
function makeDirtyRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "skillerr-capture-"));
  git(["init", "-b", "main"], dir);
  writeFileSync(join(dir, "app.js"), "export const version = 1;\n");
  git(["add", "."], dir);
  git(["commit", "-m", "initial commit"], dir);
  writeFileSync(join(dir, "app.js"), "export const version = 2;\nexport const name = 'app';\n");
  git(["add", "app.js"], dir);
  git(["commit", "-m", "bump version"], dir);
  // staged change
  writeFileSync(join(dir, "feature.js"), "export function newFeature() { return 42; }\n");
  git(["add", "feature.js"], dir);
  // unstaged change on a tracked file
  writeFileSync(join(dir, "app.js"), "export const version = 3;\nexport const name = 'app';\n");
  // untracked file
  writeFileSync(join(dir, "notes.txt"), "scratch notes\n");
  return dir;
}

test("captureSession: a dirty git repo produces a substantive working set — never empty", async () => {
  const dir = makeDirtyRepo();
  try {
    const result = await captureSession({ cwd: dir, intent: "Add a new feature" });
    assert.equal(result.hasGit, true);
    const ws = result.workingSet!;
    assert.equal(ws.branch, "main");
    assert.equal(ws.dirty, true);
    assert.ok(ws.headSha, "HEAD sha captured");
    // feature.js (staged, added) + app.js (unstaged, modified) both show up.
    const paths = ws.files.map((f) => f.path).sort();
    assert.deepEqual(paths, ["app.js", "feature.js"]);
    const feature = ws.files.find((f) => f.path === "feature.js")!;
    assert.equal(feature.status, "added");
    assert.ok(feature.additions! >= 1, "per-file line counts captured");
    assert.ok(ws.diff && ws.diff.includes("newFeature"), "the actual diff content is captured");
    assert.ok(ws.untracked.includes("notes.txt"), "untracked files listed");
    assert.equal(ws.commits.length, 2, "recent commits captured");
    assert.ok(ws.commits.some((c) => c.subject === "bump version"));
    assert.match(result.journey.summary, /Work in progress on branch `main`/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("captureSession: a clean repo is honest about it, never fabricates a change", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skillerr-capture-clean-"));
  try {
    git(["init", "-b", "main"], dir);
    writeFileSync(join(dir, "a.txt"), "hello\n");
    git(["add", "."], dir);
    git(["commit", "-m", "only commit"], dir);
    const result = await captureSession({ cwd: dir });
    assert.equal(result.hasGit, true);
    assert.equal(result.workingSet!.dirty, false);
    assert.deepEqual(result.workingSet!.files, []);
    assert.match(result.journey.summary, /Clean working tree/);
    assert.equal(result.workingSet!.diff, undefined, "no diff on a clean tree");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("captureSession: outside a git repo, hasGit is false and it says so honestly", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skillerr-capture-nogit-"));
  try {
    const result = await captureSession({ cwd: dir, intent: "no repo here" });
    assert.equal(result.hasGit, false);
    assert.equal(result.workingSet, undefined);
    assert.match(result.journey.summary, /outside a git repository/);
    assert.equal(result.pkg.manifest.compile_profile, "continuity");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("captureSession: agent context merges OVER the environment capture, carrying both", async () => {
  const dir = makeDirtyRepo();
  try {
    const context = {
      intent: "Ship the feature end to end",
      agent: { host: "cursor", provider: "anthropic", model: "claude-sonnet-5" },
      plan: [
        { status: "done" as const, text: "wrote newFeature()" },
        { status: "in_progress" as const, text: "add tests" },
      ],
      nextSteps: ["run the suite", "open a PR"],
      rejectedPaths: ["tried a global singleton, abandoned it for a factory"],
      openThreads: ["should newFeature take an arg?"],
      decisions: ["factory over singleton"],
      knowledge: [{ title: "Factory pattern", body: "Chose a factory for testability." }],
      filePointers: [{ path: "feature.js", note: "the new feature" }],
      toolResults: [{ tool: "test", summary: "3 passing" }],
    };
    const result = await captureSession({ cwd: dir, context });
    // Environment capture still present:
    assert.ok(result.workingSet!.diff!.includes("newFeature"));
    assert.equal(result.workingSet!.files.length, 2);
    // Agent context merged in:
    assert.equal(result.pkg.manifest.intent, "Ship the feature end to end");
    assert.deepEqual(result.source.agent, { host: "cursor", provider: "anthropic", model: "claude-sonnet-5" });
    assert.equal(result.source.plan!.length, 2);
    assert.deepEqual(result.source.nextSteps, ["run the suite", "open a PR"]);
    assert.ok(result.source.rejectedPaths!.some((r) => /factory/.test(r)));
    assert.ok(result.journey.open_questions.includes("should newFeature take an arg?"));
    assert.ok(result.journey.decisions.includes("factory over singleton"));
    assert.equal(result.pkg.knowledge.length, 1);
    assert.equal(result.pkg.knowledge[0]!.title, "Factory pattern");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("captureSession: reads agent context from .skillerr/context.json when no explicit context is passed", async () => {
  const dir = makeDirtyRepo();
  try {
    mkdirSync(join(dir, ".skillerr"));
    writeFileSync(join(dir, ".skillerr", "context.json"), JSON.stringify({ intent: "from the well-known file", nextSteps: ["step one"] }));
    const result = await captureSession({ cwd: dir });
    assert.equal(result.pkg.manifest.intent, "from the well-known file");
    assert.deepEqual(result.source.nextSteps, ["step one"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("captureSession: redaction scrubs secrets from the diff but keeps the diff, file list, and journey (Section 5)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skillerr-capture-secret-"));
  try {
    git(["init", "-b", "main"], dir);
    writeFileSync(join(dir, "config.js"), "export const config = {};\n");
    git(["add", "."], dir);
    git(["commit", "-m", "init"], dir);
    // Real code change that ALSO contains a real-format secret.
    writeFileSync(
      join(dir, "config.js"),
      "export const config = {\n  apiKey: 'sk-abcdefghijklmnopqrstuvwx',\n  retries: 3,\n};\n",
    );
    const result = await captureSession({ cwd: dir });
    const diff = result.workingSet!.diff!;
    assert.ok(!diff.includes("sk-abcdefghijklmnopqrstuvwx"), "the secret must be scrubbed out of the diff");
    assert.ok(diff.includes("{{redacted:openai_key"), "scrubbed with a stable placeholder");
    assert.ok(diff.includes("retries: 3"), "the real, non-secret code change is preserved");
    assert.ok(result.workingSet!.files.some((f) => f.path === "config.js"), "the file list is preserved");
    assert.ok(result.redaction.summary.high_confidence >= 1, "the redaction report records the scrub");
    // The secret must not leak anywhere in the sealed package's provenance either.
    assert.ok(!JSON.stringify(result.pkg).includes("sk-abcdefghijklmnopqrstuvwx"), "secret never appears anywhere in the package");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("round trip: capture -> seal -> openContinuity -> renderResumeContract carries real substance, no preview/pending framing", async () => {
  const dir = makeDirtyRepo();
  try {
    const result = await captureSession({
      cwd: dir,
      intent: "Add newFeature",
      context: { nextSteps: ["write tests", "open PR"], decisions: ["factory over singleton"] },
    });
    const sealed = await seal(result.pkg);
    const opened = await openContinuity(sealed.zip);
    assert.equal(opened.profile, "continuity");
    assert.equal(opened.workingSet!.files.length, 2, "working set survives the seal/open round trip");
    assert.ok(opened.workingSet!.diff!.includes("newFeature"));

    const briefing = renderResumeContract(resumePreview(opened));
    // Substance:
    assert.match(briefing, /## Working set/);
    assert.match(briefing, /feature\.js/);
    assert.match(briefing, /## Next steps/);
    assert.match(briefing, /write tests/);
    assert.match(briefing, /## Decisions/);
    assert.match(briefing, /factory over singleton/);
    // No hollow-preview framing (the exact symptom being fixed): the
    // renderer must never emit these as its own status text.
    assert.doesNotMatch(briefing, /Resume Contract pending/i);
    assert.doesNotMatch(briefing, /_preview_/i);
    assert.doesNotMatch(briefing, /preview \(/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
