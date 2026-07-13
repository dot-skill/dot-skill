/** @dot-skill/core — pack, unpack, validate, mint, compile .skill packages. */

export {
  canonicalize,
  sha256Hex,
  sha256Digest,
  packageDigestFromContent,
  buildSealedManifestClaims,
  sealedManifestDigest,
  PUBLIC_DEV_MINT_KEY,
  PUBLIC_DEV_MINT_KEY_ID,
} from "./hash.js";
export {
  normalizePath,
  assertSafePaths,
  MAX_ENTRIES,
  MAX_UNCOMPRESSED_BYTES,
  MAX_COMPRESSION_RATIO,
} from "./paths.js";
export {
  buildFileMap,
  finalizeManifest,
  packSkill,
  unpackSkill,
} from "./pack.js";
export type { PackOptions, UnpackResult } from "./pack.js";
export {
  validateManifestShape,
  validateWorkflowShape,
  validatePackageBytes,
  inspectSkill,
} from "./validate.js";
export type { ValidationIssue, ValidationResult } from "./validate.js";
export { migrateLegacySkill, toSkillMdAdapter } from "./migrate.js";
export {
  mintSkillPackage,
  addPermanenceAnchor,
  verifyMintTrust,
  inspectTrustView,
} from "./mint.js";
export type { MintOptions, VerifyMintTrustOptions } from "./mint.js";
export {
  compileSkillSource,
  compileRecipeToSkill,
  approveCompilation,
  assessCompleteness,
  redactSecrets,
  CompileRefusalError,
} from "./compile.js";
export type { CompileOptions, CompileResult } from "./compile.js";