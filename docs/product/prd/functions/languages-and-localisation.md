# Function review: languages and localisation (LOC)

Owner: `speech` and `content` for the work, Karma for the rulings. Second-wave review, written 20 Nov 2026 (UTC) under `docs/product/prd/functions/BRIEF.md`, branch `docs/locked-pack-inputs-20nov`, head `3eb8a9d02`. Docs only: nothing here is built, no string is live, no decision is recorded.

The person writing this is a Claude role. It is not a lawyer, a linguist or a licensed translator. Every legal reading says "counsel must confirm". No sentence here is product copy; words a parent would read are quoted as intent, `content` writes them and the founder approves them. The fictional family Asha is the only family named.

---

## 1. What I reviewed, and what I did not

### Read this session (repo, head `3eb8a9d02`)

| Source | What I took from it |
|---|---|
| `functions/BRIEF.md`, `functions/support.md` (sections 1 to 3), `18-errata-after-lock.md` (E7, E10 to E12), `00-product-frame.md` (grep) | Format, FR ids, errata that touch scripts and code points |
| `09-capture.md` NS-17 (lines 773 to 920, in full) | The language card: gate, mark control, D10, flags, cost line 922 |
| `19-from-download-to-first-letter.md` (grep: lines 103, 125, 269, 1098 to 1211, 1233, 1516, 1700) | First run is English UI, language row only in multi-language builds (NS-43-R11) |
| `10-reading-and-family.md`, `01-photo-with-a-letter.md`, `07-remaining-capability-rows.md` (grep and C28 section 4, line 265) | "Multilingual" scenario rows, grapheme cuts, mixed scripts in the PDF |
| `14-test-plan.md` (J-N16, J-N23), `16-council-review-round-2.md` (D10) | Tests that exist on paper |
| Function reviews: `finance.md` (lines 64, 99 to 113, 165, 211), `legal.md` (FR-LEG-12, 13), `marketing.md` (FR-MKT-28), `compliance.md` (NS-17 rows), `privacy.md` (FR-PRV-19), `data-and-measurement.md` (FR-DAT-23) | Adjacent requirements I point to and do not repeat |
| `packages/core/src/lang/languages.ts` (whole), `packages/core/src/age.ts` (whole), `packages/core/src/safety.ts` (lines 1 to 30) | Seven language entries, Gregorian-only age math, English-only distress patterns |
| `packages/content/src/prompts.ts` (header, band counts), `features/language.en.ts` (lines 1 to 60), `helplines.ts` (header), `test/rules.test.ts` (grep) | 115 prompts, English only |
| `apps/mobile/src/lib/dates.ts` (lines 1 to 60), `lib/capabilities.ts` (lines 60 to 110), `lib/export/build.logic.ts` (grep) | Date locale fallback; flags; `dir="auto"` in the export |
| `packs/text-rules/*.json` (header, `house`, `status` keys) | All non-English word tables are `draft`; English is `native-reviewed` |
| `experiments/README.md` (sections 1 to 7.4), `experiments/gate-lib.ts` (lines 60 to 135) | The language gate and its bars |
| `docs/prd/v2/features/F05-transcription.md` (grep; sections 7.1 and 7.8 and rows F05-U15 to U38), `F30-later.md` F33 | Code-switching, one language per letter at 1.0 |
| `docs/DECISIONS.md` (D-031 line 37, D-056, D-121, D-125), `docs/adr/0015-per-language-speech-models.md` (grep) | Staging; Hindi has its own model |
| `docs/ops/runbooks/speech-models-on-r2.md`, `docs/ops/PACKS_HOSTING.md` (grep: sizes, R2 prices) | Hosting facts |
| `docs/store/listing/localisation.md` (whole), `docs/store/app-store.md:112` | Draft translations, all unreviewed |
| `docs/legal/terms-of-service.md:198`, `POLICY_VERSIONING.md:64,72`, `COUNSEL_PACKET.md` (Q6, Q7, Q9, Q11, Q12), `data-policy.md` and `DATA_CLASSIFICATION.md` (language rows) | English controls; translations share a version; language is sensitive |
| Design (`git show origin/docs/e2e-ux-20nov:...DESIGN.md`, areas A to E, grep for language, RTL and Devanagari) | Screen ids below |
| `docs/qa/evidence/` (listing) | Holds `README.md` and `TEMPLATE.md` only: no language gate evidence exists on this branch |

### Outside sources read this session (20 Nov 2026)

| Fact | Source |
|---|---|
| App Store Connect lists these metadata localisations (among others): Arabic, Chinese (Simplified), Chinese (Traditional), French, French (Canada), Hindi, Portuguese (Brazil), Portuguese (Portugal), Spanish (Mexico), Spanish (Spain). The language a customer sees "could be impacted by" their App Store language, device language, the languages you added and your primary language | https://developer.apple.com/help/app-store-connect/reference/app-store-localizations/ |
| `Intl.DateTimeFormat` accepts a `calendar` option (examples "chinese", "gregory", "persian"; the default is locale dependent) and the `ca` extension key in the locale tag; the page does not list which calendars a given runtime supports | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat |

### Not reviewed, not run

- **The `languages-build12` proposal.** I have no Projects tool in this session and no copy of it exists on disk (a filesystem search found none). Anything it says that differs from this file wins until Karma reconciles; I could not check.
- `GAP-LOG.md` and `README.md` were read by grep for language lines only (X CS-1, A G-05, G-06, G-21, Foundations Q3), not in full.
- I did not open ADRs 0012, 0014, 0016 beyond grep, the F21 store spec, the web app, any e2e WORDS file, or the pack tables beyond headers. `fr.json` and `pt.json` `draft` markers were seen in grep only.
- I ran no test, no gate, no recording, nothing on a phone. Every "built" below is "read in code", not "observed".
- UNVERIFIED (no source read): whether Hermes on iOS ships `Intl` calendars, numbering systems and `Intl.Segmenter`; whether Apple Review treats downloaded language data packs as code (guideline 2.5.2); the CLDR plural categories for each language; any competitor's language support beyond what F05 section 3 already cites.
- Claude roles are not licensed professionals. No language is judged "good" here; only a native reviewer and the gate can say that.

---

## 2. Coverage check: what the repo and cards already say

| Topic | What exists (file and line read this session) | Verdict |
|---|---|---|
| Seven languages in the engine | `languages.ts:39-130`: en, hi, es, zh (Hans and Hant), fr, ar (rtl), pt (BR and PT regions). Names in their own script, aliases, sentence enders | Built (data) |
| Staging | D-056 set seven at v1.0 (`DECISIONS.md:348`); D-121 made the first store build English only; D-125 item 2: one language at a time, each in the release whose listing names it (`capabilities.ts:84-86`) | Ruled |
| Gate and bars | `gate-lib.ts:86-94`: WER 10% (en, es, fr, pt), CER 10% (zh), WER 15% (hi), WER 20% (ar), names 95%, 0 phantom words, p90 30 s on 30 device runs. Sample: 10 speakers, 40 clips (`gate-lib.ts:122`, README 7.1) | Built (tool); no run on disk |
| Native sign-off | README 7.0: every non-English pack is a draft, so `pack_signoff` is open until a native reviewer's file `docs/qa/evidence/F05-pack-<lang>-<version>.md` exists. Pack headers: `en` is `native-reviewed`, `ar`, `es`, `hi`, `zh`, `pt`, `fr` carry `draft` tables | Not started |
| Language card | NS-17-R1 to R10 (`09-capture.md:839-848`): ungated language absent, no translation, listing names shipped languages, one-tap mark, chosen language never detected | Specified |
| Mixed-language speech | One language per letter at 1.0, Hindi-English mode v1.1 (F05 7.8, F33). NS-17 section 5 says "kept as spoken; where the model cannot write a stretch ... the page says the words are not written there" (`09-capture.md:801`) | Conflict, see FR-LOC-08 |
| UI language | English at 1.0 (D-056 "UI in English, ready for localisation"; `dates.ts:3-5`); Hindi UI is BL-321 (`BACKLOG.md:879`), v1.2 or later (`localisation.md:5`) | Ruled, no structure for it yet |
| Dates | `dates.ts:25-43`: non-English device locale falls back to en-GB; the locale's own calendar is not pinned. `age.ts`: Gregorian calendar-month age, English words and English month names hardcoded (`age.ts:51-52,60-79`) | Partly |
| Scripts on screen | Bundled fonts: Mukta, Literata, Tiro Devanagari Hindi (`fonts/index.ts:12-19`). Arabic and Chinese faces (Amiri, Noto Serif SC) exist only under `apps/web` (`legal.md` FR-LEG-12). Letter direction by `isRtl` (`excerpt-fade.logic.ts:49`) | Partly |
| Scripts in the export | `dir="auto"` on paragraphs, headings and signature (`build.logic.ts:376,425,433`); file names keep every script (`:183`); the printable PDF "each script in an embedded licensed font; no missing-glyph boxes" (C28-13, `07-remaining-capability-rows.md:265`); the HTML font stack is system serif (`build.logic.ts:380`) | Specified, not built |
| Names and fields in any script | NS-43-R4, errata E10 to E12 (code points versus graphemes) | Covered |
| RTL | NS-17 section 15 "reviewed by a native-script reviewer before unlock"; D-S02 `.rtl`, B `.rtlLabel` and `.rtlRow`; no iOS RTL setting found in `app.config.ts` (grep for `supportsRTL`, `I18nManager`, `CFBundleLocalizations` found none in `apps/mobile`) | Partly |
| Store listing | `localisation.md`: en-US only at 1.0; six drafts "need native review"; NS-17-R4, FR-MKT-28 | Covered for 1.0, drafts unreviewed |
| Legal | `terms-of-service.md:198`: "If we translate these Terms, the English version controls unless your local law says otherwise"; `POLICY_VERSIONING.md:72`: translations (en-IN, "Hindi later") share the English version, per-locale hashes | Partly |
| Content rules | `rules.test.ts` is English and reads `packages/content` only | Missing for other languages |
| Prompts | `prompts.ts`: 115 prompts (38 any-age, 12 before-birth, 65 in eight age bands), `PROMPT_LIBRARY_VERSION = 4`, English, `{child}` placeholder. `CLAUDE.md` still says 111 | English only |
| Distress patterns | `safety.ts:16-30`: English regular expressions only; header says "PENDING PERINATAL CLINICIAN REVIEW" | English only, see FR-LOC-18 |
| Cost | Reviewer about $1,000 to $1,500 per language [E] (`09-capture.md:922`, `finance.md:64,165`); R2 within free tier (`finance.md` FR-FIN-08) | Partly (see section 3.4) |

### Coverage verdict per card (languages view)

| Card | Verdict | Why |
|---|---|---|
| NS-01 Photo with a letter | covered | R54 grapheme caps and Devanagari fixtures; photo words in any script |
| NS-05 Share one letter | partly | `.rtl` state in D-S02; the wrapper line (date, signature) language is English, no rule says so |
| NS-07 C28 printable book | partly | C28-13 names licensed fonts per script; no fixture per script and no font choice for Arabic or Chinese in the app |
| NS-10 New phone | partly | Spoken-language setting and downloaded packs do not travel with the account (`data-policy.md:138`); the new phone must ask again |
| NS-16 Someone else speaks | covered | From name counts code points (E10) |
| NS-17 Second language | partly | Strong on withholding and no-translation; missing the per-language dossier, safety patterns, prompts, listing, legal, cost, RTL and script tests (below) |
| NS-23 One past letter | covered | Verbatim prefix by grapheme, never on a virama (R2) |
| NS-24 Read the year back | partly | Year labels "from `Intl.DateTimeFormat`" with no calendar pinned (FR-LOC-11) |
| NS-33 Accessibility | partly | Bold Text in Devanagari ruled (Foundations Q3); VoiceOver reading a letter in a language other than the phone's is named only for NS-23-R7 |
| NS-36 Data follows the letter | covered | Withheld takes export as audio, no words |
| NS-38 Store page | partly | "Devanagari, RTL: the listing names only languages the build transcribes" (line 103); no per-locale plan |
| NS-39 to NS-43 First run | covered | English UI, language row hidden in an English-only build (NS-43-R11) |
| NS-44, NS-45 | not read | Not reviewed for this area |
| NS-02, 03, 04, 06, 08, 09, 11 to 15, 18 to 22, 25 to 32, 34, 35, 37 | n/a | No language surface beyond the "Multilingual" scenario row each card already carries |

---

## 3. What is MISSING for a launch-ready, customer-first product

1. **One definition of "offered".** Four things must be true before a language is real for a parent: its gate passed, a native reviewer signed its pack, its model and data have a licence record, and its listing text is reviewed. Today they live in four places (`gate-lib.ts`, `speech` evidence, `legal.md` FR-LEG-13, `localisation.md`). Nothing joins them, so a language could unlock with three of four.
2. **No evidence on disk.** `docs/qa/evidence/` has no `F05-gate-<lang>.md` and no `F05-pack-<lang>-<version>.md`. The only per-language tests are unit tests of the engine (`lang.languages.test.ts`, `regression/{ar,es,fr,hi,pt,zh,en}.test.ts`, golden cases en 31, hi 17, hinglish 10, nfd 8). None proves a person's speech was heard well.
3. **Distress detection is English only.** A parent who speaks Hindi or Spanish and writes a hard letter gets no tier. If we ever say or imply we notice, that is a false promise in every other language.
4. **Content rules cannot be applied unchanged in another language.** The rules test bans dashes, curly quotes and ellipsis characters. French uses guillemets and non-breaking spaces, Spanish uses opening question and exclamation marks, Hindi uses the danda, Chinese uses full-width marks, Arabic uses its own comma. "No fear words", "never imply AI writes", and "never gender the child" need a banned-phrase list per language written by a native reviewer. In Hindi, Spanish, French, Portuguese and Arabic, verbs, adjectives and the word for child often carry gender: `{child}` alone does not make a sentence neutral (the Hindi and Arabic drafts in `localisation.md` already say reviewers must "try neutral phrasing").
5. **Prompts are English, 115 not 111, and have no translation rule.** A literal translation of an English prompt is not a prompt. Cultural fit matters ("Who came to meet {child} this week?" assumes visits).
6. **Dates can shift calendar silently.** `dates.ts` passes the device's English locale tag straight to `Intl.DateTimeFormat`. A phone set to English with a Buddhist, Islamic or other calendar could show a birthday in that calendar's year (UNVERIFIED on Hermes; needs a test). No card says how a family that counts by another calendar is served.
7. **The book's frame is English.** A Hindi letter sits under an English dateline, English "Exactly as heard" labels and an English signature line (`age.ts:73-79`, `build.logic.ts:293`). Honest at 1.0, but nobody has said so to the parent, and the printed book is the keepsake.
8. **Fonts for Arabic and Chinese in the app and the PDF.** The app bundles Devanagari only. Arabic and Chinese letters fall back to system faces on screen, and the PDF font rule (C28-13) has no fixtures.
9. **No RTL plan beyond three screens.** Interface direction is English left to right, letter text direction is automatic. Mixed lines (an Arabic sentence with an English name) and the lists around them have no test list.
10. **Legal and support in other languages.** English Terms control. No rule says who may translate a consent, or what a Spanish speaker is told when they write to support.
11. **Cost is one number.** $1,000 to $1,500 [E] covers reviewer checks only. Nothing prices listing review, prompt writing, counsel for translated notices, or support.
12. **Rollback of a language** is described in F05-U16 and NS-17 section 10 but has no requirement here saying a parent's waiting recordings and typed words are safe when a language is paused.

---

## 4. Function requirements

Priority follows RR-4: P0 with reason (a) a promise, (b) a legal or store duty, (c) the core loop; else P1 or P2. Owner lane is the agent who carries the work. "BL new" means a row needs adding in the next backlog PR (no id above BL-999). Screen ids are from `docs/design/e2e/*/DESIGN.md` on `docs/e2e-ux-20nov`. Adjacent rows already written: FR-LEG-12, FR-LEG-13 (licences), FR-MKT-28 (public surfaces name shipped languages), FR-CMP-02, FR-PRV-19 (server copy of withheld words), FR-FIN-08 and FR-FIN-20 (hosting and one language at a time), FR-DAT-23 (language-tied answers), FR-SUP-04 (articles).

### 4.1 Which languages, and the bar each must clear

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-01 | Given any store build, When a language appears in a picker, a listing, a keyword, a page or a help article, Then it is in that build's `SPOKEN_LANGUAGES` list and its dossier (FR-LOC-26) is complete; English is always heard. A language absent from the list never shows, whatever the manifest holds | NS-17-R1, R4; A-S10; E-S08 (language row); BL new (dossier check in CI) | P0 (a) | `speech`, `content`, `mobile` | `capabilities.ts:84-100`; `09-capture.md:839,842` |
| FR-LOC-02 | Given the first store build, Then it hears English only, and no parent-facing line promises another language, "later" or "soon" (X CS-1 default). A later release adds one language at a time, in the release whose listing names it | NS-17-R4; X CS-1; K-E01 | P0 (a) | `content`, founder | D-121, D-125 item 2; GAP-LOG line 59 |
| FR-LOC-03 | Given a language is proposed, When the gate runs, Then it runs on the shipped model, pack and engine version, passes every bar below, and the numbers-only summary is committed as `docs/qa/evidence/F05-gate-<lang>.md` with the founder's decision lines filled by the founder. A changed model, pack, prompt, voice-detector setting or engine version makes the gate stale (`--check` fails in CI) | NS-17-R2; J-N16, J-N23; BL new | P0 (a) | `speech`, `qa`, founder | `experiments/README.md` 7.2, 7.3; `gate-lib.ts:86-94` |
| FR-LOC-04 | Given the bars, Then they are fixed per language as built: English, Spanish, French, Portuguese word error 10% or less; Mandarin character error 10% or less; Hindi 15% or less (with Devanagari at 95% of Hindi words and English words left in Latin at 95%); Arabic 20% or less and three dialect groups of four speakers; Portuguese 5 Brazilian and 5 European speakers; names 95% or more; 0 invented words on silence; p90 30 s on the tier device over 30 runs. A bar is never relaxed to let a language pass; a relaxed bar is a founder ruling written in the evidence file | NS-17-R2; F05 7.1 | P0 (a) | `speech`, founder | `gate-lib.ts:86-94,122`; F05 section 7.1 |
| FR-LOC-05 | Given a non-English pack, When it is proposed for a store build, Then a native speaker who is also a parent has reviewed its filler, repeat and punctuation tables, the tables are marked `native-reviewed`, the pack version is raised, and `docs/qa/evidence/F05-pack-<lang>-<version>.md` carries a `Reviewer role:` line (a role, never a name) and a date. The sign-off covers the same reviewer's pass over the checks in FR-LOC-19 to FR-LOC-21 | NS-17 sections 3, 22; BL new | P0 (a) | `speech`, `content`, founder | `experiments/README.md` 7.0 |
| FR-LOC-06 | Given the proposed unlock order, Then the recommended default is: Spanish, then Portuguese, French, Mandarin, Hindi, Arabic, each only after its own gate, because the repo's own numbers put Hindi (own model, not hosted, training data awaiting counsel) and Arabic (dialect groups) furthest from the bar. The founder may reorder for his own families; the order is never a promise to a parent | NS-17; Q-LOC-1 | P1 | founder, `speech` | `speech-models-on-r2.md` ("the Hindi model is not hosted and waits for counsel (Q9)"); F05 line 16 (measured WER) |
| FR-LOC-07 | Given a phone below 4 GB or a language that passes on the large model only, When the gate result is per tier, Then the language is offered only on the tier that passed, the other tier shows record and type with the honest line, and the evidence file names the tier | NS-17; F05-U31; C-S18 | P1 | `speech`, `mobile` | `experiments/README.md` 7.2 (`--tier compact`); F05-U31 |

### 4.2 Mixed-language speech and code-switching

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-08 | Given the 1.0 and every early multi-language build, Then each letter has one language, the author's chosen code is passed to every transcription call (never auto-detect, never translate), and no string, listing or help article says words in two languages are kept as spoken. NS-17 section 5 row "Mixed-language sentences" (`09-capture.md:801`) is reworded to F05 7.8: words from the other language are written as the model hears them under the forced language, the recording is one tap away, and the parent may type. Any "words are not written there" line is new work and needs a design state first | NS-17-R6; J-N16; A-S07.language; card change CC-LOC-1 | P0 (a) | `speech`, `content` | F05 7.8 and F05-REQ-031; `rules.test.ts:999` |
| FR-LOC-09 | Given Hindi and English in one sentence (code-switching), When the v1.1 mode (F33) is proposed, Then it has its own gate rows for `code_switched` clips (reported today, never gating, `gate-lib.ts:119-124`), a model chosen from measured results, Devanagari for Hindi words and Latin for English words, no transliteration in either direction, and D-031 (Hindi script default) closed by the founder first. Until then the gate reports the numbers and the app promises nothing | NS-17; A-S10; BL new (F33 gate rows) | P2 (P0 (a) at the moment any copy mentions it) | `speech`, founder | F05 7.8; F30 F33; `experiments/README.md` (standard Whisper about 30% word error on Hindi-English mixed speech, from the architecture review: UNVERIFIED here); D-031 listed Open at `DECISIONS.md:37` |

### 4.3 App language, spoken language, dates and calendars

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-10 | Given any build through 1.0.x, Then the interface is English and the spoken language is a separate setting; choosing Hindi to speak never changes a button, heading or error into Hindi. Each language is shown in its own name first with the English name under it. Interface languages are a separate decision with their own reviewer and are not unlocked by a speech language | NS-17 section 3 (not in scope); C-S01 "Spoken language"; BL-321 | P0 (a) | `content`, `mobile` | `language.en.ts:7-10`; `localisation.md:5`; D-056 |
| FR-LOC-11 | Given a device whose locale or calendar setting is not Gregorian (for example an English phone set to a Buddhist or Islamic calendar), When any date shows (dateline, birthday, Months, year labels), Then it shows the Gregorian date in Western digits: `dates.ts` pins `calendar: 'gregory'` and the Latin numbering system, with a test over locale tags such as `en-u-ca-buddhist` and `en-u-ca-islamic`. The date a parent entered is stored as ISO Gregorian (YYYY-MM-DD) and never converted | NS-24; NS-15; NS-43; A-S08; BL new | P1 (P0 (c) if the test shows a shifted year) | `mobile`, `qa` | `dates.ts:25-43` (locale tag passed through); MDN `calendar` option and `ca` key read 20 Nov; Hermes behaviour UNVERIFIED |
| FR-LOC-12 | Given age math, Then the age of {child} is counted in Gregorian calendar months and weeks (`ageOn`) in every language and every calendar; no card converts a birthday to a lunar, Hijri, Hebrew or Hindu date. A family that keeps another calendar is told, in a help article, that the book counts in the calendar the phone uses for ordinary dates, and that the letter's own words may carry any date they like | NS-15; NS-43-R4; BL new (help article) | P1 | `content`, `support` | `age.ts:1-4,28-49` |
| FR-LOC-13 | Given a book whose letters are in a language other than English, When it is read, exported or printed, Then the frame (dateline, age sentence, "exactly as heard" labels, signature words, cover and index) is in English at 1.0 and the letters' words are untouched, in their own script and direction. The help article and the listing say "the app is in English" in plain words. Making the frame follow the spoken language is a later, separately reviewed row | NS-11; NS-07 C28; NS-05; B-S08; Q-LOC-4 | P0 (a) for the honest line; P2 for the later row | `content`, founder | `age.ts:60-79`; `build.logic.ts:293,425` |
| FR-LOC-14 | Given a family that speaks a second language and has set it up on one phone, When they open the app on a new phone, Then the setting is asked for again before the first letter, and no help line implies the language or its downloaded model came with the account | NS-10; E-S08; C-S18 | P1 | `mobile`, `content` | `data-policy.md:138` (never synced in v1.0), `:140` (packs excluded from backup) |

### 4.4 Scripts, fonts and right-to-left

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-15 | Given the printable book (C28), When it embeds a font, Then every script the book holds has a licensed embedded face (Devanagari, Arabic, Simplified and Traditional Chinese, Latin with accents) and a fixture per language (Asha letters, 40 and 400 words, a name in the language's script) is built and checked for missing-glyph boxes before that language unlocks. The choice of face for Arabic and Chinese in the app is a design decision with a stated file-size cost | NS-07-C28-13; C-S05; FR-LEG-12; BL-411 | P0 (b) for the licence allowlist; P1 for fixtures | `design-systems`, `mobile`, `legal` | `07-remaining-capability-rows.md:265`; `fonts/index.ts:12-19`; `BACKLOG.md:1377-1382` |
| FR-LOC-16 | Given a letter in Hindi, When it shows on a letter page, in the Book, in a past-letter card, in Find results and in Read together, Then the words keep Tiro Regular under Bold Text (ruled Foundations Q3), no line ends or fragment cuts inside a conjunct or on a virama, and the line height holds the taller marks at every text size including AX5 on the SE 3 | NS-23-R2; NS-33; B-S08, B-S04; A-S07 | P1 | `design-systems`, `mobile` | GAP-LOG Foundations Q3 (line 359); NS-23-R2 (`10-reading-and-family.md:437`) |
| FR-LOC-17 | Given Arabic (and any later right-to-left language), When it unlocks, Then a state list is walked on a device: Review, letter page, Book card, Find result snippet, Months and year rows, Firsts label (`.rtlLabel`, `.rtlRow`), share sheet (D-S02 `.rtl`), export and PDF; the interface stays left to right; letter paragraphs use automatic direction; an Arabic line holding an English name and a number, and an English sentence holding an Arabic name, both render in reading order. A native-script reviewer signs the screenshots. The Arabic gate row does not pass without it | NS-17 sections 6, 15; D-S02.rtl; B-S05.rtlLabel; A-S07; BL-411 | P0 (a) for Arabic; P1 before | `design-systems`, `mobile`, `qa` | `excerpt-fade.logic.ts:49`; `build.logic.ts:376,425,433`; `localisation.md:12` ("Arabic needs a right-to-left screenshot check") |

### 4.5 Safety, content rules and prompts in other languages

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-18 | Given a language other than English, When it unlocks, Then either (a) its distress patterns exist, were written by a native speaker and clinician-reviewed (BL-105 route), and are tested on fictional lines, or (b) the app and its help say nothing that implies a letter in that language is noticed, and "If you are struggling" stays available in every build as it is today. No pattern is ever shown to a parent, logged, or sent; a miss is never a reason to say the tool "watches" | NS-23; NS-03 stop rule 2; C-S01 (If you are struggling); FR-SUP-16, FR-SUP-17; BL-105; BL new | P0 (a) | `speech`, `content`, clinician, founder | `safety.ts:1-30` (English patterns, "PENDING PERINATAL CLINICIAN REVIEW"); `helplines.ts` header (lines by phone region, not by language) |
| FR-LOC-19 | Given any parent-facing text in a language other than English (store, site, help, prompts, later the interface), When it is saved, Then a per-language rules file passes in `npm test`: no fear, guilt or loss wording; nothing that says or implies a machine writes, rewrites, improves or summarises; no counts of gaps, streaks, points or badges; no gendered word for the child; glossary words only (CR-25). The banned-phrase list per language is written by the native reviewer and stored beside the strings. Typographic rules are per language (guillemets and non-breaking spaces in French, opening marks in Spanish, the danda in Hindi, full-width marks in Chinese, the Arabic comma); the English no-curly-quotes, no-dash and no-ellipsis rules do not force wrong typography in them | CLAUDE.md content rules; NS-17 section 16; FR-SUP-06; BL new; CC-LOC-2 | P0 (a) | `content` | `rules.test.ts:183,564`; `localisation.md:29` (gender note); pack `house` settings (`packs/text-rules/*.json`) |
| FR-LOC-20 | Given the 115 English prompts (`PROMPT_LIBRARY_VERSION 4`), When a language unlocks, Then its prompt set is written by a native speaker who is a parent, as original prompts in the same bands and kinds (not a translation of the English wording), reuses no English key, uses `{child}` and gender-neutral phrasing, presumes nothing about the family, the home or who speaks to the child, names no count and no gap, and is reviewed against FR-LOC-19. Prompts a culture cannot use (an assumed visit, a holiday, a feeding custom) are left out, never softened by a machine. A language with no reviewed set shows the English prompts and says nothing about it | NS-35; A-S01 (prompt); BL new; Q-LOC-3 | P0 (a) for the no-machine-translation rule; P1 for the sets | `content`, native reviewers | `prompts.ts` header and band counts; `prompts.ts:11-17` |
| FR-LOC-21 | Given the machine edits for a language, Then the pack's house style (`dashes: replace`, `quotes: straight`, `ellipsis: dots`) is shown to the native reviewer as an explicit check: it must not alter French guillemets or Spanish dialogue dashes in a way the speaker did not say, and the reviewer records the answer in the pack evidence file. Engine safety (daughter to son in Hindi, feminine to masculine in Arabic, statement to question) stays refused, checked live in the gate | NS-17-R2; `verify.ts` | P0 (a) | `speech`, `core` | `packs/text-rules/fr.json`, `es.json` `house` keys (read); `experiments/README.md` 7.4 |

### 4.6 Store, legal, support and measurement in other languages

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LOC-22 | Given store metadata, Then en-US only ships at 1.0. A later locale (first es-MX, fr-FR, pt-BR subtitle and promotional text, as `localisation.md` plans) ships only when that language ships in the build and a native parent-reviewer has signed the text with role and date; the description is never machine translated; screenshots for a locale use the Asha book in that language and no frame shows a language the build does not hear; the keyword field and any custom product page follow the same rule. An Arabic listing needs the right-to-left screenshot check | NS-38; NS-17-R4; FR-MKT-28; FR-CMP-02 | P0 (b) | `marketing`, `content`, `compliance` | `localisation.md:9-16`; Apple localisations list read 20 Nov; `app-store.md:112` |
| FR-LOC-23 | Given the six draft translations in `localisation.md`, Then they stay unused drafts, are rewritten by the reviewer, not edited by a model, and are checked for two claims first: "every change is marked" and "your original recording is kept unchanged" must be true of the build and of the phone-only recording (claims inventory), and no sentence gender the child | NS-38; FR-SUP-05; claims inventory | P0 (a) | `content`, CCO | `localisation.md:20-29` (drafts quote both claims) |
| FR-LOC-24 | Given Terms, Privacy Policy, Subscription Terms, consents and registered disclosures (`in-app-disclosures.md`), Then no translation is made, shown or filed except through counsel; a translation carries the English version number and its own hash (`POLICY_VERSIONING.md:72`); the English text controls (`terms-of-service.md:198`); the consent record stores the language of the text shown (`BACKLOG.md:2697`). Counsel must confirm whether an English-only consent is enough for a parent who reads another language (C-LOC-1) | NS-39; NS-40; E-S02; BL-2697 row (consent record); BL new | P0 (b) before any non-English interface; P1 for 1.0 (question only) | `legal`, counsel | `terms-of-service.md:198`; `POLICY_VERSIONING.md:64,72`; `BACKLOG.md:2504` (registered strings change only through counsel) |
| FR-LOC-25 | Given a parent writes to support in another language, Then the macro set (FR-SUP-07) and help centre are English at 1.0; the founder's reply line says only what is true (for example that replies are in English and a short message in any language is welcome), no letter text is pasted into a translation tool, and translation of an incoming message by a tool is not used unless counsel and `privacy` approve it (the mailbox is L4) | FR-SUP-04, FR-SUP-10; C-S01 Help | P1 | `support`, `privacy` | `support.md` FR-SUP-10 (support mailbox L4) |
| FR-LOC-26 | Given any language that is proposed for a store build, Then a dossier file exists, one per language, listing: gate summary and founder decision; pack sign-off (role, date); licence record for the model, data and fonts (FR-LEG-13); 30 device runs on the SE 3 tier (and the compact tier if offered); script and right-to-left render fixtures; the rules file and prompt set attested by the reviewer (FR-LOC-19, 20); safety patterns or the no-claim statement (FR-LOC-18); listing review (FR-LOC-22); pooled tester answers (FR-DAT-23); help article; cost entry (FR-LOC-27); founder go. A CI check fails the build if the `SPOKEN_LANGUAGES` list names a language whose dossier is incomplete | NS-17-R1, R2, R4; J-N16, J-N23; BL new | P0 (a)(b) | `qa`, `speech`, founder | Joins `gate-lib.ts`, README 7.0, FR-LEG-13, `localisation.md` |
| FR-LOC-27 | Given a language is proposed, Then its cost sheet lists every line in the table below with a number or "needs a number", the founder approves one language at a time, and nothing is prepaid for several (FR-FIN-20) | NS-17 section 22; FR-FIN-08, FR-FIN-20 | P1 | founder, `finance` | Table in section 4.7 |
| FR-LOC-28 | Given a language is paused or removed (manifest pause, a defect, the correction-rate guardrail, or removal from `SPOKEN_LANGUAGES`), Then saved letters and typed words are untouched, new takes in that language record and wait (never sent to another recogniser), waiting recordings keep their audio, and a plain line says the words are waiting. Nothing is deleted, translated or re-run in another language. A test covers pause, return and a second account | NS-17-R10; F05-U16, U38; J-N16; A-S07.language | P0 (a) | `speech`, `mobile` | `09-capture.md:881`; F05-U16 |
| FR-LOC-29 | Given language is sensitive data (it can stand for ethnicity), Then no language code, language list, language-tagged text or model name goes to analytics, logs, crash reports or an email in any build until counsel answers Q6 and Q7 (deferred to v1.1); per-language quality numbers reach the repo only as the native reviewer's pass or fail and pooled tester answers (FR-DAT-23); a language setting is never used to pick a marketing audience | NS-17 section 21; FR-DAT-23; FR-PRV-19 | P0 (a) | `privacy`, `data-and-measurement` | `data-policy.md:46,85`; `DATA_CLASSIFICATION.md:503`; `COUNSEL_PACKET.md` (Q6, Q7 deferred) |

### 4.7 Cost per language (from `finance.md`)

| Line | Number | Source | Status |
|---|---|---|---|
| Native reviewer checks (pack tables, gate corpus) | about $1,000 to $1,500 per language | `09-capture.md:922`, `finance.md:64,165` ([E]: estimate) | Estimate; not quoted by any reviewer |
| Recording 10 consenting speakers (Arabic 12, Portuguese 10 in two groups), about 40 clips and 80 minutes | not priced; the README says nothing about payment | `experiments/README.md` 7.1; `finance.md` carries CVL-02 "paid native-speaker reviewers" as deferred (`BACKLOG.md:285`) | Needs a number from the founder |
| Model hosting on R2 | $0 within the free tier (10 GB-month, 10 million reads). Shared model 574,041,195 bytes; Hindi small 190,085,487 bytes; a Hindi plus English phone holds about 765 MB | `PACKS_HOSTING.md:274-281`; `speech-models-on-r2.md`; ADR 0015 table | Read, not rechecked |
| Prompt set (115 prompts equivalent) written by a native parent-reviewer | not priced | none | Needs a number |
| Listing review (subtitle, promotional text, keywords) | not priced | none | Needs a number |
| Counsel for translated notices and consents | not priced; counsel is "low five figures for about ten documents" [A] for English | `finance.md:166` | Needs a number from legal |
| Support in another language | founder time; no tool cost assumed | none | UNVERIFIED |
| Training-data terms review for a language model (Q9) | inside the counsel packet | `COUNSEL_PACKET.md` Q9 | Counsel must confirm |

### 4.8 Test evidence per language (what "done" means)

A language row is complete only with these, each a file or test the integrator can point to. Today every cell is empty except the engine unit tests.

| Language | Engine and pack tests (exist) | Gate summary | Pack sign-off | Device runs (30) | Script and render fixtures | Rules and prompts attested | Listing reviewed |
|---|---|---|---|---|---|---|---|
| English | `lang.english.test.ts`, `regression/en.test.ts`, golden en 31 | none on disk | `native-reviewed` in `en.json` | none on disk | n/a | English rules test | en-US approved (D-133) |
| Spanish | `regression/es.test.ts` | none | `draft` | none | opening marks check | none | draft only |
| French | `regression/fr.test.ts` | none | `draft` | none | no-break-space check | none | draft only |
| Portuguese | `regression/pt.test.ts` | none (needs 5 BR and 5 PT speakers) | `draft` | none | no-respelling check | none | draft only |
| Mandarin | `regression/zh.test.ts` | none (script choice Hans or Hant) | `draft` | none | Noto Serif SC fixture | none | draft only |
| Hindi | `regression/hi.test.ts`, golden hi 17, hinglish 10 | none; own model not hosted | `draft` | none | Devanagari, conjunct fixtures | none | draft only |
| Arabic | `regression/ar.test.ts` | none (3 dialect groups of 4) | `draft` | none | right-to-left state list (FR-LOC-17) | none | draft, low confidence |

---

## 5. Design needs

| Need | Where | FR |
|---|---|---|
| A reconciled line for A-S10 and the held-language card when a build hears more than one language: the language chip on Review, the "another language" mark when the list has one entry (G-06), and the waiting line with its first sentence only | A-S07.language, A-S10, E-S08 | FR-LOC-01, 02, 28 |
| Honest "the app is in English" lines where a non-English book is read, exported or printed (printable book intro, Save a copy screen, Plus or Me help) | C-S05 (printable), C-S04, B-S08 | FR-LOC-13 |
| Font decision for Arabic and Chinese in the app and the PDF with a size cost; Hindi line-height and Bold Text states for the letter page, Book card and Find snippet | B-S04, B-S05, B-S08, A-S07; C-S05 | FR-LOC-15, 16 |
| A right-to-left state list with a mixed-direction line, each state drawn once (Review, letter page, Book card, Find, Months, Firsts, share sheet, export) | A-S07, B-S05.rtlLabel, B-S07, D-S02.rtl | FR-LOC-17 |
| Settings, Spoken language and Storage language rows in a multi-language build: sizes, Wi-Fi only, paused, needs newer app, removed language; no teaser for a language the build does not hear | C-S01, C-S18, E-ST08 | FR-LOC-01, 07, 28 |
| New screen needed: a one-line "the date is kept in the calendar your phone uses" note is not required on any screen (help article only); no new screen for calendars at 1.0 | none | FR-LOC-12 |

---

## 6. Card changes proposed (for Karma to rule)

| Id | Card row | Change | Why |
|---|---|---|---|
| CC-LOC-1 | NS-17 section 5, row "Mixed-language sentences" (`09-capture.md:801`) | Replace with F05 7.8's wording (written as heard under the chosen language; recording one tap away; parent may type). Drop "the page says the words are not written there" unless design adds that state | The card promises a behaviour F05 does not describe and no design state draws |
| CC-LOC-2 | CLAUDE.md content rules and `rules.test.ts` header | State that the typography bans (dashes, curly quotes, ellipsis characters) apply to English strings, and that other languages follow a per-language rules file written by the native reviewer; fear, guilt, AI, gender and gap rules apply to all | Applying English typography rules to French, Spanish, Hindi, Chinese or Arabic copy would be wrong or unenforceable |
| CC-LOC-3 | NS-17-R1 | Add: and its dossier (FR-LOC-26) is complete; the picker, listing, keywords, pages and help follow one list | One definition of "offered" |
| CC-LOC-4 | NS-17 section 22 | Replace the one-line cost with the table in section 4.7 and FR-LOC-27 | Finance reviewed one number; five lines are unpriced |
| CC-LOC-5 | NS-17 section 16 and NS-35 | Add: prompts for another language are original writing by a native parent-reviewer, never translations; a language with no reviewed set shows English prompts | Prevents literal translation and machine drafts |
| CC-LOC-6 | NS-24 and NS-15 localisation rows | Add: dates are Gregorian and Western digits at 1.0; calendar pinned | FR-LOC-11 |
| CC-LOC-7 | NS-17 new row | NS-17-R11 (P0 (a)): no claim that a letter in another language is noticed for distress until FR-LOC-18 (a) holds | English-only patterns |
| CC-LOC-8 | `CLAUDE.md` Where things live | "111 prompts" reads 115 (library version 4) | Stale count |

---

## 7. Engineering needs (backlog rows to add or change)

| Row | Work | FR |
|---|---|---|
| New | Language dossier file format and a CI check that fails if `SPOKEN_LANGUAGES` names an incomplete language; extends `npm run gate -- --check` | FR-LOC-01, 03, 26 |
| New | `dates.ts` pins `calendar: 'gregory'` and Latin digits; test over `en-u-ca-*` tags and the device date picker output (ISO Gregorian) | FR-LOC-11, 12 |
| New | Per-language rules file and banned-phrase list loader for the content rules test (English files unchanged) | FR-LOC-19 |
| New | Per-language distress pattern set, behind a flag per language, with fictional-line tests; or an explicit "not offered" state | FR-LOC-18 |
| New | Fonts for Arabic and Chinese in the PDF and the app; fixtures per script; missing-glyph check in the PDF test | FR-LOC-15 |
| New | Right-to-left state walk on device and its evidence file | FR-LOC-17 |
| New | Pause and return test for a held language (second account, new phone) | FR-LOC-28 |
| New | Locale-ready string structure (`strings.<locale>.ts` convention, CLDR plurals through `Intl.PluralRules`, no sentence assembled in code) so a later interface language is data, not a rewrite. Only when the founder opens interface languages | FR-LOC-10 |
| Change | BL-411 (letter fixtures for ar, hi, zh; layout at AX5): add the six-language Asha fixtures and the PDF check | FR-LOC-15, 17 |
| Change | BL-321 (Hindi app UI): mark "after interface languages are opened (Q-LOC-5)" | FR-LOC-10 |
| Change | BL-109 (beta recruitment): Hindi and Spanish speaker rows apply to the gate corpus, not the store build (see FR-MKT-26) | FR-LOC-03 |

---

## 8. Founder and counsel questions, each with a recommended default

Counsel numbers are from `docs/legal/COUNSEL_PACKET.md` 1.5.0 where one exists; new ones "need a number from legal".

| Id | Question | Recommended default |
|---|---|---|
| Q-LOC-1 | Which language unlocks second, third and so on? | Spanish, Portuguese, French, Mandarin, Hindi, Arabic, one at a time (FR-LOC-06). The founder may put his own families first; the order is never promised to a parent. |
| Q-LOC-2 | Hindi script default (D-031, listed Open): Devanagari, Roman or automatic | Devanagari for Hindi words and Latin for English words, per author, never transliterated (the gate already checks this); the founder rules after the 14-recording experiment results. |
| Q-LOC-3 | Prompts: which language do they show in when a second language is chosen? | English until a reviewed set exists; then the author's primary spoken language, never a machine translation (FR-LOC-20). |
| Q-LOC-4 | Should the Book's frame (dateline, labels, cover) follow the spoken language? | No at 1.0; English frame with an honest line; a later row with its own reviewer (FR-LOC-13). |
| Q-LOC-5 | When do interface languages open, and which first? | Not before the second speech language ships; Hindi first if opened (BL-321); each its own reviewer and decision. |
| Q-LOC-6 | Who are the native reviewers and what is the budget? | One native parent-reviewer per language for tables, prompts, listing and rules; founder names a role, not a person, in the evidence file; the [E] $1,000 to $1,500 stands until a quote exists. |
| Q-LOC-7 | Is the distress-pattern clinician review (BL-105) a gate for every language, or only English? | A gate for each language before any line implies noticing; "If you are struggling" stays for all. |
| C-LOC-1 | Is an English-only consent, privacy policy and subscription notice enough for a parent in the US storefront who speaks another language? | Needs a number from legal. Default: English only at 1.0 (US storefront only, LEGAL-REQ-058), with the question asked before any non-English listing or interface. Counsel must confirm. |
| C-LOC-2 | Who may translate Terms, Privacy and consents, and what makes a translation valid alongside "English controls"? | Needs a number from legal. Default: no translation until counsel provides or approves it; per-locale hash and the English version number. Counsel must confirm. |
| C-LOC-3 | Training-data terms for each speech model (Hindi small, any model for Mandarin or Arabic) | Packet Q9, Q12, live. Default: no language ships until Q9 is answered for its model (FR-LEG-13). Counsel must confirm. |
| C-LOC-4 | Does naming a language in the listing, or a locale-specific screenshot, create a claim Apple can test (guideline 2.3.1)? | Packet question via `compliance` (FR-CMP-02). Default: name only languages whose dossier is complete. Counsel must confirm. |
| C-LOC-5 | May support translate an incoming message with a tool? | Needs a number from legal. Default: no. |

---

## Summary for the integrator

- Requirements written: 29 (FR-LOC-01 to 29): P0 count 16 (13 with reason (a), 5 with reason (b); FR-LOC-26 carries both, FR-LOC-24 and FR-LOC-15 are (b) in part), P1 count 11, P2 count 2 (FR-LOC-09 and the later part of FR-LOC-13).
- Card changes proposed: 8 (CC-LOC-1 to 8). Backlog: 8 new rows, 3 changed. Founder questions 7, counsel questions 5.
- Outside facts read: 2 (Apple metadata localisations, MDN `Intl.DateTimeFormat` calendar). UNVERIFIED items are listed in section 1.
