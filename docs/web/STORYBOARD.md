# earlyletters.com: storyboard v0 (the scroll film)

Owner: coordinator. Status: v0, 2026-10-03. Copy lives in `apps/web/src/content/site.ts`; this file says what we see and how scenes hand off. The content team's decks (docs/web/copy/) may change words, not structure, unless the coordinator merges a structural change.

## The idea
One evening, one letter, many years. A parent sits in a quiet house at 9:41 pm and talks to Meera for a minute. We watch the voice become words, kept exactly as said, filed into Month 9, and opened years from now in the same voice. Then the practical truths (languages, privacy, price) and one action.

Creative platform (CREATIVE.md): **Said once. Heard for years.** Territory A (Exactly as you said it) is the proof; B (small days) is the tone.

## Film rules (every scene)
1. **Native scroll drives everything.** No scroll-jacking, no wheel hijack, no autoplaying sound. Each scene is a pinned stage (`<Scene>`), progress 0..1.
2. **One camera idea per scene, and every scene hands off.** The last frame of scene N equals the first frame of scene N+1 (see Handoffs). The visitor should never see a "section break".
3. **Text is never over busy motion.** Headline in, hold, out. Motion happens before or after the words, or far from them.
4. **Words per frame:** headline 6 or fewer; support 20 or fewer. Headlines in Literata 500, support in Mukta.
5. **Materials only:** typography, paper, light and time of day, single-weight line drawings, the real app UI inside a generic phone frame. No children, no faces, no stock, no AI-generated imagery (PHOTOGRAPHY.md rule 5). Objects may imply people (a lamp, a window, small shoes by a door).
6. **Colour arc:** night (S01 to S03) to paper (S04 to S06) to warm dusk (S07) to night (S08 to S11). Tones come from CSS variables in `globals.css`.
7. **Reduced motion:** every scene has a designed resting state that reads well without movement; transitions become 200 ms fades.
8. **Phone first.** Design at 390 x 844 first, then 1440 x 900. Pinned lengths may be shorter on phones.
9. **Performance:** animate transform and opacity (and SVG pathLength). No layout animation, no animated blur, no per-frame React state.

## Scenes

| # | id | Tone | Length (vh) | What we see | Motion idea | Owner |
|---|---|---|---|---|---|---|
| S01 | `evening` | night | 3 | First frame: the wordmark and "The baby memory book you fill by talking." on deep night. Scroll: the lockup recedes; a window line drawing with a moon draws itself; "9:41 pm" and "Meera is asleep." A lamp switches on; warm light pools in the lower part of the frame. | Lockup out, drawing on, lamp light blooms (radial light layer, opacity and scale only). | SC1 |
| S02 | `a-minute` | night | 2.5 | In the lamp light, a phone lies dark at centre. It wakes to the Tonight screen: "Good evening", the prompt "What made Meera laugh today?", Speak and Type. "A minute is plenty." | Screen wake (brightness ramp), subtle 3D tilt to face the viewer, prompt card enters, Speak is pressed at the end. | SC1 |
| S03 | `just-talk` | night | 3.5 | Listening screen: the breathing glow; the letter's words arrive line by line as if spoken. "Just talk." At the end the phone screen grows until the page fills the viewport and turns to paper. | Glow driven by a synthetic voice-level curve; words arrive by scroll; scale-to-fullscreen handoff from night to paper. | SC2 |
| S04 | `exactly` | paper | 3 | The letter on paper at reading size. One phrase has a quiet dotted underline ("light snitch"); it resolves to "light switch". Nothing else moves. "Exactly as you said it." | The single fix is the whole drama: underline, tiny cross-fade of one word, a soft accentSoft wash that fades. | SC3 |
| S05 | `your-voice` | paper | 2 | A small play pill appears on the letter: "From Papa, 1:12". "Your voice stays with it." The letter becomes a card. | Player pill slides up, playback bar fills with scroll (no waveform, no word highlight). Letter scales down into a card. | SC3 |
| S06 | `the-book` | paper | 3 | The card settles into "Month 9" in Meera's Book among Month 7 and 8. "A book that grows by month." Months keep arriving (10, 11, 12) as scroll becomes time. | Card to chapter settle (MOTION.md 5e on the web), then chapter covers stack and slide; numerals advance; the light warms toward dusk. | SC4 |
| S07 | `years-later` | dusk | 3 | "Years from now". A reading lamp, a small pair of shoes by a bed (line drawings). The phone shows the same letter, "From Papa, Month 9", playing. "Said once. Heard for years." Optional "Hear this letter" (hidden until a released recording exists). | Dusk light, lamp drawing on, phone rises, playback moves. Calm, slow. | SC5 |
| S08 | `languages` | night | 2.5 | "Today you found the light switch." in English, then the same sentence in Hindi, Spanish, Mandarin, French, Arabic (right to left) and Portuguese. "Say it in your language." | Large type cross-fades and slides per language; each script set in an appropriate font; Arabic enters from the right. | SC5 |
| S09 | `private` | night | 2 | An envelope line drawing closes. "Private by default." Five plain promises arrive one at a time. | Envelope flap draws closed; promises enter with 30 ms stagger. | SC6 |
| S10 | `pricing` | night | 1.5 | "Free to write, read and keep." One sentence about Plus. | Minimal: one fade-up. A breath before the end card. | SC6 |
| S11 | `start` | night | 1.5 | End card: "Tell Meera about today." The one action: email capture before launch, the official App Store badge after. Footer below. | Lamp light returns softly behind the card. | SC6 |

The persistent action (header on desktop, bottom pill on phones) is owned by SC6 and is always reachable: before launch it jumps to `#start` and focuses the email field; after launch it opens the App Store.

## Handoffs (the last frame of one scene is the first frame of the next)

| From to | Shared frame (match exactly) |
|---|---|
| S01 to S02 | Night background; lamp light pool centred low (light layer at 100%); centre of frame empty where the phone will be. |
| S02 to S03 | Phone centred, width `min(300px, 64vw)`, upright, Tonight screen with Speak pressed. S03 opens on the same frame and swaps the screen to Listening. |
| S03 to S04 | The full viewport is paper (`--paper`) with the letter set in Literata at reading size (centred column, max 34em). |
| S04 to S05 | Same paper and letter, slip already fixed. |
| S05 to S06 | A letter card (radius 20, `--surface-raised`) centred at about 60% scale on paper. |
| S06 to S07 | Background has warmed to `--dusk`; the book has slid away; centre empty. |
| S07 to S08 | Night; centre empty; the English sentence may begin as the phone recedes. |
| S08 to S09 | Night; empty. |
| S09 to S10 to S11 | Night; centred column of text. |

Where two owners share a handoff, they read each other's scene file (read-only) and match the frame; mismatches are reported, not fixed in someone else's file.

## Sample letter
In `site.ts` (`sampleLetter`). From Papa to Meera, Month 9. The slip "light snitch" is the only machine fix shown.

## Open items
- Tap-to-hear needs a recorded letter with a voice release (founder or cast parent). Until then the control is hidden.
- The seven translated sentences need native-speaker checks before launch (BR1 does a first verification pass).
