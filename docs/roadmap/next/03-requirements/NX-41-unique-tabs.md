# NX-41: Unique tabs: Tonight, Book and the third place each do one job a parent can name

Status: v1, 10 Nov 2026 (UTC). Docs only. Author: `product`, for the unique-tabs programme (brief: Karma). Build 13 scope, not Build 12. Nothing here is reserved in `DECISIONS.md`. NX-41 is the next free NX id (NX-40 is the highest on `develop` and on open PRs; NX-37 is unused). Backlog rows BL-898 to BL-905 are in `docs/BACKLOG.md` (ids from `scripts/agents/next-id.mjs` on 10 Nov; run `id-collisions.mjs` before merge, other teams may take the same numbers).

Tag: EVIDENCE = a repo file, a PR file list or PR body read this session (named). HYPOTHESIS = anything about what a parent feels, wants or does, and every target number. UNVERIFIED = not read. Every promise or privacy line is COUNSEL-READ, not cleared.

| | |
|---|---|
| Founder direction (10 Nov, quoted in the brief) | "Assign team to work on how each tab on nav is unique and serves value. Right now tonight and book feel same and third is empty coming soon. Coming soon can be less prominent and focus on re think of that." |
| Builds on, does not re-specify | NX-30 (navigation and landing, branch `docs/nx-30-nav-landing-8nov`, not on `develop`), NX-36 (screens), NX-39 (Memory Library), NX-40 (first run), D-126, `docs/design/IA.md`, `docs/design/DESIGN_LANGUAGE.md` section 12 |
| Sibling doc | `docs/design/specs/NAV-TAB-ROLES-10nov.md` (design lead, branch `docs/nav-tab-roles-10nov`). **Not on origin when I wrote this** (`git ls-remote` on 10 Nov found `docs/nav-eval-9nov`, `docs/nx-30-nav-landing-8nov`, `docs/you-tab-states-9nov`, no `nav-tab-roles`). Section 11 lists what to reconcile when it lands; BL-898 does that |
| Size | M in total across the rows; the first useful slice (the third place, BL-901) is S |

## 1. Problem

Three observations, all from code read on `develop` at 6800a54f4 (EVIDENCE) and the founder's sentence (HYPOTHESIS about what he saw on the TestFlight build).

1. **Tonight and Book feel the same.** Both are scroll screens of the same kind of object. Tonight shows one serif line, then one card per waiting draft (or "A month ago"), then Speak and Type (`apps/mobile/src/app/(tabs)/index.tsx` header comment). Book shows a cover band, then month headings, then letter cards (`(tabs)/book.tsx` header comment). Both use the same `Lamp` and the same card family: Tonight's lamp scene is `tonight`, Book's is the still `book` scene, and both say they share "the tabs' light" (persistKey `tabs`). A waiting-draft card on Tonight and a kept-letter card on Book are close cousins. A parent who flips between them sees the same room twice.
2. **The third place is empty.** The Family tab in the TestFlight and `preview` builds is a lamp, one drawing, a heading and one line, with no action (`components/family/coparent-soon.tsx`). It is the whole of a tab. On `develop` the tab bar is Tonight, Book, Family (`(tabs)/_layout.tsx`). The open stack changes this: #699 adds a You tab, #665 and #720 hide Family in a store build (`CO_PARENT_IN_STORE_BUILD = false`), so the Build 12 store tree is **Tonight, Book, You** (#720 test `[NX-36-S0]`). The founder's complaint is true of the TestFlight tree he tested; the store tree already removes the empty tab but leaves the question "what is the third place for" answered only by Settings.
3. **Coming soon is the loudest thing on a quiet tab.** A full tab for a feature nobody can use yet says "not yet" with the whole screen. The founder asks for it to be less prominent.

IA.md describes the tabs' jobs in one line each ("Start today's letter", "Read and hear what is kept", "Who writes to {child}"), but nothing in the screens enforces them, and the two real tabs overlap in what they show.

## 2. Goals and non-goals

Goals
1. Each tab has one job, written as a sentence a parent could say back, and the first screen of each tab is built around that job (section 4).
2. Switching tabs changes the kind of room, not just the content: what the parent is asked to do differs (say, read, look after).
3. No tab is a screen whose only content is a promise. Coming soon becomes a small, quiet, honest line in a place that has a real job (section 6, R8 to R11).
4. The brand rules hold with no exception: nothing counts, nothing nags, no streak, point, badge, gap count, or "only N left" (CLAUDE.md content rules).

Non-goals
- No new feature that does not exist in code or in a requirement already written (Photos is NX-33 and NX-39; search, share, print are not chosen, NX-30 "Q2").
- No redesign of Book's cover band, the Months sheet or Settings rows (merged in #674, #614).
- No change to what Tonight records or how it captures (Speak, Type, Not much today are unchanged).
- Not specified here: visual design, motion, words. They belong to `design-systems`, `design-systems-motion` and `content`. This file sets the job and the checks.
- No fourth tab in Build 13 unless the founder rules on Photos (section 10, FD-2).
- No analytics event added by this file (section 8).

## 3. What exists (EVIDENCE, read 10 Nov)

| Place | Today on `develop` | After the open stack | Source |
|---|---|---|---|
| Tonight | Greeting, prompt, Speak and Type, waiting drafts, "A month ago" only when no draft waits and a letter is 28 to 35 days old | #738 and #740 edit `(tabs)/index.tsx` (list below) | `(tabs)/index.tsx` header |
| Book | Cover band with age and "Read together", months newest first, letter cards, gear to Settings, empty state "The first page is waiting." with "Write a letter" | #764 edits `(tabs)/book.tsx` and `letter-card.tsx` | `(tabs)/book.tsx` header; IA.md |
| Family | "Coming soon" screen with servers off; real co-parent screens with servers on (`preview`) | Hidden from the store build by `CO_PARENT_IN_STORE_BUILD = false` (#720); kept in alpha | `(tabs)/family.tsx`, `entry.logic.ts` |
| You | Not on `develop` | Settings home as a tab; three states: signed in, signed out, local start (#738, `YOU-TAB-STATES-9nov`, PR #732); Account sections (#740) | #699, #738, #740 PR bodies |
| Settings | Gear on the Book cover band only | A tab (You) in every build with the stack | IA.md; #699 |

The open stack in order: #699 (You tab) before #720 (three tabs when servers on) before #738 (You tab states) before #740 (account sections) before #764 (S17 new phone), where #738 is stacked on #737, #728, #724, #722, #701 and carries #699's commit by cherry-pick, and #764 is stacked on #738. #720's body says it is stacked on #699 and #665. These are drafts; the heads move. I did not read their code beyond file lists, PR bodies and the layout on the `feat/mobile-account-sections` branch.

D-126 is the standing rule that the store build shows no "coming soon" surface; the 10 Nov decision relayed in #767 amends it for Build 12 to one coming-soon state (BL-882 in #767). R8 to R11 below are consistent with that and ask for the quieter version in Build 13.

## 4. One job per tab (the core of this file)

The jobs are proposals. Karma and the founder rule (section 10). The test of a job: a parent can say "I go to X to ..." in a sentence with a verb, and the sentence is not true of any other tab.

| Tab | Job, in a parent's words (HYPOTHESIS) | Verb | The room | What it must not do |
|---|---|---|---|---|
| Tonight | "I go to Tonight to say something to {child} now." | Say | Evening, forward-looking, unfinished. Shows today's prompt, Speak and Type, and anything not yet kept. Nothing finished lives here except at most one resurfaced past letter | Show the book's finished letters as a list; show a count or a to-do |
| Book | "I go to the Book to read and hear what we have kept." | Read, hear | Paper, finished, backward-looking. Every kept letter, in months, with the recording beside it | Hold waiting drafts or the prompt as the main thing; start a capture as its main action |
| You | "I go to You to look after the book and my account." | Look after | Quiet, administrative: who writes, sign in, plan, lock, export, delete, help | Hold anything the parent made |
| Family (alpha builds with servers on only) | "I go to Family to see who writes to {child} with me." | Share | The real co-parent screens, as they exist | Appear in a build where it is only a promise |

NX-30 proposes a fourth tab, Photos, and NX-39 specifies the Memory Library behind it. Neither is in Build 12 or committed to Build 13. If the founder rules that Photos ships in Build 13, its job is "I go to Photos to find the moments I lived and add them to a letter" and this file's tree becomes Tonight, Book, Photos, You (FD-2). If not, the Build 13 tree is Tonight, Book, You in a store build.

## 5. Requirements (Given, When, Then)

Ids are `NX-41-R#`.

| Id | Requirement |
|---|---|
| R1 | One job each. Given the tab bar in any build, When a parent reads the three or four labels and opens each, Then each tab's first screen supports exactly the job in section 4, and no first screen of a tab is mainly the job of another tab |
| R2 | Tonight is about now. Given a book with many kept letters, When the parent opens Tonight, Then no list of kept letters appears (at most one resurfaced card, as today), and the first thing in the thumb zone is Speak and Type |
| R3 | Book is about what is kept. Given a book with letters, When the parent opens Book, Then the first thing seen is the cover and the newest chapter of kept letters; a waiting draft is not shown as a card in the list (a single quiet pointer to Tonight is allowed, no count) |
| R4 | The two feel different. Given the same book, When the parent switches Tonight to Book and back, Then at least three of these differ visibly, judged on device by a person who has not seen the specs: background and light, type scale of the main line, card shape, the main action, motion on entry. The design lead's spec chooses which three; this is the test, not the design |
| R5 | Switching is calm. Given a tab switch, Then no content moves on warm switches and the lamp settles instead of cutting (existing EXPERIENCE_PASS 5.8 rule 2 stays); nothing here adds a transition |
| R6 | Same facts, one place. Given a fact (a draft, a kept letter, a setting), Then there is one tab where it is the main object; other tabs may point to it with a word, never a count |
| R7 | Labels. Given `copy.tabs` in `packages/content`, Then the labels stay single words from the BRAND.md glossary (HIG tab bars: single-word labels, `_layout.tsx` header); any new label is `content`'s, and passes `packages/content/test/rules.test.ts` and `tab-labels.test.ts` |
| R8 | No tab is only a promise. Given a build where co-parent is not live (store builds; TestFlight if the founder agrees, FD-3), Then there is no tab whose body is the coming-soon presentation. The Family tab is not in the bar |
| R9 | Coming soon, quiet. Given co-parent sharing is not live, Then it appears in one place only, on You, as one quiet row ("Write this book together", value "Coming soon"; the strings exist as `familyCopy.soon.settingsRow` and `status`), with no badge, no colour accent, no count, no date, no notify button (SET-08 stays), and it opens the existing sheet from `coparent-soon.tsx` with its Close |
| R10 | Quiet means measurable. Given the You tab on a phone, Then the coming-soon row is not above the fold on the first screen of You in State A (signed in), is not larger than any neighbouring row, and uses the muted text token. Judged on a device |
| R11 | Never a dead end. Given a parent who opens the coming-soon row, Then they can close it in one tap and nothing is recorded about them; the existing content-free `coparent_soon_opened` (surface enum `tab`/`sheet`) is the only count and only fires for a parent who opted in |
| R12 | Alpha stays whole. Given a `preview` build with servers on (`alpha` true), Then the Family tab with the real co-parent screens stays; this file removes only the promise-only presentation |
| R13 | Signed out and servers off. See U3 and U4; Tonight and Book work with no account and no network (NX-31-R26). Their roles do not depend on sign-in |
| R14 | Accessibility. Given VoiceOver, large text (AX5) or Reduce Motion, Then each tab's job is clear from its first heading and the order of reading; the tab bar items keep the Large Content Viewer and the 13 pt label floor (`_layout.tsx`) |
| R15 | Content rules. Every new string passes the content rules test: no em or en dash, curly quote, ellipsis character or emoji; no fear, guilt or loss; no gendering; `{child}` never the name; no implication that anything is written by AI; nothing counts or celebrates a streak (CLAUDE.md) |
| R16 | Analytics. No new event, no new prop. See section 8 |

## 6. Stories, happy paths

Format: As a ..., I want ..., so that .... Acceptance is Given/When/Then.

**H1 First day, empty book (P1 new parent, first night).** As a parent who just finished first run, I want to know what each place is for, so that I do not have to learn the app.
- Given a book with no letters, When I open Tonight, Then I see the prompt and Speak and Type, and nothing else asks for my attention (R2). No "0 letters", no list.
- Given the same book, When I open Book, Then I see the cover, "The first page is waiting." and "Write a letter" (existing empty state; the button goes to Tonight). The Book never shows an empty month or a gap (BRAND: celebrate what exists).
- Given the same book, When I open You, Then I see my account and settings; the coming-soon row is below the account rows (R10).

**H2 Many letters (P1 after months).** As a parent with 80 letters, I want Tonight to stay about tonight, so that it is quick, and Book to be where I linger.
- Given 80 kept letters and one waiting draft, When I open Tonight, Then the draft is shown, plus at most one resurfaced past letter, and no letter list (R2).
- When I open Book, Then months are newest first, the first six cards enter once per session (existing motion), and the waiting draft is not a card in this list (R3).
- When I tap a letter card, Then it opens the letter page as it does today. This file changes none of that.

**H3 Say it now (Tonight).** As a tired parent at 11 pm, I want Speak under my thumb, so that I say it before I forget.
- Given Tonight, Then Speak and Type are pinned in the thumb zone (existing Airbnb sticky CTA pattern) and are the first interactive items; at accessibility sizes they ride under the prompt (existing `footerPlacement`).

**H4 Read it back (Book).** As a parent, I want to sit with what we kept, so that I can hear it.
- Given Book, Then "Read together" and the letters are the main actions; there is no Speak button competing with them (R3). A way to start a letter from Book is an open question (Q3).

**H5 Look after it (You).** As a parent, I want one calm place for the account, lock, export and help.
- Given You in State A, B or C (YOU-TAB-STATES, #738), Then the first screen is the account card or the Sign in card, then groups, then the quiet coming-soon row (R9, R10). The states are #738's; this file adds the row's place only.

**H6 Co-parent, alpha (P2).** As a tester on a `preview` build with servers on, I want the real Family tab, so that I can test it (R12).

## 7. Unhappy paths and edge cases

| Id | Case | Required behaviour | Source |
|---|---|---|---|
| U1 | Servers off (store build before the stack, TestFlight build 1) | Tonight, Book work on the phone. No Family tab (R8) if the founder agrees (FD-3); otherwise the Family tab stays with the quieter treatment in Q2 | D-126; #720 |
| U2 | Servers on, store build | Tonight, Book, You. Family hidden by `CO_PARENT_IN_STORE_BUILD = false` (#720); the coming-soon row is on You | #720 |
| U3 | Signed out, no book yet | First run owns the screen (NX-40/NX-31); no tab bar before an account (NX-40-R1, H1). Not this file | NX-40 |
| U4 | Signed out with a book (local start, or session ended) | Tonight and Book keep working (NX-31-R26). You shows State B or C: a Sign in card first, then the groups; the coming-soon row still sits below. The roles do not change | #738; NX-31-R26 |
| U5 | Offline | Tonight, Book, You work. Rows that need the network say so in their own words; no tab shows an error as its first line | NX-31-R18 |
| U6 | Two books | Book shows the "For {child}" switcher (existing, ChildSwitcher). Tonight uses the active book. Neither tab lists both | `book.tsx` |
| U7 | A waiting draft and Book open | R3: one quiet pointer at most, no count, no "1 draft" | R3 |
| U8 | Coming-soon row opened, then Close | Back on You where the parent was; no toast; nothing stored beyond the existing day marker | `coparent-soon.tsx` |
| U9 | Reduce Motion, VoiceOver, AX5 | R14; the coming-soon sheet's drawing is shown complete and does not breathe (existing) | `coparent-soon.tsx` |
| U10 | Remote config `flags.familyTeaser = 'quiet'` | The sheet keeps the heading and swaps the line (existing). Cannot turn sharing on | `coparent-soon.tsx` |
| U11 | A parent on TestFlight who knew the Family tab | The tab is gone with Build 13. No notice. Nothing was recorded | FD-3 |
| U12 | Fallback: Build 12 ships on-device only (NX-40 section 10) | This file is unaffected; it is Build 13 | NX-40 |

## 8. Metrics that respect the constitution

Honest frame: analytics is opt-in and off in every 1.0 profile (D-124 item 3), so a new parent is not measured by telemetry. Tab quality is judged by people and devices, not by a dashboard.

| Measure | How | Allowed |
|---|---|---|
| A parent can say each tab's job in their own words | Five-parent read-through, `user-research` (BL-900); "What do you go to this tab for?" with the three first screens, names hidden | Yes. HYPOTHESIS target: at least four of five give a verb that matches section 4 for each tab |
| Tonight and Book feel different | On-device check by a person not on the team against R4 | Yes |
| Coming soon is quiet | R10 on a device; the existing `coparent_soon_opened` count for opted-in parents | Yes, existing event only |
| Time to start a letter from a cold open | Scripted run (Maestro) on an iPhone SE 3; no telemetry | Yes (NX-31-R15 style; HYPOTHESIS) |
| Anything about how many letters a parent wrote, days since the last one, or a goal of more tab switches | Not measured, not shown, not a goal | Never |
| Any entry text, transcript, audio, child name, email, device id | Not in any event, log or crash report | Never (CLAUDE.md) |

Existing events that touch these tabs: `book_opened` ("Book tab shown for a child") and `capture_started` are in `packages/analytics/src/catalog.ts`; I read their names and the `coparent_soon_*` entries, not their full definitions (UNVERIFIED). I propose no new event: a tab-view event would measure curiosity, not value, and would invite a goal the brand forbids.

## 9. Door lines (COORDINATION section 10; PRIV-R21; COUNSEL-READ, not cleared)

The tab changes ask nothing new of a parent. The one row that mentions a future feature:
- **Coming-soon row on You.** Shown: "Write this book together" and "Coming soon" (existing strings, `familyCopy.soon`). Records: nothing; if the parent opted in to analytics, one content-free count (surface = sheet) and the existing stored day marker. Never: a notify promise, a date, a "beta" word, a number. Decline: Close in one tap.

## 10. Founder decisions (few, each with a recommendation and a default)

| Id | Decision | Recommendation | Default if no answer |
|---|---|---|---|
| FD-1 | The jobs in section 4: Say / Read / Look after | Accept as written; the design lead refines the rooms | Accept |
| FD-2 | Does Photos (NX-30, NX-39) take the fourth slot in Build 13? | No. Build 13 is Tonight, Book, You; Photos waits for NX-39's gates (counsel, device spikes, parent study) and a ruling | No; revisit when NX-39 gates close |
| FD-3 | Does the Family tab leave the bar in TestFlight and `testflight` profile too, or stay as a quieter tab there? | Leave the bar in every build that has co-parent off; the coming-soon row on You replaces it. Keep the tab only where servers are on in `preview` | Leave the bar |
| FD-4 | Amend D-126: it says no coming-soon surface; Build 12 allowed one state; Build 13 asks for one quiet row. Draft entry proposed below | Yes, as Proposed text | D-126 stands as amended for Build 12 only |

Proposed decision text (for the founder; not added to `DECISIONS.md`): "D-### (Proposed): From Build 13 the tab bar is Tonight, Book, You in every build where co-parent is off; the coming-soon presentation is a single quiet row on You, never a tab. Supersedes the Build 12 tab-level coming-soon state under D-126's amendment. Alpha builds with servers on keep the Family tab."

## 11. Dependencies and collisions with the open stack, and the sibling doc

| Item | Touches | Collision with this work | Rule |
|---|---|---|---|
| #699 You tab (draft) | `(tabs)/_layout.tsx`, `you.tsx`, `strings.en.ts` (`tabs`), `tab-labels.test.ts`, `IA.md` | BL-901 edits the same layout and the same tab test | Start after #699 and #720 merge; do not rebase them |
| #720 three tabs when servers on (draft; labels itself BL-776, which collides with an existing BL-776 per #767) | `(tabs)/_layout.tsx`, `family.tsx`, `coparent-soon.tsx`, `entry.logic.ts`, `tab-bar.test.ts`, `store-family-tab.test.ts`, `IA.md`, `DEVICE_TEST_PLAN.md` | This file depends on its `CO_PARENT_IN_STORE_BUILD` constant. R8, R9 reuse it | BL-901 reads the constant; it does not redefine it |
| #738 You tab states (draft) | `(tabs)/index.tsx`, `you.tsx`, `_layout.tsx`, `settings-home.logic.ts`, `signed-out-card.tsx`, `tab-bar.test.ts`, `IA.md`, many first-run files | It edits Tonight (`index.tsx`). BL-902 (Tonight) must wait for #738 and #740 to merge | Order: after #740 |
| #740 Account sections (draft, stacked on #738) | same file set as #738 plus `account-sections.test.ts` | Same | Same |
| #764 S17 tier 0 (draft, stacked on #738) | `(tabs)/book.tsx`, `letter-card.tsx`, `letter-card.logic.ts`, `gate.logic.ts`, `onboarding.tsx`, many others | It edits Book. BL-903 (Book) must wait for #764 | Order: after #764 |
| #767 co-parent groom (BL-882) | one coming-soon state for every co-parent surface | R9 refines BL-882's state; the row and the sheet must be one definition | BL-901 cites BL-882 and does not duplicate it |
| NX-30 four-button bar (branch `docs/nx-30-nav-landing-8nov`) | Proposes Tonight, Book, Photos, You; says option C needs #665 | Photos slot: FD-2 | If FD-2 says yes, NX-30's text wins on the fourth slot and this file's tree adds one tab |
| NX-39 Memory Library | Tonight card (date only), composer shelf | Adds a Tonight card from the library. R2 allows one resurfaced card; a library card must share that single slot or R2 needs a rewrite | Note for NX-39's order; not decided here |
| NX-40 first run | `gate.logic.ts`, `use-first-run-route.ts`, `onboarding.tsx`, `book.tsx` (via #764) | No overlap in files for BL-898, 899, 900, 904; BL-903 waits for #764 | As above |
| `NAV-TAB-ROLES-10nov.md` (design lead, `docs/nav-tab-roles-10nov`) | The rooms and R4's three differences | **Not on origin** when I wrote this, so nothing was read | BL-898: when it lands, record every difference in a "Reconciliation" section here (job sentences, the third place, Photos, the quiet row's place); where it and this file disagree on the job of a tab, the founder rules, not either author |

## 12. Conflicts and open points

- **Design lead's doc not read** (above).
- **D-126 versus the founder's ask.** D-126: no coming-soon surface in the store build. Founder 10 Nov: keep coming soon, make it less prominent. #767 relays a Build 12 amendment. FD-4 resolves it for Build 13.
- **Where coming soon goes.** I choose You (a row), since You already holds `settingsRow`/`status` strings for the child-settings "Write this book together" row (`familyCopy.soon`, `child-settings.logic.ts` in #720). The alternative is Book's "Read together" area; I rejected it because Book is about what is kept. Open question Q1.
- **IA.md says the Family tab is "Build 2: Who writes to {child}"**; #699, #720, #738 and #740 each edit IA.md. BL-905 must regenerate the Tabs table once after them.
- **Tab count by build** is a fact the QA plan must pin (store: 3; preview with servers: 4; `testflight` per FD-3).

## 13. Open questions, with a recommendation each

| Id | Question | Recommendation |
|---|---|---|
| Q1 | Is "a row on You" quiet enough, or does the founder want coming soon visible somewhere a parent sees more often? | Row on You, plus the existing child-settings row; nothing on Tonight or Book. Re-test with five parents (BL-900) |
| Q2 | If FD-3 says TestFlight keeps the tab: what does the tab show? | The real, short You-like list "Who writes to {child}" with you alone and one quiet "Co-parent: coming soon" line, not a full-screen drawing |
| Q3 | Should Book have any way to start a letter? | Only the existing empty-state "Write a letter" (goes to Tonight). Nothing on a book with letters |
| Q4 | Should Tonight's "A month ago" card stay on Tonight, or move to Book as "This month last year" style? | Stay (it is a prompt to say something now); the design lead may disagree. Count it as Tonight's one resurfaced card |

## 14. UNVERIFIED list

- Contents of `docs/design/specs/NAV-TAB-ROLES-10nov.md` and of any branch other than those named; the NX-30 branch was read in part (about the first 90 lines).
- What the founder saw on the TestFlight build; "third is empty coming soon" is read as the Family tab, which is my inference.
- Code of #699, #720, #738, #740, #764 beyond file lists, PR bodies and the layout on the account-sections branch; whether their heads and order moved after 10 Nov.
- Full definitions of the `book_opened` and `capture_started` events.
- Tonight and Book on a device; R4 and R10 are judged only on one.
- Any parent research: all job sentences are HYPOTHESIS.
- Whether `tab-labels.test.ts` pins a count of tabs (it appears in #699, #720, #738, #740 file lists; not read).

## 15. Trace

R1 to R7: founder direction; DESIGN_LANGUAGE 12; IA.md; NX-30. R8 to R12: founder ("coming soon can be less prominent"), D-126, #720, #767, `coparent-soon.tsx`. R13: NX-31-R26. R14: NX-35. R15, R16: CLAUDE.md, D-124 item 3. Backlog: BL-898 (reconcile with the design doc and propose the D-### text), BL-899 (words), BL-900 (user-research read-through), BL-901 (third place: Family leaves the bar, one quiet row), BL-902 (Tonight), BL-903 (Book), BL-904 (QA rows), BL-905 (IA.md and device plan once the stack merges). Order in `docs/BACKLOG.md`.
