# NS-38 to NS-45: from App Store download to the first kept letter

Status: Locked v1.0 candidate, 20 Nov 2026 (needs Karma's ruling on open items). Changes after lock need a PR that lists every changed id.

Author: `product` (PM role, with the CPO role; a Claude session, not a scheduled `product` run), for Karma (CTO). Backlog row BL-994. Docs only: nothing here is built by this file, no string is live, no decision is recorded in `DECISIONS.md`. Founder request of 20 Nov 2026 (relayed by Karma): the PRD covers everything from app download and the first interaction through sign-up and sign-in, risk checks, required validation, information collection and verification, so design can draw the whole path end to end.

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
**Not in scope.** Store screenshots' art direction (design, BL-340). Pricing (App Store Connect and `packages/content/src/pricing.ts`). The website (F21). Search ads (none).

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
No E screen. Design owns the screenshot frames (BL-340): Asha only, no co-parent, no backup, no other-language letters unless the build transcribes them.

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
| A screen throws | E-S13 (NS-45 owns the fresh-install body, CG8 there) |
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
| Slow | Breathing launch mark after 350 ms, no count; held screens at 10 s (DESIGN rule 5) |
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
- Should "Start on this phone" stay offered in outages for a store build that requires sign-in (D-160)? Owner: Karma. Default: yes, as built (founder chose option B on 9 Nov as an outage-only fallback, `gate.logic.ts:33-38`); the Notes for Review name it.

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
| Sign-up from a refused country (when D-131's hook ships) | One neutral full screen (E-S04.refused-region, new state): intent "{app} can't be set up from here." with "Terms of Service" and "Contact us"; never asks where the person is, never names a list or a country, never says "sanctions" | phone: nothing. Server: the daily count with the country code for refusals only (D-136) |
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
| Outage | The hook is part of user creation, so an outage fails the sign-up as an outage (E-S14), never as a refusal. If the lookup itself fails while Auth is up, the hook fails closed (no account is made) and the phone shows the outage screen, never the refusal (PROPOSED; `security-architect` confirms) |
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
| NS-40-R8 | Given No on the consent sheet's age step, Then the session ends locally, the 18+ gate closes, and no policy act is recorded | P0 (b) | `[NS-40-R8] No at the age step ends the session` |
| NS-40-R9 | Given D-131's hook on, When a sign-up comes from a refused country, Then the app shows the neutral refusal screen with Terms and Contact us, stores nothing on the phone, and never asks where the person is | P0 (b) | `[NS-40-R9] a refused sign-up is calm and stores nothing` |
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
E-S03 (default, reason-noAnswer, reason-noTick, agreeOnly, stop, stop-after24h, ax5, vo, dark). New state E-S04.refused-region (replaces WORDS' HOLD state E-S03.region, because the refusal arrives at sign-up, not at the age screen): StateScreen warm, no drawing of a map or flag, one line, Terms and Contact us as quiet actions, no Try again (it would fail the same way). The consent sheet's age step uses the gate's own pills (built). No new component.

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
| 7 | Sign-in service error (5xx) or the 10 s wait (first run) | E-S14.outage; a 5xx is never called "offline" (BL-488) | Try again; Start on this phone |
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
| 33 | Session exists, consent outstanding, no book on the phone (killed on the Terms sheet; a Terms version bumped) | The consent sheet again, or C-S11's held screen with Finish setting up and Try another way, within 10 s; never E-S08 (NS-10-R0; BL-922) | Finish setting up |
| 34 | The phone already holds letters owned by no account (local start, or a servers-off build updated) | E-S24 after consent: masked email (or the method for a relay address), Keep in this account, Not my account. Nothing is claimed or uploaded before Keep (BL-347, built) | Keep, or Not my account |
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
| Slow | "Signing you in" breathes; at 10 s on first run the outage screen; Apple's sheet is Apple's |
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
| NS-41-R2 | Given a known and an unknown address, When Send is tapped, Then the screens, the words and the request shape are identical (`shouldCreateUser: true`) | P0 (b) | `[NS-41-R2] new and returning look the same` |
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
