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
  it('[NX-39-R4] the library key fails when the flag is merely truthy, not true', () => {
    for (const flagOn of ['false', 'yes', 1, {}]) expect(ids({ plist: lib(ALERT), library: { flagOn, content: STR } as never })).toEqual(['photo-library']);
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
  it('[BL-1414] UIFileSharingEnabled or LSSupportsOpeningDocumentsInPlace set true fails with its own id', () => {
    expect(ids({ plist: wrap('<key>UIFileSharingEnabled</key><true/>') })).toEqual(['file-sharing']);
    expect(ids({ plist: wrap('<key>LSSupportsOpeningDocumentsInPlace</key><true />') })).toEqual(['open-in-place']);
    expect(ids({ plist: wrap('<key>UIFileSharingEnabled</key><true/><key>LSSupportsOpeningDocumentsInPlace</key><true/>') })).toEqual(['file-sharing', 'open-in-place']);
  });
  it('[BL-1414] either key present with a value that is not an explicit false fails closed', () => {
    expect(ids({ plist: wrap('<key>UIFileSharingEnabled</key><string>YES</string>') })).toEqual(['file-sharing']);
    expect(ids({ plist: wrap('<key>LSSupportsOpeningDocumentsInPlace</key><array/>') })).toEqual(['open-in-place']);
  });
  it('[BL-1414] a plist with neither key, or with both set false, passes', () => {
    expect(ids({ plist: CLEAN })).toEqual([]);
    expect(ids({ plist: wrap('<key>UIFileSharingEnabled</key><false/><key>LSSupportsOpeningDocumentsInPlace</key><false/>') })).toEqual([]);
  });
  it('[BL-1414] the problem text names the key and never prints a value from the plist', () => {
    const secret = 'sb_secret_PLANTEDVALUE123';
    const out = forbiddenNativeProblems({ plist: wrap(`<key>UIFileSharingEnabled</key><string>${secret}</string>`), entitlements: ENT_OK, pbxproj: PBX_OK });
    expect(out.map((p: { id: string }) => p.id)).toEqual(['file-sharing']);
    expect(JSON.stringify(out)).not.toContain(secret);
    expect(JSON.stringify(out)).not.toContain('PLANTEDVALUE');
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

describe('[NSC-02] the plist and entitlement allowlist (BL-1046)', () => {
  const ent = (...k: string[]) => `<plist><dict>${k.map((x) => `<key>${x}</key><string>v</string>`).join('')}</dict></plist>`;
  const ATS_OK = '<key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><false/><key>NSAllowsLocalNetworking</key><true/></dict>';
  const ROUTER = '$(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route';
  it('[NSC-02] the three entitlements the build uses pass', () => {
    expect(ids({ entitlements: ent('com.apple.developer.default-data-protection', 'com.apple.developer.applesignin', 'com.apple.developer.associated-domains') })).toEqual([]);
  });
  it('[NSC-02] any other entitlement fails, naming it (push, iCloud, keychain group, Siri)', () => {
    for (const k of ['aps-environment', 'com.apple.developer.icloud-services', 'keychain-access-groups', 'com.apple.developer.siri']) {
      const out = forbiddenNativeProblems({ plist: CLEAN, entitlements: ent('com.apple.developer.applesignin', k), pbxproj: PBX_OK });
      expect(out.map((p: { id: string }) => p.id)).toEqual(['entitlement']);
      expect(out[0].text).toContain(k);
    }
  });
  it('[NSC-02] an app group is reported once, by its own rule', () => {
    expect(ids({ entitlements: ent('com.apple.security.application-groups') })).toEqual(['app-group']);
  });
  it('[NSC-02] NSUserActivityTypes passes with expo-router\'s entry alone, fails with any other', () => {
    const acts = (...t: string[]) => wrap(`<key>NSUserActivityTypes</key><array>${t.map((x) => `<string>${x}</string>`).join('')}</array>`);
    expect(ids({ plist: acts(ROUTER) })).toEqual([]);
    expect(ids({ plist: acts(ROUTER, 'com.example.asha.open-letter') })).toEqual(['user-activity']);
    expect(ids({ plist: acts('com.example.asha.open-letter') })).toEqual(['user-activity']);
  });
  it('[NSC-02] NSUserActivityTypes that is not a readable array fails closed', () => {
    expect(ids({ plist: wrap('<key>NSUserActivityTypes</key><string>x</string>') })).toEqual(['user-activity']);
  });
  it('[NSC-02] a camera usage string fails with its own id', () => {
    expect(ids({ plist: wrap('<key>NSCameraUsageDescription</key><string>x</string>') })).toEqual(['camera']);
  });
  it('[SEC-R16] the transport-security block passes when arbitrary loads is false and local networking is the only other key', () => {
    expect(ids({ plist: wrap(ATS_OK) })).toEqual([]);
    expect(ids({ plist: wrap('<key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><false/></dict>') })).toEqual([]);
  });
  it('[SEC-R16] arbitrary loads true, an exception domain, or web-content loads fail', () => {
    const t = (inner: string) => wrap(`<key>NSAppTransportSecurity</key><dict>${inner}</dict>`);
    expect(ids({ plist: t('<key>NSAllowsArbitraryLoads</key><true/>') })).toEqual(['ats']);
    expect(ids({ plist: t('<key>NSAllowsArbitraryLoads</key><false/><key>NSExceptionDomains</key><dict><key>localhost</key><dict><key>NSExceptionAllowsInsecureHTTPLoads</key><true/></dict></dict>') })).toEqual(['ats']);
    expect(ids({ plist: t('<key>NSAllowsArbitraryLoadsInWebContent</key><true/>') })).toEqual(['ats']);
    expect(ids({ plist: t('<key>NSAllowsArbitraryLoads</key><string>NO</string>') })).toEqual(['ats']);
  });
  it('[SEC-R16] a transport-security key that is not a dict fails closed', () => {
    expect(ids({ plist: wrap('<key>NSAppTransportSecurity</key><string>x</string>') })).toEqual(['ats']);
  });
  it('[NSC-02] the production preflight and the allowlist export agree on the list (change the list only with security-architect)', async () => {
    const { ENTITLEMENT_ALLOWLIST } = await import('../scripts/preflight-lib.mjs');
    expect([...ENTITLEMENT_ALLOWLIST].sort()).toEqual(['com.apple.developer.applesignin', 'com.apple.developer.associated-domains', 'com.apple.developer.default-data-protection']);
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
