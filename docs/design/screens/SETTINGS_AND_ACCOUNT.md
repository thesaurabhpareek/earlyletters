# Settings, app lock and Before you begin: screen specs for the 1 Dec build

Owner: `design-systems`. Status: final for build, 1 Nov 2026. Behaviour lands after the 9 Nov go/no-go (D-130) and before the 20 Nov cut-off (F11). Not run on a device: every screen below needs the S1-23 AX5 and VoiceOver walk.

Sources, in order of authority: founder decisions F1 (scope: on-device build plus app lock, Before you begin, Where your letters live, Your words, Erase everything, regrouped Settings), F2 (neutral Yes/No plus an unticked Terms box), F4 (D-033 confirmed, gated by the drill), F11 (release map); rulings CPO-2, CISO-1, CDesO-1 to CDesO-3, CDesO-6, CCO-6 to CCO-10, CPrivO-3 to CPrivO-5, CLO-4, CLO-5 (`proposals/account-security/council.md`, `proposals/v1-experience/council.md`). Working proposals: `account-security/design.md` (sections 2 and 4), `settings-ia.md`, `reminders-settings.md`, `privacy-settings.md`.

**Strings are slots.** Every visible or spoken word is a key from `proposals/account-security/content.md` (section 4 for the words, section 5 for VoiceOver) unless marked **N** (a new slot that `content` still has to add). Variant keys ending `.faceId`, `.touchId`, `.passcode` are picked by `supportedAuthenticationTypesAsync`; this spec writes them as `.*`. No string is typed in a screen.

**If the lock slips.** If counsel has not approved the Face ID purpose string by Fri 20 Nov (F1 default), sections 3 to 5 move to the first 1.0.x; Settings home drops the App lock row and Privacy shows `privacy.whoLockOff`. Everything else ships 1 Dec.

## 1. Rules for every screen here

| Area | Rule |
|---|---|
| Components | Library first (COMPONENTS.md): `ListSection`, `ListRow`, `Toggle`, `ChoiceGroup`, `Button`, `ButtonRow`, `Card`, `InlineState`, `StateScreen`, `confirm()`, `Toast`. New: `AgreementRow` (2.25), `PrivacyCover` (2.26), `SignOff` (2.27), `NotificationPreview` (2.30). |
| Navigation | Settings pages are native pushes (MOTION 5l row 9). In-place changes cross-fade at `swapMs`. No custom slides. Controls are there from frame 1. |
| VoiceOver | The heading takes focus on mount (`useFocusOnMount`). State changes go through `announce()`. Errors are icon plus words plus `announce()`. |
| AX5 | Rows stack the value under the title (`ListRow`). `ButtonRow` stacks. A pinned primary scrolls into reach when it cannot pin. Nothing truncates. |
| Reduce Motion | Every move is one `fadeMs` fade (`ReduceMotion.Never`). The lamp is still. |
| Haptics | Outcomes only (MOTION 6). None between record start and stop; the lock never fires during a take. |
| Themes | Token pairs only (section 9). The lamp lights only Before you begin and the lock offer; none under Increase Contrast or Reduce Transparency. |
| Offline | Build 1 needs a network only for the Terms and Privacy links; the in-app browser shows its own error. |

## 2. Before you begin (replaces the age gate's room)

F2, CCO-6 (LEGAL-REQ-002 tests unchanged), CLO-4 (counsel Q-A to Q-C). Lamp scene `gate`, `LampView`.

```
              (QuotePair)
       [ageGate.title]
   [ ageGate.yesButton ]  [ ageGate.noButton ]
   [ ] [beforeBegin.agree]
   [beforeBegin.termsLink]  [beforeBegin.privacyLink]
   (reason line: beforeBegin.chooseAnswer | beforeBegin.tickBox)
   [            beforeBegin.continue            ]
```

- **Parts:** `QuotePair`; two answer pills (existing); `AgreementRow` (unticked on every visit); two `Button quiet` links, `role="link"`, each its own target with hint `beforeBegin.linkA11yHint`, opening the in-app browser; `Button primary lg` Continue.
- **States:** nothing chosen and box unticked (always on arrival). Continue is never disabled. Continue with no answer: reason line `chooseAnswer`. Yes without a tick: `tickBox`, focus moves to the box. No then Continue goes to the stop screen whatever the box says, and nothing about the box is stored. Yes plus tick stores `ageGate.passed` and the local Terms record (L2, never logged, CPrivO-3). Returning from a link keeps every state. Installs that passed the old gate see `beforeBegin.returningTitle`, the agreement row and Continue only (counsel Q-C).
- **The gate allows no status colour** (MOTION 5k, `lamp.test.ts` source scan). The reason line is `text` with a Bold 18 pt WarningCircle in `text`: icon plus words plus `announce()`, never `caution`.
- **VoiceOver order:** question (heading), Yes, No, checkbox ("not checked"), Terms link, Privacy link, reason line (live region), Continue.
- **Motion:** as today (mark fades, question enters at 60 ms, Yes leaves up over `exitMs`). The reason line fades in at `fadeMs`. Answering No never changes the room.
- **Haptics:** `tap` on an answer and on the box. None on Continue.
- **AX5:** the pills stack; the agreement text wraps beside a box that stays top-aligned; links stack; Continue scrolls into reach.
- **Stop screen:** unchanged (`ageGate.stopTitle`, then `ageGate.mistakeButton` after 24 h, D-026). VoiceOver reads the line; no haptic. BL-561 and #521 stay with counsel.

## 3. App lock offer (end of first run, after "The book is open.")

CPO-2: offered once, equal weight, off until turned on. Lamp scene `finish`.

```
  [appLock.offer.title]
  [appLock.offer.body.*]
  [ appLock.offer.turnOn.* ]  [ appLock.offer.notNow ]
```

- `Card raised` on the lamp; `ButtonRow` with two `Button secondary lg` (equal weight, never primary against quiet).
- **States:** device has no passcode: the card is not shown. Turn on runs `authenticateAsync` with `appLock.turnOnReason`, so the Face ID permission appears in context. Success: `success` haptic, toast `appLock.onToast.*` (also the announcement). Cancel: stays off, silent. Face ID denied: the lock uses the passcode and says `appLock.faceIdDenied`.
- **VoiceOver:** title (heading), body, Turn on, Not now.
- **Reduce Motion:** the card fades in with the step at `fadeMs`.

## 4. Lock screen and app switcher cover

CISO-1 (security.md section 2 is the spec). `PrivacyCover` (COMPONENTS 2.26) plus `Button primary lg` `appLock.unlock`, rendered by the root layout like the gate.

- **When:** cold start or after the grace period in the background, while the lock is on. Never during a take (applies after Stop) and never with the share sheet open (`appLock.recordingLine` explains it on the App lock page).
- **States:** prompting (system sheet with `appLock.unlockReason`, once on appear, never in a loop); cancelled (Unlock and nothing else); lockout (system passcode); success (the cover fades out over `fadeMs`, content within 1 s, no haptic); passcode removed (lock turns off, one toast `appLock.passcodeRemoved`); from a notification (cover, then the target). `appLock.biometricsChanged` ships only with a native check (CISO-1); not in 1 Dec.
- **VoiceOver:** the cover reads only `appLock.coverLabel`; focus lands on Unlock with hint `appLock.unlockHint.*`. Nothing on the cover ever names the child.

## 5. App lock page (Privacy and security, App lock)

CDesO-1 (the row is on home and in Privacy; one setting).

```
  [appLock.toggle.*]                    [Toggle]
  [appLock.askAfter]
  (o) [appLock.grace.immediately]
  (o) [appLock.grace.oneMinute]   (default)
  (o) [appLock.grace.fiveMinutes]
  [appLock.recordingLine]
  [appLock.footer]
```

- `Toggle` (hint `appLock.toggleA11yHint`); `ChoiceGroup layout="list"`, shown only when on; footer lines `footnote` `textMuted`. `grace.fifteenMinutes` only if F17-REQ-010 widens.
- **States:** turning on or off authenticates first (`turnOnReason`, `turnOffReason`); on plays `success`, off plays nothing; each change is announced with `onToast.*` or `offToast`. No passcode: toggle disabled, line `appLock.noPasscode`. Face ID denied: label becomes `toggle.passcode`, line `faceIdDenied`, `Button quiet` `appLock.openSettings`.
- **Ties:** Export your book re-authenticates first while the lock is on (`appLock.exportReason`). Reminders forces names off (section 10). `appLock.footer` is true only once that override ships with the lock (F17-REQ-015).

## 6. Settings home

CDesO-1 (five groups plus About), CCO-9 (a Plan row one tap from home in both builds), CDesO-6 (plan status words), CLO-5 (version row), CDesO-2 (sign-off). Today's home has 18 rows; this one has 14 in build 1 with one child.

```
 +--------------------------------------+
 | Mama                       Free  >   |   header card
 | [settingsHome.cardOnPhone]           |
 +--------------------------------------+
 [sections.children]  Asha >  Add a child >  (Hidden books >)
 [sections.writing]   Spoken language >  [yourWords] >
                      Reminders  Tue, Sat >  Appearance >
 [sections.letters]   [whereLive] >  Export your book >
                      Recently deleted >  Storage  575 MB >
                      [N: memoriesToggle]              [Toggle]
 [sections.privacy]   [appLock]  [appLockOn|Off] >  Privacy >
 [sections.help]      Help >  If you are struggling >  [legal] >
 [sections.about]     Version   [versionValue]
                      [settings.about.beta.body]
            (heart) [settingsHome.signOff]
```

- **Header card:** `Card raised`, one VoiceOver element: signs-as, then `cardOnPhone`, then `cardPlanA11y` ("Plan, Free"); hint `cardHint.plan`. Trailing value is the plan status: "Free", "Plus" or "Plus, shared" (CDesO-6; keys owned by `payments` and `content`). In build 1 the card opens Plan, so it is the one-tap Plan row CCO-9 asks for. Build 2 (1.1): the card shows `cardSignedIn.*` or `cardSignedOut`, opens Account (hint `cardHint.account`), and a `ListRow` "Plan" with the status value sits directly under it, so "Settings, Plan" still reads literally.
- **Memories on Tonight:** the switch F6 and CDesO-5 ask for, a `ToggleRow` in Your letters (it decides whether your own letters come back on Tonight). On by default. Label slot `settingsHome.memoriesToggle` and help line `settingsHome.memoriesHelp` (**N**, content to add). Turning it off removes the card at once (`fadeMs`); no toast, no haptic (a setting, not an outcome).
- **App lock row:** value `appLockOn` or `appLockOff`, opens section 5. Absent if the lock slips (see the top of this file).
- **About:** version row `{version} ({build})`, the build from `expo-application` `nativeBuildVersion`, never hard-coded; "early" is said once, in the registered note (CLO-5, K-13). The note's export nudge moves to Where your letters live.
- **`SignOff`** (COMPONENTS 2.27) is the last line, `settingsHome.signOff` (CDesO-2; fallback "Made with care" if legal prefers no place).
- Delete account leaves home (build 2: inside Account). The "Private by default" footer moves to Privacy.
- **VoiceOver order:** header card, then each section heading and its rows top to bottom, then the version row, the note, the sign-off. The heart is hidden.
- **AX5:** values stack under titles (Reminders' "Tue, Sat", Storage's size, the plan status under the name in the card). Nothing truncates; the card grows.

## 7. Where your letters live

F4 and CCO-8 (no copy saying the iPhone backup brings the book back until the device drill passes), CPrivO-4 (an export is not a restore).

```
 [whereLive.onPhoneTitle]
 [whereLive.onPhone]
 [whereLive.newPhoneTitle]
 [iphoneBackup.title]   [iphoneBackup.body]     [iphoneBackup.howTo] >
 [whereLive.exportTitle]  [lastSaved | exportEmpty] >
 [whereLive.backupTitle]  [whereLive.backupLater]
 [whereLive.footer]
 [whereLive.exportNudge]                      (only while no export exists)
 [orphansTitle]  3 >                          (only if above 0)
 [unplayableTitle]  1 >                       (only if above 0)
 [ whereLive.eraseRow ]                       (destructive ListRow)
```

- `ListRow`s. iCloud Backup's state cannot be read: the row states a fact and links to Apple's help (`howToHint`), never On or Off.
- **Drill gate (CCO-8):** until the restore drill passes, `iphoneBackup.body` and `footer` stay out of the build and the section shows Export and the encrypted backup row only. If the drill shows the letters database does not come back, `content` swaps to its recordings-only variants (content.md section 1 item 14).
- **Build 2 (1.1):** `onPhoneSynced` and `footerSynced`; the backup row becomes "Back up my recordings" when the owner backup flag is on.
- **VoiceOver:** each row one element; the destructive row reads its words (colour is never the signal).

## 8. Your words

Replaces the Word for word switch (settings-ia 4).

- `ChoiceGroup layout="list"`: `yourWords.marked.label` with `marked.line`, `exact.label` with `exact.line`. A static example in `letterBody` (`yourWords.example`) with one `EditUnderline` (its own label reads the mark). Footer `yourWords.footer`.
- `tap` haptic on change; the native radio state is announced. AX5: each option's line wraps under its label; the example letter wraps, never truncates.

## 9. Storage

NAQ-3 (the label fix proceeds; sizes stay variables until `speech-model-size.md` settles).

- Header row `storage.spaceUsed` with the total. One row per language with its size and Remove (`confirm()`: `removeConfirm`, `removeBody`, `removeButton`; `warning` haptic as the confirm appears). The language detector is never its own row; when shared, footer `storage.shared`.
- **States:** downloading (the progress replaces the size, cross-fading at `swapMs`; a determinate `ProgressLine` under the row; the row is `busy` and reads `downloadingA11y`); failed (`InlineState`, `storage.failed`, Try again); offline (`storage.offline`); empty (`storage.empty`). "Use cellular data" stays with its footer. Language download lives only here.

## 10. Reminders

CDesO-3 (no Settings pre-sheet, no confirm screen; keep the preview and the Next line), CCO-10 (the explanation footer is visible before the switch is turned on, with a test), CPO-3 (BL-536 rescoped). Detail and states: `proposals/reminders-settings.md` sections 2 and 4.

- Order: switch, "Changes save as you go.", How it will look (`NotificationPreview`), Next line, How often, Which evenings, Time, Month and birthday messages, Names in notifications. Footer lines show in every state, including off.
- The Next line cross-fades at `swapMs` (150), not 200. Saving is announced once, debounced 600 ms.
- **With the lock on:** Names in notifications is off and disabled; footer `reminders.lockNames`.
- Reminder words are `content`'s (`NOTIFICATIONS.md`, `notifications/COPY_INVENTORY.md`), not this file's.

## 11. Privacy

CPrivO-5 (three sections with content's lines, P6 replaced, "yet" dropped, every new line in the claims registry), NAQ-2 and CPrivO-1 (the listing's "delete everything" line waits for Erase).

```
 [trust.promise]            (plain text, no icon, D-061)
 WHERE YOUR BOOK IS KEPT    [P2]  [P3]  [P4]
 WHO CAN SEE IT             [privacy.whoLockOn.* | privacy.whoLockOff]
                            App lock  [On|Off] >   Names in notifications  Off >
                            [P8]
 WHAT YOU CAN DO            Export your book >  Recently deleted >  Erase everything on this phone >
 OUR PROMISES IN FULL       Privacy Policy >  Terms of Service >
 [privacy.footerPrivate]
```

- P2 to P8 are `privacy-settings.md` section 4 lines as `content` finalises them. No lock or shield icons (VOICE.md).
- VoiceOver reads in this order; each section title is a heading.

## 12. Erase everything on this phone

WP-F17-15, DATA-REQ-024; code in PR #520. Step 1 is a pushed page:

```
 [erase.title]
 [erase.body]
 [erase.exportFirst]   [ erase.exportButton ]
 [ erase.button ]       (Button destructive, not the large button)
```

- Step 2: `confirm()` with `confirmTitle`, `confirmBody`, `confirmButton` second and never the default; `warning` haptic as it appears; then device authentication (`erase.authReason`). Cancel at either step: back to step 1, silent.
- Erasing: `StateScreen loading` `erase.busy`, no way out. Done: the app returns to Before you begin, settings and reminders cleared; `erase.doneA11y` announced. Failure: `erase.failed`, Try again.
- AX5: Export comes first in the stack. Build 2 (1.1) uses `erase.bodySignedIn`.

## 13. Dark, light and contrast

| Part | Tokens | Light / dark (WCAG, DESIGN_LANGUAGE 2) |
|---|---|---|
| Rows and cards | `text` and `textMuted` on `surfaceRaised` | 14.83 / 14.29 and 5.83 / 7.32 |
| Links, quiet buttons | `accent` on `bg` | 5.50 / 8.37 |
| Checkbox edge | `controlBorder` on `bg` | 3.62 / 4.47 (3:1 non-text) |
| Checkbox ticked | `onAccent` check on `accent` fill | 5.82 / 8.11 |
| Destructive rows | `destructive` plus words, never colour alone | 5.35 / 6.99 on `surfaceRaised` |
| Lock cover | `bg` with the splash symbol (`ink` / `inkDark`) | opaque |

Increase Contrast swaps to `tokens.highContrast`; Reduce Transparency and Increase Contrast show plain paper.
