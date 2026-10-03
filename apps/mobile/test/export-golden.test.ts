/**
 * Golden export of the fictional Asha family (LEGAL-REQ-034, DATA-REQ-050,
 * -051; TDD 07 row 47). Builds the real ZIP in Node with the same code the
 * phone runs (pack.ts), opens it, and compares every text file with the
 * goldens in test/__golden__/export-asha. To accept an intended change, run
 * `npx vitest run -u` in apps/mobile and review the diff.
 */
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { planExport, safeSegment } from '../src/lib/export/build.logic';
import { ExportCancelledError, packExport, type PackDeps } from '../src/lib/export/pack';
import { EXPORT_SCHEMA_VERSION, type EntriesFile, type Manifest } from '../src/lib/export/schema';
import { readCentralDirectory, verifyExport, type RandomAccess } from '../src/lib/export/verify';
import { ASHA_AUDIO, ashaSnapshot, sha256Hex } from './helpers/asha-export';

const GOLDEN = './__golden__/export-asha';

function memorySink() {
  const chunks: Uint8Array[] = [];
  return {
    sink: { write: (c: Uint8Array) => chunks.push(c.slice()) },
    bytes: () => {
      const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
    },
  };
}

const renderedHtml = new Map<string, string>();
function deps(sink: PackDeps['sink'], extra: Partial<PackDeps> = {}): PackDeps {
  return {
    readFile: async (uri) => {
      const bytes = ASHA_AUDIO[uri];
      if (!bytes) throw new Error('missing');
      return bytes;
    },
    sha256: async (data) => sha256Hex(data),
    // Stand-in for expo-print: deterministic bytes; the HTML itself is the golden.
    renderPdf: async (html) => {
      const key = sha256Hex(html);
      renderedHtml.set(key, html);
      return new TextEncoder().encode(`%PDF-1.4\n% stand-in for ${key}\n%%EOF\n`);
    },
    sink,
    mtime: new Date(2027, 2, 15, 10, 0, 0),
    ...extra,
  };
}

const access = (zip: Uint8Array): RandomAccess => ({ size: zip.length, read: (o, l) => zip.subarray(o, o + l) });

async function makeExport() {
  const m = memorySink();
  const result = await packExport(ashaSnapshot(), deps(m.sink));
  return { zip: m.bytes(), result };
}

describe('Asha export (golden)', () => {
  it('holds exactly the expected files', async () => {
    const { zip } = await makeExport();
    const files = Object.keys(unzipSync(zip)).sort();
    await expect(`${files.join('\n')}\n`).toMatchFileSnapshot(`${GOLDEN}/_files.txt`);
    expect(files).toContain('data/entries.json');
    expect(files).toContain('book/Asha.pdf');
    expect(files).toContain('book/Dev.pdf');
    expect(files.filter((f) => f.startsWith('audio/'))).toEqual(['audio/e10.m4a', 'audio/e2.m4a', 'audio/e3.m4a', 'audio/e6.m4a', 'audio/e8.m4a']);
  });

  it('matches the golden text of every file', async () => {
    const { zip } = await makeExport();
    const files = unzipSync(zip);
    for (const [path, bytes] of Object.entries(files)) {
      if (path.endsWith('.m4a') || path.endsWith('.pdf')) continue;
      await expect(strFromU8(bytes), path).toMatchFileSnapshot(`${GOLDEN}/${path}`);
    }
  });

  it('renders the printable book with a cover, month chapters and serif type', async () => {
    renderedHtml.clear();
    await makeExport();
    const asha = [...renderedHtml.values()].find((h) => h.includes('Letters to Asha'))!;
    await expect(asha).toMatchFileSnapshot(`${GOLDEN}/_book-asha.html`);
    expect(asha).toMatch(/class="cover"/);
    expect(asha).toMatch(/ui-serif/);
    // Chapters in reading order: Before You, the first weeks, then months; Year 2 starts at month 12.
    const order = ['Before You', 'The first weeks', 'Month 1', 'Month 5', 'Month 9', 'Month 12'].map((t) => asha.indexOf(`<h2>${t}</h2>`));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(asha).toContain('Year 2');
    // Private letters, letters waiting for words and the family letter's raw words stay out of the book.
    expect(asha).not.toContain('Tired. Happy.');
    expect(asha).not.toContain('uh nobody');
    expect(asha).toContain('Your Nani made dal and nobody ate it.');
    // Right to left and Devanagari text is marked for the renderer.
    expect(asha).toContain('<p dir="auto">آشا، أنتِ نورُ بيتنا.</p>');
    expect(asha).toContain('आशा, आज तुमने पहली बार ताली बजाई।');
  });

  it('keeps every recording byte for byte, and marks the one that changed after capture', async () => {
    const { zip, result } = await makeExport();
    const files = unzipSync(zip);
    for (const [uri, bytes] of Object.entries(ASHA_AUDIO)) {
      const id = uri.split('/').pop()!.replace('.m4a', '');
      expect(sha256Hex(files[`audio/${id}.m4a`]), id).toBe(sha256Hex(bytes));
    }
    const entries = JSON.parse(strFromU8(files['data/entries.json'])) as EntriesFile;
    const byId = new Map(entries.entries.map((e) => [e.id, e]));
    expect(byId.get('e2')!.audio!.integrity).toBe('ok');
    expect(byId.get('e3')!.audio!.integrity).toBe('mismatch');
    expect(result.mismatched).toEqual(['e3']);
    expect(byId.get('e5')!.audio_missing).toEqual({ reason: 'not_on_this_device' });
    expect(byId.get('e7')!.audio_missing).toEqual({ reason: 'not_on_this_device' });
    expect(byId.get('e1')!.audio).toBeNull();
    expect(byId.get('e1')!.audio_missing).toBeNull();
  });

  it('[DATA-REQ-050] own letters carry raw, edits and final text; family letters only the final text', async () => {
    const { zip } = await makeExport();
    const entries = JSON.parse(strFromU8(unzipSync(zip)['data/entries.json'])) as EntriesFile;
    expect(entries.schema_version).toBe(EXPORT_SCHEMA_VERSION);
    expect(entries.entries).toHaveLength(11);
    const e2 = entries.entries.find((e) => e.id === 'e2')!;
    expect(e2.raw_transcript).toBe('Asha, um, you are four days old and the whole house is quiet.');
    expect(e2.final_text).toBe('Asha, you are four days old and the whole house is quiet.');
    expect(e2.machine_edits).toEqual([{ type: 'filler', start: 5, end: 9, original: ' um,', replacement: '', source: 'rule' }]);
    expect(e2.raw_sha256).toBe(sha256Hex(e2.raw_transcript!));
    const e7 = entries.entries.find((e) => e.id === 'e7')!;
    expect(e7.author).toEqual({ signs_as: 'Nani', is_exporter: false });
    expect('raw_transcript' in e7 || 'machine_edits' in e7 || 'raw_sha256' in e7).toBe(false);
    const e6 = entries.entries.find((e) => e.id === 'e6')!;
    expect(e6.words).toBe('waiting_for_words');
    expect(e6.audio?.path).toBe('audio/e6.m4a');
    // The hidden book is exported too.
    expect(entries.entries.find((e) => e.id === 'd1')?.child_id).toBe('child-dev-0002');
  });

  it('[DATA-REQ-051] lists every file in the manifest and checks clean', async () => {
    const { zip, result } = await makeExport();
    const files = unzipSync(zip);
    const manifest = JSON.parse(strFromU8(files['manifest.json'])) as Manifest;
    const listed = manifest.files.map((f) => f.path).sort();
    const inZip = Object.keys(files).filter((p) => p !== 'manifest.json' && p !== 'manifest.sha256').sort();
    expect(listed).toEqual(inZip);
    for (const f of manifest.files) {
      expect(sha256Hex(files[f.path]), f.path).toBe(f.sha256);
      expect(files[f.path].length, f.path).toBe(f.bytes);
    }
    expect(strFromU8(files['manifest.sha256'])).toBe(`${sha256Hex(files['manifest.json'])}  manifest.json\n`);
    expect(manifest.counts).toEqual({ entries: 11, audio: 5, audio_missing: 2, audio_mismatch: 1, photos: 0, books: 2 });
    const check = await verifyExport(access(zip), result.manifest, result.manifestSha256, async (d) => sha256Hex(d));
    expect(check).toEqual({ ok: true, problems: [], filesChecked: Object.keys(files).length });
  });

  it('catches a damaged file when checking, by path only', async () => {
    const { zip, result } = await makeExport();
    const entry = (await readCentralDirectory(access(zip))).find((e) => e.name === 'audio/e2.m4a')!;
    const damaged = zip.slice();
    damaged[entry.localOffset + 30 + entry.name.length + 1000] ^= 0xff;
    const check = await verifyExport(access(damaged), result.manifest, result.manifestSha256, async (d) => sha256Hex(d));
    expect(check.ok).toBe(false);
    expect(check.problems).toEqual(['hash:audio/e2.m4a']);
  });

  it('is identical when made twice from the same phone state', async () => {
    const a = await makeExport();
    const b = await makeExport();
    expect(sha256Hex(a.zip)).toBe(sha256Hex(b.zip));
  });

  it('stops when the person taps Stop, between files', async () => {
    const m = memorySink();
    const signal = { aborted: false };
    let calls = 0;
    const run = packExport(ashaSnapshot(), deps(m.sink, { signal, onProgress: () => (++calls === 4 ? (signal.aborted = true) : undefined) }));
    await expect(run).rejects.toBeInstanceOf(ExportCancelledError);
  });

  it('writes names that every computer can open', () => {
    expect(safeSegment('Asha', 'x')).toBe('Asha');
    expect(safeSegment('A/s:h*a?', 'x')).toBe('A s h a');
    expect(safeSegment('आशा', 'x')).toBe('आशा');
    expect(safeSegment('  ..  ', 'book-1')).toBe('book-1');
    const plan = planExport(ashaSnapshot());
    for (const f of plan.textFiles) expect(f.path, f.path).not.toMatch(/[\\:*?"<>|]/);
  });
});
