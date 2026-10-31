# compliance/

Code and data that keep Early Letters inside the law at the door: who may create an account, from where, and what we watch for when rules change. It is fenced (CTO ruling CR-23). Only assigned agents may change it, and only when the Chief Compliance Officer (`regulatory-affairs`) and Karma (CTO) have both approved the exact commit.

## What lives here
| Path | What |
|---|---|
| `FENCE.json` | The fence: protected paths, assigned agents, the approval format. |
| `fence/` | The checker the `compliance-fence` CI check runs, and its tests. |
| `scripts/` | The regulatory watch (Federal Register), the geo data loader, their tests and `watch-topics.json` (moving here from `scripts/compliance/` in PR #424). |

Some compliance code cannot live in this folder, because its tools look elsewhere. `FENCE.json` protects it by name:
- `supabase/migrations/*_compliance_*.sql`: the Supabase CLI only reads `supabase/migrations/`. Every new compliance migration must have `_compliance_` in its file name.
- `supabase/tests/compliance_*.test.mjs`: the database harness runs `supabase/tests/`.
- `.claude/skills/regulatory-compliance/`, `.claude/skills/infosec/` and `.claude/agents/regulatory-affairs.md`: Claude Code loads skills and agents from `.claude/`.
- `.github/workflows/compliance-fence.yml`: GitHub runs workflows from `.github/`.

## Who may change it
Assigned agents (`FENCE.json`): `regulatory-affairs` (owner), `compliance-engineer`, `security-architect`, `data-architect`. A PR that touches a protected path needs:
1. The label `agent:<handle>` for one of them. An interactive session working as one of these agents labels its PR the same way.
2. Two comments from a trusted login, each with one line on its own naming the PR's current head commit:
   - `## CCO approval at <40-hex head sha>: APPROVED (CR-<n>)`, posted by the Chief Compliance Officer after the compliance checklist below;
   - `## Karma approval at <40-hex head sha>: APPROVED (CR-<n>)`, posted by Karma after the engineering checklist.
3. Any new push invalidates both. They re-check and approve the new head.

Every other agent's charter forbids editing these paths; they open a handoff to `regulatory-affairs` instead (`docs/agents/AGENT-COMMS.md`).

## The Chief Compliance Officer's checklist (CCO approval)
The CCO is the `regulatory-affairs` agent (skill `regulatory-compliance`). It is an AI role, not a lawyer: anything that needs a legal judgment goes to counsel through `docs/legal/COUNSEL_PACKET.md`, and the CCO does not approve until counsel's answer, or the founder's recorded default, exists.
- The account-creation checks table (skill section 2) still holds for every sign-up path, with a test for each row.
- No new collection of personal data without a DATA_CLASSIFICATION row and a data-minimisation reason.
- Every legal or platform fact the change relies on is in `references/checked-facts.md` with a source and date.
- No user-facing promise changes without the founder (Terms, Privacy Policy, store listing, in-app copy).

## Karma's checklist (Karma approval)
Karma posts the approval only after the CCO has approved the same head and all of these hold. Then Karma adds the label `karma:approved`, which re-runs the check.
- Two independent counted reviews on the head (`## Review A at <sha>: PASS`, `## Review B at <sha>: PASS`; D-107, D-117), one of them with the `infosec` skill.
- CI green, including `npm run test:db` for any SQL and `node --test compliance/` for scripts.
- Nothing stores or logs an IP, a birth date, an age range, a name or any user content (skill `regulatory-compliance`, "Never").
- A change to which places are blocked, or to what a user is told, has a founder decision recorded in `docs/DECISIONS.md` (Karma section 3). Karma never approves those alone.
- A ruling `CR-<n>` records the approval: what changed, why, and the way back.

## Limits (true today)
- **Advisory until required.** `develop` has no branch protection yet (checked 31 Oct 2026). The check blocks merges only once `compliance-fence` is a required status check. That is a founder step, alongside `scripts/release/apply-branch-settings.sh`.
- **Not identity.** Every Claude session posts as the founder's account (CR-20). The label and the approvals prove that the procedure ran, not who ran it. The fix is the separate automation identity in CR-20 (after 9 Nov).
- **First merge is by hand.** Until this fence is on `develop`, the check fails closed on any compliance path. The founder merges the fence PR itself, and PR #424 after it.
