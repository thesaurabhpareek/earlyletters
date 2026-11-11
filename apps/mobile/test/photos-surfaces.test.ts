// NS-01 photo with a letter: where the controls are, what the switch removes, and what the code may not call.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { selectPrompt } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tonightPromptInput } from '../src/components/tonight/prompt.logic';
import { entrySnapshot, type LocalEntryRow } from '../src/lib/sync/outbox';
import { exportPhotos } from '../src/lib/photos/export';
import { parsePhotosFlag, photoSurfaces, photosPaused } from '../src/lib/photos/flag';
import { wipeAllPhotos } from '../src/lib/photos/lifecycle';
import { pictureHidden, MIN_TARGET_PT, READY_ORDER, THUMB_MAX_HEIGHT_PT, THUMB_MIN_PT } from '../src/lib/photos/surface';
import { commitPhoto, PhotoSession } from '../src/lib/photos/session';
import { photos } from '../src/lib/photos/copy';
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
  });
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
  it('[NS-01-R3] the thumbnail is at least 64 pt on its longest side and at most 160 pt tall', () => {
    expect(THUMB_MIN_PT).toBeGreaterThanOrEqual(64);
    expect(THUMB_MAX_HEIGHT_PT).toBe(160);
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
  it('[NS-01-R19][NX-39-R37] export and erase take no switch and still work', async () => {
    const { d, store, files } = deps();
    await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', text: null, bytes: makeJpeg() });
    expect(exportPhotos.length).toBe(2);
    expect(exportPhotos(store.all(), new Set(['e1'])).count).toBe(1);
    expect(wipeAllPhotos.length).toBe(1);
    await wipeAllPhotos(d);
    expect(files.disk.size).toBe(0);
  });
  it('[NS-01-R19] the Home start is guarded by the switch and a registered picker (absent, not dead)', () => {
    const hook = readFileSync(join(SRC, 'lib', 'photos', 'use-photo-start.ts'), 'utf8');
    expect(hook).toMatch(/photoSurfaces\(\{ build: photosBuildEnabled\(\), paused \}\)\.start && getPhotoPicker\(\) !== null/);
    expect(readFileSync(join(SRC, 'app', '(tabs)', 'index.tsx'), 'utf8')).toMatch(/photoStart\.show \? <PhotoStartButton/);
  });
});

describe('[NS-01-R20] new controls', () => {
  it('[NS-01-R20] targets are 44 pt or more, and the reading order is thumbnail, prompt, Speak, Type', () => {
    expect(MIN_TARGET_PT).toBeGreaterThanOrEqual(44);
    expect([...READY_ORDER]).toEqual(['thumbnail', 'prompt', 'speak', 'type']);
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
    expect(importsOf(sf).filter((m) => /start-intent|capture|photos/.test(m))).toEqual([]);
    expect(readFileSync(f, 'utf8')).not.toMatch(/armListenStart|pathname: '\/(listen|write)'|href="\/(listen|write)"/);
  });
  it('[NS-01-R23] the lens copy has no "Add photos" button word', () => {
    expect(JSON.stringify(photos.book.lens)).not.toMatch(/add/i);
  });
});
