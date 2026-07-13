import type {
  AssertionResult,
  BenchmarkReport,
  EvalCase,
  EvalCaseResult,
  VerificationAssertion,
} from "@skillerr/protocol";

/**
 * PHASE 2: native eval/benchmark loop.
 *
 * There is no assertion query language in this protocol yet (tracked in
 * docs/ROADMAP.md as "Stronger verify assertion language"). Rather than
 * fake natural-language grading, this grades only the narrow, honestly
 * machine-checkable subset — an assertion string prefixed with a
 * recognized directive (`contains:`, `not_contains:`, `regex:`) against a
 * supplied response. Everything else is `pending_human`: a real, common,
 * non-error status, not a failure to grade. A caller (agent or human) can
 * supply final verdicts for those via `--grade` — see cli.ts's `eval` case.
 */

const DIRECTIVE_RE = /^\s*(contains|not_contains|regex)\s*:\s*(.+)$/is;

function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export interface GradeOverride {
  status: AssertionResult["status"];
  detail?: string;
}

/**
 * Grade one assertion against an optional response string and an optional
 * externally-supplied override (e.g. a human's or agent's own verdict).
 * An override always wins — it's the caller stating a fact this function
 * has no way to check itself.
 */
export function gradeAssertion(
  assertion: VerificationAssertion,
  response: string | undefined,
  override?: GradeOverride,
): AssertionResult {
  if (override) {
    return {
      id: assertion.id,
      assertion: assertion.assertion,
      check: assertion.check,
      status: override.status,
      detail: override.detail,
    };
  }

  const directiveMatch = assertion.assertion.match(DIRECTIVE_RE);
  if (assertion.check === "runtime" && directiveMatch) {
    const [, kind, arg] = directiveMatch;
    if (response === undefined) {
      return {
        id: assertion.id,
        assertion: assertion.assertion,
        check: assertion.check,
        status: "pending_human",
        detail: "No response supplied for this case — nothing to grade against.",
      };
    }
    if (kind === "contains" || kind === "not_contains") {
      const needle = stripQuotes(arg!);
      const found = response.includes(needle);
      const pass = kind === "contains" ? found : !found;
      return {
        id: assertion.id,
        assertion: assertion.assertion,
        check: assertion.check,
        status: pass ? "pass" : "fail",
        detail: pass
          ? undefined
          : `Expected response ${kind === "contains" ? "to contain" : "not to contain"} ${JSON.stringify(needle)}.`,
      };
    }
    if (kind === "regex") {
      try {
        const re = new RegExp(stripQuotes(arg!));
        const pass = re.test(response);
        return {
          id: assertion.id,
          assertion: assertion.assertion,
          check: assertion.check,
          status: pass ? "pass" : "fail",
          detail: pass ? undefined : `Response did not match /${re.source}/.`,
        };
      } catch (e) {
        return {
          id: assertion.id,
          assertion: assertion.assertion,
          check: assertion.check,
          status: "pending_human",
          detail: `Invalid regex directive (${e instanceof Error ? e.message : String(e)}) — review manually.`,
        };
      }
    }
  }

  return {
    id: assertion.id,
    assertion: assertion.assertion,
    check: assertion.check,
    status: "pending_human",
    detail:
      assertion.check === "runtime"
        ? "Marked check=runtime but has no contains:/not_contains:/regex: directive — grade manually or add one."
        : `check=${assertion.check} — requires a ${assertion.check === "human" ? "human" : "capability"} verdict.`,
  };
}

export interface RunEvalCaseOptions {
  response?: string;
  executable: boolean;
  duration_ms: number;
  total_tokens?: number;
  overrides?: Record<string, GradeOverride>;
}

export function runEvalCase(evalCase: EvalCase, opts: RunEvalCaseOptions): EvalCaseResult {
  const assertions = evalCase.assertions.map((a) =>
    gradeAssertion(a, opts.response, opts.overrides?.[a.id]),
  );
  return {
    id: evalCase.id,
    prompt: evalCase.prompt,
    executable: opts.executable,
    duration_ms: opts.duration_ms,
    total_tokens: opts.total_tokens,
    assertions,
  };
}

export function buildBenchmarkReport(
  skillId: string,
  host: string,
  cases: EvalCaseResult[],
  createdAt: string = new Date().toISOString(),
): BenchmarkReport {
  const allAssertions = cases.flatMap((c) => c.assertions);
  return {
    kind: "benchmark_report",
    skill_id: skillId,
    host,
    created_at: createdAt,
    cases,
    summary: {
      total_cases: cases.length,
      total_assertions: allAssertions.length,
      pass: allAssertions.filter((a) => a.status === "pass").length,
      fail: allAssertions.filter((a) => a.status === "fail").length,
      partial: allAssertions.filter((a) => a.status === "partial").length,
      pending_human: allAssertions.filter((a) => a.status === "pending_human").length,
    },
  };
}
