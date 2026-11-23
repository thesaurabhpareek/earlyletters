Status: PROPOSED (nothing here is decided, built or in `DECISIONS.md`; the founder's two directions are quoted in section 1; spend, legal text and scope are not decided here)
Owner: `product`
Extends: `19-from-download-to-first-letter.md` (NS-40 age and region, NS-41 sign up and sign in, NS-45 deletion)
Load when: you add Google, link two sign-in methods, or add or require a phone number.

# NS-54: Sign-in methods and phone verification

Conventions: row id `NS-54-R<n>`; Priority P0 (a) a promise, (b) a legal or store duty, (c) the core loop; P1 should ship with the phase; P2 later. Test titles are `[NS-54-Rn] ...`. Claims marked [UNVERIFIED] were not read from a source in this run; each names who confirms. Family in every scenario is the fictional Asha.

## 0. Summary: the "even today" answer

The founder preferred a verified phone number for everyone, even today. What is honestly achievable today is the optional prompt (Phase A) as a design and a plan, not a required number in the submission build, and not any real text sent. Before a required number can ship, all of these must exist: an SMS provider chosen and a founder-approved spend cap (BL-1898); counsel's reading of consent, carrier registration and TCPA with CR-062 re-run (BL-1897); a registered sender; the provider spike (BL-1896); the data classification, data map and subprocessor rows (BL-1899); privacy label and policy text counsel has seen (BL-1900); the phone-number log canary (BL-1901); the design (BL-1895); an erratum reversing "never a phone number" in NS-41 (BL-1888); a fallback for people with no phone (7.4); and the measure in 7.9. The Google and phasing positions below are recommendations; the founder decides scope and dates.

## 1. Problem, and why now

The founder's directions (verbatim, lightly cleaned from voice, relayed by Karma): (1) "Easiest for us is also to allow Sign in with Apple and sign in with Google. Add for future backlog if we didn't currently. And remember to pick it up in future." (2) "In general we would prefer a verified phone number for everyone in future and even today."

Today a parent has Sign in with Apple and email (link plus code). Google is built but off (`lib/auth/google.ts`, `supabase/config.toml` `[auth.external.google] enabled = false`) and the locked store card says no Google button (NS-41-R1, NS-41-R20). Two people who use two methods become two accounts with two empty books (see 2.3). Nothing verifies a person beyond an inbox, the locked card says "never SMS or a phone number" (NS-41 section 14), and LEGAL-REQ-012 lists "phone number" as never collected.

What the numbers below must not undercount: under D-160 a person signs in to use the store build, so the account already exists before the first letter (NS-41 section 2 calls the letter-first order stale). The path to the first letter already carries the age question, the sign-in, consent and the child step. A phone step is a fifth ask on that path; its cost in activation is real, which is why it never sits in front of the first letter.

Why now: D-170 (draft, PR #1675) puts servers and account creation on, so every duplicate account, throwaway address and unverified sign-up now costs a real family or real money. The two directions pull different ways: Google makes sign-up easier; a phone makes it harder. This card sets the order so the first never waits on the second.

## 2. What exists today (read from develop; row ids in section 9)

| Thing | State | Evidence |
|---|---|---|
| Sign in with Apple, native, hashed nonce, email-only scope | Built and tested. Hosted provider and credentials: founder steps (BL-053, FT-07) [UNVERIFIED whether done]. | `lib/auth/apple.ts`; BL-171 done in part; BL-896 done (PR #1125) |
| Apple token capture for revocation at deletion | Built, deploy needs secrets and a migration | BL-330 partly done; NS-41-R13 |
| Google, native ID token through `signInWithIdToken`, button only when both client ids are in the build | Built; provider off in config; no store profile sets the ids | `lib/auth/google.ts:38-40`; BL-302 done in v1.0 per D-054 |
| Email link plus code | Built | BL-051; NS-41-R2 to R12 |
| Passkeys | Built behind `EXPO_PUBLIC_PASSKEYS`; no profile sets it | `lib/auth/passkey.ts`; FUTURE T5-11 |
| Account linking | Not built. `enable_manual_linking = false`. | `config.toml:48`; A-REQ-019 (P1); FUTURE T5-10 |
| Phone number or SMS | Nothing. `phone_changed` notice template exists, unused. Counsel register: TCPA "No (no SMS in v1)", "re-run before adding SMS OTP". Privacy label: Phone Number "Not requested". | `config.toml:129`; `compliance-register.md` CR-062; `app-store-privacy-labels.md:47` |
| Country check at sign-up | Hook built; applies to every method | NS-40-R9 to R12; D-131, D-136 |

Conflicts found, not resolved here (row BL-1888). D-044 ("Google sign-in moves to v1.1") was superseded by D-054, which the founder decided: "Sign-in: Apple, Google and email magic link". The founder-decided D-054 therefore stands against two documents that still follow D-044: the locked card (NS-41-R1: the Welcome offers "exactly Sign in with Apple ... and Sign in with email"; NS-41-R20: "no Google button and no passkey control renders") and `docs/engineering/05-identity-and-access.md` IAM-R05 ("Google sign-in is v1.1"; IAM-R06 is the password rule and is not in conflict). The erratum targets NS-41-R1, NS-41-R20 and IAM-R05. NS-41 section 14 says "Never a password, a reset flow, SMS or a phone number", and `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-012 lists "phone number" under "Never collected"; Phases A to C would reverse both, so each needs its own change (BL-1888 for the card, BL-1909 for the legal text, which counsel sees).

### 2.3 Why linking matters: the duplicate account

Asha's parent signs up with Apple using Hide My Email, so the account's address is a relay address. A month later the same parent taps Google, whose address is the real one. Supabase links identities only when the verified email matches [UNVERIFIED: Supabase auto-link rule, security engineer to read the version we run], and a relay address never matches. The parent now has an empty second book and thinks the first was lost. Linking has to be a deliberate act by a signed-in person, never a guess by us (NS-41 section 14 already forbids merging beyond the same-verified-email link).

## 3. Scope and non-goals

Scope: (A) Sign in with Apple: what is missing. (B) Sign in with Google in the store build. (C) Linking methods and preventing duplicates. (D) A verified phone number as a factor on an account, with phasing.

Non-goals: a password; phone number as a way in (SMS login) or as the only recovery (it is a factor, 7.6); anonymous sign-in; merging two existing accounts' books (a support-led act, never automatic); Android (Google on Android waits for the Android build); SMS for anything but the code (no invites, no marketing, CR-062 stays closed for those); name matching or screening (D-137); passkeys by default (FUTURE T5-11).

## 4. Priority decision (product, for the founder's scope and date calls)

Method: WSJF as a judgement, not a measurement. Cost of delay is user value plus time criticality plus risk reduction, each 1 to 5; size 1 to 5 (1 is a day or two, 5 is weeks with vendors).

| Item | Value | Time | Risk cut | Size | Score | Priority |
|---|---|---|---|---|---|---|
| Apple: tests and hosted read-back | 5 | 5 | 4 | 1 | 14 | **P0** (it is the launch door; code exists) |
| Linking and duplicate prevention | 4 | 3 | 5 | 3 | 4 | **P1, and a P0 gate for Google** |
| Google in the store build | 4 | 2 | 1 | 2 | 3.5 | **P1** |
| Phone, Phase A (optional, after the first letter) | 2 | 2 | 3 | 4 | 1.8 | **P1, design and long-lead rows start now; build after the submission candidate** |
| Phone, Phase B (required for new accounts) | 2 | 2 | 4 | 4 | 2 | **P1 after Phase A is measured** |
| Phone, Phase C (required for everyone) | 1 | 1 | 2 | 5 | 0.8 | **P3; not planned** |

Reasoning.
1. Apple is not new work. Only its tests, hosted read-back and revocation proof are missing, so it is P0 and cheap.
2. Google is small to build (the code exists) but its dependencies are long: a Cloud project, consent screen and possible brand verification [UNVERIFIED, from AUTH_SETUP 3.1 "Assumption"], one iOS client per bundle id, a device test and the locked card change. Google must not ship without linking, or it creates the duplicates in 2.3. It does not block submission: Apple plus email already meet the sign-in duty. Recommendation: not in the submission build; first slice after it. Moving it earlier is the founder's scope and date call.
3. Apple Guideline 4.8: offering Google requires offering an equivalent privacy-preserving option, which Apple is. Do not rely on this: check the regulatory lead's sign-up spec `docs/regulatory/signup-geo-checks.md`, which is in PR #1677 (branch `docs/signup-geo-and-social-login`), not yet on develop. [UNVERIFIED: not read for this card.]
4. Phone "even today": launch is the wrong place for it. It needs a provider, a registered sender, counsel's reading of consent and TCPA, a label change, a policy change and a locked-card erratum, and it adds a step to the activation path the product is built to protect (the first letter). Each of those is long-lead and none exists. Putting it in the submission build delays submission or ships it half-guarded. So the long-lead rows start now, in parallel, and the build waits for them.

Launch dependency: D-170 turns servers and account creation on. Phone Phase A is a server feature and follows D-170; it is not needed for the first submission.

## 5. Requirements: sign-in methods

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-54-R1 | Given a store build with servers on, When the Welcome shows, Then Sign in with Apple is offered first at Apple's button size and Google, if offered (R6), is no larger than it | P0 (b) | `[NS-54-R1] Apple is first and never smaller` |
| NS-54-R2 | Given Sign in with Apple, When the request is built, Then it asks for email only and the nonce is hashed for Apple and raw for Supabase (exists: BL-896, `apple.ts`) | P0 (b) | `[NS-54-R2] Apple asks for email only` |
| NS-54-R3 | Given an Apple sign-in, When it finishes, Then the authorization code goes once to `apple-token`, is never stored or logged, and a missed capture shows as `apple: no_token` on the deletion receipt (exists: NS-41-R13) | P0 (b) | `[NS-54-R3] Apple token captured for revocation` |
| NS-54-R4 | Given a Hide My Email Apple account, When mail is sent to it, Then it arrives (relay domain registered) and the app shows the method, not the relay address (exists as NS-41-R18) | P0 (c) | `[NS-54-R4] relay mail arrives` (device) |
| NS-54-R5 | Given an account deleted that used Apple, When the purge runs, Then the Apple token is revoked and the receipt says so | P0 (b) | `[NS-54-R5] deletion revokes Apple` |
| NS-54-R6 | Given the founder has turned Google on for a profile, When both client ids are in that build and the hosted provider is enabled, Then a Google button shows beside Apple and email; Given either is missing, Then no Google control renders and `auth.noEmailHelp` names only what shows | P0 (b) | `[NS-54-R6] Google shows only when it works` |
| NS-54-R7 | Given Google, When sign-in finishes, Then the ID token audience is our client id, Supabase keeps what it keeps (read from the version we run and written down, BL-1892), and we store no Google access or refresh token and no profile picture anywhere off the phone, and read email and name only as Supabase returns them | P0 (b) | `[NS-54-R7] no Google token stored by us` |
| NS-54-R8 | Given a Google sign-up from a refused country, When the hook runs, Then it is refused as NS-40-R10 says, and the screen is the neutral refusal, not an error | P0 (b) | `[NS-54-R8] Google meets the country check` (staging) |
| NS-54-R9 | Given an account that used Google, When it is deleted, Then no Google data of ours remains, the deletion receipt names `google: none held`, and what Google itself requires at deletion is read and written down before Google ships | P0 (b) | `[NS-54-R9] deletion holds no Google data` |
| NS-54-R10 | Given sign-in versus creation, When a person taps Apple or Google, Then the same door serves both, the words never say "sign up" or "log in" (NS-41-R1), and consent and the age step follow only for a new account | P0 (c) | `[NS-54-R10] one door for new and returning` |
| NS-54-R11 | Given a method fails or is cancelled, Then `cancelled` shows nothing and every other kind shows its words line with no provider text (exists: NS-41-R7) | P0 (c) | `[NS-54-R11] provider errors have words` |
| NS-54-R12 | Given a Google or Apple outage, Then email still works and the reverse; a method is never the only way in | P1 | `[NS-54-R12] no single method is a dead end` |
| NS-54-R13 | Given VoiceOver and AX5 on iPhone SE 3, Then each provider button reads as a button with its provider, and nothing truncates | P0 (b) | `[NS-54-R13] provider buttons are accessible` |
| NS-54-R38 | Given Google is a social network credential for Apple's account-sign-in rule, Then the app has an in-app way to revoke it (Ways to sign in, remove Google, R14 and R17) that ends our use of it, and no Google credential or token is stored off the device; Apple's text (guideline 5.1.1(v), read on the Apple page for this card) says an app "must also include a mechanism to revoke social network credentials and disable data access between the app and social network from within the app" and "may not store credentials or tokens to social networks off of the device". Counsel and the regulatory lead confirm how it applies to Sign in with Google, which is not a social-network feed | P0 (b) | `[NS-54-R38] Google can be revoked in the app and no token is kept off the phone` |

## 6. Requirements: linking and duplicate prevention

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-54-R14 | Given a signed-in person in Me, Ways to sign in, When they add Apple, Google or email, Then the method is linked to this account only after the provider proves it, and the screen shows the method, never the full address | P1 | `[NS-54-R14] a person adds a method to their own account` |
| NS-54-R15 | Given a new sign-in whose verified email equals an existing account's, Then it signs in to that one account (never a second); [UNVERIFIED] this relies on Supabase's same-verified-email rule, which the security engineer confirms on the version we run, with a test that fails if it changes | P0 (b) | `[NS-54-R15] same verified email, one account` (staging) |
| NS-54-R16 | Given a sign-in whose email differs (Apple relay against Google), Then a second account is created only after the person is shown, before consent, a plain line that they may already have an account and a way to sign in the other way (words PROPOSED by `content`); nothing is merged | P0 (a)(b) | `[NS-54-R16] a likely duplicate is named, not merged` |
| NS-54-R17 | Given two methods on one account, When one is removed, Then it is refused if it is the last; removal needs a recent sign-in (reauth) and sends a notice by email | P1 | `[NS-54-R17] the last method cannot be removed` |
| NS-54-R18 | Given a method already linked to another account, When a person tries to add it, Then it is refused with words and nothing moves | P0 (b) | `[NS-54-R18] a method belongs to one account` |
| NS-54-R19 | Given linking on, Then `enable_manual_linking` is set in config and hosted in the same change that ships the screen, with the auth-config test updated; before then it stays off | P0 (b) | `[NS-54-R19] manual linking follows the screen` |
| NS-54-R20 | Given a link or unlink, Then Supabase's identity notices go to the account's address and nothing about the provider's id appears in a log or event | P1 | `[NS-54-R20] linking leaves no id in logs` |
| NS-54-R21 | Given account A signed out and B signed in on one phone, Then linking and duplicate hints never mention A (exists: NS-41-R6) | P0 (a)(b) | `[NS-54-R21] a second account sees nothing of the first` |

## 7. Requirements: phone verification (the founder's stated preference)

The founder wants a verified phone number "for everyone, even today". This section writes that as requirements with the decision points open. Nothing here chooses a vendor, a price or a date.

### 7.1 What it is, and what each phase means

A verified phone number is a one-time code sent by text to a number the person types, proving they hold that number. It is a second fact on the account, not a way in. Phases (recommendation in 7.8):
- Phase A: today. An optional, skippable prompt after the first letter is kept, and always in Me.
- Phase B: required for new accounts, at a named point (7.5), with the fallbacks in 7.4.
- Phase C: required for existing accounts too, with a grace period.

### 7.2 Shown, Records, Never, Decline (PRIV-R21; words are `content`'s, held for counsel)

- Shown: before the number is typed, a line says what it is for, that we text one code, that standard message rates may apply [UNVERIFIED wording, counsel], that we keep the number only to prove the account and for recovery, and where to read more. The line is a content key; its hash is recorded.
- Records: a PRIV-R21 act row (document, version, action, method, surface, times, app version, build, OS major, platform, language, hash of the words shown). It holds no number.
- Never: the number is never in a log, crash report or analytics event, never used for marketing, invites or ads, never matched against contacts, never shown in full after entry (last two digits only), never shared with another parent, never a condition of reading the book already on the phone.
- Decline: Not now always works in Phase A and keeps every feature; the choice is remembered on the phone only and asked again at most once, at a calm moment, never as a count of what is missing.

### 7.3 Requirements

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-54-R22 | Given Phase A, When the first letter is kept, Then one optional prompt may show after Keep and never before the first letter, Not now is as large as Continue, and nothing else is withheld | P1 | `[NS-54-R22] phone is asked after the first letter, never before` |
| NS-54-R23 | Given a number typed, When Send is tapped, Then one text with a code is sent, the number is normalised to E.164 on the phone, and the screen is the same for a number that has an account and one that has not | P1 | `[NS-54-R23] sending a code reveals nothing about the number` |
| NS-54-R24 | Given the code, Then it is single use, expires in no more than ten minutes, has a per-number and per-IP send limit with a daily cap for the whole project, and five wrong tries pause entry (as NS-41-R9) | P0 (b) | `[NS-54-R24] code limits and pause` |
| NS-54-R25 | Given a verified number, Then the account row holds the number and a verified time and nothing else of the carrier or the code; the number is deleted with the account and within the deletion window, and the SMS vendor holds no content beyond what its contract says (DATA-REQ rows added by BL-1899; access, export and removal are R39 to R41) | P0 (b) | `[NS-54-R25] number deleted with the account` |
| NS-54-R39 | Given a verified number, When the person opens Me, Account, Then they can see that a number is verified and its last two digits, and when it was verified (access); the full number is never shown | P1 | `[NS-54-R39] a person can see that a number is held` |
| NS-54-R40 | Given the account export, Then it lists the verified number and its verified time in the account part of the package, and the spec's export section says so (BL-1909) | P0 (b) | `[NS-54-R40] the export includes the phone number` |
| NS-54-R41 | Given a verified number, When the person removes it in Me, Then it is deleted from the account and from the vendor's side as the contract allows, a notice email goes out, and they can verify a new one; removal never ends the session | P1 | `[NS-54-R41] a person can remove and re-verify the number` |
| NS-54-R26 | Given any log, breadcrumb, route param, crash report or analytics event, Then it holds no phone number, partial number or code (log canary, extending NS-41-R16) | P0 (b) | `[NS-54-R26] the phone number never reaches a log` |
| NS-54-R27 | Given the provider fails, there is no signal, or the code never arrives, Then the screen says so in words, offers resend after a wait, another way (7.4) and Not now (Phase A), and an unfinished check never blocks the book on the phone | P0 (c) | `[NS-54-R27] a failed text never blocks the book` |
| NS-54-R28 | Given a number from a country the SMS provider cannot reach, or a premium or virtual number the provider flags, Then the person is told this number cannot be used and offered the fallback; the reason shown is never "fraud" | P1 | `[NS-54-R28] unreachable or flagged numbers have a way on` |
| NS-54-R29 | Given the country code of a verified number, Then it is at most a signal stored as a country code only; it never refuses a person alone (shared codes, travel, roaming, porting, VPN make it weak); the D-131 hook at account creation stays the control. [UNVERIFIED] The regulatory lead decides any use of it in `docs/regulatory/signup-geo-checks.md` (in PR #1677). | P1 | `[NS-54-R29] a calling code never refuses alone` |
| NS-54-R30 | Given a person abroad on a roaming or local SIM, Then a number from any supported country verifies; Given no text arrives, Then the fallback in 7.4 is offered | P1 | `[NS-54-R30] a phone abroad can verify` |
| NS-54-R31 | Given a person who changes or loses their number, Then they sign in with another method (Apple, Google, email), remove the old number there, and verify a new one; the number is never the only way back in | P0 (c) | `[NS-54-R31] a lost number never locks out the book` |
| NS-54-R32 | Given a person who signed in with Apple or Google, Then phone verification is asked on the same rules (7.5), because a social login proves an inbox or an Apple ID, not a person | P1 | `[NS-54-R32] social sign-in is not exempt` |
| NS-54-R33 | Given a co-parent invite, Then the sender's phone check is the same as for anyone, and the person accepting an invite is never required to give a number to read what was shared (decision point 7.5) | P1 | `[NS-54-R33] an invite never needs the invitee's number` |
| NS-54-R34 | Given VoiceOver, AX5 on SE 3 and one-time-code AutoFill, Then the number field, the code field (one field with its length) and every error work, and nothing truncates | P0 (b) | `[NS-54-R34] phone screens are accessible` |
| NS-54-R35 | Given the privacy label, policy, data classification and subprocessor list, Then each names the phone number, its purpose and the SMS vendor before the first build that collects it; counsel sees the text before it is published | P0 (b) | `[NS-54-R35] the label and policy match what we collect` |
| NS-54-R36 | Given the measure in 7.9, Then the share of people who start and finish the phone step, and the share who reach a first letter, are counted with no number and no id in the event | P1 | `[NS-54-R36] the phone step is measured without the number` |
| NS-54-R37 | Given a build with phone verification, Then a remote pause hides the step and never signs anyone out or removes a verified number | P1 | `[NS-54-R37] the phone step can be paused safely` |

### 7.4 Fallback for people without a phone, or abroad (accessibility and inclusion)

Open (not decided): D-160 makes sign-in required in the store build, so every person in Phase B already has an account and a book before the phone step, and D-161 rules out a "coming soon" surface: a cloud feature that waits on a number is hidden or absent, never shown disabled with a teaser, and the phone step appears only where a cloud feature works. In Phase B a person with no mobile number (a Wi-Fi-only device, a shared family phone, a landline, no coverage, a hearing or speech difference that makes a phone fraught) must still be able to keep a book. Options for the founder with counsel: a voice-call code [UNVERIFIED: provider support]; a support-led check by email; allow "Not now" for a longer grace; or treat Phase B as a limit on cloud features only (sync, backup, co-parent) while the book on the phone stays free. Recommendation: the last one, because it never takes away what is already the person's; it is also the default if the gate in Q8 does not clear.

### 7.5 Open questions made explicit (each has an owner; none is decided here)

| # | Question | Recommendation | Owner |
|---|---|---|---|
| Q1 | Which SMS provider, and the per-message cost and cap | Compare two or three in the spike (BL-1896); choose by delivery in our countries, fraud tools and a hard spend cap; the founder decides spend | founder, platform |
| Q2 | US SMS rules: consent text, carrier sender registration, TCPA, state laws, opt-out and help words [UNVERIFIED, none read] | Counsel reads and answers before any real send (BL-1897); CR-062 is re-run | counsel via legal |
| Q3 | Where is "required" in Phase B | The account exists from the door (D-160), so "required" cannot mean before the account: it means before the first cloud feature the account would turn on (sync, backup, co-parent invite), shown only where that feature works (D-161); never before the first letter. The NS-41-R5 claim step applies only to the outage local start | product with founder |
| Q4 | After Apple or Google, is a number asked right away | Same rule as email: after the first letter, not at the door (NS-54-R32) | product |
| Q5 | Before inviting a co-parent | Yes, for the sender only (NS-54-R33) | product, security |
| Q6 | Fallback in 7.4 | Cloud features only | founder with counsel |
| Q7 | Phone as a sign-in door too | No, factor only (non-goal) | founder to confirm |
| Q8 | HARD GATE for Phase B. Apple guideline 5.1.1(v), read on the Apple page for this card: "Apps may not require users to enter personal information to function, except when directly relevant to the core functionality of the app or required by law." A required phone number is personal information; whether it is "directly relevant to the core functionality" of a baby memory book is not for product to decide | Phase B does not ship until the regulatory lead and counsel say it may; until then the default is "cloud features only" with the book on the phone never gated (7.4) | regulatory lead, compliance, counsel |

### 7.6 Why: abuse and fraud against friction

For: one inbox is cheap to make, so a verified number raises the cost of throwaway and abusive accounts and lets support confirm a real person; it can support recovery. Against: every extra step before the first letter loses people (the product's activation moment is the first letter); a number is personal data and is a new label, policy and vendor; SMS has its own abuse (a bot can trigger texts to paid numbers and run up cost) [UNVERIFIED general risk; the spike confirms the provider's controls]; a SIM-swap makes a number a weaker proof than people expect [UNVERIFIED]; and it shuts out people with no mobile number. So it is a factor with fallbacks, not a wall.

### 7.7 Phasing options

| Phase | What | Cost | Risk |
|---|---|---|---|
| A | Optional prompt after the first letter; always in Me | Lowest friction; produces the data we need to choose | Few verify, so abuse gain is small |
| B | Required for new accounts for cloud features, with fallbacks | Some activation loss if placed early | Hard gate Q8 (5.1.1(v)), 7.4 fallback, label, counsel |
| C | Required for existing accounts after a grace period | Touches people who were promised no number | Highest friction; trust cost |

### 7.8 Recommendation

Phase A first, built after the submission candidate, with the long-lead rows (spike, counsel, vendor, data rows, label and policy text, design) started now so that Phase B can follow the first release after A without waiting. Phase B for new accounts after Phase A has run with measurement (7.9). Phase C only if B shows abuse that B did not stop, and only after a new founder decision; the answer to "even today" is that today the honest option is the optional prompt, because every gate the required version needs is not yet in place.

### 7.9 The measure that would change the mind

Design. The prompt is shown to a share of new accounts chosen by install, and the rest see none (a control), so a change in first-letter rate is not confused with a change in the people arriving that week. Compare within the same sign-in method (Apple, Google, email) and the same arrival week.

Minimum sample. No comparison is read until each group holds at least 20 people who reached the prompt point; below that the counts are shown as counts, never percentages, and no decision is made from them.

Counts per release: people who start the prompt, who finish it, who choose Not now; first-letter rate in each group; abuse (below) per 100 new accounts, split by verified or not.

Abuse means: an account we closed or blocked for abusive use, or one reported through Contact us or Report a concern as abusive, counted by hand from the reason code and never from letter content. Nothing else counts.

Pause trigger (named, acts through R37): pause the step if first-letter rate in the prompted group is below the control by more than a margin the founder sets (at 20 or more people in each group), or if SMS spend reaches 80 percent of the cap in any period, or if a phone number is ever found in a log. Pausing never signs anyone out or removes a number.

Move to B only if abuse among unverified accounts is clearly higher than among verified ones at the minimum sample, the gate in Q8 has cleared, and the prompted group's first-letter rate is not meaningfully lower; stay at A, or drop it, if completion is very low. The margin and the thresholds are set by the founder when the first counts exist; none is set here.

## 8. Scenarios (Asha, in plain language)

| # | Scenario | Expected | Proves |
|---|---|---|---|
| S1 | Asha's parent opens the app new, taps Sign in with Apple, uses Face ID | Sets up the account, consent, then the first letter; no phone asked | R1, R10, R22 |
| S2 | Asha's parent chooses Hide My Email, deletes the account a year later | Mail arrived via relay; Apple token revoked; receipt says so | R4, R5 |
| S3 | A new parent taps Sign in with Google (Google is on in this build) | Same door, same consent; we keep no Google token | R6, R7, R10 |
| S4 | Google is on, but this build has no client ids | No Google button; help line names only email and Apple | R6 |
| S5 | Asha's parent signed up with Google, later adds Apple in Me, Ways to sign in | Apple joins the same account; a notice email goes out; both work | R14, R20 |
| S6 | Same parent signs up with Apple (relay) and, on another phone, Google (real address) | Before consent a line says they may already have an account; they can go back and sign in the first way; nothing merges | R16 |
| S7 | Same verified email on Apple and Google | One account, one book | R15 |
| S8 | The parent tries to remove their last method | Refused with words | R17 |
| S9 | The parent adds a phone number after the first letter and types the code | Verified; only the last two digits show; no number in logs | R22, R23, R26 |
| S10 | The text never arrives (no signal, provider down) | Words, resend after a wait, another way, Not now; the book is untouched | R27 |
| S11 | Asha's parent is travelling and has a foreign SIM | A number from a supported country verifies; if not, the fallback shows | R30, R28 |
| S12 | A new account is made from an embargoed IP | Refused at account creation by the neutral screen on every method: for email after the code is entered (never at Send, NS-40-R9), for Apple and Google as soon as the provider's sheet returns, with no code step; the number's country code never refuses alone | R8, R29 |
| S13 | The parent loses their phone and number | Signs in on a new phone with Apple, Google or email, removes the old number, verifies a new one; the book comes back | R31 |
| S14 | The parent deletes the account | Number and Apple or Google links removed with the account; receipt lists each | R5, R9, R25 |
| S15 | Asha's parent invites a co-parent | Sender's check applies; the co-parent is not asked for a number to read what is shared | R33 |
| S16 | A bot asks for many texts to many numbers | Per-number, per-IP and project limits stop it; spend cap holds | R24 |
| S17 | Asha's parent asks what number we hold, then removes it | Sees last two digits and the verified time; export lists it; removal works and a new number can be verified | R39, R40, R41 |

## 9. Backlog rows

BL-1888 to BL-1910 (section "Sign-in methods and phone verification (NS-54)" at the end of `docs/BACKLOG.md`).

## 10. Decision proposals for the founder (drafted, not entered in `DECISIONS.md`)

1. Google sign-in in the store build: after the submission candidate, with linking (recommended); or in it (founder's scope call, extends the work before submission).
2. Phone verification: Phase A now-ish in build order, B after measurement, C not planned; the founder spends on the SMS vendor and records the choice.
3. Reverse "never a phone number" in NS-41 section 14 by erratum once counsel has read (BL-1888 drafts it).

## 11. Never

No password. No phone number in a log, crash report or analytics event. No automatic merging of accounts. No requirement to give a number to read a book already on the phone. No SMS but the code. No Apple or Google token of ours beyond what Supabase Auth keeps and the Apple token kept for revocation. No claim in store text, policy or the label that is not true of the build.
