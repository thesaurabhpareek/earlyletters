# Council review of the new-scope pack (19 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: Karma with the CPO role | Replaces: none | Load when: auditing why a round 1 finding was made; otherwise do not load.

Two review passes, each a separate Claude session reading the roles' skills in full, read-only, against the pack at heads `c838a2a8` and later. Independence is of method only: one account, one model family. Neither pass ran anything on a phone. The second pass asked to read Apple's guidelines page and was not given access, so every Apple rule cited in the pack is UNVERIFIED and must be re-read before submission.

## Pass 1: CPO, Chief Design Officer, CMO (30 findings)

All 30 were accepted and applied. The ones that changed the product:

| Finding | Change |
|---|---|
| North Star counted kept letters, which measures Plus | Now letters made, in any state (00 section 3) |
| Reminders keyed on kept letters would nudge a free parent at the gate | Every rule keys on made; no reminder names Plus, a price or the gate (NS-13-R11) |
| No card honoured Quiet this book, the loss case | Quieted and hidden books get no reminder, slip or past letter (NS-13-R12, NS-11-R8, NS-23-R8) |
| Language detection left to engineers in an English-only build | No detection; the author marks another language in one tap (NS-17-R5) |
| Read the year back implied a Read together limit that does not exist | Free, no limit (NS-24); sealed and hidden letters skipped; a year defined |
| No microphone-live target, hand-offs unnamed | Tap Speak to microphone live p95 500 ms; four hand-offs named (NS-34) |
| No VoiceOver capture row, Bold Text or Increase Contrast | NS-33-R6 to R8 |
| Sign-out today could remove the only copy of the voice | NS-08-R6, R7 and journey J-N21 |
| The Book gear removed with no new home for Quiet and Hide | Both stay on the Book within 2 taps (NS-22) |
| Co-parent "coming soon" wording left in two files | Struck; marked pending D-161 (#827) |
| VISION led with the superseded descriptor | Leads with D-139 |
| "No open-ended promises" was false | The four on record are listed (00 section 7) |

Smaller fixes applied: two unnamed books told apart by date; one Home and Book selection; about-day drives age, chapter and order; letter-page rows clarified; the past-letter fragment cut by the language's word segmenter; one export row in Me with progress for large books; NS-09 stuck deletes shown in Storage; slow new-phone arrival shows what has come; cards NS-16, NS-22, NS-24 and NS-25 completed to the card shape; rank and id corrections; {child} in NS-16.

## Pass 2: Chief Privacy Officer, CCO, CLO, CFO, CTO, quality (30 findings)

All accepted. Applied:

| Finding | Change |
|---|---|
| Reminder prompts contain `{child}`, so the default would put the name on the lock screen | Notification bodies come only from name-free prompts; a test over the pool (NS-13-R6a); journey J-N24 |
| The notification budget could drop a subscription notice | Plan notices sit outside the budget, ranked first (NS-32-R4; J-N27); counsel must confirm the windows |
| Let it go was described as phone-only; it touches the server and other phones | State table and NS-09-R7, R8 |
| New phone missed a second account on the same phone and the decline case | NS-10-R3, R4 and door lines |
| The typed "From" name syncs as data about a non-user; a sibling's voice was uncontrolled | Data rules, a Never line, door lines, a counsel question before build; NS-16 re-sized L |
| No acceptance row carried a priority | P0 register with RR-4 reasons (14 section 7); everything else P1 |
| Dependency cycle between photo and the fast Book | Dependencies by slice; the cycle is gone (13) |
| State space missing for reminders and the about-day | RR-5 tables in NS-13 and NS-15 |
| Restore had no clock | 30-day window and purge rows (NS-36-R1a to R1c) |
| Claims registry does not exist | The claims inventory is the home until it does; owner and checker named; claims created by this pack listed |
| Backup sizing had no money | NS-08-R2 now prices each path per family; "never a Plus feature" stays internal |
| P0 journeys missing for the lock screen, a lapsed plan, a due-date-only child | J-N24 to J-N26 |
| "Byte-identical" export could never pass | Split into one code path plus equal manifests apart from `generated_at` |
| Sizes broke the plan's own definition | NS-12, NS-15, NS-16 re-sized L; NS-25 reconciled |
| Wrong and missing dependencies; NS-13 waited on rank 23 | Fixed; N-09 is taken before C-05 when both are free |
| "Only copy of the voice" is false against D-033 | "On this phone, and in its iCloud backup if that is on" |
| Earlier versions keep words a parent edited out | NS-12 must offer removal or say so plainly, before any build |
| Hand-sent measures had no data rule | The app composes nothing; where the founder keeps them and for how long (00 section 3) |
| The weekly limits check was overstated | What it checks and what is read by hand, stated (00 section 8) |
| Founder phones and time were an unlisted cost | Listed; which phones he holds is a question for him |
| Non-atomic and untestable rows | Split where listed (NS-09-R4, NS-21-R3, NS-23-R1, NS-36-R1, NS-13-R6); measurement method for NS-34 |
| The device waiver undercut P0 | Waivers only when no phone was available, never for a loss, leak, lock-screen name or guilt line |
| Read-along framed a child using the app | Reframed as a parent reading aloud |
| Apple 4.5.4 may not cover local reminders | Marked UNVERIFIED |

Not fully closed, and why:
- Rows NS-10-R1, NS-16-R2, NS-17-R2, NS-21-R5, NS-23-R3 and NS-33-R4 still join two checks in one row. They are P1 except NS-33-R4; `product` splits them when writing each card's backlog rows.
- Counsel questions raised here (sibling voice, version retention, plan-notice windows, typed-day retention) are drafted as text in the cards; they are not yet in `docs/legal/COUNSEL_PACKET.md`. That is the `legal` lane's next row.

## Verdict after fixes

Waves 1 and 2 (`13-engineering-plan.md` section 4) can be handed to the harness. Cards in waves 3 to 5 are specified enough to design from; their gates (counsel, founder words, ADR acceptance) are named on each card and none can be skipped by the harness.
