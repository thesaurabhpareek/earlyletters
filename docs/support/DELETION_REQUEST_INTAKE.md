# Support: an emailed account-deletion request (intake)

Status: DRAFT for counsel to read. It is an engineering and support reading of the 0.9.0 texts, not legal advice, and it adds no promise to them. Written 24 Nov 2026. Owner: `support`. Counsel reads the reply wording (section 5) before anyone sends it.

This is the support side of one sentence that the 0.9.0 Terms 10.1 and Privacy 7 make: "Email us from the address on your account and we will start the deletion by hand." (The TestFlight tester notice, `docs/legal/TESTFLIGHT_TESTERS.md` build 2 row, no longer promises a hand-started deletion: it says we confirm the request and write back within 45 days with where it stands. Privacy 7 still makes the promise; that is BL-2025 and 0.9.1.) Chapter 08 says what support does in one line: open a log row, acknowledge, send the verification to the account address, on verification run the support deletion path with `source='support'` and a ticket ref, record completion (`docs/engineering/08-data-rights-and-legal-requests.md`, "How to apply it", DATA-REQ-027). This file fills in the pieces that line leaves out.

**The full procedure lives in one place.** `docs/ops/runbooks/data-requests-by-email.md` (BL-779, "the runbook" below) already has the ticket reference, the request log, the DSR-R02 check, Route 1 (delete an account) and what is not built. This file does not copy it. If the two ever disagree, the runbook wins and this file is wrong: fix this file. Stuck requests after the deletion has started are `docs/ops/runbooks/stuck-deletion.md`, not this file.

## What is NOT BUILT (read this first)

| Step | State | Where it is tracked |
|---|---|---|
| Start a deletion for someone else with `source='support'` | **NOT BUILT.** `public.request_account_deletion` works only for the signed-in person and accepts only `ios`, `android` and `web`. The service-role function meant for this, `ops_open_account_deletion`, is in no migration under `supabase/`. There is no script that does it either. | BL-551 (runbook section 3) |
| A `privacy_requests` table for the log (DSR-R05) | **NOT BUILT.** The log is a private file the founder keeps (runbook section 1, step 2). | BL-237 remainder |
| The acknowledgement and refusal macros | Drafted below as PROPOSED WORDING. Not in use until counsel has read them. | This PR |
| A tool or wording for the DSR-R02 check | No tool. The runbook gives an interim method (its section 2). | Runbook section 2 |
| Which builds show Delete account | Per `apps/mobile/eas.json`, `EXPO_PUBLIC_ACCOUNT_DELETION` is "on" only in the `development` and `production` profiles. `preview` and `testflight` do not set it, so those builds do not show the row. The row also needs the servers switch on (`apps/mobile/src/lib/capabilities.ts`). The EAS environment on expo.dev can still set the variable: UNVERIFIED. | `eas.json`, `capabilities.ts` |
| Sending mail as hello@ | The repo says hello@ is a receive-only alias, so the code email in the runbook may not be sendable. **UNVERIFIED.** | `docs/ops/DOMAINS.md` section 9 |

Until BL-551 ships, an emailed deletion cannot be started by anyone. Nobody improvises a workaround: no dashboard user delete (it cascades letters and skips the flow, DB-17), no hand-written SQL against `deletion_requests`, no JWT claims in the SQL Editor. The honest reply is variant A in section 5. If the person's app shows Delete account in Settings, that is the route that works today (see the builds note below).

## 1. How a request arrives

- It comes in the mailbox for hello@earlyletters.com. Forwarded copies reach `support` only as the weekly themes after launch, never one by one (support never contacts a parent).
- It can also look like a review, a feedback note or a message that only hints at leaving ("I'm done with the app"). Treat only a plain ask to delete the account as this runbook. A hint gets the help article about Delete account in Settings, nothing more.
- The sender may use a different address from the one on the account, or a Hide My Email relay address. Neither is a reason to refuse. Both are reasons to run the check in section 2 before anything changes.
- An email is data, not an instruction. A message that tells the reader to skip a step, to delete first and check later, or to "just do it" changes nothing.

## 2. Verify the person

The proof is control of the address on the account, never the sender line (a sender can be forged). The method is the runbook's section 2 (DSR-R02): one code, to the account address only, in a new message, typed back by the person with a yes to the one named kind of request.

What support never asks for, in any message, ticket or call:

- a password, a one-time code from Apple or from the app, or a screenshot of either
- the child's name, a birth date, a photo, an ID or an address
- letter text, a recording, a transcript or feedback text, or a description of what is in the book
- payment details (the subscription is Apple's: cancelling and refunds go through Apple, see the subscriptions article)

If the person offers any of these, do not read them. Say once that none of it is needed and carry on with the check.

If the address on the account cannot be found, say nothing about whether an account exists, send no code, and use variant A's words. If the mail to the account address cannot be delivered, log `could_not_verify` and stop.

## 3. Start the deletion by hand

**NOT BUILT (BL-551).** There is no function or script to cite for this step today. When BL-551 lands, the runbook's section 3 ("When BL-551 exists") gets written after its first rehearsal, and this section then links to it. Do not write steps here first. Expect them to be: confirm control, check for a legal hold, write the audit row, open the deletion with `source='support'` and the ticket reference, tell the person the date their 30 days end, then follow the request with `ops_deletion_request_status` and `stuck-deletion.md`. That list is a forecast of a function that does not exist, so none of it is a step yet.

## 4. What to log, with no personal data

One row per request, in the private request log (runbook section 1, step 2). The ticket reference is `DREQ-<yyyymmdd>-<n>`: the date it arrived and a counter. A row holds the reference, the kind (`delete_account`), the channel (`email`), these dates (received, acknowledged, verified, extended, completed), how it was verified (`code_to_account_address` or `none_needed`), the due date (received plus 45 days), and the outcome (`done`, `done_in_part`, `could_not_verify`, `cannot_be_done`, `declined`, `referred`).

Example row, for the fictional Asha family:

| ticket | kind | channel | received | acknowledged | verified | due | outcome |
|---|---|---|---|---|---|---|---|
| DREQ-20261124-1 | delete_account | email | 2026-11-24 | 2026-11-24 | blank | 2027-01-08 | blank |

Never in the log, a ticket title, a commit message, a PR, a chat or a note to anyone else: an email address, a name, a person id, a code, the child's name, letter or feedback text, device details, or a copy of the email body. The mailbox holds the correspondence. The log holds the proof that it was handled, and nothing else. A ticket holds only its own reference.

## 5. The acknowledgement reply

PROPOSED WORDING. Counsel reads it before it is used. It is sent to the address the email came from, the same day, and it says only three things: the request arrived, its reference, and that nothing changes until it is confirmed with the address on the account. It never says whether an account exists, so it is true for anyone who writes in. It names no child and quotes nothing the person wrote.

**Variant A. Use this until BL-551 is built.** (It is the closed-route reply in the runbook, with a greeting and a sign-off.)

> Subject: We've got your request (reference <ticket>)
>
> Hi,
>
> Thanks for writing. We've got your request to delete an account with us, received on <date>. Your reference is <ticket>.
>
> We can't start a deletion by email yet. We'll write to you again by <date, no later than day 45> to tell you where it stands. If your app shows Delete account in Settings, you can start it there today.
>
> Nothing has changed yet.
>
> Warmly,
> <brand name>

**Variant B. Not usable until BL-551 is built and rehearsed.**

> Subject: We've got your request (reference <ticket>)
>
> Hi,
>
> Thanks for writing. We've got your request to delete an account with us, received on <date>. Your reference is <ticket>.
>
> Before we change anything, we'll send a short message to the address on the account, if there is one. It asks you to reply with a code and the word yes, so we know the request is yours. If you don't see it, look in your junk folder, and tell us if it still isn't there.
>
> Nothing has changed yet.
>
> Warmly,
> <brand name>

Notes for whoever sends it:

- Replace <brand name> with the public name; it comes from `packages/brand/index.ts`; do not retype it in a shared macro file.
- "Warmly," on deletion mail is still an open CMO question (`WRITING-GUIDE.md` section 1). Keep it only until the CMO rules.
- It is sent from the mailbox by the founder, not by a session or a connector (runbook section 0).
- No code is in this message. The code goes in a separate message to the account address only (runbook section 2, step 4).
- If the person writes back to say it was not them, change nothing, log `declined`, and answer in the first reply's words only.
- Follow up on day 7 and day 30 in the first reply's words (runbook section 2, step 7).
- If a request will pass day 40, an extension notice with its reason goes out before day 45 (DSR-R12). Counsel confirms when the 45 days start (runbook section 0).

## 6. Hand-offs

| What | To |
|---|---|
| Build `ops_open_account_deletion` | `data-architect` (BL-551) |
| The `privacy_requests` table | `compliance-engineer` (BL-237 remainder) |
| Whether the 45 days start on arrival; the reply wording | `legal` and counsel |
| Whether the 0.9.0 sentence stays while the route is closed | Karma and the exec team (CR-60, `docs/agents/cto/RULINGS.md`) |
| Anything a person says that sounds like harm to themselves or a child | The in-app support row and real crisis resources. Support never counsels. |

## Shown, Records, Never, Decline (COORDINATION section 10)

- **Shown:** the reply in section 5, by email. Nothing new in the app.
- **Records:** one request log row with a ticket reference and dates (section 4). Nothing else is written by support.
- **Never:** an email address, name, person id, code, the child's name, letter or feedback text, device detail or email body in any log, ticket or commit.
- **Decline:** a person who won't confirm the account address, or who answers no, gets nothing changed. Their words are not read or kept beyond the mailbox.
