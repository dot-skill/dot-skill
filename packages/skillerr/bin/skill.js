#!/usr/bin/env node
/**
 * Thin launcher for the Open .skill Protocol CLI.
 * Resolves @skillerr/cli so `npm i -g skillerr` exposes `skill`.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
await import(pathToFileURL(require.resolve("@skillerr/cli")).href);
