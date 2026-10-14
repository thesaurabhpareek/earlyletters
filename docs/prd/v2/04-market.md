# 04. Market and positioning

Status: Draft V2, 3 Oct 2026. Revised 13 Oct 2026 for the membership and the 4 Oct prices (M1 to M4), and again after critique round 1 (R6 rows 16 to 20, 22, 26, 27; R1 PL-09, PL-12, PL-24, PL-25, PL-28, PL-33) and M16, M17. Per-feature competitor detail lives in each feature spec (section 5) and in `research/R1-competitors-by-feature.md`. This file is the summary a founder reads once. How families find us is `03-goals-and-principles.md` section 4.5.

## 1. The landscape in five groups

| Group | Products | How they make money | What they own | Where they are weak for us |
|---|---|---|---|---|
| Prompted baby journals | Qeepsake (Tinybeans), BabyPage, Sproutbook | Subscription ($45 to $96 a year) plus print | Prompts that make capture easy; yearly books | Typing; repetitive prompts; co-parent on paid tier; no voice [F] CR sections 1 to 3 |
| Private family photo albums | Tinybeans, 23snaps, FamilyAlbum, Notabli | Freemium, raised prices, shrinking free tiers | Privacy and grandparents seeing the baby | Photos, not words; price anger [F] CR section 3; [S] R2 section 0 item 7 |
| Voice life-story gifts | Storyworth, Remento, StoryCorps | One-year gift bundles with a book ($69 to $199) | Voice, elders recording, printed book with QR to audio | One storyteller, one year; rewrite modes [F] CR section 1 |
| AI and voice baby journals (new) | FirstChapter, Tiny Treasures, From, Mama, Dujour Baby | Subscriptions $29.99 to $49.99 a year, lifetime at $99 for one | Voice in store subtitles; family contributors (From, Mama) | Rewriting (FirstChapter, Dujour); no visible record of machine changes [F] R1 section 0 items 1, 2 |
| General journals | Day One, Apple Journal, Dearest | Freemium (Day One, Dearest), free (Apple) | Polish, encryption, shared journals (Day One up to 30 members) | Not built around a child's age; no language setting; Dearest single-author and iCloud-only [F] R1 section 0 items 4, 8 |

## 2. Prices we sit among

Our prices have one source: D-082 (M3), carried in `packages/content/src/pricing.ts` and `features/F14-plus.md` section 1.

| Product | Annual | Monthly | Lifetime | Source |
|---|---|---|---|---|
| Early Letters Plus | $49.99 (2-month free trial) | $4.99 (1-month free trial) | None at v1.0 (F43 later, price not set) | [D] D-082 (M3) |
| Tiny Treasures | $29.99 | $4.99 | $99 | [F] R1 section 0 item 1 |
| FirstChapter | $39.99 | $6.99 | none found | [F] R1 section 0 item 7 (R1-S4) |
| Qeepsake Essential | $47.88 | $4.99 | none | [F] CR section 1 |
| Dearest Plus | $49.99 | $4.99 | none | [F] R1 section 0 item 7 |
| From, Mama | $49.99 | $5.99 | none found | [F] R1 section 0 item 1 |
| Day One Silver | $49.99 | $8.99 | none | [F] CR section 1 |
| Notabli Plus | $49.99 | $4.99 | none | [F] `docs/research/competitors/us.md` section 8.1 |
| Moment Garden Star | $49.99 | $4.99 | none | [F] `docs/research/competitors/us.md` section 8.1 |
| Tinybeans+ | $74.99 | $7.99 | none | [F] CR section 1, R3 section 4.1 |

Monthly $4.99 matches the category floor (seven of 20 apps), below the $6.24 median; annual $49.99 equals the median of 18 apps and sits $20 above Tiny Treasures and Bloom at $29.99 [F] `docs/research/competitors/us.md` section 0 item 8, section 8.2. The annual plan costs about ten months of monthly (17% off 12 x $4.99) [F] arithmetic. A 1-month trial on a monthly plan sits in the 17 to 32 day bucket (43.7% trial-to-paid on monthly plans); nothing published covers trials over 32 days, so the 2-month annual trial has no benchmark [F] R3 section 4.3 (R3-S33). What is free also changed: your first 2 letters with words you have seen, not writing (M1, M17). Dearest, at the same price, keeps a free tier [F] `us.md` section 3; Qeepsake is moving to paid-only [S] `us.md` section 3.

We have no willingness-to-pay evidence of our own. Starting at the median is reversible downward; `features/F14-plus.md` section 6.9 says what the price review at the 200th annual trial (T40) looks at and which price it moves to if it fails, and Study 3 carries two pricing questions (02 section 7) (R1 PL-28).

## 3. Category economics (why the product must be cheap to run)
- Tinybeans plus Qeepsake: $6.49M revenue in FY26 from 93,300 paid families. Adjusted EBITDA was $0.43M, but only because of a one-off $0.59M R&D tax refund; without it the year was a loss [F] R3 section 4.1 (R3-S26).
- Qeepsake sold in November 2025 for a headline $2.7M: $1.2M in shares plus up to $1.5M in performance rights that vest only on EBITDA, subscriber and revenue targets, recorded at $2.075M [F] R3 section 4.1 (R3-S26 note 4). That is $24 to $54 per subscriber [A, arithmetic]. Its paid base fell about 12.6% in the eight months after [A] R3 section 4.1.
- Tinybeans' ARPU rose 40% since FY23, a period that includes its 2024 price rise, and retention was 93% [F] R3 section 4.1; that the price rise caused the ARPU gain is [A]. Families with years of memories may pay rather than leave. We choose not to use that lever (03 principle 6).
- Tinybeans' advertising revenue fell 35% and then 32% in two years [F] R3 section 4.1. We carry no ads (B9, LEGAL-REQ-016).

## 4. Where we win, and the proof each claim needs

| White space | Why it is open | What makes it true in our product | Risk to the claim |
|---|---|---|---|
| **Every machine change shown, and undoable** | Competitors rewrite or offer verbatim as a side mode (Remento offers a cleaned transcript beside its rewrites); Apple Journal and Voice Memos transcribe without rewriting but show no change list [F] R1 section 0 item 2, CR section 1. No product R1 opened shows what the machine changed [S] | Typed edits verified by `verifyEdits`, raw transcript immutable, visible change list with undo (F06) | The claim is the change list, not "untouched words": Apple's apps also leave words alone. English still has open engine defects (09 R-01: D4, D6, D7, D9, D10, D13, D14, D15) that must close before launch (R1 PL-25) |
| **Voice as the keepsake** | Baby-journal leaders ignore voice [F] CR section 5 | Original kept, listening copy, Read together (F08, F10); the owner's recordings backed up, encrypted, with a recovery key we hold under logged access (M16) | Tiny Treasures and FirstChapter use voice in their subtitles [F] R1 section 0 item 1; family listening is v1.1, so a co-parent cannot hear the other's voice in v1.0 (DR-07) |
| **Both parents in one book** | Qeepsake gates contributors; every competitor that gates co-parents is criticised [F] CR section 2 | Co-parent sharing in v1.0 (M14, F11). Inside one Apple Family the payer's Plus covers both parents through Family Sharing (D-080). Outside it, the co-parent's own first 2 letters are free and the other parent's letters never count against them (M17); after that they need Plus of their own | "One membership covers the family" is true only inside one Apple Family; listings and copy must say so or not say it (R1 PL-09). Tiny Treasures' one plan covers the family [F] R1-S67; From, Mama has family contributors [F] R1 section 0 item 1 (R-05). Co-parent demand evidence is thin (1 of 287 reviews, 02 P2) |
| **The family's languages** | No competitor asks which languages a family speaks [F] R1 section 0 item 4 | Per-author languages, per-language packs and gates (F03, F05, F07) | Hindi conditional and Arabic not realistic on device at v1.0 [S, F] R5 section 0 items 2, 3 (DR-01). Prompts are English only at v1.0 (F13). Lead with what passes (section 5) |
| **Organised by month of age** | Competitors organise by date, feed or prompt [A] CR section 5 item 7 | Month chapters, Before You, backdating free (F09) | Easy to copy |
| **Never held hostage** | Paywalls on past memories and price rises anger users [S] R2 section 0 item 3; Qeepsake is moving to paid-only and deactivating inactive free accounts [S] `us.md` section 3 | Every letter you write stays yours to read, play and export, with or without Plus; a letter waiting at the Keep gate is kept as safely as a kept one (F14-REQ-039); 90-day shutdown pledge (M1; F14, F15) | Day One and Dearest are also reasonable after lapse [F] R1 section 0 item 6, `us.md` section 3. Writing past 2 letters is paid, so the claim is about what you made, not what you will make |
| **No tracking** | Most leaders declare "Data Used to Track You" [F] R1 section 0 item 9 | No tracking SDKs, opt-in analytics, content never in analytics (F17, F18, F21) | With accounts in v1.0 the label cannot say "Data Not Collected" (D-088 is superseded by M14). Expected label: no tracking; contact info, user content and audio from backup linked to the account for app functionality only [A] until counsel finalises label 1.4.0 (T30). Dearest, which lists only data not linked to the user, is ahead on the label [F] R1 section 0 item 9 (R1 PL-24) |

## 5. Positioning
For parents of young children, Early Letters is the baby memory book you fill by talking. Unlike baby books that make you type and journals that rewrite you, it keeps every letter in your own words and your own voice, shows you every change the machine made, and files it by your child's age, so your child can read and hear it for years. (`packages/content/BRAND.md`, adjusted.)

- **Languages.** Lead with the languages that pass their gate at T18; English and Spanish are the likeliest [A] (R5 section 0 item 1; 44.9 million US Spanish speakers, R3 section 2.1). Do not put "your family's languages" in the subtitle until at least three languages pass; add the others by pack update as each passes (R1 PL-12). Keep the pipeline for seven.
- **Subtitle.** It must not be generic: FirstChapter uses "Voice Memory Book" and Tiny Treasures "Baby memory book you can hear" (R1-S4, R1-S67). The distinct claims are "exactly as you said it", "in your own voice" and "see every change". F21 owns the listing.
- **Read together** stays out of the first three screenshots unless C1 shows use (05 rank 21).

## 6. Threats to watch

| Threat | Signal | Response |
|---|---|---|
| Apple Journal or Voice Memos add child-centred features | Apple Journal is free with audio transcription [F] CR section 1 | Our moat is the constitution with a visible change list, two authors and the book by age. Apple Intelligence excludes Hindi and Arabic in iOS 27, and SpeechAnalyzer support for them is unconfirmed [F, S] R1 section 0 item 3 |
| A funded entrant copies "never rewritten" | Low cost to claim, high cost to prove | Make the proof visible: change list, raw transcript in export, engine version on each letter |
| Tinybeans adds voice to Qeepsake | Owns the paid base | The change list; both parents in one book |
| Price pressure | Tiny Treasures at $29.99 a year [F] R1 section 0 item 1 | Monthly is at the floor and annual at the median (M3). No willingness-to-pay evidence yet: the T40 price review and Study 3 decide (F14 section 6.9) |
| Platform policy shifts (age laws, auto-renewal) | Texas SB 2420 in force; California ARL amended; California AB 1043 in force before our launch (T32) [F] R4 section 0 items 5, 7 | DR-02, DR-10; the AB 1043 age-signal work is v1.0 (`08-delivery.md` T27) |

## 7. What this means for the PRD
1. The change list is our proof, and faithfulness is a launch gate in every language we ship (F05, F06).
2. Reliability and privacy are table stakes; they get numbers and gates, not adjectives (06-nfr.md).
3. Family is a competitive gap at v1.0 (co-parent only), but the evidence for it is thin; Study 3 runs in C1. v1.1 should lead with grandparents and shared voice (05-feature-map.md section 3).
4. The language set is gated by quality, and the next languages are chosen by size and feasibility: Tagalog (1.9M), Vietnamese (1.6M) and Korean (1.2M) are each larger than Hindi (1.06M) in the US; Haitian (1.04M) and Russian (1.02M) are just smaller [F] R3 section 2.2.
