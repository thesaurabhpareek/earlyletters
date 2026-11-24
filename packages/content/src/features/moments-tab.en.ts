// The Moments tab (docs/product/prd/28-moments-tab.md, PROPOSED, behind a flag, off). PR 12a: the plain strings
// the spec settles now. Rules: VOICE.md, BRAND.md, WRITING-GUIDE.md. The tab name is a navigation label only, never
// a word in the store or on the website until counsel clears it (spec section 16). Placeholders: {child}, {app},
// {year}, {place}, {holiday}. The app names no scene, person, mood or count on any card (5.3).
// Not here, on purpose (PR 12b): the door and host-sheet words, the ask card and primer, the value lines (O-48),
// the set-aside word on the card face (O-59), the Me row, the empty-Recent action and the access-state lines
// (limited, denied, restricted, Open Settings: not spec-verbatim, counsel to read).
export const momentsTabCopy = {
  tab: {
    // The navigation label. The tab-bar test pins en.tabs to three tabs until the tab-shell PR changes it.
    // TODO(founder): PROPOSED, needs word approval
    label: 'Moments',
  },
  heading: {
    // TODO(founder): PROPOSED, needs word approval
    title: 'Moments',
    // The one job line states the act (spec 16: verb "choose").
    // TODO(founder): PROPOSED, needs word approval
    job: 'Choose a day to tell {child} about.',
  },
  card: {
    // TODO(founder): PROPOSED, needs word approval
    continue: 'Continue',
    // The optional row on a card, shown only where a letter exists for that day (5.3).
    // TODO(founder): PROPOSED, needs word approval
    letterHere: 'A letter is here',
    // Muted caption on an illustrated example card. Also its spoken name (NS-53-R160).
    // TODO(founder): PROPOSED, needs word approval
    example: 'An example',
  },
  // The closed reason list (spec 6.4a). A reason not in this list fails the build. A date fact, never an event.
  reason: {
    // TODO(founder): PROPOSED, needs word approval
    marked: 'A day you marked',
    // TODO(founder): PROPOSED, needs word approval
    birthday: "On {child}'s birthday",
    // RULED (BL-1557, council batch 6): replaces the PROPOSED 'From a month day for {child}'. The founder may veto at
    // the first in-app read; that is not a gate.
    monthDay: 'The day of the month {child} was born',
    // TODO(founder): PROPOSED, needs word approval
    kept: 'A day you kept close',
    // RULED (BL-1557, council batch 6): replaces the PROPOSED 'Pictures you hearted'. US spelling (WRITING-GUIDE 6).
    heart: 'Pictures you marked as favorites',
    // TODO(founder): PROPOSED, needs word approval
    video: 'A video from this day',
    // TODO(founder): PROPOSED, needs word approval
    day: 'Pictures from this day',
    // TODO(founder): PROPOSED, needs word approval
    year: 'Pictures from this day in {year}',
    // Only if runs ship.
    // TODO(founder): PROPOSED, needs word approval
    run: 'Pictures from these days',
    // TODO(founder): PROPOSED, needs word approval
    picked: 'Pictures you picked before',
    // A place the offline table named, never a venue.
    // TODO(founder): PROPOSED, needs word approval
    place: 'Pictures from {place}',
    // A public holiday by date.
    // TODO(founder): PROPOSED, needs word approval
    holiday: 'On {holiday}',
    // TODO(founder): PROPOSED, needs word approval
    first: 'A first you marked',
    // TODO(founder): PROPOSED, needs word approval
    letter: 'A letter from this day',
    // TODO(founder): PROPOSED, needs word approval
    question: 'A question to start from',
  },
  // The teaching verbs that carry a day key (spec 7.4). The set-aside "Not now" waits on O-59.
  teach: {
    // TODO(founder): PROPOSED, needs word approval
    name: 'Name this day',
    // TODO(founder): PROPOSED, needs word approval
    keepClose: 'Keep this day close',
    // TODO(founder): PROPOSED, needs word approval
    notThisOne: 'Not this one',
    // TODO(founder): PROPOSED, needs word approval
    hideDay: 'Hide this day',
  },
} as const;
