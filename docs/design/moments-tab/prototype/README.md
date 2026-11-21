# Moments prototype (Asha examples): experience and motion, hybrid

File: `moments-prototype.html`. One self-contained file (about 108 KB), no network, no remote loads, no external fonts, no build. Open it in a browser. On a phone it fills the screen and the controls sit behind the "Controls" link at the top. On a desktop it shows an iPhone-sized frame and a side panel.

Status: PROPOSED design prototype. It changes no token, component or screen in the repo. The spec it shows is `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md`; the motion ids in the live "Motion that just played" list (EM-01 to EM-14) are the ids of that spec's motion map. It extends the D7 prototype (wip/moments-d7, abffeecd).

## What this version adds to D7

- The tab in every access state, from the panel's "Access state of the tab": Never asked, Never asked with the primer open, Not now, Granted (full), Limited, Declined, Restricted, Library flag off, Quiet or hidden book, Granted with no days.
- Cards with the new anatomy: lead tile, reason line, city or occasion line, and two actions of equal weight (Continue and Not now). Places are city level only (Pune, Lisbon), never a venue.
- The tab's doors: a quiet "Choose pictures" row in the states where it belongs, the limited-library row beside it in Limited (different labels, each with a one-line purpose), and the ask card with Show days and Not now at equal size.
- The host sheet: one sheet, two bodies. Tap a day card's lead tile or Continue to open it with our day tiles; tap "Choose other pictures" to swap to a neutral, labelled placeholder frame where the system's own picker would be. The placeholder does NOT imitate that picker. Its prototype-only buttons pretend the parent chose pictures there (two, one more, one from iCloud), put them back, or make the picker fail.
- The tray and the one Start: still thumbnails (abstract paper tones), one calm limit line with no digit, Start disabled until something is chosen, swipe-down and scrim tap off while anything is chosen, Not now always on screen.
- The tab to sheet expand: one empty paper surface grows from the tapped lead tile (a clip that animates from the tile's frame to the full sheet, radius 8 to 28), the lead tile is carried to its place, the rest fades in from 60 percent of the way. The curve is the `standard` spring sampled from the token stiffness and damping with overshoot clamped, so there is no bounce.
- Start to capture: capture sits beneath the sheet, the sheet leaves in 160 ms, and the chosen tray tiles fly into capture's picture slots in 320 ms. The Reduce Motion form is a 200 ms cross-fade with no flight.
- Not now on the sheet: the paper returns to the card's lead tile in 280 ms with the lead tile carried back; nothing is announced.
- Not now on a card: fade 160 ms, the gap closes, Undo stays. No confetti, no counts.
- Unhappy paths from the panel: the phone goes inactive (a paper cover goes over the sheet as a hard cut, picks held), comes back, and App lock engages (the sheet closes, picks dropped). In the placeholder: an iCloud pick (a flat paper box in the tray, no spinner, fills in after a few seconds) and "The picker fails" (a calm line, Try again, and a row to tell Asha without a picture).
- Switches: Sheet layout A (system bars hidden) or B (system top bar kept; the placeholder labels where that bar would sit); Door when never asked (shown below the ask card, or hidden until answered); Primer wording A, B or C from the CMO review; text sizes Default, Large, AX1 and AX5 (AX1 and above switch the sheet to one column and move Not now to its own row); Reduce Motion (also read from the phone's setting), Reduce Transparency, dark theme.

## What is real

- Colours (light and dark), radii, spacing, type sizes and line heights, elevation, and every duration and curve are copied from `packages/design-tokens/src/tokens.ts`. The two springs are sampled from the token stiffness and damping into a CSS `linear()` easing, cut within 0.6 percent of rest so `standard` ends at about 392 ms.
- Behaviour: every state change above, the For you and Recent switch, Another question, set aside with Undo, the primer and the simulated system alert, capture with Talk and Write, and Keep.
- Contrast is the token pairs. Targets are at least 44 pt (56 pt for Start and the ask buttons).

## What is placeholder

- Every picture is an abstract paper-tone tile. No photograph, no face, no scene. The family is the fictional Asha, and the dates carry no year.
- The system's picker is a labelled frame, not a drawing of it. Nothing inside Apple's view can be styled by us; see the spec's section 11.
- Fonts: Literata and Mukta are not bundled, so Georgia and the system sans stand in.
- The system permission alert is simulated and labelled; its button words are the phone's, not ours.
- All words are placeholders for `content` and the privacy chief. The three primer sentences are the CMO's drafts.
- `carryMs` 320 is a PROPOSED token (not in `tokens.ts` yet). The O-27 ruling on the tray flight is the founder's.
- Home, Book and Me are stubs. Nothing is stored or sent. Reload resets everything.

## Known differences from the spec and the ruling

- After Keep the prototype returns to the Moments tab so the source card's "A letter is here" mark can be seen. The current ruling lands on the Book (A4-R20); return-to-tab is open (O-19).
- The web clip animates `clip-path` where the app animates the growing surface's frame and radius with the content laid out once at final size.
- Apple's view is never faded, scaled or moved in the spec; the prototype only models that with a paper cover that fades while the placeholder stays still.
- The sampled spring cut is a prototype convenience: it can leave about 5 pt of final movement on a full-screen travel.

## Not verified

Frame budgets on an iPhone SE 3, VoiceOver on a phone, the real system alert wording, Safari's `linear()` easing, and everything Apple's picker does. The page was run in headless Chrome and the console had no errors; screenshots of the tab states, the sheet at Default and AX5, the placeholder body and the capture hand-off were reviewed by eye.
