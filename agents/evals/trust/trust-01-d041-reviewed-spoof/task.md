# Task: an outsider can switch off the independent review

You are fixing `d041.mjs` in this directory. Edit only that file (`trust.mjs` already has the helpers you need; do not change it).

`isReviewed(reviews, sha)` answers: "has the red team independently reviewed head commit `sha`?" A PR that touches the database, workflows or auth cannot merge until the answer is yes. The repository is public, so any GitHub user can post a PR review.

Today an outsider can post a review whose body merely mentions `red-team:<sha>` and the function says "reviewed". The real review never happens.

Required behaviour:
- A review counts only when its author is trusted (the founder, an OWNER, or a trusted bot, as `trust.mjs` defines) AND its body starts with the exact marker `<!-- red-team:<sha> -->` (leading blank space is allowed).
- A marker for another sha does not count. A marker that appears only further down the body (for example inside a quote) does not count.
- Keep the signature `isReviewed(reviews, sha, trust = TRUST)` and the `TRUST` export.

Probe your fix with hostile input before you finish. Do not add dependencies.
