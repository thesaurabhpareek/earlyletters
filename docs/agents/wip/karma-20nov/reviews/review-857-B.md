## Review B at b60a0687228a048be04da28075a4ae3eb992ce44: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: identity and security (chapters 05 IAM, 06 SEC). Files: `docs/tdd/new-scope/architecture.md` and `docs/tdd/new-scope/README.md`. This head was committed 11:15:34 UTC and read live at 11:26 UTC, so it is more than 10 minutes old. CI on the head: complete, 9 of 9 checks pass.

Must fix: none.

## What I checked
The round from my review of `575fc607` (CHANGES, one must-fix). The diff from that head to this one changes `architecture.md` only (9 lines added, 9 removed). The README is unchanged.

The must-fix is closed. Section 2.2 item 2 now fails closed. A group that narrows who may read a letter, or what the server keeps, is never dropped. That covers `seal`, `words_withheld` if S3 is ever ruled, and any later privacy or hidden-from group. The whole op for that letter waits until the server advertises the group. The negative test is named: a sealed letter queued against a server without `seal` sends nothing, then goes up whole and sealed once `seal` is advertised (NS-06-B8). AC-16 and AR-1 say the same. The `sync_v1_server.sql:1031-1032` cite holds.

Notes taken in this round:
- AX-12 now cancels every scheduled notification when `bookVisibleTo` turns false. It also sets `accessibilityViewIsModal` on the cover. Both cites hold: `app-lock-layer.tsx:80` and `_layout.tsx:241-242`.
- AC-15 says `p_api_version` is never an access input, and that the update screen never blocks local use, export or deletion (`remote-config.ts:98`, holds).
- AX-4 now records that CR-67 wins.
- AX-16 now takes CR-67's line count (367 on #864, checked).
- AX-17 records that B8 to B10 are owed in `security.md`.

Facts: the 36 cites I sampled at `575fc607` are unchanged at this head and still hold. The 4 new cites hold too. That is 40 of 40.

Boundaries:
- No founder or counsel question is decided.
- The constitution (AB-8), the X2 note (AB-6) and the rule that export and deletion are never paused all stand.

## Findings (most serious first)
1. Section 2.2 says "Today `in_book` is the only narrowing group, and every server since v1 accepts it". That is true: `ALL_GROUPS` is `types.ts:51`, and the v1 server accepts all five groups. The `caps` drift test should still pin the list of narrowing groups by name. Then a future privacy or hidden-from group cannot silently join the droppable set.
2. AX-12's notification cancel ties to BL-967. The two PRs should share one cancel function, so sign-out and an account change cannot drift apart.
3. Format: ASCII, under 400 lines, TDD 01 tags, no copied card text.

## Buildability
2.2 now has a positive test and a negative test, an owner (`sync`) and reviewers. AS-1 orders it before C3 and C4.

## Not verified
- Whether `caps` fits the `sync_pull` budget.
- Whether rejected ops can be replayed.
- Writing Tools on iOS.
- Whether Caches is outside the iPhone backup.
- Nothing was run on a phone or a database.

Reviewer: independent of the author (CR-44).
