# ADR 0014: Languages as data: text-rules packs, one engine, phonetic keys

Status: Accepted (engine and packs built 3 Oct 2026); word tables per language Proposed until a native speaker signs each off. Date: 2026-10-03. Builds on the constitution (CLAUDE.md), founder decisions 6, 7 and 15 (docs/agents/BRIEF-2026-10-03.md), ADR 0012 (open models), ADR 0015 (speech models per language) and ADR 0016 (pack manifest and lean app). Research and sources: docs/research/LANGUAGES.md.

Evidence key: **V** verified on 3 Oct 2026 (source opened, or code run in this repo). **U** unverified. **E** our estimate.

## Context

- v1.0 letters are spoken in English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese (decision 6). Each needs its own spelling, script and punctuation, and phonetics for taught names. The machine still may only remove and repair, never reword (decision 7).
- Only English ships in the app; every other language's rules are downloaded when an author picks it, as data, never code (decision 15, App Store guideline 2.5.2).
- Probing the English-only engine on 3 Oct found six meaning-changing non-English edits it **accepted** (V, now regression tests in `test/lang.languages.test.ts`): Hindi मैं (I) to में (in) and है (is) to हो under the `punctuation` label, because vowel signs were not counted as letters; Spanish *si* (if) to *sí* (yes) with a decomposed accent; Chinese 。 to ？ and Arabic . to ؟, because full-width and Arabic question marks were not mood marks; Arabic كَتَبَ (he wrote) to كُتِبَ (it was written) by changing harakat. The tokenizer also split हिंदी into ह and द.
- Hermes has no `Intl.Segmenter` (V: `lib/VM/JSLib/Intl.cpp` and `PlatformIntl.h` on both `main` and the `250829098.0.0-stable` branch that RN 0.86.3 builds as Hermes V1 by default define only Collator, DateTimeFormat and NumberFormat). It does have `String.prototype.normalize` (platform-backed) and Unicode property escapes including `Script=` (V, `RegexParser.cpp`, `CharacterProperties.cpp`). Side finding for TDD 09: Hermes has no `Intl.PluralRules` either.

## Decision

### 1. One generic engine, rules as data
`packages/core/src/lang/engine.ts` compiles a `TextRulesPack` (`lang/types.ts`) into `LanguageRules`: tokenizer, word tables, sentence marks, mood and quote classes, case and capital rules, agreement and tense tables, repeat tables, punctuation profile, final-character policy, script conversion and phonetic tables. The verifier (`verify.ts`), the filler and repeat rules (`rules.ts`, `repeats.ts`) and the pipeline read everything language-specific from `ctx.rules` (default: the bundled English rules). Packs hold only lists, maps, enums, numbers and literal strings; the engine escapes every string it puts in a pattern. Nothing in a pack is evaluated.

English is a pack like the others, built from the same sets the engine used before (`lang/english-tables.ts`, re-exported under the old names). Proof that English is unchanged: a golden master of 12,000 fuzz runs plus 132 fixtures (verify results, clean text, applied and rejected edits, suggestions, punctuation edits, repeats, segments) is byte-identical before and after, except one intended fix (a decomposed `café` is now one token). `test/lang.english.test.ts` keeps the legacy functions as the reference and checks the pack engine against them.

### 2. Generic safety fixes (all languages, English unchanged)
- Words include combining marks (`\p{M}`); `lettersOnly` counts them. A vowel sign, nukta, harakah or accent is spelling.
- Mood marks are canonicalised across scripts (？ ؟ count as ?, ！ as !), so script changes cannot flip a statement into a question and converting ? to ？ is not a change.
- « » „ ‹ › 「 」 『 』 count as quotation marks and are protected; no removal may take a quotation mark with it.
- Arabic decimal and thousands separators belong to numbers.

### 3. Trust per table: enabling versus protective
Every table carries a review status: `draft`, `cited` (a published standard) or `native-reviewed`.
- **Enabling** tables let the engine change text and are used only when vetted: fillers, repeats and false starts, agreement and name similarity need `native-reviewed`; the punctuation profile, final-character policy and script conversion need `cited`.
- **Protective** tables only make the verifier refuse more (negations, modals, numbers, function words, pronouns, kinship words, quotes) and are loaded even as drafts.

A language whose word tables are not signed off runs in **punctuation-safe mode**: dictionary fixes (exact term or taught mishearing), punctuation and paragraphs only, plus filler removal once the filler list is vetted. Every other edit is refused as `not_vetted_for_language`. A language whose pack is not on the phone yet runs in the same mode with bundled script facts only. All six downloadable packs ship today with word tables in `draft`, so they apply only their cited punctuation, normalisation and (Chinese) script rules until a native speaker signs them off. That is a data change and a re-sign, not an app release.

### 4. normalizeScript is folded into `punctuation`, not a new edit type
A character converted to the author's chosen script (發 to 发) is a `punctuation` edit. Reasons:
- `punctuation` already means "the same letters, written differently"; case is the precedent (a to A is another code point, the same letter). Unicode's Unihan data records 發 and 发 as variants of one character.
- The proof has the same shape as a case change: letter for letter, each changed character must be the pack's mapping **toward the author's script** (never the other way), and the words around it must be the same words in that script. Mood, quote, number and negation guards still apply.
- `EditType` is a closed set mirrored in the review screen (`Record<EditType, ...>`), the analytics catalogue and every stored edit. A new type would break those contracts for one language's needs. `describeEdit(edit, rules)` returns `'script'` so the review screen can label it honestly.

Conversion is per author (Taiwan and Hong Kong write Traditional), only when the author has chosen a script, never inside quotes or on a dictionary term, and only for characters with exactly one counterpart (OpenCC, narrowed to GB 2312 or Big5). 发 (發 or 髮), 后 (後 or 后) and 面 (面 or 麵) are left as heard.

NFC is not an edit: canonically equivalent text is the same text. Raw transcripts should be NFC before they are stored (`toNFC`, requested from the transcription layer); the engine compares in NFC and never changes the form of the output.

### 5. Chinese is tokenized per character
Without `Intl.Segmenter`, every Han character is its own token, so edits can remove one character without "splitting a word". Consequences: Chinese table entries are single characters; a one-character filler counts only where it stands alone (呃 is a hesitation, 呃逆 is "hiccup", 额头 is "forehead"); reduplication (妈妈, 看看) is never removed.

### 6. Phonetic keys for taught names
`phoneticKey(name)` romanizes by table (Devanagari abugida with schwa deletion, Arabic consonants, Chinese toneless pinyin from Unihan kMandarin), applies the language's spelling rewrites and returns the consonant skeleton. मीरा, ميرا and Meera share a key; 米拉 and 蜜拉 share one. Keys only **suggest** (`soundAlikeTerms`): automatic similarity fixes stay limited to cased scripts, where a mid-sentence capital tells us the recogniser heard a name. In Devanagari, Arabic and Han there is no such signal (मेरा, "my", sounds like Meera), so only taught mishearings are fixed there.

### 7. Regional and dialect variation is labelled, never normalised
Portuguese has a spelling setting (Brazil or Portugal) and Chinese a script setting, per author. Neither respells anything: *fato/facto* and *bebê/bebé* are refused as letter changes. Arabic dialect words (مش, مو, ماكو, بدي) are never normalised to Modern Standard Arabic; alef and ya folds apply to table look-ups only.

### 8. Packs
`packs/text-rules/<lang>.json` are the sources; `scripts/packs/publish.ts` (platform) validates them with `validatePackJson`, canonicalises, hashes and signs them as `text-rules.<lang>`. `en.json` is reference data checked against the bundled pack and is not published. The Chinese data tables are regenerated by `packs/text-rules/tools/zh-data.mjs`; attribution (OpenCC Apache-2.0, pinyin-data MIT, Unihan Unicode License v3) travels inside the pack.

Published (minified, canonical JSON) sizes, 3 Oct 2026 (V):

| Pack | Bytes | gzip |
|---|---|---|
| en (bundled, not downloaded) | 6,375 | 2,164 |
| hi | 7,341 | 2,840 |
| es | 5,331 | 2,343 |
| zh | 62,158 | 41,943 |
| fr | 5,694 | 2,473 |
| ar | 5,818 | 2,570 |
| pt | 5,083 | 2,200 |

## Consequences

- One code path for every language; adding a language is a pack plus a line in `lang/languages.ts`.
- Until native speakers sign off, non-English letters get correct punctuation and script but keep fillers and stumbles. That is the honest cost of "never reword".
- Agreement repairs stay English-only: in pro-drop languages the verb ending is the subject (*habla* to *hablas* changes who spoke), and Hindi verb endings carry gender and number.
- The review screen, the transcription queue and `cleanWithProviders` must pass the language (requests in the language agent's report).

## Rejected alternatives

- A new `script` EditType: honest label, but breaks the closed set across app, analytics and stored edits; `describeEdit` gives the label without that cost.
- Shipping JS rule modules per language: executable download, against guideline 2.5.2.
- `Intl.Segmenter` or a dictionary segmenter (jieba-like) for Chinese: not in Hermes; a dictionary would add megabytes and its own errors.
- Aksharamukha (AGPL, U) and eSpeak NG (GPL-3.0, V) for transliteration and phonetics: licences excluded from the bundle. Epitran (MIT, V) and indic-transliteration (MIT, V) are usable as data sources later.
