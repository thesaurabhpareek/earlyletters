# Theme 3: Before you begin: adults only, plain agreement, age signal, where we serve

| | |
|---|---|
| Working label | NX-03 (id: to be assigned) |
| Refines | F01 (entry), F02-REQ-026, -027, LEGAL-REQ-001, -002, BL-575, BL-577, BL-578, BL-580, BL-585, D-131, D-136, D-138 |
| Tag | EVIDENCE for the legal and store gates (`05-compliance-risk.md` gates G-A, G-B, G-F; gap map 1.3). HYPOTHESIS for the Apple age-range API shape: compliance file S3 says it needs the iOS 26 SDK family and does not reach iOS 18 or earlier accounts; the final API is NOT VERIFIED (feasibility item 28) |
| Size | M (feasibility item 28 is M). Pieces already in review: #635 (851 added lines over 27 files, over the 400-line rule, split first), #521, #634, #636, #637 |
| Gate | Counsel (Q46 age assurance, Q48 consent design, Q44 real families under draft texts, Q57 sanctions). Founder (CCO line on #635, merges anything in `docs/legal`). Apple: 5.1.1(i) |
| Order | 3 of 12 |

## What the parent will see and do

On a first open: a short "Before you begin" screen. It asks one neutral question, are you 18 or older, with nothing chosen for them. Below it, one unticked box for the agreement, with the Terms and Privacy links that open plain pages and come back to where they were. If they answer no, the app stops kindly and stores nothing about them. If they answer yes, the sign-in buttons appear with the agreement line directly above them.

On a phone that reports an age range from the system, the app asks for it once, and uses it with its own question.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-03-R1 | EVIDENCE | Given a first open, Then the age question renders with 0 options preselected and the agreement box unticked; "Continue" is disabled until both are answered. At the largest text size (AX5) 0 lines are clipped. | #635 is open, not merged. | F01; gap map 1.3 |
| NX-03-R2 | EVIDENCE | Given the answer No, When the parent confirms, Then the stop is stored only after the confirm, 0 account rows exist, and the screen shows the neutral message. | #521 is held for counsel. | #521; LEGAL-REQ-002 |
| NX-03-R3 | EVIDENCE | Given the sign-in sheet, Then the agree line with versioned Terms and Privacy links sits directly above the buttons, and the consent sheet links to those two documents only (0 other links). | No merged PR found by title for BL-575 (NOT VERIFIED). The consent-sheet part is merged (#589). | BL-575; D-138 item 3 |
| NX-03-R4 | EVIDENCE | Given an agreement, When it is stored, Then the row carries build number, OS major version, text language and the hash of the words shown (4 of 4 fields non-empty). | #634 is a draft migration, `approve-migration` label. | BL-577; PRIV-R21 |
| NX-03-R5 | EVIDENCE | Given an erase request for an account, Then pseudonymised consent rows are found and removed in the same job (0 rows left for the Asha fixture). Given an attempt to update or delete an audit or consent row, Then the database refuses. | #636 and #637 are drafts. | BL-578, BL-585 |
| NX-03-R6 | EVIDENCE for the duty; HYPOTHESIS for the build | Given a phone that offers an age range, When the app requests it once at first run, Then the range is used together with the parent's own answer and the stricter of the two decides. Given a phone below the signal level, Then the app relies on its own question and records "no signal" without error. | No age-signal code exists in `apps/mobile/src`. | `compliance-register.md` CR-004, CR-005; compliance file G-B |
| NX-03-R7 | EVIDENCE for the decision; build not found | Given a sign-up from a blocked country (D-131), When the check runs, Then sign-up is refused with a neutral message and the server stores no name and no IP address. | No block exists in `supabase/functions`, migrations or app code. | D-131, D-136, D-137; gap map 1.3 |
| NX-03-R8 | EVIDENCE | Given the live website, Then the privacy and terms pages at the app's permanent URLs state that the app exists and cover the app, and `/support`, `/delete-account`, `/subscription-terms` answer 200. | On 8 Nov the privacy page says "The Early Letters app is not out yet" and 3 pages return 404. | Gap map 0 item 3, 1.11 |

**Shown:** consent keys by `packages/content` (`consentCopy`, `authCopy.consent.*`), the age question, the stop screen, and the versioned links.
**Records:** each act through `record_policy_act` per PRIV-R21, plus the age answer as a yes or no, never a birth date.
**Never:** a birth date, an exact age, a country name or an IP address kept to prove a block, a name screen (D-137), a child's name before the age step.
**Decline and withdraw:** No on the age step ends the flow with nothing stored beyond the stop. "Not now" on the agreement keeps the on-device book working with record, read and export. Withdrawal is in Settings and export and deletion still work (PRIV-R09).

## Edge cases

- Under-13 actual knowledge runs the runbook `docs/ops/runbooks/underage-account.md` (not reviewed here; compliance file section 7 item 7).
- California AB 1043 from 1 Jan 2027 and Texas SB 2420 now: both rest on secondary sources in the register; counsel is asked to confirm from the statutes (compliance brief item 11).
- Phone says adult, parent says under 18: no account (stricter wins; recommended default, counsel Q46).
- Parent travels or uses a VPN: the country check never blocks an existing account; it applies at sign-up only (recommended default).
- Dynamic Type AX5 and VoiceOver on the age question (device row).

## Offline behaviour

The age question and the agreement work with no network; the sign-in that follows needs one. Acts recorded offline carry their phone time and upload after the Terms row (F02-REQ-014).

## What we never do

Preselect an answer. Guess an age from anything else. Gender the child; copy uses {child}. Nudge with fear, guilt or loss language.

## Copy needs (packages/content)

Keys to add (words by `content`, counsel for registered strings): `consentCopy.age.question`, `consentCopy.age.stopTitle`, `consentCopy.age.stopBody`, `consentCopy.agree.line`, `consentCopy.region.refusedTitle`, `consentCopy.region.refusedBody`. Registered strings change only with counsel and a disclosures version bump in the same PR (`COUNSEL_LOCKED.md`).

## Analytics events (opt-in, content-free, names only)

Existing: `auth_sheet_shown`, `analytics_opted_in`. New: `age_step_result` (property: answered yes or no, no age), `age_signal_result` (property: available, unavailable). Nothing before an opt-in.

## Device rows

S1-03 (age step); new rows: "age question at AX5 and VoiceOver", "phone with no age signal", "blocked-country sign-up refused".

## Dependencies

Theme 1 (hosted project for the migrations). #655 order for #634, #636, #637. Split #635 before review. Counsel answers.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| CCO line for "Before you begin" (#635) | Give it after the split |
| Whether Texas and California duties bind the first public release | Ask counsel (Q46); plan as if yes and build the request now (gap map section 4 rank 7) |
| Real families under draft texts (Q44) | Family only until counsel answers; do not cross with a deferral |
| Blocked-country list and the check source | Follow D-131 and D-136 as written; counsel Q57 |

## Not verified

Apple's final age-range API and its iOS floor. Whether BL-575 merged under another title. The statutes' text (secondary sources only).
