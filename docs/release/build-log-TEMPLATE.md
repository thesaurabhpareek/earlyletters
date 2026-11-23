# Build log: build <1 or 2>, <YYYY-MM-DD>

Copy this file to `docs/release/build-log-<YYYY-MM-DD>-build<N>.md`. Fill it in during the sitting from `docs/release/BUILD_CHECKLIST.md`. Paste output, never a secret: no token, key, `.p8` text, password, Apple ID, or child's name. Write U where you could not check something.

| Field | Value |
|---|---|
| Date and time (UTC) | |
| Who | initials only |
| Build | 1 (`testflight`) or 2 (`preview`) |
| Commit built (`git log -1 --format=%H`) | |

## Step 1. Clean checkout
- `git status --porcelain` printed nothing: yes / no
- Output or notes:

## Step 2. Doctor (`npx tsx scripts/release/doctor.ts --live`)
- Exit code:
- FAIL lines (paste), or "none":
- WARN lines (paste):

## Step 3. Preflight
- Command run:
- Exit code:
- FAIL lines (paste), or "none":
- WARN lines (paste):

## Step 4. Prerequisites in the tree
- projectId present: yes / no
- ascAppId present: yes / no
- keyId present in keys.ts: yes / no
- PACK_MANIFEST not null: yes / no

## Step 5. Builds used
- Builds used this month: 
- Builds remaining (15 minus used): 
- Under 3 remaining is a STOP: ok / STOP

## Step 6. Build
- Command run:
- Attempt 1 result:
- Why a retry differs (only if attempt 1 failed):
- Attempt 2 result (a second failure is a STOP):
- Build URL and build number:

## Step 7. Submit
- Command run:
- API key role chosen, if asked (APP_MANAGER expected):
- Result:

## Step 8. Apple and the phone
- Processing email received (UTC time):
- ITMS-91053 or other warning: none / describe (no email text copied into the repo)
- Added to the Family group only: yes / no
- Installed on the drill phone: yes / no

## Step 9. Evidence
- Evidence file path under `docs/qa/evidence/`:
- B1 rows passed (list ids):
- B1 rows not run or failed (list ids):

## Step 10. Build 2 only
- Freeze respected: yes / no / not applicable

## STOPs hit
List each: step number, exact output pasted, what you did next.

## Unverified (U)
List anything you could not check.
