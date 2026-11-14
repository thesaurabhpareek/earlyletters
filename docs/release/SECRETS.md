# Secrets: rules for sessions, people and CI

Owner: security engineer. Source: the CR-47 rulings (1 Nov 2026) and the release-setup retrospective that followed the first alpha build. The setup record (claude.ai Project doc `infra/setup-record.md`, entry 0a) holds the lesson.

## What happened

After the first alpha build on 1 Nov, the retrospective found two problems:
1. Secrets had been pasted into a chat.
2. Two App Store Connect API keys existed: an App Manager key and an Admin-role key that Expo had created during `eas submit` (its name starts with "[Expo] EAS Submit"). Admin is more than the build needs.

This page turns those findings into rules. No value of any key appears here, and none may be added.

## Rules

### 1. Never ask for a secret
A session (human or AI) never asks anyone to paste a secret: no token, key, `.p8` contents, password, recovery code or service key. If a step needs one, the person sets it themselves, in their own terminal or in the vendor dashboard. For shell use, `read -rs NAME && export NAME` keeps it out of history (as `docs/release/TESTFLIGHT.md` shows).

### 2. A secret that appears anywhere is burned
If a secret shows up in chat, a log, page text, a screenshot, a PR, a commit or a build output, treat it as public:
- Say so at once, without repeating the value.
- Queue a revoke or rotate item for the founder in `docs/release/FOUNDER_QUEUE.md` (name of the key, where it was seen, what uses it; never the value).
- Do not wait to learn whether anyone saw it.

### 3. Token pages: names, status, dates only
Never read a token or key page as text (fetch, copy, accessibility tree, page text) while a newly created value is showing. Reload the page first, then read only names, status, role and dates. Never take a screenshot of such a page.

### 4. Sessions do not change keys or roles
Sessions never create, revoke or change Apple, Expo or GitHub keys, roles or capabilities. That includes App Store Connect API keys, Expo tokens, GitHub tokens and app settings, and App ID capabilities in the Apple portal. The founder does these. A session may write the exact steps and ask the founder.

### 5. Where keys live
| Key | Lives in | Never in |
|---|---|---|
| Apple signing certificate and profile | EAS credentials | repo, CI, chat |
| App Store Connect API key (target: App Manager only) | EAS, and the `.p8` on the founder's Mac | repo, CI, chat |
| Expo robot token | GitHub Environment `testflight`, minimum role | repo variables, other environments, a person's chat |
| Personal Expo and Apple logins | the founder | any session |
| Supabase service key | server side only | the app, CI for the app, chat (BRIEF decision 17) |

CI holds only the minimum-role Expo robot token, and only in the `testflight` environment (founder approves each run). It holds no Apple key and no ASC key.

### 6. Admin-role ASC key
The Expo-created Admin key ("[Expo] EAS Submit ...") was last used on 1 Nov. Do not revoke it until the founder has checked which key Expo holds for the `.preview` bundle (Expo dashboard, project scribe, Credentials, `.preview`). Target state: EAS holds an App Manager key only. Revoking is the founder's action (rule 4). Why check first: revoking the key Expo actually uses would break `eas submit`.

## Checks before a PR or a run
- `git diff` shows no key-like strings (the repo's secret scan runs in CI).
- Logs and PR text name keys by label and ID prefix at most.
- A new bundle id has its capabilities checked in the Apple portal by the founder (REL-10 runbook).

## UNVERIFIED proposal: prompt-scan hook
Idea: a Claude Code hook that scans the text a person types for secret patterns (for example private-key headers, `ghp_`-style prefixes, long base64 runs) and warns that the value is burned before the model sees it.

**UNVERIFIED.** I could not verify that Claude Code hooks can read or block a user prompt. If they can (a prompt-submit style event), the hook would warn, name rule 2, and queue the rotate item, and it would never write the matched text to a log. If they cannot, the fallback is a pre-commit and CI scan only, which does not cover chat. Next step: the founder or `tooling` checks the current Claude Code hooks documentation. Nothing here depends on this hook.
