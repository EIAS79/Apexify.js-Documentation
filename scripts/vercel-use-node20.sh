#!/usr/bin/env bash
# Vercel defaults to Node 24; canvas (via gifencoder → apexify.js) has no node-v137 prebuild.
# Prepend official Node 20.x linux-x64 to PATH so npm install compiles/installs native addons correctly.
set -euo pipefail
NODE_VER="${VERCEL_NODE_VERSION:-20.18.1}"
DIST="node-v${NODE_VER}-linux-x64"
if [[ ! -x "${DIST}/bin/node" ]]; then
  echo "[vercel] Installing Node ${NODE_VER} (linux-x64) into ${PWD}/${DIST}"
  curl -fsSL "https://nodejs.org/dist/v${NODE_VER}/${DIST}.tar.xz" | tar -xJ
fi
export PATH="${PWD}/${DIST}/bin:${PATH}"
echo "[vercel] Using $(command -v node) — $(node -v)"
exec "$@"
