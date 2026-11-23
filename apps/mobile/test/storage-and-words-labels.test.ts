/// <reference types="node" />
/**
 * Two Settings labels the founder flagged on build 1 (8 Nov 2026).
 * - Storage: the listening detector and the speech model are both language "mul", so both rows (and both Remove
 *   labels for VoiceOver) read "All languages, Speech model". Each now has its own name from packages/content.
 * - The words switch (now Your words, two named choices, #639) was labelled "Word for word", with a line that flipped between "Small fixes, marked" and
 *   "Exactly as said", so On read as the opposite of word for word. The label now names what On means and the
 *   footer names both choices. The stored setting is unchanged.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, packsCopy as raw } from '@scribe/content';
import { packName } from '../src/lib/packs/copy';
import { DEFAULT_VIEW_SETTING } from '../src/components/capture/review-view.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const VAD = { id: 'speech-model.silero-vad-v6.2.0', kind: 'speech-model', language: 'mul' };
const TURBO = { id: 'speech-model.whisper-large-v3-turbo-q5_0', kind: 'speech-model', language: 'mul' };
const SMALL = { id: 'speech-model.whisper-small-q5_1', kind: 'speech-model', language: 'mul' };

describe('Settings > Storage names each download', () => {
  it('the detector and the speech model have their own names', () => {
    expect(packName(VAD)).toBe('Listening detector');
    expect(packName(TURBO)).toBe('English speech model');
    expect(packName(SMALL)).toBe('English speech model');
    expect(packName(VAD)).not.toBe(packName(TURBO));
    expect(raw.names[VAD.id]).toBe('Listening detector');
  });

  it('any other pack keeps "{language}, {kind}"', () => {
    expect(packName({ id: 'text-rules.pt', kind: 'text-rules', language: 'pt' })).toBe('Portuguese, Spelling and punctuation');
  });

  it('the rows and the Remove labels read the shared name, and an unknown manifest still finds it', () => {
    const screen = src('app/settings/storage.tsx');
    expect(screen).toMatch(/import \{ formatBytes, packName, packsCopy as t \} from '@\/lib\/packs\/copy';/);
    expect(screen).not.toMatch(/function packName/);
    expect(screen).toMatch(/<ListRow title=\{packName\(p\)\}/);
    expect(screen).toMatch(/accessibilityLabel=\{fill\(t\.removeA11y, \{ name: packName\(p\) \}\)\}/);
    expect(screen).toMatch(/entry \? packName\(entry\) : \(t\.names\[id\] \?\? id\)/);
  });
});

// 8 Nov 2026 (#639, CTO ruling): Your words (app/settings/your-words.tsx) replaces the switch and the Recordings page.
// The three guarantees below move with it, unchanged in intent: each choice is named and never flips with the value,
// both choices are named on the page, and the stored setting is the same key with the same two values.
describe('the words choice names what each option means (Your words)', () => {
  it('each choice is named, and no label flips with the value', () => {
    const screen = src('app/settings/your-words.tsx');
    expect(screen).toMatch(/\{ value: 'fixes', label: w\.marked\.label, description: w\.marked\.line \}/);
    expect(screen).toMatch(/\{ value: 'exact', label: w\.exact\.label, description: w\.exact\.line \}/);
    expect(screen).not.toMatch(/tidyLabel|description=\{fixes|ToggleRow/);
    // The same words the switch used for its two states.
    expect(en.yourWords.marked.label).toBe(en.settings.tidyOn);
    expect(en.yourWords.exact.label).toBe(en.settings.tidyOff);
    expect(en.settings.tidyOn).toBe('Small fixes, marked');
    expect((en.settings as Record<string, unknown>).tidyLabel).toBeUndefined();
  });

  it('the page names both choices, says we never rewrite, and keeps the registered mishear line', () => {
    const screen = src('app/settings/your-words.tsx');
    expect(en.yourWords.footer).toBe('Either way, we never rewrite your words.');
    expect(screen).toMatch(/\{w\.footer\}/);
    expect(screen).toMatch(/\{copy\.settings\.help\.mistakes\}/);
    // tidyHelp described the switch; no screen reads it now (kept for the dead-copy sweep, its words unchanged).
    expect(en.settings.tidyHelp).toContain(en.settings.tidyOff);
    expect(screen).not.toMatch(/tidyHelp/);
    expect(existsSync(join(__dirname, '..', 'src', 'app/settings/recordings.tsx'))).toBe(false);
  });

  it('the stored setting is unchanged: Small fixes stores fixes, Exactly as said stores exact', () => {
    const screen = src('app/settings/your-words.tsx');
    expect(screen).toMatch(/setSetting\(DEFAULT_VIEW_SETTING, v\)/);
    expect(screen).toMatch(/useState<ReviewView>/);
    expect(screen).toMatch(/viewFromSetting\(getSetting\(DEFAULT_VIEW_SETTING\)\)/);
    expect(DEFAULT_VIEW_SETTING).toBe('review.defaultView');
  });
});
