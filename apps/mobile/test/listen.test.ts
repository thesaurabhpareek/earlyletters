/// <reference types="node" />
/**
 * Listen (EXPERIENCE_PASS_2026-10 S11, S12, S13 and section 5.8 rows 1 to 4, package P4). The pure parts
 * (components/capture/listen.logic.ts and mic-state.logic.ts) run here; Node cannot load React Native, so the
 * screen's use of them is checked in its source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en, PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  afterForeground,
  elapsedClock,
  isMicProblem,
  listenRoom,
  promptLine,
  reviewParams,
  startBlocker,
  startFailure,
  type MicProblem,
  type RoomPhase,
} from '../src/components/capture/listen.logic';
import { MIC_ERROR_CODE, micStateView } from '../src/components/capture/mic-state.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = src('app/listen.tsx');

describe('three causes, three screens (S13)', () => {
  it('a start failure with permission granted is "busy", never "denied"', () => {
    expect(startFailure({ takeBegun: false, granted: true })).toBe('busy');
  });

  it('only a refused permission is "denied"; an unknown permission is busy (Try again can help, Settings may not)', () => {
    expect(startFailure({ takeBegun: false, granted: false })).toBe('denied');
    expect(startFailure({ takeBegun: false, granted: null })).toBe('busy');
  });

  it('a take that already began ends as an interruption and is kept, whatever the permission', () => {
    for (const granted of [true, false, null]) expect(startFailure({ takeBegun: true, granted })).toBe('interrupted');
  });

  it('before the microphone goes live: permission off first, then a full phone, else go', () => {
    expect(startBlocker({ granted: false, freeBytes: 10 })).toBe('denied');
    expect(startBlocker({ granted: false, freeBytes: 9e9 })).toBe('denied');
    expect(startBlocker({ granted: true, freeBytes: 49_999_999 })).toBe('full');
    expect(startBlocker({ granted: true, freeBytes: 50_000_000 })).toBeNull();
    expect(startBlocker({ granted: true, freeBytes: null })).toBeNull();
  });

  it('back in front with the microphone now on, "off" gives way to idle Listening; nothing else changes', () => {
    expect(afterForeground('denied', true)).toBe('ready');
    expect(afterForeground('denied', false)).toBe('denied');
    for (const p of ['busy', 'full', 'recording', 'paused', 'ready'] as const) expect(afterForeground(p, true)).toBe(p);
  });

  it('three different titles, none says "we", and each has one primary and one quiet way on', () => {
    const views = (['denied', 'busy', 'full'] as MicProblem[]).map((k) => micStateView(k));
    expect(new Set(views.map((v) => v.title)).size).toBe(3);
    for (const v of views) {
      expect(`${v.title} ${v.body}`).not.toMatch(/\bwe\b|\bour\b|\bus\b/i);
      expect(v.primary.action).not.toBe(v.quiet.action);
    }
  });

  it('the words and the order of the doors, from packages/content', () => {
    const e = en.errors;
    expect(micStateView('denied')).toEqual({
      glyph: 'microphoneSlash',
      title: e.micDenied.title,
      body: e.micDenied.body,
      primary: { action: 'type', label: e.micDenied.typeButton },
      quiet: { action: 'settings', label: e.micDenied.settingsButton },
    });
    expect(micStateView('busy')).toEqual({
      glyph: 'microphoneSlash',
      title: e.micBusy.title,
      body: e.micBusy.body,
      primary: { action: 'tryAgain', label: en.common.tryAgainButton },
      quiet: { action: 'type', label: e.micDenied.typeButton },
    });
    expect(micStateView('full')).toEqual({
      glyph: 'warningCircle',
      title: e.phoneFull.title,
      body: e.phoneFull.body,
      primary: { action: 'type', label: e.micDenied.typeButton },
      quiet: { action: 'tryAgain', label: en.common.tryAgainButton },
    });
  });

  it('"The microphone is off" only for a microphone that is off (the held words are switched with this screen)', () => {
    expect(en.errors.micDenied.title).toBe('The microphone is off');
    expect(micStateView('busy').title).not.toBe(en.errors.micDenied.title);
    expect(micStateView('full').title).not.toBe(en.errors.micDenied.title);
  });

  it('state titles carry no full stop (P0 rule)', () => {
    for (const k of ['denied', 'busy', 'full'] as MicProblem[]) expect(micStateView(k).title).not.toMatch(/\.$/);
  });

  it('counts a shown state by a code from the catalog only, and a busy microphone counts nothing rather than a wrong code', () => {
    expect(MIC_ERROR_CODE).toEqual({ denied: 'mic_denied', busy: null, full: 'storage_low' });
  });

  it('isMicProblem names exactly the three', () => {
    expect((['denied', 'busy', 'full', 'ready', 'asking', 'recording', 'paused', 'finishing'] as const).filter(isMicProblem)).toEqual(['denied', 'busy', 'full']);
  });
});

describe('one room, five moments (S11, S12)', () => {
  const all: RoomPhase[] = ['ready', 'asking', 'recording', 'paused', 'finishing'];

  it('ready: the red circle at rest is the start control, no aura, no clock, the hint, Close', () => {
    expect(listenRoom('ready')).toEqual({ close: true, startControl: true, aura: 'ready', clock: false, line: 'readyHint', controls: false, discard: false });
  });

  it('asking: the same room while iOS asks and the take starts, with no second start control and no Close', () => {
    expect(listenRoom('asking')).toMatchObject({ close: false, startControl: false, aura: 'ready', clock: false, controls: false });
  });

  it('[review B L2] the hint "Tap the red circle and talk." shows only when the circle can be tapped', () => {
    expect(listenRoom('asking').line).toBe('none');
    expect(all.filter((p) => listenRoom(p).line === 'readyHint')).toEqual(['ready']);
    for (const p of all) expect(listenRoom(p).line === 'readyHint', p).toBe(listenRoom(p).startControl);
  });

  it('[review A L2] Close only at rest, so no take can begin behind a closed screen', () => {
    expect(all.filter((p) => listenRoom(p).close)).toEqual(['ready']);
  });

  it('recording, paused and finishing: the aura follows the take, the clock shows, no Close', () => {
    expect(listenRoom('recording')).toMatchObject({ close: false, aura: 'listening', clock: true, line: 'listening', controls: true, discard: true });
    expect(listenRoom('paused')).toMatchObject({ close: false, aura: 'paused', clock: true, line: 'paused', controls: true, discard: true });
    expect(listenRoom('finishing')).toMatchObject({ close: false, aura: 'processing', clock: true, controls: false });
  });

  it('only one moment offers the circle as a start: the microphone is untouched until it is tapped (S12)', () => {
    expect(all.filter((p) => listenRoom(p).startControl)).toEqual(['ready']);
  });

  it('the clock rounds down, so it never runs ahead of the take', () => {
    expect(elapsedClock(0)).toBe('0:00');
    expect(elapsedClock(999)).toBe('0:00');
    expect(elapsedClock(42_900)).toBe('0:42');
    expect(elapsedClock(65_000)).toBe('1:05');
    expect(elapsedClock(-5)).toBe('0:00');
    expect(elapsedClock(Number.NaN)).toBe('0:00');
  });

  it('the prompt shows only when the take started from one that exists (S11)', () => {
    const p = PROMPTS[0];
    expect(promptLine(p.key, PROMPTS)).toBe(p.text);
    expect(promptLine(null, PROMPTS)).toBeNull();
    expect(promptLine(undefined, PROMPTS)).toBeNull();
    expect(promptLine('', PROMPTS)).toBeNull();
    expect(promptLine('not-a-prompt', PROMPTS)).toBeNull();
  });

  it('the idle breath is 7.5 s, from the token (8 breaths a minute, under 0.2 Hz)', () => {
    expect(tokens.motion.breathIdleMs).toBe(7500);
    expect(1000 / tokens.motion.breathIdleMs).toBeLessThan(0.2);
    const aura = src('components/capture/listening-aura.tsx');
    expect(aura).toMatch(/const BREATH_MS = tokens\.motion\.breathIdleMs/);
    expect(aura).toMatch(/const B = tokens\.motion\.breath/);
  });

  it('the aura has a ready look with no glow and no ring (S12)', () => {
    const aura = code(src('components/capture/listening-aura.tsx'));
    expect(aura).toMatch(/'ready' \| 'idle' \| 'listening' \| 'paused' \| 'processing'/);
    expect(aura).toMatch(/state === 'ready' \? null : reduced \?/);
  });
});

describe('why a take stopped, for Review (S14)', () => {
  it('leaving the app and a call or an alert are passed on; Finish and Close are not', () => {
    expect(reviewParams('d1', 'background')).toEqual({ draftId: 'd1', stopped: 'background' });
    expect(reviewParams('d1', 'interruption')).toEqual({ draftId: 'd1', stopped: 'interruption' });
    expect(reviewParams('d1', 'user')).toEqual({ draftId: 'd1' });
    expect(reviewParams('d1', 'dismiss')).toEqual({ draftId: 'd1' });
  });
});

describe('the screen uses them (source)', () => {
  const c = code(listen);

  it('S13: begin() names a failed start through startFailure, not a blanket "denied"', () => {
    expect(c).toMatch(/startFailure\(\{ takeBegun: takeId\.current !== null, granted: await grantedNow\(\) \}\)/);
    expect(c).not.toMatch(/else setPhase\('denied'\)/);
  });

  it('S13: Settings is the quiet door for "off"; "Type instead" opens Write with the same prompt (5.8 row 3)', () => {
    expect(c).toMatch(/settings: \(\) => void Linking\.openSettings\(\)/);
    expect(c).toMatch(/router\.replace\(\{ pathname: '\/write', params: promptKey \? \{ promptKey \} : \{\} \}\)/);
  });

  it('S13: back in front from Settings with the microphone on lands on idle Listening', () => {
    expect(c).toMatch(/next === 'active' && phaseRef\.current === 'denied'/);
    expect(c).toMatch(/afterForeground\(now, true\)/);
  });

  it('S12: the start control is the circle, named "Start recording", and nothing records before it is tapped', () => {
    expect(c).toMatch(/accessibilityLabel=\{p\.ready\.startA11y\}/);
    expect(en.listen.ready.startA11y).toBe('Start recording');
    expect(c).toMatch(/onPress=\{begin\}/);
    // Opened without a tap, the first phase is ready and nothing calls begin().
    expect(c).toMatch(/useState<ListenPhase>\(tapped\.current \? 'asking' : 'ready'\)/);
    expect(c).toMatch(/if \(tapped\.current\) begin\(\)/);
    // The old error-style page is gone.
    expect(c).not.toMatch(/r\.startButton|ready\.title|ready\.body|art="envelope"/);
  });

  it('S11: the clock is headline, textMuted, tabular figures, with no 1.75x scale', () => {
    expect(c).toMatch(/<Text variant="headline" tone="muted"[^>]*fontVariant: \['tabular-nums'\]/);
    expect(c).not.toMatch(/scale=\{1\.75\}/);
  });

  it('S11: the prompt is the literary line in `prompt`, textMuted, at most 3 lines; whole at accessibility sizes (P4 critics S5)', () => {
    expect(c).toMatch(/<Text variant="prompt" tone="muted" numberOfLines=\{large \? undefined : 3\}/);
    expect(c).toMatch(/const large = useIsAccessibilitySize\(\);/);
  });

  it('5.8 rows 1 and 2: Listen is an unlit room (the light underneath leaves and returns)', () => {
    expect(c).toMatch(/\buseUnlitRoom\(\);/);
    expect(c).not.toMatch(/<Lamp/);
  });

  it('5.8 row 2: the warning haptic plays only once Let it go is confirmed, after the session stops (iOS mutes it while recording)', () => {
    const discard = c.slice(c.indexOf('const discard = () =>'), c.indexOf('const typeInstead'));
    expect(discard.indexOf("haptic('warning')")).toBeGreaterThan(discard.indexOf("style: 'destructive'"));
    expect(discard.indexOf("haptic('warning')")).toBeGreaterThan(discard.indexOf('await abandonTake(recorder, id)'));
    expect(discard.indexOf("haptic('warning')")).toBeGreaterThan(discard.indexOf("await setAudioMode('idle')"));
  });

  it('[review A L2] a take that finishes starting after the screen has gone is kept, as any other exit', () => {
    const start = c.slice(c.indexOf('const start = async'), c.indexOf('const grantedNow'));
    expect(start).toMatch(/if \(!mounted\.current\) \{\s*ended\.current = true;\s*void finalizeTake\(recorder, draft\.id, 'dismiss', 0\);\s*return;\s*\}/);
    expect(start.indexOf('if (!mounted.current)')).toBeLessThan(start.indexOf('takeId.current = draft.id'));
  });

  it('5.8 rule 3: Pause and Finish are on screen in every moment of the room; Let it go keeps its slot', () => {
    expect(c).toMatch(/disabled=\{!room\.controls\}/);
  });

  it('[review B L3] the kept slots hold the very control, invisible and inert, so nothing moves at any text size', () => {
    // Let it go: the same quiet Button (48 pt at the default size, taller at large sizes), not a fixed 44 pt box.
    expect(c).toMatch(/<View style=\{\{ opacity: 0 \}\} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="listen\.discardSlot">\s*<Button variant="quiet" disabled className="self-center">/);
    expect(c).not.toMatch(/height: tokens\.target\.min/);
    // The header: the same ModalHeader, invisible and inert, when Close is not offered.
    expect(c).toMatch(/testID="listen\.headerSlot">\s*<ModalHeader onClose=\{close\} closeDisabled \/>/);
  });

  it('[review B B1] at accessibility sizes the room scrolls and Pause, Finish and Let it go stay pinned below it', () => {
    const room = c.slice(c.indexOf('testID="listen.room"'), c.indexOf('</ScrollView>'));
    expect(c).toMatch(/<ScrollView className="flex-1" contentContainerStyle=\{\{ flexGrow: 1 \}\}[^>]*testID="listen\.room">/);
    // Inside the scroll: the audience block, the prompt, the circle, the hint, and the clock and line at default sizes.
    for (const part of ['p.toChild', 'testID="listen.prompt"', '<ListeningAura', '{!large && clockAndLine}', 't.listeningHint']) expect(room, part).toContain(part);
    // After it, outside the scroll: the controls.
    const after = c.slice(c.indexOf('</ScrollView>'));
    for (const part of ['onPress={togglePause}', 'onPress={finish}', 'onPress={discard}']) expect(after, part).toContain(part);
  });

  it('[P4 critics S5] at accessibility sizes the clock and "Listening." are pinned with Pause and Finish, so the screen always says it is recording', () => {
    const block = c.slice(c.indexOf('const clockAndLine = ('), c.indexOf('return (', c.indexOf('const clockAndLine = (')));
    // The line is a live region whenever VoiceOver may speak; while a take captures it is off (SR-C-02, listen-voiceover.test.ts).
    for (const part of ['elapsedClock(status.durationMillis)', 'accessibilityLabel={elapsedA11y}', '{line}', "accessibilityLiveRegion={speakable ? 'polite' : 'none'}"]) expect(block, part).toContain(part);
    const pinned = c.slice(c.indexOf('</ScrollView>'));
    expect(pinned).toMatch(/<View className="gap-2 px-5 pb-4">\s*\{large && clockAndLine\}\s*<ButtonRow>/);
    expect(c.match(/clockAndLine\}/g)).toHaveLength(2); // once in the room, once pinned: never both
  });

  it('[review B L5] Reduce Motion reaches the aura; the start circle is a 120 pt button; the clock and "Listening." are spoken; the start plays its haptic first', () => {
    expect(c).toMatch(/<ListeningAura state=\{room\.aura\} db=\{db\} reduced=\{reduced\} size=\{AURA_SIZE\} \/>/);
    expect(c).toMatch(/const reduced = useReducedMotion\(\);/);
    expect(c).toMatch(/const AURA_SIZE = 240;/);
    expect(c).toMatch(/const DISC = AURA_SIZE \/ 2;/);
    const start = c.slice(c.indexOf('<Pressable\n                onPress={begin}'), c.indexOf('testID="listen.start"') + 200);
    expect(start).toMatch(/accessibilityRole="button"/);
    expect(start).toMatch(/style=\{\{ position: 'absolute', width: DISC, height: DISC, borderRadius: DISC \/ 2 \}\}/);
    expect(c).toMatch(/<Text variant="headline" tone="muted" className="text-center" style=\{\{ fontVariant: \['tabular-nums'\] \}\} accessibilityLabel=\{elapsedA11y\}>/);
    const begin = c.slice(c.indexOf('const start = async'), c.indexOf('const grantedNow'));
    // "Listening." is offered to the gate, which drops it while the take is live (SR-C-02, B2-21): VoiceOver never
    // speaks into a recording. The room's line and the red circle say it on screen.
    expect(begin).toMatch(/announcer\.say\(t\.listening, \{ phase: 'recording', capturing: capturingNow\(\) \}\)/);
    expect(begin).not.toMatch(/AccessibilityInfo/);
    expect(begin.indexOf("haptic('press')")).toBeGreaterThan(-1);
    expect(begin.indexOf("haptic('press')")).toBeLessThan(begin.indexOf("await setAudioMode('recording')"));
  });

  it('[review B L1] when a take ends the glow releases from where the voice left it, over releaseMs', () => {
    const aura = code(src('components/capture/listening-aura.tsx'));
    // From what is on screen (the voice, or the idle breath when the person was quiet; #271 lens B note 1), over releaseMs.
    expect(aura).toMatch(/if \(processing\.value\) \{\s*const k = Math\.exp\(-dt \/ B\.releaseMs\);\s*scale\.value = 1 \+ \(scale\.value - 1\) \* k;\s*opacity\.value = B\.opacityMin \+ \(opacity\.value - B\.opacityMin\) \* k;/);
    expect(aura).toMatch(/s\.value \+= \(0 - s\.value\) \* \(1 - Math\.exp\(-dt \/ B\.releaseMs\)\)/);
    expect(tokens.motion.breath.releaseMs).toBe(400);
  });

  it('the screen types no user-facing words (packages/content only)', () => {
    const jsxText = [...c.matchAll(/>\s*([A-Za-z][^<>{}]*?)\s*</g)].map((m) => m[1]).filter((t) => /[a-z]{3,}/i.test(t));
    expect(jsxText).toEqual([]);
  });
});
