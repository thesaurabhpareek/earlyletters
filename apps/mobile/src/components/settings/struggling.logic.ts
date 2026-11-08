/**
 * If you are struggling, by the phone's region (struggling-page.md sections 2 and 3; CCO-11; F20-REQ-005).
 *
 * The region comes from the phone's own region setting (iOS `AppleLocale`, then the `Intl` locale), read on the
 * phone. It needs no permission and no network, and it is never stored, logged or sent (D-034). Which region a
 * phone reports is checked on a device (S1-150).
 *
 * Pure, so it runs in Node (test/struggling-regions.test.ts). The lines and their sources are packages/content
 * helplines.ts; the words around them are `struggling.*`.
 */
import { en, HELPLINES, helplinesFor, type Helpline, type RegionHelplines } from '@scribe/content';
import { callTarget, textTarget, type HelpTarget } from './help-links.logic';

/**
 * The region in a locale string, upper case, or null. Reads `en_GB`, `en-GB`, `en-Latn-GB`, `es-419` (null: a
 * number is an area, not a country) and a region override (`en_US@rg=gbzzzz`, `en-US-u-rg-gbzzzz`), which wins
 * because it is what the person chose as their region.
 */
export function regionFromLocale(tag: unknown): string | null {
  if (typeof tag !== 'string' || tag.length === 0) return null;
  const override = /(?:@|;)rg=([a-z]{2})zzzz|-u(?:-[a-z0-9]{2,8})*?-rg-([a-z]{2})zzzz/i.exec(tag);
  if (override) return (override[1] ?? override[2]).toUpperCase();
  const base = tag.split(/[@.]/)[0].split('-u-')[0];
  const parts = base.split(/[-_]/).slice(1);
  for (const p of parts) {
    if (/^[A-Za-z]{2}$/.test(p)) return p.toUpperCase();
    if (/^\d{3}$/.test(p)) return null;
  }
  return null;
}

/** The first region any candidate names, in order. */
export function phoneRegion(candidates: readonly unknown[]): string | null {
  for (const c of candidates) {
    const r = regionFromLocale(c);
    if (r) return r;
  }
  return null;
}

/** What the page shows: this region's lines, or null for the directory and general emergency words. */
export function localLines(region: string | null): RegionHelplines | null {
  return helplinesFor(region);
}

/** "Lines in other countries": every region we hold, in the table's order. */
export function otherCountries(): readonly RegionHelplines[] {
  return HELPLINES;
}

/** The emergency line: "Call 911" for a region we hold, otherwise the general words with nothing to tap. */
export function emergencyLine(local: RegionHelplines | null): { label: string; target: HelpTarget | null } {
  const s = en.struggling;
  if (!local) return { label: s.emergencyLocal, target: null };
  return { label: s.emergencyCall.replace('{n}', local.emergency.shown), target: callTarget(local.emergency.tel, local.emergency.shown) };
}

/** A line's buttons: Call if it has a number to call, Text if it has one to text. Each says the line's name to VoiceOver. */
export function lineActions(line: Helpline): { kind: 'call' | 'text'; label: string; a11y: string; target: HelpTarget }[] {
  const s = en.struggling;
  const out: { kind: 'call' | 'text'; label: string; a11y: string; target: HelpTarget }[] = [];
  if (line.tel) out.push({ kind: 'call', label: s.call, a11y: s.callA11y.replace('{name}', line.name), target: callTarget(line.tel, line.telShown ?? line.tel) });
  if (line.sms) out.push({ kind: 'text', label: s.text, a11y: s.textA11y.replace('{name}', line.name), target: textTarget(line.sms, line.smsShown ?? line.sms) });
  return out;
}
