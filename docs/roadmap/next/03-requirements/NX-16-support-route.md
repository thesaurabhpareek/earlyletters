# Theme 16: When I write to support, a person answers within a day

Readiness: 24 of 28. Author's score, `qa` to confirm. Remains: the founder says what promise the public pages may make and who answers on which days (C14); the target is a number only he can staff; counsel reads the `/support` page text only if it names data rights.

| | |
|---|---|
| Working label | NX-16 (working id, see `_CONVENTIONS.md`); backlog rank 18 in `../08-ranked-backlog.md` |
| Refines | F21 (support URL, App Store Connect), customer opportunity 24 in `../01-customer-needs.md`, BL-622 (as filed in PR #587, unmerged), NX-02-R10 (recovery), NX-04-R3 (delete page) |
| Tag | EVIDENCE for the need: "when I write to support, a person answers within a day" is customer need 24 (R2 T15; R7 theme 4). HYPOTHESIS that a one-business-day reply is staffable by the founder alone |
| Size | S (one web page, one app row check, one reply routine) |
| Gate | Founder (the promise and the mailbox duty). App Review 2.1(a) wants a working support page; that is the same page as theme 5 R5 |
| Order | 16 (provisional) |

## What the parent will see and do

In Settings, Help, they tap "Write to us" and their mail app opens, addressed to us, with the app version already in the subject line and nothing else about them. On the website, `/support` says in a few lines how to write, what helps us (what happened, which phone, never the words of a letter), how to delete the account, how to manage Plus (Apple's sheet), and how long a reply usually takes. A person replies.

## The check

"Old code" means this tree, searched 8 Nov 2026.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-16-R1 | EVIDENCE | Given the website, Then `/support` answers 200 with the support address, what to include and not include, the delete-account steps (linking `/delete-account`), the Plus manage steps, and the reply time sentence from R3; at 200% zoom 0 lines are clipped. | The page is absent: `apps/web/src/app/(legal)` holds `privacy` and `terms` only, and the support URL in App Store Connect is the home page. | F21; NX-05-R5 |
| NX-16-R2 | EVIDENCE | Given Settings, Help, Write to us, When tapped, Then the mail composer opens addressed to `brand.support.email`, subject carries the app version and build, the body is empty, and 0 characters of any letter, child name, sign-in email or token are in the draft. If the device cannot open mail, the address is shown to copy. | The row exists (`apps/mobile/src/components/settings/help-links.logic.ts` `mailTarget`, `settings/index.tsx` line 155); no test pins that the draft carries nothing but the version. | PRIV-R10 |
| NX-16-R3 | HYPOTHESIS | Given a message to the support address, Then the first human reply goes out within one business day, measured as the median and 90th percentile of first-reply time over each month; the public text says "usually within one business day" and no tighter. The founder may replace the number; the public text and the measure must always agree (the claims test reads the page). | No target exists; NX-02-R10 shows `support` has no set minutes. | Opportunity 24 |
| NX-16-R4 | EVIDENCE | Given a message about a lost sign-in, a deletion, a purchase or a bug, Then a saved reply exists for each in `docs/ops/runbooks/` or a support doc, none asks for letter text, a child's name or a password, and each links the in-app route (the Account screen, Delete my account, Apple's manage sheet). 4 of 4 replies exist. | The sign-in recovery runbook is not on develop; the deletion runbooks are for the worker, not for replying. | NX-02-R10; NX-04 |
| NX-16-R5 | EVIDENCE | Given the diagnostics ring buffer, When a parent chooses to attach it, Then the attach step says what is in it (unclean exits, queue depth, last sync code, model state, request ids), it is attached only by their tap, and it holds 0 letter text, names or audio. | `06-nfr.md` section 14 lists the buffer and says the person may attach it; no attach screen was found by search. | `06-nfr.md` section 14 |

**Shown:** the support page lines and the attach step.
**Records:** nothing in the app. The mailbox keeps the message; retention is `data-steward`'s to fix (proposed 12 months, UNVERIFIED against `data-policy.md`).
**Never:** ask for a password or letter text, ask a reason for deletion as a condition, reply with a letter's words, put an email address in a log or crash report.
**Decline and withdraw:** a parent can write nothing and the app works the same; they can ask for their mail to be deleted and `support` does it.

## Edge cases

Second account on a phone (the reply asks which sign-in email, in the mail, not in a form); a message from a minor (stop, `docs/ops/runbooks/underage-account.md`); a message that holds a letter anyway (the reply deletes the quote and does not store it); kill switch: none, mail is outside the app; deleted account asks for export (the export is on the phone).

## Offline behaviour

The mail app queues the message. The page needs a network.

## What we never do

Promise a reply time we cannot staff; use a ticket system that adds a vendor; ask for a rating in a reply.

## Copy needs

Web page words in `apps/web/src/content/site.ts` (`new` entry for the support page; the web app does not read `packages/content`). The reply-time sentence is a claim: the claims test (`packages/content/test/claims-capabilities.test.ts`) reads that file. The app row's label already exists (`helpLabel`, `helpValue`).

## Analytics events

None.

## Device rows

New: "Write to us opens a draft with the version only"; "attach diagnostics shows its list".

## Dependencies

Theme 5 R5 (the page set), theme 4 R3 (`/delete-account`), theme 2 R10 (recovery steps). No server work.

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. |
| Budget (`06-nfr.md`) | Web pages: fast first paint on LTE (website budget in `06-nfr.md`; read the row when the page is built, UNVERIFIED). First-reply time: R3 (this file). |
| Accessibility | WCAG 2.2 AA on the page (`06-nfr.md` section 8); the mail link has a visible name; 200% zoom; in the app the Help row at AX5 wraps with 0 clipped lines and VoiceOver reads "Write to us, opens your mail". |
| Switch, off behaviour, noticed by | No switch. Rollback: revert the page. Noticed by: the monthly first-reply measure and the weekly ops check. |
| Data class and retention | Support mail may hold L3 (sign-in email) and, by mistake, L4. Mailbox: founder-held; delete quoted letter text on sight; retention to fix (R-privacy). Nothing reaches logs. |
| Schema and grants | None. |
| Analytics events | None. |

## Trace and tests

Id convention: `_CONVENTIONS.md`.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-16-R1 | F21 | web check (proposed `scripts/ops/web-pages.mjs`, shared with NX-05-R5); `[NX-16-R1] /support answers 200 with the five parts` | none |
| NX-16-R2 | PRIV-R10 | mobile unit on `help-links.logic.ts` (proposed `apps/mobile/test/help-links.test.ts`); `[NX-16-R2] draft holds the version only` | new: Write to us opens a draft with the version only |
| NX-16-R3 | opportunity 24 | claims test (exists; add the sentence); `[NX-16-R3] page promise equals the measured target`; the measure is an ops check | none |
| NX-16-R4 | NX-02-R10 | doc check (proposed); `[NX-16-R4] four saved replies exist and ask for no content` | none |
| NX-16-R5 | `06-nfr.md` section 14 | mobile unit (proposed); `[NX-16-R5] attach is by tap and holds no content` | new: attach diagnostics shows its list |

Trace: NX-16-R1..R5 -> F21, BL-622 (PR #587), opportunity 24.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| The public reply promise and who answers | "Usually within one business day", founder or `support` agent drafts and he sends; measure it for a month before tightening |
| Use the home page or a `/support` page for App Store Connect | A `/support` page (2.1(a) asks for a working support page) |

## Not verified

The roster handle `support` as a person who can send mail (it is an agent role). Whether Resend inbound or a plain mailbox receives `hello@`. Retention rules for the mailbox. The website performance row.
