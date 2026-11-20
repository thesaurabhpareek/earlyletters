## What and why

Two records, docs only.

- **CPO-10** in `docs/agents/exec/RULINGS.md` (first filed as CPO-2; renumbered after review, because CPO-2 and CPO-3 are cited in code, and CPO-2, CPO-3 and CPO-6 to CPO-9 in open PRs, for other rulings, and none of them is in a file of the log). The CPO ruled option (a) for BL-776 (a person with one book can reach Recently deleted after a cold start) in the 9 Nov 2026 council round: onboarding shows the existing Recently deleted row while a deleted book waits, no new line, the CDesO places it. No repository file held that ruling. The entry says it was filed by Karma's session, marks which fields are the CPO's (from `council-9nov/cpo.md`, outside the repository) and which are the filer's, makes "no new line" conditional on the CDesO's placement (a word that does not exist today goes to the founder first, D-132), and says no D- id will be made because executive rulings are recorded in this log (COUNCIL section 5). The CTO view is the filer's. The entry records the other views in the round (the CDesO's interim Undo toast, the product manager's default of option (c) for build 12) and carries the field labels the other entries use. The Project docs could not be read, so the number is unverified against them.
- **CR-60** in `docs/agents/cto/RULINGS.md`: a short passage is added after "delete or document the build-time override"; the original clause is kept. #710 deletes the override as a commit separate from #652, so a hotfix that "brings only the apps/web change of #652" read literally would leave it in. If #710 is merged, the hotfix branch must pass `git grep -F LEGAL_CONTENT_DIR -- apps .github` with exit 1 before it is opened; if not, the override is documented as before. Found by review B of #710.

It does not move BL-776 to ready (the product agent's edit, in #715, which becomes "ready when CPO-10 merges"). #719 cites the entry by its number. No code, no wording the product says, nothing under `docs/legal/**` or `docs/DECISIONS.md`.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [ ] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Not ticked: docs only, no source or test changed; CI runs them. Added lines scanned for bytes of 0x80 or more: none. The entry follows the format of CCO-6 in the same file. `docs/agents/**` is not in `compliance/FENCE.json`. Numbering checked on `develop` and the patches of the 158 open PRs (no CPO-10 or above). The `git grep` command exits 0 on `develop` today and 1 on the head of #710 (reviewer A ran it).

Not verified: the CPO's answer is in a council note outside the repository; I quote it from there. The Project docs.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] Copy lives in `packages/content` (no copy added)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file (none)

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
