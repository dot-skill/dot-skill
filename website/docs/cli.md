# CLI reference

Reference command surface for the Open `.skill` Protocol — for **agents and implementers**. Hosts may implement the same operations via Skillerr libraries without this CLI. Humans typically install once and prompt an agent; they do not need this page as a click-ops tutorial.

```bash
npm i -g skillerr
skill --help
skill --version
```

Bin: `skill`. Site: [skillerr.com](https://skillerr.com).

## Environment

| Variable | Role |
|----------|------|
| `SKILL_HOST` | **Required to create** — agent host id (`cursor`, `ollama`, `claude`, …) |
| `SKILL_PROVIDER` / `SKILL_MODEL` | Self-reported model provenance |
| `SKILL_DEPLOYMENT` | `local` \| `hosted` \| `hybrid` \| `unknown` |
| `SKILL_ENDPOINT` | Optional endpoint id — never credentials |
| `SKILL_AGENT_INVOCATION` / `SKILL_SESSION_ID` | Agent runtime markers (preferred; still locally spoofable) |
| `SKILL_INPUT_TOKENS` / `SKILL_OUTPUT_TOKENS` | Optional generation usage |
| `SKILL_ACTOR` | Human review actor when recording approval |

`SKILL_HOST` alone never yields `verified_issuer` trust. Denylisted mint hosts: `human`, `cli`, `shell`, `manual`, `bash`, `terminal`, …

---

## Create workspace

### `skill init`

```bash
skill init --title "Demo"
```

Creates a local `.skill/` working tree (`sections/`, stage index, config).

### `skill journey`

```bash
skill journey --summary "Redacted human+AI work; secrets as refs."
```

Sets the redacted journey summary. No API keys, tokens, or private customer data.

### `skill propose`

```bash
skill propose --title "Tone" --body "Keep answers short." --type decision
skill propose --json '[
  {"title":"Tone","body":"Keep answers short.","type":"decision"},
  {"title":"API","body":"POST {{base_url}}/v1","type":"integration"}
]'
```

Requires `SKILL_HOST`. Prefer exact human-approved bodies.

### `skill status` / stage

```bash
skill status                 # completeness + staged sections
skill add [id...]            # stage (default: ALL)
skill unstage [id...]
skill review
skill discard <id>
```

### `skill checkpoint`

```bash
skill checkpoint -m "WIP"
```

Continuity handoff package. Partial content allowed. Not mintable.

### `skill compile`

```bash
skill compile -m "Demo" --approve --mint
skill compile -m "WIP" --profile continuity
```

Release profile refuses if incomplete (`compile_refused`). Legacy alias: `skill bake` (prints a note; prefer `compile`).

### `skill mint`

```bash
skill mint [--host name]
```

Seal an already-compiled complete release. Host required. Continuity drafts cannot be minted.

### `skill load`

```bash
skill load ./file.skill
```

Resume continuity context in another agent (intent, scrubbed journey, gaps, knowledge — not raw transcripts).

---

## Multi-skill identify

### `skill agent-guide`

```bash
skill agent-guide
skill agent-guide --json
```

Prints exact create / identify protocol steps for agents.

### `skill extract` (alias: `skill segment`)

```bash
skill extract ./journey.json -o ./extraction
skill extract ./journey.json -o ./extraction --profile release
```

Input shape: `{ summary, candidates|topics: [...] }`. Output: candidate scaffolds plus field-specific `missing` reports. One workspace per selected candidate → `contract-check` / `status` → checkpoint or release compile.

### Contract helpers

```bash
skill contract-template
skill contract-check contract.json --profile release
```

---

## Ingest / run / trust

### `skill inspect`

```bash
skill inspect ./file.skill
skill inspect ./file.skill --trust
```

Manifest, digests, seals, TrustView — **no execution**.

### `skill validate`

```bash
skill validate ./file.skill
```

Structure and hash integrity. Rejects traversal, symlinks, bombs, and hash mismatch.

### `skill verify-trust`

```bash
skill verify-trust ./file.skill
skill verify-trust ./file.skill --profile minted
skill verify-trust ./file.skill --allow-development-issuer
```

Public-dev HMAC is development-only; use `--allow-development-issuer` only when intentionally inspecting reference mints.

### `skill run`

```bash
skill run ./file.skill                              # dry-run (default)
skill run ./file.skill --mode execute               # refuses untrusted seals
skill run ./file.skill --mode execute --allow-untrusted
```

Deny-by-default for undeclared network / filesystem / secrets.

### Other ingest helpers

```bash
skill unpack ./file.skill
skill pack ./source.json -o out.skill --approve --profile release
skill to-skill-md ./file.skill                      # lossy markdown adapter
```

### Optional local registry

```bash
skill registry list
skill registry lookup <digest>
```

Local transparency log of package digests — not a hosted marketplace.

---

## Typical agent flows

**Create → handoff**

```bash
export SKILL_HOST=cursor
skill init --title "…"
skill journey --summary "…"
skill propose --json '[…]'
skill checkpoint -m "WIP"
```

**Create → release**

```bash
skill compile -m "…" --approve --mint
```

**Ingest safely**

```bash
skill inspect ./file.skill --trust
skill validate ./file.skill
skill run ./file.skill
```

Human-facing prompts: [Getting started](/getting-started).
