# Repository About text and settings

Owner: ops. Audit date 31 Oct 2026. Every command below is **founder-run**. Session proxies block repository settings writes, and agents never change settings. Nothing here has been applied.

## Audit facts

- Description: empty. Topics: none. Homepage: `https://earlyletters.vercel.app`.
- Wiki on. All three merge methods on. Delete branch on merge off. No issue forms (added in this change).
- License is "not detected" by GitHub because `LICENSE` is custom and proprietary. That is fine. No action.

## Which website is right

`packages/brand/index.ts` sets the domain to `earlyletters.com`. It cites `docs/DECISIONS.md` D-063: `earlyletters.com` is primary and `earlyletters.app` redirects to it. So the homepage should be `https://earlyletters.com`. The `vercel.app` address is a hosting address, not the brand. Whether `earlyletters.com` is serving the site today is UNVERIFIED (no outbound check was made). Confirm it loads before you set it.

## The About text

**Description** (about 215 characters):

```
Early Letters is a baby memory book that families fill by talking. Speech is turned into text, cleaned only by small, checked, reversible edits. The words stay the family's own. iOS app, Expo and Supabase. Proprietary.
```

No marketing words, and it never says the product writes anything. It says the opposite.

**Website:** `https://earlyletters.com`

**Topics** (14, lowercase):
`ios`, `expo`, `react-native`, `typescript`, `supabase`, `speech-to-text`, `voice`, `journaling`, `parenting`, `privacy`, `offline-first`, `monorepo`, `expo-router`, `postgres`

Drop `offline-first` if the app is not strictly that. UNVERIFIED against the architecture doc.

## Commands (founder-run)

Run in a terminal where `gh auth status` shows your own login. Replace nothing; the repo is fixed.

1. **Set description, homepage and topics** (founder-run):
```bash
gh repo edit thesaurabhpareek/earlyletters \
  --description "Early Letters is a baby memory book that families fill by talking. Speech is turned into text, cleaned only by small, checked, reversible edits. The words stay the family's own. iOS app, Expo and Supabase. Proprietary." \
  --homepage "https://earlyletters.com" \
  --add-topic ios,expo,react-native,typescript,supabase,speech-to-text,voice,journaling,parenting,privacy,offline-first,monorepo,expo-router,postgres
```

2. **Enable private vulnerability reporting** (founder-run):
```bash
gh api -X PUT repos/thesaurabhpareek/earlyletters/private-vulnerability-reporting
```
Check: `gh api repos/thesaurabhpareek/earlyletters/private-vulnerability-reporting` should return `{"enabled":true}`.

3. **Turn off the wiki and the Projects tab, if unused** (founder-run). Docs live in `docs/`, so the wiki would be a second, unreviewed home. This turns off the repository Projects tab only. A user-level Projects board (see `docs/github/PROJECTS.md`) still works and can be linked.
```bash
gh repo edit thesaurabhpareek/earlyletters --enable-wiki=false --enable-projects=false
```

4. **Merge settings per ruling CR-6** (founder-run). Squash for normal PRs, rebase off, delete branch on merge:
```bash
gh repo edit thesaurabhpareek/earlyletters \
  --enable-squash-merge=true \
  --enable-rebase-merge=false \
  --delete-branch-on-merge=true
```

5. **Squash commit message = PR title and body** (founder-run). CR-6 says the squash subject becomes the PR title and the body keeps the commit messages, so trailers survive:
```bash
gh api -X PATCH repos/thesaurabhpareek/earlyletters \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=COMMIT_MESSAGES
```

6. **Merge commits stay on, for lineage PRs only** (no command). GitHub cannot allow merge commits for some PRs and not others. Leave `--enable-merge-commit` on, and keep the rule in writing: merge commits only for `develop` into `main` and `main` back into `develop`. If you want it enforced, that needs a branch ruleset on `develop` (squash only) with `main` left open. Not scripted here. UNVERIFIED that rulesets are available on your plan.

7. **Verify** (read-only, safe for anyone):
```bash
gh api repos/thesaurabhpareek/earlyletters --jq '{description,homepage,topics,has_wiki,has_projects,allow_squash_merge,allow_merge_commit,allow_rebase_merge,delete_branch_on_merge}'
```

Founder-run commands: 5 that write (items 1 to 5) and 1 read-only check (item 7). Item 6 has no command.

Order matters for one thing: turn on private vulnerability reporting (2) before `SECURITY.md` from PR #35 is merged, so its "if enabled" line is true.

## Review of open PRs #35, #315

Recommendations only. Read from `pull/35/head` and `pull/315/head` on 31 Oct 2026. Neither PR was edited.

### #35, SECURITY.md

- **Private route.** The page names `hello@earlyletters.com` and, "if enabled", GitHub private reporting. Reporting is not enabled today (audit). Enable it (command 2), then drop the "if" so there is one clear route.
- **Mailbox.** The page says only `hello@` is verified. `packages/brand` agrees (`supportEmail`). Fine for now. But `hello@` is also the support inbox, so vulnerability mail mixes with app support. Moving to a `security@` address later is sensible.
- **Internal note in a public file.** The "Founder setup note" block is an internal TODO. Remove it before merge, and keep it in `docs/ops/`.
- **Scope names `earlyletters.app`.** True per D-063 (it redirects), but a redirect has nothing to test. Say "earlyletters.com (and its redirect)".
- **Privacy rule.** Good: it tells reporters to stop and not keep a copy if they reach real family data. Add: do not paste family data, letters or child names into the report itself.
- **Link target.** The issue-form `config.yml` points to `SECURITY.md` on `develop`. Once #35 merges, confirm the path resolves. Before it merges, that link is a 404.
- **Community standards.** GitHub also looks for a code of conduct, contributing guide and license. The license is custom and will show as not detected. A short `CONTRIBUTING.md` that says "issues are intake only, see ADR 0011" is optional.

### #315, pull request template

- **Privacy and constitution checks: present.** `verifyEdits`, no rewriting, `ENGINE_VERSION`, no text or child name in analytics or logs, "Asha" only, `packages/brand` only for the name, new migration only. Good.
- **Missing: "never imply AI writes anything".** It is in CLAUDE.md content rules and not in the checklist. Add one line.
- **Missing: celebrate what exists, no streaks, points or badges.** Same source. A single content-rules line would cover both.
- **Title types do not match.** The template lists `feat fix perf refactor test docs chore`. CLAUDE.md and CR-6 context also use `qa`, `exp`, `ci`, `revert`. Align one way. Related: no `type:qa` and similar labels exist (see `PROJECTS.md`).
- **Labels.** It does not remind the author to set `risk:` and `area:` labels, though the risk section depends on them. Agent PRs also need `agent:<handle>`.
- **Approval.** `supabase/` changes need `approve-migration` (D-041). Review notes mention D-041, but there is no checkbox for it.
- **Public repo.** The screenshot comment says use Asha fixtures, which is right. Add "no real letters, names or voices in screenshots or logs" to the first section too, since logs and pasted output are a bigger leak risk than screenshots.
- **Length.** Ten-plus sections is heavy for a one-person repo. Fine for agents, which fill it mechanically. Founder PRs may skip the sections that say N/A.
- **Merge note.** With CR-6 the PR title becomes the commit subject. The template already says to keep titles short. No change.
