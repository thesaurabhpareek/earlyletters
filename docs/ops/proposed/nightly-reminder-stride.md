# Proposal: nightly runs the reminder planner on every day of the year

Status: proposal, 21 Nov 2026, from the review follow-ups on #1321 and #1322 (BL-443). This pull request changes nothing under `.github/` (the Claude GitHub App cannot edit workflows). **Applying it is a founder go**: the founder pastes the step into `.github/workflows/nightly.yml`.

## Why

`apps/mobile/test/billing-plan-reminders.test.ts` ("a synthetic year") reads `SCRIBE_REMINDER_STRIDE`. Pull requests and `unit` check every 15th day (about a third of the work). Only the value `1` checks every day. Nothing sets it today, so the full-year check never runs anywhere since the coverage-only skip was removed in #1322.

## The exact change

`docs/ops/proposed/workflows/nightly-reminder-stride.patch` adds one step to the `fuzz` job of `nightly.yml`, after "Property test": it sets `SCRIBE_REMINDER_STRIDE=1` and runs `npm test -w @scribe/mobile -- test/billing-plan-reminders.test.ts`. No action pin, permission or secret changes. Apply with `git apply docs/ops/proposed/workflows/nightly-reminder-stride.patch` (or paste the step by hand if the context lines have moved).

## Cost and risk

About 70 s plain on a quiet runner; the `fuzz` job has 15 minutes and uses about 1 to 2 now. A red run opens the usual `nightly` issue. The test takes the value 1 to 15 only and throws on anything else, so a typo fails loudly and not quietly.

## Way back

Delete the step.
