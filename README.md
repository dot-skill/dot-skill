# Open `.skill` Protocol

**Portable skills for AI agents — continuity handoffs and sealed procedures.**  
Not markdown. Not a prompt paste. A package any conforming runtime can inspect, verify, and run.

[![CI](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Protocol](https://img.shields.io/badge/protocol-0.4.0_draft-orange.svg)](./docs/PROTOCOL.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> **Status:** Draft 0.4.0 — additive evolution only. Community implementations welcome.

**Repo:** [`dot-skill/dot-skill`](https://github.com/dot-skill/dot-skill) · **Spoken:** *dot skill* · **Artifact:** `.skill`

---

## Why this exists (including for AIs)

Markdown skills are lossy, unverifiable, and terrible for switching agents.  
`.skill` is structured, digest-bound, records agent provenance, applies
privacy scrubbing, and compiles only when required parts exist for release.

Read **[docs/WHY.md](./docs/WHY.md)** — written for humans *and* agents that choke on `SKILL.md`.

---

## Install

```bash
# when published (public npm, free):
npm i -g @dot-skill/cli
# or one-shot:
npx @dot-skill/cli --help

# from source today:
git clone https://github.com/dot-skill/dot-skill.git && cd dot-skill
npm install && npm run build && npm link -w @dot-skill/cli
```

---

## 30-second path (AI agent required)

```bash
export SKILL_HOST=cursor          # ollama | lmstudio | claude | codex | …
export SKILL_MODEL=…              # optional
export SKILL_INPUT_TOKENS=1200    # optional — stored in the skill
export SKILL_OUTPUT_TOKENS=400

skill init --title "Demo"
skill journey --summary "Human+AI built a short-answer API client; secrets as refs."
skill propose --json '[
  {"title":"Tone","body":"Keep answers short.","type":"decision"},
  {"title":"API","body":"POST {{base_url}}/v1","type":"integration"}
]'
skill status                      # completeness checklist
skill checkpoint                  # continuity draft → hand off to another AI
skill load ./skl_….skill          # other AI resumes (no private dump)
skill compile -m "Demo" --approve --mint
```

Creation records agent provenance and requires an explicit host identity. This
is a policy assertion, not proof that a particular model authored the work.
Humans review and explicitly approve release compilation.

---

## Continuity and release

| | Continuity draft | Release skill |
|---|---|---|
| Purpose | Daily AI↔AI work handoff | Reusable sealed procedure |
| Incomplete? | Allowed (lists missing) | **compile_refused** |
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

## Packages (npm-ready, MIT, public)

| Package | Purpose |
|---------|---------|
| `@dot-skill/protocol` | Types: SkillSource, sections, completeness |
| `@dot-skill/core` | Compile, pack, validate, mint |
| `@dot-skill/runtime` | Inspect / dry-run / execute |
| `@dot-skill/workspace` | Local `.skill/` working tree |
| `@dot-skill/cli` | `skill` / `dot-skill` bins |
| `@dot-skill/registry` | Optional local transparency log |

Publishing scoped packages to npm is **free** for public open source.  
Guide: **[docs/PUBLISHING.md](./docs/PUBLISHING.md)** (from [npm-publish](https://docs.npmjs.com/cli/v8/commands/npm-publish)).  
Root monorepo stays private; packages use `"publishConfig": { "access": "public" }`.

---

## Docs

- [Protocol](./docs/PROTOCOL.md) · [Workspace](./docs/WORKSPACE.md) · [Agent](./docs/AGENT.md)
- [Structured packages](./docs/WHY.md) · [Continuity](./docs/CONTINUITY.md) · [Privacy](./docs/PRIVACY.md)
- [Local agents](./docs/LOCAL_AGENTS.md) · [Mint](./docs/MINT.md) · [Runtime](./docs/RUNTIME.md) · [FAQ](./docs/FAQ.md) · [Roadmap](./docs/ROADMAP.md)

---

## Contributing

Independent runtimes, language ports, adapters, and adversarial fixtures make this real.

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [DCO.md](./DCO.md) (sign-off required)
- [docs/LICENSING.md](./docs/LICENSING.md) · [docs/PUBLISHING.md](./docs/PUBLISHING.md) (npm)
- [GOVERNANCE.md](./GOVERNANCE.md) · [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

```bash
npm test
```

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Bharat Dudeja
