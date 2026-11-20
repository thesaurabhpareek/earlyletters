# Engineering design brief for the locked requirements pack v1.0 (Karma, 20 Nov 2026)

## Source of truth
- The founder named the 217-page PDF "Early Letters - Product vision, requirements and delivery plan (locked v1.0, 20 Nov 2026)" as the source of truth. It is built from the repo branch `docs/prd-lock-v1-20nov` (PR #846), head `450bcb4a`. Read the files there, not the PDF: `git fetch origin docs/prd-lock-v1-20nov` then `git show origin/docs/prd-lock-v1-20nov:docs/product/prd/<file>`. Key files: `README.md` (locked card shape, ground rules), `00-product-frame.md`, the cards `01` to `12`, `13-engineering-plan.md`, `14-test-plan.md` (J-N journeys, P0 register, device matrix, store gate), `16-council-review-round-2.md` (gates G0 to G6, findings F1 to F17), and `docs/product/VISION.md`.
- If #846's head is no longer 450bcb4a when you start, say so in your reply and use the new head.
- Code and decisions on `develop` are the current system: `docs/ARCHITECTURE.md`, `docs/adr/` (including 0028, accepted under CR-62), `docs/tdd/01` to `10` (the v1.0 technical designs), `docs/engineering/PRINCIPLES.md` and chapters 01 to 10, `docs/DECISIONS.md` (D-161, D-162 are merged), `docs/agents/cto/RULINGS.md` (CR-62, CR-63), `CLAUDE.md` (the constitution: the machine may remove and repair, never add meaning).
- The task-level engineering project plan is open PR #847 (`docs/product/prd/17-engineering-project-plan.md` on branch `docs/engineering-project-plan-20nov`); read it for owners, waves and backlog rows. It is being re-keyed to the locked pack; where it disagrees with the locked cards, the cards win.

## What you write
One design file for your area, `docs/tdd/new-scope/<your-file>.md`, ASCII only (no em or en dashes, curly quotes, ellipsis characters or emoji), at most 400 lines (CODE-R02; if it cannot fit, split it into two files of at most 400 lines each and say why). Write it to the path given in your task under the scratchpad, not into the repo. Karma assembles the PRs.

Use the tags of `docs/tdd/01-mobile-client.md`: Fact (cite file:line), Assumption, Rec, Risk, OQ (open question with an owner and a default), Conflict (two sources disagree; never resolve silently), Unverified (a platform or library behaviour you did not confirm against its docs or source).

## Depth by wave (so nothing is thrown away)
Wave is the card's wave in `13-engineering-plan.md` section 4 and #847 at the locked head.
- Waves 1 and 2: full design, ready to build. For each card: the user-visible behaviour it must meet (cite the acceptance rows by id, do not restate them); components and files touched (existing paths); data (local SQLite tables and columns, local migration number, server tables, migrations, RLS and grants, classification level); sync and API contract changes (`packages/api`); native work (modules, entitlements, plist keys: none may be added without saying so); flags (`EXPO_PUBLIC_*`, off by default); privacy and security (what leaves the phone, threats, the X2 rule for a child's voice); performance budget; how each P0 row is tested (unit, integration, device row, journey J-N id); the PR breakdown (each PR at most 400 lines and 20 files, in merge order, with its owner handle and its two review lenses); dependencies; risks with a way back; open questions.
- Wave 3: a design outline: the decisions, the interfaces, data changes, the PR breakdown at a coarse level, risks and open questions. No pixel or string detail.
- Waves 4 and 5, gated or parked cards: one short paragraph per card: what the design would rest on, what must be decided first (and by whom), and nothing more.
- Cards already built or in review (NS-01 photo: the stack #835 to #842 and ADR 0028; NS-02 Find: #798; NS-35 one start: #828; NS-09 let it go: #832): do not redesign. Record what is built, where, and only the rows still open, with their design.

## Rules
- Never write, approve or change words a parent reads. Use content keys and mark new ones PROPOSED for `content`; the founder approves words.
- Never set a date. Never decide a founder or counsel question: list it with a default and an owner.
- Never weaken the constitution, the review gate, or a privacy rule. Anything that would send a child's voice or a picture off the phone needs the X2 note (security-architect read and counsel read first).
- Prefer what exists: reuse modules, stores and patterns already in `apps/mobile/src`, `packages/*`, `supabase/`. A new library or native module needs a line saying why nothing existing fits.
- One source of truth: cite card rows and ADRs by id; do not copy their text.
- Where the locked card and the code disagree, or two cards disagree, write a Conflict line and list it at the end under "For product" (card gaps) or "For Karma" (engineering decisions).

## Your reply
The file path, its line count, the cards covered with their depth, the top five risks, every OQ that needs the founder or counsel (with defaults), every Conflict, and what you could not verify.
