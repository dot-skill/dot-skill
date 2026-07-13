# Workflows

Visual maps for the agent-first create, handoff, and ingest paths. Humans paste prompts; agents run the reference CLI (or host libraries with the same contract).

## Create → continuity handoff

Mid-work packages are partial OK. No mint on continuity.

```mermaid
flowchart LR
  H[Human: paste prompt] --> A[Agent sets SKILL_HOST]
  A --> I[skill init]
  I --> J[skill journey]
  J --> P[skill propose]
  P --> S[skill status]
  S --> C[skill checkpoint]
  C --> F[".skill handoff file"]
  F --> L[Next agent: skill load]
```

## Create → release

Release compile refuses incomplete contracts (`compile_refused`).

```mermaid
flowchart LR
  H[Human: approve sections] --> A[Agent: SKILL_HOST + propose]
  A --> ST[skill status]
  ST -->|complete| CP[skill compile --approve --mint]
  ST -->|missing fields| R[compile_refused]
  R --> FIX[Agent lists missing]
  FIX --> ST
  CP --> REL[".skill release + mint"]
```

## Ingest safely

Inspect TrustView before any model reads package bodies or execute runs.

```mermaid
flowchart TD
  P[".skill received"] --> INS[skill inspect --trust]
  INS --> VAL[skill validate]
  VAL --> VT[skill verify-trust]
  VT --> DR[skill run dry-run]
  DR -->|human opt-in| EX[skill run --mode execute]
  DR --> LOAD[skill load continuity]
```

## Multi-skill identify

Segmentation is not compilation. One workspace per selected candidate.

```mermaid
flowchart TD
  J[journey.json] --> G[skill agent-guide]
  G --> X[skill extract]
  X --> C1[Candidate scaffold 1]
  X --> C2[Candidate scaffold 2]
  C1 --> W1[workspace + contract-check]
  C2 --> W2[workspace + contract-check]
  W1 -->|complete| R1[compile release]
  W1 -->|partial| H1[checkpoint]
```

## `.skill` anatomy

```mermaid
flowchart TB
  subgraph pkg [example.skill sealed ZIP]
    M[skill.json manifest + digests]
    W[workflow.json]
    K[knowledge/]
    PR[provenance/]
    SG[signatures/ mint]
  end
  M --> TV[TrustView inspect]
  W --> RUN[runtime dry-run / execute]
```

## Continuity vs release

| | Continuity draft | Release skill |
|---|------------------|---------------|
| Purpose | AI↔AI work handoff | Reusable sealed procedure |
| Incomplete? | Allowed (lists gaps) | **compile_refused** |
| Mint? | No | Yes (when complete + approved) |

Prompts: [Getting started](/getting-started) · Commands: [CLI](/cli) · Trust: [Trust and security](/trust-and-security)
