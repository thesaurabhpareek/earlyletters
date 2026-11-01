# Future backlog 05: trust, privacy, platform and the insights loop

Owner: pm-5 (trust, privacy, platform, insights). Status: Draft 1, 3 Oct 2026, for the coordinator to merge and the founder to rank. Scope: everything after v1.0 in this theme. v1.0 scope is `docs/ROADMAP.md` section 5 and `docs/BACKLOG.md`; nothing here changes it.
Sibling files: `01-capture-voice-languages.md` (pm-1), `02-family-circle.md` (pm-2), `03-book-keepsakes.md` (pm-3), `04-growth-monetisation.md` (pm-4). Who owns overlapping items is agreed in `docs/agents/DEBATES.md` Q-006; open cross-owner questions are Q-007 (insights hand-over) and Q-008 (Plus outside the Apple Family, pm-4).

## 0. How to read this file

**Evidence tags** (the repo convention):
- **F**: fact, read in this repo on 3 Oct 2026, with the file cited.
- **V**: verified on an opened external page on 3 Oct 2026, listed in Sources.
- **R**: from the competitor research files, which carry their own V, I and U tags (`docs/research/competitors/`).
- **A**: assumption.
- **I**: inference or recommendation (mine).
- **U**: unverified.

Nothing here is legal advice. Every legal line is a question for counsel, with the requirement or register row it touches.

**RICE.** Score = Reach x Impact x Confidence / Effort.
- **Reach:** families per quarter whose experience or decision the item changes. It is counted at one scale assumption (A) for the v1.1 to v1.3 window: **2,000 active families and 1,500 new families a quarter**. ROADMAP has launch in the 9 to 20 Nov 2026 buffer; nothing in the repo forecasts volume, so these numbers are placeholders to rank by, not a forecast.
- **Impact:** 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.
- **Confidence:** 1.0, 0.8, 0.5 or 0.2.
- **Effort:** person-weeks: agent engineering, plus founder hours, plus coordination with counsel. Counsel fees are not counted.
- **Caveat:** RICE flatters cheap hygiene and under-rates platform bets and legal deadlines. Section 3 says where judgement overrides the score.

**Size:** S is 1 person-week or less; M is 1 to 3; L is 3 to 6; XL is over 6.

**Horizon** (A, from ROADMAP section 6: "v1.1 target 6 to 8 weeks after launch"):
- **Now:** v1.1, about January 2027.
- **Next:** v1.2 to v1.3, about February to May 2027.
- **Later:** after v1.3, or when a named trigger fires.

**Ownership (Q-006, converging; pm-1 to pm-4 replied and agree).** This file owns:
- the privacy label, transparency and security pages, assurance, the portability and shutdown pledge (including QR and link continuity for pm-3), import from other apps, and Vault mode;
- the AI gateway (BL-304), claims and promise guards, the child-input counsel gate (LEGAL-REQ-059), data minimisation, account recovery, passkeys, the legacy contact, Report a concern tooling, app lock and shared devices, and age signals;
- Android, the `apps/web` platform, iPad, UI localisation, accessibility beyond AA, remote config (including the experiment rules pm-4's G-01 runs on), realtime sync, cost controls, support, help centre, status, the insights loop (with pm-1's accuracy-feedback pipeline), privacy programmes for new markets (pm-4's G-20 order), and the compliance plumbing of print checkout.

It cites, and does not re-score:
- **pm-2:** shared voice upload, the web contribution page, family pushes, roles and the digest, and the family side of separation and bereavement.
- **pm-3:** the web reader experience, export formats, print product and QR design, and the Book at 18.
- **pm-4:** pricing, Plus packaging including Q-008, store listings, lifecycle email, and growth experiments.
- **pm-1:** spoken languages, the prompt library, the voice-imitation rule, and capture.

---

## 1. Summary

1. **Trust is already the product's strongest asset.** Most of it is paper today, and the future work is keeping it true at scale:
   - 17 of 44 US memory apps declare tracking (R, `us.md` 0.6).
   - FamilyAlbum drew a wave of one-star reviews from long-time users after its policy named an AI vendor (R, `us.md` 3.3).
   - No profiled product outside the US publishes a shutdown or export pledge (R, `global.md` 5.2 item 7, U).
   - Early Letters launches with no tracking section, nothing sent to AI servers, free export forever and a 90-day shutdown pledge (F, Terms 17, Privacy Policy 18).
2. **The cheapest high-value work is guards, not features:**
   - a label and claims guard in CI;
   - signed remote config with staged rollout;
   - billing caps and alerts;
   - the insights loop running weekly with human triage.

   Each costs one or two person-weeks and protects every family.
3. **Two promises in the PRD are not met by the v1.0 build, and both belong to this theme:**
   - **Realtime:** a co-parent's letter shows up within 5 s (PRD 7.3, a gate). The sync engine has no trigger while the app sits open, and Supabase Realtime is off (F, `lib/sync/engine.ts` header, `docs/ops/SECURITY.md` 4).
   - **Staff access:** "Each access is logged and reviewed" in the Privacy Policy needs pgaudit or softer words (F, TDD 04 finding 4; TDD 05 section 11 defers pgaudit).
4. **Android is the biggest platform bet.** It is founder-placed in v1.1 (BRIEF decision 9). It is not one item but four:
   - a full web deletion flow (D-042);
   - an entitlement path across platforms (Q-008);
   - key storage without iCloud Keychain (TDD 04 OQ-S6);
   - an LLC before launch (D-004 point 3).

   I recommend readiness work in v1.1 and the store launch in v1.2 or v1.3 (section 2.3, T5-16). That differs from the decision as written, so it goes to the founder.
5. **Vault mode, SOC 2, legacy contacts in the app and import are Later on evidence:**
   - Vault scores 13, because demand is unproven and the crypto is the riskiest code in the repo (TDD 10 risk 9).
   - SOC 2 scores 8 for a consumer app.
   - A pen test plus a published summary buys more trust per dollar (V: Drata, auditor fees alone $7.5k to $20k).
6. **The insights loop is built but not operated.** Section 6 gives it a weekly owner, a triage rule, three risk classes, a place in the agent protocol and a stop rule. Q-007 resolves a real conflict: INSIGHTS_LOOP tells an agent to push a branch, while COORDINATION says agents never push.
7. **A dated legal item may land before v1.1.** California AB 1043 has developers request an age signal from 1 Jan 2027, as Lawyer 1 H4 reports (U, search result only). That needs counsel now, not in v1.1 (T5-15).

---

## 2. Items

### 2.1 Trust and privacy promises

#### T5-01 Privacy label with no tracking section, kept that way
- **Problem and evidence:**
  - 17 of 44 US memory apps declare "Data Used to Track You", including some that market "no ads" (R, `us.md` 0.6, 5).
  - Outside the US only Famileo and Chapter One declare none (R, `global.md` 0.5).
  - Our v1.0 label has no tracking section (F, `app-store-privacy-labels.md` 1.1; TRACKING_PLAN 10). It stays clean only while nobody adds an SDK, an event property or a vendor that changes the answer.
  - Q-005 ("Not linked" vs "Linked" for usage data) is open with counsel (F, DEBATES).
  - Q-008 may add a purchase-derived date to the server (F, DEBATES).
- **Job to be done:** When I compare baby apps in the store, I want a label I can check, so that "private" is something I can see, not a slogan.
- **Solution:**
  1. A CI guard (extends BL-231 render-labels and BL-117 SDK denylist) that fails the build when a dependency, catalogue property, host or data-map element would add a tracking line, Identifiers, Location or a new Linked type, unless a reviewed `data-map.yaml` change sits in the same PR.
  2. Per-release evidence (TDD 05 5.10), plus a quarterly label-vs-build audit by the founder (15 minutes).
  3. The same render for the Google Play Data safety form before Android (T5-16).
  4. A short public "why our label says this" section on the trust page (T5-02).
  5. Carry the Q-005 and Q-008 outcomes into the label the same week they are decided.
- **Competitors:**
  - Day One makes privacy its second App Store screenshot (R, `adjacent` B4).
  - Apple Journal shows "data not linked to you" (R, `us.md` 5).
  - The incumbents track (Qeepsake, Tinybeans, FamilyAlbum, BackThen, TinyNest; R).
- **Differentiator:** a no-tracking label that stays so across iOS and Android, with a public explanation per line. That is checkable proof, and rarer than "private".
- **RICE:** R 1,500, I 0.5, C 0.8, E 1 = **600**.
- **Dependencies:** BL-016 (data map canonical), BL-231, BL-117; Q-005 (counsel); Q-008 (pm-4); T5-16 for Play.
- **Legal:**
  - Labels are representations (FTC Act s.5, CR-010; LEGAL-REQ-041 to -043).
  - "Not linked" rests on counsel accepting CCPA de-identification (Q-005).
  - The Play form must match the Privacy Policy and the CHD notice (Lawyer 2 H2).
- **Metric:**
  - Releases shipped with a label diff not approved in the PR: 0.
  - Tracking section: absent on both stores.
  - Linked data types: no more than the v1.0 count plus approved changes.
- **Size:** S. **Horizon:** Now (v1.1); the Play form ships with T5-16.

#### T5-02 Transparency and security pages, and a twice-yearly report
- **Problem and evidence:**
  - The Privacy Policy promises "We will publish how many requests we receive" (F, `privacy-policy.md` line 131, CN-9). TDD 05 section 11 says "Decide wording; build nothing" for v1.
  - `security.txt` points at `https://earlyletters.com/security`, which does not exist. DOMAINS.md 8 says to drop the Policy line until it does (F).
  - Parents cannot tell marketing from practice (R, `us.md` 5 pattern 1).
- **Job to be done:** When I am deciding whether to trust a company with my child's voice, I want to see what they do, not what they say, in one place I can return to.
- **Solution:**
  1. **/trust** on earlyletters.com (website thread), generated from repo data where possible:
     - what leaves the phone and what does not;
     - the subprocessor list with contacts (already required, Lawyer 2 M6);
     - no ads, no sale, no AI training;
     - the label explanation (T5-01) and the shutdown pledge (T5-04);
     - deletion promises with how we met them.
  2. **/security:** a vulnerability disclosure policy (DOMAINS.md 8 wording), safe harbour for good-faith research, a 3-working-day acknowledgement, and the pen-test summary (T5-03).
  3. **A twice-yearly report** of counts only:
     - legal requests received and answered;
     - staff break-glass accesses (from `ops.audit_log`);
     - deletion requests and the share completed within 31 days (from `ops_deletion_sla`);
     - rights requests by kind (from `privacy_requests` once it exists);
     - incidents.

     Counts under 10 print as "fewer than 10".
- **Competitors:**
  - Day One publishes a privacy pledge (R, `adjacent` A1).
  - Rosebud names every model vendor (R).
  - Status, transparency and security pages of the memory apps were not researched (U).
- **Differentiator:** a family-memory app that publishes how it was asked for data and how it kept its deletion promise is, as far as the research shows, unique in the category (I, U).
- **RICE:** R 1,000, I 0.5, C 0.5, E 1.5 = **167**.
- **Dependencies:**
  - Website thread (COORDINATION 7).
  - BL-237 (`privacy_requests`, runbook wrapper) and BL-242 (health views).
  - Counsel answer on CN-9.
  - T5-03 for the pen-test summary.
- **Legal:**
  - Every line is a public representation (CR-010; LEGAL-REQ-044 claims registry), so numbers must be generated, never typed.
  - Publishing legal-request counts can conflict with gag orders. Counsel decides wording, and whether "we push back on overbroad requests" stays (privacy-policy section 7).
  - No warrant canary (section 5).
- **Metric:**
  - Report published on schedule (May and November).
  - Zero corrections needed after publication.
  - /trust visits per store install, from website analytics if any, opt-in only (U).
- **Size:** S for the pages, S per report. **Horizon:** Now for /trust and /security (v1.1); Next for the first report, about May 2027, at 6 months of data.

#### T5-03 Independent assurance: pen test, crypto review, SOC 2 timing
- **Problem and evidence:**
  - TDD 04 8.7 wants an external pen test before TestFlight beyond the founding family. BACKLOG holds it as BL-313, "before the public link, paid marketing or 1k families" (F).
  - TDD 04 3.13 defers bug bounty and SOC 2 to "after launch with paying users, or a B2B ask" (F).
  - The founder is root for every console and the only reviewer of agent-written RLS (F, TDD 04 2.4; TDD 10 risk 6).
  - Supabase holds SOC 2 Type 2, but the report is for Team and Enterprise customers only, and "does not transfer" to us (V).
  - SOC 2 auditor fees for small companies run $7,500 to $15,000 (Type 1) and $12,000 to $20,000 (Type 2), before tooling and staff time (V, Drata).
- **Job to be done:** When I am told my letters are private, I want someone other than the company to have checked, so I am not trusting a one-person team's word.
- **Solution:**
  1. **Pen test (BL-313).** Grey-box, TDD 04 8.7 scope, before paid marketing or the public link (pm-4's growth plan triggers it). Fix all critical and high findings. Publish a one-page summary on /security.
  2. **A paid independent review of RLS and of any crypto** (`packages/crypto`) before Vault mode or any client-side key scheme ships (TDD 04 OQ-S9).
  3. **A vulnerability disclosure policy now, with no cash bounty.** Consider a bounty platform only after two clean pen tests.
  4. **SOC 2: none for the consumer product.**
     - Trigger to start Type 1: a B2B channel (employer benefit, hospital or gift partner) asks for it in writing, or CCPA cybersecurity-audit duties apply by revenue tier (CR-015, from 2028, U).
     - In both cases the LLC (D-004) comes first.
- **Competitors:** not researched for any memory app (U). Day One sits under Automattic (R); its certifications are not checked (U).
- **Differentiator:** a published pen-test summary is unusual for a consumer journal (I, U).
- **RICE:**
  - Pen test plus crypto review: R 2,000, I 1, C 0.5, E 3 = **333**.
  - SOC 2 alone: R 2,000, I 0.25, C 0.2, E 12 = **8**.
- **Dependencies:**
  - BL-313; T5-02.
  - D-004 entity: an auditor contracts with a company, and insurance needs one.
  - Founder budget (A: low five figures for the pen test, U).
  - Staging with persona fixtures (BL-116).
- **Legal:**
  - The pen-test contract must keep testers off production L4 (staging with "Asha" fixtures only).
  - The summary is a representation (CR-010).
  - The NDA and data handling of the firm need a DPA if they ever touch real data. They should not.
- **Metric:** open critical or high findings at release: 0; days from report to fix for high: 14 or fewer; disclosure reports acknowledged within 3 working days: 100%.
- **Size:** M (founder plus fixes). **Horizon:** Now (v1.1, gated on pm-4's paid-marketing date). Crypto review is Next, with any key scheme. SOC 2 is Later, on trigger.

#### T5-04 Portability and the shutdown pledge
- **Problem and evidence:**
  - Terms 17 and Privacy Policy 18 promise 90 days' notice with export working throughout; Terms 27.3 binds a buyer to Sections 6, 13 and 17 (F).
  - Lawyer 1 L5: the pledge "may not survive a bankruptcy trustee's rejection... fund a wind-down reserve" (F).
  - Export already runs offline and writes a README, a schema, the letters and an offline `index.html` reader (F, `lib/export/build.logic.ts`; pm-3's board line: no ZIP64, 3.9 GB cap).
  - In the category, complaints include no bulk export (2%), paywalls on old memories (13%) and lost content (17%) (R, `us.md` 9).
  - Qeepsake is deactivating inactive free accounts (R, `us.md` 0.4).
  - pm-3's QR codes in printed books must resolve for decades (Q-006, pm-3 reply).
- **Job to be done:** When I put 18 years of my child's life into an app, I want to know I can always take it with me, even if the company is gone, so I can start without worrying how it ends.
- **Solution:**
  1. **Publish the export format:** the JSON schema, the README and a sample "Asha" export on /trust, under semver. It is a public promise that format changes are additive within a major version.
  2. **A written shutdown runbook** (`docs/ops/runbooks/wind-down.md`):
     - day 0 notice by email and in-app announcement (ADR 0016 block);
     - an app update that removes every server dependency and keeps local reading, playback and export;
     - server export for anyone whose phone is gone (BL-309);
     - Standard-mode backups decrypted to export (`DELETION_AND_EXPORT_SPEC.md`, "Company disappears" row);
     - keep earlyletters.com, the QR resolver and a static "how to open your export" page alive for at least 10 years (A: domain renewed 10 years ahead, DOMAINS.md 2 already suggests 5 or more).
  3. **A funded wind-down reserve** sized from the cost model (TDD 06 4.3: about 3 months of run-rate, A).
  4. **QR and link continuity:** every printed or shared link resolves through `earlyletters.com` (never a vendor URL), with a resolver that can be served statically after shutdown (I).
  5. **No inactivity deletion, ever,** stated on /trust (contrast: Google deletes accounts unused for 2 years; R, `adjacent` A3).
- **Competitors:**
  - HereAfter promises recordings stay downloadable if it shuts down (R, `adjacent` A2).
  - Remento and Day One keep content readable after a lapse (R).
  - BackThen: "all your content returned if you choose to leave" (R).
  - No profiled product outside the US publishes a pledge (R, U).
- **Differentiator:** a pledge with a runbook, a reserve and a published format, rather than a sentence in the Terms.
- **RICE:** R 2,000, I 1, C 0.5, E 1.5 = **667**.
- **Dependencies:**
  - D-004 entity: a reserve and an assignable pledge need a company.
  - BL-309 (server export).
  - pm-3 export formats and QR format.
  - T5-17 (static pages).
  - The founder's finance decision on the reserve.
- **Legal:**
  - Enforceability against an asset buyer and in insolvency (Lawyer 1 question 3).
  - The reserve may need a trust or escrow structure (counsel).
  - Publishing a schema is not a licence of user content.
  - The shutdown-time decryption of Standard backups is already disclosed (Privacy Policy section 9).
- **Metric:**
  - Published format matches the shipped export (golden test, pm-3).
  - Wind-down runbook rehearsed on staging once a year.
  - Reserve funded: yes or no, reported to the founder quarterly.
- **Size:** S plus a founder finance decision. **Horizon:** Now (v1.1).

#### T5-05 Import from other memory apps
- **Problem and evidence:**
  - Switchers carry years of entries: Qeepsake moved to paid-only, and Tinybeans raised prices from about $40 to $75 a year (R, `us.md` 0.4, 9).
  - Dearest files voicemails on the day recorded; importing with original dates is table stakes (R, `us.md` 6 item 6).
  - pm-1 owns importing single voice notes; bulk import of other apps' exports is this item (Q-006).
- **Job to be done:** When I leave an app I no longer trust, I want my old entries to arrive with their dates, so the book starts complete and not empty.
- **Solution:**
  - Text-and-date import from documented export formats only (Day One JSON, Apple Journal export, plain text and CSV with dates). Qeepsake and Tinybeans are researched first: exports are paid or PDF-only per reviews (R, U).
  - Imported text is treated as typed text, never cleaned or rewritten (constitution; BRIEF decision 7).
  - Photos, once photos ship, go through EXIF and location strip (LEGAL-REQ-013).
  - Runs on the device, with nothing uploaded during import except normal sync after.
- **Competitors:** not researched (U). Dearest imports voicemails (R).
- **Differentiator:** "Bring your book with you", matching the pledge in T5-04.
- **RICE:** R 150, I 2, C 0.5, E 4 = **38**.
- **Dependencies:** pm-1's voice-note import; pm-3's book model (`packages/book`); the photos decision (pm-1).
- **Legal:** imported entries may contain other people's words and health data (MHMDA, Lawyer 2 H2); the author becomes the author of record (Terms 5.4). Other apps' terms on scraping or automated export are not checked (U).
- **Metric:** imports started vs completed; first-week retention of importers vs non-importers (server cohorts, k = 10).
- **Size:** M. **Horizon:** Later (after v1.3; revisit if pm-4 sees switcher demand).

#### T5-06 Encrypted Vault mode
- **Problem and evidence:**
  - The Privacy Policy and Terms 12.2 already describe Standard (escrowed key) and Vault (no copy held by us) backup (F).
  - ADR 0006, TDD 04 3.6 and BL-306 design it: per-child keys, X25519 member grants, a synchronizable-Keychain native module, a 24-word Recovery Kit (F).
  - TDD 10 risk 9: "Any bug is permanent voice loss; none of it ports to Android." Its verdict: "Vault mode later, if anyone asks" (F).
  - The FTC warns that a short voice clip is enough to clone a family member for scams (R, `adjacent` A1 finding 3).
- **Job to be done:** When I keep my family's voices online, I want the option that nobody but my family can ever open them, even if it means I hold the key.
- **Solution:**
  1. Build only after pm-2's shared-voice pipeline (D-032 scheme) is stable and a demand trigger fires. Trigger: 25 or more distinct written requests for "end-to-end" or "zero-knowledge" in support (T5-24 tags), or counsel requires it for health data (TDD 04 3.13).
  2. Then ship it as an opt-in per book, with the honest loss confirmation (Terms 12.2) and the Recovery Kit re-entry check (TDD 04 3.6.6).
  3. Pass an independent crypto review before release (T5-03).
  4. Design key sync for Android from day one (Block Store or Recovery Kit only, OQ-S6), never iCloud Keychain alone.
- **Competitors:**
  - Day One: end-to-end encryption on all plans, "Even if we wanted to read... we couldn't" (R, `adjacent` A1).
  - Apple Journal: E2EE in iCloud (R).
  - Dearest: on-device and iCloud only (R).
- **Differentiator:** honest choice (Standard for recoverability, Vault for secrecy) with plain words about loss. Day One sets the bar on default E2EE; we would not match it for letter text (section 5).
- **RICE:** R 100, I 2, C 0.5, E 8 = **13**.
- **Dependencies:** pm-2 shared voice (BL-200 to BL-206); BL-306; SEC-08 crypto library; T5-03; T5-16 key sync design.
- **Legal:**
  - Changes breach analysis per mode (LEGAL-REQ-039 enumeration already flags Standard vs Vault).
  - "End-to-end encrypted" is a high-scrutiny claim (CR-010; compliance register s.3 rows 2 and 6).
  - Server export cannot include Vault audio (`DELETION_AND_EXPORT_SPEC.md` DATA-REQ-054).
- **Metric:** Vault adoption share; Recovery Kit verification completion: 100% of Vault books; support tickets "cannot open my backup": 0 unexplained.
- **Size:** XL. **Horizon:** Later (trigger-based).

#### T5-07 AI processing gate: server transcription (BL-304)
- **Problem and evidence:**
  - v1.0 sends nothing to AI servers (F, ROADMAP 5; TDD 10 cut).
  - BL-304 (AI gateway with consent; LEGAL-REQ-004, -005, -018 to -020, -040) waits in v1.1 and later (F).
  - FamilyAlbum's one-star wave came from naming an AI vendor in a policy update, not from training (R, `us.md` 3.3, 5 pattern 3).
  - "Unwanted or poor AI" is 8% of recent complaints (R, `us.md` 9).
  - pm-1 decides which languages need server help (Q-006).
- **Job to be done:** When my language is transcribed badly on the phone, I want a better option, but only if I choose it and know exactly who hears my voice.
- **Solution:**
  - Build nothing until pm-1 names a language whose on-device accuracy fails pm-1's bar (Hinglish is the likely candidate; ADR 0012 cites 29.74% WER).
  - Then ship it as an **announced feature**, never as a subprocessor-page update:
    - its own just-in-time consent before the first upload (Day One pattern; R `adjacent` B4);
    - per-letter visibility of where it was transcribed;
    - zero-retention evidence on file;
    - a spend breaker and kill switch (TDD 06 RB-7).
  - Subprocessor change notice 30 days ahead (subprocessors.md section 5).
- **Competitors:**
  - Day One asks a separate AI consent (R).
  - Rosebud and Voicenotes name vendors and ZDR terms (R).
  - FamilyAlbum did it silently (R).
- **Differentiator:** "Nothing leaves your phone unless you choose it, for that letter", which keeps the v1.0 promise true.
- **RICE:** R 200, I 1, C 0.5, E 4 = **25**.
- **Dependencies:** pm-1 accuracy data (accuracy-feedback pipeline in T5-26); BL-304; T5-01 (label: Audio Data purposes); T5-21 kill switch; counsel.
- **Legal:**
  - LEGAL-REQ-004, -005, -020.
  - Vendor gates: DPA and ZDR evidence (TDD 05 5.9: DeepInfra has no DPA; Groq ZDR not evidenced).
  - MHMDA consent for health content in audio.
  - The label's Audio Data purposes.
- **Metric:**
  - Consent shown before any upload: 100% (network-capture test, BL-239).
  - Opt-in rate.
  - One-star reviews mentioning AI: 0.
  - Spend per transcribed minute within budget.
- **Size:** L. **Horizon:** Later (trigger: pm-1's language evidence).

#### T5-08 Claims and promise guards
- **Problem and evidence:**
  - Shipped copy has repeatedly drifted ahead of the architecture (F, compliance register s.3; Lawyer 1 M3, M5; Lawyer 2 H4).
  - New promises arrive post-launch: "we never imitate a voice" (pm-1; R `global.md` 6 item 5; `adjacent` A2 ethical lines), "never used to train AI", "no ads".
  - The `child-input` flag needs counsel's COPPA opinion before it turns on (F, LEGAL-REQ-059; BL-119).
  - Q-006: pm-1 owns the rules; pm-5 owns enforcement.
- **Job to be done:** When I read a promise from this company, I want it to stay true release after release.
- **Solution:**
  1. Extend BL-118's claims registry: every public promise key lists the code paths and data-map elements it depends on; CI fails when they change without a claims review.
  2. A dependency denylist for voice synthesis, speaker identification, diarisation and face detection libraries (extends LEGAL-REQ-019 to TTS and voice cloning).
  3. The `child-input` flag cannot turn on in production without a counsel opinion link (LEGAL-REQ-059, already specified; keep it enforced through every remote-config change in T5-21).
  4. Privacy Policy and /trust wording for "no synthetic voice, no voiceprints" (R, `adjacent` 6 item 6; counsel).
- **Competitors:**
  - Babytree imitates parents' voices with AI (R, `global.md` 0.2).
  - Forevermore clones voices (R).
  - Nobody claims "never rewrite and never synthesise" (R, `global.md` 5.2).
- **Differentiator:** promises enforced by tests, not by memory.
- **RICE:** R 2,000, I 0.5, C 0.8, E 1 = **800**.
- **Dependencies:** BL-118, BL-119, BL-117; pm-1's rule spec; T5-21.
- **Legal:** FTC s.5 (CR-010); COPPA (CR-001, Lawyer 2 M1); biometric laws if any voice processing ever starts (Lawyer 2 H3).
- **Metric:** releases with an unreviewed claims-dependency change: 0; denylisted imports: 0.
- **Size:** S. **Horizon:** Now (v1.1).

#### T5-09 Data minimisation sweep
- **Problem and evidence:**
  - `entries.search`, a server tsvector over L4 letter text, has no consumer: search is on the device only (F, pm-3 in Q-006; ARCH 5).
  - Its global GIN index is a scale risk (F, TDD 06 P-8).
  - Per-token `stt_meta` JSON roughly doubles server DB size at 100k families. TDD 06 3.4 suggests keeping it on the device and in export only (F, E).
  - Supabase Auth audit log IP retention is an open question (F, `DELETION_AND_EXPORT_SPEC.md` OQ-5).
  - Postgres echoes failing rows into logs (F, TDD 06 C-2; BL-244 handles the trigger).
- **Job to be done:** When I give a company my child's words, I want it to keep only what it needs, so less can ever leak.
- **Solution:**
  - One fix-forward migration per change:
    - drop `entries.search` and its index;
    - stop syncing `stt_meta` word timings unless pm-1 needs them on another device for Read together (decide with pm-1 and pm-3);
    - shortest auth-log retention.
  - Update DATA_CLASSIFICATION and the data map in the same PR.
- **Competitors:** n/a.
- **Differentiator:** less L4 at rest; a smaller breach surface.
- **RICE:** R 2,000, I 0.25, C 0.8, E 1 = **400**.
- **Dependencies:** pm-1 (word timings on other devices), pm-3 (search stays local); migration range from the coordinator; D-041 approve-migration label.
- **Legal:** shrinks MHMDA consumer-health-data surface (Lawyer 2 H2); Privacy Policy section 4 may get simpler (minor version).
- **Metric:** L4 columns on the server (count) down; DB size per 1k letters (TDD 06 3.4) down.
- **Size:** S. **Horizon:** Now (v1.1).

### 2.2 Identity, recovery and safety

#### T5-10 Account recovery ("Ways to sign in")
- **Problem and evidence:**
  - Sign-in is Apple, Google or an email link: no passwords, so no forgot-password flow (F, BRIEF decision 4).
  - A person who loses that email (a work address), an Apple ID or a Google account loses the synced copy on a new phone. Local letters survive (F, AUTH_SETUP 9; sync never deletes local rows).
  - Manual identity linking is on but unbuilt (F, AUTH_SETUP 1, A-REQ-019 P1).
  - "Locked out of the account" is 2% of recent complaints (R, `us.md` 9 row 14).
  - Support-assisted recovery is the classic account-takeover hole, and TDD 04 names the ex-partner co-parent (A1) and the email-compromise attacker (A4) (F).
- **Job to be done:** When I change phones or lose an old email, I want to get back into my book without trusting a stranger on a support line.
- **Solution:**
  1. **Settings > Account > Ways to sign in:** link a second method (Apple plus email, or email plus passkey).
  2. A single quiet nudge after the 10th letter if only one method exists. No fear copy (content rules).
  3. Security notices by email on any method added or removed (AUTH_SETUP 6, already optional).
  4. A "Where you're signed in" device list beside the v1.0 "Sign out of other devices" row, which already exists (F, `app/settings/account.tsx`), plus a new-sign-in alert email (TDD 04 SEC-06, P1). pm-2 places both in the Family and safety flows (FAM-11).
  5. A support recovery runbook used only when every method is lost:
     - proof of control of the original email, or co-parent confirmation;
     - a 7-day hold with notice to every known address;
     - no recovery while a deletion or a safety report is open;
     - audited (`ops.audit_log`).
- **Competitors:** not researched (U). Apple offers Account Recovery Contacts for Apple Accounts (U: seen in search results only, page not opened).
- **Differentiator:** passwordless and recoverable without a support back door.
- **RICE:** R 600, I 2, C 0.8, E 2 = **480**.
- **Dependencies:** BL-302 (Google and linking, v1.1); T5-11; T5-24 (support runbooks); BL-237 runbook wrapper.
- **Legal:** identity verification for rights requests uses the same proof (LEGAL-REQ-036); keep records content-free.
- **Metric:**
  - Share of accounts with 2 or more methods (server count, k = 10).
  - Recovery tickets per 1,000 families.
  - Takeovers via support: 0.
- **Size:** M. **Horizon:** Now (v1.1, with BL-302).

#### T5-11 Passkeys by default
- **Problem and evidence:**
  - Supabase passkeys are in beta (28 May 2026) and the API is "experimental".
  - Our code exists behind `EXPO_PUBLIC_PASSKEYS` using `react-native-passkey` 3.6.2.
  - The RP ID cannot change later (F, AUTH_SETUP 7).
  - ROADMAP 6 lists "passkeys on by default" for v1.1 (F).
  - The 6-digit email code cannot be rate-limited per address server-side (F, TDD 04 finding 6). Passkeys remove the email step for returning users.
- **Job to be done:** When I sign in on a new phone, I want Face ID to be enough, without waiting for an email.
- **Solution:**
  - **Now:** flag on after device test 11.7 passes; "Add a passkey" offered once after sign-in (not during first run).
  - **Next:** passkey-first sign-in sheet for returning users when Supabase marks the API stable.
  - Android later needs `assetlinks.json` and the apk-key-hash origin (AUTH_SETUP 7).
- **Competitors:** not researched (U).
- **Differentiator:** small: Sign in with Apple already gives most iOS users a Face ID flow (I).
- **RICE:** R 600, I 1, C 0.5, E 1.5 = **200**.
- **Dependencies:** Supabase GA (U); RP ID `earlyletters.com` fixed forever; T5-10; T5-16 for Android.
- **Legal:** none new. The privacy label is unchanged: passkeys are on-device credentials (I, counsel to confirm with T5-01).
- **Metric:** share of email-method users with a passkey; magic-link emails sent per active user down; sign-in success rate (A-NFR-013 97%).
- **Size:** S. **Horizon:** Now (flag on), Next (passkey-first).

#### T5-12 Legacy contact and the fiduciary runbook
- **Problem and evidence:**
  - An 18-year keepsake will outlive some authors (F, compliance register CR-018: RUFADAA; Gap; "optional legacy contact later").
  - With a co-parent, the book continues (F, Lawyer 2 H5). A sole parent's book has no successor.
  - Apple's Legacy Contact reaches iCloud data and backups, which "might include" which apps were downloaded. It is not our server-side book (V).
  - Dearest sells a legacy contact in Plus (R, `us.md` 1).
  - Content rules: "Legacy is about love and time, never endings" (F, CLAUDE.md). Adjacent research's ethical line 6: no machine-made memorial (R).
  - Q-006 (pm-2 reply): what family sees after a death is pm-2's.
- **Job to be done:** When I write to my child alone, I want to name someone I trust who can keep the book for my child if I cannot, so the letters always reach them.
- **Solution:**
  1. **Now:** an executor and fiduciary support runbook (CR-018). It covers verification (death certificate or court document, per counsel), what is released (in-book letters and recordings as an export; never private letters or raw transcripts without counsel), audit, and the 30-day hold. It also covers making a **verified guardian a parent** of a book whose only parent is gone, using pm-2's role change (FAM-12, FAM-15). Counsel sets the proof standard.
  2. **Next (v1.3, requested by pm-2 for FAM-12):** a **kept account** state set by that runbook.
     - The author's account stops signing in and sends nothing.
     - Every letter is kept unchanged; their waiting family letters stay with the parents to decide.
     - Nothing resurfaces.
     - Purge and deletion never run on it unless a verified fiduciary asks.
     - It is one server status plus checks in the sync and invite RPCs (S to M, a migration).
  3. **Later:** an in-app **book keeper** per book.
     - The parent names one adult by email.
     - The keeper is told, and gets nothing until a request, then verification, then a 30-day wait with notice to the author's addresses.
     - The keeper then receives reader access or an export, per the author's choice.
     - Copy is written with the content owner. No death words in the UI, per content rules ("If you cannot reach your book").
- **Competitors:** Dearest (R), Apple Legacy Contact (V), HereAfter's shutdown promise (R).
- **Differentiator:** the letters reach the child even when the author cannot.
- **RICE:**
  - In-app keeper: R 200, I 1, C 0.5, E 4 = **25**.
  - Runbook alone: E 0.5, about 200.
- **Dependencies:** pm-2 (the family side, the Book at 18); T5-24; BL-237; counsel.
- **Legal:**
  - RUFADAA lets an online tool designation take priority (CR-018, U).
  - Health data in letters released to a third party (MHMDA consent; Lawyer 2 question 1).
  - Author ownership (Terms 5, 8; Lawyer 1 M7: a licence that survives account deletion).
- **Metric:** fiduciary requests answered within the runbook's time limit: 100%; keepers named per sole-parent book (once built).
- **Size:** S (runbook), S to M (kept account), M (in-app keeper). **Horizon:** Now (runbook), Next (kept account), Later (in-app keeper).

#### T5-13 Report a concern and safety runbooks
- **Problem and evidence:**
  - LEGAL-REQ-056 (P1): Settings > Help "Report a concern", a ticket without content prefill, a safety-removal runbook and a counsel-led CSAM runbook (F).
  - TDD 04 adversary A1 is the ex-partner co-parent (F).
  - Contributors arrive in v1.1 (BRIEF decision 5; BL-190 to BL-196), which multiplies the people in one book.
  - Q-006 (pm-2): in-product controls are pm-2's; tooling and runbooks are pm-5's.
- **Job to be done:** When someone in my child's book behaves in a way that worries me, I want a calm, private way to ask for help that does not tip them off.
- **Solution:**
  - "Report a concern" row (categories only), content-free acknowledgement email, a `privacy_requests`-style ticket kind.
  - Runbooks:
    - verified safety removal (service role, audited, removal revokes access and starts a new key epoch once keys exist);
    - preservation (LEGAL-REQ-057);
    - CSAM report path (counsel-led; preserve, then report, no browsing).
  - The reporter is never revealed to the reported member.
- **Competitors:** not researched (U). TinyNest exposes member emails, which is the opposite (R, `us.md` 3.5).
- **Differentiator:** safety help designed for family conflict, without content exposure to staff.
- **RICE:** R 800, I 1, C 0.8, E 1.5 = **427**.
- **Dependencies:** pm-2 controls; BL-193 (leave and remove); BL-237; T5-24 tagging.
- **Legal:** LEGAL-REQ-056, -057; CSAM reporting duties (18 U.S.C. 2258A for providers, counsel to confirm applicability, U); Terms 9.4.
- **Metric:** acknowledgement within 1 working day: 100%; verified removals completed within 72 h; reporter exposure incidents: 0.
- **Size:** M. **Horizon:** Now (v1.1, with contributors).

#### T5-14 Face ID lock and shared family devices
- **Problem and evidence:**
  - An app lock is table stakes for journal apps (Dearest, Day One, Apple Journal; R, `us.md` 6 item 9).
  - TDD 04 OQ-S10 recommends an optional Face ID lock (P1, off by default) for the shared family iPad and the ex-partner with physical access (F).
  - BL-314 holds it for later (F).
  - The phone binds to one account: `ownership.ts` raises `AccountMismatchError` (F, pm-2 in Q-006).
  - D-047 already worries about a shared family iPad and restore (F).
- **Job to be done:** When my phone or our iPad is picked up by someone else, I want my private letters closed.
- **Solution:**
  - **Next:** an optional Face ID or passcode lock (system LocalAuthentication via Expo), offered as a list row like Apple Journal (R, `adjacent` B5), with grace periods. Snapshot masking in the app switcher.
  - **Later:** a handed-down-phone flow, which pm-2 asks for in FAM-08 and scores at 28. After a confirmed sync it offers: "This phone holds {signsAs}'s letters. Sign out and remove them from this phone." It extends the v1.0 rule that sign-out waits for uploads (AUTH_SETUP 9.5).
  - **Not in v1.x:** full two-account switching (pm-2 FAM-08 scores it 4).
  - pm-2's "guest author on this phone" covers the grandparent case without a second account.
- **Competitors:** Day One, Apple Journal, Dearest (R).
- **Differentiator:** parity, done calmly.
- **RICE:** R 400, I 1, C 0.8, E 2 = **160** (lock). The handed-down flow is scored by pm-2 (FAM-08, 28); full multi-account is pm-2's 4.
- **Dependencies:** BL-314; pm-2 guest author; T5-18 (iPad).
- **Legal:** none new (on-device biometrics are not collected; LEGAL-REQ-019 unchanged).
- **Metric:** lock adoption; lock-related support tickets ("locked out of my own book") within the T5-24 baseline.
- **Size:** M (lock), S (handed-down flow). **Horizon:** Next (lock), Later (handed-down flow); full account switching is on the will-not-build list for v1.x.

#### T5-15 Age signals for the 2027 laws
- **Problem and evidence:**
  - Lawyer 1 H4 cites Texas SB 2420 (App Store Accountability Act, said to be in force in 2026) and California AB 1043 ("developers request an age signal from 1 Jan 2027"). Both come from search results only (U).
  - D-026 stores a boolean and uses Declared Age Range in memory only (F).
  - v1.1 lands after 1 Jan 2027 (A, section 0), so this may need a 1.0.x release.
- **Job to be done:** When the law changes how apps must check age, I want the app to comply without asking me for more personal data.
- **Solution:**
  - Counsel confirms the duties in November 2026.
  - The app then requests the platform age signal where the API exists, holds the result in memory only (TDD 04 3.3 point 2), and treats a minor signal as actual knowledge (`close_underage_account` runbook, TDD 05 X-10).
  - Android uses the Play equivalent when T5-16 ships (U).
- **Competitors:** n/a.
- **Differentiator:** compliance with no new stored data.
- **RICE:** R 1,500, I 0.25, C 0.5, E 1.5 = **125**. A legal date overrides the score.
- **Dependencies:** counsel; BL-037 gate module; D-026; T5-16.
- **Legal:** LEGAL-REQ-002; Lawyer 1 question 2; TDD 05 OQ-L8.
- **Metric:** signal requested on supported OS versions: 100% of first runs (local test); stored age data: none (unit test).
- **Size:** S. **Horizon:** Now: decide in November 2026; ship in 1.0.x if counsel says 1 Jan applies.

### 2.3 Platforms and surfaces

#### T5-16 Android app
- **Problem and evidence:**
  - BRIEF decision 9 defers Google Play and Android to v1.1 (F).
  - iOS share is 6.1% in India, 21.2% in Brazil and 28% in Mexico. Those markets are "Android-gated" (R, `global.md` 1, 0.7).
  - Mixed-platform families are routine in reviews; an Android co-parent cannot join a v1.0 book (R, `us.md` 10 item 7).
  - Readiness gaps, each a fact:
    - Google Play requires an in-app deletion path **and** a web link for deletion requests, declared in the Data safety form (V). D-042 already says the full web flow ships before Android (F).
    - Plus is checked only on the device through StoreKit (BRIEF decision 3), so an Android co-parent cannot inherit it. pm-4's Q-008 proposes a book-level coverage date (F).
    - Key sync for any encrypted audio cannot rely on iCloud Keychain (F, TDD 04 OQ-S6).
    - D-004 point 3 says to form an LLC before Android (F).
    - Passkeys on Android need `assetlinks.json` (F, AUTH_SETUP 7); Apple sign-in on Android needs the Services ID web flow (F, AUTH_SETUP 2.3).
    - BL-288 builds Android in CI for parity, not for shipping (F).
- **Job to be done:** When my partner or my mother uses Android, I want them in the same book, writing and listening, without buying a different phone.
- **Solution, in three stages:**
  1. **Readiness (Now):**
     - BL-288 green on every PR;
     - full web deletion and privacy-choices flow (BL-310, in T5-17);
     - Play Data safety render (T5-01);
     - `assetlinks.json`;
     - founder decisions on the entity and Q-008.
  2. **Android free and co-parent (Next, v1.2):**
     - everything free, plus reading and using a Plus book through Q-008 option (b);
     - Hindi and Portuguese packs on mid-range devices (pm-1 device matrix);
     - internal testing, then a closed Play track.
  3. **Plus purchase on Android (Next, v1.3):** Play Billing through Q-008 option (c), or RevenueCat (ADR 0013 fallback), as pm-4 decides.
- **Competitors:**
  - TinyNest, FamilyAlbum, Tinybeans, Qeepsake and BackThen run on Android or web (R, `us.md` 3).
  - Cross-platform family access is table stakes (R, `us.md` 6 item 12).
- **Differentiator:** none by itself. It removes the largest adoption blocker outside the US and the "my partner has Android" objection (I).
- **RICE:** R 1,500, I 2, C 0.5, E 12 = **125**. Judgement keeps it in v1.2 despite the score: it is the gate for pm-1's Hindi and Portuguese markets and pm-2's grandparents.
- **Dependencies:**
  - D-004 entity.
  - Q-008 (pm-4) and the founder's decision 3 wording.
  - T5-17 (web deletion).
  - T5-01 (Play form).
  - pm-1 device performance on Android.
  - Google developer account (founder).
  - T5-15 Play age signals.
- **Legal:**
  - Play deletion policy (V).
  - Data safety form accuracy (LEGAL-REQ-042).
  - Google Play Billing policy for digital goods (U).
  - New platform in the Privacy Policy and subprocessors (Google as platform, not processor; counsel).
  - SQLCipher question reopens for Android (TDD 04 3.8.1).
- **Metric:**
  - Share of families with an Android member (server, k = 10).
  - Android crash-free sessions 99.8% or more.
  - Mixed-platform co-parent invite acceptance vs iOS-only.
- **Size:** XL. **Horizon:** Now for readiness; Next for launch. **Founder decision:** keep v1.1 as decided (free tier only, accepting the Q-008 and entity risks), or v1.2 as recommended.

#### T5-17 Web platform (`apps/web`) and the full web deletion flow
- **Problem and evidence:**
  - ADR 0010: one Next.js app on Vercel in the monorepo, sharing pure-TS packages (F).
  - Three owners need it soon:
    - pm-2's web contribution page (BL-300). ROADMAP 6 has it in v1.1; pm-2 now recommends v1.2, after shared voice and the in-app Family role (FAM-05), pending the founder;
    - pm-3's web reader;
    - the full magic-link web deletion and privacy-choices flow that must ship before Android (F, D-042, BL-310, LEGAL-REQ-030).
  - `apps/web` does not exist (F, TDD 10 risk 10).
  - Security requirements are written: CSP, SRI, no third-party scripts, HSTS, and no analytics on `/i/` and `/auth/` (F, TDD 04 A6, DOMAINS.md 5).
  - Anonymous identities pass every `to authenticated` rule (F, TDD 04 finding 2), so the shell must ship with BL-114's anonymous guards.
- **Job to be done:** When a grandparent has no app, or a parent has lost a phone, I want a safe browser path to read, contribute, export or delete.
- **Solution:**
  - One `apps/web` shell owned here: auth (magic link; contributor gateway from TDD 04 3.4.3 for pm-2), headers and CSP, server components only where needed, error envelope (ADR 0017), the content-free logger, an accessibility CI gate (axe), and pages for `/delete-account`, `/privacy-choices` and `/trust` data.
  - pm-2 and pm-3 build their screens on it.
- **Competitors:** FamilyAlbum (PC browser), Tinybeans, Qeepsake and BackThen have web access (R).
- **Differentiator:** a web surface with no third-party scripts at all (I).
- **RICE:** R 800, I 1, C 0.8, E 3 = **213**.
- **Dependencies:** BL-114 anonymous guards; BL-300 (pm-2); BL-309 server export; website thread and DNS (COORDINATION 7); T5-03 pen test scope adds the web page.
- **Legal:**
  - LEGAL-REQ-030, -010, -035, -051 (WCAG on web), -058 (no non-essential cookies).
  - Washington's "homepage" link duty for the CHD notice applies to every collecting page (Lawyer 2 H2).
- **Metric:**
  - Web deletion requests completed within the 31-day SLA: 100%.
  - Third-party script hosts on any page: 0 (CI).
  - axe critical violations: 0.
- **Size:** L. **Horizon:** Now (v1.1), so the shell and the full deletion flow are in place before pm-2's page (v1.2 recommended) and before Android (D-042). If both slip to v1.2, the shell can move with them, but the deletion flow still lands first.

#### T5-18 iPad layout
- **Problem and evidence:**
  - `app.config.ts`: `supportsTablet: false`, `orientation: 'portrait'` (F), so the iPhone app runs in compatibility mode on iPad.
  - TDD 09 calls iPad layouts beyond a smoke test premature for v1 (F).
  - Read together at bedtime is a plausible iPad moment (I).
  - Apple Journal added an iPad app in iOS 26 (R, `adjacent` A1).
  - TinyNest supports iPad (R).
- **Job to be done:** When we read together at bedtime on the family iPad, I want the book to fill the screen and read like a book.
- **Solution:**
  - Next: `supportsTablet: true` with a readable-width single column for Book, Letter and Read together; landscape for reading only.
  - Capture stays the iPhone layout.
  - Pair with T5-14 for shared-device privacy.
- **Competitors:** Apple Journal, TinyNest (R).
- **Differentiator:** small (I).
- **RICE:** R 600, I 0.5, C 0.5, E 3 = **50**.
- **Dependencies:** design system tokens (BL-255 to BL-271); T5-14; pm-3 Read together design.
- **Legal:** WCAG 1.3.4 orientation (TDD 09); accessibility label re-check (T5-20).
- **Metric:** share of Read together sessions on iPad (device analytics, consenting); iPad crash-free sessions.
- **Size:** M. **Horizon:** Later (Next if pm-3 makes iPad central to reading).

#### T5-19 UI localisation in the 7 launch languages
- **Problem and evidence:**
  - BRIEF decision 6: the app interface stays in English for v1.0 and "must be ready for localisation" (F).
  - About 2,235 lines of copy live in 22 `*.en.ts` files with no i18n library yet (F, measured in `packages/content/src`).
  - Dates and plurals already go through `Intl` (D-028, BL-156).
  - Letter text sets `writingDirection` per language, but there is no app-wide RTL layout (F, `lib/language`).
  - The content bundle already carries `locale` (F, ADR 0016 5.1).
  - BL-321 (Hindi UI, P2) and ROADMAP "Later" list it (F).
  - Competitors localise widely: TinyNest 31 languages including Hindi; FamilyAlbum 8 (R).
  - Grandparents writing in their own language are the core finding outside the US (R, `global.md` 5.2).
  - The constitution and content rules complicate translation (I):
    - "never gender the child" is hard in Spanish, French, Portuguese, Hindi and Arabic, where adjectives and verbs agree with gender;
    - "no em dashes, no curly quotes" needs per-language punctuation rules (Chinese full-width punctuation, Arabic comma);
    - copy must still avoid fear, guilt and loss language in every language.
- **Job to be done:** When my parents open the app to write to their grandchild, I want every button in their language, so they never need me to help.
- **Solution:**
  1. **Now (infra, S to M):**
     - a typed message catalogue per locale in `packages/content` with ICU plurals via `Intl.PluralRules`;
     - a pseudo-locale and long-string CI run;
     - per-language content-rule tests;
     - a "gender-free template" lint for `{child}` sentences;
     - RTL layout audit with `I18nManager`, which needs an app reload: Expo's RTL support settings U, verify.
  2. **Next: Spanish.** It is the largest non-English US group (A) and pm-4 decides markets. Translations by a professional plus a native-speaker parent review, using pm-1's native-speaker programme.
  3. **Later, in pm-4's order (G-20):** French, Arabic with full RTL, Mandarin (Simplified or Traditional per pm-1's script decision), then Portuguese (Brazil or Portugal) and Hindi.

  Legal pages are translated only where counsel says the language of the transaction requires it.
- **Competitors:** TinyNest, FamilyAlbum, Bebememo localise their UI (R).
- **Differentiator:** with spoken-letter languages already native, a localised UI makes the grandparent author path whole (I).
- **RICE:**
  - Full programme: R 700, I 2, C 0.5, E 10 = **70**.
  - Infra plus Spanish: R 300, I 2, C 0.5, E 3 = **100**.
- **Dependencies:** pm-1 (script and dialect decisions, native-speaker reviewers); pm-4 (markets, store listings); content owner; counsel; T5-21 (server content per locale).
- **Legal:**
  - Translated consent and legal text must say the same thing (counsel per language).
  - California Civil Code 1632 may require contract translations when negotiated in Spanish, Chinese and three other languages (U, counsel).
  - The CHD notice must be available where the UI is.
- **Metric:** share of active authors with a non-English UI; consent-screen completion by locale (server acceptances, k = 10); translation-bug reports.
- **Size:** L (full programme XL). **Horizon:** Now (infra), Next (Spanish), Later (the rest).

#### T5-20 Accessibility beyond AA
- **Problem and evidence:**
  - LEGAL-REQ-051 requires WCAG 2.2 AA plus an annual external audit; LEGAL-REQ-052 an accessibility statement (BL-273) (F).
  - The App Store now shows developer-declared accessibility features: VoiceOver, Voice Control, Larger Text, Dark Interface, Differentiate Without Color Alone, Sufficient Contrast, Reduced Motion, Captions, Audio Descriptions (V, Apple support 123073).
  - TDD 09 2.11: a recording without words has no text alternative for deaf family members; Read together's highlight is a synchronised caption (F).
  - Grandparents are first-class readers; letter text is never capped (D-027) (F).
- **Job to be done:** When my father, who has low vision and hearing loss, opens his grandchild's book, I want him to read and follow every letter on his own.
- **Solution:**
  1. **Now:** declare the Accessibility Nutrition Label honestly, only for features verified by the manual script.
  2. **Next:**
     - AAA contrast (7:1) for letter text and reading views;
     - "Captions" through Read together's word highlight and a transcript-first letter view;
     - a plain-language pass on consent and legal summaries (cognitive accessibility);
     - Voice Control label-in-name everywhere (TDD 09 2.1);
     - Switch Control actions for letter actions;
     - an external audit with disabled testers, including an older-adult panel;
     - publish the statement with known gaps.
- **Competitors:** accessibility labels of memory apps were not researched (U).
- **Differentiator:** a book grandparents with disabilities can use alone (I).
- **RICE:** R 300, I 1, C 0.8, E 3 = **80**.
- **Dependencies:** pm-3 (Read together word highlight, pm-1 word timings); design system (BL-255 to BL-271); BL-273.
- **Legal:** ADA Title III and Unruh exposure is treated as yes (CR-070); declared labels are representations (CR-010).
- **Metric:** external audit criticals: 0; label features declared vs verified: equal; accessibility support tickets resolved.
- **Size:** M. **Horizon:** Now (label), Next (beyond AA).

### 2.4 Platform plumbing

#### T5-21 Remote config and server-driven content, matured
- **Problem and evidence:**
  - Two mechanisms exist on paper:
    - D-035 and BL-022 describe an `app_config` Supabase table with an audit trigger and Edge Functions reading kill switches with a 60 s cache;
    - ADR 0016 implements remote config as an Ed25519-signed document served by the `config` Edge Function, published from the founder's machine, with git as the audit log (F).
  - One source must win (I; coordinator).
  - A kill switch reaches an open app within 5 minutes (F, ADR 0016 6).
  - Flags select only between variants App Review has seen. Nothing server-driven may touch the paywall or data collection (F, BRIEF 16; ADR 0016 5.3).
  - There is no staged rollout, no per-version targeting and no preview channel (F, ADR 0016).
  - Supabase's edge caching of Edge Function responses is U. About 33M requests a month at 220k MAU is about $60 (F, E, ADR 0016 6).
  - The key ceremony is a single point of failure (F).
- **Job to be done:** When we change a prompt, a tip or a flag, I want it to reach families safely and be undone in minutes, without an App Store release.
- **Solution:**
  1. **One source:** the signed document is what clients read. Server enforcement reads the same published document (bundled into the functions at deploy), not a second table. Record this in DECISIONS (supersedes the table half of D-035).
  2. **Staged rollout without tracking:** each install draws a random bucket number once, stores it locally, and never sends it. A flag carries `rolloutPct` and `minBuild`/`maxBuild`.
  3. **A preview channel** (TestFlight builds read `preview` documents) and a content lint per locale (T5-19).
  4. **Ops:**
     - a scripted kill-switch drill each release candidate (TDD 06 2.2);
     - a Cloudflare proxy in front of the documents (ADR 0016 3.3);
     - a second signing key held offline for rotation.

  5. **Experiments for pm-4 (G-01) under the same rules:**
     - the phone draws an arm once from a local random number, never from an identity;
     - the arm may travel to the server at sign-in as a closed-list enum, for k = 10 splits in the insights views. It is an L2 configuration value; I ask counsel to confirm the label is unchanged;
     - **price and trial arms are compiled into the binary**: product ids and weights ship in the release that App Review sees, with every arm named in the review notes;
     - remote config may stop a price experiment, but never add, re-weight or change prices. Decision 16 and ADR 0016 5.3 say nothing server-driven touches the paywall.

  Hard rule kept: no key or block may change consent, data collection, paywall or navigation.
- **Competitors:** Airbnb, Lyft and DoorDash server-driven UI lessons (R, `adjacent` A5.4). Lyft's split matches ours.
- **Differentiator:** fast, reversible change with App Review honesty preserved.
- **RICE:** R 2,000, I 1, C 0.8, E 2 = **800**.
- **Dependencies:** BL-022; ADR 0016 publish script; coordinator decision on the D-035 conflict; T5-23 (CDN cost); T5-08 (child-input gate).
- **Legal:** App Review 2.3.1 and 2.5.2 (ADR 0016 5.4); LEGAL-REQ-040 kill-switch clock; LEGAL-REQ-059.
- **Metric:**
  - Kill-switch propagation p95 under 5 minutes in drills.
  - Bad content rollbacks needing an app release: 0.
  - Staged rollouts that caught a problem before 100%.
- **Size:** M. **Horizon:** Now (v1.1).

#### T5-22 Realtime co-parent updates (PRD 7.3)
- **Problem and evidence:**
  - PRD 7.3: "Letter saved on one device visible on a co-parent's online device: p95 5 s, p99 30 s", marked as a release gate (F).
  - The v1.0 sync engine pulls only at start, on foreground, after a save, on pull-to-refresh, after an accepted invite and on a retry timer (F, `lib/sync/engine.ts` header).
  - Supabase Realtime is off for every table (F, SECURITY.md 4).
  - So a co-parent with the app open sees a new letter only after an action. The target is unmet for open apps (F); it is met roughly on next foreground (A).
  - Supabase Realtime costs (V):
    - Pro includes 5M messages a month, then $2.50 per million;
    - a broadcast counts once sent plus once per subscribed client;
    - Pro includes 500 peak connections, then $10 per 1,000.
- **Job to be done:** When my partner records a letter while I am reading the book, I want it to appear, so we feel we are writing it together.
- **Solution:**
  - **Ping, then pull.** After `sync_push_entries` commits, the database sends a content-free Realtime Broadcast ("book changed", nothing else) on a private channel per book. Supabase's Broadcast-from-database function (`realtime.send`) is U: verify it on the project.
  - The channel topic is an opaque random token stored in `book_access`, not the child id: no L3 ids in topics or logs.
  - Channel authorisation goes through Realtime's RLS on `realtime.messages` using the same `book_access` predicate (D-024).
  - The client subscribes only while in the foreground, then runs its normal cursor pull under RLS.
  - Fallback: a 60 s foreground pull timer when the socket is down.
  - Background delivery stays with pm-2's visible family-letter push (BL-196).
  - Amend PRD 7.3 to say "while the app is open; on next open otherwise" (I).
  - Estimated cost at 100k families (E): 2M letters a month times about 2 recipients is about 4M messages, inside the 5M quota. About 11k peak connections is about $105 a month.
- **Competitors:** not researched (U).
- **Differentiator:** "Mama just wrote" moments, with no content on the socket.
- **RICE:** R 800, I 1, C 0.8, E 2 = **320**.
- **Dependencies:** D-023 sync (done); D-024 `book_access`; SECURITY.md checklist change (Realtime on, for one private channel type only); pm-2 BL-196; T5-23 caps.
- **Legal:**
  - Data map row for Realtime (Supabase, same processor).
  - No content or ids in payloads (LEGAL-REQ-014).
  - The label is unchanged (I, confirm with T5-01).
- **Metric:**
  - p95 time from save to visible on an online co-parent device (load-test probe, TDD 06 2.2) of 5 s or less.
  - Realtime messages and peak connections within quota.
- **Size:** M. **Horizon:** Next (v1.2).

#### T5-23 Cost controls at scale
- **Problem and evidence:**
  - TDD 06 4.3 run-rate (E): about $100 to $150 a month at 1k families, $300 to $450 at 10k, $2.3k to $3.1k at 100k. The PowerSync line is now moot after D-023 (F).
  - Model egress is solved by R2 (F, D-046; ADR 0016 3.2: about $0 to $3 vs about $11k on Supabase).
  - PostHog: 1M events a month free; per-product billing limits exist (V).
  - TRACKING_PLAN 5.3 sampling starts at 80% of budget (F).
  - Supabase's Spend Cap blocks further use of capped items until the cycle resets (V). That can stop service for families, which is a trust risk: Realtime, Edge Functions and auth are capped items (V).
  - Money comes only from App Store Connect exports (F, TRACKING_PLAN 0.6).
- **Job to be done:** When the product grows, I want costs to grow slower than families, and never to take the book offline to save money.
- **Solution:**
  1. Billing alerts at 150% of the monthly model in every console (TDD 06 4.3 guardrails).
  2. PostHog billing limit plus remote-config sampling (TRACKING_PLAN 5.3).
  3. **Supabase Spend Cap on during beta; off after launch, with alerts.** A cap that blocks sign-in or sync is worse than an overage (I; founder decision).
  4. A Cloudflare proxy for public documents (T5-21).
  5. A monthly 15-minute cost review in the insights cadence (section 6): cost per weekly keeping family from bills (founder) and ASC proceeds (no keys for the agent).
  6. Kill the server-side dead weight (T5-09).
  7. Watch the new storage lines as they arrive:
     - pm-2's shared voice, about 19 MB per family per month (D-032), and media (FAM-03);
     - Realtime (T5-22).

     Each gets a budget row before it ships.
- **Competitors:** n/a.
- **Differentiator:** keeps the Free tier free forever (Terms 13.3) affordable.
- **RICE:** R 2,000, I 0.5, C 0.8, E 1 = **800**.
- **Dependencies:** T5-09, T5-21, T5-22; BL-319 (monthly cost sheet); founder console access.
- **Legal:** none, except that the Free-forever promise is non-amendable (Lawyer 1 L6). Costs must stay sustainable.
- **Metric:**
  - Infra cost per weekly keeping family per month, trending down.
  - Months over model: 0 unexplained.
  - Service interruptions caused by caps: 0.
- **Size:** S. **Horizon:** Now (launch week).

### 2.5 Support and operations

#### T5-24 Support tooling and help centre
- **Problem and evidence:**
  - "Support does not answer" is 14% of recent one- and two-star reviews in the category (R, `us.md` 9 row 3).
  - TDD 10 7 expects 5 to 15 emails a week at 1k families. It proposes saved replies, in-app Help from `packages/content`, a content-free "Copy diagnostics" button, and Claude-drafted replies the founder approves, never auto-sent and never with letter text pasted in without the user's ask (F).
  - The support mailbox is L4 (F, DATA_CLASSIFICATION 4.8).
  - `hello@` is live; `privacy@` and `security@` are suggested (F, DOMAINS.md 9).
- **Job to be done:** When something goes wrong with my child's letters, I want a real answer quickly, without having to send anyone my letters.
- **Solution:**
  1. A **help centre** written in `packages/content`, rendered natively in Settings > Help and on `/help` (website). It is offline-capable. No third-party widget.
  2. **Copy diagnostics:** app version, model, sync cursor age, queued count, last error codes. Never content, ids or names (TDD 01 ring buffer).
  3. **Saved replies and runbooks** in `docs/ops/support/`, with tags (billing-is-Apple, sign-in, transcription, lost-phone, deletion, safety, Vault-ask).
  4. **A published response target** on /help (for example 2 working days; A) and a weekly tag count into the insights report (counts only).
  5. **Mailbox:** stay in a plain mailbox until volume needs a helpdesk. A helpdesk vendor is a processor holding L4, so it needs a data-map row, a DPA and a no-training clause.
- **Competitors:** complaints concentrate at Chatbooks, Qeepsake, Tinybeans and FamilyAlbum (R).
- **Differentiator:** answered support with no content handover (I).
- **RICE:** R 600, I 1, C 0.8, E 2 = **240**.
- **Dependencies:** content owner; website thread; BL-237 (DSAR log); T5-10, T5-12, T5-13 runbooks; T5-25.
- **Legal:**
  - The support mailbox retention is 2 years (TDD 05 5.7).
  - A Claude-drafted reply is AI processing of support content: covered only if the policy says so, and never with letter text (DATA_CLASSIFICATION 4.8; counsel).
- **Metric:** first response within target: 90% or more; tickets per 1,000 families (by tag); help-article deflection (help opened then no email within 24 h, device, consenting).
- **Size:** M. **Horizon:** Now (v1.1).

#### T5-25 Status page
- **Problem and evidence:**
  - Runbooks already say "post the in-app status line if the platform supports it" (F, restore-drill, TDD 06 RB-3).
  - ADR 0016 announcement blocks can carry it (F).
  - Capture, reading and export work offline, so most outages cost freshness, not data (F, TDD 06 0).
  - Lost content is 17% of complaints (R): people need to hear that their letters are safe during an outage (I).
- **Job to be done:** When sync seems stuck, I want to know quickly that my letters are safe and when it will be fixed.
- **Solution:**
  - An in-app announcement block for incidents ("Your letters are safe on this phone. Syncing will resume.", draft for the content owner).
  - A static `/status` page on earlyletters.com updated by the founder, with a history of incidents.
  - External uptime checks (TDD 06 5.6).
  - No email or SMS subscriber list: it would be a processor with contact data.
- **Competitors:** not researched (U).
- **Differentiator:** calm, honest incident communication (I).
- **RICE:** R 1,000, I 0.5, C 0.5, E 0.5 = **500**.
- **Dependencies:** T5-21 (announcement block publishing); website thread; incident runbooks.
- **Legal:** the holding statement must match counsel-approved incident templates when personal data is involved (incident-notification.md).
- **Metric:** time from detection to status post 30 minutes or less (Sev 1 and 2); incident history complete.
- **Size:** S. **Horizon:** Now (v1.1).

#### T5-26 Analytics self-learning loop (operated)
- **Problem and evidence:**
  - Founder decision 12 asks for agents that regularly read the data, write findings and propose backlog items (F).
  - The engine, runner, server views (k = 10) and weekly prompt exist (F, INSIGHTS_LOOP 1 to 6).
  - What is missing, each a fact:
    - an owner and triage step;
    - classes of proposals by risk;
    - a place in the agent protocol (Q-007);
    - an outcome ledger;
    - a stop rule.
  - Unverified pieces: HogQL function names; custom-role JWT under the current signing-key mode (INSIGHTS_LOOP 4).
  - At beta volume (15 to 25 families) almost every server cell is suppressed (F rule, A volume).
  - pm-1's transcription accuracy feedback joins this pipeline (Q-006).
- **Job to be done:** When the product is used every week, I want to learn what helps families keep letters and what gets in their way, without ever reading their letters.
- **Solution:** section 6 in full: weekly run, human triage, risk classes, outcome ledger, guardrails, and the accuracy-feedback addition (counts per language only, Q-004 counsel path).
- **Competitors:** n/a (internal).
- **Differentiator:** learning from counts alone, k-anonymised. It is publishable on /trust as "how we learn without reading your letters" (I).
- **RICE:** R 2,000, I 1, C 0.5, E 1.5 = **667**.
- **Dependencies:**
  - Q-007 (coordinator).
  - Founder: PostHog query key and insights JWT (INSIGHTS_LOOP 4), the scheduled task.
  - BL-024; migration 20261004300000 applied.
  - Q-004 and Q-005 (counsel).
  - `entries.language` column for language mix (INSIGHTS_LOOP 7).
- **Legal:**
  - Counts only, k = 10, no person-level queries (INSIGHTS_LOOP 5).
  - Any new event or property goes through TRACKING_PLAN 6.5 and counsel.
  - The consent-bias split query needs review (TRACKING_PLAN 1.4).
- **Metric:**
  - Weekly report on time.
  - Triage within 1 working day.
  - Share of accepted proposals that moved their metric at the stated read week.
  - Content-guard trips: 0.
- **Size:** S. **Horizon:** Now (v1.1, starting launch week with a dry run).

### 2.6 New markets

#### T5-28 Privacy programmes for new markets
- **Problem and evidence:**
  - v1 is the US storefront only (F, LEGAL-REQ-058).
  - The EU or UK needs a full GDPR programme: Art. 9 explicit consent, DPIA, Art. 27 representative, transfer mechanism (F, compliance register; pm-4 G-20).
  - India's DPDP duties arrive about May 2027 (F, CR-100).
  - TDD 05 section 11 defers GDPR, UK and DPDP programmes until counsel answers CN-14 (F).
  - pm-4's market order (G-20) puts Canada, Australia and New Zealand next, then the UK, the Gulf and France later.
  - PIPEDA, Quebec Law 25 and Bill 96, and Australia's Privacy Act are U in pm-4's file.
  - Our machinery is already national-baseline: opt-in sensitive data, rights, no sale, minimisation, processor contracts (F, CR-022). Adding a market should be "paperwork, not engineering".
- **Job to be done:** When we open a new country, I want families there to get the same protections and rights, in their law's terms, from day one.
- **Solution:**
  - For each market, before its listing: a counsel memo, Privacy Policy and Terms addenda, and a data-map check for transfers (Supabase us-west-1).
  - The rights flows (export, deletion, correction) already exist.
  - Add whatever the law adds: a GDPR Art. 27 representative, a DPIA, Quebec's privacy officer and French-language duties, or a PDPL guardian-consent review.
  - Prefer a region-agnostic product; add data residency only if a law requires it.
- **Competitors:** FamilyAlbum and BackThen operate in the UK and EU (R); their compliance is not researched (U).
- **Differentiator:** the same no-tracking, no-AI-training promises everywhere.
- **RICE:** R 900, I 1, C 0.5, E 3 = **150** (per market step; pm-4 scores the market itself).
- **Dependencies:** pm-4 G-20 order and timing; D-004 entity; counsel; T5-19 (French for Quebec, Arabic for the Gulf); T5-01 (labels per storefront are the same).
- **Legal:** this item is the legal work. It also covers the email laws (CASL, the Spam Act, PECR), but pm-4 owns sending.
- **Metric:** markets launched with a signed counsel memo: 100%; rights requests from new markets answered within their legal clock.
- **Size:** M per market (GDPR: L). **Horizon:** Next (Canada, Australia and New Zealand memos with pm-4 step 1); Later (UK, EU, Gulf, Brazil, India).

### 2.7 Commerce plumbing (cited from pm-3)

#### T5-27 Print checkout platform and compliance
- **Problem and evidence:**
  - Printed books are a future launch (F, K-32, D-010).
  - pm-3 owns the product, partner, print files, QR and order flow. pm-5 owns the platform plumbing (Q-006, pm-3 reply).
  - Physical goods are bought outside Apple's in-app purchase (App Review 3.1.3(e) per pm-3; U here).
- **Job to be done:** When I order a printed book, I want paying for it to be as safe as the rest of the app.
- **Solution:**
  - A hosted checkout on `apps/web` so no card data touches our pages (minimal PCI scope, A: SAQ A, U).
  - Print-partner DPA and data-map rows; vendor gate (TDD 05 5.9).
  - Print files generated on the device or by a short-lived job and deleted after fulfilment.
  - Shipping addresses as a new Contact Info type on the label (`app-store-privacy-labels.md` 1.2 says print addresses change it).
- **Competitors:** see pm-3.
- **Differentiator:** see pm-3.
- **RICE:** R 100, I 1, C 0.5, E 3 = **17**. The print product value is scored by pm-3.
- **Dependencies:**
  - pm-3 print item; T5-17; T5-01.
  - Founder and counsel: Terms 15 Print Terms text (legal owner), sales tax registration, EU GPSR only if EU sales start.
- **Legal:** payment processor terms, consumer law on physical goods, sales tax, and an address retention rule.
- **Metric:** card data on our systems: none (architecture review); vendor gate green before launch.
- **Size:** M. **Horizon:** Later (follows pm-3's print date).

---

## 3. RICE summary

Sorted by score. Judgement overrides are in the last column.

| Rank | Item | R | I | C | E | RICE | Size | Horizon | Override |
|---|---|---|---|---|---|---|---|---|---|
| 1 | T5-08 Claims and promise guards | 2,000 | 0.5 | 0.8 | 1 | 800 | S | Now | |
| 1 | T5-21 Remote config matured | 2,000 | 1 | 0.8 | 2 | 800 | M | Now | |
| 1 | T5-23 Cost controls | 2,000 | 0.5 | 0.8 | 1 | 800 | S | Now | Quick win, launch week |
| 4 | T5-04 Portability and shutdown pledge | 2,000 | 1 | 0.5 | 1.5 | 667 | S | Now | |
| 4 | T5-26 Insights loop operated | 2,000 | 1 | 0.5 | 1.5 | 667 | S | Now | |
| 6 | T5-01 Privacy label guard | 1,500 | 0.5 | 0.8 | 1 | 600 | S | Now | |
| 7 | T5-25 Status page | 1,000 | 0.5 | 0.5 | 0.5 | 500 | S | Now | Bundled with T5-24 |
| 8 | T5-10 Account recovery | 600 | 2 | 0.8 | 2 | 480 | M | Now | |
| 9 | T5-13 Report a concern | 800 | 1 | 0.8 | 1.5 | 427 | M | Now | Required with contributors (v1.1) |
| 10 | T5-09 Data minimisation | 2,000 | 0.25 | 0.8 | 1 | 400 | S | Now | Quick win |
| 11 | T5-03 Pen test and crypto review | 2,000 | 1 | 0.5 | 3 | 333 | M | Now | Gate before paid marketing (BL-313) |
| 12 | T5-22 Realtime co-parent | 800 | 1 | 0.8 | 2 | 320 | M | Next | Unmet PRD gate |
| 13 | T5-24 Support and help centre | 600 | 1 | 0.8 | 2 | 240 | M | Now | |
| 14 | T5-17 Web platform | 800 | 1 | 0.8 | 3 | 213 | L | Now | Dependency for pm-2, pm-3, Android |
| 15 | T5-11 Passkeys | 600 | 1 | 0.5 | 1.5 | 200 | S | Now/Next | |
| 16 | T5-02 Transparency and security pages | 1,000 | 0.5 | 0.5 | 1.5 | 167 | S | Now/Next | |
| 17 | T5-14 Face ID lock | 400 | 1 | 0.8 | 2 | 160 | M | Next | |
| 18 | T5-28 Privacy programmes for new markets | 900 | 1 | 0.5 | 3 | 150 | M | Next/Later | Timed by pm-4 G-20, not by score |
| 19 | T5-16 Android | 1,500 | 2 | 0.5 | 12 | 125 | XL | Now/Next | Strategic: market gate for pm-1, pm-2 |
| 19 | T5-15 Age signals | 1,500 | 0.25 | 0.5 | 1.5 | 125 | S | Now | Legal date (U) |
| 21 | T5-19 UI localisation (infra plus Spanish) | 300 | 2 | 0.5 | 3 | 100 | L | Now/Next | Full programme scores 70 |
| 22 | T5-20 Accessibility beyond AA | 300 | 1 | 0.8 | 3 | 80 | M | Now/Next | Label declaration is a quick win |
| 23 | T5-18 iPad layout | 600 | 0.5 | 0.5 | 3 | 50 | M | Later | |
| 24 | T5-05 Import from other apps | 150 | 2 | 0.5 | 4 | 38 | M | Later | |
| 25 | T5-07 AI gateway (BL-304) | 200 | 1 | 0.5 | 4 | 25 | L | Later | Trigger: pm-1 evidence |
| 25 | T5-12 Legacy contact in the app | 200 | 1 | 0.5 | 4 | 25 | M | Later | Runbook alone is Now (about 200); kept account is Next for pm-2 |
| 27 | T5-27 Print checkout plumbing | 100 | 1 | 0.5 | 3 | 17 | M | Later | Follows pm-3 |
| 28 | T5-06 Vault mode | 100 | 2 | 0.5 | 8 | 13 | XL | Later | Trigger: demand or counsel |
| 29 | SOC 2 (inside T5-03) | 2,000 | 0.25 | 0.2 | 12 | 8 | XL | Later | Trigger: B2B ask |

---

## 4. Top 10 for v1.1 to v1.3

The order is delivery order, not score order. Items are bundled where they ship as one change.

| # | Item | Release | Why it is here |
|---|---|---|---|
| 1 | **T5-21 Remote config matured** (one signed source, staged rollout, preview channel, drill) | v1.1 | Every later change in every PM file rides on it; it ends the D-035 vs ADR 0016 split |
| 2 | **T5-26 Insights loop operated** (section 6) | v1.1, from launch week | Founder decision 12; built and idle today |
| 3 | **T5-01 plus T5-08 Label and claims guard** | v1.1 | Protects the category's rarest proof (no tracking) and every public promise from drift |
| 4 | **T5-04 Portability and shutdown pledge, with /trust and /security (T5-02 pages)** | v1.1 | Answers the 2026 complaints (lost content, paywalled memories) with a runbook, a reserve and a published format; fixes the broken security.txt Policy link |
| 5 | **T5-17 Web platform and the full web deletion flow** | v1.1 | pm-2's web page (BL-300, now recommended for v1.2), pm-3's reader and Android (D-042) all stand on it; the deletion flow must land first |
| 6 | **T5-13 Report a concern and safety runbooks** | v1.1 | Contributors arrive in v1.1; LEGAL-REQ-056 and the ex-partner threat (TDD 04 A1) |
| 7 | **T5-24 plus T5-25 Support, help centre and status** | v1.1 | 14% of category complaints are unanswered support; incidents need a calm channel |
| 8 | **T5-03 External pen test with a public summary** | v1.1 or v1.2, before paid marketing | BL-313 gate; pm-4's growth plan triggers it |
| 9 | **T5-10 plus T5-11 Sign-in resilience** (ways to sign in, recovery runbook, passkeys) | v1.1 (linking), v1.2 (passkey-first) | Losing an email must not mean losing the book |
| 10 | **T5-22 Realtime co-parent updates** | v1.2 | The only unmet PRD 7.3 gate in this theme |

**Quick wins alongside, too small to rank** (each S, launch week or v1.1): T5-23 cost controls and the Supabase spend-cap decision; T5-09 drop `entries.search`; the T5-20 Accessibility Nutrition Label declaration; the T5-12 fiduciary runbook; T5-15 counsel answer on AB 1043 (possibly 1.0.x).

**Strategic, outside the ten by score but scheduled:**
- **T5-16 Android:** readiness in v1.1, free and co-parent in v1.2, Plus on Android in v1.3 (founder decision against BRIEF decision 9's v1.1).
- **T5-19 UI localisation:** infra in v1.1, Spanish in v1.3.

---

## 5. Will not build

| What | Why |
|---|---|
| End-to-end encryption of letter text in v1.x | Breaks server export, the web reader, support and search parity (TDD 04 3.13). Vault (T5-06) covers audio. Revisit only if counsel requires it for health data. Copy must keep saying "protected by your phone's lock", never "encrypted on your phone" for text (TDD 04 3.8.1) |
| SOC 2 for the consumer product | Scores 8; Supabase's report does not transfer (V); a pen test buys more trust per dollar. Trigger is a written B2B requirement only |
| Paid bug bounty before two clean pen tests | Noise and cost for a one-person team; a disclosure policy (T5-02) is enough |
| Warrant canary | Legally untested; a transparency report says what we can say (counsel) |
| Certificate pinning | A pinning mistake bricks sync for every family (TDD 04 3.8.2) |
| Full server-driven UI, or remote config that touches consent, data collection, paywall or navigation | App Review 2.3.1 and 2.5.2; accessibility; decision 16 (ADR 0016 5.3, 5.4) |
| Feature flags or experiments through PostHog | Decliners would get a different product; consent must change nothing (D-035; TRACKING_PLAN 1.3 "Consent cost") |
| Session replay, heatmaps, IDFA, ATT, attribution or ad SDKs | ADR 0008; LEGAL-REQ-016; the label (T5-01) |
| Joining analytics ids to accounts, person-level queries, cohort exports, or selling or sharing "anonymised" aggregates | TRACKING_PLAN 0; INSIGHTS_LOOP 5. FamilyAlbum's summary says it does not sell even anonymised statistics; we match that and say so |
| An insights agent that edits `BACKLOG.md`, code, migrations or the catalogue, merges anything, runs SQL on production, or tunes its own rules | Section 6.5 guardrails; ADR 0011; D-041 |
| Inactivity deletion of accounts or books | Contradicts the 18-year keepsake and the pledge (T5-04); Google's 2-year rule is the anti-pattern (R) |
| Synthetic voice, voice cloning, voiceprints or speaker identification, including "accessibility" text-to-speech in a family member's voice | Ethical lines (R, `adjacent` A2); LEGAL-REQ-019; pm-1's rule, enforced in T5-08 |
| Machine translation of a person's letters | It would add words they did not say (constitution: "may never add meaning"). UI localisation (T5-19) translates only our words |
| A memorial mode or anything framed around an author's death | Content rule "never endings"; ethical line 6 (R) |
| A third-party support chat widget or SDK in the app | A new processor holding L4 and a label line; email plus native help is enough (T5-24) |
| Email or SMS subscriptions on the status page | A new processor with contact data for little value (T5-25) |
| Multi-region, read replicas, a hosted KMS, or App Attest before their triggers | TDD 06 0 and TDD 04 3.13 triggers |
| Full account switching (two signed-in accounts on one phone) in v1.x | pm-2 FAM-08 scores it 4. Guest author (pm-2) and the handed-down-phone flow (T5-14) cover the real cases |
| A staff admin console that shows letter content | TDD 04 3.10: runbooks only, audited |

---

## 6. Operating cadence for the insights loop

### 6.1 Who

| Role | Who | Does |
|---|---|---|
| Insights agent | A scheduled Claude Code run (fresh session each week) using the INSIGHTS_LOOP section 6 prompt | Runs `npm run insights`, writes `docs/insights/YYYY-MM-DD.md` and at most 3 proposals in `docs/backlog/proposals/` |
| Triager | The PM lead on duty for this theme: an interactive session with the founder, or a pm-5 subagent the coordinator spawns | Accepts, declines or parks each proposal within 1 working day; keeps the outcome ledger |
| Coordinator | Main build-thread session | Turns accepted proposals into `docs/BACKLOG.md` tasks; records DECISIONS for amber and red classes; commits |
| Founder | Saurabh | Holds the read-only keys and the schedule; approves red-class proposals; 15 minutes on Monday |
| Analytics owner | Analytics agent role | Changes to TRACKING_PLAN, the catalogue or the views; never on the agent's own say-so |
| Counsel | Outside | Any new event, property, language use (Q-004) or label effect (Q-005) |

### 6.2 When (times in America/Los_Angeles; the engine uses complete UTC weeks starting Monday, INSIGHTS_LOOP 3)

| Cadence | When | What |
|---|---|---|
| Beta (C1, from about 19 Oct) | Mondays | `--dry-run` only, to prove the plumbing; real cells would be suppressed at 15 to 25 families (k = 10) |
| Weekly | Monday about 07:45 | Insights agent run (the previous Monday-to-Sunday UTC week is complete by then) |
| Weekly | Monday or Tuesday, within 1 working day | Triage: about 2 minutes per proposal |
| Weekly | Same day as triage | Coordinator adds accepted tasks to `BACKLOG.md` in the next wave |
| Monthly | First Monday | Loop health (section 6.6); cost review (T5-23); follow-ups due this month |
| Quarterly | First Monday of Jan, Apr, Jul, Oct | Thresholds in TRACKING_PLAN 1.2 and 1.3; rule weights; retire stale rules; consent-bias split (TRACKING_PLAN 1.4) |
| Twice yearly | May and November | Numbers for the transparency report (T5-02); loop description refreshed on /trust |

### 6.3 How a proposal becomes a backlog item

Each proposal has a risk class:
- **Green:**
  - copy, prompts, tips, help articles;
  - server content inside ADR 0016's block vocabulary;
  - docs.
- **Amber:**
  - product behaviour and performance;
  - reliability, sync and pack fixes.
- **Red** (anything touching):
  - consent or data collection, the analytics catalogue or events;
  - Plus, the paywall or prices;
  - notification frequency, child data or legal text;
  - the 18+ gate or the constitution.

Triage takes one of five outcomes:

| Outcome | Rule | Written where |
|---|---|---|
| Accept (green) | Triager decides alone | Proposal `Status: accepted`; coordinator adds a BL task with `Source: proposal <id>`, `Status: ready`; signed content changes still go through `scripts/packs/publish.ts` with the founder's OK (COORDINATION 6) |
| Accept (amber) | Triager decides; coordinator schedules | As above, `Status: ready` or `needs-decision` if it conflicts with another owner (then a DEBATES entry) |
| Accept (red) | Founder decides; counsel if data or legal | DECISIONS entry first, then the BL task. A proposal that weakens the constitution or a promise is declined, not escalated |
| Decline | Reason in one line | Proposal `Status: declined (reason)`; the agent skips the same id for 8 weeks (INSIGHTS_LOOP 6 step 3) |
| Park | Needs more weeks of data | `Status: parked until <report date>` |

Every accepted task names the metric, the target and the report week to read it, copied from the proposal. The agent lists "follow-ups due" at the top of the report that week.

### 6.4 Fit with the agent coordination protocol

1. **Claim.** The insights agent adds a claim line to `docs/agents/BOARD.md` at the start of each run, for example `insights-weekly 2027-01-11 | docs/insights/2027-01-11.md, docs/backlog/proposals/2027-01-11-* | <start UTC> | active`. It posts at most 3 check-in lines and marks the claim `done (PR #n)` at the end.
2. **Hand-over.** It pushes one docs-only branch, `docs/insights-YYYY-MM-DD`, and opens a draft PR, never merging. This is the ADR 0011 scheduled-run pattern and needs the one-line exception proposed in Q-007, because COORDINATION 6 says agents never push. If the coordinator chooses Q-007 option (b), the agent writes files only and the coordinator commits them in the next wave.
3. **Single source of truth.** Proposals live in `docs/backlog/proposals/` and never in `BACKLOG.md` until the coordinator merges them (COORDINATION 5: backlog owned by PM leads, merged by the coordinator).
4. **Debate.** If an accepted proposal touches another owner's area, the triager opens a DEBATES entry and messages that owner (COORDINATION 4). The insights agent itself never debates.
5. **Fences.** Same fence as other unattended runs (D-041; BACKLOG rule 9): paths limited to `docs/insights/**` and `docs/backlog/proposals/**`.
6. **Cross-thread.** The coordinator mirrors a one-paragraph monthly loop summary into the claude.ai Project doc `claude/Early-Letters-Coordination.md` (COORDINATION 7).

### 6.5 Guardrails

1. **Counts only.** k = 10 in the database, in every HogQL query and in the engine. A suppressed cell is unknown, never zero (INSIGHTS_LOOP 3, 5).
2. **Content guard.** If anything shaped like content appears, the agent stops with "content guard". The loop then pauses until the founder and the analytics owner review it, and the event counts as a Sev 1 privacy incident (TDD 06 2.3).
3. **Read-only credentials:**
   - a PostHog personal key with Query Read only;
   - the `insights_reader` role.
   - No production SQL, no person queries, no exports (INSIGHTS_LOOP 4, 5).
4. **Honest numbers.** Device numbers are labelled "among consenting users" and never divided by server totals (TRACKING_PLAN 1.4).
5. **No dark patterns.** The agent may never propose:
   - more asks, streaks, counts of gaps, or pressure to pay;
   - more notifications, or collecting beyond the catalogue.

   A need for new data becomes a TRACKING_PLAN change request for the analytics owner and counsel (INSIGHTS_LOOP 6 step 6).
6. **Noise control:**
   - at most 3 proposals a week;
   - low-confidence items only if repeated in two reports;
   - anomalies are always low confidence;
   - no proposal from a cell under k.
7. **No self-modification.** The agent never edits the engine, thresholds or its own prompt. Rule and weight changes are normal PRs after the quarterly review.
8. **Founder time cap.** If 4 consecutive weekly reports produce no accepted proposal, the run moves to fortnightly until volume grows. If triage misses 2 weeks running, the coordinator flags it on the board.

### 6.6 How the loop learns (outcome ledger)

The triager keeps a small table, proposed path `docs/insights/OUTCOMES.md` (not created by this file), with one row per accepted proposal:
- id;
- release that shipped it;
- metric, target and read week;
- result: moved, not moved, inconclusive or suppressed.

Monthly loop health from that table:
- acceptance rate;
- median days from report to triage;
- share of shipped proposals that moved their metric;
- false-alarm rate: anomalies that reverted within 2 weeks;
- content-guard trips, which must be 0.

At the quarterly review the triager proposes impact-weight changes for rules whose proposals keep failing, or keep winning, as a normal PR to `packages/analytics/src/insights/`. That is the "self-learning": it is human-reviewed by design.

**Expected timeline (A):**
- the first actionable proposals arrive after about 4 complete weeks with 10 or more families per cell, roughly 300 or more active families;
- before then, the weekly run mainly checks the plumbing and the follow-up list.

**Addition from pm-1 (accuracy feedback, CVL-05):**
- per-language quality joins the report as rates from pm-1's weekly `language_quality_week` event, only where 20 or more consenting authors use that language (k = 20, as pm-1 asks; smaller languages merge into `other`);
- the path decision is in section 7.1;
- any event change goes through TRACKING_PLAN 6.5 and counsel.

---

## 7. Requests, decisions and open questions

**Founder decisions (in order of urgency):**
1. **AB 1043 and Texas SB 2420 (T5-15).** Ask counsel in November 2026 whether a 1.0.x release is needed before 1 Jan 2027.
2. **Supabase Spend Cap after launch (T5-23).** Recommended: on in beta; off after launch, with alerts.
3. **Android timing (T5-16).** Keep v1.1 (BRIEF decision 9; free tier only) or move to v1.2 to v1.3 as recommended. Either way the LLC comes first (D-004 point 3), and Q-008 (pm-4) decides Plus across platforms.
4. **Wind-down reserve size and form (T5-04).**
5. **Pen-test budget and date (T5-03),** tied to pm-4's first paid marketing.

**Coordinator:**
1. **Remote config.** Choose the signed document as the one source and record a DECISIONS entry superseding the table half of D-035 (T5-21).
2. **Q-007.** Insights agent hand-over (section 6.4).
3. **Q-006.** Mark converged. pm-1, pm-2, pm-3 and pm-4 replied in agreement, adding lines.

**Other owners:**
- **Analytics owner:** amend INSIGHTS_LOOP section 6 per Q-007; add the outcome ledger and the follow-ups section to the report template.
- **Legal owner and counsel:**
  - CN-9 wording for the transparency report;
  - the RUFADAA designation tool (CR-018);
  - CSAM reporting applicability;
  - Civil Code 1632 for translated UI;
  - the "Purchases" label effect of Q-008;
  - the staff-access sentence in Privacy Policy section 7 until pgaudit exists.
- **Website thread:** `/trust`, `/security`, `/status`, `/help`. Remove the `Policy` line from `security.txt` until `/security` is live (DOMAINS.md 8).
- **pm-2:** shared voice should default to Standard (escrow). Vault (T5-06) needs parent-device grants (TDD 04 3.6.2).
- **pm-3:**
  - QR links resolve only through earlyletters.com (T5-04);
  - the published export schema follows semver;
  - search stays on the device so `entries.search` can be dropped (T5-09).
- **pm-1:** decide whether word timings must sync to other devices (T5-09); provide the language accuracy evidence that would trigger T5-07.
- **pm-4:**
  - Q-008 classification as L3 and its label check (my reply in DEBATES);
  - the paid-marketing date that gates T5-03;
  - G-01 arms follow the T5-21 rules: a local draw, a closed enum at sign-in, and price arms compiled into the binary. The `experiment_arms` column needs a migration range from the coordinator;
  - the G-20 market order drives T5-28.
- **Counsel batch from pm-4, routed through pm-5:**
  - Q-003 (subscription emails), needed by about 20 Nov 2026 for G-12;
  - G-01 arm values as L2 and the label;
  - G-10 recording consent for shower guests (California Penal Code 632);
  - G-13 account-anniversary email classification;
  - G-14 the CAN-SPAM reading of share-sheet messages.

### 7.1 Answers to pm-1's asks (`01-capture-voice-languages.md` section 7)

| pm-1 ask | pm-5 answer (I; counsel where marked) |
|---|---|
| CVL-05: per-language quality through `language_quality_week` or a k-anonymised server path | **Use the opt-in analytics event.** One per language per week, buckets only, `lang` from the closed list, k = 20 in HogQL and in the engine. The "How did we hear you?" answer is a bucket count on the same weekly event, never a per-letter event, which would tie its timing to a save (TRACKING_PLAN 6.4). A separate server pipe would still need consent, and it would see a JWT and an IP, which is more linked than PostHog with a random id and IP discard. This extends Q-004, so counsel decides. If counsel says no, keep the off-product corpus and drop the per-language split |
| `transcription_completed.model = hindi_small` reveals Hindi on a capture event | Agreed: it is a language proxy that TRACKING_PLAN 6.2 forbids. **Request to the analytics owner:** replace `model` with `model_tier` (compact, standard, large) on capture and transcription events. Exact model ids stay only on `pack_download`, where `lang` is already allowed. Alternatively, put it in the Q-004 counsel batch |
| `LANG` and `SPEECH_MODEL` values for Hindi-English | Fine as one more closed value on `language_set` and `pack_download` only, in the same Q-004 batch |
| `capture_started.source` values `widget`, `shortcut`, `control` | Approved: L2 enums; TRACKING_PLAN 6.5 process |
| A `prompt_skipped` event | Approved with `prompt_kind` only. No prompt id, and no age band: a band reveals the child's age range (TRACKING_PLAN 6.2, 6.4) |
| CVL-16 "My language isn't here" counter | **Not analytics.** It is a message the person chooses to send us: a `request_language(code)` RPC increments `language_requests(week, lang, count)` and stores no person id. Published only at 10 or more through an `insights` view; disclosed as "requests you send us" (counsel to confirm it needs no analytics consent). Codes come from pm-1's closed list of about 40; no free text |
| Denylist entries for speech synthesis and face APIs | In T5-08 |
| Counsel items routed through pm-5 | Added to the counsel batch: Hinglish fine-tune training-data terms; the COPPA opinion on parent-only "sounds" (CVL-19, T5-08); a non-user's imported voice note (CVL-12); CVL-05 vs Q-004; no-synthetic-voice wording (CVL-04); whether CVL-02 reviewers are processors |

### 7.2 Answers to pm-3 (`03-book-keepsakes.md` sections 3 and 9)

| pm-3 item | pm-5 answer |
|---|---|
| BK-10 Save keepsakes to Apple Photos: "no privacy-label change [A, pm-5 confirms]" | Confirmed (I). Nothing reaches our servers, so it is not "collected" in Apple's sense (`app-store-privacy-labels.md` 0). It needs an add-only photo permission string in our voice (labels doc 4); counsel sees the string, not a label change |
| BK-12 web reader on the `apps/web` shell | T5-17 provides auth, CSP, no third-party scripts and the content-free logger; the reader inherits the pen-test scope (T5-03) |
| BK-14 hosted checkout, DPA, physical address on the label | T5-27; the label gains Contact Info, Physical Address, Linked, App Functionality when print ships (T5-01) |
| BK-15 QR resolver, domain and link lifetime | T5-04: resolver on earlyletters.com, static-servable after a shutdown, with the domain renewed far ahead |
| BK-17 split exports; the server export follows the same rule | BL-309 (inside T5-04) adopts the per-child-year rule and the `format_version` semver |
| BK-09 drop `entries.search` | T5-09, Now |

### 7.3 Open questions (U)

- Expo's RTL configuration for an app-wide Arabic layout.
- Whether Supabase Realtime private channels log topic names. That is why the topic is an opaque token.
- Google Play age-signal API.
- Whether Supabase's edge caches Edge Function responses (ADR 0016 6).

---

## Sources

**Repo (F), read 3 Oct 2026:**
- `CLAUDE.md`; `docs/agents/BRIEF-2026-10-03.md`, `COORDINATION.md`, `BOARD.md`, `DEBATES.md` (Q-001 to Q-008);
- `docs/DECISIONS.md`; `docs/ROADMAP.md` 2.0; `docs/BACKLOG.md`; `docs/prd/PRD.md` 7.3;
- `docs/legal/memos/lawyer-1.md`, `lawyer-2.md`; `docs/legal/ENGINEERING_REQUIREMENTS.md`, `privacy-policy.md`, `terms-of-service.md`, `app-store-privacy-labels.md`, `DATA_CLASSIFICATION.md` (4.9, 6), `DELETION_AND_EXPORT_SPEC.md`, `compliance-register.md`, `data-policy.md`;
- `docs/tdd/04`, `05`, `06`, `09` (grep), `10`;
- `docs/ops/SECURITY.md`, `DOMAINS.md`, `README.md`, `AUTH_SETUP.md`, `APP_SIZE.md`, `runbooks/*`, `well-known/security.txt`;
- `docs/adr/0010`, `0011`, `0016`, `0017`;
- `docs/analytics/INSIGHTS_LOOP.md`, `TRACKING_PLAN.md`;
- `docs/research/competitors/us.md`, `global.md`, `adjacent-and-ux-benchmarks.md`;
- code: `apps/mobile/src/lib/sync/engine.ts`, `apps/mobile/src/lib/export/build.logic.ts`, `apps/mobile/app.config.ts`, `packages/content/src/*.en.ts` (line count).

**External (V), opened 3 Oct 2026:**
- Apple, "About the accessibility information shown for apps in the App Store": https://support.apple.com/123073
- Apple, "Data that a Legacy Contact can access": https://support.apple.com/en-ng/103128
- Supabase, "Manage Realtime Messages usage": https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages
- Supabase, "Manage Realtime Peak Connections usage": https://supabase.com/docs/guides/platform/manage-your-usage/realtime-peak-connections
- Supabase, "Cost control" (Spend Cap): https://supabase.com/docs/guides/platform/cost-control
- Supabase, "SOC 2 Compliance and Supabase": https://supabase.com/docs/guides/security/soc-2-compliance
- PostHog pricing (1M free events; billing limits): https://posthog.com/pricing
- Google Play, "Understanding Google Play's app account deletion requirements": https://support.google.com/googleplay/android-developer/answer/13327111
- Drata, "SOC 2 audit cost": https://drata.com/blog/soc-2-audit-cost

**Search results only, not opened (U):**
- Apple Legacy Contact setup guides;
- Day One newsroom and FAQ;
- Texas SB 2420 and California AB 1043 status (via Lawyer 1).

## Changelog

| Version | Date | Change |
|---|---|---|
| Draft 1 | 2026-10-03 | First version: 28 items with RICE, top 10, will-not-build list, insights loop cadence; Q-006 ownership, Q-007 and Q-008 reply filed in DEBATES |
