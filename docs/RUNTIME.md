# Runtime

Lifecycle: LoadAndVerify → NegotiateCapabilities → ResolveInputs → Consent → Execute → Verify → EmitSkillRun.

Modes: `inspect`, `explain`, `dry_run`, `execute`, `resume`.

Fail clearly when required capabilities or minted trust profiles are unmet. Never silently degrade.
