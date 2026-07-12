# Architecture (overview)

```text
┌─────────────────────────────────────────────────────────────┐
│ Agent hosts (local, offline, IDE, hosted, or custom)        │
└───────────────────────────────┬─────────────────────────────┘
                                │ pack / mint
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  .skill package (ZIP)                                         │
│  skill.json + workflow + knowledge + signatures/             │
│  identity = package_digest                                    │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  @dot-skill/runtime       │   │  @dot-skill/registry        │
│  inspect / dry-run / run  │   │  free transparency log      │
│  → SkillRun               │   │  → PermanenceAnchor         │
└───────────────────────────┘   └─────────────────────────────┘
```

**Complementary, not competing:**

- **MCP** — how agents call tools  
- **A2A** — how agents delegate to agents  
- **`.skill`** — reusable *procedure + knowledge* with integrity  

Adapters bind abstract capabilities to MCP/host tools at runtime.
