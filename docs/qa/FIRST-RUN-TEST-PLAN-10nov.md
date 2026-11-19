# First run and sign-in: test plan (10 Nov 2026)

Owner: qa. Branch `docs/first-run-test-plan-10nov`. Docs only: nothing here has been run, and no test file is written yet. Scope tiers (from the shared brief; the journey lead proposes, Karma rules): **A** must-have for Build 12 (auth entry, returning user, lock offer correct), **B** stretch behind a flag (short story intro), **C** later (richer animation). Founder rule: if an account-first gate is open on decision day the on-device binary ships and account-first becomes 1.0.1; the tier A rows below are what decides that.

Labels: **V** read in this repo this session (file named). **U** UNVERIFIED. **P** pending the product doc: the NX-xx branch `docs/first-run-requirements-10nov` did not exist on origin when this was written (checked with `git ls-remote`), so every requirement link below is an existing R-id or `NX-pending`.

## 1. What the repo has today (V)

- Onboarding: one screen, steps `welcome, promise, child, signsAs, finish` (`apps/mobile/src/app/onboarding.tsx`). There is no story intro. Every story row (FR-S*) is tier B or C and needs a new component.
- Sign-in routes: `(auth)/sign-in/{index,email,code,verify,consent}.tsx`. Providers in `src/lib/auth/`: `apple.ts`, `google.ts`, `email.ts` (code and link), `passkey.ts`. The passkey link shows only when `passkeysAvailable()` (V, `sign-in/index.tsx`). Apple 4.8 duty is U (brief); the repo offers Apple and Google both, so Apple stays.
- Error kinds: `errors.logic.ts` `authErrorKind` (cancelled, network, wrong_code, expired, other_phone, email_wait, rate_limited, invalid_email, not_available, unknown); client pause after 5 wrong codes in 15 min (A-REQ-027).
- Auth state: `machine.logic.ts` (`restoring`, `consentSteps` terms/age/sensitive, `canSync`, `signOutWouldWait`); consent screen records `age_attested: true`; "No" on age ends the flow.
- Lock: `lib/app-lock/machine.ts` (off until chosen, locks on cold start and after grace of Immediately / 1 min default / 5 min, never during a take, passcode removed turns lock off), `components/app-lock/lock-offer.tsx` (offered once on "The book is open.", testIDs `appLock.offer.turnOn`, `.notNow`, `.faceIdDenied`).
- Co-parent "coming soon": `components/family/coparent-soon.tsx`, `lib/family/entry.logic.ts`; test `test/coparent-soon.test.ts` exists. Today the soon state shows when server features are off (`capabilities.ts`); Build 12 has servers on, so the product rule "co-parent shows coming soon" needs a flag or entry.logic change. That is a gap, see RF-07.
- Not in the repo (V, grep of `src/lib/auth` and `(auth)`): **no region block, no under-18 age-of-majority check beyond the attestation, no private-relay handling, no story intro, no "account deleted, sign in again" screen**. Rows for these say "needs design" and are red-first the day a design exists.
- E2E: 20 Maestro flows in `apps/mobile/e2e/flows` (E2E-01 to 17); none has run (`e2e/README.md` section 1: testIDs, e2e build profile and backend missing). E2E-12 covers email code sign-in and needs a backend.

## 2. Strategy by layer

| Layer | Where and how | Runs | Use for |
|---|---|---|---|
| L: pure logic | `*.logic.ts` plus `apps/mobile/test/<area>-*.test.ts` or `src/**/*.logic.test.ts`, vitest, no React Native | `npm test`, every PR | story timer and gesture reducer, route decision, error mapping, lock decisions, timing budgets as constants |
| W: wiring | vitest with the repo's existing fakes (as in `app-lock-wiring.test.ts`, `welcome-handoff.test.ts`, `age-gate-screen.test.ts`); asserts what a screen calls and renders from fake auth, no simulator | `npm test` | screen shows the right button when state X; Back and Skip call the right route; a failure does not write |
| E: Maestro | `apps/mobile/e2e/flows/E2E-18..22-*.yaml` (next free numbers; E2E-16 and 17 are used) with the `tags:` header style of E2E-12; selectors via `TESTID_REQUESTS.md` | nightly, once the e2e profile exists | whole-journey order, relaunch and kill, offline airplane mode, clock seam |
| D: device only | run sheet section 7 | founder phones | Face ID, Apple and Google sheets, real mail, rotation feel, haptics, Dynamic Type, VoiceOver, low power, thermal, cold start timing |

Rules: every title that proves a requirement starts with `[ID]`; fixtures use Asha; no test asserts a hard-coded public name (use `packages/brand`); a failing test is fixed in code, never loosened. Animation: logic is tested as a pure timeline (durations in `lib/motion.ts` constants, one reducer); how it looks is D-only, said plainly in section 7.

Fault injection for W and E: fake `AuthPort` returning `{error}` by kind; fake clock (the E2E clock seam from E2E-01a); fake `LocalAuthentication`; fake `AppState`. If the e2e seams for offline and clock are not on develop, the E row is blocked and the W twin carries the proof.

## 3. Scenario catalogue

Columns: Id; Precondition; Steps; Expected; Layer; Tier; RF = red-first (write the test before the code). Ids: FR = first launch and story, SU = sign up, LI = log in, ER = errors, LK = lock, RS = restore, CS = cold start, A11 = accessibility, CP = co-parent. All "Expected" lines also mean: nothing is written to the book, no letter, no transcript and no child name in any log or analytics event.

### 3.1 First launch and story intro

| Id | Precondition | Steps | Expected | Layer | Tier | RF |
|---|---|---|---|---|---|---|
| FR-01 | Fresh install, no network | Open from icon | Splash then first screen with no network call; no OS prompt of any kind (F01-REQ-007) | E, D | A | no (E2E-01 covers) |
| FR-02 | Fresh install | Open | Order is: 18+ gate (E2E-01) or story then auth, as the journey doc fixes; nothing preselected. Mark P until journey doc | E | A | yes |
| FR-03 | Story on screen | Tap right half | Next slide, timer resets | L, W | B | yes |
| FR-04 | Story on screen | Tap left half | Previous slide; on slide 1 it restarts slide 1, never exits | L | B | yes |
| FR-05 | Story on screen | Press and hold | Timer pauses, UI chrome hides; release resumes from the same point, not the start | L, D | B | yes |
| FR-06 | Story on screen | Swipe left / right / down | Left next, right previous; down is ignored (no dismiss) unless journey doc says so; a half swipe snaps back | L, D | B | yes |
| FR-07 | Story on screen | Wait | Each slide advances at its duration; last slide ends on the auth entry, not a loop; durations are the motion-spec constants | L | B | yes |
| FR-08 | Any slide | Tap Skip | Goes to auth entry; Skip is reachable on slide 1 at once and is not delayed | L, W | B | yes |
| FR-09 | Auth entry reached from story | Back (swipe or button) | Returns to last slide or leaves the app cleanly; no dead end; no second story run after a finished first run | W | B | yes |
| FR-10 | Mid-story | Home, wait 5 s, return | Timer stays paused while inactive or background; resumes on the same slide; no skipped slides | L, D | B | yes |
| FR-11 | Mid-story | Rotate | Portrait locked, or layout holds and progress is kept (journey doc); no crash, no restart | D | B | no |
| FR-12 | Dynamic Type at AX5 | Open story | No clipped line; Skip is 48 pt or larger (CTO ruling 11 Nov); Back and Next remain 44 pt or larger (open for `design-systems`); slide may scroll but timer pauses while scrolling | D, W | B | no |
| FR-13 | Reduce Motion on | Open story | No parallax or zoom; cross-fade or static; auto-advance either off or slowed per motion spec; content still readable (`useReducedMotion` path in `lib/motion.ts`) | L, D | B | yes |
| FR-14 | VoiceOver on | Open story | Each slide is one element with its words; no auto-advance while VoiceOver is on (a person cannot read and listen in 5 s); Next and Skip are buttons with labels | W, D | B | yes |
| FR-15 | Dark mode | Open story | Every slide legible, tokens from `packages/design-tokens`; splash matches first frame (A-REQ-001) | D | B | no |
| FR-16 | Low Power Mode on | Open story | Animation falls back to static or reduced; no frame work above budget; story still advances | D | C | no |
| FR-17 | Story seen and finished | Relaunch | Story not shown again; returning user goes to auth or Face ID, not story | L, E | A | yes |
| FR-18 | Story flag off (tier B ships dark) | Fresh install | Goes straight to auth entry; zero story code path runs | L | A | yes |
| FR-19 | Story on screen | Watch 60 s of memory | No leak growth: slide assets released as they pass (measure in Instruments) | D | C | no |

### 3.2 Sign up and log in (providers in the repo: Apple, Google, email code and link, passkey when enabled)

| Id | Precondition | Steps | Expected | Layer | Tier | RF |
|---|---|---|---|---|---|---|
| SU-01 | Auth entry, servers on | Look | Sign in is required: no "continue without account" path; Apple, Google, email shown; co-parent surfaces not reachable | W | A | yes |
| SU-02 | New Apple ID | Continue with Apple, share email | Terms with 18+ line, then sensitive-data sheet, then first run; nothing syncs before both (LEGAL-REQ-001, PRD-REQ-002) | W, D | A | no |
| SU-03 | New Apple ID | Apple, Hide My Email (private relay) | Account made on relay address; the screen never shows the relay string as a name; email shown masked; code and link mails are not sent to it by us unless the relay accepts | L, D | A | yes |
| SU-04 | New Apple ID | Apple sheet then Cancel | Silent: back on the entry, no error banner (`cancelled`), no account | L | A | no (errors.logic covers) |
| SU-05 | New Google account | Continue with Google | Same consent chain as SU-02 | W, D | A | no |
| SU-06 | New email | Enter address, get code, enter 6 digits | Account made; consent chain; first run (E2E-12) | E, W | A | no |
| SU-07 | New email | Tap link from mail on same phone | Signs in (PKCE ok) | D | A | no |
| SU-08 | Email requested on phone A | Open link on phone B | `other_phone` words, one retry action | L | A | no |
| SU-09 | Passkey enabled build | Create passkey | Works or `not_available` quietly hides it | L, D | B | no |
| SU-10 | Consent screen | Age answer No | Ends flow, signed out, nothing synced, relaunch does not skip the question (under-18 path) | W, E | A | yes |
| SU-11 | Consent screen | Close app at terms, relaunch | Returns to consent, not the book (`needsConsent`) | L | A | yes |
| SU-12 | App killed after account made, before first run done | Relaunch | Signed in, resumes at the first-run step, no second account, no duplicate child (`auth-kill-path.test.ts` extends) | L, E | A | yes |
| SU-13 | Under-18 declared | See SU-10 | Decline line is human and has no scold; U: the repo has only the attestation, no age-of-majority by country | W | A | yes |
| SU-14 | Blocked region | Needs design | NX-pending; no region logic exists. Test written when the rule exists (Apple storefront? IP? U) | L | B | yes |
| LI-01 | Existing Apple account, same phone | Continue with Apple | Lands on book (or Face ID first if lock on); no consent repeat unless policy version changed | W | A | yes |
| LI-02 | Existing email | Email, code | Same as LI-01 | E | A | no |
| LI-03 | Existing Google | Google | Same | D | A | no |
| LI-04 | Provider mismatch: Google email already used by an Apple account | Google | One plain line, no leak of which provider (anti-enumeration); route to the right method only if the product doc allows | W | A | yes |
| LI-05 | Email already used at sign up | Enter existing address | Same code flow as login; no "this email exists" text (anti-enumeration); one path | L | A | yes |
| LI-06 | Account scheduled for deletion | Sign in | Shows the cancel-deletion choice (A-REQ and E2E-09 rule), never opens the book silently | W | A | yes |
| LI-07 | Account deleted for good | Sign in with same Apple ID | Treated as new account, no old data; Apple revoked state (`apple_revoked` sign-out reason) lands on entry with a calm line | L | A | yes |
| LI-08 | Session expired (refresh fails offline) | Open | Book stays readable offline (local-first); signed-out state shows only when the server says no, never from a network error | L | A | yes |
| LI-09 | Session expired, online, refresh rejected | Open | Signed out line, sign-in screen, unsynced letters stay on the phone and are shown as waiting (`signOutWouldWait`) | L, W | A | yes |
| LI-10 | Sign out with pending uploads | Sign out | Waits or warns as `signOutWouldWait`; no letter lost | L | A | no |

### 3.3 Errors and network

| Id | Precondition | Steps | Expected | Layer | Tier | RF |
|---|---|---|---|---|---|---|
| ER-01 | Code screen | Wrong code | `wrong_code` words, field kept, no lockout until 5 | L, W | A | no |
| ER-02 | Code screen | 5 wrong in 15 min | Entry paused 15 min, clock shown plainly; sixth try does not call server (A-REQ-027) | L | A | no |
| ER-03 | Code older than expiry | Enter it | `expired` words and a Send again action | L | A | no |
| ER-04 | Code screen | Ask for a new code twice fast | `email_wait` words; second send blocked with wait shown | L | A | no |
| ER-05 | Airplane mode | Tap any provider | `network` words, button re-enabled, no spinner forever | L, W, E | A | yes |
| ER-06 | Slow network (3 s to 30 s) | Send code | Spinner after 400 ms; button disabled while busy (no double send); at 30 s a timeout line, not silence | L, W | A | yes |
| ER-07 | Server 503 | Send code | NOT told to come back online (BL-488): "did not work this time" | L | A | no |
| ER-08 | Network drops mid code verify | Retry | One account, no duplicate consent row | L | A | yes |
| ER-09 | Invalid email typed | Submit | `invalid_email`, no server call if the shape is wrong | L | A | no |
| ER-10 | Apple credential revoked while signed in | Open app | Signed out with the calm line, local letters kept | L | A | no |

### 3.4 Lock offer, Face ID and returning user

| Id | Precondition | Steps | Expected | Layer | Tier | RF |
|---|---|---|---|---|---|---|
| LK-01 | First run finished | See "The book is open." | Lock offer appears once here, equal-weight buttons, never before sign-in and never again after either answer (CPO-2) | W | A | no |
| LK-02 | Offer showing | Turn on, Face ID success | Lock on, grace 1 min, offer gone | W, D | A | no |
| LK-03 | Offer showing | Face ID fails (wrong face x2) | Passcode sheet is offered by iOS; the offer stays, lock stays off until success | D | A | yes |
| LK-04 | Offer showing | Cancel the Face ID sheet | Offer stays, no error text, Not now still works (`faceIdDenied` only when permission denied) | W, D | A | yes |
| LK-05 | Face ID not set up or no biometrics, passcode set | Open offer | Button label says passcode, works via passcode (`o.turnOn[method]`) | W, D | A | yes |
| LK-06 | No device passcode | Open offer | Offer not shown or explains in one line; lock cannot be turned on (`readLockAbility`) | W | A | yes |
| LK-07 | Face ID permission denied in Settings | Turn on | `faceIdDenied` line with a route to Settings | W, D | A | no |
| LK-08 | Lockout after 5 biometric fails | Try again | iOS forces passcode; app does not loop prompts (`promptArmed` asks once per lock) | L, D | A | no |
| LK-09 | Lock on, cold start | Relaunch | Privacy cover at once, one Face ID prompt on its own, then book; no flash of the book (A-REQ and privacy cover) | L, D | A | no |
| LK-10 | Lock on, 30 s away, grace 1 min | Return | No lock; after 61 s: lock | L | A | no |
| LK-11 | Lock on, recording live | Grace passes | Waits until the take is kept; audio never stops | L | A | no |
| LK-12 | Lock on, app switcher | Open switcher | Cover shown, no letter or name in snapshot | D | A | no |
| LK-13 | Device passcode removed later | Open | Lock turns off with one notice | L | A | no |
| LK-14 | Returning user, lock off, signed in | Open | Straight to the book; no sign-in screen, no story, no offer (the offer was answered) | L, E | A | yes |
| LK-15 | Returning user, signed out by expiry, lock on | Open | Order is: no Face ID before sign-in (nothing to protect), then sign-in, then offer is not repeated | L | A | yes |
| LK-16 | Offer timing | Sign up, quit at "The book is open." before answering | Relaunch: offer shows once more, not twice in a row after an answer | L | A | yes |

### 3.5 Reinstall, restore, new phone, cold start, co-parent

| Id | Precondition | Steps | Expected | Layer | Tier | RF |
|---|---|---|---|---|---|---|
| RS-01 | Signed-in account with letters on server; delete app; reinstall | Sign in same account | Book returns; no new empty book; no consent repeat if current | E, D | A | yes |
| RS-02 | Reinstall, sign in as different account | Sign in | Empty fresh book for that account; the first account's data is not shown (device-wide Keychain token cleared on delete is U on iOS; Keychain survives reinstall unless cleared) | L, D | A | yes |
| RS-03 | S17 new phone (PR #764) | Sign in on new phone | Existing account path in S17 hand-off; no 18+ gate re-ask loop; the book arrives or "restoring" is shown | W, D | A | yes |
| RS-04 | New phone, no backup, no sync yet | Sign in | Honest empty state with a plain line, not "something went wrong" | W | A | yes |
| RS-05 | Restore from device backup on same-ID phone | Open | Local DB present, session likely stale; LI-08 applies | D | B | no |
| CS-01 | iPhone SE 3, release build | 10 cold starts | p50 at most 1.2 s, p90 at most 2.0 s to first frame of the entry screen (PRD 7.1, DEVICE_TEST_PLAN S1-03) | D | A | no |
| CS-02 | Same, signed in, lock off | 10 cold starts | Time to book visible: p50 at most 1.5 s [E, proposed, not a PRD number] | D | A | no |
| CS-03 | Same, lock on | 10 cold starts | Cover at first frame, Face ID sheet at most 0.6 s after [E, proposed] | D | B | no |
| CS-04 | Story on, SE 3 | Run through | 60 fps on 90% of frames, no frame over 50 ms [E, proposed; motion spec to confirm] | D | C | no |
| CP-01 | Signed in, servers on, store build | Look for every co-parent entry: a Family tab, a "Write this book together" row under Asha's book in Me, "I was invited" on Welcome, an invite link | None exists (founder, 11 Nov 2026): three tabs (Home, Book, Me) and no Family tab, no row, no "I was invited", no coming-soon screen anywhere; an invite link opens Home and keeps nothing; no invite can be created, accepted or confirmed; no network call to invite endpoints | W, E | A | yes |
| CP-02 | Deep link to `/invite/...` | Cold and warm | Lands on Home with nothing said (the first-run Welcome on a phone with no book yet), not the join sheet and not a blank or not-found page | W | A | yes |
| CP-03 | Me, Asha's book, store build | Scroll the whole page | No "Write this book together" row, no caption and no empty section where it sat; nothing to tap and no dead end (the coming-soon state this row once checked is gone, 11 Nov 2026) | W | A | no |

## 4. Accessibility checks (also the A11 rows)

| Id | Check | Layer |
|---|---|---|
| A11-01 | Every auth button has a label, role and 44 pt target; the provider buttons announce the provider | W (`a11y.logic.test.ts` style) |
| A11-02 | Focus moves to each step heading on change (TDD 09 A11Y-F09), including after Back | W, D |
| A11-03 | Error line is announced (live region) and not colour only | W, D |
| A11-04 | Code entry: one field, one-time-code content type so iOS suggests it, VoiceOver reads digits as typed | D |
| A11-05 | Dynamic Type AX5 on auth, consent, lock offer: no clip, scroll works, primary action reachable | D |
| A11-06 | Reduce Motion, Reduce Transparency, Bold Text, Increase Contrast, dark mode on every new screen | D |
| A11-07 | Switch Control / keyboard: tab order matches reading order | D |
| A11-08 | E2E-15 VoiceOver smoke extended to cover entry, consent and offer | E |

## 5. Red-first test list for the engineers

File names are proposals; create them empty with the failing cases first. PR #764 edits `gate.logic.ts`, `use-first-run-route.ts`, `onboarding.tsx`, `book.tsx` (those files are not on develop; fetch #764 before touching). Any row marked COLLIDES must be written as a new file and rebased on #764, not edited in the same file.

| File (under `apps/mobile/`) | Cases | Needs code in |
|---|---|---|
| `test/first-run-route.test.ts` | FR-02, FR-17, FR-18, LK-14, LK-15, LK-16, RS-03: one pure `firstRunRoute(state)` returns story, auth, consent, first-run step, lock offer or book | new `src/lib/first-run/route.logic.ts`. COLLIDES with #764 `use-first-run-route.ts`: agree one owner first |
| `src/components/story/story-timeline.logic.test.ts` | FR-03 to FR-10, FR-13, FR-14: tap zones, hold, swipe, auto-advance, background pause, reduced motion, VoiceOver no-advance | new `story-timeline.logic.ts` (tier B) |
| `test/story-flag.test.ts` | FR-18: flag off means no story import is evaluated | tier B |
| `test/auth-entry-required.test.ts` | SU-01, CP-01: entry has no skip when servers on; list of co-parent entries all render soon | `(auth)/sign-in/index.tsx`, `lib/family/entry.logic.ts` |
| `test/auth-entry-failures.test.ts` | ER-05, ER-06, ER-08, LI-04, LI-05, SU-04: fake port per kind, button state, no double send | `lib/auth/machine.logic.ts` |
| `test/auth-private-relay.test.ts` | SU-03: relay address masked, never used as a display name | `lib/auth/apple-token.logic.ts` |
| `test/auth-account-states.test.ts` | LI-06, LI-07, LI-09, SU-10 to SU-13: deleted, scheduled, expired, under-18 | `lib/auth/machine.logic.ts` |
| `test/lock-offer-outcomes.test.ts` | LK-03 to LK-07: success, fail, cancel, unavailable, denied, no passcode, with fake `LocalAuthentication` | `components/app-lock/lock-offer.tsx`, `lib/app-lock/controller.ts` |
| `test/lock-offer-timing.test.ts` | LK-01, LK-16: only after sign-in and first run, once | `lock-offer.tsx` |
| `test/coparent-soon-servers-on.test.ts` | CP-01 to CP-03 with `SERVER_FEATURES` on | `lib/family/entry.logic.ts`, `coparent-soon.tsx`. Existing `coparent-soon.test.ts` covers servers off only: do not loosen it |
| `test/first-run-restore.test.ts` | RS-01 to RS-04 | S17 code (#764) |
| `test/region-block.test.ts` | SU-14 | needs a decision, tier B |
| `e2e/flows/E2E-18-first-launch-to-book.yaml` | FR-01, FR-17, LK-14 with kill and relaunch | tags `p0-nightly`, add testIDs to `TESTID_REQUESTS.md` |
| `e2e/flows/E2E-19-sign-in-errors.yaml` | ER-01 to ER-05 (code from the e2e backend, airplane mode) | backend |
| `e2e/flows/E2E-20-lock-offer.yaml` | LK-01, LK-04, LK-09 (simulator can fake Face ID: enrol and match/non-match from Features menu; U whether Maestro 2.11 drives it) | none |
| `e2e/flows/E2E-21-reinstall-restore.yaml` | RS-01, RS-02 | backend |
| `e2e/flows/E2E-22-coparent-soon.yaml` | CP-01, CP-02 | none |

Test ids must be added to `apps/mobile/e2e/TESTID_REQUESTS.md` before the flow lands (`node apps/mobile/e2e/bin/lint-flows.mjs` fails otherwise).

## 6. Traceability

Existing R-ids used (V, from test headers in the repo): A-REQ-001/002 (splash, offline start), A-REQ-018 (code mail), A-REQ-027 (wrong-code pause), A-REQ-029 (no clipboard read), A-REQ-031 (error words), PRD-REQ-002 and LEGAL-REQ-001 (consent), PRD-REQ-019 and LEGAL-REQ-002 (18+ first), F01-REQ-002/005/007, CPO-2 (lock offered once, off until chosen), F17-REQ-010 (grace range), BL-488 (503 words), D-054, D-100.
NX ids: **pending**. When `docs/first-run-requirements-10nov` appears, `git fetch origin docs/first-run-requirements-10nov`, then add one column "NX / R id" and rename each test title to start with its id. Until then the catalogue ids (FR-, SU-, LI-, ER-, LK-, RS-, CS-, CP-) are the working ids and appear in test titles as `[FR-07]`. `scripts/trace.mjs` will not link them to a PRD row until then; this is a known gap, not hidden.

| Area | Existing R-id | NX |
|---|---|---|
| FR (story) | none (new) | pending |
| SU / LI | A-REQ-018, PRD-REQ-002, LEGAL-REQ-001 | pending |
| ER | A-REQ-027, A-REQ-031, BL-488 | pending |
| LK | CPO-2, F17-REQ-010 | pending |
| RS | S17 (#764) | pending |
| CP | D-100 notes, `capabilities.ts` | pending |

## 7. Device run sheet: FR-DEV (founder phones)

Follows `docs/qa/run-sheets/README.md`: drill identities only (drill child Asha, drill accounts "Drill Mama" and a spare mailbox, drill Apple Account A, never the family book). **Step 0 is the drill-phone check in that README (rule 3). If the phone holds a real family letter, stop: this phone cannot do the reinstall steps.** Time box: 45 min on one phone [E]; 15 min more for the second phone [E]. Plan state: Free, nothing kept. Build: the Build 12 candidate (servers on). Record in `docs/qa/evidence/<date>-<build>-<phone>.md`, rows FR-DEV.0 to FR-DEV.16. Proposed file name when accepted: `docs/qa/run-sheets/FR-DEV-first-run-and-sign-in.md` (not created here, to keep this PR to one file).

| # | Do | Expected | Min [E] | Capture |
|---|---|---|---|---|
| FR-DEV.0 | Drill-phone check, then delete the app | Pass, or stop | 3 | pass or stop |
| FR-DEV.1 | Airplane mode, install, open; screen-record | First screen, no prompt, no network. Cold start 10x for CS-01 | 8 | seconds, p50 and p90 |
| FR-DEV.2 | Story (if flag on): tap, hold, swipe, Skip, Back; Home mid-slide; rotate | FR-03 to FR-11 as written | 6 | video |
| FR-DEV.3 | Repeat story with Dynamic Type AX5, Reduce Motion, VoiceOver, dark mode, Low Power Mode | FR-12 to FR-16 | 8 | one screenshot per setting |
| FR-DEV.4 | Sign up with Apple, Hide My Email | SU-03; consent chain; first run | 5 | screenshot of Account (masked) |
| FR-DEV.5 | Lock offer: Turn on, fail Face ID twice (cover face), then use passcode | LK-02, LK-03, LK-08 | 4 | yes/no per row |
| FR-DEV.6 | Delete app and reinstall; sign in with the same Apple ID | RS-01 | 4 | book back? |
| FR-DEV.7 | Offer, Cancel on the Face ID sheet; later Settings > Face ID off for the app, retry | LK-04, LK-07 | 3 | screenshot |
| FR-DEV.8 | Lock on, 70 s away, return; app switcher snapshot | LK-09, LK-10, LK-12 | 3 | snapshot |
| FR-DEV.9 | Real mail: email code, then email link on the same phone; link on a second phone | SU-06, SU-07, SU-08 | 6 | mail arrival time |
| FR-DEV.10 | Wrong code x5, then wait | ER-01, ER-02 | 3 | seconds paused |
| FR-DEV.11 | Slow network (Network Link Conditioner "Very Bad Network"): send code | ER-06 | 3 | seconds to timeout line |
| FR-DEV.12 | Every co-parent entry on the signed-in phone, plus a pasted invite link | CP-01, CP-02 | 3 | screenshot of each |
| FR-DEV.13 | Second phone (new phone, S17): sign in with same account | RS-03, RS-04 | 8 | screenshot |
| FR-DEV.14 | Sign out with a letter waiting, then expire session (revoke Apple access in iOS Settings > Apple Account > Sign in with Apple) | LI-09, ER-10 | 5 | words shown |
| FR-DEV.15 | Instruments Time Profiler or Animation Hitches on the story | CS-04, FR-19 | 8 | hitch ratio |
| FR-DEV.16 | App Privacy Report | Only hosts for sign-in and sync after sign-in; none before; no analytics host | 3 | domain list |

Pass rule: every tier A row passes. Tier B and C rows fail soft: they are recorded, and the story flag stays off if any B row fails. Stop rule: anything written to the book or synced before consent, or a letter lost across sign-out, is S0.

**Cannot be tested without a device:** Face ID success, failure, lockout and passcode fallback (the simulator can fake match and non-match, not the iOS fallback sheet or lockout; U for Maestro driving it); Apple and Google sheets and real private relay; real mail delivery and universal links (needs AASA live); haptics; frame pacing and hitches; Low Power Mode; thermal; rotation feel; cold start timing; the App Switcher snapshot; Keychain survival across reinstall; Network Link Conditioner.

## 8. Regression list for the stack

| Item | Must still hold | Test that proves it |
|---|---|---|
| #764 S17 (gate.logic.ts, use-first-run-route.ts, onboarding.tsx, book.tsx) | 18+ gate first with nothing chosen and a No stops (E2E-01a/b, `age-gate*.test.ts`); welcome hand-off (`welcome-handoff.test.ts`); no OS prompt before first Speak; first run asks only name and date (AL-01); join sheet "Open the book" still asks whether the welcome step is under it | existing tests plus RS-03; collision named in section 5 |
| #724 gate | Plus and keep gate: two free letters then the Keep sheet (`plus-gate.test.ts`, `billing-keep-gate-*.test.ts`); Read together and add child never gated (E2E-06, E2E-07); account deletion gate (`account-deletion-gate*.test.ts`) | those files, run unchanged |
| #738 You tab (Me since 11 Nov 2026) | The tab shows the Account and lock rows and, in a store build, no co-parent row; sign-out, delete account and App lock rows still reachable; CP-01 covers the absent co-parent row | `settings-home` logic tests, E2E-09, `app-lock-wiring.test.ts` |
| Auth | `auth-machine`, `auth-kill-path`, `auth-links`, `auth-h1` stay unchanged and green | `npm test` |
| Lock | `app-lock-machine`, `app-lock-behaviour`, `app-lock-wiring` unchanged | `npm test` |
| Privacy | No analytics before opt-in (`analytics-off-v1.test.ts`, E2E-11); content rules (`packages/content` rules test) on every new word | `npm test` |

## 9. UNVERIFIED and open questions

UNVERIFIED: Apple guideline 4.8 duty; whether Maestro 2.11 drives the simulator's Face ID menu; whether Keychain survives reinstall in this app (RS-02); CS-02 to CS-04 numbers (proposed by qa, not in the PRD); region and under-18 rules (not in the repo); Apple storefront as a region signal. Nothing in this file was run.

Open questions (recommendation each):
1. Who owns `firstRunRoute`: #764 or the new work? Recommend #764 lands first, this plan's route test is written against its output.
2. Should VoiceOver turn auto-advance off? Recommend yes (FR-14).
3. The soon state today depends on servers off (`capabilities.ts`). Recommend a dedicated co-parent flag so Build 12 shows soon with servers on.
4. Blocked region and under-18 by country: recommend no region block in Build 12 (not implemented), the 18+ attestation only, decided by counsel and the product doc.
