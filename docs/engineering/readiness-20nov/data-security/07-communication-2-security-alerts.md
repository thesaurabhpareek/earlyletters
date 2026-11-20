# 07.2 Account security alerts

Status: PROPOSED engineering reference | 20 Nov 2026 | Owner: `sync` with `security-architect` (read) and `content` (words) | Part 2 of 4 of document 07. Tags and level names as in 07.1.

No product card names a security alert (searched `08` to `11`, `19`, `21`, errata E1 to E73, GAP-LOG closures; none found [V]). The only list is `docs/emails/CATALOG.md:37-51` and the Supabase notification settings. So everything marked "not built" below is a proposal, and the questions in 07.4 (Q-COM-1 to Q-COM-6) ask product before anything is built. Defaults are stated; engineering builds the default if nobody answers.

## 1. What exists today

| Fact | Evidence |
|---|---|
| Sign-in is passwordless: a link and a 6-digit code, 15 minute expiry, one send per address per 60 s | `supabase/config.toml:63-74` [V] |
| Both addresses must confirm an email change | `config.toml:68` (`double_confirm_changes = true`) [V] |
| Supabase sends a notice to the old address when the sign-in email changes, and when a sign-in method is added | `config.toml:110-119` (`identity_linked`, `email_changed` enabled) [V] |
| Supabase's other notices are off because the thing does not exist (password, phone, MFA) | `config.toml:125-134` [V]; `identity_unlinked` is on with Supabase's default text (`:121`) |
| The phone pauses code entry after 5 wrong codes in 15 minutes, in memory only, per address | `errors.logic.ts:79-94`, `pending.ts:72` [V] |
| The server limits verify calls per IP (30 per 5 minutes); a per-address lockout is not documented | `docs/emails/SECURITY.md:109` [V, vendor docs read 3 Oct]; per-address lockout absent is [U] |
| A planned job pages the founder above 20 verify failures per address per hour, then signs the user out globally | `SECURITY.md:122` (Rec). Whether it is built: [U], nothing found in `supabase/functions` |
| Deletion: three receipts are sent by `purge-worker`; the re-authentication code is a Supabase template | `purge-worker/emails.ts:50, 58, 63`; `config.toml:106-108` [V] |
| Recovery key emails exist and are sent by `escrow` | `escrow/restore.ts:116`, `rotate.ts` [V] |
| `new-device-sign-in` has a template and a catalogue row (1.0, not launch-blocking) but no sender and no trigger; Supabase has no such notice | `templates/auth/new-device-sign-in.tsx`; `CATALOG.md:51`; no `renderForResend('new-device` call [V] |
| A parent-facing "sign out of all devices" control: none found. The remote `forceReauthEpoch` signs a phone out locally (scope `local`); server-side lever status is NOT RUN | `grep "scope: 'global'"` in `apps/mobile/src` empty [V]; `reauth.logic.ts:2`; `docs/ops/runbooks/sign-everyone-out.md:3` |
| The account-recovery runbook is not in the repo | `docs/ops/runbooks/` listing, 20 Nov [V]; named by `sign-everyone-out.md:5` and BL-598 |

## 2. The alert table

Channel for every alert is email to the account address, plus an in-app line only where the person is on the phone. No alert uses push (R2 in 07.1). Alerts are transactional, not marketing: no opt-out of a security notice, and they are sent even if the person declined everything else.

| ID | Event | Detected where | Channel | Status | Says (intent only; PROPOSED key `comms.alert.<id>.*`) | Never says | Data used (level) | Cap and idempotency key |
|---|---|---|---|---|---|---|---|---|
| A1 | New sign-in on a device not seen before | Needs a device-seen record at sign-in: a salted hash of an app-made device id per account (new table, `data-architect` migration task; no table exists) | Email only; no push | Template only; Q-COM-1 | "Your book was opened on a new iPhone on {date and time with zone}. If this was you, nothing to do. If not, here is what to do." Device word is a class ("an iPhone"), from the app, not the network | IP address, city, country, map, user agent string, the sign-in method's token, a link that signs in, any child or book name | Account id (L3), time (L2), device class (L2); the hash itself is L3 and never in the email | At most 1 per device ever, never for the first device; key `a1:<account>:<device hash>` |
| A2 | Repeated wrong code attempts | Client pause after 5 in 15 min (phone, in memory). Server count per address hash is [U] | In-app line only (I8). Optional email: Q-COM-5 | Pause built; email not built | In app: the existing `code_paused` words and a way to get a new code. Email, if ever: "Someone entered wrong codes for your book. Your book is safe. You do not need to do anything." | The number of attempts, the address typed, an IP, that the account exists to anyone but the inbox owner | Address hash (L3) in an ops counter; no address in a log | If built: at most 1 per 24 h per account; key `a2:<account>:<UTC date>` |
| A3 | Account recovery (someone regained access, or support acted) | Runbook step by `ops` or `support`; the runbook is missing | Email to the account address, then in-app line next open | Not built; blocked on the missing runbook | "Access to your book was restored on {date}. If this was not you, write to us." Sent for any act that changes who can sign in | Who at support did it, the ticket text, the reason | Account id (L3), time (L2), act class (L2) | Per act; key `a3:<audit row id>`; the act writes an `ops.audit_log` row first |
| A4 | Deletion requested, cancelled, executed | `request_account_deletion`, `cancel_account_deletion`, purge step 7 | Email (built) plus in-app status (I6); re-auth code by email (built) | Built (three receipts) | "We received your request. Your book stays until {date}. You can cancel any time before then." (`account-deletion-scheduled`) | Counts of letters, titles, names, the other members' names | Reference id and dates (L2); address (L3) | Once per request; key from the request id (`purge-worker/emails.ts:50`) |
| A5 | Sign-in email changed | Supabase Auth on confirm | Email to the old address (built) and the new address (built) | Built; copy and masking see Q-COM-4 | Old address: "The sign-in email for your book was changed on {date}. If this was you, nothing to do. If not, write to us now." | The password (none exists), a "cancel this change" link that carries a token | Both addresses (L3). Rec: show the new address masked (first letter and domain) to the old inbox, in full only to the new inbox | Per request; Supabase's own key |
| A6 | Sign-out of all devices | The person's own action, or `forceReauthEpoch`, or a lever in `sign-everyone-out.md` | Email only when the person or support ended sessions on purpose; in-app line on each phone signed out (I5) | Control not built; Q-COM-2 | "All devices were signed out of your book on {date and time}. Your letters are kept on your phone. Sign in again to carry on." | Which device did it, location | Account id (L3), time (L2) | Per act; key `a6:<account>:<epoch>` |
| A7 | A sign-in method added or removed | Supabase `identity_linked`, `identity_unlinked` | Email (linked: built; unlinked: Supabase default text) | Built | "Sign in with {Apple or Google} was added to your book." | Provider subject id, the provider account email | Provider name (L2), address (L3) | Per event |
| A8 | Recovery key used, rotated, restore requested | `escrow` function | Email (built); restore request also wakes the in-app list when push exists (not now) | Built | Per `packages/emails/src/templates/backup/*` | Key material, wrapped keys, the phrase | Address (L3); `escrow_rotation_notices.id` is the idempotency key (`DATA_CLASSIFICATION.md:579`) | Once per event |
| A9 | Passkey added | Not wired | Email | Template only; passkey not offered in v1 [U] | As A7 | Credential id | n/a | n/a |

## 3. How every alert is built (rules for `sync`)

1. **Fixed subject per kind.** The subject is a content key with no variable except nothing: no address, no name, no device, no time. Example family: "A change to your sign-in", "Your book was opened on a new device". The preheader follows the same rule. (L4 never in a subject, `DATA_CLASSIFICATION.md:69`; `packages/emails/README.md` preheader rule.)
2. **The body may carry** the event time in words with the zone short name (account time zone, else last synced device zone, else US Pacific), a device class word, and the help route. Nothing else personal. No IP, no place. A place invites a wrong "that is not me" panic and is a location datum we do not hold.
3. **No action link that signs anyone in or changes anything.** An alert never contains a one-time token, a magic link or a "yes it was me" link: mail scanners prefetch links and an attacker can forward the mail (`SECURITY.md` section 3.1). The only links are Help (the support mailbox) and instructions to open the app. Rec; the CISO reads it (Q-COM-4 council).
4. **Enumeration safe.** Alerts go only to the inbox owner. No screen or reply says whether an address has an account (`auth.en.ts` header rule; `SECURITY.md` 3.6).
5. **Sent from an Edge Function with the service role inside the function**, rendered by `renderForResend` from `packages/emails/generated/resend.ts`, with Resend's `Idempotency-Key` header set from the key in the table (`packages/emails/README.md:20-32`). The service key and the Resend key live only in the function's secrets (never the app). The function logs the kind, the request id and the outcome; never the address, the device hash, the time of the person, or the body (rule `DATA_CLASSIFICATION.md:69`).
6. **Rate limit and abuse.** Only A2 (repeated wrong codes, if it is ever enabled) and any future kind not listed here are capped: at most 5 such emails per account in 24 hours, then one summary the next day. A1, A3, A4, A5, A6, A7 (a method linked or unlinked can be a takeover step), A8 and A9 are security-relevant and are never capped, held or folded into a summary, so cheap alerts cannot push a real takeover warning to tomorrow. They are limited only by their own idempotency key (one per event). An attacker must not be able to use alerts to bomb an inbox: A2 is the risk, which is why its default is no email.
7. **Auth check.** The function is not callable by a client. It reads a database event or a queue row written by a security-definer function; the caller is the database role or a scheduled job (as `purge-worker`). No public endpoint sends an alert.
8. **Quiet hours.** Alerts are exempt from the 21:30 to 07:00 hold (a takeover warning sent 8 hours late is worse), as sign-in mail already is (`CATALOG.md:137`). Default; Q-COM-3.
9. **Delivery failure.** A bounce on an alert shows I7 in Me, Account. Apple Hide My Email: the same registration rule as sign-in mail (`CATALOG.md:141-150`).
10. **Both channels agree.** Where an in-app line exists (I5, I6, I8) it states the same facts as the email; the email is never the only place a legal fact appears.

## 4. Data path per alert (what reads what)

| Step | Reader | Data | Path |
|---|---|---|---|
| Detect | Supabase Auth hook or a database trigger | session start, device hash | Inside the database; no client call |
| Decide | Edge Function with the service role | Account id, kind, last sent time | Function secrets; RPC with `SECURITY DEFINER` and a pinned search path (`data-architect` writes it) |
| Render | The function | Fixed content keys, event time, device class | `generated/resend.ts` |
| Send | Resend | Address (L3), subject, body | HTTPS; Resend stores content by default (`CATALOG.md:22` E-1), which is why no L4 is ever in the body |
| Record | Database | Alert kind, account id, time, key (L3 and L2) | A row in `ops.audit_log` or an alert table; no body text |

## 5. Gaps and risks found

1. No card, no sender and no trigger for A1, A3 and A6 although the catalogue plans A1 at 1.0 [V]. A thief with the inbox gets no warning today.
2. The server side of "repeated failed codes" is unverified: no per-address lockout is documented and the founder-paging job is not in the repo [U]. The pause on the phone is advisory only: it lives in memory and is lost on restart (`pending.ts:72`).
3. No parent control to end all sessions; the only lever is the founder's, and its steps are NOT RUN (`sign-everyone-out.md:3`).
4. The recovery runbook named by BL-598 is missing, so A3 has no trigger and hand recovery has no written rule (`back-office.md:92`).
5. Auth template placeholder header still says `{expiresIn}` "1 hour" (`auth.en.ts:18`) while the setting is 15 minutes (`config.toml:74`); a stale comment, but a template test should assert 15 minutes appears [E: low risk].
