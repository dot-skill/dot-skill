# Open `.skill` Protocol

**Status:** Draft 0.4.0  
**Extension:** `.skill`  
**Media type:** `application/vnd.dot-skill+zip`

Markdown is never the protocol. A `.skill` is a deterministic ZIP with typed inputs, workflow, knowledge, redacted journey provenance, optional generation token usage, and mint attestation.

## Profiles

| Profile | Compile if incomplete? | Mint? |
|---|---|---|
| `continuity` | Soft gaps OK; hard gaps refuse | No |
| `release` | **Refuse** (`compile_refused`) | Yes, when complete + approved |

## Required components (release)

1. **Agent context** — declared agent host, provider, model, and deployment when known
2. **Intent** — what the skill is for  
3. **Sections** — ≥1 agent-authored unit  
4. **Knowledge / prompts** — reusable payload  
5. **Workflow** — actionable steps (or derived instruct graph)  
6. **Inputs declared** — typed slots or explicit generalization  
7. **Journey** — redacted human+AI summary (no raw chat)  
8. **Human approvals** — before mint  

Optional: `generation_usage` (tokens).

## Agent provenance

Reference creation paths require an agent host declaration (CLI with
`SKILL_HOST`, an IDE extension, or an app wrapping `@dot-skill/core`). Local
and offline model hosts are supported. These fields are self-reported
provenance; they do not prove that a named model performed the work.

## Local workspace

`.skill/` working tree: `sections/`, stage index, compile → package. See [WORKSPACE.md](./WORKSPACE.md).

## Container

```text
example.skill
├── skill.json
├── workflow.json
├── knowledge/
├── prompts/
├── resources/
├── artifacts/
├── provenance/          # journey + usage + compilation_report
└── signatures/          # attestation + optional anchors
```

## Integrity & trust

- Canonical JSON for the package index: JCS-inspired serialization · Digests: `sha256:<hex>`
- `package_digest` excludes `skill.json` and `signatures/**`
- **Valid** = package structure + digests
- **Minted** = signed creation attestation; the bundled development signer is
  self-asserted and is not production identity proof

## Source adapters

External source models map into **section / SkillSource / compile** through adapters. See [ADAPTERS.md](./ADAPTERS.md).

Distribute the compiled `.skill` file directly or through a compatible registry.
