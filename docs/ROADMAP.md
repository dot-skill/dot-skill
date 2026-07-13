# Roadmap

Status: protocol **Draft 0.5.0**; reference packages **0.5.0**.

## Now (done in this repo)

- [x] `.skill` container + digests
- [x] Mint + attestation (reference implementation)
- [x] Free local transparency-log registry
- [x] Reference runtime + CLI
- [x] Conformance tests
- [x] Docs, governance, CI
- [x] Local/offline agent provenance (Ollama, LM Studio, llama.cpp, custom)
- [x] Complete transferable `SkillContract`, assessment APIs, and JSON Schema
- [x] Structured contract-to-manifest/workflow compilation

## Next (great contribution targets)

- [ ] Validate the published authoring schema with an independent implementation
- [ ] Production-grade signing (replace dev HMAC; document key ceremony)
- [ ] HTTP transparency-log server (same log format as local registry)
- [ ] Stronger `verify` assertion language + fixtures
- [ ] Host adapters: local OpenAI-compatible, Cursor, Claude Code, Codex
- [ ] Second language runtime (Go or Rust) for Stable eligibility
- [ ] Adversarial package corpus (zip bombs, path tricks, hash mismatch)
- [ ] Official `SKILL.md` round-trip adapter tests
- [ ] Public RFC folder (`docs/rfcs/`)

## Later

- [ ] Multi-issuer trust roots / key transparency
- [ ] Optional ledger anchors as one permanence kind (never required)
- [ ] Mark **Candidate** then **Stable** after two independent runtimes pass the same corpus
