# Local and offline agents

The `.skill` toolchain performs workspace, compile, mint, validation, handoff,
and dry-run operations locally. It does not require a hosted model API.

Any local agent that can invoke a CLI or the TypeScript API can create skills.
Examples include Ollama, LM Studio, llama.cpp servers, local IDE agents, and
OpenAI-compatible services on localhost.

## Ollama example

```bash
export SKILL_HOST=ollama
export SKILL_PROVIDER=ollama
export SKILL_MODEL=llama3.2
export SKILL_DEPLOYMENT=local
export SKILL_ENDPOINT=http://127.0.0.1:11434/v1

skill init --title "Local handoff"
skill journey --summary "Redacted summary of the human and agent work."
skill propose --json '[
  {"title":"Decision","body":"Use retries.","type":"decision"},
  {"title":"Workflow","body":"Call {{base_url}} and verify the response.","type":"integration"}
]'
skill checkpoint -m "Work in progress"
skill compile -m "Local handoff" --approve --mint
```

For LM Studio or llama.cpp, change `SKILL_HOST`, `SKILL_PROVIDER`,
`SKILL_MODEL`, and `SKILL_ENDPOINT` to match the local runtime.

## Provenance fields

- `SKILL_HOST`: application or agent invoking the protocol
- `SKILL_PROVIDER`: model provider or runtime family
- `SKILL_MODEL`: model identifier
- `SKILL_DEPLOYMENT`: `local`, `hosted`, `hybrid`, or `unknown`
- `SKILL_ENDPOINT`: optional endpoint identifier; never include credentials

These values are self-reported provenance. The reference development
attestation does not cryptographically prove which model produced the work.

## Execution

`skill run` defaults to `dry_run`. Prompt and instruction steps are returned
to the calling host. Model invocation in execute mode requires a host adapter;
the core protocol does not make network calls.
