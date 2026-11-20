/// <reference types="node" />
/**
 * If you are struggling, by the phone's region (struggling-page.md sections 2 and 3). The region is parsed from the
 * phone's locale settings on the phone; which string iOS gives is checked on a device (S1-150).
 */
import { describe, expect, it } from 'vitest';
import { en, HELPLINES } from '@scribe/content';
import { emergencyLine, lineActions, localLines, otherCountries, phoneRegion, regionFromLocale, showDirectory } from '../src/components/settings/struggling.logic';

describe('regionFromLocale', () => {
  it.each([
    ['en_US', 'US'],
    ['en-GB', 'GB'],
    ['en_IE', 'IE'],
    ['en-Latn-IN', 'IN'],
    ['zh-Hant-TW', 'TW'],
    ['en_US@rg=gbzzzz', 'GB'],
    ['en-US-u-rg-nzzzzz', 'NZ'],
    ['en-AU-u-ca-gregory', 'AU'],
    ['fr_CA.UTF-8', 'CA'],
  ])('%s reads %s', (tag, region) => {
    expect(regionFromLocale(tag)).toBe(region);
  });

  it.each([['en'], ['es-419'], [''], [undefined], [null], [42]])('%s has no region', (tag) => {
    expect(regionFromLocale(tag)).toBeNull();
  });

  it('takes the first candidate that names a region (AppleLocale, then Intl)', () => {
    expect(phoneRegion(['en_GB', 'en-US'])).toBe('GB');
    expect(phoneRegion([undefined, 'en-AU'])).toBe('AU');
    expect(phoneRegion(['en', undefined])).toBeNull();
    expect(phoneRegion([])).toBeNull();
  });
});

describe('the page by region', () => {
  it('a region we hold: its emergency number to call, then its lines', () => {
    const us = localLines('US')!;
    expect(emergencyLine(us)).toEqual({ label: 'Call 911', target: { kind: 'call', url: 'tel:911', value: '911' } });
    expect(emergencyLine(localLines('GB')).label).toBe('Call 999');
    expect(emergencyLine(localLines('AU')).target?.url).toBe('tel:000');
  });

  it('any other region, or none: the general words and nothing to dial', () => {
    // Ireland is held (HSE page last reviewed 28/05/2025; Text About It keyword unconfirmed): it gets the general words.
    for (const r of ['DE', 'FR', 'IE', null]) {
      expect(localLines(r)).toBeNull();
      expect(emergencyLine(localLines(r))).toEqual({ label: en.struggling.emergencyLocal, target: null });
    }
  });

  it('the directory shows where we hold no lines, including India while Tele-MANAS is held, never beside held lines', () => {
    expect(showDirectory(localLines('DE'))).toBe(true);
    expect(showDirectory(localLines(null))).toBe(true);
    const india = localLines('IN')!;
    expect(india.lines).toEqual([]);
    expect(emergencyLine(india).label).toBe('Call 112');
    expect(showDirectory(india)).toBe(true);
    for (const r of ['US', 'CA', 'GB', 'AU', 'NZ']) expect(showDirectory(localLines(r)), r).toBe(false);
  });

  it('Lines in other countries lists every region we hold', () => {
    expect(otherCountries().map((r) => r.region)).toEqual(HELPLINES.map((r) => r.region));
  });

  it('a line with a number to call and to text gets Call then Text, each naming the line to VoiceOver', () => {
    const nmmh = localLines('US')!.lines[0];
    expect(lineActions(nmmh).map((a) => [a.label, a.a11y])).toEqual([
      ['Call', 'Call National Maternal Mental Health Hotline'],
      ['Text', 'Text National Maternal Mental Health Hotline'],
    ]);
  });

  it('a text-only line gets Text alone, a call-only line Call alone', () => {
    const textOnly = { id: 't', name: 'A text line', how: 'Text 50808.', sms: '50808', smsShown: '50808', free: false, sources: [], verifiedOn: '2026-11-08' };
    expect(lineActions(textOnly).map((a) => a.kind)).toEqual(['text']);
    expect(lineActions(localLines('GB')!.lines[0]).map((a) => a.kind)).toEqual(['call']);
  });
});
