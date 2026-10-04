# BR1 audit: brand rules, translations and claims for earlyletters.com

> **Note, 4 Oct 2026 (D-051):** this audit is dated 3 Oct. Rows 13, 15, 16, 17 and section 3 B treat "Writing, reading, playing your recordings and export are free, always" as a supported claim. That claim is no longer the promise (free is now the first 2 letters per account; existing letters stay open). The audit is history; the site copy needs a new claims pass owned by the website and content agents. Unverified which other rows depend on it.

Owner: BR1 (brand and claims QA). Date: 2026-10-03. Branch: `feat/web-scroll-film`. Scope: `apps/web/src/content/site.ts` (coordinator-owned, not edited), plus any copy file under `src/scenes/parts/**` and `src/lib/legal/**`.
Tags follow `docs/web/TEAM.md`: **Verified** (I opened the source or ran the code), **Inferred**, **Opinion**.

## 1. Test status

`cd /home/claude/earlyletters && npm test -w @scribe/web` passes, 19 tests in `apps/web/test/copy-rules.test.ts` (Verified; `npx tsc --noEmit` in `apps/web` also passes). **`site.ts` passes every rule today: there are no failures to fix.** I proved the rules are not vacuous by running the same file against a deliberately broken copy of `site.ts` (17 of 19 failed, as intended; the probe was deleted).

What the test walks:
- `sampleLetter` and `site` from `site.ts`, by import, so a new export is covered automatically.
- Every `copy.ts`, `*-copy.ts` or `*.copy.ts` (and `.tsx`) under `src/scenes/parts/**` and `src/lib/legal/**`, by reading string literals with the TypeScript parser. Comments, import paths and type-level literals are ignored, and a copy file's own imports (such as the `@/` alias, which vitest does not resolve here) never matter. Today this finds E1's `legal-copy.ts` and `delete-account-copy.ts` (both pass). `src/scenes/parts` does not exist yet; the test tolerates that.
- A guard fails if a file in those folders is named like copy (`Copy.ts`, `strings.ts`, `text.ts`, `copy.json`) but is outside the glob, so a rename cannot silently skip the rules.

| Rule | Source |
|---|---|
| No em or en dashes (or lookalike dashes), curly or low quotes, ellipsis characters | VOICE.md Mechanics, CLAUDE.md |
| No emoji (also flags, keycaps, variation selectors) | CLAUDE.md |
| At most one exclamation mark site-wide | Task rule (product copy allows 3) |
| NFC text, no zero-width, soft-hyphen or bidi-override characters | Added for Hindi and Arabic safety |
| No fear, guilt or loss language (regex copied from `rules.test.ts`, plus pressure and fading words) | VOICE.md, rules.test.ts |
| Never imply software writes (`rules.test.ts` list, made case-insensitive except "AI", plus synonyms) | VOICE.md, BRIEF decision 7 |
| "Rewrite" only inside a never-rewrite promise (no exemption for questions) | CLAUDE.md constitution |
| Banned site words (learn, ABC, early learning, literacy, educational, AI-written, generated, legacy, hereafter, cherish, precious, journey, unlock, seamless, magic, effortless) | Task list |
| Brand name spelled exactly as `@scribe/brand`; codename `scribe` never shows | CLAUDE.md |
| No he, him, his; she and her only in an explicit sentence allowlist (one entry: Mama in `sampleLetter.text`); no girl, boy, daughter, son | VOICE.md, CLAUDE.md |
| v1.0 guards: grandma, grandpa, grandparent, nani, dadi (also dada, aunt, uncle, contributor), printed, print book, Android (also Google Play), highlight (also Hindi-English, code-switching) | BRIEF decision 5, 9 |
| s08: exactly the seven languages in order, each in its own script, with its own full stop, right to left only for Arabic | BRIEF decision 6 |

Notes for the other owners:
- English-only word rules skip non-English `text` (a `text` beside a `lang`), because "he" is a Spanish verb form. Character, script and v1.0 token rules run on everything.
- E1's legal copy must say "models", not "AI", when it states the no-training promise. The rule bans the word "AI" (VOICE.md: no naming the technology). `docs/legal/privacy-policy.md` uses "AI models"; the web copy should use the BRIEF decision 11 wording, "never used to train models". If counsel needs the literal "AI", add a scoped allowance to the test; do not loosen it globally.
- E1's `delete-account-copy.ts` mentions "family letters" and "Each family member is offered a copy". Not caught by a rule, and legally harmless, but BRIEF decision 5 says v1.0 is co-parent only and the app hides the contributor path, so those lines describe people who cannot exist yet. Low severity; E1 to decide.

## 2. Translations: s08 "Today you found the light switch."

All six pass the structural test (script, full stop, direction, NFC). Gender neutrality toward the child holds in all six (see each row). **None of this replaces a native speaker. Every verdict below is mine, not a native speaker's.**

| Lang | Text in site.ts | Verdict | Confidence |
|---|---|---|---|
| Hindi | आज तुमने लाइट का स्विच ढूँढ लिया। | Keep. Grammatical, natural for urban Hindi, neutral. | Grammar High; naturalness Medium |
| Spanish | Hoy encontraste el interruptor de la luz. | Keep. Neutral everywhere; regional noun choice. | Grammar High; regional Medium |
| Mandarin (Simplified) | 今天你找到了电灯开关。 | Correct but a little stiff. Prefer 今天你找到了灯的开关。 | Grammar High; naturalness Medium-Low |
| French | Aujourd'hui, tu as trouvé l'interrupteur. | Keep. Natural, neutral. | High |
| Arabic | اليوم وجدت مفتاح الضوء. | Change. Neutral on the page, but reads as "I found" without context; noun and register unconfirmed. | Grammar Medium; wording Low |
| Portuguese | Hoje você encontrou o interruptor da luz. | Keep for Brazilian Portuguese. Decide the variant. | Grammar High; variant Medium |

**Hindi.**
- Grammar: तुमने (तुम plus the ergative ने) with the perfective compound ढूँढ लिया. In the transitive perfective the verb agrees with the direct object, not the subject (Verified, Wikipedia "Hindustani grammar": "Finite verbal agreement is with the nominative subject, except in the transitive perfective, where it is with the direct object, with the erstwhile subject taking the ergative construction -ne"). The object स्विच is masculine singular, so लिया is masculine singular whatever the child's gender. That is the ne-construction agreement the brief asked about: it leaks nothing about the child.
- Script and punctuation: the danda । is the Devanagari full stop (Verified, Wikipedia "Devanagari"). ढूँढ keeps the chandrabindu: Hindi swaps it for an anusvara only when the vowel sign sits above the top line (Verified, Wikipedia "Chandrabindu"); ू sits below, so ढूँढ is the standard form (Inferred) and ढूंढ is a common informal variant.
- Naturalness: लाइट का स्विच is how many urban families say it (Opinion). तुम is warm and neutral; some parents use तू/तूने with babies, also neutral.
- Alternative, same neutrality: आज तुम्हें लाइट का स्विच मिल गया। ("you came upon it"). Opinion.
- Dependency: D-031 (Hindi script default, founder, due 30 Oct) may keep English words in Latin. The Devanagari loanwords here (लाइट, स्विच) would then become a Hindi-English mix, which is v1.1. Loanword-free fallback to confirm with a native speaker: आज तुमने बत्ती का बटन ढूँढ लिया। (Opinion, Low).
- Not opened: a Hindi dictionary (Wiktionary, Shabdkosh, Rekhta were unreachable) and the Central Hindi Directorate orthography standard.

**Spanish.**
- Grammar: pretérito indefinido, second person singular (tú), no gendered participle or adjective. Neutral.
- Noun: RAE defines interruptor as "Mecanismo destinado a interrumpir o establecer un circuito eléctrico" with no regional mark (Verified, dle.rae.es). In Mexico the household word is often apagador, which the RAE marks "Méx." ("Interruptor de la corriente eléctrica", Verified, dle.rae.es). Interruptor is understood in all regions, so it is the safe neutral choice (Inferred); a Mexican-American reviewer may prefer apagador.
- Register: tú. Voseo regions (Argentina, Uruguay) usually use the same preterite form, but I could not verify that (Wikipedia "Voseo" says preterite voseo forms differ "most of the time" in some paradigms). Low confidence; native check if Rioplatense Spanish is a target.
- Punctuation and accents: correct; no ¡ or ¿ needed.

**Mandarin.**
- Grammar: 找到了 (resultative plus 了) is correct. 你 is gender-neutral in speech and writing; only 他 and 她 split in writing (Inferred, standard).
- Noun: 电灯开关 is a listed compound, "light switch", and 电灯 is "electric lamp; electric light" (Verified, hanbook.com, a learner dictionary). A second learner dictionary lists 灯开关 as "light switch" and shows 灯的开关 as the correct noun phrase (Verified, hanyuguide.com). Everyday speech favours 灯的开关 or just 开关 (Opinion). Optional: 发现 ("discover") instead of 找到 fits a baby's discovery, Opinion.
- Punctuation: full-width 。 with no space (Verified, Wikipedia "Chinese punctuation"). The test also forbids ASCII "." and spaces here.
- Product question, not a translation question: Simplified or Traditional? BRIEF decision 6 says "Chinese as characters" and no more. Taiwan and Hong Kong families expect Traditional. Founder or product to decide; the line must follow the decision.

**French.**
- Grammar: passé composé with avoir. The participle agrees with a direct object only when it comes before the verb, and never with the subject (Verified, fr.wikipedia "Accord du participe passé en français": "s'accorde ... avec son objet direct quand celui-ci le précède"). Here l'interrupteur follows, so trouvé is invariable and the line is neutral. Warning for future sample lines: avoid être verbs (tu es monté(e), tu es allé(e)); they expose the child's gender.
- Noun: Larousse defines interrupteur as an electrical connection device (Verified, truncated page). In a home, l'interrupteur alone means the light switch; "de la lumière" would sound heavier (Opinion). Dropping "light" is fine.
- Typography: French normally uses the typographic apostrophe ’, but the brand rule requires straight quotes, so keep '. No ! or ? is used, so no French spacing issue arises (those need a no-break space before them).

**Arabic.**
- Gender: unvocalised, 1st person وجدتُ, 2nd masculine وجدتَ and 2nd feminine وجدتِ are written identically (Verified, Wikipedia "Arabic verbs": "In unvocalised Arabic, katabtu, katabta, katabti and katabat are all written the same: كتبت"). So the page text is neutral toward the child. Never add diacritics to this verb.
- Problem: the same fact means the line can be read as "Today I found the light switch." The s08 chip has no surrounding letter to disambiguate. Proposed: اليوم أنت وجدت مفتاح الضوء. (أنت is also written the same for masculine and feminine, so it stays neutral). The pronoun adds mild emphasis, which suits affectionate speech (Opinion).
- Noun and register: Wiktionary and Almaany were unreachable. The only source I opened lists مفتاح نور with Egyptian audio (noun.town, a learner site, Low). Regional choices (النور, الضوء, الكهرباء, الإضاءة) are not verified by me. A native speaker must pick Modern Standard or a dialect and the noun; the text a speech model writes for a dialect speaker is itself a product decision.
- Layout: the element needs `dir="rtl"` and `lang="ar"` or the final full stop lands on the wrong side (Inferred from the bidi algorithm; the data already carries `dir`). The scene owner should check this in the screenshot at 390 wide, and use an OFL Arabic font (TEAM.md).

**Portuguese.**
- Grammar: pretérito perfeito simples, third person used as polite or neutral address (você). No gender marks. Neutral.
- Variant: você is the default familiar address in Brazil; in Portugal tu or the person's name is usual and você can sound too informal (Verified, Wikipedia "Portuguese personal pronouns"). So this line is Brazilian Portuguese. A Portugal parent would say "Hoje encontraste o interruptor da luz." Decide pt-BR or pt-PT (or label it).
- Noun: Priberam defines interruptor as "Aparelho que suspende a passagem de uma corrente eléctrica" (Verified, dicionario.priberam.org). "da luz" and "de luz" are both heard (Opinion).

**Cross-cutting.**
- The language labels (`name`) are English only. Consider showing each language's own name (हिन्दी, Español, 中文, Français, العربية, Português) beside it; Opinion, standard in language pickers.
- Primary references a native reviewer should use (none opened by me): RAE Diccionario de la lengua española; Académie française Dictionnaire and the OQLF Banque de dépannage linguistique for participle agreement; Houaiss or Priberam for Brazilian Portuguese; Hans Wehr for Arabic; 现代汉语词典 (Commercial Press) for Mandarin; the Central Hindi Directorate orthography standard for Hindi.

**A native speaker must confirm before launch (each, ideally a parent of a young child):**
1. Hindi: तुम versus तू; लाइट का स्विच versus बत्ती का बटन; the ढूँढ spelling; outcome of D-031 on Latin versus Devanagari for English words.
2. Spanish: interruptor versus apagador or llave de la luz for the US audience; tú versus vos.
3. Mandarin: 电灯开关 versus 灯的开关; 找到 versus 发现; the Simplified versus Traditional decision.
4. French: that l'interrupteur alone reads naturally; Canadian reading if relevant.
5. Arabic: register and noun; whether وجدت reads as "you" with or without أنت; correct rendering of the full stop in the real layout.
6. Portuguese: pt-BR versus pt-PT.
7. All: that none of the six reads as addressed to a boy or a girl.

## 3. Claims audit: `site.ts` against BRIEF-2026-10-03 and DECISIONS.md

Status: **Supported**, **Qualify** (true, wording gap), **Overstated**, **Unsupported**. Line numbers are in the file named.

**Which source wins.** `docs/agents/BRIEF-2026-10-03.md` (v1.0 facts) is the newest and is what `site.ts` is written to. `docs/DECISIONS.md` and `docs/prd/PRD.md` 1.3 still describe an older plan in places: D-002 (family contributors and grandparents in the app at v1.0), D-032 (shared voice, pending the founder), D-044 (Google sign-in in v1.1; BRIEF decision 4 has it at launch). Where they disagree I follow the BRIEF and say so. The owner of DECISIONS.md should supersede D-002 and D-032 with dated entries.

| # | Claim in site.ts | Source line | Status |
|---|---|---|---|
| 1 | s04: "Transcription happens on your phone" | PRD.md:68 ("on-device transcription"); PRD.md:113 and subprocessors.md:27 (no server transcription in v1.0); ADR 0001:23-24 (whisper.rn on device) | **Qualify.** True for v1.0 as planned. The brand owner decided the wording "by default" (PRD.md:615, K-21; `packages/content/src/site.en.ts:14`), and privacy-policy.md:76 still describes optional cloud transcription for v1.1. Before the 574 MB model finishes downloading, spoken letters are saved and transcribed later (PRD.md:782-783) |
| 2 | s04: "only fixes slips, like a misheard word" and the demo `slip` (light snitch to light switch) | `packages/core/src/verify.ts:250-274`: a `stt_fix` must replace with a dictionary term, and a lowercase word is "probably said as heard"; `types.ts:16` | **Unsupported as a machine fix.** The engine would reject "snitch" to "switch" (`stt_fix_not_dictionary`). Machine fixes of words are limited to names from the parent's words list; strings.en.ts:43 says "a misheard name". A word the engine doubts is flagged for the parent to tap and fix (`types.ts:38`, `appFixHint`). See fix A |
| 3 | s04: "We never rewrite your words." | BRIEF decision 7 (line 18); CLAUDE.md constitution | Supported |
| 4 | meta: "keeps every word exactly as you said it" | VOICE.md (approved line "Kept exactly as you said it"); CLAUDE.md (raw transcript immutable, every edit stored and reversible); BRIEF decision 7 (um and stumbles are removed) | Supported (brand-approved). Strictly, fillers are removed and punctuation added, which s04 says. Low risk |
| 5 | s05: "The recording is kept with every letter." | PRD C-habits:85 (play original audio, free); privacy-policy.md:166; BRIEF decision 8 (line 19, original never altered); `site.en.ts` FAQ ("attached to its letter") | **Qualify.** Spoken letters only (typed letters have none). Kept on the phone that made it; without backup, a lost phone loses it (terms-of-service.md:207, C-habits:98). D-033 (iCloud device backup) is still "Recommended (needs founder OK)". See fix C |
| 6 | s06: filed "under Meera's age that month and signed with your name" | PRD.md:22 ("files the letter by the child's month of age") | Supported |
| 7 | s06: "Both parents write in the same book." | BRIEF decision 5 (line 11, co-parent only); DECISIONS.md:115 (D-008) | Supported. Each parent needs the app and an account |
| 8 | s07: "Open any letter and hear it in the voice that said it" | See section 4 | **Partly unsupported** at v1.0 |
| 9 | s08: the seven languages, "each written in its own script" | BRIEF decision 6 (lines 12-15) | Supported. Qualify: Hindi script default is open (D-031); "Mandarin" does not say Simplified or Traditional. Availability is promised, not accuracy: on-device model quality for Hindi and Arabic is unproven (ADR 0001 WER figures; BL-043 experiment) |
| 10 | s09: "Only the people you invite can read your letters." (also s03 `appAudience`) | privacy-policy.md:24 and :121 ("A very small number of our staff could technically read them"); :131 (legal process); PRD.md:880 (K-11, K-20, K-21 replaced absolute privacy claims) | **Overstated.** True of sharing, not of access. See fix D |
| 11 | s09: "No ads. We never sell your data." | BRIEF decision 11 (line 22); privacy-policy.md:21 | Supported |
| 12 | s09: "Your letters are never used to train models." | BRIEF decision 11; terms-of-service.md:113; privacy-policy.md:21 | Supported. One launch gate still open: privacy-policy.md:333 (CN-7) and subprocessors.md:55 (PowerSync has no written no-training clause, only if D-023 keeps it; Vercel needs a paid plan with training opted out; Sentry settings) |
| 13 | s09: "Export your whole book, free, any time." | terms-of-service.md:205 (12.3); C-habits:85 | Supported |
| 14 | s09: "Delete a letter or a recording whenever you like." | ENGINEERING_REQUIREMENTS.md:238; privacy-policy.md:163, :166 | Supported |
| 15 | s10: "Free to write, read and keep"; "Writing, reading, playing your recordings and export are free, always." | terms-of-service.md:211-219 (13.1 to 13.3); PRD.md:30; C-habits:84-85; DECISIONS.md:116 | Supported. "Always" is a binding promise; counsel's note at terms-of-service.md:221 is still open |
| 16 | s10: Plus "from $3.99 a month" | BRIEF decision 3 (line 9); DECISIONS.md:119 (D-012); terms-of-service.md:227 | Supported. "From" understates the choice: $29.99 a year is about $2.50 a month. US dollars, US store only. Prices should be one constant, because the in-app rule is store-localised prices (ENGINEERING_REQUIREMENTS.md:361) |
| 17 | s10: Plus "adds backup for every recording" | subscription-terms.md:23; terms-of-service.md:225; C-habits:87. Against it: BRIEF decision 9 (line 20, "no audio upload in v1.0"); ROADMAP.md:41 and :100 (the only upload pipeline, M7, depends on D-032); BRIEF decision 3 (line 9, "server code does not enforce Plus") | **Unsupported at v1.0.** Without audio upload there is no backup to sell, and a server cannot gate it. See fix B |
| 18 | s10: Plus adds "books for more children" | DECISIONS.md:121 (D-014); PRD.md:31; subscription-terms.md:25 | Supported. BRIEF decision 3 means client-side gating only, which does not change the claim |
| 19 | cta and s11: "Free on iPhone", "Coming soon to iPhone", "Early Letters is coming to iPhone" | DECISIONS.md:120 (D-013, US App Store first); terms-of-service.md:227 ("offered in the United States"); LEGAL-REQ-058 | **Qualify.** True for US iPhones only. The site is worldwide and does not say so. See fix E |
| 20 | notify: "One email when Early Letters is ready." and "We will write once" | `src/lib/notify/provider.ts` (stores only the address as one Resend contact; no welcome email) (Verified) | Supported by the code. It is an operating promise: nobody may add a second mailing. Put it in the runbook |
| 21 | notify: "We never share your address." | provider.ts (address only, no name, no IP). Resend is a service provider | **Qualify.** Accurate in the legal sense. subprocessors.md:32 still shows `{EMAIL_PROVIDER}` (to choose) while BRIEF decision 13 names Resend; the published Subprocessors page needs the row, and /privacy needs to cover the waitlist (privacy-policy.md:39 mentions it) |
| 22 | footer: hello@earlyletters.com, /privacy, /terms, /health-privacy, /subprocessors | BRIEF decision 13 (line 24) | Supported |
| 23 | footer: /delete-account | DECISIONS.md:48 (D-042, "Recommended (counsel confirms)"); page exists at `src/app/(legal)/delete-account` | Supported as a route. Not in the BRIEF decision 13 list; keep only if D-042 stands |
| 24 | s03: "Short or long, both belong." | No recording cap found (TDD 03:175 decodes up to 30 minutes; PRD.md:762 caps only server transcription) | Supported (Inferred) |

### Proposed exact fixes to `site.ts` (coordinator applies; none are required for the tests to pass)

**A. s04 support and the demo slip.** Choose one:
- Preferred, so the film shows only what the engine does. Text: `support: 'Transcription happens on your phone by default and only fixes slips, like a misheard name or a stray um. We never rewrite your words.'` Demo slip: a name from the words list, for example `slip: { heard: 'Mira', fixed: 'Meera' }`, placed where the engine accepts it (a mishearing the parent taught, or a capitalised near-sounding name that does not start a sentence), and run through `verifyEdits` before it goes in the film.
- Or keep "light snitch" and change what the scene shows: the app flags "snitch" and the parent taps it and types "switch" (`appFixHint` already says "Tap a word to check it"). Then the support line should end "...and lets you fix a word with a tap." and `sampleLetter.slip`'s comment should say the parent makes the change.

**B. s10 support.** Remove the recording backup until audio upload is confirmed for v1.0: `support: 'Writing, reading, playing your recordings and export are free, always. Plus is optional, $3.99 a month or $29.99 a year, and adds books for more children.'` This also fixes the "from" wording in row 16. Do not add themes (ROADMAP.md:131 puts them in v1.2 or later) or Read together (word highlighting is v1.1, BRIEF decision 9). The founder or PM should send the final v1.0 Plus list and update subscription-terms.md:23-26, which must match the in-app sheet (Apple 3.1.2(c)).

**C. s05 support.** `support: 'Every letter you speak keeps its recording. One day Meera can hear how you sounded tonight.'`

**D. s09 first point and s03 `appAudience`.** `'Your letters are shared only with the people you invite.'` and `appAudience: 'Shared only with people you invite'`. Same warmth, and it is the claim the Privacy Policy makes.

**E. cta eyebrows.** `eyebrow: 'Coming soon to iPhone in the US'` and `eyebrow: 'Free on iPhone in the US'`, or one line in the footer or the notify note.

**F. s07.** See section 4.

## 4. Is "Open any letter and hear it in the voice that said it" true for free users at v1.0?

**Short answer: true for a free user playing their own spoken letters on the phone that recorded them. Not true as written for "any letter".**

What holds:
- Plain playback of a recording is free and never limited: "Playing any single recording is always free" (PRD.md:279, PRD-REQ-020); "reading your letters and playing their recordings" (terms-of-service.md:211-213, 13.1); Read together's 3 free sessions are a separate, limited feature (DECISIONS.md:116, D-009; C-habits:88). So a free user is not blocked by the 3-session limit.
- It plays the original: BRIEF decision 8 says the original recording is never altered and the person can always hear it.
- Word highlighting (which the 3-session limit counts, DECISIONS.md D-037) is deferred to v1.1 anyway (BRIEF decision 9). S07 does not claim it. Good.

What does not hold:
1. **A co-parent's letters on the other parent's phone.** BRIEF decision 9 (line 20): "family members hearing each other's recordings (no audio upload in v1.0)". Papa's recording lives on Papa's phone. In the same book, Mama sees Papa's words but cannot hear his voice. S06 sells exactly this two-parent book, then S07 says "any letter". D-032, which would fix it, is unanswered and BRIEF decision 9 defers it (ROADMAP.md:100: "voices across phones in v1.1").
2. **Typed letters** have no voice.
3. **A lost or replaced phone** loses audio that was never backed up (terms-of-service.md:207, C-habits:98), and backup is not available at v1.0 (row 17).

Proposed s07 support, true as written and still warm: `support: 'Open a spoken letter and hear it in the voice that said it, with the words right there on the page.'` Keep the headline "Said once. Heard for years." If the founder approves D-032 and the audio upload ships in v1.0, "Open any letter" can come back for spoken letters in a shared book.

## 5. Other observations (not failures)

- **Brand name is hardcoded eight times in `site.ts`** (lines 30, 32, 36, 49, 63, 148, 157, 158). CLAUDE.md says the public name lives only in `packages/brand/index.ts`; E1's copy files already interpolate `brand.name`. The test guards the spelling, not the hardcoding, so it passes. Suggest template literals from `brand.name` (coordinator).
- **The child's name is the founder's real daughter's** (TEAM.md decision, founder's choice) and appears in public copy. CLAUDE.md says real family details never go in code, tests or fixtures. The founder's decision stands for the site; flagged so the exception is recorded. My test file contains no real name.
- **Mock app strings that do not exist in `packages/content/src/strings.en.ts`:** "Save letter" (app: "Save"), "Tap a word to check it", "Filed in Month 9", "Hear this letter", "Only people you invite can read this", the dateline "Month 9, Week 2, Tuesday" (D-028 says dates follow the device locale). "Speak", "Type", "Done" and "Pause" match. If the film is meant to show the real app, move these into `packages/content` or match the app.
- **Button length:** "Tell me when it's ready" is 23 characters; the product rule for buttons is 22 (`rules.test.ts:129-131`). Fits the header only if the layout allows it.
- **Meta description** is 163 characters; most results truncate near 160. Opinion.
- `packages/content/src/site.en.ts` (the product's older website copy) still promises grandparents, Hindi and English "in the same sentence", Read together with highlighting, and recording backup. It is not the web app's copy, but it contradicts BRIEF decision 5, 6 and 9. Its owner should reconcile it.

## 6. Requests to the coordinator

1. Decide fixes A to F (F is in section 4) and edit `site.ts`; then run `npm test -w @scribe/web` again (no rule should fail).
2. Ask the founder or PM for the v1.0 Plus feature list (row 17) and the Simplified or Traditional and pt-BR or pt-PT decisions (section 2).
3. Get native-speaker review for each language before launch (checklist in section 2).
4. Optional: add `apps/web/vitest.config.ts` with the `@` alias so future tests can import `@/` modules. BR1's test does not need it.
