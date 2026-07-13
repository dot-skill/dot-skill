# Getting started

Skillerr is **agent-first**. Install the reference CLI once, then paste a prompt to your AI. You review and approve; the agent runs the tooling.

```bash
npm i -g skillerr
```

Node ≥ 20. Site: [skillerr.com](https://skillerr.com).

Implementers wiring a product: start from [Protocol](/protocol) and the Skillerr libraries — the CLI is the reference surface, not the only path.

---

## Talk to your AI

### Create a skill from this chat

```text
Install skillerr if needed (`npm i -g skillerr`). Set SKILL_HOST to your host id
(e.g. cursor). From this conversation, create a portable .skill: redacted journey,
exact sections I approved (secrets only as {{refs}}), then either checkpoint for
handoff or compile --approve --mint when release-complete. Do not invent filler.
Show me status and the output path.
```

### Inspect before you trust or run

```text
I have a file at ./file.skill. Inspect TrustView (digests, seals) without executing.
Validate integrity, then dry-run. Summarize what it does and any trust warnings.
Do not execute for real unless I explicitly ask.
```

### Extract multiple skills from a journey

```text
Using skillerr, run agent-guide then extract from ./journey.json into ./extraction.
For each candidate I select, open its own workspace, fill missing contract fields,
and only compile a release when complete — otherwise checkpoint. Prefer exact text.
```

### Load a continuity handoff

```text
Load ./handoff.skill as continuity context. Summarize intent, scrubbed journey,
open gaps, and pinned knowledge. Resume the work; do not mint a fake release.
```

### Hand off mid-work

```text
Checkpoint the current .skill workspace as a continuity draft (partial OK).
Tell me the output path and what the next agent should load.
```

Full create path: [Create a skill](/create-a-skill) · Ingest path: [Ingest a skill](/ingest-a-skill) · Agent rules: [Agents](/agents)

---

## What your agent will do

Commands are what the **agent** runs — not a human homework list.

| Goal | What the agent runs |
|------|---------------------|
| Create workspace | `skill init` → `journey` → `propose` → `status` |
| Mid-work handoff | `skill checkpoint` |
| Release when complete | `skill compile -m "…" --approve --mint` |
| Trust before run | `skill inspect --trust` → `validate` → `run` (dry-run) |
| Resume handoff | `skill load ./file.skill` |

Creating requires a declared agent host:

```bash
export SKILL_HOST=cursor   # ollama | lmstudio | claude | codex | …
```

Prefer `SKILL_AGENT_INVOCATION=1`. Host / model fields are **self-reported** provenance, not cryptographic proof of authorship.

---

## Continuity vs release (30 seconds)

| | Continuity draft | Release skill |
|---|------------------|---------------|
| Purpose | AI↔AI (or host↔host) work handoff | Reusable sealed procedure |
| Incomplete? | Allowed (lists gaps) | **compile_refused** |
| Mint? | No | Yes (when complete + approved) |

---

## Local / offline agents

Same create / ingest contract. Ask your agent to set local provenance, for example:

```bash
export SKILL_HOST=ollama
export SKILL_PROVIDER=ollama
export SKILL_MODEL=llama3.2
export SKILL_DEPLOYMENT=local
export SKILL_ENDPOINT=http://127.0.0.1:11434/v1
```
