# Council return: CMO, CFO, CBO, CAIO seats (open decisions before "start", 20 Nov 2026)

Not posted anywhere. Four seats played by one Claude session; none is a licensed professional. Legal, tax and vendor-term judgments: counsel / accountant must confirm.

## 0. What I read

Read in full from origin/develop (fetched 20 Nov): docs/agents/exec/COUNCIL.md and the four SKILL.md files (CMO, CFO, CBO, CAIO). All four readable.
Read: DECISIONS-LIST.md. From the pack (open PRs, head files read through the GitHub API): #999 (05 audit), #1000 (06 data use and retention), #1001 (07 communication), #1003 (04 secrets). #1002, #1004 to #1011 (schema and access chapters) not read: not needed for these seats.
Read on develop: apps/web/src/lib/legal/privacy-copy.ts, apps/web/src/content/site.ts (s09), docs/legal/privacy-policy.md, docs/store/app-store.md, packages/content/src/store.en.ts, mobile analytics files (grep).
Not readable: supabase.com/pricing. WebFetch failed (host does not resolve; supabase.com is outside this session's allowed network domains). Every Supabase price and plan limit below is therefore [U]. Needs supabase.com allowed, then re-read.

## 1. CFO

**A1. Supabase Pro before the first store build. CHANGE (to: NEEDS FOUNDER, with a recommendation; default "stay on Free" is only safe with conditions).**
- Cost: the repo's figure is Pro $25 a month, $300 a year, from R3 read 3 Oct [U this session: not re-read; supabase.com unreachable]. Fixed floor with the other three vendors is $91 a month (CFO skill 9.1), also dated 3 Oct. Compute add-ons, overage and spend-cap behaviour: [U].
- Needs from him: card on file and acceptance of terms, so it is his decision even at the base price. If nobody acts: no spend, production stays Free. How to cancel: downgrade in the Supabase dashboard (monthly, a two-way door) [U against the current page].
- Why I move off the plain default: the first store build (D-121, privacy-policy line 21) has servers off. In that build Free costs us nothing and Pro buys nothing a family can use. Pro starts to matter at build 2 (sign-in, sync, deletion), which is the first outside family. So: do not buy Pro for the first store build; buy it as a gate before the first outside family on build 2, or before recovery/backup is switched on. [V from #1000 and #999: production is Free, platform logs 1 day, no Supabase backups; mitigation is the nightly age-encrypted 7-day dump in a private repo.]
- Runway effect: $25 a month is about 27% of the $91 floor; annual $300. Break-even on the floor is about 25 paying families (CFO skill, [A]). No revenue exists before the first store build, so this is pure burn.
- Conditions: (a) founder confirms the price on supabase.com/pricing on the day, (b) month-to-month only, no annual prepay, (c) before any promise of a backup window is public, either Pro is on or the promise is worded for the nightly dump (see CMO E2), (d) data-policy.md:211 (Pro daily backups) is corrected by legal/ops (C06-1 in #1000).
- Record: "A1: Founder decided [date]: Supabase Pro [bought on <date> / not before build 2]; month-to-month; the 24-hour deletion-return limit [stays in / leaves] the incident notice. CFO-<n>."

**A4. Crash SDK or PostHog ever. AGREE with default (not in 1.0.x). NEEDS FOUNDER later, as a spend and a promise.**
- Money: PostHog and Sentry prices not read this session [U]. The $91 floor already includes Sentry Team $26 at 3 Oct prices, which is a cost for a tool not in any 1.0.x build: ask the founder whether he has bought it. If he has, cancel until used (annual $312 for nothing) [U on whether bought].
- Condition for ever: free tier checked for overage billing, hard cap, card requirement; the CPrivO and CMO sign off the wording first (privacy policy line 24 says "none in any build").
- Record: "A4: Not in 1.0.x. Reopen only with a dated cost read, a spend cap, and the privacy words changed first. CFO-<n>."

**Other spend in this list.**
- A2 (apply migrations): no spend. AGREE with default, but note the applying runs against Free with 1-day logs: take a dump first [mitigation exists].
- A5 (security.yml, secret scanning): GitHub-side; D-127 says no paid tools. AGREE if every item is free tier; secret scanning on a private repo may be paid [U]. Founder checks the price before pasting.
- C2/C3 split keys and `security_events`: no vendor spend, engineer hours only. No CFO objection.
- F2 dev dependencies: free, no spend.
- B7 retention and processors, PQ-3 (GitHub as processor of the encrypted dump): if counsel says no, the dump moves to a paid store. Cost unknown [U]; flag.
- Counsel fee, accountant (CR-120, before first payout), Small Business Program FT-29: not on the list, and they are the cheapest and most urgent money items (see Gaps).

## 2. CBO

**A1. Vendor and partner implications. CHANGE: add a condition. The decision is the CFO's number plus a vendor-dependency view.**
- Supabase is the single system of record, auth, storage and functions (#1000 vendor table). Free means pause-after-inactivity and 1-day logs [U current rules]. For a paid app that is a vendor risk, not just a cost line. Pro is the only plan I would put a paying family on.
- Partner effect: Resend (waitlist list and transactional), Vercel, GitHub (nightly dump, PQ-3) are each a processor. None needs a contract the founder signs today, but accepting Supabase/Resend/Vercel paid terms is an external account step (founder). Counsel (through CLO) reads the DPAs before the first outside family, not before the first store build.
- Revenue link: the first Plus payer arrives only with a store build; Pro is a cost before revenue. Good reason to buy it at build 2, not earlier.
- Nothing in A1 touches pricing, trials or what Plus holds. No print or link-out implication.

**D5. May app sign-ups ever get marketing email. AGREE with default (no, transactional only), NEEDS FOUNDER only if he ever wants to reopen it.**
- Business view: a memory book gets little from a drip and loses trust fast. The waitlist is a separate list and a separate consent (#1000 C7, LEGAL-REQ-016). I would not build any join between the waitlist and accounts.
- If reopened later: separate opt-in at sign-up, not pre-ticked, counsel classifies each email under CAN-SPAM, postal address chosen first (BRIEF.md: not chosen), Resend segments kept apart.
- Record: "D5: App sign-ups get transactional email only. The waitlist stays a separate list. Reopen only with a founder decision, a separate opt-in and counsel's classification. CBO-<n>."

**Vendor and partner items elsewhere in the list.** B7 PQ-3 (GitHub as processor): counsel. Print, link-out, gifts: not on this list; no change.

## 3. CMO

**D5. AGREE.** Default holds. Marketing to app users is a new public promise on a trust product. The welcome email to the waitlist is its own open question (no postal address; sign-off off-brand; "exactly as you said it"); keep it out of this decision.
- Also keep the privacy words aligned: #1000 C7 says app users get transactional mail only. If D5 changes, the privacy policy and consent text change first.

**E1. Release cut and drops. AGREE with plan 3a table, with a claims condition.**
- Public copy for the cut must be written from what the store build does (D-121: servers off, English only, no sign-in, no sync). The staged listing already follows that.
- Condition: no drop that adds a public claim ships before its row in the claims inventory goes to "true" and counsel has the exact text.
- Record: "E1: Release cut as plan 3a. Each drop's public words checked against the claims inventory before the build. CMO-<n>."

**E2. Public claims consistency. CHANGE: NEEDS COUNSEL (through CLO) and a founder merge. I have not found a false claim in the first store build, but I found six consistency gaps.**

Checked: the privacy page (apps/web privacy-copy.ts), the legal privacy policy (docs/legal/privacy-policy.md), the store listing (packages/content/src/store.en.ts and docs/store/app-store.md), the site (site.ts s09), against the pack findings.

1. "No analytics" vs the PostHog path. True today and checkable: policy line 24 "There are none in any build" and line 45; privacy-copy.ts "We do not use analytics" (website); mobile `EXPO_PUBLIC_ANALYTICS=off`, no PostHog key, preflight-production asserts it, `analytics-off-v1.test.ts` [V from #1000/#999]. But `packages/analytics`, the consent sheet, the `analytics-forget` function and the account-deletion step `posthog` are shipped code, dormant behind a flag. Absolute wording ("no analytics, ever") would turn false the day A4 is reversed. Condition: say "in this version" (the policy already scopes by build); keep the preflight check as the proof; when analytics is switched on, the policy, the privacy label and the site change in the same release. Evidence gap: #1000 notes the dependency check in preflight is "proposed" (FR-PRV-31) [U whether built]; website claim rests on NEXT_PUBLIC_ANALYTICS unset, which is a config fact, not code.
2. Backups promise vs Free plan. Policy line 37 and store line 36 say recordings are on the phone "and in your iPhone's own backup if you use one": true, but #1000 flags B4 (scribe.db, recordings, pictures are not excluded from device backup) so the claim is true and also means our data sits in iCloud under Apple's terms. Say it plainly. Separately, data-policy.md:211 still describes Pro daily backups against production on Free with no Supabase backups (C06-1). The "38-day" deletion-from-backups promise holds only while the dump stays 7 days. Any public sentence about server backups (privacy policy, deletion page, store notes) is false or unproven until A1 is decided. Hold it.
3. Deletion promises. The store notes (app-store.md line 139) say "account is deleted 30 days later". #1000: live 31 days, backups 38 days, processors 45, Resend about day 60 as the named exception; also "up to 24 hours of deletions can return after the project is lost" on Free. The site and store say 30 days, the full chain is longer. Counsel to decide where the longer windows and the 24-hour limit are said. I recommend the policy states 31/38/45 and the store says "within 30 days, with copies in encrypted backups cleared within 38" only after counsel clears it.
4. Site deletion page. I found no deletion route in apps/web (only privacy, terms, support, legal docs). The privacy page's deletion path is "email us from that address" for the waitlist; app deletion lives in app Settings and only exists in build 2 and later. Apple requires in-app deletion where accounts exist (review guidelines 5.1.1(v), I did not re-read this session: [U]). Gap: no public page says how to delete app data; and the first store build has no account, so the store listing's "Delete account" text is for the test build, not the store listing. Check that the live store listing does not carry the build 2 section.
5. "Never used to train AI" on the site (site.ts s09 line 209). Names AI, which the content rules ban in packages/content; not covered by a D-id for the site; "never" is a practice, not code. Recommend: "Never used to train machine learning models", exact wording of en.trust.promise. FOUNDER and counsel (Q16, Q17).
6. "Exactly as you said it" still live on site and welcome email, held from the store (D-125 item 9). It reads as verbatim over a letter whose "ums" were removed. Recommend the site follow the store hold. Founder merge to main.
- Also: site.ts s09 line "Your recordings are kept on the phone that made them" is true only without the device backup; add "and your iPhone backup if you use one".
- Privacy label (App Store): must match "no analytics in 1.0.x" and the device-backup fact. CPrivO owns; CMO's check: label equals policy equals listing equals site.
- Record: "E2: Public claims in the first store build checked against code on [date]. Items 1 to 6 [fixed / held / sent to counsel]. No promise about server backups until A1 is decided. CMO-<n>."

## 4. CAIO

**B2. Cloud AI for a child's voice, picture or letter text: FORBIDDEN until X2. AGREE, and strengthen.**
- Constitution check: any cloud model touching a letter breaks the rule only if it can add meaning; the structural limit (typed `EditType` proposals through `verifyEdits`, no text field) already exists. The question here is data leaving the phone, not the engine.
- Verified in repo: `JsonModelEditProvider` is not wired into the app and not switchable by remote config (F06); v1.0 is rules only; no letter or recording goes to a model off the phone (CAIO skill 8a). `analytics-forget` and PostHog are not model paths.
- Condition: X2 is not just "security read plus counsel read": add (a) consent design by CPrivO, (b) a named processor with a no-training term in writing, (c) the AI-claim text in the policy checked (Q16), (d) a preflight test that no outbound host other than the allow-list is reachable in the production profile.
- Record: "B2: Nothing leaves the phone for a model. A hosted model pass needs a founder decision after X2 and the conditions above. CAIO-<n>."

**B3. Variant B (mediaSync, pictures leave the phone). AGREE with default (not chosen, not built). NEEDS FOUNDER later.**
- Pictures are not AI, but any later "describe the picture" feature on synced images would be a cloud-AI path, forbidden by B2. Note it in the design so it cannot slip in.
- Condition: no image classifier or captioner, on or off the phone, without a CAIO read (constitution: adds meaning).

**Any AI feature or agent exposure.**
- No AI feature in 1.0. AGREE. Any "make it nicer", summary or suggestion feature is NOT A QUESTION: refused (AIE-R20).
- Agents: D-127 no paid inference stands. Per #1003, agents hold no Supabase, Resend, Apple or PostHog secrets (SK-06) [V as policy]; that is a rule, not a control, since every session runs as the founder (CR-20). C2 (one secret key shared by four functions) is the agent-exposure risk to watch: a prompt-injected session that can read functions' env reaches all four. Support the CISO's split before the first outside family.
- The CAIO conflict: I am Claude judging whether Claude may read the repo. Independent challenger needed (CISO).
- AI law: not applicable in a US-only, on-device build; California AB 2013 and the EU Act need counsel only when a fine-tuned or generative model ships (Hinglish plan, v1.1). Counsel must confirm.
- A site claim "never used to train AI" is a CAIO-flagged item (see E2 item 5).

## 5. Gaps the list is missing

1. **Small Business Program enrolment (FT-29) and the accountant (CR-120) are not on the list.** Enrolment decides whether Apple takes 15% or 30% in year one (about $7.50 per annual subscriber), starts 15 days after the fiscal month of approval, and is open as of 28 Oct [U current status]. Founder only. Do it before the first store build.
2. **No owner for the public deletion and backup wording.** Privacy policy, store listing, site and data-policy.md:211 disagree (C06-1). Name one owner (CLO with CPrivO), and a rule: no sentence about server backups until A1 is decided.
3. **The 24-hour deletion-return limit under Free has no home.** #1000 says up to 24 hours of deletions can return after a project loss; A1's default puts it in "the incident notice" only. It is a privacy promise limit; counsel decides where it is said (policy, not only the incident notice).
4. Sentry Team $26 and other floor vendors: are they bought, and are they unused? Recurring and invisible (CFO anti-pattern).
5. A claims registry does not exist (D-123 deferred it; VOICE.md points to a missing file). E2 above is a one-off; the cycle repeats every drop. Recommend the founder approve a minimal registry (one row per public sentence, code proof, build profile).
6. App Store privacy label vs device backup of scribe.db (B4): no executive named; CPrivO.
7. Supabase pricing and Free-tier rules could not be read this session: supabase.com must be allowed in the network settings before the A1 number is quoted to the founder.

## 6. Conditions summary

- Do not buy Pro for the first store build (servers off); buy month-to-month before the first outside family or before backup, after reading the current page.
- Nothing about server backups goes public until A1 is closed.
- Analytics words stay scoped to "this version"; the preflight "no PostHog key" check is the proof and stays green.
- Website "never used to train AI" and "exactly as you said it" go to counsel and the founder; I prepare a one-line edit.
- Cloud AI stays forbidden until X2 plus consent, processor terms and a network allow-list test.
- Every dollar figure here dated 3 Oct (R3) is [U] until re-read.

## 7. Closure line

"Council return of the CMO, CFO, CBO and CAIO seats read on 20 Nov 2026: A1 NEEDS FOUNDER (Pro at build 2, not at the first store build; price [U], supabase.com unreadable); A4 AGREE; D5 AGREE; E1 AGREE with claims condition; E2 NEEDS COUNSEL and founder merge on six items; B2 AGREE with conditions; B3 AGREE. Gaps 1 to 7 above go to Karma."

Chief Financial Officer (Claude role)
Chief Business Officer (Claude role)
Chief Marketing Officer (Claude role)
Chief AI Officer (Claude role)
