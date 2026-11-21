# Split plan for PR #1086 (PostHog adapter), 20 Nov 2026

Status: proposal by the privacy agent. Read-only audit of #1086 at head `94ccd85c3501a56c53959ce5658265ec1ecec382` (12 commits, 39 files, +2131 -629). Nothing here changes code, and nothing merges from this PR.

## 1. Real-name check

Method: the hash logic of `packages/content/test/no-real-family-data.test.ts` (lowercase NFC word tokens, and a copy with marks removed, SHA-256, compared with `NAME_HASHES`), run through the GitHub API only. No value was printed.

| Where | Result |
|---|---|
| Final tree at head, all 39 changed files (paths and contents) | No match. The rest of the tree is `develop`, which the CI guard already covers. |
| PR title and body | No match |
| PR conversation comments, review comments, reviews | None exist |
| Commit messages and author fields, all 12 | No match |
| Diff of `1014088` (adds `packages/analytics/test/consent-crash.test.ts`) | Match: the allowed first-name spelling (hash prefix `177b77`, FIRST_NAME_HASH) |
| Diff of `e222ddc` (replaces it with Asha) | Match, on the removed lines |
| Diffs of `59df009`, `18ea84e`, `7ca730a`, `b1032a2`, `dd3a5ba`, `b096e28`, `895b470`, `3d0caf0`, `e8ea398`, `94ccd85` | No match |

Notes:
- `b1032a2` was named in the task as a carrier. The hash scan of its message and diff finds nothing. Whoever still holds a different spelling (not in the hash list) would not be caught; the guard only knows its listed spellings.
- The matched spelling is the one D-118 allows only in the paths listed in `NAME_ALLOWED_IN`. `packages/analytics/test/consent-crash.test.ts` is not one of them, so history in #1086 breaks the D-118 intent even though the tip is clean.
- The name stays reachable in git history and in the PR "Commits" tab, and GitHub keeps unreachable commits fetchable by sha. Recommendation: do not merge #1086 as is. Rebuild the stacked PRs below from the head tree (one fresh commit per PR, so `1014088` is never an ancestor), then close #1086. If counsel or the founder wants the old commits unreachable, that needs a GitHub Support request for the cached objects; the agents cannot do it.

## 2. Size rule

CODE-R02: at most 400 lines and 20 files per PR, lockfile, generated files and test data excluded. Line counts below are additions plus deletions from the commit stats.

Commit sizes in #1086: `59df009` 1469 lines (over by itself), `18ea84e` 312, `7ca730a` 384, `1014088` 300, `b1032a2` 68, `dd3a5ba` 89, `b096e28` 31, `895b470` 7, `3d0caf0` 16, `e8ea398` 100 (lockfile, not counted), `94ccd85` 4.

## 3. Stack

Each PR is cut from the head tree, targets the one before it, one concern, tests with the code. Fictional family Asha only.

| # | PR | Contents (from) | Approx. lines | Gate |
|---|---|---|---|---|
| A1 | Registry types and values | `registry.ts`, `values.ts`, `pii.ts`, `index.ts` export (59df009) | about 700 over; split in two: A1a `values.ts`, `pii.ts` (about 190); A1b `registry.ts` (467, with its own test slice from `registry.test.ts`, trimmed to stay under 400, or `Size exception` for the moved block) | analytics, privacy review |
| A2 | Catalog shrink and send-path flip | `catalog.ts` (36/366, mechanical move), `posthog.ts`, `validate.ts`, `plan-doc.ts`, TRACKING_PLAN.md, test follow-ups (59df009 remainder, 18ea84e, 94ccd85) | about 450; split TRACKING_PLAN.md and `plan-doc.ts` into A2b | analytics |
| A3 | Validator rules V1 to V16 | `registry-rules.ts` (212), `registry.test.ts` (253), `registry-canary.test.ts` (72) (7ca730a, 1014088 in part) | about 540; split canary test into A3b | analytics, privacy |
| A4 | Crash reducer (flag off) | `crash.ts` (106), crash half of the consent-crash test, rewritten with Asha | about 250 | privacy |
| A5 | Basics helpers, buckets, call-site constants | `basics.ts`, `buckets.ts`, `lifecycle.ts`, `observe.ts`, `trackers.ts`, `use-screen-views.ts` | about 110 | analytics |
| B1 | Client factory and persistence | `apps/mobile/src/lib/analytics/index.ts`, `track.ts`, `analytics-off-v1.test.ts`, `apps/mobile/package.json` (dd3a5ba) plus lockfile (e8ea398) | about 90 plus lockfile | founder approval of two new dependencies (exact versions in PR body, licence, last release, installed-source check per CODE checklist) |
| C1 | Consent copy | `strings.en.ts`, `consent-copy.test.ts`, sheet one-liner (b1032a2) | about 70 | founder wording, counsel on `turnOff` |
| C2 | Consent screen | `analytics-consent.tsx` (b096e28, 895b470), key check before release | about 40 | privacy, design |
| D1 | Production flag, alone | `3d0caf0` only: `eas.json`, `capabilities.ts`, two tests | 16 | FOUNDER APPROVAL REQUIRED. Last in the stack. Revert this one PR to keep every build off. |

Order: A1a, A1b, A2, A3, A4, A5, B1, C1, C2, D1. A-PRs can merge before any founder decision, because the flag is off. B1 needs the dependency approval. C1 and C2 cannot reach a build until D1. D1 must not merge until the open items in section 4 are closed.

Per-PR rule for privacy review: every PR re-runs `packages/analytics` tests, the content rules, and the no-real-family-data guard; none touches `docs/legal/**`.

## 4. Items for the founder and counsel

Founder:
1. Approve the two new dependencies, `posthog-react-native` 4.87.1 and `@posthog/react-native-plugin` 2.13.3 (plus transitive `@posthog/core`, `@posthog/types`). The plugin is installed for a later crash flip and never imported; consider leaving it out until then.
2. Approve or refuse D1 (analytics on in the production EAS profile). It does not update `scripts/preflight-production.mjs` (check `analytics`) or `scripts/preflight-testflight.mjs` (`stillOff`); a production release will fail those until ops and the founder decide.
3. Approve the consent wording (FOUNDER-WORDING, setup pack 1.1), including the choice to make no crash claim and name no phone model.
4. Decide persistence: `file` instead of `memory`, so an id and queue live on the phone after a yes, cleared on withdrawal. The privacy policy and in-app disclosure must say so.
5. Decide EU or US PostHog host (`EXPO_PUBLIC_POSTHOG_REGION`).
6. Decide on the name history: rebuild from a clean tree (recommended), and whether to ask GitHub Support to purge the cached commits.

Counsel (via `legal`):
1. Q-PH-4 and Q-PH-5: the `turnOff` retention sentences in the consent sheet.
2. PostHog as a subprocessor: DPA, SCCs if the US host, entry in `docs/legal/privacy-policy.md` and `docs/legal/data-policy.md`.
3. App Store privacy labels (`docs/legal/app-store-privacy-labels.md`): the app now collects usage data and an identifier on opt-in. The label must change before D1 ships; today those docs are untouched by #1086.
4. Whether the first launch ask for a child's data context needs a parental-consent record (PRIV-R21 lines: Shown, Records, Never, Decline) for the consent screen. Consult `regulatory-affairs` on age gating before an ask sequencer opens the screen.
5. Retention period at PostHog and the deletion path (DATA-REQ in `docs/legal/DELETION_AND_EXPORT_SPEC.md`): withdrawal resets the client id, but nothing yet asks PostHog to delete server-side data.

Engineering open items carried from the PR body, for `mobile` and `analytics`: the consent sheet shows whenever the flag is on, even with no EAS key (add a key check before release); the ask sequencer does not open the screen yet; no screen calls `tapControl`, `impressSurface` or `startPerf`; screens still call `track('letter_deleted', ...)` style literals for held events.

## 5. Not verified here

Counts of lines per stacked PR are estimates from commit stats, not from built branches. Nothing was run; this was a GitHub API read. The hash check covers the listed hashes only, and the 39 changed files, not binaries beyond that.
