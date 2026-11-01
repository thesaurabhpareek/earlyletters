/// <reference types="node" />
/**
 * Help rows in Settings (RT-SET-02, SR-C-09; F20-REQ-002, F20-REQ-005, F20-REQ-007). The crisis lines on "If you are
 * struggling" and every Write to us row open `tel:`, `sms:` or `mailto:` through help-links.logic.ts. When the device
 * cannot (canOpenURL false on an iPad, openURL rejecting with no SIM or no Mail account), the same tap shows the
 * number or address as selectable text with a Copy button, instead of nothing at all.
 *
 * The decision runs here in Node against a fake Linking; the sheet itself is pinned in its source. On a device:
 * S1-23 V-10 on an iPad (D10).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { brand, supportMailto } from '@scribe/brand';
import { en } from '@scribe/content';
import { callTarget, crisisRows, fallbackWords, mailTarget, openHelpTarget, textTarget, type HelpTarget, type Linker } from '../src/components/settings/help-links.logic';

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

const targets: HelpTarget[] = [...lines.map((l) => callTarget(l)), ...lines.map((l) => textTarget(l)).filter((t): t is HelpTarget => t !== null), mailTarget(en.settingsHome.helpSubject), mailTarget()];

describe('[RT-SET-02] opening a help link', () => {
  it('opens the link when the device can', async () => {
    for (const t of targets) {
      const l = fake(true);
      await expect(openHelpTarget(t, l)).resolves.toEqual({ kind: 'opened' });
      expect(l.canOpenURL).toHaveBeenCalledWith(t.url);
      expect(l.openURL).toHaveBeenCalledWith(t.url);
    }
  });

  it('canOpenURL false (an iPad and tel:): the copy fallback, and nothing is opened', async () => {
    for (const t of targets) {
      const l = fake(false);
      await expect(openHelpTarget(t, l)).resolves.toEqual({ kind: 'fallback', target: t });
      expect(l.openURL).not.toHaveBeenCalled();
    }
  });

  it('openURL rejecting (no SIM, no Mail account): the copy fallback, never an unhandled rejection', async () => {
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
  it('each line calls its digits and shows its number as people read it', () => {
    for (const r of lines) {
      const t = callTarget(r);
      expect(t).toEqual({ kind: 'call', url: `tel:${r.tel}`, value: r.number });
      expect(r.number.replace(/\D/g, '')).toBe(r.tel);
      expect(r.how).toContain(r.number);
    }
  });

  it('the words match what the rows do: a line that says "text" has a Text row, and only those do (F20-REQ-002)', () => {
    for (const { line, text } of crisisRows(lines)) {
      const saysText = /\btext\b/i.test(line.how);
      expect(text !== null).toBe(saysText);
      if (text) {
        expect(text.url).toBe(`sms:${'sms' in line ? line.sms : ''}`);
        expect(text.value).toBe(line.number);
      }
    }
    // Today: the Maternal Mental Health Hotline and 988 take texts; Postpartum Support International calls back.
    expect(crisisRows(lines).map((r) => r.text?.url ?? null)).toEqual(['sms:18338526262', 'sms:988', null]);
  });

  it('the fallback for a number says "Number copied" once copied', () => {
    expect(fallbackWords('call')).toEqual({ title: en.struggling.noCallTitle, body: en.struggling.noPhoneBody, copy: en.struggling.copyNumber, copied: 'Number copied' });
    expect(fallbackWords('text').title).toBe(en.struggling.noTextTitle);
    expect(fallbackWords('text').copied).toBe('Number copied');
  });
});

describe('[F20-REQ-007] Write to us', () => {
  it('opens the support mailbox with the fixed subject, and falls back to the address', () => {
    expect(mailTarget(en.settingsHome.helpSubject)).toEqual({ kind: 'mail', url: supportMailto(en.settingsHome.helpSubject), value: brand.support.email });
    expect(mailTarget().url).toBe(supportMailto());
    expect(fallbackWords('mail')).toEqual({ title: en.settingsHome.noMailTitle, body: en.settingsHome.noMailBody, copy: en.settingsHome.copyAddress, copied: en.settingsHome.addressCopied });
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

  it('If you are struggling: calls and texts go through the fallback, and the sheet is on the page', () => {
    const page = code('app/settings/struggling.tsx');
    expect(page).toMatch(/onPress=\{\(\) => link\.open\(call\)\}/);
    expect(page).toMatch(/onPress=\{\(\) => link\.open\(text\)\}/);
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
