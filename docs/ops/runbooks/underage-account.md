# Runbook: an account belongs to someone under 18

Early Letters is for adults 18 and over (D-006, Terms 2.1). Use this runbook when we have actual knowledge that an account holder or a family contributor is under 18. Actual knowledge can come from:
- a support message from the person, a parent or anyone else;
- a store age signal saying minor after sign-up, once Declared Age Range is built (not yet; COUNSEL_PACKET Q5(d) asks whether this counts as actual knowledge even after a Yes at our gate);
- a co-parent or invitee report.

Promise being kept (Privacy Policy, COPPA paragraph; LEGAL-REQ-002):
- **Under 13:** we delete the account within 10 days of learning.
- **13 to 17:** we close the account and, where the law allows, offer an export first.
- **Under 13:** the inviter is told neutrally (LEGAL-REQ-002). We do the same for 13 to 17, as a matter of practice.

Engineering reading, confirm with counsel. Owner: `regulatory-affairs` with `ops`; the Chief Compliance Officer (council role) reviews changes to this file.

## 0. Rules for the whole runbook
- Do not ask for an ID, a birth date or any proof of age. Data minimisation, and the gate never stored one (D-026). The report itself is the actual knowledge.
- Do not read, search or quote the person's letters to decide anything.
- Keep ids and emails on screen only. Never paste them into chat, tickets or email; the ticket holds only its own reference.
- If the report looks like a safety concern about a child, stop and use the safety routing first. It is drafted by the `support` agent and is not yet on `develop` (help centre PR #41).

## 1. Record the report (same day)
Write one audit row before anything else. All SQL runs in Dashboard > SQL Editor as `postgres`.
- Under 13: runbook `under_13`, which exists in `ops.audit_log`.
- 13 to 17: runbook `deletion` with reason `under_18_closure`. No separate `under_18` value is needed (CR-39).

```sql
select public.ops_audit_write('<your handle>', 'under_13', 'actual_knowledge', '<ticket>', '<profile id>');
-- 13 to 17:
select public.ops_audit_write('<your handle>', 'deletion', 'under_18_closure', '<ticket>', '<profile id>');
```

## 2. Check for a legal hold
```sql
select id, scope, reason_code, review_by from legal_holds where released_at is null and scope_id = '<profile id>';
```
If one exists, stop and take it to the founder. A hold wins over deletion (DATA-REQ-035 in `docs/legal/DELETION_AND_EXPORT_SPEC.md`).

## 3. Close or delete
**13 to 17:**
1. Reply neutrally that the app is for adults 18 and over.
2. Where the law allows, offer an export first: the person can export from Settings before the account closes.
3. Then open the account deletion (step 4).

**Under 13:** open the account deletion (step 4). Terms 2.1 offers an export to anyone under 18 "where the law allows"; whether to offer it to an under-13 is counsel's call (gaps table), so until counsel answers, ask the founder before offering it. The 30-day grace is skipped when counsel requires it (DATA-REQ-027).

**4. Open the deletion: not yet possible from support.**
- DATA-REQ-027 says support uses "the same functions under the service role with `source='support'`".
- But `public.request_account_deletion` works only for the signed-in person (`require_user()`), and it refuses `source='support'` (20261003000000).
- No service-role function opens an account deletion for another person (checked 31 Oct 2026).
- Until one exists, the only path is to ask the person to delete the account from Settings. That does not meet the under-13 promise if they don't act.
- Fix: a new migration with `public.ops_open_account_deletion(p_profile uuid, p_reason text, p_ticket text, p_skip_grace boolean)`. It is service-role only, writes `source='support'` and a `support_access` audit event, and is tested in `supabase/tests`. Owner: `data-architect`, after the 9 Nov go/no-go (BL-551, CR-39).

## 5. Tell the family, neutrally (within 10 days for under 13)
- If the person was a contributor or co-parent, tell the inviter only that the person can no longer take part, because the app is for adults.
- Never mention age, the report or who made it.
- The wording comes from a support macro (the `support` agent; not written yet, see the gaps table). Nothing is improvised in a ticket.

## 6. Close the ticket
- The deletion finishes through the normal worker (`stuck-deletion.md` if it stalls).
- Check `ops_deletion_request_status` shows `completed`, then close the ticket with its reference only.

## Gaps this runbook depends on (not yet)
| Gap | Owner | When |
|---|---|---|
| Service-role `ops_open_account_deletion` (section 4; BL-551) | `data-architect` | After 9 Nov, before any non-family sign-in (D-121) |
| Neutral notice macro | `support` | Before the first non-family tester |
| Store age signal (Declared Age Range; iOS 26 only, floor iOS 17) | `mobile` | The 1.0.x before 1 Jan 2027 (COUNSEL_PACKET Q5) |
| Whether a store minor signal after a Yes is actual knowledge | counsel, through the CLO | COUNSEL_PACKET Q5(d) |
| Whether an under-13 gets the export Terms 2.1 offers, and when the 30-day grace is skipped | counsel, through the CLO | Add to COUNSEL_PACKET before the first non-family tester |
