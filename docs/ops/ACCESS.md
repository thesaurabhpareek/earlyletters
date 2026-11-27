# Who can see what

One page for the question "who can see a family's words, and what stops anyone else". It names roles, never people, and holds no secret, password, recovery code or key. Owner: `ops`, with `privacy` and `security-architect`. Written 24 Nov 2026 for BL-1330 (FR-BKO-01, FR-BKO-21). Source of truth for the requirements: `docs/product/prd/functions/back-office.md` sections 3 and 4. Nothing here changes a promise in the Privacy Policy; any change to that wording goes through the exec-team review and counsel before it publishes (D-172).

No staff tool shows entry text, audio, pictures or child names.

That sentence is true of every tool we have built, because there is no staff tool that shows a family's content: the ops scripts return counts, states and check names only. It is not a wall. The Supabase dashboard, signed in as the founder, can read any table, so the rule is kept by the founder's discipline and the runbooks, and the last column of the matrix says so.

## Who holds production access today

The list a test reads (`packages/content/test/access-page.test.ts`). One role per line. Today it holds one role, which is what Privacy Policy section 3, "Who can see your letters", says ("Today only the founder has that access"). Adding a line here before that sentence changes, and before counsel has read the new one, fails the test (FR-BKO-01, FR-BKO-18, Q-BKO-3).

- founder

## The matrix

Classes are from `docs/legal/DATA_CLASSIFICATION.md`. "A future second person" is a role with no holder; nobody is in it, and nobody is added before the policy sentence above changes (FR-BKO-18).

| Data (class) | Parent | Founder | Agents (any role) | A future second person | Enforced by tech today |
|---|---|---|---|---|---|
| Letter words, From name, photo words, Find index, typed days (L4) | Own, and the other parent's non-private letters | Never, except when the parent asks for help, to deal with a security problem or misuse, or when the law requires (Privacy Policy section 3, "Us"). The support rule is stricter: never | Never | Never | No. The dashboard role can read them. The rule is procedural |
| Child name and dates (L4) | Yes | Never in a ticket, log or message | Never | Never | No |
| Recordings, pictures, seals, safety tiers | Phone only (or backup, if turned on) | Not on our servers while backup is off | n/a | n/a | Yes, by design: they never leave the phone |
| Sign-in email, person id, book id (L3) | Own | On screen in the dashboard during a runbook step only; never pasted into a ticket or chat | Never | Only if a role is defined | No |
| Counts, states, consent record, deletion status, plan state from Apple | Own | Yes, through the support summary (FR-BKO-02) once built; today through the ops scripts | Aggregates only | By role | Partly (the `ops` schema is not in the Data API) |
| Audit log rows | No | Yes | No | Read-only if a role is defined | Yes (append-only trigger; service role only) |
| The mailbox (L4 by rule) | n/a | Yes, alone | Never (FR-POL-12) | Only on the founder's decision, and only after the policy sentence changes (FR-BKO-18) | No |
| Secrets, signing keys, service role | No | Yes | Never (FR-BKO-21, below) | Sealed recovery only (FR-BKO-18) | Partly (Environment secrets with reviewers, the secret scan, the agent-environment scan) |

## Consoles

Every console account has two-factor sign-in (a security key or an authenticator app, never SMS where avoidable), recovery codes stored offline, and only the founder as a member (`docs/ops/SECURITY.md` section 3). Recovery is the founder's alone; a second person gets the sealed kit of FR-BKO-18 only once one is named, and not before the policy sentence changes. The recovery path below is the route this repo records; the vendors' own recovery steps were not read for this page (UNVERIFIED), and each is checked when its recovery codes are next rotated.

| Console | Owner | What it can reach | Recovery path |
|---|---|---|---|
| Apple Developer and App Store Connect | founder | Builds, store listing, TestFlight testers, sales reports | Apple Account two-factor recovery on the founder's trusted devices; recovery codes offline |
| Supabase (organization MFA enforcement on) | founder | Every table, including letter text; Edge Function secrets | Organization MFA; recovery codes offline |
| Vercel | founder | The website and its deploys | Two-factor; recovery codes offline |
| Porkbun | founder | The domain and its DNS, so mail and the site | Two-factor; recovery codes offline |
| Resend | founder | Sending from the domain; delivery logs | Two-factor; recovery codes offline |
| PostHog | founder | Opt-in analytics events (no letter text, by the allowlist) | Two-factor; recovery codes offline |
| GitHub | founder | The repository, Actions and Environment secrets | Two-factor; recovery codes offline |
| Expo | founder | EAS builds and the `EXPO_TOKEN` | Two-factor; recovery codes offline |
| Google Cloud (Google sign-in) | founder | Google sign-in client settings | Google Account recovery; recovery codes offline |
| Password manager | founder | Every credential above, the signing keys, the backup key | The manager's own emergency kit, offline; never in a repo, an Actions secret or an agent environment |

## Agents hold no production power (FR-BKO-21)

The rule, written once:

1. The Supabase service role key, the pack and config signing keys, the backup key and the password manager are never in an agent environment, and never in an Actions secret an agent job can read.
2. An agent job (`.github/workflows/agents.yml`, `.github/workflows/claude.yml`, or any job that runs Claude Code, its agent SDK or OpenCode) names no environment and may read only the model and identity secrets it needs: `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENROUTER_API_KEY`, `AGENTS_APP_PRIVATE_KEY`. It never uses `secrets: inherit`, `toJSON(secrets)`, `secrets.*` or a computed `secrets[...]`.
3. Any other job that reads a production-power secret (a name holding `SERVICE_ROLE`, `SERVICE_KEY`, `SECRET`, `SIGNING`, `PRIVATE_KEY`, `BACKUP`, `ESCROW`, `KEK`, `PASSWORD`, `ACCESS_TOKEN`, `DB_URL`, `VERCEL_TOKEN`, `PROD` as a word, `PRODUCTION`, or `1PASSWORD`, `OP_SERVICE_ACCOUNT`, `OP_CONNECT`, `BITWARDEN`, `LASTPASS`, `DASHLANE`, `KEEPER` or `VAULT`, in any case) names an `environment:` with a literal name. The scan proves only that a name is there: `secrets.X` still falls back to a repository secret of the same name, and a name GitHub has not seen before creates an environment with no protection. So a production secret is set only as an Environment secret, and each such environment has required reviewers and deployment branches limited to `main` or `develop`. A production secret read in a workflow-level `env:` reaches every job, so it fails even where a job names an environment. The scan cannot read environment or secret settings, so that part is procedure.
4. A session that does support, operations or data-request work has no mail, Supabase or Vercel connector attached. The data-requests runbook says this for request steps (section 0); it holds for every back-office step.
5. Where an agent needs to know a state (a switch, a count), the founder pastes a content-free number into an issue.

What enforces it: `scripts/ops/lib/agent-env.ts`, tested by `scripts/ops/test/agent-env.test.ts` in `npm run test:functions` (CI), parses every workflow under `.github/workflows/` with the `yaml` package and fails on rules 1 to 3; run it by hand with `node scripts/ops/agent-env-scan.ts`. It reads the parsed document, not lines, so anchors and aliases count in every job that uses them, and a multi-line quoted value stays one value. A `%YAML` directive (which changes the schema), a merge key (`<<`, which GitHub does not support), a value the walk cannot read as plain data (`!!omap`, `!!set`) and a recursive alias fail as unparsed, so nothing the parser returns is skipped. A job runs an agent when its text names Anthropic's actions or packages, the native installer, OpenCode, or `claude` as a word after a space, quote, slash, bracket or shell operator (behind `sudo`, `timeout`, a path or a quote, or even in an echo), or calls `agents.yml` or `claude.yml` as a reusable workflow; an agent named in workflow-level `defaults` (a `defaults.run.shell`) or `env` makes every job in that workflow an agent job, so a false alarm costs an edit and a miss is less likely. The workflow's `name`, `run-name` and `on` filters are never run, so a `CLAUDE.md` path filter does not count. It finds reads inside `${{ }}` in every string, a `prompt: |` block included, ends an expression at `}}` outside a quoted string as GitHub does, and matches names in any case. `secrets:` that is not a mapping of names (such as `inherit`), `toJSON(secrets)`, `secrets.*` or a computed `secrets[...]` fails in any workflow. An empty, null or computed environment counts as none. A workflow that does not parse cleanly (duplicate keys, bad indentation, an unclosed quote) or has no `jobs:` mapping fails as unparsed. The value scan, `scripts/packs/secret-scan.mjs`, reads every tracked file with no path exemption, so every script and runbook under `scripts/ops/` and `docs/ops/` is covered, and runs in `npm test` on every pull request. Rule 4 and rule 5 are procedure; nothing in the repo can see which connectors a session has.

What the scan cannot see: an agent engine run from a composite, local or other action, from a script file the job runs, from a container image or runner with Claude Code already installed and called by another name, or an engine other than Claude Code and OpenCode, is not recognised as an agent job (agent detection is a text pattern, and deliberate disguise gets past it); a reusable workflow a job calls is not followed (its own file is scanned on its own); where the `yaml` package and GitHub would read the same text differently, the scan goes by the `yaml` package; data passed between jobs through outputs or artifacts is not followed; a command passed in from a repository variable (`${{ vars.X }}`) or a workflow input is not seen, since only its name is in the file; a production secret with a harmless name is not caught in a non-agent job. Beyond the workflow text, which secrets are set at repository level in GitHub's settings (the proxy refuses that API), and what a person types into a console. A repository-level secret that no workflow names cannot reach a job, so the scan reads the names the workflows use.

## When this page changes

- A new console, a new secret class or a new role: change this page in the same pull request.
- A second person: change the Privacy Policy sentence first, with counsel, then add the role to "Who holds production access today" (FR-BKO-18).
