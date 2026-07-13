# Skillerr docs site (VitePress)

Agent-first documentation for [skillerr.com](https://skillerr.com). Source content lives in `website-content/` at the skillerr-world root; this app builds the static site.

## Run locally

```bash
# From skillerr-world root — ensure dot-skill CLI is built
cd ../dot-skill && npm run build && cd -

cd apps/website
npm install
npm run fixtures:build   # needs DOT_SKILL_ROOT or sibling dot-skill checkout
npm run dev              # http://localhost:5173
```

## Build

```bash
npm run build            # fixtures + vitepress build → docs/.vitepress/dist
npm run preview          # serve production build
npm run fixtures:test    # validate / inspect / dry-run all fixtures
```

## Deploy (GitHub Pages)

The live deploy workflow lives in **dot-skill/dot-skill** (`.github/workflows/pages.yml`). After push to `main`, Pages serves `skillerr.com` from the built artifact.

### DNS (skillerr.com apex)

At your registrar, for apex `skillerr.com`:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Optional `www`:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `dot-skill.github.io` |

Then in GitHub → **dot-skill/dot-skill** → Settings → Pages → Custom domain: `skillerr.com` (Enforce HTTPS).

## Sync to dot-skill

```bash
./scripts/sync-to-dot-skill.sh
```
