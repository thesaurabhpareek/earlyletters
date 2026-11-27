import { reminderCopy } from '@scribe/content';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemindersSwitch } from '@/components/settings/reminders-switch';
import { choicesShown, nextLine, remindersSwitchOn, remindersSwitchShown, remindersWaitingForPermission, showNotificationsOff, switchStatus } from '@/components/settings/reminders.logic';
import type { ReminderPermission } from '@/lib/reminders';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

/**
 * [BL-428] The Reminders master switch, rendered (static markup through react-native-web; BL-278 harness), for each OS
 * permission state. The real RemindersSwitch, ToggleRow and switch rules are drawn; nothing is stood in but the
 * harness's native seams. Proves: with reminders on and notifications denied (or not yet asked) the switch draws off,
 * with the status line under its title; granted draws it on with no status line; a turn-on in flight draws the intent
 * (CDesO-3: on behind the iOS alert). It does NOT prove the SwiftUI switch on a phone or VoiceOver speech: J13-02 stays
 * a device row.
 */
const s = reminderCopy.settings;
const ON = { enabled: true, paused: false };
const OFF = { enabled: false, paused: false };

/** The rendered switch: the web stand-in is a checkbox with role="switch", `checked` when on. */
function draw(prefs: { enabled: boolean; paused: boolean }, permission: ReminderPermission | null, busy = false) {
  const html = renderMarkup(<RemindersSwitch prefs={prefs} permission={permission} busy={busy} onValueChange={() => undefined} />);
  const input = html.match(/<input[^>]*role="switch"[^>]*>/)?.[0] ?? '';
  return { html, input, checked: /\schecked=""/.test(input), disabled: /\sdisabled=""/.test(input) };
}

beforeEach(() => {
  harness.fontScale = 1;
  harness.announced.length = 0;
});

describe('[BL-428] [J13-02] the reminders switch shows the true state', () => {
  it('denied: reminders on, but the switch draws off, with "Not sending yet." under its title', () => {
    const r = draw(ON, 'denied');
    expect(r.input).not.toBe('');
    expect(r.checked).toBe(false);
    expect(r.disabled).toBe(false); // a press asks again where the OS still can
    expect(r.html).toContain(s.notSendingYet);
    // The footer is the explanation drawn while the switch is off, not "Changes save as you go."
    expect(r.html).not.toContain(s.savesAsYouGo);
    // The notifications-off card (on the screen, below the switch) still shows, with Open Settings.
    expect(showNotificationsOff(ON, 'denied')).toBe(true);
  });

  it('undetermined: reminders on but never answered, the switch draws off, with the same status line and no card', () => {
    const r = draw(ON, 'undetermined');
    expect(r.checked).toBe(false);
    expect(r.html).toContain(s.notSendingYet);
    expect(showNotificationsOff(ON, 'undetermined')).toBe(false);
  });

  it('granted: the switch draws on, with no status line, and the footer says changes save as you go', () => {
    const r = draw(ON, 'granted');
    expect(r.checked).toBe(true);
    expect(r.html).not.toContain(s.notSendingYet);
    expect(r.html).toContain(s.savesAsYouGo);
  });

  it('reminders off: the switch draws off with no status line, whatever the permission', () => {
    for (const p of ['denied', 'undetermined', 'granted', null] as const) {
      const r = draw(OFF, p);
      expect(r.checked, String(p)).toBe(false);
      expect(r.html, String(p)).not.toContain(s.notSendingYet);
    }
    // A pause from before the one switch reads as off too.
    expect(draw({ enabled: true, paused: true }, 'denied').checked).toBe(false);
  });

  it('a turn-on in flight draws the intent, so the switch stays on behind the iOS alert (CDesO-3), and is disabled', () => {
    const r = draw(ON, 'undetermined', true);
    expect(r.checked).toBe(true);
    expect(r.disabled).toBe(true);
    expect(r.html).not.toContain(s.notSendingYet);
  });

  it('permission not read yet: the intent shows, so a granted phone does not flicker off on arrival', () => {
    expect(draw(ON, null).checked).toBe(true);
  });

  it('the rules: the intent is kept in every state, the switch is on only once the OS allows it', () => {
    const states: (ReminderPermission | null)[] = ['denied', 'undetermined', 'granted', null];
    expect(states.map(() => remindersSwitchOn(ON))).toEqual([true, true, true, true]);
    expect(states.map((p) => remindersWaitingForPermission(ON, p))).toEqual([true, true, false, false]);
    expect(states.map((p) => remindersSwitchShown(ON, p))).toEqual([false, false, true, true]);
    expect(states.map((p) => switchStatus(ON, p))).toEqual([s.notSendingYet, s.notSendingYet, undefined, undefined]);
    expect(states.map((p) => remindersSwitchShown(OFF, p))).toEqual([false, false, false, false]);
    expect(states.map((p) => remindersWaitingForPermission(OFF, p))).toEqual([false, false, false, false]);
  });

  it('waiting for permission keeps the choices on screen; only the switch draws off (J13)', () => {
    // The choices (How often through Names in notifications) follow the intent, whatever the OS has said.
    expect(choicesShown(ON)).toBe(true);
    expect(choicesShown(OFF)).toBe(false);
    expect(choicesShown({ enabled: true, paused: true })).toBe(false);
    // Denied: the card and the choices both show.
    expect(showNotificationsOff(ON, 'denied') && choicesShown(ON)).toBe(true);
    // Undetermined: the choices show, with no card.
    expect(showNotificationsOff(ON, 'undetermined')).toBe(false);
    // The screen's Next line hangs off what the switch draws, so "Not sending yet." shows once, on the switch row.
    for (const p of ['denied', 'undetermined'] as const) {
      const next = { date: '2026-11-03', hour: 20, minute: 30 };
      expect(nextLine({ on: remindersSwitchShown(ON, p), permission: p, next, formatTime: () => '8:30 PM' }), p).toBeNull();
      expect(draw(ON, p).html.split(s.notSendingYet).length - 1, p).toBe(1);
    }
  });
});
