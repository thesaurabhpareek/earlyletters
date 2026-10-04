// Onboarding story cards (PRD A section 4), the packaged fallback for the server's `story` content
// blocks (D-066; schema in packages/api/src/content.ts, `StoryBlockSchema`). The app shows the
// server's cards when it has a valid signed bundle and these otherwise, so this file must always be
// a complete, shippable set.
//
// Shape matches `StoryBlock` without importing packages/api: id, order, headline (80 or fewer),
// line (200 or fewer), visual (a bundled illustration from STORY_VISUALS). Placeholders allowed by
// the schema: {child}, {app}, {signsAs}; these cards need none, because no child is named yet.
// Never reuse an id for new wording; add a new id instead.
//
// v1.0 truth: co-parent only (D-055), so card 4 speaks of "the people you invite", not grandparents;
// no Hindi-English mixing example until v1.1 (D-059). Card 4 carries the privacy promise (D-061).

export const STORY_VISUALS = ['envelope-fold', 'letter-underline', 'moon', 'two-hands'] as const;
export type StoryVisual = (typeof STORY_VISUALS)[number];

export interface StoryCard {
  type: 'story';
  id: string;
  order: number;
  headline: string;
  line: string;
  visual: StoryVisual;
}

export const onboardingStories: readonly StoryCard[] = [
  {
    type: 'story',
    id: 'story.talk.v1',
    order: 1,
    headline: "Talk for a minute.",
    line: "Tell your child about today. It becomes a letter in their book.",
    visual: 'envelope-fold',
  },
  {
    type: 'story',
    id: 'story.exact.v1',
    order: 2,
    headline: "Exactly as you said it.",
    line: "We fix slips of the tongue. We never rewrite your words.",
    visual: 'letter-underline',
  },
  {
    type: 'story',
    id: 'story.voice.v1',
    order: 3,
    headline: "Read together, in your voice.",
    line: "Years from now, your child can hear how you sounded tonight.",
    visual: 'moon',
  },
  {
    type: 'story',
    id: 'story.private.v1',
    order: 4,
    headline: "Private to your family.",
    line: "Only you and the people you invite can read these letters. We never sell them or use them for ads.",
    visual: 'two-hands',
  },
];
