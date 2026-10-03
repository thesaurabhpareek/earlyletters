# R3 Market: who could use Early Letters, what the category earns, what it costs

Status: desk research, 3 Oct 2026. Author: market analyst agent for PRD V2. Extends `docs/research/USER_RESEARCH.md` (UR) section 4 and `docs/research/COMPETITIVE_RESEARCH.md` (CR) sections 3 and 6; it does not redo them.

Labels: **[F]** fact from a page opened today (R3-S#). **[S]** signal. **[A]** assumption or calculation (inputs and arithmetic shown). **[R]** recommendation. **Unverified**: could not open or confirm today. **Inferred**: my reasoning from sourced facts.

## 0. Bottom line

- **Pool:** 3,606,400 US births in 2025 (provisional, down 1%) [F]. About 39.6% are first births [A]. About 18.5 million children are under 5 [A from F]. At an assumed 55% iPhone share, about 2.0 million new families a year are reachable [A].
- **iPhone share is not settled:** 53.6% of US mobile web traffic and 69% of Q4 2025 sales are iOS [F]. No source gives the share among parents (**Unverified**).
- **Languages:** the six non-English launch languages have 53.5 million US speakers at home (ACS 2024), 72% of everyone who speaks a language other than English at home [F, A]. Spanish is 44.9 million of that. Tagalog (1.9M), Vietnamese (1.6M), Korean (1.2M) and Haitian (1.0M) are each larger than Hindi (1.06M) and are not in the seven [F].
- **Immigrant parents:** 24.5% of 2024 births were to mothers born outside the 50 states and DC [F]. 22.8% of parents of a child under 3 are foreign-born [F, A].
- **Grandparents:** about 65 million; 76% say digital tools are a primary way to stay in touch; they spend $2,654 a year on grandchildren [F]. Distance and abroad figures are **Unverified**.
- **Category ceiling:** Tinybeans plus Qeepsake earn $6.49M a year from 93,300 paid families and only just reached positive EBITDA (FY26) [F]. Qeepsake sold for $2.7M in stock, about $54 per subscriber and about 0.66 times revenue [A].
- **Benchmarks:** 17 to 32 day trials convert best (44.6% on annual plans). Trials over 32 days have no benchmark. Freemium converts 2.1% by day 35, hard paywalls 10.7% [F]. Year-1 Base case: about 19,800 families, about 990 payers, about $30k net [A].
- **Costs:** no list price in ARCHITECTURE section 7 changed since 1 Oct. PostHog overage and Vercel Pro ($20) are now verified. Hosting models on R2 or Hugging Face (free egress) instead of Supabase avoids $3.8k to $11.3k at 220k installs [F, A].

## 1. Who could use it in the US

### 1.1 Births and young children

| Measure | Value | Year and status | Source |
|---|---|---|---|
| Births | 3,628,934 | 2024, final | [F] R3-S1 |
| Births | 3,606,400 (down 1% from 2024) | 2025, provisional (published Apr 2026) | [F] R3-S2 |
| General fertility rate | 53.8 per 1,000 females 15 to 44 (2024); 53.1 (2025 provisional) | 2024 final, 2025 provisional | [F] R3-S1, R3-S2 |
| Total fertility rate | 1,599.5 per 1,000 women, a record low | 2024 final | [F] R3-S1 |
| First-birth rate | 21.3 per 1,000 females 15 to 44 | 2024 final | [F] R3-S1 |
| Share of births that are first births | about 39.6%, about 1.44 million | 2024 | [A] 21.3 / 53.8 = 0.396; 0.396 x 3,628,934 = 1,436,734. Both rates share one denominator, so the ratio is the share. NVSR Table 3 holds the exact count but the PDF text I received did not include the table (**Unverified** exact count). |
| Mean age of mother at first birth | 27.6 years, a record high | 2024 | [F] R3-S1 |
| Mothers born outside the 50 states and DC | 24.5% of births (75.5% born in the 50 states or DC) | 2024 | [F] R3-S1 Table A |
| Same, by mother's race and Hispanic origin | Asian mothers 76.3% born outside; Hispanic 47.7%; Black 20.4%; White 7.0% | 2024 | [F] R3-S1 Table A (100% minus the printed share born in the 50 states or DC: Asian 23.7%, Hispanic 52.3%, Black 79.6%, White 93.0%) |
| Children under 1 | about 3.6 million | 2025 | **Inferred** from births (R3-S1, R3-S2). The Census single-year-of-age table is blocked by robots.txt (section 8). |
| Children under 5 | about 18.5 million (5.4% of 341,784,857) | Population estimate 1 Jul 2025 (V2025) | [A] 0.054 x 341,784,857 = 18,456,382. Percent and total from QuickFacts [F] R3-S4. The page does not print a date beside the under-5 row, so the rounding range is 5.35% to 5.45%, or 18.3M to 18.6M. |
| Children under 5 (cross-check) | 18.8 million | ACS 2024 | [F] R3-S6 (Social Explorer summary of ACS) |
| Children under 18 | 73.1 million | 1 Jul 2024 (V2024) | [F] R3-S21 |

**Inferred:** The pool of new families is about 3.6 million births a year. About 1.4 million of those are first babies, the moment a baby book is usually bought or gifted. Births are flat to falling (down 1% in 2025), so this is not a growing pool.

### 1.2 Households and parents with young children

No page I opened gives "households with a child under 5" directly. The closest measures:

| Measure | Value | Year | Source |
|---|---|---|---|
| Families with own children under 6 (youngest child under 6) | 13,422,000 (married couple 9,716,000) | 2025 annual average, CPS | [F] R3-S7 Table 4 |
| Families with own children under 18 | 32,895,000, nearly two fifths of all families | 2025 | [F] R3-S7, R3-S8 |
| Parents (people 16+) with own children under 3 | 14,951,000; foreign-born 3,414,000 (22.8%) | 2025 | [F] R3-S9 Table 2; [A] 3,414 / 14,951 = 22.8% |
| Parents with own children under 6 | 26,419,000; foreign-born 6,287,000 (23.8%) | 2025 | [F] R3-S9; [A] 6,287 / 26,419 = 23.8% |
| All households | 132,737,144 (ACS 2024 1-year); 129,227,496 (ACS 2020 to 2024 5-year) | 2024 | [F] R3-S19, R3-S4 |
| Families with own children under 18, share | 39% of families (54% in 1975) | 2025, CPS ASEC | [F] R3-S20 |

**Inferred:** About 13.4 million families have a youngest child under 6. Families with a child under 5 fall a little below that, and families with a child under 2 (the core buyer) are roughly 7 million (about 2 years of births, net of siblings). That figure is an estimate, not a sourced count.

### 1.3 iPhone share

| Measure | Value | Date | What it measures | Source |
|---|---|---|---|---|
| US adults who own a smartphone | 91% | Survey 5 Feb to 18 Jun 2025, n=5,022 | Ownership | [F] R3-S10 |
| By age | 18 to 29: 97%; 30 to 49: 96%; 50 to 64: 90%; 65+: 78% | 2025 | Ownership | [F] R3-S10 |
| By household income | under $30k: 82%; $100k+: 97% | 2025 | Ownership | [F] R3-S10 |
| iOS share of US mobile web traffic | 53.59% (Android 46.39%) | Sep 2026 | Page views, not people | [F] R3-S11 |
| Apple share of US smartphone sales | 69% (65% a year earlier) | Q4 2025 | Sell-in, one quarter, Counterpoint via TechSpot | [F] R3-S12 |
| iPhone share of US activations | 33% (about 40% through most of 2023) | Rolling 12 months to early 2024 | Activations, CIRP via GSMArena | [F] R3-S13 |

- Pew's fact sheet does not split iPhone from Android, by age, or by parent status (R3-S10). I found no primary source for iPhone share among parents. **Unverified.**
- **Inferred:** The sources disagree because they measure different things: web traffic, one holiday quarter of sales, and activations. A fair working range for "US smartphone owners who use an iPhone" is about 50% to 60%. I label it [A] and do not cite a single figure. An iPhone-only launch reaches roughly half of US parents.

## 2. The seven languages

### 2.1 US speakers at home of the seven launch languages

Source: ACS 2024 1-year, table B16001 (population 5 years and over), read from data.census.gov [F] R3-S14. Group totals cross-checked against table C16001 [F] R3-S15.

| Language (ACS category) | Speakers at home, age 5+ | Speak English less than very well | Share less than very well | Rank among single languages |
|---|---|---|---|---|
| English only | 247,695,110 | n/a | n/a | n/a |
| Spanish | 44,867,699 | 18,432,221 | 41.1% | 1 |
| Chinese (incl. Mandarin, Cantonese) | 3,734,956 | 1,895,001 | 50.7% | 2 |
| Arabic | 1,484,439 | 513,293 | 34.6% | 5 |
| French (incl. Cajun) | 1,276,702 | 279,230 | 21.9% | 6 |
| Portuguese | 1,099,503 | 394,010 | 35.8% | 8 |
| Hindi | 1,059,933 | 174,630 | 16.5% | 9 |
| **Six non-English launch languages, total** | **53,523,232** | | | |

- [A] 53,523,232 / 74,050,833 = 72.3% of the 74.1 million people who speak a language other than English at home. Without Spanish: 8,655,533 people, or 11.7%.
- ACS reports Chinese as one category. Mandarin and Cantonese are not split in the 2024 tables I opened. The Mandarin-only count is **Unverified**. **Inferred:** a Mandarin-only engine will not serve Cantonese-speaking families, who sit inside the 3.7 million.
- ACS counts people aged 5 and over, not households with babies (R3-S14). I found no national table of these languages for households with a child under 5 (section 8).
- **How the rows were identified (Inferred, checked):** the data.census.gov response gives values by variable code. The label file was rate limited (section 8). I mapped codes to the standard 42-category ACS layout and checked the result three ways: (a) the sub-sums of B16001 rows equal the C16001 group totals exactly (for example French 1,276,702 plus Haitian 1,041,231 = 2,317,933, the C16001 "French, Haitian, or Cajun" total; all eight groups match); (b) French (incl. Cajun) 1,276,702 and Haitian 1,041,231 match a third-party 2024 summary to the person [F] R3-S16; (c) Chinese 3.7M, Tagalog 1.9M, Vietnamese 1.6M and Arabic 1.5M match Statista's 2024 chart [F] R3-S17, and the count of 11 languages above 1 million matches USAFacts [F] R3-S18.

### 2.2 Top 20 single languages spoken at home, 2024

Source: ACS 2024 1-year, B16001 [F] R3-S14. Residual groups (such as "Other Indo-European", 675,587, or "Yoruba, Twi, Igbo, or other West African", 773,238) are left out because they are not single languages.

| Rank | Language | Speakers 5+ | In the seven |
|---|---|---|---|
| 1 | Spanish | 44,867,699 | Yes |
| 2 | Chinese (incl. Mandarin, Cantonese) | 3,734,956 | Mandarin only |
| 3 | **Tagalog (incl. Filipino)** | 1,921,526 | **No** |
| 4 | **Vietnamese** | 1,599,409 | **No** |
| 5 | Arabic | 1,484,439 | Yes |
| 6 | French (incl. Cajun) | 1,276,702 | Yes |
| 7 | **Korean** | 1,150,701 | **No** |
| 8 | Portuguese | 1,099,503 | Yes |
| 9 | Hindi | 1,059,933 | Yes |
| 10 | **Haitian** | 1,041,231 | **No** |
| 11 | **Russian** | 1,021,165 | **No** |
| 12 | German | 874,078 | No |
| 13 | Telugu | 605,544 | No |
| 14 | Persian (incl. Farsi, Dari) | 570,013 | No |
| 15 | Urdu | 561,196 | No |
| 16 | Polish | 508,512 | No |
| 17 | Italian | 507,347 | No |
| 18 | Bengali | 494,034 | No |
| 19 | Gujarati | 491,551 | No |
| 20 | Japanese | 471,742 | No |

- [F] Hindi entered the US top 10 for the first time in 2024 (R3-S16).
- **Inferred:** The four largest languages not in the seven are Tagalog, Vietnamese, Korean and Haitian, and together they have more speakers than Arabic, French, Portuguese and Hindi combined. [A] 1,921,526 + 1,599,409 + 1,150,701 + 1,041,231 = 5,712,867, against 1,484,439 + 1,276,702 + 1,099,503 + 1,059,933 = 4,920,577.
- **Inferred:** Urdu (561,196) is close to spoken Hindi. Hindi plus Urdu speakers total 1,621,129 [A], but the scripts differ (Devanagari against Nastaliq), so a Hindi pack does not cover Urdu text.
- Other Indic languages (Telugu, Gujarati, Bengali, Punjabi 382,413, Tamil 359,838) together are larger than Hindi [A]: 605,544 + 491,551 + 494,034 + 382,413 + 359,838 = 2,333,380. Many Indian-American families may speak one of these, not Hindi, with grandparents. **Inferred.**

### 2.3 Immigrant parents

| Measure | Value | Source |
|---|---|---|
| Births to mothers born outside the 50 states and DC | 24.5% of 2024 births, about 889,000 | [F] R3-S1 Table A; [A] 0.245 x 3,628,934 = 889,089 |
| Foreign-born share of parents with a child under 3 | 22.8% (3.41M of 14.95M) | [F] R3-S9 |
| Share of people 5+ speaking a language other than English at home | 23% (ACS 2024 1-year: 74,050,850); 22.3% (ACS 2020 to 2024) | [F] R3-S19, R3-S4 |

- "Born outside the 50 states and DC" includes mothers born in Puerto Rico and other US territories (R3-S1 wording), so it slightly overstates foreign-born. **Inferred.**
- Pew's 2023 births-by-mother's-status piece was rate limited (section 8).

## 3. Grandparents

Source for every row: AARP Research, *Powering Families: The Essential Role of Grandparents* (survey 18 Nov to 22 Dec 2025, n=3,283 grandparents, published 16 Jun 2026) [F] R3-S22, with its connections chapter [F] R3-S23. UR S15 cited the same survey; I re-verified it today.

| Measure | Value | Source |
|---|---|---|
| US grandparents | about 65 million; half of adults 50+ and one in three adults 35+ | [F] R3-S22 |
| Grandchildren per grandparent | mean 4.9 | [F] R3-S22 |
| Lived with a grandchild in the past year | 28% (11% now) | [F] R3-S22 |
| Say electronic tools (texting, video calls, social media, photo apps, email, group chats) are a primary way they stay connected | 76% | [F] R3-S22, R3-S23 |
| Grandparents 80+ who text with grandchildren | 50% | [F] R3-S22 |
| Gave financial support to grandchildren in the past year | 9 in 10 | [F] R3-S22 |
| Average spend on all grandchildren combined | $2,654 a year | [F] R3-S22 |
| Total direct financial support | over $172 billion a year | [F] R3-S22 |
| Share living far from grandchildren | Not given as a single figure. The report splits contact by distance and notes that among grandparents with a grandchild 500+ miles away, 16% say non-in-person contact is infrequent. | [F] R3-S23 |

- **Distance:** No page I opened today gives the share of grandparents who live far from a grandchild. AARP's 2019 study does give one, but I did not open it today. **Unverified.**
- **Smartphone use among 65+:** 78% own a smartphone (Pew 2025) [F] R3-S10.
- **Grandparents abroad:** No source I found counts US-born grandchildren with grandparents living abroad (section 8). **Inferred** from section 2.3: about one in four 2024 births was to a mother born outside the 50 states and DC, so for a large share of P4 families at least one set of grandparents may live outside the US. That makes the v1.1 contributor flow (which assumes a US App Store install) a real constraint.
- **Inferred:** $2,654 a year per grandparent is about 27 times a $99.99 lifetime gift. The money exists. The open question is whether grandparents buy app gifts, which no source answers (UR 4.4 already flags this).

## 4. Category economics

### 4.1 Tinybeans and Qeepsake (the only public numbers in the category)

| Item | FY25 (year to 30 Jun 2025) | FY26 (year to 30 Jun 2026) | Source |
|---|---|---|---|
| Total revenue (USD) | $4.82M (down 11%) | $6.49M | [F] R3-S24, R3-S26 |
| Subscription revenue | $3.32M (up 12%) | $4.82M (up 45%, includes Qeepsake from Nov 2025) | [F] R3-S24, R3-S26 |
| Advertising revenue | $1.26M (down 35%) | $0.86M (down 32%) | [F] R3-S24, R3-S26 |
| E-commerce revenue | not separated | $0.77M (up 646%) | [F] R3-S26 |
| Paid subscribers | 51,000 | 93,300 (Tinybeans 49,600; Qeepsake 43,700) | [F] R3-S24, R3-S26 |
| ARPU | $75 a year (up 40% since FY23) | not disclosed | [F] R3-S24 |
| Churn and retention | monthly churn down 33% from FY24; retention 93% | not disclosed | [F] R3-S24 |
| Adjusted EBITDA | loss of $1.44M | profit of $0.43M | [F] R3-S24, R3-S26 |
| Operating cash flow | outflow of $1.07M | inflow of $0.09M | [F] R3-S24, R3-S26 |
| Cash at year end | $1.71M | $1.64M | [F] R3-S24, R3-S26 |
| Plans | Tinybeans+ $74.99/yr; Legacy $39.99/yr; Family $119.99/yr planned for FY26 | | [F] R3-S24 |

**Qeepsake acquisition** (announced 3 Nov 2025) [F] R3-S25:
- US$2.7M, all in stock, no cash.
- Qeepsake had nearly 50,000 paid subscribers in Oct 2025.
- The combined business expected about 90,000 paid subscribers, over a million free users, and pro forma FY2025 revenue of about US$8.9M.
- No earn-out is mentioned. CR S3 noted that Dealroom reports $4M; that figure remains conflicting and **Unverified**.

Derived [A]:
- Price per Qeepsake subscriber: $2,700,000 / 50,000 = **$54**, which matches CR.
- Qeepsake's implied revenue: $8.9M pro forma minus Tinybeans' $4.82M FY25 = about **$4.1M a year**. Divided by about 50,000 subscribers, that is about **$82 per subscriber per year**.
- Price as a multiple of revenue: $2.7M / $4.1M = about **0.66 times**.
- Qeepsake subscribers fell from about 50,000 (Oct 2025) to 43,700 (Jun 2026): 43,700 / 50,000 = 0.874, a **12.6% fall in about 8 months**.
- Tinybeans' own base went from 51,000 to 49,600, down 2.7%.

**Inferred:**
1. In a public, privacy-first family memory business with about 90,000 paid families, the whole group earns $6.5M a year and only just reached positive EBITDA. A private family memory app sold for less than one year of its revenue.
2. Tinybeans' price rise (about 87% in 2024 per CR S22) raised ARPU 40% while it kept 93% retention and grew subscription revenue 12% (R3-S24). Parents with years of memories stored tend to pay rather than leave, which is the "hostage" dynamic UR flags as a trust risk.
3. Tinybeans' advertising revenue fell 35% and then 32%, so ad funding in this category keeps shrinking.

### 4.2 Others

| Company | What is public | Source |
|---|---|---|
| Remento | $3M seed led by Upfront Ventures, Sep 2022, alongside the iOS app launch; no revenue or user figures | [F] R3-S27 |
| Storyworth | No funding or revenue on any primary page I opened. PitchBook and Dealroom profiles exist but are gated. | **Unverified** |
| Day One | Acquired by Automattic on 16 Jun 2021, price not disclosed [F] R3-S28. Premium renamed Silver and a new Gold tier added on 30 Mar 2026 for AI features (Daily Chat, summaries, image generation). Existing subscribers keep their renewal price [F] R3-S29. Current prices: Basic free, Silver $49.99/yr, Gold $74.99/yr, 1-month trial [F] R3-S30. | R3-S28 to S30 |
| Shutdowns since 2020 | Lifecake closed 30 Jun 2020 (CR S19). Artifact stopped sales (CR S5). MemoryWeb (family photo organiser) ended service 17 Mar 2025 with about one month's notice, went read-only and offered desktop export while pivoting to a new app [F] R3-S31. | CR, R3-S31 |

### 4.3 Subscription benchmarks

| Benchmark | Value | Source |
|---|---|---|
| Trial-to-paid, trials of 4 days or less | 25.5% median | [F] R3-S32 (RevenueCat SOSA 2026, 19 Mar 2026, 115,000+ apps, $16B+ revenue) |
| Trial-to-paid, trials of 17 to 32 days | 42.5% median | [F] R3-S32 |
| Trial-to-paid by length, **annual plans** | 4 days or less 24%; 5 to 9 days 33%; 10 to 16 days 43%; 17 to 32 days 44.6% | [F] R3-S33 (RevenueCat, 28 Sep 2026, 17,000+ apps) |
| Trial-to-paid by length, **monthly plans** | 4 days or less 39.6%; 5 to 9 days 45.9%; 10 to 16 days 46.6%; 17 to 32 days 43.7% | [F] R3-S33 |
| First renewal after trial, monthly | 77.5% after 17 to 32 day trials; 49.5% with no trial | [F] R3-S33 |
| First renewal after trial, annual | 47.5% after 17 to 32 day trials; 26.6% with no trial; 18.3% after 4 days or less | [F] R3-S33 |
| Trials longer than 32 days | Excluded from RevenueCat's conversion figures, so **no benchmark exists for the 2-month annual trial** | [F] R3-S33 |
| Hard paywall vs freemium, conversion by day 35 | 10.7% vs 2.1% | [F] R3-S32 |
| Hard paywall vs freemium, revenue per install at day 60 | $3.09 vs $0.38 | [F] R3-S32 |
| Hard paywall vs freemium, 12-month retention | 27% vs 28% | [F] R3-S32 |
| Annual subscribers who cancel in year 1 | about 72% in 2026 (about 56% in 2025); month 1 is 35% of all annual cancellations | [F] R3-S32 |
| Trial starts on install day | 90% (Adapty 2026); 82% (RevenueCat 2025, UR S5) | [F] R3-S34; UR |
| Install to trial; trial to paid, global | 10.9%; 25.6% | [F] R3-S34 (Adapty, 5 Mar 2026, 16,000 apps, $3B) |
| Day-380 retention by plan | annual 19.9%; monthly 14.2%; weekly 5.5% | [F] R3-S34 |
| Revenue mix | weekly plans 56% of app revenue globally; annual dominates only in Health & Fitness (60.6%) | [F] R3-S34 |
| Global median prices | weekly $7.48; monthly $12.99; annual $38.42 | [F] R3-S34 |
| Refund rates | 2% to 5% of paid transactions typical; weekly 2.6%; monthly 3.0% to 3.5%; annual 4.2%; Productivity 2.5% to 3.5%; Education 4.86% to 5.1% | [F] R3-S35 (Adapty, updated 10 Feb 2026) |
| Involuntary churn (billing failures) | 14% of cancellations on the App Store vs 31% on Google Play | [F] R3-S32 |

- No benchmark source I opened breaks out a family, parenting or memory-keeping category. **Unverified.** The RevenueCat SOSA 2025 page was rate limited (section 8). Its 45.7% figure comes from UR S5, opened 1 Oct.
- **Inferred:** For Early Letters' prices, the annual 1-month trial sits in the best-converting bucket (17 to 32 days, about 44.6% trial-to-paid, 47.5% first renewal). The 2-month annual trial has no benchmark. The $29.99 annual price is below Adapty's global annual median of $38.42.

### 4.4 Apple commission and US steering (only as they touch the paywall)

- [F] Small Business Program: 15% commission while the developer and associated accounts earn $1M or less in proceeds in the prior and current calendar year. It switches to the standard rate for the rest of the year once $1M is crossed (R3-S36).
- [F] App Review Guidelines 3.1.1(a) and 3.1.3 now say US storefront apps may include buttons, external links or other calls to action to buy elsewhere, with no entitlement needed (R3-S37).
- [F] Apple currently charges no commission on US link-out purchases, under the contempt order upheld on appeal. Justice Kagan denied Apple's stay on 6 May 2026 (R3-S38). The Supreme Court agreed on 30 Jun 2026 to review the contempt findings. Meanwhile the district court is deciding what commission, if any, Apple may charge (R3-S39, 11 Aug 2026).
- **[D] B2:** Early Letters is Apple-only (StoreKit 2), with no server that sees purchases. A web checkout would need a server and a payment processor, which B2 rules out. The commission saving is real today (15% to roughly the processor's fee) but legally unsettled. At $29.99, 15% is $4.50 per year per subscriber. **Founder decision**, not a research finding.

## 5. Simple sizing [A]

Everything in this section is [A]. Sourced inputs carry their R3-S id. Every other input is an assumption of mine, labeled as one, to be replaced by TestFlight and launch data.

### 5.1 Inputs

| Input | Value | Basis |
|---|---|---|
| New families a year | 3,606,400 births | [F] R3-S2 (2025 provisional). One birth is treated as one family. Twins and second children overlap, so this slightly overstates new books. |
| iPhone share among those families | 55% | [A] Midpoint of the 50% to 60% working range in 1.3. No parent-specific source exists. |
| Reachable pool | 1,983,520 | [A] 3,606,400 x 0.55 |
| Year-1 reach (share of the pool that installs and saves at least one letter) | Low 0.25%, Base 1%, High 3% | [A] No category benchmark. Tinybeans plus Qeepsake hold about 93,300 paid families after years in market (R3-S26), which bounds the High case. |
| Share of year-1 families who pay | Low 2.1%, Base 5%, High 10% | [A] Anchored on RevenueCat day-35 install-to-paid: freemium 2.1%, hard paywall 10.7% (R3-S32). Early Letters is freemium (free core), so Base sits between the two. |
| Plan mix among payers | Annual share: Low 60%, Base 70%, High 80% | [A] Adapty: annual dominates only in Health & Fitness (60.6% of revenue) (R3-S34). The founder may default the paywall to annual. |
| Gross revenue per payer per year | annual $29.99; monthly $3.99 x 12 = $47.88 | [D] B2 prices; ignores churn inside the year |
| Apple commission | 15% | [F] R3-S36 (Small Business Program, under $1M proceeds) |

### 5.2 Year-1 results

Formulas: families = pool x reach. Payers = families x pay rate. Average revenue per payer (ARPPU) = annual share x $29.99 + (1 - annual share) x $47.88. Gross annual run-rate = payers x ARPPU. Net = gross x 0.85.

| Scenario | Families (pool x reach) | Payers | ARPPU | Gross annual run-rate | Net after 15% | Net per month |
|---|---|---|---|---|---|---|
| Low | 1,983,520 x 0.0025 = **4,959** | 4,959 x 0.021 = **104** | 0.6 x 29.99 + 0.4 x 47.88 = $37.15 | 104 x 37.15 = **$3,864** | **$3,284** | $274 |
| Base | 1,983,520 x 0.01 = **19,835** | 19,835 x 0.05 = **992** | 0.7 x 29.99 + 0.3 x 47.88 = $35.36 | 992 x 35.36 = **$35,077** | **$29,815** | $2,485 |
| High | 1,983,520 x 0.03 = **59,506** | 59,506 x 0.10 = **5,951** | 0.8 x 29.99 + 0.2 x 47.88 = $33.57 | 5,951 x 33.57 = **$199,775** | **$169,809** | $14,151 |

Reading the table:
- Even the High case (about 6,000 paying families, $0.2M gross) is about 6% of Tinybeans plus Qeepsake's paid base: 5,951 / 93,300 = 6.4% (R3-S26). The Base case is about 1%.
- Year-1 trials delay revenue. With a 2-month annual trial and a 1-month monthly trial, run-rate in the last months of year 1 is the meaningful number, not cash collected in year 1 (**Inferred**).
- Not modeled: renewals (RevenueCat: about 72% of annual subscribers cancel in year 1 across all apps, R3-S32), lifetime ($99.99 later, equal to 99.99 / 29.99 = 3.3 years of annual), print, gifts, and parents of children older than 1.
- **Ceiling check [A]:** if every one of the 1,983,520 reachable families paid $29.99, gross would be $59.5M a year. That is not a forecast. It shows the scale limit of a one-birth-cohort, iPhone-only, US-only product: in the High case, revenue is 0.3% of that ceiling.

### 5.3 Break-even on fixed costs

- Fixed monthly floor once paid tiers are needed [A]: Supabase Pro $25 + Sentry Team $26 + Resend Pro $20 + Vercel Pro $20 = **$91** (section 6).
- Net per payer per month at Base ARPPU [A]: $35.36 x 0.85 / 12 = $2.50.
- Payers needed to cover the floor [A]: $91 / $2.50 = 36.3, so **37 paying families**. Founder time and the $99 a year Apple Developer fee (ARCHITECTURE section 7, repo) are excluded.

## 6. Cost check

Re-verified against the list prices in `docs/ARCHITECTURE.md` section 7 (opened 1 Oct 2026). Note the 3 Oct status box: RevenueCat, PowerSync, server ASR and the LLM edit pass are out of v1.0, and B7 means no audio upload in v1.0.

### 6.1 Prices today against ARCHITECTURE section 7

| Vendor | ARCH section 7 (1 Oct) | Today, 3 Oct | Changed | Source |
|---|---|---|---|---|
| Supabase Pro base | $25/month | $25/month, includes $10/month compute credits (one Micro instance) | No (credit detail new to our docs) | [F] R3-S40 |
| Supabase MAU | 100k included, then $0.00325 | Same | No | [F] R3-S40 |
| Supabase database size | 8 GB, then $0.125/GB | Same | No | [F] R3-S40 |
| Supabase file storage | 100 GB, then $0.0213/GB | Same | No | [F] R3-S40 |
| Supabase egress | 250 GB, then $0.09/GB | Uncached: 250 GB, then $0.09/GB. **Cached: separate 250 GB, then $0.03/GB** | No; cached rate not in ARCH | [F] R3-S40 |
| Supabase Free | n/a | 50k MAU, 500 MB DB, 1 GB files, 5 GB egress, 2 projects, paused after 1 week inactive | n/a | [F] R3-S40 |
| PostHog free tier | 1M events/month | 1M events/month; 1-year retention free, 7 years on paid | No | [F] R3-S41 |
| PostHog overage | **Unverified** | Per event: 1M to 2M $0.00005; 2M to 15M $0.0000343; 15M to 50M $0.0000295; 50M to 100M $0.0000218; 100M to 250M $0.000015; over 250M $0.000009. "Identified events" add-on priced separately (1M to 2M $0.000198). | Now verified | [F] R3-S41 |
| Sentry | Developer $0 (5k errors, 1 user); Team $26 (50k errors) | Same; Business $80; overage from $0.0003625/error (50k to 100k) | No | [F] R3-S42 |
| Resend | not in ARCH | Free: 3,000 emails/month, 100/day, 3 domains. Pro $20: 50,000/month, then $0.90 per 1,000. Scale $90: 100,000/month | New line | [F] R3-S43 |
| Cloudflare R2 | not in ARCH | Standard storage $0.015/GB-month; Class A $4.50/M; Class B $0.36/M; **egress free**; free tier 10 GB-month, 1M Class A, 10M Class B | New line | [F] R3-S44 |
| Hugging Face (public model files) | ARCH S3 cites model files only | Public storage free on a best-effort basis for free accounts; "egress and CDN included at no extra cost"; PRO $9/month (up to 10 TB public); private storage $18/TB/month | New line | [F] R3-S45, R3-S46 |
| Vercel Pro | **Unverified**, assumed about $20 | $20/month with $20 usage credit; 100 GB Fast Data Transfer and 1M function invocations included. Hobby is personal, non-commercial only. | Now verified; matches the assumption | [F] R3-S47 |

**What changed since 1 Oct:** none of the prices ARCH recorded on 1 Oct have moved. Three Unverified lines are now verified: PostHog overage, Vercel Pro, and the fact that Hobby is non-commercial. Supabase has a separate cached egress rate ($0.03/GB) that ARCH does not list. Resend, R2 and Hugging Face are new lines that B11 and B13 need.

### 6.2 What the verified prices mean [A]

| Item | Arithmetic | Result |
|---|---|---|
| PostHog at ARCH's 100k-family volume (30M events) | $0 (1M) + 1M x $0.00005 + 13M x $0.0000343 + 15M x $0.0000295 | $50 + $445.90 + $442.50 = **$938.40/month** (ARCH had Unverified) |
| PostHog at TDD 06's 13M events | $50 + 11M x $0.0000343 | **$427.30/month** |
| PostHog at 1.3M events | 0.3M x $0.00005 | **$15/month** |
| Speech model download, 574 MB per install (TDD 06 P-9), at 220k installs | 220,000 x 0.574 GB = 126,280 GB | Supabase uncached: (126,280 - 250) x $0.09 = **$11,343**. Supabase cached: (126,280 - 250) x $0.03 = **$3,781**. R2 or Hugging Face egress: **$0**. |
| Same at 2.2k installs (1k families) | 2,200 x 0.574 = 1,263 GB | Supabase uncached: (1,263 - 250) x $0.09 = **$91**; R2: $0 |
| 11.4 TB of audio (ARCH 100k-family figure; v1.1 when audio upload returns) | Supabase: (11,400 - 100) x $0.0213. R2: (11,400 - 10) x $0.015 | Supabase **$240.69/month**; R2 **$170.85/month** |
| v1.0 run-rate at section 5 scenarios | MAU = families x 2.2 (ARCH assumption); events = families x 300 (ARCH), all opted in (upper bound) | Low: Supabase $25, PostHog 1,487,700 events = $24.39. Base: Supabase $25, PostHog 5,950,500 events = $50 + 3,950,500 x $0.0000343 = $185.50. High: MAU 130,913, so Supabase $25 + 30,913 x $0.00325 = $125.47; PostHog 17,851,800 events = $50 + $445.90 + 2,851,800 x $0.0000295 = $580.03. |
| Same with 50 events per family (ARCH's suggested cut) | Low 247,950; Base 991,750; High 2,975,300 events | Low $0; Base $0; High $50 + 975,300 x $0.0000343 = **$83.45** |

- **Inferred:** At v1.0 scale, PostHog event volume is the largest variable cost. It is a design choice (events per family), not a fixed cost. TDD 10's opt-in assumption (about 40%) would cut it further.
- **Inferred:** Model and language-pack hosting is the line where vendor choice matters most. On zero-egress hosts (R2, Hugging Face) it costs nothing. On Supabase Storage it is the largest one-time cost in the plan. This supports B13 and TDD 06 OQ-3.

## 7. What this means for the PRD [R]

1. **[R]** Size the business honestly in `01` and `03`: a one-cohort, iPhone-only, US-only app reaches about 2 million new families a year. The Base case is about 1,000 paying families and $30k net a year. The whole public category leader earns $6.5M (R3-S26). Write success measures in families and letters, not revenue, for v1.0.
2. **[R]** Keep the paywall freemium (free core is a trust promise). Expect freemium conversion (2.1% day-35 benchmark, R3-S32), not hard-paywall conversion. Instrument the conversion point; F14 needs the opt-in-free App Store Connect numbers because B2 removes server purchase data.
3. **[R]** Flag the 2-month annual trial as unbenchmarked (R3-S33 excludes trials over 32 days). Ship it as the founder decided, but set a review gate at the first 200 annual trials.
4. **[R]** Language roadmap in F05 and F30: the largest gaps are Tagalog, Vietnamese, Korean and Haitian (5.7M speakers together, more than Arabic, French, Portuguese and Hindi combined). Note that Chinese means Mandarin only, and that Urdu and other Indic languages are larger than Hindi.
5. **[R]** Host speech models and packs on R2 or Hugging Face, never Supabase Storage (126 TB at 220k installs is $3.8k to $11.3k on Supabase, $0 on R2).
6. **[R]** Cap analytics at about 50 events per family in F18. At that level PostHog stays free through the Base case.
7. **[R]** P5 (grandparents) is a gift buyer worth designing for in v1.1: 65 million grandparents spend $2,654 a year each. But about a quarter of births are to mothers born abroad, so plan for grandparents outside the US App Store.
8. **[R]** Record the US link-out rule (Apple charges no commission today, under appeal) as context only. B2 stands until the founder reopens it.

## 8. Gaps

- Rate limited by the fetch proxy (HTTP 429) and not retried, as the proxy instructed: `api.census.gov/data/2024/acs/acs1/groups/B16001.json` (variable labels); `censusreporter.org/tables/B16001/`; the Census 2016 Language User Note PDF; Pew's short read "About 9% of U.S. births in 2023 were to unauthorized or temporary legal immigrant mothers" (31 Mar 2026); the RevenueCat State of Subscription Apps 2025 page.
- Refused by robots.txt: Census `www2.census.gov` Excel tables (single year of age; age groups), so the under-1 count is inferred from births; Census Reporter API.
- The Census Data API refuses requests without a key, and data.census.gov table pages need JavaScript. The data.census.gov JSON access URL worked and is the basis of section 2. The code-to-language mapping is checked against group totals and two third-party summaries but not against the official label file.
- NVSR 75-2 Table 3 (exact first-birth count) did not come through in the PDF text. The 39.6% share is derived from rates.
- **Unverified / not found:**
  - iPhone share among parents or by age
  - languages spoken in households with a child under 5
  - Mandarin-only and Cantonese-only counts
  - share of grandparents living far from grandchildren (2025 survey)
  - grandparents living abroad
  - Storyworth revenue or funding
  - Day One's price before March 2026
  - a family or memory category in any subscription benchmark
  - conversion for trials over 32 days
  - Qeepsake's exact revenue (derived from the pro forma figure)
- The Tinybeans FY26 annual report was read from a Webull mirror of the ASX announcement, not asx.com.au.

## 9. Sources (all opened 3 Oct 2026)

| ID | Source | URL |
|---|---|---|
| R3-S1 | CDC NCHS, Births: Final Data for 2024, NVSR vol 75 no 2 (9 Jun 2026) | https://www.cdc.gov/nchs/data/nvsr/nvsr75/nvsr75-02.pdf |
| R3-S2 | CDC NCHS, Births: Provisional Data for 2025, VSRR no 43 (Apr 2026) | https://www.cdc.gov/nchs/data/vsrr/vsrr043.pdf |
| R3-S3 | CDC NCHS, Births in the United States, 2024, Data Brief 535 (Jul 2025) | https://cdc.gov/nchs/products/databriefs/db535.htm |
| R3-S4 | Census QuickFacts, United States (V2025 estimate; ACS 2020 to 2024) | https://www.census.gov/quickfacts/fact/table/US/PST045225 |
| R3-S5 | Census press kit, Vintage 2025 estimates by age, sex, race and Hispanic origin (released 25 Jun 2026) | https://www.census.gov/newsroom/press-kits/2026/vintage-2025-pop-estimates.html |
| R3-S6 | Social Explorer, under-5 population trends (ACS) | https://home.socialexplorer.com/post/where-the-littlest-alphas-live-analyzing-the-under-5-year-old-population-trends |
| R3-S7 | BLS, Employment Characteristics of Families 2025, Table 4 | https://www.bls.gov/news.release/famee.t04.htm |
| R3-S8 | BLS, Employment Characteristics of Families 2025, release text (23 Apr 2026) | https://www.bls.gov/news.release/famee.nr0.htm |
| R3-S9 | BLS, Foreign-born workers 2025, Table 2 | https://www.bls.gov/news.release/forbrn.t02.htm |
| R3-S10 | Pew Research Center, Mobile fact sheet (survey to 18 Jun 2025) | https://www.pewresearch.org/internet/fact-sheet/mobile/ |
| R3-S11 | StatCounter, mobile OS share, United States, Sep 2026 | https://gs.statcounter.com/os-market-share/mobile/united-states-of-america |
| R3-S12 | TechSpot on Counterpoint, Apple US share Q4 2025 (3 Feb 2026) | https://www.techspot.com/news/111176-apple-hits-record-us-smartphone-market-share-widening.html |
| R3-S13 | GSMArena on CIRP, iPhone activations (Apr 2024) | https://m.gsmarena.com/cirp_iphone_activations_in_the_us_fall_to_33_of_all_smartphones-news-62600.php |
| R3-S14 | Census, ACS 2024 1-year table B16001 (data.census.gov JSON) | https://data.census.gov/api/access/data/table?id=ACSDT1Y2024.B16001&g=010XX00US |
| R3-S15 | Census, ACS 2024 1-year table C16001 (data.census.gov JSON) | https://data.census.gov/api/access/data/table?id=ACSDT1Y2024.C16001&g=010XX00US |
| R3-S16 | Voronoi, top 10 languages at home 1980 to 2024 (ACS) | https://www.voronoiapp.com/other/Top-10-Languages-Spoken-at-Home-in-the-US-Besides-English-1980-2024-8987 |
| R3-S17 | Statista chart, most spoken languages at home in the US (18 Feb 2026, ACS 2024) | https://www.statista.com/chart/amp/35858/most-spoken-languages-at-home-us |
| R3-S18 | USAFacts, languages other than English at home (2024) | https://usafacts.org/answers/how-many-people-speak-a-language-other-than-english-at-home/country/united-states/ |
| R3-S19 | Census Reporter, United States profile (ACS 2024 1-year) | https://censusreporter.org/profiles/01000US-united-states/ |
| R3-S20 | Census, Families and Living Arrangements release (2 Dec 2025) | https://www.census.gov/newsroom/press-releases/2025/families-and-living-arrangements.html |
| R3-S21 | Census, Older adults outnumber children in 11 states (V2024, 26 Jun 2025) | https://www.census.gov/newsroom/press-releases/2025/older-adults-outnumber-children.html |
| R3-S22 | AARP Research, Powering Families: The Essential Role of Grandparents (survey Nov to Dec 2025, n=3,283; published 16 Jun 2026) | https://www.aarp.org/pri/topics/social-leisure/relationships/the-essential-role-of-grandparents/ |
| R3-S23 | AARP data story, Connections and Relationships chapter of the same study | https://datastories.aarp.org/social-leisure/relationships/the-essential-role-of-grandparents/connections-and-relationships/ |
| R3-S24 | Tinybeans Group, FY25 Annual Results, ASX announcement (21 Aug 2025) | https://announcements.asx.com.au/asxpdf/20250821/pdf/06n4m9jjp1zr87.pdf |
| R3-S25 | MarketScreener, Tinybeans acquires Qeepsake (3 Nov 2025) | https://www.marketscreener.com/news/tinybeans-acquires-qeepsake-creating-the-leading-privacy-first-family-memory-platform-ce7d5cded88aff2c |
| R3-S26 | Tinybeans Group, Annual Report FY26 (lodged 27 Aug 2026; Webull mirror of the ASX announcement) | https://bulletin.webull.com/qbd/announcement/20260827/499501177/43b5e48cb52d28243813000f241a2281.pdf |
| R3-S27 | TechCrunch, Remento raises $3M and debuts its iOS app (7 Sep 2022) | https://techcrunch.com/?p=2380231 |
| R3-S28 | WP Tavern, Automattic acquires Day One (16 Jun 2021) | https://wptavern.com/automattic-acquires-day-one-journaling-app |
| R3-S29 | Day One blog, Introducing Day One Silver and Gold (30 Mar 2026) | https://dayoneapp.com/blog/introducing-day-one-silver-and-gold/ |
| R3-S30 | Day One plans | https://dayoneapp.com/plans/ |
| R3-S31 | The Dead Pixels Society, MemoryWeb will end service 17 Mar 2025 (16 Feb 2025) | https://thedeadpixelssociety.com/memoryweb-photo-organizing-app-will-end-service-march-17-2025/ |
| R3-S32 | RevenueCat, State of Subscription Apps 2026 summary (19 Mar 2026) | https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026 |
| R3-S33 | RevenueCat, How long should your free trial be (28 Sep 2026) | https://www.revenuecat.com/blog/growth/free-trial-length |
| R3-S34 | Adapty, State of In-App Subscriptions 2026 (5 Mar 2026) | https://adapty.io/state-of-in-app-subscriptions/ |
| R3-S35 | Adapty, Refund rate benchmarks (updated 10 Feb 2026) | https://adapty.io/blog/refund-rate-metrics-and-benchmarking/ |
| R3-S36 | Apple, App Store Small Business Program | https://developer.apple.com/app-store/small-business-program/ |
| R3-S37 | Apple, App Review Guidelines 3.1.1(a) and 3.1.3 | https://developer.apple.com/app-store/review/guidelines/ |
| R3-S38 | The Next Web, Supreme Court denies Apple stay in Epic contempt case (6 May 2026) | https://thenextweb.com/news/supreme-court-apple-epic-contempt-stay-denial |
| R3-S39 | Courthouse News, Apple's fight over commissions for linked-out purchases continues (11 Aug 2026) | https://courthousenews.com/apples-fight-over-commissions-for-linked-out-app-store-purchases-continues-in-federal-court/ |
| R3-S40 | Supabase pricing | https://supabase.com/pricing |
| R3-S41 | PostHog pricing (and pricing.md for per-event bands) | https://posthog.com/pricing ; https://posthog.com/pricing.md |
| R3-S42 | Sentry pricing | https://sentry.io/pricing/ |
| R3-S43 | Resend pricing | https://resend.com/pricing |
| R3-S44 | Cloudflare R2 pricing | https://developers.cloudflare.com/r2/pricing/ |
| R3-S45 | Hugging Face pricing | https://huggingface.co/pricing |
| R3-S46 | Hugging Face Hub storage limits | https://huggingface.co/docs/hub/storage-limits |
| R3-S47 | Vercel pricing | https://vercel.com/pricing |
