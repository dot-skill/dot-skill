# Optional local registry

`@dot-skill/registry` appends to `~/.dot-skill/registry/log.jsonl` by default.

It is an optional local transparency log and is not part of the default create path.

```bash
skill registry list
skill registry lookup sha256:…
skill registry publish path/to/file.skill   # local log only
```

Share skills by distributing the `.skill` file.
