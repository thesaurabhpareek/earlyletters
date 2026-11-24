# Proposal: the founder-marker rule in claude.yml and compliance-fence.yml (BL-1538)

Status: proposal, 24 Nov 2026. This pull request changes nothing under `.github/`. The Claude GitHub App cannot write `.github/workflows/`, so the founder applies it by hand (`docs/release/FOUNDER_QUEUE.md`, row C3). Ruling: Karma, T2 under CR-176; no trust rule is loosened.

## Why

Since BL-1529 (#1470) the harness reads a comment as the founder's instruction only when the account is his, no GitHub App posted it, and its first non-blank line is exactly `<!-- founder -->` (`isFounderComment`, `hasFounderMarker` in `scripts/agents/lib.mjs`). Two workflows still decide on the account alone, and sessions and agents post from that account. A marker does not prove who typed it; it stops an agent that did not mean to speak as him. Same limit as the founder-marker bullet of `docs/agents/OPERATING_MODEL.md`.

## Change 1: `.github/workflows/claude.yml`, the `if:` at lines 40 to 42

Add one more clause to each of the two branches: the first non-blank line of the body is the marker.

```yaml
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude') && github.event.comment.author_association == 'OWNER' && github.event.comment.performed_via_github_app == null && startsWith(github.event.comment.body, '<!-- founder -->')) ||
      (github.event_name == 'issues' && contains(format('{0} {1}', github.event.issue.title, github.event.issue.body), '@claude') && github.event.issue.author_association == 'OWNER' && github.event.issue.performed_via_github_app == null && startsWith(github.event.issue.body, '<!-- founder -->'))
```

An `if: expression cannot skip blank lines, so this is stricter than the harness (marker at byte 0, not first non-blank line). Stricter is the safe side for a job that holds write tokens and the Anthropic secrets. Cost: a founder comment that starts with a blank line no longer starts the job; he retypes it.

## Change 2: `.github/workflows/compliance-fence.yml`, the comments step (about line 83)

Approvals count only from the owner's login (`trustedLogins: [$owner]`). Add the marker to what counts as an approval comment by filtering when the file is built, so `compliance/fence/fence.mjs` and its tests stay unchanged:

```bash
gh api --paginate "repos/$REPO/issues/$PR/comments" \
  --jq '[.[] | select(.body | test("^[ \\t]*(\\r?\\n[ \\t]*)*<!-- founder -->[ \\t]*(\\r?\\n|$)")) | {body, login: .user.login}]' \
  | jq -s 'add // []' > "$dir/comments.json" || fail "could not read comments; failing closed"
```

Effect to decide before applying: Karma's approval comments (`CCO approval for <sha>` lines) are posted from the founder's account without the marker today, so after this edit each such comment must carry `<!-- founder -->` as its first non-blank line or the fence reads no approval and fails closed. If Karma does not want that, apply Change 1 only; the fence note (line 19) already says the approval proves the procedure ran, not who ran it.

## Dry run (no workflow needed)

Marker rule, same expression the jq filter uses, from any shell with `jq`:

```bash
for b in '<!-- founder -->\nApproved' '\n  <!-- founder -->\nApproved' 'Approved' '<!-- agent:karma -->\n<!-- founder -->' '<!-- founder --> but more'; do
  printf '%b' "$b" | jq -Rs 'test("^[ \\t]*(\\r?\\n[ \\t]*)*<!-- founder -->[ \\t]*(\\r?\\n|$)")'
done
```

Expected: `true`, `true`, `false`, `false`, `false`. The harness reads the same body with `hasFounderMarker`; the `isTrusted` type and app gap (`lib.mjs`) is a separate follow-up that waits for #1919.

## Undo

Revert the one commit that applies the edit.
