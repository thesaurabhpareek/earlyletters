# Id registry (generated)

Generated from `packages/analytics/src/ids.ts` by `npm run plan -w @scribe/analytics`; do not edit by hand. A test fails if this file differs from that output. Rules: `00-event-standard.md` section 4 and V4, V16. An id never comes from text on screen or from a person, child, book, letter or picture; a dynamic list is one element id.

Cap: at most 300 ids per kind. Kinds: screen, control, element, metric. Areas: onboarding, capture, book, family, keeping, me, plus, notifications, system.

## screen (36)

| Id | Area | IA-FINAL id | Shape | Route template | Sent today as | Note |
|---|---|---|---|---|---|---|
| `home` | capture | A-S01 | route | (root) | `tonight` | Home is the capture cluster (IA-FINAL section 5); the route value stays `tonight` until ER-B02 |
| `book` | book | B-S01 | route | `book` | `book` |  |
| `family` | family | D-S18 | route | `family` | `family` | the Family page |
| `listen` | capture | A-S04 | route | `listen` | `listen` | A-S05 (recording) is a state of the same route |
| `write` | capture | A-S06 | route | `write` | `write` |  |
| `review` | capture | A-S07 | route | `review` | `review` |  |
| `letter_detail` | book | B-S08 | route | `letter/[id]` | `letter_detail` | one id for every letter, never one per letter |
| `onboarding` | onboarding | E-S08 | route | `onboarding` | `onboarding` | first book steps |
| `read_together` | book | B-S19 | route | `read-together` | `read_together` |  |
| `sign_in` | onboarding | E-S04 | route | `sign-in` | `sign_in` |  |
| `sign_in_email` | onboarding | E-S05 | route | `sign-in/email` | `sign_in_email` |  |
| `sign_in_code` | onboarding | E-S06 | route | `sign-in/code` | `sign_in_code` | E-S06 covers code and verify |
| `sign_in_verify` | onboarding | E-S06 | route | `sign-in/verify` | `sign_in_verify` | E-S06 covers code and verify |
| `sign_in_consent` | onboarding | E-S07 | route | `sign-in/consent` | `sign_in_consent` | agreements and consent at sign-in |
| `invite` | family | D-S15 | route | `invite` | `invite` | the join ask |
| `invite_new` | family | D-S13 | route | `invite/new` | `invite_new` | the invite sheet |
| `settings` | me | C-S01 | route | `settings` | `settings` | the Me tab root |
| `settings_account` | me | C-S02 | route | `settings/account` | `settings_account` |  |
| `settings_appearance` | me | E-S21 | route | `settings/appearance` | `settings_appearance` |  |
| `settings_reminders` | notifications | D-S06 | route | `settings/reminders` | `settings_reminders` |  |
| `settings_recordings` | keeping | C-S08 | route | `settings/recordings` | `settings_recordings` | IA-FINAL replaces Recordings with Where your letters live (C-S08); judgement |
| `settings_child_detail` | me | C-S15 | route | `settings/children/[id]` | `settings_child_detail` | one id for every child, never one per child |
| `settings_child_new` | me | E-S08 | route | `settings/children/new` | `settings_child_new` | reuses the first-run form (IA-FINAL section 7.4) |
| `settings_privacy` | me | C-S23 | route | `settings/privacy` | `settings_privacy` |  |
| `settings_export` | keeping | C-S04 | route | `settings/export` | `settings_export` | Save a copy |
| `settings_language` | me | A-S10 | route | `settings/language` | `settings_language` | IA-FINAL section 7.4 names A-S10 and E-S08; A-S10 chosen |
| `settings_plus` | plus | E-S11 | route | `settings/plus` | `settings_plus` | the Plan page |
| `settings_storage` | keeping | C-S18 | route | `settings/storage` | `settings_storage` |  |
| `settings_delete_account` | me | C-S20 | route | `settings/delete-account` | `settings_delete_account` |  |
| `age_gate` | onboarding | E-S03 | state |  |  | rendered by the root layout; no route of its own |
| `boot_error` | system | E-S01 | state |  |  | launch and boot failure; no route of its own |
| `plus_confirmed` | plus | E-S12 | route | `plus/confirmed` |  |  |
| `not_found` | system | E-S20 | route | `+not-found` |  | any unmatched link |
| `invite_leave` | family | D-S19 | route | `invite/leave` |  | leaving a family; D-S19 chosen over D-S18; judgement |
| `whose_book` | family | A-S02 | sheet |  |  | IA-FINAL section 3 puts Whose book under the family area |
| `day_sheet` | capture | A-S08 | sheet |  |  | one DateSheet shared with B-S09; the area of the first place (Review) |

## control (0)

None yet. Added by the rows that need them.

## element (0)

None yet. Added by the rows that need them.

## metric (0)

None yet. Added by the rows that need them.
