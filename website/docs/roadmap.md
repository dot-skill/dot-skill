# Roadmap

Status: protocol **Draft 0.5.0**; Skillerr reference packages track the same draft line. The goal is an open, interoperable contract — multiple conforming hosts and runtimes, not a single CLI.

Public, contribution-oriented items only. Timing is not guaranteed. Site: [skillerr.com](https://skillerr.com).

## Available in the reference today

- `.skill` container + digests  
- Mint + creation attestation (reference implementation)  
- Free local transparency-log registry  
- Reference runtime + CLI (`skillerr` / `skill`)  
- Conformance tests, docs, governance, CI  
- Local / offline agent provenance (Ollama, LM Studio, llama.cpp, custom)  
- Transferable `SkillContract`, assessment APIs, and JSON Schema  
- Structured contract-to-manifest / workflow compilation  

## Next (good contribution targets)

- Independent implementation validating the published authoring schema  
- Production-grade signing (replace public-dev HMAC; document key ceremony)  
- HTTP transparency-log server (same log format as the local registry)  
- Stronger `verify` assertion language + fixtures  
- Host adapters: local OpenAI-compatible, Cursor, Claude Code, Codex  
- Second language runtime (Go or Rust) for Stable eligibility  
- Adversarial package corpus (zip bombs, path tricks, hash mismatch)  
- Official `SKILL.md` round-trip adapter tests  
- Public RFC folder  

## Later

- Multi-issuer trust roots / key transparency  
- Optional ledger anchors as one permanence kind (**never required**)  
- Mark **Candidate**, then **Stable**, after two independent runtimes pass the same corpus  

## Stability path

Draft → Candidate → Stable requires independent conforming runtimes and a shared adversarial / conformance corpus — not a single vendor ship date.
