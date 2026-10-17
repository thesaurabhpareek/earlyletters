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
- **Status:** superseded by D-100: the founder chose option B (server features on in v1.0; merged in PR #128 on 16 Oct), so copy describes the server product; D-100 requires legal pages describing it to be live before sign-in. Kept for history.
- **As built:** `packages/content/src/store.en.ts` and `packages/content/src/site.en.ts` still promise sharing on this branch (per the Project coordination doc)

### D-109 Experience pass calls F2 to F8
- **Source:** `docs/DECISIONS.md` D-109 (Delegated call by the coordinator, 2026-10-16, under the founder's standing delegation of 4 Oct; founder may reverse); PR #173 (merged 16 Oct 2026); the experience pass spec, PR #170 section 7 (merged 16 Oct 2026)
- **Decided:** F2: the BRAND_SYSTEM section 4 "Never" line allows a gradient in the app icon tile and the atmosphere lamp, which never sits inside, behind or around the mark. F3: a new brand registry context `app.welcome`, the stacked lockup at 96 pt on the welcome screen. F4 held: the welcome-first order waits for counsel's answer to C1. F5: the Declared Age Range call is owned by S14 with S17, due before App Store submission. F6: the App Store Connect display names are Plus Monthly and Plus Annual. F7: answered by D-100; server surfaces are in v1.0. F8: typed letters skip Review.
- **Why:** F2: "the founder asked for the website's light and gradients in the app". F8: "typed words are never machine-edited". F3, F5 and F6: not recorded in the source.
- **Door:** two-way: brand rules, a registry context, display names before any listing, and a flow choice
- **Reversal cost:** low: code, copy and brand docs; the F6 names become harder to change once subscriptions are live in App Store Connect
- **Revisit when:** law: counsel answers C1 (F4) or COUNSEL_PACKET Q5 (F5); platform: App Review questions the subscription display names
- **Review by:** on trigger
- **Status:** in force: F4 is held for counsel; the log asks the coordinator to confirm whether S12 or S14 owns F5
- **As built:** `packages/brand/registry.ts` (`app.welcome`, approved D-109 F3); `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` still lists the annual display name as `Plus Yearly` on `develop` (the F6 follow-up is not done)
- **Also:** amends the effect of D-103 for typed letters (condition (c) is met on Write)
