// [NS-01-R38b] BL-954 photos slice: one undo-window helper. The window is open for its seconds, or until the undo line
// has been spoken plus those seconds, whichever is later; with Switch Control on it stays until the parent moves on.
// The toast's close time and the action's own check read the same helper, so no live button outlives the action.
// Pure Node test: no react-native import. Fictional family Asha.
import { describe, expect, it } from 'vitest';
import { removePhotoFromLetter, undoPhotoChange } from '../src/lib/photos/attach';
import { closeDelayMs, windowOpen } from '../src/lib/photos/undo-window';
import { deps, makeJpeg } from './photos-helpers';
import type { StoredPhoto } from '../src/lib/photos/types';

const T0 = 1_000_000;
const row = (): StoredPhoto => ({ entryId: 'asha-1', mediaId: 'm0', ext: 'jpg', bytes: makeJpeg().length, sha256: 'x', width: 10, height: 10, text: null, place: null, addedAt: new Date(T0).toISOString(), deletedAt: null });

describe('windowOpen', () => {
  it('[NS-01-R38b] is open for its seconds and shut one millisecond after', () => {
    expect(windowOpen(T0 + 10_000, T0, 10)).toBe(true);
    expect(windowOpen(T0 + 10_001, T0, 10)).toBe(false);
  });
  it('[NS-06-A2b] VoiceOver finishing late extends the window to the speech end plus the seconds', () => {
    expect(windowOpen(T0 + 14_000, T0, 10, T0 + 5_000)).toBe(true);
    expect(windowOpen(T0 + 15_001, T0, 10, T0 + 5_000)).toBe(false);
  });
  it('speech noted before the window opened never shortens the window', () => {
    expect(windowOpen(T0 + 10_000, T0, 10, T0 - 500)).toBe(true);
    expect(windowOpen(T0 + 10_001, T0, 10, T0 - 500)).toBe(false);
  });
  it('[NS-33-R15] with Switch Control on there is no expiry', () => {
    expect(windowOpen(T0 + 3_600_000, T0, 10, undefined, true)).toBe(true);
  });
});

describe('closeDelayMs (when the toast must close)', () => {
  it('[NS-01-R38b] is the time left, and zero once past', () => {
    expect(closeDelayMs(T0 + 4_000, T0, 10)).toBe(6_000);
    expect(closeDelayMs(T0 + 20_000, T0, 10)).toBe(0);
  });
  it('waits for the speech end plus the seconds', () => {
    expect(closeDelayMs(T0 + 4_000, T0, 10, T0 + 5_000)).toBe(11_000);
  });
  it('is null (no timer) with Switch Control on', () => {
    expect(closeDelayMs(T0, T0, 10, undefined, true)).toBeNull();
  });
});

describe('undoPhotoChange reads the helper', () => {
  const take = () => {
    const x = deps();
    x.store.put(row());
    const ticket = removePhotoFromLetter(x.d, 'asha-1')!;
    return { ...x, ticket };
  };
  it('[NS-01-R38b] refuses after the window and restores inside it', async () => {
    const a = take();
    a.clock.t += 10_001;
    expect(await undoPhotoChange(a.d, a.ticket)).toBe(false);
    const b = take();
    b.clock.t += 10_000;
    expect(await undoPhotoChange(b.d, b.ticket)).toBe(true);
    expect(b.store.get('asha-1')).not.toBeNull();
  });
  it('[NS-06-A2b] still works after 10 seconds once VoiceOver finished late, and the toast closes with it', async () => {
    const a = take();
    a.ticket.speechDoneAt = a.clock.t + 6_000;
    a.clock.t += 12_000;
    expect(await undoPhotoChange(a.d, a.ticket)).toBe(true);
    const b = take();
    b.ticket.speechDoneAt = b.clock.t + 6_000;
    b.clock.t += 16_001;
    expect(await undoPhotoChange(b.d, b.ticket)).toBe(false);
    expect(closeDelayMs(b.clock.t, b.ticket.openedAt, 10, b.ticket.speechDoneAt, b.ticket.holdOpen)).toBe(0);
  });
  it('[NS-33-R15] a held ticket (Switch Control) still undoes an hour later', async () => {
    const a = take();
    a.ticket.holdOpen = true;
    a.clock.t += 3_600_000;
    expect(await undoPhotoChange(a.d, a.ticket)).toBe(true);
  });
});
