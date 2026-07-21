#!/usr/bin/env node
/**
 * Fails if a relative markdown link inside the repo's own docs points at a
 * path that does not exist. External URLs (http/https/mailto) and pure
 * in-page anchors (#...) are skipped. Fragment-only checks (file exists but
 * heading id missing) are out of scope — heading-id algorithms differ across
 * renderers (GitHub vs VitePress).
 *
 * Scans: root *.md, docs/ (recursive), spec/ (recursive), each packages/<name>/README.md.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));

let failed = false;
function fail(msg) {
  console.error(`::error::${msg}`);
  failed = true;
}

const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;

function collectMarkdown() {
  const files = [];
  for (const name of readdirSync(root)) {
    if (name.endsWith(".md") && statSync(join(root, name)).isFile()) {
      files.push(join(root, name));
    }
  }
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist") continue;
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith(".md")) files.push(full);
    }
  }
  walk(join(root, "docs"));
  walk(join(root, "spec"));
  for (const pkg of readdirSync(join(root, "packages"))) {
    const readme = join(root, "packages", pkg, "README.md");
    if (existsSync(readme)) files.push(readme);
  }
  return files;
}

let checked = 0;
for (const file of collectMarkdown()) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  let m;
  linkRe.lastIndex = 0;
  while ((m = linkRe.exec(text)) !== null) {
    let target = m[2].trim();
    // Optional title: [text](url "title")
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    } else {
      const sp = target.search(/\s/);
      if (sp !== -1) target = target.slice(0, sp);
    }
    target = target.replace(/^<|>$/g, "");
    if (!target || target.startsWith("#")) continue;
    if (/^(https?:|mailto:|data:)/i.test(target)) continue;

    const pathPart = target.split("#")[0];
    if (!pathPart) continue;

    // Windows-hostile abs paths / protocol-relative
    if (pathPart.startsWith("/") || pathPart.startsWith("//")) {
      // Repo-root absolute links are unusual in this project; flag them so
      // they get rewritten to relative form (portable across clones).
      fail(`${rel}: absolute/site-root link "${target}" — use a relative path.`);
      continue;
    }

    const resolved = resolve(dirname(file), normalize(pathPart));
    const resolvedRel = relative(root, resolved);
    if (resolvedRel.startsWith("..")) {
      fail(`${rel}: link "${target}" resolves outside the repository (${resolvedRel}).`);
      continue;
    }
    checked++;
    if (!existsSync(resolved)) {
      const line = text.slice(0, m.index).split(/\r?\n/).length;
      fail(`${rel}:${line}: dead link → ${target}`);
    }
  }
}

if (failed) {
  console.error("\ncheck-doc-links: FAILED, see errors above.");
  process.exit(1);
}
console.log(`check-doc-links: OK, ${checked} relative markdown link(s) resolve.`);
