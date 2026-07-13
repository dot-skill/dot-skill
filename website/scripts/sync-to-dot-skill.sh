#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOT_SKILL="${DOT_SKILL_ROOT:-$ROOT/../../../dot-skill}"
rsync -a --delete \
  --exclude node_modules \
  --exclude docs/.vitepress/dist \
  --exclude docs/.vitepress/cache \
  "$ROOT/" "$DOT_SKILL/website/"
echo "Synced website → $DOT_SKILL/website"
