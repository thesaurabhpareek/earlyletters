// NS-01 photo with a letter: where the controls are, what the switch removes, and what the code may not call.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { selectPrompt } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tonightPromptInput } from '../src/components/tonight/prompt.logic';
import { applyEntryState, applyPullPage } from '../src/lib/sync/merge';
import { entrySnapshot, SYNC_SETTING, writeSetting, type LocalEntryRow } from '../src/lib/sync/outbox';
import type { PullResponse } from '../src/lib/sync/types';
import { tokens } from '@scribe/design-tokens';
import { adoptPending } from '../src/lib/photos/adopt';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { parsePhotosFlag, photoSurfaces, photosPaused } from '../src/lib/photos/flag';
import { coveredForAppState, LETTER_PICTURE_AX_MAX_PT, letterPhotoControls, letterPictureSize, pictureCovered, pictureHidden, THUMB_AX_MAX_HEIGHT_PT, THUMB_MAX_HEIGHT_PT } from '../src/lib/photos/surface';
import { photoStartShows } from '../src/lib/photos/start-shows';
import { PendingPhoto } from '../src/lib/photos/pending';
import { registerPhotoPicker, registerPending } from '../src/lib/photos/registry';
import { setPhotosForTest } from '../src/lib/photos/flag';
import { planCapture } from '../src/lib/capture/start-capture.logic';
import { commitPhoto, PhotoSession } from '../src/lib/photos/session';
import { photos } from '../src/lib/photos/copy';
import { PHOTO_WORDS_WRITING_TOOLS_OFF, photoWordsFieldsShown } from '../src/lib/photos/words-setting';
import { fixture, insertBook } from './helpers/store-fixture';
import { deps, makeJpeg } from './photos-helpers';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
const parse = (file: string): ts.SourceFile => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const visit = (n: ts.Node, f: (n: ts.Node) => void): void => {
  f(n);
  n.forEachChild((c) => visit(c, f));
};
const jsxName = (n: ts.Node): string | null =>
  ts.isJsxElement(n) ? n.openingElement.tagName.getText() : ts.isJsxSelfClosingElement(n) ? n.tagName.getText() : null;
const importsOf = (sf: ts.SourceFile): string[] => sf.statements.filter(ts.isImportDeclaration).map((s) => (s.moduleSpecifier as ts.StringLiteral).text);
const rel = (f: string) => relative(SRC, f);

const APP = walk(join(SRC, 'app'));
const HOME = join(SRC, 'app', '(tabs)', 'index.tsx');

describe('[NS-01-R4][NS-01-R52] leaving without the letter takes the picked picture with it; Keep stores it', () => {
  // Each test reads only the handler that must make the call, so removing that one line fails it.
  const body = (file: string, from: string, to: string) => {
    const src = readFileSync(join(SRC, file), 'utf8');
    const start = src.indexOf(from);
    expect(start, from).toBeGreaterThan(-1);
    return src.slice(start, src.indexOf(to, start + from.length));
  };
  it('[NS-01-R4][NS-01-R52] Listen\'s Close discards the pending picture before it leaves', () => {
    const close = body('app/listen.tsx', 'const close = () => {', '\n  };');
    expect(close).toMatch(/discardPendingPhoto\(\);[^\n]*\n\s*if \(router\.canGoBack\(\)\) router\.back\(\);/);
  });
  it('[NS-01-R4][NS-01-R52] Listen\'s confirmed Let it go discards the pending picture after the take is let go', () => {
    const discard = body('app/listen.tsx', 'const discard = () => {', 'const typeInstead =');
    expect(discard).toMatch(/if \(id\) letItGo\([^\n]*\n\s*discardPendingPhoto\(\);[^\n]*\n\s*router\.back\(\);/);
  });
  it('[NS-01-R4][NS-01-R52] Home, on coming back into focus, discards a picture left behind', () => {
    const start = body('lib/photos/use-photo-start.ts', 'useFocusEffect(', '\n  );');
    expect(start).toMatch(/useCallback\(\(\) => \{\s*void getPending\(\)\?\.discard\(\);\s*\}, \[\]\)/);
  });
  it('[NS-01-R5][NS-01-R17] Review\'s Keep stores the pending picture once the letter exists, before it finishes', () => {
    const save = body('app/review.tsx', 'const save = async (inBook: boolean) => {', 'const keepRecordingOnly =');
    const kept = save.indexOf('saveLetterFromDraft(');
    const stored = save.indexOf('await commitPendingPhoto(draft.id, finalText);');
    expect([kept > -1, stored > kept, stored < save.indexOf('finishSave(inBook, firstLetter);')]).toEqual([true, true, true]);
  });
});

describe('[NS-01-R1] only Home registers a photo start', () => {
  it('[NS-01-R1] exactly 1 photo start exists in the app, in Home, inside the capture cluster beside Speak and Type', () => {
    const renders: { file: string; node: ts.Node }[] = [];
    for (const f of walk(SRC).filter((f) => !rel(f).startsWith('components/photos'))) {
      visit(parse(f), (n) => {
        if (jsxName(n) === 'PhotoStartButton') renders.push({ file: f, node: n });
      });
    }
    expect(renders.map((r) => rel(r.file))).toEqual([rel(HOME)]);
    let parent: ts.Node = renders[0].node.parent;
    while (!ts.isJsxElement(parent) && !ts.isJsxFragment(parent)) parent = parent.parent;
    const siblings = parent.children.map(jsxName).filter(Boolean);
    expect(siblings).toContain('ButtonRow'); // the Speak and Type row is in the same cluster
  }, 30_000); // parses the whole src tree: 7 to 9 s on a loaded runner
  it('[NS-01-R1] the Book, Me and every other route have 0 controls that start a letter from a picture', () => {
    for (const f of APP.filter((f) => f !== HOME)) {
      const sf = parse(f);
      expect(importsOf(sf).filter((m) => /lib\/photos\/(use-photo-start|session|registry)|components\/photos\/photo-start/.test(m)), rel(f)).toEqual([]);
    }
  });
});

describe('[NS-01-R2][NX-39-R2] the photo start asks no library question', () => {
  const BANNED = /requestPermissionsAsync|requestMediaLibraryPermissions|getMediaLibraryPermissions|requestAuthorization|PHPhotoLibrary|MediaLibrary|expo-media-library/;
  it('[NS-01-R2][NX-39-R2] no photo code names a permission or full-library call', () => {
    for (const f of [...walk(join(SRC, 'lib', 'photos')), ...walk(join(SRC, 'components', 'photos'))]) {
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(BANNED);
    }
  });
});

describe('[NS-01-R4][NX-39-R14] backing out writes nothing (behaviour)', () => {
  it('[NS-01-R4][NX-39-R14] a pending picture that is discarded leaves no file, no row and no held picture, whichever way the parent leaves', async () => {
    for (const leave of ['Close', 'Let it go', 'swipe back to Home']) {
      const removed: string[] = [];
      const files = { read: async () => Uint8Array.of(1), remove: async (u: string) => void removed.push(u), sweep: async () => undefined };
      const p = new PendingPhoto(files);
      await p.set({ uri: 'file:///c/ImagePicker/one.jpg' });
      expect(p.source?.uri, leave).toBe('file:///c/ImagePicker/one.jpg');
      await p.discard(); // what Close, Let it go and Home's focus all call (discardPendingPhoto)
      expect([p.source, removed], leave).toEqual([null, ['file:///c/ImagePicker/one.jpg']]);
    }
  });
});

describe('[NS-01-R3] the prompt does not depend on the picture', () => {
  it('[NS-01-R3] the prompt does not depend on the picture', () => {
    const state = { birthday: '2026-04-01', today: '2026-11-11', daysSinceLastEntry: 2, recentKeys: [], shuffle: 0, leftKey: null, childName: 'Asha' };
    const picked: string[] = [];
    for (const uri of ['picker://a', 'picker://b', 'picker://c']) {
      const s = new PhotoSession();
      s.pick({ uri });
      picked.push(selectPrompt(tonightPromptInput(state), PROMPTS).key); // the input has no place for the picture
      // The session is held while the plan is made: the route the photo start takes carries the same prompt params as Speak
      // and Type for that prompt, whatever was picked (the request has no field a picture could ride in).
      const prompt = { key: picked[picked.length - 1], libraryVersion: 3 };
      expect(s.source?.uri).toBe(uri);
      expect(planCapture({ source: 'photo', prompt })).toEqual({ kind: 'photo', pathname: '/listen', params: { promptKey: prompt.key, promptLibraryVersion: '3' } });
    }
    const first = planCapture({ source: 'speak', prompt: { key: picked[0], libraryVersion: 3 } });
    expect(first.kind === 'route' && first.params).toEqual({ promptKey: picked[0], promptLibraryVersion: '3' });
    expect(new Set(picked).size).toBe(1);
    expect(Object.keys(state).some((k) => /photo|picture|uri/i.test(k))).toBe(false);
  });
  it('[NS-01-R3] the thumbnail is at most 160 pt tall and sits above the prompt on Listen and above the field on Write', () => {
    expect(THUMB_MAX_HEIGHT_PT).toBe(160);
    const thumb = readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8');
    expect(thumb).toMatch(/height=\{boxHeight\}/);
    const listen = readFileSync(join(SRC, 'app', 'listen.tsx'), 'utf8');
    expect(listen.indexOf('<PendingPhotoThumb />')).toBeGreaterThan(0);
    expect(listen.indexOf('<PendingPhotoThumb />')).toBeLessThan(listen.indexOf('testID="listen.prompt"'));
    const write = readFileSync(join(SRC, 'app', 'write.tsx'), 'utf8');
    expect(write.indexOf('<PendingPhotoThumb />')).toBeGreaterThan(0);
    expect(write.indexOf('<PendingPhotoThumb />')).toBeLessThan(write.indexOf('{prompt && ('));
  });
});

describe('[NS-01-R13][NX-39-R36] the switcher snapshot is blank', () => {
  it('[NS-01-R13][NX-39-R36] with App lock on, a picture is not drawn when the app is not in front or not unlocked', () => {
    for (const phase of ['inactive', 'background'] as const) expect(pictureHidden({ lockOn: true, unlocked: true, phase })).toBe(true);
    expect(pictureHidden({ lockOn: true, unlocked: false, phase: 'active' })).toBe(true); // cold open
    expect(pictureHidden({ lockOn: true, unlocked: true, phase: 'active' })).toBe(false);
    expect(pictureHidden({ lockOn: false, unlocked: false, phase: 'background' })).toBe(false);
  });
});

describe('[NS-01-R15][NX-39-R33] sync carries no picture', () => {
  const row: LocalEntryRow = {
    id: 'e1', kind: 'letter', occurred_on: '2026-06-12', captured_at: '2026-06-12T09:00:00Z', capture_mode: 'typed', edit_level: 'clean',
    prompt_key: null, engine_version: 1, raw_transcript: 'She laughed.', machine_edits: '[]', final_text: 'She laughed.', in_book: 1, sounds_like_me: null,
    updated_at: '2026-06-12T09:00:00Z', deleted_at: null, synced_at: null, child_id: 'c1', author_id: 'u1', author_signs_as: 'Papa', audio_uri: null,
    transcript_status: null, server_version: null, server_updated_at: null, server_epoch: null, sync_state: 'pending', approval: null,
    language: 'en', occurred_precision: 'day', base_direction: 'ltr',
  };
  it('[NS-01-R15][NX-39-R33] a letter with a picture syncs with photo_path null and no media key', async () => {
    const { d } = deps();
    await commitPhoto(d, { entryId: 'e1', finalText: 'She laughed.', text: 'Asha on the swing', bytes: makeJpeg() });
    const snap = entrySnapshot(row) as unknown as Record<string, unknown>;
    expect(snap.photo_path ?? null).toBeNull();
    expect(Object.keys(snap).filter((k) => /library|local_id|asset|place|geohash|moment|occasion|taken_at|media|photo/i.test(k))).toEqual([]);
    expect(JSON.stringify(snap)).not.toContain('Asha on the swing');
  });
  it('[NS-01-R15] a pull never creates, changes or deletes an entry_media row: not for a letter it rewrites, one the server no longer holds, a new one, or a draft (#836 review B)', () => {
    const ME = '11111111-1111-1111-1111-111111111111';
    const NOW = '2026-10-03T09:00:00.000Z';
    const db = fixture().db;
    insertBook(db, { id: 'c1', name: 'Asha', signsAs: 'Mama', serverState: 'synced' });
    writeSetting(db, SYNC_SETTING.owner, ME);
    writeSetting(db, SYNC_SETTING.epoch, '1');
    for (const id of ['e1', 'e2']) {
      db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
           in_book, updated_at, child_id, author_id, server_version, server_updated_at, server_epoch, sync_state)
         VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, 'Hi.', '[]', 'Hi.', 1, ?, 'c1', ?, '100', ?, 1, 'synced')`,
        id, NOW, NOW, ME, NOW,
      );
    }
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('d1', 'c1', 'typed', ?)", NOW);
    const store = entryMediaStore(db);
    const pic = (owner: string, media: string) =>
      store.put({ entryId: owner, mediaId: media, ext: 'jpg', bytes: 3, sha256: 'ab', width: 4, height: 4, text: 'Rain boots', place: 'the back step', addedAt: NOW, deletedAt: null });
    pic('e1', 'm1');
    pic('e2', 'm2');
    pic('d1', 'm3');
    const media = () => db.all('SELECT * FROM entry_media ORDER BY id');
    const before = media();
    const row = (id: string, words: string) => ({
      id, child_id: 'c1', author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW,
      capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'Hi.', machine_edits: [],
      final_text: words, in_book: true, sounds_like_me: null, approval: null, created_at: NOW, updated_at: NOW, deleted_at: null, own: true, v: '120',
    });
    // e1 rewritten by the server, e2 no longer held there (it goes to Recently deleted here), e3 new from another phone.
    const page = {
      reset: false, epoch: 1, epoch_started_at: NOW, gone: [], more: false,
      books: [{ id: 'c1', access: 'parent', repull: false, meta_hash: 'x', cursor: '900:00000000-0000-0000-0000-000000000000', more: false, rows: [row('e1', 'Hi, Asha.'), row('e3', 'New.')], ids: ['e1', 'e3'] }],
    } as unknown as PullResponse;
    db.transaction(() => applyPullPage(db, page, NOW));
    expect(db.get<{ final_text: string }>("SELECT final_text FROM entries WHERE id = 'e1'")?.final_text).toBe('Hi, Asha.'); // the pull did run
    expect(media()).toEqual(before);
  });
  it('[NS-01-R15] a push answer never creates, changes or deletes an entry_media row: applyEntryState (which applyPushResponse calls for every ok op) leaves the table as it was, a deleted letter included, and the sync layer never names the table', () => {
    // Mutant: add `DELETE FROM entry_media WHERE entry_id = ?` (or an UPDATE) to applyEntryState in sync/merge.ts: this turns red.
    const ME = '11111111-1111-1111-1111-111111111111';
    const NOW = '2026-10-03T09:00:00.000Z';
    const db = fixture().db;
    insertBook(db, { id: 'c1', name: 'Asha', signsAs: 'Mama', serverState: 'synced' });
    writeSetting(db, SYNC_SETTING.owner, ME);
    writeSetting(db, SYNC_SETTING.epoch, '1');
    for (const id of ['e1', 'e2']) {
      db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
           in_book, updated_at, child_id, author_id, server_version, server_updated_at, server_epoch, sync_state)
         VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, 'Hi.', '[]', 'Hi.', 1, ?, 'c1', ?, '100', ?, 1, 'synced')`,
        id, NOW, NOW, ME, NOW,
      );
    }
    const store = entryMediaStore(db);
    for (const [owner, media] of [['e1', 'm1'], ['e2', 'm2']]) {
      store.put({ entryId: owner, mediaId: media, ext: 'jpg', bytes: 3, sha256: 'ab', width: 4, height: 4, text: 'Rain boots', place: 'the back step', addedAt: NOW, deletedAt: null });
    }
    const media = () => db.all('SELECT * FROM entry_media ORDER BY id');
    const before = media();
    const state = (id: string, deleted: string | null) => ({ id, v: '130', updated_at: NOW, approval: null, in_book: true, deleted_at: deleted }) as unknown as Parameters<typeof applyEntryState>[1];
    applyEntryState(db, state('e1', null), 1, NOW);
    applyEntryState(db, state('e2', NOW), 1, NOW); // the server says deleted
    expect(db.get<{ v: string }>("SELECT server_version AS v FROM entries WHERE id = 'e1'")?.v).toBe('130'); // it did run
    expect(media()).toEqual(before);
    expect(readFileSync(join(SRC, 'lib', 'sync', 'merge.ts'), 'utf8')).not.toMatch(/entry_media/);
  });
  it('[NS-01-R15] the photo code never imports the sync layer or the network', () => {
    for (const f of walk(join(SRC, 'lib', 'photos'))) {
      expect(importsOf(parse(f)).filter((m) => /sync|supabase|fetch|api/.test(m)), rel(f)).toEqual([]);
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(/\bfetch\(|XMLHttpRequest/);
    }
  });
});

describe('[NS-01-R18][NX-39-R58] pictures are never gated', () => {
  it('[NS-01-R18][NX-39-R58] the photo code never calls the plan or Keep gate, and GatedFeature stays two names', () => {
    for (const f of [...walk(join(SRC, 'lib', 'photos')), ...walk(join(SRC, 'components', 'photos'))]) {
      expect(importsOf(parse(f)).filter((m) => /billing|plan|keep-gate|@scribe\/core/.test(m)), rel(f)).toEqual([]);
    }
    const plan = readFileSync(join(ROOT, '..', '..', 'packages', 'core', 'src', 'plan.ts'), 'utf8');
    expect(plan).toMatch(/export type GatedFeature = 'keep_letter' \| 'theme_extra';/);
  });
});

describe('[NS-01-R19][NX-39-R37] the switch removes the screens, not the data rights', () => {
  it('[NS-01-R19][NX-39-R37] off (the default), or paused remotely, nothing new draws; only "on" turns it on', () => {
    expect(parsePhotosFlag(undefined)).toBe(false);
    for (const v of ['', 'off', 'true', '1', 'yes']) expect(parsePhotosFlag(v)).toBe(false);
    expect(parsePhotosFlag('on')).toBe(true);
    expect(photoSurfaces({ build: false, paused: false })).toEqual({ start: false, lens: false, addActions: false });
    expect(photoSurfaces({ build: true, paused: true })).toEqual({ start: false, lens: false, addActions: false });
    expect(photoSurfaces({ build: true, paused: false })).toEqual({ start: true, lens: true, addActions: true });
    // the remote can pause, and a config with nothing in it never pauses and never turns anything on
    expect(photosPaused({ killSwitches: { photos: true } })).toBe(true);
    expect(photosPaused(null)).toBe(false);
    expect(photoSurfaces({ build: false, paused: photosPaused({ killSwitches: { photos: false } }) }).start).toBe(false);
  });
  it('[NS-01-R19] the Home start is guarded by the switch and a registered picker (absent, not dead)', () => {
    const hook = readFileSync(join(SRC, 'lib', 'photos', 'start-shows.ts'), 'utf8');
    expect(hook).toMatch(/photoSurfaces\(\{ build: photosBuildEnabled\(\), paused \}\)\.start && getPhotoPicker\(\) !== null/);
    expect(readFileSync(join(SRC, 'app', '(tabs)', 'index.tsx'), 'utf8')).toMatch(/photoStart\.show \? <PhotoStartButton/);
  });
  it('[NS-01-R19] off, Listen, Write and Review gain nothing: the thumbnail needs a pending picture, and Keep stores nothing without one', async () => {
    expect(readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8')).toMatch(/if \(!pending \|\| !source\) return null;/);
    const { d, files, store } = deps();
    await adoptPending(null, () => d, 'e1', 'Asha and the rain boots.', true);
    expect(files.writes + store.puts).toBe(0);
  });
  it('[NS-01-R8][CL-116 C-01] the picture sits between the dateline and the words', () => {
    // Ruling NS-01-C01-order: in tree order the one level 1 dateline (testID letter.dateline), then the picture, then the
    // words; the picture's name is the fixed phrase or the parent's own words, never derived from the picture. Source scan
    // (a render of the page needs a phone), with three mutants that must fail.
    const page = readFileSync(join(SRC, 'app', 'letter', '[id].tsx'), 'utf8');
    const picture = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    const check = (p: string, pic: string): string[] => {
      const out: string[] = [];
      const open = p.slice(p.indexOf('function OpeningBlock'), p.indexOf('type PageProps'));
      const at = [open.indexOf('asHeading={1}'), open.indexOf('{picture}'), open.indexOf('variant="letterBody"')];
      if (!(at[0] > -1 && at[1] > at[0] && at[2] > at[1])) out.push(`order in OpeningBlock: ${at}`);
      if (p.split('asHeading={1}').length !== 2) out.push('not exactly one level 1 heading');
      if (!open.includes("testID={focusRef ? 'letter.dateline' : undefined}")) out.push('dateline testID');
      if (p.split('<LetterPicture ').length !== 2) out.push('picture drawn other than once');
      // The controls (LetterPhoto) come after the opening in the page body, never above it.
      if (p.indexOf('<LetterPhoto ') < p.indexOf('<PageOpening')) out.push('controls above the opening');
      if (!/label=\{photoA11yLabel\(photo\.text\)\}/.test(pic)) out.push('label is not R9a or R21c');
      if (/label=\{(?!photoA11yLabel\(photo\.text\))[^}]*\}\s+width=/.test(pic)) out.push('another label');
      return out;
    };
    expect(check(page, picture)).toEqual([]);
    // Mutant 1: the slot above the dateline (Reading A).
    const m1 = page.replace('      {picture}\n', '').replace('<View style={{ gap: CARD_TEXT_GAP }}>', '<View style={{ gap: CARD_TEXT_GAP }}>\n      {picture}');
    expect(check(m1, picture).length, 'slot above dateline').toBeGreaterThan(0);
    // Mutant 2: the slot after the words (the old #839).
    const m2 = page.replace('      {picture}\n', '').replace('    </View>\n  );\n}\n\ntype PageProps', '      {picture}\n    </View>\n  );\n}\n\ntype PageProps');
    expect(check(m2, picture).length, 'slot after words').toBeGreaterThan(0);
    // Mutant 3: a label made from anything else.
    const m3 = picture.replace('label={photoA11yLabel(photo.text)}', 'label={`Photo, ${photo.width} by ${photo.height}`}');
    expect(check(page, m3).length, 'derived label').toBeGreaterThan(0);
    // No slot, no gap for a letter without a picture: the slot is a null child, and the carry is kept for it.
    expect(page).toMatch(/const picture = hasPicture \? <LetterPicture/);
    expect(page).toMatch(/carried: !hasPicture && /);
    expect(page).toMatch(/<PageOpening lineHeight=\{openingLineHeight\} carry=\{!hasPicture\} \/>/);
  });
  it('[NS-01-R8][CL-116 C-01] the picture is sized from its stored width and height, capped, one column at AX3 and up, never cropped', () => {
    const wide = { columnWidth: 300, windowHeight: 667, aspect: 3 / 2, largeText: false };
    const w = letterPictureSize(wide);
    expect(w.height).toBeCloseTo(200); // column / aspect, under min(300 * 0.75, 667 * 0.4)
    expect(w.width / w.height).toBeCloseTo(1.5);
    const tall = letterPictureSize({ ...wide, aspect: 2 / 3 });
    expect(tall.height).toBeCloseTo(Math.min(225, 266.8)); // capped
    expect(tall.width / tall.height).toBeCloseTo(2 / 3); // kept in proportion: never stretched or cropped
    const ax = letterPictureSize({ ...wide, largeText: true });
    expect(ax.height).toBeLessThanOrEqual(LETTER_PICTURE_AX_MAX_PT);
    expect(letterPictureSize({ ...wide, aspect: 5 }).width).toBeLessThanOrEqual(300); // a panorama fits the column
  });
  it('[NS-01-R9c] only the author changes the picture', () => {
    // Another parent's letter: no add, change, take off or edit control, with or without a picture and words.
    for (const hasPhoto of [true, false]) {
      for (const hasWords of [true, false]) expect(letterPhotoControls({ own: false, hasPhoto, hasWords }), `${hasPhoto}/${hasWords}`).toEqual({ add: false, change: false, remove: false, editWords: false });
    }
    expect(letterPhotoControls({ own: true, hasPhoto: true, hasWords: true })).toEqual({ add: false, change: true, remove: true, editWords: true });
    expect(letterPhotoControls({ own: true, hasPhoto: false, hasWords: true }).add).toBe(true);
    expect(letterPhotoControls({ own: true, hasPhoto: false, hasWords: false }).add).toBe(false); // a mark has no words (R5, R25)
    // The component draws its controls only through that rule. Mutant: "author-only controls always visible" (a bare `true`
    // or `own`-free condition in the controls) fails these pins.
    const src = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(src).toMatch(/const controls = letterPhotoControls\(\{ own, hasPhoto: !!photo, hasWords: words \}\);/);
    expect(src).toMatch(/return controls\.add \? \(/);
    expect(src).toMatch(/\{controls\.change \? \(/);
    expect(src).toMatch(/\{editing && controls\.editWords && photoWordsFieldsShown\(\) \? \(/);
    expect(src).toMatch(/letterPhotoControls\(\{ own, hasPhoto: true, hasWords: true \}\)\.remove/);
    expect(src).not.toMatch(/\{own \?|own && /);
  });
  it('[NS-01-R50] writing tools are off on photo words and place', () => {
    // OPEN, never green by silence (E41): React Native 0.86 has no prop for iOS writing tools and the native setting of ADR 0039
    // is not built. This row stays red-by-design until PHOTO_WORDS_WRITING_TOOLS_OFF is true (the PR that builds the setting).
    expect(PHOTO_WORDS_WRITING_TOOLS_OFF, 'OPEN: R50 needs the native setting; see R50b for what ships meanwhile').toBe(false);
  });
  it('[NS-01-R50b] the fields stay off in production until the setting exists', () => {
    expect(photoWordsFieldsShown('production', false)).toBe(false);
    expect(photoWordsFieldsShown('preview', false)).toBe(true);
    expect(photoWordsFieldsShown('development', false)).toBe(true);
    expect(photoWordsFieldsShown(null, false)).toBe(true); // an unknown value resolves to development, as build-env does
    expect(photoWordsFieldsShown('production', true)).toBe(true); // the setting exists
    const src = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(src.match(/photoWordsFieldsShown\(\)/g)?.length).toBe(2); // the fields and the button that opens them
    // Mutant: show the fields in production (drop the gate) fails the two pins above.
  });
  it('[review B on #839] the words are written on blur and Done, not per keystroke; the caption is not read twice; Review draws the picture; the controls follow the player', () => {
    const src = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(src).not.toMatch(/onChangeText=\{\(t\) => editPhotoWords/);
    expect(src.match(/onBlur=\{flush\}/g)?.length).toBe(2);
    expect(src).toMatch(/useEffect\(\(\) => flush, \[\]\)/); // leaving the page writes what was typed
    expect(src).toMatch(/accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="letter\.photo\.text"/);
    const review = readFileSync(join(SRC, 'components', 'photos', 'review-photo.tsx'), 'utf8');
    expect(review.indexOf('<LetterPicture')).toBeGreaterThan(-1);
    expect(review.indexOf('<LetterPicture')).toBeLessThan(review.indexOf('<LetterPhoto '));
    const page = readFileSync(join(SRC, 'app', 'letter', '[id].tsx'), 'utf8');
    expect(page.indexOf('<LetterPhoto ')).toBeGreaterThan(page.indexOf('<AudioPlayer'));
    const hooks = readFileSync(join(SRC, 'lib', 'photos', 'hooks.ts'), 'utf8');
    expect(hooks).toMatch(/setPhoto\(\(prev\) => \(samePhoto\(prev, next\) \? prev : next\)\)/);
  });
  it('[NS-01-R19] off, the letter page and Review draw no photo control', () => {
    const page = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(page).toMatch(/const on = photoSurfaces\(\{ build: photosBuildEnabled\(\), paused: photosPausedNow\(\) \}\)\.addActions;/);
    expect(page).toMatch(/if \(!on \|\| !pick\.ready\) return null;/);
    expect(photoSurfaces({ build: false, paused: false }).addActions).toBe(false);
  });
  it('[NS-01-R19] off, the Book draws no lens row and no Photos page', () => {
    const book = readFileSync(join(SRC, 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(book).toMatch(/const lensOn = photoSurfaces\(\{ build: photosBuildEnabled\(\), paused: photosPausedNow\(\) \}\)\.lens && lens\.visible;/);
    expect(book).toMatch(/\{lensOn \? \(/);
    expect(book).toMatch(/const showPhotos = lensOn && lensMode === 'photos' && !params\.arrived;/);
    expect(photoSurfaces({ build: false, paused: false }).lens).toBe(false);
  });
});

describe('[NS-01-R20] new controls', () => {
  it('[NS-01-R20] every new control is a Button of size md (44 pt or more), and on Listen the thumbnail reads before the prompt', () => {
    const md = /BUTTON_MIN_HEIGHT = \{[^}]*\bmd: (\d+)/.exec(readFileSync(join(SRC, 'components', 'ui', 'button.tsx'), 'utf8'));
    expect(Number(md?.[1])).toBeGreaterThanOrEqual(Math.max(44, tokens.target.min));
    for (const f of walk(join(SRC, 'components', 'photos'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<Button\b[^>]*>/g)) expect(m[0], rel(f)).toMatch(/size="md"/);
    }
    // Reading order on Ready: thumbnail, prompt, then the red circle (Speak) and "or type instead" (Type) below it.
    const listen = readFileSync(join(SRC, 'app', 'listen.tsx'), 'utf8');
    expect(listen.indexOf('<PendingPhotoThumb />')).toBeLessThan(listen.indexOf('testID="listen.prompt"'));
  });
  it('[NS-01-R20b] VoiceOver order on Ready', () => {
    // E40: thumbnail, Change, prompt, Speak, Type; Type keeps the picture.
    const listen = readFileSync(join(SRC, 'app', 'listen.tsx'), 'utf8');
    expect(listen).toMatch(/\{room\.startControl && withPhoto \? \(\s*<Button variant="quiet" size="md" label=\{photos\.capture\.typeButton\} onPress=\{typeInstead\} testID="listen\.photo\.type" \/>/);
    expect(listen).toMatch(/const withPhoto = phase === 'ready' && !!pendingPhoto\?\.source;/);
    // E40: Change sits under the thumbnail, inside the thumbnail block, before the prompt; Change announces its state.
    const thumb = readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8');
    expect(thumb.indexOf('<PhotoFrame')).toBeGreaterThan(-1);
    expect(thumb.indexOf('testID="ready.photo.change"')).toBeGreaterThan(thumb.indexOf('<PhotoFrame'));
    expect(thumb).toMatch(/testID="ready.photo.change"[^>]*\/>/);
    expect(thumb).toMatch(/disabled=\{pick\.busy\}/);
    const at = ['<PendingPhotoThumb />', 'testID="listen.prompt"', 'testID="listen.start"', 'testID="listen.photo.type"'].map((m) => listen.indexOf(m));
    expect(at.every((i, n) => i > -1 && (n === 0 || i > at[n - 1])), String(at)).toBe(true);
  });
  it('[NS-01-R17][NS-33] "That photo could not be opened" is said aloud: both places use the photo ErrorLine, which announces it and is a live region (#838 review B)', () => {
    for (const f of ['photo-start.tsx', 'pending-photo-thumb.tsx']) {
      const src = readFileSync(join(SRC, 'components', 'photos', f), 'utf8');
      expect(src, f).toMatch(/<ErrorLine message=\{\w+(\.failed)? \? photos\.capture\.openFailed : null\} \/>/);
      expect(src, f).not.toMatch(/>\{photos\.capture\.openFailed\}</);
    }
    const line = readFileSync(join(SRC, 'components', 'photos', 'error-line.tsx'), 'utf8');
    const body = line.slice(line.indexOf('export function ErrorLine'), line.indexOf('\n}\n', line.indexOf('export function ErrorLine')));
    expect(body).toMatch(/if \(message\) announce\(message\);/);
    expect(body).toMatch(/accessibilityLiveRegion="polite"/);
  });
  it('[NS-01-R7][NS-33] on Review the picture and its controls come after the letter, its view and small fixes, and before Let it go and Keep (#839 review B)', () => {
    const review = readFileSync(join(SRC, 'app', 'review.tsx'), 'utf8');
    const photo = review.indexOf('<ReviewPhoto draftId={draft.id} finalText={finalText} />');
    expect(review.match(/<ReviewPhoto /g)).toHaveLength(1);
    expect(photo).toBeGreaterThan(review.indexOf('</LetterSheet>'));
    expect(photo).toBeGreaterThan(review.indexOf('testID="review.count"'));
    expect(photo).toBeGreaterThan(review.indexOf('testID="review.edit"'));
    expect(photo).toBeLessThan(review.indexOf('{inlineFooter ? footer : null}'));
    expect(photo).toBeLessThan(review.indexOf('{inlineFooter ? keepFooter : null}'));
    expect(photo).toBeLessThan(review.indexOf('</ScrollView>')); // the pinned footer is after the scroll
  });
  it('[NS-01-R17][NS-33] on a draft the not-stored line never says kept, and it and both openFailed lines are said aloud (#839 review B)', () => {
    const page = readFileSync(join(SRC, 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(page).toMatch(/<SpokenLine text=\{draft \? photos\.review\.notStored : photos\.book\.letter\.notSaved\}/);
    expect(photos.review.notStored).not.toMatch(/\bke(pt|ep)/i);
    const spoken = page.slice(page.indexOf('function SpokenLine'));
    expect(spoken).toMatch(/useEffect\(\(\) => \{\s*announce\(text\);\s*\}, \[text\]\);/);
    expect(spoken).toMatch(/accessibilityLiveRegion="polite"/);
    expect(page.match(/<ErrorLine message=\{failed \|\| pick\.failed \? photos\.capture\.openFailed : null\} \/>/g)).toHaveLength(2);
    expect(page).not.toMatch(/>\{photos\.capture\.openFailed\}</);
  });
  it('[NS-01-R20][review B on #838] no photo screen imports lib/auth/ui (it loads expo-apple-authentication); Listen\'s Type has its own key; nothing registers in a render body', () => {
    for (const f of ['photo-start.tsx', 'pending-photo-thumb.tsx', 'error-line.tsx']) {
      expect(readFileSync(join(SRC, 'components', 'photos', f), 'utf8'), f).not.toMatch(/lib\/auth\/ui/);
    }
    expect(readFileSync(join(SRC, 'app', 'listen.tsx'), 'utf8')).not.toMatch(/listen\.photo\.type[\s\S]{0,0}micDenied|micDenied\.typeButton\} onPress=\{typeInstead\}/);
    for (const f of ['use-photo-start.ts', 'use-photo-pick.ts']) {
      const src = readFileSync(join(SRC, 'lib', 'photos', f), 'utf8');
      expect(src, f).not.toMatch(/registerPhotoDevice\(\)/);
      expect(src, f).toMatch(/useRegisteredPhotoDevice\(\)/);
    }
    expect(readFileSync(join(SRC, 'lib', 'photos', 'use-registered.ts'), 'utf8')).toMatch(/useEffect\(\(\) => \{\s*registerPhotoDevice\(\);/);
    const start = readFileSync(join(SRC, 'lib', 'photos', 'use-photo-start.ts'), 'utf8');
    expect(start).toMatch(/if \(!picker \|\| running\.current\) return;/); // one pick at a time
    expect(start).toMatch(/\.catch\(\(\) => setFailed\(true\)\)/);
  });
  it('[NS-01-R39][NS-01-R42] the Ready thumbnail is at most 88 pt tall from AX3 and shows the whole picture (contain, never cover)', () => {
    const thumb = readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8');
    expect(thumb).toMatch(/large \? THUMB_AX_MAX_HEIGHT_PT : THUMB_MAX_HEIGHT_PT/);
    expect(thumb).toMatch(/fit="contain"/);
    expect(thumb).not.toMatch(/aspectRatio=/);
    expect(THUMB_AX_MAX_HEIGHT_PT).toBe(88);
  });
  it('[NS-01-R13a][NX-39-R36] the switcher snapshot shows no picture', () => {
    // The phase mapping the hook uses: only 'active' draws a picture; inactive (the snapshot moment), background and anything
    // else cover it. The mutant `usePictureCovered returns false` fails the source pins below.
    expect(coveredForAppState('active')).toBe(false);
    for (const phase of ['inactive', 'background', 'unknown', '']) expect(coveredForAppState(phase), phase).toBe(true);
    const hooks = readFileSync(join(SRC, 'lib', 'photos', 'hooks.ts'), 'utf8');
    expect(hooks).toMatch(/export function usePictureCovered\(\): boolean \{\s*const phase = useAppPhase\(\);\s*return coveredForAppState\(phase\);\s*\}/);
    // Every Image goes through PhotoFrame, which draws the opaque box when covered, at once.
    const frame = readFileSync(join(SRC, 'components', 'photos', 'photo-frame.tsx'), 'utf8');
    expect(frame).toMatch(/const covered = usePictureCovered\(\);/);
    expect(frame).toMatch(/if \(covered \|\| failed\) return <View [^>]*accessibilityLabel=\{label\} \/>;/);
    for (const f of walk(join(SRC, 'components', 'photos')).filter((x) => /\.tsx$/.test(x) && !/photo-frame\.tsx$/.test(x))) {
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(/<Image\b/);
    }
  });
  it('[NS-01-R13b] no picture before unlock', () => {
    // pictureCovered with the lock on and not yet unlocked covers a picture even in front. No caller passes `unlocked` today
    // (surface.ts takes the always-blank ruling instead): a follow-up when App lock state is read here.
    expect(pictureHidden({ lockOn: true, unlocked: false, phase: 'active' })).toBe(true);
    expect(pictureHidden({ lockOn: true, unlocked: true, phase: 'active' })).toBe(false);
    expect(pictureCovered('active', true, false)).toBe(true);
  });
  it('[NS-01-R59] no picker, no photo controls', () => {
    // No native module: nothing registered, so no start, no Change, no Add; absent, never dead.
    setPhotosForTest(true);
    try {
      registerPhotoPicker(null);
      registerPending(null);
      expect(photoStartShows(false)).toBe(false);
    } finally {
      setPhotosForTest(null);
    }
    const pick = readFileSync(join(SRC, 'lib', 'photos', 'use-photo-pick.ts'), 'utf8');
    expect(pick).toMatch(/ready: registered && getPhotoPicker\(\) !== null/);
    expect(readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8')).toMatch(/if \(!pending \|\| !source\) return null;/);
    expect(readFileSync(join(SRC, 'components', 'photos', 'photo-start.tsx'), 'utf8')).not.toMatch(/disabled=/);
  });
  it('[NS-01-R20] the Home start is a quiet text button (44 pt minimum comes from Button) with its own words and a hint', () => {
    const src = readFileSync(join(SRC, 'components', 'photos', 'photo-start.tsx'), 'utf8');
    expect(src).toMatch(/variant="quiet"/);
    expect(src).toMatch(/size="md"/);
    expect(src).toMatch(/accessibilityHint=/);
    expect(photos.capture.startButton).toBeTruthy();
  });
});

describe('[NS-01-R22] the system picker is the only source', () => {
  it('[NS-01-R22] no camera permission string, plugin, dependency or "Take a photo now" anywhere', () => {
    const cfg = readFileSync(join(ROOT, 'app.config.ts'), 'utf8');
    const pkg = readFileSync(join(ROOT, 'package.json'), 'utf8');
    expect(cfg).not.toMatch(/NSCameraUsageDescription|expo-camera|launchCameraAsync/);
    expect(pkg).not.toMatch(/expo-camera|react-native-vision-camera/);
    for (const f of [...walk(join(SRC, 'lib', 'photos')), ...walk(join(SRC, 'components', 'photos'))]) {
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(/launchCameraAsync|requestCameraPermissions|Take a photo now/);
    }
  });
});

describe('[NS-01-R10][NS-33-R3] the lens is one radio group of two radios, exactly one checked', () => {
  it('[NS-01-R48] the lens choice is a radio group: [NS-33-R3] LensRow is a segmented ChoiceGroup labelled for VoiceOver, never a tablist of buttons, and the group gives radiogroup, radio and checked', () => {
    const lens = readFileSync(join(SRC, 'components', 'photos', 'photos-lens.tsx'), 'utf8');
    const row = lens.slice(lens.indexOf('export function LensRow'), lens.indexOf('\n}\n', lens.indexOf('export function LensRow')));
    expect(row).toMatch(/<ChoiceGroup\s+layout="segmented"\s+label=\{photos\.book\.lens\.label\}/);
    expect(row).toMatch(/\{ value: 'months', label: photos\.book\.lens\.months \},\s*\{ value: 'photos', label: photos\.book\.lens\.photos \}/);
    expect(row).toMatch(/value=\{mode\}\s+onChange=\{onChange\}\s+testID="book\.lens"/);
    expect(lens).not.toMatch(/tablist|<Button\b|accessibilityState=\{\{ selected/);
    // The group's own roles: one radiogroup with the label, each option a radio whose checked is its value === value.
    const group = readFileSync(join(SRC, 'components', 'ui', 'choice-group.tsx'), 'utf8');
    expect(group).toMatch(/accessibilityRole="radiogroup"\s+accessibilityLabel=\{label\}\s+testID=\{testID\}/);
    expect(group).toMatch(/<SegmentChoice key=\{o\.value\} option=\{o\} checked=\{o\.value === value\}/);
    expect(group).toMatch(/accessibilityRole="radio"\s+accessibilityState=\{\{ checked \}\}/);
    expect(photos.book.lens.label.length).toBeGreaterThan(0);
  });
  it('[NS-33-R3][NS-01-R10] the lens row stays mounted across the switch: both lenses are the one SectionList, the row in its header (#840 review A)', () => {
    const book = readFileSync(join(SRC, 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(book.match(/<LensRow /g)).toHaveLength(1);
    expect(book.match(/<AnimatedSectionList\b/g)).toHaveLength(1);
    expect(book).not.toMatch(/<ScrollView\b|PhotoChapters/);
    expect(book).toMatch(/const sections = useMemo\(\(\) => \(showPhotos \? photoChapters\(chapters, lens\.photos\) : chapters\), \[showPhotos, chapters, lens\.photos\]\);/);
    expect(book).toMatch(/sections=\{sections\}\s+keyExtractor=\{\(e: Entry\) => e\.id\}\s+ListHeaderComponent=\{header\}/);
    expect(book).toMatch(/showPhotos \? \(\s*<LensCard entry=\{item\} picture=\{lens\.photos\.get\(item\.id\)\} child=\{active\} onOpen=\{open\} \/>/);
    // The lens row sits in `header`, which no lens branch renders on its own.
    const header = book.slice(book.indexOf('const header = ('), book.indexOf('const compact = '));
    expect(header).toMatch(/<LensRow mode=\{lensMode\} onChange=\{setLensMode\} \/>/);
  });
  it('[NS-01-R20e][NS-33-R9] Months is not offered in Photos, never opens by itself on the way back, and has its own name beside the lens row (#840 review A)', () => {
    const book = readFileSync(join(SRC, 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(book).toMatch(/const months =\s*!showPhotos && showsMonthsButton\(rows\)\s*\? \{ label: lensOn \? photos\.book\.lens\.monthsButton : bookCopy\.monthsButton,/);
    expect(book).toMatch(/<MonthsSheet open=\{monthsOpen && !showPhotos\} rows=\{rows\}/);
    expect(book.match(/<MonthsSheet /g)).toHaveLength(1);
    // Both Months buttons (the cover band's and the bar's) take `months`; neither is drawn without it.
    expect(book).toMatch(/months=\{chapters\.length > 0 \? months : null\}/);
    expect(book).toMatch(/\{months \? <Button variant="quiet" size="sm" label=\{months\.label\}/);
    expect(photos.book.lens.monthsButton).not.toBe(photos.book.lens.months);
    // An arrival lands in Months, and a lens that goes away leaves Months chosen.
    expect(book).toMatch(/if \(params\.arrived \|\| !lensOn\) setLensMode\('months'\);/);
  });
});

describe('[NS-01-R23] the Book empty button only moves to Home; the lens cannot start a letter', () => {
  it('[NS-01-R23] book.empty.bookCta switches to the Home tab and calls no capture function', () => {
    const f = join(SRC, 'app', '(tabs)', 'book.tsx');
    const sf = parse(f);
    let found = false;
    visit(sf, (n) => {
      if (jsxName(n) !== 'Button' && !(ts.isJsxSelfClosingElement(n) && n.tagName.getText() === 'Button')) return;
      const attrs = ts.isJsxElement(n) ? n.openingElement.attributes : (n as ts.JsxSelfClosingElement).attributes;
      const label = attrs.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === 'label');
      if (!label || !label.getText().includes('book.empty.bookCta')) return;
      found = true;
      const onPress = attrs.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === 'onPress')!;
      expect(onPress.getText().replace(/\s+/g, '')).toBe("onPress={()=>router.navigate('/')}");
    });
    expect(found).toBe(true);
    // The Book now hosts the read-only Photos lens, so its flag, hook and lens component are allowed; nothing that can
    // start a letter or open the picker is (start-intent, capture, the photo start, the picker, the pending picture).
    expect(importsOf(sf).filter((m) => /start-intent|capture|photos\/(use-photo-start|use-photo-pick|photo-start|session|registry|pending|device|picker|attach)/.test(m))).toEqual([]);
    expect(importsOf(sf).filter((m) => /photos/.test(m)).sort()).toEqual(['@/components/photos/photos-lens', '@/lib/photos/copy', '@/lib/photos/flag', '@/lib/photos/hooks', '@/lib/photos/lens', '@/lib/photos/pause']);
    expect(readFileSync(f, 'utf8')).not.toMatch(/armListenStart|pathname: '\/(listen|write)'|href="\/(listen|write)"/);
  });
  it('[NS-01-R23] the lens copy has no "Add photos" button word', () => {
    expect(JSON.stringify(photos.book.lens)).not.toMatch(/add/i);
  });
});
