// Moved from apps/mobile/src/lib/reminders/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Reminder words. Written to VOICE.md: no dashes, curly quotes, ellipses or
 * emoji; no streaks, counts of days, "missed" or guilt.
 *
 * Neutral notification copy is used when "Names in notifications" is off
 * (the default, DECISIONS D-025, C-REQ-009): nothing on the lock screen names
 * a child. Variant order matches `copy.notifications.evening`, so a variant id
 * means the same idea with or without names.
 */
export const reminderCopy = {
  neutral: {
    evening: [
      { title: 'A minute to write?', body: 'One thing about today is plenty. A sentence will do.' },
      { title: "Tonight's letter", body: 'What made you smile today? Say it out loud and we will keep it.' },
      { title: 'Dear little one,', body: 'Your words, kept. Today, and long after.' },
      { title: 'The house is quiet', body: 'A good moment for a few words to your little one.' },
      { title: 'One small thing', body: 'What happened today that you want to remember?' },
      { title: 'Your voice, kept', body: 'Talk for a minute. It will be heard one day, just as you said it.' },
      { title: 'Before you sleep', body: 'Something your little one did, said or tried. Or just tap Not much today.' },
      { title: 'A page for {weekday}', body: 'Whatever today held, it belongs in the book.' },
    ],
    // A month, never a "chapter" (BRAND.md glossary): the same words as the named version, without the name.
    monthOpen: { title: 'Month {month} begins', body: 'A new month in the book is open.' },
    birthday: { title: 'A birthday today', body: 'A year of letters. Want to read them together today?' },
    birthdays: { title: 'Birthdays today', body: 'A year of letters. Want to read them together today?' },
  },
  /** Two or more books turn a month on the same day (twins, or siblings born on the same day of the month). */
  together: {
    // Each book's own new month (BRAND.md glossary: month, never chapter); the title is used when the month numbers differ.
    monthTitle: 'A new month begins',
    monthBodyNames: 'A new month is open for {child}.',
    monthBodyNeutral: 'A new month is open in each book.',
  },
  /**
   * The sheet before the iOS permission alert (Apple HIG, Privacy, pre-alert
   * screens: one button, titled Continue, that opens the alert; no way to
   * skip it). Title and body reuse `onboarding.reminder.permissionTitle` and
   * `.permissionBody`; the button reuses `common.continueButton`.
   */
  priming: {
    privacyLine: 'Notifications never show what you write. Names stay off the lock screen unless you turn them on.',
    quietLine: 'Only in the evenings you pick, and never late at night.',
  },
  settings: {
    enabledLabel: 'Reminders',
    howOftenTitle: 'How often',
    eveningsTitle: 'Which evenings',
    timeTitle: 'Time',
    timeLabel: 'Reminder time',
    lateNightClamp: 'Late nights stay quiet.',
    quietHelp: 'Reminders come between 7 AM and 9:30 PM, and stay quiet on a day you have already written.',
    // "Message", never "note", for what the app sends (BRAND.md glossary).
    monthNotesLabel: 'Month and birthday messages',
    monthNotesHelp: 'A short message on the day a new month begins in each book, and on birthdays.',
    namesHelpOff: 'Notifications say "your little one" and show no names on the lock screen.',
    namesHelpOn: 'Notifications can show names on the lock screen.',
    deniedTitle: 'Notifications are off',
    deniedBody: 'Turn them on in Settings to get these reminders.',
    openSettingsButton: 'Open Settings',
    // After returning from Settings with permission granted (S34).
    onToast: 'Reminders are on.',
    offSummary: 'Off',
    pausedSummary: 'Paused', // retired by EXPERIENCE_PASS_2026-10; delete in P7 (a pause from before reads as Off)
    channelName: 'Reminders',
  },
  /** For VoiceOver and chips. Index = Date.getDay(). */
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;
