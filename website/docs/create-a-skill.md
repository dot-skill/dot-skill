# Create a skill

Under the Open `.skill` Protocol, **agents author** portable skills; **humans review and approve** release. Point your AI at the work — do not treat the CLI as a human click-ops checklist.

## Prompt your agent

```text
Install skillerr if needed. Set SKILL_HOST to your host id. From this conversation,
create a portable .skill with a redacted journey and exact sections I approved
(secrets as {{refs}}). Checkpoint for handoff, or compile --approve --mint when
release-complete. Do not invent filler. Show status and the output path.
```

Install once if the agent needs it:

```bash
npm i -g skillerr
```

## What your agent will do

| Step | Agent runs |
|------|------------|
| Init workspace | `skill init --title "…"` |
| Redacted journey | `skill journey --summary "…"` |
| Propose sections | `skill propose --json '[…]'` (exact approved bodies) |
| Status | `skill status` |
| Mid-work handoff | `skill checkpoint -m "WIP"` |
| Release | `skill compile -m "…" --approve --mint` |

Required env when creating:

```bash
export SKILL_HOST=cursor
export SKILL_AGENT_INVOCATION=1   # preferred
```

## Workspace model

Local working tree (git-like):

```text
.skill/
  config.json
  sections/*.json
  index.json          # staged ids
  HEAD.json
  objects/*.skill
```

| git | skill (agent surface) |
|-----|------------------------|
| init | `skill init` |
| edit | `skill propose` |
| add | `skill add` |
| status | `skill status` |
| stash / WIP | `skill checkpoint` |
| commit | `skill compile` |
| tag / sign | `skill mint` |

No marketplace publish in the happy path — share the `.skill` file.

Prefer verbatim human-approved bodies. Secrets only as `{{refs}}`. If incomplete → `compile_refused` with missing fields. Fix and compile again. Do not invent filler.

Contract helpers the agent may use: `skill contract-template`, `skill contract-check contract.json --profile release`.

## Multi-skill from a journey

Prompt:

```text
Using skillerr, run agent-guide then extract from ./journey.json into ./extraction.
For each candidate I select, open its own workspace, fill missing contract fields,
and only compile a release when complete — otherwise checkpoint.
```

What the agent runs: `skill agent-guide` → `skill extract ./journey.json -o ./extraction` → one workspace per selected candidate → contract-check → checkpoint or compile.

## Local / offline create

Ask the agent to set Ollama (or similar) provenance, then the same propose / checkpoint / compile path. Provenance remains self-reported unless a deployment adds a verified issuer.

## What success looks like

- Continuity: handoff file loads in another agent with gaps visible  
- Release: complete package, mint attestation present, inspectable TrustView  

Next: [Ingest a skill](/ingest-a-skill) · [Agents](/agents)
