## Review B at f21c364cf03c92fb886a44f7e8f194535d7bd6eb: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. PR #902, "A month ago" skips a quieted book (NS-23-R8, J-N19).

Must fix: none.

## What I checked

- The diff: `apps/mobile/src/components/tonight/draft-card.logic.ts` (+5 -2), `apps/mobile/src/app/(tabs)/index.tsx` (+18 -6), `test/draft-card.test.ts`, and the new `test/month-ago-quiet.test.ts`.
- The cards on `docs/prd-lock-v1-20nov` at `450bcb4a`: NS-23-R8 (`10-reading-and-family.md:443`, P0) and J-N19 (`14-test-plan.md:68`, P0).
- The design: `docs/tdd/new-scope/10-reading-and-family.md:125, 136, 210` on `docs/tdd-new-scope-10-reading-and-family`. It asks for the guard outside the flag.
- Cites: 17 sampled, 17 hold. Develop `8343d119` `draft-card.logic.ts:190-206` (resurfaced had no quiet input) and `index.tsx:200`. Branch `draft-card.logic.ts:196-198`, `index.tsx:103, 109, 149` (`subscribe(load)`) and `:210`. `store.ts:320-324` (getActiveChildId picks from listChildren) and `:311-313` (listChildren is listVisible). `store.ts:693-696` (listEntries reads the open book only). `AWAKE` appears 10 times in `draft-card.test.ts`: one constant and the 9 calls the body names. The 2 card rows and the test title `[NS-23-R8] quiet book never resurfaces` match the card. The design lines are at 125, 136 and 210.
- Privacy: the guard runs on the phone, and the Home card reads a phone-only L2 field. The diff adds no log, analytics, crash or network call (grep of the added lines). No letter words move anywhere new.
- The guard cannot be skipped: `book` is a required parameter, so a caller that leaves it out does not type-check. There is one production caller (`index.tsx:210`).
- Hidden books: a hidden book is never the open book, because `getActiveChildId` picks from visible books only. So no letter from a hidden book can be chosen, which is NS-23-R8's hidden half.
- Fixtures: Asha and Avi only.

## Findings, most serious first

1. Note, for the founder and for #721 (flagged in the body). Draft #721 deletes `resurfaced()` and puts a "From the book" picker in its place. Whichever PR lands second must carry the quiet guard into the picker, with the `[NS-23-R8]` test. I suggest recording that as a handoff on #721 now, not only in this PR's body, so the guard is not lost when the conflict is resolved.
2. Note. The design (`10-reading-and-family.md:125`) asks for the `[NS-23-R8]` test to run "with the flag off and on". There is no flag yet, so the guard sits outside any flag, as the design asks. When NS-23 PR 3 adds `EXPO_PUBLIC_PAST_LETTER`, the test should run under both values.
3. Note. The guard checks only the open book, which is enough because the built card looks at the open book alone. If a later picker looks across books, it must test each book's `quiet`, not only the open book's.

## Not verified

- I did not run the suite. I relied on the PR's claims and on CI.
- The first-frame cost of the extra `getActiveChild` read on an iPhone SE 3 (B-NFR-008). It is not in my lens.

CI at this head: `required` passed, and so did tests and content rules, typecheck, database rules and the Deno functions. `store-profile Release launch` is still queued, as it is on every PR in this batch. One duplicate `compliance-fence` run was cancelled, and its twin passed. The head commit is from 06:04 UTC, so it is more than 10 minutes old.

Reviewer: independent of the author (CR-44).
