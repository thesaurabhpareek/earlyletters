# F14 Plus: the membership

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 16 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent (buyer), P2 Co-parent, P3 Expecting parent |
| Existing IDs | PRD-REQ-024 to PRD-REQ-027, K-44, K-45 (PRD 1.4 on `origin/main`); C-REQ-019 to C-REQ-029, C-NFR-002 to C-NFR-004, C-NFR-006, C-NFR-007; PRD-REQ-003, PRD-REQ-015 Rev, PRD-REQ-017, PRD-REQ-020 Rev, PRD-REQ-022; K-04, K-11, K-12, K-28, K-38; LEGAL-REQ-029, LEGAL-REQ-046 to LEGAL-REQ-050, LEGAL-REQ-053, LEGAL-REQ-054, LEGAL-REQ-058; D-001, D-012, D-022, D-047, D-048, D-049, D-053, D-077, D-080, D-081, D-082, D-083; D-051 (main), D-052 (main); DR-02 to DR-06, DR-08, DR-16, DR-17, R-06; BL-036, BL-103, BL-215, BL-216, BL-219 to BL-222, BL-342, BL-344 |
| Depends on | F06 (Review and its Keep buttons), F04 (drafts that hold a letter), F11 (co-parent, Family Sharing line), F13 (notification budget, plan-notice day rule), F15 (export never gated), F17 (Settings > Plan, Erase everything, account deletion), F19 (remote config `freeLettersAllowance`), F21 (review notes, store listing) |
| Status | Draft V2.1, 13 Oct 2026. Rewritten for founder decisions M1 to M6 (`_AUTHORING.md` section 3b). Not legal advice: every item marked **[Counsel]** waits for counsel |

**What changed from the 3 Oct draft.** Plus is now the membership (M1). The two old Plus gates are gone: books for more children and Read together sessions are free (M2). The one gate is the Keep step of a new letter after the first 2 letters an account keeps. Prices are $4.99 and $49.99 (M3). Offer codes are in (M5). Plan reminders come from the phone and from server emails fed by a status-only report (M6). Each requirement in section 7 now says whether it is Built, Partly built or Not built, checked against the code on `docs/prd-v2` rebased on `origin/develop` (6482cd3).

## 1. Why

- [D] Membership: the first 2 letters kept per account are free, one pool across every book. After that, the Keep step of a new letter needs Plus. Capturing, typing, reviewing, reading, playing, exporting, deleting and restoring are never gated. A letter held at the gate is never lost. A never-decreasing ledger counts letters ever kept (D-051 (main), D-082, D-083; M1).
- [D] Prices: Plus Monthly $4.99 with a 1-month free trial; Plus Annual $49.99 with a 2-month free trial (D-082, M3). Display names per D-077. Apple only, StoreKit 2, Apple's own subscription view, restore, manage and refund sheets (D-053, ADR 0013).
- [D] The app reports subscription status only (plan, trial end, renewal date, cancelled flag) so our server can send the California auto-renewal reminder emails. No receipts, no payment data; the server never enforces Plus (D-080, D-081, M6). On-device plan reminders and "Save a copy" after purchase are also v1.0 (ROADMAP 2.1 section 1, BL-342).
- [S] Charging for something that used to be free drew a negative review every time in the R2 sample: 10 of 10 reviews across 6 products [S] R2 section 0 item 3, theme T2. No user has been bound yet (v1.0 is not released), so the membership is the model from the first day, not a take-back. Plus must still never move an existing letter behind payment (03 principle 6).
- [S] Paywalls on existing memories are the single biggest trust failure in the category this year: Qeepsake is moving to "a paid-only system" and deactivating inactive free accounts [S] `docs/research/competitors/us.md` section 3 (Qeepsake lesson), section 9.
- [F] At $4.99 a month we match the category's monthly floor (seven of 20 apps) below the $6.24 median; $49.99 a year equals the annual median [F] `docs/research/competitors/us.md` section 0 item 8.
- [F] A 1-month trial on a monthly plan sits in the 17 to 32 day bucket: 43.7% median trial-to-paid and 77.5% first renewal on monthly plans. Trials over 32 days are excluded from the benchmark, so the 2-month annual trial has none [F] R3 section 4.3 (R3-S33).
- [F] Hard paywalls convert 10.7% of installs by day 35 against 2.1% for freemium, with almost the same 12-month retention (27% against 28%) [F] R3 section 4.3 (R3-S32). Two free letters then a gate sits between the two models [A]; no published benchmark covers it.
- [F] Much of this exists in code and is green in CI but has not run on a real iPhone (M13; ROADMAP 2.1 section 0). Section 7 marks what is missing.

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P1 Evening parent, third letter | Has kept 2 letters; records a third at 21:00 and taps Keep | Must not lose the words just spoken; wants a plain choice, not a sales page; may be offline |
| P1 on a free month | 4 days before the first charge | Wants the date, the price and how to cancel, without hunting (UR R16) |
| P1 after a lapse | Card declined, or chose to stop | Every letter, recording and book must be exactly where it was; new letters wait at Keep (PRD-REQ-026) |
| P2 Co-parent | Partner bought Plus | Expects to keep letters too. Works on their phone only through Apple Family Sharing today (DR-16) |
| P3 Expecting parent | Before birth, first two letters | Books and the due-date book are free; only the third kept letter meets the gate |
| A tester or friend | Has an offer code from the founder | Wants to type it in once and have Plus on (D-052 (main)) |

## 3. What we are solving

**Outcome.** A family can try the product with 2 kept letters, meets one calm gate at the third Keep, never loses that letter, pays through Apple in a few taps, knows what it costs and when, is reminded before every charge the law requires, and keeps every letter readable, playable and exportable whatever happens to Plus.

| Metric | Target | How measured | Caveat |
|---|---|---|---|
| Letters lost or discarded at the Keep gate | Zero (gate) | `[never lose a recording]` ledger test; device checks D-1, D-9 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11 | None |
| Plus started after the gate / gate shown | Set after cohorts [A] | `plus_started_from_gate` / `keep_gate_shown` (device, opt-in) | Opt-in only; counts include restores and offer codes |
| Held letters later kept | Set after cohorts [A] | Not linkable (no letter ids in analytics); proxy: `plus_started_from_gate` per `letter_held` | Opt-in only |
| Trial to paid | 40% or more [A] | App Store Connect (ASC) | Review gate at the first 200 annual trials (R3 section 7 item 3) |
| Annual share of Plus | 60% or more [A] | ASC | |
| Refund rate | Under 3% [A] | ASC | R3-S35: 2% to 5% typical |
| Required plan reminders inside their windows | 100% of purchased subscriptions on the purchasing phone | Clock-controlled planner test over a synthetic year (BL-342) | Local delivery needs the app installed and notifications allowed; emails need sign-in and the status report (M6; v1.0 per M14) |
| Purchase data on our servers beyond the D-080 status fields | Zero (gate) | Network capture on the sandbox checklist; CI grep (F14-REQ-014) | |
| Plus sheet shown outside its triggers | Zero (guardrail, 03 section 4.3) | Placement tests; `plus_offer_viewed.trigger` | |

## 4. Scope

**In v1.0**
- The membership gate at Keep, the letter ledger, held letters, the calm line after the second free letter, the lapsed wording (M1).
- Books for more children and Read together with no Plus gate (M2; F10, F12).
- Two auto-renewable products in one group, Apple free trials, Family Sharing on, Billing Grace Period 16 days, US only (M3).
- Apple's `SubscriptionStoreView` through our native module `apps/mobile/modules/scribe-store/`, with our marketing text above the plans. No price or trial length typed by us (D-083 copy rule).
- On-device entitlement from `Transaction.currentEntitlements` and subscription statuses; a cached snapshot; Plus enforced on the device only.
- Settings > Plan: status and dates, See what Plus adds, Redeem a code, Manage subscription, Restore purchases, Request a refund.
- Apple offer codes through Apple's redemption sheet (M5).
- Plan reminders: on-device local notifications and in-app cards, the acknowledgment sheet with "Save a copy" (BL-342); the status-only report and the reminder emails (D-080, D-081, `docs/emails/CATALOG.md` section 7). The emails need sign-in and a server; both ship in v1.0 (M14, which answers DR-17). On 13 Oct the release profiles still have server features off until they are flipped.
- Lapse: every letter stays readable, playable and exportable; new keeps need Plus.
- Review notes that describe the membership (DR-08).

**Later**
- Encrypted backup as a Plus feature (`backup_upload` stays a `GatedFeature` with no caller; F31). Extra themes (`theme_extra`, F46).
- Gifts and lifetime (C-REQ-030, C-REQ-032, F43). Dormant-payer email (`plus-quiet`, v1.1 in CATALOG section 7).
- A server "book has a member" signal so one membership covers a co-parent outside the payer's Apple Family (DR-16).
- Price-increase notice (`price-increase` email; Apple's consent flow until then, D-080).
- Google Play billing (F36).

**Never**
- A gate on capturing, typing, reviewing, reading, playing a recording, export, deleting, restoring from Recently deleted, starting a book or Read together (`FreeForever` in `packages/core/src/plan.ts`; LEGAL-REQ-050).
- Discarding, truncating or hiding a letter because of the gate (PRD-REQ-025; the constitution).
- Counters or gap counts: no "1 letter left", no "2 of 2" on any screen (M1; CLAUDE.md content rules).
- A price, "free trial", "free months" or "we will email you" in our app copy; Apple's sheets show price and trial to eligible people (D-083 copy rule in `packages/content/src/features/billing.en.ts`).
- Receipts, signed transactions, transaction ids, card or payment data on any server of ours; server enforcement of Plus (D-080).
- RevenueCat or any third-party billing SDK; an App Store Server Notifications endpoint (D-053).
- A code system of ours for free months (D-052 (main), App Review 3.1.1 as quoted in that entry).
- Countdown timers, fake discounts, urgency, a delayed close button (TDD 08 section 6 rule 7).
- The words premium, expire, lose or locked in plan copy (C section 7).
- A Plus offer inside any notification or billing email (LEGAL-REQ-054; CATALOG section 7 copy rules).
- Server-driven paywall content or placement (B14). Remote config may only raise the allowance.

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | $4.99 a month; web $47.88 a year, App Store $47.99; 7-day trial; free Lite views old entries; moving to "a paid-only system" [F] `us.md` section 3 (U2 to U5) | 4.9 (15K) [F] R1-S1 | Charges after unsubscribing [S] R1-S55; paywall on old memories is the category's biggest trust failure [S] `us.md` section 3 | **Avoid** any gate on existing letters; **Match** read after lapse, and add play and export [R] |
| Tinybeans | $7.99 / $74.99; after a lapse, content over 5 GB is archived and hidden [F] R1-S2, R1-S46 | 4.9 (104K) | Price rises and new paywalls drew anger [S] R2 T1, T2 | **Avoid** hiding content after a lapse [R] |
| Day One | Silver $49.99 a year, 1-month trial; media stays playable after a lapse; Family Sharing does not apply [F] R1-S6, R1-S23, R1-S25, R1-S60 | n/a | A user compares $25 a year with a rival at $4 [S] R2 T1 | **Match** lapse; **Innovate** with Family Sharing on (R4-S17) [R] |
| Dearest | Plus $4.99 / $49.99 with a free tier; in-app renewal reminders with cancellation deadlines (v1.4.2) [F] R1-S3; "If your subscription ends, nothing is taken from you" [F] `us.md` section 3 (U37) | 1 US rating [F] R2-S6 | n/a | Same price as ours. **Match** in-app reminders as one of the two reminder channels [R] |
| Tiny Treasures | $4.99 / $29.99 / $99 lifetime; free with one child; one plan covers the family [F] R1-S67; `us.md` section 8.1 | 5.0 (7) [F] R1-S67 | n/a | Now $20 a year cheaper than us. **Match** one membership for the family (M4) [R] |
| FirstChapter | $6.99 / $39.99; free tier of 3 AI voice entries a month [F] R1-S4 | No US average [F] R1-S4 | n/a | Meters capture every month. **Avoid** monthly metering: our 2 free letters are a one-time allowance [R] |
| Notabli, Moment Garden | $4.99 / $49.99 each [F] `us.md` section 8.1 | 4.66 (70); 4.84 (3,878) | n/a | Price peers; no action |
| Calm (quality bar) | $14.99 / $69.99 [F] R1-S48 | n/a | Cost, limited free content, hard to cancel [S] R1-S48 | **Avoid** cancel friction: Apple's manage sheet one tap from Settings > Plan [R] |
| Apple SubscriptionStoreView | iOS 17; loads names, prices, trials and a purchase button from the group; Terms and Privacy buttons; marketing content slot [F] R4-S1, R1-S50 | Apple does not say it satisfies 3.1.2(c), DPLA Schedule 2 or state law [F] R4 section 1.1 | n/a | **Match** (D-053). Our text above the plans; counsel reviews the layout **[Counsel]** [R] |

**Price position.** Monthly $4.99 is the category floor; annual $49.99 is the median of 18 apps and above Adapty's global annual median of $38.42 [F] `us.md` section 8.2; R3 section 4.3 (R3-S34). Annual costs about ten months of monthly: 12 x $4.99 = $59.88, so annual saves $9.89 (17%) [F] arithmetic in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 4. Note: `us.md` sections 8.1 and 8.2 still show $3.99 and $29.99; section 0 item 8 is updated.

## 6. Experience

### 6.1 Entry points

| Entry | Where (code) | Opens |
|---|---|---|
| Keep, Keep privately or keep the voice without words, after the allowance is used and without Plus | `apps/mobile/src/app/review.tsx` (`keepNeedsPlus` before `saveLetterFromDraft` or `saveVoiceOnlyFromDraft`) | The Keep sheet (`PlusGate variant="keep_letter"` in `apps/mobile/src/components/child/plus-gate.tsx`) |
| Keep sheet > See Plus | `plus-gate.tsx` | Apple's subscription view (`presentPlusStore`) |
| Keep sheet > Redeem a code | `plus-gate.tsx` | Apple's offer code sheet (`redeemOfferCode`) |
| Settings > Plan | `apps/mobile/src/app/settings/plus.tsx` (route `/settings/plus`) | Status, See what Plus adds, Redeem a code, Manage, Restore, Refund |
| A plan reminder notification or card | BL-342 (not built) | Settings > Plan, never the purchase view |
| A reminder email | D-080 (not built) | Apple's subscriptions page through `{manageUrl}` |
| Add a child, Read together, first run, export, a letter, a notification | n/a | Never a Plus sheet (M2; 6.4) |

### 6.2 Happy paths

#### A. The first two letters

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Records or types a letter, reviews it, taps Keep | Normal Review and saved card | `ensureAudioHash`, then `keepLetterGate()` reads the ledger (0) and `decideKeepLetter` returns `allow free_letters`. `saveLetterFromDraft` writes the letter and counts it in one transaction (`ledger.recordKept`). `afterLetterKept` copies the count to the Keychain |
| 2 | Keeps a second letter | Saved card plus one calm line: "That was your second free letter." (`billingCopy.keepGate.secondFreeNote`) | Ledger reaches 2; `free_allowance_reached{allowance: 2}` after consent. The line shows once, only when the allowance is 2 and Plus is off |
| 3 | Later, opens Settings > Plan | "Your first two letters are free. Plus lets you keep adding." (`billingCopy.plan.off`) | No count of letters left anywhere |

#### B. The third letter: held, then kept with Plus

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Reviews a third letter, taps Keep | The Keep sheet: "Keep adding to {child}'s book" (`keepGate.title`), `keepGate.body`, `keepGate.heldNote` ("This letter is safe on your phone. Come back to it once Plus is on."), buttons See Plus, Keep it here for now, Redeem a code | Recording already closed and hashed. `decideKeepLetter` returns `offer keep_letter`. Nothing is saved; the draft is untouched. `keep_gate_shown{letters_kept, allowance, lapsed}` |
| 2a | Taps Keep it here for now | Back to Tonight; the draft card "A letter is waiting to be read back." (`tonight.draftWaiting.title`) | `letter_held{letters_kept}`. The draft stays in the local database and its audio stays on disk (F04) |
| 2b | Taps See Plus | Apple's subscription view (6.5) | `plus_offer_viewed{trigger: keep_letter}` |
| 3 | Picks a plan, confirms with Face ID | Apple's purchase sheet | StoreKit transaction arrives through the native listener (`startTransactionListener`); `refreshPlan()` |
| 4 | Sheet closes | The same Review again; the person taps Keep themselves (D-083) | `plus_started_from_gate`; `decideKeepLetter` returns `allow plus_own`; the letter saves and counts (the count keeps rising under Plus) |
| 5 | (Not built) after the purchase | The acknowledgment sheet with Save a copy (6.6) | BL-342; then the first status report with consent facts (D-081) |

#### C. Not eligible for a free trial, or lapsed
- Apple's view shows only the price for a person who used a trial in this group before. Our text never says "free trial", so nothing to change (D-083 copy rule).
- A lapsed member (`expired`, `refunded`, `revoked`) sees `keepGate.lapsedBody`: "Plus has ended. Every letter stays yours to read, play and export. To add new ones, Plus can start again." (`decideKeepLetter` sets `lapsed`).

#### D. Offer code
1. Settings > Plan > Redeem a code, or Redeem a code on the Keep sheet, opens Apple's offer code sheet (`presentOfferCodeRedeemSheet`, D-052 (main)).
2. A redeemed code arrives as an entitlement update; Plus turns on with no restart; `offer_code_redeemed` fires once Plus is on.
3. An offer-code member is a member: the Keep gate allows (`planActive`). When the free period ends, Apple converts it to the normal price unless the person cancels **[Counsel]** wording (D-052 (main)).

#### E. Co-parent in the payer's Apple Family
The co-parent's phone lists the Plus transaction with ownership `familyShared`; Plus is on; Plan reads "Shared with you through Apple Family Sharing." (`billingCopy.plan.shared`); no refund row; no reminders and no status report from this phone (D-080 rule). Co-parent sharing ships in v1.0 (M14; built, switch off in release profiles on 13 Oct); see DR-16.

#### F. Restore on a new iPhone
StoreKit lists current entitlements on the first launch after install, so Plus usually appears with no tap. Settings > Plan > Restore purchases calls `ScribeStore.sync()` only on a tap (Apple may ask the person to sign in). Plus follows the Apple Account, not our account (DR-05). The letter ledger is separate: see U03 to U06.

#### G. Cancel, refund, lapse
- Manage subscription opens Apple's manage sheet in one tap, with Apple's web page as the fallback (`manageSubscription`, LEGAL-REQ-048). On return the app re-reads; Plan reads "Plus stays on until {date}. It will not renew."
- Request a refund opens Apple's refund sheet for the person's own purchase; hidden for family-shared Plus (`requestRefund`).
- After the period, grace and retry end, the Keep gate offers Plus again with the lapsed wording. Every existing letter reads, plays and exports; every book stays open; nothing is hidden (PRD-REQ-026).

#### H. Settings > Plan (`apps/mobile/src/app/settings/plus.tsx`)

| Row | Shows | Copy key | Build |
|---|---|---|---|
| Status | Free line; Plus is on, free until {date}, with cancel-by date; Plus renews on {date}; Plus stays on until {date}; grace line; retry line; Shared with you through Apple Family Sharing; period Monthly or Yearly | `billingCopy.plan.*` | Built |
| Footer | The promise: first two letters free; every kept letter stays yours to read, play and export | `plus.promise` | Built |
| See what Plus adds | Opens Apple's view (only while Plus is off) | `plan.seePlans` | Built |
| Redeem a code | Apple's offer code sheet (only while Plus is off) | `plan.redeem`, `redeemHelp` | Built |
| Manage subscription | Apple's sheet | `plan.manage` | Built |
| Restore purchases | `sync()`, then re-read | `plan.restore` | Built |
| Request a refund | Apple's refund sheet; own purchase only | `plan.refund` | Built |
| Your Plus terms, with Save a copy | The acknowledgment text for the current period | new `billingCopy.plan.terms` | Not built (BL-342) |
| Deleting the app or your account does not cancel Plus | Footnote | new `billingCopy.plan.deleteNote` | Not built |
| Subscription terms, Terms, Privacy links | Links | `plus.legal.*Link` | Not built on this screen |

The display name in the period label reads "Yearly" today; D-077 names the product "Plus Annual" (gap, F14-REQ-030).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F14-U01 | Offline at Keep, allowance used, no cached Plus | Still `offer` (offline changes only wording, never the answer); the draft is kept | Keep sheet; See Plus returns `unavailable`; `keepGate.offline`: "Plus needs the internet to start. Your letter stays safe on your phone until then." | Keep it here for now; try online | Device check D-9 |
| F14-U02 | Offline at Keep with cached Plus whose period is still paid | `planActive` true from the cached snapshot | Letter keeps normally | n/a | `plan.test.ts` row 13 (cache 9 days old, period ahead) |
| F14-U03 | Held letter, then the phone is lost | The held letter is a draft in the local database plus its audio file, as durable as any draft (F04, F08). It comes back only from the person's own iPhone backup | Nothing from us on the lost phone | Restore from the device backup; the draft card returns | Device check D-8 variant |
| F14-U04 | Reinstall on the same phone (Free, 2 kept) | The Keychain item (`earlyletters.letters.keptEver`, this-device-only) usually survives; `startLetterLedger` raises the mirror to it; the third Keep asks for Plus. Apple does not guarantee Keychain survival; a lost item gives 2 more free letters (accepted: a gift, never a lock-out) | Keep sheet at the third Keep | n/a | `billing-ledger.test.ts` reinstall rows; device check D-7 |
| F14-U05 | iCloud backup restored to a new phone | Mirror and letters present come back; the Keychain item does not; the gate uses the largest and heals the Keychain | Keep sheet at the third Keep | n/a | `billing-ledger.test.ts` restore rows; device check D-8 |
| F14-U06 | Two iPhones, one person, no sync (v1.0) | Each phone has its own ledger; each allows 2 free letters. Plus on one Apple Account covers both phones | 2 free letters per phone | n/a | Accepted (open edge 4 default, 6.7) |
| F14-U07 | Offline keep past the limit | Impossible on an unmodified client: the gate decides on the device with no network. A modified client can bypass it; the server accepts every letter (D-080) | n/a | n/a | Accepted (DR-04) |
| F14-U08 | Co-parent keeps a letter (when co-parent sharing ships) | The co-parent's phone decides with its own ledger and its own Plus (own or Family Sharing). The book owner's Plus does not reach a co-parent outside the Apple Family | Co-parent outside the family meets the gate at their third kept letter | Join the Apple Family, or buy | DR-16 default; blocked until `capabilities.coParent` |
| F14-U09 | Trial-ineligible person | Apple's view shows price only; our text has no "free" word | Price and Apple's terms | n/a | `packages/content/test/rules.test.ts` D-083 case (no price, "free trial" or "free months" in `keepGate` and `plan`) |
| F14-U10 | Erase everything | `eraseLetterLedger()` removes the Keychain item and the mirror; the next kept letter is free letter 1 | Fresh start | n/a | `billing-ledger.test.ts` "removes the Keychain item and the database mirror". No v1.0 surface calls it today (F14-REQ-026) |
| F14-U11 | Letter deleted, then another written | Count never decreases; deleting does not give a free letter back | Keep sheet at the third keep overall | n/a | `billing-ledger.test.ts` delete rows |
| F14-U12 | Letter restored from Recently deleted (D-085) | Not counted again (idempotent per id, recent ids kept) | Letter back, no gate | n/a | `billing-ledger.test.ts` restore row |
| F14-U13 | App killed between Keep and save under the gate | A held letter wrote nothing; an allowed letter and its count commit together or not at all | Draft or letter, never both, never neither | n/a | `[atomic]` ledger test; kill test (F04) |
| F14-U14 | Double tap on Keep | `saving` ref blocks a second save; idempotent count per id | One letter | n/a | `[Keep after Plus starts saves once]` |
| F14-U15 | Person closes Apple's view without buying | Back on the Keep sheet; the draft is untouched | Keep sheet | Keep it here for now | `plus_offer_closed{outcome: dismissed}` |
| F14-U16 | Ask to Buy pending | Plan stays Free; the listener waits; when approved, `plan.plusOn` turns true and the sheet carries on | Keep sheet until approval | Automatic | Sandbox |
| F14-U17 | Network drops or app killed after Apple charges | StoreKit redelivers at next launch; the listener starts at boot (`startPlus` in `_layout.tsx`) | Plus on next launch; the held letter still waits for Keep | Tap Keep | Sandbox |
| F14-U18 | iOS 16 phone | `storeViewSupport` is `needs_ios_17`; See Plus is hidden | `gate.needsNewerIos` | Update iOS; Keep it here for now | Unit; BL-336 sets iOS 17 |
| F14-U19 | Native module missing (Expo Go, web) | `ScribeStore` null; Free; nothing locked except the Keep gate | `gate.unavailable` | Dev profile only: the dev pass button (`devShortcutsAllowed`) | Release-bundle grep (BL-117) |
| F14-U20 | Signed out (every v1.0 build) | Purchase needs no account with us; Plus belongs to the Apple Account | Normal | n/a | `plan.logic.ts` note |
| F14-U21 | Co-parent outside the payer's Apple Family | Free on their phone | Gate at their third kept letter | Join the family or buy | DR-16 |
| F14-U22 | Purchaser leaves the Apple Family | Co-parent's transaction is revoked; Plus off on that phone | Lapsed wording at their next gated Keep | Re-share or buy | Sandbox if Apple allows the test (A3) |
| F14-U23 | Both parents buy | Both pay; we cannot detect it | Each phone shows its own Plus | Cancel through Apple | Documented in F20 help |
| F14-U24 | Refund granted | Transaction revoked; leaves current entitlements | Lapsed wording at the next gated Keep; letters unchanged | n/a | StoreKit file: refund |
| F14-U25 | Renewal fails inside grace (16 days) | Plus continues (`grace` is on) | `plan.grace` line | Apple's own sheets and emails | `plan.test.ts` |
| F14-U26 | Grace ends, Apple retries | `billing_retry`: Plus off | `plan.retry`; the Keep sheet uses the normal body, not the lapsed one (`billing_retry` is not a lapsed state) | Payment recovered: Plus returns | `plan.test.ts` |
| F14-U27 | Cancels in iOS Settings and does not open the app | Local reminders already scheduled still fire; their wording holds either way; the server learns at the next app open (D-080) | "If you have already cancelled, there is nothing to do." | Next launch cancels pending reminders | Planner unit **[Counsel]** wording |
| F14-U28 | App deleted before a reminder | No local reminder can fire; the email still goes if a status report was received (D-080) | Email only | n/a | D-080; v1.0 per M14 (DR-17 answered) |
| F14-U29 | Notifications not allowed | Reminders show only as in-app cards; emails unaffected | Card on Tonight and in Plan | Allow notifications | Unit |
| F14-U30 | Different Apple Account on this phone | Free; Restore finds nothing | `plan.restoreNothing` | Switch Apple Account | Sandbox |
| F14-U31 | Account deletion while subscribed | Deletion step 1 shows that billing continues through Apple with Manage subscription; the status record is deleted with the account (D-080) | Billing step | Manage | `[C-REQ-019]`; deletion is built but hidden until the release profiles turn server features on (M14) |
| F14-U32 | Monthly subscriber switches to Annual | Apple handles the crossgrade; no second free trial (one introductory offer per group) | Apple's sheet | n/a | Sandbox |
| F14-U33 | Remote config sends `freeLettersAllowance` 0, 1, 1.5 or "two" | Falls back to 2; values above 100 stop at 100 | 2 free letters | n/a | `plan.test.ts` `freeLettersFrom` rows |
| F14-U34 | Remote config raises the allowance to 5 | Gate allows letters 3 to 5; the calm line does not show (it names the second letter) | No line | n/a | Unit |
| F14-U35 | Birthday or first run at the gate | The Keep gate never goes quiet: a quiet answer would leave the letter neither kept nor explained (`KeepLetterDecision` comment). First run cannot reach a third letter | Keep sheet | Keep it here for now | Unit |
| F14-U36 | AX5 text on iPhone SE 3 | Keep sheet scrolls; Apple's view scrolls our text | Full text | n/a | AX5 snapshot |
| F14-U37 | VoiceOver | Keep sheet: title, body, held note, then buttons in order; the held note is a polite live region | Spoken in order | n/a | VoiceOver script |
| F14-U38 | iOS app on a Mac | Manage sheet unsupported; web fallback | Apple's web page | n/a | Unit |
| F14-U39 | Sandbox transaction in an App Store build | Counted as a tester purchase (`isTester`), because App Review buys in the sandbox and a verified sandbox transaction exists only in TestFlight, development builds or App Review | Plus | n/a | `billing-plan.test.ts` |

### 6.4 Placement rules

The purchase view opens only from a tap: See Plus on the Keep sheet, or See what Plus adds in Settings > Plan. There is no proactive offer at v1.0.

| Never shown | Enforced by |
|---|---|
| At launch, in onboarding, in first run, on Tonight | No caller exists |
| During recording, export, Read together, Add a child | No caller exists (M2) |
| In the Book, a letter, a notification or an email | No caller; LEGAL-REQ-054 |
| When this phone already has Plus | `decideKeepLetter` allows; Settings rows hidden while `plusOn` |

The Keep sheet itself is not a sales screen: it says the letter is safe first, then offers a choice. It never names a price.

### 6.5 Apple's subscription view and our text

| Part | Who draws it | Content | Build |
|---|---|---|---|
| Plans, prices, trials, purchase buttons | Apple (`PlusStoreSheet.swift`, `.buttons` style, neither plan preselected, BL-216) | From App Store Connect | Built; not run on a device |
| Terms and Privacy buttons | Apple, pointed at `brand.web.terms` and `brand.web.privacy` | | Built |
| Restore, Close | Apple | | Built |
| Our text | `storeSheetOptions()` in `apps/mobile/src/lib/billing/actions.ts` from `billingCopy.store` | Title "Plus"; "Keep adding letters to every book, as many as you like."; the promise line; renewal line; cancel line; Family Sharing line | Built |
| Trial timeline (first charge date) | Us | BL-342 asks for a trial timeline in the marketing text; D-083 forbids a trial length in our copy. Spec default: Apple's view carries it; no timeline of ours **[Counsel]** Q-C4 | Not built |

### 6.6 Plan reminders: on the phone and by email (M6)

**Two channels, one schedule.** Windows are D-022's (strictest of California, New York, Virginia, Utah, Massachusetts), kept as data in `packages/core`. `E` is the trial end or period end; the cancel-by date is `E - 24h`.

| Notice | When | On the phone (BL-342) | Email (D-080, CATALOG 7) |
|---|---|---|---|
| Acknowledgment | Purchase or trial start | Sheet with the terms, first charge date, price after, cancel-by date, how to cancel, and Save a copy (share sheet: Mail, Files, Notes); same text stays in Settings > Plan | `trial-started` or `plus-started` within 1 h |
| Trial week | Trial of 31 days or less that will renew (monthly) | `E - 7d`, window `[E-8d, E-5d]`: notification and card | `trial-ending-week` |
| Trial long | Trial over 31 days (annual's 2 months) | `E - 18d`, window `[E-21d, E-16d]` | `trial-ending-long` |
| Trial final | Every trial that will renew | `E - 4d 12h`, window `[E-5d, E-4d]` | `trial-ending-final` plus its one push |
| Annual renewal, long | Annual, will renew | `E - 30d 12h`, window `[E-31d, E-30d]` | `annual-renewal-long` |
| Annual renewal, short | Annual, will renew | `E - 7d`, window `[E-8d, E-6d]` | `annual-renewal-short` |
| Annual reminder | Monthly plans, each subscription year | Anniversary day | `anniversary-reminder` |
| Cancelled, ended | Renewal off; Plus ended | Plan line only | `plus-cancelled`, `plus-ended` |

**Rules for the phone (BL-342).**
1. Inputs come from the snapshot the app already reads (`apps/mobile/modules/scribe-store/types.ts`): `expiresAt`, `isTrial`, `willAutoRenew`, `ownership`, `productId`. Only `purchased` ownership plans reminders.
2. Recompute at launch, foreground, every transaction update, purchase, restore and return from the manage sheet. Replace every pending plan reminder. `willAutoRenew` false cancels them.
3. Fire between 09:00 and 20:00 local inside the hard window; never outside it. A passed window shows the card only.
4. Plan reminders carry their own source marker so `apps/mobile/src/lib/reminders/scheduler.ts` (which cancels only `scribe.reminders` items) leaves them alone; at most 4 pending (F13-REQ-011); no letter reminder on a plan-reminder day (F13-REQ-015).
5. Wording: transactional, no child name, no letter text, no offer; date, the plan's published price, cancel-by date, how to cancel, and "If you have already cancelled, there is nothing to do." (D-080 rule) **[Counsel]**.

**Rules for the status report (D-080, D-081).**
1. The app sends plan, trial end date, renewal date and the cancelled flag: when a purchase or trial completes in the app, and on each launch when the values changed. Only a phone whose transaction is `purchased` reports; Family Sharing members never report and get no billing email.
2. The first report after a purchase also carries the consent facts: product, offer type, the Subscription Terms version shown, the time. One record per original purchase; life of account plus 3 years; pseudonymised at deletion (D-081).
3. Never: receipts, signed transactions, transaction ids in clear, card or payment data, prices. `{price}` in emails is the published price of the reported plan.
4. The server never enforces Plus and never answers "is this person a member" to the app.
5. Needs a signed-in account with an email address and an authenticated, idempotent endpoint in `packages/api` (D-080 effects). Sign-in ships in v1.0 (M14); the endpoint is not built.

### 6.7 The eight D-051 (main) open edges

| # | Edge | Spec default | Basis | Owner | Status |
|---|---|---|---|---|---|
| 1 | Do family letters count toward the 2 free letters? | Per account: each person's own keeps count on their own phone; a co-parent's letters count against the co-parent's own allowance, and the book owner's Plus covers a co-parent only inside one Apple Family | Code counts per phone (`countPresent` comment in `apps/mobile/src/lib/db/repos/ledger.ts`); M4 states the edge as open | Founder | Open: **DR-16** |
| 2 | What does a second child's book get without Plus? | Free; one pool of 2 letters across every book | D-082, D-083 (M2) | Founder (decided) | Answered |
| 3 | In-progress letter at the limit | Held on the phone, never lost; after Plus starts, the same Review shows and the person taps Keep | D-083; `review.tsx`, `plus-gate.tsx` | Founder (decided) | Answered |
| 4 | How entitlement is counted offline, reinstall, second device | On the device: largest of Keychain, local mirror and letters present; reinstall usually keeps the count; a second phone gets its own 2; accepted | D-083; `letter-ledger.ts` | Founder confirms; payments engineer | Spec default |
| 5 | Read together and the allowance | Read together is free with no counter | D-082, D-083 (M2) | Founder (decided) | Answered |
| 6 | First-run children and joined books | Every book is free to start; letters, not books, are counted | D-082, D-083 (M2) | Founder (decided) | Answered |
| 7 | Letters made offline past the limit | Cannot happen on an unmodified client (the gate is on the device). Sync ships in v1.0 (M14): the server accepts every letter and the ledger rises to letters present; nothing is refused, deleted or hidden (D-038 pattern) | D-080 (server never enforces); `lettersKeptFrom` | Payments engineer, data architect | Spec default |
| 8 | Lapsed members and trial-ineligible wording | Lapsed sheet says Plus has ended and every letter stays; our text never says "free trial"; Apple shows trial only to the eligible | D-083 copy rule; `keepGate.lapsedBody` | Content; **[Counsel]** reviews | Spec default |

### 6.8 Review notes (DR-08)

Draft for F21 to paste into App Store Connect. Guideline 3.1.2(a) asks for ongoing value (R4 section 5); D-051 (main) asks the notes to describe a freemium model with 2 free letters and existing letters staying open.

- Plus is an auto-renewable subscription. Each account keeps its first 2 letters free. After that, keeping each new letter to a child's book needs Plus. A family adds letters month after month as the child grows; that is the ongoing value.
- Reading, playing recordings, export, starting books for more children and Read together are free and never ask for Plus. Every letter already kept stays readable, playable and exportable if Plus ends.
- How to see it: answer Yes to 18 or older, add a child, keep two letters, record a third and tap Keep. The Keep sheet opens; See Plus opens Apple's subscription view. Settings, Plan has Redeem a code, Restore purchases, Manage subscription and Request a refund, all Apple's sheets. No account with us is needed.
- Remote config can only raise the number of free letters (`freeLettersAllowance`, default 2); the sheet, triggers and prices are never server-driven.

The current notes in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 still describe Add a child and Read together gates and must be replaced (gap, F14-REQ-031).

## 7. Requirements and acceptance criteria

Build: **Built** (file) means the code exists on `origin/develop` and unit tests pass in CI; none has run on a real iPhone (M13). **Partly built** names what is missing. **Not built** means no code.

| ID | P | Requirement | Acceptance criteria | Source | Build |
|---|---|---|---|---|---|
| PRD-REQ-024 Rev (D-082, D-083) | P0 | The first 2 letters kept per account are free, one pool across every book; after that, Keep needs Plus. Spoken, typed, private and voice-without-words letters all count; quiet-day marks and drafts never count. Enforced on the device only | Given 0 or 1 letters kept and no Plus, Then `decideKeepLetter` returns `allow free_letters`. Given 2, Then `offer keep_letter`. Given Plus on, Then `allow plus_own` at any count | M1, D-080 (no server enforcement) | Built: `packages/core/src/plan.ts`, `apps/mobile/src/lib/billing/gates.ts`, `apps/mobile/src/app/review.tsx`; tests `packages/core/test/plan.test.ts`, `apps/mobile/test/billing-ledger.test.ts` |
| PRD-REQ-025 Rev (D-083) | P0 | A letter at the gate is held, never lost: the gate runs after the recording is hashed and before anything is saved; the draft stays exactly as it was; the person taps Keep after Plus starts | Given a Free phone with 2 kept, When Keep is tapped, Then 0 letters are written, the draft row and audio file are byte-identical, and Tonight shows the draft card. Given Plus then starts, When Keep is tapped twice, Then exactly 1 letter exists | M1, constitution | Built: `review.tsx` (`keepNeedsPlus`), `plus-gate.tsx`; tests `[never lose a recording]`, `[Keep after Plus starts saves once]`. Device check D-1, D-9 not run |
| PRD-REQ-026 | P0 | Existing letters stay readable, playable and exportable for never-subscribed and lapsed accounts; those paths never consult Plus | Given a lapsed fixture with StoreKit stubbed to throw, Then read, play, export and delete succeed with 0 Plus UI | D-051 (main) item 3, LEGAL-REQ-050 | Partly built: `FreeForever` makes a gate on these uncompilable (`plan.ts`); the E2E run (BL-221) is blocked |
| C-REQ-021 Rev (D-082, D-077) | P0 | Products `plus.monthly` ($4.99, 1-month free introductory offer) and `plus.annual` ($49.99, 2-month free introductory offer) in one group "Plus", same level, US only, Family Sharing on, Billing Grace Period 16 days for all renewals | Given the App Store Connect checklist, Then both products match. Given `PLUS_PRODUCT_IDS` and `storekit/EarlyLetters.storekit`, Then they match (unit test) | M3, D-048, R4-S17 | Partly built: `apps/mobile/src/lib/billing/config.ts`, StoreKit file. App Store Connect setup is founder work (BL-103, FT-09). $49.99 price point availability unverified |
| C-REQ-020 Rev | P0 | Restore: entitlements appear at first launch after install; Restore calls `sync()` only on a tap | Given an annual subscriber on a second iPhone, When Restore is tapped, Then "Plus is on." within 10 s in 99% of sandbox runs | C, R4-S8 | Built: `restorePurchases`; device check D-5 not run |
| LEGAL-REQ-048 | P0 | Manage subscription in one tap, nothing in front of Apple's sheet | Given a subscriber, Then Apple's sheet presents within 500 ms; on a Mac, the web page opens | Legal, R4-S9 | Built: `manageSubscription`; device check D-4 not run |
| C-REQ-029 Rev | P0 | Request a refund opens Apple's refund sheet for the person's own purchase; hidden for family-shared Plus; a refund changes no letter | Given a family-shared fixture, Then no refund row | C, R4-S4 | Built: `plus.tsx` (`ownPurchase`), `requestRefund` |
| C-REQ-027 | P0 | Grace keeps Plus on; billing retry turns it off; Plan shows the payment line | Given a grace fixture, Then the Keep gate allows and `plan.grace` shows | D-048 | Built: `plan.logic.ts`, `plus.tsx` |
| PRD-REQ-027 Rev (D-052 (main)) | P0 | Redeem a code: a row in Settings > Plan and a link on the Keep sheet open Apple's offer code sheet; Plus turns on through the listener; no code system of ours; an offer-code member is a member | Given a sandbox offer code, When redeemed, Then Plus is on without a restart and `offer_code_redeemed` fires once | M5 | Built: `actions.ts` `redeemOfferCode`, native `presentOfferCodeRedeemSheet`, `plus.tsx`, `plus-gate.tsx`. Not run on a device (D-10). Codes exist only after Ready for Sale (BL-344). Counsel wording on conversion **[Counsel]** |
| C-REQ-024 Rev (M6) | P0 | Acknowledgment after purchase: sheet with terms, first charge date, price after, cancel-by date and how to cancel, with Save a copy through the share sheet; the same text in Settings > Plan; plus the `trial-started` or `plus-started` email once the status report lands | Given a trial start, Then the sheet shows within 2 s with all 5 items, and Save a copy opens the share sheet with that text | BL-342, D-080, in-app-disclosures section 3 | Not built |
| C-REQ-025 Rev (M6) | P0 | Trial reminders on the phone per 6.6 (notification and card) and by email | Given an annual trial ending at `E`, Then one notification inside `[E-21d, E-16d]` and one inside `[E-5d, E-4d]`, both 09:00 to 20:00 local. Given renewal turned off, Then 0 pending after the next foreground | D-022, BL-342, D-080 | Not built |
| C-REQ-026 Rev (M6) | P0 | Renewal reminders: annual long and short; the annual reminder for monthly plans; on the phone and by email | Given an annual renewal on 1 March, Then notifications inside `[29 Jan, 30 Jan]` and `[21 Feb, 23 Feb]` | D-022, BL-342, D-080 | Not built |
| PRD-REQ-003 Rev (M6) | P0 | The phone's reminder schedule is computed on the device from the StoreKit snapshot; windows are data in `packages/core`; nothing outside a hard window | Given the clock-controlled planner test over a synthetic year (monthly, annual, both trials, cancel, DST in March and November, leap day, 31 and 32 day trials, birthday in window), Then every reminder lands inside its window | BL-342 | Not built |
| LEGAL-REQ-049 Rev (D-081) | P0 | Consent facts on the first report after a purchase: product, offer type, Subscription Terms version shown, time; one record per original purchase; life of account plus 3 years; pseudonymised at deletion; no transaction id in clear | Given a purchase, Then exactly 1 consent record with those 4 facts and no transaction id, receipt or price | D-081 **[Counsel]** 17602(a)(6) | Not built |
| C-REQ-019 | P0 | Account deletion while subscribed shows that billing continues through Apple, with Manage subscription, before the final confirm | Given an active purchased subscription, Then the manage step precedes the confirm | C, LEGAL-REQ-029 | Built, switch off in release profiles: `apps/mobile/src/app/settings/delete-account.tsx` (BL-220) |
| PRD-REQ-015 Rev (M2) | P0 | Books for more children are free; the server never enforces Plus on `create_child` | Given a Free phone with 1 book, When Add a child, Then no gate | M2 | Built: client (`add-child-form.tsx`); server: `supabase/migrations/20261004000000_plus_on_device_only.sql` (pending, not yet applied) |
| PRD-REQ-020 Rev (M2) | P0 | Read together has no session limit and no counter | As F10 | M2 | Built: `read-together.tsx` |
| PRD-REQ-017 Rev | P0 | Business purchase totals come only from App Store Connect; server aggregates hold no purchase data | Given the BL-024 aggregate job, Then it reads no status or consent table | B10, D-080 | Built for today (no billing table exists) |
| C-NFR-002 Rev | P0 | Plus usable within 2 s of Apple's sheet closing (p95); purchase error rate under 1% | Given 50 sandbox purchases, Then 48 or more show Plus within 2 s | C | Partly built: `presentPlusStore` re-reads after close; not measured on a device |
| F14-REQ-001 | P0 | Apple's `SubscriptionStoreView` on iOS 17 and later, neither plan preselected, Terms and Privacy pointed at earlyletters.com, Restore visible, our text above the plans | Given a dev build with the StoreKit file, Then 2 plans with prices and trials show, no plan is selected, and Terms opens `https://earlyletters.com/terms` | D-053 | Built: `modules/scribe-store/ios/PlusStoreSheet.swift`, `actions.ts` `storeSheetOptions` (BL-216). Not run on a device |
| F14-REQ-002 Rev | P0 | Our native module `scribe-store` provides every StoreKit call: entitlements, statuses, transaction listener, store view, sync, manage, offer codes, refund. The listener starts at launch before any route renders (`expo-iap` is removed) | Given a transaction left unfinished by a kill, When the app relaunches, Then Plus is on before Tonight finishes loading | D-053, BL-215 | Built: `modules/scribe-store/ios/ScribeStoreModule.swift`, `plan-store.ts` `startPlus`, `_layout.tsx`. Not run on a device |
| F14-REQ-003 | P0 | Plan state from `currentEntitlements` and subscription statuses; states trial, active, grace, billing_retry, expired, refunded, revoked; a cached snapshot keeps Plus on offline while the period is paid; own purchase shown before a family-shared one | Given the fixtures in `billing-plan.test.ts`, Then `planFromSnapshot` and `planActive` match | C-NFR-004 | Built: `plan.logic.ts`, `plan-store.ts` (BL-215) |
| F14-REQ-004 Rev | P0 | Environment rule: production transactions count; sandbox and Xcode transactions count too, marked `isTester`, because a verified sandbox transaction exists only in TestFlight, development builds and App Review, which buys in the sandbox | Given a sandbox fixture, Then Plus is on with `isTester` true | D-053; App Review buys in the sandbox (`plan.logic.ts` note) | Built: `plan.logic.ts`; test "sandbox (TestFlight, App Review) and Xcode purchases count on the device" in `billing-plan.test.ts` |
| F14-REQ-005 | P0 | Plan cache: the last snapshot in device settings (`plus.cache`, L2), read synchronously at launch; rewritten on change or once a day | Given airplane mode after purchase, Then `getPlan()` reports Plus on at launch | TDD 08 I-2 | Built: `plan-store.ts`, `config.ts` `PLAN_CACHE_KEY` |
| F14-REQ-006 | P0 | Family Sharing: a family-shared transaction turns Plus on; Plan says so; no refund row; no reminders and no status report from that phone | Given `ownership` familyShared, Then Plus on, refund row absent, 0 plan reminders, 0 status reports | D-080 rules, DR-03 | Partly built: Plus, Plan line, refund row built; reminder and report rules wait for BL-342 and the status report |
| F14-REQ-007 Rev | P1 | The Family Sharing line shows only when the product is family shareable | Given a product not shareable, Then the line is absent | R4-S18 | Partly built: `billingCopy.store.family` is always passed (`storeSheetOptions`); correct while both products have Family Sharing on |
| F14-REQ-008 Rev (M6) | P0 | Plan reminders on the phone per 6.6 are local notifications with their own source marker, at most 4 pending, only for `purchased` ownership | Given an annual trial purchase, Then 2 trial reminders are pending and 0 letter reminders on those days | BL-342, F13-REQ-011 | Not built |
| F14-REQ-009 | P0 | Reminder wording holds whether or not the person cancelled outside the app; states date, published price, cancel-by date and how to cancel; no child name, no offer | Given every reminder string, Then it contains the cancel route and "If you have already cancelled, there is nothing to do."; no `{child}` | D-080 rules, LEGAL-REQ-054 | Partly built: email copy exists; phone copy not written |
| F14-REQ-010 | P0 | In-app plan cards per 6.6, shown even when notifications are off | Given notifications denied and an annual trial 18 days from `E`, Then the card shows on Tonight and in Plan | BL-342 | Not built |
| F14-REQ-011 Rev (D-081) | P0 | The consent record names the Subscription Terms version shown, taken from a build-time constant that changes when any `billingCopy.store` or Subscription Terms text changes | Given a change to `billingCopy.store.renewal`, Then the version changes in CI | D-081 | Not built |
| F14-REQ-012 | P0 | The store tables and Plus functions are dropped and `create_child` never checks Plus | Given the migration applied after the pending pack, Then `npm run test:db` passes and `select to_regclass('public.store_subscriptions')` is null | D-053 | Built: `supabase/migrations/20261004000000_plus_on_device_only.sql`, pending apply (`.github/migrations-applied.txt` lists two files) |
| F14-REQ-013 | P0 | StoreKit lives only in `lib/billing` and `modules/scribe-store`; the old `store.ts` stubs and `FREE_READ_TOGETHER_SESSIONS` are gone | Given a repo grep, Then 0 call sites of `newChildNeedsPlus` and `FREE_READ_TOGETHER_SESSIONS` | TDD 08 2.4 | Built (commit 71070c4) |
| F14-REQ-014 | P0 | No purchase data leaves the phone except the D-080 status fields and D-081 consent facts | Given a CI grep over `apps/mobile/src` and the sandbox network capture, Then no request body, log, analytics event or crash report carries a transaction id, receipt, JWS, price or `appAccountToken` | D-080, B10 | Partly built: the native module passes no ids to JS (`types.ts`); CI grep not written |
| F14-REQ-015 | P0 | Purchases pass no `appAccountToken` | Given the native module, Then no token argument and no token crosses into JS | D-053 | Built: `modules/scribe-store/types.ts` note |
| F14-REQ-016 Rev (M1, M6) | P0 | Lapse shows no card and no push from the app: the Plan line and the lapsed Keep sheet wording carry it; the `plus-ended` email follows once the status report exists | Given a lapse, Then 0 local notifications and the next gated Keep shows `keepGate.lapsedBody` | D-080, CATALOG 7 | Built for the app; email not built |
| F14-REQ-017 | P0 | One string set says what Plus adds, and the Subscription Terms say the same | Given `billingCopy.store.features` and `docs/legal/subscription-terms.md` "What Plus adds", Then they match (content test) | Apple 3.1.2(c) | Partly built: app copy is right (`rules.test.ts` D-085 and D-082 case); Subscription Terms 1.4.0 still lists Read together and more books, and $3.99 and $29.99 **[Counsel]** Q-C10 |
| F14-REQ-018 | P0 | Remote config `freeLettersAllowance` may only raise the allowance: invalid or lower values fall back to 2; at most 100 | Given 0, 1, 1.5, "two" or missing, Then 2. Given 5, Then 5. Given 1000, Then 100 | M1, B14 | Built: `freeLettersFrom` in `plan.ts`; `effectiveFreeLetters` in `packages/api/src/remote-config.ts`; wired in `apps/mobile/src/app/_layout.tsx` |
| F14-REQ-019 | P0 | The purchase view opens only from See Plus on the Keep sheet or See what Plus adds in Settings > Plan (6.4) | Given a placement test over every screen with a Free user, Then 0 store views open outside those two | C-REQ-023 | Built by absence (only `plus-gate.tsx` and `plus.tsx` call `presentPlusStore`); placement test not built |
| F14-REQ-020 | P0 | After reinstall, plan reminders are replanned from StoreKit on first launch | Given an active annual plan and a reinstall, Then the next renewal reminders are pending after first launch | F13-REQ-017 | Not built |
| F14-REQ-021 | P1 (later) | Price-increase notice; until it exists, only Apple's opt-in consent flow is used for any increase | Given any price change, Then App Store Connect keeps existing subscribers' price or uses Apple's consent flow | D-080 rules, Terms 14.8 | Not built (later) |
| F14-REQ-022 | P0 | Only `keep_letter`, `backup_upload` and `theme_extra` can be gated; v1.0 calls only `keep_letter` | Given a repo grep, Then `decide(` and `decideKeepLetter(` have no caller outside `lib/billing/gates.ts` and `review.tsx` | M1, M2 | Built: `GatedFeature`, `NO_OVERLAP` in `plan.ts` |
| F14-REQ-023 | P0 | The ledger never decreases: the gate uses the largest of the Keychain item, the local mirror `letters.keptEver` and letters present; a kept letter is counted in the same transaction as its save, once per id; launch heals every copy to the largest | Given each case in `billing-ledger.test.ts` (reinstall, restore, purge, delete, undo, move, double record), Then the count matches. Given a kill during save, Then letter, draft removal and count commit together or not at all | M1 | Built: `letter-ledger.logic.ts`, `letter-ledger.ts`, `letter-ledger.native.ts`, `db/repos/ledger.ts`, `store.ts` `saveLetterFromDraft`, `_layout.tsx` `startLetterLedger`. Device checks D-7, D-8 not run |
| F14-REQ-024 | P0 | Deleting a letter never gives a free letter back; restoring from Recently deleted never counts twice | Given 2 kept, 1 deleted, When a new letter is kept, Then the gate offers Plus. Given a restore, Then the count is unchanged | M1, D-085 | Built: tests "delete, undo, restore..." and "deleting a letter and writing another" |
| F14-REQ-025 | P0 | The ledger stores only a version, a count and up to 25 recent letter ids; the Keychain item stores only the count; no device id, timestamp or content; this-device-only, never in a backup | Given the stored values, Then their keys are exactly `v`, `n`, `recent` (mirror) and `v`, `n` (Keychain) | Privacy rules (CLAUDE.md) | Built: test "holds nothing but a version, a count and letter ids" |
| F14-REQ-026 | P0 | Erase everything resets the ledger (Keychain item and mirror) | Given Erase everything completes, When a letter is kept, Then it is free letter 1 | M1, D-083 | Partly built: `eraseLetterLedger()` in `gates.ts`, tested; no caller and no Erase everything flow yet (Delete account is built, switch off in release profiles until M14 is applied). F17 owns the surface |
| F14-REQ-027 | P0 | One calm line after the second free letter; no counter anywhere | Given the second free letter kept with allowance 2, Then the saved card shows `keepGate.secondFreeNote` once. Given any screen, Then no string states letters left (content test) | M1 | Partly built: `review.tsx` (`secondFree`), `billingCopy.keepGate.secondFreeNote`. No content test bans a letters-left count yet (`rules.test.ts` bans gap and comparison words only) |
| F14-REQ-028 | P0 | The Keep sheet says the letter is safe before any offer, offers See Plus, Keep it here for now and Redeem a code, uses the lapsed wording for lapsed members, and never names a price or trial | Given the sheet, Then `heldNote` renders before the buttons, and no string contains "$", "trial" or "free months" | M1, M5, D-083 | Built: `plus-gate.tsx`, `billingCopy.keepGate` |
| F14-REQ-029 | P0 | Books for more children and Read together have no Plus gate | Given a Free phone, When Add a child and 5 Read together sessions run, Then 0 Plus sheets and 0 StoreKit calls | M2 | Built: `add-child-form.tsx`, `read-together.tsx`; device check D-3 not run |
| F14-REQ-030 | P1 | Display names "Plus Monthly" and "Plus Annual" everywhere a plan is named | Given App Store Connect and the Plan screen, Then the annual plan reads "Plus Annual" | D-077 | Partly built: ops doc step 4 says display name "Plus Yearly"; Plan shows "Yearly" (`billingCopy.plan.yearly`) |
| F14-REQ-031 | P0 | Review notes describe the membership per 6.8 | Given the notes in App Store Connect, Then they name 2 free letters, the Keep gate and that existing letters stay open, and do not mention Add a child or Read together as Plus | D-051 (main), DR-08 | Not built: ops doc step 8 notes are stale |
| F14-REQ-032 | P0 | Status-only report: plan, trial end date, renewal date, cancelled flag; on purchase in the app and at launch when changed; only `purchased` ownership; authenticated and idempotent; deleted with the account | Given a purchase, Then exactly one report reaches the endpoint with those 4 fields. Given a family-shared phone, Then 0 reports. Given a retried request, Then one stored status | D-080 | Not built: no endpoint in `packages/api`, no table, no client call; v1.0 per M14 |
| F14-REQ-033 | P0 | Reminder emails from the status record per `docs/emails/CATALOG.md` section 7 | Given a reported annual trial, Then `trial-ending-long` sends inside its window; given a cancelled flag, Then pending trial and renewal emails for that period are skipped | D-080 | Partly built: copy in `packages/content/src/emails/billing.en.ts`, templates in `packages/emails/src/templates/billing/`; no scheduler or sender |
| F14-REQ-034 | P0 | The development pass on the Keep sheet exists only in development builds | Given a preview or production bundle, Then `onContinueDev` is unreachable (`devShortcutsAllowed` false) | BL-117 | Partly built: guard exists; release-bundle grep in BL-117 not built |
| F14-REQ-035 | P1 | `readTogetherFreeSessions` and `effectiveFreeSessions` leave `packages/api/src/remote-config.ts` | Given a grep, Then 0 hits | M2 | Not built |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| StoreKit transactions and statuses | L3 | Apple and the device | Apple, this app on this device | Apple's |
| Plan cache `plus.cache` (product id, dates, flags; no ids) | L2 | Device settings | This device | Replaced on change; wiped with the app |
| Letter ledger mirror `letters.keptEver` (version, count, up to 25 letter ids) | L2 | Device database | This device | Until Erase everything; comes back with a device backup |
| Letter ledger Keychain item `earlyletters.letters.keptEver` (version, count) | L2 | iOS Keychain, this device only, after first unlock | This app | Usually survives app deletion (not guaranteed by Apple); removed by Erase everything |
| Held letter | L4 | Device draft row and audio file (F04, F08) | This device | Until kept or deleted |
| Pending plan reminders (date, price, no name) | L2 | iOS notification store | This device | Until fired or replaced |
| Subscription status (plan, trial end, renewal date, cancelled flag) | L3 [A] | Postgres (not built) | Server email scheduler; owner | Deleted with the account (D-080) |
| Consent record (product, offer type, terms version, time) | L3 | Postgres (not built) | Owner; service role | Life of account plus 3 years, pseudonymised at deletion (D-081) |

- **Never on our servers:** receipts, signed transactions, transaction ids in clear, card or payment data, prices, the ledger count.
- **Privacy label.** The status report adds a purchase-derived fact to our servers; the "Purchases" data type in `docs/legal/app-store-privacy-labels.md` needs a fresh answer **[Counsel]** Q-C9.
- **Data map.** The status and consent tables need rows in `docs/legal/DATA_CLASSIFICATION.md` and `DELETION_AND_EXPORT_SPEC.md` when built.

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Keep gate decision | Under 50 ms on iPhone SE 3, including the ledger read [A] | Yes |
| Keep sheet to Apple's view showing prices | Under 1 s with StoreKit's cache; `unavailable` after a failure, never a remembered price (C-NFR-007) | Yes |
| Plus usable after purchase | p95 2 s after Apple's sheet closes | Yes |
| Restore | 99% within 10 s (C-NFR-003) | Yes |
| Reminder planner | Under 20 ms; 4 or fewer pending | Yes |
| Status report | One request per change; idempotent; p95 per ADR 0017 | Yes |
| Accessibility | Keep sheet and Plan at AX5 with no truncation; VoiceOver order per F14-U37 (C-NFR-006, LEGAL-REQ-051) | Yes |
| Shared rules | `06-nfr.md` | |

## 10. Analytics

Device events only, after opt-in. Money (trials, conversions, renewals, refunds, churn) comes only from App Store Connect.

| Event | In catalogue (`packages/analytics/src/catalog.ts`, schema 4) | Wired | Properties | Question |
|---|---|---|---|---|
| `free_allowance_reached` | Yes | `review.tsx` | `allowance` | How fast do people use the 2 free letters? |
| `keep_gate_shown` | Yes | `review.tsx` | `letters_kept`, `allowance`, `lapsed` | How often is the gate met, and by lapsed members? |
| `letter_held` | Yes | `review.tsx` | `letters_kept` | How often do people hold rather than pay? |
| `plus_started_from_gate` | Yes | `plus-gate.tsx` | `letters_kept` | Gate to Plus |
| `offer_code_redeemed` | Yes | `plus-gate.tsx`, `plus.tsx` | none | Do codes work? |
| `plus_offer_viewed`, `plus_offer_closed` | Yes | `plus-gate.tsx`, `plus.tsx` | `trigger` (`keep_letter`, `settings`), `outcome` | Which entry brings people to Apple's view? |
| `plan_changed` | Yes | `lib/analytics/observers.ts` | `from_state`, `to_state`, `period`, `ownership` | Lifecycle seen on the device |
| `restore_result` | Yes | `plus.tsx` | `outcome` | Restore health |
| `plan_notice_shown` | No (new, BL-342) | n/a | `kind`, `channel` | Do reminders reach people? Never dates |

`docs/analytics/TRACKING_PLAN.md` section 9 still lists `plus_offer_viewed`, `plus_offer_closed` and `restore_result` as "to wire"; the code wires them.

## 11. How we build it (with the architect)

| Part | Files | State |
|---|---|---|
| Rules | `packages/core/src/plan.ts` | Built. `decide()` keeps `backup_upload` and `theme_extra` for later |
| Ledger | `apps/mobile/src/lib/billing/letter-ledger*.ts`, `apps/mobile/src/lib/db/repos/ledger.ts`, `store.ts` | Built |
| Gate | `apps/mobile/src/lib/billing/gates.ts`, `review.tsx`, `components/child/plus-gate.tsx` | Built. The sheet lives under `components/child/` for history; moving it to `components/plus/` is optional |
| Store module | `apps/mobile/modules/scribe-store/` (Swift `ScribeStoreModule`, `PlusStoreSheet.swift`) | Built (`expo-iap` removed, a66376a) |
| Plan state and actions | `apps/mobile/src/lib/billing/plan.logic.ts`, `plan-store.ts`, `actions.ts`, `use-plan.ts` | Built |
| Plan screen | `apps/mobile/src/app/settings/plus.tsx` | Built; terms row and delete note to add |
| Reminder planner | New `packages/core/src/plan-notices.ts` (pure; windows as data) | Not built (BL-342) |
| Reminder scheduling | New module under `apps/mobile/src/lib/billing/` using `expo-notifications` (installed) with its own source marker | Not built (BL-342) |
| Acknowledgment sheet and Save a copy | New component; React Native `Share` | Not built (BL-342) |
| Status report | New endpoint and contract in `packages/api`; new migration for status and consent tables; client call in `lib/billing` | Not built; v1.0 per M14 (needs sign-in, which is built behind the switch) |
| Reminder emails | New function under `supabase/functions/` reading the status table; templates in `packages/emails/src/templates/billing/` | Templates exist; scheduler not built |
| Erase everything | F17 surface calling `eraseLetterLedger()` | Not built |

**Sequencing (ROADMAP 2.1).** Week 2 (12 to 16 Oct): BL-342 planner and reminders; StoreKit sandbox device spike (FT-22). Week 3 (19 to 23 Oct): device checks D-1 to D-12; counsel comments Fri 23 Oct. Feature freeze Mon 26 Oct with BL-342 in. If the StoreKit sandbox is not green by Fri 23 Oct, ROADMAP section 6 ships v1.0 free and adds Plus in 1.0.1. The status report and emails are v1.0 (M14); `08-delivery.md` re-plans their place.

**Riskiest unknowns.**
1. Purchases and offer codes behave on a real iPhone as in the StoreKit file (D-1 to D-12 never run).
2. Keychain survival after deleting the app (D-7; Apple gives no guarantee).
3. Whether $49.99 exists as a price point and which trial durations App Store Connect offers (ops doc step 4, U).
4. The status report and emails ship at v1.0 (M14); the risk is the date (R-16).

## 12. Work packages

Numbers keep their 3 Oct meaning where the work still exists; 15 to 19 are new.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F14-01 | `expo-iap` spike | | | | Superseded: `expo-iap` removed (a66376a); `scribe-store` instead (BL-210) | Done |
| WP-F14-02 | Reminder planner, pure | Payments engineer | New `packages/core/src/plan-notices.ts` and test | none | `[PRD-REQ-003]` synthetic year; `[C-REQ-025]`, `[C-REQ-026]` | Agent. BL-342 |
| WP-F14-03 | Drop store tables and server Plus checks | Data architect | `supabase/migrations/20261004000000_plus_on_device_only.sql` | none | `[F14-REQ-012]`; applied in staging (FT-10) | Built; human apply |
| WP-F14-04 | Native subscription view module | Payments engineer | `apps/mobile/modules/scribe-store/` | none | `[F14-REQ-001]` on a device | Built (BL-216); device check open |
| WP-F14-05 | Device plan module | Payments engineer | `apps/mobile/src/lib/billing/` | none | `[F14-REQ-002]` to `[F14-REQ-005]`, `[F14-REQ-013]`, `[F14-REQ-015]` | Built (BL-215) |
| WP-F14-06 | Acknowledgment sheet with Save a copy; Plan terms row and delete note | Payments engineer, content | New component under `apps/mobile/src/components/plus/`; `apps/mobile/src/app/settings/plus.tsx`; `billing.en.ts` | none | `[C-REQ-024]` phone half, `[F14-REQ-011]` | Agent. BL-342 |
| WP-F14-07 | Reminder scheduling and cards | Payments engineer | New file under `apps/mobile/src/lib/billing/`; card component | WP-F14-02 | `[F14-REQ-008]`, `[F14-REQ-010]`, `[F14-REQ-020]`, `[F14-REQ-006]` reminder half, `[F13-REQ-015]` | Agent. BL-342 |
| WP-F14-08 | Settings > Plan | Mobile engineer | `apps/mobile/src/app/settings/plus.tsx` | none | `[LEGAL-REQ-048]`, `[C-REQ-027]`, `[C-REQ-029]`, `[PRD-REQ-027]` | Built (BL-219); new rows in WP-F14-06 |
| WP-F14-09 | Copy: "Plus Annual", reminder strings | Content | `packages/content/src/features/billing.en.ts` | none | `[F14-REQ-030]`, `[F14-REQ-009]`; counsel sign-off recorded | Agent plus counsel |
| WP-F14-10 | Account deletion billing step | Mobile engineer | `apps/mobile/src/app/settings/delete-account.tsx` | none | `[C-REQ-019]` | Built (BL-220) |
| WP-F14-11 | Keep-and-leave E2E | QA engineer | `apps/mobile/e2e/` | BL-275 | `[PRD-REQ-026]` | Agent. BL-221 (blocked) |
| WP-F14-12 | Device run of the sandbox checklist | Founder, payments engineer | `docs/qa/evidence/` | BL-103, FT-09 | D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11 signed with date and build; a network capture | Human. BL-222 |
| WP-F14-13 | Review notes and ops doc | Founder, payments engineer | `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` steps 4, 8, 11 | none | `[F14-REQ-031]`; check ids unique (step 11 repeats D-7 to D-10) | Human |
| WP-F14-14 | Analytics | Analytics engineer | `packages/analytics/src/catalog.ts` | WP-F14-07 | Membership events built (schema 4); `plan_notice_shown` added | Agent |
| WP-F14-15 | Status report: contract, endpoint, migration, client | Payments engineer, data architect | `packages/api`; new migration; `apps/mobile/src/lib/billing/` | Sign-in on (M14); BL-330, BL-347, BL-322, BL-331 merged (R-17) | `[F14-REQ-032]`, `[LEGAL-REQ-049]` | Agent, `approve-migration` |
| WP-F14-16 | Reminder email scheduler | Payments engineer | new function under `supabase/functions/` | WP-F14-15 | `[F14-REQ-033]` window tests | Agent |
| WP-F14-17 | Remove the Read together session config | Payments engineer | `packages/api/src/remote-config.ts` and test; `apps/mobile/src/lib/billing/config.ts` | none | `[F14-REQ-035]` | Agent |
| WP-F14-18 | CI grep for purchase data and the dev pass | Security engineer | CI config | none | `[F14-REQ-014]`, `[F14-REQ-034]` | Agent. BL-117 |
| WP-F14-19 | Erase everything calls the ledger reset | Mobile engineer | F17 surface | F17 design | `[F14-REQ-026]` | Agent |

## 13. Open questions and assumptions

**Counsel (not legal advice)**

| Q | Question | Needed by | What changes |
|---|---|---|---|
| Q-C1 | With D-080, reminders go by email when a status report exists and by local notification and card on the purchasing phone. Is that enough for 17602(b)(1) and (b)(2) for a person who never signs in (no email)? Sign-in ships in v1.0 (M14) but stays optional before the account step. | Fri 23 Oct (FT-33) | DR-17 (answered by M14) |
| Q-C2 | Does the acknowledgment sheet with Save a copy meet 17602(a)(3) before the email exists? | Fri 23 Oct | C-REQ-024 |
| Q-C3 | Is the D-081 consent record adequate proof under 17602(a)(6)? | Fri 23 Oct | LEGAL-REQ-049 |
| Q-C4 | Does Apple's view with our text above the plans, and no price or trial typed by us, meet "clear and conspicuous, close to the consent request"? Is a trial timeline of ours needed (BL-342 asks; D-083 forbids)? | Before BL-222 | 6.5 |
| Q-C5 | Is "If you have already cancelled, there is nothing to do." acceptable on a reminder that cannot see a cancel made outside the app? | Fri 23 Oct | F14-REQ-009 |
| Q-C6 | Does 17602(h)'s annual reminder apply to monthly plans? | Fri 23 Oct | Anniversary reminder |
| Q-C8 | Is a 1-month trial outside 17602(b)(1)? | Fri 23 Oct | Trial week reminder becomes courtesy |
| Q-C9 | Privacy label "Purchases" with the status report | Before submission | `app-store-privacy-labels.md` |
| Q-C10 | Subscription Terms 1.4.0 and the Q-003 memo say "We do not email you about Plus" and list the old Plus contents and prices; D-080, D-082 and D-083 change all three | Fri 23 Oct | `docs/legal/subscription-terms.md`, `in-app-disclosures.md`, COUNSEL_PACKET Q8 |
| Q-C11 | Offer-code wording: the free period converts at the normal price unless cancelled (D-052 (main)) | Before codes are issued | Subscription Terms |

**Founder**

| Q | Question | Needed by | What changes |
|---|---|---|---|
| Q-F1 | DR-16: does a co-parent's letter count, and how does one membership reach a co-parent outside the Apple Family? Co-parent sharing ships in v1.0 (M14) | Fri 23 Oct | F11, edge 1 |
| Q-F2 | DR-17: ship the status report and emails at v1.0? **Answered by M14 (founder, 13 Oct): yes**, with sign-in on and the phone reminders as well | n/a | WP-F14-15, WP-F14-16 are v1.0 |
| Q-F3 | Confirm edge 4 default: a second iPhone gets its own 2 free letters; reinstall may give 2 more if the Keychain item is lost | Mon 26 Oct | None if confirmed |
| Q-F4 | Billing Grace Period for all renewals (ops doc default) or paid to paid only | FT-09 | App Store Connect |

| A | Assumption | How we validate |
|---|---|---|
| A1 | The Keychain item survives app deletion on iOS 17 and 18 in most cases | Device check D-7 |
| A2 | Purchases and offer codes in Apple's views reach the native listener | Device checks D-2, D-10 |
| A3 | The sandbox supports a Family Sharing test with two sandbox accounts | Device check D-6 |
| A4 | Few people keep letters on two iPhones | Support tags in C1 |
| A5 | Bypass by modified clients costs little (DR-04) | ASC trial starts against keep counts |

## 14. Sources

- Rulebook and decisions: `docs/prd/v2/_AUTHORING.md` section 3b (M1 to M6, M13); `git show origin/main:docs/DECISIONS.md` D-051, D-052; `docs/DECISIONS.md` D-053, D-077, D-080, D-081; code carrying D-082 and D-083 (commit 71070c4).
- V2: `03-goals-and-principles.md` section 1, principle 6, 4.2, 4.3; `05-feature-map.md` rank 16; `09-decisions-and-risks.md` DR-02 to DR-06, DR-08, DR-16, DR-17, R-06.
- PRD: `git show origin/main:docs/prd/PRD.md` 1.4 PRD-REQ-024 to -027, K-44, K-45; `docs/prd/C-habits-pricing-settings.md` C-REQ-019 to C-REQ-029, C-NFR-002 to -007, section 7.
- Code read 13 Oct 2026: `packages/core/src/plan.ts`; `packages/core/test/plan.test.ts`; `apps/mobile/src/lib/billing/` (`gates.ts`, `letter-ledger.logic.ts`, `letter-ledger.ts`, `letter-ledger.native.ts`, `plan.logic.ts`, `plan-store.ts`, `actions.ts`, `config.ts`, `index.ts`); `apps/mobile/src/lib/db/repos/ledger.ts`; `apps/mobile/src/lib/store.ts` (`saveLetterFromDraft`); `apps/mobile/src/app/review.tsx`; `apps/mobile/src/app/read-together.tsx`; `apps/mobile/src/app/settings/plus.tsx`; `apps/mobile/src/app/settings/delete-account.tsx`; `apps/mobile/src/app/_layout.tsx`; `apps/mobile/src/components/child/plus-gate.tsx`, `add-child-form.tsx`; `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/src/lib/reminders/scheduler.ts`, `planner.ts`; `apps/mobile/modules/scribe-store/` (`types.ts`, `ios/ScribeStoreModule.swift`); `apps/mobile/test/billing-ledger.test.ts`; `packages/content/src/features/billing.en.ts`; `packages/content/src/strings.en.ts` (`plus.*`, `tonight.draftWaiting`); `packages/api/src/remote-config.ts`; `packages/analytics/src/catalog.ts`; `packages/content/src/emails/billing.en.ts`; `packages/emails/src/templates/billing/`; `supabase/migrations/20261004000000_plus_on_device_only.sql`; `.github/migrations-applied.txt`.
- Ops and plans: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`; `docs/ROADMAP.md` 2.1 sections 0 to 3, 6, 7; `docs/BACKLOG.md` M8 (BL-036, BL-215, BL-216, BL-219 to BL-222, BL-342), BL-103, BL-117, BL-344.
- Email and analytics: `docs/emails/CATALOG.md` section 7; `docs/analytics/TRACKING_PLAN.md` sections 1, 9.
- Legal: `docs/legal/subscription-terms.md` 1.4.0; `docs/legal/in-app-disclosures.md` 1.4.0 section 3; `docs/legal/COUNSEL_PACKET.md` Q8; `docs/legal/memos/q-003-subscription-notices.md`; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-029, -046 to -050, -054.
- Research: `docs/research/competitors/us.md` sections 0 item 8, 3, 8, 9; R1 section 0 items 1, 6, 7 and section 4 (R1-S1 to S4, R1-S6, R1-S23, R1-S25, R1-S46, R1-S48, R1-S50, R1-S55, R1-S60, R1-S67); R2 section 0 item 3, themes T1, T2 (R2-S6); R3 section 4.3, section 7 (R3-S32 to S35); R4 sections 1, 5 (R4-S1, R4-S4, R4-S8, R4-S9, R4-S17); `docs/research/USER_RESEARCH.md` R16.
