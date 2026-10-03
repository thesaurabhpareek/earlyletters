# 01. The problem

Status: Draft V2, 3 Oct 2026. Evidence labels and source ids follow `_AUTHORING.md` section 6. Research files: R1 competitors, R2 customers, R3 market, R4 platform and policy, R5 speech and languages (all in `research/`); UR and CR are the 1 Oct research in `docs/research/`.

## 1. In one paragraph

Parents want to keep the early years for their child, in their own words, and most of them do not manage it. The baby book gets a burst of effort in the first weeks and then sits in a drawer [S] UR S24, S26, S27. The time is not there: adults whose youngest child is under 6 have about 3.2 hours of leisure a day, 2.4 hours less than adults without children [F] R2-S25, and many of the remaining minutes are spent holding or watching a child [F] R2-S26. What they keep instead is scattered: the camera roll, texts to a partner, a notes file, an email account set up for the child to read at 18 [S] UR S24, S25, S26, S30. The products built for this either want long typed entries, sell photo albums, or now rewrite what the parent said into polished prose [F] CR section 1, R1 section 0. None of them keeps the parent's actual words and voice, from both parents and the wider family, filed by the child's age, in the languages the family speaks.

## 2. What the evidence says

### 2.1 Baby books go unfilled, and it feels like failure
- [S] Parents describe the unfilled baby book as a quiet source of guilt; the pattern is a burst in the first weeks, then months of nothing. Blank books are reported at 14 months, 19 months and nearly 3 years [S] UR S24, S26.
- [S] Fixed fields do not fit real life: "firsts" are ambiguous and some prompts feel trivial [S] UR S24.
- [F, weak] Second children get noticeably less recorded (UK survey, 2013, commissioned by a photo studio, directional only) [F] UR S7.
- [F] 35% of parents of adult children wish they had saved more; 50% among divorced parents [F] UR S8.

### 2.2 The constraint is minutes and hands, not motivation
- [F] 3.2 hours of leisure a day with a child under 6; secondary childcare of 4.2 hours on weekdays and 7.7 on weekend days [F] R2-S25, R2-S26.
- [F] 68.0% of mothers of children under 6 are in the labor force, and 27% of US workers have paid family leave [F] R2-S30, R2-S33.
- [S] Parents praise entries they can make while nursing and that take five minutes or less [S] R2-S13. A parent on a contact nap wants to do it on the phone, one-handed [S] UR S29b.

### 2.3 What people do instead is close to what we build
- [S] A dedicated email address for the child, written to over the years and handed over at 18, came up independently in r/beyondthebump and r/daddit [S] UR S26, S30.
- [S] Fathers record monthly videos to the future child or keep voice memos of a toddler's babble [S] UR S25, S30b.
- [F] Cards and letters are among the mementos most often saved by parents of adult children (55%), after photos (95%) [F] UR S8.

### 2.4 Losing what you made is the fear that drives reviews
- [S] Across 104 negative or mixed reviews of 11 memory and journal products, 41 (39%) are about bugs, crashes, sync or lost entries, and 21 (20%) are about price. 9 describe work that vanished [S] R2 section 0 item 1. Counts are directional (R2 section 1).
- [S] Losing a recording is the most repeated capture complaint across voice products (Qeepsake, Rosebud, StoryCorps); FirstChapter's September 2026 release added retry and a confirm-before-discard prompt [S, F] R1 section 0 item 5.
- [S] Charging for something that used to be free drew a negative review every time in the sample (10 of 10, 6 products) [S] R2 section 0 item 3.

### 2.5 Privacy is the reason people choose a family memory app
- [S] 29 of 80 positive reviews (36%) of six baby memory apps name privacy or keeping the child off social media [S] R2 section 0 item 2.
- [F] 63% of parents of children aged 0 to 4 worry about sharing that could identify a child's location, and 62% about content that could embarrass the child later [F] UR S9.
- [F] Most category leaders declare "Data Used to Track You" on their App Store privacy labels; Dearest lists only data not linked to the user [F] R1 section 0 item 9.

### 2.6 The category is moving to AI rewriting, which leaves faithful words open
- [F] FirstChapter promises a polished entry from 30 seconds of talk; Sproutbook "transforms" notes; Remento offers a cleaned transcript beside first-person and third-person "story" rewrites, and changing the style overwrites the user's own edits [F] CR section 1, R1 section 0 item 2.
- [F] No product we opened shows the user what the machine changed (Inferred from the pages opened) [F] R1 section 0 item 2.
- [S] Some buyers like polish: 2 Remento reviewers and 1 Sproutbook reviewer praise AI rewrites; 1 was surprised that AI changed spoken words [S] R2 section 0 item 5. Our rule has a market cost; we choose it on purpose (see `03-goals-and-principles.md`).

### 2.7 Voice is the keepsake, not just the input
- [S] Hearing the person's voice is the value Remento reviewers name most (11 of 64) [S] R2 section 0 item 5; QR codes to the audio in printed books are the category's most emotional praise [S] CR section 4.
- [F] Baby-journal leaders (Qeepsake, Tinybeans, BabyPage) do not mention voice at all [F] CR section 5. New entrants now do: Tiny Treasures ("Baby memory book you can hear") and FirstChapter use voice in their store subtitles [F] R1 section 0 item 1.
- [A] We found no study of the effect of a parent's recorded (rather than live) voice on a child [A] R2 section 0 item 9. Product copy must not claim one.

### 2.8 Families speak more than English
- [F] 24.5% of 2024 US births were to mothers born outside the 50 states and DC; 22.8% of parents of a child under 3 are foreign-born [F] R3 section 2.3.
- [F] 74.1 million US residents speak a language other than English at home; the six non-English launch languages account for 53.5 million of them, 44.9 million of whom speak Spanish [F, A] R3 section 2.1.
- [F] In mixed-language couples the heritage language often does not reach the child: among US Latino parents, 92% with a Latino partner speak Spanish to their children, against 55% with a non-Latino partner [F] R2-S31.
- [F] No competitor we found asks which languages a family speaks; Day One takes the transcription language from the active keyboard [F] R1 section 0 item 4.

## 3. Why existing products do not solve it

| Approach | Examples | Where it fails the parent | Evidence |
|---|---|---|---|
| Prompted baby journal (typed) | Qeepsake, BabyPage | Typing takes sit-down time; prompts repeat or miss the child's age; co-parent on a paid tier | UR section 3; CR section 2; R2 section 0 item 4 |
| Private photo album | Tinybeans, 23snaps, FamilyAlbum | Photos, not words; free tiers cut back; prices raised | CR section 3; R2 section 0 item 7 |
| Voice life story for elders | Storyworth, Remento | One storyteller, one year, gift purchase; rewrite modes | CR section 1 |
| AI baby journal | FirstChapter, Sproutbook, Dujour | Rewrites the parent's words; original words not the product | CR section 1; R1 section 0 item 2 |
| General journal | Day One, Apple Journal | Not organised around a child; one author per journal unless shared; no language setting | R1 section 0 items 4, 8 |
| Letters app | Dearest, From, Mama | Closest in spirit; Dearest is iCloud-only and single-author; neither shows what the machine changed | R1 section 0 items 1, 8 |
| Do it yourself | Email to the child, Voice Memos, notes | Scattered, no structure by age, no family, no book, lost with a phone | UR S24 to S30 |

## 4. Why now
- [F] Open speech models now run on an iPhone and score 3.6 to 6% word error rate on English, Spanish, French and Portuguese benchmarks and about 8% character error rate on Mandarin with one shared model [S] R5 section 0 item 1. That makes speak-first capture without sending audio to a server possible for five of our seven languages.
- [F] The category's leaders are spending their product effort on AI rewriting and print [F] CR section 1, R1 section 0 item 2, which leaves faithful words and family voices open.
- [F] New voice-first entrants appeared in 2025 and 2026 (Tiny Treasures, From, Mama, FirstChapter) [F] R1 section 0 item 1. Demand is being validated; the window to own "your words, exactly as you said them" is open but not wide.

## 5. What is at stake if we get it wrong
- For the family: a lost letter or a changed word is permanent. A child's record that says something the parent did not say is worse than no record (R5 section 0 item 6 shows the current engine would let a Hindi or Arabic edit change "daughter" to "son"; see `09-decisions-and-risks.md` R-01).
- For trust: privacy and reliability are why people pick an app in this category and why they leave it (2.4, 2.5).
- For the business: the category is small. Tinybeans plus Qeepsake earned $6.49M in FY26 from 93,300 paid families and only just reached positive adjusted EBITDA [F] R3 section 4.1. Our Base-case year one is about 990 paying families [A] R3 section 5.2. The product must be cheap to run and hard to replace, which is why the constitution, durability and privacy are the strategy, not features.

## 6. What we do not know yet
The riskiest unknowns are in `02-customers.md` section 7 (U1 to U7): whether parents will speak letters aloud at night, whether they value the untouched original over a polished version, whether co-parent-only sharing is enough at launch, whether transcription is good enough on names in each language, when Read together gets used, how a co-parent who does not read the letter's language experiences the book, and when habits fade. There are no primary interviews yet.
