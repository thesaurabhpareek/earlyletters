# Moments tab, T5: what happens when a nudge is tapped (PROPOSED)

Status: PROPOSED. Docs only. Branch `wip/moments-t5`. Written 21 Nov 2026 by transition lead T5.
Brief of record: `/home/claude/moments-brief.md`, including its UPDATE line (tab position open; the tab is the daily-return engine; the same moment signal should shape feed, email and push).
Nothing here is a ruling. Every reversal is marked REVERSAL and is the founder's to own.

## 1. Purpose and scope

A nudge is only as good as the first second after the tap. P5 (`wip/moments-p5`, section 7) says which nudges may exist. This doc says what the parent sees when they act on one, from every doorway outside the app: a local push, an email, a widget, a share entry.

In scope:
- Tap on a push or an email link: phone locked, app cold, app warm, signed out, wrong account on the phone, notification permission not given, photo permission not given, the thing the nudge pointed at is gone.
- Universal links and routing for email and doorways.
- How the landing screen shows the occasion that triggered the nudge without putting private content on a lock screen.
- Frequency and quiet hours when Moments adds a source.
- The unsubscribe and notification settings round trip.
- What each channel may and may not say.

Out of scope: which nudges exist and their cadence (P5 section 7); card design (the design concept, PR #1270); the permission ask itself (P3, if present); the photo read (feasibility, PR #1269).

One honest framing. The founder wants library moments to drive push and email. Three standing rulings say the server never sees the library, and a notification that exists because of a library read discloses a fact by existing. So the real answer for email and server push is "the moment cannot be the cause". What I can design well is the landing: a tap from an ordinary, content-free nudge that lands on a screen where the moment is waiting. The moment lives in the tab. The nudge only brings the parent to the door.

## 2. Inputs read

| Input | Path or id | What I took from it |
|---|---|---|
| Brief | `/home/claude/moments-brief.md` | decisions of record, UPDATE line, content rules |
| P5 | `docs/product/moments-tab/P5-rollout-metrics-and-backlog.md` on `origin/wip/moments-p5` | channel matrix (7.2), local push (7.3), email (7.4), MT-P5-R9 to R17, RV-6, RV-7 |
| Privacy read, PR #1267 | `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` on `origin/docs/privacy-moments-tab-21nov`, section 10 | email cannot use library signals; a local push may only be fixed neutral text; CQ-11 to CQ-15 |
| Feasibility, PR #1269 | `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` on `origin/docs/mobile-moments-tab-feasibility-21nov`, nudge section | local nudge planned at foreground only; payload `{ source, kind }`; push and email not from a moment |
| Notification budget | `docs/product/prd/11-foundations.md` NS-32-R1, R4, R6 to R16; `09-capture.md` NS-13-R30 | one budgeted a day, 60 pending, quiet hours 07:00 to 21:30, content keys, lock screen rules |
| Doorways | `11-foundations.md` NS-35-R1 to R7 | a doorway lands, never starts; no microphone from outside |
| Moments card | `27-photo-moments-and-media.md` NS-51-R10 to R13, R22, R24, R25, R26, Q-PM-8, Q-PM-9 | neutral nudge, no gap language, deleted source drops quietly, per account |
| Errata | `18-errata-after-lock.md` E75, E76, E79, E82 | no marketing email, no remote push in 1.0, no age on lock screen with names off |
| Email rules | `docs/emails/CATALOG.md` sections 1, 2, 5; `docs/emails/COMPLIANCE.md` sections 1 to 4 | no re-engagement, no child name in any email, one-click unsubscribe for subscription mail, never unsubscribe from transactional |
| Lock screen matrix | `docs/design/e2e/D-family-sharing-reminders/DESIGN.md` J-D14, J-D22 to J-D23, J-D66, J-D69, D-S06, D-S10 | denied state, previews, Focus, quiet or hidden book |
| Tap handler | `apps/mobile/src/lib/reminders/scheduler.ts` lines 267 to 275 | today: kind `evening` goes to `/`, any other ours goes to `/book`; a cold-start throw falls back to Tonight |
| Link gate | `apps/mobile/src/app/+native-intent.tsx` | every incoming URL passes `redirectSystemPath`; secrets stripped; capture routes go to Tonight; any throw returns `/` |
| Sign-out | `apps/mobile/src/lib/reminders/session.ts` | reminders and delivered notifications cleared on sign-out |
| Apple, associated domains | https://developer.apple.com/documentation/xcode/supporting-associated-domains.md | see section 16 |

I could not find a branch for T1 to T4 or P1 to P4 content that touches nudges, other than the three PR docs above. Where those leads decide tab position, I give the landing rule for each option (section 4).

## 3. The channels, in one table

| | Local push | Email | Remote push | Widget | Share entry |
|---|---|---|---|---|---|
| Exists today | yes (reminders, NS-13, NS-46, NS-48) | transactional only (FR-MKT-44, E75) | no (E79) | parked (C-30) | not built |
| Knows about the library | planned on the phone only, at foreground (NS-51-R11, Q-PM-8) | never | never | would read on device | would read on device |
| Source of truth | phone | server (date of birth, letters made) | server | phone | phone |
| Lock screen exposure | yes | inbox preview and sender | yes | yes (home or lock) | no |
| Lands at | Home, by rule (section 4) | web `/open`, then the app (section 6) | n/a | Home or a reading screen | Home |
| Reversal if moment-driven | yes, narrow (RV-2) | yes, and recommended against | yes, and recommended against | not proposed | not proposed |

## 4. Landing rules

### 4.1 The principle

A doorway lands and never starts (NS-35-R3, R4, R7). A tap never turns on the microphone, never opens a draft, never shows a permission prompt, never shows a count or a gap line. The parent sees one calm screen with the occasion in plain words, and the parent chooses.

The payload of a local push stays `{ source, kind }` (ADR 0030 decision 6, as quoted in the feasibility doc). It carries no library identifier, no day, no place. So the landing screen cannot learn the occasion from the notification. It learns it on the phone, at tap time, from the same on-device rules that planned the nudge.

### 4.2 Where the tap lands, by tab position

The IA lead owns tab position. My rule works for every option.

| Tab position | Evening or moment-class tap lands at | Why |
|---|---|---|
| Home default, Moments second | Home. Home shows the one occasion card first, with a way across to Moments | Today's behaviour (kind `evening` goes to `/`). No new route. Least surprise |
| Moments as centre tab | Home, same card | The nudge is one class; it must not reveal that it was moment-driven by where it lands |
| Moments default | Moments, For you section, scrolled to top | Moments is then the landing tab for everyone; no special routing |
| Moments inside Home | Home | Same screen |

Why not "a moment nudge lands on Moments and an ordinary one lands on Home"? Because the tap would then tell anyone watching over the shoulder which kind it was, and the privacy read (section 10, point 5) asks that a moment nudge be indistinguishable from the ordinary evening reminder. The decision about what to show first happens inside the screen, on the phone, after unlock.

### 4.3 The occasion on the landing screen

Given the tap lands on Home (or Moments if default), the screen shows at most one occasion card at the top. The card is chosen by the same ranked list the planner uses: typed day, birthday, month, then a library moment if the parent allowed it (NS-32-R3 with NS-51-R11). It is chosen again at tap time, not read from the notification.

- Typed day or birthday or month: the card names it in the parent's own words or our written lines, as today.
- Library moment: the card uses the in-app neutral line (for example "Some pictures from the weekend are here", NS-51-R11, content owns the exact words) and the parent's own pictures as paper content inside the app. Pictures show only after unlock.
- Nothing qualifies: the screen is the ordinary Home with the ordinary evening prompt. No empty card. No "nothing today".

### 4.4 Requirements

**MT-T5-R1.** Given any tap on our local notification, When the app opens, Then it lands on a screen named by one routing table in one file, and no payload field other than `source` and `kind` is read. Test layer: U (table), S (scan that the handler reads only those two keys).

**MT-T5-R2.** Given a tap on an `evening`-class notification, When the app has finished unlocking, Then the occasion card is chosen on the phone at that moment from the ranked list, and the notification is not the input. Test layer: U with a fake clock and a fake library.

**MT-T5-R3.** Given a moment-driven and an ordinary evening nudge, When each is tapped, Then both land on the same route. Test layer: U. (If the founder wants the moment to land on Moments, see open question Q1.)

**MT-T5-R4.** Given the landing screen after any tap, When it renders, Then there is no permission prompt, no count, no "waiting", no gap line and no streak (NS-51-R12, MT-P5-R13). Test layer: C (content rule), J.

**MT-T5-R5.** Given the landing screen after any tap, When the parent has not tapped Speak, Then the microphone is off and no draft exists (NS-35-R7). Test layer: I.

## 5. Tap states

### 5.1 Phone locked

Given the phone is locked and a notification shows, When the parent taps it, Then iOS asks for Face ID, Touch ID or passcode before our app opens. We do not control that step. Our rules begin after it.

If App lock is on, our own gate then runs (NS-51-R25: the sheet needs unlock, the switcher shows no thumbnail). The tap route is held in memory only until our gate opens, and is dropped if the gate is cancelled, the app is backgrounded again, or 5 minutes pass (the 5 minutes is a guess, see Q4).

**MT-T5-R6.** Given App lock is on and a notification is tapped, When our gate is showing, Then no occasion card, name, picture or age renders behind or under it, and the pending route is held in memory only. Test layer: J on device, U for the held route.

**MT-T5-R7.** Given the pending route is held and our gate is cancelled, When the app returns to the background, Then the pending route is cleared and the next open lands on the default screen. Test layer: U.

### 5.2 Cold start

Given the app is not running, When the parent taps a notification, Then iOS launches the app and the response is delivered to us.

Finding. Today the response listener is registered in the scheduler's start function (`scheduler.ts` line 267). The code comment says that on a cold start "the router is not mounted yet" and "the app opens on Tonight anyway". So a cold-start tap on a non-evening class (a month note, which today routes to `/book`) probably lands on Home, not the Book. I did not run it on a device (UNVERIFIED). It is harmless for the evening class, which routes to `/` anyway. It matters if Moments adds a second landing. Moments should not add a second landing, which is why section 4.2 keeps one. A fix for the existing month and birthday routing is a separate small task; the file is `scheduler.ts` and the shape is "read the last response once after the router mounts".

**MT-T5-R8.** Given a cold start from a tap, When the first frame renders, Then the first screen is the routed screen or Home, never a splash that shows a name, and the 18+ gate still comes first (`+native-intent.tsx` header). Test layer: J, I.

**MT-T5-R9.** Given a cold start from a tap on a class that routes to `/book`, When the router is not yet mounted, Then the landing is still the routed screen after mount, or this doc's fallback (Home) is the documented behaviour and a test pins it. Test layer: I. UNVERIFIED whether the fix is needed; see Q5.

### 5.3 Warm (foreground or background)

Given the app is in the background, When a notification is tapped, Then the router navigates to the routed screen on top of whatever was open, except where a capture is in progress.

**MT-T5-R10.** Given a capture or a review is open and a notification is tapped, When the app comes forward, Then the open work is not discarded, the tap does not navigate away from it, and the parent finds the occasion card on Home after saving or leaving. Test layer: I. (A tap must never lose a take; nothing from outside may close one.)

**MT-T5-R11.** Given the app is in the foreground, When a local notification arrives, Then no banner shows for a moment-class nudge (the parent is already here), and the card is simply the first card at next Home render. Test layer: U. (UNVERIFIED how the current foreground presentation handler is set; read `scheduler.ts` before building.)

### 5.4 Signed out

Given the parent signed out, When any of our notifications is tapped, Then none should exist: sign-out cancels pending reminders and dismisses delivered ones (`session.ts`). If one survives (a kill between sign-out and cleanup), the tap lands on the default signed-out screen and shows no occasion card.

Note. At 1.0 server features are off (`+native-intent.tsx` header), so "signed out" mostly means "no account", which is a normal state for a local-first book. The rule is for the later state with server features on.

**MT-T5-R12.** Given a notification survives sign-out, When it is tapped, Then no child name, age, picture or occasion renders, the stale notification is dismissed, and the screen is the signed-out default. Test layer: U, I.

### 5.5 Wrong account

Given account A planned a nudge and account B signed in on the same phone, When the nudge is tapped, Then B sees B's Home with B's own occasion, if any. Nothing of A's index, names or pictures shows (NS-51-R24: the opt-in and index are per account; B starts off).

**MT-T5-R13.** Given a notification planned under account A, When account B is signed in at tap time, Then the landing is chosen from B's state only, and the notification is dismissed. Test layer: I with two fake accounts.

**MT-T5-R14.** Given a restored or new phone, When an old notification somehow fires, Then it is treated as R12, and the photo permission and the opt-in are off and not asked again by the landing (NS-51-R23). Test layer: U.

### 5.6 Permission not given

Two permissions, kept apart.

Notification permission not given or revoked: no local push exists (nothing is scheduled, R16 of NS-13). Reaching the app then depends on the app icon. The landing and the in-app card must not be worse for that parent. No in-app nagging (D-S06.denied is the one place that says so, with Open Settings).

Photo permission not given, limited or denied: the occasion card is drawn from sources that need no library (typed day, birthday, month, our own written prompts). A library moment card appears only when the parent has allowed it, honouring Limited.

**MT-T5-R15.** Given notification permission is denied, When the parent opens Moments or Home, Then the occasion card is the same, and the only mention of notifications is the existing quiet card in Me, Reminders. Test layer: J.

**MT-T5-R16.** Given photo permission is denied or limited, When a tap lands, Then no card claims a moment the app cannot read, no card asks again (the system remembers the answer, and a repeat would be nagging, NS-51-R3, R18), and the value card shows our own examples. Test layer: I, C.

### 5.7 The thing the nudge pointed at is gone

Cases: a photo deleted after the nudge was planned; a moment that fell below the threshold; a typed day the parent removed; a book quieted or hidden after planning; a letter already made today.

Rule: the nudge was neutral, so there is nothing false to retract. The landing re-chooses at tap time. If the moment is gone, the card drops quietly (NS-51-R22) and the screen shows the next ranked source or the ordinary evening prompt. No "this photo was deleted". No error. No apology line.

**MT-T5-R17.** Given a nudge was planned for a moment and the picture is then deleted, When the parent taps the nudge, Then the landing shows the next ranked source or the ordinary evening prompt, with no message about the missing picture. Test layer: U with a fake library, J.

**MT-T5-R18.** Given a letter was made today, When a moment-class nudge would still be pending, Then it is cancelled at the next foreground replan and, if tapped anyway, the landing is plain Home with no card for the day (NS-51-R13, MT-P5-R11). Test layer: U.

**MT-T5-R19.** Given a book was quieted or hidden after planning, When its nudge is tapped, Then the landing does not name the book, shows no occasion for it, and the notification is dismissed (NS-32-R14, NS-48-R21). Test layer: U.

## 6. Email and universal links

### 6.1 What exists

Email today is transactional (E75, FR-MKT-44). The catalogue says almost nothing is sent after sign-in: no drips, no re-engagement (`CATALOG.md` section 5). The app declares `applinks:` for the brand domain and handles `/auth/callback` and `/j` through `redirectSystemPath` (`app.config.ts` line 255; `+native-intent.tsx`). A web `/open` page is listed in the function trace as a designed screen with fallbacks (`FUNCTION-TRACE.md` line 4201); I did not read that page's code (UNVERIFIED that it ships).

### 6.2 What email can know

Only what the server legitimately holds: the child's date of birth, letters made (counts of what the parent saved), account state. P5 7.1 raises a conflict: typed days are not held by the server. I agree with P5, and mark the brief's wording on "typed days" as a conflict: the brief says email can use "typed days"; if typed days stay on the phone, email cannot use them. Reconcile with the data lead (Q6).

So an email nudge could, at most, say a fixed line about the book and a date, from a closed class list. It can never say anything derived from pictures. That does not make Moments an email story. It makes email a separate, small, opt-in channel (E75's own words: a separate opt-in, off by default, one-click unsubscribe, hashed suppression, and the founder's yes).

### 6.3 Email link behaviour

If the founder lifts E75 for an opt-in nudge email, the link rules are:

1. One link only, to a path on the brand domain that is on the AASA allow list. Apple says the AASA file must be hosted "using `https://` with a valid certificate and with no redirects", and that devices check for updates "approximately once per week" after install (source in section 16). So the link path must exist in the file before the app that handles it ships, and a path added later takes up to about a week to reach installed phones. A new link path is therefore a two-step release.
2. No query parameter, fragment or path segment carries a library value, a child name, a day, a letter id or a person id (FR-PRV-13). A campaign tag is allowed only if it holds none of those and is not used to build a per-person history.
3. Installed: the link opens the app and `redirectSystemPath` routes it to Home. Not installed: the page offers the store link. Computer or Android: a plain page, no dead end.
4. The link never carries a secret that signs the parent in as a side effect of tapping. Sign-in links stay separate (`/auth/callback`). A nudge link that opens a signed-in session would be a second sign-in path and is refused.
5. An unknown path falls through to `/` and never throws (`redirectSystemPath` catch).

**MT-T5-R20.** Given any URL that opens the app, When `redirectSystemPath` runs, Then a nudge link routes to Home, keeps no state from the URL, logs nothing from it, and a capture path still goes to Tonight. Test layer: U (table of URLs with a positive control for each).

**MT-T5-R21.** Given an email nudge template, When its link is inspected, Then its path is on the AASA allow list and it has no query or fragment keys outside a closed list that holds no personal value. Test layer: C, S.

**MT-T5-R22.** Given a link opened in a browser (the app not installed, or the parent long-pressed it), When the page loads, Then it shows a plain page with the store link and no account, name, or count. Test layer: J on the website. UNVERIFIED how iOS chooses between app and browser for a link typed into the address bar; I did not find that in the page I read.

### 6.4 Email: what may and may not appear

Allowed (from `CATALOG.md` and `COMPLIANCE.md`): the sender `Early Letters <hello@earlyletters.com>`, a date written as a date, the book called "your book", an unsubscribe link, one line from a content key.

Never in any email: a child name (E-1), letter words, a picture or thumbnail, a place, a count of pictures or days, "you have not written", "waiting", a streak, anything derived from the library, any phrase in the NS-51-R12 ban list, a countdown ("in 3 days"), or a header that hides the sender.

### 6.5 REVERSAL list for email and remote push (founder owns)

| # | Earlier ruling | What lifting it means | My recommendation |
|---|---|---|---|
| RV-T5-1 | E75, FR-MKT-44: no marketing, re-engagement or product-news email to an app address, and no opt-in in the app | An opt-in nudge email exists. Needs its own row, off by default, one-click unsubscribe, hashed suppression, counsel on Q34 and CAN-SPAM class | Not in the first store build. If wanted, open it as its own card after launch, with a content-free cadence |
| RV-T5-2 | E79: no remote push, no APNs key, no token table | A server push exists. Store label Q54(d) and counsel | Not in 1.x |
| RV-T5-3 | NX-39 ruling 3 and K1 (no notification derived from the library) | The narrow local exception already proposed as NS-51-R11 | Allow only the identical-words form (privacy read point 5), with the founder shown the existence-disclosure reasoning |
| RV-T5-4 | NS-51-R26: nothing derived leaves the phone | Any server nudge that depends on a moment | Refuse. Even with consent it changes the Photos or Videos label (privacy read, CQ-13) |

## 7. Doorways that are not a notification: widget and share

A widget and a share entry are both doorways under NS-35-R3 and R4. Neither is built; the widget is parked (C-30) because "a letter's words on the Home Screen are visible to anyone who picks up the phone".

Rules if either is ever built:
- Landing is Home or a reading screen. Never a capture, never the microphone (NS-35-R7).
- A widget shows no picture, place, name, count or words by default. A moment widget is refused for the same existence-disclosure reason as a moment push.
- A widget tap passes through the same locked, cold, warm and signed-out rules as a push.
- A share entry (a picture sent to us from Photos) hands one picture to a place where the parent chooses: it opens Home with a choice, and it never saves a letter on its own. The picture is the parent's own pick, so showing it after unlock is fine.
- Apple's suggestion notification (NS-49-R20) is Apple's, not ours. It would need an extra universal link, and the suggestion id counts as L3 for logs (FR-PHS-33). It lands on the picker after the parent chooses our app in Settings. Spike only. I do not design it further here.

**MT-T5-R23.** Given any new doorway (widget, share, shortcut), When it opens the app, Then it appears in the closed list of start sources only as a landing, it never records or keeps on its own, and its route goes through the same table as R1. Test layer: U (NS-35-R5 closed list), S.

**MT-T5-R24.** Given a share entry hands in a picture, When the app opens, Then Home shows the picture and a choice, nothing is saved until the parent confirms, and a cancelled share leaves no file. Test layer: I.

## 8. Lock screen: showing the occasion without exposing private content

Two screens matter: the iOS lock screen, and our landing screen when someone else is holding the phone.

### 8.1 iOS lock screen (what the notification may say)

Today's rule (NS-32-R12, R13, E82): no letter words, no child name unless the parent turned names on, and with names off or App lock on no month number, age or "A year of letters". Each category sets a neutral hidden-preview placeholder.

For a moment-class nudge, the rule stricter than NS-51-R11 (privacy read, point 5) is the one to use: the moment nudge takes the evening slot and uses the evening reminder's exact words. So the lock screen cannot tell a moment from an ordinary evening. The founder's neutral example ("Some pictures from the weekend are here") names pictures, which Q-PM-9 refuses on a lock screen unless names are on and App lock is off. It appears only inside the app.

| Lock-screen state | What shows | Source |
|---|---|---|
| Previews hidden (iOS Show Previews: Never, or When Unlocked while locked) | App name and the category placeholder | NS-32-R13, J-D69 |
| Names off (default) | The evening reminder's neutral title and body | NS-32-R12 |
| Names on, App lock off | The named evening line. Still no picture word for a moment | Q-PM-9 default |
| App lock on | Neutral title; no age, no name | E82, NS-51-R25 |

**MT-T5-R25.** Given any moment-class nudge, When its request is inspected, Then its title and body equal an existing evening-class content key, its identifier is random, its payload is `{ source, kind }`, and no field holds a place, picture, filename, count, name or library value. Test layer: S with a positive control, U. (Extends MT-P5-R9.)

**MT-T5-R26.** Given any lock-screen state in the table, When the notification shows, Then what shows matches the table. Test layer: C (content), J on device (the walk J-D22 and J-D69). The behaviour on Apple Watch is UNVERIFIED.

### 8.2 Our landing screen, with the phone in someone else's hand

- Pictures render only after unlock and, with App lock on, after our own gate.
- The app switcher snapshot shows no picture (NS-51-R25).
- The occasion card text uses no child name when names are off. It says "{child}" only when the parent has names on, and never genders the child.
- A screenshot or screen recording is the parent's own matter; we add nothing.

**MT-T5-R27.** Given names are off, When the occasion card renders, Then it carries no child name, age or month number, and the picture appears only after unlock. Test layer: C, J.

## 9. Frequency and quiet hours

Existing rules that bind every channel (all PRD, read this session):
- At most 1 budgeted notification a local day across every class and every book (NS-32-R1, R1b). A plan notice sits outside the budget (R4).
- Quiet hours: any time inside 07:00 to 21:30 local, in 15-minute steps (NS-13-R30). No time-zone change may deliver two on one date (R6).
- Back-off: no `evening` after day 35 with no letter (R8). A typed day survives it (R9).
- 60 pending in total (R7). A new class or source may not raise it (R15).
- Interruption level `active`, never `time-sensitive` (R10).
- A quiet book adds nothing (R14).

What Moments adds, in this doc's view:
1. A moment is a ranked source inside `evening`, below `monthAge`, so it adds no class and no second notification. That is NS-51-R11 and the feasibility doc, and I agree.
2. Planned at foreground only (Q-PM-8). So a Monday nudge about weekend pictures exists only if the app was opened that day. This is honest, and it is the reason a library-driven push can never be the main daily reason to return.
3. Email does not join the budget. If a nudge email is ever opted in, it needs its own cap, and a day with a push should not also have a nudge email. I propose at most one nudge email in any 7 days, and no email on a day a budgeted push is scheduled. That number is a guess, not data. It is the founder's cadence (P5 7.2 says the same).
4. Focus and Scheduled Summary hold our notifications because none is time-sensitive (J-D23). A tap on a summarised notification hours later must still land correctly (R17 covers a gone moment; R2 re-chooses).
5. No nudge may say "again", "still", "don't forget", a streak, or count anything (NS-51-R12).

**MT-T5-R28.** Given every source and class with Moments added, When 92 days are planned, Then no local date holds two budgeted notifications, none lies outside 07:00 to 21:30, and the total pending stays at or under 60. Test layer: U (NS-32-R1, R7 extended with a property test).

**MT-T5-R29.** Given an email nudge is ever allowed and a budgeted push is scheduled for the same local date, When the email would send, Then it is held to the next free day, and the cap holds. Test layer: I. Applies only after RV-T5-1.

**MT-T5-R30.** Given a tap on a notification delivered on an earlier day (a Scheduled Summary), When the app opens, Then nothing says it is late, old or missed. Test layer: C, J.

## 10. Notification settings and unsubscribe: the round trip

### 10.1 Local push round trip

1. Parent opens Me, Reminders. The switch, the time and the "Include {child}" switch live here (D-S06).
2. Permission not allowed: the card "Notifications are off" with one sentence and Open Settings (`reminderCopy.settings.deniedTitle`, `deniedBody`, `openSettingsButton`; J-D14). Nothing is scheduled.
3. Parent goes to iOS Settings and turns notifications on, then returns. On the next foreground the scheduler replans (it listens to app state) and the card collapses with one toast. No double prompt.
4. Parent turns Reminders off in the app. Every pending local nudge, including a moment-derived one, is cancelled and delivered ones dismissed (scheduler cleanup, lines 364 and 367).
5. A kill switch (`momentNudges`, P5 K4) cancels pending moment nudges at next launch.

The moment nudge adds no setting. It rides the existing Reminders switch (feasibility, point 6). A separate "Moments" switch would be a new class of control and a way for the setting to reveal the feature on a shared phone; I recommend none.

**MT-T5-R31.** Given Reminders is turned off, When the parent goes to the Moments tab, Then no moment card is removed (the in-app card is not a reminder), and only pending local notifications are cancelled. Test layer: I.

**MT-T5-R32.** Given the parent returns from iOS Settings with notifications allowed, When the app comes to the foreground, Then the plan is rebuilt once, the denied card collapses, and no moment nudge is planned until the next foreground in which a moment exists. Test layer: I.

### 10.2 Email round trip (only if RV-T5-1 is signed)

The law and the vendor facts here come from the repo's counsel draft (`docs/emails/COMPLIANCE.md`). I did not re-verify CAN-SPAM or Gmail rules from a primary page this session, so they are UNVERIFIED by this lead; counsel decides.

Per PRIV-R21, anything a person agrees to carries four lines. For the email nudge opt-in:

- Shown: a plain screen, in the app and on the web, before any consent: "An occasional note about your book, by email. It never says anything about your pictures." (parent words proposed, content owns the final text). One button to say yes, one to say no, a comfortable no.
- Records: that this address said yes on this date, and the words they saw. Nothing about pictures, places, children or letters.
- Never: used for anything else, shared, sold, built from the library, or read for opens or clicks (tracking stays off, CATALOG principle 2).
- Decline: nothing changes. No second ask for a long, written gap, and the first ask is never part of sign-up or first run.

Unsubscribe mechanics (COMPLIANCE section 4, as written there): headers for one-click unsubscribe on every subscription email, an in-body link that opens one page with one button, the button does the work as a POST (never on GET, so link scanners cannot unsubscribe people), no sign-in, no survey before the button. Never unsubscribe anyone from transactional mail, and never use a vendor account-wide suppression list for this, because it would also block sign-in links.

Round trip:
1. Email link "stop these" opens the web page; one button stops the nudge email for that address.
2. The server holds one flag per address: nudge email allowed or not. It is the only thing the server holds about this.
3. In the app, Me, Reminders shows one row "Email notes" reflecting that flag on next open (UNVERIFIED that the app can read it at 1.0, since server features are off). Turning it off in the app has the same effect as the web button.
4. Turning email off never touches local push, and turning push off never touches email. They are separate channels with separate switches.
5. Account deletion removes the flag and keeps only a hashed suppression so a deleted address is not mailed again (E75's words).

**MT-T5-R33.** Given a nudge email, When its headers and body are inspected, Then it carries the one-click headers, a body link to the one-button page, the sender is a person who answers, and a transactional email carries neither. Test layer: C, S (extends the content test COMPLIANCE section 3 already names).

**MT-T5-R34.** Given the stop button is pressed, When the next send runs, Then no nudge email is sent to that address, a transactional email is still sent, and the GET of the page unsubscribes nobody. Test layer: I, with a scanner-prefetch fixture.

**MT-T5-R35.** Given the parent turns the email switch off in the app or on the web, When either surface loads next, Then both show off, within one open. Test layer: I.

**MT-T5-R36.** Given RV-T5-1 is not signed, When the first store build ships, Then there is no nudge email, no opt-in control, no "Email notes" row and no analytics event for one (P5 MT-P5-R17). Test layer: S, J.

## 11. What each channel may and may not say

| | In-app card (after unlock) | Local push, lock screen | Email | Widget (if ever) |
|---|---|---|---|---|
| A picture of the parent's own | yes, after unlock, never machine-chosen words | never | never | never |
| A place or a person guessed | never (constitution) | never | never | never |
| "Pictures" as a word | yes, inside the app: neutral line (NS-51-R11) | never (Q-PM-9, ML-3) | never | never |
| A child name | when names are on | only when names on and App lock off | never (E-1) | never by default |
| An age or month number | yes | only with names on and App lock off | no | no |
| A date | yes | no | yes, written as a date | no |
| Typed day wording | yes | only if the parent turned that on (NS-18-R3) | not unless the server holds it (Q6) | no |
| A count, a gap, a streak, "waiting" | never | never | never | never |
| "Don't forget", "again", "still", guilt | never | never | never | never |
| Anything implying a machine wrote something | never | never | never | never |
| A thumbnail | n/a | never (K1) | never | never |
| An offer, price or Plus | no | no (NS-46-R27) | no (E75) | no |

Parent-facing words stay with `content`: one verb, no internal terms (take, entry, draft, pack, raw_transcript). The only parent strings this doc proposes are the opt-in line in 10.2 and the neutral card line that NS-51-R11 already names. All others are existing keys.

## 12. Edge and unhappy paths

| Case | What happens | Row |
|---|---|---|
| Two taps in a row on the same notification | Second is a no-op; the route table is idempotent | R1 |
| Tap while on the Moments tab already | Stays; scrolls to top; no navigation stack growth | R1 |
| Notification tapped after the book was deleted or erased | Default Home; no card; dismissed | R12, R19 |
| Tap after Erase everything | Same as signed out; the index and opt-in are gone (NS-51-R23) | R12, R14 |
| Link opened under the 18+ stop | Link state dropped, not kept (`+native-intent.tsx` header) | R20 |
| Under-18 answer after planning | Reminders cleared by `session.ts` | R12 |
| iCloud original not on the phone | Plain box; no download triggered by the landing (NS-51-R21) | R17 |
| Limited access shrinks between plan and tap | Landing re-chooses; a vanished moment drops quietly | R17 |
| Time zone or clock change between plan and tap | Floating trigger holds the wall-clock hour (J-D16); no landing difference | R28 |
| Focus or Do Not Disturb | Held, never time-sensitive; tap works later | R30 |
| Airplane mode or no network | The landing needs none; email link shows the browser's own error, outside our control | R20 |
| Second phone | Reminders are per phone; the nudge on phone B is planned from B's state | R13 |
| Tap on a notification from an older app version | Unknown `kind` falls back to Home (today it falls to `/book`; see Q5) | R1 |
| Screen reader on | The occasion card is the first focus element after the landing title; it reads as plain text, no count | R4, accessibility 13 |
| Reduce Motion | No slide-in from the tap; a cross-fade or none | 13 |

## 13. Constitution, privacy and accessibility checks

Constitution. The landing writes nothing for the parent. The card never has a machine title, caption or story; a label shows only if the parent typed or chose it; a title that Apple's picker produced is never stored or shown by us. No face match, no place guess, no scene guess. No wording implies a machine writes anything.

Privacy.
- Nothing from the library goes to the server, to push services, to email vendors, to analytics, logs or crash reports. A network fake sees zero requests on the landing (NS-51-R26).
- No analytics event, property or bucket marks a nudge as moment-driven; count it as an ordinary evening nudge (privacy read point 6, CQ-15, extends NS-51-R12).
- The tap handler logs nothing from the payload or URL.
- The label story (Data Not Collected for Photos or Videos) holds only if email and remote push stay free of library signals. RV-T5-4 is the line that would change it.
- Email: no child name, no letter words, no pictures (E-1). A nudge email is a new class and needs counsel.

Accessibility (all with iPhone SE 3 and AX5 in mind): the occasion card wraps, never truncates a date; Bold Text keeps contrast; VoiceOver reads title then date then the action, with one action named; Reduce Transparency uses solid `glassFallback`; Increase Contrast keeps the card edge; no gesture-only action; the landing never auto-plays audio or video.

Design language (`docs/design/DESIGN-LANGUAGE-V2-21nov.md`, not re-read this session; UNVERIFIED against it): content stays paper, glass only on navigation and controls, at most three glass surfaces, minimum iOS 17.0.

## 14. Open questions

| Id | Question | My default | Needed by |
|---|---|---|---|
| Q1 | Should a moment-class tap ever land on Moments while an ordinary evening tap lands on Home? | No. One route; the screen decides after unlock (MT-T5-R3). Revisit only if tab position is Moments default | With the IA decision |
| Q2 | Does the founder own RV-T5-3, the identical-words local nudge? | Yes, shown with the existence-disclosure reasoning, or no moment nudge at all | Before BL for the nudge is opened |
| Q3 | Does the founder want any email nudge after launch (RV-T5-1)? | Not in the first store build; a separate card later | After the first store build |
| Q4 | How long may a held route wait behind App lock? | 5 minutes, a guess | Before the landing PR |
| Q5 | Does a cold-start tap on a `/book` class land on Home today? | Treat as UNVERIFIED; a device walk decides. Fix as its own small task | Before this doc's rows are built |
| Q6 | Are typed days held by the server? | No (P5 7.1). The brief's "typed days for email" is then not possible | With the data lead |
| Q7 | Is a "Moments" switch ever added to Reminders? | No; one Reminders switch | Now |
| Q8 | Is there an `/open` page and AASA path for nudge links? | UNVERIFIED; the website lead confirms before any email link | Before RV-T5-1 |

## 15. Dependencies

- P5 (rollout, budget, kill switch K4) and the tab-position decision (T1 to T4 and the IA lead).
- Privacy and constitution read (PR #1267), feasibility (PR #1269), design concept (PR #1270).
- `mobile`: `scheduler.ts`, `+native-intent.tsx`, `session.ts`, `budget.ts` (BL-966), `payload.ts`, the planner (BL-943).
- `content`: the in-app neutral line, the opt-in lines, no new lock-screen key.
- `website`: `/open`, the AASA file, the unsubscribe page.
- `security-architect` and counsel: the payload shape, the label, CAN-SPAM class, Q34.
- Founder: RV-T5-1 to RV-T5-4 and Q2, Q3.

## 16. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session):
- The repo files named in section 2, read from a fresh clone of `develop` and from the branches `wip/moments-p5`, `docs/privacy-moments-tab-21nov` and `docs/mobile-moments-tab-feasibility-21nov`.
- The tap handler routes `evening` to `/` and anything else of ours to `/book`; its catch comment says the app opens on Tonight on a cold start (`scheduler.ts`).
- `redirectSystemPath` handles auth, invite and capture links, drops secrets, and returns `/` on any throw (`+native-intent.tsx`).
- Apple, "Supporting associated domains", https://developer.apple.com/documentation/xcode/supporting-associated-domains.md: the AASA file must be hosted "using `https://` with a valid certificate and with no redirects"; each subdomain needs its own entry and file; Apple's CDN requests the file within 24 hours and devices check for updates "approximately once per week after app installation"; a path can be excluded from universal links by a `components` rule.
- Apple, "Scheduling a notification locally from your app", as quoted in the feasibility doc: a scheduled request stays until its trigger or until cancelled.

UNVERIFIED (not read from a primary source this session):
- iOS behaviour on a locked tap beyond "the system asks to unlock first"; cold-start delivery of the tap to our listener; foreground presentation setting in our code.
- Whether the `/open` page ships; how iOS chooses app versus browser for a link typed in the address bar.
- CAN-SPAM and Gmail and Yahoo one-click rules (the repo's counsel draft is the only source I used).
- Apple Watch mirroring of our notifications.
- App Review guideline 4.5.4 on promotional notifications (the privacy read also did not read it).
- The ML-3 label: the privacy read could not find a row with that id and traces the text to NX-39 ruling 3 and K1. I did not find it either and use the text, not the id.
- Whether any evidence shows library nudges lift engagement. I found none in the repo and read none elsewhere. The founder's belief is not a fact I rely on.

Guesses (marked where used): the 5-minute hold (Q4), one nudge email per 7 days (9.3), the identical-words form being enough for counsel (Q2).

What I did not do: run the app or a device; write CLAIMS or BACKLOG; open a PR; touch legal or supabase paths; read the design language file; read T1 to T4, P1 to P4 or A and D docs beyond checking they exist.
