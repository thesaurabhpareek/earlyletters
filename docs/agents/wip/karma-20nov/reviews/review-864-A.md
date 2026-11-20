## Review A at b46f2e75f1728409430190b543f7d4b85f006fba: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/11-foundations.md`, 367 lines (under 400, so no split; CR-67 AX-16), ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 50 cites against `develop` `1513b265` and the named PR heads. All hold; two are off by one line (the picker read is `ScribePhotoModule.swift:185`, with `:186` the write; the module's caps are at `:50-51` as cited). Examples: an action toast never times out (`components/ui/toast.tsx:10-12`); four hand-made progress bars (`storage.tsx:51-61`, `review.tsx:1312`, `export.tsx:228`, `speech-consent-card.tsx:167`); `prefs.ts:116` ignores `quiet` and `store.ts:388` says otherwise; plan notices are capped at 4 with prefix `plan.` (`plan-reminders.logic.ts:48, 50`); the dateline has no heading role (`app/letter/[id].tsx:219`); Me's `headerTitle` is `copy.settings.title` (`(tabs)/_layout.tsx:91`); `currentUserId()` returns the stored owner (`store.ts:432-434`); Months uses the virtualised `AnimatedSectionList` (`book.tsx:78`); export is 1.6.0 (`schema.ts:90`).
- Card rows: the P0 lists for NS-32 (R1, R1b, R4, R4b, R8, R11, R12, R14), NS-33 (R1 to R10, R12, R15, R16), NS-34 (R2, R5, R6), NS-36 (all but R9) and NS-37 (R2, R4, R5) match `14-test-plan.md` section 7. Each row has a named test or device row.
- Boundaries: no founder or counsel question is decided (accessibility declarations, the cap, stand-in sample counts, proof-book spend, Tiro, Q41 are OQs with defaults). Words are PROPOSED keys. X2: copies and pictures never leave the phone; the export path is the parent's own act.
- Buildability, waves 1 and 2: NS-32, NS-33, NS-36 and NS-37 each give PRs in merge order with an owner, two lenses and a size; section 11 orders them across the file. Shared helpers once (`createUndo`, `progress-bar.tsx`, `captureBusy()`), and a model (`allocate()`) both schedulers call, are the right shape. CR-67 AX-11 rules the undo clock this file's way.

## Findings (none blocks)
1. Cross-design, one definition: notifications. Section 2 uses categories `reminder` and `plan` with keys `reminders.previewPlaceholder` and `planReminders.previewPlaceholder`, plus `app.lastPlannedVersion`. `09-capture.md` 1.3 and `privacy.md` section 2 use one key, `notifications.previewPlaceholder`, and `09-capture.md` 1.2 says every launch already re-plans (NS-13-R21 by construction). BL-966 (c) lands first: settle the names there, and drop the version key unless a test shows a launch that does not re-plan.
2. Cross-design: section 6 R1d says "`sync` narrows `photo_path` to null in `packages/api`". `data-and-sync.md` C1 recommends no narrowing, because `EntryData` has no such key (`sync.ts:222-267`). I agree with C1; drop the narrowing here.
3. Cross-design: two tests for NS-36-R11. 36-4 adds `supabase/tests/entries_content_columns.test.mjs` (owner `data-architect`); `data-and-sync.md` T1 puts the same guard in `packages/api/test/contract-drift.test.ts` (owner `sync`). One rule, one test.
4. A new native module. Section 7 reads Low Power Mode through eval B's new `scribe-system` module; `08-keeping.md` names `expo-battery` (MIT) as the candidate. A new module needs the line on why nothing installed fits (brief rules) and the NSC-01 route. Pick one before BL-932 (c).
5. CR-67 AX-12: section 6.1 adopts eval B's `scopeOf`. CR-67 and `08-keeping.md` name the check `bookVisibleTo`. Use one name; BL-961 owns it.
6. 33-6 adds a standalone XCUITest project (`apps/mobile/a11y-audit/`). It is test tooling outside the binary, but it is a new build surface with macOS CI minutes; the CI step is a proposal under `docs/ops/proposed/` as written. Keep it out of `apps/mobile`'s workspace so `npm test` and `typecheck` do not pick it up.

## CI
All checks green at the head. The head was older than 10 minutes when I finalised.

## Not verified
- The section 12 platform items (`active` needs no entitlement, iOS above 64 pending, `previewPlaceholder` mapping, decode threads, iCloud `Progress`).
- The contrast numbers in 1.3 (not recomputed).

Reviewer: independent of the author (CR-44).
