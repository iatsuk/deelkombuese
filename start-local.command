#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if command -v node >/dev/null 2>&1; then
  exec node scripts/serve.mjs
fi
bundled_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ -x "$bundled_node" ]]; then
  exec "$bundled_node" scripts/serve.mjs
fi
echo 'Для запуска нужен Node.js 20 или новее.'
echo 'После установки выполните npm run dev в этой папке.'
exit 1
