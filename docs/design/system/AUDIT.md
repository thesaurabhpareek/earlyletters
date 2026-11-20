# Design system v2: audit and disposition of everything prior

Status: DRAFT, 20 Nov 2026 (UTC). Author: `design-systems` (auditor role) for Karma and the Chief Design Officer role. Brief: `docs/design/system/BRIEF.md`. Branch: `docs/e2e-ux-20nov` worktree. Writes only this file. Changes no card (CR-66), no token, no component and no string.

## 0. How to read this file

- Dispositions: **KEEP** (still right as it stands), **UPDATE** (right idea; needs a Liquid Glass change or a locked-pack change, and the change is named), **RETIRE** (superseded or wrong; says by what). Each row has a one-line reason and `file:line` evidence.
- Tags: **EVIDENCE** = read in this worktree this session. **UNVERIFIED** = not read in full, not run, or not checked on a device. Apple and Expo facts are taken from BRIEF.md section 1 as read by Karma on 20 Nov; I did not re-open the Apple or Expo pages this session, so every Apple or Expo fact below is UNVERIFIED by me and cites the brief.
- Requirement source for gaps: the locked cards `docs/product/prd/01` to `12` under `00-product-frame.md` (their "Design inputs" sections, all read), the e2e brief `docs/design/e2e/BRIEF.md`, and the five e2e DESIGN.md skeletons as they stood at 20 Nov (screen inventories only; bodies not yet written).
- What I read in full: BRIEF.md, e2e BRIEF.md, DESIGN_LANGUAGE.md, COMPONENTS.md, COMPONENT_LIBRARY.md, MOTION.md, IA.md, `packages/design-tokens/src/tokens.ts`, every file in `apps/mobile/src/components/ui/` that matters to chrome (button, sheet, toast, screen-header, index), `platform/blur-surface.ios.tsx`, `app/(tabs)/_layout.tsx`, `app/settings/_layout.tsx`, the root layout's Stack block, `lib/transitions.logic.ts`. Read by header, grep or section only (UNVERIFIED beyond what is cited): EXPERIENCE_PASS_2026-10.md (2,137 lines; headings and section 5 titles), BENCHMARK, CREATIVE, SOUND, NOTIFICATIONS, PHOTOGRAPHY, NOMENCLATURE_AUDIT, every review, every 10 and 11 Nov spec and wireframe (headers plus grep hits), every feature component (doc header), the experience-pass critique JSON files (names only), the calm-brand screenshots (names only).

## 1. Verdict in brief

1. The token set, the type system, the a11y plumbing (`useTheme` with Increase Contrast and Reduce Transparency, `useMotion`, `announce`), the motion catalogue and the content-layer components are strong and stay. Most of the work is in the chrome.
2. Nothing in the app uses Liquid Glass today. `expo-glass-effect` ~57.0.4 is installed but imported nowhere (`apps/mobile/package.json:34`; grep of `apps/mobile/src` finds no `GlassView`). The tab bar is JS tabs with a paper background (`app/(tabs)/_layout.tsx:1`, `:71`). Every navigation surface paints its own paper, ink or blur: 13 places on navigation and control surfaces must change (section 5).
3. Three sheet implementations coexist: `ui/sheet.tsx` (@gorhom, paper), `child/plus-gate.tsx` (hand-built, paper) and `asks/reminder-prime-ask.tsx` (hand-built, `bg-black/30` scrim). None is a system sheet, so none picks up glass. One sheet idiom on the system sheet is the single largest change.
4. The undo toast contradicts T4 (`16-council-review-round-2.md:44`): the built toast with an action never times out (`ui/toast.tsx:10-12`), COMPONENTS 2.14 says 5 s / 8 s (`COMPONENTS.md:384`), DESIGN_LANGUAGE 11.5 says it persists (`DESIGN_LANGUAGE.md:229`). The card rule wins.
5. Twenty-two components that the cards and the e2e areas need do not exist (section 3), led by the glass layer itself (`GlassSurface`, native tabs, glass toolbar and capture cluster), the picture components (no picture code exists anywhere in `apps/mobile/src`), the Find bar, the system menu, the segmented lens choice, the T4 undo line, `SystemLine` and the Home slip host.
6. Bold Text and Smart Invert are not handled anywhere (grep of `apps/mobile/src` for `isBoldTextEnabled` and `accessibilityIgnoresInvertColors`: no hits), and both are required (e2e BRIEF section 2; `11-foundations.md:314`). Bundled faces do not get heavier with Bold Text on their own.
7. Counts (table rows in sections 2.1 to 2.9, "KEEP (history)" counted as KEEP): 77 KEEP, 72 UPDATE, 24 RETIRE across documents, tokens, assets, components and chrome surfaces.

## 2. Inventory and disposition

### 2.1 Top-level design documents (`docs/design/*.md`)

| Item | Disposition | Reason | Evidence |
|---|---|---|---|
| DESIGN_LANGUAGE.md (whole) | UPDATE | Principles, colour, type, a11y rules are right; navigation, materials, icons and several screen layouts are out of date. v2 FOUNDATIONS.md takes sections 2 to 8; section 12 screens retire to the e2e areas | `DESIGN_LANGUAGE.md:3` (v0.3, 16 Oct) |
| DESIGN_LANGUAGE 1 Principles | KEEP | Still the house rules (2 a.m., equal doors, big enough for Nani) | `:5-15` |
| DESIGN_LANGUAGE 2 Colour tables | KEEP | Values equal tokens.ts; ratios computed; v2 adds glass tokens, not new hues | `:21-87` |
| DESIGN_LANGUAGE 2 rule "No Liquid Glass in the content layer; system tab bar and toolbars may use it" | UPDATE | Right, but too narrow: replace with BRIEF section 3 material policy (glass layer list, clear glass over pictures, max three surfaces, fallbacks) | `:88`; BRIEF.md:31-37 |
| DESIGN_LANGUAGE 2a Brand mark, 2b Atmosphere | KEEP | Unchanged by glass; lamp is content-layer atmosphere and is already off under Reduce Transparency | `:90-119`; `lamp.logic.ts:101-102` |
| DESIGN_LANGUAGE 3 Typography | UPDATE | Keep the ramp; add Bold Text face mapping (Mukta Regular to Medium, Medium to SemiBold, Literata Regular to Medium) and say which chrome text is system SF (native tab and nav bar titles) | `:139-174`; no Bold Text handling in code |
| DESIGN_LANGUAGE 4 Spacing | KEEP | 4 pt scale stands; HIG larger list row padding is met by ListRow min heights | `:176-179` |
| DESIGN_LANGUAGE 5 Radii | UPDATE | Add concentric radii (inner = outer minus padding as a rule, plus device-corner-aware sheet and floating cluster radii); `xl` 28 for sheets is superseded by the system sheet's own radius | `:181-183`; `tokens.ts:126-132` |
| DESIGN_LANGUAGE 6 Elevation | UPDATE | Shadows stay for content cards; glass surfaces carry no elevation token (the material is the elevation); level 3 "sheets" and level 2 "floating player" retire for glass chrome | `:185-187` |
| DESIGN_LANGUAGE 7 Iconography | UPDATE | Phosphor stays for content; system chrome (native tab bar, toolbars, menus) moves to SF Symbols per the foundations brief. Tab icon size 28 conflicts with the built 25 | `:189-194`; `_layout.tsx:46` |
| DESIGN_LANGUAGE 8 Motion | KEEP | Spring tokens stand; v2 MOTION.md adds glass morphs | `:196-207` |
| DESIGN_LANGUAGE 9 Imagery | UPDATE | "User photos ... never overlaid" must allow the glass controls over a picture with the 35 percent dim (BRIEF section 3); "Chapter cover: chosen photo" is retired by MonthOpener | `:215-216`; `COMPONENTS.md:514` |
| DESIGN_LANGUAGE 10 Sound and haptics | UPDATE | Haptics stand; the "Paper sounds" opt-in is refused (C-41) | `:220`; `12-parked-and-not-built.md:23` |
| DESIGN_LANGUAGE 11 Accessibility rules | UPDATE | Rule 5 "toasts persist until dismissed" is replaced by T4; add Bold Text, Smart Invert, Voice Control names, Switch Control, Differentiate Without Colour (e2e BRIEF section 2) | `:229`; `16-council-review-round-2.md:44` |
| DESIGN_LANGUAGE 12 Screens | RETIRE | Superseded: tabs "Tonight, Book, Family" by Home, Book, Me; Tonight's prompt card and accent-filled twins by promptHero on paper; chapter covers by MonthOpener; family invite tab by the pushed /family page. Screens now live in `docs/design/e2e/<area>` | `:233`, `:243`, `:261`, `:279-281`; `00-product-frame.md:61`; `IA.md:19-25` |
| DESIGN_LANGUAGE 13 Open questions | KEEP | Tiro 1.08x still untested | `:285` |
| COMPONENTS.md (whole) | UPDATE | The built-API table (lines 10 to 49) is accurate and valuable; the section 2 specs are half original sketch, half as-built. v2 COMPONENTS.md replaces it; carry the as-built table forward | `COMPONENTS.md:10-49` |
| COMPONENTS 0.1 a11y baseline | UPDATE | Add Bold Text, Smart Invert, glass fallbacks; "BlurSurface falls back to surfaceRaised" becomes the GlassSurface fallback | `:55-64` |
| COMPONENTS 0.2 haptics, 0.3 motion | KEEP | Policy "outcomes only" stands | `:66-84` |
| COMPONENTS 0.4 shared types, 0.5 web parity | RETIRE | Sketch types drifted from `TypeToken`; no web app is in scope (Apple first) | `:86-97` |
| COMPONENTS 1 Airbnb benchmark table | RETIRE | Names MonthChapterHeader and an Expo Router sheet; history only | `:105-115` |
| COMPONENTS 2.1 Button, 2.2 IconButton | UPDATE | Add `glass` and `glassProminent` variants for chrome and an extra-large size; keep content variants | `:123-166`; BRIEF.md:14-15 |
| COMPONENTS 2.3 Text, 2.4 Card | KEEP | Content layer; Card never glass | `:168-204` |
| COMPONENTS 2.5 LetterCard | UPDATE | Sketch variants (`withPhoto`, `draft`, `pendingApproval`, ContextMenu) never built; as-built card has no photo prop, while NS-01 needs one | `:206-229`; `01-photo-with-a-letter.md:298` |
| COMPONENTS 2.5b AppNote, QuietDayRow | KEEP | Built and consistent with D-084 and NS-07 C5 | `:231-236` |
| COMPONENTS 2.6 Chip, 2.7 TextField, 2.8 TextArea | KEEP | Built; content layer | `:238-290` |
| COMPONENTS 2.9 SegmentedControl | UPDATE | Never built; NS-01 R48 and NS-06 A3 need a three-way lens choice. Build as the native segmented control (glass-aware) with the Chip fallback at AX sizes | `:292-306`; `01-photo-with-a-letter.md:298` |
| COMPONENTS 2.10 Toggle | KEEP | SwiftUI Toggle picks up the system look (transient glass while active, per BRIEF.md:11) | `:308-317` |
| COMPONENTS 2.11 ListRow | UPDATE | Settings lists should be the system grouped style (BRIEF section 3): larger section radius, title-case section headers | `:319-336`; BRIEF.md:15, :35 |
| COMPONENTS 2.12 Sheet | RETIRE | Describes Expo Router formSheet, which was never built (gorhom was); v2 specifies one system-sheet idiom | `:357`; `:49` |
| COMPONENTS 2.13 Dialog / Alert | UPDATE | `confirm()` via `Alert.alert` is used in 12 places; ConfirmSheet is used for deletes. v2 must pick: system alert for confirms, action sheet anchored to its control for destructive choices (BRIEF.md:16) | `:360-376`; `book/confirm-sheet.tsx:1-7` |
| COMPONENTS 2.14 Toast | UPDATE | Becomes the glass undo line with the T4 window; durations in the spec contradict the code and T4 | `:378-394`; `ui/toast.tsx:10-12` |
| COMPONENTS 2.15, 2.15a EmptyState, StateScreen | KEEP | Content layer; the one pattern for states | `:396-419` |
| COMPONENTS 2.1a ModalHeader, BackButton | UPDATE | The Close and Back controls become glass toolbar buttons (or the native header's) | `:421-422`; `ui/screen-header.tsx:40-58` |
| COMPONENTS 2.16 Avatar / Signature | RETIRE | Avatar never built; signatures are text (`signature` type token) | `:424-435` |
| COMPONENTS 2.16a Lamp, QuotePair | KEEP | Built; content-layer atmosphere | `:437-441` |
| COMPONENTS 2.17 ListeningAura | KEEP | Built from `tokens.motion.breath` | `:443-458`; `capture/listening-aura.tsx:45-46` |
| COMPONENTS 2.18 CaptureBar | UPDATE | Never built as a component (Home inlines a ButtonRow); v2 makes it the floating glass capture cluster (Speak, Type, Start from a photo, Not much today) | `:460-478`; `app/(tabs)/index.tsx:244-260` |
| COMPONENTS 2.19 EditUnderline | UPDATE | Built inside `capture/transcript.tsx`, not as a component; spec says `textMuted` 60 percent, code uses `editMark` token | `:480-499`; `tokens.ts:36` |
| COMPONENTS 2.20 MonthOpener | KEEP | Matches code after PR #674 | `:501-519` |
| COMPONENTS 2.21 AudioPlayer | KEEP | Inline pill in the letter flow is content layer (not glass) | `:521-538`; `app/letter/[id].tsx:413` |
| COMPONENTS 2.22 ReadTogetherPlayer | UPDATE | Bottom transport controls become a glass toolbar over the content | `:540-559` |
| COMPONENTS 2.23 PhotoFrame | UPDATE | Not built; needed by NS-01; drop `cover` and `polaroid`; add Smart Invert exemption, 1 pt dark hairline (R41), clear-glass overlay controls | `:561-578`; `01-photo-with-a-letter.md:298-301` |
| COMPONENTS 2.24 BookCover | KEEP | Built | `:582-590` |
| COMPONENTS 3 Build order, 4 wrapper index | RETIRE | Build order is done; index names `action-menu` and `sheet-options` that do not exist | `:592-613` |
| COMPONENT_LIBRARY.md 0.1 to 0.3 | UPDATE | Library table stays as the record; NativeTabs "after a device spike" becomes adopted; expo-blur row becomes content-only; @gorhom row becomes the swap to a system sheet; add expo-glass-effect | `COMPONENT_LIBRARY.md:16-33` |
| COMPONENT_LIBRARY 1 to 9 | RETIRE | Oct 1 decision prose: Expo Router form sheets, "no SF Symbols in v1", `apps/ios` paths, install plan already run. History only; ADR 0101 stands for RNR + Uniwind | `:63`, `:76`, `:151`, `:179`, `:231-278` |
| MOTION.md 1 to 4 | KEEP | Benchmark, principles, Reduce Motion mechanism stand | `MOTION.md:5-66` |
| MOTION.md 3 token block | UPDATE | `breath.scaleMax 1.18` and `idleScale 1.05` disagree with tokens (0.18, 0.05 as deltas); "still hardcoded B constants" is stale (now tokens) | `:37`, `:55`; `tokens.ts:372`; `listening-aura.tsx:45` |
| MOTION 5a to 5g, 5k to 5m | KEEP | Built and tested; content-layer motion | `:72-121`, `:138-201` |
| MOTION 5h Milestones | RETIRE | "One hundred letters" is a count; milestone notes are parked (C-42) and the house rules ban celebration | `:123-126`; `00-product-frame.md:177` |
| MOTION 5i Tabs and sheets | UPDATE | Native tabs and system sheets bring their own motion and glass morph; our sheet's Reduce Motion fade becomes the system's | `:128-132` |
| MOTION 5j Empty states | KEEP | | `:134-136` |
| MOTION 5l "three rooms ... the Family tab" | UPDATE | Rooms are Home, Book, Me; the table itself stays | `:167`; `IA.md:19-25` |
| MOTION 6 to 9b | KEEP | Haptics map, performance, SET status, Lottie decision stand | `:203-258` |
| IA.md | UPDATE | Tabs table is right; "Gear: Settings (the only way into Settings)" contradicts the Me tab; Home list lacks the photo start, slips and whose-book | `IA.md:39` vs `:25`; `00-product-frame.md:61-67` |
| NOTIFICATIONS.md | KEEP (history) | 1 Nov research; NS-13, NS-18, NS-32 cards now govern; no design-system content | `NOTIFICATIONS.md:1-3` |
| SOUND.md | RETIRE | Paper sounds refused for now (C-41); silent by default | `SOUND.md:18-28`; `12-parked-and-not-built.md:23` |
| PHOTOGRAPHY.md | KEEP | Marketing sourcing; no screen uses the photos | `PHOTOGRAPHY.md:3` |
| CREATIVE.md | UPDATE | Brand and store direction stand; section 6 rows "100 letters" and "Empty Family" retire (C-42; Family is never a tab) | `CREATIVE.md:150-152` |
| BENCHMARK.md | UPDATE | Sources and HIG constraints stand; the tab bar row "Paper bar with a hairline (not Liquid Glass yet)" is superseded | `BENCHMARK.md:194` |
| NOMENCLATURE_AUDIT_2026-10-31.md | KEEP (history) | Naming record; glossary lives in BRAND.md | `NOMENCLATURE_AUDIT_2026-10-31.md:7-12` |
| EXPERIENCE_PASS_2026-10.md | KEEP (history) | The source of most built behaviour (5.8 transitions, lamp, S-ids); v1.0 scope statement (servers on, Family tab) is superseded by the cards. Section 5.6 (Reduce Transparency) needs a glass note. UNVERIFIED beyond headings | `EXPERIENCE_PASS_2026-10.md:1-8`, `:1782` |

### 2.2 Sub-folders

| Item | Disposition | Reason | Evidence |
|---|---|---|---|
| `calm-brand/` README and 16 PNGs | KEEP (history) | Before and after record of the lamp; web renders, not device | `calm-brand/README.md:1-5` |
| `experience-pass/critiques/*.json` (4) | KEEP (history) | Inputs to EXPERIENCE_PASS; not opened | file names only (UNVERIFIED) |
| `notifications/` COPY_INVENTORY, PARENT_STUDY_PLAN, SETUP_JOURNEY | KEEP (history) | NS-13 and NS-32 govern. SETUP_JOURNEY's correction says the reminder card rises over the Book; the e2e area D inventory puts it on Home (conflict 4.12) | `notifications/SETUP_JOURNEY.md:1`; `e2e/D-family-sharing-reminders/DESIGN.md` D-S04 |
| `reviews/` P2 to P8B critics' passes (9) | KEEP (history) | Go/no-go records for B2-10 | headers only |
| `screens/BOOK_PAGE.md` | UPDATE | As-built record is accurate; the inline bar is BlurSurface and must become a glass header with scroll edge effect (NS-22 calm header bar) | `screens/BOOK_PAGE.md:3`; `app/(tabs)/book.tsx:394` |
| `screens/WRITE.md` | UPDATE | Footer bar with paper background and hairline becomes a glass toolbar or scroll edge (section 5) | `app/write.tsx:340` |
| `screens/DELETE_THIS_BOOK.md`, `STRUGGLING.md` | KEEP | Settings content; open proposals (destructive fill on a confirm page) carried to v2 COMPONENTS | `COMPONENTS.md:125` |
| `specs/01-PHOTO-WITH-A-LETTER-11nov.md` | RETIRE | History; card 01 wins (e2e BRIEF 1.5) | `specs/01-...:3` |
| `specs/02-FIND-11nov.md` | RETIRE | Names a NEW `FindBar`; card 02 says no new component | `specs/02-FIND-11nov.md:58`; `02-find.md:238` |
| `specs/03-SHARE-ONE-LETTER-11nov.md` | RETIRE | Card 05 governs | `05-share-one-letter.md:227` |
| `specs/04-FIRSTS-AND-SEALED-11nov.md` | RETIRE | Card 06 governs | `06-firsts-sealed-letter-quick-capture.md:204`, `:494`, `:679` |
| `specs/05-HANDS-FREE-CAPTURE-STATES-11nov.md` | KEEP (reference) | Cards 04 and 06 C point to "Design spec 05 states" by name | `04-hands-free-capture-spike.md:194`; `06-...:679` |
| `specs/06-HOME-BOOK-ME-IA-11nov.md` | RETIRE | Superseded by the frame; its tab cross-fade and blur-surface tab bar conflict with native tabs; co-parent caption in Me is gone | `specs/06-...:207`, `:218`; `00-product-frame.md:67` |
| `specs/07-COPARENT-COMING-SOON-11nov.md` | RETIRE | No coming-soon surface in any build | `specs/07-...:1`, `:7`; `00-product-frame.md:67`; e2e BRIEF section 2 |
| `specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` + wireframes, `FIRST-RUN-MOTION-SPEC-10nov.md`, `FIRST-RUN-WORDS-10nov.md` | RETIRE | Story intro never built (no story component in `apps/mobile/src`); e2e area E designs first run "as built" | `specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md:6`; e2e BRIEF area E |
| `specs/MEMORY-LIBRARY-*-10nov` (flows, consent, words, two wireframes) | RETIRE | Moments tab and Memory Library re-homed into NS-01 and the Photos lens; its MediaViewer puts Close top left against the house idiom | `docs/product/prd/README.md:97-99`; `specs/MEMORY-LIBRARY-FLOWS-10nov.md:284` |
| `specs/NEW-SCOPE-INDEX-11nov.md` | RETIRE | Index of the retired 11 Nov specs | `specs/NEW-SCOPE-INDEX-11nov.md:3` |
| `specs/S17-NEW-PHONE-SPEC-10nov.md` + wireframes | RETIRE (history) | Built as `onboarding/new-phone-screens.tsx`; card 08 NS-10 governs | `components/onboarding/new-phone-screens.tsx:1` |

### 2.3 Tokens (`packages/design-tokens/src/tokens.ts`)

| Token group | Disposition | Reason | Evidence |
|---|---|---|---|
| `light`, `dark` colours (bg to controlBorder, editMark, destructive, onDestructive) | KEEP | AA in both themes, tested, brand-parity tested | `tokens.ts:17-65` |
| `scrim` (light 32 percent ink, dark 55 percent black) | UPDATE | System sheets dim themselves; keep for content-layer modals (CardToPage veil is `bg`, not scrim). Add a separate `glassDim` 0.35 for clear glass over pictures (BRIEF.md:13) | `tokens.ts:42`, `:64` |
| `highContrast` | UPDATE | Covers five keys only; Increase Contrast for glass needs `glassBorder` and vibrant label steps, and status colours (`recording`, `destructive`, `caution`, `success`) have no HC variant though they label controls | `tokens.ts:72-87`; BRIEF.md:18, :37 |
| `icon` (tile colours) | UPDATE | Values stand; the app icon must move to a layered Icon Composer file with a clear appearance (section 2.4) | `tokens.ts:93-100` |
| `space` | KEEP | | `tokens.ts:106-120` |
| `radius` sm, md, lg, pill | KEEP | Capsule controls already use `pill` | `tokens.ts:126-132` |
| `radius.xl` (28, "sheets, capture surface") | UPDATE | System sheet supplies its own (larger) radius; the floating capture cluster needs a concentric radius from the display corner, not 28 | `tokens.ts:130` |
| `type`, `minFontSize`, `fontFamily`, `fontMetrics`, `readingScale` | KEEP | Plus a Bold Text face map (new, section 7) | `tokens.ts:143-268` |
| `type.numeral` | RETIRE | No screen uses it since PR #674 | `COMPONENTS.md:47` |
| `elevation` 0, 1 | KEEP | Content cards | `tokens.ts:290-291` |
| `elevation` 2, 3 | UPDATE | Used by the toast, the Sheet and the AudioPlayer pill; toast and sheet move to glass (no shadow); 2 stays for the AudioPlayer pill only | `tokens.ts:292-293`; `ui/toast.tsx:114`; `ui/sheet.tsx:185`; `player/audio-player.tsx:147` |
| `motion` springs, `fadeMs`, `exitMs`, `enter`, `easing`, `stagger*`, `sequenceMaxMs`, `hardCeilingMs`, `newMarkMs`, `file`, `pageTurn`, `cover`, `cardToPage`, `press`, `emptyBreathMs`, `drawMs`, `lamp`, `route`, `swapMs`, `breath`, `highlight`, `breathIdleMs` | KEEP | All read by code and tested | `tokens.ts:303-375` |
| `motion.reduceMotion` `{ type, durationMs }` | RETIRE | Duplicates `fadeMs`; `useMotion` reads `fadeMs` | `tokens.ts:310`, `:317` |
| `motion` glass morph and undo window | gap | No token for `GlassView` style animation, glass container merge, or T4 undo seconds | section 7 |
| `target` | UPDATE | Add `md` 48 (typed in `button.tsx:254`) and an extra-large control height | `tokens.ts:382`; BRIEF.md:15 |
| `stroke`, `focusRing` | KEEP | | `tokens.ts:385-388` |
| `atmosphere` (tone, paperTone, peak, onLitPaper, grain, daypart) | KEEP | Content-layer light; glass sits above it | `tokens.ts:395-448` |
| `atmosphere.scene.family` | UPDATE | Used by the pushed `/family` page with `persistKey="tabs"` though it is not a tab; rename or document as a pushed-page scene | `tokens.ts:458`; `app/family.tsx:260` |
| Generated CSS `dist/tokens.native.css`, `tokens.web.css` | KEEP | Regenerate after any token change | `dist/tokens.native.css:69-73` |
| `build-grain.ts`, `textures/grain.png` | KEEP | | `DESIGN_LANGUAGE.md:115` |

### 2.4 Fonts and app icon assets

| Item | Disposition | Reason | Evidence |
|---|---|---|---|
| Mukta Regular, Medium, SemiBold; Literata Regular, Medium, Italic; Tiro Devanagari Hindi; OFL files; `build_fonts.py`; `fonts/index.ts` | KEEP | Subset, licensed, embedded; Bold Text needs a face swap in `Text`, not a new file (SemiBold and Medium exist) | `packages/design-tokens/fonts/index.ts:12-20` |
| App icon PNGs `icon.png`, `icon-dark.png`, `icon-tinted.png` (1024 RGB) wired through `ios.icon` light, dark, tinted | UPDATE | iOS 26 icons are layered (Icon Composer) with default, dark, clear and tinted appearances and system-applied effects; ours are flat opaque PNGs with no clear appearance (BRIEF.md:20, UNVERIFIED by me). Build a `.icon` from the registry master (symbol layer plus tile gradient layer) | `apps/mobile/app.config.ts:231-235`; `apps/mobile/assets/brand/` (file listing) |
| `android-foreground.png`, `android-monochrome.png` | KEEP | Android later | `app.config.ts:269` |
| `favicon.png` | RETIRE | Comment says "still the earlier mark" | `app.config.ts:278-279` |
| `splash.png`, `splash-dark.png` | KEEP | Registry context `app.splash` | `app.config.ts:289-295` |

### 2.5 `apps/mobile/src/components/ui/`

| Component | Disposition | Reason | Evidence |
|---|---|---|---|
| `Text` (`text.tsx`) | UPDATE | Add Bold Text face mapping; legacy shadcn variants (h1, h2 with `border-b`, `px-[0.3rem]`) can retire | `ui/text.tsx:38`, `:43` |
| `Button`, `ButtonRow` (`button.tsx`) | UPDATE | Add `glass` and `glassProminent` variants (chrome only) and an extra-large size; content variants unchanged | `ui/button.tsx:38-69` |
| `IconButton` | UPDATE | Add a glass variant for toolbar icon buttons (Book gear, Months, Aa); sizes 32, 44, 64 typed in code | `ui/button.tsx:195-199` |
| `LARGE_CONTENT` | UPDATE | Native tab bar supplies the Large Content Viewer itself; keep for our own icon-only glass buttons | `ui/button.tsx:191-192`; `_layout.tsx:49-59` |
| `Card` and parts | KEEP | Content layer, never glass | `ui/card.tsx:1-10` |
| `ChoiceGroup`, `Chip`, `ChipGroup` | KEEP | Content layer; Chip is the AX fallback for the lens choice | `ui/choice-group.tsx:1-10` |
| `EmptyState` | KEEP | | `ui/empty-state.tsx:1-10` |
| `fonts.ts` | KEEP | | |
| `LineArt`, `line-art.data.ts` | KEEP | | `ui/line-art.tsx:1-8` |
| `Lamp`, `LampView`, `lamp.logic.ts` | KEEP | Already off under Reduce Transparency and Increase Contrast, the same switch the glass fallback uses | `lamp.logic.ts:101-102` |
| `ListRow`, `ListSection`, `ToggleRow` | UPDATE | Move to the system grouped list metrics (larger section radius, title-case headers, larger row height); `max-w-[50%]` value column | `ui/list-row.tsx:1-10`, `:102` |
| `UIProvider` | UPDATE | Drops `BottomSheetModalProvider` when the sheet swaps; mounts the one toast host above native tabs | `ui/provider.tsx:1-10` |
| `QuotePair` | KEEP | | `ui/quote-pair.tsx:1-8` |
| `SafeAreaView` | KEEP | | `ui/safe-area-view.tsx` |
| `ModalHeader`, `BackButton` | UPDATE | Close and Back become glass toolbar buttons (or native header items) with no paper behind them | `ui/screen-header.tsx:40-58` |
| `Separator` | KEEP | `h-[1px]` should be `StyleSheet.hairlineWidth` or `stroke.hairline` | `ui/separator.tsx:16` |
| `Sheet` | UPDATE | Swap @gorhom paper sheet for the system sheet (Expo Router `formSheet` or `@expo/ui` bottom sheet, which COMPONENT_LIBRARY already records as a one-import swap), so it takes glass, insets half sheets, goes opaque at full height; keep the a11y contract (title focus, escape, visible Close) and re-test | `ui/sheet.tsx:24-25`, `:178-185`; `COMPONENT_LIBRARY.md:31` |
| `StateScreen`, `StateScreenView`, `InlineState`, `state-screen.logic.ts` | KEEP | Content layer; `header` slot takes the glass ModalHeader | `ui/state-screen.tsx:1-10` |
| `TextField` | UPDATE | Add a search preset for the Find bar (leading glass, clear, Cancel) instead of a new component (card 02 says no new component) | `02-find.md:238` |
| `Textarea` | RETIRE | RNR copy with `ring-[3px]` and `transition-[...]`; TextField `variant="letter"` is the writing surface | `ui/textarea.tsx:16`; `ui/text-field.tsx:1-10` |
| `Toast`, `ToastHost`, `useToast`, `toast.logic.ts` | UPDATE | Glass regular capsule instead of the inverse ink box; T4 window instead of "never times out"; one host that knows the native tab bar's height and minimised state | `ui/toast.tsx:10-12`, `:105`, `:113-114`; `_layout.tsx:63` |
| `AgreementRow` | KEEP | Content; its spec number "COMPONENTS 2.25" does not exist in COMPONENTS.md (doc gap) | `ui/agreement-row.tsx:2` |
| `index.ts` | UPDATE | Export the new glass components; drop `Textarea` if retired | `ui/index.ts:6-22` |

### 2.6 `apps/mobile/src/components/platform/`

| Component | Disposition | Reason | Evidence |
|---|---|---|---|
| `BlurSurface` (`.ios`, `.web`, fallback, types) | UPDATE | Split: chrome moves to a new `GlassSurface` over `expo-glass-effect`; BlurSurface stays only for content-layer standard materials, and loses its 72 percent paper overlay, which flattens the material and defeats vibrancy | `platform/blur-surface.ios.tsx:24-29` |
| `Toggle` (`.ios` SwiftUI, fallback RN Switch) | KEEP | System control; adapts on iOS 26 | `platform/toggle.ios.tsx:1-8` |

### 2.7 `apps/mobile/src/components/motion/`

| Component | Disposition | Reason | Evidence |
|---|---|---|---|
| `press.ts` (`usePressScale`, `AnimatedPressable`, hold context) | UPDATE | Content controls keep scale 0.97; glass buttons use the system's interactive glass response (`isInteractive`) and must not double it | `motion/press.ts:1-10`; BRIEF.md:24 |
| `Breathe` | KEEP | 0.85 floor should be a token | `motion/breathe.tsx:31` |
| `DrawOnPath`, `DrawOnStrokes` | KEEP | Pen easing is a literal | `motion/draw-on.tsx:22` |
| `ExcerptFade`, `FadeEdge` | KEEP | | |
| `PageTurn` | KEEP | | `motion/page-turn.tsx:1-10` |
| `CardSource`, `CardToPage` and hooks | KEEP | The letter page draws its own top bar during the move; that bar must become glass (section 5) | `motion/card-transition.tsx`; `app/letter/[id].tsx:512-524` |

### 2.8 Feature components (doc header read; bodies not audited unless cited)

| Component | Disposition | Reason | Evidence |
|---|---|---|---|
| app-lock: `AppLockLayer`, `LockOffer`, `PrivacyCover` | KEEP | Opaque cover is correct (never glass over private content); PrivacyCover asks to move into `ui` | `app-lock/privacy-cover.tsx:1-8` |
| `ReminderPrimeAsk` | UPDATE | Hand-built sheet with `bg-black/30` scrim and `rounded-t-[28px]` paper; move onto the one system sheet | `asks/reminder-prime-ask.tsx:98-99` |
| book: `AppNote`, `BookCover`, `EndOfBook`, `MonthOpener`, `QuietDayRow` | KEEP | Content layer | headers |
| `ConfirmSheet` | UPDATE | Becomes an action sheet anchored to its control (destructive), or a system alert; keep "Keep it" as default | `book/confirm-sheet.tsx:1-7`; BRIEF.md:16 |
| `CoverBand` | UPDATE | Its gear, Months and (NS-02) Find become the Book header's glass controls; the lit band itself stays content | `book/cover-band.tsx:1-8`; `02-find.md:238` |
| `DateSheet`, `MonthsSheet`, `ReadingSizeSheet` | UPDATE | Ride the swapped system Sheet; contents unchanged | `book/date-sheet.tsx:1-10`, `book/months-sheet.tsx:1-8` |
| `LetterCard`, `BookRow` | UPDATE | Needs the `photo` thumbnail (NS-01) with Smart Invert exemption | `01-photo-with-a-letter.md:298` |
| `UndoToast` | RETIRE | Thin wrapper that bypasses the host (passes a no-op `onHide`); fold into the T4 undo line | `book/undo-toast.tsx:17-25` |
| capture: `LetterSheet`, `SavedMoment`, `Transcript` | KEEP | Content layer (letter on paper) | headers |
| `ListeningAura` | UPDATE | The recording control around it becomes glass while recording (BRIEF section 3); aura stays content | `capture/listening-aura.tsx:140`, `:167` |
| child: `AddChildForm`, `ChildEditors`, `CoverHeading`, `DateField`, `WhoseBookSheet`, `ChildSwitcher` | KEEP (sheets ride the swap) | NS-14 reuses the switcher exactly | `09-capture.md:401` |
| `PlusGate` (the Keep sheet) | UPDATE | Hand-built full-height paper sheet with its own scrim and radius; becomes the system sheet (the Keep gate is glass per BRIEF section 3; opaque at full height) | `child/plus-gate.tsx:237-258` |
| consent: `AnalyticsConsentSheet`, `ConsentAsk` | KEEP (ride the swap) | | headers |
| `content-blocks/blocks.tsx` | KEEP | | |
| family: `InviteCard` | UPDATE | Header says "the Family tab's one card"; Family is never a tab (pushed page) | `family/invite-card.tsx:2` |
| family: `JoinAsk`, `JoinWait`, `LeaveSheet`, `MemberRow` | KEEP | `JoinAsk` runs a repeating 1.4 s sweep: check it is a real-progress indicator and stops under Reduce Motion | `family/join-ask.tsx:64`, `:78` |
| `AgeGateScreen` | KEEP | | |
| language: `LanguagePicker`, `LanguageRow` | KEEP | | |
| onboarding: `NewPhoneScreens`, `OutageScreen`, `PromiseSample`, `SignedInNote`, `WelcomeLockup`, `WelcomeSignIn` | KEEP | Built on StateScreen; area E designs them as built | headers |
| `AudioPlayer` | KEEP | Content layer | `player/audio-player.tsx:1-6` |
| resilience: `ErrorBoundary`, `GlobalFaultScreen`, `LaunchRecovery`, `PlainScreen` | KEEP | Must stay free of providers and glass (they render when those failed) | `COMPONENTS.md:418` |
| settings: `HelpFallback`, `HelplineCard`, `OpenDeletion`, `SignedOutCard`, `SpeechRow` | KEEP | | headers |
| `NotificationPreview` | UPDATE | `rounded-[14px]` should be `radius.md` | `settings/notification-preview.tsx:15` |
| `SpeechConsentCard` | KEEP | | |
| tonight: `DraftCard`, `HeldRow`, `PlusLine`, `QuietDayInline` | KEEP | Waiting cards are slip 1 in the frame order | `00-product-frame.md:67` |
| `ResurfacedCard` ("A month ago") | UPDATE | Replaced by NS-23 one past letter (slip 4); keep the card shape | `00-product-frame.md:67`; `10-reading-and-family.md:511` |

### 2.9 How the app renders chrome today

| Surface | Today | Disposition | Evidence |
|---|---|---|---|
| Tab bar | `expo-router/js-tabs` with Phosphor icons at 25 pt, labels 13 pt not scaled, paper background, hairline top, fixed 58 pt bar | UPDATE: native tabs (`expo-router/unstable-native-tabs`) with no custom background, minimise on scroll, system Large Content Viewer; keep three items and labels from `packages/content` | `_layout.tsx:1`, `:36`, `:46`, `:69-77` |
| Me tab header | Native header with `headerStyle.backgroundColor` paper, no shadow | UPDATE: remove background; large title or inline title on the system bar | `_layout.tsx:90-95` |
| Settings stack headers | `headerStyle` paper, `headerShadowVisible:false`, custom `HeaderBackButton` | UPDATE: remove background and shadow overrides; keep the outer back for the pushed stack | `app/settings/_layout.tsx:31-37` |
| Book inline bar | Animated absolute view with BlurSurface (chrome material plus 72 percent paper) | UPDATE: glass header controls in one GlassContainer plus scroll edge effect | `app/(tabs)/book.tsx:394-408` |
| Letter page top bar | Absolute view painted `c.bg`, 52 pt plus inset, swipe-down gesture | UPDATE: glass Back and Aa buttons, no painted bar | `app/letter/[id].tsx:512-529` |
| Modal headers (Listen, Review, Write, Read together, Family) | `ModalHeader` on the screen's paper, Close top right | UPDATE: glass Close; no paper strip | `ui/screen-header.tsx:40-50`; grep list in section 5 |
| Review and Write footers | `border-t border-border bg-background` bar | UPDATE: bottom toolbar with scroll edge effect; Keep as the prominent glass button | `app/review.tsx:845`; `app/write.tsx:340` |
| Home capture controls | Opaque ButtonRow pinned under the scroll; inline at AX sizes | UPDATE: one floating glass cluster at default sizes; inline content at AX sizes (keep the rule) | `app/(tabs)/index.tsx:244-260`, `:328-329` |
| Sheets | gorhom paper sheet, `elevation[3]` shadow, `surfaceRaised`, `radius.xl` | UPDATE: system sheet | `ui/sheet.tsx:178-185` |
| Toasts | Inverse ink box (`bg-foreground`), `rounded-lg`, `elevation[2]`, inset 12 pt | UPDATE: glass capsule | `ui/toast.tsx:105-114` |
| Route transitions | One table, native first | KEEP | `lib/transitions.logic.ts:44-60` |

## 3. Gap list: components the locked cards and the e2e brief need that do not exist

"Exists" was checked by grep of `apps/mobile/src` (section 0). Where a card says "no new component", the gap is filled as a variant of an existing one.

| # | Needed | Who asks | Fill as | Evidence it is missing |
|---|---|---|---|---|
| G1 | `GlassSurface` and `GlassGroup` (wrapper over `GlassView` and `GlassContainer`; regular and clear; Reduce Transparency and pre-iOS 26 solid fallback with hairline; Increase Contrast border) | BRIEF section 3 | new, `platform/glass-surface.{ios,}.tsx` | no import of `expo-glass-effect` |
| G2 | Native tab bar | BRIEF section 3; frame tabs | `NativeTabs` in `(tabs)/_layout.tsx` | `_layout.tsx:1` |
| G3 | Floating capture cluster (Speak, Type, Start from a photo, Not much today) | `00-product-frame.md:61`, `:67`; e2e A-S01 | the built CaptureBar spec made real, on G1 | `app/(tabs)/index.tsx:244-260` (no photo start) |
| G4 | Glass toolbar and toolbar buttons (Close, Back, Aa, Months, gear, Find) | BRIEF section 3 | `Button`/`IconButton` glass variants plus a `Toolbar` layout | `ui/screen-header.tsx` |
| G5 | Recording control glass state | BRIEF section 3 | state on the Listen control | `capture/listening-aura.tsx:167` |
| G6 | Picture thumbnail and frame (Smart Invert exempt, 1 pt dark hairline, missing and "did not come along" states) | `01-photo-with-a-letter.md:297-301`; `11-foundations.md:887` | `PhotoFrame` (COMPONENTS 2.23) | no image component in `apps/mobile/src` |
| G7 | Clear-glass controls over a picture with the 35 percent dim (Review picture, letter page picture, Photos lens viewer) | BRIEF section 3 | G1 clear variant plus `glassDim` | none |
| G8 | Photos lens list and the lens viewer | `01-photo-with-a-letter.md:297`; e2e B-S04 | content list plus viewer screen | none |
| G9 | Lens choice (Months, Photos, Firsts) as one radio group | `01-photo-with-a-letter.md:298`; e2e B-S03 | native segmented control with Chip fallback (COMPONENTS 2.9) | no `SegmentedControl` |
| G10 | Find bar and Find overlay with match mark (underline and weight) | `02-find.md:237-241`; BRIEF section 3 | `TextField` search preset on glass; result row on content | none |
| G11 | System menu (Book "More for this book", letter actions) | `10-reading-and-family.md:324`; e2e B-S02 | SwiftUI `Menu` or `ContextMenu` behind `platform/action-menu` (named in COMPONENTS 4, never built) | no `ActionMenu` |
| G12 | Undo line with the T4 window (VoiceOver read plus N seconds; Switch Control until the parent moves on) | `16-council-review-round-2.md:44`; `06-...:204`; `01-...:297` | `Toast` update | `ui/toast.tsx:10-12` |
| G13 | Home slip host (one slip at a time, fixed order, registry test `[FRAME-SLIP]`) | `00-product-frame.md:67` | new layout component over existing cards | no slip registry in components |
| G14 | `SystemLine` (offline, remote pause, low storage, update) | e2e E-S15 | new content-layer line | `e2e/E-foundations-and-system-states/DESIGN.md:23` |
| G15 | App update screen (available, required) | e2e E-S16 | `StateScreen` kind | listed as "none (gap)" in E-S16 |
| G16 | Bold Text support in `Text` | e2e BRIEF section 2; `11-foundations.md:314` | `Text` update plus `useBoldText()` in `lib/a11y` | no `isBoldTextEnabled` |
| G17 | Smart Invert exemption on pictures, widget mark | `01-...:301`; `05-share-one-letter.md:227`; `06-...:679` | prop on G6 | no `accessibilityIgnoresInvertColors` |
| G18 | Share preview sheet with picture toggle | `05-share-one-letter.md:227` | system Sheet plus Toggle (card: no new component) | no share preview in components |
| G19 | "This letter" list on the letter page, provenance row states, earlier-versions row and read-only version view | `10-reading-and-family.md:177-180`; `08-keeping-and-trust.md:203`, `:894` | `ListSection`/`ListRow` | provenance logic exists (`lib/provenance.ts`), no list component |
| G20 | Mark a first toggle and label field; sealed (hidden) row; Open now confirmation | `06-...:204`, `:494` | Toggle, TextField, LetterCard variant, action sheet | none |
| G21 | Hour picker, day chips, typed-day list and Add a day | `09-capture.md:247`, `:1064` | DateTimePicker in a sheet, ChipGroup, ListRow | partly in `app/settings/reminders.tsx` (not a component) |
| G22 | Widget and Control Center control visuals (static) | `06-...:679`; e2e A-S14 | outside React Native (WidgetKit); design spec only | none |

## 4. Conflicts between documents

| # | Conflict | Sides | Winner and why |
|---|---|---|---|
| 4.1 | Undo toast duration | Toast never times out with an action (`ui/toast.tsx:10-12`); spec 5 s / 8 s (`COMPONENTS.md:384`); "toasts persist until dismissed" (`DESIGN_LANGUAGE.md:229`); T4 window (`16-council-review-round-2.md:44`) | T4 (locked council ruling) |
| 4.2 | Tabs | "Tonight, Book, Family" (`DESIGN_LANGUAGE.md:233`); "Family tab" rooms (`MOTION.md:151`, `:167`); Home, Book, Me (`IA.md:19-25`; `00-product-frame.md:61`) | Frame |
| 4.3 | Tab switch motion | none, native swap (`MOTION.md:129`, `lib/transitions.logic.ts` rule 4) vs `swapMs` cross-fade (`specs/06-...:207`) | MOTION (native tabs make it moot) |
| 4.4 | Tab bar under Reduce Transparency | solid via `platform/blur-surface` (`specs/06-...:218`) vs native tabs fallback (BRIEF section 3) | BRIEF |
| 4.5 | Tab icon size | 28 (`DESIGN_LANGUAGE.md:193`) vs 25 built (`_layout.tsx:46`) | Native tabs set it; retire both |
| 4.6 | SF Symbols | "Not used in v1" (`COMPONENT_LIBRARY.md:76`, `:179`; `COMPONENTS.md:613`) vs "iconography (SF Symbols mapping)" in v2 foundations (BRIEF section 4) and "system chrome may use SF Symbols" (`DESIGN_LANGUAGE.md:194`) | BRIEF; foundations to decide the mapping |
| 4.7 | Sheet implementation | Expo Router formSheet (`COMPONENT_LIBRARY.md:63`; `COMPONENTS.md:357`) vs @gorhom built (`COMPONENT_LIBRARY.md:16`; `ui/sheet.tsx:4`) vs two hand-built sheets (`child/plus-gate.tsx:237`; `asks/reminder-prime-ask.tsx:98`) vs system sheets with glass (BRIEF.md:14, :16) | BRIEF: one system sheet |
| 4.8 | Breath scale tokens | `scaleMax 1.18`, `idleScale 1.05` (`MOTION.md:55`) vs `0.18`, `0.05` (`tokens.ts:372`) | tokens.ts (code reads it); fix the doc |
| 4.9 | Settings entry | "Gear: the only way into Settings" (`IA.md:39`) vs Me tab is Settings home (`IA.md:25`) | IA tab table |
| 4.10 | Find component | NEW `FindBar` (`specs/02-FIND-11nov.md:58`) vs "No new component" (`02-find.md:238`) vs "the Find bar" glass (BRIEF section 3) | Card; fill as a TextField preset on glass |
| 4.11 | Coming soon for the co-parent | spec 07 sheet and caption (`specs/07-...:1-7`) vs "Nothing anywhere says coming soon" (`00-product-frame.md:67`) | Frame |
| 4.12 | Where the reminder ask shows | over the Book (`asks/reminder-prime-ask.tsx:4`; `notifications/SETUP_JOURNEY.md:1`) vs "sheet on Home after the first kept letter" (e2e D-S04) vs IA "Home: Reminder sheet once" (`IA.md:34`) | Open: card 09 NS-13 design inputs say "the ask card" without a place (`09-capture.md:247`); area D to resolve under Card gaps |
| 4.13 | Milestones | MOTION 5h and CREATIVE 6 "One hundred letters" (`MOTION.md:123-126`; `CREATIVE.md:152`) vs C-42 parked and no celebration (`00-product-frame.md:177`; e2e BRIEF section 2) | Frame |
| 4.14 | UI sound | Paper sounds opt-in (`SOUND.md:18-28`; `DESIGN_LANGUAGE.md:220`) vs refused (`12-parked-and-not-built.md:23`) | Card 12 |
| 4.15 | Modal Close position | Close top right only (`COMPONENTS.md:422`) vs MediaViewer Close top left (`specs/MEMORY-LIBRARY-FLOWS-10nov.md:284`) | COMPONENTS (house idiom) |
| 4.16 | Photos in v1 | MonthOpener "no photos in v1.0" (`COMPONENTS.md:517`) vs NS-01 photo with a letter and the Photos lens (`01-photo-with-a-letter.md`) | Card 01 |
| 4.17 | Edit mark style | `textMuted` dotted at 60 percent (`COMPONENTS.md:493`); `accent` 1.5 pt at 60 percent (`DESIGN_LANGUAGE.md:255`); `editMark` full strength, and "never draw a control edge at reduced alpha" (`tokens.ts:35-36`; `DESIGN_LANGUAGE.md:81`) | tokens.ts as built |
| 4.18 | Spec numbers cited in code that COMPONENTS.md lacks | `COMPONENTS 2.25` (`ui/agreement-row.tsx:2`), `2.26` (`app-lock/privacy-cover.tsx:2`), `2.5c` (`book/quiet-day-row.tsx`) vs COMPONENTS.md ending at 2.24 with QuietDayRow under 2.5b | v2 COMPONENTS.md to number them |
| 4.19 | Paths | `apps/ios/...` (`COMPONENTS.md:4`; `COMPONENT_LIBRARY.md:151`, `:193-195`) vs `apps/mobile` | Code |
| 4.20 | Destructive confirm | ConfirmSheet, safe primary and quiet red delete (`book/confirm-sheet.tsx:1-7`) vs `confirm()` native alert (`COMPONENTS.md:375`) vs action sheet from its control (BRIEF.md:16) | Open for v2 COMPONENTS; recommend action sheet anchored to the control, default Cancel (card 06 B15 "default Cancel", `06-...:494`) |
| 4.21 | Atmosphere "never inside, behind or around the mark" vs glass | No conflict found; noted because a glass cluster over the lit Home must not sit on the QuotePair. UNVERIFIED on device | `tokens.ts:392` |

## 5. Custom backgrounds on navigation elements that Liquid Glass adoption must remove

Every line below paints paper, ink or a blur of our own on a navigation or control surface. Under BRIEF section 3 and BRIEF.md:14 ("remove custom backgrounds from them"), each goes; the system bar or a `GlassSurface` takes its place, and Reduce Transparency gets the G1 fallback.

| # | Where | What it paints | Replace with |
|---|---|---|---|
| 5.1 | `apps/mobile/src/app/(tabs)/_layout.tsx:71` | `tabBarStyle` `backgroundColor: c.bg`, `borderTopColor: c.line`, `borderTopWidth: 0.5`, fixed height, `elevation: 0` | native tabs, no style |
| 5.2 | `apps/mobile/src/app/(tabs)/_layout.tsx:92-95` | Me header `headerStyle.backgroundColor: c.bg`, `headerShadowVisible: false`, `sceneStyle` bg | system nav bar (scene bg stays: that is content) |
| 5.3 | `apps/mobile/src/app/settings/_layout.tsx:32-33` | `headerStyle.backgroundColor: c.bg`, `headerShadowVisible: false` | system nav bar with scroll edge effect |
| 5.4 | `apps/mobile/src/app/(tabs)/book.tsx:394` and `platform/blur-surface.ios.tsx:28-29` | Book inline bar: chrome BlurView at intensity 80 plus a `c.bg` layer at 0.72 opacity plus a bottom hairline | glass header buttons in one GlassContainer; scroll edge effect |
| 5.5 | `apps/mobile/src/app/letter/[id].tsx:522-524` | Letter page `TopBar` `backgroundColor: c.bg` | glass Back and Aa |
| 5.6 | `apps/mobile/src/app/review.tsx:845` | footer `border-t border-border bg-background` | bottom toolbar, scroll edge effect, prominent glass Keep |
| 5.7 | `apps/mobile/src/app/write.tsx:340` | footer `border-t border-border bg-background` | as 5.6 |
| 5.8 | `apps/mobile/src/components/ui/toast.tsx:113-114` | `bg-foreground` inverse ink box, `rounded-lg`, `elevation[2]` shadow | glass regular capsule |
| 5.9 | `apps/mobile/src/components/ui/sheet.tsx:178-185` (and the grabber `:73-74`) | `surfaceRaised` sheet, `radius.xl` top corners, dark hairline, `elevation[3]` shadow, our grabber | system sheet and grabber |
| 5.10 | `apps/mobile/src/components/child/plus-gate.tsx:243`, `:250-258` | own `c.scrim` layer and a paper sheet (`c.bg`, `radius.xl`, hairline) | system sheet (Keep gate is glass) |
| 5.11 | `apps/mobile/src/components/asks/reminder-prime-ask.tsx:98-99` | `bg-black/30` scrim, `rounded-t-[28px] bg-card` sheet | system sheet |
| 5.12 | `apps/mobile/src/components/ui/screen-header.tsx:42` and every modal that hosts it (`app/listen.tsx:464`, `:520`, `:523`, `:615`; `app/review.tsx:735`, `:937`; `app/write.tsx:385`; `app/read-together.tsx:109`, `:132`; `app/family.tsx:261`; `app/letter/[id].tsx:555`) | no fill of its own, but sits on a paper strip of the screen; the Close is a text button with no material | glass Close button (the strip stays content paper) |
| 5.13 | `apps/mobile/src/app/_layout.tsx:229` | `letter/[id]` native header `headerTransparent` with `headerTintColor: c.accent` | keep transparent; tint from the glass label token (Increase Contrast step) |

Not on this list on purpose: `contentStyle`/`sceneStyle` paper on stacks (`app/_layout.tsx:219`; `app/(auth)/_layout.tsx:30`; `app/invite/_layout.tsx:14`) is the content layer; `PrivacyCover` and the resilience screens must stay opaque.

## 6. Hardcoded values that should be tokens

No hex colour literal exists in `apps/mobile/src` (grep for `'#..'` and `"#.."`: no hits). The values below are numbers or utility classes that stand in for a token or should become one.

| # | Where | Value | Token (existing or proposed) |
|---|---|---|---|
| 6.1 | `app/(tabs)/_layout.tsx:36`, `:46`, `:71`, `:74-75` | `BAR = 58`, icon `25`, `paddingTop: 4`, label `lineHeight: 18`, `marginTop: 1`, `borderTopWidth: 0.5` | retired by native tabs; `stroke.hairline` meanwhile |
| 6.2 | `ui/toast.tsx:105` | `left: 12`, `right: 12`, `+ 12` | `space[3]` |
| 6.3 | `ui/toast.tsx:56` | `durationMs = 4000` | `motion.toastMs` (proposed) and T4 `undoWindowS` (proposed) |
| 6.4 | `ui/toast.tsx:90-91` | swipe `40` pt, `600` velocity, `120` travel | `gesture.dismiss` (proposed) |
| 6.5 | `app/letter/[id].tsx:515-518`, `:524` | `16`, `64`, `800`, bar `52` | `gesture.dismiss`; bar retired by glass |
| 6.6 | `ui/sheet.tsx:73-74` | grabber `36 x 5`, radius `3`, opacity `0.55`, padding `8`/`6` | retired by system sheet |
| 6.7 | `ui/sheet.tsx:168`, `:191` | `- 24`, `16 + 8` | `space[6]`, `space[4] + space[2]` |
| 6.8 | `ui/sheet.tsx:131` | `duration: 1` | intentional (no travel); comment, not token |
| 6.9 | `ui/sheet.tsx:182`; `platform/blur-surface.*:16` | `borderWidth: 0.5` | `stroke.hairline` |
| 6.10 | `platform/blur-surface.ios.tsx:28-29` (and `.web.tsx:28-29`) | `intensity={80}`, paper overlay `opacity: 0.72` | `material.*` (proposed) or retire |
| 6.11 | `ui/button.tsx:136`, `:198-199`, `:254` | icon `28/18/20`, IconButton `32/44/64`, glyph `20/24/28`, `md: 48` | `iconSize.*` (proposed); `target.md` 48 (proposed) |
| 6.12 | `ui/choice-group.tsx:115`, `:136`, `:163`, `:184`; `ui/list-row.tsx:109`; `ui/agreement-row.tsx:80-82`; `ui/text-field.tsx:126` | check and chevron glyphs `14/16/18/22`, box column `24`, `hitSlop={4}`, `marginTop: 1` | `iconSize.*` |
| 6.13 | `ui/empty-state.tsx:47`, `:50`; `ui/state-screen.tsx:166`, `:169` | QuotePair `48`, LineArt `168`, `96`, `marginLeft: -8` | `illustration.*` (proposed) |
| 6.14 | `ui/text-field.tsx:85` | `min-h-[52px]` | `target.*` |
| 6.15 | `ui/separator.tsx:16` | `h-[1px]`, `w-[1px]` | `stroke.hairline` / hairlineWidth |
| 6.16 | `ui/textarea.tsx:16` | `ring-[3px]` | `focusRing.width` (2) |
| 6.17 | `app/(tabs)/book.tsx:82`, `:396`, `:441` | `BAR_HEIGHT = 44`, `maxFontSizeMultiplier={1.3}`, `paddingBottom: 40` | `target.min`; a type token cap; `space[9]` |
| 6.18 | `app/review.tsx:469` | `setTimeout(..., 1600)` | `motion.newMarkMs` (exists) |
| 6.19 | `app/review.tsx:906` | `FadeIn.delay(80).duration(160)` | MOTION 5d values: `motion.reveal` (proposed) |
| 6.20 | `app/letter/[id].tsx:223` | `FadeIn.duration(150)` | `motion.swapMs` (exists) |
| 6.21 | `app/review.tsx:906`, `:968`; `components/child/add-child-form.tsx:177`; `app/onboarding.tsx:637` | `rounded-2xl` (Tailwind 16, not a token) | `radius.md` or `radius.lg` |
| 6.22 | `app/settings/export.tsx:270`; `app/settings/reminders.tsx:210`, `:223`; `components/settings/notification-preview.tsx:15` | `rounded-[14px]` | `radius.md` (14) |
| 6.23 | `components/asks/reminder-prime-ask.tsx:98-99` | `bg-black/30`, `rounded-t-[28px]`, `+ 20` | `scrim` (and the rule "ink, not black"), `radius.xl`, `space[5]`; retired by the system sheet |
| 6.24 | `components/motion/breathe.tsx:31` | opacity floor `0.85` | `motion.emptyBreathMin` (proposed) |
| 6.25 | `components/motion/draw-on.tsx:22` | `Easing.bezier(0.45, 0, 0.2, 1)` | `motion.penEasing` (proposed) |
| 6.26 | `components/family/join-ask.tsx:64` | `SWEEP_MS = 1400` | a motion token, or retire the loop |
| 6.27 | `components/book/cover-band.tsx:147` | gradient stop `0.55`, `* 0.4` | `atmosphere.band` (proposed; `LIT_BAND_STRENGTH` already named) |
| 6.28 | `components/capture/listening-aura.tsx:48`, `:140`, `:167` | `size = 240`, ring `+ 24`, `borderWidth: 2`, mic glyph `44` | `capture.aura.*` (proposed); `stroke.focus` |
| 6.29 | `ui/screen-header.tsx:42`, `:49`, `:56` | `min-h-12`, `-mr-4`, `-ml-4` optical offsets | glass toolbar metrics (proposed) |
| 6.30 | `ui/list-row.tsx:102` | `max-w-[50%]` | layout rule; document, not a token |

## 7. Token gaps that v2 FOUNDATIONS should close (input to `tokens.v2.json`)

- Materials: `glass.regular`, `glass.clear`, `glassDim` 0.35, tint per scheme (none by default; accent only for the prominent action), `glassFallback` (solid surface per scheme, used under Reduce Transparency and before iOS 26), `glassBorder` and its Increase Contrast step, and content-layer `material.ultraThin`, `thin`, `regular`, `thick`.
- Vibrant labels on glass: label colours for text and icons on glass, light, dark and increased contrast; status colours' HC steps (`recording`, `destructive`, `caution`, `success`), which `tokens.highContrast` lacks (`tokens.ts:72-87`).
- Radii: concentric rule and a `cluster` radius for the floating capture group; retire `xl` for sheets.
- Controls: `target.md` 48, extra-large control height, `iconSize` (inline 16, control 20, default 24, capture 28, large 44).
- Motion: glass style change duration (`GlassView animationDuration`), glass merge in a container, toolbar minimise, undo window seconds (T4), `toastMs`, `gesture.dismiss` thresholds, `reveal` (5d), `penEasing`, `emptyBreathMin`.
- Type: Bold Text face map (Mukta Regular to Medium, Medium to SemiBold, SemiBold stays; Literata Regular to Medium; Tiro has no heavier face: UNVERIFIED how it should behave).
- Retire: `motion.reduceMotion`, `type.numeral`, `elevation[3]` for sheets.

## 8. Engineering rows needed (proposed; ids are working labels, not BL ids)

| Row | Lane | What |
|---|---|---|
| ES-A1 | design-systems | Tokens v2: section 7 additions and retirements, tests (contrast of vibrant labels over glass fallback, HC steps), regenerate `dist/` |
| ES-A2 | design-systems | `platform/glass-surface` (G1) with Reduce Transparency, Increase Contrast and pre-iOS 26 fallbacks; `isLiquidGlassAvailable()` combined with `isReduceTransparencyEnabled()` |
| ES-A3 | mobile | Native tabs (G2): three items, labels from content, Me hint if supported (UNVERIFIED), toast host offset from the system bar, minimise on scroll |
| ES-A4 | design-systems | One system sheet behind `ui/sheet.tsx`; move PlusGate and ReminderPrimeAsk onto it; VoiceOver, escape, Reduce Motion re-test |
| ES-A5 | design-systems | Button and IconButton glass variants, extra-large size; ModalHeader and BackButton on glass (G4) |
| ES-A6 | mobile | Remove the custom backgrounds in section 5 (one PR per surface) |
| ES-A7 | design-systems | Toast as the T4 undo line (G12); retire `UndoToast` |
| ES-A8 | mobile | Floating glass capture cluster on Home with the photo start (G3); inline at AX sizes as today |
| ES-A9 | design-systems | PhotoFrame and clear-glass picture controls (G6, G7, G17) |
| ES-A10 | design-systems | Segmented lens choice (G9), system menu wrapper (G11), Find search preset (G10) |
| ES-A11 | design-systems | Bold Text in `Text` (G16) |
| ES-A12 | design-systems | Slip host (G13), `SystemLine` (G14), update screen kind (G15) |
| ES-A13 | design-systems | Section 6 hardcoded values to tokens |
| ES-A14 | design-systems | Layered app icon in Icon Composer with default, dark, clear and tinted appearances; registry context update |
| ES-A15 | design-systems | Rewrite COMPONENTS.md numbering (2.25, 2.26, 2.5c) and retire the documents in section 9 with a pointer line each |

## 9. Retired (what this audit proposes v2 supersedes)

DESIGN_LANGUAGE section 12 Screens; COMPONENTS 0.4, 0.5, 1, 2.12, 2.16, 3, 4; COMPONENT_LIBRARY sections 1 to 9 (prose; the 0.1 table stays as the record); MOTION 5h; SOUND.md; CREATIVE section 6 rows "100 letters" and "Empty Family"; specs 01, 02, 03, 04, 06, 07, NEW-SCOPE-INDEX, the first-run trio and wireframes, the Memory Library set and wireframes, S17 and wireframes (history; spec 05 kept as the hands-free reference the cards cite); tokens `motion.reduceMotion`, `type.numeral`; components `Textarea`, `UndoToast`; the favicon asset. Retiring a document means a first-line pointer to its successor, not deletion (Karma's call).

## 10. UNVERIFIED and open

1. Apple and Expo facts are the brief's, not re-read by me this session.
2. Whether `NativeTabs` in expo-router 57 accepts an accessibility hint per tab (the Me hint, `_layout.tsx:53-57`), a custom label font, and Phosphor template images vs SF Symbols with correct vibrancy. Device spike.
3. Whether the system sheet keeps our a11y contract (title focus on open, visible Close, `dismissible={false}` for required choices) on SDK 57. Device spike.
4. Tiro Devanagari under Bold Text (no heavier cut bundled).
5. EXPERIENCE_PASS, the reviews and the 10 and 11 Nov specs were read by header and grep only; a disposition of "history" there does not mean every line was checked.
6. The e2e DESIGN.md files were skeletons at the time of reading; gaps they add later are not here.
