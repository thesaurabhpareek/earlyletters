---
chapter: 07
title: Privacy engineering
owner: compliance-engineer
reviewers: [security-architect, data-steward]
status: adopted
last_reviewed: 2026-10-03
applies_to: packages/analytics/**, apps/mobile/src/**, supabase/migrations/**, docs/legal/**, package.json, apps/mobile/package.json, apps/mobile/app.config.ts
---

# 07. Privacy engineering

## Purpose

Early Letters holds the most private things a family makes: a parent's voice, their words about their child, and the child's name, birthday and photos. The founder's promise (BRIEF decision 11) is that letters are private, never sold, never used for ads and never used to train models. This chapter turns that promise into rules that code and CI can prove, so no public statement is ever ahead of the implementation.

I am not a lawyer. Where a rule rests on a legal reading, it is labelled and routed to counsel.

## Principles

1. **Every promise has a proof.** A public privacy claim maps to code and a test, or it is not made. *Why:* an unbacked claim is the fastest way to lose a parent's trust and to invite an FTC Act s.5 problem (register CR-010).
2. **Collect less.** A field exists only if a feature needs it today. *Why:* data we never hold cannot leak, be subpoenaed or need deleting.
3. **Off until asked.** Analytics and crash reports send nothing until an explicit yes. *Why:* D-003, BRIEF decision 12, LEGAL-REQ-003.
4. **Content never leaves its store.** Letter text, transcripts, audio, photos and child identity live in content stores only. *Why:* every copy outside them is a copy we cannot find, delete or defend.
5. **On the device first.** Anything that can run on the phone runs there. *Why:* on-device ASR (ADR 0001, ADR 0012) and on-device safety tiers mean the server never sees what it does not need.

## Rules

Levels and classes: `docs/legal/DATA_CLASSIFICATION.md` (L1 to L4) and `docs/legal/data-policy.md` section 2 (C, S, A, T). L4 is content and child identity.

### Minimisation and purpose

**PRIV-R01 (MUST)** Every new table column, Storage bucket, device column or key, SDK, network host or analytics property ships in the same PR with its classification level, purpose, retention and deletion path, and the PR body names its data class (`Data classes touched:`). *Why:* DATA-REQ-001, LEGAL-REQ-012; the inventory is the source of truth. *Enforced by:* `supabase/tests/classification.test.mjs` fails on any unlabelled `public` column (enforced on develop); everything outside Postgres is `not yet: PDATA-05` (`docs/legal/data-map.yaml` and `scripts/check-data-map.mjs`, WS-19).

**PRIV-R02 (MUST NOT)** Add any field on the never-collect list in LEGAL-REQ-012 (child gender, surname, birth weight, place of birth, location, contacts, user date of birth, phone number, government ids, card data). *Why:* none is needed for a memory book. *Enforced by:* review (compliance-engineer); `not yet: PDATA-05` for an automated denylist.

**PRIV-R03 (MUST)** Use data only for the purpose recorded for it in the data map. A new use of existing data (for example, using `occurred_on` for a marketing email) is a new purpose: it needs a data-map change, a check against the published policy, and counsel review if the policy does not already cover it. *Why:* purpose limitation; privacy policy section 5 lists the purposes we promised. *Enforced by:* review (compliance-engineer).

**PRIV-R04 (SHOULD)** Prefer a coarse, irreversible reduction over the raw value when a feature or metric only needs the reduction (a boolean, a bucket, an ordinal). *Why:* DATA_CLASSIFICATION 1.1 rule 2. Example: `child_added.mode` sends `due_date` today (`packages/analytics/src/catalog.ts:258`); PPRIV-02 replaces it with `has_date`, pending PR #31.

### Consent and privacy by default

**PRIV-R05 (MUST)** No PostHog or Sentry event leaves the device, or is queued, before the user grants analytics consent; Sentry rides the same switch (D-003). Withdrawal takes effect on the next event. *Why:* LEGAL-REQ-003. *Enforced by:* `packages/analytics/test/analytics.test.ts` ("sends and queues nothing before consent") and `catalog.test.ts` asserting `REQUIRED_POSTHOG_OPTIONS.defaultOptIn === false` (enforced on develop); Sentry is not wired yet (`not yet: PDATA-06`); network-level E2E proof `not yet: LEGAL-REQ-003 test line`.

**PRIV-R06 (MUST)** Every consent act (grant, decline, withdraw, acknowledge) is written through `record_policy_act` to `policy_acceptances`, append-only, with document version, method, surface and, for in-app texts, `rendered_sha256`; never IP, user agent or free text. *Why:* `docs/legal/POLICY_VERSIONING.md` section 7.1; D-049 for purchase consent. *Enforced by:* `policy_acceptances_guard` trigger and column checks in `supabase/migrations/20261002020000_data_governance.sql` (enforced on develop; not applied live, DB-03).

**PRIV-R07 (MUST)** The consent pepper (`app.consent_pepper`) fails closed: no profile deletion proceeds without it. *Why:* an empty pepper makes pseudonymised consent records reversible (DB-07). *Enforced by:* `pending PR #32` (SQLSTATE `SCCFG`); on develop the trigger still falls back to `''` (`data_governance.sql:684`).

**PRIV-R08 (MUST)** Consent that gates a server feature is checked on the server, never only in the client. *Why:* a client check can be bypassed. *Enforced by:* `require_content_consent()` in `supabase/migrations/20261003000000_security_and_family.sql:190`, tested in `supabase/tests/security_family.test.mjs` (enforced on develop); the `ai-processing` gate (LEGAL-REQ-004) binds when server transcription ships (v1.1).

**PRIV-R09 (MUST)** A consent version change follows POLICY_VERSIONING sections 5 and 6, and never gates export or deletion. *Why:* LEGAL-REQ-009. *Enforced by:* review (compliance-engineer); CI controls in POLICY_VERSIONING section 9 are `not yet`.

### The content-free rule

**PRIV-R10 (MUST NOT)** Put L4 data (letter text, transcript, audio, photo, child name, nickname, birthday, due date, signature, dictionary term, search query, token) in any of: analytics, logs at any level, crash reports and breadcrumbs, push payloads, URL paths or query strings, email subject lines, support prefill, `audit_events.detail`, deletion receipts. *Why:* CLAUDE.md privacy rules; LEGAL-REQ-014; DATA-REQ-002, DATA-REQ-004. *Enforced by:* the canary test in `packages/analytics/test/analytics.test.ts:219` (Asha fixtures, enforced); `audit_events.detail` 512-byte object check and `deletion_requests.receipt` 2048-byte check (enforced in migration); log canary scan `not yet: PDATA-06`; `console` ban `not yet: MONO-01` (WS-12).

**PRIV-R11 (MUST)** Analytics events and properties come only from the typed catalogue in `packages/analytics/src/catalog.ts`; an unknown property, a string over 40 characters, or a missing or invalid required property drops the event. *Why:* LEGAL-REQ-017, ADR 0008. *Enforced by:* `packages/analytics/src/validate.ts` (`MAX_STRING_LENGTH = 40`, enforced); fail-closed on required properties `pending PR #31` (PDATA-03).

### Vendors, SDKs and on-device processing

**PRIV-R12 (MUST)** A new vendor, SDK or network destination merges only with, in the same PR: a data-map entry, an update to `docs/legal/subprocessors.md` per its section 5, and a re-run of `docs/legal/app-store-privacy-labels.md` sections 1 to 3 if it ships in the app. Content-handling vendors also need the 30-day in-app notice (subprocessors.md section 5 step 4). *Why:* LEGAL-REQ-041; MHMDA requires a list of recipients (subprocessors.md, RCW 19.373.040 as cited there). *Enforced by:* review (compliance-engineer, on any `package.json` change); host and dependency diff `not yet: LEGAL-REQ-041`.

**PRIV-R13 (MUST NOT)** Add advertising, attribution, fingerprinting or data-broker SDKs, or import AdSupport or AppTrackingTransparency. *Why:* LEGAL-REQ-016; privacy policy section 6. *Enforced by:* review; the dependency denylist is `not yet: LEGAL-REQ-016` (not in the `ci/hardening` branch either).

**PRIV-R14 (MUST NOT)** Use user content to train or tune any model, or send it to a provider that may. Any server AI path needs a signed no-training DPA, zero retention and identifier stripping (LEGAL-REQ-020), and never rewrites words: every machine edit passes `verifyEdits` (`packages/core/src/verify.ts`). *Why:* BRIEF decision 11; the constitution. *Enforced by:* `verifyEdits` and its fuzz tests (enforced); provider config check `not yet: LEGAL-REQ-020` (binds at v1.1).

**PRIV-R15 (MUST)** Transcription and safety tiering run on the device at v1.0. Safety tier results never reach the server or any processor in any form linked to a person. *Why:* ADR 0001, ADR 0012, LEGAL-REQ-015, DATA-REQ-061. *Enforced by:* `20261002020000_data_governance.sql` drops `public.safety_events` (repo; live DB still has it, DB-03); network test `not yet: LEGAL-REQ-015`.

**PRIV-R16 (MUST)** Photos lose GPS and device-serial metadata on the device before upload or export. *Why:* LEGAL-REQ-013. *Enforced by:* `not yet: LEGAL-REQ-013` (photo upload is not built).

### Claims and disclosures

**PRIV-R17 (MUST)** Every public privacy, security or AI claim (app copy, website, store listing, emails, legal pages) has a row in the claims register (`docs/legal/CLAIMS.md`, WS-19) naming the code path and test that make it true, and its status. A claim without a passing proof is rewritten or removed before release. *Why:* PPRIV-04, LEGAL-REQ-044. *Enforced by:* `not yet: PPRIV-04` (content test for absolute claims, WS-10; `CLAIMS.md`, WS-19). Known case: `settings.backup.honestNote` in `packages/content/src/strings.en.ts:532` ("only on this phone") is inaccurate per D-033.

**PRIV-R18 (MUST)** App Store privacy answers and `PrivacyInfo.xcprivacy` match the data map for every release build, and the evidence is stored per version. *Why:* LEGAL-REQ-042, LEGAL-REQ-043. *Enforced by:* manifest skeleton in `apps/mobile/app.config.ts` `pending PR #27`; render-and-compare script `not yet: LEGAL-REQ-042`; manual checklist in `app-store-privacy-labels.md` section 5.

### Children's data

**PRIV-R19 (MUST)** Users are adults (D-006); the child is the subject of the book, never a user. All child identity is L4; analytics refers to a child only by ordinal or count bucket. *Why:* DATA_CLASSIFICATION 1.1 rule 6; LEGAL-REQ-045. *Enforced by:* `classification.test.mjs` L4 checks (enforced); catalogue review.

**PRIV-R20 (MUST NOT)** Ship any feature that captures a child's own voice or input (sibling letters, "let your child record") unless it sits behind a `child-input` flag that stays off in production until counsel's written opinion is linked. *Why:* this changes the COPPA question (see Open questions). *Enforced by:* `not yet: LEGAL-REQ-059` (no flag system yet, PDATA-08).

## How to apply it

**New field checklist (paste into the PR body):**
- [ ] Level (L1 to L4) and class (C, S, A, T); column comment starts with the level.
- [ ] Which feature needs it today, and why a coarser value will not do.
- [ ] Retention and the job that enforces it (chapter 04).
- [ ] Deletion path: which DATA-REQ step removes it (chapter 08).
- [ ] Leaves the device? To whom? Data map and subprocessors updated.
- [ ] Changes any App Store privacy answer? Labels doc re-run.
- [ ] Touches a registered claim? `CLAIMS.md` row updated.

**Content-free pattern for logs and errors.** Log ids, enums, counts and error codes; never the object.

```ts
// Good: ids and enums only (L2/L3), no content
log.info('entry_saved', { entry_id: e.id, kind: e.kind, words_bucket: bucket(e.words) });
// Bad: content and child identity
log.info(`saved "${e.final_text}" for ${child.name}`);
```

**Reviewing an analytics change.** Every property is L2 and in the catalogue; no internal id other than the random analytics id; strings are enums; `SCHEMA_VERSION` bumped (pending PR #31).

**Before adding a dependency.** Run the vendor checklist in `docs/legal/subprocessors.md` section 5, then BRIEF coordination rules on licences.

## Exceptions

Only the founder grants an exception, recorded as a `D-###` in `docs/DECISIONS.md` (standing) or in the PR body (one-off), with counsel's note when the rule rests on a legal requirement. PRIV-R10, PRIV-R13 and PRIV-R14 have no exception path: changing them changes the public promise and needs a policy version under POLICY_VERSIONING first.

## Open questions

1. **COPPA (counsel).** Users are adults writing about children; the FTC FAQ is the starting point for whether any feature collects personal information "from" a child. Counsel decides; engineering only keeps PRIV-R20 in place.
2. **D-050 Washington second consent (counsel).** Default if unanswered: no second consent; the product supports one tap at the first family share.
3. **Crash reports under a narrower notice (counsel, LEGAL-REQ-003).** Until answered, Sentry is opt-in with analytics.
4. **Claims register home.** WS-19 proposes `docs/legal/CLAIMS.md`; LEGAL-REQ-044 names `docs/legal/claims-registry.yaml`. Founder to pick one so the content test has one source.

## References

Repo: `CLAUDE.md` (privacy rules, constitution); `docs/agents/BRIEF-2026-10-03.md` decisions 11, 12; `docs/DECISIONS.md` D-003, D-006, D-013, D-033, D-049, D-050; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-003, -004, -009, -012 to -017, -020, -041 to -045, -059; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-001 to -004, -061; `docs/legal/DATA_CLASSIFICATION.md`; `docs/legal/data-policy.md`; `docs/legal/POLICY_VERSIONING.md` sections 5 to 9; `docs/legal/subprocessors.md` section 5; `docs/legal/app-store-privacy-labels.md` section 5; `docs/legal/consumer-health-data-notice.md`; `docs/tdd/05-privacy-compliance.md`; ADR 0001, 0008, 0012; findings PPRIV-02, PPRIV-04, PDATA-03, PDATA-05, PDATA-06, DB-03, DB-07, MONO-01.

External (engineering reading, confirm with counsel):
- FTC, Complying with COPPA: Frequently Asked Questions (sections A.1, A.2, A.8, F.4), https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions, checked 2026-10-03.
- Washington AG, My Health My Data Act page, https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy, checked 2026-10-03.
