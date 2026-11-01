# Future backlog 03: the book, reading together and keepsakes (after v1.0)

Owner: pm-3 (book and keepsakes). Date: 3 Oct 2026. Status: proposal for the coordinator to merge; nothing here changes a founder decision, a requirement or a v1.0 task.
Siblings: `01-capture-voice-languages.md` (pm-1), `02-family-circle.md` (pm-2), `04-growth-monetisation.md` (pm-4), `05-trust-platform-insights.md` (pm-5). Overlaps were settled in `docs/agents/DEBATES.md` Q-006 (section 3 below): each item is scored in one file only; the others cite it.

**Evidence tags** (same as pm-1's file, so the five files merge cleanly). **[F]** fact, with the file or source that states it, checked 3 Oct 2026 in the repo or on the page named in section 10. **[A]** our assumption. **[E]** our estimate. **[U]** unverified: we did not or could not confirm it. **[R]** recommendation (judgement). Short names: BRIEF (`docs/agents/BRIEF-2026-10-03.md`, decisions 1 to 17), PRD (`docs/prd/PRD.md` 1.3), C (`docs/prd/C-habits-pricing-settings.md`), B (`docs/prd/B-first-run-and-family.md`), D-### (`docs/DECISIONS.md`), ROADMAP (`docs/ROADMAP.md` 2.0), BL-### (`docs/BACKLOG.md`), SPEC (`docs/legal/DELETION_AND_EXPORT_SPEC.md`), CREATIVE (`docs/design/CREATIVE.md`), DL (`docs/design/DESIGN_LANGUAGE.md`), ARCH (`docs/ARCHITECTURE.md`), UR (`docs/research/USER_RESEARCH.md`), CR (`docs/research/COMPETITIVE_RESEARCH.md`), US / GLOBAL / ADJ (`docs/research/competitors/us.md`, `global.md`, `adjacent-and-ux-benchmarks.md`), EXPORT (`apps/mobile/src/lib/export/*`), CVL-## (pm-1), FAM-## (pm-2), G-## (pm-4).

---

## 0. Summary

**The judgement in one paragraph.** The book is the product, and the keepsakes are why a family is still here, and still paying, in year three. Our constitution forbids the shortcut every competitor takes (machine-written recaps, AI "stories", generated highlights), so every keepsake we make must be **arranged from the family's own words and voices plus fixed template copy, never authored by software** (section 1.1). v1.0 ships the bones: month chapters, Read together without a moving highlight, quiet milestones and a free ZIP with a PDF book [F: ROADMAP 5]. Three facts shape everything after it. First, **no recording leaves the phone in v1.0** [F: BRIEF 9], so every keepsake that needs another person's voice (QR codes in print, the web reader, a co-parent's voice in Read together) waits on pm-2's media pipeline (FAM-03). Second, **the launch cohort reaches Year One mostly in late 2027** [A: most families join expecting or with a newborn], which is the holiday season, so the printed book should be piloted for October 2027, not rushed into v1.1. Third, **print is how this category makes money and also where it breaks** (lost orders, expiring credits, FamilyAlbum's EU suspension) [F: US 9, GLOBAL 0.8], so we earn the right to print in steps: a free print-ready file first, then a US-only Year One with one partner, then in-region printing and gift copies. Near term, the cheapest delights win: "On this day", the v1.1 word highlight the founder already committed to, firsts in the family's own words, birthday letters and a Year in letters with no machine text.

### Top 10 for v1.1 to v1.3

| # | ID | Item | RICE | Size | Release | Why here |
|---|---|---|---|---|---|---|
| 1 | BK-06 | "On this day" on Tonight (C-REQ-014) | 2,000 | S | v1.1 | Specified already (P1), local only, one week; the voice as a reminder of why you write [F: C, UR delight 3] |
| 2 | BK-01 | Read together with word highlight, plus a bedtime layout | 1,067 (commitment) | M | v1.1 | Founder decision 9 names it for v1.1; store screenshot 3 and the preview video assume it [F: BRIEF 9, CREATIVE 3, 4] |
| 3 | BK-05 | Firsts in your own words, and a Firsts page | 625 | M | v1.2 | Fixed "firsts" fields fail parents [F: UR S24]; ours are the family's own labels, never a checklist |
| 4 | BK-04 | Birthday letters | 600 | S | v1.2 | Birthday notes already fire (C-REQ-011); a letter for the day is the obvious next step [F: UR S30] |
| 5 | BK-07 | Year in letters: a yearly recap with no machine-written text | 417 | M | v1.2 | Year One cover is specified (C-REQ-013, P1); competitors' recaps are AI-written, ours is arranged [F: US 3.14] |
| 6 | BK-09 | Search, people and occasions, on the phone only | 400 | M | v1.3 | A year is about 240 letters [E: ARCH 7]; finding one matters from year two |
| 7 | BK-10 | Save keepsakes to Apple Photos | 400 | S | v1.2 | Where families already keep memories [F: UR 1.3]; add-only, never reading the library |
| 8 | BK-03 | Sealed letters that open on a date or age | 250 | L | v1.2 | Now table stakes for new entrants [F: US 6]; B-REQ-018 (P1); needs a server view and sync change |
| 9 | BK-08 | The year in voices: an audio keepsake file | 250 | M | v1.3 | Voice is the treasure; competitors export one audio file [F: US 3.11, 3.13] |
| 10 | BK-12 | Web reader: the book in a browser, no app | 250 | L | v1.3 (gated) | Landing for pm-2's family link and digest, and for printed QR codes; needs FAM-03 and pm-5's web platform |

Two items sit outside the ranking by **commitment**, and are marked so: **BK-17** export splitting (RICE 38, v1.2), because SPEC 4.2 already requires it and the v1.0 code stops at 3.9 GB [F: EXPORT `pack.ts`]; and **BK-13** the print-ready book file (RICE 100, v1.3 if capacity allows, else v1.4), because it is the cheapest honest test of print demand before anyone builds ordering. Section 6 has the release plan; section 7 the will-not-build list.

### All items at a glance

| ID | Item | RICE | Size | Horizon |
|---|---|---|---|---|
| BK-01 | Read together word highlight and bedtime layout | 1,067 | M | Now (v1.1) |
| BK-02 | A reading mode for the child | not scored | n/a | Will not build (folded into BK-01) |
| BK-03 | Sealed letters | 250 | L | Next (v1.2) |
| BK-04 | Birthday letters | 600 | S | Next (v1.2) |
| BK-05 | Milestones and firsts | 625 | M | Next (v1.2) |
| BK-06 | On this day | 2,000 | S | Now (v1.1) |
| BK-07 | Year in letters (yearly recap, no machine text) | 417 | M | Next (v1.2) |
| BK-08 | The year in voices (audio keepsake) | 250 | M | Next (v1.3) |
| BK-09 | Search, people and occasions | 400 | M | Next (v1.3) |
| BK-10 | Save to Apple Photos | 400 | S | Next (v1.2) |
| BK-11 | Keepsake widgets | 63 | M | Later |
| BK-12 | Web reader | 250 | L | Next (v1.3, gated) |
| BK-13 | Print-ready book file | 100 | L | Next (v1.3 or v1.4) |
| BK-14 | Printed Year One book (partner, regions, 3.1.3(e)) | 75 | XL | Later (US pilot, October 2027) |
| BK-15 | QR codes to recordings that last decades | 60 | L | Later (with BK-14) |
| BK-16 | Gift editions for grandparents | 83 | M | Later (after BK-14) |
| BK-17 | Splitting large exports | 38 | M | Next (v1.2, commitment) |
| BK-18 | The Book at 18 edition | 0 in window | M | Later |
| BK-19 | Book themes and covers | 83 | M | Later (pm-4 may pull forward) |

---

## 1. How to read this file

### 1.1 Design rules for every keepsake [R]

These follow from CLAUDE.md ("The machine may remove and repair. It may never add meaning") and C-REQ-015. They apply to every item below, and each item's solution assumes them.

1. **Arrange, never author.** Only two kinds of words appear in a keepsake: the family's own words, and fixed template strings from `packages/content` ("Month 3", "Letters from Mama and Papa"). No generated titles, captions, summaries, "highlights" or story text, ever.
2. **Whole letters leave the app.** Inside the app a card may clip a long letter visually (a fade, then "Read it"). Anything that leaves the app (an image, PDF, print, audio file, web page) carries whole letters only. No quote is ever cut out of a letter, because a cut changes meaning.
3. **Selection is the family's, or a plain rule.** The parent picks (for example "letter of the month"), or a deterministic rule decides (date order; the first letter in the book that month). Never sentiment, length, "best", or any inference about what matters.
4. **No scorekeeping.** No per-author counts, no comparisons between authors, no gap counts, no streak-like "year stats" (C-REQ-015). Book totals stay only where C-REQ-010 already allows them.
5. **Every resurfacing surface honours the same filters:** pause celebrations (C-REQ-012), hidden books (B-REQ-014), other people's private letters, sealed letters until they open, letters waiting for approval or set aside, and any entry with a safety tier in the local database (C-REQ-014, K-06).
6. **Voices only as recorded.** Original recordings, or pm-1's optional listening copy. No text-to-speech (CVL-04), no music under a voice (ADJ B6), no synthetic intros between letters.
7. **Plaintext once it leaves.** Every export-like keepsake carries the DATA-REQ-056 notice ("unlocked, keep it somewhere private"), and nothing leaves the phone without a tap by the person.

### 1.2 Scores

Same method as pm-1 (`01-capture-voice-languages.md` section 1), so scores are comparable across files.
- **RICE = Reach x Impact x Confidence / Effort.** Reach [A] is families touched per quarter as a share of a planning base of **5,000 active families per quarter** in the v1.1 to v1.3 window. Shares used here [A, replace with server aggregates]: Read together users 40%; families with letters at least a month old 50%; families with a birthday in a quarter 25%; families who would search 30%; families with a relative who reads but does not use the app 30%; families at or past a first birthday who would make a print file 10%.
- **Impact:** 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal. **Confidence:** 80% when the evidence is ours or verified; 50% when a platform, model or decision is unmeasured; 30% or less when counsel decides it.
- **Effort [E]:** person-weeks of agent-built work plus founder review and device testing; counsel, print proofs and vendor time are listed as cost, not effort.
- **Size:** S up to 1 person-week; M 2 to 3; L 4 to 6; XL more than 6.
- **Horizon [A on dates]:** **Now** = v1.1 (about January 2027); **Next** = v1.2 (about March 2027) or v1.3 (about May 2027); **Later** = after v1.3 or unscheduled. Capacity for this theme [A]: about 10 to 14 person-weeks per release.

RICE undervalues revenue and trust items; where that matters (print, export splitting) the item says so and the ranking marks it as a commitment rather than bending the numbers.

---

## 2. What v1.0 ships in this area (facts the items build on)

| Area | v1.0 state | Source |
|---|---|---|
| Book | Month chapters, Before You, letters signed by their author, quiet milestone cards inline (first letter; 10, 50, 100, 365 letters; first month chapter; first family letter; first Read together), once per reader, no push or confetti | [F] ROADMAP 5; C-REQ-010; `packages/content/src/strings.en.ts` `moments` |
| Read together | Plays the recordings on this phone in sequence; no moving word highlight; 3 free sessions per book, then Plus (remote config); typed letters say "Read it aloud together" | [F] BRIEF 9; PRD-REQ-020; D-037; `strings.en.ts` `readTogether` |
| Word timings | `entries.alignment` (final text only, L4) and the ADR 0009 projection with a quality gate (word, sentence or none) are v1.0 backlog tasks | [F] BL-144, BL-145; ADR 0009 |
| Recordings | Stay on the phone that made them and in that person's own iPhone backup; nothing uploads them; a co-parent hears your voice only on your phone until v1.1 | [F] BRIEF 9; `packages/content/VOICE.md`; D-033 |
| Family | Co-parent only at v1.0; grandparents and the web page later | [F] BRIEF 5 |
| Celebrations | Birthday note at 09:00 replaces that day's reminder; month-age notes; pause celebrations per person per book | [F] C-REQ-011, C-REQ-012 |
| Specified but not in v1.0 | Year One cover (C-REQ-013, P1), On this day (C-REQ-014, P1), sealed letters (B-REQ-018, P1), book themes and letter templates including Birthday, A first and Sealed (B-REQ-019, B F10, P1) | [F] C, B |
| Export | One ZIP made on the phone, offline, free in every plan state: README, `index.html` reader, manifest with SHA-256, JSON schema, letters as text, own original recordings, one PDF book per child; family letters without raw transcript | [F] EXPORT; SPEC 4; C-REQ-017 |
| Export limits | fflate streaming ZIP without ZIP64; `MAX_EXPORT_BYTES` 3.9 GB, above which `ExportTooLargeError`; "Splitting by child-year above 2 GB (spec 4.2) is not built yet"; photos `null`, language `null` in `entries.json` | [F] EXPORT `pack.ts` lines 7 to 21, `build.logic.ts` |
| PDF book | HTML rendered by `expo-print`, US Letter or A4 by locale; text only; cover, About this book, month chapters, colophon; fonts from the system stack (`ui-serif, "New York", ... serif`), so non-Latin scripts use whatever iOS falls back to | [F] EXPORT `build.logic.ts` `bookHtml`, `paperFor`, `SERIF` |
| Print | Future launch; v1 is digital only; no product, store or website string mentions printed books, print or ordering a book (launch checklist) | [F] K-32, D-010, PRD 6.7; Terms 15 "not offered yet" |
| Search | Server has a generated `entries.search` tsvector over `final_text` (no consumer in the app); the phone has no search | [F] migration `20260930000000_scribe_core.sql` line 143; grep of `apps/mobile/src` |
| Local database | expo-sqlite 57.0.3 bundles SQLite 3.50.3 with FTS5 compiled in unless disabled | [F] `node_modules/expo-sqlite` podspec line 41, `vendor/sqlite3/sqlite3.h` |
| Widgets | None; `@expo/ui` 57.0.21 is installed; `expo-widgets` is not | [F] `apps/mobile/package.json` |

---

## 3. Ownership agreed with the other leads (DEBATES Q-006)

Scored here: Read together and its word-highlight UX; sealed letters (including letters sealed by contributors); birthday letters (the artefact); milestones and firsts (the occasion, the Firsts page, quiet milestone cards); On this day; Year in letters; audio keepsake; search, people and occasions; saving keepsakes to Apple Photos; keepsake widgets; the web reader (reading experience, also the landing for pm-2's family link and digest email and for printed QR codes); export formats, splitting and the print-ready file; the printed book (product, partner, files, QR, order flow, print pricing and margin); gift editions; the Book at 18 artefact; themes and covers; how photos, sounds, imported voice notes, guest letters, family rounds and multi-generation books render in the book, PDF and print.

Cited, not scored here:
- **pm-1:** word timings and their quality per language (CVL-20); prompt text for firsts and birthdays (CVL-08); photo capture (CVL-10); voice-note import (CVL-12); the capture widget (CVL-13, one shared widget extension, first to ship sets it up); "we never make a voice" (CVL-04); the child's own sounds (CVL-19).
- **pm-2:** the family media pipeline for audio and photos (FAM-03, v1.1); the family link and web contribution page (FAM-05, recommended v1.2); the Reader role and content-free digest (FAM-06, v1.3); guest authors (FAM-07); shared family prompts and the "family round" (FAM-09, v1.2); multi-generation linking (FAM-10); when an author dies (FAM-12); handover at 18 (FAM-13), which triggers the opening of letters sealed until 18.
- **pm-4:** Read together free-session count and everything Plus includes (G-19). G-19 already answers this file: sealed letters, the year in voices, Year in letters and On this day are Free; word highlight is part of Read together (3 free sessions per book, then Plus); themes and covers are Plus. Share and rating-ask placement (G-03, G-14: "tell a friend" only on a later visit to Year in letters, never on the day); digital gifts of Plus and the one gift entry point (G-10). pm-4 agrees print stays a separate card purchase, never IAP, and cites the $59 and $39 prices.
- **pm-5:** the `apps/web` platform (T5-17, v1.1); print checkout plumbing, hosted checkout with no card data on our pages, print-partner DPA, subprocessor and data-map rows, vendor gate (T5-27); QR link resolver, domain continuity and link lifetime under the shutdown pledge, with a resolver that can be served statically after shutdown (T5-04; links must resolve through a host we control, never a vendor URL); dropping `entries.search` (T5-09); claims guards (T5-08); privacy label substance (T5-01); iPad layout (T5-18); COPPA mechanics.
- **Founder and counsel:** Print Terms (Terms 15), sales-tax registration, EU GPSR if we ever sell print into the EU.

---

## 4. Items

Each item: problem and evidence; job to be done; solution; what competitors do; differentiator; RICE; dependencies; legal and cost; metric; size; horizon.

### A. Reading together

### BK-01 Read together with word highlight, plus a bedtime layout

**Problem and evidence**
- [F] Word highlighting in Read together is deferred from v1.0 to v1.1 by founder decision 9 (BRIEF). v1.0's subtitle says letters "play in the voice that said them", with no moving highlight (`strings.en.ts` `readTogether`).
- [F] Store screenshot 3 ("Read together, in their voice", highlight mid-sentence) and the preview video ("In product footage the Read together highlight is the caption") assume the highlight (CREATIVE 3 and 4). The listing can only show it once it ships (App Review accurate-metadata rules) [F: CREATIVE C12].
- [F] Reading entries aloud years later is a top delight; one parent's favourite childhood memory is their mother reading her journal at bedtime (UR 5, delight 1, [S27]). Read together, with playback in the author's own voice, is unclaimed for baby books (CR 5, item 2; US 7.1 item 3).
- [F] Word timings come from ASR tokens projected through accepted edits onto `final_text`, with an honest fallback to sentence-level highlight when timings are poor (ADR 0009). Their per-language quality is pm-1's (CVL-20, v1.1).

**Job to be done.** "At bedtime, when I play Papa's letter to Asha, let the words follow his voice so we can follow along together, and so the letter feels like him talking, not a file playing."

**Solution [R]**
1. **Highlight by quality:** word highlight when `alignment.quality = 'word'`; sentence highlight when `'sentence'`; plain playback with the full text when `'none'`. Never a guessed or drifting highlight (ADR 0009 decision 3).
2. **Every script:** highlight by grapheme cluster runs so Devanagari conjuncts stay whole, Arabic highlights right to left within the line, and Chinese highlights character runs (no spaces). Fixture tests per script with the fictional Asha family (CLAUDE.md).
3. **Tap a word to hear from there** (seek to its start time). Long-press shows nothing extra; no definitions, no translations.
4. **Bedtime layout:** a "Bedtime" toggle inside Read together: dark paper, Large Print, the letter and signature only, controls fade after 3 seconds and return on tap, screen stays awake while playing, no Plus sheet mid-session (the gate appears only before a session starts, C-REQ-023). The moon drawing at the end of a month stays (CREATIVE 6). This is the parent-led answer to "a reading mode for the child" (BK-02).
5. **Accessibility:** Reduce Motion swaps any movement for a colour change; VoiceOver reads the letter text and announces the author and month; the highlight is never the only way to follow.
6. **Typed letters stay silent** (CVL-04: no text-to-speech): "This one was typed. Read it aloud together." stays.
7. **Other people's voices:** until FAM-03 ships, a co-parent's letter shows "{signsAs}'s voice is on their phone. Read this one aloud together." (exists). After FAM-03, uploaded recordings play with highlight too.

**What competitors do.** No baby book syncs text to voice [F: US 4, "Read-aloud for the child" column]. DearBaby's "Voice Year" plays twelve recordings back to back with no text [F: US 3.13]. Remento plays one chapter's recording from a printed QR code [F: ADJ A2]. Otter and Rev sync transcripts to playback for meetings [F: ADJ A1, A4].

**Differentiator.** The family's own voice with the family's own faithful words moving under it, in seven scripts, on the phone.

**RICE.** Reach 2,000 (40% of 5,000) x Impact 2 x Confidence 0.8 / Effort 3 = **1,067**. Ranked as a commitment (founder decision 9).

**Dependencies.** CVL-20 (timings per language, v1.1); BL-144 and BL-145 (alignment column and projection, v1.0 backlog); FAM-03 for anyone else's voice; G-19 (free-session count; highlight counts as Read together). If CVL-20 is late for a language, that language ships sentence-level (ADR 0009), not nothing. Sync (agreed with pm-1 and pm-5 under T5-09): other members' devices receive only `entries.alignment` (exposed by `book_entries`, BL-144), never `stt_meta`; the author's own devices get compact word-level raw timings so an edit on a second phone can re-project; per-token data stays on the recording phone. A larger bedtime layout on iPad waits for T5-18.

**Legal and cost.** No new data: `alignment` is already L4 and readable to book members for this purpose (K-09). No server cost. Store screenshot 3 and the preview video may show the highlight only from the release that ships it (content owner).

**Metric.** Share of Read together sessions with word-level highlight, per release (target: at least 70% in English and Spanish, at least 50% overall [A]); month completion rate (`read_together_ended{reason: finished}` / started). Catalogue change for the analytics owner: `read_together_started` gains `highlight: word | sentence | none` (the session's dominant level). No per-language property (DEBATES Q-004).

**Size.** M. **Horizon.** Now (v1.1).

### BK-02 A reading mode for the child (will not build as asked)

**Problem and evidence**
- [F] The store copy "let them listen on their own" and the "kids" keyword were removed because they make the product child-directed (K-20; compliance register CR-001 edge 2: "Read together marketed as something children use 'on their own' while analytics ids are collected"; Apple 2.3.8 and 5.1.4).
- [F] Every child-input feature sits behind the `child-input` flag, off until counsel's COPPA opinion (PRD-REQ-005, K-19).
- [F] The real need in the research is a parent reading to the child (UR delight 1) and a grown child receiving the book (UR delight 2), not a toddler operating the app.

**Job to be done.** "Let my child enjoy the letters with me at bedtime," and later, "let my grown child have them."

**Solution [R].** Do not build a child-operated mode (no kid UI, no child profile, no "hand the phone to your child" flow). Meet the job with BK-01's bedtime layout (parent-led), iOS Guided Access (an OS feature the parent already controls; a one-line help article, no product surface), and BK-18 for the grown child.

**What competitors do.** Readmio, the read-aloud benchmark, is a kids' product (`docs/design/BENCHMARK.md` 7); no baby memory book in the US matrix offers a child mode [F: US 4].

**Differentiator.** Staying an adult product keeps us out of the Kids Category and COPPA's "directed to children" test.

**RICE.** Not scored. **Dependencies.** If the founder ever wants it: counsel's COPPA opinion (pm-5), CVL-19 (pm-1). **Legal and cost.** The cost is the risk: COPPA, Kids Category rules, analytics on child-facing screens. **Metric.** None. **Size.** n/a. **Horizon.** Will not build (section 7).

### B. Letters for later

### BK-03 Sealed letters that open on a date or age

**Problem and evidence**
- [F] Parents improvise this today: an email account for the child handed over at 18, and "sealed birthday letters to open at 18 or 25" (UR 1.3, [S26][S30]; ADJ A3).
- [F] Sealed letters are no longer a differentiator: Dearest (scheduled sealing in Plus), Moments (a "gift key" that unlocks at 18), Dear Ones, Tiny Treasures and The Days We Keep all have them (US 6, 3.11 to 3.13). FutureMe has delivered "over 20 million letters in 20 years" by date (ADJ A3).
- [F] B-REQ-018 (P1): seal to an age or date, the author can unseal early, the co-parent sees only "A sealed letter from Papa, to open when {child} is 18", and "the UI says the seal is a privacy lock, not encryption". B's schema plan adds `entries.sealed_until` and a security-barrier view that nulls `final_text` for non-authors (B section 6 item 6). Sealed dates are L4 (PRD 7.10).

**Job to be done.** "When something is meant for {child} when they are older, let me say it now, and know nobody (not even my partner) reads or hears it before then."

**Solution [R]**
1. **Seal to:** a date, a birthday ("on your 10th birthday"), or "when {child} is 18". Set in Review before saving or later from the letter. The author can unseal early; nobody else can, ever (including after the author's account is deleted or the author dies: the letter stays exactly as it is, ADJ A2 ethical line 6).
2. **Truly withheld, not hidden:** the server view returns no `final_text`, `alignment` or audio pointer to anyone but the author until the date, and sync never sends them to other members' phones. Other members see the placeholder line in the month where it was written.
3. **Opening:** on the first app open on or after the date (no far-future local notification: iOS keeps a limited queue of pending local notifications [U: commonly 64], and a reinstall loses them), the letter appears in its original month and on a quiet "Opened today" card, once per reader. On the birthday, the existing birthday note may say a letter was waiting, without content and without the child's name on the lock screen unless the person turned names on (D-025).
4. **Everywhere else:** excluded from On this day (C-REQ-014), Year in letters, the PDF, print and other members' exports until opened; included in the author's own export (it is theirs). The author's account deletion removes their sealed letters with everything else they wrote (K-22), and the delete flow says so.
5. **Copy:** "sealed", never "locked away" or "encrypted"; a help line says plainly that the seal keeps it out of the family's view and that Early Letters can technically read it like any letter (honest claim, LEGAL-REQ-044). Visual: a folded paper, never a wax seal (CREATIVE 3, "Never: wax seals").
6. **Free:** sealing is writing, and writing is free (C 4.1); pm-4 records it as Free in G-19.
7. **Contributors** may seal their own letters once pm-2's roles ship; letters sealed "until 18" open through FAM-13 if the handover happens first.

**What competitors do.** Dearest (sealed for future dates; scheduled sealing is Plus), Moments (gift key at 18), Tiny Treasures (private until the child opens the capsule), Dear Ones (sealed or now), FutureMe (date delivery, web) [F: US 3.11 to 3.13, ADJ A3].

**Differentiator.** A sealed letter that is still a spoken letter, kept with its faithful words and the original voice, opening inside the month it was written.

**RICE.** Reach 1,250 (25%) x Impact 1 x Confidence 0.8 / Effort 4 = **250**.

**Dependencies.** Schema and view change plus sync rules (data architect; BL-175 `book_access`; pm-5 sync platform); SPEC 4.1 export rule change (legal owner); FAM-13 for the 18 opening; FAM-12 (an author's death changes nothing about their seals); G-19 (Free, agreed); design (sealed placeholder, opened card); content (strings).

**Legal and cost.** The "not encryption" claim goes in the claims registry (LEGAL-REQ-044). Counsel: a co-parent's access request under privacy law covers only their own letters (K-09 logic) [A, counsel confirms]. No server cost beyond a column.

**Metric.** Share of authors who seal at least one letter within 90 days (target 15% [A]); `letter_sealed{until: date | birthday | age_18}` and `sealed_opened{early: boolean}` (new catalogue events); zero sealed-text leaks in the access tests (gate).

**Size.** L. **Horizon.** Next (v1.2).

### BK-04 Birthday letters

**Problem and evidence**
- [F] The birthday note already sends at 09:00 and replaces that day's reminder (C-REQ-011), but it leads nowhere special. B F10 lists a "Birthday letter" template (P1). Parents write birthday letters to open later (UR [S30]).
- [F] The first birthday is the moment C-REQ-013 (Year One, P1) and the printed book (BK-14) are built around.

**Job to be done.** "On {child}'s birthday, help me say something to them that they will keep, beside what everyone else said."

**Solution [R]**
1. **Birthday template:** the occasion label "Birthday" plus a starting question from pm-1's prompt library (CVL-08), offered on Tonight from three days before to seven days after the birthday. The birthday note deep-links to it.
2. **A birthday page in the Book:** "{child} turned {n}" (template) at the birthday's place in the chapter, gathering every birthday letter from every author, plus pm-2's family round answers (FAM-09) as one section. The same page appears in the PDF and in print.
3. **Optional seal** to a future birthday or 18, reusing BK-03.
4. No countdowns, no "you haven't written yet" (B-REQ-015 spirit, C-REQ-015).

**What competitors do.** Sealed birthday-style letters exist in Dearest, Moments and Dear Ones (sealed letters generally); none of the profiled products builds a birthday page from several authors [F: US 3.11 to 3.13 for sealing; "none found" is from the same profiles].

**Differentiator.** One birthday page with every voice that loves the child, in their own words.

**RICE.** Reach 750 (25% with a birthday x 60% who write [A]) x Impact 1 x Confidence 0.8 / Effort 1 = **600**.

**Dependencies.** `entries.occasion` (B section 6 item 6); CVL-08 prompt text; FAM-09 (family round section); BK-03 for sealing.

**Legal and cost.** None new. **Metric.** Share of birthdays with at least one birthday letter (target 50% [A]); `letter_saved` gains `occasion: none | first | birthday`.

**Size.** S. **Horizon.** Next (v1.2), shipped with BK-07.

### BK-05 Milestones and firsts in the family's own words

**Problem and evidence**
- [F] "Firsts" fields in paper books are ambiguous ("does that count as a step?") and some fields feel trivial (UR 1.1, [S24]).
- [F] Developmental milestones as app events are never celebrated (C-REQ-015), which also keeps us clear of health positioning (D-004: Lifestyle category, no health language).
- [F] Competitors offer milestone checklists and timelines: BackThen (milestones, height and weight), Tiny Voices, Dear Ones, Legacy Odyssey (month 1 to 12 milestones), The Days We Keep (US 3.4, 3.13).
- [F] B F10 plans "A first (any first the author names)" as a template (P1).

**Job to be done.** "When something happens for the first time, let me mark it in my words, and later find all of {child}'s firsts in one place."

**Solution [R]**
1. **"A first" on any letter:** a short label the author types or says ("first time at the sea"). The label is the author's words; the app never suggests, infers or completes one. Two authors may mark the same first differently; both stand.
2. **Firsts page:** at the front of each year in the Book, PDF and print: the labels in date order with the author and the month, each opening its letter. Labels show in the author's script.
3. **Backdating** of a first uses pm-1's capture flow (UR R10).
4. **Never:** a checklist, an expected age, "early" or "late", a comparison with other children, or a notification about a milestone.
5. Quiet milestone cards (C-REQ-010) stay as they are.

**What competitors do.** Checklists and fixed fields (BackThen, Legacy Odyssey) or prompts (Qeepsake) [F: US 3.1, 3.4, 3.13].

**Differentiator.** A record of firsts that is entirely the family's language, with nothing to fall behind on.

**RICE.** Reach 2,500 (50%) x Impact 1 x Confidence 0.5 (risk of drifting into a checklist feel) / Effort 2 = **625**.

**Dependencies.** `entries.occasion` plus a label field (L4); CVL-08 prompt text for firsts; design (Firsts page layout).

**Legal and cost.** Keeps health language out of the product (D-004 mitigation). No cost.

**Metric.** Share of families with at least one first in 90 days (target 40% [A]); Firsts page opens per family per month.

**Size.** M. **Horizon.** Next (v1.2).

### C. Looking back

### BK-06 On this day

**Problem and evidence**
- [F] C-REQ-014 (P1) is fully specified: "One month ago" or "One year ago today" on Tonight, at most one card a day, only letters in the book and visible to the viewer, excluding sealed letters and local safety tiers. Its analytics already exist (`resurface_shown{kind}`, `resurface_opened{kind}` in `packages/analytics/src/catalog.ts`).
- [F] "Being reminded of things you'd forgotten" is a top delight (UR 5, delight 3). "On this day" and automatic resurfacing are table stakes worldwide (GLOBAL 5.1 item 7); Day One has On This Day (US 3.20).
- [F] Drop-off comes in waves (UR 1.2); a reason to open the app that is not a reminder to write helps without nagging (A).

**Job to be done.** "When I open the app tonight, show me something we said a month or a year ago, so I remember why I keep doing this."

**Solution [R].** As C-REQ-014, plus: tap opens the letter with Play; "Not this one" hides that letter from resurfacing for that person (local); a letter by an author who has died follows pm-2's rule (no resurfacing framed around the death); no push in this item (a content-free push would be pm-4's call). Works offline from the local database.

**What competitors do.** Day One On This Day; FamilyAlbum and TimeHut auto recaps of photos (GLOBAL 5.1 item 7) [F].

**Differentiator.** It resurfaces a voice and the words, not a photo.

**RICE.** Reach 2,500 (50%) x Impact 1 x Confidence 0.8 / Effort 1 = **2,000**.

**Dependencies.** None beyond v1.0 (local store, celebrations pause, safety tiers if D-034's classifier ships; the exclusion rule holds either way).

**Legal and cost.** None; local only.

**Metric.** Open rate of shown cards (target 25% [A]); letters saved in the same session after an opened card (watch, no target).

**Size.** S. **Horizon.** Now (v1.1).

### BK-07 Year in letters: a yearly recap with no machine-written text

**Problem and evidence**
- [F] C-REQ-013 (P1): on the first birthday the Book shows a Year One cover with Read together and a free PDF, with no Plus offer for 24 hours.
- [F] "A finished, beautiful book per year" is a top delight (UR 5, delight 5); a yearly printed book becomes a ritual (CR 4, "one family printed seven").
- [F] Competitors' recaps are machine-written: Sproutbook's "AI-crafted recaps" shared automatically with family; FirstChapter's weekly recaps "with highlights, mood patterns, and badges" (US 3.14). Apple Photos Memories generates storylines (ADJ B6). DearBaby's "Voice Year" plays twelve recordings back to back (US 3.13).
- [F] Unwanted AI is a rising complaint (US 9, theme 7: 8% of recent one- and two-star reviews).

**Job to be done.** "When {child} turns one (or two, or five), let us feel the year in our own words and voices, without anyone writing it for us."

**Solution [R]**
1. **Year {n}** opens in the Book on each birthday (and stays there): a cover (template, child's first name), then one letter per month **in full**: the parent's "letter of the month" pick, defaulting to the first letter in the book that month (a plain rule, section 1.1 rule 3).
2. Then the Firsts page (BK-05), the birthday page (BK-04), and "Letters from" with every author's signature (no counts).
3. **Hear the year:** plays each month's chosen recording in order through Read together, with highlight where available (BK-01). Recordings not on this phone are skipped with the existing line until FAM-03.
4. **Keep it:** "Save the year's book" (the PDF for that year, existing export), "Save the year's voices" (BK-08), "Save the cover to Photos" (BK-10). Export comes before any other action (C-REQ-018 keep-safe rule).
5. No Plus offer for 24 hours (C-REQ-013). No share or rating ask on the day (pm-4 agrees, G-19); "tell a friend" may appear on a later visit (G-14).
6. Pause celebrations hides the moment; the Year stays reachable from the Book.

**What competitors do.** AI recaps (Sproutbook, FirstChapter), generated movies (Apple Photos Memories), back-to-back voice playback (DearBaby) [F].

**Differentiator.** The only recap in the category with zero machine-written words: the family picks, the family speaks.

**RICE.** Reach 1,250 (25%) x Impact 2 x Confidence 0.5 (a recap without generated "magic" must still feel special; test in beta) / Effort 3 = **417**.

**Dependencies.** BK-04, BK-05, BK-01; BK-08 and BK-10 for the keep actions; FAM-03 for others' voices; FAM-09 (family round sections); G-14 and G-19 (ask placement; Free).

**Legal and cost.** None new; on device.

**Metric.** Share of families reaching a birthday who open Year {n} within 7 days (target 60% [A]); Hear the year completion; export within 7 days of the birthday. New events: `year_opened{year_n: 1 | 2 | 3_plus}`, `year_heard{completed: boolean}`; `moment_shown` already excludes Year One by design.

**Size.** M. **Horizon.** Next (v1.2), before the launch cohort's first birthdays build up.

### BK-08 The year in voices: an audio keepsake

**Problem and evidence**
- [F] Voice is the keepsake: QR-to-audio is the most emotional praise in the category (CR 4, [S6]); "Said once. Heard for years." is the creative platform (CREATIVE 2).
- [F] Tiny Treasures: "Export your saved recordings as one audio file, free, offline, with no account needed" (US 3.11). DearBaby's "Voice Year" (US 3.13). Storyworth offers free audiobook downloads (US 3.16).
- [F] Today's export holds each recording as its own M4A named by entry id (SPEC 4.2), which is complete but not something you play in the car or send to Nani.

**Job to be done.** "Give me this year's voices as one thing I can keep, play anywhere, and send to Nani."

**Solution [R]**
1. "Save the year's voices" (from Year {n} and from Export): one M4A per child-year, the letters in the book in date order (or only the letters of the month, the parent's choice), each original recording joined without re-encoding, with a short silence between letters and no spoken or musical intros.
2. Chapter markers named by template ("Month 3, Papa") if AVFoundation chapter writing works from our module [U]; otherwise one file per month in a folder.
3. Built on the phone with AVFoundation (a small local Expo module; no Expo API joins audio files today [U]). The originals are never touched; the keepsake is a derived file.
4. Only recordings on this phone until FAM-03; the share sheet carries the DATA-REQ-056 notice.

**What competitors do.** One audio file (Tiny Treasures), twelve back to back (DearBaby), audiobook download (Storyworth) [F].

**Differentiator.** Many family voices, by month, with the faithful words alongside in the export.

**RICE.** Reach 750 (15%) x Impact 2 x Confidence 0.5 / Effort 3 = **250**.

**Dependencies.** BK-07; FAM-03 for others' voices; G-19 (pm-4 records it as Free: an export of what the family made, under the keep-and-leave rule).

**Legal and cost.** The file leaves our privacy perimeter by the person's choice; the voice-cloning risk (ADJ A2, FTC) is why it is never auto-shared or uploaded. No server cost.

**Metric.** `export_completed{format: voice_year}` per family reaching a birthday (target 20% [A]).

**Size.** M. **Horizon.** Next (v1.3).

### D. Finding

### BK-09 Search, people and occasions, on the phone only

**Problem and evidence**
- [F] About 20 entries per family per month (ARCH 7), so roughly 240 a year [E]; finding one by word becomes the main way back into an older book.
- [F] Parents already use searchable texts and notes as their memory store (UR 1.3). Apple Journal searches transcripts (ADJ A1); Day One has search; Untold users praise its "ongoing glossary of people" (US 3.22); Tinybeans tags "Who is in this moment" (US 3.2).
- [F] The server has an unused `entries.search` tsvector over letter text (`simple` config, which does not segment Chinese) (migration 20260930000000). pm-5 will drop it as data minimisation (Q-006).
- [F] expo-sqlite 57.0.3 on the phone ships SQLite 3.50.3 with FTS5 (EXPORT section 2 table).

**Job to be done.** "Find the letter where Nani talked about the monsoon," and "show me everything Papa wrote in Month 4."

**Solution [R]**
1. **On-device full-text search** across every book the person can read, scoped per child (PRD-REQ-011): FTS5 with the `unicode61` tokenizer and diacritic folding for Latin scripts (so "nino" also finds "niño"), a character-based path for Chinese (the `trigram` tokenizer, with a plain scan for one- and two-character queries, which is fast at a few thousand letters [E]), and query-time normalisation for Arabic letter variants. Each script gets fixture tests before it ships [A: behaviour per script to verify].
2. **People = authors.** Filter by who wrote (signatures already exist). Names from the family dictionary appear as quick search chips (they search the text; nothing is tagged automatically).
3. **Occasions, not free tags:** filter by first, birthday, opened seal, month, year. No free-form tags in 1.x [R]: occasions cover the need without a new synced vocabulary.
4. Results show dateline, signature and the letter with the match marked; tapping opens the letter.
5. Nothing is indexed on a server; no Spotlight indexing of letters (it would put children's letters in system search) [R].

**What competitors do.** Search and tags (Day One), transcript search (Apple Journal), people tagging (Tinybeans), AI image-vector search sent to a vendor (FamilyAlbum, which drew a backlash) [F: US 3.3, 3.20, 3.21].

**Differentiator.** Search across seven scripts that never leaves the phone.

**RICE.** Reach 1,500 (30%) x Impact 1 x Confidence 0.8 / Effort 3 = **400**.

**Dependencies.** Local schema (FTS virtual table kept in step with `final_text` and occasions); BK-03 (sealed text never indexed for non-authors); T5-09 drops `entries.search`.

**Legal and cost.** A privacy gain (less server-side derived data). None else.

**Metric.** Searches per active family per month; search-to-open rate (target 50% [A]); `search_performed{results_bucket}`, no script or language property (Q-004).

**Size.** M. **Horizon.** Next (v1.3).

### E. Beyond the app

### BK-10 Save keepsakes to Apple Photos

**Problem and evidence**
- [F] Photos are the most-kept memento (95% of parents of adult children) (UR 1.3). Families keep memories in the camera roll and shared albums, which iOS 27 made stronger (US 0 point 7, 3.23).
- [F] Full photo-library access is a top privacy complaint (US 9, theme 9: Google Photos, TinyNest), and research says not to compete on photos (US 3.23 lesson).
- [F] Photo picking at capture is pm-1's (CVL-10: system picker, no library access, no face detection).

**Job to be done.** "Put our keepsakes where the rest of our family memories already live."

**Solution [R]**
1. "Save to Photos" for: a month card (month name, child's first name, the letter-of-the-month in full), the Year cover card (BK-07), and any single letter as a card (full text, dateline, signature; a tall image if needed).
2. Add-only permission, asked at the first save, never at launch (iOS add-only photo permission; the Expo API for it is to confirm [U]: `expo-media-library` is not installed today).
3. Later, after BK-08: a "voice card" video (a still card plus the original recording) for Photos and Messages, which needs AVFoundation composition [U].
4. Never read the library, never suggest letters from photos, never auto-save.

**What competitors do.** Apple Journal reads Photos to suggest entries (the opposite approach) [F: ADJ B5]; photo apps live inside Photos-like galleries [F: US 2].

**Differentiator.** Keepsakes leave on the family's terms, as whole letters, with no library access.

**RICE.** Reach 1,000 (20%) x Impact 0.5 x Confidence 0.8 / Effort 1 = **400**.

**Dependencies.** BK-07 (cards), BK-05 (labels), design (card layouts in light and dark). **Legal and cost.** The image is plaintext in the person's iCloud Photos by their choice; a one-line notice like DATA-REQ-056. No privacy-label change (nothing reaches us) [A, pm-5 confirms]. **Metric.** `keepsake_saved{kind: month_card | year_card | letter_card}` per active family.

**Size.** S. **Horizon.** Next (v1.2), with BK-07.

### BK-11 Keepsake widgets

**Problem and evidence**
- [F] Dearest ships widgets (US 3.12); ADJ section 5 pattern 25 suggests a Home Screen widget (P3). Apple Journal's streak widget is the anti-pattern (ADJ A1).
- [F] `expo-widgets` for SDK 57 is iOS only, renders only `@expo/ui/swift-ui` components in an isolated runtime, shares data through an App Group, and is not available in Expo Go; its maturity label is to confirm [U] (Expo docs, section 10).
- [F] The capture widget is pm-1's (CVL-13); one shared extension (Q-006).

**Job to be done.** "Show me, at a glance, that a letter is waiting to be heard, without opening the app."

**Solution [R]**
1. A small and medium Home Screen widget: "A letter from Papa, Month 3" (template, no letter text) and a Hear it button that opens Read together at that letter. Source: the On this day pick (BK-06) or the next sealed letter's opening date ("A letter opens on Asha's birthday").
2. The child's name appears only if the person turns names on (the D-025 rule, carried to widgets). No Lock Screen widget with any content.
3. The App Group holds only ids and template fields, never letter text or audio.

**What competitors do.** Dearest widgets; Duolingo and Finch promote widgets as habit levers [F: ADJ section 5, pattern 25].

**Differentiator.** A widget that invites listening, never counting.

**RICE.** Reach 750 (15%) x Impact 0.5 x Confidence 0.5 / Effort 3 = **63**.

**Dependencies.** pm-1's CVL-13 sets up the shared extension (or this item does, if first); BK-06; pm-4 decides whether to promote it. **Legal and cost.** Child name on the Home Screen defaults off; data protection class for the App Group file to confirm [U]. **Metric.** App opens from the widget (`app_opened{source: widget}`, proposed). **Size.** M. **Horizon.** Later (after `expo-widgets` matures or CVL-13 lands).

### BK-12 Web reader: the book in a browser, no app

**Problem and evidence**
- [F] Families without the app are served elsewhere by email digests (Moment Garden, 23snaps), a website at the child's own domain (Legacy Odyssey), or a link (Remento) (US 3.8, 3.13, 3.15). Friction for grandparents is a top complaint (US 9, theme 8). Grandparent access beyond the app is table stakes (GLOBAL 5.1 item 3).
- [F] Q-006: pm-2's family link ("one personal link per relative per book, two doors: Read and Add a letter") and content-free digest land on this reader; printed QR codes (BK-15) open its listening page; pm-5 owns the `apps/web` platform.

**Job to be done.** "Let Nani read and hear Asha's book on her tablet or laptop, in her language, with no app and no password to remember."

**Solution [R]**
1. Read-only, per child: month chapters, letters with dateline and signature, photos and sounds as the book renders them (section 8), playback of uploaded recordings with Read together and highlight, Large Print, RTL and Chinese fonts, WCAG 2.2 AA (B-NFR-006).
2. Access only through pm-2's Reader role and family link on pm-5's web shell. Never shows raw transcripts or edits (K-09), sealed text, or anything outside that child's book (PRD-REQ-014).
3. No Plus surfaces, no download button for audio [R] (the cloning-corpus rule, ADJ A2 line 4), no third-party analytics: server aggregates only, k-anonymised (relatives never consented to app analytics) [R].
4. The listening page for a QR code is a single-letter view of the same reader.

**What competitors do.** Legacy Odyssey (private website), Remento (web, no login for storytellers), Moment Garden and 23snaps (digests) [F].

**Differentiator.** Faithful letters with the voices, readable by a grandparent in their own script, with no app and no ads.

**RICE.** Reach 1,500 (30%) x Impact 2 x Confidence 0.5 / Effort 6 = **250**.

**Dependencies.** FAM-03 (uploaded audio, v1.1), FAM-05 (family link, v1.2 recommended), FAM-06 (Reader role and digest, v1.3), T5-17 (`apps/web` shell, auth, CSP, v1.1); BK-01 rendering rules. Gated: it ships in v1.3 only if those are ready; otherwise v1.4.

**Legal and cost.** A new web surface (TDD 10 called the web contribution page the riskiest surface); Privacy Policy section for readers; accessibility statement. Egress for audio playback is small [E: ARCH 7 budgets about 1 TB at 100k families].

**Metric.** Weekly readers per book with a reader; web listening sessions per week (server aggregates).

**Size.** L. **Horizon.** Next (v1.3, gated).

### F. The printed book

### BK-13 Print-ready book file

**Problem and evidence**
- [F] Parents object to digital baby books that "end up costing hundreds of dollars" and want a self-printable file (UR 4.1, [S29]). Competitors charge for files: Baby Notebook PDF $9.99, The Short Years digital download $7.99, Qeepsake PDF about $15 [U] (US 3.1, 3.6, 3.7).
- [F] Print quality is a known complaint: blank pages with a single line, tiny grainy collages (CR 4, item 3).
- [F] Today's PDF is Letter or A4, with no bleed, no separate cover, and system fonts (EXPORT). Commercial printing usually needs trim plus bleed, a cover with a spine sized to the page count, and embedded fonts [U: Lulu's exact file spec to confirm]. Apple's system fonts are licensed for the platform; whether they may be embedded in a book we sell is doubtful [U, counsel], so print needs open-licence fonts.
- [F] The launch checklist forbids any string that mentions printed books, print or ordering a book (PRD 6.7, K-32).

**Job to be done.** "When the year is done, give me a file I can print beautifully anywhere, without paying anyone for the file."

**Solution [R]**
1. An export option per child-year: a square 8.5 x 8.5 inch interior with bleed and a separate cover file with a computed spine (Lulu's square hardcover trim [F]), plus a home-print Letter or A4 version.
2. Fonts: Literata and Mukta and Tiro Devanagari Hindi (already the design system's), plus open-licence Arabic and Chinese serif faces for print only, downloaded as a data pack when a book needs them (BRIEF 15 keeps the app under 40 MB) [A: OFL licences to confirm per face].
3. Layout rules: never a page with a single orphaned line; letters never split across a page turn if they fit on one page; photos at their real resolution, smaller if low resolution, never upscaled (section 8).
4. Validated against the first partner's file checks before BK-14 [U: whether Lulu exposes file validation in its API].
5. Copy says "A file made for printing", never "order" or "printed book", until the founder lifts K-32 for print.

**What competitors do.** Paid PDFs (Baby Notebook, The Short Years, Qeepsake); print-to-PDF (Apple Journal); free PDF (Day One) [F].

**Differentiator.** A free, properly typeset, multi-script book file.

**RICE.** Reach 500 (10%) x Impact 1 x Confidence 0.8 / Effort 4 = **100**. Ranked as a commitment: it is the demand signal and the file engine for BK-14.

**Dependencies.** Founder: allow the word "print" for a file (scope BL-118's print rule to ordering and printed-book promises); content; design (layout); font packs on the CDN (Q-001 host); BK-05 (Firsts page).

**Legal and cost.** Font licences (content owner checks each); the K-32 copy rule. CDN egress for font packs is small [E].

**Metric.** `export_completed{format: print_pdf}` per family at or past a first birthday. **Go signal for BK-14 [R]:** at least 10% of families reaching a first birthday make a print-ready file within 30 days.

**Size.** L. **Horizon.** Next (v1.3 if capacity, else v1.4).

### BK-14 Printed Year One book (partners, regional fulfilment, Apple 3.1.3(e))

**Problem and evidence**
- [F] Print is the category's profit engine (CR 3); almost every baby-book product sells a book, even Google Photos (US 6, item 8; GLOBAL 5.1 item 5). Parents praise a finished printed book (US 9) and grandparents want something tangible (UR 5, delight 4).
- [F] Remento's "Baby Book of Firsts": $99 for a year plus one full-colour hardcover with US shipping, extra copies $69, a 30-day money-back guarantee, QR codes that play the recordings; its "Speech-to-Story technology writes the story" (ADJ A2; Remento page, section 10). The Short Years sells from $129 (US 3.6).
- [F] What goes wrong: print delays ("upwards of 7 weeks"), lost orders, credits that expire annually (US 9, theme 11); FamilyAlbum suspended print, photobook, calendar and DVD orders to nine EU countries on 17 July 2026, citing the EU customs reform of 1 July 2026 (GLOBAL G7).
- [F] Apple 3.1.3(e): "If your app enables people to purchase physical goods or services that will be consumed outside of the app, you must use purchase methods other than in-app purchase to collect those payments, such as Apple Pay or traditional credit card entry." (App Review Guidelines, section 10).
- [F] Lulu's Print API prints in Australia, Canada, France, India, the United Kingdom and the United States; is RESTful with webhooks; Lulu's square 8.5 x 8.5 inch hardcover photo book starts at $14.76 (Lulu pages, section 10). ADR 0007 already chose Lulu for print: the API is free; we pay print, shipping, a fulfilment fee and sales tax per job.
- [F] Gelato produces in 33 countries through 250+ partners, offers hardcover and softcover photo books and an API (Gelato page, section 10).
- [F] Printed books are a future launch; Terms 15 is "not offered yet" and the Print Terms are not drafted; counsel flagged California SB 478 all-in pricing (Terms 15 counsel note); FTC Mail Order Rule and PCI via hosted checkout (CR-054); sales tax where we have nexus (CR-120); order records 7 years (data-policy).

**Job to be done.** "When the first year is done, I want a real book on our shelf (and one for Nani) that holds our words, and that {child} can hold at eighteen."

**Solution [R]**
1. **Product:** "Early Letters: Year One" (the name already in `book.en.ts`), 8.5 x 8.5 inch hardcover, cover per CREATIVE 6 (cloth or paper look in brand colours, the envelope line, the child's first name, "Year One"; no cover photo by default). Interior from BK-13; Firsts page, birthday page, letters by month, colophon. QR codes from BK-15 when ready (a book without QR codes is still a complete product).
2. **Which letters:** those in the book for that year, from every author, as Terms 7.1 allows; never private letters of others, sealed letters, or letters waiting or set aside. The preview lists the authors whose letters are inside.
3. **Order flow:** full preview of every page and every cost before payment (Terms 15.2); a hosted checkout with card and Apple Pay, opened from the app, on pm-5's web platform, never IAP (3.1.3(e)); order status in the app; one calm email per state.
4. **Partner:** Lulu first (ADR 0007; US production, API, webhooks). Gelato evaluated as the regional fallback. Selection criteria: in-region production, sandbox and webhooks, file checks, cover materials, defect policy, deletion of print files after shipping (DPA).
5. **Regions:** US addresses only for the pilot (the app is US-only, LEGAL-REQ-058). Then, only with in-region production: Canada, UK and Australia when pm-4 opens those storefronts (Lulu prints in all three); the EU only with production inside the EU and an EU Responsible Person under the GPSR (a partner can provide one) [F secondary source]; never cross-border shipping from one country (FamilyAlbum lesson; the EU charges a EUR 3 duty per item category on low-value parcels from 1 July 2026 to July 2028 [F secondary source]).
6. **Price [R, A on costs]:** $59 for the first copy with US shipping included, $39 for each extra copy in the same order (BK-16). Estimate per first copy: Lulu base from $14.76 [F] plus pages beyond the base [U, calculator] (about $6 [E]) plus US shipping (about $8 [E]) plus card fees (about 3% [U]) plus a QR-link reserve ($2 [E], BK-15) plus a defect and reprint reserve (5% [E]) gives about $36, so about 39% gross margin. Firm quotes from Lulu replace these before launch. No print credit inside Plus (pm-4 agrees; Apple's position on IAP-funded print credits is unresolved, C OQ2).
7. **Support:** free reprint for print defects with a photo of the fault; lost parcels reshipped once; refunds per the Print Terms. We own payment, refunds and support (ADR 0007), so the support runbook comes before the first order.
8. **Timing:** the bulk of the launch cohort reaches a first birthday in late 2027 [A], which is also the holiday season. Pilot with the C1 beta families by September 2027, open to US families in October 2027.

**What competitors do.** Remento ($99 year plus book, QR audio, AI-written story), The Short Years (print binder from $129), Qeepsake (book credits that expire), Dear Ones (hardcover, layflat, softcover in the US), Day One (25 to 35% off printing) [F: US 3, ADJ A2].

**Differentiator.** The only printed baby book where every word is exactly as the family said it, in their scripts, with their voices one scan away, priced once with no credits to expire.

**RICE.** Reach 500 (10%) x Impact 3 x Confidence 0.5 / Effort 10 = **75**. RICE undervalues it: it is the category's revenue line and the end state families picture. It is Later because of K-32, ops risk and timing, not because it matters less.

**Dependencies.** Founder lifts K-32 and D-010 for the print release; BK-13 (files); BK-15 (QR, optional for the pilot); T5-27 (hosted checkout, DPA, subprocessors) and T5-01 (privacy label: a shipping address becomes collected Contact Info); counsel (Print Terms, SB 478, Mail Order Rule); accountant (sales tax as an individual seller, CR-120); D-004 (selling physical goods as an individual adds personal liability: this file recommends forming the entity before the first order).

**Legal and cost.** As above. Cost: about 10 person-weeks, physical proof rounds (a few hundred dollars [E]), a support load we estimate at 3 to 5 tickets per 100 orders [A].

**Metric.** Orders per 100 families reaching a first birthday (target 10 to 15 [A]); defect or reprint rate under 2% [A]; refund rate under 3% [A]; median days from order to delivery under 10 in the US [A]; gross margin per book at least 35% [A]. Orders are counted from the orders table (server aggregates), never from device analytics.

**Size.** XL. **Horizon.** Later (US pilot, October 2027). Go/no-go in June 2027 on BK-13's signal.

### BK-15 QR codes to recordings that keep working for decades

**Problem and evidence**
- [F] Remento's book has a QR code per chapter that plays the original recording, and it promises the recordings linked from the book keep playing after a subscription lapses (Remento page, section 10). The Short Years prints QR codes to videos, which reviewers praise (US 3.6). Spain's Dots prints QR codes to voice messages, and failed codes drew one-star reviews (GLOBAL 2.3).
- [F] Research asked the print owner: "If we print QR codes, the links must last for decades" (GLOBAL 6, request 3).
- [F] A short clip of a family member's voice is enough to clone it for scams (ADJ A2, FTC), so the audio store must have no public URLs and only short-lived signed links (ADJ A2 line 4).
- [F] v1.0 uploads no recordings (BRIEF 9); pm-5 requires links to resolve through a host we control (Q-006).

**Job to be done.** "When {child}, or Nani, holds the book, let them hear the voice that said each letter, years from now, without an app."

**Solution [R]**
1. **One small code per letter that has a recording**, beside the signature, with an 8-character printed code under it.
2. **Link format:** `https://earlyletters.com/v/<code>#<book key>`. The code names the letter; the book key, in the URL fragment (never sent to servers or logs, the B-NFR-002 pattern), unlocks one book. The listening page (BK-12) exchanges the key for a short-lived signed audio URL. No vendor or shortener domain, ever.
3. **What it opens:** the original recording, the dateline and the signature, and the words as printed. Nothing else in the book is reachable from a code.
4. **Control:** a parent can turn a book's codes off (the page then says the family has paused listening); turning them off breaks printed codes, and the app says so. Rate-limited, `noindex`, no audio download button.
5. **Consent [R, counsel]:** each author chooses whether their recordings may play from a printed book (default on for your own letters, asked once for letters by others).
6. **Durability:** the recording for every printed letter stays stored while the book exists, whatever the plan (the keep-and-leave rule, C 4.1); if an author deletes a letter or their account, its code says calmly that the letter is no longer in the book. The colophon says each code's number matches a recording in the family's export, and the export gains `print_code` per letter (export `format_version` 1.1.0, SPEC 4.3 and DATA-REQ-055 semver). Domain registration, the resolver and what happens under the 90-day shutdown pledge are pm-5's.
7. **Physical:** at least 18 mm square with a full quiet zone and error correction level Q, tested with the stock iPhone and Android cameras on the real paper [A].

**What competitors do.** Remento (per chapter), The Short Years (videos), Dots (voice, unreliable), Juno (videos) [F: ADJ A2, US 3.6, GLOBAL 2.2 and 2.3].

**Differentiator.** Per-letter voices next to the faithful words, behind a key that only the book holds, with a printed fallback that survives us.

**RICE.** Reach 300 (6%) x Impact 2 x Confidence 0.5 / Effort 5 = **60**.

**Dependencies.** FAM-03 (uploaded audio), BK-12 (listening page), BK-14, T5-04 (resolver served statically after shutdown, domain kept at least 10 years), counsel (consent).

**Legal and cost.** A new disclosure: anyone holding the book can hear the linked recordings (Privacy Policy, Terms 7.1). Storage [E]: about 0.23 GB per child-year of audio at ARCH 7 rates (about $0.005 a month), roughly $1 to $2 per printed book over 20 years at today's list price, covered by the $2 reserve in BK-14.

**Metric.** Scans per printed book in the first 90 days; failed scans or key errors under 1% [A]; zero audio requests without a valid book key (security test).

**Size.** L. **Horizon.** Later (with BK-14; optional for its pilot).

### BK-16 Gift editions for grandparents

**Problem and evidence**
- [F] Nine in ten US grandparents gave financial support to grandchildren last year, averaging $2,654 (UR 4.4, [S15]); Storyworth is built around the gift (UR 4.4); Remento sells extra copies at $69 (ADJ A2).
- [F] Famileo prints a monthly gazette for grandparents, with 260,000 subscribing families [F: GLOBAL 2.2, company claim].
- [F] CREATIVE 5 plans "Early Letters: Year One" as "the gift grandparents give back".
- [F] Q-006: digital gifts of Plus are pm-4's; printed gifts are this file's.

**Job to be done.** "Let me send Nani her own copy of Asha's year, in type she can read, without her needing an app."

**Solution [R]**
1. **Extra copies** in the same order at $39 each, shipped to different addresses, with an optional gift note (the sender's own words, printed on a card).
2. **Large Print edition:** the same book at a larger type size, for older eyes (Large Print already exists in the app, DL principle 6).
3. **"Letters from Nani" edition:** only one author's letters, for that author or about them (Terms 7.1 covers it) [R, counsel confirms].
4. **Overseas grandparents:** printed in their region once BK-14 opens it (Lulu prints in India, the UK, Canada and Australia [F]); India needs an accountant's answer on GST for goods sold by a US individual and produced there [U].

**What competitors do.** Extra copies (Remento $69; Storyworth $39 to $99), gazettes (Famileo) [F].

**Differentiator.** A grandparent copy in their own language and script, in large print if they want it.

**RICE.** Reach 250 (5%) x Impact 2 x Confidence 0.5 / Effort 3 = **83**.

**Dependencies.** BK-14; pm-2's family model (who the grandparent is); G-10 (one gift entry point, two paths: a digital year of Plus, or printed copies).

**Legal and cost.** A grandparent's shipping address is a third party's personal data (L3), kept with order records for 7 years (data-policy) and named in the Privacy Policy. International shipping adds duties and tax questions (above).

**Metric.** Copies per order (target 1.4 [A]); share of orders with a second address.

**Size.** M. **Horizon.** Later (after BK-14).

### G. The archive

### BK-17 Splitting large exports

**Problem and evidence**
- [F] SPEC 4.2: "One ZIP (ZIP64), split into one part per child-year when larger than 2 GB", and DATA-REQ-050 (P0) is "As 4.1 and 4.2".
- [F] The v1.0 export uses fflate without ZIP64, caps an export at 3.9 GB and throws `ExportTooLargeError` above it; splitting is not built (EXPORT `pack.ts`).
- [E] A child-year is about 230 MB (C-NFR-007), so one child reaches 3.9 GB in about 17 years and two children in about 8; family voices (FAM-03) and video (CVL-11) shorten that sharply. A failed export breaks the "never held hostage" promise (C 4.1; US 9, theme 15).

**Job to be done.** "Whatever size our book grows to, export always works."

**Solution [R].** When the estimate passes 2 GB, write one ZIP per child-year, each complete on its own (README, manifest, schema, `index.html`, letters, recordings, that year's PDF), plus a parts list in each README; a single child-year over 2 GB splits by month. Add "Export one year" for sharing a small file. Keep fflate (each part stays under 4 GB, so no ZIP64 is needed). Extend the golden export test. The server-built export (DATA-REQ-054, pm-5) follows the same rule.

**What competitors do.** FamilyAlbum has no bulk export even on its top tier; Tinybeans reviewers cannot export (US 3.2, 3.3) [F].

**Differentiator.** An export that always works is part of the promise.

**RICE.** Reach 25 (0.5%) x Impact 3 x Confidence 1.0 / Effort 2 = **38**. A commitment: it closes a written P0 spec gap before FAM-03 grows exports.

**Dependencies.** None blocking. The legal owner confirms that the v1.0 cap is acceptable until this ships.

**Legal and cost.** Closes the gap; nothing new. **Metric.** `export_failed{reason: too_large}` is zero; export success rate is 100% in every size bucket. **Size.** M. **Horizon.** Next (v1.2).

### BK-18 The Book at 18 edition

**Problem and evidence**
- [F] "Handing over a lifetime of letters at 18" is a top delight (UR 5, delight 2); parents already do it with an email account (UR 1.3). SPEC 4 (DATA-REQ-055) designs the export so a parent can give it to the child at 18; an in-app handover needs counsel first.
- [F] Q-006: the handover flow (membership, consent, sealed-letter opening) is FAM-13 (pm-2); the artefact is this file's.

**Job to be done.** "When {child} turns 18, give them everything, in a form that still opens."

**Solution [R].** A "Book at 18" export: every year's PDF and voice file (BK-08), letters sealed until 18 now opened, the full archive in the durable formats of DATA-REQ-055, and a README written for the grown child (template copy). An optional printed box set later. Nothing to build until families approach it; keeping the export format readable (DATA-REQ-055 fixtures in CI) is the work that matters now.

**What competitors do.** Moments' gift key at 18; the child's email account (US 3.13, ADJ A3) [F].

**Differentiator.** Every voice, every letter, faithful, in open formats.

**RICE.** Reach about 0 in the v1.1 to v1.3 window. **Dependencies.** FAM-13, BK-03, BK-08, DATA-REQ-055. **Legal and cost.** Counsel on handover (pm-2). **Metric.** None yet. **Size.** M. **Horizon.** Later.

### BK-19 Book themes and covers

**Problem and evidence**
- [F] B-REQ-019 (P1): themes Paper (default), Linen, Plain ("prints well at home"), per child, for the reader and the PDF; extra themes were a Plus idea, but v1.0 Plus promises no themes (`billing.en.ts`).
- [F] Day One and Dearest charge for extras (C 4.1).

**Job to be done.** "Let {child}'s book look like ours."

**Solution [R].** The three B-REQ-019 themes in the reader and the PDF; two print covers for BK-14. Rendered text always equals stored `final_text` (B-REQ-019 criterion).

**What competitors do.** Paid extras (Day One, Dearest) [F].

**Differentiator.** Calm, typographic themes rather than stickers.

**RICE.** Reach 1,000 (20%) x Impact 0.5 x Confidence 0.5 / Effort 3 = **83**.

**Dependencies.** Design; G-19 (pm-4 may pull it forward as Plus value). **Legal and cost.** None. **Metric.** Share of books with a non-default theme. **Size.** M. **Horizon.** Later.

---

## 5. All scores

| ID | Item | Reach | Impact | Confidence | Effort (pw) | RICE | Size | Horizon |
|---|---|---|---|---|---|---|---|---|
| BK-06 | On this day | 2,500 | 1 | 0.8 | 1 | 2,000 | S | Now (v1.1) |
| BK-01 | Read together word highlight, bedtime layout | 2,000 | 2 | 0.8 | 3 | 1,067 | M | Now (v1.1) |
| BK-05 | Milestones and firsts | 2,500 | 1 | 0.5 | 2 | 625 | M | Next (v1.2) |
| BK-04 | Birthday letters | 750 | 1 | 0.8 | 1 | 600 | S | Next (v1.2) |
| BK-07 | Year in letters | 1,250 | 2 | 0.5 | 3 | 417 | M | Next (v1.2) |
| BK-09 | Search, people, occasions | 1,500 | 1 | 0.8 | 3 | 400 | M | Next (v1.3) |
| BK-10 | Save to Apple Photos | 1,000 | 0.5 | 0.8 | 1 | 400 | S | Next (v1.2) |
| BK-03 | Sealed letters | 1,250 | 1 | 0.8 | 4 | 250 | L | Next (v1.2) |
| BK-08 | Year in voices | 750 | 2 | 0.5 | 3 | 250 | M | Next (v1.3) |
| BK-12 | Web reader | 1,500 | 2 | 0.5 | 6 | 250 | L | Next (v1.3, gated) |
| BK-13 | Print-ready book file | 500 | 1 | 0.8 | 4 | 100 | L | Next (v1.3 or v1.4) |
| BK-16 | Gift editions | 250 | 2 | 0.5 | 3 | 83 | M | Later |
| BK-19 | Themes and covers | 1,000 | 0.5 | 0.5 | 3 | 83 | M | Later |
| BK-14 | Printed Year One book | 500 | 3 | 0.5 | 10 | 75 | XL | Later (Oct 2027 pilot) |
| BK-11 | Keepsake widgets | 750 | 0.5 | 0.5 | 3 | 63 | M | Later |
| BK-15 | QR codes to recordings | 300 | 2 | 0.5 | 5 | 60 | L | Later |
| BK-17 | Splitting large exports | 25 | 3 | 1.0 | 2 | 38 | M | Next (v1.2, commitment) |
| BK-18 | Book at 18 edition | about 0 | 3 | 0.5 | 3 | 0 | M | Later |
| BK-02 | Reading mode for the child | n/a | n/a | n/a | n/a | n/a | n/a | Will not build |

---

## 6. Top 10 for v1.1 to v1.3, and the release plan

The top 10 is the table in section 0. Release plan [R], against about 10 to 14 person-weeks per release for this theme [A]:

| Release | Items | Person-weeks | If capacity is short |
|---|---|---|---|
| **v1.1** (about Jan 2027) | BK-06 On this day; BK-01 word highlight and bedtime layout | 4 | Kept light on purpose: v1.1 carries the founder's committed items in other themes (Hindi-English, family voices). BK-01 may ship sentence-level only for a language whose CVL-20 timings are not ready |
| **v1.2** (about Mar 2027) | BK-05 firsts; BK-04 birthday letters; BK-07 Year in letters; BK-10 Save to Photos; BK-03 sealed letters; BK-17 export splitting | 13 | BK-03 moves to v1.3 first; BK-07, BK-04 and BK-05 ship together because the Year page is made of them |
| **v1.3** (about May 2027) | BK-09 search; BK-08 year in voices; BK-12 web reader (only if FAM-03, the Reader role and the web shell are ready); BK-13 print-ready file if capacity allows | 12 to 16 | BK-13 moves to v1.4 (still before the June print go/no-go); BK-12 moves to v1.4 if its gates are not met |
| **Later** | BK-14 printed Year One (US pilot October 2027, go/no-go June 2027); BK-15 QR codes (optional for the pilot); BK-16 gift editions; BK-11 widgets; BK-19 themes; BK-18 Book at 18 | | |

---

## 7. Will not build

| # | We will not build | Why |
|---|---|---|
| 1 | Machine-written recaps, titles, captions, summaries, "highlights" or story text in any keepsake | The constitution (CLAUDE.md); it is the competitors' model we stand against (US 3.14, ADJ A1 rewrite census) |
| 2 | Selection of letters by sentiment, length, "importance" or any inference | Section 1.1 rule 3; inference about meaning is adding meaning |
| 3 | Quotes cut out of letters for cards, shares, print or recaps | A cut changes meaning; whole letters only outside the app (rule 2) |
| 4 | Text-to-speech, synthetic voices, music under voices, or generated audio intros in Read together or the audio keepsake | CVL-04; ADJ A2 ethical lines; BENCHMARK (music over voices) |
| 5 | A child-operated reading mode, kids' mode or child profile | COPPA and Kids Category risk (CR-001 edge 2, K-20, PRD-REQ-005); the bedtime layout (BK-01) meets the real job |
| 6 | Developmental milestone checklists, expected ages, "early" or "late", milestone notifications | C-REQ-015; health positioning risk (D-004); UR S24 |
| 7 | Year stats: per-author counts, most active author, days missed, letters per week | C-REQ-015; the no-streak rule |
| 8 | Printed books or print credits bought through IAP, or print credits bundled into Plus | Apple 3.1.3(e); C OQ2 unresolved; pm-4 agrees |
| 9 | Cross-border print shipped from a single country | FamilyAlbum's EU suspension (GLOBAL G7); EU duty per item category from 1 July 2026 |
| 10 | QR codes or keepsake links on a vendor's domain or a URL shortener | Link rot over decades; pm-5's rule (Q-006) |
| 11 | Public share links to letters, recaps or recordings, or social cards with letter text by default | ADJ A2 line 5 (no public surface); the audio store is a cloning corpus (FTC) |
| 12 | Face recognition, automatic "people" detection in photos, or speaker identification for tagging | LEGAL-REQ-019, CR-040, Privacy Policy section 13 ("We never make a voiceprint") |
| 13 | Reading the photo library to suggest letters or build reels | Privacy complaint theme 9 (US 9); we do not compete on photos (US 3.23) |
| 14 | A server-side search index over letter text, or Spotlight indexing of letters | Data minimisation (pm-5 drops `entries.search`); children's letters in system search |
| 15 | A Lock Screen widget with letter text, or the child's name on any widget by default | D-025 rule carried to widgets |
| 16 | Encryption or time-lock claims for sealed letters | It is a privacy lock (B-REQ-018); claims registry (LEGAL-REQ-044) |
| 17 | Other physical keepsakes (canvases, mugs, voice-wave art, recordable toys or players) | Ops and support burden for a solo founder; off-brand (CREATIVE "Never: wax seals, quills, ribbons, sparkles, confetti"); the audio keepsake file already plays on any player |
| 18 | Free-form tags in 1.x | Occasions and search cover the need without a new synced vocabulary to maintain |

---

## 8. Rendering rules other leads asked for (accepted)

| From | Ask | How the book, PDF, print and web reader render it [R] |
|---|---|---|
| pm-1 (CVL-10) | One photo with a letter | Above the letter text, full width of the text column, never cropped by face detection (centre fit or letterbox); EXIF already stripped; in print at its real resolution, smaller if low resolution, never upscaled |
| pm-1 (CVL-19, counsel-gated) | The child's own sounds | A "sound" entry with a template label ("A sound from {child}, Month 5") and the recording; no transcript; plays in Read together; QR in print only if counsel's opinion covers it |
| pm-1 (CVL-12) | Imported voice notes | Filed on their original date, with pm-2's provenance line |
| pm-1 (CVL-04) | No text-to-speech in Read together | Typed letters stay silent with "Read it aloud together" (exists) |
| pm-1 | Fonts for new scripts | Any new script needs an open-licence print font in BK-13's font packs before its letters can be printed |
| pm-2 (FAM-07 guest and imported letters) | Signature "From Nani" plus a quiet provenance line ("Recorded on Papa's phone" or "Shared by Papa") | In the Book, PDF, print and web reader, under the signature, in the caption style |
| pm-2 (FAM-09 family round) | A round's answers gathered together | One section inside the chapter for that moment, titled by template ("For {child}'s first birthday"), letters in date order |
| pm-2 (FAM-10 multi-generation) | Linked books across generations | Later; each book renders only its own child's letters, with a template link line to the linked book for members of both |

---

## 9. Decisions and requests

**Founder (in order of need)**
1. **"Arrange, never author"** (section 1.1) as the written corollary of the constitution for every keepsake; the coordinator adds it to CLAUDE.md if accepted. Needed before v1.2 planning.
2. **Keepsakes Free** (agreed with pm-4 in G-19): sealed letters, birthday letters, firsts, On this day, Year in letters and the year in voices; word highlight inside Read together's free sessions; themes Plus. The founder confirms with the G-19 packaging. Before v1.2.
3. **Allow the word "print" for a file** (BK-13): scope the K-32 copy rule and BL-118's content rule to ordering and printed-book promises. Before v1.3 planning (about March 2027).
4. **Print go/no-go in June 2027** on BK-13's signal (at least 10% of families at a first birthday make a print-ready file), with counsel's Print Terms ready and an entity decision (D-004: this file recommends forming the entity before selling physical goods).

**Counsel (through the legal owner)**
- Print Terms (Terms 15), SB 478 all-in pricing, Mail Order Rule, refund policy (BK-14).
- Per-author consent for playing recordings from a printed book (BK-15).
- Whether a "Letters from Nani" edition needs anything beyond Terms 7.1 (BK-16).
- Whether embedding Apple system fonts in sold books is allowed (expected answer: use open-licence fonts) (BK-13).

**Other owners**
- **Legal owner:** SPEC 4.1 rule for sealed letters in exports (BK-03); confirm the 3.9 GB v1.0 cap is acceptable until BK-17; `print_code` in the export schema and `format_version` 1.1.0 (BK-15); Privacy Policy sections for print, QR listening and web readers.
- **Analytics owner:** proposed catalogue changes, all content-free: `read_together_started.highlight`; `letter_saved.occasion`; new `letter_sealed{until}`, `sealed_opened{early}`, `year_opened{year_n}`, `year_heard{completed}`, `keepsake_saved{kind}`, `search_performed{results_bucket}`; `export_completed.format` adds `print_pdf`, `voice_year`, `year_part`; `app_opened.source` adds `widget`. No language or script property anywhere (Q-004). Print orders and web reader use server aggregates only.
- **Content owner:** template strings for every new surface; font licences for print packs; store screenshot 3 and the preview video only show the highlight from the release that ships it.
- **Design owner:** bedtime layout; sealed placeholder and opened card (folded paper, never a wax seal); Firsts page; birthday page; Year {n}; month and letter cards for Photos; print layout rules.
- **Data architect:** `entries.occasion` and first label, `sealed_until` view and sync rules, local FTS5 table.
- **pm-1:** CVL-20 per-language timing quality on the v1.1 date; CVL-08 prompt text for firsts and birthdays in v1.2.
- **pm-2:** FAM-03 on v1.1 (it gates BK-12, BK-15 and every other person's voice in BK-01, BK-07 and BK-08); FAM-05 and FAM-06 timing for BK-12; FAM-13 triggers sealed-until-18 opening.
- **pm-4:** nothing open: G-19 and G-14 already carry this file's answers (packaging, no ask on the day) and the $59 and $39 print prices.
- **pm-5:** T5-04 resolver and link lifetime for QR codes; T5-27 checkout and DPA for print; T5-09 drop `entries.search` and keep `entries.alignment` readable to book members; T5-01 privacy label for print (shipping address); T5-17 web reader platform.

---

## 10. Sources opened on 3 Oct 2026 (outside the repo)

| Claim | Source |
|---|---|
| Apple 3.1.3(e), 3.1.1 gifting, 3.1.3 intro (quoted) | https://developer.apple.com/app-store/review/guidelines/ |
| Lulu Print API: facilities in Australia, Canada, France, India, UK, US; RESTful, webhooks | https://www.lulu.com/sell/sell-on-your-site/print-api |
| Lulu photo books: square 8.5 x 8.5 in hardcover from $14.76; US Letter landscape hardcover from $14.76 | https://www.lulu.com/create/photo-books |
| Gelato: 33 countries, 250+ production partners, hardcover and softcover photo books, API | https://www.gelato.com/en-US/products/photo-books/ |
| Remento Baby Book of Firsts: $99 with one hardcover and US shipping, extra copies $69, recordings linked from the book keep playing after a lapse, "Speech-to-Story technology writes the story" | https://www.remento.co/babybook |
| EU: EUR 150 duty exemption removed 1 July 2026, EUR 3 per item category until July 2028 (secondary source) | https://www.easyship.com/blog/eu-150-de-minimis-ends-for-ecommerce-sellers |
| EU GPSR applies to books placed on the EU market from 13 Dec 2024; EU Responsible Person and labelling (secondary source) | https://selfpublishingadvice.org/gpsr/ |
| `expo-widgets` for SDK 57: iOS only, `@expo/ui/swift-ui` only, App Groups, not in Expo Go | https://docs.expo.dev/versions/v57.0.0/sdk/widgets.md |

Not reachable this pass: Lulu's API fee help page (permission request withdrawn), so fulfilment-fee amounts stay as ADR 0007 states them; Lulu's per-page pricing calculator; Chapter One's listing beyond GLOBAL 2.2 (it describes text and photos, no print [U]).
