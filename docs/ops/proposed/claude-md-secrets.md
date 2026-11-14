# Proposed CLAUDE.md text: credential hygiene

Status: proposed, not adopted. Backlog HV2-B15, requirement HV2-020, source: harness v2 security model section 4 (PR #551, SM-1 and SM-2). Written by an agent; the founder adopts it by pasting it into `CLAUDE.md`. This file does not edit `CLAUDE.md`.

Why: on 1 Nov 2026 a Claude session read an Expo token page as text while a new value was showing (revoked; recorded in the retrospective evidence digest). Push protection and secret scanning catch committed values, not viewed pages, so this rule lives in prose and only a person can enforce it.

## Where to put it

In `CLAUDE.md`, as a new section after "Privacy rules" and before "Agents". Paste the block below unchanged.

## The text

```markdown
## Secrets
- Never open, read, screenshot or summarize a page or file that shows a secret value: token pages, API key pages, `.env` files, password managers. If one opens by accident, say so, stop, and treat the value as exposed.
- Never type a secret into chat, a file, a PR or an issue. The founder pastes secrets straight into the store.
- Release credentials live only as secrets of the `testflight` and `app-store` GitHub Environments, with the founder as required reviewer. No repository-level secret holds one.
- Rotation, in order: revoke the old value in the vendor console, create the new one, paste it into the Environment secret, run one build to confirm, record the date and name (never the value) in `docs/ops/SECRETS.md`.
- Exposure means revoke first, rotate second, investigate third (SEC-R05).
```

## Before you adopt it (founder checks)

1. The Environments exist and each has you as required reviewer (SM-2). Agents cannot read this: the API refused the retrospective session. Check in Settings, Environments. Status: unverified.
2. No release credential sits in repository-level secrets (Settings, Secrets and variables, Actions). Names only; do not open values.
3. `docs/ops/SECRETS.md` does not exist on develop (checked 1 Nov 2026 against 60136e51). The rotation step names it, so either create it as a dated log of secret names and rotation dates (no values) or change the line to point at the file you prefer. Creating it is a separate change.
4. The environment names `testflight` and `app-store` come from the security model; confirm they match what the release workflow uses before adopting.

## Enforcement and limits

| Clause | Enforced by | Status |
|---|---|---|
| No secret committed | GitHub secret scanning and push protection; gitleaks job (SEC-R03) | scanning on per the retrospective (unverified); gitleaks pending PR #30 |
| Release secrets only in reviewed Environments | Environment required reviewer | founder reads Settings; not machine-checkable by agents |
| Never view or paste a secret | Nothing; prose only | not yet, and cannot be automated |
| Rotation log | `docs/ops/SECRETS.md` | file absent on develop |

Limit: all sessions post as the founder (CR-20), so no control here can tell a careful session from a careless one. The rule helps only if each session reads it.

Conflict of interest: the author is an agent bound by this text, and it has had no independent review.
