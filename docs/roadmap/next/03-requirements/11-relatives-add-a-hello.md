# Theme 11: A relative adds a hello without installing anything

Readiness: NOT READY by design (after the public release), 15 of 28 (audit 8 Nov: 11). Author's re-score, `qa` to confirm. Finished: the numbers, the web copy home, the event, the engineering block, the tests. Blocked below.

### Blocked on (exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | Guest identity for the web (feasibility AD-1): what is the token a relative holds? There is no spec (F37, F32 and FAM-05 are rows in `F30-later.md`, not files), no schema and no ADR. | `principal-architect` (ADR), `security-architect` (threat model and a penetration test before public) | A scoped, short-lived, write-only token minted from an invite code; the first slice writes one hello and reads nothing. ADR before any row is handed out. | R1, R3, R7 |
| B-2 | Counsel memo: a relative's notice and consent, worldwide reach (GDPR, DPDP), how long a pending hello may wait, the CAPTCHA processor's terms. | Counsel | Pending hellos expire after 14 days (proposed, short by default); a notice at collection as drafted below; EU and India reach decided by counsel before the page is public. | R2, R4, notice copy |
| B-3 | The send limit per link (N in R3). | `security-architect` | 5 sends per link per hour and 20 per link in total, then a new link is needed (proposed). | R3 |

Everything else is finished. No row is handed to an engineer until B-1 is an ADR.

| | |
|---|---|
| Working label | NX-11 (working id, see `_CONVENTIONS.md`) |
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
| NX-11-R2 | HYPOTHESIS | Given a pending hello, Then it enters the book only after the parent's tap, and an unaccepted one expires after a stated number of days. Number set by counsel (B-2); proposed default 14 days. | Not built. | Compliance brief item 2 |
| NX-11-R3 | EVIDENCE | Given more than 5 sends from one link in an hour or more than 20 in total (proposed, B-3), Then the link refuses further sends with a refusal code defined in `packages/api`. | Not built; abuse limits are a named risk. | TDD 10 risk 10 |
| NX-11-R4 | EVIDENCE | Given a sign-up from a blocked country, Then the page refuses with a neutral message and stores no name or IP. | Not built (theme 3 R7). | D-131 |
| NX-11-R5 | HYPOTHESIS (research task, owner `user-research`; not a build row) | Given the page on iPhone Safari and Android Chrome, Then a relative completes a hello in 3 attempts or fewer on 6 of 6 recruited relatives. | Study G4 in `01-customer-needs.md`. | Section 4 |
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

The web page cannot read `packages/content` (`apps/web/package.json` depends only on `@scribe/brand` and `@scribe/design-tokens`), so the page words live in `apps/web/src/content/site.ts` as new entries: `relative.notice`, `relative.sent`, `relative.refused` (read by the claims test, which scans every string in that file). App side, `new` in `familyCopy`: `pending.review`. Counsel for `relative.notice`.

## Analytics events (opt-in, content-free, names only)

The web page runs no analytics. App side, existing and in catalog: `invite_created`; new: `relative_hello_reviewed` (property: added or not): not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add it to the catalog and `TRACKING_PLAN.md` first.

## Device rows

New: "browser matrix" and "pending hello review in app".

## Dependencies

AD-1 decided as an ADR; theme 9 roles; feasibility R8 (Next 16.4.3 bump, #586) before any web write surface; theme 1.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Guest identity (AD-1) | Scoped short-lived write-only token from an invite code; first web step read nothing, write one letter |
| Is guest write in scope or the first web step read-only | Write one hello only, after the public release |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | New, version 1, additive: a guest-send request and its refusal codes (revoked, expired, over the limit, wrong kind), a pending-item read for the parent, an accept/decline write. Contract tests in `packages/api/test/server-contracts.test.ts`. Not specified until B-1. |
| Budget (`06-nfr.md`) | No row exists for a guest send. Proposed, to be added to `06-nfr.md` with the first test: the send call is Edge Function light (p95 600 ms, p99 1.5 s with cold start); the page's first paint under 2 s on LTE; upload of one 2-minute hello under 20 MB (the backup object limit is the nearest existing number). Revoke takes effect within 1 minute (R7). |
| Accessibility | WCAG 2.2 AA on the page (R6) and `06-nfr.md` accessibility section; 200% zoom with no clipped text; the record control has a text alternative and a visible state; captions are not required for a recording the relative makes, but a typed option is always offered. App side, the pending-hello review screen: AX5, VoiceOver reads who it is from and the relationship before the play control. |
| Switch, off behaviour, noticed by | Switch: a new capability, off by default in every profile until counsel and the penetration test pass. Off: the Ask a relative row is not drawn and every link answers a neutral "not available". Rollback: switch off and revoke all links in one step. Noticed by: refusal counts by code in Edge Function logs (no content), reviewed in the weekly ops check. |
| Data class and retention | A pending hello: L4 (the relative's voice or words) until the parent accepts or it expires (14 days, proposed); the relative's first name and relationship: L3. No IP stored (D-131 pattern), no tracker. Read by: the book's parents only. Removed: on decline, on expiry, with the book, and on the relative's removal request by the same link. |
| Schema and grants | New additive migration (guest tokens, pending hellos) with grants in `supabase/tests/grants.mjs`, RLS, an access test and a purge hook; held with B-1. Depends on theme 9's roles and theme 1. |
| Analytics events | relative_hello_reviewed: add to catalog first. invite_created: in catalog. The web page sends none. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-11-R1 | AD-1 | HELD (B-1); db access test; `[NX-11-R1] guest token writes one pending hello and reads 0 of 5` | none |
| NX-11-R2 | compliance brief item 2 | HELD (B-2); db test; `[NX-11-R2] a hello enters the book only on accept; unaccepted expires` | new: pending hello review in app |
| NX-11-R3 | TDD 10 risk 10 | HELD (B-3); function test; `[NX-11-R3] sends over the limit are refused with the code` | none |
| NX-11-R4 | D-131 | HELD with NX-03 B-1; `[NX-11-R4] blocked country refused, nothing stored` | none |
| NX-11-R5 | G4 study | Test: none, study (`user-research`) | new: browser matrix |
| NX-11-R6 | compliance G-H | web accessibility run (axe plus manual); `[NX-11-R6] WCAG 2.2 AA, 0 blocking issues` | new: browser matrix |
| NX-11-R7 | AD-1 | HELD (B-1); function test; `[NX-11-R7] revoked link refuses within 1 minute` | none |

Trace: NX-11-R1..R7 -> F37, F32, FAM-05, FAM-06, FAM-07, D-131.

## Not verified

Worldwide reach under GDPR and DPDP. The pen test vendor and cost.
