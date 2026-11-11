# New scope design specs: index, the job-clarity rule and the 12-line review

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Nothing here is built; no token, string or screen changes in this PR. No word below is live until `content` writes it, the founder approves it and `mobile` wires it in the same PR that moves it. This file assigns no BL, D, CR or NX id (working labels only).

Tags. EVIDENCE: read in the repo, or at a named PR head, this session. UNVERIFIED: not read, not run, not measured on a device. PROPOSED: my wording, number or rule. HYPOTHESIS: a statement about what a parent will do or feel. I wrote no statistic and no parent evidence exists for any HYPOTHESIS.

## 1. The founder's first rule, and what it does to every spec

Job clarity first. Design is utility-driven: every tab and every screen says its one job, and no two tabs share a verb. This replaces the four-tab bar in `NAV-TAB-ROLES-10nov.md` v3 (PR #789, head `c189206b`) for these specs. The model in that file (four classes of capability, placement rules P1 to P9) is kept; its bar changes.

| Tab | Verb | One-sentence job (PROPOSED) |
|---|---|---|
| Home | Say | I go to Home to say something to {child}. |
| Book | Read | I go to the Book to read what we kept. (Hearing a letter, Read together and Find are modes of reading.) |
| Me | Look after | I go to Me to look after my account and books. |

Fixed by the founder (verbatim intent, 11 Nov): Only Home captures. Elsewhere you can only add to an existing letter. Family is never a tab; co-parent "coming soon" is at most one caption line in Me (amended later on 11 Nov: the line is tappable and opens one sheet, spec 7). The Library is not a tab: photo-first is a capture mode on Home, and Photos is a lens in the Book. Share is not a tab unless it passes the test in `03-SHARE-ONE-LETTER-11nov.md` section 8.

Consequences I applied (PROPOSED, each is in the spec that owns it):
1. A control that starts a letter exists in one place: Home's capture cluster (Speak, Type, Not much today, and the photo-first mode). OS surfaces (widget, Control Center control, Action button, Siri) open that same cluster's Ready state. They are doorways, not entries.
2. Everything else that touches a letter says "add to this letter": a photo, a first, a seal, a date. None creates a letter.
3. Outputs split by what they are: export and where letters live are care (Me); sharing one letter is an action on the letter (Book). Neither is a tab.
4. Find and Photos and Firsts are ways to read (Book). Find is a header action, Photos and Firsts are lenses that appear only when they have material.

## 2. The seven specs, in build order (closed question X1)

The file numbers are names, not rank. The "Order" column is the PRD README's rank (#795 PR #795, merged as `6a11c808`, read through the REST API: 1 photo, 2 Find, 3 the family-hears-it pilot, 4 the hands-free spike, 5 share one letter, 6 Firsts, sealed letter and quick capture), which matches the founder's order in closed question X1. "Rank 5" in the PRD therefore means Share one letter (Build 14), not a design spec number; wherever these specs used the phrase they now say "after Share one letter (Level 1) ships". Hands-free (rank 4) is a five-day spike with no build, so spec 05's doorways are conditional on its read-out. The build order is the order of this table, per closed question X1 in `infra/closed-questions-2026-11-11.md` (Project doc): photo, Find, the family-hears-it pilot (not a design spec here), the hands-free spike, share one letter, then Firsts and sealed letters. Spec 6 is the frame for all of them.

| Order | File | Job it serves | Class (NAV-TAB-ROLES section 2) | Home tab |
|---|---|---|---|---|
| 1 | `01-PHOTO-WITH-A-LETTER-11nov.md` | Put a picture beside the words | CAPTURE (enricher and one Home mode) plus LENS | Home (start), Book (read) |
| 2 | `02-FIND-11nov.md` | Find a letter by a word | LENS | Book |
| 3 | (pilot) | Family hears it: not a design spec in this set | n/a | n/a |
| 4 (spike) | `05-HANDS-FREE-CAPTURE-STATES-11nov.md` | Start, hold and finish a take with hands busy | CAPTURE | Home |
| 5 | `03-SHARE-ONE-LETTER-11nov.md` | Send one letter to one person, and the test for a Share tab | OUTPUT, as an object action | Book (the letter page) |
| 6 | `04-FIRSTS-AND-SEALED-11nov.md` | Mark a first; seal a letter for a day; quick capture is not a second entry | CAPTURE (enrichers) and LENS | Home (Review), Book |
| any (small) | `07-COPARENT-COMING-SOON-11nov.md` | Learn what co-parent sharing will be; say "tell me when it is ready", on this phone only | CARE (a caption in Me and one sheet); no capture | Me |
| frame | `06-HOME-BOOK-ME-IA-11nov.md` | Three tabs, one job each, every state, and the navigation test | all | all |

Spec 7 supersedes the line "static text, not tappable, no row, no sheet, no chevron" that I set in spec 6 (5.1, section 8 and IA-R8) earlier on 11 Nov, on the founder's later instruction (chat, 11 Nov, amending closed question N1: the caption is tappable and opens one sheet with an on-device "tell me when it is ready"). Spec 6 is updated to match. Spec 7 changes no tab, no verb and no capture entry.

Read 6 first if you only read one: it holds the tab jobs, the states and the test that keeps the other five honest. Read 1 before 4: Firsts and seals reuse its "add to this letter" pattern.

## 3. Sources read, and how current they are

- EVIDENCE, at PR heads: `NAV-TAB-ROLES-10nov.md` at #789 head `c189206b` ("Home | Book | Share | Me", v3); `NX-41` to `NX-44` at #790 head `d80db1f2` (unique tabs, capability map, Home actions and memories, Firsts). Both PRs are drafts or open; their heads move (UNVERIFIED after 10 Nov).
- EVIDENCE on `origin/develop` `da83fb1e`: `docs/design/*`, `MEMORY-LIBRARY-FLOWS-10nov.md` (ML-S1 to S15), `docs/prd/v2/features/F04-capture.md` and `F09-book.md`, `packages/design-tokens/src/tokens.ts`, `packages/content/src/strings.en.ts`, `apps/mobile/src/components/ui/*`.
- Not on `develop`: `tab-bar.test.ts` (it lives in the open stack #699 to #764), the `photos.*` strings (NX-33 branch), the `memoryLibrary.*` strings (drafts in a spec only).
- Tag rule after review: EVIDENCE means I read that line in that file this session. A grep hit or a line range is named as such. Anything quoted from another document is second-hand and UNVERIFIED. PRD #795 (PR #795, merged as `6a11c808`) and ADR 0028 (draft, head `8206c220`) were read in part for the points cited; where they differ from these specs they win.
- Not read, so not relied on: Apple documentation (every Apple behaviour below is UNVERIFIED), the code of the open PRs beyond file lists.

## 4. Words: how every spec handles copy

- Every visible word comes from `packages/content`. Where a key exists on `develop` I name it (EVIDENCE). Where it does not, the spec lists a **slot**: a proposed key path, what the line must do, a hard limit, and which rules apply. I write no final strings. The one exception is a line that already exists in `strings.en.ts`, quoted so a reader can see it.
- Parent vocabulary only (BRAND.md glossary): book, letter, photo, kept, this phone. Not: take, entry, draft, pack, memory (as a thing the app makes), library (Apple's word), moment, share-as-backup.
- No streak, point, badge, count of gaps, "days since", countdown, fear, guilt or loss word. A number appears only where it names a date, a time length the parent just recorded, or a selection the parent just made.
- Nothing implies a machine writes. Photos and Firsts and seals never get a machine caption, tag, title, summary or alt text.
- `{child}` is the child; never gendered; fallback "Your child" (closed question N5).

## 5. The 12-line job-clarity review (working copy of the X5 charter; used in every spec)

The job-clarity charter (ten rules, twelve-line checklist) is adopted as a draft under `docs/design/` by closed question X5 in `infra/closed-questions-2026-11-11.md` (Project doc). It is not on this branch yet, so I did not read it. The charter is the one definition and wins over the table below wherever they differ; this table is the working copy I applied in each spec (PROPOSED) until the charter lands, and each spec records Pass, Fail or Open with a reason. A spec with a Fail does not go to `mobile`. An Open on J10 (words) or J11 (device pass) does not block the hand-off: `content` closes J10 and `qa` closes J11 in or before the build PR (PROPOSED; Review B finding 16d). The charter file was not found on this branch or in the PR list when Review B looked; J1 to J12 are replaced by it when it lands, and its ten rules are not in any spec here.

| # | Line | The question |
|---|---|---|
| J1 | One job | Can the job be said in one sentence of 12 words or fewer with one verb? |
| J2 | Unique verb | Is that verb different from the verb of every other tab? |
| J3 | One capture entry | Does the item add a control that starts a letter anywhere but Home? (It must not.) |
| J4 | One object | Is there one main kind of thing on the screen (a letter, a photo, a setting)? |
| J5 | First line says it | Does the heading or first element tell the job without reading further? |
| J6 | One primary action | Is there one primary action per screen, with the rest quiet? |
| J7 | Doorway, not a copy | Does it point to another tab's list rather than repeat it? |
| J8 | Day one is whole | On day one is it neither an empty box nor mostly a promise? |
| J9 | States say what next | Do empty, first-run, offline and error each say what to do in one line? |
| J10 | Words | Glossary words only; no count of gaps, no streak, no internal term, no machine-writes implication? |
| J11 | Everyone | VoiceOver order and heading, Dynamic Type to AX5 with letter text whole, 44 pt targets, Reduce Motion and Reduce Transparency, both themes, colour never the only signal? |
| J12 | Removal | If it were deleted, which job goes undone, and does another place already do it? |

J3 and J2 are machine-checked by the navigation test in `06-HOME-BOOK-ME-IA-11nov.md` section 10; the rest are judged by a person on a device.

## 6. Shared accessibility and motion baseline (not repeated in each spec)

These hold for all seven; a spec lists only what it adds. Sources: `COMPONENTS.md` section 0, `MOTION.md`, `DESIGN_LANGUAGE.md`, TDD 09 (read in part, by headings and the lines cited; TDD 09 itself I did not open, so anything attributed to it is UNVERIFIED; device behaviour UNVERIFIED until `qa` runs it).

- Targets: 44 pt minimum (`target.min`), 56 pt primary (`target.primary`), 64 pt for Speak and Type (`target.capture`).
- Letter text is never truncated at any Dynamic Type size (D-027). Where space is short the layout stacks and scrolls; it does not cut. A fade at a card's foot (ExcerptFade) is allowed only where the full text is one tap away and the screen reader reads the whole text.
- Colour is never the only signal: state is also a word, a shape or a position. Pairs used are from `tokens.ts`; contrast figures in its comments are the proof (read in `tokens.ts` comments, not recomputed by me: `text` on `bg` 14.00 : 1 light, 15.66 dark; `textMuted` 5.51 and 8.01; `accent` on `accentSoft` 4.74 light and 5.99 dark per `MEMORY-LIBRARY-FLOWS` section 6). I computed no new ratio in these specs.
- Motion: only tokens from `tokens.motion` (`fadeMs` 200, `exitMs` 160, `enter` 280 ms and 8 pt, `staggerMs` 30 with a maximum of 6, `press`, springs `snappy`, `standard`, `gentle`). Reduce Motion replaces every movement with a `fadeMs` fade or nothing. No new motion token is proposed in any spec.
- Reduce Transparency: no blur; surfaces are solid `surfaceRaised` with a 1 pt `line` edge (`platform/blur-surface`, COMPONENTS 2.18).
- Increase Contrast: `tokens.highContrast`.
- VoiceOver: each screen has one level 1 heading; reading order is job first (heading, primary action), then content, then quiet actions. Announcements are polite and once.
- Haptics: only the five intents in COMPONENTS 0.2.
- No sound is added by any spec. Capture sounds stay as `SOUND.md` has them (none while recording).

## 7. New tokens and components across the seven (the whole list; spec 7 adds none)

Tokens are added in `packages/design-tokens/src/tokens.ts` with their tests, by `design-systems`, in a later PR. None is added here.

| Item | Needed by | Note |
|---|---|---|
| `colors.onScrim`, `colors.viewer`, `colors.mediaScrim` | 1, post-Build 13 (viewer and video badge) | `MEMORY-LIBRARY-FLOWS` section 5.1 proposed `scrim` at 60 percent. `scrim` already exists (`#2B272252`, ink at 32 percent, the sheet dimmer), so a 60 percent value must be a new name, `mediaScrim`, or it changes every sheet. Found in this pass. |
| `media.tileMin` 96, `media.gap` = `space[1]` | 1, post-Build 13 only (a grid of tiles; Build 13's lens is letter cards, so not needed there) | As ML section 5.1 |
| `media.stripTile` 72 | 1, post-Build 13 (the multi-photo strip) | As ML section 5.1 |
| `media.cap` 8, `capVideo` 2, `videoMaxSec` 60 | 1, post-Build 13 (Build 13 is one photo per letter, no video) | Product limits; may belong in `packages/core` (Q3 of the ML spec) |
| No token | 2, 3, 4, 5, 6 | Existing colour, space, radius, type and motion tokens are enough |

Components, library first (`apps/mobile/src/components/ui/`, read as a directory listing at `da83fb1e`, so the names exist but I did not read their code and behaviour is UNVERIFIED: `button`, `card`, `choice-group`, `empty-state`, `list-row`, `screen-header`, `sheet`, `state-screen`, `text-field`, `toast`, `lamp`, `separator`):

| Component | Status | Used by |
|---|---|---|
| Button, Card, Chip, ListRow, Sheet, Toast, TextField, Toggle, StateScreen, EmptyState, AppNote, ErrorLine, SegmentedControl, DateField | exist or spec'd in COMPONENTS | all |
| MediaTile, MediaGrid | NEW, specified in ML section 5.2; NOT needed in Build 13. The Photos lens is letter cards with a thumbnail (PRD NS-01-R11, spec 1 section 5), so Build 13 needs a `LetterCard` variant with `PhotoFrame inline`. A grid of tiles is post-Build 13, if at all. Whether the code needs `MediaTile` for the thumbnail: UNVERIFIED (components not read) | 1 |
| MediaStrip, MediaViewer, MediaChooser | NEW, specified in ML section 5.2; post-Build 13. Build 13 has the system picker only (PRD NS-01-R22): no in-app chooser, no pre-prompt, no strip, no viewer swipe | 1 |
| LensRow | NEW (a `SegmentedControl` preset, text first) | 1, 4, 6 |
| FindBar, FindResultRow | NEW (a `TextField` preset and a `LetterCard` variant) | 2 |
| SharePreview | NEW (a `Sheet` preset) | 3 |
| SealedRow | NEW (a `ListRow` variant) | 4 |
| FirstMark | NEW (a `Toggle` row plus a `TextField`) | 4 |
| HandsFreeReady | NEW (a state of the existing Listen screen; no new component if `CaptureBar` and `ListeningAura` cover it) | 5 |
| TabJobHeader | NEW (heading level 1 plus one job line; a `ScreenHeader` variant) | 6 |

## 8. Hand-offs created by these specs

| To | What | Where |
|---|---|---|
| `content` | New copy slots (listed in each spec's copy-slot section) with limits and rules; none written | each spec, section "Copy slots" |
| `mobile` | Screens and logic; the navigation test | 06 sections 9 and 10; each spec's sequence |
| `product` | Requirement ids; reconcile NX-42 (Moments tab dissolves) and NX-41 R12 | 06 section 12 |
| `legal`, `privacy` | The Shown, Records, Never, Decline lines for photo permission, sharing a letter and a seal; whether system dictation needs a privacy line (02, 04) (COORDINATION section 10, PRIV-R21) | 01, 02, 03, 04 |
| `legal`, `security`, `privacy` | Hands-free doorways: no new consent or permission (05 door lines); one decision, starting a take from a locked phone (default: unlock first, 05 decision 8) | 05 |
| `content` | Wording that could read as a machine writing: "Writing down what you said", "words being made", "getting ready", "made". CLAUDE.md: never imply AI writes anything. Review these existing and proposed lines | 02, 05, 06 |
| `content` | Decisions I list as PROPOSED and do not make: the Share verb (Share, Send or Give; the PRD says Give), the letter-page Share label length (22 or 24 characters), the group name "Add to this letter", the tab headings and the Me heading ("Me" with the line "Account and settings"), "Continue" and "Not now", the seal word (hidden, closed, sealed), the glossary rows for Home and Me, a shape or position word for "the red circle", and every co-parent string in spec 7 section 8 | 03, 04, 05, 06, 07 |
| `product` | PRD edits this pass implies in #795: NS-05-R4 (the words row is static text, not a disabled toggle), NS-02-R3 (is a VoiceOver-only hint allowed under 3 characters), the Photos lens as letter cards (already R11), and the flag that NS-04 doorways are a spike; the PRD README and NS-05, NS-06 still cite design head 38abc432 and the README still says "stack-rank order"; NS-06 says "after rank 5" without saying rank 5 is Share one letter | 02, 03, 05 |
| `qa` | Device passes for every UNVERIFIED, AX5 and VoiceOver tables | each spec's checklist |
| `user-research` | Five-parent reads for the job sentences, Find, Share and seals | 06 section 11 |
| `data-architect` | Fields: first mark and label, photo description, share log (none). Exact question on the seal clock: reconcile ADR 0028 D3, which stores `sealed_until` as a calendar date with a UTC-plus-grace rule for other readers, with PRD NS-06-B1, which stores one absolute UTC instant (the author's local midnight at the start of the chosen day, in the device's zone at sealing). Is it one stored field or two? Until then FS-R7, the 04 B6 clock rows and 02 FD-R9 seal transitions are PROVISIONAL (Karma ruling: the instant stays for now); ADR 0028 D4 (`searchable_letters` reads the local calendar date) is part of the same reconciliation. Owner: `data-architect`. Answer by Fri 20 Nov 2026 | 04, 01, 03 |

## 9. Open design questions, all seven (spec 7: CS-Q1 to CS-Q6 in its section 12; default CS-Q2 is the founder's to see), each with a default

Listed per spec in its last section (question numbers are per spec; this table points to the section, not a number). The ones the founder should see first:

| # | Question | Default if no answer | Spec |
|---|---|---|---|
| Q0 | Build share one letter? | DECIDED by the founder (10 Nov, relayed by Karma; original not read): yes, text first. Not an agent default | 03 |
| Q1 | Is there ever a Share tab? | No. Sharing one letter is a letter-page action; export stays in Me. The tab test (03 section 8) is the only way to reopen it | 03 |
| Q2 | Does photo-first need the camera, or the library? | Build 13: the system picker only, returning one photo; no camera, no library access, no in-app chooser, no pre-prompt (PRD NS-01-R22). Spec 01 section 1a | 01 |
| Q3 | Firsts: when are they built? (NX-44 FD-1) | Included in scope (founder: include all new scope; relayed). Specified in full; build sequenced after Share one letter (Level 1) ships and the five-parent study has run, earliest Build 15. Nothing is cancelled | 04 section A |
| Q4 | Sealed letters: when are they built? | Included in scope. Specified in full; build sequenced after Share one letter (Level 1) ships and the five-parent study has run, earliest Build 15 (ADR 0028 D3 and PRD NS-06 agree on the sequence). "Sealed" and "locked" are not used unless the seal is real cryptography | 04 section B |
| Q4a | Needs the founder: does "all new scope" include Firsts and sealed letters as built features, or as specified features? | Default: specified now, built in the sequence above. This is the reading that keeps both in scope without moving ranks 1 to 5 | 04, `needs:founder`. ADR 0028 Q6 (may an author hide a letter from the other parent) also stays open, founder with counsel; 04 B6a is the stronger-privacy default meanwhile, per the coordinator ruling in `infra/closed-questions-2026-11-11.md` |
| Q5 | What does Find search? | Letters' words, first labels, the parent's typed photo text and typed place; never a place or date derived from the file (PRD NS-02-R5) | 02 section 4 |
| Q6 | Where does "Take the book with you" (export, where letters live) live? | Me, as one section, titled by `content` | 06 |
