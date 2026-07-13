# Fixtures

Conformance `.skill` packages built from the [dot-skill/dot-skill](https://github.com/dot-skill/dot-skill) examples tree. Use them to inspect TrustView, validate digests, and dry-run without inventing your own packages.

Build and test locally:

```bash
cd website && npm run fixtures:build && npm run fixtures:test
```

## Download

| Fixture | Profile | Description |
|---------|---------|-------------|
| [knowledge-only.skill](/fixtures/knowledge-only.skill) | continuity | Legacy adapter source — knowledge sections |
| [parameterized-integration.skill](/fixtures/parameterized-integration.skill) | continuity | Typed inputs + integration workflow |
| [code-changing.skill](/fixtures/code-changing.skill) | continuity | Code-change workflow fixture |
| [contract-foundation.skill](/fixtures/contract-foundation.skill) | release | Full SkillContract release compile |

Each file is a sealed ZIP. Inspect with:

```bash
skill inspect ./contract-foundation.skill --trust
skill validate ./contract-foundation.skill
skill run ./contract-foundation.skill
```

## Source paths (repo)

| Source | Kind |
|--------|------|
| `examples/knowledge-only/recipe.json` | Legacy adapter |
| `examples/parameterized-integration/recipe.json` | Legacy adapter |
| `examples/code-changing/recipe.json` | Legacy adapter |
| `examples/contract-foundation/source.json` | SkillContract release |
| `examples/multi-skill-extract/journey.json` | `skill extract` input |

Multi-skill identify (journey only — not a `.skill` download):

```bash
skill agent-guide
skill extract examples/multi-skill-extract/journey.json -o /tmp/skillerr-extract
```

## Manifest index

After build, see [fixtures/manifest.json](/fixtures/manifest.json) for `skill_id`, `package_digest`, and completeness reports.

## Honest trust note

Reference fixtures use the **public-dev HMAC** mint class when minted — development-only, not production identity. Always inspect TrustView before run. Details: [Trust and security](/trust-and-security).
