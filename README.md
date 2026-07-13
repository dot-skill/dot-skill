# Open `.skill` Protocol

Easily create, inspect, and run portable AI skill packages — sealed, digests, provenance, and optional mint. Works with any conforming runtime.

[![npm](https://img.shields.io/npm/v/skillerr.svg)](https://www.npmjs.com/package/skillerr)
[![CI](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![Protocol](https://img.shields.io/badge/protocol-0.5.0_draft-orange.svg)](./docs/PROTOCOL.md)

**Install:** [`skillerr`](https://www.npmjs.com/package/skillerr) · **Bin:** `skill` · **Artifact:** `.skill` · **Repo:** [dot-skill/dot-skill](https://github.com/dot-skill/dot-skill)

> Draft **0.5.0** — transferable authoring contract. Community implementations welcome.

---

## Install

```bash
npm i -g skillerr
```

Then: `skill --help`. Node ≥ 20. One-shot: `npx -y skillerr --help`.

```bash
export SKILL_HOST=cursor   # required when creating
```

1. Ask your AI agent to create a skill (agents must set `SKILL_HOST`).
2. Review with `skill status`.
3. Hand off with `skill checkpoint`, or seal with `skill compile -m "…" --approve --mint`.
4. Before trusting a file: `skill inspect` → `skill validate` → `skill run` (dry-run by default).

Why not markdown? → [docs/WHY.md](./docs/WHY.md)

---

## Quickstart

### Create

```bash
export SKILL_HOST=cursor          # ollama | lmstudio | claude | codex | …
export SKILL_MODEL=…              # optional

skill init --title "Demo"
skill journey --summary "Human+AI built a short-answer API client; secrets as refs."
skill propose --json '[
  {"title":"Tone","body":"Keep answers short.","type":"decision"},
  {"title":"API","body":"POST {{base_url}}/v1","type":"integration"}
]'
skill status
skill checkpoint                  # continuity draft → hand off to another AI
# when complete:
skill compile -m "Demo" --approve --mint
```

### Ingest / run

```bash
skill inspect ./file.skill        # manifest, digests, seals — no execution
skill validate ./file.skill
skill verify-trust ./file.skill
skill load ./file.skill           # resume continuity context
skill run ./file.skill            # dry-run by default
```

---

## For agents

Treat `skill` like git for portable skills. Full guide: [docs/AGENT.md](./docs/AGENT.md).

**Rules:** set `SKILL_HOST`; prefer exact human-approved section bodies; secrets only as `{{refs}}`; checkpoint for handoff; compile+mint only when release-complete; never invent filler to force a release.

Creation records **declared** agent provenance (`SKILL_HOST`) — self-reported context, not cryptographic proof. Humans review and approve release compilation.

---

## Continuity vs release

| | Continuity draft | Release skill |
|---|---|---|
| Purpose | AI↔AI work handoff | Reusable sealed procedure |
| Incomplete? | Allowed (lists gaps) | **compile_refused** |
| Mint? | No | Yes |
| Privacy | Redacted journey, secret refs | Same + attestation |

Details: [CONTINUITY.md](./docs/CONTINUITY.md) · [PRIVACY.md](./docs/PRIVACY.md)

---

## What’s in a `.skill`

```text
example.skill
├── skill.json           # manifest, digests, profile, completeness
├── workflow.json        # runnable steps
├── knowledge/           # pinned decisions / rules
├── provenance/          # redacted journey + generation_usage (tokens)
└── signatures/          # mint attestation (release)
```

Markdown is a **lossy adapter only** (`skill to-skill-md`).

---

## Trust before run

- **Inspect first** — digests and seals without running the skill.
- **Validate** structure and hash integrity.
- **Dry-run** before execute.
- Reference mint HMAC in this repo is **development-only** — not production identity proof.

See [docs/SECURITY.md](./docs/SECURITY.md).

---

## Packages

| Package | Purpose |
|---------|---------|
| [`skillerr`](./packages/dot-skill) | **Public install** — bin `skill` |
| [`@dot-skill/cli`](./packages/cli) | CLI implementation |
| [`@dot-skill/protocol`](./packages/protocol) | SkillContract, SkillSource, types |
| [`@dot-skill/core`](./packages/core) | Compile, pack, validate, mint |
| [`@dot-skill/runtime`](./packages/runtime) | Inspect / dry-run / execute |
| [`@dot-skill/workspace`](./packages/workspace) | Local `.skill/` working tree |
| [`@dot-skill/registry`](./packages/registry) | Optional local transparency log |

```bash
git clone https://github.com/dot-skill/dot-skill.git && cd dot-skill
npm i && npm run build && npm link -w skillerr
```

Publishing: [docs/PUBLISHING.md](./docs/PUBLISHING.md)

---

## Documentation

- [Protocol](./docs/PROTOCOL.md) · [Agent](./docs/AGENT.md) · [Workspace](./docs/WORKSPACE.md)
- [Why structured packages](./docs/WHY.md) · [Continuity](./docs/CONTINUITY.md) · [Privacy](./docs/PRIVACY.md)
- [Local agents](./docs/LOCAL_AGENTS.md) · [Mint](./docs/MINT.md) · [Runtime](./docs/RUNTIME.md) · [FAQ](./docs/FAQ.md) · [Roadmap](./docs/ROADMAP.md)

---

## Contributing

Independent runtimes, language ports, adapters, and adversarial fixtures make this real.

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [DCO.md](./DCO.md) (sign-off required)
- [GOVERNANCE.md](./GOVERNANCE.md) · [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

```bash
npm test
```

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Bharat Dudeja
