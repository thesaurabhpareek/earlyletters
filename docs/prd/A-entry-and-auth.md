# Launch PRD, Section A: Entry and sign-in

Owner: Lead A. Draft v1, 1 Oct 2026. **Revised Oct 2 2026 per PRD.md conflict log** (K-01, K-07, K-08, K-11, K-15, K-16, K-24); [PRD.md](PRD.md) wins where they differ. iOS at launch, Android later; every requirement must work on both.
Siblings: **B** (first-run profile, children, goals, co-parent and privacy, templates and themes), **C** (reminders, celebrations, preferences, settings, pricing, trial and paywall).
Evidence keys: **UR** `docs/research/USER_RESEARCH.md`, **CR** `COMPETITIVE_RESEARCH.md`, **ARCH** `docs/ARCHITECTURE.md`, **DL** `docs/design/DESIGN_LANGUAGE.md`, **MO** `MOTION.md`, **CRE** `CREATIVE.md`, **CMP** `COMPONENTS.md`, **VOICE**/**BRAND** `packages/content/`. External sources [A#] at the end.

## 0. Key decisions

1. **First letter before the account.** Stories, then Lead B's minimal profile, then the first letter, then the sign-in sheet. Evidence: UR §6 R1 (≤ 90 s to first saved letter, no tutorial before recording); UR §2.2 (NN/g: carousels add no task success); CR §2 (Tinybeans: value before personal data, +885% completion); DL §12 Onboarding. ARCH §4 makes it possible: capture, transcription and save are local.
2. **Account strongly offered, never forced for local use.** Sign-in is required only for server features (family, backup, second phone). Apple 5.1.1(v) [A1].
3. **Three methods, one sheet:** Apple, Google, email. Email (Supabase, as in Lumira) sends a magic link **and** a 6-digit code in one message, so it works when the link opens in the wrong place.
4. **No Supabase anonymous auth in the app in v1.** It needs network at first launch and has a 30/hour per-IP limit [A4]. Pre-account data stays local and is re-owned on sign-in. *Revised Oct 2 2026 per PRD.md conflict log K-08:* the web contribution page (B F6) may use anonymous sign-in, created at the first Send; the app never does.
5. **Four stories, not five,** with a remote switch to three or none. The brief asks 4 to 5; UR §6 R1 caps intros at 3. Tested (Q1).

## 1. Goals and non-goals

**Goals**
- G1. First letter saved within 90 s median of first launch (UR §6 R1).
- G2. ≥ 70% of first-letter users create an account within 7 days (assumption; reset after dogfood).
- G3. Returning user back in their book on a new phone in under 2 minutes.
- G4. Invited family land on the right book without the new-parent stories.
- G5. No content, names or audio in entry analytics (ADR 0008).

**Non-goals (v1):** passwords, SMS, passkeys; merging two existing accounts; child sign-in; profile, invites, roles (B); settings, deletion UI, paywall (C); no-install grandparent web flow (B).

## 2. User stories

As a:
- US1. tired parent holding a baby, I start talking within seconds, no account first.
- US2. existing user, I see "Sign in" from the first screen.
- US3. privacy-minded parent, I hide my email and still have my book on any phone.
- US4. parent on a new phone, I sign in the same way and see every letter.
- US5. Nani tapping a WhatsApp link, I land on my grandchild's book, not a pitch.
- US6. parent whose email opens links in a browser, I type a code instead.
- US7. VoiceOver user, I move through the intro at my own pace.
- US8. parent with no signal on the ward, I open the app and record.

## 3. Flows

### F1. Cold start
1. Native splash: `bg` paper (light #FBF8F3, dark #161412), centred envelope line mark, no text. (Scaffold splash is Expo blue #208AEF; replace.)
2. Restore session from secure storage without network, read local state, render first route, hide splash.
3. Branch: pending invite token → F7; signed in or has local letters → Tonight, no animation (MO §5a); first launch → step 4 then F2.
4. Brand moment, first launch only: mark draws via `strokeDashoffset` (600 ms), "Letters for someone small." fades in; ≤ 900 ms total (MO §3 `sequenceMaxMs`); tap skips. Reduce Motion: drawing complete, 200 ms fade.

### F2. Story intro
1. Top: progress bars, **Pause**, **Skip**. Bottom: quiet **Sign in**.
2. Stories 1 to 3 auto-advance after 6 s; story 4 never does.
3. Tap right two-thirds = next; tap left third = previous; hold ≥ 200 ms = pause, release = resume; horizontal swipe = next/previous; vertical swipe does nothing.
4. Skip jumps to story 4's action panel, so the user still chooses.
5. Story 4 actions: **Start a book** (primary, 56 pt) → Lead B profile → Tonight → first letter → F3. **I was invited** → F7. **Sign in** → F4.
   *Revised Oct 2 2026 per PRD.md conflict log K-07 (founder decision: 18+ only, no local-only mode):* every story 4 action, and an invite link that skips the stories, first passes the **18+ entry gate** (PRD-REQ-019): "Are you 18 or older?" with Yes and No, nothing preselected; iOS Declared Age Range where required. Yes is remembered on the install as a boolean (never an age or birth date) and the gate never shows again. No, or an under-18 signal: a stop screen saying the product is currently for adults 18 and over; nothing is created or stored; no first run, recording or local book; the stop screen stays for 24 hours on the install (LEGAL-REQ-002 anti-retry), after which the question may be asked again. Copy: `ageGate.*` (mobile engineer).
6. Backgrounded: pause; on return restart the current story.
7. After any story 4 action, stories never show again on this install.

### F3. Account after the first letter
1. Trigger: first letter commits locally (MO §5e: commit, haptic, animate). When the save animation settles, the **Keep the book** sheet opens (medium detent).
2. Content: title, one line on family and new phones, Apple, Google, Email, privacy notice (§7), **Later**.
3. Later: the app works locally. Re-offer only at (a) Invite someone (required), (b) turn on backup (required), (c) once after the third saved letter. Max once a day; no badge or counter.
4. Success: local letters, children and dictionary terms move to the new user id in one transaction, then sync starts (ARCH §4 step 7).
   *Revised Oct 2 2026 per PRD.md conflict log K-07, K-15:* account creation runs in this order: (a) provider sign-in with the Terms notice and the 18+ confirmation line, recorded in `policy_acceptances` with `age_attested` from the entry gate, (b) a separate sensitive-data consent screen for new accounts, (c) re-ownership and sync. Declining (b) keeps an adult's letters local. *Revised again Oct 2 2026 (founder decision):* the age question is no longer on the sign-in sheet; it is the 18+ entry gate before first run (F2.5, PRD-REQ-019). There is no local-only mode for under-18 users.
5. Account already has children → F6.3.

### F4. Sign-in sheet (used by F2, F3, F6, F7)
Order: iOS Apple, Google, Email; Android Google, Apple, Email. Equal button sizes.
- **Apple, iOS:** native Authentication Services, hashed nonce, Supabase `signInWithIdToken`. Save the name on first sign-in; Apple returns it only once [A5]. Cancel returns silently.
- **Apple, Android:** Supabase OAuth with PKCE in an in-app browser, back via App Link [A5].
- **Google:** iOS native Google Sign-In SDK; Android Credential Manager (legacy Google Sign-In deprecated) [A6]; ID token to `signInWithIdToken`.
- **Email:** labelled field, email keyboard and autofill. Send → "Check your email" screen: address shown, 6-digit code field (autofill, paste, auto-submit), **Open email app**, **Send a new email** (after 60 s), **Use a different email**. Link and code are single use and expire in 1 hour [A3].
- **After success:** has children → Tonight (or F6.3 if local data). No children and came via "Sign in" → card "No book here yet. Did you use a different way to sign in last time?" with **Try another way** and **Start a book**.

### F5. Magic link deep link
1. Link: `https://<app domain>/auth/confirm?token_hash=<hash>&type=email`; domain from `packages/brand`.
2. App installed → universal link or App Link opens app → `verifyOtp({ token_hash, type })` → F4 success.
3. Opens in a browser (no app, mail in-app browser, desktop) → page **does not verify on load**, because mail scanners prefetch links and would burn the token. Page shows **Open Early Letters** (scheme fallback) and the code to type.
4. Expired or used → expiry copy with one-tap resend to the same address.
5. Works across devices (token hash is not device-bound). If another account is signed in on this phone → confirm switch; unsynced letters block it (F6.4).

### F6. Returning user
1. Entry: story "Sign in" or the account row in Lead C settings.
2. The install remembers the last method (never the email): "Last time you used Apple." Apple private relay addresses never match a Google address, so people pick the wrong door (UR §2.3).
3. **Merge prompt:** signed in to an account with children while local letters exist → "Add the letters on this phone to {child}'s book?" Per local child: add to an existing child or keep as a new book. Nothing local is deleted.
4. **Sign-out guard:** never discard unsynced letters; stay signed in until they sync.
5. New phone: book shows immediately, letters arrive; audio restore per ARCH §8 and ADR 0006; pending audio shows "Preparing voice" (DL §12).

### F7. "I was invited"
1. Entry: invite link `https://<app domain>/i/<token>`, story 4 button, or code screen.
2. Link token goes to secure storage before any UI; stories are skipped.
3. Without a link: "Paste the invite link or type the code", with a **Paste** button (clipboard read only on that tap) and a code field.
4. Not signed in → F4 titled "Sign in to join the family book" (child name only if Lead B approves Q5).
5. Signed in → existing `accept_child_invite(token)` RPC; errors map to §9.
6. Hand off to Lead B's invitee welcome (Large Print offer, role).
7. App not installed: iOS has no reliable install-through link, so the invite page shows the code and "Get the app, then tap I was invited."

### F8. Offline at launch
Everything before sign-in works offline (assets bundled). Sign-in buttons disable with offline copy; Later stays. An offline magic link retries on reconnect.

### Edge cases
- Hide-my-email Apple user later uses a real email: new empty account, F4 hint fires, "Ways to sign in" links methods (A-REQ-019).
- Same verified email via Google and email: linked automatically [A2].
- Email typo: nothing is created until verified.
- Shared phone: one account per install in v1.

## 4. Story content

DL §9 and CRE §3 forbid stock baby photos, faces and newborn props; the brief allows licensed stock. Resolution: **line illustration is the default**; one optional photo slot per story, documentary, hands or objects only, **no identifiable children in v1 even with a model release** (stricter than the brief). Design leads approve each photo. Photos 4:5 portrait, upper 55% of screen, text below, never overlaid (DL §9).

| # | Headline (Literata `title1`) | Line (Mukta `body`) | Default visual | Photo slot (optional) |
|---|---|---|---|---|
| 1 | Talk for a minute. | Tell your child about today. It becomes a letter in their book. | Line folds into an envelope. | Adult hand holding a phone by a bedside lamp at night. Quiet, warm, low light. Portrait. No faces. |
| 2 | Exactly as you said it. | We fix slips of the tongue. We never rewrite your words. | Real UI: letter with one quiet underline, Hinglish text from CRE §4 ("Asha, aaj tumne pehli baar spoon pakda, and then threw it at me."). | None; product UI only. |
| 3 | Read together, in your voice. | Years from now, your child can hear how you sounded tonight. | Dark mode, moon drawing. | Phone glowing on a pillow, small blanket, dark room. Calm. Portrait. No faces. |
| 4 | From Nani, from Papa, from everyone. | Only the family you invite can read or hear these letters. | Two drawn hands over one phone (CRE §3). | Older adult's hands holding a phone at arm's length, glasses nearby. Tender, everyday. Portrait. Hands only. |

Evidence: 1 UR §5 job 1; 2 BRAND pillar 1, CR §5 white space 1; 3 CR §4 praise 4, UR §5 delight 1; 4 UR §5 job 4, UR §2.1 (63% worry about identifying sharing). No feature tour (UR §2.2). Silent; P2: story 3 "Hear an example" plays a released family recording (CRE §7).

## 5. Requirements

P0 = launch blocker, P1 = launch target, P2 = later.

**Launch**
- **A-REQ-001 (P0) Branded splash.** Given a cold start, when the launch screen shows, then it uses paper background and envelope mark in the system appearance and matches the first frame without a jump (Android 12+: static splash-API icon).
- **A-REQ-002 (P0) No blocking.** Given a cold start, when the first route lays out, then the splash hides; it never waits on network, model download or sync.
- **A-REQ-003 (P1) Brand moment.** Given first launch, when the splash hides, then the mark draws in ≤ 900 ms; given a tap, then it ends; given Reduce Motion, then a 200 ms fade replaces it.

**Stories**
- **A-REQ-004 (P0) Gestures.** Given the intro, when the user taps right or left, swipes or holds, then F2.3 behaviour occurs.
- **A-REQ-005 (P0) Exits reachable.** Given any story at any Dynamic Type size, then Skip and Sign in are visible without scrolling and ≥ 44 pt.
- **A-REQ-006 (P0) Timing.** Given stories 1 to 3 untouched for 6 s, then the next shows; given Pause or hold, then timer and bar stop; story 4 never advances.
- **A-REQ-007 (P0) Screen readers.** Given VoiceOver, Switch Control or TalkBack, when stories open, then auto-advance is off, each story is one element ("Story 2 of 4. Exactly as you said it. We fix slips of the tongue."), and Next/Previous exist as buttons and accessibility actions.
- **A-REQ-008 (P0) Reduce Motion.** Given Reduce Motion, then auto-advance is off, a Next button shows, transitions are 200 ms fades, and bars show done/current without continuous fill.
- **A-REQ-009 (P1) Silent.** Given the intro, then no audio plays and the audio session stays inactive.
- **A-REQ-010 (P1) Once.** Given a story 4 action was taken, when the app relaunches, then stories never show on this install.
- **A-REQ-011 (P1) Variant switch.** Given remote config `intro_variant` = `three`, then story 3 is omitted; `none` opens the story 4 panel directly.

**Account timing**
- **A-REQ-012 (P0) Letter first.** Given Start a book, when the user completes B's profile and saves a letter, then no sign-in was required. *Revised Oct 2 2026 per PRD.md K-07:* the 18+ entry gate (PRD-REQ-019) comes before B's profile; it is a question, not a sign-in.
- **A-REQ-013 (P0) Keep the book sheet.** Given the first letter committed, when the save animation ends, then the F3 sheet opens with Apple, Google, Email and Later.
- **A-REQ-014 (P0) Later works.** Given Later, then record, review, save, book, Read together (within the free tries; revised Oct 2 2026 per PRD.md conflict log K-11) and PDF export work; the sheet returns only at F3.3 moments, max once a day.
- **A-REQ-015 (P0) Re-ownership.** Given local data and a successful sign-in, then all local rows move to the user id in one transaction before sync; on failure nothing changes and Retry shows.

**Methods**
- **A-REQ-016 (P0) Apple on iOS.** Given iOS, when Apple is tapped, then native sign-in runs with a nonce and the first-sign-in name is saved; the button follows Apple's button guidelines and is no smaller than Google's.
- **A-REQ-017 (P0) Google.** Given iOS or Android, when Google is tapped, then a native ID token is exchanged with Supabase; Android uses Credential Manager with a persistent button [A6].
- **A-REQ-018 (P0) Email link and code.** Given an email is submitted, then one email arrives with a link and a 6-digit code, each single use for 1 hour; using either signs in.
- **A-REQ-019 (P1) Ways to sign in.** Given a signed-in user in "Ways to sign in" (screen inside C's settings), then they can add Apple, Google or email (manual linking on) and remove one while two remain [A2].
- **A-REQ-020 (P1) Apple on Android.** Given Android, when Apple is tapped, then OAuth with PKCE completes and returns to the app.
- **A-REQ-021 (P1) Last method.** Given a prior sign-in on this install, then the sheet shows "Last time you used {method}." and no email is stored.

**Links and limits**
- **A-REQ-022 (P0) Universal and App Links.** Given the app is installed, when an auth or `/i/` link opens from Mail, Gmail, Outlook or Messages, then the app opens the right flow; AASA and `assetlinks.json` are served from the brand domain [A10].
- **A-REQ-023 (P0) Scanner-safe page.** Given a link opens in a browser, when the page loads, then no token is verified; Open in app and the code show.
- **A-REQ-024 (P0) Expired link.** Given an expired or used token, then expiry copy and a one-tap resend show.
- **A-REQ-025 (P0) Resend limits.** Given a sent email, then resend is disabled 60 s with "You can send another in a minute." (no ticking numbers); max 5 per address per hour.
- **A-REQ-026 (P0) Custom SMTP.** Given production, then auth email uses custom SMTP on the brand domain with SPF, DKIM and DMARC; Supabase's built-in sender allows 2 per hour [A4].
- **A-REQ-027 (P0) Code attempts.** Given 5 wrong codes for one address in 15 minutes, then entry pauses 15 minutes; server verify limits stay at Supabase defaults (30 per 5 min per IP) [A4].

**Invites, offline, errors**
- **A-REQ-028 (P0) Invite token.** Given an invite link at cold or warm start, then the token is stored securely before UI, stories are skipped, and the token survives sign-in and an app kill.
- **A-REQ-029 (P0) Code entry.** Given "I was invited", then Paste and a code field accept a link or code; clipboard is read only on tap.
- **A-REQ-030 (P0) Offline.** Given no network, then F1, F2, B's profile and the first letter work; the sheet explains offline and keeps Later.
- **A-REQ-031 (P0) Errors.** Given an auth error, then a specific §9 message shows with icon and words (DL §2); cancels show nothing.
- **A-REQ-032 (P1) Session restore.** Given a stored session and no network, then the user lands in Tonight signed in; refresh on reconnect and foreground.
- **A-REQ-033 (P0) Apple revoked.** Given Apple reports a revoked credential (checked at launch), then sign-out happens only after unsynced letters sync, then sign-in shows.

**Consent**
- **A-REQ-034 (P0) Terms.** Given the sign-in sheet (the 18+ entry gate already answered Yes; PRD-REQ-019), then above the provider buttons it shows the §7 notice and "By continuing, you agree to the Terms and Privacy Policy." (links open in-app); accepted version, time, method and app version are stored as an append-only `policy_acceptances` row (LEGAL-REQ-001), not on the profile. *Revised Oct 2 2026 per PRD.md conflict log K-07, K-15.*
- **A-REQ-035 (P0) Notice before data.** Given Start a book, when B's first field appears, then the notice has already been shown on story 4; entry never requests contacts.

## 6. Non-functional requirements

Reference devices: iPhone SE (3rd gen) and a mid-tier 60 Hz Android (MO §7).
- **A-NFR-001 Cold start.** First interactive frame p50 ≤ 1.2 s, p90 ≤ 2.0 s (iPhone SE 3); p50 ≤ 2.0 s, p90 ≤ 3.0 s (Android). Warm start p50 ≤ 400 ms.
- **A-NFR-002 Launch path.** No model load or awaited network; fonts embedded. Analytics and crash reporting start only after the user opts in on the consent sheet (LEGAL-REQ-003), and then after first frame. *Revised Oct 2 2026 per PRD.md conflict log K-01.*
- **A-NFR-003 Stories.** UI-thread animation, no frame over 16.7 ms; images ≤ 250 KB each, total intro assets ≤ 1.5 MB, bundled.
- **A-NFR-004 Auth speed.** Native Apple/Google ≤ 3 s p90 after the OS sheet closes; auth email delivered ≤ 30 s p90.
- **A-NFR-005 Accessibility.** WCAG 2.2 AA both themes (DL §2); Dynamic Type to AX5 on every entry screen; text never truncates, buttons grow, story image yields space first (DL §3).
- **A-NFR-006 Gestures.** Every gesture has a button or accessibility action (DL §11.3); auto-advance is pausable and off under assistive tech (WCAG 2.2.1, 2.2.2).
- **A-NFR-007 Screen readers.** VoiceOver and TalkBack labels everywhere; errors announced; focus moves to sheet title on open (CMP §0.1).
- **A-NFR-008 Token storage.** Session and invite tokens only in Keychain or Keystore-backed storage, never plain AsyncStorage; invite token deleted after acceptance.
- **A-NFR-009 Provider hygiene.** Hashed Apple nonce; Supabase verifies Google ID tokens; Apple `.p8` client secret rotated before its 6-month expiry, with a named owner [A5].
- **A-NFR-010 Redirects.** Allowlist only the brand domain and app scheme. Scheme must change from scaffold `lumiraletters` (app.json) to one derived from `packages/brand`.
- **A-NFR-011 Deletion.** Account deletion revokes Apple tokens via Apple's REST API [A7] (UI is C's).
- **A-NFR-012 Analytics privacy.** No email, names, tokens or free text in events; random analytics id (ADR 0008); Sentry strips URLs containing `token_hash` or `/i/`.
- **A-NFR-013 Reliability.** Auth success (excluding cancels) ≥ 97% per method weekly; alert below 93%. A crash during sign-in never loses a local letter or invite token.
- **A-NFR-014 Localization.** *Revised Oct 2 2026 per PRD.md conflict log K-24: en-US only at launch; the rest of this item is P2.* Entry strings in en-US, en-IN and Hindi (Devanagari), translated by a native speaker. Mukta covers both scripts (DL §3); layouts tolerate 40% longer strings; provider buttons use their own localized labels; code fields accept Devanagari digits.

## 7. Privacy and consent at entry

**Child data notice** (two sentences, UR §6 R22), on story 4 and the sign-in sheet:
"Your letters are private to you and the family you invite. No ads, no selling or sharing your data, and you can export or delete your letters any time." *(Revised Oct 2 2026 per PRD.md conflict log K-16; counsel approves via the claims registry.)*

**COPPA does not apply; flag the rest for counsel**
- COPPA covers services directed to children under 13 or with actual knowledge of collecting personal information **from** a child [A8, FAQ A.2]; it "only applies to personal information collected online from children" [A8, FAQ A.8]. Our users are adults writing about a child; the child never signs in or types.
- For counsel: (1) Read together played to a child is not collection; (2) Apple 5.1.4 still requires a privacy policy and children's-privacy compliance when collecting information about a minor, and 2.3.8 bars "for kids" metadata [A1]; (3) India DPDP Act 2023 (under-18s, verifiable parental consent): confirm the parent-as-provider model; (4) GDPR Art. 8 if offered in Europe; (5) US state minors' data and voice laws; (6) ~~Terms say users are 18+, no age gate.~~ *Revised Oct 2 2026 per PRD.md conflict log K-07:* neutral 18+ gate at account creation (F3.4) with store age signals (Texas SB 2420, LEGAL-REQ-002). *Revised again Oct 2 2026 (founder decision):* the gate moves to first launch, before any child detail or recording (F2.5, PRD-REQ-019); under 18 sees a stop screen and cannot use the app, locally or otherwise.
- Analytics consent: *Revised Oct 2 2026 per PRD.md conflict log K-01:* opt-in everywhere (Apple 5.1.1(ii), LEGAL-REQ-003). Nothing is sent before a choice. The consent sheet is the third ask after the first letter, one ask per session (PRD-REQ-001). The analytics events in §10 cover consenting users only.

## 8. Platform compliance check

| Rule | Says | Our answer |
|---|---|---|
| Apple 4.8 [A1] | Third-party login needs an equivalent option limiting data to name and email, allowing a hidden email, no ad tracking; exempt only with exclusively own sign-in. | Google means no exemption; Sign in with Apple qualifies: P0 (UR §2.3). |
| Apple 5.1.1(v) [A1] | No login if no significant account features; account creation requires in-app deletion. | Local use without account (A-REQ-014); deletion in C. |
| Apple deletion guidance [A7] | Full deletion, not deactivation; revoke Sign in with Apple tokens. | A-NFR-011. |
| Google Play User Data [A9] | Account creation requires in-app deletion plus a web deletion link. No specific sign-in method required. | C in-app; web page on brand domain. |
| Android sign-in [A6] | Credential Manager recommended; legacy deprecated. | A-REQ-017. |
| Play target audience | Declare adult audience (Families policy is for child-directed apps). | **Unverified**, page not opened; confirm before Android. |

## 9. Copy

Rules (VOICE; `packages/content/test/rules.test.ts`): no em or en dashes, curly quotes, ellipsis character or emoji; no guilt, fear or urgency; never imply software writes letters; `{child}`, never gendered; no gap counts. Invitee screens follow "Writing for grandparents". Strings in `packages/content`; name from `packages/brand`.

| Key | Copy |
|---|---|
| auth.sheet.title | Keep {child}'s book on any phone |
| auth.sheet.body | Sign in so the family you invite can write too, and so your letters can come with you to a new phone. |
| auth.email.sent | We sent a link and a code to {email}. Tap the link, or type the code here. |
| auth.email.resendWait | You can send another in a minute. |
| auth.email.limit | That's a lot of emails for one hour. Try again a little later. |
| auth.code.wrong | That code didn't match. Check the newest email, or send a new one. |
| auth.code.pause | Let's take a short break. Try again in 15 minutes. |
| auth.link.expired | That link has expired. We can send a new one. |
| auth.offline | You're offline. Your letter is saved on this phone. Sign in when you're back online. |
| auth.noBook | No book here yet. Did you use a different way to sign in last time? |
| invite.expired | This invite has expired. Ask {inviter} to send a new one. |
| invite.used | This invite has already been used. Ask for a new one if that wasn't you. |
| invite.notFound | We couldn't find that invite. Check the link or code and try again. |

Banned: "don't lose", "before it's gone", "AI", "smart".

## 10. Analytics (allowlisted, no content)

Via `packages/analytics` (ADR 0008); enums, booleans and buckets only.

| Event | Properties |
|---|---|
| `app_cold_start` | `ttfi_bucket`, `platform`, `first_launch` |
| `intro_story_view` | `index`, `via` (auto, tap, swipe), `variant` |
| `intro_paused`, `intro_skipped` | `index` |
| `intro_action` | `action` (start, invited, sign_in), `stories_seen` |
| `auth_sheet_shown` | `trigger` (first_letter, invite, backup, third_letter, sign_in, settings) |
| `auth_method_selected` | `method` (apple, google, email) |
| `auth_succeeded` | `method`, `new_user`, `had_local_data`, `linked_existing` |
| `auth_failed` | `method`, `reason` (cancelled, network, expired, used, wrong_code, rate_limited, provider, unknown) |
| `auth_email_sent` | `attempt` |
| `auth_email_verified` | `via` (universal_link, scheme, code) |
| `auth_deferred` | `trigger` |
| `invite_opened` | `via` (link, code, paste), `signed_in` |
| `local_merge_choice` | `choice` (existing, new) |

Funnel by method (UR §2.3: no public benchmark).

## 11. Open questions

- Q1. Four stories or three? A/B `intro_variant` on time to first letter and day-7 retention (UR §6 R1 vs brief).
- Q2. If under 50% of first-letter users have an account by day 7, require sign-in at the second letter? Durability (ARCH §2 attribute 1) vs friction.
- Q3. `packages/brand` still has `example.com` and a TODO company; universal links, SMTP and the Apple Services ID are blocked until set.
- Q4. ~~Analytics default by region.~~ Resolved Oct 2 2026 (PRD.md K-01): opt-in everywhere.
- Q5. May the invite lookup show the child's first name before sign-in? Privacy (UR §2.1) vs warmth (B).
- Q6. Hands-only photo exception to DL §9, or illustration only? Design leads.
- Q7. Passkeys after sign-up (UR §2.3) as P2.

## 12. Dependencies

**Lead B:** first-run profile after Start a book (name, birth or due date, UR §6 R2), offline and pre-account; invitee welcome after F7.6 with Large Print offer; invite creation and `/i/<token>` format; Q5; notice placement consistent with §7.

**Lead C:** settings account row, "Ways to sign in" host (A-REQ-019), sign-out guard (F6.4), account deletion with Apple token revocation (A-NFR-011), web deletion page for Play. Paywall never before the first letter or inside the sign-in sheet. Notification primer only after the first letter (UR §6 R7) and never stacked on the Keep the book sheet.

**Engineering:** custom SMTP; AASA and `assetlinks.json` on apps/web (ADR 0010); Supabase manual linking on, OTP expiry 3600 s, redirect allowlist; Apple key rotation owner.

## Sources (opened 1 Oct 2026)

- [A1] Apple App Review Guidelines 4.8, 5.1.1(v), 5.1.4, 2.3.8: https://developer.apple.com/app-store/review/guidelines/
- [A2] Supabase identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking
- [A3] Supabase passwordless email: https://supabase.com/docs/guides/auth/auth-email-passwordless
- [A4] Supabase rate limits; anonymous sign-ins: https://supabase.com/docs/guides/auth/rate-limits ; https://supabase.com/docs/guides/auth/auth-anonymous
- [A5] Supabase Sign in with Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- [A6] Android Credential Manager, Sign in with Google: https://developer.android.com/identity/sign-in/credential-manager-siwg
- [A7] Apple, Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- [A8] FTC, Complying with COPPA FAQ: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- [A9] Google Play account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- [A10] Expo iOS universal links: https://docs.expo.dev/linking/ios-universal-links/
- **Unverified** (general knowledge): mail scanners prefetching links; in-app mail browsers ignoring universal links. Mitigated by A-REQ-023 and the code.
