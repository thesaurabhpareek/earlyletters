## Group A (NS-01, NS-02) merged baeb86d6d

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

- Corrected CTO pass: pause keys are killSwitches.photos / killSwitches.bookSearch; error codes are the stack's real ones; Find index is letter_search + letter_search_rows + searchable_letters view (seal clause plugs there); no sidecar, no migration for index.
- Code gaps recorded as unmet rows: NS-01-R37a/c size caps (native 4,096 px q0.9, upright JPEG uncapped); R38b dead Undo after 10 s; R17b no iCloud progress; R39 thumbnail grows at large text; R40 Smart Invert; R42 crop; R45 free-space check; R48 lens buttons in tablist; R53 lens decodes full copies; R54 three length counters disagree; R43 kill before Review loses picture; no export of pictures (BL-933), no list/page copies (BL-932); no eas profile sets EXPO_PUBLIC_PHOTOS. NS-02-R35 rebuild one transaction; R37 failed view not announced; no debounce; reconcileSearch per sync tx; no profile sets EXPO_PUBLIC_BOOK_SEARCH.
- Open: O-1 upright JPEG keep pixels vs re-encode (default keep); D2 RN switch (mobile); thumbnail at large text (design-systems); founder: cross-book search (no), index From name (no), word approvals; counsel Q43 label read; content: pages.en.ts:240, where-it-lives keys, "yet" wording; product: BL-847 vs BL-931.
- ADR 0028 and #835 migration comment say L2 for ids; must be L3.
## Group C (NS-08 to NS-20) merged 23f45edbf; six flip conditions filled by Karma
- Code corrections: NS-13-R14 sign-out does not cancel reminders (session-provider.tsx:293-307; only erase-everything.ts:84 does); planner keys notes by kind+date so two notes a day possible (planner.ts:313-316); smart quiet ignores drafts (prefs.ts:120-131); notifications carry no prompt key (scheduler.ts:159); no remote key narrows the window; NS-16 later name silently ignored (sync.ts:157-158); held_drafts has no signature column; NS-16 limit 30 code points; NS-17 "type the words yourself" already built; NS-12 other-versions.json is local conflict copies only.
- NS-13 back-off plan specified (anchor = later of newest made letter and reminders.onSince; days 1-7 cadence; 8-35 one per 7-day block; none after 35; one a day across books; 07:00-21:30; 60 pending).
- Default NS-18 typed days not exported (privacy + counsel).
- Withdrawn: NS-10-R4 (split R4a, R4b).
- Founder: NS-08 storage path, backup of backup, drill runner; NS-13 month/birthday stop after day 35 (default stop); NS-16 Find indexes From (no); NS-20 (not built).
- Needs evidence: sync (let-go held draft server behaviour; sync_pull while consent outstanding); data-architect (held_drafts nulling words); mobile (writing tools switch; hidden-preview placeholder).
## Group D (NS-21 to NS-37, 12) merged
- Corrections: Play stays after words (letter/[id].tsx:413); export compat one-way (schema.ts:13-27); stt_meta not stored on phone, export writes null (NS-29); NS-25 signed-in link refusal unverified; NS-32-R1b P0 two notes same day; #836 writes only stored copy, derivatives follow-up; setChildQuiet has no UI (store.ts:390) though F12-REQ-011 P0; Hide lives in Me.
- Founder defaults: NS-23 switch on; #721 day-zero card leaves; keep D-053; no Accessibility Nutrition Labels until device walk; who runs NS-34 sheet.
- Eng: #797 must merge; seal publication job vs pull clause (pg_cron on Free unverified); NS-32 needs BL row, BL-943 after it; unverified: Read together keep-awake, Intl.Segmenter on Hermes, Bold Text on custom fonts.
