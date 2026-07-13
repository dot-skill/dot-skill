# Changelog

## 0.5.0 — 2026-07-13

- Added the product-neutral `SkillContract` as the release compilation source of truth.
- Added explicit declarations for triggers, typed inputs/outputs, preconditions,
  ordered steps, branches, human decisions, capabilities, permissions/consent,
  forbidden actions, recovery, verification, corrections, and provenance.
- Added contract scaffold, assessment, explanation APIs, CLI commands, and JSON Schema.
- Preserved structured contract fields in manifests and workflows.
- Made 0.4 text-only sources explicitly lossy and continuity-only.
- Added runtime refusal for unsupported assertions/branches and authenticated
  human-decision callbacks that cannot be spoofed with input values.
- Added approved npm-publishing gold-model conformance coverage.
- Added per-package READMEs and included them in npm tarballs.
- Public install package is `skillerr` (depends on `@dot-skill/cli`, exposes `skill` / `dot-skill` bins).
- Hardened public docs and CLI help for create vs ingest paths.
- Added agent multi-skill identify path: `skill agent-guide`, `skill extract` / `skill segment`,
  protocol `extractSkillCandidates` / `agentCreateGuide`, and incomplete SkillContract scaffolds
  with completeness reports (one workspace per candidate; release still refuses if incomplete).

## 0.4.3 — 2026-07-13

- Derived CLI, runtime, and attestation package versions from shipped package metadata.
- Added conformance coverage for package version reporting.

## 0.4.1 — 2026-07-12

- Added local and offline agent provenance fields.
- Enforced release completeness and approval checks before minting.
- Added runtime trust-profile checks and mandatory minted signatures.
- Added privacy scrubbing for journey, prompt, and endpoint provenance.
- Added MIT licensing, DCO sign-off, and npm release documentation.

## 0.4.0 — 2026-07-12

- Added continuity and release compile profiles.
- Added completeness gates and `CompileRefusalError`.
- Added agent host provenance and optional generation usage.
- Added workspace checkpoint, load, compile, and journey commands.
- Added public npm package configuration.

## 0.3.0

- Added the protocol, core, runtime, registry, workspace, and CLI packages.
