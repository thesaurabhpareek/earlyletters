# Engagement loops: draft copy for the gaps

Status: PROPOSED (docs only) | 21 Nov 2026 | Owner: `content` | Matrix: [MATRIX.md](MATRIX.md) | Gaps: [GAPS.md](GAPS.md)

Every line below is PROPOSED. Nothing is wired, no key is added to code, and the founder approves the words before any flag turns on. Draft ids are labels for this file, not keys; engineering assigns keys when a loop is wired. Product name never appears: where a line would need it, it would use `{app}`. These lines cover the gaps in GAPS.md only; they do not repeat the catalogue samples or the day briefs.

Every playful line is tagged `tone: playful` and names a plain fallback. With the `humour` flag off, the fallback runs in the same slot. Playful scope is the founder's Option 2 of 21 Nov: Friday and Saturday notes (Q-FD-27), one dry saved-letter line, and in-app wording for the five public days (the four seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day). A selection is not words, so every playful line stays PROPOSED and he approves it key by key. No playful line is on a library-day lock screen (NS-47-R12), and none is tied to a ticked festival, tradition, country or region, a first-run screen, an error, money, deletion or safety.

Reading the counts: T title, B body, N neutral body (names off), S subject, P preheader. Push limits are title 40 and body 110; the house target for a body is under 60 (guide v1.2 section 8). "Neutral-safe" means the names-off rendering has no name, digit, year or age. "Names-on only" means the line carries `{child}` or `{month}` and is never picked with names off or App lock on.

## What ran

A script in `/home/claude/copywork` (not committed) ran on every line: ASCII only, zero exclamation marks, the `rules.test.ts` fear, AI, daily-rhythm and gap patterns, the guide v1.2 banned words and the glossary internal terms, the ten `lint:copy` tells (copied from branch `chore/copy-tells-lint`, because `lint:copy` is not on `develop`), the PRD README appendix A lists, push length limits, email length limits, `{child}` never in a title unless names-on only, the names-off rendering, a faith-word scan on lock-screen lines, the days N1 to N11 rules on day lines, a fallback check on every playful line, and a five-word overlap check against the 40 catalogue samples and against each other. Result: 60 lines, 0 failures. Not run: `npm test -w @scribe/content` (these lines are not in `packages/content`, so it cannot see them), `npm run lint:copy`, and any human read-aloud. Five lines are over the 60-character body target and pass the 110 limit: marked below.

Read these first, because a script cannot judge them: E3-r3-p and E4-r2-p (they speak of the book as if it has a view), D1-season-p (the season "without asking"), D2-labor-p ("no instructions").

## Local push (lock screen)

| Draft id | Loop | Channel | Tone | Words (title // body) | Chars | Checks |
|---|---|---|---|---|---|---|
| E3-r1-p | LP-E3 | local push | tone: playful (fallback E3-r1-f) | Friday, officially // One small thing from this week. Funny ones are welcome. | T18/B55 | pass; neutral-safe |
| E3-r1-f | LP-E3 | local push | tone: plain | A minute on Friday? // One small thing from this week is plenty. | T19/B41 | pass; neutral-safe |
| E3-r2-p | LP-E3 | local push | tone: playful (fallback E3-r2-f) | The week, in one line // Say the thing you'd tell a friend about first. | T21/B46 | pass; neutral-safe |
| E3-r2-f | LP-E3 | local push | tone: plain | A line from this week // Say one thing from the week for the book. | T21/B41 | pass; neutral-safe |
| E3-r3-p | LP-E3 | local push | tone: playful (fallback E3-r3-f) | A Friday idea // Pick any moment from the week. The book isn't fussy. | T13/B52 | pass; neutral-safe |
| E3-r3-f | LP-E3 | local push | tone: plain | Friday, whenever suits // Whenever there's a minute, anything from the week will do. | T22/B58 | pass; neutral-safe |
| E3-r4-p | LP-E3 | local push | tone: playful (fallback E3-r4-f) | One for the weekend // A word that made you laugh, a sound, a look will do. | T19/B52 | pass; neutral-safe |
| E3-r4-f | LP-E3 | local push | tone: plain | Whenever suits // The book is here whenever you want it. A sentence will do. | T14/B58 | pass; neutral-safe |
| E4-r1-p | LP-E4 | local push | tone: playful (fallback E4-r1-f) | Anything funny today? // Weekends usually produce something. A sentence will do. | T21/B55 | pass; neutral-safe |
| E4-r1-f | LP-E4 | local push | tone: plain | Saturday // Anything from today? A sentence will do. | T8/B40 | pass; neutral-safe |
| E4-r2-p | LP-E4 | local push | tone: playful (fallback E4-r2-f) | Saturday, no agenda // If anything made you laugh today, it belongs in the book. | T19/B57 | pass; neutral-safe |
| E4-r2-f | LP-E4 | local push | tone: plain | Anything from today? // Whatever comes to mind is fine. | T20/B31 | pass; neutral-safe |
| E4-r3-p | LP-E4 | local push | tone: playful (fallback E4-r3-f) | Saturday, in one breath // Something from today, said as fast as you like. | T23/B47 | pass; neutral-safe |
| E4-r3-f | LP-E4 | local push | tone: plain | A Saturday minute? // Something from the weekend, whenever you have a moment. | T18/B55 | pass; neutral-safe |
| E4-r4-p | LP-E4 | local push | tone: playful (fallback E4-r4-f) | Saturday, unhurried // Whatever's on your mind about today works. A line is welcome. | T19/B61 | pass; neutral-safe; over 60 target |
| E4-r4-f | LP-E4 | local push | tone: plain | The book is here // Say whatever's on your mind about today. | T16/B40 | pass; neutral-safe |
| E5-r3-a | LP-E5 | local push | tone: plain | Sunday, slowly // If there's a quiet minute, a few words would fit in it. | T14/B55 | pass; neutral-safe |
| E5-r3-b | LP-E5 | local push | tone: plain | A slow Sunday one // Pick one moment from the weekend. There's no hurry. | T17/B51 | pass; neutral-safe |
| E1-r3-a | LP-E1 | local push | tone: plain | A small Monday one // One sentence from today is a fine start to the week. | T18/B52 | pass; neutral-safe |
| E1-r3-b | LP-E1 | local push | tone: plain | Monday, one line // Something small from today is plenty. | T16/B37 | pass; neutral-safe |
| E6-spoke-child | LP-E6 | local push | tone: plain | Any questions lately? // What has {child} been asking about? Say one as it was asked. // neutral: What questions have come up lately? Say one as asked. | T21/B60/N53 | pass; neutral-safe; over 60 target |
| E6-typed-newborn | LP-E6 | local push | tone: plain | A few words out loud? // {child} can hear it one day. Your own voice suits the book. // neutral: Your own voice suits the book. | T21/B59/N30 | pass; neutral-safe |
| E6-first-baby | LP-E6 | local push | tone: plain | Was that a first? // A new sound or a new trick? Say what happened. | T17/B46 | pass; names-on only |
| E6-first-toddler | LP-E6 | local push | tone: plain | Something new lately? // A new word, skill or favorite? Say it for {child}'s book. | T21/B57 | pass; names-on only |
| E6-small-newborn | LP-E6 | local push | tone: plain | A quiet one is fine // Anything small about {child} is welcome, or tap Not much today. | T19/B63 | pass; names-on only; over 60 target |
| E6-small-child | LP-E6 | local push | tone: plain | Anything small from today? // One sentence about {child} will do, or tap Not much today. | T26/B58 | pass; names-on only |
| A1-newborn | LP-A1 | local push | tone: plain | Month {month} is open // What is {child} like at the moment? Whatever comes to mind works. | T21/B65 | pass; names-on only; over 60 target |
| A1-baby | LP-A1 | local push | tone: plain | Month {month} begins // What does a day with {child} look like right now? | T20/B49 | pass; names-on only |
| A1-toddler | LP-A1 | local push | tone: plain | Month {month} is here // What is {child} saying, asking or carrying around lately? | T21/B57 | pass; names-on only |
| A1-child | LP-A1 | local push | tone: plain | Month {month} has started // What is {child} into this month? A sentence will do. | T25/B52 | pass; names-on only |
| A2-a | LP-A2 | local push | tone: plain | A page is open // Something small for the book, whenever you like. | T14/B48 | pass; neutral-safe |
| A2-b | LP-A2 | local push | tone: plain | A new page for the book // One small thing is plenty. | T23/B26 | pass; neutral-safe |
| A2-c | LP-A2 | local push | tone: plain | The book is open // Say a little, whenever suits you. | T16/B33 | pass; neutral-safe |
| A3-a | LP-A3 | local push | tone: plain | It's {child}'s birthday // A few words in your own voice would suit today. | T23/B47 | pass; names-on only |
| A3-b | LP-A3 | local push | tone: plain | Read together today? // Want to read {child}'s letters together today? | T20/B46 | pass; names-on only |
| A3-c | LP-A3 | local push | tone: plain | A birthday, in the book // Whenever there's a moment, tell {child} something about today. | T23/B62 | pass; names-on only; over 60 target |

## In-app (shown after unlock; day lines read as "{day}. <line>")

| Draft id | Loop | Channel | Tone | Words (title // body) | Chars | Checks |
|---|---|---|---|---|---|---|
| D2-newyear-p | LP-D2 | in-app | tone: playful (fallback D2-newyear-f) | Nothing is required today. What does the morning sound like? | B60 | pass |
| D2-newyear-f | LP-D2 | in-app | tone: plain | What does this morning sound like? | B34 | pass |
| D2-nye-f | LP-D2 | in-app | tone: plain | Anything you'd like {child} to hear works at any hour of today. | B63 | pass |
| D2-july-p | LP-D2 | in-app | tone: playful (fallback D2-july-f) | What does today sound like? Name three sounds, or just the loudest one. | B71 | pass |
| D2-july-f | LP-D2 | in-app | tone: plain | What does today sound like right now? | B37 | pass |
| D2-labor-p | LP-D2 | in-app | tone: playful (fallback D2-labor-f) | Today has a name and no instructions. What is it like? | B54 | pass |
| D2-labor-f | LP-D2 | in-app | tone: plain | What is today like? Say one thing about it for {child}. | B55 | pass |
| D2-thanks-p | LP-D2 | in-app | tone: playful (fallback D2-thanks-f) | If today had a headline, what would it say? | B43 | pass |
| D2-thanks-f | LP-D2 | in-app | tone: plain | What does today smell, sound or feel like? Tell {child} one thing. | B66 | pass |
| D2-hallo-f | LP-D2 | in-app | tone: plain | What does today look like? Describe it for {child}. | B51 | pass |
| D1-season-p | LP-D1 | in-app | tone: playful (fallback D1-season-f) | The season changed without asking. What do you notice? | B54 | pass |
| D1-season-f | LP-D1 | in-app | tone: plain | What looks different outside today? | B35 | pass |
| D5-family-a | LP-D5 | in-app | tone: plain | Pick someone who matters to you and say one thing about them for {child}. | B73 | pass |
| D5-family-b | LP-D5 | in-app | tone: plain | Say one thing about today that you'd like {child} to know. | B58 | pass |
| D6-trad-a | LP-D6 | in-app | tone: plain | Is there a word for today you'd want {child} to hear you say? | B61 | pass |
| M1-dayzero-f | LP-M1 | in-app | tone: plain | Tap the red circle and talk, or type if that's easier. | B54 | pass |
| M2-save-a | LP-M2 | in-app | tone: plain | In the book. | B12 | pass |
| M2-save-b | LP-M2 | in-app | tone: plain | That one's in {child}'s book. | B29 | pass |
| M2-save-p | LP-M2 | in-app | tone: playful (fallback M2-save-a) | Saved. Back to your day. | B24 | pass |
| M4-year-a | LP-M4 | in-app | tone: plain | A year is in the book // Every month of it, in your words, for {child} to read and hear for years. | T21/B73 | pass |
| M7-empty | LP-M7 | in-app | tone: plain | The days you pick will show up here. | B36 | pass |
| M7-tick | LP-M7 | in-app | tone: plain | You'll get a reminder that morning. Untick it, or choose Clear all, to stop it. | B79 | pass |

## Email: HELD, a draft for a later ruling

These are for LP-X1, the calendar message of playbook 02 section 6C. Email is transactional only at 1.0 (E75). A calendar message is commercial, goes only to a person who opted in, is never a reaction to what they did in the app, and carries no child, letter or count. It cannot ship without the founder's yes, counsel's read and the erratum that section describes. No email is drafted for a festival, a birthday, a month or a return.

| Draft id | Loop | Channel | Tone | Words (title // body) | Chars | Checks |
|---|---|---|---|---|---|---|
| X1-a | LP-X1 | email (HELD) | tone: plain | Subject: The book is here // Preheader: No news inside. Open it whenever you like. // There is no news in this message. The book is open whenever you have a sentence for it. | S16/P42/B87 | pass |
| X1-b | LP-X1 | email (HELD) | tone: plain | Subject: A short hello // Preheader: That's all this is. The book is there whenever you like. // This is only a hello. The book is here if you have something to say, and Not much today is an answer too. | S13/P56/B105 | pass |
