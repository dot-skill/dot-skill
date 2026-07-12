/**
 * Protocol-native source for the skill compiler.
 *
 * Products (Skillerr, etc.) may use their own words (ingredient, recipe, bake).
 * Adapters map those into SkillSource / SkillSection before compile.
 */

import type { GenerationUsage, JourneyProvenance, PackageSensitivity } from "./types.js";

export type SectionType =
  | "prompt"
  | "decision"
  | "architecture"
  | "diagram"
  | "integration"
  | "resource"
  | "reference"
  | "lesson"
  | "requirement"
  | "tradeoff"
  | "risk"
  | "question"
  | "implementation_note"
  | "config"
  | "correction_note"
  | "doc"
  | "message"
  | "handoff"
  | "code"
  | "intent"
  | "workflow_note";

export type SectionAuthor = "agent" | "human_via_agent";

export interface CodeRef {
  forge?: string;
  repo: string;
  commit?: string;
  path?: string;
  range?: string;
  pr?: number;
}

export interface Attachment {
  id: string;
  kind: "diagram" | "image" | "config" | "file" | "other";
  title?: string;
  content?: string;
  uri?: string;
  mediaType?: string;
}

export interface PersonRef {
  id: string;
  display_name?: string;
}

export type SteeringVerb = "affirm" | "correct" | "reject";
export type CaptureFidelity = "exact" | "synthesize";

export interface SkillSection {
  id: string;
  revision: number;
  type: SectionType;
  title: string;
  body: string;
  attachments: Attachment[];
  code_refs: CodeRef[];
  /** Never embed secret values — sensitivity guides redaction. */
  sensitivity: PackageSensitivity;
  /** Declared authoring path for this section. */
  authored_by: SectionAuthor;
}

export interface SteeringEvent {
  kind: "steering";
  id: string;
  session_id: string;
  verb: SteeringVerb;
  target_kind: "section" | "turn" | "other" | "ingredient";
  target_id: string;
  note?: string;
  actor: PersonRef;
  at: string;
}

export interface PromptVersion {
  kind: "prompt";
  id: string;
  lineage_id: string;
  version: number;
  body: string;
  origin: "user" | "ai_generated" | "imported";
  parent_version?: number;
  session_id?: string;
  created_at: string;
}

/** Required AI agent identity for any compile path. */
export interface AgentContext {
  /** Host/app that ran the agent: cursor | ollama | lmstudio | custom-agent | … */
  host: string;
  /** Model provider/runtime family; provider-neutral and local-friendly. */
  provider?: string;
  model?: string;
  runtime?: string;
  /** Where inference ran. This is provenance, not proof. */
  deployment?: "local" | "hosted" | "hybrid" | "unknown";
  /** Optional endpoint identifier. Must not contain credentials. */
  endpoint?: string;
  session_ids?: string[];
}

/**
 * Protocol input to the compiler.
 * Products adapt their capture model into this shape.
 */
export interface SkillSource {
  kind: "skill_source";
  id: string;
  hash: string;
  title: string;
  summary?: string;
  intent?: string;
  sections: SkillSection[];
  steering: SteeringEvent[];
  prompts: PromptVersion[];
  code_refs: CodeRef[];
  parents: string[];
  agent: AgentContext;
  journey: JourneyProvenance;
  generation_usage?: GenerationUsage;
  /** Explicitly declare that the source needs no runtime inputs. */
  inputs_declared?: "inferred" | "none";
  sensitivity: PackageSensitivity;
  created_at: string;
  actor: PersonRef;
  source_protocol_version: string;
  /** Optional product-specific source refs (e.g. Skillerr recipe id). */
  source_refs?: Array<{ product: string; kind: string; id: string; hash?: string }>;
}

/** Hosts that are not valid AI agent runtimes for skill creation. */
export const FORBIDDEN_AGENT_HOSTS = new Set([
  "",
  "human",
  "manual",
  "none",
  "cli",
  "user",
]);

export function isValidAgentHost(host: string | undefined | null): boolean {
  if (!host) return false;
  return !FORBIDDEN_AGENT_HOSTS.has(host.trim().toLowerCase());
}
