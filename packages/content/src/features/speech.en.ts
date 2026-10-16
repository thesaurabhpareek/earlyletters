// Moved from apps/mobile/src/lib/models/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Settings strings for speech on this phone (feature-local copy; the content
 * agent moves them to packages/content). Content rules apply:
 * packages/content/test/rules.test.ts scans this file. Placeholders: {name}
 * a language name, {n} a number.
 */
export const speechSettingsCopy = {
  title: 'Writing down your words',
  footer:
    'Removing a language frees space. Recordings and letters stay, and new recordings wait for their words until it is added again.',
  // The language row's trailing action when the model is not on this phone (S42).
  downloadButton: 'Download',
  ready: 'On this phone, {n} MB',
  downloading: 'Getting ready, {n}%',
  waitingForWifi: 'Waits for Wi-Fi, {n} MB',
  noSpace: 'Needs more free space, {n} MB',
  absent: 'Not on this phone, {n} MB',
  removeHint: 'Removes this language from the phone to free space',
  downloadHint: 'Gets this language ready now',
  confirmTitle: 'Remove {name}?',
  confirmBody: 'Your recordings and letters stay. New {name} recordings will wait for their words until you add it again.',
  confirmButton: 'Remove',
  cancelButton: 'Keep it',
};

/**
 * The ask for the one-time speech download (D-087, Q-015 3.3). Shown at the end of first run and, if the
 * person said "Not now", in Review when words are waiting. Placeholder: {size} comes from this phone's
 * model plan (never a typed number). Nothing downloads until the person taps.
 */
export const speechConsentCopy = {
  title: 'Get your words ready',
  // Says where the words are written down, never that letters stay on the phone (they sync, D-100).
  body: 'Spoken letters are written down on this phone. One download of {size}, on Wi-Fi.',
  note: 'It waits for Wi-Fi, and carries on where it left off if it is interrupted.', // retired by EXPERIENCE_PASS_2026-10; delete in P7
  downloadButton: 'Download on Wi-Fi',
  laterButton: 'Not now',
  footnote: 'You can do this later in Settings, Recordings. Your voice is always kept.', // retired by EXPERIENCE_PASS_2026-10; delete in P7
  lowSpace: 'This phone needs {size} of free space first.',
  chosenYes: 'Getting ready. It waits for Wi-Fi.',
  chosenLater: 'Your voice is kept either way.',
};
