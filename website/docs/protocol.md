# Open `.skill` Protocol

**Brand:** Skillerr · **Site:** [skillerr.com](https://skillerr.com)  
**Status:** Draft 0.5.0  
**Extension:** `.skill`  
**Container:** sealed ZIP

Skillerr defines an open protocol and portable `.skill` format so AI apps and agents can author, inspect, version, and run skills interoperably. The `skillerr` CLI is the reference implementation — not the definition of the protocol.

A conforming **host** is any runtime that loads a `.skill` artifact according to this specification. Independent conforming implementations are welcome.

A `.skill` is a deterministic ZIP: typed inputs, executable workflow, pinned knowledge, redacted journey provenance, optional generation token usage, integrity digests, and mint attestation.

Markdown is never the protocol. `skill to-skill-md` is a lossy adapter only.

## Host requirements (summary)

Keywords follow RFC 2119.

- A conforming host **MUST** reject invalid `.skill` artifacts (structure / digest failure).
- A conforming host **SHOULD** expose TrustView (digests, seals, issuer class) before execute.
- A conforming host **MUST NOT** treat markdown `SKILL.md` as the protocol artifact.
- Implementations **MAY** offer additional UI beyond the protocol.
- Claim conformance only against the published test suite and fixtures when available.

## Why a host implements it

| Need | Protocol answer |
|------|-----------------|
| Move a skill between tools | One sealed artifact with digests — not a transcript dump |
| Author with AI agents | Structured sections + completeness gates; humans approve release |
| Run safely | Inspect TrustView / digests / seals **before** execute |
| Hand off mid-work | Continuity profile packages gaps without minting a fake release |
| Ship a reusable procedure | Release profile refuses incomplete contracts (`compile_refused`) |

## Profiles

| Profile | Compile if incomplete? | Mint? |
|---------|------------------------|-------|
| `continuity` | Soft gaps OK; hard gaps refuse | No |
| `release` | **Refuse** (`compile_refused`) | Yes, when complete + approved |

## Vocabulary

| Term | Meaning |
|------|---------|
| **Author** | Human or agent producing sections / skills |
| **Host** | AI app / IDE / runtime that loads and may execute `.skill` |
| **Consumer** | Team relying on portable skills across hosts |
| **Reference CLI** | `skillerr` |
| **section** | Atomic authored unit (decision, integration, lesson, …) |
| **SkillSource** | Structured authoring input before compile |
| **SkillContract** | Transferable semantic contract (0.5+) — source of truth for release |
| **extract / segment** | Identify candidates → incomplete contract scaffolds + missing reports |
| **compile** | Source → `.skill` package (continuity or release) |
| **mint** | Seal a complete release with creation attestation |
| **load** | Resume continuity context in another agent or host |
| **TrustView** | Seal / issuer / digest trust state without executing the skill |

## Required components (release)

1. **Agent context** — declared host, provider, model, deployment when known  
2. **SkillContract** — complete 0.5 semantic source of truth  
3. **Intent and triggers** — purpose and when to apply  
4. **Typed inputs and outputs** — schemas, optionality, defaults, sensitivity, ask / approval policy  
5. **Workflow** — ordered steps, branches, decisions, failure / recovery edges  
6. **Safety boundary** — capabilities, permissions / consent, forbidden actions  
7. **Verification** — domain assertions and evidence expectations  
8. **Learning and provenance** — corrections, evidence, limitations, redacted journey  
9. **Human semantic review** — recorded actor, time, and scope (never inferred from a flag)

Every list declaration is `specified`, explicit `none`, or explicit `not_applicable`. Ambiguous omission refuses release.

## Container layout

```text
example.skill
├── skill.json           # manifest, digests, profile, completeness
├── workflow.json        # runnable steps
├── knowledge/           # pinned decisions / rules
├── prompts/
├── resources/
├── artifacts/
├── provenance/          # journey + usage + compilation_report
└── signatures/          # mint attestation (release)
```

## Integrity

- Canonical JSON for the package index (JCS-inspired) · Digests: `sha256:<hex>`
- `package_digest` excludes `skill.json` and `signatures/**`
- **`sealed_manifest_digest`** binds identity + permissions / policy / capabilities + content claims inside the creation seal
- **Valid** = structure + digests  
- **Minted** = signed creation attestation  
- Digests and seals are **inspectable without executing** (`skill inspect --trust` in the reference CLI)

## Continuity vs release

| | Continuity | Release |
|---|------------|---------|
| Purpose | Portable work context between agents / hosts | Reusable sealed procedure |
| Partial content | Allowed; completeness report lists gaps | Must be complete or refuse |
| Secrets | Refs only; redacted journey | Same + attestation |
| Mint | Never | After complete approved compile |

Continuity packages are the handoff object — not raw transcripts or credentials.

## Agent provenance (protocol fact)

Creation paths require a declared agent host (`SKILL_HOST`, IDE extension, or app wrapping core APIs). Denylisted hosts (`human`, `cli`, `shell`, `manual`, …) cannot mint. Declared host alone is **self_reported** — never `verified_issuer` trust. Public-dev HMAC seals are labeled `development`.

## Contract tooling

Published SkillContract schema ships with the Skillerr reference implementation.

Reference CLI helpers:

```bash
skill contract-template
skill contract-check contract.json --profile release
```

## Distribution

Share the compiled `.skill` file directly, or use a compatible registry. An optional local transparency log ships with the reference CLI (`skill registry …`). Hosted registries are out of scope for the protocol itself.
