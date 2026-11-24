# Proposal: the founder-marker rule in claude.yml (BL-1538)

Status: proposal, 24 Nov 2026. This pull request changes nothing under `.github/`. The Claude GitHub App cannot write `.github/workflows/`, so the founder applies it by hand (`docs/release/FOUNDER_QUEUE.md`, row C3). Ruling: Karma, T2 under CR-176; no trust rule is loosened.

## Why

Since BL-1529 (#1470) the harness reads a comment as the founder's instruction only when the account is his, no GitHub App posted it, and its first non-blank line is exactly `<!-- founder -->` (`isFounderComment`, `hasFounderMarker` in `scripts/agents/lib.mjs`). `claude.yml` still decides on the account alone, and sessions and agents post from that account. A marker does not prove who typed it; it stops an agent that did not mean to speak as him. Same limit as the founder-marker bullet of `docs/agents/OPERATING_MODEL.md`.

## Change 1: `.github/workflows/claude.yml`, the `if:` at lines 40 to 42

Add one more clause to each of the two branches: the first non-blank line of the body is the marker.

```yaml
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.author_association == 'OWNER' && github.event.comment.performed_via_github_app == null && startsWith(github.event.comment.body, '<!-- founder -->')) ||
      (github.event_name == 'issues' && contains(format('{0} {1}', github.event.issue.title, github.event.issue.body), '@claude') && github.event.issue.author_association == 'OWNER' && github.event.issue.performed_via_github_app == null && startsWith(github.event.issue.body, '<!-- founder -->'))
```

An `if:` expression cannot skip blank lines, so this is stricter than the harness (marker at byte 0, not first non-blank line). Stricter is the safe side for a job that holds write tokens and the Anthropic secrets. Cost: a founder comment that starts with a blank line no longer starts the job; he retypes it.

## Considered and rejected: the marker in `compliance-fence.yml`

A second edit would have made the fence read an approval comment only when `<!-- founder -->` is its first non-blank line. Karma ruled it out (T2, CR-176). Every approval comment would fail closed unless it carried the marker, which breaks the approval flow, and it adds no security while sessions and agents share the founder login: the fence already reads approvals only from the repository owner's login and binds each to the head sha. `compliance-fence.yml` and `compliance/fence/fence.mjs` stay as they are.

## Dry run (no workflow needed)

The marker test, as a regex that skips leading blank lines like the harness does, from any shell with `jq` (the workflow itself is stricter: byte 0):

```bash
for b in '<!-- founder -->\nApproved' '\n  <!-- founder -->\nApproved' 'Approved' '<!-- agent:karma -->\n<!-- founder -->' '<!-- founder --> but more'; do
  printf '%b' "$b" | jq -Rs 'test("^[ \\t]*(\\r?\\n[ \\t]*)*<!-- founder -->[ \\t]*(\\r?\\n|$)")'
done
```

Expected: `true`, `true`, `false`, `false`, `false`. In the workflow, only the first sample matches. The harness reads the same body with `hasFounderMarker`; the `isTrusted` type and app gap (`lib.mjs`) is a separate follow-up that waits for #1919.

## Undo

Revert the one commit that applies the edit.
