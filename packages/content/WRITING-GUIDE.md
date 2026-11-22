# Early Letters writing guide

Status: v1.3, 21 Nov 2026 (v1.2 and v1.1 21 Nov, v1.0 20 Nov). Written with the CMO, Chief Design Officer, CPrivO, CCO and CAIO lenses as Claude roles, not counsel. v1.3 adds the round 2 benchmarks (Appendix A), settles the "safe" conflict (section 1), says what "no day name" means in a push (section 4) and adds a PROPOSED note on AI disclosure (section 8). The humour scope follows the founder's 21 Nov choice, a push never claims what a recording keeps, and the spelling and date questions are decided. Owner: `content`, with the CMO and Chief Design Officer lenses. Legal review of any promise or consent wording goes through the CLO.

This is the guide for every word a customer reads: the app, error messages, emails, push notifications, the App Store page, the website, the prompts and the pages inside the book. Read it before you write or change a line.

## 0. Cheat sheet (one page)

**The test.** Read the line aloud as a friend who is also a parent, standing next to the person holding the phone. If that friend would never say it, rewrite it.

**Do**

1. Use contractions: "didn't", "you'll", "it's". Avoid "it'll" and "they'd".
2. Put the outcome or the next step first.
3. Say the specific thing: "Your recording is still on this phone" (only where that is true).
4. Start a button with a verb and name the result: "Add a letter".
5. Build an error from what happened, what's still fine, what to do, when it fixes itself.
6. Use `{child}`, and only the glossary words: letter, book, recording, words.
7. Use the glossary sentence for small fixes, word for word (section 8, "The edit promise").
8. Check the build before you claim anything: find the D-number and the code path (section 12, step 0).
9. Match the moment. When two rows of the tone table fit, use the more serious one (section 5).
10. Run the checks and say what ran (section 12).

**Never**

1. No em dashes, en dashes, curly quotes, ellipsis characters or emoji. No exclamation marks in new copy. The budgets in section 2 are a ceiling for lines that already exist, not an allowance.
2. No fear, guilt, loss language, streaks, points, badges or gap counts.
3. No hint that software wrote, improved or tidied a letter. We only remove and repair.
4. No he, she, son, daughter, boy or girl for the child.
5. No typed product name: `{app}` in app copy, `${brand.name}` in content files.
6. No letter, line of a letter or sample letter in a parent's voice (principle 11).
7. No "Oops", "Something went wrong", "Please" before an instruction, "just", "simply", "safe" (two shipped lines keep it, see section 1).
8. No new promise, and no "never", "always", "only" or "exactly" without proof.
9. No slogan rhythm, contrast pairs or greeting-card endings inside the product (section 7).
10. No change to protected text without its owner (appendix B).

**Who to ask.** Words in conflict between two documents: `content`. Claims, consent, price, data: CLO. Store and site positioning: CMO. Layout and reading: design-systems and CDesO. Anything on `main`: the founder.

**Stop and ask** when a line touches meaning (what we promise, what we do, price, data). That isn't a copy edit.

## 1. Which document wins

Read `VOICE.md` and `BRAND.md` alongside this guide. If two documents disagree, stop and ask `content`. Until they agree:

- The rules test wins on mechanics (`packages/content/test/rules.test.ts`).
- `BRAND.md` wins on vocabulary and on positioning facts.
- For how a sentence sounds in the product (app, errors, emails, push, prompts), this guide wins.
- On the website and the store listing, the `BRAND.md` contrast lines ("Not X, but Y" and "Versus ..." lines) are allowed. The CMO owns them. They never go in the app, an email or a push.

Conflicts between documents, recorded here, not edited away. Owner: CMO unless stated. Only a row marked RESOLVED is settled.

| Where | The conflict | Status |
| --- | --- | --- |
| `BRAND.md` contrast lines ("Not 'First word: ____'. The whole story...", "Not a summary of your day. Your day, in your words.") | Contrast pair, a tell in section 7 | OPEN. Allowed on site and store only, until the CMO rules |
| `BRAND.md` "No blanks to fill. Just talk, and the page is yours." and `VOICE.md` "no 'Just X' closers" | "Just" softener | OPEN |
| `BRAND.md` pillar lines "Your words, never ours." and "Love from everyone, pressure from no one." | Slogan rhythm | OPEN |
| `VOICE.md` "Literary, lightly. ... and sometimes a smile." | Guide principle on wit (section 4, humour) | OPEN. The humour policy is PROPOSED |
| `BRAND.md` "Every sentence is one the person actually said." | The council found this false under D-133 (punctuation, paragraphs and spellings change the raw words). Counsel and founder, not the CMO | OPEN, founder |
| `Warmly,` on every email, including deletion and security | A fixed sign-off under serious mail. A founder-held glossary item, so a question | OPEN, CMO |
| `VOICE.md` "Words we lean on too much", which allowed "safe" for a failed save and a crash | This guide bans "safe" (cheat sheet, section 7, section 13) | RESOLVED 21 Nov by `content`, owner of both files: "safe" is banned in every new or touched line, and `VOICE.md` now says so. The failed save (`saveFailed`) says "Your words are still on this phone." and the crash (`crash`) says "Your letters and recordings are still on this phone."; `rules.test.ts` pins "still on this phone" in `en.errors`. No shipped line keeps "safe". Never copy the word into a new line |

## 2. What the machine checks, and what only a person can

Don't assume a clean run means a good line. A test pass says the mechanics hold. Tone is judgment.

| Rule | Checked by | Limit or pattern |
| --- | --- | --- |
| No em or en dashes, curly quotes, ellipsis character, emoji | `rules.test.ts` | Every string |
| Exclamation marks | `rules.test.ts` | Budget per surface: notifications 0, in-app 2, store 0, site 1, book 0, emails 0, prompts 0; 3 in all |
| Fear, guilt, loss words | `rules.test.ts` (FEAR regex) | Includes "too late", "don't miss", "you haven't", "streak", "regret", "die", "died", "death", "dead", "passed away" |
| AI words | `rules.test.ts` (AI regex) | `AI`, smart, magic, generate, polish, perfect, enhance. "Rewrite" only as a denial |
| Tidy, cleaned up | `rules.test.ts` | All copy. The wider "clean, correct, edit, improve" test runs on touched strings only |
| Gendered words for the child or anyone | `rules.test.ts` | he, she, her, him, his, son, daughter, boy, girl |
| Internal terms (take, entry, draft, pack) | `rules.test.ts` | Parent-facing copy |
| Product name typed | `rules.test.ts` | In-app copy must use `{app}` |
| Daily rhythm, gap counts, day counts | `rules.test.ts` | Also moments: no comparing, no per-author totals, no mention of Plus |
| Lengths | `rules.test.ts` | Push title 40, body 110; button 22; email subject 60, preheader 90; trust line 2 sentences and 160 characters; onboarding headline 80, line 200; store caption 40, subline 60 |
| Store and site speak to adults, no print promise, no "beta", Apple platforms only, 90 days notice | `rules.test.ts` | As named |
| Machine-sounding patterns | `npm run lint:copy` | Ten rules: `uncontracted`, `softener`, `oops-voice`, `please-open`, `corporate-word`, `self-narrating`, `vague-reassurance`, `slogan-kept`, `stage-managed`, `triplet`. Shrink-only baseline. Present only once the copy tells lint PR has merged; check `package.json` and say if it is missing |
| Specific, true to the build, would a friend say it, tone by moment, error anatomy, reading age, accessibility (section 10), contrast pairs, most of section 7 | Judgment, a reviewer | Nothing runs these |

What the lint can't catch: "There is nothing to do.", "It will try again.", "Something went wrong.", "The download failed.", "Unlock your memories.", "Dear {child},", "Great job!", contrast pairs, and any new phrasing of a tell. It reads only `packages/content/src` and the app `copy.ts` files, not email templates under `packages/emails`, `supabase/templates`, the website or the store listing file. Read every changed line aloud.

## 3. Principles

1. **Say it like a person.** Plain, spoken words. Stiff phrasing ("did not", "we will send", "to ensure") is the biggest reason copy sounds machine-made.
2. **Lead with what matters to them.** The outcome or the next step comes first. The reason, if needed, comes second.
3. **Say the specific thing.** "Your words are still here" beats "Everything is safe". If a line would fit any app, it isn't finished.
4. **One idea, as few words as will do.** Cut a word, then read it again and cut one more.
5. **Be warm without performing.** Warmth is accuracy and patience. We don't put emotion on show for a parent. Monzo asks for "straightforward kindness" (appendix A).
6. **Match the moment.** A failed save at 2 a.m. and a first letter saved are different moments. The voice stays; the tone moves (section 5).
7. **Be honest to the build.** Claim only what this build does. When we're unsure, we say less.
8. **The machine never takes a bow.** Nothing we say implies software wrote, polished, improved or summarised a letter. Our own words are small, plain and unsigned.
9. **Celebrate what exists.** No gap counts, streaks, guilt, fear or "before it's too late". Legacy is love and time.
10. **Everyone can read it.** Short sentences, common words, screen-reader friendly, ready to translate, no jargon, `{child}` for the child.
11. **We never write a letter for a parent.** No letter, no line of one and no sample of one in a parent's voice. This is the constitution (`CLAUDE.md`: no feature may write, rewrite, summarise or shape a person's words), applied to us. Placeholder text in a field is a plain instruction ("Talk, or type here"), never a made-up sentence about a child. Demo content, onboarding examples, store screenshots and website mock-ups use clearly marked sample content from the fictional family Asha, approved by the CMO, and say it is a sample. A prompt asks one concrete question and doesn't lead to a feeling.

## 4. The brand character

Early Letters sounds like a calm, observant friend who has done this before. It isn't a coach, a brand or an assistant.

| We are | That means | We avoid | Examples of what we avoid |
| --- | --- | --- | --- |
| **Warm** | Kind and direct. We assume the parent is capable and tired. | Gushing | "Amazing!", "We're so excited", baby talk, pet names for the user |
| **Calm** | Short sentences, nothing urgent unless it is. | Anxious or nagging | Alarm words, countdowns, "Don't miss", "Hurry" |
| **Plainspoken** | Everyday words and verbs. | Corporate or clever | "Leverage", "seamless", "robust", puns, taglines inside the product |
| **Quietly literary** | A little care for rhythm, only where a letter, a prompt or a book page deserves it. | Poetic everywhere | Greeting-card endings, aphorisms |
| **Trustworthy** | Specific, true, easy to check. | General reassurance | "Safe and secure", locks, shields, "bank-level", "100%" |

The literary register belongs to the family's own words in the book and to a small number of prompts. The interface stays plain. The app's own text is smaller and quieter than a letter, never in the letter's serif, never signed.

### Humour policy (PROPOSED, pending the founder's approval of the words)

Status: PROPOSED. The founder chose the scope on 21 Nov from a set of options. That's a selection, not words he typed. It's recorded in the Project doc `infra/exec-rulings-2026-11-21-witty-tone-scope.md`, which isn't in this repo. The policy extends Q-FD-27 (closed 20 Nov: a little playfulness on Friday and Saturday notes, Monday and Sunday small and slow; `docs/product/prd/GAP-LOG.md` CL-032). Q-FD-27 covers the Friday and Saturday notes in the notification catalogue only. The saved-letter line and the five public days are the extension. His earlier 21 Nov ask for copy that is "fun, witty, engaging, empathetic" isn't written in the repo (it came in the brief for this change), so treat the exact words as relayed. Nothing here changes a shipped or locked line. Every witty line stays PROPOSED and carries a plain fallback, and the founder approves the words before any wit turns on (BL-965). The catalogue-side entry is PROPOSED in `docs/product/prd/18-errata-after-lock.md` (E97, Q-NTC-14; PR #1275), not in the locked catalogue.

- **Where wit may live.** Three places, nothing else:
  1. A Friday or Saturday note (Q-FD-27). Monday and Sunday get no wit. It's a push, so it keeps the neutral lock-screen frame below: one neutral string, no child name, no library-day name (see "What day name means"), zero exclamation marks (Q-FD-18, NS-47-R12).
  2. The one line shown when a letter is saved: a single dry sentence, never fanfare, never fixed copy, rotated, with no motion, sound or icon (section 5, Saved a letter).
  3. The five public days: the seasons, New Year's Day, Thanksgiving, Independence Day and Labor Day (the hand-listed allowlist; Q-FD-18). In the app only, after the phone is open; never on the lock screen.

  One small, dry thing, once.
- **The lock screen stays neutral.** Until the founder answers Q-FD-18, the push is one neutral string (no child name, no library-day name, nothing that varies by place or belief). A Friday or Saturday note may be playful inside that frame. Wit on the five public days, and the saved-letter line, are read in the app, not on the lock screen. Every witty line has a plain fallback that runs when the humour flag is off.
- **Where it never lives.** First-run consent screens (and the age gate and sign-in beside them), errors, money, billing, deletion, safety, helplines, permissions, hard seasons, grief, illness and anything a parent might read while upset.
- **Never about belief, place or culture.** No wit tied to a day the parent ticked, a festival, a tradition, a country, a region or a language, and no line that varies by any of them. The five public days in the list above are the only dated exception, in the app only. The app stores none of these (Q-FD-5). A library day's name shows on the lock screen only behind its own switch, default off and forced off with App lock (Q-FD-14, NS-47-R12). Apple says push notifications "should not be used to send sensitive personal or confidential information" (App Review Guideline 4.5.4, read 21 Nov).
- **What "day name" means.** In this guide and in NS-47-R12, a day name is the name of a library day: a festival, a tradition or a public day. It is not a weekday. A Friday or Saturday note may say "Friday" or "Saturday", as the locked catalogue's lines do ("Friday evening", `notification-catalogue.md` section 4.2). It never names a library day, a tradition or a country, and a lock-screen string never holds a library-day name and a child name together (NS-47-R12).
- **Never at the parent's expense.** No joke about being tired, late, behind or forgetful.
- **No puns or wordplay** (section 4, Plainspoken). That includes the child's name. No jokes about the child at all that the parent didn't make.
- **No exclamation marks in a push.** Zero in notifications (Q-NTC-7).
- **Rotate and don't repeat.** A line that amuses once can annoy a dozen times (Atlassian, appendix A). Three notes in a row never share a joke shape.
- **When unsure, no joke.** Clear beats entertaining (Mailchimp, appendix A). Material's communication codelab says an error shouldn't take the form of a joke instead of support (appendix A).
- **Delight in the interface is a small flourish**, not a joke (Atlassian).

No example is given here. The locked catalogue already holds the Friday and Saturday lines (`docs/product/prd/functions/notification-catalogue.md` section 4.2). New wit is written against those, in a set the founder approves key by key (BL-965).

## 5. Tone by moment

Voice stays the same. The dial moves.

**How to pick the row.** Pick the row by what the parent is doing, not by the screen. If two rows fit, use the more serious one. If the line contains a price, a date, a deletion or a promise, treat it as a money, deleting or promise line even when the screen looks like onboarding, and route it to its owner (appendix B). When still unsure, go calmer and plainer.

| Moment | Dial | What it sounds like | Never | Before and after |
| --- | --- | --- | --- | --- |
| First open, onboarding | Warm, light | One short welcome, then get out of the way | A speech about the brand | "Welcome! We're so excited to help you capture precious moments." becomes "Tell {child} about today. Tap the red circle and talk." |
| Saved a letter | Quiet pleasure | A plain confirmation, varied. One dry line is PROPOSED (section 4) | Fanfare, confetti, "Great job!" | "Great job! Your entry was saved successfully!" becomes "Saved to {child}'s book." |
| Slow or waiting | Patient, informative | What's happening, and a time only if the build measures it | Cute loading lines | "Hang tight, working our magic..." becomes "Getting the language ready." |
| Something failed | Calm, practical | What happened, what's still fine, what to do | Blame, "Oops", "Uh-oh", "Something went wrong" | "Oops! Something went wrong." becomes "That didn't save. Your recording is still here. Try again." (only if the audio is on the phone) |
| Permission or consent | Clear, respectful | What it's for, what changes, that they can change their mind | Pressure, fear, small print tone | "To unlock the full experience, allow notifications." becomes "Want a gentle reminder? You can change this any time in Settings." |
| Money, renewals, billing | Straight, exact | Date, amount, what they keep | Hype, soft-selling, surprise | "Don't lose your Plus!" becomes "Plus renews on {date} for {price}. Cancel any time in Settings." |
| Deleting or leaving | Serious, kind | What goes, whether it can come back, one clear choice | Guilt, drama, "We'll miss you" | "Are you sure you want to leave us?" becomes "This deletes {child}'s book and every letter in it. It can't be undone." |
| Hard moments (loss, illness in a prompt or reply) | Quiet, human | Fewer words, no cheer, no advice | Silver linings, exclamation, fixing | A silver-lining line becomes one plain sentence of acknowledgement and nothing else |
| A reminder or push | Light, optional | An invitation they can ignore | A nudge that counts, scolds or chases | "You haven't written in 5 days." becomes "A minute for the book?" |

The "before" lines are made-up examples of the tells, not shipped text. Check each "after" against the rules test before reusing it.

## 6. Grammar and word choice

**Write the way people talk**

- Contractions in everyday UI, emails and notifications: "didn't", "couldn't", "you'll", "it's", "we'll". Spell out only in legal or consent lines. Always "it's", "we'll" and "you'll"; avoid "it'll", "there'd" and "they'd" in UI (Microsoft, appendix A). Never mix a contraction and its long form on one screen.
- Active voice, said about the thing: "That didn't save." Not "The operation could not be completed."
- Second person for the parent. Keep "my" for the user's own controls in a form ("Save my place"), and don't switch between them in one flow.
- Possessives: Apple says to use them sparingly and consistently, "Favorites" over "Your Favorites". We keep "your" where it makes a letter or recording feel like theirs ("your recording") and drop it from plain labels ("Settings", not "Your settings"). We don't switch between "my" and "your" in one flow.
- "We" only when the company is truly the actor and it's clear who "we" is: a promise, a billing notice, an email. Apple says to avoid "we" in error messages because it may be unclear who "we" is, and gives "We're having trouble loading this content" against "Unable to load content". We follow the principle, not Apple's words: "unable to" is on our own ban list. Say what happened to the thing, in a contraction. "That didn't load."
- Simple verbs. Prefer the present tense where it's true ("Tap Save"). Future is fine for what comes next ("We'll email you a link").
- Start a sentence with "And", "But" or "So" when it sounds natural.
- Questions when we need an answer, and in a push, where a question invites a reply. Elsewhere, no rhetorical questions.

**Words**

- One term for one thing, from the `BRAND.md` glossary. A parent reads "letter", "book", "recording", "words". Internal terms (take, entry, draft, pack) never appear.
- The short word: "use" over "utilise", "start" over "begin", "help" over "assist", "about" over "approximately".
- Don't use: ensure, leverage, seamless, effortless, robust, empower, enable, unlock, elevate, delve, tapestry, journey, curated, cherish, treasure, "precious moments", "make memories", "special someone". Don't write "little one" in any new line; if it is already in the prompt library or a shipped line, leave it and don't copy it. The locked catalogue's neutral twins say "your little one" (`docs/product/prd/functions/notification-catalogue.md` section 4.2). `content` rewrites them to "the book" when the words packet is written. Don't copy the phrase elsewhere.
- Don't open an instruction with "Please" ("Tap Save"). Use "please" only for a real favour or a real inconvenience.
- Don't say "successfully", "unable to", "invalid", "failed", "error occurred", "encountered an issue", "experiencing difficulties". This is our house list, not Apple's. Apple itself shows "Unable to load content" and calls "Invalid name" robotic.
- No exclamation marks in new copy (section 2 holds the ceilings for lines that already exist).
- No em dashes, en dashes, curly quotes, ellipsis characters or emoji. Use a comma, a full stop or "to".
- Sentence case everywhere: "Add a letter". Proper nouns only. Buttons start with a verb.

**Numbers, dates, time**

- Numerals for counts and money ("3 letters", "$4.99"). Dates the way people say them: "Tuesday". A month comes before the day ("December 3"), from the locale formatter, as shipped (CMO-RULED, section 9, item 4). US spelling in every new or touched line (CMO-RULED, section 9, item 3).
- Dates come from the locale formatter in code, never typed by hand in a template.
- Never show a number that counts a gap, a streak, or one person against another.

**Length.** Limits are in section 2. House targets: buttons one to three words; toasts under 6 words; push body under 60; error one or two short sentences; email preheader one useful fact.

## 7. The tells: what makes copy sound machine-made

These are what customers notice. The lint flags the mechanical ones (section 2). Reviewers catch the rest. These tells bind the product; the guide's own prose tries to follow them.

| Tell | Looks like | Why it fails | Instead |
| --- | --- | --- | --- |
| Stage-managed sequence | "One note from us, then Apple asks." | A setup and a punchline, narrating the product to itself. | "Next, your iPhone will ask about notifications. You can change this any time in Settings." |
| Slogan rhythm | "Your voice, kept." "A quiet day, kept." | Tagline cadence in the middle of a task. | Say what happened: "Saved to the book." |
| Contrast pairs | "Not a chore, a gift." | Sounds written to be quoted. Allowed on the website and store only (section 1). | State the one true thing. |
| Triplets for rhythm | "No counters, no badges, no scores." | Padding for the beat. | Pick the one that matters, or none. |
| Stilted negatives | "did not check out", "does not work this time" | Uncontracted and vague. | "didn't finish", and say what to do. |
| Empty softeners | "Just", "simply", "quickly", "easily" | Tells the user it's easy, which is for them to judge. | Cut it. |
| Greeting-card closers | "That is love, written down." | Sentiment we're putting in their mouth. | End on the fact. |
| Vague reassurance | "Everything is safe." "Don't worry." | Unfalsifiable, and worry-inducing. | "Your letters are still here." (where true) |
| Corporate verbs | "ensure", "utilise", "enable", "facilitate" | Sounds like a policy. | "make sure", "use", "turn on". |
| Self-narrating UI | "Here is your code." "This email is your copy of..." | Describes itself instead of doing it. | "Your code is 123456." |
| Empty exclamations | "Great!", "Oops!", "Uh-oh" | Insincere in errors (Apple says "oops!" and "uh-oh" are typically unnecessary and can sound insincere). | Drop it, state the fact. |
| Mirroring the user back | "You are about to delete..." | Wastes the beat. | "This deletes {child}'s book and every letter in it." |
| Everything is a gift | "treasure", "cherish", "precious" | Sentimental filler. | Let the parent's own words carry feeling. |
| Polish words | "tidy", "cleaned up", "corrected", "edited", "polished", "improved", "perfect" | Implies the app made the words better. We only remove and repair. | The glossary sentence (below), or name what happened: "Took out a sound." |
| One line used everywhere | "A minute is plenty." as the push, the empty state and the toast | A good line repeated becomes the next tell. | Rotate. Keep a repeated line to one surface. |

## 8. Surface playbooks

### The edit promise
There is one source: the `BRAND.md` glossary and the D-133 public line. For a small fix, use the glossary sentence word for word: "We only fix small slips, like an um, a repeat or a misheard word, and mark each one." Or say what happened: "Took out a sound." Never tidy, cleaned up, polished, improved, corrected, edited or perfect. Don't paraphrase the promise. If you think it overclaims (it may, because punctuation and paragraphs also change), raise it with the CAIO. Don't reword it.

### Buttons, labels, menus
Start with a verb. Name the result. Same action, same label, everywhere ("Save", "Add a letter", "Play"). Never "OK" for a real choice. Never "Click". Don't repeat the screen title in the button. Destructive buttons say what goes ("Delete book"), not "Confirm". In a multi-step flow pick one forward word (Next or Continue) and keep it, and end with "Done" (Apple).

### Empty states
One line of what will be here, one clear action. No scolding, no counting what's missing. "Your first letter will show up here." plus the button.

### Toasts and confirmations
Short, past tense, varied: "Saved", "Added to {child}'s book", "Copied". Don't say "successfully". Don't stack three that end in the same word.

### Error messages
Build every error from four parts, in this order, using as few as the case needs:

1. **What happened**, in plain words, about the thing and not "we".
2. **What's still fine**, only when it's true and the parent would worry. "Your recording is still on this phone" is true only where the audio is on the phone.
3. **What to do**, as a button or one instruction.
4. **When it will fix itself**, if it will, with a time only if the build measures it.

Rules: place it next to the problem; never blame ("You entered..."); no codes; no "Oops"; no "Something went wrong". If we can't give a next step, say so and say where help is.

When we can't tell whether something saved or went through (a dropped connection, a payment that didn't confirm), say it's not known yet, and don't say it worked or failed. "It's not clear yet if that saved. Check your letters before you try again." Stripe's developer docs say to treat an unknown outcome as unknown (appendix A, round 2; Stripe's customer-writing rules were not found). Example wording only, not shipped text.

| Don't | Do |
| --- | --- |
| "Could not set reminders just now." | "Couldn't set your reminders. Check Settings, then try again." |
| "The download did not check out." | "The download didn't finish. It tries again on Wi-Fi, or tap Try again." |
| "Invalid email" | "Enter an email like name@example.com." (Apple's model: say what is expected.) |
| "An error occurred. Please try again later." | "That didn't save. Your recording is still here. Try again." |

### Permission and consent priming
Say what we'll ask, why it helps them, and that they stay in control, in two short sentences. The OS prompt text is registered and counsel-held (`permissions.en.ts`): don't rewrite it without the CLO. Never narrate the sequence. Say what happens next and when.

### Onboarding
Each screen has one job and one idea. Lead with the thing they can do. The alpha first-run headline is held (D-125 item 9, a ruling that holds the store listing's "exactly as you said it" until counsel clears it, and keeps the alpha headline). The public promise line follows D-133 (the founder's ruling on what the public promise says): "It stays in your words. Every change is marked, and your original recording is kept unchanged." D-133 decision 2 also says the store build's first-run headline uses the same true wording, and the alpha keeps its headline.

### Settings
Label what the setting is. Explain what it does when it's on, and let them infer the off state (Apple). Link to the setting, don't describe where it lives.

### Destructive and leaving flows
Say exactly what goes, whether it can come back, and what's kept. One calm confirmation. No guilt. Money or retention facts are counsel-checked. A decision table by object keeps this consistent:

| Object | What goes | Can it come back | Button |
| --- | --- | --- | --- |
| A letter | That letter and its recording | Per the build's undo window (check the code path) | "Delete letter" |
| A recording | The audio, not the words, if that's true | Check the build | "Delete recording" |
| A book | Every letter and recording in it | Check the build | "Delete book" |
| The account | All books and the sign-in | Per the deletion spec | "Delete account" |

Fill the "can it come back" cells from the build, not from this guide (section 12, step 0).

### Push notifications
One idea, one line, an invitation not a reminder. Limits are in section 2; the house body target is under 60. A question is fine in a push because it invites a reply. Never show what they wrote or the child's name on the lock screen unless they've turned it on. No day counts, no "you haven't", no emoji, no exclamation. A library day's name appears only behind the day-name switch. With it off or App lock on, the title and body are the neutral frame and name no library day, tradition, country or child. A weekday word is fine where the vetted catalogue key has one (NS-13-R24). Never choose a line from language, locale, time zone or a name (NS-47-R20). A push says nothing about what the app keeps: it doesn't know whether the next letter is spoken or typed, saved or let go, or whether its recording is on the phone, so a push makes no claim about it. "Talk or type, whichever is easier." is true either way. Test every one: would a friend text this?

| Don't | Do |
| --- | --- |
| "Dear little one," / "Anything to tell your little one today? A line or two is enough." | "A minute for the book?" / "Say whatever's on your mind. A line is plenty." |
| "Your voice, kept" / "Talk for a minute. One day it can be heard, just as you sounded." | "Say a few words" / "Talk or type, whichever is easier." |
| "A page for {weekday}" / "Something from today for the book?" | "Anything from today?" |

Rotate these. "A minute is plenty" and "A line is plenty" are two lines, not a template for every push. The name variant ("Anything you want {child} to know?") exists only where the parent has turned names on for the lock screen. Final wording is the content agent's job, checked against the rules test and the notification tests.

### Email
Subject says what happened or what's asked. Preheader adds one useful next fact. Body: what, why they got it, the one thing to do. A calm line for security ("Didn't ask for this? You can ignore it."). Sign "Warmly," then the brand name (the CMO question in section 1 is open). Contractions, short paragraphs, no filler. No child names, letter text, pixels or tracked links. Transactional only unless the CMO and counsel have classified it as commercial. What we send before a trial ends is a "reminder" (glossary).

| Don't | Do |
| --- | --- |
| "To make sure it is really you, we will send a separate email to this address with a link that confirms it. It works in any web browser, so you do not need the app." | "To make sure it's you, we'll email a link to this address. It opens in any browser." |
| "Thank you for trying Plus. This email is your copy of what you agreed to on {agreedDate}. Please keep it." | "Thanks for trying Plus. You agreed to the terms on {agreedDate}. Keep this email for your records." |
| "An early reminder, so the date and the price are never a surprise." | "A reminder before your trial ends, with the date and the price." |

### App Store page and website
Say what the product does for a parent in the first line. Claims must be true in the build that ships and need proof ready (FTC substantiation). No ranks, no invented reviews, no "AI". "Exactly as you said it" is held for the listing (D-125 item 9); use the D-133 line on public surfaces. The founder merges anything on `main`.

### AI disclosure (PROPOSED, a question for the CAIO and CLO; never product copy)
Status: PROPOSED. Claude-role readings, not counsel. The AI-words test (`AI`, "artificial intelligence" and the rest of the regex in `rules.test.ts`) and a disclosure duty can't collide today. The engine only removes and repairs, so no letter is generated content, and v1.0 sends nothing to a third-party AI (CR-085). The regex doesn't ban "speech model" or "machine learning models", which shipped lines already use (`packs.en.ts`, `en.trust.promise`). The collision is one day away: Apple 5.1.2(i) asks apps to disclose sharing personal data "including with third-party AI", which a consent sheet for server transcription or a hosted edit pass would have to do. Until then, write no AI-disclosure line anywhere. If a duty arrives, the CLO and the founder decide the words and a named, key-level exception to the regex, on the same route as the FEAR exception (section 9, item 1). Don't weaken the test, and don't write the sheet from this paragraph.

### Prompts
A prompt is a question a friend might ask: concrete, small, one memory. No gap counting, no "today" that implies a daily rhythm, no leading the parent to a feeling. Age-appropriate to the child's stage. Use `{child}`. Prompt text is protected (appendix B).

### Helplines and safety
Plain, steady, no cleverness. Use the names and numbers as registered. Never soften the instruction to call. Legal and clinical review owns it.

## 9. Coverage matrix: every surface and moment, and what we know

Silence in this guide doesn't mean "anything goes". Status: DONE (a playbook above), PARTIAL (a rule exists, no examples or owner decision), TODO (nothing yet; use the nearest row and ask `content`).

| Surface or moment | Owner | Tone dial | Example or rule | Status |
| --- | --- | --- | --- | --- |
| Buttons, empty states, toasts, errors | `content` | See section 5 | Section 8 | DONE |
| Permission priming | `content`, CLO | Clear, respectful | Section 8 | DONE |
| Permission denial recovery (mic, notifications) | `content`, CLO for OS text | Calm, practical | Say what's off, give the one tap to Settings, say what still works: "Notifications are off. You can turn them on in Settings." | PARTIAL |
| Offline, loading, slow download | `content` | Patient | Say what's happening. Give a time only if the build measures it. "Getting the language ready." | PARTIAL |
| Search, filters, empty results | `content` | Calm | "Nothing matches that." plus one next step | TODO |
| Destructive confirmations | `content`, counsel for retention | Serious, kind | Decision table in section 8 | PARTIAL |
| Billing failure, trial end, renewal, receipts, restore | `content`, CLO, CMO | Straight, exact | "Plus renews on {date} for {price}." A "reminder" before a trial ends. Trial length wording is limited by the rules test | PARTIAL |
| Support replies, App Store review replies | `support`, reviewed by `content` | Warm, plain, brief | Apologise once, only when we caused it; no promise about data, deletion or law (Monzo: no apology for what isn't our fault) | TODO |
| Release notes ("What's new") | `content` | Plain | Three lines, what shipped and nothing else, no "bug fixes and improvements" filler. `storeListing.whatsNewV1` is under test | PARTIAL |
| Book pages and PDF export | `content`, design-systems | Almost silent | Book pages carry only the family's words. App text on a page is small, plain and unsigned. No print promise (the test bans one; print comes later) | PARTIAL |
| Accessibility labels and alt text | `content`, design-systems | Plain, literal | Say what a control does or what an image shows, never what a parent feels. "Play recording" not "Play". A photo's alt text describes what's in it and doesn't invent a memory | PARTIAL |
| Multi-child books, siblings, twins | `content` | Plain | Names stay off the lock screen by default. For two children use their names or "your children"; never "both of them". A letter to more than one child needs a rule from the CMO | TODO |
| Grief, loss, illness | `content`, CPrivO, founder | Quiet, human | Fewer words, no cheer, no advice. Humour never (section 4) | PARTIAL |
| Co-parent | `content` | Warm | `VOICE.md` and the glossary: "co-parent" in settings and buttons, "{child}'s other parent" in prose. The only family role at v1.0 | PARTIAL |
| Grandparents and wider family (v1.1) | `content` | Plain, one instruction per sentence | `VOICE.md` section "Writing for grandparents". No public promise before v1.1 | PARTIAL |
| Month, birthday and moment messages | `content` | Quiet pleasure | The rules test holds moments to no comparing, no per-author totals, no mention of Plus | PARTIAL |
| Localisation | `content`, CAIO | Plain | The first store build is English only (D-115, D-121; `eas.json` ENGLISH_ONLY). Other languages unlock one pack at a time, after a native reviewer. If any string is translated, plurals, gender agreement and right-to-left need a translator brief first | TODO |
| System strings: share sheet, widgets, Shortcuts, app icon label, plain-text email | `content`, mobile | Plain | Same rules; list where each lives before launch | TODO |
| Sample, placeholder and screenshot text | `content`, CMO | None | Principle 11 | DONE |
| Humour | `content`, CMO, founder | Light, rare | Section 4 | PROPOSED |

### Decisions: two deferred, two decided

Items 1 and 2 are deferred to their owners. Items 3 and 4 were ruled by the CMO on 21 Nov, each starting from what shipped copy does.

1. **Exception route for the FEAR regex.** DEFERRED. Owners: CPrivO and the founder. The test bans "died", "death", "dead" and "passed away" in all copy. A support reply to a bereaved parent, or a prompt that meets a loss, can't be written without tripping it, and this guide says to fix the copy, not the test. Question: is there a narrow, named exception (a list of keys, reviewed), or does such text stay out of the repo? Until ruled, don't weaken the test and don't write such text. Nothing ships that needs it.
2. **`{child}` and gender agreement.** DEFERRED. Owners: CAIO and the founder. `{child}` removes gendered nouns and pronouns in English. In Hindi, Spanish, French, Portuguese and Arabic, verbs and adjectives agree with gender, so `{child}` alone isn't enough. Nothing translates the app at v1.0, so this blocks nothing today. It blocks any translated string.
3. **US or UK spelling.** DECIDED, CMO-RULED 21 Nov. US spelling in every new or touched line (US-only launch, D-013 and D-083; the product shows `$` and Apple Account). No mass rewrite of keys; a later sweep PR, with no change of meaning. Shipped copy still mixes them ("cancelled" and "centre" against "color", "favorite" and "license", checked 21 Nov in `packages/content/src`).
4. **Date format.** DECIDED, CMO-RULED 21 Nov. Month before day, from the locale formatter, as shipped ("October 3", "Saturday, October 3, 2026 at 9:14 pm ET"). The guide has no "5 March" example left; keep it that way.

## 10. Writing for access and translation

- Aim for a reading age of about 12. One idea per sentence, short words. (No tool or owner measures this yet; treat it as a goal.)
- Buttons and links make sense out of context (screen readers list them). "Play recording" not "Play". "Learn more about backups" not "Learn more".
- Don't rely on colour, position or an icon to carry meaning in words ("tap the green button").
- Spell out an abbreviation on first use. Avoid idioms ("under the weather", "ballpark"). They break in translation.
- Read the sentence at the largest text size. It must still make sense when it wraps. This needs a phone check (S1-23 in `docs/qa/DEVICE_TEST_PLAN.md`). A diff review can't prove it.
- Keep a sentence as one string with named placeholders. Don't build it from parts that other languages must reorder.
- Dynamic content ({child}, {date}) must read correctly for any value, including a long name.
- The accessible name of a control contains its visible text (WCAG 2.5.3), so Voice Control users can say what they see.
- A toast or error is announced with the same string the screen shows.
- Don't point: no "above", "below", "the lock", "the button on the left".
- Decorative icons say nothing to a screen reader.
- Don't carry meaning in a colon or a line break. Each sentence must read right aloud and when it wraps.

## 11. Who owns what

| Surface | Writes | Reviews |
| --- | --- | --- |
| In-app strings, errors, prompts, notifications | `content` | design-systems (layout, reading), CDesO |
| Store listing, website, launch | `marketing` with `content` | CMO, then CLO for claims, founder merges `main` |
| Emails | `content` | CMO (commercial or transactional), CLO |
| Help and support macros | `support` | `content` |
| Consent, legal-adjacent | `legal` drafts | CLO and counsel, founder merges |

The guide itself changes through a PR owned by `content`, reviewed by the CMO and Chief Design Officer lenses. Protected text is in appendix B.

## 12. How to write a line, and how to change one

### Step 0: find out what the build does
For any line that says what the product does, where data lives, what is on or off, or when something happens: find the decision (D-number, in `docs/DECISIONS.md`) and the code path that makes it true in the build that ships. Write both in the PR. If you can't find them, make the claim smaller or route it (appendix B). Lines the councils found true only if a signed pack or a server exists ("Written down on your phone", "575 MB", "In English", "Sign in with Google") are the usual failures.

### Ten steps
1. Say who the line is for and what they're doing.
2. Check section 5 for the row, and appendix B for held text.
3. Write the fact in one plain sentence, with a contraction.
4. Add the next step as a verb.
5. If it's a failure, add what's still fine and when it fixes itself, only if true.
6. Cut a word. Cut one more.
7. Read it aloud as the friend in the cheat sheet.
8. Check the tells (section 7) and the checks table (section 2).
9. Update the exact-word tests in the same PR. If a content rule test fails, fix the copy, not the test.
10. Run the checks and write what ran and what didn't.

### Three worked rewrites

**An error.**
First draft: "Unable to save your recording. Please try again later."
What's wrong: "unable to" and "please" are on our list; no sign of what's still fine; "later" gives no time.
Final: "That didn't save. Your recording is still here. Try again." Only true where the audio is on the phone; otherwise drop the middle sentence.

**A push.**
First draft: "Dear little one, anything to tell us today? Don't forget to write!"
What's wrong: a greeting that puts words in a parent's mouth; "little one"; a reminder with an exclamation mark; "today" reads as a daily rhythm.
Final: "A minute for the book?" / "Say whatever's on your mind. A line is plenty."

**An email subject and preheader.**
First draft: "Your Plus trial will end soon. Don't lose your access!"
What's wrong: loss language, urgency, an exclamation mark, no date.
Final: "A reminder before your trial ends" / "Your trial ends on {date}. It then renews at {price}."

### When you change a line
1. Find the string in `packages/content` (or a feature `copy.ts`). Never hardcode a new string in a screen.
2. Never type the product name. Use `{app}` in app copy and `${brand.name}` in content files (the rules test fails otherwise).
3. Check the playbook and the tells.
4. Run `npm test -w @scribe/content`, `npm run lint:copy -- --check` if the script exists (counts may only go down), and `npm run typecheck`. State what you ran and what you didn't.
5. In the PR, add one before and after for every changed line group. Reviewers read those, not the diff.

## 13. Review checklist (use on every copy PR)

- [ ] Would a friend say it? (the cheat sheet test)
- [ ] Contractions in everyday text; none of the tells in section 7.
- [ ] Specific, not vague. No "safe", "just", "simply".
- [ ] Error has what happened, what's fine (if true), what to do.
- [ ] True for the build that ships. D-number and code path in the PR. No new promise, no "never" or "exactly" without proof.
- [ ] Nothing suggests a machine wrote or improved the letter. No sample letter in a parent's voice.
- [ ] No counting gaps, no guilt, no fear, no streaks.
- [ ] Glossary terms only. `{child}`, not "he" or "she". No typed product name.
- [ ] Reads right in VoiceOver, at the largest text size, and in translation.
- [ ] No protected text changed.
- [ ] `npm test -w @scribe/content` passes, `npm run typecheck` passes, `npm run lint:copy -- --check` passes or is absent (said so in the PR).

## Appendix A. Benchmarks: what we took and from where

Re-read 21 Nov 2026 for v1.2 (fetched the pages again): Apple, Monzo, Mailchimp and Atlassian. Microsoft's contractions page was read on 20 Nov and not re-read for v1.2.

- **Apple Human Interface Guidelines, Writing** (developer.apple.com/design/human-interface-guidelines/writing; change log: possessive-pronoun guidance added 16 Dec 2025). VERIFIED. Take: match tone to context (the Fall Detection and Move streak examples); be clear and cut words; verbs on buttons, "Send" over "Let's do it!"; consistent words across a multi-step flow ("Next", "Continue", "Done"); use possessive pronouns sparingly ("Favorites" over "Your Favorites"); avoid "we" altogether, because it may be unclear who "we" is, as in "We're having trouble loading this content" against "Unable to load content"; "Choose a password with at least 8 characters" over "That password is too short"; "oops!" and "uh-oh" are typically unnecessary and can sound insincere; describe a setting by what it does when on; empty states give a next step; show hints like "name@example.com" and avoid robotic errors like "Invalid name". Where we differ: we don't use "unable to".
- **Monzo, Tone of voice** (monzo.com/tone-of-voice). VERIFIED. Take: "straightforward kindness"; plain words; apologise once and then focus on the fix, and don't apologise for bad news that isn't our fault; sensitive feelings are handled "with care and never make light of them". On wit: Monzo allows "the very occasional little joke" when giving straightforward updates, says to keep it simple if the news could be negative or if in doubt, and allows no wit in customer service. Its channel grid also lists "Warm wit: None" for operational communications, so the "occasional little joke" line isn't a licence for notifications or errors.
- **Mailchimp, Content Style Guide, Voice and tone** (styleguide.mailchimp.com/voice-and-tone). VERIFIED. Take: consider the reader's state of mind first; "it's always more important to be clear than entertaining"; "forced humor can be worse than none at all"; humour when it fits.
- **Atlassian Design System, Voice and tone** (atlassian.design/foundations/content/voice-tone). VERIFIED 21 Nov. Take: tone changes with the user's situation; tone down and be more prescriptive for someone who is new or confused; "Delight means little flourishes, not humor or being cheeky"; "Once may amuse, but a dozen times may annoy".
- **Microsoft Writing Style Guide** ("Brand voice: above all, simple and human"; "Use contractions", learn.microsoft.com/en-us/style-guide). Read 20 Nov, not re-read. Take: voice stays constant while tone adapts; key point first with a clear next step; short everyday words; sentence-style capitals. Don't mix a contraction with its spelled-out form, don't join a noun to a verb, and avoid awkward ones like "it'll", "there'd" and "they'd" in UI. Microsoft's voice page says nothing explicit about writing for people under stress; that reading is ours.

Round 2, 21 Nov 2026. Carried over from `docs/content/BENCHMARKS-2026-11.md` (PR #1263, head `42b6a5703d0d`), not fetched again for v1.3. That file says a fetch tool summarised each page, so every line here paraphrases a summary, not raw page text. Anything the file doesn't state is UNVERIFIED. One short quote at most per source.

- **Wise.** BLOCKED. Two pages returned an error and the design site served only a "requires JavaScript" shell. Nothing about Wise's tone is verified, so the money row (section 5) has no Wise evidence. UNVERIFIED.
- **Stripe.** Developer docs only (Apps design and style, error handling). No customer-writing section found, so Stripe's writing rules are UNVERIFIED. The docs say to treat an outcome after a dropped connection as unknown and check first (supports principle 7 and the "can't tell" paragraph in section 8), and that a declined payment can happen when nothing is broken (supports "never blame"). Not copied: error codes shown to a person.
- **Material Design.** The Material 1 writing page and a Material codelab were read. The Material 3 content page needs JavaScript and wasn't. Take: goal first, then the action; one word per action; name a control by its label; in the codelab, errors supportive with a fix, not casual or joking; "you" by default, and don't mix it with "I". Differs: Material allows exclamation points, curly quotes, en dashes and ellipses, and says to lead with benefits and omit caveats. Our ban stands, and a caveat that changes what a parent does or pays stays.
- **Shopify, content.** The shopify.dev voice and tone page and content overview were read. The Polaris error-message and actionable-language pages redirect to an API index, so Shopify's error structure is UNVERIFIED. Take: "Tone changes with the situation"; don't celebrate routine tasks or take credit for a person's success; apologise and empathise when we're at fault, but within reason; aim near a US grade 7 reading level. Differs: it names the app once, then says "we". We use `{app}`.
- **Headspace.** The design site blocked automated access (robots.txt) and wasn't worked around, so its voice rules are UNVERIFIED. Read: a Figma case study, a writer interview and a Figma post about its AI companion. Take: a gender-neutral character with a reflective voice, and the writer's view that release notes and errors deserve the care of hero copy. The post says "We didn't want AI to be invisible." That's a chat companion, not a transcript cleaner, so it doesn't apply to us today (see "AI disclosure", section 8). Not copied: the wellness register.
- **Calm.** No voice guide found; the blog index and the App Store listing were read, so the tone is implied. Take: the subscription block is plain and exact (supports the money row, where the CLO owns the legal text). Not copied: instructions to the body, health claims without cited studies, a streak tracker, puns in headlines.
- **Duolingo.** The writing pages redirect to a blog hub, so its voice rules and any limits it sets on its humour are UNVERIFIED. Read: the hub, one product article and a TechCrunch piece. Use it as a counter-example: a streak widget with a mascot that escalates toward midnight, and TechCrunch reports that guilt-led notifications drew mockery. That supports no streaks and no gap counts. The mascot's playfulness doesn't transfer to us.
- **Intercom.** Three blog articles were read, and no style guide page, so its house rules are UNVERIFIED. Take: address the user directly but never speak for them (principle 11); give each concept one name (the glossary); "Content makes a terrible bandage for a broken product" (supports step 0). Differs: its onboarding advice suits B2B; ours is one short welcome.
- **Day One.** No style guide found; the home page, blog index, privacy pledge and App Store listing were read. Take: privacy stated in specifics a person can check. Not copied: "100% private" and "military-grade" (our ban, section 4), streaks and day counts, and a joke about skipping a day. Per the page summary, the listing's privacy label and its promise sit uneasily; the label is developer-supplied. That supports step 0.

Together: nothing read supports wit on errors, money or deletion; the engagement products lean on streaks, and Duolingo shows the backlash. That's outside evidence for lines we already hold, not for changing one.

Not read, so not relied on: Airbnb, Polaris error pages, Material 3, and the voice guides of Wise, Headspace, Duolingo and Calm. The round 2 file says the GOV.UK style guide and Google's developer documentation style "were read separately"; nothing in this repo records that, so treat both as UNVERIFIED. Don't cite a brand's rules until someone has read the source.

This benchmark is five style guides and nine round 2 sources, none from a parenting, memory or voice product, and none read for accessibility or grief. It's enough to justify the principles, not to claim we match the best consumer brands. Before launch, `content` reads and records, with date and link: the GOV.UK style guide, Google's developer style (word list), the blocked or redirected pages above in a browser, and the real in-app and email text of three consumer products.

## Appendix B. What is protected

Don't rewrite these without the named owner:

- Consent text, registered in-app disclosures and the OS permission strings: CLO and the founder (counsel holds them).
- `docs/legal/**`, the Terms, Privacy Policy and anything marked PROPOSED: founder merges.
- The faithful-edit promise and the D-133 public line: founder-recorded wording.
- The alpha first-run headline (D-125 item 9).
- Helpline names and numbers.
- Emails whose file header says counsel confirms the wording (billing, account including privacy, deletion and policy updates, backup, legal): tone edits wait for the CLO.
- Anything under `supabase/**` that an email export regenerates (the Supabase Auth templates): needs its own D-041 review (D-041: unattended agent runs are paused for `supabase/` and auth).
- Prompt text. A prompt key is never reused for new wording: a changed prompt gets a new key and a `PROMPT_LIBRARY_VERSION` bump, and the signed published library is the founder's to republish.
- Real family details: tests use Asha only.
- `CLAUDE.md` edits that touch the constitution section are the founder's. This guide only adds a pointer to it.

A rewrite that touches meaning (what we promise, what we do, price, data) isn't a copy edit. Stop and route it.
