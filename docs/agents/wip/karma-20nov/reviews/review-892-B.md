## Review B at c00d9099b71758842f210b5e1b6540136f529e05: PASS WITH NOTES
<!-- agent:design-systems -->

Lens B: accessibility and the design system. BL-928 slices (a) and (b): NS-33-R1 and NS-33-R2. Read against the spec on develop (`docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md`, section 1, then sections 2 to 4 and 7) and the locked card NS-33 at 450bcb4a (`docs/product/prd/11-foundations.md:262-263`).

Must fix: none.

### What I checked
- Head c00d9099, committed 11:59 UTC. Read live at 12:34 and unchanged, so more than 10 minutes old.
- CI at the head:
  - `required`, `tests and content rules`, `typecheck`, `database rules`, `edge functions` and `install` all succeeded.
  - One duplicate `compliance-fence` run was cancelled. Its sibling succeeded.
  - The iOS simulator build was skipped.
  - `store-profile Release launch` is still queued. It is not part of `required`.
- I ran the tests in a detached worktree at the head, using the head's own workspace packages: `a11y-headings`, `tab-bar`, `you-tab-states` and `book-logic` gave 54 of 54.
- VoiceOver on the letter page (R1):
  - The dateline `Text` gets `asHeading={1}` (`app/letter/[id].tsx:220`). `Text` turns that into `role="heading"`, which iOS reads as the Header trait, plus `aria-level="1"` for the web build (`components/ui/text.tsx:166, 172-173`). The label `spokenDateline` is unchanged, so VoiceOver reads the same words, then "heading".
  - One heading at rest. There is no other heading marker in the file. In its imports:
    - `ListSection` is used without a title (`:461`), so it draws no heading.
    - `AudioPlayer` and `AppNote` draw no heading.
    - The sheets' title headings (`components/ui/sheet.tsx:195`) exist only while a modal sheet is open (`:188`).
  - In card mode, the route hides the native header (`:393`; `app/_layout.tsx:229` sets `title: ''` in any case). The top bar holds Back and "Aa", and neither is a heading.
  - The carried copies stay hidden from VoiceOver (`components/motion/card-transition.tsx:491-494`). The page's own copy is hidden until it settles (`:230-231`), and then focus moves to the dateline (`:300`). So the rotor finds the dateline first and once, and focus lands on a heading.
- VoiceOver on Me (R2):
  - With `headerTitle` gone, the tab header falls back to `title: t.you` (`getHeaderTitle.js:4-9`), which is "Me" (`packages/content/src/strings.en.ts:63`). The header draws it as `role: "heading"`, `aria-level: "1"` (`HeaderTitle.js:10`).
  - Settings home draws no heading of its own. Its `ListSection` titles (`app/settings/index.tsx:138, 152, 159`) are headings with no level, below the bar title. So "Me, heading" is the first heading, and the tab item and the screen heading now say the same word.
- Voice Control: no control's name changes. The tab button still says "Me" and keeps the Large Content Viewer (`_layout.tsx:57`, R13). The new "Me" bar title is a heading, not a control, so "Tap Me" still has one target.
- Dynamic Type: no size, cap or layout changes. The dateline keeps `letterDateline`, capped at 2.4, and it wraps. The bar title is shorter than before ("Me" against "Settings"), so spec F-3 (the title spilling out of the 44 pt bar at AX5) can only get better. Below accessibility sizes, nothing changes except the Me bar's word, which is the row itself.
- Tokens and the design system: no colour, size or duration is added. `headerTitleStyle: { color: c.text }` was already there. No shared component changes.
- Cites held: 16 of 16.
  - The PR body: `letter/[id].tsx:220`, `text.tsx:166-173`, develop `_layout.tsx:91`, `tab-bar.test.ts:61`, `you-tab-states.test.ts:198`, the `book-logic` attribute-order pin.
  - The spec: `card-transition.tsx:492-499, 230-231, 300`; develop `letter/[id].tsx:392` and `:219-221`; `transitions.logic.ts:53`; `_layout.tsx:87`; `strings.en.ts:63`; `getHeaderTitle.js`; `HeaderTitle.js:10`; no heading in Settings home.

### Findings
1. Note. The R1 test pins "no heading before the dateline" by source order, and only in this file. Review A found two gaps: `variant="h2"` to `h4` are not in `HEADING`, and the caption and "Aa" text are not pinned. Both fall within the rule the spec set in section 3. The rotor order on a phone (V1) is the proof, so this is not a must-fix. On the next touch:
   - widen `HEADING` to `variant="h[1-4]"`;
   - assert that the `aa` element and the caption carry no heading.
2. Note. On iOS, "level 1" can only mean "the first and only top heading", because React Native passes no level to iOS (spec section 2). The test and the PR body both say so. Keep that wording in the V1 script, so nobody on the phone listens for "heading level 1" and fails a correct build.
3. Note, for the design system and not for this PR. The spec's section 8 lines are not yet in `docs/design/COMPONENTS.md`. They cover `heading` rather than `header`, and one level 1 heading per screen, which is the screen title or, on the letter page, the dateline. Once this PR merges, the code and the spec agree, and COMPONENTS 2.3 is the only place that still says `role="header"`. I will carry this in my backlog. It does not hold this PR.
4. Note. Two names for one screen stay until BL-938 (spec F-5): `/settings`, opened from the Book's gear, says "Settings". The PR body tells the founder. No action here.

### Not verified
- V1 and V2 on an SE 3: where VoiceOver lands, the rotor order, and "Me, heading". These need a phone.
- Spec F-3: the "Me" bar title at AX5 in a 44 pt bar.
- The web build's heading levels in a browser.

Reviewer: independent of the author (CR-44).
