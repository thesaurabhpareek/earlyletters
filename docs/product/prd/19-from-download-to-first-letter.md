# NS-38 to NS-45: from App Store download to the first kept letter

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: `product` (PM role, with the CPO role) | Replaces: none | Load when: building or testing sign-up, consent, first letter or account life (NS-38 to NS-45).

Status detail: LOCKED rev 2, 20 Nov 2026, inside the lock (PR #934); open items stay founder or counsel items with their defaults. Changes after lock need a PR that lists every changed id. Release: these eight cards ship together as Drop D, after wave 1 and Drop A and before any family outside the founder's signs in (E43; the drop table is in `21-days-cultural-photos-home.md` "Release line and cut").

Author: `product` (PM role, with the CPO role; a Claude session, not a scheduled `product` run), for Karma (CTO). Backlog row: see section 22. Docs only: nothing here is built by this file, no string is live, no decision is recorded in `DECISIONS.md`. Founder request of 20 Nov 2026 (relayed by Karma): the PRD covers everything from app download and the first interaction through sign-up and sign-in, risk checks, required validation, information collection and verification, so design can draw the whole path end to end.

Why this file exists. The locked pack (`00` to `12`, NS-01 to NS-37) treats first run, sign-in and Plus as built and only "cites" them (`07-remaining-capability-rows.md` rows C25, C44, C45, C46). Area E design drew the path anyway (`docs/design/e2e/E-foundations-and-system-states/DESIGN.md` and `WORDS.md` section 5.14, worktree `/home/claude/wt/E`) and listed what no card answers (WORDS section 10, CG1 to CG14; DESIGN section 10, K-E01 to K-E09). These cards answer them. Where this file and an older source differ, this file says which wins and why.

Read with: `README.md` (locked card shape), `00-product-frame.md`, `16-council-review-round-2.md` (T1 to T5, D1 to D13), `18-errata-after-lock.md`, `GAP-LOG.md` (rulings on NS-38 onward land directly in this file), NS-10 in `08-keeping-and-trust.md` (new phone; cited, not repeated), NS-33 to NS-35 in `11-foundations.md`.

Conventions (as `08` to `11`):
- Code facts were read on `docs/locked-pack-inputs-20nov` (head `7d0446d02`) in the files named, this session. Nothing was run on a phone or a simulator. `file:line` cites are to that head.
- Words in quotes that are not an existing `packages/content` key are intent for `content`, never final copy. Numbers marked PROPOSED are proposals. UNVERIFIED marks anything not read in code or a source this session. Every legal reading: counsel must confirm (counsel packet 1.5.0 numbers). None of this is legal advice.
- Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Test titles use `[NS-xx-Rn]`. `scripts/trace.mjs` does not yet read NS ids (r3 F1, gate G0), so no card claims trace coverage.
- Timing: cards state order and gates only (ruling T5).
- Rulings D1 (sign-out keeps the book), D2 (writing tools off on letter fields), D3 (no system-intelligence donation), D6 (account deleted before a seal opens deletes the seal), D13 (device evidence on the Asha-only install), T2 (free stays free) apply to every card here as they do in `08`.
- Screen ids `E-Snn` and state ids `E-Snn.<state>` are area E's (DESIGN section 4). Content keys are WORDS keys (REUSE or PROPOSED there). Area C owns C-S02, C-S03, C-S10, C-S11, C-S12, C-S19, C-S20; area A owns A-S01 to A-S13.
- Two inputs were commissioned in parallel: `docs/product/prd/inputs/first-run-compliance.md` (`regulatory-affairs`) and `docs/product/prd/inputs/first-run-auth-security.md` (`security`). How each was folded in is in section "Inputs folded" at the end.

## The path, step by step, and which card owns it

This re-keys WORDS section 5.14's steps to card ids (answers CG9).

| Step (WORDS 5.14) | What the person does | Screen and state | Card |
|---|---|---|---|
| 1 | Finds the app, reads the page, taps Get | App Store (Apple's) | NS-38 |
| 2 | Opens the app the first time | E-S01.default | NS-39 |
| 4, 4a, 4b | Answers "Are you 18 or older?", ticks the agreement | E-S03.default, reason-noAnswer, reason-noTick, stop | NS-40 (age), NS-42 (the box) |
| 3 | Reads the Welcome | E-S02.default (servers on: the sign-in Welcome) | NS-39 (the screen), NS-42 (the agree line) |
| 4c | (Region) | no screen on the phone; a server refusal at sign-up | NS-40 |
| 5 to 5c | Chooses Apple or email; Apple closed, failed, offline | E-S04, E-S14 | NS-41 |
| 6 to 6e | Types an email | E-S05 | NS-41 |
| 7 to 7i | Types the code or taps the link | E-S06 | NS-41 |
| 8 to 8d | Setting up, Terms, sensitive data, claim | E-S07, E-S24 | NS-42 (records), NS-41 (claim as a sign-in outcome) |
| 9 | Returning account | E-S09 alias of C-S10, C-S11 | NS-41 (routing), NS-10 (cited) |
| 10, 10a | Who is this book for, the date, what the child calls you, the promise, "The book is open." | E-S08.* | NS-43 |
| (in 10) | The speech download ask on "The book is open." | E-S08.open | NS-39 (the rule), NS-43 (the place) |
| 11 to 15 | Home, microphone primer, recording, Review, first kept letter | A-S01, A-S04, A-S05, A-S07, A-S13 | NS-44 |
| after | Third Keep, plan lapse | E-S10, E-S26 | NS-44 |
| after | Sign out, delete, session ends, app update | C-S03, C-S20, E-S16 | NS-45 |

Order on a fresh install of a store build (servers on), as built: E-S01, E-S03 (age and agreement box), E-S02 (Welcome with Sign in with Apple and Sign in with email), E-S04 or E-S05 and E-S06, E-S07 (Setting up, Terms, sensitive data), E-S24 only if this phone already holds letters, E-S08 (new account) or C-S10 (account with a book), then Home. The age question comes before the Welcome because the root layout renders no route until it passes (`apps/mobile/src/app/_layout.tsx:214-217`); D-043's "welcome, then the gate" is superseded by the built order and PRD-REQ-019 (F01 Q1 default).

### Why eight cards, and no merge

Each of the eight has its own state space and its own owner screens. Two near-merges were considered and rejected:
- NS-40 and NS-42 share one screen (E-S03 holds the age question and the agreement box). They stay apart because they record different things under different rules: the age answer is never stored beyond a boolean (D-026), while the agreement is a PRIV-R21 record. One card would blur "never stored" with "always recorded".
- NS-41 and NS-42 share E-S07. Sign-in proves who the person is; NS-42 records what they agreed to. The consent sheet's Records and Decline lines are NS-42's; its errors (`consent_unavailable`) are listed in both and owned by NS-42.
No split was needed: NS-41 is the largest, but its rows are one flow with one machine (`lib/auth/machine.logic.ts`).

---

## NS-38. The App Store page and install (candidate: none; cited row C45)

### 1. Who and when
P1 or P3 at night, often after a friend's mention or a search; also P2 later. Before any code of ours runs. Ends when the person taps the app icon for the first time (NS-39).

### 2. Why
The page is the first promise. Every sentence on it must be true of the build Apple reviews (frame section 7, F21 outcome), the age rating must match the 18+ product (D-006), and the person must learn before download that the app asks for an account (D-160) and holds a paid step after two letters (D-082), so nothing after install feels like a trick. Evidence: [F] F21 sections 4 and 7; D-139; D-160.

### 3. What, and Not in scope
**What.** The listing fields and their sources; the age rating; availability; the App Privacy answers; the Notes for Review with the demo path; what the install puts on the phone (nothing but the binary); what a reinstall, an offloaded app and a restored phone find at first launch.
**Not in scope.** Store screenshots' art direction (design). Pricing (App Store Connect and `packages/content/src/pricing.ts`). The website (F21). Search ads (none).

### 4. Happy path
1. The person reads the page: name `brand.storeName` ("Early Letters: Baby Journal", `packages/brand/index.ts:83`), subtitle (`:85`), description and captions from `packages/content/src/store.en.ts`, six screenshots from the release build with the Asha book only (F21-REQ-008), age rating 18+, in-app purchases listed by Apple.
2. They tap Get; iOS downloads under 40 MB (D-065). Nothing of ours runs.
3. The icon appears. Next: NS-39.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A child's Apple Account with Screen Time limits | Apple's store hides or blocks the app by its 18+ rating. Ours is not involved; NS-40 is the second line |
| Outside the United States storefront | The app is not offered (availability United States only, F21-REQ-005). No in-app region screen (NS-40) |
| Reinstall on the same phone | iOS keeps Keychain items across delete and reinstall (code comment in `erase-everything.ts`; on a device UNVERIFIED). The local database is gone. A kept session then meets "Opening your book" (NS-41, NS-10), never the child step; the free-letter ledger, kept in the Keychain (`lib/billing/letter-ledger.keychain.ts:1-14`), still counts. The age answer is gone (settings table), so the age question is asked again |
| Offloaded app (iOS "Offload Unused Apps") | Documents and the database stay; first launch after re-download is a normal launch (NS-39) |
| New phone restored from an iCloud device backup | The database and recordings come back; the session does not (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`). The phone opens on Home with the book, signed out, with sign-in offered and never required (`gate.logic.ts:123-125`) |
| iOS below 17 | Apple's store offers no install (floor iOS 17, D-040) |
| Not enough space to install | Apple's message; nothing of ours |
| Review build: App Review cannot pass sign-in | The Notes for Review give the demo path (`packages/content/src/release/app-review.en.ts:32-38`) and say to answer Yes at the age question (F21-U06) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card is the first use |
| Empty, normal, many | n/a because nothing of ours runs before first launch |
| Offline | The store needs a connection; nothing of ours |
| Slow | Apple's download progress |
| Failed | Apple's; nothing of ours to recover |
| Interrupted, killed mid-flow, updated mid-flow | n/a because no code of ours runs; an update installed before first launch is just a newer first launch |
| Low storage | Apple's message; our download stays under 40 MB (D-065) |
| Low Power Mode | n/a |
| Kill switch `serverFeaturesEnabled()` off | The listing must describe the build's state (F21-REQ-003): with servers off, no "sync", "account" or "sign in" sentence; with servers on, no "no account needed" sentence |
| Outage | n/a |
| Plan lapsed | n/a |
| Signed out | n/a |
| Second account on the same phone | n/a; first launch decides (NS-41) |
| New phone | Restore row in section 5 |
| Two books, two parents, expecting | The listing must not promise co-parent sharing in a store build (D-161, D-162) |
| VoiceOver, AX5 plus Bold Text on SE 3 | Apple's page; our captions are text, never words baked into a picture without the same words in the description (PROPOSED) |
| Devanagari, RTL | The listing names only languages the build transcribes (F21-REQ-004, F21-REQ-032) |
| Every error code | none of ours |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-38-R1 | Given the App Store Connect record before submission, Then the age rating is 18+ (override), availability is the United States only, category Lifestyle, and both subscriptions are attached with Family Sharing on; a dated screenshot of each is in the release evidence | P0 (b) | `[NS-38-R1] store record set before submission` (release checklist) |
| NS-38-R2 | Given `store.en.ts` and the build's `serverFeaturesEnabled()`, When the rules test runs, Then no listing sentence says or implies "no account", "no sign-up", "no login", co-parent sharing, recording backup, or a language the build does not transcribe | P0 (a)(b) | `[NS-38-R2] the listing describes the build` |
| NS-38-R3 | Given the listing and the store name, Then the name equals `brand.storeName` and no other file types it (D-076) | P0 (b) | `[NS-38-R3] store name from brand` |
| NS-38-R4 | Given the App Privacy answers, Then they declare what the submitted build collects as listed in NS-40 to NS-45 "Information collected" (email, user id, the child's name and dates once synced, letters' words once synced, purchase status on the phone only), no tracking, and no data linked for advertising; the label PR changes in the same build as the behaviour (frame section 7) | P0 (b) | `[NS-38-R4] privacy label matches the build` |
| NS-38-R5 | Given the Notes for Review, Then they name the reason the app asks for an account (letters' words follow the parent to a new phone), the demo sign-in path, the 18+ answer, the two free letters then Plus at Keep, and that nothing else is ever gated; they never say "no account is needed" (F21-REQ-031) | P0 (b) | `[NS-38-R5] review notes match the build` |
| NS-38-R6 | Given the release candidate, Then the install size is under 40 MB and no speech model is in the bundle (D-065) | P1 | `[NS-38-R6] download under 40 MB` (NS-34 sheet) |
| NS-38-R7 | Given screenshots, Then each comes from the release build with the Asha book only and shows no co-parent, backup or other-language surface the build does not ship | P0 (a)(b) | `[NS-38-R7] screenshots from the release build` |
| NS-38-R8 | Given a phone restored from an iCloud device backup, When the app opens, Then Home shows the restored book signed out, sign-in is offered and never required, and no letter is duplicated after sign-in (NS-10-R6) | P0 (a) | `[NS-38-R8] restored phone opens the book signed out` (device) |
| NS-38-R9 | Given the export compliance answer in App Store Connect, Then it matches counsel packet Q24 and the encryption self-classification on record | P0 (b) | `[NS-38-R9] export compliance answered` (release checklist) |

### 8. Non-functional budgets
- Latency: n/a (Apple's). Install size under 40 MB (D-065, measured each release).
- Memory, on-device storage, battery: n/a before first launch.
- Offline: n/a.
- Accessibility: captions as text; no claim "accessible to everyone" or "works with VoiceOver" until NS-33's walk passes (NS-33 Claims).
- Localisation: English listing (D-056 UI English).
- Privacy (log canary): n/a.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch: `serverFeaturesEnabled()` off in the submitted build | Listing has no account, sync or sign-in sentence | `[NS-38-R2]` |
| Card's remote pause | n/a because a listing cannot be paused by remote config; a listing change is a new App Store Connect submission | n/a |
| Plan lapse | n/a | n/a |
| Second account on the same phone | n/a | n/a |
| Reinstall with a kept session | Opening your book, never the child step | `[NS-41-R14]` |

### 10. Data and engineering
- Fields: none on the phone. App Store Connect fields are founder steps.
- Migrations, sync field group, export: none.
- Modules: `packages/brand/index.ts`, `packages/content/src/store.en.ts`, `packages/content/src/release/app-review.en.ts`, `packages/content/test/rules.test.ts`.
- Flags and pause keys: none.
- Error codes: none.
- Rollout and rollback: a listing change ships with an App Store submission; rollback is a new submission.

**Built today.**
- Store name and subtitle from brand (`packages/brand/index.ts:83-85`): built. F21-REQ-001 still names "Memory Book"; D-139 wins. Backlog need: F21 text drift (doc-only row for `content`).
- Review notes say "a link and a 6-digit code" (`app-review.en.ts:32`). If NS-41's code length changes (open item O-6), this line changes in the same PR.
- `app-review.en.ts:4` still cites D-160's "coming soon" half; D-161 supersedes it (DESIGN section 8 item 5). Backlog need: `content` updates the note.
- Age rating, availability, privacy answers, export compliance: founder steps in App Store Connect, not verifiable from the repo (F21-REQ-005, FT-43, BL-286).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| none | We collect nothing at the store or at install. Apple's download and sales reports are aggregates we read in App Store Connect | n/a | n/a | n/a | Apple | Apple's | n/a |

### 12. Door lines
n/a because the person agrees to nothing of ours on the store page. Apple's terms are Apple's.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Trust | The listing promises what the build does not do | Rules test per build state; claims inventory rows | `[NS-38-R2]` |
| Minors | A child downloads the app | 18+ rating (Apple's control), then NS-40 | `[NS-38-R1]`, `[NS-40-R1]` |

Risk checks (what we check, when, and what a fail does):

| Check | When | Who | On fail |
|---|---|---|---|
| Age rating 18+ and US-only availability set | Before each submission | founder, CCO reads the evidence | Submission held |
| Listing claims against the build state | Every PR touching `store.en.ts`; before submission | rules test; CCO | Test red; claim removed |
| Apple guideline and state-law facts re-read from source | Before each submission (Compliance standing rule, 16 section 6) | CCO, `regulatory-affairs` | Submission held until the card is updated |

### 14. Never
- Never a sentence that says or implies "no account needed" while sign-in is required (D-160).
- Never "free forever", "never limited", "always free" (T1, principle 6).
- Ruling D3: n/a because no letter text exists yet. Ruling D2: n/a because no text field.

### 15. Design inputs
No E screen. Design owns the screenshot frames: Asha only, no co-parent, no backup, no other-language letters unless the build transcribes them.

### 16. Content inputs
`store.en.ts` fields (REUSE). Content checks the listing never names sign-in as optional and names the account's reason as "your letters' words come with you to a new phone" (intent; the same truth as `trust.signIn.why`'s proposed replacement, CG4). `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Age rating and minors: counsel packet Q45 (children) and the state age-assurance questions (F01 Q3, Q4; see NS-40). Export compliance: Q24. Claims: Q43. Apple guideline 5.1.1(v) (account deletion) and 2.3.1 (accurate metadata) re-read before submission. Counsel must confirm.

### 18. Label effect
**Label effect.** This card is where the label is checked (`[NS-38-R4]`); it adds no data of its own.

### 19. Claims
Enables: "Talk for a minute, or type a few lines." (listing intent, already registered on the Welcome). Forbids: "no account needed", "your book is backed up", "share with your family" (store build), "accessible to everyone", "instant".

### 20. Free or Plus
Free to download. The listing may state the two free letters and Plus at Keep, as the Welcome does (`billingCopy.membership.line`). T2 applies.

### 21. Measures with analytics off
App Store Connect: first-time downloads and product page conversion (Apple aggregates). Paid starts over first-time downloads by install week (frame section 3). No tester question.

### 22. Dependencies and gates
F21-REQ-001 to F21-REQ-010; BL-340 screenshots; founder steps in App Store Connect; the NS-33 walk before any accessibility claim; counsel Q24.

### 23. Open questions
- Should the listing say sign-in is needed? Owner: CMO role with `content`. Default: yes, one plain sentence in the description ("You sign in with Apple or your email, so your letters' words come with you to a new phone."), because a person who meets a required sign-in with no warning reads it as a trick and App Review reads metadata against behaviour (2.3.1). Open item O-1.

---

## NS-39. First launch and the first interaction (candidate: none; cited rows C44, C46)

### 1. Who and when
P1 or P3, seconds after install, often with a sleeping baby nearby; also a person reopening after a kill. From the icon tap to the first tappable choice, and the standing rules for downloads and permissions that apply through NS-40 to NS-44.

### 2. Why
The first second decides whether the app feels calm or broken. Three rules carry the trust: the first screen never waits on the network (A-REQ-002), nothing is downloaded without a tap (D-087), and the phone asks for a permission only at the moment it is needed, after our own one-line reason (LEGAL-REQ-007, F03-REQ-007). Evidence: [F] F01 sections 1 and 7; `speech-consent-card.tsx:1-17`; `listen.tsx:261-266`.

### 3. What, and Not in scope
**What.** Cold start (E-S01), the session read, launch recovery, the Welcome (E-S02), first-run offline and outage (E-S14), the speech model download rule, the permission timing rule for the whole path, the lock offer's place.
**Not in scope.** The age question (NS-40). Sign-in (NS-41). Story cards: parked (frame rank 46, C-34); none ship and no flag shows them. Analytics: off for the 1.0 line (D-124).

### 4. Happy path
1. Tap the icon. iOS shows the launch screen on paper with no words (A-REQ-001). The app reads local settings and the Keychain session without the network; the first interactive frame lands p50 1.2 s on an SE 3 (NS-34).
2. No answer to the age question on this install: E-S03 (NS-40).
3. After Yes and the ticked box, store build: the Welcome (E-S02.default, built as `components/onboarding/welcome-sign-in.tsx:128-148`): lockup, descriptor (heading), body, `authCopy.sheet.bodies.sign_in_first`, then the footer: the agreement line with its two links (`:57-58`), Sign in with Apple, Sign in with email (`:66`), and the last-method line on a returning phone (`:70-71`). No Plus line, price or trial (the servers-on Welcome does not render `billingCopy.membership.line`; WORDS 5.2 lists it there, which the code does not do; this card keeps it off, NS-44). Focus lands on the heading.
4. The person chooses a way to sign in (NS-41).
5. On "The book is open." (E-S08.open) one quiet card asks once about the speech download: "Download on Wi-Fi" or "Not now" (`SpeechConsentCard`, `app/onboarding.tsx:573-576`). Nothing downloads before the tap.
6. Home. The first permission the person may meet is the microphone, after our primer, on their first tap of Speak (NS-44).

### 5. Unhappy paths and edge cases

| Case | What the person sees |
|---|---|
| Offline at first launch | E-S01 and E-S03 work as normal. After the age answer the gate reads offline and shows E-S14.offline ("Sign-in needs a connection." with Try again, and "Start on this phone" with its note, because `LOCAL_START_FALLBACK` is on, `gate.logic.ts:39`). When the connection returns, "You are back online." is announced and the Welcome shows by itself |
| Sign-in service down at first launch | E-S14.outage after a failure or the 10 s wait (`SIGN_IN_OUTAGE_MS`, `gate.logic.ts:42`), with Try again and Start on this phone |
| Keychain read slow | The Welcome waits blank up to 10 s (`RESTORE_WAIT_MS`, `gate.logic.ts:48`), then shows; a session that arrives later still replaces it |
| Database will not open, or a migration fails | E-S01.recovery: "The book could not open" with Try again and Export what's readable. No action deletes data |
| A screen throws | E-S13 "This page did not open" with Try again and Go to Home; on a fresh install with no book the body is `en.errors.crash.bodyNoBook` "Try again, or go back to Home." (PROPOSED), because "Your letters and recordings are safe on this phone." is not true when there are none (answers K-E06) |
| Link opened before the age question (invite or email link) | The link is held until Yes (auth link in memory only; invite token in the Keychain), discarded after No (F01-U06, U07, U08). In a store build an invite link goes Home and the token is not kept (D-162) |
| Speech download on cellular | Waits for Wi-Fi (pack engine rule); the card says so in words |
| Not enough space for the speech model | The card says how much space it needs and offers no button; typing works; a recording made now waits for its words (`speech-consent-card.tsx:4-6`) |
| Speech download stops | "The download stopped." with Try again; "Your voice is kept either way." |
| `packDownloads` paused remotely | The pack row says downloads are paused (`packsCopy.failures.downloads_paused`); recording still works |
| A notification, widget or Siri doorway before first run is done | None exist yet: they are created after first run (F01 6.1) |
| Lock on and a cold start | The lock cover shows over every route; the age question is not behind it (`_layout.tsx:243`) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card |
| Empty | No book: the path continues to NS-40 to NS-43 |
| Many (1,000 letters, 300 pictures) | Returning launch: cold start budget holds (NS-34, NS-37) |
| Offline | Section 5 first row; capture never waits on a network |
| Slow | Still launch mark after 350 ms (waiting states do not breathe, ruling 31, E68; the lamp is the one ambient exception), no count; held screens at 10 s (DESIGN rule 5) |
| Failed | E-S01.recovery; E-S14.outage |
| Interrupted (call, Siri, alarm, the baby) | No audio session is active before Listen; the same screen on return |
| App killed mid-flow | Relaunch returns to the first unanswered step: age question if unanswered, Welcome if no session, consent sheet if consent is outstanding (NS-42), child step inputs are lost (under 60 s of typing; F03-U12) |
| App updated mid-flow | Same as killed; local migrations run behind E-S01 |
| Low storage (under 1 GB, under 50 MB) | First run writes a few settings rows and never warns; the speech card names the space it needs |
| Low Power Mode | The lamp's breathing stops (NS-34-R8); nothing else changes |
| Kill switch `serverFeaturesEnabled()` off | E-S02.serversOff: "Begin the book" only, no sign-in door; the first-run gate is a no-op (`gate.logic.ts:110`) |
| Outage | E-S14.outage with the local start |
| Plan lapsed | n/a on a fresh install; a returning lapsed phone opens Home (E-S26) |
| Signed out | A phone with a book and no session opens Home; sign-in is offered, never required (`gate.logic.ts:123-125`) |
| Second account on the same phone | First launch with A's book and no session opens A's book (D1). See NS-41 for B |
| New phone | NS-41 routes to C-S10 (NS-10) |
| Two books, two parents, expecting | n/a at launch |
| Devanagari, RTL | UI English (D-056); the language row only in multi-language builds (NS-43) |
| AX5 plus Bold Text on SE 3 | Welcome: lockup at its small cut, words scroll, the two sign-in buttons pinned and stacked; E-S14 drawing hides above AX2 |
| VoiceOver | Focus to the Welcome heading; order lockup, heading, body, line, agreement, links, Apple, email |
| Voice Control, Switch Control | Visible labels are the names; no gesture-only action |
| Reduce Motion | Lamp still; cross-fades only |
| Dark mode, Increase Contrast, Smart Invert | Tokens; the lockup ignores invert (NS-33-R11, gap G-E11) |
| Every error code | `provider` (inline on E-S02), and the outage set `network`, `rate_limited`, `email_wait`, `not_available`, `unknown` route to E-S14 (`gate.logic.ts:164`); launch fault to E-S01.recovery; `GlobalErrorCode` to E-S13; pack failures `PackFailure.*` on the speech card |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-39-R1 | Given airplane mode and a fresh install, When the app cold starts, Then the age question is interactive and no network request was attempted before it | P0 (c) | `[NS-39-R1] first launch never waits on the network` |
| NS-39-R2 | Given a fresh install through "The book is open.", Then no OS permission prompt appeared (microphone, notifications, Face ID, photos, tracking, contacts, location) | P0 (b) | `[NS-39-R2] no permission prompt in first run` |
| NS-39-R3 | Given the speech card, Then no speech model byte is requested until the person taps "Download on Wi-Fi", and "Not now" starts nothing | P0 (a) | `[NS-39-R3] nothing downloads without a tap` |
| NS-39-R4 | Given the person chose Not now or the download has not finished, When they record a letter, Then the recording is kept and waits for its words; nothing is lost | P0 (a)(c) | `[NS-39-R4] a recording waits for its words` |
| NS-39-R5 | Given offline after the age answer on a store build, Then E-S14.offline shows within 1 s with Try again and Start on this phone, and the Welcome returns by itself when the connection does | P0 (c) | `[NS-39-R5] offline first launch has a way forward` |
| NS-39-R6 | Given `serverFeaturesEnabled()` off, Then the Welcome shows "Begin the book" only and no sign-in, account or co-parent door appears anywhere in first run | P0 (a)(b) | `[NS-39-R6] servers-off first run has no sign-in` |
| NS-39-R7 | Given the cold start on an SE 3, Then the first interactive frame is p50 1.2 s, p90 2.0 s | P1 | `[NS-39-R7] cold start budget` (NS-34 sheet) |
| NS-39-R8 | Given the Keychain read does not settle, Then the first screen is blank no longer than 10 s and then shows the Welcome | P1 | `[NS-39-R8] restore wait is capped` |
| NS-39-R9 | Given "The book is open.", Then no app lock offer is shown (NX-31-R14); the lock is offered only from Settings, App lock, until the session-3 card exists | P1 | `[NS-39-R9] no lock offer at the end of first run` |
| NS-39-R10 | Given the microphone was never asked, When the person first taps Speak, Then our primer shows before iOS asks, and Continue on the primer is the only path to the iOS prompt | P0 (b) | `[NS-39-R10] microphone primer before the system prompt` |
| NS-39-R11 | Given the database cannot open at launch, Then E-S01.recovery shows with Try again and Export what's readable, and neither action deletes a file or row | P0 (a) | `[NS-39-R11] launch recovery never deletes` |
| NS-39-R12 | Given a store build, Then the first-run path shows no story card, no "coming soon" line and no Plus price, trial or button | P0 (a) | `[NS-39-R12] first run shows no teaser and no price` |
| NS-39-R13 | Given the speech card on cellular only, Then the download waits for Wi-Fi and the card says so in words, never as 0% | P1 | `[NS-39-R13] speech download waits for Wi-Fi in words` |
| NS-39-R14 | Given an invite or email link opened before the age answer, When the answer is No, Then the held token is deleted and no request was made | P0 (b) | `[NS-39-R14] a No discards a held link` |

### 8. Non-functional budgets
- Latency: first interactive frame p50 1.2 s, p90 2.0 s on SE 3; age answer to Welcome interactive p95 300 ms (F01 section 9); held screens at 10 s.
- Memory: idle after first run under 150 MB resident (06-nfr, NS-34).
- On-device storage: first run writes settings rows only; the speech model is a separate download, sized by the model plan.
- Battery: n/a in first run.
- Offline: everything before sign-in works offline; sign-in has its own offline screen.
- Accessibility: AX5 on SE 3 per E-S02, E-S14; NS-33 rows.
- Localisation: English UI.
- Privacy (log canary): no email, name or token in any log or breadcrumb during first launch (A-NFR-012).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch: `serverFeaturesEnabled()` off | Servers-off Welcome, local first run | `[NS-39-R6]` |
| Card's remote pause: `killSwitches.packDownloads` | The speech card says downloads are paused; recording works | `[NS-39-R4]` |
| `killSwitches.serverContent` | Packaged words used | existing tests |
| Plan lapse | n/a in first run | n/a |
| Second account on the same phone | Launch opens the phone's book for no session (D1); NS-41 owns B | `[X4-R1]` |
| Offline, outage | E-S14 | `[NS-39-R5]` |
| Killed, updated | First unanswered step | `[NS-43-R9]` |

### 10. Data and engineering
- Fields: settings `speech.downloadChoice` (existing, `lib/models/speech-consent`), none new.
- Migrations: none. Sync field group: none. Export: none.
- Modules: `app/_layout.tsx`, `lib/first-run/gate.logic.ts`, `use-first-run-route.ts`, `components/onboarding/welcome-sign-in.tsx`, `outage-screen.tsx`, `components/speech/speech-consent-card.tsx`, `components/resilience/launch-recovery.tsx`, `app/listen.tsx` (primer).
- Flags: `serverFeaturesEnabled()`; `LOCAL_START_FALLBACK` (compiled constant; never remote, D-066, D-068). Remote pause: `killSwitches.packDownloads`.
- Error codes: as section 6 last row.
- Rollout and rollback: ships on; revert.

**Built today.**
- Root gate order (age before any route): `_layout.tsx:214-217`. Built.
- Offline and outage with the local start: `gate.logic.ts:39-48`, `:132-138`; `outage-screen.tsx:34-36`. Built.
- Speech ask once, nothing before a tap: `onboarding.tsx:573-576`, `speech-consent-card.tsx:1-17`. Built.
- Microphone primer before the iOS prompt: `listen.tsx:261-266`. Built. Purpose string `lib/permission-copy.ts:12-20`.
- Lock offer still at the end of first run: `onboarding.tsx:577-579` mounts `<LockOffer />`. Differs from NX-31-R14 and `[NS-39-R9]`. Backlog need: remove it (the journey spec's proposed BL-917, never filed; file under a new id from `next-id.mjs`).
- No story cards mounted: built as required (stories parked).
- `lib/capabilities.ts:6-10` says the store profiles keep server features off until R-17; `apps/mobile/eas.json` `production` sets `EXPO_PUBLIC_SERVER_FEATURES: on` (D-157), and only `testflight` is off. The header is stale (the auth-security input repeats it in its scope note). Backlog need: fix the comment, docs only.
- WORDS 5.2 puts `billingCopy.membership.line` on the servers-on Welcome; the built `welcome-sign-in.tsx` does not render it. The card follows the code (no Plus line in first run). Hand-off to area E content lead.

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Speech download choice | Remember the one ask so it is not asked again | Optional (no answer is "not asked") | one of the choice values | L2 | Phone settings | Until Erase everything or uninstall | No |
| Last sign-in method name (returning phone) | "Last time you used {method}" | Set by the app | `apple` or `email` | L2 | Phone settings | Install | No |
| Nothing else | First launch collects no name, email, date or device id | n/a | n/a | n/a | n/a | n/a | n/a |

Settings are not agreements: "Records: on the phone only; no PRIV-R21 row, because this is a setting, not an agreement."

### 12. Door lines
The Welcome's agreement line is NS-42's door. The speech download: **Shown:** the card's title, size line and two buttons. **Records:** the choice, on the phone only (a setting). **Never:** a download before the tap; a size typed by hand. **Decline:** Not now; Review offers the same button later; recording and typing are unaffected.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Phone data plan and storage | A large model downloads unasked | One tap, Wi-Fi only, space check | `[NS-39-R3]`, `[NS-39-R13]` |
| Speech model integrity | A swapped model file | Signed manifest from the pack host (D-115, D-046) | existing pack tests |
| A held link | Replayed after a No | Deleted on No | `[NS-39-R14]` |

Risk checks:

| Check | When | On fail |
|---|---|---|
| Network reachable (expo-network; unknown counts as online) | After the age answer, before sign-in | E-S14.offline |
| Sign-in reachable within 10 s | On the first sign-in attempt | E-S14.outage |
| Free space for the speech model | When the card renders | Card names the space; no button |
| Pack manifest signature | Before any download | Download refused; card says it stopped |

### 14. Never
- Never a permission prompt in first run; never "Allow tracking" (ATT is never asked: no tracking).
- Never a download without a tap; never a spinner with a count on launch.
- Ruling D3: n/a because no letter exists yet. Ruling D2: n/a because no letter field on these screens.

### 15. Design inputs
E-S01 (default, migrating, recovery and its sub-states), E-S02 (default, serversOff, restoring, error-provider), E-S14 (outage, outage-withLocal, offline, offline-withLocal, backOnline), E-S08.open (the speech card's states: ask, downloading, waiting for Wi-Fi, needs space, stopped, done). AX5 on SE 3: E-S02 buttons pinned and stacked; E-S14 drawing hidden above AX2; speech card buttons stacked. Components: PlainScreen, StateScreen (with the `note` slot, G-E07), the speech card as built.

### 16. Content inputs
REUSE: `en.onboarding.welcome.*`, `authCopy.sheet.bodies.sign_in_first`, `authCopy.sheet.agreeLine`, `authCopy.sheet.lastMethod.*`, `authCopy.offline.*`, `authCopy.outage.*` (titles lose their full stop: WORDS section 9 change), `speechConsentCopy.*`, `en.errors.launch.*`, `listen.primer.*`. `sign_in_first` still needs founder approval (marked TODO in code). `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
LEGAL-REQ-007 (no permission prompt before need). Apple 5.1.1(iv) and the purpose-string rule (the microphone string is counsel-read, `permission-copy.ts:5-9`). Pre-account local use: counsel Q19. Counsel must confirm.

### 18. Label effect
**Label effect.** None. The speech model download sends no data about the person (a file request to the pack host); counsel confirms the host's logs hold only what the subprocessor page says (D-046).

### 19. Claims
Enables: "Works without a connection" for recording and typing only. Forbids: "works offline" for sign-in; "instant"; "nothing to download".

### 20. Free or Plus
Free (T2). No Plus surface in first run (NS-44).

### 21. Measures with analytics off
Tester questions: "From opening the app to your first letter, did anything ask for something you did not expect? (yes / no)", "Did the speech download start without your tap? (yes / no)". x of n. Run sheet: cold start p50 on SE 3 (NS-34).

### 22. Dependencies and gates
NS-34 run sheet; BL-917-equivalent row (lock offer removal); G-E07 StateScreen note slot; pack host and signed manifest (D-115).

### 23. Open questions
- O-22 Should "Start on this phone" stay offered in outages for a store build that requires sign-in (D-160)? Owner: Karma. Default: yes, as built (founder chose option B on 9 Nov as an outage-only fallback, `gate.logic.ts:33-38`); the Notes for Review name it.

---

## NS-40. Age and region checks (candidate: none; cited row C44)

### 1. Who and when
Every person on every install, before any route opens (the age question); every new account at the moment it is created (the region check, on the server). Also the account later learned to belong to someone under 18.

### 2. Why
The product is for adults only, with no minor mode (D-006, PRD-REQ-019, LEGAL-REQ-002). The age question is our evidence that we do not knowingly collect from children (COPPA's actual-knowledge standard; compliance input 2.1). Apple now asks 18+ apps to check age with the Declared Age Range API where a law requires it, and Texas SB 2420 has applied to new Texas Apple Accounts since 4 Jun 2026; California, Alabama, Utah and Louisiana follow in 2027 (compliance input 2.2, sources read 20 Nov; the state dates are from a secondary source). Sign-up from embargoed places is refused (D-131). Both checks must store nothing they do not need (D-026, D-136, Texas 121.055). Counsel must confirm every legal reading here (Q46, Q57).

### 3. What, and Not in scope
**What.** The neutral 18+ question and its stop; the "I answered by mistake" re-ask; the store age signal (Declared Age Range) where iOS offers it; the server's attestation at Terms; the age step for an old account; the under-18 learned later; the sign-up country refusal and what the phone shows; what is never stored.
**Not in scope.** The agreement box that shares the age screen (NS-42). Parental consent flows: none, because a minor is stopped, not served (compliance G16). Name screening against restricted-party lists: none (D-137). Any in-app question about where the person is: never.

### 4. Happy path
1. First launch. Where iOS 26.2 or later reports the account eligible (`isEligibleForAgeFeatures`), the app asks the system for the age range in memory, up to 3 s (F01 6.2a). An adult answer still shows our question; a minor answer stops at once.
2. E-S03: "Are you 18 or older?" with Yes and No as equal pills, nothing selected, the agreement box unticked, Continue never disabled.
3. Yes, ticked box, Continue: the phone stores `ageGate.passed = '1'` and the two agreement rows in one transaction (NS-42), and the Welcome follows.
4. At account setup the Terms record carries `age_attested: true` (`lib/auth/consent.ts:101-102`); the server refuses `age_attested: false` and refuses content writes without it (`require_content_consent`).
5. At sign-up, the server reads the request's IP in memory, maps it to a country, and lets the account be created. Nothing is shown and nothing is kept but a daily count by result (D-136).

### 5. Unhappy paths and edge cases

| Case | What the person sees | Stored |
|---|---|---|
| No answer, Continue | "Choose Yes or No." above Continue, announced (`en.beforeBegin.chooseAnswer`) | nothing |
| Yes without the tick | "Check the box to continue.", focus moves to the box (`en.beforeBegin.tickBox`) | nothing |
| No, Continue (whatever the box) | E-S03.stop: "{app} is currently for adults 18 and over" (`en.ageGate.stopTitle`), one line in the same room, announced; no button for 24 hours | `ageGate.stoppedAt` (the time of the No); a held invite token is deleted (`lib/age-gate.ts:24-33`) |
| Relaunch within 24 hours | The stop again | as above |
| Clock moved back | The stop never gets shorter (clock repair, `age-gate.logic.ts:35-42`) | `stoppedAt` reset to now |
| After 24 hours | "I answered by mistake" (`en.ageGate.mistakeButton`); the question again with nothing selected and the box unticked | nothing new until answered |
| Reinstall after a No | The question again (accepted residual, F01-U05: no under-18 signal kept in the Keychain) | nothing |
| System age signal says under 18 (when built) | The stop at once, no question | `ageGate.stoppedAt` only |
| System age signal declined, error, over 3 s, iOS below 26.2 | Our question decides; a decline is not proof of adulthood | nothing |
| An old account whose Terms row lacks the attestation | The consent sheet's age step (the gate's own pills, no lamp) | Yes: a `terms` accept with `age_attested: true`. No: the session ends and the 18+ gate closes (`session-provider.tsx:310-325`); nothing about the No is sent |
| Sign-up from a refused country (when D-131's hook ships) | After the code step (E62; Send gives the same answer for every address), one neutral full screen (E-S04.refused-region, new state): intent "{app} can't be set up from here." with "Terms of Service" and "Contact us"; never asks where the person is, never names a list or a country, never says "sanctions" | phone: nothing. Server: the daily count with the country code for refusals only (D-136) |
| A person in a refused country signs in to an account made elsewhere | Signs in normally: the hook runs only when a user is created (D-131). Terms 2.4 covers the rest | nothing |
| VPN or a wrong IP location | Same refusal screen; Contact us is the way forward; support never asks where they are (Privacy 12) | as above |
| Under 18 learned later (support report, or a system signal on a signed-in account) | Support runs `docs/ops/runbooks/underage-account.md`: under 13 deleted within 10 days; 13 to 17 closed with export offered where allowed; never asks for ID or a birth date | one content-free audit row |
| App Review taps No | The stop; the Notes for Review say to answer Yes (F21-U06) | as above |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card is on every first use |
| Empty, many | n/a because the gate holds no content |
| Offline | The question, the stop and the re-ask are local; the system signal works offline as iOS allows (UNVERIFIED); the region check runs only at an online sign-up |
| Slow | The question renders at once; the system signal applies when it arrives, at most 3 s |
| Failed | A damaged settings value counts as `ask`, or as a fresh stop if it was a No time (F01-U19) |
| Interrupted (call, Siri, alarm, the baby) | Same screen on return; nothing stored until Continue |
| App killed mid-flow | The question again with nothing selected |
| App updated mid-flow | An install that passed the old gate sees only the agreement once (`decideEntry` 'agree', `agreements.logic.ts:82-85`); the question is not re-asked |
| Low storage, Low Power Mode | No change |
| Kill switch `serverFeaturesEnabled()` off | The question and the stop are unchanged (they are phone-only); no region check, because no account is made |
| Outage | The hook is part of user creation, so an outage fails the sign-up as an outage (E-S14), never as a refusal. If the lookup itself fails while Auth is up, the hook fails open and counts an error (File 28 as written; the sign-up goes through). That is the default until counsel and the CCO answer, and the hook stays off until then (E47). The phone never shows a refusal as an outage or an outage as a refusal |
| Plan lapsed, signed out, two books, two parents, expecting | No change: the gate is per install |
| Second account on the same phone | The gate is per install; account B meets the Terms attestation at its own sign-in |
| New phone | The question again (settings do not move with the session); restored from a device backup: the settings come back, so the gate stays passed |
| VoiceOver | Focus on the question (heading); Yes, No read as a choice of two, neither selected; the box with its full sentence; Terms and Privacy as links; reason lines announced; the stop announced once (`age-gate-screen.tsx:82-85`) |
| Voice Control, Switch Control | "Yes", "No", "Continue", "I answered by mistake" are visible labels |
| AX5 plus Bold Text on SE 3 | Yes and No stack; the box row wraps; Continue and "I answered by mistake" scroll into reach (`age-gate-screen.tsx:137-138`) |
| Reduce Motion | One cross-fade from the question to the stop (the built form) |
| Dark mode, Increase Contrast | No status colour on the gate (D-110); the reason glyph is in `text` |
| Every error code | `under_18` (E-S03.stop); `chooseAnswer`, `tickBox` reasons; region refusal (new, see section 10); `consent_unavailable` on the age step (NS-42) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-40-R1 | Given a fresh install opened by icon, invite link, email link or any deep link, Then the first interactive screen is the age question with nothing selected and the box unticked, and no route behind it is mounted | P0 (b) | `[NS-40-R1] the age question comes first` |
| NS-40-R2 | Given Yes and a tick, Then the phone stores `ageGate.passed = '1'` and no age, birth date, range or time of the Yes anywhere on the phone or server | P0 (b) | `[NS-40-R2] Yes stores a boolean only` |
| NS-40-R3 | Given No, Then the stop shows, exactly one row `ageGate.stoppedAt` exists, a held invite or link token is gone, no file is in Documents and zero network requests were made; a relaunch at 23 h 59 min shows the stop | P0 (b) | `[NS-40-R3] No creates nothing and holds 24 hours` |
| NS-40-R4 | Given the stop for more than 24 hours, Then "I answered by mistake" shows, and it reopens the question with nothing selected | P1 | `[NS-40-R4] the re-ask after 24 hours` |
| NS-40-R5 | Given iOS 26.2 or later and an eligible account (when the module ships), When the system answers under 18, Then the stop shows at once with no question; When it answers adult, Then the question still shows; When it declines, errs or passes 3 s, Then the question decides | P0 (b) | `[NS-40-R5] the system age signal decides only a stop` |
| NS-40-R6 | Given any system age answer, Then a test spying on the settings store, the Keychain, the logger and the analytics client sees zero writes carrying it, and nothing about it is sent to our server | P0 (b) | `[NS-40-R6] the system age signal is never stored` |
| NS-40-R7 | Given a new account's Terms record, Then it carries `age_attested: true` and no `age_signal` value, and the server refuses `age_attested: false` | P0 (b) | `[NS-40-R7] attestation is recorded, never an age` |
| NS-40-R8 | Given No on the consent sheet's age step, Then the session ends locally, the 18+ gate closes, nothing is sent to the server and no policy act is recorded (a No sends nothing and writes no server row; the phone keeps `ageGate.stoppedAt`, NS-40-R3; E56) | P0 (b) | `[NS-40-R8] No at the age step ends the session` |
| NS-40-R9 | Given D-131's hook on, When a sign-up comes from a refused country, Then after the code is entered (never at Send, E62) the app shows the neutral refusal screen with Terms and Contact us, stores nothing on the phone, and never asks where the person is; a failed lookup is never shown as a refusal, and a refusal is never shown as an outage (E47) | P0 (b) | `[NS-40-R9] a refused sign-up is calm and stores nothing` |
| NS-40-R10 | Given D-131's hook on, When Apple, Google (if on) and email sign-ups are each made from a test refused location in staging, Then each is refused by the hook | P0 (b) | `[NS-40-R10] every sign-in method meets the country check` (staging) |
| NS-40-R11 | Given an existing account signing in from a refused country, Then sign-in succeeds (the hook runs only on user creation) | P1 | `[NS-40-R11] the country check is at creation only` (staging) |
| NS-40-R12 | Given the hook's daily counts, Then they hold counts by result and the country code for refusals only, and no IP address, email or user id | P0 (b) | `[NS-40-R12] country counts hold no person` |
| NS-40-R13 | Given VoiceOver, Then focus starts on the question, the answers read as a choice of two with none selected, reason lines and the stop are announced; Given AX5 on SE 3, Then Continue is reachable and nothing truncates | P0 (b) | `[NS-40-R13] the age screen works with VoiceOver and at AX5` |
| NS-40-R14 | Given a refusal from the hook, Then the phone never shows it as a generic sign-in error or an outage | P1 | `[NS-40-R14] a refusal is not an error` |

### 8. Non-functional budgets
- Latency: the question interactive in the cold-start budget (NS-39-R7); answer to Welcome p95 300 ms; system signal timeout 3 s; the hook adds p95 under 200 ms to sign-up (PROPOSED).
- Memory, storage, battery: negligible.
- Offline: the question works offline.
- Accessibility: NS-40-R13; NS-33 rows on E-S03.
- Localisation: English.
- Privacy (log canary): no age answer, system signal, IP or country in any app log, Sentry breadcrumb or analytics event; the hook logs counts only.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch: `serverFeaturesEnabled()` off | Phone-only gate unchanged; no region check | `[NS-40-R1]` |
| Card's remote pause | None for the age gate: a remote value may never change what is collected or open the gate (D-066). The hook has no remote pause; turning it off is a founder step recorded in DECISIONS (it changes a published promise, Privacy 12) | n/a |
| Plan lapse | No change | n/a |
| Second account on the same phone | Gate per install; attestation per account | `[NS-40-R7]` |
| Sign out | The gate stays passed | existing |
| Erase everything | `ageGate.passed` removed (`age-gate-erase.test.ts`); the question again | existing |

### 10. Data and engineering
- Fields: phone settings `ageGate.passed`, `ageGate.stoppedAt` (existing). Server: `policy_acceptances.context.age_attested` (existing). New (when built): none on the phone for the system signal; server `ops.restricted_jurisdictions` and `ops.compliance_check_counts` (on `origin/feat/db-compliance-gates`, PR #424, "File 28").
- Migrations: File 28 (D-131), carried with its own grants and its `grants.mjs` rows; never edited once applied.
- Sync field group, export: `account.json` says whether the person answered Yes on this phone (`packages/content/src/features/export.en.ts:122`, per the compliance input); nothing else.
- Modules: `lib/age-gate.logic.ts`, `lib/age-gate.ts`, `components/gate/age-gate-screen.tsx`, `lib/agreements.logic.ts`; new `modules/age-range` (Swift, iOS 26.2 SDK, entitlement `com.apple.developer.declared-age-range`) behind `lib/age-range.ts` (F01 section 11 design).
- Flags: none. The age gate has no flag.
- Error codes: `under_18` (phone); the hook's refusal is a 403 from the `before user created` hook, mapped to a new `AuthErrorKind` `region_refused` (PROPOSED; needs a WORDS 4.2 row and a placement in `OUTAGE_ERRORS` tests: it is NOT an outage).
- Rollout and rollback: the module ships dark only if its tests pass; rollback is a release. The hook turns on with File 28; rollback is a founder step.

**Built today.**
- Root gate before any route: `_layout.tsx:214-217`. Built.
- Neutral question, unticked box, reasons, stop, 24 h, clock repair: `age-gate.logic.ts:15-46`, `agreements.logic.ts:57-63`, `age-gate-screen.tsx:73-123`. Built.
- Held invite dropped on No: `lib/age-gate.ts:24-33`. Built.
- Confirm step after No (F01-U01, F01-REQ-002): not built; BL-561 is needs-founder and needs counsel. This card does not require it (open item O-3).
- Declared Age Range: not built anywhere under `apps/mobile` (compliance input 2.2, grep confirmed this session). Backlog need: F01 WP-F01-02 and WP-F01-07 as rows (new ids), built with the iOS 26.2 SDK.
- Region check: not on `develop` (`origin/feat/db-compliance-gates` only). The app's refusal screen is BL-553 (open, not built). Privacy 3.0.0 says the check takes effect only when it ships.
- Age step at the consent sheet ending the session on No: `session-provider.tsx:310-325`. Built.

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| 18+ answer | Adults only (D-006) | Required | Yes or No, nothing preselected | L2 | Phone settings `ageGate.passed` | Install; Erase everything removes it | Yes, `account.json` |
| Time of a No | The 24-hour stop | Only after No | ISO time; clock repair | L2 | Phone `ageGate.stoppedAt` | Until the next Yes or uninstall | No (not an account fact) |
| Age attestation | Proof the account holder confirmed 18+ (LEGAL-REQ-001) | Required for any server feature | `true` only; server refuses `false` | L2 (on an L3 row) | Server `policy_acceptances.context` | Account life, then pseudonymised for the period counsel sets (PRIV-R21; Privacy 7) | Yes, `consent_history` |
| System age range | Stop a minor where iOS knows | Not asked by us; iOS asks | adult, minor, unknown | not stored | memory only | request lifetime | never |
| Sign-up IP address | Country check (D-131) | Automatic at account creation | DB-IP Lite lookup | L3 | memory in the hook only | not kept (D-136) | never |
| Daily check counts | Show the check runs | Automatic | counts by result; country code for refusals only | L2 | `ops.compliance_check_counts` | 2 years (D-136) | never (not personal) |

Never collected: an age, a birth date, an age range, a "how old are you", an ID document, a selfie, a location question, a country picker, a name for screening (D-137).

### 12. Door lines
- **Shown:** the question "Are you 18 or older?" and, on the same screen, the agreement (NS-42's door).
- **Records:** the age boolean on the phone; at sign-in, `age_attested: true` inside the Terms record. The system signal and the IP are never recorded.
- **Never:** a preselected answer, a ticked box, a hint that one answer is expected, any child-facing framing (App Review 5.1.4), any age value stored or sent.
- **Decline:** No stops the app on this phone with one line; nothing is stored about the box; after 24 hours the question can be answered again.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Children | A minor passes by tapping Yes | Neutral question; 18+ store rating; system signal where available; Terms 2.1 close on actual knowledge; runbook | `[NS-40-R1]`, `[NS-40-R5]` |
| Age data | Stored and later breached or reused | Boolean only; memory-only signal | `[NS-40-R2]`, `[NS-40-R6]` |
| Founder's sanctions exposure | Sign-up from an embargoed place | D-131 hook at user creation; Terms 2.4; US storefront | `[NS-40-R10]` |
| Person refused by mistake (VPN, travel) | Locked out with no path | Calm screen with Contact us; existing accounts sign in | `[NS-40-R9]`, `[NS-40-R11]` |

Risk checks:

| Check | Where | Pass | Fail | Kept |
|---|---|---|---|---|
| 18+ question | Phone, root, every install | Yes plus tick | Stop 24 h | boolean; time of a No |
| System age range (Declared Age Range) | Phone, launch, iOS 26.2+ eligible | adult or unknown: our question | minor: stop at once | nothing |
| Terms attestation | Server, at Terms | `age_attested: true` | refused | the flag in the Terms record |
| Age step for old accounts | Phone sheet, then server | Yes | session ends, gate closes | nothing for a No |
| Country at sign-up (D-131) | Server hook, user creation only | allowed | refusal screen | daily counts |
| Under 18 learned later | Support | n/a | runbook close or delete | content-free audit row |

### 14. Never
- Never store, log or send an age, a range or a system age response. Never ask for an ID or a birth date. Never ask where a person is.
- Never a parental-consent flow: a minor is stopped, not served.
- Ruling D3: n/a because no letter exists. Ruling D2: n/a because no text field.

### 15. Design inputs
E-S03 (default, reason-noAnswer, reason-noTick, agreeOnly, stop, stop-after24h, ax5, vo, dark). New state E-S04.refused-region (replaces WORDS' HOLD state E-S03.region, because the refusal arrives at sign-up, after the code step (E62), not at the age screen): StateScreen warm, no drawing of a map or flag, one line, Terms and Contact us as quiet actions, no Try again (it would fail the same way). The consent sheet's age step uses the gate's own pills (built). No new component.

### 16. Content inputs
REUSE `en.ageGate.*`, `en.beforeBegin.*` (registered, COUNSEL). New PROPOSED keys `system.region.title` and `system.region.body` from WORDS 9 move from HOLD to needed when File 28 ships; intent "{app} can't be set up from here." and "If you think this is wrong, contact us." (the WORDS draft "Nothing was set up on this phone." is true and may stay). Never "sanctions", "blocked", "country", "not allowed". `content` writes; counsel reads; the founder approves.

### 17. Legal, privacy and compliance inputs
Q46 (state age-assurance laws; whether an adults-only app with no minor path has a Texas 121.054 duty; good-faith reliance), Q45 (children), Q57 (sanctions, the country check, VPNs, Kherson and Zaporizhzhia), Q47. Apple Declared Age Range Q&A and Texas news read 20 Nov by `regulatory-affairs` (compliance input 2.2). AB 1043 as amended by AB 1856: primary text not read (UNVERIFIED). Counsel must confirm.

### 18. Label effect
**Label effect.** None for the age gate (nothing leaves the phone). The country check uses the IP without keeping it; Privacy 12 already discloses it (D-136); the App Privacy answers do not change because the IP is not collected in Apple's sense (counsel confirms, Q54).

### 19. Claims
Enables: "For adults 18 and over." Forbids: "verified adults", "age verified", "safe for kids", any "kids" or "children can" wording (App Review 2.3.8, 5.1.4).

### 20. Free or Plus
Free; n/a.

### 21. Measures with analytics off
Support inbox tally: "locked out by the age question" and "refused at sign-up", as fixed categories, counts only. The hook's daily counts (refusals by country code).

### 22. Dependencies and gates
File 28 and BL-553 before any sign-up outside the family (Q57's own deadline); the Declared Age Range module before 1 Jan 2027 (California, per the secondary source) and a founder risk acceptance for Texas until it ships (open item O-2); BL-561 stays with the founder and counsel.

### 23. Open questions
- O-2 Declared Age Range timing. Owner: Karma, then founder. Default: ship the module in a 1.0.x before 1 Jan 2027 built with the iOS 26.2 SDK; record the Texas exposure for Build 12 now as a founder risk acceptance in DECISIONS (compliance G1).
- O-3 Confirm step after No (BL-561). Owner: founder and counsel. Default: not built; keep the 24-hour stop and "I answered by mistake" (answers CG14). A confirm that offers "Go back" can read as inviting a different answer; counsel decides.
- O-4 Country check before public sign-up. Owner: founder (apply File 28), Karma. Default: the hook and BL-553's screen are on before the store build reaches anyone outside the family; until then the founder records in DECISIONS that the check is off and Privacy 12's "takes effect only when it ships" stays true (compliance G3). No in-app region screen beyond the refusal (answers CG10).

---

## NS-41. Sign up and sign in (candidate: none; cited rows C44, C46; extends NS-10)

### 1. Who and when
P1 or P3 on first run, right after the Welcome; a returning parent on a new or reset phone; a parent who signs in later from Me on a phone that started locally (outage path); and account B on a phone that holds account A's book. Store builds with servers on require an account to begin a book (D-160), except the outage-only local start (NS-39).

### 2. Why
The account is what lets a parent's words follow them to a new phone (the only account-based feature a store build has while co-parent and backup are off; NS-38-R5). It must be quick (two methods, no password), honest (new and returning look the same, so an address never reveals whether it has an account), and safe (an email link signs in only the phone that asked; a second account never reaches the first account's letters). Evidence: [F] F02 sections 1 and 6 (letter-first order now stale, D-160); ADR 0023; security input sections 1 to 5; NS-10.

### 3. What, and Not in scope
**What.** One door with two ways in (Sign in with Apple; Sign in with email: one email holding a link and a code); every validation and verification rule and failure; rate limits as the parent meets them; the returning account; the new phone hand-off to NS-10; the account made with another method; Hide My Email; the claim screen for letters already on the phone; the second account on one phone; session restore at launch.
**Not in scope.** What the Terms and sensitive-data screens record (NS-42). Sign-out, session expiry, deletion (NS-45). Google and passkeys: off in store builds (Google shows only when both client ids are in the build, `lib/auth/google.ts:38-40`; production `eas.json` sets none; passkeys only with `EXPO_PUBLIC_PASSKEYS=1`, set by no profile). "Ways to sign in" (adding a second method): later (F02 A-REQ-019). A password, a reset flow, SMS or a phone number: never.

### 4. Happy path
**Apple (new parent).**
1. E-S02: tap Sign in with Apple (Apple's own button, shown first and when `isAvailableAsync`).
2. Apple's sheet; Face ID. The app sends a SHA-256 of a 32-byte nonce to Apple and the raw nonce to Supabase (`lib/auth/nonce.ts`, `apple.ts:49-55`).
3. E-S07.settingUp "Setting up your account", then the consent sheet (NS-42).
4. New account: E-S08 (NS-43). The Apple authorization code goes in the background to `apple-token` for later revocation (`apple.ts:59-60`); it never blocks sign-in.

**Email (new or returning; the screens are the same).**
1. E-S02: Sign in with email, then E-S05: one field (email keyboard, AutoFill), help "A link and a code arrive by email. No password to remember.", Send link.
2. E-S06: "Check your email", "A link and a code are on their way to {email}.", a code field with one-time-code AutoFill, Open Mail; after 60 s "Send a new email" and "Use a different email" (and Sign in with Apple where available).
3. Either type the code (submits itself at full length) or tap the link in Mail on this phone. "Signing you in", then E-S07 as above.

**Returning account, new phone (NS-10).** Sign in the same way as last time ("Last time you used {method}." under that button, `welcome-sign-in.tsx:70-71`). After consent, the first-run router (E-S09) asks the account: C-S10 "Opening your book" up to 10 s, then the Book. Never E-S08 (NS-10-R0).

**Local start, then sign in.** A parent who started in an outage signs in from Me, Account. After consent, E-S24 "Keep your letters in this account?" with the masked address; "Keep in this account" moves the phone's letters to the account; "Not my account" ends the session and changes nothing.

### 5. Unhappy paths and edge cases
Every failure keeps the person where they are, says what happened in words, says nothing changed where that is true, and offers the next step. No code is ever shown. Error lines are WORDS 4.2 keys.

| # | Case | What the person sees (E state, key) | Way forward |
|---|---|---|---|
| 1 | Apple sheet closed | Nothing (`cancelled` is silent) | The same buttons |
| 2 | Apple not available on this phone (no Apple Account) | Apple button absent; email is the only way; no empty slot | Email |
| 3 | Apple or provider fails (no token, bad callback) | E-S02.error-provider `authCopy.firstRun.errors.provider` | Try again, or email |
| 4 | Apple returns no name (any sign-in after the first) | Nothing; expected | n/a |
| 5 | Hide My Email chosen | Normal. The account's address is a relay address; where a screen would show it (claim, Account), the method shows instead (PROPOSED "Apple (email hidden)", answers security G16) | n/a |
| 6 | Offline on the Welcome or a sign-in tap (first run) | E-S14.offline (NS-39) | Try again; Start on this phone |
| 7 | Sign-in service error (5xx) or the 10 s wait (first run) | E-S14.outage; a 5xx is never called "offline" | Try again; Start on this phone |
| 8 | Email field empty, Send tapped | Today Send is disabled with no reason. Required: "Type your email to continue." under the button, announced (PROPOSED `authCopy.email.needEmail`, answers CG11) | Type |
| 9 | Email malformed | On submit only, never while typing: `authCopy.errors.invalid_email` "That email doesn't look quite right." under the field, field border `caution` plus the glyph; clears when the person types | Fix and Send |
| 10 | Supabase rejects the address (`email_address_invalid`, `validation_failed`) | `invalid_email` | Fix |
| 11 | Offline on Send | `authCopy.errors.network` "Nothing has changed. Sign in once you are back online."; the address stays in the field | Send again |
| 12 | Same address again inside 60 s | The app reuses the earlier send and asks nothing of Supabase (`errors.logic.ts:107-120`); the code screen shows as before | Wait for the email |
| 13 | Email wait (per-address 60 s on the server, or the project's hourly cap) | `authCopy.errors.email_wait` "Nothing has changed. Another email can't be sent just yet. Wait a few minutes, then try again."; on first run, E-S14.outage (it is in `OUTAGE_ERRORS`, `gate.logic.ts:164`) | Wait; Sign in with Apple still works |
| 14 | Email sign-in turned off (`email_provider_disabled`, `signup_disabled`) | `authCopy.errors.not_available`; first run E-S14.outage | Apple |
| 15 | Code shorter than its length, Continue tapped | Today Continue is disabled with no reason. Required: "The code has {n} digits." (PROPOSED `authCopy.code.sixDigits`, re-keyed `authCopy.code.digits` with `{n}` so it survives O-6; answers CG11) | Type the rest |
| 16 | Wrong code | `authCopy.errors.wrong_code` "That code didn't match. Check the newest email, or send a new one."; the field clears and refocuses; no shake, no red, no haptic | Retype or send a new email |
| 17 | Expired code | Reads as `wrong_code` (Supabase answers "expired or invalid" for both, `errors.logic.ts:39-41`) | Send a new email |
| 18 | Five wrong codes for one address in 15 minutes | `code_paused` plus `code.pausedOtherWays` in one live region: the link in the newest email and Apple still work; no countdown; Send a new email stays and never clears the pause (`code.tsx:22-27`) | The link, Apple, or wait |
| 19 | Too many verifications from this network (429 on verify) | `authCopy.errors.rate_limited` on the code screen (never the outage screen: the code screen owns it, `gate.logic.ts:159-162`) | Wait a few minutes |
| 20 | Offline on the code screen | `network`; the field clears; the same code still works for its life | Try again |
| 21 | No email after a minute | `code.noMailHelp` "Nothing yet? Look in spam, or send a new email."; "Trouble signing in?" with `auth.noEmailHelp` (which must drop Google while Google is off, answers CG13) | Resend, different email, Apple |
| 22 | App killed between Send and the code | The address is gone (memory only, by design); E-S06.noAddress asks for it again (`code.emailLabel`); the server's 60 s wait still holds | Retype the address |
| 23 | Link tapped on this phone | "Signing you in" (E-S06.verifying); PKCE exchange with this phone's verifier | n/a |
| 24 | Link expired (its life, or this phone's request note over 1 hour old) | `authCopy.errors.expired` "That link has expired. Send a new email for a fresh one."; Send a new email (filled) and Type the code (quiet) | Resend |
| 25 | Link opened on a phone that did not ask (another phone, or someone else's request) | E-S06.refused-other_phone: "This link can't be used here" + "Type the code from the email on this phone instead." | Type the code |
| 26 | Same, after the server already read the link (the code may be spent) | E-S06.refused-other_phone_spent: "This link was opened on a different phone. Send a new email, then use the link or code from it." | Send a new email |
| 27 | Link opened while any account is signed in here | E-S06.refused-already_signed_in; the session is never replaced (`already_signed_in`) | Close; sign out first to change accounts |
| 28 | Two emails sent | Only the newest link and code work; the copy says "the newest email" | n/a |
| 29 | Opened in a mail scanner or a laptop browser | The website page never verifies on load (A-REQ-023); it tells the person to type the code in the app | Type the code |
| 30 | Phone clock wrong | A request note more than 60 s in the future counts as no request (`other_phone`); over an hour old counts as `expired`; the typed code still works | Type the code |
| 31 | Returning account, other method (a different address, often Hide My Email on one phone and a real address on another) | A second, empty account is made; after consent the router shows C-S11 "No book here yet / Did you use a different way to sign in last time?" with "Try another way" (signs out) and "Start a book"; the screen names the method used, never the full email (NS-10-R12) | Try another way |
| 32 | Same verified address by Apple and by email | One account (Supabase links identities with the same verified email automatically; security input 7) | n/a |
| 33 | Session exists, consent outstanding, no book on the phone (killed on the Terms sheet; a Terms version bumped) | The consent sheet again, or C-S11's held screen with Finish setting up and Try another way, within 10 s; never E-S08 (NS-10-R0) | Finish setting up |
| 34 | The phone already holds letters owned by no account (local start, or a servers-off build updated) | E-S24 after consent: masked email (or the method for a relay address), Keep in this account, Not my account. Nothing is claimed or uploaded before Keep (built) | Keep, or Not my account |
| 35 | The account already has a book and the phone holds a local one | E-S24.hasBook: the phone's book joins as a second book; nothing deleted | Keep |
| 36 | Killed on the claim screen | Nothing claimed; "Finish setting up" in Me, Account reopens it | Finish setting up |
| 37 | Second account B signs in on a phone holding A's book (A signed out) | B never sees, is offered or uploads A's letters: A's book is hidden and locked on this phone until A signs in again or Erase everything runs (ADR 0031 as proposed; open item O-5). B meets C-S10 (B's book arrives) or C-S11 "No book here yet" and Start a book. No line says another book exists | n/a |
| 38 | A refused sign-up (D-131) | E-S04.refused-region (NS-40) | Contact us |
| 39 | Deletion pending at sign-in | The deletion screen with the date and Cancel deletion (NS-45) | Cancel deletion |
| 40 | Account deleted on another phone while this one waits | C-S10.deletedElsewhere `authCopy.newPhone.accountDeleted` (NS-10-R9) | Start a new book |
| 41 | Double tap on a provider or Send | One request (`inFlight` set before the first await) | n/a |
| 42 | Mail app absent | "Open Mail" does nothing visible; the code field stays | Type the code |
| 43 | Servers-off build | No sign-in anywhere; the sign-in sheet, if reached, shows `authCopy.sheet.notConfigured` and no buttons | n/a |

**Rate limits as the parent meets them.** No number or countdown is ever shown; each limit has a line and a way that still works.

| Limit (where it lives) | Value | The parent meets | Still works |
|---|---|---|---|
| One email per address (Supabase `max_frequency`, plus the app's own wait) | 60 s | Send a new email turns on after a minute; a second send inside it is silently reused | The first email |
| Emails per hour, whole project (custom SMTP) | 100 (`supabase/config.toml:54`; production dashboard UNVERIFIED; the runbook says 30 at first, `docs/ops/AUTH_SETUP.md` 4.3) | `email_wait` for every family once the hour's cap is used (launch day, or abuse) | Sign in with Apple |
| Sign-in and sign-up requests per IP | 30 per 5 min | `email_wait` on send, `rate_limited` elsewhere | Apple; another network |
| Code and link checks per IP | 30 per 5 min | `rate_limited` on the code screen | Wait |
| Wrong codes per address (this app process only) | 5 in 15 min, then 15 min pause | `code_paused` | The newest link; Apple |
| Token endpoint per IP | 150 per 5 min | `rate_limited` (rare) | Wait |
| Consent records per person | 60 per hour; 200 per day | `consent_unavailable` on the sheet | Try again later |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card |
| Empty | New account: E-S08 next |
| Many (1,000 letters, 300 pictures) | Returning account: NS-10-R2 (what has arrived shows at 10 s); claim of a large local book: one transaction, p95 500 ms for a year (F02 section 9) |
| Offline at each step | Welcome: E-S14.offline. E-S05 Send: `network` inline. E-S06 code: `network`, field clears. Link opened offline: the verify screen offers Type the code first. E-S07: `network` per step, the sheet stays. E-S24: Keep waits for the account read (E-S24.waiting). Launch while signed in: no message, the gate is re-read on foreground |
| Slow | "Signing you in" stays still (ruling 31, E68); at 10 s on first run the outage screen; Apple's sheet is Apple's |
| Failed | Rows 3, 7, 13, 14 |
| Interrupted (call, Siri, alarm, the baby) | Apple's sheet is the system's; on return the screen is as left; a code typed is kept in the field |
| App killed mid-flow | After Send: row 22. After Apple, before Terms: the session is kept, the Apple name waits in the Keychain, relaunch shows the consent sheet or the held screen (row 33). On the claim screen: row 36. During the Apple token capture: nothing for the parent; deletion receipt says `apple: no_token` and ops are alerted |
| App updated mid-flow | Same as killed; a pending link note survives (Keychain), the typed address does not |
| Low storage | No change (sign-in writes Keychain items only) |
| Low Power Mode | No change |
| Kill switch `serverFeaturesEnabled()` off | No sign-in, no account, no Account or Delete rows (row 43); NS-10-R8 |
| Outage | E-S14.outage on first run; `system.unreachable.line` in place elsewhere |
| Card's remote pause | None exists for sign-in today (security G9); open item O-19 adds `killSwitches.signIn` |
| Plan lapsed | Sign-in unaffected; Plus is per Apple ID on the phone |
| Signed out | A phone with a book: Home, sign-in offered from Me, never required |
| Second account on the same phone | Row 37 |
| New phone | NS-10 (cited, not repeated) |
| Two books, two parents | Two books arrive (NS-10); the other parent's sign-in is alpha-only until NS-25 |
| Expecting parent | No change |
| Devanagari, RTL | Email addresses accepted as Supabase accepts them; the field is left to right |
| AX5 plus Bold Text on SE 3 | E-S04, E-S05, E-S06 single columns; the code boxes become one wide field at AX3 and above; sticky buttons stay above the keyboard; Close keeps its word |
| VoiceOver | Heading focus on arrival; the code field reads as one field "Code, {n} digits"; errors are announced from one live region; the masked address is read with `spokenAddress` |
| Voice Control, Switch Control | Visible labels; no gesture-only action |
| Reduce Motion | Cross-fades only; no spinner (busy words instead, K-1) |
| Dark mode, Increase Contrast | Tokens; error never by colour alone |
| Every error code | All 19 `AuthErrorKind` values (`machine.logic.ts:30-51`) are placed in rows 1 to 43 and in section 10; envelope codes met here: `unauthorized` (refresh once, then `session_expired`), `rate_limited`, `consent_required` (SCCON, NS-42), `deleted` (SCDEL, row 40), `upgrade_required` (NS-45) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-41-R1 | Given a store build with servers on, Then the Welcome offers exactly Sign in with Apple (where available) and Sign in with email, at equal size, with no password, name or phone field, and the words "sign up", "log in", "create account" appear nowhere (one door, answers CG12) | P0 (c) | `[NS-41-R1] one door, two ways in` |
| NS-41-R2 | Given a known and an unknown address, When Send is tapped, Then the screens, the words and the request shape are identical (`shouldCreateUser: true`), including from a place the region hook refuses: Send answers "check your email" for every address, and a refused region is shown only after the code is entered and the country lookup has run (E62); the phone keeps a refusal in memory for that attempt only, shows the same wait screen meanwhile and stores nothing (E70) | P0 (b) | `[NS-41-R2] new and returning look the same` |
| NS-41-R3 | Given an email link requested on phone A, When it is opened on phone B or by another person, Then no session is created and the person is sent to type the code; the five steps of review finding H1 fail on the code | P0 (a)(b) | `[NS-41-R3] a link signs in only the phone that asked` |
| NS-41-R4 | Given an account signed in on this phone, When any email link opens the app, Then the session is unchanged and the refused screen says how to change accounts | P0 (a)(b) | `[NS-41-R4] a link never replaces a session` |
| NS-41-R5 | Given letters on the phone owned by no account, When sign-in and consent finish, Then no letter is claimed or uploaded until Keep in this account is tapped on a screen that shows the masked address or the method | P0 (a)(b) | `[NS-41-R5] claim needs consent and a tap` |
| NS-41-R6 | Given account A's book on the phone and A signed out, When account B signs in, Then no letter, recording, picture, child name, Find result or reminder of A's is shown, offered, indexed or uploaded under B, and no line mentions another book; When A signs in again, Then A's book returns | P0 (a)(b) | `[NS-41-R6] a second account never reaches the first` (`[X4-R1]`, BL-961) |
| NS-41-R7 | Given each `AuthErrorKind`, Then the screen shows its WORDS 4.2 line with a glyph and words, `cancelled` shows nothing, and no code, status number or English from Supabase is shown | P0 (c) | `[NS-41-R7] every sign-in error has its words` |
| NS-41-R8 | Given the email field empty or the code short, When Send or Continue is tapped, Then a line says why in words and is announced, and focus moves to the field (never only a greyed button) | P1 | `[NS-41-R8] a waiting button says why` |
| NS-41-R9 | Given five wrong codes for one address within 15 minutes, Then code entry pauses 15 minutes with the line that the newest link and Apple still work, and Send a new email neither clears nor shortens the pause | P0 (b) | `[NS-41-R9] the wrong-code pause` |
| NS-41-R10 | Given the code length setting, Then the server's `otp_length` and the app's `EXPO_PUBLIC_EMAIL_OTP_LENGTH` are equal in every release profile, and the code screen, the email template and the Notes for Review say the same number | P0 (b) | `[NS-41-R10] code length agrees everywhere` |
| NS-41-R11 | Given a code or link, Then each is single use and expires 900 s after sending, and the phone's pending-request note expires at the same age (today 1 hour, `email-link.logic.ts:36`) | P0 (b) | `[NS-41-R11] code and link live 15 minutes` |
| NS-41-R12 | Given a 429 while sending, Then `email_wait` shows (first run: the outage screen with Sign in with Apple still reachable); given a 429 while checking a code, Then `rate_limited` shows on the code screen | P1 | `[NS-41-R12] rate limits have words and a way` |
| NS-41-R13 | Given an Apple sign-in, Then the authorization code is posted once to `apple-token` without blocking sign-in, is never stored on the phone or logged, and a missed capture appears as `apple: no_token` on the deletion receipt | P0 (b) | `[NS-41-R13] Apple token captured for revocation` |
| NS-41-R14 | Given a session and no book on this phone (a new phone or a reinstall), Then the person never meets E-S08 while the account may hold a book; consent outstanding shows the sheet or the held screen within 10 s (NS-10-R0) | P0 (a) | `[NS-41-R14] a returning account never meets the child step` |
| NS-41-R15 | Given a stored session and no network at launch, Then the person lands on Home signed in, with no message and no sign-out | P1 | `[NS-41-R15] offline launch keeps the session` |
| NS-41-R16 | Given any sign-in path, Then no email address, code, token hash, Apple code, name or user id appears in a log, breadcrumb, route param or analytics event (log canary) | P0 (b) | `[NS-41-R16] sign-in leaves nothing in logs` |
| NS-41-R17 | Given a different-method account with no book, Then C-S11 names the method used and never the full email, and Try another way signs out with nothing on the phone changed | P1 | `[NS-41-R17] wrong account names the method` (with NS-10-R12) |
| NS-41-R18 | Given a Hide My Email address, Then sign-in mail reaches it (the sending domain is registered with Apple's relay), and the claim screen and Me show the method, not the relay address | P0 (c) | `[NS-41-R18] Hide My Email works end to end` (device, Asha test account) |
| NS-41-R19 | Given a session and the session's Keychain items, Then they use `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` and never restore from a backup | P0 (b) | `[NS-41-R19] sessions never move with a backup` |
| NS-41-R20 | Given a store build, Then no Google button and no passkey control renders, and `auth.noEmailHelp` names only the ways the build offers | P0 (b) | `[NS-41-R20] only shipped ways in are named` |
| NS-41-R21 | Given the project's hourly email cap is reached, Then Sign in with Apple still works and the email path says `email_wait`, never an outage of the book | P1 | `[NS-41-R21] an email cap leaves Apple open` |
| NS-41-R22 | Given VoiceOver, Then each sign-in screen's heading takes focus, the code field reads as one field with its length, and every error is announced once; Given AX5 on SE 3, Then every action is reachable above the keyboard and nothing truncates | P0 (b) | `[NS-41-R22] sign-in works with VoiceOver and at AX5` |
| NS-41-R23 | Given a password set on an account through the API (staging), When password sign-in is tried, Then it is refused (pending the security test, open item O-21) | P0 (b) | `[NS-41-R23] no password path exists` (staging) |
| NS-41-R24 | Given an address typed with capitals or spaces, Then it is trimmed and lower-cased before it is sent, and the wait key and the request agree | P1 | `[NS-41-R24] one address, one form` |
| NS-41-R25 | Given `killSwitches.signIn` on (when O-19 is built), When a person with no session reaches the Welcome, Then E-S14.outage shows with the local start, and a signed-in session on any phone is never ended, refreshed differently or blocked | P1 | `[NS-41-R25] the sign-in pause hides, never signs out` |

### 8. Non-functional budgets
- Latency: Apple sign-in p90 3 s after the system sheet closes; token exchange p95 1.5 s; sign-in email delivered p90 30 s (A-NFR-004); "Setting up your account" to the next step p95 2 s on LTE (PROPOSED).
- Memory, storage, battery: negligible.
- Offline: each step's offline row in section 6.
- Accessibility: NS-41-R22.
- Localisation: English; any script in an email address that Supabase accepts.
- Privacy (log canary): NS-41-R16.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | NS-10 | `[NS-10-R1]` |
| Second account on the same phone | Hidden and locked old book; nothing claimed or uploaded | `[NS-41-R6]` |
| Offline | Per step; offline launch keeps the session | `[NS-41-R15]` |
| Retry after a lost answer | One account; one consent row (idempotency key); one claim | `[NS-10-R7]`, `[NS-42-R8]` |
| Sign out | Book stays (D1) | `[X4-R1]`, NS-45 |
| Account deletion pending | Deletion screen at sign-in | `[NS-45-R9]` |
| Kill switch: `serverFeaturesEnabled()` off | No sign-in surfaces | `[NS-39-R6]` |
| Card's remote pause: `killSwitches.signIn` (PROPOSED, O-19) | First run shows E-S14.outage with the local start; a signed-in session is never touched | `[NS-41-R25]` when built |
| Plan lapse | No effect on sign-in | n/a |

### 10. Data and engineering
- Fields: Supabase `auth.users` (email), `auth.identities` (Apple sub; Google sub when on), `profiles.display_name` (Apple name, first sign-in only); Keychain `scribe.auth`, `scribe.auth.pendingEmailRequest` (time only), `scribe.auth.appleUser`, `scribe.auth.pendingName`; settings `lastMethod`; server `ops.apple_tokens` (wrapped). No new field.
- Migrations: none for this card. Config: Supabase Auth settings (founder dashboard): `otp_length`, `otp_expiry 900`, `max_frequency 1m`, rate limits, JWT 900 s, refresh rotation, anonymous off, manual linking off, redirect allowlist exact `https://earlyletters.com/auth/callback`.
- Sync field group, export: none new (`account.json` carries the profile).
- Modules: `lib/auth/*` (`apple.ts`, `email.ts`, `email-link.logic.ts`, `errors.logic.ts`, `machine.logic.ts`, `pending.ts`, `session-provider.tsx`, `account-claim.logic.ts`), `app/(auth)/sign-in/*`, `components/onboarding/welcome-sign-in.tsx`, `lib/first-run/*`, `lib/sync/ownership.ts`.
- Flags: `serverFeaturesEnabled()`; Google by client ids; passkeys by `EXPO_PUBLIC_PASSKEYS`. Remote pause: none today; `killSwitches.signIn` PROPOSED (O-19).
- Error codes: `AuthErrorKind` (19): `cancelled`, `network`, `expired`, `wrong_code`, `code_paused`, `email_wait`, `rate_limited`, `invalid_email`, `not_available`, `provider`, `session_expired`, `under_18`, `consent_unavailable`, `other_phone`, `other_phone_spent`, `already_signed_in`, `unknown`, plus PROPOSED `region_refused` (NS-40). `AccountMismatchError` (`sync_account_mismatch`) is silent (E-S18 rule). Envelope: `unauthorized`, `rate_limited`, `consent_required`, `deleted`, `upgrade_required`.
- Rollout and rollback: auth config changes ship with the release that reads them (O-6 changes both ends in one release); rollback is the previous setting plus the previous build.

**Built today** (at `7d0446d02`; security input sections 1 and 5 hold every line cite):
- One door with Apple and email on the servers-on Welcome: `welcome-sign-in.tsx:44-148`. Built. The Me sign-in sheet still says "Continue with email" in its header comment and shows the privacy line `en.trust.signIn.privacy`, which names "the people you invite" (CG3, NS-42).
- Enumeration safety, PKCE link binding, refusal while signed in, claim after consent and a tap: built (`email.ts:1-19`, `email-link.logic.ts`, BL-347 merged).
- Code length 6 (`supabase/config.toml:71`, `email.ts:28-29`); F02 asks 8 (A-REQ-018 Rev). Backlog need: O-6 config plus copy row.
- Pending link note lives 1 hour (`email-link.logic.ts:36`) against a 15-minute token. Backlog need: cut to 900 s with O-6.
- Wrong-code pause is per process in memory (`pending.ts:72`), reset by a kill; there is no per-address server lockout. Backlog need: O-6 (server limit lower) and BL-248 (abuse alert).
- No bot control on email send; the 100-per-hour project cap can be used up by others. Backlog need: O-7.
- Email trimmed, not lower-cased, before send (security G17). Backlog need: small `mobile` row (`[NS-41-R24]`).
- Second account "never sees": not built; claim and upload are blocked (`account-claim.logic.ts`, `lib/sync/ownership.ts`), visibility is not (`child-store.ts:11-15` treats a null owner as "mine"). BL-961 plus ADR 0031 (O-5).
- Apple scopes request full name and email (`apple.ts:51`); NX-31-R9 says email only; the name is written to `profiles.display_name`, which no app screen shows (only export). Backlog need: O-8.
- Apple revocation is checked only when a user id first appears (launch or new sign-in); no foreground check and no `credentialRevokedNotification` listener (security G7). Backlog need: `mobile` row.
- Empty-email and short-code reasons are missing (Send and Continue are disabled silently: `email.tsx:66`, `code.tsx:225`). Backlog need: `content` plus `mobile` row with `authCopy.email.needEmail`, `authCopy.code.digits`.
- `auth.noEmailHelp` names Google. Backlog need: `content` (CG13).
- `region_refused` handling: BL-553 (open).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Email address | Sign-in and account mail | Required on the email path; from Apple when chosen (may be a relay) | Trimmed (lower-cased, O-6 row); at most 254; one `@`, a dot after it, no spaces (`errors.logic.ts:102-105`); checked on submit only; Supabase validates | L3 | Supabase `auth.users`; Resend delivery logs; never on the phone (memory only while signing in) | Until account deletion; Resend per Q51 | Yes, profile in `account.json` |
| Email code and link token | Prove the inbox | Required on the email path | Digits only, exact length (6 today); link token hash 16 to 256 of `[A-Za-z0-9_-]`; single use; 900 s | L4 | Supabase; the email; phone memory | Single use, then gone | Never |
| Pending request note | Accept a link only on the phone that asked | Automatic | Time only, no address; 1 h today (15 min after O-6); future-skew 60 s | L2 | Keychain, this device only | Until used, expired or sign-out | Never |
| Apple user id | Identify the account; ask Apple if the link was revoked | Required on the Apple path | Provider token with nonce | L3 | Supabase `auth.identities`; Keychain `scribe.auth.appleUser` | Until deletion or sign-out | No |
| Name from Apple | Prefill the profile (no screen uses it today) | Optional (Apple decides; first sign-in only) | Trimmed, joined, at most 60 | L3 | Keychain until Terms, then `profiles.display_name` | Until deletion | Yes (profile) |
| Apple refresh token | Revoke at deletion (5.1.1(v), TN3194) | Automatic | Code 16 to 512 of `[A-Za-z0-9._-]` | L4 | `ops.apple_tokens`, wrapped, service role only | Until revoked at deletion | Never |
| Session and refresh tokens | Stay signed in | Automatic | JWT 900 s; rotation | L4 | Keychain, this device only | Sign-out, deletion, revocation | Never |
| Last method | "Last time you used {method}." | Automatic | `apple` or `email` | L2 | Phone settings | Install | No |
| Unconfirmed sign-up row (a mistyped address) | Created by Supabase on an OTP request | Automatic | n/a | L3 | Supabase `auth.users` | Today: no purge. Default: purge never-confirmed rows after 7 days (O-12) | No |

### 12. Door lines
- **Shown:** the two ways in, the agreement line with its links directly above them (D-138; NS-42), "Last time you used {method}." on a returning phone; on E-S24 the masked address or the method.
- **Records:** on the phone, the session and Apple id in the Keychain and the last method in settings; on the server, the account and the identities. The address is never stored on the phone.
- **Never:** a password; an email link that signs in a phone that did not ask; a session replaced by a link; a full address on a shared screen beyond the field being typed; another account's letters on the claim screen.
- **Decline:** close Apple's sheet or go Back: nothing changes. "Not my account" on E-S24 ends the session with nothing claimed. In an outage, Start on this phone (NS-39).

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| A family's letters | A forwarded or phished link signs the attacker in, or uploads the family's letters to the attacker's account (H1) | PKCE; link only on the asking phone; refused while signed in; claim after consent and a tap | `[NS-41-R3]`, `[NS-41-R4]`, `[NS-41-R5]` |
| An account | Email code guessed | 6 digits today, 15 min life, per-IP verify limit; O-6 raises to 8 digits and lowers the limit | `[NS-41-R9]`, `[NS-41-R10]` |
| Address privacy | Learn whether an address has an account | Same screens and request for both | `[NS-41-R2]` |
| Everyone's email sign-in | Email bombing exhausts the project cap | 60 s per address; per-IP; O-7 bot check; Apple stays open | `[NS-41-R21]` |
| A's book on a shared phone | B reads or claims it | Claim and upload blocked (built); hide and lock (O-5) | `[NS-41-R6]` |
| A stolen session | Durable access | 15-minute JWT, rotation, Keychain this device only, Sign out other devices; no password path (O-21) | `[NS-41-R19]`, `[NS-41-R23]` |
| Deletion revocation | No Apple token at deletion | Background capture; `no_token` alert | `[NS-41-R13]` |

Risk checks during sign-up and sign-in:

| Check | Where | Pass | Fail (what the person sees) |
|---|---|---|---|
| Address shape | Phone, on submit | send | `invalid_email` |
| Address accepted | Supabase | email sent | `invalid_email`, `not_available` |
| Per-address and per-IP send limits; project cap | Supabase | email sent | `email_wait` |
| Bot check on email send (O-7) | Phone web view plus Supabase | email sent | PROPOSED line "Try again in a moment." (content) |
| Country at user creation (D-131) | Server hook | account made | refusal screen (NS-40) |
| Code match, single use, 900 s | Supabase | session | `wrong_code`, `expired` |
| Wrong-code pause | Phone process | verify sent | `code_paused` |
| Link bound to this phone (PKCE, pending note) | Phone plus Supabase | session | `other_phone`, `other_phone_spent`, `expired` |
| No session already on this phone | Phone | verify | `already_signed_in` |
| Apple nonce and identity token | Supabase | session | `provider` |
| Apple credential still valid | Phone at launch (and foreground, G7 row) | stay signed in | sign-out after uploads, `session_expired` line (NS-45) |
| Consent current (Terms with attestation, sensitive data) | Server `my_sync_gate`, `require_content_consent` | sync | consent sheet (NS-42) |
| Ownership of local rows | Phone | claim offered | silent mismatch, lists filter (O-5) |

### 14. Never
- Never a password, a reset flow, SMS or a phone number; never anonymous sign-in; never automatic merging of two accounts by email beyond Supabase's same-verified-email link.
- Never "Sign up", "Log in", "Create account" or "magic link" in a parent's words (glossary; CG12).
- Ruling D3: n/a because no letter text is on these screens. Ruling D2: n/a because no letter field.

### 15. Design inputs
E-S02 (default, error-provider, sessionExpired), E-S04 (default, busy, error-*), E-S05 (default, sending, reason-empty NEW, error-invalid_email, error-email_wait, error-not_available, error-network), E-S06 (default, reason-short NEW, checking, verifying, help after a minute, resent, error-wrong_code, error-code_paused, error-rate_limited, error-expired, refused-other_phone, refused-other_phone_spent, refused-already_signed_in, noAddress), E-S14, E-S24 (default, noEmail, method-only NEW for a relay address, hasBook, waiting), E-S04.refused-region NEW (NS-40), E-S18 rule. The code field must draw 6 to 10 digits (O-6). AX5 on SE 3: single columns; code boxes become one field at AX3 and above. Components: as built; StateScreen for refused and outage states.

### 16. Content inputs
REUSE `authCopy.*` (WORDS 4.2 and 5.3, every error line), `authCopy.claim.*`, `authCopy.newPhone.*`. PROPOSED: `authCopy.email.needEmail` "Type your email to continue."; `authCopy.code.digits` "The code has {n} digits." (replaces WORDS' `sixDigits` so the length can change); a method line for relay addresses, intent "Apple (email hidden)"; `system.region.*` (NS-40); a bot-check line if O-7 lands. CHANGE: `auth.noEmailHelp` drops Google while it is off; `en.trust.signIn.why` to the words-only truth (CG4); `en.trust.signIn.privacy` and `authCopy.consent.terms.body` drop "the people you invite" (CG3, NS-42). Words that never appear: sign up, log in, login, create account, magic link, password. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Apple 4.8 (Sign in with Apple beside any third-party login; met while Google is off and when on), 5.1.1(v) (required sign-in needs a significant account-based feature; the Notes for Review name it; compliance G6 asks for a new counsel number), Apple TN3194 (revocation). NIST SP 800-63B-4 is a reference, not binding: it says email should not be used for out-of-band authentication except confirmation and recovery codes (compliance input 4.3); `security-architect` owns the call (O-6 notes it). Q56 (codes as sensitive personal information), Q51 (retention of unconfirmed addresses). Counsel must confirm.

### 18. Label effect
**Label effect.** The App Privacy answers declare Contact Info (email address) and Identifiers (user id) linked to the person, for app functionality, not tracking (NS-38-R4). Unchanged by this card if the Apple name scope is dropped (O-8); if kept, Name (from Apple) is declared too.

### 19. Claims
Enables: "No password to remember." (registered help line); "Your letters' words come with you to a new phone." (with NS-10). Forbids: "your book is safe in your account" while backup is off (CG4); "only you and the people you invite" in a store build (CG3); "sign in with Google" while Google is off; "secure", "bank-level".

### 20. Free or Plus
Free (T2). Sign-in is never a Plus feature.

### 21. Measures with analytics off
Supabase Auth logs, content-free: sign-in success per method, excluding cancels (A-NFR-013 target 97% weekly). Support tally: "could not sign in", "no email arrived", "wrong account". Tester questions: "Did the sign-in email arrive within a minute? (yes / no)", "Did you ever see a screen saying no book was here when you expected yours? (yes / no)". x of n.

### 22. Dependencies and gates
BL-961 and ADR 0031 (O-5) before any build reaches a second adult on one phone; O-6 and O-7 before the public TestFlight link (security G2, G3); BL-922 (NS-10-R0); BL-553 and File 28 (NS-40); Apple relay domain registration (founder, security G16); the staging password test (O-21).

### 23. Open questions
- O-5 Second account on one phone. Owner: Karma (ADR to the founder). Default: hide and lock the old account's book (ADR 0031 as the platform pass proposes): no read, claim, upload, index or reminder until that account signs in again or Erase everything runs; no line names it. When the phone is signed out with two accounts' books, show the book of the account that signed out last (answers K-E02). Erase everything erases every book on the phone and its sheet says "every book on this phone" without naming any (answers K-E04).
- O-6 Code length and limits. Owner: `security-architect`, founder for the dashboard. Default: 8 digits, 900 s, the app's length set to 8 in the same release, the pending-link note cut to 900 s, `token_verifications` lowered to 15 per 5 min per IP, the Notes for Review and every template say 8 (security G2, compliance G5).
- O-7 Bot check on email send. Owner: founder (a new subprocessor). Default: Cloudflare Turnstile on email send before the public TestFlight link, added to the subprocessor page first; Apple unaffected; an alert when the hourly cap is near (security G3).
- O-8 Apple name scope. Owner: `privacy` with `mobile`. Default: request email only (NX-31-R9), because no screen uses the name; drop the Keychain pending-name item with it.
- O-12 Unconfirmed sign-up rows. Owner: `data-architect`. Default: purge never-confirmed `auth.users` rows after 7 days, with a test and a data-policy row (compliance G11).
- O-19 Remote pause for sign-in. Owner: Karma. Default: add `killSwitches.signIn` (disable-only, signed config): first run shows E-S14.outage with the local start; it never ends or blocks a signed-in session.
- O-20 Relay addresses. Owner: founder (Apple relay registration), `content`. Default: register `earlyletters.com` with Apple's private relay before public sign-in; show the method, not the relay address.
- O-21 Password path. Owner: `security`. Default: test in staging this week; if a password can be set and used, refuse password grants (hook if the plan allows) and alert on any `password` grant.

---

## NS-42. Agreements and notices at collection (candidate: none; cited row C44)

### 1. Who and when
Every new install (the box on the age screen), every new account (the Terms and sensitive-data screens at setup), every returning account whose Terms or sensitive-data consent is outstanding (a new major version, or a kill on the sheet), and every parent who later turns sync on or off.

### 2. Why
A person must see what they agree to before we collect, and we must be able to prove later exactly which words they saw and what they chose (PRIV-R21, LEGAL-REQ-001, LEGAL-REQ-006). The founder put the agreement line directly above the sign-in buttons (D-138 item 3) and the box on the age screen (founder decision F2, 8 Nov). The record must hold no more than it needs and never an age (D-026). Evidence: [F] compliance input section 5; `lib/agreements.logic.ts:1-21`; `lib/auth/consent.ts:86-119`.

### 3. What, and Not in scope
**What.** Each agreement and notice from the store page to the first letter, in order; what is shown, what is recorded and where; versions; the idempotent server record; the sensitive-data choice and its decline; re-consent on a new version; withdrawal; notice at collection; the words that are false in a store build today (CG3, CG4).
**Not in scope.** The text of the Terms and Privacy Policy (`docs/legal/**`, founder merge, counsel). Purchase disclosures at the Plus gate (E-S10, `en.plus.legal.*`; NS-44 cites them). Backup consent (NS-08, off). Co-parent consent (NS-25, gated).

### 4. Happy path (the order a new parent meets)
1. App Store page: the privacy policy link and the App Privacy label (NS-38). Nothing recorded.
2. E-S03: the unticked box "I agree to the Terms of Service and Privacy Policy." (`en.beforeBegin.agree`), with Terms and Privacy as their own 44 pt links opening in the in-app browser. Yes plus the tick, Continue: two local rows (Terms `4.1.0` and Privacy `3.0.0`, action `accept`, surface `first_run.before_you_begin`, device time, app version, SHA-256 of the sentence exactly as rendered), written in the same transaction as `ageGate.passed` (`agreements.logic.ts:19-21`, `:66-73`).
3. E-S02: the agreement line "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." (`authCopy.sheet.agreeLine`) directly above the two ways in, with its links. Nothing recorded here (the record comes at step 5).
4. Sign-in (NS-41).
5. E-S07 Terms step, "Before your book syncs": the privacy body, each document as a row, the same agreement line directly above "Agree and continue", and "Not now". Agree records one server row: document `terms`, the version `record_policy_act` accepts now, action `accept`, method `signin_sheet`, surface `auth.consent.terms`, app version, platform, locale, client time, context `{auth: <method>, age_attested: true}`, under an idempotency key (`consent.ts:92-119`).
6. E-S07 sensitive-data step (counsel-read words, `en.sensitiveConsent.*`): "Agree and sync" and "Keep on this phone" at the same size and width, stacked, nothing preselected. Either answer records one row: document `sensitive-data`, `accept` or `decline`, method `consent_sheet`, surface `auth.consent.sensitive`.
7. E-S24 claim, only when letters on the phone belong to no account (NS-41). Not an agreement: no consent row; ownership moves only on the tap.
8. E-S08 child step and the first letter: field labels only. Settings are not agreements ("Records: on the phone only; no PRIV-R21 row").
9. Later, at need: the microphone primer, then iOS's prompt (NS-44); the reminder ask (NS-13). Permission state only, no consent row.

### 5. Unhappy paths and edge cases

| Case | What the person sees | Recorded |
|---|---|---|
| Yes without the tick | "Check the box to continue.", focus to the box | nothing |
| No (whatever the box) | The stop (NS-40) | nothing about the box |
| An install that passed the old age gate and holds no agreement (build 1) | The box only, "Before you continue" (`en.beforeBegin.returningTitle`); the question is not asked again | Two local rows, surface `update.agreement` |
| "Not now" on the Terms step | The sheet closes; the person stays signed in; nothing syncs; Me, Account shows "Finish setting up" (`authCopy.account.finishSetup`) and `system.consentNeeded.line` (PROPOSED) | nothing |
| Killed on the Terms or sensitive step | Relaunch: the sheet again, or C-S11's held screen with Finish setting up and Try another way within 10 s; never the child step (NS-10-R0) | nothing until answered |
| "Keep on this phone" on sensitive data | Signed in, sync off, letters stay on the phone; `en.sensitiveConsent.declineHelp` "If you keep it on this phone, syncing and sharing stay off."; Me, Privacy offers "Agree and sync" later, never a one-tap consent (`consent.tsx` header) | `sensitive-data` decline |
| Turning sync on later | The full sensitive-data step with all its words (`/sign-in/consent?step=sensitive`) | `sensitive-data` accept |
| Turning sync off later (withdrawal) | Me, Privacy, "Sync and family sharing" shows On or Off (D-128); turning it off stops uploads; letters stay on the phone | `sensitive-data` decline (withdrawal). Whether server copies are removed on withdrawal: counsel and NS-36; UNVERIFIED as built |
| Setup did not finish (network, server, rate limit) | E-S07.error-consent_unavailable "Setting up your account did not finish. Try again." | nothing (idempotent retry) |
| A lost answer, retried | Nothing visible | one row (idempotency key, NS-10-R7) |
| A new major Terms or Privacy version while signed in | Before sync resumes, the sheet with a change summary, Agree and Not now; record, read, play and export work whatever the answer (F02-REQ-013, LEGAL-REQ-009) | `terms` accept with the new version |
| Declines the new version | NS-10 decline lines: nothing downloads or uploads; Delete account works without agreeing; export works for what is on this phone | nothing |
| Offline at the Terms step | `authCopy.errors.network` on the step; the sheet stays | nothing |
| Servers-off build | Only step 2 exists; no account, no server row | two local rows |
| Second account on the same phone | Account B meets its own Terms and sensitive-data steps; the phone's local rows are per install, not per account | B's server rows |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Section 4 |
| Empty, many | n/a because agreements hold no content |
| Offline | Step 2 is local; steps 5 and 6 need a connection and say so in place |
| Slow | "Setting up your account" stays still (ruling 31, E68); at 10 s the step's own retry line |
| Failed | `consent_unavailable` with Try again |
| Interrupted | The sheet stays as it was |
| App killed mid-flow | Section 5 row "Killed" |
| App updated mid-flow | A version change between two steps: the server accepts only the current version (`currentVersion`, `consent.ts:53-72`), so the sheet shows the current text |
| Low storage, Low Power Mode | No change |
| Kill switch `serverFeaturesEnabled()` off | Local rows only |
| Outage | The sheet's retry line; the local book (if any) unaffected |
| Card's remote pause | None: a remote value may never change what is collected or asked (D-066) |
| Plan lapsed | No change |
| Signed out | Local rows stay; server rows stay with the account |
| Second account | Section 5 last row |
| New phone | The session does not move, so a new phone meets the Terms step again if the server has no current row for the account; a current row means no sheet (per-account `my_sync_gate`) |
| Two books, two parents, expecting | No change |
| AX5 plus Bold Text on SE 3 | The agreement line and its links stay fully visible above the buttons without scrolling past them (LEGAL-REQ-001); buttons stack |
| VoiceOver | The box reads its full sentence; links are their own elements; the agree line is read before the button it governs |
| Voice Control, Switch Control | "Agree and continue", "Not now", "Agree and sync", "Keep on this phone" are visible labels |
| Reduce Motion | Steps cross-fade in place |
| Dark mode, Increase Contrast | Tokens |
| Every error code | `consent_unavailable`, `network`, `session_expired` (28000), `rate_limited` (SCRAT, shown as `consent_unavailable`), `under_18` (the age step, NS-40), SCCON (`consent_required`: the outbox pauses, the sheet shows) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-42-R1 | Given every visit to E-S03, Then the box is unticked, Continue is enabled and says why when it waits, and Terms and Privacy are separate 44 pt links | P0 (b) | `[NS-42-R1] the box is never preticked` |
| NS-42-R2 | Given Yes and a tick, Then exactly two local rows are written in the same transaction as the age answer, each with document, version, action, surface, device time, app version and the SHA-256 of the sentence as rendered, and no age | P0 (b) | `[NS-42-R2] the local agreement record` |
| NS-42-R3 | Given the Terms step, Then the agreement line is directly above "Agree and continue", the links open the version being recorded, and Agree writes exactly one `terms` accept with `context.auth` and `context.age_attested = true` before any content of the account syncs | P0 (b) | `[NS-42-R3] the Terms record before any sync` |
| NS-42-R4 | Given the sensitive-data step, Then both answers are the same size and width, nothing is preselected, and either answer writes one `sensitive-data` row with its action | P0 (b) | `[NS-42-R4] a no as easy as a yes` |
| NS-42-R5 | Given a decline of sensitive data, Then zero entries are uploaded, the person stays signed in, and the full step is reachable later from Me, Privacy in two taps | P0 (a)(b) | `[NS-42-R5] decline keeps letters on the phone` |
| NS-42-R6 | Given an account with Terms but no sensitive-data consent, When the phone writes an entry, Then the server raises SCCON and the phone pauses the outbox without dropping the write | P0 (a)(b) | `[NS-42-R6] the server refuses content before consent` |
| NS-42-R7 | Given a server consent row, Then it carries every PRIV-R21 field the shared builder defines (including the rendered text hash, app build and OS major) and never an IP, user agent, device id or age; the locale is the one shown, not a constant | P0 (b) | `[NS-42-R7] consent rows carry PRIV-R21 fields` (BL-577) |
| NS-42-R8 | Given a lost answer and a retry, Then the server holds one row per act | P1 | `[NS-42-R8] one row after a retry` |
| NS-42-R9 | Given the version constants on the phone and the documents the links open, Then they are the same versions, and a test fails when they drift | P0 (b) | `[NS-42-R9] recorded version equals the text opened` |
| NS-42-R10 | Given a new major version while signed in, Then the sheet shows before sync resumes, and recording, reading, playing and export work whatever the answer | P0 (a)(b) | `[NS-42-R10] re-consent never blocks the book` |
| NS-42-R11 | Given a decline of a new version, Then Delete account works from this phone without agreeing, and export is reachable (NS-10-R4a, R4b) | P0 (b) | `[NS-42-R11] declining still lets you leave` |
| NS-42-R12 | Given the first sign-in on a phone that holds local agreement rows, Then those rows are uploaded unchanged with their device time after the server `terms` row (BL-579), and never invented for an install that has none | P1 | `[NS-42-R12] the first agreement reaches the account` |
| NS-42-R13 | Given any store build, Then no agreement, notice or privacy line names an invitation, "the people you invite" or "the family you invite" while co-parent sharing is off (CG3) | P0 (a)(b) | `[NS-42-R13] no promise about invites in a store build` |
| NS-42-R14 | Given the Privacy links on the age screen, the Welcome and the Terms step, Then each opens the policy at its "What we collect" section (notice at collection) | P1 | `[NS-42-R14] privacy links open what we collect` |
| NS-42-R15 | Given AX5 on SE 3, Then the agreement line and links are fully visible above the buttons they govern without scrolling past them | P0 (b) | `[NS-42-R15] the agreement line is visible at AX5` |
| NS-42-R16 | Given "Not now" on the Terms step, Then nothing is recorded, nothing syncs, and the book on the phone (if any) is unchanged | P0 (b) | `[NS-42-R16] Not now records nothing` |
| NS-42-R17 | Given the sensitive-data consent was agreed, Then Me, Privacy has a withdrawal control; When the person withdraws, Then sync stops at once, the sheet offers to delete what is on our servers, and recording, reading and export keep working on the phone (Privacy 9: built before anyone outside the family signs in). Read of `apps/mobile/src/app/settings/privacy.tsx` at the 20 Nov head: the sync row is read-only, "no withdrawal yet"; `mobile` re-reads it before the first-run consent PR merges, and if the control already exists this row is a test title only (E46) | P0 (a)(b) | `[NS-42-R17] withdrawing stops sync and offers deletion` |
| NS-42-R18 | Given the Welcome and the Terms step, Then two plain sentences at the point of collection say what we collect and why (the notice at collection), above the links of R14. The words are PROPOSED and the founder approves them; until then the first-run build ships R14 (the links) and no notice text (E51) | P0 (a)(b) | `[NS-42-R18] the notice is shown where we collect` |

### 8. Non-functional budgets
- Latency: `record_policy_act` p95 300 ms (F02 section 9); the step change p95 2 s on LTE (PROPOSED).
- Memory, storage, battery: negligible.
- Offline: section 6.
- Accessibility: NS-42-R15; NS-33 rows.
- Localisation: English sheets (BRIEF decision 6).
- Privacy (log canary): no consent text, answer or user id in logs; rows are content-free.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Retry after a lost answer | One row | `[NS-42-R8]` |
| Killed on a step | Sheet or held screen; never the child step | `[NS-10-R0]` |
| New version | Re-consent before sync | `[NS-42-R10]` |
| Decline | Local only; leave still possible | `[NS-42-R5]`, `[NS-42-R11]` |
| Kill switch: `serverFeaturesEnabled()` off | Local rows only | `[NS-42-R2]` |
| Card's remote pause | None (D-066) | n/a |
| Plan lapse | No change | n/a |
| Second account | Per-account server rows | `[NS-41-R6]` |
| Sign out, Erase everything | Server rows stay with the account; local rows removed by Erase everything | existing erase tests |

### 10. Data and engineering
- Fields: local agreements table (schema v10, `lib/db/repos/agreements.ts`); server `public.policy_acceptances` (append-only) through `record_policy_act`; `policy_versions`.
- Migrations: `20261108000000_consent_record_fields.sql` (PRIV-R21 fields; pending apply). When `app.consent_fields_required` turns on, a row without the fields is refused (23502), so the app's shared builder (BL-577) lands first.
- Sync field group, export: `consent_history` in the export when readable.
- Modules: `lib/agreements.logic.ts`, `lib/age-gate.ts`, `components/gate/age-gate-screen.tsx`, `lib/auth/consent.ts`, `app/(auth)/sign-in/consent.tsx`, `components/onboarding/welcome-sign-in.tsx`.
- Flags: none; remote pause: none.
- Error codes: section 6 last row.
- Rollout and rollback: the builder lands before the server flag; rollback turns the server flag off.

**Built today.**
- Local box and rows, unticked every visit, reasons in words: built (`agreements.logic.ts:57-73`, `age-gate-screen.tsx:75,156`).
- Agreement line above the Welcome buttons: built (`welcome-sign-in.tsx:57-58`).
- Server Terms and sensitive-data rows with idempotency: built (`consent.ts:92-119`). Missing PRIV-R21 fields (rendered hash, app build, OS major) and a constant locale `'en'` (`consent.ts:113`). Backlog: BL-577 (app half, not yet).
- No `privacy` row at sign-in; F02 6.2 step 4 asked for a `privacy` acknowledge beside `terms`. Q-D (agree or acknowledge the Privacy Policy) is open.
- Local rows never uploaded. Backlog: BL-579.
- Version constants `4.1.0` and `3.0.0` on the phone while the links open the unversioned `/terms` and `/privacy` (D-144 left them unversioned); whether those pages serve 4.1.0 and 3.0.0 is UNVERIFIED (compliance G9). Privacy 3.0.0 is "draft-for-counsel" with no effective date, yet the phone records it as accepted. Backlog need: versioned links and a pinning test (new row), and the founder publishes the texts the phone records.
- Links open the top of `/privacy`, not the collection section (compliance G10). Backlog need: anchor links (with `content` and the website).
- `authCopy.consent.terms.body` (registered) says "Your letters stay private to you and the family you invite."; `en.trust.signIn.privacy` says "Only you and the people you invite can read your letters." Both are false in a store build (CG3). Backlog need: `content` with counsel; founder merges legal-adjacent text.
- Withdrawal control: D-128 says it is built before anyone outside the family signs in; not verified in this read (UNVERIFIED).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Local agreement rows (Terms, Privacy) | Proof of what was agreed before any account | Required to pass the age screen | Box unticked every visit; versions from constants; SHA-256 of the rendered sentence | L2 | Phone, local agreements table | Install; Erase everything | Not today (UNVERIFIED); after the consent-history sync row via `consent_history` |
| Server Terms row | LEGAL-REQ-001 | Required for any server feature | Current published version only; `age_attested: true` only; allowlisted context keys | L2 (profile id L3) | `public.policy_acceptances`, append-only | Account life, then pseudonymised for the period in Privacy 7 (3 years per the compliance input; counsel sets it, Q41 (e)) | Yes, `consent_history` |
| Server sensitive-data row | LEGAL-REQ-006 (consumer health data: a due date shows a pregnancy; Washington MHMDA, Connecticut) | Required for sync; decline allowed | `accept` or `decline` | L2 (profile id L3) | as above | as above | Yes |
| Permission states (microphone, notifications) | Know whether to ask | Set by iOS | n/a | L2 | iOS | iOS's | No |
| Never | IP address, user agent, device model, IDFV, push token, an age, the person's name in a consent row | | | | | | |

### 12. Door lines
- **Shown:** E-S03: the box sentence and two links. E-S02: the agreement line and two links, above the buttons. E-S07 Terms: the registered body (after the CG3 fix), the documents, the agreement line above "Agree and continue", "Not now". E-S07 sensitive data: the counsel-read words, two equal answers.
- **Records:** local rows at E-S03 (all fields above); server rows at E-S07 (PRIV-R21 fields, surface `auth.consent.terms` or `auth.consent.sensitive`, method `signin_sheet` or `consent_sheet`). Returning sheet: surface `returning_consent_sheet` (NS-10).
- **Never:** a preticked box or preselected answer; a consent bundled with a sign-in tap that records it (the Welcome line records nothing; the Terms step does); an age in any row; a one-tap sync consent from a toggle.
- **Decline:** the box: nothing stored, the app waits. Terms "Not now": nothing recorded, nothing syncs, the person stays signed in. Sensitive data "Keep on this phone": a decline row, letters stay on the phone, sync can be turned on later with the full step. A new version declined: NS-10 decline lines.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Proof of agreement | A row that names a text the person could not have read | Versioned links equal recorded versions; rendered hash | `[NS-42-R9]`, `[NS-42-R7]` |
| Consent integrity | Content uploaded before consent | Server SCCON gate; claim after consent | `[NS-42-R6]`, `[NS-41-R5]` |
| Trust | A promise about invites that the build does not offer | Content rule per build state | `[NS-42-R13]` |
| Abuse | Policy-act flooding | 60 per hour, 200 per day per person | existing server tests |

Risk checks:

| Check | Where | Pass | Fail |
|---|---|---|---|
| Box ticked with a Yes | Phone | local rows | reason line |
| Version current | Server `record_policy_act` | row | `consent_unavailable` (the sheet reloads the current text) |
| `age_attested` true | Server | row | refused (never sent false) |
| Context keys allowlisted | Server | row | refused |
| PRIV-R21 fields present (after the flag) | Server | row | 23502, shown as `consent_unavailable` |
| Consent before content | Server `require_content_consent` | write | SCCON, outbox pauses |

### 14. Never
- Never record an agreement the person did not make (no row "made up from use", `agreements.logic.ts:76-81`).
- Never a dark pattern: no preticked box, no unequal answers, no consent hidden in a sign-in tap.
- Ruling D3, D2: n/a because no letter text.

### 15. Design inputs
E-S03 (default, reason-noTick, agreeOnly), E-S02 footer (agreement line and links above the buttons at every size), E-S07 (settingUp, terms, sensitive, declined to C-S11, error-consent_unavailable, offline), the re-consent sheet (change summary state, NEW for design if not drawn), Me, Privacy sync row (On, Off, Finish setting up). AX5 on SE 3: the agreement line never scrolls under the buttons. Components: AgreementRow, ListRow, Button.

### 16. Content inputs
REUSE `en.beforeBegin.*`, `authCopy.sheet.agreeLine`, `authCopy.consent.terms.*`, `en.sensitiveConsent.*`, `authCopy.account.finishSetup`. PROPOSED `system.consentNeeded.line` (WORDS 9). CHANGE (counsel, founder): `authCopy.consent.terms.body` and `en.trust.signIn.privacy` lose the invite clause (CG3; intent "Your letters are private to you. We never sell them, use them for ads or use them to train machine learning models."); `en.trust.signIn.why` becomes the words-only truth (CG4; intent "Your letters' words come with you to a new phone."). A re-consent change summary key (PROPOSED, `content` names it). `content` writes; counsel reads; the founder approves registered lines.

### 17. Legal, privacy and compliance inputs
PRIV-R21 (`docs/engineering/07-privacy-engineering.md:53-75`); LEGAL-REQ-001, -006, -008, -009; POLICY_VERSIONING; notice at collection, 11 CCR 7012 (whether the CCPA applies at our size: Q20); Washington MHMDA and Connecticut for the sensitive-data step (LEGAL-REQ-006 note); Q-D (Privacy accept or acknowledge); Q41 (e) consent-row retention; Q44 (re-consent). Counsel must confirm.

### 18. Label effect
**Label effect.** None: consent rows are records of the person's own choices, already declared with the account (counsel confirms, Q54).

### 19. Claims
Enables: "We never sell your letters, use them for ads or use them to train machine learning models." (registered). Forbids: "shared only with the family you invite" and "only you and the people you invite" in store builds (CG3); "your book is safe in your account" (CG4).

### 20. Free or Plus
Free; n/a.

### 21. Measures with analytics off
Server aggregates, content-free: Terms accepts per day; sensitive-data accept and decline counts (numbers only, never per person). Support tally: "confused by the agreements".

### 22. Dependencies and gates
BL-577 before `app.consent_fields_required` is turned on; BL-579; the founder publishes the versions the phone records; CG3 and CG4 text changes before the store build reaches anyone outside the family; counsel Q-D, Q20, Q41, Q44.

### 23. Open questions
- O-9 Three agreement moments in a row (the box, the Welcome line, the Terms step). Owner: Karma with the CLO role. Default: keep all three for 1.0 as built (each is decided: F2, D-138, PRIV-R21); upload the local rows at first sign-in (BL-579) so the account holds the first agreement; revisit after counsel Q-D. Do not merge screens near submission.
- O-10 PRIV-R21 fields on server rows. Owner: `mobile` with `data-architect`. Default: BL-577 lands before the server flag; locale from the shown sheet.
- O-11 Versioned links and notice at collection. Owner: `content`, website, founder (publishing). Default: links open the versioned page that matches the recorded version, at its "What we collect" anchor; a test pins versions to links.

---

## NS-43. Setting up the first book (candidate: none; cited row C44; F03, F12)

### 1. Who and when
A new account with no book (store build), or a person who chose Start on this phone in an outage, or a servers-off build. Right after consent (NS-42), before Home. Never a returning account whose book may be on its way (NS-10-R0, NS-41-R14).

### 2. Why
The book needs only what makes it the child's: the date that places each letter in a month (birthday or due date), optionally a name, and how the parent signs. Everything else waits or is never asked (F03 Never: no surname, gender, photo, weight, birthplace, contacts). Short steps keep the first letter inside the 90 s budget (F03-REQ-008). Evidence: [F] F03 sections 6 and 7; `components/onboarding/child-step.logic.ts:1-28`; `packages/core/src/child.ts:13-122`; `20261109000000_child_name_optional.sql:58-87`.

### 3. What, and Not in scope
**What.** E-S08 in order: what we promise (the small fix sample), who the book is for (name, born or expecting, the date, twins), what the child calls the parent, the language row (multi-language builds only), "The book is open." with the speech ask (NS-39's rule); every field's validation on the phone and on the server, its class, retention and export; which steps can be skipped; where the data goes before and after consent.
**Not in scope.** Later books (Me, "Add a child": the name stays required there, NX-31-R28). Reading size and goals (F03, later). The reminder ask (NS-13). The lock offer: removed from this step (NS-39-R9).

### 4. Happy path
1. E-S08.promise: "Exactly as you said it." with the small fix shown, not described. Continue.
2. E-S08.name: "Who is this book for?"; a name field marked optional (`nameOptionalLabel`, `nameOptionalHelp`), then born or not yet here as two equal choices, then the birthday or the due date (a wheel; the system compact picker at AX3 and above). "Add another" (quiet) for twins or more. Continue.
3. E-S08.signsAs: "What does {child} call you?" with example chips and "Not talking yet? Pick the name you hope to hear."; the cover shows "From {signsAs}". Continue ("Sign my letters").
4. E-S08.open: "The book is open." "Say one thing about {child} today. That is a letter." The cover opens; no haptic here (design ruling 33, E68; the first Keep keeps its one success, NS-44-R12). The speech card (NS-39). The one filled button leads to Home.
5. Home (NS-35: first run ends on Home), with the book active.
The books are written to the phone when step 4 is reached; with a session and consent they are queued to the server (`create_first_run_children` or `create_child`, idempotent on the phone's UUIDv7, `store.ts:334-349`).

### 5. Unhappy paths and edge cases

| Case | What the person sees (key) | Way forward |
|---|---|---|
| Continue with no date (born) | "Choose {child}'s birthday to continue." above Continue; after a tap on the waiting Continue, the warning glyph on its own chip and focus to the date (`needBirthday`) | Pick a date |
| Continue with no due date | "Choose the due date to continue." (`needDueDate`) | Pick |
| Birthday in the future | "Choose today or an earlier day." (`childrenExtra.edit.birthdayFuture`) | Pick |
| Birthday before 1900-01-01 or not a real day | "That date does not look right. Try again." (`childrenExtra.edit.dateInvalid`) | Pick |
| Due date in the past or more than 305 days ahead | "Choose a due date from today up to ten months ahead." (`childrenExtra.edit.dueDateRange`) | Pick |
| Name empty, one book | Allowed: the book is made with an empty name; "your child" is shown in its place and never stored | Add a name any time in Me |
| Name over 60 characters | "A name can have up to {n} characters." (`nameLimit`); never cut silently | Shorten |
| Twins or more, any name empty | "Fill in or remove this name to continue." (`needNameMany`) | Type or remove |
| Seventh child | "Add another" is hidden at 6 (`MAX_FIRST_RUN_CHILDREN`, `onboarding.tsx:97`) | Add later in Me |
| Siblings with different birthdays | As built, one date applies to every child added together (`onboarding.tsx:287-293`); F03-REQ-001 asks for one date per child (open item O-14) | Add the other book later in Me |
| Signs-as empty | "Add what {child} calls you to continue." (`signsAs.needSignsAs`; plural form for twins) | Type or pick a chip |
| Signs-as over 30 | Near the limit, the helper "Up to {n} characters." (`signsAsLimit`); Continue waits with the reason | Shorten |
| Name in Devanagari, Arabic, with diacritics, or an emoji | Stored exactly as typed after NFC; length counted in code points (`child.ts:57-68`); never transliterated | n/a |
| A name or signs-as typed in two Unicode forms | One stored form (NFC) | n/a |
| Due date passes later | No notification or card; the book's settings later offer the birth date (F03-U08) | n/a |
| Adoption or only the month known | Pick the first of the month (F03-U09; month precision is later) | n/a |
| "My partner already started one" | No co-parent door in store builds (D-161, D-162); the help does not mention invites | n/a |
| Session gone at the last step (signed out elsewhere, one frame before the route changes) | No book is made with no account (`finishMayMakeBook`, `onboarding.tsx:283-284`); the Welcome returns | Sign in |
| Double tap on the last button | One set of books (`finish` guarded) | n/a |
| The server refuses a book (22023 date out of range after a clock error; SCDEL for a deleted id) | Nothing shown on Home; the book stays on the phone and is never deleted (D-038); the outbox sets the op aside (WORDS 4.3) | Fix the date in Me; support |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card |
| Empty | The new book is empty; Home shows the first prompt |
| Many | n/a (a new book) |
| Offline | Every step is local; with a session the queued books send when the connection returns |
| Slow | Steps are local; no wait |
| Failed | Server refusal row in section 5 |
| Interrupted (call, Siri, alarm, the baby) | The step stays as left with its typed values |
| App killed mid-flow | Before step 4: nothing is saved; inputs are lost (under 60 s of typing, F03-U12); relaunch returns to the first step. During step 4: each book is its own transaction (`store.ts:338-346`), so twins may be partly made (F03-REQ-002 asks one transaction; O-14) |
| App updated mid-flow | Same as killed |
| Low storage (under 1 GB, under 50 MB) | No warning in first run; the speech card names its space |
| Low Power Mode | The lamp's breathing stops; the cover still opens (no loop) |
| Kill switch `serverFeaturesEnabled()` off | The same steps; the books stay on the phone; no signed-in note |
| Outage | Local start: the same steps; the books join an account later only through E-S24 |
| Card's remote pause | None (first run is local) |
| Plan lapsed | n/a for a new account; books are always free (D-007, F03-REQ-011) |
| Signed out | A local start; Me offers sign-in |
| Second account on the same phone | Account B with no book makes its own book; A's stays hidden (O-5) |
| New phone | Never reached while the account may hold a book (NS-10-R0) |
| Two books | Twins: one book each, made together, all free |
| Two parents | n/a in store builds |
| Expecting parent | Due-date path; the book is "Before You" until the birth date is set |
| Devanagari, RTL | Names stored as typed; RTL fields right to left |
| AX5 plus Bold Text on SE 3 | One column; the field and its label stack; the wheel becomes the compact picker at AX3 and above; Continue pinned; the cover steps aside |
| VoiceOver | Focus to each step's heading; the born/expecting choice reads its state; the reason line is the Continue hint and is announced; each child row is a group "Child 1 of 2" |
| Voice Control, Switch Control | Visible labels; the date has a button form |
| Reduce Motion | The cover opens with a fade |
| Dark mode, Increase Contrast, Smart Invert | Tokens; the cover ignores invert |
| Every error code | `needBirthday`, `needDueDate`, `needNameMany`, `nameLimit`, `birthdayFuture`, `dateInvalid`, `dueDateRange`, `needSignsAs`, `needSignsAsMany`, `signsAsLimit`; server 22023 and SCDEL (silent, section 5); SCCID (a reused id, silent) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-43-R1 | Given a birthday and no name, When the last step is reached, Then one book exists with an empty stored name, "your child" is shown, and nothing was asked about surname, gender, photo or contacts | P0 (c) | `[NS-43-R1] only the date is required` |
| NS-43-R2 | Given no date, Then Continue waits with the reason in words, announced, and no book is made | P0 (c) | `[NS-43-R2] a missing date says why` |
| NS-43-R3 | Given a birthday after today, before 1900-01-01 or not a real day, Then the phone refuses it with its line; Given a due date before today or more than 305 days ahead, Then the phone refuses it; the server refuses a birthday after tomorrow or before 1900 and a due date over 310 days ahead or 400 days back (22023) | P0 (c) | `[NS-43-R3] dates are real and in range on both ends` |
| NS-43-R4 | Given a name of 61 code points after NFC and trimming, Then the phone shows the limit line and the server refuses it; a name in any script up to 60 is stored exactly as typed in NFC | P0 (a) | `[NS-43-R4] names in any script, never cut` |
| NS-43-R5 | Given twins with one empty name, Then Continue waits with `needNameMany` | P1 | `[NS-43-R5] each twin needs a name` |
| NS-43-R6 | Given three children added together, Then three books exist, no Plus surface appeared, and the server accepts all three | P0 (a) | `[NS-43-R6] every first-run book is free` |
| NS-43-R7 | Given signs-as empty or over 30 code points, Then Continue waits with its reason; a valid value signs the first letter "From {signsAs}" | P0 (c) | `[NS-43-R7] the signature before the first letter` |
| NS-43-R8 | Given a returning account whose book may be on its way, Then this card's screens are never shown (NS-10-R0) | P0 (a) | `[NS-43-R8] no child step for a returning account` |
| NS-43-R9 | Given a kill before the last step, Then no book exists and relaunch starts the steps again; Given a kill during the last step, Then no partial book set exists (all books or none) | P1 | `[NS-43-R9] the first books commit together` |
| NS-43-R10 | Given the last step, Then the person lands on Home with the new book active and no sheet, prompt for permission, Plus surface or lock offer in front | P0 (c) | `[NS-43-R10] first run ends on Home` (with NS-35) |
| NS-43-R11 | Given an English-only build, Then no language row and no "other languages are coming" line appear (NS-17-R1, K-E01) | P0 (a) | `[NS-43-R11] no language teaser in first run` |
| NS-43-R12 | Given the signs-as field, Then system writing tools are off on it (ruling D2) | P1 | `[NS-43-R12] writing tools off on the signature` |
| NS-43-R13 | Given AX5 on SE 3 and VoiceOver, Then every field, choice and reason is reachable and read in order, and nothing truncates | P0 (b) | `[NS-43-R13] the first book at AX5 and with VoiceOver` |
| NS-43-R14 | Given a server refusal of a first-run book, Then the book stays on the phone, nothing is deleted, and nothing on Home says an error | P0 (a) | `[NS-43-R14] a refused book is never deleted` |

### 8. Non-functional budgets
- Latency: each step interactive within 300 ms on SE 3; the last step's write p95 100 ms (F03 section 9); total steps p50 40 s or less in the scripted run.
- Memory, storage, battery: negligible.
- Offline: all steps.
- Accessibility: NS-43-R13.
- Localisation: English UI; names in any script.
- Privacy (log canary): no child name, date or signs-as in any log, crash report or analytics event (`child_added` carries booleans and ordinals only, and is dropped without analytics consent).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch: `serverFeaturesEnabled()` off | Local books | `[NS-43-R1]` |
| Card's remote pause | None | n/a |
| Plan lapse | Books free | `[NS-43-R6]` |
| Second account | B's own book; A's hidden | `[NS-41-R6]` |
| Retry after a lost answer | Idempotent `create_child` on the phone's id | existing server tests |
| Sign out before sync | Books stay on the phone (D1) | `[X4-R1]` |

### 10. Data and engineering
- Fields: local `children` (id UUIDv7, name, birthday, due date, signs-as), settings `activeChildId`; server `children` (name, `date_of_birth`, `due_date`), `child_members`, the parent's sign-off (signs-as, at most 30). No new field.
- Migrations: none new. `20261109000000_child_name_optional.sql` (empty name allowed; ranges) must be applied before store builds send empty names (pending apply, UNVERIFIED on production).
- Sync field group: `book.create`, `book.first_run` ops; the `entries` content trigger tuple is not touched.
- Export: the book's name, dates and signs-as are in the export (existing).
- Modules: `app/onboarding.tsx`, `components/onboarding/child-step.logic.ts`, `packages/core/src/child.ts`, `lib/store.ts` (`addChild`), `components/child/date-field*`, `lib/first-run/handoff.logic.ts`.
- Flags: `showOnboardingLanguageRow` (build languages). No remote pause.
- Error codes: section 6 last row.
- Rollout and rollback: ships on; revert.

**Built today.**
- Name optional for the first book, limits and reasons in words: built (`child-step.logic.ts:16-28`, `child.ts:84-91`).
- Date rules on the phone (`child.ts:104-122`) and on the server (`20261109000000:79-82`): built; the security input's "no server range check" (G19) is corrected here: the ranges exist in `create_child_row`.
- One shared date for all first-run children (`onboarding.tsx:287-293`) against F03-REQ-001 (P0 there). O-14.
- One transaction per book, not per first run (`store.ts:338-346`) against F03-REQ-002. O-14.
- Lock offer at the last step (`onboarding.tsx:577-579`): remove (NS-39-R9).
- Dictionary seed from names (F03-REQ-010): not found in `addChild`; UNVERIFIED elsewhere. Backlog need if absent: a `mobile` row under F07.
- Writing tools on the signs-as field: BL-962 checks whether React Native can turn them off.

### 11. Information collected

| Field | Why | Required or optional | Validation (phone; server) | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Born or expecting | Which date to ask | Required (one of two) | one choice; server needs a birthday or a due date (22023) | L2 | Phone (implied by which date is set) | With the book | Implied |
| Child name or nickname | Whose book; the cover; seeds the dictionary | Optional for one book; required for each when several | NFC, trimmed, 0 to 60 code points (1 to 60 for twins); server `char_length(name) <= 60`, trimmed, `''` for empty | L4 (children.name, class S, per the migration header) | Phone `children`; server `children` after consent | Until the book or the account is deleted; phone copy until Erase everything | Yes |
| Birthday | Month chapters, age math | Required if born | real day, 1900-01-01 to today; server to tomorrow (time zones) | L4 (`children.date_of_birth`) | Phone; server after consent | As name | Yes |
| Due date | "Before You" chapter | Required if expecting | today to 305 days ahead; server 400 back to 310 ahead | L4, consumer health data (a pregnancy, K-25, Q32) | Phone; server after sensitive-data consent | As name | Yes |
| What the child calls you (signs-as) | Signs every letter "From {signsAs}" | Required | NFC, trimmed, 1 to 30 code points (E10); server at most 30 | L3 | Phone; server | As name | Yes |
| Languages (multi-language builds) | Which speech model | Optional (English default) | gated languages only | L4 per PRD 7.10 (can proxy ethnicity) | Phone | Install | UNVERIFIED |
| Active book | Which book Home shows | Automatic | an id | L2 | Phone settings | Install | No |

Never asked: surname, gender, photo, birth weight, birthplace, contacts, the parent's own name or age.

### 12. Door lines
Settings, not agreements: "Records: on the phone only (and in the account after consent); no PRIV-R21 row, because these are the book's details, not an agreement." The sensitive-data consent (NS-42) is what lets the due date and the name leave the phone.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Child details | Logged or sent to analytics | No content in logs; `child_added` is booleans and dropped without consent | log canary |
| Child details | Sent before consent | Books queue; the server refuses content before consent (SCCON) | `[NS-42-R6]` |
| A book | Deleted after a server refusal | Never deleted (D-038) | `[NS-43-R14]` |
| Dates | A wrong clock makes a bad date | Phone and server ranges | `[NS-43-R3]` |

Risk checks: every field is validated on the phone (convenience) and the name and dates again on the server (the control). There is no identity, age or location check in this card.

### 14. Never
- Never ask for anything the book does not need. Never preselect a child's gender or ask it.
- Ruling D2: writing tools off on the signs-as field (`[NS-43-R12]`); the name is not a letter's words but is treated the same (PROPOSED).
- Ruling D3: no child name or date donated to Spotlight, Siri suggestions or App Intents (`[X6-R1]`).

### 15. Design inputs
E-S08 (promise, name, name-waiting only for twins and the servers-off path per WORDS 12a, date, born/expecting, twins, signsAs, languages in multi-language builds only, open with the speech card and without the lock offer). AX5 on SE 3 per section 6. Components: TextField, ChoiceGroup, Chip, DateField, BookCover, the speech card.

### 16. Content inputs
REUSE `en.onboarding.child.*`, `en.onboarding.signsAs.*`, `en.onboarding.promise.*`, `en.onboarding.finish.*`, `childrenExtra.edit.*`, `speechConsentCopy.*`. Remove any first-run line that mentions an invite or a partner's book (store build). `languageCopy.picker.englishOnly` stays absent (K-E01). `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Q32 (due date as consumer health data), Q45 (children), LEGAL-REQ-006 (the sensitive-data consent before the due date leaves the phone). Counsel must confirm.

### 18. Label effect
**Label effect.** None new: the child's name and dates are already declared as User Content once synced (NS-38-R4). Counsel confirms the due date's category (health) for the label (Q54).

### 19. Claims
Enables: "Only a birthday or due date to start." Forbids: "no personal information needed".

### 20. Free or Plus
Free. Every first-run book is free (D-007, F03-REQ-011); no Plus surface (NS-44).

### 21. Measures with analytics off
Tester questions: "How long did setting up the book feel? (short / fine / long)", "Was anything asked that you did not want to give? (yes / no)". x of n. Scripted run: steps p50 on SE 3.

### 22. Dependencies and gates
`20261109000000` applied to production before store builds send empty names; NS-39-R9 (lock offer removed); BL-962 (writing tools); O-14.

### 23. Open questions
- O-14 First-run siblings and atomic commit. Owner: CPO role, `mobile`. Default: keep one shared date in first run for 1.0 (twins share it; a sibling with another date is added later in Me, and the "Add another" help says so); make the first-run books one transaction (P1, `[NS-43-R9]`). Draft change for the founder: F03-REQ-001 becomes P1 "each first-run child has its own date" in a later release.

---

## NS-44. The first letter and the allowance (candidate: none; cited row C25; area A owns the capture screens)

### 1. Who and when
P1 or P3 on Home for the first time, minutes after the book opened; also the second and third letters, where the free allowance and the one Plus gate are met.

### 2. Why
The first letter is the product's promise kept: a parent talks for a minute (or types) and sees their own words, untouched. Nothing may stand between Home and that moment: no paywall before a parent has seen their words (frame guardrail), no Plus surface during first run, no permission before the tap that needs it. After that, Plus holds one paid act only: keeping a new letter beyond the first two (D-082, principle 6, T2). Evidence: [F] frame sections 2 and 3; `lib/billing/keep-step.ts:1-45`; `lib/billing/letter-ledger.logic.ts:1-22`; WORDS 5.8 and 5.14 steps 11 to 15.

### 3. What, and Not in scope
**What.** The path from Home to the first kept letter as it touches this pack: the microphone ask at need, words that wait for the speech model, typing instead, the first Keep, the allowance (what counts, where it is held, how it survives a reinstall), the rule that Plus never appears during first run, the third Keep and the gate, plan lapse.
**Not in scope.** Recording, Review and the faithful-edit engine (area A, F04 to F06, the constitution). The Plus purchase flow and Plan in Me (E-S10 to E-S12, F14). Reminders (NS-13).

### 4. Happy path
1. Home (A-S01): the first prompt; Speak, Type, "Not much today". No slip, no Plus line, no sheet.
2. Speak, the first time: the primer "Your phone will ask about the microphone" (`listen.primer.*`) with Continue; then iOS's prompt with `permissions.microphone` (counsel-read). Allowed: Listen is ready.
3. Recording (A-S05): the take is on the phone as it is made; Pause, Finish.
4. Review (A-S07): the person's own words, with the first Review note once (`review.firstNote.*`, the registered "we can mishear" place).
5. Keep: "Add to {child}'s book" or "Keep private". "Kept." The success haptic marks the person's own act (K-3). The letter counts toward the free allowance once, because it has words (M17).
6. The second kept letter: the same; then, once and in a store build only, the Book's toast "That was your second free letter. Whenever you are ready, Plus keeps the book growing." (`billingCopy.keepGate.secondFreeNote`). This is the first time the person reads the word Plus inside the app.
7. The third Keep (Plus off): E-S10 rises over Review with the held letter, "Keep adding to {child}'s book", See Plus, "Keep it here for now", Redeem a code. Recording, typing, reading, playing, Find, Read together and export are never gated.

### 5. Unhappy paths and edge cases

| Case | What the person sees | Counts toward the allowance |
|---|---|---|
| Microphone denied | Listen's built state "The microphone is off / Turn it on in Settings, or type this one." with Open Settings and Type instead (`en.errors.micDenied.*`) | n/a |
| Microphone in use (a call) | "The microphone is in use / A call or another app has it right now." | n/a |
| Speech model not on the phone (Not now, still downloading, no space) | The recording is kept and waits for its words; Review offers the same download button; nothing is lost (NS-39-R4) | Not until it has words (M17) |
| Typed instead | Write: the typed words are the letter | Yes, when kept with words |
| A save with no words (marks only, silence) | Saved as the person left it; never counted | No (M17) |
| A kept note | Same as a letter | Yes (D-133) |
| Deleting a kept letter, undo, moving, editing | No change to the count (the ledger never decreases) | Unchanged |
| Reinstall on the same phone | The allowance does not start again: the ledger is held in the Keychain (survives a reinstall), mirrored in settings (survives a device backup restore), and checked against the letters present; the largest wins (`letter-ledger.logic.ts:9-19`) | Unchanged |
| Erase everything | "Your free letters start again." (D-144, quiet text) | Reset, by decision |
| Plus status unknown at the third Keep (StoreKit not answered) | No sheet; the letter is held; Review says it waits (`hold` gate, RT-PLS-10) | n/a |
| Offline at the third Keep | E-S10.offline: `keepGate.offline`; See Plus not offered; "Keep it here for now" is primary | n/a |
| "Keep it here for now" | Review closes; Home shows "Waiting to be kept." (slip 1); any later Keep asks again | No |
| Apple's purchase sheet cancelled | Back to E-S10 unchanged | n/a |
| Killed mid-purchase | StoreKit finishes on next launch; Plan shows the state; the held letter waits on Home | n/a |
| iOS below 17, or StoreKit unavailable | E-S10.needsNewerIos or .unavailable; the hold button stays | n/a |
| Alpha build | No gate; Plan says `alpha.note` | n/a |
| Plan lapsed | Every past letter opens, plays, is found and exports; recording and typing work; only a new Keep meets E-S10 with `keepGate.lapsedBody`; Home shows one standing line (E-S26) | n/a |
| `freeLettersAllowance` raised remotely | The gate meets later; it can never be lowered below 2 (`effectiveFreeLetters`, `packages/api/src/remote-config.ts:133-134`) | Raises only |
| Killed mid-take or mid-Review | Relaunch: Home with "Recorded before the app closed." (slip 1) | Not until kept |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This card |
| Empty | Home's first prompt; the Book's empty state points to Home |
| Many | n/a for a first letter; the ledger is one number |
| Offline | Capture, Review and Keep within the allowance are local; the gate's purchase needs a connection (E-S10.offline) |
| Slow | Keep hand-off within 2,000 ms (`motion.hardCeilingMs`); the gate decision is local (Keychain ledger, cached StoreKit status), never a network wait (DESIGN section 9, G-E13) |
| Failed | Save failed: "Not saved to the book yet / Your words are safe on this phone." (area A) |
| Interrupted (call, Siri, alarm, the baby) | The take is kept (area A's interrupted state) |
| App killed mid-flow | Waiting card on Home |
| App updated mid-flow | Same as killed; the ledger is unchanged |
| Low storage | Under 1 GB: Listen's calm line (PROPOSED, not built, G4); under 50 MB: "This phone is full" with Type instead; under 20 MB mid-take: stopped and kept (area A) |
| Low Power Mode | No change to capture; decorative loops stop |
| Kill switch `serverFeaturesEnabled()` off | Capture and Keep unchanged; the gate is the same (Plus is on the phone, D-053) |
| Outage | No effect on capture or the gate (no server in the decision) |
| Card's remote pause | None: capture has no switch (LEGAL-REQ-040); `statusReport` silent |
| Plan lapsed | Section 5 row |
| Signed out | Capture and Keep unchanged |
| Second account on the same phone | The ledger is per phone, not per account (one number in the Keychain); B's first letters count against the same number. Open item O-13 |
| New phone | The ledger mirror arrives only with a device backup; the letters that arrive by sign-in count (source 3), so a returning parent does not get new free letters for letters already kept |
| Two books | One allowance across books (per account in principle, per phone as built) |
| Two parents, expecting | No change |
| Devanagari, RTL | `hasWords` counts letters and digits in any script |
| AX5 plus Bold Text on SE 3 | E-S10 footer holds See Plus and "Keep it here for now" only; the rest scrolls |
| VoiceOver | E-S10 is modal; focus on the title; the held card reads "Waiting. {first line}. From {signsAs}"; escape returns to Review unchanged |
| Voice Control, Switch Control | Visible labels |
| Reduce Motion | The sheet fades |
| Dark mode, Increase Contrast | Tokens; the Waiting chip is text plus a dot, never colour alone |
| Every error code | `mic_denied`, `micBusy`, `storage_low` (area A); `JobFailure.*` (words); E-S10 `offline`, `codeFailed`, `needs_ios_17`, `unsupported`; restore nothing or failed (E-S11) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-44-R1 | Given a fresh install from the App Store page to the first kept letter, Then no price, trial, Plus name, Plus button or Plus sheet was shown at any step | P0 (a) | `[NS-44-R1] Plus never appears in first run` |
| NS-44-R2 | Given the first and second Keep with words, Then neither meets E-S10, and both count once each | P0 (a)(c) | `[NS-44-R2] the first two letters are free` |
| NS-44-R3 | Given the third Keep with words and Plus off, Then E-S10 rises only after the words were on screen, and recording, typing, reading, playing, Find, Read together and export remain open | P0 (a) | `[NS-44-R3] the one gate, after the words` |
| NS-44-R4 | Given a save with no letters or digits in its text, Then it never counts and never meets the gate | P0 (a) | `[NS-44-R4] a save with no words never counts` |
| NS-44-R5 | Given two kept letters, When the app is deleted and reinstalled on the same phone, Then the third Keep still meets the gate (unless the Keychain item was lost, which errs toward a gift) | P1 | `[NS-44-R5] reinstall does not reset the allowance` |
| NS-44-R6 | Given the microphone never asked, Then the primer comes before iOS's prompt, and a denial leads to Type instead with no dead end | P0 (b)(c) | `[NS-44-R6] the microphone at need, with a way around` (with NS-39-R10) |
| NS-44-R7 | Given the speech model not on the phone, When a letter is recorded, Then the recording is kept and its words arrive once the model does | P0 (a)(c) | `[NS-44-R7] the first recording waits for its words` |
| NS-44-R8 | Given Plus status unknown at the third Keep, Then no sheet shows and the letter is held, never discarded | P0 (a) | `[NS-44-R8] unknown Plus holds, never loses` |
| NS-44-R9 | Given "Keep it here for now", Then the letter waits on Home exactly as it is, and any later Keep asks again | P0 (a) | `[NS-44-R9] a held letter waits as it is` |
| NS-44-R10 | Given a remote `freeLettersAllowance` below 2, Then the phone uses 2 | P0 (a) | `[NS-44-R10] the allowance never drops below two` |
| NS-44-R11 | Given the second kept letter in a store build, Then `secondFreeNote` shows once as a toast, never as a sheet, and never in an alpha build | P1 | `[NS-44-R11] the second free letter is said once` |
| NS-44-R12 | Given the first Keep, Then the success haptic plays once and no confetti, badge, count or streak appears | P0 (a) | `[NS-44-R12] the first letter is quiet` |
| NS-44-R13 | Given the Review to Keep hand-off on an SE 3, Then E-S10 (when due) rises within 2,000 ms with no network wait in the decision | P1 | `[NS-44-R13] the gate decision is local` |

### 8. Non-functional budgets
- Latency: first letter within 90 s of the age answer in the scripted run (F03-REQ-008); Keep hand-off 2,000 ms ceiling.
- Memory, storage, battery: 06-nfr and NS-34 (a 30-minute take uses 5% of battery or less on an SE 3, D-138).
- Offline: all of section 4 except the purchase.
- Accessibility: NS-33 core loop rows; E-S10 rows.
- Localisation: English UI; letters in the build's languages.
- Privacy (log canary): no letter text, transcript or audio in logs (CLAUDE.md); `free_allowance_reached` carries numbers only and is dropped without analytics consent.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Kill switch: `serverFeaturesEnabled()` off | Same allowance and gate | `[NS-44-R2]` |
| Card's remote pause | None for capture (LEGAL-REQ-040); `freeLettersAllowance` raises only | `[NS-44-R10]` |
| Plan lapse | Only a new Keep meets the gate | J-N25 |
| Second account on the same phone | One phone ledger (O-13, ruled per phone, E59) | n/a: per phone, a second account shares the number (E59) |
| Reinstall | Allowance holds | `[NS-44-R5]` |
| Restore from a device backup | Mirror and letters restore the count | existing ledger tests |

### 10. Data and engineering
- Fields: the ledger (Keychain `earlyletters.letters.keptEver`, settings mirror `letters.keptEver`, the letters present), draft `held_kind`; StoreKit status cached on the phone. No new field.
- Migrations, sync field group, export: none.
- Modules: `lib/billing/keep-step.ts`, `gates.ts`, `letter-ledger*.ts`, `components/child/plus-gate*.tsx`, `app/listen.tsx` (primer), `app/review.tsx`, `components/speech/speech-consent-card.tsx`.
- Flags: `PLUS_ALPHA` (no gate in alpha). Remote: `freeLettersAllowance` (raise only).
- Error codes: section 6 last row.
- Rollout and rollback: as built.

**Built today.**
- Two free letters, counted only with words, notes counted: built (`keep-step.ts:24-45`, `letter-ledger.logic.ts`, `BUNDLED_FREE_LETTERS = 2` at `packages/api/src/remote-config.ts:36`).
- The servers-on Welcome shows no Plus line (`welcome-sign-in.tsx:128-148`): matches `[NS-44-R1]`. WORDS 5.2 lists `membership.line` there; design and content follow this card.
- The ledger is per phone, not per account (Keychain this-device-only): see O-13.
- Under-1 GB line on Listen: not built (G-E04).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| The first letter's recording | The product | Required for a spoken letter | Constitution: kept unaltered | L3, sensitive (Privacy 9) | Phone only (backup off) | Until deleted by the person | Yes |
| The first letter's words (`raw_transcript`, edits) | The product | Required for a kept letter | `verifyEdits` on every machine edit; `raw_transcript` immutable | L3, sensitive | Phone; server after sensitive-data consent | Until deleted | Yes |
| Letters ever kept (one number) | The free allowance | Automatic | Never decreases; no id, time or content | L2 | Keychain; settings mirror | Keychain: survives reinstall; Erase everything resets it (D-144) | No |
| Microphone permission | Record | Asked at first Speak | iOS | L2 | iOS | iOS's | No |

### 12. Door lines
- **Shown:** the microphone primer (our one line), then iOS's prompt with the counsel-read purpose string. At the gate: E-S10 words and the `en.plus.legal.*` disclosures above Apple's sheet.
- **Records:** permission state (iOS); the ledger number (a setting, not an agreement: no PRIV-R21 row). A purchase records Apple's transaction on the phone (D-053; F14 owns its consent rows, D-049).
- **Never:** a Plus surface during first run; a gate before the words are on screen; a count, countdown, "letters left" or "you have used"; a blocked recording.
- **Decline:** microphone denied: Type instead and Open Settings. At the gate: "Keep it here for now" keeps the letter waiting on Home exactly as it is.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| Trust | A paywall before the words, or a Plus push in first run | Gate only at Keep with words; no Plus in first run | `[NS-44-R1]`, `[NS-44-R3]` |
| A letter | Lost at the gate or while Plus is unknown | Held, never discarded | `[NS-44-R8]`, `[NS-44-R9]` |
| Revenue | Reinstall to reset the allowance | Keychain ledger plus mirror plus letters | `[NS-44-R5]` |

Risk checks: the gate decision (local ledger, cached StoreKit status), `hasWords`, the microphone permission. No identity or server check.

### 14. Never
- Never a count of gaps, a streak, a badge or "letters left" (frame guardrails).
- Ruling D2: writing tools off on the Review editor. Ruling D3: the first letter is never donated to system intelligence (`[X6-R1]`).

### 15. Design inputs
Area A owns A-S01, A-S04 (primer, blocked, full), A-S05, A-S07, A-S13. Area E: E-S10 (all states), E-S26 (absent until the allowance is used), the `secondFreeNote` toast. No new screen.

### 16. Content inputs
REUSE `listen.primer.*`, `permissions.microphone`, `en.errors.micDenied.*`, `review.firstNote.*`, `billingCopy.keepGate.*`, `billingCopy.tonight.plusLine` (CHANGE "always free" to "stay free", WORDS 9; principle 6). `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Auto-renewal disclosures at the gate (California 17602; `en.plus.legal.*`, in-app-disclosures section 3); Q41 (plan notices); Q45 (a baby's voice in a recording). Counsel must confirm.

### 18. Label effect
**Label effect.** None new (User Content and Purchases already declared; Plus status stays on the phone, D-053).

### 19. Claims
Enables: "Your first two letters are free." Forbids: "free forever", "always free" (T1, principle 6), "unlimited", "no paywall".

### 20. Free or Plus
The first two kept letters are free; keeping a third and later new letters needs Plus; everything else stays free (T2).

### 21. Measures with analytics off
Testers, numbers only: "How long from opening the app to your first kept letter? (under 2 minutes / 2 to 5 / longer)", "Did anything about Plus appear before your third letter? (yes / no)". App Store Connect: paid starts over first-time downloads by install week. x of n.

### 22. Dependencies and gates
Area A's capture cards; NS-39 (speech download, microphone primer); F14; G-E13 (StoreKit status cached).

### 23. Open questions
- O-13 One allowance per phone or per account. Owner: CBO role with Karma. Default: keep per phone as built for 1.0 (the ledger holds no account id by design, to avoid fingerprinting); a second adult on the same phone shares it. Revisit with NS-25. Ruled 20 Nov: per phone (E59); this is a promise to a user, so the default stands and is in the founder digest (`22-final-holistic-spec.md` section 7); FR-LCY-13 now says the same.

---

## NS-45. Account life after first run (candidate: none; cited rows C44, C46; area C owns the Me screens)

### 1. Who and when
Any signed-in parent, days to years after first run: signing out (a shared phone, a phone given away), being signed out (a session that ended elsewhere, Apple's link revoked, a founder-forced re-auth), deleting the account, and meeting an app update that is required.

### 2. Why
Leaving must be as clear as joining. Sign-out keeps the book on the phone, because deleting it would remove the only copy of the voice while backup is off (ruling D1). Deletion means deletion of what the account holds on our side, with a 30-day undo, and must work without agreeing to anything new (Apple 5.1.1(v), NS-10-R4a). A session that ends must never lock a parent out of reading, recording or export (NX-31-R22, LEGAL-REQ-040). An update that is required must never block the book on the phone. Evidence: [F] 16 D1, D6; `lib/auth/session-provider.tsx:293-341`; `packages/content/src/features/account-deletion.en.ts`; security input sections 1.5 to 1.7.

### 3. What, and Not in scope
**What.** Sign out (D1), Sign out other devices, session expiry and re-authentication (the refresh, the forced epoch, Apple revocation), account deletion (request, the 30 days, cancel, what happens to letters, recordings, pictures and sealed letters on the server and on the phone, Apple token revocation), deletion elsewhere, app update available and required.
**Not in scope.** Erase everything's own screen (area C, C-S19; this card states the rules it must follow with two accounts). Export (NS-11, F15). Leaving a shared book (NS-25, gated). Recording backup and its withdrawal (NS-08).

### 4. Happy path
**Sign out.** Me, Account, Sign out: the sheet "Sign out on this phone?" with the D1 words (intent: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them."). If letters are still on their way, "Your newest letters are still on their way. This phone signs out once they are sent." with "Stay signed in". Signed out: Me shows "Not signed in" with Sign in; the book reads, records and exports as before.

**Delete account.** Me, Account, Delete account: step 1 says what happens ("Deleting your account removes your letters and books from our servers. You have 30 days to change your mind."), what stays on this phone (letters stay; synced ones move to Recently deleted; recordings and pictures stay on the phone until Erase everything; a sealed letter is deleted with the account, D6), Export everything first (free), and that Plus is not cancelled by deleting (Manage subscription). Step 2: type the word "delete". Then the scheduled screen with the date, Cancel deletion, and "Sign out of this phone". Apple's stored refresh token is revoked by the purge worker.

**Update required.** When this build is below `minSupportedVersion`, or a server act answers `upgrade_required` (426, SCVER): one SystemLine at the top of Me, "This version of {app} can no longer reach your account. Recording, reading and saving still work on this phone." with "Open the App Store" (E-S16.line). Never on Home, never blocking.

### 5. Unhappy paths and edge cases

| Case | What the person sees | Data effect |
|---|---|---|
| Sign out offline | Signed out on the phone at once (the Keychain is cleared); the server session may stay alive until it expires (security G15) | Book stays |
| Sign out with letters still sending, sync able to run | The waiting line; signs out when they are sent; "Stay signed in" cancels | Nothing lost |
| Sign out while sync cannot run (declined, consent outstanding) | "Your newest letters are kept on this phone. They are sent the next time you sign in to this account." (`signOutEarly`) | Kept on the phone |
| Session ended elsewhere (Sign out other devices on another phone; refresh token rejected; account's tokens revoked) | Once, in Me: "You were signed out. Sign in again to carry on." (`session_expired`); Home unchanged | Book stays (D1) |
| Founder raises `forceReauthEpoch` | After queued letters are sent, signed out once per new number; the same line | Book stays |
| Apple's link revoked in iOS Settings | Detected at launch (and on foreground, O-18); signed out after uploads; cannot be cancelled by "Stay signed in"; the same line | Book stays |
| Offline at launch while signed in | Nothing: the session is kept (NS-41-R15) | none |
| Delete account offline | "Nothing has changed. Deleting an account needs a connection." (`deletion.offline`) | none |
| Typed word wrong | The delete button waits with a reason in words (PROPOSED) | none |
| More than 5 requests in a day | `system.waitAMoment.line` (SCRAT) | none |
| Deletion pending, then sign-in on any phone | The scheduled screen with the date and Cancel deletion | none until the date |
| Cancel within 30 days | "Deletion cancelled. Your letters and books are back, just as they were." | Restored on the server |
| Deleted on another phone while this phone waits for its book | C-S10.deletedElsewhere (NS-10-R9) | none on this phone |
| Deleted and purged; this phone opens later | Me signed out with `authCopy.newPhone.accountDeleted` intent once ("This account was deleted on another phone. You can start a new book here."); the letters on this phone stay (as built; F02-REQ-007's export-then-wipe is not built, open item O-15) | Phone copy stays until Erase everything |
| Terms version declined, then delete | Works without agreeing (NS-10-R4a) | as delete |
| Sealed letter not yet open at deletion | The step-1 sheet says it is deleted with the account (D6); on this phone it moves to Recently deleted with the other synced letters (PROPOSED: no reveal of its words anywhere before its day, NS-06 B) | Server copy deleted |
| Pictures (NS-01) | Pictures are only on the phone; deleting the account does not touch them; step 1 says so once photos ship (the built copy says "v1.0 makes no photos", `account-deletion.en.ts:15-16`, which becomes false) | Phone only |
| Plus active | Step 1 says deleting does not cancel Plus; Manage subscription opens Apple's sheet | Apple's |
| Erase everything with a second account's book on the phone | It erases every book on the phone; the sheet says "every book on this phone" and names none (O-5, K-E04) | All local data, Keychain items, pictures and their two derivatives (NS-37); the allowance resets (D-144) |
| A newer version exists but is not required | Nothing in the app; iOS updates apps itself; no "what's new" sheet (WORDS 5.10) | none |
| Required update and offline | The line shows only after a server answer or a cached config says so; offline, nothing new is said | none |
| A speech pack needs a newer app | Its own built line in Me, Language (`needs_app_update`) | none |
| First launch after an update | Migrations behind E-S01 (no screen under 350 ms); notifications re-planned (NS-32-R16); a draft in progress returns as a waiting card | none |
| A migration that cannot open the book | E-S01.recovery (NS-39-R11) | none deleted |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | n/a because this card begins after first run |
| Empty | Sign out and delete work with an empty book |
| Many (1,000 letters, 300 pictures) | Sign-out waits for the queue; deletion step 1 offers export first; export space check (C-S04) |
| Offline | Section 5 rows; local reading, recording and export never wait |
| Slow | The deletion request shows its busy words; at 10 s a retry line |
| Failed | `system.notThrough.line` on the act; nothing changed |
| Interrupted | Sheets stay as left |
| App killed mid-flow | Killed after the deletion request: the open request is remembered (`OPEN_REQUEST_KEY`) and the scheduled screen returns; killed during sign-out wait: still signed in, the wait resumes |
| App updated mid-flow | Same as killed |
| Low storage | Export first may say it needs space (C-S04); deletion itself needs none |
| Low Power Mode | No change |
| Kill switch `serverFeaturesEnabled()` off | No Account, Sign out or Delete account rows (`capabilities.ts`); Erase everything and export remain |
| Outage | Deletion and cancel say they did not go through; sign-out still clears the phone |
| Card's remote pause | `killSwitches.sync` never blocks deletion (NS-09-R17: deletion is never pausable); no switch may hide Delete account while sign-in is on |
| Plan lapsed | Sign-out and deletion unaffected |
| Signed out | Delete account needs sign-in; Me says "Sign in to delete your account, or to cancel a deletion you started. Letters that are only on this phone stay here until you delete the app." |
| Second account on the same phone | Sign-out of B leaves B's book on the phone, hidden from A (O-5); with no one signed in, the phone shows the book of the account that signed out last (K-E02) |
| New phone | Session expiry and deletion as above; the deletion screen shows on any phone where the account signs in |
| Two books, two parents | Two books: both deleted from the server. Two parents: NS-25 (store builds have none) |
| Expecting parent | No change |
| Devanagari, RTL | No change |
| AX5 plus Bold Text on SE 3 | Sheets scroll; the two actions stack and pin; the typed-word field and its reason stay above the keyboard |
| VoiceOver | Sheet titles take focus; the signed-out line is read once; the deletion date is read as a date |
| Voice Control, Switch Control | Visible labels |
| Reduce Motion | Fades |
| Dark mode, Increase Contrast | Tokens; Delete uses `destructive` with words, never colour alone |
| Every error code | `session_expired`; `unauthorized` (refresh once, then `session_expired`); `deleted` (SCDEL) and detail `purged`; `rate_limited` (SCRAT); `upgrade_required` (SCVER) and `gone` (410); `network`; `consent_required` never blocks deletion |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-45-R1 | Given Sign out, Then the book stays readable, playable and exportable on the phone, and the sheet says, before the tap, that anyone who opens the app here can read it and that Erase everything removes it (D1) | P0 (a)(b) | `[NS-45-R1] sign-out keeps the book and says so` |
| NS-45-R2 | Given 3 unsent letters and Sign out with sync able to run, Then the session stays until they are sent, and the letters exist on the server afterwards | P0 (a) | `[NS-45-R2] sign-out never drops a letter` |
| NS-45-R3 | Given a session ended elsewhere (revoked refresh token, Sign out other devices, epoch raised, Apple revoked), Then the phone signs out once after uploads, shows `session_expired` once in Me, and never blocks reading, recording or export | P0 (a) | `[NS-45-R3] a lost session never locks the book` |
| NS-45-R4 | Given Apple's credential revoked while the app is in the background, When the app returns to the foreground, Then the state is checked and the sign-out follows the R3 rule (O-18) | P1 | `[NS-45-R4] Apple revocation seen on foreground` |
| NS-45-R5 | Given Delete account, Then step 1 says what leaves our servers, what stays on this phone (letters, recordings, pictures), that a sealed letter is deleted with the account, the 30 days, export first, and that Plus is not cancelled | P0 (a)(b) | `[NS-45-R5] deletion says what it does` |
| NS-45-R6 | Given the typed word and the request, Then `request_account_deletion` schedules deletion 30 days out, one open request per account, at most 5 new requests a day, and the screen shows the date | P0 (b) | `[NS-45-R6] deletion is scheduled with a date` |
| NS-45-R7 | Given an outstanding Terms version, Then Delete account works without agreeing (NS-10-R4a) | P0 (b) | `[NS-45-R7] deletion without agreeing` |
| NS-45-R8 | Given the deletion date passes, Then the account's server rows, books, letters, consent rows (pseudonymised per policy) and the Apple refresh token are handled by the purge worker, and the receipt records `apple: revoked` or `apple: no_token` | P0 (b) | `[NS-45-R8] purge revokes Apple and removes server data` (server) |
| NS-45-R9 | Given a pending deletion, When the account signs in on any phone, Then the scheduled screen shows with Cancel deletion | P0 (b) | `[NS-45-R9] a pending deletion can be cancelled anywhere` |
| NS-45-R10 | Given Cancel within 30 days, Then letters and books return as they were | P0 (a) | `[NS-45-R10] cancel restores everything` |
| NS-45-R11 | Given a sealed letter at deletion, Then the server copy is deleted with the account (D6), and its words are never shown anywhere before its day, on any phone | P0 (a) | `[NS-45-R11] a seal is deleted, never revealed` |
| NS-45-R12 | Given pictures on the phone, When the account is deleted, Then the pictures stay on the phone and step 1 said so; When Erase everything runs, Then every stored copy and both derivatives are removed | P0 (a)(b) | `[NS-45-R12] pictures follow the phone, not the account` |
| NS-45-R13 | Given a build below `minSupportedVersion`, or a server answer `upgrade_required`, Then Me shows the update line with Open the App Store, nothing appears on Home, and recording, reading, saving and export work; the phone holds a yes-or-no "hide features that need the new version" hook that nothing reads yet (E58) | P0 (a)(c) | `[NS-45-R13] a required update never blocks the book` |
| NS-45-R14 | Given a newer version that is not required, Then the app shows nothing about it, anywhere (E58) | P1 | `[NS-45-R14] no update nag` |
| NS-45-R15 | Given Delete account offline, Then the line says nothing changed and that a connection is needed, and nothing is half-requested | P0 (b) | `[NS-45-R15] deletion offline is clear` |
| NS-45-R16 | Given servers off in the build, Then no Account, Sign out or Delete account row shows, and Erase everything and export work | P0 (b) | `[NS-45-R16] servers-off has no account rows` |
| NS-45-R17 | Given a deletion request and a cancel, Then the account address receives one plain email for each (no content; O-17); this is a test of the purge worker's two sends and a check on the deployment that the sender is configured (E58) | P1 | `[NS-45-R17] deletion and cancel are confirmed by email` |
| NS-45-R18 | Given VoiceOver and AX5 on SE 3, Then the sign-out sheet, both deletion steps, the scheduled screen and the update line are fully reachable and read in order | P0 (b) | `[NS-45-R18] leaving works with VoiceOver and at AX5` |

CL/K ruling K15 (`GAP-LOG.md`; lifecycle against back-office on deletion, claim and hand acts), one home for the three rules: (1) a sole parent's book is exported only by the account holder's own phone, or by a counsel-read process that hands over the Save a copy file the person already holds; no staff tool exports a book (FR-LCY-27); (2) a deleted-elsewhere phone (FR-LCY-19) and a suspended account (FR-BKO-26) get two lines and two states; (3) a claim after deletion (FR-LCY-11) is parent-driven and never done by staff. Counsel confirms the death runbook (RUFADAA, none read). Only Q-BKO-1 (default: no hand merge) is the founder's.

### 8. Non-functional budgets
- Latency: sign-out on the phone within 1 s when nothing is queued; deletion request p95 1.5 s on LTE (PROPOSED).
- Memory, storage, battery: negligible.
- Offline: section 5.
- Accessibility: NS-45-R18.
- Localisation: English.
- Privacy (log canary): no account id, email or reason in logs; deletion audit rows are content-free.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Sign out | Book stays (D1) | `[NS-45-R1]`, `[X4-R1]` |
| Second account | Hidden and locked books per account (O-5) | `[NS-41-R6]` |
| Account deletion here | Scheduled, cancellable, works without agreeing | `[NS-45-R6]`, `[NS-45-R7]` |
| Account deletion elsewhere | Plain line; phone copy stays (O-15) | `[NS-10-R9]` |
| Kill switch: `serverFeaturesEnabled()` off | No account rows | `[NS-45-R16]` |
| Card's remote pause | None may hide or pause deletion (NS-09-R17); `forceReauthEpoch` signs out once | `[NS-45-R3]` |
| Plan lapse | No effect | n/a |
| Retry after a lost answer | One open request (a repeat returns it) | existing server tests |
| App update required | Line in Me only | `[NS-45-R13]` |

### 10. Data and engineering
- Fields: none new on the phone. Server: the deletion request (account, requested at, scheduled for, source), content-free audit rows, the purge receipt.
- Migrations: none for this card. Deletion RPCs exist (`20261005000000_family_cap_language_idempotency.sql:405-469`, per the security input).
- Sync field group: deletion moves synced letters to Recently deleted on the next pull.
- Export: unchanged; export stays reachable through the 30 days and after sign-out.
- Modules: `lib/auth/session-provider.tsx`, `lib/auth/reauth.logic.ts`, `lib/account-deletion/*`, `app/settings/account.tsx`, `delete-account.tsx`, `erase.tsx`, `packages/api/src/remote-config.ts` (`minSupportedVersion`), a new reader for the update line.
- Flags: `EXPO_PUBLIC_ACCOUNT_DELETION` (on in `production`, `eas.json`); `serverFeaturesEnabled()`. Remote: `forceReauthEpoch`, `minSupportedVersion`.
- Error codes: section 6 last row.
- Rollout and rollback: the update reader ships on; revert.

**Built today.**
- Local sign-out, waits for uploads, "Stay signed in": built (`session-provider.tsx:269-308`, `machine.logic.ts:191-209`). The sheet body says "Your letters stay on this phone. Sign in again any time." (`packages/content/src/features/auth.en.ts:297`) and lacks D1's "anyone who opens the app here" line. Backlog: BL-961 with BL-965 (content).
- `session_expired` path and forced epoch: built (`session-provider.tsx:217-223`, `:327-341`).
- Apple revocation checked only when a user id first appears (`session-provider.tsx:255-267`). Backlog need: foreground check and the revocation notification (O-18).
- Deletion request, 30 days, cancel, typed word, rate limits: built (`lib/account-deletion/logic.ts:62-70`, `account-deletion.en.ts:19-110`). The purge worker already sends both emails, on request and on cancel (`supabase/functions/purge-worker/account.ts:247` and `:251`, found 20 Nov); no step-up before Delete account (E54). What is open is a test and a deployment check (NS-45-R17), not a build (E58).
- Deletion copy says "v1.0 makes no photos" (`account-deletion.en.ts:15-16`); with NS-01 it must name pictures on the phone. Backlog need: `content` with NS-01.
- D6 sealed-letter line on the deletion sheet: not built (Firsts and seals are later; the line lands with NS-06 B).
- Account deleted elsewhere: the phone keeps its letters (`account-deletion.en.ts:38`, `:83`); F02-REQ-007 asked for one export and a wipe. O-15.
- `minSupportedVersion` has no consumer (`packages/api/src/remote-config.ts:99`, G-E03), and no screen reads SCVER or 426. Backlog need: a `mobile` row with `system.update.*` (K-E05, CG7).

### 11. Information collected

| Field | Why | Required or optional | Validation | Class | Store | Retention | Export |
|---|---|---|---|---|---|---|---|
| Deletion request | Carry out and allow cancel | Required to delete | typed word "delete" on the phone (not stored); one open request; 5 per day | L3 (account id) | Server | Until carried out or cancelled; the receipt per Privacy 7 (counsel, Q51) | No |
| Open request note | Show the scheduled screen after a kill | Automatic | request id and date | L2 | Phone settings | Until done or cancelled | No |
| Forced re-auth epoch seen | Sign out once per number | Automatic | integer | L2 | Phone settings | Install | No |
| Nothing at sign-out | Sign-out stores nothing new; it removes the session, Apple id, pending note and typed address | n/a | n/a | n/a | n/a | n/a | n/a |

### 12. Door lines
- **Shown:** sign-out sheet with the D1 words; deletion step 1 (what leaves, what stays, 30 days, export first, Plus), step 2 (the typed word), the scheduled screen (date, cancel).
- **Records:** sign-out: nothing. Deletion: the request and content-free audit rows; the purge receipt. Cancel: an audit row.
- **Never:** a hidden or paused Delete account while sign-in is on; deleting the phone's only copy of a recording without the person's own Erase everything; an update screen that blocks the book; a "we will miss you" or loss line.
- **Decline:** sign-out: "Stay signed in" while waiting, or Cancel. Deletion: Cancel deletion any time in 30 days, here or by signing in on any phone.

### 13. Threats and risk checks

| Asset | Threat | Control | Test |
|---|---|---|---|
| The voice | Destroyed by sign-out or account deletion | D1; phone copy stays; Erase everything is the only local wipe | `[NS-45-R1]`, `[NS-45-R12]` |
| An account | Deleted by someone holding an unlocked phone | Typed word, 30-day undo, email on request (O-17); App lock optional | `[NS-45-R10]`, `[NS-45-R17]` |
| A stolen session | Kept after the owner signs out elsewhere | Sign out other devices; 15-minute JWT; rotation | `[NS-45-R3]` |
| Apple account link | Left alive after deletion | Purge revokes the refresh token; `no_token` alert | `[NS-45-R8]` |
| Old builds | Corrupt server data | `minSupportedVersion`, SCVER; the update line | `[NS-45-R13]` |

Risk checks: refresh-token validity (Supabase), Apple credential state (launch, foreground), the forced epoch (signed remote config), the deletion rate limit, the minimum version (remote config and SCVER).

### 14. Never
- Never a guilt, loss or "are you sure you want to lose" line; never a count of letters "you will lose" (frame guardrails, VOICE).
- Ruling D3: n/a (no new letter text). Ruling D2: n/a (the typed word is not a letter field).

### 15. Design inputs
Area C: C-S02 (signed-out Account), C-S03 (sign-out sheet with the D1 words and the waiting state), C-S19 (Erase everything, "every book on this phone"), C-S20 (deletion steps 1 and 2, scheduled, cancelled, offline, rate limited). Area E: E-S16.line (SystemLine action, Me top), the `session_expired` line in Me, E-S01 migrating and recovery. AX5 on SE 3 and VoiceOver per section 6.

### 16. Content inputs
REUSE `authCopy.account.*` (signOut, signOutWaiting, signOutEarly, signedOutTitle, signOutOthers*), `authCopy.errors.session_expired`, `accountDeletionCopy.*`, `authCopy.newPhone.accountDeleted` (PROPOSED in WORDS). PROPOSED: `system.update.line`, `system.update.storeButton`, `system.update.storeHint` (WORDS 9); the D1 sign-out line; the deletion step-1 picture line (with NS-01) and seal line (with NS-06 B); a typed-word reason line. CHANGE: none of these may say "safe" outside its two places (CG5 for `billingCopy.plan.retry`). `content` writes; counsel reads deletion and retention lines; the founder approves.

### 17. Legal, privacy and compliance inputs
Apple 5.1.1(v) (in-app deletion), Apple TN3194 (revocation), DELETION_AND_EXPORT_SPEC 2.6, LEGAL-REQ-029, LEGAL-REQ-040 (no switch stops export), Q51 (retention of receipts and consent rows), D6. Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables: "You can delete your account in the app, with 30 days to change your mind." Forbids: "deleting your account removes everything" (the phone keeps its copy until Erase everything); "your recordings are deleted with your account" (they are on the phone only).

### 20. Free or Plus
Free (T2). Deletion never cancels Plus by itself; the screen says so.

### 21. Measures with analytics off
Server aggregates, content-free: deletion requests and cancels per week. Support tally: "signed out unexpectedly", "deleted by mistake". Tester question: "After signing out, did your letters stay on the phone? (yes / no)". x of n.

### 22. Dependencies and gates
BL-961, BL-965 (D1 line); O-15 to O-18; G-E03 (update reader); NS-01 (picture line), NS-06 B (seal line).

### 23. Open questions
- O-15 Account deleted elsewhere: wipe the phone or keep. Owner: Karma with the CPO and privacy roles. Default: keep the phone's letters and recordings as built (ruling D1's reason applies: the phone may hold the only copy of the voice); say it once and point to Erase everything; F02-REQ-007's export-then-wipe is withdrawn by this card if Karma agrees.
- O-16 App update states. Owner: Karma. Default: "available" shows nothing; "required" shows the E-S16 line in Me only, never blocks; first launch after an update says nothing (answers K-E05, CG7).
- O-17 Confirmation email on deletion request and cancel. Owner: `privacy` with `content`. Default: yes, one plain email each, no content; no step-up sign-in before deletion (Apple asks deletion to be easy; the 30-day undo is the guard) (security G5).
- O-18 Apple revocation on foreground. Owner: `mobile`. Default: check `getCredentialState` on every foreground and listen for the revocation notification (security G7, Apple TN3194).

---

## Card gaps answered (area E WORDS section 10 and DESIGN section 10)

Rulings here are product's proposals for Karma; GAP-LOG takes them once ruled.

| Gap | Answer | Where |
|---|---|---|
| CG1 NS-32 placeholder "A note for tonight" | Not first-run scope. Agreed with area E: "note" is a person's word; area D picks "An evening reminder" or similar. Routed to NS-32 errata | GAP-LOG (D) |
| CG2 "coming soon" strings (`familyCopy.soon.*`, languages) | No first-run or sign-in surface may show them (NS-39-R12, NS-43-R11); retiring the keys is `content`'s and area D's | NS-39, NS-43 |
| CG3 "the family you invite" / "the people you invite" | Both registered lines change before the store build reaches anyone outside the family; counsel words them | NS-42-R13, section 16 |
| CG4 `trust.signIn.why` "keeps your book safe" | Replace with the words-only truth | NS-41, NS-42 section 16 |
| CG5 `billingCopy.plan.retry` "safe" | Agreed: "still yours"; through counsel (registered) | NS-45 section 16 |
| CG6 second account sees A's book | Hide and lock (ADR 0031) | NS-41-R6, O-5 |
| CG7 app update state | "Required" only, a line in Me, never blocking; "available" shows nothing | NS-45-R13, R14, O-16 |
| CG8 site FAQ "never locked away" | Not first-run scope; T1 applies; `content` rewords after counsel Q40 | routed |
| CG9 cards for the path | This file; the step table at the top re-keys WORDS 5.14 | top of file |
| CG10 region check | No in-app region question; the server refuses sign-up from D-131 places with a calm screen (E-S04.refused-region, new); existing accounts sign in anywhere | NS-40-R9 to R12, O-4 |
| CG11 disabled buttons with no reason | Reasons in words for empty email and short code; `authCopy.code.digits` with `{n}` instead of `sixDigits` | NS-41-R8 |
| CG12 sign-up versus sign-in | One door; "sign in" only; never "sign up", "log in", "create account" | NS-41-R1 |
| CG13 `auth.noEmailHelp` names Google | Drop Google while it is off | NS-41-R20 |
| CG14 "I answered by mistake" | Keep, after 24 hours; no confirm step until the founder and counsel decide BL-561 | NS-40-R4, O-3 |
| K-E01 NS-17 language waiting line | First sentence only; no "later update" line anywhere in first run | NS-43-R11 |
| K-E02 signed-out phone with two accounts' books | Show the book of the account that signed out last | O-5 |
| K-E03 storage card on Home | Not on Home; Listen and Me, Storage only (unchanged by this file) | NS-44 section 6 |
| K-E04 Erase everything with two accounts | Erases every book; the sheet says "every book on this phone", names none | NS-45 section 5, O-5 |
| K-E05 app update | NS-45 | O-16 |
| K-E06 crash body "safe" on a fresh install | Agreed with WORDS: `en.errors.crash.bodyNoBook` when no book is on the phone | NS-39 (E-S13 row) |
| K-E07 paused sync value | Not first run; "Paused for now" agreed in principle; NS-10 owner | routed |
| K-E08 E screens in NS-33's AX5 lists | E-S02, E-S03, E-S04 to E-S08, E-S10, E-S14 are in this file's AX5 rows (NS-40-R13, NS-41-R22, NS-42-R15, NS-43-R13, NS-45-R18) | this file |
| K-E09 first run and Plus only "cited" | Answered: these cards now own them | this file |

## Inputs folded

| Input | Status | How it was used | Where this file differs, and why |
|---|---|---|---|
| `docs/product/prd/inputs/first-run-compliance.md` (`regulatory-affairs`, read at 05:41 UTC 20 Nov) | Present, read in full | Store age signal and state-law dates (NS-40 sections 2, 22, O-2); region and sanctions (NS-40, O-4); abuse limits (NS-41); the information-collected table (folded into each card's section 11); notices and PRIV-R21 gaps (NS-42, O-9 to O-11); G6 required sign-in under 5.1.1(v) (NS-38-R5, NS-41 section 17); G11 unconfirmed users (O-12); G12 second account (O-5) | Several line cites in the input are from head `543516611` and do not match `7d0446d02` (for example `agreements.logic.ts:151-153` and `:189-205`, `age-gate.ts:89-98`); this file uses the lines read this session. The input classes the child name L3; the migration header says L4 (class S), which this file uses |
| `docs/product/prd/inputs/first-run-auth-security.md` (`security`, read at 05:43 UTC 20 Nov) | Present, read in full | The auth journey as built (NS-41 sections 4, 5, 10), rate limits as experienced (NS-41 section 5), validation rules (NS-41, NS-43 section 11), failure states F1 to F40 (NS-41 rows 1 to 43, NS-45 section 5), gaps G1 to G20 (O-5 to O-8, O-17 to O-21) | Its scope note says store profiles keep servers off until R-17, quoting `capabilities.ts:6-10`; `eas.json` `production` sets servers on (D-157), so that comment is stale (NS-39 Built today). Its G19 says no server date check exists; `create_child_row` in `20261109000000` checks both ranges (NS-43 Built today) |

## Id index

| Card | Title | Acceptance rows | P0 rows | Main E screens | Owner areas |
|---|---|---|---|---|---|
| NS-38 | The App Store page and install | NS-38-R1 to R9 | 8 | none (Apple's) | founder, `content`, CCO |
| NS-39 | First launch and the first interaction | NS-39-R1 to R14 | 10 | E-S01, E-S02, E-S14, E-S08.open | E, A (primer) |
| NS-40 | Age and region checks | NS-40-R1 to R14 | 11 | E-S03, E-S04.refused-region (new) | E |
| NS-41 | Sign up and sign in | NS-41-R1 to R25 | 18 | E-S02, E-S04, E-S05, E-S06, E-S14, E-S24, E-S18; C-S10, C-S11 | E, C |
| NS-42 | Agreements and notices at collection | NS-42-R1 to R18 | 15 | E-S03, E-S02 footer, E-S07 | E, C (Privacy) |
| NS-43 | Setting up the first book | NS-43-R1 to R14 | 11 | E-S08 | E |
| NS-44 | The first letter and the allowance | NS-44-R1 to R13 | 10 | A-S01 to A-S13, E-S10, E-S26 | A, E |
| NS-45 | Account life after first run | NS-45-R1 to R18 | 15 | C-S02, C-S03, C-S19, C-S20, E-S16 | C, E |
| | Total | 125 | 98 | | |

New design states named by this file: E-S04.refused-region, E-S05.reason-empty, E-S06.reason-short, E-S24.method-only, the re-consent change-summary state of E-S07. New PROPOSED content keys: `authCopy.code.digits` (replaces `sixDigits`), a relay-address method line, `system.region.*` moved from HOLD, a bot-check line (if O-7), the D1 sign-out line, deletion picture and seal lines, a typed-word reason line, a re-consent summary key. New PROPOSED error kind: `region_refused`.

Backlog needs named in the cards (ids from `next-id.mjs` when `product` files them; existing rows cited where they exist): remove the lock offer (NS-39); fix `capabilities.ts` header (NS-39); Declared Age Range module (NS-40, F01 WP-F01-02, WP-F01-07); BL-553 and File 28 (NS-40); code length and limits config plus copy (NS-41, O-6); bot check (O-7); lower-case email (NS-41-R24); Apple name scope (O-8); unconfirmed-user purge (O-12); `killSwitches.signIn` (O-19); relay registration and method line (O-20); password-path test (O-21); BL-961 and ADR 0031 (O-5); BL-577, BL-579, versioned and anchored links (NS-42); first-run books in one transaction (O-14); Apple foreground check (O-18); deletion emails (O-17); update reader for `minSupportedVersion` and SCVER (O-16); deletion copy for pictures and seals; `content` changes for CG3, CG4, CG5, CG13.

## Open items for Karma, each with a recommended default

Decisions the founder must take are marked FOUNDER (spend, a vendor, a published promise, a risk acceptance, applying a migration). Everything else is Karma's under the 19 Nov delegation.

| # | Item | Card | Owner | Recommended default |
|---|---|---|---|---|
| O-1 | Does the listing say sign-in is needed | NS-38 | CMO role, `content` | Yes, one plain sentence naming Apple or email and the reason (words follow to a new phone) |
| O-2 | Declared Age Range timing and the Texas exposure | NS-40 | Karma, FOUNDER (risk acceptance) | Module in a 1.0.x before 1 Jan 2027 (iOS 26.2 SDK), memory only; record the Build 12 Texas exposure in DECISIONS now; counsel Q46 |
| O-3 | Confirm step after No (BL-561) | NS-40 | FOUNDER, counsel | Not built; keep the 24-hour stop and "I answered by mistake" |
| O-4 | Country check before public sign-up | NS-40 | FOUNDER (apply File 28), Karma | Hook and BL-553 on before anyone outside the family signs up; until then a DECISIONS line that it is off |
| O-5 | Second account on one phone | NS-41, NS-45 | Karma, FOUNDER (ADR 0031) | Hide and lock the other account's book; signed-out phone shows the last account's book; Erase everything says "every book on this phone" |
| O-6 | Email code length and limits | NS-41 | `security-architect`, FOUNDER (dashboard) | 8 digits, 900 s, app length 8 in the same release, pending-link note 900 s, verify limit 15 per 5 min per IP |
| O-7 | Bot check on email send | NS-41 | FOUNDER (new subprocessor) | Turnstile before the public TestFlight link; subprocessor page first; Apple unaffected |
| O-8 | Apple name scope | NS-41 | `privacy`, `mobile` | Email only (NX-31-R9); no screen uses the name |
| O-9 | Three agreement moments | NS-42 | Karma, CLO role | Keep all three for 1.0; upload local rows at first sign-in (BL-579); revisit after Q-D |
| O-10 | PRIV-R21 fields on server rows | NS-42 | `mobile`, `data-architect` | BL-577 before the server flag; locale from the sheet shown |
| O-11 | Versioned links and notice at collection | NS-42 | `content`, website, FOUNDER (publishing) | Links open the recorded version at "What we collect"; a pinning test |
| O-12 | Unconfirmed sign-up rows | NS-41 | `data-architect` | Purge after 7 days, with a test and a data-policy row |
| O-13 | Allowance per phone or per account | NS-44 | CBO role, Karma | Per phone as built for 1.0; revisit with NS-25 |
| O-14 | First-run siblings and one transaction | NS-43 | CPO role, `mobile` | One shared date in first run for 1.0; one transaction for the first books (P1); F03-REQ-001 to P1 drafted for the founder |
| O-15 | Account deleted elsewhere: wipe or keep | NS-45 | Karma, CPO and privacy roles | Keep the phone's copy (D1's reason); say it once; withdraw F02-REQ-007's wipe |
| O-16 | App update states | NS-45 | Karma | "Available": nothing. "Required": a line in Me only, never blocking |
| O-17 | Deletion confirmation email; step-up | NS-45 | `privacy`, `content` | Email on request and on cancel, no content; no step-up |
| O-18 | Apple revocation on foreground | NS-45 | `mobile` | Check on every foreground and observe the revocation notification |
| O-19 | Remote pause for sign-in | NS-41 | Karma | Add `killSwitches.signIn` (disable-only): first run shows the outage screen with the local start; never touches a session |
| O-20 | Hide My Email delivery and display | NS-41 | FOUNDER (Apple relay registration), `content` | Register the domain before public sign-in; show the method, not the relay address |
| O-21 | Password path at the API | NS-41 | `security` | Staging test this week; refuse and alert if it exists |
| O-22 | Local start offered in outages | NS-39 | Karma | Keep as built (founder's 9 Nov option B, outage-only), named in the Notes for Review |

Drafted for the founder (requirements cited, not changed here): F03-REQ-001 from P0 to P1 for 1.0 (O-14); F02-REQ-007's export-then-wipe withdrawn (O-15); F02's letter-first order (A-REQ-012, A-REQ-013, the ask table) marked superseded by D-160 and these cards; D-043 amended to the built order (age, then Welcome); D-044's row pointed at D-054 (Google later in store builds as built).
