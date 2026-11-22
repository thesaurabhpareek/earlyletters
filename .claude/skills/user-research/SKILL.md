---
name: user-research
description: User research for Early Letters. Use when planning or running interviews, usability tests, diary studies or surveys with parents and relatives, when synthesising findings, or when a product decision needs evidence about real families. Covers method choice, consent and privacy for research with parents, recruiting, synthesis and where outputs go.
---

# User research (Early Letters)

Load this before you plan a study, write a guide, or turn notes into findings. Research here is with new parents, often tired, sometimes grieving or struggling, and it is about their children. Treat their time and their stories with care.

## 1. Where things live
- Existing synthesis: `docs/research/USER_RESEARCH.md`, `COMPETITIVE_RESEARCH.md`, `LANGUAGES.md`, `competitors/`.
- New studies: `docs/research/studies/<yyyy-mm>-<topic>/` with `PLAN.md`, `GUIDE.md`, `FINDINGS.md`. Raw notes, recordings and consent forms never go in the repo.
- Metrics and analytics questions go to `decision-science` and `analytics`; the tracking plan is opt-in only.

## 2. Choose the method by the question
| Question | Method | Size |
|---|---|---|
| What do parents do today, and why? | Contextual or remote interviews | 6 to 10 per segment |
| Can people do this task with this design? | Moderated usability test, think-aloud | About 5 per round, then iterate (Nielsen, 2000) |
| How does use change over weeks? | Diary study | 8 to 12, 2 to 4 weeks |
| How common is something we already understand? | Survey | Enough for the decision; state the margin |
| Which of two designs do people prefer? | Preference or first-click test | 15 to 30 |
| How usable overall? | System Usability Scale after a test | Same participants |

Ask what decision the study will change before running it. If no decision changes, do not run it.

## 3. Consent and privacy (non-negotiable)
- Written, plain consent before any session: what we record, who sees it, how long we keep it, how to withdraw. Recording is opt-in per session.
- Collect the least you need. No child's full name, no birth dates, no photos of children. Use participant codes (P01) everywhere.
- Raw recordings and notes live outside the repo in founder-controlled storage, deleted on a stated date. Only de-identified findings come into `docs/research/`.
- Real family details never go in code, tests or fixtures (CLAUDE.md; enforced by `no-real-family-data.test.ts`). Quotes in findings are trimmed of anything identifying.
- Participants are adults 18+. Do not interview or record children.
- If someone discloses distress or risk, stop the task, be kind, and give support information. Do not probe. Note only that the session ended early.
- Incentives cost money: a founder decision. Recruiting through personal networks introduces bias; say so in the plan.

## 4. Running a session
- Guide: warm-up, the person's own story first, then tasks, then reflection. Open questions ("Tell me about the last time...") over leading ones ("Would you like...").
- Never pitch, never correct, never promise features.
- Respect the constitution in what you test: never test a feature that writes, rewrites or summarises a person's words.

## 5. Synthesis
- Affinity map observations (what people did and said), then themes, then insights (why), then implications (what we should change).
- Separate evidence from interpretation. Count how many participants showed each pattern; do not turn one quote into a trend.
- Frame jobs as "When ..., I want to ..., so I can ..." when that helps the product team.
- Each finding: evidence (participant codes), confidence (low, medium, high), and the decision it informs.
- Celebrate what families do; do not frame findings as gaps or failures (VOICE.md).

## 6. Output
`FINDINGS.md` leads with the decision and the answer in three lines, then findings, then method and limits. Hand implications to `product` as backlog proposals and copy issues to `content`.
