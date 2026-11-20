## Review B at 307b56b2cf03c1a802f30b4ae47e08af45c2443d: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: security, privacy and release safety (SEC chapter; can the guard be bypassed, does it pass silently, does it touch user content).

Must fix: none.

The head moved during review: `b117bfcf` (11:11) to `307b56b2` (12:24, "review fixes (children rule, renames, quoted paths)"). At `b117bfcf` I had two must-fixes. Both are fixed at this head, and I re-ran my repro cases against it:
- Renames: `main` now diffs with `--no-renames` (`scripts/release/label-effect.mjs:198`). A file holding `fetch(u, { body: transcript })` moved by `git mv` from `scripts/helpers/` into `apps/mobile/src/lib/` now exits 1 (it exited 0 before).
- Quoted paths: `-c core.quotePath=false` (:198), and `parseDiff` now throws on a header it cannot name or that holds a quote (:50), and no longer filters files out (:67). A non-ASCII name now exits 1 with the finding; a name with a double quote exits 2. Before, both exited 0.

## What I checked

- The whole script at both heads, and the stack's final copy at #898's head `2849f55a`; the test titles.
- Cites: 12 of 12 hold. `permissionNames` is in `apps/mobile/scripts/preflight-lib.mjs:137` on develop; `preflight-lib.mjs` imports only `node:` modules, so the job needs no install; develop's app code calls Supabase as `sb.from` (8) and `client.from` (1), both in `NETWORK`; `functions.invoke` at `account-deletion/api.ts:134`, `auth/apple.ts:121`, `billing/status-report.app.ts:56` and `:68` all match; `DECISIONS.md` headings are `### D-nnn`, which `decisionSections` reads; D-124 is the workflows rule the README cites.
- Privacy: output is file paths, line numbers, check ids, D-ids (regex `D-\d{3,}` only), and SDK, entitlement and permission names. The new header error prints up to 200 characters of the `diff --git` line, which is two paths, not content. No added line text, no PR body text. It reads repository diffs, never user data. Good.
- Exit codes: a thrown error (bad ref, missing `--base`, no merge base, an unreadable header) gives 2; any trigger without the four record conditions gives 1. `DECISIONS.md` missing on base reads as empty, which fails every trigger. Fail-closed.
- Ten repro cases on a throwaway git repo against `b117bfcf` and `307b56b2`. Control cases fail as they should. The notes below still exit 0.

## Findings (notes, most serious first)

1. The children rule narrowed a case the first head caught. `public\.children` left `CONTENT`; `CHILD_TABLE` (:34) only matches `create` or `alter table children` with a name or date column. So `create function public.list_kids() returns setof public.children ...` exited 1 at `b117bfcf` and exits 0 now. That function returns child names, and the README now says a function "counts by its arguments and return type". Suggest: also count a function head whose return type or arguments name `children` (or `children%rowtype`), with a test.
2. The record check is weaker than it reads. Ten decisions on develop already name the privacy label (D-001, D-004, D-032, D-061, D-095, D-100, D-102, D-124, D-136, D-157). Any PR can cite one and add a blank line to the label file, and the guard passes. Nothing ties the decision to the change. Suggest the decision section must name the triggering check id or path, and say in `LABEL_GUARD.md` what the record check proves.
3. Lexical blind spots, reproduced with exit 0 at this head: a line starting `/**/` is skipped as a comment though code follows (`COMMENT`, :26); `alter table ... add transcript_copy text` (COLUMN is optional in Postgres; `SERVER`, :30); `create view ... select final_text`; `FileSystem.uploadAsync(url, recordingUri)` (expo-file-system's upload; `NETWORK` has `.upload(` only). Each is a one-token regex change. Also missing: `createUploadTask`, `grant select (final_text)`.
4. `NOT_SHIPPED` (:25) skips any `test/`, `e2e/`, `fixture/` or `__tests__/` folder inside `apps/mobile/src`. Code there is still bundled if a screen imports it (develop already has non-test files in `src/lib/packs/__tests__/`). Reproduced with `src/lib/fixtures/s.ts`. Suggest limiting the skip to `*.test.*` and `*.spec.*` inside shipped roots.
5. G11-3 reads only `apps/mobile/package.json` (the README now says so for SDKs). Entitlements written by a config plugin, or by adding a plugin entry to the `plugins` list (Sign in with Apple, push), have no `key:` shape and are not seen.

## Not verified

- I did not run the vitest file; I read CI.
- The PR's runs over develop's history and migrations.
- CI at the head (read 12:36 UTC, head 11 minutes old): every Linux check green, including tests and content rules, typecheck, database rules, Deno, B-8 seam and `required`. The macOS "store-profile Release launch" job is still queued; it does not exercise this change.

Reviewer: independent of the author (CR-44).
