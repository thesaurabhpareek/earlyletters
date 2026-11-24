/// <reference types="node" />
/**
 * NS-09 Let it go, two source checks (BL-977, P-4b). A native Alert has no "preferred" flag in React Native, so
 * the proof that the confirmation defaults to keep is its shape: Keep is the cancel button, Let it go is the
 * destructive one, the let-go runs only inside the confirm, and nothing offers an Undo after it (R9). No remote
 * switch may pause or delay the local let-go: the code that does it reads no config, flag or kill switch (R17).
 * What a person hears (VoiceOver, "cannot be brought back") waits on the BL-925 words and a device row.
 *
 * Mutants these tests were written to catch (each one failed a test here when it was made):
 *  R9  Let it go listed first and not marked destructive; an Undo button added after the confirm;
 *  R17 `serverFeaturesEnabled()` read at the top of beginDiscard (store.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
/** From the start marker to the first marker after it; fails loudly if either moved. */
function slice(s: string, from: string, to: string): string {
  const a = s.indexOf(from);
  expect(a, `missing: ${from}`).toBeGreaterThanOrEqual(0);
  const b = s.indexOf(to, a + from.length);
  expect(b, `missing: ${to}`).toBeGreaterThan(a);
  return s.slice(a, b);
}

/** What is wrong with an Alert's buttons as a confirmation that defaults to keep; empty when nothing is. */
function problems(fn: string, ns: string): string[] {
  const out: string[] = [];
  const buttons = fn.slice(fn.indexOf('Alert.alert('));
  const keep = buttons.indexOf(`${ns}.keepButton`);
  const confirm = buttons.indexOf(`${ns}.discardConfirm`);
  if (keep < 0 || confirm < 0) out.push('a button is missing');
  if (keep > confirm) out.push('Keep is not first');
  if (!new RegExp(`${ns.replace('.', '\\.')}\\.keepButton, style: 'cancel'`).test(buttons)) out.push('Keep is not the cancel button');
  if (!/style: 'destructive',\s*onPress:/.test(buttons)) out.push('Let it go is not the destructive button');
  if ((buttons.match(/onPress:/g) ?? []).length !== 1) out.push('more than one action');
  if (buttons.indexOf('letItGo(') < buttons.indexOf('onPress:')) out.push('the let-go runs outside the confirm');
  if (/undo/i.test(fn)) out.push('an Undo');
  if (/preferred/i.test(fn)) out.push('a preferred action');
  return out;
}

describe('[NS-09-R9] the confirmation defaults to keep', () => {
  const screens: [string, string, string, string][] = [
    ['review.tsx', 'const letGo = () => {', 'const player = useLetterPlayer(', 'copy.listen'],
    ['listen.tsx', 'const discard = () => {', 'const typeInstead =', 'p'],
  ];
  it('[NS-09-R9] the confirmation defaults to keep (positive control: the check sees a swapped order and an Undo)', () => {
    const good = "Alert.alert(t, b, [{ text: copy.listen.keepButton, style: 'cancel' }, { text: copy.listen.discardConfirm, style: 'destructive', onPress: () => { letItGo(a); } }]);";
    expect(problems(good, 'copy.listen')).toEqual([]); // the checker is quiet on a right one
    const swapped = good.replace("{ text: copy.listen.keepButton, style: 'cancel' }, ", '').replace(']);', ", { text: copy.listen.keepButton, style: 'cancel' }]);");
    expect(problems(swapped, 'copy.listen')).toContain('Keep is not first');
    expect(problems(good.replace(']);', ", { text: copy.listen.undoButton }]);"), 'copy.listen')).toContain('an Undo');
  });

  it.each(screens)('[NS-09-R9] the confirmation defaults to keep (%s)', (file, from, to, ns) => {
    const fn = slice(code(src(`app/${file}`)), from, to);
    expect(fn.match(/\bletItGo\(/g)).toHaveLength(1); // arrange: the let-go is in the slice, so a moved slice cannot pass
    expect(problems(fn, ns)).toEqual([]);
  });
});

describe('[NS-09-R17] no remote switch stops a let-go', () => {
  const READS_A_SWITCH = /serverFeaturesEnabled|buildFlagEnabled|killSwitch|remoteConfig|remote-config|capabilities|getFlag|featureFlag|isEnabled\(/i;
  const store = code(src('lib/store.ts'));
  const parts: [string, string][] = [
    ['let-it-go.logic.ts', code(src('lib/capture/let-it-go.logic.ts'))],
    ['store.beginDiscard and finishDiscard', slice(store, 'export function beginDiscard(', 'export function deleteDraft(')],
    ['sweep.finishLetGo', slice(code(src('lib/capture/sweep.ts')), 'function finishLetGo(', '\n}\n')],
    ['repo beginDiscard and finishDiscard', code(src('lib/db/repos/drafts.ts'))],
    ['review confirm', slice(code(src('app/review.tsx')), 'const letGo = () => {', 'const player = useLetterPlayer(')],
    ['listen confirm', slice(code(src('app/listen.tsx')), 'const discard = () => {', 'const typeInstead =')],
  ];

  it('[NS-09-R17] no remote switch stops a let-go (source check)', () => {
    // Positive control: the pattern does catch the read it is here to forbid, so a clean result below means something.
    expect('if (killSwitches.sync) return false;').toMatch(READS_A_SWITCH);
    expect('if (!serverFeaturesEnabled()) return false;').toMatch(READS_A_SWITCH);
    for (const [name, text] of parts) {
      expect(text.length, name).toBeGreaterThan(80); // arrange: a moved slice would be empty and pass
      expect(text, name).not.toMatch(READS_A_SWITCH);
    }
  });
});
