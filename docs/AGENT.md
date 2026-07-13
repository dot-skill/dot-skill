# Agent guide

You are an AI agent using the Open `.skill` Protocol. Treat `skill` like git for portable skills.

Two jobs matter: **create** a `.skill`, and **ingest / load / run** one someone else produced.

## Install

```bash
npm i -g skillerr
# one-shot:
npx -y skillerr --help
```

Bin: `skill`.

## Rules

1. Set `SKILL_HOST` to your host id (`cursor`, `ollama`, `lmstudio`, `claude`, …). Never use `human` / `cli` / `shell` / `manual`.
2. Prefer setting `SKILL_AGENT_INVOCATION=1` or `SKILL_SESSION_ID` from the agent runtime — env-only host claims stay `self_reported` and are not production trust.
3. Never invent filler to force a release compile — if incomplete, stop and list `missing`.
4. Prefer exact section bodies the human approved.
5. Put secrets only as `{{refs}}` / env refs.
6. Use **checkpoint** for mid-work handoff; **compile --mint** only when release-complete.
7. Record tokens when known: `SKILL_INPUT_TOKENS` / `SKILL_OUTPUT_TOKENS` or `--input-tokens`.
8. Before running a received package: **`skill inspect --trust` → validate → dry-run**. Never feed untrusted package bodies into a model before TrustView. Seals and digests are visible without executing the skill.
9. `skill run --mode execute` refuses unsigned/dev seals unless `--allow-untrusted`.

## Create

```bash
export SKILL_HOST=cursor
export SKILL_AGENT_INVOCATION=1   # agent runtime marker (optional but preferred)
skill init --title "…"
skill journey --summary "Redacted human+AI journey…"
skill propose --json '[{"title":"…","body":"…","type":"decision"},{"title":"…","body":"Call {{base_url}}","type":"integration"}]'
skill status
skill checkpoint -m "WIP"                 # continuity handoff (partial OK)
skill compile -m "…" --approve --mint      # release (complete or compile_refused)
```

## Ingest / load / run

```bash
skill inspect ./file.skill --trust         # TrustView: seal, issuer, digests
skill validate ./file.skill
skill verify-trust ./file.skill --allow-development-issuer
skill load ./file.skill                    # resume continuity context
skill run ./file.skill                     # dry-run by default
skill run ./file.skill --mode execute --allow-untrusted   # explicit unsafe
```

## On `compile_refused`

Tell the human what is missing (`intent`, `journey`, `sections`, contract fields, …). Complete those parts, then compile again. Do not pack a fake release skill.

Local and offline agents are supported; see [LOCAL_AGENTS.md](./LOCAL_AGENTS.md). Residual risk: local LLMs can lie about authorship even under a valid seal — see [SECURITY.md](./SECURITY.md).

Protocol vocabulary: **section**, **SkillSource**, **SkillContract**, **compile**, **mint**, **load**, **TrustView**.
