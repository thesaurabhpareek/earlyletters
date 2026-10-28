# Task: review a pull request's test claims

Review the change in `pr/` (the files it adds are also in the working tree under `scripts/agents/`):
- `pr/body.md` is the description.
- `pr/files.txt` lists the files; `pr/diff.patch` is the diff.

Review the diff and the code, not the description. Your job here is whether the test results the description reports are true. You may run `node --test`.

Write your result to `findings.json` in the working directory: a JSON array, one object per problem:
`{ "defect": "<id>", "path": "<repo path>", "detail": "<one sentence>" }`

Defect ids you may use:
- `test_count_mismatch`: the description reports a number of tests for the test file `path`, and the file has a different number.
- `body_claims_file_not_in_diff`: the description names a file as part of the change and it is not in the diff.
- `other`: anything else.

Report only real problems. A count that is correct must not be reported. If you find none, write `[]`.
