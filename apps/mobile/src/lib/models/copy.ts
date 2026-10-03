/**
 * Settings strings for speech on this phone (feature-local copy; the content
 * agent moves them to packages/content). Content rules apply:
 * packages/content/test/rules.test.ts scans this file. Placeholders: {name}
 * a language name, {n} a number.
 */
export const speechSettingsCopy = {
  title: 'Writing down your words',
  footer:
    'Your recordings are written down here on this phone. Removing a language frees space. Your recordings and letters stay, and new recordings wait for their words until you add it again.',
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
