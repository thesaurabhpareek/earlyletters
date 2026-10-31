# P8b critics' pass: the Family tab, invite, joining and leaving (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P8b of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P8 Server surfaces", chapter 7 screens S57 (the Family tab), S58 (invite a co-parent), S59 (joining a book) and S60 (leave the book, hidden), journeys J17 and J21, and 5.8 rows 10 and 12. Read against `develop` at **817879d**, where P8b is merged as #314 (19a26eb). Every file:line below is at 817879d. `develop` has since moved to 989433b (#358 Delete account, #362 and #368, the P2 and P3 critics' passes); none of those commits touches a file this pass cites (checked by file name). Out of scope: P8c, Delete account (#358), typed invite codes (D-120: invites are link-only; #306 is held). This pass critiques; it changes no app code, test or copy.

## 0. Verdict for B2-10 (P8b's share)

**Signed once the six Should items below (S1 to S6) are fixed or ruled by the coordinator, and the phone checks in section 7 pass. No Must item.**

P8b gets the hard rules right. Before sign-in the join sheet shows no child name, no inviter and sends nothing to the server (checked at four sizes and in dark mode). The ask shows only "Invited by Mama". Nothing joins until "Join the book" (J21). The child's name first appears on the cover that opens. The Family tab is one lit room with people as signatures: no avatar, no email address, never more than two parents, nothing counted. Leave is hidden everywhere (D-113): no row on the tab with two parents, no screen that links to it (`lib/family/entry.logic.ts`, `LEAVE_BOOK_OFFERED`), and `/invite/leave` says "Coming soon. Leaving a shared book is coming in a later update." The link carries no child name and only its hash reaches the server (J21c). Nothing here writes meaning.

What a co-parent can still meet: an invite that looks sent when the share sheet was dismissed (S1); a joined screen with only "Close" while the book is still coming, which leaves a fresh phone on the first-run welcome (S2); a primary button below the fold on a small phone (S3); an invite card that breaks a word at large text (S4); a joined moment that VoiceOver is not told about (S5); and two ways out of the join sheet that do different things (S6).

| Rank | Count |
|---|---|
| Must before build 2 | 0 |
| Should before build 2 | 6 |
| Later | 9 |
| Accept as built | 14 |

The three to fix first: **S1** (the dismissed share sheet), **S2** (Close before the book arrives), **S6** (Close against Not now).

## 1. How this was looked at

- The same scratch worktree, exports and journeys as the P8a pass (`P8A_CRITICS_PASS_2026-10-28.md`, section 1): j17-family, j21-coparent and j22-sign-in, **17 of 17 passed**, `JOURNEY_SHOTS=1`, one worker, 402 by 874 pt. Screenshots stay in the session scratchpad: `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p8-shots/` (`journeys/`, `default/`, `dark/`, `ax5/`, `se/`).
- A scratch probe (never committed) against a patched copy of the server-on build, with a mocked Supabase: AX5 (emulated, 3.571 with the token caps), dark mode, a 375 by 667 pt phone, and these states: the join sheet pasted with a typed code (not recognised), a pasted message with the link, signed out, a slow look ("Opening the invite"), the ask with and without the inviter's sign-off, a slow join ("Joining the book"), joined with the book still coming, Close before it arrives, each final error (expired, used, cancelled, not found, already a member, two parents) and each kept error (a rate limit, invites paused, a 503, offline), consent missing at the join; the Family tab with one parent signed out, the invite sheet signed out, signed in, typed, with each fault (offline, rate limited, not a parent, paused, a 503), a pending invite, Share again offline, Cancel invite (through the alert seam), consent missing, a fresh phone whose book arrives with two parents, a co-parent with no sign-off, and `/invite/leave`. The invite sheet was measured on a 375 by 667 pt phone.
- Read from source against each screen's lines: `(tabs)/family.tsx`, `(tabs)/_layout.tsx`, `invite/{_layout,index,new,leave}.tsx`, `components/family/*`, `lib/family/{pending-invite-watcher,pending-invite,join-flow.logic,entry.logic,invite-errors.logic,share}.ts`, `lib/auth/ui.tsx` (the frame P8b uses), `app/onboarding.tsx` (the two doors), and every string these screens read from `familyCopy` and `en.tabs`, `en.familyTab`, `en.onboarding`.
- Read: CLAUDE.md, EXPERIENCE_PASS section 6 P8 and 5.8, DESIGN_LANGUAGE (Family invite), MOTION 5i and 6, COMPONENTS 0.1, VOICE.md, BRAND.md, DECISIONS D-113 and D-120, the bodies of #310 and #314, DEVICE_TEST_PLAN S1-28, and the P4 pass as the model.

The web preview is a stand-in: no haptics, no VoiceOver, no iOS sheet, keyboard or share sheet (the probe stubs `navigator.share`), no universal links, and secure storage is an in-memory map, so a link kept "in the Keychain" does not survive a web reload. Section 7 lists what is left for a phone.

## 2. Findings, ranked

### Must before build 2

None. Nothing here shows a name before sign-in, joins without a tap, shows Leave, or writes a word for a person.

### Should before build 2

**S1. When the share sheet is dismissed without sending, the app still says the invite is on its way.**
- Spec: S58 Motion (line 1438): "When the share sheet closes, this sheet dismisses; the Family tab's pending row enters with `enter` and `create.done` shows as a toast." Acceptance (line 1444): "the person sends the link from the share sheet."
- Built: the invite is made on the server first, then the share sheet opens, and whatever it answers the sheet plays `success`, leaves "The invite waits on the Family tab until they join." and closes (`apps/mobile/src/app/invite/new.tsx:125-131`). `shareInviteLink` does tell them apart (`lib/family/share.ts:17`, `'shared'` or `'dismissed'`), but only the analytics event reads it (`new.tsx:126`). The draft is dropped too (`new.tsx:128`), so the next tap makes a second invite.
- A parent: taps "Share invite link", sees the iOS sheet, changes their mind or picks the wrong app and taps outside it. The invite sheet closes with a success tick, the toast says the invite "waits ... until they join", and the tab lists "Invited, open until ..." for a link nobody received. Papa never gets it. (Code-read; the web's share stub always answers "shared", so the dismissed path is a phone check.)
- Fix: on `dismissed`, keep the invite sheet open with the same draft and no toast or tick (the person is still at "Share invite link"), or close without the toast and let the pending row's "Share again" carry on. Change S58's line to "when the share sheet closes after the link was sent".

**S2. Close before the book arrives drops a new parent on the first-run welcome.**
- Spec: S59 States (line 1472): "joined, book still coming; joined and ready". Visual (line 1468): while the book is coming down, `joinedWaiting` over a bar, then "Open the book" filled.
- Built: until the book is on the phone the joined view's only control is a filled "Close" (`invite/index.tsx:381-383`, `:393-399`). On a fresh install the sheet sits over first run's welcome (`onboarding.tsx`), so Close shows the welcome until sync brings the book (`components/family/welcome-handoff.logic.ts`). Probe: with the book still on its way, the joined view's buttons were `["Close"]`; after Close the page read "The baby memory book you fill by talking. ... Begin the book | I already have a book | I was invited" at `/onboarding` (`default/join-closed-before-book.png`).
- A parent: sees "You're in Asha's book. Asha's book is on its way to this phone.", taps the only button, and lands on "Begin the book". If they take that door they start a second book of their own. When the book arrives the welcome hands over to the Book (J21h), but nothing told them it would.
- Fix: while the book is coming, keep the person on the sheet (no Close until it arrives, with the bar), or give the welcome one line while a joined book is on its way ("Asha's book is on its way to this phone.") and hide "Begin the book". Add the state to S59 (line 1472).

**S3. The invite sheet's primary sits in the scrolling content, below the fold on a small phone.**
- Spec: chapter 7's frame (line 1255): "One filled primary, 56 pt, at the bottom"; DESIGN_LANGUAGE principle 2: primary actions in the bottom third.
- Built: "Share invite link" is the last item inside the `AccountGate` in the scroll (`invite/new.tsx:196`), not in the frame's `footer`. Measured: at 402 by 874 pt it sits at 676 to 732 pt; on a 375 by 667 pt phone at 695 to 751 pt, 84 pt below the bottom edge (`se/invite-typed.png` ends under the link note). With the keyboard up for the sign-off it is further away.
- A parent: types "Papa" on an SE-sized phone and cannot see the one button that does the work until they dismiss the keyboard and scroll.
- Fix: put the primary in the frame's footer (above the keyboard), and the error line above it; S58 keeps its text.

**S4. At accessibility sizes the invite card squeezes its words beside the cover and breaks one in half.**
- Spec: S57 Visual (line 1409): the card with "the small closed cover at its right"; COMPONENTS 0.1: "nothing truncates silently"; the same chapter's sign-in sheet steps its cover aside at AX (`(auth)/sign-in/index.tsx:58`).
- Built: `components/family/invite-card.tsx:25-35` keeps the title and body in a `flex-1` column beside the 88 pt cover at every size. Emulated AX5 (`ax5/family-one-signedout-full.png`): the heading reads "Write this book togethe / r", the body wraps one word to a line, and the button is an oval holding "Invite a co-parent" in three lines.
- A parent with large text: reads a card that is mostly cover and broken words.
- Fix: at accessibility sizes put the cover above or drop it (as the sign-in sheet does), and let the title and body take the width. (Emulated; confirm on a phone.)

**S5. The joined moment is not announced and focus does not move to it.**
- Spec: S59 (line 1468): `joinedTitle` in `title1`; MOTION 6: `success` once when the join returns; COMPONENTS 0.1 (screen readers). Every other step of this chapter uses `SheetTitle`, which moves VoiceOver focus to the new title (`lib/auth/ui.tsx:117-124`, `useFocusOnMount` at `:119`).
- Built: the joined heading is a plain `Text variant="title1" asHeading` (`invite/index.tsx:389`); the file imports `SheetTitle` but the `Joined` view never calls a focus helper. The busy line before it ("Joining the book") is a live region, which is Android-only (`lib/a11y.ts`, `announce`), and nothing calls `announce`.
- A parent using VoiceOver: taps "Join the book", hears the busy view's title, and then the view the cover opens on, where focus may sit on a button that is gone. "You're in Asha's book" is the moment the screen is about. (Code-read; unverified on a phone.)
- Fix: give the joined heading `SheetTitle`'s focus behaviour (or `announce` the title once it shows), and say the book is on its way when `joinedWaiting` appears.

**S6. The join sheet has two ways out that do different things, and a link that stays.**
- Spec: S59 acceptance (lines 1474 to 1478), A-REQ-028 (the token survives sign-in and an app kill), `accept.notNow` "Not now" forgets the link (BL-322).
- Built: on the signed-out view the header "Close" (`invite/index.tsx:285`) and the foot "Not now" (`:295`) look alike. "Not now" clears the stored link (`:211-214`); "Close" only closes the sheet (`useCloseSheet`, `lib/auth/ui.tsx:59-67`). At the next cold launch `PendingInviteWatcher` reads the Keychain and pushes `/invite` again whenever a link is waiting (`lib/family/pending-invite-watcher.tsx:19-31`), for up to 14 days (`lib/family/invite-link.logic.ts:93`).
- A parent: taps Close because they are not ready (the baby is awake, they want to ask Mama first) and gets the join sheet back at every cold start for two weeks, with no word about why. Both buttons say they leave. (Code-read; the web's in-memory storage cannot keep the link across a reload, so the relaunch is a phone check.)
- Fix: one way out on the sheet whose meaning is said ("Not now" forgets it, a swipe or Close keeps it and says so once), or have the watcher open the sheet only once per link. A request to S04 for the second.

### Later

| # | Spec line | Built (817879d) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S59 Visual (1468): `askBody` in `footnote` `textMuted`; S57 (1409): the privacy line in a card | `askBody` ("You will both read every letter in the book. Join only if you know who sent you this link.") and `card.privacy` at `footnote` 14 pt (`components/family/join-ask.tsx:38`, `invite-card.tsx:40`), while the sign-in sheet's privacy line is `subhead` (P4 pass A10, `ui.tsx:181`) | the safety line before a consent is the smallest text on its screen | spec owner: extend the trust-copy floor (`subhead`) to both lines |
| L2 | S57 Visual (1409): the pending row "Your co-parent"; people as signatures | a co-parent who set no sign-off reads "Your co-parent" over "Co-parent" (`family-tab.logic.ts:52-56`, probe) and a pending row ignores the sign-off the inviter typed (`:65`, #314's own decision) | a near-repeat; the typed name does not show until they join | spec owner: one word under the signature when it already says "co-parent" |
| L3 | S57 (1409): "Invited, open until October 23" | "Invited, open until Thu, Oct 22" (`familyCopy.members.openUntil`, S04's `inviteOpenUntil`) | a weekday and a short month | recorded in #314; S04 to settle |
| L4 | S58 errors (1433), S52's voice rule (line 1260) | `errors.rate_limited` "That's a lot of invites for one day. You can send more tomorrow." (`family.en.ts:195`); `errors.used` "... Ask for a new one if that wasn't you." (`:190`) | the first judges the parent the way S52's "That's a lot of emails for one hour." did; the second hints at someone else using their link | content owner: "You can send more invites tomorrow." and "... Ask for a new one." |
| L5 | S59 States (1472): each final error "with Close" | every final error, including "You're already part of this book.", offers "Paste another link" (`components/family/join-sheet.logic.ts:52`); the header Close is there | a parent who joined on another phone is offered a paste field | for `already_member` offer "Close" or open the book |
| L6 | S59 Visual (1468): both signatures on the flyleaf; a determinate bar | the opened cover shows only the inviter's "From Mama" and the bar is indeterminate (`join-ask.tsx`, declared in #314; P1 and S03 requests) | on the invitee's own joined screen the book is signed "From Mama" above a field that says "Papa" | already requested; check on a phone |
| L7 | S57 Motion (1411): the co-parent's row enters once with the 1.6 s wash; `left.note` fades in once and stays | `family.tsx:167-185`, `:268-281`, `components/family/member-row.tsx` | not verified in the browser: the probe's second pull did not replace the member list, so the leaving note was not seen | phone check S1-28 (a), with a second phone that leaves a test book (when Leave returns) |
| L8 | S57 States (1413): "offline (a tap shows the network line under the card)" | the card's button always opens the sheet (`family.tsx:196-199`); the offline line shows on the sheet after Share (probe: "This phone is offline. Try again once it is back online.") | the same words one screen later | spec owner: say what the sheet does |
| L9 | S58 Motion (1438): the foot line cross-fades after a 300 ms pause | `COVER_PAUSE_MS` 300 (`invite/new.tsx:57`); the cover reads "From Papa" once the typing stops (J21c) | as specified | none; a phone check for the cross-fade |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S57: the lit `family` room, the dateline (the child's name and age in small caps), "Who writes to Asha" in `title1`, "From Mama" over "You", the card with the closed cover, "Invite a co-parent" with UserPlus, and "Shared only with the other parent, if you invite them." with LockSimple | Accept. `J21-20.png`. No avatar, no email, nothing counted. |
| A2 | Two parents: no card, no Leave row; "From Mama / You" and "From Papa / Co-parent" | Accept. Probe on a fresh phone whose book arrives with two parents (`default/family-two-parents.png`); D-113. |
| A3 | A pending invite: "Your co-parent", "Invited, open until ...", "Share again" and "Cancel invite" in `accent` at 44 pt; Cancel asks "Cancel this invite? / The link will stop working." with "Keep it" first; "Invite cancelled." as the toast | Accept. `J21-23.png`, the alert seam. |
| A4 | S58: the closed cover (132 by 176) at the top, the signature field in the letter face, S06's chips, the cover's foot line reading "From Papa", `oneBook` and `linkNote`; the link carries no child name; only the token's hash reaches the server; the app sends nothing itself | Accept. J21c, `J21-21.png`. |
| A5 | S58 faults: offline, rate limited, not a parent, paused and a server failure each get their own calm line, with the sheet's primary kept | Accept (words); see L4 for one line. Probe. |
| A6 | S59 before sign-in: the paste view, a typed code not recognised and nothing sent, the signed-out view "You were invited to a book / You each write from your own phone, in the same book. / Sign in / Not now" with no cover and no names; zero requests to the server before sign-in | Accept. J21, J21e, probe at default, dark, AX5 and SE (no "Asha" or "Mama" anywhere on the signed-out sheet). |
| A7 | S59 ask and join: "Join this book as a parent?", "Invited by Mama" in the signature face (or "You were invited to write a book together." when the inviter set none), the safety line, "Join the book" and "Not now"; no child name; nothing joins until the tap | Accept. J21, `J21-04.png`, probe. See L1 for the line's size. |
| A8 | S59 failures: expired, used, cancelled, not found and two parents are final and drop the link; a rate limit, paused invites, a 503 and offline keep it and offer "Try again" | Accept. Probe table (ten rows) and J21f, J21b. See L4, L5. |
| A9 | S59 joined: the cover appears with the child's name for the first time and opens; "You're in Asha's book"; "Your letters and Mama's sit side by side, each signed."; a thin bar with no count while the book comes down; the signature field prefilled with the inviter's suggestion and the chips; "Open the book" the only way the open book changes | Accept. J21g, J21h, `J21-05.png`, `J21-06.png`. Departures as in L6. |
| A10 | Leave stays hidden (D-113): no row on the tab, no screen that links to the route (`LEAVE_BOOK_OFFERED` is false, `lib/family/entry.logic.ts`), and `/invite/leave` shows "Coming soon / Leaving a shared book is coming in a later update." | Accept. Probe `default/leave-route.png`. The S60 sheet is unreachable and was read from source only. |
| A11 | The kill path (server features off): the coming-soon Family tab and its sheet, unchanged; "I was invited" is not on the welcome | Accept. J17, J17b, J17c; `J17-01.png`. |
| A12 | Dark mode and a 375 pt phone: the Family tab, the invite sheet and the join views read well, with no clipped text; the lamp is a faint warm pool at the top, still | Accept. `dark/*.png`, `se/*.png`. |
| A13 | The welcome's two doors, and the welcome's hand-off: the sheet stays up while the book comes down; Open and Close hand over to the Book and leave first run (the allow-list) | Accept. J21g and J21h. The first-run follow-ups recorded in the brief are not re-raised. |
| A14 | The departures #314 declared: no typed code (D-120); the one-shot `joinedArrival` mark in place of a route param; the pending row reads "Your co-parent"; `errors.id_taken` takes the new words; `copy.family.subtitle` no longer shown | Accept all five. |

## 3. The departures #314 declared

| # | Departure | Ruling | Where |
|---|---|---|---|
| 1 | Link-only invites: a pasted code is not recognised (D-120) | Accept | A6 |
| 2 | The flyleaf shows only the inviter's sign-off; the bar is indeterminate | Accept for build 2; P1 and S03 requests stand | L6 |
| 3 | A one-shot mark for the Book's light, not a route param | Accept | A14 |
| 4 | The pending row reads "Your co-parent", not the inviter's typed sign-off | Accept; see L2 | L2 |
| 5 | `errors.id_taken` takes the new words | Accept; the spec line is confirmed | A14 |
| 6 | The welcome's hand-off is an allow-list in P2's file | Accept | A13 |
| 7 | Leave answers coming soon (D-113) | Accept | A10 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #314 body | the child-settings row still reads `soon.settingsRow` (a follow-up PR) | Recorded in the brief; not re-raised |
| #314 body | an invite link opened mid-first-run: "Open the book" stays in first run (a follow-up PR) | Recorded in the brief; not re-raised |
| #314 body | a returning parent's own book arriving over the join sheet can bury it (the same on develop) | Recorded in the brief; not re-raised |
| #314 spec owner | S60's quoted `leave.takeOutHelp` and `leave.done` differ from the merged words | Hidden sheet; settle before BL-444 |
| #314 spec owner | date format "Thu, Oct 22" against "October 23" | Later (L3) |
| #314 spec owner | the determinate bar and the two-signature flyleaf | Later (L6) |
| #314 body | S1-28 (b) still describes the old inference about `router.replace` on iOS | Recorded; phone check |
| D-113 | Leave is hidden until left books are listed (BL-444) | Accept (A10) |
| D-120, BL-445 | typed codes are not on the phone in build 2 | Accept (A6); #306 stays held |
| #310 and #360 | the sheet frame, busy buttons and error words P8b reuses | See the P8a pass |
| Recorded in the brief | sign-out wait follow-ups (BL-449 to BL-451); error words for passkey and zero-letter phones (BL-452) | Not re-raised |

## 5. Spec-owner changes

Line numbers are in `docs/design/EXPERIENCE_PASS_2026-10.md` on 817879d.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S58 Motion, 1438 | "When the share sheet closes, this sheet dismisses" | "When the share sheet closes after the link was sent, this sheet dismisses; if it was dismissed without sending, the sheet stays" | S1 |
| S59 States, 1472 | "joined, book still coming; joined and ready" | add: "while the book is coming the person stays on the sheet or the welcome says it is on its way; Close does not leave a fresh phone at 'Begin the book'" | S2 |
| S58 Visual, 1436 | the primary below the fields | "the primary is the sheet's footer, above the keyboard" | S3 |
| S57 Visual, 1409 | the cover at the card's right | add: "at accessibility sizes the cover goes above the title or is dropped" | S4 |
| S59 Motion, 1470 | views cross-fade; `success` once | add: "the joined heading takes VoiceOver focus (or is announced) once" | S5 |
| S59 acceptance, 1474 to 1478 | nothing on Close | add: "Close and Not now say whether the link is kept; one of them only" | S6 |
| S59 Visual, 1468 | `askBody` in `footnote` | "in `subhead`: it is the safety line before a consent" (and the card's privacy line the same) | L1 |
| S57 Visual, 1409 | "Your co-parent" in `textMuted` italic | "when the other parent has no sign-off, one line under the signature" | L2 |
| S57 States, 1413 | "offline (a tap shows the network line under the card)" | "offline: the sheet shows the line after Share" | L8 |

## 6. Motion, dark mode and text size

**Motion.** Durations are the tokens' (`fadeMs` 200, `exitMs` 160, `newMarkMs` 1600, `lamp.arriveMs` 1200). The join views replace each other in place with an opacity fade and no push (`join-ask.tsx` `JoinStep`, `fadeMs`), and the first view adds no entrance; the cover fades in (200 ms), holds, then opens (BookCover's `openOnMount`); the bar sweeps and rests still under Reduce Motion (`join-ask.tsx:70-76`). J21g shows "Open the book" landing on the Book and nothing pulling Tonight, Family or Settings back. The Book's light rising from 0 to 0.6 over 1.2 s once after Open, the co-parent row's wash, Cancel invite's collapse and the leaving note's fade are phone checks. No frame timings are claimed: the page-side opacity logger did not see Reanimated's web fades (the first frame already read 1.0), so fade times are from source, not measured.

**Dark mode.** `dark/*.png`: the Family tab shows a faint warm pool at the top (the still `family` scene), the card and rows read in ink on the dark paper, and the invite and join sheets match the P8a frame. Contrast, from the tokens: `textMuted` on `surfaceRaised` 5.83 (light) and 7.32 (dark); `accent` on `surfaceRaised` 5.82 and 7.64; the signature rows in `text` on the lit paper pass in both (the lamp test holds the rule, `apps/mobile/test/lamp.test.ts`). Increase Contrast (plain paper, no lamp) is a phone check.

**Text size (emulated).** The Family tab at AX5: the dateline, title and signatures wrap and nothing is clipped; the invite card breaks (S4). The invite sheet at AX5: the primary is 181 pt tall at 2507 pt down the scroll, reachable but a long scroll (S3). The join sheet at AX5: the footer goes inline, the cover and title stack, the signature field and chips wrap; the joined view's "Close" is the last item. On the 375 pt phone nothing is clipped; the primary of the invite sheet is below the fold (S3). The web tab bar's labels read as clipped at AX5 only because the emulation scales them; iOS does not (`(tabs)/_layout.tsx`, `tabBarAllowFontScaling: false`).

## 7. What we could not see on the web

Each check takes about two minutes on a phone; they sit beside DEVICE_TEST_PLAN S1-28 (a) to (e), which covers the Family tab, the two-phone invite and join, the joined sheet staying up, and Open and Close. Add:

1. **The dismissed share sheet** (S1). On phone A: Invite a co-parent, type "Papa", Share invite link, then dismiss the share sheet by tapping outside it. Record whether the invite sheet closes, whether a tick plays, whether the toast shows, and what the Family tab lists.
2. **Close before the book arrives** (S2). On phone B (a fresh install): open the link, sign in, Join the book, and tap Close the moment the joined view shows (before the bar finishes). Record what the screen shows and whether "Begin the book" is there.
3. **Close and Not now** (S6). On a second fresh install, open the link, tap the header Close, quit the app and open it again; note whether the join sheet returns. Repeat with Not now.
4. **VoiceOver on the join** (S5). With VoiceOver on, Join the book and listen: is "You're in Asha's book" spoken, and where does focus land?
5. **The invite sheet on a small phone** (S3). On an iPhone SE, type the sign-off with the keyboard up: is "Share invite link" visible?
6. **The invite card at AX5** (S4) and the join sheet at AX5, light and dark.
7. **The first Book** (A9, S1-28 c). After Open the book, the light rises once over about 1.2 s; with Reduce Motion it is lit at once and the cover is shown open.
8. **Increase Contrast and the lamp** (A1). The Family tab shows plain paper; switching tabs never re-arrives the light.
9. **The cover's opening and `success`** (A9). The cover fades in, holds 300 ms and opens; one success tick when the join returns.
10. **The leaving note** (L7, when Leave returns). Not reachable in build 2; skip until BL-444.

## 8. The constitution and the content rules, checked

- Nothing here writes, rewrites, summarises or shapes a person's words. A sign-off is what the parent types; the chips only fill the field. No engine is called.
- Before sign-in, no child name and no inviter on screen, and nothing asked of the server (BL-322): probe on the signed-out join sheet in four variants, J21's `restCalls` check. The ask shows only the inviter's sign-off. The child's name first appears on the opening cover. The share message keeps the child's name by D-113 item 3.
- `familyCopy` was diffed against the commit before #314: the changes are the CHG and NEW lines of S57 to S59, word for word. The registered kill-path `soon.*` lines are unchanged. 298 strings scanned (see the P8a pass): no non-ASCII, no gendered word for the child or anyone, no counting, no streak; "we" only in the inviter's own share message and the kill-path `soon.building`.
- No entry text, transcript, audio, child name, sign-off or invite token goes to analytics or logs from these screens (#314's body and `invite-link.test.ts`); the invite link is never stored, shown again or logged.
- Fictional family Asha and `example.invalid` addresses only. This document is ASCII only and uses none of the characters the content rules ban.

## 9. Coordinator's rulings

None yet. Ranks above are the critic's. Counts: Must 0, Should 6, Later 9, Accept as built 14. The fix-first three: S1, S2, S6.
