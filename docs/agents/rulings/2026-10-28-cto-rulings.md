# CTO rulings, 28 Oct 2026 (D1 to D8)

Status: ruled by the delegated CTO after a structured debate (ship-fast advocate vs caution advocate, neither saw the other's work). Evidence: reviews A03, A04, A30, redteam-311, agent reports A01 to A30. These are working decisions, not entries in `docs/DECISIONS.md`; the founder can overrule any of them. Tags: V = read or ran, I = inferred, U = not verified.

## D1. PR #306 (invite_redeem_by_code)
- Ruling: adopt `e63ffcab` (skip locked, rollback header). Do not add SCDEL/SCRAT to the elsif list: the RPC cannot emit them (V, data-architect read the code), and an uncounted `refused` would be a free guess.
- Gate (D-117): two independent passing reviews on the CURRENT head plus green CI plus `npm run test:db`. A03 and A04 reviewed `f54b6f2e`, so `e63ffcab` needs a fresh delta review before merge (caution case accepted).
- Before the founder applies it with `deploy-db.yml`: confirm `CLIENT_IP_HEADER`, `INVITE_CODE_PEPPER` and `RATE_SUBJECT_SECRET` are set (A03 F2). `approve-migration` is retired by D-117.
- Backlog: A03 F3 (role by code_hash), F4 (constant re-raise message), F2 deploy check, stale `family.ts` comments.

## D2. PR #311 (pg_temp last, purged photos)
- Ruling: do not merge yet. The `purge-oracle` eval (A16) treats F1 as a defect, and merging code our own eval fails is incoherent.
- Caution advocate says the eval fixture assumes `purge_ledger.author_id`, which the real table may lack (I, cites 20261002020000:817, not yet confirmed by me). So first: data-architect checks whether an author-scoped answer is feasible with `sync_private.entry_erasures` without breaking "one person's erasure never refuses another's upload".
- If feasible in one pass: fix in #311 (unapplied, so editing is free). If not: founder accepts F1 (one bit about a uuid the asker already holds) with a threat-model note, and the eval is corrected to match.
- F2 (loose name shapes): backlog with a test, after confirming the client's upload name shape.

## D3. PR waves (cap 10 agent PRs)
- Wave 1 (no supabase/, no .github/): A26 docs, A22 dry-run, A23 rehearsals, A28 legal memo, A20 engine regression, A15 integrity evals, A19 calibration set, eval runner (with `_remove.txt` support so drift-06 validates).
- Wave 2: A13 injection tests, A17 drift evals, A16 db evals (after D2), A29 as ONE PR replacing the four separate hardening-module PRs (A06 gates, A13 provenance, A17 sla, A18 stale; authorship preserved), then A27 once #161's fate is decided.
- Held for D-041 independent review: rb-14a security.yml, rb-14b dependabot and pins, and the workflow env patch in `docs/ops/proposed/`.

## D4. Website analytics
- Ruling: none for now. Close #309 with the reasons (changes policy words not the switch; also loads on /j /i /auth; contradicts CSP; overclaims). Reopen only with a founder decision. U: confirm the Vercel dashboard has Analytics off.

## D5. Legal set
- Ruling: base on #163, rebased; salvage named parts of #136 only; drop its unbuilt claims and old decision ids. Version numbers (2.1.0/3.1.0 jump) are counsel's and the founder's call; POLICY_VERSIONING says "when in doubt, it is major". Parked until counsel is engaged; build 1 needs only the no-account notice.

## D6. Crash-free rule C1
- Ruling: C1 requires zero unresolved crash signatures on the candidate build; 99.8% stays the post-release G5 gate. Reason: at C1 volumes one crash in about 500 sessions moves the rate 0.2 points, and the rate's numerator and denominator are undefined. Repo conflict (ROADMAP/DEVICE_TEST_PLAN say 99.8%; PRD v2 03:75 says zero) to be reconciled in a docs PR. Founder can overrule.

## D7. Harness defaults
- `AGENTS_GATES=warn` (gate fails open on API failure; `shrunk` never fires from the dispatcher). Move to enforce after a clean week and after the injection holes H1 to H3 are fixed.
- Stale thresholds 14/21/30: report-only. Flaky policy: quarantine at most 7 days with an owner, cap 5 (proposed numbers).

## D8. Merge authority
- Ruling: the coordinator may merge docs-only and tests-only PRs after two independent passing reviews bound to the head sha plus green CI (D-107 line ~690, widened by D-117). Mechanical guard: no `.github/`, `supabase/`, engine files, `docs/DECISIONS.md` or `docs/legal`; tests-only PRs may not delete or loosen assertions; reviewers differ from the author. Anything else goes to the founder.

## Follow-ups queued
Injection holes H1 to H12 (H1, H2 first), retired-label cleanup in 5 charters, 5 MEMORY.md files, SEC-R13, COORDINATION s6 and bootstrap.mjs, HARNESS.md hardening list, ARCHITECTURE.md "36 tests" check, flaky enforcement backlog item.

## Execution log (28 Oct)
- Wave 1 PRs opened: #319 (A20 engine regression), #320 (A26 docs), #321 (A22 dry-run), #322 (A23 rehearsals), #323 (eval runner plus `_remove.txt` fix; validator now 21 ok, 0 broken across db, drift, integrity, trust). All `risk:low`, each needs two independent reviews on its head (D-107) before the coordinator merges under D8.
- Open agent PRs after wave 1: 10 (cap 10). Wave 2 waits for slots.
- Task branches not yet in PRs: rb-10a trust evals, 10b integrity, 10c db (after D2), 10d drift, A19 calibration, A13 injection tests, A29 integration, A27 export consent, A28 legal memo, A11/A12 `.github` (D-041).
