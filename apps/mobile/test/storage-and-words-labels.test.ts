/// <reference types="node" />
/**
 * Two Settings labels the founder flagged on build 1 (8 Nov 2026).
 * - Storage: the listening detector and the speech model are both language "mul", so both rows (and both Remove
 *   labels for VoiceOver) read "All languages, Speech model". Each now has its own name from packages/content.
 * - The words switch was labelled "Word for word", with a line that flipped between "Small fixes, marked" and
 *   "Exactly as said", so On read as the opposite of word for word. The label now names what On means and the
 *   footer names both choices. The stored setting is unchanged.
 */
import { readFileSync } from 'node:fs';
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

describe('the words switch names what On means', () => {
  it('the label is the On choice and never flips with the value', () => {
    const screen = src('app/settings/recordings.tsx');
    expect(screen).toMatch(/<ToggleRow\s+title=\{copy\.settings\.tidyOn\}\s+value=\{fixes\}/);
    expect(screen).not.toMatch(/tidyLabel|description=\{fixes/);
    expect(en.settings.tidyOn).toBe('Small fixes, marked');
    expect((en.settings as Record<string, unknown>).tidyLabel).toBeUndefined();
  });

  it('the footer names both choices', () => {
    expect(en.settings.tidyHelp).toBe(
      'With this on, new letters open with small fixes marked, and you can put any of them back. With it off, they open Exactly as said, with every um and false start. Either way, we never rewrite your words.',
    );
    expect(en.settings.tidyHelp).toContain(en.settings.tidyOff);
    expect(src('app/settings/recordings.tsx')).toMatch(/footer=\{`\$\{copy\.settings\.tidyHelp\} \$\{copy\.settings\.help\.mistakes\}`\}/);
  });

  it('the stored setting is unchanged: On stores fixes, Off stores exact', () => {
    const screen = src('app/settings/recordings.tsx');
    expect(screen).toMatch(/setSetting\(DEFAULT_VIEW_SETTING, on \? 'fixes' : 'exact'\)/);
    expect(typeof DEFAULT_VIEW_SETTING).toBe('string');
  });
});
