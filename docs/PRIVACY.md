# Privacy

`.skill` packages must be useful for handoff **without** becoming a leak vector.

## Never in the package

- API keys, passwords, session cookies, private keys
- Raw chat transcripts / chain-of-thought
- Unredacted customer PII when sensitivity is not `private` local-only

## Always OK (preferred)

- Secret **references**: `env:OPENAI_API_KEY`, `{{api_credential_ref}}`
- Generalized journey summaries
- Decisions, constraints, workflows
- Token **counts** (generation_usage), not prompt contents

## Compiler behavior

- `redactSecrets()` replaces credential-like substrings before pack
- Continuity defaults to `provenance_mode: redacted`
- `package_sensitivity`: `private` | `shareable_redacted` | `public`

## Local and shareable

| Sensitivity | Use |
|---|---|
| `private` | Stay on your machine / trusted repo |
| `shareable_redacted` | Handoff to another AI / teammate |
| `public` | Community skills (still no secrets) |
