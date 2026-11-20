# Area B: Book and reading. End-to-end design

Status: DRAFT skeleton, 20 Nov 2026 (design lead, area B). The screen ids below are stable: motion (MOTION.md) and words (WORDS.md) key to them. The full journeys, layouts and integration map follow in this file.

## Screen and state inventory (ids are stable)

| Id | Screen or surface | Card |
|---|---|---|
| B-S01 | The Book (tab), with the calm header bar | NS-22, NS-01 lens, NS-06 A lens, NS-02 entry |
| B-S02 | "More for this book" end menu (Quiet, Unquiet, Hide, Show again; Go to a month folded at AX3+) | NS-22, F12-REQ-011 |
| B-S03 | Lens choice (Months, Photos, Firsts) as one radio group | NS-01-R10, R48, NS-06-A3, NS-33-R3 |
| B-S04 | Photos lens list | NS-01-R11, NS-37 |
| B-S05 | Firsts lens list | NS-06-A3 |
| B-S06 | Find mode over the Book | NS-02 |
| B-S07 | Go to a month sheet, with year rows (Read the year back) | NS-22, NS-24 |
| B-S08 | The letter page ("This letter" list) | NS-21, NS-33-R1 |
| B-S09 | Day sheet (the day it is about) | NS-21 row 1 (NS-15 owns behaviour; area A) |
| B-S10 | Who can read it sheet | NS-21 row 5 |
| B-S11 | Picture on the letter page: add, replace confirm, take off with Undo, words and place sheet | NS-01 |
| B-S12 | Mark a first: toggle, label field, Undo | NS-06 A |
| B-S13 | Hide until a day: date sheet with the honest limits | NS-06 B |
| B-S14 | Open now confirmation | NS-06-B3 |
| B-S15 | Delete confirmation and the Book's "Letter deleted." Undo | NS-21-R7, NS-06-B25 |
| B-S16 | Sealed letter in the Book: the hidden row | NS-06-B2 |
| B-S17 | One past letter on Home (slip 4) | NS-23 |
| B-S18 | Seal-opened line on Home (slip 2) | NS-06-B4 |
| B-S19 | Read together (whole book, or one year) | NS-24, built `read-together.tsx` |
| B-S20 | Read together: end of the year or book | NS-24 |
| B-S21 | Me row: "Past letters on Home" switch | NS-23-R4 (Me is area C's screen) |
| B-S22 | Recently deleted: the sealed letter row with no words | NS-06-B25 (screen is area C's) |
| B-S23 | Read-along (NS-29): decision record only, not drawn | NS-29 |

State suffixes used on every screen: `.default`, `.empty`, `.many`, `.offline`, `.failed`, `.killSwitch`, `.pause`, `.planLapsed`, `.signedOut`, `.secondAccount`, `.newPhone`, `.twoBooks`, `.twoParents`, `.ax5`, `.voiceOver`, `.dark`, `.increaseContrast`, plus screen-specific states listed per screen below.
