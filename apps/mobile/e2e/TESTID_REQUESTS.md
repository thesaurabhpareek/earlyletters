# Requests to app owners: testIDs, e2e seams and build settings

Owner of this list: qa-e2e. Written 3 Oct 2026. The flows in `flows/` select **only** by these ids (never by words from `packages/content`), so copy can change without breaking a test. Nothing here has been added to app code: the qa-e2e agent edits only `apps/mobile/e2e/**`, `docs/qa/**` and `docs/ops/RELEASE.md`. The coordinator assigns each block to the owner of the file.

Fact found on 3 Oct 2026: `apps/mobile/src` has **zero** `testID` props on screens (the only two are pass-throughs in `components/platform/toggle*.tsx`), and no e2e seam exists. Until sections 1 to 3 land, every flow fails at its first `id:` selector. `bin/lint-flows.mjs` checks that every id a flow uses is listed here.

## 0. Conventions

- Name: `<screen>.<element>`, lower camel case parts, dots between (`gate.yes`, `review.save.book`). Maestro treats `id` as a regex, so a dot also matches any character; ids are chosen so that never collides.
- Repeated rows (letters, children, members) share one id; flows pick one with `index:` (0-based, top to bottom).
- State that a flow must read goes **in the id suffix** where noted (for example `language.row.hi.status.installed`), because reading words would tie tests to copy.
- testIDs are inert in release builds (they become `accessibilityIdentifier`, which VoiceOver never reads), so they ship in every profile. Nothing else from section 3 may ship in `production`.

## 1. Primitives that must forward `testID` (design owner: `apps/mobile/src/components/ui`)

| Component | Today | Request |
|---|---|---|
| `Button`, `IconButton`, `TextField`, `Card` | forward `...props` (testID works) | none |
| `ListRow` (`ui/list-row.tsx`) | props are destructured; testID dropped | add `testID?: string`, set it on the `Pressable` (or the static `View`) |
| `ChoiceGroup` (`ui/choice-group.tsx`) | no testID | add `testID?: string`; each option gets `${testID}.${option.value}` |
| `Chip` (`ui/choice-group.tsx`) | no testID | add `testID?: string` on the `AnimatedPressable` |
| Settings-local `Row`, `ToggleRow`, `Section` (`app/settings/privacy.tsx`, `plus.tsx`, `account.tsx`, `delete-account.tsx`, `export.tsx`) | no testID | add `testID?: string`; `ToggleRow` puts it on the switch (`components/platform/toggle` already forwards it) |
| `LanguageRow` (`components/language/language-row.tsx`) | no testID | see section 2, Settings > Spoken language |
| `LetterCard` (`components/book/letter-card.tsx`) | no testID | `book.letter` on the card; `book.letter.waitingForWords` on the waiting line; `book.letter.private` on the private chip |
| `ChildSwitcher`, `WhoseBookSheet` (`components/child/*`) | no testID | section 2 |
| `PlusGate` (`components/child/plus-gate.tsx`) | no testID | section 2 |
| `AudioPlayer` (`components/player/*`) | not checked | `player.play` on the play/pause control |

## 2. Screen ids

Column "Flows" names the flow files that use the id (E2E-nn). Ids marked *(optional)* are not used yet but keep the naming whole.

### Entry: 18+ gate (`components/gate/age-gate-screen.tsx`)
| testID | Element | Flows |
|---|---|---|
| `gate.screen` | question view `ScrollView` | 01, 02, 12, 13, 15 |
| `gate.yes` | Yes segment (radio) | 01, 02, 13, 15 |
| `gate.no` | No segment (radio) | 01 |
| `gate.continue` | Continue button (disabled until a choice: this is how flows prove nothing is preselected) | 01, 02, 13, 15 |
| `gate.stop` | stop view root | 01 |
| `gate.stop.mistake` | "I answered by mistake" button (only after 24 h) | 01 |

### Tabs (`app/(tabs)/_layout.tsx`)
Set `tabBarButtonTestID` per screen: `tab.tonight`, `tab.book`, `tab.family`. The custom iOS `tabBarButton` spreads its props onto the `Pressable`, so the id should arrive; check once. Flows: almost all.

### First run (`app/onboarding.tsx`)
| testID | Element | Flows |
|---|---|---|
| `onboarding.step.welcome`, `onboarding.step.promise`, `onboarding.step.child`, `onboarding.step.signsAs`, `onboarding.step.finish` | the step's `Animated.View`, id `onboarding.step.<step>` | 02, 12, 13 |
| `onboarding.cta` | the full-width Continue / Start button (all steps) | 02, 12, 13, 15 |
| `onboarding.back` | Back | *(optional)* |
| `onboarding.welcome.signIn`, `onboarding.welcome.invited` | the two quiet buttons on the welcome step | 12, 13 |
| `onboarding.child.name.<i>` (`onboarding.child.name.0` to `onboarding.child.name.5`) | each name `TextField` | 02, 15 |
| `onboarding.child.remove.<i>` (1 to 5) | remove buttons | *(optional)* |
| `onboarding.child.addAnother` | "Add another child" | 02 |
| `onboarding.child.when` | ChoiceGroup: options `onboarding.child.when.born`, `onboarding.child.when.expecting` | 02 |
| `onboarding.child.date` | the date picker | *(optional)* |
| `onboarding.signsAs.input` | signature field | 02, 15 |
| `onboarding.signsAs.example.<i>` | example chips | *(optional)* |
| `onboarding.language` | Spoken language row | 05 |

### Language picker (`components/language/language-picker.tsx`)
`languagePicker.sheet`, `languagePicker.option.<code>` (`en`, `hi`, `es`, `zh`, `fr`, `ar`, `pt`), `languagePicker.close`. Flows: 05.

### Tonight (`app/(tabs)/index.tsx`)
| testID | Element | Flows |
|---|---|---|
| `tonight.screen` | root `ScrollView` | 02, 03, 04, 13, 15 |
| `tonight.speak`, `tonight.type` | the two capture buttons | 03, 04, 15 |
| `tonight.notMuch`, `tonight.notMuch.saved` | "Not much today" and its saved line | *(optional)* |
| `tonight.newPrompt` | Another thought | *(optional)* |
| `tonight.waiting` | the "waiting to be read back" card | 03 |

### Listening (`app/listen.tsx`)
`listen.screen`, `listen.timer`, `listen.pause`, `listen.finish`, `listen.discard`, `listen.denied`, `listen.denied.type`. Flows: 03, 15.

### Review (`app/review.tsx`)
| testID | Element | Flows |
|---|---|---|
| `review.screen` | root | 03, 04 |
| `review.body.transcribing`, `review.body.ready`, `review.body.waiting`, `review.body.saved` | the body `ScrollView`, id carries the phase | 03, 04 |
| `review.firstNote`, `review.firstNote.dismiss` | "Please have a read" card and its button | 04 |
| `review.to` | "To {child}" control (opens Whose book) | *(optional)* |
| `whoseBook.option` | each book in the Whose book sheet (repeated) | *(optional)* |
| `review.play` | play the recording | *(optional)* |
| `review.edit` (repeated), `review.edit.putBack` | an underlined machine edit; Put it back | *(optional)* |
| `review.save.book`, `review.save.private` | Add to {child}'s book; Keep it private | 04 |
| `review.keepVoice` | keep the recording as a letter waiting for its words | 03 |
| `review.type`, `review.retry` | type instead; try again | *(optional)* |
| `review.saved` | the saved card (tap to leave) | 03 |
| `review.saveFailed` | the save-failed line | *(optional)* |

### Write (`app/write.tsx`)
`write.screen`, `write.input`, `write.save`, `write.close`, `write.status`. Flows: 04.

### Sign-in and consent (`app/(auth)/sign-in/*`)
| testID | Element | Flows |
|---|---|---|
| `signIn.sheet` | sheet root (also the Keep the book sheet after the first letter) | 03, 12, 13 |
| `signIn.apple`, `signIn.google`, `signIn.email`, `signIn.passkey`, `signIn.later` | the ways in, and Not now | 03, 12, 13 |
| `signInEmail.input`, `signInEmail.send` | email step | 12, 13 |
| `signInCode.screen`, `signInCode.input`, `signInCode.verify`, `signInCode.resend` | check-your-email step | 12, 13 |
| `signInVerify.screen` | link-opened step | 12 (link variant) |
| `consent.terms`, `consent.terms.agree`, `consent.terms.notNow` | Terms sheet | 12, 13 |
| `consent.age.yes`, `consent.age.no` | age re-ask | 12, 13 |
| `consent.sensitive`, `consent.sensitive.agree`, `consent.sensitive.decline` | sensitive-data sheet | 12, 13 |
| `consent.failed` | "couldn't finish setting up" state | 12 |

### Book (`app/(tabs)/book.tsx`, `components/child/child-switcher.tsx`)
| testID | Element | Flows |
|---|---|---|
| `book.screen` | root | 02, 06, 08 |
| `book.childSwitcher` | "FOR ASHA" control | 02, 07 |
| `book.settings` | gear | most |
| `book.readTogether` | Read together button | 06 |
| `book.empty` | empty state | *(optional)* |
| `book.letter` (repeated), `book.letter.waitingForWords`, `book.letter.private` | via `LetterCard` | 03, 04, 08, 10 |
| `switcher.sheet`, `switcher.child` (repeated), `switcher.addChild`, `switcher.close` | switcher modal | 02, 07 |

### Letter (`app/letter/[id].tsx`)
`letter.screen`, `letter.text`, `letter.waitingForWords`, `letter.signature`, `letter.togglePrivate`, `letter.delete`, `letter.deleted` (the undo banner), `letter.undo`, `letter.size`. Flows: 03, 04, 08.

### Read together and the Plus gate (`app/read-together.tsx`, `components/child/plus-gate.tsx`)
`readTogether.screen`, `readTogether.close`, `readTogether.next`, `readTogether.previous`, `readTogether.finish`, `readTogether.again`, `readTogether.empty`; `plusGate.screen`, `plusGate.subscribe`, `plusGate.note`, `plusGate.notNow`. Flows: 06, 07, 14.

### Add a child (`components/child/add-child-form.tsx`)
`addChild.screen`, `addChild.name`, `addChild.when` (ChoiceGroup), `addChild.save`. Flows: 07.

### Family and invites (`app/(tabs)/family.tsx`, `app/invite/*`)
| testID | Element | Flows |
|---|---|---|
| `family.screen`, `family.member` (repeated), `family.invite`, `family.pending` (repeated), `family.pending.shareAgain`, `family.pending.cancel`, `family.finishSetup` | Family tab | 13 |
| `inviteNew.screen`, `inviteNew.share`, `inviteNew.close` | invite a co-parent | 13 |
| `invite.screen`, `invite.paste.input`, `invite.paste.continue`, `invite.joining`, `invite.joined`, `invite.open`, `invite.error`, `invite.close` | I was invited | 13 |

### Settings home (`app/settings/index.tsx`)
`settings.screen`, `settings.account`, `settings.plan`, `settings.child` (repeated), `settings.addChild`, `settings.language`, `settings.reminders`, `settings.appearance`, `settings.privacy`, `settings.export`, `settings.recordings`, `settings.storage`, `settings.deleteAccount`, `settings.help`, `settings.struggling`, `settings.terms`, `settings.privacyPolicy`, `settings.licences`, `settings.version`. Flows: 05, 07, 09, 10, 11, 12, 14, 15.

### Settings screens
| Screen | testIDs | Flows |
|---|---|---|
| Account (`settings/account.tsx`) | `account.screen`, `account.signedOut`, `account.signIn`, `account.signedIn`, `account.sync`, `account.finishSetup`, `account.signOut` | 09, 12 |
| Plan (`settings/plus.tsx`) | `plan.screen`, `plan.status.free`, `plan.status.plus` (id carries the state), `plan.seePlans`, `plan.manage`, `plan.restore`, `plan.refund`, `plan.message` | 14 |
| Spoken language (`settings/language.tsx`, `language-row.tsx`) | `language.screen`, `language.row.<code>`, status line `language.row.<code>.status.<state>` where state is `bundled`, `installed`, `downloading`, `absent`, or `waiting-<reason>` with the `PackFailure` reason (`waiting-offline`, `waiting-waiting_for_wifi`, `waiting-downloads_paused`, `waiting-no_space`, `waiting-no_manifest`, ...); `language.row.<code>.retry`, `language.row.<code>.remove`, `language.add` | 05 |
| Storage (`settings/storage.tsx`) | `storage.screen`, `storage.pack.<packId>` (for example `storage.pack.text-rules.hi`), `storage.pack.<packId>.remove`, `storage.inProgress.<packId>`, `storage.cellular` | 05 |
| Privacy (`settings/privacy.tsx`) | `privacy.screen`, `privacy.analytics` (the switch), `privacy.sensitive` | 11 |
| Export (`settings/export.tsx`) | `export.screen`, `export.start`, `export.progress`, `export.cancel`, `export.ready`, `export.share`, `export.error` | 10 |
| Delete account (`settings/delete-account.tsx`) | `deleteAccount.screen`, `deleteAccount.signedOut`, `deleteAccount.exportFirst`, `deleteAccount.subscription`, `deleteAccount.continue`, `deleteAccount.confirm.input`, `deleteAccount.confirm.button`, `deleteAccount.scheduled`, `deleteAccount.cancel`, `deleteAccount.signOut` | 09 |
| Reminders (`settings/reminders.tsx`) | `reminders.screen`, `reminders.toggle`, `reminders.priming.continue` | *(device plan)* |

### Not mounted yet (product gaps found while writing the flows)
- The **analytics consent sheet** (`components/consent/analytics-consent-sheet.tsx`) is not rendered by any route, and no ask sequencer exists (PRD-REQ-001: Keep the book, then reminders, then analytics, one per session). E2E-11 tests the Settings switch and keeps the sheet steps as a marked pending block. When the sheet is mounted: `consentSheet.screen`, `consentSheet.yes`, `consentSheet.no`.
- The **reminder priming card** after the first letter (C-REQ-001) is only reachable from Settings > Reminders; Tonight never shows it.
- There is **no Recently deleted screen**; deletion has an Undo on the letter only. E2E-08 covers Undo and notes the gap (DATA-REQ-010 30-day restore UI).

## 3. E2E seams (mobile owner; one new file, for example `src/lib/e2e.ts`)

The flows pass these as Maestro `launchApp.arguments`. On iOS they arrive in `NSUserDefaults` (Maestro docs: "arguments arrive as strings via `UserDefaults.standard.dictionaryRepresentation()`"); React Native's `Settings.get(key)` reads exactly that dictionary (verified in `react-native@0.86.3`, `Libraries/Settings/RCTSettingsManager.mm`). Launch arguments live in the argument domain only, so a relaunch without them is a normal launch.

**Hard rule:** every seam is active only when `process.env.EXPO_PUBLIC_E2E === '1'` **and** `APP_ENV !== 'production'` (`lib/build-env.ts`). Because `EXPO_PUBLIC_*` values are inlined, the production bundle must not contain the code at all; add a release check that `main.jsbundle` has no `e2eSeed` string (request to the platform owner, alongside `scripts/size/measure.ts`).

| Argument | Values | Effect | Used by |
|---|---|---|---|
| `e2eSeed` | `none` (default), `asha`, `asha-twins` | Before the first frame, seed the local store with the fictional family through `src/dev/asha-seed.ts` (it already sets `ageGate.passed`). `asha-twins` adds Avi with Asha's birthday. Never seeds when a child exists. | 04, 05, 06, 07, 08, 10, 11, 14, 15 |
| `e2eOffline` | `0`, `1` | Every request made through the app's fetch fails as a network error before it leaves the phone (Supabase client, packs, remote config, PostHog). iOS simulators have no airplane mode (Maestro docs: `setAirplaneMode` "is supported on Android only"), so this is the stand-in; the real radio-off check is on device (DEVICE_TEST_PLAN). | 01, 02, 03, 04, 05, 10 |
| `e2eClockOffsetHours` | integer, may be negative | Added to `Date.now()` in one seam (`nowMs()`) used by the age gate (`lib/age-gate.ts`), Read together and reminders. | 01 |
| `e2eConfig` | JSON | Merged over the remote config after the signed copy loads (for example `{"readTogetherFreeSessions":5}` or `{"killSwitches":{"packDownloads":true}}`). Keeps the existing rule that the free sessions value may only be raised. | 05, 06 |
| `e2eTranscriber` | `auto` (default), `none`, `sample` | `none`: no speech model and no sample words, so Review offers "keep the recording" (letter waiting for words). `sample`: the existing sample transcriber. | 03 |

## 4. Build and config requests

| # | Request | Owner | Why |
|---|---|---|---|
| B-1 | `eas.json`: add profile `e2e` = `{"extends": "preview", "withoutCredentials": true, "ios": {"simulator": true}, "env": {"EXPO_PUBLIC_E2E": "1"}}` plus the e2e Supabase URL and publishable key as EAS environment variables | integration / platform | Release JS on a simulator `.app` (Expo docs, "Run E2E tests on EAS Workflows with Maestro", uses `withoutCredentials` and `ios.simulator`) |
| B-2 | `eas.json`: add profile `development-simulator` = `{"extends": "development", "ios": {"simulator": true}, "env": {"EXPO_PUBLIC_APP_ENV": "development", "EXPO_PUBLIC_E2E": "1"}}` | integration | The quick authoring loop with an EAS dev build (README section 3.2) |
| B-3 | `eas.json`: pin `"image": "sdk-57"` under `build.*.ios` (today `macos-tahoe-26.5-xcode-26.6`; the default `auto` may move to an Xcode 27 image) | integration | Apps built with the iOS 27 SDK need the scene life cycle; SDK 57 supports it only by opt-in, and cold-start deep links under scenes were fixed in SDK 58 (Expo fyi "ios-scene-lifecycle"). Xcode 26 is still accepted by App Store Connect (Apple: "built with Xcode 26 or later" since 28 Apr 2026). |
| B-4 | `app.config.ts`: `ios.infoPlist.ITSAppUsesNonExemptEncryption = false` (after the founder confirms the app uses only OS encryption: HTTPS, Keychain, CryptoKit hashing) | integration | Skips the export questionnaire on every upload (Apple, `ITSAppUsesNonExemptEncryption`) |
| B-5 | `app.config.ts`: `ios.privacyManifests` from `docs/legal/app-store-privacy-labels.md` 3.3 | integration + legal | Not present today |
| B-6 | `app.config.ts`: `extra.eas.projectId` and `owner` after `eas init` (the config is dynamic, so the founder pastes the id) | founder + integration | EAS Build, Submit, Update |
| B-7 | Only if the local Supabase stack is used for e2e (README 4.2): an `e2e-local` profile with `NSAllowsLocalNetworking` | integration | Lets the simulator reach `http://127.0.0.1:54321`. Never in `preview` or `production` (LEGAL-REQ-021). Not needed with the hosted e2e project. |
| B-8 | Release check: production bundle contains no `e2eSeed`, `e2eOffline`, `e2eConfig` strings | platform | Section 3 hard rule |

## 5. Backend for e2e (founder)

1. A separate Supabase project `scribe-e2e` (free tier is enough). Never staging or production: the flows create and delete accounts and read sign-in codes with that project's secret key.
2. Apply every migration in `supabase/APPLY.md` order; publish `terms` and `sensitive-data` rows in `policy_versions` (AUTH_SETUP 1.4), or every sign-in stops at "couldn't finish setting up".
3. Custom SMTP through Resend with a **sending-only** API key. Supabase refuses to email anyone outside the project team without custom SMTP ("Email address not authorized", Supabase SMTP guide). Test addresses: `delivered+<label>@resend.dev` (Resend test address with a label; counts against the sending quota).
4. Secrets for the runner (never committed): `MAESTRO_E2E_SUPABASE_URL`, `MAESTRO_E2E_PROJECT_REF`, `MAESTRO_E2E_SERVICE_KEY` (that project only), and the production project ref in `MAESTRO_PROD_PROJECT_REF` so scripts can refuse it.
