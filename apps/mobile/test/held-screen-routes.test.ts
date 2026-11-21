/// <reference types="node" />
/**
 * BL-922a, the held screen for an account with consent still to give (NS-10-R0, R4a, R4b; docs/tdd/new-scope/08-keeping.md
 * 3.2). Pure, no phone, no network. The hook is in test/use-first-run-route.test.ts and the screen's mount is a device row
 * (S1-204 k). Each row has its mutant: a copy of the real source or function with the one wrong line, which the same check
 * must catch. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { firstRunGate, gateInputsFromAuth, heldNewPhoneView, type FirstRunGateInput } from '../src/lib/first-run/gate.logic';
import { HELD_DELETE_ROUTE, HELD_EXPORT_ROUTE, HELD_FINISH_SETUP_ROUTE, heldScreenModel } from '../src/lib/first-run/held-screen.logic';
import { firstRunScreen } from '../src/lib/first-run/welcome.logic';
import type { AuthState } from '../src/lib/auth/machine.logic';

const SRC = join(__dirname, '..', 'src');
/** Source without comments, so a rule is checked against code, not against what a comment says. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = (rel: string) => code(readFileSync(join(SRC, rel), 'utf8'));

const needsConsent = (steps: Array<'terms' | 'sensitive'>): AuthState => ({ status: 'needsConsent', userId: 'asha-mama', method: null, steps });

/** The route's own composition: what use-first-run-route.ts passes for a session with no book. */
const routeStep = (authState: AuthState, over: { newPhone?: FirstRunGateInput['newPhone']; hasLocalBook?: boolean } = {}) => {
  const held = heldNewPhoneView(authState, true);
  return firstRunGate(gateInputsFromAuth({ serverFeatures: true, authState, hasLocalBook: over.hasLocalBook ?? false, online: true, newPhone: over.newPhone ?? held ?? 'new' }));
};

describe('[NS-10-R0] a returning account never meets the child step', () => {
  it('[NS-10-R0] consent outstanding with no book is finishSetup, whichever step is outstanding, never childStep', () => {
    for (const steps of [['terms'], ['sensitive'], ['terms', 'sensitive']] as const) {
      const r = routeStep(needsConsent([...steps]));
      expect(r.step, steps.join()).toBe('finishSetup');
      expect(r.mayBeginBook, steps.join()).toBe(false);
      expect(firstRunScreen({ step: r.step, outage: null, restoring: false, pastWelcome: false })).toBe('finishSetup');
    }
  });

  it('[NS-10-R0] the answer needs no network: offline gives the same screen, and the held view takes no part of the clock', () => {
    const s = needsConsent(['terms']);
    expect(heldNewPhoneView(s, false)).toBe('consent');
    expect(firstRunGate(gateInputsFromAuth({ serverFeatures: true, authState: s, hasLocalBook: false, online: false, newPhone: 'consent' })).step).toBe('finishSetup');
  });

  it('[NS-10-R0] with a book on the phone the book opens (R22), and with the server switch off nothing changes (R8)', () => {
    expect(routeStep(needsConsent(['terms']), { hasLocalBook: true }).step).toBe('openTonight');
    const off = firstRunGate(gateInputsFromAuth({ serverFeatures: false, authState: needsConsent(['terms']), hasLocalBook: false, newPhone: 'consent' }));
    expect(off.step).toBe('unchanged');
  });

  it('[NS-10-R0] sync declined (ready, sync off) keeps the child step: that choice was made, and it is not this screen', () => {
    expect(routeStep({ status: 'ready', userId: 'asha-mama', sync: 'off' }).step).toBe('childStep');
  });

  it('[NS-10-R0] mutant: with the no-book-with-account branch gone the child step shows, and this test sees it', () => {
    // The old gate: a session with no book fell through to the child step (gate.logic.ts, before BL-922a).
    const old = (i: FirstRunGateInput) => (i.hasSession && !i.hasLocalBook ? 'childStep' : firstRunGate(i).step);
    const input = gateInputsFromAuth({ serverFeatures: true, authState: needsConsent(['terms']), hasLocalBook: false, newPhone: 'consent' });
    expect(old(input)).toBe('childStep');
    expect(firstRunGate(input).step).not.toBe('childStep');
  });

  it('[NS-10-R0] the Known gap wording is gone from the gate', () => {
    const raw = readFileSync(join(SRC, 'lib/first-run/gate.logic.ts'), 'utf8');
    expect(raw).not.toMatch(/Known gap/);
  });
});

/** A page asks for agreement if its code reads consent, Terms or the sync gate before it renders. */
const asksForAgreement = (t: string) => /needsConsent|termsCurrent|steps\.includes|\/sign-in\/consent|useAccountGate|consentHandoff/.test(t);

describe('[NS-10-R4a] deletion works without agreeing', () => {
  it('[NS-10-R4a] the held screen offers Delete account at the delete route, where the page opens, and not where it would only bounce', () => {
    expect(heldScreenModel({ accountDeletion: true, hasLocalBook: false }).deleteAccount).toEqual({ route: '/settings/delete-account' });
    expect(HELD_DELETE_ROUTE).toBe('/settings/delete-account');
    // The page redirects to Settings with the build switch off (D-129): no link to a button that does nothing.
    expect(heldScreenModel({ accountDeletion: false, hasLocalBook: false }).deleteAccount).toBeNull();
  });

  it('[NS-10-R4a] the delete page and the route guard ask for no Terms: the real source reads no consent state', () => {
    expect(asksForAgreement(src('app/settings/delete-account.tsx'))).toBe(false);
    expect(asksForAgreement(src('lib/first-run/route.logic.ts'))).toBe(false);
  });

  it('[NS-10-R4a] mutant: a page that requires Terms before it mounts is caught', () => {
    const mutant = src('app/settings/delete-account.tsx').replace('export default function DeleteAccountRoute() {', "export default function DeleteAccountRoute() {\n  if (auth.state.status === 'needsConsent') return <Redirect href=\"/sign-in/consent\" />;");
    expect(mutant).not.toBe(src('app/settings/delete-account.tsx'));
    expect(asksForAgreement(mutant)).toBe(true);
  });

  it('[NS-10-R4a] Try another way and Delete account never depend on the consent route: only Finish setting up opens it', () => {
    const m = heldScreenModel({ accountDeletion: true, hasLocalBook: false });
    expect(m.finishSetup.route).toBe(HELD_FINISH_SETUP_ROUTE);
    expect([m.deleteAccount?.route, m.exportCopy.route]).not.toContain(HELD_FINISH_SETUP_ROUTE);
    const screens = src('components/onboarding/new-phone-screens.tsx');
    const held = screens.slice(screens.indexOf('export function HeldScreen'));
    expect(held.match(/router\.push\(/g)?.length).toBe(3);
    expect(held).toMatch(/onPress: onTryAnother/);
  });
});

describe('[NS-10-R4b] export reachable after declining', () => {
  it('[NS-10-R4b] the export link is always on the held screen, and with nothing on the phone it carries the elsewhere line', () => {
    for (const accountDeletion of [true, false]) {
      expect(heldScreenModel({ accountDeletion, hasLocalBook: false }).exportCopy).toEqual({ route: '/settings/export', nothingToCopy: true });
    }
    expect(HELD_EXPORT_ROUTE).toBe('/settings/export');
    expect(heldScreenModel({ accountDeletion: true, hasLocalBook: true }).exportCopy.nothingToCopy).toBe(false);
  });

  it('[NS-10-R4b] the export page asks for no Terms: the real source reads no consent state', () => {
    expect(asksForAgreement(src('app/settings/export.tsx'))).toBe(false);
  });

  it('[NS-10-R4b] mutant: an export hidden behind the Terms gate is caught', () => {
    const mutant = src('app/settings/export.tsx') + "\nconst hidden = auth.state.status === 'needsConsent';";
    expect(asksForAgreement(mutant)).toBe(true);
  });
});
