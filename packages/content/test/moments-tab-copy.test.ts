// Moments tab strings (PR 12a, PR 12b). The general rules run on every `features` leaf in rules.test.ts; these are the
// Moments ones.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { momentsTabCopy } from '../src';

function leaves(o: unknown, path = 'momentsTab'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(momentsTabCopy);
// "Moments" is the tab name, allowed only in these two keys.
const NAME_KEYS = ['momentsTab.tab.label', 'momentsTab.heading.title'];

describe('[NS-53-R159] Moments strings use the glossary and say no more than the spec', () => {
  it('[NS-53-R159] only the tab name says Moments; no memory, album, caption or machine words', () => {
    for (const l of ALL) {
      if (!NAME_KEYS.includes(l.path)) expect(l.text, l.path).not.toMatch(/\bmoments?\b/i);
      expect(l.text, l.path).not.toMatch(/\b(memory|memories|album|AI|auto|automatic|smart|generated|caption\w*|describe\w*|suggest\w*)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(we|our|ours|allow|access)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(take|entry|draft|pack|raw_transcript)\b/i);
    }
  });
  it('[NS-53-R159] placeholders are only the ones the spec names and no string counts or compares', () => {
    for (const l of ALL) {
      for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['child', 'app', 'year', 'place', 'holiday']).toContain(m[1]);
      expect(l.text, l.path).not.toMatch(/\d|\b(best|most|more|streak|points|badge)\b/i);
    }
  });
  it('[NS-53-R159] the reason list is the closed list of spec 6.4a, fifteen lines', () => {
    expect(Object.keys(momentsTabCopy.reason)).toEqual(['marked', 'birthday', 'monthDay', 'kept', 'heart', 'video', 'day', 'year', 'run', 'picked', 'place', 'holiday', 'first', 'letter', 'question']);
  });
  // monthDay and heart carry the words of council ruling CDesO-18 (BL-1557, batch 6), not spec 6.4a's drafts.
  it('[NS-53-R159] the reason lines are word for word the strings of spec 6.4a, with the two council rulings', () => {
    expect(momentsTabCopy.reason).toEqual({
      marked: 'A day you marked',
      birthday: "On {child}'s birthday",
      monthDay: 'The day of the month {child} was born',
      kept: 'A day you kept close',
      heart: 'Pictures you marked as favorites',
      video: 'A video from this day',
      day: 'Pictures from this day',
      year: 'Pictures from this day in {year}',
      run: 'Pictures from these days',
      picked: 'Pictures you picked before',
      place: 'Pictures from {place}',
      holiday: 'On {holiday}',
      first: 'A first you marked',
      letter: 'A letter from this day',
      question: 'A question to start from',
    });
  });
  it('[NS-53-R187] Settings appears only in the denied and restricted lines and Open Settings; allow and access nowhere', () => {
    const SETTINGS_KEYS = ['momentsTab.state.denied', 'momentsTab.state.restricted', 'momentsTab.state.openSettings'];
    for (const l of ALL) if (!SETTINGS_KEYS.includes(l.path)) expect(l.text, l.path).not.toMatch(/\bsettings?\b/i);
    expect(momentsTabCopy.state.openSettings).toBe('Open Settings');
  });
  it('[NS-53-R160] the example caption is exactly "An example"', () => {
    expect(momentsTabCopy.card.example).toBe('An example');
  });
});

// PR 12b (BL-1548, BL-2137): the ask card, the primer, the access-state lines and the door.
const SRC = join(__dirname, '..', 'src', 'features', 'moments-tab.en.ts');
const TWELVE_B = ALL.filter((l) => /^momentsTab\.(ask|primer|state|door)\./.test(l.path));

/** The leading comment of each key in `momentsTabCopy.primer`, read from the source, keyed by the key's name. */
function primerComments(): Record<string, string> {
  const text = readFileSync(SRC, 'utf8');
  const sf = ts.createSourceFile(SRC, text, ts.ScriptTarget.Latest, true);
  const out: Record<string, string> = {};
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && node.name.getText(sf) === 'primer' && ts.isObjectLiteralExpression(node.initializer)) {
      for (const p of node.initializer.properties) {
        const ranges = ts.getLeadingCommentRanges(text, p.getFullStart()) ?? [];
        out[p.name!.getText(sf)] = ranges.map((r) => text.slice(r.pos, r.end)).join('\n');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const AGREEMENT_LINES = ['Shown:', 'Records:', 'Never:', 'Decline:'];
/** The agreement lines a key's comment lacks. */
const lacks = (comment: string) => AGREEMENT_LINES.filter((line) => !comment.includes(line));

describe('[NS-53-R72] the primer carries the agreement lines (COORDINATION section 10, PRIV-R21)', () => {
  it('[NS-53-R72] every primer key has its own Shown, Records, Never and Decline lines', () => {
    const comments = primerComments();
    expect(Object.keys(comments)).toEqual(Object.keys(momentsTabCopy.primer));
    for (const [key, comment] of Object.entries(comments)) expect(lacks(comment), `primer.${key}`).toEqual([]);
  });
  it('[NS-53-R72] the check names the line a primer key lacks', () => {
    expect(lacks('// Shown: x\n// Records: y\n// Never: z')).toEqual(['Decline:']);
  });
});

describe('[NS-53-R300] Moments claims are scoped to a mode', () => {
  // What the library read claims (R300 claim d), and where-it-lives words. Only the primer shows where the read is on.
  const READ_CLAIM = /\b(reads?|sees?|looks? at|date|time|place|on this phone|this tab is open)\b/i;
  // Never in any Moments string, in any mode (R278, R300, spec 16.1).
  const CROSS_MODE =
    /\b(never|only|always|private|safe|secure)\b|\bstays? on (?:this|your|the) phone\b|\bleaves? (?:this|your|the) phone\b|\bonly the pictures\b|\bApple(?:'s)? (?:Photos|picker)\b|\bPhotos\b|\byou (?:pick|choose|chose) only\b/i;

  it('[NS-53-R300] no Moments string says never, only, stays on your phone, or names Apple Photos or the picker', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(CROSS_MODE);
  });
  // Only the primer body may make the read claim, and it is held (CPrivO-59), so today no 12b line makes one. When the
  // body comes back, this list becomes ['momentsTab.primer.body'] and nothing else.
  it('[NS-53-R300] no 12b line makes the read claim: the door, host sheet, ask card, state lines and primer make none', () => {
    expect(TWELVE_B.length).toBeGreaterThanOrEqual(14);
    expect(TWELVE_B.filter((l) => READ_CLAIM.test(l.text)).map((l) => l.path)).toEqual([]);
  });
  it('[NS-53-R300] the patterns catch the claims they are for', () => {
    for (const bad of ['Pictures never leave your phone.', 'Days stay on your phone.', '{app} sees only the pictures you choose.', 'Open Apple Photos']) {
      expect(CROSS_MODE.test(bad), bad).toBe(true);
    }
    expect(READ_CLAIM.test('{app} reads the date of your pictures.')).toBe(true);
    expect(CROSS_MODE.test('Choose pictures')).toBe(false);
  });
});

// CPrivO-59: the primer's body (the R192 sentence) is HELD until the library module, the place-name evidence and
// counsel's read exist, so it is not a key and nothing can draw it. R192's own test comes back with the body.
describe('[CPrivO-59][CDesO-56] the primer body is held, and the two changed lines are the ruled words', () => {
  it('[CPrivO-59] the primer has a title and its two buttons, and no body', () => {
    expect(Object.keys(momentsTabCopy.primer)).toEqual(['title', 'continue', 'notNow']);
    expect(momentsTabCopy.primer).not.toHaveProperty('body');
  });
  it('[CPrivO-59] the primer title is a statement, not the ask card\'s question', () => {
    expect(momentsTabCopy.primer.title).toBe('Days from your pictures');
    expect(momentsTabCopy.primer.title).not.toBe(momentsTabCopy.ask.title);
    expect(momentsTabCopy.primer.title).not.toMatch(/\?/);
  });
  it('[CDesO-56] the door heading asks for one picture, while the row label keeps its plural', () => {
    expect(momentsTabCopy.door.heading).toBe('Choose a picture to start a letter');
    expect(momentsTabCopy.door.label).toBe('Choose pictures');
  });
});

describe('[NS-53-R294] the ask card, the primer and the door share one decline word and carry no count', () => {
  it('[NS-53-R294] Not now is the same word on the ask card, the primer and the door sheet', () => {
    expect([momentsTabCopy.ask.notNow, momentsTabCopy.primer.notNow, momentsTabCopy.door.notNow]).toEqual(['Not now', 'Not now', 'Not now']);
  });
  it('[NS-53-R294] the door family has no digit, count word or limit line, its confirm is Start and its heading is not the tab name', () => {
    for (const l of TWELVE_B.filter((x) => x.path.startsWith('momentsTab.door.'))) {
      expect(l.text, l.path).not.toMatch(/\d|\b(one|two|three|four|five|few|several|many|all|up to|limit|chosen|keep)\b/i);
    }
    expect(Object.keys(momentsTabCopy.door)).toEqual(['label', 'heading', 'start', 'notNow']);
    expect(momentsTabCopy.door.start).toBe('Start');
    expect(momentsTabCopy.door.heading).not.toMatch(/\bmoments?\b/i);
    expect(momentsTabCopy.door.label).toBe('Choose pictures');
  });
});
