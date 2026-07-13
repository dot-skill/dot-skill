# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.5.x   | Yes (draft) |
| 0.4.x   | Yes (draft, maintenance) |
| < 0.4   | No |

## Reporting

Use GitHub's private vulnerability reporting for this repository. Do not open
public issues with exploit details. If private reporting is unavailable, open
a public issue containing only a request for a private contact channel and no
sensitive details.

We aim to acknowledge within 72 hours.

## Practice

Inspect with `skill inspect --trust` before execute. Digests and seals are
visible without running workflow steps or feeding package bodies to a model.
Unsigned packages are untrusted; public-dev HMAC is development-only — never
production trust. Runtime denies undeclared network/FS/secret use by default.
See [docs/SECURITY.md](./docs/SECURITY.md).
