// Photo with a letter (NS-01, behind EXPO_PUBLIC_PHOTOS). Slots as docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md
// section 9 names them. Rules: VOICE.md and BRAND.md. A picture sits beside the parent's words; the app writes no
// caption, title or description of it. "photo" and "picture" are fine; "memory", "moment" and "album" are not.
// Placeholders: {child}. For `content` and counsel to read: the lines about where a picture is kept are
// deliberately absent (they wait for the counsel-cleared label, NX-39-R1).
export const photosCopy = {
  capture: {
    // Home: the quiet start in the capture cluster. 22 characters or fewer.
    // TODO(founder): PROPOSED, needs word approval
    startButton: 'Start from a photo',
    // TODO(founder): PROPOSED, needs word approval
    change: 'Change',
    // TODO(founder): PROPOSED, needs word approval
    openFailed: 'That photo could not be opened. Choose another.',
  },
  book: {
    photos: {
      // The fixed VoiceOver label of a picture when the parent typed no words about it (NS-01-R9). Never machine text.
      // TODO(founder): PROPOSED, needs word approval
      a11yCard: 'Photo with this letter',
    },
  },
  a11y: {
    // The hint on Home's photo start.
    // TODO(founder): PROPOSED, needs word approval
    startHint: 'Opens your photos so you can pick one and then tell {child} about it.',
  },
} as const;
