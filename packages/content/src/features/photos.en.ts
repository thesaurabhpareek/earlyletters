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
  text: {
    // The parent's own words about the picture, up to 140 characters. Never filled in by the app (NS-01-R21).
    // TODO(founder): PROPOSED, needs word approval
    label: 'Words about this photo',
    // TODO(founder): PROPOSED, needs word approval
    optional: 'Optional',
    // TODO(founder): PROPOSED, needs word approval
    hint: 'Up to 140 characters. Only what you type is kept.',
    // A place the parent types for the photo, up to 60 characters. Never filled in, never read from the photo (NS-01-R21).
    // TODO(founder): PROPOSED, needs word approval
    placeLabel: 'Where was this?',
    // TODO(founder): PROPOSED, needs word approval
    placeHint: 'Up to 60 characters. Only what you type is kept.',
  },
  book: {
    lens: {
      // What VoiceOver reads for the Months / Photos choice (one radio group, NS-33-R3).
      // TODO(founder): PROPOSED, needs word approval
      label: 'Show letters by',
      // TODO(founder): PROPOSED, needs word approval
      months: 'Months',
      // TODO(founder): PROPOSED, needs word approval
      photos: 'Photos',
    },
    letter: {
      // TODO(founder): PROPOSED, needs word approval
      addPhoto: 'Add a photo to this letter',
      // Once one photo is attached (design spec 01 section 4 names the action "Change photo").
      // TODO(founder): PROPOSED, needs word approval
      changePhoto: 'Change photo',
      // Asked before a second photo replaces the first (NS-01-R7): the first stays until the parent chooses.
      replacePhotoAsk: {
        // TODO(founder): PROPOSED, needs word approval
        question: 'Use this photo instead?',
        // TODO(founder): PROPOSED, needs word approval
        body: 'The first photo stays until you choose.',
        // TODO(founder): PROPOSED, needs word approval
        confirm: 'Use this photo',
        // TODO(founder): PROPOSED, needs word approval
        keep: 'Keep the first',
      },
      // The toast after a replace, with Undo for 10 seconds (NS-01-R7).
      // TODO(founder): PROPOSED, needs word approval
      replacePhotoUndo: 'Photo changed.',
      // Taking the photo off, with Undo for 10 seconds (NS-01-R7, R8; design spec 01 sections 4 and 7).
      // TODO(founder): PROPOSED, needs word approval
      removePhoto: 'Take the photo off',
      // TODO(founder): PROPOSED, needs word approval
      removed: 'Photo taken off.',
      // TODO(founder): PROPOSED, needs word approval
      undo: 'Undo',
      // Shown on the letter page when a photo chosen for this letter could not be stored (NS-01-R17). The letter and its
      // words are kept; the line names no cause and asks for nothing. Never describes the picture.
      // TODO(founder): PROPOSED, needs word approval
      notSaved: 'The photo did not come along with this letter. Your words are kept, and you can add it again.',
      // The picture's file is gone (design spec 01 section 6): the letter reads whole.
      // TODO(founder): PROPOSED, needs word approval
      missing: 'Not on this phone any more',
      // TODO(founder): PROPOSED, needs word approval
      missingRemove: 'Remove',
    },
    photos: {
      // The fixed VoiceOver label of a picture when the parent typed no words about it (NS-01-R9). Never machine text.
      // TODO(founder): PROPOSED, needs word approval
      a11yCard: 'Photo with this letter',
    },
  },
  review: {
    // Shown on Review when the photo chosen for this draft could not be stored (NS-01-R17; #839 review B). Nothing is kept
    // yet on Review, so unlike book.letter.notSaved it never says the words are kept. Names no cause, asks for nothing.
    // TODO(founder): PROPOSED, needs word approval
    notStored: 'That photo did not come along. You can add it again.',
  },
  a11y: {
    // The hint on Home's photo start.
    // TODO(founder): PROPOSED, needs word approval
    startHint: 'Opens your photos so you can pick one and then tell {child} about it.',
  },
} as const;
