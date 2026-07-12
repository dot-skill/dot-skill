# Mint

```text
AI propose sections → human approve → compile (release, complete) → mint (agent attestation)
```

Continuity drafts **cannot** be minted. Recompile with `--profile release` when complete.

## CreationAttestation

Required for minted skills. Includes agent host/model, journey refs, optional `generation_usage` (tokens).

Reference HMAC in this repo is **dev-only** — not production PKI.

## Anchors (optional)

Use `skill registry …` for an optional local transparency log of package digests.
