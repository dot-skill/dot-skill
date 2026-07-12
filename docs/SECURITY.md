# Security

- Validate before extract; reject traversal, symlinks, bombs, hash mismatch
- Secrets never embedded — references only
- Reference mint HMAC is **not** production PKI
- Trust profiles: `open` | `minted` | `anchored` | `issuer:<id>`
- Threats: malicious packages, prompt injection via resources, tool escalation, dependency confusion

Report vulnerabilities privately — see [SECURITY.md](../SECURITY.md).
