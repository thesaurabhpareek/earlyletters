# Support macros

Status: PROPOSED. Every reply below waits for the exec team's counsel read (D-172) before a person receives it. Written by the `content` role as a Claude role, not counsel. Owner: `support`; words: `content`; legal reading: CLO.

How this file works:
- A macro is a saved answer with a named trigger. Support starts every answer from one (FR-SUP-07). Nothing is improvised in a ticket.
- Each macro has an id from `docs/product/prd/functions/support.md` FR-SUP-07 where one exists, a key, a trigger, who receives it, and its words in a fenced block whose info string is `macro <key>`. A macro with no words to send has an empty block and says so.
- The founder reads the mailbox and sends replies himself. Agent sessions never read the mailbox or write to a person (`data-requests-by-email.md` section 0).
- Words follow `packages/content/WRITING-GUIDE.md`. Sign-off is "Warmly," then the brand name, while the CMO question on it is open (WRITING-GUIDE section 1). `packages/content/test/support-macros.test.ts` and `packages/content/test/trust-and-safety-gate.test.ts` read this file.

## Who receives what

One row per send. A situation that reaches two people gives both the same key, so neither parent gets different words.

| Situation | Recipient | Macro key |
|---|---|---|
| Family or custody dispute | The parent who wrote | `policy.familyDispute` |
| Family or custody dispute | The other parent, if they write | `policy.familyDispute` |
| Letter from a lawyer, a court or the police | The sender | none (no reply until counsel says so) |
| Report that an account holder or a family contributor is under 18 | The person who reported | `policy.under18Report` |
| Report of apparent child sexual abuse material | The person who reported | `policy.abuseMaterialReport` |

## M14 Family or custody dispute (FR-POL-05)

- Key: `policy.familyDispute`
- Trigger: either parent writes about custody, a separation or a family dispute, or asks us to move, hand over or remove the other parent's letters or access.
- Before it: if the message also says someone is in danger, the safety pointer (M6, FR-SUP-16) goes first, and this macro waits for another day. M6 is not written yet (`docs/support/safety-routing.md` does not exist, FR-SUP-16). Until it is, the pointer is the interim one in `data-requests-by-email.md` section 0, the safety row: local emergency services and the help the app shows by region.
- Send to: each parent who writes, in these words and no others. Never add a line for one parent that the other would not get.
- Then: change nothing. A request to limit someone's access goes to `docs/ops/runbooks/safety-removal.md`. Log kind `safety` or `other` (`data-requests-by-email.md` section 1).
- Source: Terms 4.2 and 4.4.

```macro policy.familyDispute
Hi,

Thanks for writing to us.

We don't decide custody or family disputes. We won't move or hand over one parent's letters at the other parent's request. We act on a valid court order that is properly served and that we can verify.

Warmly,
${brand.name}
```

## Letters from a lawyer, a court or the police (FR-POL-06)

- Key: `policy.legalProcess`
- Trigger: an email or letter from a lawyer, a court or the police, about any account, book or person.
- Send to: nobody. There is no reply, no action and no disclosure until counsel says so. Counsel is the exec team's review under D-172.
- Same day: write the log line below. If the letter names a date (a deadline, a hearing), it goes in `legal_date` that day. The founder tells the CLO the kind and the date only, never the document (FR-BKO-16).
- If a step later touches data, it writes an `ops.audit_log` row with runbook `legal_process`, and only then.
- Source: Terms 4.4; `data-requests-by-email.md` section 0, the row "From a lawyer, a court or the police".

Log line: the request log row of `data-requests-by-email.md` section 1, with its `ticket` (`DREQ-<yyyymmdd>-<n>`) and `channel` as for any row, and these values set:

| Field | Value |
|---|---|
| kind | `legal_process` |
| received | the day it arrived |
| legal_date | the date the letter names, the same day; blank if it names none |
| outcome | `referred` |

```macro policy.legalProcess
```

## M15 Report that someone is under 18 (FR-POL-07)

- Key: `policy.under18Report`
- Trigger: anyone writes that an account holder or a family contributor is under 18.
- Before it: if the report says the child is in danger or being hurt, the safety pointer (M6, FR-SUP-16) goes first, and this macro waits for another day (FR-SUP-16; `data-requests-by-email.md` section 0, the safety row). M6 is not written yet (`docs/support/safety-routing.md` does not exist, FR-SUP-16). Until it is, the pointer is the interim one in `data-requests-by-email.md` section 0, the safety row: local emergency services and the help the app shows by region.
- Send to: the person who reported, the same words every time.
- Never: ask for proof of age, an ID or a birth date; say whether an account exists; say what we did or will do to an account.
- Then: hand it to `docs/ops/runbooks/underage-account.md`. Log kind `under_18`.
- Source: Terms 2.1; `underage-account.md` section 0; `data-requests-by-email.md` section 0 ("A statement that an address has, or does not have, an account").

```macro policy.under18Report
Hi,

Thanks for telling us. ${brand.name} is for adults, 18 and over, and we look into every message like yours.

There's nothing more you need to send.

Warmly,
${brand.name}
```

## Report of apparent child sexual abuse material (FR-POL-02)

- Key: `policy.abuseMaterialReport`
- Trigger: anyone writes that they have seen, or are sending, sexual material involving a child, in the app or anywhere tied to it.
- Before it: if the report says a child is in danger now, the safety pointer (M6, FR-SUP-16) is the first and only reply that day, and this acknowledgement waits. M6 is not written yet (`docs/support/safety-routing.md` does not exist, FR-SUP-16). Until it is, the pointer is the interim one in `data-requests-by-email.md` section 0, the safety row: local emergency services and the help the app shows by region.
- Send to: the person who reported. An acknowledgement only.
- Never: open, download, preview, forward, copy, quote or delete any attachment or link. Leave it where it is. Do not reply with questions.
- Same day: the founder takes it to the exec team, which is the counsel under D-172. The exec team gets the kind and the date only, never the email or a link. Only the founder can file a report; a Claude role cannot.
- Open for the counsel read: whether "leave it where it is" meets the preservation duty that follows a report (18 U.S.C. 2258A(h)), and what the founder does with the mail after filing. The written procedure for the reporting duty in Terms 9 is not in this file (`docs/product/prd/functions/back-office.md`, `child-safety-report.md` is missing).
- Source: Terms 9 ("We report apparent child sexual abuse material to the National Center for Missing and Exploited Children as US law requires").

```macro policy.abuseMaterialReport
Hi,

Thanks for telling us. We've received your report, and it's with the right person.

There's nothing more you need to send.

Warmly,
${brand.name}
```
