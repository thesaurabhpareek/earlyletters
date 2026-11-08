# Age rating questionnaire answers

Apple's questionnaire was updated in 2025: new tiers 13+, 16+ and 18+ beside 4+ and 9+, and four question groups (in-app controls, capabilities, medical or wellness topics, violent themes) in addition to the older content questions. Source: https://developer.apple.com/news/?id=ks775ehf. I confirmed the groups and tiers only; the exact question text and options must be read in App Store Connect, so each answer below names the topic, not a quoted question.

The app is for adults. The 18+ entry gate is decided (D-006, PRD-REQ-019), built (`apps/mobile/src/lib/age-gate.logic.ts`, `components/gate/age-gate-screen.tsx`) and runs before every route, including first run and deep links. It stores only a boolean, never an age or birthday. It is a self-declaration, not verification.

## 1. Apple

### 1.1 Answers

| Group | Topic | Answer | Basis |
|---|---|---|---|
| In-app controls | Parental controls | No | Not offered |
| In-app controls | Age assurance | No (self-declaration only) | The 18+ question is a Yes/No tap. Confirm how Apple defines "age assurance" in the console (OPEN-17) |
| Capabilities | Unrestricted web access | No | Only one fixed URL (privacy policy) opens, in an in-app browser (`settings/index.tsx`). No web view, no address bar |
| Capabilities | User-generated content | Profile A: No. Profile B: **OPEN-17** | Profile A has no sharing. Profile B lets an invited family member read and add signed letters to one private book; nothing is public, searchable or discoverable. If you answer Yes, Guideline 1.2 expects a way to report and block; the schema has revoke invite, remove member, leave, and parent approval of family letters (`review_family_letter`, `withdraw_family_letter`), but no "report" action |
| Capabilities | Messaging and chat | No | Letters are not messages; no replies, threads or chat between users |
| Capabilities | Advertising | No | No ad SDK |
| Medical or wellness | Medical or treatment information | No | No medical content. A pregnancy due date is a field the parent enters; the app gives no medical information |
| Medical or wellness | Health or wellness topics | No | No health content. No safety or crisis resources screen exists in the code (D-034 would add a static resources row only with a clinician's sign-off; if that ships, revisit this answer) |
| Violent themes | Cartoon or fantasy, realistic, prolonged graphic, guns or weapons | None | Letters between a parent and a child; the 104 prompts and all copy follow `packages/content/VOICE.md` |
| Sexual content, profanity, horror/fear, alcohol/tobacco/drugs | all | None | No such content ships; users write only their own private text |
| Gambling, contests, loot boxes | all | None | No chance-based features. Free letters and a free trial are not chance-based |

### 1.2 Resulting rating and override

The answers above should calculate to the lowest tier (4+). In App Information, set the **age rating override to 18+** (Apple lets you raise the minimum age above the calculated one). Reason: D-006 says adults only, the gate blocks under-18s, and a lower public rating would contradict it. OPEN-17 asks the founder to confirm.

Also in App Store Connect:

- Made for Kids / Kids Category: **No**.
- Does the app use the Declared Age Range API? **Not in the code.** D-040 only says it would be called "where the API exists". Say No until built (OPEN-17).
- Content rights, encryption and routing app coverage: see `export-and-content-rights.md`; the app is not a routing app.
- Regions: United States only at launch (D-013). Apple age ratings are assigned per region and may vary; check the rating shown for each storefront you later add.

## 2. Google Play

### 2.1 Content rating (IARC questionnaire)

Category: choose the one that fits a utility/lifestyle app that is not a game, not social, not news (the closest is "Utility, Productivity, Communication or Other" or the lifestyle option offered in the console).

| IARC topic | Answer |
|---|---|
| Violence, sexual content, language, controlled substances, gambling, horror | None |
| User interaction: users can interact or exchange content | Profile A: No. Profile B: Yes, only with people the parent invites to one private book (family). It is not public and offers no stranger-to-stranger interaction (OPEN-17) |
| Shares user location | No |
| Allows purchases of digital goods | Profile A: No. Profile B: Yes (Plus subscription). Digital goods are bought through the store billing |
| Unrestricted internet access | No |

### 2.2 Target audience and content

| Item | Answer |
|---|---|
| Target age groups | 18 and over only. Do not select any child age band |
| Appeals to children | No. The content (a parent's letters to a baby) is about children but is addressed to and used by adults; confirm with counsel (OPEN-23) |
| Designed for Families / Teacher Approved | No |
| Ads | None |

Play also asks about the app's target audience separately from the IARC rating; selecting only 18+ keeps the app out of the Families policy. If you select any age under 18 the Families requirements apply, which this app does not meet.

## 3. Open points

- OPEN-17: the 18+ override; whether any option in Apple's UGC question counts private invited family sharing; whether to adopt the Declared Age Range API later.
- OPEN-23: counsel's COPPA reading. The app holds a child's name, birthday and a parent's recordings, but is adult-only and collects nothing from the child (the `child-input` flag must stay off in production, PRD K-19; a child-voice feature would change both the privacy analysis and this rating).
