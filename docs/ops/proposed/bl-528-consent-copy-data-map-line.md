# Proposed data-map line for BL-528 (held for the founder: docs/legal/** is legal text, D-125)

Status: proposed. Not applied. The PR for BL-528 carries the code and tests only (council ruling CPrivO-21: "The data-map line goes to `docs/ops/proposed/`, as CR-145 did for BL-1464").

## What the line says
A new row in the table under `docs/legal/data-policy.md` section 4.4 Devices:

| Element | Where | Class | Retention | Note |
|---|---|---|---|---|
| This phone's copy of the person's consent record (`export.consentCopy`: their own `policy_acceptances` rows with the columns the export reads, their `my_policy_state` rows, the account it was read for and when it was read) | device settings, inside the database file | L3 | Until the next full read replaces it, sign-out, the account-deletion request on this phone, Erase everything, or the app is deleted. Not written or read while this phone holds a note that an account-deletion request is open; another phone of the same account gets that note only when it reads the request from the server, and keeps its copy until then | BL-528, CPrivO-21. Written only after a consent read that succeeded in full, for the signed-in account that owns this phone's letters. Never `profile_id`, `subject_hash` or a retention column. Never synced, never uploaded, not in the owner backup; carried only by the book export, as `consent_history` with `status: included` and `read_at` the time of that read, when the server cannot be read. Inside the database file, so in the device backup (D-033) and the recovery export ZIP, like every other setting |

Where: in 4.4 directly after the "First-run draft (`firstRun.draft`)" row; and in `docs/legal/DATA_CLASSIFICATION.md` 4.5, the key `export.consentCopy` at L3, beside `accountDeletion.openRequest`.

## Why
The data map lists every phone store that holds personal data, with its class and how it ends. Code and tests: `apps/mobile/src/lib/export/consent-copy.logic.ts` and `apps/mobile/test/export-consent-copy*.test.ts`. No test reads this line.
