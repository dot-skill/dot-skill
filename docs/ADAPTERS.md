# Source adapters

Adapters convert external source models into protocol `SkillSource` and
`SkillContract` structures.

| Protocol operation | Adapter responsibility |
|---|---|
| `SkillSource` | Preserve source, section, agent, and journey provenance |
| `SkillContract` | Explicitly map every transferable semantic declaration |
| `compileSkillSource` | Compile the normalized source |
| `checkpoint` | Export a continuity handoff |
| `mint` | Attest an approved release package |

## Adapter rule

1. Map external data to `SkillSource`.
2. Preserve stable source references without secrets.
3. Keep multi-skill segmentation in the adapter/AI: identify candidates, then call `skill extract` / `extractSkillCandidates` to emit evidence refs and incompleteness assessments (one workspace per skill).
4. Assess the selected contract before compile (`skill contract-check`).
5. Call `compileSkillSource` / CLI.
6. Never fork a second package format.

A 0.4 adapter that supplies sections but no contract is intentionally lossy.
It can produce continuity handoffs but cannot claim release semantic
completeness.
