import { describe, expect, it } from 'vitest';
import { CRASH_REPORTING, errorTrackingOptions, KNOWN_ERROR_CLASSES, reduceExceptionEvent } from '../src';

/** Fictional family only (the Asha rule). Every string here is invented. */
const ID = '00000000-0000-4000-8000-0000000000aa';
const SDK_ALLOWED = ['$app_version', '$app_build', '$os_name', '$os_version', '$device_type', '$exception_level', '$exception_list', '$set'];

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

  it('drops a frame field that looks like contact details or a date, and the query on a file name', () => {
    const evt = {
      event: '$exception',
      properties: {
        $exception_list: [
          {
            type: 'TypeError',
            stacktrace: {
              frames: [
                { filename: 'https://example.com/asha/app.bundle?user=asha', function: 'asha.family@example.com', lineno: 4, colno: 2 },
                { filename: '2026-03-14.js', function: 'saveLetter', lineno: -1, colno: 1.5 },
              ],
            },
          },
        ],
      },
    };
    const out = reduceExceptionEvent(evt, SDK_ALLOWED)!;
    const frames = ((out.properties as Record<string, unknown>).$exception_list as { stacktrace: { frames: Record<string, unknown>[] } }[])[0].stacktrace.frames;
    expect(frames[0]).toEqual({ filename: 'app.bundle', lineno: 4, colno: 2 });
    expect(frames[1]).toEqual({ function: 'saveLetter' });
    expect(JSON.stringify(out)).not.toContain('asha');
  });

  it('returns null when there is no usable exception list, and never carries person properties', () => {
    expect(reduceExceptionEvent({ event: '$exception', properties: {} }, SDK_ALLOWED)).toBeNull();
    expect(reduceExceptionEvent({ event: '$exception', properties: { $exception_list: ['x', null] } }, SDK_ALLOWED)).toBeNull();
    const out = reduceExceptionEvent(exceptionEvent(new TypeError('x')), SDK_ALLOWED)!;
    expect(out).not.toHaveProperty('$set');
    expect((out.properties as Record<string, unknown>).$exception_level).toBe('error');
  });
});
