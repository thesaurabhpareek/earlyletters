# Runbook: lost sign-in access, or someone else in an account

Use this runbook for two kinds of message:
- **Part A.** "I lost access to my email" or "I can't sign in any more".
- **Part B.** "Someone else is in my account", or anything that suggests another person signed in as them.

Today only the `preview` build profile signs anyone in (`EXPO_PUBLIC_SERVER_FEATURES` is `on` only there, `apps/mobile/eas.json`); production and TestFlight builds have no sign-in (D-121). The runbook applies to alpha testers now and to every later build that turns servers on.

Owner: `ops` with `support`; `security-architect` reviews changes to this file (IAM chapter, `docs/engineering/05-identity-and-access.md`). It is an engineering reading. A legal question (a court order, a police request, a dispute between two parents over a book) goes to `legal` and the founder, not into this runbook.

## 0. Rules for the whole runbook
- **Never ask for proof of identity.** No ID document, birth date, photo, address, payment detail, the child's name or anything from a letter. We never stored most of these (D-026), and anything we could check an attacker can find.
- **The only proof is control.** A person proves the account is theirs by finishing a sign-in themselves: a code sent to the account's address, or Sign in with Apple or Google. A reply from the address is a signal, not proof: the sender of an email can be forged.
- **Support never changes a sign-in email, and never links, unlinks or confirms an identity by hand.** Not in Supabase > Authentication, not through the admin API, not in SQL. Supabase's reference for `auth.admin.updateUserById` says such updates are "applied directly without confirmation flows" (https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid, read 8 Nov 2026). That is the social-engineering path into a book this runbook closes.
- **Every change goes through the person's own sign-in.** An email change needs both the old and the new address to confirm (`double_confirm_changes = true` in `supabase/config.toml`, pinned by `supabase/tests/auth_config.test.mjs`), and manual identity linking is off (`enable_manual_linking = false`, same test). The test reads the repository file; it cannot see the hosted projects, which `supabase/auth-email.md` section 3 lists.
- **Never delete the user in the dashboard,** even to stop an attacker. `profiles.id` cascades from `auth.users`, so it hard-deletes their letters (IAM-R22, DB-17, BL-728).
- **Never say whether an address has an account,** which sign-in methods it has, or when it last signed in. Everyone gets the same answer (IAM-R09).
- **Keep ids and emails on screen only.** Never paste them into chat, tickets or email; the ticket holds only its own reference.
- **Never read, search or quote letters** to decide anything.
- If the message suggests a safety concern for a child or an adult (for example, an ex-partner in the account), stop and use the safety routing first, as `underage-account.md` section 0 says.

## Part A. "I lost access to my email or my sign-in"

Part A changes nothing and looks nothing up, so it writes no audit row (LEGAL-REQ-025 covers runbook runs that touch people's data). If you think you need to look the person up, stop: either it is Part B, or it is a question for the founder.

### A1. Reply the same day
Send the standard reply. It says, in plain words:
1. Sign in with any other way you used before: Sign in with Apple, Sign in with Google, or a code sent to your email.
2. If your email account itself is lost, recover it with your email provider first. We can't do that for you, and we can't move your account to a new address by hand. This protects your book from anyone who pretends to be you.
3. Letters already on your phone stay there. You can still read them and record new ones, and Settings > Export works on this phone whether you are signed in or not (`apps/mobile/src/lib/export/device.ts:126`).

The reply's words are a `support` macro that does not exist yet (gaps table). Until it does, the founder sends it; nothing is improvised in a ticket.

### A2. What happens next
- **They sign in another way:** they are back in. Nothing for us to do. If they want to use a new email from now on, there is no in-app way to change it yet (no `updateUser` call in `apps/mobile/src`, grep on 8 Nov 2026; gaps table). When it exists, it is their own action, confirmed from both addresses.
- **They recover their email:** they sign in with a code as before.
- **They can do neither:** we cannot give them the account. If they share a book with a co-parent, the co-parent can invite their new address from the book, which gives them a new membership without support touching any identity. Nothing the old account wrote is deleted or moved by this.

### A3. Decline
If the person asks us to change the email, link a new sign-in, or "just let them in", decline with the same words every time and point back to A1. Do not explain what we can see.

## Part B. "Someone is in my account"

**Target:** within 4 hours of the report, the account's sessions are ended and the account is suspended (BL-598). **Today neither step has a tested path** (sections B3 and B4 say what to do until then). Write down every time in UTC as you go.

### B0. Start a log
Open one private note (not chat, not email) titled with the ticket reference. Record when the report arrived (this starts the 4-hour clock), how it arrived, and what the person says happened and since when.

### B1. Record the report
Find the person in Supabase > Authentication > Users by the address they gave, on screen only. Then write one audit row before you change anything. All SQL runs in Dashboard > SQL Editor as `postgres`, like the other runbooks.

```sql
select public.ops_audit_write('<your handle>', 'incident_scope', 'account_takeover_report', '<ticket>', '<profile id>');
```

Why `incident_scope`: `ops.audit_log.runbook` allows only twelve values (`supabase/migrations/20261004200000_ops_deletion_worker.sql:37-38`) and none is account recovery; a takeover is a security incident. Reason codes are free snake_case, up to 40 characters (`^[a-z][a-z0-9_]{0,39}$`). This runbook uses only these: `account_takeover_report`, `takeover_sessions_ended`, `takeover_suspended`, `takeover_deletion_held`, `takeover_cleared`, `takeover_confirmed`. The `detail` argument stays empty or holds enums only.

### B2. Is the reporter the owner?
Ask them to sign in on their own phone (a code to the account's address, or Apple or Google).
- **They can:** they control at least one way in. Go to B3 with their help.
- **They can't:** the other person may control their email. Tell them to secure their email account with their provider first; that is the most likely way in. You can still suspend on a credible report (B4): suspension keeps everything and is reversible. Nothing is handed back to anyone until the owner signs in themselves.

### B3. End the sessions
**If the owner can sign in on their phone (the only proven path today):**
1. They open Settings > Account > Devices and tap "Sign out other devices" (`authCopy.account.signOutOthers`). The app calls `signOut({ scope: 'others' })` (`apps/mobile/src/lib/auth/session-provider.tsx:525`).
2. Supabase destroys the other sessions' refresh tokens, but "Access Tokens of revoked sessions remain valid until their expiry time" (https://supabase.com/docs/guides/auth/signout, read 8 Nov 2026). The other phone keeps access for up to `jwt_expiry` seconds: 900 in `supabase/config.toml` (hosted value not checked here).
3. No test pins the `others` scope yet (BL-727).
4. Write `select public.ops_audit_write('<your handle>', 'incident_scope', 'takeover_sessions_ended', '<ticket>', '<profile id>');`

**If the owner can't sign in:** ending one person's sessions from our side is unproven (BL-597). What is known:
- `auth.admin.signOut` takes the person's JWT, not a user id (https://supabase.com/docs/reference/javascript/auth-admin-signout, read 8 Nov 2026), so support cannot use it with an id.
- `suspected-data-leak.md` section 1 points to a dashboard action to sign out all sessions; this runbook did not verify it. Unverified.
- Do not revoke the JWT signing key for one account. Whether it ends anyone's sessions is unproven (BL-597), and it would reach every family.

Until BL-597 is done, go straight to B4 and tell the founder in the same hour.

### B4. Suspend the account
**BL-552 (a service-role path that blocks one person's sign-in and sync, keeps all their data, is reversible and audited) is not built.** Until it is:
- Suspension is a founder step in the hosted project, never a support step.
- Supabase's admin API has a `ban_duration` setting (the reference shows a 100-year example, `'876000h'`). Whether a ban ends existing sessions or blocks a refresh is not on that page: unverified. Our database checks no ban (no `banned_until` in `supabase/migrations`, grep on 8 Nov 2026), so an access token already issued still reaches sync until it expires.
- Never suspend by deleting the user or changing their email.
- Write `select public.ops_audit_write('<your handle>', 'incident_scope', 'takeover_suspended', '<ticket>', '<profile id>');` when it is done, with the time in your log.

If the 4-hour target is missed, write down why in the log. Today it will be missed whenever the owner cannot sign in.

### B5. Protect the book while you look
1. **A deletion the owner did not ask for:**
   ```sql
   select status, scheduled_for from deletion_requests where profile_id = '<profile id>' and status in ('scheduled', 'executing');
   ```
   If one exists and the owner can sign in, they cancel it in Settings. If they can't, place a legal hold so the purge waits (a hold wins over deletion, DATA-REQ-035) and write `takeover_deletion_held` under runbook `preservation`:
   ```sql
   select public.ops_audit_write('<your handle>', 'preservation', 'takeover_deletion_held', '<ticket>', '<profile id>');
   insert into legal_holds (scope, scope_id, reason_code, matter_ref, placed_by, review_by)
     values ('profile', '<profile id>', 'other', '<ticket>', '<your handle>', current_date + 30);
   ```
2. **What changed in the books since the reported start.** Content-free events only:
   ```sql
   select at, action, child_id from audit_events
    where (actor_id = '<profile id>' or subject_id = '<profile id>') and at >= '<reported start, ISO>' order by at;
   ```
   An unexpected `invite_created`, `member_joined`, `member_removed` or `account_deletion_requested` goes in your log. A parent of the book can revoke an open invite in the app; support does not.

### B6. Investigate
- Did the sign-in email change? The account's old address got "Your sign-in email was changed", and the change needed both addresses to confirm, so the other person likely controls the old address too.
- Was a sign-in method added? The address got "Sign in with Google is now on your account" or the Apple version (`supabase/config.toml`, `[auth.email.notification.identity_linked]`). Manual linking is off, so Google or Apple joined through the same verified email.
- Do not undo either by hand. Take what you found to the founder; the fix goes through the owner's own sign-in once their email is theirs again.
- If anything suggests the other person read or copied letters, or more than one account is involved, start `suspected-data-leak.md` now: its notification clocks run from when you found out.

### B7. Close
- **Not a takeover** (for example, a co-parent on a shared book, or the owner's own second phone): the founder lifts any suspension, release any hold, write `takeover_cleared`, close the ticket with its reference only.
- **A takeover:** the account stays suspended until the owner signs in with an address they control; write `takeover_confirmed`, and follow `suspected-data-leak.md`.

## The person-facing lines (COORDINATION section 10)
- **Shown:** in the app, Settings > Account: `authCopy.account.devicesTitle`, `signOutOthers`, `signOutOthersHelp`, `signOutOthersDone` (`packages/content/src/features/auth.en.ts:207-210`). By email: the notification subjects in `supabase/config.toml` (`email_changed`, `identity_linked`). Support replies: none written yet (gaps).
- **Records:** only `ops.audit_log` rows through `public.ops_audit_write` (operator handle, runbook, reason code, ticket reference, profile id, enum-only detail), kept 12 months (`ops_retention`), and a `legal_holds` row when B5 places one. No consent act is recorded, so the PRIV-R21 consent fields do not apply.
- **Never:** an ID document, birth date, age, photo, postal address, payment detail, the child's name, letter content, an IP address or free text in any row or ticket (PRIV-R02, PRIV-R10, PRIV-R21 never-list). Never an email or id pasted outside the dashboard screen.
- **Decline and withdraw:** a person who will not sign in to prove control gets the A1 answer and nothing else changes. A suspension is lifted the day the owner signs in with an address they control. Letters on the phone, Settings > Export and recording keep working throughout; account deletion from Settings needs the owner signed in (PRIV-R09).

## Gaps this runbook depends on (not yet)
| Gap | Item | Owner | When |
|---|---|---|---|
| Suspend one account's sign-in and sync, keep its data, reversible and audited | BL-552 | `data-architect` with `security-architect` | Before any sign-in outside the family (D-121) |
| End every session for one person, and for everyone, rehearsed and checked | BL-597 | `ops` with `security` | After 9 Nov (CR-47) |
| A test that "Sign out other devices" uses scope `others` | BL-727 | `security` | After 9 Nov |
| A dashboard user deletion cannot hard-delete letters | BL-728 | `data-architect` | After 9 Nov |
| An in-app way to change the sign-in email (both addresses confirm) | none yet; `product` to file | `product`, `mobile` | Before any sign-in outside the family |
| Support replies for A1, A3 and B2 | none yet | `support` | Before the first non-family tester |
| A dedicated `ops.audit_log` runbook value for account recovery | none yet (a change to the table's check, `data-architect`) | `data-architect` | When BL-552 lands |
