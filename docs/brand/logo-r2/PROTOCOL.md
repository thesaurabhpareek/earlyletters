# Logo round 2: team protocol (15 agents, parallel, with debate)

Read `docs/brand/LOGO_R2_BRIEF.md` first. This file says who does what and when.

## Team
Makers (write only in their own folder under `packages/brand/assets/logo/r2/<slug>/`):
- `moon-letter` (D1), `two-voices` (D2), `held` (D3), `years` (D4), `kept-note` (D5), `wildcard` (D6): symbol concept designers.
- `wordmark` (T1): typographer. Refines the wordmark that pairs with every symbol.
- `icon-craft` (I1): app icon specialist. Builds the icon test bench and, in phase 3, polishes the finalists' icons.

Critics (write only `docs/brand/logo-r2/critiques/<critic>-r1.md` and `-r2.md`):
- `parents` (K1): parent panel. Simulates 6 real parents (first-time mom at 2am, a dad who travels, an Indian Nani writing in Hindi, a Mexican-American abuela, a co-parent in a two-mom family, a skeptical design-literate parent). Emotion first.
- `strategy` (K2): brand strategist. Recall, distinctiveness in the category (baby, journal, memory, letters apps), ownability, how it scales into a brand system.
- `trademark` (K3): similarity and clearance researcher. Web and image search for near matches; USPTO-style likelihood-of-confusion thinking (classes 9, 16, 42); not legal advice.
- `culture` (K4): cultural and misread reviewer across the 7 launch languages and their cultures (religious, political, bodily, death or loss readings, colour meanings).
- `craft` (K5): type and drawing critic. Curve quality, optical balance, weight, node economy, pairing with the wordmark.
- `production` (K6): accessibility and production. 16/29/40/60px, iOS icon rules and dark/tinted icons, single-colour emboss, email, contrast.

Chair:
- `director` (CD): creative director. Writes the synthesis and the final decision. Is not allowed to design.

## Phases and file signals
1. **Phase 1, make v1.** Makers build v1 per the brief. When done, each writes `<folder>/V1_DONE` (one line summary). Critics and the director read the brief, the brand docs and round 1 (`packages/brand/assets/logo/a`, `/b`) while waiting.
2. **Phase 2, critique r1.** Each critic waits until all six concept folders have `V1_DONE` (poll every 3 minutes; after 120 minutes proceed with what exists and say so). Then reviews EVERY concept (plus `wordmark` and `icon-craft`) and writes `critiques/<critic>-r1.md`: per concept a score 1 to 10 against the six tests from their specialist angle, the single strongest argument for and against, and a concrete fix. Ends with a ranking. Disagree with the obvious answer when you have reason to.
3. **Phase 3, synthesis.** The director waits for all six `-r1.md` files (cap 150 minutes from start), reads every critique and every presentation, and writes `docs/brand/logo-r2/SYNTHESIS_R1.md`: where critics agree, where they conflict and who is right and why, which concepts are CUT (expected: keep at most 3), and for each kept concept a numbered list of required changes. Also instructs `wordmark` and `icon-craft`.
4. **Phase 4, revise v2 and respond.** Makers wait for `SYNTHESIS_R1.md` (poll every 3 minutes; cap 180 minutes from start). Cut designers write `RESPONSE.md` (accept or contest the cut with arguments, one page) and stop. Kept designers build v2, write `RESPONSE.md` answering every critique point (accepted, changed how; or rejected, why) and then `V2_DONE`. `wordmark` and `icon-craft` apply their instructions to the kept concepts and write `V2_DONE`.
5. **Phase 5, critique r2.** Critics wait for `V2_DONE` from every kept concept (cap 270 minutes from start), read the designers' `RESPONSE.md` files and the other critics' r1 files, and write `-r2.md`: verdict on v2, whether the designer's rebuttals hold, and a final ranking.
6. **Phase 6, decision.** The director waits for all six `-r2.md` (cap 300 minutes from start) and writes `docs/brand/logo-r2/DECISION.md`: recommended mark, runner-up, the dissent recorded honestly, remaining risks (including trademark search still needed by a professional), and what the founder must decide.

## Shared rules
- Polling: `sleep 180` between checks inside bash. Never busy-wait.
- Never edit another agent's files. Speak through your own files only.
- Look at real renders (Playwright Chromium at `/opt/pw-browsers/chromium`; `playwright` module at `/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules`) with the Read tool. Do not judge from SVG source alone.
- No installs, commits, pushes or deploys.
- Honesty over politeness. A critique that only praises is a failed critique.
- Final report to the coordinator: under 200 words.
