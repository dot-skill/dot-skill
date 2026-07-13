# Examples

Fixture sources for compile / pack tests.

| Path | Kind | Notes |
|------|------|-------|
| `knowledge-only/` | Legacy adapter source (`recipe.json`) | Continuity pack fixture |
| `parameterized-integration/` | Legacy adapter source | Continuity pack fixture |
| `code-changing/` | Legacy adapter source | Continuity pack fixture |
| `contract-foundation/` | `SkillSource` / contract (`source.json`) | Release compile fixture |
| `multi-skill-extract/` | Redacted journey (`journey.json`) | `skill extract` / `segment` fixture |

Protocol vocabulary is **section / SkillSource / SkillContract / compile**.
Legacy `recipe.json` fixtures exercise the adapter path only.

Multi-skill identify path:

```bash
node packages/cli/dist/cli.js agent-guide
node packages/cli/dist/cli.js extract examples/multi-skill-extract/journey.json -o /tmp/skillerr-extract
```
