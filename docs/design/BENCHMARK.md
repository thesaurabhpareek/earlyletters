# Early Letters: Design Benchmark

Owner: visual language / tokens. Date: 2026-10-01.
Every factual claim cites a page opened for this review. **(opinion)** marks design judgement. Third-party teardowns are labelled.

## Sources opened

| # | Source | Used for |
|---|---|---|
| S1 | [AIGA Eye on Design: Airbnb's new typeface](https://eyeondesign.aiga.org/airbnbs-new-typeface-is-a-case-study-in-unified-accessible-design/) | Airbnb Cereal |
| S2 | [It's Nice That: Airbnb app redesign (May 2025)](https://www.itsnicethat.com/articles/airbnb-app-redesign-140525) | Airbnb 2025 app |
| S3 | [Design Bootcamp (Medium): Airbnb Summer 2025 update](https://medium.com/design-bootcamp/airbnb-summer-2025-update-heres-what-s-new-and-why-it-matters-0ced2338b921) | Airbnb 2025 icons/motion |
| S4 | [VoltAgent awesome-design-md: Airbnb DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md) (third-party extraction of airbnb.com CSS) | Airbnb radii, spacing, type sizes |
| S5 | [Apple Newsroom: Apple launches Journal app](https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/) | Apple Journal |
| S6 | [Day One: Features](https://dayoneapp.com/features/) | Day One |
| S7 | [It's Nice That: Italic Studio x Headspace rebrand](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424) | Headspace |
| S8 | [App Store: Things 3](https://apps.apple.com/us/app/things-3/id904237743) and [9to5Mac: Things 3 launch](https://9to5mac.com/2017/05/18/things-3-mac-iphone-ipad-watch/) | Things 3 |
| S9 | [Apple Support: Read books in the Books app on iPhone](https://support.apple.com/en-us/guide/iphone/iphc1af7c57/ios) | Apple Books reading view |
| S10 | [Readmio](https://www.readmio.com/) | Kids' read-aloud |
| H1 | [HIG: Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Dynamic Type table |
| H2 | [HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | Targets, contrast, motion |
| H3 | [HIG: Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | Detents, grabber |
| H4 | [HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Navigation |
| H5 | [HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Liquid Glass |
| H6 | [HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) and [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) | Motion, haptics |

HIG text was read from Apple's documentation JSON for the same URLs.

---

## 1. Airbnb (founder's reference)

**What the sources say.** Cereal was commissioned so one font covers "website and apps to billboards", with "adjustments to qualities such as stroke width and x-height built in depending on type size"; its lead noted "90% of UI is text" and the face is "extremely neutral in appearance overall" (S1). The 2025 app moved to "a softer feel across the board" with more rounded edges, new icons described as "playful", and the Trips tab rebuilt as a "living itinerary" (S2). The icons are "3D, skeuomorphic, Pixar-inspired", with "smooth animations, subtle lighting, soft curves, and drop-shadows" (S3). A third-party CSS extraction of airbnb.com records card radius ~14px, pill (fully rounded) search, 48px button height, a 4/8-based spacing ramp (4, 8, 12, 16, 24, 32, 48, 64), and display type at modest weights (500/600) at 22 to 28px, noting "the brand trusts photography and generous whitespace over typographic muscle" (S4).

**Adopt**
1. **Quiet type, loud content.** Neutral, medium-weight headings; let the letters and photos carry emotion (S1, S4). We apply this to the UI sans; the serif is reserved for the child's book.
2. **Soft, consistent rounding.** A small radius ladder (8 / 14 / 20 / pill) mapped to object size, not chosen ad hoc (S4). Our `radius.md = 14` deliberately matches.
3. **A 4pt spacing ramp with big jumps between sections** (S4). Whitespace between sections is what reads as "premium".
4. **The "living itinerary" idea** (S2) maps directly to the Book: not a list of records but a story organised by time (month of age).
5. **Photography framed full-bleed inside rounded cards** with text below, not on top **(opinion, observed in the Airbnb app; not stated in the opened sources)**. Keeps faces unobscured.

**Avoid**
- **3D skeuomorphic icons and glossy lighting** (S3). Joyful for a marketplace, but they compete with a child's photos and age badly in a keepsake meant to last 18 years **(opinion)**.
- **A single high-voltage brand colour on every CTA** (Rausch, per S4). Early Letters' accent is a muted brown; urgency colour is the wrong signal at 2 a.m. **(opinion)**.

## 2. Apple Journal

**What the source says.** "Intelligently curated personalized suggestions" from photos, places and workouts; "daily reflection prompts"; entries can include "photos, videos, audio recordings, locations"; "scheduled notifications can help make journaling a consistent practice"; entries are encrypted when the phone is locked and can require Face ID; "journaling suggestions are created on device" (S5).

**Adopt**
1. **Gentle prompts instead of a blank page.** One prompt at a time on Tonight ("What did she do with her hands today?").
2. **Mixed-media entries** (S5): a letter can carry its recording plus one or two photos.
3. **User-scheduled reminder, not a streak.** A single opt-in evening nudge at a time the parent chooses.
4. **Privacy as visible UI**: an optional Face ID lock and a plain statement of where recordings live.

**Avoid**
- **Ambient data suggestions** (location, workouts). Surfacing "you were at the hospital" is a trust risk for families **(opinion)**.

## 3. Day One

**What the source says.** "Dictate entries with voice transcription or record stories and impressions with audio"; "On This Day"; multiple journals; templates; "journal streaks"; end-to-end encryption; "high quality printed books" (S6).

**Adopt**
1. **Audio and transcript live together** in one entry (S6). We go further: the audio is the primary artefact, text is its caption.
2. **"On This Day" resurfacing**, reframed as "One month ago, Mama wrote…" on Tonight.
3. **Print as the end state** (S6). Lay out the Book screen like spreads so the print edition is a continuation, not a different product.
4. **E2E encryption as a headline trust claim** (S6), if engineering can support it.

**Avoid**
- **Streaks** (S6 lists "journal streaks"). Explicitly banned by our brief; guilt is the enemy for tired parents.
- **Many journals with colour coding.** One child = one book. Multiple children get separate books, not tags **(opinion)**.

## 4. Headspace

**What the source says.** The rebrand by Italic Studio kept the signature orange but added supporting colours to "represent the range of human emotions"; illustrations now show "stress, sadness, contentment, and every mood in between"; Colophon adapted Aperçu with curves that "mimic the shape of the Headspace smile"; animation is used to "help simplify complex ideas"; tone is "kind, warm and welcoming" (S7).

**Adopt**
1. **Breath as a visual metaphor.** Headspace's animated, breath-led motion (S7) validates our "breathing glow" on the recording screen.
2. **Emotional range, not forced cheer.** Copy and empty states allow "hard day" letters; nothing assumes a smile.
3. **One ownable shape echoed in type and UI** (the smile curve, S7). Ours: the soft envelope-flap arc used in the capture surface and chapter covers **(opinion)**.

**Avoid**
- **Bright, "bold and lively" palette** (S7). Right for a mental-health brand fighting greyness; wrong for a night-time keepsake whose dark mode must not glare.
- **Mascot characters.** The child is the character; a mascot would compete **(opinion)**.

## 5. Things 3

**What the sources say.** "Drag the + button to insert to-dos anywhere in a list" (Magic Plus); a "This Evening" section, "a special place for your evening plans"; "headings to structure your list"; version 3.22 added "increased rounding of corners" (S8). 9to5Mac notes items moved "as if they were physical objects" (S8).

**Adopt**
1. **Time-of-day framing.** "This Evening" (S8) supports our home tab being **Tonight**, not "Home" or "New".
2. **Physicality in small interactions**: cards that lift slightly on press (`motion.snappy`, `elevation.2`).
3. **Headings as structure**: month chapters work like Things' headings, a typographic divider rather than a boxed section.

**Avoid**
- **A floating draggable + as the only capture affordance.** Our brief requires Speak and Type as equal, labelled, large buttons, not a hidden gesture.
- **Dense list views.** Things is a productivity tool; letters need air **(opinion)**.

## 6. Apple Books (reading view)

**What the source says.** In Themes & Settings readers can enlarge text with "the large A", choose page turn "Curl, Fast Fade, or Scroll", pick page themes "such as Quiet or Bold", change font, turn on "Bold Text", and customise spacing and justification under Accessibility (S9).

**Adopt**
1. **Reader-owned text size inside the reading view** (S9), on top of Dynamic Type. This is the grandparent feature: an "Aa" control in Letter reading view.
2. **Bold Text and line-spacing options** (S9) map to our `readingScale` and a "comfortable spacing" toggle.
3. **"Fast Fade" style transitions** (S9) as the Reduce Motion default between letters.
4. **Chrome hides while reading** **(opinion, common reading-app behaviour; not stated in S9)**.

**Avoid**
- **Page-curl skeuomorphism.** Tiring nightly **(opinion)**.

## 7. Readmio (kids' read-aloud)

**What the source says.** The parent reads aloud and the app "follows along", "automatically adding sounds and music when you get to the bold text"; they "deliberately chose to focus on the sense of hearing" and avoid in-story illustrations: "Your voice acting and facial expressions are what shall open the imagination" (S10).

**Adopt**
1. **Voice-first, image-light reading.** Read together is about the author's voice; the screen is typography, not illustration (S10 validates this choice).
2. **Visible text tracking the voice** (S10 follows reading position). Our word highlight is the same principle, played in reverse.
3. **Bold text as a cue** (S10). We avoid bold for highlight (it reflows lines); we use an `accentSoft` wash behind the current word **(opinion)**.

**Avoid**
- **Sound effects and music layered over the voice** (S10). The original recording is the treasure; adding SFX would edit a grandparent's voice **(opinion)**.

## 8. Apple HIG constraints we inherit

- Default iOS body size is **17 pt**, minimum **11 pt**; offer text enlargement of **at least 200%** (H2).
- Large (default) Dynamic Type table: Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13 (H1). Body reaches 23/29 at xxxLarge and 53/62 at AX5 (H1).
- **"Keep text truncation to a minimum as font size increases"** (H1).
- Controls: **44x44 pt default, 28x28 pt minimum** on iOS; about 12 pt padding around bezelled elements (H2).
- Contrast: Apple uses WCAG AA values as guidance and asks to check both light and dark (H2).
- Reduce Motion: tighten springs, replace x/y/z transitions with fades, avoid animating blurs (H2).
- Sheets: support the **medium detent** for progressive disclosure; include a **grabber** on resizable sheets (H3).
- Tab bars are for **navigation, not actions**; keep them visible; single-word labels (H4).
- **Don't use Liquid Glass in the content layer**; use it sparingly; standard materials remain for content (H5).
- Motion should be purposeful, "brief and precise" (H6). Haptics should be used consistently and complement other feedback; prefer short haptics for discrete events (H6).

## Synthesis (opinion)

Airbnb gives the **structure** (radius ladder, whitespace, quiet type, photography-first cards). Books and Readmio give the **reading** model (reader-owned size, voice-led). Journal and Day One give the **capture and trust** model (prompts, audio + text, encryption, print), minus streaks. Headspace gives the **emotional motion** (breath). Things gives **time-of-day framing** (Tonight). None pairs a person's recorded voice with their own words, highlighted, for a child: that is ours.
