// OpenCode permissions for the test-writing lane (`--profile lane`).
// OpenCode applies the LAST matching rule (opencode.ai/docs/de/permissions),
// so each block opens with a "*" deny and then allows the few things the lane needs.
// Under `opencode run --auto`, anything not denied is approved, so every kind
// the lane does not need is denied outright.
export function laneConfig(base) {
  return {
    ...base,
    permission: {
      "*": "deny",
      read: "allow",
      glob: "allow",
      grep: "allow",
      lsp: "allow",
      edit: { "*": "deny", "packages/*/test/lane/*.lane.test.ts": "allow" },
      bash: {
        "*": "deny",
        // The only command: run one test file with a scrubbed environment (test.sh).
        "scripts/agents/lane/test.sh *": "allow",
        "ls *": "allow",
        "git status*": "allow",
        "git diff*": "allow",
      },
      webfetch: "deny",
      websearch: "deny",
      task: "deny",
      skill: "deny",
      external_directory: "deny",
      doom_loop: "deny",
    },
  };
}
