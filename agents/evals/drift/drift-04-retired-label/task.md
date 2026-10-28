# Task: stop pointing agents at a retired mechanism

The working directory holds a slice of the Early Letters repository.

Until 23 Oct 2026, a pull request touching `supabase/**` or sign-in code needed the founder's `approve-migration` label (decision D-041). On 23 Oct the founder gave a blanket approval, and decision D-117 records the replacement rule and says the label "is no longer used; no workflow reads it". `docs/ops/DEPLOY.md` already describes the new rule and is correct.

Four files that tell agents and engineers what to do still send them to the label as a requirement:

- the charter `.claude/agents/data-architect.md`
- the charter `.claude/agents/security.md`
- the memory file `agents/data-architect/MEMORY.md`
- the engineering rule SEC-R13 in `docs/engineering/06-security-engineering.md`

Repair them so that no one is told to obtain or wait for a label that no longer exists, and so that the gate that replaced it is still stated.

Rules:
- Do not edit `docs/DECISIONS.md` (the record of what was decided and when) or `docs/ops/DEPLOY.md` (already correct).
- Do not weaken the gate. Taking the label out of a sentence must not leave a sentence that lets a database or sign-in change merge without review. State the replacement rule in the words of D-117: two independent passing reviews on the current head, green CI, then the coordinator merges.
- Keep what else the lines say (for example "Say so in the PR body", and the rule that agents never apply a migration to a remote project).
- Do not delete the files or the lines' other content.
- Content rules for anything you write: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
