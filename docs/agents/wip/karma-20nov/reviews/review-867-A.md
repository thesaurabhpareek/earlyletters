## Review A at 922aa8a8564be19bd674b3f288ba6bd711a3f9f9: PASS WITH NOTES
<!-- agent:qa -->

Lens A: correctness and tests. Spec `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` (168 lines) and its check-in line.

Must fix: none.

### What I checked
- Card: NS-33 in `docs/product/prd/11-foundations.md` at `450bcb4a` (rows R1, R2, R4 at lines 262, 263, 265; section 8 budget at line 299). Each section 1 row checked against its card row and the definitions in section 2.
- Code: `origin/develop` at `9bbe6003`. The spec read `20553b18`; no file it cites under `apps/mobile`, `packages/design-tokens` or `strings.en.ts` changed between the two.
- Cites: I sampled 41 (file:line on develop, React Native 0.86.3 and expo-router 57.0.24 in `node_modules`, #798 at `7f36031a`, #840 at `f811c9a6`). 39 hold. The two that do not are findings 1 and 2.
  Held, for example: `app/letter/[id].tsx:219-221, 162-163, 331-344, 392, 398-400`; `components/motion/card-transition.tsx:230-231, 300, 492-499` (two carried copies, at 499 and 509); `lib/transitions.logic.ts:53`; `components/ui/text.tsx:95-108, 173`; `app/(tabs)/_layout.tsx:87, 91`; `strings.en.ts:63` ("Me"); `test/tab-bar.test.ts:61`; `app/settings/_layout.tsx:12, 40`; `app/(tabs)/book.tsx:353, 385-410, 389-391`; `app/review.tsx:1170, 1196, 1212-1217, 1219-1228, 1224, 937-955`; `components/ui/screen-header.tsx:42-48`; `components/ui/button.tsx:48 (shrink-0), 61, 198`; `components/capture/transcript.tsx:151-160`; `components/book/cover-band.tsx:104-113`; `components/player/audio-player.tsx:166-168`; `components/tonight/draft-card.tsx:39-50`; `lib/a11y.ts:29`; `tokens.ts:218-255` (every cap and size used in 5.1 matches); `accessibilityPropsConversions.h:84-86`; `RCTAccessibilityManager.mm:271` (3.571); `RCTViewComponentView.mm:1523-1538`; `getHeaderTitle.js:4-9`; `HeaderTitle.js:10`; `Header.js:201`; `choice-group.tsx:60` (so `book.lens.months` and `book.lens.photos` survive).
- Widths I re-derived from the cited tokens and classes: footnote 14 x 3.571 = 50 pt; dateline 14 x 2.4 = 33.6 pt; bar title 18 x 1.3 = 23.4 pt; the Book bar's 66 pt title column (335 - 217 - 36 - 2 x 8); the Review header geometry (Hear it ends at x 228, Close starts at x 209). All agree with 5.1.
- Would each row's test fail on develop?
  - (a) R1: yes. No `asHeading` anywhere in `app/letter/[id].tsx`.
  - (b) R2: yes. `headerTitle: copy.settings.title` is at `_layout.tsx:91`.
  - (c) R4 scan: yes, and only at `app/review.tsx:1224`. I ran the scan the spec describes (four routes plus every `@/components/` import one level deep, `.logic` skipped, comments removed). The only `numberOfLines` hits are `review.tsx:1196` (already `stacked ? undefined : 2`) and `:1224`. There are no hits for `adjustsFontSizeToFit`, `ellipsizeMode` or `allowFontScaling={false}`, and none for `maxFontSizeMultiplier` on `letterBody` or `signature`. The under-44 guard (no `IconButton size="sm"`, no `Chip`) passes on develop, as the spec says.
  - (d) R4 Book bar: yes. `book.tsx` never calls `useIsAccessibilitySize`. Its other clause (title has no `numberOfLines`) already holds on develop.
  - Toast (#877): yes. I ran its test on develop: 4 of 4 fail, and all pass at #877's head.
- R1 and R2 test titles match the card. Under CR-66 no row builds against the card. The spec's reading of "level 1" on iOS (first heading, the only `asHeading={1}`) is sound: no file under `React/` or `ReactCommon/` reads `aria-level`.
- Boundaries: no new word, token or key. The #840 key is PROPOSED, and the cut decision is left to Karma and the founder (5.3). Nothing touches the constitution, the review gate or privacy. ASCII only. 168 lines.
- CI at the head: all checks completed and green (required, tests and content rules, typecheck, database rules, Deno, compliance-fence, agent team, migrations, B-8). The head is older than 10 minutes.

### Findings (most serious first)
1. **Book bar order (5.3) contradicts the PR it builds on.** The spec orders the stacked controls "Find (when present), Months, the gear" and says this "matches the cover band's stacked trailing row". On #798 at `7f36031a`, both the cover band (`cover-band.tsx:89-95`) and the bar (`book.tsx:410-412`) put Months, then Find, then the gear. The spec's order is the one the locked NS-22 card wants (`10-reading-and-family.md:229`: "the lens choice, Find, Go to a month"). The claim that it matches the band is false, though. A builder who follows 5.3 would give the band and the bar different VoiceOver orders. Fix: cite NS-22 for the order, and say that #798 (or BL-928 (d)) must reorder the band too, or that both keep #798's order until BL-938.
2. **R2 fact: "Settings home draws no heading of its own, so the bar title is the screen's only heading" is false.** `app/settings/index.tsx` draws `ListSection` titles, which are `Text ... asHeading` (`components/ui/list-row.tsx:35`), and it can draw `SignedOutCard` (`asHeading`, `components/settings/signed-out-card.tsx:22`). The change is still right, because the bar title is the only level 1 heading. Reword it, and do not let the R2 test or V2 assume that there is a single heading.
3. **R1 test step 2 misses three heading variants.** It forbids `variant="h1"` before the dateline. `text.tsx:80-84` maps `h1` to `h4` to `heading`. Use `variant="h[1-4]"`. Also say that the step reads only the route file: a heading drawn by an imported component above the dateline (today only `TopBar`, which has none) would get past it.
4. **R4 trace: the card's own test title is never assigned.** The card names `[NS-33-R4] AX5 on SE 3` (device). The spec adds three code guards with other `[NS-33-R4]` titles. The trace counts any `[NS-33-R4]` tag, so R4 would show as proved by Node source scans alone. Make X1's recorded result (5.5) carry `[NS-33-R4] AX5 on SE 3`, and call the code tests regression guards, as the spec already does for the under-44 guard.
5. **R4 "under 44 pt" is defined to count `hitSlop` (section 2), but the guard bans `IconButton size="sm"`, which reaches 44 pt only through `hitSlop` (`button.tsx:194`).** Under the spec's own definition, the transcript mark (32 by 24 pt) passes and an `sm` IconButton would fail. Pick one rule. The card does not define the term, so if the `hitSlop` reading stays, state it as the spec's reading of R4 for the device walk. X1 cannot see `hitSlop` on a phone.
6. **Review header at AX5 (5.1 row 3) passes with the frames overlapping.** By the spec's own numbers, Hear it's frame ends at x 228 and Close's starts at x 209 (the leading slot is `flex-1`, the Button is `shrink-0`). That is a 19 pt overlap, and Close is drawn later, so a tap on the right edge of Hear it closes Review. The words do not overlap, so this is not truncation. Still, X1 should tap that edge on purpose, not only look at it.
7. **"Not truncated: a card excerpt that ends in a fade."** This is a reading of the card's "no text is truncated". It matches the shipped excerpt design and the card's list of misses, but it is the spec's choice, not the card's. Say so in one line so CR-66 readers do not take it for card text.

### Not verified
- No phone or simulator (V1, V2, X1). The AX5 advance widths come from the spec, not from my own measurement. I re-derived only the token arithmetic.
- That VoiceOver reads no heading level on iOS 17 and iOS 26. I traced it in React Native source only.
- Plan #847 section 2.3 rows BL-927 and BL-928. I did not open them.
- Design 11 section 3.2 (`headerTitle: t.you`), which the spec says it refines.

Reviewer: independent of the author (CR-44).
