# Runbook: a parent asks us to limit the other parent's access to a book

Status: DRAFT, waiting for the exec team's counsel read (D-172). Not approved. Do not use it to limit anyone's access.
Tool: not built (BL-2103, on the migration row BL-1360).

This is FR-POL-04's file (`docs/product/prd/functions/support.md`) and FR-BKO-14 (a) to (e) sets its operating rules (`docs/product/prd/functions/back-office.md`). Written by Claude roles, not counsel. Owner: `ops`, with the `data-architect` for the tool; the CLO and the Chief Compliance Officer (council roles) review changes to this file.

Promise being kept (Terms 4.4): "We do not decide custody or family disputes, and we will not move or hand over one parent's letters at the other's request. We act on a valid court order that is properly served and that we can verify. If someone's safety is at risk, contact us; after checking, we may limit a person's access to a book."

## Gate: the two-parent book stays out of store builds until this is done

The two-parent book (NS-25) does not turn on in a store build until both of these exist:
1. this runbook, with its status line reading `Status: APPROVED` after the exec team's counsel read; and
2. the access tool, named on the `Tool:` line above as a function that a file in `supabase/migrations` creates.

`packages/content/test/trust-and-safety-gate.test.ts` reads `apps/mobile/eas.json` and the co-parent rule in `apps/mobile/src/lib/family/entry.logic.ts` and fails if a build that can reach someone outside the internal TestFlight group Family can open the invite flow, from any entry, while either is missing (CR-234). Today the rule is "servers on and an alpha build", so the App Store build has no invite flow and the gate holds.

"Store build" here means the profile whose `EXPO_PUBLIC_APP_ENV` is `production`, as the app decides it (`isAlphaBuild` in `apps/mobile/src/lib/billing/alpha.ts`). It does not mean every profile with `distribution: store`: the `preview` and `testflight` profiles are also `distribution: store`, but their `APP_ENV` makes them alpha builds. Of the two, only `preview`, whose server switch is on, opens the two-parent book to TestFlight testers today; `testflight` has servers off until the BL-1867 flip (`docs/release/TESTFLIGHT.md`). Both are pinned to the Family group (BL-2027, CR-184), so the gate does not cover them; the test fails as soon as `eas.json` sends either beyond Family while this runbook or its tool is missing, and no servers-on build goes to an external group or a public link by hand until then (CR-234). A dispute between testers gets M14 and no limit, like any other.

## 0. Rules for the whole runbook
- No action on one person's word. Both parents get the same first reply, macro M14 (`policy.familyDispute` in `docs/support/macros.md`).
- If the message says someone is in danger, the safety pointer (M6, FR-SUP-16) goes first, and nothing else happens that day. M6 is not written yet; until it is, use the interim pointer in `data-requests-by-email.md` section 0, the safety row.
- We never delete a letter to settle a dispute. A limit is reversible and hides; it does not remove.
- The limited person's own letters stay theirs to export (Terms 7.3).
- Counsel is the second reader for any limit, because the founder has no second reviewer, and every limit is recorded for the quarterly card (FR-BKO-14 (d); Q-BKO-5).
- Nothing is promised in the app or the help centre about removal (FR-BKO-14 (e)). NS-25-R13 offers no control, and this runbook adds none.
- Do not read, search or quote anyone's letters to decide anything.
- Keep ids and emails on screen only, never in chat, a ticket or a log row (`data-requests-by-email.md` section 0).
- Agent sessions never run these steps or read the mailbox. The founder does.

## 1. Record it (same day)
- Request log row (`data-requests-by-email.md` section 1): kind `safety`, or `other` for a dispute with no safety claim.
- An `ops.audit_log` row with runbook `safety_removal` only when a step touches data. The value exists in `ops.audit_log` (`supabase/migrations/20261004200000_ops_deletion_worker.sql`). The tool itself will write one `access_limit` row per use (FR-BKO-14); that value is not in the table's check yet and comes with BL-1360.

## 2. Decide
Counsel's questions go through the CLO. One is still open (the evidence standard, which also covers court orders we cannot verify), so until it is answered the answer to every request is M14 and no limit.
| Question | State | Where it is recorded |
|---|---|---|
| What evidence is enough to limit access (a court order, a protective order, something less) | Open | COUNSEL_PACKET Q50 |
| Who decides, when the company is one person with no second reviewer | Answered (default accepted 20 Nov): counsel is the second reader for any act that limits or ends an account | Q-BKO-5 in `back-office.md` section 10; FR-BKO-14 (d) |
| Whether the limited person is told, and when | Answered (default accepted 20 Nov): counsel decides case by case; by default no notice beyond the neutral in-app line (FR-BKO-15), and the one content-free email of FR-BKO-27 only if counsel says it is safe | Q-BKO-4 in `back-office.md` section 10 |
| Whether a court order we cannot verify changes anything | Part of the evidence standard above | Terms 4.4; Q50 |

## 3. Limit access (when the tool exists and counsel has said yes)
Not written. The tool (BL-2103) is a service-role function that limits one member's read of one book's server rows. It is reversible, never deletes a letter and writes one audit row. Its steps, and the test in `supabase/tests` that shows it hides and restores access, come with that row.

## 4. Undo
Not written; comes with the tool. A limit must be undone by the same function, with its own audit row.

## Gaps this runbook depends on
| Gap | Owner | When |
|---|---|---|
| The access tool and its `access_limit` audit value (BL-2103, BL-1360) | `data-architect` | Before NS-25 in a store build |
| Counsel's evidence standard (section 2, Q50) | CLO, exec team | Before NS-25 in a store build |
| The safety routing, macro M6 (FR-SUP-16) | `support` | Before the first non-family tester |
| The reporting set for content that reaches another person (`report-set.md`, FR-POL-03) | `support`, `product` | Before any hosting card's store flag |
