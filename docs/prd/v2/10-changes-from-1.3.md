# 10. What V2 changed from PRD 1.3

Status: 13 Oct 2026. Compares `docs/prd/PRD.md` 1.3 (3 Oct 2026) and its appendices A, B and C with PRD V2 as it stands on 13 Oct. Each row cites the decision that made the change: B1 to B16 are the 3 Oct brief, M1 to M14 the founder decisions after it (`_AUTHORING.md` sections 3 and 3b). PRD 1.4 on `origin/main` (4 Oct) applied the first membership decision; V2 carries its IDs (PRD-REQ-024 to PRD-REQ-027, K-44, K-45) through F14.

## 1. Changes by area

| Area | PRD 1.3 said | V2 says | Source |
|---|---|---|---|
| Submission date | Mon 11 Jan 2027 (1.3 section 1) | ROADMAP 2.1 moved it to the week of Mon 2 Nov 2026; after M14, the week of Mon 23 Nov 2026 at about 40% confidence [A] (`08-delivery.md` section 2) | M13, M14 |
| Server in v1.0 | Sync, family and Plus ledger on the server | Server features on for v1.0: sign-in, sync, co-parent, owner backup, status report and reminder emails. The build switch stays as the kill path. This reverses commit c1764f9 ("v1.0 on-device only", 4 Oct) | M14 |
| Family at v1.0 | Co-parent and Family (contributor) roles in the app, approvals, per-child sharing, family-letter push (D-002, K-35) | Co-parent only. Contributors and the web page are v1.1 (F32, F37); the database keeps contributor support and the app hides it | B1 |
| Parents per book | No cap | At most two, refused by the server | M8, D-069 |
| Billing path | StoreKit 2 with App Store Server Notifications V2; per-account entitlement inherited by books; purchase ledger (PRD-REQ-017, K-34, ADR 0013) | Apple only, on the device: Apple's subscription view, restore and manage sheets, `Transaction.currentEntitlements`. No notifications endpoint, no server entitlement; the server never enforces Plus | B2, D-053, D-080 |
| What Plus is | "Free forever: write, read, play, export, family authors"; first book free, more children need Plus; Read together 3 free sessions, then Plus (PRD-REQ-015, PRD-REQ-020, K-12, K-28) | A membership: the first 2 letters kept per account are free, one pool across books; after that the Keep step needs Plus. Capture, typing, review, reading, playing, export, delete and restore are never gated; a held letter is never lost. Read together and more books are free | M1, M2, D-082, D-083 |
| Prices | $3.99 a month with a 1-month trial; $29.99 a year with a 2-month trial | $4.99 a month with a 1-month trial; $49.99 a year with a 2-month trial | M3, D-082 |
| Co-parent Plus | Plus held per account and inherited by every book its holder parents (K-28) | Only through Apple Family Sharing in one Apple Family. Whether one membership covers a co-parent outside it is open (DR-16) | M4, D-080 |
| Codes | Web gift codes later (C-REQ-033) | Apple offer codes, a "Redeem a code" row in Settings > Plan; no code system of ours | M5, D-052 (main) |
| Auto-renewal notices | Server-computed notices in the K-38 windows (C-REQ-024 to C-REQ-026, PRD-REQ-003) | Phone reminders and cards computed on the device, plus reminder emails sent from a status-only report (plan, trial end, renewal date, cancelled flag); purchase consent facts on the first report. Counsel reviews wording | B2, M6, D-080, D-081 |
| Sign-in | Apple and email link plus code; Google in v1.1 (D-044) | Apple, Google and email link; link plus 6-digit code kept (DR-13); passkeys after sign-in, off in v1.0 | B3 |
| Spoken languages | English and Hindi, code-switched speech P0 (K-24) | English, Hindi, Spanish, Mandarin Chinese, French, Arabic, Portuguese; each appears only after it passes its own gate on the SE 3 (DR-01 default A). Hindi-English mode is v1.1 (F33) | B4, DR-01 |
| Machine edits | Every machine edit passes `verifyEdits` | Same, plus the R-01 regression suite with zero accepted meaning changes per language in Node and Hermes. Typed text gets no machine edit. The feature is called "Word for word" | B5, M9, D-074, D-086, 09 R-01 |
| Audio | One recording; shared voice pending D-032 (members can play each other's recordings) | The original is never altered. A listening copy is rendered after save through AUSoundIsolation (as built, DR-09). The owner's own recordings get an encrypted backup in v1.0; family members hearing each other's recordings is v1.1 (F31) | B6, B7, M7, D-073, M14 |
| Read together | A session is word-highlight playback (PRD-REQ-020) | Playback of recordings in order, without word highlight (v1.1, F34); a session exists for analytics only | B7, M2 |
| Safety | Classifier unless a clinician signs off by 20 Nov (D-034) | A static "If you are struggling" row ships; the classifier is v1.1 (F39) | B7 |
| Beta wording | Beta label in About and the store description (K-13, K-37) | TestFlight beta; the store listing never says "beta"; a small "early version, can make mistakes" note in About | B8 |
| Privacy promise | Content-free analytics; claims pass | Never sold, never used for ads, never used to train models, said calmly with real controls | B9 |
| Analytics | Full opt-in catalogue and server aggregates (K-01) | Same, plus a learning loop where agents read data and propose backlog items without pushing; aggregates exclude purchase data | B10, D-070 |
| Domains and pages | Placeholder domain in `packages/brand` | earlyletters.com primary, earlyletters.app redirects, email through Resend, legal pages at /terms, /privacy, /health-privacy, /subprocessors | B11 |
| App size | 80 MB, not a gate (1.3 section 7.7) | Under 40 MB, a gate on every release build; speech models and non-English packs download on demand as signed data | B13 |
| Server-driven content | Not specified | Prompts, tips, story cards, announcements, remote config, flags, kill switches and pack manifests as signed, cached content blocks; nothing that changes data collection or the paywall. One config source | B14, M12, D-068, ADR 0016 |
| API quality | Not specified | Every endpoint has a p95 budget, an auth check, idempotency, a rate limit, request ids and content-free logs; user JWTs only; typed contracts in `packages/api` | B15, ADR 0017 |
| First run | Child, signature, languages and Hindi script, goals, dictionary | The goals step moves to v1.1 (B-REQ-013 Rev); the birth date is required with no default; the speech download waits for an explicit choice | F03 section 4, D-087 |
| Quiet days | Not specified | "Not much today" stores a mark with no words; never counts, prints, plays or enters the book | M10, D-084 |
| Delete and recovery | Recently deleted with 30-day undo | Confirm before delete, the Recently deleted shelf, durable erase, a playable check for recovered takes, "Last export" in Settings | M11, D-085 |
| Story intro | 4 stories in v1.1 (D-043) | Unchanged; F40 | D-043 |
| Durability tests | Kill during save, 500 runs | 500 Simulator plus 50 on the SE 3; plus kill while recording, typed kills and Review kills | 06 section 1, 07 section 6 |
| Transcription gates | Hindi plus Devanagari transcribes (1.3 section 6.2); speed Unverified, no gate | A corpus gate per language and a speed gate per passed language on the SE 3 | 06 section 1, F05 |
| Server classes and load | Store notifications, server entitlement, AI gateway; 2.2 members per family | Those removed; `sync_push`, `sync_pull`, public config and manifests added; storage upload and escrow return with the owner backup; 1.5 accounts per family | 06 section 1, F16 section 9 |
| Delivery | Weeks to January in ROADMAP 2.0 | 20 agent work streams with file fences, waves, a weekly merge budget and a wave 1 dispatch table | `08-delivery.md`, 09 R-04 |

## 2. Requirement IDs added, revised and removed, per spec

Method: a script read the section 7 table of each spec on 13 Oct and counted distinct IDs per spec. "Added" is a new `F##-REQ-###`. "Revised" is an existing ID (A, B, C, PRD, LEGAL, DATA, K) marked "Rev" in its ID or priority cell. "Kept" is an existing ID restated without change. "Removed" is a row whose requirement reads "Removed" or "Superseded". An ID cited by several specs counts once in each, so the totals count citations, not unique IDs. Other sessions were editing specs on 13 Oct; re-run before quoting a number.

| Spec | Added | Revised | Kept | Removed | Total |
|---|---|---|---|---|---|
| F01 | 9 | 3 | 3 | 0 | 15 |
| F02 | 16 | 5 | 16 | 0 | 37 |
| F03 | 9 | 5 | 7 | 0 | 21 |
| F04 | 29 | 1 | 12 | 0 | 42 |
| F05 | 41 | 2 | 4 | 0 | 47 |
| F06 | 41 | 4 | 0 | 0 | 45 |
| F07 | 21 | 2 | 0 | 0 | 23 |
| F08 | 26 | 3 | 5 | 0 | 34 |
| F09 | 19 | 1 | 11 | 0 | 31 |
| F10 | 16 | 1 | 1 | 4 | 22 |
| F11 | 24 | 9 | 11 | 0 | 44 |
| F12 | 9 | 3 | 8 | 1 | 21 |
| F13 | 19 | 6 | 12 | 0 | 37 |
| F14 | 35 | 20 | 4 | 0 | 59 |
| F15 | 15 | 2 | 8 | 0 | 25 |
| F16 | 24 | 3 | 11 | 0 | 38 |
| F17 | 24 | 10 | 33 | 0 | 67 |
| F18 | 26 | 1 | 15 | 0 | 42 |
| F19 | 24 | 0 | 0 | 0 | 24 |
| F20 | 19 | 2 | 3 | 0 | 24 |
| F21 | 29 | 1 | 1 | 0 | 31 |
| **Total** | **475** | **84** | **165** | **5** | **729** |

Notes on the removed column: all five are V2-internal. F10 removes F10-REQ-002, F10-REQ-004 and F10-REQ-015 and marks D-037 superseded for Read together; F12 removes F12-REQ-001. Each went on 13 Oct when M2 made Read together and extra books free. PRD-REQ-015 and PRD-REQ-020 are revised, not removed.

## 3. PRD 1.3 IDs no v1.0 spec cites

V2 deletes no 1.3 ID (`_AUTHORING.md` section 1). These 20 requirement IDs from the 1.3 index and appendices are not cited in any v1.0 spec (F01 to F21) on 13 Oct, checked by script:

| IDs | What | Where they stand |
|---|---|---|
| A-REQ-004, A-REQ-006 to A-REQ-010, A-NFR-003 | Story intro (gestures, timing, screen readers, Reduce Motion, silent intro, show once, animation budget) | v1.1 (D-043); F40 in `features/F30-later.md` cites A-NFR-003 |
| B-REQ-008, B-REQ-022, PRD-REQ-007, B-NFR-005 | Web contribution page, Hindi web page, web contributor identity, browser audio encryption | v1.1 (B1, K-35); F37 |
| C-REQ-033 | Web gift code and printed books outside in-app purchase | Later (F42, F43); M5 sets Apple offer codes instead |
| C-REQ-031 | Dormant-payer email (P1) | Not restated; binds through 1.3 if built. With M14 the server can send it; the founder decides whether it is v1.0 [R] |
| PRD-REQ-006 | Drop `safety_events` | Done: `supabase/migrations/20261002020000_data_governance.sql` dropped it (F20 section 1) |
| PRD-REQ-008 | Claims pass in `packages/content` | Done 2 Oct (1.3 section 8); the claims registry carries it (LEGAL-REQ-044) |
| A-NFR-009, B-NFR-006, B-NFR-010 | Provider hygiene and Apple key rotation; AX5, screen readers and web WCAG 2.2 AA; counsel review of children's data | Still bind through 1.3 (source order item 6). `06-nfr.md` sections 8 and 12 hold the shared accessibility and security budgets; a spec citation is owed [R] |
| C-REQ-022, PRD-REQ-023 | Plus sheet content; publisher identity from `packages/brand` | Cited in `07-quality-bar.md` (launch checklist), not in a feature spec |

Conflict-log entries K-06, K-20, K-21, K-27, K-30, K-31, K-33, K-34, K-36 and K-40 to K-43 are also uncited by the feature specs; they record how 1.3 settled conflicts and are history, not requirements.

## 4. Sources

- `docs/prd/PRD.md` 1.3 sections 1, 2, 3, 6, 7; `docs/prd/A-entry-and-auth.md`, `B-first-run-and-family.md`, `C-habits-pricing-settings.md`; PRD 1.4 header on `origin/main`.
- `_AUTHORING.md` sections 1, 3, 3b; `03-goals-and-principles.md`; `05-feature-map.md`; `06-nfr.md` section 1; `07-quality-bar.md` section 6; `09-decisions-and-risks.md`; `08-delivery.md` section 2.
- `docs/DECISIONS.md` on `develop`: D-034, D-043, D-053, D-068, D-069, D-070, D-073, D-074, D-080 to D-087.
- Section 7 of `features/F01-entry.md` to `features/F21-store-web.md`; `features/F30-later.md`.
