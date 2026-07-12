import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import type {
  KnowledgeItem,
  SkillManifest,
  SkillPackageFiles,
  Workflow,
  CompilationReport,
} from "@dot-skill/protocol";
import { packageDigestFromContent, sha256Digest } from "./hash.js";
import {
  assertSafePaths,
  MAX_COMPRESSION_RATIO,
  MAX_ENTRIES,
  MAX_UNCOMPRESSED_BYTES,
  normalizePath,
} from "./paths.js";

function toBytes(data: string | Uint8Array): Uint8Array {
  return typeof data === "string" ? strToU8(data) : data;
}

function textEncode(obj: unknown): Uint8Array {
  return strToU8(JSON.stringify(obj, null, 2) + "\n");
}

export interface PackOptions {
  recomputeDigests?: boolean;
}

export function buildFileMap(pkg: SkillPackageFiles): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  files["workflow.json"] = textEncode(pkg.workflow);
  for (const item of pkg.knowledge) {
    files[`knowledge/${item.id}.json`] = textEncode(item);
  }
  if (pkg.prompts) {
    for (const [name, body] of Object.entries(pkg.prompts)) {
      files[`prompts/${normalizePath(name)}`] = toBytes(body);
    }
  }
  if (pkg.resources) {
    for (const [name, body] of Object.entries(pkg.resources)) {
      files[`resources/${normalizePath(name)}`] = toBytes(body);
    }
  }
  if (pkg.artifacts) {
    for (const [name, body] of Object.entries(pkg.artifacts)) {
      files[`artifacts/${normalizePath(name)}`] = toBytes(body);
    }
  }
  if (pkg.provenance?.recipe) {
    files["provenance/recipe.json"] = textEncode(pkg.provenance.recipe);
  }
  if (pkg.provenance?.source) {
    files["provenance/source.json"] = textEncode(pkg.provenance.source);
  }
  if (pkg.provenance?.journey) {
    files["provenance/journey.json"] = textEncode(pkg.provenance.journey);
  }
  if (pkg.provenance?.generation_usage) {
    files["provenance/generation_usage.json"] = textEncode(pkg.provenance.generation_usage);
  }
  if (pkg.provenance?.proof) {
    files["provenance/proof.json"] = textEncode(pkg.provenance.proof);
  }
  if (pkg.provenance?.compilation_report) {
    files["provenance/compilation_report.json"] = textEncode(
      pkg.provenance.compilation_report,
    );
  }
  if (pkg.attestation && !pkg.signatures?.["creation.dsse.json"]) {
    files["signatures/creation.attestation.json"] = textEncode(pkg.attestation);
  }
  if (pkg.signatures) {
    for (const [name, body] of Object.entries(pkg.signatures)) {
      files[`signatures/${normalizePath(name)}`] = textEncode(body);
    }
  }
  if (pkg.anchors) {
    pkg.anchors.forEach((anchor, i) => {
      const path = `signatures/anchors/${i}-${anchor.kind}.json`;
      if (!files[path]) files[path] = textEncode(anchor);
    });
  }
  return files;
}

/**
 * Content index covers every file except `skill.json` and `signatures/**`.
 * `package_digest` is the digest of that index (RFC8785 JCS + SHA-256).
 */
export function finalizeManifest(
  base: Omit<SkillManifest, "content" | "package_digest"> &
    Partial<Pick<SkillManifest, "content" | "package_digest">>,
  files: Record<string, Uint8Array>,
): SkillManifest {
  const content = Object.keys(files)
    .filter((p) => p !== "skill.json" && !p.startsWith("signatures/"))
    .sort()
    .map((path) => ({
      path,
      digest: sha256Digest(files[path]!),
      bytes: files[path]!.byteLength,
    }));
  return {
    ...base,
    mint: base.mint ?? { mint_status: "draft" },
    content,
    package_digest: packageDigestFromContent(content),
  } as SkillManifest;
}

export function packSkill(pkg: SkillPackageFiles, _opts: PackOptions = {}): Uint8Array {
  const files = buildFileMap(pkg);
  const manifest = finalizeManifest(pkg.manifest, files);
  files["skill.json"] = textEncode(manifest);
  assertSafePaths(Object.keys(files));
  if (Object.keys(files).length > MAX_ENTRIES) {
    throw new Error(`Too many entries: ${Object.keys(files).length}`);
  }
  let total = 0;
  for (const bytes of Object.values(files)) total += bytes.byteLength;
  if (total > MAX_UNCOMPRESSED_BYTES) {
    throw new Error(`Package too large: ${total} bytes`);
  }
  return zipSync(files, { level: 6 });
}

export interface UnpackResult {
  files: Record<string, Uint8Array>;
  manifest: SkillManifest;
  workflow: Workflow;
  knowledge: KnowledgeItem[];
  compilation_report?: CompilationReport;
  raw: SkillPackageFiles;
}

export function unpackSkill(archive: Uint8Array): UnpackResult {
  if (archive.byteLength > MAX_UNCOMPRESSED_BYTES * 2) {
    throw new Error("Archive too large to unpack");
  }
  const unzipped = unzipSync(archive);
  const paths = Object.keys(unzipped);
  if (paths.length > MAX_ENTRIES) throw new Error("Too many zip entries");
  assertSafePaths(paths);

  let uncompressed = 0;
  for (const data of Object.values(unzipped)) {
    uncompressed += data.byteLength;
    if (uncompressed > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("Uncompressed size exceeds limit");
    }
    const ratio = archive.byteLength > 0 ? uncompressed / archive.byteLength : 0;
    if (ratio > MAX_COMPRESSION_RATIO && uncompressed > 1_000_000) {
      throw new Error("Suspicious compression ratio");
    }
  }

  const skillJson = unzipped["skill.json"];
  if (!skillJson) throw new Error("Missing skill.json");
  const workflowJson = unzipped["workflow.json"];
  if (!workflowJson) throw new Error("Missing workflow.json");

  const manifest = JSON.parse(strFromU8(skillJson)) as SkillManifest;
  const workflow = JSON.parse(strFromU8(workflowJson)) as Workflow;
  const knowledge: KnowledgeItem[] = [];
  for (const [path, data] of Object.entries(unzipped)) {
    if (path.startsWith("knowledge/") && path.endsWith(".json")) {
      knowledge.push(JSON.parse(strFromU8(data)) as KnowledgeItem);
    }
  }

  let compilation_report: CompilationReport | undefined;
  if (unzipped["provenance/compilation_report.json"]) {
    compilation_report = JSON.parse(
      strFromU8(unzipped["provenance/compilation_report.json"]!),
    ) as CompilationReport;
  }

  const prompts: Record<string, string> = {};
  const resources: Record<string, Uint8Array> = {};
  const artifacts: Record<string, Uint8Array> = {};
  const signatures: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(unzipped)) {
    if (path.startsWith("prompts/")) prompts[path.slice("prompts/".length)] = strFromU8(data);
    if (path.startsWith("resources/")) resources[path.slice("resources/".length)] = data;
    if (path.startsWith("artifacts/")) artifacts[path.slice("artifacts/".length)] = data;
    if (path.startsWith("signatures/") && path.endsWith(".json")) {
      signatures[path.slice("signatures/".length)] = JSON.parse(strFromU8(data));
    }
  }

  const creation = signatures["creation.dsse.json"] as
    | { attestation?: import("@dot-skill/protocol").CreationAttestation }
    | undefined;
  const attestation =
    creation?.attestation ??
    (signatures["creation.attestation.json"] as
      | import("@dot-skill/protocol").CreationAttestation
      | undefined);
  const anchorsFromSig = Object.entries(signatures)
    .filter(([k]) => k.startsWith("anchors/"))
    .map(([, v]) => v as import("@dot-skill/protocol").PermanenceAnchor);

  const raw: SkillPackageFiles = {
    manifest,
    workflow,
    knowledge,
    prompts,
    artifacts,
    resources,
    provenance: {
      recipe: unzipped["provenance/recipe.json"]
        ? JSON.parse(strFromU8(unzipped["provenance/recipe.json"]))
        : undefined,
      source: unzipped["provenance/source.json"]
        ? JSON.parse(strFromU8(unzipped["provenance/source.json"]))
        : undefined,
      journey: unzipped["provenance/journey.json"]
        ? JSON.parse(strFromU8(unzipped["provenance/journey.json"]))
        : undefined,
      generation_usage: unzipped["provenance/generation_usage.json"]
        ? JSON.parse(strFromU8(unzipped["provenance/generation_usage.json"]))
        : undefined,
      proof: unzipped["provenance/proof.json"]
        ? JSON.parse(strFromU8(unzipped["provenance/proof.json"]))
        : undefined,
      compilation_report,
    },
    signatures,
    attestation,
    anchors: manifest.anchors?.length ? manifest.anchors : anchorsFromSig,
  };

  return { files: unzipped, manifest, workflow, knowledge, compilation_report, raw };
}
