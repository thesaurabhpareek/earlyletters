// BL-1483: the lens card's "file is gone" flag belongs to one picture, not to the row. A replaced picture for the
// same letter shows again while the row stays mounted. The fictional family is Asha.
import { describe, expect, it, vi } from 'vitest';
import type { StoredPhoto } from '../src/lib/photos/types';

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({}));
vi.mock('@/components/book/letter-card', () => ({ BookRow: 'BookRow', LetterCard: 'LetterCard' }));
vi.mock('@/components/ui/choice-group', () => ({ ChoiceGroup: 'ChoiceGroup' }));
vi.mock('@/lib/a11y', () => ({ useIsAccessibilitySize: () => false }));
vi.mock('@/lib/photos/device', () => ({ photoUri: (p: { mediaId: string }) => `file:///d/${p.mediaId}.jpg` }));
vi.mock('../src/components/photos/photo-frame', () => ({ PhotoFrame: 'PhotoFrame' }));

import { renderHook } from './helpers/mini-react';
import { LensCard } from '../src/components/photos/photos-lens';

const photo = (mediaId: string): StoredPhoto => ({ entryId: 'e1', mediaId, ext: 'jpg', bytes: 1, sha256: 'x', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-11T00:00:00Z', deletedAt: null });
type El = { props: Record<string, any> };
const entry = { id: 'e1' } as never;
const child = { id: 'c1' } as never;

describe('[BL-1483] the lens card forgets a missing file when the picture changes', () => {
  it('[BL-1483] a file that is gone shows no thumbnail; a replaced picture for the same letter shows again without a remount', () => {
    let picture = photo('m1');
    const run = renderHook(() => LensCard({ entry, picture, child, onOpen: () => {} }) as unknown as El | null);
    const cardOf = () => (run.result.current as El).props.children as El;
    const thumb = cardOf().props.photo.thumb as El;
    expect(thumb.props.uri).toContain('m1');
    thumb.props.onMissing(); // m1's file is gone
    expect(cardOf().props.photo).toBeUndefined();
    picture = photo('m2'); // the letter's picture was replaced
    run.rerender();
    expect((cardOf().props.photo.thumb as El).props.uri).toContain('m2');
    (cardOf().props.photo.thumb as El).props.onMissing(); // m2 is gone too: hidden again (fail closed)
    expect(cardOf().props.photo).toBeUndefined();
    run.rerender();
    expect(cardOf().props.photo).toBeUndefined(); // still the same picture, still hidden
    run.unmount();
  });
});
