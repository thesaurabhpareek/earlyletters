# Early Letters: Launch PRD (integrated)

Owner: lead PM. Version 1.4, 4 Oct 2026 (1.4 applies the founder's 4 Oct pricing decision, D-051, and the early-tester offer-code intent, D-052; see the changelog and K-44, K-45; version 1.3 follows). Status: integrated draft; founder decisions of 1, 2 and 3 Oct applied (section 4); TDD 01 to 10 findings folded in (section 3.0 release tiers, K-34 to K-43); remaining founder questions in section 9 and `docs/DECISIONS.md`.
Codename `scribe`. Public name and publisher identity from `packages/brand` only.

Companion documents (1.3): `docs/DECISIONS.md` (dated decision log, D-###), `docs/ROADMAP.md` (milestones to App Store submission, target **Mon 11 Jan 2027**), `docs/BACKLOG.md` (tasks BL-###), `docs/adr/0013-apple-native-subscriptions.md`, `docs/tdd/01` to `10` (technical designs; TDD 10 is the red-team critique).

This is the single launch PRD. It does not repeat the section drafts; it links them, indexes every requirement, and records how every contradiction between them was resolved. Where this file and a section draft disagree, **this file wins** until the founder changes it. Where the legal drafts and this file disagree on a legal duty, the legal drafts win and the conflict goes in section 5.

| Appendix | File | Scope |
|---|---|---|
| A | [A-entry-and-auth.md](A-entry-and-auth.md) | Splash, story intro, account after the first letter, sign-in methods, magic links, "I was invited", offline entry |
| B | [B-first-run-and-family.md](B-first-run-and-family.md) | First-run profile, children, goals, dictionary, invites, web contribution page, approvals, leaving and removal, visibility, themes |
| C | [C-habits-pricing-settings.md](C-habits-pricing-settings.md) | Reminders, celebrations, settings, Plus pricing, trial and notices, lapse, funnel analytics |

Other inputs (all read for this integration): `docs/legal/*` (Terms 1.1.0, Subscription terms, in-app disclosures, Privacy Policy, privacy labels, subprocessors, compliance register, POLICY_VERSIONING, ENGINEERING_REQUIREMENTS, data-policy, DELETION_AND_EXPORT_SPEC), `docs/research/USER_RESEARCH.md` (**UR**), `COMPETITIVE_RESEARCH.md` (**CR**), `docs/design/*`, `docs/ARCHITECTURE.md` (**ARCH**), `docs/adr/*`, `packages/content` (strings, VOICE, BRAND, rules test). `docs/legal/DATA_CLASSIFICATION.md` is being written in parallel; section 7.10 sets the levels it must use.

---

## 1. Executive summary

Early Letters is a baby memory book families fill by talking. A parent speaks for a minute, the phone transcribes it, fixes only mechanical slips (never meaning), keeps the voice, and files the letter by the child's month of age. Co-parents and grandparents write too; parents choose what goes in the book.

**Launch shape (founder decisions, 1 and 2 Oct 2026; second set of 2 Oct applied in 1.2; 3 Oct applied in 1.3):**
- **US App Store first.** iOS only at launch; every pattern must port to Android unchanged (one Expo codebase). US storefront only (LEGAL-REQ-058). The web contribution page moves to v1.1 (K-35); when it ships it stays reachable worldwide for invited family.
- **Family in the app at launch (founder, 3 Oct).** Co-parent and Family (contributor) roles ship in v1.0 inside the iOS app: invites, approvals, per-child sharing. Family members install the free app (K-35, D-002).
- **Plus at launch, through Apple only (founder, 3 Oct).** Sold, managed, cancelled and refunded only through the App Store; StoreKit 2 direct with App Store Server Notifications V2, no third-party billing service (K-34, ADR 0013, D-001).
- **Individual publisher (founder, 3 Oct).** Published under the founder's personal Apple Developer account; no LLC for now. The founder's legal name is the App Store seller and the provider named in the legal documents (K-36, D-004).
- **Target App Store submission: Monday 11 January 2027** (`docs/ROADMAP.md`).
- **Membership, 2 free letters (founder, 4 Oct; D-051).** ~~Free forever core: write, read, play back recordings, export, family authors.~~ Plus is no longer optional and "free, always" is no longer the promise. The free version is the first **2 letters per account** (a letter is a saved entry, spoken or typed); after those, adding new letters needs Plus. Letters already made always stay readable, playable and exportable, and every backup already made stays stored and downloadable, if someone never subscribes or Plus ends. One membership covers the book; family authors add letters without their own. Open edges are listed in D-051 and section 9 Q19 (PRD-REQ-024 to -026).
- **Multiple children (amended 4 Oct, D-051: what a second child's book gets without Plus is an open edge; the first-book-free wording below is under review):** each child has their own profile and book, managed separately (own settings, own family list). The first book you start is free; **additional children are part of Plus** (K-12, K-28). Every child added together in first run (twins or more) stays free, and a book you joined as a co-parent does not count as your free book (PRD-REQ-015).
- **Full product analytics**, opt-in per Apple 5.1.1(ii) and content-free (K-01).
- **Plus (the membership):** $3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial (unchanged by D-051). Lifetime at about $99.99 later (P2). Read together is free for 3 sessions, then Plus (decided; the count is a remote-config value, PRD-REQ-020; interplay with the 2 free letters is open, D-051). Apple offer codes may give early testers free months (D-052, PRD-REQ-027).
- **Beta product** with light, standard "it can make mistakes" disclosures (section 5, K-13 and K-14). The beta ends only when the founder says so; no date or metric ends it, and the label and disclosures stay until then. Recommended in 1.3 (D-030, needs founder OK): the pre-launch beta runs on TestFlight and the v1.0 store listing carries no beta line (App Review 2.2); the in-app About label and Terms 16.4 stay (K-37).
- **Adults only (18+).** An 18+ entry gate comes before first run; under 18 sees a stop screen and cannot use the app at all, not even on the phone alone (K-07, PRD-REQ-019).
- **Digital only.** v1 has export and the PDF book; printed books are a future launch and are not promised in product, store or legal copy (K-32).
- **Data classification:** L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted (encryption required). Section 7.10.

**What this integration changed** (full reasons in section 5):
1. Analytics and crash reporting are **opt-in**, asked after the first letter (Apple 5.1.1(ii)).
2. One permission or consent ask per session after the first letter, in a fixed order: Keep the book, then reminders, then analytics.
3. Default reminders are **a few evenings a week**; every "daily" string is gone.
4. California ARL notice schedule: annual renewal at **30 and 7 days**; annual-plan trial at **18 and 3 days**; monthly trial at **7 and 3 days**.
5. **90-day** shutdown notice everywhere.
6. Safety tiers stay **on the device**; the server `safety_events` table is dropped.
7. **18+ entry gate** before first run (1.2: moved from account creation; no local-only mode for under-18) and on the web page, with Apple Declared Age Range for Texas.
8. **Anonymous sessions on the web contribution page only**, never in the app.
9. Raw transcripts and machine edits are **author-only**.
10. Nobody deletes another person's words; the Privacy Policy line that says parents can "delete everything in their child's book" must change.
11. Read together after 3 sessions is **Plus** (decided 2 Oct, remote config). Additional children's books are **Plus by founder decision**; Plus is held per account and covers every book its holder parents, because Apple allows only one active subscription per group (K-12, K-28). Children added together in first run stay free and joined books do not count (decided 2 Oct, PRD-REQ-015).
12. Child-directed store copy and the "kids" keyword are removed; child-voice features sit behind a counsel flag.
13. The beta label lives in Settings > Help and Legal > About and the store description only.
14. Product analytics are a full, typed, content-free catalogue owned by the analytics engineer, sent only after opt-in; business totals come from server aggregates (K-01, PRD-REQ-016 to PRD-REQ-018).
15. Revisions to B and C that version 1.0 listed as done had not been written; they are applied in 1.1 (K-30).
16. (1.2) Founder decisions of 2 Oct applied: twins, joined books, Read together, beta end, 18+ only, digital only, analytics volume (section 4). Lawyer 2's nine remaining privacy claims fixed in `packages/content` (K-21, section 8).
17. (1.3) Founder decisions of 3 Oct applied: Plus in v1.0 through Apple only (K-34), family contributors in the app at v1.0 with the web page in v1.1 (K-35), full opt-in analytics confirmed, individual publisher (K-36). TDD 01 to 10 findings resolved or recommended (K-37 to K-43, `docs/DECISIONS.md`); requirements re-tiered into v1.0 gate, v1.1 and later (section 3.0); notice windows replaced (K-38); RevenueCat removed everywhere.
18. (1.4) Founder decisions of 4 Oct applied: Plus is membership with 2 free letters per account, existing letters always stay open, one membership covers the book (D-051, K-44, PRD-REQ-024 to -026; PRD-REQ-015, -020, -022 and the "free, always" promise amended); early-tester free months through Apple offer codes, not our own code system (D-052, K-45, PRD-REQ-027).

---

## 2. Scope

### 2.1 In scope for launch (P0 unless noted)
| Area | What ships | Appendix |
|---|---|---|
| Entry | Branded splash, one welcome screen (4-story intro in v1.1, D-043), first letter before account, Keep the book sheet, Sign in with Apple and email (Google in v1.1, D-044), magic link plus code, invites by link or code, offline entry | A |
| Consent | Terms acceptance record, 18+ entry gate before first run (stop screen, no local-only mode), sensitive-data consent (enforced server-side, BL-114), analytics opt-in. AI-processing consent and the web contributor notice ship with their features in v1.1 | A, legal |
| First run | Child name plus birthday or due date, signature, languages and Hindi script, goals, dictionary from names | B |
| Capture | Speak or type, on-device transcription, faithful edits with diff, one-time "it can make mistakes" card, save offline | ARCH, core, legal *Amended 4 Oct 2026 (D-051): saving a new letter beyond the first 2 per account needs Plus; an in-progress letter is never discarded (PRD-REQ-024, -025).* |
| Family | Co-parent and Family roles **in the app**, invites by link or code (one child each), approvals, leave and remove with letter retention, visibility model, private by default; family-letter push without content. Web contribution page in v1.1 (K-35) | B |
| Shared voice (pending D-032) | Recordings of letters in a shared book upload encrypted so every member can play them (Free); every recording for Plus. If not approved by 23 Oct, family letters are text-only in v1.0 (K-40) | PRD |
| Book | Month chapters, Before You, Read together (3 free sessions, then Plus; remote config), quiet milestones, birthdays and month-age notes; PDF book in export (no print) | B, C |
| Children | One profile and book per child; child switcher; per-child settings; per-child family list; second and later child's book through Plus (children added together in first run free; joined books do not count) | B, C, PRD *Amended 4 Oct 2026 (D-051): the free-book rules in this row are under review; see open edges.* |
| Analytics | Opt-in consent sheet, typed content-free event catalogue, server-side business aggregates, withdrawal in Settings > Privacy | C, analytics |
| Habit | Primed notification permission after the first letter, a few evenings a week default, smart quiet window, back-off (P1) | C |
| Plus | Monthly and annual App Store subscriptions (StoreKit 2 direct, ADR 0013), per-account entitlement inherited by books, paywall disclosures, notices (K-38 windows), grace, lapse, restore, refunds through Apple | C, ADR 0013 *Amended 4 Oct 2026 (D-051, D-052): Plus is the membership that unlocks new letters after the 2 free per account; letter gate, never-discard rule and Redeem a code row (PRD-REQ-024 to -027).* |
| Data | Export everything (free, offline), Recently deleted with 30-day undo, delete book, delete account (in-app and web), deletion SLA | C, legal *Amended 4 Oct 2026 (D-051): export of letters already made is never gated and needs no Plus; "free" is not a promise on new letters.* |
| Settings | All controls within 2 taps, Privacy consents list, Legal list, About with beta label | C, legal |
| Store | US-only listing, adult-facing metadata, privacy labels and manifest generated from the data map | legal |

### 2.2 Out of scope for launch
Android build (specified, not shipped); lifetime purchase; printed books and print credit (future launch, v1 is digital only, K-32); web gift codes; gift a year of Plus (P1); sealed letters (P1); sibling letters and any child-input feature (flagged, counsel); Hindi app UI (P2); passkeys, SMS, passwords; child accounts; EU, UK, India, Canada storefronts; server-side LLM edit pass (not on at launch per Privacy Policy section 4).

Moved out of v1.0 in 1.3 (each with its decision; full list in section 3.0): web contribution page and anonymous web identity (K-35, v1.1); Google sign-in (D-044, v1.1); 4-story intro (D-043, v1.1); server transcription and the AI gateway (v1.1; nothing leaves the phone for AI in v1.0); Vault mode, per-child keys, member key grants and the synchronizable Keychain module (ADR 0006 parts, later); the safety classifier unless a clinician signs off by 20 Nov (D-034); load test at 2x the 100k targets (before 25k families).

### 2.3 Launch gates
1. Every item in the launch acceptance checklist (section 6) passes.
2. Every P0 LEGAL-REQ and DATA-REQ passes (they are launch blockers by their own terms).
3. Counsel has reviewed the Terms, Privacy Policy, Subscription terms, in-app disclosures and the claims registry.
4. `packages/brand` holds the real domain and support email (universal links, SMTP and the Apple Services ID depend on them; BL-100). The publisher is the founder as an individual (K-36): the legal name is entered in the published legal documents and App Store Connect, never in code, where `publisher.legalName` stays a TODO placeholder. No LLC or D-U-N-S is required for launch (D-005).
5. The beta label stays until the founder ends the beta; ending it is a release that changes Terms 16.4, About and any store line together (K-13; store placement per K-37).
6. (1.3) Every v1.0-gate requirement in section 3.0 passes; v1.1 requirements do not block v1.0 but their LEGAL-REQ bind the day their feature ships.

---

## 3. Unified requirement index

Priority: **P0** launch blocker, **P1** launch target or launch quarter, **P2** later. "Rev" marks a requirement revised by the conflict log (section 5) with the entry number. Full text and acceptance criteria live in the appendix named by the ID prefix.

### 3.0 Release tiers (1.3)

TDD 10 found about 150 PRD requirements, 50 P0 LEGAL-REQ and 55 DATA-REQ marked launch-blocking, sized for a team the product does not have. 1.3 sorts them into three tiers. **Everything not listed below keeps its priority from sections 3.1 to 3.4** (P0 = v1.0 gate). A LEGAL-REQ or DATA-REQ is never dropped; a feature-scoped one binds the day its feature ships, which its own text allows for P1 and which counsel confirms for the P0 ones marked "counsel" (BL-104).

| Tier | Requirements | Why | Decision |
|---|---|---|---|
| **v1.0 gate (added or confirmed by 1.3)** | C-REQ-020 to C-REQ-029, C-NFR-002 to C-NFR-004, PRD-REQ-003, -015, -020, -022; LEGAL-REQ-046 to -050 | Plus ships at launch through the App Store | D-001, K-34 |
| v1.0 gate | B-REQ-007, -009, -010, -011, B-NFR-002 (token handling), B-NFR-003, B-NFR-004, PRD-REQ-014; C-REQ-007 (family-letter notifications) | Family contributors in the app at launch | D-002, K-35 |
| v1.0 gate | PRD-REQ-016 to -018; LEGAL-REQ-003, -017 | Full opt-in analytics at launch | D-003 |
| v1.0 gate (pending founder OK) | PRD-REQ-021 shared voice | Family hear each other's voices | D-032, K-40 |
| v1.0 gate (raised from P1) | C-REQ-009 lock-screen name toggle (default off) | The safe default needs the toggle | D-025 |
| **v1.1** | B-REQ-008 web contribution page; PRD-REQ-007 web contributor identity; B-NFR-005 (browser encryption part); B-REQ-022 Hindi web page; LEGAL-REQ-010 and LEGAL-REQ-035 bind from here (counsel) | Web page deferred by the founder | D-002, K-35 |
| v1.1 | A-REQ-017 Google sign-in; A-REQ-019 account linking (P1) | Apple plus email meets Guideline 4.8 | D-044 |
| v1.1 | A-REQ-003, A-REQ-004 to A-REQ-011 (story intro) | One welcome screen at v1.0; A-REQ-005's "Sign in reachable" applies to the welcome screen | D-043 |
| v1.1 | LEGAL-REQ-004, -005, -020 and the AI-processing consent | No server transcription or AI gateway in v1.0 | TDD 10 section 2 |
| v1.0 reduced, full flow before Android | LEGAL-REQ-030 web deletion page: static page plus email route at v1.0 (counsel) | Source is Google Play (CR-091); Apple requires in-app deletion, which ships | D-042 |
| Later | ADR 0006 Vault mode, Recovery Kit, per-child keys, member key grants; LEGAL-REQ-022(a) and -023 apply to the v1.0 shared-voice scheme in reduced form (counsel) | Highest complexity per user benefit; not portable to Android | D-032, TDD 10 risk 9 |
| Later | PRD 7.8 load test at 2x the 100k targets (2x the 1k targets stays a v1.0 gate) | 100k families is a year-one hope | TDD 10 section 2 |
| Conditional | Safety classifier (on-device tiers and support card): ships only with clinician sign-off by 20 Nov; otherwise a static resources row | False negatives and positives both hurt | D-034 |

### 3.1 Section A: entry and sign-in
| ID | P | Area | Requirement | Rev |
|---|---|---|---|---|
| A-REQ-001 | P0 | Launch | Branded splash | |
| A-REQ-002 | P0 | Launch | Splash never waits on network, model or sync | |
| A-REQ-003 | P1 (v1.1) | Launch | Brand moment, 900 ms max, Reduce Motion fade (stories in v1.1, D-043) | 3.0 |
| A-REQ-004 | P0 (v1.1) | Stories | Gestures (stories in v1.1, D-043) | 3.0 |
| A-REQ-005 | P0 (v1.1) | Stories | Skip and Sign in reachable at any text size (stories in v1.1, D-043) | 3.0 |
| A-REQ-006 | P0 (v1.1) | Stories | Timing, pause, story 4 never advances (stories in v1.1, D-043) | 3.0 |
| A-REQ-007 | P0 (v1.1) | Stories | Screen readers (stories in v1.1, D-043) | 3.0 |
| A-REQ-008 | P0 (v1.1) | Stories | Reduce Motion (stories in v1.1, D-043) | 3.0 |
| A-REQ-009 | P1 (v1.1) | Stories | Silent intro (stories in v1.1, D-043) | 3.0 |
| A-REQ-010 | P1 (v1.1) | Stories | Stories show once (stories in v1.1, D-043) | 3.0 |
| A-REQ-011 | P1 (v1.1) | Stories | Remote variant switch (stories in v1.1, D-043) | 3.0 |
| A-REQ-012 | P0 | Account timing | Letter first, no sign-in required (18+ entry gate first; welcome screen at v1.0, D-043) | K-07 |
| A-REQ-013 | P0 | Account timing | Keep the book sheet after the first letter | K-02 |
| A-REQ-014 | P0 | Account timing | Later works locally (adults only) | K-11, K-07 |
| A-REQ-015 | P0 | Account timing | Re-ownership of local data in one transaction | |
| A-REQ-016 | P0 | Methods | Sign in with Apple on iOS | |
| A-REQ-017 | P0 (v1.1) | Methods | Google sign-in (v1.1, D-044) | 3.0 |
| A-REQ-018 | P0 | Methods | Email link and 6-digit code | |
| A-REQ-019 | P1 | Methods | Ways to sign in (link and unlink) | |
| A-REQ-020 | P1 | Methods | Apple on Android | |
| A-REQ-021 | P1 | Methods | "Last time you used" hint | |
| A-REQ-022 | P0 | Links | Universal and App Links | |
| A-REQ-023 | P0 | Links | Scanner-safe link page | |
| A-REQ-024 | P0 | Links | Expired link resend | |
| A-REQ-025 | P0 | Links | Resend limits | |
| A-REQ-026 | P0 | Links | Custom SMTP with SPF, DKIM, DMARC | |
| A-REQ-027 | P0 | Links | Code attempt limits | |
| A-REQ-028 | P0 | Invites | Invite token stored before UI | |
| A-REQ-029 | P0 | Invites | Paste or type invite code | |
| A-REQ-030 | P0 | Offline | Offline entry | |
| A-REQ-031 | P0 | Errors | Specific auth errors | |
| A-REQ-032 | P1 | Session | Offline session restore | |
| A-REQ-033 | P0 | Session | Apple revocation, sign out only after sync | |
| A-REQ-034 | P0 | Consent | Terms notice on the sign-in sheet | K-07, K-15 |
| A-REQ-035 | P0 | Consent | Notice before data; no contacts | K-16 |
| A-NFR-001 | P0 | Performance | Cold start budgets | |
| A-NFR-002 | P0 | Performance | Launch path; analytics only after consent | K-01 |
| A-NFR-003 | P0 | Performance | Story animation and asset budgets | |
| A-NFR-004 | P0 | Performance | Auth speed | |
| A-NFR-005 | P0 | Accessibility | WCAG 2.2 AA, AX5 | |
| A-NFR-006 | P0 | Accessibility | Gesture alternatives, pausable auto-advance | |
| A-NFR-007 | P0 | Accessibility | Screen reader labels and focus | |
| A-NFR-008 | P0 | Security | Token storage in Keychain or Keystore | |
| A-NFR-009 | P0 | Security | Provider hygiene and Apple key rotation | |
| A-NFR-010 | P0 | Security | Redirect allowlist; replace scaffold scheme | |
| A-NFR-011 | P0 | Privacy | Apple token revocation on deletion | |
| A-NFR-012 | P0 | Privacy | No content or tokens in analytics or Sentry | |
| A-NFR-013 | P0 | Reliability | Auth success 97% weekly per method | |
| A-NFR-014 | P2 | Localization | en-IN and Hindi entry strings (en-US only at launch) | K-24 |

### 3.2 Section B: first run, family, privacy, personalization
| ID | P | Area | Requirement | Rev |
|---|---|---|---|---|
| B-REQ-001 | P0 | First run | Only name and birthday or due date required | |
| B-REQ-002 | P0 | First run | Signature before the first letter | |
| B-REQ-003 | P0 | First run | Languages and Hindi script drive transcription | |
| B-REQ-004 | P0 | Children | Multiple children, switcher, "To {child}"; detailed by PRD-REQ-011 to 015 | K-12 |
| B-REQ-005 | P0 | Children | Expecting mode and Before You | |
| B-REQ-006 | P0 | Dictionary | Automatic terms from names and signatures | |
| B-REQ-007 | P0 | Family | Invite by link and code with explicit role | K-18 |
| B-REQ-008 | P0 (v1.1) | Family | Web contribution page, no install (moved to v1.1, K-35) | K-08, K-35 |
| B-REQ-009 | P0 | Family | Approval by either parent | |
| B-REQ-010 | P0 | Family | Remove and leave with letter retention | |
| B-REQ-011 | P0 | Privacy | Private by default; visibility per F9 | K-09 |
| B-REQ-012 | P0 | Personalization | Appearance and Reading Size | |
| B-REQ-013 | P0 | Personalization | Goals with visible effects | |
| B-REQ-014 | P0 | Children | Hide a book stops all child notifications | |
| B-REQ-015 | P0 | Children | No due-date countdown or push | |
| B-REQ-016 | P0 | Data | Only a sole parent deletes a book | K-10 |
| B-REQ-017 | P1 | Dictionary | Say the name three times | |
| B-REQ-018 | P1 | Letters | Sealed letters | |
| B-REQ-019 | P1 | Personalization | Book themes and templates (extra themes Plus) | |
| B-REQ-020 | P1 | Letters | Write to several children; sibling letters (sibling part behind counsel flag) | K-19 |
| B-REQ-021 | P1 | Children | Merge duplicate books; move a letter | |
| B-REQ-022 | P1 (v1.1) | Family | Hindi invite messages and Hindi web page (web page v1.1, K-35) | K-35 |
| B-REQ-023 | P1 | Family | Auto-add, thank you, make all private | |
| B-REQ-024 | P1 | Personalization | Author and child photos | |
| B-REQ-025 | P2 | Later | Came-home date; Hindi app UI; leave letters after account deletion | |
| B-NFR-001 | P0 | Privacy | No names, signatures or language names in analytics | K-01 |
| B-NFR-002 | P0 | Privacy | Tokens in URL fragment; hashes only | |
| B-NFR-003 | P0 | Security | RLS mapping with access and parity tests | K-09 |
| B-NFR-004 | P0 | Security | Invite and code rate limits | |
| B-NFR-005 | P0 (v1.1) | Security | Web audio encrypted in the browser (ships with the web page, K-35; in-app shared voice uses PRD-REQ-021) | K-35 |
| B-NFR-006 | P0 | Accessibility | AX5, screen readers, web WCAG 2.2 AA | |
| B-NFR-007 | P0 | Localization | Any script for names; locale dates | |
| B-NFR-008 | P0 | Performance | First-run and web page budgets | |
| B-NFR-009 | P0 | Offline | First run offline; queued invites and approvals | |
| B-NFR-010 | P0 | Children's data | Counsel review; child data only builds the book | |

### 3.3 Section C: habits, pricing, settings
| ID | P | Area | Requirement | Rev |
|---|---|---|---|---|
| C-REQ-001 | P0 | Reminders | Primed permission after the first letter | K-02 |
| C-REQ-002 | P0 | Reminders | Default a few evenings a week plus month-age note | K-03 |
| C-REQ-003 | P0 | Reminders | Time choice 07:00 to 21:30 | |
| C-REQ-004 | P0 | Reminders | Smart quiet | |
| C-REQ-005 | P0 | Reminders | No streaks or gap counts | |
| C-REQ-006 | P0 | Reminders | Copy rotation | |
| C-REQ-007 | P0 | Reminders | Pause all; separate channels | |
| C-REQ-008 | P1 | Reminders | Back-off | |
| C-REQ-009 | P0 (raised) | Reminders | Lock-screen name toggle, default off (remote config) | D-025, K-43 |
| C-REQ-010 | P0 | Celebrate | Quiet milestones | |
| C-REQ-011 | P0 | Celebrate | Birthdays and month-ages | |
| C-REQ-012 | P0 | Celebrate | Pause celebrations per book | |
| C-REQ-013 | P1 | Celebrate | Year One (no print line) | K-32 |
| C-REQ-014 | P1 | Celebrate | On this day (excludes local safety tiers) | K-06 |
| C-REQ-015 | P0 | Celebrate | Never celebrated list | |
| C-REQ-016 | P0 | Settings | Settings IA, 2 taps max (adds Privacy consents, Legal list, About) | K-13, K-17 |
| C-REQ-017 | P0 | Data | Export, free forever, offline | *Amended 4 Oct 2026 (D-051): export of letters already made works offline in every plan state and never needs Plus; the "free forever" title is superseded (see C-REQ-017 in C).* |
| C-REQ-018 | P0 | Data | Keep-safe nudge for audio not backed up | |
| C-REQ-019 | P0 | Data | Delete account and data | |
| C-REQ-020 | P0 | Plus | Restore purchases | |
| C-REQ-021 | P0 | Plus | Products and per-book entitlement | |
| C-REQ-022 | P0 | Plus | Plus sheet content and eligibility | |
| C-REQ-023 | P0 | Plus | Offer placement | K-12 |
| C-REQ-024 | P0 | Plus | Trial start notice and acknowledgment | K-04 |
| C-REQ-025 | P0 | Plus | Trial-ending notices | K-04 |
| C-REQ-026 | P0 | Plus | Renewal and annual reminders | K-04 |
| C-REQ-027 | P0 | Plus | Grace and billing retry | |
| C-REQ-028 | P0 | Plus | Lapse behaviour | |
| C-REQ-029 | P0 | Plus | Refunds | |
| C-REQ-030 | P1 | Plus | Gift a year of Plus | |
| C-REQ-031 | P1 | Plus | Dormant-payer email | |
| C-REQ-032 | P2 | Plus | Lifetime, about $99.99 | |
| C-REQ-033 | P2 | Plus | Web gift code; printed books outside IAP (future launch) | K-32 |
| C-REQ-034 | P0 | Analytics | Funnel events, content-free, consent-gated | K-01 |
| C-NFR-001 | P0 | Reliability | Notification delivery and quiet window | |
| C-NFR-002 | P0 | Reliability | Purchase reliability | |
| C-NFR-003 | P0 | Reliability | Restore within 10 s | |
| C-NFR-004 | P0 | Reliability | Fail-open for memories | |
| C-NFR-005 | P0 | Privacy | No content in analytics, logs, pushes | |
| C-NFR-006 | P0 | Accessibility | AX5 for prices and terms | |
| C-NFR-007 | P0 | Performance | Settings, Plus sheet, export budgets | |
| C-NFR-008 | P0 | Data | Backups of lapsed users never deleted | |
| C-NFR-009 | P0 | Ops | Remote config with audit log | |

### 3.4 Requirements added by this PRD
| ID | P | Area | Requirement | Source |
|---|---|---|---|---|
| PRD-REQ-001 | P0 | Consent | **One ask per session.** After the first letter, at most one permission or consent sheet per app session, in this order: Keep the book (A F3), reminder prime (C F1), analytics consent (LEGAL-REQ-003). Never stacked; never during recording, review or export. | K-01, K-02 |
| PRD-REQ-002 | P0 | Consent | **Account creation sequence:** provider sign-in with the Terms notice and 18+ confirmation line (the entry gate, PRD-REQ-019, was already answered Yes; `age_attested` goes in the `terms` acceptance context), then the sensitive-data consent (`sensitiveConsent.*`), then sync. Each step records its own `policy_acceptances` row. | K-07, K-15 |
| PRD-REQ-003 | P0 | Plus | **Notice schedule** in section 5, K-38 (replaces the K-04 day counts), recomputed from App Store snapshots (App Store Server Notifications V2 plus App Store Server API re-reads, ADR 0013) with idempotency keys; windows stored as data; nothing sent outside its hard window; email and in-app always, push only on the final trial notice. | K-04, K-34, K-38 |
| PRD-REQ-004 | P0 | Privacy | **Author-only working material.** `raw_transcript`, `machine_edits` and `stt_meta` are readable only by the author, through a security-barrier view for everyone else. | K-09 |
| PRD-REQ-005 | P0 | Children | **Child-input flag.** `together` prompts, "Write one together" and sibling letters are behind a `child-input` flag that is off in production until counsel signs off (LEGAL-REQ-059). | K-19 |
| PRD-REQ-006 | P0 | Data | **Drop `safety_events`.** A new migration drops the table and its insert policy; tiers live in the local database only. | K-06 |
| PRD-REQ-007 | P0 | Web | **Web contributor identity.** Supabase anonymous sign-in on `apps/web` only, created at the first Send, linked to the invite and a hashed personal return link; linkable to a full account later. | K-08 |
| PRD-REQ-008 | P0 | Content | **Claims pass.** Every claim flagged in compliance register section 3 is rewritten in `packages/content` (done 2 Oct 2026, section 8) and registered in the claims registry before counsel review. | K-21 |
| PRD-REQ-009 | P0 | Legal | **Shutdown pledge.** 90 days' notice, export working throughout, stated identically in Terms 17, Privacy 18, the deletion spec and Settings > Help and Legal. | K-05 |
| PRD-REQ-010 | P0 | Data | **Classification tags.** Every table, column, bucket, device store, log and event carries an L1 to L4 level in the data map; CI enforces section 7.10. | Founder decision |
| PRD-REQ-011 | P0 | Children | **One profile and book per child.** Each child is a separate `children` row with its own chapters, member list, settings and export section. Nothing about one child (name, letters, members, photos) is readable through another child's book. | K-12 |
| PRD-REQ-012 | P0 | Children | **Child switcher.** "For {child}" atop Tonight and Book; one tap opens "Whose book?" listing active books, Add a child, Hidden books. "To {child}" always visible while recording and in Review, changeable before save. Last opened child remembered per device. Single child: no chevron. | K-12 |
| PRD-REQ-013 | P0 | Children | **Per-child settings.** Settings > Children > {child}'s book. Book-level (parents edit, all members see): name, nickname, birthday or due date, photo, book look, family can read, hide, delete. Person-per-child: sign my letters as, include in my reminders, pause celebrations; auto-add per family member (parents). Person-global: cadence and time, languages, reading size, analytics. Each row 2 taps or fewer from Settings. | K-12, K-17 |
| PRD-REQ-014 | P0 | Children | **Per-child sharing.** Invites, roles, approvals and "Family can read" are per child. An invite names exactly one child at launch (multi-book picker P1, defaulting to the current child). RLS and sync streams scope every read to the child's members. | K-12, K-09 |
| PRD-REQ-015 | P0 | Plus | **Additional children are Plus.** A Free user may start one book. Starting another book while you already started a non-deleted book (`children.created_by` = you; hidden counts) needs Plus. **Books you joined as a co-parent do not count** (founder, 2 Oct). **Every child added together in first run is free**, whatever their dates (founder, 2 Oct); those books count as started books afterwards. A lapse never closes an existing book. Contributors are never gated. Server function `create_child` enforces the rule (first-run batch flag checked server-side: only on an account's first `create_child` call or batch); the client only shows the sheet. | K-12, K-28 **Amended 4 Oct 2026 (D-051): under review.** A free allowance of 2 letters per account now applies (PRD-REQ-024). Whether this book rule (first book free, first-run children free, joined books not counted) stays, changes or is replaced is an open edge (D-051 edges 2 and 6; D-007, D-008, D-014). Until decided, build nothing new on it; the text above is kept as history. |
| PRD-REQ-016 | P0 | Analytics | **Product analytics, opt-in.** A typed event catalogue in `packages/analytics` covering entry, first run, capture, review, book, family, children, reminders, Plus, settings and errors. Enum, count, duration and bucket properties only; children as ordinals; random analytics id. Nothing is queued or sent before consent. | K-01 |
| PRD-REQ-017 | P0 | Analytics | **Server aggregates for business totals.** Accounts, books, letters saved, family letters, trials, conversions and churn come from Postgres counts and the purchase ledger (`store_subscriptions` and `store_notifications`, fed by App Store notifications), cross-checked against App Store Connect reports, with no per-user content, so decisions do not depend on the consenting share. | K-01, K-34 |
| PRD-REQ-019 | P0 | Consent | **18+ entry gate, no local-only mode.** Before any first-run screen, story 4 action or invite flow, a neutral "Are you 18 or older?" (Yes, No, nothing preselected), plus iOS Declared Age Range where required. Yes is stored on the install as a boolean only. No, or an under-18 signal, shows a stop screen (the product is currently for adults 18 and over); nothing is created, recorded or stored; the stop screen stays for 24 hours (anti-retry) before the question can be asked again. A store signal or report after an account exists closes the account per Terms 2.1. Copy `ageGate.*` (mobile engineer); web page keeps its Send-time 18+ confirmation. | K-07, LEGAL-REQ-002 |
| PRD-REQ-020 | P0 | Plus | **Read together free sessions.** A Free book allows 3 Read together sessions (a session starts when playback with word highlight begins), then Plus. The number is remote config `read_together_free_sessions` (default 3, audit-logged, C-NFR-009); copy that states the number reads it from config, and store and site copy change in the same release if it changes. Playing any single recording is always free. | K-11 *Amended 4 Oct 2026 (D-051): interplay with the 2 free letters is an open edge (D-051 edge 5; D-009, D-037). Until decided, the rule stands as written.* |
| PRD-REQ-018 | P0 | Analytics | **Withdrawal and deletion.** Turning analytics off stops sending within the session and calls `optOut()`; account deletion requests deletion of the analytics id's events from PostHog and Sentry within the published clock. | K-01, LEGAL-REQ-003 |
| PRD-REQ-021 | P0 (pending D-032) | Family | **Shared voice.** A recording of a letter in a book with two or more members uploads, encrypted on the phone with a per-file key wrapped by a server-held key, so every member who can read the letter can play it (Free). Plus uploads every recording, private letters included, and restores them on a new phone. Downloading or playing an uploaded recording never checks entitlement. Deleting a letter or leaving a book removes cached copies on the next sync. Upload URLs are issued server-side only. | K-40, K-33 |
| PRD-REQ-022 | P0 | Plus | **Purchase rules.** A purchase requires a signed-in account (Keep the book sheet first); contributors never see the Plus sheet (a quiet line instead); no offer appears in a book already covered by another parent; restore never moves an active subscription between two accounts. | K-34, D-036, D-047 *Amended 4 Oct 2026 (D-051): contributors never see the Plus sheet still holds; the book's membership covers family authors, so they need none. Whether their letters count toward the 2 free letters is open (D-051 edge 1). The Plus sheet may now also open at the letter limit for the account owner (PRD-REQ-024).* |
| PRD-REQ-023 | P0 | Legal | **Publisher identity.** The publisher (individual), domain, support and privacy contacts come only from `packages/brand` (`publisher`); the legal name is never written into code (`publisher.legalName` stays a TODO marker that no screen renders) and appears only in published legal documents and App Store Connect. Release builds fail if the domain, support email or privacy URL still holds a placeholder (BL-117). | K-36 |
| PRD-REQ-024 | P0 | Plus | **Free letter allowance (D-051).** An account may save its first **2 letters** without Plus (a letter is a saved entry, spoken or typed; an unsaved draft is not a letter). After those, saving a new letter needs Plus. The allowance is remote config `free_letters_allowance` (default 2, audit-logged, C-NFR-009); copy that states the number reads it from config. Enforced on the server as well as in the app. Open, not decided here: whether family letters count, what a second child's book gets without Plus, how entitlement is counted offline, how this interacts with Read together, and what first-run children and joined books get (D-051 edges 1, 2, 4, 5, 6). | K-44, D-051 |
| PRD-REQ-025 | P0 | Plus | **Never discard an in-progress letter.** When the limit is hit, a letter being written, recorded or reviewed is never lost, discarded, truncated or hidden by the app. Recommended behaviour (not yet decided, D-051 edge 3): it stays on the phone and Plus is offered, and it is saved as soon as Plus starts. This follows the constitution: the machine may remove and repair, never take away a person's words. Same pattern as D-038 (a refused book is never deleted or hidden). | K-44, D-051, CLAUDE.md constitution |
| PRD-REQ-026 | P0 | Plus | **Existing letters stay open.** Every letter already made stays readable, playable (including its recording) and exportable if the person never subscribes or Plus ends; backed-up audio stays stored and downloadable (C-NFR-008). These paths never consult entitlement (LEGAL-REQ-050). Only new letters need Plus. | K-44, D-051 |
| PRD-REQ-027 | P1 | Plus | **Redeem a code (D-052, recommended mechanism).** Settings > Plan has a "Redeem a code" row (and a quiet link on the Plus sheet) that opens StoreKit's offer-code redemption sheet, then refreshes the entitlement from the App Store (the sheet has no callback; transaction updates carry the result). The server maps `OFFER_REDEEMED` and the following `SUBSCRIBED` or `DID_RENEW` notices to the entitlement with its real end date. We keep no code table, redemption RPC or secret of ours (App Review 3.1.1). Copy says plainly that the free months convert to the normal price unless renewal is turned off. One content-free analytics event, `offer_code_redeemed`. Unverified: whether `expo-iap` exposes the sheet, whether exactly 6 months is offered, whether notice windows cover an offer-code period. Priority P1 is a proposal; the founder wants it for early testers. | K-45, D-052, `docs/ops/OFFER_CODES.md` (branch `docs/offer-codes-runbook`) |

### 3.5 Legal and data requirements (linked, not duplicated)
All live in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md) (LEGAL-REQ) and [DELETION_AND_EXPORT_SPEC.md](../legal/DELETION_AND_EXPORT_SPEC.md) (DATA-REQ). P0 items are launch blockers.

| Area | LEGAL-REQ (P0 unless marked) | DATA-REQ (P0 unless marked) | PRD owner |
|---|---|---|---|
| Consent and notice | 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011 (P1) | | A, B, C |
| Minimisation | 012, 013, 014, 015, 016, 017, 018, 019, 020 | 001, 002, 004, 005 | All |
| Security | 021, 022, 023, 024, 025, 026, 027 (P1), 028 | 047 | Eng |
| Deletion and retention | 029, 030, 031, 032, 033 | 006, 010 to 027 (024 P1), 030, 031 (P1), 032 to 036, 060 to 066 (063, 065 P1) | B, C |
| Export | 034, 035 (P1), 036 (P1) | 050 to 053, 054 (P1), 055 (P1), 056 | C |
| Integrity | | 003, 040 to 046, 048, 049 | Core, Eng |
| Breach response | 037, 038 (P1), 039, 040 | | Eng |
| Store disclosures and claims | 041, 042, 043, 044, 045 | | Founder, C |
| Subscriptions | 046, 047, 048, 049, 050 | | C |
| Accessibility | 051, 052 (P1) | | All |
| Messaging | 053, 054 | | C |
| Platform and legal process | 055, 056 (P1), 057 (P1), 058, 059 (P1), 060 (P1) | | A, B, Founder |

---

## 4. Decisions already made by the founder (1 Oct 2026)
| Decision | Effect in this PRD |
|---|---|
| Free forever core: write, read, play back, export, family authors | C 4.1 table stands; promise line wording per K-11 **Amended 4 Oct 2026 (D-051): superseded.** Free is now the first 2 letters per account; existing letters stay open; see PRD-REQ-024 to -026. |
| Plus $3.99/month (1-month trial) or $29.99/year (2-month trial) | C-REQ-021 products `el_plus_monthly_399`, `el_plus_annual_2999` |
| Lifetime about $99.99 later | C-REQ-032 P2 |
| US App Store first, Android later, all patterns Android-workable | Section 2; LEGAL-REQ-058 |
| Beta with light "can make mistakes" disclosures | K-13, K-14; strings added in section 8 |
| (2 Oct) Multiple children, each with its own separately managed profile and book; additional children part of Plus | K-12, K-28; PRD-REQ-011 to 015 |
| (2 Oct) Full product analytics, opt-in, content-free | K-01; PRD-REQ-016 to 018 |
| (2 Oct) Free core includes backups already made | C-NFR-008, C-REQ-028 stand Stands (backups already made stay stored and downloadable). |
| (2 Oct) Read together free for 3 sessions, then Plus (provisional; confirmed in the second set below) | K-11; PRD-REQ-020 Interplay with D-051 open. |
| L1 to L4 data classification | Section 7.10 |
| (2 Oct, second set) Twins or more added together in first run all stay free | PRD-REQ-015; K-12; section 9 Q2 closed **Amended by D-051: open edge.** |
| (2 Oct) A book joined as co-parent does not count as your free book | PRD-REQ-015; K-12; section 9 Q7 closed **Amended by D-051: open edge.** |
| (2 Oct) Physical printed books are a future launch; v1 is digital only | K-32; print removed from v1 scope, copy, store text and Terms (kept as roadmap) |
| (2 Oct) Read together is Plus after 3 free sessions (default; remote config) | PRD-REQ-020; K-11; section 9 Q1 closed Interplay with D-051 open. |
| (2 Oct) Beta ends only when the founder says so; no date or metric trigger | K-13; section 9 Q3 closed |
| (2 Oct) Under 18 not allowed at all; no local-only mode; clean stop screen | K-07; PRD-REQ-019; section 9 Q4 closed |
| (2 Oct) About 13M analytics events a month at 100k families is accepted | K-01; section 7.8; section 9 Q8 closed |
| (2 Oct) Company name and domain still pending; earlyletters.com, .app and .co reported available on 2 Oct | Section 9 Q5 stays open; `packages/brand` placeholders kept |
| (3 Oct) Plus ships in v1.0 "via Apple subscription management to keep it Apple focused" | K-34; ADR 0013 (StoreKit 2 direct, no RevenueCat); PRD-REQ-003, -017, -022; D-001 |
| (3 Oct) Family scope at launch: co-parent and family contributors in the app; web contribution page in v1.1 | K-35; section 3.0; D-002 |
| (3 Oct) Full opt-in PostHog analytics at launch, as decided 2 Oct | K-01 stands; TDD 10 risk 15 recommendation declined; D-003 |
| (3 Oct) Publish with a personal (individual) Apple Developer account; no LLC for now | K-36; launch gate 4; PRD-REQ-023; D-004, D-005; section 9 Q5 narrowed to the domain |
| (4 Oct) Plus is membership: first 2 letters per account free, then Plus; existing letters stay readable, playable and exportable; one membership covers the book and family authors; prices, trials, Apple-only, US-only unchanged | K-44; PRD-REQ-024 to -026; amends PRD-REQ-015, -020, -022; D-051 |
| (4 Oct) Early testers, neighbours and friends get free months (for example 6) through Apple offer codes, not our own code system (intent decided; mechanism recommended) | K-45; PRD-REQ-027; D-052 |

---

## 5. Conflict log

Each entry: the conflict, the decision, and why. "Docs changed" lists what was edited on 2 Oct 2026; "Owner action" lists what someone else must still change.

### K-01. Analytics consent: Apple 5.1.1(ii) versus PRD A default
- **Conflict.** A section 7 proposed analytics on by default in the US; A-NFR-002 starts analytics after the first frame; ADR 0008 ties `defaultOptIn` to a consent sheet. Compliance register CR-082 and LEGAL-REQ-003 require consent "even if such data is considered to be anonymous". The Privacy Policy already says analytics are off until you say yes.
- **Decision.** Analytics (PostHog) and crash reports (Sentry) are **opt-in**. Nothing leaves the device before a choice. The consent sheet is the third ask under PRD-REQ-001, shown on a later session after the first letter. Declining changes nothing, including Plus. Withdrawal in Settings > Privacy.
- **Why.** Apple's wording is explicit; the Privacy Policy is already written this way; a rejection at review costs more than the lost data.
- **Consequence.** Funnel numbers in A section 10 and C section 9 cover consenting users only. Core business numbers (accounts, letters saved, trials, conversions) come from server-side aggregates (Postgres counts, the entitlement ledger; RevenueCat until 1.3, K-34), which need no device analytics.
- **Founder update, 2 Oct 2026: full product analytics are wanted.** This does not change consent; it changes scope. The catalogue covers the whole product (PRD-REQ-016), not only the funnel in C-REQ-034. Rules: allowlisted enums, counts, durations and buckets; children as ordinals (`first`, `second`, `third_plus`) and a `child_count_bucket` user property, never ids or names; no screen-name autocapture, replay or touches (ADR 0008); every property tagged L2 in the data map; consent copy in `analyticsConsent.*` (section 8). Business totals come from server aggregates (PRD-REQ-017).
- **Founder update, 2 Oct 2026 (second set): volume accepted.** About 13M events a month at 100k families (section 7.8) is accepted; budget PostHog above the free tier. The catalogue is not capped for cost; the per-user ceiling in section 7.7 still applies.
- **Founder update, 3 Oct 2026: confirmed for launch.** TDD 10 risk 15 recommended no third-party SDKs at v1.0; the founder kept full opt-in PostHog (and Sentry on the same switch) at launch (D-003). Release-gate crash rates come from App Store Connect and Xcode Organizer, which cover every user (TDD 06 P-7); analytics-id deletion happens at request time through a stateless function (TDD 05 X-02, BL-235).
- **Docs changed.** A section 7 and A-NFR-002 revised; B-NFR-001 and C-REQ-034 revised (1.1). **Owner action (analytics engineer):** ADR 0008 states `defaultOptIn: false` and Sentry opt-in; publish the event catalogue in `docs/analytics` with an L-level per property; implement PRD-REQ-016 and 018 in `packages/analytics`. **Owner action (legal, privacy counsel):** approve `analyticsConsent.*` wording and the privacy label "Usage Data / Diagnostics, not linked, not tracking" for consenting users.

### K-02. Notification permission timing: B versus C (and A)
- **Conflict.** `onboarding.reminder` strings sat in first-run onboarding (a reminder step before the first letter). C F1 and C-REQ-001 move the ask to a priming card after the first letter. A says the primer must never stack on the Keep the book sheet. B flagged the conflict and defers to C.
- **Decision.** C wins. No OS notification prompt anywhere in first run. The priming card shows on Tonight the next time it opens after the first letter is saved **and** the Keep the book sheet has been answered (signed in or Later). If both would fall in one session, the prime waits for the next session (PRD-REQ-001). Invited family get one prime after their first sent letter, offering weekly. Web contributors get no push.
- **Why.** UR R7 (ask after the first letter, with a pre-permission explanation); CR section 2 (Tinybeans primed permission); Apple and Android allow one OS prompt, so wasting it during onboarding is unrecoverable.
- **Docs changed.** B F1 note; strings `onboarding.reminder` rewritten as the C priming card (section 8).

### K-03. Reminder frequency copy versus "daily" strings
- **Conflict.** C-REQ-002 defaults to 2 evenings a week plus the month-age note (UR R7: 2 or fewer a week). Shipped strings said "One gentle nudge a day", "One small reminder a day", "Daily reminder".
- **Decision.** Default cadence **"A few times a week"** (Tuesday and Saturday, 8:30 pm local) plus the month-age note. Options: Off, Weekly, A few times a week, Every evening. No string may promise or imply a daily rhythm by default.
- **Why.** UR R7 and CR section 4 complaint 7 (repeated prompts get muted); VOICE "A minute is plenty", not "build your daily habit".
- **Docs changed.** `onboarding.reminder.*`, `settings.reminders.*` rewritten; cadence option strings added.

### K-04. California ARL notice timing versus C's 7 days
- **Conflict.** C-REQ-026 sent the annual renewal notice 7 days before; ARL 17602(b)(2) requires 15 to 45 days for terms of one year or longer. C-REQ-025 sent annual-trial notices at 7 and 3 days; the Terms 14.6 and Subscription terms promise 15 to 21 days and 3 days; LEGAL-REQ-047 says 7 and 3 (inside the 3 to 21 window of 17602(b)(1)). UR R16 asks for 7 days' notice before any trial ends or plan renews.
- **Decision.** One schedule, applied by the server:

| Event | When | Channels |
|---|---|---|
| Purchase or trial start acknowledgment | Immediately | Email and in-app sheet |
| Monthly plan, 1-month trial ending | 7 days and 3 days before | Email and in-app card; push only at 3 days |
| Annual plan, 2-month trial ending | **18 days** and 3 days before | Email and in-app card; push only at 3 days |
| Any trial arm of the experiment | 18 and 3 days if the trial is longer than 31 days, else 7 and 3 days | Same |
| Annual renewal | **30 days** and 7 days before | Email and in-app card |
| Monthly renewal | No per-cycle notice; next date always in Settings > Plan | In-app |
| Annual reminder, every subscription (monthly included) | Each subscription anniversary | Email |
| Price change | **25 days** before (window 7 to 30) | Email and in-app, plus store consent flow |

  If a notice day is the child's birthday, it moves one day earlier (it stays inside every window). No reminder sends on a notice day.
- **Why.** 18 days sits inside both the 15 to 21 day promise in the Terms and the 3 to 21 day ARL window, with margin for time zones. 30 days sits inside 15 to 45 and matches "about 30" in the Terms. The monthly 7-day notice honours UR R16 without a legal duty. Push only once keeps disclosures light.
- **Docs changed.** C-REQ-024, -025, -026 and C section 4.3 revised. **Owner action.** LEGAL-REQ-047 table: annual trial "7 and 3" becomes "18 and 3"; monthly trial adds 7 days.
- **Superseded 3 Oct 2026 by K-38.** TDD 05 X-06 and TDD 08 C-1 showed that D-3, "+/- 1 day" on D-30 and the birthday shift break Virginia, Massachusetts and the Terms' "at least 3 days before the last day to cancel". The schedule is now the K-38 table (hard windows, final trial notice at E-4d12h). LEGAL-REQ-047 was updated the same day.

### K-05. 90-day shutdown notice everywhere
- **Conflict.** CR recommended at least 60 days; Terms 1.1.0 commit to 90 and record that the Privacy Policy and deletion spec were moved from 60 to 90; C-REQ-016 lists a "shutdown and portability pledge" without a number.
- **Decision.** **90 days**, everywhere, with export and backed-up audio download working the whole time and Standard-mode audio decrypted for export before shutdown (DATA-REQ-055). Settings > Help and Legal shows the pledge with the same number (PRD-REQ-009).
- **Why.** The Terms are the binding text; every other surface must match it exactly or it becomes a deception claim (CR-010).
- **Docs changed.** C-REQ-016 revised. Verified: Terms 17.1, Privacy Policy 18, DELETION_AND_EXPORT_SPEC 4 all say 90.

### K-06. Safety tiers on the device; drop server `safety_events`
- **Conflict.** The core migration creates `public.safety_events` (author id, tier, time) with a client insert policy and an author index; data-policy keeps it 12 months; DATA-REQ-061 purges it; C-REQ-014 excludes entries "with a `safety_events` row". Register risk 2, CR-031 and LEGAL-REQ-015: an identifiable mental-health inference on the server is consumer health data and sensitive data.
- **Decision.** Tiers are computed and stored **on the device only**. A new migration drops `safety_events`, its policy and index (PRD-REQ-006). No aggregate safety telemetry at launch. C-REQ-014 reads tiers from the local database. DATA-REQ-061 becomes "not applicable: no server table".
- **Why.** No product feature needs the server copy; keeping it creates MHMDA, Connecticut and CCPA exposure and a privacy-label category. The Privacy Policy is already written for this design (CN-10).
- **Docs changed.** C-REQ-014 revised. **Owner action.** Migration (engineering); data-policy row and DATA-REQ-061 (data owner); privacy label checklist item resolves.

### K-07. 18+ age gate (Texas)
- **Conflict.** A section 7(6): "Terms say users are 18+, no age gate". Register CR-004 (Texas SB 2420 in effect; Apple Declared Age Range since 4 June 2026) and LEGAL-REQ-002 require a neutral 18+ gate plus store signals. Terms 2.1 and Privacy Policy section 2 already say 18+.
- **Decision.** A neutral age question ("Are you 18 or older?" with Yes and No, nothing preselected) is the **first step of the sign-in sheet**, before any provider button, and part of Send on the web contribution page. On iOS, call Declared Age Range where required; the result is used in memory and never stored. An under-18 answer or signal: no account, nothing uploaded, a calm "Early Letters is made for adults" message, and the gate stays closed for 24 hours. ~~Local-only use continues (counsel may change this to a stop screen; section 9 Q4). Pre-account local use has no gate because nothing leaves the phone.~~
- **Founder decision, 2 Oct 2026 (second set): under 18 is not allowed at all.** No local-only mode. The question moves from the sign-in sheet to an **18+ entry gate** before first run (PRD-REQ-019): it runs before any child detail, recording or invite, so nothing about a minor is ever created on the phone or the server. No, or an under-18 store signal, shows a clean stop screen explaining the product is currently for adults 18 and over; it stays for 24 hours, then the question may be asked again. Yes is stored on the install as a boolean, never an age. The sign-in sheet keeps the Terms line with the 18+ confirmation (Lawyer 1 H4) and records `age_attested` in the `terms` acceptance context. The web contribution page keeps its 18+ confirmation at Send; under 18 there sends nothing. Terms 2.1 and Privacy Policy section 12 now say there is no under-18 use of any kind. **Owner action (mobile engineer):** stop screen and gate, copy `ageGate.*`. **Owner action (legal):** LEGAL-REQ-002 acceptance criteria updated to the entry gate.
- **Why.** The law is in force; the gate costs one tap; putting it before account creation means nothing about a minor ever reaches us.
- **Docs changed.** A section 7, F3, F4 and A-REQ-034 revised; 1.2: A F2.5, F3.4, A-REQ-012, A-REQ-034 revised again; Terms 2.1 (1.3.0), Privacy Policy section 12 (1.2.0), ENGINEERING_REQUIREMENTS LEGAL-REQ-002.

### K-08. Anonymous web contributor sessions: A says none, B needs them
- **Conflict.** A decision 4: no Supabase anonymous auth in v1, because it needs network at first launch and has a 30 per hour per IP limit. B F6 and section 6 item 12 need an anonymous session plus a personal return link for grandparents without the app. DELETION spec OQ-10 and POLICY_VERSIONING both assume B's model.
- **Decision.** **Split by surface.** The mobile app never uses anonymous auth (A stands). The web contribution page uses Supabase anonymous sign-in, created **at the first Send** (not on page load, per LEGAL-REQ-010), bound to the redeemed invite and the contributor's `child_members` row, with a hashed, revocable personal return link that restores the session on any browser. Anonymous identities are linkable to a full account when the contributor installs the app (manual linking on). Enable Supabase's recommended CAPTCHA for anonymous sign-ins if the per-IP limit or abuse requires it (provider would join the subprocessor list; **Unverified** which provider).
- **Why.** A's two reasons do not apply on the web: the page needs network anyway, and one family's Send rate is far below 30 per hour per IP. A grandparent with no app, no email and no password is the core of B-REQ-008 and UR R14.
- **Docs changed.** A section 0 decision 4 and B section 6 item 12 revised. **Owner action.** Verify anonymous-session role claims and linking (POLICY_VERSIONING note; B "to verify").
- **1.3: deferred to v1.1 with the web page (K-35).** The design stands for v1.1, with TDD 04's correction that return visits go through a contributor gateway rather than a restored anonymous session (TDD 04 X-6, X-7). The `is_anonymous()` guards ship in v1.0 anyway (BL-114) so nothing depends on remembering them later.

### K-09. Raw transcripts are author-only
- **Conflict.** `entries_select` returns whole rows to book members, including another author's `raw_transcript`, `machine_edits` and `stt_meta` (DELETION spec F9, OQ-8). Export already excludes others' raw transcripts. B F9 does not say.
- **Decision.** Only the author can read their own `raw_transcript`, `machine_edits` and `stt_meta`. Everyone else reads book entries through a security-barrier view without those columns (the same mechanism B plans for sealed letters). "Show exactly what I said" appears only on your own letters; everyone can still hear the recording, which is the true original. Word alignment stays readable so Read together works. Web contributors' letters are transcribed on a parent's device (B F6.7): that device writes the raw transcript under the contributor's author id and must not display or keep it after upload; the contributor reviews it from the return link.
- **Why.** The raw transcript is the author's working material (slips, false starts, things they removed). Showing it to others breaks "words belong to the person who said them" (data-policy principle 2) and would embarrass authors (UR 2.1, 62% worry about embarrassment).
- **Docs changed.** B F9 note. **Owner action.** RLS change and access tests (B-NFR-003).

### K-10. Parents cannot delete a co-parent's or family member's words
- **Conflict.** Privacy Policy section 12 says "Parents can review, export or delete everything in their child's book at any time." B F8, B-REQ-016, DATA-REQ-015 and Terms 9.1 say nobody deletes another person's words, and co-parents cannot delete the shared book. `settings.delete.bookBody` said every letter would be removed.
- **Decision.** The rule is DATA-REQ-015. **Owner action, Privacy Policy section 12, replace the sentence with:** "Parents can read and export the book, choose which family letters are in it, and delete their own letters. Only a sole parent can delete a whole book, and no one can edit or delete another person's words." The book-delete strings now distinguish sole parent from co-parent (section 8).
- **Why.** A published privacy statement that contradicts the product is a deception risk (CR-010) and contradicts the Terms.

### K-11. "Free, always" promise wording and Read together
- **Amended 4 Oct 2026 (D-051, K-44): the "free, always" promise is superseded.** The wording below is kept as history and must not ship. The replacement promise (existing letters always stay readable, playable and exportable; only new letters need Plus) is owned by content and counsel.
- **Conflict.** The promise line says "Writing, reading, **listening** and export are free, always", while Read together is Plus after 3 tries (C 4.1). Register item 10 and CR-012. A-REQ-014 lists Read together as working without an account.
- **Decision.** Use "playing your recordings" instead of "listening" everywhere a promise appears: "Writing, reading, playing your recordings, export and family letters are free, always." Playback of any recording stays free; Read together (word highlight, sequenced playback) is the Plus feature after 3 tries. **Decided 2 Oct 2026 (founder):** 3 free sessions is the default, tunable through remote config (PRD-REQ-020). Store description and site cost answer now say so, so the free-scope promise and the paywall cannot be read as contradicting each other. A-REQ-014 reads "Read together within the free tries".
- **Owner action.** Terms short version and 13.1 already say "reading your letters and playing their recordings" (13.1 matches); in-app-disclosures `store.description.subscriptionLine` and Subscription terms "What stays free" should switch "listening" to "playing your recordings".

### K-12. Multi-child profile management and Plus gating
- **Amended 4 Oct 2026 (D-051, K-44):** the "first book free", "first-run children free" and "joined books do not count" parts are under review (open edges 2 and 6). Switcher, per-child settings and per-child sharing stand.
- **Conflict.** C 4.1 and OQ6 put each extra book behind Plus provisionally; B-REQ-004 is P0 multi-child with "Add another child" for twins in first run; C-REQ-023 forbids any offer at launch or in first run; C F1 named "the most recently opened child" in a shared reminder; B F5 defaulted a multi-child invite to all children; C-REQ-012 said "per book" without saying whose choice; no document defined which settings are per child.
- **Founder decision (2 Oct 2026).** Multiple children are supported, each with its own separately managed profile and book; additional children are part of Plus.
- **Decision.**
  1. **Switcher** (PRD-REQ-012): "For {child}" atop Tonight and Book; "Whose book?" lists active books, then Add a child and Hidden books. "To {child}" in Listening and Review, changeable before save.
  2. **Per-child settings** (PRD-REQ-013), in three scopes:

| Scope | Settings | Who changes |
|---|---|---|
| Book (shared) | Name, nickname, birthday or due date, photo, book look, family can read, hide, delete | Parents |
| Person, per child | Sign my letters as, include in my reminders, pause celebrations | Each member for themselves |
| Parent, per family member per child | Auto-add their letters | Parents |
| Person, all children | Reminder cadence and time, languages and script, reading size, analytics choice | Each member |

  3. **Reminders** stay one schedule per person; each reminder names one included child in turn (rotation, not "most recent", so a second child is never named less). Month-age and birthday notes are per child and follow that child's switch. Pause celebrations is per person per child, so one parent's hard season does not silence the other's.
  4. **Per-child sharing** (PRD-REQ-014): member lists, roles, invites, approvals and "Family can read" are per child. At launch an invite names one child and says so; the P1 multi-book picker defaults to the current child, not all.
  5. **Plus gating** (PRD-REQ-015): a Free user starts one book. Starting a book while you already started a non-deleted book (hidden books count) opens the Plus sheet at the third tap. **Decided 2 Oct 2026 (founder):** books you joined as a co-parent do **not** count (so in a two-parent family each parent can start one free book; accepted), and **every child added together in first run is free**, whatever their dates, so no paywall can ever appear in first run. Lapse: every existing book stays writable; only creating another needs Plus. Contributors are never gated. Enforced server-side in `create_child`.
- **Why.** The founder decided the gate. Rotation and per-person celebration pauses answer UR section 1.4 (second children get less) and UR section 1.1 (separated parents). Charging a family for twins in their first minute is the anger pattern in UR section 0 finding 4. Default-all invites would open a sibling's book to someone invited for one child.
- **Docs changed.** B F1, F2, F5, acceptance criteria; C F1, 4.1, C-REQ-016, C-REQ-023, OQ6; strings `children.*`, `onboarding.child.addAnotherHelp`, store and site copy. **Owner action (data architect):** `create_child` Plus check with entitlement lookup; RLS and PowerSync sync streams scoped per child with a cross-child leak test; per-person-per-child settings table (`child_member_prefs`). **Owner action (mobile engineers):** switcher, per-child settings screens, Review child change. **Owner action (analytics engineer):** `child_added{mode, ordinal}`, `child_switched{ordinal}`, `child_setting_changed{key}`.

### K-13. Beta label placement
- **Conflict.** None between drafts, but no PRD placed it. in-app-disclosures section 1 and 4 define it; Terms 16.4 backs it.
- **Decision.** The label and body appear **only** in Settings > Help and Legal > About (caption style, no badge colour) and as the last paragraph of the store description. Never on Tonight, Listening, Review, the Book, the intro, the sign-in sheet or the Plus sheet. Not in the app name or subtitle. Optional App Store promotional text may say "Now in beta". All beta strings are removed in the same release that removes Terms 16.4.
- **Founder decision, 2 Oct 2026 (second set): the beta ends only when the founder says so.** No version, date, crash-free or other metric trigger. Until then the label, the About body, the store line and Terms 16.4 stay. Ending it is one release: remove `settings.about.beta.*`, `store.promotionalTextBeta` and the store beta paragraph, publish Terms with 16.4 removed (version bump per POLICY_VERSIONING), update in-app-disclosures section 4.
- **Docs changed.** `about.beta.*` and the store beta line added (section 8); C-REQ-016 lists About.
- **1.3: store placement amended by recommendation K-37 (needs founder OK).** In-app placement stands.

### K-14. "It can make mistakes" note
- **Decision.** One-time card on Review the first time a spoken letter is transcribed on the install, before the first save; never for typed letters; never again as a nag. Always available under Settings > Help and Legal > How transcription works. Uses "fix", not "tidy" (VOICE). Same text once on the web page after a contributor's first spoken letter.
- **Docs changed.** `review.firstNote.*` and `help.mistakes` added.

### K-15. Where Terms acceptance is stored; sensitive-data consent
- **Conflict.** A-REQ-034 stores the accepted version on the profile; LEGAL-REQ-001 requires append-only `policy_acceptances`. LEGAL-REQ-006 requires a separate sensitive-data consent at account creation; A has no such step; the Privacy Policy ties it to the first sync.
- **Decision.** Acceptances go to `policy_acceptances` via `record_policy_act`. The sensitive-data consent is one plain screen right after a new account is created and before the first sync (PRD-REQ-002). Declining keeps everything local: no sync, backup or family, stated plainly, changeable in Settings > Privacy.
- **Why.** Connecticut (from 1 July 2026) and Washington MHMDA need a separate, unbundled consent; placing it before the first sync matches the Privacy Policy.

### K-16. Child-data notice wording at entry
- **Conflict.** A section 7 notice says "you can export or delete everything any time"; register item 7 says that is not fully true (copies on family phones, backups) and "no selling" should also cover sharing.
- **Decision.** New notice (UR R22, two sentences): "Your letters are private to you and the family you invite. No ads, no selling or sharing your data, and you can export or delete your letters any time." Counsel to approve via the claims registry.
- **Docs changed.** A section 7.

### K-17. Settings Privacy and Legal rows
- **Conflict.** C-REQ-016 Legal lists Terms, Privacy, Licences; LEGAL-REQ-008 needs each consent visible and withdrawable in 2 taps and more legal documents.
- **Decision.** Privacy section lists: analytics, sensitive data, AI processing (server transcription), backup mode, lock-screen names, audience. Help and Legal lists: About (beta), How transcription works, Support, Report a concern (P1), Terms, Privacy Policy, Consumer Health Data Privacy Policy, Subscription terms, Subprocessors, Accessibility statement, Licences, shutdown and portability pledge (90 days).
- **Docs changed.** C-REQ-016 revised.

### K-18. Invite expiry and hash retention
- **Conflict.** B 7 days (OQ7 proposes 14 for Family); Privacy Policy "7 days (14 for family, proposed)". Hash retention: LEGAL-REQ-033 says 30 days after expiry; data-policy, DATA-REQ-060 and Privacy Policy say 90.
- **Decision.** Co-parent invites expire in 7 days, Family invites in 14. Invite and return-link hashes are deleted **90 days** after expiry, use or revocation.
- **Why.** Grandparents act slowly (UR 1.4); 90 days matches three documents and the published policy draft, and the hash is not content. **Owner action.** LEGAL-REQ-033 table to 90 days.

### K-19. Child-voice features and sibling letters
- **Conflict.** `together` prompts ("Ask {child}: ... Keep the answer", "Let {child} add a sound") and `readTogether.makeLetterTogether` invite recording a child; B-REQ-020 sibling letters; register CR-001 edge 1 and LEGAL-REQ-059.
- **Decision.** All `together` prompts, "Write one together" and sibling letters are behind the `child-input` flag, **off in production** until counsel's written COPPA opinion is linked (PRD-REQ-005). The prompts stay in `packages/content` (the content test requires the kind) but the prompt selector in `packages/core` must not serve them while the flag is off.

### K-20. Store and website audience copy
- **Conflict.** `store.en.ts` keyword "kids" and "let them listen on their own"; `site.en.ts` "let {child} choose a favourite letter and listen alone". Register CR-001 to CR-003, LEGAL-REQ-045, UR R23, Apple 2.3.8.
- **Decision.** Removed. Keywords use "baby" and "parents" instead; Read together is described as something you do together at bedtime.
- **Docs changed.** Section 8.

### K-21. Privacy and security claims in shipped copy
- **Conflict.** Register section 3 items 1 to 6 and 10: "everything stays only on this phone", backup "copies your letters ... encrypted", "Transcription happens on your phone", "recordings stay on your phone unless you turn on the encrypted backup", "Only you", encryption claims without the recovery-key qualifier.
- **Decision.** Rewritten in section 8 to say: letters sync when you sign in; recordings stay on the phone unless you back them up, share them with family or choose cloud transcription; transcription is on the phone **by default**; Standard backup keeps a recovery key with us unless you choose Vault mode. Each claim goes into the claims registry (LEGAL-REQ-044).
- **1.2 (Lawyer 2 H4, register section 3 rows 13 to 21).** The nine remaining claims are fixed in `packages/content` (section 8): backup-failed copy says recordings, not letters; signed-out and pre-account deletion copy names letters and recordings instead of "everything"; the recordings row is conditional on backup state; staff access is narrowed to the Privacy Policy's three cases; "never sell or share" becomes "never sell your data or share it with advertisers"; "export everything as a PDF" becomes "export your book"; recording exits drop "share them with family" (K-33); the sensitive-data consent and its Settings help line name health details.

### K-22. Account deletion and the shared book
- **Conflict.** B OQ6, Terms 8.4, Privacy CN-13: a co-parent's account deletion removes their letters from the shared book, which may surprise the other parent. DELETION spec F1: `children.created_by ... on delete cascade` deletes the **whole book**, including other people's letters, when the creator deletes their account.
- **Decision.** v1 keeps "your account deletion removes your own letters" (author ownership); "Leave my letters for {child}" stays P2 (B-REQ-025). The cascade bug is a P0 fix (DATA-REQ-012: `on delete set null`) before any non-founder data exists. The deletion flow tells a co-parent plainly that their letters will leave the shared book and offers export first.

### K-23. Deletion and backup timing
- **Conflict.** Privacy Policy: backups roll off within 7 more days; LEGAL-REQ-031: within 35 days of hard delete; data-policy publishes 31 days live, 38 days backups, 45 days processors.
- **Decision.** The data-policy numbers (31 / 38 / 45) are the published promise; Supabase PITR or daily backups bound to 7 days (DATA-REQ-030). LEGAL-REQ-031 is satisfied by them.

### K-24. Languages at launch
- **Conflict.** A-NFR-014 asks for en-IN and Hindi entry strings at launch; B makes Hindi app UI P2 and the Hindi web page P1; the US-only launch has no India targeting (LEGAL-REQ-058).
- **Decision.** App UI en-US only at launch; Hindi and en-IN app strings P2. Hindi and code-switched **speech** is P0 (B-REQ-003). Hindi invite messages and web page P1 (B-REQ-022), because overseas grandparents of US families are core users.

### K-25. Due date as health data
- **Decision.** Due-date mode (B-REQ-005) stays P0. The due date is covered by the sensitive-data consent (K-15) and the Consumer Health Data Privacy Policy, and is classified L4 (section 7.10).

### K-26. Review copy says "tidy"
- **Conflict.** VOICE bans words suggesting software "tidied" a letter; in-app-disclosures switched to "fix small slips"; existing `review.*`, `settings.tidy*`, `book.provenance.spokenTidied` and `book.aboutThisBook` still use "tidy".
- **Decision.** New strings use "fix". Renaming the existing "Lightly tidied" provenance and toggle is a design decision tied to the Review screen and printed book; logged as a content follow-up for the design leads, not changed in this pass.

### K-27. Real family name in a design doc
- `docs/design/DESIGN_LANGUAGE.md` (empty-state example) uses a real child's name. CLAUDE.md requires the fictional "Asha". **Owner action:** design leads replace it.

### K-28. Plus scope: per book versus per account
- **Amended 4 Oct 2026 (D-051):** per-account scope stands, now as the membership that unlocks new letters; one membership covers the book including family authors.
- **Conflict.** C-REQ-021 made the entitlement per book (C OQ3 open). With additional children behind Plus, a per-book model would need one purchase per extra child, but Apple allows a person one active subscription per subscription group, so a third child could never be funded. Gifts (C-REQ-030) are naturally per book.
- **Decision.** Plus is held by the subscriber's account. A book has Plus when any of its parents holds Plus or a gift is active on it. Every member's Plus features then work in that book (co-parent included). Creating an additional book checks the creator's own entitlement or the twins exception. ~~RevenueCat `appUserID` stays a random id mapped server-side.~~ (1.3, K-34) The App Store `appAccountToken` is a random id per account (`app_account_tokens`), mapped server-side; never the profile id, email or analytics id.
- **Why.** Store mechanics; one price for any number of children matches "additional children are part of Plus".
- **Docs changed.** C F4, C-REQ-021, OQ3. **Owner action (data architect):** `entitlements` table keyed by profile, plus `book_has_plus(child_id)` function used by RLS-free feature checks; gift grants keyed by child.

### K-29. Privacy Policy summary line "export or delete everything"
- **Conflict.** `privacy-policy.md` line 25 says "You can export or delete everything, any time, for free." Same problem as K-10 and register item 7: other people's letters and copies on family phones.
- **Decision.** Summary should read "You can export your book and delete your own letters, any time, for free." **Owner action (legal, privacy counsel).**

### K-30. B and C revisions listed in version 1.0 had not been applied
- **Conflict.** Version 1.0 said B F1, B F9, B section 6 item 12, C-REQ-014, -016, -024 to -026 and C 4.3 were revised; the files were unchanged.
- **Decision.** Applied in 1.1 with "Revised Oct 2 2026 per PRD.md conflict log" markers. C-REQ-024 (trial start) needed no change.

### K-31. Paywall disclosure placeholders
- **Conflict.** in-app-disclosures section 3 uses `{monthlyPrice}`, `{annualPrice}`, `{date}` and `{period}`; the content rules test allows only `{price}` among these, and the test is outside `packages/content/src`.
- **Decision.** Strings ship as `plus.legal.*` using `{price}`, with separate annual and monthly no-trial lines instead of `{period}`. Wording is otherwise identical. **Owner action (legal, terms counsel):** update the key names and placeholders in in-app-disclosures section 3 and "listening" in section 4 `subscriptionLine` (K-11).

### K-32. Printed books are a future launch; v1 is digital only
- **Conflict.** Out of scope in 2.2 and P2 in C-REQ-033, but shipped copy and legal text still promised or described print: store "Printed books ... are on the way", site FAQ "coming later" and "priced separately", `book.printPrompt` ("See the printed book"), C-REQ-013 "Tell me when printing opens", Terms sections 3, 6 and 15 as live terms.
- **Founder decision (2 Oct 2026).** Physical printed books are a future launch. v1 is digital only.
- **Decision.** No print promise or teaser anywhere in v1 product, store or website copy (an App Store description should not advertise features that are not in the app). Export (letters, recordings and the PDF book) is the v1 book. Terms 15 is marked "not offered yet" and the print clauses in 3, 6 and 7.1 apply only once print launches (Terms 1.3.0). Privacy Policy already says printed books are not available. Lulu and Stripe stay in the subprocessor list as planned, not active. Roadmap kept: C-REQ-033, ADR 0007, CR-054, the data-policy print rows.
- **Docs changed.** `book.printPrompt` removed; `store.description`, `site.faq` (two answers), `book.en.ts` header; C 4.1, C-REQ-013, OQ2; Terms 1.3.0.

### K-33. Recordings reach family only through backup
- **Conflict.** Site privacy point 3 and the recordings FAQ listed "share them with family" as a separate way recordings leave the phone; Terms 12.1 lists only backup and the web page; Lawyer 2 H4 row 20 asked the PRD B owner to confirm.
- **Decision (product, 2 Oct 2026).** Confirmed: in the app, family hear a recording only once it is backed up, because member playback uses the per-child key grants on backed-up files (ADR 0006 section 3, `book.recordingElsewhere`). Sharing is not a separate exit. Copy now says recordings leave the phone only if you back them up or choose cloud transcription, and family can hear a recording once it is backed up. Web contributors' own recordings leave their browser by design (B-NFR-005), which Terms 12.1 already states.
- **Owner action (legal, terms counsel).** Terms 12.1 should also name cloud transcription (consented, ADR 0002) as an exit.
- **1.3:** with family in the app at v1.0, K-33 means Free families could never hear each other's voices. K-40 proposes shared voice.

### K-34. Plus through Apple only, StoreKit 2 direct (founder, 3 Oct 2026)
- **Conflict.** ADR 0007, TDD 08, C-REQ-021 and LEGAL-REQ-029, -031, -037, -047, -049 assumed RevenueCat. TDD 10 recommended shipping 1.0 free.
- **Founder decision.** Plus ships in v1.0 "via Apple subscription management to keep it Apple focused".
- **Decision.** Auto-renewable subscriptions sold, managed, cancelled and refunded only through the App Store. StoreKit 2 through `expo-iap`; App Store Server Notifications V2 to an Edge Function; App Store Server API for verification and reconcile; random `appAccountToken` per account; no third-party billing processor (ADR 0013, which compares the two options and lets the founder override until week 6). Prices, trials, per-account entitlement (K-28), the additional-book rule (PRD-REQ-015) and the keep-and-leave rule are unchanged. New PRD-REQ-022 (account required, contributors never offered, no double offers, restore never moves an active plan).
- **Why.** Founder direction; one fewer processor, DPA, SDK and console; every cancel and refund path is Apple's own screen.
- **Docs changed.** PRD-REQ-003, -017, -022; K-28; checklist 6.5; 7.2; ADR 0013; ADR 0007 status; LEGAL-REQ-029, -031, -037, -047, -049, -058; subprocessors 1.2.0; privacy-policy 1.3.0; privacy labels 1.2.0; data-policy 1.1.0; DATA_CLASSIFICATION 1.2.0; DELETION_AND_EXPORT_SPEC 1.1.0; `plus.legal.cancel` (Apple only; App Review 2.3.10). **Owner action (analytics engineer):** TRACKING_PLAN lifecycle totals from the entitlement ledger instead of RevenueCat. **Owner action (PRD C owner):** C 4.2 refunds row and C-REQ-021 wording follow ADR 0013 (C carries a 1.3 banner meanwhile).

### K-35. Family contributors in the app at v1.0; web contribution page in v1.1 (founder, 3 Oct 2026)
- **Conflict.** B-REQ-008 made the web page P0 for grandparents without the app; TDD 10 recommended co-parent only for v1.0.
- **Founder decision.** Co-parent and family contributors in the app at v1.0; the web contribution page in v1.1.
- **Decision.** v1.0 ships Family roles, invites by link or code naming one child, approvals, leave and remove, "Family can read", per-child sharing and family-letter push, all in the iOS app. Invite links open the app or, if not installed, the App Store page; invite messages say so (`family.shareMessage.*` updated). B-REQ-008, PRD-REQ-007, the browser part of B-NFR-005 and B-REQ-022 move to v1.1, and LEGAL-REQ-010 and -035 bind from then (counsel to confirm). The visibility model moves into one `book_access` table (D-024) and the cross-child leak test gates v1.0. Contributors see the child's name, nickname and birthday month and day, never the due date (D-039).
- **Why.** Grandparents writing is a core research finding (UR R14); the web page is a second product and the riskiest security surface (TDD 10 risk 10, TDD 04 finding 2).
- **Consequence.** v1.0 contributors need an iPhone. Overseas grandparents without the app wait for v1.1 (section 9 Q6 now applies to v1.1).
- **Docs changed.** Section 2, 3.0; checklist 6.2 web line marked v1.1; `packages/content` share messages, store and site family copy (no "no app needed" promise); B carries a 1.3 banner.

### K-36. Individual publisher (founder, 3 Oct 2026)
- **Conflict.** Launch gate 4, compliance register (California LLC), Terms (counsel note: "form the LLC before launch"), Privacy Policy CN-1 and TDD 10 M0 all assumed an LLC and D-U-N-S.
- **Founder decision.** Publish with a personal (individual) Apple Developer account; no LLC for now.
- **Decision.** The founder's legal name is the App Store seller and the provider named in Terms, Privacy Policy, Subscription terms and the Consumer Health Data policy, with a contact address and email. `packages/brand` keeps a TODO placeholder for the name (PRD-REQ-023). D-U-N-S and LLC leave the critical path; the domain and support email stay on it (D-005).
- **Implications** (detail in `docs/DECISIONS.md` D-004): no liability shield (Terms and disclaimers help, do not replace an entity; reconsider before scale); App Review Guideline 5.1.1(ix) says apps "that require sensitive user information should be submitted by a legal entity", a medium-likelihood, high-impact risk for a baby memory book that can hold health details, mitigated by positioning and a founder hedge decision by 27 Nov; transfer to an organisation account later is possible after a first release, with Apple's subscription and Sign in with Apple transfer steps.
- **Docs changed.** Launch gate 4; checklist 6.7; legal documents (Terms 1.4.0, Privacy 1.3.0, Subscription terms 1.3.0, CHD 1.1.0, register 1.2.0); `packages/brand`.

### K-37. Where "beta" appears (recommended, needs founder OK)
- **Conflict.** K-13 puts a beta paragraph in the store description and optional "Now in beta" promotional text. App Review Guideline 2.2 (opened 3 Oct 2026): "Demos, betas, and trial versions of your app don't belong on the App Store - use TestFlight instead." (TDD 10 risk 4, contradiction 11.)
- **Recommendation.** The pre-launch beta is TestFlight (C0, then C1; D-045). The v1.0 listing has no beta paragraph and no beta promotional text. The in-app About label, About body and Terms 16.4 stay until the founder ends the beta (K-13 founder decision unchanged).
- **On founder OK:** remove `storeListing.description`'s last paragraph and `storeListing.promotionalTextBeta`; in-app-disclosures section 4 marks the store line not used. Until then the strings stay in `packages/content` and are simply not pasted into App Store Connect at M13 without the founder's answer (D-030).

### K-38. Auto-renewal notice windows (replaces K-04's day counts)
- **Conflict.** K-04 (D-3 final trial notice, birthday shift one day earlier), LEGAL-REQ-047 (D-7 and D-3 for annual trials; "+/- 1 day" on D-30), Lawyer 1 H1 (trials at least 3 days before the last day to cancel, which is trial end minus 24 h, so D-4; annual renewal about D-30 because Virginia and Utah need at least 30 and Massachusetts at most 30 before the cancel deadline), TDD 05 X-06 and TDD 08 4.3 (agree except the long-trial window).
- **Decision.** The D-022 table in `docs/DECISIONS.md` is the schedule: trial final at `E - 4d 12h` in `[E-5d, E-4d]` with the one push; trial long at `E - 18d` in `[E-21d, E-16d]`; trial week at `E - 7d` in `[E-8d, E-5d]`; annual renewal at `E - 30d 12h` in `[E-31d, E-30d]` and at `E - 7d` in `[E-8d, E-6d]`; anniversary reminder for monthly plans; price increase at `effective - 25d` in `[-30d, -7d]` with the store's opt-in consent. Nothing is sent outside its window; a miss pages the founder. Emails ignore the birthday; a push or card avoids the birthday only inside its window. Counsel confirms the table once (BL-104).
- **Docs changed.** PRD-REQ-003; K-04 note; checklist 6.5; LEGAL-REQ-047 (ENGINEERING_REQUIREMENTS 1.1.0). **Owner action (PRD C owner):** C-REQ-025 and C-REQ-026 day counts follow K-38 (C banner meanwhile).

### K-39. Sync engine (recommended, needs founder OK)
- **Conflict.** ADR 0004 picks PowerSync with op-sqlite; the app ships expo-sqlite (BL-032); TDD 02 found PowerSync cannot replicate the `book_entries` view; TDD 05 OQ-L15 blocks PowerSync for L4 data until a written no-training clause exists; TDD 06 P-1 found a restore could delete letters from every device under PowerSync's normal resync; TDD 10 recommends an outbox and cursor on expo-sqlite.
- **Recommendation.** D-023: outbox push and cursor pull on expo-sqlite for v1.0, one visibility predicate (`book_access`, D-024), a restore epoch, and PowerSync revisited at 10k families. Needs the founder's OK by 16 Oct because it reverses an accepted ADR; ADR 0004 carries a status note. The `LocalStore` interface and migrator (BL-111) proceed now because both options need them.
- **Docs changed.** 7.2 and 7.3 budgets name the sync push and pull generically; BACKLOG BL-173 is `needs-decision`.

### K-40. Shared voice (recommended, needs founder OK)
- **Conflict.** With family in the app (K-35), a grandparent's recording stays on the grandparent's phone unless backed up (K-33), and backup is Plus (C 4.1). In a Free family nobody would hear Nani's voice, against "Read together, in their voices" and the free family promise (TDD 10 contradiction 9).
- **Recommendation.** PRD-REQ-021 and D-032: one encrypted upload pipeline with a simple server-wrapped key (TDD 10's v1.1 scheme, moved into v1.0). Free uploads recordings of letters in shared books; Plus uploads every recording and restores them. Vault mode and the full ADR 0006 hierarchy stay later. Needs the founder's OK by 23 Oct; if declined, family letters are text-only at v1.0 (ROADMAP section 4, first cut).
- **On founder OK:** recordings claims in `packages/content` (K-21, K-33 copy), the Privacy Policy short version and section 4, and Terms 12.1 change in one PR (BL-205).

### K-41. Retention clocks
- **Conflict.** LEGAL-REQ-033 said invite hashes 30 days and ops and security logs 12 months; DATA-REQ-060, data-policy, the migration and K-18 said 90 days for invites; DATA-REQ-066 keeps `audit_events` 24 months (TDD 02 finding 10, TDD 04 X-8, TDD 05 X-14, X-27).
- **Decision.** Invite and return-link hashes: 90 days after use, revocation or expiry (D-020). `audit_events`: 24 months; `ops_audit_log`, `security_events`, escrow-unwrap logs: 12 months (D-021). Both clocks in Privacy Policy section 10. LEGAL-REQ-033 updated 3 Oct (counsel confirms OQ-L9).

### K-42. Free audio durability and the "only on this phone" claim (recommended, needs founder OK)
- **Conflict.** `settings.recordings.onPhoneBody` says recordings "live only on this phone" without backup, but app documents are in the user's iCloud device backup by default (TDD 10 risk 8, contradiction 10; Lawyer 2 L1; TDD 05 X-29).
- **Recommendation.** D-033: keep recordings in a backed-up directory (the model stays excluded) and say "on this phone and in your iPhone's own backup, if you use one". Restore drill each release candidate (BL-284). The copy changes on the founder's OK.

### K-43. TDD resolutions applied without changing founder decisions
- 18+ gate stores `ageGate.passed` and, after a No only, `ageGate.stoppedAt`; no `ageAttestedAt`; no instant retry (D-026; implements PRD-REQ-019).
- Lock-screen child names off by default, remote-config flippable; C-REQ-009 raised to v1.0 (D-025).
- Letter text never capped for Dynamic Type (D-027); dates in the device locale (D-028); `destructive` colour token (D-029).
- Remote config and kill switches in a Supabase table (D-035, BL-022).
- Read together sessions counted per book on the device in v1.0 (D-037).
- `create_child` takes client ids, a first-run batch capped at 6, and honours books created offline under Plus (D-038).
- Minimum iOS 17 (D-040); two Supabase environments and an agent fence for `supabase/` and auth (D-041).
- Hindi script default is open until the experiment (D-031, 30 Oct).

### K-44. Plus is membership: 2 free letters, then Plus (founder, 4 Oct 2026; D-051)
- **Conflict.** The PRD promised writing, reading, playing recordings and export "free, always" and described Plus as optional extras (K-11, C 4.1, PRD-REQ-015, section 4 first row). The founder changed the business model.
- **Founder decision.** Membership (the plan is still named Plus) unlocks the product. Free version: first 2 letters per account (a letter is a saved entry, spoken or typed); after that, new letters need Plus. Letters already made always stay readable, playable and exportable if someone never subscribes or Plus ends. One membership covers the book; family authors add letters without their own. Prices and trials unchanged ($3.99 a month with 1 month free; $29.99 a year with 2 months free; Apple only, ADR 0013; US only).
- **Decision here.** New PRD-REQ-024 (allowance), -025 (never discard an in-progress letter; recommended, edge 3), -026 (existing letters stay open). PRD-REQ-015, -020, -022, K-11, K-12, K-28, C-REQ-017, C 4.1 and C-REQ-028 are marked amended in place; nothing is renumbered or deleted. The eight open edges are not decided: family letters and the allowance, a second child's book without Plus, in-progress letter at the limit, offline entitlement counting (compare D-037), Read together interplay, first-run children free (D-007, D-008), offline letters past the limit, lapsed wording.
- **Why.** The founder: membership is what unlocks the features; the free version can have 1 to 2 letters to try, then a subscription. Rejected alternatives (all offered): 1 free letter, 2 per book, locking existing letters, export needing membership, each family author paying, removing free trials.
- **Docs changed.** DECISIONS D-051; this file; C; TDD 08 (section 14 TODO); ROADMAP section 9; ADR 0013 and 0007 notes; website runbook, web and research notes. **Owner action (content, legal, counsel):** the promise line `plus.promise`, `plus.sheet`, `plus.lapsed`, store description, site FAQ, Subscription terms "What stays free", in-app disclosures; counsel review. **Owner action (engineering):** TDD 08 section 14. **Owner action (analytics):** limit-moment events.
- **Risk to flag.** Apple review and consumer-protection exposure of a paywall that appears after the first 2 letters; unverified, counsel and App Store review notes (ROADMAP section 9).

### K-45. Early-tester offer codes through Apple (founder intent, 4 Oct 2026; D-052)
- **Decision.** The founder wants free months (for example 6) for early testers, neighbours and friends through an offer-code feature. Recommended mechanism: Apple offer codes and StoreKit's redemption sheet, with `OFFER_REDEEMED` mapped on the server; no code system of ours (App Review 3.1.1). New PRD-REQ-027. Whether exactly 6 months is available, whether the free period converts and can be switched off, and whether TestFlight testers need codes are unverified (`docs/ops/OFFER_CODES.md`).

### Owner follow-ups (not editable by product)
| Owner | Action | Entry |
|---|---|---|
| Data architect | Migration dropping `safety_events`, its policy and index; DATA-REQ-061 to "not applicable"; data-policy row | K-06 |
| Data architect | Author-only `raw_transcript`, `machine_edits`, `stt_meta` via security-barrier view; access and parity tests | K-09 |
| Data architect | `children.created_by on delete set null` before any non-founder data (draft migration has it) | K-22 |
| Data architect | `create_child` Plus rule, `entitlements`, `book_has_plus`, `child_member_prefs`, per-child sync streams and cross-child leak test | K-12, K-28 |
| Data architect | DATA_CLASSIFICATION.md uses L1 to L4 as in section 7.10; every analytics property L2 | 7.10 |
| Legal, privacy counsel | Privacy Policy section 12 sentence (K-10) and summary line (K-29); ENGINEERING_REQUIREMENTS LEGAL-REQ-033 hash retention to 90 days and LEGAL-REQ-047 table to the K-04 schedule; approve analytics consent copy | K-04, K-10, K-18, K-29, K-01 |
| Legal, terms counsel | Subscription terms "What stays free" and in-app-disclosures `subscriptionLine`: "listening" to "playing your recordings", add "books for more children are part of Plus"; disclosure placeholders | K-11, K-12, K-31 |
| AI engineer | Prompt selector in `packages/core` never serves `together` prompts while `child-input` is off; safety tiers stored locally only | K-19, K-06 |
| Analytics engineer | ADR 0008 opt-in wording; `docs/analytics` catalogue; PRD-REQ-016 to 018 | K-01 |
| Mobile engineers | One ask per session; switcher; per-child settings; first-run twins flow with no Plus sheet; beta label only in About | PRD-REQ-001, K-12, K-13 |
| Design leads | "tidy" wording decision; DESIGN_LANGUAGE real-name example | K-26, K-27 |
| Mobile engineers | 18+ entry gate and stop screen (`ageGate.*`), no local-only mode; sensitive-data consent screen (`sensitiveConsent.*`); recordings row conditional on backup (`settings.recordings.backedUp*`); `joinedNote` in Add a child; Read together count from remote config | K-07, K-15, K-21, PRD-REQ-015, PRD-REQ-020 |
| Data architect | `create_child`: count only books the caller started; first-run batch exemption; `read_together_free_sessions` remote config key | PRD-REQ-015, PRD-REQ-020 |
| Legal, terms counsel | Terms 12.1 adds cloud transcription as an exit; confirm print deferral wording (Terms 1.3.0) | K-33, K-32 |
| Brand owner | `packages/content/BRAND.md`: remove "Printed books ... come later" or mark it roadmap; "by default" on on-device transcription | K-32, K-21 |
| Analytics engineer | `docs/analytics/TRACKING_PLAN.md`: lifecycle totals from the entitlement ledger and App Store Connect, not RevenueCat | K-34 |
| PRD C owner | C-REQ-021, C 4.2 refunds row, C-REQ-025, C-REQ-026 follow ADR 0013 and K-38; add PRD-REQ-022's account-first purchase rule to C | K-34, K-38 |
| PRD B owner | B F6 (web page) marked v1.1; invite flow F5 for in-app contributors; contributor child-data view (D-039) | K-35 |
| PRD A owner | Welcome screen replaces the story intro at v1.0; Google sign-in v1.1 | D-043, D-044 |
| Data architect | `book_access`, approvals, client ids, consent gates, billing tables `app_account_tokens`, `store_subscriptions`, `store_notifications` (BACKLOG M1, M5, M8) | K-34, K-35, K-39 |
| Payments engineer, mobile, data architect | Letter allowance gate, server enforcement, `free_letters_allowance` config, never-discard rule, free-tier tests, Redeem a code row and `OFFER_REDEEMED` mapping (TDD 08 section 14) | K-44, K-45, PRD-REQ-024 to -027 |
| Content, legal, counsel | Replace the "free, always" promise line everywhere (`plus.promise`, `plus.sheet`, `plus.lapsed`, store description, site FAQ), Subscription terms "What stays free", in-app disclosures, offer-code wording, App Store review notes; counsel review | K-44, K-45 |
| Founder | D-023 by 16 Oct; D-032 by 23 Oct; D-030 before the listing; D-004 hedge by 27 Nov; domain in week 1 | K-36, K-37, K-39, K-40 |

---

## 6. Launch acceptance checklist (P0 only)

Each line is a pass or fail test. Automated tests are marked [auto]; manual scripts [manual]. The release is blocked until every line passes on an iPhone SE (3rd gen) and a current-generation iPhone.

### 6.1 Entry and account
- [ ] [auto] Cold start never waits on network: with airplane mode on, the first route renders and the splash hides (A-REQ-002).
- [ ] [auto] Fresh install: user saves a first letter with no sign-in, no OS permission prompt other than the microphone, and no network request to PostHog or Sentry (A-REQ-012, LEGAL-REQ-003, LEGAL-REQ-007).
- [ ] [auto] (1.3) The welcome screen is one VoiceOver-navigable page with Start a book, I was invited and Sign in reachable at AX5 (A-REQ-005, D-043). ~~Story intro auto-advance check (A-REQ-007)~~ moves to v1.1 with the stories.
- [ ] [auto] After the first save, the Keep the book sheet opens with Apple, Email and Later (Google in v1.1, D-044); Later keeps record, review, save, book, export working (A-REQ-013, A-REQ-014).
- [ ] [auto] Fresh install: before any first-run screen, story 4 action or invite flow, the app asks "Are you 18 or older?" with nothing preselected (PRD-REQ-019, LEGAL-REQ-002).
- [ ] [auto] Answering No (or an under-18 Declared Age Range signal) shows the stop screen; no child row, letter, recording, dictionary term, auth user or network request exists afterwards; there is no path to record or write; relaunching within 24 hours shows the stop screen again (PRD-REQ-019).
- [ ] [auto] Answering Yes stores only a boolean on the install (no age or birth date anywhere on the device or server) and the gate never shows again on that install (PRD-REQ-019).
- [ ] [auto] The sign-in sheet shows the Terms line with the 18+ confirmation; the `terms` acceptance row carries `age_attested: true` (K-07, LEGAL-REQ-001).
- [ ] [auto] Account creation writes one `policy_acceptances` row for `terms` before any other row syncs, then shows the sensitive-data consent; declining leaves zero uploaded entries (LEGAL-REQ-001, LEGAL-REQ-006).
- [ ] [auto] Local letters, children and dictionary move to the new user id in one transaction; a forced failure changes nothing (A-REQ-015).
- [ ] [auto] Email: one message with link and 6-digit code; either signs in; both expire in 1 hour; the browser page does not verify on load (A-REQ-018, A-REQ-023).
- [ ] [manual] Auth and `/i/` links open the app from Mail, Gmail, Outlook and Messages (A-REQ-022).
- [ ] [auto] Sign out or Apple revocation never discards an unsynced letter (A-REQ-033).

### 6.2 First run, family, privacy
- [ ] [auto] Only name plus birthday or due date are required; nothing asks for surname, gender, photo or contacts (B-REQ-001).
- [ ] [auto] A Hindi plus Devanagari choice transcribes with Hindi enabled and renders Devanagari, untranslated (B-REQ-003).
- [ ] [auto] A contributor calling invite creation is rejected; a parent invite carries an explicit role (B-REQ-007; `create_child_invite` fix, LEGAL-REQ-024).
- [ ] [manual] (1.3) A grandparent invited as Family installs the app from the invite link, passes the 18+ gate, signs in, and saves a first letter to the named child's book; both parents see it as pending (B-REQ-007, B-REQ-009, K-35).
- [ ] [auto] (1.3) An invite names exactly one child; the Family member sees nothing of a sibling's book; a contributor without "Family can read" sees only their own letters (PRD-REQ-014, B-REQ-011).
- [ ] [auto] (1.3, if D-032 is approved) A parent plays a contributor's recording from a shared book on their own phone; a Free single-member book uploads no audio; deleting the letter removes the cached copy on the next sync (PRD-REQ-021).
- [ ] ~~[manual] A grandparent without the app records ... in iOS Safari and Android Chrome (B-REQ-008, LEGAL-REQ-010).~~ v1.1 (K-35).
- [ ] ~~[auto] A web page load sends nothing but the invite token check until Send (K-08).~~ v1.1 (K-35).
- [ ] [auto] A contributor's letter is pending for both parents, invisible to other contributors, and no control edits it (B-REQ-009).
- [ ] [auto] A parent calling `delete_entry()` on another author's letter fails; no UI offers it (DATA-REQ-015).
- [ ] [auto] Deleting the account of the parent who created a book leaves the co-parent's and contributors' letters intact (DATA-REQ-012).
- [ ] [auto] A book member who is not the author receives no `raw_transcript`, `machine_edits` or `stt_meta` for that entry through the API or sync (PRD-REQ-004).
- [ ] [auto] Hiding a book removes every reminder, month, birthday and celebration notification for that child on every member device within one sync (B-REQ-014).
- [ ] [auto] Due date passes without a birth date: no notification or card mentions it (B-REQ-015).

### 6.3 Capture and fidelity
- [ ] [auto] Every machine edit passes `verifyEdits`; `raw_transcript` update fails at the database (CLAUDE.md; DATA-REQ-040).
- [ ] [auto] The "Please have a read" card shows once, after the first spoken transcript and before the first save, and never for typed letters (K-14).
- [ ] [auto] Recording stops and is saved when the app is backgrounded (LEGAL-REQ-011 behaviour, required for P0 data safety).
- [ ] [auto] A tier-2 safety phrase produces no server row, request or event containing a tier (LEGAL-REQ-015; `safety_events` table absent).
- [ ] [auto] With the `child-input` flag off, no `together` prompt and no "Write one together" entry point is reachable (PRD-REQ-005).

### 6.4 Reminders and celebrations
- [ ] [auto] No OS notification prompt appears before the first letter; the priming card appears on a later Tonight view, never in the same session as the Keep the book sheet (C-REQ-001, PRD-REQ-001).
- [ ] [auto] Default schedule delivers at most 2 reminders plus 1 month-age note in a quiet week; none between 21:30 and 07:00 (C-REQ-002, C-NFR-001).
- [ ] [auto] A save at 19:00 suppresses the 20:30 slot (C-REQ-004).
- [ ] [auto] Content test fails on "daily", "every day", "in a row", "missed", "streak" or day counts in reminder strings (C-REQ-005; K-03).
- [ ] [auto] Muting Reminders still delivers family-letter notifications (C-REQ-007).
- [ ] [auto] Milestones render as inline Book cards once per reader; no modal, push or confetti (C-REQ-010).

### 6.5 Plus
- [ ] [auto] The Plus sheet never appears at launch, during recording or export, in the Book list, on a birthday, or during first run (C-REQ-023, K-12).
- [ ] [auto] Neither plan is preselected; price, period, auto-renewal, trial end date (if eligible) and cancel route are visible at default size and wrap at AX5 (C-REQ-022, LEGAL-REQ-046).
- [ ] [auto] A trial-ineligible user sees no "free" wording (C-REQ-022). *(Still holds; with D-051 the lapsed-user sheet wording is open edge 8.)*
- [ ] [auto] Notice scheduler with clock control sends exactly the K-38 schedule over a synthetic year: annual renewal inside `[E-31d, E-30d]` and `[E-8d, E-6d]`; annual-plan trial inside `[E-21d, E-16d]` and `[E-5d, E-4d]`; monthly trial inside `[E-8d, E-5d]` and `[E-5d, E-4d]`; one push only with the final trial notice; annual reminder for a 12-month monthly subscriber; nothing outside a window; a cancelled renewal skips its pending notices (PRD-REQ-003, LEGAL-REQ-047).
- [ ] [auto] Each purchase writes one `started` and exactly one `completed` `auto-renewal-terms` acceptance matching the App Store transaction (LEGAL-REQ-049, D-049).
- [ ] [auto] A signed-out user tapping a Plus feature sees the Keep the book sheet before any Plus sheet; a contributor never sees the Plus sheet; no offer appears in a book covered by the other parent (PRD-REQ-022).
- [ ] [auto] A forged or duplicated App Store notification changes nothing (JWS verification, `notificationUUID` dedupe, state re-read from the App Store Server API) (ADR 0013).
- [ ] [auto] With the entitlement service unreachable and a lapsed account, write, read, play, export and download backed-up audio all succeed with no Plus UI (C-NFR-004, LEGAL-REQ-050). *(Amended 4 Oct 2026, D-051: "write" now means reading existing letters; adding a new letter needs Plus. Read, play, export and download of backed-up audio stand.)*
- [ ] [auto] A lapsed user keeps both child books writable; creating a third shows the Plus sheet (C-REQ-028). *(Amended 4 Oct 2026, D-051: superseded for new letters; see the new items below.)*
- [ ] [auto] (1.4, D-051) An account with 2 saved letters and no Plus: the third save opens the Plus sheet; the server refuses a bypassed third letter; the in-progress letter is still on the phone and is saved when Plus starts (PRD-REQ-024, -025; edge 3 recommended, not decided).
- [ ] [auto] (1.4, D-051) A lapsed or never-subscribed account with many letters: every existing letter reads, plays and exports with no Plus UI and with the entitlement service unreachable (PRD-REQ-026).
- [ ] [auto] (1.4, D-051) Changing `free_letters_allowance` changes the limit without a release (PRD-REQ-024).
- [ ] [manual] (1.4, D-052) Redeem a code in Settings > Plan opens the StoreKit sheet; a sandbox offer code gives Plus with its real end date within the usual refresh time (PRD-REQ-027; unverified until built).
- [ ] [manual] Restore on a new iPhone shows Plus within 10 seconds (C-REQ-020).
- [ ] [auto] An Apple refund webhook removes only the entitlement (C-REQ-029).
- [ ] [auto] A Free book allows exactly `read_together_free_sessions` (default 3) Read together sessions; the next tap opens the Plus sheet; changing the remote value changes the limit without a release; single-recording playback is never limited (PRD-REQ-020).

### 6.6 Settings, data, deletion
- [ ] [auto] Every Settings row, including each consent and Export and Delete, is reachable in 2 taps or fewer (C-REQ-016, LEGAL-REQ-008).
- [ ] [auto] A lapsed, offline user exports a ZIP with every own entry (raw transcript, edits, final text), audio, photos, PDF and `account.json`; family letters have no raw transcript (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050).
- [ ] [auto] Account deletion: export offered first, subscription notice with manage link before confirm, 30-day undo, then a cross-system verification script finds no remaining rows or objects except pseudonymised acceptances and the suppression hash (C-REQ-019, LEGAL-REQ-029).
- [ ] [manual] `https://<domain>/delete-account` explains in-app deletion and accepts a deletion request by email, handled by the runbook within LEGAL-REQ-031 times (v1.0 reading of LEGAL-REQ-030, D-042; the full web flow ships before Android).
- [ ] [auto] Purge job deletes tombstones older than 30 days; backups bound to 7 days (LEGAL-REQ-031, DATA-REQ-030).
- [ ] [auto] Settings > Help and Legal > About shows the beta label and body; no beta string appears on Tonight, Listening, Review, Book, intro, sign-in or Plus screens (K-13). The label has no date, version or metric switch; only a release removes it (K-13, founder 2 Oct).

### 6.7 Store, legal, content
- [ ] [auto] `packages/content` tests pass: no em or en dashes, curly quotes, ellipsis characters or emoji; no "kids" keyword or child-directed phrases; claims registry rule passes (LEGAL-REQ-044, LEGAL-REQ-045).
- [ ] [manual] App Store Connect territories equal {United States}; age rating answered; not in Kids Category (LEGAL-REQ-058, CR-002).
- [ ] [auto] Privacy labels and `PrivacyInfo.xcprivacy` match the data map for this build; evidence saved (LEGAL-REQ-042, LEGAL-REQ-043).
- [ ] [auto] CI denylist finds no ad, attribution or tracking SDK and no AdSupport or AppTrackingTransparency import (LEGAL-REQ-016).
- [ ] [auto] Log canary scan finds zero fixture names, letter text or tokens in any log, URL, push payload or analytics event (LEGAL-REQ-014).
- [ ] [auto] AI gateway returns 403 without an active `ai-processing` consent and for any `source='web'` entry without the contributor's own consent (LEGAL-REQ-004, LEGAL-REQ-005).
- [ ] [manual] Terms, Privacy Policy (with the K-10 sentence fixed), Subscription terms and Consumer Health Data Privacy Policy are published at versioned URLs and linked in-app and in the store listing.
- [ ] [manual] `packages/brand` has the real domain, support email and privacy URL; no `example.com` anywhere in the build; the publisher legal name appears in the published legal documents and App Store Connect only, never in code (PRD-REQ-023, K-36).
- [ ] [manual] (1.3) The store listing and promotional text contain no "beta" wording unless the founder keeps it against K-37; the category is Lifestyle; review notes describe a family memory journal that does not require health information (K-36, K-37).
- [ ] [auto] (1.3) No string in the iOS app or its store metadata names another mobile platform or store (App Review 2.3.10).
- [ ] [auto] No product, store or website string mentions printed books, print or ordering a book (K-32).

### 6.8 Children (multi-child)
- [ ] [auto] With two children, "To {child}" shows while recording and in Review; changing it in Review saves to the chosen child only (PRD-REQ-012).
- [ ] [auto] A Free user with one book: Add a child reaches the Plus sheet in 3 taps; the server rejects `create_child` without Plus even if the client is bypassed (PRD-REQ-015). *(Amended 4 Oct 2026, D-051: under review, open edge 2.)*
- [ ] [auto] First run with several children added together (twins, or siblings with different dates): one book each, no Plus sheet, no paywall request; the server accepts every `create_child` in that first-run batch without Plus (PRD-REQ-015). *(Amended 4 Oct 2026, D-051: under review, open edge 6.)*
- [ ] [auto] A Free co-parent who joined one book and started none can start one book without Plus; starting a second needs Plus; the server enforces both (PRD-REQ-015). *(Amended 4 Oct 2026, D-051: under review, open edge 6.)*
- [ ] [auto] A co-parent of a book whose other parent holds Plus gets Plus features in that book with no purchase (K-28).
- [ ] [auto] Nani invited to Asha's book only receives no row, photo, member or audio from the sibling's book through API or sync (PRD-REQ-014).
- [ ] [auto] Turning off "Include {child} in my reminders" removes reminders, month-age and birthday notes naming that child for that person only (PRD-REQ-013).
- [ ] [auto] Pause celebrations for one child by one parent leaves the other parent's celebrations on (PRD-REQ-013).
- [ ] [auto] Every per-child setting is 2 taps or fewer from Settings (Children, then the child) (PRD-REQ-013).

### 6.9 Analytics
- [ ] [auto] Fresh install through first letter, Keep the book and reminder prime: zero requests to PostHog or Sentry hosts and no event queued on disk (PRD-REQ-016, LEGAL-REQ-003).
- [ ] [auto] The consent sheet is the third ask, never in the same session as another ask, with no option preselected (PRD-REQ-001).
- [ ] [auto] Every event type in the catalogue validates against its typed schema; `before_send` drops unknown properties and strings over 40 characters; the canary family "Asha" never appears (PRD-REQ-016, LEGAL-REQ-017).
- [ ] [auto] Withdrawing consent in Settings > Privacy stops sending within the session (PRD-REQ-018).
- [ ] [auto] Server aggregate job reports accounts, books, letters, trials and conversions with no device analytics (PRD-REQ-017).

### 6.10 Non-functional gates
- [ ] [auto] Every budget in section 7 marked "gate" is met in the release candidate's performance run.
- [ ] [auto] `npm test`, `npm run test:db` (access and parity tests) and `npm run typecheck` pass.

---

## 7. Non-functional requirements summary

Reference devices: **iPhone SE (3rd gen)** for budgets, plus a current iPhone; Android budgets (mid-tier 60 Hz device) apply when Android ships. Percentiles are over a release-candidate performance run of at least 200 samples per metric unless noted. "Gate" means a launch blocker.

### 7.1 Launch and screen speed
| Metric | Budget | Gate | Source |
|---|---|---|---|
| Cold start to first interactive frame | p50 1.2 s, p90 2.0 s (Android p50 2.0 s, p90 3.0 s) | Yes | A-NFR-001 |
| Warm start | p50 400 ms | Yes | A-NFR-001 |
| Screen transition (push, sheet, tab) | Starts within 100 ms of tap; completes within 350 ms; no dropped frames over 16.7 ms on the UI thread | Yes | A-NFR-003, MO |
| First-run screens interactive | 300 ms or less | Yes | B-NFR-008 |
| Settings open | Under 300 ms | Yes | C-NFR-007 |
| Plus sheet with cached prices | Under 1 s | Yes | C-NFR-007 |
| Tap record to microphone live | p95 500 ms | Yes | New |
| Local save commit (row plus fsynced audio) | p95 200 ms | Yes | DATA-REQ-048 |
| Book chapter of 60 letters renders | p95 500 ms | No | New |
| Switch child (tap in "Whose book?" to the other book interactive) | p95 300 ms, offline included | Yes | PRD-REQ-012 |
| Add a child to Plus sheet (cached prices) | Under 1 s | Yes | PRD-REQ-015 |
| 1-year export (about 230 MB) offline | Under 2 minutes on iPhone SE 3 | Yes | C-NFR-007 |

### 7.2 Server latency by endpoint class (measured at the client, US, good LTE)
| Class | Examples | p95 | p99 | Gate |
|---|---|---|---|---|
| Auth token exchange | `signInWithIdToken`, `verifyOtp` | 1.5 s | 3 s | Yes |
| Read RPC and REST (RLS) | `policy_actions_needed`, invite lookup, member list | 300 ms | 800 ms | Yes |
| Write RPC | `accept_child_invite`, `create_child_invite`, `review_family_letter`, `leave_child` | 500 ms | 1.2 s | Yes |
| Sync upload batch | Outbox push RPC (or PowerSync `uploadData` if D-023 is declined), up to 50 ops as one bulk upsert | 800 ms | 2 s | Yes |
| Edge Function, light | invite redemption, escrow unwrap, notice scheduler calls | 600 ms | 1.5 s (cold start included) | Yes |
| Server transcription gateway (consented only) | up to 2 minutes of audio | 4 s | 10 s | No |
| Storage upload start | signed URL plus first byte of audio upload | 1 s | 2.5 s | No |
| Store notification processing | App Store Server Notification V2 to entitlement row (re-read from the App Store Server API) | 5 s | 60 s (reconcile) | Yes |
| Entitlement active after store success | client sees Plus | 5 s | 10 s | Yes (C-NFR-002) |
| Web contribution page (v1.1) | LCP on 4G, page weight | LCP 2.5 s; 300 KB or less | | Yes when it ships (B-NFR-008) |

Error budget: server 5xx rate under 0.1% per endpoint class per day; auth success 97% per method weekly (A-NFR-013).

### 7.3 Sync
| Metric | Budget | Gate |
|---|---|---|
| Letter saved on one device visible on a co-parent's online device | p95 5 s, p99 30 s | Yes |
| Family letter from the web page reaches a parent's pending list | p95 60 s | Yes |
| Hide book, delete letter, removal propagate to all member devices | Within one sync; p95 60 s online | Yes |
| New phone: book list and child visible after sign-in | p95 10 s | Yes |
| New phone: all text for one year (about 240 entries) | p95 30 s on LTE | Yes |
| Backed-up audio restore | Background, resumable; shows "Preparing voice" until ready | No |
| Sync never blocks recording, review, save or reading | Always | Yes |

### 7.4 Offline behaviour
- Works fully offline: launch, intro, first-run profile, record, on-device transcription (once the model is on the phone), review, save, book, playback of local audio, Read together on local audio, export, local reminders, settings that do not need the server.
- Before the on-device model is ready (574 MB, downloads after first run, Wi-Fi by default, resumable): typed letters work; spoken letters save the audio and transcribe when the model arrives, or via server transcription only with consent.
- Needs network, with honest copy and nothing lost: sign-in, invites, approvals (queued visibly), backup and shared voice uploads, purchases and restore, web contribution (v1.1).
- Queued writes survive app kill and reboot; "Not sent yet" state is visible; zero data loss in a kill-during-save test (500 iterations, gate).

### 7.5 Stability
| Metric | Budget | Gate |
|---|---|---|
| Crash-free sessions | 99.8% or more | Yes |
| Crash-free users (7-day) | 99.5% or more | Yes |
| Letters lost or silently changed | Zero, ever (durability attribute 1) | Yes |
| Auth crashes losing a local letter or invite token | Zero | Yes |
| Purchase error rate | Under 1% | Yes (C-NFR-002) |

Crash metrics come from consenting users only (K-01); TestFlight crash reports and App Store Connect metrics cover the rest.

### 7.6 Accessibility
- WCAG 2.2 AA on the app, website, web contribution page, legal pages, paywall and HTML emails (LEGAL-REQ-051). Gate.
- Dynamic Type to AX5 on every screen; text never truncates; prices and terms wrap (A-NFR-005, C-NFR-006).
- Touch targets 44 pt (56 pt primary); web 48 px.
- Contrast 4.5:1 body text, 3:1 large text and controls, both themes.
- VoiceOver and TalkBack complete every P0 flow in the manual script; focus moves to sheet titles; errors announced.
- Reduce Motion honoured everywhere (200 ms fades); no time limit without a control (WCAG 2.2.1, 2.2.2).

### 7.7 Battery, storage, background
| Metric | Budget |
|---|---|
| App download size (without speech model) | 80 MB or less |
| Speech model | 574 MB, separate download, Wi-Fi default, resumable, removable in Settings; low-memory devices use the 190 MB model (ARCH) |
| Audio on disk | About 0.48 MB per minute (AAC 64 kbps mono) |
| Caches (excluding user content and model) | 50 MB or less, purgeable |
| On-device transcription of a 2-minute letter | 30 s or less wall clock and 2% battery or less on iPhone SE 3 (**Unverified**; Phase 0 measures and may switch the default model) |
| Background energy | No background work except OS-scheduled sync and local notifications; idle drain from the app 1% per day or less |
| Low storage | Warn below 1 GB free before recording a long letter; never fail a save silently |
| Analytics (consenting users) | Batched, sent at most every 60 s in the foreground and on background; queue capped at 1 MB; no wake-ups of its own; about 150 events per active user per month or fewer |

### 7.8 Load targets
Assumptions from ARCH section 7: 2.2 members per family; 20 entries per family per month; evening peak 10 times the daily average; 5% of MAU connected at the evening peak.

| Target | 1k families (launch) | 100k families (end of year 1) |
|---|---|---|
| MAU | 2.2k | 220k |
| Concurrent sync clients at peak | 200 | 11k |
| Entry writes, peak sustained 15 min | 5 per second | 50 per second |
| Write RPCs (invites, approvals) | 2 per second | 20 per second |
| Encrypted audio uploads (Plus backup and web) | 1 per second | 10 per second |
| Store webhooks | 10 per minute | 300 per minute |
| Notice emails (trial, renewal) | 100 per day | 5k per day |
| Children's books (1.3 per family assumed) | 1.3k | 130k |
| Analytics events (40% consent assumed, 150 per user per month) | about 130k per month | about 13M per month (above PostHog free tier; cost accepted by the founder, 2 Oct 2026) |
| Database size | Under 8 GB | About 150 GB |
| Cumulative backed-up audio | About 115 GB | About 11.4 TB |

All section 7.2 budgets must hold at these loads. Load-test at **2 times the 100k targets** in staging before the product passes 25k families; load-test at 2 times the 1k targets before public launch (gate). PowerSync concurrent-client plan must be sized before passing 1k concurrent clients (only if D-023 is declined and PowerSync is used).

### 7.9 Security and privacy (summary)
TLS 1.2 or later everywhere, no ATS exceptions (LEGAL-REQ-021); RLS on every table with access and parity tests (LEGAL-REQ-024); tokens in Keychain or Keystore only (A-NFR-008); content never in URLs, logs, pushes or analytics (LEGAL-REQ-014); no ad or tracking SDKs (LEGAL-REQ-016); kill switches effective within 5 minutes (LEGAL-REQ-040).

### 7.10 Data classification enforcement
Founder decision: four levels. `DATA_CLASSIFICATION.md` (in progress) is the authoritative definition; until it lands, this mapping from the data-policy classes applies.

| Level | Meaning | Includes (examples) | Maps from | Handling floor |
|---|---|---|---|---|
| **L1 Public** | Meant for anyone | Store listing, website, prompts, published legal documents, book layouts | (new) | Reviewed by content tests and counsel before publishing |
| **L2 Internal** | Operational, no personal content | Allowlisted analytics events with random id, crash reports, service metrics, content-free audit events, config, purge ledger | T, parts of A | No email, name or content; random id only; retention 90 days to 24 months per data-policy |
| **L3 Confidential (PII)** | Identifies a person | Email, display name, signature, relation, memberships, invite and return-link hashes, entitlements and purchase records, support messages without letter content, auth logs with IP | A | RLS or service role only; never in analytics, logs or URLs; deleted or pseudonymised at account deletion |
| **L4 Restricted (encryption required)** | Content, sensitive data and secrets | Letter text, raw transcripts, machine edits, versions, audio, photos, dictionary terms, child name and birthday or due date, languages, goals, sealed dates, encryption keys and wrapped keys, session and invite tokens, escrow key, Apple refresh token | C, S | Encrypted in transit and at rest on server and device; audio and photos client-encrypted before upload where ADR 0006 applies; keys never leave Keychain or Keystore unwrapped; never in telemetry, logs, push payloads, URLs or support prefill; author-only working material (PRD-REQ-004); deleted on the author's request on the published clock |

Enforcement (all P0, automated unless noted):
1. Every table, column, bucket, device store, SDK, log stream and analytics property has a level in `docs/legal/data-map.yaml`; a migration or new SDK without one fails CI (LEGAL-REQ-012, LEGAL-REQ-041, DATA-REQ-001).
2. A column tagged L4 may not appear in any analytics event type, log format, push payload builder or URL route; the log canary scan proves it (LEGAL-REQ-014).
3. L4 at rest: Supabase Postgres and Storage encryption at rest confirmed in writing (**Unverified** today, LEGAL-REQ-022(c)); device database and files use iOS Data Protection at least "complete until first user authentication"; client-side AES-256-GCM for audio uploads and web contributor audio (B-NFR-005). Release blocks if any L4 store lacks a recorded encryption control.
4. L3 and L4 are reachable only through RLS-protected paths or named service-role runbooks that write an audit row (LEGAL-REQ-025).
5. L2 events pass the allowlist and the 40-character string limit; L2 never carries an L3 or L4 value (LEGAL-REQ-017).
6. Export files are plaintext by design (DATA-REQ-056): the export screen says so, and server-built exports expire in 7 days.
7. Quarterly manual review of the data map against the schema, signed by the founder.
8. Child scope: every L3 and L4 row tied to a child is readable only by that child's members; the cross-child leak test (checklist 6.8) runs in CI (PRD-REQ-014).
9. Analytics: every property is L2; `child_count_bucket` and ordinals are the only child-related values allowed (PRD-REQ-016).

---

## 8. Shipped copy fixed on 2 Oct 2026

Files: `packages/content/src/strings.en.ts`, `store.en.ts`, `site.en.ts`. Tests and typecheck pass (`npx vitest run`: 16 of 16; `npx tsc --noEmit`: clean).

> **Amended 4 Oct 2026 (D-051):** this section records copy fixed on 2 Oct, including promise lines such as "free core plus optional Plus" and "free, always". Those lines are now out of date. Content copy is owned by another agent and was not changed here; see K-44 owner actions.

| Key | Was | Now | Entry |
|---|---|---|---|
| `settings.backup.honestNote` | "Without backup, everything stays only on this phone." | Recordings stay only on this phone without backup; letters sync when signed in | K-21 |
| `settings.backup.body` | Letters and recordings copied, "encrypted" | Recordings encrypted on the phone; recovery key kept unless Vault mode; letters sync separately | K-21 |
| `settings.recordings.onPhoneBody` | Turn on backup to keep a copy | Export or turn on backup to keep a copy (C keep-safe line) | C-REQ-018 |
| `settings.delete.bookBody` | Every letter and recording removed from phone and backup | Sole-parent text plus new `bookBodyCoParent` | K-10 |
| `settings.reminders.*`, `onboarding.reminder.*` | "Daily reminder", "One gentle nudge a day", "One small reminder a day" | A few evenings a week; cadence options added | K-02, K-03 |
| `family.contributorWelcome.privacyNote` | Only {inviter} sees your letters | Only {child}'s parents see your letters until they go in the book | B section 7 |
| `errors.offline.body` | "will back up later" | Saved on this phone | K-21 |
| `about.beta.*` (new) | | Beta label, body and Export a copy | K-13 |
| `review.firstNote.*`, `help.mistakes` (new) | | One-time mistakes note and help line | K-14 |
| `store.keywords` | included "kids" | "kids" removed; "baby" and "parents" added | K-20 |
| `store.description` | "Transcription happens on your phone"; "let them listen on their own"; encrypted backup without qualifier | "by default"; listen together at bedtime; recovery key sentence; promise line; beta line | K-11, K-20, K-21 |
| `site.privacy.points`, `site.faq`, `site.benefits`, `site.readTogether` | Absolute privacy claims; "Only you"; child listens alone; price placeholder only | Accurate exits; family and staff access; together at bedtime; free core plus optional Plus | K-11, K-20, K-21 |

Added in version 1.1 (same day):

| Key | Now | Entry |
|---|---|---|
| `children.switcher.*`, `children.add.*`, `children.settings.*`, `children.sharing.*` (new) | Switcher, add a child with Plus note and keep note, per-child settings, per-child sharing | K-12 |
| `onboarding.child.addAnotherHelp` (new) | Twins line for first run | K-12 |
| `analyticsConsent.*`, `settings.privacy.*` (new) | Opt-in consent sheet and Privacy rows | K-01, K-17 |
| `plus.legal.*`, `plus.promise` (new) | Paywall disclosure from in-app-disclosures section 3 with `{price}` | K-11, K-31 |
| `web.firstNote.*`, `web.ageConfirm` (new) | Web page mistakes note and 18+ confirmation | K-07, K-14 |
| `family.approval.settingLabel` | "on their own" to "automatically" | K-20 |
| `store.description`, `store.promotionalTextBeta` | "A book for each child" section; optional beta promotional text | K-12, K-13 |
| `site.privacy.points`, `site.faq` cost answer | Delete "your own" letters; per-child family lists; more children in Plus | K-10, K-12 |

Added in version 1.2 (2 Oct, founder decisions and Lawyer 2 H4):

| Key | Now | Entry |
|---|---|---|
| `errors.backupFailed.body` | "Your recordings are safe on this phone. Backup will continue when you are back online." | K-21 (row 13) |
| `settingsMore.signedOutHelp` | Letters and recordings, not "everything"; removed with sign-in | K-21 (row 14) |
| `settingsMore.deleteAccountNotYet` | "removes its letters and recordings from this phone"; removed with sign-in | K-21 (row 15) |
| `settings.recordings.onPhoneBody`, `backedUpTitle`, `backedUpBody` (new) | "Without backup, recordings live only on this phone"; backed-up variant shown when backup is on | K-21 (row 16) |
| `site.faq` "Who can see my letters?" | Staff look only for help requests, security or serious misuse, or the law; restricted and logged | K-21 (row 17) |
| `site.privacy.points[4]`, store PRIVATE BY DEFAULT | "No ads. We never sell your data or share it with advertisers." | K-21 (row 18) |
| `site.privacy.points[5]` | "You can export your book, free, at any time." | K-21 (row 19) |
| `site.privacy.points[2]`, `site.faq` recordings | Exits are backup and cloud transcription; family hear backed-up recordings | K-33 (row 20) |
| `settings.privacy.sensitiveHelp`, `sensitiveConsent.*` (new) | Names health details; consent text from CHD policy HN-4 ("train machine learning models" replaces "train AI" for the content rules) | K-15, K-21 (row 21) |
| `onboarding.promise.recordingBody` | Unchanged; marked first-run only (backup cannot be on yet) | K-21 |
| `book.printPrompt` | Removed | K-32 |
| `store.description`, `site.faq` | No print promises; export described as letters, recordings and a PDF; Read together free for 3 sessions then Plus; twins or more added together at setup are free | K-32, K-11, PRD-REQ-015 |
| `children.add.plusNote`, `joinedNote` (new), `twinsHelp` | First book you start is free; joined books do not count; the Add a child sheet makes no twins price promise (that exemption is first run only) | PRD-REQ-015 |

Added in version 1.3 (3 Oct, founder decisions of 3 Oct; `npx vitest run` in `packages/content`: 16 of 16; `npm run typecheck`: clean):

| Key | Now | Entry |
|---|---|---|
| `family.shareMessage.imessage`, `whatsapp` | The invite link opens the free app or helps the invitee get it; no web-page promise in v1.0 | K-35 |
| `plus.legal.cancel` | "...or in your Apple Account subscriptions." (no other platform named in the iOS app; App Review 2.3.10) | K-34 |
| `storeListing.description` (family section) | Family add letters "from the free app on their own phone" | K-35 |
| `site.faq` "Can grandparents add letters?" | Names the free app on their phone | K-35 |
| `web.*` comment, `store.en.ts` header comments | Web page ships in v1.1; store beta strings flagged pending D-030 | K-35, K-37 |
| `packages/brand` | `publisher` (individual, TODO placeholders for name, domain, emails, privacy URL); `company` kept as an alias for existing imports | K-36 |

Not changed in 1.3, waiting for the founder: store beta paragraph and `promotionalTextBeta` (K-37, D-030); recordings claims for shared voice (K-40, D-032); "only on this phone" durability line (K-42, D-033). Not changed, owner tasks: `ageGate.stopBody` brand literal and the retired `ageGate.mistakeButton` (BL-037, D-026); lock-screen-safe notification variants (BL-157, D-025).

Not changed here (owner follow-ups): "tidy" wording (K-26); paywall legal strings from in-app-disclosures section 3, which need the content test's placeholder allowlist extended with `monthlyPrice`, `annualPrice`, `date` and `period` when C builds the sheet; `BRAND.md` pillar text "On-device transcription only fixes" should gain "by default" at the next brand review.

---

## 9. Questions only the founder can answer

Resolved 2 Oct 2026 (second set of founder decisions; kept for the record):
1. ~~**Read together behind Plus after 3 tries.**~~ **Resolved:** accepted as the default; 3 free sessions, tunable in remote config (PRD-REQ-020, K-11).
2. ~~**Twins exception.**~~ **Resolved:** every child added together in first run stays free (PRD-REQ-015, K-12). See new Q9.
3. ~~**Beta end.**~~ **Resolved:** only when the founder says so; no date or metric trigger (K-13).
4. ~~**Under-18 answer.**~~ **Resolved:** not allowed at all; no local-only mode; a clean stop screen at an 18+ entry gate before first run (PRD-REQ-019, K-07).
7. ~~**Child count for Free.**~~ **Resolved:** a book you joined as co-parent does not count as your free book (PRD-REQ-015).
8. ~~**Analytics budget.**~~ **Resolved:** about 13M events a month at 100k families is accepted (K-01, 7.8).

Still open:

5. **Domain** (company resolved 3 Oct: individual publisher, K-36). Still pending founder choice of the domain. The founder reports earlyletters.com, earlyletters.app and earlyletters.co all available (checked 2 Oct 2026; not re-verified here, and availability can change until registered). This blocks universal links, SMTP, the Apple Services ID, legal URLs, the bundle id, store submission and BL-053; registering the chosen domain (and ideally the other two as defensive redirects) in week 1 is the unblocking step (BL-100).
6. **Overseas grandparents (now a v1.1 question, K-35).** Confirm the web page stays reachable worldwide when it ships (register recommendation). At v1.0 overseas grandparents need the app, which is available only on the US App Store (LEGAL-REQ-058). If counsel later asks for a geo-block, the feature effectively disappears for them; that is a founder call.
9. **First-run sibling scope (confirm the reading).** The decision says twins "or multiple children" added together in first run all stay free. 1.2 applies it literally: any children added in first run, including siblings with different birthdays, are free, which also guarantees no paywall in first run. If you meant only same-date multiples (twins, triplets), say so; the rule becomes one condition in `create_child` and the first-run "Add another child" step must then explain that a sibling with a different date is added later (Plus).
10. **Second consent at first family share (Lawyer 2 HN-4, counsel first).** Washington may need a sharing consent separate from the sync consent. Recommended: one extra tap the first time you invite family or add a letter to a shared book. Product supports it; it waits for counsel's answer. Now on the v1.0 path because family ships at launch (D-050, needed by week 6).

Added 3 Oct 2026 (full entries in `docs/DECISIONS.md`; the founder answers there):

11. **Sync engine** (D-023, K-39): outbox and cursor on expo-sqlite instead of PowerSync, reversing ADR 0004. By 16 Oct.
12. **Shared voice** (D-032, K-40): family hear each other's recordings in v1.0, free; full backup stays Plus. By 23 Oct.
13. **StoreKit direct or RevenueCat** (ADR 0013): recommended StoreKit direct per your direction; override window closes when BL-213 starts (about 9 Nov).
14. **Store beta line** (D-030, K-37): TestFlight beta and no beta line in the listing. Before the listing is written (week 13).
15. **Individual-publisher hedge** (D-004): accept the Guideline 5.1.1(ix) risk, or start an entity in parallel. By 27 Nov.
16. **Beta cohorts** (D-045): friendly-family TestFlight only before submission; public link after. By 4 Dec.
17. **Safety classifier** (D-034): ship only with a clinician's sign-off by 20 Nov, else a static resources row.
18. **Free durability copy** (D-033, K-42): rely on the user's own device backup and fix the "only on this phone" line.

Added 4 Oct 2026 (D-051, D-052; the founder answers in `docs/DECISIONS.md`):

19. **Free-allowance edges** (D-051): do family letters count toward the 2 free letters; what a second child's book gets without Plus; confirm the in-progress letter is never discarded (recommended: keep on the phone, offer Plus); offline entitlement counting, device or server (compare D-037); Read together interplay; first-run children and joined books (D-007, D-008, Q9 above); letters made offline past the limit; lapsed and trial-ineligible wording.
20. **Offer codes** (D-052): confirm Apple offer codes as the mechanism, the length (unverified whether 6 months exists) and who gets them; tell testers about conversion.

Owner actions outside product (tracked, not founder questions): ADR 0008 opt-in wording; ~~LEGAL-REQ-033 and -047 table edits~~ (done 3 Oct, ENGINEERING_REQUIREMENTS 1.1.0); Privacy Policy section 12 sentence; Subscription terms and in-app-disclosures "listening" wording; DESIGN_LANGUAGE real-name example; BRAND.md print line and "by default"; Terms 12.1 cloud transcription exit (K-33).

## Changelog
| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-02 | First integrated PRD: index, conflict log K-01 to K-27, launch checklist, NFR budgets, copy fixes. |
| 1.1 | 2026-10-02 | Founder decisions of 2 Oct: multi-child (K-12 rewritten, PRD-REQ-011 to 015, checklist 6.8), full opt-in analytics (K-01, PRD-REQ-016 to 018, checklist 6.9), Plus per account (K-28), K-29 to K-31, owner follow-up table; B and C revisions actually applied; new copy. |
| 1.2 | 2026-10-02 | Second set of founder decisions of 2 Oct: first-run children free and joined books not counted (PRD-REQ-015), Read together 3 sessions in remote config (PRD-REQ-020), beta ends on founder say-so (K-13), 18+ entry gate with no local-only mode (PRD-REQ-019, K-07), digital only (K-32), analytics volume accepted; Lawyer 2 H4 claims fixed (K-21, K-33, section 8); checklist 6.1, 6.5, 6.6, 6.7, 6.8 updated; section 9 resolved items closed, Q5 updated, Q9 and Q10 added. |
| 1.3 | 2026-10-03 | Founder decisions of 3 Oct: Plus in v1.0 through Apple only with StoreKit 2 direct (K-34, ADR 0013, PRD-REQ-003, -017, -022), family contributors in the app at v1.0 and the web page in v1.1 (K-35), full opt-in analytics confirmed (K-01), individual publisher (K-36, PRD-REQ-023, launch gate 4). TDD 01 to 10 folded in: release tiers (3.0), notice windows replaced (K-38), retention clocks (K-41), TDD resolutions (K-43); recommendations needing the founder (K-37 store beta line, K-39 sync engine, K-40 shared voice as PRD-REQ-021, K-42 durability copy). Checklist 6.1, 6.2, 6.5, 6.7 and NFR 7.2, 7.4, 7.8 updated. Section 9 Q5 narrowed to the domain; Q11 to Q18 added. Companion `docs/DECISIONS.md`, `docs/ROADMAP.md` (submission Mon 11 Jan 2027). |
| 1.4 | 2026-10-04 | Founder decisions of 4 Oct: Plus is membership with 2 free letters per account and existing letters always open (D-051, K-44, PRD-REQ-024 to -026; PRD-REQ-015, -020, -022, K-11, K-12, K-28, C-REQ-017 and section 4 amended in place); early-tester offer codes through Apple (D-052, K-45, PRD-REQ-027); questions 19 and 20; checklist items added. Eight open edges not decided. |
