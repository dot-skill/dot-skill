# Trust and security

A conforming host **SHOULD** expose **TrustView** (digests, seals, issuer class) before any execute path. Skills are portable; trust decisions MUST travel with the package, not with the originating app.

## Practice

1. **Inspect before run** — digests and seals without executing the skill or feeding package bodies to a model.  
2. **Validate** structure and hash integrity.  
3. **Dry-run** before execute.  
4. Treat **unsigned / open** packages as **untrusted**.  
5. Treat the reference **public-dev HMAC** mint as **development-only** — never production identity proof.

```bash
skill inspect ./file.skill --trust
skill validate ./file.skill
skill verify-trust ./file.skill
skill run ./file.skill                    # dry-run default
```

## TrustView states

| Seal situation | TrustView | Production `execute` |
|----------------|-----------|----------------------|
| Unsigned / open | `untrusted` | Refuse unless `--allow-untrusted` |
| Public-dev HMAC | `development` | Refuse (forgeable) |
| Configured key + self-reported host | `self_reported` | Refuse unless opted in |
| Configured key + verified host binding | `verified_issuer` | Allowed |

Trust profiles (protocol): `open` | `minted` | `anchored` | `issuer:<id>`.

## Seals and digests

- Digests: `sha256:<hex>`
- `package_digest` covers package content (excludes `skill.json` and `signatures/**`)
- **`sealed_manifest_digest`** binds title, intent, permissions, policy, capabilities, input sensitivity, content digests, and contract summary — not only workflow / knowledge bytes
- Creation attestation records agent host / provider / model, `host_claim_binding` (`self_reported` | `verified_issuer`), and `issuer_class` (`public_dev_hmac` | `configured_hmac` | `verified_issuer`)

Inspect without side effects:

```bash
skill inspect ./file.skill --trust
```

## SKILL_HOST and anti-spoof

- Mint **refuses** denylisted hosts: `human`, `cli`, `shell`, `manual`, `bash`, `terminal`, …
- Exporting `SKILL_HOST=cursor` alone **cannot** produce `verified_issuer` trust
- Agent runtime markers (`SKILL_AGENT_INVOCATION`, `SKILL_SESSION_ID`, IDE markers) strengthen the mint path but remain **locally spoofable**
- Seals record claim binding and issuer class so TrustView can distinguish self-reported vs verified issuer

## Runtime deny-by-default

- Undeclared network / filesystem / secret capabilities are refused
- Missing consent fails closed for side-effecting steps
- `execute` / `resume` refuse unsigned, open, public-dev HMAC, and self_reported seals unless `--allow-untrusted`

```bash
skill run ./file.skill --mode execute --allow-untrusted   # explicit unsafe opt-in
```

## Secrets

Never embed API keys, tokens, `.env`, or private customer data in sections or journey text. Use `{{refs}}` / env refs. Continuity and release packages default to shareable-redacted journey content.

## Residual risk (honest)

A seal proves which key signed which claims. It **cannot** prove that a named **local LLM** was honest about authorship. Treat host / provider / model fields as claims under that key’s honesty — especially offline and self-hosted models.

The bundled development HMAC signer (`issuer_class=public_dev_hmac`) is **never** production trust.

## Threats to keep in mind

Malicious packages, prompt injection via resources, tool escalation, dependency confusion (including similarly named npm packages). Prefer verifying package identity and digests before run.

## Reporting

For the Skillerr reference implementation, use private vulnerability reporting via [skillerr.com](https://skillerr.com). Do not open public issues with exploit details.
