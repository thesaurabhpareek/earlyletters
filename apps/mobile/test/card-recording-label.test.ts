/** NX-36-S17 G3 (spec F8): the Book card says a recording is kept on this phone only when this phone holds a recording reference. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { cardLabel } from '../src/components/book/letter-card.logic';
import { provenanceLine } from '../src/lib/provenance';

const base = { signature: 'From Mama', dateline: 'Tuesday, October 14, 2026, Asha is 7 months old', text: 'Asha laughed at the dog', inBook: true, privateLabel: 'Private', recordingOnPhone: en.book.recordingOnPhone };

describe('[NX-36-S17] a card label says Recording kept on this phone only when the letter has a recording reference on this phone', () => {
  it('[NX-36-S17] with an audioUri it says so, word for word', () => {
    expect(cardLabel({ ...base, audioUri: 'file:///rec/1.m4a' })).toBe('From Mama. Tuesday, October 14, 2026, Asha is 7 months old. Asha laughed at the dog. Recording kept on this phone');
  });
  it('[NX-36-S17] a spoken own letter pulled onto a new phone (audioUri null) does not say it', () => {
    expect(cardLabel({ ...base, audioUri: null })).toBe('From Mama. Tuesday, October 14, 2026, Asha is 7 months old. Asha laughed at the dog');
    expect(cardLabel({ ...base, audioUri: undefined })).not.toMatch(/Recording kept/);
    expect(cardLabel({ ...base, audioUri: '' })).not.toMatch(/Recording kept/);
  });
  it('[NX-36-S17] the clause reads audioUri alone, in its place after the waiting reason', () => {
    expect(cardLabel({ ...base, audioUri: 'file:///a', inBook: false, reason: 'Getting ready, 40%' })).toMatch(/Private\. Getting ready, 40%\. Recording kept on this phone$/);
  });
  it('[NX-36-S17] the card passes entry.audioUri and nothing about speaking or owning', () => {
    const card = readFileSync(join(__dirname, '..', 'src', 'components', 'book', 'letter-card.tsx'), 'utf8');
    expect(card).toMatch(/audioUri: entry\.audioUri,/);
    expect(card).not.toMatch(/spoken,\s*\n\s*own:/);
  });
});

describe('[NX-36-S17] the letter page line says Recording kept on this phone only when the letter has a recording reference on this phone', () => {
  const words = en.book.provenance;
  const spoken = { captureMode: 'spoken', rawTranscript: 'Asha um laughed', finalText: 'Asha laughed' };
  const line = (audioUri: string | null | undefined, own = true) => provenanceLine(spoken, { own, audioUri, words, recordingOnPhone: en.book.recordingOnPhone });

  it('[NX-36-S17] with an audioUri an own spoken letter says so, word for word', () => {
    expect(line('file:///rec/1.m4a')).toBe('Spoken, with small fixes. Recording kept on this phone.');
  });
  it('[NX-36-S17] a spoken own letter pulled onto a new phone (no audioUri) says how it was made and nothing about a recording here', () => {
    for (const none of [null, undefined, '']) {
      expect(line(none)).toBe('Spoken, with small fixes');
      expect(line(none)).not.toMatch(/Recording kept|phone/);
    }
  });
  it('[NX-36-S17] the other parent\'s letter never names a place, whatever audioUri holds', () => {
    expect(line('file:///rec/1.m4a', false)).toBe('Spoken');
  });
  it('[NX-36-S17] the page passes entry.audioUri to the line and nothing about speaking or owning decides the place', () => {
    const page = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');
    expect(page).toMatch(/provenanceLineOf\(entry, \{ own, audioUri: entry\.audioUri,/);
  });
});
