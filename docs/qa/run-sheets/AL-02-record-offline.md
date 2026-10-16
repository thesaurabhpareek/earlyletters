# AL-02 Record, transcribe, edit and save offline

> **Drill identities first.** Follow `README.md` "Drill identities": drill child Asha, drill accounts only, never the family book. AL-02.10 deletes and reinstalls the app: do the check in AL-02.0 first, and again before AL-02.10.

| | |
|---|---|
| Proves | Capture works offline with zero requests (F04-REQ-032, A-REQ-030); a draft exists before the first audio byte and a take is kept on background (F04-REQ-001, LEGAL-REQ-011); words arrive on the phone with no network (F05-REQ-038); every machine edit is shown and can be put back (F06-REQ-019 claim, constitution); typed text is stored exactly as typed (F04-REQ-012, F06-REQ-037); a voice-only letter waits for its words and does not count until kept with words (F04-REQ-044, D-103); Not much today saves one mark a day (F04-REQ-016). Alpha plan items 6 and 8 (J2, J3, J4, J5) |
| Builds | Build 1 before Family and Friends get it (after F12); build 2 at F25, where AL-02.11 adds the "Not sent yet" check |
| Plan | Free, nothing kept before this sheet. It keeps exactly two letters (AL-02.5 and AL-02.6). Every other take is let go or kept as voice only, because on Free the third letter kept opens the Keep sheet |
| Phones and accounts | Drill phones only: Phone A (SE 3); Phone B (current iPhone) for AL-02.3 to AL-02.6 only. Build 2 only: a drill account that has kept no letters yet (AL-02.11) |
| Time | about 45 min [E] |
| Needs first | AL-01 done on this install, so the English speech model is downloaded (Settings > Storage lists it); the scripted Asha letters (DEVICE_TEST_PLAN P-08) ready to read aloud or to play from another device: 30 s and 2 min |
| Record in | the session's evidence file, rows AL-02.0 to AL-02.12 |

Never read a real letter into the phone. The scripted Asha letters (TDD 03 7.3 corpus scripts) read by a consenting adult are the only voice allowed.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-02.0 | The drill-phone check (`README.md` rule 3) on each phone. Build 2 only: then do AL-02.11's first part (sign in before AL-02.1). | The phone holds only the drill book from AL-01. If not, **stop** | pass or stop |
| AL-02.1 | Airplane mode on. Tonight > Speak. Read the 30 s Asha letter. Pause, wait 5 s, Keep talking, read two more sentences, Finish. | Recording starts within about half a second of the tap; Pause stops the clock; Keep talking continues the same take; Finish opens Review | Seconds of the take shown at Finish |
| AL-02.2 | Wait on Review with the screen on. | The words appear on the phone with no network. A 2-minute letter on the SE 3 should take 30 s or less (F05-REQ-040, a gate measured in the lab run, not here) | Seconds from Finish to words |
| AL-02.3 | Read the change marks. Open one change row, then put it back. | Every machine change is marked and listed; putting it back restores the words exactly as said; nothing was added that was not said, and no word was replaced with a nicer one | Number of change rows (a count, never the words); yes or no for "put back restored it" |
| AL-02.4 | On Review, switch the view to "Exactly as said", then back to "With small fixes". | "Exactly as said" shows the raw words with no fixes; switching back shows the same marks as before | yes or no |
| AL-02.5 | Type one correction of your own in the text (a name the model misheard, for example `Asha`). Save to the book. This is kept letter 1. | Saved; the letter is in the Book with the words as you left them; your own correction is not shown as a machine change | yes or no; screenshot name |
| AL-02.6 | Tonight > Type. Type a short line about Asha's first smile that holds, from the iOS keyboard: an em dash (long-press the hyphen), curly quotes (the default iOS quotes), an ellipsis character (three dots become one with Smart Punctuation), one emoji, one Hindi word on the Devanagari keyboard and one Arabic word on the Arabic keyboard. Save. This is kept letter 2. (This sheet names the characters instead of showing them, so the repo text stays plain ASCII.) | The letter reads back character for character as typed, in the Book and on the letter page: no dash, quote or ellipsis changed, the Arabic word runs right to left, and there are no change marks at all (typed text gets no machine edit) | yes or no; screenshot name |
| AL-02.7 | Start a new Speak take, talk for 10 s, then press the Home button. Open the app again. When Review shows the take, choose Let it go and confirm (a third kept letter would open the Keep sheet on Free). | The take stopped within about 1 s and was kept until you chose; Review opened on return with the "stopped when you left the app" line; the orange microphone dot was gone at once | yes or no; seconds |
| AL-02.8 | Not much today on Tonight. Tap it again. | One quiet-day mark is saved with Undo; the second tap the same day adds nothing; the mark never appears as a letter or in a chapter count, and it does not count as a kept letter | yes or no |
| AL-02.9 | Close the app from the app switcher and open it again, still offline. Open the Book. | The two letters from AL-02.5 and AL-02.6 are there once each, with the same words | Count of letters before and after (2 and 2) |
| AL-02.10 | Repeat the drill-phone check, then delete and reinstall the app and skip the download in first run (a phone with no speech model). Speak 10 s, Finish, choose Keep my voice. Then turn Wi-Fi on, download the model, open the letter from the Tonight row and keep it from Review. | Keep my voice saves a private letter waiting for its words with no Keep sheet: a voice-only letter does not count (D-103). When the words arrive a Tonight row asks you to read them. Keeping it from Review with its words is when it counts: if the two earlier letters still count after the reinstall (the Keychain count can survive it, ASC D-7), the Keep sheet opens at this point, which is correct. The app shows no counter anywhere (M1) | yes or no for "no Keep sheet at Keep my voice"; whether the Keep sheet opened at the keep with words |
| AL-02.11 | Build 2 only. Before AL-02.1, online, sign in as a drill account that has kept no letters yet (AL-04's steps), then turn airplane mode on. AL-02.5 and AL-02.6 are then that account's first two letters, saved offline. After AL-02.9 turn airplane mode off. | After each of the two saves, the letter shows it has not been sent yet within about 10 s (F16-REQ-016 calls it "Not sent yet"; that wording is not in `packages/content` on 16 Oct, so write down what the screen says). With the network back it clears, and the two letters reach staging | Seconds until the not-sent state shows; seconds until it clears; the words shown |
| AL-02.12 | Open the App Privacy Report for the app. | No domain was contacted during the airplane-mode steps (the report lists contacts with times) | yes or no |

## Pass rule

Every row passes. A word added, replaced with a different meaning, or changed without a mark in AL-02.3 to AL-02.6 is a fail and an S0 (the machine added meaning).

## Stop rule

A letter or recording that is missing or changed after AL-02.9 is S0: stop, keep the phone as it is, file the issue.

## Not proved here

Transcription speed over 30 runs and battery (S1-17, the lab run), other languages (S1-18, per-language gates), Hermes parity of the engine (WP-F06-01), the kill runs (AL-03).
