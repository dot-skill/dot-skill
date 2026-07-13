# Launch notes

Working draft of the public launch post(s) for the **Open `.skill` Protocol**.
Protocol-first framing throughout — same principle as the site and README:
lead with the format and the problem it solves, not a product name. Copy the
relevant block for the target platform, adjust nothing but the closing line.

Not published anywhere yet. Update this file as the pitch sharpens; delete it
once the actual launch posts are live and linked from the repo instead.

---

## The one-paragraph pitch

> AI agent skills today are `SKILL.md` — unstructured prose that every model
> re-interprets differently, with no integrity check, no trust state, and no
> handoff format between agents. The **Open `.skill` Protocol** is a sealed,
> inspectable package format that sits *above* `SKILL.md`: typed contract,
> content-addressed digests, explicit trust states (`untrusted` /
> `development` / `self_reported` / `verified_issuer`), and a real AI↔AI
> continuity handoff object. It doesn't replace `SKILL.md` — `skill ingest`
> upgrades one in a single command. Reference implementation: `skillerr`
> (`npm i -g skillerr`).

---

## Show HN

**Title:** Open `.skill` Protocol – a sealed, inspectable package format for AI agent skills

**Body:**

```text
AI agent "skills" today are almost always a SKILL.md file: freeform
markdown that every model re-reads and re-interprets on its own. There's
no integrity check (a silent edit is indistinguishable from the original),
no declared trust state, and no real handoff format when work needs to
move from one agent/host to another mid-task.

The Open .skill Protocol defines a sealed package format for this instead:

- Typed contract (intent, triggers, inputs/outputs, ordered steps,
  capabilities, permissions, verification) instead of prose
- Content-addressed skill_id + SHA-256 digests — any post-pack edit is
  detectable
- Explicit trust states, never blurred: untrusted / development /
  self_reported / verified_issuer, with optional Ed25519 mint + attestation
- A real continuity profile for AI-to-AI handoff — partial work allowed,
  privacy-scrubbed journey, refuses to pretend it's a finished release
- A release profile that refuses to compile if required contract fields
  are missing — no thin fake skills

It's not a competing format to SKILL.md — it's an integrity/evaluation
layer on top. `skill ingest ./your-skill.md` upgrades an existing one in
one command and is honest about what's still missing.

Reference implementation (CLI + protocol packages) is MIT-licensed:
https://github.com/dot-skill/skillerr
Protocol docs / try it: https://dot-skill.github.io/skillerr-com/

Try it in under a minute — paste this to your coding agent:

  Run these exact commands in your terminal, in order:
  1. npm i -g skillerr
  2. export SKILL_HOST=<your-tool-name>   (e.g. claude-code, cursor, codex)
  Then, from this conversation, create a portable .skill from what we just
  built: redacted journey, exact sections I approve. Show me the output path.

Feedback on the contract schema and trust-state model especially welcome —
still Draft 0.5.0, and the RFC folder (docs/rfcs/) is open for discussion.
```

---

## X / Twitter thread

**Post 1:**
```text
SKILL.md files are freeform prose. Every model re-interprets them
differently, no integrity check, no trust state, no real handoff format.

We built the Open .skill Protocol: a sealed, inspectable package format
for AI agent skills. Doesn't replace SKILL.md — sits on top of it.

🧵
```

**Post 2:**
```text
What a sealed .skill adds over bare SKILL.md:

→ Typed contract, not prose
→ SHA-256 digests — edits after packing are detectable
→ Explicit trust states (untrusted/development/self_reported/verified_issuer)
→ Continuity handoff object for AI↔AI work-in-progress
→ Release compile refuses to ship an incomplete contract
```

**Post 3:**
```text
Already have a SKILL.md? One command upgrades it — never fabricates
completeness it can't back up:

npm i -g skillerr
export SKILL_HOST=<your-tool>
skill ingest ./SKILL.md

Reference CLI + protocol, MIT-licensed: [repo link]
Docs + try it: [site link]
```

---

## Reddit (r/LocalLLaMA, r/MachineLearning, similar)

**Title:** Open `.skill` Protocol — sealed package format for AI agent skills, works with local/offline models too

**Body:** Reuse the Show HN body verbatim; add this paragraph before the
"Try it" block, since local-model users care about this specifically:

```text
Local/offline agents (Ollama, LM Studio, llama.cpp, custom runtimes) are
first-class — provenance fields are self-reported either way, so there's
no cloud-provider dependency baked into the trust model. See
docs/LOCAL_AGENTS.md in the repo for the exact env vars.
```

---

## Checklist before actually posting

- [ ] Confirm `npm i -g skillerr` installs the version this post describes
      (currently package.json version `0.6.0`, protocol `Draft 0.5.0`)
- [ ] Confirm site (`https://dot-skill.github.io/skillerr-com/`) and repo
      (`https://github.com/dot-skill/skillerr`) links are both live
- [ ] Repo social-preview image set (Settings → General → Social preview,
      using `assets/og-banner.png`) — no public API for this, manual step
- [ ] Post Show HN first; wait to see if it gets traction before firing the
      Twitter/Reddit threads, per usual HN etiquette (avoid looking like a
      coordinated multi-platform blast)
- [ ] Have someone other than the author monitor the HN thread for the
      first hour — technical questions about the trust-state model and
      the contract schema are the most likely early questions
