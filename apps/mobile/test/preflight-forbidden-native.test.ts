/// <reference types="node" />
/**
 * BL-864 (NX-39-R4, NX-39-R51): the plist and project lint of the store preflights. Each rule has a positive
 * control (the bad input is found) and the clean input stays clean.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { forbiddenNativeProblems } from '../scripts/preflight-lib.mjs';

const wrap = (body: string) => `<?xml version="1.0"?><plist version="1.0"><dict>${body}</dict></plist>`;
const CLEAN = wrap('<key>NSMicrophoneUsageDescription</key><string>x</string><key>NSFaceIDUsageDescription</key><string>y</string>');
type In = { plist?: string; entitlements?: string; pbxproj?: string; library?: { flagOn: boolean; content: string | null } };
const ENT_OK = '<plist><dict><key>com.apple.developer.default-data-protection</key><string>x</string></dict></plist>';
const PBX_OK = 'PBXProject productType = "com.apple.product-type.application";';
/** Inputs a clean build has; each test overrides only what it is about. */
const ids = (a: In) => forbiddenNativeProblems({ plist: CLEAN, entitlements: ENT_OK, pbxproj: PBX_OK, ...a }).map((p: { id: string }) => p.id);
const STR = 'Pick a photo to keep with a letter.';
const lib = (body: string) => wrap(`<key>NSPhotoLibraryUsageDescription</key><string>${STR}</string>${body}`);
const ALERT = '<key>PHPhotoLibraryPreventAutomaticLimitedAccessAlert</key><true/>';

describe('[NX-39-R4] the plist adds keys only for the phases that are on', () => {
  it('[NX-39-R4] a clean plist has no problem', () => expect(ids({ plist: CLEAN })).toEqual([]));
  it('[NX-39-R4] any UIBackgroundModes fails, even an empty array', () => {
    expect(ids({ plist: wrap('<key>UIBackgroundModes</key><array><string>audio</string></array>') })).toEqual(['background-modes']);
    expect(ids({ plist: wrap('<key>UIBackgroundModes</key><array/>') })).toEqual(['background-modes']);
  });
  it('[NX-39-R4] BGTaskSchedulerPermittedIdentifiers fails', () => {
    expect(ids({ plist: wrap('<key>BGTaskSchedulerPermittedIdentifiers</key><array/>') })).toEqual(['bg-task-identifiers']);
  });
  it('[NX-39-R4] every NSLocation key fails', () => {
    expect(ids({ plist: wrap('<key>NSLocationWhenInUseUsageDescription</key><string>x</string>') })).toEqual(['location']);
    expect(ids({ plist: wrap('<key>NSLocationAlwaysAndWhenInUseUsageDescription</key><string>x</string>') })).toEqual(['location']);
  });
  it('[NX-39-R4] NSPhotoLibraryAddUsageDescription fails', () => {
    expect(ids({ plist: wrap('<key>NSPhotoLibraryAddUsageDescription</key><string>x</string>') })).toEqual(['photo-add']);
  });
  it('[NX-39-R4] the library key fails with its flag off, or with no agreed content string', () => {
    expect(ids({ plist: lib(ALERT), library: { flagOn: false, content: STR } })).toEqual(['photo-library']);
    expect(ids({ plist: lib(ALERT), library: { flagOn: true, content: null } })).toEqual(['photo-library']);
    expect(ids({ plist: lib(ALERT) })).toEqual(['photo-library']);
  });
  it('[NX-39-R4] the library key fails when its value differs from the content string', () => {
    expect(ids({ plist: lib(ALERT), library: { flagOn: true, content: `${STR} More.` } })).toEqual(['photo-library']);
  });
  it('[NX-39-R4] the library key passes with its flag on, the exact string and the limited-access alert true', () => {
    expect(ids({ plist: lib(ALERT), library: { flagOn: true, content: STR } })).toEqual([]);
  });
  it('[NX-39-R4] the limited-access alert key must be true when the library key exists or when it is present', () => {
    const on = { flagOn: true, content: STR };
    expect(ids({ plist: lib(''), library: on })).toEqual(['limited-alert']);
    expect(ids({ plist: lib('<key>PHPhotoLibraryPreventAutomaticLimitedAccessAlert</key><false/>'), library: on })).toEqual(['limited-alert']);
    expect(ids({ plist: wrap('<key>PHPhotoLibraryPreventAutomaticLimitedAccessAlert</key><false/>') })).toEqual(['limited-alert']);
  });
  it('[NX-39-R4] a project that links CoreLocation fails', () => {
    expect(ids({ plist: CLEAN, pbxproj: `${PBX_OK} path = System/Library/Frameworks/CoreLocation.framework;` })).toEqual(['core-location']);
  });
});

describe('[NX-39-R51] no widget, share extension, notification extension or app group exists', () => {
  const ent = (k: string) => `<plist><dict><key>${k}</key><array><string>group.x</string></array></dict></plist>`;
  it('[NX-39-R51] an application-groups entitlement fails; other entitlements do not', () => {
    expect(ids({ entitlements: ent('com.apple.security.application-groups') })).toEqual(['app-group']);
    expect(ids({ entitlements: ent('com.apple.developer.associated-domains') })).toEqual([]);
  });
  it('[NX-39-R51] a widget, share or notification extension target fails', () => {
    for (const t of ['com.apple.product-type.app-extension', 'com.apple.product-type.extensionkit-extension', 'com.apple.widgetkit-extension', 'com.apple.usernotifications.service', 'com.apple.share-services']) {
      expect(ids({ pbxproj: `PBXProject productType = "${t}";` })).toEqual(['extension-target']);
    }
  });
  it('[NX-39-R51] the application product type is not an extension', () => {
    expect(ids({ pbxproj: PBX_OK })).toEqual([]);
  });
});

describe('[NX-39-R4] the lint fails closed on an input it cannot read', () => {
  const bad: unknown[] = [undefined, null, '', '   ', 42, 'not a plist'];
  for (const [field, id] of [['plist', 'missing-plist'], ['entitlements', 'missing-entitlements'], ['pbxproj', 'missing-pbxproj']] as const) {
    it(`[NX-39-R4] a missing, empty or unreadable ${field} is a problem`, () => {
      for (const v of bad) expect(ids({ [field]: v } as In), `${field} = ${JSON.stringify(v)}`).toEqual([id]);
    });
  }
  it('[NX-39-R4] no input at all is three problems, not a clean result', () => {
    expect(forbiddenNativeProblems({}).map((p: { id: string }) => p.id)).toEqual(['missing-plist', 'missing-entitlements', 'missing-pbxproj']);
    expect(forbiddenNativeProblems().map((p: { id: string }) => p.id)).toHaveLength(3);
  });
  it('[NX-39-R4] positive control: readable inputs with nothing forbidden are clean', () => expect(ids({})).toEqual([]));
});

describe('[NX-39-R51] the testflight preflight runs the lint and a problem fails the run (source match, not a run)', () => {
  const src = readFileSync(join(__dirname, '..', 'scripts', 'preflight-testflight.mjs'), 'utf8');
  it('[NX-39-R51] it imports forbiddenNativeProblems and calls it with the generated plist, entitlements and project', () => {
    expect(src).toMatch(/import \{[^}]*\bforbiddenNativeProblems\b[^}]*\} from '\.\/preflight-lib\.mjs'/);
    expect(src).toMatch(/const forbidden = forbiddenNativeProblems\(\{\s*plist:\s*ios\.plist,\s*entitlements:\s*ios\.entitlements,\s*pbxproj:\s*ios\.pbxproj\s*\}\)/);
  });
  it('[NX-39-R51] every problem is recorded as a FAIL, and any FAIL exits non-zero', () => {
    expect(src).toMatch(/for \(const p of forbidden\) fail\(/);
    expect(src).toMatch(/process\.exit\(count\('FAIL'\) \? 1 : 0\)/);
  });
});
