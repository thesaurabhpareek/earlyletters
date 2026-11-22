# Proposed data-map line for BL-1464 (held for the founder: docs/legal/** is legal text, D-125)

Status: proposed. Not applied. The PR for BL-1464 carries the code and catalogue change only.

## What the line says
Under `docs/legal/DATA_CLASSIFICATION.md` section 4.7, as a new paragraph:

> Change on 21 Nov 2026 (catalogue `SCHEMA_VERSION` 10, BL-1464, DATA-REQ-001): the `trigger` property of `auth_sheet_shown` and `auth_deferred` gains the value `third_letter` (L2, a fixed enum value) so the Keep the book re-offer after the third letter can be told from the first offer, which stays `first_letter`. No new property, no free text, no id.

## Where it goes
Directly after the paragraph for `SCHEMA_VERSION` 9 (BL-1429, if the founder has applied `bl-1429-data-map-line.md`), otherwise after the "Changes on 3 Oct 2026 (catalogue `SCHEMA_VERSION` 2)" bullet list and before the "Sentry crash events" paragraph.

## Why
DATA-REQ-001 asks for every analytics property to have a level in the inventory in the same PR. Section 4.7 names `packages/analytics/src/catalog.ts` as the authoritative list, and `third_letter` is an enum value of an existing L2 property, so the level is unchanged. The council ruling of 21 Nov 2026 (CDO) is yes, same pattern as BL-1429. No test reads this line: nothing fails while it is missing.
