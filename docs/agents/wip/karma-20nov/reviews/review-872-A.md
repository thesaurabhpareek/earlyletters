## Review A at e66b3436c62b2680ea780831452fef52dd0cbf1d: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness and accuracy. BL-949: `docs/legal/COUNSEL_PACKET.md` 1.5.0 to 1.7.0, new section 7 (26 questions), section 6 items 9 to 12, and one check-in line. The founder merges.

Must fix: none.

## What I checked

- File:line facts on develop 20553b18. 31 of 33 hold. The 2 that do not are notes 1 and 3 below. Those that hold:
  - `privacy-policy.md:21, 33, 35, 37, 55, 90`; `app-store-privacy-labels.md:45, 54, 57, 84`.
  - `gate.logic.ts:123-125`; `sync/ownership.ts:49`; `auth/consent.ts:117`, which calls `idempotencyKey()`, a fresh UUIDv7 each call (`supabase/client.ts:147`); `family/share-text.ts:8`.
  - `terms-of-service.md:100-105` (Read together is in 8.2's closing paragraph, line 105; 8.4 is "What Plus is", line 109).
  - `plan-reminders.logic.ts:17-22, 23-27, 28-31, 48, 65-76`: every window value matches.
  - `claims-capabilities.test.ts:206-211`; `features/auth.en.ts:145-147`.
  - `20261002020000_data_governance.sql:175-185`; `20260930000000_scribe_core.sql:157`; `20261016000000_sync_v1_server.sql:782-784`; `20261023060000_explicit_grants.sql:49-51` (entry_versions has no grant).
  - `sync.ts:157`; `08-data-rights-and-legal-requests.md:35`; `DECISIONS.md:669`; `docs/legal/DELETION_AND_EXPORT_SPEC.md:337`; `adr/0028...md:254`; `export/build.logic.ts:742` (`data/other-versions.json`).
- Card and record cites: 24 of 24 hold.
  - NS-06-B11 with OQ-B3; the B12, B16, B17 and B18 section refs; B17's "number by legal" (06:503).
  - NS-16-R5, R8, R15, R18; NS-12-R6, R7; NS-03-R1, R2, R4, R5; NS-01-R15, R26, R61; NS-25-R16.
  - NS-32 sections 3, 5 and 19 (plan notices outside the budget, `active` level, Focus applies).
  - 15-council "not fully closed" (four topics, :57-59); 16-council T1 and T2 (:41-42) and section 6 (Show Previews, :111); plan #847 Q3 (no seal code until counsel answers).
- Numbering. #598 (head dc799fb9) claims Q58 to Q74 and names packet 1.6.0 (`account-experience-obligations.md:39`). BL-780 reserves Q75 to Q77 (#760's section 3, :287). #760 (head f6e08de9) uses Q78 to Q106. I searched all 783 `origin` branches for Q107 and higher in `docs/legal`, `docs/compliance`, `docs/product`, `BACKLOG.md` and `DECISIONS.md`. The only hits are this branch and #760's search note ("Q100 to Q199"). Q107 and Q108 are free, and 1.7.0 is right.
- Lettering. New parts follow on from the 1.5.0 letters, for example:
  - Q41's develop letters run to (i), so (j) to (l).
  - Q54's run to (e), so (f).
  - Q46 has three unlettered parts, so (d).
  - Q43, Q44, Q45, Q48, Q49, Q50 and Q51 count their unlettered parts as the 7.0 rule says.
  - The question count is right: 2 new + 12 merged + 12 cited = 26.
- Build 13. Q41 (j) to (l) are stated right. The windows are data in one file. `active` versus `time-sensitive` matches NS-32. "A missed window is skipped" matches `:27`. "Store candidate, as Q41 already does" matches 1.5.0's priority A ("blocks ... submission"). Q108(a) is stated right: the trigger and the missing grant are as cited, the policy at `:35` names no earlier versions, and labels `:84` puts servers on in the store build. Its default (name them in the next policy PR) is a default, not a conclusion.
- No legal conclusion. Each entry gives facts, a question, a labelled default and "if no". Law cites that were not opened are marked U (16 CFR 312, Civ. Code 1798.110, the time-sensitive entitlement). The "this is not legal advice" banner stays.

## Findings, most serious first

1. Note: Q48 (7.9) says the co-parent sees the speaker's name "through `book_entries` (`data_governance.sql:210`)". Since `20261023060000_explicit_grants.sql` no role has a grant on `book_entries` (`:50`; `supabase/tests/access_matrix.test.mjs:131` expects 42501 for every role). The co-parent gets `author_signs_as` from the sync pull (`20261016000000_sync_v1_server.sql`, the pull's `'author_signs_as'` field). The conclusion holds; the path does not. Cite the pull.
2. Note: the packet now contradicts itself on Terms 8.4. Section 4's Q40 row (unchanged, carried from 1.4.0) says Read together and a book per child are "stated in 8.4". Section 7.3 says the "8.4" cite in T1 and NS-24 is a slip. Fix the Q40 row in the same PR, or say in 7.3 that the 1.5.0 Q40 row has the same slip. The 0 note says sections 1 to 6 are unchanged.
3. Note: Q45 (7.7) says the typed name is "1 to 30 characters" and cites `data_governance.sql:95`. That line only caps it at 30 (`char_length <= 30`). The lower bound comes from the client (an empty value is pushed as null, `nullif(d ->> 'author_signs_as', '')`). Say "up to 30", or cite where 1 is enforced.
4. Note: the merged questions in sections 2 to 4 (Q41, Q43 to Q46, Q48 to Q51, Q54, Q32, Q40) carry no pointer to their new parts in section 7. Counsel who reads Q41 in section 2 will not see (j) to (l) unless they start from 7.1. One line under each, such as "New parts: 7.4", would close it.
5. Note: the PR body's "What blocks Build 13" says the store candidate "waits on two items". That is right for counsel items. Section 6 item 9 (the policy's build list, before any servers-on store build links it) and item 10 (BL-961, BL-978) also hold the store candidate. Plan #847 3a and Q1 list neither Q41 nor Q108(a). The founder should see that the packet adds Q108(a) as a store-candidate gate the plan does not yet carry.
6. Note: Q51's let-go row says the draft "comes back as one the parent can keep" when the server kept it. That matches `sync/merge.ts:583-592`. It is also the case #866's "cannot be brought back" line must survive (see review-866-A), so (h) is the right question to ask.

## Not verified
- The engineering designs (privacy C1 to C10, F1 to F10, P-5, P-6; security OQ-S4 to OQ-S8, 3.3, 3.5 to 3.7; 08-keeping, 09-capture, 10-reading, data-and-sync OQ-C1): not in the repo. So the 7-day versus 38-day conflict and the "Raised by" column are unchecked.
- The Q-003 memo section 5 timing reads, and the state laws behind Q41 (j).
- That Build 12 was submitted with Q41 unanswered. That bears on whether "blocks" means block or "default applies" (section 0).

CI at e66b3436: every check is complete and green (some compliance-fence runs were cancelled by later runs; one passed). The head is more than 10 minutes old.

Reviewer: independent of the author (CR-44).
