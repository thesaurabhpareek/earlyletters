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
    'Removing a language frees space. Recordings and letters stay. New recordings wait for their words until you add the language again.',
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
  /**
   * Why speech is not on this phone yet, by pack engine code, for Review and the letter page while words wait
   * (lib/transcription-queue `useSpeechDownload().failure`). The app tries again by itself, Wi-Fi only (F05-U29),
   * so a line never asks for a tap that cannot help; where a tap can help it says so.
   */
  downloadFailures: {
    no_manifest: 'Not ready yet. It tries again by itself.',
    not_in_manifest: 'Not ready yet. It tries again by itself.',
    downloads_paused: 'Downloads are paused for now. It tries again by itself.',
    offline: 'It carries on when you are back online.',
    download_failed: 'The download stopped. It tries again by itself, or tap Try again.',
    storage_error: 'The download could not be saved. It tries again by itself, or tap Try again.',
    hash_mismatch: 'The download did not check out. It tries again on Wi-Fi, or tap Try again.',
    needs_app_update: 'Needs the latest version of the app.',
    // After several automatic tries on a link that kept stopping (download-retry.ts MAX_STOPPED_RUNS): it waits for a tap.
    download_stopped: 'The download stopped. Tap Try again when the Wi-Fi is steady.',
  } as Record<string, string>,
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
  downloadButton: 'Download on Wi-Fi',
  laterButton: 'Not now',
  lowSpace: 'This phone needs {size} of free space first.',
  chosenYes: 'Getting ready. It waits for Wi-Fi.',
  chosenLater: 'Your voice is kept either way.',
};
