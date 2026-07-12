# Publishing `@dot-skill/*` to npm

Based on [npm-publish](https://docs.npmjs.com/cli/v8/commands/npm-publish) (v8 docs).

Public scoped packages are **free** to publish. You need an npm account, 2FA, and (recommended) an org `dot-skill`.

## One-time setup

1. Create account: https://www.npmjs.com/signup  
2. Enable **2FA**  
3. In a terminal on this machine:

```bash
npm login
npm whoami
```

Optional later: create org `dot-skill` and add packages to it. You can publish under your username scope first, but this repo already uses `@dot-skill/*` — so claim the **`dot-skill` org** (free) or ask npm support if the name is taken.

## What gets published

Root `package.json` is `"private": true` (monorepo). Only workspaces publish:

| Order | Package |
|------|---------|
| 1 | `@dot-skill/protocol` |
| 2 | `@dot-skill/core` |
| 3 | `@dot-skill/runtime` |
| 4 | `@dot-skill/registry` |
| 5 | `@dot-skill/workspace` |
| 6 | `@dot-skill/cli` |

Each package has `"publishConfig": { "access": "public" }` because **scoped packages default to restricted** unless access is public ([docs](https://docs.npmjs.com/cli/v8/commands/npm-publish#access)).

`"files": ["dist"]` limits tarball contents. Always include LICENSE via npm’s standard rules.

## Dry run (do this first)

```bash
cd /path/to/dot-skill
npm install
npm run build
npm pack -w @dot-skill/protocol --dry-run
# or
npm publish -w @dot-skill/protocol --access public --dry-run
```

## Publish

Versions must be **new** — once `0.4.0` is published, that name@version can never be reused (even after unpublish).

```bash
npm publish -w @dot-skill/protocol --access public
npm publish -w @dot-skill/core --access public
npm publish -w @dot-skill/runtime --access public
npm publish -w @dot-skill/registry --access public
npm publish -w @dot-skill/workspace --access public
npm publish -w @dot-skill/cli --access public
```

If prompted for OTP: `--otp=123456`.

## After publish

```bash
npm i -g @dot-skill/cli
npx @dot-skill/cli --help
```

## Notes from npm docs

- Integrity hashes (sha512) are submitted automatically.  
- Prefer `--dry-run` / `npm pack` to inspect contents.  
- `--access` on first publish sets public; later access changes use `npm access`.  
- Workspaces: use `-w <name>` or `--workspaces` carefully (root is private).
