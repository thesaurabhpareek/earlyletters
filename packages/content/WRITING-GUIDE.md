# Early Letters writing guide

Status: v1.0, 20 Nov 2026. Owner: `content`, with the CMO and Chief Design Officer lenses. Legal review of any promise or consent wording goes through the CLO.

This is the guide for every word a customer reads: the app, error messages, emails, push notifications, the App Store page, the website, the prompts and the printed-looking pages inside the book. Read it before you write or change a line. Read `VOICE.md` and `BRAND.md` alongside it. Where they overlap, `VOICE.md` and the rules test win on mechanics, `BRAND.md` wins on vocabulary, and this guide wins on how a sentence should sound.

## 1. The one test

Read the line out loud, in the voice of a friend who is also a parent, standing next to the person holding the phone. If that friend would never say it, rewrite it.

Three questions behind it:

1. Would a tired parent understand it in one read, at 2 a.m., one-handed?
2. Does it say what is true about this exact build and this exact moment?
3. Does it sound like a person who cares wrote it, not like a system describing itself?

## 2. Principles

1. **Say it like a person.** Plain, spoken words. Contractions are normal ("didn't", "you'll", "it's"). Stiff phrasing ("did not", "we will send", "to ensure") is the single biggest reason copy sounds machine-made.
2. **Lead with what matters to them.** The outcome or the next step comes first. The reason, if needed, comes second. Our own process never leads.
3. **Say the specific thing.** "Your words are still here" beats "Everything is safe". A fact beats a feeling word. If a line would fit any app, it is not finished.
4. **One idea, as few words as will do.** Cut every word that does not carry weight. Then read it again and cut one more.
5. **Be warm, never performed.** Warmth is accuracy and patience, not exclamation, cuteness, or a pause for effect. We never perform emotion at a parent. (Monzo's guide asks for the same: "straightforward kindness", with wit kept out of operational messages.)
6. **Match the moment.** A failed save at 2 a.m. and a first letter saved are different moments. Tone moves; voice does not (section 4).
7. **Be honest to the build.** Claim only what this build does. "Never", "always", "only" and "exactly" need proof. When we're unsure, we say less.
8. **The machine never takes a bow.** Nothing we say implies software wrote, polished, improved or summarised a letter. Our own words are small, plain and unsigned.
9. **Celebrate what exists.** No gap counts, no streaks, no guilt, no fear, no "before it's too late". Legacy is about love and time, never endings.
10. **Everyone can read it.** Short sentences, common words, screen-reader friendly, ready to translate, no jargon, no gendered words for the child (`{child}`).

## 3. The brand character

Early Letters sounds like a calm, observant friend who has done this before. Not a coach, not a brand, not an assistant.

| We are | That means | We are not | So we avoid |
| --- | --- | --- | --- |
| **Warm** | Kind and direct. We assume the parent is capable and tired. | Gushing | "Amazing!", "We're so excited", baby talk, pet names for the user |
| **Calm** | Short sentences, nothing urgent unless it is. | Anxious or nagging | Alarm words, countdowns, "Don't miss", "Hurry" |
| **Plainspoken** | Everyday words and verbs. | Corporate or clever | "Leverage", "seamless", "robust", puns, taglines inside the product |
| **Quietly literary** | A little care for rhythm, only where a letter, a prompt or a book page deserves it. | Poetic everywhere | Greeting-card endings, aphorisms, "That is love, written down" |
| **Trustworthy** | Specific, true, easy to check. | Reassuring in general | "Safe and secure", locks, shields, "bank-level", "100%" |

The literary register belongs to the family's own words in the book and to a small number of prompts. The interface itself stays plain. The app's own text is smaller and quieter than a letter, never in the letter's serif, never signed.

## 4. Tone by moment

Voice stays the same. The dial moves. When unsure, go calmer and plainer.

| Moment | Dial | What it sounds like | Never |
| --- | --- | --- | --- |
| First open, onboarding | Warm, light | One short welcome, then get out of the way | A speech about the brand |
| Saved a letter | Quiet pleasure | A plain confirmation, varied so three in a row don't repeat | Fanfare, confetti, "Great job!" |
| Slow or waiting | Patient, informative | Say what's happening and roughly how long | Cute loading lines |
| Something failed | Calm, practical | What happened, what's still safe, what to do | Blame, "Oops", "Uh-oh", "Something went wrong" |
| Permission or consent | Clear, respectful | What it's for, what changes, that they can change their mind | Pressure, fear, small print tone |
| Money, renewals, billing | Straight, exact | Date, amount, what they keep | Hype, soft-selling, surprise |
| Deleting or leaving | Serious, kind | Exactly what goes, whether it can come back, one clear choice | Guilt, drama, "Are you sure you want to leave us?" |
| Hard moments (loss, illness in a prompt or reply) | Quiet, human | Fewer words, no cheer, no advice | Silver linings, exclamation, fixing |
| A reminder or push | Light, optional | An invitation they can ignore | A nudge that counts, scolds or chases |

## 5. Grammar and word choice

**Write the way people talk**

- Use contractions in everyday UI, emails and notifications: "didn't", "couldn't", "you'll", "it's", "we'll". Spell out ("do not", "will not") only in legal or consent lines, or where the weight is deliberate ("We never sell them").
- Active voice. Say who does what: "We couldn't save that" or, better, "That didn't save." Not "The operation could not be completed."
- Second person for the parent ("your book", "you"). Keep "my" for the user's own controls in a form ("Save my place"), and don't switch between them in one flow.
- Use "we" only when the company is truly the actor and it is clear who "we" is: a promise, a billing notice, an email. Apple's guidance is to avoid "we" in errors because it is unclear who it means ("We're having trouble loading this" versus "Can't load this"). In the app, prefer the thing that happened: "That didn't load."
- Present tense and simple verbs. "Tap Save", not "You may now proceed to save".
- Start a sentence with "And", "But" or "So" when it sounds natural.
- Questions only when we truly need an answer. Don't ask rhetorical questions.

**Words**

- One term for one thing, from the BRAND.md glossary. A parent reads "letter", "book", "recording", "words". Internal terms (take, entry, draft, pack) never appear.
- Prefer the short word: "use" over "utilise", "start" over "begin", "help" over "assist", "about" over "approximately".
- Don't use: ensure, leverage, seamless, effortless, robust, empower, unlock, elevate, delve, tapestry, journey, curated, cherish, "precious moments", "make memories", "special someone", "little one" in generated lines. (The brand may use "little one" only where the prompt library or `VOICE.md` approves it.)
- Don't open with "Please" in an instruction ("Tap Save", not "Please tap Save"). Use "please" only when we are asking a real favour or apologising for a real inconvenience.
- Don't say "successfully", "unable to", "invalid", "failed", "error occurred", "encountered an issue", "experiencing difficulties".
- Don't use exclamation marks. The rules test budgets three across the whole product.
- No em dashes, en dashes, curly quotes, ellipsis characters or emoji. Use a comma, a full stop, or "to".
- Sentence case everywhere: "Add a letter", not "Add A Letter". Proper nouns only. Buttons start with a verb.

**Numbers, dates, time**

- Numerals for counts and money ("3 letters", "$4.99"). Dates the way people say them: "Tuesday", "5 March". Say the time zone only when it matters.
- Never show a number that counts a gap, a streak, or one person against another.

**Length**

- Buttons: one to three words. Toasts: under 6 words if you can. Push title: under 40 characters, body under 60 (`VOICE.md`). Error: one or two short sentences. Email preheader: one useful fact.

## 6. The tells: what makes copy sound machine-made

These patterns are what customers notice. The lint (`scripts/content/copy-tells.mjs`, ratchet at its baseline) flags the mechanical ones; reviewers catch the rest.

| Tell | Looks like | Why it fails | Instead |
| --- | --- | --- | --- |
| Stage-managed sequence | "One note from us, then Apple asks." | A setup and punchline, narrating the product to itself. People don't talk like this. | "Next, your iPhone will ask about notifications. You can change this any time in Settings." |
| Slogan rhythm | "Your voice, kept." "A quiet day, kept." | Tagline cadence in the middle of a task. | Say what happened: "Saved to the book." |
| Contrast pairs | "Not a chore, a gift." | Sounds written to be quoted. | State the one true thing. |
| Triplets for rhythm | "No counters, no badges, no scores." | Padding that exists for the beat. | Pick the one that matters, or none. |
| Stilted negatives | "did not check out", "does not work this time" | Uncontracted and vague. | "didn't finish", and say what to do. |
| Empty softeners | "Just", "simply", "quickly", "easily" | Tells the user it's easy, which is what they judge. | Cut it. |
| Greeting-card closers | "That is love, written down." | Sentiment we're putting in their mouth. | End on the fact. |
| Vague reassurance | "Everything is safe." "Don't worry." | Unfalsifiable, and worry-inducing. | "Your letters are still here." |
| Corporate verbs | "ensure", "utilise", "enable", "facilitate" | Sounds like a policy. | "make sure", "use", "turn on". |
| Self-narrating UI | "Here is your code." "This email is your copy of..." | Describes itself instead of doing it. | "Your code is 123456." "Keep this for your records." |
| Empty exclamations | "Great!", "Oops!", "Uh-oh" | Insincere in errors (Apple's guidance says as much). | Drop it, state the fact. |
| Mirroring the user back | "You are about to delete..." | Wastes the beat. | "This deletes {child}'s book and every letter in it." |
| Everything is a gift | "treasure", "cherish", "precious" | Sentimental filler. | Let the parent's own words carry feeling. |

## 7. Surface playbooks

### Buttons, labels, menus
Start with a verb. Name the result. Same action, same label, everywhere ("Save", "Add a letter", "Play"). Never "OK" for a real choice. Never "Click". Don't repeat the screen title in the button. Destructive buttons say what goes ("Delete book"), not "Confirm".

### Empty states
One line of what will be here, one clear action. No scolding, no counting what's missing. "Your first letter will show up here." plus the button.

### Toasts and confirmations
Short, past tense, varied: "Saved", "Added to {child}'s book", "Copied". Don't say "successfully". Don't stack three that end with the same word.

### Error messages
Build every error from four parts, in this order, using as few as the case needs:

1. **What happened**, in plain words and about the thing, not "we".
2. **What's still fine**, only when it is true and the parent would worry. ("Your recording is still on this phone.")
3. **What to do**, as a button or one instruction.
4. **When it will fix itself**, if it will.

Rules: place it next to the problem; never blame ("You entered..."); no codes; no "Oops"; no "Something went wrong". If we can't give a next step, say so and where help is. Apple's guidance is the same: be clear what someone can do, avoid blame, drop "oops!".

| Don't | Do |
| --- | --- |
| "Could not set reminders just now." | "Couldn't set your reminders. Try again in a moment." |
| "The download did not check out. It tries again on Wi-Fi, or tap Try again." | "The download didn't finish. It'll try again on Wi-Fi, or tap Try again." |
| "Invalid email" | "That email doesn't look right. Check for a typo." |
| "An error occurred. Please try again later." | "That didn't save. Your recording is still here. Try again." |

### Permission and consent priming
Say what we'll ask, why it helps them, and that they stay in control, in two short sentences. The OS prompt text itself is registered and counsel-held (`permissions.en.ts`): don't rewrite it without the CLO. Never narrate the sequence ("one note, then Apple asks"). Say what happens next and when.

### Onboarding
Each screen has one job and one idea. No brand speeches. Lead with the thing they can do. The alpha first-run headline is held by D-125 item 9. The promise line follows D-133: "It stays in your words. Every change is marked, and your original recording is kept unchanged."

### Settings
Label what the setting is. Explain what it does when it's on, and let them infer the off state (Apple's guidance). Link to the setting, don't describe where it lives.

### Destructive and leaving flows
Say exactly what goes, whether it can come back, and what is kept. One calm confirmation. No guilt, no "we'll miss you". Money or retention facts are counsel-checked.

### Push notifications
One idea, one line, under 60 characters, an invitation not a reminder. Never show what they wrote or the child's name on the lock screen unless they've turned it on. No day counts, no "you haven't", no emoji, no exclamation. Test every one against: would a friend text this?

| Don't | Do |
| --- | --- |
| "Dear little one," / "Anything to tell your little one today? A line or two is enough." | "A minute for {child}?" / "Say whatever's on your mind. A line is plenty." |
| "Your voice, kept" / "Talk for a minute. One day it can be heard, just as you sounded." | "Your voice is part of this" / "A minute is plenty. In years to come, {child} can hear how you sounded." |
| "A page for {weekday}" / "Something from today for the book?" | "Anything from today?" |

(These are guide examples; the final wording is the content agent's job, checked against the rules test and the notification length rule.)

### Email
Subject says what happened or what's asked, in plain words. Preheader adds one useful next fact. Body: what, why they got it, the one thing to do. A calm line for security ("Didn't ask for this? You can ignore it."). Sign "Warmly," then the brand name. Contractions, short paragraphs, no filler. No child names, letter text, pixels or tracked links. Transactional only unless the CMO and counsel have classified it as commercial.

| Don't | Do |
| --- | --- |
| "To make sure it is really you, we will send a separate email to this address with a link that confirms it. It works in any web browser, so you do not need the app." | "To make sure it's you, we'll email this address a link to confirm. It opens in any browser, so you don't need the app." |
| "Thank you for trying Plus. This email is your copy of what you agreed to on {agreedDate}. Please keep it." | "Thanks for trying Plus. This is your copy of what you agreed to on {agreedDate}. Keep it for your records." |
| "An early reminder, so the date and the price are never a surprise." | "A heads-up before your trial ends, with the date and the price." |

### App Store page and website
Say what the product does for a parent in the first line. Claims must be true in the build that ships and need proof ready (FTC substantiation). No ranks, no invented reviews, no "AI". "Exactly as you said it" is held for the listing (D-125 item 9); use the D-133 line on public surfaces. Founder merges anything on `main`.

### Prompts
A prompt is a question a friend might ask: concrete, small, one memory. No gap counting, no "today" that implies a daily rhythm, no leading the parent to a feeling. Age-appropriate to the child's stage. Use `{child}`.

### Helplines and safety
Plain, steady, no cleverness. Use the names and numbers as registered. Never soften the instruction to call. Legal and clinical review owns it.

## 8. Writing for access and translation

- Aim for a reading age of about 12. One idea per sentence. Short words.
- Buttons and links make sense out of context (screen readers list them). "Play recording" not "Play". "Learn more about backups" not "Learn more".
- Don't rely on colour, position or an icon to carry meaning in words ("tap the green button").
- Spell out an abbreviation on first use. Avoid idioms ("under the weather", "ballpark"). They break in translation and for non-native readers.
- Read the sentence at the largest text size: it must still make sense when it wraps.
- Don't build a sentence from parts that other languages must reorder; keep the whole sentence as one string with named placeholders.
- Dynamic content ({child}, {date}) must read correctly for any value, including a long name.

## 9. Benchmarks: what we took and from where

Read in full or in part this session (20 Nov 2026):

- **Apple Human Interface Guidelines, Writing** (developer.apple.com/design/human-interface-guidelines/writing). Take: match tone to context (the Fall Detection and Move streak examples); be clear and cut words; verbs on buttons, "Send" over "Let's do it!"; avoid "we" in errors; "Choose a password with at least 8 characters" over "That password is too short"; "oops" and "uh-oh" tend to sound insincere; describe a setting by what it does when on; empty states give a next step.
- **Monzo, Tone of voice** (monzo.com/tone-of-voice). Take: straightforward kindness as the base; plain, spoken-style words; lead with impact on the customer; own the mistake and apologise once; no humour in operational messages or in bad news; different dials by channel.
- **Mailchimp, Content Style Guide, Voice and tone** (styleguide.mailchimp.com/voice-and-tone). Take: plainspoken, genuine; consider the reader's emotional state first; active voice; positive phrasing; humour only when it fits, otherwise keep a straight face.

Not read this session, so not relied on: Atlassian, Google Material, Shopify Polaris, Headspace, Calm, Duolingo, Airbnb, Stripe, Day One. Two fetches (Atlassian, Material) needed an approval nobody gave; Polaris redirected. They stay on the research list. Do not cite these brands' rules until someone has read the source.

## 10. What is protected

Do not rewrite these without the named owner:

- Consent text, registered in-app disclosures and the OS permission strings: CLO and the founder (counsel holds them).
- `docs/legal/**`, the Terms, Privacy Policy and anything marked PROPOSED: founder merges.
- The faithful-edit promise and the D-133 public line: founder-recorded wording.
- The alpha first-run headline (D-125 item 9).
- Helpline names and numbers.
- Real family details: tests use Asha only.

A rewrite that touches meaning (what we promise, what we do, price, data) is not a copy edit. Stop and route it.

## 11. How to change a line

1. Find the string in `packages/content` (or a feature `copy.ts`). Never hardcode a new string in a screen.
2. Check the surface playbook above and the tells table.
3. Write the line. Read it aloud. Check length rules.
4. Update the exact-word tests in the same PR. If a content rule test fails, fix the copy, not the test.
5. Run `npm test -w @scribe/content`. State what ran.
6. In the PR, add one before and after for every changed line group. Reviewers read those, not the diff.

## 12. Review checklist (use on every copy PR)

- [ ] Would a friend say it? (section 1)
- [ ] Contractions in everyday text; none of the tells in section 6.
- [ ] Specific, not vague. No "safe", "just", "simply".
- [ ] Error has what happened, what is fine, what to do.
- [ ] True for the build that ships. No new promise, no "never" or "exactly" without proof.
- [ ] Nothing suggests a machine wrote or improved the letter.
- [ ] No counting gaps, no guilt, no fear, no streaks.
- [ ] Glossary terms only. `{child}` not "he" or "she".
- [ ] Works read by VoiceOver, at the largest text size, and in translation.
- [ ] No protected text changed. Rules test and exact-word tests pass.

## 13. Who owns what

| Surface | Writes | Reviews |
| --- | --- | --- |
| In-app strings, errors, prompts, notifications | `content` | design-systems (layout, reading), CDesO |
| Store listing, website, launch | `marketing` with `content` | CMO, then CLO for claims, founder merges `main` |
| Emails | `content` | CMO (commercial vs transactional), CLO |
| Help and support macros | `support` | `content` |
| Consent, legal-adjacent | `legal` drafts | CLO and counsel, founder merges |

The guide itself changes through a PR owned by `content`, reviewed by the CMO and Chief Design Officer lenses.
