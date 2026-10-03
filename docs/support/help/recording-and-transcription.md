# Recording and transcription

Tap Speak and talk to {child}. A minute is plenty, and pauses are fine. Your phone turns what you said into words, and your voice is kept with the letter.

We never rewrite your words. We only fix the small slips that get in the way of reading them.

## Speaking a letter

1. On Tonight, tap **Speak**.
2. Talk. Stop when you are done.
3. Read it back. Change any word that came out wrong, then keep it.

Would you rather type? Tap **Type**. On a quiet day, **Not much today** is a complete answer.

## Where it is turned into words

On your phone. In this version of the app, nothing you say is sent anywhere to be turned into words.

The first time you speak a letter, the app downloads what it needs to understand you. It is best done on Wi-Fi. After that, speaking a letter works with no signal at all.

## Languages

You can speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them, written the way that language is written: Hindi in Devanagari, Arabic from right to left, Chinese in characters, and the accents that Spanish, French and Portuguese need.

English is already in the app. Another language downloads when you choose it, and only that one. You can remove a language in Settings to free space.

Many families move between Hindi and English in one breath. A way of writing made for that is not in this version yet. For now, choose the language you use most in that letter. Your recording keeps every word, just as you said it.

The app's own screens are in English for now.

## What we fix

Only these small things, and only to help the words read clearly:

- **Fillers.** An "um" or "uh".
- **False starts.** You began a sentence, then began again. We keep the second try.
- **Repeats.** A word that came out twice in a row, like "the the".
- **Names the microphone misheard.** We use the spelling from your names list.
- **Punctuation.** Commas, full stops and capital letters where you paused.
- **Tiny slips of the tongue.** Like "a apple". We fix that one word and nothing around it.
- **Paragraphs.** A long pause starts a new paragraph.

Each fix is shown when you read the letter back. Tap **Put it back** to undo one, or **Keep it word for word** to undo them all. **Show exactly what I said** shows the words as they first came out.

To keep every "um" and false start in every letter, choose **Word for word** in Settings, Recordings.

## What we never do

- We never add a word you did not say.
- We never change what you meant.
- We never reword, summarise or make a letter sound nicer.
- We never change your recording. If the app also keeps a clearer copy for listening, the original is always there to play.
- We never change a letter you typed. Your keyboard's own autocorrect is the only help it gets.

The words exactly as they first came out are kept unchanged, for as long as the letter exists. Only you can see them, and you can see them any time.

## Names

The app already knows {child}'s name and what {child} calls you, from when you set up the book. You can add more names, places and home words in Settings, Names and words, and they will be spelled your way.

## When something goes wrong

**The words are wrong.** We can mishear, especially names. Tap any word to change it. Adding the name to Names and words helps next time.

**Words are not ready yet.** Keep the recording now. The words can come later, or you can type the letter. Your voice is kept either way.

**"We could not write this one down."** The recording is safe on this phone. Tap Try again, or type it.

**The app cannot hear you.** Open your iPhone's Settings, find Early Letters, and turn on Microphone. Or type instead.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Tell us the language, and whether the trouble is with names, a certain sound, or the whole letter. Please do not send the letter or the recording. We never need them to help.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** Speak and Type on Tonight; the Review screen with the fix list, Put it back, Keep it word for word, Show exactly what I said and "Tap any word to change it"; the voice-only save when words are not ready (`apps/mobile/src/lib/copy.ts` waiting strings); the transcription failed and microphone messages; the one-time "Please have a read" card; the names list built from the child's name and the signature (`dictionaryFor` in `review.tsx`).

**To build:** BL-130 recorder session, BL-142 transcription queue, BL-143 model download and removal in Settings, BL-146 suggestions UX (P1), BL-178 the Names and words settings screen. Language packs downloaded on demand (brief decision 15) have no backlog task id yet that I could find; `product` to confirm. The clearer listening copy (brief decision 8) has no task either, so the article only says "if". "Keep this as said" phrase lock strings exist (`review.lock.*`) but the screen does not use them, so the article leaves them out.

**Decisions this article depends on** (settled ones are hand-offs; only D-031 is still open):
- Seven spoken languages at v1.0 (brief decision 6, Decided) and Hindi-English mode in v1.1 (brief decision 9, Decided). The article says Hindi-English mode is "not in this version yet" rather than promising a later update. This conflicts with `site.faq` "Which languages can I use?" ("Hindi, English, or both in the same sentence") and `onboarding.dictionary.languagesBody` ("Switch languages mid-sentence"), and with PRD K-24 (code-switched speech P0). Hand-off to `content` and `product`.
- Hindi in Devanagari (brief decision 6) while D-031 (Hindi script default) is still open until 30 Oct. If Roman script becomes an option, add one line.
- No server transcription in v1.0 (PRD 2.2 and 3.0: nothing leaves the phone for transcription in v1.0). The Privacy Policy section 4 describes cloud transcription, which applies from v1.1 (section 2 says so).
- Some older iPhones may not run the speech model (ADR 0001, BL-143 device tiers). The article covers this with "Words are not ready yet". Which models run on which phones is Unverified until BL-043 reports.

**Wording:** "What we never do" says "We never change what you meant." It no longer adds "or how you said it", because the fix list above removes fillers and false starts from the text. The recording itself is never changed (next line in the article).

The Settings toggle is labelled with a word VOICE.md retires (`settings.tidyLabel`, PRD K-26 rename pending). The article names only its "Word for word" option. When `content` renames the toggle, name it here. The fix list matches `EditType` in `packages/core/src/types.ts` and the `review.edits.*` explanations. "A apple" is the strings' own example; I did not use the agreement example from `types.ts` because it uses a gendered pronoun.
