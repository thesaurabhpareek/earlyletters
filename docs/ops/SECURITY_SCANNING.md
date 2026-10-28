# Security scanning in CI

Owner: security engineer. Workflow: `.github/workflows/security.yml` (RB-14a). Companion: [SECURITY.md](SECURITY.md) (secrets and keys).

None of these jobs is a required check. Branch protection requires only the `required` job in `ci.yml`, and `security.yml` is a separate workflow, so it cannot slow or block `ci.yml`. Making any job required is a separate founder decision (see "Before promoting a job to required").

## Triggers

- `pull_request` to `develop` and `main`.
- `push` to `develop`.
- Weekly, Mondays 05:17 UTC.

Scheduled workflows run only from the default branch, which is currently `main`. Until this file reaches `main`, the weekly run does not fire; the pull request and `develop` push triggers work from `develop`.

## What each job catches

| Job | Catches | Does not catch |
|---|---|---|
| CodeQL (JavaScript/TypeScript) | Code we wrote that is unsafe: injection, unsafe regex, path traversal, hard-coded credentials, weak randomness, prototype pollution. Results appear under Security > Code scanning. | Logic and authorisation mistakes (that is what `npm run test:db` and the red-team reviews are for), vulnerabilities in Deno Edge Functions' remote imports, SQL migrations, Markdown. |
| dependency review | On a pull request, new or changed dependencies with a known advisory of severity high or above. Fails that job only. | Advisories published after the merge (the weekly audit covers those), packages already in the lockfile that the pull request did not touch. |
| npm audit (report only) | Known advisories in production dependencies, high and above, from `package-lock.json`. Output goes to the job summary. Always exits 0. | Dev-only dependencies (`--omit=dev`), zero-days, malicious packages without an advisory. |

Pins: every `uses:` is a full 40-character commit SHA with the tag in a trailing comment. Tags were resolved with `git ls-remote --tags` and annotated tags dereferenced (`^{}`), because `gh api` was blocked for those repositories in the authoring session. Re-verify when bumping: the SHA must equal the dereferenced tag.

## Current state when this was added

On `develop` at 6bfb94a9, `npm audit --omit=dev --audit-level=high` reported 21 vulnerabilities (10 low, 7 moderate, 4 high) and a non-zero exit. So the audit job's first run will show findings. That is the reason it does not gate. Triage is a separate task; this change does not fix them.

## False positives

- CodeQL: dismiss the alert in the Security tab with reason "false positive" or "used in tests", and write one sentence of why. Do not suppress with comments in source. A dismissed alert that is wrong is a finding in its own right; the security engineer reviews dismissals weekly.
- dependency review: if the advisory does not apply to our use (for example, a vulnerable code path we never call), add it to `allow-ghsas` in the workflow with a comment naming the advisory, why it is not reachable, and a date to revisit. That edit touches `.github/workflows/` and needs the review below.
- npm audit: nothing to suppress, because it does not gate. Record "not reachable in our use" in the triage note instead.

## Who triages

- The security engineer reads the weekly run and any new CodeQL alert, and files fixes or backlog items. Dependency fixes go as one fix pull request per run.
- RLS and policy findings go to the data architect; privacy questions to the privacy agent (hand-offs in the role brief).
- Anything touching `supabase/` or auth code follows D-041 (red-team review plus the founder's `approve-migration` label).
- A high or critical finding that is reachable in our use is raised to the founder the same day.

## Cost

I believe CodeQL code scanning is free for public repositories, but I did not verify this. The GitHub Docs page "About code scanning" lists public repositories on GitHub.com as supported and says private repositories need a GitHub Code Security license, which is consistent with free on public but is not a statement of price. Dependency review likewise needs the dependency graph, which I believe is on for public repositories; unverified. Standard runners are free on public repositories (I, not verified here). If the repository ever goes private, CodeQL and dependency review will need a paid license and this workflow will fail until that is bought or the jobs are removed.

Time: CodeQL with `build-mode: none` is the longest job; budget 20 minutes (timeout), expected well under that, `not-measured`. The jobs run in parallel with `ci.yml` on separate runners.

## Before promoting a job to required

1. Two weeks of runs with no false-positive churn.
2. The 4 high `npm audit` findings are resolved or documented.
3. Founder decision recorded in `docs/DECISIONS.md`.

## Review

Changes under `.github/workflows/` need independent review before merge (D-107 and D-041). The Claude GitHub App cannot edit workflow files, so a founder or human merge is expected.
