# skillerr

Easily create, inspect, and run portable `.skill` packages for AI agents. Works with any conforming runtime.

**Bin:** `skill` · **Protocol:** [Open `.skill`](https://github.com/dot-skill/dot-skill) · **License:** MIT

[![npm](https://img.shields.io/npm/v/skillerr.svg)](https://www.npmjs.com/package/skillerr)
[![CI](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml/badge.svg)](https://github.com/dot-skill/dot-skill/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/dot-skill/dot-skill/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

A `.skill` is a sealed ZIP: typed inputs, workflow, pinned knowledge, redacted provenance, integrity digests, and optional mint attestation. Inspect and verify before you run.

---

## Install

```bash
npm i -g skillerr
```

```bash
skill --help
```

One-shot: `npx -y skillerr --help`. Node ≥ 20.

```bash
export SKILL_HOST=cursor   # required when creating (ollama | claude | codex | …)
```

---

## Quickstart

### Create

```bash
export SKILL_HOST=cursor

skill init --title "Demo"
skill journey --summary "Human+AI built a short-answer API client; secrets as refs."
skill propose --json '[
  {"title":"Tone","body":"Keep answers short.","type":"decision"},
  {"title":"API","body":"POST {{base_url}}/v1","type":"integration"}
]'
skill status
skill checkpoint
skill compile -m "Demo" --approve --mint
```

### Ingest / run

```bash
skill inspect ./file.skill
skill validate ./file.skill
skill verify-trust ./file.skill
skill load ./file.skill
skill run ./file.skill            # dry-run by default
```

---

## For agents

Treat `skill` like git for portable skills.

- Set `SKILL_HOST` before create/propose/compile
- Prefer exact human-approved section bodies
- Secrets only as `{{refs}}`
- `skill checkpoint` for mid-work handoff
- `skill compile … --approve --mint` only when release-complete

Full guide: [AGENT.md](https://github.com/dot-skill/dot-skill/blob/main/docs/AGENT.md)

---

## Documentation

- [Protocol](https://github.com/dot-skill/dot-skill/blob/main/docs/PROTOCOL.md)
- [Why `.skill`](https://github.com/dot-skill/dot-skill/blob/main/docs/WHY.md)
- [Security](https://github.com/dot-skill/dot-skill/blob/main/docs/SECURITY.md)
- [Repository](https://github.com/dot-skill/dot-skill)

Internal packages (`@dot-skill/*`) power this CLI. Users install **`skillerr`** only.

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](https://github.com/dot-skill/dot-skill/blob/main/CONTRIBUTING.md) (DCO sign-off required).

---

## License

[MIT](./LICENSE) — Copyright (c) 2026 Bharat Dudeja
