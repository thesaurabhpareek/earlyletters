# Design gap list and coverage index (founder ask, 21 Nov 2026)

Status: DRAFT for Karma and product. Author: `design-systems`. Docs only. Source: handoff issue #1181 (task #82). Read against `develop` (depth 1 sparse clone, 21 Nov 2026).

What this is: every screen, sheet, state and flow found with no spec or no wireframe in `docs/design`, with source requirement id, owner and status per row. It writes no copy. Words stay `PROPOSED` or `CONTENT-NEEDED`; founder wording is not touched. The canvas artifact shows what is drawn; this file says what must exist. Keep both in step: when a row closes, change its status here and tick it on the canvas.

Status words: `OPEN` (nothing exists), `SPEC-PR` (a spec is in a pull request, number given), `RULING` (needs a decision before design can draw), `NOT A GAP` (checked, deliberately undrawn), `UNVERIFIED` (could not confirm from the files read).

## 1. How the search was done

1. Routes: every file under `apps/mobile/src/app` (43 files) mapped to a screen id in `IA-FINAL-20nov.md` section 5 and 7.4 and to `e2e/INDEX.md`.
2. Cards: `NS-01` to `NS-52` compared with the card column of `e2e/INDEX.md` and with `specs/`, `screens/`, `SPEC-SYNC-20nov.md`.
3. Errata `E1` to `E94` in `product/prd/18-errata-after-lock.md`: each id searched in `docs/design`. 43 ids have no mention there (E29, E30, E33, E35, E37, E39, E41, E42, E44, E45, E47 to E50, E52 to E56, E60 and E61, E63 to E69, E71 to E74, E84 to E94). Read for screen impact: only E45, E47, E48, E49, E56 touch a screen or a state, and each appears to be carried by an INDEX state, matched by name and not checked line by line (C-S24 and D-S06 lock-screen rule, E-S19 and E-S14 outage, B-S08 `mediaMissing`, C-S03 sign-out sheet, E-S07 `declined`). The rest are engineering, data and records items with no screen. They are not gaps.
4. States: `e2e/INDEX.md` state names per screen checked for the five states the founder named (empty, error, offline, AX5, dark).

Not read in full, said plainly: cards 01 to 27 beyond their headings and the rows named below; the area `DESIGN.md` files line by line; no screen was run on a device.

## 2. Gap list

| Id | Gap | Kind | Source requirement | Owner | Status |
|---|---|---|---|---|---|
| GAP-01 | `/settings/legal` (Legal): no screen id, no states. IA 7.4 says "none". | screen | NS-42 (agreements and notices), IA 7.4 row (source requirement id UNVERIFIED) | design-systems (layout), legal (words) | SPEC-PR (see section 4) |
| GAP-02 | `/settings/licenses` (Licenses): no screen id; about 150 rows, long text, expand rows, AX5 and VoiceOver untested in any doc. | screen | release requirement named in `licenses.tsx` (id UNVERIFIED), NS-33 | design-systems | SPEC-PR |
| GAP-03 | `/settings/your-words` has no screen id. IA 7.4 and the built page say it is the "Small fixes, marked / Exactly as said" default choice. `SCREEN-PATHS` PATH-12 and `SPEC-SYNC` E80 describe it as a list of taught names. One name, two pages. | screen, conflict | E80, FR-AIS-34, constitution | product (ruling), design-systems | RULING, SPEC-PR for the built page |
| GAP-04 | Taught-names screen (teach a name, edit, remove, empty, new phone starts empty). No design and no route exists on `develop`. | screen | E80, FR-AIS-34 | product (is it in 1.0?), design-systems | RULING |
| GAP-05 | `/settings/children/new` (Add a book): IA says "first-run form reused"; no screen id, no states (name rules, waiting primary and its reason, expecting versus born, offline, AX5, dark, cancel with typed text). | screen | NS-14, NS-43 | design-systems | SPEC-PR |
| GAP-06 | `/settings/language` (Spoken language): no own screen id (borrowed from A-S10 and E-S08). Pack downloading, failed, cellular once, three-language cap, English-only build, Chinese script, Portuguese spelling, picker sheet: no state table. | screen | NS-17, ADR 0014 | design-systems | SPEC-PR |
| GAP-07 | Settings stack title "Settings" over the same body as the tab "Me" (IA OI-15). | naming | NS-33-R2 | content, mobile | RULING (not a drawing gap) |
| GAP-08 | Photos access has four ids (A-S18, E-S32, C-S27, A-S17); the surviving id is not ruled (IA OI-7). | index | NS-51 | design-systems, product | RULING |
| GAP-09 | No per-screen matrix of empty, error, offline, AX5 and dark. INDEX names them for some screens only (counts in section 3); a missing name does not prove the state is undrawn, and no row says "n/a" with its reason. | coverage | NS-33, founder ask of 20 Nov | design-systems with area leads A to E | SPEC-PR (index in section 3; each area lead confirms or draws) |
| GAP-10 | NS-33 R4, R7, R9, R10 and R16 name five screens (Home, Review, Book, letter page, Listen). Settings pages and sheets (about 30 routes) have no AX5, Bold Text, Voice Control, Switch Control or automated-audit row. | rule | NS-33-R4 to R10, R16, E42 | design-systems, qa | OPEN (proposed rows in the NS-33 PR, not drafted here) |
| GAP-11 | `+native-intent`: outside links may open only `/` and `/invite`; a link to a gated route opens Home. No screen state says what the person sees when a link to Letter, Review or Listen lands on Home. | flow | NS-35, IA 5.1 | design-systems, mobile | UNVERIFIED; OPEN |
| GAP-12 | Hidden book opened from Hidden books has no route (IA OI-11); Earlier versions and "Where the recording is" have specs (C-S13, C-S14, C-S09) and no route file (OI-17). Design exists; build does not. | build | NS-06, NS-12 | mobile | NOT A DESIGN GAP |
| GAP-13 | Card to screen trace: INDEX cites no screen for NS-34 (speed), NS-38 (store page), NS-41 and NS-42 (sign-up, agreements). E-S02 to E-S07 and E-S27 exist; the card column omits them. | index | NS-34, NS-38, NS-41, NS-42 | design-systems | OPEN (one-line INDEX fix, area E lead) |
| GAP-14 | NS-26, NS-27, NS-28, NS-29, NS-30 (printed book), NS-31 have no screens. | not drawn | their decision records | none | NOT A GAP: each card says designers do not draw until it is reopened. |
| GAP-15 | iPad and landscape: six design files mention iPad, none sets a rule for the app. | rule | PRD 00 (iOS first) | design-systems | UNVERIFIED (app config not in this checkout) |

## 3. Coverage index: which states INDEX names, per screen

Machine count from `e2e/INDEX.md` (130 screen ids), by matching the state names in each row. "yes" means the INDEX names such a state; "no" means it does not name one, which is not the same as undrawn: the area file may draw it under another name, or the state may not apply. Totals of "yes": AX5 49, dark 30, offline 22, error 42, empty 26, out of 130.

Rule for closing a row: the area lead either names the state in the INDEX, or writes "n/a" and one reason (for example "local screen, no network"). Global rules (every screen holds at AX5 and in dark, `A11Y-AND-TYPE-AUDIT-20nov.md` section 0 and `SCREEN-PATHS` section 0) cover the default; this table shows where a screen has a state of its own that is drawn.

| Screen | AX5 | Dark | Offline | Error | Empty |
|---|---|---|---|---|---|
| A-S01 | no | no | no | no | no |
| A-S02 | no | no | no | no | no |
| A-S03 | no | no | no | no | no |
| A-S04 | no | no | yes | yes | no |
| A-S05 | no | no | no | no | no |
| A-S06 | no | no | no | no | no |
| A-S07 | no | no | no | yes | yes |
| A-S08 | no | no | no | no | no |
| A-S09 | no | no | no | no | yes |
| A-S10 | no | no | no | no | no |
| A-S11 | no | no | no | no | no |
| A-S12 | no | no | no | no | no |
| A-S13 | no | no | no | no | no |
| A-S14 | no | no | no | no | yes |
| A-S15 | no | no | no | no | no |
| A-S16 | no | no | no | no | yes |
| A-S17 | no | no | no | no | no |
| A-S18 | no | no | no | yes | no |
| B-S01 | yes | yes | yes | yes | yes |
| B-S02 | yes | no | no | yes | no |
| B-S03 | yes | no | no | no | no |
| B-S04 | yes | yes | no | no | no |
| B-S05 | yes | no | no | no | yes |
| B-S06 | yes | yes | yes | yes | no |
| B-S07 | yes | yes | no | no | no |
| B-S08 | yes | yes | yes | yes | yes |
| B-S09 | no | no | no | yes | no |
| B-S10 | yes | no | no | yes | no |
| B-S11 | yes | no | yes | yes | no |
| B-S12 | yes | no | no | yes | no |
| B-S13 | yes | yes | no | no | no |
| B-S14 | yes | no | yes | no | no |
| B-S15 | no | no | no | no | no |
| B-S16 | yes | yes | no | no | no |
| B-S17 | yes | yes | no | no | no |
| B-S18 | yes | no | no | no | no |
| B-S19 | yes | yes | no | yes | no |
| B-S20 | no | no | no | no | no |
| B-S21 | no | no | no | no | yes |
| B-S22 | no | no | no | no | yes |
| B-S23 | no | no | no | no | yes |
| B-S24 | no | no | no | no | yes |
| B-S25 | no | no | no | no | yes |
| B-S26 | no | no | no | no | yes |
| C-S01 | yes | no | no | no | no |
| C-S02 | yes | yes | yes | no | no |
| C-S03 | no | no | no | no | no |
| C-S04 | yes | yes | no | yes | yes |
| C-S05 | no | no | no | yes | no |
| C-S06 | yes | yes | no | no | no |
| C-S07 | no | no | no | no | no |
| C-S08 | yes | yes | no | no | no |
| C-S09 | no | no | no | no | no |
| C-S10 | yes | yes | yes | no | no |
| C-S11 | yes | yes | no | no | no |
| C-S12 | no | no | no | no | no |
| C-S13 | no | no | yes | yes | yes |
| C-S14 | no | no | no | no | no |
| C-S15 | yes | yes | no | yes | no |
| C-S16 | no | no | no | no | yes |
| C-S17 | no | no | no | yes | no |
| C-S18 | no | no | no | no | no |
| C-S19 | no | no | no | yes | no |
| C-S20 | no | no | yes | yes | no |
| C-S21 | no | no | no | no | no |
| C-S22 | no | no | no | no | yes |
| C-S23 | no | no | no | no | no |
| C-S24 | yes | yes | yes | yes | yes |
| C-S25 | no | no | no | yes | no |
| C-S26 | no | no | no | no | no |
| C-S27 | no | no | no | yes | no |
| D-S01 | no | no | no | no | no |
| D-S02 | yes | no | no | yes | no |
| D-S03 | no | no | no | no | no |
| D-S04 | no | no | no | yes | no |
| D-S05 | no | no | no | no | no |
| D-S06 | yes | no | no | yes | yes |
| D-S07 | no | no | no | no | no |
| D-S08 | no | no | no | yes | yes |
| D-S09 | no | no | no | no | no |
| D-S10 | no | no | no | no | no |
| D-S11 | no | no | no | no | no |
| D-S12 | no | no | no | no | no |
| D-S13 | no | no | yes | no | no |
| D-S14 | no | no | no | no | no |
| D-S15 | no | no | yes | yes | no |
| D-S16 | no | no | yes | yes | no |
| D-S17 | no | no | no | no | no |
| D-S18 | no | no | no | no | no |
| D-S19 | no | no | yes | yes | no |
| D-S20 | no | no | no | no | no |
| D-S21 | no | no | no | yes | no |
| D-S22 | no | no | no | no | no |
| D-S23 | no | no | no | no | no |
| D-S24 | no | no | no | yes | no |
| D-S25 | no | no | yes | yes | yes |
| D-S26 | no | no | no | no | no |
| D-S27 | no | no | no | no | yes |
| E-S01 | yes | yes | no | yes | no |
| E-S02 | yes | no | no | yes | no |
| E-S03 | yes | no | no | no | no |
| E-S04 | yes | no | no | yes | no |
| E-S05 | yes | yes | no | yes | yes |
| E-S06 | yes | yes | no | yes | no |
| E-S07 | yes | yes | yes | yes | no |
| E-S08 | yes | no | no | no | no |
| E-S09 | no | no | no | no | yes |
| E-S10 | yes | yes | yes | yes | no |
| E-S11 | yes | yes | no | yes | yes |
| E-S12 | yes | yes | no | no | no |
| E-S13 | yes | yes | no | no | no |
| E-S14 | yes | no | yes | no | no |
| E-S15 | yes | yes | yes | no | no |
| E-S16 | yes | no | no | no | no |
| E-S17 | no | no | no | no | no |
| E-S18 | no | no | no | no | no |
| E-S19 | no | no | no | no | no |
| E-S20 | yes | yes | no | no | no |
| E-S21 | no | yes | no | no | no |
| E-S22 | yes | yes | no | yes | no |
| E-S23 | no | no | no | no | no |
| E-S24 | yes | no | no | no | no |
| E-S25 | yes | yes | no | no | no |
| E-S26 | no | no | no | no | no |
| E-S27 | no | no | no | no | no |
| E-S28 | no | no | no | no | no |
| E-S29 | no | no | no | yes | no |
| E-S30 | yes | no | yes | no | no |
| E-S31 | yes | no | yes | no | no |
| E-S32 | no | no | no | no | yes |

## 4. Pull requests that close rows

Filled in as each is opened. Each is docs only and one concern. Status of every spec row inside them is `PROPOSED`; words are `CONTENT-NEEDED` unless a built key is named.

| Pull request | Closes |
|---|---|
| #1185 this file | GAP-09 index, records all |
| #1186 Legal and Licenses spec | GAP-01, GAP-02 |
| #1187 Your words spec | GAP-03 (built page); GAP-04 asks for a ruling |
| #1188 Add a book spec | GAP-05 |
| #1189 Spoken language spec | GAP-06 |

## 5. What I need

- `product`: rule GAP-03 and GAP-04 (is a taught-names screen in 1.0, and which page owns the name "Your words"); GAP-08 (surviving Photos access id); name the drop for GAP-11.
- `content`: words for every `CONTENT-NEEDED` row in the specs above; GAP-07.
- `mobile`: confirm the states in the specs against the build; GAP-12 routes.
- Area leads A to E (`design`): confirm or draw each "no" in section 3 for your screens.

Signed: `design-systems`, 21 Nov 2026.
