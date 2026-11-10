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
      { title: 'A letter tonight?', body: 'What made you smile today? Say it out loud and keep it.' },
      { title: 'Dear little one,', body: 'Anything to tell your little one today? A line or two is enough.' },
      { title: 'The house is quiet', body: 'A good moment for a few words to your little one.' },
      { title: 'One small thing', body: 'What happened today that you want to remember?' },
      { title: 'Your voice, kept', body: 'Talk for a minute. One day it can be heard, just as you sounded.' },
      { title: 'Before you sleep', body: 'Something your little one did, said or tried. Or just tap Not much today.' },
      { title: 'A page for {weekday}', body: 'Something from today for the book?' },
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
   * The two reassurance lines. Once a sheet in front of the iOS alert; since CDesO-3 (1 Nov 2026) the switch goes
   * straight to the alert and these lines are the Reminders page footer, on screen before the switch is turned on
   * (CCO-10, LEGAL-REQ-007 "an in-app explanation" first; reminders-settings.md 1).
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
    // After returning from Settings with permission granted (S34), and after "Yes, evenings" on the card.
    onToast: 'Reminders are on.',
    // The action on that toast after the card: opens Settings, Reminders.
    changeButton: 'Change',
    // Inline choices (reminders-settings.md 2): iOS settings save on change, so the page says so once.
    savesAsYouGo: 'Changes save as you go.',
    previewTitle: 'How it will look',
    // From the planner's first planned notification; recomputed on every change.
    nextLine: 'Next: {weekday} at {time}.',
    // VoiceOver only, before the Next line, 600 ms after the last change.
    saved: 'Saved.',
    // Reminders on, iOS says no: the intent is kept, nothing is scheduled.
    notSendingYet: 'Not sending yet.',
    // rescheduleReminders could not schedule (it no longer swallows the error).
    scheduleFailed: 'Could not set reminders just now.',
    // The month row while no included book has a birth date yet.
    birthDateNote: 'Starts once a birth date is added.',
    // iOS Provisional or Deliver Quietly: allowed, but not on the lock screen.
    quietDelivery: 'iPhone delivers these quietly, to Notification Center only.',
    // account-security content.md 4.10, verbatim: with App lock on, names are off and the switch is disabled.
    lockNames: 'Names stay hidden while App lock is on.',
    offSummary: 'Off',
    channelName: 'Reminders',
  },
  /** For VoiceOver and chips. Index = Date.getDay(). */
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
} as const;
