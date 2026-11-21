# P6a critics' pass: Keep needs Plus, Settings home, a child's book, Add a child (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P6a of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P6 Settings, Plus and errors", spec ids S22 (Keep needs Plus, over Review), S40 (Settings home), S46 (a child's book settings) and S47 (Add a child), journeys J03, J06 and J07 (the Keep gate), J12 and J16, and the rules P6a leans on (P1's trust-copy floor, 5.8 row 5c and row 9, D-082 and D-083). Read against `develop` at **817879d**, where P6a (#312, 5f9db07) and P6b (#313) are merged, and re-checked against **a6519a4** (develop moved by #358, the Delete account page, and #362, a test fix; nothing P6a owns changed). Every file:line below is at 817879d unless it says a6519a4. This pass critiques; it changes no app code, tests or copy. P6c (errors, #355) and P6d (hidden books, #361) are not merged and are left out. P6b has its own document, `P6B_CRITICS_PASS_2026-10-28.md`.

## 0. Verdict for B2-10 (P6a's share)

**Signed once M1 is fixed: the Delete account row on Settings home shows only when the person is signed in.** The Should items are not blockers on their own, provided they are fixed or ruled by the coordinator, and the device checks in section 7 (above all the StoreKit purchase from the Keep sheet, D1) go on the build 2 run sheet.

P6a is close. The Keep sheet does what the constitution asks of it: the letter is held, never lost and never rewritten; the sheet shows the person's own first words from this phone and sends nothing; there is no price, trial, count or countdown on it in any state I could reach (free phone, lapsed, offline, no StoreKit, iOS 16); "Keep it here for now" runs once and Tonight then says "Waiting to be kept." Settings home is calmer: the early-version note sits only under About with its registered words unchanged, the privacy line is said once, "If you are struggling" and Licenses are pages and not accordions, and the three crisis lines and the 911 line are unchanged. Add a child starts with no date, says why its button waits, and is free. The due-date card never presumes a birth.

M1 is small and on the page parents open most: a parent who is not signed in sees a red "Delete account" row on every visit, for an account they do not have.

| Rank | Count |
|---|---|
| Must before build 2 | 1 |
| Should before build 2 | 2 |
| Later | 8 |
| Accept as built | 14 |

The three to fix first: **M1** (Delete account for signed-out parents), **S1** (the Keep sheet's buttons are a screen and a half down at large text), **S2** (Add a child's heading breaks to one word a line beside the cover at large text).

## 1. How this was looked at

- A scratch worktree at 817879d, with node_modules as a directory of symlinks to the main checkout (no `npm ci`), a fresh web export of all three builds by the e2e global setup, and a short TMPDIR. Develop then moved to a6519a4; I diffed the files P6a owns (none changed) and re-read the Delete account page that #358 changed.
- The P6a Playwright journeys with the preinstalled Chromium, `JOURNEY_SHOTS=1`, one worker: **j03 (3), j06 (5), j07 (4), j12, j13, j14, j15 (2) and j16 (2): 19 of 19 passed** (28.5 min, on a host at load 20 to 44). Screenshots at 402 by 874 pt, 3x.
- A scratch probe (never committed) against patched copies of the web build, as the P4 pass did: Apple's store view reported as available, not available and iOS 16 (`storeViewSupport`), a plan snapshot written to the on-device settings (lapsed), a font scale reported to the app so `useIsAccessibilitySize()` branches run, and accessibility text sizes emulated by scaling every px font size by RN's multipliers with the token caps (display 1.6, title1 1.8, title2 2.0, letterDateline 2.4, promptHero 1.8). Icons and artwork keep their size. This is an approximation, not iOS Dynamic Type; it also scales the web preview's own header, which iOS does not, so heights near the top are an upper bound. Twelve Keep sheet scenarios: default, store available, offline (a "See Plus" that answers unavailable), lapsed, dark, Reduce Motion, AX3, AX5, AX5 dark, iPhone SE at the default size and at xxxLarge, and iOS 16. Settings home, Add a child and "If you are struggling" at AX5 and in dark (captured; I looked closely at the Keep sheet, Add a child at AX5 and the journey screenshots).
- Screenshots stay in the session scratchpad, not in git (COORDINATION section 8): `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p6-shots/` (`default/` from the journeys, `keep/`, `p6b/`), and the probe's raw results in `/tmp/cr-p6/probe-a-results.json`.
- Read: CLAUDE.md, the spec sections above, MOTION 2, 5i, 5l (row 5c, 9, 10) and 6, COMPONENTS 0.1, 2.10, 2.11, 2.12, DESIGN_LANGUAGE as P6 cites it, `packages/content` VOICE.md and BRAND.md, `docs/legal/in-app-disclosures.md` (unchanged by this pass), every string these screens read, and the bodies of #312 and #313.

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS sheet or keyboard, no native stack animation, no StoreKit (the probe fakes only the availability answer, not a purchase) and no `Alert` (react-native-web's `Alert.alert` does nothing, so "Hide this book"'s confirm cannot be driven there). Where that limits a finding, the finding says so; section 7 lists everything left for a phone.

## 2. Findings, ranked

### Must before build 2

**M1. Settings home offers "Delete account" to a parent who is not signed in.**
- Spec: S40 copy table (line 1029): `settingsHome.deleteAccountLabel` "Delete account", "Signed in only, its own section, destructive style"; S40 Visual (line 1036): "Delete account in its own section above Help, signed in only."
- Built: the row shows whenever the build has sign-in (`apps/mobile/src/app/settings/index.tsx:113-117`, `capabilities.signIn`), whatever the person's state. The signed-in test already exists beside it: `SIGNED_IN` in `components/settings/settings-home.logic.ts:14`, used for the Account subtitle. #312 lists this as waiting for P8's request ("Not done here"); P8c-lite (#358) has since shipped the Delete account page, so nothing waits any more. On the page itself, a signed-out visitor reads the signed-out body and a Sign in button (`settings/delete-account.tsx:87-92` at a6519a4).
- A parent: in the TestFlight preview build (server features on) and in any build with sign-in, a parent who never signed in (sign-in is optional) sees a red "Delete account" row in its own section on every visit to Settings (`default/J16-20-full.png`: the Account row above it still says "Sign in, and the ways you sign in."). It reads as if the app already holds an account for them, and it is the only red thing on the page.
- Fix: show the row only when `SIGNED_IN.has(auth.state.status)`, the same set the Account subtitle uses; pin it with a test next to `settings-home.test.ts`. This is one line and is the last open part of the spec's S40 Visual line for P6a.

### Should before build 2

**S1. At accessibility text sizes the Keep sheet's buttons are a screen and a half below the words.**
- Spec: S22 Visual (line 728): "Then 'See Plus', 'Keep it here for now', and the 'Redeem a code' link"; COMPONENTS 0.1: at AX5 rows stack, nothing truncates silently, and the person can always reach the control.
- Built: at accessibility sizes `footerPlacement` is `inline`, so the buttons move into the scroll under the words (`apps/mobile/src/components/child/plus-gate.tsx:93`, `:203-217`), and the card loses its tilt but not its size (`plus-gate.logic.ts:128-130`). Measured on the emulated web build (874 pt tall): at AX3 the card is 372 pt tall, and See Plus starts at y 1,190 and "Keep it here for now" at y 1,276; at AX5 the card is 450 pt, See Plus starts at y 1,723, the hold button at y 1,829 and Redeem a code at y 2,089 (`keep/ax3.png`, `keep/ax5.png`). At the default size on the 874 pt phone they start at y 706 and 766, and on an SE at xxxLarge (not AX) they are pinned at y 497 and 557 of 667, all on screen.
- A parent with large text: opens the sheet and sees a tilted-free card, a heading and two sentences, and no button. Nothing says there is more below. The one control that gets them out ("Keep it here for now") is two screens down at AX5. VoiceOver reaches it by swiping, but a low-vision parent who zooms or reads by eye may think the sheet has no way out. Review's own footer rides inline at these sizes by the same rule, so this is the rule's cost, not a bug in the sheet.
- Fix: at accessibility sizes keep the held card to its two-line excerpt at the card's own size (do not scale the excerpt with Dynamic Type: it is a picture of the letter, and "Asha, um," is the whole of it at AX5), or lift the two buttons above the held card, so "Keep it here for now" is on the first screen at AX3. Check on a phone (D5).

**S2. At accessibility text sizes Add a child's heading breaks to a word a line beside the book cover.**
- Spec: S47 Behaviour (line 1194): "identical to the first-run child step ... the small book cover taking the name"; COMPONENTS 0.1: rows stack at AX5.
- Built: the heading and the cover are one row (`apps/mobile/src/components/child/add-child-form.tsx:112-121`), the cover is artwork and does not scale, and `title1` scales to 1.8x. Emulated AX5: "Who / is / this / book / for?" on five lines with the cover beside it, and the Name field first appears about 700 to 800 pt down the 874 pt screen (`p6b/addchild-ax5.png`; the web header is scaled too, which iOS would not, so this is an upper bound; the five-line heading holds without it).
- A parent: with large text, opens Add a child and meets a wall of heading; the first field is under the fold. The same row is the first-run child step (S05, P2's), so the first book has it too.
- Fix: at accessibility sizes put the cover under the heading, or drop it until a name is typed (`useIsAccessibilitySize()`); one change in `add-child-form.tsx`, and S05 can share it.

### Later

| # | Spec line | Built (817879d) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S22 Visual (728): the held letter's "own first words" in `letterBody` | the card shows the stored words: a spoken draft's raw transcript, not what Review showed (`plus-gate.logic.ts:103-105`, `review.tsx:683`; #312 R5, the coordinator's rule, so Tonight's card and a reopened Review agree) | the card reads "Asha, um, today you you held the spoon" after Review showed the um and the repeat struck (`keep/dark.png`); at AX5 "um," is half of what the card shows. True to "exactly as it is" and nothing is added, but it can look as if the fixes were lost | decide on a phone whether to show the same deterministic clean Review opens with (through `verifyEdits`), or leave it; Tonight's card shows the same words either way |
| L2 | S40 Visual (1036): About shows the app icon at 60 pt and the small-cut lockup at 22 pt | not built: About is the Version row and the footer (`settings/index.tsx:127-136`); declared in #312 "Not done" | nothing wrong, nothing delightful | bundle the icon and the small cut as `welcome-lockup.logic.ts` does |
| L3 | S22 Visual (728), 5.8 row 10: a sheet "opens natively" | an in-screen layer with no grabber and no swipe; the buttons, VoiceOver's escape and Android's back are the exits (`plus-gate.tsx:178-220`; declared in #312) | a parent who swipes down to go back to the letter finds nothing happens; "Keep it here for now" is the only way out and it also closes Review | accept for build 2; a device check (D9); consider "Back to the letter" as a quiet third choice |
| L4 | S22 copy (719): `keepGate.heldNote`; D-083: the person taps Keep themselves | after a redeemed code the sheet leaves and Review shows with nothing said; `keepGate.plusIsOn` ("Plus is on. Your letter is waiting for you to keep it.", `billing.en.ts:66`) is read by no screen. After a purchase `/plus/confirmed` covers this | after "Redeem a code" the person is back on the letter and has to guess that Plus is on and that Keep now works | device check D2; if nothing is said, show `plusIsOn` as Review's note for that return |
| L5 | S40 copy (1026): `settingsHome.planHelp` | the Plan row always reads "Your first two letters are free. Plus lets you keep adding letters." (`settings/index.tsx:82`) | a parent with Plus on is still shown the free-letters pitch under Plan | show the plan's state (the Plan screen's first row) or nothing once Plus is on |
| L6 | S46 copy (1166): `familyCopy.bookRow.label` replaces `soon.settingsRow` | the row still reads `familyCopy.soon.settingsRow` (the same words, "Write this book together"; `settings/children/[id].tsx:138`); the P8b key exists | nothing; the words are equal | the one-line switch #312 recorded (A5) |
| L7 | S40 and P1: trust copy is never below the subhead step (`lib/review-layout.logic.ts:27`) | the privacy line is the Your data footer in `footnote` (14 pt; `components/ui/list-row.tsx:41-43`, `settings/index.tsx:103`) | trust copy in the smallest body step, as iOS Settings footers are | spec owner to say whether the floor covers Settings footers (section 5) |
| L8 | S46 copy (1163): `hideLabel` | the Hide row shows only when the parent has two or more books (`settings/children/[id].tsx:148`); its confirm is an `Alert`, which the web does not draw (`:78-91`) | a parent with one book never sees Hide (fine); on the web preview the confirm cannot be driven, so the footer is all the preview proves | none needed; note for P7's journey record |

Not raised again: "Hide this book" has no undo until #361; `settings.neverRewrite` is rendered nowhere (counsel relay item 15); the plan row says "Plus is on." while the note carries the trial date (counsel to confirm); a double tap on "Keep it here for now" can reach the Book tab on the web.

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S40: the early-version note only under About, as its footer, after the Version row, unstyled, word for word (`settings/index.tsx:127-136`; `strings.en.ts:845-852`; pinned in `experience-pass.test.ts` REGISTERED). `in-app-disclosures.md` section 1 was not touched and still matches the strings | Accept. j16 counts it once, under the Version row (`default/J16-01-full.png`) |
| A2 | S40: the short privacy line appears once, as the Your data footer; the page footer copy is gone | Accept (j16 count 1) |
| A3 | S40: "If you are struggling" and Licenses are rows that push their own pages; no accordion opens in the list. The struggling page keeps the three resources and the 911 line word for word, each a call row (`settings/struggling.tsx`; j16) | Accept. Licenses' own notice rows open one at a time inside their page, which S40 allows |
| A4 | S22 and the constitution: the Keep sheet holds the letter and never loses or rewrites it. `holdOnce` runs once, a failed hold still closes and is not counted, there is no discard, delete or clear on the hold path, and the card shows words from this phone only (`plus-gate.logic.ts:114-122`, `review.tsx:689-692`; `plus-gate.test.ts`). j06e and j07d: the letter appears on Tonight as "Waiting to be kept." | Accept. The words on the card are L1 |
| A5 | S22 and D-083: no "$", price, "free trial", "free months", count or countdown on the sheet in any state. I read the sheet's text in default, store available, offline, lapsed, iOS 16 and AX5: only the title, body or lapsed body, the held note, the offline or unavailable line, the three buttons and the card | Accept |
| A6 | S22 states: no StoreKit (one primary "Keep it here for now" under "Plus is not available on this device yet."), offline ("Plus needs a connection to start. This one waits on this phone, on Tonight, exactly as it is." under See Plus, which stays), lapsed (`lapsedBody` replaces the body), iOS 16 ("Plus can be added on iOS 17 or later.") | Accept (`keep/store-offline-after.png`, `keep/lapsed.png`, `keep/needs17.png`) |
| A7 | S22 motion and Reduce Motion: the sheet slides on `standard` or fades over `fadeMs` under Reduce Motion; the card enters with `motion.enter`; the buttons are there from the first frame; no haptic on opening Apple's sheet (`plus-gate.tsx:130-143`, `:154-159`). Read from source; the web probe showed the settled layout only | Accept; timing is a device check (D6) |
| A8 | S22 accessibility: modal for VoiceOver, focus on the title, the card one element with every word and the dateline without its separator, 44 pt targets (Redeem a code 44 pt, See Plus 56, hold 48), VoiceOver's escape and Android's back return to the letter with nothing held (`plus-gate.tsx:94-100`, `:120-128`, `:178-186`) | Accept from source; VoiceOver is a device check (D4) |
| A9 | S22 held note in `subhead` `textMuted`, not `footnote` (P1's trust-copy floor; #312 departure) | Accept, as P4's A10. textMuted on paper 5.51 (light) and 8.01 (dark) |
| A10 | `heldNoteSynced` is held for counsel (C10): `SYNCED_HELD_NOTE_CLEARED` is false, and every state I reached shows `heldNote`; no registered billing text changed | Accept; unchanged and held |
| A11 | S47: no date is chosen for the person, "Born today" is a chip, the primary waits with its reason above it ("Choose Ravi's birthday to continue."), the cover takes the name after a pause, the label is "Add this book" before a name or past 22 characters, free with no Plus gate (`add-child-form.tsx:84-107`, `:137-183`; `add-child-form.logic.ts`; j03: `default/J03-09.png`) | Accept. The web shows the browser's own `mm/dd/yyyy` control; the iOS date control is a device check |
| A12 | S46: the due-date card says "Asha's birthday / Add it when you are ready." with "Set the birthday" and "Hide"; it never says born, never celebrates, shows no count and is not on Tonight; Hide puts it away until the Due date row is opened; setting the birthday replaces the due date (j03c; `default/J03-31.png`). A raised card, not tinted, so the secondary pill shows (declared) | Accept |
| A13 | S46: "Hide this book" is plain, not destructive; with a co-parent its footer adds "Hiding is only for you. Papa still sees Asha's book as before." (`child-settings.logic.ts:58-62`; `children-settings.test.ts`); "Write this book together" is the coming-soon row with server features off (`default/J03-31.png`), the invite with one parent and the Family tab with two | Accept; the two-parent path needs a joined book (D7) |
| A14 | Dark mode and contrast on these screens: the Keep sheet in dark (`keep/dark.png`) keeps the card edge as a hairline and reads clearly; caution glyph on the accentSoft card 4.09 (light) and 7.08 (dark), against 3:1 for a graphic; textMuted on accentSoft 4.75 and 5.73 | Accept |

## 3. The departures #312 declared

| # | Departure | Ruling | Where |
|---|---|---|---|
| 1 | The held note in `subhead`, not `footnote` | Accept | A9 |
| 2 | The due-date card raised, not tinted | Accept | A12 |
| 3 | The Keep sheet has no pan-to-close | Accept for build 2; see L3 | L3 |
| 4 | The sheet is drawn inside Review's screen, not a second native presentation (so Apple's store view and `/plus/confirmed` present over it as they did over Review) | Accept; the purchase path is a device check | D1 |
| 5 | About's icon and small-cut lockup not built | Later | L2 |
| 6 | `heldNoteSynced` held for counsel | Accept | A10 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #312 R7 | "Hide this book" has no undo; P6d is a separate PR | Known; not re-raised |
| #312 For the spec owner A2 | `settings.neverRewrite` rendered nowhere | Known (counsel relay 15); not re-raised |
| #312 Not done | About icon and lockup | Later (L2) |
| #312 Not done | P8's seams: Back up my recordings and Delete account drawn as they were; "Delete account signed in only" waits for P8's request | Delete account: Must (M1); #358 has shipped the page, so the wait is over. Back up my recordings: unchanged, behind its capability |
| #312 Not done | "Write this book together" label switch after #314 | Later (L6) |
| #312 Not done B9 | Account subtitle names the first provider on the account | Accept for build 2; P8a's, noted |
| #312 Needs a phone | the Keep sheet on iOS with StoreKit sandbox, VoiceOver, AX5 and Bold Text on SE 3 and a 6.1-inch phone, Reduce Motion, two parents, struggling rows and Licenses on the SE 3 | Carried into section 7, none dropped |
| coordinator, this pass | a double tap on "Keep it here for now" can reach the Book tab on the web | Known; not re-raised |

## 5. Spec-owner changes

Each row changes a line in `docs/design/EXPERIENCE_PASS_2026-10.md` to match what was built and accepted, or to the fix a finding proposes. Line numbers are on 817879d.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S22 Visual, 728 | "Then the title in `title1`, the body in `body`, the held note in `footnote` `textMuted`" | "the held note in `subhead` `textMuted` (trust copy is never below the subhead step)" | A9 |
| S22 Visual, 728 | "a full-height sheet on paper" that opens natively | add: "Drawn inside Review's screen so Apple's store view and the purchase confirmation present over it; it slides on `standard` and fades under Reduce Motion; its exits are the buttons, VoiceOver's escape and Android's back (no swipe)" | L3 |
| S22 Visual, 728 | the held card's "first two lines in `letterBody`" | say which words: "the words stored on this phone, the same as Tonight's card" (or "as Review opened them", if L1 is changed) | L1 |
| S22 States, 732 | no StoreKit, offline, lapsed | add iOS 16: "`gate.needsNewerIos`, one 'Keep it here for now'" | A6 |
| S22 Visual, 728, at accessibility sizes | nothing | add: "At accessibility sizes the buttons sit in the scroll; the card stays two lines at the card's own size so the first button is on the first screen" | S1 |
| S40 Visual, 1036 | "Delete account ... signed in only" | already says it; no change, build it (M1) | M1 |
| S40 and P1 | no line on footers | rule: whether `trust.short` and the registered promise in a Settings footer may be `footnote`, or follow the trust-copy floor | L7 |
| S47 Behaviour, 1194 | "identical to the first-run child step" | add: "at accessibility sizes the cover sits under the heading" | S2 |
| S40 copy, 1026 | `settingsHome.planHelp` always shown | "with Plus on, the Plan row shows the plan's state, not the pitch" | L5 |

## 6. Motion, dark mode and text size

**Motion.** Read from source, not measured: the Keep sheet rises with `SlideInDown.springify()` from the `standard` spring over a scrim that fades in over `fadeMs`, and leaves over `exitMs`; under Reduce Motion both fade over `fadeMs` (`plus-gate.tsx:154-159`, `useSheetMotion`). The held card enters with `motion.enter(0)`. Controls never animate in. Settings pushes are the platform's (5.8 row 9) and take no lamp. No haptic on opening Apple's sheet or the offer-code sheet. Frame timing of the sheet is a device check (D6): the web build does not run the iOS spring.

**Dark mode.** Captured for the Keep sheet (default and AX5), Settings home, Add a child and the struggling page; I looked closely at the Keep sheet only, and the rest is checked from the tokens (every colour on these screens is a token). The Keep sheet in dark draws the card with a hairline `line` edge and no shadow, the held note in `textMuted` 8.01:1 on the background; the primary is the dark accent with dark text. I saw nothing hard-coded on it.

**Text size.** Emulated only (section 1). Settings home rows stack their value under the title at AX sizes (ListRow, `components/ui/list-row.tsx:94-100`). The Keep sheet at AX3 and AX5: S1. Add a child at AX5: S2. The struggling page wraps its rows. `Text` variants carry their own caps, so the Keep title at AX5 is title1 at 1.8x and reads whole.

| Keep sheet geometry (web, 402 by 874 unless noted) | Held card top and height | See Plus top | Keep it here top | Redeem a code top |
|---|---|---|---|---|
| default, store available | y 30, 170 pt | 706 | 766 | 818 |
| iPhone SE 375 by 667 | y 30, 170 pt | 499 | 559 | 611 |
| SE at xxxLarge (1.353x) | y 30, 206 pt | 497 | 557 | 611 |
| AX3 (2.643x) | y 36, 372 pt | 1,190 | 1,276 | 1,416 |
| AX5 (3.571x) | y 36, 450 pt | 1,723 | 1,829 | 2,089 |
| no StoreKit | y 30, 170 pt | none | 806 (primary) | none |

## 7. What we could not see on the web (device checks, with procedures)

Run on an iPhone with the TestFlight preview build (server features on), a free book with two letters already kept, unless the line says otherwise.

- **D1. StoreKit purchase from the Keep sheet (blocking, as P4's S9 was).** Write a third letter, tap "Add to Asha's book". Tap See Plus; Apple's store view must open over the sheet. Buy in the sandbox. Expected: `/plus/confirmed` opens, the sheet goes, and Review shows the same letter; tap "Add to Asha's book" and the letter is kept and the saved moment plays. Check the sheet and the confirmation never show at once, and no letter was kept before the tap.
- **D2. Redeem a code.** Same start; tap "Redeem a code", redeem a sandbox code. Expected: Plus turns on and Review shows; note what, if anything, says Plus is on (L4).
- **D3. Offline.** Airplane mode, tap See Plus. Expected: "Plus needs a connection to start. This one waits on this phone, on Tonight, exactly as it is." under See Plus, which stays and works again once online. Then "Keep it here for now" and confirm the card on Tonight.
- **D4. VoiceOver on the sheet.** Focus lands on "Keep adding to Asha's book"; the card reads once as "To Asha, Month 7. {the words}. From Mama. Waiting."; nothing of Review is reachable; the escape gesture returns to the letter with nothing held; after "Keep it here for now", Tonight reads "Waiting to be kept." Also check Settings home rows read title, subtitle and value once, and the struggling rows read as links.
- **D5. Large text.** AX3, AX5 and Bold Text on an SE 3 and a 6.1-inch phone: the Keep sheet (where the buttons start, S1), Add a child (the heading beside the cover, the date row and the reason line, S2), the child settings card.
- **D6. Reduce Motion and sheet timing.** With Reduce Motion on the sheet and scrim fade and nothing slides; with it off, the rise is the system-like spring, and the sheet never delays the buttons.
- **D7. Two parents (S1-29).** On a joined book: "Write this book together" shows the co-parent's signature and opens the Family tab; "Hide this book" shows the shared footer; an unsigned co-parent reads "Your co-parent".
- **D8. Crisis lines and Licenses (S1-30).** Each "If you are struggling" row offers a call (cancel the call); Licenses opens and scrolls on the SE 3 and its first open is timed (over about 300 ms is a finding), and cold start does not move.
- **D9. The sheet's exits.** Swipe down on the Keep sheet: nothing should happen (L3). Android's back is later.
- **D10. Delete account row.** After M1: signed out, the row is absent; signed in, it shows in its own section and opens the page.
- **The Add a child date control** on iOS (the web shows the browser's), the keyboard lifting the primary, and the cover stepping aside under the keyboard on an SE.
- **Hide this book's confirm** (the web cannot draw the `Alert`): the title, the message, Cancel and "Hide this book" (plain, not red), and that the app returns to Settings.

## 8. The constitution and the content rules, checked

- Nothing on these screens writes or reshapes a person's words. The Keep sheet draws the person's own stored first words in the letter face, signed as Review signs them; the due-date card, Add a child and the Settings rows are the app's small unsigned words in the app's face.
- Plus never gates the free-forever core: the sheet appears only at the Keep step (`review.tsx:442`, `keepSheetFor`), it holds the letter and never loses it, reading, playing and export stay open, starting a book is free (S47), and the letter page counts nothing.
- No fear, guilt or loss language, and no streaks, points or badges: "kept for good" and "for as long as you like" are about time and love, the sheet counts nothing, the card says "Waiting", not "unsaved" or "at risk".
- Nothing genders the child; every line uses `{child}`. Nothing implies software wrote anything.
- Registered and held text: `in-app-disclosures.md` is byte for byte as it was; the early-version note matches `strings.en.ts` and the REGISTERED map; no `billingCopy.plan.*` text, `store.subtitle` or `heldNoteSynced` changed in #312 or since; I found nothing in P6a's screens that reads like a change to them.
- Privacy: the sheet sends nothing to show the held words, and its four analytics events carry counts and outcomes; no entry text, transcript or child name in analytics or logs.
- This document uses the fictional family Asha only (and Ravi, as the journeys do), and no em dashes, en dashes, curly quotes, ellipsis characters or emoji.

## 9. Coordinator's rulings

None yet. M1 is ranked Must by this pass because it is a spec line (S40 Visual) with a one-line fix and the most visible wrong control on the page; the coordinator may rule it Should, in which case the verdict in section 0 becomes "Signed" with the two Should items and M1 on the fix list.
