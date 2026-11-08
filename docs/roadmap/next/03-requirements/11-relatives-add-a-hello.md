# Theme 11: A relative adds a hello without installing anything

| | |
|---|---|
| Working label | NX-11 (id: to be assigned) |
| Refines | F37 (web contribution page), F32 (contributors), FAM-05, FAM-07, FAM-06; opportunities 7 to 10 |
| Tag | EVIDENCE for demand: family sharing is the second most-praised theme in photo-album apps (31 reviews over 10 products, R2 T10); competitors already answer it (`02-benchmark.md` opening 3: Tiny Treasures by phone, From, Mama, Remento by link). HYPOTHESIS that pulling it earlier is worth the cost |
| Size | XL (feasibility item 13, 14 PRs, 6 fenced, about 8 founder hours). First slice smaller: write one hello, read nothing |
| Gate | Compliance rating: go slow, riskiest surface. Counsel memo on worldwide reach, a relative's notice and consent, CAPTCHA DPA. Security: threat model and a penetration test before public. Needs feasibility AD-1 |
| Order | 11 of 12. After public release; not in build 12 |

## What the parent will see and do

The parent picks Ask a relative, chooses a question and sends a link. The relative opens it in a browser, reads one plain notice, records or types a hello, and sends. The parent sees it waiting, listens, and chooses to add it to the book or not.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-11-R1 | HYPOTHESIS | Given a link for one book, When a relative sends a hello, Then it lands as a pending item, write only, and the token cannot read any letter (0 of 5 read attempts succeed). | No guest identity exists (AD-1). | Feasibility AD-1 option b |
| NX-11-R2 | HYPOTHESIS | Given a pending hello, Then it enters the book only after the parent's tap, and an unaccepted one expires after a stated number of days. Number set by counsel; default short. | Not built. | Compliance brief item 2 |
| NX-11-R3 | EVIDENCE | Given more than N sends from one link in an hour, Then the link refuses further sends; N is set by `security`. | Not built; abuse limits are a named risk. | TDD 10 risk 10 |
| NX-11-R4 | EVIDENCE | Given a sign-up from a blocked country, Then the page refuses with a neutral message and stores no name or IP. | Not built (theme 3 R7). | D-131 |
| NX-11-R5 | HYPOTHESIS | Given the page on iPhone Safari and Android Chrome, Then a relative completes a hello in 3 attempts or fewer on 6 of 6 recruited relatives. | Study G4 in `01-customer-needs.md`. | Section 4 |
| NX-11-R6 | EVIDENCE | Given accessibility checks, Then WCAG 2.2 AA run passes with 0 blocking issues. | New surface. | Compliance G-H |
| NX-11-R7 | EVIDENCE | Given a parent revokes a link, Then the next send is refused within 1 minute. | Not built. | Feasibility AD-1 |

**Shown:** a notice at collection for the relative: what is kept (their line, a first name they type, their relationship), who sees it, how to remove it. Words by `content`, counsel for the notice.
**Records:** the relative's notice acknowledgement with the PRIV-R21 fields where applicable.
**Never:** an account for the relative, a read of any letter, a tracker, an advertising id, rewriting their words, listing the book's child name on the page before the parent chooses.
**Decline and withdraw:** the relative can close the page with nothing stored; they can ask for removal by the same link.

## Edge cases

A link passed on to strangers; a relative's voice only (consent to store it); a huge file; slow network; the relative abroad (counsel reach memo); a pending hello after the parent deletes the book; no JavaScript.

## Offline behaviour

The page needs a network; it tells the relative when a send has not gone and keeps what they typed until it does.

## What we never do

Machine-written hellos, translated or synthetic voices (FUTURE section 7), read receipts, nagging a relative.

## Copy needs (packages/content)

Keys to add: `site.relative.notice`, `site.relative.sent`, `site.relative.refused`, `familyCopy.pending.review`. Counsel for `site.relative.notice`.

## Analytics events (opt-in, content-free, names only)

The web page runs no analytics. App side, existing: `invite_created`; new: `relative_hello_reviewed` (property: added or not).

## Device rows

New: "browser matrix" and "pending hello review in app".

## Dependencies

AD-1 decided as an ADR; theme 9 roles; feasibility R8 (Next 16.4.3 bump, #586) before any web write surface; theme 1.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Guest identity (AD-1) | Scoped short-lived write-only token from an invite code; first web step read nothing, write one letter |
| Is guest write in scope or the first web step read-only | Write one hello only, after the public release |

## Not verified

Worldwide reach under GDPR and DPDP. The pen test vendor and cost.
