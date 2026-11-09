/// <reference types="node" />
/**
 * The speech row's action word is part of the row's label (WCAG 2.5.3 Label in Name; design-systems audit 9 Nov 2026,
 * rows 2 and 3). The Stop, Download and Remove word used to be hidden from VoiceOver and absent from the label, so
 * Voice Control could not say "Tap Stop" and VoiceOver with hints off never learned that a tap stops a download.
 * Also: the ring and the word stack under the language name at accessibility text sizes, as a string value does.
 *
 * The label and the placement are pure (components/ui/list-row.logic.ts) and run here. The components are React
 * Native, so their use of the rules is pinned in their source. No new words: the strings are the ones the row used.
 * Fixture: the fictional family Asha speaks English.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { packsCopy, speechSettingsCopy } from '@scribe/content';
import { speechRow, type SpeechRowState } from '../src/components/settings/recordings.logic';
import { rowLabel } from '../src/components/ui/list-row.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

/** What SpeechRow hands ListRow, run through the row's label rule (speech-row.tsx: actionWord={row.trailing ?? undefined}, onPress when row.action). */
const labelFor = (state: SpeechRowState) => {
  const row = speechRow(state);
  return rowLabel({ title: 'English', subtitle: row.subtitle, actionWord: row.trailing ?? undefined, pressable: row.action !== null });
};

describe('[S1-97b] the language row says what a tap does in its label', () => {
  it('Stop while it downloads: "English, Getting ready, 40%, Stop"', () => {
    expect(labelFor({ kind: 'downloading', fraction: 0.4 })).toBe('English, Getting ready, 40%, Stop');
    expect(labelFor({ kind: 'downloading', fraction: 0.004 })).toBe('English, Downloading, Stop');
  });
  it('Stop while it waits for Wi-Fi, Download when it is not here, Remove when it is', () => {
    expect(labelFor({ kind: 'waitingForWifi', mb: 575 })).toBe('English, Waits for Wi-Fi, 575 MB, Stop');
    expect(labelFor({ kind: 'absent', mb: 575 })).toBe('English, Not on this phone, 575 MB, Download');
    expect(labelFor({ kind: 'here', mb: 575 })).toBe('English, On this phone, 575 MB, Remove');
  });
  it('rows a tap cannot help name no action: no space, and the design preview that cannot read files', () => {
    expect(labelFor({ kind: 'noSpace', mb: 575 })).toBe('English, Needs more free space, 575 MB');
    expect(labelFor({ kind: 'unknown', mb: 575 })).toBe('English, Not on this phone, 575 MB');
  });
  it('the word in the label is the word on the row, and a word that already exists: no new string', () => {
    for (const state of [{ kind: 'downloading', fraction: 0.4 }, { kind: 'waitingForWifi', mb: 575 }, { kind: 'absent', mb: 575 }, { kind: 'here', mb: 575 }] as const) {
      const row = speechRow(state);
      expect(labelFor(state).endsWith(`, ${row.trailing}`)).toBe(true);
    }
    expect(speechRow({ kind: 'downloading', fraction: 0.4 }).trailing).toBe(packsCopy.stopButton);
    expect(speechRow({ kind: 'absent', mb: 575 }).trailing).toBe(speechSettingsCopy.downloadButton);
    expect(speechRow({ kind: 'here', mb: 575 }).trailing).toBe(speechSettingsCopy.confirmButton);
  });
  it('the hint stays, and says what the label does not repeat', () => {
    const row = speechRow({ kind: 'downloading', fraction: 0.4 });
    expect(row.hint).toBe(speechSettingsCopy.stopHint);
    expect(labelFor({ kind: 'downloading', fraction: 0.4 })).not.toContain(row.hint!);
  });
});

describe('[S1-97b] the components use the rules (source pins)', () => {
  const speech = code('components/settings/speech-row.tsx');
  const listRow = code('components/ui/list-row.tsx');

  it('SpeechRow gives ListRow the visible word as the action word, and still keeps the hint and the press', () => {
    expect(speech).toMatch(/actionWord=\{row\.trailing \?\? undefined\}/);
    expect(speech).toMatch(/accessibilityHint=\{row\.hint\}/);
    expect(speech).toMatch(/onPress=\{\s*row\.action === 'remove'/);
  });

  it('the visible word and ring stay hidden from VoiceOver by their wrappers: the word is read once, in the label', () => {
    expect(speech).toMatch(/function TrailingWord[\s\S]*?accessible=\{false\} importantForAccessibility="no-hide-descendants"/);
    expect(speech).toMatch(/function ProgressRing[\s\S]*?accessible=\{false\} importantForAccessibility="no-hide-descendants"/);
  });

  it('ListRow builds the label of both its branches (pressable and not) with rowLabel, from the action word', () => {
    expect(listRow).toMatch(/const label = rowLabel\(\{[^}]*actionWord[^}]*pressable: !!onPress[^}]*\}\)/);
    expect(listRow.match(/accessibilityLabel=\{label\}/g)).toHaveLength(2);
    expect(listRow).not.toMatch(/\[title, subtitle, value\]/);
  });

  it('ListRow stacks a trailing node under the title block at AX sizes, inside the same column as a string value', () => {
    expect(listRow).toMatch(/trailingNodePlacement\(\{ ax, hasNode: node !== null \}\)/);
    // under: the node is drawn inside the flex-1 column that holds the title block and the value, after them.
    expect(listRow).toMatch(/\{value \? \([\s\S]*?\) : null\}\s*\{nodeAt === 'under' \? <View className="self-start">\{node\}<\/View> : null\}\s*<\/View>/);
    // beside: the node stays a sibling of that column, as before, and only when it is not stacked.
    expect(listRow).toMatch(/<\/View>\s*\{nodeAt === 'beside' \? node : null\}/);
    // The node is not drawn unconditionally any more (it would then show twice at AX sizes).
    expect(listRow).not.toMatch(/^\s*\{node\}\s*$/m);
  });
});
