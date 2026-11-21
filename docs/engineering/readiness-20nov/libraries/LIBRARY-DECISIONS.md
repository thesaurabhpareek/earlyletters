# Open-source library decisions (RD-F): index, summary, questions

Task RD-F, handle `mobile`, 20 Nov 2026. The founder asked to use open source wherever it reduces work. This is a paper evaluation: nothing installed, no `package.json` changed. Base `origin/develop` at `16e61549`. Files in this folder:

| File | What |
|---|---|
| `LIBRARY-DECISIONS.md` (this) | Summary table, savings, recommendations against, founder and counsel questions, conflicts, verification log |
| `LIBRARY-DECISIONS-A-ui-media.md` | Full records LD-01 to LD-15: motion, sheets, lists, pictures, video, small UI, state |
| `LIBRARY-DECISIONS-B-data-time-test.md` | Full records LD-16 to LD-33: search, graphemes, dates, days data, notifications, validation, print, QR, localisation, speech, testing, measurement |
| `ALREADY-HAVE.md` | What the platform and our 62 dependencies already give; do not rebuild |
| `ADOPTION-RULES.md` | How an agent proposes a new dependency: record, gates, PR, licence and label steps, review lens |

Tags: [V] checked, [E] estimate with basis, [U] not checked. Decisions: USE (present), ADOPT (new), OWN (write it), AVOID. Owner: K = Karma T1 (reversible technical); K2 = Karma T2 ruling first (native dependency in every build); F = founder; C = counsel.

## 1. Binding constraints, and how they were applied

- Expo SDK 57 on React Native 0.86.3, New Architecture, iOS 17 lowest [V: `apps/mobile/package.json`]. Registry `latest` of Expo packages is SDK 58 on 20 Nov [V]; every Expo version below is the SDK 57 pin, found with `npm view <pkg> versions`.
- Nothing may send a person's content, a child's voice or a picture off the phone without the X2 note (`docs/product/prd/00-product-frame.md:85` on the inputs branch, quoted in card 27 [V]). Packages that can load a URL are wrapped to accept `file://` only.
- Label guard: `scripts/release/label-effect.mjs` flags a tracking SDK in `apps/mobile/package.json` (line 38), a new entitlement or a new usage string in `app.config.ts` (lines 130 to 140) [V]. It reads names only, so reviewers still read the pod (`LABEL_GUARD.md`, residual risk [V]).
- Licence file: every shipped package is listed in `scripts/licences/components.mjs`; the generator and `apps/mobile/test/licences.test.ts` fail on a missing one [V]. Permissive licences only (SEC-R07, `docs/engineering/06-security-engineering.md:45` [V]).
- Supply chain: lockfile-only PRs, `npm ci`, last release within 12 months, `npm audit --omit=dev` (`06-security-engineering.md:43,105` [V]).
- Size: 12 MB bytecode, 3 MB assets, under 40 MB download (`docs/ops/APP_SIZE.md:5-9` [V]). RD-E's budgets: `docs/engineering/readiness-20nov/performance/` was not on `origin/develop` or any `origin` branch on 20 Nov [V: `git ls-tree`, branch list]; re-read it before adopting anything native.
- No spend. Maestro Cloud, a Mac mini, paid CI minutes are the founder's (OQ-2).
- Newest scope read: card 27 (NS-51 photo moments, NS-52 pictures and videos) and `days-library.md` on `docs/locked-pack-inputs-20nov` [V]; `docs/tdd/new-scope/11-foundations.md`; eval B on `docs/eng-eval-20nov` [V]. Locked cards on `docs/prd-lock-v1-20nov` were not re-read for this file [U]; where they conflict with the inputs branch the locked pack wins.

## 2. The decisions at a glance

| ID | Need | Decision | Name and version (registry 20 Nov [V]) | Licence | Owner |
|---|---|---|---|---|---|
| LD-01 | Motion, layout transitions, gestures | USE | reanimated 4.5.1 (installed), worklets 0.10.1, gesture-handler ~2.32.0 | MIT | K |
| LD-02 | Sheets | USE | @gorhom/bottom-sheet ^5.2.14 | MIT | K |
| LD-03 | Skia, Lottie, Rive | AVOID | skia 2.14.0, lottie-react-native 7.5.1 | MIT, Apache-2.0 | K |
| LD-04 | Long lists (1,000 letters, 300 pictures) | USE SectionList and FlatList; FlashList only on a measured miss | @shopify/flash-list 2.3.3 | MIT | K |
| LD-05 | Drag to reorder (NS-52-R14) | OWN buttons first; adopt later after a spike | react-native-sortables 1.10.1 or reorderable-list 0.18.3 | MIT | K |
| LD-06 | Image decode, cache, thumbnails | OWN (ImageIO in scribe-photo); fallback expo-image | expo-image 57.0.5 | MIT | K2 if adopted |
| LD-07 | Pick one photo | OWN (done, CR-65); AVOID | expo-image-picker | MIT | K (ruled) |
| LD-08 | Pick several photos and videos (NS-52-R2) | OWN, extend scribe-photo | PHPicker | Apple | K |
| LD-09 | Photo moments from the library (NS-51) | OWN PhotoKit, dates only; AVOID | expo-media-library 57.0.6 | MIT | K; F, C for usage string and label |
| LD-10 | Video playback (NS-52-R13) | ADOPT, gated | expo-video 57.0.5 | MIT | K2 |
| LD-11 | Video copy, cap, strip metadata, poster | OWN, AVFoundation | none | n/a | K |
| LD-12 | Camera, recording, trim | AVOID | expo-camera 57.0.6 | MIT | F |
| LD-13 | Image manipulation | AVOID | expo-image-manipulator 57.0.22 | MIT | K |
| LD-14 | Haptics, icons, date picker | USE | expo-haptics, phosphor 3.0.6 (deep imports), datetimepicker 9.1.0 | MIT | K |
| LD-15 | State, forms, key-value | USE module store; AVOID | zustand 5.1.0, react-hook-form 7.92.0, mmkv 4.3.2 | MIT | K |
| LD-16 | Full text search | USE FTS5 unicode61; own scan for CJK; AVOID stemming | expo-sqlite ~57.0.3 | MIT | K |
| LD-17 | Grapheme segmentation | OWN (`packages/core/src/graphemes.ts`); AVOID polyfill | @formatjs/intl-segmenter 12.3.2 | MIT | K |
| LD-18 | Dates and time zones | USE Intl and `tz.ts`; AVOID | date-fns 4.4.0, temporal-polyfill 1.0.8, @js-temporal/polyfill 0.5.1 | MIT, MIT, ISC | K |
| LD-19 | Days we mark data | OWN DATA SET; AVOID | date-holidays 3.39.2, @hebcal/core 6.16.1 | ISC and CC-BY-SA-4.0; GPL-2.0-or-later | K; C for sourcing |
| LD-20 | Notification scheduling | USE | expo-notifications ~57.0.21 (64 pending, we plan 60) | MIT | K |
| LD-21 | Schema validation | USE valibot; AVOID zod | valibot 1.5.0, zod 4.6.7 | MIT | K |
| LD-22 | PDF and print | USE | expo-print ~57.0.2 | MIT | K |
| LD-23 | QR | none needed; later qrcode-svg | react-native-qrcode-svg 6.3.54 | MIT | K |
| LD-24 | Localisation, plurals, RTL | USE built-ins; AVOID frameworks now | i18next 27.2.2, @formatjs/intl 6.2.0 | MIT | K |
| LD-25 | Speech engines and packs | USE whisper.rn; AVOID sherpa and Apple Speech | whisper.rn ~0.7.4, sherpa-onnx 2.0.2 | MIT, Apache-2.0 | K; F, C for Apple Speech |
| LD-26 | Database tests | USE PGlite; AVOID pg-mem | @electric-sql/pglite 0.5.17 | Apache-2.0 | K |
| LD-27 | Component and accessibility tests | ADOPT after spike (dev only) | jest-expo 57.0.6, @testing-library/react-native 14.1.0 | MIT | K |
| LD-28 | Phone journeys | USE Maestro; AVOID Detox | Maestro CLI (version [U]) | [U] | K; F for spend |
| LD-29 | Mutation testing | ADOPT for pure packages (dev only) | @stryker-mutator/core and vitest-runner 10.1.1 | Apache-2.0 | K |
| LD-30 | Performance measurement | USE size script, Hermes profiler; ADOPT Reassure later; AVOID Flashlight, why-did-you-render | reassure 1.6.1 | MIT | K |
| LD-31 | Analytics, crash, calendar, camera SDKs | AVOID | @sentry/react-native 8.36.0, expo-calendar | MIT | F, C |
| LD-32 | Key-value, network state | USE installed | expo-sqlite, secure-store, expo-network | MIT | K |
| LD-33 | Zip, hashes, signatures | USE installed | fflate ^0.8.3, @noble/hashes ^2.4.0, @noble/ed25519 ^3.2.0 | MIT | K |

New dependencies this paper would add in total: expo-video (native, runtime, gated to NS-52), jest-expo and RNTL (dev), Stryker (dev), Reassure (dev, later). Everything else is already present, platform, or our own code.

## 3. The five biggest work savings

1. **Reanimated 4, Gesture Handler and gorhom (LD-01, LD-02), already installed.** They replace a custom animation engine, a gesture layer and a sheet. [E] several weeks; the motion pieces in `components/motion/` are built on them [V].
2. **SQLite FTS5 in expo-sqlite (LD-16).** A real inverted index, with deletion and `optimize`, instead of ours; the CJK scan stays as a small fallback [V: `lifecycle.ts:180`, `scan-index.ts:5`]. [E] 2 to 3 weeks.
3. **Apple's own frameworks for pictures and video through `scribe-photo` (LD-06 to LD-09, LD-11).** PHPicker needs no permission and no screen of ours; ImageIO and AVFoundation do decode, thumbnail, re-encode and poster. This avoids three packages that each request permissions (CR-65 [V]) and gives the "no third-party decoder" rule of NS-52-R8 for free. [E] weeks of picker UI and permission handling, but the Swift to write is real (about 300 to 500 lines [E]).
4. **expo-video for playback (LD-10).** The only new runtime dependency: AVPlayer with accessible controls, instead of a hand-built native video view. [E] 5 to 8 days plus every OS update after.
5. **The test stack we already own (LD-26, LD-27, LD-28):** PGlite for database rules, vitest for logic, Maestro flows (20 exist), plus jest-expo and RNTL for AX5 and 44 pt checks. [E] the harness alone is weeks if built by hand.

Close sixth: Intl plus our `tz.ts` instead of a date library (LD-18) keeps 0 bytes and 0 licence rows.

## 4. The three libraries recommended against

1. **`date-holidays` and `@hebcal/core` for the days library (LD-19).** `date-holidays 3.39.2` is `(ISC AND CC-BY-SA-4.0)` (share-alike on data) and `@hebcal/core 6.16.1` is `GPL-2.0-or-later` [V registry]. Neither passes SEC-R07. Our own table with a named authority per row (`days-library.md:187-196` [V]) is what the design asks for anyway.
2. **`expo-media-library` for photo moments (LD-09).** It reads more than dates (location, EXIF, albums) and brings permission calls into every build; NS-51-R5 allows dates and an identifier only. A short PhotoKit file in `scribe-photo` meets the card and keeps one gated place for the usage string.
3. **`@formatjs/intl-segmenter` (LD-17).** Hermes has no `Intl.Segmenter`, but a 1.3 MB locale-data polyfill loaded at launch fights the no-awaited-work rule. A plain-TS splitter proven against Node's Segmenter in a test costs no bytes (eval B BL-957).

Also avoided, with reasons in the records: `expo-image-picker` (CR-65), `expo-image` for local files, `zod` (second validator), Flashlight (Android profiler), `eslint-plugin-react-native-a11y` (last release 2024-11).

## 5. Questions for the founder and counsel (a default is given; none answered here)

| # | Question | Who | Default |
|---|---|---|---|
| Q1 | May we copy date facts (festival dates with an authority name) from Hebcal, timeanddate and USNO pages into the days table, and with what source line? | C | Own table, one authority name per row, facts only; counsel reads the source list before ship |
| Q2 | If an authority's list is only available through a GPL or CC-BY-SA library, do we accept those terms? | F, C | No (permissive only) |
| Q3 | The photo-library usage string and the limited-library alert key for NS-51, and the label line | C, F | Off until counsel reads; flag-gated build (NS-51-R2) |
| Q4 | Apple Speech (`SFSpeechRecognizer`) as an extra speech engine | F, C | No; whisper.rn only |
| Q5 | CI spend: macOS minutes, Maestro Cloud or a Mac mini for nightly journeys | F | Nightly on the plan we have; no cloud |
| Q6 | Move to Expo SDK 58 now that it is on the registry (`latest` is 58.x for every Expo package) | F, Karma | Stay on 57 for the first release; plan the move as its own task |
| Q7 | expo-video is a new native dependency in every build | Karma (T2) | Adopt only after the first TestFlight processing email and when NS-52 is scheduled |
| Q8 | Video limits (6 pictures, 2 videos, 60 s, 100 MB) are ASSUMED in card 27 (Q-PM-2) | product, F | As the card; the code reads one constants file |
| Q9 | A crash reporter, ever | F, C | No |

## 6. Conflicts and notes for product (not built either way)

- NS-52-R1 says it is UNVERIFIED that the picker supports a limit per type (`27-photo-moments-and-media.md:341`). Engineering reading [E]: the limit is one number; per-type limits are checked after the pick, so the card needs the "one calm line" for an over-limit pick (`video_too_long`, `media_not_available` family). Sent as a note, not a conflict.
- NS-52-R5 needs a metadata-stripping API the card marks UNVERIFIED. Verification is a Mac task (LD-11).
- Between our own engineering documents: ADR 0101:40 lists FlashList as a companion, while `docs/tdd/01-mobile-client.md:355` and `11-foundations.md:238` keep SectionList until a measured miss. This paper follows the TDD. For `design-systems` and Karma.
- `docs/adr/DRAFT-memory-library-architecture-10nov.md` names `expo-image-picker` and `expo-media-library` as adapters; CR-65 supersedes the picker part, and LD-09 supersedes the media-library part. The draft needs a note (Karma owns ADRs).

## 7. What I could not verify

- Weekly downloads for every package: the npm downloads API did not answer from the sandbox [U].
- Binary size and privacy-manifest keys of expo-video, expo-image and other native pods: need an EAS build or a pod read [U].
- Hermes `Intl.PluralRules` and the SQLite version inside expo-sqlite on iOS 17 [U]; both are one-line device checks.
- FormatJS and Expo documentation pages: the FormatJS page did not load; the Hermes fact comes from a search summary, eval B and our own code comments [V second hand].
- Apple documentation rows in `ALREADY-HAVE.md` section 4 marked [E].
- Maestro's licence and CLI version; the product thread's `print-and-fulfilment.md` and `languages-and-localisation.md` (not read).
- Locked cards 00 to 16 and the locked engineering plan (#847): not read for this task.

## 8. Verification log

Sampled 41 cites across the five files (file lines, branch files, commands, registry rows); 41 held. Method: file lines opened with `sed` or `grep` in the worktree at `16e61549`; the inputs branch with `git show origin/docs/locked-pack-inputs-20nov:<path>` (read at `0d77ac6e`; the brief named `bee01360`, the branch has moved since); registry facts with `npm view` on 20 Nov 2026. Three corrections made while writing: the `expo-image` dependency was first attributed to `react-native-reorderable-list` (fixed after a per-package re-run), a QR grep claim was reworded after a whole-word search, and `PRINCIPLES.md` item 3 was cited by item, not line. Packages named in `APP_SIZE.md` (`expo-image`, `expo-iap`) are no longer in `package.json` [V]; that document's cut 2 is out of date, as is its phosphor 54% figure (LD-14).
