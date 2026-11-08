# Theme 9: My partner in the same book, and hearing each other's voice

| | |
|---|---|
| Working label | NX-09 (id: to be assigned) |
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
| NX-09-R1 | EVIDENCE | Given a link invite, When a second Apple Account redeems it, Then that account becomes a parent of the book, and a third redeem attempt is refused (two-parent cap). | Never run on two phones. | S1-22, S1-28; D-120 |
| NX-09-R2 | EVIDENCE | Given `peek_invite` before consent, Then it returns the inviter's sign-off and the role only, never the child's name. | Merged; not run hosted. | F02-REQ-021 |
| NX-09-R3 | EVIDENCE | Given the build 12 profile with co-parent hidden, Then the Family tab shows "coming soon" and the listing does not name co-parent sharing. | Hidden by D-126 (#607). | Gap map 1.4 |
| NX-09-R4 | HYPOTHESIS | Given 9b, When a partner is removed, Then within one sync cycle (15 seconds pull for shared books, ADR 0025) the removed phone cannot decrypt another recording, 0 of 5 attempts, including with a cached key. | No path exists; `book_access` is in no migration. | Feasibility item 10 pre-mortem |
| NX-09-R5 | HYPOTHESIS | Given 9b, Then escrow unwraps stay under the budget in `06-nfr.md` (assumed under 1 per hour at 1,000 families); per-play unwrap breaks that, so keys are wrapped per member device (AD-2 option b). | Assumption only. | Feasibility AD-2 |
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

Keys to add: `familyCopy.voice.playingFrom`, `familyCopy.voice.onlyOnTheirPhone`, `familyCopy.remove.endsListening`.

## Analytics events (opt-in, content-free, names only)

Existing: `invite_created`, `invite_accepted`, `invite_failed`, `member_removed`, `member_left`, `family_letter_reviewed`. New (9b): `shared_voice_played`.

## Device rows

S1-22, S1-28. New (9b): "removed member cannot decrypt", "two Apple Accounts".

## Dependencies

Themes 1, 2, 7. 9b needs feasibility AD-2 (key distribution) and the media pipeline.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Co-parent sharing in the first public release | Keep it hidden; turn on in 1.0.1 behind the existing switch (gap map section 6 question 5) |
| Key distribution for 9b (AD-2) | Wrap per member device for parents; per-play unwrap only for web with a hard rate limit; threat model first |

## Not verified

Share of mixed-platform couples. Whether any partner wants voice sharing; Study 3 would test it.
