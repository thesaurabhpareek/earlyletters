/**
 * The faithful-clean pipeline: raw transcript in, cleaned text plus a full,
 * reversible record of every machine edit out.
 *
 * Order: dictionary corrections -> fillers -> repeats -> (optional) model
 * edits -> verifier -> apply -> character normalization.
 *
 * The raw transcript is never modified. Everything here is pure and
 * deterministic for the same inputs, so results are reproducible years later.
 */
import type { CleanResult, DictionaryTerm, Edit, EditLevel, Flag } from './types';
import { fillerEdits, repeatEdits, repeatSuggestionEdits } from './rules';
import { overlaps } from './protect';
import { applyEdits, checkEdit, verifyEdits } from './verify';
import { compileRules, type LanguageRules } from './lang/engine';
import { dictionaryEditsFor, protectedSpansFor } from './lang/dictionary';
import { scriptEdits } from './lang/script';
import type { LanguageCode, ScriptCode, TextRulesPack } from './lang/types';

/**
 * Bump when cleaning behaviour changes. Stored on every entry so any
 * entry can be re-derived with the exact engine that produced it.
 */
export const ENGINE_VERSION = 8;
// 2 (2026-10-02): phrase restarts ("like a like a") and subject "you you"
//   collapse; "in in", "so so" become suggestions; "what it was was" kept.
// 3 (2026-10-03): verifier hardening (BL-064, TDD 03 7.1). Refuses edits that
//   change negation, tense, modals, contractions, numbers, quotes, sentence
//   type (? !), names or pronouns outside the dictionary, mid-sentence
//   capitals, and removals that are emphasis or a complete phrase said twice.
//   Rules-only output for every existing fixture is unchanged.
// 4 (2026-10-03): languages (ADR 0014). Words keep their combining marks
//   (Devanagari vowel signs, Arabic harakat, decomposed accents), so a
//   punctuation edit can no longer swap मैं for में, si for sí or add
//   harakat; full-width and Arabic ? ! count as mood marks; « » 「 」 『 』
//   quotes are protected. Rules come from the entry's language pack;
//   English output is unchanged (golden master over the fuzz corpus).
// 5 (2026-10-04): Unicode safety (CORE-01, PMOB-01), on top of 4. Words
//   compare in NFC, so a decomposed accent repaired to its precomposed form
//   is accepted and a dropped accent is not. Any edit boundary that cuts a
//   letter from its marks (before a vowel sign, after a virama, inside a
//   surrogate pair) is refused as splits_word. Devanagari negations (नहीं,
//   नही, मत, ना, न) are guarded. Dictionary terms no longer match the start
//   of a longer Indic word. ZWJ and ZWNJ stay inside a word. Pinned by
//   test/golden.test.ts (CORE-08).
// 6 (2026-10-15): the R-01 launch gate for the alpha (WP-F06-02, WP-F06-03).
//   Every change refuses more or keeps more as said: engine 6 accepts no
//   edit that engine 5 refused.
//   - No edit may add, remove or move a direction mark, joiner or other
//     invisible character (new reason changes_invisible, R-01 D4).
//   - Every Unicode quotation style is counted and protects its words from
//     removals, dictionary fixes and agreement (R-01 D7).
//   - Agreement accepts only the pack's closed verb and article groups, never
//     the generic -s rule, so a noun's number never changes (R-01 D9).
//   - A filler that is part of a word is not a filler: "uh-uh" (no),
//     "mm-hmm" (yes), "uh-oh", and two fillers with only a space between
//     ("uh uh"). No removal takes part of a hyphenated word (R-01 D6).
//   - A dictionary term spelled like an everyday word (the pack's new
//     meaning.commonWords, or a protected word) gets no case-only fix: "I hope"
//     and "we will" stay as said for a child named Hope or Will (R-01 D10).
//   - One family name never becomes another: a fix whose original is another
//     term, or another term's heard-as, is refused (R-01 D13).
//   - A taught heard-as that is a negation, modal, number, lone pronoun or
//     function word, or a kinship word taught to a child, nickname, place or
//     word term, is never applied ("no" taught for Noa; found 15 Oct).
//   - A dash between two numbers becomes a hyphen, not a comma, so "2 – 3
//     hours" is no longer "2, 3 hours" (found 15 Oct; R-01 D14 remains open
//     for the untracked character changes themselves, WP-F06-05).
//   - The English-only punctuation provider adds no "." after 。 ？ ！ ؟ (3 Oct).
//   - Also in 6, listed on review (23 Oct): the house rule's tidy steps keep
//     a match that would join, split or change a number (text.ts
//     replaceKeepingNumbers); a name fix may not change ? or ! (checkSttFix);
//     a filler the rules keep holds its sentence open for the capitals check
//     (lang/engine.ts startsSentence); no punctuation or whitespace edit
//     splits a hyphenated word (verify.ts splitsHyphenated).
//   Amended 2026-10-23, before any letter is saved under 6 (D-112 and the
//   #179 review): "mm" is offered in Review, never removed (fillers.suggest;
//   F06-REQ-010 amendment pending); commonWords drops mason, carter, cooper,
//   hunter and rowan; the house rule keeps a soft hyphen (U+00AD) as it
//   keeps U+FEFF; the name-signal test in checkSttFix skips a kept filler
//   pair too (startsSentenceSkippingFillers). The claim above holds on the
//   reviewer's differentials, not on a proof: 37 letters gave 0 of 271,598
//   after that fix; 9 more letters then gave 52 cases, all one shape, "mm"
//   leaving the auto list (a name fix after "mm"; a repeat or false start
//   taking one "mm" of a pair). Closed the same day: the skip covers offered
//   fillers too, and a repeat or false start made only of filler sounds is
//   refused. No other shape is known. From the tests-lens review, same day:
//   quotation marks are compared in order, so a swap of one mark for another
//   (U+201C to U+00AB) is changes_quotes; and no punctuation edit leaves a
//   doubled end mark the raw did not have, by replacement or insertion ("no..").
//   Golden corpus: every engine 5 case is unchanged; R-01 cases added and
//   recorded in golden/engine-v6.json. Every engine-5 letter saved in a
//   development build keeps its text (no saved letter is ever re-cleaned);
//   WP-F06-12 audits their stored edits once it ships.
// 7 (2026-10-23): end marks, the follow-up to the #179 reviews. Every change
//   is meant to refuse more. The claim that engine 7 accepts no edit engine 6
//   refused rests on a differential, not on a proof: 3,429,419 single edits
//   at end marks and removals over the test-suite strings, 0 accepted by 7
//   and refused by 6. The shapes found on the way are refused again: a
//   deleted space in "no. ." giving "no.." (#249 review N3), and the later
//   mark turned into a copy of the first ("।." to "।।").
//   - No edit puts an end mark next to one already said, the same mark or
//     another, in any script: "." after "?", "!", a danda, 。 ？ ！ or ؟
//     ("more?.", "it!.") is refused as changes_sentence_type (#179 re-check
//     Note E), and so is a run that grows ("no..." to "no...."). A mark
//     behind spaces, closing quotes, brackets or invisible characters still
//     touches. In a run of touching marks only a later mark may be removed
//     or changed; the first mark said stands ("हँसी।." may lose the ".",
//     never the danda; the same for U+3002 and U+2026), so a "?" or "!"
//     said first stays (#249 review N2).
//   - The check reads the run of marks around the edit, up to the first
//     letter or the text's edge, instead of a fixed two-character window: a
//     run said elsewhere ("Yes..no.") no longer excuses a new pair, and a
//     mark two closers away is seen.
//   - Accepted edits are checked together too: a removed trailing filler and
//     a final "." after it gave "She said no.." in the rules-only clean
//     (cleanRulesOnly); the "." is refused, the removal stands. Any edit,
//     not only punctuation, is refused if it brings two marks together.
//   - The filler rule: a filler said as its own sentence after an invisible
//     character or an ellipsis character ("waited[U+2026] um.") goes with its
//     own end mark, as after a bare mark; engine 6 left "waited....". The
//     wider removal is one engine 6's verifier accepts. After a closing quote
//     or bracket the filler is not a sentence of its own: the mark before
//     belongs to the quoted or bracketed words (#249 review F1).
//   - No removal labelled filler, repeat or false start changes how a
//     sentence ends: it takes no "?" or "!" in any script, and an end mark
//     only with a sentence of its own after a finished one ("door. Hmm.").
//     'Did she say "no." um?' and "Did you wait... um?" keep their "?" (the
//     second lost it in engine 6), and a filler question of its own ("Hmm?")
//     now stays as said (#249 review F1).
//   - A mark inside brackets does not touch the one after them: "We went
//     home (it rained!)." keeps the sentence's own "." (#249 review F1, N1).
//   - The word window steps a code point at a time, so punctuation can no
//     longer split a word written outside the Basic Multilingual Plane
//     (Adlam).
//   Golden corpus: every engine 6 case reads the same; two cases added.
// 8 (2026-10-24): refusals only, the follow-up to the #257 reviews. Every
//   change refuses more. The claim that engine 8 accepts no single edit
//   engine 7 refused rests on the differential, not on a proof: over the
//   1,667 test-suite strings, 620,743 single edits, 0 accepted by 8 and
//   refused by 7 (66 the other way); with each of the 15 quotation marks
//   below put after every end mark, 4,764,941 edits, 0 (75,915 the other
//   way). The differential makes no case edits and no name fixes, so the
//   first and third rulings below rest on their tests and the golden
//   corpus. Every engine 7 golden case reads the same.
//   - Words are read as they are seen. An invisible character that is not
//     itself a letter or mark (direction marks, joiners, zero-width space,
//     word joiner, BOM, soft hyphen, tags) joins and splits nothing: no edit
//     may delete the space beside one so that two words touch ("Asha" U+200B
//     " slept" to "Asha" U+200B "slept"), as paragraph, punctuation, removal
//     or name fix (seed 20261015 run 81642, Arabic with U+200D; #257 review
//     A, section 2). Engines 6 and 7 read the invisible character, not the
//     letter behind it. Nor may an edit start or end inside a word as it is
//     seen, or put a space or a mark into one. The same check steps a code
//     point at a time, so the space between two words written outside the
//     BMP (Adlam) may not be deleted either.
//   - An end mark put behind any Unicode quotation mark still touches the
//     mark said before it. Engine 7 bridged only some of them and accepted a
//     "." behind U+2018, U+201A and 13 more (QUOTE_BRIDGES in verify.ts).
//     Those 15 are read both ways, as walls (engine 7) and as bridges, and an
//     edit that either reading refuses is refused: as bridges alone they
//     would also have let a mark move across one (#257 review A, section 1).
//   - A name fix or agreement may not replace part of a hyphenated word: a
//     taught heard-as "uh" no longer turns "Uh-uh" (no) into "Usha-Usha" on
//     the rules-only path, nor "mm" turn "Mm-hmm" (yes) into "May-hmm", nor
//     agreement "A-ha" into "An-ha" (seed 2 run 84272).
//   - verify.ts exports its end-mark and bridge sets as frozen lists of
//     strings, no longer as RegExp objects an importer could recompile.
//   Rulings on #262, the same release (24 Oct):
//   - A capital is raised only at a sentence start that a removal in the
//     same edit set made, never past a filler that stays: the capitals
//     check (raisedOffSentenceStart) no longer skips fillers. With "Um"
//     locked, "Um, hope is here." no longer becomes "Um, Hope is here.", and
//     cleanRulesOnly leaves "um, so we went home" lower case (seed 20261003
//     run 14032).
//   - No mark moves inside a quote to sit beside the mark said there: "no."
//     U+201D "." no longer becomes "no.." U+201D (a bare pair, nothing at
//     all between two end marks, is counted too).
//   - A name fix never replaces a word the engine classes as a filler: a
//     taught heard-as "uh" no longer turns "Uh, she came over." into "Usha,
//     she came over.".
//   Golden corpus: every engine 7 case reads the same; six cases added.

export interface CleanOptions {
  level: EditLevel;
  dictionary: DictionaryTerm[];
  /** Phrases the parent locked in review. */
  locked?: string[];
  /**
   * Extra deterministic edits from rule providers in this package (e.g.
   * RulePunctuationProvider). Verified like every other edit.
   */
  ruleEdits?: Edit[];
  /** Edits proposed by a model, if experiment 3 shows one is needed. */
  modelEdits?: Edit[];
  modelFlags?: Flag[];
  /**
   * The entry's spoken language (ADR 0014). Default English. Every word
   * table, sentence mark and the tokenizer come from this language's rules.
   */
  language?: LanguageCode;
  /**
   * That language's text-rules pack, already checked by validatePack. Only
   * its vetted tables are used. Without a pack, a language other than
   * English runs in punctuation-safe mode: dictionary fixes, punctuation
   * and paragraphs only.
   */
  pack?: TextRulesPack | null;
  /** The author's chosen script (Chinese: 'Hans' or 'Hant'). Characters are converted only when this is set. */
  script?: ScriptCode;
  /** Already compiled rules; overrides language, pack and script. */
  rules?: LanguageRules;
}

/** The language rules for a clean call: compiled once per pack and script, then cached. */
export function rulesFor(opts: Pick<CleanOptions, 'language' | 'pack' | 'script' | 'rules'>): LanguageRules {
  if (opts.rules) return opts.rules;
  return compileRules(opts.language ?? opts.pack?.language ?? 'en', opts.pack ?? null, opts.script ? { script: opts.script } : {});
}

export function faithfulClean(raw: string, opts: CleanOptions): CleanResult {
  const { level, dictionary, locked = [] } = opts;
  const R = rulesFor(opts);

  // Dictionary fixes are verified against quotes and locked phrases only;
  // the dictionary terms themselves are their targets.
  const lockedAndQuoted = protectedSpansFor(raw, [], locked, R);
  const allProtected = protectedSpansFor(raw, dictionary, locked, R);

  const dict = dictionaryEditsFor(raw, dictionary, R);
  const rules: Edit[] = [
    ...(level === 'clean' ? [...fillerEdits(raw, R), ...repeatEdits(raw, R)] : []),
    ...scriptEdits(raw, R, allProtected),
    ...(opts.ruleEdits ?? []).map((e) => ({ ...e, source: 'rule' as const })),
  ];
  const model = (opts.modelEdits ?? []).map((e) => ({ ...e, source: 'model' as const }));

  const dictResult = verifyEdits(dict, { raw, level, dictionary, protectedSpans: lockedAndQuoted, rules: R });
  const restCtx = {
    raw,
    level,
    dictionary,
    // dictionary fixes already accepted must not be blocked by term spans they create
    protectedSpans: allProtected.filter((p) => !dictResult.accepted.some((d) => d.start === p.start)),
    rules: R,
  };
  const restResult = verifyEdits([...dictResult.accepted, ...rules, ...model], restCtx);

  const applied = restResult.accepted;
  const rejected = [...dictResult.rejected, ...restResult.rejected];

  // Offered, not applied: only ones the verifier would accept right now and
  // that do not collide with an applied edit (an accepted one drops out here).
  // Fillers that may carry meaning ("mm" for yes) are offered the same way.
  const offered = level === 'clean' ? [...repeatSuggestionEdits(raw, R), ...fillerEdits(raw, R, true)].sort((a, b) => a.start - b.start) : [];
  const suggestions = offered.filter(
    (s) => checkEdit(s, restCtx) === null && !applied.some((a) => overlaps(a, s) || a.start === s.start),
  );

  return {
    text: R.normalizeFinal(applyEdits(raw, applied)).trim(),
    applied,
    rejected,
    flags: opts.modelFlags ?? [],
    modelChangeRatio: restResult.modelChangeRatio,
    suggestions,
  };
}

/**
 * Options that apply the suggestions the parent tapped. They go in as rule
 * edits, so they are verified again with everything else; nothing bypasses
 * verifyEdits.
 */
export function acceptSuggestions(opts: CleanOptions, accepted: Edit[]): CleanOptions {
  return { ...opts, ruleEdits: [...(opts.ruleEdits ?? []), ...accepted.map((e) => ({ ...e, source: 'rule' as const }))] };
}

/**
 * Revert one machine edit: re-derive the text from raw without it.
 * Used by the review screen's "tap an underline to undo".
 */
export function withoutEdit(raw: string, applied: Edit[], index: number, rules?: LanguageRules): { text: string; applied: Edit[] } {
  const remaining = applied.filter((_, i) => i !== index);
  return { text: finalText(raw, remaining, rules), applied: remaining };
}

/** The text a parent sees for these applied edits: the review screen's display text, language-aware. */
export function finalText(raw: string, applied: Edit[], rules?: LanguageRules): string {
  return (rules ?? rulesFor({})).normalizeFinal(applyEdits(raw, applied)).trim();
}

/** A run of display text; `edit` is set when the run is a machine edit's result. */
export interface Segment {
  text: string;
  /** Index into `applied`, or null for the person's untouched words. */
  edit: number | null;
}

/**
 * Split the cleaned text into the person's own words and the machine's
 * edits, so the review screen can underline every change. Joining the
 * segments' text always equals faithfulClean(...).text (before trim).
 * A pure deletion becomes an empty-text segment placed where the words were.
 */
export function segments(raw: string, applied: Edit[], rules?: LanguageRules): Segment[] {
  const R = rules ?? rulesFor({});
  const sorted = applied.map((e, i) => ({ e, i })).sort((a, b) => a.e.start - b.e.start);
  const out: Segment[] = [];
  let pos = 0;
  for (const { e, i } of sorted) {
    if (e.start > pos) out.push({ text: raw.slice(pos, e.start), edit: null });
    out.push({ text: e.replacement, edit: i });
    pos = e.end;
  }
  if (pos < raw.length) out.push({ text: raw.slice(pos), edit: null });
  return out.map((s) => ({ ...s, text: R.normalizeFinal(s.text) }));
}
