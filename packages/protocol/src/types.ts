/** Open .skill Protocol v0.4 — semantic types for portable `.skill` packages. */

export const PROTOCOL_VERSION = "0.4.0";
export const CONTAINER_VERSION = "1.0";
export const WORKFLOW_DIALECT_VERSION = "1.0";

/** Media type for a packaged `.skill` archive (zip). */
export const MEDIA_TYPE = "application/vnd.dot-skill+zip";
/** Media type for the manifest JSON document inside a `.skill` archive. */
export const MANIFEST_MEDIA_TYPE = "application/vnd.dot-skill-manifest+json";

/**
 * Compile profiles:
 * - continuity: partial OK — portable AI work context / handoff (draft)
 * - release: full requirements or refuse — reusable sealed skill
 */
export type SkillCompileProfile = "continuity" | "release";

/** Package sharing intent — secrets never embedded either way. */
export type PackageSensitivity = "private" | "shareable_redacted" | "public";

export type ProvenanceMode = "full" | "redacted" | "proof_only";
export type MintStatus = "draft" | "minted";
export type PermanenceAnchorKind =
  | "registry"
  | "transparency_log"
  | "ledger"
  | "content_addressed_store"
  | "other";
export type TrustProfile = "open" | "minted" | "anchored" | `issuer:${string}`;
export type InputSource = "human" | "environment" | "secret" | "artifact" | "derived";
export type SensitivityLevel = "public" | "private" | "secret";
export type AskWhen = "always" | "if_missing" | "never";
export type SideEffectClass =
  | "none"
  | "read"
  | "write"
  | "network"
  | "exec"
  | "destructive";
export type CapabilityFallback = "fail" | "ask_human" | "skip_if_optional";
export type KnowledgeItemType =
  | "rule"
  | "principle"
  | "decision"
  | "tradeoff"
  | "correction"
  | "lesson"
  | "constraint"
  | "reference";
export type SteeringEffect =
  | "invariant"
  | "forbidden"
  | "decision_rule"
  | "approval_gate";
export type WorkflowStepKind =
  | "instruct"
  | "prompt"
  | "tool"
  | "transform"
  | "branch"
  | "iterate"
  | "delegate"
  | "checkpoint"
  | "human_decision"
  | "verify"
  | "emit"
  | "subskill";
export type SkillRunStatus =
  | "pending"
  | "running"
  | "paused"
  | "succeeded"
  | "failed"
  | "cancelled";
export type RuntimeMode = "inspect" | "explain" | "dry_run" | "execute" | "resume";

/** Parts the compiler checks before producing a package. */
export type CompletenessPart =
  | "agent_context"
  | "intent"
  | "sections"
  | "workflow"
  | "knowledge_or_prompts"
  | "inputs_declared"
  | "journey"
  | "generation_usage"
  | "human_approvals";

export interface GenerationUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  reported_by: "agent" | "host" | "estimated";
  captured_at: string;
  host?: string;
  model?: string;
}

/** Generalized human+AI journey — never raw chat / CoT / secrets. */
export interface JourneyProvenance {
  summary: string;
  open_questions?: string[];
  decisions?: string[];
  redacted: boolean;
  sensitivity: PackageSensitivity;
}

export interface CompletenessReport {
  kind: "completeness_report";
  profile: SkillCompileProfile;
  complete: boolean;
  present: CompletenessPart[];
  missing: CompletenessPart[];
  hints: string[];
}

/** JSON Schema subset stored as a plain object. */
export type JsonSchema = Record<string, unknown>;

export interface ContentDigest {
  path: string;
  digest: string;
  media_type?: string;
  bytes?: number;
}

export interface ProvenanceRef {
  kind: "section" | "source" | "steering" | "author" | "legacy_skill" | "ingredient" | "recipe";
  id: string;
  revision?: number;
  hash?: string;
  note?: string;
}

export interface InputSlot {
  name: string;
  schema: JsonSchema;
  description: string;
  source: InputSource;
  required: boolean;
  default?: unknown;
  sensitivity: SensitivityLevel;
  ask_when: AskWhen;
  examples?: unknown[];
  provenance?: ProvenanceRef[];
  generalization_reason?: string;
  approved?: boolean;
}

export interface OutputContract {
  name: string;
  description?: string;
  schema: JsonSchema;
  required: boolean;
  media_type?: string;
  assert?: string[];
}

export interface CapabilityAdapterHint {
  kind: "mcp" | "a2a" | "host" | "http";
  name?: string;
  uri?: string;
  tool?: string;
  meta?: Record<string, unknown>;
}

export interface CapabilityRequirement {
  name: string;
  description: string;
  input_schema?: JsonSchema;
  output_schema?: JsonSchema;
  side_effect_class: SideEffectClass;
  adapters?: CapabilityAdapterHint[];
  fallback: CapabilityFallback;
  required: boolean;
}

export interface SkillPermission {
  side_effect_class: SideEffectClass;
  description: string;
  paths?: string[];
  hosts?: string[];
  requires_consent: boolean;
}

export interface SkillPolicy {
  require_signatures: boolean;
  require_minted?: boolean;
  require_anchor?: boolean;
  max_runtime_ms: number;
  max_tool_calls: number;
  allow_network: boolean;
  filesystem_roots?: string[];
  consent_for: SideEffectClass[];
  fail_on_unsupported_step: boolean;
  trust_profile?: TrustProfile;
}

export interface SkillDependency {
  skill_id: string;
  version: string;
  package_digest?: string;
}

export interface MintRecord {
  mint_status: MintStatus;
  minted_at?: string;
  mint_issuer?: string;
  content_id?: string;
}

export interface CreationAttestation {
  kind: "creation_attestation";
  package_digest: string;
  skill_id: string;
  skill_version: string;
  minted_at: string;
  agent: {
    runtime: string;
    version: string;
    key_id?: string;
  };
  host: string;
  provider?: string;
  model?: string;
  deployment?: "local" | "hosted" | "hybrid" | "unknown";
  endpoint?: string;
  journey: {
    /** @deprecated Prefer source_id — Skillerr recipe id when adapted. */
    recipe_id?: string;
    recipe_hash?: string;
    source_id?: string;
    source_hash?: string;
    proof_digest?: string;
    summary?: string;
  };
  generation_usage?: GenerationUsage;
  human_approvals: {
    inputs: string[];
    permissions: string[];
    actors: string[];
  };
  policy_profile?: TrustProfile;
}

export interface PermanenceAnchor {
  kind: PermanenceAnchorKind;
  package_digest: string;
  located_at: string;
  anchored_at: string;
  issuer: string;
  receipt?: unknown;
  extensions?: Record<string, unknown>;
}

/**
 * Manifest of a `.skill` package.
 * Wire `kind` is `"dot-skill"`; the artifact extension is `.skill`.
 */
export interface SkillManifest {
  kind: "dot-skill";
  id: string;
  version: string;
  title: string;
  description: string;
  intent?: string;
  triggers?: string[];
  authors?: Array<{ id: string; display_name?: string }>;
  license?: string;
  container_version: string;
  protocol_version: string;
  entrypoint: string;
  inputs: InputSlot[];
  outputs: OutputContract[];
  capabilities: CapabilityRequirement[];
  permissions: SkillPermission[];
  policy: SkillPolicy;
  content: ContentDigest[];
  package_digest: string;
  dependencies?: SkillDependency[];
  supersedes?: string;
  provenance_mode: ProvenanceMode;
  /** continuity = handoff draft; release path may carry a signed attestation */
  compile_profile?: SkillCompileProfile;
  completeness?: CompletenessReport;
  package_sensitivity?: PackageSensitivity;
  mint?: MintRecord;
  attestation_digest?: string;
  anchors?: PermanenceAnchor[];
  legacy?: boolean;
  needs_human_review?: boolean;
  extensions?: Record<string, Record<string, unknown>>;
}

export interface KnowledgeItem {
  kind: "knowledge";
  id: string;
  type: KnowledgeItemType;
  title: string;
  body: string;
  fidelity: "exact" | "synthesize";
  applicability?: string;
  pinned?: boolean;
  sensitivity?: SensitivityLevel;
  provenance?: ProvenanceRef[];
}

export interface SteeringConstraint {
  kind: "steering_constraint";
  id: string;
  verb: "affirm" | "correct" | "reject";
  effect: SteeringEffect;
  statement: string;
  source_steering_id?: string;
  targets?: string[];
  provenance?: ProvenanceRef[];
}

export interface WorkflowStepBase {
  id: string;
  kind: WorkflowStepKind;
  title?: string;
  optional?: boolean;
  next?: string | string[];
  on_fail?: string;
  provenance?: ProvenanceRef[];
}

export interface InstructStep extends WorkflowStepBase {
  kind: "instruct";
  text: string;
  knowledge_refs?: string[];
}

export interface PromptStep extends WorkflowStepBase {
  kind: "prompt";
  template: string;
  input_bindings?: Record<string, string>;
  knowledge_refs?: string[];
}

export interface ToolStep extends WorkflowStepBase {
  kind: "tool";
  capability: string;
  arguments?: Record<string, unknown>;
  argument_bindings?: Record<string, string>;
  result_as?: string;
}

export interface TransformStep extends WorkflowStepBase {
  kind: "transform";
  expression: string;
  input_from?: string;
  result_as?: string;
}

export interface BranchStep extends WorkflowStepBase {
  kind: "branch";
  cases: Array<{ when: string; goto: string }>;
  else?: string;
}

export interface IterateStep extends WorkflowStepBase {
  kind: "iterate";
  over: string;
  as: string;
  body: string;
}

export interface DelegateStep extends WorkflowStepBase {
  kind: "delegate";
  agent_card?: string;
  task: string;
  result_as?: string;
}

export interface CheckpointStep extends WorkflowStepBase {
  kind: "checkpoint";
  message?: string;
  require_human?: boolean;
}

export interface HumanDecisionStep extends WorkflowStepBase {
  kind: "human_decision";
  prompt: string;
  choices?: string[];
  result_as?: string;
}

export interface VerifyStep extends WorkflowStepBase {
  kind: "verify";
  assertions: string[];
  against?: string;
}

export interface EmitStep extends WorkflowStepBase {
  kind: "emit";
  output: string;
  from: string;
}

export interface SubskillStep extends WorkflowStepBase {
  kind: "subskill";
  skill_id: string;
  version?: string;
  input_bindings?: Record<string, string>;
}

export type WorkflowStep =
  | InstructStep
  | PromptStep
  | ToolStep
  | TransformStep
  | BranchStep
  | IterateStep
  | DelegateStep
  | CheckpointStep
  | HumanDecisionStep
  | VerifyStep
  | EmitStep
  | SubskillStep;

export interface Workflow {
  kind: "workflow";
  dialect_version: string;
  entrypoint: string;
  steps: WorkflowStep[];
  constraints?: SteeringConstraint[];
}

export interface CompilationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  related?: string[];
}

export interface CompilationMapping {
  from: ProvenanceRef;
  to: { kind: "knowledge" | "step" | "input" | "output" | "constraint"; id: string };
}

export interface CompilationReport {
  kind: "compilation_report";
  skill_id: string;
  /** Protocol source id. */
  source_id?: string;
  /** @deprecated Skillerr adapter field — use source_id. */
  recipe_id?: string;
  profile: SkillCompileProfile;
  created_at: string;
  mappings: CompilationMapping[];
  inferred_inputs: InputSlot[];
  issues: CompilationIssue[];
  pending_approvals: string[];
  approved: boolean;
  completeness: CompletenessReport;
}

export interface SkillPackageFiles {
  manifest: SkillManifest;
  workflow: Workflow;
  knowledge: KnowledgeItem[];
  prompts?: Record<string, string>;
  resources?: Record<string, Uint8Array | string>;
  artifacts?: Record<string, Uint8Array | string>;
  provenance?: {
    /** Scrubbed SkillSource or product source (never secrets). */
    source?: unknown;
    /** @deprecated Prefer source — Skillerr recipe blob. */
    recipe?: unknown;
    journey?: JourneyProvenance;
    generation_usage?: GenerationUsage;
    proof?: unknown;
    compilation_report?: CompilationReport;
  };
  signatures?: Record<string, unknown>;
  attestation?: CreationAttestation;
  anchors?: PermanenceAnchor[];
}

export interface SkillStepRecord {
  step_id: string;
  kind: WorkflowStepKind;
  status: "pending" | "skipped" | "succeeded" | "failed" | "waiting";
  started_at?: string;
  finished_at?: string;
  input_digest?: string;
  output_digest?: string;
  adapter?: CapabilityAdapterHint;
  approval?: { actor: string; at: string; decision: "allow" | "deny" };
  error?: string;
}

export interface SkillRun {
  kind: "skill_run";
  id: string;
  skill_id: string;
  skill_version: string;
  package_digest: string;
  status: SkillRunStatus;
  mode: RuntimeMode;
  resolved_inputs: Record<string, unknown>;
  secret_refs?: Record<string, string>;
  steps: SkillStepRecord[];
  outputs?: Record<string, unknown>;
  verifications: Array<{ assertion: string; passed: boolean; detail?: string }>;
  runtime: {
    name: string;
    version: string;
    host?: string;
    model?: string;
  };
  checkpoints?: Array<{ id: string; step_id: string; at: string; state_digest: string }>;
  started_at: string;
  finished_at?: string;
  error?: string;
}

export const DEFAULT_SKILL_POLICY: SkillPolicy = {
  require_signatures: false,
  require_minted: false,
  require_anchor: false,
  max_runtime_ms: 600_000,
  max_tool_calls: 200,
  allow_network: false,
  consent_for: ["write", "network", "exec", "destructive"],
  fail_on_unsupported_step: true,
  trust_profile: "open",
};
