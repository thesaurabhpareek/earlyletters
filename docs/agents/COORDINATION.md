# How agents and threads work together (read before any work)

This applies to every agent in every thread (this build thread, the App Store setup thread, the website thread, research threads) and to humans.
The goal is one product with one set of patterns: no duplicate work, no conflicting conclusions, no surprise publishes.

## 1. Roles
| Role | Who | Only they may |
|---|---|---|
| **Coordinator** | The main session of the build thread | Commit, merge, push, tag; record decisions in `docs/DECISIONS.md`; assign file ownership; run the release train |
| **Founder** | Saurabh | Approve anything irreversible: live migrations, App Store submission, publishing packs and config, DNS, spending, legal text going public |
| **Agent** | Any subagent | Edit only the files their task owns; post check-ins; propose decisions |
| **Other threads** | Other chats (App Store setup, website, naming) | Work in their own area (see section 6); never push to `develop` or `main` |

## 2. Before you start: claim your area
1. Read `docs/agents/BRIEF-2026-10-03.md`, this file, `docs/DECISIONS.md` and `docs/agents/BOARD.md`.
2. Add a **claim** line to the "Active claims" table in `BOARD.md`: agent name or id, area, file globs, start time (UTC).
3. If your globs overlap someone else's live claim, do not edit those files. Message the owner (`ListAgents`, then `SendMessage`) or note it on the board for the coordinator. Pick another slice of work meanwhile.

## 3. While you work: check in, small and often
- Every ~20 tool calls or ~30 minutes, append **at most 3 lines** under "Check-ins" in `BOARD.md`:
  `HH:MM <agent> | done: … | next: … | blocked/needs: …`
- Before each check-in, read the last 20 check-ins. If someone else is already doing what you're about to do, stop and message them. Reuse their work rather than repeating it.
- When you finish, change your claim to `done` and put a pointer to your report in the claim line.
- Keep `BOARD.md` edits append-only, except your own claim line. Re-read the file right before writing.

## 4. One answer per question: propose, debate, converge
Some choices shape other people's work: a library, a data shape, an API contract, a naming scheme, a UX pattern, a copy convention, a folder layout. For those:
1. **Look first.** Check `DECISIONS.md`, `packages/api` (contracts), `packages/design-tokens`, `components/ui`, `packages/content` and the ADRs. If it's decided, follow it.
2. **If it isn't decided, propose.** Add an entry to `docs/agents/DEBATES.md`: question, options, your recommendation with evidence, who is affected. Message the affected owners.
3. **Debate briefly.** Each affected agent replies in the same entry with their strongest argument, at most one round each. Agreement means `Status: Converged → <answer>`.
4. **If you still disagree,** the coordinator decides within the same run. Questions that are irreversible or about money, legal or brand go to the founder. The coordinator then records the outcome in `DECISIONS.md`.
5. **Until it converges,** code against an interface or adapter and don't ship two patterns. Divergent exploration is fine in a scratch folder, but only one pattern lands in the repo.

## 5. One source of truth per concern
| Concern | Lives in | Owned by |
|---|---|---|
| Decisions | `docs/DECISIONS.md` (with ADRs in `docs/adr/`) | Coordinator |
| Backlog | `docs/BACKLOG.md` (v1.0) and `docs/backlog/future/` (later) | PM leads, merged by the coordinator |
| API contracts and error codes | `packages/api` | Platform owner |
| Design tokens, components, motion | `packages/design-tokens`, `apps/mobile/src/components/ui`, `src/lib/motion.ts` | Design owner |
| Every user-facing word | `packages/content` (feature `copy.ts` files are temporary) | Content owner |
| Brand constants, domains, URLs | `packages/brand` | Content owner |
| Database schema and access | `supabase/migrations` (new files only, in your assigned timestamp range) and `supabase/APPLY.md` | Whoever is assigned the range |
| Pure product logic | `packages/core` | Core owner |
| Privacy and legal requirements | `docs/legal` | Legal owner |
Never copy a constant, type, colour or string into a second place. Import it.

## 6. Releases: one train, no surprise publishes
- **Agents never commit, push, deploy, publish packs or config, apply migrations, change DNS or send email to real people.**
- **Integration happens per wave.** Agents finish and the coordinator runs all checks (`npm test`, `npm run test:db`, mobile `tsc`, the Deno tests). Green means a commit on the wave branch `auto/<date>-<topic>`, then a merge to `develop`, then push.
- **`main`** changes only through a release PR from `develop`, approved by the founder. Tags are `ios-v<x.y.z>`. EAS builds come only from tagged commits.
- **Live migrations:** the founder applies them in the order given in `supabase/APPLY.md`. Every applied file is added to `.github/migrations-applied.txt`. Applied migrations are never edited.
- **Packs, remote config, content:** signed and published only via `scripts/packs/publish.ts` by the coordinator, with the founder's OK. Git history is the audit log.
- **Website (other thread):** serves `docs/ops/well-known/*` and the legal pages at the URLs in `packages/brand`. Changes to those URLs or files are coordinated on the board first.

## 7. Cross-thread coordination
- Other threads can't see this repo's working tree. The coordinator mirrors a short summary of `BOARD.md` and `DECISIONS.md` into the claude.ai Project doc `claude/Early-Letters-Coordination.md` after every wave.
- Before acting on anything shared, other threads read that doc: domains, DNS, Apple account, store listing, website, legal URLs, brand assets. They post their updates there, and the coordinator copies them into `BOARD.md`.
- If two threads need the same thing (for example store screenshots, or DNS records), the first one to claim it on the board owns it. The other one reviews it.

## 8. Repo layout rules
- New top-level folders need a decision entry. The current ones are: `apps/`, `packages/`, `supabase/`, `packs/`, `scripts/`, `experiments/`, `docs/`, `.github/`.
- Tests sit next to their workspace's `test/` folder, so the workspace's test runner picks them up.
- Scratch output, screenshots and previews go in the session scratchpad, never in the repo.
- Reports are short: files changed, test results, what needs a device, what the founder must do, requests to other owners, and facts versus assumptions.
