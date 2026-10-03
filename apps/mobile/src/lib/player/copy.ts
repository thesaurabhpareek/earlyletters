/**
 * Player words not yet in packages/content (TODO(PM): move to
 * strings.en.ts under `player`). VOICE.md rules: no dashes, curly quotes,
 * ellipses or emoji. Visible labels reuse content where it exists:
 * `book.hearShort`, `book.hearLink`, `book.recordingElsewhere`,
 * `readTogether.pauseButton`, `readTogether.replayButton`,
 * `readTogether.autoplayLabel`, `readTogether.recordingElsewhere`.
 */
export const playerCopy = {
  /** VoiceOver, play button: "{hearLink}, {duration}" e.g. "Hear it in Mama's voice, 1 minute 12 seconds". */
  playA11y: '{label}, {duration}',
  pauseA11y: 'Pause {signsAs}',
  scrubLabel: 'Position in the recording',
  /** VoiceOver value of the scrubber: "0:32 of 1:12". */
  positionText: '{elapsed} of {total}',
  notOnPhone: 'The recording for this letter is not on this phone.',
  notOnPhoneReadAloud: 'The recording for this letter is not on this phone. Read this one aloud together.',
  cannotPlay: 'This recording cannot play right now. It is still kept.',
  loading: 'Getting the recording ready',
  /** The switch between the listening copy and the untouched original (founder decision 8). */
  originalLabel: 'Original recording',
  originalOn: 'Playing exactly as it was recorded.',
  originalOff: 'Playing a clearer copy for listening. The original is kept as it was.',
} as const;
