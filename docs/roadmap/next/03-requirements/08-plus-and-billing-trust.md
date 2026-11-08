# Theme 8: Plus that is plain, and letters that stay mine

Readiness: 24 of 28 (audit 8 Nov: 15). Author's re-score, `qa` to confirm. Remains: counsel for the registered billing strings and the Subscription Terms (C5, C8); the founder's App Store Connect products and the Plus sandbox decision (C14); no accessibility drawing for the trust page yet (C7: requirement written, device row new). BL-736 part (R7) can start now.

| | |
|---|---|
| Working label | NX-08 (working id, see `_CONVENTIONS.md`) |
| Refines | F14 (Plus), F14-REQ-040, -081, -082, M1, M17, D-082, D-080, BL-342, BL-560 |
| Tag | EVIDENCE for the fear: 10 of 10 reviews about a new paywall on old features are negative (R2 T2); 30 of the 40 newest Chatbooks reviews are about price, surprise charges or cancelling (R7), via `01-customer-needs.md` rank 5 and `02-benchmark.md` opening 2 and 10. HYPOTHESIS for whether our gate feels fair (U9 untested) |
| Size | S to M. Feasibility item 23 (trust charter) is S; products and sandbox are founder work |
| Gate | Apple (2.1(b), 3.1.1, 3.1.2). Counsel (Q41 notices, Subscription Terms, ten COUNSEL_LOCKED strings incl. `billingCopy.plan.*`). Founder (App Store Connect products) |
| Order | 8 of 12 |

## Price

This file states no price. The repo source `packages/content/src/pricing.ts` (D-082) is what the benchmark flagged (`02-benchmark.md` section 0 item 1); the brief's earlier figures are superseded. Per the repo source, founder to confirm before any store text or notice is written. Every price shown to a parent must come from that file only (RR-10). What it holds, read 8 Nov: monthly $4.99 with a 1-month free trial; yearly $49.99 with a 2-month free trial (D-082). The free allowance is separate: the first 2 letters are free (D-083). Wherever a document says "first 2 free" it means letters, not trial months.

## What the parent will see and do

Before buying, a plain page says what stays free, what keeping more needs, and that letters stay theirs either way. The buy screen shows the length, the renewal and how to cancel beside the button. If Plus lapses, every letter stays readable, playable and exportable.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-08-R1 | EVIDENCE | Given a lapse of Plus, Then 100% of existing letters remain readable, playable and exportable (a lapse-simulation test). | Merged; needs re-proof on the production build. | M1; RR-5 |
| NX-08-R2 | EVIDENCE | Given the buy screen, Then the length, renewal and cancel line sit within the same screen as the button, 3 of 3 fields present, and no price is typed in a content file other than `pricing.ts`. | Not verified for the production screen. | 3.1.2; RR-10 |
| NX-08-R3 | EVIDENCE | Given the production record, Then every product is visible and a sandbox purchase, restore and manage-sheet round trip passes on a production-profile build. | Products are not on the production record (founder); sandbox needs that build. | Gap map 1.8 |
| NX-08-R4 | EVIDENCE | Given the Terms table, Then `/subscription-terms` answers 200 and matches the notices in the app word for word (hash equal). | The page is absent: `apps/web/src/app/(legal)` holds `privacy` and `terms` only (searched 8 Nov). | Counsel packet item 6 |
| NX-08-R5 | HYPOTHESIS (research task, owner `user-research`; not a build row) | Given 8 parents shown "first letters free, then Plus to keep more", When asked if a waiting letter is safe, Then 8 of 8 answer yes without prompting. Study 2 (`02-customers.md` U9). | Untested. | G7 in `01-customer-needs.md` |
| NX-08-R6 | EVIDENCE | Given the status report and renewal-reminder emails are off, Then no screen or Term promises a plan reminder email, count of such promises 0. | The Terms text promises plan reminder emails (BL-342) while the emails are off; no test links the two. | Gap map 1.8 |
| NX-08-R7 | EVIDENCE | Given a kept note, Then it counts toward the free letters (D-133); and in an alpha build Tonight never shows the needs-Plus line at any count from 0 to 250. | No test pins the alpha run: nothing in `apps/mobile/test` exercises Tonight's needs-Plus line at counts 0 to 250 (BL-736). | Readiness file section 2 |
| NX-08-R8 | EVIDENCE | Given the claims test (`packages/content/test/claims-capabilities.test.ts`, which reads the listing, the website and the in-app promise lines and judges each claim against the production profile), When two rules are added, Then every sentence on those surfaces that promises that relatives or a co-parent record for free matches the rule that cites the state of the Family switch, and 0 sentences are unmatched. The Terms text itself is read by `packages/content/test/legal-docs.test.ts` (exists); the same sentence is added there. | The claims test has no rule for relatives or co-parent recording for free, and does not read the Terms (it reads the listing, site and in-app lines). | RR-10; `02-benchmark.md` opening 3 |

**Shown:** `billingCopy.*` (registered strings change only through counsel with a disclosures version bump).
**Records:** purchase acts follow PRIV-R21; on the status report, consent facts captured at purchase are kept (F14-REQ-043b).
**Never:** a price in the wrong file, a popup for paying members, holding a letter hostage, countdowns, "streak" or "points" language, a gate that hides existing letters.
**Decline and withdraw:** Not now leaves everything free working; cancel is Apple's manage sheet; export always.

## Edge cases

Offline renewal grace (16 days attested, S-32); second account on the phone (F14-REQ-043a); restore on a new phone; Family Sharing co-parent; Small Business Program pending (S-31); offer codes.

## Offline behaviour

Entitlement is checked on the device, so a parent offline keeps whatever the last check said, with the grace window. The gate never blocks reading.

## What we never do

Remove a feature people already used behind a new paywall; rewrite words; apply a price rise to existing subscribers (compliance: no existing-subscriber change yet).

## Copy needs (packages/content)

Keys to add in `billingCopy` (`features/billing.en.ts`; the group exists), all `new`: `trust.staysYours`, `trust.whatKeepingNeeds`, `buy.renewalLine`. Counsel owns the registered ones (`billingCopy.plan.*` and the Subscription Terms strings, ten COUNSEL_LOCKED strings); a registered string changes only with a disclosures version bump in the same PR. Prices are never typed in these keys (they come from `pricing.ts` or Apple's sheet).

## Analytics events (opt-in, content-free, names only)

Existing and in catalog (checked 8 Nov): `plus_offer_viewed`, `plus_offer_closed`, `plan_changed`, `free_allowance_reached`, `keep_gate_shown`, `plus_started_from_gate`, `offer_code_redeemed`.

## Device rows

AL-09 (StoreKit sandbox, three accounts). New: "lapse then read, play, export".

## Dependencies

Theme 5 (production record). Counsel Q41. Product ids are unique across the account.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Confirm prices from the repo source | Confirm `pricing.ts` as current; retire the older figures in all briefs |
| Lifetime pricing stance (benchmark opening 6) | Decide before launch day; recommended: no lifetime at 1.0 (HYPOTHESIS, market evidence only) |
| Plus sandbox decision (S-35) | Run it on a production-profile build |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | `subscription-status` exists (`supabase/functions/subscription-status`, type in `packages/api/src/server/subscription-status.ts`); entitlement is checked on the device. No new type. If the status report needs a field, it is additive with a contract test in `packages/api/test/server-contracts.test.ts`. |
| Budget (`06-nfr.md`) | Plus usable after Apple's purchase sheet closes: p95 2 s (48 of 50 sandbox purchases, gate). Restore on a new phone: 99% within 10 s with no tap. Offline renewal grace 16 days (S-32). |
| Accessibility | Trust page and buy screen: AX5 with 0 clipped lines, the length, renewal and cancel lines stay beside the button at AX5 (they wrap, they do not move to a second screen); VoiceOver reads them before the button; tap targets 44 pt or more; Reduce Motion: no motion beyond fade; Apple's own purchase sheet follows Apple's accessibility. New device row "lapse then read, play, export" runs once at AX5. |
| Switch, off behaviour, noticed by | Switch: `capabilities.ts` has no build flag for the paywall (`BuildFlag` lists backup, statusReport, accountDeletion); the kill switches in `packages/api/src/kill-switches.ts` include `statusReport`. Off: the gate shows nothing new and every existing letter stays readable. Rollback of a price or text: change `pricing.ts` and the StoreKit file, then App Store Connect; no build needed for the store side. Noticed by: App Store Connect sales and the `keep_gate_shown` / `plan_changed` events when analytics are on (1.0: Apple's numbers only). |
| Data class and retention | Entitlement on the device: L3. The status report (when on): only the allowlisted purchase facts (F14-REQ-043b). App account token and original transaction id: L3 (DATA_CLASSIFICATION). No purchase data in analytics. |
| Schema and grants | No schema change in this theme. The status-report tables exist already; any change is a separate migration with its grant in `supabase/tests/grants.mjs`. |
| Analytics events | All seven existing events are in catalog. No new events. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-08-R1 | M1; RR-5 | mobile lapse-simulation test (proposed `apps/mobile/test/plus-lapse.test.ts`); `[NX-08-R1] a lapse leaves 100% of letters readable, playable, exportable` | new: lapse then read, play, export |
| NX-08-R2 | 3.1.2; RR-10 | `packages/content/test/pricing.test.ts` (exists) plus a buy-screen unit; `[NX-08-R2] length, renewal and cancel sit beside the button; no price outside pricing.ts` | AL-09 |
| NX-08-R3 | gap map 1.8 | StoreKit sandbox on a production-profile build; Test: none, device | AL-09 |
| NX-08-R4 | counsel packet item 6 | web check (proposed `scripts/ops/web-pages.mjs`) plus hash compare; `[NX-08-R4] /subscription-terms answers 200 and matches the in-app notice by hash` | none |
| NX-08-R5 | G7 | Test: none, study (`user-research`) | none |
| NX-08-R6 | BL-342 | `packages/content/test/legal-docs.test.ts` (exists); `[NX-08-R6] no promise of a plan reminder email while emails are off` | none |
| NX-08-R7 | D-133; BL-736 | mobile unit (proposed `apps/mobile/test/alpha-allowance.test.ts`, shared with NX-06-R4); `[NX-08-R7] alpha never shows needs-Plus from 0 to 250` | none |
| NX-08-R8 | RR-10 | `packages/content/test/claims-capabilities.test.ts` (exists; two rules added); `[NX-08-R8] no unmatched free-for-relatives claim` | none |

Trace: NX-08-R1..R8 -> F14, F14-REQ-040, -081, -082, M1, M17, D-082, D-080, D-083, BL-342, BL-560.

## Not verified

Willingness to pay. Whether the Small Business Program is approved. Apple's gifting rules.
