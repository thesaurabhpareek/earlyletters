/**
 * Red-team fixes on the account-first Welcome (10 Nov): the Welcome line claims nothing about phones or recordings,
 * the network is not watched in a servers-off build, one flag decides the co-parent door, and the Keychain wait is bounded.
 */
import { authCopy } from '@scribe/content';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESTORE_WAIT_MS, SIGN_IN_OUTAGE_MS, restoreBlocksScreen } from '../src/lib/first-run/gate.logic';
import { visibleCoParentDoors } from '../src/lib/family/entry.logic';
import { invitedDoorShown } from '../src/lib/first-run/welcome.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');

describe('[NX-36-S2] the Welcome line says only what is true before anyone has agreed to anything', () => {
  it('[NX-36-S2] it does not say the book opens, comes or moves to any phone, and says nothing of recordings', () => {
    const line = authCopy.sheet.bodies.sign_in_first;
    expect(line).not.toMatch(/any phone|new phone|another phone|opens|come with|moves|recording|safe|back(ed)? ?up/i);
    expect(line.length).toBeGreaterThan(0);
  });
});

describe('[NX-31-R19] the connection is read only where it is used', () => {
  it('[NX-31-R19] a servers-off build registers no network listener and reads no network state', () => {
    const online = src('lib', 'first-run', 'use-online.ts');
    expect(online).toMatch(/useOnline\(enabled: boolean\)/);
    expect(online).toMatch(/if \(!enabled\) return/);
    const route = src('lib', 'first-run', 'use-first-run-route.ts');
    expect(route).toMatch(/const active = serverFeaturesEnabled\(\) && auth\.configured;\n\s+const \{ online, recheck \} = useOnline\(active\);/);
  });
});

describe('[NX-38-R5] one function, in one place, decides each co-parent surface', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []));
  it('[NX-38-R5] `familySurfacesShown` is defined once in the app (entry.logic.ts: the Family tab and the Settings row), and the Welcome door is not it', () => {
    const defs = walk(join(__dirname, '..', 'src')).filter((f) => /export function familySurfacesShown\b|export const familySurfacesShown\b/.test(readFileSync(f, 'utf8')));
    expect(defs.map((f) => f.slice(f.indexOf('src/')))).toEqual(['src/lib/family/entry.logic.ts']);
    expect(existsSync(join(__dirname, '..', 'src', 'lib', 'family', 'surfaces.logic.ts'))).toBe(false);
    expect(src('lib', 'first-run', 'welcome.logic.ts')).not.toMatch(/INVITED_DOOR_IN_STORE_BUILD|CO_PARENT_IN_STORE_BUILD|familySurfacesShown\(/);
  });
  it('[NX-38-R5] the Welcome door is the join button\'s rule (B12-5) for every combination', () => {
    for (const alpha of [true, false]) for (const coParent of [true, false]) {
      expect(invitedDoorShown({ alpha, coParent })).toBe(visibleCoParentDoors(coParent, alpha).joinButton);
    }
  });
});

describe('[NX-31-R17] the first screen never waits on the Keychain for ever', () => {
  it('[NX-31-R17] restoring blocks the screen for at most the gate timeout, then the Welcome shows', () => {
    expect(RESTORE_WAIT_MS).toBe(SIGN_IN_OUTAGE_MS);
    expect(restoreBlocksScreen('restoring', 0)).toBe(true);
    expect(restoreBlocksScreen('restoring', RESTORE_WAIT_MS - 1)).toBe(true);
    expect(restoreBlocksScreen('restoring', RESTORE_WAIT_MS)).toBe(false);
    expect(restoreBlocksScreen('signedOut', 0)).toBe(false);
    expect(src('lib', 'first-run', 'use-first-run-route.ts')).toMatch(/setTimeout\(/);
  });
});
