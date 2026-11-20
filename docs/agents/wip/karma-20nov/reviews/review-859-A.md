## Review A at a789fc997ca1663699faeba04c2dfc1e27030b9a: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/privacy.md`, 274 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 30 cites against `develop` and the named PR heads. All hold; one names a function loosely (on #839 at `279ba898`, `store.ts:1311, 1328` call `eraseDraftPicture`, not `erasePictureOf`; the claim, that let-go removes the picture first, holds). Examples: versions are written by trigger (`scribe_core.sql:213`; `20261016000000:598`) and the policy does not name them (`privacy-policy.md:35`); `closeBook` removes other authors' letters (`merge.ts:843-848`); the recovery export copies `scribe.db` and its WAL as they sit (`recovery-export.logic.ts:34`); the policy says the build has servers off (`privacy-policy.md:21`) while the label file says Build 12 is servers on (`app-store-privacy-labels.md:84`); the export spec still promises original bytes (`DELETION_AND_EXPORT_SPEC.md:335`); the backup bucket exists in a migration (`20261023000000_backup_server.sql:677`); `mustBeL4` (`classification.test.mjs:24`); `erase-all.test.ts:628`.
- Boundaries: no founder or counsel question is decided outside this steward's lane. Label changes, policy text, retention and the X2 reading are founder or counsel items with defaults (section 6). Words are PROPOSED keys. The NS-05 picture and NS-03 Arm V stay behind both reads.
- Contracts and code shape: the per-card table names every store, its level and its eraser. Section 4's one inventory PR, with rows carrying a status, keeps code PRs small; K-2's paired-PR rule (no profile turns a flag on before the inventory PR merges) can be a G6 preflight input (`architecture.md` AP-1).
- Buildability: section 5 maps each control to an existing test file or a new title with an owner. The J-N18 field list is the one `architecture.md` AP-9 adopts.

## Findings (none blocks)
1. CR-67 AX-5: the NS-17 row says the withheld flag is "also on `held_drafts`" and "the server copy emptied at the mark" (eval A S3, `data-and-sync.md` S3). CR-67 holds S3 until the founder's reading of the constitution. Section 1.9 states the requirement either way, which is right; make the table row say "pending the founder's reading" on next touch.
2. CR-67 AX-10: section 1.4 rules that the author's export carries the author's versions. CR-67 gives that decision to the founder; until then, not exported. Section 4 and the NS-12 table row should carry the CR-67 default. Contract note for the founder's packet: "fetched at export time when signed in" makes export need the network for one part. If chosen, it must be best-effort and never block or fail the export, which works offline today.
3. Cross-design: the notification placeholder key here (`notifications.previewPlaceholder`, after `09-capture.md`) differs from `11-foundations.md` (`reminders.previewPlaceholder`, `planReminders.previewPlaceholder`). Re-key after BL-966 (c) settles it.
4. Section 4 row 5 says the NS-17 names come from "`data-and-sync.md` L15 or eval A row 15, whichever lands". `data-and-sync.md` now adopts eval A's names (CR-67 AX-13). Cite L15 only.

## CI
All checks green at the head. The head was older than 10 minutes when I finalised.

## Not verified
- Section 8's phone items (per-file backup exclusion, Caches and backup, FTS5 `secure-delete`, WAL residue).
- That P1's phone drops P2's letters after P2's account deletion.

Reviewer: independent of the author (CR-44).
