# Task: find the dangling citations

You are reviewing a documentation tree (a slice of the Early Letters repository, in the working directory). Several files cite a document, `docs/release/ALPHA_PLAN.md`, that is not in the tree.

Do not create, edit or delete any file except the one you are asked to write.

Find every place in the tree that cites that document. A citation is any line that names it, in full (`docs/release/ALPHA_PLAN.md`) or short (`ALPHA_PLAN.md`, `ALPHA_PLAN on #152`, and similar).

Write `findings.json` in the working directory root:

```json
{
  "missing_document": "docs/release/ALPHA_PLAN.md",
  "citations": [ { "file": "path/relative/to/the/root", "line": 1 } ]
}
```

- One entry per citing line (1-based line number in that file). A file with two citing lines gets two entries.
- List only real citations. Do not list files that cite other documents that do exist.
- Do not fix anything. This task is the finding, not the repair.
