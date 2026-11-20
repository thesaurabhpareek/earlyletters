# Area A. Capture: end-to-end design (DESIGN LEAD)

Status: SKELETON, 20 Nov 2026. Screen ids below are stable; motion (MOTION.md) and words (WORDS.md) key to them.
Full journeys, layouts and the integration map follow in this file.

## Screen inventory (ids are fixed from this point)

| Id | Screen | Cards |
|---|---|---|
| A-S01 | Home (Say): dateline, whose-book switcher, greeting, prompt, Another thought, capture cluster (Speak, Type, Start from a photo, Not much today), slips, waiting cards | NS-14, NS-35, NS-01, NS-18 landing, NS-19 (Continue not drawn) |
| A-S02 | Whose book sheet (the Book's child switcher, reused on Home) | NS-14 |
| A-S03 | Apple's photo picker and the iCloud download (system surface, our states around it) | NS-01 |
| A-S04 | Listen, Ready (no picture, with a picture, arrived from a doorway) | NS-01, NS-06 C, NS-04, NS-35 |
| A-S05 | Listen, Recording (recording, still here, interrupted, held) | NS-04, NS-06 C, NS-09 |
| A-S06 | Write (Type) | NS-35, NS-01 |
| A-S07 | Review (words, Play, dateline, From, picture, Keep, Let it go, another language) | NS-15, NS-16, NS-17, NS-01, NS-09, NS-19 |
| A-S08 | Day sheet (`DateSheet`, opened from the Review dateline) | NS-15 |
| A-S09 | From: who is speaking (field and names used before) | NS-16 |
| A-S10 | Another language: mark confirm, words waiting, Type the words yourself | NS-17 |
| A-S11 | Let it go confirmation (Review and Listen) | NS-09 |
| A-S12 | Use this picture instead? (replace confirm) and the Undo line | NS-01 |
| A-S13 | After Keep: kept moment, and the hand-off to the Keep gate (area E owns the gate sheet) | NS-01 R5b, NS-13 ask (area D) |
| A-S14 | Doorways outside the app (widget, Control Center control, Action Button, Siri) and the unlock step | NS-06 C, NS-04 |
| A-S15 | Hands-free states (hypotheses only, NS-04 findings decide) | NS-04 |

State ids: `A-Snn.<state>`, for example `A-S07.default`, `A-S07.ax5`, `A-S07.notRemoved`.
