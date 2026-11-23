# Email and message audit, part 2: gaps and automation plan

Status: audit record, docs only. Owner: `content`. Part 1 (inventory, voice, visual): `docs/content/email-audit.md`. Binding rules read for this part: E75 (no marketing email at 1.0; transactional only; one welcome), E76 to E79 (security mail, no server push), CATALOG sections 2 and 12 (the "never send" list), CR-176 and D-170 as the guide cites them, `WRITING-GUIDE.md` section 8, and the privacy rule: no entry text, transcript, audio or child name in any email body or subject. [UNVERIFIED] I could not open CR-176 or D-170 text beyond what the guide and CATALOG quote.

## 4. Gaps: what we should send and do not

Allowed means: transactional, content-free (dates, ids, plan, adult names only to members of the same book), inside E75 and the CATALOG never-list. "Copy exists" means words are already in `packages/content/src/emails`.

| Gap | Proposed trigger and audience | State | Allowed? |
|---|---|---|---|
| Welcome after account creation | First successful sign-in; the new account holder; once per account | Copy and template exist (`welcome`); no sender | Yes (E75 allows the one welcome; no promotion; no child name) |
| Email verification and sign-in code | Already sent by Supabase Auth | Wired (Part 1, 1.1) | Yes. Gap is only that hosted SMTP and template state is unverified |
| Invite | Parent enters a co-parent address; the invitee | `coparent-invite` copy exists; the app shares a link by the parent's own Messages | Needs a product choice: CATALOG E-3 permits it only when the parent types the address. Child name never; inviter's name allowed |
| Co-parent joined | Inviter learns the co-parent joined | None, by CATALOG E-5 (silence inside a family) | Do not send. In-app card only |
| Data export ready | Server export finished (v1.1); account holder | Copy exists; export runs on the phone at 1.0 | Yes, when server export exists; link only, no letter text |
| Account deletion requested, cancelled, completed | Already wired through purge-worker | Wired | Yes |
| Book deletion requested and cancelled; co-parent left | Sole parent deletes or cancels a book; remaining parent when a co-parent leaves | Copy exists; purge-worker has no book step | Yes, content-free; the coparent-left name is an adult name inside the same book |
| Deletion by email through the website | Person who cannot open the app | `deletion-request-received` and `deletion-confirm` copy exists; `/delete-account` pages absent in `apps/web/src/app` | Yes; blocked on the pages (TPL-06) |
| Consent changes | Analytics or reminders switched off or on | None; CATALOG section 8 says in-app only | Do not send. A consent email adds mail nobody asked for |
| Plan receipts and trial or renewal notices | D-022 windows from the status report; the purchaser | 12 billing emails have copy; no sender; local reminders carry dates meanwhile | Yes: legally needed notices (CATALOG 7). Receipts and refunds stay Apple's (E-6) |
| Policy-change notice | Major policy version, 30 days before effect | Copy exists; no sender | Yes, before the first major change |
| Reminders and the first-letter prompt cadence | Local notification, parent opts in | Wired locally; no email, by rule | Email reminders: never (CATALOG 12, E79). Keep local |
| Quiet re-engagement | "quiet-message", opt-in | Playbook 6C proposes it; CATALOG 12 says never; E75 bars marketing at 1.0 | No at 1.0. Needs its own erratum, opt-in off by default, founder yes. Also `plus-quiet` reacts to a 60-day gap: counsel and product should read it against "never count gaps" |
| Security: new device, passkey added, sign-in method removed | New device (wired, dark), passkey (no sender), unlinked (Supabase default) | Held draft `drafts/sign-in-method-removed.HELD.md` | Yes; one account holder; no push (E76) |
| Waitlist launch announcement | Waitlist subscribers, once | `waitlist-ready` in the playbook; held on the postal-address decision | Commercial: needs consent (they gave it), unsubscribe, postal line. Keep on its own list |
| Email preferences and suppression | Any commercial send | No table in `supabase/migrations`; web uses Resend contacts and a signed unsubscribe token (`apps/web/src/lib/notify/unsubscribe.ts`) | Needed before any commercial mail, not before transactional |
| Bounce handling | Hard bounce or complaint | No Resend webhook in the repo | Needed for CATALOG 10.4 |

## 5. Automation plan

### 5.1 What exists

- Render and export: `packages/emails/generated/resend.ts` (`renderForResend`, idempotency, placeholder check), a drift test, and the Supabase export (`supabase/templates`).
- Two working senders: purge-worker (`supabase/functions/purge-worker/lib/resend.ts`, key `deletion-completed:<request>`, step receipts in the request row, retry for 2 days) and new-device-email (claim a row, one retry with the same key, failures counted in `ops.security_events`). Escrow has its own sender.
- Logging: closed enums and counts only (`supabase/functions/_shared/log/log.ts`); no addresses.
- Domain: the target SPF, DKIM, DMARC records and the DMARC ramp are written in `docs/ops/DOMAINS.md`; the state read from the Resend API at that time (verified, tracking off) is in `supabase/auth-email.md`. Live DNS and hosted settings [UNVERIFIED].

### 5.2 What is missing

1. One shared outbox: today each sender invents its own pickup. Nothing queues a welcome, a book-deletion, a billing or a policy email.
2. Triggers: events do not enqueue (no sign-in-complete hook, no book-deletion email step, no status-report to notice mapping).
3. Preferences and suppression storage, and a bounce and complaint webhook.
4. Schedules: the purge-worker cron line is a comment (`supabase/migrations/20261002020000_data_governance.sql:1271`); whether any cron is live on the hosted project [UNVERIFIED].
5. A test that every email id is either wired or listed as template-only, so the catalogue cannot drift from the senders.

### 5.3 Shape

Database event writes one row to `email_outbox` (kind, profile id, values-only payload of dates and ids, unique idempotency key, status, attempts, next attempt). A drain Edge Function claims rows with `for update skip locked`, renders from `generated/resend.ts`, sends through Resend with the idempotency key, records the result, retries with backoff, and raises the existing founder alert after a set number of failures. Suppression is a salted hash table (COMPLIANCE section 4); transactional mail ignores it except for hard bounces. Logs carry kind, outcome and counts only. A feature flag per kind keeps new senders dark until the words are approved.

### 5.4 Backlog rows (PROPOSED; ids from `scripts/agents/next-id.mjs`, next BL-1886; open PRs reach BL-1885 at check time, so re-run the tool when filing)

Owner handles are from `agents/roster.json`. Size XS or S. None asks the founder to approve, review, merge or paste.

#### BL-1886 Email copy: contractions and the guide tells
- Status: ready. Mode: agent. Owner: content. Size: S. Depends on: BL-1887.
- Scope: fix the 55 uncontracted forms and the findings in Part 1 section 2 in `packages/content/src/emails/*.en.ts` and the website hello; regenerate `generated/resend.ts` and `supabase/templates`.
- Done when: `packages/content` and `packages/emails` tests pass, the drift tests pass, the new email baseline is lower.

#### BL-1887 Run the tells lint over email and website-email copy
- Status: ready. Mode: agent. Owner: content. Size: XS. Depends on: none.
- Scope: `scripts/content/copy-tells.mjs` also scans `packages/content/src/emails/*.en.ts` and `apps/web/src/content/site.ts` `welcomeEmail`; baseline written once, shrink-only; one planted-violation test.
- Done when: `--check` passes on develop and fails on a planted "did not" in an email file.

#### BL-1888 Outbox and suppression tables
- Status: ready. Mode: agent. Owner: data-architect. Size: S. Depends on: none.
- Scope: one migration with `email_outbox` and a hashed `email_suppression`, grants in the same migration and in `supabase/tests/grants.mjs`; claim function with `skip locked`; no address in the payload.
- Done when: `npm run test:db` passes with an access test and a mutant that drops the unique key.

#### BL-1889 Drain function
- Status: ready. Mode: agent. Owner: privacy. Size: S. Depends on: BL-1888.
- Scope: Edge Function that claims, renders, sends, retries and counts, reusing `purge-worker/lib/resend.ts`; closed-enum logs; flag per kind, default off.
- Done when: `npm run test:functions` covers success, transient retry with the same key, and a refused send that never logs an address.

#### BL-1890 Welcome email trigger
- Status: ready. Mode: agent. Owner: privacy. Size: XS. Depends on: BL-1889.
- Scope: enqueue `welcome` on the first completed sign-in, key `welcome:<profile>`; the invite-origin variants wait for the invite decision (BL-1893).
- Done when: two sign-ins send one email; a mutant that drops the key sends two.

#### BL-1891 Book-deletion and co-parent-left triggers
- Status: ready. Mode: agent. Owner: privacy. Size: S. Depends on: BL-1889.
- Scope: enqueue `book-deletion-scheduled`, `book-deletion-cancelled` and `coparent-left` from the existing request and cancel paths; no book name, no child name.
- Done when: tests show one email per request and none when the leaver cancels inside the hour.

#### BL-1892 Plan notices from the status report
- Status: blocked until `subscription-status` is live. Mode: agent. Owner: payments. Size: S. Depends on: BL-1889.
- Scope: map D-022 windows to enqueue rows; a missed window raises the founder alert; a cancelled renewal skips pending notices.
- Done when: a table-driven test covers each window edge and the cancelled case.

#### BL-1893 Decide the co-parent invite channel
- Status: ready. Mode: agent. Owner: product. Size: XS. Depends on: none.
- Scope: record whether the app sends `coparent-invite` by email or keeps the share link; update CATALOG E-3 either way.
- Done when: the catalogue and the app agree and the decision is cited.

#### BL-1894 Bounce and complaint webhook
- Status: ready. Mode: agent. Owner: ops. Size: S. Depends on: BL-1888.
- Scope: signed Resend webhook writing hashed suppression for hard bounces and complaints; the in-app "could not reach" flag is a separate mobile row.
- Done when: a bad signature is refused and a bounce suppresses only non-required mail.

#### BL-1895 Hosted email setup check
- Status: ready. Mode: human. Owner: ops. Size: XS. Depends on: none.
- Scope: physical steps only: in the Resend and Porkbun consoles confirm the domain, SPF, DKIM and DMARC records, tracking off, the Apple private relay registration, the SMTP settings and the cron schedules; record results in `docs/ops/DOMAINS.md`.
- Done when: the verification commands in `DOMAINS.md` section "Verify" show the expected values.

#### BL-1896 Counsel reading of the email classes
- Status: ready. Mode: human. Owner: legal. Size: XS. Depends on: none.
- Scope: counsel reads the T? rows, plus-quiet, the waitlist hello promises and the billing cuts from BL-1886.
- Done when: each row in `COMPLIANCE.md` carries a counsel line.

#### BL-1897 Catalogue and sender drift test
- Status: ready. Mode: agent. Owner: qa. Size: XS. Depends on: none.
- Scope: test that every id in `emailsById` is either found in a sender or listed as template-only in `docs/emails/CATALOG.md`.
- Done when: it fails on a new id with neither.

#### BL-1898 Sign-in-method-removed copy
- Status: ready. Mode: agent. Owner: content. Size: XS. Depends on: none.
- Scope: finish the held draft as a PROPOSED key so Supabase's default `identity_unlinked` text can be replaced.
- Done when: the rules and email tests pass; words stay PROPOSED until approved.

### 5.5 Could not verify

Hosted Supabase SMTP, template and cron state; live DNS and Resend domain status; whether `NEW_DEVICE_EMAIL` is on anywhere; real-inbox rendering (Gmail, Apple Mail, Outlook); CR-176 and D-170 text; whether `moments` milestone strings are ever pushed.
