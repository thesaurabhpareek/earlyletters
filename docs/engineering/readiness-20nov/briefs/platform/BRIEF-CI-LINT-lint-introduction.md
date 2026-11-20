# BRIEF CI-LINT: introduce ESLint and a `lint` job (CODE-R20, OBS-R05; gate G2)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder approves new development dependencies (ESLint and a TypeScript rule set: none is in `package-lock.json` today [V]) and the 49 `eslint-disable` cleanup in one PR (CODE-QUALITY-GATES.md G2 question). A formatter is a different, later PR. The `lint` job is a workflow edit: founder applies.** Founder-only: dependency approval (AIE-R21), the workflow paste, making `lint` required.

```
BRIEF CI-LINT                                     Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops (config), principal-architect reviews   Lane: Pack 10   Build: any   Wave: 2

1. GOAL: When a pull request adds `console.*`, a floating promise, `==`, or a template-literal `throw new Error` in core, `npm run lint` exits 1 with the rule and file:line, and develop passes it.

2. CARD ROWS and TEST TITLES: CODE-R20, OBS-R05 (ENFORCEMENT.md:31, :55 both "not yet"), CODE-R16, CODE-R10/R11 (boundaries).
   Tests: a vitest file apps/mobile/test/lint-config.test.ts `[CODE-R20] the lint config turns on the five named rules as errors` (reads the flat config as data) and `[OBS-R05] a console call in apps/mobile/src fails lint`
   (runs the linter on a fixture via its Node API). Red on develop: no config file exists (`git ls-files | grep -i eslint` -> nothing [V]).

3. FILES
   Touch: eslint.config.mjs (new, repo root), package.json (root `lint` script; devDependencies), apps/mobile/package.json (the `lint` script at :82 is `expo lint` with nothing to read), package-lock.json, the 49 stale
          disable comments (grep `eslint-disable` in apps/mobile/src and packages/*/src [V 49]), docs/ops/proposed/workflows/lint-job.yml, docs/engineering/ENFORCEMENT.md (steward), checkin docs/agents/checkins/ops-rd-h3-lint.md
   Never: a formatter run over the tree (breaks CODE-R02); `.github/workflows/**` by hand; disabling a rule to make a file pass.
   Shared file: lockfile and package.json get an extra reviewer: security-architect (native or lockfile), compliance-engineer (`package.json`).

4. READING PACK: Pack 10 item 1; CODE-QUALITY-GATES.md G2 and G4 (#930); 01-code-and-change.md CODE-R16, R20; LIBRARY-DECISIONS ADOPTION-RULES.md (#920) for the dependency form; docs/engineering/06-security-engineering.md:105.

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/package.json:82   `"lint": "expo lint"`; no eslint, typescript-eslint or eslint-config-expo in package-lock.json (only prettier 3.9.9 as a transitive) [V python read of the lockfile]
   `console.*` in app source: one call, apps/mobile/src/lib/resilience/global-errors.ts:49, the warn sink [V grep per CODE-QUALITY-GATES.md G13]
   49 `eslint-disable` lines in 32 files for a linter that never runs [V recount 49]
   no `lint` job in any workflow [V]

6. DATA AND SECURITY: no data class. A new devDependency runs on CI and laptops: install scripts, maintainers, last release within 12 months (06-security-engineering.md:105), licence permissive. Boundary: supply chain.
   Privacy line: lint is also the cheapest guard for "no content in logs" (OBS-R05).

7. LIBRARIES: none chosen here. The agent proposes names and exact versions only after reading the registry entry (do not invent versions); `eslint-plugin-react-native-a11y` is AVOID (last release 2024-11, #920).
   Native code: none. Each addition is justified in the PR per CODE-R17.

8. BUDGETS: lint job under 2 minutes [E]; `unit` stays under 4.5 minutes or the mobile workspace is split (CODE-QUALITY-GATES.md section 3).

9. ACCEPTANCE: rules as errors: `no-console` (allow the one sink with a comment naming OBS-R05), `no-restricted-imports` (platform imports in packages, db imports in components: the G4 table), `@typescript-eslint/no-floating-promises`,
   `eqeqeq`, `no-restricted-syntax` for template-literal Error in packages/core. Done also means red on a mutant per rule (add the forbidden line to a fixture) and 49 stale disables removed or justified.

10. PR BREAKDOWN: PR 1 config + rules + fixes for the first findings ~300 lines (config 60, test 60, cleanup 180) | PR 2 workflow proposal + ENFORCEMENT row ~70 lines | base develop | the job is advisory until the founder makes it required.
    If findings exceed 400 lines: land rules as warnings with a baseline file that only shrinks (docs/ops/lint-baseline.json), then raise them.

11. LENSES: A principal-architect, B security-architect (dependency); mobile reads (the 49 disables and the test sit under apps/mobile/** and packages).

12. ORDER: after BRIEF CI-PIN and CI-SECRET (one founder paste session); before BRIEF CI-PRSIZE only by taste. Blocked by the founder for deps and paste.

13. DONE: [ ] `npm test -w apps/mobile` baseline (8 files); [ ] tsc 5 known errors; [ ] `npm run lint` green on the branch; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: nothing.

15. STOP AND ASK: a rule needs a plugin not yet reviewed; the cleanup exceeds 400 lines; a "disable" hides a real bug (report to its owner); eslint wants a Babel or Metro change (native/bundler config: stop).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-lint agent:ops -->`; branch chore/ops-eslint-introduction; labels agent:ops, from:agent, needs:founder.
```
