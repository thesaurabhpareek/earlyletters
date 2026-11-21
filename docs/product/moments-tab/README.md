# Moments tab: document index

Status: PROPOSED. Everything in this folder and in the linked pull requests is a proposal. Nothing here is decided until the founder signs it. No shipped screen may carry the word PROPOSED.

Tab name: Moments (founder, 21 Nov 2026: "Think we go with Moments"). Counsel (X1) advises in-app use only, not store metadata, until a trademark clearance. The glossary ruling is in `D6-tab-name-ruling.md`; the content change itself is in PR #1276.

Brief of record: the shared Moments brief (20 and 21 Nov 2026). Tab position is open in the brief; every lead who answered recommends Home stays the landing tab and Moments is second.

## Every Moments doc

Some files below arrive in other pull requests. A name with no file in your checkout yet is in one of those PRs.

### Product (this PR)
- `P1-tab-job-and-ia.md`: the tab's job, position, the daily reason to come back
- `P2-feed-sources-and-ranking.md`: what For you and Recent show, ranking, nudge sources
- `P3-value-props-and-permission.md`: value before permission, the plain ask, Not now
- `P4-capture-handoff-and-attach.md`: from a card to a letter, attaching pictures
- `P5-rollout-metrics-and-backlog.md`: rollout, flags, measures, backlog slices

### Design (design PR)
- `D1-layout-and-card-system.md`
- `D2-value-prop-and-permission-screens.md`
- `D3-moment-cards-and-states.md`
- `D4-accessibility-and-themes.md`
- `D5-content-and-microcopy.md`
- `D6-tab-name-ruling.md`

### Benchmark (benchmark PR)
- `B1-market-benchmark.md`

### Motion (animation integrator)
- `A1-motion-principles.md`
- `A2-collage-and-loading-motion.md`
- `A3-value-prop-and-permission-motion.md`
- `A4-card-to-capture-motion.md`
- `A5-reduce-motion-and-performance.md`

### Transitions (transition integrator)
- `T1-tab-transitions.md`
- `T2-permission-transitions.md`
- `T3-capture-navigation.md`
- `T4-photo-and-collage-transitions.md`
- `T5-nudge-landing-transitions.md`

### Cross-functional (xfn integrator)
- `X1-legal.md`
- `X2-policy.md`
- `X3-architecture.md`
- `X4-compliance.md`
- `X5-data.md`

### Related open PRs (not in this folder)
- #1264 Home engagement wheel (`docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md`)
- #1267 privacy and constitution read
- #1269 engineering feasibility (Route A or Route B)
- #1270 design concept
- #1276 content change that allows Moments as the tab label

## Founder-owned reversals

Each doc lists the earlier rulings that Moments would overturn, and the founder owns every one: J4 (only Home starts a letter), K-02 (no permission ask in first run), BL-1305 (no photo-library usage string or PhotoKit call in any 1.x build), ML-6 (cards show a date, never a place or thumbnail), and the three-tab ruling in `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` (project doc). See `P3` (RV-M list), `P4` (RV-P4 list) and `P5` section 3.

## Reconciliation items

These are conflicts between the docs in this folder, found while assembling the PRs. They are not fixed here. The lead text is unchanged.

1. Old working name. `D5-content-and-microcopy.md` (finding MT-D5-F1, section 4 table, `gather.*` keys) recommends "Gather", which the founder withdrew. `D2-value-prop-and-permission-screens.md` (MT-D2-Q1) and `P1` still treat Moments as a working label. `D6-tab-name-ruling.md` section 6 lists the edits.
2. Tab position if the founder signs Moments as default. `P3` section 5.3 (default only after the first letter is kept) differs from `P4` section 4.1 and `P5` section 4.4 (a flat default, cold start on Moments). All five of P1, P2, P3, P4, P5, plus D1 and B1, recommend Home default, Moments second.
3. Photo ask in 1.0. `P5` section 4 (O2, RECOMMENDED: tab with Asha examples at 1.0, no photo ask and no usage string, library part in 1.0.x) against `P3` section 6.3 and `D2` (the first open of the tab already shows the ask card and primer). Under O2 the ask card would be hidden until the library part ships.
4. Email nudge. `P1` section 6 (recommends no come-back email at 1.0), `P2` section 8 (S3 birthday and month-day email as its own opt-in class), `B1` section 7 (an optional email) and `P5` RV-6 (email is transactional only at 1.0, FR-MKT-44, E75). Needs one answer.
5. Recent length. `P2` MT-P2-R18 (Recent fits one screen, no endless scroll, no "show more") against `D3` section 9 (the first month fills in newest first, then more months).
6. Position deadline. `P1` Q-P1-1 sets Mon 24 Nov 2026. Other docs use their own deadlines. The founder meeting date should be one.
7. Route A titles. `P4` OQ-P4-8: NS-49-R9 conflicts with "Apple's title is never stored or shown by us". Needs the founder or a rewording.
8. Count in a VoiceOver label. `P4` section 9 notes NS-01-R11 (no number of pictures on screen or in any VoiceOver string) against NS-52-R28 ("Picture 2 of 4"). Needs a ruling.
