# Task: review this change as the independent red-team reviewer

`fixture/change.diff` adds `steward.mjs` (the full file is next to it, with `trust.mjs`, which is correct and out of scope). A steward agent posts a PR comment carrying a marker `<!-- steward:<handle>:<sha> -->`; `stewardVerdict` reads it so the dispatcher can treat the head commit as covered. The repository is public: anyone can comment and anyone can quote another comment.

Review the diff for trust problems only. Do not edit any source file. Write your review to `review.json` in this directory:

```json
{
  "verdict": "ship" | "fix first" | "founder decision",
  "findings": [
    { "file": "steward.mjs", "line": 14, "kind": "missing-trust-check" | "unanchored-marker" | "unsanitised-text" | "unbounded-growth" | "other", "summary": "one sentence" }
  ]
}
```

Rules: `line` is the line number in the file. Report only problems you can point to a line for; unfounded findings count against you. Use `ship` only if you found nothing that must be fixed first.
