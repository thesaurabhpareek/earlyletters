---
title: Q-003 position memo, subscription notices with Apple-only billing
date: 2026-10-03
reviewer: AI (Claude), acting as legal and privacy counsel support for Early Letters
documents: subscription-terms.md 1.4.0, terms-of-service.md 1.5.0 (section 14), in-app-disclosures.md 1.4.0, ENGINEERING_REQUIREMENTS.md 1.2.0 (LEGAL-REQ-046 to -049)
debate: docs/agents/DEBATES.md Q-003
---

> **This is an AI memo prepared for licensed counsel. It is not legal advice.** No attorney-client relationship exists. A licensed attorney must review and approve the position before any text is published. Every legal statement below is tagged: **V** verified on a page opened on 3 Oct 2026 (statute text or an official page), **S** secondary source (law firm, vendor or press summary), **U** unverified.

# Q-003: subscription notices when no server of ours sees purchases

## 1. Question

The Subscription Terms (1.3.0) promised acknowledgment, trial, renewal and yearly emails plus an emailed copy of the consent record. Founder decision 3 (D-053, ADR 0013) makes Plus Apple-only and checked on the device: no App Store Server Notifications endpoint, no App Store Server API, no purchase ledger, no `appAccountToken`. We cannot email a person about a subscription we cannot see. What do we do instead, and what may the Terms promise?

## 2. Recommended position (default if counsel does not answer by 23 Oct 2026)

1. **Apple carries the money side.** Apple sells, charges, renews, refunds and cancels Plus, keeps the transaction records, sends its own receipts, and runs the price-increase notice and consent flow. We say so plainly and never claim Apple's messages satisfy any particular law.
2. **Our own reminders are on-device local notifications plus an in-app card.** The app schedules them from StoreKit data it already reads (`Transaction.currentEntitlements` expiration date, `RenewalInfo.willAutoRenew`, the introductory-offer type), only on phones where the subscription is `purchased` (not `familyShared`, because family members are not billed and cannot cancel), recomputes them on every launch and on every `Transaction.updates` event, and cancels them when auto-renew is off. Nothing leaves the phone. The windows are the D-022 table (section 5), kept as data.
3. **A retained acknowledgment without email.** After purchase, the confirmation sheet shows the full renewal terms, the cancel-by date and how to cancel, with a "Save a copy" button that opens the share sheet (Mail to yourself, Files, Notes). The person keeps it; we never see it.
4. **Never raise an existing subscriber's price.** When the price changes, choose "keep the current price for existing subscribers" in App Store Connect, so no increase ever reaches a current subscriber and no notice or consent duty arises. A real increase for existing subscribers would need a new ADR and counsel first.
5. **Consent evidence is per release, not per person.** For each build, keep the evidence pack from `POLICY_VERSIONING.md` section 8 (screenshots of Apple's store view with our marketing content, the Subscription Terms version, the paywall strings). Apple holds the per-person transaction record. No per-person purchase record exists on our side.
6. **The Terms describe exactly that** and nothing more (section 7).

Why this and not a server path: it keeps founder decision 3 intact, adds no processor and no purchase data on our servers, costs about 2 to 3 engineer-days in `apps/mobile/src/lib/billing` (E), and several of the laws checked expressly allow an app notification or an in-app medium (section 4). Its weakness is real and is put to counsel in section 8: a person who deletes the app, or turns notifications off, gets no reminder from us while Apple keeps billing.

## 3. What Apple does for us (and what we could not confirm)

| Apple behaviour | Evidence |
|---|---|
| Price increases: Apple notifies subscribers in advance by email, push and an in-app message, and shows how to manage or cancel | V: Apple Developer News, "Update to subscription notifications", 16 May 2022 [A1]; Auto-renewable Subscriptions page [A2] |
| Price increases above Apple's thresholds need the subscriber's opt-in; below them Apple notifies and the increase applies unless the person cancels | V: Apple Support, "About subscription price changes" [A3]. This is why point 4 above avoids increases for existing subscribers instead of relying on Apple's flow |
| Billing problems: from iOS 16.4 a system sheet asks the person to update payment | V: [A2] |
| Family Sharing: Apple tells eligible family members by push that a subscription can be shared | V: [A2] |
| Receipts: Apple emails a receipt after each renewal charge, and the person can turn "Renewal Receipts" off | S: Macworld, 11 Feb 2020 [A4] |
| A confirmation email at subscription or trial start, with what it contains | U: widely reported; no Apple page found that commits to it or describes its content |
| A reminder before a free trial ends, or before an annual renewal | U, and probably not: an Apple Community answer (2018) says Apple does not warn before a trial ends [A5]; no Apple page found that promises either |

## 4. The laws, as checked on 3 Oct 2026

| Law | Status | Trial notice | Renewal notice | Medium | Other duties that touch us |
|---|---|---|---|---|---|
| **California** Bus. & Prof. Code 17602 (AB 2863) | In force for contracts from 1 Jul 2025 (V [L1]) | Trial over 31 days: 3 to 21 days before it ends ((b)(1)(A)) | Initial term of one year or longer: 15 to 45 days before renewal ((b)(2)); if both apply, only (b)(2) | Annual reminder ((h)): "in the same medium that resulted in the activation ... or the same medium in which the customer is accustomed to interacting with the business" (V) | Retainable acknowledgment ((a)(3)); proof of consent kept 3 years or 1 year after termination; online cancellation without obstruction; fee change notice 7 to 30 days before; annual reminder for "an annual automatic renewal agreement or continuous service agreement" (whether a monthly plan is a "continuous service agreement" is for counsel) |
| **New York** GBL 527-a (as amended, in force 5 Nov 2025) | V text [L2]; effective date S [L3] | Trial over one month: 3 to 21 days before the cancellation deadline | Term of one year or more: 15 to 45 days before the cancellation deadline | "in the manner selected by the consumer, including text, email, **app notification** or any other notification channel offered by the business" (V) | Price increase: prior consent, or cancel within 14 days with a pro-rata refund (we cannot refund Apple purchases, hence point 4); cancellation through all mediums used to consent |
| **Virginia** Code 59.1-207.46 (2026 amendments, chapters 931 and 932) | V current text [L4]; the 2026 change is cancellation "at least as easy" as sign-up, no good-faith defence (S [L5]) | Trial lasting more than 30 days: notify "within 30 days of the end" of the trial | Only where the renewal extends the offer "for a period of more than 12 months": 30 to 60 days before the cancellation deadline or the end of the term. **Our annual plan renews for exactly 12 months, so this likely does not apply** (counsel). Earlier drafts misread it as "12 months or more, before renewal" | Not specified in the text we read | Cancellation at least as easy as initiation, through each method used to initiate |
| **Utah** Code 13-70-101, -201 (HB 174, in force 1 Jan 2025) | V bill text [L6] | Any trial period offer: at least 3 days before it expires, with expiry date, price after and cancel options | "Automatic renewal provision" means renewal for a term longer than 45 days, so the annual plan only: 30 to 60 days before it renews, with renewal date, total cost and cancel options | Print or audio, clear and conspicuous (V) | None beyond notice content |
| **Massachusetts** 940 CMR 38.00 (in force 2 Sep 2025) | V regulation text [L7] | State the calendar date to cancel by before acceptance | Terms over 31 days: written notice 5 to 30 days before the cancellation deadline. Terms of 31 days or less: written notice of the amount charged at renewal and how to cancel | "a medium substantially similar to that used by the consumer to initiate ... or through a commonly-used medium" (V) | Cancellation at least as easy as initiation |
| **New York City** click-to-cancel rule | In force 1 Oct 2026 (S [L8]) | Trial over one month: 3 to 21 days before the cancellation deadline (S) | 15 to 45 days before the cancellation deadline (S; which terms it covers is unclear from the summary) | U | Price or material change 5 to 30 days before; records of cancellation attempts (Apple holds them) |
| **Federal: ROSCA**, 15 U.S.C. 8403 | In force (S [L9]; statute not opened) | None | None | n/a | Disclose all material terms before taking billing information; express informed consent; simple cancellation. Met by Apple's store view, our marketing content above it and Apple's manage sheet (counsel to confirm) |
| **Federal: FTC Negative Option Rule** ("click to cancel") | 2024 rule vacated by the Eighth Circuit in July 2025; ANPRM published 13 Mar 2026, comments closed 13 Apr 2026; FTC rule page shows the ANPRM as the latest step (V [L10]); no NPRM as of 24 Sep 2026 (S [L11]). **No federal negative-option rule beyond the 1973 prenotification rule is in force** | n/a | n/a | n/a | Recheck at submission and at every price or offer change |

Also noted in earlier drafts and not re-opened today: Colorado one-step online cancellation (from 16 Feb 2026), Minnesota (no unsolicited retention offers), Connecticut, Maryland and the Louisiana law from 1 Jan 2027 (S [L11]). Our cancel path is Apple's own sheet with nothing in front of it, which is the strongest position available on all of them.

**Who owes the duty.** Each statute puts the duty on the business or seller that makes the automatic renewal offer. Apple is the merchant of record, but the offer is ours, in our app, under our name, and the notices are about our product. We assume the duties are ours and design to meet them; whether Apple's role shifts any of them is question C-1 below.

**Medium.** The product's only channel with a subscriber is the app. New York names "app notification" expressly; California and Massachusetts accept the medium used to activate (an in-app purchase) or one the customer is accustomed to; Utah asks only for clear print. That is the legal basis for point 2. It does not cure the case where the app is gone (section 6).

## 5. The schedule the app runs

`E` is the trial end or period end that StoreKit reports (UTC). `C`, the cancellation deadline, is `E - 24h` (Apple: cancel at least 24 hours before). Every window was checked against the texts in section 4.

| Reminder | When it applies | Target | Hard window | Laws it serves |
|---|---|---|---|---|
| Confirmation sheet (in app, with Save a copy) | Purchase or trial start | Immediately | On the purchase sheet's close | CA (a)(3); MA calendar date to cancel by; ROSCA |
| Long trial | Trial over 31 days (the annual plan's 2-month trial) | `E - 18d` | `[E-21d, E-16d]` | CA (b)(1); NY; VA (within 30 days of the end); UT (at least 3 days); MA (5 to 30 before `C`); NYC |
| Trial week | Trial of 31 days or less (the monthly plan's 1-month trial) | `E - 7d` | `[E-8d, E-5d]` | VA if a 31-day trial is "more than 30 days"; UT; courtesy |
| Trial final | Every trial that will convert | `E - 4d 12h` | `[E-5d, E-4d]` | UT (at least 3 days before expiry); courtesy |
| Annual renewal | Annual plan, will renew, not in a trial | `E - 30d 12h` | `[E-31d, E-30d]` | UT (30 to 60 before renewal) and MA (at most 30 before `C`) leave only this one-day window; CA and NY are wider |
| Annual renewal, short | Annual plan, will renew | `E - 7d` | `[E-8d, E-6d]` | Courtesy |
| Yearly reminder | Every active subscription, monthly included, on each subscription anniversary | Anniversary | Same day | CA (h), read broadly to include monthly plans until counsel says otherwise |
| Price increase | Not used: existing subscribers keep their price (point 4) | n/a | n/a | CA (g); NY (c); NYC |

Each reminder is one local notification (if notifications are allowed) and an in-app card on the next open inside the window, which also lives in Settings, Plan until the date passes. The notification opens Settings, Plan, where the full content sits: the date, the price after (from StoreKit's localized display price), the cancel-by date and the one-tap Manage subscription button. Lock-screen text names no child (D-025) and no price, only "Plus renews on {date}. You can change this in Settings, Plan." (content owner to write; counsel to confirm a price on the next screen is enough). A missed window is skipped, never sent late. If the person cancels in Apple's settings without opening the app, the next launch removes pending reminders; a reminder that fires first says "If Plus is still set to renew".

## 6. Known gaps of the recommended position (for counsel to weigh)

1. **The app is deleted** (or the phone is lost) while the subscription continues. iOS removes our scheduled notifications with the app. Apple keeps billing; Apple's renewal receipts arrive after each charge (S), and Settings on the iPhone lists the subscription. We send nothing.
2. **Notifications are off.** The in-app card shows only if the person opens the app inside the window. Mitigation: at the purchase confirmation, one plain ask: "Remind me before the free months end" (the system prompt follows only on Yes). The Terms say reminders need notifications.
3. **Monthly renewals in Massachusetts** need a written notice of the amount charged and how to cancel at each renewal. Apple's renewal receipt is the only thing that does this, and the person can turn it off. Whether Apple's receipt counts as our notice is question C-4.
4. **Proof of consent** for 3 years is held by Apple (the transaction) plus our per-release evidence, not by us per person (question C-5).
5. **Several phones** signed in to the same Apple Account each schedule the same reminder. Accepted: duplicate reminders are better than none.
6. **Clock and offline.** Local notifications fire on the phone's clock. A phone set to the wrong time can fire early or late; scheduling uses StoreKit's dates in UTC and re-checks on launch.

If counsel finds gaps 1 to 3 unacceptable, the fallback is a small server path (ADR 0013 option c): the app, with the person's agreement, registers a reminder (an email address and the renewal date, nothing else) with an Edge Function that sends the email through Resend. That reverses the literal wording of founder decision 3 ("no server of ours sees purchases") and adds a purchase-derived fact to our servers, a data-map row and probably a Purchases label change. It is a founder decision, not ours.

## 7. What the Terms and Subscription Terms must and must not say

**Must say** (California (a)(1), ROSCA, Apple 3.1.2 and Schedule 2 3.8(b); counsel to confirm):
- That Plus renews automatically until cancelled, at the price and for the period shown in Apple's store view, and that trials convert to paid unless cancelled at least 24 hours before they end.
- That Apple charges the Apple Account, and that cancellation and refunds go through Apple, with the exact path (Settings, your name, Subscriptions; or in the app: Settings, Plan, Manage subscription).
- What Plus includes, matching the store view: Read together after the free sessions in each book, and books for more children.
- That Plus belongs to the Apple Account that bought it and reaches family members through Apple Family Sharing.
- That deleting the app or the account does not cancel Plus.
- That Apple sends its own receipts and notices, and what the app itself does: reminders on the phone before free months end and before an annual plan renews, if notifications are allowed and the app is on the phone that subscribed, plus the dates in Settings, Plan.
- That existing subscribers keep their price while their subscription continues.

**Must not say:**
- "We email you" anything about a subscription (acknowledgment, trial, renewal, yearly reminder, price change). We cannot.
- "We keep a record of what you agreed to and send you a copy." We keep neither per person.
- Exact day counts as a guarantee ("16 to 21 days before") when delivery depends on notifications and the app being installed. Describe the reminders; do not warrant the days.
- That Apple's emails or the reminders satisfy any law, or that we can refund an Apple purchase.
- That a co-parent outside the purchaser's Apple family gets Plus (they do not, ADR 0013), or that Family Sharing is unavailable (it is on, and cannot be turned off).
- Encrypted backup, extra themes, covers or audio upload as Plus features (none ships in v1.0; D-053, D-059).
- Google Play or Android purchase paths in anything shown in the iOS app (App Review 2.3.10).

## 8. Questions for counsel

| # | Question | Our default if unanswered | Needed by |
|---|---|---|---|
| C-1 | With Apple as merchant of record and the person contracting with Apple for payment, do the California, New York, Utah, Massachusetts, Virginia and NYC notice duties fall on us as the business making the offer? | Yes, assume they do | 23 Oct 2026 |
| C-2 | Is an on-device local notification plus an in-app card a compliant "notice" in each state (NY names app notifications; CA and MA accept the activation medium; UT asks for clear print)? Does it matter that it fails when the app is deleted or notifications are off? | Yes for an installed app with notifications on; gaps 1 and 2 accepted with the Terms disclosure | 23 Oct 2026 |
| C-3 | Is the in-app confirmation sheet with "Save a copy" an acknowledgment "capable of being retained" under California (a)(3)? | Yes | 23 Oct 2026 |
| C-4 | Massachusetts terms of 31 days or less: does Apple's renewal receipt satisfy the per-renewal notice, or must the monthly plan be changed (for example, offer only the annual plan in Massachusetts, which the App Store cannot do per state)? | Rely on Apple's receipt; flag the risk | 29 Oct 2026 |
| C-5 | California proof of consent for 3 years: are Apple's transaction records plus our per-release evidence pack enough, without a per-person record? | Yes | 29 Oct 2026 |
| C-6 | California (h) yearly reminder: does it reach monthly plans as "continuous service agreements"? | Treat it as yes (the app sends one on each anniversary) | 29 Oct 2026 |
| C-7 | Virginia 59.1-207.46(E): confirm a 12-month annual renewal is not "a period of more than 12 months", and whether a 1-month trial that can run 31 days is "more than 30 days" under (D). | E does not apply; D applies to the 2-month trial and possibly the 1-month one (reminder sent anyway) | 29 Oct 2026 |
| C-8 | NYC rule: which renewals need the 15 to 45 day notice (all, or terms over a set length)? Does Apple's cancellation path meet its "same avenues as enrollment" and record-keeping rules? | Annual only; Apple's path is enough | 29 Oct 2026 |
| C-9 | Is "keep the current price for existing subscribers" in App Store Connect enough to keep the Terms promise that we never renew at a higher price without agreement, given Apple may still apply its own threshold rules in some storefronts? | Yes | 29 Oct 2026 |
| C-10 | ROSCA: does Apple's store view plus our marketing content above the plans disclose "all material terms" before Apple takes billing information? | Yes | 29 Oct 2026 |
| C-11 | If C-2 or C-4 is "no": is the fallback server path in section 6 (opt-in reminder registration, email plus date only) acceptable as the founder's alternative, and how should it be disclosed? | Not built until the founder decides | Before the first annual renewal notices (about Dec 2027), or before the first trial reminders (about 2 Dec 2026) if C-2 is "no" |

Timing: release is expected between 9 and 20 Nov 2026 (ROADMAP 2.0). The first 1-month trials then end from about 9 Dec, so the first trial-week reminders fall from about 2 Dec; the first 2-month trials end from about 9 Jan 2027, so long-trial reminders fall from about 19 Dec. The scheduler must be in the release build, so it has to land before feature freeze on 26 Oct, before counsel can answer. It helps under every answer, so build it now.

## 9. Requests to other owners (not edited here)

- **Payments owner** (`apps/mobile/src/lib/billing`): build the reminder scheduler in section 5 (local notifications through the existing reminders module, ownership `purchased` only, recompute on launch and on `Transaction.updates`, cancel on auto-renew off), the confirmation sheet with "Save a copy", and the one-time "Remind me before the free months end" ask. Unit tests over a synthetic year (DST, leap day, trial lengths 28 to 31 days and 59 to 62 days).
- **Content owner** (`packages/content/src/features/billing.en.ts`): reminder notification and card strings; confirmation sheet strings; remove any "we will email you" wording; `plus.ack.body` loses "and the same text in the confirmation email" (in-app-disclosures 1.4.0 section 3).
- **Founder** (App Store Connect): when a price ever changes, always choose to keep current subscribers' price; never use Apple's notice-only increase for existing subscribers without a new decision.
- **Coordinator**: record the outcome in DECISIONS (supersedes D-022's channels and D-049) once counsel answers or on 23 Oct with the default.

## Sources (opened 3 Oct 2026 unless marked)

- [L1] Cal. Bus. & Prof. Code 17602, via Justia (2025 code; amended by AB 2863, applies to contracts from 1 Jul 2025): https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/
- [L2] N.Y. Gen. Bus. Law 527-a, via Justia (2025): https://law.justia.com/codes/new-york/gbs/article-29-bb/527-a/
- [L3] Perkins Coie, New York and Colorado update auto-renewal requirements (S; cited in Terms Appendix A [L11]): https://perkinscoie.com/insights/update/new-york-and-colorado-update-auto-renewing-subscription-requirements
- [L4] Code of Virginia 59.1-207.46 (current text, references 2026 chapters 931 and 932): https://law.lis.virginia.gov/vacode/title59.1/chapter17.8/section59.1-207.46/
- [L5] Virginia Auto-Renewal Law 2026 summary (S): https://termsandconditionstemplate.com/virginia-automatic-renewal-cancel-as-easy-as-signup-2026
- [L6] Utah HB 174 (2024), substitute S01, enacting Utah Code 13-70, effective 1 Jan 2025: https://le.utah.gov/~2024/bills/hbillamd/HB0174S01.htm
- [L7] Massachusetts 940 CMR 38.00, Unfair and Deceptive Fees (regulation text; effective 2 Sep 2025): https://www.mass.gov/doc/940-cmr-38-unfair-and-deceptive-fees/download
- [L8] Skadden, New York City's Click-to-Cancel Rule (September 2026) (S): https://www.skadden.com/insights/publications/2026/09/new-york-citys-click-to-cancel-rule
- [L9] Jones Day, FTC Revives Click-to-Cancel Rule (May 2026) (S; ROSCA duties quoted): https://www.jonesday.com/en/insights/2026/05/ftc-revives-clicktocancel-rule-new-risks-for-subscription-businesses
- [L10] FTC, Negative Option Rule page (2024 final rule; ANPRM 11 and 13 Mar 2026): https://www.ftc.gov/legal-library/browse/rules/negative-option-rule ; Federal Register ANPRM, 13 Mar 2026: https://www.federalregister.gov/documents/2026/03/13/2026-04952/rule-concerning-the-use-of-prenotification-negative-option-plans (search result, not opened)
- [L11] Churnfree, FTC Click-to-Cancel Rule: where it stands in 2026, published 24 Sep 2026 (S; no NPRM after the ANPRM; state law effective dates): https://churnfree.com/blog/ftc-click-to-cancel-rule/
- [A1] Apple Developer News, Update to subscription notifications, 16 May 2022: https://developer.apple.com/news/?id=tpgp89cl
- [A2] Apple Developer, Auto-renewable Subscriptions: https://developer.apple.com/app-store/subscriptions/
- [A3] Apple Support, About subscription price changes: https://support.apple.com/en-gb/109501
- [A4] Macworld, How to stop receiving subscription renewal emails from Apple, 11 Feb 2020 (S): https://www.macworld.com/article/233837/how-to-stop-receiving-subscription-renewal-emails-from-apple.html
- [A5] Apple Community, "Do I get a warning when my free trial is ...", 2 Feb 2018 (S, user forum): https://discussions.apple.com/thread/8265147
- Internal: ADR 0013; DECISIONS D-022, D-048, D-049, D-053; ROADMAP 2.0; `docs/backlog/future/04-growth-monetisation.md` (G-12 timing); `packages/content/src/features/billing.en.ts`.
