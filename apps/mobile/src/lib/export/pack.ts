/**
 * Builds the export ZIP from a plan (build.logic.ts) and checks it
 * (DATA-REQ-051). Platform-neutral: files, hashing and PDF rendering come in
 * as functions, so the same code runs on the phone (device.ts) and in the
 * Node golden test.
 *
 * ZIP: stored entries (no compression: recordings and PDFs are already
 * compressed, and stored entries are the most widely readable), written by
 * zip-writer.ts with a data descriptor after each entry. One export is one file
 * at any size (BL-388): ZIP64 past 4 GiB; below it, the bytes fflate wrote. A
 * one-year book is about 230 MB (C-NFR-007).
 *
 * One file is in memory at a time, besides the first picture that passes the guard (kept from step 0 to step 4c).
 * The sink receives the ZIP bytes in order.
 */
import { strToU8 } from 'fflate';
import { EXPORT_FORMAT, EXPORT_SCHEMA_VERSION, type Manifest, type ManifestFile } from './schema';
import { carriesMetadata } from '../photos/strip';
import { ZipWriter } from './zip-writer';
import { dataFiles, exporterRole, MEDIA, planExport, type AudioResult, type ExportSnapshot, type PhotoJob } from './build.logic';

/** Free space is the real limit (ExportLowSpaceError). This keeps offsets exact in a JS number (2^53 - 1, about 9 PB): ExportTooLargeError stays for an estimate no phone can hold. */
export const MAX_EXPORT_BYTES = Number.MAX_SAFE_INTEGER;
const CHUNK = 1 << 20; // 1 MiB: push size, and how often the UI gets a turn

export interface ByteSink {
  write(chunk: Uint8Array): void;
}

export type ExportPhase = 'books' | 'letters' | 'recordings' | 'pictures' | 'data' | 'checking';

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
  /** Entry ids (and waiting letters' draft ids) whose recording no longer matches its capture hash (DATA-REQ-046). Ids only, never content. */
  mismatched: string[];
  /** Entry ids whose picture was held back: its bytes were not the stored copy, or carried metadata (1.7.0). Ids only. */
  photosHeldBack: string[];
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

/** Bytes the export will take, before it is made (the space check). */
export function estimateExportBytes(snapshot: ExportSnapshot): number {
  const plan = planExport(snapshot);
  const text = plan.textFiles.reduce((n, f) => n + f.text.length * 1.2, 0);
  const audio = [...plan.audio, ...plan.waitingAudio, ...plan.orphanAudio].reduce((n, a) => n + (a.sizeHint ?? 2_000_000), 0);
  const photos = plan.photos.reduce((n, p) => n + p.sizeHint, 0);
  const books = plan.books.reduce((n, b) => n + estimatePdfBytes(b.letters), 0);
  const data = (snapshot.entries.length + (snapshot.waiting?.length ?? 0)) * 2_500;
  const recordings = plan.audio.length + plan.waitingAudio.length + plan.orphanAudio.length;
  const headers = (plan.textFiles.length + recordings + plan.photos.length + plan.books.length + 8) * 200;
  return Math.ceil(text + audio + photos + books + data + headers);
}

export async function packExport(snapshot: ExportSnapshot, deps: PackDeps): Promise<PackResult> {
  const plan = planExport(snapshot);
  const mtime = deps.mtime ?? new Date(snapshot.generatedAt);
  const yieldToUi = deps.yieldToUi ?? (async () => {});
  const check = () => {
    if (deps.signal?.aborted) throw new ExportCancelledError();
  };

  if (estimateExportBytes(snapshot) > MAX_EXPORT_BYTES) throw new ExportTooLargeError();

  const zip = new ZipWriter((chunk) => deps.sink.write(chunk), { mtime });

  // Progress by planned bytes: text and data are small, recordings are most of it.
  const total =
    plan.textFiles.reduce((n, f) => n + f.text.length, 0) +
    [...plan.audio, ...plan.waitingAudio, ...plan.orphanAudio].reduce((n, a) => n + (a.sizeHint ?? 1_000_000), 0) +
    plan.photos.reduce((n, p) => n + p.sizeHint, 0) +
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
    zip.begin(path, data.length);
    for (let off = 0; off < data.length; off += CHUNK) {
      zip.push(data.subarray(off, Math.min(data.length, off + CHUNK)));
      if (data.length > CHUNK) {
        await yieldToUi();
        check();
      }
    }
    zip.finish();
    files.push({ path, bytes: data.length, sha256: hash, media_type: mediaType });
  };

  deps.onProgress?.({ phase: 'books', fraction: 0 });

  // The last guard before a picture leaves the phone (NS-01-R6, BL-1410), read once per picture: bytes that are not the
  // copy the app stored (its `entry_media` hash), or that carry an Exif, XMP, IPTC or comment segment or anything after
  // the end marker, are held back and the letter says `photo: null`. Fail closed: a picture that may hold a location
  // never goes in, even if the stored copy was changed on disk after it was kept. Null when it vanished or is held back.
  const photosHeldBack: string[] = [];
  const checkedPhoto = async (job: PhotoJob): Promise<{ data: Uint8Array; sha256: string } | null> => {
    let data: Uint8Array;
    try {
      data = await deps.readFile(job.uri);
    } catch {
      return null; // vanished between the snapshot and now: the letter says photo: null
    }
    const sha256 = await deps.sha256(data);
    if (sha256 !== job.storedSha256 || carriesMetadata(data)) {
      photosHeldBack.push(job.entryId);
      return null;
    }
    return { data, sha256 };
  };

  // 0. The first picture that passes the guard, kept to write in step 4c, so the README describes photos/ only when
  // a picture will be in it. Pictures before it that fail are judged here once and not read again.
  let photoIndex = 0;
  let firstPhoto: { data: Uint8Array; sha256: string } | null = null;
  for (; photoIndex < plan.photos.length && !firstPhoto; photoIndex++) {
    check();
    firstPhoto = await checkedPhoto(plan.photos[photoIndex]);
    if (!firstPhoto) report('pictures', plan.photos[photoIndex].sizeHint);
  }
  if (firstPhoto) photoIndex--; // step 4c starts at the picture it keeps

  // 1. README and schema first, so they sit at the top of the archive.
  const [, schema, ...rest] = plan.textFiles;
  const readme = plan.readmeFor(firstPhoto !== null);
  await add('README.txt', strToU8(readme), MEDIA.txt);
  report('letters', readme.length);
  await add(schema.path, strToU8(schema.text), schema.mediaType);
  report('letters', schema.text.length);

  // 2. One printable book per child.
  for (const b of plan.books) {
    check();
    const pdf = await deps.renderPdf(b.html);
    await add(b.path, pdf, MEDIA.pdf);
    report('books', estimatePdfBytes(b.letters));
    await yieldToUi();
  }

  // 3. Letters as text. The offline reader waits for the pictures (step 4d).
  let sinceYield = 0;
  for (const f of rest) {
    if (f.path === 'index.html') continue;
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
    await add(job.path, data, job.mediaType, sha256); // `audio/mp4` or `audio/aac`, as the recording is (ADR 0027)
    audioResults.set(job.entryId, { sha256, bytes: data.length });
    if (job.recordedSha256 && job.recordedSha256 !== sha256) mismatched.push(job.entryId);
    report('recordings', job.sizeHint ?? data.length);
    await yieldToUi();
  }

  // 4b. Recordings of letters that are waiting (1.6.0, PL-2), the same way, under waiting/.
  const waitingResults = new Map<string, AudioResult>();
  const waitingMismatched: string[] = [];
  for (const job of plan.waitingAudio) {
    check();
    let data: Uint8Array;
    try {
      data = await deps.readFile(job.uri);
    } catch {
      // Vanished between the snapshot and now: listed in waiting.json with audio_missing.
      report('recordings', job.sizeHint ?? 1_000_000);
      continue;
    }
    const sha256 = await deps.sha256(data);
    await add(job.path, data, job.mediaType, sha256);
    waitingResults.set(job.entryId, { sha256, bytes: data.length });
    if (job.recordedSha256 && job.recordedSha256 !== sha256) waitingMismatched.push(job.entryId);
    report('recordings', job.sizeHint ?? data.length);
    await yieldToUi();
  }

  // Then recordings in no letter or draft (1.8.0, BL-388), the same way, under not-in-the-book/.
  const orphanResults = new Map<string, AudioResult>();
  for (const job of plan.orphanAudio) {
    check();
    let data: Uint8Array;
    try {
      data = await deps.readFile(job.uri);
    } catch {
      // Vanished between the snapshot and now: listed in not_in_the_book.json with no file.
      report('recordings', job.sizeHint ?? 1_000_000);
      continue;
    }
    const sha256 = await deps.sha256(data);
    await add(job.path, data, job.mediaType, sha256);
    orphanResults.set(job.fileName, { sha256, bytes: data.length });
    report('recordings', job.sizeHint ?? data.length);
    await yieldToUi();
  }

  // 4c. Letters' pictures (1.7.0): the stored copy, byte for byte, each through the guard above (the first one already).
  const photoResults = new Map<string, AudioResult>();
  for (; photoIndex < plan.photos.length; photoIndex++) {
    check();
    const job = plan.photos[photoIndex];
    const ok = firstPhoto ?? (await checkedPhoto(job));
    firstPhoto = null;
    report('pictures', job.sizeHint);
    if (!ok) continue;
    await add(job.path, ok.data, 'image/jpeg', ok.sha256);
    photoResults.set(job.entryId, { sha256: ok.sha256, bytes: ok.data.length });
    await yieldToUi();
  }

  // 4d. The offline reader, showing only the pictures that went in.
  const reader = plan.readerFor(new Set(photoResults.keys()));
  await add('index.html', strToU8(reader), MEDIA.html);
  report('letters', reader.length);

  // 5. Data files, with the hashes of the recordings and pictures actually written.
  const sha256Text = (text: string) => deps.sha256(strToU8(text));
  const data = await dataFiles(snapshot, plan, audioResults, sha256Text, waitingResults, photoResults, orphanResults);
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
    scope: { exporter_role: exporterRole(snapshot.children), children: snapshot.children.length, include_recently_deleted: false },
    counts: {
      entries: entriesCount,
      audio: audioResults.size,
      audio_missing: data.audioMissing,
      // Letters only, as before 1.6.0; a waiting recording's integrity is in data/waiting.json.
      audio_mismatch: mismatched.length,
      photos: photoResults.size,
      books: plan.books.length,
    },
    files: [...files],
  };
  const manifestBytes = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);
  const manifestSha256 = await deps.sha256(manifestBytes);
  await add('manifest.json', manifestBytes, MEDIA.json, manifestSha256);
  await add('manifest.sha256', strToU8(`${manifestSha256}  manifest.json\n`), MEDIA.txt);

  const written = zip.end();
  deps.onProgress?.({ phase: 'data', fraction: 1 });
  return { manifest, manifestSha256, bytesWritten: written, mismatched: [...mismatched, ...waitingMismatched], photosHeldBack };
}
