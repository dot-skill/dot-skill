# Contributing to the Open `.skill` Protocol

Contributions are **welcome**. This protocol only becomes real if independent people implement, break, and improve it.

## DCO (required)

Every commit must be signed off (Developer Certificate of Origin):

```bash
git commit -s -m "feat: …"
```

See [DCO.md](./DCO.md). The DCO sign-off records that you may submit the
change under the MIT License.

## Ways to contribute

| Kind | Examples | Difficulty |
|------|----------|------------|
| **Docs** | Fix typos, clarify FAQ, add diagrams | Easy |
| **Examples** | New golden `.skill` fixtures | Easy |
| **Tests** | Conformance cases, adversarial packages | Medium |
| **Adapters** | Host loaders, MCP bridge, `SKILL.md` export | Medium |
| **Runtime** | Additive step kinds, verify language | Medium |
| **Security** | Real signing (replace dev HMAC) | Hard |
| **Spec RFCs** | Additive fields, version bumps | Hard |

## Dev setup

```bash
git clone https://github.com/dot-skill/dot-skill.git
cd dot-skill
npm install
npm test
```

```bash
npm run skill -- --help
```

## Pull request checklist

- [ ] Commits are DCO signed (`Signed-off-by`)
- [ ] `npm test` passes
- [ ] Spec/docs updated if behavior changes
- [ ] New protocol behavior has a conformance fixture
- [ ] No secrets in examples
- [ ] Prefer **additive** changes
- [ ] If AI-assisted, say so in the PR (you remain responsible for the change)

## Spec changes (RFCs)

1. Open an issue with label `rfc` (or PR `docs/rfcs/NNNN-title.md`)
2. Motivation, schema diff, migration, fixtures
3. Discuss before merging breaks


## License

- Code: [MIT](./LICENSE) — [docs/LICENSING.md](./docs/LICENSING.md)
- Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security: [SECURITY.md](./SECURITY.md)
