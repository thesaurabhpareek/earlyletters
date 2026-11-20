## Review B at 2d3994e7b907d0472ac5d28e4f8897d7345375c9: CHANGES
<!-- agent:design-systems -->

Lens B (design systems and accessibility): VoiceOver labels, traits, order and announcements; Dynamic Type to AX5; 44 pt targets; Reduce Motion; dark mode and contrast through tokens; Voice Control names; every word a content key; the picture never leading a person's words.
PR #839, photo slice 4c (BL-931, NS-01). Head 2d3994e7 confirmed from the API, pushed 12:28 UTC. Base feat/mobile-photo-4-capture at 0f253840.
Diff reviewed: `git diff 0f253840...2d3994e7` (17 files, +525 -8).
Head movement (caption-ceiling round): my first pass was at 279ba898. Since then 2028baaa merges 4b (a combined diff that only joins the photos-capture.test.ts header and imports), and 2d3994e7 is this slice's own change: the words and place fields on the letter page lose `maxLength` (letter-photo.tsx:105-107) and photos-capture.test.ts gains a grapheme test. I read that commit in full; it touches nothing my findings rest on except note N7, rewritten below. Both must-fixes are still present at this head.

### What I read
- The PR body, and the whole diff: app/letter/[id].tsx, app/review.tsx, components/photos/{letter-photo,review-photo}.tsx, lib/photos/{attach,device,hooks}.ts, lib/capture/erase.ts, lib/store.ts, features/photos.en.ts and the six test files.
- Around the new parts at the head: Review's scroll body (review.tsx:940-1080), the letter page body (letter/[id].tsx:380-470), lib/photos/{adopt,failures}.ts, components/ui/{toast,text-field,button}.tsx, lib/a11y.ts, lib/auth/ui.tsx:143 (ErrorLine).
- CLAUDE.md content rules; packages/content VOICE.md (line 124 on saying what happened) and BRAND.md (glossary, internal terms).
- Locked cards at 450bcb4a: 01-photo-with-a-letter.md (sections 4, 5, 8, 10, 15, 16; rows R5a, R7, R8, R9a to R9c, R17a, R20a to R20e, R21a to R21c, R25, R38a to R38c, R50, R54, R56, R58) and 11-foundations.md (NS-33 section 4 happy path, section 6, rows R4, R9, R15; NS-34 hand-off budgets). Pre-lock ids read through 17-engineering-project-plan.md section 1.1.
- Design spec 01 sections 4, 6, 7, 8, 9; COMPONENTS.md 0.1 and the Toast row.
- Read-only context: the product thread's drafts on docs/e2e-ux-20nov at 38a614ac (A-capture/DESIGN.md A-J03 step 5 and the A-S07 VoiceOver order; A-capture/WORDS.md section 7.5). Not relied on as requirements.

### What I ran
In scratch worktrees: at f811c9a6 (first pass) apps/mobile photos-surfaces, photos-capture, navigation-one-entry and start-capture gave 68 of 69 (the one failure is the time limit of #838's AST scan, see #838 note N9); at the #840 head 9a57d613, which contains this slice at 2d3994e7, the same four files with `--testTimeout=30000` give 72 of 72, including the new grapheme test. packages/content photos-copy and rules: 140 of 140 at both. No device run.

### Findings

Must fix:

1. On Review the picture leads the parent's words.
   - review.tsx:972 renders `ReviewPhoto` right under the title (review.tsx:968) and before the letter sheet (review.tsx:1027).
   - With a picture, the picture (full width at its own shape, letter-photo.tsx:101: about 335 x 251 pt for 4:3 and 335 x 447 pt for a portrait on an SE 3, at every text size), the parent's photo words and three quiet buttons sit between the heading and the letter. Without one, "Add a photo to this letter" sits there on every Review while the switch is on.
   - So the words a parent opens Review to check start below the fold for a portrait picture even at the default size; VoiceOver hears the picture and the photo controls before the letter (NS-33 section 4: "Review opens; focus lands on its title; they undo one small fix; Keep"); and because the picture is stored after Review opens (review-photo.tsx:15-17), it lands above the words while the parent is reading them and the sheet's layout animation pushes the letter down.
   - Spec 01 section 4: Review's photo section goes "after the words and small-fix marks, before the chips and Keep ... Words above never move." NS-01 does not ask for the picture first.
   - Fix: move `ReviewPhoto` after the letter sheet and its view and small-fix controls, before Let it go and Keep, and pin the source order in a test as `[NS-01-R3]` does for Listen.

2. On Review the not-stored line says the words are kept before Keep, and nobody hears it.
   - `ReviewPhoto` stores the pending picture for the draft (review-photo.tsx:16); a failed store marks the draft id (adopt.ts, `markPhotoNotSaved`), and `LetterPhoto` then shows `book.letter.notSaved` (letter-photo.tsx:84): "The photo did not come along with this letter. Your words are kept, and you can add it again."
   - On Review nothing is kept yet; the parent can still Let it go. "Kept" is the product's Keep promise word, and VOICE.md (line 124) asks copy to say what happened and only claim what is true.
   - The line appears after Review is on screen, as plain Text with no announcement or live region, so VoiceOver never says it (NS-33 section 6).
   - Fix: on a draft, a line without "kept" (a new key, PROPOSED for the founder; the product thread's draft has `features.photos.review.notStored`, "That photo did not come along. You can add it again."), announced once. Keep the R58 line for a kept letter's page, where it is true.
   - The two `openFailed` lines (letter-photo.tsx:86, 127) need the same announcement as #838 must-fix 2.

Notes:
- N1. Undo (R38a, R38b, not met, BL-954). A toast with an action never times out (toast.tsx header), while `undoPhotoChange` refuses after 10 s (attach.ts). A VoiceOver user, who often needs more than 10 s to reach Undo, presses a live-looking Undo that does nothing and says nothing. The toast's action path calls `onHide`, not `onDismiss`, so after a refused Undo `settlePhotoChange` never runs and the earlier file waits for the launch sweep. The card holds the flag until BL-954 (G6). Not blocking here; I review BL-954.
- N2. The replace confirm (letter-photo.tsx:55-58) is an iOS Alert with "Keep the first" in the cancel style, which iOS draws bold. The card makes "Keep the first" the safe choice and HIG bolds the safe choice; VoiceOver reads both and both are system targets. I accept it as built; spec 01 section 9 ("two plain buttons of equal weight") is mine to bring in line.
- N3. The words field's helper is assembled in code with its own punctuation: `${photos.text.optional}. ${photos.text.hint}` (letter-photo.tsx:106); NS-01 section 8: "No sentence assembled in code". Use one key for the whole helper. The place field (letter-photo.tsx:107) says nothing about being optional, though it is. For `content`.
- N4. On the letter page the parent's photo words are read twice: as the picture's label (letter-photo.tsx:101, R21c) and again as the visible text under it (letter-photo.tsx:112). Hide the visible copy from VoiceOver while it equals the label, or make picture and words one element. Phone check.
- N5. "Words about this photo" is both the field label (letter-photo.tsx:106) and the button that opens the fields (letter-photo.tsx:118). As a button it names no action (COMPONENTS 0.1: labels name the thing, hints the result). A verb, or a hint such as "Opens your words and the place", is for `content`. After the tap the button leaves and the fields arrive; check where VoiceOver focus lands.
- N6. "Remove" (`missingRemove`, letter-photo.tsx:97) is bare in the rotor; `book.letter.undo` duplicates `copy.common.undoButton`. For `content`.
- N7. Field caps after 2d3994e7. The fields are uncontrolled (`defaultValue`) and now uncapped, while `editPhotoWords` stores at most 140 and 60 characters a person sees (attach.ts). So a parent who types past the cap still sees every character in the field, the helper says "Only what you type is kept", and the extra words are dropped without a word; they only find out when the page is opened again. That is better than cutting a character in half, but a person's words should not go silently. Show and announce one line at the cap (the product thread's draft has `features.photos.text.atLimit`, "That is as much as fits here."), or hold the field at the cap in graphemes. Not blocking while the flag is off; BL-957 owns R54. R50 (writing tools off on these two fields): the card says it never passes silently and the PR body does not name it; BL-962 owns it, say so in the body.
- N8. The quiet buttons in `items-start` (letter-photo.tsx:83, 117) keep their 24 pt side padding, so their words start 24 pt in from the letter's edge; elsewhere quiet text buttons line up with `-ml-4` (Review's header Done, the letter page's view toggle). Visual only.
- N9. "Take the photo off" removes the picture and its controls at once (letter-photo.tsx:124) while VoiceOver focus is on that button. The toast says "Photo taken off. Undo." Check where focus lands; moving it to the next control is calmer.
- N10. Good: the letter page draws the picture after the words and signature (letter/[id].tsx:415) and never for a waiting letter or a quiet mark (R25); another author's letter shows the picture with no controls (R9c); photo words and place are drawn whole, with no line limit; every control is a Button md (48 pt) or a TextField (52 pt); colours come from Text tones and the theme; nothing new moves, so Reduce Motion has nothing to change; the 13 keys and `text.*` are PROPOSED with TODO(founder) and pass rules.test.ts and photos-copy.test.ts.
- N11. Tests: nothing pins an accessibility prop, the not-stored line's words on a draft, or Review's order. Add with must-fix 1 and 2.

### What only a phone can show (SE 3, Asha test install, D13)
- Review with a portrait picture at the default size and at AX5 with Bold Text, before and after the fix: the letter's words on the first screen.
- VoiceOver on Review after the fix: heading, letter, small fixes, picture, photo controls, Let it go, Keep; the not-stored line spoken once.
- The first second of Review: "Add a photo to this letter" replaced by the stored picture; the Listen to Review hand-off within 900 ms and no frame over 16.7 ms while the picture is stored (NS-34 section 3; NS-01 section 8).
- The letter page with VoiceOver: the label then the same words (N4); focus after "Take the photo off" (N9); the Undo toast under VoiceOver past 10 s (N1).
- The replace Alert with VoiceOver and at AX5.
- Dark mode and Increase Contrast: the picture's edge, the muted lines; Smart Invert on the picture.
- Voice Control: "Tap Change photo", "Tap Take the photo off", "Tap Remove", "Tap Undo".

CI at the head: PENDING_CI_LINE

Reviewer: independent of the author (CR-44).
