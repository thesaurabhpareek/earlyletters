# NX-31: The first run of a new customer: sign in first, then the book, then the first kept letter

Readiness: 17 of 28, author's score, `qa` to confirm. Remains: five founder answers (section 15); one `mobile` read of `apps/mobile/src/app/onboarding.tsx`, the local `children` table and `create_first_run_children` for the claims marked UNVERIFIED; counsel on the strings and the consent design flagged "registered"; a hosted project with Apple and Resend working (NX-02, S-52 failed on 8 Nov).

Status: revision 2, 9 Nov 2026 (UTC). Docs only. Revision 1 put the account after the second kept letter. On Mon 9 Nov the founder decided in chat: **account creation happens before the book opens**, and new customers' recordings back up free. He had also tested "Build 12 that we also push to public". This revision rewrites the journey around that decision and adds the risks it creates. Account management after sign-up is NX-32; landing and navigation is NX-30 (both by other agents; cited, not edited). No BL, D or CR id is assigned and nothing is reserved. The two founder statements above are not yet in `DECISIONS.md` and must be written there (section 15, answer 5).

| | |
|---|---|
| Working label | NX-31 (working id, see `_CONVENTIONS.md`) |
| Refines | F03 (first run), F02 (account), F01 (entry), F13 (reminder card, DR-12 B), F17 (app lock), F08 (recording backup); F03-REQ and F02-REQ ids are cited in the trace table, not changed |
| Builds on, does not re-specify | NX-02 (sign-in methods, session security), NX-03 (Before you begin; PR #635 and its split plan on branch `docs/635-split-plan-8nov`), NX-05 (reviewer sign-in, Apple 2.1(a)), NX-04 and NX-08 (deletion, consent withdrawal), NX-10 (reminders), NX-16 (support route), NX-17 (internal alerts) |
| Tag | EVIDENCE for what the repo contains and what Apple's pages say (section 4 and 6). HYPOTHESIS for every timing target and every claim that a step changes behaviour. Targets are labelled "proposed" |
| Size | M to L in agent PRs, S each for most rows. The sign-in-first gate (R17) and the outage path (R18) are the two rows that touch the app's root |
| Gate | Founder (section 15). Counsel (registered strings; consent design Q48 and DX-15). Apple: 4.8, 5.1.1(iii), (v), (ix), 2.1(a) |
| Order | Not ranked. It sits on the Build 12 lane: Build 12 is servers-on, passwordless, public. A stranger cannot start a book without a working sign-in, so NX-02 and theme 1 are hard prerequisites |

## 1. What the new customer sees and does, in plain words

They find the app in the store and open it. One short question: are you 18 or older, with the agreement under it (NX-03). Then one screen says what this is in one line and asks them to sign in: Continue with Apple, or an email and a short code. The same two buttons serve a new parent and a parent who already has a book; nobody has to say which they are.

If they are new, they type their child's first name if they want to, pick a birthday or due date, tap what the child calls them, and the book is open. They tap, talk, read the words back, and keep the first letter. The app says it is kept, says the recording is kept safe, and offers one thing: an evening reminder, yes or no.

If they already have a book, it is there as soon as they sign in. They are never asked to make the child again.

They have been asked for an age answer, an agreement, a sign-in, and optionally a name. They have not been asked for a password, a phone number, a contact, a photo or a surname. Nothing has been counted at them.

## 2. The journey, screen by screen

"Ask" means anything the person is asked to agree to, allow or give. Screens marked "exists" are on `develop` today; "NX-03" are specified there; "new" are specified here.

| # | Screen | Purpose | The one action | Ask on it | Source |
|---|---|---|---|---|---|
| 1 | Before you begin | Adults only; plain agreement | Answer Yes, tick the box, Continue | Age (yes or no only); the Terms and Privacy agreement | NX-03 (exists in part; #635 open) |
| 2 | Welcome and sign in (one screen) | Say what this is in one line; get the person into their account, new or returning | Continue with Apple, or Sign in with email | Sign-in method. The agree line is directly above the buttons. "I was invited" stays as a text link (F11, not re-specified) | exists as two separate surfaces (`onboarding.welcome.*` and `authCopy.sheet.*`); joined by R17 |
| 2a | Check your email | Type the short code, or tap the link on this phone | Type the code, Continue | none | exists: `authCopy.code.*` |
| 2b | Before your book syncs | Sensitive-data consent, the same moment's second screen | Agree and continue, or Not now (the book still opens and sync stays off) | Sensitive-data consent | exists: `authCopy.consent.terms.*`; F02-REQ-010; counsel decides if it can sit on screen 2 (DX-15) |
| 3 | Who is this book for? | Make the book (skipped when the account already has one) | Pick a birthday or a due date, Continue; the name may stay empty (R3) | Child's first name or nickname (optional), birthday or due date | exists; changed by R3 |
| 4 | What does {child} call you? | Sign the letters | Tap a chip, Continue | A signature | exists: `onboarding.signsAs.*` |
| 5 | Get your words ready | Offer the speech download without blocking | Not now, or Download on Wi-Fi | A download choice | exists: `speechConsentCopy.*`; F05 |
| 6 | The book is open. | Land; say the recordings are kept safe (R21) | Write the first one | none (R14 removes the lock card from here, if founder answer 4 is yes) | exists: `onboarding.finish.*`; footnote changed by R21 |
| 7 | Tonight with the first prompt, then Speak | Record | Tap Speak | Microphone, in context at the first Speak tap | exists; F04 |
| 8 | Review | Check the words | Keep | none | exists |
| 9 | The first-letter moment, then the reminder card | Say it is kept; offer the one habit | Yes, evenings / Pick a time / No reminders | Notifications, only after Yes (R6) | exists: F09, F13 DR-12 B, `onboarding.reminder.*` |

Nine screens plus the code and consent screens for a new email customer. The "Keep the book on any phone" card of revision 1 no longer exists in first run; its job is done by screen 2. What a signed-in parent manages afterwards is NX-32.

### Where each ask lives (the ask sequencer, `apps/mobile/src/lib/analytics/ask-sequencer.logic.ts`, is the only code allowed to put an ask on screen after screen 9)

| Ask | Where | Earliest | Why there |
|---|---|---|---|
| Age and agreement | Screen 1 | First launch | Law and store rules (NX-03); nothing is stored if the answer is No |
| Sign-in method | Screen 2 | After screen 1 | Founder decision, 9 Nov: account before the book opens. Free recording backup is the reason a parent can be told in one sentence (R21) |
| Sensitive-data consent | Screen 2b | Right after a new sign-in | F02-REQ-010: the server refuses content before it |
| Child's name (optional), date | Screen 3 | After sign-in | Prompts and chapters need a date; the name only decorates (R3) |
| Signature | Screen 4 | After screen 3 | Every letter says who wrote it |
| Speech download | Screen 5 | After screen 4 | A choice; never blocks onboarding (Apple HIG, section 4) |
| Microphone | First Speak tap | Screen 7 | Asked when needed (HIG; 5.1.1(iv)) |
| Reminder card, then the notification permission | After the first kept letter | Screen 9 | The person has just felt the product work (F13 R1-S57 is a vendor case study, section 4) |
| Face ID or passcode lock | A card in the third session, and Settings > Privacy | Session 3 | Needs a book worth locking (R14; founder answer 4) |
| Analytics and crash reports | The third ask, only when switched on | After the reminder answer | Off in every 1.0 profile (D-124 item 3); opt-in |
| Sharing and invites | Family tab; hidden in the store build (D-126) | Not in first run | A second person needs a first letter to read |
| Rating ask | Not in this file | Never in first run | NX-24 owns the timing |

### What we still postpone until after the first letter

The notification permission, the lock, analytics consent, sharing, the Plus sheet (C-REQ-023, F03 Never), goals (cut by F03 section 6.4), a tour, and any language beyond English while English only is on (PR #689, read by title only: UNVERIFIED).

## 3. Why this order, said honestly

1. **It is the founder's decision.** Sign-in sits before the child step and the first letter. This file does not argue with it; it says what it costs (section 6) and how to keep that cost small.
2. **One account path for two kinds of person.** Folding "I already have a book" into the same two buttons removes a choice the person cannot answer reliably (they often do not remember whether they signed up), and the result is decided by the account: a book found means no child step.
3. **The reason a sentence can carry.** With free recording backup, "sign in and your recordings are kept safe and come with you to a new phone" is a true, short reason. That is also the answer Apple's HIG asks for ("explain the benefits of creating an account", section 4). It is only true while backup is switched on in the build (R21).
4. **What this order gives up.** Revision 1's argument still holds on the other side: Apple's guidance is to delay sign-in; a person abandons before they have felt anything work; and the first-run time target worsens (R15). The cohort comparison of sign-in-first against sign-in-after-value is a study the founder may want (HYPOTHESIS, owner `user-research`).
5. **Where sign-in does not reach.** A phone that already holds a book never loses reading, recording or export because a session ended (R22; founder answer 2 confirms this narrow reading).

## 4. Benchmark, with how each source was checked

Checked means opened on 9 Nov 2026 by this author (through a page-fetch tool that summarises; wording below is paraphrase unless in quotation marks). Copied means taken from a repo file that cites it, not re-opened. UNVERIFIED means no source was opened.

| Source | What it says | Status | Our call |
|---|---|---|---|
| Apple, App Store Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ , 5.1.1(v) | An app without significant account-based features should be usable without a login; apps that create accounts must offer in-app deletion; personal information may be required only where directly relevant to core functionality or required by law | Checked 9 Nov | The tension for this decision, see section 6 |
| Same page, 5.1.1(iii) and (iv) | Collect only what the task needs; do not trick or force consent to unnecessary data access | Checked 9 Nov | Name optional (R3); Apple sign-in asks for email only (R9) |
| Same page, 4.8 | Third-party or social login needs an equivalent privacy-preserving option; not needed where the app uses only its own account system | Checked 9 Nov | Apple plus our own email code; no Google in Build 12 (NX-02) |
| Same page, 2.1(a) | Demo account information, with the back end switched on, if the app has a login; a built-in demo mode only with prior approval | Checked 9 Nov | NX-05; section 6 |
| Same page, 5.1.1(ix) | Apps in highly regulated fields, or that require sensitive user information, should be submitted by a legal entity, not an individual | Checked 9 Nov | Unchanged by this decision; see section 6 |
| Apple HIG, Managing accounts, https://developer.apple.com/design/human-interface-guidelines/managing-accounts | Create an account only if core functionality needs it; delay sign-in as long as possible; explain the benefits of an account on the sign-in view; avoid an app-specific biometric opt-in for account authentication; deletion must be offered in the app | Checked 9 Nov (the .md version) | The explanation is R21; the delay advice is what we are overriding |
| Apple HIG, Onboarding, https://developer.apple.com/design/human-interface-guidelines/onboarding | Postpone nonessential setup; do not let large downloads hinder onboarding; ask for a permission when the function is first used; keep licensing details out of onboarding | Checked 9 Nov (the .md version) | Match all but the last, which is NX-03's and counsel's |
| Dearest, Baby Diary: Voice Journal | No account; on-device | Copied from `02-benchmark.md` and F02 section 5 (R1-S3) | A competitor who needs no account; our label cannot say "Data Not Collected" once accounts exist (`02-benchmark.md` row 10) |
| Day One | Account needed to sync (email, Apple, Google) | Copied from F02 section 5 (R1-S6, R1-S52) | Match methods, no passwords |
| Calm, reminder ask after the first completed session | Vendor case study: 40% set one, 3x retention; causal claim is the vendor's | Copied from F13 (R1-S57) | Match the placement; do not rely on the number |
| Headspace quiz; Tinybeans optional child details | Quiz doubled starts, no habit lift; +885% completion in a designer's self-reported case study | Copied from F03 (R1-S58, R1-S51) | No quiz (R17 reject list); name optional by principle only |
| Any figure for sign-in-first versus sign-in-after-value | none | UNVERIFIED. No number is claimed | HYPOTHESIS |

## 5. The states a new customer can be in

### 5.1 Empty, error, offline, outage, lost email

| State | What happens | What the person sees | Source |
|---|---|---|---|
| No connection at first launch | Screen 1 works (it needs none). Screen 2 says plainly that sign-in needs a connection, retries when the connection returns, and offers the fallback chosen in founder answer 1 | `authCopy.errors.network` (exists), new offline lines (R19) | R19 |
| Sign-in or backend unreachable (outage, project paused, rate limit) | A retry with back-off; after 10 seconds without an answer the outage screen shows (the app's existing gate timeout is 10 seconds, `session-provider.tsx`); then option A or B of R18 | new `authCopy.outage.*` | R18 |
| Sign-in cancelled at the Apple sheet | Back to screen 2, nothing recorded as a failure | screen 2 as before | NX-02; `auth_deferred` |
| Email typed wrong | Same screen for known and unknown addresses; "Use a different email" | `authCopy.code.*` | F02-REQ-005 |
| No email arrives | After 60 seconds: "Send a new email", "Use a different email" and "Continue with Apple" side by side; letters-are-safe line; Help link | `authCopy.code.resend`, `.resendWait` (exist); `.noMailHelp` new | R11 |
| Hide My Email relay address | Mail must arrive (the sender domain registered with Apple) | n/a | NX-02 edge cases; F02-REQ-006 |
| Code expired (900 s) | Friendly retry, no second account | `authCopy.errors.expired` (exists) | NX-02 |
| Account found, no book | `authCopy.noBook.*` ("No book here yet. Did you use a different way to sign in last time?") with Try another way and Start a book | exists | R12 |
| Under 18 or No on screen 1 | NX-03-R2 stop screen | NX-03 | NX-03 |
| Blocked country (D-131) | NX-03-R7 refusal at sign-up only | NX-03 (held) | NX-03 |
| Consent declined (2b "Not now") | The book still opens; sync and backup stay off; a quiet row in Account says how to finish (NX-32 "Finish setting up") | exists | F02 U34; NX-32 |

### 5.2 Resume after quitting mid-way

Today, "nothing is saved until the final transaction; inputs are lost" (F03-U12). With a session now inside first run, a quit has three cases, and R4 fixes all three: a quit before sign-in finishes reopens on screen 2 (an email code still valid is offered again; one past 900 seconds is not); a quit after sign-in and before the book exists reopens on screen 3 with the session kept (a signed-in parent is never sent back to screen 2); a quit after screen 3 or 4 reopens on the first screen not completed with typed values kept on the phone. None of this is sent anywhere before the book exists; erase everything on this phone removes it (NX-04).

### 5.3 A returning customer on a new phone

Screen 1 (the age answer is stored on the phone and not synced, so it is asked once on every phone) > screen 2, the same two buttons, the same method as last time (`authCopy.sheet.lastMethod.*` is shown only where the phone knows) > screen 2a and 2b as needed > "Your book is here". No child step, no signature step, no reminder card in that session. If the account has no book: `authCopy.noBook.*`. Recordings arrive only if backup is on for that account (R13).

## 6. Risks, checked rather than assumed

### 6.1 Apple: does requiring sign-in before any use fit this app?

What I read on 9 Nov 2026 (Apple's current page, through a fetch tool): guideline 5.1.1(v) says an app without "significant account-based features" must be usable without a login, and that personal information may be required only where directly relevant to the core functionality or required by law. I searched the same page text for a sentence that permits registration-first for an app whose core could run without it, and for any 4.2 rule about login-only apps: neither was found. The page was fetched in part (the first 100,000 of 121,490 characters); the sections above sit in the part I read.

The honest reading:
- **The core of Early Letters works with no server.** Record, review, keep, read and export all run on the phone (NX-02 says so itself, and Build 11 shows it). Sync, backup, sharing and billing notices are the account-based features. Apple's test is "significant account-based features". Free recording backup, sharing and a new phone's book are defensible as significant, and they are exactly what the Notes for Review would argue. Whether a reviewer accepts that is UNVERIFIED and not something I can put a number on.
- **Rejection risk, stated plainly:** real, in the first review round, under 5.1.1(v), because on screen 2 a reviewer finds they cannot reach the core without giving an email or an Apple account, and the app's core is local. I would not call it likely to be final: the usual outcome of this kind of question is a request for explanation. But it can cost a review cycle (D-121 already records the cost of two cycles).
- **What reduces it:** (a) Notes for Review that name the account-based features and the free backup; (b) a screen 2 line that says why (R21); (c) if the founder picks option B in R18, the local start exists in the product and the argument becomes stronger; (d) the account deletion route in the app (NX-04, 5.1.1(v) second half).
- **2.1(a):** the reviewer is stopped at screen 2 on the first tap, so a demo path is not optional. The app is passwordless (no password to put in the Notes). NX-05 B-1 has two paths: a review mailbox the founder watches and answers with a code within 15 minutes, or a fixed demo sign-in approved by Apple. With sign-in first, a missed code is a failed review on the first screen. The back end must be on during review (the guideline says so). Reviewers work across time zones; a standing watch window is a founder duty. The reviewer's Apple sandbox account can also use Sign in with Apple, which needs no code from us; whether that is accepted as "a login I can use" is UNVERIFIED.
- **5.1.1(ix):** unchanged by this decision. The risk is on the record in D-004/D-134 (an individual publisher, and the "sensitive user information" limb). A required email does not make the information sensitive; the child's name and date already did that. I could not verify how a reviewer applies this to a baby memory book (UNVERIFIED), and sign-in-first does not alter it.

### 6.2 A sign-in or backend outage now blocks every new customer

This is the largest new risk. The paths into screen 3 now depend on four things working at the same time: Apple's sign-in service, our Supabase project (Auth and the database), the email provider for the email path, and the app's own release switches. Two facts from the repo make this concrete: the production project does not exist in the docs (`docs/ops/DEPLOY.md` line 36, `scribe-prod` "does not exist yet"; gap map section 0 item 2), and the free-plan keep-alive and backup work is still open PRs (#685, by title only). A paused or rate-limited project is an outage. R18 specifies the degraded path. Two options, no decision:

| | Option A: hold and retry | Option B: outage-only local start |
|---|---|---|
| What shows | After 10 seconds: "We can't reach sign-in right now. Your letters are safe." with Try again and an automatic retry when the connection or service returns | The same screen, plus a second button "Start the book on this phone for now" that appears only after the failure, never on a healthy screen 2 |
| What the person can do | Wait. Nothing is recorded | Create the book and write letters; the book is a local book. At the next healthy launch the sign-in card appears once per day until done, and the local letters move to the account only after consent and a tap on the screen that shows the masked email (F02-REQ-019, exists) |
| Is a local-only start allowed by the decision on record? | Not needed | The founder's 9 Nov decision, as relayed, says account before the book opens. Option B is an exception to it and needs his word. D-006's "no local-only mode" is about under-18 users, not this |
| Cost | Every new customer in an outage is lost for that session; a reviewer in an outage sees a dead end (2.1(a) says turn the back end on) | A second path to build, test and explain; the 5.1.1(v) argument gets stronger because the local start exists; a risk of customers who never sign in |
| Recommendation | | **B, as an outage-only fallback behind a signed remote-config switch** (default on, so we can turn the local start off if abused). It protects the first days of a public launch, and costs one screen and the existing claim flow. The founder decides |

The switch is new (`capabilities.ts` is Build-time only; a signed remote config switch is `packages/api/src/remote-config.ts`, whose reading in the app is itself not done for the epoch, NX-02-R5). If remote config cannot be read, the fallback is build-time.

### 6.3 Offline first launch

Under sign-in-first a person who installs on a plane, in a basement or on a failed hotel connection cannot start the book at all, unless option B above is chosen. Screen 1 works offline (NX-03). Screen 2 says in plain words that sign-in needs a connection and retries on its own when one returns. This is a true loss against revision 1 (which worked in airplane mode end to end) and against competitors that need no account (Dearest, Baby Diary; section 4). R19 specifies it.

### 6.4 The first-run time target, now with sign-in inside it

F03's target is a median of 90 seconds from first launch to first saved letter, itself marked [A] (assumed). With sign-in inside, 90 seconds is not reachable on the email path, where the mail alone is p90 30 seconds and p95 2 minutes (NX-02 budget; A-NFR-004). The proposed targets, all labelled proposed and untested: Apple path, first launch to first kept letter median 150 s, to the Speak button 75 s; email path, median 240 s, to Speak 165 s; taps before Speak 18 or fewer on the Apple path, and the email path adds one address and six digits typed. The number to watch is the share of people who pass screen 1 and reach screen 3 (proposed 85% or more; no data behind it). `product` must restate F03 section 3 when the founder confirms (R15).

### 6.5 Email-code deliverability

Email is one of the two doors now, so mail that does not arrive is a locked door. What I verified on 9 Nov 2026:
- The DNS today (read from Google's public DNS-over-HTTPS answer): `_dmarc.earlyletters.com` is `v=DMARC1; p=none; rua=mailto:hello@earlyletters.com; adkim=r; aspf=r;`. `resend._domainkey.earlyletters.com` has a public key. So DMARC is in monitor-only mode, and DKIM exists. Neither written plan matches the record exactly: `docs/ops/DOMAINS.md` wants `rua=mailto:dmarc@earlyletters.com` and `fo=1` and a staged move to quarantine (about five weeks of clean reports before reject: 14 days, 7, 14); `docs/ops/AUTH_SETUP.md` 4.1 says start at `p=quarantine`. The two docs disagree and the record is a third thing. Ops must pick one.
- Not verified: that Resend's domain shows Verified, that SMTP is set in any Supabase project (S-52 failed on 8 Nov), that mail passes DMARC at Gmail, Outlook, iCloud and an Apple private-relay address (DOMAINS.md says to test all four before quarantine).
- The Supabase default after custom SMTP is 30 emails per hour for the whole project; AUTH_SETUP 4.3 raises it to about 100 per hour for TestFlight and says "more at launch" without a number. At a public launch this is a cap on how many email-path customers can sign in per hour, shared with every resend. The number must be set by ops before public.
- Minimum 60 seconds between emails to one address is the existing setting.
- Click and open tracking must be off (AUTH_SETUP 4.1), or the link does not open the app.
R20 is the pre-flight for this.

### 6.6 What this changes elsewhere (cited, nothing edited)

| Where | Today | Changes to |
|---|---|---|
| F03-U02 (name empty blocks Continue) and F03 section 4 | Name required, 1 to 60 characters | R3: optional (founder answer 3 still to be confirmed) |
| F03-U12 (inputs lost on quit) | "Starts at the child step again" | R4: resume at the first incomplete step; session kept |
| F03 section 6.1 entry and 6.2 step 1 | Welcome > Start a book > child | Welcome and sign-in are one screen; the child step follows sign-in |
| F03 section 3 (90 s median) | 90 s, [A] | R15: proposed targets per path |
| F02 sections 4 and 6.1 (Keep the book after letter 2 or session 2; ask table) | Sign-in is an ask after value | Sign-in is screen 2; the Keep card, its re-offer rule and the ask-table row for it fall away from first run. The re-offer rule survives only for the outage fallback (option B) and a signed-out phone (R22). `product` edits F02 after the answers |
| F02 persona rows P1 and P3 ("may defer the account for weeks") | Defer allowed | No deferral for a new book; deferral remains only under option B |
| NX-02 "Decline and withdraw: Not now keeps the phone fully working" | Not now on the sheet | Not now on screen 2 exists only in the outage fallback (option B) and for a phone that already has a book (R22). NX-02 should be re-read by its owner |
| NX-02 offline paragraph ("Not now stays one tap") | One tap | Same, under B; under A it does not exist |
| NX-03 "If they answer yes, the sign-in buttons appear with the agreement line directly above them" | Ambiguous (my revision 1 read it as the Keep card) | Now literal: the buttons are screen 2. NX-03-R3 (agree line above sign-in buttons) is a first-run row, no longer a later card's |
| NX-03 "Decline and withdraw" for the agreement ("Not now keeps the on-device book working") | Local book works without agreement | Unchanged for the box on screen 1; but a person who declines sign-in cannot start a book (option A) |
| PR #635 (Before you begin) and its split plan | Yes + tick + Continue, then Welcome; part 3 changes the seeds and four web journeys so every journey passes the agreement | The flow after Continue is now screen 2. Two agreement moments exist: #635's local box on screen 1 and the agree line above the sign-in buttons (D-138 item 3, F02-REQ-014 server `terms` act). Keep one box (screen 1) and one line (screen 2), no second box; counsel Q48. Part 3's journeys now also stop at sign-in: R23 gives them a test seam. #635 itself needs no change to merge |
| `onboarding.promise.recordingBody` ("The recording is kept on this phone", written because backup "cannot be on yet", lawyer-2 H4) | True in Build 11 | False once free backup is on. R21 replaces it by capability |
| NX-32 (account management) lines 10, 171 and 174 | "This file starts after a person is signed in. It never specifies the sign-up path"; "a signed-out phone's entry to sign-in stays one route, owned by NX-31"; needs from NX-31: "after sign-up the person lands knowing which method they used, and the first Account visit needs no setup step" | Compatible. NX-31 now makes the signed-out phone rare (sign-out, forced sign-out, outage option B). NX-32's "Finish setting up" and "Agree and sync" rows now appear only when 2b was declined. The method is known from screen 2 (R10). NX-32 R1's signed-out Account card still applies |
| NX-30 line 36 ("Welcome (first run) is `/onboarding`, five steps. NX-31 owns it") and line 55 | Welcome as its own screen | Welcome and sign-in are one screen; NX-30's welcome rows should read this file |

## 7. The check

Tags: EVIDENCE means checkable on the tree or against Apple's text. HYPOTHESIS means a claim about customers, tested on cohort C1 with the owner `user-research` and no engineer build row. Revision 1 ids keep their meaning where the behaviour survives (R2 to R4, R6, R8 to R16); R1, R5 and R7 no longer apply and stay as "Dropped"; R17 onward are new in revision 2.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-31-R1 | Dropped on 9 Nov 2026 | Dropped: it required a first run with no account. Superseded by the founder's decision that the account comes before the book opens (R17). Id not reused | n/a | Founder, 9 Nov |
| NX-31-R2 | EVIDENCE | Given the ask table in section 2, When the first-run path runs on a device, Then asks appear only in that order, and before the first Speak tap 0 OS permission sheets appear (the Apple sign-in sheet is the system's own sign-in surface and is not counted), and before the first kept letter 0 notification sheets appear, and after screen 9 at most 1 card ask appears per session. | The sequencer exists with tests (`ask-sequencer.logic.test.ts`); no test walks the whole path. The lock card (#640) shows at "The book is open." before any letter (S1-131 (a)) unless R14 moves it. | F02 "every ask in the first 14 days"; F13 DR-12 B |
| NX-31-R3 | EVIDENCE | Given screen 3 with the name field empty and a birthday or due date chosen, When the person taps Continue, Then the book is made with no name, every place that shows the name shows `onboarding.childFallback` ("your child"), 0 errors, and the name can be added later in Settings > the child's book. Given a name and no date, Continue waits and the reason line shows. | `childrenExtra.nameRequired` and F03-U02 block an empty name. Whether `onboarding.tsx`, the local `children` table or `create_first_run_children` also requires one is UNVERIFIED (not read). Conflict with F03-U02, F03 section 4: section 15. | Brief of 9 Nov; Apple 5.1.1(iii); F03-U07 |
| NX-31-R4 | EVIDENCE | Given first run quit at any of the cases in 5.2, When the app is reopened (cold start, any time later), Then it opens on the first screen not completed, a signed-in parent is never sent back to screen 2, a valid email code is offered again and an expired one is not, typed values are kept, the age answer is not asked again, and "Erase everything on this phone" removes the kept values. | F03-U12 says the opposite. No first-run progress store exists on the tree that I found (searched `apps/mobile/src/lib` names only; UNVERIFIED). | F03-U12 (changed); NX-04 |
| NX-31-R5 | Dropped on 9 Nov 2026 | Dropped: it required the whole first run to work in airplane mode. Superseded by R19 (offline first launch). Id not reused | n/a | Founder, 9 Nov |
| NX-31-R6 | EVIDENCE | Given the first kept letter, When the first-letter moment closes, Then the reminder card is the only ask in that session; Yes, evenings asks the OS for notification permission once; No reminders asks nothing; after a refusal at the OS sheet the card is not shown again. | Card and sequencing exist (F13 DR-12 B, `onboarding.reminder.*`, `reminder_prime_shown` source `first_letter`). Not proven end to end on a device in the Build 12 profile. The schedule is NX-10's | F13-REQ-023; NX-10 |
| NX-31-R7 | Dropped on 9 Nov 2026 | Dropped: it timed a Keep card after the second letter. Superseded by R17. The re-offer idea survives only for option B and R22. Id not reused | n/a | Founder, 9 Nov |
| NX-31-R8 | EVIDENCE | Given screen 2, Then it shows Continue with Apple and Sign in with email at equal weight, the one-line description above or below, the versioned Terms and Privacy line directly above the buttons, no password, name, phone or contact field, no second "are you 18 or older" question, and a text link "I was invited"; at AX5 0 lines clip; VoiceOver reads the Terms line before the buttons. | `authCopy.consent.age` ("Are you 18 or older?") exists as a sign-in-time question and may still show after Before you begin: UNVERIFIED, NX-03's to settle. The agree line above the buttons was not found by search (NX-03-R3). The welcome and the sign-in sheet are separate surfaces today | NX-03-R3; D-138 item 3; Apple 5.1.1(iii) |
| NX-31-R9 | EVIDENCE | Given Sign in with Apple, When the app requests authorization, Then the scope is the email only (no full name), and a Hide My Email address is accepted as the account email. | UNVERIFIED: which scopes `apps/mobile/src/lib/auth/apple.ts` requests was not read. A parent's name is never used by the product | Apple 5.1.1(iii); F02-REQ-006; LEGAL-REQ-012 |
| NX-31-R10 | EVIDENCE | Given a sign-in that succeeds, Then the method used is remembered on the phone and shown in Account (NX-32), "The book is open." carries no extra confirmation screen, and the count of anything is not shown. | The pieces exist (`authCopy.account.signedInWith.*`, `authCopy.sheet.lastMethod.*`). Revision 1 had a separate confirmation screen; sign-in-first drops it to save a screen | F02-REQ-019; NX-32 R4 |
| NX-31-R11 | EVIDENCE | Given the code screen, When 60 seconds pass with no code entered, Then "Send a new email", "Use a different email" and "Continue with Apple" are shown together, with the line that letters are safe and a link to Help; there is no dead end. | `resendWait` exists; no screen offers the three recoveries together. The recovery drill for "lost my phone and my email" is NX-02-R10's (HYPOTHESIS) | NX-02-R10; NX-16 |
| NX-31-R12 | EVIDENCE | Given a new phone and screen 2, When the account has a book, Then 0 child steps, 0 signature steps and 0 reminder or lock cards appear in that session and the person lands on Tonight. When the account has no book, Then `authCopy.noBook.*` shows. When the person signs in with a different method or email than last time and gets no book, Then `noBook` is how they find out. | Merged in code, never run across two phones on a hosted project | F02-REQ-002; gap map 1.5 |
| NX-31-R13 | EVIDENCE | Given a new phone signed in to an account whose recordings are not backed up, When the book arrives, Then the screen says in plain words the words arrived and the recordings are still on the old phone. Given backup on, Then it says the recordings are arriving and shows them as they land. | Backup is off in every profile on 8 Nov (gap map 1.6); whether the app tells a new phone which recordings are missing is UNVERIFIED | D-033; F08 |
| NX-31-R14 | EVIDENCE for placement; the decision is the founder's | Given a new install, When the person reaches "The book is open." Then no lock offer shows; Given the third session or Settings > Privacy, Then the lock card is offered once, and "Not now" holds for 30 days (proposed). | Build 11 shows the card at "The book is open." (S1-131 (a)) | F17; F03 section 4 Never; founder answer 4 |
| NX-31-R15 | HYPOTHESIS | Given 10 scripted first runs on an iPhone SE 3 per path (Maestro) and then C1 families, Then the medians are, per path (all proposed): Apple, 150 s to the first kept letter and 75 s to the Speak button; email, 240 s and 165 s; taps before Speak 18 or fewer on the Apple path; and 85% or more of people who pass screen 1 reach screen 3. Owner: `user-research`. Test: none, study. | No measurement exists. F03's 90 s median is [A] and cannot hold with sign-in inside | F03 section 3; NX-02 budget |
| NX-31-R16 | EVIDENCE | Given every string on screens 1 to 9 and the outage screen, When the content rules test runs, Then 0 strings contain a streak, point, badge, count of gaps, countdown, "only N free", "don't lose", or any fear, guilt or loss wording, and 0 strings say a machine writes or shapes their words. | `rules.test.ts` enforces characters and words; no test enumerates this path's keys. Note: the "keep your recordings safe" line must not read as a warning about loss | CLAUDE.md content rules |
| NX-31-R17 | EVIDENCE | Given a fresh install and a person who passed screen 1, When they continue, Then the next screen is screen 2, no child, signature or Tonight screen can be reached without a session (a deep link, a notification or a relaunch included), and the same two buttons serve a new and a returning parent. | Today Welcome offers "Begin the book", "I already have a book" and "I was invited" as three buttons and the child step needs no session (`onboarding.welcome.*`, F03 6.2). The root gate waits for a session only for server surfaces | Founder, 9 Nov; F02 |
| NX-31-R18 | EVIDENCE | Given a sign-in or backend that gives no answer within 10 seconds, When screen 2 is open, Then the outage screen shows with a retry and an automatic retry with back-off, says letters are safe, and (option B only) shows the local-start button; given a build-time or signed-config value off, the button never shows. The local book from B moves to the account only after consent and a tap on the screen with the masked email. | No outage screen exists; `authCopy.errors.network` and `.unknown` exist (as lines on other screens). The 10-second gate timeout exists (`session-provider.tsx` comment). The remote-config reading in the app is not done (NX-02-R5) | Section 6.2; F02-REQ-019 |
| NX-31-R19 | EVIDENCE | Given airplane mode at first launch, When the person passes screen 1 and reaches screen 2, Then the screen says sign-in needs a connection, no button looks broken, it retries by itself on reconnect, and 0 error codes are shown. | `authCopy.errors.network` ("Sign in once you are back online") exists for a different screen; behaviour of screen 2 offline is not proven | NX-02 offline paragraph; section 6.3 |
| NX-31-R20 | EVIDENCE | Given the preflight for a build that is public, Then it fails unless all hold: the DMARC record is present and its policy is the one ops chose (today `p=none`); the Resend domain is verified; the DKIM record resolves; Supabase SMTP is custom and the email rate limit is at least the launch value ops set; click and open tracking are off; and a test link reaches Gmail, Outlook, iCloud and an Apple private-relay address with DKIM and DMARC pass. | `scripts/` has no such check; the two docs disagree on the DMARC start (DOMAINS.md versus AUTH_SETUP 4.1). Live DNS on 9 Nov: DMARC `p=none`, DKIM key present. SMTP state in any project: UNVERIFIED (S-52 failed on 8 Nov) | NX-02-R2 area; AUTH_SETUP 4.1 to 4.3; DOMAINS.md |
| NX-31-R21 | EVIDENCE | Given the build has recording backup on, Then screen 2 and "The book is open." carry the safe-recordings lines (section 10, placeholders) and `onboarding.promise.recordingBody` is not shown. Given backup off, Then the old true line is shown and the safe-recordings lines are not. 0 strings promise a backup the build does not run. | `onboarding.promise.recordingBody` ("kept on this phone") is the only first-run line today and becomes false when backup is on. Backup is off in every profile on 8 Nov | D-033; counsel for the registered strings |
| NX-31-R22 | EVIDENCE | Given a phone that holds a book and a session that ends (sign-out, forced sign-out, expiry, a deleted account elsewhere), When the person opens the app, Then they can still read, record and export on that phone, and the sign-in screen is offered without blocking them. | Sign-out leaves letters on the phone today (`authCopy.account.signOutBody`). F02-REQ-007 offers one export on deletion. The new gate (R17) must not turn into a lock-out. Held on founder answer 2 | F02-REQ-001, -007; NX-02-R4, -R5 |
| NX-31-R23 | EVIDENCE | Given Maestro and web e2e journeys (j01 first run and others) and the kill and seed paths, When they run, Then they pass screen 2 through a test seam: a seeded Asha session, or a throwaway-project sign-in, never a real person's account and never a bypass flag in a store build. | The journeys pass the gate without a session today; #635 part 3 already edits them for the agreement. Without a seam they all stop at screen 2 | CLAUDE.md (Asha only); #635 split plan part 3 |
| NX-31-R24 | EVIDENCE | Given the Notes for Review and the review path chosen in NX-05, When a person who is not the founder follows only the Notes on a fresh phone, Then they pass screen 2 and reach the child step; and the Notes name the account-based features and the free backup. | NX-05 owns the path; its text is written for a signed-in book. The 5.1.1(v) explanation (section 6.1) must be added | NX-05-R1, -R2; Apple 2.1(a) |


## 8. Door lines (COORDINATION section 10; PRIV-R21)

Registered strings change only with counsel and a disclosures version bump in the same PR (`COUNSEL_LOCKED.md`).

### Screen 1: age and agreement (NX-03 owns the words)
**Shown:** `ageGate.*` and the agreement line. **Records:** the yes or no and the agreement act per PRIV-R21; never a birth date. **Never:** a preselected answer. **Decline and withdraw:** No stops with nothing stored beyond the time.

### Screen 2: sign in
**Shown:** `authCopy.sheet.*` and `authCopy.email.*` (exist); the registered lines `authCopy.sheet.privacy`, `.why`, `.emailUse`; the safe-recordings line (R21, placeholder, registered); the Terms and Privacy line directly above the buttons. **Records:** a sign-in act through `record_policy_act` (NX-02), and the agreement act that uploads after the Terms row (F02-REQ-014). **Never:** a password, a name, a phone number, contacts, an advertising id, a Plus sheet (F02-REQ-009 Rev, D-036). **Decline and withdraw:** there is no "Not now" on a phone with no book (founder decision, 9 Nov). The person can close the app with nothing recorded beyond the age answer. Option B, if chosen, is the one decline path. Withdrawal and deletion are in Settings (PRIV-R09; Apple 5.1.1(v); NX-04, NX-08). This is a consent-design point for counsel (Q48): a required step is not the same as a freely given consent, so the sign-in is framed as account creation, and each optional act after it (sensitive-data consent, reminders, analytics, lock) keeps its own decline.

### Screen 2b: sensitive-data consent
**Shown:** `authCopy.consent.terms.*` (exist; registered). **Records:** its own act (F02-REQ-010). **Never:** pre-ticked; bundled with the sign-in. **Decline and withdraw:** Not now: the book opens, sync and backup stay off; Settings > Privacy withdraws (NX-08).

### Screen 3: the child's details
**Shown:** `onboarding.child.*`. **Records:** the name if typed (as typed, any script, never transliterated), the date; kept values for resume are the same fields on the phone. **Never:** a surname, a photo, a location, a contact, gender (F03 Never; LEGAL-REQ-012). **Decline and withdraw:** leave the name empty; edit or remove in Settings; erase everything on this phone (NX-04).

### Screen 9: reminders
**Shown:** `onboarding.reminder.*` (exists). **Records:** the chosen time on the phone; the OS records the permission. **Never:** a reminder that quotes the child's name by default (D-025), a nudge after a refusal, a count of missed days. **Decline and withdraw:** No reminders asks nothing; Settings turns them off in one tap.

### Third session: the lock
**Shown:** the S1-131 card. **Records:** a device setting only. **Never:** our own PIN (F17), a server record. **Decline and withdraw:** Not now; Settings > App lock.

## 9. What we reject, and why

| Pattern | Why not |
|---|---|
| A password, or a forgot-password path | D-054; NX-02 Never |
| A separate "Create account" and "Log in" choice | Two buttons the person cannot choose between reliably; the account decides |
| A forced name, phone number, contacts or a photo at sign-up | LEGAL-REQ-012; 5.1.1(iii) |
| Streaks, points, badges, "you have written 3 of 30" | CLAUDE.md content rules |
| Counting gaps ("you missed 4 days"), "we miss you" | Same; guilt language |
| "Don't lose your memories", or any fear or loss wording on screen 2 or the outage screen | Same; the screen says what is true and kind |
| A quiz or goals in first run | F03 6.4; Headspace evidence (copied) |
| A tour before the first letter | HIG: teach through interactivity |
| A notification or lock prompt before the first kept letter | HIG; F03 Never; K-02 |
| Plus or a price in first run | C-REQ-023, F03 Never |
| A bypass flag or a test account baked into a store build | Security; CLAUDE.md; R23 |

## 10. Copy needs (packages/content)

Words are by `content` and reviewed against `VOICE.md` and the content rules; the lines below are **placeholders for counsel and `content`**, not final words, and every line that states where recordings are or how they are stored is **counsel-registered** (it must match the privacy policy, the privacy label and the subprocessor list, and it is true only while backup is on). Parent vocabulary only: "book", "letter", "kept", "sign in", "recording". Never "entry", "take", "draft", "sync", "upload", "account holder". Never gender the child; use `{child}`, with `onboarding.childFallback` when no name was typed. Nothing implies a machine writes the family's words.

| Key | Status | Placeholder words (not final) | Registered? |
|---|---|---|---|
| `authCopy.sheet.titles.sign_in_first` | new | "Sign in to open your book" | no |
| `authCopy.sheet.bodies.sign_in_first` | new | "Your letters and recordings are kept safe in your book, and come with you to a new phone." | **yes** (states where recordings are) |
| `onboarding.finish.recordingsSafe` | new | "Your recordings are kept safe, so {child} can hear you say it one day." Replaces `onboarding.promise.recordingBody` when backup is on | **yes** |
| `onboarding.finish.recordingsSafeNoName` | new | "Your recordings are kept safe, so you can hear them again one day." (when no name was typed) | **yes** |
| `onboarding.promise.recordingBody` | exists ("The recording is kept on this phone, so one day {child} can hear you say it.") | stays for builds with backup off | **yes** (already counsel-reviewed, lawyer-2 H4) |
| `billingCopy.membership.line` / `onboarding.welcome.freeLine` | exists | must be checked so "free" claims about backup do not clash: the line says reading, listening and "your copy" stay free; whether "free backup" is a promise of the Free plan for all or for new customers only is the founder's (section 15, answer 5) | **yes** |
| `authCopy.outage.title`, `.body`, `.retry`, `.startLocal` (option B only) | new | e.g. "We can't reach sign-in right now. Your letters are safe." | no |
| `authCopy.offline.signIn` | new | "Sign in needs a connection. We will try again when you are back online." | no |
| `onboarding.child.nameOptionalHelp` | new | a short line that the name can be added later | no |
| `authCopy.code.noMailHelp` | new | plain help for mail that has not come | no |
| `authCopy.newPhone.arrivedWords`, `.arrivedWithRecordings` | new | R13 | **yes** (states where recordings are) |
| `onboarding.welcome.*`, `onboarding.child.*`, `onboarding.signsAs.*`, `onboarding.finish.*`, `onboarding.reminder.*`, `speechConsentCopy.*`, `authCopy.sheet.*`, `authCopy.email.*`, `authCopy.code.*`, `authCopy.errors.*`, `authCopy.noBook.*`, `authCopy.consent.*` | exist | | `authCopy.sheet.privacy`, `.why`, `.emailUse`, `authCopy.consent.terms.*` registered |
| `onboarding.welcome.joinButton` ("I was invited") | exists | stays as a link on screen 2 | no |
| `onboarding.welcome.signInButton` ("I already have a book") | exists | retired from screen 2 by R17 (folded into the two buttons); keep the key until the F11 flow is re-read | no |

## 11. Analytics (opt-in, content-free, names only; off in every 1.0 profile, D-124 item 3)

Existing, in catalog: `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`, `reminder_prime_shown` (source `first_letter`), `reminder_prime_result`, `os_permission_result`, `letter_saved`, `child_added`, `analytics_opted_in` (with the `time_to_first_letter` bucket). `SIGN_IN_TRIGGER` in the catalog has `first_letter`, `invite`, `invite_create`, `sign_in`, `settings`: screen 2 uses `sign_in`. New, not in `packages/analytics/src/catalog.ts` (checked 9 Nov), add to the catalog and `docs/analytics/TRACKING_PLAN.md` in the same PR: `first_run_resumed` (no properties; R4); `sign_in_outage_shown` (no properties; R18). Nothing carries a name, a date, an email or letter text; the allowlist test fails on any property. Sends nothing in 1.0. An outage is counted by the weekly Supabase Auth log check and NX-17 internal alerts, not by app analytics. The No answer on screen 1 is never sent (NX-03). No entry text, transcript, audio or child name in analytics, logs or crash reports; the child's name is optional, and when absent the stored value is empty, not a placeholder that looks like a name.

## 12. Device rows

Placeholders until `qa` assigns ids. A scan on 9 Nov of the patches of the open PRs found S1-110, S1-111, S1-112 (#635), S1-131 to S1-135, S1-140, S1-144 and S1-150 to S1-152 in use or claimed, so `qa` picks above S1-152 or fills gaps.

| Placeholder | Steps | Proves |
|---|---|---|
| D31-1 | Fresh install, pass screen 1; confirm screen 2 is next and the child step cannot be reached by relaunch or link | R17 |
| D31-2 | Apple path: sign in, consent, name left empty, finish to the first kept letter; stopwatch | R3, R8, R15 |
| D31-3 | Email path: type address, get the code, type it; stopwatch; repeat with the link | R8, R11, R15 |
| D31-4 | Quit at the code screen, after sign-in, after screen 3 and after screen 4; reopen cold each time | R4 |
| D31-5 | Count OS sheets across the path | R2, R6 |
| D31-6 | Screen 2 at AX5 and VoiceOver | R8 |
| D31-7 | Apple sheet: what it asks for; a Hide My Email address | R9 |
| D31-8 | Wait 60 s on the code screen; use each recovery | R11 |
| D31-9 | Two phones: second phone signs in as the first | R12, R13 |
| D31-10 | Airplane mode at launch, then back on | R19 |
| D31-11 | Pause or block the hosted project on the throwaway project; open the app | R18 |
| D31-12 | Sign out, force sign-out, relaunch with a book on the phone | R22 |
| D31-13 | Third session: lock card once | R14 |
| D31-14 | Reviewer drill: follow only the Notes on a fresh phone | R24 |
| D31-15 | Mail to Gmail, Outlook, iCloud, Apple private relay: DKIM and DMARC pass | R20 |

## 13. Rollout, owners, gate

| Step | What | Owner lane | Switch and off behaviour |
|---|---|---|---|
| 1 | R3 (name optional), R16 (key list test), R23 (test seam) | `mobile`, `content`, `qa` | None; local behaviour. Rollback: revert |
| 2 | R17, R8, R9, R22 on the Build 12 profile | `mobile`, `design-systems`, `security-architect` for R9 | Gate behind the server-features capability: off means today's Welcome and local book (Build 11 behaviour) |
| 3 | R18, R19: outage and offline | `mobile`, `ops` | Signed remote-config switch for the local start (option B); default as the founder answers |
| 4 | R20 deliverability preflight and the DMARC decision | `ops`, `security-architect`; founder for DNS | A failing preflight blocks the public release, not a switch |
| 5 | R21 safe-recordings lines and R13 | `content`, counsel, `mobile`, `sync` | Lines are chosen by the backup capability |
| 6 | R4 resume; R12 new phone | `mobile`, `sync` | Needs a hosted project and two phones |
| 7 | R24 reviewer path, Notes for Review | `ops`, founder | NX-05 |
| 8 | R15 measurement and the cohort comparison | `qa`, `user-research`, `analytics` | Study |

Gate: the founder answers section 15; no stranger gets Build 12 until R17, R18, R19, R20 and R24 each have a device or ops run with servers on. Counsel for the registered strings in section 10. R9 touches auth code: a counted second review (D-041).

Engineering block lines that apply: API contract, none new except the remote-config switch for option B (additive, contract test in `packages/api/test/remote-config.test.ts`). Schema: none expected; R3 may need `children.name` to accept empty, local and in `create_first_run_children` (UNVERIFIED; if the server requires a name, that is a new migration with grants and R3 waits for it only on the signed-in path, which is now every path). Data class: child name L4 as today; resume values L2/L3 on the phone only. Budget: screen 2 interactive p95 300 ms with no awaited network before the first frame. Accessibility: AX5, VoiceOver order, 44 pt targets, Reduce Motion fade only, on screens 2, 2a, 2b, 3 and the outage screen.

## 14. Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-31-R1 | Dropped | none | none |
| NX-31-R2 | F02 ask table; F13-REQ-023 | mobile unit (proposed `apps/mobile/test/first-run-ask-order.test.ts`); `[NX-31-R2] asks appear in table order with 0 OS sheets before Speak and before the first kept letter` | D31-5 |
| NX-31-R3 | F03-U02 (changed), F03-U07 | mobile unit (extends `apps/mobile/test/onboarding*.test.ts`; exact file UNVERIFIED); `[NX-31-R3] an empty name with a date creates the book and shows the fallback` | D31-2 |
| NX-31-R4 | F03-U12 (changed) | mobile unit (proposed `apps/mobile/test/first-run-resume.test.ts`); `[NX-31-R4] a cold start reopens on the first incomplete step and a signed-in parent never sees screen 2` | D31-4 |
| NX-31-R5 | Dropped | none | none |
| NX-31-R6 | F13-REQ-023 | extends `apps/mobile/src/lib/analytics/ask-sequencer.logic.test.ts`; `[NX-31-R6] reminder card is the only ask after the first kept letter` | D31-5 |
| NX-31-R7 | Dropped | none | none |
| NX-31-R8 | NX-03-R3; D-138 item 3 | mobile unit (proposed `apps/mobile/test/sign-in-first-screen.test.ts`); `[NX-31-R8] screen 2 has equal methods, no name or phone field, agree line above, no second age question` | D31-6 |
| NX-31-R9 | F02-REQ-006; 5.1.1(iii) | proposed `apps/mobile/test/apple-scopes.test.ts`; `[NX-31-R9] Apple request asks for email only` | D31-7 |
| NX-31-R10 | F02-REQ-019; NX-32 R4 | proposed `apps/mobile/test/sign-in-method-remembered.test.ts`; `[NX-31-R10] the method used is remembered and no confirmation screen is added` | D31-2 |
| NX-31-R11 | NX-02-R10 | proposed `apps/mobile/test/code-screen-recovery.test.ts`; `[NX-31-R11] after 60 seconds three recoveries are shown` | D31-8 |
| NX-31-R12 | F02-REQ-002 | device, 2 phones; `[NX-31-R12] new phone sign-in shows no child step` | D31-9 |
| NX-31-R13 | D-033; F08 | device, 2 phones; `[NX-31-R13] new phone says which recordings arrived` | D31-9 |
| NX-31-R14 | F17; F03 Never | proposed `apps/mobile/test/app-lock-offer-placement.test.ts`; `[NX-31-R14] no lock offer in first run; offered once in session 3` | D31-13 |
| NX-31-R15 | F03 section 3 | study, minutes in the QA report; Test: none, study (`user-research`) | D31-2, D31-3 |
| NX-31-R16 | CLAUDE.md content rules | proposed `packages/content/test/first-run-keys.test.ts`; `[NX-31-R16] first-run keys have no streak, count of gaps, fear or loss wording` | none |
| NX-31-R17 | Founder decision 9 Nov; F02 | mobile unit on the root gate (proposed `apps/mobile/test/sign-in-first-gate.test.ts`); `[NX-31-R17] no child, signature or Tonight screen is reachable without a session` | D31-1 |
| NX-31-R18 | F02-REQ-019 | mobile unit (proposed `apps/mobile/test/sign-in-outage.test.ts`); `[NX-31-R18] no answer in 10 seconds shows the outage screen and retries; the local start shows only when allowed` | D31-11 |
| NX-31-R19 | NX-02 offline | mobile unit (same file family); `[NX-31-R19] screen 2 offline says so and retries on reconnect` | D31-10 |
| NX-31-R20 | AUTH_SETUP 4.1 to 4.3; DOMAINS.md | script test (proposed `scripts/release/mail-readiness.test.mjs`); `[NX-31-R20] public preflight fails without DMARC policy, verified domain, rate limit and tracking off` | D31-15 |
| NX-31-R21 | D-033 | content test (proposed `packages/content/test/first-run-recording-line.test.ts`); `[NX-31-R21] the recording line matches the backup capability` | none |
| NX-31-R22 | F02-REQ-001, -007 | mobile unit (proposed `apps/mobile/test/ended-session-keeps-book.test.ts`); `[NX-31-R22] a phone with a book can read, record and export after its session ends` | D31-12 |
| NX-31-R23 | CLAUDE.md; #635 part 3 | extends the Maestro and web e2e flows; `[NX-31-R23] journeys pass sign-in through a test seam, never a flag in a store build` | none |
| NX-31-R24 | NX-05-R1, -R2; Apple 2.1(a) | review drill, no automated test; Notes check in `scripts/release/with-review-contact.ts` (NX-05-R1); `[NX-31-R24] Notes name the account-based features and the review path` | D31-14 |

Trace: NX-31-R2..R24 -> F01, F02-REQ-001, -002, -006, -007, -009, -010, -014, -019, F03-U02, -U07, -U11, -U12, F13-REQ-023, F17, LEGAL-REQ-012, D-025, D-033, D-054, D-124, D-138.

## 15. Founder-only decisions that remain (five), with a recommendation

Decided and not reopened here: account before the book opens; recordings of new customers back up free.

| # | Question | Options | Recommendation |
|---|---|---|---|
| 1 | When sign-in or the backend cannot be reached (outage, project paused, rate limit) or the phone is offline at first launch, may a new customer start a local book? | A: no, hold and retry. B: yes, only as an outage fallback, behind a signed switch, claimed into the account after consent | **B.** It is the cheapest insurance for a public launch, it strengthens the 5.1.1(v) explanation, and it costs one screen on top of the claim flow that exists. It is an exception to "account before the book opens", so it is his to allow |
| 2 | Is the sign-in requirement for starting a book on a phone with no book only, so that a phone that already has a book never loses reading, recording and export when a session ends? | Narrow (start only) / wide (the app is closed until signed in) | **Narrow.** It matches NX-02 (letters stay), the export promise and F02-REQ-007, and it avoids a lock-out when sign-in fails. Wide needs a different answer to a lost session |
| 3 | May the child's name stay empty at first run? (I found no D entry; the brief says it is on record. F03 section 4 and F03-U02 say required; `onboarding.childFallback` and F03-U07 allow it.) May the date also be skipped? | Name optional / required; date required / skippable | Name optional, date required (prompts, chapters and Before You depend on the date). Record it in `DECISIONS.md` |
| 4 | Move the Face ID lock offer off "The book is open." to the third session and Settings? | Keep as built in Build 11 / move | **Move.** Before a letter exists it asks the person to protect nothing, and it competes with the reminder card for the one ask per session. The HIG advice against an app-specific biometric opt-in is about account authentication, so the book lock may stay |
| 5 | Record the two 9 Nov statements as decision entries, and say what "free" covers: free backup for new customers only, for every customer, or while a storage allowance holds; and whether it is promised in the first-run lines only while the backup capability is on | The three scopes | Record both statements. Free backup for every customer on the Free plan (the principle "Plus adds, it never gates what exists", `02-benchmark.md` section 7, and the gap analysis G-1 in `15-core-capability-gaps.md`). Show the promise lines only while backup is actually on in the build (R21). Counsel then reads the registered lines. A cost line from `payments`/`ops` is missing (Supabase Storage cost is UNVERIFIED; DEPLOY.md says the Pro cost is not worked out) |

## 16. What the founder should test on his phone (one page)

Use a phone or simulator with no previous install (delete the app first). Judge the feeling, not the code. Write one word per step: smooth, slow, odd or stuck. Start a stopwatch at the first screen. Do the whole path twice: once with Apple, once with email (use a second address; for email, note when the mail arrives).

1. Open the app. Is the first question clear? Answer Yes, tick the box. Did the Terms and Privacy links come back to the same place?
2. The next screen: is it clear what the app is, and what you are being asked? Is the agreement line right above the buttons? Are Apple and email equal? Is there a password, name or phone number anywhere? (There must not be.)
3. Is there a way to say "I already have a book"? (There should be no separate button; the same buttons do it.)
4. Apple path: tap Continue with Apple. How many taps did the Apple sheet take? Did anything ask for your name? (It should not.)
5. Consent screen: read it. Tap Not now once on a spare run and check the book still opens.
6. Child: leave the name empty, pick a birthday, Continue. (After R3 it goes through; today it may ask for a name. Write which.)
7. Signature: one chip, Continue. Speech: Not now.
8. "The book is open.": does it tell you your recordings are kept safe? Is that line true in this build (is backup on)? If backup is off and it says so anyway, stop and report. Is there a lock card here? Did you want it here?
9. Tonight, Speak. Did the microphone question come only now? Talk for 20 seconds, read the words back, Keep. Stop the stopwatch. Write the number. (Proposed target: about 150 s on the Apple path, about 240 s on the email path.)
10. The reminder card. Tap No reminders. Did any system pop-up appear? (None.) Quit the app.
11. Reopen. Is the book as you left it, and are you still signed in?
12. Email path, on a second run: type the address. Look for the mail. If it takes over a minute, what does the screen offer? Does the mail land in the inbox or in spam? Type the code and note how long the whole sign-in took.
13. Quit the app at the code screen, then again right after sign-in and before the child step. Reopen each time. Where does it put you?
14. Airplane mode on before opening a fresh install. Does screen 1 work? What does screen 2 say? Turn the connection back on: does it carry on by itself?
15. Outage: ask the engineer to point the app at an unreachable project (or block the network after screen 1). After about 10 seconds, what do you see? Is there a retry? If option B is on, is there a way to start on this phone, and is it clearly an exception?
16. Second phone (or delete and reinstall): open, answer Yes, sign in the same way. Did it ask for the child again (it must not)? Did the recordings come, or does the screen say they did not?
17. Sign out in Settings, relaunch. Can you still read your letters?
18. Count the screens and taps from install to the first kept letter. Which step would you remove? Write it down.

Stop and note anything that made you want to give up.

## 17. Conflicts with other work

1. **PR #635 and its split plan (NX-03).** No change needed to merge #635. Flow after Continue is now screen 2. Two agreement moments exist (screen 1 box, screen 2 line); keep one of each. Part 3 of the split changes the seeds and web journeys; R23 adds the sign-in seam for the same journeys. The split plan's note that the boot gate order (Welcome versus screen 1) stays as on `develop` still holds.
2. **Build 12 lane.** Servers-on public build with passwordless sign-in. R17 to R20 cannot be proven until a hosted project, the Apple key and Resend SMTP exist (S-52 failed on 8 Nov). The Build 12 gap map lists the demo-account path as not designed (1.1); NX-05 owns it and R24 depends on it. The Build 12 decision entry is still not written.
3. **F03-U02, F03-U12, F03 section 3, F02 sections 4 and 6.1, NX-02 decline wording, NX-03 sign-in-buttons sentence, `onboarding.promise.recordingBody`**: section 6.6. `product` edits the specs only after the founder answers.
4. **NX-32 and NX-30:** cited in 6.6, not edited.
5. **Build 11 (#640)** shows the lock card at "The book is open."; R14.
6. **The two DMARC plans disagree with each other and with the live record** (R20).

## 18. Not verified

Whether `onboarding.tsx`, the local `children` table or `create_first_run_children` accept an empty name. Which scopes `apple.ts` requests. Whether `authCopy.consent.age` still shows after Before you begin. What PR #689 does to the languages step (title only). Whether #685 concerns the production plan (title only). How an App Review reviewer will treat sign-in-first for this app; the Apple page was read through a fetch tool that summarises and covered 100,000 of 121,490 characters. Whether Resend's domain shows Verified and whether SMTP is set in any Supabase project. Whether mail passes DMARC at Gmail, Outlook, iCloud and an Apple relay. The cost of free recording backup. Any conversion figure for sign-in-first versus sign-in-after-value. The two founder statements of 9 Nov are relayed by the coordinator and are not yet on record in `DECISIONS.md`.
