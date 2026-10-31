# AL-07 Account deletion

> **Drill identities first.** Follow `README.md` "Drill identities". Account deletion covers every book of the account and tombstones every letter it wrote at once, so this sheet deletes **only drill accounts** (Drill Mama, then Drill D), never an account that has ever been in a real family book. Do the drill-phone check (rule 3) on each phone before its first step, and check in Settings > Account that the masked email is the drill mailbox named in the row before you confirm any deletion. The staging SQL below changes exactly one row or nothing; never edit it to a broader `where`.

| | |
|---|---|
| Proves | In-app account deletion, never waived (07 section 5.3): export is offered first as the main action (F15-REQ-016, DATA-REQ-053); the Apple billing line with Manage shows when Plus will renew (C-REQ-019); a 30-day undo (LEGAL-REQ-029); the co-parent keeps the book and their letters (DATA-REQ-012, K-22); after completion nothing remains but pseudonymised acceptances and the suppression hash (LEGAL-REQ-031); Apple's token is revoked (BL-330, A-NFR-011). DEVICE_TEST_PLAN S2-13; `docs/ops/README.md` step 7 (staging, before the first build to anyone outside the family). Alpha plan journey J8; G3 "deletion verification in staging" |
| Builds | Rehearsal R1 at F19 for AL-07.1 to AL-07.6a; staging completion (AL-07.7 and AL-07.8; AL-07.9 is n/a, not built for build 2) before F27, before any friend signs in; a check of AL-07.1 to AL-07.3 on build 2 at F25, which needs `EXPO_PUBLIC_ACCOUNT_DELETION=on` in that build (without it the row is hidden: that is AL-07.11, not a failure of AL-07.1). Build 1 has no accounts: AL-07.10 only |
| Plan | Drill Mama: Plus renewing in the sandbox for AL-07.2 (AL-09.2 first), else record AL-07.2 as n/a. Drill Papa: Free, **exactly 1** letter of his own kept, in Asha's book (`Asha from Papa 1`, from AL-05.9, or from AL-07.0 if AL-05.9 has not run). Drill D: Free, 2 letters kept |
| Phones and accounts | Drill phones only. Phone A: Drill Mama (Mailbox 1), in the drill book for Asha with Drill Papa still a parent. Phone C: Drill Papa (Mailbox 2), with his one letter in Asha's book. Phone B: Drill D (Mailbox 4), its own drill book with 2 letters and no co-parent, for the sole-parent cancel (AL-07.6a) and then the run to completion |
| Time | about 55 min on the phones (AL-07.6a adds about 15), plus about 30 min for the founder on staging [E] |
| Needs first | `EXPO_PUBLIC_ACCOUNT_DELETION=on` in the build under test (the alpha builds hide Delete account without it, `docs/release/TESTFLIGHT.md` step 9). On a development client start Metro with it in the shell, `cd apps/mobile && EXPO_PUBLIC_SERVER_FEATURES=on EXPO_PUBLIC_ACCOUNT_DELETION=on npx expo start --dev-client --clear`, never in a `.env` file (the preflight FAILs on one); the staging `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` go in the git-ignored `.env.local` as `docs/qa/BACKUP_RESTORE_DRILL.md` step 1 says (move that file away before any preflight). **Do not use a drill account on an alpha binary while a deletion request is open on it**: a phone that lists a book has its Cancel button on the hidden Delete account page; finish with Cancel or completion first. AL-04 and AL-05.1 to AL-05.14 done, with Drill Papa still in the drill book (run AL-05.15, the leave step, after this sheet); staging function secrets set and `purge-worker` deployed and scheduled (F17); the consent pepper set on staging (APPLY.md step 6, R-17 checklist 5.5) |
| Record in | the session's evidence file, rows AL-07.0 to AL-07.11, with AL-07.6a |

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-07.0 | The drill-phone check on Phone A, Phone B and Phone C. On Phone A, Settings > Account shows Mailbox 1 masked; on Phone B, Mailbox 4. Then on Phone C (Drill Papa) open Asha's book and find Papa's own letter `Asha from Papa 1` (AL-05.9). Only if it is not there: Tonight > Type, `Asha from Papa 1`, Save, "Add to Asha's book" (Papa's first free letter, so no Keep sheet), and wait until Phone A shows it. | All three phones pass; if not, **stop** before anything is deleted. Papa's letter is in Asha's book on Phone C and on Phone A, so AL-07.4 has a letter of Papa's to check | pass or stop, per phone; Papa's letter there (yes, or "saved now") |
| AL-07.1 | Phone A (Drill Mama, signed in): Settings > Delete account. Read the screen. | Export is offered first, as the main action, before any confirm; the screen says what happens to each book in plain words (Asha's book stays with Papa); no fear or loss wording | Screenshot name; yes or no per part |
| AL-07.2 | With sandbox Plus renewing (AL-09.2 first), open Delete account again. | The Apple billing line with Manage subscription shows before the confirm, because deleting the account does not stop Apple's billing | yes or no; "n/a, no subscription" if AL-09 has not run |
| AL-07.3 | Check once more that Settings > Account shows Mailbox 1 (Drill Mama). Continue; type the confirm word; confirm. | Deletion of Drill Mama is scheduled with a 30-day undo: the page shows "Deletion scheduled" over the date 30 days out, Cancel deletion and Sign out of this phone (which asks first, and says the deletion stays scheduled for the date). The app stays signed in until you tap Sign out of this phone and confirm (S64; it does not sign out by itself, though DELETION_AND_EXPORT_SPEC 2.6.1 step 7 says it does: the two specs disagree, raised in #358). The page offers no export after the request (DATA-REQ-053 is open); the letters on the phone are handled as the screen said | yes or no |
| AL-07.4 | Phone C (Drill Papa): open Asha's book. | Mama's letters have left the shared book (the request tombstones every letter she wrote: PRD V2 F11, from `supabase/migrations/20261003000000_security_and_family.sql` section 5). Asha's book stays on Phone C, and Papa's letter `Asha from Papa 1` (AL-07.0) is still in it, once, with the same words | yes or no per part; Papa's letter there (yes or no) |
| AL-07.5 | Phone A, within the 30 days: Settings > Delete account (sign in again as Drill Mama first only if you tapped Sign out of this phone). Cancel deletion. | Everything comes back: Mama's letters return to the shared book and to Papa's phone within one sync; Papa's `Asha from Papa 1` is still there once, on both phones | yes or no; seconds |
| AL-07.6 | Founder, staging SQL editor, read only: query 1 below with Drill Mama's user id (Authentication > Users, found by Mailbox 1). | One row, `status` = `cancelled`, with no step run against the account | status word |
| AL-07.6a | Sole parent, before AL-07.7. Phone B (Drill D; check Mailbox 4 first), a book with no co-parent and 2 letters: request deletion as in AL-07.3. Force-quit the app, reopen it, background it for a minute and reopen it; wait for a sync (the app syncs when it comes to the foreground). Note the screen and every button on it. Then tap Sign out of this phone: read the alert, tap Stay signed in, then tap Sign out of this phone again and confirm; note the screen; sign in again as Drill D. Then Cancel deletion, and time (stopwatch from the tap) how long the Book takes to open with the book and both letters back. | After the sync the phone shows only "Deletion scheduled", the date, Cancel deletion and Sign out of this phone: never "Begin the book", "I already have a book" or "I was invited", and no way to Settings or to a new book (a book is not tombstoned for a co-parent, so Mama's AL-07.5 never meets this). Sign out asks first and says the deletion stays scheduled (its buttons are "Stay signed in" and "Sign out"); signed out, the screen still gives the date and offers Sign in. After Cancel deletion: "Deletion cancelled", "Your letters and books are on their way back to this phone.", then the Book with the book and both letters, never the welcome in between. If the Book is slow, Try again shows that it is working and then says the book is still on its way | the screen seen at each point; yes or no per part; seconds from the cancel to the Book |
| AL-07.7 | Phone B (Drill D): request deletion as in AL-07.3 (check Mailbox 4 first). Founder, staging only: query 2 below must return exactly one row; then run statement 3 with that row's id. Then wait for the next hourly purge job and the purge worker (APPLY.md step 7, `docs/ops/README.md` step 5). Never on production. | Query 2 returns 1 row; statement 3 finishes without an error (it changes exactly that one row, or raises and changes nothing). The worker then runs every step; the receipt lists each system, with `apple: revoked` if Drill D used Apple or `apple: no_token` if it used email | Rows from query 2 (must be 1); statement 3: done or stopped; receipt step names and results (no ids) |
| AL-07.8 | Founder: `scripts/ops/verify-deletion.ts` for that request (runbooks/stuck-deletion.md section 6 shows the command). | No residue: no row, Storage object or Auth user points at Drill D, except the pseudonymised acceptances and the suppression hash | The script's summary line (counts only) |
| AL-07.9 | **n/a, not built for build 2.** Nothing builds the phone-side clear of the account's data (F02-REQ-007; "Erase everything on this phone" is S64 box 4 and is not built), so this row cannot pass. Do not run it; write "n/a, not built" in the evidence file. When it is built: Phone B, open the app. | It offers one export, then clears the account's data from the phone (F02-REQ-007); signing in again starts a new account | "n/a, not built" |
| AL-07.10 | Build 1 only: Settings. | No Account and no Delete account row (no accounts in build 1, `capabilities.ts`); Export works offline | yes or no |
| AL-07.11 | A build made **without** `EXPO_PUBLIC_ACCOUNT_DELETION` (build 2 as the freeze leaves it), signed in on a drill account with no request open: Settings. | No Delete account row, with Account and the rest of Settings as before. `/settings/delete-account` is unreachable: no link opens it (the link allowlist is `/` and `/invite`), and the page redirects to Settings; the redirect is pinned by `apps/mobile/test/account-deletion-switch.test.ts`, not by a phone step (*unverified* on a phone) | yes or no; screenshot of Settings |

## Staging SQL (founder, SQL editor on `scribe-staging` only)

The SQL editor runs as the database owner and ignores access rules, so each statement names the drill account's id and checks the row count. Paste the id only into the editor; it never goes into evidence, an issue or a chat.

**1. Drill Mama's request after the cancel (AL-07.6), read only:**
```sql
select status, cancelled_at is not null as cancelled
  from public.deletion_requests
 where profile_id = '<Drill Mama user id>'
   and kind = 'account'
 order by requested_at desc
 limit 1;
```

**2. Find Drill D's one scheduled request (AL-07.7), read only.** It must return exactly one row. If it returns none or more than one, stop and tell S19 and S02:
```sql
select id, status, scheduled_for
  from public.deletion_requests
 where profile_id = '<Drill D user id>'
   and kind = 'account'
   and status = 'scheduled';
```

**3. Make that one request due now (AL-07.7).** It changes exactly one row or nothing: if the count is not 1 it raises an error and the change is undone. If the editor shows the error, stop.
```sql
do $$
declare n integer;
begin
  update public.deletion_requests
     set scheduled_for = now()
   where id = '<the id from query 2>'
     and profile_id = '<Drill D user id>'
     and kind = 'account'
     and status = 'scheduled';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'stop: % rows matched, expected exactly 1; nothing was changed', n;
  end if;
end $$;
```

## Pass rule

AL-07.0, AL-07.1, AL-07.3 to AL-07.6a, AL-07.7 and AL-07.8 pass (AL-07.2 when Plus is set up; AL-07.9 is n/a for build 2). Alpha go needs AL-07.7 and AL-07.8 to have passed on staging at least once: until they do, friends do not sign in (`docs/ops/README.md` step 7 makes it a gate before the first build to anyone outside the family).

## Stop rule

S0: the co-parent loses a letter of their own, deletion touches an account other than the drill account asked for, or a request the person cancelled runs anyway. Stop the purge worker schedule on staging (`supabase/cron/purge-worker.sql` job) and tell the founder.

S1 (does not stop the session; file it before the build goes out): a sole parent with an open request sees the first-run welcome, "Begin the book", or cannot reach Cancel deletion (AL-07.6a).

## Not proved here

Deletion of the production project's data (no family data on production in the alpha), the email request path on the website (`/delete-account`, LEGAL-REQ-030), the 31-day and 45-day processor promises (they need real time).
