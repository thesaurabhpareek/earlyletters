# The Free-to-Pro line for `scribe-prod` (BL-814)

Owner: `ops`. Status: proposed, for the founder. Written 10 Nov 2026. Money is founder-only: this page gives a recommendation and a default, never a decision. Agents have no access to the hosted project; every reading below is taken by the founder in the Supabase dashboard, or by the weekly job in #685 once the founder has installed it.

Existing plans this page points to and does not repeat:
- #685 (open): `docs/ops/runbooks/free-tier-ops.md` holds the Free plan facts, the keep-alive, the nightly dump, the weekly limits job (`scripts/ops/free-limits.ts`, alert at 80%), project slots and the real-restore steps.
- #622 (open): `docs/ops/runbooks/staging-backup-free.md`, the backup role and the restore drill. Its review findings (the backup URL is as sensitive as the database; the restore check must cover every table; Storage is not in the dump) are carried into #685.
- `docs/ops/DEPLOY.md` "Restores" and `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-030.

## 1. What I read, and where (10 Nov 2026)

Read in this session on supabase.com. The pricing page itself (`/pricing`) could not be opened here; figures below come from the docs pages named.

| Fact | Source | Status |
|---|---|---|
| Free quotas: egress 5 GB (uncached) and 5 GB (cached), database 500 MB per project, 50,000 monthly active users, storage 1 GB, 500,000 Edge Function invocations, 2 projects (paused ones do not count) | /docs/guides/platform/billing-on-supabase, /docs/guides/platform/org-based-billing, /docs/guides/platform/manage-your-usage/egress | Verified |
| Pro quotas: egress 250 GB uncached and 250 GB cached ($0.09 and $0.03 per GB over), database 8 GB disk then $0.125 per GB, 100,000 MAU then $0.00325 each, storage 100 GB then $0.021 per GB | same pages | Verified |
| Pro costs $25 a month for a database-only project, with $10 a month of compute credits that cover Micro compute | /kb/faqs/platform/database-only-cost | Verified for one project; the pricing page was not readable |
| Free projects are paused after "a 7-day period" of low activity; a warning email goes to owners about one week before; paused projects restore from the dashboard within a window the page gives as 1 year (an anchor on the same page says 90 days) | /docs/guides/platform/free-project-pausing | Verified, with the 1 year vs 90 days conflict noted |
| "Paid projects cannot be paused"; Pro never pauses for inactivity | same page, and billing-on-supabase | Verified |
| Free: no automatic backups; the docs tell you to export with `supabase db dump` and keep copies elsewhere. Pro: daily backups, last 7 days | /docs/guides/platform/backups | Verified |
| Storage objects are not in database backups; a restore does not bring back objects deleted after the backup | same page | Verified |
| PITR is an add-on: 7 days $0.137 an hour (about $100 a month), 14 days $0.274 (about $200), 28 days $0.55 (about $400). Turning it on stops daily backups | same page | Verified |
| Over a Free quota: a notice to the billing email, then a grace period (length not stated), then restrictions that can include read-only databases, pausing or HTTP 402 on API requests; they clear at the next billing cycle or at once on upgrade | egress page, billing-faq (as read for #685 on 8 Nov) | Verified, grace length UNVERIFIED |

UNVERIFIED, and not guessed:
1. The Pro price and credits on the pricing page itself (the $25 and $10 above come from the knowledge-base page and from F08 Q9 in `BACKUP_RUNBOOK.md`).
2. Whether a spend cap exists for this plan and what it stops. No page I could read says. The founder checks Organization > Billing before upgrading.
3. Whether PITR needs a compute add-on. `DEPLOY.md` (3 Oct) says at least Small compute; the backups page today says "available on all compute sizes". The monthly cost of Pro plus compute plus PITR for `scribe-prod` is therefore not known.
4. Whether one keep-alive read a day counts as enough activity (the page says "a few user requests each day").
5. The length of the over-quota grace period, and the Free disk size behind the 95% read-only rule.
6. Whether a Pro project can be moved back to Free, and how fast an upgrade takes effect. I assume the upgrade is immediate and have not read it.
7. Whether the 500 MB database quota is per project or summed across the organisation (the two pages differ; #685 raises the same point).

## 2. Plain picture, before the triggers

Free costs nothing and gives four things up: it can pause, it has no automatic backup, it has no support channel, and a quota overrun can turn into an outage. Pro at about $25 a month (about $300 a year) removes the pause and adds 7 daily backups. It does not back up Storage, and it does not add point-in-time recovery unless that add-on is bought. So Pro fixes pause risk and the no-backup gap; it does not fix the `ops-ledger` Storage gap (#685 real-restore section), which stays a nightly copy job either way.

Two things on `develop` currently assume Pro and are out of step with the founder's Free ruling of 8 Nov: `docs/ops/SECURITY.md` line 129 ("Pro plan daily backups, 7 days") and DATA-REQ-030 ("Given production, Then the project is on Pro"). #685's body proposes the wording. I do not edit `docs/legal`; the privacy lane does. Until the line below is crossed, the published "backups roll off within 7 more days" sentence is not backed by anything on Free except our own 7 nightly dumps.

## 3. The triggers

A trigger is a number someone can read. Two kinds: a hard trigger moves the project to Pro the same day, and a soft trigger starts a conversation with the founder within three days.

| # | Trigger | Soft | Hard | How it is read |
|---|---|---|---|---|
| T1 | Database size (all databases in the cluster, as Supabase counts it) | 300 MB (60%) | 400 MB (80%), the #685 alert line | #685 weekly job; dashboard Organization > Usage |
| T2 | File storage | 500 MB (50%) | 800 MB (80%) | Dashboard only (the job's role cannot read Storage). Today near zero: only `ops-ledger` ids. Turning on recording backup (`entry-audio`) is itself a hard trigger: do not turn it on while on Free |
| T3 | Egress | 3 GB (60%) in the month | 4 GB (80%) in the month | Dashboard Organization > Usage, uncached and cached lines both |
| T4 | Monthly active users | 30,000 | 40,000 (80%) | #685 job prints the account total (an upper bound) and 30-day sign-ins (a lower bound) |
| T5 | Pause | A Supabase warning email arrives, or the keep-alive job has failed once | The project shows Paused, or the keep-alive has failed on 2 nights in a row | Founder's inbox for the warning; `ops-alert` issue "Production keep-alive failed" |
| T6 | Backups | The nightly dump failed once | The nightly dump failed on 2 nights in a row, or a monthly restore drill printed FAIL, or the first real family other than the founder's own is on production and no drill has passed yet | `ops-alert` issue "Nightly Supabase backup failed"; `restore-drill.md` log |
| T7 | Over a quota | Supabase sends an over-quota notice | Any HTTP 402, a read-only database, or a restriction notice | Founder's billing email; dashboard banner |
| T8 | Release | Decision day passes with the account-first build going ahead (section 5) | The build shows In Review, or the submit button is pressed, whichever is first | Release record |

Notes on the numbers. Soft and hard values for T1 and T4 reuse the 80% line already in `free-limits.ts` so the job and this page agree; the 60% and 30,000 soft values and the T2 and T3 values are my proposals, not Supabase facts. T6's third clause exists because the nightly dump is the only backup on Free and an untested backup is not a backup. On Free, the dump is also the only thing that backs the privacy text.

Not a trigger: more than 500 MB of Storage objects "being in backups". They are never in database backups on either plan, so there is no plan change that fixes it. The fix is the nightly copy of `ops-ledger` files that #685 reviewers asked for or the risk the founder accepts in #685's decision list.

PITR is not part of the move. Recommendation: Pro with daily backups only, PITR off. Reason: DATA-REQ-030 allows PITR off or set to 7 days, PITR costs about $100 a month on top of $25 (UNVERIFIED compute add-on), turning it on stops daily backups per the backups page, and with a few hundred families the 24 hour loss window (RPO) in DATA-REQ-031 is acceptable. Revisit PITR when paying subscribers or 10,000 accounts make a day of lost letters unacceptable; that threshold is mine, for the founder to change.

## 4. Who checks, how often

| When | Who | What | Proof |
|---|---|---|---|
| Every Monday after 16:23 UTC | Founder reads the weekly job result; `ops` reads the `ops-alert` issues and the job summary the founder pastes or the issue shows | T1, T4 numbers from the job; T5, T6 from the other two jobs | One dated line in the release record: the two numbers and "no alert" or the alert |
| Every Monday | Founder, in the dashboard, 3 minutes | T2 and T3: Organization > Usage, storage and egress | The same dated line, with the two numbers |
| Any day an `ops-alert` issue opens | Founder, within one day | Read it; if it names a hard trigger, section 6 | The issue comment |
| Monthly | Founder | Restore drill (`restore-drill.md`), result written there | Date, tables, PASS or FAIL |
| Submit week | Founder, daily from decision day | T5: open the dashboard and confirm the project is Active; check the plan page | A dated screenshot of the project page in the release record |

If nobody has written the Monday line by Tuesday noon Pacific, `ops` opens an `ops-alert` issue asking for it. `ops` cannot read the numbers itself.

## 5. Relation to the submit date and the decision day

The submit date is not fixed in anything I could read (the Build 12 plan says the same; UNVERIFIED). I write it as S. The Build 12 plan (section 3.3, PR #707) names a decision day two working days before S, when each gate is answered yes or no.

- **Decision day (S minus 2 working days).** The founder answers this page's question. If the staged on-device binary is chosen (servers off), the production project is not used by the reviewers, and Free can stay; T1 to T7 keep running. If account-first goes ahead, the reviewer signs in to production (BL-786), so a paused or restricted project means a rejected review.
- **S minus 1 and S.** Open the dashboard: project Active, no over-quota notice, last keep-alive green, last dump green. Screenshot.
- **S, before pressing submit, or the day the build shows In Review if earlier.** T8. The BL-814 packet and the Build 12 plan say "move to Pro the day the build is In Review". My recommendation is to move on decision day when account-first goes ahead, not on In Review day, for two reasons: review can start within hours of submission, and a 7 day idle pause is very unlikely in that window but a first-time upgrade done under time pressure is when a billing form or card problem costs a day (a risk to the founder, not a finding). If the founder prefers In Review day, the default in section 7 applies.
- **After approval.** Staying on Pro is a separate founder decision at the next monthly review; downgrading is UNVERIFIED (section 1, item 6).

## 6. What happens at a hard trigger

1. `ops` opens or comments on an `ops-alert` issue with the trigger id and the reading, and asks the founder the question in section 7 (b). `ops` does not touch billing.
2. The founder upgrades: Organization > Billing > change plan to Pro (menu names UNVERIFIED), confirms the spend cap setting, and saves a dated screenshot of the plan page in the release record.
3. After upgrade, the keep-alive job stays on for 30 days as a harmless check, then `ops` proposes removing it. Daily backups on Pro start; confirm yesterday's backup appears in Database > Backups (as `SECURITY.md` line 129 says) and keep the nightly dump too until one restore drill from a Supabase backup is done.
4. If the project is already paused: Restore from the dashboard first, then upgrade. A paused project cannot be restored if the window has passed (1 year or 90 days, section 1), which is why T5 hard is the first day, not the last.
5. `ops` updates `free-tier-ops.md`, `SECURITY.md` and the Build 12 ops sheet. The privacy lane updates `data-policy.md` section 5 and Privacy Policy section 10 BEFORE the backup settings change, as DATA-REQ-030 requires.

## 7. Founder decision wording

(a) Standing decision, asked once, on decision day or before:

> Production database plan for Build 12. Recommendation from `ops`: keep `scribe-prod` on Free while only the founder's family uses it; move it to Pro (about $25 a month, $300 a year, UNVERIFIED on the pricing page) on the earlier of decision day (when the account-first build goes ahead), the first hard trigger in FREE-TO-PRO-LINE.md section 3, or the first family outside yours signing up in production. Keep point-in-time recovery off. Options: (1) Free until In Review day, then Pro (the BL-814 default); (2) Pro on decision day (recommended); (3) Free until a hard trigger, even after launch. Reply with 1, 2 or 3. If you do not reply by decision day, option 1 applies and nothing is spent by anyone before then.

(b) Asked when a hard trigger fires:

> Trigger T<n> has reached its hard line (<reading> on <date>). Move `scribe-prod` to Pro today? Yes spends about $25 a month starting now; No keeps Free and the risk named in the issue. `ops` cannot upgrade for you.

Default if there is no answer within 24 hours: no spend, and the issue is reopened daily with the same question. For T5 hard (project paused) and T7 hard (HTTP 402 for everyone) the issue also says plainly that families cannot sync until it is answered. This default is a recommendation to leave money alone, not a ruling; the founder can change it.

## 8. What this page does not do

It does not change the plan, touch billing, secrets, EAS or App Store accounts, or edit `docs/legal`. It does not replace #685's runbook, and the three jobs there are still the only monitoring that exists; none of them has run yet (#685 is open). Until the founder installs them, every trigger above is read by hand from the dashboard, and T1, T4, T5 and T6 have no automatic alert at all.
