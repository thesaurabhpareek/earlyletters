# Delivery-stability metrics (RB-12)

Four numbers computed from git and the GitHub REST API, so the team can see whether speed is costing stability. Code: `scripts/metrics/delivery.mjs`. Tests: `scripts/metrics/delivery.test.mjs`. This is not wired into the board or the digest.

## Why
The 2025 DORA report, as summarised by InfoQ (https://www.infoq.com/news/2025/09/dora-state-of-ai-in-dev-2025), says AI adoption now has a positive link to delivery throughput and that software delivery instability continues to rise. This repo is built largely by agents, so throughput alone would flatter us. That page is the only external claim made here.

## Run it
```bash
node scripts/metrics/delivery.mjs --both            # JSON, then a markdown table (last 30 days)
node scripts/metrics/delivery.mjs --markdown --days 14 --branch develop
node --test scripts/metrics/delivery.test.mjs
```
Needs `gh` logged in. REST only. `computeDelivery({ prs, commits, tags, now, windowDays })` is pure, so tests and any other source can feed it fixtures. It reads PR titles, bodies, timestamps and commit messages; nothing else.

## Definitions
| Metric | Definition (exact) |
| --- | --- |
| Lead time | For PRs with `merged_at` inside the window: `merged_at - created_at`, in hours. Median and p90 by nearest rank (a value that was observed). |
| Deployment frequency | Tags matching `ios-v<x.y.z>` (release) or `ios-v<x.y.z>-rc.<n>` (candidate, ADR 0022) whose commit date is in the window. Per week = count / window days * 7. If no such tag exists the output says: no deployment yet. |
| Change-failure rate (proxy) | Scored set: PRs merged in the window at least 7 days ago (younger PRs are excluded so a quiet week cannot look clean). A scored PR P counts as failed if, within 7 days after P merged, either (a) another merged PR has a title starting with `fix`, `hotfix` or `revert` AND names `#P` in its title or body, or (b) a commit on the branch starts with `Revert` and contains `This reverts commit <P's merge sha>`. Rate = failed / scored. |
| Restore time (proxy) | For each failed PR: time from P merging to the first repair in (a) or (b). n/a when there are no failures. |

## Measured on 28 Oct 2026
Repo `thesaurabhpareek/earlyletters`, window 28 Sep to 28 Oct 2026 (30 days), commits read from `develop`. These are the output of the script run that day; they will drift as the repo changes.

| Metric | Value | Sample |
| --- | --- | --- |
| Lead time (PR opened to merged) | median 4.1 h, p90 189.7 h (max 311 h) | 202 merged PRs |
| Deployment frequency | n/a: no deployment yet | 0 tags in the repository |
| Change-failure rate (proxy) | 16.2% (17 of 105) | 105 PRs scored |
| Restore time (proxy) | median 2 h, p90 39.3 h | 17 repairs |

There is no deployment yet: the repository has no `ios-v*` tag of any kind, so deployment frequency is not zero, it is unmeasured. Of 202 merged PRs, 105 were old enough to be scored for failure.

### Reading the 16.2% honestly
I read six of the 17 flagged repairs. Three (#226, #219, #218) are follow-ups that close reviewer notes on an earlier PR, not failures found after release. #177 is an audit finding. #57 is a genuine production-visible fix and #78 fixes tests. So the proxy over-counts review follow-ups in this repo, and I have not classified the other 11. Treat 16.2% as "how often a merged PR needed a named fix within a week", not as "how often a change broke something".

## What each metric cannot tell you
- **Lead time.** It starts when the PR is opened, not when work began, and ends at merge, not at users receiving it. A long wait for review or a PR left open as a draft counts as lead time (the p90 of 190 h is mostly waiting, which I infer but did not check PR by PR). With no deployment yet it says nothing about how fast a change reaches a family. Median hides the long tail; read p90 beside it.
- **Deployment frequency.** Counts tags, and there are none, so today it tells you nothing. Once tags exist it counts builds cut, not builds installed, and says nothing about whether they were good. Preview TestFlight builds from `develop` are not tags and are not counted.
- **Change-failure rate.** A proxy built on naming convention. It misses failures fixed without naming the PR, fixed after 7 days, fixed by direct commit, or never noticed. It over-counts routine review follow-ups (see above). It uses merged PRs, not deployments, so it is not the DORA definition. With 105 PRs scored a single PR moves it by about 1 point, and PRs are not independent (one fix PR can flag several). Do not compare it with published DORA benchmarks.
- **Restore time.** A proxy: merge of the broken PR to merge of the repair. It is not user-visible downtime, and with no deployed product nobody has been affected. It only covers PRs already flagged as failures, so it is a small sample; n/a with none.

None of these measure quality, user value or learning, and none uses any family data. They describe the repo's own process only, so the consent bias that applies to opted-in product analytics does not apply here.

## Known limits of the code
- `fetchPrs` reads closed PRs newest-updated first and stops when a page is older than the window; a PR merged long ago but updated recently is included and filtered by `merged_at`. Capped at 30 pages of 100.
- Commits are read from one branch (`--branch`, default `develop`); reverts made on `main` only are not seen.
- A PR number mentioned in a fix PR may be an issue number; only numbers that match a merged PR in the fetched set can count.
