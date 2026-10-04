# TDD 08: Payments and entitlements

Owner: staff engineer, payments and entitlements. Draft 1, 3 Oct 2026. Branch `develop`. Status: for founder, data architect (TDD 02), privacy (TDD 05) and counsel review.

> **Banner, 4 Oct 2026 (D-051, PRD 1.4).** Two things in this draft are out of date. (1) ADR 0013 (D-001) replaced RevenueCat with StoreKit 2 direct and App Store Server Notifications V2; read every RevenueCat mention as the App Store equivalent until this TDD is revised (not done here). (2) The model changed: Plus is the membership that unlocks the product, not an optional extra. The free version is the first 2 letters per account; adding new letters then needs Plus; letters already made stay readable, playable and exportable forever; one membership covers the book and family authors need none. Everything below that calls writing "free forever" or "never gated" predates this and is amended in place or by section 14, which holds the engineering TODO list. Open edges are listed in D-051 and section 14.3; none is decided here.

Reads: CLAUDE.md; PRD.md 1.2 (K-04, K-11, K-12, K-28, K-32, PRD-REQ-003, -015, -017, -020); PRD C (C-REQ-020 to -034, C-NFR-001 to -009); ADR 0007; subscription-terms.md 1.2.0; terms-of-service.md section 14; in-app-disclosures.md 1.2.0; memos/lawyer-1.md; ENGINEERING_REQUIREMENTS.md (LEGAL-REQ-029, -033, -046 to -050, -053, -054, -058); DATA_CLASSIFICATION.md; TRACKING_PLAN.md; `apps/mobile/src/lib/store.ts`, `read-together.ts`, `components/child/plus-gate.tsx`, `add-child-form.tsx`; TDD 01, 02, 05.

Labels used throughout: **Fact** (read in a repo file or a cited source), **Assumption** (believed, not verified; says what would verify it), **Rec** (my recommendation), **Risk**, **OQ** (open question with an owner). Vendor behaviour I could not verify in a source opened for this TDD is marked **Unverified** and has a sandbox test that settles it before launch.

---

## 0. Summary

1. **One pure rules engine decides every Plus gate.** `packages/core/src/plan.ts` exports `decide(input): Decision`, no I/O, under 1 ms. The things that are free forever (write, read, play a recording, export, family authors, download backed-up audio) are not members of the gated-feature type at all, so they cannot be gated by accident (LEGAL-REQ-050). The server repeats the two rules that cost us money or count books: `create_child` and backup upload. *Amended 4 Oct 2026 (D-051): "write" leaves the free-forever list for new letters only. Reading, playing a recording, export, download of backed-up audio and family authors' access to existing letters stay out of the gated type. See 14.1.*
2. **Plus is per account; books inherit it from any parent (K-28).** Schema follows TDD 02 section 2.5 (`billing_customers`, `entitlements`, `entitlement_events`, `book_entitlements`, `has_plus()`, `book_has_plus()`). I add three things: a purchase needs an account, contributors are never shown the Plus sheet (a contributor's Plus would cover no book), and books created offline while Plus was active are honoured at sync.
3. **RevenueCat is the source of truth; the webhook is only a doorbell.** Every webhook is deduplicated by event id, then the function re-reads the subscriber from the RevenueCat REST API and writes a snapshot. That makes it order-independent, so a late or duplicated event cannot do harm. A nightly reconcile catches any webhook that never arrived.
4. **The notice engine follows the strictest state window, not PRD C's day counts.** Annual renewal notices go at renewal minus 30 days 12 hours, and only inside the window from D-31 to D-30. The final trial notice goes at trial end minus 4 days 12 hours, not D-3. These are the same windows TDD 05 X-06 adopted. They conflict with LEGAL-REQ-047 and K-04 (sections 4.3 and 10).
5. **Nothing becomes unreadable when Plus ends.** A lapse, refund, grace expiry or a RevenueCat outage turns off extras only. Section 5 lists what happens to each feature. *Amended 4 Oct 2026 (D-051): unchanged for reading, playing and exporting existing letters; adding new letters now needs Plus after a lapse (section 5).*
6. **Premature for v1:** the trial-length experiment (needs about 3,300 trial starters), gifts (P1), lifetime (P2), Google Play (specified, not shipped), web codes, print (K-32), and any retention offer. The products and offerings are designed so each can be switched on without a schema change.
7. **Launch blockers I found in today's code:** a hard-coded, per-phone Read together count (`read-together.ts`); a dev bypass on the Plus gate that must be removed from release builds at compile time; `hasPlus()` and `isJoinedBook()` stubs; no server Plus rule; no webhook, notices or consent log.

---

## 1. Traceability

Status: **Met**, **Gap** (exists but wrong), **New** (not built), **Conflict** (two sources disagree; see section 9).

| Requirement | P | What this TDD builds | Section | Status today |
|---|---|---|---|---|
| C-REQ-021, K-28 | P0 | Products `el_plus_monthly_399`, `el_plus_annual_2999` -> entitlement `plus`, held per account; `book_has_plus` | 2, 3 | New (`hasPlus()` returns false) |
| PRD-REQ-015, K-12, BL-036 | P0 | `decide({feature:'start_book'})`; server `create_child` / `create_children_batch` Plus rule; first-run batch; joined books do not count | 2.3, 2.5 | Gap (client-only rule; `isJoinedBook` stub) |
| PRD-REQ-020, K-11 | P0 | Read together tries per Free book, from remote config `read_together_free_sessions`, counted at highlighted playback start, only in try mode | 2.3 | Gap (constant 3, per phone, counted at screen open) |
| C-REQ-022, LEGAL-REQ-046, in-app-disclosures s.3, K-31 | P0 | Paywall rules and disclosure contract | 6 | New (placeholder gate) |
| C-REQ-023 | P0 | Offer placement as triggers in the engine; never in first run, at launch, during recording or export, on a birthday; never to contributors | 2.3, 6 | Partial |
| C-REQ-024 to -026, PRD-REQ-003, LEGAL-REQ-047 | P0 | Notice engine with windows stored as data | 4.3 | New; Conflict C-1 |
| C-REQ-027 | P0 | Apple Billing Grace Period on; Plus continues during grace | 4.6 | New |
| C-REQ-028, C-NFR-008, LEGAL-REQ-050 | P0 | Lapse matrix; core paths never read entitlement | 5 | Met by absence; must be kept |
| C-REQ-029 | P0 | Refund: entitlement removed only; `beginRefundRequest` row | 4.5 | New |
| C-REQ-020, C-NFR-003 | P0 | Restore in Settings > Plan and on the Plus sheet; restore behaviour setting | 4.8 | New |
| C-REQ-019, LEGAL-REQ-029 | P0 | Delete account with active subscription: billing notice, manage link, RevenueCat subscriber delete | 4.9 | New |
| LEGAL-REQ-048 | P0 | Manage or cancel opens the store sheet in one tap; no retention offer | 4.4 | New |
| LEGAL-REQ-049 | P0 | `auto-renewal-terms` acceptance at purchase start and completion, reconciled to the transaction | 4.2 | New; Conflict C-4 |
| LEGAL-REQ-033, DATA_CLASSIFICATION s.2 | P0 | Retention: ARL proof 3 years or 1 year after the plan ends, whichever is longer; transaction ledger 7 years | 3.2 | New |
| LEGAL-REQ-053, -054 | P0 | Plan emails are transactional, no child names, no promotion; one plan push only (final trial notice) | 4.3 | New |
| LEGAL-REQ-058 | P0 | US storefront only; storefront country is the only location data kept | 3.1 | New |
| C-NFR-002 | P0 | Plus active p95 5 s after store success; reconcile 60 s; zero double grants | 7 | New |
| C-NFR-004 | P0 | Last known entitlement cached; extras fail open for payers, core never asks | 2.4 | New |
| C-NFR-006, LEGAL-REQ-051 | P0 | Paywall at AX5, VoiceOver reads price, trial and renewal together | 6 | New |
| C-NFR-007 | P0 | Plus sheet under 1 s with cached prices | 7 | New |
| C-NFR-009 | P0 | Remote config for tries and offer triggers, audited (TDD 01 3.9) | 2.3 | Gap (BL-022 undecided) |
| C-REQ-034, PRD-REQ-017, TRACKING_PLAN s.2 | P0 | Device events for offer and purchase; lifecycle numbers from RevenueCat and server aggregates | 12 | Catalogue exists; wiring new |
| C-REQ-030 (P1), -031 (P1), -032 (P2), -033 (P2) | P1/P2 | Gift, dormant-payer email, lifetime, web code: schema room only | 3.5 | Deferred |
| K-32 | P0 | No print code, products, copy or Stripe in v1 | 3.1 | Met (ADR 0007's print half is future) |
| ADR 0007 | | RevenueCat for all digital purchases | 3 | Accepted |

---

## 2. Entitlement model and rules engine

### 2.1 Concepts

| Term | Meaning | Source |
|---|---|---|
| Account Plus | The signed-in person holds the RevenueCat entitlement `plus`: active, in a trial, or in billing grace | K-28, C-REQ-021 |
| Book Plus | A book has Plus when any **parent** member holds Account Plus, or (P1) a gift is active on it | K-28 |
| Plus features in a book | Every member of a Plus book gets its Plus features there, contributors included | K-28 |
| Letter | A saved entry, spoken or typed (D-051). The unit of the free allowance. In-progress drafts are not letters until saved | D-051 |
| Free letter allowance | The first 2 letters per account (remote config `free_letters_allowance`, default 2, proposed key). What counts toward it (family letters, a second child's book, offline letters) is open, see 14.3 | D-051 |
| Started book | `children.created_by = me` and not deleted. Hidden books count. Books joined as co-parent never count | PRD-REQ-015 |
| First-run batch | Every child added together in the account's first create call or batch. All free, whatever their dates. They count as started books afterwards | PRD-REQ-015 |
| Try | One free Read together session in a Free book. The count comes from remote config (default 3) | PRD-REQ-020 |

**Rec (new rule R-1): a purchase needs an account.** Reasons: Plus is account-scoped (K-28). Backup needs the server. The ARL notices need an email address we can send to (Sign in with Apple's private relay is fine, PRD C s.11). The consent proof (LEGAL-REQ-049) is keyed by profile. A local-only user who taps a Plus feature sees the Keep-the-book sign-in sheet first, then the Plus sheet. **Risk:** Apple 5.1.1(v) objects to requiring a login for features that are not account-based. Our Plus features are account-based (cloud backup, cross-device, co-parent coverage), so I judge the risk low. The App Review notes should say so (Assumption; settled by the first review).

**Rec (new rule R-2): contributors never see the Plus sheet.** A contributor's own Plus covers only books they parent (K-28). A grandparent who bought Plus from the Read together gate would pay and get nothing in that book. In a Free book, contributors see a quiet line ("Read together is part of Plus for this book") with no purchase button. Gifts (P1) are the contributor's path.

**Rec (R-3): never offer Plus where it is already on.** If the book has Plus from the other parent, the gate never opens. Settings > Plan shows "Plus is on for {child}'s book" with no purchase row unless the viewer starts a book that is not covered.

### 2.2 The engine contract

File `packages/core/src/plan.ts`: pure TypeScript, no React Native, no clock reads (`now` is an input), no network. It sits next to `canCreateBook` from BL-036, which it absorbs.

```ts
/** Never gated. Not part of GatedFeature, so a gate on these cannot compile. */
export type FreeForever =
  | 'write' | 'read' | 'play_recording' | 'export' | 'family_authors'
  | 'invite' | 'download_backed_up_audio' | 'restore_backup' | 'delete';

export type GatedFeature = 'start_book' | 'read_together' | 'backup_upload' | 'theme_extra';

export type OfferTrigger =
  | 'chapter_complete' | 'second_child' | 'backup' | 'read_together' | 'themes' | 'settings';

export interface PlanView {           // what the device knows about one account's Plus
  state: 'none' | 'trial' | 'active' | 'grace' | 'expired' | 'refunded' | 'revoked';
  effectiveUntil: string | null;      // ISO; max(expires_at, grace_expires_at); null = lifetime (P2)
  verifiedAt: string | null;          // last time the server or SDK confirmed it
  environment: 'production' | 'sandbox';
  isTester: boolean;                  // profiles flagged for TestFlight sandbox purchases
}

export interface DecideInput {
  now: string;
  feature: GatedFeature;
  surface: 'first_run' | 'normal';    // first run never shows an offer (C-REQ-023, K-12)
  isBirthday: boolean;                // any book's birthday today, local date (C-REQ-023)
  signedIn: boolean;
  viewer: { roleInBook: 'parent' | 'contributor' | null; own: PlanView };
  book: { coveredByOtherParent: boolean; giftUntil: string | null } | null;
  startedBooks: number;               // non-deleted, created_by me, hidden included
  inFirstRunBatch: boolean;
  readTogether: { triesUsedInBook: number; freeTries: number };
}

export type Decision =
  | { kind: 'allow'; via: 'plus_own' | 'plus_book' | 'gift' | 'free_book' | 'first_run' | 'try'; triesLeft?: number }
  | { kind: 'offer'; trigger: OfferTrigger; needsSignIn: boolean }
  | { kind: 'quiet'; reason: 'contributor' | 'first_run' | 'birthday' | 'free_background' };

export function decide(input: DecideInput): Decision;
export function planActive(p: PlanView, now: string): boolean;
```

`planActive` rules (C-NFR-004, Rec):
- Production entitlements count. Sandbox ones count only when `isTester` (TestFlight uses sandbox receipts against the production backend).
- `trial`, `active` and `grace` count while `now < effectiveUntil`, or always if `effectiveUntil` is null (lifetime).
- Stale cache: if `verifiedAt` is older than 7 days but `effectiveUntil` is still in the future, Plus stays on. The store has told us the period is paid. Staleness can only hide a cancellation or refund, and those remove extras only, so we fail open for payers. If `effectiveUntil` has passed and we cannot verify, Plus is off for extras. Core features never ask.
- `expired`, `refunded` and `revoked` are off.

Order of evaluation inside `decide`. The first match wins:
1. `start_book`: `inFirstRunBatch` -> allow `first_run`; `startedBooks == 0` -> allow `free_book`; own Plus active -> allow `plus_own`; otherwise offer `second_child`. A gift on another book never funds a new book. Contributors may start their own first book.
2. All other features: the book has Plus (own Plus while a parent of this book, or `coveredByOtherParent`) -> allow `plus_own` or `plus_book`; a gift is active -> allow `gift`.
3. `read_together` in a Free book: `triesUsedInBook < freeTries` -> allow `try` with `triesLeft`.
4. `backup_upload` in a Free book, when not started by a tap (the background uploader asking) -> `quiet free_background`. Audio stays on the phone and no offer appears.
5. Suppressions: `surface == 'first_run'` -> quiet `first_run`; `isBirthday` -> quiet `birthday` (C-REQ-013's 24-hour suppression on the first birthday is a narrower case of this); `roleInBook == 'contributor'` -> quiet `contributor`.
6. Otherwise offer with the feature's trigger. `needsSignIn = !signedIn` (R-1).

The caller also applies C-REQ-023's frequency cap ("after Not now, at most once per month-age chapter"). The cap is a device setting keyed by trigger. It lives outside the engine so the engine stays stateless.

### 2.3 Truth table (the unit test is generated from this table)

`P` means own Plus active, `CP` covered by the other parent, `G` gift active, `S` started books, `FR` in first-run batch, `T` tries used out of 3.

| # | Feature | Viewer and state | Expected | Rule |
|---|---|---|---|---|
| 1 | start_book | Free, S=0, not FR | allow free_book | PRD-REQ-015 |
| 2 | start_book | Free, FR, third child of a twins-plus-sibling batch | allow first_run | PRD-REQ-015 (any dates) |
| 3 | start_book | Free, S=1 visible | offer second_child | PRD-REQ-015 |
| 4 | start_book | Free, S=1 hidden | offer second_child | hidden counts |
| 5 | start_book | Free, S=0, joined 1 book as co-parent | allow free_book | joined never counts |
| 6 | start_book | Free, only started book is in the 30-day delete window | allow free_book | "non-deleted"; restore later is allowed (see 2.5) |
| 7 | start_book | P active, S=3 | allow plus_own | K-28 |
| 8 | start_book | P in billing grace, S=2 | allow plus_own | C-REQ-027 |
| 9 | start_book | Lapsed, S=2 | offer second_child | C-REQ-028 |
| 10 | start_book | Free, G on book A, S=1 | offer second_child | gifts are per book |
| 11 | start_book | Contributor-only person, S=0 | allow free_book | starting makes them a parent |
| 12 | start_book | Free, S=1, not signed in | offer second_child, needsSignIn | R-1 |
| 13 | read_together | Parent with P | allow plus_own | |
| 14 | read_together | Parent, Free, CP | allow plus_book | K-28 co-parent |
| 15 | read_together | Contributor in a CP book | allow plus_book | K-28 every member |
| 16 | read_together | Free book, T=0, 1, 2 | allow try, triesLeft 3, 2, 1 | PRD-REQ-020 |
| 17 | read_together | Free book, parent, T=3 | offer read_together | |
| 18 | read_together | Free book, contributor, T=3 | quiet contributor | R-2 |
| 19 | read_together | Remote config freeTries=5, T=3 | allow try, triesLeft 2 | C-NFR-009 |
| 20 | read_together | Lapsed; only Plus sessions used before | allow try, triesLeft 3 | a try is counted only in try mode |
| 21 | read_together | Free book, T=3, first birthday | quiet birthday | C-REQ-013, -023 |
| 22 | backup_upload | Book Plus | allow | |
| 23 | backup_upload | Free, background uploader | quiet free_background | keep-and-leave |
| 24 | backup_upload | Free, user tapped Turn on backup | offer backup | C-REQ-023 |
| 25 | theme_extra | Free, parent taps an extra theme | offer themes | |
| 26 | theme_extra | Lapsed with an extra theme selected | render the default theme; keep the selection stored | PRD C 4.3 |
| 27 | any gated | Cache 9 days old, effectiveUntil in the future | allow | fail open for payers |
| 28 | any gated | Cache 9 days old, effectiveUntil passed, offline | Free state; an offer only once online | |
| 29 | any gated | Sandbox entitlement, not a tester | treated as Free | environment rule |
| 30 | any gated | Refunded | Free state, immediately | C-REQ-029 |
| 31 | any gated | Both parents hold P | allow; no offer anywhere | R-3 |
| 32 | any gated | surface first_run | quiet first_run | C-REQ-023, K-12 |
| 33 | FreeForever (all 9) | Every state above, entitlement service throwing | not evaluable (type error); the e2e shows they work | LEGAL-REQ-050 |

Property tests on top of the table:
- Lapsing never changes a decision about a FreeForever feature.
- Going from Free to Plus never turns an allow into an offer.
- `decide` never returns an offer when `surface == 'first_run'`.

### 2.4 Device state

- `apps/mobile/src/lib/plan.ts` (new) replaces the `hasPlus()` stub in `store.ts`. It holds the last `get_plan_state()` result plus RevenueCat `CustomerInfo` in the `settings` table under key `plan.cache` (L2 values; the account id is not stored in it). It exposes a synchronous `planView()`.
- Precedence: the server snapshot, then the SDK `CustomerInfo` (fresher right after a purchase), then the cache. Book coverage (`coveredByOtherParent`) comes from synced `book_entitlements` rows (TDD 02).
- Read together tries: `readTogether.sessions.<childId>` (TDD 01 3.9 and X-9), incremented when highlighted playback starts and only when the decision was `try`. A reinstall resets the count. That leak is accepted: Read together runs on local audio and costs us nothing.

### 2.5 Server rules (the two that matter)

Following TDD 02 2.5 and migration M9.

**`create_child` / `create_children_batch`** allow when one of these holds:
- (a) the caller has no non-deleted started book;
- (b) `has_plus(uid)` is true now;
- (c) the call carries the first-run batch and `profiles.first_run_batch_closed_at is null`;
- (d) **(new, differs from TDD 02)** `p_client_created_at` is no more than 30 days old, and `entitlement_events` shows the caller had Plus at that instant.

Rule (d) covers a parent who adds a third child on a flight while Plus is active, and whose Plus lapses before the phone syncs. Without (d), the server refuses a book that already holds letters.

If the server still refuses (raise `plus_required`, SQLSTATE `P0402`), the client **never deletes or hides the book**. It stays fully writable on the phone, marked "On this phone only" (sync, family and backup off for that book). The Plus sheet is offered once, and the book syncs as soon as Plus returns. This keeps the keep-and-leave rule (C 4.1). **OQ-1 (founder):** accept rule (d) and the on-phone fallback.

Restoring a book from Recently deleted is never refused, even when it makes two free started books (row 6). Refusing would hold content hostage. The abuse value is nil.

**Backup upload URL issuance** (the `audio_blobs` signed-URL function, TDD 03 and ADR 0006) checks `book_has_plus(child_id)` server-side, because storage is the real cost (C 4.1). Downloading already backed-up audio, restore and export never call it (C-NFR-008).

Read together and themes are client-only gates. Bypassing them costs nothing, so server enforcement is not worth building (Rec).

---

## 3. RevenueCat, Apple and Google setup

### 3.1 Store products (Apple, launch)

The subscription group is "Plus" (the brand name comes from `packages/brand`; never hardcode it). Storefront: United States only (LEGAL-REQ-058).

| Product id | Type | Price | Intro offer | Entitlement | Ships |
|---|---|---|---|---|---|
| `el_plus_monthly_399` | Auto-renewable, 1 month | US $3.99 | Free, 1 month, new subscribers | `plus` | v1 |
| `el_plus_annual_2999` | Auto-renewable, 1 year | US $29.99 | Free, 2 months | `plus` | v1 (experiment arm A) |
| `el_plus_annual_2999_t1m`, `el_plus_annual_2999_t2w` | Auto-renewable, 1 year | $29.99 | 1 month; 2 weeks | `plus` | Created, not offered (arms B and C) |
| `el_gift_plus_year_2999` | Non-renewing | $29.99 | none | **not** `plus`; granted to a book server-side | P1 |
| `el_lifetime_9999` | Non-consumable | about $99.99 | none | `plus` | P2 |

Facts and rules:
- All annual arms live in the same group. Apple allows one introductory offer per person per group [P1], so the arms cannot hand anyone a second trial.
- Product ids can never be reused. Create the arm products now, in Ready to Submit, so the experiment needs no new review. Remove them from sale if the experiment is dropped (Rec).
- Family Sharing stays **off** for every product. Once it is on it cannot be turned off [P3], and K-28 already covers the co-parent (C 4.2).
- Offer codes [P5]: *amended 4 Oct 2026 (founder; D-052).* Apple offer codes are wanted for early testers, neighbours and friends (free months, for example 6 months; whether Apple offers exactly 6 months is **unverified**, check in App Store Connect). They are handled by the existing `OFFER_REDEEMED` App Store Server Notification mapping (ADR 0013 list), with the entitlement coming from Apple's own transaction data. **There is no code table, redemption RPC or secret of ours**, because App Review Guideline 3.1.1 bars our own code mechanisms for unlocking functionality. Detail and unverified points: `docs/ops/OFFER_CODES.md` (branch `docs/offer-codes-runbook`, commit b8c2830, not yet merged here). Web codes stay P2 and need counsel and Apple (3.5).
- Win-back and promotional offers: none in v1. Minnesota bans unsolicited retention offers (lawyer-1 M2), and "nothing between you and cancelling" is in Terms 14.10.
- No print, Stripe or Lulu code in v1 (K-32). ADR 0007's print decision stays valid for later.

### 3.2 RevenueCat project

| Setting | Value | Note |
|---|---|---|
| Project | one project. Apps: App Store (bundle id from `packages/brand`); Play Store added later | |
| Entitlement | `plus` | the only one in v1; `gift_year` in P1 maps to nothing client-side |
| Offerings | `default` = {`$rc_monthly`: monthly, `$rc_annual`: annual arm A}; `arm_b` and `arm_c` built but unused | Assigning arms is premature (section 10, C-14). When it starts, the arm is decided server-side and stored as a subscriber attribute `pricing_arm` (enum only), per TRACKING_PLAN OQ 3 |
| App User ID | random UUID v4 from `billing_customers.rc_app_user_id`, minted by RPC `billing_app_user_id()` on the first Plus surface after sign-in | Never the profile id, email or analytics id (TDD 02 OQ-B1, TDD 05 X-17). `data-policy.md` 4.6 must change (C-6) |
| SDK configure | `Purchases.configure({ apiKey, appUserID: rcId })` only when signed in. Signed-out installs never configure the SDK | Avoids `$RCAnonymousID` aliasing and accidental anonymous purchases (R-1) |
| Subscriber attributes | none, except `pricing_arm` later. Never call `setEmail`, `setDisplayName` or `collectDeviceIdentifiers` | DATA_CLASSIFICATION 4.8 (RevenueCat L3) |
| Restore behaviour | "Transfer if there are no active subscriptions" (setting name **Unverified**; check in the dashboard) | 4.8 |
| Webhook | `POST https://<project>.functions.supabase.co/rc-webhook`, Authorization header = a 32-byte secret kept as an Edge secret | TDD 02 section 4.4 |
| Apple credentials | In-App Purchase key (.p8) and App Store Connect API key uploaded to RevenueCat. App Store Server Notifications V2, production and sandbox URLs, pointed at RevenueCat | Faster renewal, refund and grace updates (Unverified latency) |
| Integrations | none (no ad networks, no analytics forwarding) | LEGAL-REQ-016 |
| Admin access | founder plus one engineer, 2FA; logins logged (LEGAL-REQ-037) | |
| Cost | free to $2,500 monthly tracked revenue, then 1% (ADR 0007) | |

### 3.3 Server tables (aligned with TDD 02 M9 and TDD 05 7.9)

I keep TDD 02's names. Changes are marked **Delta**.

| Table | Columns (level) | Writer | Delta |
|---|---|---|---|
| `billing_customers` | `profile_id` pk (L3), `rc_app_user_id uuid unique` (L3), `created_at` | RPC `billing_app_user_id()` | none |
| `entitlements` | `profile_id`, `entitlement`, `status` (`trial`, `active`, `grace`, `billing_retry`, `expired`, `refunded`, `revoked`), `period_type`, `product_id`, `store`, `expires_at`, `grace_expires_at`, `will_renew`, `environment`, `original_purchase_at`, `storefront` (L2, US only), `last_event_at`, `verified_at` | `rc-webhook`, `plan-reconcile` (service role) | **Delta:** add `trial` to the status enum (needed by the notices); add `original_purchase_at` (anniversary reminder), `storefront` and `verified_at` |
| `entitlement_events` | `rc_event_id` unique, `profile_id`, `type`, `product_id`, `period_type`, `event_at`, `expiration_at`, `environment`, `received_at`, `processed_at`, `cancel_reason` (enum) | `rc-webhook` | **Delta:** add `period_type`, `expiration_at` and `cancel_reason`. This is the purchase ledger (TDD 05 065): kept **7 years** (DATA_CLASSIFICATION transactions), pseudonymised at account deletion. Never price, receipt, or raw payload |
| `book_entitlements` | `child_id` pk, `plus_until`, `source` | triggers | none |
| `notice_windows` | `kind`, `anchor` (`trial_end`, `period_end`, `anniversary`, `price_effective`), `target_offset`, `min_offset`, `max_offset`, `channels`, `source_ref` | seeded migration (L1) | from TDD 05 |
| `notice_schedule` | `id`, `profile_id`, `kind`, `period_key`, `send_at timestamptz`, `window_open`, `window_close`, `status` (`pending`, `sent`, `skipped`, `cancelled`, `failed`), `channels_sent`, `idempotency_key unique` | `rc-webhook`, `notice-scheduler` | **Delta vs TDD 02** `notice_queue.due_on` (a date): a date cannot express a 24-hour window, so use timestamps. **Delta vs TDD 05** `subscriptions_mirror`: drop it; `entitlements` is the mirror |
| `plan_cards` | `profile_id`, `kind`, `notice_id`, `shown_at` | scheduler; app marks shown | New: in-app notice cards (LEGAL-REQ-047 "email plus in-app") |

RLS: users read their own `entitlements` row through `get_plan_state()` only. Co-members see `book_entitlements` (a boolean and a date per book). Nothing else is readable by clients (TDD 02).

### 3.4 Google Play (later; specified so the model ports unchanged)

- Base plans `monthly` and `annual` on one subscription `plus`, each with a free-trial offer phase. Eligibility: new customers only [P6].
- Grace period plus account hold must total at least 30 days [P6]. Rec: 14-day grace plus 16-day hold.
- RTDN goes through Pub/Sub to RevenueCat. The RevenueCat SDK acknowledges purchases (the 3-day rule [P10]); a test checks this.
- Refunds can be issued by us through RevenueCat [P12]. A support runbook decides when.
- Price increases use the opt-in flow only (lawyer-1 M1).
- Manage deep link: `https://play.google.com/store/account/subscriptions?sku=...&package=...`.

### 3.5 Deferred items and the room left for them

- **Gift (P1):** `book_gifts(child_id, purchaser_profile_id, starts_at, ends_at, rc_event_id)`. `book_entitlements.source='gift'`. Refunds go to the purchaser [P2 3.1.1]; a refund ends the gift only.
- **Lifetime (P2):** maps to `plus` with `expires_at` null; restorable (C-REQ-032).
- **Web code (P2):** 3.1.3(b) allows it only if the item is also sold as IAP. Needs a redemption RPC.

---

## 4. Lifecycle

### 4.1 Purchase flow (iOS)

```
Plus sheet (offerings cached) -> user picks a plan (none preselected) -> taps Subscribe
  1 client: record_policy_act('auto-renewal-terms', method 'paywall_purchase', stage 'started',
            context {product, offer_type, disclosure_version, storefront})   [LEGAL-REQ-049]
  2 client: Purchases.purchasePackage(pkg) -> Apple sheet (Face ID)
  3a success: CustomerInfo has 'plus' -> UI shows Plus at once (optimistic, from the store)
           -> client calls sync_plan() -> server re-reads the RevenueCat subscriber -> entitlements row
           -> ack sheet (plus.ack.body); the ack email is sent by the webhook path, not the client
  3b cancelled / failed / pending (Ask to Buy): no Plus; purchase_failed{error_class}
  4 webhook INITIAL_PURCHASE -> rc-webhook -> dedupe -> re-read subscriber -> upsert
           -> book_entitlements triggers -> notice_schedule rows -> ack email now
           -> consent reconcile (4.2)
```

`sync_plan()` exists so the p95 5-second budget (C-NFR-002) does not depend on webhook latency. The server never trusts a client claim: it fetches `GET /v1/subscribers/{rc_app_user_id}` itself.

### 4.2 Consent proof (LEGAL-REQ-049)

- At step 1 the client writes a row with stage `started`.
- The webhook writes or links exactly one stage-`completed` row per original transaction. Its context holds `rc_event_id`, `product_id` and `period_type`, and it carries the same `disclosure_version` as the most recent `started` row within the previous 30 minutes.
- If no `started` row exists (purchase completed from a queued transaction after a crash), the `completed` row records `disclosure_version: unknown` and the nightly check alerts.
- `disclosure_version` is the hash of the rendered `plus.legal.*` strings plus the Subscription Terms version, computed at build time.
- Conflict C-4: LEGAL-REQ-049 asks for a row at both start and completion, but its test says "exactly one acceptance row matches". Rec: read the test as exactly one `completed` row.

### 4.3 Notice engine (PRD-REQ-003, LEGAL-REQ-047, K-04, lawyer-1 H1)

The schedule is derived from the entitlement snapshot, not from event types. Every snapshot write recomputes the profile's future `pending` notices (cancel and insert, keyed by idempotency key), so cancellations, refunds, product changes and duplicate webhooks need no special cases.

Definitions: `E` = trial end or period end (store instant, UTC). `C` = cancel deadline = `E - 24h` (Subscription Terms "at least 24 hours before"). The windows below are the intersection of the CA, NY, VA, UT and MA rules in the lawyer-1 table. We do not know or store the user's state (LEGAL-REQ-058), so everyone gets the strictest window.

| Kind | Applies when | Target `send_at` | Hard window (refuse to send outside it) | Channels | Why |
|---|---|---|---|---|---|
| `ack` | purchase or trial start | immediately | within 1 h of the event | email + in-app sheet | CA acknowledgment (H3) |
| `trial_long` | trial longer than 31 days and will renew | `E - 18d` | `[E-21d, E-4d]` (CA 3 to 21 before E; NY 3 to 21 before C) | email + card | K-04, H1 |
| `trial_week` | trial of 31 days or less and will renew | `E - 7d` | `[E-8d, E-5d]` | email + card | UR R16 courtesy; VA "within 30 days" for a 31-day month |
| `trial_final` | every trial that will renew | `E - 4d 12h` | `[E-5d, E-4d]` (at least 3 days before C) | email + card + **one push** | Subscription Terms; differs from K-04's D-3 (C-1) |
| `renew_annual_long` | annual, will renew, not in a trial | `E - 30d 12h` | `[E-31d, E-30d]` (VA and UT need at least 30 days; MA needs at most 30 days before C) | email + card | H1; differs from LEGAL-REQ-047's plus or minus 1 day (C-1) |
| `renew_annual_short` | annual, will renew | `E - 7d` | `[E-8d, E-6d]` | email + card | courtesy, K-04 |
| `anniversary` | monthly plan, each year after `original_purchase_at` | anniversary 15:00 UTC | same day | email | AB 2863 annual reminder. For annual plans `renew_annual_long` carries the reminder text (OQ-3) |
| `price_change` | an approved price increase | effective date - 25d | `[eff-30d, eff-7d]` | email + card; store opt-in consent | lawyer-1 M1 |
| `billing_issue` | entered grace | immediately | n/a | card only ("There's a problem with your payment. Your letters are fine.") | C-REQ-027 |
| `lapsed` | expired or refunded | next foreground | n/a | card (`plus.lapsed`) | C 4.3 |

Rules:
- If `will_renew` becomes false (the user cancelled), every pending renewal or trial notice for that period is set to `skipped`. Telling someone "Plus renews on {date}" after they cancelled would be false.
- **Birthday:** emails and pushes always go inside their hard window, even on a birthday. The rule "never sent on a birthday; moved a day earlier" (K-04) would push `renew_annual_long` outside its 24-hour window. Rec: for pushes, pick the part of the window that avoids the birthday when one exists; in-app cards wait until the next non-birthday foreground. Conflict C-2.
- The scheduler (`notice-scheduler`, pg_cron every 15 min) sends rows with `send_at <= now() <= window_close`. A row past `window_close` becomes `failed` and pages the founder; it is never sent late (TDD 05 FM-18).
- Content: transactional class, no child name, no letter text, no promotion (LEGAL-REQ-053, -054). Every notice states the date, the price from the snapshot (the store's local price string), the cancel-by date (`C` as a calendar date in US Pacific time, OQ-4) and how to cancel, with links to the cancel help page and Manage subscription.
- Push: only `trial_final`, under the "Your plan" channel, and nothing else that day (C-REQ-025). If push permission is off, the email and card still go.
- Sandbox: the scheduler sends only to the tester inbox and never pushes. Sandbox time runs fast (Unverified rates), so the schedule is tested with a controlled clock, not sandbox time.

### 4.4 Cancellation (LEGAL-REQ-048, lawyer-1 M2)

- Settings > Plan shows the renewal or trial-end date and a **Manage or cancel** row. On iOS it calls RevenueCat `showManageSubscriptions()` (StoreKit `showManageSubscriptions`) in one tap. If that fails it falls back to `https://apps.apple.com/account/subscriptions`.
- Nothing comes before the store sheet: no survey and no offer.
- The cancel help page on the website is linked from every plan email.
- Deleting the app does not cancel, and the plan screen and Terms say so.
- **OQ-2 (counsel):** whether this deep link meets the one-step laws (lawyer-1 Q1).

### 4.5 Refunds (C-REQ-029)

- The Plan row "Request a refund" calls `beginRefundRequest` through the RevenueCat SDK (iOS 15+; the exact RN method name is Unverified; a sandbox test settles it).
- Apple decides the refund. RevenueCat sends a CANCELLATION with a refund reason (event naming Unverified; the snapshot re-read makes the exact name unimportant). Status becomes `refunded`, the entitlement ends immediately, `book_entitlements` recompute, the `lapsed` card shows.
- Letters, audio and backups never change (C-REQ-029). Books created under Plus stay (row 9).
- Refund reversal: the next snapshot re-grants Plus.

### 4.6 Grace and billing retry (C-REQ-027)

- Apple Billing Grace Period: on. Duration Rec 16 days. The options are reported as 3, 16 or 28 days (Unverified; C OQ4).
- During grace, status is `grace`, Plus works, and a `billing_issue` card shows.
- After grace, Apple keeps retrying (status `billing_retry`; Plus off for extras). A recovered payment restores Plus on the next snapshot.
- Notices are not sent for a period whose payment is failing unless `will_renew` is still true.

### 4.7 Price changes

None planned for v1.
- Runbook: decide the change, publish the notice 25 days ahead (inside 7 to 30), and use Apple's consent-required increase only, never the notice-only option (lawyer-1 M1, Terms 14.8).
- Users who do not consent lapse at period end. Section 5 applies.
- Existing payers keep what they bought if the model changes (C 4.2).

### 4.8 Restore purchases (C-REQ-020, C-NFR-003)

- Restore appears on the Plus sheet footer (`plus.legal.links`) and in Settings > Plan. It calls `Purchases.restorePurchases()` and then `sync_plan()`. Target: within 10 s for 99%.
- Restore behaviour (Rec): transfer to the current account **only if the old account has no active subscription**. That stops one Apple ID's Plus hopping between two parents' accounts on a shared iPad, which would silently move Book Plus between books. It still recovers a person who made a new account after deleting the old one. If the transfer is blocked, the client shows: "This Apple Account's Plus is linked to another Early Letters account. Sign in with that account, or contact us." (The brand name comes from `packages/brand`.)
- **Risk:** support tickets from families sharing an Apple ID. Measure them.
- Outcomes are logged as `restore_result{outcome}`.

### 4.9 Account deletion while subscribed (C-REQ-019, LEGAL-REQ-029)

- The delete flow shows "Billing continues through Apple until you cancel" plus the Manage link before the final confirm.
- At hard delete, TDD 02's deletion job calls RevenueCat `DELETE /v1/subscribers/{id}`, deletes the `billing_customers` row and pseudonymises `entitlement_events` (kept for the 7-year ledger) and the `auto-renewal-terms` acceptances (kept 3 years, or 1 year after the plan ended, whichever is longer).
- A later restore on that Apple ID creates a new subscriber under the new account.

### 4.10 Two parents, one family

- If both parents subscribe, both pay. We cannot stop it in the store, but R-3 means neither is shown an offer in a book that is already covered.
- Settings > Plan shows "Plus is on for {child}'s book" when the coverage comes from the other parent, without saying who pays (TDD 02 minimisation).
- If the paying parent leaves the book, or their Plus lapses, the book returns to Free under section 5.

---

## 5. When Plus ends (lapse, refund, grace expiry, revoke, outage)

Nothing becomes unreadable. "Ends" covers every state where `planActive` is false.

| Area | After Plus ends | Source |
|---|---|---|
| Reading, playing any recording, export (PDF and ZIP) of letters already made, family authors' and members' access to them | Unchanged in **every** book, including extra children's books. *Amended 4 Oct 2026 (D-051): this is now the whole of the keep-and-leave promise.* | C 4.3, LEGAL-REQ-050 |
| Adding new letters | *New (D-051):* needs Plus again once the account is past its 2 free letters. An in-progress letter is never discarded; it stays on the phone and the Plus sheet is offered (PRD-REQ-025) | PRD-REQ-024 |
| Extra books started under Plus | Stay fully writable, readable and shared; only starting another needs Plus | C-REQ-028 |
| Backed-up audio | Stays stored, playable, restorable on a new phone and included in export, forever (until the user deletes it) | C-NFR-008 |
| New recordings | Saved on the phone; upload stops. Settings: "New recordings are kept on this phone." | C 4.3 |
| Read together | Returns to tries; tries already used in try mode still count | PRD-REQ-020 |
| Themes and covers | Default theme renders. The chosen extra stays stored and returns on resubscribe. No letter changes | C 4.3 |
| Co-parent and contributors | Lose Plus extras in that book only if no other parent holds Plus | K-28 |
| Vault mode and encryption keys | Unchanged; the plan state never touches keys (ADR 0006) | |
| Notices | `lapsed` card once, no email (not required; avoids a sales feel) | |

Test: section 9.1, suite E2E-L.

---

## 6. Paywall design rules (Apple 3.1.2, DPLA Schedule 2 3.8(b), CA 17602, LEGAL-REQ-046)

The Plus sheet is one component, `apps/mobile/src/components/plus/plus-sheet.tsx`. It replaces `plus-gate.tsx`. Every rule below becomes a snapshot or UI test.

**Content (before the button)**
1. What Plus adds, matching the Subscription Terms list exactly. The list is one string set in `packages/content`, and a test asserts equality with `subscription-terms.md` (Apple 3.1.2(c); counsel note in Subscription Terms).
2. The promise line `plus.promise`: "Writing, reading, playing your recordings, export and family letters are free, always. Plus adds a few extras." (K-11) *Amended 4 Oct 2026 (D-051): this line is superseded and must not ship; the replacement wording is owned by content and counsel (unverified).*
3. Two plan options. **Neither is preselected** (C-REQ-022). Each leads with the billed amount ("$29.99 a year") from `StoreProduct.priceString`; any free period is secondary text. A per-month equivalent of the annual price is not shown in v1 (Rec: it only adds review risk).
4. Under the chosen plan: `plus.legal.renewTrial` when the store reports intro eligibility (`checkTrialOrIntroductoryPriceEligibility`), otherwise `plus.legal.renewNoTrial`. `{trialLength}` comes from the product's intro offer and `{cancelByDate}` is computed from it. No "free" word appears unless eligible (C-REQ-022, H2).
5. `plus.legal.cancel`, then `plus.legal.agree` directly above the button (H3). The links `plus.legal.links` (Terms, Privacy, Subscription terms, Restore) open in-app.

**Layout and behaviour**
6. All of item 4 to 5 is visible at the default text size without scrolling past the button, and wraps without truncation at AX5. VoiceOver reads price, period, trial and renewal as one element with the button hint (C-NFR-006, LEGAL-REQ-051).
7. "Not now" and a close control are visible from the first frame. No delay, countdown, fake discount, urgency or "limited time" (VOICE, C 7).
8. Banned words in plan copy: unlock, premium, expire, lose, locked; "trial" only inside disclosure strings (C 7). Enforced by `packages/content/test/rules.test.ts`.
9. Prices are never hardcoded. With no cached offerings and no network, the sheet says the App Store cannot be reached and disables the button. It never shows a remembered price as purchasable (BRAND proof discipline).
10. Never shown: at launch, during first run, during recording, review or export, in the Book list, on a birthday, to contributors, in a book already covered (C-REQ-023, R-2, R-3). The engine returns `quiet` for these and the sheet cannot open.
11. One sheet design for all triggers. The `trigger` only changes the heading line (for example `children.add.plusNote` for `second_child`).
12. `onContinueDev` and any other bypass compile out of release builds. A CI grep fails if `__DEV__`-guarded bypass props appear in a production bundle (C-9).
13. The sheet records `plus_offer_viewed{trigger, arm}` and `plus_offer_dismissed{trigger}` only after analytics consent (K-01).

---

## 7. Interface contracts and budgets

| # | Interface | Shape | Budget | Failure behaviour |
|---|---|---|---|---|
| I-1 | `decide(input)` (`packages/core/src/plan.ts`) | section 2.2 | under 1 ms; pure | throws only on a programmer error (unknown feature); the caller treats a throw as `quiet` |
| I-2 | `planView()` (`apps/mobile/src/lib/plan.ts`) | `PlanView` from cache | synchronous, under 5 ms | missing cache -> `state: 'none'` |
| I-3 | `refreshPlan()` | SDK `getCustomerInfo` + `get_plan_state()` | p95 1.5 s; never on the launch critical path (TDD 01 bootstrap) | keeps the cache; no UI |
| I-4 | `purchase(pkg, disclosureVersion)` | section 4.1 | Plus visible p95 5 s, p99 10 s after the Apple sheet closes (C-NFR-002, PRD 7.2) | typed `PurchaseError` -> `purchase_failed{error_class}` |
| I-5 | `restore()` | `restorePurchases` + `sync_plan()` | 99% within 10 s (C-NFR-003) | outcome enum |
| I-6 | `openManage()`, `requestRefund()` | store sheets | one tap, under 500 ms to present | web fallback for manage |
| I-7 | Plus sheet render | cached offerings | under 1 s (C-NFR-007); fetch timeout 3 s | section 6 rule 9 |
| I-8 | RPC `billing_app_user_id()` | returns uuid; creates on first call | p95 300 ms | retry; no purchase without it |
| I-9 | RPC `get_plan_state()` | `{status, period_type, product, expires_at, will_renew, cancel_by, in_grace, store_env, covered_books: child_id[]}` | p95 300 ms | client keeps cache |
| I-10 | RPC `sync_plan()` | server fetches the RevenueCat subscriber, upserts, returns I-9 | p95 2 s; rate limit 10 per user per hour | RevenueCat down -> returns the last snapshot with `stale: true` |
| I-11 | SQL `has_plus(uid)`, `book_has_plus(child)` | boolean, `stable` | under 5 ms (pk lookups) | n/a |
| I-12 | RPC `create_child(p_id, ..., p_first_run_batch, p_client_created_at)` / `create_children_batch` | TDD 02 M7, M9 plus rule (d) | p95 200 ms, p99 500 ms | `P0402 plus_required` -> section 2.5 fallback |
| I-13 | Edge `rc-webhook` | RevenueCat event JSON, max 64 KB | 200 within 2 s p95. Snapshot written p95 5 s after the store event; p99 60 s (PRD 7.2) | 401 on a bad secret; 5xx makes RevenueCat retry (retry policy Unverified); the nightly reconcile is the backstop |
| I-14 | Edge `plan-reconcile` (cron) | nightly full pass over every non-expired row, plus hourly over rows with `E` within 48 h or `verified_at` older than 24 h | full pass under 10 min at 100k payers (RevenueCat rate limits Unverified; batch at 10 req/s) | alert on more than 1% mismatches |
| I-15 | Edge `notice-scheduler` (cron, 15 min) | section 4.3 | a due notice is sent within 30 min of `send_at`; 99.5% of trial notices on time (C-NFR-001) | hard-window refusal + page |
| I-16 | Remote config `read_together_free_sessions` (int, default 3), `plus_offer_triggers` (enum set) | TDD 01 3.9 table | cached; never awaited at launch | bundled defaults |

The webhook handler, step by step:
1. Constant-time compare of the Authorization header.
2. Parse the event, keeping only allowlisted fields.
3. `insert into entitlement_events ... on conflict (rc_event_id) do nothing`. If nothing was inserted, return 200 (duplicate).
4. Map `app_user_id` to `profile_id` through `billing_customers`. If unknown, store the event and return 200 (TDD 02 retries it for 24 h). Transfers carry two ids; refresh both.
5. Fetch the subscriber from RevenueCat; compute the snapshot (newest RevenueCat data wins regardless of event order).
6. Apply the environment rule (production only; sandbox counts only for tester profiles).
7. Upsert `entitlements`; the triggers update `book_entitlements`.
8. Recompute notices; enqueue `ack` and reconcile consent (4.2).
9. Log request id, event type and outcome only. No profile id appears in function logs (DATA_CLASSIFICATION L3 rule).

---

## 8. Failure modes

| # | Failure | Effect without design | Mitigation | Test |
|---|---|---|---|---|
| F-1 | Offline at the Plus sheet | Purchase impossible | Sheet explains; no hardcoded price; core untouched | U-sheet |
| F-2 | Network drops after Apple charges | Paid, no Plus | StoreKit keeps the transaction; the RevenueCat SDK finishes it on reconnect; webhook and reconcile grant it | Sandbox S-4 |
| F-3 | Webhook delayed or lost | Server says Free while the store says Plus | `sync_plan()` after purchase; hourly and nightly reconcile; client trusts SDK `CustomerInfo` for extras | W-3, W-6 |
| F-4 | Webhooks out of order or duplicated | Wrong state; double grant | Event-id dedupe; snapshot re-read; no counters | W-2, W-4 |
| F-5 | RevenueCat outage | No purchases or restores | Core never calls it (LEGAL-REQ-050); extras use the cache; status line in Settings | E2E-L |
| F-6 | Supabase outage | `create_child` and backup fail | Book creation is local first; sync later; backup queue waits; nothing lost | E2E-L |
| F-7 | Offline book created under Plus, Plus lapses before sync | Server refuses a book holding letters | Rule (d) plus the on-phone fallback (2.5) | DB-6 |
| F-8 | Sandbox events reach production | Testers or attackers get free Plus | Environment rule; tester flag set only by the founder via runbook | W-5 |
| F-9 | Forged webhook | Free Plus | Secret header; snapshot re-read means a forged event can only trigger a re-read of real data | W-1 |
| F-10 | Device clock wrong | Wrong trial math | All windows use store instants on the server; the client shows server dates | U-clock |
| F-11 | Ask to Buy or other pending purchase | Confusing state | "Waiting for approval" note; the grant arrives later through the webhook | S-6 |
| F-12 | Notice computed in the wrong time zone or across DST | ARL exposure | UTC instants; hard-window refusal; DST-edge unit tests (TDD 05 FM-18) | N-1 to N-9 |
| F-13 | Email provider down at notice time | Missed legal notice | Retry inside the window; page the founder at 50% of the window; in-app card as second channel | N-10 |
| F-14 | Shared Apple ID across two accounts | Plus moves between parents | Restore behaviour (4.8) | S-7 |
| F-15 | Refund while the device is offline | Extras stay on until reconnect | Accepted (extras only) | - |
| F-16 | Product or offering misconfigured | Wrong price or trial shown | Release checklist compares App Store Connect and RevenueCat with section 3.1; offerings snapshot test in sandbox | R-checklist |
| F-17 | Cached prices outdated | Showing a stale price | Cached prices display only alongside a live product, else rule 9 | U-sheet |

---

## 9. Test strategy

### 9.1 Layers

| Layer | Tool | Where | What | Gate |
|---|---|---|---|---|
| U: engine | Vitest | `packages/core/test/plan.test.ts` | Table 2.3 (one test per row, generated from a fixture table) and the three property tests | every PR; **release** |
| U: notice windows | Vitest | `supabase/functions/notice-scheduler/windows.test.ts` | N-1 to N-10: each `notice_windows` row against each state rule; annual renewal on 1 March (non-leap and leap year), 31-day months, DST in March and November, trial of exactly 31 and 32 days, cancel after scheduling, birthday inside the window | every PR; **release** |
| U: sheet | Jest + RN Testing Library | `apps/mobile` | Section 6 rules: no preselection, eligible vs not, banned words, AX5 snapshot, VoiceOver label grouping, quiet surfaces | every PR; **release** |
| DB | embedded Postgres (`npm run test:db`) | `supabase/tests/entitlements.test.mjs` | DB-1 RLS on all billing tables; DB-2 `book_has_plus` for co-parent and contributor; DB-3 second book refused; DB-4 first-run batch once; DB-5 joined books do not count; DB-6 rule (d); DB-7 restore from delete allowed; DB-8 core RPCs work with billing tables locked (LEGAL-REQ-050); DB-9 column comments carry L-levels | every PR; **release** |
| W: webhook replay | Deno test, synthetic events (family "Asha", random ids) | `supabase/functions/rc-webhook/test` | W-1 bad secret; W-2 duplicate; W-3 missing event, reconcile fixes; W-4 shuffled order of a year of events; W-5 sandbox for non-tester; W-6 RevenueCat 500 then success; W-7 transfer; W-8 refund then reversal; W-9 consent reconcile, exactly one completed row | every PR touching functions; **release** |
| N: scheduler with clock | Deno test with injected clock | same | A synthetic year of a monthly and an annual subscriber: every notice inside its window, none outside, cancel skips | **release** |
| S: StoreKit local | Xcode StoreKit Configuration file `apps/mobile/ios/Plus.storekit` in a dev-client build | manual plus Maestro script | Products, intro eligibility, purchase, cancel, refund, Ask to Buy without Apple servers. Whether RevenueCat validates StoreKit-config transactions server-side is Unverified, so this layer tests UI and the SDK only | before TestFlight |
| S: Apple sandbox | Sandbox Apple Accounts on a device; staging Supabase and RevenueCat | manual script | S-1 trial start and ack email; S-2 conversion; S-3 renewal; S-4 network cut after pay; S-5 grace (sandbox billing-failure toggle, Unverified); S-6 Ask to Buy; S-7 shared Apple ID with two accounts; S-8 restore on a second device under 10 s; S-9 refund request sheet; S-10 manage subscription opens in one tap | **release (signed checklist)** |
| E2E-L: keep-and-leave | Maestro on the simulator, with the RevenueCat host blocked and a lapsed fixture | `apps/mobile/e2e` | Write, read, play, export, download backed-up audio, two books writable, third offers Plus (LEGAL-REQ-050, C-REQ-028) | **release** |
| Logs | log canary (TDD 05) | CI | No "Asha", email or profile id in webhook or scheduler logs | **release** |

### 9.2 What gates a release

The release is blocked unless all of these pass:
- Every U, DB, W and N suite.
- The E2E-L run.
- The signed sandbox checklist S-1 to S-10 for any build that changes purchase code.
- The product-configuration checklist (F-16).
- Counsel's sign-off on the window table, for the first release only.

TestFlight beyond the founding family counts as public (ENGINEERING_REQUIREMENTS header), so the gate applies there too.

---

## 10. Conflicts and critique

| # | Severity | Finding | Sources | Rec / owner |
|---|---|---|---|---|
| C-1 | High | Notice days disagree in three places. K-04 and C-REQ-025 say the final trial notice goes at D-3; Lawyer 1 and the Subscription Terms promise at least 3 days before the cancel deadline (D-4). LEGAL-REQ-047 says the annual trial goes at D-7 and D-3 and allows plus or minus 1 day on D-30, which breaks Virginia. | K-04; LEGAL-REQ-047; lawyer-1 H1; TDD 05 X-06 | Adopt the 4.3 table. Owners: PRD C (C-REQ-025 text), legal (LEGAL-REQ-047 table and test); counsel OQ-L7 |
| C-2 | Medium | K-04's "a birthday moves a notice one day earlier" can push the D-30 notice out of its 24-hour window | K-04 | Section 4.3 birthday rule; PRD owner |
| C-3 | High | `read-together.ts` uses a constant (3), counts per phone, and counts at screen open | PRD-REQ-020; TDD 01 X-9 | BL-M13 per book, from remote config, counted at highlight start, only in try mode |
| C-4 | Low | LEGAL-REQ-049 says "start and completion" rows, but its test says "exactly one" | LEGAL-REQ-049 | 4.2 interpretation; legal confirms |
| C-5 | Medium | TDD 02 uses `notice_queue.due_on` (a date); TDD 05 uses `subscriptions_mirror` and `notice_schedule.send_at` | TDD 02 2.5, 4.4; TDD 05 7.9 | Section 3.3: one mirror (`entitlements`), `notice_schedule` with timestamps; data architect |
| C-6 | Medium | `data-policy.md` 4.6 says RevenueCat app user id = profile uuid | TDD 02 OQ-B1; TDD 05 X-17 | Random id; data-policy owner edits |
| C-7 | Medium | TDD 02's `create_child` rule refuses an offline-created book after a lapse | TDD 02 2.5 | Rule (d) plus the on-phone fallback; founder OQ-1 |
| C-8 | Medium | K-28 says all members get Plus features, but nothing stops a contributor buying Plus that covers no book | K-28, C-REQ-021 | R-2: contributors never see the sheet |
| C-9 | High | `PlusGate.onContinueDev` bypass is guarded only by `__DEV__`; a misbuilt release would ship a free pass | `add-child-form.tsx`, `read-together.tsx` | Remove with the new sheet; CI bundle grep |
| C-10 | Medium | The monthly 1-month trial can be 31 days. Virginia's "trial over 30 days" then applies (within 30 days of the end); D-7 satisfies it, but no doc says so | lawyer-1 table | Documented in 4.3; counsel confirms |
| C-11 | Medium | Massachusetts may require the key terms with every monthly bill (lawyer-1 M8); not built | lawyer-1 M8 | Counsel OQ-3; if yes, add a `renewal_receipt` notice kind (one row in `notice_windows`) |
| C-12 | Low | C-REQ-030 says a gift "grants 12 months of Plus to one book", while the gift product would map to the purchaser's RevenueCat entitlement if left at default | C-REQ-030 | Gift product maps to no client entitlement; server grant (3.5) |
| C-13 | Medium | Requiring sign-in to purchase (R-1) is not written in any PRD | PRD A, C | PRD C owner adds it; App Review note |
| C-14 | Low | The experiment needs about 3,300 trial starters and about 7 months (C 8) | C section 8 | Premature for v1. Build the products and offerings; turn it on after 40 trial starts a day |

Critique of the plan as a whole (Rec):
- The biggest real risk is legal, not technical: one mistimed ARL notice is a class-action fact pattern. That is why the windows are data, refusal is hard, and the year-long clock test gates release.
- The second risk is trust: any path where paying, lapsing or a vendor outage makes a memory unreachable. The type-level exclusion of FreeForever features and the E2E-L run are the defences.
- Things that are not risks, so do not over-build: Read together and theme bypasses, reinstall-reset tries, and refund-while-offline windows.

---

## 11. Build plan

Sizes: **S** is under a day, **M** is 1 to 3 days, **L** is 4 or more days. Existing BACKLOG ids are reused. New ids are `BL-P##`, proposed for BACKLOG.md's "Later" Plus item; the backlog owner adds them. Nothing below fits the 5 to 30 Oct window except BL-036 and BL-P01, which are pure logic.

| Order | Id | Task | Size | Depends on | Requirements | Gate test |
|---|---|---|---|---|---|---|
| 1 | **BL-036** (extended) | `packages/core/src/plan.ts`: `decide`, `planActive`, `FreeForever` / `GatedFeature` types, table 2.3 as fixtures | M | none | PRD-REQ-015, -020, C-REQ-023, LEGAL-REQ-050 | U engine |
| 2 | BL-P01 | Notice windows as data (`notice_windows` seed) plus pure `scheduleFor(snapshot)` with the N tests | M | none | LEGAL-REQ-047, K-04, H1 | U windows |
| 3 | BL-022 / BL-M09 (TDD 01) | Remote config with `read_together_free_sessions`, `plus_offer_triggers` | (TDD 01) | founder answer | C-NFR-009 | |
| 4 | BL-M13 (TDD 01) | Read together tries per book from config, counted in try mode only; delete the constant | S | 1, 3 | PRD-REQ-020 | E-08 |
| 5 | M9 / SB-11 (TDD 02) | Billing tables with section 3.3 deltas, `has_plus`, `book_has_plus`, `create_child` rules (a) to (d), `get_plan_state`, `billing_app_user_id` | L | TDD 02 M7, M8; BL-014 | K-28, PRD-REQ-015 | DB-1 to DB-9 |
| 6 | BL-P02 | Store setup: App Store Connect group, products, intro offers, grace on, Family Sharing off, US only; RevenueCat project, entitlement, offerings, webhook secret, Apple keys; staging and production; the F-16 checklist | M (founder plus engineer) | Apple Developer account, company name (PRD 9 Q5) | C-REQ-021, -027, LEGAL-REQ-058 | R-checklist |
| 7 | BL-P03 | Edge `rc-webhook` + `sync_plan` + `plan-reconcile` | L | 5, 6 | C-NFR-002, C-REQ-029 | W-1 to W-9 |
| 8 | BL-P04 | Mobile `lib/plan.ts`: SDK configure after sign-in, cache, `purchase`, `restore`, `openManage`, `requestRefund`; replace the `hasPlus` and `isJoinedBook` stubs | M | 6, 7, BL-050 sign-in | C-REQ-020, C-NFR-003, -004 | S-1 to S-10 |
| 9 | BL-P05 | Plus sheet per section 6; delete `plus-gate.tsx` and the dev bypass; CI bundle grep | M | 1, 8, content strings (`plus.legal.*`) | C-REQ-022, LEGAL-REQ-046, C-NFR-006, -007 | U sheet |
| 10 | BL-P06 | Consent proof: `record_policy_act` at start; reconcile in the webhook; nightly check | S | 7, BL-014 | LEGAL-REQ-049 | W-9 |
| 11 | BL-P07 | `notice-scheduler`: email templates (transactional), in-app `plan_cards`, the one push, hard-window refusal and paging | L | 2, 7, email provider (BL-053) | PRD-REQ-003, C-REQ-024 to -026, LEGAL-REQ-053, -054 | N year run |
| 12 | BL-P08 | Settings > Plan screen: status, dates, coverage line, Manage or cancel, Restore, Request a refund | M | 8 | C-REQ-016, LEGAL-REQ-048 | S-9, S-10 |
| 13 | BL-P09 | Server enforcement on backup upload URLs via `book_has_plus` | S | 5, TDD 03 backup | C 4.1 | DB-2 |
| 14 | BL-P10 | Delete-account billing step and RevenueCat subscriber delete | S | TDD 02 deletion job | C-REQ-019, LEGAL-REQ-029 | deletion verification |
| 15 | BL-P11 | E2E-L keep-and-leave run in CI | M | 8, 9 | LEGAL-REQ-050, C-REQ-028 | E2E-L |
| 16 | BL-024 (extended) | Plus aggregates from RevenueCat and `entitlement_events` (trials, conversions, refunds, by product and arm); suppress cells under 10 | M | 7 | PRD-REQ-017 | aggregate test |
| later | BL-P12 to BL-P14 | Gift (P1), dormant-payer email (P1), trial experiment arms (when there are 40 or more trial starts a day) | M each | | C-REQ-030, -031, C 8 | |
| later | BL-P15 | Google Play port (3.4) | L | Android build | C 4.2 | |

Critical path: 1 -> 5 -> 6 -> 7 -> 8 -> 9 -> 11. Estimate: about 4 to 5 engineer-weeks, plus Apple setup lead time. App Store Connect needs the company entity and the paid-apps agreement signed before products can be tested, so that is the founder's earliest task.

---

## 12. Analytics (TRACKING_PLAN alignment)

- **Device events, after consent only:** `plus_offer_viewed{trigger, arm}`, `plus_offer_dismissed{trigger}`, `purchase_started{product, trigger}`, `trial_started{product}`, `purchase_succeeded{product}`, `purchase_failed{error_class}`, `restore_result{outcome}`, `read_together_try_used{n}`. Product enum: monthly, annual, gift. All L2 (DATA_CLASSIFICATION 4.7).
- **Server metrics, not device events:** `trial_notice_sent`, `trial_converted`, `trial_cancelled`, `renewal`, `billing_issue`, `plus_lapsed`, `refund_detected`. They come from `entitlement_events` and RevenueCat (TRACKING_PLAN s.2).
- **Never in analytics:** the RevenueCat id, profile id, price paid or storefront.
- **Arm assignment (later):** server-side and stored on the RevenueCat subscriber, so conversion per arm is computed in RevenueCat without joining device ids (TRACKING_PLAN OQ 3).

---

## 13. Open questions

| # | Question | Owner | Rec |
|---|---|---|---|
| OQ-1 | Accept `create_child` rule (d) (offline book made under Plus) and the on-phone fallback when the server refuses? | Founder, data architect | Yes |
| OQ-2 | Does a deep link to Apple's cancel screen meet the one-step cancellation laws (CO, NY, NYC)? | Counsel (lawyer-1 Q1) | Assume yes; no in-app cancel exists to add |
| OQ-3 | Massachusetts repeat-terms duty for monthly plans (M8)? Can the annual D-30 notice double as the AB 2863 annual reminder? | Counsel | Add a `renewal_receipt` row if required |
| OQ-4 | Which time zone states the calendar "cancel by" date in emails, when we do not store the user's location? | Counsel, PRD C | US Pacific (earliest US mainland deadline); in-app uses the device zone |
| OQ-5 | Require sign-in to purchase (R-1)? | Founder, PRD C | Yes |
| OQ-6 | Contributors never see the Plus sheet (R-2)? | Founder | Yes, until gifts ship |
| OQ-7 | Apple grace length: 16 days? | Founder | 16 |
| OQ-8 | Restore behaviour: transfer only when the old account has no active plan? | Founder | Yes; measure tickets |
| OQ-9 | Sandbox testers on the production backend: a `profiles.is_tester` flag set by runbook only? | Data architect | Yes, audited |
| OQ-10 | Start the trial experiment at launch? | Founder | No: after 40 trial starts a day |
| OQ-11 | `notice_schedule` naming and timestamps (C-5) | Data architect (TDD 02), privacy (TDD 05) | Section 3.3 |
| OQ-12 | The D-051 open edges (14.3): family letters, second child's book, offline counting, Read together interplay, first-run children, offline letters past the limit, lapsed wording | Founder; counsel for wording | Not decided here; in-progress letter never discarded is recommended |

---

## 14. Membership model change (D-051, 4 Oct 2026): what changes and the engineering TODO

Written at the level of detail of sections 2 to 5. Nothing in `supabase/**` or app code was changed by this edit; this section is the list for the owners.

### 14.1 The entitlement check and the counting (design level)

- **Gate.** Add `add_letter` to `GatedFeature` in `packages/core/src/plan.ts`. `FreeForever` keeps `read`, `play_recording`, `export`, `download_backed_up_audio`, `restore_backup`, `delete`, `invite`; `write` and `family_authors` are removed from it for **new** letters and replaced by the gate. Starting to compose is never blocked: the check runs when a letter is about to be saved as a new entry, and an in-progress letter is never discarded (PRD-REQ-025). Reading, playing and exporting never consult entitlement, so the type system still makes a gate on them impossible (LEGAL-REQ-050).
- **Decision input.** `DecideInput` gains `lettersUsed` (letters counted toward the allowance) and `freeLettersAllowance` (remote config, default 2). `decide({feature:'add_letter'})`: book or own Plus active (family authors ride the book's membership) -> allow; `lettersUsed < allowance` -> allow `free_letter`; otherwise offer `letter_limit` (new `OfferTrigger`) with `needsSignIn = !signedIn` (R-1). `decide` stays pure.
- **Offer rules.** C-REQ-023's rules (never in first run, during recording or on a birthday, never to contributors) conflict with a paywall at the limit. Which suppressions still apply at the limit is not decided; the in-progress letter must in all cases stay safe on the phone (14.3 edge 3). Unverified until decided.
- **Counting.** The counter is "letters saved by this account" (what counts is open edge 1 and 2 in 14.3). Where it lives, device or server, is open edge 4; compare 2.4 and D-037, where a device count was accepted because the thing counted cost nothing. A device-only count can be reset by reinstalling and gives a second device a fresh allowance, so a server-side check on entry creation is the recommended direction (Rec, unverified against founder intent).
- **Lapse.** After Plus ends, `lettersUsed` is above the allowance, so `add_letter` returns an offer; every existing letter stays readable, playable and exportable.

### 14.2 Engineering TODO (for owners; not started)

1. **Core (`packages/core`):** `add_letter` gate, `letter_limit` trigger, new truth-table rows (below), property test "going over the allowance never changes a read, play or export decision".
2. **DB tables (data architect):** a place to count letters per account (a column or a view over `entries`), and an allowance read from `app_config`; keep `entitlements` as is. Whether `create_child` rules (a) to (d) in 2.5 change is open edge 2 and 6.
3. **Server enforcement (edge function or RPC):** a letter-creation rule beside `create_child`, raising a `plus_required`-style error (SQLSTATE style as in 2.5) when the account is over the allowance and has no Plus now (with an offline rule like (d) if edge 7 is decided). `raw_transcript` immutability and all edit triggers are untouched.
4. **App gate (mobile):** check at save; on refusal keep the letter as an unsynced local entry, show the Plus sheet once, and sync it when Plus starts; never delete or hide it (same pattern as 2.5, D-038). Remove or reword the lapse sheet strings that say "you can keep writing".
5. **Remote config (D-035):** add `free_letters_allowance` (default 2, audit-logged).
6. **Tests:** engine fixtures; DB free-tier tests (account with 2 letters can save a 3rd only with Plus; refused letter is not deleted; export and read paths pass for a lapsed account with many letters); E2E-L extended to a lapsed account adding a letter; Apple sandbox run of paywall at the limit. The existing free-tier DB tests assume unlimited free writing (unverified which files; the data and payments engineers find them).
7. **Analytics (analytics engineer):** content-free events for allowance reached, paywall shown at the limit, letter held on phone, Plus started from the limit; no entry text or counts per child that identify content.
8. **Paywall copy, disclosures and App Store review notes** (content, legal; counsel review before release): see ROADMAP section 9.
9. **Offer codes (D-052):** map `OFFER_REDEEMED` and following `SUBSCRIBED` or `DID_RENEW` notices to `entitlements` with the real end date; a "Redeem a code" row (PRD-REQ-027); confirm the notice windows cover an offer-code free period (unverified); confirm `expo-iap` exposes the redemption sheet (unverified).

New truth-table rows to add to 2.3 (fixtures; `A` = allowance 2, `L` = letters used): add_letter Free L=0 or 1 -> allow free_letter; Free L=2 -> offer letter_limit; own Plus any L -> allow; contributor in a Plus book -> allow plus_book; lapsed L=40 -> offer letter_limit and read, play, export still allowed; remote config A=3, L=2 -> allow. Rows 1 to 12 (`start_book`) stand until open edges 2 and 6 are decided.

### 14.3 Open edges (from D-051; not decided here)

1. Do family letters count toward the 2 free letters?
2. What does a second child's book get without Plus?
3. In-progress letter at the limit: recommended never lost or discarded, kept on the phone, Plus offered.
4. Entitlement counted offline: device or server (compare D-037).
5. Read together's 3 free sessions versus the new free allowance.
6. First-run children free (D-007, D-008, PRD-REQ-015) and joined books.
7. Letters made offline past the limit.
8. Lapsed and trial-ineligible users: what the sheet says.

---

## Changelog

| Version | Date | Change |
|---|---|---|
| Draft 1 | 2026-10-03 | First TDD for payments and entitlements |
| Draft 1 + D-051 | 2026-10-04 | Banner, membership model change, section 14 TODO list, offer-code line (D-052). RevenueCat text not yet revised to ADR 0013. |
