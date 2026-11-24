# Backlog rank

The order the dispatcher gives agents their tasks. One row per ranked backlog id; this file is the only place rank lives (not a tag on `docs/BACKLOG.md` rows). How it is used and who recomputes it: `docs/agents/OPERATING_MODEL.md`, "Backlog rank". Checked by `scripts/agents/rank-check.mjs`.

Rules: ranks are 1..N, each used once, no gaps. Tier is T0, T1, T2 or T3 (T0 first). An id must be in `docs/BACKLOG.md` and not done or superseded. A ready agent row with no rank still runs, after the ranked rows, in file order.

This is a 10-row seed in the current file order, so merging it changes nothing. A later PR replaces it with the full ranking.

| Rank | Id | Tier | Why |
|---|---|---|---|
| 1 | BL-389 | T2 | Seed row: first ready agent rows in file order |
| 2 | BL-476 | T2 | Seed row: first ready agent rows in file order |
| 3 | BL-251 | T2 | Seed row: first ready agent rows in file order |
| 4 | BL-528 | T2 | Seed row: first ready agent rows in file order |
| 5 | BL-372 | T2 | Seed row: first ready agent rows in file order |
| 6 | BL-373 | T2 | Seed row: first ready agent rows in file order |
| 7 | BL-374 | T2 | Seed row: first ready agent rows in file order |
| 9 | BL-385 | T2 | Seed row: first ready agent rows in file order |
| 10 | BL-390 | T2 | Seed row: first ready agent rows in file order |
