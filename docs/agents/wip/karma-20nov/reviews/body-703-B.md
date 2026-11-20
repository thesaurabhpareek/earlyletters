Draft. **Stacked on #701** (base of this branch is #701's head `4e3225912c8a080d42af456335538b3abe95d305`; it targets `develop`, so the diff shows #701's commits until #701 merges. Review only the last commit). NX-31 R3, content side.

## What changes for a person
When a first book has no name, the app says "your child" (`onboarding.childFallback`). Seven visible strings and two prompts read wrongly with it ("Dear your child,", "Happy birthday, your child", "Say your child's name three times", a lowercase "your child" after a full stop). They now read naturally with a name and without one. A string that opens with the name ("{child}'s book") now opens with a capital when it is "Your child's book".

## How every {child} string was checked
All 284 `{child}` leaves in `packages/content/src` (strings, features, pages, site, book, prompts) were rendered with the fallback and read against VOICE.md and BRAND.md. Result: 9 needed a change; the other possessive and object uses ("your child's book", "Tell your child about today") are natural as they are and are left alone, so named children keep "Asha's book".

## Changed words (needs founder word approval, and design-systems)
| Key | Before | After |
|---|---|---|
| `onboarding.nameCheck.title` | Say {child}'s name three times | Say the name three times |
| `onboarding.nameCheck.doneBody` | {child} will be spelled your way in every letter. | The name will be spelled your way in every letter. |
| `notifications.evening[2].title` | Dear {child}, | A letter for {child} |
| `notifications.evening[5].body` ("Your voice, kept") | Talk for a minute. {child} will hear it one day, just as you said it. | Talk for a minute. One day {child} will hear it, just as you said it. |
| `notifications.birthday.title` | Happy birthday, {child} | Happy birthday to {child} |
| `settings.plan.familySharingHelp` | ... Apple Family Sharing. {child}'s other parent gets it too if ... | ... Apple Family Sharing. The other parent gets it too if ... |
| prompt `opening.before.name` (retired) -> new `opening.before.name-story` | Where did the name {child} come from? Who said it out loud first? | Where did the name come from? Who said it out loud first? |
| prompt `together.37-60.older-self` (retired) -> new `together.37-60.hello-later` | Ask {child} to say hello to the {child} who reads this later. | Ask {child} to say hello to the grown-up who reads this later. |

Prompt keys are stable (core `prompts.ts`: add a new key, mark the old `retired`), so the two prompts are replaced, not edited; `PROMPT_LIBRARY_VERSION` 4 -> 5. `prompts.preBirth.test.ts` now checks the live before-band prompts (`!p.retired`), since a retired one is no longer offered.

## Code (small, mobile)
`fill()` in `apps/mobile/src/lib/copy.ts`: when the blank-name fallback lands at the very start of the result, the first letter is capitalised. That is what lets titles and toasts such as `book.title`, `children.settings.title`, `settings.delete.bookDeletedToast` and the account-deletion lines keep their named wording. One assertion in #701's test updated ("Your child's book").

## Tests (exact titles)
- content `[NX-31-R3] no string reads wrongly when the child's name is blank` (renders every `{child}` string with the fallback; forbids "Dear your child", "your child's name", "Happy birthday, your child", greetings and ", your child" as a vocative, a lowercase "your child" after a full stop, "the your child", "name your child"). Red on the old strings (9 findings: nameCheck.title, evening[2] twice, evening[5], birthday twice, familySharingHelp, both prompts), green after.
- content `[NX-31-R3] the checks catch the known bad readings`.
- mobile `[NX-31-R3] the fallback starts with a capital when it opens a string, and a typed name is left as typed`.

## Overlap with open PRs
`strings.en.ts` open PRs: #502 (hunks near lines 75, 338, 405), #521 (1275), #635 (1311), #644 (849), #683 (282), #699 (59). My hunks are at 153, 163, 667, 670, 692, 756: none adjacent. No other open PR touches `prompts.ts`, `prompts.preBirth.test.ts`, `lib/copy.ts` or `first-run-child-name.test.ts` except #701.

## Left alone, for a decision
- `book.dedication` ("For {child}, from everyone who talked to you this year.") and `book.spine` read badly with the fallback in a printed book (the child is addressed as "you"). Not wired in the app yet (only `book.coverSubtitle` and `aboutThisBook` are), so no change; the print order should refuse a blank name or ask for one.
- `onboarding.nameCheck` is not rendered by any screen today; when it is, it should be skipped for a blank name.
- Prompts about the name (`opening.0-3.name`, `opening.before.name-story`) are still odd for a child with no name; selection could skip them (core, not content).
- Family prompts 90 and 91 read "your child's parent in your child": clumsy but grammatical, left.
- `blocks.tsx` fills `{child}` through `renderTemplate` with `childLabel`, not `fill`, so it does not get the opening capital; no current content block opens with `{child}`.

## UNVERIFIED
- Full `npm test` for mobile and `npm run typecheck` were NOT completed: the machine's disk was full during the run. Run on this branch before merge.
- Content suite on a sparse checkout: 368 passed, 1 failed (`no-real-family-data`, "scan is incomplete: 180 files could not be read" because of the sparse checkout, not the copy).
- No device run.

---
_Generated by [Claude Code](https://claude.ai/code/session_01WsZfAr14RMFfiXXQyKD8VR)_
