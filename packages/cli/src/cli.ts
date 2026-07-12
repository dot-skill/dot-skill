#!/usr/bin/env node
/**
 * skill — Open .skill Protocol CLI
 *
 * AI agents create; humans review. Continuity drafts for handoff; release for mint.
 *
 *   export SKILL_HOST=cursor
 *   skill init --title "…"
 *   skill propose --json '[…]'
 *   skill journey --summary "…"
 *   skill checkpoint                 # continuity draft (partial OK)
 *   skill compile -m "…" --mint      # release (complete or refuse)
 *   skill load ./file.skill          # resume handoff in another AI
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  inspectSkill,
  migrateLegacySkill,
  toSkillMdAdapter,
  unpackSkill,
  validatePackageBytes,
  mintSkillPackage,
  verifyMintTrust,
  compileRecipeToSkill,
  compileSkillSource,
  approveCompilation,
  redactSecrets,
  CompileRefusalError,
} from "@dot-skill/core";
import { runSkillArchive } from "@dot-skill/runtime";
import { lookup, list, verify as registryVerify, publish as registryPublish } from "@dot-skill/registry";
import type { Recipe, SectionType, Skill, SkillSource } from "@dot-skill/protocol";
import { isValidAgentHost } from "@dot-skill/protocol";
import {
  initWorkspace,
  requireWorkspace,
  proposeSection,
  proposeMany,
  stage,
  unstage,
  status,
  compileWorkspace,
  checkpoint,
  discardSection,
  loadHead,
  loadSkillHandoff,
  setJourney,
  requireAgentHost,
} from "@dot-skill/workspace";

const VERSION = "0.4.1";

function usage(exitCode = 1): never {
  console.log(`skill — Open .skill Protocol CLI v${VERSION}

Skills record declared agent provenance. Humans review, stage, and approve releases.

Workspace:
  skill init [--title name]
  skill status                         Completeness checklist + staged sections
  skill propose --title T --body B     Agent adds a section (requires SKILL_HOST)
  skill propose --json '[...]'
  skill journey --summary "…"          Redacted human+AI journey (no secrets)
  skill add [id...]                    Stage (default: ALL)
  skill unstage [id...] | skill review | skill discard <id>
  skill checkpoint [-m msg]            Continuity draft for AI handoff (partial OK)
  skill compile -m "msg" [--approve] [--mint] [--profile release|continuity]
                                       Release compile refuses if incomplete
  skill load <file.skill>              Resume context in another AI (no private dumps)
  skill mint [--host name]             Seal release package (AI host required)

Package tools:
  skill inspect|validate|unpack|run <file.skill>
  skill pack <source.json> [-o out.skill] [--approve] [--profile release]
  skill verify-trust <file.skill> [--profile minted]
  skill registry list|lookup <digest>  Optional local log (not a public marketplace)

Env (agents):
  SKILL_HOST (required)  SKILL_PROVIDER  SKILL_MODEL  SKILL_DEPLOYMENT
  SKILL_ENDPOINT  SKILL_ACTOR  SKILL_AGENT_RUNTIME
  SKILL_INPUT_TOKENS  SKILL_OUTPUT_TOKENS  SKILL_SESSION_ID

Install: npm i -g @dot-skill/cli   or   npx @dot-skill/cli …
Why not markdown: docs/WHY.md
`);
  process.exit(exitCode);
}

function flag(args: string[], name: string): boolean {
  return args.includes(name);
}

function opt(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const rest = argv.slice(1);
  if (!cmd || cmd === "-h" || cmd === "--help") usage(0);
  if (cmd === "-V" || cmd === "--version") {
    console.log(VERSION);
    return;
  }

  switch (cmd) {
    case "init": {
      const title = opt(rest, "--title");
      const { root, created } = await initWorkspace(process.cwd(), { title });
      console.log(
        JSON.stringify(
          {
            ok: true,
            created,
            root,
            hint: created
              ? "Set SKILL_HOST, then: skill propose … → skill checkpoint | skill compile -m \"…\" --mint"
              : "Already a skill workspace",
          },
          null,
          2,
        ),
      );
      break;
    }

    case "status": {
      const root = requireWorkspace();
      const st = await status(root);
      console.log(
        JSON.stringify(
          {
            root: st.root,
            title: st.title,
            agent_host_ok: st.agent_host_ok,
            journey_summary: st.journey_summary,
            completeness: st.completeness,
            staged: st.staged.map((i) => ({ id: i.id, type: i.type, title: i.title })),
            unstaged: st.unstaged.map((i) => ({ id: i.id, type: i.type, title: i.title })),
            head: st.head,
          },
          null,
          2,
        ),
      );
      break;
    }

    case "propose": {
      requireAgentHost();
      const root = requireWorkspace();
      const json = opt(rest, "--json");
      if (json) {
        const items = JSON.parse(json) as Array<{
          title: string;
          body: string;
          type?: SectionType;
        }>;
        const made = await proposeMany(root, items);
        console.log(
          JSON.stringify({ ok: true, count: made.length, ids: made.map((m) => m.id) }, null, 2),
        );
        break;
      }
      const title = opt(rest, "--title");
      const body = opt(rest, "--body");
      const type = opt(rest, "--type") as SectionType | undefined;
      if (!title || !body) {
        console.error("Usage: skill propose --title T --body B [--type decision]");
        console.error('   or: skill propose --json \'[{"title":"…","body":"…"}]\'');
        process.exit(2);
      }
      const section = await proposeSection(root, { title, body, type });
      console.log(JSON.stringify({ ok: true, section }, null, 2));
      break;
    }

    case "journey": {
      const root = requireWorkspace();
      const summary = opt(rest, "--summary");
      if (!summary) {
        console.error("Usage: skill journey --summary \"Redacted human+AI journey…\"");
        process.exit(2);
      }
      const open = opt(rest, "--open");
      const config = await setJourney(root, {
        summary,
        open_questions: open ? open.split("|") : undefined,
      });
      console.log(JSON.stringify({ ok: true, journey_summary: config.journey_summary }, null, 2));
      break;
    }

    case "add": {
      const root = requireWorkspace();
      const ids = rest.filter((a) => !a.startsWith("-"));
      const index = await stage(root, ids.length ? ids : "all");
      console.log(JSON.stringify({ ok: true, staged: index.staged }, null, 2));
      break;
    }

    case "unstage": {
      const root = requireWorkspace();
      const ids = rest.filter((a) => !a.startsWith("-"));
      const index = await unstage(root, ids.length ? ids : "all");
      console.log(JSON.stringify({ ok: true, staged: index.staged }, null, 2));
      break;
    }

    case "review": {
      const root = requireWorkspace();
      const st = await status(root);
      console.log(
        JSON.stringify(
          {
            staged: st.staged.map((i) => ({
              id: i.id,
              type: i.type,
              title: i.title,
              body: i.body,
              source: i.source,
            })),
          },
          null,
          2,
        ),
      );
      break;
    }

    case "discard": {
      const root = requireWorkspace();
      const id = rest[0];
      if (!id) usage();
      await discardSection(root, id!);
      console.log(JSON.stringify({ ok: true, discarded: id }, null, 2));
      break;
    }

    case "checkpoint": {
      const root = requireWorkspace();
      try {
        const result = await checkpoint(root, {
          message: opt(rest, "-m") ?? opt(rest, "--message"),
          summary: opt(rest, "--summary"),
          input_tokens: opt(rest, "--input-tokens")
            ? Number(opt(rest, "--input-tokens"))
            : undefined,
          output_tokens: opt(rest, "--output-tokens")
            ? Number(opt(rest, "--output-tokens"))
            : undefined,
        });
        console.log(
          JSON.stringify(
            {
              ok: true,
              profile: "continuity",
              package_path: result.package_path,
              package_digest: result.package_digest,
              skill_id: result.compile.files.manifest.id,
              completeness: result.compile.completeness,
              hint: "Hand this .skill to another AI via: skill load <path>",
            },
            null,
            2,
          ),
        );
      } catch (e) {
        if (e instanceof CompileRefusalError) {
          console.log(
            JSON.stringify(
              {
                ok: false,
                kind: "compile_refused",
                profile: e.profile,
                missing: e.missing,
                hints: e.hints,
              },
              null,
              2,
            ),
          );
          process.exit(2);
        }
        throw e;
      }
      break;
    }

    case "compile":
    case "bake": {
      if (cmd === "bake") {
        console.error(
          "note: `bake` is a Skillerr product term; open protocol command is `skill compile`",
        );
      }
      const root = requireWorkspace();
      const profile = (opt(rest, "--profile") as "release" | "continuity") ?? "release";
      try {
        const result = await compileWorkspace(root, {
          message: opt(rest, "-m") ?? opt(rest, "--message"),
          title: opt(rest, "--title"),
          summary: opt(rest, "--summary"),
          add_all: !flag(rest, "--no-all"),
          approve: flag(rest, "--approve"),
          mint: flag(rest, "--mint"),
          profile,
          host: opt(rest, "--host"),
          input_tokens: opt(rest, "--input-tokens")
            ? Number(opt(rest, "--input-tokens"))
            : undefined,
          output_tokens: opt(rest, "--output-tokens")
            ? Number(opt(rest, "--output-tokens"))
            : undefined,
        });
        console.log(
          JSON.stringify(
            {
              ok: true,
              profile: result.profile,
              package_path: result.package_path,
              package_digest: result.package_digest,
              skill_id: result.compile.files.manifest.id,
              minted: result.minted,
              completeness: result.compile.completeness,
              pending_approvals: result.compile.pending_approvals,
              generation_usage: result.compile.files.provenance?.generation_usage,
            },
            null,
            2,
          ),
        );
      } catch (e) {
        if (e instanceof CompileRefusalError) {
          console.log(
            JSON.stringify(
              {
                ok: false,
                kind: "compile_refused",
                profile: e.profile,
                missing: e.missing,
                hints: e.hints,
                message:
                  "Skill generation stopped. Complete missing parts with the AI agent, then compile again.",
              },
              null,
              2,
            ),
          );
          process.exit(2);
        }
        throw e;
      }
      break;
    }

    case "load": {
      const file = rest[0];
      if (!file) usage();
      const handoff = await loadSkillHandoff(resolve(file!));
      console.log(
        JSON.stringify(
          {
            ok: true,
            handoff,
            agent_prompt:
              "Resume from this .skill continuity package. Honor journey, knowledge, open_questions, and typed inputs. Do not invent missing private data.",
          },
          null,
          2,
        ),
      );
      break;
    }

    case "mint": {
      requireAgentHost(opt(rest, "--host"));
      const root = requireWorkspace();
      const head = await loadHead(root);
      const file = rest.find((a) => a.endsWith(".skill")) ?? head.package_path;
      if (!file) throw new Error("No package to mint. Run skill compile first.");
      const bytes = new Uint8Array(await readFile(resolve(file)));
      const unpacked = unpackSkill(bytes);
      if (unpacked.raw.manifest.compile_profile === "continuity") {
        throw new Error("Cannot mint continuity draft. Recompile with --profile release first.");
      }
      const { packageBytes, files, attestation } = mintSkillPackage(unpacked.raw, {
        host: requireAgentHost(opt(rest, "--host")),
        provider: process.env.SKILL_PROVIDER,
        model: process.env.SKILL_MODEL,
        deployment: (process.env.SKILL_DEPLOYMENT as
          | "local"
          | "hosted"
          | "hybrid"
          | "unknown"
          | undefined) ?? "unknown",
        endpoint: process.env.SKILL_ENDPOINT
          ? redactSecrets(process.env.SKILL_ENDPOINT)
          : undefined,
        agent_runtime: process.env.SKILL_AGENT_RUNTIME ?? "@dot-skill/cli",
      });
      const out = opt(rest, "-o") ?? file;
      await writeFile(resolve(out!), packageBytes);
      console.log(
        JSON.stringify(
          {
            ok: true,
            out,
            mint_status: files.manifest.mint?.mint_status,
            content_id: files.manifest.mint?.content_id,
            package_digest: files.manifest.package_digest,
            generation_usage: attestation.generation_usage,
          },
          null,
          2,
        ),
      );
      break;
    }

    case "publish": {
      console.error(
        "Publish is not part of the open .skill happy path.\n" +
          "Share the .skill file (git, chat, drive). Optional local log: skill registry publish <file>\n" +
          "Hosted registries are product concerns (e.g. Skillerr), not this protocol.",
      );
      process.exit(2);
      break;
    }

    case "inspect": {
      const file = rest[0];
      if (!file) usage();
      console.log(JSON.stringify(inspectSkill(new Uint8Array(await readFile(resolve(file!)))), null, 2));
      break;
    }
    case "validate": {
      const file = rest[0];
      if (!file) usage();
      const result = validatePackageBytes(new Uint8Array(await readFile(resolve(file!))));
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.ok ? 0 : 2);
      break;
    }
    case "unpack": {
      const file = rest[0];
      if (!file) usage();
      const u = unpackSkill(new Uint8Array(await readFile(resolve(file!))));
      console.log(
        JSON.stringify(
          {
            manifest: u.manifest,
            workflow: u.workflow,
            knowledge: u.knowledge,
            journey: u.raw.provenance?.journey,
            generation_usage: u.raw.provenance?.generation_usage,
          },
          null,
          2,
        ),
      );
      break;
    }
    case "pack": {
      const file = rest[0];
      if (!file) usage();
      requireAgentHost(opt(rest, "--host"));
      const approve = flag(rest, "--approve");
      const profile = (opt(rest, "--profile") as "release" | "continuity") ?? "release";
      const out = opt(rest, "-o") ?? "out.skill";
      const raw = JSON.parse(await readFile(resolve(file!), "utf8")) as Recipe | SkillSource;
      let compiled;
      try {
        if (raw.kind === "skill_source") {
          compiled = compileSkillSource(raw, {
            profile,
            approve_inferred_inputs: approve,
            approve_permissions: approve,
          });
        } else {
          const recipe = raw as Recipe;
          if (!recipe.provenance.hosts.length || !isValidAgentHost(recipe.provenance.hosts[0])) {
            recipe.provenance.hosts = [requireAgentHost(opt(rest, "--host"))];
          }
          compiled = compileRecipeToSkill(recipe, {
            profile,
            approve_inferred_inputs: approve,
            approve_permissions: approve,
            host: requireAgentHost(opt(rest, "--host")),
          });
        }
        if (approve) compiled = approveCompilation(compiled, { inputs: ["*"], permissions: true });
      } catch (e) {
        if (e instanceof CompileRefusalError) {
          console.log(
            JSON.stringify(
              { ok: false, kind: "compile_refused", missing: e.missing, hints: e.hints },
              null,
              2,
            ),
          );
          process.exit(2);
        }
        throw e;
      }
      await writeFile(resolve(out), compiled.packageBytes);
      console.log(
        JSON.stringify(
          {
            out,
            skill_id: compiled.files.manifest.id,
            package_digest: compiled.files.manifest.package_digest,
            completeness: compiled.completeness,
          },
          null,
          2,
        ),
      );
      break;
    }
    case "run": {
      const file = rest[0];
      if (!file) usage();
      const mode = (opt(rest, "--mode") ?? "dry_run") as
        | "dry_run"
        | "execute"
        | "explain"
        | "inspect";
      const inputs: Record<string, unknown> = {};
      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === "--input" && rest[i + 1]) {
          const [k, ...v] = rest[i + 1]!.split("=");
          inputs[k!] = v.join("=");
        }
      }
      const run = await runSkillArchive(
        new Uint8Array(await readFile(resolve(file!))),
        { host: process.env.SKILL_HOST ?? "runtime" },
        { mode, inputs },
      );
      console.log(JSON.stringify(run, null, 2));
      process.exit(run.status === "succeeded" || run.status === "paused" ? 0 : 2);
      break;
    }
    case "verify-trust": {
      const file = rest[0];
      if (!file) usage();
      const profile = (opt(rest, "--profile") ?? "minted") as "open" | "minted" | "anchored";
      console.log(
        JSON.stringify(
          verifyMintTrust(new Uint8Array(await readFile(resolve(file!))), profile),
          null,
          2,
        ),
      );
      break;
    }
    case "registry": {
      const sub = rest[0];
      if (sub === "list") {
        console.log(
          JSON.stringify(await list(undefined, Number(opt(rest, "--limit") ?? 50)), null, 2),
        );
      } else if (sub === "lookup") {
        const digest = rest[1];
        if (!digest) usage();
        console.log(JSON.stringify(await lookup(digest!), null, 2));
      } else if (sub === "verify") {
        const file = rest[1];
        if (!file) usage();
        console.log(
          JSON.stringify(
            await registryVerify(new Uint8Array(await readFile(resolve(file!)))),
            null,
            2,
          ),
        );
      } else if (sub === "publish") {
        const file = rest[1];
        if (!file) usage();
        const bytes = new Uint8Array(await readFile(resolve(file!)));
        const digest = unpackSkill(bytes).manifest.package_digest;
        console.log(
          JSON.stringify(
            {
              ...(await registryPublish(digest, { path: file })),
              note: "Local transparency log only — not a public marketplace.",
            },
            null,
            2,
          ),
        );
      } else usage();
      break;
    }
    case "migrate-legacy": {
      const file = rest[0];
      if (!file) usage();
      const out = opt(rest, "-o") ?? "migrated.skill";
      const legacy = JSON.parse(await readFile(resolve(file!), "utf8")) as Skill;
      const { packageBytes, files } = migrateLegacySkill(legacy);
      await writeFile(resolve(out), packageBytes);
      console.log(JSON.stringify({ out, skill_id: files.manifest.id }, null, 2));
      break;
    }
    case "to-skill-md": {
      const file = rest[0];
      if (!file) usage();
      const out = opt(rest, "-o") ?? "SKILL.md";
      const md = toSkillMdAdapter(
        unpackSkill(new Uint8Array(await readFile(resolve(file!)))).raw,
      );
      await writeFile(resolve(out), md, "utf8");
      console.log(
        JSON.stringify(
          { out, warning: "Lossy adapter — markdown is never the source of truth." },
          null,
          2,
        ),
      );
      break;
    }
    case "help":
      usage();
      break;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      usage();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
