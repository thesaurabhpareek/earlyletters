# Native module gate: review checklist for media, background and transcode packages (BL-878)

Owner: `security` (builds the record), `security-architect` (reads the lockfile and plist diff). Satisfies NX-39-R52. Cited: SEC-ML-11, SEC-R10, CODE-R17, CODE-R18. Status: process row, no install, no founder hours.

This page records a review. It does not approve a dependency: adding one needs the founder's or Karma's approval on the PR (AIE-R21, CR-73) and its justification in the PR body (CODE-R17). The check at the bottom only proves the record exists.

## When it applies

A PR that adds or bumps a package with native code in `apps/mobile/package.json`, where the package does one of:

- media: library, picker, camera, video, audio capture or playback;
- background work: a background task, fetch or task-manager package;
- transcode: image or video conversion, compression, an ffmpeg wrapper, a speech model runtime.

Local modules under `apps/mobile/modules/**` follow `.claude/skills/expo-native-module/SKILL.md` instead; their reviewer is the same. A background-task package needs this review before any spike or dev build (SEC-ML-11, BL-854 plan).

## The checklist (every line, in the PR body, with evidence)

1. Lockfile diff reviewed. `package-lock.json` lines for the package and everything it newly pulls in are read; any new install script (`postinstall`, `preinstall`) is named. Evidence: the diff stat and the names of new transitive packages.
2. Prebuild diff attached. Run `npx expo prebuild --platform ios --no-install` on the branch and on `develop` in scratch directories and attach the diff of `Info.plist` and the `.entitlements` file. Evidence: the diff, or the word UNVERIFIED with the reason (no Mac, no prebuild run).
3. No new permission or background mode unless the founder accepted its purpose string. Read `node_modules/<pkg>/ios` for `requestAuthorization`, `requestAccess`, `PHPhotoLibrary`, `CLLocationManager` and similar. Any new `UIBackgroundModes`, app group or location entitlement stops the PR (BL-864). A permission call with no purpose string in the build can bring ITMS-90683.
4. No network permission listed. The package declares no `INTERNET` or `NSAppTransportSecurity` change, and its iOS source makes no `URLSession` call. Media code never fetches (NX-39).
5. Licence recorded. Permissive only (MIT, Apache-2.0, BSD, ISC); the SPDX id is in the table row. `npm run licences:verify` still passes.
6. Maintainer recorded. Who publishes it, and the repository. A single-maintainer package is named as such.
7. Exact version pin. The `package.json` entry is `1.2.3`, not `^1.2.3` or `~1.2.3`, so the lockfile and the reviewed source cannot drift. `npx expo install` writes a range; change it by hand and say so.
8. SDK 57 plugin output. The plugin options the app sets in `apps/mobile/app.config.ts` are listed, and the row says verified (prebuild run, diff attached) or UNVERIFIED (not run). UNVERIFIED is allowed; silence is not.
9. `security-architect` is asked for the read in the PR body (the roster's review paths do not route to it by themselves).

## Review ledger

One row per watched package. Columns: pin (`exact <version>` or `grandfathered range`), plugin output (starts with `verified` or `UNVERIFIED`), licence, maintainer, review (date and by whom).

| package | pin | plugin output | licence | maintainer | review |
|---|---|---|---|---|---|
| `expo-audio` | grandfathered range (`~57.0.5`, lockfile 57.0.5) | UNVERIFIED: no prebuild run for this row; `app.config.ts` sets `enableBackgroundPlayback: false` and `enableBackgroundRecording: false` so no `audio` background mode is intended (LEGAL-REQ-011) | MIT | 650 Industries, Inc. (Expo) | 2026-11-21 security, read of package.json and app.config.ts only; predates the gate |
| `whisper.rn` | grandfathered range (`~0.7.4`, lockfile 0.7.4) | UNVERIFIED: no prebuild run; no plugin entry in `app.config.ts` | MIT | Jhen-Jie Hong (single maintainer, from package.json author) | 2026-11-21 security, read of package.json only; predates the gate |

Not yet checked for either row: the iOS source for permission and network calls (checklist lines 3 and 4), and the prebuild plist diff. A later run should close these or leave them UNVERIFIED on purpose. Neither range is silently accepted: the next bump of either package pins it exactly.

Related, outside this ledger: `expo-notifications`, `expo-sharing`, `expo-print` and `expo-file-system` are not media, background-task or transcode packages by name; if one is later used for such work, add its name to `WATCHED` in the test.

## The check

`apps/mobile/test/native-module-gate.test.ts` fails when a dependency whose name matches the watched list has no complete row above, when a row lacks a licence, maintainer, date or verified/UNVERIFIED word, or when a package that is not grandfathered sits on a range. It runs in `npm test -w apps/mobile`. The grandfathered set is fixed by a second test; it does not grow. The test checks the record, not the quality of the review, and it cannot see a native package whose name is not on its list. Reviewers still read the lockfile diff.

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
