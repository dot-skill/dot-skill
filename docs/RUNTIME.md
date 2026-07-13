# Runtime

Lifecycle: LoadAndVerify → TrustView → NegotiateCapabilities → ResolveInputs → Consent → Execute → Verify → EmitSkillRun.

Modes: `inspect`, `explain`, `dry_run`, `execute`, `resume`.

## Trust gate

- `execute` / `resume` refuse unsigned, open, development (public-dev HMAC), and self_reported seals unless `allow_untrusted` / `--allow-untrusted`
- Public-dev HMAC never counts as production trust

## Capability deny-by-default

- Network tools require `policy.allow_network` and a declared network permission
- Filesystem tools must stay within `filesystem_roots` / permission `paths` when declared
- Secret slots must be declared; undeclared secret access is refused
- Missing consent callbacks fail closed for side effects in `consent_for` / `requires_consent`

Fail clearly when required capabilities or minted trust profiles are unmet. Never silently degrade.
