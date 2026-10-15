# Test evidence

One file per device session: `docs/qa/evidence/<YYYY-MM-DD>-<build>-<device>.md`, for example `2026-10-12-1.0.0(14)-se3.md`. Build is the marketing version and build number shown in Settings > About (or TestFlight). Device is a short tag: `se3`, `ip12`, `ip15`, `ipad`, `mac`, `win11`.

Rules (TDD 07 2.1, CLAUDE.md privacy rules):
- Only the fictional family appears in notes, numbers and screenshots (Asha, Avi, Mama, Papa). Never a real child's name, a real letter, a real email address or a sign-in code.
- Screenshots and screen recordings are **not** committed (COORDINATION section 8). Keep them in your own storage and write the file name in the Notes column.
- Numbers keep their unit (s, ms, MB, %; iOS reports no temperature, so write the thermal state: nominal, fair, serious, critical).
- A failure gets a GitHub issue labelled `beta` and `S0` to `S3` (TDD 07 11.3); write the issue number in the row. Issues never contain letter text either.

## Template (copy into the new file)

```markdown
# Device session <YYYY-MM-DD>, build <x.y.z (n)>, <device tag>

Tester: <initials>. iOS: <version>. Device: <model, storage free>. Build source: <EAS development | preview | TestFlight>.
Settings during the session: Dark <on/off>, text size <default/AX5>, Low Power <on/off>, network <Wi-Fi/cellular/offline>.

| ID | Result (pass, fail, blocked, n/a) | Numbers | Notes and issue | Owner doc updated? |
|---|---|---|---|---|
| S1-01 | | | | |
```

The item IDs, steps and expected results are in `docs/qa/DEVICE_TEST_PLAN.md`. When an item changes a fact in another document (a measured speed, a confirmed setting), update that document in the same pull request and tick the last column.
