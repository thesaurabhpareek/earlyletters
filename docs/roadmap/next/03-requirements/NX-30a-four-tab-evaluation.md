# NX-30a: Is a four-tab bar (Tonight, Book, Photos, You) right for Early Letters?

Status: draft, 9 Nov 2026 (UTC). Docs only. Author: `design-systems` handle (task G-7). It assigns no real id (`_CONVENTIONS.md`), reserves nothing, and answers no legal question. It is a sibling of NX-30 (navigation and landing) and NX-32 (account management) and does not repeat them.

Readiness: not scored against the 14-point audit; `qa` to score. What keeps it from ready: two founder answers (F-1 Photos, F-2 the label), content naming the label, a device pass for every row marked UNVERIFIED.

| | |
|---|---|
| Working label | NX-30a (rows are `NX-30a-R<n>`, the same shape as `NX-30`; the letter suffix marks a sibling of NX-30, not a split row) |
| Refines | NX-30 (Option B, the "third tab"), NX-32 (where Account is reached), `docs/design/IA.md` ("Rules for adding a place"), `docs/design/DESIGN_LANGUAGE.md` section 12 (navigation), `docs/tdd/09-accessibility-design-system.md` 2.3 (tab labels, Large Content Viewer) |
| Tag | EVIDENCE for the code (read on `origin/develop` at `bf5591be`, 9 Nov) and for every ratio (computed here from token hex values). HYPOTHESIS for every statement about what the founder or a parent will do |
| Size | S for the tab itself; M if the Settings home is rehosted inside the tab group (see "Engineering block") |
| Gate | Founder answers F-1 and F-2. A new tab needs a decision entry (IA.md). #665 merges first (it edits the same file) |

## The founder's words

After testing Build 12: Settings and Profile are hard to reach, and the landing page (Tonight) is dull. The second half is NX-30's subject. This file answers only the first half and the proposed shape, a bar of Tonight, Book, Photos, You, with Settings and Profile/Account inside You.

## Verdict (6 lines)

1. A "You" tab is right and fits: at 4 tabs on a 375 pt phone each item is 93.75 pt wide (computed, 375 / 4) against a 44 pt minimum (`tokens.target.min`), and the widest label, "Tonight", is 43.1 pt at 13 pt Mukta Medium (measured from the font file), so nothing truncates or needs a More tab.
2. A "Photos" tab is not right today: there is no photo feature to put in it (no image picker in `apps/mobile/package.json`, export schema `photo: null`), and the PRD forbids photo-only entries, so the tab would be a placeholder, which the repo's own critique (`01-product-ux.json`) already calls a dead end for the Family tab.
3. Settings from a cold launch is 2 taps today (Book tab, gear); with a You tab it is 1. Account is 3 taps today and exists only in builds with sign-in on; with You it is 2.
4. Contrast passes for text and icon in both themes (selected 5.50 : 1 light, 8.37 : 1 dark; unselected 5.51 : 1 and 8.01 : 1) but the selected and unselected colours differ by only 1.00 : 1 (light) and 1.04 : 1 (dark) in luminance, so selection today rests on the filled icon and a slight hue shift. That is allowed (not colour alone) but weak, and a fourth tab makes it matter more.
5. Recommended shape: Tonight, Book, You in the store build (Family stays hidden, #665), and Tonight, Book, Family, You where family surfaces are on. That is a four-tab bar with no Photos tab. Photos reopens only if G-2 ships, and then as part of the Book, not a tab.
6. Recommended label: "You" (placeholder pending content and the founder), icon a person; fall back to "Settings" if the usability task U1 fails.

## What the code does today (EVIDENCE, `origin/develop` `bf5591be`)

- `apps/mobile/src/app/(tabs)/_layout.tsx`: JS tabs (`expo-router/js-tabs`), three screens in this order: `index` (Tonight), `book` (Book), `family` (Family). Labels come from `copy.tabs` (`tonight`, `book`, `family` in `packages/content/src/strings.en.ts` line 58). 25 pt Phosphor icons, filled when selected. `BAR = 58`, bar height `BAR + bottom`, `bottom = max(safe-area inset, 8)`. `tabBarAllowFontScaling: false`, label size `tokens.minFontSize` (13), line height 18. On iOS every tab button is wrapped with `LARGE_CONTENT(title)` (Large Content Viewer). No haptic, no custom transition. Active tint `c.accent`, inactive `c.textMuted`, bar fill `c.bg`, 0.5 pt top border `c.line`.
- Family on `develop` is still drawn in every build (with servers off it is a "coming soon" page, `family.tsx` `FamilySoon`). #665 (open) removes it from the store build.
- Cold launch: `unstable_settings = { initialRouteName: '(tabs)' }` in `app/_layout.tsx`, first tab `index` = Tonight; a first-run phone is sent to `/onboarding` before the tabs (MOTION 5k). Counts below assume the person is past onboarding and any app lock.
- Settings is a root-stack route (`app/settings/*`, pushed above the tabs), reached from one place: the gear on the Book cover band (`components/book/cover-band.tsx`, `testID="book.settings"`, an `IconButton` at its default `md` size, 44 pt square).
- Account (`/settings/account`) is reached from the header card at the top of Settings home. `headerCard()` in `components/settings/settings-home.logic.ts` returns `route: null` when `capabilities.signIn` is false, so in a build without sign-in the card opens nothing, and `account.tsx` redirects to `/settings` if reached by a stale link. `capabilities.signIn` follows `serverFeaturesEnabled()` (`lib/capabilities.ts`).
- There is no route or string called "Profile". The nearest thing is a child's page, `settings/children/[id]`.
- Tab bar docs drift (found while reading, not fixed here): DESIGN_LANGUAGE section 7 says tab icons are 28 pt, the code draws 25 pt; TDD 09 line 120 says a 12 pt label, the code uses 13 (`tokens.minFontSize`); IA.md says the store build "is meant to have two" tabs.

### Taps from a cold launch (derived from reading code, not measured on a device)

| Destination | Taps today | Path | With a You tab (proposed) |
|---|---|---|---|
| Settings home | 2 | Book tab, gear | 1 (You) |
| Account | 3 in a sign-in build; not reachable otherwise | Book tab, gear, header card | 2 (You, header card) |
| A child's page | 3 | Book tab, gear, the child's row | 2 |
| Delete account | 3 (signed in, `capabilities.accountDeletion` on) | Book tab, gear, row | 2 |
| Settings from Tonight | no door; 2 after switching to Book | | 1 |

The founder's complaint is consistent with this: from the landing screen there is no visible door to Settings at all (HYPOTHESIS that this is what "hard to reach" meant).

## Evaluation

### 1. Tap targets (WCAG 2.5.8 AA is 24 px; Apple HIG and `tokens.target.min` are 44 pt)

- Token: `target = { min: 44, primary: 56, capture: 64, web: 48 }` (`packages/design-tokens/src/tokens.ts` line 382).
- Item height: the layout comment gives 5 pt padding + 25 pt icon + 18 pt label line + 5 pt = 53 pt inside a 58 pt bar, above 44 (derived from the comment and constants, not measured).
- Item width: screen width divided by tab count. 3 tabs at 375 pt is 125 pt; 4 tabs 93.75 pt; 5 tabs 75 pt; at 390 pt 130, 97.5, 78. All above 44. Width at 320 pt (if the app supports it, UNVERIFIED): 4 tabs 80 pt, 5 tabs 64 pt, still above 44.
- Result: PASS for 3, 4 and 5 tabs. Not a reason to choose among them.

### 2. Labels at Dynamic Type through AX5, and the design system's rule for tab labels

- The rule (TDD 09 line 114, `_layout.tsx` header comment, HIG): tab labels do not scale with Dynamic Type; they stay at the 13 pt floor (`tokens.minFontSize`) and, on iOS at accessibility sizes, a long press shows the Large Content Viewer. `tabBarAllowFontScaling: false` is set; `LARGE_CONTENT(title)` is applied per screen by a local `button()` helper, so a new tab must pass its title there too (the helper is not automatic).
- D-027 (letter text never truncated) concerns letters, not chrome; tab labels are chrome. They still must not clip.
- Label widths at 13 pt Mukta Medium, computed from advance widths in `packages/design-tokens/fonts/Mukta-Medium.ttf` (no kerning, so within about 1 pt): Tonight 43.1 pt, Book 27.6, Photos 38.5, Family 36.3, You 21.3, Yours 31.6, Settings 45.9, Keepsakes 58.1. Widest item at 4 tabs and 375 pt is 93.75 pt wide, so the widest label uses 46 percent of it. No wrapping or truncation.
- Result: PASS, with one condition: because labels never grow, AX5 users depend on the Large Content Viewer, which is a long-press and was not tested on a device here (UNVERIFIED). A fourth item does not change this; it must be added to the test list so a new tab cannot skip `LARGE_CONTENT`.

### 3. VoiceOver order and labels

- Order is left to right, so Tonight, Book, (Family or Photos), You. Putting You last follows the iOS habit of a trailing account/settings tab (general practice, not read from a source this run).
- Each tab's accessible name comes from the same `title` string as the visible label (React Navigation reads `title`); the role and "n of N" announcement come from the library's tab button. I did not run VoiceOver, so the exact spoken text, including whether the iOS-only `Pressable` wrapper in `_layout.tsx` keeps the tab role and selected state, is UNVERIFIED. This is the first thing the device pass checks, because the wrapper replaces the library's button on iOS.
- The You screen needs one heading (level 1) so VoiceOver has a landmark after the switch. Settings home today is a pushed page with a native header; as a tab root it has no Back button, so the first element read must be the title, not "Back".
- Result: UNVERIFIED on device; no design problem found from reading.

### 4. Reduce Motion

- Tabs use the native swap with no custom transition and no haptic (MOTION 5i and 6). What moves between tabs is the lamp, which settles from one tab's light to the next over `lamp.returnMs`; with Reduce Motion the Lamp renders its final state, still (`components/ui/lamp.tsx` header: "Reduce Motion: no arrival, no rise, no breath: the final state, still").
- A You tab has no lamp today: Settings pages are "native push, no lamp" (`account.tsx` header). So switching Book to You would fade the lamp down to plain paper, then back on return. Decision needed (R7): You shows plain paper with no lamp, like every Settings page, and the lamp fades under the same rule as Listen. The scenes in `LampScene` are named per room (`tonight`, `book`, `family`); no new scene is needed.
- Result: PASS in principle; the plain-paper rule must be written down and tested.

### 5. Contrast of selected and unselected tab, light and dark (computed)

Method: WCAG 2.x relative luminance on the token hex values in `packages/design-tokens/src/tokens.ts`; the tab bar fill is `c.bg`. Selected = `accent`, unselected = `textMuted`. Needs: label text 4.5 : 1 (1.4.3), icon 3 : 1 (1.4.11), and selection not by colour alone (1.4.1).

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Selected (`accent`) on `bg` | `#8A5A3B` on `#FBF8F3` = 5.50 : 1 | `#D9A47E` on `#161412` = 8.37 : 1 | 4.5 |
| Unselected (`textMuted`) on `bg` | `#6B645B` on `#FBF8F3` = 5.51 : 1 | `#B3AA9E` on `#161412` = 8.01 : 1 | 4.5 |
| Selected against unselected | 1.00 : 1 | 1.04 : 1 | no WCAG number; see below |
| Hairline `line` on `bg` | 1.26 : 1 | 1.40 : 1 | decorative, not a boundary of a control |
| Increase Contrast selected / unselected on `bg` | 7.79 : 1 / 8.10 : 1 | 10.58 : 1 / 11.79 : 1 | 4.5 |

- All text and icon pairs pass 4.5 : 1 in both themes and with Increase Contrast. These numbers equal the comments in `tokens.ts` (5.50, 5.51, 8.37, 8.01), so the file is accurate.
- Finding: the selected and unselected colours have almost the same luminance (1.00 : 1 and 1.04 : 1). Someone with low colour discrimination sees them as the same grey-brown. The only non-colour cue is the icon: filled when selected, regular when not (`weight={focused ? 'fill' : 'regular'}`). That meets 1.4.1 but is a small difference at 25 pt, and the label carries no cue at all. With four items the bar is busier, so I propose a second label cue (R5): the selected label in Mukta SemiBold (a bundled face), no extra colour. SemiBold width is not measured (UNVERIFIED), but the widest 4-tab label has more than 45 pt to spare.
- Result: PASS for the standards; one improvement proposed.

### 6. One-handed reach

- The bar sits at the bottom, about `58 + max(inset, 8)` pt tall (inset on notch-class phones UNVERIFIED), in the thumb's easy zone. The only door today, the gear on the Book cover band, is at the top trailing corner: the hardest place for a right thumb (general reach guidance, not read from a source this run, so UNVERIFIED as a measurement).
- The You tab moves Settings from the hardest zone to the easiest, and from 2 taps to 1. A gear on Tonight (NX-30 option A) removes a tap but not the reach problem.
- Left-handed use: the last tab is the far edge for a left thumb; acceptable, since the tab is for rare visits.

### 7. Does Apple's HIG allow four tabs without a More tab?

What I read: the HIG "Tab bars" page, fetched as its JSON (`developer.apple.com/tutorials/data/design/human-interface-guidelines/tab-bars.json`) on 9 Nov through a summarising fetch tool, not the full page by eye. It gives no fixed number of tabs for compact width. It says that if horizontal space limits the visible tabs, the trailing tab becomes a More tab on iPhone, and it says to avoid overflow tabs. It also says to use "single words whenever possible", and that a tab bar is for navigation, not actions. So: four tabs are not forbidden and, at 93.75 pt per item, nothing forces a More tab on a 375 pt phone. That the system itself keeps five tabs without a More tab on every iPhone width is UNVERIFIED (not read, from memory only). Because the page was read through a summary, treat the exact wording as UNVERIFIED until a person opens the page.

### 8. Photos as a tab

- No photo code: `apps/mobile/package.json` has no image-picker or media-library dependency (searched, nothing), export schema has `photo: null` and `photos: 0`, and the core gap file marks G-2 "Not built".
- Rules in G-2: one photo with a letter, never photo-only. A Photos tab is a place to browse photos on their own, which the rule forbids; a photo belongs to a letter in the Book.
- BRAND.md positions the product against photo apps ("Letters tell {child} what it felt like"), so a tab called Photos pulls the app toward the category it differentiates from. That is a brand judgment (HYPOTHESIS), for the founder.
- Result: do not build a Photos tab. A tab that opens a "coming soon" page breaks the repo's own critique (Family, `01-product-ux.json` line 603) and "celebrate what exists".

## Cost against the alternatives

| | 4 tabs, Tonight Book Photos You (proposed) | 4 tabs, Tonight Book Family You, store build 3 (recommended) | 3 tabs plus a gear | 5 tabs |
|---|---|---|---|---|
| Settings from cold launch | 1 tap | 1 tap | 1 tap if the gear is on Tonight; 2 today | 1 tap |
| Account | 2 taps | 2 taps | 3 taps | 2 taps |
| Item width at 375 pt | 93.75 pt | 93.75 pt (store: 125 pt) | 125 pt | 75 pt |
| New build | Photos screen and data that do not exist (M to L, G-2) | One tab and a rehosted Settings (S to M) | One icon button on Tonight (S) | Photos plus another place that does not exist |
| Placeholder tab risk | Yes (Photos) | None; Family hides in the store build (#665) | None | Yes |
| Findability | Best | Best | Weak: a top corner icon, the very thing that failed | Best |
| Brand fit | Photos pulls toward photo apps | Good | Good | Busier, more to keep up with |
| Where it loses | Photos | Family and You both vanish into 4 items only where servers are on | Does not fix reach | Both unbuilt places |

Reading the table: the recommendation is the second column. The gear on Tonight (NX-30 option A) is cheap and can ship alongside; it is a second door, not a replacement.

## Label for the fourth tab

Glossary check (`packages/content/BRAND.md` glossary, read): it does not list "Profile", "Settings" or "Account" as forbidden words; it uses "Account" in "Apple Account", "Google Account" and "Sign out other devices (Button and Account row)". The glossary does not define "Profile" at all and the app has no profile concept, so "Profile" would introduce an undefined term and is avoided for that reason, not because it is banned. Parent words already in use: "your words", "your voice", "Your letters" (a Settings section), "On this phone".

Three candidates, each a single word (HIG), all PLACEHOLDER pending content and the founder:

1. **You** (recommended). The founder's own word, shortest (21.3 pt), warm, matches the brand's second-person voice. Risk: a parent may not guess it holds Settings (HYPOTHESIS, tested in U1).
2. **Yours**. Echoes "Your letters" and "for you alone"; 31.6 pt. Risk: reads as possessive of the book, which is the Book tab's job.
3. **Settings**. The plain word the founder could not find, 45.9 pt, matches the title of the page it opens. Risk: when sign-in is on, the tab also holds Account and children, which "Settings" under-sells; and it is the least warm.

Rule for the pick: if U1 below fails (fewer than 4 of 5 parents find Settings in under 10 seconds with "You"), use "Settings". `content` owns the key (`copy.tabs.you`, new) and the VoiceOver label; the key does not exist yet.

## Rows (what to build, all proposed)

Check table. Test titles are exact. "Fails today" states the behaviour of the tree at `bf5591be`.

| Id | Given / When / Then | Fails today because | Tag |
|---|---|---|---|
| NX-30a-R1 | Given the store build, when the tab bar renders, then the last tab is titled `copy.tabs.you` and opens Settings home | `_layout.tsx` has no such screen; last tab is Family | EVIDENCE |
| NX-30a-R2 | Given a cold launch on Tonight, when the person taps the last tab, then Settings home is on screen: 1 tap | Today 2 taps (Book, gear) | EVIDENCE |
| NX-30a-R3 | Given a build with sign-in on, when the person taps the last tab then the header card, then Account is on screen: 2 taps | Today 3 taps | EVIDENCE |
| NX-30a-R4 | Given any tab, when it is created, then it carries `LARGE_CONTENT(title)` and `tabBarAllowFontScaling` stays false | Guard: passes today for three tabs, pins the fourth | EVIDENCE |
| NX-30a-R5 | Given a selected tab, then its label differs from an unselected one by something other than hue (weight) and its icon weight differs | Today the label is the same weight and the colours differ by 1.00 : 1 (light) | EVIDENCE |
| NX-30a-R6 | Given any build, when a tab is visible, then its screen renders content, not a "coming soon" page | Today the store build shows the Family "coming soon" page until #665 | EVIDENCE |
| NX-30a-R7 | Given the You tab is selected, then no lamp is drawn, the screen has one heading at level 1 and no Back button | No such screen | EVIDENCE |
| NX-30a-R8 | Given 4 tabs at 375 pt and 320 pt, then each item is at least `tokens.target.min` wide and 53 pt tall and each label fits its item | Guard: passes today for three | EVIDENCE |
| NX-30a-R9 | Given the tab titles, then each is one word and comes from `copy.tabs` | Guard: passes today; fails if a title is typed in the layout | EVIDENCE |
| NX-30a-R10 | Given Increase Contrast, light, dark, then selected and unselected tab colours meet 4.5 : 1 on the bar | Guard: passes today (numbers above) | EVIDENCE |
| NX-30a-R11 | Given a Photos tab is proposed, then it is added only when a photo can be added to a letter (G-2) | HYPOTHESIS: a decision, not a test | HYPOTHESIS, Test: none, owner `user-research` and the founder |

### Trace and tests

| Id | Refines | Layer | File (proposed unless it exists) | Exact title | Device row |
|---|---|---|---|---|---|
| R1 | IA.md tabs table | Unit | `apps/mobile/test/tab-bar.test.ts` (proposed; `family-tab.test.ts` exists) | `[NX-30a-R1] the last tab is You and it opens Settings home` | proposed |
| R2 | NX-30 R1 | Maestro | `apps/mobile/e2e/` flow (proposed) | `[NX-30a-R2] Settings opens in one tap from a cold launch` | proposed |
| R3 | NX-32 | Maestro | same folder | `[NX-30a-R3] Account opens in two taps in a sign-in build` | proposed |
| R4 | TDD 09 A11Y-F21 | Unit | `apps/mobile/test/tab-bar.test.ts` | `[NX-30a-R4] every tab sets the Large Content Viewer title and fixed label size` | proposed |
| R5 | A-NFR-005 (colour not the only signal) | Unit | same | `[NX-30a-R5] the selected tab label differs from the unselected by weight, not colour only` | proposed |
| R6 | DESIGN_LANGUAGE 12 | Unit | same | `[NX-30a-R6] no visible tab leads to a coming-soon page` | proposed |
| R7 | MOTION 5i | Unit | same | `[NX-30a-R7] the You tab draws no lamp and has one level 1 heading` | proposed |
| R8 | `tokens.target` | Unit | same | `[NX-30a-R8] four tabs at 320 pt and 375 pt keep 44 pt targets and whole labels` | proposed |
| R9 | HIG tab labels | Unit | `packages/content/test/` (proposed) | `[NX-30a-R9] tab titles are single words from copy.tabs` | none |
| R10 | WCAG 1.4.3, 1.4.11 | Unit | `packages/design-tokens/test/tokens.test.ts` (exists) | `[NX-30a-R10] tab bar selected and unselected colours meet 4.5:1 in light, dark and Increase Contrast` | none |

Failing on the current code: R1, R2, R3, R5, R6 (until #665), R7. Guards that pass today and protect the fourth tab: R4, R8, R9, R10.

Trace: NX-30a-R1..R11 -> IA.md "Rules for adding a place", DESIGN_LANGUAGE section 12, TDD 09 A11Y-F02 and A11Y-F21, A-NFR-005 to A-NFR-007 (as named in the design-systems brief; not re-read for this file).

## Engineering block (for `mobile`, nothing here is built)

- Where Settings lives: `app/settings/*` is a root-stack group above the tabs. The tab needs a route inside `(tabs)` (for example `(tabs)/you.tsx`) that renders the Settings home content; its rows still push the existing `settings/*` pages, which hide the tab bar as today. Whether the same component can be mounted in two routes without duplicate-route problems with the `/settings` deep link is UNVERIFIED and is the first spike.
- The Book gear stays as a second path (`book.settings`); it should call the same destination so there is one Settings home on screen at a time (R2 test).
- `navigation.logic.ts` and `isCaptureRoute` list routes by name; any new route name updates them in the same PR (IA.md rule R-L).
- Feature switch: tab count per build as in NX-30: You always; Family only where `capabilities.coParent`. #665 owns hiding Family.
- Copy: `copy.tabs.you` (new), accessibility label for the tab (new), both `content` and the founder. No copy is written here beyond the placeholder.
- Analytics: a route view for the new tab is `add to catalog first`; analytics are off in every 1.0 profile.
- Data class and privacy: none new; Settings already shows the account email, which stays behind the existing header card.
- Rollback: the tab list is one array; removing the screen restores the previous bar.

## Usability script (proposed; 5 parents with a child under 2, no research done yet)

Test with a build that has the You tab and with today's build (A/B, different people). Moderator says nothing about tabs. Tasks, think-aloud, phone in the dominant hand, default text size, then repeat T1 at the largest text size with one grandparent-aged tester.

| Task | Says | Success (proposed) |
|---|---|---|
| U1 | "Change the reminder time." | Reaches Reminders in under 10 s and 3 or fewer taps; at least 4 of 5 testers without a hint (this decides "You" versus "Settings") |
| U2 | "Find where you sign in or out." | Reaches Account in 3 or fewer taps (sign-in build) |
| U3 | "Switch to another child's book." | Finds the child switcher without a hint |
| U4 | "Get back to tonight's question." | One tap, no misses |
| U5 | At the end: "What do you think the last tab is for?" | At least 4 of 5 say settings, account or "my stuff"; record the exact words (the parent's vocabulary for the label) |
| U6 | Largest text size (AX5): "Find Settings." | Reaches it using the labels or the long-press preview within 20 s |
| U7 | VoiceOver, one tester: "Open Settings." | Hears the tab name and selected state; no tab announced as an unlabelled button |

Record per task: taps, seconds, hint needed, wrong first tap, quotes. The numbers above are proposed targets, not data.

## Conflicts with open pull requests (read from `gh api repos/thesaurabhpareek/earlyletters/pulls/<n>/files`, 9 Nov, 137 open)

| PR | Files that overlap | Effect |
|---|---|---|
| #665 | `apps/mobile/src/app/(tabs)/_layout.tsx` | Same file, same `Tabs.Screen` block. Direct conflict. This work waits for #665 |
| #596 | `docs/design/IA.md`, `docs/design/COMPONENTS.md` | Doc conflict on the tabs table and component specs |
| #502 (draft), #521, #635, #644, #683 (draft) | `packages/content/src/strings.en.ts` | Same file as `copy.tabs`; a text conflict only if the same region is touched |
| #167, #168 | `apps/mobile/src/app/(tabs)/book.tsx`, `family.tsx`, `index.tsx` | Titled "Reference docs" and "Decision register" yet listing the three tab screens; likely stale or misfiled branches. Not opened. UNVERIFIED |

The scan filtered file paths with a pattern for the tab group, Settings home, cover band, button and token files, tokens, strings and the two design docs. A failed API call for a PR would have been silent, so completeness is UNVERIFIED.

## Founder-only decisions

- F-1: Photos tab. Default used here: no, until a photo can be added to a letter (G-2), and then not as a tab.
- F-2: the label ("You", "Yours" or "Settings"); `content` writes it, the founder confirms; the usability task U1 decides if "You" fails.
- F-3: whether Tonight also gets a gear (NX-30 option A). Default: yes, as a second door, since it costs one icon button.

## Not verified

- Every tap count (derived from reading, not device-measured).
- VoiceOver output, including role and "n of N" with the iOS-only `Pressable` wrapper; Large Content Viewer on a device at AX5.
- Label widths with the real text renderer (computed from font advance widths without kerning); SemiBold widths.
- Item heights (derived from the comment and constants, not measured), safe-area inset sizes, 320 pt support.
- HIG: read through a summarising fetch of the page JSON; five tabs without More on every iPhone width not read.
- One-handed reach (general guidance, no source read, no measurement).
- Whether Settings home can be mounted as a tab root without breaking the `/settings` deep link.
- Whether the open-PR scan was complete; #167 and #168.
- The founder's meaning of "Profile" and "landing page" (NX-30 questions Q1 to Q3).
