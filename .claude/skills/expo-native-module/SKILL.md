---
name: expo-native-module
description: Build or review an Expo local native module in apps/mobile/modules (Swift on iOS): layout, the source-scan tests CI can run, the iOS compile job, permission and store rules, and who reviews. Use for any change there.
---

# Expo local native modules and the Swift scan (Early Letters)

Load this before you add or change anything under `apps/mobile/modules/**`, add a package with native iOS code, or review such a PR. A native module makes a card size L (`docs/product/prd/13-engineering-plan.md` section 1).

## 1. Sources of truth

| What | Where |
|---|---|
| Modules on `develop` | `apps/mobile/modules/scribe-audio`, `scribe-files`, `scribe-keys`, `scribe-store`; `scribe-photo` is in #834 (open) |
| Who builds, who reviews | `13-engineering-plan.md` section 2: `mobile` builds, `security-architect` reviews |
| Libraries and installs | the `mobile` charter (permissive licences, `npx expo install`); PRINCIPLES 3; CODE-R17, CODE-R18; AIE-R11 (check every API against the installed source) |
| The only place Swift compiles | `.github/workflows/ios-compile.yml`: `compile` (Debug, simulator) when native paths change; `launch` (Release JavaScript on a simulator) on every mobile change |
| Merge readiness | `scripts/agents/merge-queue.mjs` `NATIVE_PATHS` and `WATCH-RED`: a red macOS check holds a native PR |
| Device rows | `docs/qa/DEVICE_TEST_PLAN.md` S1-01 (first compile of each module) and S1-02 (modules load at runtime) |

## 2. Layout

`apps/mobile/modules/<scribe-name>/`: `expo-module.config.json` (platforms and module class names), `index.ts`, `ios/<Name>.podspec`, `ios/<Name>Module.swift`, and `android/` only when the module ships on Android. Read an existing module first and copy its shape.

- `index.ts` loads the native side with `requireOptionalNativeModule` from `expo`, as all four modules do, so the JavaScript still loads in Node tests and where the native side is absent. Callers handle `null`.
- Logic lives in TypeScript (`apps/mobile/src/lib/<area>/*.logic.ts`), pure and tested in Node. The Swift stays a thin adapter: take input, call the system, return plain values or a closed error code.

## 3. Tests CI can run (`npm test` never compiles Swift)

- Source-scan tests read the Swift as text and fail when a guard is removed or an API drifts. Patterns on `develop`: `apps/mobile/test/native-guards.test.ts` (its header says why), `backup-keys.test.ts` lines 454 to 460 (an exact CryptoKit call, and a call count), `no-system-indexing.test.ts` line 104 (walks every module file).
- Write one scan per invariant that matters: a forbidden call is absent, a required guard is present, the function names declared in Swift (`Function("x")`, `AsyncFunction("x")`) equal the ones `index.ts` types.
- A scan proves text, not behaviour. Name in the PR which rows still need `ios-compile.yml` and which need a phone.

## 4. Permission, privacy and store rules

- A linked module ships its calls in every build, whatever an `EXPO_PUBLIC_*` switch says. A permission call with no purpose string in the build can bring ITMS-90683 at upload. So no permission call ships unless the founder accepted the purpose string (Karma's ruling of 20 Nov on #833; NS-01-R2, NS-01-R22).
- Prefer system UI that needs no permission. One photo comes from `PHPickerViewController` presented by `scribe-photo`, never from `expo-image-picker` (same ruling; BL-931).
- Before adding a package with native code, read its iOS source under `node_modules/<pkg>/ios` for permission calls (`requestAuthorization`, `requestAccess`) and background modes. That is how #833's two reviews found `expo-image-picker`'s calls.
- No `UIBackgroundModes`, app group or location without a founder decision (BL-864; NS-04 EX-3 in `docs/product/prd/04-hands-free-capture-spike.md`).
- `security-architect` reads the plist, entitlement and lockfile diff (`docs/product/prd/01-photo-with-a-letter.md` line 140). The roster's review paths do not route `apps/mobile/modules/**` to it, so ask for that review in the PR body.

## 5. Before you ask for review

1. Focused tests, then `npm test -w apps/mobile`, then `npx tsc --noEmit` in `apps/mobile`.
2. The scan tests fail when you remove the guard they protect (try it, then restore it).
3. `ios-compile.yml` is green at the head, or the PR says it is red and why. A green compile is the first proof the Swift builds at all.
4. The PR names the device rows still owed, and asks `security-architect` for the native read.

## 6. Evidence this is repeated know-how

- Four modules on `develop` and a fifth in #834; source scans in three test files; the #833 ruling and its two reviews; #834's source scan that the binary carries no permission call; `13-engineering-plan.md` section 2 ("Native modules (Swift)"); the Low Power Mode guard, "New native module" (rank 36, N-13, `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`).
