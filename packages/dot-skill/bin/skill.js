#!/usr/bin/env node
/**
 * Thin launcher for the Open .skill Protocol CLI.
 * Resolves @dot-skill/cli so `npm i -g skillerr` exposes `skill` / `dot-skill`.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
await import(pathToFileURL(require.resolve("@dot-skill/cli")).href);
