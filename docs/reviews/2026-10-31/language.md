# Language audit: does it read as written by a person? (2026-10-31)

Reviewer: independent senior editor (agent), read-only pass on `develop` worktree.
Scope: `packages/content/src/**` (about 4,980 lines), `docs/store/*`, App Review notes, `docs/legal/privacy-policy.md` (tone only). `apps/web/src/content/site.ts` does not exist on develop; the website copy is `packages/content/src/site.en.ts` and `pages.en.ts`. A grep of `apps/mobile/src` found no hardcoded user-facing sentences outside comments: good.

## Headline

The copy is unusually free of stock AI vocabulary. A grep for 30 classic tells (seamless, effortless, elevate, unlock, journey, dive in, here for you, fingertips, crafted, curated, game-changer, rest assured, treasure, cherish, precious, magic, delight, peace of mind, "not just", "we're thrilled", exclamation marks and so on) finds **7 hits in the whole content package, 0 in the store files and 0 exclamation marks**, and the 7 are benign ("unlocked" for an unencrypted export file, two "simply", two "whether you" in export docs).

The AI tells that remain are structural, not lexical:

1. **Aphorism endings and "not X, it is Y" turns** on the website's Why page and in moments.
2. **Reflexive triplets and anaphora** ("Nothing counts days, nothing keeps score, and nothing nudges you").
3. **Reassurance tics repeated until they sound automatic**: "safe" 18 times, "nothing (else) to do" 16, "That did not work this time" 7, "Plus is on" 9, "kept" 110.
4. **Template email scaffolding**: "Here is ..." 9 times in subjects, preheaders and openers; the same preheader on 3 emails; "Thank you, we have your request" twice.
5. **Glossary drift**: three different explanations of what a small fix is; "the people/family you invite" against the canonical privacy line; "note" for things we send; sign-in button names.
6. **One substantive mismatch**: the store listing promises co-parent writing that the App Review notes say is not in this build.

## Findings

Ordered by how often parents see the surface. Every rewrite was checked against the content rules (no em or en dashes, straight quotes, no ellipsis character, no emoji, `{child}` only, no machine-writing implication, no counting, no daily rhythm).

### First run, Tonight, Book (app)

**LNG-01** `packages/content/src/strings.en.ts:666` and `:670` (moments)
Current: "A hundred times you stopped to tell {child} something. That is love, written down." / "A year's worth of your words for {child}. All the work, all the love, kept."
Why: a closing aphorism ("That is love, written down") and a doubled "all the X, all the Y" are the commonest AI cadences. The app also adds sentiment here, which `readTogether.endOfMonth`'s comment forbids ("The app adds no sentiment of its own; the letters carry the love"). "All the work" frames letters as effort.
Rewrite: "A hundred letters to {child}, every one in your words." / "365 letters for {child}, in your words."

**LNG-02** `strings.en.ts:662` and `:674`
Current: "Fifty small moments, kept in your own voice." / "{count} letters and notes, ready for {child} to read one day."
Why: "moments" is banned for what a person makes (glossary); "in your own voice" is untrue for typed letters; v1.0 makes no notes (`:453`).
Rewrite: "Fifty letters, kept in your words." / "{count} letters, there for {child} to read one day."

**LNG-03** `strings.en.ts:688`
Current: `dismissButton: "Lovely"`
Why: cheery and a little twee, the app praising itself. Every other dismiss is "Done", "Got it" or "Okay".
Rewrite: "Close"

**LNG-04** `strings.en.ts:222`, `:963`, `:999`, `:1005`, `features/auth.en.ts:52`, `:116`, `:123`, `:127`, `billing.en.ts` plan.retry
Current (18 uses in all): "Keeping your words safe.", "Your words are safe. Please try again.", "Your letters are safe on this phone.", "Every letter you have kept is safe."
Why: "safe" said this often reads as empty reassurance, and VOICE says to state what we do, not what could go wrong. On the generic error it is also an unbacked claim (the claims inventory already removed it from `errors.launch`).
Rewrites: `tonight.states.saving` "Saving your words." / `errors.generic.body` "Please try again. Nothing you saved has changed." / `plan.retry` second sentence "Every letter you have kept is still in the book." Keep "safe" in at most two places (`errors.saveFailed`, `errors.crash`).

**LNG-05** `strings.en.ts:325`, `features/auth.en.ts:123`, `:127` and 4 more (7 in all)
Current: "Your words are still here. That did not work this time."
Why: the same vague stock line everywhere; "this time" adds nothing and the order reads backwards.
Rewrite (review): "That did not save. Your words are still here." Auth provider: "Sign in with Apple did not finish. Try again, or choose another way."

**LNG-06** `strings.en.ts:817` (`settings.reminders.everyEveningLabel`) against `:818` and `:162`
Current: "Every evening" offered next to help that says "A gentle nudge a few evenings a week".
Why: contradicts its own help text and VOICE's no-daily-rhythm rule ("every night" is banned).
Rewrite: drop the option, or label it "Most evenings" and change help to "A nudge in the evening, as often as you choose. Never late at night."

**LNG-07** `strings.en.ts:621`
Current: `{ title: "Dear {child},", body: "Your words, kept for {child}. Today, and long after." }`
Why: "long after" leans toward the endings the legacy rule forbids, and the body is a slogan with no invitation.
Rewrite: `{ title: "Dear {child},", body: "Anything to tell {child} today? A sentence is plenty." }`

**LNG-08** `strings.en.ts:620` and `:626`
Current: "Tonight's letter" / "Whatever today held, it belongs in {child}'s book."
Why: "Tonight's letter" assumes one is owed; "Whatever today held" is greeting-card filler.
Rewrite: "A letter tonight?" / "Something from today for {child}'s book?"

**LNG-09** `strings.en.ts:424`, `:635`, `:938` ("Please have a read", "Have a read")
Why: British idiom in a US-storefront app that already switched to "Licenses" (`:1157`). Small, but it reads like a template carried over.
Rewrite: "Please read it through" / "Take a look."

**LNG-10** `strings.en.ts:177`
Current: "Your private letters stay yours until you add them to the book."
Why: circular ("private ... stay yours") and the onboarding reader does not yet know what "private" means here.
Rewrite: "Letters you keep private are for you alone. Only the ones you add to the book are shared."

**LNG-11** `features/billing.en.ts:51` (keepGate.heldNote) and siblings
Current: "This one waits on this phone, on Tonight, exactly as it is, for as long as you like."
Why: four comma clauses in a row, a robotic list of qualifiers.
Rewrite: "This letter waits on Tonight, exactly as it is. Keep it whenever you like."

**LNG-12** `features/billing.en.ts` "Plus is on." (9 uses, including `gate.isOn`, `plan.on`, `plan.restored`, `confirmation.title`)
Why: the same three words as a status, a toast and a sheet title read as machine state, not speech.
Rewrite: `plan.restored` "Plus is back on this phone." `confirmation.title` "Thank you. Plus is on." Leave `plan.on` as the status.

### Sign-in and Plus (glossary consistency)

**LNG-13** `features/auth.en.ts:37`, `:38`, `:57`
Current: "Continue with Google", "Continue with email"
Why: the glossary names the buttons "Sign in with Apple; Sign in with Google", and the emails say "tap Sign in with Google". Parents follow the email's words to a button that says something else.
Rewrite: "Sign in with Google", "Sign in with email". (Or change the glossary and every email together. Pick one.)

**LNG-14** `features/auth.en.ts:199` against `strings.en.ts:717`
Current: "Sign out of other devices" vs "Sign out other devices".
Rewrite: "Sign out other devices" in both.

**LNG-15** `features/auth.en.ts:139`, `strings.en.ts:868`, `:1206`, `site.en.ts:80`, `store.en.ts:60`, `stories.en.ts` story 4 (8 uses)
Current: "the family you invite", "the family you choose", "Only the people you invite can read".
Why: the canonical line is "Only you, and your co-parent if you invite them, can read what you add to the book." The glossary bans "only the family you invite". At v1.0 there is one invitee.
Rewrite (consent): "Your letters stay private to you, and to your co-parent if you invite them. We never sell them, use them for ads or use them to train machine learning models."

**LNG-16** `features/billing.en.ts:98`
Current: `monthly: 'Monthly'` next to `annual: 'Plus Annual'`
Why: plan names must equal App Store names (D-077).
Rewrite: "Plus Monthly".

**LNG-17** `features/billing.en.ts:141` and `:146`
Current: "A yearly note: Plus renews until you cancel." / "A note about Plus"
Why: the glossary reserves "note" for something a person makes; things we send are a reminder or a message.
Rewrite: "Once a year: Plus renews until you cancel. You can change this in Settings, Plan." / "A reminder about Plus"

**LNG-18** What a small fix is: four phrasings across surfaces (14 uses)
`strings.en.ts:839` "We only fix what the microphone got wrong"; `pages.en.ts:117` "only fixes the slips a microphone makes"; `stories.en.ts` and `store.en.ts` captions "We fix slips of the tongue"; `site.en.ts` "small slips".
Why: an um or "a apple" is not the microphone's fault, so the microphone versions are not quite true; four versions read as four writers.
Rewrite, everywhere: "We only take out small slips, like an um or a repeat, and mark each one." `settings.neverRewrite`: "We never rewrite your words. We only take out small slips and mark each one, so you can put it back."

### Emails

**LNG-19** `emails/auth.en.ts:145`, `:161`, `:177`
Current: preheader "Just letting you know. If this was you, there is nothing else to do." Then the body repeats "If this was you, there is nothing else to do."
Why: the same preheader 3 times, then the same line again in the body. "Nothing (else) to do" appears 16 times across emails.
Rewrite (Apple): preheader "Added on {when}. Not you? Reply with Not me in the subject." Keep the body line once.

**LNG-20** "Here is ..." openers (9): `auth.en.ts:42`, `:99`, `:102`, `:121`, `:125`, `:246`, `account.en.ts:249`, `lifecycle.en.ts:25`, `billing.en.ts:284`
Why: a template signpost. Say the thing.
Rewrites: `:121` subject "A new sign-in link for you"; `:246` heading "Your confirmation code"; `:42` preheader "Someone tried to start a new account with this email. Sign in instead."

**LNG-21** `emails/auth.en.ts:123`
Current: "Let's get you back to your book"
Why: customer-service stock phrase.
Rewrite: "Back to your book"

**LNG-22** `emails/auth.en.ts:43` and `emails/family.en.ts:71`
Current: "Good news, your book is already here" / "Good news about the book"
Why: exclamation-style cheer without the mark. The first one also follows a failed sign-up.
Rewrite: "Your book is already here" / "The book is staying" (that is already the heading, so use it as the subject).

**LNG-23** `emails/billing.en.ts:103`, `:337`, and `account.en.ts:147`, `:210`
Current: "Thank you for choosing Plus." / "Thank you for being part of Plus." / "Thank you, we have your request" (twice)
Why: corporate gratitude formulas.
Rewrite: "Thank you for trying Plus." (the same as the trial email) / delete the line in plus-ended / "We have your request".

**LNG-24** `emails/billing.en.ts:347` to `:351`
Current: subject "A quiet word about your plan", heading "Your plan, at your pace", "Some seasons are full of letters and some are not, and both are normal."
Why: a wellness-brand register; "seasons" is a stock metaphor. It is also the email most likely to feel like it is counting quiet weeks.
Rewrite: subject "Your Plus plan, and how to stop it"; heading "Plus is still on"; body "You have Plus at {price} {billingPeriod}. If you are not using it right now, you can cancel and keep everything you made."

**LNG-25** `emails/lifecycle.en.ts:26` (v1.1)
Current: "Your stories belong in this book"
Why: the glossary bans "story" for what a person makes (VOICE's grandparent line conflicts with it; fix VOICE too).
Rewrite: "Your letters belong in this book"

### Website (`site.en.ts`, `pages.en.ts`)

**LNG-26** `pages.en.ts:119`
Current: "A letter to {child} is not a performance. It is you, on an ordinary day, and that is the version worth keeping. Not the best version. Yours."
Why: the textbook "not X. It is Y" plus a two-fragment punchline. It is the strongest AI tell in the corpus.
Rewrite: "You do not need to say it well. An ordinary day, said your way, is the one worth keeping."

**LNG-27** `pages.en.ts:117` and `:118`
Current: "Not to make them neater, not to make them sound more like a greeting card." / "Why be so strict? Because ... The sentence you started twice. The way your own language says it ... The way you always say the name."
Why: a doubled "not to", a rhetorical question answered by itself, then a three-fragment anaphora. "The way your own language says it" also hints at language mixing, which is v1.1.
Rewrite: "We do not make them neater or more polished. The way you say a thing is part of what you mean: the sentence you started twice, the way you always say the name. Smooth that out and it is easier to read, and less true."

**LNG-28** `pages.en.ts:125`, `:126`, `:132`, `:140`
Current: "Words on a page are one thing. The sound of a voice is another." / "for bedtime, for a lap and a small hand on the screen, and for years of ..." / "Nothing counts days, nothing keeps score, and nothing nudges you with a number." / "One child, two voices that love them, in one place."
Why: four reflexive triplets or antitheses in one page give it a uniform, generated rhythm.
Rewrites: "Each letter also keeps its recording, so one day {child} can hear the words as well as read them." / "It is made for bedtime, and for hearing the same one twice." / "Nothing counts days or keeps score." / delete the last sentence.

**LNG-29** `pages.en.ts:152` and `site.en.ts:69`
Current: "That is the whole idea." / "Curl up together and listen to the story of the first steps, again and again."
Why: an outro signpost, and a stock "curl up" image. "the story of the first steps" is reused on 2 surfaces.
Rewrite: drop "That is the whole idea." / "Hear the night of the first steps again, as many times as {child} asks."

**LNG-30** `site.en.ts:43` and `store.en.ts:54`
Current: "No counters, no badges, no scores. Just letters, whenever you have them."
Why: a triplet followed by a "Just X" closer, the same on both surfaces.
Rewrite: "Nothing counts or scores you. Write when you have something to say."

**LNG-31** `site.en.ts:72`
Current: title "Room for everyone who loves {child}" over a body that says only co-parents today.
Why: the headline promises what the body takes back. Overclaim by tone.
Rewrite: "Two parents, one book" (matches `pages.en.ts`).

**LNG-32** `site.en.ts:101` and `:109`
Current: "That is completely fine. ... or simply come back" / "Android is coming, and their place in the book will be waiting."
Why: over-reassurance and filler "simply"; an unscheduled platform promise with a sentimental flourish.
Rewrite: "That is fine. Nothing is counting. Tap \"Not much today\" on a quiet day, or come back when you have something to say." / "Yes, for now. {app} is on iPhone first."

### Store and App Review

**LNG-33** `store.en.ts` WRITE IT TOGETHER section and `whatsNewV1` (`docs/store/app-store.md:42`, `:73`) against `app-store.md:105`
Current: "Invite your co-parent to the same book." The App Review note says "co-parent sharing is not in this version ... 'Coming soon'".
Why: not a tone issue but the most serious line found. The listing promises a feature the reviewer is told is off. `app-store-staged-1.0-proposal.md` already removes it, so ship that.
Rewrite (whatsNew): "This is the first version of {app}. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book any time."

**LNG-34** `store.en.ts:71`, `:87`, `:77`
Current: "3. It is saved to this month in your child's memory book." / "Hello. This is the first version of ..." / "Terms of Use:"
Why: a passive, stiff step; a "Hello." filler opener; "Terms of Use" where every other surface says Terms of Service. Use Terms of Use only if counsel wants Apple's term.
Rewrite: "3. It goes into this month of your child's book." / drop "Hello." / "Terms of Service:"

**LNG-35** `docs/store/app-store.md:105` (review notes)
Current: "a family memory journal"
Why: the glossary bans "journal". Reviewers read the notes against the listing.
Rewrite: "a baby memory book parents fill by talking"

### Legal (tone only)

**LNG-36** `docs/legal/privacy-policy.md:18`
Current: "Early Letters is a memory book you fill by talking. Parents speak or type notes and letters to a child."
Why: the descriptor variant is banned (must be "the baby memory book you fill by talking"), and v1.0 makes no notes. Also, the drafting notice at the top says an AI drafted it. That is fine internally but must be stripped before publish.
Rewrite: "Early Letters is the baby memory book you fill by talking. Parents speak or type letters to their child."

## Also noted, not findings

- "kept" appears 110 times and "exactly as" 47 times. Both are brand words and mostly earn it, but toasts stack them ("A quiet day, kept.", "Signed and kept.", "Kept."). Vary them in toasts.
- Good human writing worth protecting: "That sounds right" (`:88`), "Easy to do on very little sleep." (auth email), "Locked phrases stay exactly as you said them, slips and all.", "That is every letter so far. More are still being written.", the struggling screen, and the billing emails' plain legal sentences.
- The terse end is fine. State titles ("Paused.", "Kept.") are short on purpose and are not robotic, except "Plus is on." repeated (LNG-12).

## Voice scorecard

| Surface | Score | Why |
|---|---|---|
| App | 8/10 | Calm, specific and unusually free of stock phrases; let down by "safe" and "did not work this time" tics, a few sentimental moments, and glossary drift in sign-in and Plus. |
| Emails | 7/10 | Clear, single-action and honest about billing; template scaffolding ("Here is", repeated preheaders, "Thank you for choosing") makes them read as generated. |
| Website | 6/10 | The Why page has the corpus's strongest AI rhythm (not-X-it-is-Y, triplets, aphorism endings); the FAQ is good. |
| Store | 7/10 | Plain and well paced, but it promises co-parent writing that is off in the build, and repeats the site's triplets. |
| Legal | 8/10 | Plain-language short version reads human; descriptor and "notes" drift, and the AI drafting notice must go before publish. |
