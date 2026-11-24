# A first letter on a phone with no speech model (spec, 24 Nov 2026)

Status: PROPOSED, for the Chief Design Officer, `content` and `privacy` to read, then Karma. Owner: `product`. Backlog rows: BL-1709 (this spec), BL-1999 (the mobile build, filed with it). Source finding: NEU-003 (P1) in `docs/design/review-2026-11-22/neutral-findings.md` line 38. The fallback is picked in CPO-68 (23 Nov 2026, Chief Product Officer, a Claude role), quoted in the BL-1709 row: a typed first letter, not a smaller first model.

Evidence limit: this is a reading of source on `origin/develop` at `922cde873` (24 Nov 2026). Nothing was run: no test, no simulator, no phone. No timing is given and none is measured; any later timing reading is "simulated" (D-172) and is not evidence for the SE 3 gate. I did not find the text of CPO-68 in `docs/` (a search for the id found only the BACKLOG row), so I rely on the row's quotation of it. Every UI value below is an existing component, variant or key; I invent no size, spacing or colour. Customer-facing wording is marked PROPOSED and is not final.

## 1. What happens today

A new parent reaches "The book is open." and meets the speech download card (`apps/mobile/src/components/speech/speech-consent-card.tsx`). Nothing downloads until she taps "Download on Wi-Fi" (D-087; `speech-consent.logic.ts`, `autoStartAllowed` is true only for an explicit yes). "Not now" stores the choice `later` and starts nothing (`speech-consent-card.tsx`, `later`). The download is Wi-Fi only unless she taps cellular for one download (`words-state.logic.ts` line 183; `review.tsx` line 834, `allowCellularOnce`).

What the code does with a first spoken letter when the model is not on the phone, read in order:

1. Listen does not read the model state. `listen.tsx` has no import of the speech consent, the speech packs or the download hook (searched for `speech`, `model`, `pack`, `download`: the only hit is the app-wide `speech-gate`, which is the announcement gate, not the speech model). The parent can record. EVIDENCE: `listen.tsx` header and lines 452 to 464.
2. Listen offers typing in two places only: the microphone-note and the three microphone problems ("Type instead", `listen.tsx` lines 452, 464, 469, key `copy.errors.micDenied.typeButton`), and a quiet "Type" beside the circle when a picture was chosen (`listen.tsx` line 588, key `photos.capture.typeButton`, whose line in `photos.en.ts` is marked `TODO(founder): PROPOSED`). A parent with no picture and a working microphone sees no typing offer on Listen. EVIDENCE: those lines.
3. Review for a recording whose words are waiting shows one card from `wordsCard` (`words-state.logic.ts` lines 146 to 184 and 264):
   - `ask` (no yes yet, which covers "Not now"): title "Get your words ready", primary "Download on Wi-Fi", quiet "Keep the recording". No typing offer. `showReviewAsk` (`speech-consent.logic.ts` line 68) decides it.
   - `downloading` with a Wi-Fi wait (the cellular case): title "Your voice is kept", primary "Keep the recording", quiet "Use {size} of cellular". No typing offer.
   - `downloading` otherwise: primary "Keep the recording", quiet "Type it instead".
4. "Keep the recording" calls `keepRecordingOnly` (`review.tsx` lines 674 to 718). It saves a voice-only letter, which never counts toward the free letters and never opens the Plus sheet (header of `review.tsx`, M17, D-103). The saved moment shows `book.waitingForWords`, "A recording, waiting for its words." (`strings.en.ts` line 581). So a first session on "Not now" or on cellular does end with a kept letter if she taps Keep, but not a letter with words on screen. That is the NEU-003 gap: the core payoff, her words in front of her, is absent in session one.

The typed path exists and is complete: Write saves a draft at least every 500 ms, then hands the letter to the one Keep step, where the Keep gate decides as for a spoken letter (D-082, D-083), and the saved moment plays (`write.tsx` header). Typed text keeps the keyboard's autocorrect and the machine never touches it (same header). The first 2 letters are free (`review.tsx` header), so a first typed letter passes the gate.

## 2. The pick, and what it changes

CPO-68: the fallback is a typed first letter. Not a smaller first model (that would add a second model plan, a second size and a second hash path in `packages/core` and the pack engine, and the row's own evidence does not call for it). Revisit only if a real-device reading shows first sessions on cellular ending without a letter even with the typed offer (the row's condition).

So the change is small and has two parts:

- Part A, Listen: when words will not appear in this first session without a decision from her, Listen offers "type instead" before she records, so a parent who does not want to wait never has to.
- Part B, Review: unchanged. A recording made anyway is playable, shows the existing words-on-the-way card, and is kept as a letter waiting for its words. This is what the code does today (section 1, items 3 and 4). The spec only fixes this behaviour in place with tests (section 5).

Nothing here downloads anything. Typing does not set the download choice. D-087 holds: the model downloads only after her explicit tap.

## 3. Listen: when the typed offer shows

The offer is a quiet button in the same place and with the same treatment as the existing picture "Type" (`listen.tsx` line 588: `variant="quiet"`, `size="md"`, under the aura, shown only while the start control shows). No new component and no new measurement.

It shows in the ready state (nothing recording; `room.startControl`) when all of these hold:

1. The parent has at least one child (Listen already requires one, `listen.tsx`).
2. The speech files for her language are not on this phone: `installedPathsFor(language) === null` (`speech-packs.ts` line 135; `speech-consent-card.tsx` `onThisPhone` is the existing wrapper).
3. Words are not already on their way without her: it is NOT the case that she said yes and the download is moving or queued. In the code's terms, hide the offer only when `speechDownloadChoice() === 'yes'` and the download state has no hold and no failure (`useSpeechDownload(language)` returns `progress`, `stage`, `hold`, `failure`; `use-words.ts` lines 29 to 43). `hold` is `waiting_for_wifi`, `no_space` or `offline` (`words-state.logic.ts` lines 62 to 67).

| Phone state | Listen shows the typed offer | Why |
|---|---|---|
| Speech files installed | No | Words will appear; today's Listen |
| No choice yet (she skipped the card) | Yes | No yes means no download (D-087) |
| "Not now" (`later`) | Yes | CPO-68: at "Not now" |
| Yes, waiting for Wi-Fi (cellular, `hold = waiting_for_wifi`) | Yes | CPO-68: on cellular. This is the one the finding is about |
| Yes, offline or no space | Yes | The words cannot come soon without her |
| Yes, a failure with no retry in flight | Yes | Same |
| Yes, bytes moving on Wi-Fi, or queued with no hold | No | Words follow without a decision. The existing line "You can start now. Your voice is kept, and the words follow." is true here (`speech.en.ts` `startNow`) |

UNVERIFIED: that `useSpeechDownload` can be called from Listen without side effects. Reading it, it only reads state (`use-words.ts` lines 29 to 43) and `useWordsTick` is a subscription; no run confirmed it, and Listen's start path must stay untouched. UNVERIFIED: how the word "cellular" is known; the code only knows `hold = waiting_for_wifi`, which means the phone is not on Wi-Fi. This spec uses that signal and does not read the network type.

What does not change on Listen: the red circle starts the take; the one filled button stays the circle; no take is blocked, delayed or interrupted by the offer; nothing is checked between pressing the circle and recording (CDESO-7 as quoted in BL-1840: no check, no spinner or message in the app's own voice on that path). The offer is chosen before the take, never during it, and is not drawn while a take is live or paused.

Tapping the offer does what "Type instead" does today: `router.replace` to `/write`, carrying the prompt if there is one (`listen.tsx` line 452). A pending picture is kept, as the picture "Type" does ("Type keeps the pending picture", `listen.tsx` comment above line 588).

Order for VoiceOver and large text: the offer sits after the circle and is a plain button in the tree. UNVERIFIED at every text size; BL-1786 and the SE 3 sitting (simulated, D-172) are where that is read. The offer is hidden whenever the start control is hidden, so the "one element while a take is live" rule (F04-REQ-040, quoted in `docs/design/specs/05-HANDS-FREE-CAPTURE-STATES-11nov.md`) is unaffected.

## 4. Review: states for a recording made without a model

No change to the cards in `wordsCard`. The table fixes what a first session shows so the build row can test it. "Hear it" (the mini player) is shown for every row that has sound (`review.tsx` line 820).

| Phone state when she finishes | Card (state name) | Primary | Quiet | After "Keep the recording" |
|---|---|---|---|---|
| "Not now" or no choice | `ask` | Download on Wi-Fi | Keep the recording | A letter waiting for its words, private, not counted |
| Yes, Wi-Fi wait | `downloading` | Keep the recording | Use {size} of cellular | Same |
| Yes, bytes moving | `downloading` | Keep the recording | Type it instead | Same; the words follow when the files land |
| Not enough space | `ask` with the space line | none | Keep the recording | Same |

Recording kept, never touched: Review never alters or discards audio here (`words-state.logic.ts` header). Typed words are never machine-edited: a typed letter has no transcript, no edits and no `verifyEdits` call, and the "Type it instead" and "Write the words" paths open Write (`review.tsx` lines 827 to 828). The constitution holds: the machine removes and repairs, it never adds meaning (CLAUDE.md), and nothing in this spec writes, completes, summarises or suggests a word for her.

Not in this spec: adding "Type it instead" to the `ask` and Wi-Fi-wait cards. They already carry two actions, and the cards' own rule is at most two controls plus Close (`words-state.logic.ts` `wordsActions`; S15). With the offer on Listen the typed route is open before she records; if she records anyway, "Keep the recording" ends the session with a kept letter, which is CPO-68's wording. Question 2 asks whether design wants more.

## 5. Requirements (acceptance for the build row)

One behaviour per id. Ids are local to this spec. Each check is a pure-function or source-text test, because no device run exists (RR-1 to RR-13; COORDINATION section 10).

| Id | Given, When, Then | Satisfies | Test title |
|---|---|---|---|
| FL-01 | Given no speech files on the phone and choice unset or `later`, When Listen is ready, Then the typed offer is shown beside the circle | NEU-003, CPO-68 | `[FL-01] offer shows at Not now` |
| FL-02 | Given choice `yes` and `hold` is `waiting_for_wifi`, When Listen is ready, Then the offer is shown | NEU-003, CPO-68 | `[FL-02] offer shows on a Wi-Fi wait` |
| FL-03 | Given choice `yes`, bytes moving and no hold, When Listen is ready, Then the offer is not shown | NEU-003 | `[FL-03] no offer while words are coming` |
| FL-04 | Given the speech files are installed, When Listen is ready, Then the offer is not shown | NEU-003 | `[FL-04] no offer when the model is here` |
| FL-05 | Given a take is recording or paused, When Listen draws, Then the offer is not in the tree | F04-REQ-040 | `[FL-05] never during a take` |
| FL-06 | Given the offer is tapped, When Write opens, Then the prompt (if any) and a pending picture are carried and no download starts and the stored choice is unchanged | D-087 | `[FL-06] typing starts nothing` |
| FL-07 | Given a first typed letter, When she taps "Add to the book", Then the Keep step runs as for any letter and the first 2 letters pass the gate | D-082, D-083 | `[FL-07] typed first letter keeps` |
| FL-08 | Given a typed letter, When it is kept, Then the stored words equal what she typed and no edit row exists | constitution | `[FL-08] typed words untouched` |
| FL-09 | Given a recording made with no model and a `later` choice, When Review shows, Then the card is `ask`, "Hear it" is offered, and "Keep the recording" saves a voice-only letter that is not counted | NEU-003 | `[FL-09] words-on-the-way card` |
| FL-10 | Given the same, When Review shows, Then neither the card nor the Listen offer uses a wording from the list the content rules ban (rules test) | CLAUDE.md content rules | `[FL-10] content rules pass` |
| FL-11 | Given any of the above, When the app records analytics or logs, Then no entry text, transcript, audio or child name is in them | CLAUDE.md privacy rules | `[FL-11] nothing new is recorded` |

Door lines (COORDINATION section 10): not needed for the offer. It is not a consent, sign-in, share or deletion and writes no consent row. D-087's consent (the Wi-Fi download) is unchanged, and so is its Shown, Records, Never and Decline text. The one thing to state: Never, the offer stores nothing and sends nothing; Decline, ignoring the offer leaves Listen as it is today.

## 6. Words needed from content (all PROPOSED)

`content` reads `packages/content/WRITING-GUIDE.md` first; `privacy` and the exec team's legal read check every line that says what the app does (D-172). Nothing below is final and nothing ships before that read.

| Where | Reuse or new | Line | Note |
|---|---|---|---|
| Listen, the typed offer's label | Reuse | "Type instead" (`copy.errors.micDenied.typeButton`, `strings.en.ts` line 1246) | Already on Listen's microphone note, so the same label and the same meaning. The picture "Type" key (`photos.capture.typeButton`) is marked PROPOSED, needs word approval, so it is not reused. Content may prefer "Type" |
| Listen, one quiet line under the circle when the offer shows | New, PROPOSED | "Your voice is kept. Words come once this phone is ready." | Optional. True for `later` only after she says yes to the download, so content and `privacy` decide whether it is a promise. Holds the guide's "no new promise" rule. Do not ship if BL-1813 puts this on the download card instead |
| Review waiting cards | Reuse | `speechConsentCopy.title`, `body`, `downloadButton`; `copy.review.waiting`; `wordsCopy.pack.mobileDataButton`; `copy.review.voiceOnlyButton` | Already built and reviewed. This spec changes none |
| Saved moment for a kept recording | Reuse | `book.waitingForWords` "A recording, waiting for its words." | Unchanged |

Overlap: BL-1813 (content, P2) owns one line on the download card saying what she will see after her first take if the download has not run. The Listen line above is the same idea on a different screen. The two rows need one writer so the claim is said once; Question 3.

## 7. Open questions

| # | Question | Who | Default if no answer | By |
|---|---|---|---|---|
| 1 | Does the quiet "Type instead" beside the circle read as an equal way to write, and does it crowd the circle at the largest text size | Chief Design Officer, with the simulated SE 3 pass (BL-1705, D-172) | Section 3 stands: quiet, as the picture "Type" is | Fri 27 Nov 2026 |
| 2 | Should Review's `ask` and Wi-Fi-wait cards also offer "Type it instead", which breaks the two-control rule | Chief Design Officer | No (section 4). Revisit if the simulated pass shows a parent stuck | Fri 27 Nov 2026 |
| 3 | Who writes the one Listen line, and does it duplicate BL-1813 | `content` | `content` writes both in one change; the Listen line is dropped if BL-1813's card line is enough | before BL-1999 is set to ready |
| 4 | Should the offer also hide for a parent who typed her last letter | Chief Product Officer | No. It shows while the model is missing. Hiding it per parent is a second rule for a first session | none needed |

No decision reserved for the founder is made here.

## 8. What this does for other rows

- BL-1999 (the mobile build) is filed with this spec, `blocked` until this spec merges and `content` has read section 6.
- BL-1709 ends at this spec, as its row says.
- BL-1813 is not edited. BL-1840 (model check at launch) is not touched; the offer adds nothing to the path between pressing the circle and recording.
- BL-1714 (the five-parent check) and BL-1705 (the SE 3 sitting, simulated) can read the states in sections 3 and 4.

## 9. Not verified

- No device, simulator or SE 3 run, no test run, and no timing taken. Any later timing reading is labelled "simulated" (D-172).
- `listen.tsx` was read in the parts named (header, lines 430 to 470, 560 to 663), not in full; `review.tsx` in its header and lines 665 to 730, 786 to 840 and 895 to 935; `words-state.logic.ts` in full; `speech-consent.logic.ts` and `speech-consent-card.*` in full. The Review states other than the waiting cards were not re-read.
- The text of CPO-68 was not found in `docs/`; I use the BL-1709 row's quotation of it.
- Whether a first-session parent on cellular ever ends without a letter after this change is exactly the "revisit" condition in the row, and nothing here measures it.
