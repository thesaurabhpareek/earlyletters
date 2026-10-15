# AL-02 Record, transcribe, edit and save offline

| | |
|---|---|
| Proves | Capture works offline with zero requests (F04-REQ-032, A-REQ-030); a draft exists before the first audio byte and a take is kept on background (F04-REQ-001, LEGAL-REQ-011); words arrive on the phone with no network (F05-REQ-038); every machine edit is shown and can be put back (F06-REQ-019 claim, constitution); typed text is stored exactly as typed (F04-REQ-012, F06-REQ-037); a voice-only letter waits for its words and does not count until kept with words (F04-REQ-044, D-103); Not much today saves one mark a day (F04-REQ-016). Alpha plan items 6 and 8 (J2, J3, J4, J5) |
| Builds | Build 1 before Family and Friends get it; build 2 on Wed 28 Oct (F25), where AL-02.11 adds the "Not sent yet" check |
| Phones | Phone A (SE 3). Phone B (current iPhone) for AL-02.3 to AL-02.6 only |
| Time | about 45 min [E] |
| Needs first | AL-01 done on this install, so the English speech model is downloaded (Settings > Storage lists it); the scripted Asha letters (DEVICE_TEST_PLAN P-08) ready to read aloud or to play from another device: 30 s and 2 min |
| Record in | the session's evidence file, rows AL-02.1 to AL-02.12 |

Never read a real letter into the phone. The scripted Asha letters (TDD 03 7.3 corpus scripts) read by a consenting adult are the only voice allowed.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-02.1 | Airplane mode on. Tonight > Speak. Read the 30 s Asha letter. Pause, wait 5 s, Keep talking, read two more sentences, Finish. | Recording starts within about half a second of the tap; Pause stops the clock; Keep talking continues the same take; Finish opens Review | Seconds of the take shown at Finish |
| AL-02.2 | Wait on Review with the screen on. | The words appear on the phone with no network. A 2-minute letter on the SE 3 should take 30 s or less (F05-REQ-040, a gate measured in the lab run, not here) | Seconds from Finish to words |
| AL-02.3 | Read the change marks. Open one change row, then put it back. | Every machine change is marked and listed; putting it back restores the words exactly as said; nothing was added that was not said, and no word was replaced with a nicer one | Number of change rows (a count, never the words); yes or no for "put back restored it" |
| AL-02.4 | Switch the level to "Exactly as said", then back to "Small fixes, marked". | "Exactly as said" shows the raw words with no fixes; switching back shows the same marks as before | yes or no |
| AL-02.5 | Type one correction of your own in the text (a name the model misheard, for example `Asha`). Save to the book. | Saved; the letter is in the Book with the words as you left them; your own correction is not shown as a machine change | yes or no; screenshot name |
| AL-02.6 | Tonight > Type. Type a short line about Asha's first smile that holds, from the iOS keyboard: an em dash (long-press the hyphen), curly quotes (the default iOS quotes), an ellipsis character (three dots become one with Smart Punctuation), one emoji, one Hindi word on the Devanagari keyboard and one Arabic word on the Arabic keyboard. Save. (This sheet names the characters instead of showing them, so the repo text stays plain ASCII.) | The letter reads back character for character as typed, in the Book and on the letter page: no dash, quote or ellipsis changed, the Arabic word runs right to left, and there are no change marks at all (typed text gets no machine edit) | yes or no; screenshot name |
| AL-02.7 | Start a new Speak take, talk for 10 s, then press the Home button. Open the app again. | The take stopped within about 1 s and was kept; Review opens on return with the "stopped when you left the app" line; the orange microphone dot was gone at once | yes or no; seconds |
| AL-02.8 | Not much today on Tonight. Tap it again. | One quiet-day mark is saved with Undo; the second tap the same day adds nothing; the mark never appears as a letter or in a chapter count | yes or no |
| AL-02.9 | Close the app from the app switcher and open it again, still offline. Open the Book. | Every letter from this drill is there once, with the same words; the take from AL-02.7 is there or waiting in Tonight | Count of letters before and after (must match) |
| AL-02.10 | Only on a phone with no speech model (delete and reinstall, skip the download in first run): Speak 10 s, Finish, choose Keep my voice. Then turn Wi-Fi on and download the model. | The letter is saved, private, waiting for its words; when the words arrive, a Tonight row asks you to read them; the letter does not count toward the 2 free letters until you save it with its words on screen (D-103). The app shows no counter anywhere (M1) | yes or no; whether the Keep sheet appeared before the third own letter saved with its words (it must not; AL-09.1 checks the gate itself) |
| AL-02.11 | Build 2 only, signed in (after AL-04): repeat AL-02.1 and AL-02.6 in airplane mode, then turn airplane mode off. | Both letters save offline; "Not sent yet" shows within about 10 s; it clears after the network returns and the letters reach the server (F16-REQ-016) | Seconds until "Not sent yet"; seconds until it clears |
| AL-02.12 | Open the App Privacy Report for the app. | No domain was contacted during the airplane-mode steps (the report lists contacts with times) | yes or no |

## Pass rule

Every row passes. A word added, replaced with a different meaning, or changed without a mark in AL-02.3 to AL-02.6 is a fail and an S0 (the machine added meaning).

## Stop rule

A letter or recording that is missing or changed after AL-02.9 is S0: stop, keep the phone as it is, file the issue.

## Not proved here

Transcription speed over 30 runs and battery (S1-17, the lab run), other languages (S1-18, per-language gates), Hermes parity of the engine (WP-F06-01), the kill runs (AL-03).
