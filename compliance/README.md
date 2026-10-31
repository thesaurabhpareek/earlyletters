# compliance/

Code and data that keep Early Letters inside the law at the door: who may create an account, from where, and what we watch for when rules change. It is fenced (CTO ruling CR-27, aligned with the Chief Compliance Officer). Only assigned agents may change it, and only when the Chief Compliance Officer (council role `early-letters-cco`) and Karma (CTO) have both approved the exact commit.

## What lives here
| Path | What |
|---|---|
| `FENCE.json` | The fence: the two tiers of paths, content markers, assigned agents, the approval formats. |
| `fence/` | The checker the `compliance-fence` CI check runs, and its tests. |
| `scripts/` | The regulatory watch (Federal Register), the geo data loader, their tests and `watch-topics.json` (moving here from `scripts/compliance/` in PR #424). |

Some compliance code cannot live in this folder, because its tools look elsewhere. `FENCE.json` protects it by name, and also catches any file under `supabase/` whose diff mentions a compliance table or function (`content_markers`), so a migration cannot dodge the fence by its name:
- `supabase/migrations/*_compliance_*.sql`: the Supabase CLI only reads `supabase/migrations/`. Name new compliance migrations `*_compliance_*`; the content markers catch the rest.
- `supabase/tests/compliance_*.test.mjs`: the database harness runs `supabase/tests/`.
- `.claude/skills/regulatory-compliance/` and `.claude/agents/regulatory-affairs.md`: Claude Code loads skills and agents from `.claude/`. (The `infosec` skill is the CISO's and is not fenced here.)
- `.github/workflows/compliance-fence.yml`: GitHub runs workflows from `.github/`, and for this trigger only from the default branch, `main`.

## Two tiers
| Tier | Paths | Who may change them | Needs on the head commit |
|---|---|---|---|
| Protected | `compliance/`, `scripts/compliance/`, `docs/compliance/`, compliance migrations and tests, the regulatory-compliance skill, the `regulatory-affairs` charter, this check's workflow; any `supabase/` file whose diff touches a compliance table or the auth hook | Assigned agents only | `agent:<assigned handle>` label, CCO approval, Karma approval |
| CCO review | The age gate (`apps/mobile/src/components/gate/`, `apps/mobile/src/lib/age-gate*`), store age-signal code, any `supabase/` file whose diff touches `policy_acceptances` or `record_policy_act` | Any agent (`mobile` owns the age gate) | CCO approval |

`docs/legal/**` is not fenced here: `legal` owns it, and Terms or Privacy changes already need the founder. The CCO reviews register changes as part of the door review.

## Who may change protected paths
Assigned agents (`FENCE.json`): `regulatory-affairs` (owner), `compliance-engineer`, `security-architect`, `data-architect`. A PR that touches a protected path needs:
1. The label `agent:<handle>` for one of them. An interactive session working as one of these agents labels its PR the same way.
2. Two comments from the repository owner's login (never a bot, so an unattended agent cannot approve its own PR), each with one line on its own naming the PR's current head commit:
   - `## CCO approval at <40-hex head sha>: APPROVED (CCO-<n>)`, posted by the Chief Compliance Officer after the compliance checklist below, with its ruling in `docs/agents/exec/RULINGS.md`;
   - `## Karma approval at <40-hex head sha>: APPROVED (CR-<n>)`, posted by Karma after the engineering checklist.
3. Any new push invalidates both. They re-check and approve the new head.

Every other agent's charter forbids editing these paths; they open a handoff to `regulatory-affairs` instead (`docs/agents/AGENT-COMMS.md`).

## The Chief Compliance Officer's checklist (CCO approval)
The CCO is the executive council's Chief Compliance Officer (skill `early-letters-cco`, `docs/agents/exec/COUNCIL.md`), with the `regulatory-affairs` agent (skill `regulatory-compliance`) doing the working-level review. It is a Claude role, not a lawyer: anything that needs a legal judgment goes to counsel through `docs/legal/COUNSEL_PACKET.md`, and the CCO does not approve until counsel's answer, or the founder's recorded default, exists.
- The account-creation checks table (skill section 2) still holds for every sign-up path, with a test for each row.
- No new collection of personal data without a DATA_CLASSIFICATION row and a data-minimisation reason.
- Every legal or platform fact the change relies on is in `references/checked-facts.md` with a source and date.
- No user-facing promise changes without the founder (Terms, Privacy Policy, store listing, in-app copy).
- No new door path (a sign-up method, an invite or deep link, the web contribution page) without its row in the checks table and a test.
- DB-IP attribution: any page that shows or uses the geo result (the sign-up refusal screen, the web contribution page, the Licences screen) links to https://db-ip.com, as the CC BY 4.0 licence requires.

## Karma's checklist (Karma approval)
Karma posts the approval only after the CCO has approved the same head and all of these hold. Then Karma adds the label `karma:approved`, which re-runs the check.
- Two independent counted reviews on the head (`## Review A at <sha>: PASS`, `## Review B at <sha>: PASS`; D-107, D-117), one of them with the `infosec` skill.
- CI green, including `npm run test:db` for any SQL and `node --test "compliance/**/*.test.mjs"` for scripts.
- Nothing stores or logs an IP, a birth date, an age range, a name or any user content (skill `regulatory-compliance`, "Never").
- A change to which places are blocked, or to what a user is told, has a founder decision recorded in `docs/DECISIONS.md` (Karma section 3). Karma never approves those alone.
- A ruling `CR-<n>` records the approval: what changed, why, and the way back.

## Limits (true today)
- **Runs only from `main`.** GitHub takes a `pull_request_target` workflow from the default branch since 8 Dec 2025, so the check runs on PRs into `develop` only once this workflow file is also on `main`. It reads the rules from each PR's base, so `develop`'s `FENCE.json` still governs.
- **Advisory until required.** `develop` has no branch protection yet (checked 31 Oct 2026). The check blocks merges only once `compliance-fence` is a required status check, and it must not be made required before the workflow is on `main`, or every PR would wait forever.
- **Text matching, not parsing.** Content markers catch a compliance table named in a diff in any case. SQL that builds a name from pieces at run time would slip past; review is the backstop.
- **Not identity.** Every Claude session posts as the founder's account (CR-20). The label and the approvals prove that the procedure ran, not who ran it. The fix is the separate automation identity in CR-20 (after 9 Nov).
- **Fails closed.** Any API error fails the check. The bootstrap path (a fixed path pattern) runs only when the base commit truly has no fence (HTTP 404), never on another error.
- **First merge is by hand.** Until this fence is on `develop`, the bootstrap fails closed on any compliance path. The founder merges the fence PR itself, and PR #424 after it.
