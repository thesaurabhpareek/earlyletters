# Theme 9: My partner in the same book, and hearing each other's voice

Readiness: 9a (text co-parent) 24 of 28; 9b (shared voice) NOT READY, 14 of 28 (audit 8 Nov: 12 for the file). Author's re-score, `qa` to confirm. Remains for 9a: counsel Q53 and Q50; two phones and two Apple Accounts (C14); the Family tab stays hidden in the first public release. 9b is blocked below.

### Blocked on (9b only; exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | How are recording keys distributed to a second parent so that a removed partner cannot decrypt another recording (feasibility AD-2)? `book_access` is in no migration (searched 8 Nov) and `F31` exists only as a table row in `F30-later.md`, so there is no spec and no schema. | `principal-architect` (an ADR), `security-architect` (threat model, PRINCIPLES 16) | Wrap keys per member device for parents; a per-play unwrap only for web with a hard rate limit; write the ADR and threat model before any 9b row is handed out. | R4, R5, R7 to R9 |
| B-2 | Counsel on key custody for 9b, two-parent cap (Q53) and custody and removal (Q50). | Counsel | Cap stays 2 parents (the database default `app.max_parents_per_book` is 2). Removal ends listening within one pull cycle. | R4 |

9a is finished and can start after theme 7 passes on two phones. 9b rows R4, R5 stay as drafted below and are not handed to an engineer.

| | |
|---|---|
| Working label | NX-09 (working id, see `_CONVENTIONS.md`; R1 to R3 and R6 are 9a, R4 and R5 are 9b) |
| Refines | F11 (co-parent), F11-REQ-006, F31 (shared voice), FAM-03, D-120, D-126, D-050 |
| Tag | EVIDENCE for the gap: a co-parent reads the other's letter but cannot hear it (`02-family-circle.md` fact 6, via `01-customer-needs.md` rank 8). HYPOTHESIS for demand (1 of 287 reviews mention a partner contributing; Little Things added sharing because it was the top request, `02-benchmark.md` opening 4, a very small app) |
| Size | Two slices. 9a text co-parent: S (code merged, needs proof). 9b shared voice: XL (feasibility item 10; about 14 PRs, 10 fenced, about 10 founder review hours) |
| Gate | Counsel (Q53 two-parent cap, Q50 custody and removal, key custody for 9b). Compliance rating: go slow. Security threat model before 9b (PRINCIPLES 16) |
| Order | 9 of 12. 9a after theme 7; 9b after public release |

## What the parent will see and do

9a: invite your partner by a link; they join free; you both add letters to one book. 9b, later: each hears the other's recorded voice on their own phone, and removing a partner ends their listening.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-09-R1 | EVIDENCE | Given a link invite, When a second Apple Account redeems it, Then that account becomes a parent of the book, and a third redeem attempt is refused with SQLSTATE SCCAP, surfaced to the app as the invite refusal `book_full` (`packages/api/src/server/family.ts`; never retried). Wrong-code attempts are limited to 10 failures per device per hour and 1,000 per hour globally (`06-nfr.md` Edge Function light row). | The cap and the refusal exist in code and migrations (`20261005000000_family_cap_language_idempotency.sql`) and have never run across two Apple Accounts. | S1-22, S1-28; D-120 |
| NX-09-R2 | EVIDENCE | Given `peek_invite` before consent, Then it returns the inviter's sign-off and the role only, never the child's name. | Merged; not run hosted. | F02-REQ-021 |
| NX-09-R3 | EVIDENCE | Given the build 12 profile with co-parent hidden, Then the Family tab shows the `familyCopy` coming-soon line (name the real key in the PR; `exists` is UNVERIFIED here) and the listing does not name co-parent sharing (the claims test, theme 8 R8, reads it). | The tab is hidden by the production profile (D-126); no test pins the line. | Gap map 1.4 |
| NX-09-R4 | HYPOTHESIS | Given 9b, When a partner is removed, Then within one sync cycle (15 seconds pull for shared books, ADR 0025) the removed phone cannot decrypt another recording, 0 of 5 attempts, including with a cached key. | No path exists; `book_access` is in no migration (searched 8 Nov). | Feasibility item 10 pre-mortem |
| NX-09-R5 | HYPOTHESIS | Given 9b, Then escrow unwraps stay inside the escrow limits of `06-nfr.md` (3 new-device restores per account per 30 days; 20 opened keys per day, alert on any limit hit); a per-play unwrap would break that, so keys are wrapped per member device (AD-2 option b). The "under 1 per hour at 1,000 families" figure is an assumption in the feasibility file, not an `06-nfr.md` number. | Assumption only. | Feasibility AD-2 |
| NX-09-R6 | EVIDENCE | Given a co-parent letter arrives, Then the other phone gets no push (push is off; co-parent push moved to v1.1, #605), and nothing with a name or words is on the lock screen. | Local only today. | Gap map 1.4 |

**Shown:** `familyCopy.*` (exists). 9b adds a line that says whose voice is playing.
**Records:** invite acceptance follows PRIV-R21 (the invitee consents first).
**Never:** read another parent's private letters, show a child's name before consent, play a recording to anyone not a member, let a removed member keep access.
**Decline and withdraw:** the invitee can decline with nothing stored; either parent can leave; export and deletion keep working.

## Edge cases

Separated parents (a floor, not demand data); mixed-platform couples (Android is iPhone-only in v1.0, hypothesis U8); a partner who never writes; one parent deletes (theme 4 R6); contributor role hidden in the app but supported in the database.

## Offline behaviour

An invite needs a network. Joined parents each keep their phone copy and sync on return.

## What we never do

Overwrite the other parent's words; count who writes more; name the platform of a partner's phone in store text (2.3.10).

## Copy needs (packages/content)

Keys, all `new` in `familyCopy` (`features/family.en.ts`; the group exists), 9b only: `voice.playingFrom`, `voice.onlyOnTheirPhone`, `remove.endsListening`. The coming-soon line for 9a (R3) already exists or is named in the PR. Words by `content`; counsel for the removal sentence.

## Analytics events (opt-in, content-free, names only)

Existing: `invite_created`, `invite_accepted`, `invite_failed`, `member_removed`, `member_left`, `family_letter_reviewed`. New (9b): `shared_voice_played`: not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add it to the catalog and `TRACKING_PLAN.md` first. Existing events are in catalog.

## Device rows

S1-22, S1-28. New (9b): "removed member cannot decrypt", "two Apple Accounts".

## Dependencies

Themes 1, 2, 7. 9b needs an ADR for AD-2 (key distribution), a threat model, a spec (there is no `features/F31` file) and the media pipeline.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Co-parent sharing in the first public release | Keep it hidden; turn on in 1.0.1 behind the existing switch (gap map section 6 question 5) |
| Key distribution for 9b (AD-2) | Moved to "Blocked on" B-1. Recommended: wrap per member device; ADR and threat model first |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | 9a: invite create, peek, redeem and member contracts exist in `packages/api/src/server/family.ts` (refusals include `book_full`); no new type. 9b: new media-key and member-device types, version 1, contract tests in `packages/api/test/`; not specified until B-1. |
| Budget (`06-nfr.md`) | Letter saved on one phone visible on the other: p95 30 s, p99 60 s (15 s pull for a shared book open). Invite redeem: Edge Function light p95 600 ms. 9b playback start: local file p95 300 ms; no number for a shared fetch yet (B-1). |
| Accessibility | Family tab, invite sheet, join screen: AX5 with 0 clipped lines; VoiceOver reads the inviter's sign-off and role before Join; tap targets 44 pt or more; Reduce Motion: fade only. 9b: the line that says whose voice is playing is read before the play control. Device rows S1-22, S1-28 run once at AX5. |
| Switch, off behaviour, noticed by | Switch: the Family capability (hidden in the first public release) and the `contributors_enabled` server setting (contributors refused). Off: the tab shows the coming-soon line; existing invites are not created; solo books are unchanged. Rollback: turn the capability off; joined parents keep their phone copies (offline section). Noticed by: `invite_failed` (when analytics are on) and the `ops-health` rejected-writes view. |
| Data class and retention | Membership (`child_members`): L3, readable by members. Invite (`child_invites`): L3, code stored as a hash with the consent pepper, expires. `peek_invite` returns the inviter's sign-off and role only (child name is L4 and never shown before consent). 9b key material: L4-adjacent, per-device wrapped, removed on member removal; retention to be fixed in the B-1 ADR. |
| Schema and grants | 9a: none new; the family migrations are on develop (`20261003000000_security_and_family.sql`, `20261005000000_family_cap_language_idempotency.sql`, `20261028010000_invite_redeem_by_code.sql`). 9b: new additive migration (`book_access` or the ADR's table) with grants in `supabase/tests/grants.mjs` and an access test; held with B-1. |
| Analytics events | invite_created, invite_accepted, invite_failed, member_removed, member_left, family_letter_reviewed: in catalog. shared_voice_played (9b): add to catalog first. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-09-R1 | D-120; F11 | two-account db/sync test (proposed `supabase/tests/family-redeem.test.mjs`, or the existing family test with the bracket added); `[NX-09-R1] second Apple Account joins; a third is refused with SCCAP` | S1-22, S1-28 |
| NX-09-R2 | F02-REQ-021 | db test (existing `peek_invite` test; add the bracket); `[NX-09-R2] peek returns sign-off and role, never the child's name` | S1-28 |
| NX-09-R3 | D-126; #607 | mobile unit (proposed `apps/mobile/test/family-hidden.test.ts`); `[NX-09-R3] Family tab shows the coming-soon line in the build 12 profile` | none |
| NX-09-R4 | feasibility item 10 | HELD (B-1); db plus device; `[NX-09-R4] removed member cannot decrypt, 0 of 5` | new: removed member cannot decrypt |
| NX-09-R5 | feasibility AD-2 | HELD (B-1); function test against the escrow limits; `[NX-09-R5] unwraps stay inside the escrow limits` | none |
| NX-09-R6 | #605 | mobile unit (proposed); `[NX-09-R6] a co-parent letter produces no push and no lock-screen text` | S1-22 |

Trace: NX-09-R1..R6 -> F11, F11-REQ-006, F31 (a row in F30-later.md), FAM-03, D-050, D-120, D-126.

## Not verified

Share of mixed-platform couples. Whether any partner wants voice sharing; Study 3 would test it.
