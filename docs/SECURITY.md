# Security

## Practice

- **Inspect before run** — `skill inspect --trust` shows TrustView (seal, issuer, host/model claims, digests) without compiling or feeding package body to a model
- Validate before extract; reject traversal, symlinks, bombs, hash mismatch
- Secrets never embedded — references only
- **Deny-by-default runtime** — undeclared network / filesystem / secret capabilities are refused; missing consent fails closed
- **Unsigned / open packages** are labeled untrusted; `execute` refuses them unless `--allow-untrusted`
- Reference mint HMAC (`dot-skill-dev-mint-key`) is **public-dev only** — TrustView labels it `development`, never production trust
- Trust profiles: `open` | `minted` | `anchored` | `issuer:<id>`
- Trust states: `untrusted` | `development` | `self_reported` | `verified_issuer`

## SKILL_HOST / anti-spoof

- Denylisted mint hosts: `human`, `cli`, `shell`, `manual`, `bash`, `terminal`, … — mint refuses
- Exporting `SKILL_HOST=cursor` alone **cannot** produce `verified_issuer` trust
- Seals record `host_claim_binding` (`self_reported` vs `verified_issuer`) and `issuer_class`
- Agent runtime markers (`SKILL_AGENT_INVOCATION`, `SKILL_SESSION_ID`, Cursor markers, …) strengthen the mint path but are still locally spoofable

## Seal binding

Creation seals cover `sealed_manifest_digest`: title, intent, permissions, policy, capabilities, input sensitivity, content digests, and contract summary — not only workflow/knowledge bytes.

## Residual risk

A seal proves which key signed which claims. It **cannot** prove that a named local LLM was honest about authorship. Treat host/provider/model fields as claims under that key’s honesty.

## Threats

Malicious packages, prompt injection via resources, tool escalation, dependency confusion
(including similarly named npm packages). Prefer verifying package identity and digests.

Report vulnerabilities privately — see [SECURITY.md](../SECURITY.md).
