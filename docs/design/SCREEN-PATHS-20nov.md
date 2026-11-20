# Screen paths: happy and unhappy, for every new or changed screen

Status: DRAFT for Karma, 20 Nov 2026 (UTC). Author: `design-systems`. Docs only. Stacks on #1033. Companion to `docs/design/SPEC-SYNC-20nov.md`.

What this file is: for each screen the spec sync adds or changes, the happy path, then each unhappy path as an exact screen state with its copy key. It writes no final copy. A key that exists is named as it is in `packages/content/src` on `develop` `55574906`. Anything else is marked:

- `FOUNDER-WORDING`: a sentence the founder gives or approves (a promise, a legal act, a safety claim).
- `CONTENT-NEEDED`: `content` writes it; no sentence is drafted here.
- `UNVERIFIED`: I could not confirm the behaviour in code or a card.

Nothing here was run on a device. States are what the design requires; BUILT means a file on `develop` already does it (said where I read it).

## 0. Rules every path follows

Voice (`CLAUDE.md`, `packages/content/VOICE.md`): no fear, guilt or loss language; nothing is "missed" or "behind"; no streaks, points, badges or counts of gaps; nothing says or implies the app writes a person's words. Errors say what happened and what did not change, in that order for service faults (`auth.errors.*` comment, S52). Titles carry no full stop.

State treatments, so each path names one and does not redraw it (components in `DESIGN-SYSTEM-DELTA-20nov.md`):

| Code | Treatment | Used when |
|---|---|---|
| ST-FULL | `StateScreen`: picture, title (`title2`), one sentence, one 56 pt full-width primary pinned at the bottom, at most quiet 44 pt options beneath. Never red, no spinner, no count. | the whole screen is the state |
| ST-INLINE | `InlineState` (calm card for one region) | one region fails, the rest works |
| ST-NOTICE | `Notice` (new, PROPOSED): inline banner under a header or above a form. Icon plus words plus an optional quiet action. Colour never the only signal. | a condition the person can act on, page still usable |
| ST-TOAST | `Toast`, Undo or Close | a reversible act just happened |
| ST-SHEET | `Sheet` (form sheet): title as the first heading, content, sticky footer | a single decision |
| ST-IOS | Apple's own alert or picker | permissions and the photo picker |

Every path below also holds at Dynamic Type AX5 on an iPhone SE 3, in both themes, with Reduce Motion on and VoiceOver on. The rules for that are in `A11Y-AND-TYPE-AUDIT-20nov.md`; a path only notes a place where it differs.

The ten unhappy states the founder named, as a checklist. Where a path says "n/a" the reason is given; none is skipped silently.

| Short | State |
|---|---|
| OFF | offline |
| DEN | permission denied |
| REV | permission revoked later |
| EMP | empty |
| ERR | error |
| SLO | slow |
| EXP | sign-in code expired |
| DEC | consent declined or withdrawn |
| FUL | storage full |
| INT | interrupted capture |

## PATH-01. Sign-up: Terms, Privacy and the device-access line (E-S02 footer, E-S07 terms step)

Changed. Owner of the words: founder (promise to a user), legal confirms, founder merges legal text (D-125).

**Shown** (by key). The agree line, as built: `authCopy.sheet.agreeLine` and `authCopy.consent.terms.agreeLine`, one string typed once: "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." with the two versioned links `consent.terms.termsLink`, `consent.terms.privacyLink`. New: one device-access line directly below it, FOUNDER-WORDING, key CONTENT-NEEDED (suggest `consent.deviceAccessLine`; not created here). The #1054 proposal for ToS 3.5 is the only drafted source and it is itself `counsel-must-confirm`; the on-screen line must promise no more than that and say it in plain words: what the app may ask the phone for (microphone, notifications, Face ID), that each is the iPhone's own question, that pictures are added one at a time with Apple's picker.

**Records** (written by `mobile` and `sync`, reviewed by `privacy`): a `terms` act per PRIV-R21 (document, version, action, method, surface, times, app version and build, OS major version, platform, language, hash of the words shown). The hash covers the agree line and the device-access line together, so a change to either is a new version. Whether the server row already hashes the full shown text is UNVERIFIED (#1054 section 6).

**Never:** a precheck, a hidden box, a second box for marketing (E75), device-access consent bundled as if it replaced the iOS popups. The line is a notice, not a grant: the grant is each iOS popup.

**Decline and withdraw:** Not now (`consent.terms.notNow`) keeps the book on this phone (E-S07 `declined`, then C-S11's held screen). Export and Erase still work (PRIV-R09). Withdrawing later is Me > Privacy for the sync row and Me > Account for sign-out; the Terms themselves are ended by Delete account.

Happy path: Welcome shows the buttons with the agree line and the device-access line above them at every size (E-S02 footer rule, `PRD 19`). Tap a sign-in method, finish sign-in, E-S07 `terms` step shows the same two lines once, "Agree and continue", the book opens.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Welcome stays as drawn; the buttons that need a connection answer with E-S14 `offline` (ST-FULL). The two lines stay on screen. | `authCopy.offline.title`, `.body` (built: "Sign-in needs a connection.", "Connect to the internet, then tap Try again.") |
| DEN | n/a at this step: no iOS permission is asked here. The device-access line says each is asked later, at the moment it is needed. | CONTENT-NEEDED (in the line) |
| REV | n/a: accepting is not revoked by iPhone Settings. Withdrawal is PATH-06 and Account. | n/a |
| EMP | n/a | n/a |
| ERR | E-S07 `error-consent_unavailable`: ST-NOTICE above the button, "Try again" primary, the lines stay | `authCopy.errors.consent_unavailable` ("Setting up your account did not finish. Try again.") |
| SLO | E-S07 `loading`: "Setting up your account" with the breathing drawing off under Reduce Motion; no primary action; quiet "Not now" stays | `authCopy.consent.settingUp`, `consent.terms.notNow` |
| EXP | A sign-in link or code that ran out is PATH-07, before this step | see PATH-07 |
| DEC | Not now: E-S07 `declined` goes to C-S11's held screen; local-only start offered. No error colour. | `authCopy.outage.startLocal` family for the local start, `consent.noBook.*` for the held screen (built) |
| FUL | n/a | n/a |
| INT | App killed mid-flow: relaunch returns to the consent sheet (`PRD 19` row 33); typed child details are lost (under 60 s of typing, `PRD 19` row 260) | none new |

Layout at AX5: the two lines are body text in the footer block, scrolling with the buttons; the primary does not pin over them. Links are 44 pt tall rows; the link text is the whole target and its VoiceOver name is the visible name, "link".

## PATH-02. Microphone: primer, iOS popup, denied, revoked (A-S04, E-S29)

BUILT in `app/listen.tsx` (read by the sources named in `PRD 19:332`, not re-read here). No visual change. Listed because the founder ask covers every primer.

Happy: first tap on Speak, our one note (`listen.primer.title`, `.body`, `.continueButton`), then iOS's microphone alert with the purpose string `permissions.microphone` (counsel-read, pending), then Listen at Ready. The primer shows once, while iOS has not asked. Continue is the only path to the iOS popup (NS-39-R10). A "Type instead" quiet option sits under Continue (`errors.micDenied.typeButton`).

**Shown / Records / Never / Decline.** Shown: the primer plus the iOS alert. Records: permission state only, no consent row (`PRD 19:906`). Never: audio before the person presses Start recording; no recording on a doorway (`PRD 12` C-10). Decline: the person types (`errors.micDenied.typeButton`); export and delete work.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Listen works offline; the take is kept on this phone. A quiet line only if a feature needs a connection (it does not). | `errors.offline` ("You're offline", "Keep talking. Everything is saved on this phone.") |
| DEN | iOS answered No. ST-FULL "The microphone is off": primary "Type instead", quiet "Open Settings" (deep link). A picture pending stays pending (GAP-LOG A G-15). | `errors.micDenied.title`, `.body`, `.typeButton`, `.settingsButton` |
| REV | Same screen as DEN, reached on the next Speak after the person turned it off in iPhone Settings. The app reads the state at tap, never assumes the earlier yes. | same keys |
| EMP | n/a | n/a |
| ERR | Microphone held by a call or another app: ST-FULL; Try again and Type instead. | `errors.micBusy.title`, `.body`; `common.tryAgainButton` |
| SLO | Recorder takes more than a moment to start: the Start button shows pressed, the lamp stays still, VoiceOver says nothing into a take (SR-C-02). | none |
| EXP | n/a | n/a |
| DEC | Closing the primer without Continue writes nothing and shows no error; Speak shows the primer again next time. | none |
| FUL | ST-FULL "This phone is full": Try again and Type instead. | `errors.phoneFull.title`, `.body` |
| INT | A call, an alarm or a route change stops the take: what was recorded is kept and joins the waiting set (Home slip rank 1). | `Waiting to be kept.` family (built, `A WORDS:62-66`) |

## PATH-03. Notifications: card, Reminders switch, iOS popup, denied, revoked (D-S04, D-S05, D-S06)

BUILT in part. Since CDesO-3 the Reminders switch goes straight to the iOS alert, and the footer (`reminderCopy.priming.privacyLine`, `.quietLine`) is on screen before the switch is turned on. The D-S04 card is shown once after the first kept letter, at most twice (cap in `IA-FINAL` section 5.2). The matrix could not find a primer string (row 2); the footer is the primer. That is the design: one line of ours, then Apple's popup, no more.

Happy: Me > Reminders, read the footer, turn the switch on, iOS asks, Allow, the toast "Reminders are on." (`reminderCopy.settings.onToast`).

**Never:** the word "push" (E79); a badge or sound (the request is alert only, matrix row 2); asking again after No in the same session.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Reminders are local; the page works offline. The "How it will look" preview works offline. | none |
| DEN | iOS said No. The switch snaps back to Off and a ST-NOTICE sits above it. | `reminderCopy.settings.deniedTitle` ("Notifications are off"), `.deniedBody`, `.openSettingsButton` |
| REV | The person turned notifications off in iPhone Settings. On next focus of the page the switch reads Off and the same ST-NOTICE shows. Pending local reminders are not scheduled (matrix row 2: "Reminders are not scheduled; app works"). A return from Settings with permission on shows `onToast` (S34). | same keys |
| EMP | n/a. Nothing is "missing" when reminders are off. | n/a |
| ERR | Scheduling failed: ST-NOTICE with Try again; the switch stays where the person put it. | `errors.generic` (built); a Reminders-specific line is CONTENT-NEEDED |
| SLO | n/a (local) | n/a |
| EXP | n/a | n/a |
| DEC | "No reminders" on the D-S04 card writes the choice and shows the line above the tab bar (`ReminderPrimeAsk`, inside the tabs `ToastHost`). The card does not return after the second showing. | built |
| FUL | n/a | n/a |
| INT | n/a | n/a |

Names switch: with App lock on it is disabled and its help is `reminderCopy.settings.namesHelpOff`. See PATH-13 for the preview.

## PATH-04. Face ID: App lock (E-S22)

BUILT: `/settings/app-lock`, plugin string `permissions.faceId` ("{app} uses Face ID to open your book and confirm it is you."). The primer is UNVERIFIED (#1054 row 3). This path adds one line.

Happy: Me > App lock, a short line of ours above the switch (CONTENT-NEEDED, key suggestion `appLock.faceIdLine`), switch on, iOS asks for Face ID, Allow, the lock is on, the names switch locks to off with its help line. Face ID stays in iOS: the app receives a yes or no, no template (PP 2, matrix row 3).

**Shown / Records / Never / Decline.** Shown: our line, then Apple's alert. Records: permission state only; the lock setting is stored on the phone. Never: any biometric data, a voiceprint, a face template. Decline: the passcode opens the book (UNVERIFIED in code: matrix row 3); the lock may stay off.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | n/a (local) | n/a |
| DEN | iOS said No to Face ID. The lock offers the iPhone passcode, or stays off. The switch reads what is true. | CONTENT-NEEDED |
| REV | Face ID later turned off for the app in iPhone Settings: the unlock screen offers the passcode (iOS does this itself); the page shows what the lock uses now. Not in any source read: UNVERIFIED. | CONTENT-NEEDED |
| EMP | n/a | n/a |
| ERR | Face ID did not read: iOS's own retry then passcode; our unlock screen adds nothing that blocks. | none |
| SLO | n/a | n/a |
| EXP | n/a | n/a |
| DEC | Switch left Off: nothing changes. | none |
| FUL | n/a | n/a |
| INT | Leaving mid-capture with the lock on: the cover shows over the app (E-S22 cover); the take is kept (PATH-11). | built |

## PATH-05. Analytics ask: the consent sheet (E-S33, PROPOSED id)

BUILT in `components/consent/analytics-consent-sheet.tsx`, driven by `lib/analytics/ask-sequencer.logic.ts`. Off in every `eas.json` profile read, so no parent has seen it. The founder now wants analytics on in production, opt-in.

Happy: the person has kept their first letter; in a later session, on a tab root, a sheet opens: title, one sentence, one detail line, two buttons of the same weight and size side by side ("Don't share" and "Share usage"), and a footer saying where to change it. They tap one. The sheet closes. The choice is final until they change it in Me > Privacy.

**Shown:** `analyticsConsent.title` ("Help us make it better?"), `.body`, `.detail`, `.noButton`, `.yesButton`, `.changeLater` ("You can change this any time in Settings, Privacy."), all built.

**Records:** a local consent value (`unknown`, `granted`, `denied`, `packages/analytics/src/consent.ts`, matrix row 12). Whether a server-side act is also written under PRIV-R21: UNVERIFIED (not read). Nothing is sent or queued until `granted`.

**Never:** letters, recordings, photos, names (the sheet's own promise); no tracking prompt (no ATT, matrix row 12); no collection before a yes; no change to Plus or any feature on a No.

**Decline and withdraw:** "Don't share" ends the asking for good. Closing without choosing is not a no and not a yes: the offer is counted, and it may come back once in a later session (at most two unanswered showings, `MAX_ANALYTICS_CONSENT_OFFERS`, read in the sequencer comment). Withdraw: PATH-06. Export and deletion are untouched.

No dark pattern, as a checklist the review reads against (what I confirmed in the built file is marked):

| Rule | Design requirement | Confirmed in `analytics-consent-sheet.tsx` |
|---|---|---|
| Equal weight | Same component, variant, size and 44 pt target; neither is a filled primary | yes: both `Button variant="outline"`, `flex-1` |
| Nothing preselected | No default focus ring on Yes; focus lands on the title | title yes (Sheet owns focus); no preselect: yes |
| Order | Neither option is placed to be hit by habit; "no" is first and left | yes: no is first |
| Words | Plain verbs that say the result: "Share usage", "Don't share". No "Maybe later" for a no. | yes |
| No guilt | The sheet never says what is lost, what the team needs, or that no is a worse app | yes in `body` and `detail` (read) |
| Not an interruption | Only on a tab root, never over capture, Review, Write, sign-in, a letter or a sheet | yes: `isCalmSurface` |
| Frequency | At most twice if unanswered; never after a yes or a no | yes: `askAgainLater` |
| Reversible in one tap | PATH-06 | see PATH-06 |
| Haptic | `tap` only; no success haptic on a yes | `haptic('tap')` yes |

| State | Exact screen | Copy key |
|---|---|---|
| OFF | The choice is local and needs no connection. Offline never delays or blocks it. | none |
| DEN | n/a: there is no iOS popup for analytics. | n/a |
| REV | n/a (not a system permission) | n/a |
| EMP | n/a | n/a |
| ERR | Saving the choice failed: the sheet stays, buttons re-enable (`busy` clears in `finally`), nothing is sent. No error text is built. If the write cannot be saved, treat as `unknown`: nothing sent. A line is CONTENT-NEEDED if the founder wants one. | CONTENT-NEEDED |
| SLO | After a tap both buttons are disabled for the write (`busy`); the sheet closes on completion. | none |
| EXP | n/a | n/a |
| DEC | "Don't share": sheet closes, no toast, no follow-up. Withdrawn later: PATH-06. | none |
| FUL | n/a | n/a |
| INT | App killed with the sheet open: counted as an unanswered offer; returns in a later session at most once more. | none |

AX5 on SE 3: the buttons stack (built: `useIsLargeText`, xxxLarge and above); the body at AX5 is about 15 lines (measured, audit file section 2) and scrolls inside the sheet; the title wraps on 2 lines at its cap. The sheet must scroll with both buttons reachable without scrolling past the body: pin the buttons in a sticky footer at AX1 and above (a change for `mobile`).

## PATH-06. Analytics setting: Me > Privacy row (C-S23.analytics)

BUILT in `app/settings/privacy.tsx` behind `capabilities.analytics`: a `ListSection` titled `consentCopy.analyticsSection`, a `ToggleRow` "Share usage and crash reports" with help and a footer.

Happy: Me, Privacy, the switch reads Off. Turn On: the choice is saved (`grantAnalytics('settings')`). Turn Off, one tap: sharing stops at once (`withdrawAnalytics()`), no confirm sheet, no "are you sure". The footer says so: `settings.privacy.analyticsOffNote` ("Turning this off stops sharing right away. Nothing else changes.").

**Shown:** `settings.privacy.analyticsLabel`, `.analyticsHelp`, `.analyticsOffNote`. **Records:** local consent value. **Never:** a discouraging line on turning off; a delay. **Decline and withdraw:** this row is the withdrawal. Export, deletion and every feature are unaffected.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Works offline: the choice is local. | none |
| DEN | n/a | n/a |
| REV | n/a | n/a |
| EMP | Never asked yet: the switch reads Off, same as a No. No "you have not chosen" line. | none |
| ERR | A save that fails leaves the switch where it was and says one calm line. The built `setAnalytics` toggles a `busy` flag; the failure line is not built: CONTENT-NEEDED. | CONTENT-NEEDED |
| SLO | The row is disabled while `busy` (built). | none |
| EXP | n/a | n/a |
| DEC | Off is a decision, not a gap: no badge, no nudge, no counter. | none |
| FUL | n/a | n/a |
| INT | n/a | n/a |

Flag: the label and the sheet say "crash", matrix row 13 says none is collected. See `SPEC-SYNC-20nov.md` section 4 flag 1.

Where the row is absent (the build flag is off): no row and no footer that refers to it.

## PATH-07. Sign-in code or link expired, wrong, paused (E-S06)

BUILT keys. The founder-named EXP state, plus the neighbours.

Happy: email, a code arrives, the person types it (6 to 10 digits, the field draws `code.digits` with `{n}`) or taps the link; the book opens.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | E-S14 `offline`: "Sign-in needs a connection.", Try again; the screen goes back by itself when the connection returns. | `authCopy.offline.title`, `.body`, `authCopy.outage.backOnline` (announcement) |
| DEN | n/a | n/a |
| REV | n/a | n/a |
| EMP | Field empty: Continue disabled, field label visible, nothing red. | none |
| ERR wrong | ST-NOTICE under the field, focus stays in the field, text kept | `authCopy.errors.wrong_code` |
| EXP | ST-NOTICE with "Send a new email" as the one action (a quiet 44 pt button, not a link in the sentence). Field cleared. VoiceOver reads the notice on appear (`accessibilityLiveRegion` polite). | `authCopy.errors.expired` ("That link has expired. Send a new email for a fresh one."), `authCopy.code.resend` ("Send a new email") |
| PAUSED | After 5 wrong codes in 15 minutes the field is disabled and the notice says when to try again; no email is sent (E77) | `authCopy.errors.code_paused` |
| WAIT | Send a new email before the wait is over: the button is disabled with the reason beside it, not a silent no-op | `authCopy.code.resendWait` ("You can send another in a minute.") |
| RATE | Many tries or hourly cap | `authCopy.errors.email_wait`, `.rate_limited` |
| OTHER PHONE | Link opened on a different phone | `authCopy.errors.other_phone`, `.other_phone_spent` |
| SLO | E-S06 `checking`: field and Continue disabled, the progress is announced, a quiet "Use a different email" stays | built (`checking`) |
| DEC | n/a at this screen | n/a |
| FUL, INT | App killed on the code screen: relaunch returns to Welcome or to the first unanswered step (`PRD 19` row 260); the typed code is lost | none |

Layout at AX5: the code field is `title1` at its cap 1.8 with letter spacing 6 (built, `code.tsx`); 10 digits at that size do not fit one line on an SE 3. See audit file font error FE-9.

## PATH-08. New-device sign-in: the email and its confirm page (E-S34, PROPOSED, web)

NEW (E83). The email is `packages/emails` `new-device-sign-in`; the page lives in `apps/web` and does not exist yet. Words are all CONTENT-NEEDED; the old email copy is stale (see `SPEC-SYNC-20nov.md` section 4 flag 2).

The email, as the design needs it (not worded here): says which device and when, the plain "if this was you, nothing to do", the one "Not you?" link, the in-app path (Me, Account, Sign out other devices), and one line telling the person to secure their email account, because sign-in is by emailed code and link. No button that acts, no push (E83). Fires once for a new device, never the first, never from the client.

Happy: the person opens the link on any device. The page shows first: the heading, what happened (device name and time, no address, no IP), one primary button "sign that device out" (words CONTENT-NEEDED), one quiet "This was me" that only closes. Pressing the primary signs that one session out. The page then shows the done state and the in-app path again.

**Shown:** all CONTENT-NEEDED (suggest a `newDevice.*` key group in `packages/content/src/emails` or `pages.en.ts`). **Records:** one account-security audit row for the sign-out press, no IP and no location beyond what `security-architect` rules (the device hash has no retention, class or label decision yet: E83). **Never:** an action on page load; a link that acts when a scanner opens it; any sign-in code or password field; any letter or child name on the page; any claim that the account is "hacked" or "safe" (it cannot know). **Decline:** "This was me" or closing the tab does nothing and keeps the session. No state of the page is an error colour for the person who closes it.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | The page needs a connection to press the button. If the press fails for no network: ST-NOTICE "Nothing has changed", the button stays pressable. | CONTENT-NEEDED (follow `authCopy.errors.network` pattern) |
| DEN | n/a | n/a |
| REV | n/a | n/a |
| EMP | n/a | n/a |
| ERR | The sign-out failed on the server: "Nothing has changed" first, then a second path: the in-app path (Me, Account, Sign out other devices) | CONTENT-NEEDED |
| SLO | After the press: button disabled with a polite live "Signing that device out", no spinner-only state | CONTENT-NEEDED |
| EXP | The link is too old or already used: a calm line saying so, with the same in-app path. Not an error screen. | CONTENT-NEEDED |
| ALREADY | That session is already signed out: say so, same in-app path | CONTENT-NEEDED |
| SCANNER | A mail scanner or preview opens the link: nothing changes (the first view is read-only, E83). No design state; a test requirement for `web`. | n/a |
| DEC | "This was me": a closing line and no further step. | CONTENT-NEEDED |
| FUL, INT | n/a | n/a |

Web a11y: one `h1`; the primary button is a real button; the two buttons stack at 320 px and in zoom; visible focus; no auto-focus on the primary (a stray Enter must not act); language attribute set; works with JavaScript off for the first view. UNVERIFIED: the web tokens in `apps/web` (not in this sparse checkout).

## PATH-09. Photo picker (A-S03), no permission

DARK in Build 13 with NS-01 (`EXPO_PUBLIC_PHOTOS`). The design for when it ships.

Happy: Home, "Start from a photo" (quiet), Apple's picker opens, the person picks one picture, our capture opens with it pending.

No primer, no popup, no settings row: Apple's picker sees only what the person picks (matrix row 4). The sign-up device-access line (PATH-01) mentions it.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | A picture in iCloud that is not on the phone cannot load offline: ST-NOTICE "that picture could not be loaded" with Try again and "Choose another" | CONTENT-NEEDED |
| DEN | n/a: no permission exists | n/a |
| REV | n/a | n/a |
| EMP | n/a | n/a |
| ERR | Picker returns an unreadable file: same notice | CONTENT-NEEDED |
| SLO | Large picture: the picture slot shows a still placeholder and "Getting your picture" in text, no spinner-only | CONTENT-NEEDED |
| DEC | Cancel: back to Home, nothing written | none |
| FUL | Phone full while saving the re-encoded picture: `errors.phoneFull` pattern, the letter is not lost | `errors.phoneFull.*` |
| INT | Killed after picking, before saving: nothing is kept; no draft claims a picture | none |

## PATH-10. Days: Browse days with ticked days only (C-S24, C-S25, C-S26)

PROPOSED (`EXPO_PUBLIC_DAYS`, Drop B or later). Built on NS-46 and NS-47. #1055 adds a heritage-months layer and a regional layer (PROPOSED, regional not in the first drop).

Happy: Me > Days, empty page with one calm line and "Browse days". The sheet opens with nothing ticked. Groups in order: seasonal and shared, family, civic, traditions (NS-46-R20). The parent ticks Thanksgiving and one more, then Done. The Days page lists them under "Days you chose" with the next date ("around" where it moves). Typed days sit under "Days you added".

Rules the screens carry: nothing pre-ticked (NS-46-R2); only ticked days are stored, as ids (NS-46-R6); the tradition and country filters are rows inside the sheet, held in memory, forgotten when the sheet closes (Q-FD-5, NS-47-R2), never a second sheet (NS-46-R41); "your religion" and "your tradition" never appear (NS-46-R38); no count, no "complete your list", no missed or missing language (NS-46-R19).

**Shown:** `days.*` keys, all PROPOSED (`C WORDS:629-644`). **Records:** the ticked ids and per-day overrides on the phone only, one store (NS-47); nothing sent about which tradition. **Never:** stored religion or region, an inferred hemisphere, a location call, any account-level copy of the ticks beyond what NS-47 rules. **Decline and withdraw:** Done with nothing ticked schedules nothing; Remove in C-S26, a swipe action and a VoiceOver custom action untick in one step; Clear all.

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Fully local; the library is bundled (NS-46 default, DAY 3.6); no offline state. | none |
| DEN | Notifications off: the Days page shows the same ST-NOTICE as PATH-03 once, above the list; ticks are kept. | `reminderCopy.settings.deniedTitle` family |
| REV | Notifications turned off later: same notice on next focus. | same |
| EMP | Days page: one calm line, no count, no gap language, "Browse days" | `days.*` PROPOSED (`IDX C-S24 .empty`) |
| ERR | Library read fails: typed days still list; the library part shows ST-INLINE "Try again" (NS-46-R40: a failed library read leaves typed days) | CONTENT-NEEDED |
| SLO | Planning a year of ticks is under 50 ms on an SE 3 (ASSUMED, not measured); nothing waits on screen. | none |
| DEC | "Not now" on the Home ask is final for Home (rank 3b) and schedules nothing | `A WORDS:471` |
| NO DATE | A ticked day with no date for next year: one calm footnote line in the row's label, no warning glyph | NS-46-R15 wording, CONTENT-NEEDED |
| GONE | A ticked id missing after an update: dropped silently, no line (NS-46-R43) | none |
| FUL | n/a | n/a |
| INT | Killed mid-Browse: each tick is already saved; the sheet reopens at the top (card 21 row) | none |

Heritage months: a new group; its position is not ruled (OI-S3). It is offered, never ticked; the group title must not name a faith; a heritage month is not a religion question. Regional days and a place picker are not drawn for the first drop.

## PATH-11. Capture: interrupted, slow, offline, full (A-S04, A-S05, A-S06, A-S07, Write)

Not new. Listed because the founder asked for interrupted capture and storage full on every changed capture entry.

| State | Exact screen | Copy key |
|---|---|---|
| INT | Call, alarm, route change or lock: the recording stops, what exists is kept, Home shows the waiting set slip (rank 1) with "Pick it up" | `Waiting to be kept.`, `Recorded before the app closed.` (built, `A WORDS:62-66`) |
| INT killed | App killed mid-take: on next open the same slip | same |
| FUL | Phone full: ST-FULL with Type instead and Try again; typed text autosaves, so a full phone fails the autosave with the quiet line `write.notSaved` ("Not saved yet") in the same place and retries on the next pause | `errors.phoneFull.*`, `write.notSaved` |
| SLO | Transcript on its way: ST-INLINE loading in Review, a way out stays | `errors.transcriptionFailed` on failure ("No words yet for this one", "The recording is kept.") |
| OFF | Everything is saved on this phone | `errors.offline` |
| ERR | Save fails: "Not saved to the book yet", "Your words are safe on this phone", Try again now | `errors.saveFailed.*` |
| 2 a.m. | One hand, dim room: Speak and Type are 64 pt at the bottom, no confirm sheet before Start, haptic `tap`, brightness follows the system, no bright flash on open in dark mode | built; verified on a phone: no |

## PATH-12. A new phone: Your words and the arrival (C-S10 to C-S12, `/settings/your-words`)

Changed by E80. The dictionary is not synced; a new phone starts with it empty.

Happy: the person signs in on a new phone, "Opening your book." (`authCopy.newPhone.loading`), the book arrives, Me > Your words shows an empty list with one calm line about teaching names (CONTENT-NEEDED). No line says something was lost. Where your letters live says the dictionary stays on this phone (CONTENT-NEEDED).

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Arrival: "No book" and offline states are built (`E WORDS:297-307`); Your words is local and works offline | `authCopy.newPhone.*` |
| DEN, REV | n/a | n/a |
| EMP | Your words: empty list, one quiet line, "Add a name" if the page has one. No count, no "0 names", no "you have not taught any". | CONTENT-NEEDED |
| ERR | The list file cannot be read: ST-INLINE, Try again, the book is unaffected | `errors.generic` |
| SLO | n/a | n/a |
| DEC | n/a | n/a |
| FUL, INT | n/a | n/a |

## PATH-13. Reminders preview and lock-screen specimens (D-S06, D-S10, D-S26), E82

Changed. Happy: Me > Reminders, "How it will look" shows the lock-screen preview. With names off (the default) or App lock on, the preview shows the neutral title and the neutral body (`days.lock.body.neutral`, PROPOSED words, not live). No age, no month number, no count of months or years, never "A year of letters." The birthday specimen shows the neutral body in that state. With names on and the lock off, the preview may show a weekday, a month number or the child's name as NS-13-R24 allows.

| State | Exact screen | Copy key |
|---|---|---|
| OFF, SLO, FUL, INT | n/a (static, local) | n/a |
| DEN / REV | Notifications off: the preview still draws, with the denied notice above it (PATH-03) | `reminderCopy.settings.deniedTitle` |
| EMP | n/a | n/a |
| ERR | n/a | n/a |
| DEC | Names left off: no line pushing them on | `reminderCopy.settings.namesHelpOff` |

Test requirement: no digit and no "year" in any lock-screen string (E82, BL-966), and NTC-T24 on a device before the row counts as done.

Signed: `design-systems`, 20 Nov 2026.
