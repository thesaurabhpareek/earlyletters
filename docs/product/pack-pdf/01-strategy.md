# Part I. Why Early Letters exists

## 1. Mission and vision

**Mission.** Help parents keep, in their own words and their own voice, the small true things about their child's early years, so the child can read and hear them for years.

**Vision.** Every child grows up with a book of letters from the people who loved them first: never rewritten, never lost, never held hostage, and organised by the child's age so it reads like a life.

**What we say in public** (founder decision D-139, 1 Nov 2026): *letters to your child, in your own words and voice.*

**The promise inside the product** (`docs/prd/v2/03-goals-and-principles.md` section 1): Early Letters is the baby memory book you fill by talking. The words stay yours: every small fix is shown and can be undone, the recording is kept as you made it, and each letter is filed by your child's age. Four things must stay true at all times: **your words with every fix in view; kept; private; yours always.**

**The rule above every feature** (`CLAUDE.md`, the constitution): *the machine may remove and repair. It may never add meaning.* No feature writes, rewrites, summarises, translates or shapes a person's words. Transcription is cleaned only by a fixed list of edit types, each one checked by a verifier, every one stored and reversible, and the raw transcript can never be changed (a database trigger enforces it).

### Why this matters now
Three forces make this the right product at this moment:
1. **Speech on the phone is finally good enough.** Apple's on-device speech models let a parent speak a letter in the dark with no upload and no per-minute cost. That turns a tiring writing task into a two-minute habit.
2. **The category has broken trust.** Baby-journal leaders have raised prices, shrunk free tiers and locked past memories behind payment; new AI journals rewrite what parents say. Parents are angry about both (section 3).
3. **Voice is the most emotional keepsake and the least served.** In the category's reviews, hearing a parent's voice through a book's QR code is the praise that makes people cry, yet the baby-journal leaders do not keep voice at all.

## 2. What we have today (19 Nov 2026)

Early Letters is an iOS app (Expo and React Native), with Supabase for accounts and sync, on-device speech, and a Vercel website. It is built by AI agents and parallel Claude sessions under one founder, on a public repository with every decision recorded.

**Built and on the integration branch (`develop`):** the 21 v1.0 features of PRD V2 (F01 to F21). In the parent's terms:

| Area | What a parent can do today |
|---|---|
| Entry and account | Confirm they are 18 or over; sign in with Apple or email (D-160: sign-in required in the first store build) |
| First run | Add a child by birth or due date (name optional), their signature, the family's languages, names to spell right |
| Capture | Speak or type a letter from Home; see their words on Review with every machine fix listed and undoable; keep it or let it go |
| The book | Letters filed by month of the child's age, with a Before You chapter for pregnancy; Read together, page by page, with playback in the parent's voice |
| Recordings | The original recording kept on the phone, a listening copy for playback |
| Family | Several children, each with their own book; Quiet this book and Hide this book for hard days; co-parent sharing built and running in test builds only (D-162 as drafted) |
| Plus | Two free kept letters, then Plus at $4.99 a month or $49.99 a year (D-082); reading, playback and export never locked |
| Keeping | Sync of words across phones; Take the book with you (export of words and recordings); recording backup built but off in store builds |
| Prompts | 111 written prompts by the child's age; reminders at the parent's chosen hour |
| Trust | Privacy controls, consent records, in-app account deletion, help and support |

**The first store release (Build 12)** has sign-in and sync on, the Free plan for production (D-159), recording backup off, English only, and analytics off for the whole 1.0 line (D-124). It is released automatically when App Review approves it (D-158). What remains before submission is the founder's: Apple agreements and keys, production secrets, counsel's read of the Privacy Policy and Terms, App Store Connect entries, and the device pass (`infra/store-release-founder-steps-2026-11-19.md`).

**What we do not have yet:** evidence from our own families. No parent outside the founder's family has used the app, and analytics is off. Every number about parent behaviour in this document is a judgment, an industry figure, or a target, and is labelled so.

## 3. The customer and the need

### Who it is for

| Persona | Who | The moment |
|---|---|---|
| P1 | The evening parent, the main user | After the baby is down, or a feed with one hand free, often in the dark, a few minutes at most |
| P2 | The other parent | On their own rhythm; wants their own voice in the same book |
| P3 | The expecting parent | Letters before birth; must never be reminded of a due date |
| P4 | The family with more than one language | Wants letters kept in the language they were spoken, never translated |
| P5 | Close family (later) | Grandparents who want to hear and, later, to add |
| P6 | The child, years from now | Reads and hears the book; the real customer of the promise |

Not for: anyone under 18, anyone who wants the app to write for them, a public or social feed, a photo album first.

### The need, from research
From `docs/research/USER_RESEARCH.md` (sources opened 1 Oct 2026) and `COMPETITIVE_RESEARCH.md`:
- **The problem is real and comes with guilt.** Unfilled baby books feel like a quiet failure; the pattern is a burst of effort in the first weeks, then nothing for months. Second children get far less.
- **The real competitor is the camera roll.** Parents rebuild dates from photo timestamps and texts, keep notes files, and some set up an email address for the child to hand over at 18. That is almost exactly our job.
- **Prompts work when they fit the child's age and take seconds.** Repetitive or ill-fitting prompts feel like homework.
- **Locked memories and surprise billing are what make parents angry.** In one sample of Tinybeans one- and two-star reviews, 74 of 124 mention price, subscription or paywall, including content that used to be free and is now locked.
- **Hearing a parent's voice is the strongest emotion in the category.**

### Jobs to be done, ranked (`docs/prd/v2/02-customers.md` section 4)

| Rank | Job, in the parent's words | Importance | Evidence |
|---|---|---|---|
| 1 | Never lose what I made | High | High |
| 2 | Let me capture it in the few minutes I have | High | High |
| 3 | Leave my words and voice for my child's future | High | Medium |
| 4 | Keep my child's memories private | High (design floor) | Medium |
| 5 | Tell me what to write about, without nagging | Medium | High |
| 6 | Let family see the baby grow | Medium | High for photos, Medium for letters |
| 7 | Give me a finished book I can hold | Medium | Medium |
| 8 | Keep our languages in the family | Medium | Medium |
| 9 | Let me give it as a gift | Low at v1.0 | Medium, later |

### What a parent must never meet
A lost letter or recording. A word they did not say. A charge they did not expect, or a past letter locked behind payment. A count of what they missed, a streak or a guilt line. Their child's name or words on a lock screen without their choice. A notification about a due date. Their language translated or changed without asking.

## 4. Industry and market

Figures below are from `docs/prd/v2/research/R3-market.md` (sources read October 2026) and `docs/prd/v2/04-market.md`. Each is a recorded reading, not re-verified for this document.

**Size of the pool (US).** About 3.6 million births in 2025 (provisional), about 40% first births. About 18.5 million children under 5. At an assumed 55% iPhone share, about 2.0 million new families a year are reachable on iPhone. iPhone share among parents specifically is not known.

**Languages.** The six non-English launch languages are spoken at home by about 53.5 million people in the US; Spanish alone is about 44.9 million. About a quarter of 2024 births were to mothers born outside the US.

**Grandparents.** About 65 million US grandparents; most say digital tools are a primary way to stay in touch, and they spend heavily on grandchildren.

**Category economics: why we must be cheap to run.** Tinybeans and Qeepsake together earned about $6.49 million in FY26 from about 93,300 paid families, and were profitable only because of a one-off tax refund. Qeepsake sold in November 2025 for a headline $2.7 million, about $24 to $54 per subscriber. Tinybeans' advertising revenue fell by about a third two years running. The lesson: memory-keeping is a small-ticket, low-margin category. Our costs per family must stay near zero, which is why speech runs on the phone, production is on a free plan, and no tracking or advertising SDK is in the app.

**Conversion benchmarks.** Trials of 17 to 32 days convert best (around 44% to paid); freemium converts about 2% by day 35 and hard paywalls about 11%. A base-case first year is about 19,800 families and about 990 payers (an assumption in R3, not a forecast we stand behind without our own data).

## 5. Benchmarking

### The landscape in five groups (`04-market.md` section 1)

| Group | Products | How they earn | What they own | Where they are weak for us |
|---|---|---|---|---|
| Prompted baby journals | Qeepsake, BabyPage, Sproutbook | Subscription plus print | Prompts, yearly books | Typing; repetitive prompts; co-parent on paid tier; no voice |
| Private family photo albums | Tinybeans, 23snaps, FamilyAlbum, Notabli | Freemium, rising prices | Privacy, grandparents seeing the baby | Photos not words; price anger |
| Voice life-story gifts | Storyworth, Remento, StoryCorps | One-year gift bundles with a book | Voice, elders recording, book with QR to audio | One storyteller, one year; rewrite modes |
| AI and voice baby journals | FirstChapter, Tiny Treasures, From Mama, Dujour | Subscriptions, some lifetime | Voice in the subtitle, family contributors | Rewriting; no visible record of machine changes |
| General journals | Day One, Apple Journal, Dearest | Freemium or free | Polish, encryption, shared journals | Not built around a child's age |

### Prices we sit among
Early Letters Plus: **$4.99 a month, $49.99 a year** (D-082). Monthly sits at the category floor; annual equals the median of 18 apps (Dearest Plus, From Mama, Day One Silver, Notabli and Moment Garden are also $49.99 a year). Tiny Treasures ($29.99) and FirstChapter ($39.99) are cheaper; Tinybeans+ ($74.99) is dearer.

### What competitors ship that we do not, ranked by evidence (`R6-benchmark-delta-2026-10-28.md` section 5)

| Rank | Feature | Evidence it works | Our answer |
|---|---|---|---|
| 1 | Printed books, with audio links | Strongest: Remento 4.8 across about 1,750 reviews | NS-07 print-ready file, then NS-30 |
| 2 | Family engagement loop | Strong for photo apps, thin for voice | NS-03 pilot, NS-05 share one letter, NS-25 |
| 3 | Capture by relatives without the app | Moderate | Parked behind X2 |
| 4 | Sealed or scheduled letters | Weak, all new apps | NS-06 Part B |
| 5 | Capture surfaces (watch, widgets) | Watch proven for Day One | Parked (section 12) |
| 6 | Import existing audio | None beyond listings | Not planned |
| 7 | Search to the audio moment | None beyond listings | NS-02 Find (words only, no speaker labels) |
| 8 | Legacy contact and app lock | None beyond listings | App lock deferred |

### Complaints and praise across the category (`COMPETITIVE_RESEARCH.md` section 4)
Top complaints: paywalls on past memories; price rises and shrinking free tiers; print quality and cost; lost entries and crashes; notification and marketing spam; repetitive prompts; names transcribed wrong; AI editing content down; momentum dropping into homework. Top praise: prompts that make capture effortless; details that would otherwise be lost; a yearly printed book as a ritual; hearing a parent's voice; older adults able to use it; private sharing; ownership and no ads.

## 6. Where we win, and how we position

| White space | Why it is open | What makes it true for us |
|---|---|---|
| Every machine change shown and undoable | Competitors rewrite, or offer verbatim as a side mode; none shows what the machine changed | Typed edits checked by the verifier, raw transcript immutable, visible change list with undo |
| Voice as the keepsake | Baby-journal leaders ignore voice | Original kept, listening copy, Read together in the parent's voice |
| Both parents in one book | Competitors gate co-parents behind payment | Built; ships to the store when its gates clear (NS-25) |
| The family's languages | No competitor asks which languages a family speaks | Per-author languages, each shipped only when it passes its quality gate |
| Organised by month of age | Competitors organise by date or prompt | Month chapters, Before You |
| Never held hostage | Locked past memories anger parents | Reading, playback and export never locked; a shutdown pledge |
| No tracking | Most leaders declare "Data Used to Track You" | No tracking SDKs; analytics off in the 1.0 line |

**Threats.** Apple adding child-centred features to Journal or Voice Memos (our moat is the constitution with a visible change list, two authors and the book by age); a funded entrant copying "never rewritten" (make the proof visible); price pressure from $29.99 apps (no willingness-to-pay data yet; the price review decides).
