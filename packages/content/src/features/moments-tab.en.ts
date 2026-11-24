// The Moments tab (docs/product/prd/28-moments-tab.md, PROPOSED, behind a flag, off). PR 12a: the plain strings
// the spec settles now. Rules: VOICE.md, BRAND.md, WRITING-GUIDE.md. The tab name is a navigation label only, never
// a word in the store or on the website until counsel clears it (spec section 16). Placeholders: {child}, {app},
// {year}, {place}, {holiday}. The app names no scene, person, mood or count on any card (5.3).
// PR 12b (BL-1548, BL-2137): the ask card, the primer, the access-state lines and Open Settings, and the door and
// host-sheet words (BL-1548 lists the door words; BL-2134 lists them too and waits on O-54, so they follow its
// limits: one key family, a verb, no digit or count word, a heading that is not the tab name, no limit line).
// Not here, on purpose: the value lines (O-48), the set-aside word on the card face (O-59), the Me row, the
// empty-Recent action, and the notification and email lines (BL-2120).
// Mode scope (R300, R278): only the primer says what is read, because it shows only where the library read is on
// (F2). The door, the host sheet, the ask card and the state lines say nothing about what the app reads or sees.
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
  // The ask card on the tab (ACC-0, and the re-ask row after Not now, ACC-1). It makes no claim about what is read;
  // the primer does that. Both buttons equal in size and weight (EXH-DES-9). Starting text: COPY-DRAFTS section 2.
  // It is not itself the agreement (the primer is), so its lines are short:
  // Shown: title, accept and notNow, nothing else (no body line, so nothing here can over-claim).
  // Records: nothing. Show days opens the primer; Not now writes the phone-held "primer answered" flag (L2).
  // Never: no system alert from this card, no count, no "recommended".
  // Decline: Not now closes the card with the same calm move as a yes; the door row becomes the first row (R270).
  ask: {
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    title: 'Show days from your pictures?',
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    accept: 'Show days',
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    notNow: 'Not now',
  },
  // The primer: the sheet over the tab after the parent taps Show days, before Apple's alert (R72, R192, PRIV-R21).
  // It names the date, the time and the place, and says when and where the read happens (R192). It never says
  // allow, access, settings, never, only you, safe, private or stays on your phone (spec 16.1). Continue and Not now
  // are equal in size, outline and weight. The four agreement lines below start from COPY-DRAFTS section 5 and apply
  // to the sheet as a whole; each key repeats them for its own part, and test/moments-tab-copy.test.ts fails a primer
  // key without all four.
  // COUNSEL: the place read is Q8(b) (H-11); "on this phone" says where the read happens and needs counsel's read;
  // "while this tab is open" is UNVERIFIED as a code fact (`mobile` to confirm) and carries no "only" until it is.
  // Records for the sheet: the "primer answered" flag (phone settings, L2) and Apple's answer, which the phone holds;
  // no server consent row (R166: the library consent record is on the phone only; `privacy` and
  // `compliance-engineer` to confirm against PRIV-R21, COPY-DRAFTS Q7).
  primer: {
    // Shown: this title, the sheet's name; VoiceOver reads it first, then the body in one swipe.
    // Records: nothing of its own; the sheet records as above.
    // Never: no count, no "we", no tab name inside a sentence.
    // Decline: Not now under it closes the sheet; the tab still works fully.
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    title: 'Show days from your pictures?',
    // Shown: this sentence, word for word; the place word stays while the place read is on (R192).
    // Records: nothing of its own; the sheet records as above, and the read starts after Continue and Apple's alert.
    // Never: no picture, identifier, date, coordinate or place leaves the phone or goes into logs, crash reports or
    // analytics (R162), and no line says the app does not look at what is in the pictures (R192).
    // Decline: turning this off later, in Me, does not remove pictures already in letters (R192, R256).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    body: '{app} reads the date, time and place of your pictures on this phone, while this tab is open, to show you days to tell {child} about.',
    // Shown: Continue; Apple's alert comes next and nothing of ours sits beside it.
    // Records: the "primer answered" flag (L2), then Apple's answer, both on the phone.
    // Never: no text of ours beside or over Apple's alert; no event says what Apple's answer was (spec 18).
    // Decline: Apple's alert has its own No; after it the tab works fully, with the door row first (R79, R270).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    continue: 'Continue',
    // Shown: Not now, the same word as the ask card and the door sheet, equal in weight to Continue.
    // Records: the "primer answered" flag (L2), on the phone; no system alert is shown.
    // Never: no second ask from us; no "we ask once" or "never ask again" (R192).
    // Decline: this is the decline. The tab works fully (real cards, the door row first, export and delete
    // untouched, R79); the ask row is the parent's own way back (ACC-1).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
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
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    limited: 'Choose pictures to start from.',
    // Denied (ACC-4): the door row first, then this line and Open Settings, on the tab and in Me only (R76, R270).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    denied: 'Days from your pictures are off.',
    // Restricted (ACC-5): one plain line, no button, no reason named (R76).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    restricted: 'Days from your pictures are turned off by a phone setting.',
    // The button under the denied line. It opens the system Settings page for the app.
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    openSettings: 'Open Settings',
  },
  // The door and its host sheet, one key family (R270): the quiet row that opens Apple's picker in every access state
  // and the parts of the sheet that are ours (R269). The first door is one picture, so there is no limit line and no
  // count (BL-2134, R294). No claim: Apple's own panel says what the picker shares, and nothing of ours sits beside it
  // (R279). Not an agreement (no permission, no alert): Shown is these words; Records nothing until Start; Never a
  // system alert, the primer or the ask card from here (R279); Decline is Not now, which drops the pick with no dialog.
  door: {
    // The row on the tab, the day sheet's row and capture Add read the same words (R270). Starting text: COPY-DRAFTS 3.
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    label: 'Choose pictures',
    // The sheet heading when no day is set: a content key, not the tab name (R269). It says what choosing does (R295).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    heading: 'Choose pictures to start a letter',
    // The sheet's confirm. Never Keep: Keep is the Plus gate action on the letter (R294).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    start: 'Start',
    // Closes the sheet and drops the pick, with no confirmation (R294).
    // PROPOSED (CR-176): words wait for the exec team's read; the keys stay behind the Moments flag, which is off.
    notNow: 'Not now',
  },
} as const;
