#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  exec node scripts/start.mjs
fi
bundled_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ -x "$bundled_node" ]]; then
  exec "$bundled_node" scripts/start.mjs
fi
echo 'Node.js 22 or newer is required.'
echo 'Install dependencies with pnpm install, then run pnpm start in this directory.'
exit 1
