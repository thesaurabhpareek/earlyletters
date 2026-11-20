## What and why

Four shipped screens had no design spec on develop: Delete this book (with Recently deleted, Restore and Erase now), the Book page, Write, and If you are struggling. The founder asked that design and product come first so engineering builds the right thing. The Chief Design Officer's note of 9 Nov named the gap and asked `design-systems` to write the specs. Docs only, no app code.

**New** (`docs/design/screens/`, one file per screen, written from the code at develop `6cd2223b`; the verdicts taken from the 9 Nov audit and CDesO note, which are not in the repository, are restated in each spec where used):
- `DELETE_THIS_BOOK.md`: the two steps, the typed word, Recently deleted, Restore the book, Erase now, the focus and announcement rules, and the agreement parts (Shown, Records, Never, Decline; Records and Never are PROPOSED for the CPrivO to confirm). The sole-book problem is ruled: the CPO chose option (a) of BL-776 (first run shows the existing Recently deleted row while a deleted book waits, no new line), recorded as CPO-10 in #723, which is not merged yet; only the placement is OPEN, with the CDesO, and the Undo-in-the-toast suggestion is PROPOSED WORDING for the founder. The code facts behind it are listed with file and line.
- `BOOK_PAGE.md`: the cover band, the Months sheet, the whole-word excerpt, the voice marker, the inline bar and its large-text form (**OPEN**: title row only, or no bar), VoiceOver order.
- `WRITE.md`: the footer rule at accessibility sizes through `footerPlacement` and the scroll rule that keeps the last line typed in view (both built by #717, merged 9 Nov 2026 as 95df5c41; this spec describes them), the standing Plus line (the spec is above the two buttons; below is PROPOSED for the CPO and the founder), Another thought, and the departures that remain.
- `STRUGGLING.md`: Call and Text visible in light and dark, the country in the emergency card (**PROPOSED**, two options), heading levels. Finding: React Native 0.86.3 passes no heading level to iOS (a search of the package for `aria-level`, `accessibilityLevel`, `ariaLevel` finds nothing), so the audit's heading-level fix is for the web build; VoiceOver on an iPhone sees headers without levels.

Each spec has: purpose, states (empty, loading, error), Dynamic Type to AX5, dark mode with computed contrast, Reduce Motion, VoiceOver order and labels, tokens and library components, copy keys, the device step id, and "where the build departs from this spec" with file and line. Anything undecided is marked OPEN with its owner.

**COMPONENTS.md**
- 2.20 rewritten to the `MonthOpener` that PR #674 left (no numeral, no lit card; the light moved to the cover band, the count line to the Months sheet).
- Rows added to the built table for `CoverBand`, `MonthsSheet`, `SpeechRow`, `PlusLine`, `HelplineCard`, as built.
- 2.11: destructive rows use the `destructive` tone, not a `caution` label.

**DEVICE_TEST_PLAN.md** (three small edits at three distinct anchors)
- New **S1-153**: five checks only a phone can make (sole-book Delete; Delete step 2 with VoiceOver and the keyboard; the Book's inline bar at AX5, the band's VoiceOver walk and the Months list scroll; Call and Text in light and dark with the rotor; the speech row with Voice Control). Write at large text is S1-165 (#717). Id checked: no `S1-153` on develop, in any remote branch's `docs/`, or in any open PR patch.
- S1-38 marked superseded (it checks the numeral #674 removed).
- S1-142 gets an **Update** line that points at S1-165 for AX5 and says the Plus line's position is undecided. It touched the same lines #717 edited; #717 has merged and the conflict is resolved (develop's Record line and this PR's Update line are both kept).

## Second round (after reviews A and B on 40fcc3bf)

Review rounds two to five, on top of the first commit (the last: the specs say #712, #713, #714, #717 and #723 are merged). What changed:
- **Plus line placement.** The spec is "above the two buttons" (F14-REQ-040 and journey row 2b, `F14-plus.md` lines 427 and 158; BL-560 states no position). "Below" is shown only as PROPOSED by the CDesO, for the CPO and the founder to decide. WRITE.md, the COMPONENTS PlusLine row and the S1-142 Update line now say so, and it is no longer in the `mobile` hand-off.
- **#717.** Named in WRITE.md and below. Its footer, scroll and S1-165 replace my WRITE departures 1 and 2 and the old S1-153 (c), which is removed (S1-153 is now five rows, a to e).
- **BL-776.** DELETE_THIS_BOOK.md sections 4, 11 and 12: the CPO ruled option (a) (CPO-10, merged in #723): onboarding shows the existing Recently deleted row while a deleted book waits, no new line. Only the placement is OPEN, with the CDesO. The interim Undo-on-toast suggestion stays as PROPOSED WORDING for the founder.
- **Erase wording.** DELETE no longer uses "Nothing is sent anywhere". The "four lines" heading is now "the agreement parts"; Records and Never are PROPOSED for privacy; whether deleting a book is a door at all is an open point for the CPrivO.
- **Write facts.** Autosave: a kill mid-burst loses what was typed since the last pause of 500 ms or more, because the timer restarts at every keystroke and has no maximum wait; the half second is the catalog target (RT-WRT-05, a gap). That is a departure row (WRITE.md section 11 item 7) with an owner (`mobile`, proposed High, the CPO sets it) and a proposed fix. Only "Add to Asha's book" gets the outline edge when off; "Keep private" is a muted label. Two `size={14}` icons and `ANNOUNCE_EVERY_MS` are listed as literals.
- **A correction to my own first version, and to the audit.** A `secondary` button's label is ink (`secondary-foreground`, `button.tsx:71-77`), 12.07 / 11.20 on its fill; its icon is `accent` (4.74 / 5.99). The first version said the label was accent. The point stands: the fill against a card is 1.08 / 1.33 and the shape disappears.
- Smaller: wrong section pointer fixed; day-30 sentence softened and given an owner; COMPONENTS 2.1 brought in step with the code; S1-153 Needs say run (a) last, name the Network Link Conditioner, and the Months-sheet scroll joins (c); "7 days" and the date sheet and export added to the Month N list; the sample prompt is no longer invented; the audit and the CDesO note are marked as not in the repository where first cited; owners added for the shelf's words (content with counsel and the founder), 2.20 against F09-book.md line 55 (CPO), and the confirm page's fill (design-systems).

## PROPOSED WORDING and decisions for the founder and the owners

No new sentence is added to the product. The items below are for approval:
- **Ruled (CPO-10, PR #723):** BL-776 option (a). Onboarding shows the existing Recently deleted row while a deleted book waits. **OPEN, CDesO:** where it sits.
- **PROPOSED WORDING (founder):** the Undo on the delete toast, if the row is not enough (the word exists; the placement is new).
- **PROPOSED WORDING (reuse):** the dimmed Delete the book button's hint is the existing `bookTypeToConfirmLabel` ("Type delete to confirm"). PR #714 (merged) built this.
- **PROPOSED WORDING (the CDesO's text, STRUGGLING.md section 4, option B):** "Not in {country}? Lines in other countries" (42 characters: a row or link, not a button). Option A is the country's name alone and adds no sentence. `struggling.*` is founder-owned (FT-36).
- **OPEN, CDesO:** the Book's inline bar from AX1 up (title row only, or none).
- **OPEN, CPO and founder (CDesO advises):** the Plus line below the two buttons on Write and Tonight. Spec stays above.
- **OPEN, `content`:** "7 months" in the Book against "Month 7" elsewhere; words for a delete error line and a missing-book page; whether the shelf's help line names books (with counsel and the founder).
- **OPEN, CPO:** a warning before the day-30 purge; 2.20 against F09-book.md line 55.
- **OPEN, CPrivO:** whether deleting a book takes the agreement parts.
- **OPEN, design-systems:** one rule for `secondary` buttons on a card or the lit band (proposed: `outline`); the confirm page's filled destructive form in COMPONENTS 2.1.

## Overlap and merge order

- **#717** (merged 9 Nov 2026 as 95df5c41, `fix/mobile-write-footer-large-text`) builds the Write footer inline from AX1 and the scroll that follows the words, and adds device step S1-165. This PR merged develop in (72901754) and resolved the one S1-142 hunk in the device plan: develop's Record line, this PR's Update line, and #717's S1-165 block are all kept.
- **#596** (open, conflicted) adds `screens/SETTINGS_AND_ACCOUNT.md` and `TONIGHT_AND_MEMORIES.md`. It holds Settings home, Erase everything and the Plus-line rules, which I point to and do not repeat. None of the four screens here is in it. Its COMPONENTS **2.20** was written from build 1 and describes the numeral and the lit variant that #674 then removed, so it is now wrong. When #596 is rebased, **take this PR's 2.20.** A trial merge of this branch with #596's head has one conflict hunk, COMPONENTS.md 2.20; #596 already conflicts with develop in COMPONENTS.md and MOTION.md on its own. #596 also changes two other COMPONENTS.md lines that name MonthChapterHeader (lines 105 and 589 on develop); I left them alone so those hunks stay clean. #596's "VoiceOver reads the Plus line last" is the CDesO's proposal, not the spec.
- **#712, #713, #714** (merged 9 Nov 2026) built three of the departures these specs listed; COMPONENTS.md and the specs now mark them fixed: the speech row's action word in the label and stacked at AX sizes (#712), Call and Text as `outline` (#713), focus to the step 2 heading and the hint on the dimmed confirm (#714). They match the specs.
- **#723** (merged) records CPO-10 in `docs/agents/exec/RULINGS.md`; DELETE_THIS_BOOK.md cites it as on develop.
- **#701, #703, #716** (open) make the first book's name optional and edit `write.tsx`; line numbers in WRITE.md will move, and its labels use `{child}`.
- **#699** (open) edits `IA.md` and the device plan at S1-140; no overlap with my anchors.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [ ] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Not ticked, because I did not run the whole suites. Docs only; no source file changed. What I ran in the worktree at `6cd2223b` plus this commit:
- `packages/content`: `npx vitest run`: 15 files, 367 tests passed (includes the content rules and `no-real-family-data`).
- `packages/design-tokens`: 5 files, 98 tests passed.
- `apps/mobile`, every test that mentions `docs/design`, `DEVICE_TEST_PLAN` or the screens: `qa-release-catalog` (8), `p5-critics` (44), `first-run-cover` (18), `journey-index` (22), `review-critics` (21), `book-page` (30), `write-plus-line` (8), `theme-leaks` (4), `qa-kill-harness`, `sweep.disk`, `billing-plan-reminders-scheduler` (91 together): all passed. No test reads the new files.
- Added lines scanned for bytes of 0x80 or more (em and en dashes, curly quotes, ellipsis characters, emoji, the middle dot): none. Added lines scanned for the banned words in `_AUTHORING.md` section 7: none. `git diff --check`: clean.
- Contrast figures are my computation with the WCAG 2.x formula from `packages/design-tokens/src/tokens.ts`; the ones the token file already states agree with it.
- Every `file:line` in the four specs was resolved against the file at `6cd2223b` by script and the line read.

**Not verified, and only a phone can show:** what the person sees right after deleting the only book; where VoiceOver focus lands on Delete step 2; whether the confirm button is reachable with the keyboard up at AX3 and AX5; the height of Write's footer and the Plus line at AX3 and AX5 (S1-165; the figures in WRITE.md are a rough count from the type tokens); the height of the Book's inline bar at AX5 (the CDesO's "nearly half an SE screen" and my rough 330 of 667 pt); the cover band's VoiceOver order; whether the Months list scrolls inside its sheet at 60 months; Call and Text in light and dark; the rotor on Write and on the struggling page; Voice Control "Tap Stop". S1-153 and the existing S1-133, 142, 150, 151, 152 hold the rows.

Size: 6 files, about 810 insertions and 18 deletions against develop, over the 400-line guide (CODE-R01). Four independent specs plus the component and device-plan edits that cite them; splitting would separate documents that point at each other. All docs.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only; Write's spec restates that typed words are stored as typed)
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (n/a, no behaviour changed)
- [ ] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (n/a, no code)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy added; the specs cite keys)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports (the Delete spec records that the flow has no `track` call and sends nothing)
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [ ] Database changes are a new migration file (n/a, none)
- [x] The public product name comes only from `packages/brand` (the new text does not use it)

## Screenshots

n/a. Docs only.

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
