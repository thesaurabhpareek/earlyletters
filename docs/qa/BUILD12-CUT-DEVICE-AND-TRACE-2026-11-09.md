# Build 12 cut: device time, test coverage and traceability (task G-12)

Owner: `qa`. Status: draft for the founder and the coordinator, 9 Nov 2026 (UTC). Docs only. No BL, D or CR id is assigned or reserved here; every row id below marked "proposed" is a proposal that `qa` re-scans at merge time.

How to read the labels in this file:

- **READ** means I opened the file, patch or issue named, on 9 Nov 2026.
- **UNVERIFIED** means I did not read it, or only saw a title. Nothing UNVERIFIED is stated as fact.
- **ESTIMATE** means a number I computed from the stated assumption. It is not a measurement. No duration in this file has been timed on a phone.
- **Given** means a figure the coordinator relayed and I could not check: the Build 12 run sheet (`proposals/device-run-sheet-build12.md`, a Project doc I cannot read) is about 14 h 25 min for the full production candidate, about 6 h for the shortened pass (which needs the founder's written row-by-row OK), sitting 9 needs a sandbox account, sitting 10 needs Xcode.

## What I read

- READ: `docs/roadmap/next/03-requirements/NX-31-new-customer-onboarding-and-account-creation.md` at `364762ca` (revision 3, rows R1 to R29, device rows D31-1 to D31-20, test titles in section 14, gates G1 to G7 in section 0).
- READ: NX-30 (branch `docs/nx-30-nav-landing-8nov`, `2c6bf5fe`: device-row paragraph and trace table), NX-30a (branch `docs/nav-eval-9nov`, `88e80022`: rows R1 to R11), NX-32 (branch `docs/nx-32-account-management-8nov`, `87808105`: R-table, rollout, device-row paragraph), NX-35 (branch `docs/nx-35-motion-8nov`, `fe545da1`: section 10, device-row table, trace table).
- READ: the file lists of draft PRs #698, #699, #700, #701, #702, #703 (REST API), the patches of their test files, the patches of the production and source files named below, and each head commit's check runs.
- READ: `docs/qa/DEVICE_TEST_PLAN.md` on `origin/develop` (`a0f31520`, 974 lines): the row index, the intro, S1-03, S1-06, S1-08, S1-10, S1-26, S1-27, S1-35, S1-95, S1-131, S1-133, S2-13, TF-03, TF-04.
- READ: `scripts/trace.mjs`, the head of `docs/TRACE.md`, `apps/mobile/src/dev/e2e-seams.ts`, the header of `apps/mobile/e2e-web/j22-sign-in.flow.ts`, the header of `apps/mobile/e2e/flows/E2E-12-sign-in-email.yaml`, `.github/workflows/ci.yml` job names and timeouts, issue #533.
- NOT READ: the Build 12 run sheet; the full text of NX-35 beyond section 10, the device table and the trace table; the body of NX-30 and NX-32 beyond the parts named; PR #664's body; the bodies of #680 and #684; `apps/mobile/src/app/onboarding.tsx` as a whole file (only the #701 patch); the web e2e job's real duration in CI.

---

## 1. Every new or changed behaviour in the cut

"Cut" is the founder's Build 12 cut of 9 Nov as NX-31 section "Build 12 cut" records it: account-first behind `EXPO_PUBLIC_SERVER_FEATURES`, local-start fallback (build-time constant), You tab as the third tab, name optional, lock offer in session 3, Delete account in the same build. Out of the cut: audio backup, Photos tab, the full motion push. Whether NX-32's Build 12 slice is in the cut is UNVERIFIED (NX-32 says "if the build is server-on"; the founder's words list only Delete account), so NX-32 is priced as a separate conditional line.

| # | Behaviour | Row | Built by (READ) |
|---|---|---|---|
| B1 | Fresh install: age answer, then one sign-in screen (Apple or email code, same two buttons for new and returning), agree line above the buttons, no password, name or phone field, "I was invited" link | NX-31 R8, R17 | No PR found (see section 5) |
| B2 | No child, signature or Tonight screen is reachable without a session (relaunch, deep link, notification) | R17 | None |
| B3 | Apple asks for the email scope only; Hide My Email accepted | R9 | None |
| B4 | The sign-in method used is remembered and shown in Account; no extra confirmation screen | R10 | None |
| B5 | Code screen after 60 s offers Send a new email, Use a different email, Continue with Apple, with a Help link | R11 | None |
| B6 | Quit at any step reopens on the first incomplete step; signed-in parent never sent back to screen 2; valid code offered again, expired one not | R4 | None |
| B7 | Ask order: 0 OS sheets before the first Speak tap, 0 notification sheets before the first kept letter, one card ask per session | R2, R6 | Sequencer exists; no whole-path test |
| B8 | Sign-in or backend silent for 10 s shows the outage screen with retry and automatic retry; offline launch says sign-in needs a connection and retries on reconnect | R18, R19 | None |
| B9 | "Start the book on this phone for now" shows only when: answered Yes, a failure or offline, the compiled constant is on. Never on a healthy screen 2, never after No | R18 | None |
| B10 | A local-start book moves to the account only after the sensitive-data consent and the masked-email tap | R18, R27 | None (claim flow exists per NX-31) |
| B11 | A phone with a book and no session can still read, record and export; sign-in is offered, not forced | R22 | None |
| B12 | You tab (third tab in the cut) hosts Settings home; signed-out You card with one Sign in button; local-start book adds a line; prompt at most once a day, never during record, review or write | R26, R27, NX-30a R1 | #699 builds the tab. The signed-out card is not in #699 |
| B13 | Child name optional on the first book; date required; stored name stays empty, display says "your child" | R3, R28 | #701 (phone), #700 (server), #703 (copy) |
| B14 | A later edit may set or clear the name; later books keep the name-required rule | R28 | #701, #700 |
| B15 | Prompts and copy read well with "your child": two prompts retired and replaced (prompt library version 4 to 5); `fill()` turns a blank `{child}` into "your child" everywhere | R3 | #703 (prompts), #701 (`fill`, `childLabel`) |
| B16 | Count of sessions that end with a kept letter, on the phone only | R14 | #702 (counter only) |
| B17 | Lock offer moves from "The book is open." to session 3 and Settings > Privacy; session 3 sequencer order lock, reminder prime, analytics | R14, R29 | None (the counter reads nothing yet, #702 says so) |
| B18 | Recording line stays the true "kept on this phone"; no first-run string promises a backup | R21 | None needed in code in Build 12; a pin test is missing |
| B19 | Delete account row on whenever sign-in is on; full flow on production, session ends, purge worker runs | R25 | Production profile already has the deletion flag on (NX-31); #698 edits preflight and config tests; nothing ties the two flags together by test |
| B20 | Production profile servers on | gate G1 | #698 (draft, "do not merge") |
| B21 | Store tab count: with servers on, the Family tab and the child "Write this book together" row appear (see risk X1) | NX-30a R6 | #665 plus #699 plus #698 interact |
| B22 | Mail readiness preflight (DMARC, verified domain, SMTP, rate limit, tracking off) | R20 | None |
| B23 | Test seam so journeys pass screen 2 | R23 | None |
| B24 | Notes for Review name account features, Delete account route, local start; non-founder reviewer drill | R24, G4, G6 | None (ops and release record) |
| B25 | A settings write now happens in the save path after every kept letter (`askAfterSave` calls the counter, inside try/catch) | R14 | #702 |
| B26 | New migration `20261109000000_child_name_optional.sql`: pending, not applied; needs red-team review and the founder's approve-migration label (READ in its header) | R28 | #700 |

Not in the cut and not priced: NX-33 Photos (S1-175 to S1-178 claimed), NX-34 backup, NX-35 motion (NX-35 section 10 recommends no motion change in Build 12; I agree, see section 10), NX-30 Photos tab and the fourth-tab bar.

---

## 2. Device rows needed, existing ids first

### 2.1 Existing rows on `develop` that apply (reuse these ids)

| Existing id | Use in the cut | Needs a rewrite first? |
|---|---|---|
| S1-03 | Cold start, age gate, airplane mode | Yes. The step "airplane mode, fresh install, answer Yes" now ends at screen 2 or the local-start button |
| S1-06 | Sign in with Apple | Yes. Its steps start "Signed out, after the first letter: Keep the book > Apple". Under account-first the entry point is screen 2 |
| S1-08 | Email link and code in real mail apps | Yes, same reason ("Continue with email" from the Keep card) |
| S1-10 | First recording, save | Yes. "Fresh install, airplane mode" cannot pass screen 2 except by the local start |
| S1-13 | Kill during record and during save | Setup only |
| S1-26 | First run, downloads | Yes. First run now includes sign-in |
| S1-27 (a) | "Row 5b": the sign-in sheet rises over the Book after the first letter | Retire for the account-first build. It will fail by design |
| S1-35, S2-13 | Delete account (sole parent; real account) | Add a production-profile variant (D31-16) |
| S1-95, S1-96, S1-97 | Settings home, Privacy, Storage, now reached from the You tab | Entry path only |
| S1-131 (a) | Lock card at "The book is open." | Retire (a). The card moves to session 3 |
| S1-133 | Delete this book, Erase everything on this phone (#520) | See risk X3: its Needs line says both rows are hidden once a phone signs in |
| S1-140 | Two tabs in the store build (#665, claimed, not on `develop`) | Rewrite: the cut is three tabs (Tonight, Book, You) |
| S1-22, DL-03 | Two phones, restore drill | Reuse for the second-phone row (S1-198) |
| TF-03, TF-04 | Update over older build; 15-minute smoke list | TF-04 items 1 and 4 change (sign-in is now inside item 1) |
| S1-170, S1-171 | Claimed by NX-30 (not on `develop`): You tab Settings in 1 tap, Account in 2; bar at AX5, 3 and 4 tabs | Reuse as the You-tab row; add a three-tab variant (S1-196 covers the store-profile check) |
| S1-1xx-A, -B, -E | Placeholders in NX-32 (Account at AX5, sign out other devices, sign out leaves book unchanged) | Conditional, see section 3 |

### 2.2 Ids already claimed (scan result, READ)

Scan method: patches of all 140 open pull requests that touch `docs/qa`, `docs/roadmap`, `docs/release`, `docs/ops` or a device plan, plus every fetched docs branch (nx-30, nav-eval, nx-32, nx-33, nx-34, nx-35, nx-31, qa-account-experience-cases, qa-bl497-device-plan, qa/build-9-readiness). The repository has 574 branches; I did not scan them all. That is why the proposals below carry the caveat at the end of this section.

- On `develop`: the S1-xx rows in the index above, including S1-141 to S1-144 and S1-150 to S1-152.
- In open PR patches: S1-110, S1-111, S1-112 (#635, #664), S1-131 to S1-135 (#664, #670, #680; #684 is claimed by the task brief and did not appear in my patch scan), S1-140 (#665, #699), S1-160 and S1-161 (#664), B1-11 (#320).
- In docs branches: S1-162 (named as in use by NX-30 and NX-35), S1-170 to S1-174 (NX-30), S1-175 to S1-178 (NX-33), S1-180 to S1-189 (NX-35). NX-32 uses unnumbered placeholders `S1-1xx-A` to `-F`.
- Known collision that is not mine to resolve: #680 and #684 both claim S1-133 to S1-135 while #520 keeps S1-133. The merge-time owner must renumber one of them.

### 2.3 Proposed new ids (PROPOSALS, not reserved)

Free by my scan: S1-190 to S1-199. Nothing in the cut needs more than nine.

| Proposed id | Covers | NX-31 rows and D31 placeholders | In the cut? |
|---|---|---|---|
| S1-190 | Account-first gate and screen 2 (a to h below) | R17, R8, R9, R10, R2, R6, R11, R15; D31-1, 2, 3, 5, 6, 7, 8 | Yes |
| S1-191 | Quit and resume at four points; expired code | R4; D31-4 | Conditional (R4 is in rollout step 6; cut membership UNVERIFIED) |
| S1-192 | Offline, outage, local start and the No answer | R18, R19; D31-10, 11, 19 | Yes |
| S1-193 | Phone with a book and no session; signed-out You card; local-start book card | R22, R26, R27; D31-12, 17 | Yes |
| S1-194 | Name optional, end to end, including the server and every "your child" surface | R3, R28; D31-2, 18 | Yes |
| S1-195 | Lock offer once in session 3, as the only ask | R14, R29; D31-13, 20 | Yes |
| S1-196 | The Build 12 bar: three tabs, You last, Family absent in the servers-on production profile, labels at AX5 | NX-30a R1 to R4, R6 to R9 | Yes |
| S1-197 | Reviewer drill by a person who is not the founder | R24; D31-14; gates G4, G6 | Yes |
| S1-198 | Second phone: returning customer, no child step, honest recordings line | R12, R13; D31-9 | Conditional |

Sub-rows of S1-190: (a) fresh install, answer Yes, confirm screen 2 is next, relaunch, deep link and a notification tap cannot pass it; (b) Apple path to the first kept letter, name empty, with stopwatch and OS-sheet count; (c) email path with code, then with link; (d) screen 2 at AX5 and VoiceOver; (e) Apple sheet scope and a Hide My Email account; (f) count OS sheets across (b) and (c); (g) wait 60 s on the code screen and use each recovery.

Sub-rows of S1-192: (a) airplane mode after Yes: local-start button shows; (b) second fresh install, answer No: button never shows, no book can be made; (c) Wi-Fi connected with no internet (outage) after Yes: outage screen at about 10 s, retry, button; (d) restore service while the outage screen is open: it carries on by itself; (e) start the local book, write and keep a letter; (f) later sign in: consent screen, then the masked-email tap, then the move; (g) on a healthy launch the sign-in card shows at most once a day.

Sub-rows of S1-193: (a) sign out with a book on the phone, relaunch, read, record, export; (b) open You tab: signed-out card with one Sign in button, no email, plan or sync status; (c) sign in as the same account: card gone; (d) the same on a local-start book with the extra line; (e) server-side forced sign-out of a signed-in phone.

Sub-rows of S1-194: (a) empty name, date chosen, finish; (b) walk Tonight, the prompt, Record, Review, Keep moment, Book cover and title, a letter's page, Listen, Read together, the export's first page, a reminder text, Settings > the child; each reads well with "your child" and none shows a placeholder; (c) sign in and confirm the book exists on the server with an empty name (drill project, dashboard or a second phone); (d) add a name later in Settings, then clear it; (e) twins or more still require each name.

Sub-rows of S1-195: (a) three sessions, each cold-started and each ending with a kept letter; (b) the lock card is absent in sessions 1 and 2 and at "The book is open."; (c) it appears once in session 3 and no reminder card or other ask appears with it; (d) Not now holds; Settings > Privacy still offers it.

Caveat: these ids are UNVERIFIED as free beyond the scan in this section. `qa` re-scans open PR patches and fetched branches the day any of them merges.

---

## 3. Added device time (ESTIMATE)

**Assumptions (mine, not measured):** one iPhone SE 3 and one operator; a tap-and-observe sub-row costs about 3 min; each fresh-install reset costs about 3 min; a mail wait costs up to 2 min; a stopwatch run of the first-run path costs about 7 min including reset; screenshots and the evidence line cost about 2 min per sub-row; AX5 and VoiceOver sub-rows cost about 6 min each. The Build 12 run sheet's own per-row times are not readable by me, so I could not compare. The overlap with rows already inside the 14 h 25 min (S1-06, S1-08, S1-26, S1-27, S1-131 (a) re-run at a changed entry point) is UNVERIFIED; I show a low and a high.

| Row group | Added minutes (ESTIMATE) | In the cut? | Blocking? |
|---|---|---|---|
| S1-190 gate, screen 2, Apple, email, AX5, scopes, recoveries | 80 (a 10, b 15, c 20, d 12, e 12, f 3, g 8) | Yes | a, b, c, f blocking: 48. d, e, g: 32 |
| S1-191 resume at four points, expired code (plus about 15 min idle wait, not counted) | 25 | Conditional | Accept-not-run candidate |
| S1-192 offline, outage, local start, No answer, claim | 48 | Yes | Blocking |
| S1-193 signed-out phone, You card, local-start card, forced sign-out | 32 | Yes | Blocking |
| S1-194 name optional end to end (copy walk 20, server check 10, clear and edit 5) | 35 | Yes | Copy walk and edit blocking: 25. Server part: 10 |
| S1-195 lock offer in session 3 (three sessions 12, lock and Settings 10, rebaseline S1-131 (a) 5) | 27 | Yes | Blocking |
| S1-196 three-tab bar, Family absent, AX5, Large Content Viewer, 1 and 2 tap paths | 24 | Yes | Blocking |
| S1-197 reviewer drill, non-founder, from the Notes only | 25 | Yes | Blocking |
| S1-198 second phone, returning customer | 25 | Conditional | Accept-not-run candidate |
| Delete account on the production profile (S1-35 and S2-13 variant, D31-16) | 20 | Yes | Blocking |
| **Subtotal, cut** | **341 min (5 h 41 min)** | | |
| NX-32 Build 12 slice, only if it is in the cut: S1-1xx-A 20, -B 25, -E 10 | 55 | UNVERIFIED | Conditional |

Low case: subtract 60 min for steps that replace the same steps in S1-06 and S1-08 already counted (assumption: the Apple and email mechanics of S1-190 b, c, e, g, 55 min, plus 5 min of reset). Low added = 281 min (4 h 41 min).

| Total | Calculation | ESTIMATE |
|---|---|---|
| Full production candidate, high | 14 h 25 min (Given) + 5 h 41 min | **20 h 06 min** |
| Full production candidate, low | 14 h 25 min + 4 h 41 min | 19 h 06 min |
| Full pass with NX-32 slice, high | 20 h 06 min + 55 min | 21 h 01 min |
| Shortened pass (founder's written OK needed), blocking rows only | 6 h (Given) + 249 min (S1-190 a, b, c, f 48; S1-192 48; S1-193 32; S1-194 copy walk and edit 25; S1-195 27; S1-196 24; S1-197 25; delete 20) = 6 h + 4 h 09 min | **10 h 09 min** |
| Rows the founder could accept as not run, with a named risk | S1-191 25, S1-198 25, S1-190 d, e, g 32, S1-194 server part 10 | 92 min |

The shortened pass cannot stay at 6 h: the rows the cut adds are new behaviour, not repeats, and the shortened pass has no way to cover them without being run. The 6 h figure is Given and I could not see which of its rows are already account-first.

### Rows the founder can run on the sign-in path in one sitting

Sitting proposal, one phone, one drill Apple ID plus a second one for Hide My Email, one mailbox, one Wi-Fi that can be cut from the internet (a router with the cable pulled, or a hotspot with data off): S1-190, S1-191, S1-192 (a to g except a second phone), S1-193, S1-194 (a, b, d, e), S1-195. Total ESTIMATE 80 + 25 + 48 + 32 + 25 + 27 = 237 min (3 h 57 min), plus about 15 min idle for the expired code. S1-194 (c) and S1-198 need a second phone or a dashboard read. S1-196 and S1-197 fit the same sitting if the reviewer is a second person. Accounts must be drill identities (`docs/qa/run-sheets/README.md` "Drill identities"), never the founder's family; the book is Asha's.

---

## 4. Automation to cut device time

Hard limit (READ, DEVICE_TEST_PLAN "How to use this plan"): Maestro cannot drive a physical iPhone. Automation below reduces regression risk and repeat effort between builds. It does not replace a device pass for the release unless the founder accepts a simulator or browser result as proof, in writing.

| Row | Can be automated? | Where | ESTIMATE of device minutes it could remove after it exists |
|---|---|---|---|
| S1-190 (a), screen 2 content (R8), no field list | Yes | Playwright web journey on the server-on build (the J22 pattern: server-on export plus mock server, READ) | 10 |
| S1-190 (g) 60 s recoveries (R11) | Yes | Playwright with its clock (J22 already advances the clock for the 15 minute pause, READ) | 8 |
| S1-190 (b, c) tap path, 0 OS sheets before Speak | Partly | Maestro on a simulator (E2E-12 signs in with a real code from a local stack and mailpit, READ). Simulator timing is not device timing | 0 (stopwatch stays on the phone) |
| S1-190 (d, e) AX5, VoiceOver, Apple sheet | No | Device only | 0 |
| S1-191 resume | Yes | Maestro (`launchApp` without clearing state) and web reload. Web is exposed to #533 | 16 |
| S1-192 (a, b, c, d, g) offline, No answer, outage, retry on recovery, daily prompt | Yes | Pure unit for the allowed/not-allowed table; Playwright with `setOffline`, a hanging or 503 mock route and the clock for the 10 s | 28 |
| S1-192 (e, f) local book and claim | Partly | Playwright for the claim screens; real consent text and masked email stay a device look | 6 |
| S1-193 (a to d) | Yes | Playwright with a mock 401 | 14 |
| S1-194 (a, e) | Yes | Playwright J01 variant with an empty name | 8 |
| S1-194 (b) the copy walk | No (content scan only) | `nameless-child.test.ts` (#703) scans strings but skips strings built by functions (READ: `typeof value === 'function'` is skipped) | 0 |
| S1-195 (a to c) | Yes | Maestro: three cold starts, each ending in a kept letter | 12 |
| S1-196 (Family absent, tab order) | Yes, already unit | `tab-bar.test.ts`, `store-family-tab.test.ts` read source text. A real render needs Maestro | 4 |
| Delete account R25 flag tie | Yes | Build-config test `scripts/release/profile-flags.test.mjs` (proposed in NX-31 section 14; does not exist) | 0 (production purge stays a drill) |
| S1-197, S1-198, D31-15 mail | No | Human and ops | 0 |

Total that could move off the phone: about 106 min (ESTIMATE; I count 10 + 8 + 16 + 28 + 6 + 14 + 8 + 12 + 4 = 106). I would not claim it against the Build 12 pass because none of it exists yet.

### The test seam NX-31-R23 needs

The row says journeys pass screen 2 through a seeded Asha session or a throwaway-project sign-in, "never a bypass flag in a store build".

1. **Prefer no new app-side seam.** Web: the mock server already answers email code sign-in (J22). It needs two more modes: a token that refreshes and a 401. Maestro: reuse the E2E-12 route (local stack, `scripts/fetch-otp.js`). Both keep the real gate in the path, which is what R17 must prove.
2. **If a seeded session is wanted for speed,** it goes in `apps/mobile/src/dev/e2e-seams.ts` only. That file loads a seam only when `EXPO_PUBLIC_E2E=1` and the app env is neither `preview` nor `production` (READ). The new seam must set a session for a fixture user on a throwaway or local project, never skip the gate. Its exported names must be added to the B-8 bundle search (CI job "no e2e seam in store bundles", 15 min timeout) and to `test/e2e-seams-wiring.test.ts`. Without that, a seeded-session helper could ship in a store build unseen.
3. **An outage switch needs no code:** the Supabase URL is a build-time env (`src/lib/supabase/env.ts`, READ). A web or simulator build with the URL pointed at a closed port gives "refused"; at a non-routable address it gives a hang that reaches the 10 s timeout.
4. **The constant `LOCAL_START_FALLBACK` is compiled,** so testing it on and off needs two web builds. That adds time to the web e2e job. The web job's duration in CI is UNVERIFIED, #533 recorded a 16.1 min local full run on a loaded 2-core box, and CI must stay under 10 min per job. Any extra build goes in a separate job; a workflow patch is the founder's to apply (`docs/ops/proposed/`), and I have not written one.
5. **A fake clock** is needed for the 10 s timeout and the once-a-day prompt: Playwright's clock on web, fake timers in the unit test. Changing the device date for the daily prompt also moves token expiry, so it stays an automated check.

---

## 5. Traceability matrix (requirement row to test to file to PR to status)

Sources: NX-31 section 14 (spec titles) against the test files in the PRs (READ). "Spec title" is what NX-31 asks for. "Built" is what the PR contains. Check runs are those on each PR head at the time I read them; I did not run anything.

PR state READ: #699 head `cab3713a`, #700 `e81c426f`, #701 `4e322591`, #702 `48b0d44e`, #703 `09283722` (store-profile launch check still in progress when read), #698 draft "do not merge". All draft. Checks on #699, #700, #701, #702 showed success, one `compliance-fence` run cancelled on each (cause UNVERIFIED), `iOS simulator build` skipped.

| Row | Test title | File | PR | Status and gaps |
|---|---|---|---|---|
| R1, R5, R7 | none | none | none | Dropped. Correctly no test |
| R2 | `[NX-31-R2] asks appear in table order with 0 OS sheets...` | proposed `apps/mobile/test/first-run-ask-order.test.ts` | none | **GAP: no test, no PR.** D31-5 device only |
| R3 | `[NX-31-R3] an empty name with a date creates the book and shows the fallback`; `[NX-31-R3] a name and no date: Continue waits...`; `[NX-31-R3] a typed name is kept as typed, trimmed`; `[NX-31-R3] twins or more still need each name...`; core `[NX-31-R3] the first-run name check accepts empty` | `apps/mobile/test/first-run-child-name.test.ts`; `packages/core/test/child.test.ts`; `packages/content/test/nameless-child.test.ts` (`[NX-31-R3] no string reads wrongly when the child's name is blank`) | #701, #703 | Built, CI green. Gaps: (1) the "creates the book" title tests the pure helper `firstRunBookNames`, not `finish()` in `onboarding.tsx`; no test asserts the screen calls it (the existing `onboarding-setup-review` test checks `childFallback` use only). (2) `nameless-child.test.ts` is a regex scan and skips strings made by functions. (3) #701 and #703 both add `first-run-child-name.test.ts` (62 lines and 80 lines); #703 is stacked on #701 and rewrites it, so #701 alone asserts `"your child's book"` in lowercase at the start of a title, which is the wrong reading #703 fixes. Merge order #701 then #703. Device: S1-194 |
| R4 | `[NX-31-R4] a cold start reopens on the first incomplete step...` | proposed `first-run-resume.test.ts` | none | **GAP: no test, no PR.** NX-31 says no progress store was found (UNVERIFIED). Device S1-191 |
| R6 | `[NX-31-R6] reminder card is the only ask after the first kept letter` | extends `ask-sequencer.logic.test.ts` | none | **GAP: no test.** Device S1-190 (f) |
| R8 | `[NX-31-R8] screen 2 has equal methods...` | proposed `sign-in-first-screen.test.ts` | none | **GAP.** Device S1-190 (d) |
| R9 | `[NX-31-R9] Apple request asks for email only` | proposed `apple-scopes.test.ts` | none | **GAP.** Auth code, a counted second review (D-041). Device S1-190 (e) |
| R10, R11 | proposed titles | proposed files | none | **GAP.** |
| R12, R13 | device titles | two-phone device | none | **Device-only.** S1-198 |
| R14 | `[NX-31-R14] a session counts only when it ends with a kept letter` (3 titles in #702) | `apps/mobile/test/kept-letter-sessions.test.ts` | #702 | Counter built, CI green. **GAP: the spec titles `no lock offer in first run; offered once in session 3` are not built.** The lock card still shows at "The book is open." until a PR moves it. #702 states nothing reads the count yet |
| R15 | none (study) | none | none | Study, not blocking. Device S1-190 (b, c) records the minutes |
| R16 | `[NX-31-R16] first-run keys have no streak...` | proposed `packages/content/test/first-run-keys.test.ts` | none | **GAP, cheap to add now.** |
| R17 | `[NX-31-R17] no child, signature or Tonight screen is reachable without a session` | proposed `sign-in-first-gate.test.ts` | none | **GAP. Highest-risk row with no PR.** S1-190 (a) |
| R18, R19 | `[NX-31-R18] ...` x2, `[NX-31-R19] ...` | proposed `sign-in-outage.test.ts` | none | **GAP, no PR.** S1-192 |
| R20 | `[NX-31-R20] public preflight fails without DMARC policy...` | proposed `scripts/release/mail-readiness.test.mjs` | none | **GAP.** Ops run D31-15 |
| R21 | `[NX-31-R21] the recording line follows the account's backup state...` x2 | proposed `first-run-recording-line.test.ts` | none | **GAP.** In Build 12 the line is always the true one; the pin should assert that no first-run string says "kept safe" while backup is off. Cheap to add |
| R22 | `[NX-31-R22] a phone with a book can read, record and export after its session ends` | proposed `ended-session-keeps-book.test.ts` | none | **GAP.** S1-193 (a) |
| R23 | `[NX-31-R23] journeys pass sign-in through a test seam...` | extends Maestro and web e2e | none | **GAP.** Every web journey that starts a first run will stop at screen 2 when R17 lands. Blocks the whole web suite, see section 6 |
| R24 | `[NX-31-R24] Notes name the account-based features...` | `scripts/release/with-review-contact.ts` check | none | **GAP.** Review drill, no automated test. S1-197 |
| R25 | `[NX-31-R25] a profile with sign-in on has account deletion on`; `...Delete account row shows when sign-in is on` | proposed `scripts/release/profile-flags.test.mjs` | #698 touches `account-deletion-switch.test.ts` (+2/-1) and preflight tests; neither carries the title | **GAP: no test with the id; whether #698 covers the tie is UNVERIFIED.** Device D31-16 |
| R26 | `[NX-31-R26] a phone with a book and no session shows the signed-out You card...` | proposed `you-tab-signed-out.test.ts` | none (#699 builds the tab only) | **GAP.** S1-193 |
| R27 | `[NX-31-R27] ...` | same file | none | **GAP.** |
| R28 | 16 titles starting `[NX-31-R28]` (server); `[NX-31-R28] the phone makes the book with an empty stored name...` (phone) | `supabase/tests/child_name_optional.test.mjs`; `apps/mobile/test/first-run-child-name.test.ts`; `supabase/tests/children_entitlements.test.mjs` edited | #700, #701 | Built, CI green. Gaps: (1) the spec says "and the sync apply path"; no check drives a push of `book.create` or `book.first_run` with an empty name (the migration header says those call `create_child_row`, so likely safe: UNVERIFIED by test). (2) Of the 16 server checks, about 6 also pass on old code (a 60 character name, NULL refused, consent needed, users cannot call `create_child_row`, definer setting, a later 61 character edit): they are pins, not proof of the change (my reading, not run). (3) The old assertion `a name is required` in `children_entitlements.test.mjs` was replaced by `a name over 60 characters is refused`. That is a spec change by the founder's answer 3, not a loosening to get green, but the founder should see it listed. (4) Migration is pending and not applied; see risk X2. S1-194 (c) |
| R29 | `[NX-31-R29] session 3 offers the lock first and only one ask` | extends `next-ask.test.ts` | none | **GAP.** Counter only (#702). S1-195 |
| NX-30a R1, R4, R6, R7, R8, R9 | `[NX-30a-R1]`, `[NX-30a-R4]`, `[NX-30a-R6]`, `[NX-30a-R7]`, `[NX-30a-R8]`, `[NX-30a-R9]` | `apps/mobile/test/tab-bar.test.ts`, `packages/content/test/tab-labels.test.ts` | #699 | Built, CI green. They read source text; none renders a tab. Note R1 and R9 pin four tab keys (`index, book, family, you`), not three, see X1 |
| NX-30a R2, R3 | taps | Maestro or device | none | **Device-only.** S1-170 (a), S1-196 |
| NX-30a R5 | selected label differs by weight | none | none | **Not built, deliberately** (the #699 test header says so). No test, no device row. GAP |
| NX-30a R10 | contrast pairs | `tokens.test.ts` | exists | Covered by an existing guard |
| NX-30a R11 | none | none | none | Hypothesis, study |
| NX-32 slice (R1, R2, R3, R4, R9, R10, R11, R12, R14, R15, R17, R19, R20, R21, R26) | proposed titles | proposed files | none | **GAP: no PR for any. UNVERIFIED whether in the cut.** |
| NX-35 | proposed | proposed | none | Out of the cut. Nothing to trace |

### Tests that pass on old code

- #700: the six server pins above.
- #701: `[NX-31-R28] later books keep their rule: the add-book form still wants a name` passes on old code by design. Every other title in `first-run-child-name.test.ts` fails on old code only because the new module does not exist (an import error), not on an assertion; that proves the module is new, not the behaviour.
- #699: NX-30a R4, R8 and R10 are described by NX-30a itself as guards that pass today.
- None found that pass on old code and claim a new behaviour.

### Device-only rows (no automated test possible or planned)

R12, R13, R15, R20 (mail delivery), R24, NX-30a R2 and R3, the Apple sheet scope check (R9 at the sheet), AX5 and VoiceOver on screen 2, the 60 s mail wait.

### What `scripts/trace.mjs` would say (not run; I did not install)

READ: `scripts/trace.mjs` line 33 defines a requirement id as `[A-Z][A-Z0-9]*-(?:REQ|NFR)-\d{3}` with an optional sub-id letter. Consequences for this cut:

- **`NX-31-R3`, `NX-30a-R1`, `NX-32-R10` and the like do not match.** The tool does not see a single NX row id in a test title, a doc or a PR. So for Build 12 it can neither report gaps nor flag a typo in a bracket. The matrix above is by hand. A follow-up for `qa`: either extend the id pattern to the NX row shape or add a second check; I have not made that change in this task.
- **"undefined requirement id" (line 358, 446, 532)** means an id that matches the pattern, is cited somewhere (a doc, backlog row, PR template, a test title, or a Maestro `tags:` entry) and is not defined in any `features/F*.md` section 7 table, not an outside LEGAL-REQ or DATA-REQ definition, and not a retired id. `--check` exits 1 on it. Current `docs/TRACE.md` shows 0 such ids. In a title, the usual cause is a typo or a new id cited before its spec merges.
- The F-ids NX-31 cites in its trace line that I spot-checked are defined (F02-REQ-007, -010, -014, -019, F13-REQ-023, F14-REQ-041, LEGAL-REQ-012, DATA-REQ-024). `F03-U02` and `F03-U07` are not in the id shape, so they are invisible too.
- TRACE.md headline (READ): 768 P0 ids, 571 with no test title citing them. This cut adds none of them.

---

## 6. Regression surface and minimum re-run set

### What the cut touches (READ from the patches)

- **Record, Review, Keep:** #702 adds a settings write to `askAfterSave`, which runs right after a save (inside try/catch). #701 changes `fill()` in `src/lib/copy.ts` for every string with `{child}` (a blank value now renders "your child"). That is a global change, wider than the first-run screen.
- **Tonight:** two prompts retired and replaced, prompt library version 4 to 5 (#703). The remote content test was edited to filter retired prompts. A device that kept a retired key in its history is UNVERIFIED.
- **Tabs:** #699 re-exports Settings home as a tab and edits `(tabs)/_layout.tsx`, `settings/_layout.tsx` (Back label), `family/entry.logic.ts`, `settings/children/[id].tsx`. It is stacked on #665.
- **Onboarding:** #701 changes `onboarding.tsx` `finish`, the `childBlock` and the field-focus path. R17 will change the root gate (not built).
- **Sign-in screens:** #701 and #703 change `(auth)/sign-in/index.tsx`, `consent.tsx`, and `settings/account.tsx`, `privacy.tsx`, `listen.tsx`, `write.tsx`, `content-blocks/blocks.tsx`, join sheet and wait logic (the same one-line copy edits).
- **Settings, delete account, erase everything (#520), consent (#635):** Settings home now sits in a tab (S1-95 to S1-97). Delete account is gated by the same flag as sign-in (R25). #520 rows are hidden on a signed-in phone (X3). #635's agreement box and R8's agree line are two moments (NX-31 section 6.6: keep one box, one line); its part 3 edits the web journeys that R23 also edits.
- **Server:** one migration changes a check constraint and `create_child_row`; access and grants are unchanged (READ in the migration header).

### Minimum re-run set (a fixed list, nothing optional in it)

Automated, in CI or on a Mac:
1. `npm test` (mobile, core, content, api, analytics, emails, design-tokens) and `npm run typecheck`, on the release branch head, not on the PR heads.
2. `npm run test:db`, including `child_name_optional.test.mjs`, `children_entitlements.test.mjs`, the sync and grants tests.
3. The B-8 job and the store-profile Release launch check (20 s) on the production profile.
4. `npm run preflight:production` with #698 applied.
5. Web e2e: J01, J03, J04, J05, J06, J07, J09, J13, J16, J17, J22, `first-run-small-screen` (every journey that starts a first run). J13 is `fixme` if it flakes (#533).
6. Maestro on a simulator, nightly set: E2E-01a, 01b, 02, 03, 09, 12.

Device (rows in section 2): S1-190, S1-192, S1-193, S1-194, S1-195, S1-196, S1-197; S1-03, S1-06, S1-08 re-pointed at screen 2; S1-10 and S1-13 through the local-start or signed-in path (the save path changed); S1-35 and S2-13 on the production profile; S1-95 and S1-96 from the You tab; S1-133 on a local-start phone; TF-03 (an older build's books, including a book with a name, update to the new build); TF-04 rewritten.

---

## 7. Release-blocking tests for submit

**Blocking (a failure or a not-run stops the submit):**

- Every automated item 1 to 6 above, green on the release branch head.
- NX-31 section 13 gate sentence: "R17, R18, R19, R20, R24 and R25 each have a device or ops run with servers on". That is S1-190 (a), S1-192, D31-15 (ops), S1-197, D31-16.
- S1-190 (b) and (c) on the production backend (gate G1: D31-1, D31-2, D31-3 on that project).
- S1-193 (R22: a signed-out phone with a book is never locked out).
- S1-194 (a, b, d, e) and, before any build that lets the nameless path reach a server, the migration applied to production (X2).
- S1-195, S1-196, S1-35 and S2-13 on the production profile, S1-10, S1-13 (kill during save, small count as the run sheet fixes it; I do not know the run sheet's count).
- The gates G1 to G7 of NX-31 section 0, each shown closed; I list the proof for each in section 10.

**May be accepted not run only with the founder's written OK (name the row, the risk, the owner):**

| Row | Risk accepted |
|---|---|
| S1-191 (resume) | A parent who quits mid-way may land on the wrong step or lose typed values |
| S1-198 (second phone) | A returning customer may be asked for the child again or see a false recordings line |
| S1-190 (d) screen 2 at AX5 and VoiceOver | Accessibility regression on the one screen every new customer sees (A-NFR-005 to -007); I advise against skipping |
| S1-190 (e) Apple scopes and Hide My Email | The Apple sheet may ask for more than the email |
| S1-190 (g) 60 s recoveries | A dead end after a late email |
| S1-194 (c) server check of a nameless book | The server may refuse a book the phone made, if X2 is not closed |
| NX-32 conditional rows | Account page issues, only if that slice ships |
| R15 stopwatch | None for the release; it is a study |

---

## 8. Known flakiness

- **#533, open (READ):** web journey `[J13] reminders: off, on, how often` failed once in a full run with `local_db_migration_failed:1` under CPU load (2 workers, a 2-core box at load average 5 to 7), 89 passed and 1 failed in 16.1 min; run alone it passed in 10 s and 25 s. Cause UNKNOWN (the issue says so: web sqlite migration under load, a startup race, or something a phone can also hit). The stated rule: if J13 flakes in the web journeys CI job it is marked `test.fixme` with the link, and the mark comes off when fixed.
- **Why it matters here:** the same local database migration runs at the start of every web first-run journey, and R4 (resume) and R22 would add more web tests that depend on that storage. Every new web journey inherits this unexplained failure. I have not reproduced it or tried new seeds; I did not run any suite.
- The verifier fuzz and the PGlite database job use fixed seeds in CI (`SCRIBE_FUZZ_SEED`); I found no new nondeterminism in the six PRs' tests. The `compliance-fence` check showed one cancelled run on each of #699, #700, #701, #702 beside a success; cause UNVERIFIED (a superseded run is the likely reading).
- `fix/qa-kill-harness-boot-slack` exists as a branch (name only; content UNVERIFIED).

---

## 9. Test plan for the account-first outage and offline path

**Goal:** prove R18 and R19 without a production backend, and prove the button never shows when it must not.

### The truth table (unit, no device, no network)

A pure function of three inputs: answered Yes on screen 1 (yes, no, not asked), the screen-2 state (healthy, sign-in failed, timed out at 10 s, offline), the compiled constant (on, off). The button shows only for Yes, a failure state and constant on. That is 3 x 4 x 2 = 24 cases; assert all 24, including "No, any state, any constant: never". Title them `[NX-31-R18] ...` and `[NX-31-R19] ...`. Add a fake-timer test for exactly 10 s, back-off growth, and one automatic retry when connectivity returns. Fails today because no outage state exists.

### How to simulate a sign-in outage without a production backend

| Layer | How | What it proves | Limits |
|---|---|---|---|
| Web (Playwright) | The mock Supabase server answers `/auth/v1/*` in one of: hang past 10 s (with the page clock), 503, 429, connection refused (`route.abort`), offline (`context.setOffline`) | R18, R19, retry on recovery, button matrix, no error code on screen | Not a real phone; web has no Apple sheet |
| Local stack (simulator or Mac) | `supabase start`, then `supabase stop` or pause the container while screen 2 is open; restore it and watch the retry succeed | Real client against a real Auth that goes away and comes back | The web and simulator cannot show OS-level offline UI |
| Build pointed at a dead host | Build with the Supabase URL set to a closed port (refused) and a non-routable address (hang to the 10 s timeout); needs a build per case | Outage with the radio healthy; the reviewer's view | Costs a build; B-8 must still pass; never a store profile |
| Device, no build change | Join a Wi-Fi network with no internet (router WAN cable pulled, or a hotspot with data off) after answering Yes: requests hang and the 10 s screen shows. Airplane mode gives the offline screen, which is a different state | S1-192 (c) and (a) | Apple's own service is also unreachable, so this does not isolate a Supabase-only outage |
| Device, backend only | A DNS block profile for the project host only, or pausing a throwaway Supabase project (the Free plan pauses projects) | An outage of our backend with Apple reachable | Whether the founder has a DNS-profile tool is UNVERIFIED. iOS Network Link Conditioner (100 percent loss) needs the phone's Developer menu, which appears after Xcode has connected; the given "sitting 10 needs Xcode" may be that; I could not read the run sheet to confirm |
| Apple outage | Cannot be simulated for real. Cancel the Apple sheet (`auth_deferred`, no failure recorded) and use the mock for the rest | The cancel path | Real Apple behaviour is UNVERIFIED |

### Device script (S1-192, proposed)

1. Fresh install, answer Yes, airplane mode on before screen 2: the screen says sign-in needs a connection, no broken button, no error code; the local-start button is present (R19, D31-10, D31-19).
2. Turn the connection back on without touching the screen: it retries by itself and moves on.
3. Wi-Fi with no internet after Yes: at about 10 s the outage screen shows, with retry, "your letters are safe", and the local-start button; time it with a screen recording (measure, do not assume).
4. Restore the internet while the outage screen is open: it carries on by itself.
5. Second fresh install, answer No: the stop screen; airplane mode and the outage state; the button never shows; no book can be made.
6. Tap the local start; make the book; write and keep one letter; the You tab shows the signed-out card with the move-on line.
7. Restore service; sign in; the consent screen then the masked-email tap show before anything moves (F02-REQ-019); decline each and confirm nothing moved.
8. Reviewer view (gate G6): from the Notes only, a non-founder finds the button in airplane mode.

### Boundary checks the plan must add

- The 10 s timeout is the existing session gate timeout (NX-31 cites `session-provider.tsx`; I did not read it). A pass is the screen at 10 s, not 8 or 15; allow a tolerance only if the founder sets one.
- A 429 (rate limit) must be treated as an outage, not as a wrong code.
- A healthy but slow network (3 to 8 s) must not show the outage screen.
- The local start must not be reachable by deep link or relaunch when screen 2 is healthy.

---

## 10. Risks and the go/no-go checklist QA wants

### Risks (my reading; none run)

| # | Risk | Evidence |
|---|---|---|
| X1 | **The Family tab returns in the store build.** #665 shows the Family tab when `alpha || coParent`, and `coParent` comes from the server-features switch. #698 turns that switch on for `production`. #699 pins `index, book, family, you` and #665's `store-family-tab.test.ts` asserts the production profile hides Family with servers off; #698 does not edit that test (READ, its file list). Merged together, either CI fails or a coming-soon or real Family tab appears in the first public build, against the cut "Tonight, Book, You" and NX-30a R6 | Patches of #665 (in #699), #698 |
| X2 | **Nameless sign-in fails on the server until the migration is applied.** `children.name` is checked 1 to 60 and `create_child_row` refuses empty today. #700's migration is pending, needs the red-team review and the approve-migration label, and applies from CI on a tag only. If Build 12 ships the phone side (#701) first, every nameless first run fails on the server path, which is now every path | #700 header, NX-31 R3 |
| X3 | **#520 rows are hidden once a phone signs in** (S1-133 Needs line). Under account-first every ordinary customer is signed in, so "Delete this book" and "Erase everything on this phone" may be reachable only on a local-start phone. Whether the rows are gated that way today, and whether a signed-in phone has an equivalent, is UNVERIFIED | DEVICE_TEST_PLAN S1-133 |
| X4 | R17, R18, R19, R22, R26, R27, R4, R8, R9, R20, R23 have no PR and no test. They are the core of the cut. If code lands late, the 14 h pass starts on a build nobody tested | Section 5 |
| X5 | R23 not built means every first-run web journey and Maestro flow stops at screen 2 when R17 lands: the whole e2e suite goes red or is skipped, and I will not skip it | NX-31 R23 |
| X6 | Existing device rows will fail by design (S1-27 (a), S1-131 (a), S1-140, parts of S1-03, S1-06, S1-08, S1-10, S1-26). An operator who does not know this will log false failures | Section 2.1 |
| X7 | Global `fill()` change (#701) and the prompt retirement (#703) widen the surface beyond onboarding; a string built by a function may still read "Dear your child" | Section 5 |
| X8 | #676 (drops sign-in from the store build) is still open and is the opposite decision (NX-31 section 0, record 2, READ) | NX-31 |
| X9 | The Build 12 backend gates G1 to G7 are all open per NX-31; `scribe-prod` did not exist in the docs and the S-52 attempt failed on 8 Nov (NX-31 text). Sign-in cannot be device-tested on production until it does | NX-31 section 0 |
| X10 | Existing PRs 700 to 703 are drafts: unmerged code is untested by the release process; hand-merging near freeze compresses the 14 h pass | Process |
| X11 | Time: the shortened pass is not 6 h once the cut is added (about 10 h, ESTIMATE) | Section 3 |
| X12 | Two device-id collisions (#680 and #684 on S1-133 to S1-135) can overwrite evidence rows | Section 2.2 |

### Go/no-go checklist QA wants

QA says no-go while any line is open. Each line names its proof.

1. **Code and tests:** R17, R18, R19, R22, R26, R27 and R23 each have a PR with a test whose title carries the id, green on the release head. (X4, X5)
2. **Lock offer:** a PR moves the card and R29 is tested, or the founder records in writing that the card stays at "The book is open." in Build 12. (B17)
3. **Tab decision:** the founder confirms three tabs in the production profile, and `store-family-tab.test.ts` and `tab-bar.test.ts` are changed in the same PR that turns servers on. (X1)
4. **Migration:** `20261109000000_child_name_optional.sql` approved, applied to production, and the S1-194 (c) check passes on production. (X2)
5. **#520 reachability:** a signed-in phone can erase everything and delete a book, shown on a device. (X3)
6. **Flags:** a test with the id R25 ties the Delete account flag to sign-in; the production profile shows the row; S1-35 and S2-13 production variants pass and the purge worker has run. (G5)
7. **Backend:** G1 smoke on production, D31-1, D31-2, D31-3 recorded with a build number. (G1)
8. **Policies and labels:** terms and policy rows seeded and public pages open on a phone (G2); the saved App Privacy label screenshot is in the release record (G3).
9. **Reviewer path:** S1-197 passed by a non-founder with no mailbox watching (G4); the Notes name the local start (G6); whether Apple accepts a Sign in with Apple sandbox account as the login stays UNVERIFIED, and the Notes say which path the reviewer uses.
10. **Mail and security:** D31-15 run, DMARC policy chosen, SMTP rate limit set, R-17 review status confirmed or a founder line (G7).
11. **Device pass:** the full blocking list in section 7 is run, or each skipped row has the founder's written OK naming the risk. The old rows listed in section 2.1 have been rewritten before the pass.
12. **No weakening:** no test was deleted, skipped or loosened to reach green. `fixme` on J13 only with the #533 link. The one edited assertion in `children_entitlements.test.mjs` is listed to the founder.
13. **Time:** the evidence file records the real minutes per row group, so this file's estimates are replaced by data for the next build.
14. **Motion:** no NX-35 slice ships in Build 12 (agreed with NX-35 section 10 and its answer F-5), because it would change timing on record, Review and Keep and invalidate the device pass.
15. **PR hygiene:** #676 closed or superseded; #680 and #684 renumbered; PR bodies for #699 to #703 list the device rows from section 2.

---

## UNVERIFIED (everything I did not read or run)

- The Build 12 run sheet and every duration inside it; which sitting needs which tool beyond the two facts given.
- That S1-190 to S1-199 are free on all 574 branches.
- The real CI time of the web e2e job, and whether extra web builds fit the 10 minute budget.
- Whether #698, #665 and #699 together hide or show the Family tab at run time; my reading is from source-text tests and patches.
- Whether #520 hides its rows on a signed-in phone today; whether the NX-32 slice is in the cut; whether R4 (resume) is in the cut.
- The cause of the cancelled `compliance-fence` runs and of #533.
- The content of `session-provider.tsx`, `apple.ts`, `onboarding.tsx` as a whole, the sync apply path, and what `account-deletion-switch.test.ts` asserts after #698.
- The bodies of #664, #680, #684.
- Whether a retired prompt key stays in a phone's history after the prompt library bump.
- Every number in sections 3 and 4 is an estimate and none has been timed.
