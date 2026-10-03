# PRD V2 authoring contract

Read this before writing or reviewing anything in `docs/prd/v2/`. It is the rulebook for every writer (human or agent) and every critic. Date: 3 Oct 2026.

## 1. What V2 is

V2 replaces `docs/prd/PRD.md` 1.3 as the product requirements for Early Letters (codename `scribe`). It covers the whole product. Release v1.0 is specified to build depth. v1.1 and later are stack-ranked with lighter specs. It keeps every existing requirement ID (A-REQ, B-REQ, C-REQ, PRD-REQ, LEGAL-REQ, DATA-REQ) so `docs/BACKLOG.md` and test titles still trace (ADR 0011). New requirements use `F##-REQ-###`.

V2 is written for three readers: the founder (decides), architects (shape how), and AI agent engineers who build from it without asking questions. If an agent would have to guess, the spec is not done.

## 2. Source of truth, in this order

1. **Founder decisions in `docs/agents/BRIEF-2026-10-03.md`** (newest; the founder confirmed on 3 Oct that the brief wins over PRD 1.3).
2. `docs/DECISIONS.md` (D-###), where the brief does not override it.
3. `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ) and `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ). A legal duty wins over a product wish until counsel or the founder says otherwise. If a brief decision collides with a legal duty, do not resolve it yourself: write it as an open question for counsel and the founder.
4. `docs/prd/PRD.md` 1.3 and appendices A, B, C.
5. `docs/tdd/01` to `10`, `docs/adr/*`, `docs/ARCHITECTURE.md` (note its 3 Oct status box).
6. Research: `docs/prd/v2/research/R1..R3`, `docs/research/USER_RESEARCH.md` (UR), `docs/research/COMPETITIVE_RESEARCH.md` (CR).

## 3. What the 3 Oct brief changes (apply these; do not re-argue them)

| # | Brief decision | What it overrides in 1.3 | Consequence a writer must handle |
|---|---|---|---|
| B1 | Family at v1.0 is **co-parent only**. Contributors (grandparents, aunts, uncles) and the web contribution page are v1.1. The database keeps contributor support; the app hides it. | D-002, K-35, B-REQ-007/-009/-010 contributor paths, C-REQ-007 family-letter push | Co-parent letters still need approval rules, notifications and visibility. "Family authors free" now means co-parents at v1.0. |
| B2 | **Payments: Apple only, out of the box.** StoreKit 2 with Apple's own subscription UI (SubscriptionStoreView or the closest Apple-provided equivalent reachable from Expo), Apple's restore and manage sheets, on-device entitlement check (`Transaction.currentEntitlements`). No server of ours sees purchases. No RevenueCat, no App Store Server Notifications endpoint. Co-parent gets Plus through Apple Family Sharing. Server entitlement tables are removed; server code does not enforce Plus. $3.99/month with 1-month trial, $29.99/year with 2-month trial. | ADR 0013 server parts, D-001 server parts, PRD-REQ-003 (server-computed notices), PRD-REQ-015 server enforcement, PRD-REQ-017 purchase ledger, K-28 (Plus per account inherited by books), C-REQ-024 to C-REQ-026 notice delivery | (a) Auto-renewal and trial notices (LEGAL-REQ-047, California ARL) can no longer be computed from server snapshots. Billing emails are parked on branch `feat/email-brand-library`. Open question for counsel. (b) Family Sharing covers a co-parent only if both are in the same Apple Family group. (c) The second-child Plus rule is enforced on the device only. |
| B3 | **Sign-in:** Sign in with Apple, Sign in with Google, email magic link. Passkeys can be added after sign-in. No passwords. | D-044 (Google in v1.1), A-REQ-017 tier | 1.3 specifies link plus 6-digit code (A-REQ-018). The brief says "magic link". Keep the code unless a reason to drop it is found; flag it. |
| B4 | **Spoken-letter languages at v1.0:** English, Hindi, Spanish, Mandarin Chinese, French, Arabic, Portuguese. Each needs strong language-specific transcription, correct spelling, script and punctuation (Hindi in Devanagari, Arabic right to left, Chinese characters, accents), and phonetics for taught names. App UI stays English but localisation-ready. Hindi-English code-switching mode is v1.1. | K-24 (English and Hindi, code-switched speech P0), B-REQ-003 Hindi script choice | Seven languages multiply the transcription, packs, review and QA work. Code-switching moves out of v1.0. |
| B5 | Machine may fix spelling, script, punctuation, remove "um" and stumbles, tiny agreement slips. Never rewords. **Typed text keeps the keyboard's own autocorrect; we never rewrite typed text.** | none (confirms the constitution) | Typed letters get no machine edit pass at all. |
| B6 | **Audio:** the original recording is never altered. Apple voice processing at record time where it helps, and/or proven open-source noise suppression (RNNoise BSD, DeepFilterNet MIT/Apache) to make a cleaner listening copy. The person can always hear the original. | new | Two audio files per letter (original, listening copy) or one plus a flag. Storage and export implications. |
| B7 | **Deferred to v1.1:** Hindi-English mode; the safety classifier (a static "If you are struggling" row ships instead); word highlighting in Read together; family hearing each other's recordings (**no audio upload in v1.0**); Google Play / Android; the web contribution page. | D-032, PRD-REQ-021 (shared voice), D-034, PRD-REQ-020 (defines a Read together session by word-highlight playback), ROADMAP M4 and M7 | (a) In v1.0 a co-parent cannot hear the other parent's recordings; only the author's phone holds the audio. (b) PRD-REQ-020 must be redefined. (c) Plus at v1.0 has no cloud backup. |
| B8 | **Beta** runs on TestFlight. The store listing never says "beta". The app keeps a small "early version, can make mistakes" note. | Resolves D-030, K-37 | |
| B9 | Privacy and trust are paramount and conveyed subtly: never sold, never used for ads, never used to train models. Calm, in the right places, backed by real controls. | | |
| B10 | Analytics: opt-in PostHog plus server aggregates, feeding a self-learning loop where agents read the data, write findings and propose backlog items. | D-003 confirmed | Server aggregates can no longer include purchase data (B2). |
| B11 | Domains: earlyletters.com primary; earlyletters.app redirects. Email through Resend; hello@earlyletters.com live. Legal pages at /terms, /privacy, /health-privacy, /subprocessors. Universal links on https://earlyletters.com. | Q5, BL-100 | |
| B12 | Publisher: individual Apple Developer account. | D-004 confirmed | |
| B13 | **Lean app:** download size under 40 MB, measured on every release build. Ships: code, English text-rules pack, subset fonts. Downloaded on demand: speech models and every non-English language pack. Packs are data, not code (versioned JSON plus model file, SHA-256 against a signed manifest), interpreted by a generic engine in the app (App Store 2.5.2). Prefer Apple-hosted Background Assets if feasible from Expo; else a cheap-egress CDN (Cloudflare R2, Hugging Face for public models). Packs deletable in Settings. | PRD 7.7 (80 MB budget) | |
| B14 | **Server-driven content inside native screens** (recommended, founder may override): prompts, tips, onboarding story cards, announcements, remote config, feature flags, kill switches, pack manifests as typed, schema-validated, versioned, signed or hashed, cached content blocks from an edge cache. Works offline from the last good copy. Never server-driven: anything that changes data collection or the paywall, or could slip past App Review (2.3.1). | new | |
| B15 | **API quality:** every endpoint has a p95 budget and an auth check, is idempotent under retries, rate-limited, content-free in logs, carries request ids, uses user JWTs only (no service keys in the app). Public config and manifests from CDN with long cache plus ETag. User data through Supabase RLS and RPCs in one US region. Typed, versioned contracts in `packages/api`. | new | |
| B16 | Standard over custom. Quality bar: Airbnb, Calm, Headspace, Day One, Apple's own apps. Use Reanimated, Gesture Handler, @gorhom/bottom-sheet, Apple-native views through Expo. | | |

Decisions still open (cite, do not decide): D-023 sync engine (outbox and cursor on expo-sqlite recommended), D-033 free audio durability copy, D-004 individual-publisher hedge, D-045 beta cohorts, D-031 Hindi script default, D-050 second consent at first share (counsel), plus anything the brief creates (see B2 consequences).

## 4. Feature map and file names

v1.0 features get full specs. v1.1 and later get light specs in `features/F30-later.md`.

| ID | Feature | File | Release |
|---|---|---|---|
| F01 | Entry, 18+ gate and welcome | `features/F01-entry.md` | v1.0 |
| F02 | Account and sign-in (Keep the book, local-first, re-ownership) | `features/F02-account.md` | v1.0 |
| F03 | First run: child, signature, languages, names | `features/F03-first-run.md` | v1.0 |
| F04 | Capture: speak or type a note or letter | `features/F04-capture.md` | v1.0 |
| F05 | On-device transcription and language packs | `features/F05-transcription.md` | v1.0 |
| F06 | Faithful edit and review | `features/F06-faithful-edit.md` | v1.0 |
| F07 | Names and words dictionary | `features/F07-dictionary.md` | v1.0 |
| F08 | Recordings: original, listening copy, playback, durability | `features/F08-recordings.md` | v1.0 |
| F09 | The book: month chapters, Before You, cards | `features/F09-book.md` | v1.0 |
| F10 | Read together | `features/F10-read-together.md` | v1.0 (word highlight v1.1) |
| F11 | Co-parent sharing | `features/F11-co-parent.md` | v1.0 |
| F12 | Multiple children | `features/F12-children.md` | v1.0 |
| F13 | Prompts, reminders and notifications | `features/F13-prompts-reminders.md` | v1.0 |
| F14 | Plus: subscription, paywall, lapse | `features/F14-plus.md` | v1.0 |
| F15 | Export and the PDF book | `features/F15-export.md` | v1.0 |
| F16 | Sync, devices and restore | `features/F16-sync.md` | v1.0 |
| F17 | Settings, privacy controls, consents and deletion | `features/F17-settings-privacy.md` | v1.0 |
| F18 | Analytics and the learning loop | `features/F18-analytics.md` | v1.0 |
| F19 | Server-driven content, remote config, kill switches, pack delivery | `features/F19-content-config.md` | v1.0 |
| F20 | Help, support and safety resources | `features/F20-help-safety.md` | v1.0 |
| F21 | App Store listing, website and legal pages | `features/F21-store-web.md` | v1.0 |
| F31 to F49 | Later releases, numbered and ranked in `05-feature-map.md` section 3 (shared voice and audio backup, contributors, Hindi and Arabic catch-up and code-switching, word highlight, server transcription, Android, web page, second-language versions, safety classifier, story intro, sealed letters, print, lifetime and gifts, UI localisation, next languages, themes and photos, On this day, Vault mode, Apple-hosted packs) | `features/F30-later.md` | v1.1, later |

Personas are defined in `02-customers.md`. Use these handles: **P1 Evening parent** (primary author and buyer), **P2 Co-parent**, **P3 Expecting parent**, **P4 Multilingual family**, **P5 Close family** (v1.1 contributor), **P6 Future reader** (the child, years later).

## 5. Feature spec template (use every heading, in this order)

```
# F## Name

| | |
|---|---|
| Release | v1.0 gate / v1.1 / later |
| Priority and rank | P0, rank n (rank set in 05-feature-map.md) |
| Personas | P1, P2 ... |
| Existing IDs | A-REQ-..., LEGAL-REQ-..., D-..., BL-... |
| Depends on | F##, F## |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why
The problem this feature solves, with evidence. 3 to 8 sentences or bullets. Labeled evidence only.

## 2. Who
Which personas, in which moment of their life and day. What they are holding, feeling, short of.

## 3. What we are solving
One-sentence outcome. Then success measures (metric, target, how measured, consent caveat).

## 4. Scope
In v1.0. Later (with release). Never (and why).

## 5. Market reference
Table: Product | What it does | Does it work? (evidence) | What customers say | Our call (Match / Innovate / Avoid) and why.
Only products and claims backed by R1, R2, R3, UR or CR. Mark Unverified where the research does.

## 6. Experience
6.1 Entry points.
6.2 Happy path: numbered steps. Each step: what the person does, what the app shows (copy key if one exists in packages/content), what the system does.
6.3 Unhappy paths and edge cases: table with ID (F##-U##) | Trigger | System behaviour | What the person sees | Recovery | Test.
Cover at least: offline, no permission, low storage, app killed or backgrounded, interruption (call, Siri, alarm), slow or failed network, server error, conflicting edits, duplicate taps, accessibility (VoiceOver, AX5 text, Reduce Motion), device limits (iPhone SE 3), account states (signed out, lapsed, deleted), co-parent and multi-child states, languages and scripts where relevant.

## 7. Requirements and acceptance criteria
Table: ID | P | Requirement | Acceptance criteria (Given / When / Then, testable, with numbers) | Source.
Reuse existing IDs. Mark revised ones "Rev (B#)" with the brief item. New: F##-REQ-001...

## 8. Data, privacy and security
What data the feature creates or reads, its level (L1 to L4, PRD 1.3 section 7.10), where it lives (device, Postgres, Storage), who can read it, retention, what never leaves the phone.

## 9. Non-functional requirements
Budgets specific to this feature (speed, size, battery, reliability, accessibility). Link to 06-nfr.md for shared ones.

## 10. Analytics
Events (from packages/analytics catalogue where they exist), properties (L2 only), the question each event answers. Consent-gated.

## 11. How we build it (with the architect)
Components, packages, files, libraries (standard over custom; permissive licences only), data model and API contracts, sequencing, the riskiest unknown and the spike that retires it. Cite TDD and ADR sections.

## 12. Work packages
Agent-sized units: WP-F##-## | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode (agent / pair / human).
Each WP is one pull request a reviewer can check in under 30 minutes.

## 13. Open questions and assumptions
Q: who answers, by when, what changes. A: labeled assumptions with how we will validate.

## 14. Sources
Every source cited above.
```

## 6. Evidence rules (no hallucination)

- Label claims: **[F]** fact with a source; **[S]** signal (anecdote, reviews, sourced); **[A]** assumption (ours, with how to validate); **[D]** founder decision (D-### or B#); **[R]** recommendation.
- Every [F] and [S] cites a source: a research file entry (`R1-S12`, `UR S24`, `CR S6`) or a repo path with section.
- Never state a competitor feature, price, rating, model capability, library API, Apple rule, law or number without a source. If you cannot source it, write it as [A] or "Unverified".
- Do not invent copy keys, file paths, table names or functions. If you name an existing one, check it exists in the repo. If you propose a new one, say "new".
- Paraphrase sources. No quotes over 15 words, at most one quote per source.

## 7. Voice rules (the founder's tone, not AI tone)

- Plain, direct, peer to peer. Short sentences. Active voice. Specific numbers.
- No em dashes, en dashes, curly quotes, ellipsis characters or emoji (same rules as `packages/content`).
- Banned words and patterns: seamless, robust, leverage, delightful, empower, unlock (except Apple's own term), cutting-edge, game-changer, holistic, synergy, "in today's world", "it's important to note", "it's worth noting", "dive into", "navigate the", "elevate", "streamline", "best-in-class", "world-class", rhetorical questions, three-adjective lists, closing summaries that repeat the section.
- No hedging filler. If unsure, say exactly what is unknown and who resolves it.
- Product copy examples follow `packages/content/VOICE.md`: never gender the child (use `{child}`), no fear, guilt or loss language, never imply AI writes anything.
- Real family details never appear. The fictional family is "Asha".

## 8. Definition of done for a spec

1. Every template heading is filled or says "None" with a reason.
2. Every v1.0 requirement has testable acceptance criteria with a number or an observable state.
3. Unhappy paths cover the list in 6.3 where relevant.
4. Every market claim and number is sourced or labeled.
5. Every brief consequence (section 3) that touches the feature is handled or raised as an open question.
6. Work packages are small, fenced to files, ordered, and name the tests that prove them.
7. Content rules pass: run `node docs/prd/v2/tools/lint.mjs <file>` when it exists.
