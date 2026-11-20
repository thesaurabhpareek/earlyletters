Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC).
Blocked until: BL-931 done (#835 to #840). Conflict E2 (11-foundations section 8.5) is open and is Karma's and design-systems' to settle, not mine: eval B writes the stored copy as soon as the draft row exists, and Listen creates that row on Speak, so a HEIC or rotated picture would be re-encoded DURING the take, which breaks NS-37-R2 (P0, no decode while recording). Recommendation in the design: bake at Ready before Speak, or once `captureBusy()` is false; never during. Build to that recommendation only after Karma says so.

```
BRIEF BL-955 (a picked picture survives a kill)   Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When the app is killed after a picture is picked but before Review, nothing is kept; once Review is open, a kill keeps the draft with its picture;
   and no orphan file or row survives the next launch sweep.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R43, R36, R44, R57; NS-37-R2. Card 01 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R43] a kill before Review keeps nothing; after Review keeps the picture
     [NS-01-R36] a kill leaves no orphan after the sweep
     [NS-01-R44] an update keeps a draft's picture
     [NS-01-R57] an interruption keeps the picture on Ready
   Red on develop: no `entry_media` and no draft link (the stack is unmerged). Mutants (catalogue B): write the file at pick time (R43); skip the sweep of orphan files (R36);
   migration drops drafts' media rows (R44); discard on `inactive` (R57). Note the BL-955 backlog text and the card disagree on timing: the backlog says write the copy "as soon as
   the pick returns"; the card title says nothing is kept before Review. Card wins; write a Conflict line to product.

3. FILES  Touch: lib/photos/{session,pending,adopt,housekeeping}.ts, lib/capture/sweep.ts, app/review.tsx (the adopt call only), tests photos-capture, photos-device (kill points).
   Never: app/_layout.tsx, modules/scribe-photo, lib/find/**. Shared file rule: `review.tsx` is #838's and #839's file; this lands after both.

4. READING PACK: Pack 1 items 1, 2, 4, 7; 11-foundations section 8.5 (E2) and section 7 (NS-37-R2); `apps/mobile/e2e/kill/protocol.mjs` (four crash points) and workflow `kill-harness.yml`.

5. CODE ENTRY POINTS (develop 16e61549; stack heads)
   apps/mobile/src/lib/capture/busy.ts:20          captureBusy()
   #837 head: src/lib/photos/pending.ts, adopt.ts:10   the pending picture and the `adopting` latch
   #835 head: src/lib/photos/housekeeping.ts, lib/capture/sweep.ts   the sweep
   apps/mobile/e2e/kill/protocol.mjs                 add two crash points: `after-copy-before-row`, `after-row-before-sweep` (PROPOSED, budget C-08, PR #928)

6. DATA AND SECURITY
   Data classes: L4 picture. New storage: the stored copy and one `entry_media` row against the draft earlier than today; the sweep removes an orphan. Nothing sent, nothing logged.
   Boundary: B1; NSC-08. Owner of the read: none beyond lens B (data-steward). Privacy line: nothing leaves the phone; a pick under App lock is dropped (R47).

7. LIBRARIES: none. The kill harness exists (`kill-harness.yml`).

8. BUDGETS (PR #928): C-08 kill while attaching: 0 orphan files, 0 rows pointing at a missing file, words intact (sim, HOLD); C-09 nothing decodes during a take (unit, BLOCK);
   C-06 kill during save: 0 losses (rides the same harness). Checked: C-09 by unit; C-08 by the harness on a PR touching capture paths (5 runs per mode); SE 3 by hand is a device row.

9. ACCEPTANCE  Experience: A-S03, A-S06 withPhoto, A-S07 (PR #921). Test cases above; journey J-N9 row 4.1. Done also means: red on old code and on the two named mutants.

10. PR BREAKDOWN: one PR, about 250 lines excl. harness scripts (S), base develop, branch `feat/mobile-bl-955-picture-survives-kill`. Flag-off proof: switch off registers nothing (`photos-phone.test.ts`).

11. LENSES: A principal-architect, B data-steward (plan 2.4).

12. ORDER: after BL-931; before BL-956. Blocked by: BL-931, Karma on E2.

13. DEFINITION OF DONE
    [ ] tests red on old code; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only 5 known errors
    [ ] ASCII only; no path or hash in a log; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: kill harness on SE 3 (50 kills, C-06); a kill mid-pick with a real iCloud picture.

15. STOP AND ASK: E2 is ruled "write at Speak"; the card and the backlog timing disagree; the kill harness needs a workflow patch (the founder's).

16. HARNESS: claim row: NONE yet for this brief; Karma adds it before the agent starts. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl955 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl955.md`. Comments start `<!-- agent:mobile -->`.
```
