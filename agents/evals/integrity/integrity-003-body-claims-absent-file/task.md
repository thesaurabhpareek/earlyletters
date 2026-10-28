# Task: review a pull request for what its description claims

Review the change in `pr/`:
- `pr/body.md` is the pull request description.
- `pr/files.txt` is the list of files the pull request changes.
- `pr/diff.patch` is the full diff.

Review the diff, not the description. Your one job here is integrity between the two: does the description claim that the pull request touches a file that the diff does not contain?

Write your result to `findings.json` in the working directory: a JSON array. One object per problem:
`{ "defect": "<id>", "path": "<repo path>", "detail": "<one sentence>" }`

Defect ids you may use:
- `body_claims_file_not_in_diff`: the description says it changed or added `path`, and `path` is not in the diff.
- `diff_file_not_in_body`: the diff changes `path` and the description never mentions it.
- `other`: anything else.

Only report a file as `body_claims_file_not_in_diff` if the description claims to have touched it. A file that the description names only as context or says is "not touched" is not a claim. If you find no problem, write `[]`.
