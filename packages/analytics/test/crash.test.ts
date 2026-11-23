import { describe, expect, it } from 'vitest';
import { ALLOWED_SDK_PROPERTIES, APP_BUNDLE_FILES, CRASH_REPORTING, errorTrackingOptions, KNOWN_ERROR_CLASSES, reduceExceptionEvent } from '../src';

/** Fictional family only (the Asha rule). Every string here is invented. */
const ID = '00000000-0000-4000-8000-0000000000aa';
/** The caller passes the ten V6 keys, never a wider list (Review B note 2 on #1232). */
const SDK_ALLOWED = ALLOWED_SDK_PROPERTIES;

const exceptionEvent = (err: Error) => ({
  event: '$exception',
  uuid: '0190a000-0000-7000-8000-000000000000',
  $set: { name: 'Asha' },
  properties: {
    distinct_id: ID,
    $app_version: '1.0.0',
    $app_build: '12',
    $os_name: 'iOS',
    $os_version: '26.0',
    $device_type: 'Mobile',
    $device_name: "Asha's iPhone",
    $locale: 'en-US',
    $exception_level: 'error',
    $exception_message: err.message,
    $exception_values: [err.message],
    $exception_steps: [{ message: err.message }],
    // Properties a caller attached to captureException():
    child_name: 'Asha',
    note: 'first steps on 2025-03-04',
    $exception_list: [
      {
        type: err.name,
        value: err.message,
        mechanism: { handled: false, type: 'onerror', synthetic: false },
        stacktrace: {
          type: 'raw',
          frames: (err.stack ?? '')
            .split('\n')
            .slice(1, 4)
            .map((l, i) => ({ platform: 'hermes', filename: '/var/containers/Bundle/Application/7B1F2C3D-0000-4000-8000-00000000AAAA/app.bundle', abs_path: `/Users/asha.parent/dev/${l.trim()}`, function: `saveLetter${i}`, lineno: 10 + i, colno: 3, in_app: true, context_line: err.message, vars: { name: 'Asha' } })),
        },
      },
    ],
  },
});

describe('crash capture: built, off, and one flip from on', () => {
  it('is off, and the SDK option says exception autocapture off', () => {
    expect(CRASH_REPORTING.enabled).toBe(false);
    expect(errorTrackingOptions()).toEqual({ autocapture: false, exceptionSteps: { enabled: false } });
  });

  it('on, it asks for uncaught exceptions and unhandled rejections only: no console, no native crashes', () => {
    expect(errorTrackingOptions(true)).toEqual({
      autocapture: { uncaughtExceptions: true, unhandledRejections: true, console: [], nativeCrashes: false },
      exceptionSteps: { enabled: false },
    });
  });

  it('a thrown Error holding a date and a name leaves the reducer with neither', () => {
    let err: Error;
    try {
      throw new Error('Could not save the letter Asha wrote on 2025-03-04 (born 04/03/2025)');
    } catch (e) {
      err = e as Error;
    }
    err.name = 'AshaError';
    const out = reduceExceptionEvent(exceptionEvent(err), SDK_ALLOWED)!;
    expect(out).not.toBeNull();
    const wire = JSON.stringify(out);
    for (const leak of ['Asha', '2025-03-04', '04/03/2025', 'asha.parent', 'Could not save', 'first steps', 'child_name', '7B1F2C3D', '$set', 'context_line', 'abs_path']) {
      expect(wire, leak).not.toContain(leak);
    }
    const props = out.properties as Record<string, unknown>;
    expect(Object.keys(props).sort()).toEqual(['$app_build', '$app_version', '$device_type', '$exception_level', '$exception_list', '$os_name', '$os_version', 'distinct_id']);
    expect(SDK_ALLOWED).toHaveLength(10);
    const list = props.$exception_list as { type: string; value?: string; stacktrace: { frames: Record<string, unknown>[] } }[];
    expect(list[0].type).toBe('Error'); // an unknown class name is reported as the plain class
    expect(list[0]).not.toHaveProperty('value');
    expect(list[0].stacktrace.frames.length).toBeGreaterThan(0);
    for (const f of list[0].stacktrace.frames) {
      expect(Object.keys(f).sort()).toEqual(['colno', 'filename', 'function', 'in_app', 'lineno', 'platform']);
      expect(f.filename).toBe('app.bundle');
    }
  });

  it('keeps every built-in class name', () => {
    for (const name of KNOWN_ERROR_CLASSES) {
      const e = new Error('x');
      e.name = name;
      const out = reduceExceptionEvent(exceptionEvent(e), SDK_ALLOWED)!;
      expect(((out.properties as Record<string, unknown>).$exception_list as { type: string }[])[0].type).toBe(name);
    }
  });

  it('drops a frame from any file but our bundle, and a frame that is not in_app', () => {
    const frames = [
      { filename: 'https://example.com/asha/app.bundle?user=asha', function: 'saveLetter', lineno: 4, colno: 2, in_app: true },
      { filename: '2026-03-14.js', function: 'saveLetter', lineno: 1, colno: 1, in_app: true },
      { filename: 'asha-first-words.m4a', function: 'saveLetter', lineno: 1, colno: 1, in_app: true },
      { filename: 'Asha.tsx', function: 'saveLetter', lineno: 1, colno: 1, in_app: true },
      { filename: '/Users/asha.parent/Documents/photo.heic', function: 'saveLetter', lineno: 1, colno: 1, in_app: true },
      { filename: 'node_modules/react-native/index.js', function: 'render', lineno: 1, colno: 1, in_app: false },
      { filename: 'app.bundle', function: 'fromLibrary', lineno: 2, colno: 2, in_app: false },
      { filename: 'app.bundle', function: 'noFlag', lineno: 3, colno: 3 },
      { function: '[native code]', in_app: true },
      'x',
      null,
    ];
    const out = reduceExceptionEvent({ event: '$exception', properties: { $exception_list: [{ type: 'TypeError', stacktrace: { frames } }] } }, SDK_ALLOWED)!;
    const kept = ((out.properties as Record<string, unknown>).$exception_list as { stacktrace: { frames: Record<string, unknown>[] } }[])[0].stacktrace.frames;
    expect(kept).toEqual([{ filename: 'app.bundle', function: 'saveLetter', lineno: 4, colno: 2, in_app: true }]);
    expect(APP_BUNDLE_FILES).toContain('app.bundle');
    const wire = JSON.stringify(out);
    for (const leak of ['asha', 'Asha', 'm4a', 'heic', '2026-03-14', 'example.com', 'fromLibrary', 'noFlag']) expect(wire, leak).not.toContain(leak);
  });

  const frameOf = (fn: unknown) => ({ filename: 'app.bundle', function: fn, lineno: 1, colno: 1, in_app: true });
  const keptFunctions = (names: unknown[]) => {
    const evt = { event: '$exception', properties: { $exception_list: [{ type: 'Error', stacktrace: { frames: names.map(frameOf) } }] } };
    const out = reduceExceptionEvent(evt, SDK_ALLOWED)!;
    const frames = ((out.properties as Record<string, unknown>).$exception_list as { stacktrace: { frames: Record<string, unknown>[] } }[])[0].stacktrace.frames;
    return frames.map((f) => f.function);
  };

  it('keeps a function name only if it fits the closed shape, and keeps the frame without it otherwise', () => {
    expect(keptFunctions(['saveLetter', 'Screen.onPress', 'a.b.c', '<anonymous>', 'render', 'record_voice_take', '$lambda'])).toEqual(['saveLetter', 'Screen.onPress', 'a.b.c', '<anonymous>', 'render', 'record_voice_take', '$lambda']);
    const dropped = [
      'first steps today', // spaces
      'Asha', 'Ashi', 'asha', // one short word: how a first name looks
      'asha.family@example.com', 'ashas_iPhone', "Asha's", '@asha_mum', // PII shapes
      'asha-first-words.m4a', 'record.wav', 'photo.HEIC', // audio and image extensions
      'march_4_2025', 'Asha_birthday_march_4', // written dates
      'a.b.c.d', 'x'.repeat(61), 'save/Letter', 'save(letter)', 'save[0]', '', 42, null, {}, // outside the shape
      'asha.dev', 'phc_AbCdEf0123456789', // bare host, vendor key
    ];
    expect(keptFunctions(dropped).every((f) => f === undefined)).toBe(true);
  });

  it('says plainly what a shape cannot see: an identifier that holds a name passes, because it is code we wrote in our own bundle', () => {
    // Not a defence, a pin: a name inside a longer identifier cannot be told from code. The protection is that the
    // frame must be in_app and in our bundle (above), so the name comes from our source, never from what a person typed.
    expect(keptFunctions(['saveAshaLetter', 'handleAshaEntry'])).toEqual(['saveAshaLetter', 'handleAshaEntry']);
  });

  it('drops a kept $ value that is PII-shaped or not a scalar, even if the caller listed the key', () => {
    const evt = {
      event: '$exception',
      properties: {
        distinct_id: ID,
        $app_version: '1.0.10',
        $device_name: "Asha's iPhone",
        $current_url: 'https://example.com/asha',
        $screen_name: { route: 'letter' },
        $os_name: 'asha.family@example.com',
        $device_type: 'Mobile',
        $exception_list: [{ type: 'Error', stacktrace: { frames: [frameOf('saveLetter')] } }],
      },
    };
    const wide = [...SDK_ALLOWED, '$device_name', '$current_url', '$screen_name'];
    const out = reduceExceptionEvent(evt, wide)!;
    const props = out.properties as Record<string, unknown>;
    expect(props.$app_version).toBe('1.0.10'); // a build number is not a date
    expect(props.$device_type).toBe('Mobile');
    expect(props).not.toHaveProperty('$os_name');
    expect(props).not.toHaveProperty('$current_url');
    expect(props).not.toHaveProperty('$screen_name');
    expect(JSON.stringify(out)).not.toContain('Asha');
  });

  it('drops the event when distinct_id is not the random consent id', () => {
    for (const bad of ['Asha', 'asha.family@example.com', '', 7]) {
      const evt = exceptionEvent(new TypeError('x'));
      (evt.properties as Record<string, unknown>).distinct_id = bad;
      expect(reduceExceptionEvent(evt, SDK_ALLOWED), String(bad)).toBeNull();
    }
  });

  it('returns null when there is no usable exception list, and never carries person properties', () => {
    expect(reduceExceptionEvent({ event: '$exception', properties: {} }, SDK_ALLOWED)).toBeNull();
    expect(reduceExceptionEvent({ event: '$exception', properties: { $exception_list: ['x', null] } }, SDK_ALLOWED)).toBeNull();
    const out = reduceExceptionEvent(exceptionEvent(new TypeError('x')), SDK_ALLOWED)!;
    expect(out).not.toHaveProperty('$set');
    expect((out.properties as Record<string, unknown>).$exception_level).toBe('error');
  });
});
