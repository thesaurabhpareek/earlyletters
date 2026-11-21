# Moments tab, X6: an occasion signal for push and email nudges (PROPOSED)

Status: PROPOSED. Docs only. Nothing here is decided, built, migrated or recorded in `DECISIONS.md`.
Lead: X6, cross-functional privacy and data. Branch `wip/moments-x6`. Date: 21 Nov 2026.
Not legal advice. Every legal, Apple or CAN-SPAM reading ends with "counsel must confirm".
Fictional family Asha only. The founder's reference screenshots are not opened and nothing from them is used.
No migration is written. Where a table or column would be needed, section 7 describes it and stops.

## 0. The short answer

The founder's direction (21 Nov, three messages, verbatim in the task): send "the signal of occasion and some meta data info" so push and email can work; do it only after the parent gave photo access, never without; and treat the email as a product lifecycle email to an account holder who opted in, not marketing.

The recommended design, in five lines:
1. Push needs no server signal. A local notification, planned by the phone, already carries every occasion the phone knows (child's dates, parent-created days). It is the push answer in every phase; remote push (E79) is not needed and is not recommended.
2. Email gets exactly one new server fact: a date the parent chose, with an opt-in per occasion, no label, no kind, no place, no people, deletable at once. The server already holds the child's date of birth and letter dates for signed-in synced books, so those need no new signal, only an email choice.
3. The email is built as a lifecycle email to the account address only: one purpose (the reminder the parent set up), no offer, no upsell, no third-party content, and to the stricter commercial standard (sender, truthful subject, postal address, one-click unsubscribe, its own off switch in Settings that never touches account or safety mail). Whether the law calls it transactional or commercial is counsel's call.
4. The library never feeds the server silently. After photo access is granted, the phone may use the library on the phone (cards, and a local reminder only in the identical-words form) with no label change. The smallest server-bound library-adjacent signal is one date the parent confirms with a tap on a day sheet, behind a separate opt-in shown on the same primer, off by default, held until counsel answers CQ-16.
5. Consent for photo access does not by itself cover a value leaving the phone, does not settle the Photos or Videos label, does not satisfy the purpose-string rule on its own, does not settle App Review 5.1.2(vi), and does not make an email non-commercial. Section 6.1 says this plainly.

Signal tiers at a glance (detail in sections 4 and 5):

| Tier | What it is | Reaches server? | Push | Email | Reversal the founder owns |
|---|---|---|---|---|---|
| 1 | Dates we already know: date of birth, month-age, birthday, a year ago from kept letters | Only what the server already holds (dob, letter dates) in a signed-in synced book | Local, yes | Optional, per-child opt-in, default off | E75 (any lifecycle email), CATALOG principle 5 and line 161 for dob-anchored email |
| 2 | A date the parent creates ("Remind me about this day", or types a day) | Date, repeat flag, channel, nothing else | Local, yes | Yes, per occasion opt-in | E75 |
| 3 | A kind from a closed list the parent picks | Not in phase 1; later one of four values, email body only | Local, in app only | Later, body only | E75, plus a new inventory row |
| 4a | Library facts used on the phone after photo access | No | Local identical-words form only | Never | NX-39 ruling 3 and K1 (local form), BL-1305 |
| 4b | One date the parent confirms from a day sheet the phone showed | Date only, no provenance, behind a separate opt-in | Local | Through the Tier 2 path | NS-51-R26 narrowed, label, CQ-16 |
| 4c | Silent scan results, counts, kinds, "pictures exist on a date" | Never | Never | Never | Not offered. Refused (section 5.6) |

## 1. Purpose and scope

Purpose: find the widest design in which Moments-driven push and email nudges can work through an occasion signal plus limited metadata, and stay inside the constitution, App Review 5.1.2(vi), the licence 3.3.3(H), the Data Not Collected label per data type, NX-39 ruling 3, E75, E79 and CAN-SPAM.

In scope: tiers and what each may do; the server tables, RLS, deletion, export; email consent and unsubscribe; push token handling; quiet hours and the one-a-day budget; copy rules; analytics; phases; rejected options; founder decisions.

Out of scope: tab position, visual design, the permission primer screens themselves (P3, design), the photo read (feasibility, #1269), final parent words (`content`), legal text (`docs/legal/**`, founder and counsel).

Reading rule used throughout: the label is read per data type (X2 finding F1). "Data Not Collected" for the whole app is false today; the claim that must hold is "not collected" for Photos or Videos, Precise and Coarse Location, Contacts, Health and Fitness.

## 2. Inputs read

Read this session in a plain clone of `develop` (head `fdf34a58`) and on the named branches and PRs.

| Id | Source | Used for |
|---|---|---|
| I1 | `/home/claude/moments-brief.md` | Brief of record, reversals, content rules |
| I2 | `origin/wip/moments-x1` `X1-legal.md` (legal) | Apple rules, reversals, CQ numbering, claims |
| I3 | `origin/wip/moments-x2` `X2-policy.md` (policy) | Label table, email classification, opt-in states, MT-X2-R25 to R34 |
| I4 | `origin/wip/moments-x3` `X3-architecture.md` | Engine, planner seam, `moment-email` job, kill switches |
| I5 | `origin/wip/moments-x5` `X5-data.md` | What lives where, classification, no server table, E75 migration list |
| I6 | `origin/wip/moments-t5`, `moments-p5`, `moments-p3` | Landing rules, channel matrix, consent and primer, RV and Q ids |
| I7 | PR #1267, #1269, #1270 (branch docs read) | Privacy read section 10, CQ-11 to CQ-15, feasibility nudge section, design concept |
| I8 | `docs/emails/CATALOG.md` (principle 5, lines 57, 63, 75, 139, 158, 161), `docs/emails/COMPLIANCE.md` (sections 0, 1) | Email rules |
| I9 | `docs/product/prd/18-errata-after-lock.md` E75, E79 (lines 275 to 316) | The email and push rulings |
| I10 | `docs/product/prd/11-foundations.md` NS-32-R1 to R16; `09-capture.md` NS-18-R1 to R7; `21-days-cultural-photos-home.md` NS-46-R47 | Budget, typed days, faith in marketing |
| I11 | `docs/design/NOTIFICATIONS.md` sections 1, 5 | Local reminders, the "away" date idea, photo push decision |
| I12 | `docs/legal/DATA_CLASSIFICATION.md` (levels, `entries.occurred_on` L3, `children.date_of_birth` L4) | Classification |
| I13 | `apps/mobile/app.config.ts` lines 120 to 195, `apps/mobile/eas.json`, `apps/mobile/src/app/+native-intent.tsx` header | Server features flag per profile |
| I14 | `packages/analytics/src/consent.ts` | Analytics consent shape |
| I15 | `supabase/migrations/*` searched for a push token table | None found |

Read on the web this session (VERIFIED, 21 Nov 2026):
- W1. Apple App Review Guidelines, first 100000 of 121052 characters: 4.5.4, 5.1.1(iii) and (iv), 5.1.2(i) to (vi), quoted in section 3.
- W2. Apple Developer Program License Agreement, 8 Oct 2025, first 100000 of 381649 characters: section 3.3.3(H) quoted in section 3.
- W3. FTC CAN-SPAM compliance guide: opt-out honoured within 10 business days; opt-out mechanism must work for at least 30 days; physical postal address; per-email penalty up to $53,088; transactional or relationship category is read narrowly.

Not read: `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `docs/legal/app-store-privacy-labels.md` (relied on I2 and I3 for the label answers), PR #1215, the DPLA after character 100000, App Review after character 100000, any Apple page on local notifications or APNs, the regulatory-compliance skill, the `policy_acceptances` migration body.

## 3. Findings that change the founder's premise (read these first)

F1. Server features are on in the `production` profile, off in `testflight`, `development` and `e2e`, on in `preview` (VERIFIED, `apps/mobile/eas.json`, read profile by profile; `EXPO_PUBLIC_ANALYTICS` is off in all of them). So accounts, sign-in and sync exist in a production build, and the server holds the child's date of birth and letter dates for a signed-in synced book. This differs from X1, X3 and X5, which describe the store build as server-off; `app.config.ts` and `g6-production-flags-off.test.ts` suggest the shipped 1.0 binary may still carry it off at submission ("production until submission"), so which state the first store build is in must be confirmed by `mobile`. Either way the email and server parts of this design are gated by the founder's E75 yes and by a lifecycle-email choice, not by the build flag, and phase 2 below still waits for them. No email address is used for any lifecycle purpose today.

F2. Typed days and ticked Days are not on the server and must not be. X5 and X3 both confirm (NS-47-R6, E94, NS-46-R3). The brief's line that the server knows typed days is wrong in the repo. This design never uploads a typed day's words. A parent-created occasion on the server is a date with no words.

F3. Push needs no signal. The phone already holds the child's date of birth and every parent-created date. A local notification works with servers off (I11 section 1). A remote push would add an APNs key, a token table, a push entitlement and a label answer (E79, I11). It adds almost nothing the phone cannot already do. This is the most useful finding for the founder: "send a signal so push can work" is already satisfied locally.

F4. E75 is not a legal rule, it is the founder's own default. E75 says no marketing or product-news email to an app address at 1.0, and spells out how it can be lifted: "its own row, a separate opt-in that is off by default, a one-click unsubscribe, hashed suppression, and his yes" (I9). So the email path is open by the founder's own text; it needs his yes and those four things.

F5. CATALOG has two separate rules. Principle 5 and the "no re-engagement" lines are our policy. Line 161 bars birthday, month-of-age and due-date emails because "these dates can fall on the worst day of a family's year" and because they would put the child's name in the email provider. Both are our policy and the founder may reverse them. The hard-day reason is not a legal reason and still matters: a date the parent chose carries far less hard-day risk than a date we computed.

F6. Consent for photo access does not do everything it appears to. Section 6.1.

F7. "Typed day" under NS-46-R47. NS-46-R47 bars marketing surfaces (store text, email, site) from naming, picturing or targeting a faith or tradition day, and a scan of `packages/emails` finds no `days.name.*` or faith words. A parent-created date with no label, sent to the server without a name, passes. A date picked from the Days (tradition) list does not go to the server at all (section 5.2).

Apple text quoted from W1 and W2 (VERIFIED, read this session):
- 4.5.4: push "should not be used for promotions or direct marketing purposes unless customers have explicitly opted in to receive them via consent language displayed in your app's UI, and you provide a method in your app for a user to opt out".
- 5.1.2(ii): "Data collected for one purpose may not be repurposed without further consent unless otherwise explicitly permitted by law."
- 5.1.2(iv): "Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database for your own use or for sale/distribution to third parties".
- 5.1.2(v): "Do not contact people using information collected via a user's Contacts or Photos, except at the explicit initiative of that user on an individualized basis".
- 5.1.2(vi): "Data gathered from ... (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties."
- 5.1.1(iv): do not "manipulate, trick, or force people to consent to unnecessary data access"; "provide alternative solutions for users who don't grant consent".
- 5.1.2(i): an app "may not require users to enable system functionalities (such as push notifications, location services, tracking)".
- DPLA 3.3.3(H): the app must not "use the Journaling Suggestions API, or collect any information through the Journaling Suggestions API, for any purposes other than providing journaling services in connection with Your Application", and must not disclose that information to a third party without prior express consent.

Reading for this design (counsel must confirm): 5.1.2(v) is about contacting other people; our reminders go to the parent, so it is not the live rule. 5.1.2(ii) and 5.1.2(vi) are the live rules for any server-bound value that came from the library.

## 4. Principles for every tier

MT-X6-R1. One rule decides what may leave the phone.
Given any value, When it is a date or fact the server already holds, or a date the parent typed or picked by an act of their own, Then it may be sent after the matching opt-in; When it was derived by our code from the photo library, Then it is not sent, stored or logged, except the single parent-confirmed date in Tier 4b after its own opt-in and counsel's answer.
Test layer: unit with a fake library that throws on any call before access is granted, plus a network fake that sees zero requests from library code (extends NS-51-R26).

MT-X6-R2. No provenance on the wire.
Given any occasion upload, When the payload is built, Then it has no field saying how the date was chosen (calendar, prompt card, day sheet), no source, no tier name, no screen name.
Test layer: unit (payload shape allowlist with a positive control that fails when a `source` key is added).

MT-X6-R3. Two switches before anything server-bound.
Given the parent wants any occasion to reach the server, When they turn it on, Then two things are true: the account exists, and a separate lifecycle-email or reminder choice was made with its Shown, Records, Never and Decline lines (PRIV-R21). A photo-access grant is neither of them.
Test layer: unit (scheduler refuses an occasion with no opt-in row), content (the four lines exist for the key).

MT-X6-R4. Never required.
Given the parent declines photo access, declines the extra choice, declines notifications or declines email, When they use the app, Then everything else works as before (5.1.1(iv), 5.1.2(i)).
Test layer: e2e.

## 5. The tiers

For each tier: what may reach the server; what the server may do; what push and email may say; consent and opt-in; label impact; the reversal the founder owns.

### 5.1 Tier 1: occasions we already know

What: the child's date of birth, month-age days, the birthday, and "a year ago" from the parent's own kept letters.

VERIFIED facts: `children.date_of_birth` is L4 and `entries.occurred_on` is L3 on the server (I12, lines 178 and 243). Both exist on the server only for a signed-in synced book (F1). `entries.occurred_on` is "date of the family moment", which the parent may set, so "a year ago" uses a date the parent chose or confirmed, never the letter's words. UNVERIFIED: whether a hosted `children` row is readable by an Edge Function in the shape X3 assumes (the data architect confirms).

Reaches the server: nothing new. The server already holds the date of birth and the letter dates. No new column.

Server may do: compute month-age, birthday and year-ago with the one shared function in `packages/core` (ADR 0035, MT-X3-R1, R19). Skip a book that is quiet, hidden or expecting-only. Skip a day on which a letter already exists (read from `entries`, never counted).

Push says: the ordinary neutral reminder only (NS-32-R12: no child name, no age or month number with names off or App lock on). Planned locally.

Email says: only if the parent turned on the per-child lifecycle email choice (default off, section 6.4). One fixed subject and body per occasion kind, no child name, no age, no date in the subject, no count, no letter words.

Consent and opt-in: per child, per kind, off by default, pausable, separate from sign-in.

Label: no change. These are the label rows already answered Yes (Name, Email, Sensitive Info, Other User Content, User ID).

Reversal: E75 (a lifecycle email exists at all). CATALOG line 161 and line 139 (no child-anchored email) for birthday and month emails: reversing it needs the per-child opt-in, no name or age in provider-visible text, and the hard-day pause the local reminders already have. Default: do not reverse line 161. Offer a year-ago email only (anchored on the parent's own letter, not on the child's age) in a later phase, default off.

MT-X6-R5. Given a signed-in book with the dob-email choice off, When the email job runs, Then it reads no dob and sends nothing for that book.
Test layer: unit on the job input type; scan (no import of the library, the days module or analytics, MT-X3-R18).

MT-X6-R6. Given the parent made a letter dated today, or the book is quiet or hidden, When the job would send, Then it skips and writes only a content-free count (OBS-R01).
Test layer: unit, db.

### 5.2 Tier 2: a date the parent creates

What: the parent taps "Remind me about this day" on a card, or picks a date in a calendar control, or types a Day (NS-18).

Is this a faith or tradition risk under NS-46-R47? The server never sees a name, a Days list entry or the parent's words. A date alone has no tradition attached. But a date picked from the Days (tradition) list reveals a tradition by its identity, and a yearly repeat on it is a sharper signal. So:
- A reminder made from a Days card or a ticked Day stays on the phone. It is never uploaded (NS-47-R6, E94 stand).
- A reminder made from the calendar control, or from any non-Days card, may be uploaded as a date.
- The phone decides this; the server cannot tell the difference, which is the point (MT-X6-R2).
- Repeat on the server is "once" or "yearly" only. A yearly repeat of a fixed date is the parent's own choice and is deletable in one tap.

Neutral form (the one recommended): date only. No label, no kind, no words, no place, no people. The server row means "send this parent one reminder on this date". Optional words the parent typed (NS-18) stay in the phone `settings` table and follow NS-18-R3 and R7.

Reaches the server: `occasion_date`, `repeat`, `channel`, the book id (so a quiet or hidden book is honoured), and the parent's UTC offset (section 7.5).

Server may do: send one email on that date to the account address if the channel is email; nothing else. It may not rank, score, group or profile dates, and may not use a date for any other purpose (5.1.2(ii) pattern: one purpose).

Push says: the fixed neutral reminder, planned locally. Email says: a fixed line (section 7.9).

Consent: an explicit per-occasion choice at creation ("On this phone", the default, or "By email"), and a lifecycle-email opt-in the first time email is chosen (section 6.4).

Label: a date the parent chose is parent-entered content tied to an account. It fits "Other User Content", already answered Yes. Counsel must confirm it is not "Sensitive Info" and that no date of this kind becomes a health or religious inference (CQ-X6-3).

Reversal: E75 only.

MT-X6-R7. Given a reminder made from a Days card or a ticked Day, When the phone saves it, Then no network request carries it, and a test with the Days store seeded fails if any occasion row is built from it.
Test layer: unit, scan.

MT-X6-R8. Given a calendar-created occasion with channel email, When it is saved, Then the server row has exactly: id, profile id, book id, date, repeat, channel flag, created time, and no text column of any kind.
Test layer: db (column allowlist, classification test).

MT-X6-R9. Given the parent deletes the occasion, When they confirm, Then the row is hard-deleted at once and no email is sent for it, including one already queued.
Test layer: db, unit.

### 5.3 Tier 3: coarse metadata the parent attaches

What: a kind from a closed list, chosen by the parent. No free text, no place, no people.

Proposed closed list (four values, `content` may rename, none names a faith, a person or a place): `milestone`, `outing`, `gathering`, `other`.

Honest assessment: the kind adds little on the server. Using it on a lock screen would disclose it, so push never says it. In email it could soften the body ("a few words about the outing"), but an `outing` with a date range tells a server that a family may be away, which is a small safety signal. Recommendation: Tier 3 stays on the phone in phase 1 and 2 (it shapes the in-app card and the local reminder's landing only). A server column for the kind is a later, optional step, used in the email body only, never in the subject, never in analytics, never for ranking.

Reaches the server (later only): one of four values. Server may do: choose between four fixed email bodies. Push: nothing. Email: body only.

Consent: shown on the occasion form as an optional chip row, none selected by default. Label: no change if the four values are not sensitive; counsel confirms.

Reversal: E75, and a new inventory row (privacy owns the classification decision, proposed L4 because it describes a child's day).

MT-X6-R10. Given the kind column exists, When any code reads it, Then only the email body chooser does; a scan fails any read from analytics, logs, subjects, push payloads or URLs.
Test layer: scan, unit.

### 5.4 Tier 4: anything from the photo library

Rules from the founder (21 Nov): nothing library-derived is read, stored or sent before photo access is granted, and nothing is sent without a separate, plain opt-in. Section 6 designs this. The tier splits in three.

Allowed:
- 4a. On the phone, after the grant: cards, day rows, and (founder owns the reversal) a local reminder in the identical-words form. No label change.
- 4b. One parent-confirmed date, sent only after a separate opt-in and counsel's answer to CQ-16: on a day sheet the phone showed, the parent taps "Remind me about this day". Only the date goes. The same payload as Tier 2, no provenance. Held until counsel answers.

Not allowed:
- 4c. A silent scan result leaving the phone: the existence of pictures on a date, a count, a kind (photo or video), a duration, a cluster, a "this was a busy day" flag, an asset identifier, an album, a place. Reasons: Apple 5.1.2(vi) as quoted in section 3 (Photo APIs data may not be used for marketing, advertising or use-based data mining); 5.1.2(iv) (do not build a database from Photos); 5.1.2(iii) (do not surreptitiously build a profile); the label (Apple's definition, as read by `privacy` in #1267 A7: data derived and sent off device is considered separately); NS-51-R26; X5 MT-X5-R1 and R14. Route A items (a pick from Apple's suggestions picker) never feed the server at all: DPLA 3.3.3(H) limits any information collected through that API to journaling services, so a server reminder built on it is refused by default (CQ-X6-5).

### 5.5 Why 4b is only conditionally allowed

The honest risk: the date the parent taps came from a library read. A strict reviewer could read it as "data gathered from Photo APIs" under 5.1.2(vi). A defensible reading is that the parent supplied the date by an act of their own, the same value as one picked on a calendar, and the reminder is a service the parent asked for, not marketing. That reading is not verified (UNVERIFIED, CQ-16). To keep the reading as strong as possible:
- The "Remind me about this day" button appears on every day card in Moments (prompt, age-day, typed day, year-ago, library), not only on library days.
- The calendar control reaches the same result with no library at all.
- The wire has no provenance (MT-X6-R2), and nothing on the server can tell a library day from any other.
- The line the parent sees on the first tap is true and plain (section 6.3).

If counsel says no, 4b is cut and nothing else in the design changes, because Tier 2 already does the job through the calendar control and non-library cards.

## 6. The consent-gated tier (founder, 21 Nov)

### 6.1 What photo-access consent does not solve (plain statement)

This is said plainly because the founder's rule is right and still not enough:
- Photo-access consent lets the app read the library on the phone. It does not by itself cover a derived value leaving the phone. Apple's label rule treats anything derived from the data and sent off device separately (as read in #1267 A7; I did not re-fetch the page).
- The label is per data type. A parent-confirmed date is probably "Other User Content", already declared. A date that is only available because of the library may be argued to be Photos or Videos. Counsel decides (CQ-16). If it is Photos or Videos, the label moves to Yes, linked, App Functionality, in the same build (NS-51-R30).
- The purpose string (`NSPhotoLibraryUsageDescription`) must name the use. 5.1.1(ii) requires purpose strings that "clearly and completely describe your use of the data" (as quoted in X2 from W1 section 5.1.1(ii)), and 5.1.2(ii) bars repurposing without further consent. So if 4b ships, the string and the primer must say the date of a day you choose may be kept to send your reminder. A string that says only "to show you days" would not be enough.
- 5.1.2(vi) (marketing or use-based data mining) is still UNVERIFIED for this use. Counsel reads it (CQ-16).
- Consent does not make the email non-commercial. CAN-SPAM looks at the primary purpose of the message, not at how the recipient came to be on the list. The FTC reads the transactional or relationship category narrowly (W3). Section 7.8.
- Consent is not a way around 3.3.3(H). A Route A pick never feeds a server reminder.
- Consent does not lift NX-39 ruling 3. A notification whose existence follows the library still discloses a derived fact on a lock screen. Consent from the parent does not consent for a person who sees the lock screen.

MT-X6-R11. Given photo access is not granted (not determined, denied, restricted), When any code path runs, Then only `accessStatus()` is called on the library module, no scan, no index, no thumbnail, no occasion from a library day, and no Tier 4 option is shown.
Test layer: unit (fake library module that throws on any other call), device.

MT-X6-R12. Given access is Limited, When Tier 4 is offered, Then it applies to the selected pictures only and nothing says which are missing (NS-51-R3, R18).
Test layer: unit, device.

### 6.2 (a) What the consent-gated version can do now, on the phone, with no label change

After the parent grants access (full or limited) and nothing leaves the phone:
- In-app cards and day rows from library days (MT-X2-R25).
- A local reminder timed from a library day, only in the identical-words form: it takes the slot of the ordinary evening reminder, uses the ordinary words, carries a random id and a payload of `{ source, kind }`, and is planned only while the app is open (NS-51-R11, Q-PM-8, MT-X3-R15). It is counted inside the one-a-day budget, skipped for a quiet book, cancelled by a letter made that day. Its own switch, off by default. The founder owns the reversal of NX-39 ruling 3 and K1; counsel answers CQ-11 and CQ-12.
- No analytics event distinguishes it from an ordinary evening reminder (MT-X1-R9).

Label: Photos or Videos stays "not collected" while a network fake sees zero requests (NS-51-R26). Purpose string: the existing Route B string (X2 MT-X2-R10) is enough, because nothing is repurposed.

MT-X6-R13. Given a library-timed local reminder, When it is delivered, Then its title, body and payload equal the ordinary evening reminder's, and no test can tell them apart except the planner's private input.
Test layer: unit (allowlist with a canary asset id that must fail).

### 6.3 (b) The smallest server-bound signal a separate opt-in could carry

The smallest possible: one date, confirmed by the parent with a tap on a day sheet. Nothing else crosses: no count, no kind, no id, no duration, no album, no place.

The path, in order:
1. Account exists and the parent is signed in (a server-on build).
2. Photo access was granted on the primer (or later from Moments).
3. The parent chose, on the primer or in Settings, "Let me ask for a reminder on a day I choose" (the extra choice, section 6.5). Off by default. Recorded as a consent act with Shown, Records, Never and Decline lines.
4. The parent opens a day sheet and taps "Remind me about this day". The first time, one plain sentence shows before the date is sent: "We will keep this date so we can send your reminder. We do not keep your pictures."
5. The phone sends the same payload as Tier 2 (section 7.1).

PROPOSED purpose string (replaces X2 MT-X2-R10's text only if 4b ships; `content` and counsel own the words; no banned phrases from X2 F7):
> {app} looks at the dates of your pictures to show you days you may want to write about. If you ask for a reminder on a day, we keep that date, and not your pictures, to send it.

Label update if 4b ships (counsel must confirm, default conservative): Photos or Videos stays No only if counsel agrees a parent-confirmed date is Other User Content; otherwise it becomes Yes, linked, App Functionality, and the privacy manifest `NSPrivacyCollectedDataTypes` gains the photos or videos type (name UNVERIFIED, check against Apple before use). The privacy policy "What we do not collect" line, the in-app disclosures and the label change in the same build as the behaviour and not before (POLICY_VERSIONING pattern; X1 section 5).

Counsel questions (new, continue the X1 numbering as "X6"):
- CQ-16. Is a date the parent confirms by a tap on a day sheet "data gathered from ... Photo APIs" under 5.1.2(vi), and does sending it change the Photos or Videos label? Default: not built until answered; cut if the answer is yes or unclear.
- CQ-X6-2. Is the lifecycle reminder email transactional or relationship (15 U.S.C. 7702(17)(A)) or commercial? Default: build to the commercial standard anyway (section 7.8).
- CQ-X6-3. Is a parent-chosen date with no label, kept against an account, "Sensitive Info" or "Other User Content" for the label, and does a yearly repeat on a tradition date raise the special-category risk? Default: Other User Content; Days-list dates never leave the phone.
- CQ-X6-4. Is an opt-in reminder push or email a "promotion or direct marketing" under 4.5.4? Default: opt-in, in-app consent language, in-app opt-out, regardless.
- CQ-X6-5. May a Route A pick ever feed any server reminder under 3.3.3(H)? Default: no.
- CQ-X6-6. Does storing the parent's UTC offset (section 7.5) count as Coarse Location for the label? Default: no, but counsel confirms; the offset is the least location-like form that makes quiet hours work.

Kill switch: `killSwitches.occasionSignal` (PROPOSED, remote, hide only, CODE-R19, D-035): when true, the phone stops sending new occasions and hides the day-sheet button and the Settings choice; the server's `occasion_email_enabled` ops flag stops the sender within one run. Existing rows are kept until the parent deletes them or a runbook purges them; a kill switch is not a reason to delete a parent's data. The switch only narrows (NS-51-R32 pattern).

MT-X6-R14. Given the kill switch is on, When the parent opens Moments, Then no occasion is uploaded, no email is sent, and local reminders, letters, Erase and Export still work.
Test layer: unit, db.

### 6.4 The email as a lifecycle email (founder, 21 Nov)

The founder's framing: a product lifecycle email, not marketing. A user made an account to use the product, gave photo permission, and it is our lifecycle to remind them. The design follows it, and adds the stricter standard because the law question is not ours to settle.

What makes it a lifecycle email in design:
- One purpose: a reminder tied to something the parent set up (a date they chose, or an email choice they turned on for a child). No offer, no upsell, no Plus mention, no referral, no survey, no news, no third-party content, no link except the app open page and the unsubscribe.
- Sent to the account email address only. Never to another address. Never to a co-parent. Never to the waitlist list (E75 keeps the waitlist separate).
- Sent only after an explicit lifecycle-email choice.

Consent trail, in order, each a recorded act:
1. Account creation: the sign-in act and the age gate, as today (`policy_acceptances`, version accepted).
2. The photo-access primer, if any library tier is used (local setting; whether it needs a server row is Q-X1-9, default phone-only).
3. An explicit lifecycle-email choice, its own act, off by default, with Shown, Records, Never and Decline lines. Server row: list name, time, words version, hash of the words shown (X2 MT-X2-R33 pattern). The choice is not pre-ticked and is not bundled with the photo grant (5.1.1(iv)).

The standard we build to, at no real cost: clear and truthful sender and subject, no deceptive headers, the postal address (a PO box or private mailbox, never a home address, D-004), a one-click unsubscribe link signed per recipient and per list that matches the `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058, the contract in `legal.en.ts`), working for at least 30 days (W3), honoured at once by our own suppression and never later than 10 business days (W3), a separate off switch in Settings, and no effect on account, security, billing or legal mail. The suppression list for this list is its own: it must not use the vendor's account-wide suppression, which would also block sign-in codes (COMPLIANCE.md point 5).

Honest classification: whether this email is transactional or relationship, or commercial, is counsel's call. The FTC page says the transactional or relationship category is read narrowly, so an email sent to a person with whom we have a relationship is not automatically transactional (W3). The founder's argument has force: the person asked for the reminder and it serves the product they use. The risk is that a reminder whose job is to bring a parent back into the app reads as promotion of the product. Default until counsel answers (CQ-X6-2): treat as commercial for compliance, call it a lifecycle email in product language, and build the full footer. This costs one footer and one list.

Repo rules, separated into our own policy (the founder may reverse) and legal rules (he may not):

| Rule | Where | Kind | What a founder reversal looks like |
|---|---|---|---|
| No marketing, product-news, re-engagement or Plus email to an app address at 1.0; no in-app opt-in | E75, FR-MKT-44 | Our policy, "a promise to a user", founder line with a default | A new row; a separate opt-in off by default; one-click unsubscribe; hashed suppression; his yes recorded in `DECISIONS.md`; the policy and in-app disclosure change in the same build |
| No commercial email at v1.0; commercial later, opt-in, separate subdomain | CATALOG principle 5 | Our policy | The lifecycle list sends from the same relationship domain or a separate subdomain by founder choice (default: the `news.` subdomain, so reputation is isolated); CATALOG gains the template rows |
| No drips, tips, re-engagement; "We miss you" and "Come back" barred | CATALOG line 57, 158 | Our policy and the constitution's no-guilt rule | Not reversed. The email is a reminder of a date the parent set, never a reaction to inactivity. Keep the ban on inactivity triggers |
| No birthday, month-of-age or due-date email; no child name in the provider | CATALOG line 139, 161 | Our policy (D-022 birthday rule, B-REQ-015 for due dates) | Per-child, per-kind opt-in, off by default, pausable, quiet book honoured, no name or age or date in subject or body, expecting-only books excluded (due-date stays banned). Default: not reversed |
| No letter text, transcripts, audio, photos, child names, birthdays or due dates in any email body or subject | COMPLIANCE.md point 7 | Our policy that protects the processor table | Not reversed; this design keeps it |
| Opt-out honoured within 10 business days, 30 days of working link, postal address, no false headers | CAN-SPAM (W3) | Legal rule | Cannot be reversed; built regardless of classification |
| Opt-in language in the UI and an in-app way to opt out for promotional push | App Review 4.5.4 (W1) | Store rule | Cannot be reversed; built regardless |

MT-X6-R15. Given the lifecycle email template, When its content is inspected, Then it is in a closed class list, its words come from a `packages/content` key, it has no offer, upsell, referral, survey, third-party link, child name, age, date in the subject, count or gap word, and a content test fails a template without a class (LEGAL-REQ-053).
Test layer: content, scan.

MT-X6-R16. Given a parent who did not make the lifecycle-email choice, When any rule is evaluated, Then no email nudge is sent and no opt-in control is shown before the founder signs E75's reversal in a build that has it.
Test layer: unit, e2e (extends MT-P5-R16, R17).

MT-X6-R17. Given a recipient taps the unsubscribe link, When it resolves, Then it works with no login and no reason asked, suppresses only this list, leaves account and safety mail unaffected, and the in-app Settings switch shows the same state.
Test layer: unit, e2e.

MT-X6-R18. Given the parent turns the lifecycle email off in Settings, When the switch is saved, Then pending sends for all their occasions stop within the same minute and the consent withdrawal is recorded with time and version.
Test layer: unit, db.

## 7. Server side (described, not written)

All of this exists only in a server-on build (F1) and behind the founder's E75 yes. No migration is written here. `data-architect` owns the schema; the migration needs `supabase/**` review, red-team and `approve-migration` (D-041).

### 7.1 New tables (description only)

`occasion_reminders` (one row per parent-created date):
- `id` uuid, primary key (L2).
- `profile_id` the owner (L3). `book_id` (`children.id`, L3) so quiet, hidden and expecting-only rules apply.
- `occasion_date` date (L4 proposed: a date tied to a child's book; derived data inherits, DATA_CLASSIFICATION rule 2). Privacy owns this decision; proposed because it is a day the parent marked about a child.
- `repeat` text, check in (`once`, `yearly`) (L2).
- `channel` text, check in (`email`) (L2). The phone-local channel needs no row, so a row exists only when the parent chose email. This keeps the server lean.
- `kind` text null, check in four values (L4 proposed). Not created in phase 2 and 3; reserved for the later optional step (section 5.3).
- `created_at` (L2). No label, no words, no place, no people, no source, no tier.

`email_list_consents` (or the existing consent pattern, `data-architect` decides): profile id, list name (`occasion_reminders`), granted time, withdrawn time, words version, hash of the words shown (L3 and L2). Retention follows consent records (3 years, DATA_CLASSIFICATION section 2 row).

`occasion_send_keys`: hash of (book id, occasion id, local date), sent time. No address (API-R06, R07). Pruned after the repeat window. Makes a retry idempotent.

Profile column or small table for `utc_offset_minutes` (section 7.5).

Email suppression: the lifecycle list has its own suppression of hashed addresses (E75's "hashed suppression"), separate from the sign-in mail provider's account-wide list.

### 7.2 RLS, grants and access

- RLS on, deny by default (DB-R12). A parent reads, inserts, updates and deletes only their own rows (`profile_id = auth.uid()`). A co-parent of the same book cannot read another parent's occasions (per person, as the tab is). No `anon` access.
- The sender is a scheduled Edge Function with a service-only function; EXECUTE revoked from `anon` and `authenticated` (API-R05); `security definer` functions set `search_path = pg_catalog, public` and carry a comment saying why (DB-R15).
- Grants live in the same migration as each object and in `supabase/tests/grants.mjs` (CLAUDE.md; default privileges were reset in `20261023060000`).
- Every column carries `comment on column` with L1 to L4 (DQ-R01); the classification test fails an unlabelled column. The inventory rows are added in the same PR as the code (DATA-REQ-001, DQ-R02); I propose them, I do not edit `docs/legal/**`.
- A test in `supabase/tests/access_matrix*.test.mjs`: owner allowed, other parent denied, co-member denied, anon denied, service function granted.

MT-X6-R19. Given the occasion tables, When the access matrix runs, Then the owner can read and delete their rows and no other role can read them, and the table has no text column.
Test layer: db.

### 7.3 Deletion, export, account deletion

I did not read `DELETION_AND_EXPORT_SPEC.md` (UNVERIFIED). Proposed rows for `legal` and `data-architect` to apply by PR body:
- Delete one occasion: hard delete at once; any queued send for it is dropped.
- Turn off the lifecycle email: withdraws consent, stops sends, keeps the occasion rows only if the parent asks to keep them for later; default is to keep the date, delete nothing, and say so plainly. Alternative default: delete all email-channel rows on withdrawal. Founder decision D9 below.
- Account deletion: the rows cascade with the profile (DB-R20 note: no cascade across authors; these rows have one author), the consent record is kept for 3 years as the other consent records are, the hashed suppression entry is kept so an unsubscribed address is never mailed again (the legal minimum is to keep the opt-out), and the send keys are pruned.
- Book purged: occasions for that book are deleted.
- Export: the parent's occasion dates are the parent's own data on the server, so they are in the server export as a short list (date, repeat, channel). No library fact is in any export (X5 MT-X5-R15).
- Erase everything (phone): clears phone stores; does not delete the server rows by itself unless the parent also deletes the account; the screen says which it did.

MT-X6-R20. Given account deletion, When it completes, Then no occasion row, send key or address remains, the suppression hash and the consent record remain as the retention rule says, and a test scans every new table for the profile id.
Test layer: db (deletion receipt test), e2e.

### 7.4 Push token handling

Fact (VERIFIED by search of `supabase/migrations`, I15, and by X5): there is no device token table. E79 says no APNs key, token table or push entitlement in 1.0.

Recommended: none. Local notifications do the work. Remote push stays off.

If the founder wants it later (phase 5, not recommended), the minimum: a `device_push_tokens` table (profile id, device id as a random id never the vendor id, the APNs token, created and last seen, environment) with RLS owner-only, the token classified L3, deleted at sign-out, at account deletion and when APNs reports it invalid, never in analytics, logs, crash reports or URLs, never shared. It needs the push entitlement, an APNs key in a secret store, a sender job with the same opt-in as email (4.5.4 consent language and an in-app opt-out), a payload with no child name, no occasion kind, no library fact, a neutral body from a content key (NS-32-R11, R12), and a store label answer (Q54(d)). The reversal is E79, which the founder owns. A remote push carrying anything from the library is refused for the same reason as email (CQ-13).

### 7.5 Quiet hours, time zone and the NS-32 budget

- Local reminders already respect quiet hours (07:00 to 21:30 local, NS-13-R30 as read in P5) and the one-a-day budget (NS-32-R1) with 60 pending in total and plan notices first (E13).
- An email has no lock screen, but it is the same daily story. Rule: one reason to come back a day (X2 MT-X2-R34). Per occasion the channel is one of "on this phone" or "by email", never both, so one date gives one nudge. If the phone plans a local reminder the same date for another source, the email is skipped when the server can see a letter dated that day; otherwise the parent may get one of each, and the email subject never says it is a second. A cross-channel dedupe is the first thing to measure (MT-X6-R25).
- The server sends in a fixed local window (default 09:00 to 11:00) so it needs the parent's local day. Least-revealing form: the parent's UTC offset in minutes, refreshed on each sync, not an IANA zone name (a zone name is closer to a place). CQ-X6-6 asks counsel whether even the offset is Coarse Location. UNVERIFIED how a daylight-saving change is handled between syncs; the job sends no earlier than 08:00 and no later than 20:00 in the stored offset, and a stale offset is at most one hour off.
- Back-off: no email after the parent's lifecycle-email choice has produced no open or tap for 35 days is not allowed to depend on tracking opens (no pixel, see 7.10). Instead cap: yearly repeats send once a year; "once" sends once; a hard cap of one nudge email per week per account (a guess, labelled, founder sets it).

### 7.6 Quiet and hard-day tools

A quieted or hidden book contributes nothing (NS-32-R14, NS-48-R21): no occasion email, no local reminder. An expecting-only book gets no birthday or month email and the due date is never used (B-REQ-015). One tap in Settings pauses all lifecycle email for a child.

MT-X6-R21. Given a quieted, hidden or expecting-only book, When the email job runs, Then it sends nothing for that book, and an occasion on that book is kept but silent.
Test layer: unit, db.

### 7.7 Landing

A tap on a push or an email opens Home or the tab per T5: the landing re-chooses the occasion on the phone at tap time, from the same ranked list (MT-T5-R2); the link carries no id, date or query keys outside a closed list (MT-T5-R20, R21); the notification is not the input. A nudge link never signs the parent in as a side effect (T5 section 6.3). If the occasion was deleted, the landing shows the next ranked source with no message.

### 7.8 Email: transactional or commercial, and what we build either way

See section 6.4 for the table. One more point on the founder's argument that the photo grant is part of the lifecycle: the photo grant is relevant to the Tier 4 rules and to what we say on the primer. It is not what makes an email lawful. The email's lawfulness rests on its own consent trail (account, then the explicit lifecycle choice) and on CAN-SPAM, whatever label counsel gives it.

### 7.9 Copy rules for the notification and the email

Rules (all enforced by content tests, NS-32-R11 and R12, `rules.test.ts`):
- Words come from `packages/content` keys, never generated at send time.
- Nothing names pictures, a library, a place, a person or a count. No "waiting", "new", "again", "still", "don't forget", "miss", "you haven't", streak, points, badge, countdown ("in 3 days").
- Nothing implies a machine chose, curated or wrote anything. No "we found", "picked for you", "smart".
- No child name, no age or month number on a lock screen with names off or App lock on (E82, NS-32-R12). In email, never a child name, age or date in the subject or body at all (COMPLIANCE.md point 7).
- Never gender the child; never the word "memories" or "moment" for a thing a person makes (BRAND.md); the verb is a parent verb.
- Plain, warm, short. No exclamation marks. No fear, guilt or loss language.
- Lock screen: one fixed neutral title and body, the same for every occasion and every tier, so the notification does not disclose which tier produced it.

PROPOSED example words (for `content` to take or replace; not shipped copy):
- Local reminder (lock screen): title "A quiet minute", body "Whenever you are ready." Same for every occasion.
- Email subject: "A day you asked us to remember". Email body, first lines: "Today is a day you chose. A few words are enough, whenever you have a minute." Then one button "Open the app", then the footer: why you got this ("You turned on reminders by email in Settings"), the one-click unsubscribe, a link to Settings, the postal address.
- Never in either: "pictures", "photos", "your weekend", "you have", "N", "waiting".

MT-X6-R22. Given any nudge text, When the content test runs, Then it fails on the banned list above, on any child name token, on a digit in a subject, and on a string that names pictures.
Test layer: content.

### 7.10 Analytics (closed allowlist)

Rules: opt-in (BRIEF decision 12, D-124 in-app analytics off for 1.0), no collection before consent, ten SDK `$` keys only plus registry rows with enum or bounded properties (X5 MT-X5-R14), no library fact (NS-51-R12, R27, R28).

Allowed rows (names are the registry's to set; `privacy` signs):
- `moments:screen_view` and `moments:permission_ask_click` as X5 says; no property that varies by state.
- `reminders:occasion_added`, no properties. It states a parent-created date exists, not how it was made. It has no `source`, `tier`, `kind` or `channel` property.
- `reminders:lifecycle_email_choice` with property `choice` in (`on`, `off`). It records a parent's choice about our email, not a library fact.

Not allowed: a day-sheet button tapped, a library-day reminder created, a nudge marked as library-timed, a count of occasions, the access answer, an email opened (no tracking pixel, no open or click tracking on this list), a date, a kind, a book id, an address.

Server side: the sender logs through the typed logger with counts of sent and skipped and error codes only (OBS-R01). No address, no book id, no date.

MT-X6-R23. Given the analytics registry, When it is scanned, Then the Moments and reminder rows are exactly those above, none has a property named `source`, `tier`, `kind`, `date`, `count` or an access value, and a canary date and asset id seeded through every path leaves zero hits in analytics, logs, crash payloads and URLs.
Test layer: unit, scan, canary.

## 8. The simplest customer path after consent (founder, 21 Nov)

Goal: simplify things for the customer after consent, within the rules.

The path, using the same primer P3 designs:
1. The primer for photo access: one sentence of what is read (dates of pictures, on the phone), one button "Allow", one comfortable "Not now". This is the only ask by us about the library (NS-51-R19: no second ask).
2. On the same primer, below the sentence, one extra clearly labelled choice with equal weight to the other choice and default off: a switch labelled in parent words, for example "Also let me ask for a reminder on a day I choose". It says plainly in one line what is kept: only that date, never pictures. It is shown only if the account exists and the lifecycle-email path is open for the build. If either is false the row is absent, not greyed.
3. The switch records a consent act (Shown, Records, Never, Decline). It is its own act: it is not required to Allow, and turning it on does not change what Apple's sheet shows.
4. After "Not now" or Apple's "Don't Allow": nothing returns by itself. No re-ask. The extra choice is not shown. The parent can find both under Me, Reminders, in one row each: "Days from my pictures" and "Reminders by email".
5. After Allow with the extra choice on: the day sheet shows "Remind me about this day". One tap. The first tap shows the one plain line from 6.3; later taps are one tap with a small confirmation, an Undo for 10 seconds, and nothing else.
6. After Allow with the extra choice off: the day sheet shows no remind button for library days. The calendar control and non-library cards still offer the reminder (Tier 2).
7. Turning anything off is one switch in Settings: the library feature (removes the index and pending library reminders, NS-51-R16), the day-sheet choice (stops sending, keeps nothing new), the lifecycle email (stops sends at once). Each says in one line what it did and what it did not, and never claims it revoked the system permission (X5 MT-X5-R7).
8. The email: a one-click unsubscribe in the footer and the same switch in Settings; both show the same state.

MT-X6-R24. Given the primer, When it is shown, Then the extra choice is off, is equal in weight to the other choices, is not pre-ticked, is absent when the account or email path does not exist, and a "No" or "Not now" leaves no later prompt from us.
Test layer: unit, content, e2e, design review (VoiceOver, AX5, Reduce Motion, iPhone SE 3).

MT-X6-R25. Given one tap on "Remind me about this day", When the parent confirms, Then the reminder exists with no further screen, an Undo is available, and a measurement plan reads success from whether parents still keep the reminders switched on after 30 days through the parent study, not from our analytics (no library fact; Q10 in X2 says the lift is a belief to test).
Test layer: e2e; research, outside analytics.

## 9. Phased release plan

| Phase | What ships | Server? | Library? | Gate |
|---|---|---|---|---|
| 0 | Moments phase 1 (X3 section 14): For you from dates, parent-created days kept on the phone, local reminders (Tiers 1 to 3 local). "Remind me about this day" on cards and a calendar control, phone-local | No | No | Tab position, words, Moments design |
| 1 | Library on the phone, after the grant (Route B behind its flag): cards, day rows. Optional local reminder in the identical-words form, own switch, default off | No | Yes, phone only | BL-1305 reversal, counsel CQ-1, CQ-11, CQ-12, spike, label re-run; NX-39 ruling 3 reversal signed |
| 2 | Server-on build: lifecycle email choice; Tier 2 occasion rows (email channel); the sender dark with a send-to-self dry run | Yes | No library signal | E75 yes, counsel CQ-X6-2 and CQ-X6-4, migration review, postal address in place, policy and disclosure versions bumped in the same build |
| 3 | Tier 1 email (year-ago first; dob kinds only if the founder reverses CATALOG line 161); closed-list kind for the email body (Tier 3 server) | Yes | No | Parent evidence from phase 2, a measured hard-day review, counsel |
| 4 | Tier 4b: the day-sheet "Remind me about this day" on library days, with the extra primer choice, purpose string and label update | Yes (the same table) | Yes, one confirmed date | CQ-16 answered in favour, label update drafted, kill switch tested, founder yes |
| 5 | Remote push (optional, not recommended) | Yes, new token table | n/a | E79 reversal, Q54(d), counsel CQ-X6-4 |

Each phase can be stopped without undoing the earlier one. Phase 2 does not depend on any library work.

## 10. Options and why rejected

| Option | What it is | Verdict | Why |
|---|---|---|---|
| A | Send a library-derived "occasion" flag and metadata silently after photo consent | Rejected | 5.1.2(vi), (iii), (iv); label per data type; NS-51-R26; consent for the read is not consent for the send; purpose string would have to name it and still not cover marketing use |
| B | Send counts or kinds from the library (photo or video, busy day, duration) | Rejected | Same as A, and a count is a gap-counting input; X5 R14 |
| C | Remote push driven by a library signal | Rejected | Needs a token table, entitlement, E79 reversal, and a library fact on the server; NX-39 existence disclosure |
| D | Email driven by a library signal | Rejected | Derived data leaves the phone; label; CAN-SPAM unchanged by consent |
| E | Upload typed days and ticked Days with their words | Rejected | NS-47-R6, E94, NS-18-R3, NS-46-R47 special-category risk; a tradition day reveals faith |
| F | Route A picks feed any server reminder | Rejected | DPLA 3.3.3(H) journaling-only limit; Apple's titles and names are not ours |
| G | Send the child's name or age in the email so it feels personal | Rejected | CATALOG line 161, COMPLIANCE.md point 7; email provider holds it; hard-day risk |
| H | A "we miss you" lifecycle email triggered by inactivity | Rejected | The constitution's no-guilt rule; CATALOG line 158 |
| I | Remote push as the main nudge, with a token table | Not recommended | Local covers Tiers 1 to 3; adds entitlement, label and sender for little gain |
| J | One-tap server signal with no opt-in because the parent granted photo access | Rejected | Two consents, two purposes (5.1.2(ii)); the founder's own rule says a separate opt-in |
| K | Recommended: local push for everything; one parent-chosen date for email; Tier 4b only after CQ-16; no silent library signal | Recommended | Widest design that is honest; each step stoppable |

## 11. Edge and unhappy paths

- Photo access revoked in Settings: the library index is cleared at next foreground (X5 MT-X5-R8); the day-sheet button disappears; occasions already created stay, because the parent made them, and the parent can delete them in Me, Reminders. The extra choice reads as off until the parent turns it on again after a new grant.
- Limited access: Tier 4 works on the selected pictures only; nothing says which are missing.
- Signed out or account deleted: local reminders end (NS-13-R14); the server rows are deleted with the account; a stale notification tapped lands on the signed-out default with no occasion shown (MT-T5-R12).
- A second phone on the same account: occasions with channel email are shared by account; local reminders are per phone and are not synced (NS-32 second phone row). The parent sees the email occasions in Me, Reminders on both.
- Parent changes email address: the sender uses the current account address; the old address gets no lifecycle email; a notice of address change is account mail (E76), not part of this list.
- Apple private relay address: lifecycle mail goes through the relay once the sender domain is registered (COMPLIANCE.md section 9, a launch blocker for any email).
- Email bounces or the address is suppressed: stop for that list, mark the choice off in the app on next sync with one calm line; no retry storm.
- Hard day: a parent who set a yearly date and now wants it gone deletes it in one tap; the pause-all switch stops everything for a child.
- Time zone change: the stored offset refreshes at sync; one email may arrive an hour off; the content has no time in it.
- Parent in the middle of a letter on the date: the email is a plain reminder; the app opens to the open work (MT-T5-R10).
- Kill switch on mid-session: the day-sheet button hides at next foreground; no upload; nothing is deleted.
- Sibling or teen contributors: no change; the lifecycle email goes to the account holder only.
- Hosted book purged while a former member has rows: occasions follow the book purge rule above.

## 12. Constitution, privacy and accessibility checks

Constitution: no machine title, caption, summary, place, person or scene is created; the occasion row has no text; the email and notification words come from content keys; nothing implies a machine writes anything; no count, gap, streak, point or badge; `{child}` is used where a child is named and no draft here needs a name.

Privacy: Content (C) and Sensitive (S) data never reach analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014, DATA-REQ-004): the occasion date and its book are L4 and appear in none of them (MT-X6-R23). Safety tiers stay on the device with no server table. Analytics is opt-in, closed, and carries no library fact. No collection before consent: no library read before the grant (MT-X6-R11), no upload before the two opt-ins (MT-X6-R3). The claims the code must prove before anything is published: "We read the dates of your pictures on your phone", "We keep a date only if you ask for a reminder on it", "Say no and nothing else changes". Each maps to R11, R3 and R4. Forbidden claims: "We never see your pictures" while any attached picture syncs (X1 F1), "stays on your phone" (X2 F7: untrue for a synced book).

Accessibility: the primer's extra choice and the Settings rows are WCAG 2.2 AA surfaces: 44 pt targets, VoiceOver reads the sentence before the switch and the state after, AX5 on iPhone SE 3 holds, Reduce Motion and Reduce Transparency honoured, the Undo is reachable without a timeout shorter than 10 seconds and is announced. The email is plain text first with a readable HTML part, the unsubscribe is one control, no image carries meaning. I did not test any of this on a device (UNVERIFIED); `design-systems` owns the proof.

Content rules: this file has no em dashes, en dashes, curly quotes, ellipsis characters or emoji, and no model names. Proposed lines were not run through `rules.test.ts` (no `npm install`): they are PROPOSED and unproven.

## 13. Founder decision list (each with a default and a deadline)

Deadline for every row unless stated: before any build that carries the matching phase leaves the repo; D1 and D2 before phase 2 is scheduled.

| Id | Decision | Default | Reversal it is |
|---|---|---|---|
| D1 | Lift E75 for one lifecycle reminder email, to the account address, opt-in, off by default | Yes, in phase 2 only, dark first with send-to-self | E75, FR-MKT-44, CATALOG principle 5 |
| D2 | Keep push local only; no remote push, no token table | Yes, local only | None (E79 stands) |
| D3 | The email carries only a parent-chosen date (Tier 2) in phase 2 | Yes | E75 |
| D4 | Allow dob-anchored email (birthday, month) at all | No | CATALOG lines 139 and 161 |
| D5 | Allow a year-ago email from the parent's own letter dates (phase 3) | No until phase 2 evidence | E75, CATALOG |
| D6 | A closed-list kind on the server, email body only (phase 3) | No | New inventory row |
| D7 | A library-timed local reminder in the identical-words form (phase 1), own switch, off | Not in the first library build; decide after phase 1 device rows | NX-39 ruling 3, K1, ML-3 |
| D8 | The day-sheet "Remind me about this day" with a separate opt-in on the primer (phase 4) | Hold until counsel answers CQ-16; cut if no or unclear | NS-51-R26 narrowed, label |
| D9 | On turning the lifecycle email off, delete the occasion rows or keep them silent | Keep them silent and say so; the parent can delete in one tap | None |
| D10 | Sender domain for the lifecycle list | The separate `news.` subdomain, to keep sign-in mail reputation safe | CATALOG principle 5 |
| D11 | Cap on lifecycle email | At most one a week per account (a guess, labelled) | None |
| D12 | Treat the lifecycle email as commercial for compliance until counsel answers CQ-X6-2 | Yes, full footer, one-click unsubscribe, own suppression list | None |
| D13 | Postal address for the footer | A PO box or private mailbox, never a home address (D-004) | None |
| D14 | Store the UTC offset, not a zone name, for send windows | Yes, counsel confirms CQ-X6-6 | New classification row |
| D15 | Measure whether reminders bring parents back with parents, not with analytics | Yes, in the parent study | None |

## 14. Dependencies

`privacy` (classification of the occasion rows and the offset; the analytics rows; the claims), `data-architect` (the schema, consent table, send keys), `analytics` (registry rows), `mobile` (calendar control, day sheet, planner, kill switch, tests), `sync` (the profile offset), `content` (parent words, the four-line consent text, email copy and footer), `legal` and counsel (CQ-16, CQ-X6-2 to CQ-X6-6, E75 line, policy and label versions), `emails` owner (template, list, suppression, footer), `release` (Notes for Review, label and manifest), `security-architect` and red-team (the Edge Function and migration), the founder (D1 to D15). PRs #1264, #1267, #1269, #1270 reconcile on ML numbering ("ML-3" and "ML-6" were not found by those names in the repo by X1, X2, X5 and P3 either; NX-39 ruling 3 and NX-39-R16 are the nearest written rules).

## 15. VERIFIED, UNVERIFIED, guess

VERIFIED (read this session):
- Apple App Review text for 4.5.4, 5.1.1(iii) and (iv), 5.1.2(i) to (vi) (W1, first 100000 of 121052 characters). DPLA 3.3.3(H) in full (W2, first 100000 of 381649). FTC CAN-SPAM guide: 10 business days, 30 days of working opt-out, postal address, $53,088 per email, narrow reading of the transactional category (W3).
- `apps/mobile/eas.json`: `EXPO_PUBLIC_SERVER_FEATURES` is on for `preview` and `production`, off for `development`, `e2e` and `testflight`; `EXPO_PUBLIC_ANALYTICS` is off in all (parsed this session). `app.config.ts` says a server-off build declares no collected data (I13). Whether the first store submission flips production to off is not verified.
- E75 and E79 text (I9). CATALOG lines 57, 139, 158, 161 and principle 5 (I8). COMPLIANCE.md sections 0 and 1 (I8). NS-32-R1 to R16 rows (I10). NS-18-R1 to R7 (I10). NS-46-R47 (I10).
- `children.date_of_birth` L4 and `entries.occurred_on` L3 (I12). No device token table in `supabase/migrations` (I15 search by name).
- The content of the X1, X2, X3, X5, T5, P5 and P3 branch docs and PR #1267, #1269, #1270 as pushed.

UNVERIFIED (not read, or only described to me):
- Whether a parent-confirmed date is "data gathered from Photo APIs" under 5.1.2(vi), and Apple's label treatment of it (CQ-16). Apple's "collect" and derived-data sentence is from #1267 A7, not re-fetched by me.
- Whether CAN-SPAM treats the lifecycle reminder email as transactional or relationship or commercial. The primary-purpose test under 16 CFR 316.3 is quoted from `COMPLIANCE.md`, not re-read by me.
- DPLA after character 100000, App Review after character 100000; any Apple page on local notifications, APNs, or the push entitlement; whether a local notification timed from the library needs any label answer.
- `DELETION_AND_EXPORT_SPEC.md` coverage; the `policy_acceptances` body; the shape of a hosted `children` row for an Edge Function; the current state of `app-store-privacy-labels.md` beyond what X2 and X1 quote.
- That the vendor's account-wide suppression behaves as COMPLIANCE.md says; Apple private relay registration status; the `news.` subdomain existing.
- Daylight-saving behaviour of the stored offset; Gmail and Yahoo one-click header requirements beyond what COMPLIANCE.md records.
- That the founder's screenshots are Apple's system sheet; that photo-access consent on the primer is recorded phone-only (Q-X1-9).
- That a reminder brings engagement: no evidence in the repo or this session; it is the founder's belief to test (D15).

Guess (mine, not sourced): that a parent-chosen date is Other User Content for the label; that the weekly cap of one lifecycle email is about right; that the default 09:00 to 11:00 send window is acceptable; that the four-value kind list is enough; that a strict reviewer would question 4b but accept the calendar path.

## 16. What I did not do

I wrote no code, migration, test or workflow. I edited no file other than this one: not `CLAIMS.md`, not `BACKLOG.md`, nothing under `docs/legal/**`, `supabase/**` or `.github`. I opened no pull request. I did not read the founder's screenshots. I ran no test and no content check (no `npm install`). I contacted no counsel or regulator. I did not consult `regulatory-affairs`.
