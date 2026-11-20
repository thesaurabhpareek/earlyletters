# ADR 0032: An on-device sensitive store outside `scribe.db` (days, culture, and the moments index)

- **Status:** Proposed, 20 Nov 2026. The decisions are ruled in `docs/agents/cto/RULINGS.md` CR-69 A4 and `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md` (errata E37 and NS-47-R6 behind it); two-way until the code ships. Docs only.
- **Author:** `data-architect` with `mobile`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026. ADR 0028 (`docs/adr/0028-photo-seal-find-on-device-data.md`) covers `entry_media`; this record covers files that must stay out of the iPhone backup.

## Context

- One SQLite file is backed up whole, so a record that must be excluded from the backup cannot live in `scribe.db` (E37).
- The primitive exists: `setExcludedFromBackup(uri, excluded)` in `apps/mobile/modules/scribe-files/index.ts:11`; read-back precedent in `apps/mobile/src/lib/packs/app-support.ts` and `lib/model-files.ts`. There is no change bus on it.
- The days store holds tradition and faith-related choices; the moments index (NS-51) holds local asset ids. Both are L4 until `privacy` rules.

## Decision (all [CR-69] A4)

1. **Two files, one pattern.** The days store and the moments index are separate versioned files in Application Support, outside `scribe.db`.
2. **Write order:** create the empty file, set the backup exclusion, read it back, write bytes only after, read back again after the rename and on every open. A false read-back deletes the file and the store refuses to write. Leftover temp files are swept at launch.
3. **Clear order on sign-out and Erase:** delete the file first, before `forgetReminders` and any await. Every read checks the owner key and fails closed on a mismatch.
4. **File protection** no weaker than `scribe.db` (complete until first user authentication).
5. **A `'local'` file is adopted only at the claim step** (NS-47-R7, E-S24) by the same person. Any other first sign-in finds a local file, deletes it and starts empty. Wider adoption waits for product on #934.
6. **Derived dates** such as `dismissedOn` live inside the days file, not in `settings`.
7. **Single reader behind an import-boundary test:** only the days module reads the days file; the planner gets opaque slots. [NS-47-R11; handoff section 1.5.]
8. **`culture.asked` stays in `settings`** (per account, in the backup) so it survives sign-out while the store is cleared. [Handoff draft B; card NS-47; not separately ruled in CR-69.]
9. The store exposes `subscribeDays` for the scheduler and Home, since the settings bus does not reach it. [Handoff section 1.5.]

## Consequences

- A restored phone shows an empty days list and does not ask again (Q-FD-13).
- The new rows join `eraseDeviceFiles` and the `[X4-R1]` enumeration (BL-961), and the class row goes in `docs/legal/DATA_CLASSIFICATION.md` (founder-merged; not touched here).
- Two failure tests: a fake exclusion that reads false writes 0 bytes; a corrupt file does not crash.
