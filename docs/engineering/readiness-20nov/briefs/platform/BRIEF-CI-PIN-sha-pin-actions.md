# BRIEF CI-PIN: pin the 17 unpinned workflow actions to full commit SHAs (SEC-R10)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: nothing for the patch and the test; the founder applies the patch (workflow edit; two reviews, security-architect reads `.github/**`).** Founder-only: applying it to `.github/workflows/**`. Count to re-check first: `grep -rn "uses:" .github/workflows | grep -v "@[0-9a-f]\{40\}" | grep -v "uses: \./"`.

```
BRIEF CI-PIN                                      Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: any   Wave: 1 (small, no dependency)

1. GOAL: When any workflow file names a third-party action by tag instead of a 40-character SHA, a test in `npm test` fails, and the patch makes every `uses:` line a SHA with the version in a comment.

2. CARD ROWS and TEST TITLES: SEC-R10 (docs/engineering/06-security-engineering.md:51; ENFORCEMENT.md:164), security K-2 (SECURITY-OPEN-QUESTIONS.md, #915). No NS row.
   Test (new): apps/mobile/test/workflow-pins.test.ts `[SEC-R10] every third-party action in .github/workflows is pinned to a full commit sha, except the listed ones`. Red on develop with an empty list: 17 lines fail
   (ci.yml 7, web-e2e.yml 5, web.yml 3, migration-guard.yml 2 [V]). Positive control: a fixture string `uses: actions/checkout@v4` must be reported.

3. FILES
   Touch: apps/mobile/test/workflow-pins.test.ts (new), docs/ops/proposed/workflows/ci-pins.patch (a `git diff` made in a scratch worktree), docs/engineering/ENFORCEMENT.md (row SEC-R10 only, steward's file:
          ask principal-architect), docs/agents/checkins/ops-rd-h3-pin.md
   Never: .github/workflows/** (founder applies), the pinned lines that already carry a SHA.
   Shared file: none open on the same lines (#806 adds a new file with pinned SHAs).

4. READING PACK: Pack 10 item 1; SECURE-CODING-CHECKLIST.md line 104 (#915); compliance-fence.yml (already `pull_request_target`-safe per that line [U: not re-read]).

5. CODE ENTRY POINTS (verified at 16e61549): the 17 lines
   ci.yml:31 checkout@v4, :32 setup-node@v4, :38 cache@v4, :55, :70, :81, :92 checkout@v4;  migration-guard.yml:20 checkout@v4, :23 setup-node@v4;
   web-e2e.yml:43 checkout@v4, :45 setup-node@v4, :50 cache@v4, :61 cache@v4, :77 upload-artifact@v4;  web.yml:52 checkout@v4, :54 setup-node@v4, :61 cache@v4.
   Already pinned elsewhere, by same-major SHA, in this repo: checkout 11bd71901bbe5b1630ceea73d27597364c9af683 (v4.2.2, release-ios.yml), setup-node 49933ea5288caeca8642d1e84afbd3f7d6820020 (v4.4.0,
   .github/actions/setup/action.yml:6), cache 0057852bfaa89a56745cba8c7296529d2fc39830 (v4.3.0, same file :13). upload-artifact has no v4 SHA in the repo: resolve it with
   `git ls-remote https://github.com/actions/upload-artifact 'refs/tags/v4*' 'refs/tags/v4*^{}'` (for an annotated tag the SHA to use is the peeled `^{}` line, the commit; the first line is the tag object) and record the command output in the PR (never write a SHA from memory).

6. DATA AND SECURITY: no data class. Why: a mutable tag runs someone else's code with our token (06-security-engineering.md:21). Boundary: supply chain (SEC-R10). Rec: pin to the SAME major as today (v4), so
   behaviour does not change; the repo also holds newer pins (checkout v7.0.1, setup-node v7.0.0, cache v6.1.0, upload-artifact v7.0.2): moving to those is a major upgrade and needs its own backlog row (my rule).

7. LIBRARIES: none.
8. BUDGETS: none; the test reads 17 small files [E under 1 s].

9. ACCEPTANCE: test green on the patched tree (run it in the scratch worktree with the patch applied) and red on develop's tree; the patch applies with `git apply --check`; each line keeps `# vX.Y.Z`.
   Done also means red on mutant: change one pinned SHA in the fixture to a tag.

10. PR BREAKDOWN: PR 1 | ~110 lines (test 60, patch 50) | base develop. The test must not turn develop red before the founder applies the patch, so it is a ratchet:
    it holds an explicit list of the 17 known unpinned lines (file and line text), fails on any unpinned line not on the list, and fails if a listed line is already pinned
    (the list only shrinks). The list must NOT live only in the PR's own test file, where its author can grow it: keep it in `docs/ops/action-pins-allowlist.txt` and have the test compare it with the base branch's copy (`git show origin/<base>:<path>`), failing when any line was added. The founder's patch empties the list in the same diff. Flag-off proof: the test passes on develop as it stands.

11. LENSES: A security-architect, B principal-architect.

12. ORDER: any time; with BRIEF B13-CHECKS and CI-SECRET it is one founder sitting ("paste three patches"). Blocked by the founder for the apply.

13. DONE: [ ] focused test; [ ] `npm test -w apps/mobile` baseline; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing; the first CI run after the apply shows every job still starts (the proof the SHAs resolve).

15. STOP AND ASK: a SHA cannot be resolved from the network; a workflow needs a newer action feature than the v4 pin; review refuses the ratchet list in section 10.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-pin agent:ops -->`; branch chore/ops-ci-sha-pins; labels agent:ops, from:agent, needs:founder.
```
