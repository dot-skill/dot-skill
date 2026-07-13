# Structured `.skill` packages

Markdown `SKILL.md` files do not provide package structure, integrity metadata, or portable execution semantics.

| Limitation of `.md` skills | How `.skill` helps |
|---|---|
| Unstructured prose — every model re-interprets | Typed **workflow** + **knowledge** + **inputs** |
| No integrity | SHA-256 `package_digest` |
| Quiet edits go unnoticed | **Mint** + CreationAttestation (declared agent host) |
| Secrets end up in the file | Secret **refs** only; redaction on compile |
| Switching hosts loses context | **Continuity draft** `.skill` is the handoff object |
| Thin fake skills ship easily | **Release compile refuses** if required parts missing |
| No cost trail | Optional **generation_usage** (tokens) sealed at mint |

## Two profiles

1. **`continuity`** — handoff between agents. Partial OK. Privacy-scrubbed journey. Not mintable.
2. **`release`** — reusable sealed skill. Complete or **compile_refused**. Then mint.

## Agent provenance

Creating a `.skill` requires declared agent provenance
(`SKILL_HOST=cursor|ollama|lmstudio|claude|…`). Humans **review / stage /
approve**. Host and model fields are self-reported unless a deployment adds a
trusted external signer.

## Inspect before run

Digests and seals are visible with `skill inspect` / `skill verify-trust`
without executing the skill. Prefer dry-run before execute.
