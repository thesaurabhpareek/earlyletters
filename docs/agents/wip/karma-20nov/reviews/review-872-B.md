## Review B at e66b3436c62b2680ea780831452fef52dd0cbf1d: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy, compliance and promises to users (chapters 07 PRIV, 08 DSR). Files: `docs/legal/COUNSEL_PACKET.md` (1.5.0 to 1.7.0, +257 -2) and `docs/agents/checkins/legal-bl-949.md`. Head committed 11:10:43 UTC, read live at 11:19 UTC and again after 11:21 (unchanged). CI on the head: complete. Twelve checks pass. One duplicate `compliance-fence` run was cancelled, and its sibling run passed. The founder merges this file (D-125). This review approves nothing in it.

Must fix: none.

## What I checked
Facts. I sampled 35 cites on `develop` at `20553b18`, the code base the packet names. 33 hold. One path is stale and one range is loose (notes 1 and 2). Neither changes a question.

Hold:
- The three mismatches it lists are real:
  - `privacy-policy.md:21` says the first App Store build has servers off. `app-store-privacy-labels.md:84` says Build 12, the first store build, has servers on and requires sign-in (D-157, D-160).
  - `privacy-policy.md:90` says an invitation "names the parent who sent it". `share-text.ts:8` fills `{child}` into the message and title (`family.en.ts:68, 73-74`).
  - The 1.5.0 sign-in line ("Your book is shared only with the co-parent you invite", Q43 at `COUNSEL_PACKET.md:67`; `in-app-disclosures.md:25`) fails NS-10-R3 today. `gate.logic.ts:123-125` opens the local book for any session. `ownership.ts:49` only throws `AccountMismatchError` for sync.
- NS-10-R7: `consent.ts:117` mints a new idempotency key per call.
- Terms: `terms-of-service.md:100-105` (Read together sits outside the 8.2 list); `:109` (8.4 is "What Plus is").
- Plan notices: `plan-reminders.logic.ts:17-22, 23-27, 28-31, 48, 65-76`.
- Claims: `claims-capabilities.test.ts:206-211`; `auth.en.ts:145-147`; `privacy-policy.md:33, 35, 37, 55`.
- Schema: `data_governance.sql:95` (30-character cap), `:175-185` (the version trigger with `auth.uid()`); `scribe_core.sql:157` (cascade); `sync.ts:157` (insert-only); `explicit_grants.sql:49-51` (no client grant on `entry_versions`); `20261023020000_purge_legal_holds.sql` exists; `sync_v1_server.sql:782-784` (`kept` on newer words or a hold).
- Labels and spec: `app-store-privacy-labels.md:45, 54, 57`; `DELETION_AND_EXPORT_SPEC.md:337`; ADR 0028 `:254` (its Q6).
- My chapter: DSR-R04 at `08-data-rights-and-legal-requests.md:35`. The Q48(e) and (f) defaults match it.
- The founder quote ("I approve all requirements.") is at `00-product-frame.md:3` on `450bcb4a`. #598 and #760 are open drafts, as cited.

Boundaries:
- No legal conclusion. Every legal point is a question to counsel. The 1.5.0 COPPA reading is cited as an earlier reading, not restated as a finding (Q45(b)). The two statutes it cites carry "U: not opened".
- Defaults are product defaults: what ships, what stays off, or what stays absent until counsel answers. Each has an "If no" line.
- Nothing settles a founder item. Building the seal is left to the founder (#847 Q3). The export of versions goes to the founder (Q108(c)). Section 6 item 12 lists founder decisions with their defaults and does not decide them.
- Card over design (CR-66): stated in 7.1 and applied in Q50 and Q108(c).
- Q51(h) asks counsel whether "Let it go" can stand with K2's two server exceptions. That matches what I raise on #866 and #870.
- No user content, real family detail or founder detail. ASCII only.

## Notes
1. Q48 says the co-parent sees the typed name "through `book_entries` (`data_governance.sql:210`)". Since `20261023060000_explicit_grants.sql:49` no client role holds a grant on `book_entries`, so the co-parent reads it through the sync pull. The fact that the co-parent sees the name still holds. Only the path is stale. Cite the pull.
2. Q45 says the typed name is "1 to 30 characters" (`data_governance.sql:95`). That line sets only the 30 maximum. The minimum comes from elsewhere (NS-16-R6 on the card). Cite both, or say "at most 30".
3. Section 6 item 11 understates the gap in two ways. First, the plain invite message (`family.en.ts:71, 73`, no `signsAs`) names no parent at all. Second, alpha builds already show the invite when servers are on (D-162), and they link the same policy. "Before NS-25 reaches a store build" is a timing for the founder to choose, not a given. Say that the gap exists in alpha builds today.
4. Section 6 item 9 says "before any servers-on store build links the policy". `app-store-privacy-labels.md:84` names Build 12 as that build. If Build 12 is already in review or live, that "before" has passed. State the build's status, or say the correction is due now.
5. Q32's default says "covered by Privacy 9". That reads like a legal position. "The product treats these as letter content under Privacy 9 until counsel answers" keeps it a default.
6. Q108(a)'s default ("as a minor change") is the very point the question asks. The packet already makes (a) block the Build 13 candidate, so nothing ships on the default. I suggest one sentence saying so beside the default.

## Not verified
- 16 CFR 312 and Cal. Civ. Code 1798.110: both hosts (`www.ecfr.gov`, `leginfo.legislature.ca.gov`) fail to resolve in this session too. The packet marks both U.
- The 20 Nov designs (privacy, security, 09, 10, data-and-sync) cited by section: they are not in the repo.
- Section 6 item 12's statement that "Each has a default in force".
- That Q58 to Q106 are claimed and that no Q107 exists on any branch.

Reviewer: independent of the author (CR-44).
