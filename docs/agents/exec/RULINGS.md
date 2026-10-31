# Executive rulings log

Rulings by the council executives other than the CTO (Karma's are in `docs/agents/cto/RULINGS.md`). The protocol is `docs/agents/exec/COUNCIL.md`, section 5. Each entry uses the format in Karma's skill, section 11, and the role code with the next number for that role (`CLO-1`, `CFO-1`). Before numbering, check this file, any open PRs that touch it, and the Project docs `infra/exec-rulings-*`. The founder can overrule any entry in one line, recorded as a new entry that supersedes the old one. Newest last.

### CPO-1 Keep is the commit verb in the PRD (31 Oct 2026, CPO via the platform session)
- Question: F06-REQ-043 says actions say "Save"; the decisions say the parent taps Keep. Which does the spec say?
- Tier and type: T1; clear
- Options considered: keep the requirement as written and change the app; amend the requirement to Keep; leave both and record the conflict
- Ruling: amend F06-REQ-043, F06 section 6.2 ("Save to {child}'s book", "Save just for me"), `F14-plus.md:165` ("taps Save") and add a superseded note on DISPOSITION-C DX-08 (`:87`). The amended P0 row names its test and work package, so the RR-3 ratchet (D-123) still passes.
- Why: D-083 has the parent tap Keep and counts letters kept; D-109's effects say "keeps it on Write"; the app already follows them. A requirement row fixed against a decision of record is the CPO's (CPO skill section 4). Nomenclature audit R-B, PR #422.
- Door: two-way
- Way back: revert the PRD rows.
- Revisit when: a device test shows parents read Keep wrongly at the gate.

### CDO-1 One approval enum, no `withdrawn` (31 Oct 2026, CDO via the platform session)
- Question: the API's sync enum accepts `withdrawn`, which core, the database check and DATA_CLASSIFICATION do not. Keep it?
- Tier and type: T1; complicated
- Options considered: leave it; add `withdrawn` to the database and core; drop it from the API and import core's `APPROVALS`
- Ruling: after the API owner confirms nothing sends it, drop `withdrawn` from `packages/api/src/server/sync.ts:84` and import core's `APPROVALS`, with a test that core, the API and the database check match. Analytics builds its approval enum from core too, so `kept_aside` becomes `set_aside` (audit R-G).
- Why: the API accepts a value the database refuses (`supabase/migrations/20261003000000_security_and_family.sql:396`), and the word collides with consent withdrawal (D-128). No emitter found by grep; intent UNVERIFIED, and production rows UNVERIFIED (production sits at migration 2).
- Door: two-way
- Way back: restore the literal enum.
- Revisit when: the API owner shows a sender.

### CPrivO-1 Sharing claims held from submission (31 Oct 2026, CPrivO via the platform session)
- Question: the store source still says "Private to your family", "Invite your co-parent" and "Only you and the people you invite can read your book". Can a submission carry them?
- Tier and type: T1; clear
- Options considered: allow them; hold them until the store fix lands; rewrite them here
- Ruling: no submission carries `store.en.ts:28,54,60` until the store fix lands (BL-440, now carried by `fix/comms-validation-2026-10-31`). Verify step: the rule test in `rules.test.ts`. The CCO also checks "delete everything, any time, from Settings" against the build before submission (no erase-all control found; UNVERIFIED).
- Why: the first store build has no sharing (D-121, D-126); guideline 2.3.1(a).
- Door: two-way
- Way back: lift the hold in one line here.
- Revisit when: the store fix merges.

### CLO-1 Two pieces of legal draft hygiene (31 Oct 2026, CLO via the platform session; not legal advice)
- Question: the Subscription Terms on `develop` show superseded prices, and the Terms say "a member's access". What happens to them before counsel?
- Tier and type: T1; clear
- Options considered: publish as is; fix the text now; hold publication and route to counsel
- Ruling: `docs/legal/subscription-terms.md` is never published from `develop` while it shows $3.99 and $29.99 (`:32-33`); the D-082 text is reconciled with counsel before submission. In the Terms, "a member's access" (`terms-of-service.md:157`) becomes "a person's access" until counsel picks one defined term. The founder merges both (D-125).
- Why: a subscriber reading the old price and being charged the new one is a refund and a complaint. Audit NA-08, NA-29.
- Door: two-way
- Way back: revert the line.
- Revisit when: counsel answers Q8.

### CCO-1 The listing can't say "exactly as you said it" (31 Oct 2026, CCO via the platform session; not counsel)
- Question: how do we keep D-125 item 9 from drifting back into the store copy?
- Tier and type: T1; clear
- Options considered: rely on review; a checklist line; a rules test
- Ruling: `packages/content/test/rules.test.ts` fails if `storeListing` contains "exactly as you said it", until counsel clears the phrase at T30.
- Why: D-125 item 9 holds the phrase from the listing; guideline 2.3.1(a). A test enforces it; a checklist relies on memory.
- Door: two-way
- Way back: delete the test line when counsel clears it.
- Revisit when: counsel answers Q16.

### CLO-2 Terms 4.0.0, clauses 13.1 and 14.6: founder approval recorded, conditions before publication (31 Oct 2026, CLO via the platform session; not legal advice)
- Question: the founder approved Terms 13.1 (co-parent writing leaves the free-for-as-long-as-we-operate list) and 14.6 (app reminders name no price; future reminder emails described as "not sent yet") on 31 Oct and asked the CLO and CCO to align. Does anything have to change before merge?
- Tier and type: T1; clear. Consulted: CCO (CCO-3 below). CPrivO not needed: no data terms changed.
- Options considered: revert both clauses; merge as drafted; merge as drafted with conditions before publication
- Ruling: aligned. Merged in #447 as `draft-for-counsel` on the founder's approval (D-125 item 5). Before any of this text is published or binds a user: (1) the sentence "Apple's receipt shows the amount you were charged" (Terms 14.6 and the Subscription Terms) is checked on the TestFlight sandbox pass, or cut; (2) counsel reads 13.1 under COUNSEL_PACKET Q14, because 13.3 makes whatever 13.1 lists permanent for existing users; (3) the reminder emails in 14.6 never start until 14.6 is rewritten, as the clause itself says.
- Why: the narrower 13.1 list is less open-ended exposure in the founder's own name than the old "unlimited free writing" promise, which D-082 already ended. 14.6 had promised a price in app reminders that D-083 keeps out, so the old text was untrue. An unpublished draft is a two-way door; publication is not.
- Door: two-way until published
- Way back: restore the co-parent line in 13.1, or cut 14.6's email paragraph to "We do not email you about Plus yet" (`docs/legal/CHANGES-2026-10-31.md`)
- Counsel needed: yes, Q14 and Q8, before publication
- Revisit when: counsel answers Q14 or Q8, or the sandbox pass runs.

### CCO-3 Approving Terms 14.6 does not close the California renewal-notice gap for build 1 (31 Oct 2026, CCO via the platform session; not counsel)
- Question: with 14.6 approved, does the first store build meet California's automatic renewal law?
- Tier and type: T1 for the record; the fix is FOUNDER (it changes what the release shows)
- Rule: Cal. Bus. & Prof. Code 17602 (2025 code, last amended Stats. 2024 ch. 515, read 31 Oct 2026 via https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/; leginfo did not load). (b)(1) covers a free trial "lasting for more than 31 days"; (b)(2) an initial term "of one year or longer"; (h)(1) an annual reminder; (a)(3) an acknowledgment with the offer terms. Applies: Unknown, counsel must confirm, chiefly whether the duty falls on us while Apple is merchant of record.
- Facts: D-121 ships Plus in build 1; `plus.annual` has a 2-month free offer and a one-year term (StoreKit file). No notice from us names the amount (D-083; no email under D-121). Whether Apple's messages carry it in the windows is Unverified.
- Evidence: none that we comply. Status: Gap.
- Ruling: register row stays Gap; the submission gate (1 Dec) holds until the founder picks a route: (i) Recommended: a narrow D-083 exception so the long-trial reminder, the annual reminder, the in-app note and the purchase confirmation show StoreKit's `Product.displayPrice` and period (the amount comes from Apple, never typed), then Terms 14.6 changes once more; or (ii) counsel's written view that Apple's messages are enough. Default if no answer by go/no-go: (i).
- Debate: CLO objected that D-083 kept prices out of app copy so a typed price can never drift. Answer: `displayPrice` is Apple's localized string for that buyer, so nothing is typed and nothing can drift. Route (ii) waits on counsel, who is not yet engaged (W0-13).
- Door: two-way
- Revisit when: counsel answers Q8, or the founder picks a route.
