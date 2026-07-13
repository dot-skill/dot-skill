# Eval / benchmark loop (Phase 2)

A `.skill` can be *run and measured*, not just structurally validated.
This is the native counterpart to `skill-creator`'s test-prompt-and-grade
loop — same idea, sealed into the package instead of living only in a
local workspace.

## `contract.evals`

An optional array on `SkillContract` (unlike every other contract field,
it's not an `ExplicitDeclaration` requiring an explicit none/not_applicable
— most skills simply won't have it authored yet, and neither
`assessSkillContract` nor a release compile require it):

```json
{
  "evals": [
    {
      "id": "e1",
      "prompt": "fix(auth): handle expired refresh token by forcing re-login",
      "assertions": [
        { "id": "a1", "assertion": "contains: \"log in\"", "check": "runtime", "required": true },
        { "id": "a2", "assertion": "The tone matches the house style guide.", "check": "human", "required": true }
      ]
    }
  ]
}
```

`assertions` reuses `VerificationAssertion` — the same shape
`contract.verification` already uses — rather than inventing a parallel
type. `check` still means what it means there:

- **`runtime`** — machine-gradable. `skill eval` only actually grades a
  `runtime` assertion when its `assertion` text starts with a recognized
  directive: `contains: "phrase"`, `not_contains: "phrase"`, or
  `regex: pattern`. This protocol has no general assertion query language
  yet (tracked in [ROADMAP.md](./ROADMAP.md)) — rather than fake natural-
  language grading, an unrecognized `runtime` assertion is graded
  `pending_human`, honestly, not silently skipped or auto-passed.
- **`human`** / **`capability`** — always `pending_human` until a caller
  supplies an explicit verdict (see `--grade` below). `skill eval` never
  invents one.

## `skill eval`

```bash
skill eval <workspace-or-file.skill> --host $SKILL_HOST \
  [--responses responses.json] [--grade grades.json] [--usage usage.json] \
  [-o benchmark.json] [--attach]
```

Runs every case in `contract.evals`:

1. **Executability** — dry-runs the compiled skill once
   (`skill run --mode dry_run` under the hood) and records whether the
   workflow itself structurally executes for this skill, independent of
   whether any assertion passed. A `paused` dry-run (e.g. waiting on a
   missing input) counts as executable — it means the workflow *ran*, not
   that it *failed*.
2. **Response** — if `--responses responses.json` maps this case's `id` to
   a response string (`{"e1": "the actual text you got when you tried the
   prompt"}`), it's graded against. `skill eval` does not call any model
   itself — the agent running the eval already has the response (it's the
   one that ran the prompt); this just grades it.
3. **Grading** — each assertion is graded per the rules above. `--grade
   grades.json` (`{"e1": {"a2": {"status": "pass", "detail": "..."}}}`)
   lets a caller supply a final verdict for anything `skill eval` can't
   check itself — this always wins over automatic grading, since it's the
   caller stating a fact this command has no way to verify on its own.
4. **Usage** — `--usage usage.json` (`{"e1": 342}`) records real token
   counts if a caller has them. Never estimated, never defaulted.

Output is a `BenchmarkReport` (`benchmark.json`):

```json
{
  "kind": "benchmark_report",
  "skill_id": "skl_...",
  "host": "cursor",
  "created_at": "2026-07-13T00:00:00.000Z",
  "cases": [
    {
      "id": "e1",
      "prompt": "...",
      "executable": true,
      "duration_ms": 42,
      "total_tokens": 342,
      "assertions": [
        { "id": "a1", "assertion": "contains: \"log in\"", "check": "runtime", "status": "pass" },
        { "id": "a2", "assertion": "...", "check": "human", "status": "pending_human", "detail": "check=human — requires a human verdict." }
      ]
    }
  ],
  "summary": { "total_cases": 1, "total_assertions": 2, "pass": 1, "fail": 0, "partial": 0, "pending_human": 1 }
}
```

`pending_human` is a normal, common status — not an error, and never
silently treated as a pass anywhere in this codebase.

## Sealing into the package

`skill eval --attach` (workspace input only) writes `.skill/benchmark.json`
alongside the workspace's other state. The **next** `skill compile` picks
it up automatically and seals it into `provenance/benchmark.json` — no
separate flag needed on `compile` itself. Absence of `.skill/benchmark.json`
just means no eval ran yet; compile behaves exactly as it always did.

`skill eval` never auto-mints. Running an eval, even a fully-passing one,
has no effect on `compile_profile`, `mint_status`, or trust state — those
stay governed entirely by the existing rules in
[MINT.md](./MINT.md)/[SECURITY.md](./SECURITY.md).

## What this is not (yet)

- **Not an assertion query language.** `contains:`/`not_contains:`/
  `regex:` is deliberately minimal. A richer language is a natural
  "Next" contribution — see [ROADMAP.md](./ROADMAP.md).
- **Not a scorer.** `benchmark.json` is raw evidence — pass/fail/pending
  per assertion, executability, timing, tokens. Turning that into a
  single quality score with confidence and coverage is a separate concern
  (`@skillerr/skill-score`) — see the container's reserved
  `provenance/score.json` slot once that lands.
- **Not a model runner.** `skill eval` does not call any LLM API. The
  agent that already ran the prompt supplies the response; this command's
  job is structural dry-run + grading + sealing, not inference.
