# Proposed promise screen words for BL-424 (held for the founder: what users are promised, CR-73)

Status: proposed. Not applied. The PR for BL-424 changes only the button label ("That sounds right" becomes "Continue", which the row words exactly). Nothing below is in `packages/content` strings.

## Current screen (`onboarding.promise`)
- Title: "It stays in your words."
- First paragraph (`body2`): "Every change is marked, and your original recording is kept unchanged. We never rewrite your words, shorten them or write for you."
- Line 2 (`recordingBody`): "The recording is kept on this phone, so one day {child} can hear you say it."
- Line 3 (`privateNote`): "Private by default. You choose what goes in the book."

## Proposed (not applied)
1. First paragraph trimmed to one sentence. Option A keeps the sanctioned sentence and drops the second: "Every change is marked, and your original recording is kept unchanged." Option B keeps the "never rewrite" claim instead. The title plus option A is the sentence the founder sanctioned on 31 Oct 2026, so A is the safer cut. Cost: the "we never rewrite, shorten or write for you" claim leaves this screen; it stays in the Privacy page and store copy. Legal should confirm A drops no required disclosure.
2. Three promises of equal weight: the changes-are-marked promise (from `body2`), the recording line and the private line each become a row or card of the same size, with a short subhead (16 pt) over the privacy one. This is layout for mobile and design-systems, after the wording above is approved. `onboarding.tsx` today sets `body2` in body type and the other two in muted callout, so they are not equal.

## Needs a founder call
- Option A or B for the one-sentence paragraph.
- Whether the privacy line gets a subhead and which words.

## Not done in this PR
Equal weight in the layout. It depends on the wording and needs a look on a device, which I did not run.
