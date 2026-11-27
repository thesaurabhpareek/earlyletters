# The report set: what a card needs before one person's content can reach another through our servers

Status: DRAFT. Rows are added by the card that needs them, and the exec team reads each row (D-172). Written by Claude roles, not counsel.

This is FR-POL-03 (`docs/product/prd/functions/support.md`). A card that lets one person's content reach another person through our servers or a hosted page (NS-05 Levels 2 and 3, NS-25 beyond two parents, NS-27, NS-28, NS-31) carries, before its store flag turns on, the App Store Guideline 1.2 set: a report path with an internal response time (not published, CMO-22), a block or remove path, the published contact, and a named filter method or a written reason why none applies (Apple asks for "a method for filtering", CCO-33). Level 1 share (NS-05) hosts nothing, so it needs no row. The two-parent book (NS-25) is treated as covered by 1.2, failing closed (CCO-33); App Review decides.

`packages/content/test/trust-and-safety-gate.test.ts` fails when a build switch that hosts content is on in a build that can reach someone outside the internal TestFlight group Family, and its card has no complete row here (CR-234). Today that is the App Store build only: the `apps/mobile/eas.json` profile whose `EXPO_PUBLIC_APP_ENV` is `production`, as the app decides it (`isAlphaBuild` in `apps/mobile/src/lib/billing/alpha.ts`). The `preview` and `testflight` profiles are `distribution: store` but their submit groups are pinned to exactly Family (BL-2027, CR-184), so the gate does not apply to them; before either goes to an external group or a public link, this table must be filled for it, and the test fails as soon as `eas.json` sends it beyond Family. A build added to another group by hand in App Store Connect is not visible to the test. The test still reads every profile's `EXPO_PUBLIC_*` keys, and each key must be classified in its `SWITCHES` list. Every cell must be filled; "TBD" does not count.

No card hosts content in a store build today, so the table is empty.

| Card | Report path and response time (internal, not published) | Block or remove path | Published contact | Filter method (or why none applies) |
|---|---|---|---|---|
