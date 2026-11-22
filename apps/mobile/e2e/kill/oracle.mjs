// Judges killed runs from what is on disk after a relaunch's sweep (snapshot.mjs), and from nothing the app
// says about itself. Pure: the I/O it needs (hashing, a playability probe) is passed in.
//
// DL-02, kill during save (07 "Kill during save", 06-nfr row 187, DATA-REQ-048): the letter exists exactly
// once with its words and its recording unchanged, or it is still exactly one draft with them. Outcomes:
//   letter   saved once                  draft  the kill came before the commit; the draft is intact
//   lost     neither, or the words or the recording are gone
//   doubled  more than one row holds the letter or its recording
//   fail     one row, but something in it is wrong (changed words, a hash that does not match its file, or,
//            at a crash point, the wrong one of letter and draft)
// DL-01, kill while recording (07 "Kill while recording", F04-REQ-024, F08-REQ-019, D-085): the take's file
// exists with bytes and exactly one row points at it, at that very path, so it is on Tonight or in Settings >
// Recordings.
//   kept-playable    the take opens (afinfo reads its header) and has a length above 0. An M4A's length is afinfo's
//                    estimated duration; an ADTS take's (`.aac`, ADR 0027) is its whole frames, counted on the host
//                    with the app's own scanAdts (adts-evidence.mjs), since afinfo opens a cut-off ADTS stream and
//                    estimates a duration whatever its frames are
//   kept-unplayable  kept and listed as one that may not play; counts against 07's "49 of 50 playable"
//   lost, doubled, fail as above; "fail" includes a take marked ready that will not play, and a row whose stored
//   path is not the listed take's (another folder or name: the host would be judging a file the app does not use).
// Every DL-01 verdict records the take's container and where its stored path stands; an ADTS take's also records
// its whole frames, the bytes after them and the scanAdts tail (`cut` or `none` after a kill; `break` is a finding
// ADR 0027 asks to report before any flip), with the facts check V1 asks for.
// auditStore checks the whole database after every relaunch: `PRAGMA integrity_check`, no row pointing at a
// missing file, no stored hash that differs from its file, and every letter judged kept earlier still kept.

import { adtsFactsOfFile, containerOfName, redactAfinfo } from './adts-evidence.mjs';
import { normalizePath } from './snapshot.mjs';

export const BAD_OUTCOMES = ['lost', 'doubled', 'fail'];

/** @param {string} outcome */
export function isBad(outcome) {
  return BAD_OUTCOMES.includes(outcome);
}

const firstFile = (snap, name) => (name ? (snap.files.get(name) ?? [])[0] ?? null : null);
const live = (r) => !(r.table === 'entries' && r.deleted);

/**
 * @param {object} snap  readSnapshot()
 * @param {{ draftId: string, kind: string, text: string, audioFile: string|null, sha256: string|null }} armed
 * @param {{ sha256: (path: string) => string }} io
 * @param {{ fixtureSha?: string|null, outcome?: 'draft'|'letter'|null, point?: string|null }} [expect]
 *   fixtureSha: the host's own hash of the fixture it placed (preferred over the app's); outcome: what a kill at
 *   a crash point must leave.
 */
export function classifyDl02(snap, armed, io, expect = {}) {
  const { draftId, kind, text, audioFile } = armed;
  const spoken = kind !== 'typed';
  const own = snap.idx.byId.get(draftId) ?? [];
  const letters = own.filter((r) => r.table === 'entries' && !r.deleted);
  const shelved = own.filter((r) => r.table === 'entries' && r.deleted);
  const drafts = own.filter((r) => r.table === 'drafts');
  const elsewhere = new Map();
  for (const r of snap.idx.byText.get(text) ?? []) if (r.id !== draftId) elsewhere.set(`${r.table}:${r.id}`, r);
  if (spoken && audioFile) for (const r of snap.idx.byFile.get(audioFile) ?? []) if (r.id !== draftId && live(r)) elsewhere.set(`${r.table}:${r.id}`, r);
  const mine = letters.length + drafts.length;
  if (mine + elsewhere.size > 1) return { outcome: 'doubled', reasons: [`${mine + elsewhere.size} rows hold this letter`] };
  if (mine === 0) {
    if (elsewhere.size === 1) return { outcome: 'lost', reasons: ['only a row under another id is left; the letter itself is gone'] };
    return { outcome: 'lost', reasons: [shelved.length ? 'the letter is on the Recently deleted shelf' : 'no letter and no draft'] };
  }
  const isLetter = letters.length === 1;
  const row = isLetter ? letters[0] : drafts[0];
  const reasons = [];
  if (isLetter) {
    if (row.finalText !== text || row.rawTranscript !== text) reasons.push('the letter words differ from what was saved');
  } else {
    const words = kind === 'typed' ? row.typedText : row.rawTranscript;
    if (words !== text) return { outcome: 'lost', reasons: ['the draft no longer holds its words'] };
  }
  if (spoken) {
    const f = firstFile(snap, audioFile);
    if (!f) return { outcome: 'lost', reasons: ['the recording file is gone'] };
    if ((snap.files.get(audioFile) ?? []).length > 1) reasons.push('two files share the recording name');
    if (row.audioFile !== audioFile) reasons.push('the row points at another file');
    const actual = io.sha256(f.path);
    const want = expect.fixtureSha ?? armed.sha256;
    if (want && actual !== want) reasons.push('the recording changed');
    if (isLetter && row.audioSha256 !== actual) reasons.push('the letter hash differs from its file');
    if (!isLetter && row.audioSha256 && row.audioSha256 !== actual) reasons.push('the draft hash differs from its file');
    if (snap.orphanSet.has(audioFile)) reasons.push('the recording is also listed as one without a letter');
  }
  const outcome = isLetter ? 'letter' : 'draft';
  if (expect.outcome && outcome !== expect.outcome) reasons.push(`a kill at ${expect.point ?? 'this point'} must leave the ${expect.outcome}, not the ${outcome}`);
  if (reasons.length) return { outcome: 'fail', reasons };
  return { outcome, reasons: [] };
}

/**
 * Where a row's stored path stands against the take the host lists, after both are normalized (`normalizePath`:
 * `//`, `./` and `../` resolved; the stored one also loses `file://` or `file://localhost` and its percent-encoding):
 * - `same`: the very file;
 * - `other-container`: the same folder and file under Documents, behind another container path (a `/private`
 *   prefix, another container id, a path relative to Documents). The app and the host spell the container
 *   differently; the app's sweep found the file at the stored path, or it would have rebased the row;
 * - `other`: any other folder or file, or no stored path. The row does not point at the file the host judged.
 * The comparison under Documents is by suffix: the stored path must end in `Documents/` and the listed take's path
 * inside the listed Documents folder, so a folder named Documents higher up never decides it.
 * @param {string|null} storedPath  @param {string} listedPath  @param {string|undefined} documentsDir
 */
export function storedPathAgainst(storedPath, listedPath, documentsDir) {
  if (!storedPath) return 'other';
  const stored = normalizePath(storedPath);
  const listed = normalizePath(listedPath);
  if (stored === listed) return 'same';
  const docs = documentsDir ? normalizePath(documentsDir) : null;
  const rel = docs && listed.startsWith(`${docs}/`) ? listed.slice(docs.length + 1) : null;
  if (!rel) return 'other';
  // In the listed container itself (its Documents folder or anywhere else in it), any other path is another file.
  const container = docs.endsWith('/Documents') ? docs.slice(0, -'/Documents'.length) : docs;
  if (stored.startsWith(`${container}/`)) return 'other';
  const under = `Documents/${rel}`;
  if (stored === under || stored === rel || stored.endsWith(`/${under}`)) return 'other-container';
  return 'other';
}

/**
 * @param {object} snap
 * @param {{ draftId: string, audioFile: string }} armed
 * @param {{ sha256: (path: string) => string, playable: (path: string) => { ok: boolean|null, durationS: number|null, text?: string|null }, adts?: (path: string) => object }} io
 *   `adts` (default: adts-evidence.mjs adtsFactsOfFile, which reads the file) gives an `.aac` take's frame facts.
 * @param {{ expectedMs?: number|null }} [expect]  the take's length when the kill came (recorded at arm plus the wait)
 * @returns {{ outcome: string, reasons: string[], playable: boolean|null, durationS: number|null, deviationMs: number|null,
 *   within5s: boolean, wronglyListed: boolean, container: string, storedPath: string|null, afinfoOpens?: boolean|null,
 *   afinfoDurationS?: number|null, adts?: import('./adts-evidence.mjs').AdtsFacts, afinfo?: string|null }}
 */
export function classifyDl01(snap, armed, io, expect = {}) {
  const { draftId, audioFile } = armed;
  const rows = (snap.idx.byFile.get(audioFile) ?? []).filter(live);
  const listed = snap.files.get(audioFile) ?? [];
  const container = containerOfName(audioFile);
  const none = { playable: null, durationS: null, deviationMs: null, within5s: false, wronglyListed: false, container, storedPath: null };
  if (!listed.length) return { outcome: 'lost', reasons: ['the take file is gone'], ...none };
  if (rows.length === 0) {
    const why = snap.orphanSet.has(audioFile)
      ? 'the file is listed as a recording without a letter, on no book'
      : 'no row points at the take: it is not on Tonight or in Settings > Recordings';
    return { outcome: 'lost', reasons: [why], ...none };
  }
  if (rows.length > 1) return { outcome: 'doubled', reasons: [`${rows.length} rows point at the take`], ...none };
  const row = rows[0];
  // The take the row points at: the listed file at its stored path, else the first of that name.
  const f = listed.find((x) => row.audioPath && normalizePath(x.path) === normalizePath(row.audioPath)) ?? listed[0];
  if (f.bytes === 0) return { outcome: 'lost', reasons: ['the take file is empty'], ...none };
  const afinfo = io.playable(f.path);
  const reasons = [];
  const notes = [];
  let probe = afinfo;
  /** @type {any} */
  let adtsFacts = null;
  if (container === 'adts') {
    adtsFacts = (io.adts ?? adtsFactsOfFile)(f.path);
    // Core Audio must open it, and it must hold at least one whole frame; its length is its whole frames, never
    // afinfo's estimate (ADR 0027, check V2). Frames found after a break are not counted here: they may not play.
    probe = {
      ok: afinfo.ok === null ? null : afinfo.ok === true && adtsFacts.adts && adtsFacts.frames > 0,
      durationS: adtsFacts.adts ? adtsFacts.durationMs / 1000 : null,
    };
    if (!adtsFacts.adts) notes.push('named .aac, but its bytes are not an ADTS stream');
  }
  const storedPath = storedPathAgainst(row.audioPath ?? null, f.path, snap.documentsDir);
  if (storedPath === 'other') reasons.push("the row's stored path is not the path of the take on disk (another folder or name)");
  if (storedPath === 'other-container') notes.push("the row's stored path names the same folder and file under another container path");
  if (row.table === 'drafts' && row.id !== draftId) notes.push('kept as a new draft (reattached by the sweep)');
  if (row.table === 'drafts' && row.state === 'recording') reasons.push('still marked recording after the sweep');
  if (row.audioSha256 && row.audioSha256 !== io.sha256(f.path)) reasons.push('the stored hash differs from its file');
  const shownReady = row.table === 'entries' || row.state === 'ready';
  if (row.table === 'drafts' && row.state === 'ready' && !row.audioSha256) reasons.push('marked ready with no hash');
  if (shownReady && probe.ok === false) reasons.push('shown as ready but will not play (F08-REQ-019)');
  const plays = probe.ok === true && (probe.durationS ?? 0) > 0;
  const deviationMs = plays && Number.isFinite(expect.expectedMs) ? Math.round(Math.abs(probe.durationS * 1000 - expect.expectedMs)) : null;
  const facts = {
    playable: probe.ok,
    durationS: probe.durationS,
    deviationMs,
    within5s: deviationMs !== null && deviationMs <= 5000,
    container,
    storedPath,
    ...(adtsFacts
      ? {
          afinfoOpens: afinfo.ok,
          afinfoDurationS: afinfo.durationS,
          adts: adtsFacts,
          afinfo: typeof afinfo.text === 'string' ? redactAfinfo(afinfo.text, f.path, '(this take)') : null,
        }
      : {}),
  };
  if (reasons.length) return { outcome: 'fail', reasons, ...facts, wronglyListed: false };
  const listedUnplayable = row.table === 'drafts' && row.state === 'unrecoverable';
  return {
    outcome: plays && !listedUnplayable ? 'kept-playable' : 'kept-unplayable',
    reasons: notes,
    ...facts,
    wronglyListed: listedUnplayable && plays,
  };
}

/**
 * The whole-database check after a relaunch (07: zero rows pointing at missing files, integrity ok, every
 * audio hash matches), and every earlier run judged kept is judged again, so damage a later launch does is seen.
 * Rows of runs already judged bad (or planted) are left out, so one failure is reported once.
 * @param {object} snap
 * @param {object} io
 * @param {{ mode: 'dl01'|'dl02', kept: Array<{ run: number, outcome: string, armed: object, expect: object }>, badIds: Set<string>, badFiles: Set<string> }} o
 * @returns {Array<{ run: number|null, reason: string }>}
 */
export function auditStore(snap, io, o) {
  const problems = [];
  if (snap.integrity !== 'ok') problems.push({ run: null, reason: `PRAGMA integrity_check: ${snap.integrity}` });
  for (const [id, rows] of snap.idx.byId) {
    if (o.badIds.has(id)) continue;
    if (rows.some((r) => r.table === 'drafts') && rows.some((r) => r.table === 'entries' && !r.deleted)) {
      problems.push({ run: null, reason: 'an id is both a draft and a letter' });
    }
  }
  for (const r of [...snap.drafts.map((d) => ({ table: 'drafts', ...d })), ...snap.entries.filter((e) => !e.deleted).map((e) => ({ table: 'entries', ...e }))]) {
    if (!r.audioFile || o.badIds.has(r.id) || o.badFiles.has(r.audioFile)) continue;
    const f = firstFile(snap, r.audioFile);
    if (!f) {
      problems.push({ run: null, reason: `a ${r.table === 'drafts' ? 'draft' : 'letter'} points at a missing file` });
      continue;
    }
    if (r.audioSha256 && (r.table === 'entries' || r.state === 'ready') && io.sha256(f.path) !== r.audioSha256) {
      problems.push({ run: null, reason: 'a stored hash differs from its file' });
    }
  }
  for (const k of o.kept) {
    const v = o.mode === 'dl02' ? classifyDl02(snap, k.armed, io, k.expect) : classifyDl01(snap, k.armed, io, k.expect);
    const changed = isBad(v.outcome) || (o.mode === 'dl02' && v.outcome !== k.outcome);
    if (changed) problems.push({ run: k.run, reason: `run ${k.run}, judged ${k.outcome} earlier, is now ${v.outcome}${v.reasons.length ? `: ${v.reasons.join('; ')}` : ''}` });
  }
  return problems;
}
