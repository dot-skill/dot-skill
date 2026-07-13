/**
 * PROTO-7: JSON Schemas for every container file, loadable at runtime so
 * `skill validate` can schema-check each entry instead of only checking
 * the hand-written required-field lists validate.ts already had. Paths
 * are resolved relative to this module's own compiled location (not the
 * caller's), so this works the same whether @skillerr/protocol is a
 * workspace symlink or an installed npm package.
 */
import { readFileSync } from "node:fs";

const SCHEMA_FILES = {
  "skill-contract": "../skill-contract.schema.json",
  "skill-manifest": "../skill-manifest.schema.json",
  workflow: "../workflow.schema.json",
  "knowledge-item": "../knowledge-item.schema.json",
  "creation-attestation": "../creation-attestation.schema.json",
} as const;

export type SchemaName = keyof typeof SCHEMA_FILES;

export function loadSchema(name: SchemaName): Record<string, unknown> {
  const relativePath = SCHEMA_FILES[name];
  const text = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  return JSON.parse(text) as Record<string, unknown>;
}
