#!/usr/bin/env bash
# Installer for the Open .skill Protocol CLI (`skill`)
set -euo pipefail

echo "Installing @dot-skill/cli (provides \`skill\` and \`dot-skill\`)…"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required (Node.js >= 20). Install from https://nodejs.org" >&2
  exit 1
fi

if npm install -g @dot-skill/cli@latest; then
  echo "Installed from npm."
else
  echo "npm package not available yet — build from this repo:"
  echo "  git clone https://github.com/dot-skill/dot-skill.git && cd dot-skill"
  echo "  npm install && npm run build && npm link -w @dot-skill/cli"
  exit 1
fi

echo
echo "Try (AI agent required):"
echo "  export SKILL_HOST=cursor"
echo "  skill init --title Demo"
echo "  skill propose --json '[{\"title\":\"Rule\",\"body\":\"Keep it short\",\"type\":\"decision\"}]'"
echo "  skill journey --summary \"Redacted human+AI work\""
echo "  skill checkpoint"
echo "  skill compile -m Demo --mint"
echo
skill --version 2>/dev/null || true
