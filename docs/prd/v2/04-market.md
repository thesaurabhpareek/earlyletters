# 04. Market and positioning

Status: Draft V2, 3 Oct 2026. Revised 13 Oct 2026 for the membership and the 4 Oct prices (M1 to M4): price table, white space, threats. Per-feature competitor detail lives in each feature spec (section 5) and in `research/R1-competitors-by-feature.md`. This file is the summary a founder reads once.

## 1. The landscape in five groups

| Group | Products | How they make money | What they own | Where they are weak for us |
|---|---|---|---|---|
| Prompted baby journals | Qeepsake (Tinybeans), BabyPage, Sproutbook | Subscription ($45 to $96 a year) plus print | Prompts that make capture easy; yearly books | Typing; repetitive prompts; co-parent on paid tier; no voice [F] CR sections 1 to 3 |
| Private family photo albums | Tinybeans, 23snaps, FamilyAlbum, Notabli | Freemium, raised prices, shrinking free tiers | Privacy and grandparents seeing the baby | Photos, not words; price anger [F] CR section 3; [S] R2 section 0 item 7 |
| Voice life-story gifts | Storyworth, Remento, StoryCorps | One-year gift bundles with a book ($69 to $199) | Voice, elders recording, printed book with QR to audio | One storyteller, one year; rewrite modes [F] CR section 1 |
| AI and voice baby journals (new) | FirstChapter, Tiny Treasures, From, Mama, Dujour Baby | Subscriptions $29.99 to $49.99 a year, lifetime at $99 for one | "Voice memory book" in store subtitles; family contributors (From, Mama) | Rewriting (FirstChapter, Dujour); no visible record of machine changes [F] R1 section 0 items 1, 2 |
| General journals | Day One, Apple Journal, Dearest | Freemium (Day One, Dearest), free (Apple) | Polish, encryption, shared journals (Day One up to 30 members) | Not built around a child's age; no language setting; Dearest single-author and iCloud-only [F] R1 section 0 items 4, 8 |

## 2. Prices we sit among

| Product | Annual | Monthly | Lifetime | Source |
|---|---|---|---|---|
| Early Letters Plus | $49.99 (2-month free trial) | $4.99 (1-month free trial) | about $99.99 later | [D] D-082 (M3) |
| Tiny Treasures | $29.99 | $4.99 | $99 | [F] R1 section 0 item 1 |
| FirstChapter | $39.99 | Unverified in this file | none found | [F] R1 section 0 item 7 |
| Qeepsake Essential | $47.88 | $4.99 | none | [F] CR section 1 |
| Dearest Plus | $49.99 | $4.99 | none | [F] R1 section 0 item 7 |
| From, Mama | $49.99 | $5.99 | none found | [F] R1 section 0 item 1 |
| Day One Silver | $49.99 | $8.99 | none | [F] CR section 1 |
| Notabli Plus | $49.99 | $4.99 | none | [F] `docs/research/competitors/us.md` section 8.1 |
| Moment Garden Star | $49.99 | $4.99 | none | [F] `docs/research/competitors/us.md` section 8.1 |
| Tinybeans+ | $74.99 | $7.99 | none | [F] CR section 1, R3 section 4.1 |

Monthly $4.99 matches the category floor (seven of 20 apps), below the $6.24 median; annual $49.99 equals the median of 18 apps and sits $20 above Tiny Treasures and Bloom at $29.99 [F] `docs/research/competitors/us.md` section 0 item 8, section 8.2. The annual plan costs about ten months of monthly (17% off 12 x $4.99) [F] arithmetic. A 1-month trial on a monthly plan sits in the 17 to 32 day bucket (43.7% median trial-to-paid on monthly plans); nothing published covers trials over 32 days, so the 2-month annual trial has no benchmark [F] R3 section 4.3 (R3-S33). What is free also changed: the first 2 kept letters, not writing (M1). Dearest, at the same price, keeps a free tier [F] `us.md` section 3; Qeepsake is moving to paid-only [S] `us.md` section 3.

## 3. Category economics (why the product must be cheap to run)
- Tinybeans plus Qeepsake: $6.49M revenue in FY26 from 93,300 paid families; adjusted EBITDA turned positive at $0.43M [F] R3 section 4.1.
- Qeepsake sold for $2.7M in stock in November 2025, about $54 per subscriber and about 0.66 times its implied revenue [F, A] R3 section 4.1. Its paid base fell about 12.6% in the eight months after [A] R3 section 4.1.
- Tinybeans' price rise raised ARPU 40% while retention stayed at 93% [F] R3 section 4.1. Families with years of memories pay rather than leave. We choose not to use that lever (principle 6).
- Ad revenue in the category fell 35% and then 32% in two years [F] R3 section 4.1. We carry no ads (B9, LEGAL-REQ-016).

## 4. Where we win, and the proof each claim needs

| White space | Why it is open | What makes it true in our product | Risk to the claim |
|---|---|---|---|
| **Faithful words, visibly** | Competitors rewrite or offer verbatim as a side mode; nobody shows what changed [F] R1 section 0 item 2 | Typed edits verified by `verifyEdits`, raw transcript immutable, visible change list with undo (F06) | The engine today accepts gender-changing edits in Hindi and Arabic [F] R5 section 0 item 6; must be fixed before those packs (R-01) |
| **Voice as the keepsake** | Baby-journal leaders ignore voice [F] CR section 5 | Original kept, listening copy, Read together (F08, F10) | New entrants now use "voice memory book" [F] R1 section 0 item 1; family listening is v1.1, so a co-parent cannot hear the other's voice in v1.0; the owner's own encrypted backup does not change that (D-073, DR-07) |
| **The whole family, one membership** | Qeepsake gates contributors; every competitor that gates co-parents is criticised [F] CR section 2 | One membership covers the book; family authors add letters without their own (M4; F11, F14); grandparents in v1.1 (F30) | Without a server signal, a co-parent outside the payer's Apple Family is not covered (DR-16); co-parent sharing ships in v1.0 (M14) but is built, switch off in release profiles on 13 Oct (`apps/mobile/src/lib/capabilities.ts`); From, Mama already has family contributors [F] R1 section 0 item 1 (R-05) |
| **The family's languages** | No competitor asks which languages a family speaks [F] R1 section 0 item 4 | Per-author languages, per-language packs and gates (F03, F05, F07) | Hindi conditional and Arabic not realistic on device at v1.0 [S, F] R5 section 0 items 2, 3 (DR-01) |
| **Organised by month of age** | Competitors organise by date, feed or prompt [A] CR section 5 item 7 | Month chapters, Before You, backdating free (F09) | Easy to copy |
| **Never held hostage** | Paywalls on past memories and price rises anger users [S] R2 section 0 item 3; Qeepsake is moving to paid-only and deactivating inactive free accounts [S] `us.md` section 3 | Every letter already kept reads, plays and exports without paying, forever; a letter waiting at the Keep gate is never lost; 90-day shutdown pledge (M1; F14, F15) | Day One and Dearest are also reasonable after lapse [F] R1 section 0 item 6, `us.md` section 3; and writing past 2 letters is paid, so the claim is about what you made, not what you will make |
| **Clean privacy label** | Most leaders declare tracking [F] R1 section 0 item 9 | No tracking SDKs, opt-in analytics, content never in analytics (F17, F18, F21) | Dearest already matches it [F] R1 section 0 item 9 |

## 5. Positioning
For parents of young children and the family who love them, Early Letters is the baby memory book you fill by talking. Unlike baby books that make you type and journals that rewrite you, it keeps every letter in your own words and your own voice, exactly as you said them, in the languages your family speaks, so your child can read and hear them for years. (`packages/content/BRAND.md`, extended with languages.)

The store subtitle must not be generic "voice memory book" (two competitors already use it, R1 section 0 item 1). The distinct claims are "exactly as you said it" and "in your own voice". F21 owns the listing.

## 6. Threats to watch

| Threat | Signal | Response |
|---|---|---|
| Apple Journal or Voice Memos add child-centred features | Apple Journal is free with audio transcription [F] CR section 1 | Our moat is the constitution, multiple authors and the book by age; Apple's speech stack excludes Hindi and Arabic [F] R1 section 0 item 3 |
| A funded entrant copies "never rewritten" | Low cost to claim, high cost to prove | Make the proof visible: change list, raw transcript in export, engine version on each letter |
| Tinybeans adds voice to Qeepsake | Owns the paid base | The faithful claim; one membership for the family (M4) |
| Price pressure | Tiny Treasures at $29.99 a year [F] R1 section 0 item 1 | Monthly is at the floor and annual at the median (M3); compete on trust, not price. Watch trial to paid in ASC against the review gate at 200 annual trials (R3 section 7) |
| Platform policy shifts (age laws, auto-renewal) | Texas SB 2420 in force; California ARL amended [F] R4 section 0 items 5, 7 | DR-02, DR-12 |

## 7. What this means for the PRD
1. Faithfulness is the one claim nobody else can make honestly. It is a launch gate in every language we ship (F05, F06).
2. Reliability and privacy are table stakes and the most common reasons people leave or choose; they get numbers and gates, not adjectives (06-nfr.md).
3. Family is a competitive gap at v1.0 (co-parent only). v1.1 should lead with grandparents and shared voice (05-feature-map.md section 3).
4. The language set should be gated by quality, and the next languages chosen by size and feasibility: Tagalog (1.9M), Vietnamese (1.6M), Korean (1.2M) and Haitian (1.0M) are each larger than Hindi (1.06M) in the US [F] R3 section 2.2.
