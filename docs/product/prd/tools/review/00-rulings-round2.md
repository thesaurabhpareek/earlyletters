# Rulings after the round-2 executive review (Karma, 20 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

The founder approved the requirements on 19 Nov ("I approve all requirements.") and on 19 Nov delegated decisions ("Consult with exec team and make all decisions."). These rulings settle the points the three review passes raised or disagreed on. Each is reversible by the founder; each card that applies one says "Ruled 20 Nov (Karma, council round 2)". Nothing here decides spend, legal text, counsel's answers, or a published promise: those stay founder or counsel items and are marked.

## Where the reviews disagreed, and the tie-break
| # | Question | Positions | Ruling |
|---|---|---|---|
| T1 | Read together "no limit" | CMO: say "Free, no session limit (M2, F10)". CLO: an open-ended "no limit" in public binds the founder | Requirement (internal): Read together has no session limit and no Plus gate. Public copy may say "Read together is free" only as the current listing does; no "forever", no "never limited". Counsel Q40 |
| T2 | New free features and principle 6 | CPO: everything that ships free in 1.0.x never moves behind Plus. CBO: Plus needs ongoing value | Internal rule: every capability that ships free in the 1.0.x line falls under principle 6. Plus holds one paid act (keeping beyond the allowance); each feature raises the value of a kept letter. Public copy says nothing either way. Founder may reverse |
| T3 | Photo stored-copy size (one-way door) | CPO: keep full pixels up to 4,032 px so print is possible later. CFO: phone storage | Stored copy keeps the picked image at its own size up to 4,032 px on the long side, never below 2,550 px when the source is larger (enough for an 8.5 inch page at 300 dpi), JPEG quality 0.85, metadata stripped. List copy about 512 px, page copy about 1,280 px. The camera original is never stored. One term everywhere: "stored copy" |
| T4 | Undo windows vs WCAG 2.2.1 | Design: 10 s windows close while VoiceOver reads | Every undo window stays open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on |
| T5 | Build numbers in cards | CTO: cards and roadmap disagree | Cards state order and gates only, never a build number or date. The roadmap and the engineering plan own timing |

## Founder-class defaults adopted under the 19 Nov delegation (reversible)
| # | Decision | Ruling |
|---|---|---|
| D1 | Sign-out keeps the book on the phone (X4) | Keep as built (deleting would remove the only copy of the voice while backup is off). The sign-out sheet says, as intent: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them." A second account never sees, claims or uploads the first account's local letters (test `[X4-R1]`) |
| D2 | System writing tools (rewrite, proofread) on fields that become a letter's words | Off on the Review editor, the Firsts label, photo text, place, typed-day words and the From name. `mobile` checks whether React Native exposes the switch; if it cannot, that is a finding, not a silent pass |
| D3 | System intelligence donation | Never: no letter text, child name, picture or prompt is donated to Core Spotlight, NSUserActivity search, Siri suggestions or an App Intents entity (test `[X6-R1]`) |
| D4 | Pilot consent records retention | 12 months after the pilot read-out |
| D5 | Hand-sent tester measures | Numbers only, in the founder's private sheet, never in the repo or a Claude session, deleted 90 days after the round |
| D6 | Account deleted before a sealed letter opens | The sealed letter is deleted with the account; the deletion sheet says so |
| D7 | A let-go held draft that reached the server | Purged at once when the discard is acknowledged (after `sync` reports today's behaviour) |
| D8 | Earlier versions | The author may remove an earlier version; the raw transcript stays immutable; the screen says plainly that earlier versions are kept until removed |
| D9 | "The person speaking agreed" line (NS-16) | An instruction to the parent, not an attestation; no record kept |
| D10 | A transcript withheld as another language (NS-17) | Kept on the phone and flagged; never shown, indexed, shared, printed or exported as words |
| D11 | Removing the other parent (NS-25) | The Terms' 72-hour undo only, until counsel Q53 is answered |
| D12 | Withdrawing backup consent (NS-08, later) | Deletes server copies on the published deletion clock |
| D13 | Device evidence | Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book; no run sheet, screenshot, recording, log or trace carries a real name, letter, picture or voice |

## Rescopes accepted from the CTO pass (code read on develop)
- NS-14 reuses `components/child/child-switcher.tsx` and its selection store; no data change.
- NS-15: the about-day is `occurred_on` with `occurred_precision`, already stored, synced (own field group) and exported; the said-on day is `captured_at`. The card adds only the Review dateline control (existing `DateSheet`), both days shown when they differ, author-only control, and the built limit `BACKDATE_YEARS = 3`. Size S. BL-944 superseded.
- NS-16: the name is `entries.author_signs_as`, 1 to 30 characters, insert-only in sync: settable before the letter's first upload, not after (changing that is a server migration, size L).
- NS-17: extends `lib/transcription-queue/language-hold.ts`; flags `EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES` exist.
- NS-23: changes the built `resurfaced` card (28 to 35 days) to "the same day of an earlier month or year"; one Home card rule, reconciled with open PR #721.
- NS-29: `entries.stt_meta` already holds per-token timings.
- NS-32 comes before NS-13 (back-off is pre-scheduled in the plan; plan notices are a class outside the budget).
- Home slips, one fixed order: (1) the existing waiting cards in their existing order; (2) the seal-opened line on its day; (3) Save a copy in the birthday week; (4) one past letter (replacing "A month ago"). The reminder ask sheet and the Plus line are not slips. The photo start is part of the capture cluster, never a slip. A registry test fails when an unregistered slip renders.

## Citations
Counsel packet 1.5.0 numbers: old Q4/Q4(b) -> Q45; Q2 -> Q48; Q29 -> Q49; Q27 -> Q50; Q13, Q26 -> Q51; Q1 -> Q47; Q7 -> Q54. Backup is ADR 0024 (0023 is email links). Export bump rules live in the `export/schema.ts` header. ADR 0028 is on branch `docs/adr-photo-seal-find-data-11nov` (#797), not yet on develop: cards cite it as "ADR 0028 (PR #797)" until it merges.

## Apple facts read 20 Nov (see research notes)
4.5.4 names push notifications; 2.1(a) asks that placeholder and temporary content be scrubbed; 2.5.19 forbids hidden or undocumented features; PHPickerViewController needs no photo-library permission; notification "Show Previews" is a user setting the app cannot change, and an app may set `hiddenPreviewsBodyPlaceholder` on a category.

Karma
