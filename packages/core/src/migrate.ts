import type { Skill } from "@dot-skill/protocol";
import {
  DEFAULT_SKILL_POLICY,
  CONTAINER_VERSION,
  PROTOCOL_VERSION,
  WORKFLOW_DIALECT_VERSION,
  type SkillPackageFiles,
} from "@dot-skill/protocol";
import { packSkill } from "./pack.js";
import { randomUUID } from "node:crypto";

/** Convert legacy flat skill JSON into a draft `.skill` package (bytes). */
export function migrateLegacySkill(legacy: Skill): {
  packageBytes: Uint8Array;
  files: SkillPackageFiles;
} {
  const id = legacy.id || `skl_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const knowledgeId = "k_legacy_body";
  const files: SkillPackageFiles = {
    manifest: {
      kind: "dot-skill",
      id,
      version: legacy.version || "0.1.0",
      title: legacy.title || "Migrated skill",
      description:
        "Draft migrated from legacy flat skill format. Needs human review before release.",
      container_version: CONTAINER_VERSION,
      protocol_version: PROTOCOL_VERSION,
      entrypoint: "s_instruct",
      inputs: [],
      outputs: [
        {
          name: "result",
          schema: { type: "string" },
          required: false,
          description: "Unstructured result from legacy instruct skill",
        },
      ],
      capabilities: [],
      permissions: [],
      policy: { ...DEFAULT_SKILL_POLICY },
      content: [],
      package_digest: "sha256:" + "0".repeat(64),
      provenance_mode: "proof_only",
      legacy: true,
      needs_human_review: true,
    },
    workflow: {
      kind: "workflow",
      dialect_version: WORKFLOW_DIALECT_VERSION,
      entrypoint: "s_instruct",
      steps: [
        {
          id: "s_instruct",
          kind: "instruct",
          title: "Legacy body",
          text: legacy.body,
          next: "s_emit",
          provenance: [{ kind: "legacy_skill", id: legacy.id }],
        },
        {
          id: "s_emit",
          kind: "emit",
          output: "result",
          from: "s_instruct",
        },
      ],
    },
    knowledge: [
      {
        kind: "knowledge",
        id: knowledgeId,
        type: "reference",
        title: "Legacy skill body",
        body: legacy.body,
        fidelity: "exact",
        provenance: [{ kind: "legacy_skill", id: legacy.id }],
      },
    ],
    provenance: {
      proof: {
        sources: legacy.sources,
        exported_at: legacy.exported_at,
        legacy_protocol_version: legacy.source_protocol_version,
      },
    },
  };

  const packageBytes = packSkill(files);
  return { packageBytes, files };
}

export function toSkillMdAdapter(pkg: SkillPackageFiles): string {
  const m = pkg.manifest;
  const lines = [
    "---",
    `name: ${m.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 64)}`,
    `description: ${m.description.slice(0, 1024)}`,
    "metadata:",
    "  dot_skill_authoritative: true",
    `  skill_id: ${m.id}`,
    `  skill_version: ${m.version}`,
    `  package_digest: ${m.package_digest}`,
    "---",
    "",
    `# ${m.title}`,
    "",
    m.intent ?? m.description,
    "",
    "## Inputs",
    "",
  ];
  for (const input of m.inputs) {
    lines.push(
      `- **${input.name}** (${input.source}, ${input.required ? "required" : "optional"}): ${input.description}`,
    );
  }
  if (m.inputs.length === 0) lines.push("- (none)");
  lines.push("", "## Workflow", "");
  for (const step of pkg.workflow.steps) {
    lines.push(`### ${step.id} (\`${step.kind}\`)`);
    if ("text" in step && step.text) lines.push(step.text, "");
    if ("template" in step && step.template) lines.push(step.template, "");
    if ("prompt" in step && step.prompt) lines.push(step.prompt, "");
  }
  lines.push(
    "",
    "> This SKILL.md is a **lossy adapter**. The authoritative artifact is the `.skill` package.",
  );
  return lines.join("\n");
}
