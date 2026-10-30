# Brief (h): PR #302, what is still open after D-118

Status: open, not decided. D-118 itself is decided and recorded: the founder chose to name the child on the website, and #307 put D-118 and the guard exception on `develop` (merged 28 Oct 05:40 UTC, Tue 27 Oct 10:40 PM PT, `6bfb94a9`). This brief does not reopen that. It covers what is left.
Needed by: before the website is promoted or the alpha link is shared beyond the family (the review point in the D-118 entry, labelled a coordinator proposal, not the founder's: [DECISIONS.md:832](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L832)); at the latest Mon 9 Nov if Friends get the link with build 2.
Default if unanswered: #302 stays open. `site.ts` on `main` keeps the fictional family (D-111 item 1; checked 28 Oct); nothing new is exposed.

## What is still open
1. Merging [#302](https://github.com/thesaurabhpareek/earlyletters/pull/302) into `main`. It is a production deploy that the founder merges ([DECISIONS.md:831](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L831)). State at 28 Oct 13:53 UTC: open, head `3ba0f736`, 9 files, GitHub reports `mergeable: false`, `mergeable_state: dirty` (it conflicts with `main`, now at `05cf0a37`), so it needs a rebase before any merge; the author's comment reports 212 of 212 web end-to-end tests passing.
2. No privacy or counsel review is on record. #307 had two lens reviews and 0 GitHub reviews (retro spot-check 15).
3. The change to F21-REQ-017 is proposed, not made ([DECISIONS.md:829](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L829)).
4. `CLAUDE.md` (the privacy rule), `.github/pull_request_template.md` line 19 and `docs/agents/OPERATING_MODEL.md` section 8 still state the rule without the exception; D-118 leaves them to the founder ([DECISIONS.md:831](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/DECISIONS.md#L831)).
5. Whether older public git history holds real family details from before #52 is unverified. D-111 item 1 did not request a history purge.

## Options for item 1
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Merge #302 now | The real first name goes live | The repository is public and the site deploys from `main`, so the name is effectively permanent and shows next to the product in search (D-118's accepted risks) |
| 2. Get a privacy view first, then merge | A short written privacy view (or a counsel question in the #163 packet) before the merge | A few days' delay; the site keeps the fictional family meanwhile |
| 3. Reverse D-118 | Close #302; a new PR removes the guard exception on `develop` | Reverses the founder's own call of 27 Oct; one small PR |

Items 3 and 4 are small text changes the founder (or the requirement's owner) makes under any option except 3. Item 5 is a question for counsel.

## Recommendation (a recommendation, not a decision)
Option 2: keep D-118, but hold #302 until a privacy view is on record, because the exposure cannot be undone once the site deploys. Put items 3 to 5 in the founder queue.
