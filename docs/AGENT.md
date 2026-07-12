# Agent guide

You are an AI agent using the Open `.skill` Protocol. Treat `skill` like git for portable skills.

## Rules

1. Set `SKILL_HOST` to your host id (`cursor`, `ollama`, `lmstudio`, `claude`, …).
2. Never invent filler to force a release compile — if incomplete, stop and list `missing`.  
3. Prefer exact section bodies the human approved.  
4. Put secrets only as `{{refs}}` / env refs.  
5. Use **checkpoint** for mid-work handoff; **compile --mint** only when release-complete.  
6. Record tokens when known: `SKILL_INPUT_TOKENS` / `SKILL_OUTPUT_TOKENS` or `--input-tokens`.

## Minimal release

```bash
export SKILL_HOST=cursor
skill init --title "…"
skill journey --summary "Redacted human+AI journey…"
skill propose --json '[{"title":"…","body":"…","type":"decision"},{"title":"…","body":"Call {{base_url}}","type":"integration"}]'
skill compile -m "…" --approve --mint
```

## Handoff to another agent

```bash
skill checkpoint -m "WIP"
# other agent:
skill load ./skl_….skill
```

## On `compile_refused`

Tell the human what is missing (`intent`, `journey`, `sections`, …). Complete those parts, then compile again. Do not pack a fake release skill.

Local and offline agents are supported; see [LOCAL_AGENTS.md](./LOCAL_AGENTS.md).
