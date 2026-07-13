/**
 * Skillerr-shaped Recipe types — product adapter, not protocol vocabulary.
 *
 * Open protocol uses SkillSource / SkillSection (see source.ts).
 * Skillerr (and similar products) map recipe/ingredient/bake → SkillSource/compile.
 */

import type { GenerationUsage, JourneyProvenance, PackageSensitivity } from "./types.js";
import type { SkillContract } from "./contract.js";
import type {
  AgentContext,
  Attachment,
  CodeRef,
  PersonRef,
  PromptVersion,
  SectionType,
  SkillSection,
  SkillSource,
  SteeringEvent,
  SteeringVerb,
} from "./source.js";
import { isValidAgentHost } from "./source.js";

/** @deprecated Prefer SectionType from source.ts — kept for Skillerr adapters. */
export type IngredientType = SectionType;

export type VisibilityIntent = "private" | "publishable";
export type { SteeringVerb, CaptureFidelity } from "./source.js";
export type { CodeRef, Attachment, PersonRef, SteeringEvent, PromptVersion } from "./source.js";

/** @deprecated Prefer SkillSection — Skillerr ingredient shape. */
export interface RecipeIngredient {
  id: string;
  revision: number;
  type: IngredientType;
  title: string;
  body: string;
  attachments: Attachment[];
  code_refs: CodeRef[];
  sensitivity: VisibilityIntent;
}

/**
 * @deprecated Prefer SkillSource.
 * Recipe is Skillerr's capture document; adapters convert it before compile.
 */
export interface Recipe {
  kind: "recipe";
  id: string;
  hash: string;
  title: string;
  summary?: string;
  ingredients: RecipeIngredient[];
  steering: SteeringEvent[];
  prompts: PromptVersion[];
  code_refs: CodeRef[];
  parents: string[];
  provenance: {
    hosts: string[];
    models: string[];
    session_ids: string[];
  };
  visibility_intent: VisibilityIntent;
  baked_at: string;
  baker: PersonRef;
  source_protocol_version: string;
  generation_usage?: GenerationUsage;
  journey_summary?: string;
  /** Optional 0.5 protocol-native semantics carried through this lossy product adapter. */
  contract?: SkillContract;
}

/** @deprecated Legacy flat markdown skill export. Prefer SkillManifest / `.skill`. */
export interface Skill {
  kind: "skill";
  id: string;
  version: string;
  title: string;
  body: string;
  sources: Array<{ kind: "ingredient" | "recipe" | "section"; id: string; revision?: number; hash?: string }>;
  exported_at: string;
  source_protocol_version: string;
}

function visibilityToSensitivity(v: VisibilityIntent): PackageSensitivity {
  return v === "publishable" ? "public" : "private";
}

/** Map a Skillerr Recipe into protocol SkillSource. */
export function recipeToSkillSource(
  recipe: Recipe,
  overrides: { agent?: Partial<AgentContext>; journey?: Partial<JourneyProvenance> } = {},
): SkillSource {
  const host = overrides.agent?.host ?? recipe.provenance.hosts[0];
  if (!isValidAgentHost(host)) {
    throw new Error(
      "AI agent host required to adapt Recipe → SkillSource. Set a real host (e.g. cursor, claude), not human/cli.",
    );
  }
  const sections: SkillSection[] = recipe.ingredients.map((ing) => ({
    id: ing.id,
    revision: ing.revision,
    type: ing.type,
    title: ing.title,
    body: ing.body,
    attachments: ing.attachments,
    code_refs: ing.code_refs,
    sensitivity: visibilityToSensitivity(ing.sensitivity),
    authored_by: "agent",
  }));

  const journey: JourneyProvenance = {
    summary:
      overrides.journey?.summary ??
      recipe.journey_summary ??
      recipe.summary ??
      `Human+AI work captured as recipe ${recipe.id}: ${recipe.title}`,
    open_questions: overrides.journey?.open_questions,
    decisions: overrides.journey?.decisions ??
      recipe.ingredients.filter((i) => i.type === "decision").map((i) => i.title),
    redacted: overrides.journey?.redacted ?? true,
    sensitivity:
      overrides.journey?.sensitivity ??
      (recipe.visibility_intent === "publishable" ? "public" : "shareable_redacted"),
  };
  const declaresInputs = recipe.ingredients.some((ing) =>
    /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}|<([A-Z][A-Z0-9_]+)>|\$\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(
      ing.body,
    ),
  );

  return {
    kind: "skill_source",
    id: recipe.id,
    hash: recipe.hash,
    title: recipe.title,
    summary: recipe.summary,
    intent: recipe.summary ?? recipe.title,
    contract: recipe.contract ? structuredClone(recipe.contract) : undefined,
    sections,
    steering: recipe.steering,
    prompts: recipe.prompts,
    code_refs: recipe.code_refs,
    parents: recipe.parents,
    agent: {
      host: host!,
      provider: overrides.agent?.provider,
      model: overrides.agent?.model ?? recipe.provenance.models[0],
      runtime: overrides.agent?.runtime,
      deployment: overrides.agent?.deployment,
      endpoint: overrides.agent?.endpoint,
      session_ids: overrides.agent?.session_ids ?? recipe.provenance.session_ids,
    },
    journey,
    generation_usage: recipe.generation_usage,
    inputs_declared: declaresInputs ? "inferred" : "none",
    sensitivity: visibilityToSensitivity(recipe.visibility_intent) === "public"
      ? "public"
      : "shareable_redacted",
    created_at: recipe.baked_at,
    actor: recipe.baker,
    source_protocol_version: recipe.source_protocol_version,
    source_refs: [{ product: "skillerr", kind: "recipe", id: recipe.id, hash: recipe.hash }],
  };
}
