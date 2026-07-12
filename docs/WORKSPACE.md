# Workspace (git-like)

```text
.skill/
  config.json          # title, journey_summary, default_stage_all
  sections/*.json      # agent-proposed units
  index.json           # staged ids
  HEAD.json            # last compile
  objects/*.skill
```

| git | skill |
|-----|-------|
| init | `skill init` |
| edit | `skill propose` (AI only) |
| add | `skill add` (default all) |
| status | `skill status` (+ completeness) |
| stash/WIP | `skill checkpoint` (continuity) |
| commit | `skill compile` (release) |
| tag/sign | `skill mint` |

No `publish` in the happy path — share the file.

## Agent path

```bash
export SKILL_HOST=cursor
skill init --title "…"
skill journey --summary "…"
skill propose --json '[…]'
skill checkpoint                 # handoff draft
skill compile -m "…" --approve --mint
```
