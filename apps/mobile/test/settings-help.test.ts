/// <reference types="node" />
/**
 * Help rows in Settings (RT-SET-02, SR-C-09; F20-REQ-005, F20-REQ-007). The crisis lines on "If you are struggling"
 * and every Write to us row open `tel:` or `mailto:` through help-links.logic.ts. When the device reports it cannot
 * (canOpenURL false) or the open is refused (openURL rejects), the same tap shows the number or address as selectable
 * text with a Copy button, instead of nothing at all. Which of the two iOS does on an iPad, with no SIM or with no
 * Mail account is expected, not proven here: S1-23 V-10 on an iPad (D10) confirms it on a device.
 *
 * The decision runs here in Node against a fake Linking; the sheet itself is pinned in its source.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { brand, supportMailto } from '@scribe/brand';
import { en } from '@scribe/content';
import { callTarget, fallbackWords, mailTarget, openHelpTarget, probePhone, readableNumber, rowHint, type HelpTarget, type Linker } from '../src/components/settings/help-links.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const lines = en.struggling.resources;
const fake = (can: boolean | Error, open: 'ok' | Error = 'ok') => {
  const linker = {
    canOpenURL: vi.fn(async () => {
      if (can instanceof Error) throw can;
      return can;
    }),
    openURL: vi.fn(async () => {
      if (open instanceof Error) throw open;
      return true;
    }),
  } satisfies Linker;
  return linker;
};

const targets: HelpTarget[] = [...lines.map((l) => callTarget(l)), mailTarget(en.settingsHome.helpSubject), mailTarget()];

describe('[RT-SET-02] opening a help link', () => {
  it('opens the link when the device can', async () => {
    for (const t of targets) {
      const l = fake(true);
      await expect(openHelpTarget(t, l)).resolves.toEqual({ kind: 'opened' });
      expect(l.canOpenURL).toHaveBeenCalledWith(t.url);
      expect(l.openURL).toHaveBeenCalledWith(t.url);
    }
  });

  it('canOpenURL false: the copy fallback, and nothing is opened', async () => {
    for (const t of targets) {
      const l = fake(false);
      await expect(openHelpTarget(t, l)).resolves.toEqual({ kind: 'fallback', target: t });
      expect(l.openURL).not.toHaveBeenCalled();
    }
  });

  it('openURL rejecting: the copy fallback, never an unhandled rejection', async () => {
    for (const t of targets) {
      const l = fake(true, new Error('Unable to open URL'));
      await expect(openHelpTarget(t, l)).resolves.toEqual({ kind: 'fallback', target: t });
    }
  });

  it('canOpenURL rejecting: the copy fallback too', async () => {
    const t = callTarget(lines[0]);
    await expect(openHelpTarget(t, fake(new Error('not allowed')))).resolves.toEqual({ kind: 'fallback', target: t });
  });
});

describe('[F20-REQ-005] the crisis lines', () => {
  it('each line calls its digits, and the number to copy is the one its words show', () => {
    for (const r of lines) {
      const t = callTarget(r);
      expect(t).toEqual({ kind: 'call', url: `tel:${r.tel}`, value: readableNumber(r.tel) });
      expect(t.value.replace(/\D/g, '')).toBe(r.tel);
      expect(r.how).toContain(t.value);
    }
    expect(readableNumber('18338526262')).toBe('1-833-852-6262');
    expect(readableNumber('988')).toBe('988');
  });

  it('struggling.* (FT-36) keeps its shape: no key added for the fallback, no Text rows', () => {
    expect(Object.keys(en.struggling).sort()).toEqual(['body', 'emergency', 'resources', 'title']);
    for (const r of lines) expect(Object.keys(r).sort()).toEqual(['how', 'name', 'tel']);
    expect(code('app/settings/struggling.tsx')).not.toMatch(/sms:|textRow|Send a text/);
  });

  it('the fallback for a number says "Number copied" once copied, from the shared helpLinks words', () => {
    const h = en.helpLinks;
    expect(fallbackWords('call')).toEqual({ title: h.noCallTitle, body: h.noPhoneBody, copy: h.copyNumber, copied: 'Number copied' });
  });
});

describe('[F20-REQ-005] the VoiceOver hint says what a tap does on this device (Review B on #519)', () => {
  it('promises a call only when canOpenURL said yes', async () => {
    const can = await probePhone(fake(true));
    expect(can).toEqual({ call: true });
    expect(rowHint(can)).toBe('Starts a call.');
  });

  it('canOpenURL false, a rejected question, or no answer yet: the neutral hint', async () => {
    for (const can of [await probePhone(fake(false)), await probePhone(fake(new Error('not allowed'))), { call: null }]) {
      expect(rowHint(can)).toBe(en.helpLinks.callHintNoPhone);
      expect(rowHint(can)).not.toMatch(/Starts/);
    }
  });

  it('asks about tel:', async () => {
    const l = { canOpenURL: vi.fn(async (u: string) => u.startsWith('tel:')) };
    expect(await probePhone(l)).toEqual({ call: true });
    expect(l.canOpenURL).toHaveBeenCalledWith(expect.stringMatching(/^tel:/));
  });

  it('the page takes its hint from rowHint, never a fixed "Starts a call."', () => {
    const page = code('app/settings/struggling.tsx');
    expect(page).toMatch(/const can = usePhoneAbility\(\)/);
    expect(page).toMatch(/accessibilityHint=\{rowHint\(can\)\}/);
    expect(page).not.toMatch(/callHint/);
  });
});

describe('[F20-REQ-007] Write to us', () => {
  it('opens the support mailbox with the fixed subject, and falls back to the address', () => {
    const h = en.helpLinks;
    expect(mailTarget(en.settingsHome.helpSubject)).toEqual({ kind: 'mail', url: supportMailto(en.settingsHome.helpSubject), value: brand.support.email });
    expect(mailTarget().url).toBe(supportMailto());
    expect(fallbackWords('mail')).toEqual({ title: h.noMailTitle, body: h.noMailBody, copy: h.copyAddress, copied: h.addressCopied });
  });
});

describe('[RT-SET-02] the screens', () => {
  const settings = readdirSync(join(SRC, 'app', 'settings')).filter((f) => f.endsWith('.tsx'));

  it('no settings screen opens tel:, sms: or mailto: without the fallback', () => {
    for (const f of settings) {
      const c = code(join('app', 'settings', f));
      expect(c, f).not.toMatch(/Linking\.openURL\(\s*(`(tel|sms|mailto):|supportMailto)/);
      expect(c, f).not.toMatch(/void Linking\.openURL\(/);
    }
  });

  it('If you are struggling: each call goes through the fallback, and the sheet is on the page', () => {
    const page = code('app/settings/struggling.tsx');
    expect(page).toMatch(/onPress=\{\(\) => link\.open\(callTarget\(r\)\)\}/);
    expect(page).toMatch(/\{link\.sheet\}/);
  });

  it('every Write to us row goes through the fallback, and each screen draws the sheet', () => {
    for (const f of ['index.tsx', 'export.tsx', 'backup.tsx']) {
      const c = code(join('app', 'settings', f));
      expect(c, f).toMatch(/help\.open\(mailTarget\(/);
      expect(c, f).toMatch(/\{help\.sheet\}/);
    }
  });

  it('the fallback sheet shows the value as selectable text with one Copy button, and records nothing (D-034)', () => {
    const sheet = code('components/settings/help-fallback.tsx');
    expect(sheet).toMatch(/<Text[^>]*selectable[^>]*>\s*\{shown\?\.value/);
    expect(sheet).toMatch(/Clipboard\.setStringAsync\(shown\.value\)/);
    expect(sheet).toMatch(/label=\{words\.copy\}/);
    expect(sheet).toMatch(/openHelpTarget\(t, Linking\)/);
    for (const c of [sheet, code('components/settings/help-links.logic.ts')]) expect(c).not.toMatch(/track\w*\(|console\.|analytics/);
  });
});
