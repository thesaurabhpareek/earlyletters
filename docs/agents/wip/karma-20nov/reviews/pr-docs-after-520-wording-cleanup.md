## What and why

Docs only (`docs/BACKLOG.md`, `docs/DECISIONS.md`). Reviewers found stale or wrong sentences after #520 and #693 merged. Each was checked on `develop` and only the ones still wrong were changed. The branch has merged `develop` at 19a3c8d7 (clean) and every remaining file:line below was re-checked after that merge.

1. BL-775 to BL-781 preamble and BL-781: "exist on `develop` only after it merges" and "merges first" now say #520 is merged. BL-781's "#520 as written still says Your data" was checked and is not true of the app (`erase.tsx` and `erase-everything.ts` say Your letters); what still says Your data is F17 6.2 F (`docs/prd/v2/features/F17-settings-privacy.md:208`), so the sentence names that. BL-775 to BL-777 file:line references were all re-checked; one had moved (`settings/index.tsx:52` in BL-776 is now `:148`, the Recently deleted row after the #614 regroup).
2. BL-780: the "We hold no copy." footer is named by key (`whereLive.footer` in `packages/content/src/strings.en.ts`), not `strings.en.ts:1283`, which had moved. The line numbers in `strings.en.ts` move often.
3. D-144: "CCO-6 ... not on `develop` until it merges" says where CCO-6 is (`docs/agents/exec/RULINGS.md`). "BL-782 ... is the one deferral" is now "the deferral that has a row". The Follow-ups range is now BL-775 to BL-783.
4. BL-782: status changed from `needs-decision (CPO ...)` to `deferred (...)`, the form BL-586 uses; no question is open for the CPO. `parseBacklog` reads it as `deferred` and eligibility stays not eligible. The Status says the CTO ruling of 8 Nov is not in the repo and is recorded in the #520 conversation. The Problem line names "design.md 2.12 of the account-security proposal" as a Project document, not in the repository, and says `docs/design/COMPONENTS.md` 2.12 (the Sheet) is unrelated. Who is `mobile`, review `security`, `privacy` (the Face ID step); the persona that was in Who moved into the Problem line. Mode is `agent`. Blank lines fixed before the row and before the next `###` heading.
5. New row BL-783, "Say Settings, Your letters, Export your book in the 0.9.0 texts and the website pages before they go live", narrowed to what BL-448 and BL-501 do not cover. The website Delete account page, the policy-update and book-deletion emails, the runbook template and most `docs/legal` drafts are those rows' lines; BL-783 points at them (Extends: BL-448, BL-501, D-144, CR-60) and does not list them again. What BL-783 owns:
   - the 0.9.0 Terms 7.3 and Privacy text (`docs/legal/beta`, the founder's merge) and the copies the site serves in `apps/web/content/legal`, with the hash re-pin steps and the CR-60 and `POLICY_VERSIONING.md:69` caveat. No `policy_versions` row for 0.9.0 is recorded in the repo (`git grep -F 0.9.0 -- supabase` finds none); the hosted database was not checked;
   - two email strings no other row names (`privacy-request-received`, `family-book-closing`), which also call the row "Export everything" where it is "Export your book";
   - the App Review notes table row in `docs/store/compliance/data-and-account-deletion.md`, with an owner (`content`, review `compliance-engineer`) and an acceptance. The real notes are now in `app-review.en.ts` and say "Settings, Delete account";
   - the `docs/legal` hits named by none of BL-448, BL-500 and BL-501, as the founder's merge.
   It names three paths: "Settings, Your letters, Export your book", "Settings, Delete account", and "Settings, Your letters, Recently deleted" for the book-deletion email. The server flow behind that email was not traced. `strings.en.ts` hits are named by key. The list of other hits says "among others". The second acceptance bullet's grep is scoped to `packages/content/src apps/web/src` and uses `-F`; `testflight.en.ts:84` and `:134` say "Settings, Export your book" without a group, which is not wrong.

No `docs/legal` file, code or workflow is touched.

## How it was checked

- [x] `node scripts/agents/check.mjs` (26 agents, 396 backlog tasks, consistent)
- [x] `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs 'compliance/**/*.test.mjs'`: 159 pass, 0 fail
- [x] `node scripts/trace.mjs --no-write`: output identical to `origin/develop`
- [x] `parseBacklog` + `eligibility`: BL-782 is `deferred`, not eligible; BL-783 is `needs-founder`, Mode `pair`, not eligible
- [x] `apps/mobile`: `qa-release-catalog.test.ts` and `billing-plan.test.ts`, 50 tests pass
- [x] `packages/content` suite: 15 files, 365 tests pass
- [x] Every file:line in the changed rows checked against the merged tree with a script (44 cites, all hold); `cmp` shows the two 0.9.0 copies identical to `docs/legal/beta`
- [x] Added lines have no byte at or above 0x80; `git diff --check` is clean
- [ ] `npm run test:db`, `npm run typecheck`, full `npm test`: not run; no code, schema or type changed
- [x] BL-783 is the next free id: `node scripts/agents/next-id.mjs` said BL-783, and a scan of every open PR's file patches found no BL id above BL-774 except the BL-900 to BL-904 test fixtures

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only)
- [x] No entry text, transcript, audio or child name anywhere
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details
- [x] No migration, no `docs/legal`, no `.github`, no package.json or lockfile

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
