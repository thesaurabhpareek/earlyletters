# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-prompts-v2 | content | fix/content-prompts-v2 | 1171 | `packages/content/src/prompts.ts`, `packages/content/test/prompts.preBirth.test.ts`, `packages/content/test/prompts.retired.test.ts` | 2026-11-21T03:19Z | 2026-11-24T03:19Z | prompt library v5, 13 rewrites under new keys; PR read as open 2026-11-21T03:19Z |
| photo-lane | mobile | feat/mobile-photo-3-store | 835 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | slices 835 to 840 (4b and 4c also touch Review and the letter page); REST open check 00:05Z |
| find-lane | mobile | feat/mobile-bl-952-7-wiring | 895 | `apps/mobile/src/lib/find/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | 894 and 895; REST open check 00:05Z |
| account-lane | mobile | fix/mobile-bl-961-store-reads | 879 | `apps/mobile/src/lib/account-deletion/**`, `apps/mobile/src/components/account/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | REST open check 00:05Z |
| product-status-audit | product | docs/backlog-status-audit-21nov | 1213 | `docs/BACKLOG.md`, `docs/backlog/STATUS-AUDIT-2026-11-21.md` | 2026-11-21T05:07Z | 2026-11-24T05:07Z | status lines only; REST open check 2026-11-21T05:07Z |
| bl-864 | ops | chore/ops-bl-864-plist-lint | 1203 | `apps/mobile/scripts/preflight-lib.mjs`, `apps/mobile/scripts/preflight-testflight.mjs`, `apps/mobile/test/preflight-forbidden-native.test.ts` | 2026-11-21T04:50Z | 2026-11-24T04:50Z | row open and unclaimed at 04:40Z; REST open check 04:55Z |
| bl-878-native-gate | security | docs/security-bl-878-native-gate | 1204 | `docs/security/NATIVE_MODULE_GATE.md`, `apps/mobile/test/native-module-gate.test.ts` | 2026-11-21T04:48Z | 2026-11-24T03:48Z | BL-878; row read as ready and unclaimed, no open or merged PR found by REST at 04:45Z |
| bl-456-leak-scan | sync | test/sync-bl-456-leak-scan | 1216 | `apps/mobile/test/backup-*.test.ts`, `apps/mobile/test/helpers/leak-scan.ts` | 2026-11-21T05:15Z | 2026-11-24T05:15Z | BL-456; tests only; REST open check at PR open |
| bl-851-media-threat-model | security | docs/security-bl-851-media-threat-model | 1217 | `docs/security/MEDIA_THREAT_MODEL.md` | 2026-11-21T05:30Z | 2026-11-24T04:30Z | BL-851; row read as ready and unclaimed, no open or merged PR found by REST at 05:20Z |
