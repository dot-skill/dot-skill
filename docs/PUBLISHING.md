# Publishing to npm

Based on [npm-publish](https://docs.npmjs.com/cli/v8/commands/npm-publish).

## Public install (document this only)

```bash
npm i -g skillerr
```

Bin: `skill` (also `dot-skill` → same entry). One-shot: `npx -y skillerr --help`.

### npm ownership (verified)

| Package | Maintainer | Repo | Notes |
|---------|------------|------|-------|
| `skillerr` | *(to publish)* | `dot-skill/dot-skill` | **Public install** — unscoped meta package, bin `skill` |
| `@dot-skill/cli` | `csinye <bharat.dudeja13@gmail.com>` | `dot-skill/dot-skill` | Implementation — dependency of `skillerr` (not a public install) |
| `dot-skill` (unscoped) | `titanwings <adrian.zhtianyi@gmail.com>` | `titanwings/colleague-skill` | **Not ours** — different product |
| `skill` (unscoped) | `tonglei100` | unrelated | **Taken** — do not use |

Do **not** document `npm i -g dot-skill`, `npm i -g skill`, or scoped `@dot-skill/…` as the public install. Users install **`skillerr`** only.

Re-check anytime:

```bash
npm view skillerr name version repository maintainers
npm view skill name version maintainers
npm view dot-skill name version repository maintainers
```

## One-time setup

```bash
npm login
npm whoami
```

## What gets published

Root is `"private": true`. Publish in order:

| Order | Package |
|------|---------|
| 1 | `@dot-skill/protocol` |
| 2 | `@dot-skill/core` |
| 3 | `@dot-skill/runtime` |
| 4 | `@dot-skill/registry` |
| 5 | `@dot-skill/workspace` |
| 6 | `@dot-skill/cli` |
| 7 | `skillerr` |

Skip unscoped `dot-skill` and `skill` (owned by others). Scoped `@dot-skill/*` packages use `"publishConfig": { "access": "public" }`. Unscoped `skillerr` needs no org.

## Dry run / publish

```bash
npm i && npm run build
npm pack -w skillerr --dry-run
npm publish -w @dot-skill/protocol --access public
npm publish -w @dot-skill/core --access public
npm publish -w @dot-skill/runtime --access public
npm publish -w @dot-skill/registry --access public
npm publish -w @dot-skill/workspace --access public
npm publish -w @dot-skill/cli --access public
npm publish -w skillerr
```

OTP: `--otp=123456`.

## Verify

```bash
npm i -g skillerr
skill --help
```
