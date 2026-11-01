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
  stableLabels,
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
    expect(listen).toMatch(/const capturing = capturingNow\(\);[\s\S]{0,120}announcer\.settle\(\{ phase, capturing \}\)/);
    expect(listen).toMatch(/announcer\.clear\(\)/);
  });

  it('[Review B nit] Finish from paused drops a held "Paused." on the way to Review, even once capture stops', () => {
    const { spoken, a } = harness();
    a.say(en.tonight.states.paused, { phase: 'paused', capturing: true }, 'hold');
    a.settle({ phase: 'finishing', capturing: true });
    a.settle({ phase: 'finishing', capturing: false });
    a.settle({ phase: 'paused', capturing: false });
    expect(spoken).toEqual([]);
  });
});

/**
 * [Review A 1] No Listen element changes its accessibility label while a take is live (07 line 276, F04-REQ-041).
 * Node cannot render React Native, so this drives the exact function listen.tsx renders its labels from
 * (`stableLabels`) through a whole take, with the clock running, the "Still here." switch on metering, and pause and
 * resume; the source checks below pin that every label on screen comes from it.
 */
describe('[Review A 1] every label holds still from record() to stop', () => {
  const p = en.listen;
  const t = en.tonight.states;
  const clock = (ms: number) => `${Math.floor(ms / 60000)} min ${Math.floor(ms / 1000) % 60} s recorded`;
  type Step = { phase: ListenPhase; capturing: boolean; ms: number; quiet?: boolean };
  const lineFor = (s: Step) => (s.phase === 'asking' ? null : s.phase === 'paused' ? t.paused : s.quiet ? t.stillHere : t.listening);

  function run(steps: Step[]) {
    let prev: ReturnType<typeof stableLabels> | null = null;
    return steps.map((s) => {
      const next = stableLabels({ clock: clock(s.ms), line: lineFor(s), toggle: p.toggleA11y }, prev, maySpeak(s));
      prev = next;
      return { s, labels: next };
    });
  }

  it('from the first captured frame to the stop, no label changes; they catch up once capture stops', () => {
    const out = run([
      { phase: 'asking', capturing: false, ms: 0 },
      { phase: 'asking', capturing: true, ms: 0 }, // record() called, phase not yet live
      { phase: 'recording', capturing: true, ms: 50 },
      { phase: 'recording', capturing: true, ms: 9_000, quiet: true }, // "Still here." on screen
      { phase: 'recording', capturing: true, ms: 61_000 }, // a minute passes
      { phase: 'paused', capturing: true, ms: 61_050 }, // pause pressed, iOS still writing
      { phase: 'paused', capturing: false, ms: 61_050 }, // stopped: labels may move
      { phase: 'recording', capturing: true, ms: 61_100 }, // resume
      { phase: 'recording', capturing: true, ms: 75_000, quiet: true },
      { phase: 'finishing', capturing: true, ms: 75_000 },
    ]);
    const live = (i: number, j: number) => out.slice(i, j).map((o) => o.labels);
    // Take 1: from record() to the stop.
    const first = live(1, 6);
    // The line's Text appears with the take (no element had a label before); from then on all four frames are equal.
    expect(first[0].line).toBeNull();
    expect({ ...first[0], line: first[1].line }).toEqual(first[1]);
    expect(new Set(first.slice(1).map((l) => JSON.stringify(l))).size).toBe(1);
    expect(first[1]).toEqual({ clock: clock(0), line: t.listening, toggle: p.toggleA11y });
    // Once stopped they catch up: the time and "Paused." are true again.
    expect(out[6].labels).toEqual({ clock: clock(61_050), line: t.paused, toggle: p.toggleA11y });
    // Take 2: resume to the stop: nothing changes, not even "Paused." becoming "Listening.".
    const second = live(7, 10);
    expect(new Set(second.map((l) => JSON.stringify(l))).size).toBe(1);
    // The toggle has one label in every frame of the take, paused or not.
    expect(new Set(out.map((o) => o.labels.toggle))).toEqual(new Set([p.toggleA11y]));
  });

  it('the screen takes every label from stableLabels: the clock, Finish hint, the line and the toggle', () => {
    expect(listen).toMatch(/accessibilityLiveRegion=\{speakable \? 'polite' : 'none'\}/);
    expect(listen).toMatch(/const labels = stableLabels\(/);
    expect(listen).toMatch(/labelsRef\.current = labels;\s*const elapsedA11y = labels\.clock;/);
    expect(listen).toMatch(/accessibilityLabel=\{elapsedA11y\}/);
    expect(listen).toMatch(/accessibilityHint=\{elapsedA11y\}/);
    expect(listen).toMatch(/className="text-center" accessibilityLabel=\{labels\.line \?\? line\}>\s*\{line\}/);
    expect(listen).toMatch(/onPress=\{togglePause\}\s*label=\{phase === 'paused' \? t\.resumeButton : copy\.common\.pauseButton\}\s*accessibilityLabel=\{labels\.toggle\}/);
    expect(p.toggleA11y).toBe('Pause or keep talking');
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
    expect(listen).toMatch(/<MicPrimer childName=\{child\.name\} onContinue=\{continueAfterPrimer\} onType=\{typeInstead\} onClose=\{close\} \/>/);
    expect(listen).toMatch(/const continueAfterPrimer = \(\) => startFromTap\(true\);/);
    // A tap on the red circle or Try again never skips the primer (onPress passes an event, never `true`).
    expect(listen).toMatch(/const begin = \(\) => startFromTap\(false\);/);
  });

  it('[Review A 2] Continue and Type instead have equal weight, and VoiceOver starts on the heading', () => {
    const primer = listen.slice(listen.indexOf('function MicPrimer'));
    const cont = primer.match(/<Button ([^>]*)testID="listen\.primer\.continue" \/>/);
    const type = primer.match(/<Button ([^>]*)testID="listen\.primer\.type" \/>/);
    expect(cont).not.toBeNull();
    expect(type).not.toBeNull();
    const weight = (attrs: string) => attrs.match(/variant="(\w+)" size="(\w+)" fullWidth/)?.slice(1);
    expect(weight(cont![1])).toEqual(['secondary', 'lg']);
    expect(weight(type![1])).toEqual(weight(cont![1]));
    expect(primer).toMatch(/const heading = useRef<RNText>\(null\);\s*useFocusOnMount\(heading\);/);
    expect(primer).toMatch(/<Text ref=\{heading\} variant=\{STATE_LAYOUT\.title\} asHeading/);
  });

  it('the primer words come from packages/content, fill {child}, and make no storage claim', () => {
    const p = en.listen.primer;
    expect(Object.keys(p).sort()).toEqual(['body', 'continueButton', 'title']);
    expect(p.body).toContain('{child}');
    expect(p.body).toContain('{app}');
    for (const s of Object.values(p)) expect(s).not.toMatch(/stay|stored|kept|cloud|upload|backup|phone only/i);
    expect(listen).toMatch(/const pr = pendingCopy\.listen\.primer;/);
  });
});
