# Early Letters: Launch PRD (integrated)

Owner: lead PM. Version 1.0, 2 Oct 2026. Status: integrated draft for founder sign-off.
Codename `scribe`. Public name from `packages/brand` only.

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

**Launch shape (founder decisions, 1 Oct 2026):**
- **US App Store first.** iOS only at launch; every pattern must port to Android unchanged (one Expo codebase). US storefront only (LEGAL-REQ-058); the web contribution page stays reachable worldwide for invited family.
- **Free forever core:** write, read, play back recordings, export, family authors.
- **Plus:** $3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial. Lifetime at about $99.99 later (P2).
- **Beta product** with light, standard "it can make mistakes" disclosures (section 5, K-13 and K-14).
- **Data classification:** L1 Public, L2 Internal, L3 Confidential (PII), L4 Restricted (encryption required). Section 7.10.

**What this integration changed** (full reasons in section 5):
1. Analytics and crash reporting are **opt-in**, asked after the first letter (Apple 5.1.1(ii)).
2. One permission or consent ask per session after the first letter, in a fixed order: Keep the book, then reminders, then analytics.
3. Default reminders are **a few evenings a week**; every "daily" string is gone.
4. California ARL notice schedule: annual renewal at **30 and 7 days**; annual-plan trial at **18 and 3 days**; monthly trial at **7 and 3 days**.
5. **90-day** shutdown notice everywhere.
6. Safety tiers stay **on the device**; the server `safety_events` table is dropped.
7. **18+ age gate** at account creation and on the web page, with Apple Declared Age Range for Texas.
8. **Anonymous sessions on the web contribution page only**, never in the app.
9. Raw transcripts and machine edits are **author-only**.
10. Nobody deletes another person's words; the Privacy Policy line that says parents can "delete everything in their child's book" must change.
11. Read together after 3 tries and a second child's book are **Plus, provisionally**, pending founder answers (section 9).
12. Child-directed store copy and the "kids" keyword are removed; child-voice features sit behind a counsel flag.
13. The beta label lives in Settings > Help and Legal > About and the store description only.

---

## 2. Scope

### 2.1 In scope for launch (P0 unless noted)
| Area | What ships | Appendix |
|---|---|---|
| Entry | Branded splash, 4-story intro (remote switch to 3 or none), first letter before account, Keep the book sheet, Apple/Google/email sign-in, magic link plus code, invites by link or code, offline entry | A |
| Consent | Terms acceptance record, 18+ gate, sensitive-data consent, analytics opt-in, AI-processing consent (server ASR, opt-in), web contributor notice | A, legal |
| First run | Child name plus birthday or due date, signature, languages and Hindi script, goals, dictionary from names | B |
| Capture | Speak or type, on-device transcription, faithful edits with diff, one-time "it can make mistakes" card, save offline | ARCH, core, legal |
| Family | Co-parent and Family roles, invites, web contribution page (no install), approvals, leave and remove with letter retention, visibility model, private by default | B |
| Book | Month chapters, Before You, Read together (3 free tries; Plus after, provisional), quiet milestones, birthdays and month-age notes | B, C |
| Habit | Primed notification permission after the first letter, a few evenings a week default, smart quiet window, back-off (P1) | C |
| Plus | Monthly and annual products, per-book entitlement, paywall disclosures, notices, grace, lapse, restore, refunds | C |
| Data | Export everything (free, offline), Recently deleted with 30-day undo, delete book, delete account (in-app and web), deletion SLA | C, legal |
| Settings | All controls within 2 taps, Privacy consents list, Legal list, About with beta label | C, legal |
| Store | US-only listing, adult-facing metadata, privacy labels and manifest generated from the data map | legal |

### 2.2 Out of scope for launch
Android build (specified, not shipped); lifetime purchase; printed books and print credit; web gift codes; gift a year of Plus (P1); sealed letters (P1); sibling letters and any child-input feature (flagged, counsel); Hindi app UI (P2); passkeys, SMS, passwords; child accounts; EU, UK, India, Canada storefronts; server-side LLM edit pass (not on at launch per Privacy Policy section 4).

### 2.3 Launch gates
1. Every item in the launch acceptance checklist (section 6) passes.
2. Every P0 LEGAL-REQ and DATA-REQ passes (they are launch blockers by their own terms).
3. Counsel has reviewed the Terms, Privacy Policy, Subscription terms, in-app disclosures and the claims registry.
4. `packages/brand` holds the real company name and domain (A Q3); universal links, SMTP and the Apple Services ID depend on it.

---

## 3. Unified requirement index

Priority: **P0** launch blocker, **P1** launch target or launch quarter, **P2** later. "Rev" marks a requirement revised by the conflict log (section 5) with the entry number. Full text and acceptance criteria live in the appendix named by the ID prefix.

### 3.1 Section A: entry and sign-in
| ID | P | Area | Requirement | Rev |
|---|---|---|---|---|
| A-REQ-001 | P0 | Launch | Branded splash | |
| A-REQ-002 | P0 | Launch | Splash never waits on network, model or sync | |
| A-REQ-003 | P1 | Launch | Brand moment, 900 ms max, Reduce Motion fade | |
| A-REQ-004 | P0 | Stories | Gestures | |
| A-REQ-005 | P0 | Stories | Skip and Sign in reachable at any text size | |
| A-REQ-006 | P0 | Stories | Timing, pause, story 4 never advances | |
| A-REQ-007 | P0 | Stories | Screen readers | |
| A-REQ-008 | P0 | Stories | Reduce Motion | |
| A-REQ-009 | P1 | Stories | Silent intro | |
| A-REQ-010 | P1 | Stories | Stories show once | |
| A-REQ-011 | P1 | Stories | Remote variant switch | |
| A-REQ-012 | P0 | Account timing | Letter first, no sign-in required | |
| A-REQ-013 | P0 | Account timing | Keep the book sheet after the first letter | K-02 |
| A-REQ-014 | P0 | Account timing | Later works locally | K-11 |
| A-REQ-015 | P0 | Account timing | Re-ownership of local data in one transaction | |
| A-REQ-016 | P0 | Methods | Sign in with Apple on iOS | |
| A-REQ-017 | P0 | Methods | Google sign-in | |
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
| B-REQ-004 | P0 | Children | Multiple children, switcher, "To {child}" | K-12 |
| B-REQ-005 | P0 | Children | Expecting mode and Before You | |
| B-REQ-006 | P0 | Dictionary | Automatic terms from names and signatures | |
| B-REQ-007 | P0 | Family | Invite by link and code with explicit role | K-18 |
| B-REQ-008 | P0 | Family | Web contribution page, no install | K-08 |
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
| B-REQ-022 | P1 | Family | Hindi invite messages and Hindi web page | |
| B-REQ-023 | P1 | Family | Auto-add, thank you, make all private | |
| B-REQ-024 | P1 | Personalization | Author and child photos | |
| B-REQ-025 | P2 | Later | Came-home date; Hindi app UI; leave letters after account deletion | |
| B-NFR-001 | P0 | Privacy | No names, signatures or language names in analytics | K-01 |
| B-NFR-002 | P0 | Privacy | Tokens in URL fragment; hashes only | |
| B-NFR-003 | P0 | Security | RLS mapping with access and parity tests | K-09 |
| B-NFR-004 | P0 | Security | Invite and code rate limits | |
| B-NFR-005 | P0 | Security | Web audio encrypted in the browser | |
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
| C-REQ-009 | P1 | Reminders | Lock-screen name toggle | |
| C-REQ-010 | P0 | Celebrate | Quiet milestones | |
| C-REQ-011 | P0 | Celebrate | Birthdays and month-ages | |
| C-REQ-012 | P0 | Celebrate | Pause celebrations per book | |
| C-REQ-013 | P1 | Celebrate | Year One | |
| C-REQ-014 | P1 | Celebrate | On this day (excludes local safety tiers) | K-06 |
| C-REQ-015 | P0 | Celebrate | Never celebrated list | |
| C-REQ-016 | P0 | Settings | Settings IA, 2 taps max (adds Privacy consents, Legal list, About) | K-13, K-17 |
| C-REQ-017 | P0 | Data | Export, free forever, offline | |
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
| C-REQ-033 | P2 | Plus | Web gift code; printed books outside IAP | |
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
| PRD-REQ-002 | P0 | Consent | **Account creation sequence:** age question, then provider sign-in with the Terms notice, then the sensitive-data consent, then sync. Each step records its own `policy_acceptances` row. | K-07, K-15 |
| PRD-REQ-003 | P0 | Plus | **Notice schedule** in section 5, K-04, driven by RevenueCat webhooks with idempotency keys; email and in-app always, push only on the 3-day trial notice. | K-04 |
| PRD-REQ-004 | P0 | Privacy | **Author-only working material.** `raw_transcript`, `machine_edits` and `stt_meta` are readable only by the author, through a security-barrier view for everyone else. | K-09 |
| PRD-REQ-005 | P0 | Children | **Child-input flag.** `together` prompts, "Write one together" and sibling letters are behind a `child-input` flag that is off in production until counsel signs off (LEGAL-REQ-059). | K-19 |
| PRD-REQ-006 | P0 | Data | **Drop `safety_events`.** A new migration drops the table and its insert policy; tiers live in the local database only. | K-06 |
| PRD-REQ-007 | P0 | Web | **Web contributor identity.** Supabase anonymous sign-in on `apps/web` only, created at the first Send, linked to the invite and a hashed personal return link; linkable to a full account later. | K-08 |
| PRD-REQ-008 | P0 | Content | **Claims pass.** Every claim flagged in compliance register section 3 is rewritten in `packages/content` (done 2 Oct 2026, section 8) and registered in the claims registry before counsel review. | K-21 |
| PRD-REQ-009 | P0 | Legal | **Shutdown pledge.** 90 days' notice, export working throughout, stated identically in Terms 17, Privacy 18, the deletion spec and Settings > Help and Legal. | K-05 |
| PRD-REQ-010 | P0 | Data | **Classification tags.** Every table, column, bucket, device store, log and event carries an L1 to L4 level in the data map; CI enforces section 7.10. | Founder decision |

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
| Free forever core: write, read, play back, export, family authors | C 4.1 table stands; promise line wording per K-11 |
| Plus $3.99/month (1-month trial) or $29.99/year (2-month trial) | C-REQ-021 products `el_plus_monthly_399`, `el_plus_annual_2999` |
| Lifetime about $99.99 later | C-REQ-032 P2 |
| US App Store first, Android later, all patterns Android-workable | Section 2; LEGAL-REQ-058 |
| Beta with light "can make mistakes" disclosures | K-13, K-14; strings added in section 8 |
| L1 to L4 data classification | Section 7.10 |

---

## 5. Conflict log

Each entry: the conflict, the decision, and why. "Docs changed" lists what was edited on 2 Oct 2026; "Owner action" lists what someone else must still change.

### K-01. Analytics consent: Apple 5.1.1(ii) versus PRD A default
- **Conflict.** A section 7 proposed analytics on by default in the US; A-NFR-002 starts analytics after the first frame; ADR 0008 ties `defaultOptIn` to a consent sheet. Compliance register CR-082 and LEGAL-REQ-003 require consent "even if such data is considered to be anonymous". The Privacy Policy already says analytics are off until you say yes.
- **Decision.** Analytics (PostHog) and crash reports (Sentry) are **opt-in**. Nothing leaves the device before a choice. The consent sheet is the third ask under PRD-REQ-001, shown on a later session after the first letter. Declining changes nothing, including Plus. Withdrawal in Settings > Privacy.
- **Why.** Apple's wording is explicit; the Privacy Policy is already written this way; a rejection at review costs more than the lost data.
- **Consequence.** Funnel numbers in A section 10 and C section 9 cover consenting users only. Core business numbers (accounts, letters saved, trials, conversions) come from server-side aggregates (Postgres counts, RevenueCat), which need no device analytics.
- **Docs changed.** A section 7 and A-NFR-002 revised. **Owner action.** ADR 0008: state `defaultOptIn: false` and Sentry opt-in.

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
- **Decision.** A neutral age question ("Are you 18 or older?" with Yes and No, nothing preselected) is the **first step of the sign-in sheet**, before any provider button, and part of Send on the web contribution page. On iOS, call Declared Age Range where required; the result is used in memory and never stored. An under-18 answer or signal: no account, nothing uploaded, a calm "Early Letters is made for adults" message, and the gate stays closed for 24 hours. Local-only use continues (counsel may change this to a stop screen; section 9 Q4). Pre-account local use has no gate because nothing leaves the phone.
- **Why.** The law is in force; the gate costs one tap; putting it before account creation means nothing about a minor ever reaches us.
- **Docs changed.** A section 7, F3, F4 and A-REQ-034 revised.

### K-08. Anonymous web contributor sessions: A says none, B needs them
- **Conflict.** A decision 4: no Supabase anonymous auth in v1, because it needs network at first launch and has a 30 per hour per IP limit. B F6 and section 6 item 12 need an anonymous session plus a personal return link for grandparents without the app. DELETION spec OQ-10 and POLICY_VERSIONING both assume B's model.
- **Decision.** **Split by surface.** The mobile app never uses anonymous auth (A stands). The web contribution page uses Supabase anonymous sign-in, created **at the first Send** (not on page load, per LEGAL-REQ-010), bound to the redeemed invite and the contributor's `child_members` row, with a hashed, revocable personal return link that restores the session on any browser. Anonymous identities are linkable to a full account when the contributor installs the app (manual linking on). Enable Supabase's recommended CAPTCHA for anonymous sign-ins if the per-IP limit or abuse requires it (provider would join the subprocessor list; **Unverified** which provider).
- **Why.** A's two reasons do not apply on the web: the page needs network anyway, and one family's Send rate is far below 30 per hour per IP. A grandparent with no app, no email and no password is the core of B-REQ-008 and UR R14.
- **Docs changed.** A section 0 decision 4 and B section 6 item 12 revised. **Owner action.** Verify anonymous-session role claims and linking (POLICY_VERSIONING note; B "to verify").

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
- **Conflict.** The promise line says "Writing, reading, **listening** and export are free, always", while Read together is Plus after 3 tries (C 4.1). Register item 10 and CR-012. A-REQ-014 lists Read together as working without an account.
- **Decision.** Use "playing your recordings" instead of "listening" everywhere a promise appears: "Writing, reading, playing your recordings, export and family letters are free, always." Playback of any recording stays free; Read together (word highlight, sequenced playback) is the Plus feature after 3 tries, **provisionally** (section 9 Q1). A-REQ-014 reads "Read together within the free tries".
- **Owner action.** Terms short version and 13.1 already say "reading your letters and playing their recordings" (13.1 matches); in-app-disclosures `store.description.subscriptionLine` and Subscription terms "What stays free" should switch "listening" to "playing your recordings".

### K-12. Second child behind Plus (provisional)
- **Conflict.** C 4.1 and OQ6 put each extra book behind Plus; B-REQ-004 is P0 multi-child, UR R3 wants a second book in 3 taps, and B F1 offers "Add another child" for twins during first run, while C-REQ-023 forbids any offer at launch.
- **Decision (provisional).** Adding a later child's book ends at the Plus sheet (3 taps to the sheet). **Twins and multiples added during first run, or any child sharing the first child's birth or due date, are free**, so no paywall can appear in first run. A lapse never closes an existing book (C-REQ-028). Founder confirms (section 9 Q2).
- **Why.** Charging a family because they had twins, at the first minute, is the exact anger pattern in UR section 0 finding 4.

### K-13. Beta label placement
- **Conflict.** None between drafts, but no PRD placed it. in-app-disclosures section 1 and 4 define it; Terms 16.4 backs it.
- **Decision.** The label and body appear **only** in Settings > Help and Legal > About (caption style, no badge colour) and as the last paragraph of the store description. Never on Tonight, Listening, Review, the Book, the intro, the sign-in sheet or the Plus sheet. Not in the app name or subtitle. Optional App Store promotional text may say "Now in beta". All beta strings are removed in the same release that removes Terms 16.4.
- **Docs changed.** `about.beta.*` and the store beta line added (section 8); C-REQ-016 lists About.

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

---

## 6. Launch acceptance checklist (P0 only)

Each line is a pass or fail test. Automated tests are marked [auto]; manual scripts [manual]. The release is blocked until every line passes on an iPhone SE (3rd gen) and a current-generation iPhone.

### 6.1 Entry and account
- [ ] [auto] Cold start never waits on network: with airplane mode on, the first route renders and the splash hides (A-REQ-002).
- [ ] [auto] Fresh install: user saves a first letter with no sign-in, no OS permission prompt other than the microphone, and no network request to PostHog or Sentry (A-REQ-012, LEGAL-REQ-003, LEGAL-REQ-007).
- [ ] [auto] Story intro: with VoiceOver on, auto-advance is off and each story is one element with Next and Previous actions (A-REQ-007).
- [ ] [auto] After the first save, the Keep the book sheet opens with Apple, Google, Email and Later; Later keeps record, review, save, book, export working (A-REQ-013, A-REQ-014).
- [ ] [auto] Sign-in sheet first asks "Are you 18 or older?" with nothing preselected; "No" creates no auth user, uploads nothing, and keeps the gate closed for 24 hours (K-07, LEGAL-REQ-002).
- [ ] [auto] Account creation writes one `policy_acceptances` row for `terms` before any other row syncs, then shows the sensitive-data consent; declining leaves zero uploaded entries (LEGAL-REQ-001, LEGAL-REQ-006).
- [ ] [auto] Local letters, children and dictionary move to the new user id in one transaction; a forced failure changes nothing (A-REQ-015).
- [ ] [auto] Email: one message with link and 6-digit code; either signs in; both expire in 1 hour; the browser page does not verify on load (A-REQ-018, A-REQ-023).
- [ ] [manual] Auth and `/i/` links open the app from Mail, Gmail, Outlook and Messages (A-REQ-022).
- [ ] [auto] Sign out or Apple revocation never discards an unsynced letter (A-REQ-033).

### 6.2 First run, family, privacy
- [ ] [auto] Only name plus birthday or due date are required; nothing asks for surname, gender, photo or contacts (B-REQ-001).
- [ ] [auto] A Hindi plus Devanagari choice transcribes with Hindi enabled and renders Devanagari, untranslated (B-REQ-003).
- [ ] [auto] A contributor calling invite creation is rejected; a parent invite carries an explicit role (B-REQ-007; `create_child_invite` fix, LEGAL-REQ-024).
- [ ] [manual] A grandparent without the app records, plays back and sends in 4 taps or fewer after microphone permission in iOS Safari and Android Chrome, with an 18+ confirmation as part of Send (B-REQ-008, LEGAL-REQ-010).
- [ ] [auto] A web page load sends nothing but the invite token check until Send; the anonymous session is created at Send (K-08).
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
- [ ] [auto] A trial-ineligible user sees no "free" wording (C-REQ-022).
- [ ] [auto] Notice scheduler with clock control sends exactly the K-04 schedule: annual renewal on day 30 and day 7; annual-plan trial on day 18 and day 3; monthly trial on day 7 and day 3; one push only at day 3; annual reminder for a 12-month monthly subscriber (PRD-REQ-003, LEGAL-REQ-047).
- [ ] [auto] Each purchase writes one `auto-renewal-terms` acceptance matching the RevenueCat transaction (LEGAL-REQ-049).
- [ ] [auto] With the entitlement service unreachable and a lapsed account, write, read, play, export and download backed-up audio all succeed with no Plus UI (C-NFR-004, LEGAL-REQ-050).
- [ ] [auto] A lapsed user keeps both child books writable; creating a third shows the Plus sheet (C-REQ-028).
- [ ] [manual] Restore on a new iPhone shows Plus within 10 seconds (C-REQ-020).
- [ ] [auto] An Apple refund webhook removes only the entitlement (C-REQ-029).

### 6.6 Settings, data, deletion
- [ ] [auto] Every Settings row, including each consent and Export and Delete, is reachable in 2 taps or fewer (C-REQ-016, LEGAL-REQ-008).
- [ ] [auto] A lapsed, offline user exports a ZIP with every own entry (raw transcript, edits, final text), audio, photos, PDF and `account.json`; family letters have no raw transcript (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050).
- [ ] [auto] Account deletion: export offered first, subscription notice with manage link before confirm, 30-day undo, then a cross-system verification script finds no remaining rows or objects except pseudonymised acceptances and the suppression hash (C-REQ-019, LEGAL-REQ-029).
- [ ] [manual] `https://<domain>/delete-account` completes a deletion request without the app (LEGAL-REQ-030).
- [ ] [auto] Purge job deletes tombstones older than 30 days; backups bound to 7 days (LEGAL-REQ-031, DATA-REQ-030).
- [ ] [auto] Settings > Help and Legal > About shows the beta label and body; no beta string appears on Tonight, Listening, Review, Book, intro, sign-in or Plus screens (K-13).

### 6.7 Store, legal, content
- [ ] [auto] `packages/content` tests pass: no em or en dashes, curly quotes, ellipsis characters or emoji; no "kids" keyword or child-directed phrases; claims registry rule passes (LEGAL-REQ-044, LEGAL-REQ-045).
- [ ] [manual] App Store Connect territories equal {United States}; age rating answered; not in Kids Category (LEGAL-REQ-058, CR-002).
- [ ] [auto] Privacy labels and `PrivacyInfo.xcprivacy` match the data map for this build; evidence saved (LEGAL-REQ-042, LEGAL-REQ-043).
- [ ] [auto] CI denylist finds no ad, attribution or tracking SDK and no AdSupport or AppTrackingTransparency import (LEGAL-REQ-016).
- [ ] [auto] Log canary scan finds zero fixture names, letter text or tokens in any log, URL, push payload or analytics event (LEGAL-REQ-014).
- [ ] [auto] AI gateway returns 403 without an active `ai-processing` consent and for any `source='web'` entry without the contributor's own consent (LEGAL-REQ-004, LEGAL-REQ-005).
- [ ] [manual] Terms, Privacy Policy (with the K-10 sentence fixed), Subscription terms and Consumer Health Data Privacy Policy are published at versioned URLs and linked in-app and in the store listing.
- [ ] [manual] `packages/brand` has the real legal name and domain; no `example.com` anywhere in the build.

### 6.8 Non-functional gates
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
| 1-year export (about 230 MB) offline | Under 2 minutes on iPhone SE 3 | Yes | C-NFR-007 |

### 7.2 Server latency by endpoint class (measured at the client, US, good LTE)
| Class | Examples | p95 | p99 | Gate |
|---|---|---|---|---|
| Auth token exchange | `signInWithIdToken`, `verifyOtp` | 1.5 s | 3 s | Yes |
| Read RPC and REST (RLS) | `policy_actions_needed`, invite lookup, member list | 300 ms | 800 ms | Yes |
| Write RPC | `accept_child_invite`, `create_child_invite`, `review_family_letter`, `leave_child` | 500 ms | 1.2 s | Yes |
| Sync upload batch | PowerSync `uploadData`, up to 50 ops | 800 ms | 2 s | Yes |
| Edge Function, light | invite redemption, escrow unwrap, notice scheduler calls | 600 ms | 1.5 s (cold start included) | Yes |
| Server transcription gateway (consented only) | up to 2 minutes of audio | 4 s | 10 s | No |
| Storage upload start | signed URL plus first byte of audio upload | 1 s | 2.5 s | No |
| Store webhook processing | RevenueCat to entitlement row | 5 s | 60 s (reconcile) | Yes |
| Entitlement active after store success | client sees Plus | 5 s | 10 s | Yes (C-NFR-002) |
| Web contribution page | LCP on 4G, page weight | LCP 2.5 s; 300 KB or less | | Yes (B-NFR-008) |

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
- Needs network, with honest copy and nothing lost: sign-in, invites, approvals (queued visibly), backup, purchases and restore, web contribution.
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
| Database size | Under 8 GB | About 150 GB |
| Cumulative backed-up audio | About 115 GB | About 11.4 TB |

All section 7.2 budgets must hold at these loads. Load-test at **2 times the 100k targets** in staging before the product passes 25k families; load-test at 2 times the 1k targets before public launch (gate). PowerSync concurrent-client plan must be sized before passing 1k concurrent clients.

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

---

## 8. Shipped copy fixed on 2 Oct 2026

Files: `packages/content/src/strings.en.ts`, `store.en.ts`, `site.en.ts`. Tests and typecheck pass (`npx vitest run`: 16 of 16; `npx tsc --noEmit`: clean).

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

Not changed here (owner follow-ups): "tidy" wording (K-26); paywall legal strings from in-app-disclosures section 3, which need the content test's placeholder allowlist extended with `monthlyPrice`, `annualPrice`, `date` and `period` when C builds the sheet; `BRAND.md` pillar text "On-device transcription only fixes" should gain "by default" at the next brand review.

---

## 9. Questions only the founder can answer

1. **Read together behind Plus after 3 tries (provisional yes).** It is the strongest emotional moment and a brand pillar; gating it may read as "listening is not free". Alternative: keep it free and let backup, extra books and themes carry Plus.
2. **Second child's book behind Plus (provisional yes, with twins and same-date siblings free in first run).** Confirm both the gate and the twins exception.
3. **Beta end.** What ends the beta label (a version, a date, a crash-free threshold)? Terms 16.4, the About screen and the store line change together.
4. **Under-18 answer.** Keep local-only use (current default) or show a stop screen? Counsel input welcome; the founder owns the product call.
5. **Company name and domain.** `packages/brand` placeholders block universal links, SMTP, the Apple Services ID, legal URLs and store submission.
6. **Overseas grandparents.** Confirm the web page stays reachable worldwide (register recommendation). If counsel later asks for a geo-block, the feature effectively disappears for them; that is a founder call.

Owner actions outside product (tracked, not founder questions): ADR 0008 opt-in wording; `safety_events` drop migration; LEGAL-REQ-033 and -047 table edits; Privacy Policy section 12 sentence; Subscription terms and in-app-disclosures "listening" wording; DESIGN_LANGUAGE real-name example.

## Changelog
| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-02 | First integrated PRD: index, conflict log K-01 to K-27, launch checklist, NFR budgets, copy fixes. |
