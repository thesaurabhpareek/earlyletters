# Early Letters: Creative Direction

v0.3, 2026-10-03 (v0.3: store screenshots and preview video show only v1.0 features, brand-review BRD-01, 02, 07, 08, 09, 17; v0.1 2026-10-01; v0.2 replaces the envelope-line motif with the quotation-mark system of the approved primary mark, D-071). Companion to `DESIGN_LANGUAGE.md`, `MOTION.md` (timing) and `docs/brand/BRAND_SYSTEM.md` (the mark, its files and registry contexts). Sources C1 to C15 were opened for this review. **(opinion)** marks judgement. Sample family: fictional "Asha".

## 1. Benchmark

| Work | Why it works | Transfer | Avoid | Source |
|---|---|---|---|---|
| **Google "Dear Sophie"** (Chrome, 2011) | A dad writes to his daughter from birth: "I've been writing you since you were born." Told in typed words on screen. | Apple now requires exactly this grammar for previews (screen only, C12). Ordinary, funny moments beat milestones. | A score that "aims for the tear ducts" (C1). The child could not hold the account (C2): never show a promise the product cannot keep. | C1, C2, C3 |
| **Apple "Shot on iPhone"** (2015 on) | Real users' photos are the ad; 2025 Cannes Grand Prix for "transforming everyday moments into art" (C4). | A real family's real recording is the creative, credited by relationship: "Papa, Month 3". | Professional work presented as ordinary use. | C4 |
| **Apple Journal launch** | Prompts, "preserve rich and powerful memories", on-device privacy (C5). | Prompts in hero shots; privacy said in the creative, not footnotes. | "Intelligently curating" language (C5). We never hint that software shapes words. | C5 |
| **Storyworth** | Gift-first: "Help them see their life in a whole new light"; weekly questions; tell stories by phone; hardcover book (C6). | Grandparent gift mechanic, phone-simple steps, the book as payoff. | Review counts and press badges (C6). We have none and claim none. | C6 |
| **Chatbooks** | "The Photo Book That You Can Actually Finish", "Make It With One Hand" (C7). | Honest, tired-parent humour; one-hand framing. | Price-led hooks; subscription push. | C7 |
| **Headspace** (2024) | Faces showing "stress, sadness, contentment, and every mood in between"; "kind, warm and welcoming" (C8). | Permission for the full range: a hard night is a letter too. | Mascot faces. Ours has none. | C8 |
| **Airbnb illustration** | "Grounded, scalable, lightweight, and diverse"; drawn from real photos; "'Normal' is diverse" (C9). | Real reference, minimal line, whitespace, diversity by default. | Bubbly childlike style; outlines that default to one ethnicity (C9). | C9 |
| **App Store page** | First 1 to 3 screenshots show in search; previews autoplay muted; show Dark Mode (C10). | Lead with the essence; captions carry meaning silently. | Title art or login screens (C12). | C10 to C13 |
| **Google Play listing** | 8 screenshots, muted YouTube preview, 1024x500 feature graphic (C14). | Same story, own exports, localised. | Ranking, award, price or promo text (C15). | C14, C15 |

**Take (opinion):** Dear Sophie's form, Shot on iPhone's proof, Storyworth's gift. **Refuse:** swelling strings, crying on cue, any absent reader.

## 2. Creative platform

**Big idea: Said once. Heard for years.** A letter is a small thing said on an ordinary Tuesday. Kept exactly as said, the child can read and hear it again and again. The feeling comes from the real voice, not the music.

| Territory | Meaning | Sample line |
|---|---|---|
| **A. Exactly as you said it** | Fidelity: the real words, the laugh halfway through, Hindi and English in one sentence. | "Not the best version. Yours." |
| **B. Small days** | The ordinary day matters; no milestones needed. | "Nothing much happened today. Tell Asha anyway." |
| **C. Everyone who loves Asha** | Nani, Papa, Amma, one book. | "One child. Every voice that loves them." |

**Chosen: A**, with C as the gift and grandparent sub-line and B as tone. Why (opinion): it is the tagline, so assets compound; it is provable on screen in three seconds; it separates us from journals that tidy your words; it makes multilingual families the hero.

## 3. Visual system

### The brand device: two opening quotation marks
The mark (BRAND_SYSTEM.md 1) is the only brand device: a large and a small opening quotation mark, leaning together, parent and child, the moment before someone speaks. It replaces the earlier "one continuous line that folds into an envelope" motif everywhere. Files come from the registry (`assetFor(context)`), never from a path.
- **The pair** (`logo.symbol.*`) is the signature: debossed or foiled on the printed cover, centred on the splash, top-left of the caption band on store screenshots, on the Play feature graphic.
- **The small cut** (`logo.symbol.small.*`) is the same pair drawn for 12 to 23 px, not a separate "small mark". It is a logo, not a glyph: never a bullet, never decoration on the site. Its one extra use is a section break in the printed book and the PDF, at most once per page (context `book.page`). Everywhere else use a plain rule or space. One logo per screen or page section (BRAND_SYSTEM.md 9).
- **The end-of-letter mark.** A printed letter may end with the small-cut pair, still opening quotes: the letters are still being written. Never closing quotes.
- **The pair opens a quote.** On cards (invite, gift, social) a letter's line may open with the pair in `accent` or `inkMuted`, then the words in Literata. Opening only: never closing marks, never a speech bubble, never a mark rotated or mirrored.
- **One colour** per use: ink, inkDark, accent (the one warm moment on paper) or accentDeep foil. No gradient outside the app icon tile.
- **The wordmark is artwork.** Never retype the name in EB Garamond or Literata to stand in for the lockup; EB Garamond appears only as outlined artwork and brand display (cover title pages, gift cards, OG image).

### Illustration
Line drawings are illustration, not the brand mark. They may show any object (envelope, lamp, moon, page, window), never stand in for the logo, never sit locked up with the wordmark, and never reshape a quotation mark into an object. Where a surface needs to say "Early Letters", it uses the mark from the registry; where it needs to set a mood, it may use a drawing. The web scroll film (`docs/web`, branch `feat/web-scroll-film`, another lane) draws a window, lamp, moon, envelope and page: that is allowed under this rule, and the film's brand moment is still the quotation mark from `web.header` or the symbol, not an envelope.
- **Motif:** single-line drawings of the objects of a letter and a night (a page, a lamp, a moon, a window). One drawing per screen at most.
- **Line:** single weight, 1.5pt at a 24pt artboard (2pt on store art), round caps. Ink `inkMuted` #6B645B on paper #FBF8F3; dark #B3AA9E on #161412. One optional `accentSoft` #F1E6DC wash behind the main object.
- **No faces, no mascot, no drawn babies.** Objects imply people: glasses on an open book, shoes by a door, a dupatta over a chair arm. Drawn from real homes.
- **Never:** wax seals, quills, ribbons, sparkles, confetti.
- One SVG master for iOS and Android.

### Photography
Documentary, not lifestyle. Real homes, available light, their own mess. Warm grade, never faux-vintage. 4:5 crops, text below, never over faces. No stock, studio or newborn props.

**Shot list: 10 real moments**
1. Parent on the kitchen floor, talking into the phone while the baby chews a steel spoon.
2. Papa on the bed edge at night, phone lit, baby asleep on his chest, mid-sentence.
3. Nani on the sofa, glasses on, phone held at arm's length in both hands.
4. A thumb on the red record circle, a paratha beside it.
5. A three-year-old under a blanket, ear to the phone, during Read together.
6. Two grandparents over one phone, one pointing.
7. A parent on the metro, earphones in, quietly talking.
8. Phone face down after a letter, room dark, parent lying back.
9. A four-year-old laughing at a parent's tired old recording, the parent laughing beside them.
10. The printed book on a lap, a small hand on the page (only once print exists).

### Typography
Headlines in Literata 500, sentence case, 6 words or fewer per frame. Support in Mukta. Devanagari in Tiro Devanagari Hindi at about 1.08x. Straight quotes only.

### Real voice in video
- The voice is the soundtrack. Original recording untouched: high-pass only, no pitch or character change.
- Music optional, at least 18 dB under the voice or silent while it plays (opinion); one solo instrument at most.
- Every spoken line is on screen; both stores autoplay muted (C10, C14). Burn the captions in (v1.0 Read together has no word highlight; from v1.1 the highlight can be the caption).

## 4. Store

### Six screenshots: v1.0 set

Only what v1.0 does (BRAND.md "Proof discipline"; rule 1 of this file: never show a promise the product cannot keep). Frame spec: registry context `appstore.screenshot-frame`.

| # | Headline | Screen | Treatment |
|---|---|---|---|
| 1 | Exactly as you said it. | Letter view, "From Papa", Month 4, a single-language English letter: "Asha, today you held the spoon by yourself for the first time, and then threw it at me." | Paper. Shows in search. |
| 2 | Talk for a minute. | Listening: breathing glow, transcript lines arriving. | Subline "Your words, on the page." |
| 3 | Read together, in their voice. | Read together: the letter on the page, audio playing (no word highlight), Large Print. | **Dark mode**, moon drawing (C10). |
| 4 | From Mama, from Papa. | Month chapter, letters signed by the two parents. | Subline "Two voices, one book." |
| 5 | Your words stay in the language you said them. | A Devanagari letter from a parent (Hindi only, one language per letter). | Bilingual headline. |
| 6 | A book that grows month by month. | Chapter covers, Month 1 to 6. | Subline "Free PDF any time." No print claim until print ships. |

### v1.1 set (do not ship before the features do)

| # | Headline | Screen | Needs |
|---|---|---|---|
| 1 | Exactly as you said it. | A Hinglish letter: "Asha, aaj tumne pehli baar spoon pakda, and then threw it at me." | Hindi and English in one letter |
| 3 | Read together, in their voice. | Read together with the word highlight moving. | Word highlighting |
| 4 | From Nani, from Papa, from everyone. | Letters signed by three people. Subline "Only the family you invite." | Family beyond the co-parent (D-055) |
| 5 | Your words stay in the language you said them. | Devanagari and English letter from Dadi. | Grandparents, mixed languages |

**App Store:** 1260x2736 (6.9"), JPG or PNG, no alpha, up to 10 (C11); must show the app in use (C12).
**Google Play:** up to 8 per device type, 9:16, long side at most twice the short side (C14). **1260x2736 fails (ratio 2.17)**, so export 1080x1920 separately. Add a 1024x500 feature graphic (context `play.feature-graphic`, planned for v1.1 with Android: the quotation pair, `logo.symbol.accent` on paper or `logo.symbol.reversed` on paperDark, plus the tagline in its canonical treatment, Literata 400 italic inkMuted, BRAND_SYSTEM.md 5) and a 512x512 icon. No price or promo text; a separate set per language (C15). Android frames or frameless (opinion).

### Preview video: "Tuesday" (25s)
App Store: screen capture only, no hands or people; narration allowed; 15 to 30s; 886x1920; 30 fps max (C12, C13). The narration is the real parent's in-app recording.

| Time | Screen | Sound |
|---|---|---|
| 0 to 3 | Tonight, prompt "What made Asha laugh today?" Caption "Exactly as you said it." | Room tone. |
| 3 to 9 | Speak; breathing glow; lines arrive. | Real Papa: "Asha, today you found the light switch. On, off, on, off. Your Nani was not amused." |
| 9 to 13 | Review: one quiet underline fixed; Save; letter settles into Month 9. | His laugh, then quiet. |
| 13 to 18 | Book scrolls back; Mama's letter from Month 3 opens. | Mama, one sentence, words on screen. |
| 18 to 24 | Read together, dark, the letter on the page while it plays (no highlight in v1.0). | Papa's letter from the start. |
| 24 to 25 | End card (context `video.end-card`): stacked lockup with the tagline. | Out on his voice, no sting. |

v1.1 cut, once the features ship: the 13 to 18 beat becomes "From Nani" in Hindi, and 18 to 24 shows the word highlight.

**Play:** same cut on YouTube, public or unlisted, ads off; first 30s autoplay muted (C14). Burn in captions; auto-captions will struggle with Hindi (opinion).

## 5. Launch creative

### Film: "Exactly as you said it" (60s)
One real family across a year, built only from letters they actually recorded.
- **0 to 10:** black, a tired 2 a.m. voice: "Okay. You finally slept. I wanted to tell you about your hands." Words appear in Literata.
- **10 to 45:** shot-list moments, each carried by a different voice: Mama in the kitchen, Nani in Hindi, Papa on the metro. Datelines Month 2, 5, 9. Mostly small and funny; one hard night, honestly said.
- **45 to 55:** bedtime Read together. The child, now four, hears Papa's Month 2 letter with Papa beside them; both laugh at how tired he sounded.
- **55 to 60:** "Said once. Heard for years." Then the brand line.

The author is always present. The laugh is the peak, not tears.

### Social

| Format | Concept | Notes |
|---|---|---|
| **Voice to letter reveal (15s, 9:16)** | Black frame, real voice; words land on paper line by line; "From Amma" last. | Caption-first. Weekly series, one voice each. |
| **Grandparent reaction (20 to 30s)** | A grandparent hears their own child's letter to the grandchild in Read together. Fixed camera, one take. | If they don't react, use it anyway. Quiet is truthful. |
| **Read together at bedtime (15 to 30s)** | Low light, phone on the pillow, highlight visible, a small hand tapping Next. | Child's face never required. |

### Grandparent gift
- **Invite card:** printed A6 card (registry context `invite.card`): the quotation pair opens the line "Your stories belong in Asha's book." in Literata; horizontal lockup at the foot, at least 27 px tall. Inside: "Tap the red circle and talk." plus a QR. (v1.0 invites are co-parent only, D-055; the grandparent card is v1.1.)
- **Message for parents to send:** "Nani, Asha's book has a page for you."
- **When print ships:** "Early Letters: Year One" as the gift grandparents give back, at "{price}", shot as a real book on a real lap.

## 6. In-app emotional moments

How each should feel; timing is in `MOTION.md`.

| Moment | Feel | Visual and words |
|---|---|---|
| **Onboarding** | Opening a letter someone left for you. | The small-cut lockup (context `app.header`) once at the top; then three line drawings as illustration: a lamp switched on, a blank page, a page with one line. The brand moment is the quotation pair, not a drawing. "Letters for someone small." |
| **Empty Book** | An open notebook, not a missed assignment. | Paper cover, month numeral. "Month 1 is waiting for its first letter." |
| **Empty Family** | A table with one chair pulled out. | "Just you, for now. Letters are lovelier with more voices." |
| **First letter** | A soft exhale; the letter has a home. | The letter card settles into Month N, its first line opened by the small quotation mark. "Asha's first letter. Kept exactly as you said it." No badge. |
| **100 letters** | Finding an old note in a coat pocket. The reward is the past, not the number. | Once, in the Book only, never a push: "One hundred letters for Asha." One action: "Hear the first one." |
| **First grandparent letter** (v1.1, D-055) | A letter arriving in the post. | Letter card signed "From Nani" in Literata italic, opened by the quotation pair; parent approves. Push: "Nani wrote a letter to Asha." |
| **First Read together** | Lights going down at bedtime. | After the last word, the moon drawing: "That was Papa, Month 3." Then stillness, no next prompt. |
| **Printed book cover** | A book that sits on a shelf for years. | Cloth in paper or `accent` brown, the quotation pair debossed (context `book.cover.emboss`: symbol alone, 18 to 30 mm, lower third, blind or accentDeep foil), child's first name in EB Garamond (brand display, BRAND_SYSTEM.md 5), "Year One" below in EB Garamond; interior pages in Literata (context `book.page`). No cover photo by default (opinion: photos date the object; use one on the title page). |

## 7. Production

| Work | Who | Why |
|---|---|---|
| Screenshots, preview, type, copy | In-house | Real UI; changes each release. |
| ~15 line drawings | **Commission** one illustrator, ideally with South Asian domestic reference | One hand makes a system. The brief excludes the logo: the mark is fixed (D-071). |
| Photo and film | **Commission** a documentary family photographer and small crew | Real homes need patience; agencies stage. |
| Casting | In-house: friends of friends, early users who opt in | Real families, not models. |
| Voices | Cast families only | Never voice actors for letters. |

**First-wave assets:** 6 screenshots x (App Store 1260x2736, Play 1080x1920) x (English, Hindi); preview video (App Store 886x1920, Play YouTube cut); Play feature graphic and icon; 15 SVG drawings; photo library from the shot list with 3 to 4 families; 60s film with 15s and 6s cutdowns; three social templates (post plate `social.post.template` and the 9:16 end card exist; story and cover still to make); grandparent invite card (v1.1).

### Consent rules (flag for counsel)
- **Adults:** model release for image, voice and likeness, with media, territory, duration and paid ads listed separately.
- **Children:** written consent from every parent or guardian with authority. Never the full name, school, location or birth date; first name only if the family chooses, otherwise "Asha".
- **Voice:** its own release, tied to specific recordings. No re-edit into new uses without telling the speaker.
- **Customer letters are never marketing.** Nothing written in the app is used in creative unless recorded for the shoot under separate release. The privacy promise depends on it.
- **Withdrawal:** families can retire assets at any time; re-consent or retire child imagery after a set period (opinion: 2 years). Children 7 and older are also asked in plain words, and "no" is final (opinion).
- **Counsel to confirm:** India DPDP Act parental consent; GDPR and UK GDPR if shooting or advertising in Europe; US publicity and child-performer rules; biometric-law exposure for voice in ads; Apple, Google and ad-platform rules on minors.

## Sources opened

| # | Source |
|---|---|
| C1 | [TIME: Dear Sophie](https://content.time.com/time/specials/packages/article/0,28804,2101344_2101187_2101177,00.html) |
| C2 | [TechCrunch: Dear Sophie and account age](https://techcrunch.com/2011/05/09/attention-dear-sophie-inspired-parents-you-cant-actually-create-a-google-account-for-your-kid/) |
| C3 | [HuffPost: Chrome offline campaign](https://www.huffpost.com/entry/google-chrome-ads-dear-sophie-it-gets-better_n_857494) |
| C4 | [MacRumors: Shot on iPhone Grand Prix](https://www.macrumors.com/2025/06/19/apples-shot-on-iphone-campaign-wins-award/) |
| C5 | [Apple Newsroom: Journal](https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/) |
| C6 | [Storyworth](https://welcome.storyworth.com/) |
| C7 | [Chatbooks](https://chatbooks.com/) |
| C8 | [It's Nice That: Headspace](https://www.itsnicethat.com/articles/italic-studio-headspace-graphic-design-project-250424) |
| C9 | [Airbnb Design: Your Face Here](https://medium.com/airbnb-design/your-face-here-9aa1d4970d6c) |
| C10 | [Apple: Product page](https://developer.apple.com/app-store/product-page/) |
| C11 | [Apple: Screenshot specs](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) |
| C12 | [Apple: App previews](https://developer.apple.com/app-store/app-previews/), [Review Guidelines 2.3.3, 2.3.4](https://developer.apple.com/app-store/review/guidelines/) |
| C13 | [Apple: Preview specs](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications) |
| C14 | [Play: Preview assets](https://support.google.com/googleplay/android-developer/answer/9866151) |
| C15 | [Play: Listing best practices](https://support.google.com/googleplay/android-developer/answer/13393723) |
