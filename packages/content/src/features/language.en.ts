// Moved from apps/mobile/src/components/language/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Strings for the spoken-language setting and picker. The content agent
 * moves these into packages/content (rules: no em or en dashes, curly
 * quotes, ellipsis characters or emoji; no fear, guilt or loss language;
 * never imply AI writes anything; never gender the child).
 *
 * Language names are not here: each language is shown in its own name
 * (packages/core LANGUAGES, Unicode CLDR), with the English name under it.
 */
export const languageCopy = {
  title: 'Spoken language',
  primaryTitle: 'Your language',
  primaryFooter: 'Letters you say are written in this language, in its own script and punctuation. Letters you already saved stay as they are.',
  othersTitle: 'Also spoken',
  othersFooter: 'Add up to two more languages you speak at home.',
  addLanguage: 'Add a language',
  addLanguageFull: 'Three languages chosen',
  change: 'Change',
  removeA11y: 'Remove {name}',
  remove: 'Remove',

  scriptTitle: 'Characters',
  scriptFooter: 'Characters that are written differently in the two scripts are shown the way you choose. A character that could be written two ways is left as it was heard.',
  regionTitle: 'Spelling',
  regionFooter: 'Words are kept as they are spelled where you are. Nothing is respelled between Brazil and Portugal.',

  keyboardTitle: 'Typing',
  keyboardNote:
    'When you type, your keyboard corrects spelling in the keyboard language you choose. To type in another language, add its keyboard in the Settings app under General, Keyboard, Keyboards. What you type is kept exactly as you typed it.',

  status: {
    bundled: 'Built in',
    installed: 'On this phone, {size}',
    downloading: 'Downloading, {percent}%',
    absent: 'Downloads when chosen, {size}',
    absentNoSize: 'Downloads when chosen',
    waitingForWifi: 'Waiting for Wi-Fi, {size}',
    offline: 'Downloads when you are back online',
    noSpace: 'Needs {size} of free space',
    needsUpdate: 'Needs the latest version of the app',
    paused: 'Downloads are paused for now',
    retry: 'Did not finish. Tap to try again.',
    downloadNow: 'Download now on mobile data',
  },
  safeModeNote: 'Until it arrives, letters in {name} keep your words exactly as heard, with only punctuation tidied.',

  picker: {
    title: 'Choose a language',
    close: 'Close',
    searchLabel: 'Search languages',
    searchPlaceholder: 'Language',
    none: 'No language matches that. These are the languages letters can be spoken in for now.',
    chosenA11y: 'Already chosen',
    selectedA11y: 'Selected',
    rowHint: 'Chooses this language',
  },
} as const;
