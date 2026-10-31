# First-run setup and account setup review, 31 Oct 2026

Reviewer: independent product QA (agent), read-only on the code. Worktree `develop` at review time.
Scope: 18+ gate, welcome, promise, child, signature, language, speech download, microphone, first letter, reminders, sign-in, co-parent join and invite, Settings > Account. Build 1 = servers off (`testflight`/`production` profiles); build 2 = servers on (`preview`), per D-121 and D-130.

**Verified** = read in code or run. **Inferred** = reasoning, not observed on a phone. Nothing here was run on a device; e2e-web and Maestro flows were read, not run. `apps/mobile` unit tests were run: 170 files, 3374 passed, 1 skipped.

## Verdict

The first run is short and calm: five screens after the gate (welcome, promise, child, signature, "The book is open."), with no account, no OS prompt and no network ask inside it. The server switch hides sign-in, Account, Delete account and "I was invited" in build 1 (Verified). A tired parent can finish setup in about 60 to 90 seconds (Inferred: about 10 taps plus typing a name and picking a date; a date wheel for an older baby takes longest).

The main problem comes after setup. What happens after the first letter does not follow the decided ask order (DR-12 B). Build 2 opens the account sheet right after letter 1. Neither build ever offers the reminder prime. That is a P0 requirement (C-REQ-001 Rev, F13-REQ-023). Two store-build items are still open from D-121 and D-126.

## Step table

| # | Step | Build 1 (servers off) | Build 2 (servers on) | Test coverage | Issues |
|---|---|---|---|---|---|
| 0 | 18+ gate | Shown before any route (`_layout.tsx:192`); nothing preselected; No = 24 h stop | Same; the account flow can ask age again on `/sign-in/consent` only when Terms lack the attestation | J01, J01c, J02 (web); E2E-01a/b (Maestro); `age-gate-screen.test.ts` | Note only: a mis-tap No locks out for 24 h (D-026, by design) |
| 1 | Welcome | "Begin the book" only; both doors hidden (`onboarding.tsx:518`) | Plus "I already have a book" and "I was invited" | J01 asserts doors hidden; J21, J22 for doors | none |
| 2 | Promise | Sample fix, voice on this phone, private by default | Same | J01 | Headline wording allowed in-app (D-125 item 9) |
| 3 | Child name + birthday/due date | Required, no default date (D-087); twins up to 6 | Same | J01, J01d, E2E-02, small-screen flow | SET-04 (three "Birthday" labels), SET-05 (hardcoded "your child") |
| 4 | What the child calls you + language | Language row opens a picker with English only (testflight) | Same | J01; E2E-05 (Hindi packs, all-language build) | SET-03 (production lacks English only), SET-06 (row adds a decision in an English-only build) |
| 5 | Speech download (D-065, D-087) | One explicit ask on the last screen, size from the plan, Wi-Fi | Same | J01, `speech-consent` tests | none |
| 6 | Microphone | OS prompt only on first Speak (`listen.tsx:148`) | Same | E2E-03; device row B1-5 open | none (string in `permissions.en.ts` fine) |
| 7 | First letter | Saved, lands on the Book | Same, then the sign-in sheet rises (`review.tsx:422`) | J04 to J06; J22b; `review-write.test.ts:232` | SET-01 |
| 8 | Reminders opt-in | Settings > Reminders only | Same | J13 (Settings path only) | SET-02 |
| 9 | Sign-in prompt | Not reachable: `(auth)/_layout.tsx:24` redirects; `auth.configured` false | After letter 1 (should be session 2 or letter 2) | J22, J22b to J22l; E2E-12 | SET-01 |
| 10 | Co-parent join ("I was invited") | Hidden on welcome; links open coming soon, token dropped (`entry.logic.ts`) | Paste link, sign in, peek, Join; typed code not read (D-120) | J21, J21b to J21j; E2E-13b/c | none in setup; code entry unmet by decision D-120 |
| 11 | Co-parent invite | Family tab and child row show "coming soon" | Share link through the iOS share sheet; no app-sent email | J21c, J21d, J17; E2E-13a | SET-07, SET-08 |
| 12 | Settings > Account | Row hidden; route redirects (`account.tsx:54`) | Signed in/out views, sign-out waits for outbox | J22c; `server-surfaces-*` tests | none |

## Findings

### SET-01 High (build 2): the account sheet opens after the first letter, against the decided ask order. Verified
- Evidence: `apps/mobile/src/app/review.tsx:427` sets `offerSignIn.current = firstLetter && auth.configured && auth.state.status === 'signedOut'`, and `:422-423` pushes `/sign-in?trigger=first_letter` after the Book lands. DR-12 decided B (`docs/prd/v2/09-decisions-and-risks.md:19`). F02 line 92 and line 99 restate it: "Keep the book" comes on "the first save in session 2, or the second saved letter", and the reminder prime takes the first ask slot. F13-REQ-023 (P0) says: "Given the first letter saved, Then `nextAsk` returns `reminder_prime` before the account ask". No `nextAsk` exists in `apps/mobile/src` (grep). Tests lock in the current behaviour: `test/review-write.test.ts:232` and e2e-web J22b. No decision in `docs/DECISIONS.md` reverses DR-12. EXPERIENCE_PASS 5.8 row 5b follows the older order.
- Fix: add `lib/asks/next-ask.logic.ts` with the F02 order table (reminder_prime, then keep_book on the first save of session 2 or letter 2, then analytics), at most one ask per session. In `review.tsx` replace the `firstLetter` condition with `nextAsk(...) === 'keep_book'`, and update `review-write.test.ts:232` and J22b to assert no sheet after letter 1 and the sheet after letter 2. If the founder prefers A, record a decision that reverses DR-12 and update F02, F13 and the go/no-go row instead.

### SET-02 High (both builds): the reminder prime after the first letter is not built. Verified
- Evidence: the copy exists (`packages/content/src/strings.en.ts`, `onboarding.reminder.*`, commented "Shown as a card on Tonight after the first letter is saved"). Its only user is `ReminderPrimingSheet` in `app/settings/reminders.tsx:250`, with `track('reminder_prime_shown', { source: 'settings' })` at `:95`. No first-letter source exists. C-REQ-001 Rev (P0, F13 line 254) and F13 6.2 B rows 1 to 4c need the card after the first letter's saved moment, with at most two primes. Today a parent learns about reminders only by opening Settings. That gives up the habit lever the spec chose B for.
- Fix: after the saved moment, when `nextAsk` returns `reminder_prime`, show the `onboarding.reminder` card on the Book or on Tonight. "Yes, evenings" and "Pick a time" open `ReminderPrimingSheet`, then the OS alert. "No reminders" stores a count, with at most 2 ever. Add a web journey (J13b) and a unit test for the cap.

### SET-03 High (store build 1): the `production` profile is not English only. Verified
- Evidence: `apps/mobile/eas.json:56-68` (`production`) has no `EXPO_PUBLIC_ENGLISH_ONLY`. `testflight` (`:82`) and `preview` (`:53`) do. D-121 item 1 says the first store build is "English only (`EXPO_PUBLIC_ENGLISH_ONLY=on`)". Without it, the language row on the signature step (`onboarding.tsx:470-476`) offers all seven languages, and speech for them is not reviewed (D-125 item 2).
- Fix: add `"EXPO_PUBLIC_ENGLISH_ONLY": "on"` to `production` with the three tests D-121 names, in the window D-121 and D-126 set (after the Mon 9 Nov go/no-go), and add a preflight check that fails a `production` build without it.

### SET-04 Low (both): "Birthday" appears three times in a row on the child step. Verified
- Evidence: `onboarding.tsx:403` uses group label `o.child.birthdayLabel`, `:407` uses option label `o.child.birthdayLabel` (beside "Not here yet"), and `:414` and `:422` use the date label `o.child.birthdayLabel`. VoiceOver reads "Birthday, radio group, Birthday, selected". The group's question is not said.
- Fix: in `strings.en.ts` add `child.bornQuestion: "Is {child} here yet?"` and `child.bornLabel: "Born"`. Use `bornQuestion` as the ChoiceGroup label and `bornLabel` as the first option, and keep "Birthday" only above the date field.

### SET-05 Low (both): user-facing English typed in the screen. Verified
- Evidence: `'your child'` appears at `onboarding.tsx:129`, `:242`, `:331` and `:353`. Content lives in `packages/content` (CLAUDE.md), which already has `auth.consent.childFallback` and `family.soon.childFallback`.
- Fix: add `onboarding.childFallback: 'your child'` to `strings.en.ts` and use `o.childFallback` at all four places.

### SET-06 Low (English-only builds): the language row asks a question that has one answer. Verified code, Inferred effect
- Evidence: `onboarding.tsx:468-478` always shows the row. With `capabilities.englishOnly` on, the picker lists English alone plus "Other languages are coming in a later update." (`language.en.ts:64`). That adds a decision and a "coming" promise to setup.
- Fix: render the row only when `!capabilities.englishOnly`. Settings > Language still says the same thing.

### SET-07 Medium (store build 1): co-parent "coming soon" screens are still shown. Verified, known (D-126)
- Evidence: `app/(tabs)/family.tsx:91` renders `FamilySoon` with the switch off, and `app/settings/children/[id].tsx:138` shows `soon.settingsRow`. D-126 hides both in the store build after the go/no-go. The change is not on `develop` yet.
- Fix: as D-126 says. Hide the Family tab (`(tabs)/_layout.tsx`, `href: null` when `!capabilities.coParent`) and the child row when `!capabilities.coParent`, and flip the J17 and coparent-soon tests. Otherwise use the D-126 fallback (the Notes for Review line).

### SET-08 Medium (build 1, then the sharing release): "Tell me when it's here" makes a promise nothing keeps yet. Verified
- Evidence: `family.en.ts` `soon.notify.done` says "When the update arrives, you will see it here." The flag is read only by `coparent-soon.tsx:56-57`. No servers-on code reads `hasRequestedCoParentNotify` to show the arrival note, and the content comment itself says "True only with the v1.1 card". Under D-121, sharing ships in a 1.0.x release, so that release must carry the card.
- Fix: add the "Writing together is here" note (Tonight card, once) to the sharing release's checklist in `docs/backlog/future/06-coparent-sharing-v1-1.md`, re-dated to the 1.0.x release, and a test that a phone with `family.coParentNotify` set sees it once. If SET-07 hides the screen first, the button goes with it and this finding closes.

## Checked and found sound (Verified)
- No OS prompt during first run. Microphone at first Speak; notifications only from the Settings priming sheet.
- Speech download: one explicit ask, size from the plan, Wi-Fi only, "Not now" keeps the voice (D-087, D-065).
- Build 1 cannot reach sign-in: the welcome doors, `(auth)` routes, the Account row and route, the Delete account row (`buildFlagEnabled` needs servers), and auth and invite deep links (`planIncomingLink`) are all closed with the switch off.
- An open deletion request replaces the welcome (`onboarding.tsx:585-590`), so no second book is made over it.
- Build 2 join: the generic landing before sign-in, nothing preselected, typed code refused with a clear line (D-120), Close before the book arrives handled (J21i, J21j).
- All screen copy read passes the content rules (the rules test is green). No gendering, no AI-writes claims, no gap counting.

## Not covered by any test
- The full first run timed end to end (add a J01 timing assertion or a stopwatch row to DEVICE_TEST_PLAN AL-01).
- The reminder prime after letter 1 (not built, SET-02).
- `production`-profile language list (SET-03).
