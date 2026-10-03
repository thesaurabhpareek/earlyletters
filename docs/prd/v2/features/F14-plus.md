# F14 Plus: subscription, paywall, lapse

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 16 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent (buyer), P2 Co-parent, P3 Expecting parent |
| Existing IDs | C-REQ-019 to C-REQ-029, C-REQ-030 to C-REQ-032 (later), C-NFR-002 to C-NFR-004, C-NFR-006, C-NFR-007, PRD-REQ-003, PRD-REQ-015, PRD-REQ-017, PRD-REQ-020, PRD-REQ-022, K-04, K-11, K-12, K-28, K-31, K-34, K-38, LEGAL-REQ-029, LEGAL-REQ-046 to LEGAL-REQ-050, LEGAL-REQ-053, LEGAL-REQ-054, LEGAL-REQ-058, D-001, D-012, D-022, D-036, D-037, D-047, D-048, D-049, DR-02 to DR-06, DR-08, R-06; BL-024, BL-036, BL-103, BL-210 to BL-222 |
| Depends on | F02 (account, Keep the book first), F10 (Read together allowance), F11 (co-parent, Family Sharing line), F12 (start-book rule), F13 (notification planner and budget), F17 (Settings > Plan, account deletion), F19 (remote config), F21 (review notes, store listing) |
| Status | Draft V2, 3 Oct 2026. Not legal advice: every item marked **[Counsel]** waits for counsel |

## 1. Why

- [D] Plus ships at v1.0, sold, managed, cancelled and refunded only through Apple, with Apple's own subscription UI and an on-device entitlement check; no server of ours sees purchases; the co-parent gets Plus through Apple Family Sharing; $3.99 a month with a 1-month free trial, $29.99 a year with a 2-month free trial (B2, D-001, D-012).
- [S] Charging for something that used to be free drew a negative review every time in the sample: 10 of 10 reviews across 6 products. Hidden fees and hard cancellation add 4 more [S] R2 section 0 item 3, theme T2. Plus must add things and never take any back (03 principle 6).
- [S] Price is the second most common complaint in the category (21 of 104 negative or mixed reviews) behind lost work (41) [S] R2 section 0 item 1.
- [F] Our price sits at the category floor: $29.99 a year equals Tiny Treasures and undercuts FirstChapter ($39.99), Dearest ($49.99) and From, Mama ($49.99) [F] R1 section 0 item 7 (R1-S67, R1-S4, R1-S3, R1-S20).
- [F] Trials of 17 to 32 days convert best: 42.5% median trial-to-paid across apps, 44.6% on annual plans. Trials over 32 days are excluded from the benchmark, so the 2-month annual trial has none [F] R3 section 4.3 (R3-S32, R3-S33).
- [F] The device alone can read Plus state, renewal date, will-renew, grace and Family Sharing ownership (R4 section 0 items 1 and 3). Apple's own pages do not say Apple reminds subscribers before a trial ends or an annual renewal (R4 section 1.3), while California requires both notices for our plans (R4 section 3.1). That collision (R4 C1, DR-02) is the hardest part of this spec.
- [F] At v1.0 Plus holds two things: books for more children and Read together beyond the free sessions. There is no cloud backup at v1.0 (B7). App Review asks subscriptions to give ongoing value (R4 section 5, 3.1.2(a)). Plus is thin; the review notes must show what continues each month (DR-08, R-06).

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 Evening parent, second child arriving | Taps Add a child months after the first book | Wants the second book in 3 taps; fears a surprise charge (02 section 6 item 3) |
| P1 at Read together time | Child is 2 to 5, bedtime (R2-S29) | Three free sessions used; wants to keep going without feeling sold to |
| P1 on a free month | 4 days before the first charge | Wants to know the date, the price and how to cancel, without hunting (UR R16) |
| P2 Co-parent | Partner bought Plus | Expects it to work on their phone. It does only if both are in one Apple Family (DR-03) |
| P1 after a lapse | Card declined, or chose to stop | Must find every letter, recording and book exactly where it was (C-REQ-028, LEGAL-REQ-050) |
| P3 Expecting parent | Before birth | Must never meet a paywall about an unborn child; the due-date book is the free first book |

## 3. What we are solving

**Outcome.** A family that wants more books or more Read together can pay through Apple in a few taps, knows exactly what it costs and when, gets told before every charge the law requires, and never loses access to anything they made.

| Metric | Target | How measured | Caveat |
|---|---|---|---|
| Trial starts by day 90 / first-letter users | 15% or more [A] (03 section 4.2) | Numerator App Store Connect (ASC); denominator server count of first-letter users who synced, plus opt-in device counts | ASC is the only purchase source (B2); denominator misses phone-only users |
| Trial to paid | 40% or more [A] | ASC subscription reports | Review gate at the first 200 annual trials (R3 section 7 item 3) |
| Annual share of Plus | 60% or more [A] | ASC | |
| Refund rate | Under 3% [A] | ASC | |
| Plus sheet shown outside its allowed triggers | Zero (guardrail, 03 section 4.3) | Automated placement tests; `plus_offer_viewed.trigger` (opt-in) | |
| Required plan notices scheduled inside their windows | 100% of eligible purchases on the purchasing device | Clock-controlled planner test over a synthetic year; device lab run | Delivery needs the app installed and notifications allowed (Q-C1) |
| Billing tickets | 2 or fewer per 100 payers a month [A] (C section 9) | Support log tags | |
| Purchase or entitlement data reaching any server of ours | Zero (gate) | Network capture on the sandbox checklist; CI grep (F14-REQ-014) | |

## 4. Scope

**In v1.0**
- Two auto-renewable products in one subscription group, Apple introductory free trials, Family Sharing on, Billing Grace Period on (16 days).
- Apple's `SubscriptionStoreView` hosted in a small native Expo module of our own, with our disclosure text in its marketing content slot (B2, R4 C5). Everything else from `expo-iap` (MIT).
- On-device entitlement from `Transaction.currentEntitlements` and `RenewalInfo`; a cached plan state; Plus enforced only on the device (DR-04).
- Plus contents: books for more children (PRD-REQ-015) and Read together beyond the free sessions (PRD-REQ-020 Rev (DR-06), F10).
- The Plus sheet at two triggers (Add a child, Read together after the free sessions) and from Settings > Plan; never on the surfaces in 6.4.
- Trial and renewal notices computed on the device: local notifications plus an in-app card, from `RenewalInfo` and the transaction (DR-02 default A), with counsel first asked whether Apple owns them.
- Acknowledgment sheet with a copy the person can save, and a purchase consent record (LEGAL-REQ-049 Rev).
- Settings > Plan: status and dates, Manage or cancel, Restore, Request a refund, the terms.
- Restore through Apple, with Plus following the Apple Account on the device (DR-05 A; D-047 dropped).
- Lapse: everything readable, playable, exportable; every book stays writable.
- Removal of the server Plus check in `create_child` and of the server store tables (B2), together with F12.
- Review notes that show ongoing value (DR-08).

**Later**
- Encrypted audio backup and shared voice as Plus (F31, v1.1); themes and covers (F46); gifts (C-REQ-030, needs a server grant; F43); lifetime (C-REQ-032, F43); dormant-payer email (C-REQ-031: needs email and a server).
- The trial-length experiment (C section 8): needs arm assignment, which would be server-driven paywall content (B14 forbids) or a release per arm. After v1.0 [R].
- Google Play billing (F36).
- Win-back offers and offer codes (R4 section 1.1): not at v1.0.

**Never**
- Any paywall on writing, reading, playing a recording, export, co-parent sharing or anything that was free when the family started (LEGAL-REQ-050; 03 principle 6).
- A server of ours receiving receipts, signed transactions, `appAccountToken`s, prices or subscription status (B2).
- RevenueCat or any third-party billing SDK; an App Store Server Notifications endpoint (B2).
- Countdown timers, fake discounts, "limited time", urgency, a delayed close button (TDD 08 section 6 rule 7).
- The words unlock, premium, expire, lose or locked in plan copy; "trial" outside store-required disclosure (C section 7).
- A Plus offer inside any notification (App Review 4.5.4, R1-S49; LEGAL-REQ-054).
- Server-driven paywall content or placement (B14).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | $4.99/$47.88 Essential; 7-day trial, card required; after cancel, Lite keeps past entries readable [F] R1-S16, R1-S45, R1-S44 | 4.9 (15K) [F] R1-S1 | Charges after unsubscribing; fine print on credits [S] R1-S55 | **Avoid** short trials and cancel friction; **Match** read-after-lapse, and go further (write too) [R] |
| Tinybeans | $7.99/$74.99; after lapse, content over 5 GB archived and hidden [F] R1-S2, R1-S46 | 4.9 (104K) | Price rises and new paywalls drew anger [S] R2 T1, T2 | **Avoid** hiding content after a lapse [R] |
| Day One | Silver $49.99/yr, 1-month trial, App Store controls eligibility; media stays playable after a lapse; no Family Sharing [F] R1-S6, R1-S23, R1-S25, R1-S60 | n/a | A user compares $25 a year with a rival at $4 [S] R2 T1 | **Match** lapse; **Innovate** with Family Sharing (R4-S17) [R] |
| Dearest | $4.99/$49.99; in-app renewal reminders with cancellation deadlines (v1.4.2) [F] R1-S3 | Dearest's US page shows 1 rating [F] R2-S6 | n/a | **Match** the in-app reminder as part of the DR-02 answer [R] |
| Tiny Treasures | $4.99/mo, $29.99/yr, $99 lifetime; gates "family access" [F] R1-S67 | 5.0 (7) [F] R1-S67 | n/a | **Avoid** gating family; lifetime later (F43) [R] |
| FirstChapter | $6.99/$39.99; 3 AI voice entries a month free [F] R1-S4 | No US average [F] R1-S4 | n/a | **Avoid** metering speaking [R] |
| Calm (quality bar) | $14.99/$69.99 [F] R1-S48 | n/a | Cost, limited free content, hard to cancel [S] R1-S48 | **Avoid** cancel friction: Apple's manage sheet one tap from Settings (B2) [R] |
| Apple SubscriptionStoreView | iOS 17; loads names, prices and a purchase button from the group; Terms and Privacy buttons from App Store Connect; marketing content slot; Close by default [F] R4-S1, R1-S50 | Apple does not say it satisfies 3.1.2(c), DPLA Schedule 2 or state law [F] R4 section 1.1 | n/a | **Match** (B2), with our disclosure text in the slot and counsel review **[Counsel]** [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Owner | Allowed? |
|---|---|---|
| Add a child after the first started book | F12 calls `decide({feature: 'start_book'})` | Yes, at the third tap (B-REQ-004) |
| Read together Start after the free sessions | F10 calls `decide({feature: 'read_together'})` | Yes, before playback, never during a session |
| Settings > Plan > See what Plus adds | F14 | Yes |
| Settings > Children > {child}'s book: no Plus row | n/a | No |
| A plan notice or card | F14 | Opens Settings > Plan, never the sheet |
| Anything in 6.4 | n/a | Never |

### 6.2 Happy path

#### A. Buy Plus from Add a child (eligible for a free trial)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Signed in, one started book, taps Add a child | F12 gate: `childrenExtra.plusGateTitle`, `children.add.plusNote`, `children.add.joinedNote`, `children.add.keepNote`, `childrenExtra.plusCta` | `decide` returns `offer second_child`. Signed out would return `needsSignIn` and F02 shows Keep the book first (D-036) |
| 2 | Taps "See what Plus adds" | Apple's subscription view from our module, with our marketing content (6.5): what Plus adds, the promise line `plus.promise`, the Family Sharing line when `isFamilyShareable`, the trial and price lines with dates, the cancel line, the agree line; Apple's plan options, prices, button, Terms and Privacy buttons, Restore, Close | JS fetches products (`fetchProducts`) and intro eligibility (`isEligibleForIntroOfferIOS`), computes trial end dates from today and the products' intro offer periods, passes strings to the module. `plus_offer_viewed{trigger: second_child}` after consent |
| 3 | Picks Annual, taps Apple's button | Apple's purchase sheet, Face ID | Before the sheet: `record_policy_act('auto-renewal-terms', <version>, 'accept', 'paywall_purchase', ...)` stage `started` with product, offer type and `disclosure_version` in context (exists: `record_policy_act` in `20261003000000_security_and_family.sql`) |
| 4 | Confirms | Acknowledgment sheet (new `plus.ack.*`, text from `in-app-disclosures.md` `plus.ack.body` with dates): free until {date}, then {price} a year, cancel by {cancelByDate}, how to cancel; "Save a copy" and "Done" | Transaction arrives through the `expo-iap` purchase listener (Inferred, R4 section 2; spike). Verified, environment matches the app's (F14-REQ-004), finished. Plan cache updated. Stage `completed` consent act written (F14-REQ-011). Plan notices planned (6.6). `trial_started{product: annual}` after consent |
| 5 | Taps Done | Add-a-child form (F12) | `decide` now returns `allow plus_own` |

#### B. Not eligible for a free trial
Same flow. The marketing content shows `{price} a year, charged now` (`plus.legal.renewNoTrialAnnual`, exists) and no "free" word (C-REQ-022). Apple's own view shows the price.

#### C. Co-parent in the same Apple Family
1. The purchaser's subscription is family-shareable (both products, turned on before launch, R4-S17).
2. On the co-parent's phone, `currentEntitlements` holds the Plus transaction with ownership type family shared (R4-S6, R4-S18). `planView()` is active; no offer appears.
3. Settings > Plan reads "Plus through Apple Family Sharing" (new `plus.plan.familyShared`). No plan notices are scheduled on this phone (the co-parent is not charged). Manage opens Apple's sheet.

#### D. Co-parent outside the purchaser's Apple Family
Their phone has no Plus. They keep every free thing, including their own first book (joined books never count, D-008). They meet the sheet at the same triggers, with F11's line `coParent.plus.familySharingNote` ("Plus on one parent's Apple Account reaches the other only through Apple Family Sharing.") shown only when `isFamilyShareable` is true (F11 6.2). Both parents may end up paying; we cannot tell (F11-REQ-017, R4 C2).

#### E. Restore on a new iPhone
1. The person signs in to the same Apple Account on the phone. StoreKit makes transactions available at first launch after install (R4-S8). Plus usually appears with no tap.
2. If not, Settings > Plan > Restore calls `syncIOS` (Apple's `AppStore.sync()`), only on that tap, never at launch (R4-S8). Apple may show its sign-in prompt.
3. Plus follows the Apple Account, whatever Early Letters account is signed in (DR-05 A). `restore_result{outcome}` after consent.

#### F. Cancel
Settings > Plan > Manage or cancel opens Apple's manage sheet in one tap (`showManageSubscriptionsIOS`; fallback `https://apps.apple.com/account/subscriptions` on Mac or error, R4-S9). Nothing comes before it: no survey, no offer (LEGAL-REQ-048). On return the app re-reads `RenewalInfo`; `willAutoRenew` false cancels pending renewal and trial notices (6.6) and Plan reads "Plus ends on {date}" (new `plus.plan.endsOn`).

#### G. Lapse
When the entitlement leaves `currentEntitlements` (expired, refunded, revoked) and grace has ended:
1. One card on Tonight, once: `plus.lapsed` "Plus has ended. Everything you made is still here, and you can keep writing." (C section 7 draft key; becomes a real key).
2. Every book stays open for writing, reading, playing and export, including books started under Plus (C-REQ-028). Add a child shows the gate again. Read together returns to the try state; sessions used in try mode before still count (D-037).
3. No email (none exists at v1.0) and no push.

#### H. Settings > Plan

| Row | Shows | Copy key |
|---|---|---|
| Status | Free; Plus, free until {date}; Plus renews on {date} (only when `willAutoRenew` and the date is in the future, R4-S7); Plus ends on {date}; Plus through Apple Family Sharing; There's a problem with your payment. Your letters are fine. | new `plus.plan.*`; payment line from C-REQ-027 |
| What Plus adds | The two v1.0 items | new `plus.includes.*` (single source, F14-REQ-017) |
| See what Plus adds | Opens the sheet (Free only) | `childrenExtra.plusCta` |
| Manage or cancel | Apple's manage sheet, one tap | new `plus.plan.manage` |
| Restore | `syncIOS`, then re-read | `plus.legal.restoreLink` |
| Request a refund | Apple's refund sheet for the latest transaction the person purchased (not family shared) | new `plus.plan.refund` |
| Your Plus terms | The acknowledgment text with the dates of the current period, and Save a copy | new `plus.plan.terms` |
| Subscription terms, Terms of Service, Privacy Policy | Links | `plus.legal.*Link` (exist) |
| Footnote | Deleting the app or your account does not cancel Plus | new `plus.plan.deleteNote` |

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F14-U01 | Offline when the sheet would open | `decide` returns `quiet offline` (exists in `plan.ts`) | Line: Plus needs a connection to the App Store (new `plus.offline`) | Try online | `plan.test.ts` offline row |
| F14-U02 | Products fail to load in the view | The module reports a load failure; no remembered price is ever shown as buyable | `plus.offline` with Close | Retry | Module test with StoreKit config offline |
| F14-U03 | Person cancels Apple's purchase sheet | No change; `started` act stays without a `completed` | Back on the sheet | Not now or buy | `purchase_failed{error_class: cancelled}` unit |
| F14-U04 | Ask to Buy pending | Plan stays Free; listener waits | "Waiting for approval from your family organiser" (new `plus.pending`) | Plus arrives via the listener when approved | Sandbox S-6 |
| F14-U05 | Network drops or app killed after Apple charges | StoreKit redelivers the unfinished transaction at next launch; the listener is registered at launch before any screen | Plus on next launch | Automatic | Sandbox S-4 |
| F14-U06 | Trial-ineligible (used a trial before in this group) | No free wording anywhere | Price and "charged now" | n/a | `[C-REQ-022]` snapshot |
| F14-U07 | `isEligibleForIntroOffer` true but the product has no intro offer | Treat as ineligible (R4-S10) | Price only | n/a | Unit with fixture product |
| F14-U08 | Signed out taps a Plus feature | Keep the book first; Plus sheet only after an account exists (PRD-REQ-022 Rev) | F02 sheet | Sign in or Later (Later shows no Plus sheet) | `[F02-REQ-009]` |
| F14-U09 | Co-parent in the purchaser's Apple Family | Active via family shared ownership; no offer, no notices on this phone | "Plus through Apple Family Sharing" | n/a | Unit with `ownershipTypeIOS` fixture |
| F14-U10 | Co-parent outside the Apple Family | Free | Sheet with the Family Sharing line | Join the family or buy | `[F11-REQ-017]` |
| F14-U11 | Both parents buy | Both pay; we cannot detect it (no server) | Each phone shows its own Plus | Either cancels through Apple; refund through Apple | Manual, documented in F20 help |
| F14-U12 | Purchaser stops sharing or leaves the Apple Family | Co-parent's transaction is revoked and drops out (R4 section 1.2) | Lapse card on the co-parent's phone; books stay open | Re-share or buy | Sandbox, if Apple allows the test (A3) |
| F14-U13 | Refund granted by Apple | Transaction revoked, leaves `currentEntitlements` | Lapse behaviour (6.2 G) | n/a | Sandbox S-9 |
| F14-U14 | Refund reversed | Entitlement returns on next read | Plus | n/a | Unit: planView from re-added transaction |
| F14-U15 | Renewal fails, inside grace (16 days) | Plus continues (grace counts, R4-S2) | Payment line in Plan; one Tonight card per grace period | Apple's own sheet and emails (R4-S12, R4-S22) | `[C-REQ-027]` |
| F14-U16 | Grace ends, Apple keeps retrying (up to 60 days, R4-S12) | State `billing_retry`, extras off (`plan.ts` already treats it as off) | Lapse card; Plan payment line | Payment recovered: Plus returns on next read | Unit |
| F14-U17 | Cancels in iOS Settings and does not open the app | Pending local notices still fire. Their wording is true in both cases (F14-REQ-009) | "Unless you have cancelled, ..." | Next foreground cancels pending notices | Planner unit; copy review **[Counsel]** |
| F14-U18 | App deleted before a notice | No local notice can fire; no email exists | Nothing from us; Apple's own messages only | **[Counsel]** Q-C1 | n/a |
| F14-U19 | Notifications not allowed | Notices show only as in-app cards from window open until `E` | Card on Tonight and Plan | Allow notifications | Unit |
| F14-U20 | Device clock wrong | Local notifications follow the device clock; card dates come from StoreKit | Possibly early or late notification | n/a | Accepted; documented |
| F14-U21 | Different Apple Account on this phone than the purchaser's | Free; Restore finds nothing | `restore_result{nothing_to_restore}`; line: Plus belongs to the Apple Account that bought it (new `plus.restore.none`) | Switch Apple Account in iOS | Sandbox S-8 variant |
| F14-U22 | Another Early Letters account signs in on the same phone | Plus stays (it follows the Apple Account, DR-05 A) | Plus | n/a | Unit |
| F14-U23 | Account deletion while subscribed | Billing notice with Manage link before the final confirm; no server billing data exists to delete | `C-REQ-019` step | Manage | `[C-REQ-019]` |
| F14-U24 | Lapsed with 3 books | All 3 writable; Add a child offers Plus | Gate only on Add | Resubscribe | `[C-REQ-028]` |
| F14-U25 | Offline for 2 weeks with Plus cached, period still paid | Extras stay on while `effectiveUntil` is in the future (`planActive`, exists) | Plus | n/a | `plan.test.ts` stale row |
| F14-U26 | Offline, cached period ended | Extras off; offers quiet until online | Free behaviour; no sheet | Online re-read | `plan.test.ts` |
| F14-U27 | Modified client bypasses the gate | Accepted (DR-04) | n/a | n/a | n/a |
| F14-U28 | Reinstall resets the Read together count | Accepted (D-037) | 3 more sessions | n/a | n/a |
| F14-U29 | Birthday | `decide` returns `quiet birthday` | Add a child shows a quiet line, no sheet | Next day | `[C-REQ-023]` |
| F14-U30 | First run with twins | No sheet; batch free | Two books | n/a | `[C-REQ-023]` first run |
| F14-U31 | Monthly subscriber switches to Annual | Apple handles the change in its manage sheet; no second free trial (one intro offer per group, C section 3 F4) | Price only | n/a | Sandbox |
| F14-U32 | Price increase (none planned) | Apple's consent flow and Apple's own notices (R4-S14, R4-S15); we add one card in the window | Card | Accept or cancel in Apple's flow | **[Counsel]** Q-C7 |
| F14-U33 | Native module missing (Expo Go, simulator without StoreKit config) | `requireOptionalNativeModule` returns null; the sheet shows `plus.offline` | No purchase | Dev build | Unit |
| F14-U34 | AX5 text on iPhone SE 3 | Marketing content scrolls inside the view; no truncation | Full text | n/a | AX5 snapshot plus manual check of Apple's controls **[Counsel]** placement |
| F14-U35 | VoiceOver | Our marketing text is one readable group: price, period, trial end, renewal, cancel | Spoken in order | n/a | VoiceOver script |
| F14-U36 | iOS app on a Mac | Manage sheet unsupported (R4-S9) | Opens the web fallback | n/a | Unit |
| F14-U37 | Sandbox transaction in an App Store build | Ignored (environment rule) | Free | n/a | Unit |
| F14-U38 | Double tap on Apple's buy button | StoreKit shows one sheet | One purchase | n/a | Sandbox |
| F14-U39 | Purchaser has two devices | Both schedule notices from their own StoreKit state | Possibly the same notice on both | n/a | Accepted [R]: a duplicate is safer than a miss |
| F14-U40 | Book hidden or due date pending | Plan notices are not anchored to a child and never name one; they still fire | Plan notice | n/a | Unit |
| F14-U41 | A plan notice day is the child's birthday | Fire time moves inside the window to a non-birthday daytime slot when one exists; otherwise it fires (law first) | Notice | n/a | Planner unit |
| F14-U42 | Read together session running when Plus lapses | The session finishes; the next Start follows the try rule | Uninterrupted | n/a | F10 test |

### 6.4 Placement rules

The sheet opens only from a person's tap on a Plus feature (Add a child, Read together Start) or from Settings > Plan. There is no proactive offer at v1.0, including the "first month chapter complete" value moment in C section 3 F4 [R] (Plus is thin, R-06; new paywalls draw anger, R2 T2).

| Never shown | Enforced by |
|---|---|
| At launch, on Tonight's first frame, in onboarding, in first run | `decide` `surface: 'first_run'`; no trigger exists at launch |
| During recording, Review, export, or a Read together session | No trigger on those screens; F10 opens the sheet only before playback |
| On any book's birthday (local date) | `decide` `isBirthday` |
| In the Book list, a letter, or any notification | No trigger; LEGAL-REQ-054 |
| Inside or before Keep the book | F02-REQ-009 |
| To a contributor (dormant at v1.0, B1) | `decide` `roleInBook: 'contributor'` |
| When this phone already has Plus (own or family shared) | `decide` allows; R-3 |
| After Not now on the same trigger in the same month chapter | Device cap per trigger (C-REQ-023): a second tap shows the F12 or F10 inline gate with "See what Plus adds", and the sheet opens only on that tap |

### 6.5 The subscription view and our text

| Part | Who draws it | Content |
|---|---|---|
| Plan names, periods, prices, purchase button | Apple (`SubscriptionStoreView(groupID:)`, R4-S1) | From App Store Connect, localised by StoreKit |
| Terms and Privacy buttons | Apple, pointed at `https://earlyletters.com/terms` and `/privacy` with `subscriptionStorePolicyDestination` (R4-S1; B11) | |
| Restore, Close | Apple (`storeButton`) | Restore visible; Close visible from the first frame |
| Marketing content slot | Us, as strings passed from JS | Heading by trigger; what Plus adds (`plus.includes.*`); `plus.promise`; Family Sharing line when `isFamilyShareable`; for each plan the price line with its first charge date when eligible ("Free until {date}, then {price} a year") or the no-trial line; renews automatically until cancelled at least 24 hours before; `plus.legal.cancel`; `plus.legal.agree`; link to Subscription terms |

- Dates are computed on the device from today plus the product's introductory period, in the device locale (D-028). The cancel-by date is the trial end minus 24 hours (Subscription terms).
- Whether Apple's view lets no plan be preselected is **Unverified**. C-REQ-022 and UR R16 forbid a preselected plan. The spike tries a control style with one button per plan; if every style preselects, the founder decides (Q-F6) and counsel reviews **[Counsel]** Q-C4.
- Purchases made in the view reach JS through StoreKit transaction updates, which the `expo-iap` listener observes (Inferred, R4 section 2). The spike confirms it and confirms who finishes the transaction.
- If `@expo/ui` already ships a StoreKit subscription view, use it instead of our module (R4 section 2 row; not checked).

### 6.6 Plan notices on the device (DR-02 default A)

**Status.** Counsel is asked first whether Apple, as merchant of record, owns these notices (DR-02 option D) **[Counsel]** Q-C1. Until counsel answers, build A. If counsel says D, keep the acknowledgment, the trial final notice and the in-app cards as a courtesy (UR R16) and drop the rest. If counsel rejects A, option B (the device sends renewal date, will-renew, product and trial flag to our server, which emails) is the smallest change (09 DR-02).

**Inputs, all on the device.** The verified Plus transaction (`expirationDate`, `offer` type and payment mode, `ownershipType`, `purchaseDate`, `originalPurchaseDate`) and `RenewalInfo` (`willAutoRenew`, `renewalDate`, `gracePeriodExpirationDate`, `isInBillingRetry`, `priceIncreaseStatus`) (R4-S3, R4-S5, R4-S69). `E` is the trial end (the `expirationDate` of a transaction whose offer is the free introductory offer) or the period end (`renewalDate`). Notices are planned only when `ownershipType` is purchased, not family shared.

**Windows.** California figures from R4 section 3.1 (17602 as amended by AB 2863). Targets and hard windows from D-022 and LEGAL-REQ-047, which take the strictest of California, New York, Virginia, Utah and Massachusetts (states other than California not re-verified in R4).

| Notice | Applies when | California window | Target | Hard window | Channels |
|---|---|---|---|---|---|
| Acknowledgment | Purchase or trial start | Acknowledgment with terms, cancellation policy and how to cancel; no day window (17602(a)(3)) | At purchase | Same session | Acknowledgment sheet with Save a copy; kept in Settings > Plan |
| Trial week | Trial of 31 days or less that will renew (the monthly plan) | Probably outside 17602(b)(1), Inferred, **[Counsel]** Q-C8 | `E - 7d` | `[E-8d, E-5d]` | Local notification and in-app card |
| Trial long | Trial over 31 days that will renew (the annual plan's 2 months) | 3 to 21 days before the trial ends (17602(b)(1)) | `E - 18d` | `[E-21d, E-16d]` | Local notification and in-app card |
| Trial final | Every trial that will renew | Inside (b)(1) for the annual trial; Subscription terms promise at least 3 days before the last day to cancel | `E - 4d 12h` | `[E-5d, E-4d]` | Local notification and in-app card |
| Annual renewal, long | Annual plan, will renew, not in a trial | 15 to 45 days before renewal (17602(b)(2)) | `E - 30d 12h` | `[E-31d, E-30d]` | Local notification and in-app card |
| Annual renewal, short | Annual plan, will renew | none (courtesy) | `E - 7d` | `[E-8d, E-6d]` | Local notification and in-app card |
| Annual reminder | Monthly plans, each subscription year (D-022); for annual plans the long renewal notice carries it | Once a year, same medium; statute text limits it to annual agreements (17602(h)) **[Counsel]** Q-C6 | Anniversary of `originalPurchaseDate` | That local day | Local notification and in-app card |
| Price increase | Apple consent-required increase only (none planned) | 7 to 30 days before (17602(g)(2)); Apple sends its own email, push and in-app message (R4-S15) | `effective - 25d` | `[-30d, -7d]` | In-app card **[Counsel]** Q-C7 |

**Rules.**
1. Recompute on launch, foreground, every transaction update, purchase, restore and return from the manage sheet. Replace every pending F14 request.
2. `willAutoRenew` false: cancel every pending trial and renewal notice for the period and remove their cards.
3. Fire time: the target instant if its local time is 09:00 to 20:00, else the nearest 09:00 to 20:00 local instant inside the hard window. If that falls on any book's birthday and another daytime slot exists in the window, use it; otherwise fire anyway. A notice is never scheduled outside its hard window; if the window has passed (app first opened too late), the card shows from now until `E` and no notification is scheduled.
4. F14 owns at most 4 pending requests (F13-REQ-011). Only the current period's notices plus the next annual reminder are scheduled.
5. Cards: one card on Tonight from window open until `E` or until dismissed with Done, then the same text stays in Settings > Plan until `E`.
6. On a notice day F13 sends no letter reminder (F13-REQ-015).
7. Content: transactional, no child name, no letter text, no offer; states the date, the localised price string StoreKit returns for the product (field name checked against the installed `expo-iap` types), the cancel-by date and how to cancel, and says "Unless you have cancelled" because a pending notice cannot know about a cancel made outside the app (F14-U17) **[Counsel]** Q-C5.
8. Copy keys (new, content and counsel): `plus.notice.trialWeek`, `plus.notice.trialLong`, `plus.notice.trialFinal`, `plus.notice.renewLong`, `plus.notice.renewShort`, `plus.notice.annualReminder`, `plus.notice.priceIncrease`, `plus.notice.card.*`. "Trial" may appear only where the text is the required disclosure (C section 7).

### 6.7 Review notes: the case for ongoing value (DR-08)

Draft for F21 to paste into App Store Connect Notes for Review. Guideline 3.1.2(a) asks for ongoing value and use across the person's devices (R4 section 5).

- Plus is an auto-renewable subscription with two parts that grow with the family: a book for every additional child, each with its own month chapters that fill as the child grows; and unlimited Read together, which plays a parent's recorded letters to the child chapter by chapter, with new chapters every month. Free books get 3 Read together sessions.
- Plus works on every device signed in to the purchaser's Apple Account and reaches a co-parent through Apple Family Sharing.
- Writing, reading, playing any recording, export and co-parent sharing are free and stay free; nothing in the app becomes unreadable if Plus ends.
- How to see it: with the sandbox account we provide, start a first book, then Settings > Children > Add a child to reach the subscription view; or play 3 Read together sessions in a Free book.
- No feature is switched on remotely. Remote config changes only the number of free Read together sessions, upwards (F14-REQ-018), and kill switches that turn reviewed features off (R4 section 5, 2.3.1(a)).

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| C-REQ-021 Rev (B2, DR-03) | P0 | Products `el_plus_monthly_399` (1-month free introductory offer) and `el_plus_annual_2999` (2-month free introductory offer) in one group "Plus", US only, Family Sharing on for both before launch, Billing Grace Period 16 days. Entitlement is read on the device; no server entitlement. Plus is per Apple Account and its Apple Family, not per book (K-28 replaced) | Given the App Store Connect checklist (BL-103), Then both products show Family Sharing on, grace 16 days, territory United States. Given a Plus transaction on phone A, Then phone B of a different Apple Account outside the family shows Free | C, B2, DR-03, D-048, R4-S17 |
| C-REQ-022 Rev (B2) | P0 | The sheet is Apple's subscription view with our marketing content: what Plus adds, the promise line, trial lines only when eligible and the product has an intro offer, first charge date, renews automatically, how to cancel, the agree line. Every word of ours is visible at default size and wraps at AX5 | Given an eligible user, Then the content includes the localised annual price, "Free until" with a date 2 months from today, "renews automatically" and `plus.legal.cancel`. Given an ineligible user, Then 0 occurrences of "free" in our content. Given AX5 on iPhone SE 3, Then no truncation (snapshot) | C, LEGAL-REQ-046, R4 C5 |
| LEGAL-REQ-046 Rev (B2) | P0 | Disclosures near the purchase button inside Apple's view; no plan preselected if Apple's view allows it (Q-F6) | Given the rendered view, Then our disclosure block sits above Apple's controls in the same scroll; counsel signs off the layout once **[Counsel]** | Legal, R4 C5 |
| C-REQ-023 Rev (B2) | P0 | The sheet opens only from a tap on Add a child or Read together Start, or from Settings > Plan; never on the surfaces in 6.4 | Given a test that drives every screen in 6.4 with a Free user, Then 0 sheets open and 0 `fetchProducts` calls are made | C, K-12 |
| PRD-REQ-022 Rev (B2, DR-05) | P0 | A purchase needs a signed-in account; contributors never see the sheet; no offer when this phone already has Plus. "No offer in a book covered by the other parent" and "restore never moves an active plan" are dropped (no server can know) | Given a signed-out tap, Then Keep the book shows first. Given family-shared Plus on this phone, Then no offer anywhere | PRD, D-036, R4 C2, C8 |
| D-047 Rev (DR-05) | P0 | Dropped. Plus follows the Apple Account on the device, whichever Early Letters account is signed in | Given Apple Account X with Plus and Early Letters accounts M and P signing in turn on one phone, Then both see Plus | DR-05 A |
| C-REQ-020 Rev (B2) | P0 | Restore: transactions appear at first launch after install with no tap; Restore calls `syncIOS` only on a tap | Given an annual subscriber on a new iPhone, When they open the app, Then Plus shows within 10 s with no tap in 99% of sandbox runs; given Restore tapped, Then within 10 s | C, R4-S8 |
| C-REQ-024 Rev (B2, DR-02) | P0 | Acknowledgment at purchase: a sheet with the terms, first charge date, price after, cancel-by date and how to cancel, with Save a copy; the same text stays in Settings > Plan. No email at v1.0 | Given a trial start, Then the sheet shows within 2 s of the transaction with all 5 items and Save a copy produces a text the person can keep. **[Counsel]** Q-C2 confirms this meets 17602(a)(3) | C, LEGAL-REQ-047, R4 section 3.1 |
| C-REQ-025 Rev (B2, DR-02) | P0 | Trial notices on the device per 6.6: trial week (31 days or less), trial long (over 31 days), trial final; notification plus card; cancelled when `willAutoRenew` is false | Given an annual trial ending at `E`, Then one notification inside `[E-21d, E-16d]` and one inside `[E-5d, E-4d]`, both between 09:00 and 20:00 local. Given a monthly trial, Then inside `[E-8d, E-5d]` and `[E-5d, E-4d]`. Given auto-renew turned off, Then 0 pending after next foreground | C, D-022, K-38 |
| C-REQ-026 Rev (B2, DR-02) | P0 | Renewal notices on the device per 6.6: annual long and short; annual reminder on each anniversary for monthly plans; monthly renewals show the date in Plan, no notice | Given an annual renewal on 1 March 00:00 local, Then one notification inside `[29 Jan, 30 Jan]` and one inside `[21 Feb, 23 Feb]`. Given 12 months of a monthly plan, Then one annual reminder on the anniversary | C, D-022, LEGAL-REQ-047 |
| PRD-REQ-003 Rev (B2, DR-02) | P0 | The notice schedule is computed on the device from the StoreKit transaction and `RenewalInfo`, windows stored as data in `packages/core`, nothing scheduled outside a hard window; a missed window shows the card only | Given the clock-controlled planner test over a synthetic year (monthly, annual, both trials, cancel, DST in March and November, leap year, trial of 31 and 32 days, birthday in window), Then every notice lands inside its window and none outside | PRD, K-38, BL-212 |
| LEGAL-REQ-047 Rev (B2, DR-02) | P0 | Same windows as LEGAL-REQ-047; channels change from email plus card plus one push to local notification plus card for every notice; the founder is not paged (no server sees a miss) | As C-REQ-025 and C-REQ-026. **[Counsel]** Q-C1 first | Legal, R4 C1 |
| LEGAL-REQ-048 | P0 | Manage or cancel in one tap from Settings > Plan, nothing in front of Apple's sheet | Given a subscriber, When Manage or cancel is tapped, Then Apple's manage sheet presents within 500 ms; on a Mac, the web fallback opens | Legal, R4-S9 |
| LEGAL-REQ-049 Rev (B2) | P0 | Consent record: a `started` act before the purchase sheet and exactly one `completed` act when the device receives the verified transaction, with product id, offer type, storefront and `disclosure_version`; never the transaction id, price or token | Given a completed purchase, Then exactly 1 `completed` and at least 1 `started` row in `policy_acceptances` for `auto-renewal-terms`, and no column or context field holds a transaction id. Given a signed-out purchase attempt, Then none (cannot happen, PRD-REQ-022). **[Counsel]** Q-C3: is a device-written record without Apple's transaction id adequate proof | Legal, D-049 |
| LEGAL-REQ-050 | P0 | Keep-and-leave: writing, reading, playing, export and co-parent sharing never call StoreKit and never show Plus UI | Given StoreKit unavailable (module stubbed to throw) and a lapsed fixture, Then write, read, play and export succeed with 0 Plus UI (E2E) | Legal |
| C-REQ-027 | P0 | Grace: Plus continues during Apple's 16-day grace; Plan shows the payment line; one card per grace period. Apple's own billing sheet is never blocked | Given a transaction in grace, Then `decide` allows Plus features and the card shows once | C, D-048, R4-S11, R4-S12 |
| C-REQ-028 | P0 | Lapse keeps every book writable, readable, playable and exportable; Add a child needs Plus again; Read together returns to the try state | Given a lapsed user with 3 books, Then all 3 accept a new letter and Add a child shows the gate | C |
| C-REQ-029 Rev (B2) | P0 | Request a refund opens Apple's refund sheet for the latest purchased (not family shared) transaction; Apple decides; a refund removes Plus only | Given a refunded transaction, Then it leaves the entitlement on next read and no letter, recording or book changes | C, R4-S4 |
| C-REQ-019 | P0 | Account deletion while subscribed shows that billing continues through Apple and the Manage link before the final confirm | Given an active purchased subscription, Then the manage step precedes the confirm | C, LEGAL-REQ-029 |
| PRD-REQ-015 Rev (B2, DR-04) | P0 | One free started book; more need Plus on the device; the server never enforces Plus | As F12. Given a modified client, Then the server accepts the book | PRD, F12 |
| PRD-REQ-017 Rev (B2) | P0 | Business purchase totals come only from App Store Connect; server aggregates hold no purchase data | Given the BL-024 aggregate job, Then it reads no billing table (none exists) | PRD, B10 |
| PRD-REQ-020 Rev (B7, DR-06) | P0 | Read together free sessions per F10 (session starts when sequenced playback of a chapter begins; per book on the device; default 3 from remote config) | As F10 | PRD, F10 |
| C-NFR-002 Rev (B2) | P0 | Plus is usable within 2 s of Apple's purchase sheet closing (p95); zero double grants; purchase error rate under 1% | Given 50 sandbox purchases, Then 48 or more show Plus within 2 s | C |
| C-NFR-004 Rev (B2) | P0 | Fail-open for memories; last known plan cached; extras stay on while the cached period is paid (`planActive`) | Given the cache 9 days old with a future `effectiveUntil`, Then extras allowed (existing `plan.ts` table row) | C, TDD 08 2.2 |
| F14-REQ-001 | P0 | A native Expo module hosts `SubscriptionStoreView(groupID:)` on iOS 17 and later with policy destinations set to /terms and /privacy, Restore visible, and our marketing strings | Given a dev build with a StoreKit configuration file, Then the view lists 2 plans with prices, shows our strings, and the Terms and Privacy buttons open earlyletters.com URLs | B2, R4 section 2 |
| F14-REQ-002 | P0 | `expo-iap` provides every other StoreKit call: products, eligibility, listener, entitlements, renewal info, sync, manage, refund. The purchase listener is registered at launch before any route renders | Given a transaction left unfinished by a kill, When the app relaunches, Then it is processed before Tonight's first frame finishes loading data | R4 section 2, BL-210 |
| F14-REQ-003 | P0 | `planView()` is built from the verified Plus transaction in `currentEntitlements` (not the deprecated per-product call) and its `RenewalInfo`; states trial, active, grace, billing_retry, expired, refunded, revoked map to `PlanView` in `packages/core/src/plan.ts` | Given 8 fixtures (one per state plus family shared), Then `planActive` matches the 2.3 truth table in TDD 08 | R4-S2, R4-S4 |
| F14-REQ-004 | P0 | Environment rule on the device: production transactions count; sandbox and Xcode count only in development and preview builds (`APP_ENV`, exists in `apps/mobile/src/lib/build-env.ts`). The server tester flag is dropped | Given a sandbox transaction in a production build, Then Free | B2, TDD 08 F-8 |
| F14-REQ-005 | P0 | Plan cache: the last `PlanView` and the next `E` in local settings (L2), read synchronously | Given airplane mode after purchase, Then `planView()` returns active in under 5 ms | TDD 08 I-2 |
| F14-REQ-006 | P0 | Family Sharing: a family shared transaction grants Plus on the co-parent's phone; no notices are planned for it; Plan says Plus through Apple Family Sharing; Request a refund is hidden | Given `ownershipTypeIOS` family shared, Then Plus allowed, 0 F14 notification requests, refund row absent | DR-03, R4-S6, R4-S18 |
| F14-REQ-007 | P0 | The Family Sharing line shows on the sheet only when the product reports family shareable | Given a fixture product not shareable, Then the line is absent | R4-S18 display duty |
| F14-REQ-008 | P0 | Plan notices per 6.6 are local notifications scheduled through the F13 adapter, at most 4 pending, only for purchased (not shared) transactions | Given an annual trial purchase, Then 2 trial notices plus no renewal notices are pending (renewal notices are planned once the trial converts) | DR-02 A, F13-REQ-011 |
| F14-REQ-009 | P0 | Notice wording holds whether or not the person cancelled outside the app; states date, price, cancel-by date and how to cancel; no child name, no offer | Given every `plus.notice.*` string, Then it contains the cancel route and no `{child}`; content test bans unlock, premium, expire, lose, locked | C section 7, LEGAL-REQ-054 |
| F14-REQ-010 | P0 | In-app plan cards per 6.6 rule 5, shown even when notifications are off | Given notifications denied and an annual trial 18 days from `E`, Then the card shows on Tonight and in Plan | DR-02 A |
| F14-REQ-011 | P0 | `disclosure_version` is a build-time hash of our rendered marketing strings plus the Subscription terms version | Given a change to any `plus.legal.*` string, Then the hash changes in CI | TDD 08 4.2 |
| F14-REQ-012 | P0 | A new migration drops the store tables and functions (`app_account_tokens`, `store_subscriptions`, `store_notifications`, `apply_store_transaction`, `has_plus`, `book_has_plus`, `get_plan_state`, `my_app_account_token`, `store_environment_allowed`), replaces the purge function so it no longer deletes from `store_notifications`, and lands with F12's `create_child` change | Given the migration applied after the pending pack, Then `npm run test:db` passes with the store rows removed from `access_matrix.test.mjs` and `children_entitlements.test.mjs`, and `select to_regclass('public.store_subscriptions')` is null | B2, F12-REQ-002 |
| F14-REQ-013 | P0 | `apps/mobile/src/lib/plan.ts` (new) replaces the `hasPlus()`, `isJoinedBook()` and `newChildNeedsPlus()` stubs in `store.ts` and `FREE_READ_TOGETHER_SESSIONS` in `read-together.ts` | Given a repo grep after merge, Then 0 call sites of the three stubs and of `FREE_READ_TOGETHER_SESSIONS` | TDD 08 2.4, F10 |
| F14-REQ-014 | P0 | No purchase data leaves the phone: no request body, header, log, analytics event or crash report carries a transaction id, original transaction id, `appAccountToken`, receipt, JWS, price or renewal date | Given a CI grep over `apps/mobile/src` and the network capture in the sandbox checklist, Then 0 hits | B2, B10 |
| F14-REQ-015 | P0 | Purchases pass no `appAccountToken` at v1.0 | Given the purchase call in `plan.ts`, Then no token argument | B2, DR-05 A |
| F14-REQ-016 | P0 | The lapse card shows once per lapse; no email, no push | Given a lapse, Then 1 card, 0 notifications | C section 4.3 |
| F14-REQ-017 | P0 | One string set lists what Plus adds; a test asserts it matches `docs/legal/subscription-terms.md` "What Plus adds" | Given the two lists differ, Then the content test fails | TDD 08 6 rule 1, Subscription terms counsel note |
| F14-REQ-018 | P0 | Remote config may raise `read_together_free_sessions` but never below the value the store listing states (3); the sheet, triggers and prices are never server-driven | Given config 1, Then the client uses 3. Given config 5, Then 5 | B14, K-11 |
| F14-REQ-019 | P0 | Never shown: the 6.4 list, as `decide` suppressions plus screen tests | Given the placement suite, Then 0 sheets on 8 forbidden surfaces | C-REQ-023 |
| F14-REQ-020 | P0 | After reinstall or account wipe, plan notices are replanned from StoreKit on first launch | Given an active annual plan and a reinstall, Then the next renewal notices are pending after first launch | F13-REQ-017 |
| F14-REQ-021 | P1 | A price-increase card inside `[-30d, -7d]` when `priceIncreaseStatus` is pending | Given a pending consent increase effective in 25 days, Then one card | R4-S14, Q-C7 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| StoreKit transactions and renewal info | L3 | Apple and the device's StoreKit store | Apple, this app on this device | Apple's |
| Plan cache (`state`, `effectiveUntil`, `verifiedAt`, `environment`, next `E`, ownership) | L2 | Device settings | This device | Replaced on each read; wiped with the app |
| Pending plan notifications | L2 (date and price, no name) | iOS notification store | This device | Until fired or replaced |
| Acknowledgment copy the person saves (dates and price) | L2 | Wherever the person keeps it | The person | Theirs |
| `policy_acceptances` rows for `auto-renewal-terms` (stage, product id, offer type, storefront, `disclosure_version`) | L3 | Postgres (exists) | Owner; service role | LEGAL-REQ-033: 3 years, or 1 year after the plan ends, pseudonymised at deletion |
| Read together session count per book | L2 | Device (D-037) | This device | Install |

- **What never leaves the phone:** transaction ids, receipts, signed transactions, prices, renewal dates, plan state, `appAccountToken`. The consent record carries product and offer type only (F14-REQ-014).
- **Consent record without an account.** A purchase needs an account (PRD-REQ-022), so `record_policy_act` always has a user. A purchase made through Apple's own Settings rather than our sheet produces no record of ours; Apple holds the record **[Counsel]** Q-C3.
- **Privacy labels.** With no server purchase data, the "Purchases" data type may change in `docs/legal/app-store-privacy-labels.md` (StoreKit still processes purchases on the device) **[Counsel]** Q-C9.
- **Server tables removed.** `store_subscriptions` was a 7-year pseudonymised ledger (ADR 0013); its removal changes DATA_CLASSIFICATION and DELETION_AND_EXPORT_SPEC rows (section 13, changes elsewhere).

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Sheet open to Apple's view showing prices | Under 1 s with StoreKit's cache; 3 s fetch timeout then `plus.offline` (C-NFR-007) | Yes |
| Plus usable after purchase | p95 2 s after Apple's sheet closes (F14-REQ-001 path) | Yes |
| Restore | 99% within 10 s (C-NFR-003) | Yes |
| `planView()` | Synchronous, under 5 ms | Yes |
| Notice planner | Under 20 ms; 4 or fewer pending | Yes |
| Placement | 0 sheets outside allowed triggers | Yes |
| Accessibility | Our marketing text at AX5 with no truncation; VoiceOver reads price, period, trial end, renewal and cancel as one group; Apple's controls follow Apple's own accessibility (C-NFR-006, LEGAL-REQ-051) | Yes |
| App size | Native module under 200 KB [A] (B13 budget 40 MB) | Yes |
| Shared rules | `06-nfr.md` | |

## 10. Analytics

Device events only, after opt-in (K-01). Lifecycle numbers (trials, conversions, renewals, refunds, churn) come only from App Store Connect (B2; 03 section 4).

| Event (catalogue) | Exists? | Properties | Question |
|---|---|---|---|
| `plus_offer_viewed` | Yes | `trigger`, `arm` (always `a` at v1.0) | Which trigger brings people to the sheet? |
| `plus_offer_dismissed` | Yes | `trigger` | Where does Not now happen? |
| `purchase_started` | Yes | `product`, `trigger` | Sheet to button rate |
| `trial_started` | Yes | `product` | Device-side check against ASC |
| `purchase_succeeded` | Yes | `product` | Paid starts without a trial |
| `purchase_failed` | Yes | `error_class` | Store error rate under 1% |
| `restore_result` | Yes | `outcome` | Restore health |
| `read_together_try_used` | Yes | `n` | How fast do Free books use the 3 sessions? F10 fires it |
| `plan_notice_shown` | New | `kind` (`trial_week`, `trial_long`, `trial_final`, `renew_long`, `renew_short`, `annual_reminder`), `channel` (`notification`, `card`) | Do notices reach people? Never carries dates |
| `notification_opened` | Yes | `type: plan_notice` | |

`gift_purchased` and the `gift` product value stay unused at v1.0. `PLUS_TRIGGER` values `backup`, `themes` and `chapter_complete` stay unused at v1.0.

## 11. How we build it (with the architect)

| Part | Files | Notes |
|---|---|---|
| Rules | `packages/core/src/plan.ts` (exists) | No rule change for `start_book` and `read_together`. `book.coveredByOtherParent` is always false at v1.0 (no server can know; F11-REQ-017). Keep `backup_upload` and `theme_extra` types for v1.1; no caller at v1.0. Fix the config key comment to `read_together_free_sessions` (F10) |
| Notice windows and planner | New `packages/core/src/plan-notices.ts` | Pure: input transaction summary, renewal info, birthdays, now, zone; output `{kind, fireAtLocal, windowEnd, cardFrom, cardUntil}`. Windows as a data table from D-022 (BL-212 moves here from a server seed) |
| Device plan module | New `apps/mobile/src/lib/plan.ts` | `expo-iap` calls, listener at launch, `planView()`, cache, restore, manage, refund, environment rule. Install `expo-iap` with `flock /tmp/scribe-npm.lock npx expo install expo-iap`; confirm every function name against the installed build's `build/*.d.ts` (R4 section 2 read the main branch, not 5.8.2) |
| Subscription view module | New `apps/mobile/modules/scribe-store/` (Swift `ScribeStoreModule`, `expo-module.config.json`, `index.ts` with `requireOptionalNativeModule`), same layout as `apps/mobile/modules/scribe-files/` (exists) | Hosts `SubscriptionStoreView`, sets policy destinations, Restore, marketing content view from strings; emits `onDismiss` and `onLoadFailed`. Check `@expo/ui` first (R4 section 2) |
| Sheet wrapper | New `apps/mobile/src/components/plus/plus-sheet.tsx` | Computes strings and dates, opens the module, writes the `started` act, shows the acknowledgment. Replaces `apps/mobile/src/components/child/plus-gate.tsx` (exists) and its dev bypass |
| Settings > Plan | New `apps/mobile/src/app/settings/plan.tsx` | Rows in 6.2 H |
| Notifications | F13 adapter (`apps/mobile/src/lib/notifications/`) | F14 passes plan dates to the F13 planner and owns 4 slots |
| Copy | Feature `copy.ts` first, then `packages/content/src/strings.en.ts` (`plus.*`) | New keys listed in section 6; counsel reviews `plus.notice.*`, `plus.ack.*` |
| Server | New migration (data architect sets the timestamp after the newest applied file) | F14-REQ-012. Both `20261003010000_children_and_entitlements.sql` and `20261003020000_purge_batching.sql` are pending (`.github/migrations-applied.txt` lists only the first two files), so the data architect may instead remove the store sections from the pending files before first apply (Q-F7) |
| App Store Connect | BL-103 checklist in `docs/ops/` | Change "Family Sharing off" to on for both products; remove the notification URLs and the In-App Purchase key steps |

**Sequencing.** Week 3: BL-210 spike widened to the native view and on-device renewal info (offline behaviour, listener on view purchases, preselection). Weeks 6 to 7: plan module, notice planner, server drop migration with F12. Weeks 8 to 10: sheet, Settings > Plan, acknowledgment, consent acts. Weeks 11 to 12: sandbox checklist on device. Cut order 2 (`05-feature-map.md` section 5): annual only with no trial, if DR-02 is unanswered by 6 Nov.

**Riskiest unknowns and the spike (WP-F14-01).**
1. Purchases made inside Apple's view reach the `expo-iap` listener, and only one side finishes the transaction (Inferred, R4 section 2).
2. `currentEntitlements` and renewal info offline (Unverified, R4 section 1.1).
3. A control style with no preselected plan (Unverified).
4. Family shared ownership readable through `expo-iap` types (verified on main, not on 5.8.2, R4 section 2).
5. Whether Apple's sandbox lets us test Family Sharing revocation (A3).

## 12. Work packages

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F14-01 | Spike: `expo-iap` on SDK 57 plus `SubscriptionStoreView` module prototype | Payments engineer | `experiments/storekit-spike/` (throwaway) | BL-103 sandbox (StoreKit config works earlier) | Written answers to the 5 unknowns in section 11; ADR 0013 note drafted | Pair. BL-210 |
| WP-F14-02 | Notice windows and planner, pure | Payments engineer | New `packages/core/src/plan-notices.ts`, its test | none | `[PRD-REQ-003]` synthetic-year test, `[C-REQ-025]`, `[C-REQ-026]` window cases, birthday and DST cases | Agent. BL-212 |
| WP-F14-03 | Server: drop store tables and Plus functions | Data architect | New migration; `supabase/tests/access_matrix.test.mjs`, `children_entitlements.test.mjs` | WP-F12-01 (same PR or same day) | `[F14-REQ-012]`; `npm run test:db` green | Agent, `approve-migration`. BL-213 (rescoped) |
| WP-F14-04 | Native subscription view module | Payments engineer | New `apps/mobile/modules/scribe-store/` | WP-F14-01 | `[F14-REQ-001]` on a dev build with a StoreKit configuration file; null module path tested | Pair (native code) |
| WP-F14-05 | Device plan module | Payments engineer, mobile engineer | New `apps/mobile/src/lib/plan.ts`; `apps/mobile/src/lib/store.ts` stub removal; `read-together.ts` | WP-F14-01 | `[F14-REQ-002]`, `[F14-REQ-003]` 8 fixtures, `[F14-REQ-004]`, `[F14-REQ-005]`, `[F14-REQ-006]`, `[F14-REQ-013]`, `[F14-REQ-015]`, `[C-REQ-020]` | Pair (adds a purchase SDK). BL-215 |
| WP-F14-06 | Plus sheet wrapper, acknowledgment, consent acts | Payments engineer, design systems | New `apps/mobile/src/components/plus/`; delete `apps/mobile/src/components/child/plus-gate.tsx` | WP-F14-04, WP-F14-05 | `[C-REQ-022]`, `[LEGAL-REQ-046]`, `[C-REQ-024]`, `[LEGAL-REQ-049]`, `[F14-REQ-007]`, `[F14-REQ-011]`, `[F14-REQ-019]`; CI grep finds no dev bypass in a production bundle | Agent. BL-216, BL-217 |
| WP-F14-07 | Plan notices and cards wired to F13 | Mobile engineer | `apps/mobile/src/lib/plan.ts` notice hook; card component under `apps/mobile/src/components/plus/` | WP-F14-02, WP-F13-04 | `[F14-REQ-008]`, `[F14-REQ-009]`, `[F14-REQ-010]`, `[F14-REQ-020]`, `[F13-REQ-015]` | Agent. BL-218 (rescoped) |
| WP-F14-08 | Settings > Plan | Mobile engineer | New `apps/mobile/src/app/settings/plan.tsx` | WP-F14-05 | `[LEGAL-REQ-048]`, `[C-REQ-027]`, `[C-REQ-029]`, `[F14-REQ-006]` refund hidden for shared | Agent. BL-219 |
| WP-F14-09 | Copy and the Plus list single source | Content | Feature `copy.ts`, then `packages/content/src/strings.en.ts` `plus.*`; `packages/content/test/rules.test.ts` | none | `[F14-REQ-009]`, `[F14-REQ-017]`; counsel sign-off recorded for `plus.notice.*` and `plus.ack.*` | Agent plus counsel |
| WP-F14-10 | Account deletion billing step | Mobile engineer | F17 deletion flow step | WP-F14-05 | `[C-REQ-019]` | Agent. BL-220 |
| WP-F14-11 | Keep-and-leave E2E | QA engineer | `apps/mobile/e2e/` | WP-F14-05, WP-F14-06 | `[LEGAL-REQ-050]` with StoreKit stubbed to throw; `[C-REQ-028]` | Agent. BL-221 |
| WP-F14-12 | Sandbox checklist on device | Founder, payments engineer | `docs/qa/evidence/` | WP-F14-05 to -08 | S-1 to S-10 from TDD 08 9.1, re-pointed: S-1 trial start and acknowledgment, S-2 conversion, S-3 renewal, S-4 kill after pay, S-5 grace, S-6 Ask to Buy, S-7 Family Sharing on a second Apple Account, S-8 restore on a second device under 10 s, S-9 refund sheet, S-10 manage in one tap; plus a network capture showing 0 purchase data to our hosts | Human. BL-222 |
| WP-F14-13 | Review notes and App Store Connect checklist | Founder, payments engineer | `docs/ops/` checklist (BL-103); F21 notes | WP-F14-06 | Family Sharing on for both products; grace 16 days; notes per 6.7 | Human |
| WP-F14-14 | Analytics | Analytics engineer | `packages/analytics/src/catalog.ts` | none | `plan_notice_shown` added; catalogue tests pass | Agent. BL-020 |

## 13. Open questions and assumptions

**Counsel (not legal advice; every answer may change this spec)**

| Q | Question | Needed by | What changes |
|---|---|---|---|
| Q-C1 | Does Apple, as merchant of record, own the California trial and renewal notices (DR-02 D)? If not, do device-computed local notifications plus in-app cards (A) satisfy 17602(b)(1) and (b)(2), given a person who deleted the app or blocks notifications gets nothing from us and we hold no email? | 6 Nov (DR-02) | A stays; or B (server email from device-reported dates); or C (server path of ADR 0013) |
| Q-C2 | Does the in-app acknowledgment sheet with Save a copy satisfy 17602(a)(3), or is an emailed copy needed? Apple's receipt email content is Unverified (R4 section 1.3) | 6 Nov | Adds the B path for the acknowledgment only |
| Q-C3 | Is a device-written `policy_acceptances` record with product, offer type, storefront and disclosure version (no Apple transaction id) adequate consent proof for 3 years? | 6 Nov | LEGAL-REQ-049 wording; D-049 |
| Q-C4 | Does Apple's view with our text in the marketing slot meet "clear and conspicuous, close to the consent request" (R4 C5)? And if every Apple control style preselects a plan, is that acceptable? | Before BL-222 | Layout or a custom sheet (against B2) |
| Q-C5 | Is "Unless you have cancelled" wording acceptable for a pending local notice that cannot see a cancel made outside the app? | 6 Nov | `plus.notice.*` |
| Q-C6 | Does 17602(h)'s annual reminder apply to monthly plans? Statute text limits it to annual agreements; some firms read it as all (R4 section 3.1) | 6 Nov | Drop or keep the monthly anniversary reminder |
| Q-C7 | Does Apple's own price-increase notice discharge 17602(g)(2) for us? | Before any price change | F14-REQ-021 |
| Q-C8 | Is a 1-month trial (28 to 31 days) outside 17602(b)(1)? (Inferred yes, R4 section 3.1) | 6 Nov | Trial week notice becomes courtesy only |
| Q-C9 | Privacy label "Purchases" with no server purchase data | Before submission | `app-store-privacy-labels.md` |
| Q-C10 | Subscription terms "Reminders from us" promises email; at v1.0 there is none. Change to "in the app and by notification on your iPhone"? | 6 Nov | `subscription-terms.md`, Terms 14.6 |

**Founder**

| Q | Question | Needed by | What changes |
|---|---|---|---|
| Q-F1 | Turning Family Sharing on is permanent per product (R4-S17). Confirm DR-03 A | 23 Oct | BL-103 checklist |
| Q-F2 | Confirm DR-05 A: drop D-047; Plus follows the Apple Account | 23 Oct | PRD-REQ-022 Rev |
| Q-F3 | Plus at v1.0 is two things (DR-08). Keep, and watch trial starts in ASC with a review gate at 200 annual trials? | 9 Nov | Scope |
| Q-F4 | No proactive offer at v1.0 (drops C's "first month chapter complete" trigger). Agree? | 30 Oct | `PLUS_TRIGGER` usage |
| Q-F5 | Billing Grace Period for "all renewals" (including free trial to paid) or "paid to paid only" (R4-S11)? Spec default: all renewals | 23 Oct | App Store Connect |
| Q-F6 | If Apple's view always preselects a plan, accept it (Apple's UI, B2) or build our own sheet with `expo-iap` products (keeps C-REQ-022, breaks "Apple's own UI")? | After WP-F14-01 | WP-F14-04 |
| Q-F7 | Remove store tables by a new drop migration (default) or by editing the two pending files before first apply? | Data architect, 16 Oct | WP-F14-03 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Purchases inside Apple's view reach the `expo-iap` listener | WP-F14-01 |
| A2 | Entitlements and renewal info are readable offline from StoreKit's local store | WP-F14-01 in airplane mode |
| A3 | Sandbox supports a Family Sharing test with two sandbox Apple Accounts | WP-F14-01; else TestFlight with real accounts |
| A4 | Few families split across Apple Families | Support tags in beta C1; Study 3 |
| A5 | Bypass by modified clients costs little (DR-04) | ASC trial starts against books-per-family aggregate |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` decisions 3, 16; `docs/prd/v2/_AUTHORING.md` B2, B7, B10, B11, B13, B14.
- V2: `01-problem.md` 2.4, 5; `02-customers.md` P1, P2, P3, sections 5 and 6; `03-goals-and-principles.md` principle 6, 4.2, 4.3; `05-feature-map.md` rank 16, sections 4, 5; `09-decisions-and-risks.md` DR-02 to DR-06, DR-08, R-06.
- PRD: `docs/prd/C-habits-pricing-settings.md` F4, 4.1 to 4.3, C-REQ-019 to C-REQ-034, C-NFR-002 to -007, sections 7, 8, 9, 10; `docs/prd/PRD.md` PRD-REQ-003, -015, -017, -020, -022, K-04, K-11, K-12, K-28, K-31, K-34, K-38, 6.5.
- Decisions and ADR: `docs/DECISIONS.md` D-001, D-008, D-012, D-022, D-028, D-036, D-037, D-047, D-048, D-049; `docs/adr/0013-apple-native-subscriptions.md`.
- TDD: `docs/tdd/08-payments-entitlements.md` sections 2, 4, 5, 6, 7, 8, 9.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-029, -033, -046 to -050, -053, -054; `docs/legal/subscription-terms.md` 1.3.0; `docs/legal/in-app-disclosures.md` section 3.
- Sibling specs: `features/F02-account.md` F02-REQ-009; `F10-read-together.md` 6.2 step 11, 6.3; `F11-co-parent.md` 6.2 Plus and Family Sharing, F11-REQ-017, F11-U25; `F12-children.md` 6.2 Plus rule, F12-REQ-002, WP-F12-01.
- Code read 3 Oct 2026: `packages/core/src/plan.ts`; `apps/mobile/src/lib/store.ts` (`hasPlus`, `isJoinedBook`, `newChildNeedsPlus`); `apps/mobile/src/lib/read-together.ts`; `apps/mobile/src/lib/build-env.ts`; `apps/mobile/src/components/child/plus-gate.tsx`; `apps/mobile/modules/scribe-files/`; `apps/mobile/package.json`; `packages/content/src/strings.en.ts` (`plus.*`, `childrenExtra.*`, `children.add.*`, `settingsMore.*`); `packages/analytics/src/catalog.ts`; `supabase/migrations/20261003000000_security_and_family.sql` (`record_policy_act`), `20261002020000_data_governance.sql` (`auto-renewal-terms`), `20261003010000_children_and_entitlements.sql`, `20261003020000_purge_batching.sql`; `supabase/tests/access_matrix.test.mjs`, `children_entitlements.test.mjs`; `.github/migrations-applied.txt`.
- Backlog: `docs/BACKLOG.md` BL-020, BL-024, BL-036, BL-103, BL-104, BL-210 to BL-222.
- Research: R1 section 0 items 6, 7; F14; section 4 rows 4 and 13 (R1-S1 to S4, R1-S6, R1-S16, R1-S20, R1-S23, R1-S25, R1-S44 to S46, R1-S48 to S50, R1-S55, R1-S60, R1-S67); R2 section 0 items 1 and 3, themes T1, T2 (R2-S6, R2-S29); R3 sections 4.3, 7 (R3-S32, R3-S33); R4 sections 0, 1, 2, 3, 5, 10 C1 to C5, C8 (R4-S1 to S12, R4-S14, R4-S15, R4-S17 to S19, R4-S22, R4-S23, R4-S26 to S32, R4-S55, R4-S67 to S69); `docs/research/USER_RESEARCH.md` R16.
