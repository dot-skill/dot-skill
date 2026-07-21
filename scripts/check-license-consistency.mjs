#!/usr/bin/env node
/**
 * Fails if the project's declared license drifts between LICENSE files,
 * package.json "license" fields, and docs that state what the project is
 * licensed under. Source of truth: root package.json "license" (must match
 * the Apache License 2.0 text in LICENSE).
 *
 * Deliberately does NOT flag:
 * - Historical mentions ("was MIT", "Prior MIT-licensed npm releases",
 *   CHANGELOG entries about the old MIT era).
 * - SPDX examples in protocol docs (e.g. manifest.license may be "MIT").
 * - Example skill frontmatter under examples/ (those declare the *skill*'s
 *   license, not this repo's).
 * - Dependency licenses inside package-lock.json / node_modules.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = false;
function fail(msg) {
  console.error(`::error::${msg}`);
  failed = true;
}

const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const expected = rootPkg.license;
if (expected !== "Apache-2.0") {
  fail(
    `package.json "license" is "${expected}" — expected "Apache-2.0" (update this script if the project deliberately relicenses again).`,
  );
}

const licenseFiles = [
  "LICENSE",
  ...readdirSync(join(root, "packages"))
    .filter((name) => statSync(join(root, "packages", name)).isDirectory())
    .map((name) => join("packages", name, "LICENSE")),
];
for (const rel of licenseFiles) {
  const text = readFileSync(join(root, rel), "utf8");
  if (!text.includes("Apache License") || !/Version 2\.0/.test(text)) {
    fail(`${rel}: expected Apache License Version 2.0 text.`);
  }
  if (/^\s*MIT License\b/m.test(text) || /\bPermission is hereby granted, free of charge\b/.test(text)) {
    fail(`${rel}: still contains MIT license text — should be Apache-2.0.`);
  }
}

const pkgJsonPaths = [
  "package.json",
  ...readdirSync(join(root, "packages"))
    .filter((name) => statSync(join(root, "packages", name)).isDirectory())
    .map((name) => join("packages", name, "package.json")),
];
for (const rel of pkgJsonPaths) {
  const pkg = JSON.parse(readFileSync(join(root, rel), "utf8"));
  if (pkg.license !== expected) {
    fail(`${rel}: "license" is "${pkg.license}", expected "${expected}".`);
  }
}

// High-signal current-tense claims that previously drifted on main.
const simpleClaims = [
  { re: /\[MIT\]\(\.\/LICENSE\)/i, why: "README-style '[MIT](./LICENSE)' badge/link" },
  { re: /\[MIT License\]\([^)]*LICENSE\)/i, why: "'[MIT License](...LICENSE)' link" },
  { re: /under the MIT License/i, why: "'under the MIT License'" },
  { re: /open source under the MIT\b/i, why: "'open source under the MIT'" },
  { re: /Code:\s*\[?MIT\b/i, why: "CONTRIBUTING-style 'Code: MIT'" },
];

function isHistoricalOrExample(line) {
  return (
    /\bwas\b.*\bMIT\b|\bPrior MIT\b|\brelicense\b|\bformerly\b|\bAdded MIT licensing\b/i.test(line) ||
    /e\.g\.|for example|SPDX|manifest\.license/i.test(line) ||
    /`"[^`]*MIT[^`]*"`|"MIT"|"Apache-2\.0"/i.test(line)
  );
}

function walkMarkdown(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkMarkdown(full, files);
    else if (entry.endsWith(".md")) files.push(full);
  }
  return files;
}

const mdFiles = walkMarkdown(root).filter((f) => {
  const rel = relative(root, f);
  return (
    !rel.startsWith("node_modules/") &&
    !rel.includes("/node_modules/") &&
    !rel.startsWith("examples/")
  );
});

for (const file of mdFiles) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isHistoricalOrExample(line)) continue;
    for (const { re, why } of simpleClaims) {
      if (re.test(line)) {
        fail(`${rel}:${i + 1}: ${why} — project is ${expected}. Offending line: ${line.trim().slice(0, 120)}`);
      }
    }
  }
}

if (failed) {
  console.error("\ncheck-license-consistency: FAILED, see errors above.");
  process.exit(1);
}
console.log(
  `check-license-consistency: OK, LICENSE files + package.json license fields + docs agree on ${expected}.`,
);
