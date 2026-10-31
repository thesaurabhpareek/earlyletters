# App Store listing and Notes for Review: the staged first build (proposal for counsel)

Status: **Proposal, 28 Oct 2026.** Not approved by counsel, not applied to `packages/content/src/store.en.ts`, and `docs/store/app-store.md` (the full-scope listing) is unchanged. Written for D-121 (PR #340): the first store build is on-device only, with server features, backup, status report and analytics off, English only, Plus on. Counsel and Apple sign-off are not delegated; every claim below carries the question that gates it.

How this was made: from `docs/store/app-store.md`, `packages/content/src/store.en.ts`, the code on `develop` (28 Oct) and Apple's App Review Guidelines page (opened 28 Oct 2026; the fetch read the first 100,000 of 121,490 characters). Labels: [F] read in the repo or on Apple's page, [A] assumption, [Counsel] waits on a licensed attorney.

## 1. What changes from the full-scope listing, and why

| Full-scope listing says | This build | Change |
|---|---|---|
| Seven spoken languages; keywords `hindi`, `spanish`, `arabic`, `bilingual` | English only [F: `EXPO_PUBLIC_ENGLISH_ONLY`, `capabilities.ts`; to be set in `production` after 5 Nov, D-121] | Remove the language section and those four keywords (guideline 2.3.7: keywords must accurately describe the app) |
| "Write it together": invite a co-parent | No sharing, no sign-in [F: server features off] | Remove the section |
| "Only you and the people you invite can read your book" | Nobody is invited | "Your book stays on your phone." [Counsel Q17] |
| "Exactly as you said it" as the heading, in the promotional text and in screenshot 2 | The product marks every fix, and the recording is the exact original | Hold the phrase until counsel clears it at T30 (D-125 item 9). Use "see every change" and "in your own voice" |
| What's New mentions co-parent | Not in this build | Rewritten below |
| Review notes: "Family tab says Coming soon on purpose" | See D-126 | Rewritten below |

Unchanged on purpose: name `Early Letters: Memory Book` (26 of 30), subtitle `Baby journal in your own voice` (30 of 30), category Lifestyle, no health or development-tracking words (D-004, guideline 5.1.1(ix)), no "beta" (D-060, guideline 2.2), no other platform's name.

## 2. Fields

| Field | Proposed value | Length / limit |
|---|---|---|
| Promotional text | Talk to your child for a minute and keep it as a letter, in your words and your voice. Every fix is marked. Private by default: never sold, never used for ads. | 159 / 170 |
| Keywords | `diary,keepsake,newborn,toddler,parents,mom,dad,family,audio,scrapbook,dictation` | 79 / 100 |

Keywords repeat no word from the name or subtitle, use no spaces and name no competitor. "Dictation" describes talking to write; check it against the final build's behaviour.

## 3. Description (2557 / 4000)

```text
Early Letters is a baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. Early Letters keeps it as a letter, in your words and in your voice, and files it by your child's month of age. Over time it becomes a book your child can read, and hear, for years.

EVERY CHANGE SHOWN
Your words are written down on your phone. We only fix what a microphone gets wrong: a stray "um", a repeated word, a missing full stop. Every fix is marked, you can put any of them back with one tap, and we never rewrite your words.

YOUR VOICE, KEPT
The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one. Years from now, your child can hear how you sounded when you said it. We never imitate your voice. Your original recording is always kept exactly as you made it.

READ TOGETHER
Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page.

NOTES AND LETTERS
Some days are a quick note. Some days are a proper letter. Both belong. If today was quiet, tap "Not much today" and that is enough. There are no counters, no badges and no scores.

IN ENGLISH
This version works in English. The English speech model is a one-time download that you choose at the end of setup, so the app stays small.

PRIVATE BY DEFAULT
Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models. Your book stays on your phone. You can export everything or delete everything, any time, from Settings.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months. Starting a book is free, and your first two letters are free across every book.

TAKE IT WITH YOU
Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if the microphone slipped.
3. It is saved to this month in your child's memory book.

Early Letters is for parents of babies and young children, from the first weeks to the first years. Written early. Read again and again.

Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus. Plus is an optional subscription that lets you keep adding letters. It renews automatically until you cancel, and works with Family Sharing.

Terms of Use: https://earlyletters.com/terms
Privacy Policy: https://earlyletters.com/privacy
```

Claims in the description and what must be true of the build [F/A] before submission:

| Claim | Must be true | Gate |
|---|---|---|
| "your voice" / recording kept; "iPhone's own backup if you use one" | Recordings stay in the app's data on the phone; no upload (backup flag off) | Verify on build 1 with a network capture [A] |
| "We only fix ... Every fix is marked ... put any back" | The faithful-edit rules and the undo (constitution) | Existing tests |
| "never use them to train machine learning models" | Promise text `en.trust.promise` (D-061) | [Counsel] Q16, Q17 |
| "Your book stays on your phone" | No sync in this build | [Counsel] Q17 (claims registry) |
| "speech model is a one-time download that you choose" | The first-run step offers it and nothing downloads before the choice | Verify; [Counsel] Q12 (IP address and file name at the download host) |
| "Plus ... renews automatically ... Family Sharing" | Subscription Terms and the StoreKit products match; Family Sharing on for both (D-053) | [Counsel] Q8, Q-C4, Q-C10 |
| "first two letters are free across every book" | D-082 and D-103 counting | Existing tests |
| "export ... a PDF of the book" | F15 ships PDF export in this build | Verify [A] |
| "Read together" at bedtime | `read-together.tsx` is present on `develop` [F] | Verify on build 1 |

## 4. What's New (version 1.0)

```text
Hello. This is the first version of Early Letters. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book any time.
```

## 5. Screenshots

Same six frames as `app-store.md`, regenerated from the release build, with one caption change and one check:

| # | Caption | Subline | Change |
|---|---|---|---|
| 2 | Every change is marked | We fix slips of the tongue. Never your words. | Was "Kept exactly as you said it" (held, D-125 item 9) |
| 6 | Private to your family | Never sold. Never used for ads. | Check the Settings, Privacy frame shows no switch for a feature that is off in this build (analytics) |

Guideline 2.3.3: screenshots show the app in use [F]. No frame may show a Family tab with invitations, another language or a sign-in.

## 6. Notes for Review (draft)

Replaces the review-notes bullet in `app-store.md` ("Say plainly that co-parent sharing is not in this version ...").

```text
Early Letters is a baby memory book that parents fill by talking. A parent speaks or types a short letter to their child. The app turns the speech into words on the phone, marks any small fix it makes (a stray "um", a misheard word, a missing full stop), and lets the parent put each fix back. A due date for the child is optional. This is not a health or development-tracking service.

No account. This version has no sign-in. No demo account is needed.

Speech model. At the end of setup the person may choose a one-time download of the English speech model from our download host. Nothing downloads before they choose. Transcription then runs on the phone.

Subscription. Plus is an auto-renewing subscription (Plus Monthly and Plus Annual). The first two letters are free; letters already kept stay readable, playable and exportable without Plus. To test a purchase, use a sandbox account.

Features in the binary that are switched off (guidelines 2.3.1(a) and 2.5.19). The binary also contains code for sign-in, sync, co-parent sharing, encrypted recording backup, a subscription status report with reminder emails, and opt-in usage analytics. All of it is off at build time in this version: EXPO_PUBLIC_SERVER_FEATURES, EXPO_PUBLIC_BACKUP, EXPO_PUBLIC_STATUS_REPORT and EXPO_PUBLIC_ANALYTICS are off, so the app makes no call to our servers for them and nothing in the app reaches them. We intend to turn them on in later updates and will describe each one in its own Notes for Review. [The remote configuration keys the build reads, from the F19 key registry, listed once each: generated at submission, F19-REQ-024.]

Network requests in this version: the speech-model download above, and Apple's StoreKit requests for Plus. [To verify with a proxy capture of build 1 before submission; add any request the capture shows, such as a signed configuration fetch.]

[Family tab: per D-126, either "The Family tab is not shown in this version" or a description of the on-screen co-parent notice.]
```

## 7. Apple-rule check

| Guideline | Text [F] | Where this proposal stands |
|---|---|---|
| 2.1(a) | "placeholder text, empty websites, and other temporary content should be scrubbed before submission" | A "coming soon" screen can be read as temporary content. Apple's page does not mention "coming soon" in the part read. See D-126 |
| 2.3.1(a) | New features and changes "described with specificity in the Notes for Review ... (generic descriptions will be rejected) and accessible for review" | Section 6 lists the dormant code and the flags by name |
| 2.5.19 | No "hidden, dormant, or undocumented features"; hiding them in the binary "such as through code obfuscation" is grounds for removal | The dormant code is documented, not hidden. Whether documented dormant code satisfies "dormant" is **not settled by Apple's text**; this is the main residual risk accepted in D-121 |
| 2.3.7 | Keywords "accurately describe your app"; names limited to 30 characters; no irrelevant phrases | Keywords for removed languages deleted |
| 2.3.12 | "What's New" must describe new features | Section 4 |
| 2.2 | No demos or betas on the App Store | Word "beta" absent |
| 5.1.2(i) | Disclosure and permission before sharing data with third-party AI | Not in play on device; confirm no speech or text leaves the phone [A] |

## 8. Questions for counsel (first-build set)

Q1 (individual publisher, D-125 item 6), Q5 (age assurance; AB 1043 from 1 Jan 2027), Q8 with F14 Q-C1, Q-C4, Q-C5, Q-C6, Q-C8, Q-C10 (subscription notices when nobody can be emailed), Q10 (name clearance), Q12 (IP address and file name at the download host, which the "Data Not Collected" label depends on, D-088), Q14 to Q18 (promises and the claims registry), Q23. The wording questions in this document map to Q16 and Q17; "exactly as you said it" goes to counsel at T30.

## 9. Not done

`store.en.ts`, the generated `app-store.md`, screenshots and the App Store Connect fields are not changed. Applying this is a content PR after counsel answers, and the keyword and description lengths must be re-checked by the generator script and the content rules test.
