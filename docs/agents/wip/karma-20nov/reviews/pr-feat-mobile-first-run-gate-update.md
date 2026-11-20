## Update 10 Nov (review fixes): new head 65fff75df2856398c10e57532208ee54d5d481ac
**Every earlier review (A and B at 18a6f96b, and all before) is void at this head; re-review needed.** The two reviews at 18a6f96b both said CHANGES. What changed:

1. **Merged with develop (a merge commit, no force push, no rebase).** The branch carried #701's pre-squash commits while develop has the squash (6800a54f), so write.tsx, first-run-child-name.test.ts and child.test.ts conflicted. All three are resolved to develop's side, so #701's review fixes survive. `git diff --stat origin/develop` is now only this PR's files: onboarding.tsx, `lib/first-run/{gate,merge-back,route}.logic.ts` and their tests (first-run-gate, first-run-merge-back, first-run-route, join-wait). "Stacked on #701" in the text below is out of date: #701 is merged.
2. **The servers-off no-op is now tested at the route.** The composition that was inline in onboarding.tsx moved to `lib/first-run/route.logic.ts` (`welcomeBeginAllowed`, `continueMayShow`), which reads `serverFeaturesEnabled()`. `test/first-run-route.test.ts` runs it with `setServerFeaturesForTests(false)` and `(true)` over every auth state (restoring, signedOut, signedOut with an outage error, signingIn, awaitingCode, checkingConsent, needsConsent, ready, signingOut), with and without a book. With the switch off the book list is not read at all (the route passes a function, not a list). Mutation checks, each killed: switch passed as `true`, book flag passed as `false`, auth state ignored (always ready, always signedOut, always restoring), the short-circuit on the switch removed.
3. **The sign-in gate hides Continue on the welcome only.** Before, `showContinue` fed the Continue button on all five steps, so a signed-in parent on the child step whose session was lost (or a person who opened a sign-in email link after the local start) lost the button with no line to say why, and could not reach the step that creates the book. Now a later step follows the join wait alone. `localStartChosen` is passed from the route as the text below says: tapping "Begin the book" with no session is the local start, and the route latches it in memory (never stored), so the way back to the welcome still shows the button. `join-wait.test.ts` has its source pattern updated, and the behaviour is tested (a signed-in parent on the child step whose session is lost keeps Continue).
4. **The rules the text states are pinned.** `OUTAGE_ERRORS` is tested kind by kind with an exhaustive record (a new auth error kind will not compile until it is placed): `network`, `rate_limited`, `email_wait`, `not_available`, `unknown` are outages; `wrong_code`, `cancelled` and the rest are not. `signingOut` counts as a session. A comment now says that a 429 on a code check (`awaitingCode`) belongs to the code screen and never reaches the gate; the gate reads `signedOut` only. Mutations killed: errors cut to `network` only, `wrong_code` and `cancelled` added, `email_wait` or `unknown` dropped, `signingOut` dropped from the session states.
5. **merge-back.logic.ts no longer has a way to remove a book.** The `removesLocalBook: true` branch is gone, with `saysEmptyBookRemoved`, the `openAccountBook` phase and the `localKeptLetters` input: a count of kept letters is not emptiness (a book with a draft, a waiting letter or a recording and no kept letter is not empty), so a count must never decide to remove a book. An account that has a book now always asks where the letters go (still NOT shipped; Build 12 adds the phone's book as a second book). The literal-false fields `deletesLetters` and `recordingsLeavePhone` and their constant assertions are gone; a test on the shape of the result (it can fail if a field is added) and a source check replace them.

No user-facing word changed. No analytics, storage, network or log call added. Nothing in docs/legal touched.

**Heads-up for the follow-up PRs.** #737 (`first-run-new-account-claim`) passes `localKeptLetters: 0` to `mergeBack` in handoff.logic.ts and its test `first-run-new-account.test.ts` asserts `four.removesLocalBook` is true (and passes `localKeptLetters` in two other calls): those lines change when #737 takes this head. #724 (`first-run-welcome`) also touches the same `showContinue` call in onboarding.tsx.

Tests at this head: first-run-gate 58, first-run-route 17 (new), first-run-merge-back 11, first-run-child-name 19, join-wait 14, account-deletion-gate 56: 175 pass. Whole apps/mobile suite: 243 files, 4587 tests, 4515 pass and 72 fail, all 72 in the 8 environment files (config, privacy-manifest, store-sign-in-capabilities, licences, capabilities, app-lock-wiring, hosting-ios17, preflight-production), which fail the same way, 72 in the same 8 files, on plain develop eadea4f4 (run here). `cd apps/mobile && npx tsc --noEmit`: 5 errors, all expo-clipboard and expo-local-authentication not installed in the sandbox (the same 5 Review A found on develop), none in files of this PR. Banned-character scan of added lines: 0.

Still true, not fixed here: alone, this slice is a dead end in a servers-on build (no session and no book hides "Begin the book"; the sign-in screens are #724). It must never be cut into a build without #724. `online` is hard-coded true, so the offline variant (R19) and `SIGN_IN_OUTAGE_MS` are not reachable from the route. Nothing ran on a device or simulator. The Notes for Review line for the local start (guideline 2.5.19) is still a TODO for counsel and the founder. `OUTAGE_ERRORS` treating `email_wait`, `rate_limited` and `unknown` as an outage (so the local start is offered on a too-soon second email) is the spec's choice (ambiguity 5 below) and still needs a product and CISO confirmation.

---

## Earlier text (before the review fixes; where it differs from the section above, the section above wins)

Stacked on #701 (head 4e3225912c8a080d42af456335538b3abe95d305). Draft. Slice 1 of account-before-book (NX-31 revision 3, BL-781, BL-783, BL-787). Behind the existing server-features switch. No screens.

## What is in it
- `apps/mobile/src/lib/first-run/gate.logic.ts`: `firstRunGate({ serverFeatures, ageAnswered, hasSession, hasLocalBook, online, signInFailed, localStartFallback })` returns the next step (`unchanged`, `ageGate`, `stop`, `signIn`, `outage` with `offline` or `outage` variant, `childStep`, `openTonight`). `LOCAL_START_FALLBACK = true` is a compiled constant: no env var, no remote config, no stored setting (CISO: any future remote switch is disable-only). `SIGN_IN_OUTAGE_MS = 10_000` mirrors the session gate timeout.
- `apps/mobile/src/lib/first-run/merge-back.logic.ts`: the PROPOSED merge-back rule (NX-36 4.2) as a pure function; nothing uploads before consent accepted and "Keep in this account"; no outcome deletes a letter; recordings never leave the phone.
- Wiring: one change in `app/onboarding.tsx`. With no session and no book, "Begin the book" waits (R17), except where the local start is offered, where that same button stands in for it. With server features off it is always shown. `test/join-wait.test.ts` has one regex widened to allow the gate line.
- Tests: `test/first-run-gate.test.ts` (50) and `test/first-run-merge-back.test.ts` (11), titles `[NX-31-R17]`, `[NX-31-R18]`, `[NX-31-R19]`, `[NX-31-R22]`, including `[NX-31-R17] with server features off the gate is a no-op`.

## Not in it
Sign-in, email-code, consent and child-step screens; the outage screen; back-off and reconnect retry (the flag `retryOnReconnect` is only data); any connectivity source (no dependency added, so `online` is always true from the route); analytics; strings. No content placeholders added (needs content and founder approval: none).

## Ambiguities in the spec, my choice
1. A phone with a book and age answer No: the root age gate owns it; the gate returns `stop` rather than `openTonight`.
2. A phone with a book and age not asked: `openTonight` (R22 wins).
3. Timed out at 10 s and sign-in failed are the same input (`signInFailed`); the 24-case table keeps them as separate rows.
4. Offline and failed together read as `offline`.
5. A 429 (`rate_limited`, `email_wait`), `network`, `not_available` and `unknown` count as an outage; `cancelled`, `wrong_code`, `invalid_email`, `provider` stay inline errors (QA: a 429 is an outage, not a wrong code).
6. Local start chosen: an extra optional input `localStartChosen`, honoured only for Yes and constant on, so the person is not bounced back to the outage screen; once chosen, a healthy screen 2 does not pull them back.
7. Default of the constant: NX-31 says the fallback is decided (option B) but names no value; set true for the store build.
8. Session being restored counts as no session (the button waits a moment).

## UNVERIFIED
Nothing ran on a device or simulator. The wiring in `onboarding.tsx` is covered by source-pattern tests only. Whether `useAuth` is always inside the provider on the onboarding route is read from `_layout.tsx`, not run. The 10 s screen timing and offline behaviour need device rows D31-10, D31-11, D31-19.

Checks: `npm test` all workspaces green (mobile 231 files, 4365 tests); `npm run typecheck` and `cd apps/mobile && npx tsc --noEmit` clean; banned-character scan clean.

## Update 10 Nov: new head df703307135f7102cb80a2d3b3f8abe54a7159f9 (red-team fixes)
**Every earlier review is void at this head; re-review needed.** What changed since ef8f8977ce:
- Merged #701's new head (dc7bf25fb) into this branch (a merge commit, no force push), so this stack stays current with its predecessor.
- `merge-back.logic.ts`: kept the code (later slices call it) but marked cases 4 and 5 ("empty local book removed", "In the existing book") as NOT shipped; Build 12 adds the phone's book as a SECOND book and deletes nothing. New `UNSHIPPED_PHASES` export and a test that pins it. `dedupeByLetterId` is documented as a label only, with no dedupe code; claim safety rests on `takeOwnership` (server_state local, UUIDv7 ids). I did NOT delete the phases because #737's tests pin `askDestination` and `openAccountBook`; deleting them belongs in a change that also edits #737.
- `gateInputsFromAuth` hard-codes age Yes: new test pins that the root layout renders the age gate before `SessionProvider` and every route.
- NOT FIXED (by design, stated): alone, this slice is a dead end in a servers-on build (no session and no book hides "Begin the book"; sign-in screens arrive in #724). It must never be cut into a build without #724.
- compliance-fence: it runs on `pull_request_target` (opened/synchronize/edited/labeled...), so this push should trigger it; I cannot trigger or read it from here. Check the run at the new head.
- Local-start bypass (constant `LOCAL_START_FALLBACK`) still needs the CCO / App Review note (guideline 2.5.19). TODO: counsel/founder.

Tests at this head: apps/mobile 231 files, 4370 tests green; `npx tsc --noEmit` clean.

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
