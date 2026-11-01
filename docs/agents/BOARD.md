# Agent board (moved)

Live claims are in `CLAIMS.md`: live rows only, at most 15, each expiring 72 hours after it is made or renewed. Rules are in `COORDINATION.md` section 2.

The full history of this file, 88 claim rows and the old check-ins, is in `BOARD-ARCHIVE.md`. It is a byte-for-byte rename of the old `BOARD.md`; `git log --follow` keeps its history.

Check the claims with `node scripts/agents/board-check.mjs`. It is advisory and never blocks a merge.
