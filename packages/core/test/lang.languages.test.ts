/**
 * Every v1.0 language, rules as data (ADR 0014). For each language:
 * what the pack does today (punctuation, script, normalisation), what it
 * does once a native speaker signs the word tables off ("vetted", built
 * here by raising the review status of a copy), and hostile edits that must
 * be refused either way: negation removal, number change, name swap.
 *
 * Constitution: the machine may remove and repair. It may never add meaning.
 * Fictional family only ("Asha", written in each script).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkEdit,
  cleanRulesOnly,
  compileRules,
  describeEdit,
  faithfulClean,
  finalText,
  soundAlikeTerms,
  toNFC,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditLevel,
  type LanguageCode,
  type LanguageRules,
  type ScriptCode,
  type TextRulesPack,
} from '../src';

const DIR = join(__dirname, '../../../packs/text-rules');
const load = (l: LanguageCode) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;
/** The pack as it will be once a native speaker signs its word tables off. */
function vetted(l: LanguageCode): TextRulesPack {
  const p = load(l);
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) p[k].review = { status: 'native-reviewed', by: 'test' };
  return p;
}

function edit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source };
}

const ctx = (raw: string, rules: LanguageRules, dictionary: DictionaryTerm[] = [], level: EditLevel = 'clean') => ({
  raw,
  level,
  dictionary,
  protectedSpans: [],
  rules,
});
/** null when applied, else the reject reason. */
const verdict = (raw: string, e: Edit, rules: LanguageRules, dictionary: DictionaryTerm[] = []) => {
  const r = verifyEdits([e], ctx(raw, rules, dictionary));
  return r.accepted.length ? null : r.rejected[0].reason;
};
const clean = (raw: string, language: LanguageCode, pack: TextRulesPack | null, dictionary: DictionaryTerm[] = [], script?: ScriptCode) =>
  cleanRulesOnly({ raw, level: 'clean', dictionary }, { language, pack, script });

describe('regressions: meaning-changing edits the English-only engine used to accept', () => {
  // Found 3 Oct 2026 by probing the engine before packs: each was APPLIED.
  it.each<[string, string, string, string]>([
    ['मैं घर जाता हूँ।', 'मैं', 'में', 'I -> in (vowel signs were not letters)'],
    ['वह खुश है।', 'है', 'हो', 'is -> be'],
    ['Lo hago si quieres.', 'si', 'sí', 'if -> yes (decomposed accent)'],
    ['他来了。', '。', '？', 'statement -> question (full-width)'],
    ['هل أنت بخير.', '.', '؟', 'statement -> question (Arabic mark)'],
    ['كَتَبَ الولد', 'كَتَبَ', 'كُتِبَ', 'he wrote -> it was written (harakat)'],
  ])('refused with no language set: %s %s -> %s (%s)', (raw, from, to) => {
    expect(verdict(raw, edit(raw, 'punctuation', from, to), compileRules('en'))).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ Hindi */
describe('Hindi', () => {
  const pack = load('hi');
  const R = compileRules('hi', pack);
  const V = compileRules('hi', vetted('hi'));
  const DICT: DictionaryTerm[] = [{ term: 'आशा', kind: 'child', heardAs: ['आसा'] }];

  it('words keep their vowel signs, virama and nukta (NFC)', () => {
    expect(R.tokens('हिंदी में बात').map((t) => t.word)).toEqual(['हिंदी', 'में', 'बात']);
    expect(toNFC('ज़')).toBe('ज़'); // ज़ decomposes under NFC: a composition exclusion
    expect(R.key('ज़रूर')).toBe(R.key('जरूर')); // nukta ignored for table look-ups only
    expect(R.isNegation('नहीँ')).toBe(true); // chandrabindu folds to anusvara for look-ups
  });

  it('today: danda as the full stop, nothing else changes', async () => {
    const out = await clean('उम्म मैं घर जा रहा हूँ. वह खुश है', 'hi', pack, DICT);
    expect(out.text).toBe('उम्म मैं घर जा रहा हूँ। वह खुश है।');
    expect(out.applied.every((e) => e.type === 'punctuation')).toBe(true);
  });

  it('a decimal point, an ellipsis and an English sentence keep their dots', async () => {
    expect((await clean('बुखार 99.5 था. ok.', 'hi', pack)).text).toBe('बुखार 99.5 था। Ok.');
    expect((await clean('वह... सो गई', 'hi', pack)).text).toBe('वह... सो गई।');
  });

  it('a learned mishearing of a name is fixed; a near-sounding word never is (no case signal in Devanagari)', async () => {
    expect((await clean('आसा ने खाना खाया', 'hi', pack, DICT)).text).toBe('आशा ने खाना खाया।');
    expect(verdict('मेरा बच्चा', edit('मेरा बच्चा', 'stt_fix', 'मेरा', 'आशा'), V, DICT)).not.toBeNull();
  });

  it('vetted: hesitations go, "हम" (we), "हाँ" (yes) and reduplication stay', async () => {
    const out = await clean('उम्म हम घर गए, हाँ धीरे धीरे', 'hi', vetted('hi'));
    expect(out.text).toBe('हम घर गए, हाँ धीरे धीरे।');
  });

  it('hostile: negation removal, number change, name swap, vowel-sign swaps', () => {
    const raw = 'मैं नहीं जाऊँगा, माँ दो रोटी देगी।';
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', 'नहीं ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'repeat', 'नहीं ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'agreement', 'दो', 'तीन'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', 'दो', 'दो?'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', 'माँ', 'आशा'), rules, DICT)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', 'मैं', 'में'), rules)).toBe('punctuation_changed_letters');
      expect(verdict(raw, edit(raw, 'punctuation', 'नहीं', 'नही'), rules)).toBe('punctuation_changed_letters');
    }
    expect(verdict('मुझे २ खिलौने चाहिए', edit('मुझे २ खिलौने चाहिए', 'punctuation', '२', '३'), R)).toBe('punctuation_changed_letters');
  });

  it('safe mode refuses removals it cannot vet', () => {
    const raw = 'उम्म मैं मैं गया';
    expect(verdict(raw, edit(raw, 'filler', 'उम्म ', ''), R)).toBe('not_vetted_for_language');
    expect(verdict(raw, edit(raw, 'repeat', ' मैं', '', 1), R)).toBe('not_vetted_for_language');
  });
});

/* ------------------------------------------------------------------ Spanish */
describe('Spanish', () => {
  const pack = load('es');
  const R = compileRules('es', pack);
  const V = compileRules('es', vetted('es'));
  const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Asia'] }];

  it('today: ¿ ¡ on one-clause questions and exclamations, sentence case after them (RAE)', async () => {
    const out = await clean('quieres agua? sí, quiero. qué bonito!', 'es', pack);
    expect(out.text).toBe('¿Quieres agua? Sí, quiero. ¡Qué bonito!');
  });

  it('a question that starts mid-sentence is left for the parent, never guessed', async () => {
    expect((await clean('si no te gusta, por qué lo comes?', 'es', pack)).text).toBe('Si no te gusta, por qué lo comes?');
    expect((await clean('¿quieres agua?', 'es', pack)).text).toBe('¿Quieres agua?');
  });

  it('vetted: "em" goes and the opening mark moves to the first word that stays; "eh" (also a tag) is only offered', async () => {
    const v = vetted('es');
    expect((await clean('em quieres agua?', 'es', v)).text).toBe('¿Quieres agua?');
    const out = await clean('vale, eh, vamos', 'es', v);
    expect(out.text).toBe('Vale, eh, vamos.');
    expect(out.suggestions.map((s) => s.original)).toEqual(['eh, ']);
    expect((await clean('la la la, duerme', 'es', v)).text).toBe('La la la, duerme.');
  });

  it('openers must pair: added only where a clause starts and its clause ends in ? or !', () => {
    const raw = 'Quieres agua? Ya.';
    expect(verdict(raw, edit(raw, 'punctuation', 'Quieres', '¿Quieres'), R)).toBeNull();
    expect(verdict(raw, edit(raw, 'punctuation', 'Ya', '¿Ya'), R)).toBe('changes_sentence_type'); // a statement
    expect(verdict(raw, edit(raw, 'punctuation', 'agua', '¿agua'), R)).toBe('changes_sentence_type'); // mid-clause
    const asked = '¿Quieres agua?';
    expect(verdict(asked, edit(asked, 'punctuation', '¿', ''), R)).toBe('changes_sentence_type'); // never removed
    // without a vetted profile ¿ is a mood mark like any other
    expect(verdict(raw, edit(raw, 'punctuation', 'Quieres', '¿Quieres'), compileRules('es', null))).toBe('changes_sentence_type');
  });

  it('hostile: negation removal, si -> sí, number change, name swap', () => {
    const raw = 'No quiero dos, mamá dice que si vienes.';
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', 'No ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'false_start', 'No ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', 'si', 'sí'), rules)).toBe('punctuation_changed_letters');
      expect(verdict(raw, edit(raw, 'punctuation', 'si', 'sí'), rules)).toBe('punctuation_changed_letters');
      expect(verdict(raw, edit(raw, 'agreement', 'dos', 'tres'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', 'mamá', 'Asha'), rules, DICT)).not.toBeNull();
    }
    expect(verdict(raw, edit(raw, 'stt_fix', 'mamá', 'Asha'), V, DICT)).toBe('stt_fix_protected_word');
  });

  it('agreement stays off: in a pro-drop language the verb ending is the subject (habla -> hablas changes who)', () => {
    const raw = 'Ella habla mucho.';
    expect(verdict(raw, edit(raw, 'agreement', 'habla', 'hablas'), V)).toBe('not_vetted_for_language');
  });
});

/* ------------------------------------------------------------------ French */
describe('French', () => {
  const pack = load('fr');
  const R = compileRules('fr', pack);
  const V = compileRules('fr', vetted('fr'));

  it('today: narrow no-break space where a space was before ; ! ?, a no-break space before : and inside « »', async () => {
    const out = await clean('bonjour ! tu viens : oui. il a dit « salut »', 'fr', pack);
    expect(out.text).toBe('Bonjour ! Tu viens : oui. Il a dit « salut ».');
  });

  it('the quoted words themselves are still protected, and no removal may take a guillemet', () => {
    const raw = 'Elle a dit « euh salut »';
    const out = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'fr', pack: vetted('fr') });
    expect(out.text).toBe(raw);
    expect(verdict('« euh » oui', edit('« euh » oui', 'filler', '« euh » ', ''), compileRules('fr', vetted('fr')))).toBe('changes_quotes');
  });

  it('a missing space before ! is not added (Quebec style is kept), times and links keep their colon', async () => {
    expect((await clean('bonjour! il est 3:30, voir https://x.fr', 'fr', pack)).text).toBe('Bonjour! Il est 3:30, voir https://x.fr.');
  });

  it('vetted: "euh" goes, a stutter "je je" goes, "non non" stays', async () => {
    const out = await clean('euh je je pense que non non', 'fr', vetted('fr'));
    expect(out.text).toBe('Je pense que non non.');
  });

  it('hostile: dropping ne or pas, elided negation, number change, name swap', () => {
    const raw = "Je ne veux pas, papa n'aime pas les deux chats.";
    expect(R.isNegation("n'aime")).toBe(true);
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', ' ne', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'repeat', ' pas', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', "n'aime", 'aime'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'agreement', 'deux', 'trois'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', 'papa', 'Asha'), rules, [{ term: 'Asha', kind: 'child', heardAs: [] }])).not.toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ Portuguese */
describe('Portuguese', () => {
  const pack = load('pt');
  const R = compileRules('pt', pack);
  const V = compileRules('pt', vetted('pt'));

  it('today: sentence case and a final full stop only; Brazilian and European spellings are both left as said', async () => {
    expect((await clean('o bebê dormiu. o bebé acordou', 'pt', pack)).text).toBe('O bebê dormiu. O bebé acordou.');
  });

  it('respelling between Brazil and Portugal is refused (fato/facto, bebê/bebé)', () => {
    const raw = 'O bebê viu o fato.';
    expect(verdict(raw, edit(raw, 'punctuation', 'bebê', 'bebé'), R)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'stt_fix', 'fato', 'facto'), R)).toBe('stt_fix_not_dictionary');
  });

  it('vetted: "hã" goes, "né" and "tipo" stay', async () => {
    expect((await clean('hã ela é tipo linda, né?', 'pt', vetted('pt'))).text).toBe('Ela é tipo linda, né?');
  });

  it('hostile: negation removal, number change, name swap', () => {
    const raw = 'Não, a mamãe tem três filhos.';
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', 'Não, ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'agreement', 'três', 'dois'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', 'mamãe', 'Asha'), rules, [{ term: 'Asha', kind: 'child', heardAs: [] }])).not.toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ Arabic */
describe('Arabic', () => {
  const pack = load('ar');
  const R = compileRules('ar', pack);
  const V = compileRules('ar', vetted('ar'));
  const DICT: DictionaryTerm[] = [{ term: 'آشا', kind: 'child', heardAs: ['عاشا'] }];

  it('today: Arabic comma, semicolon and question mark after Arabic words; Latin text keeps its own', async () => {
    const out = await clean('كيف حالك? انا بخير, شكرا; ok?', 'ar', pack);
    expect(out.text).toBe('كيف حالك؟ انا بخير، شكرا؛ ok?');
  });

  it('tatweel leaves the final text; harakat and dialect words stay exactly as recognised (never normalised to MSA)', async () => {
    expect(finalText('جميـــل جدا', [], R)).toBe('جميل جدا');
    const dialect = 'مش عايزة تنام، بدي ماما';
    const out = await clean(dialect, 'ar', pack);
    expect(out.text).toBe(`${dialect}.`);
    expect((await clean('كَتَبَ الوَلَدُ', 'ar', pack)).text).toBe('كَتَبَ الوَلَدُ.');
    expect(R.isNegation('مش')).toBe(true);
    expect(R.isNegation('لَا')).toBe(true); // harakat ignored for table look-ups only
  });

  it('a learned mishearing is fixed through the dictionary, letter for letter', async () => {
    expect((await clean('عاشا نامت', 'ar', pack, DICT)).text).toBe('آشا نامت.');
  });

  it('vetted: "اممم" goes; "ام" is never a filler (it is also أم, mother, without its hamza)', async () => {
    expect((await clean('اممم ام آشا نامت', 'ar', vetted('ar'), DICT)).text).toBe('ام آشا نامت.');
  });

  it('hostile: negation removal, mood change, harakat change, number change, name swap', () => {
    const raw = 'لا، ماما ما نامت. عندها ثلاثة أطفال.';
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', 'لا، ', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'repeat', ' ما', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', 'نامت.', 'نامت؟'), rules)).toBe('changes_sentence_type');
      expect(verdict(raw, edit(raw, 'punctuation', 'نامت', 'نَامَت'), rules)).toBe('punctuation_changed_letters');
      expect(verdict(raw, edit(raw, 'agreement', 'ثلاثة', 'أربعة'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', 'ماما', 'آشا'), rules, DICT)).not.toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ Chinese */
describe('Mandarin Chinese', () => {
  const pack = load('zh');
  const R = compileRules('zh', pack);
  const V = compileRules('zh', vetted('zh'));
  const DICT: DictionaryTerm[] = [{ term: '阿莎', kind: 'child', heardAs: ['阿沙'] }];

  it('every Han character is its own token (Hermes has no Intl.Segmenter); Latin words and digits stay whole', () => {
    expect(R.tokens('我用iPad看了3遍').map((t) => t.word)).toEqual(['我', '用', 'iPad', '看', '了', '3', '遍']);
  });

  it('today: full-width marks after Chinese, no space after them, 。 at the end; numbers keep their dots', async () => {
    expect((await clean('我想去公园, 你呢? 她买了3.5斤', 'zh', pack)).text).toBe('我想去公园，你呢？她买了3.5斤。');
  });

  it('house style keeps Chinese quotes and ellipsis, turns the dash into a full-width comma', () => {
    expect(finalText('她说“好”……然后——睡了', [], R)).toBe('她说“好”……然后，睡了');
  });

  it('script per author: Simplified converts 們 -> 们 and 開 -> 开; Traditional the other way; ambiguous characters stay', async () => {
    const hans = await clean('我們很開心', 'zh', pack, [], 'Hans');
    expect(hans.text).toBe('我们很开心。');
    const H = compileRules('zh', pack, { script: 'Hans' });
    expect(hans.applied.filter((e) => describeEdit(e, H) === 'script')).toHaveLength(2);
    expect((await clean('我们很开心，后来头发长了', 'zh', pack, [], 'Hant')).text).toBe('我們很開心，后來頭发長了。');
    // no author choice, no conversion
    expect((await clean('我們很開心', 'zh', pack)).text).toBe('我們很開心。');
  });

  it('script conversion never runs the wrong way, never inside quotes, never on a dictionary term', () => {
    const H = compileRules('zh', pack, { script: 'Hans' });
    const raw = '我们很开心';
    expect(verdict(raw, edit(raw, 'punctuation', '们', '們'), H)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'punctuation', '开', '関'), H)).toBe('punctuation_changed_letters');
    const quoted = '她说“我們”';
    expect(faithfulClean(quoted, { level: 'clean', dictionary: [], language: 'zh', pack, script: 'Hans' }).text).toBe(quoted);
    const named = [{ term: '開開', kind: 'nickname' as const, heardAs: [] }];
    expect(faithfulClean('開開很開心', { level: 'clean', dictionary: named, language: 'zh', pack, script: 'Hans' }).text).toBe('開開很开心');
  });

  it('a learned mishearing of a name is fixed; a homophone the parent did not teach is only suggested', async () => {
    expect((await clean('阿沙睡了', 'zh', pack, DICT)).text).toBe('阿莎睡了。');
    expect(soundAlikeTerms('阿纱', DICT, R).map((d) => d.term)).toEqual(['阿莎']); // 纱 and 莎 are both shā
    expect(soundAlikeTerms('阿萨', DICT, R)).toEqual([]); // 萨 is sà: not the same sound
  });

  it('vetted: 呃 goes only where it stands alone; 呃逆 (hiccup) and 额头 (forehead) keep every character; 嗯 is only offered', async () => {
    const out = await clean('呃，宝宝呃逆了，额头热。嗯，好', 'zh', vetted('zh'));
    expect(out.text).toBe('宝宝呃逆了，额头热。嗯，好。');
    expect(out.suggestions.map((s) => s.original)).toEqual(['嗯，']);
    const raw = '宝宝呃逆了';
    expect(verdict(raw, edit(raw, 'filler', '呃', ''), V)).toBe('not_a_filler');
  });

  it('vetted: reduplication is grammar, never removed (妈妈, 宝宝, 看看, 谢谢)', async () => {
    const raw = '妈妈和宝宝看看月亮，谢谢';
    expect((await clean(raw, 'zh', vetted('zh'))).text).toBe(`${raw}。`);
  });

  it('hostile: negation removal, statement to question, number change, name swap', () => {
    const raw = '她不喜欢，妈妈有三个苹果。';
    for (const rules of [R, V]) {
      expect(verdict(raw, edit(raw, 'filler', '不', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'repeat', '不', ''), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'punctuation', '。', '？'), rules)).toBe('changes_sentence_type');
      expect(verdict(raw, edit(raw, 'punctuation', '三', '四'), rules)).toBe('punctuation_changed_letters');
      expect(verdict(raw, edit(raw, 'agreement', '三', '四'), rules)).not.toBeNull();
      expect(verdict(raw, edit(raw, 'stt_fix', '妈妈', '阿莎'), rules, DICT)).not.toBeNull();
    }
  });
});

describe('every language: a model cannot slip words in through the punctuation label', () => {
  const cases: Array<[LanguageCode, string, string, string]> = [
    ['hi', 'वह आया', 'आया', 'नहीं आया'],
    ['es', 'Ella vino', 'vino', 'no vino'],
    ['fr', 'Elle est venue', 'venue', 'pas venue'],
    ['pt', 'Ela veio', 'veio', 'não veio'],
    ['ar', 'هي جاءت', 'جاءت', 'ما جاءت'],
    ['zh', '她来了', '来', '没来'],
  ];
  it.each(cases)('%s: %s', (l, raw, from, to) => {
    for (const rules of [compileRules(l, load(l)), compileRules(l, vetted(l)), compileRules(l, null)]) {
      expect(checkEdit(edit(raw, 'punctuation', from, to), ctx(raw, rules))).not.toBeNull();
    }
  });
});
