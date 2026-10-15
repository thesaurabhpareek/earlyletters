# Future backlog 01: capture, voice and languages (after v1.0)

Owner: pm-1 (capture, voice and languages). Date: 3 Oct 2026. Status: proposal for the coordinator to merge; nothing here changes a founder decision, a requirement or a v1.0 task.
Siblings: `02-family-circle.md` (pm-2), `03-book-keepsakes.md` (pm-3), `04-growth-monetisation.md` (pm-4), `05-trust-platform-insights.md` (pm-5). Overlaps were settled in `docs/agents/DEBATES.md` Q-006: each item is scored in one file only; the others cite it.

**Evidence tags.** **[F]** fact, with the file or source that states it (checked 3 Oct 2026, either in the doc named or in the repo). **[A]** our assumption. **[E]** our estimate. **[U]** unverified: we did not or could not confirm it. **[R]** recommendation (judgement). Source short names: BRIEF (`docs/agents/BRIEF-2026-10-03.md`, decisions 1 to 17), PRD (`docs/prd/PRD.md` 1.3), D-### (`docs/DECISIONS.md`), ROADMAP (`docs/ROADMAP.md` 2.0), BL-### (`docs/BACKLOG.md`), TDD 10 (`docs/tdd/10-red-team-critique.md`), UR (`docs/research/USER_RESEARCH.md`), US / GLOBAL / ADJ (`docs/research/competitors/us.md`, `global.md`, `adjacent-and-ux-benchmarks.md`), LANG (`docs/research/LANGUAGES.md`), ADR 0009, 0012, 0014, 0015, CR-### (`docs/legal/compliance-register.md`), LEGAL-REQ-### (`docs/legal/ENGINEERING_REQUIREMENTS.md`).

---

## 0. Summary

**The judgement in one paragraph.** v1.0 launches seven spoken languages, but six of them run on unreviewed word tables and on speech quality nobody has measured on parents talking at a crib [F: packs, ADR 0014 section 3, ADR 0015 status]. The founder's core segment, Hindi-English families, cannot yet get a faithful letter of how they actually speak [F: BRIEF 6 and 9, ADR 0012, TDD 10 risk 13]. So the first job after launch is not more surface area; it is making the letters we already capture **true in every language we already claim**: native-speaker review, names that stick, visible "we may have missed you" markers, the Hindi-English mode, word timings good enough for Read together, and a way to see accuracy per language without hearing a single family. Breadth (photos, voice-note import, prompts, quick capture) comes next, and only in forms that keep us a letters product. Two ideas from the brief are worth saying out loud as product lines because nobody else claims them: **we never make a voice**, and **we never rewrite or translate what someone said**.

### Top 10 for v1.1 to v1.3

| # | ID | Item | RICE | Size | Release | Why here |
|---|---|---|---|---|---|---|
| 1 | CVL-04 | "We never make a voice": product rule, guardrails, one calm line | 4,000 | S | v1.1 | Unclaimed in every market [F: GLOBAL 5.2]; half a week |
| 2 | CVL-03 | Names and words that learn from Review, on the phone | 1,400 | M | v1.1 | Names are the core accuracy bar (95%) [F: ADR 0012]; the learning path is not wired today [F] |
| 3 | CVL-02 | Native-speaker review of the six language packs (plus test recordings) | 1,200 | M (S eng) | Start now; lands as data, no release | All six packs' word tables are `draft`, so non-English letters keep fillers and stumbles [F] |
| 4 | CVL-06 | Fidelity at the seams: "not written down" markers and tap-to-hear | 800 | M | v1.1 | Code-switched speech drops words silently [F: UR S12]; UR R11 |
| 5 | CVL-01 | Hindi and English in one letter, with the author's choice of script | 188 (commitment) | L | v1.1 | Founder decision 6 and 9 put it in v1.1; core segment; ships with CVL-06 |
| 6 | CVL-20 | Word timings good enough for Read together highlight, per language | 400 (dependency) | M | v1.1 | Word highlight is v1.1 (BRIEF 9); pm-3 owns the UX, timings are ours |
| 7 | CVL-05 | Accuracy per language without seeing content | 400 | M | Corpus now; in-product v1.2 | Today `lang` never sits on capture events [F], so per-language quality is invisible |
| 8 | CVL-08 | Prompts v3: no near repeats, seasonal and opt-in occasion prompts | 600 | M | v1.2 (content written in v1.1 window) | Prompts drive capture [F: UR]; repeat window is 10 prompts today [F] |
| 9 | CVL-07 | Language chip per letter and "Transcribe again as..." | 525 | M | Chip v1.1, re-transcribe v1.2 | Bilingual households; pm-2's v1.1 guest author picks the speaker's language with the chip |
| 10 | CVL-10 | One photo with a letter (system picker, no library access, no faces) | 525 | L | v1.2 | Table stakes [F: US 6.2]; needs pm-2's upload pipeline |

Just below the line, in order: CVL-12 voice-note import including WhatsApp (500, v1.2 to v1.3), CVL-13 quick capture from Siri, controls and widgets (250, v1.3), CVL-09 prompts in the author's spoken language (250, v1.3), CVL-19 the child's own voice (300, only after counsel). Section 4 has the release plan and capacity; section 5 the will-not-build list.

### All items at a glance

| ID | Item | RICE | Size | Horizon |
|---|---|---|---|---|
| CVL-01 | Hindi-English mode and script choice | 188 | L | Now (v1.1) |
| CVL-02 | Native-speaker review of language packs | 1,200 | M | Now |
| CVL-03 | On-device personal vocabulary | 1,400 | M | Now (v1.1) |
| CVL-04 | "We never make a voice" | 4,000 | S | Now (v1.1) |
| CVL-05 | Privacy-respecting accuracy feedback | 400 | M | Now (corpus) / Next (in product) |
| CVL-06 | Fidelity at the seams | 800 | M | Now (v1.1) |
| CVL-07 | Language chip, per-letter language, transcribe again | 525 | M | Now (chip, v1.1) / Next (re-transcribe, v1.2) |
| CVL-08 | Prompts v3 and seasonal prompts | 600 | M | Next (v1.2) |
| CVL-09 | Prompts in the author's spoken language | 250 | M | Next (v1.3) |
| CVL-10 | Photos with letters | 525 | L | Next (v1.2) |
| CVL-11 | Short video with letters | 50 | L | Later |
| CVL-12 | Voice-note import (Voice Memos, then WhatsApp) | 500 | L | Next (v1.2 phase 1, v1.3 phase 2) |
| CVL-13 | Quick capture: Siri, Shortcuts, controls, Action button, widget | 250 | M | Next (v1.3) |
| CVL-14 | Start recording from the lock screen without opening the app | 56 | L | Later (counsel first) |
| CVL-15 | Apple Watch capture | 9 | XL | Later (probably never in 1.x) |
| CVL-16 | Language requests, then language #8 and #9 by evidence | 50 per language (intake S) | S + L each | Next (intake v1.2) / Later |
| CVL-17 | Cantonese | 20 | L | Later |
| CVL-18 | Indian regional languages | 8 | XL | Later |
| CVL-19 | The child's own voice, COPPA-aware | 300 | L | Next (v1.3) only if counsel clears; ask now |
| CVL-20 | Word timings for Read together, per language | 400 | M | Now (v1.1) |

---

## 1. How to read the scores

**RICE = Reach x Impact x Confidence / Effort.**
- **Reach [A]:** families touched per quarter, as a share of a planning base of **5,000 active families per quarter** in the v1.1 to v1.3 window (between the PRD's 1k at launch and its 100k year-one hope, PRD 7.8). Because every reach is a share of the same base, the ranking does not depend on the base; only the segment shares matter. Segment shares used [A, to replace with server aggregates once live]: spoken-letter authors 80%; families with a non-English spoken language 30%; families with a Hindi-speaking author 15%; families who would attach a photo 60%; families holding a relative's voice note they would keep 40%; families with a baby who would record the child's sounds 40%.
- **Impact:** 3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal.
- **Confidence:** 80% when the evidence is ours or verified; 50% to 60% when a model, device or decision is unmeasured; 30% or less when counsel or a platform API decides it.
- **Effort [E]:** person-weeks of agent-built work plus founder review and testing, excluding counsel time and external reviewers' hours (those are cost, listed separately).
- **Size:** S up to 1 person-week; M 2 to 3; L 4 to 6; XL more than 6.
- **Horizon [A on dates]:** **Now** = v1.1 (ROADMAP 6: 6 to 8 weeks after a mid-November launch, so about January 2027); **Next** = v1.2 (about March 2027) or v1.3 (about May 2027); **Later** = after v1.3 or unscheduled.
- **Capacity [A]:** about 10 to 14 person-weeks per release for this theme, shared with four other leads.

Two items carry low RICE but sit in the top 10 by **commitment**, and are marked so: CVL-01 (founder decision 9 names Hindi-English mode for v1.1) and CVL-20 (founder decision 9 names word highlighting for v1.1; pm-3's UX depends on our timings).

---

## 2. What v1.0 ships in this area (facts the items build on)

| Area | v1.0 state | Source |
|---|---|---|
| Spoken languages | English, Hindi, Spanish, Mandarin, French, Arabic, Portuguese; one language set per author ("person, all children" scope) | [F] BRIEF 6; PRD-REQ-013 |
| Speech models | Shared turbo q5_0 (574 MB) for six languages; whisper-hindi-small (190 MB) for Hindi once hosted; small q5_1 on phones under 4 GB RAM; language set explicitly per chunk, no auto-detect | [F] ADR 0015 sections 1, 2, 8 |
| Text rules | One engine, rules as data; English pack native-reviewed; the six downloadable packs have `fillers`, `meaning`, `repeats` and `phonetic` all `draft`, so they run "punctuation-safe" (punctuation, script, dictionary fixes only) | [F] `packs/text-rules/*.json` review fields; ADR 0014 section 3 |
| Script | Hindi in Devanagari; Mandarin Simplified or Traditional per author (1:1 OpenCC mapping only); Arabic dialects never normalised; Portuguese BR or PT label | [F] ADR 0014 sections 4 and 7 |
| Hindi script default | Open, decided from the 14-recording experiment by 30 Oct; default Devanagari with English in Latin | [F] D-031 |
| Names | Recogniser prompt carries the family's spellings per chunk (200-token cap); the app's dictionary is built only from child name, birthday and "signs as"; `DictionaryTerm.heardAs` exists but no Review flow writes taught mishearings | [F] ADR 0015 section 3; `apps/mobile/src/lib/store.ts` `dictionaryFor`; `apps/mobile/src/app/review.tsx` |
| Review | Every machine edit underlined and undoable; no low-confidence or dropped-speech markers | [F] `review.tsx` (no confidence UI found) |
| Original audio | Never altered; optional listening copy via AUSoundIsolation, excluded from backup and export | [F] BRIEF 8; ADR 0015 section 5 |
| Prompts | 103 hand-written English prompts, bands 0 to 60 months, kinds opening, gap, hard, family, together; 13 `together` prompts off behind `child-input`; no seasonal kind; repeat guard `AVOID_RECENT = 10`; server-delivered content | [F] `packages/content/src/prompts.ts`; `packages/core/src/prompts.ts`; BRIEF 16; PRD-REQ-005 |
| Photos and video | No picker in the app; schema has `photo_path`; export already handles photos with EXIF stripped | [F] grep of `apps/mobile/src`; B schema; BL-150 |
| Capture surfaces | In-app only; never background, never auto-start (LEGAL-REQ-011) | [F] LEGAL-REQ-011; TDD 01 |
| Analytics | `lang` (closed list of 7) only on `language_set` and `pack_download`, never on capture or letter events; edit reverts and verifier rejections are counted content-free | [F] `packages/analytics/src/catalog.ts`; DEBATES Q-004 |
| Audio upload | None in v1.0; family hearing each other's recordings is v1.1 (pm-2) | [F] BRIEF 9; ROADMAP 1 |

---

## 3. Items

Each item: problem and evidence; who and the job; solution; competitors; differentiator; RICE; dependencies, legal and privacy; metric; size; horizon.

### CVL-01 Hindi and English in one letter, with the author's choice of script

**Problem and evidence**
- [F] Founder decisions 6 and 9 defer "Hindi-English code-switching mode" to v1.1 (BRIEF). D-031 (script default) is open until 30 Oct.
- [F] 72% of Indian Americans aged 5+ speak a non-English language at home; Whisper large-v2 scored a 52% mixed error rate on Hindi-English speech and **drops words at language switches** (UR 1.4, [S12], [S13]). UR's own implication: dropped Hindi words are the opposite of faithful.
- [F] Base large-v3 is 29.74% WER on CoSHE-500 Hinglish; `Trelis/whisper-hinglish-preview` (Apache-2.0) 13.67% with Hindi in Devanagari and English in Latin, but English gets worse (6.93% vs 4.81%); `Oriserve/Whisper-Hindi2Hinglish-Prime` (Apache-2.0) writes Roman Hinglish. Both are large-v3 size with 32 decoder layers, so several times slower than turbo on a phone [E] (ADR 0012).
- [F] On read Hindi, whisper-hindi-small beat turbo 10.1% to 30.2% WER, but nothing was measured on code-switched parent speech or English names inside Hindi (ADR 0015 M-2).
- [F] TDD 10 risk 13: "Hinglish accuracy disappoints the core segment."
- [F] No memory product mentions code-switching (GLOBAL 5.2 item 3). Wispr Flow needs "Hinglish" chosen explicitly and outputs Roman; Sarvam's "Codemix" writes English words in English and Hindi in Devanagari (ADJ A4).

**Who and job.** Hindi-speaking parents and grandparents in the US who move between Hindi and English inside one sentence. Job: "Keep our languages and family voices for my child" (UR JTBD 5), written the way we actually speak.

**Solution [R]**
1. A third language choice per author, **"Hindi and English"**, beside Hindi and English. Stored per author like today (L4).
2. **Script comes from the recogniser, never from transliteration afterwards.** Offer only the scripts the golden corpus proves: (a) Devanagari with English words in English letters (the D-031 default), (b) Roman letters throughout. Converting Devanagari to Roman after transcription is not a letter-for-letter mapping (schwa deletion, many spellings per word), so it cannot pass the ADR 0014 section 4 proof and is not a "fix" the machine may make.
3. **Model chosen by the golden corpus** (ADR 0015 section 9 item 1) among Trelis, Oriserve, whisper-hindi-small (check how it writes English words) and turbo with a code-mix seed. Bars (ADR 0012): at least 10 points better than turbo on code-switched clips, no more than 2 points worse on plain English and plain Hindi, names 95%, zero phantom words, and fits the SE 3 budget or the compact tier. If only a large-v3-size model wins, ship it to phones with enough memory [A: 6 GB or more] and keep the current models elsewhere. A consented cloud re-transcription (BL-304, owned by pm-5) is a fallback for later, never the default.
4. **Per-span rules.** The engine applies one pack per letter today; a mixed letter needs English tables for Latin-script spans and Hindi tables for Devanagari spans (fillers "um" and "उम" both) [E: engine change in `packages/core/src/lang`].
5. Ships **with CVL-06**, so a word the recogniser dropped at a switch becomes a visible marker, not silence.

**Competitors.** No memory app. Dictation and APIs (Wispr Flow Roman Hinglish, Sarvam Codemix). AudioPen mixes languages but rewrites the result (ADJ A1).

**Differentiator.** The only keepsake that writes a code-switched letter word for word in the author's chosen script, with the voice one tap away.

**RICE.** Reach 750 (15% of families, A) x Impact 3 (the core loop fails today for this segment's natural speech) x Confidence 50% (no code-switched measurement; device fit of the large models unproven) / Effort 6 = **188**. In the top 10 by commitment (founder decision 9) and segment importance (UR, TDD 10).

**Dependencies, legal, privacy.**
- D-031 by 30 Oct; BL-043 device spike; a code-switched golden corpus (founder recordings plus CVL-02 reviewers' scripted clips).
- D-046 host for any model we convert; counsel on training-data terms for Trelis and Oriserve, as ADR 0015 section 9 item 3 already asks for hindi-small [U].
- pm-5 (agreed, `05-trust-platform-insights.md` 7.1): one more closed value for the mode on `language_set` and `pack_download` only, in the Q-004 counsel batch; capture and transcription events move from `model` to `model_tier`, so no model id reveals a language there.
- If the corpus shows Hindi-English fails the bar on device, pm-1 names it as the evidence that triggers pm-5's consented server path (T5-07, BL-304); nothing is built there before that.
- Nothing new leaves the phone; languages are L4 (PRD 7.10).

**Metric.** Gate: code-switched WER, names 95%, phantom words 0 on the golden corpus. In product (through CVL-05): hand-edit rate and "show exactly what I said" rate on Hindi-English letters versus Hindi-only letters; 30-day retention of the mode among authors who choose it; zero "lost words" reports in beta triage.

**Size** L. **Horizon** Now (v1.1).

---

### CVL-02 Native-speaker review of the six language packs

**Problem and evidence**
- [F] In `hi`, `es`, `fr`, `pt`, `ar` and `zh`, the `fillers`, `meaning` (negations, modals, numbers), `repeats` and `phonetic` tables are all `draft` (pack files, 3 Oct). Draft enabling tables are not used, so those letters keep fillers and stumbles: "the honest cost of never reword" (ADR 0014 section 3, Consequences).
- [F] Draft protective tables are loaded, but "missing entries make the engine less protective" (LANG 8 item 2).
- [F] LANG section 8 already defines the checklist and the sign-off (`review.status = native-reviewed`, version bump, re-sign, no app release). Arabic needs one reviewer per dialect family; Portuguese needs Brazil and Portugal (LANG 8; GLOBAL 5.3).
- [F] Open founder question: Chinese keeps its own quotes and ellipsis, which the house text rules ban (LANG 3).
- [A] An English author's letter comes back clean while a Spanish author's keeps every "emm": a visible quality gap for about 30% of families.

**Who and job.** Every non-English author. Job: "a readable letter in my language, with nothing changed that I meant".

**Solution [R]**
1. A paid, time-boxed programme of **13 reviewers**: Hindi 2 (one Hindi-English speaker), Spanish 2 (Latin American, Spain), French 2 (France, Quebec), Portuguese 2 (Brazil, Portugal), Arabic 3 (Gulf, Egyptian, Levantine), Mandarin 2 (Mainland Simplified, Taiwan Traditional).
2. Scope per reviewer: the LANG 8 checklist (fillers, negation and modal tables, kinship and pronouns, repeats, phonetic keys tested on 20 common names from their community), the ADR 0015 seed sentences, prompt translations for CVL-09, and **20 scripted test recordings** in their own voice for CVL-01, CVL-05 and CVL-20 (scripts we write; never their family's real letters).
3. Two-reviewer rule for enabling tables; any entry they disagree on moves to `suggest`.
4. Reviewers see **tables, never user content**. Sign-off is a data change, re-signed and published by the coordinator with the founder's OK (COORDINATION 6). Re-review when a table changes, at least yearly.
5. Later, once true and counsel-cleared: a claim such as "Each language's rules are checked by native speakers" (claims registry, pm-5).

**Competitors.** None publishes native review [U]. Remento covers English and Spanish only (US 3.15).

**Differentiator.** Non-English letters get the same care as English ones, with nothing reworded.

**RICE.** Reach 1,500 (30%) x Impact 2 x Confidence 80% / Effort 2 (coordination, contracts, pack bumps, fuzz runs) = **1,200**. Cost outside effort [E]: 13 reviewers x about 8 hours x $50 to $80 an hour = about $5k to $8k [A on rates].

**Dependencies, legal, privacy.** Founder budget and a contractor agreement (confidentiality, IP assignment, no access to user data). Counsel confirms reviewers are not subprocessors because they touch no personal data [A], and approves a research consent for the scripted recordings (retention, deletion on request, evaluation only, never training). Recordings live in the `experiments` kit, never in Supabase. `npm test -w @scribe/core` fuzz must pass with vetted tables.

**Metric.** Packs with all enabling tables `native-reviewed` (target 6 of 6 by v1.1); `machine_edit_rejected{reason: not_vetted_for_language}` falls to near zero; filler edits applied per non-English spoken letter above zero (via CVL-05); revert rate per edit type in non-English letters no higher than English (via CVL-05).

**Size** M on the calendar, S in engineering. **Horizon** Now: start recruiting in October; tables can land before or after the v1.0 launch because they need no app release.

---

### CVL-03 Names and words that learn from Review, on the phone

**Problem and evidence**
- [F] The bar is names 95% after cleaning (ADR 0012); the prompt carries the family's spellings per chunk under a 200-token cap (ADR 0015 section 3).
- [F] Today the dictionary is built only from the child's name, birthday and "signs as" (`dictionaryFor` in `apps/mobile/src/lib/store.ts`). `DictionaryTerm.heardAs` exists in `packages/core`, and the analytics catalogue already has `dictionary_term_added{source: review_correction}`, but no Review flow writes a taught term.
- [F] In Devanagari, Arabic and Han there is no capital-letter signal for a name, so only taught mishearings may fix names there; नीला ("blue") is also the name Neela (ADR 0014 section 6).
- [F] B-REQ-006 (automatic terms) is P0; B-REQ-017 "say the name three times" is BL-305 in v1.1.
- [F] Untold users praise its "ongoing glossary of people"; the name dictionary is "a visible delight" (US 3.22, 10.10). Wispr learns from edits on its servers, which we cannot copy; an on-device family dictionary is the compatible form (ADJ A4).

**Who and job.** Every spoken author. Job: "Get {child}'s name, Nani's name and our words right, without me retyping them every time."

**Solution [R]**
1. After the author fixes a word by hand in Review, one quiet line: "Remember 'Asha' for next time?" Yes stores the term and the exact heard form (`heardAs`). Copy by the content owner.
2. A Names and words list per book (Settings > Children > {child}'s book): add, remove, see what was taught. Kinds already exist (child, nickname, family, place, word, self).
3. Use: terms go into the recogniser prompt (ranked by kind then recency, under the cap); exact heard forms drive `stt_fix` through `verifyEdits` as visible, undoable edits. If the heard form is itself a common word in that language ("mirror", मेरा), it is **offered as a suggestion, never applied automatically** (the existing `soundAlikeTerms` suggest path).
4. Child-level kinds (child, nickname, family) are shared within the book (BL-178); personal kinds stay with the author.
5. Terms never go to any model provider and are never used for training; they stay L4 (PRD 7.10).

**Competitors.** Untold (cloud glossary), Wispr (learns from edits server-side), Apple `contextualStrings` (on device, no product around it).

**Differentiator.** It learns your family's names on your phone, and every fix it makes stays visible and undoable.

**RICE.** Reach 4,000 (80%) x Impact 1 x Confidence 70% / Effort 2 = **1,400**.

**Dependencies, legal, privacy.** BL-178 (dictionary sync and shared read), BL-305 (shares the store), CVL-02 phonetic tables for non-Latin scripts, content owner. The existing analytics event carries the kind only, never the term.

**Metric.** `machine_edit_reverted{edit_type: stt_fix}` per 100 spoken letters falls; hand corrections of names per 10 letters per author fall over the first month (on device, through CVL-05); taught terms per active family; golden-corpus names at least 95% per language.

**Size** M. **Horizon** Now (v1.1).

---

### CVL-04 "We never make a voice"

**Problem and evidence**
- [F] The FTC warns that a short clip of a family member's voice is enough to clone it for scams; a store of grandparents' and parents' voices is a cloning corpus (ADJ finding 3, A2 [A34]).
- [F] Babytree records a parent's voice and imitates it to tell AI stories (GLOBAL 0.2, [G29]); Forevermore's "Echo" lets users type a message to hear in a dead relative's voice, with one-star reviews when it fails (US 3.18); Heirloom4Life answers "in their own words" (US 3.19).
- [F] "We never rewrite and never synthesise your voice" is unclaimed in every market (GLOBAL 5.2 item 1); research leads asked for it (GLOBAL 6.5, ADJ 6.6).
- [F] The Privacy Policy already says no voiceprints and no training (lines 21, 26, 104, 108, 220), and CR-040 keeps "no voice cloning or voice synthesis without a new legal review and BIPA-grade written consent". No line says we never make a synthetic voice, and the guardrail is a review gate, not a product rule.
- [A] Read together for typed letters will tempt someone to add text-to-speech.

**Who and job.** Every family. Fear 5 in UR ("someone else changing my child's record") applied to voices.

**Solution [R]**
1. **A product rule, proposed for the constitution** (founder approves; coordinator edits CLAUDE.md): "The machine never makes a voice." No text-to-speech of any person, no cloning, no voice conversion, no generated narrator in Read together. Typed letters in Read together show text; VoiceOver stays the reader's own tool.
2. **Processing allowed only if it cannot invent speech.** The AUSoundIsolation listening copy filters a copy and keeps the original (ADR 0015 section 5). Generative speech-enhancement models that resynthesise a voice are banned [U: which open models do this; name them in the denylist when found].
3. **Guardrail (pm-5 enforces):** add speech-synthesis and voice-cloning SDKs and APIs to the CI denylist (BL-117); audio goes to no third party except consented transcription (BL-304).
4. **One calm line** (content owner drafts, counsel and the claims registry approve): for example "Every voice in the book is real. We never make a voice that sounds like anyone." Candidate for the privacy promises and store screenshot 2 (pm-4 decides placement).
5. When an author dies, their recordings and letters stay exactly as they are (ADJ A2 line 6; pm-2 owns the family experience).

**Competitors.** Babytree, Forevermore, Heirloom4Life and Uare.ai synthesise or simulate; HereAfter retrieves real recordings only; Apple Personal Voice is own-voice only (ADJ A2).

**Differentiator.** A promise no competitor makes, backed by a CI rule.

**RICE.** Reach 5,000 x Impact 0.5 x Confidence 80% / Effort 0.5 = **4,000**.

**Dependencies, legal, privacy.** Founder (constitution line), counsel (wording; LEGAL-REQ-019 text), pm-5 (claims registry, denylist), content owner. No data change.

**Metric.** Line live in the Privacy Policy and in-app promises by v1.1; denylist passes in CI; in beta interviews, share of families who recall "never rewrites, never fakes a voice" unprompted; support tags for "read it in my voice" requests (demand we deliberately decline).

**Size** S. **Horizon** Now (v1.1; the line could ride the v1.0 counsel package if counsel agrees).

---

### CVL-05 Accuracy per language without seeing content

**Problem and evidence**
- [F] Founder decision 12 wants a self-learning loop; decision 11 and the Privacy Policy forbid training on letters or recordings.
- [F] The analytics catalogue forbids `lang` on capture and letter events (comment above `language_set`; DEBATES Q-004). Content-free fidelity signals exist (`machine_edit_reverted`, `machine_edit_rejected`, `review_action{show_exactly_said, edit_text}`), but none can be split by language. Side finding for pm-5: `transcription_completed.model = hindi_small` already reveals Hindi on a capture event.
- [F] Six languages run on unreviewed tables and on turbo quality measured only on public read speech (ADR 0015: "Final for each language only after its golden-corpus check"). The golden corpus today is the founder's 14 recordings (BL-043).
- [F] Otter trains on de-identified user audio and faces a class action; Wispr learns from user edits on its servers (ADJ A1, A4).

**Who and job.** The team, so it can decide model swaps and table changes per language; indirectly every non-English author.

**Solution [R]**
1. **Off-product test corpus (Now):** scripted recordings from CVL-02 reviewers and willing beta families under a separate research consent; kept in the `experiments` kit; evaluation only, never training; deleted on request.
2. **On-device fidelity counters (v1.2):** per letter, the phone counts words, words the author changed by hand, machine edits reverted, "show exactly what I said" uses and CVL-06 markers. Raw counts never leave the phone. If analytics is on, one weekly `language_quality_week` event per language used: `lang`, `letters_bucket`, `hand_edit_rate_bucket` (0, under 2%, 2 to 5%, 5 to 15%, over 15%), `revert_rate_bucket`, `gap_rate_bucket`, plus the bucketed counts from part 3. No letter ids, no tie to a single letter's timing. pm-5 chose this opt-in event over a server pipe (a server pipe would still need consent and would see a JWT and an IP), with k = 20 in reports (`05-trust-platform-insights.md` 7.1). It extends Q-004, so counsel decides; **if counsel says no, keep the off-product corpus and drop the per-language split.**
3. **"How did we hear you?" (v1.2):** a rare card after save (at most weekly, never on the first letter, never after a "hard" prompt, skippable): Good, A few words wrong, Many words wrong. No free text, because free text can hold content. Answers are only counted into the weekly event, never sent as a per-letter event, which would tie their timing to a save (pm-5; TRACKING_PLAN 6.4).
4. **Not built:** in-product donation of real letters or recordings, even opt-in (section 5).

**Competitors.** Otter trains on audio; Wispr learns from edits; Rev and Auphonic highlight confidence but do not learn (ADJ A1, A4). None offers content-free quality signals [I].

**Differentiator.** We can improve each language without ever hearing a family.

**RICE.** Reach 4,000 x Impact 0.5 x Confidence 60% / Effort 3 = **400**.

**Dependencies, legal, privacy.** pm-5 owns the pipeline, k-anonymity (k at least 20 per language, small languages merged), DATA_CLASSIFICATION, privacy label and the counsel path (Q-006). Content owner for the card. CVL-06 for gap counts. Signal comes only from consenting users (TRACKING_PLAN assumes 40% [F]).

**Metric.** A weekly per-language view (hand-edit rate, revert rate, gap rate, "many words wrong" share) for every language with at least 20 consenting authors; every model or table change per language cites it in DECISIONS; target [A]: "many words wrong" under 10% per language.

**Size** M. **Horizon** Now (corpus) / Next v1.2 (in product).

---

### CVL-06 Fidelity at the seams: "not written down" markers and tap-to-hear

**Problem and evidence**
- [F] UR R11: "Language-switch segments with low confidence are flagged instead of dropped." Code-switched speech loses words at switches ([S12]).
- [F] ADJ A4 recommendation 4: a quiet underline on low-confidence words; tapping plays that span (Rev, Auphonic). Review today underlines machine edits only (`review.tsx`).
- [F] The pipeline already has voice-activity segments and per-token timings (ADR 0015 section 4; BL-141 `tokenTimestamps` with `maxLen: 1`).
- [F] Lost or silently damaged content is the second-largest complaint theme in the category (US 9, theme 2).

**Who and job.** Every spoken author, most of all code-switching ones. Job: "Show me where you might have missed me, so I can fix it or listen."

**Solution [R]** (all UI; the machine adds nothing to the letter)
1. **"Not written down" marker:** where voice activity found speech [A: 1.5 s or more] but the recogniser returned no words, Review shows a small marker, "A few seconds here weren't written down", with play. The author may type what was said (their own edit) or leave it.
2. **Quiet underline on low-probability words** [E: threshold tuned on the corpus]; tap plays that span. No machine alternatives are offered; the author types if they want.
3. Markers are stored in `stt_meta` (author-only, L4, PRD-REQ-004), shown in "Show exactly what I said", never in the book view or the letter text.
4. Counts feed CVL-05.

**Competitors.** Rev and Auphonic (professional tools). No memory app [I].

**Differentiator.** Instead of quietly dropping words, we show where we may have missed you.

**RICE.** Reach 4,000 x Impact 1 x Confidence 60% / Effort 3 = **800**.

**Dependencies, legal, privacy.** BL-141 timings; whisper.rn exposure of token probabilities [U: confirm in the installed whisper.rn source]; design owner (marker pattern), content owner; most value with CVL-01.

**Metric.** Markers per spoken letter by model (through CVL-05); share of markers the author resolves by typing; "lost words" beta complaints fall to zero.

**Size** M. **Horizon** Now (v1.1, bundled with CVL-01).

---

### CVL-07 Language chip per letter and "Transcribe again as..."

**Problem and evidence**
- [F] Language is a person-wide setting (PRD-REQ-013). Every chunk is decoded with the language set explicitly (ADR 0015).
- [F] ADJ A4 recommendations 1 to 3: language belongs to the author, never the keyboard (Day One's pitfall); a chip in the Listening header switches before speaking; "Heard as Hindi. Wrong language? Transcribe again as..." works because the original audio is untouched (BRIEF 8). Wispr allows one language per dictation and recommends choosing manually.
- [F] UR R12: mixed languages per letter and per author.
- [A] Bilingual households often split by day or by speaker (one parent, one language), so a fixed per-author language mis-hears a share of letters.

**Who and job.** Multilingual authors. Job: "Let me speak whichever language the moment calls for."

**Solution [R]**
1. Up to three spoken languages per author [A], one primary. A chip in the Listening header shows the language for this letter; one tap switches it before speaking. Never switched automatically mid-letter.
2. In Review, before the first save: "Transcribe again as [language]" re-runs from the original audio (downloading the pack if needed; record now, transcribe later).
3. After save, re-transcription needs a data decision because `raw_transcript` is immutable (DATA-REQ-040): either a new entry version with its own raw transcript or no re-transcription after save. Data architect decides; until then, before-save only.

**Competitors.** Day One (keyboard language), Wispr (manual list), Otter (fixed six languages) (ADJ A4).

**Differentiator.** A bilingual home can switch per letter and recover from a wrong choice without re-recording.

**RICE.** Reach 1,500 x Impact 1 x Confidence 70% / Effort 2 = **525**.

**Dependencies, legal, privacy.** Pack download UX (v1.0), data architect (after-save versions), design (chip), `language_set` event already covers added, removed and primary (pm-5 for any new property). pm-2's guest author (FAM-07, v1.1) lets the parent pick the guest speaker's language for that letter with this chip; if the chip slips, a guest letter uses the parent's primary language.

**Metric.** Share of multilingual authors' letters in a non-primary language; "Transcribe again" use and whether the second transcript is kept; wrong-language support tickets near zero.

**Size** M (chip 1 pw, re-transcribe 1 pw). **Horizon** Now for the chip (v1.1, with CVL-01 and FAM-07); Next for "Transcribe again" (v1.2).

---

### CVL-08 Prompts v3: no near repeats, seasonal and opt-in occasion prompts

**Problem and evidence**
- [F] Prompts work when they fit the child's age and can be answered in seconds; Qeepsake reviewers punish repetitive and age-blind prompts (UR finding 3, R8). Rigid prompts with no replacement are complaint theme 13 (US 9). Qeepsake's AI-generated prompts were called "seasonally inappropriate" (US 3.1).
- [F] 103 English prompts; no seasonal kind; `AVOID_RECENT = 10` (`packages/core/src/prompts.ts`). UR R8 asks for no repeat within 12 months.
- [E] A parent writing three letters a week draws about 150 prompts a year from about 48 eligible in band 0 to 3 (10 band prompts plus 38 any-age), so a 12-month no-repeat rule is impossible without about 150 prompts per band. **Challenge to UR R8 [R]:** set the target to no repeat within 90 days and never twice in one month-chapter, and let prompts be optional ("Need an idea?").
- [F] TDD 10 section 2 recommends fewer, better-reviewed prompts for 0 to 12 months.
- [F] pm-4 owns seasonal App Store in-app events that feature these prompts (Q-006).

**Who and job.** Every author facing a blank screen. Job: "Give me something I can answer in a minute tonight."

**Solution [R]**
1. Selector change: per-author exposure history on the device, no repeat within 90 days where the library allows, skip and replace always available.
2. A `seasonal` kind with month windows and neutral wording (for example "What does the light look like outside this month?", "Was there a celebration in your home this month? Tell {child} about it."). Northern hemisphere by default for the US launch; the device region, read on the phone and never sent, flips seasons later.
3. **Occasion prompts only by opt-in.** A "Days we celebrate" list in Settings (Diwali, Eid, Lunar New Year, Christmas, Hanukkah, Thanksgiving, Holi and others), **stored on the device only, never synced, never in analytics**, because a list of celebrations can reveal religion [U: CPRA treats religious beliefs as sensitive]. Never inferred from language or names. Lunar dates arrive as a yearly server content table.
4. Hand-written and reviewed by people (content owner; CVL-02 reviewers for cultural fit). Never generated by AI (section 5).
5. About 40 new prompts for 0 to 12 months, plus firsts and birthday prompt text that pm-3's "A first" occasion and birthday letter use (Q-006).

**Competitors.** Qeepsake (daily SMS prompts, AI-generated since 2026), Juno (hundreds of age-matched prompts), Storyworth and Remento (weekly questions), Apple Journal (reflection prompts), Dearest (gentle prompts) (US, GLOBAL).

**Differentiator.** Hand-written, age- and season-aware, rarely repeating, and never assuming a family's faith.

**RICE.** Reach 4,000 x Impact 0.5 x Confidence 60% / Effort 2 = **600**.

**Dependencies, legal, privacy.** Content owner and counsel's claims check; pm-4 (reminders; seasonal in-app events G-04, which measure religious occasions only on the store side; the website prompt library G-05 reuses this text); pm-2 (shared family prompts FAM-09 reuse the engine and need `family` prompt tags); pm-3 ("A first" and birthday templates use firsts and birthday prompt text); server content pipeline (v1.0). The occasions list is L4 if it ever left the phone; it does not.

**Metric.** Share of letters started from a prompt (`capture_started.prompt_kind` not `none`); skip and replace rate per kind (`prompt_skipped` approved by pm-5 with `prompt_kind` only: no prompt id and no age band, because a band reveals the child's age); repeats within 90 days (device test, target zero); letters in occasion weeks among opted-in authors.

**Size** M. **Horizon** Next (v1.2); prompt text written in the v1.1 window because it ships as server content.

---

### CVL-09 Prompts in the author's spoken language

**Problem and evidence**
- [F] Prompts are English only and no pack carries prompt text, although BRIEF 15 says a pack may hold it. The app interface is English in v1.0 (BRIEF 6); UI localisation is pm-5's (Q-006).
- [F] An Indian parenting-app reviewer asked to "connect with my baby in my mother tongue" (GLOBAL 2.1); grandparents as authors in their own language are missing everywhere (GLOBAL 5.2 item 4).
- [R] Most v1.0 languages gender verbs and adjectives (Hindi गया/गई, Spanish, French, Portuguese, Arabic), which collides with the rule never to gender the child (CLAUDE.md content rules; B-REQ-001 never asks gender).

**Who and job.** Non-English authors, often grandparents. Job: "Ask me in the language I speak to the baby."

**Solution [R]**
1. Prompt text per spoken language as server content, adapted (not literally translated) by CVL-02 reviewers, shown when the letter's language is that language; English fallback.
2. **Gender-neutral constructions only;** where a language cannot ask without gendering the child, that prompt is dropped for that language. No grammatical-gender setting, because that would mean asking for the child's gender.
3. The content rules test must handle non-Latin scripts and the Chinese punctuation question (LANG 3, founder).

**Competitors.** FamilyAlbum, TinyNest and Bebememo localise the interface but have no prompts or transcription in those languages (US 7.1 item 2).

**Differentiator.** A grandmother is asked in her own language, and her answer is kept in her own words and script.

**RICE.** Reach 1,500 x Impact 1 x Confidence 50% / Effort 3 = **250**.

**Dependencies, legal, privacy.** CVL-02, CVL-08, content owner, pm-5 translation workflow, founder (Chinese punctuation).

**Metric.** Prompt-started share of letters in non-English languages versus English; skip rate per language.

**Size** M. **Horizon** Next (v1.3).

---

### CVL-10 One photo with a letter

**Problem and evidence**
- [F] "Photos and short video beside words" is table stakes; "a letters-only book will be compared with photo books" (US 6 item 2). Photos are the most-saved memento (95% of parents of adult children); videos 57% (UR 1.3, [S8]).
- [F] B-REQ-024 (author and child photos) is P1; ROADMAP "Later: photos under per-book keys". The v1.0 app has no photo picker; export already strips EXIF from photos (BL-150).
- [F] Free platform albums are good enough for photo sharing; Early Letters should not compete on photos (US 3.23, 7.1).
- [F] Full photo-library access is a privacy complaint (TinyNest, Google Photos; US 3.5, 9 theme 9). CR-040 extends the no-biometrics guardrail to photos: no face detection, landmarking or recognition, including OS frameworks used for auto-crop.
- [F] Gulf image-privacy norms: a design that works without faces travels best (GLOBAL 4 implication 3).
- [F] UR R10: backdating with photo-date suggestions.

**Who and job.** Parents. Job: "Put the picture with the words, so the letter has its moment."

**Solution [R]**
1. **One photo per letter**, and a photo always belongs to a letter (no photo-only entries), so we stay a letters product.
2. The system photo picker, which needs no photo-library permission [U: confirm the behaviour of the Expo picker on iOS 17 and later].
3. On import: resize [A: longest side 2048 px], strip EXIF including location; read the capture date first, locally, only to suggest the letter's date ("This photo is from 12 March. File the letter then?").
4. No face detection, no face-based crop, no Vision face requests (CR-040); manual crop only.
5. **Free** (pm-4 G-19: one photo with a letter is Free, including reaching the family, because capture is never gated). Stored on the device; reaches the co-parent and family through pm-2's single family media pipeline (FAM-03: audio blobs generalised to media blobs, client-encrypted with the same Standard escrow scheme; Vault grants are pm-5's); layout in the book, PDF and print by pm-3 (above the letter, never cropped by faces, never upscaled).

**Competitors.** Every photo album and baby book (US clusters A, B, D).

**Differentiator.** Parity without becoming a feed: no library access, no faces analysed, words first.

**RICE.** Reach 3,000 (60%) x Impact 1 x Confidence 70% / Effort 4 = **525**.

**Dependencies, legal, privacy.** pm-2 media pipeline (FAM-03); pm-3 layout; pm-4 storage cost (packaging decided: Free); pm-5 data map (photos L4), privacy label (Photos or Videos as User Content), bucket registry for purge (BL-232), CI denylist for face APIs (BL-117).

**Metric.** Share of letters with a photo [A: 30% to 50%]; guardrail: median words in photo letters no more than 30% below other letters; retention of photo users versus others; zero photo-library permission prompts (UI test).

**Size** L. **Horizon** Next (v1.2).

---

### CVL-11 Short video with letters

**Problem and evidence.** [F] Videos are kept by 57% of parents (UR 1.3); The Short Years, Juno and Dots print QR codes that play video (US 3.6, GLOBAL 2.2, 2.3). [F] A PDF cannot play video, printed QR links must last decades, and Dots' broken QR codes drew one-star reviews (GLOBAL 6.3). [E] Video costs tens of megabytes a minute against audio's 0.48 MB (PRD 7.7), across storage, sync, export and the 40 MB app rule for any transcoder.

**Who and job.** Parents who think in clips. Job: "Keep the moment that only moves."

**Solution [R].** Not before photos prove the letter-first pattern. If built: one clip of at most 30 seconds [A] per letter, re-encoded small, still attached to words; the clip's sound is not transcribed as the letter. Packaging is decided (pm-4 G-19): a clip kept on the phone is Free; upload and sharing are Plus.

**Competitors.** Most photo apps; Juno and The Short Years with QR in print.

**Differentiator.** None; parity only.

**RICE.** Reach 1,500 x Impact 0.5 x Confidence 40% / Effort 6 = **50**.

**Dependencies, legal, privacy.** pm-2 pipeline, pm-3 print and QR, pm-4 storage pricing, privacy label.

**Metric.** Not set until scheduled.

**Size** L. **Horizon** Later.

---

### CVL-12 Voice notes into letters: Voice Memos first, then WhatsApp

**Problem and evidence**
- [F] Voice is how families talk on chat apps, but no memory product keeps it: WhatsApp carries about 7 billion voice messages a day; Brazilians send four times more than any other country; 41% of Saudi users chose voice for good news (GLOBAL 0.3, 2.3, 2.6).
- [F] Only 40% of older people in India own a smartphone; grandparents' voices often arrive through someone else's phone (GLOBAL 2.1).
- [F] WhatsApp now transcribes voice messages on the device, but those transcripts are not a keepsake (GLOBAL 2.8, [G95]).
- [F] "Import with original dates" is table stakes: Dearest files imported voicemails on the day they were recorded (US 3.12, 6 item 6). Tiny Treasures runs a family phone line (US 3.11).
- [F] Parents already keep babble in Voice Memos (UR 1.3, [S30b]).
- [F] Grandparent contributors without an iPhone wait for the v1.1 web page (pm-2); the BRIEF limits v1.0 family to the co-parent (decision 5).

**Who and job.** A parent holding their own Voice Memos or a relative's WhatsApp voice note. Jobs 4 and 5 (UR): "let family contribute without me curating everything" and "keep our languages and voices".

**Solution [R]**
- **Phase 1 (v1.2): audio files the phone can already decode.** A share-sheet extension and a Files import for m4a, aac, mp3 and wav (Voice Memos). The extension only copies the file into the app's shared container and opens the app at Review; it does not transcribe [U: extension memory limits]. If the install has not passed the 18+ gate, it says "Open Early Letters first" (the gate stays root-level; TDD 01 R-06). The **original file is kept byte for byte** as the recording; transcription runs on the phone as usual; the letter's date is the file's date when available, otherwise the author picks it.
- **Phase 2 (v1.3): WhatsApp and other Opus voice notes.** Spike first: iOS's own decoder may not read Ogg Opus [U]; the fallback is a decode-only module on libopus and libogg (BSD) [E: about 0.3 MB]. Single files only, never chat exports.
- **Whose voice is it.** The importer chooses "My voice" or "Someone else's voice" and names them. For someone else's voice we use pm-2's guest-author model (agreed with pm-2, `02-family-circle.md` FAM-07): the importer's account is the author of record and may fix machine slips through the normal Review and verifier, never rewording; the letter carries a `spoken_by` label and provenance `import`; the book shows the signature "From Nani" with a quiet line "Shared by Papa" (the same pattern as a guest recording, "Recorded on Papa's phone"); the speaker can claim the letter later through pm-2's copy-and-tombstone move, with raw transcript and capture time unchanged.
- A one-time line at the first import of someone else's voice: "Only add voice notes the speaker would be glad to have in {child}'s book." (content owner; in the spirit of CR-041 and LEGAL-REQ-011's consent guidance).

**Competitors.** Dearest (voicemail import), Tiny Treasures (phone line), Remento (record by link). None turns WhatsApp voice notes into transcribed letters [I].

**Differentiator.** The family voices already on your phone become letters, in their language, transcribed on your phone, with the original kept.

**RICE.** Reach 2,000 (40%) x Impact 2 x Confidence 50% / Effort 4 (both phases) = **500**.

**Dependencies, legal, privacy.** pm-2 (attribution, guest author); counsel (a non-user's voice imported by a user: notice and how that person asks for deletion; the Privacy Policy already covers "other people in recordings" in general [F: CR section 1]); spike on share extensions with the current Expo config tooling [U]; shared-container storage classified L4 (pm-5); the privacy label already declares audio as user content [F: D-032 note]. No new recording, so LEGAL-REQ-011's recording rules are not engaged.

**Metric.** Share of active families importing at least one voice note per quarter; share marked "someone else's voice"; import failures by format (content-free); letters from relatives per family, compared with pm-2's web-page path.

**Size** L. **Horizon** Next (phase 1 v1.2, phase 2 v1.3). First item below the top-10 line.

---

### CVL-13 Quick capture: Siri, App Shortcuts, Control Center and Lock Screen controls, Action button, widget

**Problem and evidence**
- [F] UR R6: "Recording works one-handed and can be started from the lock screen or a widget." UR 1.1: parents holding a contact-napping baby want to do it on the phone ([S29b]). UR JTBD 1: "in under a minute, one-handed, before it's gone".
- [F] こえアルバム has an Apple Watch app and a widget (GLOBAL 2.5); Tiny Treasures records from CarPlay (US 3.11); a Home Screen widget is ADJ pattern 25, buildable with `@bacons/apple-targets` (MIT) [F: ADJ L-targets].
- [F] LEGAL-REQ-011: never record in the background and never auto-start recording. TDD 01 R-06: new entry points (widgets) risk bypassing the 18+ gate. D-025: lock-screen child names off by default.

**Who and job.** Parents with one free hand. Job: "Start before the moment fades."

**Solution [R]** (every surface opens the app to Listening, ready; the person taps record, so LEGAL-REQ-011 holds)
1. App Shortcut with a Siri phrase ("Start a letter in Early Letters"), shown in Spotlight and Shortcuts; the Action button on phones that have one runs the same intent.
2. A Control Center and Lock Screen control "Start a letter" (iOS 18 and later; the app's minimum is iOS 17 per D-040, so older phones simply do not show it).
3. A Home Screen and Lock Screen widget "Start a letter"; it shows "{child} is 7 months today" only if lock-screen names are on (D-025).
4. Every entry lands behind the root 18+ gate, works offline and needs no account.
5. One shared widget extension with pm-3's keepsake widgets (Q-006); whoever ships first sets it up. pm-3 names `expo-widgets` (iOS only, alpha in SDK 57) [U: we did not check it]; `@bacons/apple-targets` (MIT) is the fallback for generating the target (ADJ L-targets). Controls and App Intents may need their own target either way [U].
6. Android parity later: app shortcuts and a Quick Settings tile (BRIEF 13 portability).

**Competitors.** Day One and Apple Journal (widgets), こえアルバム (Watch, widget), Tiny Treasures (CarPlay), Duolingo and Finch (widget promotion).

**Differentiator.** Low; it serves our "a minute is plenty" promise.

**RICE.** Reach 1,500 (30%) x Impact 1 x Confidence 50% / Effort 3 = **250**.

**Dependencies, legal, privacy.** Spike: App Intents and controls through Expo config plugins [U]; design; content; `widget`, `shortcut` and `control` as `capture_started.source` values (approved by pm-5). Widget data in the shared container holds no names unless the toggle is on (L4).

**Metric.** Share of `capture_started` from these sources; time from tap to recording live (PRD 7.1 budget p95 500 ms once on Listening); letters per active week for users with a widget versus matched users.

**Size** M. **Horizon** Next (v1.3). First to promote if C1 beta interviews show capture friction.

---

### CVL-14 Start recording from the lock screen without opening the app

**Problem and evidence.** [U] iOS offers an audio-recording intent that can start recording from a control while showing a Live Activity. [F] LEGAL-REQ-011 forbids background recording "unless iOS background audio is explicitly part of a designed feature reviewed by counsel"; the 18+ gate would have no screen to run on (TDD 01 R-06).

**Who and job.** As CVL-13, one step faster.

**Solution [R].** Only after CVL-13 data shows demand, and only with counsel's review of LEGAL-REQ-011, a visible Live Activity for the whole recording, and the gate satisfied on the install beforehand.

**Competitors.** Voice Memos-style system recorders [I].

**Differentiator.** None.

**RICE.** Reach 750 x Impact 1 x Confidence 30% / Effort 4 = **56**.

**Dependencies, legal, privacy.** Counsel (LEGAL-REQ-011, CR-041), App Review of background audio, crash-safe capture in the background (TDD 03).

**Metric.** Not set.

**Size** L. **Horizon** Later.

---

### CVL-15 Apple Watch capture

**Problem and evidence.** [F] Day One and こえアルバム have Watch apps (US 3.20, GLOBAL 2.5). [F] A Watch app is a separate native watchOS target with its own audio transfer to the phone; Apple-hosted asset packs do not serve watchOS (ADJ A5.1); nothing about it ports to Android (BRIEF 13). [A] Parents of babies who own a Watch and would record on it: about 5%.

**Solution [R].** Not in 1.x. Revisit after Android ships and only if CVL-13 usage shows wrist-first demand.

**RICE.** Reach 250 x Impact 1 x Confidence 30% / Effort 8 = **9**.

**Size** XL. **Horizon** Later.

---

### CVL-16 Language requests, then language #8 and #9 by evidence

**Problem and evidence**
- [F] Adding a language is a pack plus a line in `lang/languages.ts` (ADR 0014 Consequences). The bundled recogniser's language table includes Tagalog, Vietnamese, Korean, Russian, Haitian Creole, Urdu, Tamil, Telugu, Bengali, Marathi, Punjabi, Gujarati and Cantonese (`node_modules/whisper.rn/cpp/whisper.cpp`), but quality per language is unmeasured [U].
- [F] The store is US-only (LEGAL-REQ-058). [U, general knowledge, census tables not opened] After Spanish and Chinese, large US home languages include Tagalog, Vietnamese, Arabic, French, Korean, Russian, Portuguese, Haitian Creole and Hindi. So "Indian regional languages next" is not obviously right for a US app.
- [F] Any new script needs fonts in the app (fonts are subset to the glyphs we use, BRIEF 15) and in the PDF (pm-3).

**Who and job.** Families whose language is missing. Job: "Let me speak to my child in our language."

**Solution [R]**
1. **Intake (v1.2, S):** "My language isn't here" in the language picker, choosing from a closed list of about 40 languages (no free text). Agreed with pm-5: this is a message the person chooses to send, not analytics; a `request_language(code)` RPC increments `language_requests(week, lang, count)` with no person id, published only at 10 or more through an insights view (counsel confirms no analytics consent is needed).
2. **A language ships when all three hold:** at least 50 requesting families [A]; turbo or a permissive model passes the golden corpus (names 95%, script 95%, zero phantom words); two native reviewers signed (CVL-02). System fonts in the app for new scripts; embedded fonts only in the PDF.
3. First candidates to test [A]: Tagalog, Vietnamese, Korean, Cantonese (CVL-17), Urdu, Gujarati, Bengali, Tamil, Russian.

**Competitors.** TinyNest (31 UI languages), Day One (26), but no speech in those languages (US 7.1 item 2).

**Differentiator.** We add a language only when it can be written faithfully.

**RICE.** Per language: Reach 250 x Impact 2 x Confidence 40% / Effort 4 = **50**. Intake: S.

**Dependencies, legal, privacy.** pm-5 (the RPC and view, `LANG` closed list), pm-4 (market order), pm-3 (an open-licence print font for each new script in BK-13's font packs before its letters can be printed), CVL-02, CVL-05.

**Metric.** Requests per language per quarter; after launch, letters per family in the new language and its CVL-05 rates.

**Size** S (intake) plus L per language. **Horizon** Next (intake v1.2) / Later (languages).

---

### CVL-17 Cantonese

**Problem and evidence.** [F] Hong Kong has 44.3% iOS share and "Cantonese is not covered" (GLOBAL 1, 5.3). [F] The recogniser lists `yue` (whisper.rn's whisper.cpp table). [U] Turbo's Cantonese quality. [R] Constitution trap: spoken Cantonese is written with its own characters (嘅, 咗, 唔, 係); converting it to Standard Written Chinese would be rewording, exactly like normalising an Arabic dialect to Modern Standard Arabic (ADR 0014 section 7). Traditional script by default.

**Solution [R].** Through the CVL-16 gate; colloquial characters kept as spoken; never converted to Standard Written Chinese.

**RICE.** Reach 100 (2%, A) x Impact 2 x Confidence 40% / Effort 4 = **20**.

**Size** L. **Horizon** Later.

---

### CVL-18 Indian regional languages (Tamil, Telugu, Bengali, Marathi, Gujarati, Punjabi, Urdu)

**Problem and evidence.** [F] The strongest Indic models (AI4Bharat IndicConformer, MIT; ARTPARK) need a second runtime in the app (NeMo or sherpa-onnx), which costs binary size and maintenance; they are on ADR 0015's watch list. [F] India's iOS share is 6.1%; diaspora families come first (GLOBAL 5.4). [U] Whisper quality on these languages is weak. Urdu brings Nastaliq script and right-to-left layout [U on font rendering].

**Solution [R].** Not in 1.x unless a permissive model runs in whisper.rn and passes the CVL-16 gate. Revisit when Android ships (pm-5) and if requests justify it.

**RICE.** Reach 150 (3%, A) x Impact 2 x Confidence 25% / Effort 10 = **8**.

**Size** XL. **Horizon** Later.

---

### CVL-19 The child's own voice, designed for COPPA

**Problem and evidence**
- [F] 13 `together` prompts ("Sing {child} the song you sing most. Let the recording catch the coos.") and "Write one together" are behind the `child-input` flag, off in production until counsel's written COPPA opinion is linked (PRD-REQ-005, K-19, LEGAL-REQ-059, BL-119).
- [F] A child's voice in an audio file is personal information under COPPA; the amended rule adds biometric identifiers including voiceprints; whether a toddler's voice inside a parent's recording is collection "from a child" is an open counsel question (CR-001; compliance register questions 2 and 15).
- [F] Demand: こえアルバム (one-tap child voice), こどもことば (a book of a child's words), Tiny Voices (one-tap child recording) (GLOBAL 2.5, US 3.13); a father records his toddler's babble in Voice Memos (UR [S30b]).

**Who and job.** Parents of babies and toddlers. Job: "Keep how {child} sounded at nine months."

**Solution [R]** (designed so counsel's answer can be yes)
1. **Parent role only**, never contributors: COPPA consent comes from a parent, and a grandparent is not one [U: counsel confirms].
2. Parent-initiated, parent-held phone, tap to record, at most 60 seconds [A]. No child-facing screen, no "let them record", no child mode, no rewards; store and marketing copy never addresses children (K-20).
3. A **"sound" moment is audio only:** the child's speech is not transcribed (nothing to transcribe at this age, and nothing to process). The parent may add a caption in their own words.
4. Stays on the phone and in export; joins the shared book only if the parent chooses so for that sound, through pm-2's pipeline; never to any third party; no analysis of any kind (no voiceprint, emotion or age estimation).
5. Bands 0 to 60 months only [A].
6. Deletion follows DATA-REQ-015 with no exception (agreed with pm-2): the recording parent is the author and can delete; the other parent can hide a sound for themselves (pm-2 FAM-11 per-reader hide) and ask the author. A cross-parent delete would become a weapon in a separation. Whether a child's data rights require more is a counsel question, listed in pm-2's file.
7. The flag stays off until counsel's written opinion is linked (LEGAL-REQ-059).

**Competitors.** こえアルバム (AI transcript and AI titles; its privacy label lists audio under a third-party advertising purpose, GLOBAL 2.5), Tiny Voices, こどもことば, Babytree read-aloud recordings.

**Differentiator.** The child's real sounds, kept privately by the parent and never analysed.

**RICE.** Reach 2,000 (40%) x Impact 2 x Confidence 30% (counsel decides) / Effort 4 = **300**.

**Dependencies, legal, privacy.** Counsel (ask now: CR-001 questions with this parent-only design); pm-5 COPPA mechanics; pm-2 (sharing, deletion); pm-3 (how a sound shows in the book and Read together); content; no analytics on child-facing playback (CR-001 mitigation (e)).

**Metric.** Parents recording at least one sound per month; share of sounds shared to the book; audit: zero child-facing surfaces.

**Size** L. **Horizon** Next (v1.3) only if counsel clears it in time for v1.3 planning; the counsel request is Now.

---

### CVL-20 Word timings good enough for Read together highlight, per language

**Problem and evidence**
- [F] Word highlighting in Read together is deferred to v1.1 (BRIEF 9). pm-3 owns the highlight UX and its fallback; word timings and their quality are pm-1's (Q-006).
- [F] ADR 0009: raw word timings go in `stt_meta.words` and are projected through accepted edits; low-quality timing falls back to sentence-level highlight; server re-alignment only with consent. whisper.cpp word timestamps are "experimental" with unresolved timing reports.
- [F] TDD 10 contradiction 12: words built from segments would highlight whole segments; BL-141 uses `maxLen: 1` per-token timestamps merged into words.
- [F] Chinese is tokenized per character (ADR 0014 section 5); Devanagari words include combining marks.

**Who and job.** Families using Read together. Job: "Follow the words while we hear their voice."

**Solution [R]**
1. Measure timing quality per language and model on the golden corpus: share of words whose highlight starts within [A] 150 ms of the spoken word.
2. Per-script word assembly rules (marks stay with their letters; Han per character; Arabic right to left).
3. Use ADR 0009's quality gate per letter; ship word highlight per language only where it passes, sentence-level elsewhere. No server re-alignment in 1.x unless pm-5's consented gateway exists and a language fails the bar.
4. **What syncs (answer to pm-5 T5-09 and pm-3):** other members get only `entries.alignment` (word timings already projected onto `final_text`, BL-144), which is all Read together needs on their phones. The author's own devices get compact word-level timings (not per-token JSON), because re-projecting after an edit on another device and the CVL-06 markers need them. Per-token data stays on the recording phone and in export. This lets pm-5 drop the per-token `stt_meta` growth (TDD 06 3.4) without breaking Read together.

**Competitors.** DearBaby plays twelve months of voice back to back with no text; Remento plays chapters from QR codes (US 7.1 item 3).

**Differentiator.** Highlighting that is honest: words where timing is good, sentences where it is not.

**RICE.** Reach 2,000 (40% use Read together, A) x Impact 1 x Confidence 60% / Effort 3 = **400**. In the top 10 as a dependency of a founder-committed v1.1 feature.

**Dependencies, legal, privacy.** BL-141, BL-144 and BL-145 (alignment column and projection), CVL-02 test recordings, pm-3 UX (BK-01), pm-2 FAM-03 (playback of others' voices), pm-5 T5-09 (the sync change in one migration) and T5-07 only if re-alignment is ever needed. `stt_meta` is author-only (PRD-REQ-004), but word timings must stay readable for Read together (K-09 note).

**Metric.** Per language, share of letters with alignment quality not "low"; timing error distribution on the corpus; Read together sessions that fall back to sentence level.

**Size** M. **Horizon** Now (v1.1).

---

### Also considered (folded or decided elsewhere)

| Idea | Where it went | Why |
|---|---|---|
| iOS Writing Tools can rewrite typed letters; React Native exposes no prop to limit it (ADJ finding 12) | Founder question in section 7 | It is the person's own system tool, like autocorrect (BRIEF 7); we add no AI of our own. Recommendation: leave it, never promote it |
| Consented cloud transcription for slow phones or Hinglish (BL-304) | pm-5 (Q-006) | pm-5 gates it on pm-1 naming a language that fails the on-device bar; none named yet |
| Backdating letters to a past month (UR R10) | Inside CVL-10 and CVL-12 (date suggestions) | Photo and voice-note dates are the natural trigger |
| Hindi invite messages and web page (BL-301) | pm-2; wording through CVL-02 | Family surface |
| Transcription queue accepts web-origin audio and writes the raw transcript once under the family member's id | Delivered by pm-1 inside pm-2's FAM-05 web contribution page (scored there) | B F6.7 design; the parent's phone must not keep or show it after upload (K-09) |
| Listening copy for a downloaded recording | Rebuilt on the receiving phone from the original, never uploaded (agreed with pm-2, FAM-03) | Same AUSoundIsolation path as ADR 0015; no new code beyond running it on downloaded audio |
| Speech models on Android phones (device matrix, tiers, Hindi and Portuguese on mid-range devices) | Delivered by pm-1 inside pm-5's T5-16 Android item (scored there) | whisper.rn runs on Android [U: performance]; the model tiers in ADR 0015 need an Android memory rule |

---

## 4. Release plan and capacity (v1.1 to v1.3)

| Release [A dates] | Items | Effort (pw) | Notes |
|---|---|---|---|
| **v1.1** (about Jan 2027) | CVL-04, CVL-03, CVL-01 with CVL-06 (one bundle), CVL-20, CVL-07 chip; CVL-02 lands as data whenever reviewers sign | 15.5 + reviewer cost | Above the 10 to 14 pw assumption. Cut order if short: CVL-20 per language to sentence-level highlight (ADR 0009; pm-3's call), then the CVL-07 chip (guest letters use the primary language), then CVL-03's Names and words screen (keep the Review line). CVL-01 and CVL-06 ship together or slip together |
| **v1.2** (about Mar 2027) | CVL-05 in-product, CVL-08, CVL-07 "Transcribe again", CVL-10; CVL-12 phase 1 and CVL-16 intake if capacity allows | 10 (+3) | CVL-10 waits for pm-2's v1.1 upload pipeline |
| **v1.3** (about May 2027) | CVL-12 phase 2, CVL-13, CVL-09; CVL-19 only if counsel cleared it | 8 to 12 | CVL-13 moves up if beta shows capture friction |

**Start now (no release needed):** recruit CVL-02 reviewers; write the scripted test corpus (CVL-05, CVL-20); send counsel the CVL-19, CVL-12, CVL-04 and CVL-01 questions; draft the CVL-04 line.

**What would change the ranking.** The D-031 experiment shows Roman Hinglish works on turbo (CVL-01 effort halves). Beta shows capture friction rather than accuracy pain (CVL-13 up, CVL-06 down). Counsel says yes to CVL-19 quickly (moves to v1.2). Server aggregates show non-English families are well under 30% (CVL-02, CVL-07, CVL-09 down).

---

## 5. Will not build

| We will not | Why |
|---|---|
| Make any synthetic voice: cloning, text-to-speech in a family member's voice, voice conversion, an AI narrator for Read together, "finish this letter in Nani's voice", generative speech enhancement | CVL-04; FTC cloning warning; CR-040; the voice is the treasure |
| Build a conversational avatar of a family member, living or dead | ADJ A2 lines 2 and 6; HereAfter shows real recordings meet the need |
| Identify speakers, diarize, make voiceprints, or detect emotion or age from a voice | CR-040 (BIPA, CUBI, MHMDA); Privacy Policy section 13 |
| Train or fine-tune any model on letters, recordings, transcripts or users' corrections, including "learning from your edits" on a server | BRIEF 11; Privacy Policy; Otter's class action (ADJ A1) |
| Ask families to donate real letters or recordings to improve models, even opt-in, in 1.x | Contradicts the no-training promise in spirit; evaluation uses scripted, paid, consented recordings outside the product (CVL-05) |
| Translate letters, stored or shown as the letter | Translation puts words in someone's mouth; the constitution allows removing and repairing only. A family member may write their own translation as their own letter |
| Transliterate a letter after the fact (Devanagari to Roman or back) as an edit | Not a letter-for-letter mapping (ADR 0014 section 4); script comes from the recogniser (CVL-01) |
| Normalise dialects or registers: Arabic dialects to Modern Standard Arabic, written Cantonese to Standard Written Chinese, Hinglish to "proper" Hindi or English, Brazilian to European Portuguese | Rewording (ADR 0014 section 7) |
| Auto-detect the language and switch silently mid-letter | Wrong-language flips lose words; one explicit language per letter (ADR 0015; CVL-07) |
| Record in the background, auto-start, listen for a wake word, or market "capture conversations" | LEGAL-REQ-011; CR-041 |
| Import whole chat exports (WhatsApp or other) | They hold other people's messages; single files only (CVL-12) |
| Generate prompts with AI, or infer prompts from letter content | Qeepsake backlash (US 3.1); content analysis would contradict the privacy posture |
| Infer religion, culture or occasions from language, names or letters | Sensitive-data risk; occasions are opt-in and on the device only (CVL-08) |
| Ask for the child's gender to localise prompts | B-REQ-001; content rules; drop the prompt instead (CVL-09) |
| Detect faces, auto-crop by face, or ask for full photo-library access | CR-040 photo guardrail; complaint theme 9 (US) |
| Photo-only or video-only entries | Keeps us a letters product (US 7.1) |
| Server transcription as the default for any language | On-device by default (PRD K-21); BL-304 stays a consented, announced exception (pm-5) |
| A second speech runtime in the app in 1.x | Size and maintenance (BRIEF 1, 15); revisit with CVL-18 |
| An Apple Watch app in 1.x | CVL-15 |

---

## 6. Ownership and overlaps (DEBATES Q-006)

Scored here, cited elsewhere: photos picked at capture (layout pm-3, upload pm-2); voice-note import (attribution pm-2; bulk import of other apps' exports pm-5); quick-capture surfaces including the capture widget (keepsake widgets pm-3, one shared extension; widget promotion pm-4); accuracy feedback (pipeline, k-anonymity, classification, label and counsel path pm-5); "we never make a voice" (claims wording and denylist enforcement pm-5); the child's own voice (sibling letters pm-2, COPPA mechanics pm-5); word timings (highlight UX and fallback pm-3); prompt text and selection (shared family prompts pm-2, in-app events and reminder cadence pm-4, "A first" and birthday artefacts pm-3); spoken languages and packs (UI localisation pm-5, store listings and market order pm-4). Cited from others, not scored here: shared-voice upload pipeline (pm-2), BL-304 server transcription (pm-5), Android (pm-5), Read together UX (pm-3).

---

## 7. Asks

**Founder**
1. Approve the CVL-02 reviewer budget (about $5k to $8k, E) and a contractor template; approve a research consent for scripted test recordings.
2. Decide the constitution line "The machine never makes a voice" (CVL-04).
3. D-031 by 30 Oct (unchanged); it sets CVL-01's default.
4. Chinese punctuation question in LANG 3 (affects CVL-02 and CVL-09).
5. iOS Writing Tools in letter fields: recommendation is to leave the system default.
6. Allow opt-in, device-only occasion prompts (CVL-08), or keep season-only prompts.

**Counsel** (all six are in pm-5's counsel batch): training-data terms for the Hinglish fine-tunes (CVL-01); COPPA opinion on the parent-only "sounds" design (CVL-19); a non-user's voice note imported by a user (CVL-12); per-language quality signal versus Q-004 (CVL-05); wording of the no-synthetic-voice line (CVL-04); whether CVL-02 reviewers count as processors.

**pm-2:** agreed on 3 Oct (pm-2 section 8): imported voice notes use FAM-07 attribution ("From Nani", "Shared by Papa"); photos ride the FAM-03 media pipeline; a child's sounds follow DATA-REQ-015 with per-reader hide (FAM-11). Remaining: the counsel question on a child's data rights.
**pm-3:** photo and sound rendering in the book, PDF and print; Read together never uses text-to-speech; PDF fonts for new scripts.
**pm-4:** photo allowance in Free versus Plus; widget promotion; seasonal in-app events.
**pm-5:** answered on 3 Oct (`05-trust-platform-insights.md` 7.1): CVL-05 uses the opt-in weekly event with k = 20, counsel decides; `model` becomes `model_tier` on capture and transcription events (request to the analytics owner); the Hindi-English value joins the Q-004 batch; `capture_started.source` values and `prompt_skipped` (kind only) approved; denylist entries in T5-08; CVL-16 intake is a `request_language` RPC, not analytics. Our answer to pm-5's T5-09 is in CVL-20 item 4.
**Design and content owners:** language chip, "not written down" marker, "Remember this name?" line, sounds moment, the CVL-04 line.

---

## 8. Facts and assumptions register (what the ranking rests on)

| Kind | Statement | Effect if wrong |
|---|---|---|
| F | All six downloadable packs' word tables are draft (pack files) | CVL-02 would drop out |
| F | No Review flow teaches names today (`review.tsx`, `store.ts`) | CVL-03 effort halves |
| F | `lang` is never on capture events (catalog, Q-004) | CVL-05 shrinks to a dashboard |
| F | Prompt repeat guard is 10 prompts; 103 English prompts; no seasonal kind | CVL-08 changes shape |
| F | No photo picker in v1.0; export already strips EXIF | CVL-10 effort |
| A | 5,000 active families per quarter; segment shares in section 1 | Ranking holds unless shares change |
| A | 15% Hindi, 30% non-English families in a US launch | CVL-01, -02, -07, -09 move together |
| A | 10 to 14 pw per release for this theme | Section 4 moves by a release |
| E | Reviewer cost $5k to $8k; Opus decoder about 0.3 MB; video tens of MB per minute | Budget and size only |
| U | Expo config support for App Intents, controls and share extensions; iOS decoding of Ogg Opus; token probabilities from whisper.rn; picker without library permission; turbo quality on Cantonese and Indic languages; US home-language ranking | Each is a spike or a check before the item starts |
