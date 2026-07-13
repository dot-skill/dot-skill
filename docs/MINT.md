# Mint

```text
AI propose sections → human approve → compile (release, complete) → mint (agent attestation)
```

Continuity drafts **cannot** be minted. Recompile with `--profile release` when complete.

## CreationAttestation

Required for minted skills. Includes:

- `package_digest` and **`sealed_manifest_digest`** (identity + permissions/policy/capabilities + content claims)
- agent host / provider / model (self-reported unless issuer-verified)
- `host_claim_binding`: `self_reported` | `verified_issuer`
- `issuer_class`: `public_dev_hmac` | `configured_hmac` | `verified_issuer`. Required on
  verify — a stripped/absent `issuer_class` is `missing_issuer_class` and refuses; it is
  never reconstructed from `key_id` (an attacker-controlled field just like `issuer_class`
  itself, so reconstruction could launder a `public_dev_hmac` seal into a
  higher-trust-looking label).
- journey refs, optional `generation_usage` (tokens)
- `human_approvals.actors` / **`human_approvals.attested`**: `actors` is only ever the
  identity evidence a caller actually passed (`MintOptions.actors`); mint never fabricates
  a default approver. When no evidence is provided, `actors` is `[]` and `attested` is
  `false` — an explicit, inspectable "unattested" marker rather than a silent claim that a
  human named "human" approved. Likewise `manifest.authors` (from `SkillSource.actor`)
  reflects the agent that authored the skill (`agent:<host>` by default); a human semantic
  reviewer only ever appears in `contract.provenance.human_review`, never as an author.

## Trust (not the same as “signed”)

| Seal | TrustView state | Production execute |
|------|-----------------|--------------------|
| Unsigned / open | `untrusted` | Refuse unless `--allow-untrusted` |
| Public-dev HMAC | `development` | Refuse (forgeable) |
| Configured key + self-reported host | `self_reported` | Refuse unless opted in |
| Configured key + verified host binding | `verified_issuer` | Allowed |

Reference HMAC in this repo is **dev-only** — not production PKI. Humans exporting `SKILL_HOST` alone never get `verified_issuer`.

The seal itself is real HMAC-SHA256 (`crypto.createHmac`), not a naive
`sha256(secret + ":" + payloadDigest)` concatenation. The DSSE envelope
carries an explicit `sig_alg` (currently `"hmac-sha256-v1"`); a seal missing
it or carrying an unrecognized value is `unsupported_seal_version` on
verify — a clear "old/foreign algorithm" refusal, not a generic signature
mismatch that reads like ordinary tampering.

## Anti-spoof

Mint refuses denylisted hosts (`human`, `cli`, `shell`, `manual`, …). Exporting `SKILL_HOST=cursor` (or any host id) alone never yields `verified_issuer` — that requires a configured issuer secret and verified host binding. Agent runtime markers strengthen the mint path but remain **locally spoofable**; env claims stay `self_reported` / `development` under the public-dev key. Workspace compile may still record a declared host; TrustView distinguishes self-reported vs verified issuer.

## Anchors (optional)

Use `skill registry …` for an optional local transparency log of package digests.
