# 1b. Experience acceptance, part 2 of 2: areas C, D, E (deliverable 1 of 4, continued)

Continues `EXPERIENCE-ACCEPTANCE.md` (rules EX-01 to EX-16, status codes B/P/N, tags V/E/U). Same limits: rows come from the INDEX inventory (`INDEX.md:80-176`, [V]) and the WORDS key tables unless a screen is marked "(read)". I read in full: C-S04 family of states by headings only, E-S23 matrix (`E DESIGN.md:558-576` [V]), the system SystemLine and F1 component rows. Everything else is "(inv)": open the area DESIGN.md section before building.

Common state rule for every screen below: `offline`, `killswitch` (`serverFeaturesEnabled()` off), `planLapse`, `signedOut`, `secondAccount`, `ax5`, `vo`, `dark` are listed in the area files for most screens. Acceptance for each is "renders without a network request on the local path, the same tree as `default` unless the area file names a difference" (EX-09). Where a state changes the tree, it is named in the row.

## 1. Area C: keeping and trust (27 screen ids, 208 state ids)

| Id | Structure and hierarchy | States to prove | Key prefixes (status) | Components and tokens | Acceptance | Develop |
|---|---|---|---|---|---|---|
| C-S01 Me (tab root) | Heading = tab label "Me"; groups as built plus Days row under Reminders; update line | killswitch, second-account, sessionEnded, updateRequired, deletedElsewhere | `en.settingsHome.*` (CHANGED), `me.sessionEnded` (PROPOSED) | `ListSection`, `ListRow` (>= 52 pt, `size.row`) | Bar title equals tab label (R2 test); every row 44+ and one VO element; groups are headings | P: `(tabs)/you.tsx` built; R2 on develop test-side |
| C-S02 Account | Sign-in method, sign out, sign out of other phones | waiting, suspended, offline | `auth.account.*` (PROPOSED/CHANGED) | `ListRow`, `ConfirmSheet` | Destructive rows named by word; offline disables with a words line, not colour | B: `settings/account.tsx` |
| C-S03 Sign-out sheet (D1) | Sheet states book stays on phone; photos, days, waiting letters notes | appLockOffer, waiting, photos, days | `culture.signOut`, `signOut.appLockOffer` (PROPOSED) | `Sheet`, `ConfirmSheet` | Sheet says the book stays (D1) before the button; one primary | P (inv) |
| C-S04 Save a copy (export) | Title, what is included (parts), size line, Save; progress; result | running, saved, cancelled, error-lowSpace/other/tooBig, lapsed, lowPower, nothingHere | `export.screen.*`, `export.printable.*` (CHANGED/PROPOSED) | `StateScreen`, `m.progress` (real bytes), `Progress` (new) | Fill moves with real work, jumps under RM; low-space check before start (E-S17); cancel always reachable; haptic `success` on finish only | P: `settings/export.tsx` built; Progress component N |
| C-S05 Printable book (PDF) | Making, parts, ready, share | error-print_pdf_disk_full, error-share_failed, lowPower | `export.printable.*` (PROPOSED) | `Progress` | Word "Printable" never "print-ready"; failures say what the parent can do | N |
| C-S06 Save-a-copy slip | Slip rank 3, birthday week | dismissed, flagOff, twins, quiet | `en.tonight.*` (CHANGED) | slip host | One `bordered` button; absent in quieted book | N |
| C-S07 Which book | Chooser sheet | none | `en.children.*` | `Sheet`, `ChoiceGroup` | Radio; current book marked by check | N (inv) |
| C-S08 Where letters live | Row page, flip states | local, flip, signedout | `en.settings.*` | `ListRow` | One element per row; state in words | B: `settings/where-letters-live.tsx` |
| C-S09 Letter page provenance | "Where the recording is" line | notHere, onPhone, otherParent, arriving | `auth.newPhone.*` (PROPOSED) | `ListRow` (letter list row 7) | Line is a words row, not an icon; VO reads where | N |
| C-S10 Opening your book | New phone, returning account | loading, noBook, offline, wrongAccount, held | `auth.newPhone.*`, `auth.outage.*` | `StateScreen`, `m.progress.wait` | No spinner; busy words stand still at every RM setting (tokens.v2 rule, Conflict C-03); never a blank screen | P: launch and restore code partly built [U] |
| C-S11 Returning consent | Sheet and "not agreed" screen | declined, withdrawn, serversOff | `auth.consent.*` | `Sheet`, `AgreementRow` | Agreement box unticked by default; Decline as visible as Agree (PRIV-R21 Shown/Records/Never) | P: consent screen built (`(auth)/sign-in/consent.tsx`) |
| C-S12 Book-level new phone line | One line above first chapter | dismissed | `en.book.arrivalLine` | `InlineState` | Line, not a banner; dismiss named by word | P: `arrivalLine` position built [per B DESIGN, U] |
| C-S13 Earlier versions | List | loading, error-fetch_failed, offlineNone | `en.book.*` | `ListRow` | Error is words + Try again; no count | N |
| C-S14 An earlier version | Read-only, Restore, Remove | confirmRemove | `en.book.*` | `ConfirmSheet`; `m.mark` | Restored span marks with tint then fades | N |
| C-S15 A book in Me | Details, Quiet, Hide, Delete | quiet, error-quiet_write_failed | `en.children.*` | `ListRow`, `Toggle` | Quiet switch announces state; Delete last, destructive by word | P: `settings/children/[id].tsx` |
| C-S16 Hidden books | List | empty | `en.children.*` | `EmptyState` | Empty state still, no breathing loop | P: `settings/children/hidden.tsx` |
| C-S17 Recently deleted | List incl. sealed row (no words) | error-erase_failed | `erase_failed` (E) | `ListRow` | Sealed row has no words | B: `settings/recently-deleted.tsx` |
| C-S18 Storage | Languages, space, removal state line | lowSpace, stuck, retrying | `storage.stuck` (PROPOSED) | `ListRow`, `SystemLine` | Never a list or count of recordings | B: `settings/storage.tsx` |
| C-S19 Erase everything | Confirm, owner check, erasing | ownerCheck, error-failed | `en.settings.*` | `ConfirmSheet typed` | Typed confirmation; `warning` haptic at confirm | B: `settings/erase.tsx` |
| C-S20 Delete account | What happens, send, scheduled | executing, error-offline | `culture.delete`, `deleteAccount.*` | `ConfirmSheet`, `StateScreen` | Says pictures and sealed letters go too (D6); words before button | B: `settings/delete-account.tsx` |
| C-S21 Recording backup | Flip-only, absent today | consent, escrow, on | none | n/a | Honest states only; no UI ships (NS-08 off) | P: `settings/backup.tsx` exists, behaviour [U] |
| C-S22 Delete this book | Confirm, export first | exportFirst | `en.children.*` | `ConfirmSheet` | Export offered before delete | B: `settings/children/delete-book.tsx` |
| C-S23 Privacy | Consent on/off/waiting; Stop syncing letters | withdraw | `privacy.withdraw.*` (PROPOSED) | `ListRow`, `Sheet` | Switch announces state | B: `settings/privacy.tsx` |
| C-S24 Days | Days you added, chose, Browse days, day-name switch, Clear all | empty, clearConfirm, notificationsDenied, flagOff | `days.page.*`, `days.section.*` (PROPOSED) | `ListSection`, `DoorNote` (N) | `DoorNote` first in order, never collapsed; no list of gaps | N (flag `EXPO_PUBLIC_DAYS`) |
| C-S25 Browse days | Sheet, tradition and country pickers | hemisphere, noDateNextYear | `days.browse.*`, `days.door.*` | `Sheet`, `DoorNote` | Rows 52+ pt; consent line visible (D-S25) | N |
| C-S26 Day detail | Date, Move, Remove | removed | `days.picker`, `days.move`, `days.remove` | `ListRow` | Pushed only from C-S24 | N |
| C-S27 Photos access (PROPOSED) | Consent, albums, states | limited, paused | none yet | n/a | Pending NS-51 rows | N |

## 2. Area D: family, sharing, reminders (27 screen ids, 229 state ids)

| Id | Structure and hierarchy | States to prove | Key prefixes (status) | Components and tokens | Acceptance | Develop |
|---|---|---|---|---|---|---|
| D-S01 Share control | Full-width secondary button on letter page | absent, present | `shareCopy.letter.*` (PROPOSED) | `Button` | Own row, full width, 44 pt or more; absent on a letter that cannot be shared (card NS-05 rows) | N |
| D-S02 Share preview | Sheet: words (and picture switch), Share | exact, versionFixes, picture-off, error-share_temp_write_failed | `shareCopy.letter.*` | `Sheet`, `Toggle` | Preview text equals what is shared byte for byte; switch announces; failure line names what to do | N |
| D-S03 iOS share sheet | System | completed | n/a | system | App lock hold released after (TDD 10 Decision R21 [U]) | n/a |
| D-S04 Reminder ask | Sheet over the Book: yes, no, pick time | after-yes-denied, after-no | `onboarding.reminder.*`, `reminderCopy.*` (E/PROPOSED) | `Sheet`, `ButtonRow` | Yes and No same size and style; no pre-ticked | P: reminder prime ask built [`components/asks`] |
| D-S05 iOS permission alert | System | after-yes | n/a | system | Asked only after Yes | n/a |
| D-S06 Me, Reminders | Switch, time, days row, denied, backedOff states | off, on, denied, backedOff, lateClamp, appLock, ax5 | `settings.reminders.*`, `reminderCopy.settings.*` (30 keys, PROPOSED/E) | `ListRow`, `Toggle`, time picker | Time 07:00 to 21:30 in 15-min steps (system picker); state in words; no streak | B: `settings/reminders.tsx`; days row N |
| D-S07 Time picker | System compact | default | `settings.reminders.*` | system | Bounds enforced by tests (`reminders-planner.test.ts` per TDD 09 [V]) | B |
| D-S08 Add a day | Sheet: name, date, show words | error-typed_day_empty/past/too_long, notAllowed | `reminderCopy.typedDay.*` | `Sheet`, `TextField`, `DateSheet` | Writing Tools off; error = glyph + words; 60-char cap | N |
| D-S09 A typed day | Detail and Delete | confirm | `reminderCopy.typedDay.*` | `ConfirmSheet` | Delete by word | N |
| D-S10 Lock screen / Notification Centre | Titles, bodies, hidden previews | hidden, named, neutral, appLock, libraryDay-* | `notifications.placeholder`, `ntc.photoMoment` (PROPOSED) | system | No child name or letter text with previews hidden (default); placeholder key set | N: placeholder is TDD 09 slice 5, not built |
| D-S11 Notification landing | Lands on Home or Book | typedDay, libraryDay-cleared, plan | none | n/a | Landing never records; no new prompt | P (inv) |
| D-S12 Write this book together | Me page for the book | oneParent, twoParents, consent-needed, killswitch | `family.bookRow`, `family.members` | `ListRow` | Absent when serversOff | P: `family.tsx` built |
| D-S13 Invite sheet | Create link, copy, share | full, paused, offline, sent | `family.create.*` | `Sheet` | Offline disables with words | B: `invite/new.tsx` |
| D-S14 Invite link page (web) | Web | expired, iphone, otherDevice | `site.invite.*` | web tokens (`dist/tokens.web.css`) | Same tokens as app; 48 px targets (`target.web`) | n/a (web) |
| D-S15 Join ask: peek | Top of join sheet | error-expired/not_found/revoked/used, unknownInviter | `family.accept.*`, SCINV/SCCAP codes | `JoinAsk` | Error maps to words per code; no blame | P: `components/family/join-ask.tsx` |
| D-S16 Accept: agreement | Bottom of same sheet | error-book_full, family_share_consent, joining | `family.errors.*` | `AgreementRow` | Agreement box required, unticked | P |
| D-S17 Joined arrival | Arrival | slow, twobooks, notYet | `family.accept.*` | `StateScreen` | No cover-opening ceremony (v2 retires `JoinedCover`) | P: cover ceremony still built (Conflict C-04) |
| D-S18 Family page | Members, pending, undo | twoParents-undoable, undo-open/closed | `family.members.*`, `family.undoJoin.*` | `ListRow` | 72 h undo shown as words | P: `family.tsx` |
| D-S19 Undo join confirm | Confirm | error-SCPAR | `family.undoJoin.*` | `ConfirmSheet` | Destructive by word | P |
| D-S20 Other parent after undo | Notice | default | `family.undone` | `StateScreen` | Words only | N |
| D-S21 Not much today | Home link and kept line with Undo | kept, error-save | `tonight.notMuchButton`, `notMuch.*` (E) | `QuietDayInline` | Swap in 150 ms; Undo no timer; `soft` haptic | B: `quiet-day-inline.tsx` |
| D-S22 Quiet-day row in Book | Row, menu | consecutive, removed | `book.quietDay.*` | `QuietDayRow` | Row has a Remove action reachable without a gesture | B: `quiet-day-row.tsx` |
| D-S23 Pilot artefacts | Messages | consentV, scriptA | `pilot.*` (PROPOSED) | n/a | Not an app screen; words only | n/a |
| D-S24 Plan date, notifications off | Me, Plan | denied | `billing.plan.*` | `ListRow` | Words state why no reminder | N |
| D-S25 Day reminders consent and opt-out | Lines on C-S24/C-S25 | firstTickAsk, stopOne | `days.door.*`, `days.firstTick.*` | `DoorNote` | Opt-out as visible as opt-in | N |
| D-S26/S27 | Catalogue specimens; Nudge artefacts (PROPOSED) | none | `ntc.*` | n/a | Design artefacts, not built | n/a |

## 3. Area E: foundations and system states (32 screen ids, 223 state ids, 82 `E-ST` states)

| Id | Structure and hierarchy | States to prove | Key prefixes (status) | Components and tokens | Acceptance | Develop |
|---|---|---|---|---|---|---|
| E-S01 Launch and boot | Matched first frame, then content | migrating, recovery, error-launch | `en.errors.*` | `StateScreen`; `m.enter.group` (cold only) | First interactive frame p50 1.2 s, p90 2.0 s (NS-34); content never blank on error | P: launch logic built (`launch.logic`) |
| E-S02 Welcome | Account-first when servers on; lockup, hero, buttons | serversOff, sessionExpired, restoring, alpha | `en.onboarding.*`, `authCopy.sheet.*` | `Button`, `Lamp`, `LineArt` | Lockup ignores Smart Invert; any line drawing animates once per install, first run only | B: `onboarding.tsx` (hero offsets typed, MOTION 5) |
| E-S03 Age gate and stop | Yes/No with nothing selected, agreement unticked | stop, stop-after24h, platformMinor | `en.ageGate.*`, `under_18` | `ChoiceGroup`, `AgreementRow` | Yes/No no default; Terms and Privacy links 44 pt | B: `components/gate/age-gate-screen.tsx` |
| E-S04 Sign-in sheet (Me) | Sheet | error-cancelled, refused-region | `authCopy.*` | `Sheet` | Each error code has words + next step | P |
| E-S05 Email | Field, send | error-invalid_email, email_wait | `email_wait`, `invalid_email` | `TextField` | Field autofill; no length leak | B: `(auth)/sign-in/email.tsx` |
| E-S06 Code | 6 to 10 digits field | error-wrong_code, expired, rate_limited | `wrong_code`, `expired` | `TextField` | `code.digits` with {n}; one-time-code autofill | B: `(auth)/sign-in/code.tsx` |
| E-S07 Agreements and consent | Steps | reconsent, declined | `authCopy.consent.*` | `AgreementRow` | Decline visible | B: `sign-in/consent.tsx` |
| E-S08 First book steps | Name, date, languages, signs-as, twins | dateFuture, dueRange, nameLimit | `en.onboarding.*` | `TextField`, `m.step` | Step = words out 160 then in 280; controls stay | B in `onboarding.tsx` (`stepMotion`) |
| E-S09 First-run router | Alias of C-S10/S11 | none | n/a | n/a | n/a | P |
| E-S10 Keep gate sheet | Held letter card, plan, Keep it here for now | lapsed, offline, needsNewerIos, hold | `billingCopy.keepGate.*`, `plus_required` (PROPOSED) | `Sheet`, `HeldLetterCard` (extract) | Modal; focus on title; escape returns to Review; never blocks Keep of a free letter | P: `plus-gate.tsx` built on gorhom sheet |
| E-S11 Plan in Me | Plan state rows | trial, renews, grace, ended, restored | `billingCopy.plan.*` | `ListRow` | Dates as words; no countdown ticking | B: `settings/plus.tsx` |
| E-S12 Plus confirmed | Confirmation | withAsk | `billingCopy.confirmation` | `StateScreen` | No ceremony; no haptic (StoreKit is system) | B: `plus/confirmed.tsx`; haptic present (ENG-M10) |
| E-S13 Something broke | Global and boundary | secondFault, noBook | `GlobalErrorCode`, `en.errors.*` | `StateScreen` | Never prints the error (`design-system-gaps.test.ts:105` [V]) | B |
| E-S14 Sign-in outage and offline | First-run | killswitch, backOnline | `system.offline.*` | `SystemLine` | Local book still reachable | P |
| E-S15 SystemLine | New component; line in place | offline, paused, waiting, action | `system.offline`, `system.unreachable`, `system.notThrough` (PROPOSED) | `SystemLine` (N), `m.enter`, `m.move` | Shows after 2000 ms offline, hides 1000 ms after back (`systemLine.*`, proposed); polite announcement, once per minute (NS-33 s6) | N |
| E-S16 App update line | Line in Me | line, absent | `system.update.*`, `upgrade_required` | `SystemLine` | Opens store; no nag | N |
| E-S17 Low-storage rules | Lines on A-S04, A-S05, C-S04, C-S18 | under1gb, under50mb, under20mbMidTake | `system.storage.*` | `SystemLine` | Under 1 GB: Speak stays within budget (NS-34 s6); announced | N |
| E-S18 Second account | Scope rules | signedInB-* | `AccountMismatchError` | n/a | Foreign scope reaches no book, slip, Share, reminder (BL-961) | P |
| E-S19 Interruption | Call, background, kill | killedMidTake | n/a | n/a | Take kept; VO focus returns to the same element | P |
| E-S20 Not found | Screen | noBook | `en.errors.*` | `StateScreen` | One way home | B: `+not-found.tsx` |
| E-S21 Appearance | System/light/dark | noLetter | `en.settings.*` | `ChoiceGroup` | Radio, scheme change is `m.instant` | B: `settings/appearance.tsx` |
| E-S22 App lock cover | Cover and unlock | failed, locked | `settings.appLock.*` | `PrivacyCover` | Cover on instant; unlock 200 ms fade; lockup ignores invert | B: `app-lock-layer.tsx` |
| E-S23 Accessibility walk and speed sheet | Matrix of NS-33 and NS-34 rows (`E DESIGN.md:558-576` [V]) | matrix | n/a | n/a | Every NS-33 R1..R16 row maps to a screen id (A11Y-ACCEPTANCE 1) | n/a |
| E-S24..S26 | Claim screen; plan note; Home Plus line | accountDeleted, renews, alpha | `billingCopy.*`, `en.plus.*` | `PlusLine` | Line has no button or price on Home | P: `plus-line.tsx` B |
| E-S27..S29 | App Store claims; permission map; mic prompt | allowed, denied | n/a | n/a | Mic asked once, after area A primer | P |
| E-S30 Struggling | Support lines | offline | SUP-17/18 keys (PROPOSED) | `StateScreen` | Works offline; phone links 44 pt | B: `settings/struggling.tsx` |
| E-S31 Lines in other countries | List | list | SUP-17 keys | `ListRow` | VO reads country then number | B: `struggling-elsewhere.tsx` |
| E-S32 Photos access primer (PROPOSED) | Primer | none | none | n/a | Pending NS-51 | N |

## 4. Catalogue states `E-ST01..E-ST22` (`INDEX.md:178-264`)

Rendered by every area. Rule: each is drawn once as a state component (SystemLine, StateScreen, InlineState, Toast) and every screen row above inherits it. Acceptance: one component per kind (3 kinds: in-place line, state screen, toast) so a fix lands once; a source scan fails on a new ad hoc banner (`design-system-gaps.test.ts:80` already scans StateScreen use [V]). I did not read the catalogue rows in full [U].

Cites sampled in this file: see `DESIGN-DELTA.md` section 5.
