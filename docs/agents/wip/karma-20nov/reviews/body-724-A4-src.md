## Update 10 Nov Pacific (founder-approved words): new head 534d4e3200aecef136dd90eee0fa0c85baad5303

**Reviews A and B at 9ad188a9 are void at this head. A short re-check of the delta is needed.** One ordinary commit on top of 9ad188a9 (fast-forward, no force push, no rebase). Words only, no logic change. The founder approved the four changes below on Tue 10 Nov (Pacific); the other rows of the table further down were not changed.

1. `sheet.agreeLine` now reuses the registered `consent.terms.agreeLine` word for word: "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." It is typed once in `auth.en.ts` and both keys point at it, so they cannot drift.
2. `outage.title` is "Sign-in cannot be reached right now." and `offline.title` is "Sign-in needs a connection."
3. `outage.startLocalNote` is "Start the book on this phone for now. You can sign in later and choose to keep your letters in your account."
4. `outage.backOnline` is "You are back online."

Tests, code comments, the journey spec and the S1-201 device rows quote the new words. In this sandbox the same 8 mobile test files fail with and without the commit (missing `expo-clipboard` and `expo-local-authentication`, as before); `packages/content` passes (388), the four first-run mobile test files pass, and no typecheck error is in a file this commit touches.

## Update 11 Nov (review fixes): new head 9ad188a948be48cb5fd3e6d10f0a86a42fa6f72a

**Every earlier review of this PR (A and B at 3770cc94, and the ones at d4a9983b and before) is void at this head. Re-review is needed.** Draft stays draft. This head is `origin/develop` da83fb1e merged in (merge commit 62cd06ae, clean; #701, #722, #665, #703 and #716 are in it), then two commits: b7a261a2 (the fixes) and 9ad188a9 (one more assertion, for the last surviving mutation). Pushed as a fast-forward from 3770cc94: no force push, no rebase, no amend.

What changed, against the findings of Review A and Review B:

1. **Servers-off no-op is now true and pinned (A must-fix 1).** `useFirstRunRoute` reads one switch, `active = serverFeaturesEnabled() && auth.configured`. With it false: `listChildren()` is not called, the store `subscribe` is not registered, `expo-network` is not read or listened to (`useOnline(false)` and `recheck()` both do nothing), no restore timer starts, and `markPastWelcome` does not set state. New `test/use-first-run-route.test.ts` (25 tests) runs the real hook and `useOnline` on the repo's `test/helpers/mini-react.ts`, with the session, the book list, expo-network and the announcer replaced. It is adapted from Review A's probe. Mutations it kills are in the table below.
2. **A session lost during first run no longer drops the person's place (A should-fix 2).** The route hook now returns `screen` (`blank`, `welcome`, `outage`, `steps`) from the pure `firstRunScreen` (welcome.logic.ts). `FirstRunSteps` tells the route when it is past its welcome step (`onPastWelcome`, one effect), and from then on the steps stay mounted whatever the session, a failed attempt or the connection does, so the typed name and date are kept (route.logic.ts: "must keep Continue when the auth state moves under them"). On the welcome step a lost session is still the Welcome. Also: neither the Welcome nor the outage screen shows while the session is still being read (a signed-in person offline at launch no longer sees "Sign in needs a connection."; A nit).
3. **Outage screen, VoiceOver and honesty (B must-fix 1 and 2).** `OutageScreen` now uses `useArrival` (new, lib/first-run/use-arrival.ts): the heading block takes focus and the title is announced on arrival, and again if the offline variant becomes the outage one (StateScreen's live region is Android-only, lib/a11y.ts). "Sign in is back." moved into the route hook and is said only when the connection really changed under someone who was on the outage screen, never because Try again was tapped. Try again is now a real read of the connection: it awaits `expo-network`, ignores taps while a read is under way, returns to the Welcome if the connection is there, and if the phone is still offline it says "Sign in needs a connection." and stays. A late read can no longer overwrite a newer connection event (`useOnline` keeps the newest word). The visible busy look on the button needs `loading` on `StateScreen`'s action, which is `design-systems`' file: hand-off below.
4. **"I was invited" and the second `familySurfacesShown` (A should-fix 4, B note 7).** `lib/family/surfaces.logic.ts` is deleted (it held `CO_PARENT_IN_STORE_BUILD`, a second `familySurfacesShown` that disagreed with develop's `entry.logic.ts` in a servers-on store build, and the unused `inviteScreensBlocked`). The Welcome door is `invitedDoorShown`, which is exactly `visibleCoParentDoors(coParent, alpha).joinButton` (CTO ruling B12-5, the rule the old Welcome and S1-178 use): shown in a servers-on alpha, hidden in a servers-on store build, hidden with servers off. The screen now passes the raw `capabilities.coParent` (it used to pass `joinButton` back in, applying the rule twice, which made any flag behind it inert). `familySurfacesShown` exists once in the app, in `entry.logic.ts` (Family tab and Settings row, D-126); a test scans `src/` to keep it that way. DECISION FOR THE REVIEWER: develop's `familySurfacesShown` is `alpha || coParent`, which is true in a servers-on store build; using it for this door would show "I was invited" in the store build and contradict B12-5 and S1-178 (b). So the door follows the join rule, not that function. If the founder wants the door to follow the Family-surfaces decision instead (NX-38 R5, #720), change `visibleCoParentDoors` in entry.logic.ts so that the old and the new Welcome move together.
5. **Words (B must-fix 4, should-fix 1 and 2; A strings).** `firstRun.errors.rateLimited` and `.notAvailable` are removed (nothing could reach them: the gate sends a 429 and "not available" to the outage screen; a test pins that only `provider` is left). `outage.body` is now one short sentence and no longer repeats the note, so the shown paragraph says each thing once. `offline.body` now says what the screen does. Details in the strings table and PROPOSED WORDING below.
6. **Terms and Privacy links (B must-fix 3).** They are two quiet small `Button`s of 44 pt (`role="link"`, the existing "Opens in a browser inside the app." hint) under the agreement sentence, side by side and stacked at large text, as the age gate does, instead of nested text links. `open()` now has a `.catch`. Floating-link choice recorded in its own section below.
7. **Device test plan.** New row S1-201 in `docs/qa/DEVICE_TEST_PLAN.md` (plus one line in its server-on table). Ids S1-192 to S1-199 are proposed by branch `docs/qa-build12-cut-9nov` and S1-200 is #720's, so S1-201 is the first free id (git grep over every remote branch; no open PR patch adds another).
8. Comment fix: route.logic.ts no longer says the switch is read nowhere else on the path.

## Stacked on, and where it stands
Slice 2 of account-before-book (NX-31 revision 3; NX-36 S2, S3), behind the existing server-features switch. #701, #722 (slice 1) and #665 are merged into develop; #720 and #737 are open and not ancestors. Draft.

## What is in it
- **S2 Welcome and sign in** (`components/onboarding/welcome-sign-in.tsx`), laid out as NX-36 S2: lockup, descriptor (heading, takes focus), body, benefit line; footer pinned at default sizes and inline at accessibility sizes; Apple's own button as "Sign in with Apple" (`AppleButton` gained a `signIn` prop, default unchanged) and "Sign in with email" (solid accent), both 56 pt; the agreement line with Terms of Service and Privacy Policy as two 44 pt links directly above them; "I was invited" where B12-5 allows it; last-method footnote; no password, name or phone field; "I already have a book" folded into the same two buttons. Calls the existing `useAuth().signInWithApple`, the existing `/sign-in/email` and the existing `/sign-in/consent` sheet. Inline errors for `wrong_code`, `invalid_email`, `provider` (and the other input-type kinds); a cancel shows nothing (A-REQ-031); network, 429, unavailable and unknown go to the outage screen through the gate. No credential logged, no analytics event, no new motion.
- **S3 Outage and offline** (`components/onboarding/outage-screen.tsx`): the existing `StateScreen` (error kind, glyph). Try again is the primary; "Start on this phone" (19 characters) is the quiet button, its sentence a note after the body, shown only where `firstRunGate` offers the button. Heading focus and an announcement on arrival.
- **Connectivity** (`lib/first-run/use-online.ts`, `use-first-run-route.ts`): `online` comes from `expo-network`, starts true, reads the OS's local state only. A reconnect sets the failed state aside and returns to the Welcome. Nothing retries sign-in by itself: sign-in is the person's tap. There is no timed back-off.
- **The route:** `onboarding.tsx` default export keeps its shape; `FirstRun` is the small wrapper that asks `useFirstRunRoute`; the old big component is `FirstRunSteps` (body unchanged except the `localStartChosen` prop, the `onPastWelcome` effect, the `doors` line and the gate call).
- With server features off (or a build with no sign-in settings) the gate answers `unchanged`, the route is `FirstRunSteps` as before, and the hook reads and listens to nothing (pinned by behaviour, see Tests).

## New dependency: NO
`expo-network ~57.0.2` is already in `apps/mobile/package.json` (used by backup and speech packs). No package or lockfile change, no new native module.

## Not in it (next)
S5 email-code screen, S6 consent sheet and S7 child step (the existing code and consent sheets still serve), merge-back wiring, analytics. **No 10 s timer on an in-flight sign-in (NX-40 U2): `signInWithIdToken` has no timeout in apple.ts, and `SIGN_IN_OUTAGE_MS` bounds only the Keychain read wait (`RESTORE_WAIT_MS`). After Apple's sheet returns, both buttons stay dimmed under "Signing you in" until the OS gives up. Not implemented on purpose; S1-201 (g) records how long it takes on a device.**

## New or changed visible strings
Keys are in `authCopy` (`packages/content/src/features/auth.en.ts`); the two buttons are registered in the copy-surfaces test (22-character rule). FIRST-RUN-WORDS = `docs/design/specs/FIRST-RUN-WORDS-10nov.md`; NX-36 = `NX-36-build-12-screen-specs.md` S2 and S3 (branch docs/nx-36-screen-specs-9nov). Both documents are DRAFT. **Rows marked "founder-approved 10 Nov" are done (the four changes of the update at the top); every other row still needs founder word approval.** None of these lines says a recording or the book is kept safe, backed up, or opens or comes with the person on any phone.

| Key | Text | Where shown | In FIRST-RUN-WORDS or NX-36 S2/S3? | Status |
|---|---|---|---|---|
| `sheet.bodies.sign_in_first` | Sign in to begin your book. | S2, the benefit line under the body | In neither. Both documents' lines for this slot say where the book goes or comes; none is used. Placeholder with `TODO(founder, counsel)` in the code | needs founder word approval |
| `sheet.agreeLine` | By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy. | S2, above the two buttons (the two document names follow as links, reusing `consent.terms.termsLink` and `.privacyLink`) | Now the registered `consent.terms.agreeLine`, byte for byte (NX-36 S2 had a shorter line without the 18-or-older confirmation) | founder-approved 10 Nov |
| `firstRun.errors.provider` | That sign-in did not finish. Try again, or try another way. | S2, inline under the buttons | NX-36 S2 yes; FIRST-RUN-WORDS 3.2 `didNotFinish` same words | needs founder word approval |
| `outage.title` | Sign-in cannot be reached right now. | S3 heading, outage variant | NX-36 S3 has "We can't reach sign-in right now." Changed: the content rules allow no "we" | founder-approved 10 Nov |
| `outage.body` | Try again in a moment. | S3 body, outage variant | CHANGED from NX-36 S3 ("Try again in a moment, or start the book on this phone and sign in later."), which named the local start even where there is no button, and repeated the note | needs founder word approval |
| `outage.retry` | Try again | S3 primary button | NX-36 S3 yes | needs founder word approval |
| `outage.startLocal` | Start on this phone | S3 quiet button (19 characters) | NX-36 S3 yes | needs founder word approval |
| `outage.startLocalNote` | Start the book on this phone for now. You can sign in later and choose to keep your letters in your account. | S3, after the body, only where the button shows | NX-36 S3 yes (marked R there: says where the book is) | founder-approved 10 Nov (counsel read still open) |
| `outage.backOnline` | You are back online. | VoiceOver announcement only, on a real reconnect under the outage screen | NX-36 S3 yes | founder-approved 10 Nov |
| `offline.title` | Sign-in needs a connection. | S3 heading, offline variant; also announced when Try again finds the phone still offline | NX-36 S3 yes | founder-approved 10 Nov |
| `offline.body` | Connect to the internet, then tap Try again. | S3 body, offline variant | CHANGED from NX-36 S3 ("We will try again when you are back online."; no "we", and the screen does not retry sign-in by itself). Close to FIRST-RUN-WORDS 3.2 `firstRun.auth.offline` ("No connection right now. Connect to the internet and try again.") | needs founder word approval |

Removed in this update (not shown anywhere any more): `firstRun.errors.rateLimited` and `firstRun.errors.notAvailable`.

Reused, not new: `sheet.email` ("Sign in with email"), `sheet.busy`, `sheet.lastMethod.*`, `onboarding.welcome.subtitle`, `.body` and `.joinButton`, `consent.terms.termsLink` and `.privacyLink` (the two link names), `beforeBegin.linkA11yHint` (the VoiceOver hint on the two links), and Apple's own button text ("Sign in with Apple", type SIGN_IN, per the 9 Nov ruling).

### PROPOSED WORDING (not final; the founder decides)
These are my proposals for the two strings I had to change and the two I removed. Nothing here is approved.

| Key | Old (at 3770cc94) | New (proposed) |
|---|---|---|
| `outage.body` | Try again in a moment, or start the book on this phone and sign in later. | Try again in a moment. |
| `offline.body` | It tries again by itself when you are back online. | Connect to the internet, then tap Try again. |
| `firstRun.errors.rateLimited` | Too many tries for now. Wait a few minutes, then try again. | (removed; nothing can reach it) |
| `firstRun.errors.notAvailable` | This way of signing in is not available right now. Try another way. | (removed; nothing can reach it) |

What a person reads on S3, with the local start offered (outage variant): heading "Sign-in cannot be reached right now."; body "Try again in a moment. Start the book on this phone for now. You can sign in later and choose to keep your letters in your account."; buttons "Try again" and "Start on this phone". Offline variant: heading "Sign-in needs a connection."; body "Connect to the internet, then tap Try again. Start the book on this phone for now. You can sign in later and choose to keep your letters in your account." Without the local start the body is the first sentence only. A test checks that no phrase of four words or more repeats in any of these.

Why: the first-run Welcome and outage lines say nothing about phones, backup or "kept safe" in my changed strings. The only "phone" left on S3 is NX-36's own button and note ("Start on this phone", "Start the book on this phone for now"), which say where the local book will be, not that it moves. If the founder wants no "phone" there, the option was a note of "Start your book here for now. You can sign in later to bring it to your account." (not applied; the founder chose the note in the table above). `sheet.bodies.sign_in_first` stays the placeholder "Sign in to begin your book."; the founder chooses the real line.

## The Terms and Privacy links float (decision recorded)
Terms of Service and Privacy Policy open the floating pages (`brand.web.terms`, `brand.web.privacy`), exactly as the consent sheet and Before you begin do. BL-575's acceptance asks for versioned links on the agreement line, and CR-60 (RULINGS) says a later build must link the versioned addresses (for example /legal/terms/0.9.0) because the consent record will say 0.9.0; that waits for the founder to release the CR-60 deploy hold. Follow-up (owner: mobile, with legal's list of addresses): switch this line, the consent sheet and Before you begin to the versioned addresses together (BL-577), in one PR, after the hold lifts. Not touched here: docs/legal. The two links are now 44 pt targets of their own.

## Differences from the spec that are not strings
- "I was invited" follows the B12-5 rule (hidden in a servers-on store build), as described above.
- S3's sentence under the local-start button is appended to the body, because `StateScreen` has no note slot (a `design-systems` follow-up).
- Try again is a real read of the connection with its taps ignored while it runs, but has no visible busy look yet (needs `loading` on `StateScreen`'s action, `design-systems`); there is no back-off timer. NX-36 S3 wants the button busy; this is the part not met.
- The Terms and Privacy links are separate 44 pt targets under the agreement sentence, not inline in it (the spec asks for 44 pt links and "agreement line then its two links" in the VoiceOver order).
- S2's `analytics` list in the spec (`auth_sheet_shown` and so on) is NOT sent: the brief for this slice said no analytics events.

## Shared files
`apps/mobile/src/app/onboarding.tsx` (also #721 and others in flight), `apps/mobile/src/lib/auth/ui.tsx`, `apps/mobile/src/lib/first-run/gate.logic.ts`, `packages/content/src/features/auth.en.ts`, `packages/content/test/support/copy-surfaces.ts`, `apps/mobile/test/lamp.test.ts`, `docs/qa/DEVICE_TEST_PLAN.md`. Not touched: `_layout.tsx`, `capabilities.ts`, `eas.json`, supabase, docs/legal, package.json and the lockfile. `lib/family/surfaces.logic.ts` (added by this PR before) is deleted; #737 adds its own file of that name, so there is no conflict whichever lands first.

## Tests
Run in a scratch worktree of this branch at this head (Node 22.23).
- **New and changed (69 tests, all pass):** `test/use-first-run-route.test.ts` 25 (new; the real hooks), `test/use-arrival.test.ts` 3 (new), `test/first-run-welcome.test.ts` 36 (was 26), `test/first-run-welcome-redteam.test.ts` 5 (was 4). Titles name the requirement (NX-31-R17, R18, R19, R22; NX-36-S2, S3; NX-38-R5).
- **Red before:** with the seven changed source files and `surfaces.logic.ts` put back to 3770cc94 and the new tests kept, 35 of the 69 fail (hook tests 18 of 25, welcome 15 of 36, red-team 2 of 5; `use-arrival` has no old module to fail). Green after.
- **Mutations, each made on the new code with the new tests kept and all four new or changed test files run (every one failed at least one test; the file was restored each time and the tree checked clean):** the six asked for: switch forced `true` (3 fail), `useOnline` ignoring `enabled` (at the call site 3, in the effect 2, in `recheck` 1), `wasOnline` never updated (5), the restore wait never expiring (timer sets nothing 1, read as 0 1), `hasLocalBook` forced false (3), `listChildren()` called with the switch off (2). More: store subscribe with the switch off (2); restore timer with the switch off (1); `markPastWelcome` setting state with the switch off (1, added in 9ad188a9, the one that had survived); "back" announced from Try again (2), to anyone (2), or never (5); Try again guard removed (1), still-offline not spoken (1), never sets aside (2); stale read overwriting a newer event (1) or events not superseding reads (1); `pastWelcome` ignored by the screen (3) or `markPastWelcome` inert (2); door rule `alpha || coParent`, `coParent` alone, or always hidden (4 each); door given `joinButton` as `coParent` again (1); `rateLimited` back (1); the old glued `outage.body` back (1); the old `offline.body` back (1); links back to default-size buttons (1) or `open()` without catch (1); `onPastWelcome` not passed (3) or never reported (1); the Welcome screen swapped for a blank one (1); outage arrival dropped (1) or announcing the body (1); `useArrival` never announcing (3), announcing every render (1), asking no focus (3); restoring no longer blanking the outage screen (3) or only the Welcome (2).
- **Related, pass:** first-run-gate 58, first-run-route 17, lamp 44, coparent-soon 35, store-family-tab 9.
- **Whole `apps/mobile`:** 249 files, 4687 tests; 241 files pass; 8 files / 72 tests fail, the same 8 files with the same counts as plain develop da83fb1e (245 files, 4618 tests, 72 failing; app-lock-wiring 1, capabilities 1, config 34, hosting-ios17 1, licences 2, preflight-production 1, privacy-manifest 21, store-sign-in-capabilities 11), all inside `expo config` evaluation or the lockfile walk because `expo-clipboard` and `expo-local-authentication` are not installed in this sandbox.
- `packages/content`: 17 files, 388 tests pass. `packages/core`: 34 files, 1237 tests pass. Root `npm test`: every other workspace passes; `apps/web` `test/qr.test.ts` fails here only because `qrcode-generator` is not installed locally.
- `cd apps/mobile && npx tsc --noEmit`: 5 errors, all `expo-clipboard` / `expo-local-authentication` in help-fallback.tsx and app-lock/controller.ts (identical on plain develop); none in a file of this PR.
- ASCII check of every added line against develop and against the previous head: 0 bytes >= 0x80 (no dash, curly quote, ellipsis or emoji).

## How it was checked
- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments): not all green here, only for the environment reasons above (mobile's 8 files as on develop, web's missing `qrcode-generator`); every workspace else passes
- [ ] `npm run test:db` passes: not run (no database change)
- [ ] `npm run typecheck` passes, including `apps/mobile`: ran `npx tsc --noEmit` in apps/mobile only; the 5 environment errors above and nothing else
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped (the two tests that imported the deleted `surfaces.logic.ts` now test the single rule in `entry.logic.ts`)

## The constitution and our rules
- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (this PR touches sign-in screens only)
- [x] Cleaning behaviour unchanged; `ENGINE_VERSION` not touched
- [x] No gate changed; capturing and typing are never gated
- [x] Copy lives in `packages/content` and no content rule failed; new copy is listed above for approval
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports (no analytics event, log, storage write or credential handling was added in any new file)
- [x] Tests and fixtures use the fictional family "Asha" only
- [x] No database change
- [x] The public product name comes only from `packages/brand`

## Not done, and hand-offs
- **design-systems:** `StateScreen` needs `loading` on its action (a visible busy look on Try again) and a ref to its heading (so focus can land on the heading itself; today `OutageScreen` focuses the block that holds it, whose first reachable element is the heading, which is unverified on a device, S1-201 (a), (c)).
- **E2E-12 and E2E-13b** still tap `onboarding.step.welcome`, `onboarding.welcome.signIn` and `onboarding.welcome.invited`, which the new Welcome does not have. Not changed here; which EAS profile runs them is not verified.
- **Not done (reviewer nits and B should-fix):** "Signing you in" has no `announce()` on iOS (B should-fix 3); the Apple button still appears after an async check, shifting the footer; a double tap on "Sign in with email" pushes two email sheets (same as the old sheet); first paint is the Welcome and then the offline screen after the async read; the Notes for Review document does not yet name the local start (B should-fix 5); `retryOnReconnect` in gate.logic.ts still says "back-off" in a comment of #722's file.
- **Founder:** word approval for the table above, the counsel read of the agreement line and the S3 note, and the CCO line for the outage and local-start disclosure.

## UNVERIFIED
No device or simulator run. Not checked: real Apple or email sign-in; the Apple button's "Sign in with Apple" artwork; VoiceOver order, focus and announcements (set by source and the hook tests; device row S1-201 a, c, d, e, f, h); where VoiceOver lands when the block is focused; Dynamic Type AX5 and the stacked links; the Welcome-to-consent hand-off (`router.push('/sign-in/consent')`); `expo-network` values and reconnect events on iOS; the SE 3 cold start and the footer height; the compliance-fence output.

## Screenshots
n/a (no device run; the Asha screenshots are a S1-201 record item).

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF


---
_Generated by [Claude Code](https://claude.ai/code)_
