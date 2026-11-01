/// <reference types="node" />
/**
 * VoiceOver never speaks into a recording (RT-REC-09; SR-C-02: F04-REQ-040, F04-REQ-041, B2-21 never waived) and the
 * microphone primer comes before the iOS question (RT-REC-01; SR-C-05: F04-REQ-034, F04-REQ-047).
 *
 * The gate and the permission step are pure (components/capture/listen.logic.ts) and run here; Node cannot load React
 * Native, so the screen's use of them is checked in its source. What only a phone can prove is device run VO-REC on
 * the SE 3 (B2-21) and S1-10. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import {
  createListenAnnouncer,
  maySpeak,
  permissionStep,
  type ListenPhase,
  type SpeakState,
  type WhenCapturing,
} from '../src/components/capture/listen.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = code(src('app/listen.tsx'));

const PHASES: ListenPhase[] = ['ready', 'asking', 'recording', 'paused', 'finishing', 'denied', 'busy', 'full', 'primer'];
const MODES: WhenCapturing[] = ['drop', 'hold'];

/** Every state in which a take is recording: the recording moment, and any moment while the recorder captures. */
const RECORDING_STATES: SpeakState[] = [
  { phase: 'recording', capturing: true },
  { phase: 'recording', capturing: false }, // the phase says live even if the poll lags
  ...PHASES.map((phase) => ({ phase, capturing: true })),
];

function harness() {
  const spoken: string[] = [];
  return { spoken, a: createListenAnnouncer((m) => void spoken.push(m)) };
}

describe('RT-REC-09: no announcement is emitted while a take is recording (SR-C-02, B2-21)', () => {
  it('maySpeak is false in every recording state, and true only once nothing is capturing', () => {
    for (const s of RECORDING_STATES) expect(maySpeak(s), JSON.stringify(s)).toBe(false);
    for (const phase of PHASES.filter((p) => p !== 'recording')) expect(maySpeak({ phase, capturing: false }), phase).toBe(true);
  });

  it('say, in any recording state and either mode, emits nothing; settle in a recording state emits nothing', () => {
    for (const s of RECORDING_STATES) {
      for (const mode of MODES) {
        const { spoken, a } = harness();
        a.say('Listening.', s, mode);
        a.say('1 min 0 s recorded', s, mode);
        a.settle(s);
        a.settle(s);
        expect(spoken, `${JSON.stringify(s)} ${mode}`).toEqual([]);
      }
    }
  });

  it('a whole take: start, minutes, pause still capturing, resume, pause, stop: speech only after capture stops', () => {
    const { spoken, a } = harness();
    const live = { phase: 'recording', capturing: true } as const;
    a.say(en.tonight.states.listening, live); // the take started
    a.say('1 min 0 s recorded', live); // a minute went by
    a.settle(live);
    // Pause: iOS can still be writing for a moment, so "Paused." waits.
    a.say(en.tonight.states.paused, { phase: 'paused', capturing: true }, 'hold');
    a.settle({ phase: 'paused', capturing: true });
    expect(spoken).toEqual([]);
    // Resumed before capture stopped: the held line is out of date and is never spoken.
    a.settle({ phase: 'recording', capturing: true });
    a.settle({ phase: 'paused', capturing: false });
    expect(spoken).toEqual([]);
    a.say(en.tonight.states.listening, live);
    // Pause again; this time the recorder stops capturing, then the line is spoken, once.
    a.say(en.tonight.states.paused, { phase: 'paused', capturing: true }, 'hold');
    a.settle({ phase: 'paused', capturing: false });
    a.settle({ phase: 'paused', capturing: false });
    expect(spoken).toEqual([en.tonight.states.paused]);
  });

  it('a held line is never spoken after the screen clears it, and dropped lines never come back', () => {
    const { spoken, a } = harness();
    a.say(en.tonight.states.paused, { phase: 'paused', capturing: true }, 'hold');
    a.clear();
    a.settle({ phase: 'finishing', capturing: false });
    a.say('dropped', { phase: 'recording', capturing: true }, 'drop');
    a.settle({ phase: 'ready', capturing: false });
    expect(spoken).toEqual([]);
  });

  it('listen.tsx never calls AccessibilityInfo or announce itself: every line goes through the gate', () => {
    expect(listen).not.toMatch(/announceForAccessibility/);
    // The one call to lib/a11y's announce is the gate's own speaker.
    expect(listen.match(/\bannounce\(/g)).toHaveLength(1);
    expect(listen).toMatch(/createListenAnnouncer\(\(m\) => announce\(m\)\)/);
    // The gate is told the truth: the phase and the native recorder's own capture state.
    expect(listen).toMatch(/recorder\.isRecording/);
    // Pause holds "Paused." for the stop; the room settles the gate on every recorder status.
    expect(listen).toMatch(/say\(t\.paused, \{ phase: 'paused', capturing: capturingNow\(\) \}, 'hold'\)/);
    expect(listen).toMatch(/announcer\.settle\(\{ phase, capturing: capturingNow\(\) \}\)/);
    expect(listen).toMatch(/announcer\.clear\(\)/);
  });

  it('nothing on Listen changes what VoiceOver reads while capturing: the live region is off and the elapsed label holds still', () => {
    expect(listen).toMatch(/accessibilityLiveRegion=\{speakable \? 'polite' : 'none'\}/);
    // The clock's label and Finish's hint use the time at the last stop, not the running time (F04-REQ-041).
    expect(listen).toMatch(/if \(speakable\) heardMs\.current = status\.durationMillis;/);
    expect(listen).toMatch(/minutes: Math\.floor\(heardMs\.current \/ 60000\)/);
  });
});

describe('RT-REC-01: our primer first, then the iOS question (SR-C-05, F04-REQ-034, F04-REQ-047)', () => {
  it('the first start while iOS has not asked shows the primer and asks nothing', () => {
    expect(permissionStep({ granted: false, status: 'undetermined' }, false)).toBe('primer');
  });

  it('Continue on the primer asks iOS; an earlier answer never shows the primer again', () => {
    expect(permissionStep({ granted: false, status: 'undetermined' }, true)).toBe('ask');
    expect(permissionStep({ granted: false, status: 'denied' }, false)).toBe('ask');
    expect(permissionStep({ granted: true, status: 'granted' }, false)).toBe('go');
    expect(permissionStep({ granted: true }, true)).toBe('go');
  });

  it('the screen asks iOS only after the primer step says so, and the primer is its own screen', () => {
    const start = listen.slice(listen.indexOf('const start = async'), listen.indexOf('const grantedNow'));
    expect(start).toMatch(/permissionStep\(current, primed\)/);
    expect(start.indexOf("setPhase('primer')")).toBeGreaterThan(-1);
    expect(start.indexOf("setPhase('primer')")).toBeLessThan(start.indexOf('requestRecordingPermissionsAsync()'));
    expect(start).toMatch(/step === 'ask' \? await requestRecordingPermissionsAsync\(\)/);
    expect(listen).toMatch(/if \(phase === 'primer'\) \{/);
    expect(listen).toMatch(/onPress: continueAfterPrimer, testID: 'listen\.primer\.continue'/);
    expect(listen).toMatch(/const continueAfterPrimer = \(\) => startFromTap\(true\);/);
    // A tap on the red circle or Try again never skips the primer (onPress passes an event, never `true`).
    expect(listen).toMatch(/const begin = \(\) => startFromTap\(false\);/);
    expect(listen).toMatch(/testID: 'listen\.primer\.type'/);
  });

  it('the primer words come from packages/content, fill {child}, and make no storage claim', () => {
    const p = en.listen.primer;
    expect(Object.keys(p).sort()).toEqual(['body', 'continueButton', 'title']);
    expect(p.body).toContain('{child}');
    expect(p.body).toContain('{app}');
    for (const s of Object.values(p)) expect(s).not.toMatch(/stay|stored|kept|cloud|upload|backup|phone only/i);
    expect(listen).toMatch(/const pr = p\.primer;/);
  });
});
