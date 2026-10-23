/**
 * The welcome's one logo (EXPERIENCE_PASS S03, registry context `app.welcome`, D-109 F3). The app draws the stacked
 * lockup from path data because it does not load SVG files at run time; these tests hold that data to the registry's
 * own files, so the drawing can never drift from the brand asset, and hold the welcome to BRAND_SYSTEM 2a: the name
 * is never typed in a font on the screen, and the lockup's accessible name is the brand name.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brand } from '@scribe/brand';
import { CONTEXTS as contexts, asset, assetFor } from '@scribe/brand/registry';
import { describe, expect, it } from 'vitest';
import { LOCKUP_ASPECT, LOCKUP_PATHS, LOCKUP_VIEWBOX, WELCOME_LOCKUP, lockupAsset, lockupHeight } from '@/components/onboarding/welcome-lockup.logic';
import { copy } from '@/lib/copy';

const LOGO = join(__dirname, '..', '..', '..', 'packages', 'brand', 'assets', 'logo', 'primary');
const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function geometry(file: string) {
  const svg = readFileSync(join(LOGO, file), 'utf8');
  return {
    viewBox: /viewBox="([^"]+)"/.exec(svg)![1],
    paths: [...svg.matchAll(/<path\b([^>]*?)\/>/g)].map((m) => {
      const d = /\sd="([^"]+)"/.exec(m[1])![1];
      const t = /\stransform="([^"]+)"/.exec(m[1]);
      return t ? { d, transform: t[1] } : { d };
    }),
    fills: [...svg.matchAll(/\sfill="([^"]+)"/g)].map((m) => m[1]),
  };
}

describe('[S03] the stacked lockup is the registry file, drawn', () => {
  it('has the file\'s box and every path with its transform, unchanged (ink and reversed share the geometry)', () => {
    const ink = geometry('lockup-stacked.svg');
    const reversed = geometry('lockup-stacked-reversed.svg');
    expect(LOCKUP_VIEWBOX).toBe(ink.viewBox);
    expect(LOCKUP_PATHS).toEqual(ink.paths);
    expect(reversed.viewBox).toBe(ink.viewBox);
    expect(reversed.paths).toEqual(ink.paths);
    const [, , w, h] = ink.viewBox.split(' ').map(Number);
    expect(LOCKUP_ASPECT).toBeCloseTo(w / h, 10);
  });

  it('asks the registry which asset each scheme uses, and takes its fill from there', () => {
    expect(contexts['app.welcome'].assets).toEqual(['logo.lockup.stacked.ink', 'logo.lockup.stacked.reversed']);
    expect(lockupAsset('light').id).toBe('logo.lockup.stacked.ink');
    expect(lockupAsset('dark').id).toBe('logo.lockup.stacked.reversed');
    expect(lockupAsset('light').fill).toBe(geometry('lockup-stacked.svg').fills[0]);
    expect(lockupAsset('dark').fill).toBe(geometry('lockup-stacked-reversed.svg').fills[0]);
    expect(assetFor('app.welcome').map((a) => a.id)).toEqual(contexts['app.welcome'].assets);
    expect(asset('logo.lockup.stacked.ink').path).toMatch(/lockup-stacked\.svg$/);
  });

  it('is drawn at the registry rule\'s 96 pt, never under the asset\'s smallest size', () => {
    expect(WELCOME_LOCKUP).toEqual({ height: 96, top: 96 });
    expect(contexts['app.welcome'].rule).toMatch(/96 pt tall, centred, its top 96 pt below the safe-area top/);
    for (const scheme of ['light', 'dark'] as const) {
      expect(lockupHeight(scheme)).toBe(96);
      expect(lockupHeight(scheme, 10)).toBe(lockupAsset(scheme).minSize!.px);
    }
  });
});

describe('[S03] the welcome never types the name (BRAND_SYSTEM 2a)', () => {
  const welcome = code(readFileSync(join(SRC, 'app', 'onboarding.tsx'), 'utf8'));
  const lockup = code(readFileSync(join(SRC, 'components', 'onboarding', 'welcome-lockup.tsx'), 'utf8'));

  it('the lockup is the one logo, named for VoiceOver by the brand name', () => {
    expect(welcome).toMatch(/<WelcomeLockup label=\{o\.welcome\.title\}/);
    expect(copy.onboarding.welcome.title).toBe(brand.name);
    expect(lockup).toMatch(/accessible role="img" accessibilityLabel=\{label\}/);
    // The title key is only the lockup's label: it is never rendered as text, and the opening pair is not on the welcome.
    expect(welcome).not.toMatch(/\{o\.welcome\.title\}\s*<\/Text>/);
    expect(welcome).not.toMatch(/<QuotePair/);
  });

  it('one serif line, one filled button and two quiet doors, and no line drawing', () => {
    const step = welcome.slice(welcome.indexOf("{step === 'welcome' && ("), welcome.indexOf("{step === 'promise' && ("));
    expect(step.match(/variant="hero"/g)).toHaveLength(1);
    expect(step).not.toMatch(/variant="(display|title1|title2|prompt|signature)"/);
    expect(welcome).not.toMatch(/<LineArt/);
    const doors = welcome.slice(welcome.indexOf("{step === 'welcome' && (capabilities.signIn"));
    expect(doors.match(/variant="quiet"/g)).toHaveLength(2);
    expect(doors).not.toMatch(/icon=\{/);
  });

  it('[MOTION 5l] steps hand off, never pile up: the next step mounts only after the leaving one is gone, and the speech card does not animate in', () => {
    // The leaving step exits over exitMs; the arriving one is not rendered until then (review P2-V B1).
    expect(welcome).toMatch(/setTimeout\(\(\) => setShown\(step\), tokens\.motion\.exitMs\)/);
    const open = welcome.indexOf('{shown === step ? (');
    expect(open).toBeGreaterThan(0);
    expect(welcome.indexOf('key={step}')).toBeGreaterThan(open);
    expect(welcome.indexOf('exiting={motion.leave()}')).toBeGreaterThan(open);
    // The card holds controls (Download on Wi-Fi, Not now): it arrives with its step, with no entrance of its own.
    const card = welcome.slice(welcome.lastIndexOf('<', welcome.indexOf('<SpeechConsentCard') - 1), welcome.indexOf('<SpeechConsentCard'));
    expect(card).not.toMatch(/entering=/);
  });

  it('the welcome\'s doors open the sign-in sheet with trigger sign_in and the invite route, and a book that arrives lands on the Book', () => {
    expect(welcome).toMatch(/router\.push\(\{ pathname: '\/sign-in', params: \{ trigger: 'sign_in' \} \}\)/);
    expect(welcome).toMatch(/router\.push\(inviteHref\('onboarding_join', capabilities\.coParent\) as Href\)/);
    expect(welcome).toMatch(/if \(listChildren\(\)\.length > 0\) router\.replace\('\/book'\)/);
  });
});
