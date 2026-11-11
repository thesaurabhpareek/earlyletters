# First run and sign in: the story intro, the account door, and coming back (Build 12)

Owner: design systems. Status: DRAFT spec for `mobile`, `content`, `analytics`, `qa` and the founder, 10 Nov 2026 (UTC). Docs only: nothing here is built, no token or string is changed, and no word is live until the founder approves it and `mobile` wires it in the same PR that moves it. Wireframes: `FIRST-RUN-AND-SIGN-IN-JOURNEY-WIREFRAMES-10nov.html` (same folder).
Signed: Design Systems and Accessibility Lead (Claude role).

Founder request, 10 Nov 2026, in the founder's words: the first launch should show "Instagram like stories where you have value props", "really nicely animated, high-quality design like how we did the website", "an option to skip" and then "an option to login or sign up"; "think about the end to end journey specially first user experience and then how it works next time you come in Face ID and everything works." Already decided, same day: sign-in is required in Build 12 and the sign-up flow must work; co-parent surfaces show "coming soon"; the account comes before the book opens.

Tags. EVIDENCE: read in the repo or at a named PR head this session. UNVERIFIED: not read, not run, not measured. PROPOSED: my number or wording. COUNSEL-READ: a line that promises something about privacy, storage or the future; it needs `legal` or counsel before it ships (COORDINATION section 10).

## 0. The short version

1. The pieces are mostly built. A story deck exists as data (`packages/content/src/stories.en.ts`: `onboardingStories`, four cards, with a remote switch to three or none), a `StoryCard` component and a `useStoryCards()` hook exist (`components/content-blocks/blocks.tsx`, `hooks.ts`), and the line drawings they use exist (`components/ui/line-art.tsx`). No screen mounts them (grep of `apps/mobile/src` found only the component and the hook). PRD A F2 specified the behaviour (6 second auto-advance, tap zones, hold, Skip) and then moved it to v1.1 (PRD A header, D-043). What is missing is the shell: progress bars, gestures, the once-only flag, and one new step in the first-run gate.
2. The account door is built on the #724 to #764 stack: Welcome and sign in with Apple's button and "Sign in with email", an outage and offline screen, the new-phone route. The founder's "Sign up and Log in as two clear paths" cannot be two different flows: email sign-in is deliberately identical for a new and a returning address (`email.ts`: `shouldCreateUser` stays true so the response never reveals whether an address has an account). I give two options in section 2.4 and recommend the cheaper one.
3. Face ID is a different thing from being signed in. Signed in is a session in the Keychain. The app lock is an optional cover that the parent turns on. Today the lock is offered at the end of first run (`onboarding.tsx` mounts `LockOffer` on "The book is open."). The founder decided on 9 Nov that it moves to session 3 (NX-31-R14). That move is not built; #702 only counts sessions and nothing reads the count.
4. The story words must be true of the Build 12 binary. The old deck is not: card 4 says "the people you invite" and "Private to your family", and co-parent is "coming soon". I propose three cards that make only claims the build keeps (section 4), and one optional fourth card that needs counsel.
5. Recommendation (section 7): tier A is the account door, the returning-user path and a correct lock offer. Tier B is the three-card story intro behind a flag. Tier C is richer drawing animation in 1.0.1. Sizes are unmeasured guesses.

## 1. Sources and heads

| Source | Head read |
|---|---|
| `develop` | `526c9b8b3e49bdc6b75e03d061debe641af2f790` |
| #724 welcome and sign in, outage (stack base for the first-run files) | `d4a9983b22fcd121fcf0bd43736d91246a643d11` |
| #738 You tab states | `0cd8e1f176ab6bbd50404a401e8fd0d4dc96db57` |
| #764 S17 tier 0 (`gate.logic.ts`, `use-first-run-route.ts`, `onboarding.tsx`) | `6787af24a525ede3e257d80c6a92162f4a9356de` |
| #755 S17 spec (docs) | `e1a2095043dd2118ae8795cf26b01ba2bc97e739` |
| #770 first-run motion spec (docs) | `3068609229d19b8c32b6635aed776a5be5cef71d` |
| #702 session counter (description only) | `48b0d44e7af8ed5d0ab67a65f3461cc74b2f021f` |
| #768, #769 store and site claims, #752, #757 | #768 `67fd7c3ac7970b05e825feb4ddf93ca59f393e97`, #769 `924ac3a2c10a4ae0f89af2d384be96c5904a68d4`; I read the #768 and #769 descriptions and not the #752 words doc or the #757 test (UNVERIFIED) |
| NX-31 and NX-36 specs (`docs/nx-31-onboarding-8nov`, `docs/nx-36-screen-specs-9nov`) | read from the branch tips |
| Apple App Review Guidelines, 4.8 and 5.1.1(v) | developer.apple.com/app-store/review/guidelines, fetched 10 Nov 2026 (the page states no date) |

Not read: any device, hosted project or build. Every statement about the server is about repo code. I did not run any test (no install is allowed in this task).

## 2. The journey as a state map

### 2.1 Order of steps, first install

```
Launch
  -> Keychain read (session)        cap 10 s (RESTORE_WAIT_MS), the first frame never waits on the network
  -> S1 Before you begin (age)      root gate, asked once per install; No = stop screen for 24 h (age-gate.logic.ts)
  -> STORIES (new, tier B, flag)    3 cards, Skip on screen from frame 1
  -> AUTH ENTRY (step 'signIn')     Create account or sign in: Apple, email   [#724]
  -> consent sheets                 Terms with the 18+ line, sensitive-data (sync) consent   [existing]
  -> child step, signature, speech download   [existing; account has no book]
  -> "The book is open."            lock offer REMOVED from here (section 3.3)
  -> Tonight
```
For an account that already has a book (a new phone), the path after sign-in is S17 (#755, #764): "Opening your book", then Tonight, with no child step.

Why age first, then stories (EVIDENCE for the constraint): the root layout renders no route until the age answer is Yes (`_layout.tsx`: `gate.decision !== 'pass'` shows `AgeGateScreen`; the SessionProvider and every route sit inside it), and a red-team test pins that order (#724 commit `df7033071`). The first-run files in #764 treat the Yes as given. Putting stories before the age question would mean hosting them outside the gate. It is possible, because they collect nothing, but it changes the root layout and a pinned test, and counsel has not said whether content may precede the age question (UNVERIFIED). Default: age first. The cost is one tap before the first story. NX-40 FD-2 (#775) recommends the intro BEFORE the age question; Karma has ruled AFTER, because the age gate stays pinned at the root and moving it needs counsel. NX-40 FD-2 is overruled by Karma on 10 Nov; the ruling is reversible, and if counsel agrees later the intro can be hosted ahead of the gate without changing its content. See open question 2.

### 2.2 State table (names are the repo's `FirstRunStep` where one exists)

| State | Name in code | What the person sees | Leaves when |
|---|---|---|---|
| First launch, session being read | `restoring` (route field) | Blank paper, no spinner, at most 10 s | Session read (a few ms in practice, UNVERIFIED on device) or cap |
| Age not answered | `ageGate` | S1 Before you begin | Yes, or No (`stop`) |
| Stories (new) | `stories` | Card 1 to 3, Skip top right | Skip, Get started on card 3, or a session appears |
| Auth entry | `signIn` | Welcome and sign in (#724) | Apple or email success, outage, offline |
| Sign-in cannot be reached | `outage` | S3, with "Start on this phone" only when `LOCAL_START_FALLBACK` is true (it is, in #764) | Try again, back online, local start |
| Account has a book, phone has none | `openingBook`, `slowBook`, `offlineBook`, `noBookHere` | S17 screens | Book arrives (then `openTonight`) |
| New account | `childStep` | Child step and the rest of first run | Book is open |
| Book on the phone | `openTonight` | Tonight, no screen in front | n/a |
| Locked | (app lock layer, not a route) | Cover, then Unlock | Device confirms |

`stories` is the only new step. In `firstRunGate`, it sits between rule 6 and rule 7: no session, no book, age Yes, not offline or failed, stories not yet seen, flag on. The function stays pure and tested in Node.

### 2.3 Every situation the founder named, plus the ones that bite

| Situation | What happens | Evidence or tag |
|---|---|---|
| First launch, online | Age, stories (if flag on), auth entry | Section 2.1 |
| First launch, offline | Age works offline. Stories work offline: no network, no download, drawings are bundled. After the stories, the auth entry cannot be reached, so the gate shows the offline screen (S3) with Try again and, because `LOCAL_START_FALLBACK` is true, "Start on this phone" | EVIDENCE `gate.logic.ts` rule 6 and 5 (#764). Offline stories are my requirement (PROPOSED) |
| Returning user, cold start, session valid, book on phone | Tonight at once. No stories, no auth screen, no spinner. If the lock is on, the cover shows first | `gate.logic.ts` rule 2 `openTonight`. Session persists: `persistSession: true`, `autoRefreshToken: true` (`supabase/client.ts`), Keychain item `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (`secure-storage.ts`) |
| Session still valid but the access token is old | Refreshed in the background; the person sees nothing | `autoRefreshToken: true`; refresh behaviour on a device UNVERIFIED |
| Session expired or revoked (refresh token rejected) | State `SESSION_LOST` then `signedOut`. Letters stay. The person still reads, records and exports (NX-31-R22). Tonight opens; the You tab shows "Signed out" with one Sign in button (#738). No blocking screen | `machine.logic.ts` `SESSION_LOST`; NX-31-R22, R26; #738 |
| Signed out by the person | Same as above. A phone with a book and no session offers sign-in and never blocks | `gate.logic.ts` `offerSignIn: !hasSession` |
| Apple revoked the Apple Account link | `SignOutReason: 'apple_revoked'`, then the signed-out state above | `machine.logic.ts` |
| New phone | Keychain item is `THIS_DEVICE_ONLY`, so it never moves with a backup: a new phone always signs in. Then S17 | EVIDENCE `secure-storage.ts`; #755 |
| Reinstall on the same phone | Keychain survives a delete and reinstall on iOS (`erase-everything.ts` says so about its leftover items). The local database does not. So a reinstall can find a session and no book, which the gate reads as a new phone: `openingBook`. Stories do not show, because a session exists | Session survival after reinstall: UNVERIFIED on a device (code comment only) |
| A session appears while a story is on screen | The story step yields at once to the gate's answer; no animation owed | PROPOSED; follows from rule 4 of the gate |
| Different Apple Account or email than last time | "No book here yet" (`noBookHere`) is how they find out | NX-31-R12 |
| Reduce Motion on | No auto-advance, no bar fill, no drawing, cross-fades only. Section 5 | MOTION 4 |
| VoiceOver on | Auto-advance off. Each card is one element. Back, Next and Skip are buttons. Section 4.3 | PRD A-REQ-007 |
| Dynamic Type to AX5 | Cards scroll, words never cut. Skip stays visible. Auto-advance off from AX1 up | A-REQ-005; #770 section 4 |
| Dark mode | Same layout; reversed lockup; lamp is the site's evening | DESIGN_LANGUAGE 2 |
| Under 18 | Stop screen, 24 hours, nothing stored but the time | `age-gate.logic.ts` |

### 2.4 The account door: "Sign up" and "Log in"

Words first. The glossary bans "log in" and "login" and says the action is "sign in" (BRAND.md, Action row). "Create account" and "Sign up" are in neither BRAND.md nor `auth.en.ts`; `content` must add them if the founder wants them. The Apple button can say "Sign up with Apple" through the system button type (`SIGN_UP`); I could not read the installed `expo-apple-authentication` types, so that is UNVERIFIED. The app uses `CONTINUE` today (`lib/auth/ui.tsx`) and #724 adds a `signIn` prop.

Which providers exist (EVIDENCE):

| Provider | In the code | In the Build 12 store build |
|---|---|---|
| Apple | `lib/auth/apple.ts`; scopes requested are full name and email | Yes, shown when `appleSignInAvailable()` |
| Email, 6-digit code or link | `lib/auth/email.ts` | Yes |
| Google | `lib/auth/google.ts`, `@react-native-google-signin`, shown only if both client ids are in the build env | No: `eas.json` has no `EXPO_PUBLIC_GOOGLE_*`. Dashboard-set EAS variables could add it: UNVERIFIED |
| Passkey | `lib/auth/passkey.ts`, off unless `EXPO_PUBLIC_PASSKEYS=1` | No: not in `eas.json` |

NX-31-R9 says Apple asks for the email only; `apple.ts` also requests the full name. That is a conflict between the spec and the code; it is `mobile`'s and `privacy`'s to settle and does not change this doc.

Two options for the door:

| | Option A (recommended) | Option B |
|---|---|---|
| Screen | One screen, the built #724 Welcome. Heading names both: "Create your account or sign in". Apple and email buttons at equal weight, as built | Same screen with a two-part switch at the top, "Create account" and "Sign in". The switch changes the heading and the button words only |
| Behind it | One flow | The same one flow |
| Taps | Same as built | Same as built (the switch is a choice, not a step) |
| Cost | Copy only (S) | A segmented control (specified in COMPONENTS 2.9; no file in `components/ui` on develop, so UNVERIFIED that it is built) plus tests (M) |
| Risk | The founder may feel it is not "two clear paths" | A wrong choice does nothing wrong, but it teaches that the two differ, and they do not |
| Why | New and returning must look the same on email (anti-enumeration); the screen is built and tested | Matches the founder's picture |

Both options keep: the agreement line with Terms and Privacy links directly above the buttons; no password, name or phone field; "I was invited" hidden in a servers-on store build (#720); Terms and Privacy accepted in the consent sheet, which is where the act is recorded (PRIV-R21).

The door requirement (COORDINATION section 10):
- **Shown:** `authCopy.sheet.agreeLine` ("By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.", the registered consent line reused word for word, founder-approved 10 Nov), the two versioned links, and the heading below. Largest Dynamic Type: the footer moves inline into the scroll and the buttons grow; no text is cut.
- **Records:** unchanged by this spec. The acceptance is recorded by the existing consent sheet and `my_sync_gate()` path; PRIV-R21 fields are `mobile`'s and `data-architect`'s to confirm (UNVERIFIED that the existing row carries every PRIV-R21 field).
- **Never:** no name, email, birthday or child detail is collected before the account exists; nothing is sent to analytics before consent.
- **Decline and withdraw:** declining the sensitive-data consent keeps the person signed in with letters on the phone (`sync: 'off'`, `machine.logic.ts`); export and deletion still work (PRIV-R09). Skipping the stories asks nothing and records nothing.

## 3. Signed in is not locked: Face ID

### 3.1 Two separate things

| | Signed in | App lock |
|---|---|---|
| What it is | A session in the Keychain | An optional cover, off until the parent turns it on (CPO-2) |
| Lives | `supabase/client.ts`, `secure-storage.ts`, Keychain `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | Two local settings, `appLock.enabled` and `appLock.grace` (`lib/app-lock/prefs.ts`) |
| Needs Face ID | No. Nothing about the session is gated by biometrics | Yes if enrolled, else the device passcode |
| After a cold start | Restored without the network | Locks on a cold start and after longer away than the grace (Immediately, 1 minute default, 5 minutes) |
| Removed by | Sign out, session lost, Erase everything | Turning it off; the device passcode being removed; Erase everything |

Quoted from code (EVIDENCE): `machine.ts` header: "Off until the parent turns it on (CPO-2). Off, it never covers, never locks and never asks." and "Locks on a cold start, and on coming back after longer in the background than the grace". `controller.ts`: `LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: false })`, so the default policy is Face ID or Touch ID, falling back to the device passcode.

### 3.2 What Face ID failing or being unavailable does

| Case | Behaviour | Evidence |
|---|---|---|
| Face ID does not match | iOS falls back to the device passcode in its own sheet | `disableDeviceFallback: false` |
| Person cancels the sheet | The lock screen stays with an Unlock button. It asked once on its own and will not loop; only Unlock asks again | `machine.ts` header, `authOutcome` maps `user_cancel`, `system_cancel`, `app_cancel`, `user_fallback` to `cancelled` |
| Face ID is off for the app in iPhone Settings | The passcode opens the book. The offer says so (`appLock.faceIdDenied`) | `lockAbility`, `copy.ts` |
| Biometrics locked out | Passcode fallback | `machine.ts` comment on `lockAbility` |
| The phone has no passcode | The offer is hidden; if the passcode is removed later the lock turns off and says so once | `controller.ts`, `copy.ts passcodeRemoved` |
| An unknown error | Treated as `failed`; the lock screen stays | `authOutcome` |
| The app is recording | The lock waits until the recording ends | `machine.ts` |

The lock layer is rendered inside the age gate and the SessionProvider, over every route and sheet (`_layout.tsx`). So the age question is not behind the lock, and on a cold start with the lock on and no session, the person unlocks first and then meets the auth entry. The exact frame order on a device is UNVERIFIED.

**Face ID never replaces account recovery.** The lock holds two local settings and no credential. If the person is locked out of Face ID they use the passcode; if they are signed out they recover through Apple or an email code. Losing or resetting the phone clears the lock and the Keychain item (`THIS_DEVICE_ONLY`), and the next phone starts at sign-in. No screen may say that Face ID "protects your account" or "recovers" anything. The lock screen has no sign-out and no "forgot" path today, and I do not propose one.

### 3.3 When the lock is offered

| Moment | Today on develop | Decided | This spec |
|---|---|---|---|
| End of first run, on "The book is open." | Yes: `onboarding.tsx` mounts `<LockOffer child={child} />` | No (NX-31-R14, founder 9 Nov: "no lock offer shows" there) | Remove it (tier A, S). The code line is in the file #764 and #724 also edit, so it goes in after they land |
| Session 3, after a kept letter | Not built. #702 counts sessions that end in a kept letter, on the phone only; "Nothing reads `keptLetterSessions()` yet" | Yes: the third such session, "Not now" holds 30 days (proposed) | Tier B for Build 12, tier A if `mobile` can do it with the counter alone (M). Until then the lock lives in Settings, App lock |
| A returning parent on a new phone | Not offered | #755 section 6.4 recommends the counter starts at 0 on a new phone and arrival does not count | Agree |
| Settings, Privacy and security, App lock | Built | n/a | No change |

The founder's 10 Nov line "next time you come in Face ID" is true only after the parent has turned the lock on. NX-40 FD-3 (#775) recommends offering it on the second open instead of session 3. I keep session 3 as the default and record the second-open option as a founder decision (open question 5); I do not change NX-31-R14 here.

If the session-3 card does not make Build 12, the honest state is: no offer anywhere except Settings. That is a smaller promise than today's end-of-first-run card, which a parent could take as a missed feature. It does not break any rule. The words of the lock offer are `content`'s; their Shown, Records, Never and Decline lines (PRIV-R21) are unchanged, since nothing is recorded but the setting.

## 4. Story cards

### 4.1 The rules each card follows

- True of the Build 12 binary. Build 12 has sign-in and sync (servers on), English only, backup off, co-parent "coming soon" (founder, 10 Nov; `claims-capabilities.test.ts` profile).
- No "stays on your phone" or "kept on your iPhone" claim. PRs #768 and #769 found those lines untrue with servers on; the website still carries them until those PRs merge. Do not copy `site.ts` scene s09 or `comingSoon.trust`.
- No co-parent, invite, grandparent, family-sharing or "people you invite" words (`rules.test.ts` bans the family words in the stories; the build keeps them "coming soon").
- No streaks, points, badges, counts of gaps, fear, guilt or loss words; `{child}` and never a name (no name exists at first run, so "your child").
- Never imply a machine writes. "Small fix", "your words", "your voice" as in the glossary.
- No em or en dash, curly quote, ellipsis character or emoji.
- Draw on the deck that exists. Ids are never reused for new wording (`stories.en.ts`), so a changed card gets a new id.

### 4.2 The deck (tier B: three cards, then the auth entry)

| # | Id | Purpose | Headline | One line | Drawing (existing) |
|---|---|---|---|---|---|
| 1 | `story.talk.v1` (reused as is) | Show the effort: one minute | Talk for a minute. | Tell your child about today. It becomes a letter in their book. | `envelope-fold` |
| 2 | `story.exact.v3` (new wording; v2 reused is the fallback) | The promise that matters most | It stays in your words. | We only fix small slips, like an um, a repeat or a misheard word. We never rewrite your words. | `letter-underline` |
| 3 | `story.voice.v1` (reused as is) | The reason to start tonight | Read together, in your voice. | Years from now, your child can hear how you sounded tonight. | `moon` |

Notes on truth (EVIDENCE unless marked):
- Card 1: the headline and line are in `stories.en.ts` and passed `rules.test.ts` when written; I did not run it (UNVERIFIED now).
- Card 2: the headline is the brand pillar and the website's scene S04 headline. v2's headline "Exactly as you said it." is also the first-run promise title, but the claims test declares `wordsExactlyAsSaid` false ("every word exactly as you said it is not true of the words", D-086, D-133) so I moved the headline to the pillar and kept the second sentence, which is the glossary's one-sentence description of a small fix. COUNSEL-READ (a promise about our behaviour).
- Card 3: the line matches the evening line "Talk for a minute. One day {child} can hear how you sounded." that #768 made true whether servers are on or off. It is still a statement about the future and depends on the parent keeping recordings (the Keep recordings setting). COUNSEL-READ. "Read together" is the glossary's name for the listening mode.
- The old card 4 (`story.private.v1`, "Private to your family. Only you and the people you invite can read these letters...") and `story.private.v2` ("Shared only with the other parent, if you invite them.") name invitations. With co-parent "coming soon" they must not ship in Build 12. They stay in the file unused; the deck for Build 12 is an explicit list of three ids, not the remote `intro_variant` alone.

Optional card 4, tier C unless counsel reads it in time (COUNSEL-READ, whole card):

| # | Id | Purpose | Headline | One line |
|---|---|---|---|---|
| 4 | `story.account.v1` (new) | Say why sign-in exists | Your book can follow you. | Sign in to keep your book across your phones. You choose whether to sync, and you can delete your account any time. |

Source of the first sentence: the founder-approved store sentence in #769 ("Sign in to keep your book across your phones."), kept exactly. The second sentence names the consent choice (sensitive-data consent can be declined and the person stays signed in) and in-app deletion (S16). No privacy claim beyond that. I deliberately do not repeat #769's longer sentence about servers on a swipe card; the auth entry's agreement line and the consent sheet carry it.

Why three and not #770's four: see section 4.5.

### 4.3 Each card, in full

Common to all cards: the paper and the lamp (scene `welcome`, `persistKey "firstRun"`, one lamp slot) are there from the first frame; bars at the top; Skip top right, 44 pt minimum, opaque and hittable on frame 1 of every card; the drawing above the words; no child name; no sound; no haptic.

| Card | Motion idea (tier B) | Reduce Motion form | Screen-reader text |
|---|---|---|---|
| 1 Talk for a minute. | Lamp arrives once (`lamp.arriveMs`, first launch only). Drawing is shown still. Headline and line enter with `enter(0)` and `enter(1)` (opacity 0 to 1, y 8 to 0, 280 ms, 30 ms stagger) | Lamp at its level; words fade in over `fadeMs`, no travel | "Story 1 of 3. Talk for a minute. Tell your child about today. It becomes a letter in their book." |
| 2 It stays in your words. | Same entrance. The drawing is two still lines of a sample sentence (fictional Asha only) with one small underline on a removed filler word that fades in once over `fadeMs`. Words appear whole, never typed | Underline present at once | "Story 2 of 3. It stays in your words. We only fix small slips, like an um, a repeat or a misheard word. We never rewrite your words." |
| 3 Read together, in your voice. | Same entrance. The moon drawing is still. The lamp is the only thing that breathes, and only if the animation engineer measures that it fits next to the bar (MOTION 7 allows one loop) | Still | "Story 3 of 3. Read together, in your voice. Years from now, your child can hear how you sounded tonight." |

The position phrase comes from `contentBlocksCopy.storyPositionA11y` (A-REQ-007 wording: "Story 2 of 4. Headline. Line."). `renderBlock` passes `total={block.order}` for a story (`blocks.tsx` line 154), which is wrong for a deck; the intro must call `StoryCard` with the real total, as that file's own comment says.

Behaviour (from PRD A F2 and #770, with my changes):
- Auto-advance: cards 1 and 2 move on after 6 seconds untouched; card 3 never moves on by itself. PRD A-REQ-006 said stories 1 to 3 advance and story 4 stops; with three cards the last one stops, so the rule is the same.
- Tap right 70 percent: next. Tap left 30 percent: back. On card 1, nothing. Hold over 200 ms: pause. Swipe: follows the finger like Read together's page turn.
- Skip, from any card, goes straight to the auth entry: one tap, no confirmation. "Skipped" and "finished" both set `onboarding.storiesSeen` and the stories never show again on this install (A-REQ-010). Quitting mid-story shows them again from card 1.
- Card 3 carries one button at the bottom, "Get started", which goes to the auth entry. It is not an account choice: the founder's "skip, then login or sign up" is the auth entry.
- Backgrounding pauses the bar; returning continues where it was.
- With Reduce Motion, VoiceOver, Switch Control or AX1 and larger text: no auto-advance and no fill; visible Back and Next buttons at the bottom, 44 pt; the leaving card is hidden from the screen reader; focus goes to the new headline. (Rationale: WCAG 2.2.2 pause, stop, hide for moving content that starts by itself. I remember the rule; I did not re-read the W3C page this session, so UNVERIFIED.)

### 4.4 The door line on the stories (COORDINATION section 10)
The stories ask nothing and record nothing, so most of the four lines are "none". **Shown:** the three cards above and the word "Skip". **Records:** one local boolean, `onboarding.storiesSeen`, a device setting; it needs a row in the data map (PRINCIPLES 10), which I ask `data-architect` to add. **Never:** no analytics event before consent, no card text in any event, no network call. **Decline:** Skip is the decline; nothing is lost; sign-in is still reachable in one tap.

### 4.5 Where I differ from the motion spec on #770

#770 says its cards are a proposal and this doc wins on count, order and state names. Changes:

| Topic | #770 | This doc | Why |
|---|---|---|---|
| Count | 4 | 3, with the auth entry as the end | The deck and its tests exist for the content below; the old privacy card cannot ship; four swipes before a form is more than the PRD's own research cap of three (PRD A, "UR 6 R1 caps intros at 3") |
| Card 1 "A quiet evening" (site S01) | A card | Dropped as a card; its mood is the lamp and the moon drawing on card 3 | It makes no claim and teaches nothing; the website needs a scroll to land it, a swipe card does not |
| Card 2 "A minute is plenty" | Own card | Card 1 "Talk for a minute." | Existing, reviewed words |
| Card 3 "It stays in your words" | Card 3 | Card 2 | Promise comes second so it is read before the voice |
| Card 4 "Month by month" | A card | Not in Build 12 | The month-by-month book is shown on Tonight and the Book; it is a feature tour, which PRD A rejects ("No feature tour") |
| Choices on every card | Create account and Sign in visible from frame 1 | Only Skip from frame 1; the choices are the next screen | The founder asked for skip first, then the choice |
| Tokens | `story: { dwellMs: 6000, holdMs: 200, edgeZone: 0.3, linearBar: true }` | Same block, tier B only. I agree with the numbers as proposals; the 6 s matches PRD A-REQ-006 | Keep one block |
| Tier A needs no new token | Yes | Agree | |
| Lock offer | Kept "after sign-up, in context" | Moved to session 3 or Settings (NX-31-R14) | #770 section 7 predates the ruling it should follow |
| State names | Not named | `stories` (new), others as the repo's `FirstRunStep` | Section 2.2 |

I accept #770 on: principles, progress bar rules, gestures, Reduce Motion table, device and asset budget, QA list. Its collision note (route rows go in `lib/transitions.logic.ts`) is right and is repeated in section 8.

## 5. Motion and design

- Look. The cards use the site's own language: the paper, the lamp (`Lamp`, scene `welcome`), single-weight line drawings in `textMuted` with one `accentSoft` wash (`LineArt`), serif headline (`title1`) and sans line. The site's drawings (moon, lamp, window, reading lamp) are already in `line-art.data.ts`. The site scrolls through pinned scenes; the app turns cards, so what carries over is the hand-off (leaving words gone before arriving words), the one lit room and the still hold, not the scroll.
- Tokens. Reuse `useMotion().enter(i)`, `.leave()`, `fade()`, `exitMs` 160, `enter` 280 ms, `fadeMs` 200, `lamp.arriveMs` 1200, `route.dissolveMs` 280, `press.scale`, `springConfig('snappy')`. Card to card is 160 + 280 = 440 ms, inside `sequenceMaxMs` 900. Colours and sizes come from tokens; nothing is typed in a screen.
- New token, tier B only: the `story` block above. `tokens.ts` changes with its test; `design-systems` owns that PR. The bar is linear on purpose (a clock, not a transition): an eased bar reads as speeding up or stalling.
- Assets. No video, no Lottie, no Rive. The repo has none of them (`apps/mobile/package.json` has `react-native-svg` and `react-native-reanimated`; no Lottie), and MOTION 9 recommends none in v1. Drawings are the existing SVG path data in `line-art.data.ts`, drawn with `strokeDashoffset` only in tier C. Size budget (PROPOSED): 0 new dependencies, 0 network fetches, at most 6 KB of path data per card and 24 KB for the intro. PRD A-NFR-003 allows 1.5 MB for the intro and images up to 250 KB each; we use far less because we ship no raster images.
- Performance (all UNMEASURED proposals): time to first story frame no later than today's Welcome first frame after the age answer, since the cards are in the bundle and need no read beyond one setting; target p95 under 1 second on the oldest phone the team owns (iOS 17 floor, `app.config.ts` `IOS_DEPLOYMENT_TARGET`); no frame over 16.7 ms (MOTION 7); Skip responds within one frame and is never more than 1 tap from any card, including card 1 at frame 0.
- Controls never animate in (MOTION principle 2): Skip, Back, Next and Get started are opaque from frame 1.
- Haptics: none in the intro; none on Skip. The `success` haptic stays for the open book and a kept letter.
- Sound: none (SOUND.md; PRD A-REQ-009).

## 6. Analytics: proposals for the analytics owner

Constraints (EVIDENCE): analytics is opt-in, off in every 1.0 profile, and "No event is sent, queued in memory or written to disk before the person says yes" (TRACKING_PLAN section 1; NX-36 section 2.7). The consent ask comes after the first kept letter. So events fired during the intro or sign-in would never be sent. The existing pattern is one summary at consent time (`analytics_opted_in` carries first-run facts the app already stores). NX-36 lists the sign-in events already in the catalog: `auth_sheet_shown`, `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `auth_deferred`, `signed_out`.

Proposals (none is in `packages/analytics/src/catalog.ts` today; each needs a catalog row and the tracking plan in the same PR):

| Proposal | Shape | Notes |
|---|---|---|
| Add to `analytics_opted_in` | `stories_outcome`: one of `finished`, `skipped`, `none`; `stories_last_card`: integer 0 to 3 | Read from local settings at consent time. No card text, no timing finer than the existing buckets |
| `app_lock_offered` | `source`: `session_three`, `settings`; `result`: `turned_on`, `not_now` | Only after the session-3 card exists. Never the method (Face ID vs passcode is device information) unless the analytics owner allows it |
| none for Skip taps in the moment | n/a | Not sendable before consent; do not add a pre-consent buffer (it would break the opt-in rule) |

The stories use no new `screen_view` route, because they are a step inside the first-run route. If `mobile` makes a route, `ROUTE` in the catalog needs the template. These are proposals for the analytics owner; this PR changes no analytics file.

## 7. Store and App Review risks

| Risk | Status | Cheapest check |
|---|---|---|
| Guideline 4.8: a third-party login requires an equivalent privacy-preserving option | Read on 10 Nov 2026: the rule applies to "a third-party or social login service" and does not apply if the app "exclusively uses your company's own account setup and sign-in systems". Build 12 offers Apple and our own email code. Google is off (section 2.4). Apple is itself a third-party service that meets the three features. So, as I read it, 4.8 is met either way. UNVERIFIED for this binary: whether any EAS dashboard variable turns Google on, and how App Review reads the build | Founder or `mobile` reads the production profile's resolved env in EAS for `EXPO_PUBLIC_GOOGLE_*`. If Google ever turns on, Apple stays. About two minutes |
| Guideline 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login" | Real risk for required sign-in. Co-parent sharing is "coming soon", so the account-based feature in Build 12 is cross-phone sync | The Notes for Review must name sync across phones as the reason, and the local start fallback (`LOCAL_START_FALLBACK`, on) is the outage path, not a general one. `compliance-engineer` and the founder decide wording; I did not read the current Notes for Review |
| Account creation implies in-app account deletion (5.1.1(v), same text) | Planned: S16 Delete account in NX-36. Not verified built in this task | `qa` row: delete an account from the You tab on a device |
| Reviewer sign-in path (NX-05) | Stays a founder step; this spec adds nothing to it | n/a |
| Stories as marketing inside the app | Fine as long as they teach the product; they must not look like a paywall or advertise Plus. No Plus line in the intro | Content review |

### 7.1 Apple 5.1.1(v) in plain words

The founder decided that sign-in is required in Build 12. Guideline 5.1.1(v), as fetched on 10 Nov 2026, says: "If your app doesn't include significant account-based features, let people use it without a login." That is an App Review risk and I name it plainly: with co-parent sharing "coming soon", the account-based feature a reviewer can see is syncing a book across phones, and a reviewer may call that not significant enough to require sign-in. I cannot say how App Review will read it. UNVERIFIED.
- Cheapest check: read the current guideline text on developer.apple.com the day of submission (about two minutes), and read the Notes for Review draft to see that it names cross-phone sync as the reason for the account.
- Fallback rule if App Review rejects on this ground: the existing local start (`LOCAL_START_FALLBACK`, `gate.logic.ts`) is already a compiled constant. Flipping its use from outage-only to always offered is a one-line change plus tests and a rebuild; it needs the founder's word and a new Notes for Review, and it is not done here.

## 8. Scope tiers and recommendation

Sizes are unmeasured guesses of one engineer's work, not estimates from a velocity. "Build 12 word is due Wed 11 Nov" (founder): be honest, B probably does not fit with A in one day.

| Tier | What | Size (guess) | Build 12? |
|---|---|---|---|
| A1 | Auth entry copy: heading names both, Option A (or B if the founder says so) | S (B: M) | Must |
| A2 | Returning-user path correct: a session and a book go straight to Tonight; no stories, no auth screen; expired session leaves the book usable | S, mostly tests on what #764 built | Must |
| A3 | Lock offer correct: remove `LockOffer` from "The book is open." | S | Must |
| A4 | Session-3 lock card from the #702 counter | M | Stretch inside A; if it slips, Settings only |
| B1 | Story intro shell: bars, gestures, auto-advance, once flag, `stories` gate step, flag | M to L | Stretch, behind a flag, off by default |
| B2 | `story` token block and test | S | With B1 |
| B3 | Words: three ids, counsel read | S for `content`, wait for counsel | With B1 |
| C | Drawing animation per card (`drawMs`), the optional account card, richer transitions | M | 1.0.1 |

Recommendation: ship A in Build 12, with A4 only if it fits; ship B as code behind a flag that is OFF in the first store build, and turn it on when the words are counsel-read and a device run shows the frame and Skip budgets; C in 1.0.1. If B is off, nothing the founder asked for is lost except the first impression; I would rather say that than ship cards no one has read on a device. The founder may overrule: then B1 must start tonight and counsel must read three lines tomorrow.

## 9. Backlog items, tests, dependencies, file overlap

### 9.1 Items
Ids: the `product` agent took `BL-891` to `BL-897` in #775 (NX-40: requirements and trace, intro scaffolding behind a flag, intro screen and a11y, test seams, analytics, Apple name scope, session length). I re-ran `node scripts/agents/next-id.mjs` after fetching that branch: next free is `BL-898`. My rows take `BL-898` to `BL-906`. Where an NX-40 row covers the same work, build once and close the duplicate (BL-895 and BL-896 in NX-40 overlap my intro and analytics rows; `product` decides). This PR adds no rows to `docs/BACKLOG.md`; `product` files them. Re-run the script before merge.

| Id | Item | Owner | Tier |
|---|---|---|---|
| BL-898 | Auth entry words: heading names create and sign in; Option A or B | content, mobile | A |
| BL-899 | Returning-user path tests: session valid, expired, signed out, with and without a book | mobile, qa | A |
| BL-900 | Remove the lock offer from "The book is open." | mobile | A |
| BL-901 | Session-3 lock card from the #702 counter (NX-31-R14, R29) | mobile | A stretch |
| BL-902 | Story intro shell and `stories` gate step, flagged off | mobile | B |
| BL-903 | `tokens.motion.story` block and test | design-systems | B |
| BL-904 | Story words: ids `story.exact.v3`, deck list for Build 12, counsel read | content, legal | B |
| BL-905 | Analytics proposals in section 6, and the `onboarding.storiesSeen` data-map row | analytics, data-architect | B |
| BL-906 | Bug: `renderBlock` in `components/content-blocks/blocks.tsx` (line 154) passes `total={block.order}` for a story, so a deck shows the wrong "Story n of N" to a screen reader. Pass the deck length | mobile | B (found while writing this spec) |

### 9.2 Red-first tests (write each failing before the code)

| Test | Proves |
|---|---|
| `first-run-gate: stories step shows only with no session, no book, age Yes, flag on, not seen` | Gate order |
| `first-run-gate: a book on the phone never shows stories` | Returning user |
| `first-run-gate: a session appearing while stories show gives the session's answer` | Mid-story sign-in |
| `first-run-gate: flag off is identical to #764 behaviour` | No regression |
| `stories: skip sets storiesSeen and the step does not return` | Once |
| `stories: quitting before skip or the end shows card 1 again` | Resume |
| `stories: card 3 never auto-advances; cards 1 and 2 advance at dwellMs` | Timing, with a fake clock |
| `stories: reduce motion, screen reader or AX1+ turns auto-advance off and shows Back and Next` | A-REQ-007 |
| `stories: the deck for Build 12 is exactly the three ids and none names an invitation, family or backup` | Truth |
| `stories: offline renders with no network call` | Offline |
| `stories: every card string passes the content rules and the claims-capabilities profile` | Voice and claims |
| `onboarding: no LockOffer on the finish step` | A3 |
| `lock offer: shows only on the third session that ends in a kept letter, once, Not now holds` | A4 |
| `app-lock: failed or cancelled authentication leaves Unlock and does not loop` | Already covered by `app-lock-machine` tests as read in the header; confirm, do not duplicate (UNVERIFIED) |
| `tokens: motion.story values and linearBar` | B2 |
| `analytics: stories_outcome carries no text` | B proposals |

### 9.3 Dependencies

| Depends on | Why |
|---|---|
| #724 | Auth entry screen, outage screen, `gate.logic.ts`, `use-first-run-route.ts` (base) |
| #738 | Signed-out You tab, the Sign in button when a session is gone |
| #764 | New-phone route; edits `gate.logic.ts`, `use-first-run-route.ts` and `onboarding.tsx`; the stories step goes on top of it |
| #720 | "I was invited" and co-parent surfaces hidden in a servers-on store build |
| #702 | Counter for the session-3 lock card |
| #768, #769 | Word truth for the site and store; story card 4 and the auth line wait on their sentences |
| PR #770 | Motion detail (this doc wins on count, order, state names) |

### 9.4 File overlap (so mobile agents do not collide)

| File or area | Also touched by | Rule |
|---|---|---|
| `apps/mobile/src/lib/first-run/gate.logic.ts` | #724, #764 | Add the `stories` step after both land; one small function change, tests in `first-run-gate.test.ts` |
| `apps/mobile/src/lib/first-run/use-first-run-route.ts` | #724, #764 | Add the `storiesSeen` read there, nowhere else |
| `apps/mobile/src/app/onboarding.tsx` | #724, #764, any lock-offer change | `FirstRun` wrapper only; the LockOffer removal is a one-line change in `FirstRunSteps`; do these in separate PRs after #764 |
| `apps/mobile/src/components/onboarding/welcome-sign-in.tsx` | #724 | Heading and (Option B) switch only |
| `apps/mobile/src/lib/transitions.logic.ts` | #770 note | Route rows for the intro go here, not in screens |
| `apps/mobile/src/components/content-blocks/blocks.tsx` | none known | Fix the story total; new intro shell in a new folder `components/onboarding/stories/` |
| `packages/design-tokens/src/tokens.ts` | design-systems only | The `story` block |
| `packages/content/src/stories.en.ts`, `features/auth.en.ts` | #724, #764 (auth), `content` | Words only by `content` |
| `apps/mobile/src/lib/app-lock/**`, `components/app-lock/**` | none open that I found | Session-3 card reads `keptLetterSessions()` from #702 |
| `packages/analytics/src/catalog.ts` | analytics owner | Proposals only |

## 10. Open questions for the founder

Few (five), each with a recommendation and a default if unanswered by the time the build is cut.

| # | Question | Recommendation | Default |
|---|---|---|---|
| 1 | Do you want "Create account" and "Sign in" as two labelled choices (Option B), or one screen that says both (Option A)? | A. New and returning cannot differ for email, and the screen is built. B costs about a day more and adds words the glossary lacks | A |
| 2 | Stories before or after the age question? | After (Karma's ruling, overruling NX-40 FD-2; reversible). It is one tap, and the age question is pinned at the root; moving it needs counsel's view | After |
| 5 | Lock timing against your line "next time you come in Face ID" (NX-40 FD-3): offer it on session 3 (NX-31-R14, decided 9 Nov), or on the second open? | Not changed here. Default stays session 3; the second-open option is yours to take, it changes NX-31-R14 | Session 3 |
| 3 | Ship the story intro in the first Build 12 store build, or behind an off flag? | Behind an off flag; turn on once counsel has read cards 2 and 3 and a device run has timed the first frame and Skip | Off |
| 4 | Is "Years from now, your child can hear how you sounded tonight." acceptable when a parent has turned Keep recordings off? | Yes for the card, with counsel to read | Counsel reads |

## 11. UNVERIFIED, and what I did not read

- No device, simulator, build or test run. Every behaviour is read from source or a PR description.
- Whether the installed `expo-apple-authentication` exposes the sign-up button type; the installed source was not available (no install).
- Whether any EAS dashboard variable turns Google or passkeys on.
- Whether the session survives a delete and reinstall on a real iPhone, and what the first frame is on a cold start with the lock on and a session expired.
- How App Review reads required sign-in with co-parent "coming soon" (5.1.1(v)); the current Notes for Review.
- The #752 words doc and the #757 claims test were not opened; I used the #768 and #769 descriptions and the claims test on develop.
- Whether `rules.test.ts` passes on the story ids and the three proposed lines as written (I did not run it; I hand-checked for banned characters and glossary words).
- The Apple page returned through a summarising fetch; the 4.8 text is quoted from that result and should be re-read on developer.apple.com before any submission note relies on it.
- WCAG 2.2.2 wording, dwell and hold numbers, SVG size numbers, and every perf budget in section 5 are proposals.
- Whether NX-31-R9 (Apple email scope only) or `apple.ts` (full name and email) is the intended behaviour.
- Whether the existing consent row carries every PRIV-R21 field.

## 12. Where this file differs from others

- NX-36 section 2.4 says no motion changes in Build 12 and no new motion tokens. The story intro is an explicit tier B exception behind a flag; tier A keeps that rule.
- NX-31-R14 and this file agree on the lock move; `onboarding.tsx` on develop and in #764 still shows the lock at the end of first run.
- PRD A F2 puts a fourth story with the account actions; here the auth entry is that panel.
- `stories.en.ts` header says card 4 carries the privacy promise (D-061); here that card is withheld for Build 12.
