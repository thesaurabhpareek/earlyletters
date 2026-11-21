/// <reference types="node" />
/**
 * BL-864 (NX-39-R4, NX-39-R51): the plist and project lint of the store preflights. Each rule has a positive
 * control (the bad input is found) and the clean input stays clean.
 */
import { describe, expect, it } from 'vitest';
import { forbiddenNativeProblems } from '../scripts/preflight-lib.mjs';

const wrap = (body: string) => `<?xml version="1.0"?><plist version="1.0"><dict>${body}</dict></plist>`;
const CLEAN = wrap('<key>NSMicrophoneUsageDescription</key><string>x</string><key>NSFaceIDUsageDescription</key><string>y</string>');
const ids = (a: Parameters<typeof forbiddenNativeProblems>[0]) => forbiddenNativeProblems(a).map((p: { id: string }) => p.id);
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
    expect(ids({ plist: CLEAN, pbxproj: 'path = System/Library/Frameworks/CoreLocation.framework;' })).toEqual(['core-location']);
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
      expect(ids({ pbxproj: `productType = "${t}";` })).toEqual(['extension-target']);
    }
  });
  it('[NX-39-R51] the application product type is not an extension', () => {
    expect(ids({ pbxproj: 'productType = "com.apple.product-type.application";' })).toEqual([]);
  });
});
