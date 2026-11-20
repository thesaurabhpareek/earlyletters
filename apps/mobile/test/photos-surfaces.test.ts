// NS-01 photo with a letter: where the controls are, what the switch removes, and what the code may not call.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { selectPrompt } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tonightPromptInput } from '../src/components/tonight/prompt.logic';
import { applyPullPage } from '../src/lib/sync/merge';
import { entrySnapshot, SYNC_SETTING, writeSetting, type LocalEntryRow } from '../src/lib/sync/outbox';
import type { PullResponse } from '../src/lib/sync/types';
import { tokens } from '@scribe/design-tokens';
import { adoptPending } from '../src/lib/photos/adopt';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { parsePhotosFlag, photoSurfaces, photosPaused } from '../src/lib/photos/flag';
import { pictureHidden, THUMB_MAX_HEIGHT_PT } from '../src/lib/photos/surface';
import { commitPhoto, PhotoSession } from '../src/lib/photos/session';
import { photos } from '../src/lib/photos/copy';
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

describe('[NS-01-R3] the prompt does not depend on the picture', () => {
  it('[NS-01-R3] with 3 different pictures and one fixed state the chosen prompt is identical', () => {
    const state = { birthday: '2026-04-01', today: '2026-11-11', daysSinceLastEntry: 2, recentKeys: [], shuffle: 0, leftKey: null, childName: 'Asha' };
    const picked: string[] = [];
    for (const uri of ['picker://a', 'picker://b', 'picker://c']) {
      const s = new PhotoSession();
      s.pick({ uri });
      picked.push(selectPrompt(tonightPromptInput(state), PROMPTS).key); // the input has no place for the picture
    }
    expect(new Set(picked).size).toBe(1);
    expect(Object.keys(state).some((k) => /photo|picture|uri/i.test(k))).toBe(false);
  });
  it('[NS-01-R3] the thumbnail is at most 160 pt tall and sits above the prompt on Listen and above the field on Write', () => {
    expect(THUMB_MAX_HEIGHT_PT).toBe(160);
    const thumb = readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8');
    expect(thumb).toMatch(/height=\{large \? undefined : THUMB_MAX_HEIGHT_PT\}/);
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
    const hook = readFileSync(join(SRC, 'lib', 'photos', 'use-photo-start.ts'), 'utf8');
    expect(hook).toMatch(/photoSurfaces\(\{ build: photosBuildEnabled\(\), paused \}\)\.start && getPhotoPicker\(\) !== null/);
    expect(readFileSync(join(SRC, 'app', '(tabs)', 'index.tsx'), 'utf8')).toMatch(/photoStart\.show \? <PhotoStartButton/);
  });
  it('[NS-01-R19] off, Listen, Write and Review gain nothing: the thumbnail needs a pending picture, and Keep stores nothing without one', async () => {
    expect(readFileSync(join(SRC, 'components', 'photos', 'pending-photo-thumb.tsx'), 'utf8')).toMatch(/if \(!pending \|\| !source\) return null;/);
    const { d, files, store } = deps();
    await adoptPending(null, () => d, 'e1', 'Asha and the rain boots.', true);
    expect(files.writes + store.puts).toBe(0);
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
  it('[NS-01-R20b] Ready with a picture offers Type after Speak (Type keeps the picture), in the order thumbnail, prompt, Speak, Type (#838 review B)', () => {
    const listen = readFileSync(join(SRC, 'app', 'listen.tsx'), 'utf8');
    expect(listen).toMatch(/\{room\.startControl && withPhoto \? \(\s*<Button variant="quiet" size="md" label=\{copy\.errors\.micDenied\.typeButton\} onPress=\{typeInstead\} testID="listen\.photo\.type" \/>/);
    expect(listen).toMatch(/const withPhoto = phase === 'ready' && !!pendingPhoto\?\.source;/);
    const at = ['<PendingPhotoThumb />', 'testID="listen.prompt"', 'testID="listen.start"', 'testID="listen.photo.type"'].map((m) => listen.indexOf(m));
    expect(at.every((i, n) => i > -1 && (n === 0 || i > at[n - 1])), String(at)).toBe(true);
  });
  it('[NS-01-R17][NS-33] "That photo could not be opened" is said aloud: both places use ErrorLine, which announces it and is a live region (#838 review B)', () => {
    for (const f of ['photo-start.tsx', 'pending-photo-thumb.tsx']) {
      const src = readFileSync(join(SRC, 'components', 'photos', f), 'utf8');
      expect(src, f).toMatch(/<ErrorLine message=\{\w+(\.failed)? \? photos\.capture\.openFailed : null\} \/>/);
      expect(src, f).not.toMatch(/>\{photos\.capture\.openFailed\}</);
    }
    const line = readFileSync(join(SRC, 'lib', 'auth', 'ui.tsx'), 'utf8');
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
  it('[NS-33-R3] LensRow is a segmented ChoiceGroup labelled for VoiceOver, never a tablist of buttons, and the group gives radiogroup, radio and checked', () => {
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
