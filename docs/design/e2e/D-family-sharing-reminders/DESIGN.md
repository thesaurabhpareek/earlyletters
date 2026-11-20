# Area D: Family, sharing and reminders. End-to-end design

Status: SKELETON (screen ids are stable; the body is being written). Design lead, area D. 20 Nov 2026.

Motion (`MOTION.md`) and words (`WORDS.md`) key to the ids below. Ids will not be renumbered; new screens are appended.

## Screen inventory (ids)

| Id | Screen or surface | Card | Owner of the base screen |
|---|---|---|---|
| D-S01 | Letter page action row: the Share control (present or absent) | NS-05 | B (letter page, NS-21); D draws the control |
| D-S02 | Share preview sheet ("This will be sent") | NS-05 | D |
| D-S03 | iOS share sheet (system) and return to the letter page | NS-05 | system |
| D-S04 | Reminder ask (sheet on Home after the first kept letter) | NS-13 | D |
| D-S05 | iOS notification permission prompt (system) | NS-13 | system |
| D-S06 | Me, Reminders (settings screen: switch, how often, which evenings, hour, month notes, names, live preview, typed days list, failure line, denied state) | NS-13, NS-18, NS-32 | D |
| D-S07 | Hour picker sheet | NS-13 | D |
| D-S08 | Add a day sheet (typed day: date and words) | NS-18 | D |
| D-S09 | Typed day detail and Delete (confirm) | NS-18 | D |
| D-S10 | Lock screen and Notification Centre: every notification class, previews shown and hidden | NS-32, NS-13, NS-18 | system render, our content |
| D-S11 | Notification landing: Home (evening, typed day with its words above the prompt), Book (month, birthday), Me Plan (plan notice) | NS-13, NS-18, NS-35 | A (Home), B (Book); D draws the typed-day line |
| D-S12 | Me, the other parent row (door rule: alpha and servers on only) | NS-25 | D |
| D-S13 | Invite sheet (before sending: what the other parent will read) | NS-25 | D |
| D-S14 | Invite link page (web: iPhone, other device, expired) | NS-25 | D |
| D-S15 | Join ask: peek ("{inviter} invited you to their book", sign-off and role only) | NS-25 | D |
| D-S16 | Accept: the agreement, Agree and Not now | NS-25 | D |
| D-S17 | Joining: progress, arrival in the book | NS-25 | D |
| D-S18 | Family screen: members, pending invite, cancel invite, undo join within 72 h | NS-25 | D |
| D-S19 | Undo join confirm sheet | NS-25 | D |
| D-S20 | The other parent's phone after an undo (one plain line) | NS-25 | D |
| D-S21 | Home: "Not much today" and the kept line with Undo | NS-07 C5 | A (Home); D draws the quiet-day states |
| D-S22 | Book: the quiet-day row | NS-07 C5 | B (Book); D draws the row |
| D-S23 | Pilot artefacts the parent sees (consent message, instructions, check-ins; export of one letter) | NS-03 | not app screens |
| D-S24 | Me, Plan: the plan date line when notifications are not allowed | NS-32-R4 | E (Plus); D draws the line |

States use `D-Snn.<state>`; the full list per screen follows in the body.
