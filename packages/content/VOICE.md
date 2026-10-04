# Early Letters voice guide

Scope: every word outside the app.

## Who we talk to

Parents of children from birth to five, usually tired, often holding someone. And the grandparents, aunts, uncles and close friends who love that child and want a way in. They are not looking for another task. They want to feel that the ordinary days counted.

## Three tone words

**Warm.** We sound like a kind friend, not a brand.
**Calm.** Short sentences. No hurry, no hype.
**Literary, lightly.** A little care in the phrasing, and sometimes a smile.

## Brand idea in one sentence

Early Letters is the memory book you fill by talking: letters to your child, in your own words and your own voice, kept exactly as you said it.

## Do and don't

| Do | Don't |
| --- | --- |
| "Tell {child} about today." | "Capture every precious moment." |
| "Kept exactly as you said it." | "We tidy your words into a story." |
| "On a quiet day, tap Not much today." | "It has been 5 days since your last letter." |
| "Read together at bedtime." | "Unlock bedtime mode." |
| "From Nani" | "Contributor: Grandmother" |
| "A minute is plenty." | "Build your daily habit." |
| Letter imagery, lightly: "written early, read for years" | Wax seals, quills, "Dear diary" puns on every line |

## The legacy rule

We speak about time, not endings. The promise is that {child} will read and hear these letters for years, with you or on their own. Say "for years", "again and again", "one day {child} can hear how you sounded". Never write about endings, absence or the reader not being there. Love and time carry the meaning on their own.

## The no-machine-writing rule

We do not write your letters, and our copy must never hint that we might. No naming the technology, and no words that suggest software wrote, improved, tidied or dressed up a letter. The full banned list lives in the copy checker. What we can say, and should say often: "We never rewrite your words." Transcription only fixes microphone and grammar slips.

## The no-guilt rule

No fear, no pressure, no counting. No deadlines, no warnings about what might slip away, no runs of days, no looking back with sorrow. Skipped days are normal. Our job is to make the next letter feel easy, not to make the last gap feel heavy.

## The multilingual rule

Families speak how they speak. Hindi and English in the same sentence is a feature, not an error. Never call it "mixed" or "broken" language. Never promise translation. Say: "Your words stay in the language you said them." Use examples from real code-switching families, and keep relationship names as families use them: Nani, Dadi, Papa, Amma.

## How to write a notification

- One idea, one line, under 60 characters if possible.
- Invite, never remind. "Anything to tell {child} today?" not "Don't forget to write."
- No counts, no days-since, no urgency words.
- Always easy to ignore. One tap to "Not much today" is a complete answer.
- At most one exclamation mark per month across all notifications.

Good: "Nani wrote a letter to {child}."
Good: "A minute before bed? {child}'s book is open."
Bad: "7 days in a row. Keep it going."

## Writing for grandparents

- Bigger ideas, fewer words. One instruction per sentence.
- Name the action plainly: "Tap the red circle and talk."
- Avoid app terms like "sync" or "feed".
- Reassure on privacy early: "Only the family you invite can see your letters."
- Make them feel wanted, not managed: "Your stories belong in {child}'s book."
- Avoid "senior" or "elderly". They are Nani, Dada, Grandma, Pop.

## Mechanics

- Straight quotes only. No em or en dashes. Use commas, periods or "to".
- Three periods, never the single ellipsis character, and rarely at all.
- No emoji.
- Use {child} in templates. Never "he", "she", "him" or "her" for the child.
- No claims we cannot prove. No rankings, no ratings, no invented reviews.

## Voice and motion pairing

Words, haptics and motion should say the same quiet thing. Haptic names are the five intents in `apps/mobile/src/lib/haptics.ts`: `tap`, `press`, `soft`, `success`, `warning`. Motion stays slow and soft; never a bounce, never a celebration. When in doubt, use less.

| Moment | Wording style | Haptic and motion feel |
| --- | --- | --- |
| Empty | An invitation, never a blank to fill. "Tell {child} about today." | No haptic. Content settles in gently; nothing pulses or nags. |
| Saving | Present tense, plain, short. "Listening back to what you said." | `soft` when the take ends. A slow, steady fade, no spinner theatrics. |
| Success | Say what is now true, then stop. "Kept in {child}'s book." | `success` once. A short, warm settle; no confetti, no counters. |
| Error | Own it, then reassure. Say the words are safe before anything else. "That did not work this time." | `warning` only if the person must act, otherwise none. No shake, no red flash. |
| Permission ask | Say why in one sentence, and that no is fine. | `tap` on the choice. No motion that rushes the decision. |
| Quiet day | "Not much today" is a complete answer. No tally, no apology. | `tap`. The screen simply closes softly. |
| First letter | Warm and small. Make it feel like the beginning, not an achievement. | `press` on the record button, `success` on keeping it. One calm moment, no fanfare. |
| Long silence | Say nothing about the gap. If we speak at all, invite: "Anything to tell {child} today?" | No haptic, no badge, no change to the screen. The book looks the same as before. |
