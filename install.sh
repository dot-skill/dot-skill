#!/usr/bin/env bash
# Install Open .skill Protocol CLI → bin: skill
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "npm required (Node >= 20): https://nodejs.org" >&2
  exit 1
fi

echo "Installing skillerr…"
if ! npm install -g skillerr@latest; then
  echo "npm install failed — from source:"
  echo "  git clone https://github.com/dot-skill/skillerr.git && cd skillerr"
  echo "  npm i && npm run build && npm link -w skillerr"
  exit 1
fi

echo
echo "  export SKILL_HOST=cursor"
echo "  skill --help"
echo
skill --version 2>/dev/null || true
