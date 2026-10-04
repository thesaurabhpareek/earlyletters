/**
 * What goes into an export, decided from a snapshot of the phone's data
 * (DELETION_AND_EXPORT_SPEC 4.1, 4.2; LEGAL-REQ-034; DATA-REQ-050). Pure:
 * no files, no clock, no React Native. `pack.ts` turns this plan into a ZIP;
 * `device.ts` takes the snapshot from the store.
 *
 * Rules:
 * - Every letter on this phone, in book or private, in every book including
 *   hidden ones. Recently deleted letters are not included (the store has no
 *   read API for them yet).
 * - Own letters carry raw transcript, its SHA-256, machine edits and engine
 *   version. Other people's letters carry only what the book shows (4.1).
 * - Original recordings, byte for byte. A recording that is not on this
 *   phone is listed with `audio_missing`.
 * - The printable book holds the letters in the book that have words.
 */
import { brand } from '@scribe/brand';
import { book as bookWords } from '@scribe/content';
import { ageOn, chapterOf, renderTemplate } from '@scribe/core';
import { copy } from '../copy';
import { provenanceKey } from '../provenance';
import { dayDate, letterDateline } from '../dates';
import type { Child, Entry } from '../store';
import { exportCopy } from './copy';
import {
  EXPORT_FORMAT,
  EXPORT_SCHEMA_VERSION,
  exportJsonSchema,
  type AccountFile,
  type ChildrenFile,
  type EntriesFile,
  type ExportAudio,
  type ExportEntry,
} from './schema';

export interface SnapshotChild extends Child {
  hidden: boolean;
}

export interface SnapshotEntry extends Entry {
  /** Written by the person making the export. */
  own: boolean;
  /** The recording file exists on this phone. */
  audioOnPhone: boolean;
  /** Its size on disk, when known (progress and space checks). */
  audioSizeOnPhone: number | null;
}

export interface ExportSnapshot {
  /** ISO instant the export was made. */
  generatedAt: string;
  appVersion: string;
  engineVersion: number;
  /** English locale for dates (lib/dates). */
  locale: string;
  plan: 'free' | 'plus';
  signedIn: boolean;
  children: SnapshotChild[];
  entries: SnapshotEntry[];
}

export interface TextFile {
  path: string;
  text: string;
  mediaType: string;
}

export interface AudioJob {
  entryId: string;
  uri: string;
  path: string;
  recordedSha256: string | null;
  durationMs: number | null;
  sizeHint: number | null;
}

export interface BookJob {
  childId: string;
  path: string;
  /** HTML for expo-print (serif, cover, month chapters). */
  html: string;
  letters: number;
}

export interface AudioResult {
  sha256: string;
  bytes: number;
}

export interface ExportPlan {
  /** Written first: README, schema, letters, index.html. */
  textFiles: TextFile[];
  books: BookJob[];
  audio: AudioJob[];
}

export const MEDIA = {
  txt: 'text/plain; charset=utf-8',
  json: 'application/json',
  html: 'text/html; charset=utf-8',
  pdf: 'application/pdf',
  m4a: 'audio/mp4',
} as const;

const fill = (text: string, values: Record<string, string | number>) => renderTemplate(text, { app: brand.name, ...values });

// ── Names and paths ──────────────────────────────────────────────────────

/** A file or folder name that is safe on macOS, Windows and Linux. Keeps every script (Devanagari, Arabic, Chinese). */
export function safeSegment(name: string, fallback: string): string {
  const cleaned = name
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '');
  const short = [...cleaned].slice(0, 60).join('').trim();
  return short || fallback;
}

/** One folder name per child; two children with the same name get their id added. */
export function childFolders(children: Pick<Child, 'id' | 'name'>[]): Map<string, string> {
  const base = children.map((c) => safeSegment(c.name, `book-${c.id.slice(0, 8)}`));
  const out = new Map<string, string>();
  children.forEach((c, i) => {
    const clash = base.filter((b) => b.toLowerCase() === base[i].toLowerCase()).length > 1;
    out.set(c.id, clash ? `${base[i]}-${c.id.slice(0, 8)}` : base[i]);
  });
  return out;
}

export const audioPath = (entryId: string) => `audio/${entryId}.m4a`;

export function letterPath(folder: string, e: Pick<Entry, 'id' | 'occurredOn'>): string {
  return `letters/${folder}/${e.occurredOn.slice(0, 7)}/${e.occurredOn.slice(0, 10)}_${e.id}.txt`;
}

/** Oldest first, the way a book reads. */
export function oldestFirst<T extends Pick<Entry, 'occurredOn' | 'capturedAt' | 'id'>>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.capturedAt.localeCompare(b.capturedAt) || a.id.localeCompare(b.id),
  );
}

// ── Per-letter facts ─────────────────────────────────────────────────────

const signsAsOf = (e: Entry, child: Child) => e.authorSignsAs ?? child.signsAs;
const spoken = (e: Entry) => e.captureMode !== 'typed';
const waiting = (e: Entry) => e.transcriptStatus === 'waiting';

/** The one rule for what a letter's words may be called (lib/provenance.ts, D-086). */
function provenance(e: Entry): string {
  return copy.book.provenance[provenanceKey(e)];
}

/** Month of age (0 = the first weeks), or null before birth or with no birthday ("Before You"). */
export function monthOf(child: Pick<Child, 'birthday'>, iso: string): number | null {
  if (!child.birthday) return null;
  if (ageOn(child.birthday, iso).days < 0) return null;
  return chapterOf(child.birthday, iso);
}

export function chapterName(month: number | null): string {
  if (month === null) return copy.book.beforeYouChapter;
  if (month === 0) return copy.book.chapterNewborn;
  return fill(copy.book.chapterTitle, { month });
}

/** Year of the book a month falls in (Before You and months 0 to 11 are Year 1). */
export const yearOf = (month: number | null) => (month === null ? 1 : Math.floor(month / 12) + 1);

export function audioMissingReason(e: SnapshotEntry): 'not_on_this_device' | null {
  if (!spoken(e)) return null;
  if (!e.own) return 'not_on_this_device'; // v1.0: a family member's recording stays on their phone (D-032)
  if (!e.audioUri) return null; // "Keep recordings" was off: there never was a file
  return e.audioOnPhone ? null : 'not_on_this_device';
}

function letterText(e: SnapshotEntry, child: SnapshotChild, locale: string): string {
  const l = exportCopy.letterFile;
  const lines = [
    `${l.to}: ${child.name}`,
    `${l.from}: ${signsAsOf(e, child)}`,
    `${l.date}: ${letterDateline(child, e.occurredOn, locale)}`,
  ];
  if (!waiting(e)) lines.push(`${l.how}: ${provenance(e)}`);
  if (spoken(e)) {
    // Own letter: the file here, or a note that it is not on this phone. No line when no recording was kept.
    const where = !e.own ? l.recordingElsewhere : !e.audioUri ? null : e.audioOnPhone ? audioPath(e.id) : l.recordingElsewhere;
    if (where) lines.push(`${l.recording}: ${where}`);
  }
  lines.push(`${l.inBook}: ${e.inBook ? l.yes : l.no}`);
  const body = waiting(e) ? l.waitingForWords : e.finalText;
  let text = `${lines.join('\n')}\n\n${body}\n`;
  if (e.own && spoken(e) && !waiting(e) && e.rawTranscript && e.rawTranscript !== e.finalText) {
    text += `\n\n${l.exactlyHeard}:\n${e.rawTranscript}\n`;
  }
  return text;
}

// ── HTML helpers ─────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Paragraphs from a letter's text: blank lines split paragraphs, single newlines stay as line breaks. */
export function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p dir="auto">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

const SERIF = 'ui-serif, "New York", "Iowan Old Style", Georgia, "Noto Serif", "Times New Roman", serif';
const SANS = '-apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

function chaptersOf(child: SnapshotChild, entries: SnapshotEntry[]): { month: number | null; entries: SnapshotEntry[] }[] {
  const groups = new Map<string, { month: number | null; entries: SnapshotEntry[] }>();
  for (const e of oldestFirst(entries)) {
    const month = monthOf(child, e.occurredOn);
    const key = month === null ? 'before' : String(month);
    const g = groups.get(key) ?? { month, entries: [] };
    g.entries.push(e);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => (a.month ?? -1) - (b.month ?? -1));
}

// ── The offline reader (index.html) ──────────────────────────────────────

function indexHtml(snapshot: ExportSnapshot, folders: Map<string, string>): string {
  const r = exportCopy.reader;
  const c = brand.colors;
  const sections = snapshot.children
    .map((child) => {
      const mine = snapshot.entries.filter((e) => e.childId === child.id);
      if (mine.length === 0) return '';
      const chapters = chaptersOf(child, mine)
        .map(
          (ch) => `<h3>${escapeHtml(chapterName(ch.month))}</h3>\n${ch.entries
            .map((e) => {
              const missing = audioMissingReason(e);
              const audio =
                spoken(e) && e.own && e.audioUri && e.audioOnPhone
                  ? `<audio controls preload="none" src="${audioPath(e.id)}"></audio>`
                  : missing
                    ? `<p class="note">${escapeHtml(r.recordingNotHere)}</p>`
                    : '';
              const body = waiting(e) ? `<p class="note">${escapeHtml(exportCopy.letterFile.waitingForWords)}</p>` : paragraphs(e.finalText);
              return `<article>
<p class="date">${escapeHtml(dayDate(e.occurredOn, snapshot.locale))}${e.inBook ? '' : ` <span class="tag">${escapeHtml(r.privateLabel)}</span>`}</p>
${body}
<p class="sig" dir="auto">${escapeHtml(fill(copy.book.signature, { signsAs: signsAsOf(e, child) }))}</p>
${audio}
<p class="file"><a href="${encodeURI(letterPath(folders.get(child.id)!, e))}">${escapeHtml(letterPath(folders.get(child.id)!, e))}</a></p>
</article>`;
            })
            .join('\n')}`,
        )
        .join('\n');
      return `<section>\n<h2 dir="auto">${escapeHtml(fill(r.title, { child: child.name }))}</h2>\n${chapters}\n</section>`;
    })
    .filter(Boolean)
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(brand.name)}</title>
<style>
body{margin:0 auto;max-width:42rem;padding:2rem 1.25rem 4rem;background:${c.paper};color:${c.ink};font-family:${SERIF};font-size:1.15rem;line-height:1.6}
h1,h2,h3{font-weight:500;line-height:1.25}h1{font-size:2rem}h2{font-size:1.6rem;margin-top:3rem}h3{font-size:1.2rem;color:${c.accent};margin-top:2.5rem}
article{border-top:1px solid ${c.line};padding:1.25rem 0}
.date,.note,.file,.intro{font-family:${SANS};font-size:.85rem;color:${c.inkMuted}}
.tag{border:1px solid ${c.line};border-radius:999px;padding:0 .5rem;margin-left:.5rem}
.sig{text-align:end;font-style:italic}
audio{width:100%;margin:.5rem 0}
a{color:${c.accent}}
@media (prefers-color-scheme: dark){body{background:${c.paperDark};color:${c.inkDark}}article{border-color:${c.lineDark}}.date,.note,.file,.intro{color:${c.inkMutedDark}}h3,a{color:${c.accentDark}}}
</style>
</head>
<body>
<h1>${escapeHtml(brand.name)}</h1>
<p class="intro">${escapeHtml(r.intro)}</p>
${sections}
</body>
</html>
`;
}

// ── The printable book (expo-print HTML) ─────────────────────────────────

export type Paper = { width: number; height: number; name: 'letter' | 'a4' };

/** US Letter where people print on it, A4 elsewhere (points, for expo-print). */
export function paperFor(locale: string): Paper {
  const region = /[-_]([A-Za-z]{2})\b/.exec(locale)?.[1]?.toUpperCase();
  const letter = ['US', 'CA', 'MX', 'PH', 'CL', 'CO', 'VE', 'GT', 'CR', 'PR', 'PA', 'DO', 'SV'];
  return region && letter.includes(region) ? { width: 612, height: 792, name: 'letter' } : { width: 595, height: 842, name: 'a4' };
}

export function bookHtml(child: SnapshotChild, entries: SnapshotEntry[], locale: string): string {
  const c = brand.colors;
  const inBook = entries.filter((e) => e.inBook && !waiting(e) && e.finalText.trim().length > 0);
  const chapters = chaptersOf(child, inBook);
  const years = [...new Set(chapters.map((ch) => yearOf(ch.month)))];
  const subtitle =
    years.length === 1 ? fill(bookWords.coverSubtitle, { child: child.name, n: years[0] }) : fill(exportCopy.pdf.coverSubtitleAll, { child: child.name });
  const about = bookWords.aboutThisBook;
  let lastYear = 0;
  const body = chapters
    .map((ch) => {
      const year = yearOf(ch.month);
      const yearHead = years.length > 1 && year !== lastYear ? `<p class="year">${escapeHtml(fill(exportCopy.pdf.yearHeading, { n: year }))}</p>` : '';
      lastYear = year;
      const letters = ch.entries
        .map(
          (e) => `<article>
<p class="date">${escapeHtml(letterDateline(child, e.occurredOn, locale))}</p>
${paragraphs(e.finalText)}
<p class="sig" dir="auto">${escapeHtml(fill(copy.book.signature, { signsAs: signsAsOf(e, child) }))}</p>
</article>`,
        )
        .join('\n');
      return `<section class="chapter">\n${yearHead}<h2>${escapeHtml(chapterName(ch.month))}</h2>\n${letters}\n</section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
@page{margin:0}
html,body{margin:0;padding:0;background:#fff;color:${c.ink};font-family:${SERIF};font-size:12.5pt;line-height:1.55;-webkit-print-color-adjust:exact}
.cover{height:9in;display:flex;flex-direction:column;justify-content:center;text-align:center;page-break-after:always;break-after:page}
.cover h1{font-size:34pt;font-weight:400;letter-spacing:.5pt;margin:0 0 14pt}
.cover .sub{font-size:16pt;font-style:italic;color:${c.accent};margin:0}
.cover .ded{font-size:12pt;color:${c.inkMuted};margin-top:48pt}
.about{page-break-after:always;break-after:page;padding-top:1.5in}
.about h2{font-size:16pt;font-weight:500}
.about p{color:${c.inkMuted}}
.chapter{page-break-before:always;break-before:page}
.year{font-size:11pt;letter-spacing:2pt;text-transform:uppercase;color:${c.inkMuted};margin:0 0 6pt}
.chapter h2{font-size:22pt;font-weight:400;color:${c.accent};margin:0 0 18pt;padding-bottom:8pt;border-bottom:0.75pt solid ${c.line}}
article{margin:0 0 22pt;break-inside:avoid-page}
article p{margin:0 0 8pt;orphans:3;widows:3}
.date{font-size:9.5pt;letter-spacing:.4pt;color:${c.inkMuted};margin-bottom:6pt}
.sig{text-align:end;font-style:italic;margin-top:6pt}
.colophon{page-break-before:always;break-before:page;padding-top:3in;text-align:center;font-size:10pt;color:${c.inkMuted}}
</style>
</head>
<body>
<div class="cover">
<h1>${escapeHtml(brand.name)}</h1>
<p class="sub" dir="auto">${escapeHtml(subtitle)}</p>
<p class="ded" dir="auto">${escapeHtml(fill(bookWords.dedication, { child: child.name }))}</p>
</div>
<div class="about">
<h2>${escapeHtml(about.title)}</h2>
<p dir="auto">${escapeHtml(fill(about.body, { child: child.name }))}</p>
</div>
${body}
<p class="colophon">${escapeHtml(fill(bookWords.colophon, {}))}</p>
</body>
</html>
`;
}

// ── Plan and data files ──────────────────────────────────────────────────

function readme(snapshot: ExportSnapshot): string {
  return (
    exportCopy.readme
      .map((line) =>
        fill(line, {
          date: dayDate(snapshot.generatedAt.slice(0, 10), snapshot.locale),
          format: EXPORT_FORMAT,
          version: EXPORT_SCHEMA_VERSION,
          email: brand.support.email,
        }),
      )
      .join('\r\n') + '\r\n' // CRLF so Notepad on an old Windows machine shows the lines
  );
}

export function planExport(snapshot: ExportSnapshot): ExportPlan {
  const folders = childFolders(snapshot.children);
  const byChild = new Map(snapshot.children.map((c) => [c.id, c]));
  const entries = oldestFirst(snapshot.entries.filter((e) => e.childId && byChild.has(e.childId)));

  const textFiles: TextFile[] = [
    { path: 'README.txt', text: readme(snapshot), mediaType: MEDIA.txt },
    { path: 'schema/export-v1.schema.json', text: `${JSON.stringify(exportJsonSchema, null, 2)}\n`, mediaType: MEDIA.json },
  ];
  for (const e of entries) {
    const child = byChild.get(e.childId!)!;
    textFiles.push({ path: letterPath(folders.get(child.id)!, e), text: letterText(e, child, snapshot.locale), mediaType: MEDIA.txt });
  }
  textFiles.push({ path: 'index.html', text: indexHtml({ ...snapshot, entries }, folders), mediaType: MEDIA.html });

  const books: BookJob[] = [];
  for (const child of snapshot.children) {
    const mine = entries.filter((e) => e.childId === child.id && e.inBook && !waiting(e) && e.finalText.trim().length > 0);
    if (mine.length === 0) continue;
    books.push({ childId: child.id, path: `book/${folders.get(child.id)}.pdf`, html: bookHtml(child, mine, snapshot.locale), letters: mine.length });
  }

  const audio: AudioJob[] = entries
    .filter((e) => spoken(e) && e.own && e.audioUri && e.audioOnPhone)
    .map((e) => ({
      entryId: e.id,
      uri: e.audioUri!,
      path: audioPath(e.id),
      recordedSha256: e.audioSha256 ?? null,
      durationMs: e.audioDurationMs ?? null,
      sizeHint: e.audioSizeOnPhone ?? e.audioBytes ?? null,
    }));

  return { textFiles, books, audio };
}

/**
 * entries.json, children.json and account.json, written after the
 * recordings so each one carries the hash of the file actually exported.
 */
export async function dataFiles(
  snapshot: ExportSnapshot,
  plan: ExportPlan,
  audioResults: Map<string, AudioResult>,
  sha256Text: (text: string) => Promise<string>,
): Promise<{ files: TextFile[]; audioMissing: number }> {
  const folders = childFolders(snapshot.children);
  const byChild = new Map(snapshot.children.map((c) => [c.id, c]));
  const jobs = new Map(plan.audio.map((j) => [j.entryId, j]));
  const books = new Map(plan.books.map((b) => [b.childId, b.path]));
  const entries = oldestFirst(snapshot.entries.filter((e) => e.childId && byChild.has(e.childId)));

  const out: ExportEntry[] = [];
  for (const e of entries) {
    const child = byChild.get(e.childId!)!;
    const job = jobs.get(e.id);
    const result = audioResults.get(e.id);
    let audio: ExportAudio | null = null;
    if (job && result) {
      audio = {
        path: job.path,
        sha256: result.sha256,
        bytes: result.bytes,
        duration_ms: job.durationMs,
        codec: 'aac-lc',
        media_type: 'audio/mp4',
        integrity: !job.recordedSha256 ? 'unchecked' : job.recordedSha256 === result.sha256 ? 'ok' : 'mismatch',
        recorded_sha256: job.recordedSha256,
      };
    }
    // A planned recording that could not be read at packing time is "not on this device" too.
    const missing = audio ? null : job ? 'not_on_this_device' : audioMissingReason(e);
    const row: ExportEntry = {
      id: e.id,
      child_id: child.id,
      author: { signs_as: signsAsOf(e, child), is_exporter: e.own },
      kind: e.kind,
      occurred_on: e.occurredOn,
      captured_at: e.capturedAt,
      capture_mode: e.captureMode,
      edit_level: e.editLevel,
      language: null,
      words: waiting(e) ? 'waiting_for_words' : 'ready',
      final_text: e.finalText,
      in_book: e.inBook,
      text_file: letterPath(folders.get(child.id)!, e),
      photo: null,
      audio,
      audio_missing: missing ? { reason: missing } : null,
    };
    if (e.own) {
      row.raw_transcript = e.rawTranscript;
      row.raw_sha256 = await sha256Text(e.rawTranscript);
      row.machine_edits = e.machineEdits.map((m) => ({
        type: m.type,
        start: m.start,
        end: m.end,
        original: m.original,
        replacement: m.replacement,
        source: m.source,
      }));
      row.engine_version = e.engineVersion;
      row.prompt_key = e.promptKey;
      row.sounds_like_me = e.soundsLikeMe;
      row.stt_meta = null;
      row.alignment = null;
    }
    out.push(row);
  }

  const entriesFile: EntriesFile = { schema_version: EXPORT_SCHEMA_VERSION, format: EXPORT_FORMAT, generated_at: snapshot.generatedAt, entries: out };
  const childrenFile: ChildrenFile = {
    schema_version: EXPORT_SCHEMA_VERSION,
    format: EXPORT_FORMAT,
    children: snapshot.children.map((c) => ({
      id: c.id,
      name: c.name,
      birthday: c.birthday,
      due_date: c.dueDate,
      signs_as: c.signsAs,
      signatures: [...new Set(entries.filter((e) => e.childId === c.id).map((e) => signsAsOf(e, c)))],
      hidden: c.hidden,
      book_file: books.get(c.id) ?? null,
    })),
  };
  const accountFile: AccountFile = {
    schema_version: EXPORT_SCHEMA_VERSION,
    format: EXPORT_FORMAT,
    signed_in: snapshot.signedIn,
    plan: snapshot.plan,
    exported_from: 'phone',
    memberships: snapshot.children.map((c) => ({ child_id: c.id, role: 'parent', signs_as: c.signsAs })),
  };
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  return {
    files: [
      { path: 'data/children.json', text: json(childrenFile), mediaType: MEDIA.json },
      { path: 'data/entries.json', text: json(entriesFile), mediaType: MEDIA.json },
      { path: 'data/account.json', text: json(accountFile), mediaType: MEDIA.json },
    ],
    audioMissing: out.filter((e) => e.audio_missing).length,
  };
}
