# Harness v2 security model (1 Nov 2026)

Author: security-architect. Covers gaps G7, G8, G11. Sources read on the worktree (develop at 60136e51 plus RETROSPECTIVE.md), PR #342 head, `.github/CODEOWNERS`, `.github/workflows/*.yml`. U = unverified.

## 1. Requirements
- SM-1 No secret value in git, a message, a screenshot or a model prompt. Test: secret scanning plus push protection (on, V per retrospective) and a gitleaks job (SEC-R03, pending PR #30).
- SM-2 Release secrets exist only as secrets of the `testflight` and `app-store` environments, each with a required reviewer; no repo-level secret holds a release credential. Test: `gh api repos/{o}/{r}/environments` shows reviewers (founder, the API refused the retrospective session; U).
- SM-3 No unattended model step holds a write-capable token and a provider key together. Test: a lint over `agents.yml` that fails if one step has both `GH_TOKEN` and `OPENROUTER_API_KEY` in `env`.
- SM-4 Every third-party `uses:` is a 40-hex SHA with a version comment (SEC-R10). Test: grep lint in section 5.
- SM-5 No `pull_request_target` workflow checks out PR head or runs PR code (SEC-R11). Test: section 6.
- SM-6 Any claim that a review is independent names its identity limit. Counted reviews are a consistency gate, not a boundary (CR-32).
- SM-7 Merges to `develop` need a human click until a second identity exists (CR-20). Test: the permission classifier (outside the repo, not versioned) plus G1's sha-bound check.
- SM-8 Untrusted text (issues, PR bodies, comments, web pages) is data in every lane. Test: lane prompts contain the SEC-R21 sentence; `claude.yml` actor gate (`claude.yml:12-45`, machine).
- SM-9 Scheduled tasks hold only the connectors they use, and none with production write (SEC-R19).

## 2. Trust boundaries
Honest note: the founder and every Claude session post as `thesaurabhpareek` (CR-20). GitHub cannot tell them apart, so identity-based controls (CODEOWNERS, required approval, review authorship) bind nothing among them.

| Actor | Posts as | Can do | What stops them | STRIDE |
|---|---|---|---|---|
| Founder | thesaurabhpareek | Everything: settings, secrets, merge | Own care; environment reviewer on release (machine) | E, R |
| Interactive session | thesaurabhpareek | Open PRs, merge, comment as founder, read any attached connector | Required checks (machine); classifier blocks self-approval and merge without review (machine, unversioned); rest is prose | S, T, E |
| Scheduled task | founder connectors | Reads public text, may write via connectors | Lanes off since 28 Oct; connector trim (not done; section 3) | T, I, E |
| Actions agent lane | App token | Contents, PR, issue write | `disabled_manually`; deny list is a tripwire (CR-30); H15 not done | E, I |
| Bot (Dependabot, Copilot, Vercel) | own bot login | Open PRs, comment | Same required checks; Copilot review is comments only | T |
| Public commenter or fork PR | own login | Issues, comments, fork PRs | `claude.yml` needs OWNER and a non-app actor (machine); fork PRs get no secrets (GitHub default); injected text reaching a session is prose-only | S, T, D |


## 3. Preconditions before any unattended model lane
All must hold; the founder ticks each with the check shown.
- [ ] H15 job split merged: the model job has no token and no key; a second job applies output. Verify: SM-3 lint green on the merged file.
- [ ] Secrets withheld from the model step. Verify: run the workflow with a canary `env` listing and confirm the model step prints no `*_KEY` or `*_TOKEN` name.
- [ ] Journal issues locked. Verify: `gh issue list --label journal --json locked` all true (label name U).
- [ ] Branch protection on `develop` and `main` with the three required checks. Verify: `gh api repos/{o}/{r}/branches/develop/protection` (settings reads were refused once; U, check in browser).
- [ ] Review gate (G1) required and sha-bound. Verify: open a PR with one PASS on a stale sha; merge button stays blocked.
- [ ] Scheduled tasks trimmed to named connectors; no Supabase, Vercel, Gmail, Resend or PayPal write. Verify: founder reads the task config (not visible to agents; U).
- [ ] `agents.yml` actions pinned by SHA (it still names `claude-code-action@v1` per SEC-R10; U on current state).
- [ ] Spend cap named by the founder if any provider key is set (CR-5).

## 4. Credential hygiene, text for CLAUDE.md (founder to adopt)
> **Secrets.** Never open, read, screenshot or summarize a page or file that shows a secret value: token pages, API key pages, `.env` files, password managers. If one opens by accident, say so, stop, and treat the value as exposed. Never type a secret into chat, a file, a PR or an issue. The founder pastes secrets straight into the store. Release credentials live only as secrets of the `testflight` and `app-store` GitHub Environments, with the founder as required reviewer; no repository-level secret holds one. Rotation, in order: revoke the old value in the vendor console, create the new one, paste it into the Environment secret, run one build to confirm, record the date and name (never the value) in `docs/ops/SECRETS.md`. Exposure means revoke first, rotate second, investigate third (SEC-R05).

Limit: push protection and gitleaks catch committed values, not viewed pages; this stays prose.

## 5. Supply chain proposals (files go under `docs/ops/proposed/`; the founder applies)
- `dependabot.yml`: ecosystems `github-actions` and `npm`, directory `/`, schedule weekly, one `groups` block per ecosystem (Expo and React Native packages grouped together), open-pull-requests-limit 5. Ready to apply as `.github/dependabot.yml`; SEC-R09 says it is pending PR #30, check overlap first.
- SHA-pin the 17 tag-pinned lines. Method: `npx pinact run` (or Dependabot on first run), review the diff, keep `# vX.Y.Z` comment. Lines on develop:
  - `ci.yml`: 31, 32, 38, 55, 70, 81, 92
  - `migration-guard.yml`: 20, 23
  - `web-e2e.yml`: 43, 45, 50, 61, 77
  - `web.yml`: 52, 54, 61
- `npm audit --omit=dev --audit-level=high` job with a dated ignore list (SEC-R08 design from PR #30); read-only token, no secrets.
- Enable Dependabot security updates (Settings, Code security; currently off, V). Free.
- Order: settings toggle first, `dependabot.yml`, then audit job, then pins (largest diff).

## 6. `pull_request_target` lint
Only `compliance-fence.yml:27` uses it today (grep). Test (Node, runs in `npm test`): for each workflow containing `pull_request_target`, fail if any `actions/checkout` step has a `ref:` containing `head`, `github.event.pull_request.head`, or `refs/pull`, or any `run:` interpolates `github.event.pull_request.title|body|head.ref` outside `env:`. Plant a failing fixture beside it, as the kill harness does. Owner: security writes, delivery agent lands it. Not yet.

## 7. CODEOWNERS
Covers: constitution files (`verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts`, `CLAUDE.md`), `plan.ts`, content, brand, analytics, migrations, DB tests, `agents/`, `.claude/`, `scripts/agents/`, `docs/agents/`, `compliance/`, `.github/`. All map to one account, so it enforces nothing among sessions (CR-27). Gaps: `packages/core/src/verify.test.ts`-style guard tests (path U; check `packages/core/test/`), the seam guard, the hashed real-family guard and the content-rules test (`packages/content/test/rules.test.ts` is under `/packages/content/` only by luck of the prefix), `scripts/status/`, `scripts/founder/`, `docs/release/`, `docs/security/`, `docs/engineering/`, `packages/api/src/keys.ts`, `apps/mobile/app.config.ts`, `eas.json`, `package-lock.json`. Proposal: add these lines now; they cost nothing and become real once a second identity exists.

## 8. Alignment with PR #342
Keep: tooling surfaces T1..T10, the assets list, section 4 "do first", section 5 unverified controls and the "keep true" section. Add: (a) a status column per mitigation using machine, prose, not yet; (b) T2/T3 restated with CR-20, CR-30..33, which post-date it; (c) T9 and T10 refreshed (protection now exists; default branch is `develop`); (d) SM-1..SM-9 as the test list; (e) the 31 Oct protection state (it still says unprotected). PR #342 changes docs only and sits outside the freeze; review and merge it first.

## 9. Cost, failure modes, rollout
Cost: zero. Dependabot, secret scanning, environments, Actions minutes on a public repo are free (macOS minutes U, G10).
Failure modes: Dependabot PR flood (grouping, limit 5); lint false positives (fixture tests); approval fatigue on environments; the identity limit stands until CR-24's probe.
Rollout, honoring CR-22 (`.github/**` is founder-applied): before 9 Nov, only no-freeze items: review and merge #342, enable security updates (one toggle), adopt the section 4 text, check environment reviewers. After go/no-go: dependabot.yml, audit job, pins, CODEOWNERS lines, the lint, then G1. Lanes stay off until section 3 is fully ticked; the machine-account decision waits for the 10 Nov probe.

Conflicts of interest: I am one of the agents I constrain, I run as the founder identity, and I co-own the threat-model and rules I cite; this model has had no independent review.
