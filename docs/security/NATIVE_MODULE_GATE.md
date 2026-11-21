# Native module gate: review checklist for media, background and transcode packages (BL-878)

Owner: `security` (builds the record), `security-architect` (reads the lockfile and plist diff). Satisfies NX-39-R52. Cited: SEC-R06, SEC-R07, SEC-R10, SEC-R16 (chapter 06), CODE-R17, CODE-R18. The backlog and a run sheet also cite `SEC-ML-11`; chapter 06 does not define it, so this page does not rely on it (raised with `security-architect` in the PR). Status: process row, no install, no founder hours.

This page records a review. It does not approve a dependency: adding one needs the founder's or Karma's approval on the PR (AIE-R21, CR-73) and its justification in the PR body (CODE-R17). The check at the bottom only proves the record exists.

## When it applies

A PR that adds or bumps a package with native code in `apps/mobile/package.json`, where the package does one of:

- media: library, picker, camera, video, audio capture or playback;
- background work: a background task, fetch or task-manager package;
- transcode: image or video conversion, compression, an ffmpeg wrapper, a speech model runtime.

Local modules under `apps/mobile/modules/**` follow `.claude/skills/expo-native-module/SKILL.md` instead; their reviewer is the same. A background-task package needs this review before any spike or dev build (BL-854 plan, run sheet `MEMORY-LIBRARY-SPIKES-RUNSHEET-10nov.md`).

## The checklist (every line, in the PR body, with evidence)

1. Lockfile diff reviewed. `package-lock.json` lines for the package and everything it newly pulls in are read; any new install script (`postinstall`, `preinstall`) is named. Evidence: the diff stat and the names of new transitive packages.
2. Prebuild diff attached. Run `npx expo prebuild --platform ios --no-install` on the branch and on `develop` in scratch directories and attach the diff of `Info.plist` and the `.entitlements` file. Evidence: the diff, or the word UNVERIFIED with the reason (no Mac, no prebuild run).
3. No new permission or background mode unless the founder accepted its purpose string. Read `node_modules/<pkg>/ios` for `requestAuthorization`, `requestAccess`, `PHPhotoLibrary`, `CLLocationManager` and similar. Any new `UIBackgroundModes`, app group or location entitlement stops the PR (BL-864). The microphone counts: look for `NSMicrophoneUsageDescription`, `AVAudioSession` and recording requests, and for any `audio` background mode, even where the app's own plugin options switch them off. A permission call with no purpose string in the build can bring ITMS-90683.
4. No network permission listed and no runtime download. The package declares no `INTERNET` or `NSAppTransportSecurity` change (SEC-R16: no cleartext, no `NSAllowsArbitraryLoads`), its native source makes no `URLSession` call, and its JavaScript (`src/`, `lib/`) has no `fetch`, `XMLHttpRequest` or download helper. A speech model or asset fetched at runtime is a network call even when the package declares nothing. Media code never fetches (NX-39).
5. Licence recorded. Permissive only (MIT, Apache-2.0, BSD, ISC); the SPDX id is in the table row. `npm run licences:verify` still passes.
6. Maintainer recorded. Who publishes it, and the repository. A single-maintainer package is named as such.
5b. Vendored binaries. List every prebuilt `.xcframework`, `.a`, `.so`, `.aar`, `.dylib` or model file in the package (`find node_modules/<pkg> -name '*.xcframework' -o -name '*.a' -o -name '*.so' -o -name '*.aar'`). Record where each came from and its checksum against the upstream release (SEC-R10: downloaded binaries are checksum-verified). Also record `optionalDependencies`, `npm ls <pkg>` dependents, and that `resolved` in the lockfile is registry.npmjs.org (SEC-R06). A binary with no provenance is UNVERIFIED, not passed.
7. Exact version pin. The `package.json` entry is `1.2.3`, not `^1.2.3` or `~1.2.3`, so the lockfile and the reviewed source cannot drift. `npx expo install` writes a range; change it by hand and say so.
8. SDK 57 plugin output. The plugin options the app sets in `apps/mobile/app.config.ts` are listed, and the row says verified (prebuild run, diff attached) or UNVERIFIED (not run). UNVERIFIED is allowed; silence is not.
9. `security-architect` is asked for the read in the PR body (the roster's review paths do not route to it by themselves).

## Review ledger

One row per watched package. Columns: pin (`exact <version>`, or for the two grandfathered packages `grandfathered range, locked <lockfile version>, repin by <date>`), plugin output (`verified: <evidence>` or `UNVERIFIED: <reason>`), licence (an SPDX id: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause or ISC), maintainer (a name or a url), review (a real date, then who).

| package | pin | plugin output | licence | maintainer | review |
|---|---|---|---|---|---|
| `expo-audio` | grandfathered range, locked 57.0.5, repin by 2027-02-28 (package.json `~57.0.5`) | UNVERIFIED: no prebuild run for this row; `app.config.ts` sets `enableBackgroundPlayback: false` and `enableBackgroundRecording: false` so no `audio` background mode is intended (LEGAL-REQ-011) | MIT | 650 Industries, Inc. (Expo) | 2026-11-21 security, read of package.json and app.config.ts only; predates the gate |
| `whisper.rn` | grandfathered range, locked 0.7.4, repin by 2027-02-28 (package.json `~0.7.4`) | UNVERIFIED: no prebuild run; no plugin entry in `app.config.ts` | MIT | Jhen-Jie Hong (single maintainer, from package.json author) | 2026-11-21 security, read of package.json only; predates the gate |

Not yet checked for either row: the iOS source for permission, microphone and network calls (lines 3 and 4), vendored binaries (line 5b; `whisper.rn` ships `ios/rnwhisper.xcframework`, provenance and checksum not checked), whether it downloads models at runtime, npm's `maintainers` list, and the prebuild plist diff. Each stays UNVERIFIED until someone runs it. The ranges have a way out in code: a lockfile bump of either package fails the test until the row is re-reviewed and pinned exactly, and both fail after 2027-02-28 whatever happens.

Related, outside this ledger: `expo-notifications`, `expo-sharing`, `expo-print` and `expo-file-system` are not media, background-task or transcode packages by name; if one is later used for such work, add its name to `WATCHED` in the test.

## The check

`apps/mobile/test/native-module-gate.test.ts` reads `apps/mobile/package.json` and the root `package.json` (dependencies, dev, optional and peer, including the target of an `npm:` alias) and fails when:

- a dependency whose name matches the watched list has no row;
- a licence is not one of the five SPDX ids above, or the maintainer is a placeholder or a single word, or the plugin cell is not `verified: ` or `UNVERIFIED: ` followed by a real reason, or the date is not a real, non-future date;
- an exact pin in `package.json` differs from the row;
- a package other than `expo-audio` or `whisper.rn` sits on a range;
- a grandfathered package's lockfile version differs from the version the row records, or its repin date has passed.

It runs in `npm test -w apps/mobile`. The grandfathered set is fixed in the test and checked against the ledger. The test checks the record, not the quality of the review: it cannot tell whether a `verified:` claim is true, and it cannot see a native package whose name is not on its list or that lives in another workspace. Reviewers still read the lockfile diff and the plist diff.

## Proposed CODEOWNERS entry (not applied: `.github/` is not agent-editable)

Routing only while one account owns every area (`docs/ops/proposed/codeowners-lines.md`). Proposed lines for the founder to append to `.github/CODEOWNERS`:

```
# Native dependency gate (BL-878, NX-39-R52): lockfile and prebuild inputs
/package-lock.json                  @thesaurabhpareek
/apps/mobile/package.json           @thesaurabhpareek
/apps/mobile/app.config.ts          @thesaurabhpareek
/docs/security/NATIVE_MODULE_GATE.md @thesaurabhpareek
```

When more than one person owns code, the first three go to the `security-architect` human.

## Done when

This page is merged and BL-854, BL-871, BL-874 and BL-875 cite it in their PR bodies (they are the rows that would add a media, background or transcode package). Those citations are theirs to add; this PR does not edit them.
