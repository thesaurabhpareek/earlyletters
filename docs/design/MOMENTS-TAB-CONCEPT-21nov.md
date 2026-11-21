# Moments tab: design concept (PROPOSED, 21 Nov 2026)

Status: PROPOSED. Docs only. Nothing here is decided, built, or recorded in `DECISIONS.md`. Author: `design-systems`. Fictional family: Asha only. Public name: `{app}`. Child: `{child}`. Every word in quotes is intent for `content`, never final copy, and a PROPOSED word does not ship.

Founder direction this answers (20 Nov, verbatim, in three parts):
1. "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word."
2. "The default tab can be showcasing value props nicely and if not given permission for your photos then get that permission. If you gave them show relevant things like screenshots I provided."
3. "It doesn't need to be default but think if it can be second tab or centre tab or how we organise but this is what would bring engagement is think IA and customer engagement and reason to come back everyday. And this would influence email nudges and push notifications nudges not just this app feed." Also: "Do market benchmark beyond Apple journal too so you have best of all worlds learnt."

Part 3 is the later instruction. Where it differs from part 2 (default tab), part 3 wins, and this file treats "default" as one option, not the plan.

Companion files in this folder: `moments-tab/MOMENTS-day-one-wireframe.svg` and `moments-tab/MOMENTS-recent-allowed-wireframe.svg` (light, 375 pt wide, plain rectangles, no photos). Text wireframes for the other states are in section 13. The privacy and constitution read of the same idea is PR #1267 (`docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md`, head `b05293257c89`); I cite it as P-1267 and do not repeat it.

## 0. What I did not read, and what I could not verify

1. **The founder's screenshots.** I have not seen them. They are not in the repo. I worked from the coordinator's description (a Recommended and Recent switch; Recent as newest-first days with a photo collage, a map tile with a place name, a machine title and a small compose button; Recommended with coloured Reflection cards and a refresh button, a Photo Memories highlight a year earlier, clusters with video lengths, a mood card). Apple's own journaling picker is described second-hand through P-1267 (A1 to A5), which read Apple's pages. I did not read Apple's pages myself this run.
2. **The market benchmark B1 is not here yet.** The coordinator said it would be on `wip/moments-b1`. I asked `gh api` for that branch at the time of writing and got 404, and no open PR carries it. So nothing below cites a market product, and every statement about what other apps do is absent on purpose. Section 12 holds the rows I will reconcile when B1 lands; until then this concept is built on Apple's picker (as described) and our own rules only. Honest limit: "best of all worlds" is not yet done.
3. **NAV-TAB-ROLES-10nov.md and `infra/exec-rulings-2026-11-10-engagement-and-plus.md` are not on `develop`** (Project docs; this run has no tool to read them). The J1 to J10 line I used is the working copy J1 to J12 in `docs/design/specs/NEW-SCOPE-INDEX-11nov.md` section 5, which says the charter wins where they differ. The coordinator's "J1 to J5" (one verb per tab, only Home starts a letter, no tab that is mostly a promise) are J2, J3 and J8 in that copy; J5 there is "first line says it". I cite the working-copy numbers.
4. **COORDINATION.md section 10** (how every requirement is written) I did not re-read this run; section 14 follows its shape from memory of the house style (Given, When, Then; Shown, Records, Never, Decline) and `product` should reformat if it differs.
5. **Nothing was run on a device.** No contrast ratio was computed; all colour is from existing tokens. Layout, hit-target and Dynamic Type statements are design intent, not measurement.
6. **`docs/design/DESIGN-LANGUAGE-V2-21nov.md` is "adopted" but its tokens (T1 and later, `glassFallback`, `kicker`, `cardTitle`) are in open PR #1251**, not on `develop`. I name them as the v2 names and add no token.
7. **Home wheel PR #1264** (`docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md`) read at its head. Its sources 2 to 4 and 6 are the same sources as the For you part here; section 4 settles who owns what.

## 1. The answer in plain words

1. A new tab whose one job is "pick a day worth a letter". Each card is a day or an occasion, made of the parent's own photos and the parent's own words. We never write a title, a caption, a place or a guess about what a photo shows. Working name Moments; three parent-word options in section 2 (my pick: Days).
2. My recommendation for the bar is option A: Home stays first and default, Moments is second (Home, Moments, Book, Me). It keeps the first-letter path one tap, keeps K-02, and costs one reversal (a fourth tab). Moments as default (option C) is workable only after the first kept letter. A centre-of-five bar has no honest fifth destination; see section 3.
3. The reason to come back each day is that the deck is different each day and nothing is lost by skipping it. There is no streak, count, badge, or "you missed". The same moment appears as an in-app card, a quiet local push and, where the server can know it, an email, from one family of words (section 8).
4. Day one is real before any permission: the deck holds our own prompts, the child's month-age day, a day the parent typed, and a labelled example, with one comfortable ask for photo dates (section 9).
5. This reverses ten standing rulings (and honours two more that a looser design would break). Each is named in section 14 and is the founder's to own. Nothing in this PR is built.

## 2. Name, job, verb, and how it differs from Home and Book

### 2.1 Three parent-word options (single word, parent vocabulary, one verb each)

Rule applied: the verb of each tab is unique (J2) and not Home's "Say", Book's "Read", Me's "Look after" (`06-HOME-BOOK-ME-IA-11nov.md` section 1). "Moments" is the working name only: the working vocabulary list in the index says a parent never reads "moment" (it is not in the BRAND.md glossary, which I could not open; UNVERIFIED), so `content` must clear any final word.

| Option | Tab label | Verb | Job sentence (12 words or fewer, J1; PROPOSED) | Reading | Risk |
|---|---|---|---|---|---|
| 1 (my pick) | Days | Pick | "Pick a day worth a letter to {child}." (8 words) | Every card is literally a day: a photo day, a month-age day, a day the parent typed, a day a year ago | The Me "Days" page (NS-46, NS-47) is a settings page for days we mark; same noun, different job. The tab would list them; Me would set them. `content` must say if that reads as one thing or two. |
| 2 | Photos | Choose | "Choose a day of photos to talk about." (8 words) | Plainest; "photo" is a glossary word | Collides with the Book's Photos lens (J7) and with Apple's app; and it overpromises before permission, since the deck also holds prompts and typed days |
| 3 | Ideas | Browse | "Browse ideas for what to tell {child}." (7 words) | Honest about the prompt cards | "Ideas" hints that the app thinks of things for you. It must never imply a machine writes; `content` and `legal` decide. |

Not offered: "Explore" (no job, J1), "Memories" (banned in NS-51 not-in-scope and loss-adjacent), "Library" (Apple's word; Library is not a tab).

### 2.2 Versus lines (so the tabs do not look alike)

| | Home (Say) | Moments (Pick) | Book (Read) | Me (Look after) |
|---|---|---|---|---|
| Parent sentence | "I go to Home to say something to {child}." | "I go to Days to pick a day worth a letter." | "I go to the Book to read what we kept." | "I go to Me to look after my account and books." |
| Main object (J4) | One prompt and one capture cluster | A day (photos, or an occasion) | A kept letter | A setting |
| Shape | One hero prompt, two 64 pt buttons, one slip; lamp scene that breathes | A short deck of image-led cards, newest or most relevant first; plain paper, no lamp | Cover band, then months of raised letter cards; lamp still | Plain grouped list |
| Cards | Flat rows | Flat photo cards (collage on top, one line, one small button). The one exception is the year-ago card, raised, because it is a kept letter and opens in the Book (NAV-TAB-ROLES R1, read second-hand through spec 06) | Raised cards that are kept letters | None |
| Starts a letter? | Yes, the only owner of the capture function | No control of its own: a card hands the day to Home's capture (section 7) | Never (IA-R4) | Never |
| Lists kept letters? | Never (IA-R9) | Never; at most one year-ago card, which is a door into the Book (J7) | Yes, all | No |
| Changes each day? | Prompt and one slip | The deck | When the parent keeps a letter | Rarely |

Three plain differences a parent can see in one glance: Home has big buttons and one question; Moments has pictures and short cards and no big buttons; the Book has words and months.

## 3. Where the tab sits (the IA question)

### 3.1 Options, with the bar drawn

Bars drawn at the 375 pt width of an iPhone SE 3, labels at the 13 pt floor, always visible, never disabled (HIG "Tab bars: navigation only", as quoted in `DESIGN-LANGUAGE-V2-21nov.md` section 1; not re-read). Selected tab marked with `*`.

```
A. Home default, Moments second  (recommended)
+----------+----------+----------+----------+
|  Home *  | Moments  |   Book   |    Me    |      4 slots, about 93 pt each
+----------+----------+----------+----------+

B. Centre of five
+--------+--------+----------+--------+--------+
|  Home* |  Book  | (centre) | Moments|   Me   |  5 slots, 75 pt each
+--------+--------+----------+--------+--------+
   The centre slot has no honest destination. See 3.2.

C. Moments default
+----------+----------+----------+----------+
| Moments *|   Home   |   Book   |    Me    |
+----------+----------+----------+----------+

C2. Home until the first letter is kept, then Moments  (hybrid)
 before first kept letter:   Moments | Home * | Book | Me   (cold launch on Home)
 after:                      Moments * | Home | Book | Me   (cold launch on Moments)
```

Option A puts Moments second so the order reads as the path of a letter: start (Home), choose a day (Moments), read (Book), look after (Me). In C and C2 Moments is first because a default tab is first by convention; Home then is second and still one tap away.

### 3.2 Why not the centre of five

A four-tab bar has no centre. A centre of five needs a fifth destination, and every candidate fails: Share is an action on a letter (P4), Find and Read together are Book actions (P3), Family is never a tab (spec 06 section 1), the Library is not a tab (spec 1), Days is the same job as Moments. The only thing left for the centre slot is a raised Speak or Type button. That is an action, not a destination, which HIG's tab-bar guidance rules out (as quoted in the v2 file), and it adds a second capture entry beside Home's cluster, against J3 and P1. I do not recommend B. If the founder wants a raised capture button, that is its own decision (a reversal of P1) and would live on every tab, not inside this concept.

### 3.3 Recommendation

Recommend **A**, then offer **C2** as one measured experiment later. In order of weight:

1. **Activation.** The first kept letter is the product. In C the first screen is a deck of days that has no photo days yet and asks for photo access; the first letter is then one tap further than today. A keeps the first screen where Speak and Type are.
2. **J8 and K-02.** Day one must be neither an empty box nor mostly a promise (J8), and no permission ask during first run (NS-39-R2; K-02 for reminders). A is the least reversal: the landing screen does not change. C reverses the landing and needs section 9 to be airtight.
3. **Engagement is not decided by which tab is first.** What brings a parent back is that something new and about {child} is waiting, and a message that opens right on it. In A, the daily push and the email open Moments on the day's top card (section 8), so the default tab does not need to change for the habit to form.
4. **Founder's own words:** "It doesn't need to be default." A takes him at that.
5. The cost of A is discoverability: a second tab nobody opens. Mitigation without breaking R-IA-3 (no tile or strip on Home): the push and email deep links, and the existing Home slip may name a Moments card by the same words the card uses. A five-parent check in the style of NS-50-R13 decides whether that is enough. If it is not, C2.

C2's one risk: a cold launch that changes from Home to Moments once, silently, could feel like the app moved. Mitigation: it changes once, after the first kept letter (the moment the parent has felt the product work, the reasoning K-02 already uses), and the bar order does not change, only which tab is selected. Founder owns the call.

### 3.4 What happens to Home and to J1 to J5

| Rule (working-copy id) | Under A | Under C or C2 |
|---|---|---|
| One verb per tab (J2) | Home Say, Moments Pick, Book Read, Me Look after. Passes | Same. Passes |
| Only Home starts a letter (J3, P1, IA-R3) | Home's capture function stays the only owner. Moments is one new allow-listed doorway, source `moments`, that calls it; it draws no capture control of its own (section 7). Bends J3's letter, keeps its aim. **Reversal** of "no doorway but widget, control, Siri" (section 14, R-8) | Same, plus a capture button is one tap from the first screen only through a card. Home is still one tap in the bar |
| No tab that is mostly a promise (J8) | Passes: day one holds real cards (section 9) | Passes only if the day-one deck is real; the value block is one card tall, never the page |
| One main object (J4) | A day | A day |
| One fact, one place (P7) | A day appears once on Moments and never as a Home tile. A year-ago letter is not shown on Moments when Home's slip already shows it that day | Same |
| Doorway, not a copy (J7) | The year-ago card opens the Book; prompt cards differ from Home's prompt of the day | Same |
| Three tabs, always (spec 06 section 1) | **Reversal**: four tabs | Same |

Home itself is unchanged in A: greeting, prompt, cluster, waiting rows, at most one slip. In C and C2 Home is the second tab and its content is unchanged.

## 4. The reason to come back every day (no streaks, counts or guilt)

The test: a parent who skips five days finds nothing wrong, nothing owed, no number. A parent who opens it on any day finds something new that is about {child}, and one tap from saying something.

What changes each day, in order of how much we can promise (each source is real or the card is absent; nothing is invented):

| Order | Source | Needs permission? | Changes when | Already specified in |
|---|---|---|---|---|
| 1 | A day the parent typed (an occasion and date) | No | On the day | NS-18; wheel source 2 |
| 2 | A Day the parent ticked (NS-46), or one on the bundled Days list the parent opens | No | On the day | NS-46, NS-47; wheel source 3 |
| 3 | The child's month-age day or birthday, from the birth date typed at first run | No | On the day | NS-32 `monthAge`, `birthday` |
| 4 | A year ago from our own kept letters: the letter's date, its own opening words verbatim, its attached photo if any | No | On the day | NS-23, C-20; wheel source 4 |
| 5 | Photo days from the phone, newest first | Yes, the opt-in in section 9 | When the parent opens the app after taking photos | NS-51 |
| 6 | Prompt cards from the 111 written prompts | No | Daily, a different few | `packages/content/src/prompts.ts`, NS-50 |

Rules that keep it kind:
- **No badge, no dot, no number** on the tab, ever. A badge is a count of what is waiting, which is a gap. VoiceOver says the tab label only.
- **Nothing expires out loud.** A card that is no longer relevant is simply not in tomorrow's deck. No "expired", "missed" or "last chance".
- **The deck is short.** For you holds at most five cards, so it is a place to glance, not a feed to finish. There is no "you are all caught up" line, because that implies there is something to catch up on.
- **A day with nothing real** shows the prompt cards and nothing else. That is correct, and stated, not hidden (wheel G2).
- **The daily nudge is the one a day we already have.** NS-32-R1 allows one budgeted notification a day, delivered on at most one surface (section 8.4). A moment competes inside that budget; it does not add to it.
- **Wording is about love and time.** Never "again", "still", "don't forget", "only", "days since" (NS-51-R12).

## 5. The feed: a smarter two-part version

The switch is a system segmented control with two segments, "For you" and "Recent" (working labels; `content` owns them; "For you" may read as a machine choosing, so `content` should test "Today" or "Ideas" and "Recent"). It is a control, so it may be glass (one of at most three glass surfaces on the screen: the tab bar is one, the switch is the second, there is no third; our own surfaces use the solid `glassFallback` under Reduce Transparency, Increase Contrast and iOS before 26, as in the v2 file). The cards below it are content and never glass.

### 5.1 For you (the parent-meaningful part)

Up to five cards, always in this order, absent when empty:

1. **Occasion cards**: typed days, then ticked Days, then month-age or birthday. Card label is the parent's own wording for a typed day, the Day's name for a ticked Day exactly as Home's slip shows it, and the age in words for a month-age day. No inference from cultural background beyond what the parent set (NS-47).
2. **A year ago**, from our own letters (section 4 row 4). One card at most.
3. **Library days** (only when the parent allowed it): a photo day that also matches an occasion above, or the newest photo day not already in Recent's first rows. One card at most here; the rest live in Recent.
4. **Prompt cards**: two or three from the 111 (section 10).

### 5.2 Recent (newest first, by day)

Photo days from the phone, newest first, from the NS-51 index only: dates and system identifiers, on the phone, at most 30 days and 90 days back in the index (NS-51-R6, R7). Each day is one card (section 6). Absent entirely, not greyed, when there is no access (section 9 and 11). A day with no matching rule never appears; there is no "older" control and no list past what the index holds.

A single scroll with two sections was considered. I chose the switch because it keeps For you short enough to glance at and keeps Recent from burying the occasions; the switch's last choice is remembered per cold launch only.

### 5.3 What is smarter than Apple's two lists

| Apple's picker (as described) | Ours | Why |
|---|---|---|
| Recommended mixes categories the device decides | For you has a fixed, readable order and every card's reason is a fact the parent gave us (a typed day, a ticked Day, the birth date, a letter they kept) | The parent can predict it. Nothing is a guess about their life |
| Cards are machine titled | Cards carry the date, and the parent's own label if one exists | The machine may not add meaning |
| Hand-off is to a journal entry the picker writes | Hand-off is to Home's capture with an empty words field | Words are the parent's (constitution) |
| Recent shows every day with pictures | Recent shows days the phone's rule finds (NS-51-R7), short and finite | No pile that reads as a backlog |
| A mood card | None | Health data and a nag (P-1267 section 4) |

## 6. Card anatomy

One card family, three shapes in the app (photo day, occasion, prompt). Every shape follows the same top-to-bottom order so the deck reads as one thing.

```
+--------------------------------------------+
| [ collage: the parent's own photos, up to 4 |   photo day only; paper tiles if none
|   in time order, one fixed layout ]         |
|                                            |
| Sat 14 Oct                    (phone date) |   `cardTitle` serif, 22/28
| At the park with Nani   (parent's own label)|   only if the parent typed one
|                          ( Say something )  |   one small quiet capsule, 44 pt
+--------------------------------------------+
```

Rules:
- **Photos.** At most four tiles, always the earliest four of the day by capture time. Never "best", never ranked, never cropped toward a face or subject (fixed crops from the centre). No "+12" or any count. One fixed layout (two by two; with one photo, one tile; with two, side by side).
- **Date.** The phone-formatted date and weekday for the day; for a span within one day a time range ("morning to afternoon") built by a fixed rule from timestamps, never from content (P-1267 CQ-5, pending `product`). Never "days ago".
- **Label.** The parent's own words only: a typed occasion name, a Day name the parent ticked, or a label the parent typed on a letter. A photo day with none shows the date alone. There is no machine title, no caption, no scene or person guess, no subject word, ever (NS-51-R10).
- **Place.** None. Place is never read (Q-PM-5: `asset.location` is not touched). A place appears only if the parent typed it inside their own label. No map tile.
- **Video.** No duration on the card. NS-51-R5 reads dates and identifiers only; a media-type or duration read is a new metadata read for `security` and counsel to approve before we draw it (P-1267 section 4 treats duration as plain metadata, but NS-51-R5 has not been amended). If it is approved, a small play glyph with the length in words ("12 seconds") is the only addition. Until then videos show as a still with no glyph.
- **The button.** One quiet capsule, 44 pt tall minimum, the same word on every card of the deck (working: "Say something", the same verb Home uses; `content` owns it). It is the card's only button. The whole card is also one target that opens the chooser (section 7).
- **No tint per category.** Apple's cards are coloured by type; ours are paper (`surfaceRaised` per v2) with the same hairline and highlight everywhere, because content stays paper and colour must never carry the meaning. The kind of card is carried by a short kicker in `kicker` style, title case ("A day you added", "A year ago", "A thought to start with"; words by `content`).
- **Raised or flat.** Flat for everything except the year-ago card, which is raised because it is a kept letter and opens the Book.
- **No counts anywhere**, no "3 more", no number on the switch or the tab.

## 7. The hand-off: one tap into Home's capture

J3 says only Home starts a letter. Moments honours it this way: it owns no capture control, no recorder and no draft. A card calls Home's one capture-start function with `source: "moments"` and a list of photo identifiers, and Home's Ready screen opens (full screen, over the tab bar, like the widget and Siri doorways, IA-R3). The tab under it does not change, and Let it go returns to it. Keep lands in the Book as today. That is what "a mode of Home" means here: same function, same Ready, same Review, same Keep; Moments is a way to reach Ready with photos already attached.

| Tap | Result |
|---|---|
| The capsule on a photo day | Ready opens with the card's shown photos (up to four) attached and the words field empty. One tap. |
| The card body of a photo day | A chooser sheet (A-S17 in the index): the day's photos as thumbnails of at least 96 pt, multi-select, "Not now", then the same Ready. Used to change the photos. Limits follow NS-52 (proposed defaults 6 pictures and 2 videos). |
| The capsule on an occasion card | Ready opens with no photos. The occasion's own words are not copied into the letter. |
| The capsule on a prompt card | Ready opens with that prompt (from the 111). |
| The year-ago card | Opens that letter in the Book (a read door, not a capture). |

Ready then follows the existing rules: no pre-filled words from a picture, no caption, and the letter's date is the parent's to confirm and is not taken from the photo without asking (NS-01 OQ-1, NS-51-R10). The photos become stored copies as NS-52 specifies.

## 8. One family: in-app card, push, and email

One moment, one fact, three surfaces. The family rule: each surface carries the same small set of parts (a date, the parent's label if any, one fixed line), and the less private the surface, the fewer parts it carries. Only the in-app card may show a photo.

### 8.1 The same moment in all three (fictional; words PROPOSED)

| Part | In-app card | Push (lock screen) | Email |
|---|---|---|---|
| Kicker | "A year ago" | none | "A year ago" |
| Date | "Sat 14 Oct" | none | "Sat 14 Oct" |
| Parent's own label | "At the park with Nani" | none by default (names and place only if the parent turned names on and App lock is off, Q-PM-9) | "At the park with Nani" |
| Fixed line | "Say something about it." | "A day worth a letter." | "A day worth a letter. Open {app} to say something about it." |
| Picture | the parent's own collage | never | never |
| Tap | Ready, or the Book for a year-ago card | opens Moments on that card | opens Moments on that card |

### 8.2 What each surface can know (this decides what is possible)

- **Push** is local. The phone plans it (NS-32; moment nudge per NS-51-R11), only when the app has been opened since the pictures were taken (no background fetch, Q-PM-8), so it can use photo days. Its words never mention pictures on a lock screen by default (Q-PM-9 default, accepted by the founder, CL-054).
- **Email** is sent by a server. By design the server never sees the photo library, a thumbnail, a date or an identifier from it (NS-51-R26), so **an email can never be about a photo day.** It can be about what the server may know: the birth date (month-age, birthday), a day the parent typed or ticked if those sync, and a past letter only if letters are readable server-side, which I did not verify. A photo-day email is not possible without breaking the rule that nothing from the library leaves the phone, and I recommend against any design that would need it. Also: no email nudge template exists today (the lifecycle templates are welcome messages; read as a directory list only), and an email nudge needs a consent and channel decision from `legal`, `privacy` and the founder.
- **In-app** is the only surface that can show the picture.

### 8.3 Deep links
A push or email opens Moments with the named card first. If the card has gone (the day passed, the photos were deleted), Moments opens as usual with no message about it (NS-51-R22). The link carries no photo id, filename, label or count.

### 8.4 One budget
Push and email count against the same one-a-day (NS-32-R1): if a push went today, no email goes today, and the reverse. A moment is a ranked source inside the existing `evening` class below `monthAge` (NS-32, NS-51-R11); it is not a new class. Quiet or hidden books get none. Nothing counts moments, unwritten days or pictures in any surface and no analytics field carries them (NS-51-R12, R27).

### 8.5 How this reaches the daily habit
The push is the front door: on a day a real card exists, the one notification opens Moments on it. On a day with none, no moment is sent (the existing prompt reminder rules are unchanged). A parent who turns reminders off gets none, and the tab still works.

## 9. Day one, the permission, and first run

### 9.1 Day one before any permission is real

Under option A, Moments on day one is reached by the tab, not shown on landing. Under C or C2 it is the landing. Either way it must hold real things, so J8 passes. A parent who has finished first run, with no photo access and no letters, sees (wireframe `MOMENTS-day-one-wireframe.svg`):

1. **One value card**, no taller than a third of the screen: a labelled example collage ("An example") built from plain tinted paper tiles (token colours, no faces, no scene, no photograph) with Asha's date, one plain sentence of what the tab does and one sentence of what is read ("Only the dates are read, on this phone."), then two buttons: the ask and "Not now". The example is labelled so it can never be mistaken for the parent's own day. I did not draw illustrations: `DESIGN-LANGUAGE-V2-21nov.md` R5 says the closed book cover is the app's one illustration, with no faces and no mascot. If the founder wants drawn pictures, that is a reversal of R5 (section 14, R-9). Never the founder's screenshots, never a real photo of any family.
2. **Real cards below it**, from the six sources in section 4 that need no permission: a prompt card from the 111; the child's month-age card if a birth date was given; a day the parent typed, if any. There is no year-ago card on day one (no letter to look back at) and no card says there is none.
3. **No switch** (there is no Recent to switch to). It appears when access is on and there are days.

If the photo feature is off in the build (flag off, as in any build before NS-51 ships), there is no value card and no ask, because a screen must not promise a feature the build does not have (the live-site false-promise fix in PR #1255 is the same rule). Moments then holds For you only. If that is too thin to justify a tab, the tab waits for the build that has photo days (a ship-order question for the founder, section 16 Q-MT-2); I do not pretend a prompts-only tab is the same product.

### 9.2 The ask: primer, then Apple's sheet, with a comfortable "Not now"

1. The parent taps the ask on the value card ("Show my photo days", working words).
2. **Our primer** (a sheet, the `PermissionPrimer` component of E DESIGN 15a.3 and the A-S18 or E-S32 screen; the index says which id survives is not ruled): one plain sentence, then "Continue" and "Not now". Door lines (PRIV-R21; PROPOSED; words for `content`, counsel to read):
   - **Shown:** "{app} reads only the dates of your photos, on this phone, to show you days you may want to talk about."
   - **Records:** the parent's yes or not now, and when, on this phone; a small index of dates and system identifiers (at most 30 days, NS-51-R6). No photo, filename, album, place or person.
   - **Never:** reads a photo's pixels, place, people, or what it shows; sends anything off the phone; describes or captions a photo; asks again by itself.
   - **Decline:** "Not now" changes nothing. The deck keeps working without the photo days, and no reminder about it follows.
3. "Continue" shows **Apple's system sheet** (limited or full; either works, NS-51-R3). The ask is a direct tap (A8 in P-1267: no PhotoKit call at launch).
4. Result: allowed or limited builds the index and shows Recent; denied shows section 11.

Nothing nags. After "Not now" the value card collapses to one quiet row at the foot of For you ("Show my photo days"). There is no re-ask, no badge, no card that returns by itself (NS-51-R3, R18, R19). Apple's own guidance, as read in P-1267 (A8, A9), is that the ask is on a direct action and the person is not forced; my design adds the fallback that every other part of the tab and the existing "Start from a photo" on Home work with no permission.

### 9.3 First run order (K-02 and NS-39-R2 honoured)

```
Welcome  ->  (sign in)  ->  child name and birth date  ->  "The book is open."
   no OS permission prompt anywhere in first run (NS-39-R2)
Then, in the parent's own time, each ask only on the parent's tap:
   Microphone    at the first Speak           (existing primer A-S04.primer)
   Photos        on Moments, value card       (this concept, section 9.2)
   Reminders     after the first kept letter  (K-02, the card over the Book)
```

No ask fires by itself, and none stacks: each is a parent's tap on its own card. If the founder wants the photo ask in first run, that is a reversal of NS-39-R2 (section 14, R-7); I recommend not.

### 9.4 A parent who has not set up a child or recorded yet

- **Reach capture in one tap.** Under A: tap Home in the bar (Home's day-zero state shows Speak and Type) or tap the capsule on any card on Moments. Under C or C2 the first card is a prompt card with its capsule, so one tap on the landing screen reaches Ready, and Home is one tap in the bar.
- **No child set up.** Capture needs no child. Cards that need `{child}` read "your child" (the fallback in N5). The month-age and birthday cards are absent without a birth date, not greyed, and Moments does not ask for one; the child's birth date is asked where it already is (first run and Me, Children).
- **Nothing recorded yet.** There is no year-ago card and no "nothing here" line.

## 10. Prompt cards: only our 111, never generated

- Source: the written library in `packages/content/src/prompts.ts` (count and bands to be checked by `content`; this file does not recount). A prompt card shows a prompt's text exactly as written, with `{child}` filled.
- Selection: the same on-device selector as Home (`packages/core` prompt selection: age band, the child-input flag, safety tiers on the phone). Nothing is generated, rewritten, shortened or personalised from a photo. A prompt is never chosen because of what a photo shows.
- Not Home's prompt of the day: the deck skips the prompt Home shows that day, so one fact is in one place (P7).
- Refresh: one plain "Another thought" control per deck (the word Home already uses), not a refresh icon on every card. It swaps the prompt cards for others from the same library with a fade; it never loads new words from anywhere. Apple's refresh button is not copied because it implies the machine has more to say.
- No colour coding by kind, no coloured badge, no points, no "answered" mark (no streaks, points, badges, ever).
- Tapping a prompt card opens Ready with that prompt (section 7).

## 11. States

| State | For you | Recent | Notes |
|---|---|---|---|
| Day one, no permission | Value card, real cards (section 9.1) | Absent; no switch | Passes J8 |
| Not now (declined our primer) | Value card collapsed to one quiet row; the real cards | Absent; no switch | No re-ask |
| Allowed, loading the index | Cards that need no permission show at once | Plain paper tiles in the card shape, one fade, no spinner, no "scanning" or "looking" word, no shimmer | Index runs off the main thread and never blocks (NS-51-R38). Under Reduce Motion the tiles are static |
| Allowed, days found | Full | Days newest first, at most the index's 30 | |
| Allowed, no day found | Full | One quiet line, "No days to show yet." (PROPOSED), no suggestion to take photos | Not "you have no photos"; never a gap |
| Limited access | Full | Works on the selection; days only where the selection supports them (NS-51-R7); one quiet foot row "Choose which pictures" opens Apple's limited-library picker (NS-51-R4, R14); no automatic prompt | Never says which access is better |
| Denied | Full; the value card is gone | Absent | One calm line at the foot of For you: "Photo days are off. You can change that in Settings." with "Open Settings" and nothing else; no second system ask (NS-51-R19). This line on Moments is a reversal of "no other screen mentions it" (R-4) |
| Restricted (parental controls) | Same as denied | Absent | The line has no "Open Settings", since the parent cannot change it |
| iCloud original not on the phone | | The tile is a plain box; tapping follows NS-52-R9 | The index needs dates only, so nothing downloads (NS-51-R21) |
| Photo deleted after indexing | | The tile or the card drops without a word (NS-51-R22) | |
| Large library | Unchanged | The index is capped (30 days, 90 days); the list is windowed and thumbnails are requested lazily as cards come near the screen; no count, no "load more", no older control | Memory stays low; the Book holds everything older |
| Offline | Identical | Identical (all on the phone), except a plain box for an iCloud original | Nothing on this tab needs the network |
| Signed out, local start | Identical | Identical | Never asks to sign in |
| Second account on the phone | Own | Account B starts off, never reads A's index (NS-51-R24) | |
| Restored or new phone | Own | Off; no ask returns by itself (NS-51-R23) | The value card shows again, once, as on a first day |
| App lock up or app inactive | Cover | Every tile is an opaque box before the switcher snapshot, with or without App lock (NS-51-R25) | The tab is a screen full of a child's photos, so this matters more here than on a sheet |
| Flag off, or remote pause | Prompts and occasions only; no value card, no ask | Absent | Not greyed, not mentioned |
| iPad, Mac app, Expo Go, Android | | Absent | NS-49-R18 pattern |
| Error: the index fails | Full | Absent with no message | A failed read leaves no index and no message (NS-51 section 6) |

## 12. Benchmark rows to fill when B1 lands (nothing cited yet)

B1 (`wip/moments-b1`) was not readable when I wrote this (section 0.2). When it lands I will add, for each product it covers, one line under each heading below, keeping only what fits our rules (no machine words, no counts, nothing leaves the phone):

| Question | Where it lands in this file |
|---|---|
| How other apps choose the day's card, and how they keep it fresh without a streak | Section 4 |
| Whether others put the "from your photos" feed first, second or in the middle of the bar | Section 3 |
| How they ask for photo access and what they show to someone who declines | Section 9.2, section 11 |
| How their push and email carry one idea in one family | Section 8 |
| What they do that we must refuse (machine captions, place tiles, mood, counts, "memories" claims) | Section 14 and section 15 |

Until then, Section 3 and section 4 are design reasoning, not benchmarked, and I say so rather than borrow a claim from memory.

## 13. Layouts, accessibility, theme and motion

### 13.1 Text wireframes

For you, allowed (light, 375 pt):

```
 Moments                                   <- level 1 heading, `title1` serif
 Pick a day worth a letter to Asha.        <- job line, `subhead`
 [ For you | Recent ]                      <- system segmented control (glass, control layer)
 A day you added                           <- kicker
 +----------------------------------+
 | Sun 12 Nov                       |      flat card, paper
 | Nani visits         (Say something)|
 +----------------------------------+
 A year ago                                <- raised: a kept letter
 +----------------------------------+
 | [photo the parent attached]      |
 | Tue 21 Nov, last year            |
 | "We went to the park and Nani came"    |      the letter's own words, verbatim, opens the Book
 +----------------------------------+
 A thought to start with
 +----------------------------------+
 | What can you see out the window  |
 | tonight?            (Say something)|
 +----------------------------------+
 Another thought                           <- one quiet control
 --------------------------------------
 [ Home ] [ Moments* ] [ Book ] [ Me ]    <- navigation layer
```

Denied (foot of For you):

```
 Photo days are off. You can change that in Settings.    [ Open Settings ]
```

Limited (foot of Recent):

```
 Choose which pictures                                    (opens Apple's picker)
```

Loading (Recent): three paper-tone card shapes, still, no spinner.

### 13.2 iPhone SE 3 (375 by 667 pt) and AX5
- Four tabs at about 93 pt each; labels 13 pt, not scaled, with the Large Content Viewer as in the Home spec. The longest working label, "Moments", fits. A five-slot bar (option B) would be 75 pt each and is one more reason not to.
- Standard sizes: one card column, collage 2 by 2, capsule trailing. At AX5 the collage keeps a fixed height and stays 2 by 2 (it is a picture, not text); the date, label and capsule stack beneath it, the capsule full width at 56 pt and never overlapping the label. Letter text on the year-ago card is shown whole, never truncated (D-027), and the card grows. The segmented control becomes a two-row stack at AX sizes and keeps 44 pt targets. The page scrolls; nothing is pinned. At least 8 pt (12 pt at AX) between a card's body target and its capsule.
- Bold Text and Increase Contrast: the hairline becomes `controlBorder` per the v2 file; photo tiles get a 1 pt `line` edge so a pale photo never merges with paper in either theme.

### 13.3 VoiceOver
- Order: tab, heading "Moments", job line, switch ("For you, selected, 1 of 2"), then cards top to bottom.
- A card is one element with one label read in this order: kicker, date, the parent's label if any, then the action. Example: "A day you added. Sunday 12 November. Nani visits. Say something, button." The collage is not read tile by tile. Photo tiles carry no machine description; there is no generated alt text. A photo's accessible text is the parent's own words or nothing (NS-52). The label never counts photos.
- The capsule is the card's custom action ("Say something"); the card body's default action is "Choose photos". Headings rotor: the screen heading and the kickers.
- Segment change is announced once, politely ("Recent").
- The loading state announces nothing.

### 13.4 Reduce Motion, Reduce Transparency, Increase Contrast
- Motion only from `tokens.motion`: cards enter with `enter` (280 ms, 8 pt) staggered by `staggerMs` (30 ms, at most 6); the prompt swap and the segment change use `fadeMs` (200 ms). Under Reduce Motion every one is a fade or nothing. No parallax, no autoplay, no zoom on a collage, no shimmer, no confetti.
- Haptics: only the five intents in COMPONENTS 0.2, none on scroll.
- Reduce Transparency: our own switch becomes the solid `glassFallback`; the tab bar is the system's and adapts (not painted).
- No sound.

### 13.5 Dark and light
Both use the existing paper tokens. Dark separates cards by the v2 `surfaceRaised` step and the `highlight` edge, not by shadow. Photo tiles are the parent's own pixels and are not tinted or dimmed; a paper chip (not glass) carries any text over a photo. Contrast pairs are the token pairs already tested; I computed no new ratio and propose no colour.

## 14. Reversal register (each is a reversal the founder owns)

Each row says what the earlier ruling said, what this concept does, and which option it belongs to. No row is changed by this PR.

| Id | Earlier ruling and where | What this concept does | Option |
|---|---|---|---|
| R-1 | Three tabs, always; a fourth tab never for a feature (`06-HOME-BOOK-ME-IA-11nov.md` section 1; the founder's three-tab instruction of 11 Nov; IA-FINAL-20nov: three tabs) | Four tabs | A, C, C2 |
| R-2 | Home is the landing tab (`/`, spec 06 section 3) | Moments is the landing tab after the first kept letter (C2) or always (C) | C, C2 |
| R-3 | Photo moments appear only in the capture cluster menu; no tab, tile, strip or list; the picture start count is 1 on Home and 0 elsewhere (NS-51 section 3.3, R-IA-3, NS-50-R10, NS-49-R1) | A whole tab of photo days, and a capsule on each that starts capture | A, C, C2 |
| R-4 | No other screen asks for library access or mentions it when denied; the ask is on the Me row only (NS-51-R1, R19) | The ask and the one calm "off" line live on Moments; Me keeps the controls (C-S27) | A, C, C2 |
| R-5 | The capture menu offers only the newest moment, never a list, a count or an older one (NS-51-R8) | Recent is a list of up to 30 days, still capped, never counted | A, C, C2 |
| R-6 | Photo moments are drop C, after 1.0 approval, spike first (Q-PM-7, CL-052); no photo-library usage string in any 1.x build (BL-1305, NS-49-R25, `g6-production-flags-off.test.ts`) | The value card, the ask and Recent need the library module and the usage string in a build. The tab can ship earlier only as For you without the value card (section 9.1); anything with photo days waits for the founder's answer to Q-HEW-1 and Q-MT-2 | A, C, C2 |
| R-7 | No permission ask in first run (NS-39-R2); the reminder ask comes after the first saved letter (K-02) | **Honoured, not reversed**: the photo ask is never in first run and never fires itself. Reversed only if the founder asks for the photo ask inside first run, which I do not recommend | none |
| R-8 | Only Home starts a letter; capture has one entry and allow-listed doorways (J3, P1, P2, IA-R3) | A new allow-listed doorway, `source: "moments"`; no capture control of Moments' own | A, C, C2 |
| R-9 | The closed book cover is the app's one illustration (`DESIGN-LANGUAGE-V2-21nov.md` R5) | **Not reversed**: the example is plain tiles. Reversed only if the founder wants drawn example pictures | none |
| R-10 | Home lists no kept letters and shows at most one memory slip; no tab shows another's list (IA-R9, P6) | The year-ago card on Moments is one kept letter and a door into the Book, deduplicated against Home's slip | A, C, C2 |
| R-11 | Nothing is a "memory" or "moment" to a parent; glossary words only (`NEW-SCOPE-INDEX-11nov.md` section 4; NS-51 not in scope) | The tab label must be a glossary word (options in section 2.1); "Moments" is a working name | A, C, C2 |
| R-12 | The Photos permission journey is drawn in four places (A-S18, E-S32, C-S27, A-S17); which id survives is not ruled (`INDEX.md` section 7) | This concept uses one primer and one chooser and needs that ruling | all |

## 15. What we do differently from Apple's picker, and why

| Apple's picker (as described by the coordinator and P-1267) | Ours | Why |
|---|---|---|
| A machine-made title for a day | The date and the parent's own label only | The machine may remove and repair; it may never add meaning (CLAUDE.md constitution) |
| A map tile with a place name | No place and no map tile; a place only if the parent types it | Reverse-geocoding sends coordinates to a service, and a place is a guess we add (P-1267 section 5; Q-PM-5) |
| People names and contact photos | None | No face or person matching (direction 26) |
| Reflection prompt cards, coloured, with a refresh button | Paper cards, only our written prompts, one "Another thought" control | Colour is not a signal; prompts are words we wrote, never generated |
| Photo Memories a year earlier | A year-ago card from our own kept letters (and its attached photo) | The parent's own words are the memory; no "best" or "memories" claim (NS-51 not in scope) |
| Clusters with video lengths | A still, and a length only if `security` and counsel approve a metadata read | NS-51-R5 reads dates and identifiers only |
| A mood card with a prompt to Settings | None | Health data and a nag (P-1267 section 4) |
| A music tile | None | Not about the child; another permission (P-1267) |
| The system picker hands a suggestion to the journal | Home's capture, empty words field, parent's date | Words are the parent's |
| The app learns nothing until the person picks (system picker, no library permission) | **Ours learns more**: after the opt-in it reads dates and identifiers on the phone | An honest cost. Apple's route is the more private one; ours exists because it lets us show days in our own layout and join them to the parent's own occasions. Where Apple's picker is available, NS-49 level 2 ("Pick from recent days" on Home) stays as the no-permission route |

## 16. Questions for the founder (defaults proposed, none applied)

| Id | Question | Default |
|---|---|---|
| Q-MT-1 | Tab position: A (Home first, Moments second), C (Moments first), or C2 (Moments first after the first kept letter)? | A now; C2 as one later check with five parents |
| Q-MT-2 | Ship order: may the tab ship with For you alone before photo days exist, or does it wait for the build that has them? | Wait. A prompts-only tab is not this product and risks reading as mostly a promise (J8) |
| Q-MT-3 | Tab name: Days, Photos, or Ideas? | Days, subject to `content` and the Me "Days" page |
| Q-MT-4 | Is a fourth tab the answer, or should Moments live as a mode inside Home's cluster as NS-51 and NS-49 say today? | Fourth tab, because a list of days cannot live in a menu without the reversals in R-3 and R-5 anyway |
| Q-MT-5 | Do email nudges exist at all? A moment email can never be about a photo day (section 8.2) | Not before `legal` and `privacy` read a consent and channel plan |
| Q-MT-6 | Video length on a card (needs a metadata read beyond NS-51-R5)? | No, until `security` and counsel agree |
| Q-MT-7 | Drawn example pictures instead of plain tiles (reverses v2 R5)? | No |

## 17. Requirements (PROPOSED; ids local to this concept until `product` assigns cards)

Format follows the house style as I remember it: a person's sentence, then Given, When, Then; the permission carries Shown, Records, Never and Decline (PRIV-R21). `product` and `qa` own the final ids and test titles.

| Id | In a person's voice | Given, When, Then |
|---|---|---|
| MT-R1 | I can see a day worth talking about and start saying something in one tap. | Given an allowed library and a day in Recent, When I tap the capsule, Then Home's Ready opens with that card's shown photos attached and an empty words field, and no words, caption or date came from the photos. |
| MT-R2 | The tab never writes anything for me. | Given any card on the tab, When it is drawn, Then it shows only a phone-formatted date, my own label if I typed one, one fixed line and my own photos; a content test fails any string that names a subject, place, person or mood. |
| MT-R3 | I am never counted or scolded. | Given any day, Then no card, switch, tab, push or email shows a count, a gap, a streak, a badge or "again", "still", "don't forget". |
| MT-R4 | Before I give any permission, the tab already has something real. | Given a finished first run with no photo access, When I open the tab, Then it shows one labelled example, one ask, and at least one real card (a prompt, a month-age day or a day I typed), and no empty box. |
| MT-R5 | Asking about my photos is calm, and saying no costs me nothing. | Given the value card, When I tap the ask, Then one sentence shows first (Shown, Records, Never, Decline as in section 9.2), Apple's sheet appears only after Continue, and Not now changes nothing, shows no reminder and does not stop any other part of the tab. |
| MT-R6 | The app does not ask about photos while I am setting up. | Given a fresh install through "The book is open.", Then no photo prompt and no system permission prompt has appeared (NS-39-R2), and none appears by itself afterward. |
| MT-R7 | My prompts are written by people. | Given a prompt card, Then its text is a prompt from the written library, unchanged; a build test fails any prompt card whose text is not in the library. |
| MT-R8 | My child's photos are not shown to people nearby. | Given App lock is up or the app is going to the switcher, Then every thumbnail is an opaque box (NS-51-R25). |
| MT-R9 | A push or email about a day tells nobody what is in my photos. | Given a moment push, Then its words never mention pictures on a lock screen by default (Q-PM-9), and given any email, Then it carries no photo, no photo date and no identifier. |
| MT-R10 | I can use the tab at the largest text size and with VoiceOver. | Given AX5 with Bold Text on an iPhone SE 3, Then every card is whole, every target is at least 44 pt, no letter text is truncated, and VoiceOver reads each card as one element in the order in section 13.3. |

## 18. Hand-offs

- `content`: the tab word and verb, job sentence, kickers, the capsule word, the switch labels, the primer sentence and door lines, the quiet lines in section 11, the push and email lines in 8.1. Glossary rows for the tab word.
- `product`: the founder questions in section 16, the card ids, and the reversal register; reconcile with the Home wheel (#1264, sources 2 to 4 and 6) so one fact has one owner.
- `privacy`, `legal`, `security`: P-1267's CQ-1 to CQ-10; Q-MT-5 and Q-MT-6; the usage string and label, same build as behaviour.
- `mobile`: nothing to build from this file. A build starts only after the founder owns section 14 and each card row is amended in its own PR. Findings for the spike: the full-screen Ready over a tab (a doorway like widget and Siri), a segmented control that can be a system control, thumbnail memory with a windowed list.
- `analytics`: no event for this tab carries a date, count, place, album, photo or label property.
- `design-systems` (me): after the decision, component specs in `COMPONENTS.md` (`MomentCard`, `ValueCard`, `FeedSwitch`) and any token, in their own PR.

Content-rule check on this file: no em or en dashes, curly quotes, ellipsis characters or emoji; no count of gaps, no streak, point or badge; nothing says a machine writes; the child is `{child}` or Asha in examples only.
