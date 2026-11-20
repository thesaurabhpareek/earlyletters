## Review B at 97835c3116558dc83d2424d456096016b9a0b642: PASS WITH NOTES

Lens B (design, safety, rules), PR 713, re-review at the new head, delta only. Head confirmed with gh api: 97835c31... equals the sha I was given, one docs-only commit on f6f80713. This replaces my review at f6f80713. Anything in my earlier reviews that is not repeated here still stands: outline is the right call, no code regression, the size question is a follow-up now written into the PR body, and the label colour never changed (my first review was wrong on that and was corrected in the second). A PASS holds only once required CI is green at this exact head; it is not yet (see CI).

**Delta read** (`git diff f6f80713 97835c31`): one file, `docs/qa/DEVICE_TEST_PLAN.md`, one line (the S1-150 Steps line). Only (g) changed; (a) to (f), Needs, Expected and Record are byte-identical to the previous head. No source, test or string change. Non-ASCII scan of the added line: none. No new word a parent reads, no dash, curly quote or ellipsis character.

**Both must-fix items from my last review are fixed and true**
1. Region reset. (g) now begins "Set Region back to United States (step (c) left it on Germany, which shows no lines)." Checked against the other steps: (a) uses the same path and value; (c) sets Germany; nothing in (d), (e) or (f) changes the Region; Expected (c) says Germany shows no button; `helplinesFor('DE')` is null, so the main page has no Call, Text or Call 911 there. In United States the main page has the emergency card and three lines, so the Expected (g) claim (one filled button on the main page) is now checkable.
2. Setting name. (g) now says "In the app, Settings > Appearance > Theme: Match this phone." This matches the code: row "Appearance" (`settings/index.tsx:142`), section "Theme" (`strings.en.ts:1259`), choice "Match this phone" (`strings.en.ts:1261`), default when nothing is stored (`_layout.tsx` `useAppearance`).
The rest of (g) reads in a workable order: Light, look at the main page and Lines in other countries; Dark, look again; Increase Contrast on, look in Dark; choose Light, look again. The Increase Contrast path (Settings > Accessibility > Display & Text Size) and Display & Brightness are right for iOS 17/18. Record still asks for (g) screenshots with and without Increase Contrast.

**PR body re-read:** the "Text where the line has a text number" correction is accurate: in `helplines.ts` two of the 8 lines (`gb.samaritans`, `au.panda`) have a `tel:` and no `sms:`. The full-suite figure is now marked "run before the tenth test was added; not re-run at this head", which is honest. Size is a proposed backlog row for `product`; the design-systems review is stated as not in the repository. No dashes or non-ASCII characters in the body.

**Ran:** `helpline-buttons-visible` (10), `settings-help` (17), `struggling-regions` (22), `qa-release-catalog` (8, reads the plan) = 57 pass at this head.

**Nit, not blocking:** the page reads the region once when it mounts (`phone-region.ts`, `useMemo(..., [])`). If the tester returns to the app with the struggling page still open from step (c), it keeps showing Germany until it is closed and opened again. Step (b) has the same convention ("open the page each time"); (g) would be clearer with "close and open the page" after the Region change. Still open and pre-existing: `COMPONENTS.md:118` omits `outline`; the PR checklist boxes for `npm test`, `test:db`, `typecheck` are unticked.

**Must-fix:** none.

**CI at 97835c31** (10 check-runs when I looked): edge functions, install, native files changed?, applied migrations unchanged: success; simulator build skipped; `typecheck`, `tests and content rules`, `database rules`, `no e2e seam` in_progress; `store-profile Release launch` queued; the aggregate `required` check had not appeared yet. Required `compliance-fence` ended `startup_failure` again at this sha (both runs), as on every recent head, so infrastructure rather than this diff, but it is not green and the PR reports `blocked`. Merge-tree against develop (still 6cd2223b) is clean. Merge only when `required`, `applied migrations unchanged` and `compliance-fence` are green on this head.

**Not verified:** anything visual on a device, whether iOS relaunches or leaves the app mounted when Region changes, local `tsc` (CI typecheck pending), `test:db`.

Reviewer: independent of the author (CR-44).
