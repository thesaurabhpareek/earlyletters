# Brand and content

The mark, brand assets, the product's name and words, prices on the website, and what public copy may promise.

### D-071 Primary mark: logo round 3 `final-a`
- **Source:** `docs/DECISIONS.md` D-071 (Decided, founder, 2026-10-03); PR #130 (merged 15 Oct: the r3 mark as app icon and splash)
- **Decided:** the brand mark is r3 `final-a`: two opening quotation marks, one large and one small, with an outlined EB Garamond wordmark; a sepia "Leather" app icon tile and a dark tile. `packages/brand/assets/logo/primary/` is its packaged rebuild. It retires the round 1 directions, round 2, the rest of round 3, the interim Literata email lockup, the "E" monogram and the "envelope line" motif.
- **Why:** quotation marks say "these are your exact words", the product's promise; the pair reads as parent and child (BRAND_SYSTEM.md 1). The founder chose final-a from the r3 presentation after neutral reviews of round 2.
- **Alternatives:** r3 `final-b`; round 1 directions a and b; the interim Literata lockup.
- **Door:** one-way after launch: once the icon is on families' phones and in the store listing, a new mark costs recognition and a full asset pass
- **Reversal cost:** medium: every touchpoint resolves through the registry (D-072), so files change in one place, but the store listing and recognition reset
- **Revisit when:** law: trademark clearance of the mark (still open per the source) finds a conflict
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/assets/logo/primary`, `docs/brand/BRAND_SYSTEM.md`, `packages/brand/assets/logo/primary/app-icon-1024.png`

### D-072 The brand asset registry is the single source
- **Source:** `docs/DECISIONS.md` D-072 (Decided, founder, 2026-10-03)
- **Decided:** every brand asset has one permanent id in `packages/brand/registry.ts`; every touchpoint is a context listing the ids it uses; code resolves files through `assetFor(context)` or `asset(id)` and never hardcodes a brand file path; contexts reference only `primary` assets; retired files are `deprecated` with `supersededBy`.
- **Why:** the audit found rejected directions wired into the website and email because files were picked by path (CA-001, CA-008, CA-010).
- **Door:** two-way: internal structure
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/registry.ts`, `packages/brand/registry.json`, `packages/brand/test/registry.test.ts`

### D-074 Edit feature name: "Word for word"
- **Source:** `docs/DECISIONS.md` D-074 (Decided, founder, evening of 2026-10-03; answers CONSISTENCY_AUDIT F-3)
- **Decided:** the feature is named "Word for word". "Lightly tidied", "Tidying" and other words that suggest software tidied a letter leave the product.
- **Why:** not recorded in the source beyond VOICE.md and the constitution (never imply the machine writes)
- **Door:** two-way: a feature name in copy
- **Reversal cost:** low
- **Revisit when:** customer: families misunderstand the name in the C1 beta
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/content/src/strings.en.ts`, `packages/content/src/features/words.en.ts`
- **Also:** D-086 repeats the name and sets the Review behaviour

### D-075 The website shows the price
- **Source:** `docs/DECISIONS.md` D-075 (Decided, founder, evening of 2026-10-03; answers CONSISTENCY_AUDIT F-4)
- **Decided:** the website shows the Plus price instead of stripping `{price}`. The prices named then were $3.99 a month and $29.99 a year.
- **Why:** not recorded in the source
- **Door:** two-way: website copy
- **Reversal cost:** low
- **Revisit when:** market: a price change (D-082 already changed it)
- **Review by:** on trigger
- **Status:** amended by D-082: the website now states $4.99 and $49.99 (PR #133)
- **As built:** `packages/content/src/site.en.ts`, `packages/content/src/pricing.ts`

### D-076 Brand name only from `packages/brand`
- **Source:** `docs/DECISIONS.md` D-076 (Decided, founder, evening of 2026-10-03; answers CONSISTENCY_AUDIT F-6)
- **Decided:** the public name lives only in `packages/brand/index.ts`; `packages/content` imports `brand` and builds strings with template literals; no copy file types the name.
- **Why:** CLAUDE.md stands (the source); CA-035 found about 79 literals.
- **Door:** two-way: internal structure
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/index.ts`, `packages/content/src/strings.en.ts`

### D-078 Website footer line
- **Source:** `docs/DECISIONS.md` D-078 (Recommended, coordinator default, proceed: yes, 2026-10-03; answers CONSISTENCY_AUDIT F-7)
- **Decided:** the website footer reads "(c) 2026 Early Letters" with the name from `brand.name`, ASCII "(c)" because the content rules test rejects the copyright sign; the individual publisher's legal name appears only in the legal pages; email footers keep no copyright line.
- **Why:** the content rules test rejects any `\p{Extended_Pictographic}` character, and U+00A9 is one.
- **Door:** two-way: copy
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** not on this branch: the website lives on the main branch (PR #55)

### D-079 Old logo directions archived, not deleted
- **Source:** `docs/DECISIONS.md` D-079 (Recommended, coordinator default, proceed: yes, 2026-10-03; answers CONSISTENCY_AUDIT F-8)
- **Decided:** round 1 directions a and b, round 2, round 3 (except what `primary/` rebuilds), the interim email lockup and the E monogram stay in the repo as history, registered `deprecated.*`, and are not deleted. Nothing may use, copy or link them.
- **Why:** not recorded in the source
- **Door:** two-way: files in the repo
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/brand/registry.ts`, `docs/brand/logo-r2`

### R-003 Store, site and legal copy describe only the on-device v1.0
- **Source:** issue #127 item 2 (founder-delegated, 14 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (item 3 and the platform thread's 15 Oct update)
- **Decided:** store, site and legal copy describe only the on-device v1.0. BL-440 is done before any metadata push. No copy promises invites, shared books or a server copy.
- **Why:** it follows from R-001; the store and site promised co-parent invites (#127).
- **Door:** two-way: copy
- **Reversal cost:** low
- **Revisit when:** platform: server features ship (then copy follows R-002)
- **Review by:** on trigger
- **Status:** open: depends on R-001, which is contested with R-016; the BL-440 fix is in open PR #129 and the site copy fix in open PR #131. Sources disagree on 15 Oct. On-device: issue [#127](https://github.com/thesaurabhpareek/earlyletters/issues/127) (posted 06:32 UTC), the Project doc `claude/Early-Letters-Coordination.md` (platform thread, founder quote "On-device v1.0, server in v1.1"; no time given) and [a comment on #124](https://github.com/thesaurabhpareek/earlyletters/pull/124#issuecomment-6186131701) (06:39 UTC). Option B (server features on): open PR [#128](https://github.com/thesaurabhpareek/earlyletters/pull/128) records D-100 (server features on in v1.0) and D-101 (full scope, date moves) as "Decided by the founder, 13 Oct 2026", before #127, with D-100 confirmed by the founder on 15 Oct (no time given), D-106 (alpha by 29 Oct) and D-107 ("Widen.", about 17:00 UTC; PR reopened 17:49 UTC), PR [#145](https://github.com/thesaurabhpareek/earlyletters/pull/145) (12:37 UTC), PR [#152](https://github.com/thesaurabhpareek/earlyletters/pull/152) (15:14 UTC), PR [#163](https://github.com/thesaurabhpareek/earlyletters/pull/163) (18:02 UTC), and the comments on [#81](https://github.com/thesaurabhpareek/earlyletters/pull/81#issuecomment-6198831573) and [#82](https://github.com/thesaurabhpareek/earlyletters/pull/82#issuecomment-6198831926) (18:02 UTC). The founder has to confirm which stands, and the coordinator has to log it.
- **As built:** `packages/content/src/store.en.ts` and `packages/content/src/site.en.ts` still promise sharing on this branch (per the Project coordination doc)
