/**
 * BL-411, first slice (D-056, D-111 item 4): letters in Arabic, Hindi and Chinese, and the
 * long-word and long-date cases, go through the real export and the printable book without
 * losing a character, and the book's layout rules hold for right-to-left text. The family is
 * the fictional Asha; the letters are made-up sentences, not anyone's real words.
 *
 * What these checks can prove is the HTML and the CSS the book is made from (the same string
 * expo-print gets). They do not render pixels; the AX5 look is checked on a device (see
 * docs/product/proposed/localisation-position-v1-2026-11-23.md, "What is not done yet").
 */
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { bookHtml, paragraphs, planExport, type SnapshotEntry } from '../src/lib/export/build.logic';
import { packExport, type PackDeps } from '../src/lib/export/pack';
import { readCentralDirectory, verifyExport, type RandomAccess } from '../src/lib/export/verify';
import { ashaSnapshot, sha256Hex } from './helpers/asha-export';

const base = ashaSnapshot();
const asha = base.children[0];
const template = base.entries.find((e) => e.id === 'e1')!;

function letter(id: string, occurredOn: string, finalText: string, signsAs = 'Mama'): SnapshotEntry {
  return {
    ...template,
    id,
    occurredOn,
    occurredPrecision: undefined,
    finalText,
    rawTranscript: finalText,
    machineEdits: [],
    editLevel: 'verbatim',
    authorSignsAs: signsAs,
    audioUri: null,
    audioDurationMs: null,
    audioSha256: null,
    audioBytes: null,
    audioOnPhone: false,
    audioSizeOnPhone: null,
  };
}

// Made-up sentences. Each one mixes in the Latin name "Asha" the way a real letter would.
const AR = 'يا آشا، اليوم ضحكتِ ضحكةً حقيقية، وبقي البيت كله يضحك معك.\n\nأحبكِ يا نور عيني.';
const HI = 'आशा, आज तुमने पहली बार अपने पैर पकड़े और खुद ही हँस पड़ीं।\n\nहम सब बहुत खुश थे।';
const ZH = '阿莎，今天你第一次自己坐了起来，笑得停不下来。\n\n我们都好开心。' + '很长很长的一句话没有空格也要能换行'.repeat(6) + '。';
// One 70-letter word and one long link-shaped run: the cases that push a line past the page.
const LONG_WORD = 'Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichenwerkstattleiter';
const LONG_RUN = 'https://example.invalid/' + 'a-very-long-path-segment-'.repeat(6);

const fixtures: SnapshotEntry[] = [
  { ...letter('l-ar', '2026-12-24', AR), language: 'ar' },
  { ...letter('l-hi', '2026-09-01', HI), language: 'hi' },
  { ...letter('l-zh', '2026-10-05', ZH), language: 'zh-Hans' },
  letter('l-long', '2026-11-02', `${LONG_WORD}\n\n${LONG_RUN}`),
];
const sample = { ar: AR, hi: HI, zh: ZH };

const book = bookHtml(asha, fixtures, 'en-US');
const css = /<style>([\s\S]*?)<\/style>/.exec(book)![1];

describe('BL-411 letter fixtures: the printable book', () => {
  it.each(Object.entries(sample))('keeps every character of the %s letter, in order', (_lang, text) => {
    for (const para of text.split(/\n\s*\n/)) {
      expect(book).toContain(para.trim().replace(/&/g, '&amp;'));
    }
    expect(book.normalize('NFC')).toBe(book);
  });

  it('lets each paragraph choose its own direction, and puts the signature at the end of the line', () => {
    const arPara = paragraphs(AR);
    expect(arPara.match(/<p dir="auto">/g)).toHaveLength(2);
    expect(book).toContain(arPara);
    expect(css).toMatch(/\.sig\{text-align:end;/);
    // Every body paragraph and signature carries dir="auto"; none is forced to ltr or rtl.
    expect(book).not.toMatch(/dir="(ltr|rtl)"/);
    expect(css).not.toMatch(/(^|[;{\s])direction\s*:/);
  });

  it('uses no physical left or right in the book css, so start and end flip with the text', () => {
    expect(css).not.toMatch(/(margin|padding|border)-(left|right)/);
    expect(css).not.toMatch(/text-align\s*:\s*(left|right)/);
    expect(css).not.toMatch(/\b(float|left|right)\s*:/);
  });

  it('lets a long word, a long link and an unspaced Chinese run wrap instead of running off the page', () => {
    // A block of text only overflows if the css forbids wrapping or fixes a width.
    expect(css).not.toMatch(/white-space\s*:\s*(nowrap|pre)\b/);
    expect(css).not.toMatch(/text-overflow|overflow\s*:\s*hidden|word-break\s*:\s*keep-all/);
    // Letter text sits in plain block paragraphs with no width, so the page width bounds it.
    expect(css).not.toMatch(/article\s*p\s*\{[^}]*\bwidth\s*:/);
    expect(book).toContain(LONG_WORD);
    expect(book).toContain(LONG_RUN.replace(/&/g, '&amp;'));
    // The Chinese fixture's long sentence has no spaces at all: wrapping has to come from the text engine.
    expect(ZH.split('\n\n')[1]).not.toMatch(/ /);
    expect(ZH.split('\n\n')[1].length).toBeGreaterThan(100);
  });

  it('lets the date wrap in a book made on an es, fr or pt phone (dates stay English, K-24)', () => {
    const dated = ['es-ES', 'fr-FR', 'pt-BR'].map((loc) => bookHtml(asha, fixtures, loc));
    for (const html of dated) {
      const dates = [...html.matchAll(/<p class="date">([^<]*)<\/p>/g)].map((m) => m[1]);
      expect(dates).toHaveLength(fixtures.length);
      // en-GB day order, never a clipped or abbreviated date.
      expect(dates[0]).toMatch(/\d{1,2} \w+ 2026/);
      expect(dates.join('')).not.toMatch(/\u2026|\.\.\./);
    }
    expect(css).toMatch(/\.date\{[^}]*\}/);
    expect(/\.date\{[^}]*\}/.exec(css)![0]).not.toMatch(/nowrap|ellipsis|overflow|\bwidth\b/);
  });
});

describe('BL-411 letter fixtures: the export', () => {
  const snapshot = { ...base, entries: [...base.entries.filter((e) => e.childId === asha.id), ...fixtures], children: [asha] };

  async function make() {
    const chunks: Uint8Array[] = [];
    const deps: PackDeps = {
      readFile: async () => {
        throw new Error('no audio in these fixtures');
      },
      sha256: async (d) => sha256Hex(d),
      renderPdf: async (html) => new TextEncoder().encode(`%PDF-1.4\n% ${sha256Hex(html)}\n%%EOF\n`),
      sink: { write: (c: Uint8Array) => void chunks.push(c.slice()) },
      mtime: new Date(2027, 2, 15, 10, 0, 0),
    };
    // Drop the recordings from the base letters so the stand-in reader is never asked for one.
    const result = await packExport(
      { ...snapshot, entries: snapshot.entries.map((e) => ({ ...e, audioUri: null, audioOnPhone: false, audioSha256: null, audioBytes: null, audioSizeOnPhone: null, audioDurationMs: null })) },
      deps,
    );
    const zip = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let o = 0;
    for (const c of chunks) {
      zip.set(c, o);
      o += c.length;
    }
    return { zip, result };
  }

  it('writes each letter as its own UTF-8 text file with the exact words, and the file check passes', async () => {
    const { zip, result } = await make();
    const files = unzipSync(zip);
    const names = Object.keys(files);
    for (const [id, text] of [['l-ar', AR], ['l-hi', HI], ['l-zh', ZH], ['l-long', `${LONG_WORD}\n\n${LONG_RUN}`]] as const) {
      const name = names.find((n) => n.startsWith('letters/') && n.includes(`_${id}.txt`));
      expect(name, id).toBeTruthy();
      expect(strFromU8(files[name!])).toContain(text);
    }
    const access: RandomAccess = { size: zip.length, read: (off, len) => zip.subarray(off, off + len) };
    const check = await verifyExport(access, result.manifest, result.manifestSha256, async (d) => sha256Hex(d));
    expect(check.ok).toBe(true);
    expect((await readCentralDirectory(access)).length).toBeGreaterThan(0);
  });

  it('keeps the words in entries.json and in the reader page, and never touches raw_transcript', async () => {
    const { zip } = await make();
    const files = unzipSync(zip);
    const entries = JSON.parse(strFromU8(files['data/entries.json'])) as { entries: { id: string; final_text?: string; raw_transcript?: string }[] };
    const byId = new Map(entries.entries.map((e) => [e.id, e]));
    for (const [id, text] of [['l-ar', AR], ['l-hi', HI], ['l-zh', ZH]] as const) {
      expect(JSON.stringify(byId.get(id))).toContain(JSON.stringify(text).slice(1, -1));
    }
    const index = strFromU8(files['index.html']);
    for (const text of [AR, HI]) expect(index).toContain(text.split('\n\n')[0]);
    expect(index).toContain('dir="auto"');
  });

  it('plans one printable book per child with the fixtures in it', () => {
    const plan = planExport(snapshot);
    const html = plan.books[0].html;
    for (const text of Object.values(sample)) expect(html).toContain(text.split('\n\n')[0]);
  });

  it('BL-1978: marks each letter with its own lang in the reader page and the book, and keeps the page lang="en"', async () => {
    const { zip } = await make();
    const index = strFromU8(unzipSync(zip)['index.html']);
    const printed = planExport(snapshot).books[0].html;
    for (const html of [index, printed]) {
      expect(html).toMatch(/^<html lang="en">/m);
      for (const [tag, text] of [['ar', AR], ['hi', HI], ['zh-Hans', ZH]] as const) {
        const first = text.split('\n\n')[0];
        const art = html.split('<article').find((a) => a.includes(first))!;
        expect(art, tag).toBeTruthy();
        expect(art.startsWith(` lang="${tag}">`), tag).toBe(true);
      }
      // A letter with no language adds no attribute, and the English letters are unmarked.
      expect(html.split('<article').filter((a) => a.startsWith(' lang=')).length).toBe(3);
    }
  });

  it('BL-1978: never writes a stored language that is not a plain tag into the attribute', () => {
    const odd = ['"><script>', 'en US', '', '  ', null, undefined].map((language, i) => ({ ...letter(`o${i}`, '2026-11-03', `Odd ${i}`), language }));
    expect(bookHtml(asha, odd, 'en-US')).not.toMatch(/<article lang=/);
    expect(bookHtml(asha, odd, 'en-US')).not.toContain('<script>');
  });

  it('BL-1978: the reader page chip sits at the start under RTL (margin-inline-start, no physical margin)', async () => {
    const { zip } = await make();
    const index = strFromU8(unzipSync(zip)['index.html']);
    const style = /<style>([\s\S]*?)<\/style>/.exec(index)![1];
    expect(/\.tag\{[^}]*\}/.exec(style)![0]).toContain('margin-inline-start:.5rem');
    expect(style).not.toMatch(/(margin|padding|border)-(left|right)/);
  });

  it.todo('AX5 pixel check of the date pill and the language list on a device (journeys J01-05, J01-10, J01-12)');
});
