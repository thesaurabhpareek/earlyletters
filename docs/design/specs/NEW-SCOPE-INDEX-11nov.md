# New scope design specs: index, the job-clarity rule and the 12-line review

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Nothing here is built; no token, string or screen changes in this PR. No word below is live until `content` writes it, the founder approves it and `mobile` wires it in the same PR that moves it. This file assigns no BL, D, CR or NX id (working labels only).

Tags. EVIDENCE: read in the repo, or at a named PR head, this session. UNVERIFIED: not read, not run, not measured on a device. PROPOSED: my wording, number or rule. HYPOTHESIS: a statement about what a parent will do or feel. I wrote no statistic and no parent evidence exists for any HYPOTHESIS.

## 1. The founder's first rule, and what it does to every spec

Job clarity first. Design is utility-driven: every tab and every screen says its one job, and no two tabs share a verb. This replaces the four-tab bar in `NAV-TAB-ROLES-10nov.md` v3 (PR #789, head `c189206b`) for these specs. The model in that file (four classes of capability, placement rules P1 to P9) is kept; its bar changes.

| Tab | Verb | One-sentence job (PROPOSED) |
|---|---|---|
| Home | Say | I go to Home to say something to {child}. |
| Book | Read | I go to the Book to read what we kept. (Hearing a letter, Read together and Find are modes of reading.) |
| Me | Look after | I go to Me to look after my account, my books and my rules. |

Fixed by the founder (verbatim intent, 11 Nov): Only Home captures. Elsewhere you can only add to an existing letter. Family is never a tab; co-parent "coming soon" is at most one caption line in Me. The Library is not a tab: photo-first is a capture mode on Home, and Photos is a lens in the Book. Share is not a tab unless it passes the test in `03-SHARE-ONE-LETTER-11nov.md` section 9.

Consequences I applied (PROPOSED, each is in the spec that owns it):
1. A control that starts a letter exists in one place: Home's capture cluster (Speak, Type, Not much today, and the photo-first mode). OS surfaces (widget, Lock Screen control, Action button, Siri) open that same cluster's Ready state. They are doorways, not entries.
2. Everything else that touches a letter says "add to this letter": a photo, a first, a seal, a date. None creates a letter.
3. Outputs split by what they are: export and where letters live are care (Me); sharing one letter is an action on the letter (Book). Neither is a tab.
4. Find and Photos and Firsts are ways to read (Book). Find is a header action, Photos and Firsts are lenses that appear only when they have material.

## 2. The six specs, in stack-rank order

| # | File | Job it serves | Class (NAV-TAB-ROLES section 2) | Home tab |
|---|---|---|---|---|
| 1 | `01-PHOTO-WITH-A-LETTER-11nov.md` | Put a picture beside the words | CAPTURE (enricher and one Home mode) plus LENS | Home (start), Book (read) |
| 2 | `02-FIND-11nov.md` | Find a letter by a word | LENS | Book |
| 3 | `03-SHARE-ONE-LETTER-11nov.md` | Send one letter to one person, and the test for a Share tab | OUTPUT, as an object action | Book (the letter page) |
| 4 | `04-FIRSTS-AND-SEALED-11nov.md` | Mark a first; seal a letter for a day; quick capture is not a second entry | CAPTURE (enrichers) and LENS | Home (Review), Book |
| 5 | `05-HANDS-FREE-CAPTURE-STATES-11nov.md` | Start, hold and finish a take with hands busy | CAPTURE | Home |
| 6 | `06-HOME-BOOK-ME-IA-11nov.md` | Three tabs, one job each, every state, and the navigation test | all | all |

Read 6 first if you only read one: it holds the tab jobs, the states and the test that keeps the other five honest. Read 1 before 4: Firsts and seals reuse its "add to this letter" pattern.

## 3. Sources read, and how current they are

- EVIDENCE, at PR heads: `NAV-TAB-ROLES-10nov.md` at #789 head `c189206b` ("Home | Book | Share | Me", v3); `NX-41` to `NX-44` at #790 head `d80db1f2` (unique tabs, capability map, Home actions and memories, Firsts). Both PRs are drafts or open; their heads move (UNVERIFIED after 10 Nov).
- EVIDENCE on `origin/develop` `da83fb1e`: `docs/design/*`, `MEMORY-LIBRARY-FLOWS-10nov.md` (ML-S1 to S15), `docs/prd/v2/features/F04-capture.md` and `F09-book.md`, `packages/design-tokens/src/tokens.ts`, `packages/content/src/strings.en.ts`, `apps/mobile/src/components/ui/*`.
- Not on `develop`: `tab-bar.test.ts` (it lives in the open stack #699 to #764), the `photos.*` strings (NX-33 branch), the `memoryLibrary.*` strings (drafts in a spec only).
- Tag rule after review: EVIDENCE means I read that line in that file this session. A grep hit or a line range is named as such. Anything quoted from another document is second-hand and UNVERIFIED. PRD #795 (head `41ed5166`) and ADR 0028 (draft, head `8206c220`) were read in part for the points cited; where they differ from these specs they win.
- Not read, so not relied on: Apple documentation (every Apple behaviour below is UNVERIFIED), the code of the open PRs beyond file lists.

## 4. Words: how every spec handles copy

- Every visible word comes from `packages/content`. Where a key exists on `develop` I name it (EVIDENCE). Where it does not, the spec lists a **slot**: a proposed key path, what the line must do, a hard limit, and which rules apply. I write no final strings. The one exception is a line that already exists in `strings.en.ts`, quoted so a reader can see it.
- Parent vocabulary only (BRAND.md glossary): book, letter, photo, kept, this phone. Not: take, entry, draft, pack, memory (as a thing the app makes), library (Apple's word), moment, share-as-backup.
- No streak, point, badge, count of gaps, "days since", countdown, fear, guilt or loss word. A number appears only where it names a date, a time length the parent just recorded, or a selection the parent just made.
- Nothing implies a machine writes. Photos and Firsts and seals never get a machine caption, tag, title, summary or alt text.
- `{child}` is the child; never gendered; fallback "your child".

## 5. The 12-line job-clarity review (PROPOSED; used in every spec)

No such checklist exists in the repo today (I searched `docs/` for "job clarity" and "12-line" on `develop`; the only hit is unrelated). This is the one definition; each spec applies it as a table with a Pass, Fail or Open and a reason. A spec with a Fail does not go to `mobile`.

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

These hold for all six; a spec lists only what it adds. Sources: `COMPONENTS.md` section 0, `MOTION.md`, `DESIGN_LANGUAGE.md`, TDD 09 (read in part, by headings and the lines cited; TDD 09 itself I did not open, so anything attributed to it is UNVERIFIED; device behaviour UNVERIFIED until `qa` runs it).

- Targets: 44 pt minimum (`target.min`), 56 pt primary (`target.primary`), 64 pt for Speak and Type (`target.capture`).
- Letter text is never truncated at any Dynamic Type size (D-027). Where space is short the layout stacks and scrolls; it does not cut. A fade at a card's foot (ExcerptFade) is allowed only where the full text is one tap away and the screen reader reads the whole text.
- Colour is never the only signal: state is also a word, a shape or a position. Pairs used are from `tokens.ts`; contrast figures in its comments are the proof (EVIDENCE: `text` on `bg` 14.00 : 1 light, 15.66 dark; `textMuted` 5.51 and 8.01; `accent` on `accentSoft` 4.74 light and 5.99 dark per `MEMORY-LIBRARY-FLOWS` section 6). I computed no new ratio in these specs.
- Motion: only tokens from `tokens.motion` (`fadeMs` 200, `exitMs` 160, `enter` 280 ms and 8 pt, `staggerMs` 30 with a maximum of 6, `press`, springs `snappy`, `standard`, `gentle`). Reduce Motion replaces every movement with a `fadeMs` fade or nothing. No new motion token is proposed in any spec.
- Reduce Transparency: no blur; surfaces are solid `surfaceRaised` with a 1 pt `line` edge (`platform/blur-surface`, COMPONENTS 2.18).
- Increase Contrast: `tokens.highContrast`.
- VoiceOver: each screen has one level 1 heading; reading order is job first (heading, primary action), then content, then quiet actions. Announcements are polite and once.
- Haptics: only the five intents in COMPONENTS 0.2.
- No sound is added by any spec. Capture sounds stay as `SOUND.md` has them (none while recording).

## 7. New tokens and components across the six (the whole list)

Tokens are added in `packages/design-tokens/src/tokens.ts` with their tests, by `design-systems`, in a later PR. None is added here.

| Item | Needed by | Note |
|---|---|---|
| `colors.onScrim`, `colors.viewer`, `colors.mediaScrim` | 1 | `MEMORY-LIBRARY-FLOWS` section 5.1 proposed `scrim` at 60 percent. `scrim` already exists (`#2B272252`, ink at 32 percent, the sheet dimmer), so a 60 percent value must be a new name, `mediaScrim`, or it changes every sheet. Found in this pass. |
| `media.tileMin` 96, `media.gap` = `space[1]`, `media.stripTile` 72 | 1 | As ML section 5.1 |
| `media.cap` 8, `capVideo` 2, `videoMaxSec` 60 | 1 | Product limits; may belong in `packages/core` (Q3 of the ML spec) |
| No token | 2, 3, 4, 5, 6 | Existing colour, space, radius, type and motion tokens are enough |

Components, library first (`apps/mobile/src/components/ui/`, EVIDENCE for what exists: `button`, `card`, `choice-group`, `empty-state`, `list-row`, `screen-header`, `sheet`, `state-screen`, `text-field`, `toast`, `lamp`, `separator`):

| Component | Status | Used by |
|---|---|---|
| Button, Card, Chip, ListRow, Sheet, Toast, TextField, Toggle, StateScreen, EmptyState, AppNote, ErrorLine, SegmentedControl, DateField | exist or spec'd in COMPONENTS | all |
| MediaTile, MediaGrid, MediaStrip, MediaViewer, MediaChooser | NEW, specified in ML section 5.2 | 1 |
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
| `content` | New copy slots (about 120 across the six) with limits and rules; none written | each spec, section "Copy slots" |
| `mobile` | Screens and logic; the navigation test | 06 sections 9 and 10; each spec's sequence |
| `product` | Requirement ids; reconcile NX-42 (Moments tab dissolves) and NX-41 R12 | 06 section 12 |
| `legal`, `privacy` | The Shown, Records, Never, Decline lines for photo permission, sharing a letter and a seal; whether system dictation needs a privacy line (02, 04) (COORDINATION section 10, PRIV-R21) | 01, 02, 03, 04 |
| `legal`, `security`, `privacy` | Hands-free doorways: no new consent or permission (05 door lines); one decision, starting a take from a locked phone (default: unlock first, 05 decision 8) | 05 |
| `content` | Wording that could read as a machine writing: "Writing down what you said", "words being made", "getting ready", "made". CLAUDE.md: never imply AI writes anything. Review these existing and proposed lines | 02, 05, 06 |
| `qa` | Device passes for every UNVERIFIED, AX5 and VoiceOver tables | each spec's checklist |
| `user-research` | Five-parent reads for the job sentences, Find, Share and seals | 06 section 11 |
| `data-architect` | Fields: first mark and label, seal date, photo description, share log (none) | 04, 01, 03 |

## 9. Open design questions, all six, each with a default

Listed per spec in its last section. The ones the founder should see first:

| # | Question | Default if no answer | Spec |
|---|---|---|---|
| Q0 | Build share one letter? | DECIDED by the founder (10 Nov, relayed by Karma; original not read): yes, text first. Not an agent default | 03 |
| Q1 | Is there ever a Share tab? | No. Sharing one letter is a letter-page action; export stays in Me. The tab test (03 section 8) is the only way to reopen it | 03 |
| Q2 | Does photo-first need the camera, or only the library? | Library through the system picker only; no camera in this scope | 01 |
| Q3 | Do we build Firsts at all? (NX-44 FD-1) | Not before a five-parent study; the spec is ready if he says yes | 04 |
| Q4 | Do we build sealed letters at all? | Not in Build 13; spec only. The words "sealed" and "locked" are not used unless the seal is real cryptography | 04 |
| Q5 | Does Find search only a letter's words, or also firsts and photo descriptions? | Words, first labels and typed photo descriptions; never a derived place or date | 02 |
| Q6 | Where does "Take the book with you" (export, where letters live) live? | Me, as one section, titled by `content` | 06 |
