# Fix brief: comms validation backlog (31 Oct 2026)

Worktree: `/home/claude/wt-val`, branch `fix/comms-validation-2026-10-31`, based on develop `ca02e820`.

**Reviews to fix:**

- `signin.md` (SIGN-01 to SIGN-11)
- `subscriptions.md` (SUB-*)
- `email-templates.md` (TPL-01 to TPL-12)
- `language.md` (LNG-01 to LNG-36)
- `setup.md` (SET-*), when it lands

**Founder instruction:** fix everything diligently, with no mistakes. A separate review runs after this.

## Read first

- `CLAUDE.md`: constitution, content rules, privacy rules.
- `docs/DECISIONS.md`, especially D-053, D-054, D-073 to D-082 and D-121 to D-125.
- `D-121` defines the staged first release:
  - build 1 is on-device with servers off;
  - build 2 has servers on.
- If the reviews and the decisions disagree, the decisions win. Note every such case.

## Lanes (exclusive file ownership)

Several agents work in this same worktree at the same time.

- Edit only your own paths.
- Never commit, push, merge or install.
- If you need a change outside your lane, write it in your report.
- If a test fails in another lane's files while you work, wait about 60 seconds and rerun before you report it.

| Lane | Owns | Takes findings |
|---|---|---|
| **copy** | `packages/content/**` except `src/emails/**` and `legal/**`; `docs/store/**`; `docs/ROADMAP.md`; `docs/backlog/**`; `packages/content/VOICE.md`, `BRAND.md` | LNG-* (except those in `src/emails`), SIGN copy items, SUB copy items in app strings and store, the store co-parent conflict, the offer-code roadmap line |
| **email** | `packages/emails/**`; `packages/content/src/emails/**`; `docs/emails/**` | TPL-*, LNG-* in email copy, SUB-03 (amount in reminders), email parts of SIGN-* |
| **legal** | `docs/legal/**`; `packages/content/legal/**` (if present) | SUB-01, SUB-02, Terms 14.6 versus the reminders actually sent, any LNG-* in legal tone. Legal text is founder-merged under D-125, so make the edits and list every changed clause. |
| **server** | `supabase/**` | SIGN-02 (`config.toml` auth settings), SIGN-05 and TPL-07 (senders for `account-create-attempt` and `sign-in-trouble`), TPL-03 (billing reminder sender, if in scope for build 1 or 2 per D-121), TPL-05, the server side of TPL-02 (senders call `renderForResend`). `supabase/**` needs an independent review and `approve-migration` before merge (D-041), so keep changes minimal and fully tested. |
| **app** | `apps/mobile/**` | SIGN-03, SIGN-04 (app side), SIGN-06, TPL-04, SUB-05, SUB-06, SET-* |

**Website (`apps/web`):** it lives on `main`, not develop. Do not edit it. List the website changes needed (SIGN-04 path, TPL-06 pages) in your report.

## Done means

- Every finding in your lane is closed in one of three ways:
  - fixed, with a test where behaviour changed;
  - not fixed, with a reason (decision conflict, needs the founder, outside the lane);
  - deferred to a backlog id.
- All of these pass at the root: `npm test`, `npm run typecheck`, `npm run build -w @scribe/emails`. Run `npm run test:db` and `npm run test:functions` too if you touched `supabase/`.
- Content rules hold:
  - no em or en dashes, curly quotes, ellipsis characters or emoji;
  - never imply AI writes the words;
  - `{child}` is never gendered.
- **Report** (under 200 words), with a closure table: finding id, outcome, file.
