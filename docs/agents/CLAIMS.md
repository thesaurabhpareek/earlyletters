# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| photo-lane | mobile | feat/mobile-photo-3-store | 835 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | slices 835 to 840 (4b and 4c also touch Review and the letter page); REST open check 00:05Z |
| find-lane | mobile | feat/mobile-bl-952-7-wiring | 895 | `apps/mobile/src/lib/find/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | 894 and 895; REST open check 00:05Z |
| account-lane | mobile | fix/mobile-bl-961-store-reads | 879 | `apps/mobile/src/lib/account-deletion/**`, `apps/mobile/src/components/account/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | REST open check 00:05Z |
| qa-trace-ns | qa | test/qa-bl-964-trace-ns-ids | 1205 | `scripts/trace.mjs`, `scripts/trace.test.mjs`, `docs/ops/trace-ns-baseline.txt` | 2026-11-21T00:00Z | 2026-11-24T00:00Z | BL-964 ratchet; REST open check of the row and of #878 and #1060 (merged) done |
| product-status-audit | product | docs/backlog-status-audit-21nov | 1213 | `docs/BACKLOG.md`, `docs/backlog/STATUS-AUDIT-2026-11-21.md` | 2026-11-21T05:07Z | 2026-11-24T05:07Z | status lines only; REST open check 2026-11-21T05:07Z |
| bl-864 | ops | chore/ops-bl-864-plist-lint | 1203 | `apps/mobile/scripts/preflight-lib.mjs`, `apps/mobile/scripts/preflight-testflight.mjs`, `apps/mobile/test/preflight-forbidden-native.test.ts` | 2026-11-21T04:50Z | 2026-11-24T04:50Z | row open and unclaimed at 04:40Z; REST open check 04:55Z |
| bl-878-native-gate | security | docs/security-bl-878-native-gate | 1204 | `docs/security/NATIVE_MODULE_GATE.md`, `apps/mobile/test/native-module-gate.test.ts` | 2026-11-21T04:48Z | 2026-11-24T03:48Z | BL-878; row read as ready and unclaimed, no open or merged PR found by REST at 04:45Z |
| bl-119-child-input | speech | fix/speech-bl-119-child-input | 1220 | `packages/core/src/prompts.ts`, `packages/core/test/prompts.selection.test.ts` | 2026-11-21T05:20Z | 2026-11-24T04:20Z | BL-119; row read as ready and unclaimed, no PR found by REST at 05:05Z; REST open check 05:20Z |
| bl-506-planted-env | qa | test/qa-bl-506-planted-env | 1219 | `apps/mobile/test/preflight-planted-env.test.ts` | 2026-11-21T05:15Z | 2026-11-24T04:15Z | BL-506; row read as ready and unclaimed, no open PR found by REST at 05:00Z; PR 1219, REST open check 05:20Z |
| bl-456-leak-scan | sync | test/sync-bl-456-leak-scan | 1216 | `apps/mobile/test/backup-*.test.ts`, `apps/mobile/test/helpers/leak-scan.ts` | 2026-11-21T05:15Z | 2026-11-24T05:15Z | BL-456; tests only; REST open check at PR open |
| bl-851-media-threat-model | security | docs/security-bl-851-media-threat-model | 1217 | `docs/security/MEDIA_THREAT_MODEL.md` | 2026-11-21T05:30Z | 2026-11-24T04:30Z | BL-851; row read as ready and unclaimed, no open or merged PR found by REST at 05:20Z |
| er-a00-p3 | analytics | feat/analytics-er-a00-p3-crash | 1232 | `packages/analytics/src/crash.ts`, `packages/analytics/src/index.ts`, `packages/analytics/test/crash.test.ts` | 2026-11-21T06:50Z | 2026-11-24T06:50Z | ER-A00 P3, BL-1235; REST open check 06:50Z |
| bl-508-privacy-row | qa | test/qa-bl-508-privacy-row | 1252 | `apps/mobile/test/privacy-sensitive-row.test.ts`, `apps/mobile/src/lib/auth/sensitive-row-hook.ts`, `apps/mobile/src/lib/auth/session-provider.tsx`, `docs/BACKLOG.md` | 2026-11-21T07:45Z | 2026-11-24T07:45Z | BL-508; row read as ready on origin/develop; REST open check at PR open |
| dl-v2-wording | design-systems | docs/design-v2-wording-followup | 1247 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | 2026-11-21T07:35Z | 2026-11-24T07:35Z | v2 wording follow-up to 1222; REST open check 07:35Z |
