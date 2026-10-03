# Counsel question pack for BL-104

> **Draft for counsel review. Not legal advice.** Prepared by an AI agent (`legal`, Legal Drafting) for the founder to send to licensed counsel. It asks questions; it does not answer them. Nothing in it says that any document, feature or practice is compliant or lawful. Where it describes a law, it repeats what a cited source says and marks how that source was checked. Options are the team's working options, not recommendations of law.

Version 0.1, 3 Oct 2026. Owner: founder. For: BL-104 (counsel engagement and sign-off). `POLICY_VERSIONING.md` section 1 versions only texts that users accept or are told about, so this working document carries a plain version line and a changelog at the end.

## How to read this pack

- **One numbered list.** Questions Q1 to Q54 are grouped by topic. Q1 to Q48 bear on the v1.0 iOS release. Q49 to Q54 are about features that decisions D-055 and D-059 moved after v1.0; they are in one table.
- **Each question has six parts:** the question; why it matters (what the product does, with file and line); what the drafts say now; the options as the team sees them; what it blocks (backlog ids and decisions); and the sources each fact relies on.
- **Original ids are kept** so nothing asked before is lost. `L1-Q1` is question 1 of "Questions for licensed counsel" in `docs/legal/memos/lawyer-1.md`; `L1-H1` is finding H1 in the same memo; `L2-Q1` is item 1 of "Needs a human lawyer" in `memos/lawyer-2.md`; `REG-Q1` is question 1 in section 6 of `compliance-register.md`; `OQ-L1` is TDD 05 section 13; `D-###` is `docs/DECISIONS.md`; `DEB Q-###` is `docs/agents/DEBATES.md`. The index at the end maps every original id to its question here.
- **Code and drafts are cited at two points.** "develop" is `develop` at `7cc43b1`. "#37" is the founder's PR #37 at `76bba69` (`docs/privacy-data-map`). I compared the two with `diff`: in the Terms, Subscription terms, Privacy Policy, CHD notice, in-app disclosures, compliance register, data policy, subprocessors and privacy labels, #37 changes only version lines, so **line numbers are the same on both** and one citation covers both. #37 also adds `docs/legal/CLAIMS.md` and `docs/legal/data-map.yaml` (cited as #37 only) and changes `DATA_CLASSIFICATION.md` (cited with both line numbers).
- **Open pull requests** (#32, #38, #40, #41, #45, #46) are cited at their head commits on 3 Oct 2026. They are not merged and may change.
- **Verification marks.** "Re-opened 3 Oct 2026" means I opened the source today through a summarising fetch. "Opened by [draft] author" means a draft in this repo cites it as opened on 2 or 3 Oct 2026 and I did not re-open it. "Secondary" means a law-firm or vendor summary. "Unverified" means nobody in this repo opened it, or I could not confirm it.

**Short names used below.**

| Short name | File |
|---|---|
| Terms | `docs/legal/terms-of-service.md` 1.4.0 |
| SubT | `docs/legal/subscription-terms.md` 1.3.0 |
| PP | `docs/legal/privacy-policy.md` 1.3.0 |
| CHD | `docs/legal/consumer-health-data-notice.md` 1.1.0 |
| IAD | `docs/legal/in-app-disclosures.md` 1.3.0 |
| REG | `docs/legal/compliance-register.md` 1.2.0 |
| DC | `docs/legal/DATA_CLASSIFICATION.md` 1.3.0 |
| ER | `docs/legal/ENGINEERING_REQUIREMENTS.md` |
| DES | `docs/legal/DELETION_AND_EXPORT_SPEC.md` |
| L1, L2 | `docs/legal/memos/lawyer-1.md`, `lawyer-2.md` |
| TDD05 | `docs/tdd/05-privacy-compliance.md` |
| DEC | `docs/DECISIONS.md` |
| DEB | `docs/agents/DEBATES.md` |
| BRIEF | `docs/agents/BRIEF-2026-10-03.md` (founder decisions of 3 Oct 2026) |
| strings | `packages/content/src/strings.en.ts` |

## Timing, as the sources state it

- `docs/ROADMAP.md` 2.0 (develop): send counsel the v1.0 package on Fri 9 Oct (line 48); counsel sign-off received Thu 29 Oct (line 51); submission in the week of 2 Nov 2026 (line 5). Line 48 adds: "Counsel sign-off is the longest pole; past 23 Oct it moves submission".
- BL-104 (`docs/BACKLOG.md` line 74 on develop) still uses the earlier week numbers (questions by week 1, package by week 5, sign-off by week 14). The roadmap is the later document; the founder may want BL-104 re-dated.
- D-050 (DEC line 331): the second-consent answer is "needed by the end of week 6".

## What counsel will receive, and known drift to fix first

BL-104 lists the package: Terms 1.4.0, Privacy Policy 1.3.0, CHD notice 1.1.0, Subscription terms 1.3.0, in-app disclosures 1.3.0 and the claims registry. These are the current versions. The drafts still describe things the founder's 3 Oct decisions removed from v1.0. Counsel should know which lines are about to change, so that time is not spent on them.

| Draft and line | What it says | What changed | Owner and task |
|---|---|---|---|
| Terms 14.1 (line 225); SubT lines 23, 26, 73 | Plus includes encrypted backup and extra themes | No audio upload in v1.0 (BRIEF line 20; D-059, DEC line 351). The Plus sheet on develop lists only Read together and more books (`packages/content/src/features/billing.en.ts` lines 20 to 23) | `legal`, BL-224 (PR #45) |
| Terms 14.12 (line 256) | "Family Sharing through the App Store is not available for Plus at launch" | Family Sharing is on (BRIEF line 9; D-053, DEC line 345) | `legal`, BL-224 (PR #45) |
| Terms 14.6 (lines 239 to 244); SubT lines 44, 54 to 61 | Email and in-app reminders; emailed copy of the purchase agreement | No server of ours sees purchases (BRIEF line 9); see Q2 and Q5 | founder with counsel, BL-223 (PR #45) |
| PP line 175, line 186 | Purchase records kept "proposed: 7 years"; "the random ID that links your account to your App Store purchases" | Server purchase tables removed (D-053 body, DEC line 367) | `legal`, BL-246 (PR #45); see Q21 |
| PP line 22; Terms 12.1 (line 201) | Recordings leave the phone with backup or the family web page | No audio upload and no web page in v1.0 (D-059) | `legal`, BL-246 (PR #45) |
| PP line 140 | PowerSync syncs the phone's copy | D-023 decided outbox and cursor sync on Supabase (DEC line 342) | `legal`, BL-246 (PR #45); see Q34 |
| PP line 15 (develop only) | Body says "Version 1.1.0" while the header says 1.3.0 | Fixed in #37 | founder, #37 |
| CHD line 16 (develop only) | Body says "Version 1.0.0" while the header says 1.1.0 | Fixed in #37 | founder, #37 |
| IAD line 49 | `plus.legal.agree`: "By subscribing, you agree that Plus renews automatically at this price until you cancel." | The shipped string (strings line 788) reads "By continuing, you agree to the Subscription terms and Terms of Service."; the purchase opens Apple's own subscription view (see Q5) | `content` and `legal`; see Q5 |
| App Store privacy labels line 62 | Purchases "Linked", "held per account on our server as entitlements" | No server purchase records (D-053) | `legal`, BL-225 (PR #45); see Q21 |
| `docs/legal/data-policy.md` line 98 | `purge_ledger` kept 60 days | PR #32 keeps letter and book ids indefinitely; see Q24 | founder (PR #32) and `legal` |

---

## A. Subscriptions with Apple-only billing

#### Q1. Which auto-renewal duties remain ours when Apple is the merchant of record and no server of ours sees purchases?
Original ids: L1-Q1 (first part), REG-Q1, REG CR-050 open question, REG CR-052 ("Counsel to diff any stricter rule"), Terms Appendix B item 3.
- **Question.** With Apple selling, billing, renewing, cancelling and refunding Plus, which duties under California's Automatic Renewal Law, ROSCA and the other state auto-renewal laws named in L1 remain the publisher's own, and which (if any) are met by Apple's own purchase and management screens? Where a state rule is stricter than California's (REG line 109 names cancellation by the same medium), which ones matter here?
- **Why it matters.** Founder decision 3 (BRIEF line 9; D-053, DEC line 345): StoreKit 2 on the device, Apple's subscription UI, no App Store Server Notifications endpoint, no server entitlement tables. On develop the purchase opens Apple's subscription store view (`apps/mobile/src/lib/billing/actions.ts` lines 37 to 43) and plan state is read only on the phone (`apps/mobile/src/lib/billing/plan.logic.ts` lines 56 to 68). The answer sets the scope of Q2 to Q6.
- **Drafts say.** REG line 107 (CR-050): whether Apple's role "shifts any duty" is open; the register assumes it does not. Terms 14.4 (line 231): billing is handled by Apple or Google. L1 line 83 asks the same question.
- **Options as we see them.** (a) Treat every duty as ours (the register's current assumption). (b) Treat named duties as met by Apple's screens, where counsel identifies them, and write the Terms to match.
- **Blocks.** BL-223 and BL-224 (both PR #45); BL-216 (Plus sheet); BL-219 (Settings, Plan); Terms section 14 and SubT before the 9 Oct package.
- **Sources.** California AB 2863, Business and Professions Code 17602 (https://legiscan.com/CA/text/AB2863/id/3022400, re-opened 3 Oct 2026); New York GBL 527-a (https://law.justia.com/codes/new-york/gbs/article-29-bb/527-a/, re-opened 3 Oct 2026); ROSCA, 15 U.S.C. 8401 to 8405 (Unverified, not opened by anyone); Cooley on the ARL amendments (REG [L7], Secondary).

#### Q2. How can the promised trial and renewal reminders be met with no purchase server?
Original ids: BL-223 (PR #45), DEB Q-003, PR #41 reviewer note 3, D-053 effects.
- **Question.** The Terms and Subscription terms promise reminders "by email and in the app". With purchases visible only on the phone, which of these may be dropped, which may Apple's own notices carry, and can on-device notifications satisfy a notice duty where one applies?
- **Why it matters.** Develop's billing code holds `periodEnd`, `willAutoRenew` and `cancelBy` from StoreKit on the phone (`plan.logic.ts` lines 61 to 67). Our server never learns that a purchase happened (decision 3), so it has nothing to address a reminder email from. LEGAL-REQ-047 (ER lines 366 to 367) builds the notices on our server from App Store Server Notifications, which decision 3 removes; DEC line 369 records that "D-022 notice windows and D-049 consent rows no longer apply to a server we do not have". The support article in PR #41 promises only that Settings, Plan shows the date (`docs/support/help/subscriptions.md` line 30) and says "we cannot send email reminders tied to a trial" (line 128).
- **Drafts say.** Terms 14.6 (lines 239 to 244) and SubT lines 54 to 61: at trial start; at least 3 days before the last day to cancel; 16 to 21 days before a trial longer than one month ends; about 30 and about 7 days before an annual renewal; at least once a year; before a price change. Terms counsel note line 262.
- **Options as we see them** (BL-223, PR #45 `docs/BACKLOG.md` lines 639 to 643). (a) Drop the promises we cannot keep; counsel says what remains our duty. (b) Rely on Apple's notices: verified by `product` for price increases only; whether Apple sends any notice before a free trial ends or before a renewal is **Unverified** (I searched on 3 Oct 2026 and found no Apple source). (c) Remind on the device with local notifications and in-app cards built from StoreKit dates: no email, and it reaches people only while the app is installed and notifications are allowed. (d) A server path later (DEB Q-003). These can be combined.
- **Blocks.** BL-223 (PR #45: "before the Terms go to counsel"); BL-212, BL-217 and BL-218 (needs-decision on BL-223); BL-224 (PR #45); LEGAL-REQ-047 and -049.
- **Sources.** AB 2863 (re-opened 3 Oct 2026); NY GBL 527-a (re-opened 3 Oct 2026); Virginia Code 59.1-207.46 (https://law.lis.virginia.gov/vacode/title59.1/chapter17.8/section59.1-207.46/, opened by the Terms author); Apple StoreKit "Handling Subscriptions Billing" (read by `product`, PR #45); which state laws name a delivery method for notices: Unverified.

#### Q3. If we send notices, are the D-022 windows right, and does Massachusetts need a monthly key-terms repeat?
Original ids: OQ-L7, D-022, L1-H1, L1-M8, L1-Q1 (second part).
- **Question.** Please confirm or correct the notice windows in D-022, and say whether Massachusetts 940 CMR 38.00 requires repeating the key terms on each monthly renewal.
- **Why it matters.** D-022 (DEC lines 141 to 159), with `E` the trial or period end: short trial `[E-8d, E-5d]`; long trial `[E-21d, E-16d]`; final trial notice `[E-5d, E-4d]`; annual renewal `[E-31d, E-30d]` and `[E-8d, E-6d]`; anniversary reminder for monthly plans; price increase `[-30d, -7d]`. DEC line 142: the windows are data, so a change is one row. This only matters for whatever Q2 keeps.
- **Drafts say.** Terms 14.6 (lines 239 to 244) and counsel note line 262; SubT lines 58 to 61; L1 lines 24 to 32 (the window table); L1 line 56 (M8).
- **Options as we see them.** Confirm as designed; change a window; add a monthly renewal receipt if Massachusetts applies (L1 M8).
- **Blocks.** BL-212, BL-218; LEGAL-REQ-047; D-022 status "Recommended (counsel confirms)".
- **Sources.** AB 2863: trial over 31 days, notice 3 to 21 days before it ends; term of one year or more, 15 to 45 days before renewal; fee change, 7 to 30 days before (re-opened 3 Oct 2026). NY GBL 527-a: trial over one month, 3 to 21 days before the cancellation deadline; one year or more, 15 to 45 days (re-opened 3 Oct 2026). Virginia (opened by the Terms author). Utah and Massachusetts: Kelley Drye (https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/auto-renewal-laws-2025-round-up) and Churnkey (https://churnkey.co/guides/massachusetts-automatic-renewal-law), both Secondary.

#### Q4. Can we keep "We never raise your price unless you agree" under Apple's price-increase rules?
Original ids: PR #41 reviewer hand-off (price promise), L1-M1, Terms Appendix B item 11(d).
- **Question.** Does the promise hold if every future increase uses Apple's option to preserve prices for existing subscribers? How do New York's consent-or-refund rule and California's fee-change notice apply when Apple sends the notices?
- **Why it matters.** Apple's App Store Connect Help page "Manage pricing for auto-renewable subscriptions" (re-opened 3 Oct 2026) says subscribers must consent only if they are in a region that requires it, or the increase is more than 50% and more than about US$5 a period (non-annual) or US$50 a year (annual), or they had an increase in the past 12 months. Otherwise: "Apple will automatically notify subscribers of the price increase with no additional request for consent", by email and push "27 or 7 days before the next renewal date". It also says: "You also have the option to preserve prices for existing subscribers." So under Apple's default a small increase reaches existing subscribers with notice only.
- **Drafts say.** Terms 14.8 (line 248): notice 7 to 30 days ahead by email and in the app, and "Your plan will not renew at a higher price unless you agree to it". SubT line 61: "We never raise your price unless you agree." PR #41 `subscriptions.md` line 93 repeats it. L1 line 42 (M1) asks for the store's opt-in consent flow for every increase. Terms counsel note line 262: opt-in consent avoids New York's 14-day pro-rata refund route, "that we could not perform for Apple purchases".
- **Options as we see them.** (a) Keep the promise and record a rule that any increase preserves prices for existing subscribers (PR #41 line 119). (b) Keep it only where Apple asks for consent, and reword. (c) Describe Apple's process instead of promising. The email part of 14.8 has the same problem as Q2.
- **Blocks.** BL-224 (PR #45); the help article in PR #41; a payments rule for price changes (no backlog id yet).
- **Sources.** Apple page (https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions, re-opened 3 Oct 2026); NY GBL 527-a: consent, or cancellation "within, at least, fourteen days after such charge" with a pro-rata refund (re-opened 3 Oct 2026); AB 2863 fee-change notice "no less than 7 days and no more than 30 days" (re-opened 3 Oct 2026); Apple's consumer page "About subscription price changes" (support.apple.com/109501): Unverified, could not be opened by `support`.

#### Q5. Is Apple's subscription view plus our notes "express affirmative consent", and what replaces the server consent record and the emailed acknowledgment?
Original ids: L1-H3, L1-Q1 (consent part), IAD counsel note (line 62), D-049, LEGAL-REQ-049, REG CR-050(b) and (g), BL-223 consent-record option.
- **Question.** (1) Does the purchase flow as built give express affirmative consent to the renewal terms? (2) How may proof of consent be kept when no server of ours sees the purchase? (3) Is an emailed acknowledgment needed, and if so, how, given no purchase email exists on our side?
- **Why it matters.** On develop the purchase happens inside Apple's subscription store view (`actions.ts` lines 15 to 31 and 37 to 43). Our words appear as notes above Apple's plans (`packages/content/src/features/billing.en.ts` lines 24 to 28: "Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends."). Whether Apple's view shows a calendar cancel-by date is Unverified. IAD lines 46 to 51 describe our own Plus sheet instead, with `plus.legal.agree` naming automatic renewal and a `plus.ack.body` confirmation; the shipped `plus.legal.agree` (strings line 788) does not name automatic renewal, there is no `plus.ack` string in `packages/content`, and the shipped renewal lines hard-code trial lengths (strings lines 779 to 782) where L1 H2 (line 34) asked for `{trialLength}` from the store offer. LEGAL-REQ-049 (ER lines 395 to 397) matches a `completed` consent row to an App Store notification, which decision 3 removes.
- **Drafts say.** SubT line 44: "we keep a record of what you agreed to and when, and send you a copy by email". Terms 14.3 (line 229): "we keep a record". IAD line 62 asks counsel whether `plus.legal.agree` plus the store sheet is express affirmative consent.
- **Options as we see them** (consent record, from BL-223): (a) the phone writes a `started` row at purchase start, so our server learns that a purchase began; (b) no server row, relying on Apple's records (whether a developer can retrieve them as proof without a server is Unverified); (c) a record kept on the phone only. Acknowledgment: in-app confirmation only; Apple's own receipt email (content Unverified); or another route counsel names.
- **Blocks.** BL-216, BL-217; BL-223 and BL-224 (PR #45); LEGAL-REQ-049; D-049 ("Recommended; counsel confirms").
- **Sources.** AB 2863: "express affirmative consent" and keeping verification "for at least three years, or one year after the contract is terminated, whichever period is longer" (re-opened 3 Oct 2026); Apple DPLA Schedule 2 section 3.8(b) (https://developer.apple.com/support/terms/apple-developer-program-license-agreement/, opened by the Terms author).

#### Q6. Does a link to Apple's cancel screen meet the one-step cancellation rules?
Original ids: L1-M2, L1-Q1 (last part), Terms counsel note line 262, Terms Appendix B item 3.
- **Question.** Is Settings, Plan, Manage subscription, which opens Apple's subscription screen, enough for California 17602(d), Colorado's one-step online cancellation, New York's "all mediums" rule and the New York City rule?
- **Why it matters.** `manageSubscription()` opens `https://apps.apple.com/account/subscriptions` (`actions.ts` lines 71 to 80; `apps/mobile/src/lib/billing/config.ts` line 27). PR #41 tells people the same path (`subscriptions.md` line 36).
- **Drafts say.** Terms 14.5 (line 233) and 14.10 (line 252: "We never put an offer or extra step between you and cancelling"); SubT lines 48 to 52; REG line 107 item (h) also proposes a web page with cancel instructions.
- **Options as we see them.** (a) The deep link alone. (b) The deep link plus a web page with cancel steps. (c) Another route counsel names.
- **Blocks.** BL-219; Terms 14.5.
- **Sources.** AB 2863 (re-opened 3 Oct 2026; the cancellation clause was not in my extract, so 17602(d) is as cited by L1); Perkins Coie on Colorado SB25-145 (https://perkinscoie.com/insights/update/new-york-and-colorado-update-auto-renewing-subscription-requirements, Secondary); New York City click-to-cancel rule (search results only per Terms Appendix A line 463: Unverified).

#### Q7. If Plus later follows the book for a co-parent outside the subscriber's Apple Family, what changes?
Original ids: DEB Q-008.
- **Question.** If the founder chooses Q-008 option (b) or (c), a purchase-derived date per book (`plus_covered_until`) would sit on our server. Does that change what the Privacy Policy must say, the CCPA category of that value, or the Purchases privacy label (Q21)? How should Terms 14.12 describe who Plus covers?
- **Why it matters.** Today Plus reaches a co-parent only through Apple Family Sharing (BRIEF line 9; `billing.en.ts` line 28; PR #41 `subscriptions.md` lines 67 to 77). DEB lines 116 to 130 record the options and note that (b) reverses the literal wording "No server of ours sees purchases". pm-5 suggests classifying the value L3 and calls it "arguably commercial information" under the CCPA, for counsel to confirm (DEB line 123).
- **Drafts say.** Terms 14.12 (line 256) says Plus covers "the other co-parent in that book" and that Family Sharing is not available at launch; both now differ from decision 3.
- **Options as we see them.** DEB Q-008 (a) to (d).
- **Blocks.** DEB Q-008 (escalated to the founder); BL-224 and BL-225 (PR #45).
- **Sources.** DEB lines 116 to 130; Cal. Civ. Code 1798.140 (https://law.justia.com/codes/california/code-civ/division-3/part-4/title-1-81-5/section-1798-140/, opened by the L2 author).

## B. Age and children

#### Q8. Is a self-declared 18+ answer plus Apple's Declared Age Range enough now, and what must change for 1 Jan 2027?
Original ids: L1-Q2, L1-H4, REG-Q6, OQ-L8, REG CR-004 and CR-005, Terms counsel note line 60.
- **Question.** Is the 18+ gate as built enough under Texas SB 2420 and similar Utah and Louisiana laws, and what must change for California AB 1043 from 1 January 2027? Is it enough proof that the phone stores only a passed flag (D-026), or does OQ-L8's `age_attested=true` in the terms acceptance need to stay? Should teen parents be excluded, as the draft does?
- **Why it matters.** The gate runs before first use. After a No, the phone keeps only the time of that answer (`ageGate.stoppedAt`) to show a 24-hour stop screen, never an age or birth date (`apps/mobile/src/lib/age-gate.ts` lines 13 to 19; D-026, DEC line 32; CLAIMS.md line 50 on #37). Declared Age Range is called only where the API exists (D-040, DEC line 46).
- **Drafts say.** Terms 1.5 (line 46) and 2.1 (line 52); Terms counsel note line 60; PP line 203; REG line 57 (CR-004: SB 2420 in effect after the Supreme Court declined to block it on 6 July 2026; Apple's Texas requirements from 4 June 2026) and line 58 (CR-005: AB 1043 from 1 January 2027).
- **Options as we see them.** (a) Self-declaration plus store signals (the design). (b) A neutral birth-year screen (REG-Q6). (c) Another design counsel names. Teen parents: excluded (draft) or allowed.
- **Blocks.** BL-037; LEGAL-REQ-002 (ER line 27); the AB 1043 work before 1 January 2027 (date per REG line 58, Secondary).
- **Sources.** Apple Developer News, update for apps distributed in Texas (https://developer.apple.com/news/?id=sg176nne, opened by the REG author); Ashurst Perkins Coie on SB 2420 (https://www.ashurstperkinscoie.com/en/insights/supreme-court-green-lights-the-texas-age-verification-law-for-app-stores/, Secondary); texts of SB 2420, AB 1043 and the Utah and Louisiana laws: Unverified.

#### Q9. If we learn a user is under 13, is deletion within 10 days with no grace period right, and what may we keep?
Original ids: OQ-L6.
- **Question.** Is deleting within 10 days, skipping the 30-day undo, the right handling, and may we keep the `privacy_requests` row and the audit row (ids only)?
- **Why it matters.** DATA-REQ-027 (DES line 258): under-13 data "skips the 30-day grace when counsel requires it". REG line 54 (CR-001(d)): stop collection and delete on actual knowledge.
- **Drafts say.** PP line 203 (under-18 closure); PP CN-2 line 319 (deletion runbook).
- **Options as we see them.** As designed (10 days, ids-only records kept), or another period and record set.
- **Blocks.** TDD05 X-10; BL-237.
- **Sources.** FTC, Complying with COPPA FAQ (https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions, opened by the REG author).

#### Q10. Is a baby's voice in a parent's recording collection "from a child" under COPPA, and what must happen before child-facing prompts are turned on?
Original ids: L2-Q5, REG-Q2, REG-Q15, PP CN-2, REG CR-001, L2-M1.
- **Question.** Please confirm in writing whether a child's voice in the background of a parent's letter is collection from a child. Separately, review the `together` prompts and sibling letters before any flag turns them on.
- **Why it matters.** Parents record letters at home, so a child may be audible in any recording. The prompt selector picks `together` prompts when the child is with the author (`packages/core/src/prompts.ts` lines 43 to 44 and 64 to 66); the `child-input` flag that keeps them off is BL-119 (status ready on develop) and I did not find it in code on develop.
- **Drafts say.** PP lines 312 to 323 (CN-2: "COPPA should not apply to v1 as designed, but the margin is product-dependent"; asks for written confirmation on background audio); PP line 209; REG line 54 (CR-001); LEGAL-REQ-059 (ER line 468).
- **Options as we see them.** Written confirmation as asked; or design changes counsel names (for example, copy that frames the parent as speaker).
- **Blocks.** BL-119; LEGAL-REQ-059; any change to the `child-input` flag.
- **Sources.** FTC COPPA FAQ A.8 and F.6 (opened by the REG author); amended COPPA Rule summary (https://privacylawmap.com/blog/coppa-rule-amendments-april-2026-compliance-checklist, Secondary); rule text: Unverified.

## C. Sensitive and health data

#### Q11. Under Washington's MHMDA, can a parent consent for a child's health data, and how is a third adult's health data handled?
Original ids: L2-Q1 (first part), REG-Q11, CHD HN-4 item 1, REG CR-031(i).
- **Question.** The Act has no parent-or-guardian mechanism. Does a parent's request and consent cover a child's consumer health data? How should we treat health data about a third adult (for example a grandparent's letter about the mother) under author ownership?
- **Why it matters.** Letters are free text and voice about a child and family and will include health details (REG line 32). At v1.0 the only other writer is the co-parent (D-055, DEC line 347), so the third-adult case is the co-parent writing about the other parent.
- **Drafts say.** CHD lines 85 to 86 (HN-4 item 1); CHD line 79 (HN-1: letters can contain consumer health data); REG line 90 item (i); PP line 325 (CN-3).
- **Options as we see them.** Counsel's reading decides; no product option is proposed yet beyond HN-4's consent text.
- **Blocks.** BL-054 (sensitive-data consent screen); the `sensitive-data` consent text (strings lines 699 to 708).
- **Sources.** RCW 19.373.010 to .040 (https://app.leg.wa.gov/RCW/default.aspx?cite=19.373; chapter index re-opened 3 Oct 2026, section text opened by the L2 author).

#### Q12. Is a second, separate consent needed the first time a parent shares a book?
Original ids: D-050, L2-Q1 (second part), CHD HN-4 item 2, REG CR-031(h).
- **Question.** Washington requires consent to share to be "separate and distinct" from consent to collect, unless sharing is necessary for a service the consumer requested. Does sharing a book with a co-parent need its own consent, or does the one sensitive-data consent before the first sync cover it?
- **Why it matters.** The consent shown before sync names family sharing: "To sync your book and share it with the family you choose, we store what you write on our servers" (strings line 701). The product can add one tap the first time a parent invites (D-050, DEC line 332). At v1.0 the only invitee is a co-parent (D-055).
- **Drafts say.** CHD line 87 recommends a second consent at first share; REG line 90 item (h); D-050 default if unanswered: no second consent.
- **Options as we see them.** (a) One consent, as now. (b) A second one-tap consent at the first invite, recorded as its own row.
- **Blocks.** D-050 ("Open (counsel)", needed by the end of week 6); BL-176 (co-parent invite).
- **Sources.** RCW 19.373.030 (opened by the L2 author).

#### Q13. When someone asks us to delete health data about them that another author wrote, is setting the letter aside enough?
Original ids: OQ-L4, CHD HN-5.
- **Question.** Is "verify, ask the author, then set the letter aside from the book" enough for a MHMDA deletion request, or must we delete the letter?
- **Why it matters.** Authors own their words and nobody deletes another person's words (DATA-REQ-015, DES line 134).
- **Drafts say.** CHD line 90 (HN-5) proposes the runbook; OQ-L4 default: set aside, delete on instruction.
- **Options as we see them.** Set aside; delete; or set aside with deletion on counsel's instruction.
- **Blocks.** TDD05 X-18 runbook; BL-237.
- **Sources.** RCW 19.373.040 (opened by the L2 author); Nevada deletion right (FPF, https://fpf.org/blog/health-data-is-what-health-data-does-in-nevada/, Secondary).

#### Q14. When someone withdraws sensitive-data consent, must already-synced letters be erased within 15 days in Connecticut?
Original ids: L2-Q4, REG-Q13, OQ-L1, PP CN-16(a), REG CR-020.
- **Question.** Is stopping new sync and offering deletion enough, or must the server copy be erased within 15 days of withdrawal?
- **Why it matters.** Withdrawal stops sync and offers export and "delete my synced letters" (LEGAL-REQ-006, ER line 61). BL-240 builds the withdrawal modes; OQ-L1's default is `offer`.
- **Drafts say.** PP line 351 (CN-16(a)); REG line 80 (CR-020: the 15-day rule is reported, statute not opened).
- **Options as we see them.** (a) Offer deletion (default). (b) Erase within 15 days. (c) Ask at withdrawal, with erasure as the default.
- **Blocks.** BL-240; TDD05 X-08.
- **Sources.** Byte Back on SB 1295 (https://www.bytebacklaw.com/2025/06/connecticut-enacts-significant-amendments-to-states-data-privacy-law/, Secondary); Connecticut statute text: Unverified.

#### Q15. Do incidental health details in a journal meet Connecticut's sensitive-data trigger, and can one consent serve several states?
Original ids: REG-Q3, REG CR-020, CR-022.
- **Question.** Is the CTDPA's "processes any sensitive data" threshold met by free-text health details the user chooses to write? Can one sensitive-data consent serve Connecticut, Colorado, Oregon, Washington and others?
- **Why it matters.** One consent screen before the first sync (strings lines 699 to 708; BL-054).
- **Drafts say.** REG line 80 (CR-020, "Yes, likely from launch") and line 82 (CR-022, a national baseline).
- **Options as we see them.** One national consent (the design); per-state wording.
- **Blocks.** BL-054.
- **Sources.** Byte Back and Ice Miller (https://www.icemiller.com/thought-leadership/state-privacy-law-updates-july-2026-connecticut-arkansas-utah), both Secondary; other state texts: Unverified.

#### Q16. Are kept voice recordings and photos "biometric" when we never analyse them?
Original ids: L2-Q3, REG-Q14, REG CR-040, CHD HN-2, PP CN-17.
- **Question.** Are stored recordings and face photos "biometric data" under MHMDA or "biometric information" under the CCPA when no template is extracted? Do BIPA and CUBI reach raw recordings?
- **Why it matters.** Transcription runs on the phone and keeps text and word timings; it does not identify speakers or keep a voice measurement (L2 line 24). Photos are stored. LEGAL-REQ-019 (ER line 151) bans voiceprints and diarization; L2 asks to extend it to photos.
- **Drafts say.** CHD line 81 (HN-2) lists recordings and photos conservatively; PP line 353 (CN-17); REG line 99 (CR-040).
- **Options as we see them.** Keep the conservative listing; or remove it if counsel concludes they are not covered.
- **Blocks.** CHD notice text; LEGAL-REQ-019 scope.
- **Sources.** Cal. Civ. Code 1798.140 (opened by the L2 author); RCW 19.373.010 (opened by the L2 author); Lewis Rice on BIPA and transcription (https://www.lewisrice.com/publications/ai-transcription-tools-give-rise-to-bipa-claims, Secondary); BIPA, CUBI and Colorado HB 24-1130 texts: Unverified.

#### Q17. Is Early Letters a "personal health record" under the FTC rule, or covered by California's CMIA?
Original ids: REG-Q4, REG CR-030, REG CR-016.
- **Question.** Does a multi-author journal with photos have "the technical capacity to draw information from multiple sources" under the Health Breach Notification Rule? Does the CMIA reach it?
- **Why it matters.** No health fields or health integrations exist; health appears only in free text (REG line 89).
- **Drafts say.** REG line 89 (CR-030: "Maybe, low") and line 71 (CR-016: "Maybe, low ... Counsel to confirm").
- **Options as we see them.** Treat as out of scope and keep breach readiness; or plan for the rule.
- **Blocks.** Incident response plan (BL-241).
- **Sources.** FTC, Complying with the Health Breach Notification Rule (https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0, opened by the REG author); CMIA text: Unverified.

#### Q18. Does the CCPA apply yet, and is a "Limit the use" link needed?
Original ids: L2-Q6, L2-M2, REG CR-014, CR-015.
- **Question.** With revenue far below the threshold and no sale or sharing, when would the CCPA apply? If it does, do our uses of sensitive personal information stay within 7027(m) so no "Limit" link is needed, and when would a risk assessment be due?
- **Why it matters.** Letters are treated as sensitive personal information and a child's data under 16 as sensitive (PP line 259).
- **Drafts say.** PP line 327 (CN-4) and lines 246 to 273 (section 15, voluntary); REG lines 69 to 70.
- **Options as we see them.** Comply voluntarily as drafted; or narrow section 15.
- **Blocks.** PP section 15 text.
- **Sources.** CPPA thresholds (https://www.cppa.ca.gov/regulations/cpi_adjustment.html, opened by the REG author); FPF CCPA regulations brief (Secondary); 11 CCR 7027(m): Unverified.

## D. Analytics, aggregates and the privacy label

#### Q19. May the one-time `analytics_opted_in` summary describe first-run activity that happened before consent?
Original ids: TRACKING_PLAN section 2 open item; PR #38 red-team review finding 5; LEGAL-REQ-003.
- **Question.** When a person says yes to analytics, the first event carries bucketed facts about their first run, which happened before they were asked. Is that consistent with LEGAL-REQ-003 and Apple 5.1.1(ii), and with the sheet's words "Nothing is shared unless you say yes"? Should the sheet say it?
- **Why it matters.** The consent sheet appears after the first letter (LEGAL-REQ-003, ER lines 38 to 41), so first-run events are never sent. Instead `analytics_opted_in` carries `days_since_install`, `letters_bucket`, `signed_in`, `member_role`, `first_letter_mode`, `time_to_first_letter` and `came_from_invite` (`packages/analytics/src/catalog.ts` lines 232 to 246; sent in `packages/analytics/src/trackers.ts` lines 238 to 246). The marketing plan measures median time to first letter only "if counsel approves" (PR #38 `docs/marketing/LAUNCH_PLAN.md` line 336).
- **Drafts say.** `docs/analytics/TRACKING_PLAN.md` line 75 ("Open: counsel to confirm this summary is acceptable under LEGAL-REQ-003"), line 105 and line 375. Sheet text, strings lines 711 to 717.
- **Options as we see them.** (a) Keep the summary as is. (b) Keep it and add a line to the sheet. (c) Drop those properties and rely on App Store Connect and server counts (TRACKING_PLAN line 75).
- **Blocks.** BL-023 (consent sheet), BL-250 (analytics wiring).
- **Sources.** Apple App Review Guideline 5.1.1(ii): consent is needed "even if such data is considered to be anonymous at the time of or immediately following collection" (https://developer.apple.com/app-store/review/guidelines/, re-opened 3 Oct 2026).

#### Q20. May a spoken-letter language code appear in analytics?
Original ids: DEB Q-004; DC open issue 2.
- **Question.** May one language code from the seven v1.0 languages be sent on `language_set` and `pack_download` events, classified as a reviewed L2 reduction? Is a language code an ethnicity proxy for any law you would apply?
- **Why it matters.** Develop's catalogue already carries `lang` on those two events (`packages/analytics/src/catalog.ts` lines 498 to 517). Server aggregates merge languages under 10 families into `other` (`supabase/migrations/20261004300000_insights_aggregates.sql` lines 1 to 9).
- **Drafts say.** DC open issue 2: develop line 752 (`lang` on two events, counsel to confirm); #37 line 606 still says no language property is sent, because #37 predates the develop merge. DEB lines 36 to 41.
- **Options as we see them.** DEB Q-004 (a) `lang` on two events; (b) server aggregates only; (c) pack id only.
- **Blocks.** DEB Q-004 ("Open (needs counsel; coded as (a), easy to revert)").
- **Sources.** Repo only; no law was cited by the analytics owner.

#### Q21. Analytics "Not linked", and the Purchases entry now that no server holds purchases: what should the privacy label say?
Original ids: DEB Q-005; DC open issue 9 (develop); CLAIMS.md CL-22 (#37).
- **Question.** (1) With a random analytics id never stored with the account, may Usage Data and Diagnostics be declared "Not linked", given Apple says personal information under privacy laws is considered linked? Should Identifiers be declared? (2) Does the Purchases entry still apply when the app reads plan state on the phone only?
- **Why it matters.** The analytics id is random and kept apart from the account (PP line 355, CN-18). Plan state is read from StoreKit on the phone and cached there (`plan.logic.ts` lines 56 to 68; DC develop line 759).
- **Drafts say.** App Store privacy labels line 62 (Purchases, Linked, "held per account on our server"); line 81 (condition 6, the analytics id passed once at deletion); DEB lines 43 to 49; CLAIMS.md line 51 on #37 ("the privacy label answer is counsel's call").
- **Options as we see them.** Analytics: (a) Not linked with a public no-reidentification commitment; (b) Linked. Purchases: keep, remove or reword per counsel.
- **Blocks.** BL-225 and BL-246 (PR #45); BL-231 (labels from the data map); store submission.
- **Sources.** Apple App privacy details page (cited by DEB Q-005, checked by `analytics` on 3 Oct 2026; not re-opened by me).

#### Q22. Is it acceptable that analytics cannot be reached for email deletion or access requests, and that deletion at request time cannot be undone?
Original ids: OQ-L3, OQ-L13, PP CN-18, L2-H1(c).
- **Question.** (1) Is "analytics cannot be reached because we hold no link" an acceptable answer to email access and deletion requests under the CCPA and MHMDA? (2) PostHog data is deleted when deletion is requested, not at day 30, so cancelling a deletion cannot restore analytics: is the disclosure enough?
- **Why it matters.** The in-app deletion passes the current analytics id once, in memory, so PostHog can delete its events (PP line 355); an email request has no id to pass. #37 data-map line 1377 notes the server route that asks PostHog to delete is not built (BL-235).
- **Drafts say.** PP line 186 ("Analytics are not linked to your account, so we can't find" them for email requests).
- **Options as we see them.** Proceed and disclose (OQ-L3 and OQ-L13 defaults); or change the design.
- **Blocks.** BL-235, BL-237; TDD05 X-02.
- **Sources.** Repo only.

#### Q23. May aggregate counts with no ids be kept after an account is deleted?
Original ids: PR #40 `METRIC_TREE.md` Open-4.
- **Question.** The metric tree assumes that weekly counts, once frozen, are kept after the accounts behind them are deleted. Please confirm whether that is acceptable, and whether the Privacy Policy should say so.
- **Why it matters.** Server aggregates are counts only, with every published cell 0 or at least 10 (`20261004300000_insights_aggregates.sql` lines 1 to 9 and 46 to 53). A week "stays provisional for 14 days after it ends, then is frozen", and "Deletions after a week is frozen do not change it either" (PR #40 `docs/analytics/decision-science/METRIC_TREE.md` line 53). Agents read only suppressed aggregates (line 222).
- **Drafts say.** PP section 10 (lines 159 to 186) does not mention aggregate counts. METRIC_TREE line 426: "Open-4, privacy counsel: confirm that aggregate counts (no ids) may be kept after an account is deleted. This is assumed."
- **Options as we see them.** (a) Keep frozen counts and add a line to PP section 10. (b) Recompute after deletions.
- **Blocks.** BL-024 (server aggregates); the insights loop (D-062).
- **Sources.** Repo only.

## E. Retention and deletion

#### Q24. May ids of purged letters and books be kept indefinitely to stop them coming back after a restore?
Original ids: PR #32 red-team review 5402408550, finding 3.
- **Question.** Keeping the ids of purged letters and books (ids only, no words, names or content) so that a database restore cannot bring them back: is indefinite retention acceptable, and how should it be disclosed, given the drafts state 60 days?
- **Why it matters.** PR #32 changes `purge_due` to delete only person and object-path rows after 60 days, keeping letter and book ids "for good" (PR #32 `supabase/migrations/20261003020000_purge_batching.sql` lines 22 and 151). On develop today every row goes after 60 days (`supabase/migrations/20261004000000_plus_on_device_only.sql` line 199). The ids are classified L3 (DC develop lines 358 to 364; #37 lines 318 to 324).
- **Drafts say.** `docs/legal/data-policy.md` line 98 (60 days); DATA-REQ-066 (DES line 481, 60 days); #37 `data-map.yaml` line 665 ("Letter and book ids kept indefinitely (ids only, DB-02); person and object-path rows 60 days"). PP section 10 (lines 159 to 186) does not mention the ledger. The red-team review proposes the wording "ids of purged letters and books kept indefinitely (ids only, to block resurrection)" for counsel to confirm.
- **Options as we see them.** (a) Indefinite, disclosed. (b) A fixed period longer than the oldest restorable backup. (c) 60 days as now.
- **Blocks.** PR #32; DATA-REQ-066 (requirement document, founder edit); BL-247 (restore drill and ledger replay).
- **Sources.** Repo only; the review cites DATA-REQ-001 and DATA-REQ-066.

#### Q25. May consent records be kept 3 years after an account ends, and are they pseudonymised or deidentified?
Original ids: REG-Q7, OQ-L5, DATA-REQ-064.
- **Question.** Is a peppered hash of the profile id, kept 3 years, acceptable against MHMDA's deletion right? Is it "deidentified" under any statute, or only pseudonymised?
- **Why it matters.** Consent rows are pseudonymised at deletion and removed 3 years later (DATA-REQ-064, DES line 477; `POLICY_VERSIONING.md` line 144). The 3 years also serves California's consent-record rule (Q5).
- **Drafts say.** PP line 176 ("Life of the account plus 3 years ... they no longer show your name or email").
- **Options as we see them.** As designed (pseudonymised, 3 years); a shorter period; or another form.
- **Blocks.** DATA-REQ-064; BL-115.
- **Sources.** AB 2863 consent-record period (re-opened 3 Oct 2026); RCW 19.373.040 (opened by the L2 author).

#### Q26. Are the two log clocks right, and may a purged book's id stay in activity records?
Original ids: D-021, OQ-L9, OQ-L10.
- **Question.** Should security and staff-access logs (12 months) or activity records (24 months) be longer for breach investigation or limitation periods? After a book is purged, may `audit_events.child_id` (an id with no surviving record) be kept for the 24 months?
- **Why it matters.** D-021 (DEC lines 134 to 139). Develop's `purge_due` deletes `audit_events` after 24 months (`supabase/migrations/20261004000000_plus_on_device_only.sql` line 191; PR #32's migration line 142 does the same).
- **Drafts say.** PP lines 173 and 174.
- **Options as we see them.** As designed (12 and 24 months; keep the id); or other periods.
- **Blocks.** D-021; LEGAL-REQ-033 (ER line 254).
- **Sources.** Repo only.

#### Q27. Are copies in a user's own iCloud or computer backup within our deletion duty?
Original ids: OQ-L12, PP CN-19, D-033.
- **Question.** After account deletion, are letters and recordings in the user's own device backup within our duty, given they sit in the user's Apple account?
- **Why it matters.** Recordings stay on the phone in v1.0 and D-033 (recommended, DEC line 39) keeps them where device backups include them. #37 data-map line 1378 notes copy must match the decision.
- **Drafts say.** PP line 157 discloses device backups as the user's own.
- **Options as we see them.** No duty, disclose (OQ-L12 default); exclude app files from device backup.
- **Blocks.** D-033 (founder); TDD05 X-29.
- **Sources.** Repo only; Apple's backup behaviour as described in PP CN-19 (line 357), not re-checked.

#### Q28. At v1.0, is a static `/delete-account` page with an email route enough?
Original ids: D-042, REG CR-091, LEGAL-REQ-030.
- **Question.** Apple requires in-app deletion, which ships. Is a static web page explaining it, plus an email route handled within the LEGAL-REQ-031 times, enough until Android?
- **Why it matters.** `packages/brand/index.ts` line 56 names the page; BL-243 builds it.
- **Drafts say.** D-042 (DEC lines 285 to 289); REG line 152 (the web link is a Google Play requirement).
- **Options as we see them.** Static page now and full web flow before Android (D-042); full web flow now.
- **Blocks.** D-042 ("Recommended; counsel confirms"); BL-243.
- **Sources.** Google Play account deletion requirements (https://support.google.com/googleplay/android-developer/answer/13327111, opened by the REG author).

#### Q29. What should happen to a co-parent's letters in a shared book when that co-parent deletes their account?
Original ids: L1-M7, Terms counsel note line 143, PP CN-13, Terms Appendix B item 6.
- **Question.** Deletion removes the deleting parent's letters from a shared book, which stays with the other parent. Is that right, and what licence would a future "leave my letters for {child}" option need to survive deletion?
- **Why it matters.** v1.0 books are shared only between co-parents (D-055).
- **Drafts say.** Terms 8.4 (line 139) and counsel note line 143; PP lines 182 to 185 and line 345 (CN-13).
- **Options as we see them.** As drafted; or an opt-in to leave letters (B-REQ-025, P2).
- **Blocks.** BL-233 (in-app deletion).
- **Sources.** Repo only.

## F. Public promises and the claims registry

#### Q30. Is the new in-app pledge string right as a stand-alone promise?
Original ids: PR #46 body item 2; L1-L5; Terms Appendix B item 12.
- **Question.** Settings, Help and Legal will show: "If we ever plan to close, we will tell you at least 90 days ahead and keep export working the whole time." Is this short form acceptable without the Terms 17.3 qualifier, and is it a promise an individual publisher can keep?
- **Why it matters.** The string is new in PR #46 (`packages/content/src/strings.en.ts` lines 576 to 579 at `b0949bc`; the code comment says "counsel to confirm. Change all of them together or none"). Export is not built yet (CLAIMS.md line 48 on #37, CL-19 "Not yet"). The publisher is an individual (D-004, D-064).
- **Drafts say.** Terms 17.1 to 17.3 (lines 294 to 303), with 17.3: "Things outside our control, such as a court order, could shorten this notice"; Terms counsel note line 305; PP line 294 (the same sentence, with the product name); DES line 374; L1 line 68 (L5: enforceable while solvent, may not survive rejection by a bankruptcy trustee).
- **Options as we see them.** (a) Ship as written. (b) Add a link to Terms 17. (c) Shorter wording counsel approves.
- **Blocks.** PR #46; a CLAIMS.md row for the pledge (PR #46 asks for one); PRD-REQ-009.
- **Sources.** Repo only.

#### Q31. Can the binding promises survive a sale or insolvency, and is "free, always" worded right?
Original ids: L1-Q3 (last part), L1-L6, REG-Q10, REG CR-012, Terms Appendix B item 5.
- **Question.** Do Sections 6.2 (no training, no ads, no sale), 11 (transcription), 13 (free, not amendable for existing users) and 17 (shutdown) bind a buyer of the business, and what survives insolvency? Is the free-scope wording right?
- **Why it matters.** The same promises appear in the app and listing: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always." (strings line 790; `billing.en.ts` line 24).
- **Drafts say.** Terms 13.1 to 13.3 (lines 211 to 219) and counsel note line 221; Terms 17.2 (line 301); L1 line 70 (L6: confirm the founder accepts 13.3).
- **Options as we see them.** Keep; narrow to a concrete commitment such as "export is always free" (REG line 67).
- **Blocks.** Terms 13 and 17 before the package.
- **Sources.** FTC Guide on use of the word "Free", 16 CFR 251 (Unverified, not opened).

#### Q32. Is the liability cap enforceable, and should a security incident or a breach of 6.2 sit outside it?
Original ids: L1-Q3 (first part), L1-L2, Terms counsel note line 343, Terms Appendix B item 9.
- **Question.** Is the greater of 12 months' fees or $50 enforceable for claims about family recordings and letters? Should a security incident exposing letters, or a breach of the no-training promise, be carved out?
- **Why it matters.** Most users pay nothing, so the $50 floor is the cap for them (Terms 21.1, line 335).
- **Drafts say.** Terms 21.1 and 21.2 (lines 335 to 339) and counsel note line 343; L1 line 62.
- **Options as we see them.** Keep; add carve-outs; raise the floor.
- **Blocks.** Terms 21.
- **Sources.** Civil Code 1668, 1670.5 and 1751 (Unverified, not opened per Terms Appendix A line 455).

#### Q33. Should we keep "access is logged" and the promise to publish request counts?
Original ids: L2-Q7, PP CN-8, CN-9, CLAIMS.md CL-15.
- **Question.** Keep both commitments for a one-person publisher, or soften them?
- **Why it matters.** No staff tool exists; the operator access log is planned (LEGAL-REQ-025, ER line 194; CLAIMS.md line 44 on #37).
- **Drafts say.** PP line 127 ("Each access is logged and reviewed"); PP line 131 (request counts); PP lines 335 to 337.
- **Options as we see them.** Keep and build the log before launch; soften the wording.
- **Blocks.** LEGAL-REQ-025; PP section 7.
- **Sources.** Repo only.

#### Q34. With PowerSync not used at v1.0, which vendor terms must exist before we say "never used to train models"?
Original ids: OQ-L15, PP CN-7, CLAIMS.md CL-03, PR #38 section 1.2 row 9.
- **Question.** CN-7 makes PowerSync's missing no-training clause a launch gate. D-023 decided sync on Supabase without PowerSync. Which providers' written terms must counsel see before the no-training line is published?
- **Why it matters.** The line is in the app now: "We never sell it, use it for ads or use it to train machine learning models" (strings line 702; also line 958). v1.0 sends no content to any AI provider (CLAIMS.md line 32 on #37). Sentry may or may not ship in v1.0 (#37 data-map line 1380).
- **Drafts say.** PP line 104 and line 333 (CN-7); PP line 140 still lists PowerSync; PR #38 `LAUNCH_PLAN.md` line 56.
- **Options as we see them.** Close the gate for v1.0 vendors only; keep it until every listed vendor confirms.
- **Blocks.** BL-106 (vendor evidence); BL-246 (PR #45); the trust strings.
- **Sources.** `docs/legal/subprocessors.md` section 4 (vendor terms read by its author; not re-opened).

#### Q35. How does counsel want to approve claims?
Original ids: PR #46 body "Proposed next PR" items 1 to 3; LEGAL-REQ-044.
- **Question.** LEGAL-REQ-044 asks for counsel approval per claim. #37's `CLAIMS.md` has Status and Verified columns but no approval column. How would you like to record approval?
- **Why it matters.** The content test will tie each claim-bearing string to a CLAIMS.md row (PR #46 body).
- **Drafts say.** LEGAL-REQ-044 (ER line 343); CLAIMS.md lines 28 to 55 on #37.
- **Options as we see them.** A column per row; a dated sign-off note per version; another form.
- **Blocks.** BL-118; LEGAL-REQ-044.
- **Sources.** Repo only.

#### Q36. Do the shipped trust lines match what the product does on day one?
Original ids: L1-M3, L1-M5, L2-H4, REG section 3 rows 13 to 22, CLAIMS.md gaps 1 to 5 (#37), PR #38 section 1.2.
- **Question.** Please review the claims register (#37 `CLAIMS.md`) together with the strings it cites, and say which lines you need changed before launch.
- **Why it matters.** Several lines describe features moved after v1.0: backup and family playback (CLAIMS.md lines 34 to 35, "Not yet"), grandparents writing and Hindi-English mixing (PR #38 `LAUNCH_PLAN.md` lines 48 and 51). PR #46 adds rules that fail on some of these today (PR #46 body: "5 fail as intended").
- **Drafts say.** REG lines 206 to 219; CLAIMS.md lines 57 to 65 on #37.
- **Options as we see them.** Fix copy before the package (BL-152 and BL-153, PR #45); send as is with the register.
- **Blocks.** BL-118, BL-152 and BL-153 (PR #45), BL-286.
- **Sources.** FTC Act section 5 deception theory as described in REG line 65 (Unverified citation).

## G. Terms structure and the individual publisher

#### Q37. Courts or arbitration?
Original ids: L1-Q4 (first part), L1-L3, Terms Appendix B item 1.
- **Question.** Keep courts plus small claims (the draft), or use arbitration (Option B in the draft)?
- **Why it matters.** Brand trust and the trade-offs in L1 line 64.
- **Drafts say.** Terms 23 and counsel note line 361.
- **Options as we see them.** Courts (draft); arbitration.
- **Blocks.** Terms 23.
- **Sources.** McGill v. Citibank (https://law.justia.com/cases/california/supreme-court/2017/s224086.html, search result only); CCP 1281.97 to 1281.98 (Unverified).

#### Q38. Custom EULA or Apple's Standard EULA, and what support contact must the listing show?
Original ids: L1-Q4 (second part), L1-L4, Terms Appendix B item 2, Terms counsel note line 407; PR #38 hand-off on support contact.
- **Question.** Use these Terms as a custom EULA, or Apple's Standard EULA? Item (h) of Apple's minimum terms needs a phone number: what contact details must the Terms and the support page show for an individual?
- **Why it matters.** Develop sets the Support URL to the home page (PR #38 review 5402708838 item 1, citing `packages/content/src/store.en.ts` line 78).
- **Drafts say.** Terms 26.1 and counsel note line 407; Terms line 13 (contact address for an individual).
- **Options as we see them.** Custom EULA (L1 recommendation); Standard EULA.
- **Blocks.** BL-286 (store listing); App Store Connect metadata.
- **Sources.** Apple minimum terms (https://www.apple.com/legal/internet-services/itunes/appstore/dev/minterms/) and Standard EULA (https://www.apple.com/legal/internet-services/itunes/dev/stdeula/), both opened by the Terms author.

#### Q39. What does publishing as an individual change?
Original ids: PP CN-1, CHD HN-10, Terms founder note (line 13), Terms Appendix B item 13, REG CR-130.
- **Question.** Is "we" acceptable for an individual? What contact address may the documents show? Do MHMDA duties apply the same way to an individual? Is there a legal reason, apart from App Review, to form an entity before launch?
- **Why it matters.** D-004 and D-064 (DEC lines 23 and 356): an individual Apple Developer account. Apple guideline 5.1.1(ix): apps "that require sensitive user information should be submitted by a legal entity" (re-opened 3 Oct 2026). REG line 144 (CR-130) rates the review risk.
- **Drafts say.** Terms line 13 and 1.1 (line 35); PP line 308; CHD line 100.
- **Options as we see them.** Launch as an individual (decided); form an entity in parallel (D-004 hedge, needed by 27 Nov per DEC line 413).
- **Blocks.** Contact placeholders in every draft; D-004 hedge.
- **Sources.** App Review Guidelines (re-opened 3 Oct 2026).

#### Q40. Is acceptance enough for use before an account exists?
Original ids: Terms counsel note line 48.
- **Question.** Local use before sign-in has no explicit acceptance step. Is that acceptable, or should the welcome screen link the Terms?
- **Why it matters.** v1.0 starts with one welcome screen and the 18+ gate (D-043, DEC line 49); people can write before signing in (A-REQ-014, REG line 138).
- **Drafts say.** Terms 1.5 (line 46) and counsel note line 48.
- **Options as we see them.** As drafted; add a link on the welcome screen.
- **Blocks.** BL-137 (welcome screen).
- **Sources.** E-SIGN and clickwrap case law (REG line 74: Unverified).

#### Q41. Court orders, custody disputes and reports of illegal images.
Original ids: REG-Q9, REG CR-112, CR-113, Terms counsel notes lines 157 and 178.
- **Question.** What legal-process policy should we publish, and what is our duty and process if we gain actual knowledge of apparent child sexual abuse material?
- **Why it matters.** Photos are stored, and separated parents share books (Terms section 9).
- **Drafts say.** Terms counsel notes lines 157 and 178; REG lines 171 and 172; PP line 131.
- **Options as we see them.** A short published policy plus runbooks; no proactive scanning (REG line 172, counsel to confirm).
- **Blocks.** BL-241 (security programme and runbooks).
- **Sources.** Stored Communications Act and 18 U.S.C. 2258A (Unverified, not opened).

#### Q42. Recording other people.
Original ids: REG CR-041, PP CN-15, Terms counsel note line 178.
- **Question.** Is Terms 5.4 plus a short help note enough where a user records others?
- **Why it matters.** Recording runs only while the user records; there is no background recording (REG line 100).
- **Drafts say.** Terms 5.4 (line 96) and 10.2 (line 163); PP line 349.
- **Options as we see them.** As drafted; add the recorder help note (REG line 100).
- **Blocks.** Terms 5.4.
- **Sources.** Reporters Committee California recording guide (https://www.rcfp.org/reporters-recording-guide/california/, Secondary); Penal Code 632 (Unverified).

#### Q43. The "can make mistakes" note and the user indemnity.
Original ids: IAD counsel note line 40; Terms counsel note line 349.
- **Question.** Is the in-app note acceptable without "not a medical or legal record"? Keep the narrow user indemnity?
- **Why it matters.** Founder decision 10 keeps a small "early version, can make mistakes" note in the app (BRIEF line 21).
- **Drafts say.** IAD line 40; Terms 11.5 (line 195) and 22 (counsel note line 349).
- **Options as we see them.** As drafted; add the limit in the app; drop the indemnity.
- **Blocks.** IAD; Terms 22.
- **Sources.** Repo only.

## H. Beta and launch marketing

#### Q44. What must the beta screening form do about accessibility and language answers?
Original ids: PR #38 red-team review 5402403482 finding 4; PR #38 hand-off to `legal`.
- **Question.** The form asks, optionally, for "any settings you would like to test with, such as VoiceOver or larger text", and which of the seven v1.0 languages a family would speak letters in. Does either answer need special handling, notice or consent? Is the proposed tool, storage and deletion plan acceptable?
- **Why it matters.** The review said the accessibility question "comes close to disability data" and that languages are L4 in TRACKING_PLAN. The plan now: a Google Form owned by the founder (a proposal), answers kept only there and never shared with agents, answers from families not invited deleted when invitations go out, all others by Fri 15 Jan 2027 (PR #38 `LAUNCH_PLAN.md` lines 188 to 189). Those dates follow a January 2027 submission; develop's roadmap now targets early November 2026 (ROADMAP line 5), so they may move.
- **Drafts say.** No legal draft covers the form. The plan lists "a plain consent note" among its drafts (line 188); its text is not in PR #38.
- **Options as we see them.** As planned; drop the accessibility question; add a short notice on the form.
- **Blocks.** BL-109 (recruit C1 families); BL-280 (beta programme).
- **Sources.** PR #38 at `03c6316`; review 5402403482.

#### Q45. Thank-you codes, review requests and the launch email.
Original ids: PR #38 section 10 hand-off to `legal` (line 368).
- **Question.** (1) May beta families get a thank-you offer code after launch, given App Review 2.2 bars compensation for testing? (2) What disclosure is needed if reviews are ever mentioned to people the founder knows? (3) Is the launch email commercial, and what postal address may an individual use?
- **Why it matters.** C1 families are mostly people the founder knows (PR #38 line 197).
- **Drafts say.** PR #38 lines 194 to 198; REG line 117 (CR-060, CAN-SPAM).
- **Options as we see them.** No codes and no review asks (the plan's current position); or codes with counsel's wording.
- **Blocks.** BL-280; the launch email.
- **Sources.** FTC consumer review rule (Secondary per PR #38 [M14]); CAN-SPAM (Unverified per REG line 117).

## I. Trademark

#### Q46. How should "Early Letters" be cleared before the store listing?
Original ids: REG CR-122; BL-123 and BL-124 (PR #45).
- **Question.** What should a clearance cover, which goods and services should it consider, whether and when to file, what to do if a similar mark turns up, and whether the tagline or the print title need their own check?
- **Why it matters.** The name is "Not yet trademark-cleared" (`packages/brand/index.ts` lines 17 to 18 and 75). Marks in use: `name` "Early Letters", `storeName` "Early Letters: Memory Book", `subtitle`, `tagline` "Exactly as you said it." and the `printTitle` pattern "Early Letters: Year One" (lines 80 to 85). The domains earlyletters.com and earlyletters.app are bought (BRIEF line 24). The bundle id derives from the domain and cannot change after the first upload (lines 7 to 10). The publisher is an individual (D-004). The App Store search for "early letters" returns alphabet and phonics apps (PR #38 body, "Look at first" item 4, iTunes Search API, 3 Oct 2026).
- **Drafts say.** REG line 181 (CR-122: "Clearance search before store submission").
- **Options as we see them.** Counsel decides the scope; BL-124 will give counsel a stand-alone fact sheet with the same questions.
- **Blocks.** BL-123 (PR #45, "result before the store listing (BL-286)"); BL-286.
- **Sources.** Repo only. Per BL-123, agents write no conclusion, likelihood or cost about the name.

## J. Store paperwork

#### Q47. How should the App Store export-compliance question be answered, and is any filing needed?
Original ids: REG CR-121, CR-089.
- **Question.** App Store Connect asks about encryption. REG line 180 says counsel or an accountant should confirm whether any BIS self-classification filing is needed. What is the right answer for v1.0, and is a filing needed?
- **Why it matters.** REG line 180 describes "standard TLS plus AES-256-GCM for user data protection". The AES-256-GCM part is recording backup (PP line 193), which D-059 moves to v1.1, so what v1.0 itself uses needs engineering to confirm (Unverified). I found no encryption declaration in `apps/mobile/app.json` on develop.
- **Drafts say.** REG line 143 (CR-089) and line 180 (CR-121).
- **Options as we see them.** Counsel or an accountant decides.
- **Blocks.** BL-286 (store listing and submission).
- **Sources.** EAR 740.17 and License Exception ENC (Unverified, not opened per REG line 316).

#### Q48. Does Apple's user-generated-content guideline reach private sharing between co-parents?
Original ids: REG CR-086.
- **Question.** Apple guideline 1.2 asks apps with user-generated content for filtering, reporting, blocking and a published contact. Does that apply to a book shared only between two parents, and if so, which of those does counsel want at v1.0?
- **Why it matters.** At v1.0 the only people who share a book are its parents (D-055); either parent can see and remove family members (D-069, DEC line 400, recommended). I found no "Report a concern" string in `packages/content` on develop.
- **Drafts say.** REG line 140 (CR-086: "Maybe"; whether Apple applies 1.2 to private family sharing is Unverified).
- **Options as we see them.** A published support contact only; add "Report a concern" in Help (REG line 140); more.
- **Blocks.** BL-286; Help screen copy.
- **Sources.** App Review Guidelines (re-opened 3 Oct 2026 for other sections; 1.2 not quoted, Unverified).

## K. Features after v1.0 (not blocking the v1.0 release)

D-055 (DEC line 347) makes v1.0 co-parent only, and D-059 (DEC line 351) defers the web contribution page, family hearing each other's recordings and the safety classifier to v1.1. These questions stay open for when those ship.

| # | Question (original ids) | Why it matters | Drafts say | Options | Blocks | Sources |
|---|---|---|---|---|---|---|
| Q49 | Does invitation-only web contribution by grandparents in India, the EU or the UK amount to offering services there (REG-Q5, CR-100, CR-101, PP CN-14)? | Overseas grandparents are a core persona (REG line 23) | PP line 347 (CN-14); REG lines 161 to 162 and 252 to 257 | Do not geo-block (REG line 257); notice and consent at the page; geo-limit | Web contribution page (v1.1) | DPDPA s.3 (https://www.dpdpa.com/dpdpa2023/chapter-1/section3.html, opened by the REG author); EY on DPDP Rules (Secondary); GDPR text Unverified. Note: REG line 23 says DPDP duties start "roughly May 2027; exact date Unverified" and PP line 347 says 13 May 2027 |
| Q50 | Can one `contributor-notice` act with a sensitive-data line serve as a web contributor's MHMDA and CTDPA consent (OQ-L2), and do LEGAL-REQ-010 and -035 bind only when the web page ships (BL-104 "re-tier of web-page LEGAL-REQs")? | D-002 (DEC line 75) said they bind when the page ships, "counsel to confirm the re-tier"; D-055 supersedes D-002 | ER lines 89 and 281; TDD05 line 973 | Separate unticked checkbox at Send (OQ-L2 default) | TDD05 X-03; v1.1 web page | RCW 19.373.030 (opened by the L2 author) |
| Q51 | May contributors see the child's name, nickname and birthday month and day, but never the due date or birth year (D-039)? | Database supports contributors though v1.0 hides them (D-055); the `book_children` view is added by PR #32 (CLAIMS.md line 45 on #37) | DC develop line 753, #37 line 607 (open issue 3) | As recommended; other fields | D-039; BL-175 | Repo only |
| Q52 | Before a sole-parent book is deleted, is a server export without audio an acceptable copy offer to contributors (OQ-L14)? | Contributors' audio stays in their own browser or phone | PP line 183; TDD05 line 985 | Yes for v1 (default) | TDD05 X-09 | Repo only |
| Q53 | When audio upload ships, does Standard-mode audio count as "encrypted" for breach-notification safe harbours if we hold the escrow key, and how should escrow be described (L2-Q8, REG-Q8)? | No audio upload in v1.0 (D-059) | PP lines 193 to 194; REG line 36 | Disclose escrow next to every encryption claim (REG line 198) | Audio upload (v1.1) | Cal. Civ. Code 1798.82 (Unverified) |
| Q54 | Is on-device safety tiering "collection" under MHMDA, Nevada or Connecticut, and must the sensitive-data consent mention support cards (L2-Q2, REG-Q12, OQ-L11, CHD HN-3)? Also gifts (REG CR-053) when they ship. | v1.0 ships a static "If you are struggling" row with no classifier (D-059; strings line 931) | CHD line 83 (HN-3); REG line 110 (CR-053) | HN-3 options (a) and (b) | Safety classifier (D-034, v1.1); gifts (P1) | RCW 19.373.010 (opened by the L2 author); FPF and Hunton (Secondary) |

---

## Index of original ids

Each pair reads "original id: question here".

| Source | Pairs |
|---|---|
| Lawyer 1 questions | L1-Q1: Q1, Q3, Q5, Q6; L1-Q2: Q8; L1-Q3: Q31, Q32; L1-Q4: Q37, Q38 |
| Lawyer 1 findings | H1: Q3; H2: Q5; H3: Q5; H4: Q8; M1: Q4; M2: Q6; M3: Q36; M5: Q36; M7: Q29; M8: Q3; L2: Q32; L3: Q37; L4: Q38; L5: Q30; L6: Q31 |
| Lawyer 2 questions | L2-Q1: Q11, Q12; L2-Q2: Q54; L2-Q3: Q16; L2-Q4: Q14; L2-Q5: Q10; L2-Q6: Q18; L2-Q7: Q33; L2-Q8: Q53 |
| Lawyer 2 findings | H1(c): Q22; H4: Q36; M1: Q10; M2: Q18 |
| Register section 6 | REG-Q1: Q1; REG-Q2: Q10; REG-Q3: Q15; REG-Q4: Q17; REG-Q5: Q49; REG-Q6: Q8; REG-Q7: Q25; REG-Q8: Q53; REG-Q9: Q41; REG-Q10: Q31; REG-Q11: Q11; REG-Q12: Q54; REG-Q13: Q14; REG-Q14: Q16; REG-Q15: Q10 |
| Register rows open or marked for counsel | CR-001: Q10; CR-004: Q8; CR-005: Q8; CR-012: Q31; CR-014: Q18; CR-015: Q18; CR-016: Q17; CR-020: Q14, Q15; CR-022: Q15; CR-030: Q17; CR-031: Q11, Q12; CR-040: Q16; CR-041: Q42; CR-050: Q1; CR-052: Q1; CR-053: Q54; CR-086: Q48; CR-089: Q47; CR-091: Q28; CR-100: Q49; CR-101: Q49; CR-112: Q41; CR-113: Q41; CR-121: Q47; CR-122: Q46; CR-130: Q39 |
| TDD 05 section 13 | OQ-L1: Q14; OQ-L2: Q50; OQ-L3: Q22; OQ-L4: Q13; OQ-L5: Q25; OQ-L6: Q9; OQ-L7: Q3; OQ-L8: Q8; OQ-L9: Q26; OQ-L10: Q26; OQ-L11: Q54; OQ-L12: Q27; OQ-L13: Q22; OQ-L14: Q52; OQ-L15: Q34 |
| Decisions named in BL-104 | D-002 (re-tier): Q50; D-021: Q26; D-022: Q3; D-039: Q51; D-042: Q28; D-049: Q5; D-050: Q12 |
| Debates | Q-003: Q2; Q-004: Q20; Q-005: Q21; Q-008: Q7 |
| Privacy Policy notes | CN-1: Q39; CN-2: Q9, Q10; CN-7: Q34; CN-8: Q33; CN-9: Q33; CN-13: Q29; CN-14: Q49; CN-15: Q42; CN-16: Q14; CN-17: Q16; CN-18: Q22; CN-19: Q27 |
| CHD notice notes | HN-2: Q16; HN-3: Q54; HN-4: Q11, Q12; HN-5: Q13; HN-10: Q39 |
| Terms Appendix B and notes | item 1: Q37; item 2: Q38; item 3: Q1, Q6; item 5: Q31; item 6: Q29; item 9: Q32; item 11(d): Q4; item 12: Q30; item 13: Q39; note line 48: Q40; note line 60: Q8; notes lines 157 and 178: Q41, Q42; note line 343: Q32; note line 349: Q43 |
| In-app disclosures notes | line 40: Q43; line 62: Q5 |
| Agent team, 3 Oct 2026 | BL-223: Q2, Q5; PR #41 note 3: Q2; PR #41 price promise: Q4; PR #32 review finding 3: Q24; PR #40 Open-4: Q23; PR #38 review finding 4: Q44; PR #38 review finding 5: Q19; PR #38 hand-off: Q38, Q45; PR #46 pledge string: Q30; BL-123 and BL-124: Q46 |

## Sources

**Opened by me on 3 Oct 2026** (through a summarising fetch; quotes as returned):
- California AB 2863 (Business and Professions Code 17602), LegiScan: https://legiscan.com/CA/text/AB2863/id/3022400
- New York General Business Law 527-a, Justia: https://law.justia.com/codes/new-york/gbs/article-29-bb/527-a/
- Washington RCW chapter 19.373, index of sections: https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- Apple App Review Guidelines 3.1.2(a), 5.1.1(ii), 5.1.1(ix): https://developer.apple.com/app-store/review/guidelines/
- Apple App Store Connect Help, Manage pricing for auto-renewable subscriptions: https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-pricing-for-auto-renewable-subscriptions
- Searched, no Apple source found: whether Apple sends notices before a free trial ends or before a renewal (Unverified).

**Cited from repo drafts** (opened by their authors on 2 or 3 Oct 2026; not re-opened here): every other link above, with the draft named next to it. The full lists are REG "Sources" (lines 281 to 316), Terms Appendix A (lines 444 to 486), L1 line 90, L2 line 92 and CHD lines 102 to 110.

**Unverified** (not opened by anyone in this repo): texts of Texas SB 2420, California AB 1043, the amended COPPA Rule, the Connecticut statute (including the 15-day revocation rule), ROSCA, Civil Code 1668, 1670.5, 1751 and 1798.82, Penal Code 632, BIPA, Texas CUBI, Colorado HB 24-1130, the CMIA, the Stored Communications Act, 18 U.S.C. 2258A, CAN-SPAM, the FTC Guide on "Free", 11 CCR 7027(m), and the New York City click-to-cancel rule; Apple's consumer page on price changes (support.apple.com/109501); what Apple's subscription store view shows (for example a cancel-by date).

**Repo sources** (develop `7cc43b1` unless marked): `docs/legal/*` drafts and memos; `docs/tdd/05-privacy-compliance.md`; `docs/DECISIONS.md`; `docs/agents/DEBATES.md`; `docs/agents/BRIEF-2026-10-03.md`; `docs/ROADMAP.md`; `docs/BACKLOG.md`; `docs/analytics/TRACKING_PLAN.md`; `packages/brand/index.ts`; `packages/content/src/strings.en.ts` and `features/billing.en.ts`; `packages/analytics/src/catalog.ts` and `trackers.ts`; `packages/core/src/prompts.ts`; `apps/mobile/src/lib/age-gate.ts` and `billing/*`; `supabase/migrations/20261004000000_plus_on_device_only.sql` and `20261004300000_insights_aggregates.sql`. Open PRs at their heads on 3 Oct 2026: #32 `660e633` (review 5402408550), #37 `76bba69`, #38 `03c6316` (reviews 5402403482 and 5402708838), #40 `49c054a`, #41 `d51815f`, #45 `00946a2`, #46 `b0949bc`.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-10-03 | First version. Collects the open questions from Lawyer 1, Lawyer 2, TDD 05 section 13, the register and the decisions named in BL-104, deduplicated with their original ids, and adds the questions raised by the agent team on 3 Oct (PRs #32, #38, #40, #41, #45, #46). |
