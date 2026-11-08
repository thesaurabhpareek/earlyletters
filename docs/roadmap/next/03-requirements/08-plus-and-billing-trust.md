# Theme 8: Plus that is plain, and letters that stay mine

| | |
|---|---|
| Working label | NX-08 (id: to be assigned) |
| Refines | F14 (Plus), F14-REQ-040, -081, -082, M1, M17, D-082, D-080, BL-342, BL-560 |
| Tag | EVIDENCE for the fear: 10 of 10 reviews about a new paywall on old features are negative (R2 T2); 30 of the 40 newest Chatbooks reviews are about price, surprise charges or cancelling (R7), via `01-customer-needs.md` rank 5 and `02-benchmark.md` opening 2 and 10. HYPOTHESIS for whether our gate feels fair (U9 untested) |
| Size | S to M. Feasibility item 23 (trust charter) is S; products and sandbox are founder work |
| Gate | Apple (2.1(b), 3.1.1, 3.1.2). Counsel (Q41 notices, Subscription Terms, ten COUNSEL_LOCKED strings incl. `billingCopy.plan.*`). Founder (App Store Connect products) |
| Order | 8 of 12 |

## Price

This file states no price. The repo source `packages/content/src/pricing.ts` (D-082) is what the benchmark flagged (`02-benchmark.md` section 0 item 1); the brief's earlier figures are superseded. Per the repo source, founder to confirm before any store text or notice is written. Every price shown to a parent must come from that file only (RR-10).

## What the parent will see and do

Before buying, a plain page says what stays free, what keeping more needs, and that letters stay theirs either way. The buy screen shows the length, the renewal and how to cancel beside the button. If Plus lapses, every letter stays readable, playable and exportable.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-08-R1 | EVIDENCE | Given a lapse of Plus, Then 100% of existing letters remain readable, playable and exportable (a lapse-simulation test). | Merged; needs re-proof on the production build. | M1; RR-5 |
| NX-08-R2 | EVIDENCE | Given the buy screen, Then the length, renewal and cancel line sit within the same screen as the button, 3 of 3 fields present, and no price is typed in a content file other than `pricing.ts`. | Not verified for the production screen. | 3.1.2; RR-10 |
| NX-08-R3 | EVIDENCE | Given the production record, Then every product is visible and a sandbox purchase, restore and manage-sheet round trip passes on a production-profile build. | Products are not on the production record (founder); sandbox needs that build. | Gap map 1.8 |
| NX-08-R4 | EVIDENCE | Given the Terms table, Then `/subscription-terms` answers 200 and matches the notices in the app word for word (hash equal). | Page returns 404. | Counsel packet item 6 |
| NX-08-R5 | HYPOTHESIS | Given 8 parents shown "first letters free, then Plus to keep more", When asked if a waiting letter is safe, Then 8 of 8 answer yes without prompting. Test in Study 2 (`02-customers.md` U9). | Untested. | G7 in `01-customer-needs.md` |
| NX-08-R6 | EVIDENCE | Given the status report and renewal-reminder emails are off, Then no screen or Term promises a plan reminder email, count of such promises 0. | Terms promise plan reminders (BL-342). | Gap map 1.8 |
| NX-08-R7 | EVIDENCE | Given a kept note, Then it counts toward the free letters (D-133); and in an alpha build Tonight never shows the needs-Plus line at any count from 0 to 250. | Alpha test missing (BL-736). | Readiness file section 2 |
| NX-08-R8 | EVIDENCE | Given a relative or co-parent, Then relatives record for free in no case contradicts the Terms; claim registry has 1 row per promise. | Not checked. | RR-10; `02-benchmark.md` opening 3 |

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

Keys to add: `billingCopy.trust.staysYours`, `billingCopy.trust.whatKeepingNeeds`, `billingCopy.buy.renewalLine`. Counsel owns the registered ones.

## Analytics events (opt-in, content-free, names only)

Existing: `plus_offer_viewed`, `plus_offer_closed`, `plan_changed`, `free_allowance_reached`, `keep_gate_shown`, `plus_started_from_gate`, `offer_code_redeemed`.

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

## Not verified

Willingness to pay. Whether the Small Business Program is approved. Apple's gifting rules.
