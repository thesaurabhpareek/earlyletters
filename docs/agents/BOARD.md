# Agent board (moved)

**Locked spec, 22 Nov 2026.** The latest spec is `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 and the design ticket section of `docs/BACKLOG.md` (BL-1700 to BL-1858). The founder residue (section 13.4) is locked by D-169 in `docs/DECISIONS.md`. Two names stay open: the SE 3 sitting operator and whether counsel is engaged, so BL-1700, BL-1705 and BL-1786 stay held. Take work from the backlog statuses, not from older copies of the defaults.

Live claims are in `CLAIMS.md`: live rows only, at most 15, each expiring 72 hours after it is made or renewed. Rules are in `COORDINATION.md` section 2.

The full history of this file, every claim row and the old check-ins, is in `BOARD-ARCHIVE.md`. It is a byte-for-byte copy of `BOARD.md` as it stood on develop at bce606a3 (20 Nov), the last sync before this change merged; `git log --follow` keeps its history.

Check the claims with `node scripts/agents/board-check.mjs`. It is advisory and never blocks a merge.
