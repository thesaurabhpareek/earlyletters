# F01 Entry, 18+ gate and welcome

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 8 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent (arriving by invite), P3 Expecting parent, P4 Multilingual family |
| Existing IDs | A-REQ-001, A-REQ-002, A-REQ-005 (welcome part), A-REQ-012, A-REQ-022, A-REQ-028, A-REQ-029, A-REQ-030, A-REQ-035, A-NFR-001, A-NFR-002, A-NFR-005, A-NFR-006, A-NFR-007, A-NFR-008, A-NFR-010, A-NFR-012, PRD-REQ-019, LEGAL-REQ-002, LEGAL-REQ-007, LEGAL-REQ-051, D-026, D-040, D-043, DR-10, BL-031, BL-037, BL-040, BL-137, BL-170 |
| Depends on | F19 (cached remote config, never awaited), F21 (AASA file and `/j` page on earlyletters.com), design system (ADR 0101). Hands off to F02 (Sign in), F03 (Start a book), F11 (I was invited) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] Under-18 users are not allowed at all, locally or with an account; the founder removed the local-only mode on 2 Oct (PRD.md K-07, PRD-REQ-019, D-006 via D-026).
- [F] Texas SB 2420 is in force: the Fifth Circuit stayed the injunction on 10 June 2026 and the Supreme Court refused to vacate the stay on 6 July 2026. Utah moved to 6 May 2027, Louisiana to 1 July 2027, California AB 1043 starts 1 Jan 2027 (R4 section 4.2; R4-S44, R4-S47, R4-S49, R4-S52, R4-S53).
- [F] Apple's Declared Age Range framework needs iOS 26.0, and the `isEligibleForAgeFeatures` check needs iOS 26.2; our floor is iOS 17 (R4 section 4.1, R4-S37, R4-S40; D-040). On iOS 17 to 26.1 our own question is the only check.
- [F] No baby or letters app in R1's sample describes an in-app 18+ gate; all are rated 4+ or 9+ (R1 F01, R1-S1, R1-S3, R1-S4, R1-S20, R1-S67, R1-S2). Ours must feel like one calm question, not a wall [R].
- [F] Deck-of-cards tutorials gave no significant gain in task success (91% against 94%) and made apps seem harder (NN/g, UR S10). The intro is one welcome screen at v1.0; the 4-story intro moves to v1.1 F40 (D-043).
- [F] The only published onboarding result in the category: Tinybeans showed value and privacy before asking for data and reported +885% completion in a Fall 2020 A/B test (R1-S51).
- [A] The first launch decides whether P1 reaches the first letter inside the 90 s median (03 section 2, PS1). Every second spent in F01 comes out of F03 and F04.

## 2. Who

| Persona | Moment | Holding, feeling, short of |
|---|---|---|
| P1 Evening parent | Just installed after a friend's mention or an App Store search, often late, often with a baby asleep nearby [A, U1] | One hand, low light, little patience for set-up screens (02 section 3) |
| P3 Expecting parent | Third trimester, more time, high intention (UR S27) | Wants to start before birth; must not meet due-date countdown copy (B-REQ-015) |
| P2 Co-parent | Tapped an invite link in Messages or WhatsApp from their partner | Wants to land in the right book, not a sales pitch (A US5) |
| P4 Multilingual family | Any of the above | English interface at v1.0 (B4); needs the promise that their language is kept |
| Under 18 | Downloaded by mistake or by curiosity | Must be stopped politely with nothing kept |

## 3. What we are solving

Outcome: anyone opening the app sees a calm screen within 2 s, adults pass one neutral question in one tap, and under-18 users are stopped before anything about a child is created.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Cold start to first interactive frame, SE 3 | p50 1.2 s, p90 2.0 s (gate) | BL-044 perf run, 200 samples (PRD 7.1) | Lab only |
| Time spent in F01 on a fresh install (gate plus welcome) | p50 8 s or less [A] | Maestro timing on device; field value from `analytics_opted_in.time_to_first_letter` only as a whole-journey bucket | No F01 event can be sent: analytics consent comes after the first letter (K-01) |
| Share of installs that pass the gate and save a first letter within 24 h | 60% or more [A] (03 section 4.2) | ASC installs against server first-letter counts for synced users | Phone-only users invisible |
| Nothing created after a No | Zero rows, files or requests (gate) | Automated checklist 6.1 test | None |

## 4. Scope

**In v1.0**
- Native splash on paper, matching the first frame; never waits on network, model or sync.
- Root-level 18+ entry gate before any route, for every path: cold start, welcome actions, invite links, auth links and any deep link.
- Declared Age Range call where `isEligibleForAgeFeatures` is true (iOS 26.2 and later), result in memory only (DR-10 A).
- Stop screen with a 24-hour lock after No or an under-18 signal.
- One welcome screen with Start a book, I was invited, Sign in, and the two-sentence privacy notice (A-REQ-035, K-16).
- Deep links and invite links that arrive before the gate are held, then resumed after Yes, or discarded after No.
- Offline entry; accessibility at AX5 and with VoiceOver.

**Later**
- Four-story intro behind `intro_variant` (v1.1, F40, A-REQ-003 to -011, BL-303).
- Brand moment animation (A-REQ-003, v1.1 with the stories).
- California AB 1043 signal handling, if Apple delivers it outside Declared Age Range (before 1 Jan 2027; counsel, R-13).
- Localised entry strings (A-NFR-014, P2; B4 keeps the UI English).

**Never**
- Storing an age, birth date, age range or Declared Age Range response (D-026, LEGAL-REQ-002).
- A local-only mode for under-18 users (K-07).
- An OS permission prompt during entry (LEGAL-REQ-007).
- Contacts access (A-REQ-035).
- Child-facing framing anywhere in entry (App Review 5.1.4, R4 section 5).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Tinybeans | Value carousel before personal data; child info optional; primed notification ask [F] R1-S51 | +885% completion, Fall 2020 A/B [F] R1-S51 | 2022 version added privacy assurances [F] R1-S51 | **Match** [R]: privacy line on the welcome screen, nothing asked before value except the legal question |
| Qeepsake | Plan chosen at sign-up, 7-day trial with a card on file [F] R1-S45 | 4.9 (15K) [F] R1-S1 | Reviews cite the move to paid-only and aggressive postpartum texts [S] R1-S1 | **Avoid** [R]: no card, plan or account before value |
| Headspace | Five onboarding variants tested [F] R1-S58 | Quiz doubled course starts (31% to 63%), no rise in practice days [F] R1-S58 | n/a | **Match with care** [R]: no quiz in entry |
| Category age gates | No in-app 18+ gate described; apps rated 4+ or 9+ [F] R1 F01 | n/a | n/a | **Innovate quietly** [R]: one neutral screen |
| Apple Declared Age Range | Age range from the system, user or guardian declared, with sharing prompt [F] R1-S71, R4-S38 | n/a | n/a | **Match** [R]: call it where eligible, block under 18, store nothing |

## 6. Experience

### 6.1 Entry points

| Entry | Arrives with | Goes to after Yes |
|---|---|---|
| Home screen icon, first launch | Nothing | Welcome |
| Home screen icon, later launches | `ageGate.passed` | Tonight if a child or local letter exists, else Welcome (D-026, TDD 01 3.1) |
| Invite link `https://earlyletters.com/j#t=<token>` (F11) | Token in fragment | Gate, then F11 join flow, skipping Welcome |
| Email sign-in link `https://earlyletters.com/auth/confirm#token_hash=...` (F02) | Token hash in fragment | Gate, then F02 verify |
| Custom scheme from the `/j` or `/auth/confirm` page "Open the app" button | No token (F02-REQ-011) | Gate, then Welcome or the pending flow |
| Lock-screen widget or notification (F04, F13) | Route id only | Only reachable after Yes, because both are created after first run |

### 6.2 Happy path (new parent, first launch)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps the icon | Native splash: paper background (`brand.colors.paper`, dark `paperDark`), no text. Envelope mark when design delivers it (A-REQ-001 TODO in `app.config.ts`) | Reads settings synchronously; no network, model or sync is awaited (A-REQ-002) |
| 2 | Nothing | Gate: `ageGate.title` "Are you 18 or older?", `ageGate.body`, Yes and No as a radio group with nothing selected, Continue disabled | `useAgeGate()` returns `ask`; no other route is mounted (`_layout.tsx`). On iOS 26.2 and later, if `isEligibleForAgeFeatures` is true, the Declared Age Range request runs first (6.2a) |
| 3 | Taps Yes, then Continue | Welcome screen | Writes `ageGate.passed = '1'` only (D-026). Deferred work starts after the next frame (launch sweep, config refresh) |
| 4 | Reads the welcome | `onboarding.welcome.title`, `.subtitle`, `.body`; notice `onboarding.welcome.notice` (new, text from K-16); buttons Start a book (`onboarding.welcome.startButton`), I was invited (`.joinButton`), Sign in (`.signInButton`) | Nothing stored |
| 5 | Taps Start a book | F03 first run, first screen | Route change only |

Copy note: the three button keys exist; their current values are "Begin the book", "I was invited", "I already have a book". The labels in this spec (Start a book, Sign in) follow D-043 and BL-137; the content owner decides the final values in `packages/content` [R].

**6.2a Declared Age Range (iOS 26.2 and later, eligible accounts)**

| Response | Gate behaviour |
|---|---|
| Sharing, lower bound 18 or more | The question still shows (one tap); the signal is used only to allow Yes (TDD 01 3.3 OQ-1 recommendation) |
| Sharing, upper bound under 18 | Stop screen at once; question not shown; `ageGate.stoppedAt` written |
| Declined, error, timeout over 3 s, iOS below 26.2, not eligible | Our own question decides. Declined is not proof of adulthood (R4-S38) |

The response object is never written to the settings table, a log, Sentry or analytics; a unit test asserts the module has no import of the store, logger or analytics client (TDD 04 3.3 item 2).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F01-U01 | Answers No | `ageGate.stoppedAt` written; any pending invite or auth token deleted from Keychain; no other write, file or request | `ageGate.stopTitle`, `.stopBody`, `.stopNote`; no button for 24 h | After 24 h the screen offers to answer again | Unit (`age-gate.test.ts`) plus integration: zero rows in content tables, zero files in Documents, zero requests |
| F01-U02 | Relaunch within 24 h of No | `decideGate` returns `stop` | Stop screen | Wait | Unit, existing |
| F01-U03 | Device clock moved back after No | `stoppedAt` reset to now (clock repair) | Stop screen | Wait 24 h from the repair | Unit, existing ("a clock set back never shortens the stop") |
| F01-U04 | Stop screen left open past 24 h | Foreground listener and 60 s timer refresh the decision | A secondary button to answer again (`ageGate.mistakeButton`, value to be reworded by content, BL-037) | Gate asks again with nothing selected | Unit with fake timers |
| F01-U05 | Reinstall after No | Local settings are gone; the gate asks again | Gate | n/a | Accepted residual (TDD 04 3.3 item 3: never persist an under-18 signal in Keychain) |
| F01-U06 | Invite link tapped on a fresh install | Token written to Keychain before any UI (A-REQ-028); route holds `hasInvite` only | Gate first, then F11 join flow; Welcome skipped | Gate No deletes the token (F11-REQ-006) | Integration: link at cold start; No leaves Keychain empty |
| F01-U07 | Auth link tapped before the gate was answered | Token hash held in memory only, never stored | Gate, then F02 verify | If the app is killed, the person types the 6-digit code instead (F02) | Integration |
| F01-U08 | Any other deep link before Yes | Ignored; not queued | Gate | Normal navigation after Yes | Unit on link parser |
| F01-U09 | Offline at first launch | Nothing in F01 needs network | Gate and Welcome as normal | n/a | Airplane-mode automated test (checklist 6.1) |
| F01-U10 | Declared Age Range sheet slow or hangs | 3 s timeout, then own question | Gate | n/a | Unit with mocked module |
| F01-U11 | App killed or backgrounded on the gate | Nothing stored until Continue | Gate again on return | n/a | Maestro |
| F01-U12 | Call, Siri or alarm during the gate or welcome | No audio session is active in entry | Same screen on return | n/a | Manual device script |
| F01-U13 | Double tap on Continue or a welcome button | Handlers ignore a second press while a route change is pending | One transition | n/a | Component test |
| F01-U14 | VoiceOver on | Focus starts on the gate title; Yes and No read as "radio button, not selected, 1 of 2"; the stop screen is announced (`AccessibilityInfo.announceForAccessibility`, already in code) | Spoken order matches visual order | n/a | VoiceOver script V-F01 |
| F01-U15 | AX5 text size, iPhone SE 3 | Screens scroll; buttons grow; Yes and No stack vertically; nothing truncates | Full text | n/a | Component test at AX5 (BL-269) |
| F01-U16 | Reduce Motion on | Step entry uses the 200 ms fade from `useMotion()` | No slide | n/a | Component test |
| F01-U17 | Low storage (under 100 MB free) | Entry writes one settings row; no warning in entry (F04 owns the 1 GB warning) | Normal | n/a | Device test |
| F01-U18 | Signed-in account later reported under 18 (support or store signal) | Support runbook `close_underage_account` (TDD 04 3.3 item 5); counsel decides grace | n/a in app | Runbook | Runbook dry run (F20) |
| F01-U19 | Settings database unreadable at launch | Treated as `ask` (a damaged value counts as a fresh stop if it was a No timestamp) | Gate | n/a | Unit, existing |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| A-REQ-001 | P0 | Branded splash | Given a cold start, Then the launch screen is paper (light #FBF8F3, dark #161412) and the first frame shows no colour jump | A-REQ-001; `app.config.ts` |
| A-REQ-002 | P0 | Splash never waits on network, model or sync | Given airplane mode, When the app cold starts, Then the first route renders and the splash hides | Checklist 6.1 |
| PRD-REQ-019 Rev (DR-10) | P0 | 18+ entry gate before any route; Declared Age Range where `isEligibleForAgeFeatures` is true | Given a fresh install opened by icon, invite link or auth link, Then the first interactive screen is the gate with nothing selected and Continue disabled. Given an under-18 Declared Age Range result, Then the stop screen shows without the question | PRD-REQ-019, LEGAL-REQ-002, DR-10 |
| F01-REQ-001 | P0 | Yes stores a boolean only | Given Yes, Then the settings table holds `ageGate.passed = '1'` and no age, date, range or timestamp of the Yes anywhere on the device or server | D-026 |
| F01-REQ-002 | P0 | No creates nothing and holds for 24 hours | Given No, Then exactly one row `ageGate.stoppedAt` exists, Keychain holds no invite or auth token, Documents holds no file, and zero network requests were made; Given a relaunch at 23 h 59 min, Then the stop screen shows | LEGAL-REQ-002, F11-REQ-006 |
| F01-REQ-003 | P0 | Declared Age Range result stays in memory | Given any response, Then a test spying on the store, logger, Sentry and analytics sees zero calls carrying it | LEGAL-REQ-002, TDD 04 3.3 |
| F01-REQ-004 | P0 | Pending links survive the gate only after Yes | Given an invite link at cold start, When Yes, Then the join flow opens with the token from Keychain; When No, Then the token is deleted | A-REQ-028 |
| F01-REQ-005 | P0 | One welcome screen with three actions | Given the gate passed and no child or local letter, Then Welcome shows Start a book, I was invited and Sign in, each 44 pt or taller (primary 56 pt), all reachable without horizontal scroll at AX5 | D-043, A-REQ-005 |
| A-REQ-035 Rev (D-043) | P0 | Notice before data | Given Start a book, When F03's first field appears, Then the two-sentence notice was on screen in Welcome; entry requests no contacts | A-REQ-035, K-16 |
| F01-REQ-006 | P0 | Returning launches skip entry | Given `ageGate.passed` and at least one child, Then the first route is Tonight with no welcome and no animation | TDD 01 3.1 |
| A-REQ-030 | P0 | Offline entry | Given no network, Then gate, Welcome and F03 work | A-REQ-030 |
| F01-REQ-007 | P0 | No permission prompts in entry | Given a fresh install through Welcome, Then no OS permission prompt appeared | LEGAL-REQ-007 |
| F01-REQ-008 | P0 | Accessible gate and welcome | Given VoiceOver, Then every element has a label and role, focus starts on the title, and the stop screen is announced; Given AX5, Then no text truncates | A-NFR-005, A-NFR-007, LEGAL-REQ-051 |
| F01-REQ-009 | P1 | Gate copy has no brand literal | Given `ageGate.stopBody`, Then the public name comes from `packages/brand` through a placeholder (TDD 01 X-5) | CLAUDE.md |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Leaves the phone |
|---|---|---|---|---|---|
| `ageGate.passed` | L2 | Device settings table | The app | Install lifetime | Never; the server records `age_attested: true` in the `terms` acceptance context at sign-in (F02) |
| `ageGate.stoppedAt` | L2 | Device settings table | The app | Until the next Yes | Never |
| Declared Age Range response | Not stored | Memory | Gate module | Request lifetime | Never |
| Pending invite token | L4 | Keychain, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (TDD 04 3.2.1) | Join flow | Acceptance, expiry or a No | Only to `invite-redeem` in a request body (F11) |
| Auth token hash from a link | L4 | Memory only | F02 verify | Until `verifyOtp` returns | Only to Supabase Auth |

Token-bearing URLs are never logged, never passed as route params, and stripped from Sentry breadcrumbs (A-NFR-012). Counsel confirms that blocking all minors meets SB 2420 without parental-consent flows (DR-10, R4 collision C4); Apple signals parental consent revocation through `RESCIND_CONSENT`, a server notification we do not receive (B2), which matters little for an 18+ app because Apple blocks launch itself (R4-S42). This is research-backed product writing, not legal advice.

## 9. Non-functional requirements

| Budget | Target | Gate |
|---|---|---|
| Cold start to first interactive frame (SE 3) | p50 1.2 s, p90 2.0 s | Yes (A-NFR-001) |
| Warm start | p50 400 ms | Yes |
| Gate answer to Welcome interactive | p95 300 ms | Yes [A] (B-NFR-008 budget reused) |
| Declared Age Range timeout | 3 s, then fall back | Yes |
| Work before first frame | No import of PostHog, Sentry, whisper or crypto in `_layout` (TDD 01 3.1 budget plan) | Yes |
| Accessibility | WCAG 2.2 AA both themes, AX5, VoiceOver complete | Yes (A-NFR-005 to -007) |

Shared budgets live in `06-nfr.md`.

## 10. Analytics

No F01 event is sent. Analytics consent is the third ask after the first letter (PRD-REQ-001, K-01), so nothing before it can leave the phone, including gate answers. The gate answer is never an analytics property at any time.

| Event | Properties | Question it answers |
|---|---|---|
| `analytics_opted_in` (exists) | `came_from_invite`, `time_to_first_letter`, `days_since_install` | Did entry plus first run fit the 90 s budget, and how many came by invite |
| `app_cold_start` (exists) | `ttfi_bucket` | Field cold start for consenting users |
| `invite_opened` (exists) | `via`, `signed_in` | Sent only when consent already exists (a later invite) |

## 11. How we build it (with the architect)

**What exists (verified 3 Oct).**
- `apps/mobile/src/lib/age-gate.logic.ts`: pure `decideGate` and `answerGate`, 24 h `BLOCK_MS`, clock repair; tested in `apps/mobile/test/age-gate.test.ts`.
- `apps/mobile/src/lib/age-gate.ts`: `useAgeGate()`, `answerAgeGate()`, `reopenAgeGate()`, keys `ageGate.passed` and `ageGate.stoppedAt`; foreground and 60 s refresh.
- `apps/mobile/src/components/gate/age-gate-screen.tsx`: neutral radio group, stop screen with announcement, re-ask offered only after the window.
- `apps/mobile/src/app/_layout.tsx`: renders `AgeGateScreen` instead of the Stack until `pass`; launch sweep only after pass; splash hidden in an effect (BL-040 moves it to the first route's layout).
- `apps/mobile/src/lib/db/migrations.ts`: migrates legacy `ageAttested` to `ageGate.passed` and drops `ageAttestedAt`.
- Welcome today is the first step of `apps/mobile/src/app/onboarding.tsx` and shows only the start button.
- Gaps: no deep link handling (only `Linking.openSettings` in `listen.tsx`), no `ios.associatedDomains` in `app.config.ts`, `brand.scheme` is `scribe`, `publisher.domain` is `example.com` on this branch (set to earlyletters.com on `origin/fix/brand-domain`, not merged), no Declared Age Range module.

**Design.**
1. `bootstrap()` (BL-040): synchronous read of settings and cached config, returns `gate | stop | welcome | invite | tonight`; route groups per TDD 01 3.1.
2. `src/lib/links.ts` (new): parses `Linking.getInitialURL()` and the URL listener; accepts only `https://earlyletters.com/j` and `/auth/confirm` with a fragment; invite token to Keychain through `src/lib/secure.ts` (new, `expo-secure-store`, F02); auth hash held in memory.
3. `modules/age-range` (new Expo module, Swift): `isEligible()` and `requestAgeRange(18)` returning `'adult' | 'minor' | 'unknown'`; compiled with the iOS 26 SDK (Xcode 26 required since 28 Apr 2026, R4-S43), guarded by `#available(iOS 26.2, *)`; entitlement `com.apple.developer.declared-age-range` (R4-S37). Behind `src/lib/age-range.ts`.
4. `src/app/welcome.tsx` (new) split out of `onboarding.tsx`.
5. `app.config.ts`: `ios.associatedDomains: ['applinks:earlyletters.com']` after BL-100; scheme decision (Q2).

**Riskiest unknown and spike.** Declared Age Range from an Expo module with no library: a half-day spike in a dev build on an iOS 26.2 sandbox account (Texas), ending in a recorded response matrix. If the spike fails, v1.0 ships our question alone and counsel is told (DR-10 B).

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F01-01 | Gate hardening: token deletion on No, brand placeholder in stop copy, re-ask wording | `apps/mobile/src/lib/age-gate*.ts`, `apps/mobile/src/components/gate/` | none (BL-037) | `[F01-REQ-001]`, `[F01-REQ-002]` unit and integration; existing gate tests green | agent (mobile engineer) |
| WP-F01-02 | Declared Age Range spike, then module | `apps/mobile/modules/age-range/`, `apps/mobile/src/lib/age-range.ts` | Xcode 26 build | `[F01-REQ-003]` spy test; sandbox matrix recorded in the PR | pair (security engineer plus human sandbox check) |
| WP-F01-03 | `bootstrap()` and route groups; splash hides on first route layout | `apps/mobile/src/lib/bootstrap.ts` (new), `apps/mobile/src/app/_layout.tsx` (coordinator wires) | BL-111, WP-F01-01 (BL-040) | `[A-REQ-002]` airplane test; `[F01-REQ-006]` | agent (mobile engineer) |
| WP-F01-04 | Welcome screen with three actions and notice | `apps/mobile/src/app/welcome.tsx` (new), `apps/mobile/src/app/onboarding.tsx` (remove welcome step), feature `copy.ts` | WP-F01-03 (BL-137) | `[F01-REQ-005]`, `[A-REQ-035]` at default and AX5; VoiceOver V-F01 | agent (mobile engineer, content) |
| WP-F01-05 | Link parser and pending-token hold | `apps/mobile/src/lib/links.ts` (new) | F02 WP-F02-01 (secure store), BL-170 | `[F01-REQ-004]`; parser unit tests reject other hosts, query tokens and scheme tokens | agent (mobile engineer) |
| WP-F01-06 | Splash mark and associated domains | `apps/mobile/app.config.ts`, `apps/mobile/assets/` | BL-100 domain, design mark (BL-031) | `[A-REQ-001]` screenshot diff light and dark | agent plus human device check |

## 13. Open questions and assumptions

| Q | Who answers | By when | What changes |
|---|---|---|---|
| Q1. Gate before or after Welcome. D-043 reads "welcome screen, then the 18+ gate"; PRD-REQ-019, LEGAL-REQ-002 and the shipped root gate put the question first. This spec puts the gate first (nothing, not even the notice, renders before it). | Founder | 16 Oct | If Welcome goes first: Welcome must create nothing and every action routes through the gate |
| Q2. Change `brand.scheme` from `scribe` to a distinctive value before the first store build (email SECURITY.md rec on `origin/feat/email-brand-library`) | Founder | Before BL-108 first EAS production build | `packages/brand`, F02 page buttons |
| Q3. Does blocking all minors meet SB 2420 with no parental flows? | Counsel | 20 Nov (DR-10) | Possible parental flow (DR-10 B) |
| Q4. Does Apple deliver California AB 1043's signal through Declared Age Range? | Counsel, platform engineer | Before 1 Jan 2027 | A second signal source |
| Q5. Final button labels (Start a book / Begin the book; Sign in / I already have a book) | Content owner | Copy freeze | `onboarding.welcome.*` values |

| A | Assumption | How we validate |
|---|---|---|
| A1 | F01 takes about 8 s at the median | Maestro timing on 10 fresh installs; Study 1 diary |
| A2 | Universal links on `/j` and `/auth/confirm` with fragments reach the app from Mail, Gmail, Outlook and Messages | Manual script on device (A-REQ-022) once the AASA file is live |
| A3 | A 3 s Declared Age Range timeout is long enough for the system sheet | Spike measurements |

## 14. Sources

- Repo: `apps/mobile/src/lib/age-gate.ts`, `age-gate.logic.ts`, `apps/mobile/src/components/gate/age-gate-screen.tsx`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/app/onboarding.tsx`, `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/test/age-gate.test.ts`, `apps/mobile/app.config.ts`, `packages/brand/index.ts`, `packages/content/src/strings.en.ts` (`ageGate.*`, `onboarding.welcome.*`), `packages/analytics/src/catalog.ts`.
- Docs: `docs/prd/A-entry-and-auth.md` (F1, F2.5, F7, F8, sections 5 to 7), `docs/prd/PRD.md` (PRD-REQ-019, K-07, K-16, 6.1, 7.1), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-002, -007), `docs/DECISIONS.md` (D-026, D-040, D-043), `docs/tdd/01-mobile-client.md` (2.3, 3.1, 3.3), `docs/tdd/04-security-identity.md` (3.2.1, 3.3), `docs/BACKLOG.md` (BL-031, BL-037, BL-040, BL-137, BL-170), `docs/prd/v2/09-decisions-and-risks.md` (DR-10, R-13), `docs/prd/v2/features/F11-co-parent.md` (F11-REQ-006), `docs/research/USER_RESEARCH.md` (S10, R1).
- Research: R1 F01 and section 4 (R1-S1, R1-S2, R1-S3, R1-S4, R1-S20, R1-S45, R1-S51, R1-S58, R1-S67, R1-S71); R4 sections 4 and 5 (R4-S37, R4-S38, R4-S40, R4-S42, R4-S43, R4-S44, R4-S47, R4-S49, R4-S52, R4-S53, R4-S55).
- Branch `origin/feat/email-brand-library`: `docs/emails/SECURITY.md` section 3.1 (scheme recommendation).
