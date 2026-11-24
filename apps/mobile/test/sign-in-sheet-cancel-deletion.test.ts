/// <reference types="node" />
/**
 * BL-494 point 1: the sign-in sheet opened from the signed-out deletion screen says what the person came to do. The
 * analytics trigger stays `settings` (no change to the catalog's trigger list); a `reason` param picks the body.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIGN_IN_TRIGGER } from '@scribe/analytics';
import { authCopy } from '@scribe/content';
import { deletionSignInParams } from '../src/components/settings/open-deletion.logic';
import { signInBody } from '../src/lib/auth/sheet-body.logic';

const SRC = join(__dirname, '..', 'src');
const read = (...p: string[]) => readFileSync(join(SRC, ...p), 'utf8');
const bodies = authCopy.sheet.bodies;

describe('which body the sheet shows', () => {
  it('a cancel_deletion reason shows the cancel line, whatever the trigger; no reason shows the trigger\'s own body', () => {
    expect(signInBody(bodies, 'settings', 'cancel_deletion')).toBe(bodies.cancel_deletion);
    expect(signInBody(bodies, 'settings', undefined)).toBe(bodies.settings);
    expect(signInBody(bodies, 'invite', 'something_else')).toBe(bodies.invite);
  });
});

describe('what the deletion screen opens the sheet with', () => {
  it('a request that can still be cancelled carries the reason; one that cannot (executing, cancelled) does not promise it', () => {
    expect(deletionSignInParams('scheduled')).toEqual({ trigger: 'settings', reason: 'cancel_deletion' });
    expect(deletionSignInParams('held')).toEqual({ trigger: 'settings', reason: 'cancel_deletion' });
    expect(deletionSignInParams('executing')).toEqual({ trigger: 'settings' });
    expect(deletionSignInParams('cancelled')).toEqual({ trigger: 'settings' });
  });

  it('the trigger it sends is one the analytics catalog already lists', () => {
    expect(SIGN_IN_TRIGGER.values).toContain(deletionSignInParams('scheduled').trigger);
  });

  it('the screen and the sheet are wired to it', () => {
    expect(read('components', 'settings', 'open-deletion.tsx')).toContain("router.push({ pathname: '/sign-in', params: deletionSignInParams(request.state) })");
    const sheet = read('app', '(auth)', 'sign-in', 'index.tsx');
    expect(sheet).toContain('signInBody(s.bodies, trigger, params.reason)');
  });
});

describe('[BL-494 points 2 and 5a] the live-region node on the screen and its attach call', () => {
  const screen = read('components', 'settings', 'open-deletion.tsx');
  it('draws the last spoken line in a polite live region on Android, keyed so the same line is read again', () => {
    expect(screen).toContain("Platform.OS === 'android' && press.said ?");
    expect(screen).toContain('<Text key={press.said.n} accessibilityLiveRegion="polite"');
  });
  it('attaches the controller in the effect whose cleanup disposes it, so a development remount keeps it alive', () => {
    expect(screen).toMatch(/useEffect\(\(\) => \{\s*ctl\.attach\(\);\s*return \(\) => ctl\.dispose\(\);\s*\}, \[ctl\]\);/);
  });
});
