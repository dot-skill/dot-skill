import assert from "node:assert/strict";
import { test } from "node:test";
import type { EvalCase, VerificationAssertion } from "@skillerr/protocol";
import { buildBenchmarkReport, gradeAssertion, runEvalCase } from "./eval.js";

function assertion(overrides: Partial<VerificationAssertion> = {}): VerificationAssertion {
  return {
    id: "v1",
    assertion: "The output is coherent.",
    check: "human",
    required: true,
    ...overrides,
  };
}

test("gradeAssertion: check=human with no override is honestly pending_human, never a fabricated pass", () => {
  const result = gradeAssertion(assertion(), "some response text");
  assert.equal(result.status, "pending_human");
});

test("gradeAssertion: contains: directive passes/fails against a supplied response", () => {
  const a = assertion({ check: "runtime", assertion: 'contains: "user-visible"' });
  assert.equal(gradeAssertion(a, "This is a user-visible change.").status, "pass");
  assert.equal(gradeAssertion(a, "This is an internal change.").status, "fail");
});

test("gradeAssertion: not_contains: directive passes/fails against a supplied response", () => {
  const a = assertion({ check: "runtime", assertion: 'not_contains: "TICKET-123"' });
  assert.equal(gradeAssertion(a, "Fixed the login bug.").status, "pass");
  assert.equal(gradeAssertion(a, "Fixed TICKET-123.").status, "fail");
});

test("gradeAssertion: regex: directive passes/fails against a supplied response", () => {
  const a = assertion({ check: "runtime", assertion: "regex: ^You can now" });
  assert.equal(gradeAssertion(a, "You can now export to CSV.").status, "pass");
  assert.equal(gradeAssertion(a, "Export to CSV is now possible.").status, "fail");
});

test("gradeAssertion: a runtime directive with no response is pending_human, never a false pass or fail", () => {
  const a = assertion({ check: "runtime", assertion: 'contains: "x"' });
  const result = gradeAssertion(a, undefined);
  assert.equal(result.status, "pending_human");
});

test("gradeAssertion: check=runtime without a recognized directive is pending_human, not silently skipped as pass", () => {
  const a = assertion({ check: "runtime", assertion: "The output looks reasonable." });
  const result = gradeAssertion(a, "anything");
  assert.equal(result.status, "pending_human");
  assert.match(result.detail ?? "", /no contains:\/not_contains:\/regex: directive/);
});

test("gradeAssertion: an invalid regex directive is pending_human, never crashes", () => {
  const a = assertion({ check: "runtime", assertion: "regex: (unclosed" });
  const result = gradeAssertion(a, "anything");
  assert.equal(result.status, "pending_human");
});

test("gradeAssertion: an explicit override always wins, since it's the caller stating a fact this function can't check itself", () => {
  const a = assertion({ check: "human" });
  const result = gradeAssertion(a, undefined, { status: "pass", detail: "Reviewed by a human." });
  assert.equal(result.status, "pass");
  assert.equal(result.detail, "Reviewed by a human.");
});

test("runEvalCase + buildBenchmarkReport: shape and summary counts are consistent", () => {
  const evalCase: EvalCase = {
    id: "e1",
    prompt: "fix(auth): handle expired token",
    assertions: [
      assertion({ id: "v1", check: "runtime", assertion: 'contains: "session"' }),
      assertion({ id: "v2", check: "human" }),
    ],
  };
  const result = runEvalCase(evalCase, {
    response: "Your session has expired — please log in again.",
    executable: true,
    duration_ms: 12,
  });
  assert.equal(result.id, "e1");
  assert.equal(result.executable, true);
  assert.equal(result.assertions[0]!.status, "pass");
  assert.equal(result.assertions[1]!.status, "pending_human");

  const report = buildBenchmarkReport("skl_test", "cursor", [result], "2026-07-13T00:00:00.000Z");
  assert.equal(report.kind, "benchmark_report");
  assert.equal(report.summary.total_cases, 1);
  assert.equal(report.summary.total_assertions, 2);
  assert.equal(report.summary.pass, 1);
  assert.equal(report.summary.pending_human, 1);
  assert.equal(report.summary.fail, 0);
});
