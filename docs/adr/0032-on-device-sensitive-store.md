# ADR 0032: An on-device sensitive store outside `scribe.db` (days, culture, and the moments index)

- **Status:** Proposed, 20 Nov 2026. The decisions are ruled in `docs/agents/cto/RULINGS.md` CR-69 A4 and `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md` (errata E37 and NS-47-R6 behind it); two-way until the code ships. Docs only.
- **Author:** `data-architect` with `mobile`. Reviewers asked: `principal-architect`, `security-architect`, `privacy`.
- **Number:** the next free id on 20 Nov 2026. ADR 0028 (`docs/adr/0028-photo-seal-find-on-device-data.md`) covers `entry_media`; this record covers files that must stay out of the iPhone backup. Warning: older design documents and CR-67 cite this number for another subject; read them through `docs/adr/CROSSWALK-new-scope.md`.

## Context

- One SQLite file is backed up whole, so a record that must be excluded from the backup cannot live in `scribe.db` (E37).
- The primitive exists: `setExcludedFromBackup(uri, excluded)` in `apps/mobile/modules/scribe-files/index.ts:11`; read-back precedent in `apps/mobile/src/lib/packs/app-support.ts` and `lib/model-files.ts`. There is no change bus on it.
- The days store holds tradition and faith-related choices; the moments index (NS-51) holds the parent's day choices and labels and no picture, album or asset id (R247, Amendment 1 item 2). Both are L4 until `privacy` rules. [Proposal: the class is not yet in `docs/legal/DATA_CLASSIFICATION.md`; founder-merged.]

## Decision (items 1 to 6 are [CR-69] A4; items 7 to 9 are proposals)

1. **Two files, one pattern.** The days store and the moments index are separate versioned files in Application Support, outside `scribe.db`.
2. **Write order:** create the empty file, set the backup exclusion, read it back, write bytes only after, read back again after the rename and on every open. A false read-back deletes the file and the store refuses to write. Leftover temp files are swept at launch.
3. **Clear order on sign-out and Erase:** delete the file first, before `forgetReminders` and any await. Every read checks the owner key and fails closed on a mismatch.
4. **File protection** no weaker than `scribe.db` (complete until first user authentication).
5. **A `'local'` file is adopted only at the claim step** (NS-47-R7, E-S24) by the same person. Any other first sign-in finds a local file, deletes it and starts empty. The claim step is the only adoption (errata E73).
6. **Derived dates** such as `dismissedOn` live inside the days file, not in `settings`.
7. **Single reader behind an import-boundary test:** only the days module reads the days file; the planner gets opaque slots. [NS-47-R11; handoff section 1.5.]
8. **`culture.asked` stays in `settings`** (per account, in the backup) so it survives sign-out while the store is cleared. [Proposal: handoff draft B; errata E37 note, `docs/product/prd/18-errata-after-lock.md:45`; not in CR-69 A4.]
9. [Proposal] The store exposes `subscribeDays` for the scheduler and Home, since the settings bus does not reach it (handoff section 1.5).
10. [Proposal, PRIV and DATA rules] Store errors (a false read-back, a corrupt file) are logged by code only, never by file contents, path contents or day ids, and never reach analytics or crash reports with those. The data-map row for the two files (DATA-REQ-001) is in the PR that builds them, which cannot merge without it. The classification row stays founder-merged.

## Consequences

- A restored phone shows an empty days list and does not ask again (Q-FD-13).
- The new rows join `eraseDeviceFiles` and the `[X4-R1]` enumeration (BL-961), and the class row goes in `docs/legal/DATA_CLASSIFICATION.md` (founder-merged; not touched here).
- Two failure tests: a fake exclusion that reads false writes 0 bytes; a corrupt file does not crash.

## Amendment 1: the moments decisions file (22 Nov 2026, status stays Proposed)

Source: `docs/product/prd/28-moments-tab.md` 17.1 and R221, R249, R250; council rulings CDO-23 and CPrivO-16 (`docs/agents/exec/RULINGS.md`). Built in `apps/mobile/src/lib/moments/` behind `EXPO_PUBLIC_MOMENTS_TAB` (off). Two-way until it ships; way back: bump `v` and rewrite the small file.

1. **A third file, same pattern.** `moments.v1.json` in Application Support, outside `scribe.db`, beside the days store. Write order, read-back and temp sweep as items 2 and 10 above. File protection as item 4.
2. **Members are exactly the R221 list:** `v`, `owner` (opaque, never a person id), `dayKeys[]` (local ISO dates), `labels{}` (day key to the parent's own words, 60 characters), `hiddenPlaces[]` (stable external place ids, never a readable name), `homePlace` (book id to one place key, one value per book, R249). Unknown fields are kept on write. A higher `v` reads as empty, writes nothing and is not deleted by an older build. A corrupt file is deleted with no message. No picture, album or asset id, no coordinate, no computed place name (R247).
3. **Class and routes.** Labels and the home-place correction are L4 (CPrivO-16): device only, never synced, in no backup, never in analytics, logs, URLs or crash reports, and nothing records that a clear happened. Export route A (default; the founder's question Q-LABELS-EXPORT is open): the labels are not in "Export everything", and the plain sentence of R250 says they stay on this phone. No export copy is added here.
4. **Retention and removal.** Kept until the parent removes a row, Turns off Moments, Erase everything or sign-out wipes the file (CDO-23 item 2; no timer). Erase everything and sign-out delete the file first and synchronously (as item 3 above); a file that will not go keeps the erase mark. Deleting a book for good removes that book's `homePlace` row in the same step. A file whose owner is `local` is adopted only by the claim step, on an explicit "Keep in this account" (NS-47-R7, E73; CPO-30, CDO-24): the owner is rewritten to the account's key, rows unchanged, nothing uploaded. A first sign-in that is not a claim deletes a `local` file, a file of a different signed-in owner is deleted, and a file is never read or overwritten by another owner. Sign-out, including "Not my account", leaves a `local` file as it was (the sign-out clear skips it); Erase everything still deletes it. (Edited 22 Nov 2026: this replaces "kept, orphaned until the Moments wave adds the claim step"; the claim step is lib/auth/local-claim.ts, for the days file and this one.) The days file keeps a `local` file at sign-out the same way (`endDaysSession`), so item 3's delete-first on sign-out applies to a file keyed to an account; a file adopted into an account goes at sign-out (BL-1598). Both files through the claim step: `apps/mobile/test/auth-claim-is-explicit.test.ts` (BL-1559).
5. **Other-device deletion.** UNVERIFIED: the file is not synced, so a book deleted on another device may leave a row until the next launch cleanup, which removes rows for books this phone no longer lists. Whether the sync pull reliably shows a deleted book is not proven; no copy may claim more.
6. **Not here:** the `docs/legal/DATA_CLASSIFICATION.md` 4.6 rows, the `docs/legal/data-policy.md` 4.4 device-store row and the account-deletion wipe list in `docs/legal/DELETION_AND_EXPORT_SPEC.md` are founder-merged legal paths; proposed rows are in the PR description.
