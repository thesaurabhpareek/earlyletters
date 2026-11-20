BRIEF G1: G1: sync_pull serves other members' letters only after current age-attested terms (issue #909)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: data-architect   Lane: Pack 9 (data and sync), with `security-architect` and `sync`   Build: 14 (before a second parent can join in production)   Wave: 2   Size: S to M: one migration about 200 lines, one contract fixture, three tests
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: security-architect answers #909: writes the IAM row (proposed IAM-R26 in PR #914 section 3.3) and decides whether a server gate is needed; the founder approves any MUST rule and the grace-window question (POLICY_VERSIONING sections 5 and 6, default as that file says). No migration is proposed until then. Hand-off from Karma: #909 names the security-architect, not this agent.

1. GOAL: When a caller has not accepted the current terms with age_attested, then sync_pull returns the caller's own rows and omits other authors' rows with a flag an old build ignores; export and Delete account always work; an old build still parses the answer.

2. CARD ROWS and TEST TITLES
   Rows: IAM-R03 gap, PRIV-R08, PRIV-R09, NS-10 (the 'nothing downloads' rule is phone-only today), API-R11.
   Tests (exact, from PR #914 section 3.3):
     [G1] sync_pull omits others' rows without current age-attested terms    db access cell, deny and allow; mutant: remove the check
     [G1b] export and deletion work without current consent                  mutant: add the gate to those RPCs
     [G1c] an old build still pulls its own rows                             unit on a frozen packages/api v1 fixture; mutant: return an error shape
   Consent boundary as separate cells (title each; state none, stale, current, grace): [G1-none] caller with no terms acceptance gets own rows only; [G1-stale] acceptance of an older Terms version outside the grace window gets own rows only; [G1-grace] stale but inside the grace window gets both (default; the founder may change it); [G1-current] current acceptance with age_attested gets both; [G1-no-age] current acceptance without age_attested gets own rows only.
   [G1c] must not pass without the gate: use TWO frozen fixtures, the old shape (a response with no flag) and the new gated shape (own rows plus the omission flag), and assert the old-build parser (PulledRowSchema, packages/api/src/server/sync.ts:583) accepts both; a third assertion fails if the gated response adds a required key.
   Red on develop: sync_pull starts with require_user() only (20261016000000_sync_v1_server.sql:1306), so a co-parent with no acceptance receives the other author's rows through book_entries (:1498).

3. FILES: TOUCH / DO NOT TOUCH
   Touch (only after the decision):  supabase/migrations/<next-id>_sync_pull_consent_gate.sql (a restatement of sync_pull: coordinate with H1, below), supabase/tests/access_matrix.test.mjs or v1_gate_coparent.test.mjs (cells), packages/api/test/ fixture, docs/agents/checkins/data-architect-g1.md
   Never:  docs/engineering/05-identity-and-access.md (security-architect's RFC), any applied migration, the app, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: sync_pull is restated by H1b: build G1 on H1b if H1 is approved, otherwise it is the one restatement that needs its own size exception; ask Karma which.

4. READING PACK
issue #909 body; PR #914 SECURITY-PRIVACY-ACCEPTANCE.md section 3.3 (G1); docs/tdd/new-scope/engineering-facts-bl-987.md line 44; docs/engineering/07-privacy-engineering.md (PRIV-R08, PRIV-R09); data-and-sync.md section 3.5 and eval A s0.1 item 7.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   supabase/migrations/20261016000000_sync_v1_server.sql:1306   require_user() only; :1498, :1542, :1553, :1563 the book_entries reads
   supabase/tests/v1_gate_coparent.test.mjs and access_matrix.test.mjs   co-parent persona fixtures
   packages/api/src/server/sync.ts:583   PulledRowSchema (old builds must still parse)
   apps/mobile/src/lib/first-run/gate.logic.ts:194   the phone's canSync control that is the only gate today

6. DATA AND SECURITY
   Data classes: reads L4 words of a third party; no new column. Degrades by omission, never by a new error that an old build treats as a crash (API-R11). Export and deletion are never gated.
   Boundary: IAM read path. Owner of the read: security-architect.

7. LIBRARIES ALLOWED
none.

8. BUDGETS
One extra check per pull; stays inside the pull budget (sync_perf.test.mjs:38; 200-row page under 300 ms on the phone, budget Q-05, PR #928). Checked by: perf test; not measured on hosted.

9. ACCEPTANCE
   Experience: none. Test cases: PR #914 [G1], [G1b], [G1c]. Security: PR #915 abuse cases on a co-parent without consent.
   Done also means: each test red on the old function and on its mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: migration + three tests | about 200 lines, 4 files | base develop (or H1b) | server before any build relies on it

11. REVIEW LENSES
Lens A: red-team (D-041). Lens B: security-architect. Founder `approve-migration`.

12. ORDER AND DEPENDENCIES
After: #909 answered; H1b decision. Before: the second parent joining in production (NS-25). Blocked by: the decision above.

13. DEFINITION OF DONE
   [ ] `npm run test:db` green (31 files rebuild; grants, classification, access matrix); each new test red on the old schema and on the named mutant
   [ ] every new public object has its grants in its own migration AND a line in supabase/tests/grants.mjs; every new column has its class and level in its comment (DATA-REQ-001, -002)
   [ ] migration id from `node scripts/agents/next-id.mjs` (APPLY number; 33 on 20 Nov) and a timestamp after 20261109000000 and after any open PR's newest (#677 has 20261109010000); never edit a file listed in .github/migrations-applied.txt
   [ ] PR body says: red-team review and the founder's `approve-migration` label are needed (D-041); nothing applied to any remote project
   [ ] ASCII only; fictional family Asha only; journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
Two phones, one without current acceptance: it sees its own letters and none of the other's (BL-929 row after staging).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - security-architect decides no gate is needed (then close with a note, write nothing); - the grace window is undecided.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #9 first; marker `<!-- journal run:sess-20261120-data-architect-g1 agent:data-architect -->`.
   Check-in: docs/agents/checkins/data-architect-g1.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/db-g1-sync-pull-consent-gate in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:data-architect -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
