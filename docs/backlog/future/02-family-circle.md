# Future backlog 02: family and the circle around the child

Owner: pm-2 (family-circle lead). Draft 1, 3 Oct 2026. Scope: everything after v1.0 that widens, protects or deepens the circle of people who write to, hear and read a child's book. This is a proposal for the coordinator to merge; nothing here is decided. Item ownership across the five future-backlog files follows `docs/agents/DEBATES.md` Q-006 (pm-5 proposal; replies from pm-1, pm-2, pm-3 and pm-4). Where another lead owns a piece, this file cites it and does not re-score it.

Changelog: Draft 1, 2026-10-03: first family-circle future backlog, 17 items (the 14 requested, plus family notifications, multi-book invites and role change, and the Plus requirement), RICE with population assumptions, the floor rule, top 10 and will-not-build list; ownership per DEBATES Q-006 and Q-008; item ids cross-checked against `01` (CVL), `03` (BK), `04` (G) and `05` (T5).

Sibling files: `01-capture-voice-languages.md` (pm-1), `03-book-keepsakes.md` (pm-3), `04-growth-monetisation.md` (pm-4), `05-trust-platform-insights.md` (pm-5).

---

## 0. How to read this

**Tags**
- **[F]** Fact: checked in the repo or a cited source on 3 Oct 2026; the path or document is named.
- **[R]** Research finding: carries the research file's own tag (V verified, S secondary, U unverified, I inferred).
- **[A]** Assumption: my estimate. Validate in the C1 beta and the insights loop before relying on it.
- **[Rec]** Recommendation. **[Q]** Open question, with who answers it.

**RICE**
- **Reach:** families touched per quarter, **per 1,000 active families** [A]. A rate keeps scores comparable without inventing a user count.
- **Impact:** 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.
- **Confidence:** 30% to 100%.
- **Effort:** engineer-weeks with agents writing the code and the founder reviewing, tests included [A]. TDD or DECISIONS estimates are used where they exist and cited.
- **Score** = Reach x Impact x Confidence / Effort, rounded.
- **Floor rule [Rec]:** an item that prevents irreversible loss of a family's words, or a safety harm, is not ranked by RICE alone. It ships before, or together with, the feature that creates the risk. RICE undervalues rare and severe events (separation, abuse, an author's death), so those items say "floor" next to their score.

**Size:** S under 1 engineer-week; M 1 to 3; L 3 to 6; XL over 6.

**Horizon**
- **Now** = v1.1, targeted 6 to 8 weeks after the v1.0 release (ROADMAP 2.0 section 6), so about January 2027 [A].
- **Next** = v1.2 and v1.3, about February to May 2027 [A].
- **Later** = after v1.3.

**Population assumptions behind Reach [A]** (each one is a validation task for the insights loop):

| Id | Assumption | Support |
|---|---|---|
| A1 | 65% of active families have two parents who could both write | None in the repo; C1 beta will show it |
| A2 | 50% have at least one relative, usually a grandparent, who would write if asked | 76% of US grandparents say digital tools are a primary way they stay connected [R UR 1.4, F S15]; grandparents are the reason families adopt memory apps in every market studied [R global 4, I] |
| A3 | About half of those relatives cannot or will not install an iPhone app (Android, no smartphone, a non-US App Store, confusion) | Only 40% of older people in India own a smartphone and 66% find digital tools confusing [R global 2.1, S G64]; v1.0 is iOS and US storefront only [F ROADMAP 2.0 section 5; LEGAL-REQ-058] |
| A4 | About 25% of two-parent families mix iPhone and Android | Mixed-platform families are routine in reviews and Reddit [R us 6.12, I] |
| A5 | Separation or high conflict touches about 3% of families a year | 50% of divorced parents wish they had saved more [R UR 1.1, F S8]; no base rate in the repo |

---

## 1. Where v1.0 leaves the family

| # | Fact | Source |
|---|---|---|
| 1 | Family at v1.0 is co-parent only. The app hides the Family (contributor) path; other family members and the web contribution page come later. | [F] BRIEF decision 5; ROADMAP 2.0 sections 1 and 5 |
| 2 | The database already supports contributors: `create_child_invite(p_child, p_role, p_signs_as)` with role `contributor` and a 14-day expiry; `entries.approval`; `review_family_letter` (first action wins, with `p_expected`); `withdraw_family_letter`; `set_member_auto_add`; `children.family_can_read`; photo reads by role. | [F] `supabase/migrations/20261003000000_security_and_family.sql` |
| 3 | Not built: the `book_access` table (D-024); a parent removing a family member (no `remove_child_member`); leave with keep-or-take; return links; the contributor gateway; `apps/web`. | [F] function list across `supabase/migrations/`; `supabase/APPLY.md` line 248; TDD 10 risk 10 |
| 4 | Any parent may invite another parent. The server sets **no cap on parents per book**, and parents cannot remove each other. The app hides the invite card once a co-parent or a pending invite exists, so only a modified client reaches a third parent today. | [F] `create_child_invite` in `20261003000000`; `apps/mobile/src/app/(tabs)/family.tsx` lines 86 to 87; PRD B F8 |
| 5 | The last parent cannot leave a live book. | [F] `child_members_guard` in `20261002020000_data_governance.sql` |
| 6 | No audio leaves the phone in v1.0. A co-parent reads the other parent's letter but can hear it only on the recording phone or from an export. | [F] BRIEF decision 9; TDD 10 contradiction 9 |
| 7 | Invites travel as `https://earlyletters.com/i/<token>`, with the token in the path. Without the app the page offers the App Store. The website must not log `/i/` paths; TDD 04 prefers a fragment. | [F] `docs/ops/AUTH_SETUP.md` 5.3 |
| 8 | The 8-character invite code (A-REQ-029) has no server column yet; v1.0 accepts a pasted link. | [F] `child_invites` changes in `20261003000000` (only `revoked_at`, `signs_as`); `packages/content/src/features/family.en.ts` `accept.pasteLabel` |
| 9 | A phone's local book belongs to one account. A second account signing in gets `AccountMismatchError` and nothing changes. | [F] `apps/mobile/src/lib/sync/ownership.ts` |
| 10 | Plus is checked on the device only. A co-parent gets Plus only through Apple Family Sharing. No server of ours sees purchases. | [F] BRIEF decision 3; `supabase/migrations/20261004000000_plus_on_device_only.sql` |
| 11 | No server push in v1.0 (local reminders only), so a co-parent's new letter arrives silently. | [F] ROADMAP 2.0 section 5; BACKLOG BL-196 (now post v1.0) |
| 12 | Server aggregates already count distinct authors per family per week (`voices`) and invites by role. | [F] `supabase/migrations/20261004300000_insights_aggregates.sql` |
| 13 | No automatic deletion of inactive accounts. | [F] `docs/legal/data-policy.md` line 190 |
| 14 | Deleting an account removes that author's letters from every book, including a shared one. "Leave my letters for {child}" is P2 and needs a licence that survives deletion. | [F] PRD K-22; B-REQ-025; Lawyer 1 M7 |
| 15 | Product copy may not contain die, died, death, dead, passed away and similar; legacy copy speaks of time, never endings. | [F] `packages/content/test/rules.test.ts` line 113; `packages/content/VOICE.md` "The legacy rule" |
| 16 | Email bodies and subjects carry no content; the email provider is L3, transactional only. A child's name is L4. | [F] `docs/legal/DATA_CLASSIFICATION.md` lines 63 and 732; PRD 7.10 |

**Doc drift [F].** PRD 1.3 (K-35, PRD-REQ-021), DECISIONS D-002 and D-032, and BACKLOG M6 and M7 still describe Family contributors and shared voice inside v1.0. BRIEF decisions 5 and 9 and ROADMAP 2.0 supersede them. Request to the coordinator: add superseding D-entries so later agents do not rebuild v1.0 scope from PRD 1.3 (section 5).

---

## 2. Principles for the circle

1. **Authors own their words.** Nobody edits or deletes another person's words, in any family situation (constitution; DATA-REQ-015). Parents choose which family letters go in the book.
2. **Parents are equals.** Family members belong to the child's book, not to the parent who invited them (PRD B F8.4).
3. **Writers and readers are different people.** Never nag a reader to become an author. Tinybeans followers write "I DON'T HAVE A TINYBEANS OF MY OWN!" [R us 9, theme 8, V].
4. **The circle widens one person, one child, one explicit parent act at a time.** Private by default.
5. **Meet relatives where they are** (their phone, their language, their chat app) without moving letter content into channels we do not control.
6. **No presence signals.** No "seen by", read receipts, last active, typing or location. In a separated family these become surveillance (TDD 04 adversary A1).
7. **Family is free.** Invites, family authors, approvals and hearing each other's voices in a shared book are never Plus (founder, C 4.1; us.md 8.3 point 4).
8. **Machines never write, imitate or continue anyone** (CLAUDE.md constitution; adjacent A2 ethical lines; pm-1 owns the "we never imitate a voice" rule).

---

## 3. Summary

| Id | Item | Horizon | Size | RICE | Owner |
|---|---|---|---|---|---|
| FAM-03 | Family hear each other's voices (shared voice) | Now (v1.1) | L | 390 | pm-2 |
| FAM-07 | A relative records on the parent's phone (guest author) | Now (v1.1) | S to M | 280 | pm-2 |
| FAM-17 | Family-letter notifications | Now (v1.1) | M | 228 | pm-2 |
| FAM-04 | Invites through WhatsApp, iMessage and WeChat | Now (v1.1) | M | 200 | pm-2 (pm-4: invites as an acquisition channel) |
| FAM-14 | Android co-parents and relatives (family slice) | With pm-5's Android release (T5-16: v1.2 recommended, v1.1 per founder) | M | 175 | pm-2 slice; app pm-5 |
| FAM-01 | Family members as authors in the app | Now (v1.1) | M | 140 | pm-2 |
| FAM-02 | Approval flows beyond the core | Next (v1.2) | S to M | 120 | pm-2 |
| FAM-09 | Shared family prompts (ask a relative) | Next (v1.2) | M | 120 | pm-2 (prompt library pm-1) |
| FAM-06 | Readers who don't write, and a family digest | Next (v1.3) | M | 83 | pm-2 (web reader pm-3; email platform pm-4) |
| FAM-05 | Web contribution page, no install | Next (v1.2) | L | 63 | pm-2 (apps/web shell pm-5) |
| FAM-11 | Separated families, including ex-partner abuse | Floor Now; rest Next | S, then M | 63 floor / 18 | pm-2 (runbook and tooling pm-5) |
| FAM-15 | Invites for several children, and changing a role | Next (v1.2) | S | 60 | pm-2 |
| FAM-10 | Multi-generation books | Later | M | 20 | pm-2 (rendering pm-3) |
| FAM-08 | Two accounts on one phone | Later (not in v1.x) | S | 4 | pm-5 (family view here) |
| FAM-12 | When an author dies | Next (v1.3); part 1 by floor rule | M | 2.5 floor | pm-2 (runbook, kept account and book keeper pm-5, T5-12) |
| FAM-13 | Handing the book to the child at 18 | Later; guardrails Now | S, then L | not ranked (floor for guardrails) | pm-2 (artefact pm-3) |
| FAM-16 | Plus for a co-parent outside the subscriber's Apple Family | Next (v1.2) | n/a here | not scored here | pm-4 (DEBATES Q-008) |

---

## 4. Items

### 4.1 Hearing each other

#### FAM-03 Family hear each other's voices (shared voice)
- **Problem and evidence.** In v1.0 a co-parent reads the other parent's letter but cannot hear it except on the recording phone [F fact 6]. TDD 10 (contradiction 9) calls the free family promise "half true" without this. D-032 already designed the fix (a simple server-wrapped key; Free for shared books, Plus for everything) and costed it at about 3 engineer-weeks [F DECISIONS D-032]. Voice is how families talk: about 7 billion WhatsApp voice messages a day [R global 0.3, V G94]; Forevermore's reviews show how much people want to hear a loved one [R us 3.18, V]. Read together "in their voices" (pm-3) and the web page (FAM-05) both depend on this pipeline.
- **Job to be done.** When my partner or Nani writes to our child, I want to hear them say it on my own phone, so the book sounds like our family.
- **Solution.** D-032 as recommended, **Standard (escrow) by default**:
  1. The phone makes a per-file AES-256-GCM key, uploads only ciphertext of the **original** recording, and wraps the file key through an Edge Function with a server-held key that never sits in the database (BL-200, BL-206).
  2. Policy: Free uploads recordings of letters in a book with two or more members, for letters in the book or waiting for parents. Private letters never upload on Free.
  3. Playback: an Edge Function checks `book_access`, returns a short-lived URL and the unwrapped key over TLS; the device caches with eviction; deleting a letter or leaving a book removes cached copies on the next sync (BL-203). Copy says plainly that recordings someone already played may stay on their phone (PRD B F7).
  4. The clearer listening copy is rebuilt on the receiving phone, not uploaded (pm-1 owns it) [Rec]: half the storage, and the original stays the only file we hold.
  5. **One family media pipeline:** generalise `audio_blobs` to media blobs so photos attached to letters (pm-1, CVL-10) reach other members the same way, client-encrypted, instead of through the plain `entry-photos` bucket [Rec; agreed with pm-1].
  6. Vault mode (end-to-end) is pm-5's; family playback in Vault books needs parent-device grants (TDD 04 3.6.2). Shared voice ships Standard only.
  7. Plus backup of every recording reuses the pipeline but needs server proof of Plus (ADR 0013 "Revisit when"; DEBATES Q-008 option c). Free shared voice needs no entitlement check, which is why it can ship first.
- **What competitors do.** Tiny Treasures keeps family voices with no transcript [R us 3.11, V]; Dearest has no server and no sharing [R us 3.12, V]; Remento plays recordings from QR codes [V]; Moments and Dear Ones keep voice notes [R us 3.13, V]; Day One keeps playback free after a lapse [R adjacent 0.10, V].
- **Our differentiator.** Every family voice next to a faithful transcript, free in shared books; no public URLs; no voiceprints; no cloning.
- **RICE.** Reach 650 (A1, every multi-member book) x Impact 3 x Confidence 80% / Effort 4 = **390**.
- **Dependencies.** D-024 `book_access`; BL-201 bucket and path rules; BL-202 upload queue; BL-203 playback and deletion propagation; BL-206 key custody; BL-205 claims and legal copy; the purge worker must cover the media bucket (TDD 10 risk 7); pm-5 storage cost controls (about 19 MB per family per month, D-032); pm-5 Vault mode later.
- **Legal and safety.** LEGAL-REQ-022(a): counsel reads a server-wrapped key as compliant (D-032). Privacy Policy short version and section 4, Terms 12.1 and the recordings claims in `packages/content` must say that recordings of letters in a shared book upload, encrypted, so family can hear them (K-33, BL-205); the privacy label already declares audio [F D-032]. Voice is biometric-adjacent: no speaker identification or voiceprints (Lawyer 2 H3); treat the store as a cloning corpus with short-lived links only (adjacent A2 line 4). LEGAL-REQ-032 honest deletion; unwraps logged; kill switch `escrow_unwrap` (TDD 02 2.7).
- **Metric.** Primary: share of multi-member books where someone played another author's recording within 30 days. Health: upload success above 99%; playback start p95 under 1.5 s on LTE [A target]; storage per family per month.
- **Size.** L (4 weeks). **Horizon.** Now (v1.1).

### 4.2 Widening the circle in the app

#### FAM-01 Family members as authors in the app
- **Problem and evidence.** v1.0 ends the circle at two parents [F fact 1]. Grandparents writing is a core research finding: R14 [R UR 6]; job 4, "Let grandparents and my partner contribute without me curating everything, but with my control" [R UR 5, S]. Grandparents are the audience in every market but almost never the authors, and no product lets one leave a lasting spoken letter in their own language [R global 0.6, I]. Charging for contributors is resented (Qeepsake: Family Contributors are Premium only) [R us 3.1, V; 8.3, I]. The server half is built [F fact 2].
- **Job to be done.** When someone who loves my child wants to leave them words, I want them to write straight into the book from their own phone, so it holds the whole family's voices, while I still choose what goes in.
- **Solution.** Switch on the hidden Family role:
  1. The invite sheet offers Family next to Co-parent, with relationship chips (Nani, Dadi, Nana, Dada, Grandma, Grandpa, Aunty, Uncle, Other) and "Larger letters for them" on by default for grandparent chips (PRD B F5).
  2. The invitee's path after the 18+ gate: sign in, accept, a short welcome, their signature, a first letter to the named child (BL-191). Family members never see the Plus sheet (D-036).
  3. Core approvals: both parents see a family letter as waiting and choose Add to the book or Keep it aside; first action wins (server built). Extras are FAM-02.
  4. "Family can read {child}'s book", per book, off by default (B-REQ-011).
  5. Parents remove a family member (new `remove_child_member`): their added letters stay unless "Also take their letters out" is ticked (set aside, never deleted); anyone can leave and keep or take their letters (PRD B F7).
  6. `book_access` (D-024), the generated visibility matrix and the cross-child leak test gate the release (BL-195).
  7. A family member with no book of their own sees one quiet "Start a book for your own child" row in Settings, never a prompt (principle 3).
- **What competitors do.** Qeepsake gates contributors to Premium and offers readers an email digest [R us 3.1, V]; FamilyAlbum lets all invited family upload [R us 3.3, V]; BackThen lets grandparents upload [V]; Tiny Treasures lets family add messages but family participation is paid [R us 3.11, V]; Dear Ones lets grandparents join by code [V]; Moments shares with a co-parent by "handoff key" [V].
- **Our differentiator.** Relatives write letters to the child in their own language and script, kept word for word with their voice and signed as the child knows them ("From Nani"). Parents curate but never edit. Free.
- **RICE.** Reach 300 (A2 x relatives with an iPhone) x Impact 2 x Confidence 70% / Effort 3 = **140**.
- **Dependencies.** D-024 `book_access`; BL-190 invite-redeem (codes, FAM-04); FAM-17 notifications; the FAM-11 safety floor ships with it; D-039 (family see name, nickname, birthday month and day; never the due date or birth year); D-050 Washington second consent at first family share (counsel); Family role strings in `packages/content` (today only co-parent strings exist [F `family.en.ts`]); analytics already has `invite_created{role}` with `contributor` [F `packages/analytics/src/catalog.ts` INVITE_ROLE].
- **Legal and safety.** LEGAL-REQ-024 tested access control (leak test is a release gate); D-050; D-039 (the due date is health data, K-25); a relative's letter can carry health data about the child or another adult, an MHMDA question (Lawyer 2, "Needs a human lawyer" 1); LEGAL-REQ-056 Report a concern binds in the launch quarter of this feature [F ENGINEERING_REQUIREMENTS]; every family member passes the 18+ gate (PRD-REQ-019); links are single use and parents see who joined (forwarded links).
- **Metric.** Primary: share of active books with a family member who saved a first letter within 14 days of the invite (server: `insights.family_invites` and `voices`). Secondary: a second letter from the same person within 60 days. Guardrails: leak-test failures 0; Report a concern tickets per 100 family members.
- **Size.** M (3 weeks; the server half exists). **Horizon.** Now (v1.1).

#### FAM-02 Approval flows beyond the core
- **Problem and evidence.** Core approval ships with FAM-01. Still missing: per-person "add automatically" (B-REQ-023, P1; RPC built [F `set_member_auto_add`]), taking a family letter back out, an author withdrawing a letter (RPC built [F `withdraw_family_letter`]), and a thank-you. An aunt editing a family-tree page caused real distress [R UR 1.4, S28]; parents want control without curating everything [R UR 5]. If every letter from Nani waits, a busy parent becomes the bottleneck and Nani stops [A].
- **Job to be done.** When family letters arrive, I want to say yes quickly and stop being asked about people I trust, so the book fills without me being a gatekeeper.
- **Solution.**
  1. Waiting letters show as one quiet row on the Book tab ("Letters from family"); no badge count, no nag; one notification per letter (FAM-17).
  2. After a parent adds three letters from the same person, one card offers "Add {signsAs}'s letters automatically from now on?" Either parent can switch it off at any time, per person, per book.
  3. Either parent can take a family letter out of the book later; it goes back to "kept aside". Nobody edits or deletes it.
  4. The author can withdraw a waiting letter, and can take their own added letter out; it stays theirs.
  5. Thank-you is the content-free notification "Your letter is in {child}'s book" (BL-196 scope), plus an optional fixed, human-written "Thank you, from Mama". No message threads (section 8).
  6. Kept-aside letters are never announced to the author ("{signsAs} will not be told", PRD B F7).
- **What competitors do.** FamilyAlbum admin controls [R us 3.3, V]; Tiny Treasures parents review phone-line messages before sharing [R us 3.11, V]; TinyNest per-member permissions [R us 3.5, V].
- **Our differentiator.** Curation without editing; trust earned per person; no chat surface to moderate.
- **RICE.** Reach 300 x Impact 1 x Confidence 60% / Effort 1.5 = **120**.
- **Dependencies.** FAM-01; FAM-17; analytics `family_letter_reviewed{decision}` exists [F catalog line 620].
- **Legal and safety.** DATA-REQ-015 (no one deletes another's words). Turning on auto-add widens who reads a relative's letter, so the card shows who can read the book before it is switched on.
- **Metric.** Median time from a family letter sent to a decision (target under 48 hours); share kept aside (investigate above 20%); share of family members on auto-add after 60 days.
- **Size.** S to M (1.5 weeks). **Horizon.** Next (v1.2). Core approval is Now, inside FAM-01.

#### FAM-15 Invites for several children, and changing a role
- **Problem and evidence.** One invite names exactly one child (PRD-REQ-014) [F], so a family with twins (free in first run, D-007) or siblings sends one invite per child; the multi-book picker is P1 (B F5.3) [F]. Roles cannot change through invites [F `accept_child_invite`], so a grandparent who becomes a guardian, or a step-parent who becomes a daily co-parent, has no path [A].
- **Job to be done.** When I invite Nani, I want her in both my children's books in one go; when someone's place in my child's life changes, I want their role to follow.
- **Solution.** A "Which books?" picker that defaults to the current child, never all, creating one invite per book with a shared `group_id` (TDD 02 2.4); the invitee accepts per book by name. Role change [Rec]: Family to Co-parent only by a parent and, when two parents exist, with the other parent's agreement (two keys); Co-parent to Family only by the person themselves, or by support under the safety runbook (FAM-11).
- **What competitors do.** TinyNest unlimited invites with per-member permissions [R us 3.5, V]; most products are one album per family, not one book per child [R us 6.4, I].
- **Our differentiator.** Per-child privacy kept (an invite to one book never opens another), with one-tap convenience.
- **RICE.** Reach 150 x Impact 0.5 x Confidence 80% / Effort 1 = **60**.
- **Dependencies.** FAM-01; FAM-11 (parent cap and two keys).
- **Legal and safety.** The leak test must cover grouped invites. A third parent is the separation risk described in FAM-11.
- **Metric.** Share of families with two or more children where an invited relative is in every child's book.
- **Size.** S. **Horizon.** Next (v1.2).

#### FAM-17 Family-letter notifications
- **Problem and evidence.** v1.0 has no server push [F fact 11], so a co-parent's letter arrives silently. VOICE uses "Nani wrote a letter to {child}." as the model notification [F `packages/content/VOICE.md`]. UR lists a grandparent's first letter as a good celebration [R UR 3, A]. Family pushes are pm-2's (Q-006).
- **Job to be done.** When someone writes to my child, I want to know gently, so I read it while it is fresh.
- **Solution.** BL-196 as specified: an Edge Function sends APNs directly (no third-party push service); payloads carry opaque ids, never the child's name or letter text (D-025); names render on the phone only when "Show names on the lock screen" is on; a separate channel that "Pause all reminders" does not mute (C-REQ-007). Events: the other parent added a letter to the book; a family letter is waiting (parents); your letter is in the book (family author). Each author has "Tell {co-parent} when I add a letter" (default on). At most one family notification per evening per book, batched [Rec].
- **What competitors do.** Upload notifications are standard; spam is complaint theme 10 at Tinybeans and Qeepsake [R us 9, V].
- **Our differentiator.** Name-free and content-free on the server; never promotional (LEGAL-REQ-054).
- **RICE.** Reach 650 (A1) x Impact 1 x Confidence 70% / Effort 2 = **228**.
- **Dependencies.** APNs key (founder); device-token table (L3, data map); a notification service extension or in-app rendering for names (D-025); pm-4 owns reminder cadence and must keep family notifications out of its back-off; pm-5 realtime sync for open apps (T5-22); background delivery is this item.
- **Legal and safety.** LEGAL-REQ-054 (no content, no promotions); D-025. In a separated family a notification reveals activity, so the "Tell {co-parent}" switch is offered in the FAM-11 "private from now on" flow.
- **Metric.** Share of two-author books where the other parent opens a new letter within 48 hours; opt-out rate (investigate above 15%).
- **Size.** M (2 weeks). **Horizon.** Now (v1.1).

### 4.3 Reaching relatives where they are

#### FAM-04 Invites through WhatsApp, iMessage and WeChat
- **Problem and evidence.** Families talk on chat apps: WhatsApp has 700M+ monthly users in India [R global 2.1, S G61] and is on 98% of Brazilian smartphones, where 80% of users exchange audio [R global 2.3, V G83]; WeChat has 1.418B monthly users [R global 2.4, V G38]. v1.0 already invites through the iOS share sheet with a warm message [F `family.en.ts` `create.shareMessage`], but:
  1. The token sits in the URL path, so any service that fetches the link to build a preview, and our web host's logs, can see it [F AUTH_SETUP 5.3]. Whether WhatsApp and iMessage fetch previews on the sender's phone or on their servers, and what WeChat does, is unverified [U].
  2. The message is English only, while Nani may read Hindi, Spanish or Portuguese [F BRIEF decision 6: app UI is English].
  3. There is no code to read aloud on a phone call (A-REQ-029 is P0 in PRD A; no server column) [F fact 8].
  4. WeChat's in-app browser is widely reported not to open universal links [U].
  5. A relative abroad or on Android lands on a US App Store page they cannot use [F LEGAL-REQ-058; ROADMAP 2.0 section 5].
- **Job to be done.** When I invite Nani, I want to send it where she already talks to us, in her language, and have it just work when she taps it.
- **Solution.**
  1. Move the token into the fragment (`/i#t=<token>`), so no preview fetcher or web log ever receives it (B-NFR-002; TDD 04 3.4.1). Keep accepting path links until the last one expires (7 or 14 days). Small change in the app's parser and the AASA pattern [F AUTH_SETUP 5.3].
  2. Generic preview tags on `/i`: no child name, no photo (B-REQ-008 acceptance; B-NFR-002).
  3. The invite message in the relative's language: the inviter picks one of the seven spoken languages; human-written templates in `packages/content`, checked through pm-1's native-speaker review (B-REQ-022, BL-301). The app UI stays English.
  4. The 8-character code, read aloud or typed, through `invite-redeem` with rate limits and a peppered hash (BL-190; TDD 04 3.4.1).
  5. A QR code for when the relative is in the room.
  6. An honest landing in the invite's language: "Early Letters is on iPhone. If you don't have one, {inviter} can record your letter on their phone" (links FAM-07); later "or add your letter here" (FAM-05). Its App Store link carries pm-4's `invite` campaign token and opens the "Co-parents" (later "Grandparents") custom product page (G-14).
  7. Share sheet only. We never send messages for the user and never read contacts (A-REQ-035; PRD UR R5).
- **What competitors do.** Remento and Storyworth reach storytellers by email or SMS [R us 3.15, 3.16, V]; withyou sends questions by text [R us 3.19, V]; Tiny Treasures gives grandparents a phone line [V]; in China, family products live inside WeChat mini programs [R global 2.4, S].
- **Our differentiator.** The invite arrives in Nani's language and leads to letters kept in her script and voice; no number or contact ever leaves the phone.
- **RICE.** Reach 500 (families sending any invite in a quarter) x Impact 1 x Confidence 60% / Effort 1.5 = **200**.
- **Dependencies.** The website thread (the `/i` page, the AASA change, no logging under `/i`; coordinate on the board, COORDINATION 6); BL-190; pm-1 native-speaker review; FAM-07 and FAM-05 for the landing's fallbacks; pm-4 owns invites as an acquisition channel (store landing, campaign links) [F Q-006, pm-4 reply].
- **Legal and safety.** Tokens never in paths, logs or analytics (LEGAL-REQ-014); code brute-force limits are mandatory at about 40 bits (TDD 02 2.4); invite messages are sent by the user, so we believe no CAN-SPAM or TCPA duty falls on us [A, counsel to confirm]. The message names the child only because the parent's own share text does.
- **Metric.** Invite acceptance within expiry, by role; share accepted by code; time from invite to acceptance. Acceptance by message language only if DEBATES Q-004 allows a language code in analytics; otherwise not measured.
- **Size.** M (1.5 weeks). **Horizon.** Now (v1.1).

#### FAM-07 A relative records on the parent's phone (guest author)
- **Problem and evidence.** Only 40% of older people in India own a smartphone and 66% find digital tools too confusing [R global 2.1, S G64]. Global research asks for the grandparent flow to be designed "for a grandparent who records on the parent's phone" [R global 6.4]. Visits are the natural moment: the first weeks after birth, holidays [A]. In v1.0 a parent can hand over the phone, but the letter is signed as the parent [F one signature per member per book, PRD B F1.3], so Nani's voice is mislabelled. pm-4's baby shower kit (G-10) and pm-1's imported voice notes (CVL-12) reuse this model.
- **Job to be done.** When Nani is visiting and has no app, I want to hand her my phone so she can talk to Asha for a minute, and have the letter kept as hers.
- **Solution.**
  1. "Someone else is speaking" on the record screen: pick who (relationship chips plus a name), optionally their language for this letter (pm-1's per-letter language), Large Print, one big record button.
  2. One confirmation before saving: "Nani is happy for this to be kept in Asha's book" (Terms 5.4).
  3. The book shows the signature "From Nani" and a quiet provenance line, "Recorded on Papa's phone". Imported voice notes use the same field with "Shared by Papa" (agreed with pm-1).
  4. Data: the account holder stays the author of record (they hold the account, consent and rights) and may fix machine slips through Review and `verifyEdits`, never reword. A new `spoken_by` label (L3, like a signature) plus a provenance value (`guest` or `import`).
  5. If Nani later joins as Family (FAM-01), a parent can offer "Give these letters to Nani" through the copy-and-tombstone move (PRD B data model item 8), with `raw_transcript` and `captured_at` unchanged.
  6. Works offline, at today's architecture: nothing new leaves the phone. The co-parent hears it once FAM-03 ships.
  7. Guests are adults: no sibling or child chip. Child voices stay behind `child-input` (PRD-REQ-005, K-19).
  8. "Who's speaking" also covers a shared household iPad (Nana and Nani) without a second account (FAM-08).
- **What competitors do.** None of the profiled apps offers this explicitly [I, from us.md and global.md profiles]. Tiny Treasures solves no-app with a phone line [R us 3.11, V]; StoryCorps records interviews on one phone [R us 3.17, V].
- **Our differentiator.** The cheapest and most private no-install path, in the relative's own language and script, with honest attribution.
- **RICE.** Reach 300 x Impact 2 x Confidence 70% / Effort 1.5 = **280**.
- **Dependencies.** A new migration for `entries.spoken_by` and provenance in an assigned range; sync, export and analytics fields (`author_relation` gains `guest` [F catalog AUTHOR_RELATION]); pm-3 renders the provenance line in the Book, PDF and print; pm-1 per-letter language and import; the dictionary adds the guest's name as a family term (B-REQ-006).
- **Legal and safety.** Terms 5.4 says the person who saves a letter is its author and other adults' voices need their agreement [F Lawyer 1 M7]; the confirmation line implements it (counsel to confirm it is enough). The label is typed by a person, never detected: no speaker identification (Lawyer 2 H3). Under-18 guests excluded by design. MHMDA third-party health data question unchanged (Lawyer 2).
- **Metric.** Share of active books with a guest letter in the quarter (server count of provenance `guest`, k-anonymised; also pm-4's shower-kit metric, G-10); share of guest speakers who later join as Family.
- **Size.** S to M (1.5 weeks). **Horizon.** Now (v1.1).

#### FAM-05 Web contribution page (no install)
- **Problem and evidence.** R14: "The grandparent contribution flow needs no app install for the first letter" [R UR 6]. "Family adds without installing" is Early Letters' weakest column against the field; Tiny Treasures, Remento, Storyworth, BackThen and Moment Garden already serve relatives without an app [R us 4, I]. v1.0 family members need an iPhone and the US App Store [F]. The founder put the page in v1.1 (BRIEF decision 9). TDD 10 calls it a second product and the riskiest security surface (risk 10).
- **Job to be done.** When my daughter sends me a link, I want to tap it, talk to my grandchild for a minute and be done, with no app, password or account.
- **Solution.** PRD B F6 as amended by TDD 04 3.4.3:
  1. The link opens the app if installed, otherwise the page: child's first name only, Large Print if chosen, in the invite's language.
  2. "Tap the red circle and talk": record, play back, Send, or Type instead.
  3. Identity: the `contrib-gateway` Edge Function creates the family member's identity server-side at the first Send, never on page load (LEGAL-REQ-010), together with the 18+ confirmation and the notice at collection; a return link (in the fragment) for later visits; no Supabase session held in the browser (TDD 04 deviation D-2).
  4. Audio: encrypted in the browser with a per-file key wrapped through the gateway, the same Standard scheme as FAM-03. Vault books need the inbox key design (TDD 04 3.6, pm-5).
  5. Words: transcribed on a parent's phone when the letter arrives (PRD B F6.7), written once under the family member's author id through a narrow RPC; they see their words from the return link and can delete their letter.
  6. Approval as FAM-01. "Get the app" after the second letter links the identity by email (TDD 04 X-7).
  7. The same personal link later opens the reading door (FAM-06): one family link per relative per book, two doors.
  Phasing: v1.2 record, type, send, return link, status, delete; v1.3 the Hindi and Spanish page, then the other spoken languages.
- **Recommendation [Rec, needs founder OK]: v1.2, not v1.1.** It needs FAM-03's pipeline and FAM-01's model first. In v1.1, FAM-07 and FAM-04's honest landing cover visiting relatives and relatives with an iPhone.
- **What competitors do.** Remento: "no apps, downloads, or logins" [R adjacent A2, V]; Storyworth by email and phone [V]; Tiny Treasures phone line [V]; Legacy Odyssey a family website [R us 3.13, V]; withyou relatives answer by voice with no app [R us 3.19, V].
- **Our differentiator.** Their words transcribed faithfully in their own script, their voice kept, parents curate; no ads or analytics on the page (TDD 04 3.4.3).
- **RICE.** Reach 250 (A2 x A3) x Impact 3 x Confidence 50% / Effort 6 = **63**. The score is low because the effort is high; it is ranked by judgement (section 7) because it is the only author path for Android and overseas relatives before Android and other storefronts, and the most visible gap against competitors [R global 5.1].
- **Dependencies.** FAM-01; FAM-03; pm-5 `apps/web` shell, CSP, hosting, contributor-gateway auth and BL-114 anonymous guards (T5-17, Now) [F Q-006]; pm-1's transcription queue accepts web-origin audio; FAM-04 (fragment links, language); a CAPTCHA provider (a new subprocessor; which one is unverified); counsel on LEGAL-REQ-010 and -035; Supabase anonymous-identity behaviour (TDD 04 marks server-minted sessions Unverified).
- **Legal and safety.** LEGAL-REQ-010 (notice at collection), -035 (rights without an account), -058 (reachable worldwide, collects only what 010 allows); PRD 9 Q6 (worldwide reach) is a founder call with counsel, since relatives abroad bring GDPR and UK GDPR [R global 4 implication 4]; the Consumer Health Data policy link must be on the page (Lawyer 2 H2); the return link is a bearer credential (PRD B OQ8): revocable and rotated on removal; storage abuse caps; no public URLs (adjacent A2 line 4).
- **Metric.** Web invites that lead to a sent letter within 14 days; taps from opening to sent (4 or fewer after microphone permission, B-REQ-008); upload failure under 1%; second-letter rate.
- **Size.** L (5 to 6 weeks; D-002 put it at "about 5 more weeks"). **Horizon.** Next (v1.2) [Rec].

#### FAM-06 Readers who don't write, and a family digest
- **Problem and evidence.** Email digests are the proven no-app channel: "The email digest is just what extended family wants" (Moment Garden), "No need to do tech support for older family members" (23snaps) [R us 3.8, V]; Qeepsake readers get a digest [R us 3.1, V]. Readers pushed to become authors complain (principle 3). But our emails may carry no content and a child's name is L4 [F fact 16]; Tinybeans' digests with server-hosted images drew "it ain't secure" [R us 9, V].
- **Job to be done.** When my grandchild's book grows, I want to be told now and then and read it easily, without writing or installing anything.
- **Solution.**
  1. A Reader role per book: reads in-book letters where "Family can read" is on, never writes, never receives author prompts. A real role in `book_access`, not a family member who never writes [Rec].
  2. The personal family link (FAM-05) opens pm-3's web reader (BK-12). The Add-a-letter door can ship in v1.2 with FAM-05; the Read door follows BK-12.
  3. A content-free email when a month's chapter closes: "There are new letters in the book you're part of," with the link. No child name, author names or text unless a parent turns on "Show {child}'s first name in family emails" (default off, the D-025 pattern). At most one a month; one-tap unsubscribe; no tracking pixels (ROADMAP 2.0 section 3: tracking off).
  4. Family members with the app get the same as an in-app card, not an email.
- **What competitors do.** Tinybeans email updates (read-only) [R us 4, P]; Qeepsake, Moment Garden and 23snaps digests [V].
- **Our differentiator.** Nothing of the book in anyone's inbox; reading happens behind a personal, revocable link.
- **RICE.** Reach 250 x Impact 2 x Confidence 50% / Effort 3 = **83**.
- **Dependencies.** FAM-05's link identity and gateway; pm-3 web reader (BK-12, v1.3 and gated on FAM-03, this Reader role and pm-5's shell; if BK-12 slips to v1.4, this item slips with it); pm-5 `apps/web`; pm-4 email platform and lifecycle rules (agreed: the digest is transactional; content pm-2, sending pm-4).
- **Legal and safety.** DATA_CLASSIFICATION email rule; consent per book through "Family can read"; links revoked on removal; CAN-SPAM postal address only if an email is commercial (this one is transactional [A, counsel]).
- **Metric.** Reader-link visits within 7 days of a digest (server-side, no pixels); readers per book; unsubscribe rate.
- **Size.** M (3 weeks, excluding pm-3's reader). **Horizon.** Next (v1.3).

### 4.4 Writing together over time

#### FAM-09 Shared family prompts (ask a relative)
- **Problem and evidence.** Prompts drive writing: Qeepsake's question "made me stop and document a beautiful moment" [R us 3.1, V]; Storyworth and Remento send a question to the storyteller every week [R us 3.15, 3.16, V]. Grandparents carry heritage language and family history [R UR 1.4, S14]; "Dadi ke nuskhe" (grandmother's remedies) is a content genre in India [R global 2.1, V]. A blank page stops relatives as much as parents [A]. AI-generated prompts drew complaints at Qeepsake [R us 3.1, U].
- **Job to be done.** When I want Nani to tell Asha what I was like as a baby, I want to send her a question she can answer in her own time, in her own voice.
- **Solution.**
  1. "Ask {signsAs}" on any prompt card, or a question the parent types (their own words, kept as typed).
  2. It reaches the relative as a family notification (app) or in their family link (web, FAM-05); answering opens the recorder with the question above it.
  3. "A letter from everyone": a parent opens a family round for a moment (a first birthday, "the day you came home"); the answers gather as one section of that chapter (pm-3 renders; birthday rounds agreed with pm-3).
  4. Gentle rules: one open question per relative; at most one reminder; "Not now" tells nobody (PRD B F5 silence rule); no counts of unanswered questions.
  5. Prompt text from `packages/content`, human-written; pm-1 owns the library and selection. The `family` prompt kind exists [F analytics PROMPT_KIND].
- **What competitors do.** Storyworth weekly questions and "Celebrations" that collect from many people [R us 3.16, V]; Remento collaborators choose prompts [R us 3.15, V]; Capsle prompted answers from elders [R us 3.19, V].
- **Our differentiator.** Questions in the relative's language, answered by voice, kept word for word; a family round becomes a chapter of the child's book rather than a gift memoir.
- **RICE.** Reach 300 x Impact 2 x Confidence 50% / Effort 2.5 = **120**.
- **Dependencies.** FAM-01; FAM-17; FAM-05 for web relatives; pm-1 prompt library; pm-3 chapter rendering; pm-4 owns any seasonal in-app events.
- **Legal and safety.** A typed question is the parent's content (L4), shown only to the person asked. No machine-made prompts (constitution; us.md 10 point 3).
- **Metric.** Questions answered within 14 days; letters per family member per quarter, asked versus never asked.
- **Size.** M (2.5 weeks). **Horizon.** Next (v1.2).

#### FAM-10 Multi-generation books
- **Problem and evidence.** The phrase hides three ideas [A]:
  - (a) grandparents' own stories for the grandchild ("when your Papa was little"): content, served by FAM-09 heritage prompts;
  - (b) one relative writing to grandchildren in different families: Nani is Family in two books kept by different parents; "write to several children" exists only within one family (B-REQ-020, P1) [F];
  - (c) linking books across generations: the grown child, given their book (FAM-13), starts a book for their own child and links "Your Papa's book": decades away.
  54% of people in India live in extended families [R global 4, V G63]. No memory app links books across generations [I].
- **Job to be done.** (b) When I write to my grandchildren, I want to send the same love to each of them without either family seeing the other's book. (c) When my child has a child, I want the family's letters to carry on.
- **Solution.** (b) "Write to my grandchildren" for a member of several books: one recording, one entry per child sharing a `letter_group_id` (PRD B data model item 6), each through its own book's approval; nothing of one family's book visible in another, with the leak test extended across families. (c) Design guardrails only: transferable ownership (FAM-13), books never tied to one account's lifecycle (FAM-12), and a "linked book" pointer that reveals nothing without both owners' consent. A family tree or cross-family graph is out (section 8).
- **What competitors do.** Nothing comparable in memory apps [I].
- **Our differentiator.** The same faithful voice letters across generations, with every book still private.
- **RICE.** (b) Reach 80 x Impact 1 x Confidence 50% / Effort 2 = **20**. (c) not scored (no reach before the 2040s).
- **Dependencies.** FAM-01; FAM-15; pm-3 rendering; FAM-13 for (c).
- **Legal and safety.** A group letter must never reveal one family's membership to another; each copy is approved separately.
- **Metric.** Letters per multi-book family member.
- **Size.** M. **Horizon.** Later; (b) moves up if insights show many members in several families.

#### FAM-13 Handing the book to the child at 18
- **Problem and evidence.** The promise is that {child} will read and hear these letters "for years, with you or on their own" [F VOICE legacy rule]. Others use time locks: Moments' "gift key" unlocks at 18 [R us 3.13, V]; Dearest seals letters [V]; FutureMe delivers on a date [R adjacent A3, V]; parents improvise with a Gmail account for the newborn, which Google may delete after 2 years unused [R adjacent A3, V]. Sealed letters are pm-3's (B-REQ-018). No product found hands a co-written book to the grown child as its owner [I]. Today: adults only, no child accounts (PRD-REQ-019) [F]; no inactivity deletion [F fact 13].
- **Job to be done.** When my child turns 18, I want to give them the book, with every voice in it, as theirs to keep, while each person who wrote decides what is handed over.
- **Solution (design now, build Later).**
  1. A handover date, default the 18th birthday, set and changeable by parents.
  2. Before it, each author reviews what goes: in-book letters by default; private letters only if the author chooses; raw transcripts and working material never, unless the author chooses (PRD-REQ-004).
  3. The grown child receives an invite to an address a parent enters, passes the 18+ gate, creates an account and becomes the book's Owner: reads what was handed over, exports, may invite their own circle later. Authors keep their rights and can keep writing.
  4. The handover opens letters sealed "until 18"; pm-3 owns what opening looks like (agreed).
  5. The handover export package and any print edition are pm-3's.
  **Guardrails to adopt now [Rec, S, floor]:** books survive author accounts (FAM-12 part 1); the role list can grow an Owner; a per-letter `handover` attribute is planned next to `sealed_until`; no design ties a book to the creating parent's account.
- **What competitors do.** Moments gift key at 18; Dearest legacy contact on Plus [R us 3.12, 3.13, V].
- **Our differentiator.** The child receives a book co-written by their family, each in their own voice and words, never rewritten, with each author's consent.
- **RICE.** Build: Reach close to 0 per 1,000 per quarter before about 2040 for babies 0 to 12 months [A] (older children added in first run reach 18 sooner), so not ranked. Guardrails: floor, not scored.
- **Dependencies.** FAM-12 part 1; pm-3 sealed letters (BK-03, which lets contributors seal too) and the Book at 18 edition (BK-18, built on DATA-REQ-055's durable export); pm-5 portability and the shutdown pledge (the company may not exist in 18 years; export is the guarantee).
- **Legal and safety.** The grown child becomes a data subject of letters others wrote about them [Q counsel, later]; consent per letter by each author; COPPA does not apply at 18; never send the handover to a guessed address.
- **Metric (later).** Handovers completed; authors who reviewed before the date.
- **Size.** Guardrails S; build L. **Horizon.** Later (guardrails Now).

### 4.5 Hard seasons

#### FAM-11 Separated and co-parenting families, including ex-partner abuse
- **Problem and evidence.** Half of divorced parents wish they had saved more, against 30% of married parents [R UR 1.1, F S8]. TDD 04 names the ex-partner co-parent as adversary A1: a legitimate session, may know the other's Apple ID password, may hold an old device [F]. PRD B F8: parents are equals; neither can remove the other or delete the other's words [F]. Today: no server cap on parents [F fact 4]; "Sign out of other devices" already ships in v1.0 [F `apps/mobile/src/app/settings/account.tsx`]; the safety-removal runbook that Terms 9.4 and LEGAL-REQ-056 rely on is not among `docs/ops/runbooks` [F: five runbooks, none for safety]; a parent who leaves the subscriber's Apple Family loses Family-Shared Plus [A, Apple behaviour to verify; DEBATES Q-008]. A French judge can bar one parent from posting a child's images [R global 4, S G79] (a future-market note).
- **Jobs to be done.**
  - When we separate, I want to keep writing to my child without my ex reading my new letters, and without losing what we wrote together.
  - When the other parent is not safe for me, I want them out of my child's book quickly, without a fight inside the app.
  - When my child lives in two homes, I want both homes in the one book they will read.
- **Solution.**
  - **Safety floor (Now, ships with FAM-01; floor rule):**
    1. At most two parents per book on the server; a further parent only through support. Also proposed as v1.0 hardening (section 5).
    2. "Private from now on": one switch per book makes my new letters private by default; "Make all my letters private" (B-REQ-023) for the past. Private letters are already author-only [F PRD K-09].
    3. "Tell {co-parent} when I add a letter" per author (FAM-17).
    4. Surface the v1.0 "Sign out of other devices" row [F `settings/account.tsx`] inside the Family and Privacy flows of a separation; pm-5's "Where you're signed in" list and new-sign-in alert email (T5-10) and optional Face ID lock (T5-14, Next) cover an ex-partner who knows a password or holds a device (TDD 04 A1, A4).
    5. "Ask us to step in": a calm Help entry that opens Report a concern with a safety category (LEGAL-REQ-056); support verifies and removes or restricts a member under Terms 9.4 (pm-5 T5-13, Now with contributors; the reporter is never revealed to the reported member).
    6. The leave flow starts with "Save a copy first" (export, free) and says plainly what stays (PRD B F7).
  - **Two homes (Next):**
    7. "Hide this letter for me": hides a letter on my screens only; never deletes it or hides it from anyone else. The child's book stays whole.
    8. Removing a family member is visible to both parents ("Mama removed Dadi from Asha's book"), and either parent can invite them again; family members belong to the child [F PRD B F8.4]. No veto mechanics [Rec; founder Q].
    9. Plus in two homes: DEBATES Q-008 (pm-4), with pm-2's conditions (only parents see coverage; copy never names who pays; coverage per book).
- **What competitors do.** None of the profiled products describes separation handling [I, from us.md and global.md]; FamilyAlbum admin controls and TinyNest per-member permissions are generic [V].
- **Our differentiator.** A child's book that survives a separation whole: neither parent can erase the other, each can write privately, and safety cases reach a person who acts on verified requests.
- **RICE.** Whole set: Reach 30 (A5) x Impact 3 x Confidence 60% / Effort 3 = **18**. Safety floor alone: Reach 30 x Impact 3 x Confidence 70% / Effort 1 = **63**, and it ships with FAM-01 by the floor rule.
- **Dependencies.** FAM-01; FAM-17; pm-5 T5-13 (Report a concern and runbooks), T5-10 (device list and sign-in alerts) and T5-14 (Face ID lock); counsel on the court-order verification standard and a legal-process page (Terms 9.4 counsel note); neutral, blame-free strings in `packages/content`.
- **Legal and safety.** Terms 9.4 and 18.2; LEGAL-REQ-056 (P1) and -057 (legal process and preservation: letters may be subpoenaed in custody disputes) [F ENGINEERING_REQUIREMENTS]; never disclose one member's email, location or activity to another (TDD 04 A1); we never decide custody inside the product; DATA-REQ-015 holds in separation too, including for a child's "sounds" recorded by the other parent (pm-1 CVL-19) [Rec, counsel Q].
- **Metric.** Books where a parent left that still have an active author 90 days later; verified safety requests resolved within 48 hours; zero exposures of member contact details; Report a concern volume per 1,000 families.
- **Size.** Floor S (1 week plus pm-5's runbook); two homes M. **Horizon.** Floor Now (with FAM-01); two homes Next (v1.2).

#### FAM-12 When an author dies
- **Problem and evidence.** A child's book will outlive some of its authors, most often grandparents [A]. CR-018 flags California's fiduciary-access law for digital assets and proposes a support process and an optional legacy contact [F compliance-register]. Today an account deletion removes the author's letters from every book (K-22), so an executor closing accounts could erase a grandparent's letters from the grandchild's book [F fact 14]. If the only parent of a book is gone, the last-parent guard keeps the book but nobody left can manage it [F `child_members_guard`; A on the scenario]. The recommended ethical lines: no synthetic voice, no avatar, letters stay exactly as they are, no resurfacing framed around the death, no machine-made memorial [R adjacent A2, I]. Copy bans death words and endings [F fact 15].
- **Job to be done.** When someone who wrote to my child is gone, I want their letters and voice kept exactly as they are, safe from any account closing, and I want the app to stay gentle with us.
- **Solution.**
  1. **Letters outlast accounts (floor):** "Leave my letters for {child}" as a choice in account deletion, defaulting to keep for letters in the book [Rec, counsel]; an executor's or family's request through support follows the same rule (pm-5 runbook). The author can still choose to remove them.
  2. **A gentle way in:** a Help entry "Looking after someone's letters" that passes the rules test (no banned words): their letters stay as they are; how to save their voice (export); how to reach a person. Replies come from a person, who may use the family's own words.
  3. **A kept account state** (pm-5 T5-12, Next, v1.3; one server status plus RPC checks): after verification, the author's account stops signing in and sending anything and keeps every letter; their waiting family letters stay with the parents to decide.
  4. **A book is never left without a parent:** pm-5's in-app book keeper (T5-12, Later) lets a parent name who looks after the book; until then, and without one, support can make a verified guardian a parent under the fiduciary runbook (T5-12, Now; counsel sets the proof standard) using FAM-15's role change.
  5. **Quiet controls:** each reader can pause "On this day" and celebrations for themselves per book (C-REQ-012 exists per person per child), hide one letter from resurfacing (pm-3 BK-06 "Not this one"), and pause one author's letters in resurfacing for themselves [Rec; pm-3 hosts it in BK-06].
  6. **Nothing new is made:** no tribute, no "continue their story", no synthetic voice (section 8).
- **What competitors do.** HereAfter promises recordings stay downloadable if the company closes [R adjacent A2, V]; Forevermore clones voices [R us 3.18, V]; Dearest offers a legacy contact on Plus [R us 3.12, V].
- **Our differentiator.** The real voice and the real words, untouched and protected from account closure, with no machine-made memorial.
- **RICE.** Reach 5 x Impact 3 x Confidence 50% / Effort 3 = **2.5**. Floor: part 1 ships before about 1,000 books have family members [Rec], because the loss cannot be undone.
- **Dependencies.** Counsel (licence that survives deletion; fiduciary access); pm-5 T5-12 (fiduciary runbook Now, book keeper Later) and the help centre; the kept-account state (T5-12, v1.3); FAM-15 role change; the content owner for Help wording.
- **Legal and safety.** CR-018; Terms 8 counsel note; an author's own choice to remove their letters must stay possible (privacy rights), so "keep" is a changeable default [Q counsel: default keep or default remove]; the data-policy rule of no inactivity deletion stays.
- **Metric.** Support requests of this kind resolved within 5 working days; zero letters lost to an account closure where keep was chosen.
- **Size.** M. **Horizon.** Next (v1.3); part 1 by the floor rule.

### 4.6 Devices and platforms

#### FAM-14 Android co-parents and relatives (family slice)
- **Problem and evidence.** v1.0 is iOS only, so an Android co-parent cannot join at all [F ROADMAP 2.0 section 5]; Android is listed for v1.1 (BRIEF decision 9). Mixed-platform families are routine [R us 6.12, 10.7, I]; India, Brazil and Mexico are Android-gated [R global 0.7, V G96]. The web page (FAM-05) cannot stand in for an Android co-parent: web identities may only be Family, never parents (TDD 02 2.4) [F]. Apple Family Sharing cannot reach an Android co-parent [F BRIEF decision 3; DEBATES Q-008].
- **Job to be done.** When my partner has an Android phone, I want us to write the same book as equals.
- **Solution (the family requirements on pm-5's Android release).**
  1. Invite links open the Android app (App Links with `assetlinks.json` on the website) or the Play Store page; codes work the same.
  2. Every family flow at parity: co-parent, Family, approvals, family notifications (content-free payloads, names rendered on the phone), shared voice playback (M4A on Android [A]).
  3. Sign in with Apple on Android (A-REQ-020, P1) for a parent who started on iPhone with Apple.
  4. One honest line about Plus until DEBATES Q-008 is answered; family features never differ by platform.
  5. A cross-platform pair (one iPhone, one Android) in the release checklist.
  6. Before Android ships: a content-free "My co-parent uses Android" choice in the invite sheet, counted only as a k-anonymised server aggregate, as the demand signal pm-4 uses for timing (G-21).
- **What competitors do.** The leaders run on iOS, Android and web [R us 6.12, I].
- **Our differentiator.** None; this is parity. The risk is in being late.
- **RICE (family slice only).** Reach 250 (A4 plus Android relatives) x Impact 2 x Confidence 70% / Effort 2 = **175**. The Android app itself is pm-5's (XL; BL-288, BL-311).
- **Dependencies.** pm-5 Android build and parity (T5-16); pm-4 Android pricing and Q-008; the website thread for `assetlinks.json`; D-042 full web deletion flow before Android (BL-310, in pm-5's T5-17); D-004 point 3 (form an entity before Android).
- **Legal and safety.** Google Play Data safety form (pm-5); LEGAL-REQ-030 web deletion before Android [F D-042]; push payload rules unchanged.
- **Metric.** Share of two-parent books with mixed platforms; invite acceptance on Android against iOS.
- **Size.** M (family slice). **Horizon.** Rides pm-5's Android release (T5-16): founder decision 9 says v1.1; pm-5 recommends v1.2 for a free Android app with co-parents and v1.3 for Plus purchase on Android. The slice ships with whichever the founder picks.

#### FAM-08 Two accounts on one phone
- **Problem and evidence.** A phone's local book belongs to one account; a second account gets `AccountMismatchError` and nothing changes [F fact 9]. That is safe, but it blocks shared devices. Cases [A]: grandparents sharing one iPad; a relative with no phone (FAM-07); a parent handing an old phone to a grandparent; co-parents sharing one phone (rare in this segment). D-047 already guards subscriptions on shared family iPads [F DECISIONS].
- **Job to be done.** When two of us use one device, I want each letter signed by the right person and each person's letters to stay theirs.
- **Solution [Rec].** Do not build account switching. FAM-07 "Who's speaking" covers shared devices for signatures. For a handed-down phone, a clear "This phone holds {signsAs}'s letters. Sign out and remove them from this phone" after a confirmed sync (mechanism pm-5; extends the v1.0 rule that sign-out waits for uploads [F AUTH_SETUP 9.5]). Full multi-account stays with pm-5 as Later, only if insights show demand.
- **What competitors do.** Not a category feature [A].
- **Our differentiator.** None needed.
- **RICE.** Full multi-account: Reach 30 x Impact 1 x Confidence 50% / Effort 4 = **4**. Handed-down phone flow (pm-5): Reach 20 x Impact 1 x Confidence 70% / Effort 0.5 = 28.
- **Dependencies.** FAM-07; pm-5 auth and sync.
- **Legal and safety.** A second account must never adopt the first account's letters (today's guard is right); one account per person keeps authorship and consent records clean (`policy_acceptances` per person); D-047.
- **Metric.** `AccountMismatchError` occurrences per 1,000 installs (an L2 count) as the demand signal.
- **Size.** S (the handed-down flow, pm-5). **Horizon.** Later; full multi-account is on the will-not-build list for v1.x.

#### FAM-16 Plus for a co-parent outside the subscriber's Apple Family (requirement only)
- Owned by pm-4 (DEBATES Q-008, escalated to the founder). Family requirement from this file: one book must not behave differently on two parents' phones because of who pays or which phone they use; only parents see that a book is covered, as a yes and a date; copy never names the payer; coverage is per book. pm-2 supports option (b) in v1.2, then (c).

---

## 5. Decisions and questions

**Founder**
1. **Web contribution page in v1.2, not v1.1** (FAM-05). BRIEF decision 9 says v1.1; this file recommends v1.2 behind FAM-03 and FAM-01, with FAM-07 bridging.
2. **Shared voice policy for v1.1** (FAM-03): Free uploads recordings of letters in shared books; private letters never upload on Free. D-032 is still "needs founder OK" and BRIEF decision 9 defers the feature to v1.1 without fixing its policy.
3. **Two parents per book at most**, with a third only through support (FAM-11). Recommended now as v1.0 server hardening: one check in `create_child_invite` and `accept_child_invite`, before any non-founder data exists.
4. **Removing a family member: either parent alone, visible to both, no veto** (FAM-11 item 8). Confirm.
5. **The ethical lines** (adjacent A2) as standing policy for family features (section 8).
6. **Worldwide reach of the web page** (PRD 9 Q6), with counsel.
7. **Plus for co-parents outside the Apple Family** (DEBATES Q-008, pm-4).

**Counsel**
1. "Leave my letters for {child}": a licence that survives account deletion, and default keep or default remove (FAM-12; Lawyer 1 M7).
2. D-050 second consent at first family share: it binds when FAM-01 ships.
3. MHMDA and a relative's letter holding health data about the child or another adult (Lawyer 2, "Needs a human lawyer" 1).
4. Is the guest confirmation line enough under Terms 5.4 (FAM-07)?
5. Court-order verification standard and a legal-process page (Terms 9.4 counsel note; FAM-11).
6. The grown child's rights in letters others wrote about them at handover (FAM-13).
7. Invite messages sent by the user: confirm no CAN-SPAM or TCPA duty on us (FAM-04).
8. A child's sounds recorded by one parent: confirm no deletion right for the other parent beyond hiding it for themselves (FAM-11; pm-1 CVL-19).

**Coordinator**
1. Superseding D-entries for D-002 and D-032 against BRIEF decisions 5 and 9 and ROADMAP 2.0 (doc drift, section 1).
2. A migration timestamp range for `entries.spoken_by` and provenance, the parent cap, the Reader role and `remove_child_member` when these items are scheduled.
3. Ask the website thread to confirm nothing logs or forwards paths under `/i/` until FAM-04 moves the token into the fragment.

---

## 6. What this file needs from other owners (cite, don't re-score)

| Owner | Requirement | Item |
|---|---|---|
| pm-1 | Per-letter language for a guest speaker; imported relative voice notes use `spoken_by` with provenance `import` and the line "Shared by Papa"; the listening copy is rebuilt on the receiving phone; the transcription queue accepts web-origin audio and writes the raw transcript once under the family member's id; native-speaker review for invite messages; family prompt tags | FAM-07, FAM-03, FAM-05, FAM-04, FAM-09 |
| pm-3 | Render the signature plus provenance line ("Recorded on Papa's phone", "Shared by Papa") in the Book, PDF, print and web reader (accepted, pm-3 section 8); the web reader (BK-12) is the landing for the family link and digest; a family round's answers as one section of the chapter (BK-04 birthday page); the Book at 18 edition (BK-18) and the opening of letters sealed until 18 (BK-03); multi-generation rendering; resurfacing controls in On this day (BK-06) | FAM-07, FAM-06, FAM-09, FAM-13, FAM-10 |
| pm-4 | DEBATES Q-008 (Plus follows the book); the email platform and lifecycle rules for the transactional digest; invites as an acquisition channel; keep family notifications out of reminder back-off; G-10 shower kit reuses FAM-07 with its adult-only and consent constraints; gifting a year of Plus (C-REQ-030) needs a server grant that on-device-only Plus does not have [F migration 20261004000000] | FAM-16, FAM-06, FAM-04, FAM-17, FAM-07 |
| pm-5 | `apps/web` shell, CSP and hosting (T5-17); Report a concern tooling and the safety-removal runbook (T5-13); device list and sign-in alerts (T5-10) and the Face ID lock (T5-14); fiduciary runbook with the guardian-as-parent step, kept-account state and book keeper (T5-12); Vault-mode grants for family playback; Android build and parity (T5-16); realtime for open apps (T5-22); the handed-down-phone flow; storage cost for shared voice | FAM-05, FAM-06, FAM-11, FAM-12, FAM-03, FAM-14, FAM-08, FAM-17 |
| Content owner | Family role strings; guest author strings; invite messages in the seven spoken languages; "Looking after someone's letters" written within the rules test | FAM-01, FAM-07, FAM-04, FAM-12 |
| Analytics owner | `author_relation: guest`; no language code on invite events unless Q-004 converges to allow it | FAM-07, FAM-04 |

---

## 7. Top 10 for v1.1 to v1.3

Ranked by judgement, with RICE as one input and the floor rule applied.

| Rank | Item | Release | Why this position | RICE |
|---|---|---|---|---|
| 1 | FAM-03 Shared voice | v1.1 | The free family promise is half true without it; the pipeline FAM-05, Read together and photos ride on | 390 |
| 2 | FAM-07 Guest author | v1.1 | Cheapest no-install path; nothing new leaves the phone; reused by pm-1 imports and pm-4's shower kit | 280 |
| 3 | FAM-17 Family-letter notifications | v1.1 | Co-parent letters arrive silently in v1.0; FAM-01 and FAM-09 need it | 228 |
| 4 | FAM-04 Messaging invites | v1.1 | Fix the token in the path before WhatsApp and WeChat sharing grows; Nani's language | 200 |
| 5 | FAM-01 Family members as authors (with core approvals) | v1.1 | The core research job; the server half is built | 140 |
| 6 | FAM-11 Safety floor | v1.1, with FAM-01 | Floor rule: widening the circle without it invites the worst incident | 63 floor |
| 7 | FAM-14 Android family slice | With pm-5's Android release (v1.2 recommended by pm-5; v1.1 per founder decision 9) | Mixed-platform couples cannot share a book at all today | 175 |
| 8 | FAM-05 Web contribution page | v1.2 | The biggest competitive gap; the only author path for overseas and Android relatives | 63 |
| 9 | FAM-09 Shared family prompts | v1.2 | Turns a willing relative into a regular writer; family rounds for birthdays | 120 |
| 10 | FAM-12 Letters outlast accounts and a gentle support path | v1.3 (part 1 by floor rule before about 1,000 books with family) | Irreversible loss otherwise | 2.5 floor |

Just below the line: FAM-02 approval extras (v1.2, 120), FAM-06 readers and digest (v1.3, 83), FAM-15 multi-book invites and role change (v1.2, 60), FAM-11 two homes (v1.2), FAM-13 guardrails (S, any release).

**v1.1 load [A].** FAM-03 4 + FAM-07 1.5 + FAM-17 2 + FAM-04 1.5 + FAM-01 3 + FAM-11 floor 1 = about 13 engineer-weeks, plus 2 for the Android slice if Android ships in v1.1. This is the largest block in v1.1. If v1.1 must shrink, cut in this order: FAM-04 parts 3 and 5 (languages, QR) to v1.2; then FAM-01 to v1.2, keeping FAM-07 as the grandparent path. Never ship FAM-01 without the FAM-11 floor. Sequence: FAM-03 and FAM-17 first (they set the pipeline and the notification service), `book_access` early, FAM-01 last.

---

## 8. Will not build

| What | Why | Source |
|---|---|---|
| In-app chat, comment threads, reactions, likes | Becomes a social feed and a moderation duty; thanks are covered by "your letter is in the book" | Principle 3; us.md 9 themes 8 and 10 |
| "Seen by" lists, read receipts, last active, typing, location | Pressure for authors and surveillance in separated families | Principle 6; TDD 04 A1 |
| Public or link-shareable letters | Letters never leave the family | Adjacent A2 line 5 |
| Contact import, "find your family", sending invites or messages for the user, WhatsApp Business API or SMS from us | No contacts ever (A-REQ-035); copies family data to third parties; cost and consent duties | PRD UR R5; A-REQ-035 |
| Synthetic voice, cloning, text-to-speech in a family member's voice, avatars of anyone living or not, "continue their story" | Machines never write or imitate anyone; the audio store is a cloning corpus | CLAUDE.md; adjacent A2 lines 1, 2, 6; pm-1 rule |
| Machine-made memorials, tribute cards, "in memory" badges, resurfacing framed around a death | Legacy is about love and time, never endings | VOICE legacy rule; adjacent A2 line 6 |
| Digest emails that carry letter text, names or photos | Email is L3, transactional only, no content | `docs/legal/DATA_CLASSIFICATION.md` (email provider row) |
| Parents editing or deleting another author's words, including in separation and including a child's sounds recorded by the other parent | Authors own their words; a cross-parent delete would be a weapon | DATA-REQ-015; FAM-11 |
| Accounts for children under 18, a kids' mode, a child recording as an author while `child-input` is off | Adults only; COPPA | PRD-REQ-019; PRD-REQ-005 |
| Family tree, genealogy, a cross-family social graph | Scope and privacy | FAM-10 |
| Paywalls on family: invites, family authors, approvals, shared voice in shared books, readers | Founder decision; paywalls on family and memories are a leading complaint | C 4.1; us.md 8.3 point 4 |
| Account switching on one phone in v1.x | Guest author covers the job; one account per person keeps consent and authorship clean | FAM-08 |
| One-tap sharing of other people's letters into chat apps | Content leaves for Meta or Tencent without its author's say; authors can export their own letters (pm-3) | Principles 1 and 5 |
| Deciding custody or "who is the real parent" inside the product | Support acts only on verified legal orders | Terms 9.4 |

