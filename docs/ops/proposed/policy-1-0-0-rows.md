# PROPOSED: policy 1.0.0 rows, claims-to-code table and open questions (BL-1957)

Status: PROPOSED, for exec-team review (D-168, D-172). Not reviewed yet. The exec team is not a lawyer, and nothing here says any text is compliant or legal. Written by the `legal` agent on 23 Nov 2026 against develop at `079cb892d`. It supersedes the drafts of PR #672 (the coordinator closes #672 once this PR has two counted reviews). Nothing under `docs/legal/` outside `docs/legal/drafts/store-1.0/` is touched, and neither are the 0.9.0 files.

The four drafts, all under `docs/legal/drafts/store-1.0/`:
`terms-1.0.0.md`, `privacy-1.0.0.md`, `subscription-terms-1.0.0.md`, `sensitive-data-1.0.0.md`.

## 1. The version-number question

**What `docs/legal/POLICY_VERSIONING.md` decides (section 2.4).** The `version` in the frontmatter of a draft in `docs/legal/` (Terms 4.1.0, Privacy 3.0.0) is an internal revision number, not a published version. The published sequence of each document is separate: `0.9.0` for the TestFlight text and `1.0.0` for the first counsel-approved text, published as `major` with `requires_reconsent = true`. So **1.0.0 is the published number** for `terms`, `privacy` and `sensitive-data`. 4.1.0 and 3.0.0 stay internal revisions of the working drafts. Section 2.4 also says a version number is never reused.

**What it does not decide, and my recommendation.**

1. *Whether 1.0.0 is `initial` or `major` in the production project.* Section 2.4 describes `major` with re-consent because testers hold 0.9.0. The production project holds no `policy_versions` rows until FOUNDER_QUEUE row 6 runs (not verified; row 5 must run first). The guard trigger (`supabase/migrations/20261002020000_data_governance.sql`, `policy_versions_guard`) only enforces re-consent and 30 days for `change_class = 'major'`. Recommendation: if production has no 0.9.0 rows, publish 1.0.0 as `initial` (Variant A below). If 0.9.0 rows are already there, use Variant B. [EXEC-TEAM COUNSEL Q V-1: confirm.]
2. *What "counsel-approved" means.* D-172 reads it as the exec team's review. This PR does not say any text is approved. Status stays PROPOSED until that review is recorded in `docs/agents/cto/RULINGS.md`.
3. *The app's own constants.* `apps/mobile/src/lib/agreements.logic.ts` pins `TERMS_DOC_VERSION = '4.1.0'` and `PRIVACY_DOC_VERSION = '3.0.0'`, and `apps/mobile/test/agreements.test.ts` fails if they differ from the frontmatter of `docs/legal/terms-of-service.md` and `privacy-policy.md`. They are written to local agreement rows when someone ticks the box before first use. `apps/mobile/src/lib/billing/config.ts` pins `SUBSCRIPTION_TERMS_DOC_VERSION = '4.1.0'`. None of these versions will exist in `policy_versions`. I found no code that uploads the local agreement rows (not fully verified; the repo search was narrow), and the server consent path reads the newest published version from `policy_versions` instead (`apps/mobile/src/lib/auth/consent.ts`, `currentVersion`). So the effect is a record that names a version nobody published. Recommendation: `mobile` and `privacy` decide whether the local rows should read 1.0.0 once published; that is a code and test change, not mine. [EXEC-TEAM COUNSEL Q V-2: the local agreement constants (`TERMS_DOC_VERSION` 4.1.0, `PRIVACY_DOC_VERSION` 3.0.0, `SUBSCRIPTION_TERMS_DOC_VERSION` 4.1.0) name versions that were never published; they must be aligned or explained before submission.]
4. *The key for the Plus text.* The database key is `auto-renewal-terms`, not `subscription-terms`. No code reads that key today (the status report is off), so no row is proposed for it in the SQL below.

## 2. The exact `policy_versions` rows and hashes

Hashes are `sha256sum` of the exact files in this PR, taken after the last edit to each (re-run `sha256sum` on the branch head before use):

| Document key | Version | File | sha256 |
|---|---|---|---|
| terms | 1.0.0 | `docs/legal/drafts/store-1.0/terms-1.0.0.md` | `215a37c0d0437b3f1bdbf88d71bfc88f10e5b6c66a59dce0364fd155a1a1ee39` |
| privacy | 1.0.0 | `docs/legal/drafts/store-1.0/privacy-1.0.0.md` | `7301f423f39fd06694f7293df7f0bfded74ac3d2c671d7d5415c7494e005cac9` |
| sensitive-data | 1.0.0 | `docs/legal/drafts/store-1.0/sensitive-data-1.0.0.md` | `4a5c0dfa05d5d2a94998f91b5e48409d594304d0d6ab5938a63e86cad86ff18d` |
| (not inserted) auto-renewal-terms | 1.0.0 | `docs/legal/drafts/store-1.0/subscription-terms-1.0.0.md` | `5871becf785bc418147964eb8084bed049d785eaf1fc33fb224336cf23d8dcc0` |

**Hashes taken again 24 Nov 2026 for the drafts as edited in the reconcile PR (they change with any later edit).** **These hashes are for the drafts as they stand, with the PROPOSED banner and every bracketed mark.** Those come out before publishing, so the published bytes, and the hash that goes into `policy_versions.content_sha256`, will differ. Take the hashes again with `sha256sum` on the exact published file, which the website serves byte for byte (POLICY_VERSIONING 2.4), and replace the four values below. A pin test like `packages/content/test/legal-beta.test.ts` for the 1.0.0 files does not exist yet (not mine to write).

**The in-app hash for the sensitive-data sheet** (a different thing: `policy_acceptances.rendered_sha256`, the hash of the words shown, `consent-record.ts` line 59). I joined `sensitiveConsent.title`, `.body`, `.use`, `.declineHelp`, `.changeLater` with a newline, as `consentShownText('sensitive')` does, and hashed it with `sha256sum`: `e3ca8dc4b0e78f71cf7dfa60314daf9e03dc39d0513452da1cd341b9dc7965fd`. This is my hand reconstruction, not the app's output (I did not run the app). Taken again on 24 Nov 2026 (the earlier value began `c70866a8` and was for the older words) from the text now in `strings.en.ts` lines 1112 to 1122 on `develop` d05e0cee1, joined in the order title, body, use, declineHelp, changeLater, with no trailing newline (that join order and the no-newline choice were not re-checked against `consentShownText`). It changes if `content` changes the sheet again (SD-1b).

### Variant A: production has no `policy_versions` rows (the likely case)

```sql
-- PROPOSED. Owner, SQL editor, production project, after FOUNDER_QUEUE row 5. Replace each hash with sha256sum of the published file first.
insert into public.policy_versions
  (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
values
  ('terms', '1.0.0', 'initial', false, now(), now(), now(),
   decode('215a37c0d0437b3f1bdbf88d71bfc88f10e5b6c66a59dce0364fd155a1a1ee39', 'hex'),
   'https://earlyletters.com/legal/terms/1.0.0',
   'First version for the App Store app.'),
  ('privacy', '1.0.0', 'initial', false, now(), now(), now(),
   decode('7301f423f39fd06694f7293df7f0bfded74ac3d2c671d7d5415c7494e005cac9', 'hex'),
   'https://earlyletters.com/legal/privacy/1.0.0',
   'First version for the App Store app.'),
  ('sensitive-data', '1.0.0', 'initial', false, now(), now(), now(),
   decode('4a5c0dfa05d5d2a94998f91b5e48409d594304d0d6ab5938a63e86cad86ff18d', 'hex'),
   'https://earlyletters.com/legal/sensitive-data/1.0.0',
   'First version of the health and sensitive details agreement, asked once before a book first syncs.');
select document, version, encode(content_sha256, 'hex') as sha256 from public.policy_versions order by 1, 2;
```

The two summaries are my words, not a file's own changelog row (the 0.9.0 rows used the file's row). They are at most 600 characters (`policy_versions` check). Columns and checks are those of `supabase/migrations/20261002020000_data_governance.sql`. Rows are immutable once inserted, so a wrong row is fixed only by a new version. `url` points at the proposed website paths; the website must serve them before row 6 runs (not verified).

### Variant B: 0.9.0 rows already exist in the production project

Same three rows, with `change_class = 'major'`, `requires_reconsent = true` for `terms` and `sensitive-data` (the guard raises otherwise, because both need an affirmative act), and `effective_at` at least 30 days after `published_at` unless the exec team rules a shorter notice. A shorter notice also needs `select set_config('app.allow_short_notice', 'on', true);` in the same transaction (the guard reads it). POLICY_VERSIONING section 5 also needs the notice email and in-app card for existing account holders. [EXEC-TEAM COUNSEL Q V-3: short notice or 30 days for testers.]

### Why `sensitive-data` cannot wait

`recordConsent` reads the newest published version of the document and throws `policy_version_missing` when none exists (`apps/mobile/src/lib/auth/consent.ts` lines 58 to 77). With no `sensitive-data` row, nobody can answer the sheet, so nobody can sync. FOUNDER_QUEUE row 6 says the same ("no text or hash for it is in the repo"). Its SQL block lists only the two 0.9.0 rows. I recommend Karma replace that block with Variant A once the exec team clears the texts (not my file; I did not edit it).

## 3. Claims to code

How to read "Backing": `read` means I opened the file on develop at `079cb892d` today. `carried` means the claim comes from the PR #672 draft or an earlier doc and I did not re-check it. `UNVERIFIED` means I could not check it from the repo.

### Build facts

| Claim | Where it appears | Backing | Status |
|---|---|---|---|
| Servers and accounts are on in production | Privacy short version, sections 2 to 4 | `apps/mobile/eas.json` `production`: `EXPO_PUBLIC_SERVER_FEATURES=on`; D-170 | read |
| Backup is off, recordings never leave the phone | Privacy 5, Terms 7.2 | `eas.json` `production`: `EXPO_PUBLIC_BACKUP=off`. That no code path uploads audio with the flag off: not traced | read (flag), UNVERIFIED (code path) |
| No analytics or crash reports of ours | Privacy short version, 2, 6 | `eas.json` `production`: `EXPO_PUBLIC_ANALYTICS=off`; D-170 (production analytics only after D-163's gate, BL-1886) | read |
| Our servers do not receive purchases | Privacy short version, Terms 8.7, Subscription Terms | `eas.json` `production`: `EXPO_PUBLIC_STATUS_REPORT=off` | read |
| No photo feature, the library is not read | Privacy short version, 2 | `EXPO_PUBLIC_PHOTOS` and `EXPO_PUBLIC_MOMENTS_TAB` not set in `eas.json`; `apps/mobile/src/app/(tabs)/moments.tsx` header says "dark behind EXPO_PUBLIC_MOMENTS_TAB" and renders no library read; `app.config.ts` shows no photo-library permission string (grep found none); D-169 | read |
| No Google sign-in | Terms 3.1 | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` not set (`apps/mobile/src/lib/auth/google.ts` defaults to empty); D-171 | read |
| Sign in with Apple or an email code | Privacy 2, Terms 3.1 | D-044, D-054; `apps/mobile/src/lib/auth/machine.logic.ts` not re-read | carried |
| A local start with no account exists | Privacy 3, Terms 3.1 | `packages/content/src/strings.en.ts` `localStart` (line 1415) and `apps/mobile/src/lib/first-run/handoff.logic.ts` ("The local start (no session by choice)") | read |
| No way to invite or join another parent in a store build | Privacy 4 and 8, Terms 4 | D-162; `apps/mobile/src/lib/family/entry.logic.ts` `visibleCoParentDoors` returns `joinButton: coParent && alpha`; `apps/mobile/src/lib/billing/alpha.ts` `isAlphaBuild` is false for `production` | read |
| In-app Delete account at Settings, Your data, Delete account | Privacy 8, Terms 10.1 | `eas.json` `production`: `EXPO_PUBLIC_ACCOUNT_DELETION=on`; labels in `strings.en.ts` (`data: "Your data"`, `deleteAccountLabel`). The path on a device is not checked | read (labels), UNVERIFIED (device) |
| The 30, 31, 38 and 45 day periods, 7 day retry, 24 month and 3 year records | Privacy 8 | #672 draft's reading of `supabase/functions/purge-worker/` and the migrations. Not re-read today. Whether the purge worker and its schedule run in production is not verified (FOUNDER_QUEUE row 5, `supabase/APPLY.md` steps 6, 7, 15) | carried, UNVERIFIED (deployed) |
| Export at Settings, Your data, Export your book | Privacy 9, Terms 7.3 | `strings.en.ts` `exportLabel: "Export your book"` (line 1437) | read |
| Manage subscription and Request a refund labels | Terms 8.8, 8.10 | `strings.en.ts` `manageLabel`, `refundLabel` (lines 840 and 841) | read |
| A box before first use: "I agree to the Terms of Service and Privacy Policy." | Terms 1.3 | `strings.en.ts` `beforeBegin.agree` (line 1623); `apps/mobile/src/lib/agreements.logic.ts` | read |
| Under 18 answer stops the app, a day wait | Terms 2.1, Privacy 11 | `agreements.logic.ts` header (24-hour stop, LEGAL-REQ-002) | read |
| No country check at sign-up | Privacy 15 | No country logic in `apps/mobile/src/lib/auth` or `supabase/functions` (grep, narrow); D-131, D-136 say it takes effect when it ships | read (grep), UNVERIFIED |
| No switch to withdraw the health details agreement | Privacy 10, Sensitive data | `apps/mobile/src/lib/auth/sensitive-row.ts` header (no `open`, BL-485 option (b), D-128) | read |
| The sheet says "Keep on this phone" and "Agree and sync" | Sensitive data | `strings.en.ts` `sensitiveConsent` (lines 1099 to 1112) | read |
| The consent row's fields | Sensitive data | `consent-record.ts`, `consent.ts` `recordConsent` (method `consent_sheet`, surface `auth.consent.sensitive`) | read |

### Carried claims I did not re-check

| Claim | Where | Source in the #672 draft | Status |
|---|---|---|---|
| Speech becomes text on the phone, nothing sent to a speech service | Privacy 2, Terms 6.1 | 0.9.0 text | carried |
| Free letters: 2, one pool across books, count in Keychain, "we may raise, never lower" | Privacy 7, Terms 8.1, Subscription Terms | D-082, D-083; `alpha.ts` says the store build reads the allowance from remote config, which "may only raise the reviewed 2" | carried (the "2" is a code comment, not read from the engine) |
| Prices $4.99 and $49.99, trials 1 and 2 months | Terms 8.5, Subscription Terms | `docs/store/app-store-connect-1.0.md` section 8 lines 113 and 114 | read (doc); must match App Store Connect on the day |
| Family Sharing on | Terms 8.13, 18, Subscription Terms | #672 draft; `app-store-connect-1.0.md` not checked | UNVERIFIED |
| Provider roles, 30 day Resend retention, Cloudflare logs, Hugging Face | Privacy 6 | `docs/legal/subprocessors.md` 2.1.0 (16 Oct) and 0.9.0 | carried, UNVERIFIED |
| Encryption at rest, two-factor on every console | Privacy 13 | founder facts in 0.9.0 | UNVERIFIED |
| Website uses no cookies or analytics, 10 minute IP in memory | Privacy 14 | 0.9.0 text; `apps/web` not re-read | carried |
| Reminders and receipts text | Terms 8.9 | #672 draft, D-094 | carried |

## 4. Mismatches to hand off

1. **To `content`: the sensitive-data sheet.** `sensitiveConsent.body` says "share it with the family you choose" and `declineHelp` says "syncing and sharing stay off". The store build has no sharing (D-162). `in-app-disclosures.md` 3.4.0 lists it as gap G-21. Proposed words are in `sensitive-data-1.0.0.md` (SD-1). Changing them changes the rendered hash.
2. **To `privacy`: the App Store privacy label.** `docs/legal/app-store-privacy-labels.md` 2.2.0 describes option B (co-parent sharing, backup once it ships). The production build has neither. I did not edit the label (the PR #672 version of it is not carried over, and it was written for the 8 Nov build). Rows to re-check: Audio Data, Device ID, Purchase History, and the "Sensitive Info" row for due date. Label 2.2.0 also says the first store build requires sign-in (its build-state table, row for Build 12), while the Privacy draft section 3 describes a local start with no account (D-160). Align them or flag it. The option B mismatch must be corrected before submission. [EXEC-TEAM COUNSEL Q L-1.]
3. **To `content` (BL-1955 already covers one line):** `docs/store/app-store-connect-1.0.md` line 193 promises a co-parent later, against D-161.
4. **To `mobile` and `privacy`: version constants.** Section 1, point 3.
5. **To Karma (FOUNDER_QUEUE row 6):** the SQL block is for the two 0.9.0 texts and has no `sensitive-data` row. Variant A above replaces it once the exec team clears the texts.
6. **`docs/legal/in-app-disclosures.md` 3.4.0** still has rows for backup, restore, new-device email and the co-parent sensitive-data wording. They describe option B. Not edited here.
7. **`docs/legal/terms-of-service.md` 4.1.0 and `privacy-policy.md` 3.0.0** still describe backup, co-parent books and the option B build. They stay as the internal working drafts; I did not change them. Whether to retire them in favour of the 1.0.0 drafts is for the exec team.

## 5. Open questions: exec-team counsel must confirm

These carry over from the PR #672 drafts unless marked new. The packet numbers refer to `docs/legal/COUNSEL_PACKET.md` and its addenda.

- V-1, V-2, V-3: version questions above (new). V-4 (24 Nov, ruling CLO-A and CLO-B): POLICY_VERSIONING 2.4 says when in doubt treat the bump as major; the published number is 1.0.0 and 4.2.0 and 3.1.0 are internal revisions; Variant A or B above is NOT ruled.
- New (24 Nov, C9): Privacy section 6 says Supabase holds the request IP address and device details, while the label answers Location No and Device ID No. Needs a Chief Privacy Officer ruling after the founder reads the Supabase and Cloudflare log settings. Unverified.
- SD-1, SD-2, SD-3: the sensitive-data sheet's "family you choose" words, whether a link is needed beside the words, and whether email-only withdrawal is enough for Washington and Connecticut health data rules (packet Q32, Q48; OQ-L1).
- New (review fixes): SD-1b (changeLater line and the "family you choose" line in one change, then retake the hash); P-1 (server-side aggregate counts and letter language sync, before migration file 11 applies); P-2 (new-device sign-in email unapplied); P-3 (unverified 12-month, 30-day and 38-day periods, and OQ-5 of the deletion spec); L-1 (label 2.2.0 sign-in required against the local start, and option B mismatch before submission).
- New: whether Privacy and Terms should say nothing about sharing with another parent until BL-882 to BL-889 ship (Privacy 4 and 8, Terms 4). Terms S-25 (packet Q50, custody and safety) is parked with it.
- New: the D-163 production analytics gate. When analytics turns on, Privacy needs a new major version and the `analytics` consent first (POLICY_VERSIONING 2.1).
- S-1 (packet Q11, Q12): IP addresses at the host and Hugging Face; written contracts or data processing terms for each provider.
- S-3 (D-083): the letter count in the Keychain surviving a reinstall.
- S-4 (packet Q41): reminders and the Plus consent record.
- S-5, S-16, S-17 (packet Q40, Q16): prices, the free letters, "past letters are never put behind a payment".
- S-6 (packet Q35) and founder F-1: Apple's standard end user licence or a custom one (Terms 18).
- S-7 (packet Q47, Q1) and F-2: the legal name and postal address. D-134 reads individual.
- S-8 (packet Q46, Q5) and F-3: Texas SB 2420 and the age answer.
- S-9 (packet Q32, Q48): Washington and Connecticut consumer health data.
- S-10 (packet Q45): COPPA reading.
- S-11 (packet Q39): liability limits and California Civil Code section 1668.
- S-14: how 1.0.0 replaces 0.9.0 for testers, and no re-consent screen exists.
- S-15 (D-138 item 3, BL-575): whether the box before first use and the sign-in agreement bind.
- S-21: California rights wording.
- S-23 (packet Q51): the 31, 38 and 45 day periods, and the Supabase backup length (not known).
- S-24 (packet Q23): the security test before outside families sign in.
- F-6: the "An early version" section of the Terms (Apple guideline 2.2).

I did not look up any statute or Apple rule today. Every legal citation in the drafts is carried from the earlier drafts and is unverified here.

## 6. What I did not do

- No edit to `docs/legal/` outside `drafts/store-1.0/`, to the 0.9.0 files, to BACKLOG, DECISIONS, CLAIMS, FOUNDER_QUEUE, workflows or the label. BL-1957 comes from `node scripts/agents/next-id.mjs` on 23 Nov and has no BACKLOG row yet; adding it is not mine.
- I could not read `infra/exec-rulings-2026-11-23-founder-blockers.md` (a Project doc, not reachable from this session). The status line "exec-team reviewed" is not used because no review has happened; the files say "draft for exec-team review". The coordinator's relay of ruling 1 is what I followed.
- No device run, no `tsc`, no test run (docs only).
