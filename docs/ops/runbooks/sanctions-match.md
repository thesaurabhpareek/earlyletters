# Runbook: a possible sanctions match

Early Letters does not screen every name (D-137). This runbook is the check we do run, and what happens if it finds something. Owner: `regulatory-affairs` with `ops`; the Chief Compliance Officer (council role, not counsel) reviews changes to this file. Engineering reading, confirm with counsel (COUNSEL_PACKET Q57).

## 0. When to run it
- A report says an account holder may be a sanctioned person or entity, or acting for one.
- A support escalation or account-recovery contact gives a full name together with a reason to doubt it (a blocked-country address, a request to move a book or a subscription abroad).
- Never as a sweep of all accounts, and never by reading, searching or quoting anyone's letters.

## 1. Check
1. Open OFAC's Sanctions List Search (https://sanctionssearch.ofac.treas.gov). Search the name as given. Use only details the person already gave us; do not ask for an ID or a birth date.
2. No result, or a result that clearly differs (another country, another kind of entity): stop. Write one audit row with reason `sanctions_clear` and close.
3. A result that may be the same person: write one audit row with reason `sanctions_possible_match`, then go to section 2. Do not tell the person why.

```sql
-- reason: sanctions_clear or sanctions_possible_match
select public.ops_audit_write('<your handle>', 'legal_process', '<reason>', '<ticket>', '<profile id>');
```
Keep names and ids on screen only, as in every runbook. The ticket holds only its reference.

## 2. A possible match (same day)
1. **Do not delete anything.** Deleting the account or its letters could count as transferring blocked property. Do not open an account deletion, even if the person asks.
2. **Suspend sign-in.** The founder blocks the account from signing in to Supabase (founder step: hosted project). How to do this without deleting the account is a gap; see the table below.
3. **Tell counsel the same day**, through the founder. Send the ticket reference and the list entry, never letter content.
4. **If counsel says the account is blocked property**, a report to OFAC is due within 10 business days of blocking (31 CFR 501.603(b)(1)(i), read 1 Nov 2026). Counsel files or tells us how.
5. **Reply to the person neutrally**, in words counsel approves. Do not name the list.

## 3. Close
- Counsel says no match: lift the suspension, write a second audit row with reason `sanctions_cleared`, close the ticket.
- Counsel says match: follow counsel. The account stays suspended and kept until counsel says otherwise.

## Gaps (not yet)
| Gap | Owner | When |
|---|---|---|
| A way to suspend sign-in for one account without deleting it, and a test | `data-architect` with `security-architect` | Before any sign-in outside the family (D-121) |
| Counsel-approved neutral reply | `support` through the CLO | With Q57 |
| Whether account data or a prepaid Plus subscription is "blocked property" | counsel | COUNSEL_PACKET Q57 |
