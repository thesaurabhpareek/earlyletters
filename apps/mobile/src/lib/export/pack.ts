/**
 * Builds the export ZIP from a plan (build.logic.ts) and checks it
 * (DATA-REQ-051). Platform-neutral: files, hashing and PDF rendering come in
 * as functions, so the same code runs on the phone (device.ts) and in the
 * Node golden test.
 *
 * ZIP: fflate's streaming `Zip` with `ZipPassThrough` (stored, no
 * compression: recordings and PDFs are already compressed, and stored
 * entries are the most widely readable). fflate writes a data descriptor
 * after each entry and has no ZIP64, so one export must stay under 4 GiB
 * (`MAX_EXPORT_BYTES`); a one-year book is about 230 MB (C-NFR-007). Splitting
 * by child-year above 2 GB (spec 4.2) is not built yet.
 *
 * One file is in memory at a time. The sink receives the ZIP bytes in order.
 */
import { strToU8, Zip, ZipPassThrough } from 'fflate';
import { EXPORT_FORMAT, EXPORT_SCHEMA_VERSION, type Manifest, type ManifestFile } from './schema';
import { dataFiles, MEDIA, planExport, type AudioResult, type ExportSnapshot } from './build.logic';

/** Below the 4 GiB limit of a ZIP without ZIP64, with room for headers. */
export const MAX_EXPORT_BYTES = 3_900_000_000;
const CHUNK = 1 << 20; // 1 MiB: push size, and how often the UI gets a turn

export interface ByteSink {
  write(chunk: Uint8Array): void;
}

export type ExportPhase = 'books' | 'letters' | 'recordings' | 'data' | 'checking';

export interface PackProgress {
  phase: ExportPhase;
  /** 0..1 over the whole packing step (checking reports separately). */
  fraction: number;
}

export interface PackDeps {
  readFile(uri: string): Promise<Uint8Array>;
  sha256(data: Uint8Array): Promise<string>;
  renderPdf(html: string): Promise<Uint8Array>;
  sink: ByteSink;
  onProgress?(p: PackProgress): void;
  /** Checked between files and chunks; when true, packing stops with ExportCancelledError. */
  signal?: { aborted: boolean };
  /** Gives the UI a turn (setTimeout 0 on the phone; nothing in tests). */
  yieldToUi?: () => Promise<void>;
  /** ZIP entry timestamps; defaults to the snapshot time. */
  mtime?: Date;
}

export interface PackResult {
  manifest: Manifest;
  manifestSha256: string;
  bytesWritten: number;
  /** Entry ids whose recording no longer matches its capture hash (DATA-REQ-046). Ids only, never content. */
  mismatched: string[];
}

export class ExportCancelledError extends Error {
  constructor() {
    super('export_cancelled');
    this.name = 'ExportCancelledError';
  }
}

export class ExportTooLargeError extends Error {
  constructor() {
    super('export_too_large');
    this.name = 'ExportTooLargeError';
  }
}

/** Rough size of a book PDF before it is rendered (progress and space checks only). */
export const estimatePdfBytes = (letters: number) => 60_000 + letters * 3_000;

/** Bytes the export will take, before it is made (space check and the 4 GiB guard). */
export function estimateExportBytes(snapshot: ExportSnapshot): number {
  const plan = planExport(snapshot);
  const text = plan.textFiles.reduce((n, f) => n + f.text.length * 1.2, 0);
  const audio = plan.audio.reduce((n, a) => n + (a.sizeHint ?? 2_000_000), 0);
  const books = plan.books.reduce((n, b) => n + estimatePdfBytes(b.letters), 0);
  const data = snapshot.entries.length * 2_500;
  const headers = (plan.textFiles.length + plan.audio.length + plan.books.length + 6) * 200;
  return Math.ceil(text + audio + books + data + headers);
}

export async function packExport(snapshot: ExportSnapshot, deps: PackDeps): Promise<PackResult> {
  const plan = planExport(snapshot);
  const mtime = deps.mtime ?? new Date(snapshot.generatedAt);
  const yieldToUi = deps.yieldToUi ?? (async () => {});
  const check = () => {
    if (deps.signal?.aborted) throw new ExportCancelledError();
  };

  if (estimateExportBytes(snapshot) > MAX_EXPORT_BYTES) throw new ExportTooLargeError();

  let written = 0;
  let zipError: Error | null = null;
  let finished = false;
  const zip = new Zip((err, chunk, final) => {
    if (err) {
      zipError = err;
      return;
    }
    if (chunk.length > 0) {
      deps.sink.write(chunk);
      written += chunk.length;
    }
    if (final) finished = true;
  });

  // Progress by planned bytes: text and data are small, recordings are most of it.
  const total =
    plan.textFiles.reduce((n, f) => n + f.text.length, 0) +
    plan.audio.reduce((n, a) => n + (a.sizeHint ?? 1_000_000), 0) +
    plan.books.reduce((n, b) => n + estimatePdfBytes(b.letters), 0) +
    snapshot.entries.length * 2_500 +
    1;
  let done = 0;
  const report = (phase: ExportPhase, add: number) => {
    done += add;
    deps.onProgress?.({ phase, fraction: Math.min(0.999, done / total) });
  };

  const files: ManifestFile[] = [];
  const add = async (path: string, data: Uint8Array, mediaType: string, sha256?: string) => {
    check();
    const hash = sha256 ?? (await deps.sha256(data));
    const f = new ZipPassThrough(path);
    f.mtime = mtime;
    zip.add(f);
    if (data.length === 0) f.push(new Uint8Array(0), true);
    for (let off = 0; off < data.length; off += CHUNK) {
      f.push(data.subarray(off, Math.min(data.length, off + CHUNK)), off + CHUNK >= data.length);
      if (zipError) throw zipError;
      if (data.length > CHUNK) {
        await yieldToUi();
        check();
      }
    }
    if (zipError) throw zipError;
    files.push({ path, bytes: data.length, sha256: hash, media_type: mediaType });
  };

  deps.onProgress?.({ phase: 'books', fraction: 0 });

  // 1. README and schema first, so they sit at the top of the archive.
  const [readme, schema, ...rest] = plan.textFiles;
  for (const f of [readme, schema]) {
    await add(f.path, strToU8(f.text), f.mediaType);
    report('letters', f.text.length);
  }

  // 2. One printable book per child.
  for (const b of plan.books) {
    check();
    const pdf = await deps.renderPdf(b.html);
    await add(b.path, pdf, MEDIA.pdf);
    report('books', estimatePdfBytes(b.letters));
    await yieldToUi();
  }

  // 3. Letters as text, and the offline reader.
  let sinceYield = 0;
  for (const f of rest) {
    await add(f.path, strToU8(f.text), f.mediaType);
    report('letters', f.text.length);
    sinceYield += f.text.length;
    if (sinceYield > CHUNK) {
      sinceYield = 0;
      await yieldToUi();
    }
  }

  // 4. Original recordings, byte for byte, each hashed as it goes in.
  const audioResults = new Map<string, AudioResult>();
  const mismatched: string[] = [];
  for (const job of plan.audio) {
    check();
    let data: Uint8Array;
    try {
      data = await deps.readFile(job.uri);
    } catch {
      // Vanished between the snapshot and now: the entry is listed with audio_missing.
      report('recordings', job.sizeHint ?? 1_000_000);
      continue;
    }
    const sha256 = await deps.sha256(data);
    await add(job.path, data, MEDIA.m4a, sha256);
    audioResults.set(job.entryId, { sha256, bytes: data.length });
    if (job.recordedSha256 && job.recordedSha256 !== sha256) mismatched.push(job.entryId);
    report('recordings', job.sizeHint ?? data.length);
    await yieldToUi();
  }

  // 5. Data files, with the hashes of the recordings actually written.
  const sha256Text = (text: string) => deps.sha256(strToU8(text));
  const data = await dataFiles(snapshot, plan, audioResults, sha256Text);
  for (const f of data.files) {
    await add(f.path, strToU8(f.text), f.mediaType);
    report('data', f.text.length);
  }

  // 6. Manifest last: every file above, with size and SHA-256 (DATA-REQ-051).
  const entriesCount = snapshot.entries.filter((e) => e.childId && snapshot.children.some((c) => c.id === e.childId)).length;
  const manifest: Manifest = {
    format: EXPORT_FORMAT,
    format_version: EXPORT_SCHEMA_VERSION,
    generated_at: snapshot.generatedAt,
    app_version: snapshot.appVersion,
    engine_version: snapshot.engineVersion,
    scope: { exporter_role: 'parent', children: snapshot.children.length, include_recently_deleted: false },
    counts: {
      entries: entriesCount,
      audio: audioResults.size,
      audio_missing: data.audioMissing,
      audio_mismatch: mismatched.length,
      photos: 0,
      books: plan.books.length,
    },
    files: [...files],
  };
  const manifestBytes = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
  const manifestSha256 = await deps.sha256(manifestBytes);
  await add('manifest.json', manifestBytes, MEDIA.json, manifestSha256);
  await add('manifest.sha256', strToU8(`${manifestSha256}  manifest.json\n`), MEDIA.txt);

  zip.end();
  if (zipError) throw zipError;
  if (!finished) throw new Error('export_zip_unfinished');
  deps.onProgress?.({ phase: 'data', fraction: 1 });
  return { manifest, manifestSha256, bytesWritten: written, mismatched };
}
