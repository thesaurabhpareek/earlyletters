# The report set: what a card needs before one person's content can reach another through our servers

Status: DRAFT. Rows are added by the card that needs them, and the exec team reads each row (D-172). Written by Claude roles, not counsel.

This is FR-POL-03 (`docs/product/prd/functions/support.md`). A card that lets one person's content reach another person through our servers or a hosted page (NS-05 Levels 2 and 3, NS-25 beyond two parents, NS-27, NS-28, NS-31) carries, before its store flag turns on, the App Store Guideline 1.2 set: a report path with a stated response time, a block or remove path, the published contact, and a filter decision. Level 1 share (NS-05) hosts nothing, so it needs no row. Whether the two-parent book (NS-25) counts as user-generated content under 1.2 is UNVERIFIED; counsel must confirm.

`packages/content/test/trust-and-safety-gate.test.ts` fails when a build switch that hosts content is on in the App Store build and its card has no complete row here. The App Store build is the `apps/mobile/eas.json` profile whose `EXPO_PUBLIC_APP_ENV` is `production`, as the app decides it (`isAlphaBuild` in `apps/mobile/src/lib/billing/alpha.ts`). The `preview` and `testflight` profiles are also `distribution: store`, but they are alpha builds and this check does not read them, so a hosting switch on for TestFlight testers is not gated here. Every cell must be filled; "TBD" does not count.

No card hosts content in a store build today, so the table is empty.

| Card | Report path and response time | Block or remove path | Published contact | Filter decision |
|---|---|---|---|---|
