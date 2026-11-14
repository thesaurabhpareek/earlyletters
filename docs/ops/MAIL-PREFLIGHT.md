# Mail preflight: before sign-in codes go to real users

Owner: `ops`. Written 9 Nov 2026 for BL-788 (NX-31-R20, gate G7 of the Build 12 plan). Companion to [AUTH_SETUP.md](AUTH_SETUP.md) section 4 (how to set things) and [DOMAINS.md](DOMAINS.md) (every DNS record). This page is the order and the proof: what must be true, who does it, and what to record.

Why it matters: in Build 12 the email code is one of two doors into the app. Mail that does not arrive is a locked door, and an App Review reviewer who never gets a code is a failed review on the first screen (NX-31 section 6.5).

Labels. **Verified 9 Nov** means read on a vendor page in this session (the page is named). **Repo** means copied from a repo doc, not re-checked. **UNVERIFIED** means not read or not measured; do not rely on it. This runbook was written without DNS access or any account access: nothing here has been run against the live domain, Resend or Supabase.

**Founder-only** steps are marked `[FOUNDER]`: they need a registrar, Resend or Supabase login, or spend. `ops` and agents never touch those accounts. Agents can run the DNS script (section 1) and read its output.

## 0. The short version

Sign-in codes may go to real users only when every row of this table is green, with a date and a name in the release record.

| # | Must be true | Proof | Who |
|---|---|---|---|
| 1 | Resend shows the domain Verified | Screenshot of Resend > Domains | `[FOUNDER]` |
| 2 | SPF and DKIM resolve | Script rows `spf`, `dkim`, `bounce-mx` PASS | anyone (script) |
| 3 | DMARC is the policy ops chose, with a reports address | Script row `dmarc` PASS with `--policy` | founder changes DNS, script proves it |
| 4 | Click and open tracking are off | Screenshot of the domain Configuration tab | `[FOUNDER]` |
| 5 | The production Supabase project uses custom SMTP | Screenshot of the SMTP settings (password hidden) | `[FOUNDER]` |
| 6 | Email rate limit is at least the launch value | Screenshot of Rate Limits with the number | `[FOUNDER]` |
| 7 | Code expiry and length match the app | Screenshot of the Email provider page | `[FOUNDER]` |
| 8 | A real code reaches four inbox types with DKIM and DMARC pass | Table in section 7 filled in | `[FOUNDER]` with a tester |
| 9 | Bounce and complaint watching is set | Section 8 done; first dated reading recorded | `[FOUNDER]` reads, `ops` writes it up |

## 1. The script (no credentials)

```bash
node scripts/ops/mail-preflight.mjs --policy <none|quarantine|reject>
node scripts/ops/mail-preflight.mjs --policy quarantine --json     # for the release record
```

It looks up public DNS only (Node's built-in resolver). It sends no mail, calls no vendor API and changes nothing. Exit 0 means every DNS row passed, 1 means one failed, 2 means a usage mistake. The `MANUAL` rows are what DNS cannot show (rows 1, 4 to 9 above); the script never turns one into a pass, and a run with `MANUAL` rows left is not "ready".

What it checks, with the names it reads (record names from DOMAINS.md section 2, Repo):

| Row | Reads | Passes when |
|---|---|---|
| `dmarc` | TXT `_dmarc.earlyletters.com` | exactly one `v=DMARC1` record, its `p=` equals `--policy`, and it has `rua=`. With no `--policy` it fails on purpose: the policy is a decision, not a default |
| `dkim` | TXT `resend._domainkey.earlyletters.com` | a non-empty `p=` public key (split TXT chunks are joined) |
| `spf` | TXT `send.earlyletters.com` | exactly one `v=spf1` record that includes `amazonses.com` |
| `bounce-mx` | MX `send.earlyletters.com` | at least one MX (Resend's return-path) |
| `root-spf` | TXT `earlyletters.com` | not two SPF records (two is an error). None is only a `MANUAL` note |

If the machine cannot see public DNS (a sandbox answers "no data" to everything), the script says so in one row and fails, instead of printing false "no record" rows. Run it from a normal network.

What the DKIM row cannot do: it proves a key is published, not that Resend signs with it, and not that the key matches Resend's. Resend showing Verified (row 1) is the proof of that.

Test: `node --test scripts/ops/mail-preflight.test.mjs` (no network; the resolver is injected).

## 2. Resend: domain verified, tracking off `[FOUNDER]`

1. resend.com > Domains > `earlyletters.com`. Status must read Verified, and the SPF, DKIM and (if shown) bounce records must show as verified. Screenshot it with the date. (The exact status labels were not read in this session; Resend's introduction page says a domain must be added and verified to send and recommends subdomains for reputation: Verified 9 Nov, resend.com/docs/dashboard/domains/introduction. Whether to move sending to a subdomain is not decided here; today's records are in DOMAINS.md.)
2. Same domain > Configuration tab. Open tracking and click tracking must be off. Resend's tracking page says both are "disabled by default for all domains" and that tracking is active only when the setting is on and a tracking subdomain is configured and verified (Verified 9 Nov, resend.com/docs/dashboard/domains/tracking). So: confirm both are off, and confirm no tracking subdomain was ever added. Why we care: click tracking rewrites the sign-in link through a redirect (AUTH_SETUP 4.1, Repo), and the same Resend page says open tracking can hurt inbox placement and should be off for transactional mail (Verified 9 Nov).
3. If a tracking setting is on: turn it off in the dashboard (the page did not describe the dashboard control for turning off, so look on the same Configuration tab; the API can set `open_tracking` and `click_tracking`, and the page stated it only for create and update, so confirm in Resend's API reference before relying on it).
4. API key: AUTH_SETUP 4.1 says create `supabase-auth-smtp` with Sending access for this domain only (Repo). It goes into the Supabase SMTP password field and the password manager and nowhere else.

## 3. DMARC: from p=none to the chosen policy `[FOUNDER]` changes DNS

### Where we are
On 9 Nov the NX-31 requirement read the live record through Google's public DNS-over-HTTPS and found: `_dmarc.earlyletters.com` = `v=DMARC1; p=none; rua=mailto:hello@earlyletters.com; adkim=r; aspf=r;` and a DKIM key at `resend._domainkey` (Repo, NX-31 section 6.5; not re-read by `ops`, this session had no DNS). The first check after you open this page is to run the script and see whether that is still true.

Two repo docs disagree: AUTH_SETUP 4.1 says start at `p=quarantine`, DOMAINS.md says follow a staged plan from `p=none` to `quarantine` at 25 percent, to `quarantine`, to `reject`. NX-31-R20 says ops must choose one.

### The choice (ops recommendation, founder to confirm)
Follow DOMAINS.md, and choose **`p=none` for Build 12 launch** with the record tidied, moving up afterwards. Reasons: no mail has been sent from the production project yet (S-52 failed on 8 Nov), so we have no reports showing every legitimate source passes; quarantine without that evidence can send our own sign-in codes to spam, which is the failure this gate exists to prevent. `p=none` does not block anything. The cost is that nobody is protected from someone spoofing the domain until we move up; that is an accepted, written risk, not a default. If the founder prefers `p=quarantine` now, the script and steps below work with `--policy quarantine`; the price is that step 7 below (all four inboxes pass) must be proven first, not after.

The staged plan, from DOMAINS.md (Repo). Each stage is a separate DNS edit and a separate preflight run:

| Stage | `_dmarc` TXT value | Move on when |
|---|---|---|
| 1 Observe (Build 12) | `v=DMARC1; p=none; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` | 14 days of reports show every legitimate source passing DKIM with `d=earlyletters.com` |
| 2 | same with `p=quarantine; pct=25` | 7 days with no legitimate mail failing |
| 3 | `p=quarantine` (100 percent) | 14 days clean, including the four inboxes in section 7 |
| 4 | `p=reject` | steady state (A-REQ-026) |

### Step by step for stage 1 `[FOUNDER]`
1. Make sure `dmarc@earlyletters.com` exists as a receiving alias that forwards to you (DOMAINS.md section 9 lists it as "Suggested", so it may not exist). Without it, reports go nowhere. Alternative: keep `rua=mailto:hello@earlyletters.com` as today; then the only edit is optional (`fo=1`). Pick one and tell `ops`.
2. Porkbun > Domain Management > `earlyletters.com` > DNS. Find the TXT record whose host is `_dmarc`. Do not add a second one: two DMARC records make the policy invalid and the script fails on it.
3. Edit its content to the stage 1 value above (or the stage you are moving to). Keep TTL at 600 (DOMAINS.md, Repo). Save.
4. Wait for the TTL, then ask `ops` or run `node scripts/ops/mail-preflight.mjs --policy none`. `dmarc` must read PASS. (Porkbun's menu names were not re-read; if a label differs, look nearby.)
5. Put a dated entry in the release record: the policy chosen, who chose it, and the record text.

To move to a later stage, repeat steps 2 to 5 with the next value and `--policy quarantine` (then `reject`). Never move a stage on the same day as a build submission.

## 4. Supabase production project: custom SMTP `[FOUNDER]`

Today there is no production project in the docs (DEPLOY.md, `scribe-prod`; G1 of the Build 12 plan), and the mail settings live per project, so this section is done on the production project, not staging.

Why custom SMTP is not optional: the built-in service allows 2 messages an hour and refuses addresses that are not part of the project's team ("Email address not authorized"); the limits table says "2 per hour on the built-in provider" (Verified 9 Nov, supabase.com/docs/guides/auth/auth-smtp and /auth/rate-limits). A real user cannot sign in on the built-in service.

1. Supabase dashboard > the production project > Authentication > Emails > SMTP Settings > enable custom SMTP.
2. Values from AUTH_SETUP 4.2 (Repo; sender `hello@earlyletters.com`, name `Early Letters`, host `smtp.resend.com`, port 465, username `resend`, password the Resend key from section 2, minimum interval 60 seconds). Resend's own Supabase guide could not be opened in this session, so those host and port values are Repo, not re-verified today.
3. Screenshot the page with the password hidden. Check the project ref in the browser address bar is the production one before you start (a wrong-project change is the likeliest mistake).
4. Send one test (section 7) before announcing anything.

## 5. Rate limits `[FOUNDER]` sets, `ops` proposes the number

Read 9 Nov (Verified: supabase.com/docs/guides/auth/auth-smtp and /auth/rate-limits):
- After custom SMTP is configured, Supabase applies "a low rate-limit of 30 messages per hour" to protect the new sending service's reputation. It is changed on the project's Rate Limits page in the dashboard.
- One-time-code and magic-link sends: a 60 second window per user before a new request. Sign-ups and sign-ins: 30 requests per 5 minutes per IP address, bursts up to 30. Verification requests: 30 per 5 minutes per IP, bursts up to 30. The page says these can be configured (it does not say the allowed range).

What follows for us:
- The email limit is for the whole project, shared by every first code and every resend. At 30 an hour, a busy hour of launch signs in far fewer than 30 people, because each code request and each "Send a new email" uses one.
- The per-IP limits matter if several testers share one network (a household or an office): the 31st request in 5 minutes from that address is refused. Reviewers at Apple may share addresses (UNVERIFIED, not measured).

The launch number is not yet chosen. Rule of thumb for `ops` to propose, and the founder to set: expected email-path sign-ins in the busiest hour of launch week, times 2.5 for resends and typos, rounded up. AUTH_SETUP 4.3 already says about 100 an hour for TestFlight. Launch value to record here: `____ per hour` (open; the script cannot read it). Raise it in steps (for example 100, then higher after a week of clean bounce numbers) rather than all at once, because a new sender that suddenly sends a lot is judged on reputation; that reasoning is Supabase's stated reason for the 30 default, but any mailbox-provider thresholds are UNVERIFIED and not cited here. Cost: Resend's own sending quotas by plan were not read (UNVERIFIED); the founder checks the Resend plan covers the launch number before raising it.

Record: a screenshot of the Rate Limits page showing the emails-per-hour number, dated.

## 6. Code expiry and length `[FOUNDER]`

Supabase > Authentication > Sign In / Providers > Email (AUTH_SETUP 4.4, Repo):
- Email OTP expiration: `900` seconds. Every template says "15 minutes"; a different value makes the email lie.
- Email OTP length: `6`, and it must equal `EXPO_PUBLIC_EMAIL_OTP_LENGTH` in the EAS environment of the build that talks to this project (default 6). If the project shows 8, either change the project to 6 or set the app variable to 8 for every build, together. Mismatch means the code box rejects a correct code.
- Confirm email: on; the redirect URL list has exactly the one entry in AUTH_SETUP 5.1.
- Reviewer path: the code lives 15 minutes, and a reviewer in another time zone cannot wait on the founder (NX-31 section 6; G4). That is NX-05's decision, not this page's.

## 7. Test inbox plan `[FOUNDER]` with a tester

Send from the production project (after sections 2 to 6), not staging, with a throwaway sign-in address at each provider. Use accounts that belong to the founder or a tester; never real family details, and use the fictional family Asha for any test book.

| Inbox | How to get the address | Check | Result (date, who) |
|---|---|---|---|
| Gmail | a plain test account | arrives in the Inbox, not Spam; Show original says `DKIM: PASS` for `earlyletters.com` and `DMARC: PASS` | |
| Outlook | a plain test account | arrives, not Junk; headers show DKIM and DMARC pass (Message source) | |
| iCloud | a plain test account | arrives, not Junk | |
| Apple private relay | on a test phone, sign in with Apple choosing Hide My Email, then request an email code to that relay address | arrives at the real mailbox behind the relay. Needs `earlyletters.com` and `hello@earlyletters.com` registered under Apple Developer > Sign in with Apple for Email Communication (AUTH_SETUP 2.5, Repo); without it the mail is dropped | |

For each inbox also record: seconds from tapping Send to the code appearing (the NX-02 budget in NX-31 says p90 30 seconds, p95 2 minutes: proposed, untested), whether the link opens the app on the phone, and that typing the code by hand also signs in. Stage 3 of section 3 needs all four to pass again.

Stop rule: any inbox in Spam, or any failing DKIM or DMARC, means no real users. Fix first (usually a record, section 2 or 3), then retest that inbox.

## 8. Bounce and complaint handling

What exists (Repo): Resend's return-path domain is `send.earlyletters.com` and takes bounces (DOMAINS.md); the Build 12 plan's measure for "does the code arrive" is the Resend dashboard (delivered, bounced, complaint) plus the founder phone script with 3 to 5 parents, and the proposed target is bounce plus complaint under 2 percent, and `auth_email_sent` attempt 2 or higher under 15 percent (BUILD12-PLAN, Repo; both thresholds are proposed, not from a vendor).

What `ops` could not verify: how Resend suppresses repeat sends to a bounced address, whether it offers webhooks we would need, and any vendor threshold at which it pauses an account. None of that was read. Do not build alerting on assumptions.

Routine `[FOUNDER]`:
1. Day 1, day 3 and day 7 of the public build: open Resend > Emails (or its reports page), read delivered, bounced and complained counts for the period, and send the three numbers to `ops`. Counts only. Never copy an address or a message body into a ticket, a log or an agent chat (privacy rules).
2. Over the proposed 2 percent: pause the roll-out, run the script, check section 3 first (a DMARC or DKIM change breaks mail fastest), then Resend's own status for the domain.
3. A parent who says no code came: the app shows the recovery links after 60 seconds (NX-31-R11: send a new email, use a different email, Continue with Apple). Answer them by email from `hello@`, and ask for the sign-in method only, never the code.
4. Complaint (someone marks a code as spam): treat one as a signal about the template or about a wrong address typed by someone else, not noise.

## 9. Who does what, in order

| Step | Who | Needs |
|---|---|---|
| Run the script, paste output in the release record | `ops` or any agent | nothing |
| Choose the DMARC policy | founder, on `ops` recommendation | this page, section 3 |
| Create `dmarc@` alias, edit the `_dmarc` record | `[FOUNDER]` | Porkbun login |
| Check Resend Verified and tracking off | `[FOUNDER]` | Resend login |
| Production SMTP, rate limit, expiry | `[FOUNDER]` | Supabase login (production project), Resend key |
| Pro plan if the launch needs it (a paused Free project is an outage) | `[FOUNDER]` (spend) | BL-814 covers the date |
| Four-inbox test | `[FOUNDER]` with a tester | four mailboxes, a test phone |
| Bounce readings | `[FOUNDER]` reads, `ops` records | Resend login |
| Review that the evidence is complete | `security-architect` | the release record |

## 10. Record for the release record (gate G7)

Fill, date and sign: DMARC policy chosen `____` by `____` on `____`; script output attached; Resend Verified screenshot; tracking-off screenshot; SMTP screenshot; rate limit `____ per hour` screenshot; expiry 900 and length `__` screenshot; section 7 table; first bounce reading. G7 also needs the R-17 review status and the counsel packet answers; those are not in this runbook.

## Sources read in this session (9 Nov 2026)
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/rate-limits
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/dashboard/domains/tracking

Not opened (blocked or not needed): Resend's Supabase SMTP guide, Resend's DMARC page, Resend's pricing and quota pages, Apple's private relay documentation.
