# FAQ

## What is the `.skill` Protocol?

An open format for **portable AI skills**: typed inputs, workflow, pinned knowledge, redacted journey provenance, optional token usage, integrity digests, and mint attestation. Home: [skillerr.com](https://skillerr.com).

## How do I install the CLI?

```bash
npm i -g skillerr
```

Bin: `skill`.

## How is this different from `SKILL.md`?

See [WHY.md](./WHY.md). Short version: structured package + digests + mint + continuity handoff + compile gates. Markdown is a lossy adapter only.

## Continuity vs release?

- **Continuity** — AI↔AI work handoff (partial OK, not mintable).
- **Release** — complete reusable skill or `compile_refused`.

## How do I create a skill?

Agents create; humans approve. Set `SKILL_HOST`, then `skill init` → `propose` → `checkpoint` or `compile --approve --mint`. See [AGENT.md](./AGENT.md).

## How do I ingest or run a skill?

Inspect first, then validate, then dry-run:

```bash
skill inspect ./file.skill
skill validate ./file.skill
skill run ./file.skill
```

## How is agent authorship represented?

Creation requires a declared agent host (`SKILL_HOST`). Humans review, stage, and approve. The reference implementation records this as self-reported provenance; it is not proof that a particular model authored the content.

## Where do I publish?

Share the `.skill` file directly. An optional local transparency log is included (`skill registry …`). Hosted registries are out of scope for this protocol.

## Do I need a blockchain?

**No.**

## Is npm free for these packages?

Yes — public install is unscoped `skillerr` (no org required). Install: `npm i -g skillerr`.

## Is this production-final?

Public **draft** (0.5.0). Reference mint HMAC is **development-only** — replace with real keys in production issuers. Digests and inspect-before-run are real; do not treat the bundled signer as production identity proof.
