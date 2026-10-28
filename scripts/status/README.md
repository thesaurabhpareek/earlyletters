# Founder page (`scripts/status/page.mjs`)

Prints a founder note of at most 15 lines from the GitHub REST API. It only reads (GET through `gh api`) and writes nothing: no files, comments, labels or issues. Retro package R1-03 (IMP-38; it reports on IMP-31, IMP-14 and IMP-36).

```bash
node scripts/status/page.mjs                    # the 15-line note
node scripts/status/page.mjs --founder-list     # every founder-class merge in 7 days, one line each (weekly skim)
node scripts/status/page.mjs --repo owner/name --trust login1,login2 --now 2026-10-28T12:00:00Z
node --test scripts/status/page.test.mjs        # fixture tests, no network
```

It needs `gh` signed in with read access to the repo. One run makes three list calls (more pages if a list passes 100), one files call per PR merged in the last 7 days, and two thread calls for each PR it shows. On 28 Oct 2026 that was 97 merged PRs and about 80 seconds.

## What each line means

| Line | Source | Rule |
|---|---|---|
| Merged in the last 24 h | closed PRs, any base branch | `merged_at` within 24 hours |
| Waiting for review | open PRs that are not drafts | oldest first by `created_at`; the first 4 are shown with their verdicts |
| `lens ... on head` | PR comments and reviews | the latest lens verdict, and whether its sha matches the PR's current head |
| `red team ... on head` | PR comments and reviews | the latest `<!-- red-team:<sha> -->` review, parsed by `scripts/agents/verdicts.mjs` `parseVerdict` |
| Handoffs open over 48 h | open issues labelled `handoff` | `created_at` more than 48 hours ago; the count is all comments on the issue, not only replies |
| Founder-class merges in 7 days | files of each PR merged in 7 days | the D-117 path classes below; newest 3 shown with their last two lens verdicts |
| Open PRs older than 14 days | open PRs, drafts included | a count only |

Only comments and reviews by trusted logins count. The default is the repo owner: the review comments on #165 to #205 and #293 were all posted from that account. Change it with `--trust`.

## How a lens verdict is read

Lens reviews are free text. The script follows the habit in PRs #165 to #205 and #293: the first line names the review and ends with the verdict, for example `## Review A (code and tests), PR #293 at f54c0e4: PASS WITH NOTES` or `PR #179 at df2991c: PASS`.
- **Counted passes (D-117).** Free text cannot be proved safe: four independent review rounds on 28 Oct kept finding blocking wording that a parser read as a pass. So only a strict format counts toward the two reviews on the merged head: a first line that is exactly `## Review A at <sha>: PASS` (or `PASS WITH NOTES`; `Review B`, `Review A delta` also accepted), or the lens marker `<!-- lens:a:<sha> -->` followed by a line that is exactly `Verdict: PASS` (open PR #353's format). Nothing else may be on that line, and the first 15 lines may hold no stop phrase ("do not merge", "request changes") and no open Must. Put the lens focus and notes on the following lines.
- **Free-text verdicts** are still read, best effort, and shown with "(free text)" so the founder can see them, but they never count. The best-effort reader is conservative (any negation, condition, open Must or second verdict reads as not passing), and on the 22 real verdicts on #290, #293, #355, #358, #359 and #360 it reads 20 as stated and 2 as CONDITIONAL. Until reviewers use the strict line, founder-class merges will show "fewer than 2 counted passes": that is true, not noise, because nothing machine-checkable says otherwise.
- **Sha:** the first hex word of 7 to 40 characters with a digit in it in the first line, otherwise `head <sha>` in the first five lines. A verdict without a sha never counts as on head.
- A first line that names a different PR (`PR #166 at ...` posted on #182) is skipped.

A review written in another shape is missed and shows as `none`. That errs toward asking for a review, not toward claiming one.

## Founder-class paths (D-117)

From `docs/DECISIONS.md` D-117 and `docs/agents/COORDINATION.md` section 6, as `FOUNDER_CLASSES` in `page.mjs`:

| Class | Paths |
|---|---|
| database | `supabase/**` |
| auth | `apps/mobile/src/lib/auth/**`, `apps/mobile/src/app/(auth)/**` |
| payments | `packages/core/src/plan.ts`, `apps/mobile/src/lib/billing/**`, `apps/mobile/storekit/**` |
| release config | `.github/**`, `apps/mobile/eas.json`, `apps/mobile/app.config.ts` |
| engine | `packages/core/src/types.ts`, `verify.ts`, `meaning.ts`, `pipeline.ts` |

D-117 names `supabase/**`, `.github/**`, the two app config files and the engine files as paths. It names "auth" and "payments" only as words, apart from `plan.ts`. The auth and payments globs above are this script's reading, not a decision. Production deploys are not path based and are not covered.

A founder-class line ends with "(fewer than 2 counted passes on the merged head)" when fewer than two of the last two lens verdicts are strict-format passes on the merged head. The D-117 operating rule needs two passing reviews on the current head.

## Adding other reports (hook)

The delivery metrics (`scripts/metrics/**`) and the stale-PR classifier (`scripts/agents/stale.*`) are built elsewhere. This script does not repeat them. To add their output, call the exported functions and pass their lines in:

```js
import { collect, buildModel, renderPage, ghGet } from "./scripts/status/page.mjs";
const model = buildModel(collect(ghGet, { repo, now, trusted }), now);
console.log(renderPage(model, { extraLines: [metricsLine, staleLine] }).join("\n"));
```

Up to `EXTRA_SLOTS` (2) extra lines are printed before the last line. Anything beyond that is cut, so the note never passes 15 lines.
