/**
 * Package-local unit tests for @skillerr/protocol's pure functions. Before
 * Tier 3, this package had zero direct test coverage of its own — it was
 * only ever exercised indirectly through @skillerr/core and @skillerr/cli.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidAgentHost, FORBIDDEN_AGENT_HOSTS } from "./source.js";
import { assessSkillContract, scaffoldSkillContract, explainContractAssessment } from "./authoring.js";
import { recipeToSkillSource } from "./recipe.js";
import type { Recipe } from "./recipe.js";

test("isValidAgentHost: denylists human/cli/shell-style hosts, allows real agent hosts", () => {
  assert.equal(isValidAgentHost("cursor"), true);
  assert.equal(isValidAgentHost("ollama"), true);
  assert.equal(isValidAgentHost("custom-agent"), true);
  for (const forbidden of FORBIDDEN_AGENT_HOSTS) {
    if (!forbidden) continue;
    assert.equal(isValidAgentHost(forbidden), false, `expected "${forbidden}" to be forbidden`);
  }
  assert.equal(isValidAgentHost(undefined), false);
  assert.equal(isValidAgentHost(""), false);
  // Case/whitespace-insensitive denylist matching.
  assert.equal(isValidAgentHost("  Human  "), false);
});

test("scaffoldSkillContract: placeholder values fail assessment on purpose", () => {
  const scaffold = scaffoldSkillContract();
  const assessment = assessSkillContract(scaffold, "continuity");
  assert.equal(assessment.complete, false);
  assert.ok(assessment.issues.length > 0);
  const explanation = explainContractAssessment(assessment);
  assert.equal(explanation.complete, false);
  assert.equal(explanation.fixes.length, assessment.issues.length);
});

test("assessSkillContract: release requires triggers/steps/verification to be specified, not just none/not_applicable", () => {
  const bare = {
    kind: "skill_contract",
    contract_version: "0.5",
    skill_kind: "knowledge",
    title: "x",
    intent: "x",
    sensitivity: "private",
    triggers: { status: "none", reason: "no reason needed for this test" },
    inputs: { status: "none", reason: "none" },
    preconditions: { status: "none", reason: "none" },
    steps: { status: "none", reason: "none" },
    branches: { status: "none", reason: "none" },
    human_decisions: { status: "none", reason: "none" },
    capabilities: { status: "none", reason: "none" },
    permissions: { status: "none", reason: "none" },
    forbidden_actions: { status: "none", reason: "none" },
    outputs: { status: "none", reason: "none" },
    recovery: { status: "none", reason: "none" },
    verification: { status: "none", reason: "none" },
    corrections: { status: "none", reason: "none" },
    provenance: {
      evidence: { status: "none", reason: "none" },
      limitations: { status: "none", reason: "none" },
      human_review: { status: "reviewed", actor: "a", at: "2026-07-13T00:00:00.000Z", scope: ["x"] },
    },
  };
  const continuity = assessSkillContract(bare, "continuity");
  assert.equal(continuity.complete, true, JSON.stringify(continuity.issues));

  const release = assessSkillContract(bare, "release");
  assert.equal(release.complete, false);
  const profileRequiredFields = release.issues.filter((i) => i.code === "profile_required").map((i) => i.field);
  assert.ok(profileRequiredFields.includes("triggers"));
  assert.ok(profileRequiredFields.includes("steps"));
  assert.ok(profileRequiredFields.includes("verification"));
});

test("recipeToSkillSource: maps a legacy recipe into a protocol-native SkillSource", () => {
  const recipe: Recipe = {
    kind: "recipe",
    id: "rcp_test",
    hash: "sha256:" + "a".repeat(64),
    title: "Legacy recipe",
    summary: "Do the thing with {{base_url}}",
    journey_summary: "Human+agent designed this.",
    ingredients: [
      {
        id: "ing_1",
        revision: 1,
        type: "integration",
        title: "Call the API",
        body: "Call {{base_url}}",
        attachments: [],
        code_refs: [],
        sensitivity: "private",
      },
    ],
    steering: [],
    prompts: [],
    code_refs: [],
    parents: [],
    provenance: { hosts: ["cursor"], models: ["test-model"], session_ids: [] },
    visibility_intent: "private",
    baked_at: "2026-07-13T00:00:00.000Z",
    baker: { id: "test-agent" },
    source_protocol_version: "0.5.0",
  };
  const source = recipeToSkillSource(recipe, { agent: { host: "cursor" } });
  assert.equal(source.kind, "skill_source");
  assert.equal(source.title, recipe.title);
  assert.equal(source.sections.length, 1);
  assert.equal(source.sections[0]!.body, "Call {{base_url}}");
  assert.equal(source.agent.host, "cursor");
  // The {{base_url}} placeholder must be detected so downstream compile
  // knows an input needs to be inferred.
  assert.equal(source.inputs_declared, "inferred");
});
