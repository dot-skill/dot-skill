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
- `issuer_class`: `public_dev_hmac` | `configured_hmac` | `verified_issuer`
- journey refs, optional `generation_usage` (tokens)

## Trust (not the same as “signed”)

| Seal | TrustView state | Production execute |
|------|-----------------|--------------------|
| Unsigned / open | `untrusted` | Refuse unless `--allow-untrusted` |
| Public-dev HMAC | `development` | Refuse (forgeable) |
| Configured key + self-reported host | `self_reported` | Refuse unless opted in |
| Configured key + verified host binding | `verified_issuer` | Allowed |

Reference HMAC in this repo is **dev-only** — not production PKI. Humans exporting `SKILL_HOST` alone never get `verified_issuer`.

## Anti-spoof

Mint refuses denylisted hosts (`human`, `cli`, `shell`, `manual`, …). Exporting `SKILL_HOST=cursor` (or any host id) alone never yields `verified_issuer` — that requires a configured issuer secret and verified host binding. Agent runtime markers strengthen the mint path but remain **locally spoofable**; env claims stay `self_reported` / `development` under the public-dev key. Workspace compile may still record a declared host; TrustView distinguishes self-reported vs verified issuer.

## Anchors (optional)

Use `skill registry …` for an optional local transparency log of package digests.
