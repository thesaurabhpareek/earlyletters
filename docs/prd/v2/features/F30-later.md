# F30 Later releases: F31 to F49

| | |
|---|---|
| Release | v1.1 (F31 to F40) and later (F41 to F49) |
| Priority and rank | Ranked 1 to 19 in `05-feature-map.md` section 3; that order is the recommended v1.1 build order |
| Personas | P1 to P6 as named per feature |
| Existing IDs | PRD-REQ-021, B-REQ-008, B-REQ-013, B-REQ-017 to B-REQ-024, C-REQ-013, C-REQ-014, C-REQ-030 to C-REQ-032, A-REQ-003 to A-REQ-011, A-REQ-020, LEGAL-REQ-004, LEGAL-REQ-005, LEGAL-REQ-010, LEGAL-REQ-013, LEGAL-REQ-020, LEGAL-REQ-022, LEGAL-REQ-023, LEGAL-REQ-030, LEGAL-REQ-035, LEGAL-REQ-056, LEGAL-REQ-059, LEGAL-REQ-060, D-032, D-034, D-043, DR-07, DR-08, DR-14, DR-15 |
| Depends on | The v1.0 features F01 to F21 |
| Status | Draft V2, 3 Oct 2026; F31 revised 13 Oct 2026 for D-073 (audio backup of the owner's recordings moved to v1.0 in F08; family listening stays here); revised again 13 Oct for M1, M2 and M14; revised 14 Oct after critique round 1 (M16 wording, the Haitian fact, candidates raised by the reviews; disposition in `reviews/DISPOSITION-C.md`). Light specs. Each item gets a full spec from the `_AUTHORING.md` section 5 template before its build starts |

## 0. How to read this file

Each item has: why (with evidence), what, dependencies, open questions, a rough size, and **what v1.0 must do now** so the later build adds code instead of rewriting it. The v1.0 hooks are the part agents act on today: each one points at a v1.0 requirement or work package that already carries it, or is marked [R] as a new ask for the named v1.0 owner.

Sizes are in engineer-weeks of agent work plus review, [A] unless a source is given. They exclude counsel time, App Review time and native-speaker review.

F31 (shared voice) and F32 (close family contributors) are the first v1.1 items and get more depth. They share one theme: in v1.0 each author's voice plays only on that author's own devices, even with the owner's encrypted backup on (D-073, DR-07). v1.1 opens it to the family and their voices.

| Rank | ID | Feature | Release | Size [A] | Biggest v1.0 hook |
|---|---|---|---|---|---|
| 1 | F31 | Shared voice: family members hear each other's recordings | v1.1 | 2 to 3 on top of F08 backup | F08 backup with a versioned key-wrap format; capture-time audio hash |
| 2 | F32 | Close family contributors in the app | v1.1 | 3 to 4 | Contributor rules stay in the database with tests green; `book_access` carries role and pending visibility |
| 3 | F33 | Hindi and Arabic catch-up; Hindi-English mode | v1.1 | 3 to 6 | Waiting letters keep audio; transcript versions contract; gate tooling per language |
| 4 | F34 | Read together word highlighting | v1.1 | 2 | Word timings stored with offsets into raw |
| 5 | F35 | Server transcription fallback with consent | v1.1 | 3 | `ai-processing` consent type exists; every result records its engine |
| 6 | F36 | Android | v1.1 | 8 to 10 | No iOS-only logic outside `platform/`; plan module behind an interface |
| 7 | F37 | Web contribution page | v1.1 | 5 to 6 | Shared pure-TS packages; invite tokens in fragments |
| 8 | F38 | Author's own second-language version | v1.1 candidate | 2 | One language per letter, stored per letter |
| 9 | F39 | Safety classifier, clinician-gated | v1.1 | 1 to 2 plus clinician | Tiers stay on the device; code behind an off flag |
| 10 | F40 | Story intro | v1.1 | 1 to 2 | `intro_variant` switch; welcome screen is variant one |
| 11 | F41 | Sealed letters | later | 2 | One visibility path for book, Read together, export |
| 12 | F42 | Printed books with QR to audio | later | 6 or more | One book template for PDF and print |
| 13 | F43 | Lifetime and gifts | later | 2 to 4 | Plan view not hardwired to subscriptions |
| 14 | F44 | App interface localisation | later | 3 to 4 per language | Strings, dates and plurals ready now |
| 15 | F45 | Next spoken languages | later | 2 to 3 per language | Language-agnostic packs and gates |
| 16 | F46 | Themes, author and child photos | later | 3 | `theme_extra` gate; photo path rule; export keeps `photos/` |
| 17 | F47 | On this day, Year One | later | 2 | One visibility path; no counts |
| 18 | F48 | Vault mode and end-to-end keys | later | 6 or more | F08 backup ciphertext and key-wrap format versioned |
| 19 | F49 | Apple-hosted asset packs | later | 2 | Asset manager behind an interface |

## F31 Shared voice: family members hear each other's recordings

| | |
|---|---|
| Release | v1.1, rank 1 |
| Personas | P1, P2, P6 |
| Existing IDs | PRD-REQ-021 (moved here by B7), D-032 (superseded), D-059, D-073, DR-07, C-NFR-008, LEGAL-REQ-022, LEGAL-REQ-023, LEGAL-REQ-040, DATA-REQ-047 |
| Depends on | F08 (the owner's encrypted backup, v1.0), F11, F14, F16, F17; counsel on LEGAL-REQ-022(a) |

Audio backup has moved out of this item. D-073 (founder, 3 Oct 2026 evening) puts the encrypted backup of the owner's own recordings in v1.0, specified in F08 section 6.5, and keeps family members hearing each other's recordings in v1.1, which is what F31 now covers. M14 (founder, 13 Oct 2026) turns server features on for v1.0, which answers F08 section 13 Q1: backup stays in v1.0. The code and the content lane still treat backup as later and must follow (`reviews/STALE-OUTSIDE-PRD.md`).

### Why
- [D] Family listening is v1.1 (D-073, D-059). In v1.0 a co-parent can read but not hear the other parent's letters, and Read together plays only voices recorded on that phone (DR-07).
- [S] Voice is what reviewers of voice products love: 11 of 64 Remento reviews name hearing the person's voice as the point (R2 section 0 item 5).
- [A] Two voices raise retention; `read_together_page_without_audio{reason: other_parent}` (F10 section 10) measures how often DR-07 bites and is the input to this item's priority.

### What
1. **Reuse the v1.0 backup.** The owner's recordings are already ciphertext in the `entry-audio` bucket with per-file keys wrapped by the content key F08 specifies (F08 section 6.5, ADR 0006; R2 AR-05 proposes one key per child and author, which the backup ADR decides). Shared voice adds member access, not a second upload path.
2. **Member key grants.** Each member has an account key pair (TDD 04 D-1: per account, not per device); the CCK is wrapped to each approved member's public key in `child_key_grants` (ADR 0006 item 3). Removing a member rotates the CCK for new files; older files stay readable by those who had them, and the app says so (ADR 0006).
3. **Member playback.** A member's phone downloads the ciphertext and unwraps the file key with its own grant; nothing plaintext passes through our server. It verifies the capture SHA-256 and caches the plaintext in a backed-up directory beside its own recordings.
4. **Who pays.** Open (Q1). Playing a recording is never gated, with or without Plus (M1, F08-REQ-008), and backed-up audio of a lapsed user is never deleted (C-NFR-008).
5. **Only the original travels** [R]. A listening copy is made on the receiving phone from the original (F08-REQ-003).
6. **Copy that matches the build.** `book.recordingElsewhere` (F11-REQ-015) and the Read together line (F10-REQ-018) change to say the voice is on its way or ready; the claims registry changes with counsel. Until then, no v1.0 string promises family listening (D-073, F08-REQ-026).

### Dependencies
F08 backup (bucket, `audio_blobs`, `child_keys`, escrow, purge); F11 membership and removal; F14 plan engine; F17 deletion and purge; F19 kill switch (LEGAL-REQ-040); counsel on LEGAL-REQ-022(a) and the Privacy Policy and Terms 12.1 wording.

### Budgets parked from PRD 1.3 and TDD 06 (return with this feature)
| Item | Budget | Source |
|---|---|---|
| Backed-up playback first audio on LTE for a member (download start, first chunk decrypted) | p95 2 s | TDD 06 section 2.2 [R] |
| Mass download | Any account over 500 Storage downloads an hour alerts | TDD 06 section 5.6 |

Upload start, backup confirmation and the escrow unwrap alarm moved to v1.0 with F08 (06-nfr.md section 17).

### Cost
[F] At ARCHITECTURE's 100k-family volume (11.4 TB of audio), Supabase Storage is $240.69 a month and Cloudflare R2 $170.85 (R3 section 6.2). Storage is paid by F08's backup; shared voice adds member download egress, about $81 a month at 100k (TDD 06 section 4.2). A second-provider ciphertext copy is needed before backup reaches many families because Supabase Storage has no backup of its own (TDD 06 section 6.1); that question now sits with F08.

### Open questions
| Q | Who, by when | What changes |
|---|---|---|
| Q1 Is family listening free for every member of a shared book, or Plus? | Founder, v1.1 planning | Plan gates, copy, retention signal |
| Q2 What can the privacy copy say about member grants (LEGAL-REQ-022(a))? | Counsel, before build | Claims, Privacy Policy, Terms 12.1 |
| Q3 Revocation: rotate the CCK at every removal, or only on request? | Founder, security | Key rotation cost |

### Size
[A] 2 to 3 engineer-weeks on top of the F08 backup: member key pairs, grants, rotation, member download, copy.

### What v1.0 must do now
1. Hash every original at capture and keep the hash with the entry (DATA-REQ-046). Built (`capture/recorder.ts`).
2. Keep originals byte-identical and never write to them (F08-REQ-002).
3. Sync `entries.audio_kept_on_device` to members (exists; F08 section 8) so the receiving phone knows a voice exists.
4. Keep `download_backed_up_audio` and `restore_backup` in `FREE_FOREVER` in `packages/core/src/plan.ts` (exists).
5. Version the backup ciphertext and key-wrap format from the first upload (F08 WP-F08-B2) [R], so member grants and Vault mode (F48) can rewrap later.
6. Give F08's backup tables room for grants: `child_key_grants` keyed by member and key version, empty in v1.0 (F08-REQ-022).
7. Use one `LetterAudio` source resolver in F08 and F10 (local file, or "elsewhere") [R], so a third state (downloadable) is one branch, not a rewrite.

## F32 Close family contributors in the app

| | |
|---|---|
| Release | v1.1, rank 2 |
| Personas | P5 (close family), P1, P2 |
| Existing IDs | B-REQ-007 Rev, B-REQ-009 Rev, B-REQ-010 Rev, B-REQ-011, C-REQ-007, D-002, D-039, D-050, K-35, LEGAL-REQ-035, LEGAL-REQ-045, LEGAL-REQ-056 |
| Depends on | F11, F16, F17; F31 for voices; F37 for family without the app |

### Why
- [S] Grandparents seeing the baby is the second most common praise for photo-album apps after privacy: 30 positive reviews across 10 products credit sharing with distant family (R2 section 0 item 7).
- [F] About 65 million US grandparents; 76% say digital tools are a primary way to stay in touch; they spend $2,654 a year on grandchildren (R3 section 0).
- [F] From, Mama already lets partners and grandparents add their own letters ("Village") (R1-S20). Qeepsake gates family contributors behind Premium (R1-S40); we ruled out paywalling family authorship (04 section 4; R1 F11 "Avoid").
- [A] Parents arriving from Tinybeans or 23snaps may expect grandparents on day one; v1.0 is co-parent only (09 R-05; validate in Study 3).
- [S] Collaborators in Remento sometimes struggle more than the main user (R1-S15), so the contributor path must be short and forgiving.

### What
1. **Invite a family member** from the Family tab with role `contributor`, one child per invite (PRD-REQ-014). The server already accepts `contributor` invites when `contributors_enabled` is true (F11-REQ-003).
2. **The contributor installs the free app**, passes the 18+ gate, signs in, accepts Terms with age and the sensitive-data consent, then writes or speaks letters to that one child (F11-REQ-006 order).
3. **Approval.** A contributor's letter is pending for both parents and goes in the book when a parent approves it; parents can set approval to automatically per contributor (`family.approval.*` keys exist in `packages/content/src/strings.en.ts`). Parents' own letters never need approval (F11-REQ-010).
4. **What a contributor sees.** Only their own letters by default; the book only if the parents turn on "Family can read" (`children.family_can_read`, exists). The child's name, nickname and birthday month and day; never the due date or birth year (D-039). Never raw transcripts, edits or another author's working material (PRD-REQ-004).
5. **Notifications.** A separate "Letters from family" channel, muted independently of Reminders (C-REQ-007).
6. **Leave and remove.** A contributor can leave, keeping or taking out their letters; a parent can remove a contributor (B-REQ-010). Nobody deletes another person's words (DATA-REQ-015).
7. **Free.** Contributors never see the Plus sheet (PRD-REQ-022): family authors add letters under the book's membership without their own (M4, D-051 (main); `family_authors` in `FREE_FOREVER` in `packages/core/src/plan.ts`). Whether their kept letters count toward an account's 2 free letters is the open edge DR-16; F32 needs that answer before build.

### Dependencies
F11 invite and redeem path; F16 pull with `sees_pending`; F17 report a concern and removal (LEGAL-REQ-056); F31 if contributors' voices should play for parents; F37 for family who will not install the app; counsel on D-050 (second consent at first share) and LEGAL-REQ-035 (contributor rights without an account, relevant once F37 ships).

### Open questions
| Q | Who, by when | What changes |
|---|---|---|
| Q1 D-050: does Washington need a second consent the first time someone shares into a family book? | Counsel, before build | One extra sheet (built and compiled off at v1.0, F11-REQ-018) |
| Q2 Default approval: pending, or automatically for invited contributors? | Founder, from C1 interviews | Copy and the default value |
| Q3 Overseas grandparents: the app is on the US App Store only (LEGAL-REQ-058). Is that acceptable until F37? | Founder | Order of F32 versus F37 |
| Q4 Can a contributor hear the parents' recordings, or only read? | Founder, with F31 Q1 | F31 playback policy |
| Q5 Cap on contributors per book | Founder | Invite limits (B-NFR-004 is 20 invites per parent per day) |

### Size
[A] 3 to 4 engineer-weeks, most of it app UI: the database already holds the contributor role, approval column, `review_family_letter` RPC and visibility setting, with tests.

### What v1.0 must do now
1. Keep the contributor role (`child_members.role in ('parent', 'contributor')`), `entries.approval` (default `not_needed`), `review_family_letter` and `children.family_can_read` in the schema, and keep their access tests green while the app hides the path (B1; B-REQ-009 Rev; F11-REQ-003).
2. Build `book_access(child_id, profile_id, role, sees_book, sees_pending)` with both visibility columns from day one (F16-REQ-006), so the pull serves pending letters to parents without a schema change.
3. Keep `contributors_enabled` (default false) as a server-checked flag (F11-REQ-003); D-068 removed D-035's config table, so [R] the flag becomes a server setting read by the invite functions, the way `app.max_parents_per_book` is. F32 flips it.
4. Keep the parent and contributor visibility matrix in the leak suite, including dormant contributor fixtures (F11 WP-F11-10; 07-quality-bar.md section 2.4).
5. Build the co-parent notification channel as one of N named channels, not a boolean [R] (WP-F11-09 owner).
6. Keep the invite RPC's explicit role argument (`create_child_invite(p_child, p_role, ...)`, exists) and its parents-only creation rule (B-REQ-007).
7. Write the F11 audience line ("Who will see this") from `book_access`, not from "two parents" [R], so adding contributors changes data, not the screen (F11-REQ-020 owner).

## F33 Hindi and Arabic catch-up; Hindi-English code-switching

- **Why.** [D] B4 sets Hindi and Arabic as v1.0 languages with strong, language-specific transcription, and Hindi-English mode as v1.1. [F] Base turbo scores 29.64 WER on FLEURS Hindi; open fine-tunes reach 11 to 13, but full large-v3 runs at 1.42 times real time on an A15, about 85 s for a 2-minute letter (R5 section 0 item 2). [F] Arabic dialect WER is about 30% to 60% with today's open models (R5 section 0 item 3). [F] On Hinglish, base large-v3 scores 29.74% WER on CoSHE-500 and an Apache-2.0 fine-tune 13.67%, with English getting worse (6.93% against 4.81%) (ADR 0012). Under DR-01 A, whichever of Hindi and Arabic miss their v1.0 gate ship as Record and type.
- **What.** Re-run the F05 gate for Hindi and Arabic with newer or larger models as they appear, including on 6 GB phones as a separate tier (DR-01 option C), and the iOS 26 system transcriber where it covers a language (R5 section 0 item 5). A Hindi-English mode per author: one model call with a code-switching model, Devanagari for Hindi words and Latin for English, never transliterated (D-031). When a language passes, offer waiting voice-only letters a transcript as a version; typed words are never replaced (F05-REQ-012, F05-REQ-036).
- **Dependencies.** F05 gate tooling; F06 R-01 fixes for Devanagari and Arabic; F35 if a server model is the route; native reviewers per pack (09 R-08).
- **Open questions.** Which Hindi script default (D-031, 30 Oct); whether a relaxed Hindi speed bar is acceptable (F05 section 7.1); whether Arabic needs per-dialect packs; whether code-switching mode is per author or per letter.
- **Size.** [A] 3 to 6 engineer-weeks, mostly experiments and native review.
- **What v1.0 must do now.** Save every voice-only letter with its original audio and `transcript_status = 'waiting'` (F05-REQ-010, F05-REQ-011). Ship the transcript versions contract (F05-REQ-035) and record model, pack and engine on every result (F05-REQ-033). Keep the gate per language and per device tier (F05 section 7.3). Keep one language per letter at v1.0 (F05-REQ-031) but store `entries.language` per letter, never per author (F04 section 8), so a mixed mode is a new value, not a migration.

## F34 Read together word highlighting

- **Why.** [D] Deferred by B7. PRD-REQ-020 originally defined a session by word-highlight playback (DR-06). [F] whisper.cpp word timestamps are marked experimental and community reports of DTW timing drift exist (ADR 0009).
- **What.** Highlight each word of `final_text` as the recording plays, with timings projected from raw through the stored edits; fall back to sentence-level highlighting when alignment quality is low (ADR 0009 items 2 and 3). Honour Reduce Motion with a static underline [R].
- **Dependencies.** F05 word timings; F06 edit offsets against raw; F10; F31 for other authors' voices.
- **Open questions.** None on sessions: DR-06 is answered (M2), Read together has no session limit, so highlighting changes no count. Is sentence-level enough for Hindi and Chinese, where word boundaries differ?
- **Size.** [A] 2 engineer-weeks.
- **What v1.0 must do now.** Store word timings with exact offsets into raw for every spoken entry (F05-REQ-034, BL-145). Store every edit with offsets against raw (F06-REQ-023). Keep the F10 text view one component that already receives the playing entry's position [R] (F10 owner).

## F35 Server transcription fallback with consent

- **Why.** Languages and devices that fail on the phone still deserve text (R5 K10). [F] ADR 0002 picks Groq whisper-large-v3-turbo with zero data retention, then DeepInfra, behind an Edge Function that holds keys. [D] B9: letters are never used to train models, so providers must be zero-retention with no training (LEGAL-REQ-020).
- **What.** An opt-in, per-feature consent (LEGAL-REQ-004) to send a recording for transcription when on-device is unavailable or the language has not passed. Results stored as a transcript version with the engine recorded; the raw transcript is set once and never overwritten. A daily spend breaker and the `ai_gateway_enabled` kill switch (TDD 06 section 4.3).
- **Dependencies.** F05 queue and versions; F17 consent rows; F19 kill switch; counsel on the consent text and the subprocessor list.
- **Budgets parked.** Gateway p95 4 s, p99 10 s for 2 minutes of audio (PRD 1.3 7.2, not a gate). Cost about $160 to $530 a month at 100k families (ADR 0002).
- **Open questions.** Does each language need its own server model (for example a Hindi fine-tune)? How does the privacy copy separate a recording sent for transcription from the v1.0 encrypted backup (D-073, M14), which we can open only with the recovery key we hold under strict, logged access (M16)?
- **Size.** [A] 3 engineer-weeks.
- **What v1.0 must do now.** Keep the `ai-processing` consent type seeded in the policy documents (exists in `20261002020000_data_governance.sql`). Keep the transcription queue's target kinds and the per-result engine record generic, not whisper-specific [R] (WP-F05-07 owner). No v1.0 code calls any AI endpoint (03 section 5).

## F36 Android

- **Why.** [D] Deferred by B7. [F] Android is 46.39% of US mobile web traffic (R3 section 1.3, page views, not parents). [F] One Expo codebase (CLAUDE.md: "iOS first, Android later").
- **What.** The full v1.0 feature set on Android with Google Play billing, the Play deletion page as a full web flow (LEGAL-REQ-030, D-042), Apple sign-in on Android and Google Credential Manager (A-REQ-020), TalkBack parity, Keystore-backed tokens (A-NFR-008), inexact alarms for reminders (C-NFR-001), Android budgets (cold start p50 2.0 s, p90 3.0 s on a mid-tier 60 Hz phone, A-NFR-001).
- **Dependencies.** Every v1.0 feature; a cross-platform Plus answer (Apple Family Sharing does not cover an Android co-parent, DR-03); a speech runtime and model tier for Android memory classes.
- **Open questions.** How a family with one iPhone and one Android phone shares Plus without a server (B2); whether Android needs its own download size budget; the entity question (ROADMAP lists Android as a trigger to form one).
- **Size.** [A] 8 to 10 engineer-weeks.
- **What v1.0 must do now.** Keep platform code in `platform/` and `lib/` behind interfaces (TDD 09 section 8.3 lint bans `expo-haptics` and `@expo/ui` elsewhere). Keep plan logic in `packages/core/src/plan.ts` with StoreKit only in the device plan module (F14-REQ-013). Keep BL-288 (Android CI build, not shipped) running as a parity watch. Never name another platform in iOS strings (App Review 2.3.10).

## F37 Web contribution page

- **Why.** [D] Deferred by B1. [F] Remento lets the storyteller record through a texted or emailed link with no app or login (R1-S53). [F] TDD 10 calls the page a second product: anonymous auth, browser recording and encryption, a Hindi page, WCAG on the web (TDD 10 risk 10).
- **What.** A page on `earlyletters.com` where a family member with an invite link writes or records a letter to one child without installing the app; the letter reaches the parents' pending list (B-REQ-008, B-REQ-022). Notice at collection (LEGAL-REQ-010); the contributor's own consent before anything reaches AI (LEGAL-REQ-005).
- **Dependencies.** F32 (contributor role and approvals live), F31 (browser-side encryption for web audio), `apps/web` in the monorepo (ADR 0010), anonymous-auth predicates in RLS (TDD 04 S-2).
- **Budgets parked.** LCP 2.5 s on 4G and 300 KB or less (B-NFR-008); web letter to pending p95 60 s (PRD 1.3 7.3); axe zero critical (LEGAL-REQ-051).
- **Open questions.** Worldwide reach versus a geo-block (PRD 1.3 section 9 Q6); return links for later letters; Hindi page timing.
- **Size.** [A] 5 to 6 engineer-weeks.
- **What v1.0 must do now.** Keep pure logic in shared packages with no React Native imports (`packages/core`, `packages/content`; ADR 0010). Keep invite tokens only in URL fragments and only hashes stored (B-NFR-002). Keep the `/j` page free of analytics and third-party scripts (F11-REQ-005); F37 grows from it.

## F38 Author's own second-language version of a letter

- **Why.** [F] Among US Latino parents, 92% with a Latino partner speak Spanish to their children against 55% with a non-Latino partner (2015 survey, R2-S31). [A] A co-parent often cannot read the other parent's letters (DR-15; R2 marks it Inferred; study 3 in R3 tests it). The constitution forbids machine translation (03 principle 1).
- **What.** An author adds their own second version of a letter in another language, written or spoken by them, linked to the first. Readers choose which version to read; both are kept and exported. Nothing is generated.
- **Dependencies.** F05, F06, F09, F15.
- **Open questions.** Does a second version count as a separate letter for milestones? Can it be spoken and transcribed in the second language? Does it need its own recording?
- **Size.** [A] 2 engineer-weeks.
- **What v1.0 must do now.** Store language per letter (F04 section 8). Keep the export format versioned (F15 format 1.1.0, WP-F15-02) so a `versions` array can be added without breaking readers [R].

## F39 Safety classifier, clinician-gated

- **Why.** [D] D-034 and B7: v1.0 ships a static "If you are struggling" row instead. [F] `packages/core/src/safety.ts` is marked pending perinatal clinician review and must not ship outside the founding family (TDD 10 risk 11). False negatives look negligent; false positives feel surveillant (TDD 10 risk 12).
- **What.** The on-device tier classifier shows a calm resources card, only after a perinatal clinician's written sign-off on the phrases, tiers and copy. Tiers never leave the phone (LEGAL-REQ-015). No health-feature drift (LEGAL-REQ-060).
- **Dependencies.** F20 resources; F18 (no tier ever in an event); counsel on the Consumer Health Data notice.
- **Open questions.** Who the clinician is and their availability; whether any tier triggers outside the review screen.
- **Size.** [A] 1 to 2 engineer-weeks plus clinician time.
- **What v1.0 must do now.** Keep the classifier code behind `safety_card_enabled` (off) and the `safety_events` table dropped (D-034; `20261002020000_data_governance.sql`). Keep the "no tier in any request" proxy test (LEGAL-REQ-015).

## F40 Story intro

- **Why.** [D] D-043 moved the 4-story intro (A-REQ-003 to A-REQ-011) to v1.1. [F] Deck-of-cards tutorials gave no significant gain in task success (91% against 94%) and made apps seem harder (UR S10, cited in F01 section 1).
- **What.** The 4 stories behind the `intro_variant` remote switch (BL-303), tested against the single welcome screen.
- **Dependencies.** F01, F19, F18 for the comparison.
- **Open questions.** Is a comparison worth running at our cohort sizes (03 section 4.4)?
- **Size.** [A] 1 to 2 engineer-weeks.
- **What v1.0 must do now.** Treat the v1.0 welcome as variant one of `intro_variant` [R] (F01 owner); keep intro assets inside the image budget (A-NFR-003).

## F41 Sealed letters

- **Why.** [S] Parents describe sealed birthday letters to open at 18 or 25 (UR S30, R21). [F] Dearest has sealed future letters (CR S10) and Tiny Treasures sealed messages (R1-S67).
- **What.** An author locks a letter until a chosen age or date and can unseal early (B-REQ-018). Sealed letters are excluded from On this day (C-REQ-014) and shown as sealed, without text, in the book and the PDF.
- **Dependencies.** F09, F10, F15, F47.
- **Open questions.** Who can unseal when the author is gone? What does export contain for a sealed letter by someone else?
- **Size.** [A] 2 engineer-weeks.
- **What v1.0 must do now.** Route the book, Read together, export and the PDF through one visibility function [R] (F09 `book_entries` and its local twin), so a "sealed until" filter is added in one place.

## F42 Printed books (Year One) with QR to audio

- **Why.** [F] Print is the category's profit engine: Qeepsake includes book credits, Remento bundles a book, Storyworth sells extra copies (CR section 3). [F] Remento's printed stories carry a QR code that plays the original voice (R1-S13). [S] Print complaints are blank pages and checkout fees (CR section 3; R2 section 0 item 6). [D] v1.0 is digital only and no copy promises print (K-32).
- **What.** A Year One hardcover from the same book template, QR codes linking to recordings, paid by card outside in-app purchase (App Review 3.1.3(e), ADR 0007), printed through a print API.
- **Dependencies.** F15 template; F31 (QR needs a hosted voice); a web checkout; a new processor.
- **Open questions.** Who fulfils; how QR links stay private; price.
- **Size.** [A] 6 or more engineer-weeks.
- **What v1.0 must do now.** Keep one book template for the PDF (F15 WP-F15-03) with page size as a parameter [R]; keep "no blank pages" as a PDF test (F15-REQ-004). No product string mentions print (K-32 content test).

## F43 Lifetime and gifts

- **Why.** [S] UR recommends lifetime at $79 or more and gifts from family (UR R18, R19). [F] Tiny Treasures sells $99 lifetime (R1-S67). [F] Grandparents spend $2,654 a year on grandchildren (R3 section 0). [F] Apple allows gifting of in-app purchase items, with refunds only to the purchaser (UR section 4.3, citing App Review 3.1.1).
- **What.** A lifetime non-consumable (C-REQ-032) and a gift of a year of Plus for a child's book (C-REQ-030).
- **Dependencies.** F14; a server grant for gifts, which collides with B2 (no server sees purchases) (F14 section 4).
- **Open questions.** Gifts without a server: Apple's own gifting only, or reopen B2? Lifetime price.
- **Size.** [A] 2 engineer-weeks for lifetime; 2 more for gifts if B2 allows.
- **What v1.0 must do now.** Build `planView()` from the verified Plus transaction with a product kind, not a subscription-only shape [R] (F14-REQ-003 owner). [A] Verify in Apple's docs that a non-consumable appears in `Transaction.currentEntitlements` before relying on it.

## F44 App interface localisation (Spanish first)

- **Why.** [F] 44.9 million US Spanish speakers at home, 41.1% of whom speak English less than very well (R3 section 2.1). [D] v1.0 UI is English but must be localisation-ready (B4).
- **What.** A locale layer (`copy = strings[locale]`), `expo-localization`, a pseudo-locale run, native review of every string under a Spanish VOICE rules test, store listing in Spanish (TDD 09 section 7.2 "later").
- **Dependencies.** F21 listing; counsel on translated legal documents.
- **Open questions.** Which locale second; whether legal pages are translated or summarised.
- **Size.** [A] 3 to 4 engineer-weeks per language including review.
- **What v1.0 must do now.** The v1.0 readiness items in 06-nfr.md section 9: every string in `packages/content` or `copy.ts`, no sentences assembled in code, `Intl` dates and plurals, no `.toUpperCase()` on copy, logical layout properties in new code.

## F45 Next spoken languages

- **Why.** [F] Tagalog (1.9M), Vietnamese (1.6M) and Korean (1.2M) each have more US speakers than Hindi (1.06M); Haitian (1.04M) and Russian (1.02M) are just smaller. Tagalog, Vietnamese, Korean and Haitian, the four largest not in the seven, total 5.7M (R3 section 2.2; corrected 14 Oct per `reviews/R6-fact-check.md` row 20). [F] ACS reports Chinese as one category; a Mandarin-only engine will not serve Cantonese speakers (R3 section 2.1). [F] Urdu is close to spoken Hindi but uses another script (R3 section 2.2).
- **What.** One pack and one gate per new language, shipped in waves as each passes (DR-01 pattern).
- **Dependencies.** F05, F06 (verifier coverage for each new script), F07 phonetics.
- **Open questions.** Which first; Urdu right-to-left Nastaliq rendering.
- **Size.** [A] 2 to 3 engineer-weeks per language plus native review.
- **What v1.0 must do now.** Keep packs pure data read by a generic engine (F05-REQ-017); keep the manifest and gate tooling keyed by language code, with no fixed list of seven in code [R] (WP-F05-03, WP-F05-05 owners).

## F46 Themes, author and child photos

- **Why.** B-REQ-019 (themes) and B-REQ-024 (photos) are P1. [D] Photos are optional and secondary (03 section 5).
- **What.** Extra book themes as a Plus feature; an optional author or child photo, location data stripped (LEGAL-REQ-013).
- **Dependencies.** F09, F14, F15.
- **Open questions.** Which themes; whether photos sync before F31's encrypted pipeline exists.
- **Size.** [A] 3 engineer-weeks.
- **What v1.0 must do now.** Keep `theme_extra` in `GatedFeature` (exists in `plan.ts`). Keep the `photos/` folder in the export format (F15 section 4). Keep the path-prefix rule for any photo object (DATA-REQ-047).

## F47 On this day, Year One celebration

- **Why.** C-REQ-013 and C-REQ-014 are P1. [S] A yearly printed book becomes a ritual for some families (CR S2).
- **What.** "One month ago" or "One year ago today" on Tonight, at most once a day, only from letters in the book and visible to the viewer; a Year One cover on the first birthday with no Plus offer that day.
- **Dependencies.** F09, F13, F41.
- **Open questions.** Which letters are eligible once sealed letters exist.
- **Size.** [A] 2 engineer-weeks.
- **What v1.0 must do now.** The one visibility function in F41. No counts or gaps in any card (C-REQ-015).

## F48 Vault mode and end-to-end keys

- **Why.** ADR 0006 designed per-child keys, member grants, iCloud Keychain sync and a Recovery Kit; the v1.0 owner backup (F08 section 6.5) uses the Standard mode of that design, with escrow. TDD 10 risk 9 says a solo founder cannot operate a no-escrow mode and any bug is permanent voice loss. 05 ranks it "only if asked for".
- **What.** An opt-in mode where only the family's devices hold keys; losing every device and the Recovery Kit makes backups unreadable, and the app says so.
- **Dependencies.** F08 backup (v1.0, D-073), F31.
- **Open questions.** Demand; Android key sync.
- **Size.** [A] 6 or more engineer-weeks.
- **What v1.0 must do now.** F08's backup versions its ciphertext and key-wrap format so a user-held key can rewrap later [R] (WP-F08-B2).

## F49 Apple-hosted asset packs (iOS 26 and later)

- **Why.** [F] Apple-hosted asset packs need iOS 26, a StoreKit downloader extension, and allow 200 packs and 200 GB per app; no Expo module was found (R4 section 6). [D] v1.0 uses a CDN path (DR-14, D-046).
- **What.** On iOS 26 and later, fetch packs and models through `AssetPackManager`; keep the CDN path for iOS 17 to 25.
- **Dependencies.** F05, F19; a config plugin for the extension target.
- **Open questions.** Whether Apple hosting is free with membership (Unverified, R4 section 6); whether Apple signs packs.
- **Size.** [A] 2 engineer-weeks.
- **What v1.0 must do now.** Keep the asset manager behind one interface with the source as a field in `speech_assets` [R] (WP-F05-04 owner). Keep our SHA-256 check for every source (F05-REQ-018).

## Candidates raised by critique round 1 (14 Oct 2026)

Not ranked in `05-feature-map.md` yet; each needs the founder to place it.

| Candidate | Why | v1.0 hook already in place |
|---|---|---|
| Corrected age for babies born early: a parent-entered "adjusted from {date}" line beside the dateline; chapters stay by birth date | Preterm parents ask for adjusted dates [S] R2 T28 (R2-S2, R2-S14); R3 DX-18 asks for a decision. Wording needs a clinician (BL-105) | v1.0 leaves reminders off when a birth date is 21 or more days early (F09 step 17); dates are stored as dates, so a display line adds no migration |
| A trusted person who can ask for the book if the only parent dies | Accounts exist at v1.0; fiduciary access is governed by state law (R4 PT-17) | v1.0 runbook S-9 (F20) and a Terms clause; export is the hand-over format (F15) |
| Shared voice first for books with two languages | A co-parent who does not read the letter's language can neither read nor hear it at v1.0 (R3 DX-10) | F31 above; F09 shows the language label and "Ask {signsAs} to read this one with you" |

## Open questions across this file

| Q | Who, by when | What changes |
|---|---|---|
| Q1 F31 Q1: who pays for shared voice | Founder, v1.1 planning | F31 scope, F14 copy |
| Q2 F32 versus F37 order if overseas grandparents matter | Founder, after C1 | v1.1 order |
| Q3 B2 and gifts (F43) | Founder | Whether a server sees any purchase |
| Q4 Android co-parent Plus without a server (F36) | Founder | B2, DR-03 |

## Sources

- Decisions: `docs/agents/BRIEF-2026-10-03.md` items 5, 6, 9; `_AUTHORING.md` section 3 (B1, B2, B4, B7, B9, B13); `docs/DECISIONS.md` D-031, D-032, D-033, D-034, D-039, D-042, D-043, D-046, D-050; `09-decisions-and-risks.md` DR-01, DR-03, DR-06, DR-07, DR-08, DR-14, DR-15, R-05, R-08, R-11; `05-feature-map.md` section 3; `03-goals-and-principles.md` sections 3, 5.
- Requirements: `docs/prd/PRD.md` 1.3 sections 7.2, 7.3, 7.8, 9; `docs/prd/A-entry-and-auth.md` A-NFR-001, A-NFR-003, A-NFR-008; `docs/prd/B-first-run-and-family.md` B-REQ-008, B-REQ-018 to B-REQ-024, B-NFR-002, B-NFR-008; `docs/prd/C-habits-pricing-settings.md` C-REQ-013, C-REQ-014, C-REQ-030 to C-REQ-032, C-NFR-001, C-NFR-008; `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ as cited).
- Feature specs: F01, F04, F05, F08, F09, F10, F11, F14, F15, F16 (requirement and WP IDs as cited).
- Technical: `docs/tdd/06-performance-reliability.md` sections 2.2, 4.1, 4.3, 5.6, 6.1; `docs/tdd/09-accessibility-design-system.md` sections 7, 8.3; `docs/tdd/10-red-team-critique.md` risks 9 to 12; ADR 0002, 0006, 0007, 0009, 0010, 0012; `docs/ROADMAP.md` M7; `docs/BACKLOG.md` BL-145, BL-288, BL-303.
- Research: `research/R1-competitors-by-feature.md` (R1-S13, R1-S15, R1-S20, R1-S40, R1-S53, R1-S67); `research/R2-customer-evidence.md` section 0 items 5 to 8, R2-S31; `research/R3-market.md` sections 0, 1.3, 2.1, 2.2, 6.2; `research/R4-platform-and-policy.md` sections 0, 6; `research/R5-speech-audio-languages.md` section 0, K10; `docs/research/USER_RESEARCH.md` R18, R19, R21, S30, section 4.3; `docs/research/COMPETITIVE_RESEARCH.md` section 3, S2, S10.
- Code: `packages/core/src/plan.ts` (`GatedFeature`, `FREE_FOREVER`); `packages/core/src/safety.ts`; `packages/content/src/strings.en.ts` (`family.*` keys); `supabase/migrations/20260930000000_scribe_core.sql` (roles); `20261002020000_data_governance.sql` (`family_can_read`, `ai-processing`, purge comment, `safety_events` dropped); `20261003000000_security_and_family.sql` (`create_child_invite`, `entries.approval`, `review_family_letter`).
