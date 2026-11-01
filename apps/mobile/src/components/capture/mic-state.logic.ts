/**
 * The microphone is off, in use, or the phone is full (EXPERIENCE_PASS_2026-10 S13, package P4). Pure, tested in Node
 * (test/listen.test.ts); app/listen.tsx draws each as one StateScreen: a Phosphor Light glyph in a 72 pt accentSoft
 * circle (MicrophoneSlash for off and in use, WarningCircle for full), the title in title2, the body in body
 * textMuted, one primary and one quiet button at the bottom, Close at the top right. Plain paper, no lamp, no breath.
 *
 *   cause    title                         body                                           primary        quiet
 *   denied   The microphone is off         Turn it on in Settings, or type this one.      Type instead   Open Settings
 *   busy     The microphone is in use      A call or another app has it right now.        Try again      Type instead
 *   full     This phone is full            Free some space to record, or type this one.   Type instead   Try again
 *
 * Typing is an equal way to write (DESIGN_LANGUAGE principle 5): "Type instead" opens Write with the same prompt.
 */
import { copy } from '@/lib/copy';
import type { MicProblem } from './listen.logic';

export type MicAction = 'type' | 'settings' | 'tryAgain';
export type MicGlyph = 'microphoneSlash' | 'warningCircle';

export type MicStateView = {
  glyph: MicGlyph;
  title: string;
  body: string;
  primary: { action: MicAction; label: string };
  quiet: { action: MicAction; label: string };
};

const label = (a: MicAction): string =>
  a === 'type' ? copy.errors.micDenied.typeButton : a === 'settings' ? copy.errors.micDenied.settingsButton : copy.common.tryAgainButton;

const act = (a: MicAction) => ({ action: a, label: label(a) });

export function micStateView(cause: MicProblem): MicStateView {
  const e = copy.errors;
  switch (cause) {
    case 'denied':
      return { glyph: 'microphoneSlash', title: e.micDenied.title, body: e.micDenied.body, primary: act('type'), quiet: act('settings') };
    case 'busy':
      return { glyph: 'microphoneSlash', title: e.micBusy.title, body: e.micBusy.body, primary: act('tryAgain'), quiet: act('type') };
    case 'full':
      return { glyph: 'warningCircle', title: e.phoneFull.title, body: e.phoneFull.body, primary: act('type'), quiet: act('tryAgain') };
  }
}

/**
 * The `error_shown` code each cause counts as (a code only, never words), from the catalog's ERROR_CODE list. The
 * catalog has no code for a busy microphone, so that state counts nothing rather than a wrong code (a request to the
 * analytics owner is in the P4 pull request).
 */
export const MIC_ERROR_CODE: Record<MicProblem, 'mic_denied' | 'storage_low' | null> = {
  denied: 'mic_denied',
  busy: null,
  full: 'storage_low',
};
