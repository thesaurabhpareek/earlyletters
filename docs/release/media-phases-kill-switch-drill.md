# Kill-switch drill for the NX-39 photo phases (BL-858, NX-39-R37)

Status: NOT DONE. These are the steps; nobody has run them. BL-858 is done only when this drill is recorded (section 5),
on the founder's TestFlight iPhone. It is a device step and is listed for him once in `docs/release/FOUNDER_QUEUE.md`
by the stream owner, not here.

What the drill proves (BL-858 scope, NX-39-R37): the remote `photos` kill switch removes P0 and every later picture
phase (P1, P2a, P2b, P2c, P3), can pause, and can never start a phase the build does not have. What the code already
proves without a phone is in `apps/mobile/test/media-switches.test.ts` (`[NX-39-R37] each phase switch removes its
screens and reads and leaves export and erase working`): the drill checks the same rule on a real build, with a real
signed config, end to end.

Fictional family only: set the book up for "Asha". Never use a real child's name or a real photo of a child: take a
screenshot on the phone and use that as the photo.

## 1. What you need

- The founder's iPhone with TestFlight.
- Two TestFlight builds of the `testflight` profile (the drill does not need the App Store app):
  - Build A: made from `develop` as it is today. Every NX-39 phase switch is off (none is written in the `testflight`
    profile, which means off).
  - Build B: the same, but with `EXPO_PUBLIC_PHOTOS` set to `on` for that one build. Today `scripts/release/store-flags.mjs`
    refuses that in every store profile (NS-01's row has an empty `allowedOn`), so Build B waits for NS-01's Rollout PR,
    which turns P0 on in `preview` and `testflight` and edits that row in the same diff. Do not hand-edit `eas.json` to
    get it. Until that PR is merged, only Part 1 can run.
- The signing key file outside the repo, and the publishing steps in `docs/ops/PACKS_HOSTING.md` (sections on `publish.ts
  release`, `upload` and `verify`). The drill changes `scripts/packs/remote-config.json` only, and the change is committed:
  git is the record of what was served.
- A clock. `docs/ops/PACKS_HOSTING.md` says a remote-config change reaches an open app in about 5 minutes (not measured on
  a phone). Record the real time in section 5.

## 2. Part 1: a remote setting can never start a phase (Build A)

1. Install Build A. Set up a book for Asha. Take one screenshot so the phone has a photo.
2. Check the starting state: Tonight has no "Start from a photo"; Review and the letter page have no "Add a photo to this
   letter"; the Book has no Photos view. No photo permission has been asked.
3. Publish a remote config with every key in `killSwitches` set to `false` (the file as it is in git today). Wait for it
   to reach the phone (section 1), then force-quit and reopen.
4. Expected: nothing in step 2 has changed. `false` means "not paused"; it never means "on". Record it.
5. Also try the opposite: publish with `photos`, `photoMoments` and `videos` set to `true`, wait, reopen. Expected: still
   nothing changes, the app works, and typing, speaking, keeping, reading, playing, Export and Erase all work.
6. Put the three keys back to `false` and publish again before Part 2.

## 3. Part 2: the remote `photos` switch pauses P0 and everything after it (Build B)

1. Install Build B over Build A (same app record, the book stays). Check the starting state: "Start from a photo" on
   Tonight, "Add a photo to this letter" on Review, and the Photos view in the Book.
2. Keep one letter with the screenshot as its photo. Open the letter page: the photo shows between the date and the words.
3. Publish a remote config with `photos` set to `true` (every other key `false`). Note the time. Keep the app open on the
   Book and wait; then force-quit and reopen.
4. Expected, within the time you record: "Start from a photo", "Add a photo to this letter" and the Photos view are gone,
   not greyed out. On the letter page the photo is hidden and the letter's words are all there (NS-01 hides the picture
   while paused; it deletes nothing).
5. With `photos` still `true`, check the data right that the drill can check without losing the test book: Settings,
   Export your book makes a copy, and the letter is in it. Erase is checked last (step 8), because it removes the book
   step 6 needs.
6. Publish with `photos` back to `false`. Wait, reopen. Expected: every surface in step 1 is back, and the letter's photo
   shows again, unchanged.
7. Later picture phases (P1, P2a, P2b, P2c, P3): no build has them, so there is nothing to see on the phone. The rule that
   `photos` removes them too is proved in code (`mediaPhaseMayRun` walks each phase's `needs` back to P0, and the
   test pauses each one with `photos` alone). Repeat Part 2 with each phase's own TestFlight build when it exists, and
   add one row to section 5 for it.
8. Optional, last: publish with `photos` set to `true` again, wait, then run Erase (the last row of Your letters in
   Settings) on this test phone. Expected: it runs while paused, and afterwards the book, its letters and the photo are
   gone. Put `photos` back to `false` and publish.

## 4. If something is not as expected

- A surface that stays after the pause, or comes back while `photos` is `true`: stop, put `photos` back to `true` if it
  is not, and report the build number and the screen. Do not ship Build B's flag to `preview` or `production`.
- A photo surface that appears in Build A at any point: that is a build-switch failure, not a remote one. Expire Build A
  in App Store Connect and report it.
- Export or Erase failing while paused: that breaks LEGAL-REQ-040 (a kill switch never stops Erase or export). Put
  `photos` back to `false` at once and report it.

## 5. Record

Fill one row per run. The drill is recorded when Part 1 and Part 2 each have a row with every column filled.

| Date | Build (number) | Part | Config change | Time to take effect | What you saw | Pass |
|---|---|---|---|---|---|---|
| | | 1 | all `false`, then three `true` | | | |
| | | 2 | `photos` `true`, then `false` | | | |
