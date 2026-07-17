/**
 * Per-user default issuer key: the zero-setup signing key that makes a
 * public transparency URL frictionless (the public Rekor log needs a key
 * but no login). These tests are fully hermetic: every path is an injected
 * temp dir, so nothing touches the real ~/.skillerr.
 */
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  loadDefaultIssuer,
  loadOrCreateDefaultIssuer,
  issuerKeyIdFor,
  signerFromIssuer,
  generateEd25519KeyPair,
} from "./default-issuer.js";
import { loadTrustStore } from "./trust-store.js";
import { derivePublicKeyPem } from "./signer.js";

function tmp(): { keyPath: string; trustStorePath: string } {
  const dir = mkdtempSync(join(tmpdir(), "skillerr-issuer-"));
  return { keyPath: join(dir, "issuer-key.pem"), trustStorePath: join(dir, "trust-store.json") };
}

test("loadOrCreateDefaultIssuer: first call generates + persists (0600) + pins; nothing pre-existed", () => {
  const { keyPath, trustStorePath } = tmp();
  assert.equal(loadDefaultIssuer(keyPath), undefined, "no key should exist yet");

  const issuer = loadOrCreateDefaultIssuer({ keyPath, trustStorePath });
  assert.equal(issuer.created, true);
  assert.equal(issuer.pinned, true);
  assert.ok(existsSync(keyPath), "private key file written");
  // Private key is secret-scoped.
  assert.equal(statSync(keyPath).mode & 0o777, 0o600);
  // Public key was pinned in the trust store under the derived key id.
  const store = loadTrustStore(trustStorePath);
  assert.equal(store.keys.length, 1);
  assert.equal(store.keys[0]!.key_id, issuer.key_id);
  assert.equal(store.keys[0]!.public_key_pem, issuer.public_key_pem);
});

test("loadOrCreateDefaultIssuer: second call reuses the same key, does not regenerate or duplicate the pin", () => {
  const { keyPath, trustStorePath } = tmp();
  const first = loadOrCreateDefaultIssuer({ keyPath, trustStorePath });
  const firstPem = readFileSync(keyPath, "utf8");

  const second = loadOrCreateDefaultIssuer({ keyPath, trustStorePath });
  assert.equal(second.created, false, "must not regenerate");
  assert.equal(second.pinned, false, "already pinned, no new pin");
  assert.equal(second.key_id, first.key_id, "stable key id across calls");
  assert.equal(readFileSync(keyPath, "utf8"), firstPem, "private key unchanged on disk");
  assert.equal(loadTrustStore(trustStorePath).keys.length, 1, "no duplicate trust-store entry");
});

test("issuerKeyIdFor is deterministic from the public key and matches a derived signer", () => {
  const { privateKeyPem, publicKeyPem } = generateEd25519KeyPair();
  const id1 = issuerKeyIdFor(publicKeyPem);
  const id2 = issuerKeyIdFor(publicKeyPem);
  assert.equal(id1, id2);
  assert.match(id1, /^skillerr-issuer-[0-9a-f]{12}$/);
  // Deriving the public key from the private half reproduces the same id.
  assert.equal(issuerKeyIdFor(derivePublicKeyPem(privateKeyPem)), id1);
});

test("signerFromIssuer produces a usable Ed25519 signer bound to the issuer key id", () => {
  const { keyPath, trustStorePath } = tmp();
  const issuer = loadOrCreateDefaultIssuer({ keyPath, trustStorePath });
  const signer = signerFromIssuer(issuer);
  assert.equal(signer.key_id, issuer.key_id);
  assert.equal(signer.sig_alg, "ed25519-v1");
  const sig = signer.sign("sha256:" + "a".repeat(64));
  assert.ok(sig.length > 0, "signer returns a signature");
});
