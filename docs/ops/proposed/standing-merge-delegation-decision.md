# Draft D-entry: standing merge delegation (for the founder to number and merge into `docs/DECISIONS.md`)

Status: draft, 20 Nov 2026. Only the founder merges `docs/DECISIONS.md` (D-125), so this text waits here. The number is his to give. The working rule is CR-70 in `docs/agents/cto/RULINGS.md`, provisional until this PR merges.

### D-??? The merge owner merges without a founder comment when the gates are met (founder, 20 Nov 2026)

- The founder said, in chat on 20 Nov 2026: "Do it for me. I can't post in 46. Make CTO do it. Automate such basic things and they shouldn't need me to add comments. Change that policy."
- He said on 10 Nov 2026: "Click ready for review for me. And change the rule that it needs me to comment."
- Decision: a PR may be merged by the merge owner without a founder comment when Review A and Review B are PASS in counted format on the exact 40-character head from different lenses, the checks `required`, `compliance-fence` and `applied migrations unchanged` are green on that head, a dry-run merge into current `develop` is clean and the merge call pins `sha=`, the PR touches none of the listed founder paths (CR-70 item 4), and a draft PR was marked ready first.
- Still his: `.github/**`, `apps/mobile/eas.json`, `docs/legal/**`, `compliance/**`, hosted migrations, user-facing promises or words that need his approval, money, accounts or keys, and `docs/DECISIONS.md`. For those the old rule stays: he names the PR and the full sha.
- Agents still do not approve or label (`karma:approved`, `approve-migration`) and do not post CCO lines. A session that holds a review file may post it as a PR comment.
- He can narrow or revoke it with one line.
- Way back: revert PR for a merge; a docs PR restoring CR-54 for the rule.
