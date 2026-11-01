# Languages research: what the text rules know, and how sure we are

Date: 2026-10-03. Owner: language agent. Decision record: docs/adr/0014-languages-and-phonetics.md. Pack sources: packs/text-rules/<lang>.json.

Evidence key: **V** verified (source opened, or code run here). **U** unverified (not found, or from general knowledge only). Every word table in the six downloadable packs is `draft` until a native speaker signs it off (checklist at the end); the engine does not use a draft table to change text.

## 1. Platform facts

| Question | Answer | Evidence |
|---|---|---|
| `Intl.Segmenter` in Hermes for SDK 57 (RN 0.86.3) | **No.** Hermes defines only Intl.Collator, DateTimeFormat and NumberFormat (plus locale-aware String/Array/Number/Date methods). Chinese is tokenized per character | V: `lib/VM/JSLib/Intl.cpp`, `include/hermes/Platform/Intl/PlatformIntl.h` on `main` and on `250829098.0.0-stable`, the Hermes V1 branch RN 0.86.3 uses by default (`sdks/hermes-engine/hermes-utils.rb`: V1 unless `RCT_HERMES_V1_ENABLED=0`); https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md |
| `Intl.PluralRules` in Hermes | **No** (same files). TDD 09 7.2 item 2 relies on it; needs a small plural table instead | V |
| `String.prototype.normalize` | Yes, NFC/NFD/NFKC/NFKD, platform-backed | V: `lib/VM/JSLib/String.cpp`, `PlatformUnicode.h` |
| Regex `\p{L}`, `\p{M}`, `\p{Script=Han}` | Yes, when built with `HERMES_ENABLE_UNICODE_REGEXP_PROPERTY_ESCAPES` (the existing engine already depends on `\p{L}`) | V: `lib/Regex/RegexParser.cpp`, `lib/Platform/Unicode/CharacterProperties.cpp` |
| Device locale without a new native module | `Intl.DateTimeFormat().resolvedOptions().locale` (Hermes implements resolvedOptions) | V (API list); device value on iOS: needs a device |
| Whisper and Chinese script | Whisper's single `zh` code returns Simplified or Traditional unpredictably; an initial prompt steers it: 以下是普通话的句子。 (Simplified), 以下是普通話的句子。 (Traditional). Stored in zh.json `asr.initialPrompt` | V: https://github.com/openai/whisper/discussions/277 |

## 2. Unicode normalisation

- **NFC everywhere** (UAX #15, https://unicode.org/reports/tr15/). Raw transcripts should be NFC before storage (`toNFC`); the engine compares in NFC and never changes the output's form. V.
- **Hindi nukta**: क़ ख़ ग़ ज़ ड़ ढ़ फ़ य़ (U+0958 to U+095F) are composition exclusions, so NFC writes them as base letter plus U+093C (V: https://www.unicode.org/Public/UCD/latest/ucd/CompositionExclusions.txt, and `'ज़'.normalize('NFC')` run here). Policy: the nukta is spelling, never added or removed; it is ignored only for table look-ups. Chandrabindu folds to anusvara for look-ups only.
- **Arabic tatweel** (U+0640) is an elongation for justification, not part of the word (Unicode Standard ch. 9.2, U). Policy: dropped from the final text only, never from raw.
- **Arabic harakat** (U+064B to U+0652, U+0670): kept exactly as recognised, never added or removed (changing them changes words: كَتَبَ he wrote, كُتِبَ it was written). Ignored for table look-ups only. Alef forms (أ إ آ ٱ) and alef maqsura fold for look-ups only.
- **Dialects**: Arabic dialect text is never normalised to Modern Standard Arabic (global research finding, 3 Oct). Persian letter forms in Arabic text (ک for ك) are left as recognised: converting needs a native review first.
- **Simplified and Traditional Chinese**, per author (Taiwan and Hong Kong write Traditional): one-to-one conversion only, from OpenCC TSCharacters and STCharacters (Apache-2.0, V: https://github.com/BYVoid/OpenCC). When OpenCC lists several candidates, they are narrowed to the target standard's set (GB 2312 for Simplified, Big5 for Traditional); a character converts only when exactly one candidate remains and differs from it. Result: 2,936 Traditional to Simplified and 2,576 Simplified to Traditional pairs. 发, 后, 面, 干, 里, 台, 系, 当 stay as heard for a Traditional author (V, tests).
- **Portuguese** Brazil and Portugal spelling (AO1990 leaves differences such as *fato/facto*, *bebê/bebé*, U): both kept, nothing respelled; the region is a label for keyboard and recogniser.

## 3. Punctuation (cited standards; applied by the engine today)

| Language | Rule | Source |
|---|---|---|
| Spanish | ¿ ¡ are obligatory, go exactly where the question or exclamation starts, lowercase after them mid-sentence. The engine adds them only to one-clause sentences ending in ? or !; a sentence with an inner comma, colon or semicolon is left alone because the question may start mid-sentence | V: RAE, Diccionario panhispánico de dudas, https://www.rae.es/dpd/signos%20de%20interrogaci%C3%B3n%20y%20exclamaci%C3%B3n |
| French | No-break space before the colon and inside « »; before ; ! ? a fine space (France) or none (Quebec, OQLF's choice). The engine turns an existing space before ; ! ? into U+202F and never adds one, so both conventions are respected | V: OQLF, https://vitrinelinguistique.oqlf.gouv.qc.ca/22039/la-typographie/espacement/espacement-avant-et-apres-les-signes-de-ponctuation-et-les-symboles ; Imprimerie nationale, Lexique des règles typographiques (U, not opened) |
| Chinese | Full-width ， 。 ？ ！ ： ； and 、 after Chinese text, no space after them; “ ” and ‘ ’ (Simplified) or 「 」 『 』 (Traditional) quotes; …… ellipsis; —— dash | GB/T 15834-2011 标点符号用法 (U, standard text not opened; rules are well established) |
| Arabic | ، (U+060C), ؛ (U+061B), ؟ (U+061F) after Arabic words; full stop is U+002E | Unicode Standard ch. 9.2 (U, not opened) |
| Hindi | । (danda) is the full stop; ? ! , as in English | Unicode ch. 12.1; Central Hindi Directorate, Manak Hindi Vartani (U, not opened) |
| Portuguese | Latin marks, no inverted openers; « » in Portugal, “ ” in Brazil | Acordo Ortográfico 1990 (U) |

House characters (founder rule: no em or en dashes, curly quotes or ellipsis in an entry) apply as before in Latin, Devanagari and Arabic (the Arabic dash becomes "، "). **Founder question**: Chinese keeps its standard “ ” quotes and …… ellipsis (straight quotes and three dots are wrong in Chinese); only the dash becomes a full-width comma. French keeps no-break spaces.

## 4. Fillers (draft: need native review)

| Language | Removed once vetted | Offered only (may mean something) | Kept, never fillers | Evidence |
|---|---|---|---|---|
| Hindi | उम, उम्म, अम्म, हम्म, ह्म्म | अं | हम (we), हाँ (yes), हूँ (am), आ (come), मतलब, वो | U: no corpus count found |
| Spanish | em, emm, ehm, mmm, um, uhm, uh | eh (also a tag: vale, ¿eh?), mm | este (also "this"), o sea, pues | V: Instituto Cervantes Observatorio (2022), eh/em, ah/am, uh/um, https://cervantesobservatorio.fas.harvard.edu/es/informes/que-decimos-cuando-no-decimos-nada-claves-del-cambio-linguistico-inducido-por-contacto-en |
| French | euh, heu, euhm, hum, hmm | mm, mmh | ben, bah (discourse markers) | V: Kosmala and Crible (2021), https://halshs.archives-ouvertes.fr/halshs-03225622 |
| Portuguese | hã, ãh, ahn, ãhn, hum, humm, hmm, uhm, ehm | mm, mmm | é (is), né, tipo, aham (yes) | Moniz, Mata and Viana, Interspeech 2007 (V title; forms U) |
| Arabic | اممم, امم, همم, هممم, ممم, إمم, آآ, ااا | مم | يعني (I mean), آه and إيه (can mean yes), ام (also أم, mother, without hamza) | U |
| Chinese | 呃, 额, only where they stand alone | 嗯 (also "yes") | 那个, 就是 (carry meaning); 呃逆 (hiccup), 额头 (forehead) | V: Yuan, Xu, Lai and Liberman, Speech Prosody 2016, 呃 e and 嗯 en are the basic fillers, https://www.ldc.upenn.edu/sites/www.ldc.upenn.edu/files/speechprosody2016-pauses-fillers-mandarin.pdf |

## 5. Negation, modal and tense tables (draft; protective now)

Loaded today even as drafts, because they only make the verifier refuse more.

- **Hindi**: नहीं, नही, नहि, न, ना, मत, बिना (+ Roman nahi, nahin, mat); modals सकना forms, चाहिए, पड़ना forms, शायद; tense groups है/था/होगा. Kachru, *Hindi* (2006) (U).
- **Spanish**: no, ni, nunca, jamás, nada, nadie, ningún(o/a), tampoco, sin; poder and deber forms, quizá(s); ser, estar, tener, ir, hacer tense sets. RAE grammar (U).
- **French**: ne, pas, non, jamais, rien, personne, aucun(e), ni, nul(le), guère, sans, and the elided prefix n' (n'aime); pouvoir, devoir, falloir forms; être, avoir, aller, faire tense sets. Grevisse, *Le Bon Usage* (U).
- **Portuguese**: não, nem, nunca, jamais, nada, ninguém, nenhum(a), tampouco, sem; poder, dever, precisar, talvez; ser, estar, ter, ir, fazer tense sets (both Brazil and Portugal forms). Cunha and Cintra (U).
- **Arabic**: لا, لم, لن, ليس and forms, ما, and dialect negators مش (Egyptian, Levantine), مو (Gulf), مب, ماكو (Iraqi), مافي; بدون, دون, غير, أبدا; modals يمكن, ممكن, يجب, لازم, قدر forms, استطاع forms, ربما, قد, سوف, رح, بدي. Ryding (2005) (U).
- **Chinese** (single characters): 不 没 沒 别 別 未 无 無 非 莫 勿 甭 否; modals 能 会 會 可 要 该 該 得 必 应 應 想 愿 願 敢 肯 须 須; aspect 了 过 着 as function words. Li and Thompson (1981) (U).

Agreement repairs are **off** for all six: Spanish, Portuguese and French are pro-drop or carry the subject in the verb ending (*habla* to *hablas* changes who spoke); Hindi verbs carry gender and number (गया, गई, गए); Arabic verbs carry person, gender and number; Chinese has no inflection.

## 6. Repeats (draft)

Reduplication is meaningful in Hindi (धीरे धीरे, जल्दी जल्दी, बार बार) and grammatical in Chinese (妈妈, 宝宝, 看看, 天天), so those packs remove almost nothing: Hindi only doubled postpositions and conjunctions, Chinese nothing (doubled pronouns are offered). Spanish and French never touch "la la la" (singing), "no no", "non non", "muy muy".

## 7. Phonetic and transliteration resources (licences)

| Resource | Licence | Use | Evidence |
|---|---|---|---|
| OpenCC character tables | Apache-2.0 | zh script conversion (data in pack, attributed) | V |
| pinyin-data kMandarin (from Unihan) | MIT; Unihan: Unicode License v3 | zh toneless pinyin (data in pack, attributed) | V |
| Epitran (G2P maps for hin-Deva, ara-Arab, spa-Latn, fra-Latn, por-Latn) | MIT | candidate data source for v1.1 tables | V licence |
| indic-transliteration / sanscript.js | MIT | candidate for Roman Hindi (D-031) | V licence |
| pinyin-pro, opencc-js | MIT | not needed (data extracted) | V licence |
| Talisman (phonetic algorithms) | MIT | not needed | V licence |
| Apache commons-codec Beider-Morse | Apache-2.0 | heavy; not needed | V licence |
| Aksharamukha | AGPL (U) | **excluded** | licence file not found (U) |
| eSpeak NG | GPL-3.0 | **excluded** | V |
| CC-CEDICT | CC BY-SA 4.0 | avoided (share-alike) | U |

Approach per script: Devanagari, a consonant and vowel-sign table with Hindi schwa deletion at word end (ISO 15919 values simplified to the Latin spellings names use); Arabic, a consonant table with و and ي read as vowels and ع, ء silent (ALA-LC values simplified), vowel count not compared because short vowels are not written; Chinese, toneless pinyin of the most common reading (polyphonic surnames such as 曾 and 单 may get the common reading, U); Latin languages, each language's spelling rewrites and accents removed.

## 8. Native-review checklist (per pack)

A reviewer (native speaker; for Arabic, one per dialect family; for Portuguese, Brazil and Portugal) signs a table off by setting its `review` to `{ "status": "native-reviewed", "by": "<role, e.g. native speaker, pt-BR>", "date": "YYYY-MM-DD" }` and bumping `version`. The platform pipeline re-signs; no app release.

1. **Fillers**: is every `auto` entry only ever a hesitation sound? Could any be a word, a yes, or a name? Move doubtful ones to `suggest`.
2. **Negations, modals, numbers, kinship, pronouns**: anything missing that a parent would say to a baby? (Missing entries make the engine less protective.)
3. **Repeats**: is every `always` double a stumble, never emphasis, song or grammar?
4. **Phonetic**: do common names in your community, spelled in your script and in Latin, get the same key (`phoneticKey`)? Do different names stay apart?
5. Run `npm test -w @scribe/core`; the fuzz test runs every language with its tables vetted.
