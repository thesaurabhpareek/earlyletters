## Review A at c181291ed63515339a55e0515f0a2164c0e0f177: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/10-reading-and-family.md`, 227 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 45 cites against `develop` `d5d12178`, the named PR heads and the installed `node_modules`. All 45 hold. Examples: `toggleInBook` ignores the boolean `setEntryInBook` returns (`app/letter/[id].tsx:346-352`; `lib/store.ts:717`); the other parent's letter has no list (`own &&`, `:458`); `ListSection` draws its title with `asHeading` (`components/ui/list-row.tsx:34-38`) and rows are `min-h-11` (`:113`); "A month ago" takes no quiet input (`draft-card.logic.ts:190-206`; `index.tsx:200`); Hide needs two books (`app/settings/children/[id].tsx:187`); the quiet column is `child_member_prefs.quiet_at` (`migrations.ts:299, 316`); RN shares message then URL and resolves only when completed or with no activity (`RCTActionSheetManager.mm:258-260, 289-295`); `shareAsync(url, options)` takes no text (`expo-sharing/build/Sharing.d.ts:12`); the app protection class (`app.config.ts:93`).
- Card rows: NS-21 P0 rows R4, R9, R11, R12 and R13 each have a test in 1.10. NS-22 P0 (R2, R3), NS-23 P0 (R5, R8, R11, R15, R17) and NS-05 P0 lists match `14-test-plan.md` section 7. NS-21-R12's ratchet is allowed by the card's own wording ("or the build carries a recorded finding").
- Boundaries: no founder or counsel question is decided. The NS-05 picture waits for the X2 note (a `security-architect` read and counsel's Q45 on record); seals are not built until Q6 (CR-62); co-parent stays alpha-only (D-162). Words are PROPOSED keys, and PR 3 waits for the founder's approval of PR 2.
- Buildability, wave 2 (NS-21): 1.11 gives four PRs plus D1 in merge order, each with an owner, two lenses and a size under the limit. One pure row model (`components/book/letter-list.logic.ts`, `LETTER_ROWS`) so later cards add a predicate, not a block in a 670-line screen, is the right shape. So is one slip registry (`home-slips.ts`) and one `bookHeader` model.

## Findings (none blocks)
1. CR-67 AX-8: `[X6-R1]` is one test, the existing `apps/mobile/test/no-system-indexing.test.ts`, retitled and extended (BL-962). PR 1 here adds "`[X6-R1]` scan" and 1.10 R13 describes a new scan; section 6 names `mobile` as its owner. Cite and extend the existing test, with no second scan.
2. CR-67 AX-1: section 6's default ("the finding; NS-06-A22 goes to the founder") is replaced by "build one native setting under ADR 0039; flags for new word fields stay off in production until it lands". When it lands, the R12 ratchet must flip from "cites the finding" to "requires the prop". Write that into the ratchet's title or comment, so trace never counts a finding as the behaviour.
3. Section 5, NS-06 B: the opening rule written once in `packages/core` (`isOpen`), with a parity test against the SQL form, is the right call. `11-foundations.md` section 6 names the Find form `visibilitySql('find')` (eval B). Make sure the two designs mean one module (`packages/core/src/visibility.ts`), not two.
4. Section 4, NS-05 PR 3: `ScribeFiles.setProtection` is a Swift change. It needs the NSC-01 route (`security-architect` as lens B) and the line on why the installed module needs extending, which the file gives. Name `security-architect` as lens B of PR 3, not only as an extra lens.
5. Section 3, `[FRAME-SLIP]`: a source scan that fails when `index.tsx` renders a card outside `SLIP_VIEWS` can be fooled by a component imported under another name. Pair it with a render test over the registry (every rendered slip id is in `HOME_SLIPS`).

## CI
All checks green at the head, including tests and content rules. The head was older than 10 minutes when I finalised.

## Not verified
- That the web preview reaches `/letter/[id]` with the Asha seed (the R4 web journey assumption).
- iOS share-sheet behaviour after a cancel inside a chosen app.
- `@expo/ui` `Menu` under VoiceOver and AX5.

Reviewer: independent of the author (CR-44).
