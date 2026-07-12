# FAQ

## What is the `.skill` Protocol?

An open format for **portable AI skills**: typed inputs, workflow, pinned knowledge, redacted journey provenance, token usage, integrity digests, and agent mint attestation. Spoken: *dot skill*. Repo: **dot-skill**.

## How is this different from `SKILL.md`?

See [WHY.md](./WHY.md). Short version: structured + digests + mint + continuity handoff + compile gates. Markdown is a lossy adapter only.

## Continuity and release?

- **Continuity** — daily AI↔AI work context (partial OK, not mintable).  
- **Release** — complete reusable skill or `compile_refused`.

## How is agent authorship represented?

Creation requires a declared agent host (`SKILL_HOST`). Humans review, stage,
and approve. The reference implementation records this as self-reported
provenance; it is not proof that a particular model authored the content.

## Where do I publish?

Share the `.skill` file directly. An optional local transparency log is included.

## Do I need a blockchain?

**No.**

## Is npm free?

Yes — public scoped packages (`@dot-skill/*`) publish free on npm. This monorepo is MIT.


## Is 0.4.0 production-final?

Public **draft**. Reference mint HMAC is **dev-only** — replace with real keys in production issuers.
