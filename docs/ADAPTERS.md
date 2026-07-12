# Source adapters

Adapters convert external source models into the protocol's `SkillSource` structure.

| Protocol operation | Adapter responsibility |
|---|---|
| `SkillSource` | Map source content into typed sections and inputs |
| `compileSkillSource` | Compile the normalized source |
| `checkpoint` | Export a continuity handoff |
| `mint` | Attest an approved release package |

## Adapter rule

1. Map external data to `SkillSource`.
2. Preserve stable source references without secrets.
3. Call `compileSkillSource` / CLI.
4. Never fork a second package format.
