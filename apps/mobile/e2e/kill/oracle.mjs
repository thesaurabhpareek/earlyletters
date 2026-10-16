// Judges one killed run from what is on disk after the next launch's sweep (snapshot.mjs), and from
// nothing the app says about itself. Pure: the I/O it needs (hashing, a playability probe) is passed in.
//
// DL-02, kill during save (DEVICE_TEST_PLAN DL-02, DATA-REQ-048): the letter exists exactly once with its
// words (and its recording, unchanged), or it is still exactly one draft with them. Outcomes:
//   letter   saved once                  draft  the kill came before the commit; the draft is intact
//   lost     neither, or the words or the recording are gone
//   doubled  more than one row holds the letter or its recording
//   fail     one row, but something in it is wrong (changed words, a hash that does not match its file)
// DL-01, kill while recording (DEVICE_TEST_PLAN DL-01, F04-REQ-024, F08-REQ-019, D-085): the take's file
// exists with bytes and exactly one row points at it, so it is on Tonight or in Settings > Recordings.
//   kept-playable    a ready draft whose hash matches its file
//   kept-unplayable  marked unrecoverable: kept and listed (counts toward the unplayable rate, not a fail)
//   lost, doubled, fail as above; "fail" includes a take marked ready that will not play.

export const BAD_OUTCOMES = ['lost', 'doubled', 'fail'];

/** @param {string} outcome */
export function isBad(outcome) {
  return BAD_OUTCOMES.includes(outcome);
}

const firstFile = (snap, name) => (name ? (snap.files.get(name) ?? [])[0] ?? null : null);

/**
 * @param {ReturnType<import('./snapshot.mjs').readSnapshot>} snap
 * @param {{ draftId: string, kind: string, text: string, audioFile: string|null, sha256: string|null }} armed
 * @param {{ sha256: (path: string) => string }} io
 */
export function classifyDl02(snap, armed, io) {
  const { draftId, kind, text, audioFile } = armed;
  const spoken = kind !== 'typed';
  const sameLetter = (row) =>
    row.typedText === text || row.rawTranscript === text || row.finalText === text || (spoken && audioFile !== null && row.audioFile === audioFile);
  const letters = snap.entries.filter((e) => e.id === draftId && !e.deleted);
  const shelved = snap.entries.filter((e) => e.id === draftId && e.deleted);
  const drafts = snap.drafts.filter((d) => d.id === draftId);
  const elsewhere = [
    ...snap.drafts.filter((d) => d.id !== draftId && sameLetter(d)),
    ...snap.entries.filter((e) => e.id !== draftId && !e.deleted && sameLetter(e)),
  ];
  const own = letters.length + drafts.length;
  if (own + elsewhere.length > 1) return { outcome: 'doubled', reasons: [`${own + elsewhere.length} rows hold this letter`] };
  if (own === 0) {
    if (elsewhere.length === 1) return { outcome: 'lost', reasons: ['only a row under another id is left; the letter itself is gone'] };
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
    if (armed.sha256 && actual !== armed.sha256) reasons.push('the recording changed');
    if (isLetter && row.audioSha256 !== actual) reasons.push('the letter hash differs from its file');
    if (!isLetter && row.audioSha256 && row.audioSha256 !== actual) reasons.push('the draft hash differs from its file');
    if (snap.orphans.includes(audioFile)) reasons.push('the recording is also listed as one without a letter');
  }
  if (reasons.length) return { outcome: 'fail', reasons };
  return { outcome: isLetter ? 'letter' : 'draft', reasons: [] };
}

/**
 * @param {ReturnType<import('./snapshot.mjs').readSnapshot>} snap
 * @param {{ draftId: string, audioFile: string }} armed
 * @param {{ sha256: (path: string) => string, playable: (path: string) => { ok: boolean|null, durationS: number|null } }} io
 */
export function classifyDl01(snap, armed, io) {
  const { draftId, audioFile } = armed;
  const rows = [
    ...snap.drafts.filter((d) => d.audioFile === audioFile).map((d) => ({ table: 'drafts', ...d })),
    ...snap.entries.filter((e) => !e.deleted && e.audioFile === audioFile).map((e) => ({ table: 'entries', ...e })),
  ];
  const f = firstFile(snap, audioFile);
  if (!f) return { outcome: 'lost', reasons: ['the take file is gone'], playable: null, durationS: null };
  if (rows.length === 0) {
    const why = snap.orphans.includes(audioFile)
      ? 'the file is listed as a recording without a letter, on no book'
      : 'no row points at the take: it is not on Tonight or in Settings > Recordings';
    return { outcome: 'lost', reasons: [why], playable: null, durationS: null };
  }
  if (rows.length > 1) return { outcome: 'doubled', reasons: [`${rows.length} rows point at the take`], playable: null, durationS: null };
  if (f.bytes === 0) return { outcome: 'lost', reasons: ['the take file is empty'], playable: false, durationS: null };
  const row = rows[0];
  const probe = io.playable(f.path);
  const reasons = [];
  const notes = [];
  if (row.table === 'drafts' && row.id !== draftId) notes.push('kept as a new draft (reattached by the sweep)');
  if (row.table === 'drafts') {
    if (row.state === 'recording') reasons.push('still marked recording after the sweep');
    if (row.state === 'ready') {
      if (row.audioSha256 !== io.sha256(f.path)) reasons.push('the draft hash differs from its file');
      if (probe.ok === false) reasons.push('shown as ready but will not play (F08-REQ-019)');
    }
  }
  if (reasons.length) return { outcome: 'fail', reasons, playable: probe.ok, durationS: probe.durationS };
  const unplayable = row.table === 'drafts' && row.state === 'unrecoverable';
  return {
    outcome: unplayable ? 'kept-unplayable' : 'kept-playable',
    reasons: notes,
    playable: probe.ok,
    durationS: probe.durationS,
    wronglyListed: unplayable && probe.ok === true,
  };
}
