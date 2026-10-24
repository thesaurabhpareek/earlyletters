# Q-013: The membership engine (what counts as a letter, the gate, reinstall, price display)

Format: DEBATES.md entry. Note on the id: the brief called this Q-010, but Q-010 to Q-012 already exist on `origin/develop`, so this is Q-013. Prepared 4 Oct 2026 by the payments and product debate lane. It prepares the decision; the founder decides. Nothing here is built.

## 1. Question

The founder decided Plus is a membership. The app does not do it yet. How exactly should "the first 2 letters are free, then Plus" work on one phone, with no account and no server, so it is fair, cannot be reset by reinstalling, never loses a recording, and passes Apple review?

## 2. Facts

**Decided (not reopened).** Recorded as D-051 and D-052 on `origin/main` and `origin/docs/pricing-membership`, and as D-080 and D-081 on `origin/integration/develop-plus-main`, because develop already uses D-051 for "Standard over custom". Neither is on `origin/develop` yet. Content: Plus membership; first 2 letters per account free; existing letters always readable, playable, exportable; one membership covers the book; $3.99 a month with 1 month free or $29.99 a year with 2 months free; Apple only; Apple offer codes (D-081, mechanism "Recommended"); Family Sharing on. The founder also set v1.0 as on-device only (D-053 on develop: no server sees purchases).

**Open edges D-080 lists:** family letters (1), second child (2), in-progress letter at the limit (3), offline counting (4), Read together vs the new allowance (5), first-run children (6), letters made offline past the limit (7), lapsed users (8). This entry answers 2 to 8 with recommendations and shows 1 is moot in v1.0.

**Conflict to note.** D-080 says "client sheet plus server enforcement" and D-081 says the server reads `OFFER_REDEEMED`. D-053 says no server. This entry follows D-053 (the founder's v1.0 scope). Server enforcement waits for v1.1.

**What the code does today** (`origin/develop`, `cfdca3f`):
- `packages/core/src/plan.ts:22,37-42`: `write` is in `FreeForever`, and a compile-time check (`NO_OVERLAP`) makes it impossible to gate writing. This is LEGAL-REQ-050. The new decision needs a deliberate edit here.
- `plan.ts:167-170`: the only gate is `start_book` (first book free, more need Plus). No letter gate, no counter.
- `plan.ts:187,190`: `decide()` goes quiet on birthdays and offline. Right for a sales nudge, wrong for a gate on the person's own save: quiet would mean the letter is neither kept nor explained.
- `apps/mobile/src/app/review.tsx:294-302` (typed or spoken save) and `:358-370` (voice kept without words) are the two places a letter is created, through `saveLetterFromDraft` (`lib/store.ts:398`), which inserts the letter and deletes its draft in one transaction.
- The draft exists before Review opens (journey J05-03: "the take is kept first"). So the recording is already safe when we could gate.
- `app/(tabs)/index.tsx:98`: "Not much today" saves `kind: 'not_much'`, a different kind from `'letter'`.
- Copy that is now false: `packages/content/src/features/billing.en.ts:25,27` ("Your first book is always free", "free, always"); `strings.en.ts:782,784,838,956`.
- Products: `plus.monthly`, `plus.annual` in one group (`billing/config.ts:10`); prices are not in code, Apple's store view shows them (`config.ts` header). `storekit/EarlyLetters.storekit` has 3.99 and 29.99 in `en_US`.
- The app already keeps the sign-in session in the Keychain as `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (`lib/supabase/secure-storage.ts:2-9`), so a Keychain wrapper exists.

**Sources read (4 Oct 2026).** All Apple pages were read through a summarizing fetch tool, so wording below is the tool's quote or paraphrase. Re-read before submission.
- App Review Guidelines 3.1.1, 3.1.2(a), (c): read. 3.1.1 bans own unlock mechanisms (license keys, QR codes). 3.1.2(a) asks for "ongoing value" and says apps must not "trick users into purchasing a subscription under false pretenses or engage in bait-and-switch". 3.1.2(c): "clearly describe what the user will get for the price".
- Apple "Auto-renewable subscriptions" page: read. Sign-up screen needs name, duration and what is provided; full renewal price "most prominent pricing element"; trial length and price after it; Terms and Privacy links; a way to restore purchases; one introductory offer per subscription group; Family Sharing up to 5 people.
- Apple "manage pricing" page: read. 800 price points per currency; one base price auto-equalised to 175 storefronts; per-storefront overrides; "keep current price for existing subscribers". It names $3.99 and $29.99 as selectable. Treat as confirmed enough to proceed; the founder sees the exact points in App Store Connect.
- Apple StoreKit pages (`presentOfferCodeRedeemSheet`, `isEligibleForIntroOffer`): did not render in this sandbox. **Unverified.**
- Apple Developer Forums (search results only): keychain persistence across app deletion is "a side-effect of the implementation", "not guaranteed", never documented.
- Competitors (search snippets, pages not opened, **unverified**): Qeepsake free is one question a week, paid about $46 to $125 depending on plan; Day One free is unlimited entries, 1 photo per entry, paid $49.99 and $74.99 a year; Tinybeans free is 20 uploads a month with ads, paid $74.99 a year or $7.99 a month.
- Q-003 memo (`docs/legal/memos/q-003-subscription-notices.md`): read. Position is Open until counsel answers; default applies 23 Oct.

## 3. The central choice: how the free count is kept

### Option A: count in the app database only
- **Product:** simplest; the count is the letters on the phone. **Engineering:** an hour of work. **Privacy:** nothing new.
- **Red team (legal, product):** delete the app and the 2 free letters return. Reinstall is the most common thing a phone owner does, so "first 2 per account" becomes "2 per install". Plus delete-and-rewrite: keep, delete, keep again is endless. Weak against both.

### Option B: a never-decreasing "letters ever kept" number, in the database and in the Keychain (recommended)
- **How:** one integer, `lettersKeptEver`. It goes up by one inside the same transaction as `saveLetterFromDraft` the first time an entry id is saved. Undo, restore from Recently deleted, edits and moving a letter between the book and private never change it. The gate uses `max(lettersKeptEver in Keychain, in database, letters present on the phone)`. Keychain item `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, no iCloud sync, same wrapper as the session.
- **Engineering:** reinstall on the same phone keeps the number; an iCloud device backup restore brings the database back, and the letters present give the count even though the Keychain item does not travel. Cost about 1.5 engineer-days plus tests.
- **Privacy and legal case:** one integer, no identifier, no content, never leaves the phone, not backed up. Nothing is collected, so no Privacy Label line (**unverified** against Apple's label rules; counsel confirms). The Privacy Policy gets one sentence. Do not store a device id, a hash or a timestamp of installs; that edges toward fingerprinting.
- **Red team (engineering):** Apple says Keychain survival is not guaranteed, so it can fail silently, and a person who buys a new phone with no backup gets 2 letters again. Answer: both failures are on the safe side (the person gets a gift, never a lock-out), the new-phone case means their letters are gone anyway, and the only person who gains is someone who wipes deliberately. We accept that leak rather than fingerprint people. (Product red team:) a person who deletes a mistaken test letter loses a free slot. See founder question 2.

### Option C: tie the count to the Apple Account with iCloud key-value storage
- **Case:** survives a new phone and matches "per account" most closely; no server of ours; Apple holds it.
- **Red team:** a new iCloud entitlement and a new Apple-linked data flow that the Privacy Policy, labels and App Review notes do not mention today (`app.config.ts` shows Sign in with Apple only; no iCloud entitlement found, **unverified**). Needs network timing logic for first launch. One more reason for review questions in the first submission. Better for v1.1 next to the server count (D-037 pattern).

**Recommendation: B now; revisit C or a server count in v1.1.**

## 4. Where the gate appears

| | Before recording or typing | At Keep (recommended) |
|---|---|---|
| For | Honest early; no effort wasted | Nothing is lost: the draft already exists; a parent can capture a first word the moment it happens |
| Against | Blocks capture of a moment that cannot be repeated, the worst failure for this product; hits people exactly when they are ready to give | The person has already spoken, so it can feel like a toll. Needs heads-up earlier, and a visible way to keep the letter anyway |

Recommended: never gate capture. Gate at the Keep buttons in Review and at Write's save. Soften it three ways: (1) the Welcome line "Your first two letters are free" (the website already says it, `apps/web` `site.ts`, per the product critique); (2) after the second letter is kept, one calm line on the saved card, once; (3) the gate sheet keeps the held letter in view and says it is safe.

**What "held" means.** The draft stays exactly where it is. Tonight already shows "A letter is waiting" for drafts (J06-12). No new table. Held letters are playable, readable and exportable; they are not in the Book until kept. After Plus starts, the person returns to that letter's Review and taps Keep themselves. We do not keep it for them: Review is where the words are checked and tidy-ups are reversible. No cap on held drafts in v1.0; if data shows abuse, add one.

**Never lose a recording:** the gate runs after `ensureAudioHash` and before `saveLetterFromDraft`. If the sheet closes, the app is killed, or the phone is offline, the draft is untouched.

## 5. Recommendations on each open edge

| Edge | Recommendation | Why |
|---|---|---|
| What counts | Counts: a saved `kind: 'letter'`, spoken or typed, in the Book or private, including a voice letter kept without words. Does not count: drafts, abandoned takes, "Not much today" (`not_much`), edits, undo, restore, views. | One clear sentence for the person: "a letter you keep". Private counts, or "Keep private" becomes a bypass. |
| A silent or empty take | Counts if the person keeps it. Review offers "Record again" first (product critique J05-08). | We never decide what a letter is worth. |
| Deleted letters | Still counted (`lettersKeptEver`). Founder question 2. | Stops delete-and-rewrite. |
| Quiet-day notes | Never count. Separate issue: the current note writes words for the parent (critique J08-02); the founder's call on removing that text stands apart. | Constitution. |
| Family letters (edge 1) | Moot in v1.0: co-parent only (D-055), no sync, no family authors can exist on this phone. Rule for v1.1: covered by the book's membership; the author's own count does not apply. | Matches D-080 item 4. |
| Second child, twins (edge 2, 6) | One pool of 2 letters per account across all books. Creating more books is free; Plus covers every book. Remove the `start_book` gate. | One wall, not two. Twins and a toddler plus newborn just work. Costs the "second child" sales moment; the letter gate arrives anyway. Founder question 1. |
| Offline (edge 4, 7) | The count is local, so offline works. Buying needs the network: the gate says so and keeps the letter. Letters made offline past the limit cannot exist in v1.0 (no server). | D-038 rule (never delete or hide) applies later. |
| Read together (edge 5) | Ungate it for letters that exist; remove the 3-session limit. Membership gates adding. | Existing letters are "always readable, playable" (D-080 item 3). Two walls on a free family is the worse experience. Founder question 3. |
| Lapsed (edge 8) | Counter stays above 2, so the gate returns. Sheet copy: "Plus has ended. Every letter stays yours." Never says "free trial" (Apple shows a trial only to eligible people; one offer per group). | Honest and quiet. |
| Birthday and first run | The "no offers on a birthday" rule stays for nudges. It does not apply to a gate the person triggered by tapping Keep. | Otherwise the save does nothing. Founder question 4 asks whether the birthday letter is free. |
| Erase everything | Clears the Keychain count. | A deletion request means deleting; the leak is deliberate and rare. Counsel confirms. |

## 6. Trial, renewal, offer codes, price display

**Reminders (Q-003).** Promise only what is built. Per the memo: Apple's own receipts and price notices, plus on-device reminders (local notifications and an in-app card) for the person who bought it, windows from D-022. The gate and Plan screen never say "we will email you". If counsel disagrees by 23 Oct, only copy changes, not the gate.

**Offer codes (D-081).** Use Apple's redemption sheet from a "Redeem a code" row in Settings, Plan and a quiet link under the gate. A code makes the person a member (no gate during the period). On device there is no server to read `OFFER_REDEEMED`; the entitlement arrives through StoreKit's transaction updates, which the app already listens to. Whether `presentOfferCodeRedeemSheet` can be called from the in-house `scribe-store` module is **unverified**; the module has no offer code function today. Tester wording: say the free months end and Plus renews unless turned off (runbook `docs/ops/OFFER_CODES.md`, branch `docs/offer-codes-runbook`). Whether Apple lets a code period not convert is **unverified**.

**Price points and countries.** $3.99 and $29.99 are selectable price points (Apple page above); the repo's StoreKit file already uses both. v1.0 is United States only (LEGAL-REQ-058; `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` row "Availability"), so no other storefront sees a price at launch. When countries open, Apple equalises from the US base; local prices will not be round and are fine. Keep: no price typed in app copy (Apple's view shows the storefront price). The website shows US prices (D-075), so add "US prices" there when a second country opens. Never raise an existing subscriber's price; use "keep current price" (memo point 4).

**Equal display or annual emphasis.**
- Equal (recommended; today's behaviour): Apple's subscription view, annual listed first, neither preselected (`config.ts:10`), annual saves about 37 percent against twelve months ($47.88 vs $29.99, arithmetic). Passes the "most prominent amount is the billed amount" rule by construction.
- Annual emphasis (preselect annual, monthly as a small link): higher revenue per buyer, and a two-month trial then a $29.99 charge is the classic surprise. Red team: 3.1.2(a) names bait-and-switch; the founder's own tone rules out pressure. Rejected.

**Does a subscription that gates adding letters pass 3.1.2(a) "ongoing value"?** Likely, since new letters, playback and the book are continuing use, but the guideline text does not settle it. **Unverified.** App Review notes must say: 2 free letters, gate at the third, existing letters always accessible, restore available, no own unlock mechanism.

## 7. Revenue and conversion sanity note (ASSUMPTION, NOT DATA)

No cohort data exists. Illustrative only, per 1,000 installs: 55% keep a first letter; 35% (350) reach the gate; 10% of those start a trial (35); 45% of trials pay (about 16); 60% choose annual (9.5 annual, 6.5 monthly); monthly payers stay about 4 months. Gross about $285 + $104 = $390, roughly $0.39 an install, about $0.33 after Apple's 15% if the Small Business Program applies (**unverified**). Halving or doubling any step moves it 2x. Read it as: the gate must reach people before they stop opening the app, which is why the allowance is 2 and why a soft heads-up matters more than the price. Benchmarks (unverified above) show rivals either give away entries (Day One) or limit by cadence (Qeepsake); a 2-letter cap is the tightest, so measure the share who reach letter 3 and the share who keep it after the gate, content-free, and review at 500 gates.

## 8. Change list (for a build agent after the founder says yes)

1. **`packages/core/src/plan.ts`:** remove `'write'` from `FreeForever` only as a documented, tested exception; add `keep_letter` to `GatedFeature`; replace the `NO_OVERLAP` proof with one that still blocks gating of `read`, `play_recording`, `export`, `delete`, `restore_backup`. New pure `decideKeepLetter({ now, plan, lettersKept, allowance })`: allow if `planActive` or `lettersKept < allowance`; else offer. Never quiet; offline and birthday change copy only. Add `DEFAULT_FREE_LETTERS = 2`, remote key `free_letters_allowance` (may only raise, like `freeTriesFrom`). Remove `start_book` and Read together gating if founder answers yes to 1 and 3. Update the three comments (header, line 14-16 promise).
2. **`apps/mobile/src/lib/billing/`:** new `letter-ledger.ts` (Keychain read and write through the existing secure-storage wrapper; database mirror in settings key `letters.keptEver`; `lettersKept()` = max of three sources; `recordLetterKept(id)` idempotent per id; `clearLedger()` for Erase everything). `gates.ts`: add `keepLetterGate()`. `index.ts`: export. `plan.logic.ts`: lapsed variant (`plan state expired` plus count above allowance).
3. **`lib/store.ts`:** call `recordLetterKept` inside the transaction in `saveLetterFromDraft`.
4. **`app/review.tsx:294` and `:358`, and the typed save path:** run `keepLetterGate()` after `ensureAudioHash`; on offer, open the gate sheet and return without saving; on Plus, carry on. After Plus starts, reopen the same Review by draft id.
5. **`components/child/plus-gate.tsx`:** add a `keep_letter` variant (title, body, held line, secondary "Keep this one for now", "Redeem a code" link). `app/settings/plus.tsx`: new status line, price and trial from Apple's view only, "Redeem a code" row.
6. **`modules/scribe-store`:** add offer code sheet function (verify the StoreKit API on a device first).
7. **Content (`packages/content/src/features/billing.en.ts`, `strings.en.ts`):** replace the false lines at `billing.en.ts:25,27` and `strings.en.ts:782,784,838,956`. Draft copy (rules pass: no dashes, no gender, nothing about who writes):
   - Gate title: "Keep adding to {child}'s book". Body: "Your first two letters are kept, and always will be. To add more, join Plus." Held line: "This letter is safe on your phone. Come back to it once Plus is on." Buttons: "See Plus", "Keep it on my phone for now".
   - Lapsed body: "Plus has ended. Every letter stays yours to read, play and export. To add new ones, Plus can start again."
   - Saved card after letter 2 (once): "Added to {child}'s book. That was your second free letter."
   - Plan row: "Your first two letters are free. Plus lets you keep adding."
   - Welcome line: "Your first two letters are free."
   - Never in app copy: price, "free trial", "free months", "we will email you".
8. **Analytics (`docs/analytics/TRACKING_PLAN.md`):** `free_allowance_reached`, `keep_gate_shown`, `letter_held`, `plus_started_from_gate`, `offer_code_redeemed`. Number fields only, no entry text, no child name.
9. **Docs:** Privacy Policy one sentence; Subscription Terms "What is free"; App Review notes; DECISIONS row for this entry; website `site.ts` parity.
10. **Tests:** core: `decideKeepLetter` table (0, 1, 2, 3 kept; each plan state; remote allowance 0, 2, 100, junk; `read`, `play_recording`, `export` still ungateable). Mobile `billing-plan.test.ts`: ledger idempotent per id, delete and undo do not change it, max rule on a restored database, Keychain missing, Keychain higher than database, erase clears. Review: draft is untouched after a gated Keep, kill and relaunch shows the waiting card, Keep after purchase saves once. Content rules: new strings pass `rules.test.ts`. Entitlement fixtures for an offer code period. Check that export includes held drafts (**unverified today**).
11. **Device pass (S1 plan):** reinstall same phone, restore from iCloud backup, new phone, airplane mode at the gate, sandbox buy from the gate, offer code, Family Sharing member.

## 9. What would change this recommendation
- Counsel rejects a Keychain count as "device tracking": fall back to A for v1.0 and accept per-install, or go to C.
- Apple review rejects a subscription that gates adding letters under 3.1.2(a): move the line to "backup and Read together" or raise the allowance.
- First data shows under about 25% of installs reaching letter 3 or under about 3% of gates converting: reconsider the allowance (founder).
- A device test shows the Keychain item is lost on reinstall: ship A plus a clear plan for C.

## 10. Questions only the founder can answer
1. Books: may a free account create more books (one pool of 2 letters across all books), removing the second-book gate? A: yes (recommended). B: keep it.
2. Does a deleted letter give its free slot back? A: no, it counts (recommended). B: yes, if deleted within 24 hours of keeping.
3. Is Read together free for letters that exist (no 3-session limit)? A: yes (recommended). B: keep 3 sessions per book.
4. Is a letter kept on a child's birthday free even past the allowance? A: no, one rule for all days (recommended). B: yes, one gift letter a year per book.
5. Does Erase everything also reset the free count? A: yes (recommended). B: no.
6. After Plus starts, does the person tap Keep on each held letter? A: yes (recommended). B: keep them automatically.

- **Affected:** payments, mobile, content, legal and privacy, design, analytics, QA.
- **Status:** Escalated to the founder.
