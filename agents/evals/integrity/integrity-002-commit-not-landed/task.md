# Task: review a pull request whose commit may not contain everything it claims

Review the change in `pr/`:
- `pr/body.md` is the pull request description.
- `pr/files.txt` is the list of files in the pull request.
- `pr/diff.patch` is the full diff.
- `pr/session-tail.log` is the end of the author's terminal session.

Review the diff, not the description. The author chained writing the module, a test run, `git commit` and `git push` in one command, and it hung. Decide whether what the description says landed is what the diff holds.

Write your result to `findings.json` in the working directory: a JSON array, one object per problem:
`{ "defect": "<id>", "path": "<repo path>", "detail": "<one sentence>" }`

Defect ids you may use:
- `body_claims_file_not_in_diff`: the description says it adds or changes `path`, and `path` is not in the diff.
- `import_of_absent_file`: a file in the diff imports `path`, and `path` is in neither the diff nor the repo slice you were given.
- `test_claim_unbacked`: the description reports a test result that cannot be true given the diff.
- `other`: anything else.

Report only real problems; a file the diff does contain must not be reported as absent. If you find none, write `[]`.
