## Review A at c00d9099b71758842f210b5e1b6540136f529e05: PASS WITH NOTES
<!-- agent:qa -->

Lens A: correctness, and tests that fail on the old code. BL-928 slices (a) and (b): NS-33-R1 and NS-33-R2. Built from the spec on `docs/design-bl-927-ns33-floor` (#867), sections 1, 3 and 4, and the locked card NS-33 at 450bcb4a (`docs/product/prd/11-foundations.md:262-263`).

Must fix: none.

### What I checked
- Head c00d9099, committed 11:59 UTC on 20 Nov, more than 10 minutes old at review (12:29). Read live; it did not move.
- CI at the head: `required`, `tests and content rules`, `typecheck`, `database rules`, `edge functions`, `compliance-fence`, `install` and the rest completed with success. One duplicate `compliance-fence` run was cancelled; its sibling succeeded. The iOS simulator build was skipped. `store-profile Release launch` was still queued at 12:29; it is not part of `required`.
- The change is what the spec asks for and nothing more:
  - `app/letter/[id].tsx:220`: `asHeading={1}` added to the dateline `Text`, after `accessibilityLabel`. Label, variant, caps, ref and testID are unchanged.
  - `app/(tabs)/_layout.tsx`: the one line `headerTitle: copy.settings.title` (develop :91) is deleted. `title: t.you` (:87) is untouched, so the bar shows "Me" from the tab's own key. No new words, no new key.
- Red on the old code. I copied the head's four test files onto a develop worktree (2f2beb77; no `apps/mobile` drift from the merge base 30bbd5a4):
  - `[NS-33-R1] letter page heading` fails at step 1, on `asHeading={1}`.
  - `[NS-33-R2] Me heading matches tab` fails on `headerTitle`.
  - `[NX-30a-R7]` in `tab-bar.test.ts` and 'Header "Me" is heading 1' in `you-tab-states.test.ts` fail on `headerTitle:`.
  - At the head, all of them pass (27 of 27 in the three files).
- No test was weakened:
  - `tab-bar.test.ts:61` flips from `toMatch(/headerTitle: copy\.settings\.title/)` to `not.toMatch(/headerTitle:/)`, as spec section 4 says. R7's other checks (`headerShown: true`, no `headerLeft`, no lamp) stay. The positive half of the new truth, `title: t.you,` in the `name="you"` block, is asserted in `a11y-headings.test.ts` and in `you-tab-states.test.ts:202`. The colon keeps `headerTitleStyle` out of the match. In `a11y-headings` the stricter `/headerTitle\b/` also leaves `headerTitleStyle` alone, because there is no word boundary inside it.
  - `you-tab-states.test.ts:198` now asserts `title: t.you,` and no `headerTitle:`, in place of the old line. That tests the new truth, not nothing. The renamed title carries no requirement id, and no doc on the head cites the old title.
  - `book-logic.test.ts:217` pins the dateline's attributes up to the label. The PR adds the prop after the label rather than editing that test.
- Mutations on a copy of the head (a11y-headings, tab-bar, you-tab-states, book-logic):
  - Killed: `asHeading` as a boolean; `asHeading={2}`; `headerTitle: t.you` added; `headerTitle: () => null` added; `title` changed to `copy.settings.title`; `headerShown: false`; a second heading put in `OpeningBlock` before the dateline.
  - Survived: see note 1.
- Full `apps/mobile` suite at the head, with the worktree's own packages: 8 files and 73 tests fail. They are the known sandbox baseline (`app-lock-wiring`, `capabilities`, `config`, `hosting-ios17`, `licences`, `preflight-production`, `privacy-manifest`, `store-sign-in-capabilities`). Develop gives the same 8 files and 73 tests. The head has 2 more tests than develop (5094 against 5092), all passing.
- `npm run typecheck`: the 5 known mobile errors (`expo-clipboard`, `expo-local-authentication` and three that follow from it). Also one more in `test/qr.test.ts` (`qrcode-generator` is not installed in this sandbox). That file is not touched here.
- Cites held: 9 of 9.
  - Cites in the PR body: `letter/[id].tsx:220`, `text.tsx:166-173`, `_layout.tsx:91` on develop, `tab-bar.test.ts:61`, `you-tab-states.test.ts:198`, the `book-logic` order pin.
  - Cites in the spec: carried copies hidden at `card-transition.tsx:490-495`; no other heading marker anywhere in `letter/[id].tsx`; `#839` hunks at 78 and 410.
- Merges: auto-merges cleanly with #893 and with `letter/[id].tsx` of #839. #839, #780 and #740 already conflict with develop on files this PR does not touch.

### Findings
1. Note. The R1 test checks "no heading before the dateline" by source order. Two things the page draws above the dateline sit later in the file:
   - the "Aa" button's `Text` (`letter/[id].tsx:341`);
   - the "Exactly as said" caption (`:399`).
   Adding `asHeading={2}` to the caption, or `asHeading` to the "Aa" text, passes the test. So does `variant="h2"` before the dateline, because `HEADING` lists only `h1`, while `text.tsx:80-84` makes `h1` to `h4` headings. This is the check spec section 3 defines, and V1 on the phone covers rotor order, so it is not a must-fix. Suggested next touch:
   - widen `HEADING` to `variant="h[1-4]"`;
   - assert that the `aa` element and the caption carry no heading marker.
2. Note. `docs/tdd/new-scope/11-foundations.md:96` (R2 row) still says `headerTitle: t.you`. Spec #867 section 4 refines that to deleting the line, and the code follows the spec. Align the TDD row on its next touch.
3. Note. Drafts #780 and #740 change `(tabs)/_layout.tsx` and `tab-bar.test.ts` from an older base. The PR body says this. Whichever merges second must keep `not.toMatch(/headerTitle:/)` and must not bring back the old line.

### Not verified
- V1 and V2 (VoiceOver on an SE 3) and spec F-3 (the "Me" title at AX5 in a 44 pt bar). These need a phone.
- The web e2e flows. I read `e2e-web/support/app.ts:66` and `j17-family.flow.ts:16`. The `tab(app, 'Me')` helper prefers `role=tab` and the last "Me" text, so a "Me" header should not change what it finds. I did not run it.

Reviewer: independent of the author (CR-44).
