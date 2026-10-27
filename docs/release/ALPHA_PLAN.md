# Alpha plan: pointer (the original is not kept on develop)

The alpha plan written on 15 Oct 2026 for decision D-106 (PR #152, closed unmerged) is not kept as a live document. Its dates were overtaken by the 17 and 23 Oct decisions and by the alpha automation plan, and a second copy of the schedule would drift. Files on develop still cite it by name, so this page says where each part now lives.

| You are looking for | Read |
|---|---|
| The decision (alpha on TestFlight, option B, servers on against staging) | `docs/DECISIONS.md`, D-106, with D-111 to D-117 |
| The build 1 and build 2 checks, the decision rule, and the current dates | `docs/qa/ALPHA_GO_NO_GO.md` (the rule is in its section 3) |
| The pipeline, the founder steps in order, rollback per layer | `docs/release/AUTOMATION.md` |
| The two builds and the twelve founder build steps | `docs/release/TESTFLIGHT.md` |
| Environments (staging, production) | `docs/release/ENVIRONMENTS.md` |
| The release train after the alpha | `docs/ops/RELEASE.md` and ADR 0022 |

Section numbers cited elsewhere as "ALPHA_PLAN section 6" mean the go/no-go checks and the decision rule: use `docs/qa/ALPHA_GO_NO_GO.md` sections 1 to 3.

The original text is on the branch `docs/alpha-plan` (commit 1ae1ace6, 15 Oct 2026). Read it as history, not as the plan: where it disagrees with the files above, they win.
