# Executive review: Chief Business Officer (Claude role), NS-53 Moments tab

Status: PROPOSED review input (nothing here is decided; every change is the founder's to sign)
Date: 21 Nov 2026
Reviewed: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 5bebd892, read in full (1187 lines), plus `packages/core/src/plan.ts`, `docs/DECISIONS.md` D-082, `docs/prd/v2/features/F14-plus.md` section 3, `docs/product/prd/27-photo-moments-and-media.md` sections 20 and print rows, and the X4 compliance lead on `wip/moments-x4`.
Seat: section 25.4 labels this letter "brand". My seat is business: the business model, Plus and what it holds, pricing, distribution, partners and vendors. I answer the two brand questions in EX-CBO-8 and EX-CBO-9 because they were asked, but the rest is business.
Not advice: I am a role a Claude session plays, not a banker, lawyer or accountant. Anything about Apple, licences or law below that I did not read in this session is marked UNVERIFIED and goes to counsel through the CLO.

## Verdict: ACCEPT-WITH-CHANGES

The spec is sound for the business as written, because it touches nothing I would veto: nothing in Moments is gated, no price or trial appears, no server sees a purchase, and nothing library-derived leaves the phone. The changes are about what the spec leaves unsaid.

Conditions (each maps to a finding):

1. C1. Add one row that says Moments adds no entitlement, never reads plan state, and shows no Plus surface. State what happens when a parent starts a letter from a card and meets the Keep gate (EX-CBO-1, EX-CBO-2).
2. C2. Keep the daily-return claim a HYPOTHESIS everywhere, forbid it in any public or fundraising text until read, and fix the measurement plan, because analytics is off at 1.0 (EX-CBO-3).
3. C3. Put a dated fallback rule and a named decider on the release gates, so a slipping gate cannot silently move the store date (EX-CBO-4).
4. C4. Read the place table licence and fix the vendor and attribution position before G1, not after (EX-CBO-5).

## Counts

BLOCKER 0, MAJOR 5, MINOR 4. Nine findings.

## Is the free-forever core still ungated? Yes.

Read in `packages/core/src/plan.ts`: `GatedFeature` is only `keep_letter` and `theme_extra`; `FreeForever` lists read, play_recording, export, family_authors, invite, download_backed_up_audio, restore_backup, backup_upload and delete, and a compile-time check fails if the two overlap. The spec adds no gated feature. The tab, For you, Recent, the library read, places and occasions are all free. Note the precise record, which the brief's phrase "free-forever core" blurs: D-082 makes the first 2 letters free and the Keep step of a third letter Plus. What is free forever is the list above, not "writing". Moments sits entirely in free territory, but it feeds the one gated step (EX-CBO-1).

## Findings

### EX-CBO-1 (MAJOR): the spec never mentions Plus, yet Moments exists to start letters into the one gated step

- Requirement ids: NS-53-R108, NS-53-R85, NS-53-R6, NS-53-R172, section 2.2 (last bullet), section 4.5 (Home pointer).
- Finding: A search of the 1187 lines finds no use of Plus, the allowance, the paywall or `keep_letter`. The only paid-feature line is "No paid feature depends on the library (MT-X4-R11)" (section 2.2), which is an Apple permission rule (5.1.1(ii)), not a business rule. Meanwhile the tab's whole job is to make letters start (section 1.3), and R108 sends Keep to the Book. After the second kept letter, every letter a parent starts from a Moments card ends at the Plus gate. `plan.ts` says drafts are never blocked and a held draft stays untouched, so no words are lost, but the tab is built to lead a tired parent to a Keep step that then asks for money. The spec does not say how that looks, who owns the screen, or that the tab itself must never show a Plus surface. A reviewer cannot tell from this file whether Moments may reveal an offer.
- Proposed change: Add one row (P0 (a), phase 1, L0 and L1): "Given Moments in any state, Then it adds no gated feature, imports no plan or entitlement type, shows no Plus, price, trial, allowance, lock or count of letters left on any card, ask, nudge or email, and a Keep reached from a Moments card meets the existing Keep gate with no Moments-specific copy." Add a source scan that fails if `apps/mobile` Moments code imports `PlanView` or a Plus module. Do not add a public sentence saying Moments is "free forever"; that is a promise whose scope counsel has not answered (counsel pack Q14, named in the CBO skill) and the internal compile-time rule is enough.
- Evidence: `packages/core/src/plan.ts` header and types (read this session); `docs/DECISIONS.md` D-082 (found at line 545, heading only read); spec searched by grep for Plus, paywall, allowance, `keep_letter`, subscription, upsell (no hits beyond unrelated words).

### EX-CBO-2 (MAJOR): Moments is an activation feature, not a revenue feature; the pre-committed Plus rules will see a changed baseline

- Requirement ids: NS-53-R174, section 20 (E2), section 4.4, section 19.3 phase 1.
- Finding: The honest business read is that Moments should raise first letters, and a first letter feeds the headline number (paying families over first-time downloads, F14 section 3) only if letters 1 and 2 turn into a wish for letter 3. Nothing in the spec says Moments raises willingness to pay, and I do not claim it does. The F14 section 6.9 rules (raise the allowance from 2 to 5 if starts are under 4% of first-time downloads at T39; test price at T40 if annual trial-to-paid is under 30%) are read from App Store Connect, which has no flag state. If Moments is on for some cohorts and off for others, or a parent burns both free letters in the first week because the tab makes starting easy, the T39 and T40 reads shift and nobody will know why. A Moments-driven letter also arrives at the gate with more emotional investment (a chosen day, attached pictures), which raises the trust cost of that gate and is why EX-CBO-1 matters.
- Proposed change: (a) State in section 20 that Moments does not change the F14 section 6.9 rules or numbers and that they are read as written. (b) Record the Moments flag state (F1, F2) per build in the release record so install-week cohorts can be split after the fact from build numbers, with no telemetry. (c) Add to E2 a plain read: the letters kept per family in the first 14 days by build, from the founder's own TestFlight group, as "x of n", not a rate. (d) Do not propose any pricing change here; if the T39 rule fires, the founder and the CFO decide with the build split in hand.
- Evidence: `docs/prd/v2/features/F14-plus.md` line 59 and line 357 (rules table; the numbers themselves read via the CBO skill and the F14 table, not re-derived); spec section 20 read; the 4% and 30% thresholds are the repo's [A], unverified by me.

### EX-CBO-3 (MAJOR): the daily-return claim is a hypothesis, and as written the release cannot test it

- Requirement ids: NS-53-R167, NS-53-R174, G-2 (section 2.1), O-04, section 4.4, RK-7, section 20 (E2, E4).
- Finding: The spec labels the claim a HYPOTHESIS once and I agree it should stay one. P1 recommended dropping it; the spec keeps it as "a real reason when something real exists, and one honest card otherwise". Three business problems. First, analytics is off at 1.0 (section 18), so the first release records no card impressions, no opens and no letters started from a card. Goal G-2 is measured by "letters started with `source: moment` among opted-in analytics users", which is an empty set at 1.0. Second, E2 needs n of at least 20 per group on two TestFlight builds; the TestFlight audience is small and the spec gives no size, so E2 may never reach 20 and nobody should read a percentage. Third, the claim will be tempting in a deck, in store copy or in a founder post, and no number exists behind it. The category's own public numbers are small (about 93,300 paid families across Tinybeans and Qeepsake, FY26, per `04-market.md` from R3, repo [F]); I will not let a retention story stand in for a measured one.
- Proposed change: (a) Add a row: no document, store text, post or investor material may state or imply that Moments drives daily or repeat use until a read exists with n stated; the word is "may". (b) Replace G-2's measure with what exists at 1.0: App Store Connect retention by install-week cohort (consent-free, F14 section 3) plus the diary (E4) and the founder's own TestFlight letters kept, all "x of n". (c) State plainly in section 20 that the daily-return hypothesis is not testable from production at 1.0 and name the earliest build where the analytics registry rows of section 18 could run, with consent, so the read has a date. (d) Keep O-04 at its default (hypothesis, one honest card a day).
- Evidence: spec sections 4.4, 18, 20 and O-04 read; `docs/prd/v2/features/F14-plus.md` line 59 (ASC is the consent-free source); R3 figure quoted as the repo's [F], not re-read.

### EX-CBO-4 (MAJOR): the release gates are a schedule risk and a spend decision, and the fallback has no trigger date or owner

- Requirement ids: NS-53-R171, NS-53-R169, section 21 (G1 to G10), section 19.3 (fallback paragraph), RK-12, RK-1, RK-2.
- Finding: The founder's ruling puts the library read in the first release. Ten gates stand between that and store submission; G2 (counsel), G8 (counsel and privacy, only if the geocoder is wanted) and G9 involve outside professionals, and G10 is the founder's own signature. The company is one person (the council file). Each counsel read costs money and founder hours, which the spec does not estimate, and the CFO owns the numbers. The fallback ("F2 stays off, the tab ships on its no-library content") is credible technically (K1 to K4, R170) but it is a weak first impression and the spec gives no rule for when to pull the trigger. Without a date, a late G2 answer turns into a slipped store date by default, which is the expensive outcome (RK-12 is "Medium, high"). Also note a rejection by App Review on the usage string (RK-2) can be fixed in a point release only if the build exists with the flag controllable; R169 allows that, which is good.
- Proposed change: Add to section 21 a decide-by rule: a named date before submission by which each of G1, G2, G3, G5, G7 and G10 must have a dated read-out, and the default if one is missing is "F2 off for this build, tab ships, library read follows in the next build", decided by the founder with the CFO's cost of a slipped date. Ask the CFO to price the counsel hours for G2 and G8 as a capped brief (a ceiling, not an open meter). Let the CLO prepare that brief; I will not present any reading of 5.1.2(vi) as advice. No gate is dropped.
- Evidence: spec sections 19.3, 21, 22 read; effort ranges (28 to 34 agent-days, 2 to 3, 8 to 11) are the spec's ASSUMED figures quoted from the reconciliation pack, not mine; counsel costs UNVERIFIED (no quote exists).

### EX-CBO-5 (MAJOR): the bundled place table and the optional Apple geocoder are the only vendor and data-licence dependencies, and neither is read yet

- Requirement ids: NS-53-R61, NS-53-R62, NS-53-R63, NS-53-R117, section 7a.1, RK-5, G1, G8, O-31, F3.
- Finding: The recommended place route (P-A) is an offline table bundled in the app, which is good business: no recurring fee, no runtime vendor, no per-lookup cost, nothing leaves the phone. But the table has an author. The spec says the licence, size and accuracy are UNVERIFIED (RK-5, section 27) and puts the licence read inside G1, a device spike. A licence that needs attribution, forbids redistribution inside an app, or changes terms is a business and legal risk, not a device-performance question, and it should be settled before engineers build against a dataset. Separately, the dataset will go stale (names and boundaries change), so someone owns refresh. P-B (Apple's `CLGeocoder`) would add a dependency on Apple's service terms, rate limits and logging, all of which the spec marks UNVERIFIED, plus a new consent and label surface; it is correctly held off behind F3 and G8. I could not read any dataset licence or Apple's geocoder terms in this session (a fetch of a candidate dataset's licence page was refused), so I name no specific dataset and assert nothing about any licence.
- Proposed change: (a) Move "dataset licence read" out of G1 into G2's counsel brief and make it a precondition to adopting any dataset: permitted use in a shipped app, attribution wording and where it shows (for example Me, About), redistribution, update terms. (b) Prefer a source whose licence is on file in the repo; commit the licence text next to the table. (c) Name an owner and a refresh trigger (yearly, or when a name is reported wrong). (d) Keep P-B off at launch and do not advertise "venue names" anywhere; if the founder wants it (O-31), the CBO position is that it adds a dependency on a service Apple can change, with no revenue upside, so it stays behind G8. (e) CFO to confirm the table adds no recurring cost (expected none).
- Evidence: spec 7a.1, RK-5 and section 27 (all UNVERIFIED items) read; no licence or Apple term read by me, UNVERIFIED.

### EX-CBO-6 (MAJOR): the photos Moments attaches become book and print material; the spec is silent on keeping print possible

- Requirement ids: NS-53-R85, NS-53-R108, section 10.1 step 9 (attach: copy, strip, resize, store), NS-52-R26 and NS-52-R27 (in `27-photo-moments-and-media.md`).
- Finding: Print is a future launch (D-010, K-32; the Year One hardcover plan, BK-14), not in this release, and I do not recommend moving it. But Moments will raise the number of letters that carry pictures, and the attach step copies, strips and resizes each one. If the stored size is set only for screen use, a later printed page will be low-resolution and the print launch inherits a quality problem that cannot be fixed for photos already attached. The 27 spec already plans a low-resolution warning at print time with the threshold coming from the print vendor (UNVERIFIED); the 28 spec says nothing and does not state the resize target. In the other direction, the place and occasion labels are never saved into a letter unless the parent chooses it as text (R63), so no machine label will appear on a printed page uninvited. That keeps print consistent with the constitution.
- Proposed change: Add one row: the resize target for attached pictures is the same one NS-52 sets for letters generally, chosen to keep a print-quality original, and is recorded as data, not a Moments-specific value. Add one non-goal line: no print, gift, keepsake or "make a book from this day" surface in Moments in any phase of this PRD; that decision waits for the founder to lift D-010 and K-32 and for firm vendor quotes. A gift or lifetime idea (F43) also stays out. No new spend, partner contact or account is proposed.
- Evidence: spec section 10.1 (step 9 text cut off in my read after "strip"; the resize figure was not found in the 28 spec) and `27-photo-moments-and-media.md` NS-52-R26 and R27 (read); BK-14 and D-010 as quoted in the CBO skill (not re-read this session).

### EX-CBO-7 (MINOR): the lifecycle email must stay free of any Plus or offer content, and its vendor is not named

- Requirement ids: NS-53-R141, NS-53-R143, NS-53-R140, section 13.6, RV-09, O-03.
- Finding: Section 13.6 says "no offer, no upsell" in prose, but R141 and R143 (the testable rows) do not repeat it. An email with a price, trial or Plus line is plainly commercial, changes its CAN-SPAM class and breaks the engagement promise. The email is the one retention channel that does not depend on the library, so it is the one I would protect from becoming a marketing channel by drift. The spec also names no sending service, cost or suppression owner; the production profile already has server features on (RK-9), so a vendor exists in practice. Cost per email at expected volume is the CFO's number and is likely small, but UNVERIFIED here.
- Proposed change: Add to R141: the email body fails the content test on any price, trial, Plus, allowance, discount or print word. Ask the CFO for a one-line cost ceiling for the phase 2 email and the CLO to confirm the sending vendor's terms are on file. Phase and dark-first posture stay as written.
- Evidence: spec 13.6 and rows read; no vendor terms read, UNVERIFIED.

### EX-CBO-8 (MINOR): does a computed place or occasion label fit "we never write your words"? Yes, with one public-wording condition

- Requirement ids: section 7a (firewall F1 to F8), NS-53-R63, NS-53-R67, section 25.4 first question.
- Finding: Inside the product, the promise holds as specced: the label is ours, visibly so, removable ("Not this place"), replaceable by the parent's words, never saved into a letter unless chosen, with no machine title, caption or person. A date, a weekday and a city from a picture's own location are facts about the parent's pictures, not words added to the parent's words. The business risk is outside the app: a public sentence such as "we never add anything" or "we never touch your pictures" would be false once labels exist. Marketing copy belongs to the CMO and the claims registry, so I only flag it.
- Proposed change: Ask the CMO to word the public promise as about the parent's words ("your words stay yours"), not about everything the app shows, and to add Moments labels to the claims registry with the evidence that they are computed on the phone and never stored in a letter. K-SUG stays out of the first release as specced (O-32).
- Evidence: spec 7a.2, 7a.4, R63 and R67 read.

### EX-CBO-9 (MINOR): the word "Moments" is fine as an in-app label; the commercial risk is the name, not the word

- Requirement ids: NS-53-R8, NS-53-R9, RK-11, O-28, section 25.4 second question.
- Finding: Used as a tab label only, with store listing, subtitle, keywords, screenshots and website silent until counsel clears it (R8, O-28), the word costs the business nothing. "Moments" is a common word, so I expect a trademark on it to be weak and crowded, but I did not search any register and this is UNVERIFIED; it is the CLO's call. Do not build any marketing asset, campaign name or channel around the word until then. One related business point: R9 keeps the word out of the parent's own vocabulary for letters and recordings, which protects the brand voice.
- Proposed change: None to the requirements. Keep O-28 at its default. CLO to confirm before any public use.
- Evidence: spec R8, R9, RK-11, O-28 read; no trademark register searched, UNVERIFIED.

## What I checked and found no issue with

- No price, trial, discount, allowance or countdown appears in the spec (the only price-like rows are the non-goals on counts, streaks and badges).
- No server sees a purchase and nothing library-derived is a signal to any server (R131, R173), so D-080 and the privacy label position stay as decided.
- No paid channel, storefront change or partner account is proposed. No contact with any vendor is required by this spec.
- The flag-off fallback (R169, R170, R171) is a real way to protect the store date without losing the tab.

## For the founder (one line each, defaults if silent)

- Sign C1 to C4 above with the proposed rows. Default if no answer by Mon 24 Nov: C1 and C2 apply to docs and test builds; C3 and C4 wait for the CFO and CLO briefs.
- Debate record: the CFO's likely objection is that the Plus rule rows add process to a docs-only PRD. My answer: each row is one sentence and one scan, and they protect the only gated step in the product.

Chief Business Officer (Claude role)
