# Roadmap

Status: protocol **Draft 0.5.0**; reference packages **0.6.0**.

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
- [x] Content-addressed `skill_id`; byte-identical repacking of the same source
- [x] RFC 8785 canonicalization pinned, with cross-implementation test vectors
      (`fixtures/canonicalization/`)
- [x] Adversarial package corpus (zip bombs, path tricks, hash mismatch,
      duplicate entries, tampered digests, stripped issuer_class) —
      `packages/cli/src/adversarial.test.ts`, run on every `npm test`
- [x] Structured permission grammar for `permission.hosts`/`.paths`
      (`@skillerr/protocol`'s `isValidHostPattern`/`isValidPathPattern`),
      validated at both contract-authoring and manifest-validation time

## Next (great contribution targets)

- [ ] Resolve `{{input_name}}` permission-path/host placeholders against
      the input's runtime value before matching in
      `assertCapabilityAllowed` — grammar-valid today (PROTO-5) but not yet
      functional; see the `scoped-npm-monorepo-publishing` gold example
- [ ] Validate the published authoring schema with an independent implementation
- [ ] Production-grade signing (replace dev HMAC; document key ceremony)
- [ ] HTTP transparency-log server (same log format as local registry)
- [ ] Stronger `verify` assertion language + fixtures
- [ ] Host adapters: local OpenAI-compatible, Cursor, Claude Code, Codex
- [ ] Second language runtime (Go or Rust) for Stable eligibility — reproduce
      the adversarial corpus and canonicalization vectors byte-for-byte
- [ ] Official `SKILL.md` round-trip adapter tests
- [ ] Public RFC folder (`docs/rfcs/`)

## Later

- [ ] Multi-issuer trust roots / key transparency
- [ ] Optional ledger anchors as one permanence kind (never required)
- [ ] Mark **Candidate** then **Stable** after two independent runtimes pass the same corpus
