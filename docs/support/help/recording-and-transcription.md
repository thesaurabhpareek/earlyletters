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

The first time you speak a letter, the app downloads what it needs to understand you. Large downloads wait for Wi-Fi, unless you turn on **Use mobile data** in Settings, Storage. Until the download arrives, your voice is kept and the words follow. After that, speaking a letter works with no signal at all.

## Languages

You can speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them, written the way that language is written: Hindi in Devanagari, Arabic from right to left, Chinese in characters, and the accents that Spanish, French and Portuguese need.

Choose your language in Settings, **Spoken language**. You can add up to two more languages you speak at home. English is already in the app. Another language downloads when you choose it, and only that one.

To free space, remove a download in Settings, Storage. Your letters and recordings stay. New recordings in that language wait for their words until you add it again.

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

Each language other than English also has a small spelling and punctuation download. Until it arrives, letters in that language keep your words exactly as heard, with only punctuation tidied.

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

**"No talking in this one."** The app heard no speech. The recording is kept just as it is, and you can add words by typing them.

**The app cannot hear you.** Open your iPhone's Settings, find Early Letters, and turn on Microphone. Or type instead.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Tell us the language, and whether the trouble is with names, a certain sound, or the whole letter. Please do not send the letter or the recording. We never need them to help.

---

## Reviewer notes (remove before publishing)

**Built on develop (7cc43b1):**
- Speak and Type on Tonight; the Review screen with the fix list, Put it back, Keep it word for word, Show exactly what I said and "Tap any word to change it" (`strings.en.ts` lines 168 to 170, 250 to 255, 318); the microphone and transcription failed messages (lines 799 to 809); the one-time "Please have a read" card (line 334).
- On-device speech and language downloads: `docs/agents/BOARD.md` "Done this wave" (speech, language, platform); ADR 0015 (one shared model, Hindi its own). Settings, Spoken language (`apps/mobile/src/app/settings/language.tsx`; `packages/content/src/features/language.en.ts` lines 12 to 17: one language plus "up to two more"). Settings, Storage removes downloads and has "Use mobile data" (`apps/mobile/src/app/settings/storage.tsx` line 132; `packages/content/src/features/packs.en.ts` lines 8, 9, 39 and 40). Settings, Recordings lists speech per language (`packages/content/src/features/speech.en.ts` lines 9 and 10).
- The spelling and punctuation download: `packs.en.ts` line 17 (`text-rules`, "Spelling and punctuation"). Until it is installed for a language other than English, `safeModeNote` (`language.en.ts` line 46) applies, shown by `apps/mobile/src/app/settings/language.tsx` lines 53 to 56.
- "No talking in this one": `packages/content/src/features/words.en.ts` lines 23 to 26, shown in `apps/mobile/src/app/review.tsx` lines 681 and 682.
- The fix list still matches `EditType` exactly (`packages/core/src/types.ts` lines 12 to 19, unchanged this wave). The wave added one reason to refuse a fix, `not_vetted_for_language` (types.ts line 99): a fix whose word table for that language has not been signed off is not made. So some languages get fewer fixes, never more, and the article's "Only these small things" stays true.

**To build:** the Word for word choice. Settings, Recordings shows the setting's name and help as a plain row with no switch (`apps/mobile/src/app/settings/recordings.tsx` line 63). Settings, Names and words has a label (`settings.dictionaryLabel`, `strings.en.ts` line 591) but no screen (BL-178). Until both exist, the two Settings sentences describe the specified product. "Keep this as said" phrase lock strings exist (`review.lock.*`) but no screen uses them, so the article leaves them out.

**Decisions this article depends on** (settled ones are hand-offs; only D-031 is still open):
- Seven spoken languages at v1.0 (D-056) and Hindi-English mode in v1.1 (D-059). The article says Hindi-English mode is "not in this version yet". My earlier hand-off is done on develop: `onboarding.dictionary.languagesBody` now reads "Your words stay in the language you speak. We never translate them." (`strings.en.ts` line 103), and no "same sentence" or "mid-sentence" claim is left in `packages/content/src`. PRD K-24 (code-switched speech P0) still needs `product` to update it.
- Hindi in Devanagari (D-056) while D-031 (Hindi script default) is still open until 30 Oct (DECISIONS.md line 37). If Roman script becomes an option, add one line.
- No server transcription in v1.0: speech runs on the phone (ADR 0015; `trust.firstRecording.body`, "Your words are written down on this phone"). The Privacy Policy section 4 describes cloud transcription, which applies from v1.1 (section 2 says so).
- The clearer listening copy (D-058) is built (`startListeningCopies` in the boot wiring, BOARD.md integration check-in at 20:27). The article keeps "If the app also keeps a clearer copy" because the copy is optional per recording.
- Some older iPhones may not run the speech model. The article covers this with "Words are not ready yet" (`words.en.ts` lines 27 to 30). Which models run on which phones is Unverified until the device spikes in ROADMAP week 2 report.

**Wording:** "What we never do" says "We never change what you meant." It no longer adds "or how you said it", because the fix list above removes fillers and false starts from the text. The recording itself is never changed (next line in the article).

The Settings toggle is labelled with a word VOICE.md retires (`settings.tidyLabel`, PRD K-26 rename pending). The article names only its "Word for word" option. When `content` renames the toggle, name it here. The fix list matches `EditType` in `packages/core/src/types.ts` and the `review.edits.*` explanations. "A apple" is the strings' own example; I did not use the agreement example from `types.ts` because it uses a gendered pronoun.
