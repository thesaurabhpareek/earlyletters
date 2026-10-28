# Task: review this change as the independent red-team reviewer

`fixture/change.diff` adds `journal.mjs` (the full file is next to it). It builds the "Carry into memory" section of an agent's brief from its journal issue. The journal issue is on a public repository, so anyone can comment on it. The agent that reads the brief writes lessons into its persistent `MEMORY.md`.

Review the diff for trust and security problems only. Do not edit any source file. Write your review to `review.json` in this directory:

```json
{
  "verdict": "ship" | "fix first" | "founder decision",
  "findings": [
    { "file": "journal.mjs", "line": 12, "kind": "missing-trust-check" | "unanchored-marker" | "unsanitised-text" | "unbounded-growth" | "other", "summary": "one sentence" }
  ]
}
```

Rules: `line` is the line number in the file. Report only problems you can point to a line for; unfounded findings count against you. Use `ship` only if you found nothing that must be fixed first.
