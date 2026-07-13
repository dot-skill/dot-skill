# Runtime

Lifecycle: LoadAndVerify → TrustView → NegotiateCapabilities → ResolveInputs → Consent → Execute → Verify → EmitSkillRun.

Modes: `inspect`, `explain`, `dry_run`, `execute`, `resume`.

## Trust gate

- `execute` / `resume` refuse unsigned, open, development (public-dev HMAC), and self_reported seals unless `allow_untrusted` / `--allow-untrusted`
- Public-dev HMAC never counts as production trust

## Capability deny-by-default

- Network tools require `policy.allow_network` and a declared network permission; `permission.hosts` matches the parsed hostname exactly or a `*.suffix` wildcard, never a substring — and a permission with `hosts` declared refuses any call whose target host can't be determined from its arguments
- Filesystem tools must stay within `filesystem_roots` / permission `paths` when declared; candidate paths are normalized (posix-resolve semantics) before the comparison, so `..` segments can't escape a root
- `read` requires a declared `read` permission exactly like `write`/`destructive` — it is not exempt from deny-by-default
- Secret slots must be declared; undeclared secret access is refused
- Missing consent callbacks fail closed for side effects in `consent_for` / `requires_consent`

Fail clearly when required capabilities or minted trust profiles are unmet. Never silently degrade.
