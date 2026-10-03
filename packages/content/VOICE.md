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

At v1.0 (founder, 3 Oct 2026, D-056) letters can be spoken in seven languages: English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese, one language per letter, each written in its own script (Hindi in Devanagari, Arabic right to left, Chinese in characters). The app itself is in English. A mode for Hindi and English in one sentence comes in v1.1 (D-059). Until it ships, do not promise mixing languages in one sentence; the rest of this rule stands.

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

## Saying what the product does today

Only promise what the current build does. At v1.0 (docs/DECISIONS.md, 3 Oct 2026):
- Family is the co-parent only (D-055). Grandparents, aunts and uncles are "coming in a later update", never "now".
- Recordings stay on the phone that made them, and in that person's own iPhone backup. Nothing uploads them, so there is no backup feature, and a co-parent hears your voice only on your phone until v1.1 (D-059).
- Read together plays the recordings on this phone, without a moving word highlight (D-059).
- Seven spoken languages, one per letter (D-056).
- The in-app "early version, can make mistakes" note stays; the store listing never says beta (D-060).

## How we talk about privacy

Parents must never doubt that their letters are private. We say so calmly, in the few places they might wonder, and we back every word with a real control (founder decision 11, D-061).

**The promise.** One sentence, the same everywhere, word for word (`en.trust.promise`):
"Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models."
Short form for a row or a footer (`en.trust.short`): "Private by default. Never sold, never used for ads."
The voice promise (`en.trust.voice`), said where a recording is made or kept: "We never imitate your voice. Your original recording is always kept exactly as you made it."

**Where it appears, and only there:**

| Place | What we say | Control behind it |
| --- | --- | --- |
| Onboarding story 4 | Only you and the people you invite can read these letters. | Per-book sharing |
| Sign-in | Why an account helps, who can read, what the email is for (`trust.signIn`). | Sign in with Apple's Hide My Email; no passwords |
| First recording, once | Words are written down on this phone; the recording stays with the letter; we never imitate your voice (`trust.firstRecording`). | On-device transcription; no audio upload at v1.0; the original is never altered (D-058) |
| Settings, Privacy | The promise at the top, then the switches (`trust.settings`, `settings.privacy`). | Analytics off by default, sync and sharing, export, delete |
| Store listing and website | The promise in "Private by default". | Privacy Policy, privacy label |
| Welcome email | The promise, once. | Same |

**How it sounds.** One line per place, never a paragraph. State what we do, not what could go wrong. No locks, shields or "bank-level" anything. Never: hack, breach, leak, spy, steal, creepy, scary, "don't worry", "100%", "military-grade", "unhackable", "completely secure". Do not repeat the promise on screens where nobody is wondering; saying it too often sounds anxious.

**Proof before words.** Every privacy claim is registered in `docs/legal/claims-registry.yaml` with counsel approval (LEGAL-REQ, ENGINEERING_REQUIREMENTS) before a public page or store listing goes live.

## How to write an email

- Transactional only, and only when something happened: a sign-in link, an invite, a deletion step, an export.
- Subject says what happened, in plain words. Preview text adds the one useful next fact.
- One action at most. Calm about security: "If you did not ask to sign in, you can ignore this email."
- No child's name, no letter text, nothing from the book. No images, no tracking pixels, no tracked links.
- Every email has a plain-text version. Copy lives in `packages/content/src/emails.en.ts`.

## Mechanics

- Straight quotes only. No em or en dashes. Use commas, full stops or "to".
- Three full stops, never the single ellipsis character, and rarely at all.
- No emoji.
- Use {child} in templates. Never "he", "she", "him" or "her" for the child, or for anyone else in a string. Never "son", "daughter", "boy" or "girl" for the child.
- No claims we cannot prove. No rankings, no ratings, no invented reviews.

## What the checker also holds us to

`test/rules.test.ts` enforces these too. If one fails, change the words, not the test.

- No daily rhythm in anything the product says about itself: no "daily", "every day", "every night" or "a few words a day". Prompts may ask about the child's own days. Reminders, notifications and moments never count days, runs or gaps.
- Moments celebrate what exists. No comparisons, no totals per person, no mention of Plus.
- The store and the website speak to adults. No "kids", no "for children", nothing that suggests a child uses the app alone. Adults doing things "on their own phone" is fine.
- Digital only for now. No print, printed books, hard copies, photo books or ordering a copy. "Large print" as a reading size is fine.
- No string says "beta" (D-060). The app keeps one quiet "early version, can make mistakes" note in Settings, About. The store listing also avoids "early version", "early access", "preview" and the like (App Review 2.2).
- In the iOS app and its store listing, name only Apple platforms. No other phone platform, phone maker or app store.
- If we ever talk about closing, the notice is 90 days, the same as the Terms and the Privacy Policy.
- Exclamation marks are budgeted per surface, three in all: none in notifications, the store listing, emails, the book or prompts.
