# Spec sync: what changed since the final IA, and what the design does about it

Status: DRAFT for Karma (CTO) to decide, 20 Nov 2026 (UTC). Author: `design-systems`. Docs only: no code, token, card, string or legal text is changed by this PR. It stacks on #1033 (`docs/design/IA-FINAL-20nov.md`, head `71eb6e126`, not merged). Read that file first; this one only adds to it and says where it moves something.

Companion files, one per ask:

| Ask | File |
|---|---|
| 1 Delta table, 2 IA and navigation | this file |
| 3 Happy and unhappy paths per screen | `docs/design/SCREEN-PATHS-20nov.md` |
| 4 Accessibility and font errors | `docs/design/A11Y-AND-TYPE-AUDIT-20nov.md` |
| 5 Tokens and components | `docs/design/DESIGN-SYSTEM-DELTA-20nov.md` |

ASCII only. No em or en dashes, curly quotes, ellipsis characters or emoji. The child is `{child}`.

## 0. What I read, what I could not, and one correction to the ask

Status tags as in `IA-FINAL-20nov.md` section 0 (BUILT, DESIGNED, PROPOSED, DARK, UNVERIFIED). Two more: `FOUNDER-WORDING` (a sentence the founder must give or approve) and `CONTENT-NEEDED` (a key `content` must write; no sentence is drafted here).

Read this session, in full or in the parts named:

- `docs/product/prd/18-errata-after-lock.md` rows E75 to E82 on the #1033 head, and E83 from `develop` at `55574906` (E83 is not on the #1033 head: it landed in #1051 after it).
- `docs/product/prd/22-final-holistic-spec.md` headings and section 7; cards 19 and 21 by search for the terms this task needs (consent, primer, Browse, ticked, region), not end to end. Cards 00 to 18, 20, 26 and 27: headings and search hits only. `GAP-LOG.md`: search hits only. I did not read every card line by line; a delta that hides in a card row I did not open would be missing here. Say so before relying on "no change" rows marked (card not read in full).
- The permissions and disclosure matrix at `75257f4c` (PR #1054) and the events and festivals file at `9eaccdae` (PR #1055, headings and rules sections 0 and 3 plus the data shape).
- Analytics: `apps/mobile/src/components/consent/analytics-consent-sheet.tsx`, `lib/analytics/ask-sequencer.logic.ts`, `app/settings/privacy.tsx` (search hits), and the `analyticsConsent` and `settings.privacy` strings, all on `develop` at `55574906`.
- Copy keys named below were read in `packages/content/src` on `develop` at `55574906` (`strings.en.ts`, `features/auth.en.ts`, `features/reminders.en.ts`, `permissions.en.ts`, `emails/auth.en.ts`).

Could not read or verify:

- **#1054 and #1055 are open and not merged.** The ask calls #1054 "merged". It is open, state `open`, merged `false`, head `75257f4c`; #1055 is open at `9eaccdae`. Everything built on them below is PROPOSED.
- `docs/analytics/instrumentation/`: it does not exist on the #1033 head. On `develop` it holds `00-event-standard.md`, `analytics.md`, `data-steward.md`, `decision-science.md`; I listed the folder and did not read those four. The consent-timing facts come from the built code, not from them. The product-side instrumentation requirements (`docs/product/instrumentation/02`, `04`, `05`, `README`; PRs #1038, #1043, #1039) were not read; I rely on their titles only.
- The Project doc named in earlier tasks (no Projects tool here). The Figma files (none are named in the repo for these screens).
- No screen was seen on a device or simulator. No VoiceOver run. No Dynamic Type run on a phone. Text widths in the audit file are advance widths I measured with `opentype.js` on the bundled faces; they are not renders.
- ADRs 0029 to 0035 (#1029), CR-71 (#1018) and the data and security council amendments (#1019 to #1022): titles only. No design effect found in the titles; unverified in the bodies.
- Whether `app/settings/privacy.tsx` hides the analytics row in every store profile: all five `eas.json` profiles the matrix read set `EXPO_PUBLIC_ANALYTICS` off, so today nobody sees the sheet or the row. Matrix row 12 says the founder wants it on in production. That flip is not in any file I read.

## 1. Delta table: every erratum and requirement change since #1033 was written

#1033 was written against `develop` `e68541dd3` and errata E1 to E82. It maps E36, E43, E57, E58, E62, E70, E79 and E82 to places, and names E75 to E78, E80 and E81 only in passing or not at all. This table therefore covers E75 to E83 in full, then the other changes that landed or were proposed on 20 Nov.

How to read "Touches": the screen id (area ids from `docs/design/e2e/INDEX.md`; PROPOSED ids are marked), the tab or nav item, or the component. "Change" is what the design does. "No change" always carries its reason.

### 1.1 Errata E75 to E83

| Id | What the erratum rules | Touches | What changes in the design | Status |
|---|---|---|---|---|
| E75 | No marketing, news, tip, re-engagement or Plus-offer email to an app sign-up, and no opt-in for one in the app. Welcome email once. | E-S05 email step, E-S07 consent sheet, C-S02 Account, C-S23 Privacy, Me | No change to any screen, and a guard: no screen draws a newsletter or "send me offers" checkbox or switch. The agree line stays the only box on sign-up. Nothing to add to Me. Reason: removing a choice is not drawn; a later commercial email needs its own row and the founder's yes (E75). | DESIGNED guard; add to the "never drawn" list in section 2.4 |
| E76 | No new account-security email at 1.0; no quiet-hours hold on alerts; masked new address in the old-address notice; no screen echoes a sent alert. In-app lines I5, I6 and `session_expired` stay. | Account C-S02, Me banners, email only | No new screen and no "we emailed you" banner. The only in-app line that stays is `auth.errors.session_expired` ("You were signed out. Sign in again to carry on."). Reason: the email is the record (E76 (4)). Email copy (masked address) is `content`'s. | no change, with the guard in 2.4 |
| E77 | "Sign out other devices" stays, sends no email; no sign-out-everywhere control; 5 wrong codes in 15 minutes pauses the phone and says so, no email. | C-S02 Account rows, E-S06 code screen | Account keeps its rows as built: "Sign out" and "Sign out other devices", and nothing else. E-S06 keeps its `paused` state (`auth.errors.code_paused`, "Nothing has changed. You can try a code again in 15 minutes."). What the person sees after "Sign out other devices" is not specified in any source I read: UNVERIFIED; if there is none, one quiet confirmation line is needed (CONTENT-NEEDED). | no change plus one UNVERIFIED state |
| E78 | New-device sign-in email not built for 1.0; hard gate before the backup flip; the line "We will sign that device out" not shown to a parent until a one-session lever and the stop page both exist. | `packages/emails` template, a web page, Account | Superseded in timing by E83 (next row). Design consequence kept from E78: the email copy at `emails/auth.en.ts` (`new-device-sign-in`) says "reply to this email with Not me" and "We will sign that device out". E83 replaces "reply" with a link to a confirm page. That copy is therefore stale in two places. CONTENT-NEEDED, and a flag to `content` (section 4). | CONTENT-NEEDED |
| E79 | No remote push in 1.0. No APNs key, no token table. Where a row seems to want one it is an in-app line on next open, a local reminder inside NS-32's budget, or an email. | Notification primer, Reminders D-S06, every "hear when" idea | No change to screens. Design rule added: no primer, setting or line says "push". The notification primer says what is true: local reminders on this phone. Reason: the permission asked for is local notifications only (matrix row 2). | no change plus a wording rule |
| E80 | The taught-names dictionary stays on the phone and is never synced or exported by the server; a new phone starts with it empty. | `/settings/your-words`, C-S10 to C-S12 "Opening your book", C-S08 "Where your letters live" | New state: Your words on a new phone is empty (not an error, no count, no "you lost"). Where your letters live should say the dictionary is on this phone only. Neither sentence exists: CONTENT-NEEDED. See paths PATH-12 in `SCREEN-PATHS-20nov.md`. | CONTENT-NEEDED |
| E81 | Alert emails: first 5 an hour singly, rest folded, 20 a day; none built at 1.0; a parent is told nothing about the limit. | none | No change. Reason: no sender exists at 1.0 and no parent-facing line is allowed. | no change |
| E82 | With names off (default) or App lock on, no lock-screen title or body carries a month number, an age, a count of months or years, or "A year of letters."; the neutral body `days.lock.body.neutral` is reused. | D-S06 Reminders "How it will look" preview, D-S10 lock-screen specimens, D-S26, D-S11 | Change: the preview and the specimens must show the neutral body whenever names are off or App lock is on, and the birthday specimen must not show "A year of letters." with names off. With App lock on the names switch is disabled and its help reads as built (`reminderCopy.settings.namesHelpOff`). #1033 section 10 records the rule; the specimens in D-S26 are a design artefact I have not re-drawn here (no image tool in this run): open item OI-S2. | DESIGNED rule; specimens UNVERIFIED |
| E83 | The new-device sign-in email is built, tested and read by `security-architect` before the first family outside the founder's own signs in. Email only; no push; no action link. The "Not you?" link opens a confirm page that signs that session out only when the parent presses its button. Fires once for a session on a device not used before, never the first device, never from the client. Carries the in-app path (Me, Account, Sign out other devices) and tells the parent to secure their email account. | New web page (PROPOSED id `E-S34`), the email, Me > Account | New screen: the confirm page, with its states. Spec in `SCREEN-PATHS-20nov.md` PATH-08. Words are all CONTENT-NEEDED. Must be built in `apps/web` (not there yet, E78). A page opened by a mail scanner changes nothing: the first view is read-only and the button does the work. | NEW, PROPOSED |

### 1.2 Other changes since the IA was written

| Source | What it changes | Touches | What changes in the design | Status |
|---|---|---|---|---|
| Founder ask 20 Nov, analytics ships in production, opt-in (#1054 row 12, built sheet) | The analytics consent sheet and its Settings row become a surface a parent can meet. #1033 section 10 lists "Analytics ask: none own". | New id `E-S33` (PROPOSED) for the sheet; C-S23 Privacy row; tab roots | The sheet and the row get ids, states and a no-dark-pattern checklist. See 2.2 and PATH-05, PATH-06. Today both exist in code and are off in every profile. | BUILT in code, dark by flag |
| #1054 matrix section 3 gap 4: sign-up names the documents but no list of what the app touches | Terms and Privacy acceptance at sign-up gets one plain device-access line | E-S02 footer, E-S07 `terms` step (and the Welcome sheet, which share `agreeLine`) | Add one line under the agree line. Words are the founder's: FOUNDER-WORDING. Source for the founder to start from: the proposed sentence in matrix section 5 for ToS 3.5, which is itself `counsel-must-confirm`. Not a new checkbox: the existing agree line stays the one act. PATH-01. | PROPOSED |
| #1054 matrix rows 1 to 3 | Permission primers: microphone (built), notifications (switch goes straight to iOS; the page footer is the primer), Face ID (primer UNVERIFIED) | A-S04.primer, D-S06, E-S22 | Standard iOS popups only, after one short line of our own. No custom lookalike dialog. Microphone primer is built (`listen.primer.*`). Notifications: the Reminders footer plus the D-S04 card; no extra step. Face ID: one line before the switch turns the lock on is needed; CONTENT-NEEDED. PATH-02 to PATH-04. | PROPOSED for Face ID |
| #1054 matrix row 4 | Photos: system picker, no permission, no popup | A-S03, A-S01 | No primer and no popup. The picker is Apple's. No screen of ours asks for photo access, and `docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md`'s "Photos access" sheet (A-S18, C-S27) stays out of Build 13 with NS-51. The founder decision in matrix section 4 (keep the picker) is the design's assumption. DARK in Build 13 with NS-01. | no change; assumption stated |
| #1054 matrix rows 5 to 7 | Camera, location, contacts: never asked | none | No screen. Reason: the code tests forbid them. Design rule: no picture or invite screen may ask for contacts, location or camera. | no change |
| #1055 events and festivals (PROPOSED) | Heritage-month layer and a regional layer; a ten-year date plan; per-day landing lines (`days.landing.<id>.<n>`); Browse stays "ticked days only, no stored religion or region" (Q-FD-5, NS-47-R2). | C-S24 Days, C-S25 Browse days, C-S26 Day detail, A-S01 day slip | Browse days: ticked days only are stored; tradition and country are in-memory filters inside the one sheet, forgotten on close. New: a heritage-months group (position not ruled: OI-S3). Regional days and a place picker do not ship in the first drop (file section 0, point 4). No screen draws "your religion". PATH-10. | PROPOSED |
| NS-48 phase 1 code (#1032) | Notification catalogue keys re-keyed with a day-part filter | none | No screen. Reason: words only (#1033 section 10). | no change |
| Readiness mobile brief B5 (#1025: backup file exclusion, erase, Keychain token, gate) | Erase and the invite token | `/settings/erase` C-S19 | Not read beyond the title. If Erase's text changes, C-S19's states need a re-read: UNVERIFIED. | UNVERIFIED |
| Instrumentation requirements and the analytics standard (#1034 to #1043, #1036, #1037) | Events, classes, retention, a consent and deletion standard | none directly | No screen of their own appears in the titles. The consent sheet's Records and Decline lines belong to `analytics` and `privacy`; the design only shows what the parent sees. | UNVERIFIED (not read) |
| E43, E57, E58, E36 and the earlier set in #1033 | Already mapped in #1033 | | See `IA-FINAL-20nov.md`. Not repeated. | no change |

## 2. Information architecture and navigation: what moves, what is added

Everything in `IA-FINAL-20nov.md` section 3 (the tree), section 4 (the three tabs) and section 7 (Me) stands. The additions and moves are below. Three tabs, Home, Book, Me, in every build: unchanged (ruling 32).

### 2.1 Tabs and entry points that did not move

Home, Book, Me. Capture starts only from Home. A new row never becomes a tab, a strip on Home or a "coming soon" line.

### 2.2 Settings placement: where each consent and setting lives

| Setting or consent | Lives in | Path from the tab bar | Taps | Default | Turn off |
|---|---|---|---|---|---|
| Analytics (share usage) | Me > Privacy, row "Share usage and crash reports" (`settings.privacy.analyticsLabel`), a switch | Me, Privacy, the row | 2 to reach, 1 to turn off | Off. Nothing is sent until the person says yes (`consent.ts` states `unknown`, `granted`, `denied`; read in matrix row 12). | One tap on the switch; takes effect at once (`settings.privacy.analyticsOffNote`). No confirm sheet. |
| Analytics ask (the sheet) | `E-S33` PROPOSED, a sheet over a tab root, third ask, a later session after the first letter, at most twice if left unanswered | not a place a parent goes to | n/a | n/a | "Don't share" or Close |
| Microphone | iOS popup after our primer (`listen.primer.*`), on the first Speak | Home > Speak | 1 | iOS asks once | iPhone Settings; our denied screen links there (`errors.micDenied.settingsButton`) |
| Notifications | The Reminders switch goes straight to the iOS alert (CDesO-3); the page footer (`reminderCopy.priming.*`) is on screen first; the D-S04 card after the first letter | Me > Reminders, or the Book card | 1 | Off | Switch off, or iPhone Settings |
| Face ID | iOS popup the first time App lock is turned on; one line of ours before it (CONTENT-NEEDED) | Me > App lock | 1 | Lock off | Switch off; passcode fallback |
| Photos | Apple's picker, no permission | Home > Start from a photo (dark in Build 13) | 1 | n/a | Cancel the picker |
| Terms and Privacy | Acceptance at sign-up (E-S02 footer, E-S07), re-readable in Me > Help and legal > Legal and Me > Privacy | first run; Me | | Unticked on the age screen; the agree line at sign-in | Not now keeps the book on this phone (E-S07 `declined`) |
| New-device sign-in email | No setting. Not a switch: a security notice, not marketing. | email only | | on | none (E83) |
| Marketing email | none exists (E75) | none | | | |

Where analytics belongs if the regroup (#1033 7.3) ships: "On this phone" (App lock, Privacy). Privacy keeps the row either way. No second analytics row anywhere else.

### 2.3 Navigation map: additions to the #1033 tree

```
Before the tabs
  Age question and stop                E-S03
  Welcome (sign-in sheet)              E-S02   footer: agree line + DEVICE-ACCESS LINE (new, FOUNDER-WORDING)
  Sign in: email, code, verify         E-S05, E-S06   code expired / paused states (PATH-07)
  Agreements and consent               E-S07   terms step carries the same two lines; Not now keeps it local

Home (Say)
  Speak -> mic primer (A-S04.primer, built) -> iOS microphone popup (E-S29) -> Listen
  Capture problems: A-S04.denied, .busy, .full  (built keys)

Book (Read)       unchanged

Me (Look after)
  Reminders  (D-S06)    switch -> iOS notification popup (D-S05); preview shows neutral lock text (E82)
  Days       (C-S24)    Browse days (C-S25): ticked days only; filters in memory; heritage group (PROPOSED)
  App lock   (E-S22)    switch -> iOS Face ID popup, with one line first (CONTENT-NEEDED)
  Privacy    (C-S23)    "Share usage and crash reports" switch (built); "Sync across your phones" row
  Account    (C-S02)    Sign out, Sign out other devices. No sign-out-everywhere (E77). No echo of alerts (E76).
  Your words (/settings/your-words)   empty on a new phone (E80)

Sheets over a tab root
  Analytics ask   E-S33 (PROPOSED)    only on a calm surface (tab roots), never over capture, Review, Write, sign-in

Outside the app (web)
  Confirm page for "Not you?"          E-S34 (PROPOSED)    reached only from the new-device email (E83)
```

### 2.4 Never drawn (guards, so nobody adds them by habit)

1. A marketing or newsletter opt-in, in sign-up or in Me (E75).
2. A sign-out-everywhere control, an alert-sent banner or "we emailed you" line (E76, E77).
3. A push-notification setting or the word "push" (E79).
4. A custom dialog that looks like an iOS permission alert, or any "Allow" button of ours that is not Continue on a primer (matrix intent: the standard popup).
5. A photo-library permission ask while the picker is the decision (matrix section 4).
6. A religion or country question outside Browse days, and the words "your religion" or "your tradition" anywhere (NS-46-R38, NS-47).
7. A count of days ticked, of reminders off or of letters missed (voice rule, NS-46-R19).

### 2.5 Entry points added or changed

| Doorway | Opens | Note |
|---|---|---|
| The analytics ask (E-S33) | Sheet over the current tab root | Not a doorway: it opens by rule (consent due, calm surface). Closing it is not a no. |
| "Not you?" link in the new-device email | Web confirm page (E-S34) | A link in an email is the only way in. Opening it changes nothing. |
| Notification tap for a ticked day | Home, day slip (A-S01.dayToday) | As #1033 section 8; unchanged. |
| Sign-in link (email) | `/sign-in/verify` | As built. Expired link state PATH-07. |

## 3. Tab, row and component moves, summarised

| Item | From | To | Why |
|---|---|---|---|
| Analytics row | "none own" (#1033 section 10) | Me > Privacy, id C-S23.analytics | Founder ask: one tap off, in Settings. It is already built there. |
| Analytics ask | none | `E-S33` PROPOSED | Needs states and a11y rows like any other consent. |
| Device-access line | not drawn | E-S02 footer and E-S07 terms step | Matrix gap 4. |
| New-device confirm page | not drawn | `E-S34` PROPOSED (web) | E83. |
| Face ID line | not drawn | before E-S22 switch turns on | Matrix row 3. |
| Heritage-month group | not drawn | Browse days, group order open | #1055. |

## 4. Flags for other owners (not decided here)

1. **`content` and `analytics`, copy conflict.** `analyticsConsent.body` says "when something crashes" and the Privacy row says "crash reports". Matrix row 13 says no crash data is collected by us, the policy says no crash reports, and no crash SDK was found in `apps/mobile/package.json` (grep returned nothing; UNVERIFIED). One of them is wrong. A consent sentence that over-promises or under-promises what is collected is a legal problem, not a style one. Do not turn analytics on in production until the words match what is sent.
2. **`content` and `security-architect`, stale email.** `emails/auth.en.ts` `new-device-sign-in` says "reply to this email with Not me" and "We will sign that device out". E83 says a link to a confirm page and no action link, and E78 says the sign-out line is not shown until the lever and the page exist. The template also has no link field and no "secure your email account" line.
3. **`legal` (founder merges), device-access line source.** The only worded candidate is the proposed ToS 3.5 sentence in #1054 (counsel-must-confirm). The line on screen should be the same promise in fewer words, and must not say more than the Terms.
4. **`mobile`, hide-by-flag.** With `EXPO_PUBLIC_ANALYTICS` off, the ask and the row must both be absent. The Privacy footer words ("Each consent is visible and changeable here", `settings.privacy` comment) must not point at a row that is not there. I did not verify this in code.

## 5. Open items

| Id | Item | Owner |
|---|---|---|
| OI-S1 | Device-access line wording | founder (FOUNDER-WORDING), counsel read |
| OI-S2 | Re-draw the D-S26 lock-screen specimens and the D-S06 preview for E82 (names off: neutral body, no age) | `design-systems`, `content` |
| OI-S3 | Where a heritage-months group sits in Browse (NS-46-R20 fixes seasonal, family, civic, then traditions; #1055 proposes the layer, no card rules its place) | `product`, `design-systems` |
| OI-S4 | `E-S33` and `E-S34` ids: confirm in `docs/design/e2e/INDEX.md` (I did not edit that file; it is not in this PR's scope) | `design-systems` |
| OI-S5 | Face ID line: does the lock ask for Face ID only on turn-on, and what does the app do when Face ID is later turned off for the app in iPhone Settings? Not in any source read: UNVERIFIED | `mobile` |
| OI-S6 | What the person sees after "Sign out other devices" | `product`, `content` |
| OI-S7 | Copy mismatch on crash data (flag 1) | `analytics`, `content`, `legal` |
| OI-S8 | #1054 and #1055 are open: every row built on them is PROPOSED until merged | Karma |

Signed: `design-systems`, 20 Nov 2026.
