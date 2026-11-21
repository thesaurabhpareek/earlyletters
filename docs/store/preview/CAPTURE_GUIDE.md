# Capture guide: the final App Store preview, from the app on an iPhone

**Why this is needed.** `preview-draft.mp4` is the real app built for the web and driven by a script. It shows the cut, the timing and the type cards, but it is not a capture from the iOS app, and Apple requires one:

- App Review Guideline 2.3.4: "previews may only use video screen captures of the app itself." (https://developer.apple.com/app-store/review/guidelines/, read 1 Nov 2026)
- App Previews page: "App previews demonstrate the features, functionality, and user interface of your app using footage captured on device." (https://developer.apple.com/app-store/app-previews/, read 1 Nov 2026)

So the founder records the same shots on an iPhone and runs the same compose script. Once the Asha book is set up (part A, about 15 minutes, can be done any day before), the capture and the cut take about 20 minutes (parts B to D).

## What you need

- The binary you will submit, installed from TestFlight. It must already have the D-126 change (no Family tab) and English only. If the Family tab is still there, stop: the preview must match the submitted build.
- An iPhone with a 6.9" or 6.7" display (iPhone 16 Pro Max, 17 Pro Max, 15 Pro Max or similar). Any 19.5:9 iPhone works, because the output is scaled to 886x1920 anyway; a big screen just gives the cleanest pixels.
- A Mac with QuickTime Player and a USB-C cable. For the cut: Python 3 with Pillow (`pip3 install pillow`) and ffmpeg (`brew install ffmpeg`).
- The folder `store-1.0/video/work` (cards and scripts) copied to the Mac.

## A. Set up the Asha book (once, about 15 minutes)

The book must look lived-in: a child about 7 months old, two earlier spoken letters in earlier months, and Plus on, so the filmed letter (the third) can be kept. Use only the fictional family Asha. Never a real name or a real story.

1. Delete any earlier install of the app, then install the submission build from TestFlight. Wi-Fi on, real date and time.
2. First run, in order: on the age question tap **Yes**, then **Continue**. **Begin the book**. **That sounds right**. Name: `Asha`. Birthday: the date 7 months before the day you will film (so Tonight reads "ASHA · 7 MONTHS"). **Continue**. Signs as: **Mama**. **Sign my letters**. On "Get your words ready", tap **Download on Wi-Fi** and wait until it finishes. Then **Write the first one**, which lands on Tonight. Do not record yet.
3. Two earlier letters, both spoken, both free (the first two letters are free):
   1. Turn on Airplane Mode (so nothing online sees a wrong date). Settings, General, Date & Time: turn off Set Automatically and set the date to about 5 months ago (Asha about 2 months old). Open the app, tap **Speak**, and read: *"You laughed today. A real one. It sounded like a like a little hiccup that surprised you as much as it surprised me."* **Finish**, wait for the words, **Add to Asha's book**. If the reminder card appears ("A gentle nudge, now and then?"), tap **No reminders**.
   2. Set the date to about 2 months ago (Asha about 5 months old). **Speak**: *"So it rained all morning so we we sat by the window and you tried to catch the drops on the glass. You were so serious about it."* **Finish**, **Add to Asha's book**.
   3. Turn Set Automatically back on. Turn Airplane Mode off.
4. Plus (sandbox): in the app, Settings, Plan, **See what Plus adds**, choose a plan and confirm with your sandbox or Apple Account in TestFlight. Apple: "Apps downloaded from TestFlight will automatically operate in a sandbox environment", and a TestFlight subscription "renewed daily, up to 6 times within a 1-week period" (https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight, read 1 Nov 2026). So subscribe within a week of filming. Do not use a real purchase.
5. Check: Book shows "Asha's book", Month 5 and Month 2 with one letter each. Never write any other names into a letter (no second parent, no grandparents: the listing rules keep them out).

## B. Phone settings just before filming (2 minutes)

- Film between 6 PM and 9 PM local time, so Tonight says "Good evening, Mama." (`greetingKey` in `apps/mobile/src/lib/copy.ts`: evening is 18:00 to 20:59).
- Focus: Do Not Disturb on, so no banner lands in a take.
- Display & Brightness: Light for takes 1 and 2, Dark for take 3. Text Size default. Display Zoom: Default. Bold Text off.
- Accessibility: Reduce Motion off (the cut shows the app's normal motion), VoiceOver off.
- In the app: Settings, Appearance: **System** (so the phone's Light or Dark decides). Reading Size default.
- Battery above 50 percent, Low Power Mode off.
- Quit other apps. Quiet room is not needed (the cut is silent), but speak normally so the glow moves.

## C. Record (about 10 minutes)

**Recorder: QuickTime on the Mac.** Plug the iPhone in and tap Trust. QuickTime Player, File, New Movie Recording. Click the small arrow next to the record button: Camera **your iPhone**, Microphone **None** (or your iPhone; the sound is dropped later), Quality **Maximum**. The phone's screen now shows in the window. Click record before the first tap and stop after the last; trim later. Save each take as `take1.mov`, `take2.mov`, `take3.mov`.

QuickTime usually shows a clean status bar (9:41, full signal and battery) while it records an iPhone. This is observed behaviour, not something I found on an Apple page; check the first take. If the status bar is not clean, it is still acceptable (it is the real phone), but make sure no personal notification or carrier name shows.

Fallback if no Mac: Control Center, Screen Recording on the phone. The status bar will show the real time and battery.

| Take | Phone appearance | Taps (do them slowly; wait about 2 s on each screen) | What to say |
|---|---|---|---|
| take1 | Light | On **Tonight**, hold 3 s. If the question names something that does not suit the cut, tap **Another thought** before you start recording. Tap **Speak**. Talk for about 5 s. Tap **Finish**. Hold while it says "Writing down what you said." until the words appear. | *"Asha, um, today you you held the spoon by yourself. You mostly painted your face with it, but you were so so proud. I want you to know that I was too."* (The "um" and the repeated "you" give two marks on Review.) |
| take2 | Light | Continue straight from take1 if you can (one recording is best). On **Read it back**: if the note "Please have a read" shows, tap **Got it**. Hold 2 s. Tap the struck **um,** in the letter. Hold 3 s on the card ("Took out a sound", Put it back). Do not tap Put it back. Tap **Add to Asha's book**. Hold 4 s on the Book. | Nothing. |
| take3 | Dark | **Book** tab, **Read together**. It opens on the oldest letter (the laugh, Month 2). Hold 2 s. Tap **Next letter**. Hold 3 s on the rain letter. Do not tap Hear Mama (the cut is silent). | Nothing. |

Re-shoot any take with a stumble, a notification, or a long wait. Never speed up or cut out the "Writing down what you said." wait in a way that makes the words look instant; trimming it to about 1.5 s is fine (it is still shown).

## D. Cut (about 7 minutes)

1. AirDrop or copy the takes to the Mac folder `work/takes/`.
2. Turn each take into 30 fps frames at the right shape (the phone records 1320x2868 or similar; this crops 3 to 4 px top and bottom to 402:871 and scales to 886x1920):

   ```bash
   cd work
   for t in take1 take2 take3; do
     mkdir -p clips/$t
     ffmpeg -i takes/$t.mov -an -vf "fps=30,crop=iw:trunc(iw*871/402/2)*2,scale=886:1920:flags=lanczos" clips/$t/f%05d.png
   done
   ```
3. Open each take in QuickTime and note the times (seconds) of each moment below. Then write `work/pieces.json`. Example, with times you replace:

   ```json
   {
     "pieces": [
       ["take1", 1.0, 9.4, null],
       ["take2", 0.5, 8.9, "dissolve"],
       ["take3", 0.5, 5.0, "dissolve"]
     ],
     "cards": [
       [0.0, "tonight"], [2.55, "listening"], [7.05, "writing"],
       [8.4, "review"], [12.55, "book"], [16.8, "together"]
     ],
     "end_at": 21.3
   }
   ```

   Rules: `pieces` are `[take, start, end, how]`, played back to back; `how` is `null` for the first, `"dissolve"` for a 280 ms dissolve, `"join"` for a hard join inside a still moment. Choose take1's start so that Speak is tapped 2.4 s into the video (start = the time of the Speak tap in take1, minus 2.4). Each `cards` time is output seconds: switch to `listening` just after Listening opens, `writing` just after Finish, `review` at the first Review frame with words, `book` when you tap Add to Asha's book, `together` when Read together opens. `end_at` is the sum of the pieces (the end card adds 3 s). Keep the total between 15 and 30 s (Apple's limits); aim for 22 to 26.
4. Render:

   ```bash
   python3 scripts/compose.py "$PWD" "$PWD/../preview-final.mp4"
   ```

   This writes 886x1920, 30 fps, H.264 High 4.0, constant 11 Mbps (inside Apple's 10 to 12 Mbps target), with a silent stereo 48 kHz AAC track. The type cards in `work/cards/` are already rendered in the brand fonts; you do not need a browser.
5. Watch it once with the sound off on the phone (AirDrop it back). Check: every frame is the real app, no Family tab, no names other than Asha and Mama, cards readable, the end card reads "Your first two letters are free. To keep adding letters, subscribe to Plus."

## E. Upload (App Store Connect, the founder)

1. App Store Connect, your app, the 1.0 version page, Previews and Screenshots, **iPhone 6.9" Display**: drag `preview-final.mp4` into the previews well, before the screenshots.
2. Hold the pointer over the preview, **Edit Poster Frame**, scrub to the Review frame with the "um" card open (11 s in the draft), **Set Poster Frame**, **Done**. Apple's default poster is 5 s in, which lands on Listening. Note: "If you change the poster frame on an app preview that's already approved, you'll need to submit a new version of your app preview." (App Previews page.)
3. Do not upload a separate 6.5" preview: Apple's spec lists 886x1920 as accepted for both, and scales the larger one down when a size is missing.

## Apple specs used (read 1 Nov 2026)

From https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications:

- Length 15 to 30 seconds. Maximum file size 500 MB. Default poster frame 5 seconds.
- iPhone with Dynamic Island (large display) and iPhone with Face ID (large display): accepted 886x1920 portrait, 1920x886 landscape.
- H.264: target 10 to 12 Mbps, progressive, up to High Profile Level 4.0, max 30 fps, .mov, .m4v or .mp4. ProRes 422 (HQ) in .mov also accepted.
- Audio for H.264: stereo, 256 kbps AAC, 44.1 or 48 kHz, all tracks enabled.
- "You can upload up to three app previews per supported device size and language".
