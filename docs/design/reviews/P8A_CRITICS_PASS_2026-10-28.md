# P8a critics' pass: sign-in and Account (go/no-go B2-10)

Wednesday 28 October 2026. The experience critics' pass over package P8a of `docs/design/EXPERIENCE_PASS_2026-10.md` (v1.3): section 6 "P8 Server surfaces", chapter 7 screens S52 to S56 (the sign-in sheet, Continue with email, Check your email and opening the link, Before your book syncs, Account), journey J22, the sheet's entry points from the welcome and from Settings, and 5.8 rows 5b, 10 and 13. Read against `develop` at **817879d**, where P8a is merged as #310 (ce0e408) with its follow-ups #360 (925a67f) and #359 (ab97b1c). Every file:line below is at 817879d. `develop` has since moved to 989433b (#358 Delete account, #362 and #368, the P2 and P3 critics' passes); none of those commits touches a file this pass cites (checked by file name). Out of scope: Delete account (#358), P8c backup, restore and erase, typed invite codes (D-120). This pass critiques; it changes no app code, test or copy.

## 0. Verdict for B2-10 (P8a's share)

**Signed once the four Should items below (S1 to S4) are fixed or ruled by the coordinator, and the phone checks in section 7 pass. No Must item.**

P8a is close. The sheet is one title, one sentence, the ways in, the registered privacy line and "Not now", at all five entry points. "Not now" closes and leaves the Book exactly as it was (J22b). The errors that a service or a network causes say the letters are safe first, in the same words everywhere. The Terms and the sensitive-data steps carry every registered sentence byte for byte (checked against `ce0e408^`, section 8), "Keep on this phone" is exactly as big as "Agree and sync" at the default size, in dark mode, on a small phone and at AX5 (emulated), and a decline leaves the person signed in with nothing synced. The sign-out confirm says "Your letters stay on this phone." and is not styled as a warning. Nothing on these screens writes meaning or counts anything.

What a tired parent can still meet: a code screen with no way to leave it and a "Send a new email" button that cannot help after five wrong codes (S1, S2); two consecutive screens with the same headline, one of which asks for a different agreement (S3); and "Not set up yet" read out as a sentence when the invite sheet asks someone who skipped setup to carry on (S4).

| Rank | Count |
|---|---|
| Must before build 2 | 0 |
| Should before build 2 | 4 |
| Later | 9 |
| Accept as built | 15 |

The four to fix first: **S1** (a paused code and a fresh email), **S2** (the code step has no way out), **S3** (Terms and sensitive data share one title), **S4** ("Not set up yet" as a sentence).

## 1. How this was looked at

- A scratch worktree at 817879d with node_modules as a directory of symlinks to the main checkout's (no `npm ci`) and `@scribe/*` pointing at the worktree, a short TMPDIR, three fresh web exports built by the e2e global setup (server features off, the seed build, and the server-on build against a mock Supabase).
- The Playwright journeys j17-family, j21-coparent and j22-sign-in, `JOURNEY_SHOTS=1`, one worker, Chromium at 402 by 874 pt: **17 of 17 passed** (27 min on a loaded machine). Screenshots stay in the session scratchpad, not in git (COORDINATION section 8): `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/critics-p8-shots/` (`journeys/`, `default/`, `dark/`, `ax5/`, `se/`).
- A scratch probe (never committed) against a patched copy of the server-on build: a font scale reported to the app (so `useIsAccessibilitySize()` runs; the footer goes inline and the cover steps aside), every px font size scaled by RN's multiplier (AX5 3.571) with the token caps (title2 2.0, title1 1.8, display 1.6, letterDateline 2.4), dark mode (`prefers-color-scheme`), a 375 by 667 pt phone (SE), the alert seam (react-native-web's `Alert` does nothing, so the probe records it), and the fault states from the screens' tables: an invalid address, offline, rate limited (429), a server 500, a wrong code, five wrong codes (the 15 minute pause), a new email after the pause, Terms then sensitive data, the age step (Yes and No), the claim step, Not now at Terms, the sensitive-data decline, "Finish setting up", Account signed out and signed in, the kill path (a build with no project settings). The AX5 text size is an approximation, not iOS Dynamic Type.
- Read from source, against each screen's spec lines: `lib/auth/ui.tsx`, `(auth)/_layout.tsx`, `sign-in/index.tsx`, `email.tsx`, `code.tsx`, `verify.tsx`, `consent.tsx`, `settings/account.tsx`, `lib/auth/errors.logic.ts`, `lib/auth/session-provider.tsx` (the code pause), `lib/a11y.ts`, `components/ui/{button,text-field,list-row}.tsx`, and every string these screens read (298 strings dumped from `packages/content`: `authCopy`, `familyCopy`, `en.trust.signIn`, `en.sensitiveConsent`, `en.auth`, `en.common`, `en.onboarding.signsAs`, `en.onboarding.welcome`).
- Read: CLAUDE.md, EXPERIENCE_PASS section 6 P8 and 5.8, DESIGN_LANGUAGE, MOTION 5i and 6, COMPONENTS 0.1, 2.7, 2.12, 2.13, VOICE.md, BRAND.md, `docs/legal/in-app-disclosures.md`, DECISIONS D-113 and D-120, the bodies of #310, #314, #359 and #360, `docs/qa/DEVICE_TEST_PLAN.md` S1-27 and S1-28, and the P4 pass as the model.

The web preview is a stand-in. It has no haptics, no VoiceOver, no iOS sheet or keyboard, no native stack animation, no Sign in with Apple or Google (the web shows only "Continue with email"), no passkeys, no universal links, and its secure storage is an in-memory map. Where that limits a finding, the finding says so; section 7 lists what is left for a phone.

## 2. Findings, ranked

### Must before build 2

None. Nothing on these screens blocks a parent from their letters, mixes the two agreements, hides a decline or adds a word to a letter.

### Should before build 2

**S1. After five wrong codes, "Send a new email" looks like the way through and is not.**
- Spec: S54 States (line 1333) "paused 15 minutes"; `errors.code_paused` (line 1278) "Your letters are safe. You can try a code again in 15 minutes."
- Built: five wrong codes within 15 minutes pause entry for that address in the app, before any request goes out (`apps/mobile/src/lib/auth/session-provider.tsx:388-392`; the wrong codes are forgotten only when a code succeeds, `:396`). The code step then makes the field read-only (`code.tsx:85`, `:216`) but keeps "Send a new email" on once the minute's wait is over (`code.tsx:249`). Sending clears the line (`code.tsx:128`) and makes the field editable again (`:216`), and `resend` does not clear the wrong-code list.
- A parent: types the wrong code five times at 11 pm (an old email, a typo), reads "You can try a code again in 15 minutes.", waits the minute, taps "Send a new email", reads "A new email is on its way.", types the new, correct code, and gets "Your letters are safe. You can try a code again in 15 minutes." again, with no request sent. Probe: after the pause the field was not editable; after the new email it was editable; the right code produced 0 verify requests and the same line (`default/code-paused-after-right-code.png`).
- Fix: while paused, say what a new email does not do, or take "Send a new email" out of the offered actions until the pause ends and point at "Use Apple or Google" (the line for a rate limit already does); or have a successful send clear the pause for that address if S01 allows it (a request to S01; the server's own limit still holds). Amend S54's States line to say which.

**S2. The code step has no way out of the sheet and says nothing about the letters.**
- Spec: S52 acceptance (line 1297) "Not now always closes", for S52; S54 (lines 1316 to 1337) names no exit. The brief for this pass: the sign-in must never be a wall in front of a parent's letters.
- Built: `code.tsx:149-159` renders a `SheetFrame` with neither a Close nor a Back (`ui.tsx:94-102` draws a header only when `closeLabel` or `onBack` is passed). The only ways out are "Use a different email" (`code.tsx:255-263`, back to the email step), then Back, then "Not now" on the first step, or a swipe down. "Trouble signing in?" opens a line about the spam folder (`en.auth.noEmailHelp`) and does not mention the letters.
- A parent: waiting for an email that is slow to arrive is the likeliest moment to feel stuck, and the screen offers a code field, "Continue", "Send a new email", "Use a different email" and "Trouble signing in?". None of them says "you can leave and your letters are still here" (`J22-08.png`).
- Fix: a quiet "Not now" under "Trouble signing in?", with S52's rule (it closes and changes nothing); add the line to S54. One sentence, if the coordinator prefers words to a button: `errors.network`'s first sentence, "Your letters are safe on this phone.", under the code field while waiting.

**S3. Terms and sensitive data carry the same title, so the second step looks like the first one again.** (Counsel-gated.)
- Spec: S55 (lines 1339 to 1360): `consent.terms.*` and `sensitiveConsent.*` KEEP verbatim; "Steps inside one sheet are one act, so they cross-fade in place" (line 1252).
- Built: both steps read "Before your book syncs" (`auth.en.ts:125`, `strings.en.ts:882`) in the same `SheetTitle` (`consent.tsx:291`, `:372`). The probe found the same single heading on the sensitive step in all four variants. The two steps ask for different things: the first for the Terms and the age line, the second for the person's health-related words to be stored on a server, with an equal "Keep on this phone".
- A parent: taps "Agree and continue", watches the body change under the same headline in 200 ms, and may read the second screen as the first one reloading or as a repeat of what they just agreed to. The brief asks that the two steps be clear and separate: the buttons are, the headline is not (`J22-40.png`, `J22-41.png`).
- Fix: not P8's to word (counsel-held, byte-identical). Ask counsel whether the sensitive-data step may take a different title (for example one that names the choice), or whether a quiet one-line cue outside the registered text is allowed between them; until then the cross-fade is the only cue. Record the answer in S55.

**S4. The invite and join sheets say "Not set up yet" as a sentence.**
- Spec: S56 (line 1374): `account.sync.waiting` becomes "Not set up yet" as the value of Account's Sync row. S57 (line 1400): `card.finishSetup` "Finish setting up your account to invite someone."
- Built: `AccountGate` (`lib/auth/ui.tsx:296-364`, P8a's file, read by P8b's invite, join and leave sheets) puts that row value in a body line, above "Finish setting up" (`ui.tsx:329`). Probe: a parent who signed in and tapped "Not now" at Terms, then "Invite a co-parent", sees "Invite Asha's co-parent / They can write to Asha and read the whole book, from their own phone. / Not set up yet / Finish setting up". The better sentence exists in `familyCopy.card.finishSetup` and the Family tab's card already uses it.
- A parent: reads "Not set up yet" and does not know what is not set up. The same gate shows "If you keep it on this phone, syncing and sharing stay off." (the registered `sensitiveConsent.declineHelp`, `ui.tsx:343`) to a person who already chose to keep it, which reads as a question about a choice already made.
- Fix: say the reason in the gate's own words, as a sentence about the invite ("Finish setting up your account to invite someone." in the invite sheet, and the join sheet's equivalent), keep the row value for Account only. The declined line is counsel's; the gate may show it only where it reads as a status, otherwise show nothing above "Agree and sync".

### Later

| # | Spec line | Built (817879d) | What a parent meets | Fix |
|---|---|---|---|---|
| L1 | S52 Motion (1289), MOTION 6: "No haptic" for an account | the provider buttons play `tap` (`lib/auth/ui.tsx:199`, `:260`); the file's header says "only the provider buttons' own tap" | a selection tick as a sign-in starts, which the spec says not to play; the #310 departures list does not declare it | spec owner: accept and amend, or drop both calls |
| L2 | S52 Visual (1287): a native sheet fit to contents, large at accessibility sizes | `(auth)` is a page-sheet `modal` (`lib/transitions.logic.ts:54`); the sheet is mostly empty paper between the buttons and the foot (`J22-01.png`) | on a phone, a near full page for two lines and a button; recorded as a request to P1 in #310 | P1's route option; check on a phone (section 7) |
| L3 | S55 Age (1352), LEGAL-REQ-002 | answering No and Continue ends the session and closes the whole app to the stop screen, with no way back for 24 hours (`consent.tsx:304-326`, `session-provider.tsx:299-312`, `lib/age-gate.ts:27-37`); probe: body "Early Letters is currently for adults 18 and over" at `/` | a mis-tap on No by a parent who already has a book locks their letters for a day; reachable only when the Terms are current without the age line (an older account) | legal and the coordinator to rule; if it stays, one calm "Are you sure" is a new registered line, so counsel's |
| L4 | `errors.network` (line 1276) | a server 500 on "Send link" reads "Your letters are safe on this phone. Sign in once you are back online." (`lib/auth/errors.logic.ts:27`, supabase-js reports a 5xx as a retryable fetch error); probe | a parent who is online is told to get online. Distinct from BL-452 (words wrong for passkey and zero-letter phones) | S01: map a 5xx to `provider` or `unknown`, which read "That did not work this time." |
| L5 | COMPONENTS 0.1 (screen readers); TextField (a11y.ts `announce`) | the notes "A new email is on its way.", "Passkey added." and "Other devices are signed out." use only `accessibilityLiveRegion` (`code.tsx:239-243`, `settings/account.tsx:234-238`), which is Android-only; `announce()` is what iOS needs (`lib/a11y.ts` header, and `ErrorLine` calls it, `ui.tsx:142-144`) | a VoiceOver parent taps "Send a new email" and hears nothing; cross-cutting (the same pattern is in many other screens), unverified on a phone | call `announce(note)` with the note, or give Toast's pattern to these two; check on a phone |
| L6 | S52 (line 1291) "offline" state; `errors.network` | for a signed-in person on a phone that launched offline, the invite gate says "Your letters are safe on this phone. Sign in once you are back online." (`ui.tsx:348-361`) | "Sign in" to someone already signed in | use a line that says the connection (new key) |
| L7 | S55; `claim.keep` | the claim step's primary is "Keep them here" (`auth.en.ts:94`, `consent.tsx:208-216`) under "Keep your letters in this account?" | "here" can be read as this phone; it is this account | "Keep them in this account", or "Yes, keep them" (not S55's, BL-347's words) |
| L8 | COMPONENTS 0.1 "buttons grow taller instead of clipping" | at AX5 (emulated) the full-width pill buttons become ovals three lines tall (`ax5/sheet-sign_in-full.png`) | readable, but the shape is odd | P1: a smaller radius when a label wraps |
| L9 | S52 acceptance (line 1297), recorded in #310 as A6 | "Not now" is disabled while a sign-in runs (`index.tsx:111`) | during a slow Apple or Google sheet the only way out is a swipe, and swipe-to-dismiss is not blocked (#310 B6) | already recorded; phone check |

### Accept as built

| # | What | Ruling |
|---|---|---|
| A1 | S52: one title, one sentence, the ways in, the registered privacy line and "Not now" at all five entry points; the cover sits beside the title for `first_letter`, `settings` and `invite_create` and steps aside at accessibility sizes (`index.tsx:58`, `:120`) | Accept. J22 (all entry points), `default/sheet-*.png`. |
| A2 | S52 and the P8 rules: no "we" outside the registered privacy line; no "in this build"; the kill path says "Signing in is not available right now. Your letters are safe on this phone." with no buttons and "Not now" still closing | Accept. `default/sheet-notconfigured.png`. The body above it still promises what an account does; kill path only. |
| A3 | "Not now" closes and leaves the Book as it was; the first-letter sheet rises after the Book, never in place of Review (5.8 row 5b) | Accept. J22b: the Book, the letter, no request to the server. |
| A4 | The error lines: offline, rate limited and server failures lead with the letters; the wrong code, the invalid address keep their words; each is a line with a warning mark on its own chip, announced, no shake | Accept. J22, `email-offline`, `email-ratelimited`, `code-wrong`. Contrast: caution mark on the chip 4.09 (light, graphic, 3:1 needed) and 7.08 (dark); the line's ink on the chip 12.07 and 11.20; the field's caution text on paper 4.75. |
| A5 | S53: the field is `email-address`, `emailAddress`, `autoComplete` email, focused on arrival; "Send link" outlined until the text looks like an address; the invalid line shows on submit only and goes when the person types | Accept. J22 and the DOM probe. AutoFill offering an address is a phone check. |
| A6 | S54: the address the email went to is on screen in `text`; the code field is one-time-code, numeric, focused on arrival, submits at full length once, a wrong code clears and refocuses it, no shake, no red | Accept. J22 (one verify request, focus back), DOM attributes. |
| A7 | S55 Terms: the registered words, three document rows that open the in-app browser, the agree line directly above "Agree and continue" (measured: it ends 8 pt above the button at 402 and 375 pt wide), "Not now" quiet | Accept. The agree line at `subhead`, not `footnote`, is #310's declared departure (P1's trust-copy floor). `J22-40.png`, `dark/consent-terms.png`. |
| A8 | S55 sensitive data: `body`, `use`, the decline help and the change-later line, "Agree and sync" filled and "Keep on this phone" bordered, stacked, equal in size | Accept. Measured equal: 362 by 56 pt at 402 wide, 335 by 56 at 375, and 362 by 183 at emulated AX5 (both grow together); the Terms agree line is reachable by scrolling at AX5 (the footer goes inline). A decline records `sensitive-data:decline`, syncs nothing, and Account then offers "Agree and sync" (J22d). |
| A9 | S55 age step: the question as the title, Yes and No with neither selected, Continue disabled until one is chosen, nothing else | Accept. J22c, `default/consent-age.png`. See L3 for what No does. |
| A10 | S56 Account: signed out (cover, "Not signed in", the sheet's sentence, "Sign in"); signed in (the way in with its mark, the address, Sync and sharing, Devices, "Sign out" as a plain row); "Finish setting up" and "Agree and sync" rows; the sign-out confirm says "Sign out on this phone? / Your letters stay on this phone. Sign in again any time." with Cancel and Sign out, not destructive | Accept. J22c, J22d, probe (the alert seam recorded the title, message and buttons). |
| A11 | The registered words are byte-identical to the commit before P8a (`consent.terms.*`, `sensitiveConsent.*`, `trust.signIn.*`) | Accept. Section 8. |
| A12 | The claim step ("Keep your letters in this account?", masked address, "Keep them here", "Not my account") is outside S55's list but is S01's (BL-347) and shown after consent | Accept, with L7. |
| A13 | Chips and rows are 44 pt reach: the signature chips are 36 pt with 4 pt hit slop on each side (`components/ui/choice-group.tsx:14`, `:184`); every other control measured 44 pt or more | Accept. The probe's "under 44" list held only those chips and a web back link. |
| A14 | The departures #310 declared: trust copy at `subhead`; the error chip; stacked sensitive buttons; `declineHelp` shown; the agree line at the foot; the cover steps aside at AX; the code field's 1.8 cap | Accept all seven. |
| A15 | Dark mode and a 375 pt phone | Accept. `dark/*.png` and `se/*.png`: no clipped text, no text past an edge, paper and ink as the tokens say; the probe's overflow check found nothing outside the web tab bar at AX5. |

## 3. The departures #310 declared

| # | Departure | Ruling | Where |
|---|---|---|---|
| 1 | Trust copy at `subhead`, not `footnote` | Accept; the spec's "footnote" lines change | A7, A14 |
| 2 | The error line keeps a `secondary` chip (D-110) | Accept | A4 |
| 3 | The sensitive-data buttons stacked, equal | Accept | A8 |
| 4 | `declineHelp` stays on screen | Accept; see S4 for where else it is shown | A8 |
| 5 | The agree line at the foot, above the button | Accept; counsel's A3 note stands | A7 |
| 6 | The cover steps aside at accessibility sizes | Accept | A1 |
| 7 | The code field takes title1's cap | Accept | A14 |
| not declared | The provider buttons play `tap` | Later (L1) | L1 |

## 4. Every recorded gap, ruled

| Source | Item | Ruling |
|---|---|---|
| #310 spec-owner note | six errors that follow a failed attempt do not say the letters are safe | Done by #360 (the words now lead with it); Accept (A4) |
| #310 requests | `(auth)` as a fit-to-contents formSheet (P1) | Later (L2) |
| #310 requests | Account row subtitle in Settings home (P6, S40) | Not looked at: P6's file |
| #310 spec owner | `consent.terms.healthLink` returns 404 on main; the spec's condition "no later than #169" is past | Counsel and the coordinator; the row opens `brand.web.healthPrivacy` and its page was not checked here (unverified) |
| #310 follow-up A3 | the Terms acceptance sits at the foot, not "directly above the sign-in buttons" (LEGAL-REQ-001); `trust.signIn.email` and `why` are shown nowhere | Counsel and the spec owner; not re-raised |
| #310 follow-up A6, B6 | "Not now" waits while a sign-in runs; swipe-to-dismiss is not blocked while busy | Recorded; phone check (L9) |
| #310 follow-up B4 | the refocus after a wrong code may run before the field is editable on iOS | Phone check (section 7) |
| #310 follow-up B1 | a sign-out wait that never ends offline | Fixed by #359; the follow-ups BL-449 to BL-451 are recorded and not raised again |
| #310 follow-up | the typed address is held in memory after a link sign-in | Fixed by #359 |
| #359 | the person is not told when the wait ends early; "Stay signed in" and the waiting row's `s.sync` are follow-ups | Recorded (BL-449 to BL-451) |
| #360 known | `errors.expired` is returned for a passkey challenge; `rate_limited` and `provider` show on Account; "on this phone" lines read wrong on a phone with no letters | Recorded (BL-452) |
| #360 fix | a busy button is announced as busy, not dimmed | Accept; phone check |
| S52 to S56 | the first sign-in after the first kept letter (5.8 row 5b) | Accept (A3) |
| Recorded in the brief | opening the book after an invite link mid-first-run; the child-settings row label; a returning parent's own book arriving over the join sheet | Not re-raised (P8b's pass) |

## 5. Spec-owner changes

Line numbers are in `docs/design/EXPERIENCE_PASS_2026-10.md` on 817879d.

| Spec line | Says now | Proposed wording | Because |
|---|---|---|---|
| S54 States, 1333 | "paused 15 minutes" | add: "while paused, 'Send a new email' is not offered, and the line points at Apple or Google" (or the S01 change in S1) | S1 |
| S54 Visual, 1329 | no exit | add: "'Not now' as a quiet button under 'Trouble signing in?': it closes the sheet and changes nothing on this phone" | S2 |
| S55 Visual, 1352 | both steps keep their registered title | add the counsel ruling on a distinct title or a cue for the sensitive-data step | S3 |
| S56 and S57, 1374 and 1400 | `account.sync.waiting` is an Account row value | add: "in a sheet's gate the line is a sentence about what the person was doing" | S4 |
| S52 Motion, 1289 | "No haptic" | "the provider buttons play `tap`" or remove the calls | L1 |
| S52 Visual, 1287 | a native sheet fit to contents | record the route option the request to P1 will give it | L2 |
| S52 States, 1291 | offline | add the line a signed-in person sees | L6 |
| S55 Age, 1352 | Yes, No, Continue | add what No does to the whole app, if it stays | L3 |

## 6. Motion, dark mode and text size

**Motion.** The durations are the tokens' (`fadeMs` 200, `swapMs` 150, `newMarkMs` 1600, `lamp.arriveMs` 1200). Steps inside the sheet replace each other in place with an opacity-only fade (`(auth)/_layout.tsx:21`, `consent.tsx:64-82`); J22d walked Terms to sensitive data to Account with no push. The error line fades in over `swapMs` with no shake or haptic (`ui.tsx:54`, `:147-153`), also under Reduce Motion, because opacity is the Reduce Motion form (5.8 rule 6). The first-letter sheet rises after the Book (J22b), after `route.dissolveMs + 600` ms (`review-view.logic.ts:266`, P4's). No frame timings are claimed: the page-side opacity logger read 1.0 on the first frame of every faded line (Reanimated's web animations do not show in computed opacity), so fade times are from source, not measured. Haptics, the sheet's own rise, and the cross-fade as a person feels it are phone checks.

**Dark mode.** `dark/*.png`: the registered Terms and sensitive-data steps, the code step and the sign-in sheet read well; "Agree and continue" is paper-tone ink on the accent; the Apple button flips to its white style in dark (`ui.tsx:190-195`; not visible on the web). Contrast, from the tokens: caution on paper 4.75 (light) and 9.90 (dark); `textMuted` on paper 5.51 and 8.01; `accent` on paper 5.50 and 8.37; `controlBorder` on paper 3.62 and 4.47.

**Text size (emulated).** At AX5 the sheet's footer goes inline and scrolls with the content (`ui.tsx:88-92`, `:108`); the cover steps aside; "Continue with email" wraps to three lines (L8); the sensitive-data pair stays equal (183 pt each) and the Terms agree line stays directly above "Agree and continue", reachable by scrolling and never cut; the code field stays on one line (`code.tsx:38`). Nothing ran past an edge or was clipped in the probe except the web tab bar's labels at AX5, which iOS does not scale (`(tabs)/_layout.tsx`, `tabBarAllowFontScaling: false`).

## 7. What we could not see on the web

Each check takes about two minutes on a phone. DEVICE_TEST_PLAN S1-27 (a) to (g) already covers the first-letter sheet, the equal buttons at AX3 and AX5, the Terms line at AX5, VoiceOver on the sheet and on Account, AutoFill and the Agree and sync step; run those, and add:

1. **Sign in with Apple and Google** (S52). On the welcome tap "I already have a book". Read the stack: Apple's own button first, then "Continue with Google", then "Continue with email", 56 pt, 12 pt apart. Tap Apple, cancel its sheet: no line appears. Tap Google, cancel: no line. Tap Google and, while the sheet shows, see whether "Not now" is dimmed (L9). Note whether each provider tap gives a tick (L1).
2. **The sheet's shape** (L2). Is it a full page or a fit-to-contents sheet? Does it grow to large at AX5? Does a swipe down close it and leave the welcome or Book as it was?
3. **The paused code** (S1). Request an email, type five wrong codes, wait a minute, tap "Send a new email", type the new code. Record what the screen says. (The web proved the app side; this checks the server's own limit.)
4. **The code step's way out** (S2). With the email slow to arrive, see how many taps it takes to leave the sheet.
5. **VoiceOver notes** (L5). On the code step tap "Send a new email" and listen for "A new email is on its way."; on Account tap "Sign out of other devices" and listen for "Other devices are signed out."
6. **Terms to sensitive data** (S3). Sign in with a new account, read the two steps aloud with VoiceOver, and note whether the repeated headline confuses.
7. **Sign out** (S56). Sign out with a queued letter: the row says "Your newest letters are still on their way. This phone signs out once they are sent." with a spinner and is spoken once (S1-27 e); the native confirm reads as in A10.
8. **Dynamic Type and Reduce Motion.** The AX3 and AX5 passes of S1-27 (b) and (c), and the 200 ms fade between steps with Reduce Motion on.

## 8. The constitution and the content rules, checked

- No screen here shows, writes, rewrites or summarises a person's words; no engine is called. Nothing says software wrote, fixed up or improved anything.
- The registered texts are byte-identical to the commit before P8a (`git show ce0e408^`): `consent.terms.*` (a diff of the block is empty), `sensitiveConsent.*` and `trust.signIn.{why,privacy,email}` (block comparison: identical). #360 changed no registered line.
- 298 strings from `authCopy`, `familyCopy` and the shared keys these screens read were scanned: no non-ASCII character, no em or en dash, no curly quote, no ellipsis character, no emoji; no gendered word for the child or anyone; no streak, count or gap language. "We" appears only in `sheet.privacy`, `sheet.emailUse` and `consent.terms.body` (registered), the kill-path `soon.building`, and the inviter's own share message (D-113).
- "Your letters are safe" is the reassurance in nine lines (the kill path and eight errors); no line uses the banned words (hack, breach, leak, secure vault, "don't worry").
- No entry text, transcript, audio or child name goes to analytics from these screens: the only calls carry the entry point (`auth_sheet_shown`, `auth_deferred`, #310's source test). Tests and this document use the fictional family Asha and `example.invalid` addresses only.
- This document is ASCII only and uses none of the characters the content rules ban.

## 9. Coordinator's rulings

None yet. Ranks above are the critic's. Counts: Must 0, Should 4, Later 9, Accept as built 15. The fix-first four: S1, S2, S3 (counsel), S4.
