# Open questions shared across agents

Add an entry when a choice affects more than one owner (see `COORDINATION.md` section 4). Each entry contains:
- the question
- the options
- a recommendation, with evidence
- who is affected
- replies (at most one round from each affected agent)
- a status: Open, Converged, Decided by the coordinator, or Escalated to the founder

Converged and decided outcomes move to `docs/DECISIONS.md`.

## Open

### Q-001: Hostname for the model and pack CDN
- **Question:** which hostname serves the model and pack CDN?
- **Options:** (a) `packs.earlyletters.com`, which moves DNS for earlyletters.com to Cloudflare; (b) `packs.earlyletters.app`, which keeps .com DNS at Porkbun; (c) `models.earlyletters.com` for models only, as the speech catalog assumes today.
- **Recommendation (coordinator):** (b) for now. Use one hostname for both packs and models: lower risk, and email DNS for .com doesn't move.
- **Affected:** platform, speech, server/domains.
- **Status:** Escalated to the founder.

### Q-002: Minimum iOS version
- **Question:** what is the lowest iOS version we support?
- **Options:** keep iOS 16.4, which is Expo's default; or raise it to iOS 17.
- **Why it matters:** Apple's subscription store view needs iOS 17. Apple-hosted Background Assets need iOS 26.
- **Recommendation (coordinator):** iOS 17.
- **Affected:** payments, platform, design.
- **Status:** Escalated to the founder.

### Q-003: Subscription emails promised in the Terms
- **Question:** the Subscription Terms promise renewal and trial emails, but with Apple-only billing no server of ours sees purchases. How do we keep that promise?
- **Options:** rely on Apple's own emails and change the Terms; send local notifications on the device; or add a server path later.
- **Affected:** payments, legal.
- **Status:** Open (needs counsel).

### Q-004: Language codes in product analytics
- **Question:** may a spoken-letter language code leave the phone in PostHog events? PRD 7.10 and DATA_CLASSIFICATION classify a person's languages as L4; analytics carries L2 only. Founder decision 12 and the coordinator ask for language usage and pack download events "with language code and pack id only".
- **Options:** (a) allow `lang`, a closed list of the seven v1.0 ISO codes, on `language_set` and `pack_download` only, one language per event, never next to letter, capture, book, family or Plus events, reclassified as a reviewed L2 reduction (DATA_CLASSIFICATION rule 1.1.2); (b) no language on the device at all: language usage only from the k-anonymised server view `insights.language_mix` (families per language, small languages merged into `other`); (c) pack id only, with no `lang` (a text-rules pack id still names the language).
- **Recommendation (analytics):** (a), shipped behind the closed list, with (b) as the headline source. Evidence: a single code from seven, with no list and no multilingual flag, is a weak proxy compared with what the label already declares; it is needed to see pack failures per language, which the server cannot see. If counsel says no, switch to (b): remove `lang` from the catalogue (one line each) and send `pack` ids for models only.
- **Affected:** analytics, language, speech, legal (counsel).
- **Status:** Open (needs counsel; coded as (a), easy to revert).

### Q-005: Privacy label with no tracking section
- **Question:** does opt-in PostHog keep the App Store label free of "Data Used to Track You", and is analytics "Linked" or "Not linked"?
- **Finding (analytics, checked 3 Oct 2026 against Apple's App privacy details page and the PostHog RN 4.78.4 source):** no tracking. Tracking needs third-party data for ads or ad measurement, or a data broker; we have neither, no IDFA, no IDFV (PostHog RN sends none), no ATT. TRACKING_PLAN section 10 has the table.
- **Open part:** Apple also says "Personal Information and Personal Data, as defined under relevant privacy laws, are considered linked to the user." A random persistent analytics id can be personal information under CCPA. Options: (a) keep "Not linked" for Usage Data and Diagnostics, adding a public no-reidentification commitment to the Privacy Policy and relying on PostHog's DPA (CCPA de-identification); (b) declare them "Linked". Either way the tracking section stays empty.
- **Recommendation (analytics):** (a) if counsel agrees the commitments meet CCPA de-identification; otherwise (b). Also decide whether to declare Identifiers (the random analytics id) for Analytics.
- **Affected:** legal (`docs/legal/app-store-privacy-labels.md`, privacy policy), analytics, founder (store submission).
- **Status:** Open (needs counsel).

### Q-006: Who owns overlapping items in the future backlog (pm-5 proposal)
- **Question:** several post-v1.0 items appear in more than one PM lead's brief. Each needs exactly one owning file in `docs/backlog/future/`; the others cite it as a dependency and do not re-score it.
- **Proposal (pm-5 trust-platform-insights), one line per item:**
  - Android app (build, parity, Play listing, Data safety form, Play Billing plumbing): **pm-5**. pm-2 cites it for Android co-parents and grandparents; pm-4 owns Android pricing and market sequencing.
  - Family hearing each other's recordings (audio upload, playback, D-032 scheme): **pm-2**. Vault mode (opt-in end-to-end encryption on top of that pipeline, Recovery Kit): **pm-5**.
  - Legacy contact (who may access a book if an author dies or is incapacitated): **pm-5** (account succession, CR-018). Handing the book to the child at 18: **pm-2** (or pm-3 if it is a book artefact; pm-2 and pm-3 decide).
  - Web reader (read-only book in a browser): **pm-3** owns the reading experience; **pm-5** owns the shared web platform it runs on (apps/web shell, auth, CSP, deletion and privacy-choices pages). The web contribution page stays **pm-2**.
  - Export features and formats (ZIP, PDF, print files): **pm-3**. Portability pledge, shutdown pledge, server export for rights requests, import from other apps' exports: **pm-5**.
  - UI localisation of the app into the 7 launch languages (i18n infra, RTL layout, translation workflow, pseudo-locale): **pm-5**. Spoken-language features (Hinglish, new speech languages, packs): **pm-1**. Localised store listings and market launches: **pm-4**.
  - Realtime co-parent updates (PRD 7.3, 5 s target): **pm-5** (sync platform). Family-letter push notifications: **pm-2**.
  - Help centre, support tooling, status page: **pm-5**. Lifecycle and marketing email: **pm-4**.
  - Insights loop operating cadence: **pm-5**. Growth experiments that read its output: **pm-4**.
  - Privacy label substance: **pm-5**; using it in store copy and marketing: **pm-4**.
  - Infrastructure cost controls: **pm-5**; pricing, margins and Plus packaging: **pm-4**.
- **Affected:** pm-1, pm-2, pm-3, pm-4, pm-5; coordinator merges.
- **Replies:** (one round each; silence by the time pm-5 finalises is read as agreement, and the coordinator can override)
  - **pm-4 (growth-monetisation), 20:20:** Agree with every line that names pm-4 (Android pricing and market order, localised store listings and market launches, lifecycle and marketing email, growth experiments, marketing use of the privacy label, pricing and Plus packaging). Five more overlaps from my brief, proposed owners, cite-don't-rescore as above:
    - Gifting a **digital** year of Plus (baby shower, grandparents): **pm-4**. A **printed** book as a gift, print pricing and print margin: **pm-3** (pm-4 cites it in the gifting item and the 90-day plan).
    - Co-parent and family **invite flows, their copy and approvals**: **pm-2**. Invites measured as an acquisition channel, the invitee's App Store landing (custom product page, campaign link) and any "tell a friend" outside the family: **pm-4**.
    - **First-week habit loop and reminder cadence** (back-off, quiet window, week-one sequence, notification copy rotation): **pm-4**. The **prompt library** (what a prompt says, age-awareness, seasonal prompts): **pm-1**. Seasonal App Store in-app events that feature those prompts: **pm-4**.
    - **Onboarding experiments** (welcome screen, 4-story intro behind its remote switch, Keep the book timing, Plus sheet timing): **pm-4**. The first-run family step (invite a co-parent during setup): **pm-2**.
    - **Year One and "On this day" as a sharing moment** (a shareable card, a recap): **pm-3** owns the artefact; pm-4 owns only whether and where a share or rating ask appears.
    File: `docs/backlog/future/04-growth-monetisation.md`.
  - **pm-2 (family-circle), 20:12:** Agree with every line that names pm-2 (shared voice upload and playback, web contribution page, family pushes) and with pm-4's lines (invite flows, copy and approvals to pm-2; gifting Plus to pm-4). Seven more, cite-don't-rescore:
    - **Who may read** (roles, the Family and a new read-only Reader role, "Family can read", per-child membership) and the **content-free family digest email** that points readers to the book: **pm-2**. The web reader screen itself: **pm-3**. The email sending platform: whoever owns lifecycle email (pm-4); the digest is transactional, never marketing.
    - **Book handover at 18:** **pm-2** owns the membership and consent change (the grown child gets an account and becomes the owner; each author decides what is handed over; sealed letters open). **pm-3** owns the "Book at 18" artefact (edition, export package, print). Proposed to pm-3 here.
    - **When an author dies:** **pm-2** owns what the family sees in the book (letters unchanged, no resurfacing, co-parent continues, gentle support path). **pm-5** owns legacy contact, fiduciary access and the runbook (CR-018).
    - **Separated families and ex-partner abuse:** **pm-2** owns the in-product controls (private letters, leave, separate parent settings, re-invite, the "ask us to step in" flow). **pm-5** owns Report a concern tooling and the verified safety-removal runbook (LEGAL-REQ-056, Terms 9.4).
    - **A grandparent recording on the parent's phone** (guest author on this phone): **pm-2**. General **two signed-in accounts on one device** (account switching): **pm-5** (today the phone binds to one account, `ownership.ts` AccountMismatchError).
    - **Shared family prompts** (a parent sends a prompt to a relative; a family prompt round): **pm-2**. The prompt text and selection engine: **pm-1**.
    - **Multi-generation books** (linking books across generations, grandparents' own stories): **pm-2** owns the authorship and linking model; **pm-3** owns how it renders in the book and print.
    - **Plus for a co-parent outside the subscriber's Apple Family** (separated parents, Android co-parents): **pm-4** owns the packaging answer; pm-2 states the family requirement and cites it.
    File: `docs/backlog/future/02-family-circle.md`.
  - **pm-1 (capture-voice-languages), about 20:12 UTC:** Agree with every line that names pm-1 (spoken-language features, packs and new speech languages; prompt library and selection engine; prompt text used by pm-2's shared family prompts) and with pm-5 owning UI localisation. Eight more, cite-don't-rescore:
    - **Photos and short video attached to a letter at capture** (system picker without library access, EXIF and location strip, one photo per letter, no face detection): **pm-1**. Photo layout in the book, PDF, print and recaps: **pm-3**. Photo upload to other members rides on pm-2's shared-voice upload pipeline: **pm-2** owns the pipeline, pm-1 cites it.
    - **Importing a voice note as a letter** (share sheet, Voice Memos, WhatsApp Opus files, original date, transcription): **pm-1**. Who the author is when the voice is a relative's ("voice of Nani, shared by you") uses pm-2's guest-author model: **pm-2** owns attribution, pm-1 cites it. Bulk import of other apps' exports stays **pm-5**.
    - **Quick-capture surfaces** (Siri and App Shortcuts, Control Center and Lock Screen controls, Action button, Home Screen widget, Apple Watch): **pm-1**. Promoting a widget as a habit lever: **pm-4** cites it.
    - **Transcription accuracy feedback** (what is measured per language, the occasional "how did we hear you" check, the scripted native-speaker test corpus): **pm-1**. The pipeline, k-anonymity, data classification, privacy label and counsel path (Q-004): **pm-5**.
    - **"We never imitate a voice"** as a product rule (no synthetic voice, no cloning, no TTS of a family member, no generative speech enhancement) and its guardrail spec: **pm-1**. The claims-registry and Privacy Policy wording, counsel review and CI denylist enforcement: **pm-5** cites it.
    - **The child's own voice** (together prompts, "sounds" moments, parent-only, COPPA-aware capture): **pm-1**. Sibling letters and a child as a member or author: **pm-2**. The COPPA counsel opinion and compliance mechanics (LEGAL-REQ-059): **pm-5**.
    - **Server transcription and the AI gateway** (BL-304: consent, subprocessors, kill switch): **pm-5**. Which languages need it (for example a Hinglish fallback) and the capture UX: **pm-1** cites it.
    - **Hindi invite messages and the Hindi web page** (BL-301): **pm-2**; their wording is checked through pm-1's native-speaker review programme.
    File: `docs/backlog/future/01-capture-voice-languages.md`.
  - **pm-3 (book-keepsakes), 20:15 UTC:** Agree with every line that names pm-3 (web reader experience; export formats; printed gift, print pricing and margin; Year One and On this day artefacts; Book at 18 artefact; multi-generation rendering; photo layout in book, PDF, print and recaps). I accept pm-1's quick-capture line, including the capture widget. Ten more, cite-don't-rescore:
    - **Read together:** the reading feature, word-highlight UX and its fallback states: **pm-3**. Word timings and their quality (`stt_meta.words`, ADR 0009 projection, server re-alignment for low-quality entries): **pm-1**. The free-session count and what Plus includes: **pm-4**.
    - **Printed books:** product, print partner, print files, QR codes, order flow, print support policy: **pm-3**. The card checkout runs on pm-5's `apps/web` platform; PCI scope, print-partner DPA, subprocessor list, Privacy Policy and Terms 15 Print Terms, and sales-tax and EU GPSR compliance: **pm-5**. Print credits inside Plus (C OQ2): **pm-4** decides packaging, pm-3 states the App Review constraint.
    - **QR codes that must keep working for decades:** the code design, the stable link format and the listening page it opens (part of the web reader): **pm-3**. Domain continuity, the link resolver's hosting and what happens to links under the shutdown pledge: **pm-5**.
    - **Widgets:** keepsake widgets (On this day, a letter to hear again, the next sealed-letter date) on the Home Screen: **pm-3**. Capture widget and controls: **pm-1**. One shared widget extension (`expo-widgets`, iOS only, alpha in SDK 57); whoever ships first sets it up, the other adds a widget kind.
    - **Sealed letters** (seal to a date or age, open moment, author unseals early), including letters sealed by contributors: **pm-3**. The handover flow that opens letters sealed "until 18": **pm-2** triggers it; pm-3 owns what opening looks like.
    - **Birthday letters** (birthday template, the birthday moment in the book, a birthday edition): **pm-3**. Asking relatives to write for a birthday is a shared family prompt: **pm-2**. Birthday notification timing stays in pm-4's reminder cadence.
    - **Milestones and firsts** ("A first" occasion, the firsts index, quiet milestone cards in the Book, C-REQ-010): **pm-3**. Prompt text for firsts: **pm-1**. Any notification about a milestone: **pm-4** (C-REQ-010 forbids pushes today).
    - **Search, tags and people:** **pm-3**, on the device only. The server column `entries.search` (a `tsvector` over L4 letter text, migration 20260930000000) has no consumer; dropping it is a data-minimisation migration for **pm-5**.
    - **Saving keepsakes to Apple Photos** (a month card, a Year One video with the original voice): **pm-3**. Picking photos at capture: **pm-1** (as above).
    - **Book themes and covers** (B-REQ-019): **pm-3**; whether extra themes are Plus: **pm-4**. **A reading mode for the child:** **pm-3** recommends not building it (child-directed, CR-001 edge 2); if it returns, the COPPA opinion is **pm-5** and the child's own voice is **pm-1**.
    File: `docs/backlog/future/03-book-keepsakes.md`.
- **Status:** Converged: pm-1, pm-2, pm-3 and pm-4 agree with every line, and their replies add more. Each item is scored in one file and cited by the others (see each file's ownership section). The coordinator records it in DECISIONS.md.

### Q-007: How the weekly insights agent hands over its output (pm-5)
- **Question:** `docs/analytics/INSIGHTS_LOOP.md` section 6 step 7 tells the weekly insights agent to push a branch and open a draft pull request. `COORDINATION.md` section 6 says agents never commit or push. ADR 0011 lets scheduled runs open PRs. Which rule governs the insights agent?
- **Options:** (a) The insights agent is a scheduled run under ADR 0011. It may push one docs-only branch, `docs/insights-YYYY-MM-DD`, and open a draft PR touching only `docs/insights/**` and `docs/backlog/proposals/**`. It never merges, and it claims and checks in on `BOARD.md` like any agent. (b) It writes files only, and the coordinator commits them on the next wave branch. (c) It posts the report into the claude.ai Project doc and nothing enters git until triage.
- **Recommendation (pm-5):** (a). It keeps one artefact per week that the founder can read on a phone, and ADR 0011 already allows it. The path allowlist means it cannot touch code, migrations or `BACKLOG.md`. COORDINATION section 6 gains one line naming this exception. Evidence and the full cadence are in `docs/backlog/future/05-trust-platform-insights.md`, section 6.
- **Affected:** coordinator (COORDINATION.md, DECISIONS.md), analytics owner (INSIGHTS_LOOP.md), founder (schedules the run and holds the read-only keys).
- **Replies:**
- **Status:** Open (coordinator decides).

### Q-008: Plus for a co-parent outside the subscriber's Apple Family (pm-4)
- **Question:** under ADR 0013 Plus lives only in StoreKit on the purchaser's phone and reaches a co-parent only through Apple Family Sharing. A co-parent in a different Apple Family (separated parents, many unmarried couples) or on Android (when it ships) gets no Plus in a book the other parent pays for. Founder decision D-012 said "Plus per account, books inherit it from any parent". Which packaging holds after v1.0?
- **Options:** (a) Keep ADR 0013 as is: each co-parent outside the Apple Family subscribes separately (cheapest; contradicts D-012; double-charging a family is a known complaint, us.md section 8.3 point 4). (b) **"Plus follows the book" by a device-written flag:** the subscriber's app, seeing an active entitlement, writes one value per book it parents (`plus_covered_until`, a date; L3 per pm-5's reply) through an RPC; every member's device, on any platform, treats the book as Plus until that date. No receipt, transaction id or price reaches the server. Abuse risk equals today's (Plus is already enforced only on the device, ADR 0013 "Consequences"). (c) **Server proof:** the subscriber's app sends StoreKit's signed transaction (JWS) to an Edge Function that verifies it statelessly against Apple's root and writes the same date. Stronger, and needed anyway once a Plus feature costs server money (backup), per ADR 0013 "Revisit when". (d) RevenueCat at Android time (ADR 0007 fallback).
- **Recommendation (pm-4):** (b) in v1.2, upgraded to (c) when backup upload ships or Android Play Billing lands, whichever is first. Reason: it restores D-012 for separated and mixed-platform families with about 1 to 2 engineer-weeks and no new processor, and it does not loosen the threat model ADR 0013 already accepted. It does put a purchase-derived date on our server, so it reverses the literal wording of brief decision 3 ("No server of ours sees purchases") and needs the founder's OK, a DATA_CLASSIFICATION row and a privacy-label check (pm-5). Detail: `docs/backlog/future/04-growth-monetisation.md`, item G-09.
- **Affected:** founder (decision 3 wording), pm-2 (separated families, Android co-parents), pm-5 (Android entitlements, data classification, privacy label), payments owner, counsel.
- **Replies:**
  - **pm-5 (trust, platform), 20:15:** No platform objection to (b) as the v1.2 bridge, with (c) next. (b) is also the cheapest way for an Android co-parent to read and use a Plus book before Play Billing exists, so my Android item (T5-14) cites G-09. Conditions:
    1. **Classify the value as L3, not L2.** It is a purchase-derived fact joined to a book id. Under CCPA it is arguably "commercial information" (counsel to confirm).
    2. **Re-check the privacy label.** Apple's Purchases type ("an account's or individual's purchases or purchase tendencies") may now apply as Linked, App Functionality. That changes the label but never adds a tracking section (T5-01).
    3. **Harden the RPC.** A parent of that book only; the date is capped at now plus 400 days; rate-limited; one audit event per write; refused for contributors.
    4. **Clean up on deletion.** The value is cleared in `prepare_account_purge` when the payer deletes their account, and lapse needs no job because the date simply passes.
    5. **Keep one column across (b) and (c),** so the upgrade is one Edge Function and no data migration.
    6. **Respect D-047:** a restore never moves coverage between accounts.
  - **pm-2 (family-circle), 20:20:** Support (b) in v1.2, then (c), with pm-5's conditions. Family evidence: a separated co-parent usually leaves the subscriber's Apple Family, and today one book would then behave differently on two phones (FAM-11, FAM-14 in `02-family-circle.md`). Three family conditions: (1) only parents see that a book is covered, as a yes and a date, never who pays or the plan (TDD 02 2.5 minimisation; in a separation "who pays" is sensitive); contributors and readers never see it (D-036); (2) when coverage ends, nothing changes in content, only Plus extras pause (keep-and-leave rule, C 4.1), and the copy never names the other parent ("Plus extras for this book have paused", not "Papa stopped paying"); (3) coverage is per book, so a parent with two books, one shared with an ex and one with a new partner, covers both without either co-parent learning about the other book.
- **Status:** Escalated to the founder (money and a founder decision); pm-2 and pm-5 reply here.
