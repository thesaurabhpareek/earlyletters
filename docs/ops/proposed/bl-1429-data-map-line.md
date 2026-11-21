# Proposed data-map line for BL-1429 (held for the founder: docs/legal/** is legal text, D-125)

Status: proposed. Not applied. PR #1351 carries the code and catalogue change only.

## What the line says
Under `docs/legal/DATA_CLASSIFICATION.md` section 4.7, as a new paragraph:

> Change on 21 Nov 2026 (catalogue `SCHEMA_VERSION` 9, BL-1429, DATA-REQ-001): `reminder_prime_shown.source` gains the value `first_month` (L2, a fixed enum value) so the second reminder card, after the first month chapter, is not labelled `first_letter`. No new property, no free text, no id.

## Where it goes
Directly after the "Changes on 3 Oct 2026 (catalogue `SCHEMA_VERSION` 2)" bullet list and before the "Sentry crash events" paragraph.

## Why
DATA-REQ-001 asks for every analytics property to have a level in the inventory in the same PR. Section 4.7 names `packages/analytics/src/catalog.ts` as the authoritative list, and `first_month` is an enum value of an existing L2 property, so the level is unchanged. The line records the catalogue change for counsel and the founder. No test reads it: nothing fails while it is missing.
