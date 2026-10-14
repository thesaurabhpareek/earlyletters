# Recording and transcription

Tap Speak and talk to {child}. A minute is plenty, and pauses are fine. Your phone turns what you said into words, and your voice is kept with the letter.

We never rewrite your words. We only fix the small slips that get in the way of reading them.

## Speaking a letter

1. On Tonight, tap **Speak**.
2. Talk. Stop when you are done.
3. Read it back. Change any word that came out wrong, then keep it.

Would you rather type? Tap **Type**.

On a quiet day, **Not much today** is a complete answer. The book keeps a small "A quiet day" mark with the date, and no words: the app never writes anything for you. A quiet-day mark is not a letter, so it never counts as one of your two free letters, and it is not part of Read together. To take one away, press and hold it in the book.

## Where it is turned into words

On your phone. In this version of the app, nothing you say is sent anywhere to be turned into words.

To turn your voice into words, the phone needs a one-time download. At the end of setting up, the app asks first and shows the size: tap **Download on Wi-Fi**, or **Not now**. Nothing downloads until you say yes. If you chose Not now, the app asks again when you read back a letter, and you can also start it in Settings, Recordings.

The download waits for Wi-Fi and carries on where it left off if it is interrupted. To use mobile data instead, turn on **Use mobile data** in Settings, Storage, or tap **Use mobile data** on the waiting card for this one download. Until it arrives, your voice is kept and the words follow. After that, speaking a letter works with no signal at all.

## Languages

You can speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them, written the way that language is written: Hindi in Devanagari, Arabic from right to left, Chinese in characters, and the accents that Spanish, French and Portuguese need.

Choose your language in Settings, **Spoken language**. You can add up to two more languages you speak at home. Once you have said yes to the download, a language you add downloads what it needs when you choose it, and only that.

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

Each language other than English also has a small spelling and punctuation download. Until it arrives, letters in that language keep your words exactly as heard, with only punctuation fixed.

Each fix is marked when you read the letter back, and the app says how many there are. Tap a fix to see what you said, then **Put it back** to undo it. To see and keep the letter with no fixes at all, choose **Exactly as said** at the top. You can switch back before you keep it.

After a letter is kept, open it and tap **Show exactly what I said** to see the words as they first came out.

Words that arrive later, after you kept the recording, arrive exactly as you said them. Nothing is fixed until you read them back.

**Word for word** in Settings, Recordings sets how new letters open. On, they open with small fixes, marked. Off, they open Exactly as said, keeping every "um" and false start.

## What we never do

- We never add a word you did not say.
- We never change what you meant.
- We never reword, summarise or make a letter sound nicer.
- We never change your recording. If the app also keeps a clearer copy for listening, the original is always there to play.
- We never change a letter you typed. Your keyboard's own autocorrect is the only help it gets.

The words exactly as they first came out are kept unchanged, for as long as the letter exists. Only you can see them, and you can see them any time.

## Names

The app already knows {child}'s name and what {child} calls you, from when you set up the book, and spells them your way.

To change {child}'s name, birthday or due date, or how you sign your letters, go to Settings, tap {child}'s name, then tap the row under **Name and birthday**. Letters you already wrote keep their dates and how they were signed. Once a due date has passed, the same screen offers to set the birthday.

## When something goes wrong

**The words are wrong.** We can mishear, especially names. Tap any word to change it.

**Words are not ready yet.** Keep the recording now. The words can come later, or you can type the letter. Your voice is kept either way.

**"We could not write this one down."** The recording is safe on this phone. Tap Try again, or type it.

**"No talking in this one."** The app heard no speech. The recording is kept just as it is, and you can add words by typing them.

**The app cannot hear you.** Open your iPhone's Settings, find Early Letters, and turn on Microphone. Or type instead.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Tell us the language, and whether the trouble is with names, a certain sound, or the whole letter. Please do not send the letter or the recording. We never need them to help.

---

## Reviewer notes (remove before publishing)

**Re-checked against develop at ed16ca3 (14 Oct 2026), the shipping on-device v1.0.** This article describes no sign-in, sync, backup or family feature, so it needs no version 1.1 mark. Changed this run:
- **First run and the speech download** (D-087, `docs/DECISIONS.md` line 545; #104). The old line "The first time you speak a letter, the app downloads" is no longer true: nothing downloads until the person taps. `apps/mobile/src/lib/models/speech-consent.logic.ts` lines 1 to 12 (only `yes` starts a download; picking a language only stores it); `apps/mobile/src/components/speech/speech-consent-card.tsx` lines 1 to 8; shown at the end of first run (`apps/mobile/src/app/onboarding.tsx` line 346) and in Review (`apps/mobile/src/app/review.tsx` lines 977 and 979). Strings: `speechConsentCopy` in `packages/content/src/features/speech.en.ts` lines 30 to 40 ("Download on Wi-Fi", "Not now", "It waits for Wi-Fi, and carries on where it left off", "You can do this later in Settings, Recordings"). The one-time mobile data button: `wordsCopy.pack.mobileDataButton` (`packages/content/src/features/words.en.ts` line 29). The Storage switch: `packs.en.ts` lines 39 and 40.
- **"English is already in the app"** is removed. The speech download is needed for English too (speech.en.ts line 32: "a one-time download"). What English does not need is the spelling and punctuation pack, which the "What we fix" paragraph still says.
- **Review controls** (D-086, line 541; #103). "Keep it word for word" no longer exists on develop. The control is "With small fixes | Exactly as said" (`review.view`, `packages/content/src/strings.en.ts` lines 266 to 271), the count is a sentence (lines 272 and 273), and Put it back is line 285. "Show exactly what I said" is on the letter page (`book.entryMenu.showOriginal`, line 440; `apps/mobile/src/app/letter/[id].tsx` line 164). Words arriving later are never fixed unread: `wordsCopy.waiting.arrivedNote` (words.en.ts line 52).
- **The Word for word switch is built** and the old text had it backwards. `apps/mobile/src/app/settings/recordings.tsx` lines 67 to 84: on means small fixes, marked; off means new letters open Exactly as said (`settings.tidyOn` and `tidyOff`, strings lines 645 and 646). The old "choose Word for word to keep every um" would have sent people the wrong way.
- **Quiet-day marks** (D-084, line 532; #92). "Not much today" stores a mark with no text (`notMuch`, strings lines 251 to 257); the book shows "A quiet day" (`book.quietDay`, lines 408 to 413); a long press removes it (`apps/mobile/src/components/book/quiet-day-row.tsx` line 34). Marks never count toward free letters and never appear in Read together (D-084; D-083 line 527).
- **Editing a child's name, date and signature** (D-087; #94). `apps/mobile/src/app/settings/children/[id].tsx` lines 66 to 82: the "Name and birthday" section (`children.settings.detailsLabel`), with Name, Birthday or Due date, and "Sign my letters to {child} as". Editing writes only the child's own row (line 38). `childrenExtra.edit.signsAsNewOnly` (strings line 953): letters already written keep how they were signed. The born card: `edit.born` (lines 958 to 964), shown once the due date has passed (line 45). D-087 says saved letters, their dates and their signatures never change.
- **Names and words is not built.** There is still no screen (`settings.dictionaryLabel` line 641 is unused in `apps/mobile/src/app/settings/`). The article no longer sends people there. Put the sentence back when BL-178 ships. Note for `content`: `review.edits.misheardName.explain` (strings line 319) says "from your words list", which a person cannot open yet.

**Built on develop and unchanged since my last check:** Speak and Type on Tonight (strings lines 186 and 187); "We could not write this one down" (line 871); "No talking in this one" (`wordsCopy.noSpeech`, words.en.ts lines 33 to 41); Settings, Spoken language with up to two more languages (`packages/content/src/features/language.en.ts` line 16); Settings, Storage removes downloads. The fix list still matches `EditType` in `packages/core/src/types.ts`, and each fix is named by what happened (`review.edits`, strings lines 304 to 339).

**Decisions this article depends on** (settled ones are hand-offs; only D-031 is still open):
- Seven spoken languages at v1.0 (D-056) and Hindi-English mode in v1.1 (D-059). The article says Hindi-English mode is "not in this version yet". My earlier hand-off is done on develop: `onboarding.dictionary.languagesBody` now reads "Your words stay in the language you speak. We never translate them." (`strings.en.ts` line 103), and no "same sentence" or "mid-sentence" claim is left in `packages/content/src`. PRD K-24 (code-switched speech P0) still needs `product` to update it.
- Hindi in Devanagari (D-056) while D-031 (Hindi script default) is still open until 30 Oct (DECISIONS.md line 37). If Roman script becomes an option, add one line.
- No server transcription in v1.0: speech runs on the phone (ADR 0015; `trust.firstRecording.body`, "Your words are written down on this phone"). The Privacy Policy section 4 describes cloud transcription, which applies from v1.1 (section 2 says so).
- The clearer listening copy (D-058) is built (`startListeningCopies` in the boot wiring, BOARD.md integration check-in at 20:27). The article keeps "If the app also keeps a clearer copy" because the copy is optional per recording.
- Some older iPhones may not run the speech model. The article covers this with "Words are not ready yet" (`words.en.ts` lines 27 to 30). Which models run on which phones is Unverified until the device spikes in ROADMAP week 2 report.

**Wording:** "What we never do" says "We never change what you meant." It no longer adds "or how you said it", because the fix list above removes fillers and false starts from the text. The recording itself is never changed (next line in the article).

The Settings switch is now labelled "Word for word" (`settings.tidyLabel`, strings line 644), so the article names it. The fix list matches `EditType` in `packages/core/src/types.ts` and the `review.edits.*` explanations. "A apple" is the strings' own example; I did not use the agreement example from `types.ts` because it uses a gendered pronoun.
