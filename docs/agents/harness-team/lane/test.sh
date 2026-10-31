#!/usr/bin/env bash
# The lane model's only shell command: run ONE lane test file in its workspace
# with an empty environment, so code the model wrote cannot read the endpoint
# key or any other variable. Network egress is NOT blocked on a hosted runner;
# with a local Ollama route there is no key to take.
#   scripts/agents/lane/test.sh packages/api/test/lane/keys-edges.lane.test.ts
set -euo pipefail
f="${1:?test file}"
[[ "$f" =~ ^packages/(api|analytics|design-tokens|emails)/test/lane/[a-z0-9][a-z0-9-]{0,60}\.lane\.test\.ts$ ]] || { echo "not a lane test path" >&2; exit 2; }
ws="${f%%/test/*}"
cd "$ws"
env -i PATH="$PATH" HOME="$HOME" CI=1 npx --no-install vitest run "${f#"$ws"/}" --reporter=dot 2>&1 | tail -n 60
