# Build dispatch log

Owner: ops (HV2-B34). Append only: add rows at the end, never edit or delete one. A mistake is fixed by a new row.

Starts empty on 20 Nov 2026. Earlier dispatches are not backfilled: the two 8 Nov runs below are not in this log. A late entry is allowed only as a normal new row whose Note starts with "late entry". Its Time is the date you add the entry, never the date of the run. Put the real run date in the note only if you know it.

Why: on 8 Nov 2026 two TestFlight dispatches ran for the same build (runs 42467254374 and 42511745580, see `docs/agents/harness-v2/LESSONS-2026-11-08.md` lesson 2). One row per dispatch, written before the dispatch starts, shows the second person that the build is already taken.

How to use it (Node 22, no install):

```bash
node scripts/release/dispatch-log.mjs add --build <build> --workflow <file.yml> --sha <40-char sha> --actor <handle>
node scripts/release/dispatch-log.mjs close --build <build> --outcome success|failed|cancelled|superseded --actor <handle>
node scripts/release/dispatch-log.mjs list --open
node scripts/release/dispatch-log.mjs check
```

Rules the script applies:
- A build has one open dispatch at a time. `add` refuses a second one until a `close` row exists for the first. `close` refuses when nothing is open.
- The sha is the full 40 lowercase hex characters, never a prefix. `add --verify-sha` also reads the commit by REST (`gh api repos/<repo>/commits/<sha>`) and refuses a sha that does not exist.
- Actor is a short agent or role handle: letters, digits, hyphen, underscore, 1 to 40 characters. Never a person's name. Note is at most 120 characters. Neither may hold a token or key: the script refuses a run of 32 or more letters, digits, plus or slash, or the prefixes ghp_, github_pat_, sk- and xox. Rows cannot be corrected, so keep secrets and personal details out.
- Time is UTC, from the clock, unless `--time` is given.
- Fields are ASCII with no `|`. The script only appends; `check` fails if the table is malformed or a close row has no open dispatch.
- The script writes this file only. It does not start a workflow. The log is a record and a lock for people and agents, not a gate in CI.

| Seq | Build | Event | Workflow | Sha | Actor | Time (UTC) | Note |
|---|---|---|---|---|---|---|---|
