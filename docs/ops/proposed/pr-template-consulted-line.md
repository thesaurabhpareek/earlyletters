# Proposed: a Consulted line in the pull request template (HV2-B38)

Status: proposal for the founder. `.github/pull_request_template.md` is a founder path (`.github/**`), so this PR does not edit it. If you agree, paste the block below into the template, for example after the "What and why" section. Nothing here applies until you do.

Needs a Karma ruling first (not made, none cited): see "Karma ruling needed" in `docs/agents/exec/CONSULT-MATRIX.md`.

## Text to paste

```
## Consulted

<!-- Look up the change in docs/agents/exec/CONSULT-MATRIX.md. One line. -->

Consulted: <ROLE (ruling id), ROLE (asked, no ruling yet), or: none needed (no row of docs/agents/exec/CONSULT-MATRIX.md applies)>

This line records who was asked. It is not a sign-off. The roles are Claude roles, not counsel.
```

## Notes

- The author fills the line. It adds no step for the founder.
- A ruling id on the line must exist in `docs/agents/exec/RULINGS.md` or `docs/agents/cto/RULINGS.md`.
- It does not replace the counted review at the full 40-character head sha, the compliance fence approvals (CR-27) or a founder decision.
- No script reads the line yet. LIFECYCLE.md HV2-B38 describes a read-only report of open PRs with no Consulted line as a later step. It is not built here.
