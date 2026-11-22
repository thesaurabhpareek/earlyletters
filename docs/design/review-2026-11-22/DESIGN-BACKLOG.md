# Design backlog: consolidated from four reviews (22 Nov 2026)

Status: DRAFT for Karma. Author: `design-systems`. Docs only: no token, component, string or screen changes. ASCII only. `{child}` stays `{child}`.

Sources, all read in full this session:
- DSR: `docs/design/review-2026-11-22/motion-tokens-a11y.md` (#1571, merged), 28 ids.
- NEU: `neutral-findings.md` (#1572), 35 ids.
- CDO-A: `cdo-capture-onboarding.md` (#1573), 28 ids.
- CDO-B: `cdo-home-moments-book-me.md` (#1574), 59 ids.
- #1572 to #1574 were still open when this was written, so I read them from their branches (`docs/design-review-neutral`, `docs/design-review-cdo-a`, `docs/design-review-cdo-b`) by `gh api` contents. If a review changes before it merges, this file needs a re-read of that review.

## How to read this

- One ticket can close several findings. Every source id is cited, with the final severity from its own file (not an earlier draft). A ticket carries the highest severity among its ids.
- Order: DS-3 and TR-1 first (section 1); then the one customer P0 (section 2); then customer-facing P1s that are live today (section 3); then customer-facing P1s that are dark behind the Moments flag (section 4); then internal re-syncs and design-system work (section 5); then smaller fixes (section 6). Customer-facing P1s are ahead of internal spec re-syncs, except the two first by instruction.
- Lanes: `design-systems` is tokens, motion and transitions, components and accessibility rules. `mobile` builds. `content` owns words. `product` owns flow, scope and screen decisions. The reviews used five lanes (design-systems, motion, transition, content, mobile); their screen-design rows land in `product` here and their motion and transition rows in `design-systems`.
- Sizes: S under a day, M a few days, L a week or more.
- Evidence limits carry over. None of the four reviews ran a phone, VoiceOver or a test. Every "verified" in them is a file read. Nothing here is a measurement.
- Ids: the Id column is a proposal. `node scripts/agents/next-id.mjs` printed BL-1672 on develop; open PR #1617 already adds BL-1672 and BL-1673 in its patch, so I start at BL-1674. I searched the patches of all 89 open PRs for BL-1670 to BL-1999 and found no other claim (only #1617, above). Parallel PRs may still take ids before this merges: Karma renumbers at merge if `id-collisions.mjs` reports a clash.
- Not added here: any ticket for withdrawn or pass-only findings (section 10), and none for ruled items (section 8).

## 1. First, by instruction

These two come before everything else. Both are proof gaps, not known defects, and both feed the store-build decision.

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1674 | DSR-024 (P1), DSR-019 (P1), DSR-020 (P1), DSR-021 (P2), NEU-031 (P1), CDO-B-059 (P1); device checks left open by CDO-A-010 (P2), CDO-A-019 (n/a), CDO-A-018 (P1) | Someone runs the app on a real iPhone SE 3 at the largest text size, with VoiceOver, Bold Text and Voice Control, on the five NS-33 screens, the sign-in and consent sheets and the roughly 30 settings routes, and files what they found. In the same pass: confirm the three small controls reach 44 pt (child switcher, audio player, Listen), give every control in first run and add-child a role, and write the one table of which changes VoiceOver speaks. The DSR-024 P0 trigger is in section 9. | design-systems (writes the pass and the fixes; qa runs devices) | L | P1 (P0 trigger, section 9) | none |
| BL-1675 | DSR-015 (P1), CDO-A-026 (P2, the sign-in row only) | Every route pair in the one transition table is recorded on a phone, in normal motion and in Reduce Motion, and every seam (flash, jump, double fade) is logged. The file-into-month, card-to-page and page-turn moves and the dissolve are seen running for the first time. | design-systems (transitions; qa captures) | L | P1 | none |

## 2. The one P0 a customer feels

NEU-001 is the only P0 that survived review. Founder decision 1 in the neutral review sits behind it.

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1676 | NEU-001 (P0), NEU-005 (P1), NEU-025 (P2); NEU-004 is ruled, see section 8 | A new parent reaches the first recorded word in a path a stopwatch shows is close to the 90 second promise (PS1). Measure first on an SE 3, then decide which steps move after the first letter ('what {child} calls you', the promise step) and cut the finish to one primary. The age gate stays; the date of birth stays required (D-087). | product (founder decision, then mobile) | L | P0 | none (the stopwatch run needs no other ticket) |

## 3. Customer-facing P1, live in the build today

Ranked by how early a parent meets it. Rows that touch what Plus promises, what privacy says or what a voice is carry a CR-73 note: they go to the founder, not to a builder.

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1677 | CDO-A-001 (P1) | On every sign-in sheet, delete and erase confirm, the page title is never quieter than the sentence under it at the largest text sizes (the heading caps and the uncapped body no longer invert). Re-run NS-33 on an SE 3 after. | design-systems | M | P1 | BL-1674 (device proof of the size ratio) |
| BL-1678 | CDO-A-018 (P1) | The shared sheet frame, sheet title and provider buttons are read and fixed once so every sign-in screen has the right modal flag, role and label for VoiceOver. | mobile | S | P1 | none |
| BL-1679 | NEU-002 (P1), NEU-008 (P1), DSR-016 (P2) | The last first-run step has one primary, 'Write the first one', which opens Listen directly with Home underneath. The speech download is offered once, quietly, after the first take (the explicit choice stays, D-087). The hand-off and the sign-in-to-Home hand-off each get a named row in the transition table, with no hard cut into a lit room. | mobile (spec from design-systems) | M | P1 | BL-1676, BL-1675 |
| BL-1680 | NEU-003 (P1) | If the speech model is not on the phone, the first letter's Review shows a calm 'words are on the way' state with the recording playable, and a decided fallback (smaller first model or typed first letter) so a first session ends with something visible. Tested on an SE 3 on cellular. | product | M | P1 | BL-1676 |
| BL-1681 | NEU-010 (P1) | Review opens on a quiet default: the words, one Keep, one line that small fixes were marked, every control one tap away. Nothing is removed, only the default weight changes. | product | M | P1 | none |
| BL-1682 | NEU-011 (P1), NEU-030 (P2) | After Keep the saved moment finishes and the parent taps to go on before any sheet arrives. The sign-in ask for the very first letter is considered for session two. A test decides whether later letters land on Home with the saved moment as a toast instead of on Book. | design-systems (transition rule), mobile | M | P1 | BL-1675 |
| BL-1683 | NEU-033 (P1) | The second kept letter gives a warm heads-up on Book that the gate is next, with the held-letter promise visible, so letter three is not a first surprise. Words for content; the gate rules stay as they are (D-082). | product | M | P1 | none |
| BL-1684 | CDO-A-003 (P1) | The purchase-confirmed screen moves focus or announces on arrival, keeps 'Done' reachable at the bottom, and says something plain when 'Save a copy' fails to share. | mobile | S | P1 | none |
| BL-1685 | CDO-B-015 (P1) | Tapping 'Not much today' always answers: a quiet-day mark, or a calm line when it cannot be saved. It never does nothing. | mobile | S | P1 | none |
| BL-1686 | CDO-B-013 (P1) | The Home line that says new letters need Plus has a way forward on the same screen, or is reworded so it is not a dead end. CR-73: touches what the paywall promises, so the founder rules first. | content (founder, CR-73) | S | P1 | none |
| BL-1687 | CDO-B-049 (P1) | Read together says plainly when the app's own synthetic voice, not the writer, is reading. CR-73 and counsel read it, because it is the nearest finding to the constitution. | content (founder, counsel) | S | P1 | none |
| BL-1688 | NEU-032 (P1) | The promise-step title and its sample say the same thing: every small fix is marked, so 'stays in your words' does not read as 'exactly as said'. Check against the held PR #1286 (first-run promise title) before writing anything. | content (counsel) | S | P1 | none |
| BL-1689 | NEU-024 (P1) | One 'Privacy and your recordings' page answers who can see the letters, where they are and how to change it, and links the controls (backup, lock, export, delete). The short line stays once. | product | M | P1 | BL-1694 (shares the Me regroup) |
| BL-1690 | NEU-026 (P1) | A quiet door to invite a second voice appears on Book after the third letter, inside the one ask schedule, and a row sits at the top level of Me. | product | M | P1 | BL-1720 |
| BL-1691 | NEU-022 (P1) | A book of 60 letters can be searched or jumped through; Find moves ahead of the third Moments phase, and at least 'Go to a month' ships. | mobile | M | P1 | none |
| BL-1692 | NEU-009 (P1) | The 2 a.m. promise is either carried by a lock-screen, widget or Action Button doorway pulled forward from the NS-04 spike, or the PRD says plainly that 2 a.m. is a Home-first flow. | mobile | L | P1 | none |
| BL-1693 | NEU-027 (P1), CDO-B-009 (P1), CDO-B-010 (P2) | Home has a written budget (one slip, one prompt, Speak and Type, nothing else above the fold on an SE 3 at default size), the one-time Moments pointer has a real place in it, and the pinned block height is measured on an SE 3. | product | S | P1 | BL-1697 |
| BL-1694 | NEU-023 (P1), CDO-B-044 (P1), CDO-B-056 (P2) | Me is grouped by the parent's question, the Moments rows (Photos access, Hide places, Hidden days, Start again) land once in the same pass, and the page stays short at the largest text. Decide with PR #1566, not apart from it. | product | M | P1 | none (waits on the #1566 decision) |
| BL-1695 | CDO-B-045 (P1) | A grandparent can read the first year as one sitting: 'Read a year together', the year rows in the Months sheet and the end-of-year state exist. | mobile | L | P1 | none |

## 4. Customer-facing P1 that is dark behind the Moments flag

None of these shows to a parent today. Each must land before the flag flips; the first two are gates. Tabs are Home, Moments, Book, Me (D-165, ruled).

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1696 | NEU-014 (P1), CDO-B-001 (P1) | The tab label for Moments exists in content, and a test fails if any two tab labels match, before the flag moves. | content | S | P1 | none (gate to the flag) |
| BL-1697 | NEU-015 (P1), CDO-B-012 (P1), CDO-B-052 (P1), CDO-B-011 (P1) | One written rule for pictures: where a parent starts from one, sees one, adds one, and which verb family is used. It decides PR #1567 and Moments together, and says whether Home's month-ago card and Moments' cards can show one old letter in the same week (ask product whether NS-53-R5 covers it). | product | M | P1 | none |
| BL-1698 | NEU-018 (P1), NEU-019 (P2), NEU-028 (P2), NEU-034 (P2), NEU-006 (P2) | The five-parent check (PRD 28 O-01, due 24 Nov) runs before more Moments build, and carries four small questions: the moon glyph on Home, the 'Not much today' wording, the reminder time range, and where the money terms sit on the welcome. | product | S | P1 | none |
| BL-1699 | NEU-016 (P1), NEU-017 (P1), CDO-B-025 (P1), CDO-B-040 (P2) | Moments first week stays calm: a version with the real card first and the ask in its footer is tested; whether the Home pointer counts under the F02 one-a-day cap is written down; the inert 'Example' card is dropped or cleared by the CCO; a short list (fewer than four cards) has a state. | product | M | P1 | BL-1698, BL-1720 |
| BL-1700 | CDO-B-032 (P1), CDO-B-033 (P1), CDO-B-034 (P2) | The parent always sees which pictures came back from Apple's sheet (thumbnails) and a VoiceOver parent can confirm the selection and hear when six is near. The frame is one frame with two bodies. | product (O-62 still open) | M | P1 | BL-1697 |
| BL-1701 | CDO-B-041 (P1) | The enlarge view can do the one job it exists for: choose the better of two nearly identical pictures (a select toggle and previous and next buttons, or the enlarge is dropped). | product | M | P1 | BL-1700 |
| BL-1702 | CDO-B-036 (P1) | A swipe down on the photos primer returns to the unanswered state; only the 'Not now' button records a decline. This changes G-05 and R73, so it is a spec change for product. | product | S | P1 | none |
| BL-1703 | CDO-B-035 (P1) | A named owner and a date for the phone walk of Apple's picker at the largest text and VoiceOver (DM-07). The public accessibility claim waits for it (R293). | design-systems (qa runs it) | S | P1 | BL-1674 |
| BL-1704 | CDO-B-005 (P1) | A tapped Moments link or notification (G-09, O-22) opens the day it names, not Home. | mobile | M | P1 | none |
| BL-1705 | CDO-B-024 (P1) | Home to Moments to Book does not cut the warm light: a spike proves the unlit-room hook on a plain-paper tab, or a different rule is written (MOTION 5l forbids the snap). | design-systems (motion) | M | P1 | BL-1675 |

## 5. Internal re-syncs and design-system work

After the customer rows. Docs and tokens that stop two builders making two different things.

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1706 | DSR-009 (P1) | AgreementRow, ScreenHeader and SafeAreaView have written specs (label, target, VoiceOver reading) in COMPONENTS.md, so the consent row cannot drift. | design-systems | S | P1 | none |
| BL-1707 | DSR-011 (P1), DSR-010 (P2), NEU-029 (P1) | MOTION.md becomes the one index: every move, its token, its Reduce Motion form and its owner file; the Moments specs point to it. A 'journey motion board' shows first run, Review, Book, a sheet, Moments to Listen as one sequence, marking every cut and shared element. | design-systems (motion) | M | P1 | BL-1675 |
| BL-1708 | CDO-A-023 (P1) | The e2e INDEX has AX5 and dark states for capture (A-S01 to A-S03, A-S05, A-S06, A-S08) so the screen used at 2 a.m. is as stated as the rest. | design-systems | M | P1 | none |
| BL-1709 | CDO-B-016 (P1), CDO-B-020 (P1), CDO-B-019 (P2), CDO-B-037 (P2), CDO-B-026 (P2), CDO-B-017 (P2) | One docs PR re-syncs the Moments specs to develop: the cover text (the cover stays ON, ruled; only the wording about 'no cover with the lock off' changes), the 'whole card is one target' sentences, the stale C-4 clause, R71 pinned versus inline, the place-line stop count. The notification pull-down flash is checked once on a phone first. | design-systems with mobile | S | P1 | none |
| BL-1710 | NEU-013 (P1), CDO-B-008 (P2) | IA-FINAL becomes v2 with four tabs as decided (D-165), Moments' doorways, empty and first-week rows and the photo dependencies, so one file is the map. | design-systems | M | P1 | none |
| BL-1711 | CDO-B-021 (P1), CDO-B-022 (P2) | The three Moments token rulings (target.action 48, list row 56 from the first accessibility size, sheetTitle role) are made and added to tokens.ts with tests, with the reason the capture-size principle does not apply to a browse card. | design-systems | S | P1 | none |
| BL-1712 | DSR-006 (P2), DSR-007 (P2), DSR-008 (P2), DSR-026 (P2), DSR-027 (P2), CDO-B-003 (P2), CDO-B-048 (P2), CDO-B-051 (P2), CDO-A-016 (P2) | The missing tokens (gutter, hairline, progress bar, icon sizes, scrim, press opacity) exist and screens use them; the web date field and the export phase line use the type ramp; the Read together progress line is strong enough to see; one way to set a hairline. | design-systems (tokens), mobile (swap) | M | P2 | BL-1711 |
| BL-1713 | DSR-013 (P2), DSR-014 (P2), CDO-A-027 (P2) | A test fails if a component animates without the shared motion hook; Breathe has a stated Reduce Motion form and the two loops have a stop; the Plan screen states its Reduce Motion position. | design-systems (test, motion) | M | P2 | none |
| BL-1714 | DSR-003 (P2), DSR-004 (P2), DSR-005 (P2), CDO-A-015 (P2), CDO-A-012 (P2) | No duration, delay, curve or translate is typed in a component, including the Review mark card and wash and the reminder card's slide; the token test covers them and the reminder card follows the sheet motion rule. | design-systems (tokens, motion) | S | P2 | none |
| BL-1715 | DSR-018 (P2), DSR-017 (P2) | Save, card to page, page turn and the tray flight are measured on an SE-class phone and the numbers filed. The flight stays off until DM-11 and DM-12 pass (D-165, ruled); this ticket only supplies the numbers. | design-systems (motion), qa | M | P2 | BL-1675 |
| BL-1716 | DSR-001 (P2), DSR-025 (P2), NEU-020 (P2), CDO-B-002 (P2) | A ruling written and built for the tab bar at the largest sizes (labels fixed at 13 pt with the long-press label, or grow), the same for Bold Text on fixed-width labels, and Android gets an equivalent. | design-systems | M | P2 | BL-1674 |
| BL-1717 | CDO-A-007 (P2), CDO-B-007 (P2) | Delete-account step swaps get a transition and a Reduce Motion form, and the Moments sheet routes join the transition table when they are built. | design-systems (transitions) | S | P2 | BL-1675 |
| BL-1718 | CDO-B-029 (P2), CDO-B-030 (P2), CDO-B-031 (P2) | Day card: a dead-tap rule for the date heading, how plain and picture cards sort, and one plain line for a failed picture. | product | M | P2 | BL-1697 |
| BL-1719 | CDO-B-038 (P2), CDO-B-039 (P2), CDO-B-042 (P2), CDO-B-043 (P2) | Earlier list and Undo: the door row below the fold on an SE 3, reuse of the Months sheet or a reason not to, undo for more than the last set-aside, and how the Undo row, a toast and the reminder card stack. | product | M | P2 | none |
| BL-1720 | NEU-012 (P2) | When PR #1566 is decided, its asks become rows in the one F02 6.1 table and the ask logic, not a second schedule. | product | S | P2 | BL-1694 |
| BL-1721 | CDO-A-011 (P2) | Either the two-screen bedtime reminder setup is built, or SETUP_JOURNEY.md is marked deferred; today a parent gets 8:30 PM by default. | product | M | P2 | none |
| BL-1722 | DSR-028 (P2) | SOUND.md and the haptic rules are read and checked against silent mode and Reduce Motion. | design-systems | S | P2 | none |
| BL-1723 | DSR-022 (P2), CDO-B-053 (P2); DSR-023 (pass, recorded) | The rule that separates fitted titles and chrome from letter text (D-027) is written down once so the audit does not re-find it. | design-systems | S | P2 | none |
| BL-1724 | CDO-B-004 (P2) | A device spike row exists for the native tab bar, or a reason to stay on the current bar is written. | design-systems | M | P2 | none |
| BL-1725 | NEU-035 (P2), CDO-A-009 (P2), CDO-A-022 (P2) | A docs/design README names the one current file per topic and marks the rest superseded; the first-run story intro spec says deferred (D-043); the screens with no per-screen spec get one over time. | design-systems | L | P2 | none |

## 6. Smaller customer-facing fixes (P2)

| Id | Source ids (final severity) | Outcome in plain words | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1726 | CDO-A-002 (P2), CDO-A-004 (P2), CDO-A-005 (P2) | One list of what stays free in the app (the Home line matches the settled wording), the 'second free letter' toast decided by the CPO and content, and the retired 'off' line deleted. | content (CPO and CBO check, CR-73) | S | P2 | none |
| BL-1727 | CDO-A-008 (P2), CDO-A-014 (P2), CDO-A-017 (P2), CDO-A-021 (P2) | The typed delete word has a Hindi-keyboard answer, 'Let it go' has a line for a long take, the post-share line says the copy can be made again, and the sign-in sheet heading is checked against the BRAND.md log-in ban. | content | S | P2 | none |
| BL-1728 | CDO-B-006 (P2), CDO-B-054 (P2), CDO-B-058 (P2), CDO-B-047 (P2) | One name for the settings page (Me or Settings, GAP-07), the Help row hint says it opens email, and the holding-bin words on Read together, Book and Listen are approved or replaced. | content | S | P2 | none |
| BL-1729 | CDO-A-006 (P2), CDO-A-013 (P2), CDO-A-010 (P2) | The signed-in Erase fallback has a link to Delete account, the reminder 'backed off' state is found or built, and a legacy install sees one age question (device check). | mobile | S | P2 | BL-1674 |
| BL-1730 | CDO-B-014 (P2), CDO-B-050 (P2), CDO-B-055 (P2), NEU-021 (P2), NEU-007 (P2) | A Home read that fails shows something, the Book title never sits under its buttons on first paint, settings page titles live in one place, the Book gear is removed as designed, and the sign-in-first rule is one state table per build. | mobile | S | P2 | none |
| BL-1731 | CDO-B-046 (P2) | Read together follows the reading size chosen in the letter page, with a control to change it mid-read. | product | S | P2 | none |
| BL-1732 | CDO-B-057 (P2) | The two destructive rows (Erase on this phone, Delete account) are visibly separated or explained together. | product | S | P2 | BL-1694 |
| BL-1733 | CDO-B-023 (P2) | Moments is not counted as a covered screen until empty, error, loading, offline and denied states are built (ACC-0 to ACC-5). | mobile | L | P2 | BL-1697, BL-1711 |
## 7. Known missing coverage (explicit gap rows)

Nobody has reviewed these. They are not findings and have no severity. Each is a request for a review, owned by `product` with `design-systems` reading, that ends in tickets.

| Id | Gap | What is not covered | Lane | Size | Severity | Depends on |
|---|---|---|---|---|---|---|
| BL-1734 | capture record control (not yet reviewed) | Listen: the record, pause and stop controls at the largest text, one-handed, with VoiceOver and Voice Control. NEU and CDO-A read structure and comments only. | product (a review, then tickets) | M | unrated | none |
| BL-1735 | largest text on capture and review (not yet reviewed) | Listen, Review, Write at AX5 on an SE 3: CDO-A-023 covers the paper index only; no device pass exists (DSR-024). | product (a review, then tickets) | M | unrated | none |
| BL-1736 | interruptions (not yet reviewed) | A call, Siri, a lock, low storage, a route change or a kill during a take and during Keep. Neutral review notes a take is kept; nobody reviewed what the parent sees and hears. | product (a review, then tickets) | M | unrated | none |
| BL-1737 | night use (not yet reviewed) | Dark theme, brightness, sound and haptics at 2 a.m., and the screen-awake rule. NEU-009 touches only the doorway. | product (a review, then tickets) | M | unrated | none |
| BL-1738 | hands-free capture and share (not yet reviewed) | The hands-free capture states spec (05-HANDS-FREE-CAPTURE-STATES-11nov.md) was not read by any reviewer, and Share one letter was not reviewed. | product (a review, then tickets) | M | unrated | none |
| BL-1739 | invite and read together (not yet reviewed) | The invite flow, joining, co-reading and a second voice: not read by any reviewer. CDO-B reviewed solo Read together only. | product (a review, then tickets) | M | unrated | none |
| BL-1740 | export, delete and new phone (not yet reviewed) | Export and Delete account were read as code in CDO-A; new phone (S17 specs), Recently deleted, Backup and the age gate were not reviewed. | product (a review, then tickets) | M | unrated | none |
| BL-1741 | notification and email copy (not yet reviewed) | The notification and email copy inventory, the website and the store page (listed in DESIGN-GAPS-21nov.md): not reviewed. | product (a review, then tickets) | M | unrated | none |
| BL-1742 | other uncovered surfaces (not yet reviewed) | Firsts and Sealed, Add a book, every Settings sub-page body, Android, Switch Control: not reviewed by any of the four. | product (a review, then tickets) | M | unrated | none |
## 8. Already ruled: marked, not re-opened

| Source ids | Ruling | What stays closed | What still needs doing |
|---|---|---|---|
| NEU-004 | D-087: the birth date is required with no default and the app reads the age back | Whether the date is required | PRD 28 section 11 (line 656) says "optional date of birth"; product edits that row to match. One line, rides with the IA ticket |
| NEU-002, NEU-001 (download part) | D-087: the speech model downloads only after an explicit "Download on Wi-Fi" or "Not now", with the size shown | That the choice is explicit | Where it is asked (after the first take) stays open, in the finish ticket |
| NEU-013, CDO-B-008 | D-165: tabs are Home, Moments, Book, Me | Whether Moments is a fourth tab | The IA-FINAL document update only |
| CDO-B-016, CDO-B-017 | DC-5 and D-165 item 6 (and O-44): the app-switcher cover is ON, and develop's wider cover meets it | That the cover stays ON | Stale spec wording, in the Moments re-sync ticket. The pull-down flash is checked, not argued |
| CDO-B-027, CDO-B-028 | D-165 item 5 (O-59): "Not now" stays on the card face; the other verbs stay in the menu, each with Undo | The card face and the menu split | Nothing is ticketed. Both are proposals; re-opening needs an exec review and a new dated entry first. The review's extra test (time to permanent hide) can ride with the five-parent check if the exec review asks for it |
| CDO-B-018 | DC-2 and README C-3: the picker ships Layout C until DM-02 and DM-11 pass, then moves to B | The picker default | A founder-visibility note only |
| DSR-017 | D-165: the tray flight stays off until DM-11 and DM-12 pass | That it is off | Only the frame numbers, in the motion budget ticket |
| CDO-A-009 | D-043 and CPO-61: the story intro is deferred to v1.1 | That it is deferred | The 10 Nov spec status line says deferred (in the docs index ticket) |
| CDO-A-002 | X-7 is CLOSED (20 Nov, CL-110): the K2 wording is settled | The wording | One built string, in the Plus copy ticket |
| NEU-019 | The founder ruled to keep the moon glyph on Home | The glyph | The reading is a test question only; if it fails, change the glyph, not the word |
| D-166 | O-47 option C and O-48 value-prop pair approved; O-48 text stays unpublished until counsel answers | Both | No finding in the four reviews touches them |

## 9. The DSR-024 P0 trigger

DSR-024 is P1 because it is a gap in proof, not a known defect. It becomes P0 if no device accessibility pass exists before a store build.

- Owner lane: `design-systems` owns the audit and signs the result; `qa` runs it on a real iPhone SE 3 (the reference device). Karma holds the gate, because the store build is his call (CR-73).
- Gate date (proposed, Karma to confirm): end of Fri 27 Nov 2026. The release record targets the first store submission for Tue 1 Dec 2026 (D-121, `docs/FOUNDER_TASKS.md:444`); that date may have moved since the alpha go/no-go, and I did not re-check it. The pass has to exist before the release candidate is cut, so the check is two working days ahead of 1 Dec.
- What counts as a pass: a filed record that AX5 and VoiceOver were run on an SE 3 for the five NS-33 screens (Home, Review, Book, letter page, Listen) plus the sign-in and consent sheets, with each failure logged as its own ticket. The 30 settings routes may trail the gate, as P1, if the first set is done.
- If the record does not exist on the gate date, DSR-024 is raised to P0, and the candidate build waits for it. The ticket is the first row of section 1.
- I did not read the device test plan section 5 or any QA run that may already cover part of this. Read it first; it may shorten the work or move the date.

## 10. Checked, no ticket

- DSR-002, DSR-012 (and DS-4): withdrawn in review A. The iOS blur surface goes solid under Reduce Transparency; the reduced spring path is a timing fade.
- DSR-023, CDO-B-053: recorded passes (letter text is never line-clamped; the chrome caps are allowed under D-027).
- CDO-A-019: the code-entry AX5 budget is in the file; only the device check remains (in the first ticket).
- CDO-A-020 (Google logo fills are Google's brand), CDO-A-024, CDO-A-025, CDO-A-028: checked, no gap.
- CDO-A-010: withdrawn as a defect; one device check stays (in a small mobile ticket).

## 11. Counts

- 150 source ids across the four files: 28 DSR, 35 NEU, 28 CDO-A, 59 CDO-B. Final severities in the files: P0 x1 (NEU-001). Where a ticket groups ids, each id keeps its own severity in the Source column.
- 60 tickets (BL-1674 to BL-1733), 9 gap rows (BL-1734 to BL-1742), 11 ruled rows, no ticket for withdrawn or pass-only ids.
- Not verified: nothing here was seen on a device; the sizes are my estimates from the reviewers' sizes; the proposed ids are not yet reserved.
