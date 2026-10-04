// Moved from apps/mobile/src/lib/packs/copy.ts on 3 Oct 2026. Settings, Storage and pack status
// strings. `{app}` is left unfilled here; the app fills it with `withBrandName` (src/lib/copy.ts).
// Placeholders: {n} and {count} are formatted sizes ("12 MB of 574 MB"), {name} a pack's name.
import { languageNames } from './words.en';

export const packsCopy = {
  title: 'Storage',
  intro: 'Language packs and speech models download when you choose a language. You can remove them here to free up space.',
  keepNote: 'Removing a download never touches your letters or recordings. It downloads again when you need it.',
  downloadedTitle: 'Downloaded',
  inProgressTitle: 'Downloading',
  empty: 'Nothing downloaded yet.',
  totalLabel: 'Space used',
  sizeOf: '{n} of {count}',
  kinds: {
    'speech-model': 'Speech model',
    'text-rules': 'Spelling and punctuation',
    prompts: 'Prompts',
  },
  languages: { ...languageNames, mul: 'All languages' } as Record<string, string>,
  phases: {
    queued: 'Waiting to start',
    waiting_for_wifi: 'Waiting for Wi-Fi',
    downloading: 'Downloading',
    verifying: 'Checking the download',
    installing: 'Finishing',
    cancelled: 'Paused',
    failed: 'Not downloaded yet',
  },
  failures: {
    offline: 'Starts when you are back online.',
    no_space: 'Needs more free space on this phone.',
    downloads_paused: 'Downloads are paused for now. Please try again later.',
    needs_app_update: 'Needs the latest version of {app}.',
    hash_mismatch: 'That download did not check out. Please try again.',
    download_failed: 'That download did not finish. Please try again.',
    generic: 'Please try again in a moment.',
  } as Record<string, string>,
  cellularTitle: 'Use mobile data',
  cellularHelp: 'Large downloads wait for Wi-Fi unless this is on. Small language packs always download.',
  removeButton: 'Remove',
  removeA11y: 'Remove {name}',
  stopButton: 'Stop',
  retryButton: 'Try again',
  confirmTitle: 'Remove this download?',
  confirmBody: 'Your letters and recordings stay. It downloads again when you need it.',
  confirmRemoveButton: 'Remove',
  confirmKeepButton: 'Keep',
};
