# Agents GitHub App: identity and trust

Status, Wed 28 Oct 2026: **Off track until the founder creates the App.** No agents App exists. Every one of 763 PR comments and reviews by a person is from the founder's account, and 0 are from an agents bot (retro `EVIDENCE.md`; synthesis IMP-06). The code side is ready: trust rules, a token helper and tests (this PR, retro package H1).

The ask: create the App with the settings below (about 15 minutes), set four values, and start each instruction comment with `<!-- founder -->`. Recommended now; it is one of the four conditions before any unattended run (the others: branch protection with required checks, write connectors removed from scheduled tasks, the 5 Nov go/no-go). Nothing in this document turns an unattended run on. Do not set `AGENTS_ENABLED`.

## 1. Why

- Agents and sessions post from the founder's account, so the harness cannot tell the founder from a session. Before this change, `isFounderComment` treated any unmarked founder-account post as a founder instruction (`scripts/agents/lib.mjs:250-255` on develop 6bfb94a9). The 27 Oct post on journal #22 ("Posted by the founder's release-coordination session, on the founder's behalf") set an agent's next task that way (retro panel 01).
- `isTrusted` trusts any marker from that account, so any session can post a red-team or steward verdict (`lib.mjs:280-288`). On #51 the same head 64a2f21 carries both "ship" and "fix first" under the red-team marker (retro panel 01).
- The repository is public. Anyone can comment or open a fork PR.

## 2. Who counts as what (in force from this PR)

| Author, as GitHub reports it | Label (`trustLabel`) | Instruction? | Verdict or handoff counts? |
|---|---|---|---|
| The agents App (bot login in `AGENTS_BOT_LOGINS`, or its app id or client id on the comment), or a bot in `trusted_bots` | `agent` | No, never | Yes, as an agent |
| Founder account, first non-blank line exactly `<!-- founder -->`, typed in the GitHub web page | `founder` | Yes | Yes |
| Founder account, no founder marker (unmarked, or only a harness marker such as `<!-- red-team:... -->`) | `unverified author` | No | Yes for now, carrying the label |
| Founder account, posted through a third-party app (`performed_via_github_app` set) | `unverified author` | No | Yes for now |
| Anyone else: outsiders, fork PR authors, other bots such as `vercel[bot]`, a bot using the founder's login | `untrusted` | No | No |

Rules behind the table (`scripts/agents/lib.mjs`):
- The marker counts only as the whole first non-blank line. Quoted, later in the text, or with words on the same line, it does not count.
- A bot is never the founder, whatever its login or association. A person is never the App, whatever their login.
- Verdicts from the founder account still count, so reviews keep working while agents post as the founder. They carry "unverified author" wherever a page shows the label.
- The marker rule does not lift when the App exists. It lifts only by a founder decision once no session holds the founder's token.

Limit to know: the founder marker is typed text. Any session holding the founder's token can type it too. It stops honest mistakes such as the #22 post, not a session that sets out to pass as the founder. Only taking the founder's token away from sessions closes that. Every agent also shares one App, so the handle in a marker is declared by the agent, not proven (finding PINF-02, `docs/agents/AGENT-COMMS.md` section 5).

## 3. Permissions, least privilege per lane

The App is granted the union below. Each token the helper mints is narrowed to one lane and to this repository only (GitHub's installation token API accepts `repositories` and `permissions`, and a token can never exceed the App's own grant).

| Permission | dispatch | worker | reviewer | reader | App grant |
|---|---|---|---|---|---|
| Contents | read | write | read | read | write |
| Issues | write | write | write | read | write |
| Pull requests | read | write | write | read | write |
| Checks | read | read | read | read | read |
| Actions | read | read | none | read | read |
| Metadata | read | read | read | read | read |

- dispatch: the dispatcher writes the board issue and labels.
- worker: an agent run that pushes a branch, opens its PR and writes its journal.
- reviewer: a red-team or steward review; it cannot push.
- reader: status pages, smoke checks, the ledger.

Never granted: Administration, Workflows, Secrets, Variables, Environments, Deployments, Webhooks, Pages, Members, and any organization permission. Without Workflows and Administration an agent cannot edit `.github/workflows/` or branch protection. The source of truth is `LANES` in `scripts/agents/app-token.mjs`; a test fails if the manifest below drifts from it.

## 4. The manifest

These are the exact settings. Use them as the form values in step 1 (GitHub's manifest flow needs a web page to post from, so the form is simpler for one App).

```json
{
  "name": "earlyletters-agents",
  "url": "https://github.com/thesaurabhpareek/earlyletters",
  "description": "Agent identity for the earlyletters repository. Opens pull requests into develop; never merges.",
  "public": false,
  "hook_attributes": {
    "url": "https://github.com/thesaurabhpareek/earlyletters",
    "active": false
  },
  "default_events": [],
  "default_permissions": {
    "actions": "read",
    "checks": "read",
    "contents": "write",
    "issues": "write",
    "metadata": "read",
    "pull_requests": "write"
  },
  "request_oauth_on_install": false,
  "setup_on_update": false
}
```

If the name is taken, pick another; the bot login is then `<that-name>[bot]`.

## 5. Secrets and variables

Repository Settings, Secrets and variables, Actions.

| Name | Kind | Value | Read by |
|---|---|---|---|
| `AGENTS_APP_ID` | Variable | The App ID (a number) from the App's General page | `app-token.mjs`, `trustContext` in `lib.mjs` |
| `AGENTS_APP_CLIENT_ID` | Variable | The Client ID (starts `Iv`) from the same page | `.github/workflows/agents.yml:69,75,122,156`, `app-token.mjs` (preferred JWT issuer), `trustContext` |
| `AGENTS_APP_PRIVATE_KEY` | Secret | The whole contents of the downloaded `.pem` file | `agents.yml:157`, `app-token.mjs` |
| `AGENTS_BOT_LOGINS` | Variable | `earlyletters-agents[bot]` (your App's name plus `[bot]`) | `agents.yml:76,123`, `trustContext`; needed because PR reviews do not carry the app id (`AGENT-COMMS.md` section 5) |

`agents.yml` already reads the client id, so set both ids.

## 6. Founder steps

1. **Create the App.** github.com, your avatar, Settings, Developer settings, GitHub Apps, New GitHub App. Name and Homepage URL from the manifest. Under Webhook, clear "Active". Repository permissions exactly as `default_permissions` above; leave every other permission at "No access". "Where can this GitHub App be installed?": Only on this account. Create. Check: the General page shows an App ID and a Client ID.
2. **Make a private key.** Same page, Private keys, Generate a private key. A `.pem` file downloads. Keep it in your password manager, not in the repository or a chat. Check: one key listed.
3. **Install it on this repository only.** Install App, your account, Only select repositories, `earlyletters`. Check: the installation page lists one repository.
4. **Set the four values** in section 5. Check: three variables and one secret listed.
5. **Test the token, read only** (optional, on your Mac in the repository folder):
   `AGENTS_APP_CLIENT_ID=Iv... node scripts/agents/app-token.mjs --lane reader --require-app --key-file ~/path/to/key.pem | (read -r t; GH_TOKEN="$t" gh api repos/thesaurabhpareek/earlyletters --jq .full_name)`
   Check: it prints `thesaurabhpareek/earlyletters` and a line `agent token: agents App, lane reader`.
6. **Type the marker.** From today, start every instruction comment with `<!-- founder -->` on its own first line, in the GitHub web page. Comments without it are read as "unverified author" and do not steer agents.
7. **Do not set `AGENTS_ENABLED`.** That waits for the other three conditions above.

## 7. The token helper

`scripts/agents/app-token.mjs` gives a run its GitHub token.

- It prefers an App installation token for the named lane (`--lane dispatch|worker|reviewer|reader`), limited to this repository, valid 1 hour.
- Without the App it falls back to `GH_TOKEN`, then `GITHUB_TOKEN`, and prints a warning on stderr: the run posts as the token's owner, which the harness labels "unverified author".
- `--require-app` never falls back (exit 1). `--dry-run` prints the plan and makes no network call. `--github-env` masks the token and writes `GH_TOKEN` to `$GITHUB_ENV` in Actions.
- The key never appears in output; the token appears only on stdout.

## 8. How it fits the rest of the harness

- `dispatch.mjs` and `brief.mjs` already call `isFounderComment`, so the marker rule applies to them with no edit: founder notes in briefs, "founder commented after the last commit", "founder requested changes" and standing-duty reruns now need the marker.
- `trustLabel(comment, trust)` is the one call for any page that shows a message: the status page, `verdicts.mjs` rows, the ledger and the provenance check being built in another session (RB-13). One line each, for the integrator (A29) to wire.
- Wiring the helper into `agents.yml` is not in this PR (`.github/**` is off limits); the workflow already mints an App token with `actions/create-github-app-token`.

## 9. Not verified

- That GitHub sets `performed_via_github_app` to null for comments made in the GitHub web page and GitHub Mobile. If Mobile sets it, a marked comment from Mobile reads as "unverified author". Use the web page for instructions until checked.
- The API behaviour in sections 3 and 7 is from GitHub's docs, read 28 Oct 2026: installation tokens (docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), the JWT (`.../generating-a-json-web-token-jwt-for-a-github-app`) and manifests (docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest). The helper ran only against a fake GitHub in tests, never the real API.
- That the name `earlyletters-agents` is free on GitHub.
