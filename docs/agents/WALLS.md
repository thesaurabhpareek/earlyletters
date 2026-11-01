# Walls: actions a Claude session is refused, and the hand-off for each

A wall is an action the session's permission check or the session proxy refuses. Walls are permanent. Design around them; never get round them. This file is the repo copy of the walls table in the setup record (Project doc `infra/setup-record.md`, section 0a), so the harness and subagents can read it too. Source: the 1 Nov 2026 setup retrospective (`docs/reviews/2026-11-01-setup-retro.md`, walls W1 to W3, friction SC5, SC6 and SC9; backlog row RS-03).

## 1. Rules

1. **Agreements, attestations and DNS are always the founder's click,** even when a session's click would go through. On 31 Oct a session's first click on Apple's licence "Agree" was refused ("Consent Given For The User"); after a chat delegation it clicked again and the click went through. That was wrong and must not happen again: Apple's agreements are the Account Holder's to sign, and a wall that sometimes gives way makes him get asked again. The same holds for DNS: the `.app` nameserver switch and some registrar mail edits went through after a chat approval, while other DNS edits were refused.
2. **Never retry a refused wall action.** Never ask him to approve a retry in chat, and never offer "approve the retry". No chat approval changes a wall. Say so in the first message after a refusal, then send the hand-off below.
3. **Stage at most 10 minutes ahead.** Vendor sign-in pages and forms time out; pages staged hours early expired on 31 Oct and 1 Nov. Open the tab when he is ready, not before.
4. **Sign-in sweep first.** At the start of a sitting, list every site the sitting needs and have him confirm he is signed in to each, in one message, before the first step.
5. **Never read a page as text while a new secret value is showing.** That means page text, the accessibility tree or text in a screenshot. Reload the page first, so the value is gone, then check only names, status and dates. On 31 Oct a session read a new Expo token this way and it had to be revoked.
6. **Check before you ask.** Every hand-off starts with the citation line in section 3.

Getting round a wall includes: stored passwords or session cookies, relaying one-time codes, signing in to a second Google account, accepting terms or attesting, and holding a DNS-capable token. None of these is allowed.

## 2. The walls

"Refusal string" is the text the session saw. Where the retro did not record it word for word, the row says so; record the exact string here the next time it appears.

| Wall | Refusal string seen | Designed hand-off (what the session prepares, what he does) |
|---|---|---|
| Accepting terms, agreements or attestations for the founder (Apple agreements, R2 terms, Small Business Program, any "I agree" box) | "Consent Given For The User" | Open the page. Fill only fields that are not a declaration. Stop before the checkbox or button. He ticks and clicks |
| DNS edits (Cloudflare, registrar records, nameservers, DNSSEC) | "DNS / Domain / Cert Changes" | Open the zone's record form. Give the exact type, name, value and TTL. He pastes and saves. The session then reads the record back over DNS over HTTPS and records it |
| Typing, reading or relaying secrets (tokens, `.p8` keys, signing keys, passwords, one-time codes) | Not recorded word for word | He creates the secret and pastes it straight into its store (GitHub environment, EAS, password manager). The session never sees the value. Afterwards it checks names, status and dates only (rule 5) |
| Creating accounts (vendor accounts, organisations, Apple, Expo, Supabase) | Not recorded word for word | Open the sign-up page. Give the values to use (public identifiers only). He signs up |
| Security settings (two-factor, passkeys, recovery codes) | Not recorded word for word | Open the settings page. He changes it. Record his word, marked "founder's word" |
| Bulk deletes (branches, projects, records) | "Git Destructive" | Give the dry-run output and the one command to run on his Mac. Whether a single-branch delete also hits this wall is unverified |
| GitHub settings, environments and secrets through the API, and any settings save that needs his passkey (sudo mode, since his two-factor on 1 Nov) | "not permitted through this proxy" (HTTP 403), on reads as well as writes | Stage the change in his browser. He confirms with his passkey. The session reads the result back over REST where the proxy allows, or he reports what the page shows |
| Signing in to another Google account | Not recorded word for word | Do not sign in. He signs in once in his own browser; then the session reads what it needs |

## 3. The hand-off message

One action per message. Each message has these parts, in this order:

1. **Citation line:** the checks run before asking, as in the CTO skill section 3: "Checked: setup-record (S-37 open), PRs since 09:00 UTC, coordination docs." Once `npm run release:ready -- --step <S-id>` exists, quote its output instead.
2. **The tab:** already open, named by its page title and URL.
3. **The field and the value:** the exact field label and the exact value to enter or option to choose. Never a secret value.
4. **What he will see:** the result that tells him it worked (a status, a banner, a new row).
5. **The reply word:** one word he sends back, for example "done", or "stuck" with what he sees.

Example (illustrative):

> Checked: setup-record (S-<id> open), PRs since 09:00 UTC, coordination docs.
> Tab open: Cloudflare, DNS records for the `.app` zone.
> Click "Add record". Type: TXT. Name: `_dmarc`. Content: the exact value from the setup record step. TTL: Auto. Save.
> You will see the new TXT row in the list.
> Reply "done".

## 4. Where this is cited

- CTO skill: `.claude/skills/early-letters-cto/SKILL.md`, section 3.
- Hand-off emails: CR-41 in `docs/agents/cto/RULINGS.md`.
- Coordination rules: `docs/agents/COORDINATION.md`, section 6.
- Setup record section 0a (Project doc): to be pointed here by the next session that edits it.
