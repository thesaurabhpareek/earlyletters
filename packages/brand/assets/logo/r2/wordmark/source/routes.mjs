// The wordmark routes. Every number here is a typographic decision; see ../RATIONALE.md.
import { cut, glyph, translate, bbox } from './lib.mjs';
import { setWord, pairGap } from './space.mjs';
import { joinTT, tAscender, yDescender } from './edits.mjs';

const TEXT = 'Early Letters';

/** Mean clamped white of "nn" in a cut: the font's own lowercase rhythm, our spacing unit. */
function nnGap(f, band, depth) {
  const n = glyph(f, 'n');
  return pairGap(n.cmds, translate(n.cmds, n.adv, 0), { band, depth }) ;
}

function literataWord(p) {
  const f = cut('literata', p.opsz, p.wght);
  const band = [0, 510], depth = p.depth ?? 90;
  const gap = nnGap(f, band, depth) * p.factor;
  const subs = {};
  // y: optional shorter descender
  subs[TEXT.indexOf('y')] = (() => { const g = glyph(f, 'y'); return { ...g, cmds: yDescender(g.cmds, p.yLift ?? 0) }; })();
  let word = setWord(f, TEXT, { band, depth, gap, wordSpace: p.wordSpace, adjust: p.adjust ?? {}, subs });
  if (p.tt) {
    const i1 = word.findIndex((g) => g.ch === 't');
    const t1 = word[i1], t2 = word[i1 + 1];
    const a = translate(tAscender(t1.base, p.tt.raise1 ?? 0), t1.x, 0);
    const b = translate(tAscender(t2.base, p.tt.raise2 ?? 0), t2.x, 0);
    const joined = joinTT(a, b, { bracket: p.tt.bracket ?? 52 });
    word = [...word.slice(0, i1), { ch: 'tt', cmds: joined }, ...word.slice(i1 + 2)];
  }
  return { cmds: word.flatMap((g) => g.cmds), parts: word };
}

/** Caps and small caps: E + ARLY, L + ETTERS. */
function smallCapsWord(p) {
  const f = cut('literata', p.opsz, p.wght);
  const sc = (ch) => glyph(f, ch + '.sc', true);
  const subs = {};
  [...TEXT].forEach((ch, i) => { if (ch !== ' ' && ch === ch.toLowerCase()) subs[i] = sc(ch); });
  // small-cap height in Literata is ~ x-height + a little; measure band on the small caps
  const band = [0, 560], depth = p.depth ?? 110;
  const H = sc('h');
  const gap = pairGap(H.cmds, translate(H.cmds, H.adv, 0), { band, depth }) * p.factor + p.track;
  const word = setWord(f, TEXT, { band, depth, gap, wordSpace: p.wordSpace, adjust: p.adjust ?? {}, subs });
  return { cmds: word.flatMap((g) => g.cmds), parts: word };
}

/** EB Garamond with its own historical t_t ligature. */
function garamondWord(p) {
  const f = cut('ebgaramond', '-', p.wght);
  const band = [0, 400], depth = p.depth ?? 80;
  const n = glyph(f, 'n');
  const gap = pairGap(n.cmds, translate(n.cmds, n.adv, 0), { band, depth }) * p.factor;
  // set "Early Le" + t_t + "ers" by substituting index 8 with the ligature and dropping index 9
  const tt = glyph(f, 't_t', true);
  const text = 'Early Le\u0000ers';
  const subs = { 8: tt };
  const word = setWord(f, text.replace('\u0000', 'T'), { band, depth, gap, wordSpace: p.wordSpace, adjust: p.adjust ?? {}, subs });
  return { cmds: word.flatMap((g) => g.cmds), parts: word, scale: p.scale ?? 1 };
}

export const ROUTES = {
  a: {
    slug: 'a-signature',
    name: 'A. Signature',
    line: 'Literata at a display optical size, optically spaced, one crossbar shared by a tall t and a small t.',
    master: { build: literataWord, opsz: 36, wght: 480, factor: 0.9, wordSpace: 175, yLift: 0, tt: { raise1: 48, raise2: 0, bracket: 52 }, adjust: { rl: 10, Le: -32, 'y ': -10, Ea: -6 } },
    small: { build: literataWord, opsz: 12, wght: 520, factor: 1.08, wordSpace: 190, tt: { raise1: 0, bracket: 46 }, adjust: {} },
  },
  b: {
    slug: 'b-fine',
    name: 'B. Fine',
    line: 'Literata at its largest optical size and a lighter weight: more contrast, a book-jacket cut.',
    master: { build: literataWord, opsz: 72, wght: 420, factor: 0.86, wordSpace: 165, tt: { raise1: 0, bracket: 56 }, adjust: { Le: -40, rl: 8, 'y ': -10 } },
    small: { build: literataWord, opsz: 12, wght: 520, factor: 1.08, wordSpace: 190, tt: { raise1: 0, bracket: 46 }, adjust: {} },
  },
  c: {
    slug: 'c-small-caps',
    name: 'C. Spaced small caps',
    line: 'Capitals and true small caps, generously spaced, like a title page or a book spine.',
    master: { build: smallCapsWord, opsz: 24, wght: 500, factor: 1.0, track: 90, wordSpace: 300, adjust: { Le: -40, 'y ': -20 } },
    small: { build: smallCapsWord, opsz: 12, wght: 540, factor: 1.0, track: 120, wordSpace: 340, adjust: { Le: -40, 'y ': -20 } },
  },
  d: {
    slug: 'd-garamond',
    name: 'D. Garamond (alternative OFL serif)',
    line: 'EB Garamond with its historical tt ligature: the warmest, oldest voice, at the cost of family with the app.',
    master: { build: garamondWord, wght: 500, factor: 0.92, wordSpace: 120, adjust: { Le: -30 } },
    small: { build: garamondWord, wght: 560, factor: 1.05, wordSpace: 140, adjust: {} },
  },
};

export function buildCut(spec) {
  const out = spec.build(spec);
  return { ...out, bb: bbox(out.cmds) };
}
