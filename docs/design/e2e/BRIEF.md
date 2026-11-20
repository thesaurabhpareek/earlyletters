# End-to-end experience: brief for the 15 design, motion and content leads (20 Nov 2026)

Owner: Karma (CTO role) with the Chief Design Officer role. The founder asked on 20 Nov for five design leads, five animation leads and five content design leads to produce full prototyping and design, integrations, happy paths, unhappy paths and errors, so the team has a full end-to-end view of the experience, aligned with the harness so only the latest requirements and the engineering work are used.

## 1. Sources, in order (CR-66)

1. The locked cards `docs/product/prd/01` to `12`, under the frame `00-product-frame.md`. These are the only requirement source. Each card's sections "Happy path", "Unhappy paths", "Scenario coverage", "Acceptance", "State space (RR-5)", "Never", "Design inputs", "Content inputs" and "Claims" are what you design to.
2. `14-test-plan.md` (journeys J-N1 onward, P0 register) and `16-council-review-round-2.md` (rulings T1 to T5, defaults D1 to D13).
3. Engineering: `13-engineering-plan.md`; the engineering thread's plan PR #847 (`docs/product/prd/17-engineering-project-plan.md`, read with `gh api repos/thesaurabhpareek/earlyletters/contents/docs/product/prd/17-engineering-project-plan.md?ref=docs/engineering-project-plan-20nov --jq .content | base64 -d`); backlog rows BL-922 to BL-987 in `docs/BACKLOG.md`; engineering design inputs as they appear in `/home/claude/review/eng/` (data and sync, mobile client, platform). Use them for flags, kill switches, error codes and what each screen depends on.
4. House design: `docs/design/DESIGN_LANGUAGE.md`, `COMPONENTS.md`, `COMPONENT_LIBRARY.md`, `IA.md`, `MOTION.md`, `NOTIFICATIONS.md`, `SOUND.md`, `PHOTOGRAPHY.md`; tokens in `packages/design-tokens/src`; words rules in `packages/content/VOICE.md`, `packages/content/BRAND.md` (glossary and the internal-terms table, CR-25) and `packages/content/test/rules.test.ts`; existing strings in `packages/content/src`.
5. The 10 and 11 Nov design specs in `docs/design/specs/` are history: use them where a card agrees, and where a card differs the card wins; say which you superseded.

The app as built is the baseline: read the screens in `apps/mobile/src/app` and components in `apps/mobile/src/components` before drawing a screen that exists.

## 2. Rules nobody breaks

- The constitution: the machine may remove and repair; it may never add meaning. No caption, summary, rewrite, suggested first, detected moment or generated text anywhere.
- Three tabs: Home (Say), Book (Read), Me (Look after). Only Home starts a letter. Family is never a tab. No "coming soon" surface in any build.
- Home slips, one at a time, fixed order (errata E36): (1) the existing waiting cards; (2) the seal-opened line on its day; (2b) a day the parent chose, today; (3) Save a copy in the birthday week; (3b) the Days ask; (4) one past letter. The reminder ask and the Plus line are not slips; the photo start is part of the capture cluster.
- Undo windows (T4): open for the stated seconds, or until VoiceOver has read the undo line plus that many seconds, whichever is later; with Switch Control, until the parent moves on.
- Sign-out keeps the book on the phone and says so (D1). Writing tools off on letter fields (D2). Nothing donated to Spotlight or Siri (D3).
- Words: no em dashes, en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never imply AI writes; `{child}`, never a gendered child; no streaks, points, badges or counts of gaps; "stored copy" for the picture file; "Printable", never "print-ready". Parent-facing words only from the BRAND.md glossary; internal terms (take, entry, draft, pack, lens, index) never reach a parent.
- Accessibility to AX5 on an iPhone SE 3 width (375 pt): VoiceOver order and labels, Voice Control names equal visible labels, Switch Control, Smart Invert (pictures exempt), Bold Text, Reduce Motion, colour never the only signal, targets 44 pt or more.
- Fictional family only: Asha. No real names, letters, pictures or voices in any file.
- Every new string is a PROPOSED key; the founder approves words before any build outside his family shows them.

## 3. The five areas and the trio for each

| Area | Cards and surfaces |
|---|---|
| A. Capture | Home and the capture cluster; photo-first start and the system picker (NS-01 capture side); recording, Listen, Review and Keep; Let it go (NS-09); whose book (NS-14); a letter for another day (NS-15); someone else speaks (NS-16); a second spoken language (NS-17); add more to this letter (NS-19); one start (NS-35); quick capture doorways (NS-06 C); hands-free states (NS-04 findings as design hypotheses only) |
| B. Book and reading | The Book, the Book header (NS-22), the Photos lens (NS-01, NS-37), Find (NS-02), the letter page as one list (NS-21), one past letter on Home (NS-23), Read together and read the year back (NS-24), Firsts lens and marking a first (NS-06 A), sealed letters: seal, wait, open (NS-06 B), read-along (NS-29, parked: a decision record only) |
| C. Keeping and trust | Me (Look after); Save a copy of the year (NS-11); export and the printable book (NS-07 C28, NS-36); a new phone (NS-10); recording backup readiness (NS-08, off; design the honest states only); earlier versions (NS-12); Quiet this book and Hide; erase everything, sign-out (D1), account deletion including pictures and sealed letters (D6); recently deleted |
| D. Family, sharing and reminders | Share one letter, Level 1 (NS-05); the other parent in the store app (NS-25); reminders, back-off and stop (NS-13); typed days (NS-18); one notification budget and every notification class, lock screen with previews hidden (NS-32); quiet days (NS-07 C5); the family-hears-it pilot artefacts the parent sees (NS-03) |
| E. Foundations and system states | First run and sign-in as built, with every locked-pack change; offline, server outage, kill switch (`serverFeaturesEnabled()` off and each remote pause), plan lapse, second account on one phone, low storage, app update, interruption (call, background, kill); global error screens and every error code the cards name; Plus and the allowance (one gate at Keep); accessibility walk (NS-33) and speed on the smallest phone (NS-34); dark mode; the design-system components every area uses |

Each area has a design lead, a motion lead and a content lead working in the same folder `docs/design/e2e/<area-letter>-<area-slug>/`. Work in parallel; read each other's files as they appear, and finish with a reconciliation pass so screen ids, state names and string keys match across the three files.

## 4. Deliverables per area

Design lead:
- `DESIGN.md`: the journeys (every happy path and every unhappy path from the cards' scenario tables and state spaces, as numbered flows); the screen and state inventory with ids `<area>-S<nn>` and states `<area>-S<nn>.<state>` (default, empty, loading, offline, error per code, kill switch, plan lapse, second account, AX5, VoiceOver order, dark); for each screen the layout at default size and at AX5, components used (existing first, new ones named and justified), and the integration map (card rows satisfied, backlog row, flag, kill switch, error codes, data read and written, engineering module).
- `PROTOTYPE.html`: one self-contained clickable prototype (no external network, no frameworks from a CDN, inline CSS and JS, token values copied from `packages/design-tokens`) that walks every journey, with a state switcher per screen, light and dark, and a text-size toggle that shows the AX5 layout. iPhone frame at 375 x 812 pt. Placeholder pictures are drawn shapes, never photos of people.

Motion lead:
- `MOTION.md`: every transition and feedback moment in the area's journeys keyed to the design ids: trigger, what moves, duration and easing from `docs/design/MOTION.md` and the tokens, Reduce Motion alternative, haptics (`SOUND.md` and the existing haptics), and what must never animate (no celebration, no ceremony, no counters). Calm and quick: nothing over 300 ms unless the card says so.
- `MOTION-PROTOTYPE.html`: a self-contained page that plays each transition on demand, with a Reduce Motion toggle.

Content lead:
- `WORDS.md`: every string in every state of the area keyed to the design ids: PROPOSED key, text, where it shows, VoiceOver label and hint, Voice Control name, the card row it satisfies; every error message per error code (what happened, what the parent can do, never blame or fear); empty states; notification titles and bodies (no child name or letter text on a lock screen by default); the strings that already exist, by key, reused where they fit. Run each string against the rules in section 2 and `rules.test.ts`.
- A short "claims check" at the end: any line that makes a public promise, and the card's Claims section it stays inside.

## 5. How this lines up with the harness

- These 15 leads run in an interactive session (rows BL-988 to BL-992 in `docs/BACKLOG.md`, Mode: pair, so the dispatcher does not start a second copy).
- Read only the locked cards for requirements. If a card is silent, ambiguous or wrong against the code, write it in a "Card gaps" section at the end of your file (card row, what is missing, your proposed default); never change a card.
- Design changes no engineering plan. Where a screen needs something the engineering plan or backlog does not have, list it under "Engineering gaps" with the backlog row it belongs to.
- Write only inside your area folder. Do not commit, push, open PRs or post anywhere; Karma collects, reconciles and commits.
- ASCII only in every file (the content rules apply to docs too).

## 6. The gap loop with product (added 20 Nov on the founder's instruction)

Design and product work together while design runs, so the requirements improve wherever design finds a gap.
- Every lead keeps a "Card gaps" table (id, card row, what is missing or unclear, proposed default) and an "Engineering gaps" table (gap, file, backlog row). Write gaps as soon as you find them, not only at the end.
- Karma (product side) collects them into `docs/product/prd/GAP-LOG.md` on branch `docs/locked-pack-inputs-20nov`, with one ruling per gap: card change (applied through `18-errata-after-lock.md` or the new card file), founder question (with a default), engineering gap (sent to the engineering thread), or no change (with the reason).
- Until a gap is ruled, design uses its own proposed default and marks the screen state "pending ruling G-xx". After a ruling, the leads re-key to it in their reconciliation pass.
- The journey from App Store download to the first kept letter is now carded separately (`docs/product/prd/19-from-download-to-first-letter.md`, NS-38 onward). Area E designs it end to end; gaps there come back the same way.

## 7. Function requirements (added 20 Nov on the founder's instruction)

Legal, compliance, privacy, support and policy, marketing, operations, risk and security, data and measurement, and finance are reviewing the requirements and writing the ones they need (`docs/product/prd/functions/*.md` on `docs/locked-pack-inputs-20nov`, ids `FR-<CODE>-nn`). Each has a "Design needs" section keyed to your screen ids. After the reviews land, each area runs one reconciliation pass and adds a section "Function needs accounted for": FR id, screen and state, what changed (screen, state, string, flow) or why nothing changed. Linked in `docs/product/prd/FUNCTION-TRACE.md`.
