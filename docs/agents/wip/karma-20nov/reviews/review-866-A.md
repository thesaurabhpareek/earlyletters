## Review A at b981114e9f2fb9cb712fb73040b810861b66e4d7: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness and accuracy. BL-925: five PROPOSED NS-09 keys in `packages/content/src/strings.en.ts`, the test `packages/content/test/ns09-copy.test.ts`, and one check-in file. Round 2: this replaces my review at 68e6ef64.

Must fix: none.

## What changed since 68e6ef64, and whether it holds

- Must fix 1 (the hardcoded name) is fixed. The test imports `brand` from `@scribe/brand` and fills `{app}` with `brand.name` (`ns09-copy.test.ts:7`, `filled`). No other copy of the name was added.
- Line 1's recommended option is now "This recording is still on this phone. {app} will try again the next time it starts." That is what the code does. `runLaunchSweep` runs once per process after the first frame (`_layout.tsx:194`, `lib/README.md:96`). For a `discarding` draft it runs `finishLetGo` (`sweep.ts:152-153`, `:166-177`). The line promises a retry, not completion, so it holds even if the delete keeps failing. The old A ("will finish removing it") is now option B, with the reason stated.
- The comment at `:388-400` says when BL-926 may show the line: only while the row is still marked `discarding` (the delete threw). It also names the two other cases where `letItGo` returns false. This answers my note 2.
- The confirmation comment (`:304-312`) says why "from this phone" passes (`ON_DEVICE_ONLY` covers only the experience-pass keys). It also names the TDD 08 K2 case: a kept held draft comes back as ready (`sync/merge.ts:585-591`; `sync_v1_server.sql:782-784`). Every option goes to counsel. This answers notes 4 and 5.
- The hint key is renamed `removeNowA11yHint` (the house suffix). No reference to the old name is left in `packages` or `apps`.
- The test is tagged `[BL-925]` with "NS-09 s16", not `[NS-09-R4a]`. Its `OPTIONS` list matches the comments at this head.
- The PR body now lists the test and its glob, and gives line 1's new words.

## What I checked

- Tests in my own worktree at b981114e (`@scribe/*` linked to the worktree): `npm test -w packages/content` gives 399 of 399 in one full run at load 58. `npm run typecheck -w packages/content` is clean.
- Cites from round 1 still hold (22 of 22). The new ones hold too: `sweep.ts:152-153`, `merge.ts:585-591` (the `CASE WHEN state = 'discarding' THEN 'ready'` update), `sync_v1_server.sql:782-784`, `rules.test.ts:1044-1045`.
- Rules: every key and option is ASCII, with no "we", no loss word, no internal term and no NS-09 s16 ban. Remove now is 10 characters.

## Findings

1. Note: "the next time it starts" is true for a normal launch. The sweep runs only after the 18+ gate passes (`lib/README.md:96`), so on a phone whose age answer is "no" it never runs. No parent reaches Review there, so the line cannot show in that state. Nothing to change.

## Not verified
- VoiceOver timing and the AX5 wrap (BL-926 device rows).
- The TDD 08 K2 and K3 text: not in the repo.

CI at b981114e (read 12:25 UTC): every check is complete and green ("required" included) except "store-profile Release launch", which is still queued; "iOS simulator build" was skipped. The head is more than 10 minutes old.

Reviewer: independent of the author (CR-44).
