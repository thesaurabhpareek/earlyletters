# Build dispatch log

Owner: ops (HV2-B34). Append only: add rows at the end, never edit or delete one. A mistake is fixed by a new row.

Why: on 8 Nov 2026 two TestFlight dispatches ran for the same build (runs 42467254374 and 42511745580, see `docs/agents/harness-v2/LESSONS-2026-11-08.md` lesson 2). One row per dispatch, written before the dispatch starts, shows the second person that the build is already taken.

How to use it (Node 22, no install):

```bash
node scripts/release/dispatch-log.mjs add --build <build> --workflow <file.yml> --sha <40-char sha> --actor <name>
node scripts/release/dispatch-log.mjs close --build <build> --outcome success|failed|cancelled|superseded --actor <name>
node scripts/release/dispatch-log.mjs list --open
node scripts/release/dispatch-log.mjs check
```

Rules the script applies:
- A build has one open dispatch at a time. `add` refuses a second one until a `close` row exists for the first. `close` refuses when nothing is open.
- The sha is the full 40 lowercase hex characters, never a prefix. `add --verify-sha` also reads the commit by REST (`gh api repos/<repo>/commits/<sha>`) and refuses a sha that does not exist.
- Time is UTC, from the clock, unless `--time` is given.
- Fields are ASCII with no `|`. The script only appends; `check` fails if the table is malformed or a close row has no open dispatch.
- The script writes this file only. It does not start a workflow. The log is a record and a lock for people and agents, not a gate in CI.

| Seq | Build | Event | Workflow | Sha | Actor | Time (UTC) | Note |
|---|---|---|---|---|---|---|---|
