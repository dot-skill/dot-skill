# Continuity — AI work context without private dumps

Developers switch models and hosts constantly. Chat exports are toxic (secrets, PII, noise). Continuity `.skill` files are the portable **source of truth for work context**.

## Checkpoint

```bash
export SKILL_HOST=cursor
skill journey --summary "Building OAuth; provider undecided; secrets as refs."
skill propose --json '[…sections…]'
skill checkpoint -m "auth WIP"
# → *.skill draft (compile_profile: continuity)
```

## Resume in another AI

```bash
skill load ./skl_….skill
```

The agent gets: intent, redacted journey, open questions, knowledge titles/bodies (scrubbed), completeness gaps, typed inputs — **not** raw transcripts or credentials.

## Rules

- Continuity may be **partial**; release may not.
- Continuity packages are **not mintable**.
- Default sensitivity: `shareable_redacted`.
- Never embed API keys, tokens, `.env`, or private customer data.

See [PRIVACY.md](./PRIVACY.md).
