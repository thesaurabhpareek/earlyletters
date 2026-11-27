// The Moments tab (docs/product/prd/28-moments-tab.md, PROPOSED, behind a flag, off). PR 12a: the plain strings
// the spec settles now. Rules: VOICE.md, BRAND.md, WRITING-GUIDE.md. The tab name is a navigation label only, never
// a word in the store or on the website until counsel clears it (spec section 16). Placeholders: {child}, {app},
// {year}, {place}, {holiday}. The app names no scene, person, mood or count on any card (5.3).
// PR 12b (BL-1548, BL-2137): the ask card, the primer, the access-state lines and Open Settings, and the door and
// host-sheet words (BL-1548 lists the door words; BL-2134 lists them too and waits on O-54, so they follow its
// limits: one key family, a verb, no digit or count word, a heading that is not the tab name, no limit line).
// Not here, on purpose: the value lines (O-48), the set-aside word on the card face (O-59), the Me row, the
// empty-Recent action, and the notification and email lines (BL-2120).
// Mode scope (R300, R278): only the primer may say what is read, because it shows only where the library read is on
// (F2). The door, the host sheet, the ask card and the state lines say nothing about what the app reads or sees.
// The primer's body, the one line that would say it, is HELD (CPrivO-59) and is not in this file, so today no
// Moments string says what the app reads.
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
    // PROPOSED, words from council ruling CDesO-18 (BL-1557, batch 6), replacing 'From a month day for {child}'.
    // Batch 6 keeps words a parent reads PROPOSED until a store build.
    monthDay: 'The day of the month {child} was born',
    // TODO(founder): PROPOSED, needs word approval
    kept: 'A day you kept close',
    // PROPOSED, words from council ruling CDesO-18 (BL-1557, batch 6), replacing 'Pictures you hearted'. US spelling.
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
  // The ask card on the tab (ACC-0, and the re-ask row after Not now, ACC-1). It makes no claim about what is read;
  // the primer does that. Both buttons equal in size and weight (EXH-DES-9). Starting text: COPY-DRAFTS section 2.
  // It is not itself the agreement (the primer is), so its lines are short:
  // Shown: title, accept and notNow, nothing else (no body line, so nothing here can over-claim).
  // Records: nothing. Show days opens the primer; Not now writes the phone-held "primer answered" flag (L2).
  // Never: no system alert from this card, no count, no "recommended".
  // Decline: Not now closes the card with the same calm move as a yes; the door row becomes the first row (R270).
  ask: {
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    title: 'Show days from your pictures?',
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    accept: 'Show days',
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    notNow: 'Not now',
  },
  // The primer: the sheet over the tab after the parent taps Show days, before Apple's alert (R72, R192, PRIV-R21).
  // Its body is to name the date, the time and the place, and say when and where the read happens (R192); that line
  // is held, below. It never says
  // allow, access, settings, never, only you, safe, private or stays on your phone (spec 16.1). Continue and Not now
  // are equal in size, outline and weight. The four agreement lines below start from COPY-DRAFTS section 5 and apply
  // to the sheet as a whole; each key repeats them for its own part, and test/moments-tab-copy.test.ts fails a primer
  // key without all four.
  // HELD (CPrivO-59): `body`, the sentence that names the date, the time and the place and says when and where they
  // are read (R192), is not here. "While this tab is open" is not yet a code fact (no library module is in the build)
  // and "on this phone" beside "place" needs evidence (CR-196, counsel's Q8(b), H-11). It comes back, read again from
  // the held words, once the library module lands with a test that the read starts and stops with the tab, the source
  // of place names is known, and counsel has read it (CR-196, CPrivO-29 gate 1). The sheet cannot ship without it.
  // Records for the sheet: the "primer answered" flag (phone settings, L2) and Apple's answer, which the phone holds;
  // no server consent row (R166: the library consent record is on the phone only; `privacy` and
  // `compliance-engineer` to confirm against PRIV-R21, COPY-DRAFTS Q7).
  primer: {
    // Shown: this title, the sheet's name; VoiceOver reads it first (then the body, once the held body is back).
    // Records: nothing of its own; the sheet records as above.
    // Never: no count, no "we", no tab name inside a sentence.
    // Decline: Not now under it closes the sheet; the tab still works fully.
    // Exec reading CPrivO-59 (BL-1548, BL-2137): approved with a change, was "Show days from your pictures?", the
    // ask card's own question; the sheet's Continue and Not now answer a statement. Behind the off Moments flag.
    title: 'Days from your pictures',
    // Shown: Continue; Apple's alert comes next and nothing of ours sits beside it.
    // Records: the "primer answered" flag (L2), then Apple's answer, both on the phone.
    // Never: no text of ours beside or over Apple's alert; no event says what Apple's answer was (spec 18).
    // Decline: Apple's alert has its own No; after it the tab works fully, with the door row first (R79, R270).
    // Exec reading CPrivO-59 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    continue: 'Continue',
    // Shown: Not now, the same word as the ask card and the door sheet, equal in weight to Continue.
    // Records: the "primer answered" flag (L2), on the phone; no system alert is shown.
    // Never: no second ask from us; no "we ask once" or "never ask again" (R192).
    // Decline: this is the decline. The tab works fully (real cards, the door row first, export and delete
    // untouched, R79); the ask row is the parent's own way back (ACC-1).
    // Exec reading CPrivO-59 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    notNow: 'Not now',
  },
  // The access-state lines (ACC-3 to ACC-5). One calm line each, no count, no apology, never a blank tab (R76, R287).
  // "Settings" appears in Moments only in the denied and restricted lines and Open Settings (R187); the Me row is
  // BL-2120's. Not agreements, so no agreement lines. Starting text: COPY-DRAFTS section 6, reworded where it said
  // "suggestions" (R52 bans the word in Moments).
  // COUNSEL (KM2): every line here is a counsel flag. None says the app sees only the chosen pictures, or what it can
  // or cannot see in any mode (R278, R300).
  state: {
    // Limited (ACC-3), a main case: the calm line, then the door "Choose pictures" (R287). It says what to do, not
    // what the app can see (KM2).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    limited: 'Choose pictures to start from.',
    // Denied (ACC-4): the door row first, then this line and Open Settings, on the tab and in Me only (R76, R270).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    denied: 'Days from your pictures are off.',
    // Restricted (ACC-5): one plain line, no button, no reason named (R76).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    restricted: 'Days from your pictures are turned off by a phone setting.',
    // The button under the denied line. It opens the system Settings page for the app.
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    openSettings: 'Open Settings',
  },
  // The door and its host sheet, one key family (R270): the quiet row that opens Apple's picker in every access state
  // and the parts of the sheet that are ours (R269). The first door is one picture, so there is no limit line and no
  // count (BL-2134, R294). No claim: Apple's own panel says what the picker shares, and nothing of ours sits beside it
  // (R279). Not an agreement (no permission, no alert): Shown is these words; Records nothing until Start; Never a
  // system alert, the primer or the ask card from here (R279); Decline is Not now, which drops the pick with no dialog.
  door: {
    // The row on the tab, the day sheet's row and capture Add read the same words (R270). Starting text: COPY-DRAFTS 3.
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    label: 'Choose pictures',
    // The sheet heading when no day is set: a content key, not the tab name (R269). It says what choosing does (R295).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved with a change, was "Choose pictures to start a letter". The
    // first door takes one picture (CDesO-38); back to the plural in the PR that ships more. Behind the off flag.
    heading: 'Choose a picture to start a letter',
    // The sheet's confirm. Never Keep: Keep is the Plus gate action on the letter (R294).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    start: 'Start',
    // Closes the sheet and drops the pick, with no confirmation (R294).
    // Exec reading CDesO-56 (BL-1548, BL-2137): approved as written. Behind the off Moments flag.
    notNow: 'Not now',
  },
} as const;
