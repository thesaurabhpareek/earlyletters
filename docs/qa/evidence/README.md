# Test evidence

One file per device session: `docs/qa/evidence/<YYYY-MM-DD>-<build>-<device>.md`, for example `2026-10-30-1.0.0(14)-se3.md`. Build is the marketing version and build number shown in Settings > About (or TestFlight). Device is a short tag: `se3`, `ip12`, `ip15`, `current`, `ipad`, `mac`, `win11`. A session that uses two or three phones at once (sign-in, co-parent, sync, backup) is one file named after Phone A, with every phone in the header. A rehearsal with no phone of its own (`docs/qa/run-sheets/AL-10-rehearsals.md`) is `<YYYY-MM-DD>-rehearsal-<name>.md`, and a simulator kill harness gate run is `<YYYY-MM-DD>-<build>-sim-kill.md`.

Rules (TDD 07 2.1, CLAUDE.md privacy rules, LEGAL-REQ-014):
- Only the fictional family appears in notes, numbers and screenshots (Asha, Avi, Mama, Papa). Never a real child's name, a real letter, a real email address or a sign-in code.
- Server-on rows add more things that never go in evidence: user ids, invite links or tokens, magic links, session or refresh tokens, Keychain item names or contents, key material, Supabase project keys, push tokens. Name accounts and phones by label instead (Drill Mama, Account A; Phone A, Phone B) and keep the mapping in your own notes.
- Drills run only on drill phones and drill accounts (`docs/qa/run-sheets/README.md` "Drill identities"); the evidence file records the drill-phone check for each phone.
- Screenshots and screen recordings are **not** committed (COORDINATION section 8). Keep them in your own storage and write the file name in the Notes column.
- Numbers keep their unit (s, ms, MB, %; iOS reports no temperature, so write the thermal state: nominal, fair, serious, critical).
- A row that needs the server switch on, run on a build with the switch off, is `blocked` with the reason "switch off", not `fail`.
- A failure gets a GitHub issue labelled `beta` and `S0` to `S3` (TDD 07 11.3); write the issue number in the row. Issues never contain letter text either.

## Template

Copy `TEMPLATE.md` (in this folder) to the new file name and fill it in during the session. Row IDs, steps, expected results and the numbers each row must carry come from the run sheet (`AL-01.0` and on for the alpha drills, `docs/qa/run-sheets/`) or from the item's **Record** line in `docs/qa/DEVICE_TEST_PLAN.md` (`S1-01` and on). When an item changes a fact in another document (a measured speed, a confirmed setting), update that document in the same pull request and tick the last column.

S19 owns the template; any stream may add a new evidence file for its own spike or device run, and nobody edits another stream's evidence file (PRD V2 08 section 4).
