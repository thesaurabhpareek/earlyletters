Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 20:20 UTC).
Blocked until: the founder approves the BL-965 words (#870): the `more` line, the `recordingsHere` line and the "not on this phone" clause of the provenance line are all PROPOSED keys, and without a flag a PROPOSED key would ship, so this merges only after approval (design 3.3). Also BL-978a merged. Conflict for product, not decided here: the card's R13 second key against the design's reuse of the `newPhone.arrival` setting with value `dismissed`; the design's K9 says the built behaviour differs from the card (a line on every card).

```
BRIEF BL-978b (Book-level line for absent recordings)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 20:20 UTC
Agent: mobile   Lane: Pack 3 (Account and consent)   Build: 14 (words wait; Q1 decides)   Wave: 1 (after words)

1. GOAL: When backup is off and the book arrived on a new phone, the Book shows ONE line at the top saying some recordings are not on this phone; it stays until dismissed and never appears on every card.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R2, R13; NS-10-R1 (device). Card 08 at 450bcb4a.
   Titles (catalogue A, PR #925, exact):
     [NS-10-R2] a slow arrival shows what has come
     [NS-10-R13] one book-level line for absent recordings
   R2: pull 400 of 1,000 Asha letters with 10 s elapsed; the Book lists the 400 plus one `more` line, never empty, never the child step (mutant: show the empty state while pulling).
   R13: backup off, new phone; one line at top; dismiss; not shown again; mutant: show a per-card line. Red on develop: no `arrivalLine(...)`.

3. FILES  Touch: lib/first-run/new-phone.logic.ts (pure `arrivalLine(...)`), lib/provenance.ts (one clause), app/(tabs)/book.tsx (the one slot, 122-133 on develop: re-open; put it in a hook, CODE-R06),
   tests new-phone-arrival, provenance, book-page; PROPOSED keys through `content`.
   Never: lib/find/**, photo lens code, app/_layout.tsx. Shared file rule: `book.tsx` with #840, BL-938, BL-937 and BRIEF-BL952-8.

4. READING PACK: Pack 3 items 1 to 3; `08-keeping.md` section 3.2 (R2, R13 bullet); docs/design/e2e area C C-S10 and area B B-S01 (PR #921).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/first-run/new-phone.logic.ts:85-101   ARRIVAL_SETTING `newPhone.arrival`, PENDING and SHOWN, `arrivalToWrite`, `arrivalLineOwed`: gains the value `dismissed` (L2, phone only)
   apps/mobile/src/lib/first-run/new-phone.logic.ts:65         at 10 s the route already answers `arrived` when a page has landed (R2 needs only the `more` line)
   apps/mobile/src/lib/provenance.ts:41-47                     `provenanceLine`: gains a PROPOSED "not on this phone" clause for the parent's own spoken letter with no `audioUri`
   apps/mobile/src/app/(tabs)/book.tsx:122-133                 the arrival line slot [U: the design cites these lines; re-open]

6. DATA AND SECURITY
   Data classes: L2 one setting value on the phone. New storage: none beyond that value. Nothing sent; nothing logged. Boundary: none new. Owner of the read: none beyond lens B (design-systems).
   Never say a recording is here when it is not (J-N2).

7. LIBRARIES: none.

8. BUDGETS (PR #928): L-03; the line's state is read from the settings already loaded (no extra awaited read at launch). Checked: unit.

9. ACCEPTANCE  Experience: C-S10 and B-S01 (PR #921); EX-03 (no extra h1), EX-04. Test cases above. Done also means: red on old code and on mutants.

10. PR BREAKDOWN: one PR, about 300 lines, 8 files (design 3.6 PR 5), base develop after BL-978a and the words, branch `feat/mobile-bl-978b-arrival-line`. Flag-off proof: none (no flag): the merge waits for the words.

11. LENSES: A principal-architect, B design-systems (plan 2.3).

12. ORDER: after BL-978a and BL-965 words; before BL-938. Blocked by: founder (words).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npm test -w packages/content`; `npx tsc --noEmit` apps/mobile: only the 5 known errors
    [ ] ASCII only; keys PROPOSED; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: S1-204 (one line, once; again after a fresh install), a real slow pull, VoiceOver and AX5 on the line.

15. STOP AND ASK: a per-card warning is wanted (K9 says no); the words change; a second setting key is wanted.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl978b agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl978b.md`. Comments start `<!-- agent:mobile -->`.
```
