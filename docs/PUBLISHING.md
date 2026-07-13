# Publishing to npm

Based on [npm-publish](https://docs.npmjs.com/cli/v8/commands/npm-publish).

## Public install (document this only)

```bash
npm i -g skillerr
```

Bin: `skill` (also `skillerr`). One-shot: `npx -y skillerr --help`.

### npm ownership

| Package | Maintainer | Notes |
|---------|------------|-------|
| `skillerr` | `csinye` | **Public install** — unscoped meta package, bins `skill` / `skillerr` |
| `@skillerr/*` | `csinye` (via `@skillerr` org) | Protocol libraries + CLI implementation |
| `dot-skill` (unscoped) | `titanwings` | **Not ours** — different product; do not install |
| `skill` (unscoped) | `tonglei100` | **Taken** — do not use |

Do **not** document `npm i -g dot-skill`, `npm i -g skill`, or scoped `@skillerr/…` as the public end-user install. Users install **`skillerr`** only. App authors may depend on `@skillerr/protocol`, `@skillerr/core`, and `@skillerr/runtime`.

Re-check anytime:

```bash
npm view skillerr name version repository maintainers
npm view @skillerr/cli name version
npm view skill name version maintainers
npm view dot-skill name version repository maintainers
```

## One-time setup

```bash
npm login
npm whoami
```

Create the `@skillerr` npm organization (https://www.npmjs.com/org/create) if it does not exist, then ensure `csinye` is an owner.

## What gets published

Root is `"private": true`. Publish in order:

| Order | Package |
|------|---------|
| 1 | `@skillerr/protocol` |
| 2 | `@skillerr/core` |
| 3 | `@skillerr/runtime` |
| 4 | `@skillerr/registry` |
| 5 | `@skillerr/workspace` |
| 6 | `@skillerr/cli` |
| 7 | `skillerr` |

Skip unscoped `dot-skill` and `skill` (owned by others). Scoped `@skillerr/*` packages use `"publishConfig": { "access": "public" }`. Unscoped `skillerr` needs no org.

After publishing `@skillerr/*`, deprecate the old `@dot-skill/*` packages:

```bash
npm deprecate @dot-skill/protocol@"*" "Moved to @skillerr/protocol — npm i @skillerr/protocol"
npm deprecate @dot-skill/core@"*" "Moved to @skillerr/core — npm i @skillerr/core"
npm deprecate @dot-skill/runtime@"*" "Moved to @skillerr/runtime — npm i @skillerr/runtime"
npm deprecate @dot-skill/registry@"*" "Moved to @skillerr/registry — npm i @skillerr/registry"
npm deprecate @dot-skill/workspace@"*" "Moved to @skillerr/workspace — npm i @skillerr/workspace"
npm deprecate @dot-skill/cli@"*" "Moved to @skillerr/cli; end users: npm i -g skillerr"
```

## Dry run / publish

```bash
npm i && npm run build
npm pack -w skillerr --dry-run
npm publish -w @skillerr/protocol --access public
npm publish -w @skillerr/core --access public
npm publish -w @skillerr/runtime --access public
npm publish -w @skillerr/registry --access public
npm publish -w @skillerr/workspace --access public
npm publish -w @skillerr/cli --access public
npm publish -w skillerr
```

OTP: `--otp=123456`.

## Verify

```bash
npm i -g skillerr
skill --help
```
