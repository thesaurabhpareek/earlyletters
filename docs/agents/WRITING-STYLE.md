# Writing style for harness documents

This page tells every agent how to write harness documents, pull request text, rulings, journal entries and status notes. It applies to everything under `docs/agents/` and to anything the founder reads. Section 9 of `COORDINATION.md` covers status reports and still applies; this page adds the tone.

The rule comes from the founder's instruction of 10 Nov 2026: write in his tone and do not sound like an AI. I have that instruction only as it was relayed to me, so the wording of the rules below is mine and unverified against anything he wrote himself. If he corrects a rule, change this page first and then the documents.

## What his writing sounds like

Use plain words and say the point or the ask in the first sentence. The reason comes after it. When you did or decided something, say so in the first person: "I checked", "I recommend". Put one idea in each sentence and let the sentence run to a normal length, around 12 to 25 words.

Tell the reader what they do or get, with a number and a date. "Merge #612 by Fri 13 Nov, 5:00 PM PT" says more than "soon". When something is wrong, say so in the sentence that names it. When something is unverified, say that plainly, and say who can verify it and by when.

## What he rejects

| Pattern | What it looks like | What to write |
|---|---|---|
| Dashes | an em dash or en dash in a sentence | A colon, a comma, a full stop or brackets. Write "D-082 to D-088" for a range |
| Slogan rhythm | a run of fragments, each a few words | One sentence that says what happens |
| Contrast lines | "not X, it is Y" | Say what it is and leave out what it is not, unless the reader would otherwise guess wrong |
| Triads for rhythm | three items because three sounds right | List the items that exist, however many |
| Bold on many phrases | several bold phrases in a paragraph | Bold only a name the reader must find, or a warning before an irreversible step |
| Bullet walls | ten one-line bullets that are really a paragraph | A short paragraph. Keep bullets for real lists, steps, commands and tables |
| Tagline headings | a heading that is a slogan | A heading that names the topic |
| Filler openers | "It is worth noting that", "In summary" | Start with the point |
| Closing recap | a last line that repeats the body | Stop when the point is made |
| Banned words | the list in `CLAUDE.md` | A plain word. `leverage` becomes "use", `ensure` becomes "check" or "make sure" |

Also out: curly quotes, the ellipsis character and emoji. Write times in Pacific with the day, and write amounts as numbers.

## Six rewrites from the current docs

Each pair quotes a short stretch of the file as it is on develop and gives the rewrite.

1. `COORDINATION.md`, heading of section 4 (a tagline heading with a triad).
   Before: "One answer per question: propose, debate, converge"
   After: "Deciding a question that affects other owners"

2. `COORDINATION.md`, opening paragraph (a triad added for rhythm).
   Before: "The goal is one product with one set of patterns: no duplicate work, no conflicting conclusions, no surprise publishes."
   After: "The aim is one product built to one set of patterns. When two agents work on the same thing, the second one stops and talks to the first, and nothing is published until the founder has agreed to it."

3. `WALLS.md`, first paragraph (slogan rhythm).
   Before: "Walls are permanent. Design around them; never get round them."
   After: "A wall does not move, so plan the work around it and do not try to get past it."

4. `README.md`, second paragraph (a list inside brackets, with the file name in bold).
   Before: "Everything about the team (how it is built, how agents are created and run, how they keep context, how spend stays low, and the setup steps) is in" HARNESS.md.
   After: "HARNESS.md describes how the team is built and run, how agents keep context, how spend is held down, and the setup steps."

5. `WALLS.md`, rule 3 (a bold lead-in and a contrast line).
   Before: "Stage at most 10 minutes ahead." and later "Open the tab when he is ready, not before."
   After: "Stage a page no more than 10 minutes ahead, because vendor sign-in pages and forms time out. Pages staged hours early had expired on 31 Oct and 1 Nov. Open the tab once he says he is ready."

6. `harness-v2/LESSONS-2026-11-08.md`, section 1 (five labelled one-line bullets: Wasted, Evidence, Rule, Enforced by, Covered by).
   Before: "Wasted: reviews started or posted against a head that changed before the verdict was read."
   After: a paragraph: "Reviews were started or posted against a head that changed before anyone read the verdict. PR #517 changed head 9 times on 8 Nov. From now a reviewer reads the head sha first and starts only when CI has settled and the head has been quiet for 10 minutes. The merge queue script checks this with STALE-REVIEW and WAIT-QUIET, and HV2-B32 covers the work."

The sixth rewrite is shortened for this page and leaves out the review-binding sentence and the related ids. A real rewrite never drops a number, a date, an id or a caveat. If a sentence cannot be rewritten without losing one, leave it and say why in the PR.

## Checking a document

Run `node scripts/agents/tone-lint.mjs docs/agents/<file>.md` before you open a PR. It prints hard findings (dashes, curly quotes, the ellipsis character, emoji, banned words) and four soft numbers: bold per 1000 words, the share of lines that are bullets, the share of sentences of five words or fewer, and the count of contrast lines. The soft numbers have no limit. Read them as a prompt to reread the page.

`node scripts/agents/tone-lint.mjs --check` exits 1 on a hard finding that is not in `docs/agents/tone-baseline.txt`. The baseline can only shrink. When you fix a listed finding, the entry goes stale and `--check` fails until you run `--update-baseline`, which refuses to add or grow an entry. The check is not wired into CI yet; the founder decides when it is.

Existing documents are rewritten one file at a time, in separate pull requests, and only when someone is already changing that file. A rewrite that touches every file at once would conflict with all open work.
