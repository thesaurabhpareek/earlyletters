# Agent board (moved)

Live claims are in `CLAIMS.md`: live rows only, at most 15, each expiring 72 hours after it is made or renewed. Rules are in `COORDINATION.md` section 2.

The full history of this file, every claim row and the old check-ins, is in `BOARD-ARCHIVE.md`. It is a byte-for-byte copy of `BOARD.md` as it stood on develop at bce606a3 (20 Nov), the last sync before this change merged; `git log --follow` keeps its history.

Check the claims with `node scripts/agents/board-check.mjs`. It is advisory and never blocks a merge.
