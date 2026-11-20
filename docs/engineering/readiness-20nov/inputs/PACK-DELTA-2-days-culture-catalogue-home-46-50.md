# Pack delta 2: cards NS-46 to NS-50, days we mark, cultural background, notification catalogue, picture-first, Home today

Status: v1, 20 Nov 2026, `principal-architect`, RD-A. Part of `PACK-DELTA.md`. Source: `docs/product/prd/21-days-cultural-photos-home.md` at `cfeca754` (1,199 lines, 182 rows, 87 P0), status "Final holistic draft ... still needs Karma's ruling ... and the founder's answers" (`21:3`); `22-final-holistic-spec.md` sections 2, 3, 4; `24-engineering-handoff.md` (called `24:n`, the principal-architect handoff written before cards 51 and 52 existed, `24:11`); ten reviews in `tools/review/ns46-50/`. Not in #846. [V] verified, [E] estimate, [U] not verified. Design file names: ARCH architecture, SEC security, PRIV privacy, DATA data-and-sync, 08, 09, 10, 11 (all in `docs/tdd/new-scope/`).

## 1. What these five cards are, for engineering

One feature family that the locked pack does not have: a library of days the parent ticks, an optional cultural ask, a catalogue of reminder words, a first-class picture start and one more Home slip rank. Two properties make it expensive: almost nothing it needs is built, and its data class (L4: faith and origin) forces a new on-phone store outside `scribe.db`.

Built today (read on develop `16e61549`): the planner has three kinds `'evening' | 'monthAge' | 'birthday'` (`planner.ts:111` [V]); evening horizon 21 days and month and birthday horizon 92 (`planner.ts:91-94` [V]); cap 60 (`planner.ts:295` [V]); a separate plan-notice scheduler caps at 4 (`plan-reminders.logic.ts:48` [V]); no `budget.ts`, no `lib/days`, no slip registry, no notification category, no `libraryDay` anywhere (`git ls-tree` over develop finds none [V]). The Home slot renders drafts directly (`24:41`).

## 2. Rows that create engineering work, by card

Verdict legend: NO DESIGN YET; HOLDS; AMEND (design needs amendment); CONFLICT (conflict with locked pack, to product).

### NS-46 Days we mark (50 row ids, 22 P0; drop B except R14, R20 in C)

| Row | What changed for engineering | Design file or plan row hit | Wave, size [E] | Verdict |
|---|---|---|---|---|
| NS-46-R4, R5b, R6, R9 to R11, R25, R29 to R31, R33 | Pure rules in `packages/core/src/days.ts` (new), `DayLayer` and `DayTone` once in `domain.ts` (CODE-R10, R13); table data in `packages/content/src/days/`; phone module `apps/mobile/src/lib/days/` (name PROPOSED, `24:27`); ticked days stored as ids and overrides, never copied dates; re-resolved on every plan | ARCH 1.2 module table (`architecture.md:42-62`) has no days module; PRIV 4 inventory; plan row BL-982, BL-966 | W3, L | NO DESIGN YET |
| NS-46-R12, R24, R30 | Calendar oracle 2026 to 2030 as a unit test; `daysDueOn` with injected today; property test "no date holds two budgeted notes"; astronomical instants resolved to a local date | 11 NS-32 tests (`11-foundations.md:75`) cover R1 and R1b only | W3, M | NO DESIGN YET |
| NS-46-R29 to R33 | Planner gains `libraryDay` and `typedDay` kinds plus a `group` field; day-only gate beside `prefs.enabled` (`planner.ts:286`, `scheduler.ts:137`); first-tick permission door; horizon 366 days (Q-FD-22) inside the ceiling; tap routes to Home, not Book (`scheduler.ts:257` routes every non-evening kind to `/book` [V]); re-plan on `subscribeDays` | 09 section 1.3 planner design (`09-capture.md:38`), 11 section 2 NS-32 | W2 to W3, M | AMEND 09 1.3 and 11 section 2 |
| NS-46-R30 (budget) | `budget.ts` as a pure chooser `chooseOnePerDay(candidates, planNoticeCount)`, order typed day, birthday, `libraryDay`, `monthAge`, `evening` (`24:35`). Our 11 section 2 designs `budget.ts` from #758 as a class registry with `allocate({ planPending, budgeted })` and keeps `addNotificationClass` (R15) (`11-foundations.md:61`) | 11 NS-32 PRs (a) to (c) (`11-foundations.md:78-80`); plan row BL-966 | W1, M | AMEND 11 section 2 (two shapes for one file; handoff C-1, Q-E1) |
| NS-46-R28 (pause), R42 | Phone-only flag `EXPO_PUBLIC_DAYS` and `killSwitches.libraryDays` read outside `mayRun` (TestFlight runs servers off, E20); pattern from #894 (`lib/find/flag.ts`, `pause.ts`) | ARCH AC-11, AC-13 (`architecture.md:112-114`), AX-4 (`:161`) | W2, S | AMEND ARCH AX-4 |
| NS-46-R34, R36, R37 | Analytics: four never-reported kinds; neutral title and body once each; content families `days.*` exported under `ALL` so the rules test reads them (qa F-01) | 11 section 9 notes; packages/content test | W2, S | NO DESIGN YET |
| NS-46-R23, R44, R48 | Counsel on any copied table (FR-DAY-23), annual October review, a remote pause and a same-day review trigger | ops runbooks | gate | NO DESIGN YET (ops) |

Open conflict inside NS-46: BL-982 stores typed days as `settings` keys `typedDay.<yyyy-mm-dd>` and `typedDay.showWords` (our `09-capture.md:165`) while NS-47 puts the ticked-day store outside `scribe.db` and out of the backup (handoff C-20, Q-E5). Two stores for one Days page. Send to Karma; our 09 paragraph is wrong if Q-E5 is answered "one store".

### NS-47 Cultural background (38 row ids, 27 P0; drop B for store rules, C for the ask)

| Row | What changed | Design file hit | Wave, size | Verdict |
|---|---|---|---|---|
| NS-47-R1, R4, R6, R8, R11, R15 to R17, R28 | One versioned file in Application Support (not Caches), exclusion set and read back at create and open, protection class no weaker than SEC-R15's, atomic write, fail closed with local code `days_store_unavailable`; one reader (import-boundary test); cleared at sign-out, Erase everything and Delete account; only ticked days kept (L4) (`24:55-61`) | PRIV 4 inventory (add L4 rows; the home file is `docs/legal/DATA_CLASSIFICATION.md` section 4.6, card says `docs/privacy/` which does not exist, handoff C-15), SEC cross-cutting controls (`security.md:46-62`), DATA 2.5 erase list (`data-and-sync.md:77`) | W3, L | NO DESIGN YET (ADR B) |
| NS-47-R5 | A day reminder opens an ordinary prompt; `entries.prompt_key` never carries a day (`supabase/migrations/20261002020000_data_governance.sql:1116`, `24:101`) | DATA 2.4 sync contract | W3, S | HOLDS (no sync change) |
| NS-47-R12, R13, R36, R38 | Day names behind a separate switch, forced off when App lock is on, stored value cleared; `publicTitleOk` allowlist; one neutral title and body; categories with `previewPlaceholder`; no day name beside a child name | SEC section 3.11 notifications (`security.md:253`), 09 section 1.3 `previewPlaceholder` (`09-capture.md:57`) | W3, M | AMEND SEC 3.11 |
| NS-47-R34 | Analytics stems list plus enum-value and event-name test in `packages/analytics/test/` (`catalog.test.ts:19` checks property keys only, `24:90`) | none | W2, S | NO DESIGN YET |
| NS-47-R6 vs R7 | Card contradicts itself: a restored phone asks again vs `culture.asked` surviving sign-out (handoff C-18, privacy F1) | n/a | n/a | CONFLICT (card-internal; to product) |

### NS-48 Notification catalogue and rotation (39 row ids, 13 P0; drop A phase 1, C layers)

| Row | What changed | Design file hit | Wave, size | Verdict |
|---|---|---|---|---|
| NS-48-R1, R2 | Pure `selectNotificationKey(cell, slotOrdinal)` in `packages/core/src/notification-key.ts` (PROPOSED); planner gets a `select` seam; "last chosen key" setting removed (RV-14); `planSignature` must stay identical on a re-plan (`planner.ts` signature, `scheduler.ts:144-146`, `24:48`) | 09 section 1.3 design | W1 (phase 1), M | AMEND 09 1.3 |
| NS-48-R11, R28 | "A title never carries `{child}`" against built named titles `strings.en.ts:690-698` (handoff C-14); content families `ntc.*`, `notifications.dayNames.*` not read by `rules.test.ts` (`rules.test.ts:97-98`, `:161`, `:266-269`) until exported (`24:95`) | none | W1, S | CONFLICT for C-14 (to product); NO DESIGN YET for the drift test |
| NS-48 recency and last-letter layers (drop C) | Need one indexed `lastMadeLetter()` query (the planner today loops `listEntriesForChild` on every store write, `24:49`) and the NS-13 anchor and back-off (BL-943 / BL-537, not built) | 09 NS-13 | W4, M | NO DESIGN YET |
| NS-48-R31 | Tap payload stays `{ source, kind }`; no key, variant or day in `data`, `identifier`, `threadIdentifier`, `categoryIdentifier` | SEC 3.11 | W1, S | HOLDS |

Drop A is words only (day-part filter, weekday tone, the built 8 re-keyed, rules-test coverage; `22:61`), so it is the cheapest part of the whole family and does not wait for BL-966 (`24:227`).

### NS-49 Picture-first start and Journaling Suggestions (37 row ids, 21 P0; level 1 drop A, level 2 drop C)

| Row | What changed | Design file hit | Wave, size | Verdict |
|---|---|---|---|---|
| NS-49-R1, R5 (level 1) | The picture start becomes a first-class capture start through `startCapture({ source })` (closed list `HOME_CAPTURE_SOURCES`); sits on the photo stack #834 to #840 | 11 section 8 NS-01 record (`11-foundations.md:254`), SEC 3.1 (not redesigned), 09 | W3, S | HOLDS for the pick path; but see delta 3 (NS-52 changes the picker to multi-select) |
| NS-49 level 2 (R5, R15, R19, R28, R31, R34, R35; R20 to R22 only for Apple's own notification, spike) | New native boundary in `scribe-photo`: weak-link `JournalingSuggestions` (`s.weak_frameworks`), `@available(iOS 17.2, *)`, `isAvailable()` false on Simulator, iPad, Mac, below 17.2, `pickSuggestion()` returns a plain object; no title or date for a no-photo pick; copy the file then delete only our copy; entitlement `com.apple.developer.journal.allow` on the App ID (founder, Q-FD-11); podspec floor fix `ScribePhoto.podspec:9` says 16.4 while `app.config.ts:44` is 17.0 [V] | SEC 3.1, new spike SP-PHS-1 | W5, L | NO DESIGN YET |
| NS-49-R6, R25, R26 | "No photo-library permission, no PhotoKit call, no background mode" scans. Overridden by founder round 2: level 3 becomes NS-51 (`27` "Changes to locked cards"); R25's scan becomes an allow-list for one module | SEC section 3.1 source scans | W5 | CONFLICT (see delta 3) |

### NS-50 Home today (18 row ids, 4 P0; drop B, rank 2b)

| Row | What changed | Design file hit | Wave, size | Verdict |
|---|---|---|---|---|
| NS-50-R5 | Slip order is one ordered registry: (1) waiting set, (2) seal opened, (2b) a day the parent chose, today, (3) Save a copy, (3b) the Days ask, (4) one past letter (`22:41`). Our `10-reading-and-family.md:131` defines `HOME_SLIPS = ['waiting', 'sealOpened', 'saveACopy', 'pastLetter']` and `[FRAME-SLIP]` | 10 section 3 NS-23, ARCH AP-10 (`architecture.md:132`) | W3, S | AMEND 10 section 3 (absent ranks must be accepted so 2b and 3b can ship before 2 and 3, `24:42`) |
| NS-50-R9 | Blank-on-background for Home and Me with or without App lock (`privacy-cover.tsx` draws only under the lock layer, `24:44`) | SEC cross-cutting, E18 | W2, S | AMEND SEC |
| NS-50-R5 (Days ask) | The Days ask joins `lib/asks/next-ask.logic.ts` (`MAX_REMINDER_PRIMES = 2`) and counts as that day's ask | 09 | W4 | NO DESIGN YET |

## 3. New ADRs the handoff proposes (none exists; `ls docs/adr` ends at 0028 and 0101 [V])

`24:165-180` lists A1 (phone-only flags and pause), A2 (amend 0032: one budget), A3 (amend 0033: slip registry), B (on-device sensitive store), C (notification privacy), D (pure notification selection), E (one age function in core), F (suggestions), G (library read), H (media), I (days data), J (export minor). Our `architecture.md:21` took "no new number" and adopted eval C's reservation 0029 to 0039. Numbers are Karma's (`24:279` Q-E16). This means ADR 0029, 0032 and 0033 cited by cards and by our designs are not files (`24:195` C-7) [V].

## 4. Conflicts to send to product (CONFLICT WITH LOCKED PACK or card-internal)

1. NS-47-R6 vs R7 (restored phone). Card-internal. Handoff C-18.
2. NS-48-R11 vs built named titles. Handoff C-14. Is the built `{child}` title a locked behaviour? [U: locked NS-13 row text not re-read for names].
3. NS-50-R5 changes the registry order that locked NS-23 and NS-32-R5 state (`11-foundations.md` and `10-reading-and-family.md:131` follow the lock). Product should list the exact locked ids it edits in the errata PR (`27` "Changes to locked cards" does the same for NS-01, NS-49, NS-32, NS-35).
4. BL-982 typed days storage vs NS-47 store (handoff C-20).
5. Card 21 cites `docs/privacy/DATA_CLASSIFICATION.md` section 4.5 (C-15); correct is `docs/legal/DATA_CLASSIFICATION.md` section 4.6. `docs/legal/**` is founder-merged.
6. Card 21 and GAP-LOG cite "ADR 0029" as if it existed (C-7).
7. Backlog ids: NS-46 to NS-52 need about a dozen rows; BL-999 is the last the dispatcher reads (`BACKLOG.md:4058` block, C-9).

## 5. What NS-46 to NS-50 do to the plan and the designs (summary)

- Plan #847: no row exists for any of the five cards (`24:197` C-10); the plan's `budget.ts` row BL-966 must be rewritten to the chooser (C-1, C-2), BL-963 gains ranks 2b and 3b, BL-982 depends on Q-E5.
- Design 11 section 2 (NS-32), 09 section 1.3 and section 5 (NS-18), 10 section 3 (NS-23), SEC 3.11, ARCH AX-4 and AC rows, PRIV 4: each needs the amendment named in section 2. DATA changes none (the cards say "Migrations: none", `24:100-105`; one open check: `child_member_prefs.celebrations_paused` read by NS-46-R49 may not reach the phone, Q-E10).
- Gates before any flag outside the founder's family: G0 to G6 (`22:89-99`). Counsel reads: CUL-Q5 to Q7, Q11, FR-DAY-23, the consent line.
