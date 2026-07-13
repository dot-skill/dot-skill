# `@dot-skill/registry`

Optional **local transparency log** for `.skill` package digests.

Records package digests for auditability. This is not a marketplace, not a hosted registry, and not required to create or run skills. Share `.skill` files directly; use the log when you want a local digest trail.

## Install

```bash
npm i @dot-skill/registry
```

CLI:

```bash
skill registry list
skill registry lookup <digest>
skill registry publish <file.skill>
```

## Related

- [`@dot-skill/core`](https://www.npmjs.com/package/@dot-skill/core) — digests and mint
- [`skillerr`](https://www.npmjs.com/package/skillerr) — `skill registry …`

Docs: [REGISTRY.md](https://github.com/dot-skill/dot-skill/blob/main/docs/REGISTRY.md)

## License

MIT
