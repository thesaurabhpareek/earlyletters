# Early Letters: comparable products outside the US (October 2026)

Prepared 2026-10-03 by research lead 2. Desk research only: no interviews. This complements `../COMPETITIVE_RESEARCH.md` (US products) and `../USER_RESEARCH.md` (US parents). Source IDs here use the prefix **G** so they do not collide with the **S** numbers in those files.

**Labels on every claim**
- **[V] Verified:** I opened the cited page or API on 2026-10-03 and it states this.
- **[C] Company claim:** the company says this on the cited page. Nobody has checked it independently.
- **[S] Secondary:** a third party (press, aggregator, law firm) reports it. I did not open the original.
- **[I] Inferred:** my own reasoning from the cited facts.
- **[U] Unverified or not found.**

**Read the numbers with care**
- **App Store ratings counts** come from Apple's public Lookup API, one storefront at a time, on 2026-10-03. They are cumulative ratings, not users. Use them only to compare one app's footprint across countries.
- **iOS share** is StatCounter's mobile web-traffic share for September 2026, not installed base [G96].
- **Review themes** come from the 10 "featured" reviews that Apple embeds on each App Store page, plus one 50-review RSS sample for FamilyAlbum France. Apple's review RSS feed returned empty for most apps on 2026-10-03, so treat the themes as qualitative. Quotes are paraphrased.

---

## 0. Bottom line

1. **Outside the US, the category is photo-sharing albums, not baby books, and one player leads it worldwide.** FamilyAlbum (みてね, by MIXI) passed 30 million registered users in May 2026. It operates in 175 countries and regions, and over 40% of its users are outside Japan [V G1][V G2]. It has more App Store ratings than any other memory app in every iOS-heavy market we checked, except China and Saudi Arabia: about 1.53M ratings in Japan, 375K in the US, 65K in Canada, 58K in the UK, 50K in France and 33K in Taiwan [V G13].
2. **China and Korea run their own ecosystems built on photos, family sharing and commerce.** In China these are Qinbaobao (亲宝宝), Babytree (宝宝树) and TimeHut (时光小屋). In Korea they are 쑥쑥찰칵, 맘스다이어리 and Bebememo. In China, AI means growth videos, AI portraits, a registered "AI parenting model" and, at Babytree, **AI storytelling that imitates the parent's voice** [S G24][V G29].
3. **Voice is the main way families talk on chat apps, but no memory product keeps it.** Brazilians send four times more WhatsApp voice messages than any other country [S G82]. WhatsApp handles about 7 billion voice messages a day [V G94]. In one Saudi study, 41% chose a voice message to share good news [V G89]. Yet among the products profiled here, only two treat voice as a keepsake: Japan's tiny こえアルバム (5 ratings) and Spain's Dots, whose printed book has QR codes that play video and voice messages [V G14][V G81].
4. **We found no Hindi or Arabic baby memory book, and no Hindi voice journal.** This held across App Store and Google Play searches in India and Saudi Arabia [V G60][V G92]. Indian parenting apps (Mylo, Healofy) are content, community and commerce products [V G53][V G56]. This confirms the gap that `COMPETITIVE_RESEARCH.md` flagged as unverified.
5. **"Private" rarely means "not tracked".** The App Store privacy labels of FamilyAlbum, BackThen, Tinybeans, 23snaps, Bebememo, Qinbaobao, 쑥쑥찰칵 and Mylo all declare data "used to track you" [V G4][V G68][V G70][V G72][V G47][V G22][V G45][V G53]. Tinybeans' label even lists User Content [V G70]. Of the profiled apps, only Famileo and Chapter One declare no tracking [V G74][V G73]. A clean label is a cheap, visible way for Early Letters to stand out [I].
6. **Grandparents are the audience everywhere, but almost never the authors.** Several products exist mainly so grandparents can see the baby:
   - FamilyAlbum's photo frame and browser access [V G8][V G3];
   - Famileo's printed monthly gazette, sent to 260,000 subscribing families [C G74];
   - TimeHut's "grandparents can see updates anytime" [V G31].

   None lets a grandparent leave a lasting spoken letter in their own language [I from all profiles].
7. **The best next markets are English and French iOS-heavy countries, then the Gulf.** Canada (64.9% iOS), the UK and Ireland, and Australia come first. The Arabic-speaking Gulf (Saudi Arabia 51.6% iOS) follows. India, Brazil and Mexico fit Early Letters' purpose best, but iOS's share there (6% to 28%) makes them Android-gated [V G96][I]. Mainland China, Japan and Korea are not near-term: regulation, the languages we launch with, and entrenched incumbents all stand in the way [V G43][V G2][I].
8. **Print fulfilment is local and fragile.** FamilyAlbum prints in Japan. On 17 July 2026 it suspended print, photobook, calendar and DVD orders to nine EU countries, including France, Germany and Portugal, citing the EU customs reform of 1 July 2026 [V G7]. French reviewers who lost free monthly prints are angry [V G11].

---

## 1. Market snapshot

| Market | iOS share, Sep 2026 [G96] | Family chat channel | Memory-app footprint (App Store ratings in that storefront) | v1.0 spoken language fit |
|---|---|---|---|---|
| Canada | 64.9% | n/a | FamilyAlbum 64,697; Tinybeans 8,170; Qeepsake 1,731 [V G13] | English, French |
| Australia | 62.6% | n/a | FamilyAlbum 39,372; Tinybeans 19,408 [V G13] | English |
| Japan | 60.5% | LINE, 100M monthly users (Dec 2025) [S G17] | FamilyAlbum 1,527,316, used by about 65% of new parents [V G2][V G13] | None (Japanese not in v1.0) |
| Taiwan | 51.7% | LINE (one of LINE's "top 4 countries") [V G18] | FamilyAlbum 32,607 [V G13] | Mandarin, but written in **Traditional** characters [I] |
| Saudi Arabia | 51.6% | WhatsApp used by 92% of adults (2022) [S G88] | Bebememo 152; FamilyAlbum 44; Day One 1,377 (journal, for reference); FirstCry Arabia 49,620 (retail) [V G13][V G93] | Arabic |
| Kuwait | 48.4% | n/a | not checked | Arabic |
| Ireland | 47.4% | n/a | not checked | English |
| UK | 46.9% | WhatsApp (no family-group statistic found) | FamilyAlbum 58,056; BackThen 19,239; Tinybeans 6,572 [V G13] | English |
| Hong Kong | 44.3% | n/a | FamilyAlbum 3,512; Qinbaobao 1,061 [V G13] | Partial: Mandarin; Cantonese not supported [I] |
| Singapore | 43.7% | n/a | not checked | English, Mandarin |
| Korea | 37.8% | KakaoTalk used by 98.9% (2024 survey) [S G49] | FamilyAlbum 17,707; 쑥쑥찰칵 17,177; Bebememo 16,041 [V G13][V G45] | None (Korean not in v1.0) |
| France | 34.6% | n/a | FamilyAlbum 50,411; Famileo 5,281; BackThen 3,468 [V G13] | French |
| Portugal | 32.7% | n/a | not checked | Portuguese (European spelling) [I] |
| China (mainland) | 32.1% | WeChat, 1.418B monthly users (Dec 2025) [V G38] | 宝宝树孕育 737,704; 亲宝宝 310,424; 宝宝树小时光 65,499; 时光小屋 25,968 [V G21][V G27][V G28][V G31] | Mandarin (Simplified) |
| Mexico | 28.0% | 88 of 100 internet users use messaging (2022) [S G85] | Dots 1,358; FamilyAlbum 1,165 [V G13] | Spanish |
| Germany | 27.6% | n/a | FamilyAlbum 21,795; BackThen 1,770 [V G13] | None |
| Spain | 26.8% | n/a | FamilyAlbum 3,996; Dots 1,198 [V G13] | Spanish |
| UAE | 26.7% | n/a | FamilyAlbum 224 [V G13] | Arabic, English |
| Brazil | 21.2% | WhatsApp installed on 98% of smartphones; 80% of users exchange voice messages (Jan 2024) [V G83] | FamilyAlbum 1,295; Dots 875 [V G13] | Portuguese |
| India | 6.1% | WhatsApp, 700M+ monthly users (Jan 2025) [S G61] | FamilyAlbum 1,017; Mylo 6,923 (India App Store); Mylo and Healofy each 10M+ Google Play downloads [V G13][V G53][V G54][V G57] | Hindi |

Other markets checked: Argentina 12.6%, Colombia 21.5%, Egypt 16.6%, Qatar 26.9% iOS [V G96].

### Cross-border footprint (App Store ratings by storefront, 2026-10-03) [V G13]

| App | US | UK | CA | AU | FR | DE | ES | MX | BR | IN | JP | KR | TW | CN | SA | AE | Google Play installs |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FamilyAlbum (MIXI, JP) | 375,068 | 58,056 | 64,697 | 39,372 | 50,411 | 21,795 | 3,996 | 1,165 | 1,295 | 1,017 | 1,527,316 | 17,707 | 32,607 | 1,119 | 44 | 224 | 10M+ [V G12] |
| Tinybeans (AU/US) | 104,229 | 6,572 | 8,170 | 19,408 | 538 | 462 | 191 | 289 | 255 | 245 | 136 | 41 | 139 | 89 | 14 | 64 | 500K+ [V G70] |
| BackThen (UK) | 28,913 | 19,239 | 3,050 | 1,702 | 3,468 | 1,770 | 713 | 340 | 175 | 137 | 63 | 13 | 56 | 21 | 13 | 73 | 100K+ [V G69] |
| 23snaps (UK) | 11,451 | 1,419 | 1,060 | 1,082 | 103 | 87 | 32 | 34 | 70 | 21 | 32 | 6 | 32 | 4 | 11 | 17 | 100K+ [V G72] |
| Bebememo (TimeHut group) | 336 | 10 | 39 | 26 | 662 | 30 | 26 | 3 | 2 | 13 | 7,990 | 16,041 | 885 | n/a | 152 | 7 | 500K+ [V G33] |
| Qinbaobao 亲宝宝 (CN) | 3,812 | 237 | 999 | 770 | 118 | 149 | 67 | 4 | 10 | 2 | 703 | 289 | 351 | 310,424 | 4 | 31 | not on Google Play [U] |
| Dots Memories (ES) | 1,781 | 147 | 141 | 73 | 98 | 117 | 1,198 | 1,358 | 875 | 67 | 13 | 9 | 7 | 1 | 14 | 12 | not checked |
| Famileo (FR) | 110 | 201 | 123 | 29 | 5,281 | 66 | 130 | 6 | 1 | 0 | 4 | 3 | 0 | 0 | 0 | 1 | 1M+ [V G75] |
| Qeepsake (US) | 14,632 | n/a | 1,731 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | not checked |
| Day One (reference, journal) | 118,376 | 16,522 | 10,183 | 8,789 | 2,857 | 8,254 | 1,550 | 1,665 | 1,861 | 3,877 | 11,510 | 4,049 | 2,310 | 24,220 | 1,377 | 563 | not checked |

"n/a" means the app is not sold in that storefront.

**What the footprint shows [I]:**
- FamilyAlbum is the default where iOS is strong.
- Tinybeans is strongest in its home markets, Australia and the US.
- BackThen is a UK player.
- Asian players do not travel west, except Bebememo into France and Saudi Arabia.
- In Saudi Arabia, Day One has 31 times FamilyAlbum's ratings. Saudi iPhone owners do journal, but they do not use family photo albums.

---

## 2. Products by region

Each profile uses the same eleven fields:
- what it does;
- pricing;
- scale;
- capture modes;
- AI;
- privacy;
- family sharing;
- print;
- languages;
- what users praise;
- what users complain about.

"Langs" is the App Store's own language list for the app.

### 2.1 India

**Context**
- WhatsApp is the family channel. It has more than 700 million monthly users in India (Sensor Tower, via TechCrunch, Jan 2025) [S G61].
- In 2018, Google found that "good morning" images forwarded on WhatsApp were among the main reasons Indian phones ran out of storage. One in three Indian smartphone users ran out of storage daily, against one in ten in the US (a Western Digital survey) [S G62]. Family media flows through WhatsApp, but WhatsApp is not an archive [I].
- India's competition regulator (CCI) found that Indian WhatsApp users could not opt out of data sharing with Meta, while European users could [S G61].
- 54% of Indians live in extended-family households, against 11% in North America [V G63].
- HelpAge India (June 2025, n=5,798): only 40% of older people own a smartphone, and 66% find digital tools "too confusing" [S G64]. A grandparent's voice will often be recorded on the parent's phone [I].
- Google reported 270% year-on-year growth in voice searches in India in 2019, with Hindi queries growing fast [S G65].
- iOS has only 6.1% share [V G96].

**Mylo** (Blupin Technologies)
- **What it does:** a pregnancy and parenting app: week-by-week tracking, baby growth and vaccination tools, a mothers' community, and a store selling Mylo-brand baby and mother products [V G53]. It is not a memory book.
- **Pricing:** free; the App Store page lists no in-app purchases [V G53]. Revenue comes from the store [I].
- **Scale:** "Trusted by 10+ million users" [C G53]. 10M+ Google Play installs [V G54]. 6,923 India App Store ratings [V G53]. Raised US$17M in a Series B in April 2022 [S G55].
- **Capture modes:** tracker entries and community posts. No memory capture is described [V G53].
- **AI:** none described [V G53].
- **Privacy:** the label declares contact info, identifiers, usage data, sensitive info and diagnostics "used to track you" [V G53].
- **Family sharing:** not described [U].
- **Print:** none.
- **Languages:** English, French and Hindi. Content includes "Zordar Dadi Ke Nuskhe" (grandmother's home remedies) [V G53].
- **Praise:** a community of mothers due the same month, and pregnancy tracking [V G53r].
- **Complaints:** late diaper deliveries and uneven quality, technical glitches, no support, and unmoderated community content [V G53r].

**Healofy** (Vivoiz HealthTech)
- **What it does:** pregnancy and baby-care tips by week or month, a community, yoga and garbh sanskar sessions, and own-brand products [V G56].
- **Pricing:** Healofy Gold from Rs 99 to Rs 999 [V G56].
- **Scale:** 10M+ Google Play installs [V G57]. 1,350 India App Store ratings [V G56].
- **Capture modes:** none for memories [V G56].
- **AI:** none described [V G56].
- **Privacy:** the label declares identifiers used to track. Identifiers linked to identity are used for third-party advertising, and contact info for the developer's own marketing [V G56].
- **Family sharing:** not described [U].
- **Print:** none.
- **Languages:** the App Store lists English. The description promises tips "in Hindi, Malayalam" [V G56].
- **Praise:** daily, month-specific expert tips [V G56r].
- **Complaints:** one reviewer said yoga and garbh sanskar videos are English-only and asked to "connect with my baby in my mother tongue"; others report subscription activation and cash-on-delivery failures, and unanswered support [V G56r]. **That mother-tongue complaint is the Early Letters job in one line [I].**

**Others**
- **Parentune:** expert Q&A and workshops; 25 India App Store ratings; English only [V G58].
- **BabyChakra:** no longer appears in App Store India search results [V G60]. Its parent, the Good Glamm Group, was in financial distress in mid-2025 [S G59].
- **FirstCry:** the most-rated baby app in our App Store India searches, with 486,409 ratings, is a retailer [V G60].
- **Global memory apps in India:** FamilyAlbum (1,017 ratings), Tinybeans (245) and BackThen (137) have tiny footprints. Day One has 3,877 [V G13].

**Hindi voice journaling: none found [V G60][V G60b].**
- App Store India searches for "baby memory book", "baby journal" and "hindi diary" returned only global English apps, trackers or unrelated diaries.
- Google Play India searches for "baby memory book" and the Hindi for "child's diary" returned the same.

Mylo is the only Indian parenting app we found whose App Store language list includes Hindi [V G53]. TinyNest, a 2025 global family album, also lists Hindi among 31 languages, but it is a photo album [V G100].

### 2.2 UK and Europe

**FamilyAlbum in Europe:** the full profile is in 2.5.
- Ratings: 58,056 in the UK, 50,411 in France and 21,795 in Germany [V G13].
- UK prices: Premium Family £5.49 a month or £54.99 a year; Pro £10.49 or £104.99 [V G4].
- Print suspension: on 17 July 2026, print, photobook, calendar and DVD orders to Austria, Denmark, Germany, Finland, France, Belgium, Portugal, Luxembourg and the Czech Republic were suspended because of the EU customs reform of 1 July 2026 [V G7].
- French reviewers complain about the frozen print orders, the cost of ordering the free monthly prints rising from €2.35 to €4.40, new ads, and prints shipped from Japan [V G11].

**BackThen** (Back Then Digital Ltd, UK)
- **What it does:** a private family timeline with one timeline per child, milestones, height and weight, "timelapse" face sequences and photo books [V G68]. It is Canon's Lifecake under a new name: Lifecake users were moved to it when Canon closed Lifecake in 2020 [V G68r].
- **Pricing:** VIP £4.99 a month [V G68].
- **Scale:** "trusted with 240+ million memories" [C G68]. 19,239 UK ratings [V G13]. 100K+ Google Play installs [V G69].
- **Capture modes:** photos, video, milestones and measurements [V G68].
- **AI:** "unique timelapse technology", which looks like face alignment; no generative AI [V G68].
- **Privacy:** claims "No ads. No data-sharing. Ever." [C G68], but its label declares identifiers "used to track you" [V G68].
- **Family sharing:** grandparents and others invited, with permissions [V G68].
- **Print:** photo books and prints [V G68].
- **Languages:** English only [V G68].
- **Praise:** "my no. 1 parenting tip", and photos kept safe in one place [V G68r].
- **Complaints:** Lifecake migrants were angry at being made to pay again during the forced move [V G68r]. This echoes the Lifecake complaint in `COMPETITIVE_RESEARCH.md`.

**Tinybeans** (Australian-founded 2012, US-focused) [S G71]
- **What it does:** a private family photo album and journal [V G70].
- **Pricing:** £7.99 a month or £69.99 a year in the UK; a legacy plan at £3.99 or £39.99 [V G70].
- **Scale:** "millions of Millennial and Gen Z parents and their families monthly" [S G71]. 19,408 Australian and 6,572 UK ratings [V G13]. 500K+ Google Play installs [V G70].
- **Capture modes:** photos, video and journal posts [V G70].
- **AI:** none found outside the US caption search noted in `COMPETITIVE_RESEARCH.md`.
- **Privacy:** its label lists location, contact info, **user content**, identifiers and usage data as "used to track you" [V G70]. In 2024 it cut costs and moved away from advertising revenue towards subscriptions [S G71].
- **Family sharing:** invited followers [V G70].
- **Print:** photo books [V G70].
- **Languages:** English only [V G70].
- **Praise and complaints:** see `COMPETITIVE_RESEARCH.md` (price rises, paywalls).

**23snaps** (UK, since 2012)
- **What it does:** a private photo and video sharing app for parents [V G72].
- **Pricing:** Premium £3.99 and Premium Plus £6.99, both monthly. Gift plans run from £7.49 for one month to £52.99 for twelve [V G72].
- **Scale:** "millions of families" [C G72]. 1,419 UK ratings and 11,451 US ratings [V G13]. 100K+ Google Play installs [V G72].
- **Capture modes:** photos, video (up to 3 minutes on Premium) and milestones [V G72].
- **AI:** none.
- **Privacy:** its label declares usage data "used to track you" [V G72].
- **Family sharing:** approved family and friends only [V G72].
- **Print:** discounts on photo books and prints [V G72].
- **Languages:** English only [V G72].
- **Praise:** ten years of family photos in one safe place [V G72r].
- **Complaints:** features moved behind Premium; multi-photo upload became paid [V G72r].

**Chapter One: Baby Journal** (Heirloom Journal Ltd, UK; launched 7 July 2026)
- **What it does:** "A journal, not a tracker" for memories, first words and parenting ups and downs, "designed for long-term durability and privacy" [V G73]. This is the nearest non-US match to Early Letters' tone.
- **Pricing:** £5.99 a month, £49 a year or £119 lifetime. Supports Apple Family Sharing [V G73].
- **Scale:** 5 UK ratings [V G13].
- **Capture modes:** text and photos. Its privacy label lists audio data [V G73]; a voice feature is not described [U].
- **AI:** none described [V G73].
- **Privacy:** no "used to track you" section. Email, sensitive info, location, usage and audio data are linked to identity [V G73].
- **Family sharing:** not described [U].
- **Print:** not described [U].
- **Languages:** English only [V G73].
- **Praise:** "first journalling app I am actually using", simple and warm [V G73r].
- **Complaints:** none yet.

**Famileo** (Entourage Solutions, France)
- **What it does:** family members post photos and messages in the app. Famileo turns them into a printed "gazette" posted each month to a grandparent, at home or in a care home [C G74].
- **Pricing:** from €5.99 a month for home delivery, no commitment. Care homes that subscribe give it free [C G74]. The App Store page lists no in-app purchases [V G74].
- **Scale:** "260,000 subscribing families" [C G74]. 5,281 French ratings [V G13]. 1M+ Google Play installs [V G75].
- **Capture modes:** text and photos [C G74].
- **AI:** none described.
- **Privacy:** its label declares only diagnostics, not linked to identity, and no tracking [V G74]. "Guaranteed ad-free" [C G74].
- **Family sharing:** the whole family contributes; the grandparent receives on paper [C G74].
- **Print:** the core product [C G74].
- **Languages:** Dutch, English, French, German and Spanish [V G74].
- **Praise:** grandparents wait for the gazette each month, and scattered families reconnect [V G74r].
- **Complaints:** the featured reviews are almost all positive; one asks for better execution [V G74r].

**Juno** (Dear Friend Digital GmbH, Germany)
- **What it does:** a memory book app with hundreds of age-matched prompts, family invites and an automated printed book [V G76].
- **Pricing:** a free basic tier. Premium runs €3.99 to €6.99 a month or €34.99 to €69.99 a year [V G76].
- **Scale:** 50 German ratings [V G13].
- **Capture modes:** photos, video (up to 120 seconds) and diary entries [V G76].
- **AI:** none described.
- **Privacy:** data stored "on German servers" and "no ads, ever" [C G76]. The label still declares identifiers used to track [V G76].
- **Family sharing:** family members invited to collect memories together [V G76].
- **Print:** an automated memory book, with optional QR codes for videos [V G76].
- **Languages:** the App Store lists English; the listing is in German [V G76].
- **Praise:** data security and no ads; "five years on we still know when the first teeth came" [V G76r].
- **Complaints:** the paywall appears only after setup; ignored support; media failing to load [V G76r].

**Also seen:** Nori Baby Journal (Germany, April 2026) keeps data on the device and in the parent's own iCloud, with no login, no ads and no tracking. It has 1 rating [V G77].

### 2.3 Spain, Latin America and Brazil

**Context**
- **Brazil:**
  - Meta says Brazilians send four times more WhatsApp voice messages than any other country (Zuckerberg, June 2024, repeating WhatsApp's 2023 statement) [S G82].
  - WhatsApp is on 98% of Brazilian smartphones, and 80% of users exchange audio messages (n=2,112, January 2024) [V G83].
  - Family is the most common topic of Brazilian WhatsApp groups, at 39%, ahead of work at 31% and politics at 30% (Datafolha, 2019) [S G84].
- **Mexico:** 88 of 100 internet users use messaging (AIMX, 2022) [S G85].
- **Extended families:** 32% of people in Latin America and the Caribbean live in extended-family households [V G63].
- **Brazilian App Store:** searches for a baby diary in Portuguese return feeding and sleep trackers, not memory books [V G87].
- **LGPD:** processing a child's data requires "specific and prominent consent" from at least one parent, in the child's best interest (Art. 14) [V G86].

**Dots Memories** (Publicidad Kalepolin S.L., Spain)
- **What it does:** "Memories" spaces (family, children, couples) and shared event albums for weddings. A "Dotbook" is a physical or PDF book combining photos, text, video and **voice messages**, which play from printed QR codes [V G81].
- **Pricing:** €2.99 or €4.99 a month; one-off premium albums from €9 to €66 [V G81].
- **Scale:** 1,358 Mexican, 1,198 Spanish and 875 Brazilian ratings [V G13].
- **Capture modes:** photos, video, text and voice messages [V G81].
- **AI:** none described.
- **Privacy:** its label declares usage data used to track, and contacts (not linked) used for third-party advertising [V G81].
- **Family sharing:** invite family; guests upload to event albums [V G81].
- **Print:** the Dotbook, with QR codes [V G81].
- **Languages:** English, French, German, Italian, Portuguese and Spanish [V G81].
- **Praise:** collecting guests' wedding photos [V G81r].
- **Complaints:** most recent featured reviews are 1 star:
  - QR codes that did not work at an event;
  - paying again to create the QR;
  - lost photos and lost account access;
  - weak support;
  - and, in Mexico, a payment made at an Oxxo store that never unlocked the album [V G81r].

**Global apps in the region:** FamilyAlbum has 3,996 ratings in Spain, 1,165 in Mexico and 1,295 in Brazil. BackThen has 713 in Spain and 340 in Mexico [V G13]. **No Portuguese-first or Latin American baby memory leader was found [V G87][I].**

### 2.4 China, plus WeChat-native habits

**Context**
- WeChat had 1.418 billion combined monthly users at 31 December 2025 [V G38].
- In 2019, more than 100 million people had set their WeChat Moments to "visible for 3 days only" [S G39]. The real privacy setting is a short window, not a private album [I].
- A 2017 study found that older Chinese adults use WeChat mainly to keep in touch with family, through Moments, group chats, photos and voice messages [V G40].
- **Grandparents raise babies:** 40.27% of Chinese children aged 0 to 3 are cared for by grandparents, rising to 49.44% in cities (CFPS 2020, n=1,028) [V G41].
- **WeChat-native memory tools for older users:**
  - 小年糕 (Xiaoniangao), a WeChat mini program that turns photos into slideshow videos, passed 200 million users, and once had over 80% of its users middle-aged or older [S G36];
  - 美篇 (Meipian), photo-and-text "articles", had 77 million users by 2018 [S G36] and has 225,581 China App Store ratings [V G37].
- **Regulation:**
  - **Under PIPL**, minors' personal data is "sensitive personal information" that needs a parent's consent and a specific purpose [S G42].
  - **App filing:** since April 2024 every app distributed in China needs an ICP filing; Apple rejects new apps without one; foreign developers need a Chinese entity or a local publisher [S G43].
  - **Generative AI:** services offered to the public, including from offshore providers, fall under the August 2023 Interim Measures. Services that can influence public opinion need security assessment and filing [S G44].

**Qinbaobao 亲宝宝** (Dianwang (Beijing) Cloud Computing)
- **What it does:** a "growth record cloud space": one person uploads and the whole family shares. It adds growth MVs (music videos made from photos), photo printing, pregnancy and parenting guidance, growth assessments and an own-brand baby store [V G21].
- **Pricing:** membership costs ¥35 a month or ¥248 a year on auto-renew (¥50 or ¥298 without), plus a ¥49.90 development assessment [V G22]. Members get HD and long video, original-quality photos, PC sync, expert classes, store coupons and more ("16 benefits") [V G21].
- **Scale:**
  - "100 million users" by 2019 [S G23];
  - "the trusted choice of tens of millions of families" [C G21];
  - 310,424 China App Store ratings [V G13];
  - in 2023 a research report put it first in its category, with 47.1% of mother-and-baby app users installing only Qinbaobao [S G25].
- **Capture modes:** photos, video and records. Its label lists audio data [V G22].
- **AI:** a vertical "AI parenting model" approved through national registration in February 2025. It gives advice based on the baby's recorded data. Generative features include growth videos, AI portraits and AI songs [S G24].
- **Privacy:** its label declares identifiers used to track, and lists sensitive info, health, precise location, photos and audio among data collected [V G22]. Reviewers set albums to "relatives only" to protect the baby's privacy [V G26].
- **Family sharing:** core, built around grandparents in other cities [V G26].
- **Print:** photo prints [V G21].
- **Languages:** English and Simplified Chinese [V G21].
- **Praise:**
  - grandparents in other cities follow the baby daily;
  - automatic upload in date order;
  - "my second WeChat Moments" [V G26].
- **Complaints and fears:** that storage will start to cost money or the service will close ("like 360 cloud did"); video uploads gated by membership; reviewers want physical albums because digital may not last [V G26].

**Babytree 宝宝树** (Babytree Inc., HK-listed 1761)
- **What it does:** two apps:
  - 宝宝树孕育, a pregnancy and parenting community now titled "AI管家" (AI butler) [V G27];
  - 宝宝树小时光, a growth album with unlimited storage, photo/video/text timelines, "memory moments", music albums, private groups and a community [V G28]. Its listing says the private groups solve "the problem of group-shared content expiring", a WeChat pain point [V G28].
- **Pricing:** 小时光 sells "树币" virtual currency packs from ¥8 to ¥148 [V G28].
- **Scale:**
  - group average monthly users of about 77.8 million in 2022 [V G29];
  - revenue RMB 314.6M and net loss RMB 467.6M in 2022 [V G29];
  - 737,704 ratings for 孕育 and 65,499 for 小时光 [V G13].
- **Capture modes:** photos, video and text. Reviewers record themselves reading picture books aloud [V G30].
- **AI:** "AI Parent Story-telling (爸媽AI講故事)" **records a parent's voice and imitates it** to tell AI-generated stories, launched in 2022 [V G29].
- **Privacy:** the 小时光 label declares identifiers used to track, and precise location and identifiers used for third-party advertising [V G28].
- **Family sharing:** family-based sharing that supports second and third children [V G28].
- **Print:** calendars and albums are mentioned by reviewers [V G30].
- **Languages:** Chinese and English [V G28].
- **Praise:** "from birth to now, not one photo missed"; date-ordered; grandparents see photos daily [V G30].
- **Complaints:** the featured reviews are all 5 stars; there is not enough here to judge [V G30].

**TimeHut 时光小屋 and Bebememo** (Bithouse / Bebememo Inc.; San Francisco-registered, founded 2013) [C G32]
- **What it does:** a family timeline where each member keeps a timeline, merged into one family record. It auto-converts photo dates into the baby's age, makes an **automatic annual printed book**, records height and weight, and sends milestone reminders [V G31].
  - Bebememo appears to be the group's international app: its Google Play package is com.liveyap.timehut.bbmemo [V G33][I]. On the phone, AI detects the baby in photos and offers one-tap upload. It sorts by age and is ad-free [V G47].
- **Pricing:**
  - TimeHut: ¥188 a year or ¥68 a quarter in mainland China [V G31].
  - Bebememo: a subscription; a Saudi reviewer wishes for a lifetime option [V G47r]. Price not verified [U].
- **Scale:**
  - "tens of millions of family users" [C G32];
  - Google Play: TimeHut 1M+ and Bebememo 500K+ installs [V G33];
  - App Store: 25,968 ratings in China, and for Bebememo 16,041 in Korea, 7,990 in Japan, 885 in Taiwan, 662 in France and 152 in Saudi Arabia [V G13].
- **Capture modes:** photos, video and diary. Bebememo's label lists audio data [V G47].
- **AI:** on-device baby detection [V G47]; "exploring AIGC" [C G32].
- **Privacy:** both labels declare identifiers used to track [V G31][V G47]. Bebememo claims encryption and no data sharing with advertisers [C G47].
- **Family sharing:** core; "grandparents can see updates anytime" [V G31].
- **Print:** the automatic annual book [V G31].
- **Languages:** Bebememo covers Arabic, English, French, German, Italian, Japanese, Korean, Spanish and Chinese. TimeHut covers English, Italian, Japanese, Korean and both Chinese scripts [V G47][V G31]. **Bebememo is the only memory app we found with an Arabic interface.**
- **Praise:**
  - full-resolution originals that free up phone space;
  - no ads;
  - "I don't like posting the baby on Moments" [V G31r];
  - in Korea, no longer having to send every photo to both sets of grandparents on KakaoTalk [V G47r].
- **Complaints:** bulk download was removed, which reviewers saw as a backup risk; red-packet "likes" are unfair [V G31r].

**Also seen:**
- 网易亲时光 (NetEase): a smart family cloud album with automatic monthly growth reports and short videos; 2,588 ratings [V G34].
- 美柚 (Meiyou): a period, pregnancy and parenting app with a "relatives" edition; 3,066,860 ratings [V G35].

### 2.5 Japan

**Context**
- LINE had 100 million monthly users in Japan in December 2025 [S G17].
- A LINE Yahoo study of 2024 usage found that Japanese users send about one third of the messages Taiwanese users send, mostly to family and friends [S G19].
- The only evidence we found that Japanese users rarely send voice messages is an anecdotal 2021 article. Treat it as a weak signal [S G20].
- **The 母子健康手帳 (maternal and child health handbook):**
  - every municipality gives it to each pregnant woman;
  - parents write in it, and it is kept for life as "a proof of inherited life";
  - about 50 countries have adopted it, and more than half of municipalities now run digital versions [S G16].
  - Japanese families already have a written, parent-authored record of each child [I].

**FamilyAlbum / 家族アルバム みてね** (MIXI, Inc.)
- **What it does:** a private family photo and video album, auto-sorted by date and month of age. It has comments with a "seen by" history, "1-second movies" (one second from each video, auto-compiled each season), auto-proposed photobooks, 11 free prints a month, and DVDs [V G3].
  - Hardware and add-ons: a ¥16,500 photo frame marketed as a gift for grandparents (December 2025) [S G8], and a child GPS tracker (Japan only) [V G2].
  - Family members without smartphones can use a PC browser [V G3].
- **Pricing:**
  - US: Premium Family $5.99 a month or $59 a year; Pro $10.99 or $109; Premium One $2.99 [V G5].
  - UK: £5.49 or £54.99 [V G4].
  - Japan: ¥590 a month reported [S G9].
  - One admin's subscription covers the whole album [V G6b].
  - The free tier has unlimited uploads, videos under 2 minutes, and compilation videos every three months [V G6].
- **Scale:**
  - 30M registered users (7 May 2026), in 175 countries and regions, over 40% outside Japan and 20% in North America [V G1][V G2];
  - "approximately 65% of parents in Japan" choose it when a child is born (Dec 2024) [V G2];
  - 10M+ Google Play installs [V G12].
- **Capture modes:** photos, video and short comments. Premium adds "monthly growth memos" [V G3].
- **AI:** automated curation only:
  - person-by-person albums (Premium);
  - auto-built 1-second movies;
  - auto-suggested photobooks [V G3].
  - No generative writing or transcription was found [U].
- **Privacy:**
  - per-photo visibility, for example "spouse only" [V G3];
  - the label declares identifiers used to track, plus location, identifiers, usage and advertising data linked to identity for third-party advertising [V G4][V G5];
  - Japanese Premium removes ads [S G9].
- **Family sharing:** core: invited family only [V G3].
- **Print:** monthly free prints, photobooks, DVDs and New Year cards (Japan) [V G2][V G3]. Orders to nine EU countries suspended since 17 July 2026 [V G7].
- **Languages:** English, French, German, Japanese, Korean, Spanish, Simplified and Traditional Chinese [V G3]. The company describes them as 7 languages and names Traditional Chinese [V G1]. **No Hindi, Arabic or Portuguese.**
- **Praise:**
  - grandparents can use it themselves;
  - easy sharing with relatives far away;
  - "a private Instagram for your kids";
  - the 1-second movies [V G10].
- **Complaints:**
  - price walls added with each update ("slowly being priced out");
  - expensive Premium for HD video;
  - a US reviewer paying about $110 a year still sees in-app promotions;
  - navigation is hard for grandparents;
  - French print suspension and price rises [V G10][V G11].

**ALBUS アルバス** (ROLLCAKE Inc.): 8 free square prints every month (shipping charged) plus a dedicated album, so families build a physical album month by month. It has 166,121 Japanese ratings [V G13b]. Reviewers love that they "never got round to printing" until monthly reminders arrived [V G13r].

**こえアルバム (Voice Album)** (Omochi Tech Studio, December 2025)
- **What it does:** one-tap recording of a child's voice ("what was fun today?"), shared with grandparents by invite link [V G14].
- **AI:** AI writes the transcript and **generates a title** [V G14].
- **Platforms:** Apple Watch and a widget [V G14].
- **Languages:** 7: English, French, Japanese, Korean, Portuguese, Chinese and Spanish [V G14].
- **Scale:** 5 ratings [V G13].
- **Privacy:** its label lists audio data under the third-party advertising purpose (as data not linked to identity), and usage data used to track [V G14].
- **The closest non-US analogue to Early Letters' capture model.** It uses AI generation, and its privacy posture differs from ours [I].

**こどもことば** (May 2026): records a child's "words only said now" in 5 seconds and makes an A5 book PDF, positioned as a gift for grandparents. It has 0 ratings [V G15]. It shows there is demand for keeping words, not just photos [I].

### 2.6 Arabic-speaking Middle East

**Context**
- **Saudi Arabia, 2022 (n=1,220):** 92% use WhatsApp and 77% use Snapchat. Users over 45 favour WhatsApp [S G88].
- **A 2025 study of 485 Saudi WhatsApp users:** voice messages were the second-most preferred method overall, and 41.44% chose voice to share good news [V G89].
- **Privacy is collective and honour-based.** Women limit images of themselves, and privacy is framed as protecting the extended family's reputation (33 interviews in Saudi Arabia and Qatar) [V G90].
- **The Saudi PDPL** requires a legal guardian's consent, with the guardianship verified, to process a child's data [S G91].

**Products**
- **No Arabic-native baby memory app was found** in App Store Saudi or Google Play Saudi searches [V G92]. Searches return global apps (BackThen, Famm), kids' games and new single-developer apps with 0 ratings.
- **Bebememo** is the only memory app with an Arabic interface (see 2.4). Its 152 Saudi ratings exceed FamilyAlbum's 44 [V G13]. Saudi reviews praise how easy it is and that it supports more than one child; one wishes for a one-time purchase instead of a yearly plan [V G47r].
- **FirstCry Arabia** has 49,620 Saudi ratings, in Arabic and English, and is a retailer [V G93]. On iOS in Saudi Arabia, the baby category is led by shopping, not by memories [I].
- **Day One** has 1,377 Saudi ratings and supports Arabic [V G13][V G80]. Private journaling has an iOS audience in Saudi Arabia, while family photo albums do not [I].

### 2.7 Korea

**Context**
- KakaoTalk is used by 98.9% of Koreans (Korea Press Foundation, Oct-Nov 2024) [S G49].
- Reviewers describe sending every baby photo to both sets of grandparents (양가) in KakaoTalk group chats, and switching apps to stop doing it [V G45r][V G47r].
- **Studio "growth albums":** professional shoots at pregnancy, 100 days (백일) and the first birthday (돌) have long been a ritual. Packages cost 800,000 to 3 million won (2015). A 2014 studio bankruptcy hit about 4,000 customers [S G51].
- Grandparent-led childcare is described as increasingly common [S G52]. No national statistic was found [U].
- PIPA Art. 22-2 requires a legal representative's consent to process the data of a child under 14 [S G50].

**쑥쑥찰칵 (Ssukssuk Chalkak)** (JEJEMEME Inc.)
- **What it does:** upload once and the whole family gets it, with likes and comments. Photos are sorted by date and month. It makes a free monthly growth video, turns the baby's face into emoticons (쑥티콘), sells goods and photo books, and includes feeding records and age-peer shared diaries [V G45].
- **Pricing:** Premium ₩5,900 a month or ₩59,000 a year; Family ₩11,900 a month or ₩99,000 a year; Ad-free ₩6,900 a month or ₩49,000 a year [V G45].
- **Scale:** "chosen by 1.5 million families" [C G45]. 17,177 Korean ratings [V G13].
- **Capture modes:** photos, video and diary [V G45].
- **AI:** face emoticons and auto growth videos [V G45]. Whether these use AI is not stated [U].
- **Privacy:** its label declares contact info, identifiers and usage data used to track [V G45].
- **Family sharing:** core [V G45].
- **Print:** photo books and goods [V G45].
- **Languages:** English, Japanese and Korean [V G45].
- **Praise:** ends the daily chore of sending photos to the family chat; grandparents feel less awkward asking for photos [V G45r].
- **Complaints:** removing Kakao login locked out paying users; slow uploads; short video limits [V G45r].

**맘스다이어리 (Mom's Diary)** (Moms)
- **What it does:** a pregnancy and parenting diary (a photo plus at least one line a day). **Every 100 days of diary entries can be published as a free printed book.** It also offers daily age-matched information, parent and child psychological tests, lullabies and white noise [V G46].
- **Pricing:** free; the App Store page lists no in-app purchases [V G46]. Revenue comes from events and group buys [V G46r][I].
- **Scale:** "1.5 million mothers over 20 years"; "more than 5,000 mothers a month receive free publishing" [C G46]. 5,457 ratings [V G13].
- **Capture modes:** text and photo. The microphone is used only to record white noise [V G46].
- **AI:** none.
- **Privacy:** its label declares identifiers and usage data used to track, and third-party advertising [V G46].
- **Family sharing:** not central [U].
- **Print:** the core reward [V G46].
- **Languages:** English and Korean [V G46].
- **Praise:**
  - "10 years, my most-used app";
  - the child takes "my own book" to school while friends bring studio albums;
  - the 100-day goal builds a habit [V G46r].
- **Complaints:** wants basic photo editing [V G46r].

**키즈노트 (Kidsnote):** the daycare and kindergarten notice app. By 2015, 25,000 centres (over half nationwide) used it [S G48b]. Teachers post albums of the child's day, and parents can print them as a 키즈노트북 [V G48]. Teachers complain it turns them into photographers [V G48r]. In Korea, part of the baby's photo record is made by the daycare, not the family [I].

### 2.8 Other notable markets and players

- **Taiwan and Hong Kong:** FamilyAlbum has 32,607 Taiwan and 3,512 Hong Kong ratings [V G13]. Its own list of 7 languages names "Chinese (Traditional)" [V G1], although the App Store lists both scripts [V G3]. Taiwan's iOS share is 51.7% [V G96].
- **Canada:** FamilyAlbum has 64,697 ratings, its highest outside Japan and the US [V G13]. Qeepsake (1,731) is also sold there [V G13].
- **Australia:** Tinybeans' home market (founded 2012) [S G71], with 19,408 ratings; FamilyAlbum has 39,372 [V G13].
- **TinyNest** (Tiny Nest AI LLC, April 2025): a global private family album in 31 languages including Hindi. It has 4,233 US ratings in 18 months [V G100], so newcomers can still grow fast with broad localisation [I].
- **US voice products, for comparison:** Remento records and transcribes only English and Spanish, and its interface is English-only [V G98]. Storyworth's interface is English and Latin American Spanish [V G99].
- **Platform defaults that every app competes with:**
  - Google Photos partner sharing auto-shares chosen photos with one partner [V G97].
  - WhatsApp now transcribes voice messages on the device, and "no one else, not even WhatsApp" can hear or read them [V G95]. These transcripts sit in a chat; they are not a keepsake [I].

---

## 3. Capability matrix (profiled products)

Y = stated on the cited listing or page; N = not offered or not described; ? = unclear.

| Product (home) | Private invite-only family | Auto-sort by date/age | Grandparent path beyond the app | Print | Voice as keepsake | Transcription | Generative AI | Hindi / Arabic / Portuguese UI | No tracking on label |
|---|---|---|---|---|---|---|---|---|---|
| FamilyAlbum (JP) | Y | Y | Y (PC browser, photo frame) | Y | N (video only) | N | N | N / N / N | N |
| Qinbaobao (CN) | Y | Y | ? | Y | ? (audio data on label) | N | Y | N / N / N | N |
| Babytree 小时光 (CN) | Y | Y | ? | Y | Y (read-aloud recordings) | N | Y (parent voice imitation) | N / N / N | N |
| TimeHut / Bebememo | Y | Y | ? | Y (annual book) | ? | N | N (AI photo detection; "exploring AIGC") | N / Y / N | N |
| 쑥쑥찰칵 (KR) | Y | Y | N | Y | N | N | ? | N / N / N | N |
| 맘스다이어리 (KR) | ? | Y | Y (free printed book) | Y | N | N | N | N / N / N | N |
| BackThen (UK) | Y | Y | N | Y | N | N | N | N / N / N | N |
| Tinybeans (AU/US) | Y | Y | N | Y | N | N | N | N / N / N | N |
| 23snaps (UK) | Y | Y | N | Y | N | N | N | N / N / N | N |
| Chapter One (UK) | ? | Y | N | ? | ? | N | N | N / N / N | Y |
| Famileo (FR) | Y | N | Y (paper gazette) | Y | N | N | N | N / N / N | Y |
| Juno (DE) | Y | Y | N | Y (QR to video) | N | N | N | N / N / N | N |
| Dots (ES) | Y | Y | Y (printed QR book) | Y | Y (QR voice messages) | N | N | N / N / Y | N |
| こえアルバム (JP) | Y | Y | ? (invite link; app needed?) | N | Y | Y (AI) | Y (AI titles) | N / N / Y | N |
| Mylo, Healofy (IN) | N | N | N | N | N | N | N | Y (Mylo) / N / N | N |

Sources: the product profiles in section 2.

---

## 4. How families keep memories: cultural differences

| | Grandparents' role | Chat channels already used | Attitudes to voice notes | Privacy expectations |
|---|---|---|---|---|
| **India** | 54% of people live in extended families [V G63]. Only 40% of older people own a smartphone, and 66% find digital tools confusing [S G64]. Grandmothers' authority is a content genre ("Dadi ke nuskhe") [V G53]. | WhatsApp, 700M+ monthly users [S G61]; forwarded media fills phones [S G62] | Voice search grew fast and Hindi is preferred (2019) [S G65]. **No direct voice-note statistic found [U].** | Users could not opt out of WhatsApp data sharing with Meta [S G61]. **DPDP:** Rules notified 13 Nov 2025; children's data rules, including verifiable parental consent for under-18s, apply from 13 May 2027 [S G66]. |
| **UK and Europe** | Often far away; they are the audience for apps and for Famileo's paper gazette [V G74r][V G10]. About 25% of Europeans live in extended families [V G63]. | WhatsApp (no family-specific statistic found) | **UK: 63% of adults never send voice notes and 47% never receive them** (YouGov 2022) [S G78] | GDPR. **France:** Law 2024-120 makes parents jointly responsible for their child's image rights, and a judge can bar one parent from posting [S G79]. Germany: "German servers" is a selling point [C G76]. |
| **Spain, Latin America, Brazil** | 32% of people in Latin America live in extended families [V G63]. In Brazil, family is the top WhatsApp group topic [S G84]. | WhatsApp: 98% of Brazilian smartphones [V G83]; 88% of Mexican internet users use messaging [S G85] | **Strongest voice culture found:** Brazil sends 4x more voice messages than any other country [S G82]; 80% of Brazilian users exchange audio [V G83] | **LGPD Art. 14:** specific, prominent consent from a parent for children's data [V G86] |
| **China** | 40% of children aged 0 to 3 are cared for by grandparents (49% in cities) [V G41]. Older users drive WeChat-native photo videos (小年糕) [S G36]. | WeChat, 1.418B monthly users [V G38]; family groups; group files expire [V G28] | Voice messages are a core WeChat tool for older adults [V G40]. **No current volume statistic found [U].** | More than 100M people limit Moments to 3 days [S G39]. Parents choose "relatives only" [V G26]. **PIPL** treats minors' data as sensitive [S G42]. |
| **Japan** | They receive photos; the photo frame and PC access are built for them [S G8][V G3] | LINE, 100M monthly users [S G17]; reviewers used LINE Album before Mitene [V G10] | **Weak signal of low voice-message use** [S G20]. Yet a voice album app launched in Dec 2025 [V G14]. | Per-photo visibility ("spouse only") [V G3]. Parents already write in the public-health handbook [S G16]. |
| **Arabic-speaking Gulf** | Extended family and honour frame privacy [V G90] | WhatsApp 92% and Snapchat 77% in Saudi Arabia [S G88] | **Voice chosen more for emotional news:** 41% chose voice to share good news [V G89] | Women's images are tightly restricted; private accounts are the default [V G90]. **PDPL** requires verified guardian consent [S G91]. |
| **Korea** | Both sets of grandparents expect daily photos [V G45r][V G47r]. Grandparent childcare is rising [S G52]. | KakaoTalk, used by 98.9% [S G49]; daycare albums via Kidsnote [V G48] | **No statistic found [U]** | **PIPA:** a legal representative's consent for under-14s [S G50] |

**Implications [I]**

1. **Grandparents are the reason families use these apps in every market.** But the products treat them as viewers or paper recipients. The grandparent-as-author flow (deferred in v1.0, Brief decision 5) is the feature that best fits India, China, Korea, Latin America and the Gulf.
2. **Voice culture varies.** It is strongest in Brazil and the Gulf, mixed in the UK (most adults never send voice notes) and unclear in Japan. In the UK, lead with "letters to your child" and treat voice as a gift. In Brazil and the Gulf, lead with "keep the voices".
3. **Privacy means different things by region:**
   - in the Gulf, protection of family honour and of women's images;
   - in China, short visibility windows and "relatives only";
   - in Europe, server location and legal rights over a child's image.

   A design that works without photos of faces, and that is private by default, travels across all three.
4. **Every major region now has rules on children's data that require a parent's consent:** India (from May 2027), China, Brazil, Korea, Saudi Arabia and the EU. Our users are adults writing about a child, but the child's name and voice are the child's personal data. Legal must confirm how parental consent is captured in each market before launch there (needs counsel; not legal advice).

---

## 5. Answers

### 5.1 Global table stakes

These capabilities appear in nearly every leading product across regions:

1. **A private, invite-only family space** with per-item or per-person visibility. Found in FamilyAlbum, Qinbaobao, TimeHut, 쑥쑥찰칵, BackThen, Tinybeans, 23snaps, Juno and Dots [section 2].
2. **Automatic sorting by date and child's age**, and support for several children [V G3][V G31][V G45][V G68].
3. **Easy access for grandparents**, without sending photos one by one: PC browser, photo frame, paper gazette, invite link [V G3][S G8][C G74][V G14].
4. **Comments and reactions** from family [V G3][V G45][V G28].
5. **Physical output:** monthly prints, photobooks, an annual auto book, a free 100-day book [V G3][V G13b][V G31][V G46]. Print is how this category makes money, in the US and abroad.
6. **Free unlimited or generous core storage, with a subscription for video quality, storage or no ads.** Typical prices:
   - FamilyAlbum $5.99 a month or $59 a year (US);
   - BackThen £4.99 a month;
   - Juno €34.99 to €69.99 a year;
   - TimeHut ¥188 a year;
   - Qinbaobao ¥248 a year;
   - 쑥쑥찰칵 ₩59,000 to ₩99,000 a year
   [V G5][V G68][V G76][V G31][V G22][V G45].
7. **Automatic recaps:** 1-second movies, monthly growth videos, music videos, "on this day" [V G3][V G45][V G21][V G28].
8. **"No ads" claims,** made by BackThen, Juno, Bebememo, 23snaps, Famileo and Chapter One [section 2]. Labels often contradict them (see 0.5).

Early Letters at launch has 1, 2 (as month-of-age chapters), 4 (partly) and the privacy claim. **It does not yet have** grandparent access (deferred), print (deferred) or automatic recaps [I, from the Brief]. Outside the US, the missing grandparent path is the most visible gap, because grandparents are the reason families adopt these apps [I].

### 5.2 Missing everywhere

1. **Voice as the keepsake, with a faithful transcript in the speaker's own script.**
   - No profiled product outside the US records family voice letters and keeps a verbatim transcript in Hindi, Arabic or Portuguese. Only こえアルバム transcribes at all (Japanese, with AI titles), and Dots prints QR codes to voice [V G14][V G81].
   - Chinese leaders move the other way: Babytree imitates parents' voices with AI [V G29], and Qinbaobao generates portraits and songs [S G24].
   - **"We never rewrite and never synthesise your voice" is unclaimed in every market [I].**
2. **Hindi and Arabic memory books.** None found [V G60][V G92]. FamilyAlbum's languages omit Hindi, Arabic and Portuguese [V G1].
3. **Mixed-language families.** No product mentions code-switching or more than one language per entry. This is an inference from the listings [I]; Early Letters defers Hindi-English mode to v1.1 (Brief).
4. **Grandparents as authors in their own language,** not just viewers. Famileo inverts the flow: the family writes and the grandparent reads [C G74]. FamilyAlbum and TimeHut give grandparents viewing access [V G3][V G31].
5. **Letters to the child, organised as a book about the child, rather than a feed.**
   - Only Chapter One (UK, 5 ratings), 맘스다이어리 (a daily diary book) and こどもことば (child's words) come close [V G73][V G46][V G15].
6. **A clean privacy label.**
   - Most leaders declare tracking (0.5).
   - Only Famileo and Chapter One declare none among the profiled apps [V G74][V G73], and Nori among small apps [V G77].
7. **Memories never held hostage, and a written shutdown pledge.**
   - Reviews in China fear future fees or closure [V G26].
   - UK users were forced to pay again when Lifecake moved to BackThen [V G68r].
   - French users lost free prints overnight [V G11].
   - No profiled product publishes a shutdown or export pledge [U: not found on the listings].

### 5.3 What the 7-language launch means in each market

| Spoken language | Markets outside the US | Who we meet there | Positioning [I] | Watch-outs |
|---|---|---|---|---|
| **English** | Canada, UK, Ireland, Australia, NZ, Singapore, Gulf expats | FamilyAlbum, BackThen, Tinybeans, 23snaps, Chapter One [V G13][V G73] | "Letters in your own words and voice, not another photo feed." Do not compete on photo storage. | UK voice-note reluctance [S G78]: lead with letters and listening, not "send voice notes" |
| **French** | France, Belgium, Switzerland, Quebec, Francophone Africa | FamilyAlbum (50K French ratings); Famileo (grandparent print); BackThen [V G13] | "The family's letters to the child, kept word for word." Pair with a grandparent print gazette later (Famileo proves demand [C G74]). | FamilyAlbum's EU print suspension shows print must be fulfilled inside the EU [V G7]. Child image-rights law [S G79]. GDPR. |
| **Spanish** | Mexico, Spain, Colombia, Argentina, wider Latin America | Dots (local, events and QR voice) [V G81]; FamilyAlbum (Spanish UI) [V G3] | "Keep the voices, not just the photos," with the abuelos (grandparents). Dots shows demand for QR-to-voice books [V G81]. | iOS share is low (12.6% to 28%) [V G96]; Dots reviews show support and payment pain, including cash payments at Oxxo stores [V G81r]; Android needed |
| **Portuguese** | Brazil; Portugal | No local leader found [V G87]; FamilyAlbum present but small [V G13] | **The best cultural fit of any market:** Brazilians already speak to family in audios [S G82][V G83]. "Your family's audios, kept as a book." | iOS 21.2% in Brazil [V G96]. Brazilian vs European Portuguese spelling needs a per-author setting [I]. LGPD parental consent [V G86]. FamilyAlbum's print to Portugal is suspended [V G7]. |
| **Mandarin Chinese** | Taiwan, Singapore, Hong Kong, Malaysia, diaspora; mainland China not feasible | FamilyAlbum (names Traditional Chinese, 32.6K Taiwan ratings) [V G13][V G1]; in China, Qinbaobao, Babytree, TimeHut [V G13] | Outside the mainland: "grandparents' Mandarin, kept in characters, in their voice." | **Script decision needed:** Taiwan and Hong Kong write Traditional characters, the mainland Simplified [I]; FamilyAlbum's language list names Traditional [V G1]. Cantonese is not covered [I]. The mainland needs ICP filing, a Chinese entity and AI filing, and incumbents are free with unlimited storage [S G43][S G44][V G21]. |
| **Arabic** | Saudi Arabia, Kuwait, UAE, Qatar, Egypt | No Arabic-native memory app; Bebememo only [V G92][V G47] | "Private by default. No faces needed. Their voices, in their words." Voice-first suits Gulf habits [V G89] and image-privacy norms [V G90]. | **Dialect policy:** Gulf, Egyptian and Levantine speech must stay as spoken, not normalised to Modern Standard Arabic, under our "never reword" rule [I]. PDPL guardian consent [S G91]. FamilyAlbum's tiny Saudi footprint (44 ratings) means we would be creating the category [V G13]. |
| **Hindi** | India; Gulf and UK diaspora | Mylo and Healofy (content, not memories) [V G53][V G56]; no memory book [V G60] | "Dadi and Nani's words, in Devanagari, in their voice." Unique in the market. | iOS is 6.1% [V G96]; elderly smartphone gaps [S G64]; Hinglish deferred to v1.1; DPDP children's rules from May 2027 [S G66]. **Best reached first through diaspora families in the US, UK, Canada and the Gulf [I].** |

### 5.4 Most promising non-US markets next

| Rank | Market | Why [I unless marked] | Main risk |
|---|---|---|---|
| 1 | **Canada** | English and French are both in v1.0. Highest iOS share checked (64.9%) [V G96]. Proven demand: FamilyAlbum's 64.7K ratings are its most outside Japan and the US [V G13]. US pricing and copy mostly carry over. | Quebec French copy and privacy law (not researched here) |
| 2 | **UK and Ireland** | English, iOS 46.9% and 47.4% [V G96]. Mature category: FamilyAlbum 58K, BackThen 19K, Tinybeans 6.5K [V G13]. Chapter One shows local appetite for "a journal, not a tracker" [V G73]. Diaspora Hindi, Arabic and Mandarin speakers are a ready second audience [I]. | Voice-note reluctance [S G78]; UK GDPR |
| 3 | **Australia and NZ** | English, iOS 62.6% [V G96]. Tinybeans' home market and FamilyAlbum's 39K ratings [V G13]. | Tinybeans' local brand |
| 4 | **Gulf (Saudi Arabia, Kuwait, then UAE and Qatar)** | Arabic is in v1.0. iOS 51.6% in Saudi Arabia and 48.4% in Kuwait [V G96]. Voice is the emotional channel [V G89]. No Arabic competitor [V G92]. Day One's 1,377 Saudi ratings show private journaling has buyers [V G13]. | Category creation (FamilyAlbum has only 44 Saudi ratings); dialect transcription quality; PDPL; image-privacy norms make photo-led marketing wrong [V G90] |
| 5 | **France and Belgium** | French is in v1.0. 50K FamilyAlbum ratings show demand [V G13]. Famileo proves families will pay monthly for grandparents [C G74]. FamilyAlbum's print suspension leaves a gap for EU-printed books [V G7]. | iOS 34.6% [V G96]; GDPR and child image law [S G79] |
| 6 | **Taiwan and Singapore** | Mandarin is in v1.0. iOS 51.7% and 43.7% [V G96]. FamilyAlbum's 32.6K Taiwan ratings [V G13]. | Needs Traditional-character output for Taiwan [I]; LINE-centric sharing [V G18] |
| 7 | **Brazil, Mexico, Spain, Portugal** | Best behavioural fit (Brazilian audio culture) [S G82][V G83]; languages ready; weak local competition [V G87]. | iOS 12.6% to 32.7% [V G96]: needs Android (deferred to v1.1); price sensitivity; payment habits (Oxxo) [V G81r] |
| 8 | **India** | Unique gap: no Hindi memory book [V G60]. Strongest grandparent fit [V G63]. Mother-tongue demand appears in reviews [V G56r]. | iOS 6.1% [V G96]; needs Android, Hinglish (v1.1) and the grandparent contributor flow (deferred); DPDP 2027 [S G66]. Start with the diaspora. |
| Not next | **Mainland China** | ICP filing, a Chinese entity, generative AI filing, PIPL [S G43][S G44][S G42]; free incumbents with commerce and AI [V G21][V G29] | |
| Not next | **Japan, Korea** | Japanese and Korean are not v1.0 languages. Japan has an entrenched default (about 65% of parents use FamilyAlbum) [V G2]; Korea has local leaders and the daycare channel [V G45][V G48]. Japan's 60.5% iOS share makes it a candidate once Japanese is added [V G96][I]. | |

---

## 6. Requests for other owners (I edited nothing outside this file)

1. **Language packs (speech owner):**
   - choose Simplified or Traditional output for Mandarin, ideally per author;
   - set a dialect policy for Arabic: keep the dialect as spoken, never normalise to Modern Standard Arabic;
   - set a Brazil vs Portugal spelling setting.

   Evidence: FamilyAlbum names Traditional Chinese [V G1]; section 5.3.
2. **Privacy (legal and the App Store listing owner):** aim for an App Store label with no "Data Used to Track You" section and minimal linked data. It is a visible differentiator against every market leader profiled [V G4][V G70][V G22]. Opt-in PostHog must be checked against Apple's tracking definition before the label is filed.
3. **Print (future print owner):** fulfil prints inside each region. FamilyAlbum's EU suspension shows how fragile cross-border print is [V G7]. QR-to-voice books exist in Spain (Dots) and the US (Remento), and Dots' QR failures drew 1-star reviews [V G81r]. If we print QR codes, the links must last for decades.
4. **Family roadmap (product):** the grandparent author flow (deferred in v1.0) is the main reason families in India, China, Korea and the Gulf adopt apps in this category [section 4]. Design it for a grandparent who records on the parent's phone, since only 40% of older Indians own a smartphone [S G64].
5. **Positioning (content):** say "we never imitate your voice" alongside "we never rewrite". Babytree's AI voice imitation makes the contrast concrete [V G29]. Content rules allow this, because it says what we do not do with AI.

---

## Sources (all opened 2026-10-03 unless marked)

App Store "lookup" URLs return the listing (description, language list, ratings) for one storefront. Change the `country=` value to reproduce other storefronts. The "page" URL shows in-app purchases and the privacy label. Reviews come from the page with `?see-all=reviews` (marked "r").

- **G1** FamilyAlbum, "We've surpassed 30 million users worldwide" (13 May 2026): https://blog.family-album.com/announcements/weve-surpassed-30-million-users-worldwide/
- **G2** MIXI news release, 7 May 2026: https://mixi.co.jp/en/news/2026/0507/52325/
- **G3** FamilyAlbum (みてね) Japan listing: https://itunes.apple.com/lookup?id=935672069&country=jp
- **G4** FamilyAlbum UK page (prices, privacy label): https://apps.apple.com/gb/app/id935672069?l=en-GB
- **G5** FamilyAlbum US page (prices, privacy label): https://apps.apple.com/us/app/id935672069
- **G6** FamilyAlbum help, free vs Premium: https://help.family-album.com/hc/en-us/articles/4404344217113-What-s-the-difference-between-FamilyAlbum-Premium-and-the-free-version-What-features-are-included-in-each-service ; **G6b** Premium Family vs Pro: https://help.family-album.com/hc/en-us/articles/20336246911001-What-s-the-difference-between-FamilyAlbum-Premium-and-Premium-Pro
- **G7** FamilyAlbum help, temporary suspension of orders to EU member states: https://help.family-album.com/hc/en-us/articles/60113030217497-Temporary-Suspension-of-Orders-to-Certain-EU-Member-States
- **G8** Mitene photo frame release (Resemom / PR Times, 21 Nov 2025): https://resemom.jp/release/prtimes/20251121/163976.html
- **G9** Mitene Premium Japan price (app-tatsujin, secondary): https://app-tatsujin.com/?p=95939
- **G10** FamilyAlbum featured reviews: https://apps.apple.com/jp/app/id935672069?see-all=reviews ; https://apps.apple.com/us/app/id935672069?see-all=reviews ; https://apps.apple.com/gb/app/id935672069?see-all=reviews
- **G11** FamilyAlbum France reviews RSS (50 most recent): https://itunes.apple.com/fr/rss/customerreviews/page=1/id=935672069/sortby=mostrecent/json
- **G12** FamilyAlbum Google Play: https://play.google.com/store/apps/details?id=us.mitene
- **G13** Cross-country ratings counts, iTunes Lookup API, `https://itunes.apple.com/lookup?id=<id>&country=<cc>`, with ids:
  - FamilyAlbum 935672069; Tinybeans 521633042; BackThen 1505173822; 23snaps 526481189; Qeepsake 1332312787; Day One 1044867788;
  - Famileo 1018182135; Bebememo 1494276528; Qinbaobao 672984826; Juno 1514192391; Chapter One 6761275608; Dots 6449039420;
  - 쑥쑥찰칵 1509183009; 맘스다이어리 669378713; こえアルバム 6755823332.
  - Example: https://itunes.apple.com/lookup?id=935672069&country=sa
  - **G13b** ALBUS Japan: https://itunes.apple.com/lookup?id=1102311118&country=jp ; **G13r** https://apps.apple.com/jp/app/id1102311118?see-all=reviews
- **G14** こえアルバム listing: https://itunes.apple.com/lookup?id=6755823332&country=jp ; privacy label: https://apps.apple.com/jp/app/id6755823332?l=en-GB
- **G15** こどもことば listing: https://itunes.apple.com/lookup?id=6767477409&country=jp
- **G16** Maternal and Child Health Handbook explainer (Spaceship Earth): https://spaceshipearth.jp/maternity-handbook/
- **G17** LINE Japan 100M monthly users (Jetstream, citing LY Corp, 29 Jan 2026): https://jetstream.blog/2026/01/29/line-japan-100-million-mau-milestone/
- **G18** LY Corporation corporate information (LINE 181M in top 4 countries, Mar 2026): https://www.lycorp.co.jp/en/company/
- **G19** LINE Yahoo Japan/Taiwan/Thailand usage study (Web Tan, 15 Jan 2026): https://webtan.impress.co.jp/n/2026/01/15/51995
- **G20** Japan vs Europe voice message article (Real Sound, Dec 2021, weak): https://realsound.jp/tech/2021/12/post-913643.html
- **G21** Qinbaobao China listing: https://itunes.apple.com/lookup?id=672984826&country=cn
- **G22** Qinbaobao China page (prices, privacy label): https://apps.apple.com/cn/app/id672984826?l=en-GB
- **G23** Qinbaobao analysis (Woshipm, 5 Jun 2020): https://www.woshipm.com/evaluating/3962134.html
- **G24** Qinbaobao AI parenting model (China.com Tech, 21 Mar 2025): https://m.tech.china.com/articles/20250321/202503211650732.html
- **G25** Qinbaobao category report (PEdaily, 17 May 2023): https://news.pedaily.cn/202305/513807.shtml
- **G26** Qinbaobao featured reviews: https://apps.apple.com/cn/app/id672984826?see-all=reviews
- **G27** 宝宝树孕育 China listing: https://itunes.apple.com/lookup?id=523063187&country=cn
- **G28** 宝宝树小时光 listing: https://itunes.apple.com/lookup?id=628470263&country=cn ; page: https://apps.apple.com/cn/app/id628470263?l=en-GB
- **G29** BabyTree Group 2022 annual results (HKEX): https://www1.hkexnews.hk/listedco/listconews/sehk/2023/0321/2023032101321.pdf
- **G30** 宝宝树小时光 featured reviews: https://apps.apple.com/cn/app/id628470263?see-all=reviews
- **G31** TimeHut 时光小屋 listing: https://itunes.apple.com/lookup?id=565951606&country=cn ; page: https://apps.apple.com/cn/app/id565951606?l=en-GB ; **G31r** reviews: https://apps.apple.com/cn/app/id565951606?see-all=reviews
- **G32** TimeHut (Bebememo, Inc.) company profile (Yourator): https://www.yourator.co/companies/Bebememo
- **G33** Google Play: TimeHut https://play.google.com/store/apps/details?id=com.liveyap.timehut ; Bebememo https://play.google.com/store/apps/details?id=com.liveyap.timehut.bbmemo
- **G34** 网易亲时光 listing: https://itunes.apple.com/lookup?id=1502051733&country=cn
- **G35** 美柚 listing: https://itunes.apple.com/lookup?id=634896669&country=cn
- **G36** 小年糕 and 美篇 (PEdaily, Sep 2019): https://news.pedaily.cn/201909/446593.shtml
- **G37** 美篇 listing: https://itunes.apple.com/lookup?id=987570993&country=cn
- **G38** Tencent 2025 annual results (PR Newswire Asia): https://en.prnasia.com/releases/apac/tencent-announces-2025-annual-and-fourth-quarter-results-525781.shtml
- **G39** WeChat 2019 open-class statistics (ifanr): https://www.ifanr.com/minapp/1170037
- **G40** Lei Guo, "WeChat as a Semipublic Alternative Sphere", IJoC 11 (2017): https://ijoc.org/index.php/ijoc/article/download/5537/1909
- **G41** Grandparenting and children aged 0 to 3 in China (Frontiers in Public Health, 2024, CFPS 2020): https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2024.1494222/full
- **G42** PIPL summary (DigiChina, Stanford): https://digichina.stanford.edu/work/seven-major-changes-in-chinas-finalized-personal-information-protection-law
- **G43** China app filing regime (Linklaters): https://techinsights.linklaters.com/post/102j72l/china-the-new-app-filing-regime-keeps-mobile-apps-under-tight-scrutiny
- **G44** China generative AI Interim Measures (Morrison Foerster): https://www.mofo.com/resources/insights/230724-china-interim-measures-governing-generative-ai
- **G45** 쑥쑥찰칵 listing: https://itunes.apple.com/lookup?id=1509183009&country=kr ; page: https://apps.apple.com/kr/app/id1509183009?l=en-GB ; **G45r** reviews: https://apps.apple.com/kr/app/id1509183009?see-all=reviews
- **G46** 맘스다이어리 listing: https://itunes.apple.com/lookup?id=669378713&country=kr ; page: https://apps.apple.com/kr/app/id669378713?l=en-GB ; **G46r** reviews: https://apps.apple.com/kr/app/id669378713?see-all=reviews
- **G47** Bebememo listing: https://itunes.apple.com/lookup?id=1494276528&country=kr ; privacy label: https://apps.apple.com/us/app/id1494276528?l=en-GB ; **G47r** reviews: https://apps.apple.com/kr/app/id1494276528?see-all=reviews and https://apps.apple.com/sa/app/id1494276528?see-all=reviews
- **G48** Kidsnote listing: https://itunes.apple.com/lookup?id=527574743&country=kr ; **G48r** reviews: https://apps.apple.com/kr/app/id527574743?see-all=reviews ; **G48b** Kakao release, 25,000 centres (31 Aug 2015): https://www.kakaocorp.com/page/detail/7808?lang=ENG
- **G49** KakaoTalk 98.9% (Korea Times, 6 Feb 2025): https://www.koreatimes.co.kr/amp/southkorea/20250206/kakaotalk-leads-social-media-usage-in-korea-followed-by-youtube-and-instagram
- **G50** Korean PIPA Art. 22-2 (Prighter): https://prighter.com/resources/laws/korean-pipa/main/articles/article-22-2
- **G51** "Parents break bank on baby photos" (Korea JoongAng Daily, May 2015): https://www.koreajoongangdaily.com/korea/parents-break-bank-on-baby-photos/11042845
- **G52** Grandparent childcare in Korea (Korea Times, 24 May 2025): https://www.koreatimes.co.kr/amp/southkorea/society/20250524/to-raise-or-not-to-raise-the-grandparent-dilemma-in-modern-korean-families
- **G53** Mylo India listing: https://itunes.apple.com/lookup?id=1577492842&country=in ; page: https://apps.apple.com/in/app/id1577492842?l=en-GB ; **G53r** reviews: https://apps.apple.com/in/app/id1577492842?see-all=reviews
- **G54** Mylo Google Play: https://play.google.com/store/apps/details?id=in.mylo.pregnancy.baby.app
- **G55** Mylo Series B (People Matters, 21 Apr 2022): https://www.peoplematters.in/news/funding-investment/mylo-raises-17-mn-in-funding-led-by-w-health-ventures-itc-limited-endiya-partners-33679
- **G56** Healofy India listing: https://itunes.apple.com/lookup?id=6444273441&country=in ; page: https://apps.apple.com/in/app/id6444273441?l=en-GB ; **G56r** reviews: https://apps.apple.com/in/app/id6444273441?see-all=reviews
- **G57** Healofy Google Play: https://play.google.com/store/apps/details?id=com.healofy
- **G58** Parentune listing: https://itunes.apple.com/lookup?id=6448415937&country=in
- **G59** Good Glamm Group collapse (Inc42, 7 Jul 2025): https://inc42.com/?p=521776
- **G60** App Store India searches: https://itunes.apple.com/search?term=babychakra&country=in&entity=software ; https://itunes.apple.com/search?term=baby+memory+book&country=in&entity=software ; https://itunes.apple.com/search?term=hindi+diary&country=in&entity=software ; https://itunes.apple.com/search?term=parenting+app+india&country=in&entity=software ; **G60b** Google Play India: https://play.google.com/store/search?q=baby%20memory%20book&c=apps&gl=IN
- **G61** WhatsApp in India, CCI ruling and Sensor Tower users (TechCrunch, 22 Jan 2025): https://techcrunch.com/2025/01/22/whatsapp-wins-reprieve-in-india-over-user-data-sharing
- **G62** "Good morning" images and phone storage in India (YourStory, 23 Jan 2018): https://yourstory.com/2018/01/google-whatsapp-good-morning
- **G63** Pew Research Center, household patterns by region (2019): https://www.pewresearch.org/religion/2019/12/12/household-patterns-by-region/
- **G64** HelpAge India report coverage (Outlook Money, Jun 2025): https://www.outlookmoney.com/amp/story/news/digital-divide-among-elderly-66-find-digital-tools-too-confusing
- **G65** Google India Hindi and voice search (Inc42, 9 May 2019): https://inc42.com/buzz/most-of-india-prefers-using-hindi-for-search-says-google
- **G66** DPDP Rules 2025 commencement (AZB & Partners, 19 Nov 2025): https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/
- **G68** BackThen listing: https://itunes.apple.com/lookup?id=1505173822&country=gb ; page: https://apps.apple.com/gb/app/id1505173822 ; **G68r** reviews: https://apps.apple.com/gb/app/id1505173822?see-all=reviews
- **G69** BackThen Google Play: https://play.google.com/store/apps/details?id=com.backthen.android
- **G70** Tinybeans UK page (prices): https://apps.apple.com/gb/app/id521633042 ; US privacy label: https://apps.apple.com/us/app/id521633042?l=en-GB ; Google Play: https://play.google.com/store/apps/details?id=com.tinybeans
- **G71** Tinybeans Group ASX announcement (17 Sep 2024): https://announcements.asx.com.au/asxpdf/20240917/pdf/067ytj414k9qk3.pdf
- **G72** 23snaps listing: https://itunes.apple.com/lookup?id=526481189&country=gb ; page: https://apps.apple.com/gb/app/id526481189 ; **G72r** reviews: https://apps.apple.com/gb/app/id526481189?see-all=reviews ; Google Play: https://play.google.com/store/apps/details?id=com.snaps23.android
- **G73** Chapter One listing: https://itunes.apple.com/lookup?id=6761275608&country=gb ; page: https://apps.apple.com/gb/app/id6761275608?l=en-GB ; **G73r** reviews: https://apps.apple.com/gb/app/id6761275608?see-all=reviews
- **G74** Famileo France listing: https://itunes.apple.com/lookup?id=1018182135&country=fr ; privacy label: https://apps.apple.com/fr/app/id1018182135?l=en-GB ; **G74r** reviews: https://apps.apple.com/fr/app/id1018182135?see-all=reviews
- **G75** Famileo Google Play: https://play.google.com/store/apps/details?id=com.entourage.famileo
- **G76** Juno listing: https://itunes.apple.com/lookup?id=1514192391&country=de ; page: https://apps.apple.com/de/app/id1514192391?l=en-GB ; **G76r** reviews: https://apps.apple.com/de/app/id1514192391?see-all=reviews
- **G77** Nori Baby Journal listing: https://itunes.apple.com/lookup?id=6762177361&country=de
- **G78** YouGov, how many Britons use voice notes (Jun 2022): https://yougov.com/en-gb/articles/42817-how-many-britons-voice-notes
- **G79** France Law 2024-120 on children's image rights (Actu-Juridique): https://www.actu-juridique.fr/breves/personnes-famille/protection-du-droit-a-limage-de-lenfant-publication-de-la-loi/
- **G80** Day One listing (languages): https://itunes.apple.com/lookup?id=1044867788&country=us
- **G81** Dots Memories listing: https://itunes.apple.com/lookup?id=6449039420&country=es ; page: https://apps.apple.com/es/app/id6449039420?l=en-GB ; **G81r** reviews: https://apps.apple.com/es/app/id6449039420?see-all=reviews and https://apps.apple.com/mx/app/id6449039420?see-all=reviews
- **G82** Brazil sends 4x more WhatsApp audio (Canaltech, 6 Jun 2024): https://canaltech.com.br/apps/whatsapp-brasil-envia-4-vezes-mais-audio-do-que-outros-paises-diz-zuckerberg-292037/
- **G83** Panorama Mobile Time / Opinion Box, messaging in Brazil (Mar 2024): https://static.poder360.com.br/2024/03/Panorama-Mensageria-MAR-24.pdf
- **G84** Datafolha on WhatsApp group topics (Diario de Pernambuco, Jul 2019): https://www.diariodepernambuco.com.br/noticia/brasil/2019/07/no-whatsapp-familia-vem-antes-de-politica-diz-datafolha.html
- **G85** AIMX internet habits 2022 (Xataka Mexico): https://www.xataka.com.mx/investigacion/somos-pais-whatsapero-9-cada-10-mexicanos-usan-internet-para-mensajes-siete-para-ver-peliculas-dos-para-cursos-linea/amp
- **G86** LGPD, Lei 13.709/2018 (Planalto): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- **G87** App Store Brazil searches: https://itunes.apple.com/search?term=di%C3%A1rio+do+beb%C3%AA&country=br&entity=software ; https://itunes.apple.com/search?term=%C3%A1lbum+de+fotos+beb%C3%AA+fam%C3%ADlia&country=br&entity=software
- **G88** Saudi Center for Public Opinion Polling survey (Arab News, Feb 2022): https://www.arabnews.com/media/whatsapp-most-popular-app-among-saudis-survey-2054631
- **G89** Alsakaker, voice messaging among Saudi WhatsApp users, JLTR 16(3) (2025): https://jltr.academypublication.com/index.php/jltr/article/download/10051/8148/31981
- **G90** Abokhodair and Vieweg, "Privacy and Social Media in the Context of the Arab Gulf" (2016): https://arxiv.org/pdf/1604.03626
- **G91** Saudi Arabia children's data (Bird & Bird): https://childreninthedigitalworld.twobirds.com/home/saudi-arabia
- **G92** App Store and Google Play Saudi searches: https://itunes.apple.com/search?term=%D8%B0%D9%83%D8%B1%D9%8A%D8%A7%D8%AA+%D8%A7%D9%84%D8%B7%D9%81%D9%84&country=sa&entity=software ; https://play.google.com/store/search?q=%D8%A3%D9%84%D8%A8%D9%88%D9%85%20%D8%A7%D9%84%D8%B7%D9%81%D9%84&c=apps&gl=SA
- **G93** FirstCry Arabia Saudi listing: https://itunes.apple.com/lookup?id=1482138817&country=sa
- **G94** WhatsApp, "Making voice messages better" (30 Mar 2022): https://blog.whatsapp.com/making-voice-messages-better
- **G95** WhatsApp, "Introducing voice message transcripts" (21 Nov 2024): https://blog.whatsapp.com/introducing-voice-message-transcripts
- **G96** StatCounter mobile OS share, September 2026: `https://gs.statcounter.com/os-market-share/mobile/<country>`. Country slugs:
  - united-kingdom, ireland, france, germany, spain, portugal;
  - mexico, brazil, argentina, colombia;
  - india, china, taiwan, hong-kong, singapore, japan, south-korea;
  - saudi-arabia, united-arab-emirates, kuwait, qatar, egypt;
  - canada, australia, united-states-of-america.
  - Example: https://gs.statcounter.com/os-market-share/mobile/india
- **G97** Google Photos partner sharing help: https://support.google.com/photos/answer/7378858
- **G98** Remento supported languages: https://help.remento.co/en/articles/8365902-supported-languages-on-remento
- **G99** Storyworth supported languages: https://help.storyworth.com/en_US/getting-started/what-languages-are-supported
- **G100** TinyNest listing: https://itunes.apple.com/lookup?id=6743824334&country=us

**Gaps and limits**
- Apple's review RSS returned empty for most apps on 3 Oct 2026, so review coding uses Apple's 10 featured reviews per app. Apple chooses those reviews, and they skew older and positive.
- Chinese Android stores (Huawei, Xiaomi and others) and Korean ONE store were not checked, so scale for China and Korea relies on company and press claims.
- No statistics were found for voice-note attitudes in India, Japan or Korea.
- A Japan-only price for FamilyAlbum Premium was not verified on Apple's page.
- Babytree's latest (2024 or 2025) monthly-user figure was not found; the 2022 figure is the latest verified.
- Privacy and children's-data laws are summarised from law-firm and secondary sources. This is not legal advice, and counsel must confirm each market before launch.
