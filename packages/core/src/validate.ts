import type { SkillManifest, Workflow } from "@dot-skill/protocol";
import {
  CONTAINER_VERSION,
  PROTOCOL_VERSION,
  WORKFLOW_DIALECT_VERSION,
} from "@dot-skill/protocol";
import { packageDigestFromContent, sha256Digest } from "./hash.js";
import { unpackSkill } from "./pack.js";

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  manifest?: SkillManifest;
  workflow?: Workflow;
}

export function validateManifestShape(manifest: SkillManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (manifest.kind !== "dot-skill") {
    issues.push({ severity: "error", code: "kind", message: "kind must be dot-skill" });
  }
  if (!manifest.id) issues.push({ severity: "error", code: "id", message: "id required" });
  if (!manifest.version)
    issues.push({ severity: "error", code: "version", message: "version required" });
  if (!manifest.title)
    issues.push({ severity: "error", code: "title", message: "title required" });
  if (!manifest.description)
    issues.push({
      severity: "error",
      code: "description",
      message: "description required",
    });
  if (!manifest.entrypoint)
    issues.push({
      severity: "error",
      code: "entrypoint",
      message: "entrypoint required",
    });
  if (manifest.container_version !== CONTAINER_VERSION) {
    issues.push({
      severity: "warning",
      code: "container_version",
      message: `Unexpected container_version ${manifest.container_version}`,
    });
  }
  if (manifest.protocol_version !== PROTOCOL_VERSION) {
    issues.push({
      severity: "error",
      code: "protocol_version",
      message: `Unsupported protocol_version ${manifest.protocol_version}; expected ${PROTOCOL_VERSION}`,
    });
  }
  if (manifest.mint?.mint_status === "minted") {
    if (manifest.compile_profile !== "release") {
      issues.push({
        severity: "error",
        code: "minted_profile",
        message: "Minted packages must use compile_profile=release",
      });
    }
    if (!manifest.completeness?.complete) {
      issues.push({
        severity: "error",
        code: "minted_incomplete",
        message: "Minted packages require a complete release report",
      });
    }
  }
  for (const input of manifest.inputs ?? []) {
    if (input.sensitivity === "secret" && input.examples?.length) {
      issues.push({
        severity: "error",
        code: "secret_examples",
        message: `Input ${input.name} is secret but includes examples`,
        path: input.name,
      });
    }
  }
  return issues;
}

export function validateWorkflowShape(
  workflow: Workflow,
  entrypoint: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (workflow.kind !== "workflow") {
    issues.push({ severity: "error", code: "workflow_kind", message: "kind must be workflow" });
  }
  if (workflow.dialect_version !== WORKFLOW_DIALECT_VERSION) {
    issues.push({
      severity: "warning",
      code: "dialect",
      message: `Unexpected dialect_version ${workflow.dialect_version}`,
    });
  }
  const ids = new Set(workflow.steps.map((s) => s.id));
  if (!ids.has(entrypoint)) {
    issues.push({
      severity: "error",
      code: "entrypoint_missing",
      message: `Entrypoint ${entrypoint} not in steps`,
    });
  }
  for (const step of workflow.steps) {
    if (!step.id || !step.kind) {
      issues.push({
        severity: "error",
        code: "step",
        message: "Each step needs id and kind",
      });
    }
  }
  return issues;
}

export function validatePackageBytes(archive: Uint8Array): ValidationResult {
  const issues: ValidationIssue[] = [];
  let unpacked;
  try {
    unpacked = unpackSkill(archive);
  } catch (e) {
    return {
      ok: false,
      issues: [
        {
          severity: "error",
          code: "unpack",
          message: e instanceof Error ? e.message : String(e),
        },
      ],
    };
  }

  issues.push(...validateManifestShape(unpacked.manifest));
  issues.push(...validateWorkflowShape(unpacked.workflow, unpacked.manifest.entrypoint));

  const computed: Array<{ path: string; digest: string }> = [];
  for (const [path, data] of Object.entries(unpacked.files)) {
    if (path === "skill.json" || path.startsWith("signatures/")) continue;
    const digest = sha256Digest(data);
    computed.push({ path, digest });
    const listed = unpacked.manifest.content.find((c) => c.path === path);
    if (!listed) {
      issues.push({
        severity: "error",
        code: "missing_content_entry",
        message: `File ${path} not listed in manifest.content`,
        path,
      });
    } else if (listed.digest !== digest) {
      issues.push({
        severity: "error",
        code: "digest_mismatch",
        message: `Digest mismatch for ${path}`,
        path,
      });
    }
  }

  for (const entry of unpacked.manifest.content) {
    if (!unpacked.files[entry.path]) {
      issues.push({
        severity: "error",
        code: "missing_file",
        message: `Manifest lists missing file ${entry.path}`,
        path: entry.path,
      });
    }
  }

  const expectedPkg = packageDigestFromContent(computed);
  if (unpacked.manifest.package_digest !== expectedPkg) {
    issues.push({
      severity: "error",
      code: "package_digest",
      message: "package_digest does not match content index",
    });
  }

  if (unpacked.manifest.policy.require_signatures) {
    const sigs = Object.keys(unpacked.files).filter((p) => p.startsWith("signatures/"));
    if (sigs.length === 0) {
      issues.push({
        severity: "error",
        code: "signatures_required",
        message: "Policy requires signatures but none present",
      });
    }
  }

  const ok = !issues.some((i) => i.severity === "error");
  return {
    ok,
    issues,
    manifest: unpacked.manifest,
    workflow: unpacked.workflow,
  };
}

export function inspectSkill(archive: Uint8Array): {
  ok: boolean;
  summary: {
    id: string;
    version: string;
    title: string;
    description: string;
    inputs: string[];
    permissions: string[];
    capabilities: string[];
    package_digest: string;
    mint_status?: string;
    needs_human_review?: boolean;
  };
  issues: ValidationIssue[];
} {
  const result = validatePackageBytes(archive);
  if (!result.manifest) {
    return {
      ok: false,
      summary: {
        id: "",
        version: "",
        title: "",
        description: "",
        inputs: [],
        permissions: [],
        capabilities: [],
        package_digest: "",
      },
      issues: result.issues,
    };
  }
  const m = result.manifest;
  return {
    ok: result.ok,
    summary: {
      id: m.id,
      version: m.version,
      title: m.title,
      description: m.description,
      inputs: m.inputs.filter((i) => i.required).map((i) => i.name),
      permissions: m.permissions.map((p) => p.side_effect_class),
      capabilities: m.capabilities.map((c) => c.name),
      package_digest: m.package_digest,
      mint_status: m.mint?.mint_status ?? "draft",
      needs_human_review: m.needs_human_review,
    },
    issues: result.issues,
  };
}
