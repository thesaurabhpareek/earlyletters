# Area C. Keeping and trust: end-to-end design

Status: SKELETON (screen ids fixed; body in progress). Design lead, area C. 20 Nov 2026.
Motion (MOTION.md) and words (WORDS.md) key to the ids below. Ids are stable from this version on; new screens get the next number, never a reused one.

## Screen and state inventory (ids)

| Id | Screen | Card source |
|---|---|---|
| C-S01 | Me (Look after), the tab root | frame section 4; NS-11-R1; NS-22-R3 (Hide in Me); D1 |
| C-S02 | Account (sign-in method, sign out, sign out of other phones) | D1; NS-08-R6, R15; NS-09-R12 |
| C-S03 | Sign-out sheet (the D1 sheet) | D1; NS-08-R6; NS-01-R30; X4 |
| C-S04 | Save a copy (the one export screen, reached from Me and the slip) | NS-11; NS-07 C28; NS-10-R4b; NS-36-R2 |
| C-S05 | Making the printable book (PDF) | NS-07 C28 |
| C-S06 | Home slip: Save a copy in the birthday week | NS-11-R2 to R4, R7, R8, R13 to R15 |
| C-S07 | Which book (twins chooser sheet) | NS-11-R14 |
| C-S08 | Where your letters live | NS-08-R7, R8; NS-10 claims |
| C-S09 | Letter page: where the recording is (provenance row) | NS-08 design inputs, R20; NS-10-R1 |
| C-S10 | Opening your book (new phone held screen) | NS-10-R0, R2, R8, R9, R11, R12 |
| C-S11 | Returning consent sheet and the declined screen | NS-10-R0, R4a, R4b, R7 |
| C-S12 | Book-level new phone line (Book header slip area) | NS-10-R13 |
| C-S13 | Earlier versions (list) | NS-12-R1, R4, R7, R8 |
| C-S14 | An earlier version (read-only view, Restore, Remove) | NS-12-R2, R3, R6 |
| C-S15 | A book in Me (name, dates, Quiet this book, Hide this book, Delete this book) | NS-22-R3; F12-REQ-011; BL-985 |
| C-S16 | Hidden books | NS-22; F09-REQ-016 |
| C-S17 | Recently deleted | NS-21-R7b; NS-36-R1a to R1c; NS-06-B25 |
| C-S18 | Storage (space, stuck recording, Remove now) | NS-09-R6; NS-11-R20 |
| C-S19 | Erase everything on this phone | D1; NS-36 erase row; NS-01-R52 |
| C-S20 | Delete account | D6; NS-01-R31; NS-10-R4a; NS-08-R16 |
| C-S21 | Recording backup (flip-only honest states; absent today) | NS-08 sections 4, 5, 12 |
| C-S22 | Delete this book | F17 6.2 D (built); NS-36 |

State suffixes used on every screen: `.default`, `.empty`, `.loading`, `.offline`, `.error-<code>`, `.killswitch`, `.lapsed`, `.second-account`, `.signedout`, `.ax5`, `.vo` (VoiceOver order), `.dark`. Screen-specific states are listed per screen.
