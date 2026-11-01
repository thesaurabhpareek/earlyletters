/**
 * App size measurement, pure parts (docs/ops/APP_SIZE.md; founder decision 15:
 * under 40 MB download, measured on every release build). Tested by
 * lib.test.ts; the CLI is measure.ts.
 */
// ---------------------------------------------------------------------------
// Source map attribution (which package owns how many bytes of the JS bundle)
// ---------------------------------------------------------------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX: Record<string, number> = Object.fromEntries([...B64].map((c, i) => [c, i]));

/** Decodes one Base64 VLQ segment into its numbers (Source Map v3). */
export function decodeVlq(segment: string): number[] {
  const out: number[] = [];
  let value = 0;
  let shift = 0;
  for (const ch of segment) {
    const digit = B64_INDEX[ch];
    if (digit === undefined) throw new Error('bad_vlq');
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      out.push(value & 1 ? -(value >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

export interface SourceMapLike {
  sources: string[];
  mappings: string;
}

/**
 * Bytes of generated code per source file: each mapping segment owns the
 * generated text from its column to the next segment (or the end of the
 * line). Lines are split on "\n" and measured in UTF-8 bytes. Unmapped text
 * is counted under "(unmapped)".
 */
export function bytesPerSource(code: string, map: SourceMapLike): Map<string, number> {
  const out = new Map<string, number>();
  const add = (k: string, n: number) => n > 0 && out.set(k, (out.get(k) ?? 0) + n);
  const lines = code.split('\n');
  const mapLines = map.mappings.split(';');
  let source = 0;
  const utf8 = (s: string) => Buffer.byteLength(s, 'utf8');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const segs = (mapLines[li] ?? '').split(',').filter(Boolean);
    let col = 0;
    const points: { col: number; src: number | null }[] = [];
    for (const seg of segs) {
      const v = decodeVlq(seg);
      col += v[0];
      if (v.length >= 4) {
        source += v[1];
        points.push({ col, src: source });
      } else points.push({ col, src: null });
    }
    if (points.length === 0 || points[0].col > 0) add('(unmapped)', utf8(line.slice(0, points[0]?.col ?? line.length)));
    for (let i = 0; i < points.length; i++) {
      const end = i + 1 < points.length ? points[i + 1].col : line.length;
      const text = line.slice(points[i].col, end);
      const src = points[i].src;
      add(src === null ? '(unmapped)' : (map.sources[src] ?? '(unknown)'), utf8(text));
    }
    if (li < lines.length - 1) add('(unmapped)', 1); // the newline
  }
  return out;
}

/** Groups a source path by owner: an npm package, a workspace package, or a folder of the app. */
export function ownerOf(source: string): string {
  const s = source.replace(/\\/g, '/');
  const nm = s.lastIndexOf('node_modules/');
  if (nm >= 0) {
    const rest = s.slice(nm + 'node_modules/'.length).split('/');
    return rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0];
  }
  const pkg = /(?:^|\/)packages\/([^/]+)\//.exec(s);
  if (pkg) return `@scribe/${pkg[1]}`;
  const app = /(?:^|\/)apps\/mobile\/(src\/[^/]+|[^/]+)/.exec(s);
  if (app) return `app:${app[1]}`;
  if (/^\(.*\)$/.test(s)) return s;
  if (s.startsWith('__prelude__') || s.includes('require-')) return '(runtime)';
  return s.split('/').slice(-2).join('/');
}

export function groupByOwner(perSource: Map<string, number>): { owner: string; bytes: number }[] {
  const g = new Map<string, number>();
  for (const [src, n] of perSource) g.set(ownerOf(src), (g.get(ownerOf(src)) ?? 0) + n);
  return [...g.entries()].map(([owner, bytes]) => ({ owner, bytes })).sort((a, b) => b.bytes - a.bytes);
}

/** Dependencies of the app that contribute nothing to the JS bundle. Native ones still add binary size through autolinking. */
export function unusedDependencies(deps: readonly string[], owners: ReadonlySet<string>): string[] {
  return deps.filter((d) => !d.startsWith('@scribe/') && !owners.has(d)).sort();
}

// ---------------------------------------------------------------------------
// IPA (zip) reading: sizes without unpacking
// ---------------------------------------------------------------------------

export interface ZipEntry {
  name: string;
  compressed: number;
  uncompressed: number;
}

/** Lists a zip's central directory (no ZIP64; IPAs under 4 GB). */
export function listZip(buf: Uint8Array): ZipEntry[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not_a_zip');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('bad_central_directory');
    const compressed = view.getUint32(p + 20, true);
    const uncompressed = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    out.push({ name: dec.decode(buf.subarray(p + 46, p + 46 + nameLen)), compressed, uncompressed });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** Groups IPA entries into the parts that matter for size decisions. */
export function ipaBreakdown(entries: readonly ZipEntry[]): { part: string; compressed: number; uncompressed: number }[] {
  const part = (name: string): string => {
    const m = /^Payload\/[^/]+\.app\/(.*)$/.exec(name);
    if (!m) return 'other';
    const rest = m[1];
    if (rest.startsWith('Frameworks/')) return `Frameworks/${rest.split('/')[1]}`;
    if (rest.startsWith('PlugIns/')) return `PlugIns/${rest.split('/')[1]}`;
    if (/\.(jsbundle|hbc)$/.test(rest)) return 'JS bundle';
    if (rest === 'Assets.car') return 'Assets.car';
    if (/^assets\//.test(rest)) return 'JS assets';
    if (/\.(ttf|otf)$/i.test(rest)) return 'fonts';
    if (!rest.includes('/') && !rest.includes('.')) return 'main executable';
    if (rest.endsWith('.bundle') || rest.includes('.bundle/')) return `bundles/${rest.split('/')[0]}`;
    return 'other';
  };
  const g = new Map<string, { compressed: number; uncompressed: number }>();
  for (const e of entries) {
    const k = part(e.name);
    const cur = g.get(k) ?? { compressed: 0, uncompressed: 0 };
    cur.compressed += e.compressed;
    cur.uncompressed += e.uncompressed;
    g.set(k, cur);
  }
  return [...g.entries()].map(([p, v]) => ({ part: p, ...v })).sort((a, b) => b.compressed - a.compressed);
}

// ---------------------------------------------------------------------------
// App Thinning Size Report (xcodebuild -exportArchive with thinning)
// ---------------------------------------------------------------------------

const UNIT: Record<string, number> = { KB: 1e3, MB: 1e6, GB: 1e9 };

function parseSize(s: string): number | null {
  const t = s.trim();
  if (/^zero/i.test(t)) return 0;
  const m = /^([\d.,]+)\s*(KB|MB|GB)$/i.exec(t);
  return m ? Number(m[1].replace(/,/g, '')) * UNIT[m[2].toUpperCase()] : null;
}

/** Every variant's compressed (download) and uncompressed (install) app size from an App Thinning Size Report. */
export function parseThinningReport(text: string): { variant: string; compressed: number; uncompressed: number }[] {
  const out: { variant: string; compressed: number; uncompressed: number }[] = [];
  let variant = '';
  for (const line of text.split(/\r?\n/)) {
    const v = /^Variant:\s*(.+)$/.exec(line.trim());
    if (v) variant = v[1];
    const m = /^App size:\s*(.+?) compressed,\s*(.+?) uncompressed/i.exec(line.trim());
    if (m) {
      const c = parseSize(m[1]);
      const u = parseSize(m[2]);
      if (c !== null && u !== null) out.push({ variant, compressed: c, uncompressed: u });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export const DOWNLOAD_BUDGET_BYTES = 40_000_000;
/** Sub-budgets that keep the JS side honest between native measurements (APP_SIZE.md). */
export const JS_BUNDLE_BUDGET_BYTES = 12_000_000;
export const JS_ASSETS_BUDGET_BYTES = 3_000_000;

export type Source = 'thinning_report' | 'ipa' | 'js_only';

export interface Verdict {
  source: Source;
  downloadBytes: number | null;
  pass: boolean;
  notes: string[];
}

export function verdict(m: { thinningMaxCompressed?: number | null; ipaBytes?: number | null; jsBundleBytes: number; jsAssetsBytes: number }): Verdict {
  const notes: string[] = [];
  let pass = true;
  if (m.jsBundleBytes > JS_BUNDLE_BUDGET_BYTES) {
    pass = false;
    notes.push(`JS bundle ${mb(m.jsBundleBytes)} is over its ${mb(JS_BUNDLE_BUDGET_BYTES)} sub-budget`);
  }
  if (m.jsAssetsBytes > JS_ASSETS_BUDGET_BYTES) {
    pass = false;
    notes.push(`JS assets ${mb(m.jsAssetsBytes)} are over their ${mb(JS_ASSETS_BUDGET_BYTES)} sub-budget`);
  }
  if (m.thinningMaxCompressed != null) {
    if (m.thinningMaxCompressed > DOWNLOAD_BUDGET_BYTES) {
      pass = false;
      notes.push(`largest thinned download ${mb(m.thinningMaxCompressed)} is over ${mb(DOWNLOAD_BUDGET_BYTES)}`);
    }
    return { source: 'thinning_report', downloadBytes: m.thinningMaxCompressed, pass, notes };
  }
  if (m.ipaBytes != null) {
    // Apple: an IPA is not a size measurement (it carries every variant and extras), so it is an
    // approximation only; the thinning report is close and App Store Connect is authoritative.
    if (m.ipaBytes > DOWNLOAD_BUDGET_BYTES) {
      pass = false;
      notes.push(`IPA ${mb(m.ipaBytes)} is over ${mb(DOWNLOAD_BUDGET_BYTES)} (approximate; confirm with a thinning report or App Store Connect)`);
    }
    return { source: 'ipa', downloadBytes: m.ipaBytes, pass, notes };
  }
  notes.push('native code not measured: pass --ipa or --thinning-report for the download size');
  return { source: 'js_only', downloadBytes: null, pass, notes };
}

export function mb(n: number): string {
  return `${(n / 1e6).toFixed(1)} MB`;
}
