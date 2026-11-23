# Spoken language: screen spec (GAP-06)

Status: DRAFT, PROPOSED, 21 Nov 2026. Author: `design-systems`. Docs only. Closes GAP-06 of `docs/design/DESIGN-GAPS-21nov.md`. Founder ask, handoff #1181.

`IA-FINAL-20nov.md` 7.4 gives `/settings/language` no screen of its own ("A-S10 and E-S08 languages"). A-S10 is the Another-language mark on Review; E-S08 is first-run. Neither draws this page's states. The page is BUILT (`apps/mobile/src/app/settings/language.tsx`, `components/language/language-row.tsx`, `language-picker.tsx`; words `languageCopy` in `packages/content/src/features/language.en.ts`). Nothing was run on a device.

| Row | Screen id (PROPOSED) | Route | Source requirement | Owner | Status |
|---|---|---|---|---|---|
| SL-1 | C-S29 Spoken language | `/settings/language` | NS-17 (a second spoken language, when it passes its gate); ADR 0014; founder decisions 6 and 15 (cited in the file) | design-systems | PROPOSED |
| SL-2 | C-S29.picker Language picker (sheet) | same page | same | design-systems | PROPOSED |

## 1. What the page is

A primary language plus up to two more (`MAX_LANGUAGES`). Choosing one starts the download of its text-rules pack (and, for the primary, its speech model), shows its size and progress, and runs the language in punctuation-safe mode until the pack arrives. Chinese asks which characters the person writes (Simplified or Traditional); Portuguese asks which spelling (Brazil or Portugal). Neither choice respells a word. A note says typing follows the keyboard's own autocorrect.

Sections in order: Primary (one row, opens the picker; footer, plus the safe-mode note while the pack is not installed), Also spoken (rows with Remove, and Add a language or its full-cap variant; absent in an English-only build), one script or spelling section per language that has the choice, the keyboard note.

**Shown:** `languageCopy.*` (built). **Records:** the language list and choices on the phone; downloads of packs and models. No consent act is written here. Any speech-model download over mobile data follows PATH rules for downloads (UNVERIFIED which doc owns them). **Never:** a recording sent anywhere because a language was added; any rewriting between languages or scripts; a claim that a language is "supported" before its gate passes (NS-17). **Decline and withdraw:** Remove on any other language at once; the primary can be changed, not removed.

## 2. States

| State | Exact screen | Copy key |
|---|---|---|
| Happy | Primary row shows the language in its own script and direction, its English name, and "On this phone, 7 KB" style status. Tap opens the picker; choose; the row shows "Downloading, 40%" then the installed line. | `languageCopy.status.*` |
| English only | Primary row, no Also spoken section, no Add row, no "two more" line. | built (`alsoSpokenView`) |
| Downloading | Status line with percent, or "Downloading" below 1 percent. VoiceOver reads the status line as part of the row, not a live percent every tick (announce at start and finish only; PROPOSED). | `status.downloading` |
| Waiting for Wi-Fi | Row says it is waiting and for what; a way to use mobile data once is the row's action ("Try again" with `allowCellularOnce`). | `status.waitingForWifi`, `status.retry` |
| OFF | Row says the phone is offline; picking a language still saves the choice and the pack comes when a connection returns. Nothing red. | `status.offline` |
| FUL | Row says there is no space and how much the pack needs; Storage (C-S18) is one tap away in words only, not a button we invent. | `status.noSpace` |
| Needs app update | Row says an update is needed; no retry offered. | `status.needsUpdate` |
| Paused | Row says downloads are paused; no retry offered (a person turned them off). | `status.paused` |
| Not ready | No pack is published yet: "Did not finish" would be untrue, so the row says it is not ready. | `status.notReady` |
| ERR | A failed download shows the retry line; Try again is a visible action and a VoiceOver custom action. | `status.retry` |
| Cap reached | Add row reads the full variant, is disabled and reads as dimmed with the reason (not hidden). | `addLanguageFull` |
| Script or spelling | One list (radio) per language that has the choice, with the footer; changing it does not respell any existing letter. | `scriptTitle`, `scriptFooter`, `regionTitle`, `regionFooter` |
| Picker sheet | ST-SHEET: title first, the list, languages already chosen are unavailable (dimmed with "already chosen" read aloud, CONTENT-NEEDED). Primary mode shows the current one selected. Close first in reading order. | `LanguagePicker`; CONTENT-NEEDED for the unavailable reason |
| EMP | n/a: a primary always exists | n/a |
| DEN, REV, EXP | n/a: no system permission, nothing expires | n/a |
| SLO | A pack download is slow by nature; the status line is the only waiting signal and no spinner stands alone. | none |
| INT | App killed mid-download: on next open `ensureTextRules` resumes (idempotent); the row shows the true state. | built (read in the effect) |
| DEC | Closing the picker without choosing changes nothing. | none |
| AX5 (SE 3) | Rows grow; the native name, the English name and the status wrap under one another; Remove stays a visible 44 pt button inside the row and a separate VoiceOver element; footers scroll; nothing truncates, including right-to-left names. | built (row doc) |
| Dark | Status text 4.5:1; progress, if drawn as a bar, 3:1 and also stated in words. | none |
| Reduce Motion | No animated progress; the percent text updates in place. | none |
| VoiceOver | Row reads "name, English name, status". Actions: Remove and Try again. Order top to bottom as drawn. | built |
| RTL | Row layout mirrors; the native name keeps its own direction; the chevron flips. | built (row doc) |

## 3. Open items

- The safe-mode footer is shown while a pack is absent; whether it also needs saying in Review is for `content` and area A.
- Whether the Primary change should confirm that a different speech model downloads (size and data use) before it starts: not in the build; PROPOSED as a ST-SHEET only if the model is over a size `mobile` names. `mobile` to confirm.
- Words marked CONTENT-NEEDED go to `content`; none is drafted here.

Signed: `design-systems`, 21 Nov 2026.
