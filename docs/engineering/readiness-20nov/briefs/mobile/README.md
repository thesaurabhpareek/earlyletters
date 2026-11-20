# Agent briefs: mobile lanes (RD-H1), 20 Nov 2026

Author: `mobile` for Karma. Docs only. 30 briefs, one file each, in the shape of `BRIEF-TEMPLATE.md` (PR #916), 16 fields, at most 78 lines each. Written at develop `16e61549` and the PR heads named in each brief, 20 Nov 18:46 to 19:05 UTC. Every brief starts with "re-open every file:line" and a "Blocked until" line. Tags: [V] checked in git or GitHub on 20 Nov, [E] estimate, [U] not verified. Nothing here decides a founder, counsel or product question; words are PROPOSED keys only.

Sources read: the refreshed plan (`17-engineering-project-plan.md` section 2 at `458fae46`), PRs #916, #917 (packs 0 to 4), #919 and #920 (libraries), #921 to #923 (experience, motion, delta), #924 to #927 (catalogue A to D), #914 and #915 (security), #928 to #930 (budgets, via #928 and #929), #931 to #933 (delta 3 and 6, resync list), the open handoffs #907 to #911, and the PR bodies and reviews of #835 to #840, #871, #879, #894, #895. Not read in full: catalogue D, `CODE-QUALITY-GATES.md`, `OBSERVABILITY-WITHOUT-CONTENT.md`, motion acceptance rows beyond MA-01, 03, 12.

## What I checked against GitHub first (all open at 18:46 UTC; none merged since 17:35)
#835, #836, #837, #838, #839, #840, #871, #879, #894, #895, #866, #873, #854, #758, #680, #798, #799 are open; #869 merged 12:23. No PR exists for BL-922, BL-978, BL-966, BL-943, BL-952 part 8, P-1, P-5 [V `gh api pulls`]. Handoffs #907 to #911 are open [V]. The plan's row for #894 says size "[U]": measured now, see finding 1.

## The briefs

Order is within a lane (1 first). Size S about 300 lines or less, M one or two PRs. Lens A / B as the plan names them (posted lenses differ on a few PRs; the brief says so). "Wave" is the plan's. "Blocked on" names whom.

| Order | Brief | Lane | Depends on | Size | Lens A / B | Wave | Blocked on |
|---|---|---|---|---|---|---|---|
| P1 | `BRIEF-PR835-photo-3a-migration-11.md` | photo | develop | 783 lines, 15 files | data-steward / security-architect | 1 | founder (size, #854), Karma (Q-E12) |
| P2 | `BRIEF-PR836-photo-3b-stored-copy.md` | photo | #835 | 1,015 lines, 16 files | principal-architect / compliance-engineer | 1 | founder (size, #854, character-limit line) |
| P3 | `BRIEF-PR837-photo-4a-picker-pending.md` | photo | #836 | 732 lines, 15 files | principal-architect / security-architect | 1 | founder (size, #854) |
| P4 | `BRIEF-PR838-photo-4b-home-capture.md` | photo | #837 | 629 lines, 25 files | principal-architect / design-systems | 1 | founder (size, 5 keys), product (R20b) |
| P5 | `BRIEF-PR839-photo-4c-letter-page.md` | photo | #838 | 603 lines, 17 files | principal-architect / design-systems | 1 | founder (size, 13 keys), product (C-01, N7) |
| P6 | `BRIEF-PR840-photo-5-photos-lens.md` | photo | #839 | 342 lines, 12 files (inside CODE-R02) | design-systems / principal-architect | 1 | founder (1 key), product (C-09) |
| P7 | `BRIEF-BL953-stored-copy-cap.md` | photo | BL-931 | S | principal-architect / security-architect | 2 | BL-931 |
| P8 | `BRIEF-P1-icloud-progress-and-cancel.md` | photo | BL-931, BL-953, BL-878 | S | principal-architect / security-architect | 1 | founder (word), an id |
| P9 | `BRIEF-BL957-one-length-rule.md` | photo | #836 (soft) | S | principal-architect / data-steward | 2 | nothing hard |
| P10 | `BRIEF-P5-pictures-follow-the-letter-tests.md` | photo | #835 | S, tests | data-steward / compliance-engineer | 2 | #835 |
| P11 | `BRIEF-BL954-undo-windows.md` | photo | BL-931 | S, 2 PRs | design-systems / principal-architect | 2 | product (C-02) |
| P12 | `BRIEF-BL955-picture-survives-kill.md` | photo | BL-931 | S | principal-architect / data-steward | 2 | Karma (E2) |
| P13 | `BRIEF-BL932-list-copies.md` | photo | BL-931, BL-953 | M, 3 PRs | principal-architect / security-architect, data-steward | 2 | product (NS-52 shape) |
| P14 | `BRIEF-BL956-pictures-large-text-invert-fit.md` | photo | BL-932 | M, 2 PRs | design-systems / principal-architect | 2 | design-systems (88 pt), product |
| P15 | `BRIEF-BL933-export-1-7-0.md` | photo | BL-868, BL-931 | M, 2 PRs | data-steward / compliance-engineer | 2 | founder (BL-868 legal merge), Karma (minor) |
| F1 | `BRIEF-PR894-find-6-words-pause-switch.md` | find | #885 (merged) | 228 lines, 12 files (not 2,077) | principal-architect / compliance-engineer | 1 | founder (12 words) |
| F2 | `BRIEF-PR895-find-7-wiring.md` | find | #894; #879 for the guard | 338 lines, 12 files | principal-architect / compliance-engineer | 1 | #894, #879, device row S1-205 |
| F3 | `BRIEF-BL952-8-find-mode-and-header.md` | find | #894, #895, #840, #879 | M, 2 PRs | principal-architect / compliance-engineer | 1 | content (R39 reword), product (C-09) |
| A1 | `BRIEF-PR871-bl961-2-account-cover.md` | account | #869 (merged) | 385 lines net, 11 files | principal-architect / security-architect | 1 | founder (held-screen words) |
| A2 | `BRIEF-PR879-bl961-3-store-reads.md` | account | #871 | 341 + 24 lines, 9 files | principal-architect / security-architect | 1 | #871 |
| A3 | `BRIEF-BL922-held-screen-and-one-reader.md` | account | #871, #879 | M, 2 PRs | principal-architect / security-architect | 1 | #871, founder (words) |
| A4 | `BRIEF-HO911-delete-account-second-account.md` | account | #879 | S, about 80 lines | security-architect / compliance-engineer | 1 | #879 |
| A5 | `BRIEF-BL978A-new-phone-retry-method-switch.md` | account | BL-922 | M, about 300 lines | principal-architect / security-architect | 1 | BL-922, founder (R12 line) |
| A6 | `BRIEF-BL978B-book-level-recordings-line.md` | account | BL-978a, BL-965 words | M, about 300 lines | principal-architect / design-systems | 1 | founder (words) |
| R1 | `BRIEF-BL966A-notification-budget-registry.md` | reminders | none | S, about 250 lines | principal-architect / compliance-engineer | 1 | Karma (Q-E1), founder (Q8), product (R4b) |
| R2 | `BRIEF-BL966B-planner-one-a-day.md` | reminders | 966a | M, about 350 lines | principal-architect / compliance-engineer | 1 | 966a, Q-E1 |
| R3 | `BRIEF-BL966C-categories-placeholder-interruption.md` | reminders | 966b | S, about 150 lines | principal-architect / compliance-engineer | 1 | founder (placeholder words), Karma (key name) |
| R4 | `BRIEF-HO908-planner-account-guard.md` | reminders | #879 | S, about 60 lines | principal-architect / compliance-engineer | 1 | #879 |
| R5 | `BRIEF-HO910-reminders-account-gone-and-upgrade.md` | reminders | #879 (case 1) | S, 2 PRs | principal-architect / compliance-engineer | 1 | #879, Karma (which builds shipped) |
| R6 | `BRIEF-BL943-reminders-anchor-backoff-landing.md` | reminders | 966a to 966c | M, 3 PRs plus docs | principal-architect / compliance-engineer | 2 | BL-966, founder (Q2), Karma (OQ-13.3, OQ-13.4) |

Not briefed, with the reason: #798 and #799 (Karma disposes of #798, the legal row is the founder's); BL-868, BL-870, BL-959, BL-960, #854, #873, #907, #909 (other lanes: data, sync, privacy, legal, security); BL-925, BL-926, BL-977, P-4 (keeping lane, not mine); BL-937, BL-938, BL-939, BL-946, BL-982, BL-985 and later waves (blocked behind the briefs above; write them when their blockers merge); device rows S1-204, S1-205, J-N rows (qa). NS-10 rows R1, R6, R14 are two-phone device rows (qa); R9 waits for `sync`'s answer (OQ-6).

## Findings that change the plan (each also in the brief)
1. #894 is not 2,081 lines. GitHub counts the squash-merged #881 to #885 under it. The merge result against develop is 12 files, +228/-4 [V `git merge-tree --write-tree`]. It needs no size exception and the "dirty" flag is stale: the local merge is clean. Merge develop into the branch and re-read the head.
2. Plan 2.3 says BL-922's "922b is #869". It is not: #869 is the pure `bookVisibleTo`. The consent sheet still calls `readAccountBooks` twice (`consent.tsx:134`, `:151`) and the test pins it (`first-run-new-account.test.ts:152-156`) [V]. BL-922 has no PR.
3. Q-E12 (migration 11 amended in #835 for several pictures and video, or migration 12 later) is Karma's and must be ruled before #835 merges (PR #932, PACK-DELTA-3 section 3.2).
4. `budget.ts` has two shapes (a pure chooser in the handoff, a class registry in our design: Q-E1). The test titles hold under both; the exports wait.
5. The planner guard (#908) and the Delete-account guard (#911) both need `bookVisibleNow`, which only #879 adds. NSC-03 stays open for reminders until HO-908.

## Conflicts for product and Karma (written as Conflict lines; I did not build either way)
- NS-01-R20b (Change last in VoiceOver) against #838 (Change under the picture). Plan M30; RN reading order is experimental.
- Picture above the words (card, e2e B-S08) against after the words (#839). DESIGN-DELTA C-01.
- Undo clock: card windows against a toast that never times out (C-02); `components/ui/toast.tsx` is design-systems'.
- "Months" twice in one Book bar (C-09). "Start from a photo" weight (C-08).
- NS-32-R4b: plan notices at the 64 ceiling against the design's 60 in total (Conflict P1).
- BL-955: backlog says write the copy when the pick returns; the card title says nothing is kept before Review. E2: encoding during a take breaks NS-37-R2.
- NS-52 (several items, video) and NS-51 (photo moments) would change #835, BL-932, BL-933: unlocked, not built to.
- Key name for the placeholder: `notifications.previewPlaceholder` (09-capture design) against `reminders.previewPlaceholder` (11-foundations).
- Handoff #908 cites `lib/store/repos/children.ts:26-27`; the file is `lib/db/repos/children.ts:54`.

## Needs the founder
Size exceptions at the new sizes for #835 to #839 (783, 1,015, 732, 629, 603; #840 needs none); #854 merged first; reading the PROPOSED words (Find 12 lines in #894, photo keys in #838 to #840, held-screen words in #871, R12 and BL-978b lines, the placeholder); the character-limit line; Q8 (the cap); BL-868's legal merge before BL-933.

## Cites
Sampled about 60 file:line cites across the briefs against develop `16e61549` and the PR heads. All held except: `consent.ts:117` (now `:113`), `prefs.ts:116` (now `:127`), `preflight-testflight.mjs:636` (now `:644-646`), `photos/device.ts:95` (now `:102-104` at #839), `lib/store/repos/children.ts` (does not exist), `debounce.ts:10` (now `:9`, `:26`). Each is corrected in its brief. Not verified: the content of catalogue D, `getLastNotificationResponse` on 57.0.21, `fractionCompleted` for iCloud loads, any phone behaviour.
