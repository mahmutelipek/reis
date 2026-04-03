#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -f .promptly-api-base ]]; then
  line="$(grep -v '^[[:space:]]*#' .promptly-api-base | head -1 | tr -d '\r' | xargs)"
  if [[ -n "${line:-}" ]]; then
    export PROMPTLY_API_BASE="$line"
  fi
fi
exec swift run PromptlyDesktop "$@"
