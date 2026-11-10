/// <reference types="node" />
/**
 * [NX-39-R50] native errors cross the bridge as closed codes (BL-862; SEC-ML-5).
 * Fixtures use the fictional family "Asha"; the canary values are made up (support/log-canary.ts).
 */
import { describe, expect, it } from 'vitest';
import { MediaNativeError, NATIVE_ERROR_CODES, toNativeErrorCode, type NativeErrorCode } from '../src/lib/media/native-error';
import { CANARY, nativeErrorWithCanary, stringify } from './support/log-canary';
import { scanCatches } from './support/media-scan';

const ENUM = new Set<string>(NATIVE_ERROR_CODES);

/** Thirty-odd things a bridge can throw, each carrying the canary somewhere text can sit. */
function shapes(): [string, unknown][] {
  const text = `${CANARY.path} ${CANARY.assetId} ${CANARY.instant} ${CANARY.city}`;
  return [
    ['NSError, photos domain, unknown code', nativeErrorWithCanary()],
    ['NSError, cancelled', nativeErrorWithCanary({ code: 3072 })],
    ['NSError, network access required', nativeErrorWithCanary({ code: 3164 })],
    ['NSError, access denied', nativeErrorWithCanary({ code: 3311 })],
    ['NSError, other domain', nativeErrorWithCanary({ domain: 'NSCocoaErrorDomain', code: 260 })],
    ['abort', nativeErrorWithCanary({ name: 'AbortError', code: undefined as never })],
    ['no space', nativeErrorWithCanary({ name: 'Error', code: 'ENOSPC', domain: undefined as never })],
    ['missing file', nativeErrorWithCanary({ name: 'Error', code: 'ENOENT', domain: undefined as never })],
    ['expo coded', nativeErrorWithCanary({ name: 'CodedError', code: 'ERR_NO_PERMISSIONS', domain: undefined as never })],
    ['plain Error', new Error(text)],
    ['TypeError', new TypeError(text)],
    ['Error with a cause only', new Error('x', { cause: new Error(text) })],
    ['string', text],
    ['number', 3072],
    ['null', null],
    ['undefined', undefined],
    ['array', [text]],
    ['object with text', { message: text, stack: text, code: text, name: text, domain: text }],
    ['code is the canary', Object.assign(new Error('x'), { code: CANARY.assetId })],
    ['name is the canary', Object.assign(new Error('x'), { name: CANARY.city })],
    ['message is a table key', new Error('ENOSPC')],
    ['code is __proto__', Object.assign(new Error('x'), { code: '__proto__' })],
    ['code is constructor', Object.assign(new Error('x'), { code: 'constructor' })],
    ['code is toString', Object.assign(new Error('x'), { code: 'toString' })],
    ['hostile message getter', Object.defineProperty(new Error('x'), 'message', { get() { throw new Error(text); } })],
    ['hostile stack getter', Object.defineProperty(new Error('x'), 'stack', { get() { throw new Error(text); } })],
    ['hostile cause getter', Object.defineProperty(new Error('x'), 'cause', { get() { throw new Error(text); } })],
    ['frozen', Object.freeze(nativeErrorWithCanary())],
    ['null prototype', Object.assign(Object.create(null), { code: text, name: text, message: text })],
    ['proxy', new Proxy(nativeErrorWithCanary(), {})],
    ['promise rejection reason object', { reason: text }],
    ['symbol', Symbol(text)],
    ['MediaNativeError already', new MediaNativeError('timeout')],
  ];
}

describe('[NX-39-R50] native errors cross the bridge as closed codes', () => {
  it('has a closed list, in snake_case, ending in unknown', () => {
    expect([...NATIVE_ERROR_CODES]).toEqual([
      'permission_denied', 'cancelled', 'icloud_unavailable', 'no_space', 'file_missing', 'decode_failed', 'transcode_failed', 'timeout', 'unavailable', 'unknown',
    ]);
    expect(Object.isFrozen(NATIVE_ERROR_CODES) || Array.isArray(NATIVE_ERROR_CODES)).toBe(true);
    for (const c of NATIVE_ERROR_CODES) expect(c).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });

  it('maps every thrown shape to a code on the list, and the code carries none of the canary', () => {
    const all = shapes();
    expect(all.length).toBeGreaterThanOrEqual(30);
    for (const [name, err] of all) {
      const code = toNativeErrorCode(err);
      expect(ENUM.has(code), name).toBe(true);
      for (const v of Object.values(CANARY)) expect(code, name).not.toContain(v);
    }
  });

  it('knows the codes it can know, and says unknown for the rest', () => {
    const code = (name: string) => toNativeErrorCode(shapes().find(([n]) => n === name)![1]);
    expect(code('NSError, cancelled')).toBe('cancelled');
    expect(code('NSError, network access required')).toBe('icloud_unavailable');
    expect(code('NSError, access denied')).toBe('permission_denied');
    expect(code('abort')).toBe('cancelled');
    expect(code('no space')).toBe('no_space');
    expect(code('missing file')).toBe('file_missing');
    expect(code('expo coded')).toBe('permission_denied');
    for (const n of ['NSError, photos domain, unknown code', 'NSError, other domain', 'plain Error', 'string', 'number', 'null', 'undefined']) expect(code(n), n).toBe('unknown');
  });

  it('never reads the message, the stack, userInfo or the cause: a text that looks like a code selects nothing', () => {
    for (const n of ['message is a table key', 'hostile message getter', 'hostile stack getter', 'hostile cause getter', 'code is __proto__', 'code is constructor', 'code is toString', 'code is the canary', 'name is the canary', 'null prototype', 'object with text']) {
      const err = shapes().find(([name]) => name === n)![1];
      expect(() => toNativeErrorCode(err), n).not.toThrow();
      expect(toNativeErrorCode(err), n).toBe('unknown');
    }
  });

  it('MediaNativeError carries the code as its whole message, no cause, and no extra property', () => {
    for (const [name, err] of shapes()) {
      const wrapped = new MediaNativeError(toNativeErrorCode(err));
      expect(ENUM.has(wrapped.message), name).toBe(true);
      expect(wrapped.cause, name).toBeUndefined();
      expect(Object.getOwnPropertyNames(wrapped).sort(), name).toEqual(['code', 'message', 'name', 'stack']);
      const dump = stringify(wrapped) + JSON.stringify(wrapped) + String(wrapped) + (wrapped.stack ?? '');
      for (const v of Object.values(CANARY)) expect(dump, name).not.toContain(v);
    }
    // Even a caller who forces text into the code cannot make the error carry it.
    const forced = new MediaNativeError(CANARY.city as unknown as NativeErrorCode);
    expect(forced.code).toBe('unknown');
    expect(forced.message).toBe('unknown');
  });

  it('is idempotent: an error already wrapped keeps its code', () => {
    for (const code of NATIVE_ERROR_CODES) expect(toNativeErrorCode(new MediaNativeError(code))).toBe(code);
  });

  it('the scanner fails a catch that uses the caught error any way but toNativeErrorCode(e)', () => {
    const ok = "try { await go(); } catch (e) { throw new MediaNativeError(toNativeErrorCode(e)); }";
    expect(scanCatches('x.ts', ok)).toEqual([]);
    expect(scanCatches('x.ts', "p.catch((e) => { throw new MediaNativeError(toNativeErrorCode(e)); });")).toEqual([]);
    for (const bad of [
      "try { go(); } catch (e) { console.warn(e); }",
      "try { go(); } catch (e) { throw e; }",
      "try { go(); } catch (e) { log(`${(e as Error).message}`); }",
      "try { go(); } catch (e) { return String(e); }",
      "try { go(); } catch (e) { report(toNativeErrorCode(e), e); }",
      "try { go(); } catch ({ message }) { return message; }",
      "p.catch((e) => console.log(e));",
      "p.catch((e) => toNativeErrorCode(e) + String(e));",
    ]) {
      expect(scanCatches('x.ts', bad).map((f) => f.rule), bad).toContain('catch-leak');
    }
    // A catch that ignores the error is fine, so is a bare `catch {}`.
    expect(scanCatches('x.ts', 'try { go(); } catch { return null; }')).toEqual([]);
    expect(scanCatches('x.ts', 'try { go(); } catch (_e) { return null; }')).toEqual([]);
  });
});
