# Security and privacy open questions: founder, counsel, product conflicts

Task RD-D, `security-architect`, 20 Nov 2026. Docs only. This file answers no founder or counsel question. Each question carries my default or recommendation; a default is a design input, never a public word, a counsel answer or a store submission. Ids are local to this file (`S-n` for security decisions, `F-n` founder, `L-n` counsel, `C-n` conflicts for product, `K-n` conflicts or gaps for Karma and other owners). Questions already open in `docs/tdd/new-scope/security.md` section 8 (OQ-S1 to OQ-S11) and `privacy.md` section 6 (OQ-F1 to OQ-F10, OQ-C1 to OQ-C10) are not repeated; this file adds the ones the newest scope and today's reviews create.

Sources: see `SECURITY-PRIVACY-ACCEPTANCE.md` section 0 for what I read and did not read.

## A. Decisions for me (security-architect) that others wait on

| Id | Question | My answer or default | Needs |
|---|---|---|---|
| S-1 | G1 (#909): does the server gate `sync_pull` reads on consent? | Yes, for OTHER members' rows only, degrading by omission so older builds still parse (API-R11). Own-row reads, export and deletion are never gated (PRIV-R09). Proposed rule text `IAM-R26` in `SECURITY-PRIVACY-ACCEPTANCE.md` 3.3. A MUST changes only by RFC (principal-architect, data-steward, compliance-engineer, ai-eng-lead) and the founder's approval on the PR | RFC handoff; `data-architect` migration; `api` contract; founder approval |
| S-2 | Are NS-49 and NS-51 acceptable at the plist and entitlement level? | Not decided. Each needs the resolved plist and entitlement delta per EAS profile and a binary strings read before any `production` build (NS-49-R6, NS-51-R29). I review the module under NSC-01 once its manifest exists | NSC-01, NSC-02 (not yet built) |
| S-3 | Is the NS-52 video metadata rule acceptable (re-encode dropping every atom)? | Not decided: the API that strips atoms is unverified [U] (NS-52-R5), and phone-video fields are unverified [U] (FR-SEC-30). Default: no video leaves the phone by share or print until the spike lists the fields on Asha clips (Q-S9) | The spike; founder after it |
| S-4 | X2 read for NS-52 Variant A (media stays on the phone, in the iPhone backup)? | Nothing leaves our feature, so X2's "sent by a feature of ours" does not apply by `privacy.md` 1.1 Rec; but the iPhone backup is Apple's. The where-it-lives line must say it, as NS-01-R32 does. My read counts only when posted dated on the PR | Posting on the NS-52 PR |
| S-5 | X2 read for NS-52 Variant B | Not given. Preconditions: separate private bucket never the closed `entry-photos`; signed URLs at most 5 minutes (Q-S8); membership checked in an Edge Function; delete or move on revoke; byte caps and rate limits; the access matrix test with non-member, left member and second account; independent test (Q-S10) | Counsel and founder decision on Q-PM-3 first |

## B. Founder questions (defaults hold until answered)

| Id | Question | Default or recommendation | Why it matters for security or privacy |
|---|---|---|---|
| F-1 | Writing tools (D2, #868 item 1): accept the recorded finding (no switch exists in React Native 0.86.3), or fund the small native setting? | Recommend funding the native setting (NSC-05), iOS 18 and later with an availability check, under the NSC-01 gate. Until decided, gate G6 keeps photos off in `production` and NS-06-A22 (Firsts label) waits | The phone's own service may act on letter text; whether it leaves the phone is unverified [U] |
| F-2 | Photo moments access (Q-PM-1): limited library or full read by default? | Recommend limited by default, full only if the parent chooses (least privilege; the card says the app works under both, NS-51-R3) | The size of what the app can see |
| F-3 | Do pictures and videos sync to our servers (Q-PM-3)? | Variant A (stay on the phone, in the iPhone backup). Variant B only after my read, counsel's read and a cost estimate | X2; the label; the biggest cost and risk decision |
| F-4 | Transcribe a video's sound (Q-PM-4)? | No (NS-52-R6) | Child's voice; constitution (no words added) |
| F-5 | Place names in moment suggestions (Q-PM-5)? Any image analysis beyond dates (Q-PM-6)? | Off; none (NS-51-R5, R33) | Location, faces, biometric law |
| F-6 | Video and picture limits (Q-PM-2): 6 pictures and 2 videos, 60 seconds, 100 MB (card defaults, ASSUMED) | Keep as proposed until the spike | Denial of service and storage |
| F-7 | Public day names in lock-screen titles (Q-FD-18) | Hand-listed seasonal and shared days only, neutral title for every other day, neutral for all with App lock on (NS-46-R36) | A faith day on a lock screen |
| F-8 | Who is accountable for the October review of every day row (Q-FD-10)? | The founder accountable, `content` reads | A wrong date is a trust fault, not a security one, but a stale table is a risk row |
| F-9 | The G1 server gate: block others' rows at once on a newer Terms version, or after a grace window? | Grace window as POLICY_VERSIONING sections 5 and 6 say [U: I did not re-read the numbers]; age attestation never graced | Whether a parent is locked out of the family's letters |
| F-10 | Should the agent lane stay off (OQ-S2) now that NSC-12 still has no test? | Yes, off (`scripts/agents/lib.mjs:250-254` still fails open to "founder" for any new first-line format from the owner account [V]) | Untrusted text reaching an agent in the founder's voice |
| F-11 | Independent security test (Q-S3, Q-S10) before any media upload ships | Yes if Variant B ships; spend is the founder's | Storage rules and decoders |
| F-12 | A secret scan in CI, and `docs/ops/SECRETS.md` | Yes. Neither exists [V: no gitleaks, trufflehog or secret-scan job in `.github/workflows`; `ls docs/ops/SECRETS.md` fails] | SEC-R02, SEC-R03 |

## C. Counsel questions (a counsel answer is never defaulted)

| Id | Question | What I need to know | Engineering default until answered |
|---|---|---|---|
| L-1 | Is a ticked tradition day (stored only on the phone, never sent) special-category data under GDPR Article 9 or a state "sensitive data" law, and does that need a recorded act (PRIV-R21)? (CUL-Q5, Q6, Q7, Q11; Q-DAY-6, Q-DAY-11) | Whether a consent record, an Article 7 line or a different design is owed | Flag off in `production`; the store is L4, phone only, optional, withdrawable. No server row |
| L-2 | Add religion, ethnicity and origin to the compliance register. It lists Article 9 for health only (CR-100, `docs/legal/compliance-register.md:163`) [V]; the state sensitive-data rows CR-020 and CR-022 are not tied to this store [V]; the data policy treats "languages spoken" as a proxy for ethnicity (`docs/legal/data-policy.md:46`) [V] | A register row, naming CR-020 and CR-022 beside CR-100 | None; file with `legal`. Any label or register conclusion is counsel's |
| L-11 | Does a phone-only days list create any data-access or deletion-request duty, given we hold nothing? | Whether a parent can ask us for it | None; the list is on the phone and clearable in Me |
| L-3 | Apple's App Privacy label: does a device-only store holding religious or philosophical belief signals count as "not collected"? Apple lists religious or philosophical beliefs under Sensitive Info (NS-47 section 17) | The label answer for NS-46 and NS-47 | Engineering design default, counsel decides: "not collected" while NS-47-R4 holds; re-checked every build (NS-47-R23) |
| L-4 | A child's picture or video leaving the phone by the parent's own share sheet or Save a copy (Q45), a child's voice (Arm V, backup flip, NS-28), another adult in a picture or video (Q48) | The X2 reading | Text-only share at Level 1; no hosted media; NS-16 flag off |
| L-5 | App Review 5.1.1 and the photo-library usage string for a child's pictures (NS-51-R31); DPLA 3.3.3(H) for the Journaling Suggestions entitlement (NS-49-R27) | Wording and risk of rejection | Flags off in every profile |
| L-6 | Day reminders as "local notifications for marketing" under DPLA Attachment 1 section 2.2: opt-in consent language and opt-out (NS-46-R35) | Whether the reminder consent line is enough | Treat it as applying; the line shown before the first tick |
| L-7 | Biometric-law exposure if a face or person were ever matched (BIPA, CUBI) | Not engaged while nothing is built (NS-51-R33) | Never build it |
| L-8 | Source licences for any copied day table (FR-DAY-23) | Right to use each table | Rule dates computed, tables `n/r` unless counsel confirms (NS-46-R1, R23) |
| L-9 | Video of a child in a book that two parents share after a separation (RSK-30; Q50, Q53) | Whether any removal path beyond the 72-hour undo is owed | Ruling D11 holds; Variant A limits media to the author's phone |
| L-10 | The earlier-versions line owed in the Privacy Policy today (`privacy.md` F-3) | Whether it waits for NS-12 | Next policy PR (OQ-F9) |

## D. Conflicts for product (the locked pack at `450bcb4a` stands; I design to it until product rules)

| Id | Conflict | Locked source | Newer source | My recommendation |
|---|---|---|---|---|
| C-1 | Library access: the locked pack forbids it (NS-01-R22 "no library access"; NS-01-R33 scans; NS-49-R25 no library string, no PhotoKit call, no `PHPhotoLibrary` in the 1.x line). NS-51 builds exactly that behind its own flag, and rewrites R25 into an allowlist for one module (`27-photo-moments-and-media.md` rows NS-01-R22, NS-49-R25 in "Changes to locked cards") | NS-01, NS-49 in the locked pack | NS-51, founder direction 20 Nov (`26`, RV-18) | The founder's direction is the authority for a later drop; the locked rows must be re-locked through an errata PR before any code. Until then the scans in NS-01-R22, R33 and NS-49-R25 stay as written and fail the build on a library call |
| C-2 | One picture per letter, no video, no multi-select (NS-01 sections 3 and 4, R21a, R22) against up to 6 pictures and 2 videos (NS-52-R1) | NS-01 | NS-52 | Same: errata first. `entry_media.kind` gains `video` by a local migration 12 (PROPOSED); that migration needs the G11 guard and an inventory row |
| C-3 | The NS-01 never-line "the photo library ... any picture the parent did not pick" is lifted only for NS-51 | NS-01 | NS-51 | The lift must name the module (`scribe-photo-library`) and keep faces, scenes and "not picked" |
| C-4 | The lock-screen sentence in the direction ("Some pictures from the weekend are here", `26` section 2) against NS-51-R11 (the neutral title and body used for hidden previews; picture wording only inside the app, Q-PM-9) | Direction | NS-51-R11 | Follow NS-51-R11: a lock screen should not say the person has pictures; keep the wording neutral and identical to the other hidden-preview text |
| C-5 | NS-49 section 18 says "Level 3 would change it and is closed". NS-51 now opens it | NS-49 | NS-51 | Reword in the errata |
| C-6 | NS-47-R6 puts the Days store in a file outside `scribe.db`, but `privacy.md` section 4 assumes keys live in `settings` inside `scribe.db` (the recovery export ZIP copies the whole database, `recovery-export.logic.ts:34` [V]) | `privacy.md` | NS-47-R6 | NS-47 is right for L4; the inventory (`privacy.md` I1) must list the Days store file and `culture.asked` separately, and the recovery export README must say the Days file is not in it |
| C-7 | One names switch or two: `notifications.lockScreenNames` (child) against `notifications.dayNames` (day); typed-day words follow the day switch (NS-47-R37, needs an NS-18-R3 errata row) | NS-13, NS-18 | NS-47 | Two switches, as NS-47 says; the Days page is the home of the day switch. Karma rules the errata row |
| C-8 | `[X4-R1]` says a second account "never sees" the first account's letters, while the D1 sign-out sheet says "anyone who opens the app here can read them" (`security.md` K-2) | Locked X4 | D1 sheet | The card should say what B's screens show; FR-SEC-04 says nothing may name A |
| C-9 | NS-05 Level 1 picture gating (`security.md` K-1, `privacy.md` P-1): both reads, not counsel alone | NS-05 section 3 | Frame section 7 | Carried, unchanged |
| C-10 | NS-49-R25 and NS-51-R32 both say flags are off in every EAS profile, while NS-46 says `EXPO_PUBLIC_DAYS` "ships on once copy and counsel gates pass" | NS-46 section 10 | NS-51-R32 | For the days flag, "on" means on in a profile only after the counsel answers in L-1 to L-3; a test fails a release profile that enables it early (NS-51-R32 pattern) |
| C-11 | The FR-SEC-27 premise that `entry-photos` is closed (`SCPHO`, NS-01-R61) | Addendum | Code | Not true on develop: client policies on `entry-photos` still exist in `supabase/migrations/20260930000000_scribe_core.sql:294-303` [V] and `photo_bucket_closed.test.mjs` does not exist [V]. BL-870 and NSC-11 are open. Send to `sync` and `data-architect`; the product text should say "closed once BL-870 merges" |

## E. Gaps and drift for Karma and other owners

| Id | Finding | Evidence | Owner |
|---|---|---|---|
| K-1 | `agents/roster.json` `review_paths` for me lack `apps/mobile/modules/**`, `supabase/tests/**` and `apps/mobile/scripts/preflight-testflight.mjs`; the charter lists `supabase/tests/**` | `agents/roster.json:237-253` read 20 Nov [V] | Karma, founder (`/agents/` is founder-owned) |
| K-2 | SEC-R10 drift: 17 `uses:` lines pin a tag, not a SHA, in `ci.yml` (7), `web-e2e.yml` (5), `web.yml` (3), `migration-guard.yml` (2); 74 are pinned | `grep -rn "uses:" .github/workflows` [V]; `security.md` K-7 only noted `agents.yml` | `ops`, `security` (I review `.github/**`) |
| K-3 | No secret-scan job; `docs/ops/SECRETS.md` and `docs/security/threat-model.md` do not exist (SEC-R01, SEC-R02) | `ls`, grep [V] | `security`, `ops` |
| K-4 | NSC-12 not built: `isFounderComment` excludes only listed marker prefixes and treats other first lines from the owner account as the founder | `scripts/agents/lib.mjs:250-254` [V] | Karma |
| K-5 | `security.md` cites `apps/mobile/scripts/preflight-testflight.mjs:589-590` for the background-modes refusal; it is now at 599-600 [V] | grep | me, in S-8 |
| K-6 | `privacy.md` 1.10 says `recordConsent` mints a new key per call; fixed by #903 (`consent.ts:110-117`) [V]. `security.md` risk 3 says "no code or test scopes ... to the owner"; the pure reader and its test landed (#869) but the gate is not yet wired [U] | commits `b27f690e`, `c1306b18` | me and `privacy`, next sweep |
| K-7 | The label guard (G11) runs only where someone runs it: the workflow is in `docs/ops/proposed/workflows/label-guard.yml` and the founder copies it to `.github/workflows` (D-124); there is no `label-guard.yml` in `.github/workflows` [V: `ls`] | `docs/ops/LABEL_GUARD.md`, `ls` | founder, `ops` |
| K-8 | NSC-01 (native manifest), NSC-02 (plist allowlist), NSC-03 (second-account test over every surface), NSC-04 (App Intents tokens, partly), NSC-05 (writing-tools setting), NSC-11 (bucket test) are all `not yet` on develop [V per grep of file names] | `apps/mobile/modules/REVIEWED.sha256`, `native-sources.test.ts`, `photo_bucket_closed.test.mjs` absent | `mobile`, `ops`, `sync` |
| K-9 | The cards for NS-46 to NS-52 are unlocked inputs; backlog rows have no ids (`NR-DAY-*` are the cards' own proposals). Each needs a backlog row and an inventory row in the one founder-merged `docs/legal` PR (privacy I1) before its flag can turn on | `21-...md` section 10 Backlog | `product`, `privacy` |

## F. What needs the founder first (short list)

1. D2 writing tools: accept or fund (F-1). It blocks photos, the Firsts label and every typed-words field in production.
2. Whether to build Photo moments and media at all in the next drop, and Variant A or B (F-2, F-3). Conflicts C-1 to C-3 must be re-locked first.
3. Counsel on days and cultural background (L-1 to L-3, L-6). Nothing ships before that.
4. G1 decision and RFC (S-1, F-9).
5. Copy the label-guard workflow and approve a secret scan and `SECRETS.md` (K-7, F-12).

## G. What I could not verify

- Anything on a phone or a hosted project. Whether writing tools send text off the phone. The protection class of copied files. FTS5 `secure-delete` and WAL residue in the expo-sqlite build.
- Apple behaviour: limited-library alert suppression key, iCloud-only thumbnails, the suggestions picker, video metadata atoms and the API to strip them, the entitlement request.
- Whether the first-run gate is wired to `bookVisibleTo` (only the reader and its test are on develop).
- The function files I read only in part (see `SECURITY-PRIVACY-ACCEPTANCE.md` section 0), and `docs/product/prd/tools/**`, the e2e design and eval A to C, not read.
