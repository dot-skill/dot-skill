# Integration notes for `skillerr-registry`

This is the only handshake between this repo and the private `skillerr-registry` product. When a capability described in [`spec/CONTRACT.md`](./spec/CONTRACT.md) becomes available in `@skillerr/core`, it's noted here with the version that shipped it. The registry side reads this and upgrades its `@skillerr/core` pin when ready — this repo never reaches into `skillerr-registry` to wire itself in.

Newest first.

## Pending release — `protocol/trust-spine` branch

Adapter layer now available in `packages/core/src/trust-spine.ts`, matching spec/CONTRACT.md's Section 3a shapes: `seal`, `openSealed`, `sign`/`verifySignature` (published-key path only, keyless not yet split out), `Anchor`/`RekorAnchor`, `capabilitiesFromPermission` (`CapabilitySchema`, `shell` scope honestly empty pending a protocol change), `evaluateReleaseProfile`. Not yet started: `buildLeaf`/`verifyInclusion`/`verifyConsistency`, the unified `verify(digest, evidence)` entry point, `generateSBOM`, `attest`, `evaluatePolicy`, `scoreSignals`, `runSandboxed`'s declared-vs-actual diff, and the generic `fromFormat`/`toFormat` bridge — see spec/CONTRACT.md's status table for what each maps onto today.

This note will be updated with the actual `@skillerr/core` version number once this branch goes through the normal release process (merge to `develop`, cut a `release/*` branch, lockstep version bump across all 7 packages, publish). Pin against a specific commit on `protocol/trust-spine` if you need to integrate before that lands.
