// Photo with a letter (NS-01, behind EXPO_PUBLIC_PHOTOS). Slots as docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md
// section 9 names them. Rules: VOICE.md and BRAND.md. A picture sits beside the parent's words; the app writes no
// caption, title or description of it. "photo" and "picture" are fine; "memory", "moment" and "album" are not.
// Placeholders: {child}, {date}. For `content` and counsel to read: the lines about where a picture is kept are
// deliberately absent (they wait for the counsel-cleared label, NX-39-R1).
export const photosCopy = {
  capture: {
    // Home: the quiet start in the capture cluster. 22 characters or fewer.
    startButton: 'Start from a photo',
    // Ready, with a picture chosen. Never describes the picture.
    ready: 'Tap the red circle and tell {child} about this photo.',
    change: 'Change',
    // In the "Let it go" confirm. True because nothing is copied before Keep.
    dropNote: 'The photo goes too.',
    openFailed: 'That photo could not be opened. Choose another.',
    // iCloud-only picture, fetched on demand.
    gettingFromCloud: 'Getting the photo from iCloud.',
    cancel: 'Cancel',
    // Review: a photo alone cannot be kept.
    needsWords: 'Add some words to keep this letter with its photo.',
  },
  text: {
    // The parent's own words about the picture, up to 140 characters. Never filled in by the app.
    label: 'Words about this photo',
    optional: 'Optional',
    hint: 'Up to 140 characters. Only what you type is kept.',
    // A place the parent types for the photo, up to 60 characters. Never filled in, never read from the photo.
    placeLabel: 'Where was this?',
    placeHint: 'Up to 60 characters. Only what you type is kept.',
  },
  book: {
    lens: {
      months: 'Months',
      photos: 'Photos',
    },
    letter: {
      addPhoto: 'Add a photo to this letter',
      replaceTitle: 'Use this photo instead?',
      replaceBody: 'The first photo stays until you choose.',
      replaceConfirm: 'Use this photo',
      replaceKeep: 'Keep the first',
      replaced: 'Photo changed.',
      removePhoto: 'Take the photo off',
      removed: 'Photo taken off.',
      undo: 'Undo',
      missing: 'Not on this phone any more',
      missingRemove: 'Remove',
    },
    photos: {
      // "Photo, from the letter of 12 June 2026". The date is spoken in full.
      a11yTile: 'Photo, from the letter of {date}',
    },
  },
  a11y: {
    // The fixed label when the parent typed no words about the photo. Never machine text.
    photoWithLetter: 'Photo with this letter',
    startHint: 'Opens your photos so you can pick one and then tell {child} about it.',
    // Thumbnail on Ready, before a letter exists: "Photo, 12 June 2026. Change."
    readyThumb: 'Photo, {date}. Change.',
  },
} as const;
