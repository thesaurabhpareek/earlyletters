# First run: engineering design for NS-38 to NS-45 (part 4 of 5: test design for the 96 P0 rows)

Status: Proposed, 20 Nov 2026 (RD-I1). Author: `sync`. Target: `docs/tdd/new-scope/12-first-run-4.md`. Frame and tags: `12-first-run.md`. The test catalogue (#924 to #927, catalogues A to D) has no rows for NS-38 to NS-52 [V: `grep -c "NS-3[89]\|NS-4[0-5]"` over the four files returns 0 for NS-38 to NS-45 ids]; the table below is the proposal for `qa` to take into a catalogue E (`TEST-CASE-CATALOGUE-E-first-run.md`, PROPOSED name), in the catalogue's own columns.

## 13. How to read the table
- Titles are the cards' own backticked titles, exact (`19-from-download-to-first-letter.md` section 7 of each card); test files carry the bracketed id so `scripts/trace.mjs` can read it once it reads NS ids (gate G0; the card header says it does not yet). All 96 P0 ids are present once [V: parsed against the card tables, 96 of 96, none missing, none extra].
- Lvl: U unit (vitest, pure), I integration (real store on node SQLite, or `supabase/tests` for db), S source scan (needs a positive control: one fixture that must fail), J journey (simulator flow), D device (a phone, `qa` and the founder), P process or document check. Run: SB runs in the sandbox (Node 22.5 and up; 8 baseline files stay red), CI needs CI, macOS, Deno, a simulator or a staging project, DV only on a phone, DOC a checklist. Today: `fails` means my reading of develop says the code does not meet the row (cite in the design file), `none` means I expect no test cites it; `scripts/trace.mjs` was not run for these ids. Dsn: this file set (`12`).
- Mutant: the one-line change that must turn the test red (rule from `SECURITY-PRIVACY-ACCEPTANCE.md` section 1: a test with no mutant that goes red is not proof). Mutants are designs, not runs; the first run of each belongs to the PR's author.
- Fixture family: the fictional family Asha only (`packages/content/test/no-real-family-data.test.ts`); no child name, transcript or audio in any fixture, stub or snapshot.
- P1 rows (27 across the eight cards: NS-38-R6; NS-39-R7, R8, R9, R13; NS-40-R4, R11, R14; NS-41-R8, R12, R15, R17, R21, R24, R25; NS-42-R8, R12, R14; NS-43-R5, R9, R12; NS-44-R5, R11, R13; NS-45-R4, R14, R17) are listed with their PR in part 5 section 2; each gets a title test in the PR that builds its behaviour, no separate design.

## 14. New test files and where they run
| File (PROPOSED path) | Rows | PR |
|---|---|---|
| `packages/content/test/store-listing.test.ts` | NS-38-R2, R5 | FP-1 |
| `apps/mobile/test/first-run-no-prompts.test.ts`, `first-run-offline.test.ts` | NS-39-R1, R2, R5, R12, R14 | FP-12 |
| `apps/mobile/test/age-range.test.ts` (injected signal, spies) and `modules/age-range` source scan beside `photos-device.test.ts:303` | NS-40-R5, R6 | FP-10a, FP-10b |
| `apps/mobile/test/auth-region-refused.test.ts` | NS-40-R9, NS-41-R25 | FP-6 |
| `supabase/tests/compliance_gates.test.mjs` (in PR #424) | NS-40-R10, R12 | `data-architect` |
| `apps/mobile/test/auth-normalize.test.ts`, `auth-code-pause.test.ts`, `auth-config-agree.test.ts` | NS-41-R9, R10, R11, R24 | FP-7, FP-8 |
| `apps/mobile/test/consent-builder.test.ts` and `supabase/tests/consent_builder.test.mjs` | NS-42-R2, R3, R7 | FP-2 |
| `apps/mobile/test/legal-links.test.ts`, `packages/content/test/no-invite-promise.test.ts` | NS-42-R9, R13 | FP-3 |
| `apps/mobile/test/first-books.test.ts` | NS-43-R1 to R14 | FP-13 |
| `apps/mobile/test/first-run-no-plus.test.ts`, `free-allowance.test.ts` | NS-44 rows | FP-14 |
| `apps/mobile/test/update-line.test.ts`, `account-deletion-steps.test.ts` | NS-45-R5, R13, R15 | FP-15, FP-16 |

Journeys (PROPOSED, `qa`): J-FR1 clean install to first kept letter on an SE 3 with Asha only, 90 s target (F03-REQ-008) and no permission prompt before Speak; J-FR2 airplane-mode install; J-FR3 restored phone; J-FR4 deletion request, kill, relaunch, cancel on a second phone. Device rows go on the run sheet of the build that carries them (`NS-34` pattern).

## 15. The 96 P0 rows

| Row | Exact title | Lvl | Run | Today | Fixture, act, assert | Mutant that must turn it red |
|---|---|---|---|---|---|---|
| NS-38-R1 | `[NS-38-R1] store record set before submission` | P | DOC | none | Release checklist row per ASC field (rating 18+, US only, Lifestyle, both subscriptions, Family Sharing) with a dated screenshot slot; a check fails the release PR on an empty cell | Delete one screenshot cell |
| NS-38-R2 | `[NS-38-R2] the listing describes the build` | S | SB | none | store-listing.test.ts: store.en.ts against the forbidden-claim list per eas.json profile (FS-1); one fixture string per pattern fails | Add "no account needed" to one listing line |
| NS-38-R3 | `[NS-38-R3] store name from brand` | S | SB | none | Scan apps and packages for the store-name literal outside packages/brand; brand.storeName used everywhere else | Type the store name in a second file |
| NS-38-R4 | `[NS-38-R4] privacy label matches the build` | S | CI | none | BL-975 label guard fixture: fields from NS-40 to NS-45 section 11 against the declared label; PR body carries Label effect | Add a collected field with no label line |
| NS-38-R5 | `[NS-38-R5] review notes match the build` | S | SB | none | app-review.en.ts holds the account reason, demo path, Yes answer, two free letters, Start on this phone; never "no account" | Reword to "no account is needed" |
| NS-38-R7 | `[NS-38-R7] screenshots from the release build` | P | DOC | none | Screenshot file names carry build and "asha"; surface checklist (no co-parent, backup, other language) | Include a co-parent screenshot |
| NS-38-R8 | `[NS-38-R8] restored phone opens the book signed out` | D | DV | none | Device restore from iCloud backup: Home shows the book signed out, sign-in offered, no duplicate after sign-in (S1-204 shape, NS-10-R6) | Delete the book at restore |
| NS-38-R9 | `[NS-38-R9] export compliance answered` | P | DOC | none | Export compliance answer equals Q24 and the self-classification record (usesNonExemptEncryption false, app.config.ts) | Answer differs from the record |
| NS-39-R1 | `[NS-39-R1] first launch never waits on the network` | I | SB | none | Mount the gate with throwing fetch and supabase stubs, no network; question interactive; zero calls before ageGate.passed | Read the session before the age answer |
| NS-39-R2 | `[NS-39-R2] no permission prompt in first run` | S | SB | none | first-run-no-prompts.test.ts import-graph scan (FS-5) plus a J flow with no OS prompt through The book is open. | Call requestPermissionsAsync in onboarding |
| NS-39-R3 | `[NS-39-R3] nothing downloads without a tap` | U | SB | none | speech-consent-card.logic: no byte requested before the tap; Not now starts nothing | Start the download in a mount effect |
| NS-39-R4 | `[NS-39-R4] a recording waits for its words` | I | SB | none | Record with no model on the stand-in: take kept untouched, words pending; cites FR-AIS-16 | Drop the take when the model is missing |
| NS-39-R5 | `[NS-39-R5] offline first launch has a way forward` | U | SB | none | gate offline after the answer: outage view within 1 s with Try again and Start on this phone; back online returns the Welcome | Remove the local-start action |
| NS-39-R6 | `[NS-39-R6] servers-off first run has no sign-in` | U | SB | none | firstRunGate with serverFeatures false returns nothing; Welcome shows Begin the book only; no sign-in or account door | Show sign-in when the switch is off |
| NS-39-R10 | `[NS-39-R10] microphone primer before the system prompt` | U | SB | none | listen.logic startTake: primer first; Continue is the only path to the iOS prompt (cites NS-44-R6) | Ask for the microphone before the primer |
| NS-39-R11 | `[NS-39-R11] launch recovery never deletes` | I | SB | none | Database open fails: recovery with Try again and Export what's readable; fs stub shows no file or row removed | Call removeEverything from recovery |
| NS-39-R12 | `[NS-39-R12] first run shows no teaser and no price` | S | SB | none | Scan first-run modules for billingCopy, familyCopy.soon, stories (FS-8) | Import the Plus line into the Welcome |
| NS-39-R14 | `[NS-39-R14] a No discards a held link` | I | SB | none | Held invite or email link then No: token deleted, zero requests | Keep the token on No |
| NS-40-R1 | `[NS-40-R1] the age question comes first` | U | SB | none | With notAsked the gate answers ageGate for icon, invite and email-link entries; render tree has no route behind it | Mount the tabs before the pass |
| NS-40-R2 | `[NS-40-R2] Yes stores a boolean only` | I | SB | none | Yes plus tick: settings hold ageGate.passed only; table dump has no time, age or range of the Yes | Store the time of the Yes |
| NS-40-R3 | `[NS-40-R3] No creates nothing and holds 24 hours` | I | SB | none | No: one ageGate.stoppedAt row, held token gone, Documents empty, zero requests; 23 h 59 min relaunch shows the stop | Stop for 12 hours |
| NS-40-R5 | `[NS-40-R5] the system age signal decides only a stop` | U | SB | fails | readAgeSignal injected: minor stops at once; adult still shows the question; declined, error, 3 s, iOS below 26.2 leave the question | Treat adult as a pass |
| NS-40-R6 | `[NS-40-R6] the system age signal is never stored` | S | SB | fails | Spies on settings, Keychain, logger, analytics and fetch while a signal arrives: zero writes carry it | Persist the range |
| NS-40-R7 | `[NS-40-R7] attestation is recorded, never an age` | I | CI | none | Terms record context holds age_attested true and no age_signal; server refuses false (db test) | Add age_signal to the context (CF-1) |
| NS-40-R8 | `[NS-40-R8] No at the age step ends the session` | I | SB | none | Age step No on the sheet: session ends, gate closes, record_policy_act not called | Record a decline row |
| NS-40-R9 | `[NS-40-R9] a refused sign-up is calm and stores nothing` | U | SB | fails | region_refused maps to the refusal screen; storage dump empty; no location question; not an outage | Map it into OUTAGE_ERRORS |
| NS-40-R10 | `[NS-40-R10] every sign-in method meets the country check` | I | CI | fails | Staging with the hook on: Apple, Google (if on) and email sign-ups from a test refused location are each refused | Hook only the email path |
| NS-40-R12 | `[NS-40-R12] country counts hold no person` | I | CI | fails | compliance_gates.test.mjs: counts table has day, check, outcome, jurisdiction, n only; a block row holds the code, a pass row none; no ip, email or user id | Add an ip column |
| NS-40-R13 | `[NS-40-R13] the age screen works with VoiceOver and at AX5` | D | DV | none | VoiceOver order and AX5 on SE 3 for E-S03 plus the a11y scan | Remove the heading focus |
| NS-41-R1 | `[NS-41-R1] one door, two ways in` | U | SB | none | Welcome renders Apple and email at equal size; scan auth copy and screens for sign up, log in, create account, magic link, password | Add a Create account label |
| NS-41-R2 | `[NS-41-R2] new and returning look the same` | U | SB | none | Known and unknown address: same call shape (shouldCreateUser true), same screens and words | Set shouldCreateUser false for a known address |
| NS-41-R3 | `[NS-41-R3] a link signs in only the phone that asked` | I | SB | none | Link requested on phone A opened on phone B or by another person: no session; code path; H1 five steps | Accept a link with no pending note |
| NS-41-R4 | `[NS-41-R4] a link never replaces a session` | I | SB | none | Signed in plus any email link: session unchanged, refused screen says how to change accounts | Replace the session on a link |
| NS-41-R5 | `[NS-41-R5] claim needs consent and a tap` | I | SB | none | Unowned letters, sign in and consent: nothing claimed or uploaded before Keep in this account on a screen with the masked address | Claim after consent without the tap |
| NS-41-R6 | `[NS-41-R6] a second account never reaches the first` | I | SB | fails | Asha A signs out, Asha B signs in through the real gate: no letter, recording, picture, child name, Find result or reminder of A; A returns and sees it (BL-961 part 3) | Open the local book for any session (gate.logic.ts:123-125) |
| NS-41-R7 | `[NS-41-R7] every sign-in error has its words` | U | SB | none | Each AuthErrorKind has words and a glyph; cancelled shows nothing; no code, status or English from Supabase in the render | Render error.message |
| NS-41-R9 | `[NS-41-R9] the wrong-code pause` | U | SB | fails | Five wrong codes in 15 min pause entry; Send a new email neither clears nor shortens; pause survives a kill (Keychain stub, FS-17) | Clear the pause on resend |
| NS-41-R10 | `[NS-41-R10] code length agrees everywhere` | S | SB | fails | otp_length in config.toml equals EXPO_PUBLIC_EMAIL_OTP_LENGTH in every eas.json profile; no six-digit literal in templates, copy, notes | Leave 6 in one profile |
| NS-41-R11 | `[NS-41-R11] code and link live 15 minutes` | U | SB | fails | PENDING_REQUEST_TTL_MS equals 900000 equals otp_expiry times 1000 | Leave one hour |
| NS-41-R13 | `[NS-41-R13] Apple token captured for revocation` | I | SB | none | Apple sign-in posts the code once to apple-token without awaiting it; never stored or logged; no_token on the receipt (fn test) | Await the capture before sign-in returns |
| NS-41-R14 | `[NS-41-R14] a returning account never meets the child step` | U | SB | none | Session and no book: never the child step while the account may hold a book; consent outstanding shows the sheet or held screen within 10 s (NS-10-R0) | Route needsConsent to the child step |
| NS-41-R16 | `[NS-41-R16] sign-in leaves nothing in logs` | I | SB | none | J-N18 canary over each sign-in path: no email, code, token hash, Apple code, name, user id in logs, breadcrumbs, route params, analytics | Log the address in a catch |
| NS-41-R18 | `[NS-41-R18] Hide My Email works end to end` | D | DV | none | Asha test account with a Hide My Email address: mail arrives; claim screen and Me show the method not the relay | Show the relay address |
| NS-41-R19 | `[NS-41-R19] sessions never move with a backup` | S | SB | none | Every Keychain write in lib/auth and lib/supabase passes AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY | Drop the option on one write |
| NS-41-R20 | `[NS-41-R20] only shipped ways in are named` | S | SB | fails | No Google or passkey control in a store build env; noEmailHelp and emptyBookHelp name only offered ways (strings.en.ts:1503-1504) | Leave Google in noEmailHelp |
| NS-41-R22 | `[NS-41-R22] sign-in works with VoiceOver and at AX5` | D | DV | none | VoiceOver heading focus, code field read as one field with its length, errors announced once; AX5 above the keyboard (a11y-ax5 scan extended) | Make the code boxes separate fields at AX3 |
| NS-41-R23 | `[NS-41-R23] no password path exists` | P | CI | none | Staging probe (OQ-F8): set a password through the admin API, password grant refused or alerted | Allow the password grant |
| NS-42-R1 | `[NS-42-R1] the box is never preticked` | U | SB | none | Age screen unticked on every visit, Continue enabled and says why when it waits, Terms and Privacy 44 pt links | Pre-tick after the first visit |
| NS-42-R2 | `[NS-42-R2] the local agreement record` | I | SB | none | Yes plus tick writes two agreement rows in the same transaction as ageGate.passed with all fields and no age; a kill between leaves neither | Write the rows after the age answer in a second transaction |
| NS-42-R3 | `[NS-42-R3] the Terms record before any sync` | I | SB | none | Terms step: agreement line directly above Agree and continue; one terms accept with context.auth and age_attested true before any sync | Sync before the Terms row |
| NS-42-R4 | `[NS-42-R4] a no as easy as a yes` | U | SB | none | Sensitive step: two answers equal size, nothing preselected, either writes one sensitive-data row | Preselect Keep on this phone |
| NS-42-R5 | `[NS-42-R5] decline keeps letters on the phone` | I | SB | none | Decline: zero entries uploaded, still signed in, full step two taps from Me, Privacy | Upload on decline |
| NS-42-R6 | `[NS-42-R6] the server refuses content before consent` | I | CI | none | Terms but no sensitive-data row: entry write raises SCCON (db) and the phone pauses the outbox keeping the write | Drop the write on SCCON |
| NS-42-R7 | `[NS-42-R7] consent rows carry PRIV-R21 fields` | I | CI | fails | buildConsentAct output run against record_policy_act and the trigger: hash, app_build, os_major, shown locale present; no ip, agent, device, age; a null hash raises 23502 | Send the constant locale en |
| NS-42-R9 | `[NS-42-R9] recorded version equals the text opened` | S | SB | fails | TERMS_DOC_VERSION and PRIVACY_DOC_VERSION equal the manifest version and the version in the opened link | Bump a constant only |
| NS-42-R10 | `[NS-42-R10] re-consent never blocks the book` | I | SB | none | New major while signed in: sheet before sync; read, record, play, export work whatever the answer | Block reading on decline |
| NS-42-R11 | `[NS-42-R11] declining still lets you leave` | I | SB | none | Decline a new version: Delete account works, export reachable (NS-10-R4a, R4b) | Require consent to delete |
| NS-42-R13 | `[NS-42-R13] no promise about invites in a store build` | S | SB | fails | No registered key names an invitation or "the people you invite" while family flags are off (auth.en.ts:232, strings.en.ts:1482) | Restore the line |
| NS-42-R15 | `[NS-42-R15] the agreement line is visible at AX5` | D | DV | none | AX5 on SE 3: agreement line and links visible above their buttons without scrolling | Move the line below the fold |
| NS-42-R16 | `[NS-42-R16] Not now records nothing` | I | SB | none | Not now: no record, no sync, the phone's book unchanged | Record a decline on Not now |
| NS-43-R1 | `[NS-43-R1] only the date is required` | I | SB | none | Birthday and no name: one book with empty stored name, "your child" shown; field-inventory scan finds no surname, gender, photo, contacts input | Require a name |
| NS-43-R2 | `[NS-43-R2] a missing date says why` | U | SB | none | No date: Continue waits with the reason, announced; no book made | Allow an empty date |
| NS-43-R3 | `[NS-43-R3] dates are real and in range on both ends` | U | CI | none | Phone ranges (not after today, 1900, due 305 ahead) and server 22023 cases (birthday after tomorrow, due 310 ahead, 400 back) | Widen the phone to tomorrow |
| NS-43-R4 | `[NS-43-R4] names in any script, never cut` | U | SB | none | 61 code points after NFC and trim: limit line, server refuses; any script up to 60 stored exactly in NFC | Truncate at 60 |
| NS-43-R6 | `[NS-43-R6] every first-run book is free` | I | SB | none | Three children together: three books, no Plus surface, server accepts all three | Gate the second book |
| NS-43-R7 | `[NS-43-R7] the signature before the first letter` | U | SB | none | signsAs empty or over 30 waits with reason; valid signs the first letter From {signsAs} | Allow 31 |
| NS-43-R8 | `[NS-43-R8] no child step for a returning account` | U | SB | none | Returning account never sees the child step (gate and route hook) | Show the child step on needsConsent |
| NS-43-R10 | `[NS-43-R10] first run ends on Home` | J | SB | none | Last step lands Home with the new book active; no sheet, prompt, Plus surface or lock offer | Keep the lock offer |
| NS-43-R11 | `[NS-43-R11] no language teaser in first run` | U | SB | none | English-only build: no language row, no "coming" line | Render the row |
| NS-43-R13 | `[NS-43-R13] the first book at AX5 and with VoiceOver` | D | DV | none | AX5 and VoiceOver through every field, choice and reason | Truncate the date reason |
| NS-43-R14 | `[NS-43-R14] a refused book is never deleted` | I | SB | none | Server refusal of a first-run book: it stays on the phone, nothing deleted, nothing on Home says an error | Delete the local row on reject |
| NS-44-R1 | `[NS-44-R1] Plus never appears in first run` | J | SB | none | Render list Welcome, age, consent, child, finish, Home with PLUS_ALPHA off: no price, trial, Plus name, button or sheet | Add the Plus line to the Welcome |
| NS-44-R2 | `[NS-44-R2] the first two letters are free` | I | SB | none | First and second Keep with words: no E-S10; each counts once | Count at draft creation |
| NS-44-R3 | `[NS-44-R3] the one gate, after the words` | I | SB | none | Third Keep with words, Plus off: E-S10 only after the words were on screen; record, type, read, play, Find, Read together, export stay open | Open the sheet before the words |
| NS-44-R4 | `[NS-44-R4] a save with no words never counts` | U | SB | none | Text with no letters or digits never counts and never meets the gate | Count an empty save |
| NS-44-R6 | `[NS-44-R6] the microphone at need, with a way around` | U | SB | none | Primer before iOS; a denial leads to Type with no dead end (cites NS-39-R10) | Prompt without the primer |
| NS-44-R7 | `[NS-44-R7] the first recording waits for its words` | I | SB | none | Recording with no model kept; words arrive when the model does | Discard the recording |
| NS-44-R8 | `[NS-44-R8] unknown Plus holds, never loses` | U | SB | none | Plus unknown at the third Keep: no sheet, the letter held, never discarded | Discard on unknown |
| NS-44-R9 | `[NS-44-R9] a held letter waits as it is` | I | SB | none | Keep it here for now: the letter waits as it is; a later Keep asks again | Clear the draft |
| NS-44-R10 | `[NS-44-R10] the allowance never drops below two` | U | SB | none | Remote 0 and 1 give 2; remote 5 gives 5 (effectiveFreeLetters) | Remove the Math.max |
| NS-44-R12 | `[NS-44-R12] the first letter is quiet` | U | SB | none | First Keep: success haptic once after commit; scan finds no confetti, badge, count or streak | Add a counter |
| NS-45-R1 | `[NS-45-R1] sign-out keeps the book and says so` | I | SB | fails | Sign-out leaves the book readable, playable, exportable; the sheet words carry D1 before the tap (auth.en.ts:296-297 lacks them) | Clear the database on sign-out |
| NS-45-R2 | `[NS-45-R2] sign-out never drops a letter` | I | SB | none | Three unsent letters, Sign out with sync able: session stays until sent; letters on the server after | Sign out at once |
| NS-45-R3 | `[NS-45-R3] a lost session never locks the book` | I | SB | none | Revoked refresh, Sign out other devices, epoch raise, Apple revoked: once after uploads, line once in Me, reading, recording, export never blocked | Block reading on session_expired |
| NS-45-R5 | `[NS-45-R5] deletion says what it does` | U | SB | fails | Step 1 content holds what leaves, what stays (letters, recordings, pictures), the seal line, 30 days, export first, Plus not cancelled (account-deletion.en.ts:15-16) | Drop the pictures line |
| NS-45-R6 | `[NS-45-R6] deletion is scheduled with a date` | I | CI | none | request_account_deletion: 30 days, one open request, five a day, screen shows the date | Allow a sixth request |
| NS-45-R7 | `[NS-45-R7] deletion without agreeing` | I | CI | none | Terms version outstanding: deletion request works | Require the agreement |
| NS-45-R8 | `[NS-45-R8] purge revokes Apple and removes server data` | I | CI | none | Purge worker: Apple revoke step, receipt apple revoked or no_token, server rows removed, consent rows pseudonymised | Skip the revoke |
| NS-45-R9 | `[NS-45-R9] a pending deletion can be cancelled anywhere` | I | SB | none | Pending deletion then sign-in on any phone: scheduled screen with Cancel deletion | Skip the screen after a kill |
| NS-45-R10 | `[NS-45-R10] cancel restores everything` | I | CI | none | Cancel within 30 days: letters and books return as they were | Purge on cancel |
| NS-45-R11 | `[NS-45-R11] a seal is deleted, never revealed` | I | CI | none | Sealed letter at deletion: server copy deleted; words never shown before the day (stub until NS-06 B) | Reveal the words in Recently deleted |
| NS-45-R12 | `[NS-45-R12] pictures follow the phone, not the account` | I | SB | none | Delete leaves pictures on the phone; Erase everything removes every copy and both derivatives | Delete pictures on account deletion |
| NS-45-R13 | `[NS-45-R13] a required update never blocks the book` | U | SB | fails | Build below minSupportedVersion or upgrade_required: Me line with store button, nothing on Home, record, read, save, export work (FS-33) | Block capture |
| NS-45-R15 | `[NS-45-R15] deletion offline is clear` | U | SB | none | Delete account offline: line says nothing changed; no RPC call made | Call the RPC offline |
| NS-45-R16 | `[NS-45-R16] servers-off has no account rows` | U | SB | none | Servers off: no Account, Sign out or Delete rows; Erase and export work | Show the rows |
| NS-45-R18 | `[NS-45-R18] leaving works with VoiceOver and at AX5` | D | DV | none | VoiceOver and AX5 on SE 3 through sign-out sheet, both deletion steps, scheduled screen, update line | Pin the actions off-screen |

## 16. Harness notes
- One shared stub kit `apps/mobile/test/helpers/first-run-stubs.ts` (PROPOSED): throwing fetch, Supabase client with recorded calls, Keychain and settings in memory, `expo-local-authentication` and `expo-apple-authentication` fakes (the real imports are a baseline failure in the sandbox: 8 files, 73 tests), a fixed clock, and Asha A and Asha B fixtures. Built once in FP-12, reused by FP-6 to FP-16.
- DB rows run under `npm run test:db`; PR #424's `compliance_gates.test.mjs` already covers the hook and the counts table (133 lines on its branch); NS-40-R10 and R11 need a staging project and are `needs:founder`.
- Tests that fail on develop today (write them first, red on the old code): NS-40-R5, R6, R9, R10, R12; NS-41-R6 (BL-961), R9, R10, R11, R20; NS-42-R7, R9, R13; NS-45-R1, R5, R13. Sixteen rows.
- Rows that no phone-free test can prove: NS-38-R8, NS-40-R13, NS-41-R18, R22, NS-42-R15, NS-43-R13, NS-45-R18, and the device halves of NS-39-R2 and R10 (D13: device evidence on the Asha-only install).
