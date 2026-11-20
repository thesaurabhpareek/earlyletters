## Review B at c65822f0f1d948dec26441ef95ff79d269aa7113: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). NS-08-R5: `apps/mobile/scripts/preflight-keepsafe.mjs` (67 lines) and `apps/mobile/test/preflight-keepsafe.test.ts` (11 cases). Head older than 10 minutes. CI on the head: `required`, tests and content rules, typecheck, database rules, Deno all green; at 12:22 UTC the store-profile Release launch job had also finished green; one duplicate compliance-fence run cancelled beside a green one.

Must fix: none.

What I checked:
- Tests in a worktree of the head: `preflight-keepsafe.test.ts` 11 of 11 pass. `node scripts/preflight-keepsafe.mjs`: 3 PASS (preview, production, testflight), exit 0. `npx tsc --noEmit`: the 5 known errors only. I did not finish the full mobile suite on this head: the sandbox was at load 52 on 4 cores, and the PR adds only a standalone script and its own test, which nothing else imports. CI's tests and content rules job, which runs the whole suite, is green.
- Security shape: the script reads `eas.json` only, prints only the flag value, and touches no secret, network or build. The check is stricter than both existing guards. It needs exactly `"off"`, so `on`, blank, `yes`, `OFF` or unwritten FAIL. That is the safe direction: leaving the value out can no longer pass.
- Store profiles: `distribution` absent counts as store, which is EAS's default, so `production` (no distribution) is checked. Internal profiles are skipped; a file with no store profile FAILs instead of passing empty.
- Enforcement today, before `ops` wires the script into `preflight-testflight.mjs`: the "eas.json as it is" case runs in CI (tests and content rules), so a store profile flipped to `on` or left unwritten turns CI red now.
- Cites, 6 sampled, 6 hold: `preflight-production.mjs:178-188` (production-only backup check), `preflight-testflight.mjs:172-179` (WARN on `on`, FAIL on other values), `backup-gate.test.ts:56` (missing read as off), `app.config.ts:177`, `capabilities.ts:150`, `eas.json` profiles and their `environment` fields.

Findings (most serious first):
1. Note, still open: which value EAS uses when `eas.json` `env` and the expo.dev environment (`"environment": "preview"` and `"production"` are set) both name `EXPO_PUBLIC_BACKUP`. I tried the Expo docs and could not reach them from this session. `ops` should confirm and record the answer with its date. If expo.dev wins, this check alone does not keep backup off, and the expo.dev variable list needs the same check (it is in the ops secrets inventory, not in the repo).
2. Note: `extends` is not resolved. Today no profile uses it, and an inherited value would fail as "not written", which is the safe side. If a profile ever extends another, the message will be confusing, not unsafe.
3. Note: there is no `expo-updates` in `apps/mobile/package.json`, so no over-the-air bundle can carry a different flag. If updates are ever added (RS-07), the update-time environment needs the same `backup-off` check, because, as far as I know, `eas update` does not read a build profile's `env` (unverified here, same reason as finding 1).
4. Note: wiring into `preflight-testflight.mjs` is `ops`'s (#855). Until then the WARN on `on` there stays a WARN, and the CI unit test is the gate.

Not verified:
- EAS precedence between `eas.json` and the expo.dev environment (finding 1).
- The real expo.dev variables (no agent may read the vendor console).

Reviewer: independent of the author (CR-44).
