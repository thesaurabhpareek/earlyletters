# AL-07 Account deletion

| | |
|---|---|
| Proves | In-app account deletion, never waived (07 section 5.3): export is offered first as the main action (F15-REQ-016, DATA-REQ-053); the Apple billing line with Manage shows when Plus will renew (C-REQ-019); a 30-day undo (LEGAL-REQ-029); the co-parent keeps the book and their letters (DATA-REQ-012, K-22); after completion nothing remains but pseudonymised acceptances and the suppression hash (LEGAL-REQ-031); Apple's token is revoked (BL-330, A-NFR-011). DEVICE_TEST_PLAN S2-13; `docs/ops/README.md` step 7 (staging, before the first build to anyone outside the family). Alpha plan journey J8; G3 "deletion verification in staging" |
| Builds | Rehearsal R1 on Fri 23 Oct for AL-07.1 to AL-07.6; staging completion (AL-07.7 to AL-07.9) before friends get build 2 on Thu 29 Oct; a check of AL-07.1 to AL-07.3 on build 2 (F25). Build 1 has no accounts: AL-07.10 only |
| Phones and accounts | Phone A on app account "Mama" (Account A) in Asha's book with Papa (AL-05); a separate fixture account "Account D" (Mailbox 2) with its own book and 2 letters, for the run to completion. Never the founder's real account |
| Time | about 40 min on the phones, plus about 30 min for the founder on staging [E] |
| Needs first | AL-04 and AL-05 passed; staging function secrets set and `purge-worker` deployed and scheduled (F17); the consent pepper set on staging (APPLY.md step 6, R-17 checklist 5.5); for AL-07.2, a sandbox Plus subscription that will renew (AL-09) |
| Record in | the session's evidence file, rows AL-07.1 to AL-07.10 |

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-07.1 | Phone A (Mama, signed in): Settings > Delete account. Read the screen. | Export is offered first, as the main action, before any confirm; the screen says what happens to each book in plain words (Asha's book stays with Papa); no fear or loss wording | Screenshot name; yes or no per part |
| AL-07.2 | With sandbox Plus renewing (AL-09 first), open Delete account again. | The Apple billing line with Manage subscription shows before the confirm, because deleting the account does not stop Apple's billing | yes or no; "n/a, no subscription" if AL-09 has not run |
| AL-07.3 | Continue; type the confirm word; confirm. | Deletion is scheduled with a 30-day undo; the app signs out; the letters on the phone are handled as the screen said | yes or no |
| AL-07.4 | Phone C (Papa): open Asha's book. | Mama's letters have left the shared book (the request tombstones every letter she wrote: PRD V2 F11, from `supabase/migrations/20261003000000_security_and_family.sql` section 5); Papa's book and letters stay | yes or no per part |
| AL-07.5 | Phone A: sign in again as Mama within the 30 days. Cancel deletion. | Everything comes back: Mama's letters return to the shared book and to Papa's phone within one sync | yes or no; seconds |
| AL-07.6 | Founder, staging: confirm the request moved to cancelled (Table Editor `deletion_requests`, status only). | `cancelled`, with no step run against the account | status word |
| AL-07.7 | Phone B, fixture Account D: request deletion as in AL-07.3. Founder, staging only: make that request due now in the SQL editor (`deletion_requests.scheduled_for` for that one request), then wait for the hourly purge or run it as the ops README says. Never on production. | The worker runs every step; the receipt lists each system; `apple: revoked` if Account D used Apple, or `apple: no_token` if it used email | How the clock was moved; receipt step names and results (no ids) |
| AL-07.8 | Founder: `scripts/ops/verify-deletion.ts` for that request (runbooks/stuck-deletion.md section 6 shows the command). | No residue: no row, Storage object or Auth user points at the person, except the pseudonymised acceptances and the suppression hash | The script's summary line (counts only) |
| AL-07.9 | Phone B: open the app. | It offers one export, then clears the account's data from the phone (F02-REQ-007); signing in again starts a new account | yes or no |
| AL-07.10 | Build 1 only: Settings. | No Account and no Delete account row (no accounts in build 1, `capabilities.ts`); Export works offline | yes or no |

## Pass rule

AL-07.1, AL-07.3 to AL-07.8 pass (AL-07.2 when Plus is set up). Alpha go needs AL-07.7 and AL-07.8 to have passed on staging at least once: until they do, friends do not sign in (`docs/ops/README.md` step 7 makes it a gate before the first build to anyone outside the family).

## Stop rule

S0: the co-parent loses a letter of their own, deletion touches an account other than the one asked for, or a request the person cancelled runs anyway. Stop the purge worker schedule on staging (`supabase/cron/purge-worker.sql` job) and tell the founder.

## Not proved here

Deletion of the production project's data (no family data on production in the alpha), the email request path on the website (`/delete-account`, LEGAL-REQ-030), the 31-day and 45-day processor promises (they need real time).
