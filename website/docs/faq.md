# FAQ

## What is Skillerr?

Skillerr defines an open protocol and portable **`.skill`** format so AI apps and agents can author, inspect, version, and run skills interoperably. Site: [skillerr.com](https://skillerr.com).

## What is the Open `.skill` Protocol?

An open specification for **portable AI skills**: a sealed `.skill` package with typed inputs, workflow, pinned knowledge, redacted journey provenance, integrity digests, and optional mint attestation. Conforming hosts adopt the same create / ingest / trust / run lifecycle.

## What is the `skillerr` package?

[`skillerr`](https://www.npmjs.com/package/skillerr) is the **reference implementation** CLI (bin: `skill`) — one conforming surface for create, inspect, and run. The protocol is not limited to this package; hosts may integrate the Skillerr protocol libraries or ship an independent conforming port.

## How do I use it?

Install once, then **talk to your AI** — paste a prompt that points the agent at create, inspect, load, or handoff. You review and approve releases.

```bash
npm i -g skillerr
```

See [Getting started](/getting-started).

## Why would an app implement the protocol?

So skills are interoperable: one artifact moves between tools with inspectable digests, TrustView before execute, continuity handoffs, and release completeness gates — instead of proprietary chat dumps or free-form markdown alone.

## How is this different from `SKILL.md`?

Structured package + digests + mint + continuity handoff + release compile gates. Markdown is a lossy adapter only (`skill to-skill-md`).

## Continuity vs release?

- **Continuity** — work handoff between agents or hosts (partial OK, not mintable).  
- **Release** — complete reusable skill or `compile_refused`.

## Who creates skills?

Agents create (declared host required). Humans install once, prompt the agent, review and approve release compilation. Declared host/model provenance is self-reported unless a verified issuer is configured.

## Can I set `SKILL_HOST=human`?

No. Denylisted hosts (`human`, `cli`, `shell`, `manual`, …) cannot mint. Do not fake a human host.

## How do I create a skill?

Ask your agent (see [Getting started](/getting-started)). The agent sets `SKILL_HOST` and runs `init` → `propose` → `checkpoint` or `compile --approve --mint`. Prefer exact human-approved section bodies. See [Create a skill](/create-a-skill) and [Agents](/agents).

## How do I ingest or run a skill?

Ask your agent to inspect first, then validate, then dry-run. See [Ingest a skill](/ingest-a-skill).

## Where do I publish?

Share the `.skill` file directly. Optional local transparency log: `skill registry …`. Hosted registries are out of scope for the protocol.

## Do I need a blockchain?

No. Optional ledger anchors may appear later as one permanence kind — never required.

## Is this production-final?

Public **draft** (0.5.0). Digests and inspect-before-run are real. The bundled reference mint HMAC is **development-only** — replace with real keys for production issuers. Do not treat the public-dev signer as production identity proof.

## Do local / offline agents work?

Yes. Ask your agent to set `SKILL_HOST` / provider / model / deployment for Ollama, LM Studio, llama.cpp, and similar. Runtime dry-run stays local; model invocation in execute mode needs a host adapter.

## What does unsigned mean?

**Untrusted.** Execute refuses unless the host explicitly allows untrusted run.

## Can a seal prove which local model wrote the skill?

No. A seal proves which key signed which claims. Local LLMs can still misreport authorship. See [Trust and security](/trust-and-security).
