/**
 * Toast (EXPERIENCE_PASS principle 8, S36, S38; P1 acceptance): showing a second toast replaces the first.
 * The words are the copy package's own (fictional family Asha).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@scribe/content';
import { EMPTY_TOAST, createToastStore, reduceToast, type ToastState } from '../src/components/ui/toast.logic';

type O = { message: string; action?: { label: string }; onDismiss?: () => void };
const restored: O = { message: en.settings.delete.restoredToast.replace('{child}', 'Asha'), action: { label: en.common.undoButton } };
const erased: O = { message: en.settings.delete.erasedToast };
const start = EMPTY_TOAST as ToastState<O>;

describe('reduceToast: one toast, replaced, never stacked', () => {
  it('showing a second toast replaces the first', () => {
    const one = reduceToast(start, { type: 'show', host: 'root', options: restored });
    const two = reduceToast(one.state, { type: 'show', host: 'root', options: erased });
    expect(two.state.current?.options).toBe(erased);
    expect(two.replaced?.options).toBe(restored);
    // Exactly one toast exists: there is no list to stack into.
    expect(Object.keys(two.state)).toEqual(['current', 'nextKey', 'nextSession']);
  });

  it('a replacement in the same host keeps the box (same session) with a new key; another host starts a new box', () => {
    const one = reduceToast(start, { type: 'show', host: 'root', options: restored });
    const two = reduceToast(one.state, { type: 'show', host: 'root', options: erased });
    expect(two.state.current!.session).toBe(one.state.current!.session);
    expect(two.state.current!.key).not.toBe(one.state.current!.key);
    const three = reduceToast(two.state, { type: 'show', host: 'tabs', options: restored });
    expect(three.state.current!.host).toBe('tabs');
    expect(three.state.current!.session).not.toBe(two.state.current!.session);
    expect(three.replaced!.host).toBe('root'); // the toast in the other host is gone too
  });

  it("a late timer or swipe on a replaced toast never closes the one that took its place", () => {
    const one = reduceToast(start, { type: 'show', host: 'root', options: restored });
    const two = reduceToast(one.state, { type: 'show', host: 'root', options: erased });
    const stale = reduceToast(two.state, { type: 'hide', key: one.state.current!.key });
    expect(stale.state.current?.options).toBe(erased);
    expect(stale.hidden).toBeNull();
    const own = reduceToast(two.state, { type: 'hide', key: two.state.current!.key });
    expect(own.state.current).toBeNull();
    expect(own.hidden?.options).toBe(erased);
  });

  it('hide() with no key closes whatever is showing; hiding nothing changes nothing', () => {
    const one = reduceToast(start, { type: 'show', host: 'root', options: erased });
    expect(reduceToast(one.state, { type: 'hide' }).state.current).toBeNull();
    expect(reduceToast(start, { type: 'hide' }).state).toBe(start);
  });
});

describe('the store every ToastHost shares', () => {
  const store = createToastStore<O>();
  afterEach(() => store.reset());

  it('the replaced toast hears it was dismissed (its Undo can no longer run); the new one does not', () => {
    const first = vi.fn();
    const second = vi.fn();
    store.show('tabs', { message: en.book.quietDay.removedToast, action: { label: en.common.undoButton }, onDismiss: first });
    store.show('root', { message: en.settings.delete.entryToast, action: { label: en.common.undoButton }, onDismiss: second });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(store.get()?.options.message).toBe(en.settings.delete.entryToast);
  });

  it('tells its hosts once per change, and not at all for a stale hide', () => {
    const heard = vi.fn();
    const off = store.subscribe(heard);
    const k1 = store.show('root', restored);
    store.show('root', erased);
    expect(heard).toHaveBeenCalledTimes(2);
    store.hide(k1);
    expect(heard).toHaveBeenCalledTimes(2);
    store.hide();
    expect(heard).toHaveBeenCalledTimes(3);
    off();
  });

  it('after a restore, the erase toast leaves no restore toast anywhere (S38)', () => {
    store.show('root', { message: en.settings.delete.restoredToast });
    store.show('root', { message: en.settings.delete.erasedToast });
    expect(store.get()?.options.message).toBe(en.settings.delete.erasedToast);
    expect(store.get()?.options.message).not.toBe(en.settings.delete.restoredToast);
  });
});
