# Public claims inventory, 28 Oct 2026 (retro package R1-02)

Status: read-only inventory. Nothing in the product, the copy or the legal drafts was changed. This is an engineering reading of copy against code and the decision register. It is not legal advice and states no legal conclusion; it is input for counsel, the tester notice and the claims test (R2-07).

Snapshot: `develop` at 6bfb94a9, `main` at b8b52d5e, open pull requests read through the GitHub API on 28 Oct 2026. Line numbers are for those commits.

## 1. Headline numbers

- 95 claim rows in sections 3 and 4 (some rows group the same claim made on several lines): 44 true, 28 false, 23 unverified, counted from the Verdict column. Section 5 adds 3 code-against-decision items; section 6 lists 18 pending claims in open PRs without verdicts.
- The largest groups of false claims:
  - Plus terms in the legal drafts still describe the 3 Oct model: prices US $3.99 and $29.99, 3 free Read together sessions, Plus for more children's books, and "writing is free, always". D-082 and D-083 replaced all four on 4 Oct.
  - Co-parent and seven-language claims are false in the two alpha build profiles: co-parent needs the server switch, which is off in `testflight` and `production`; both alpha profiles are English only (D-111 item 4).
  - PostHog is named as an analytics recipient in four legal drafts, but D-095 removed analytics from v1.0 and no profile turns it on.
  - The live website's pricing scene says Plus backs up recordings, opens Read together after free sessions, and lets the whole family add letters. All three contradict decisions of record.
- Many claims are true for every build today only because a feature is switched off: "recordings stay on your phone" and "we do not receive purchase records" hold because `EXPO_PUBLIC_BACKUP` and `EXPO_PUBLIC_STATUS_REPORT` are off in every `eas.json` profile. D-100 puts both features in v1.0. These rows are marked true, with "conflicts" in the Decision column. They turn false the day either flag is turned on.
- One code item with no public claim yet: `packages/core/src/plan.ts:38,45` lists `backup_upload` as a Plus-gated feature, and `decide()` (`plan.ts:197-217`) offers Plus for a user-initiated backup in a Free book. D-111 item 6 (`docs/DECISIONS.md:741`) says backup is free and does not gate on Plus. #163's draft terms say backup will be free (section 7).

## 2. How to read the tables

- **Claim**: the user-facing words, quoted or closely paraphrased, with file and line.
- **Decision**: the D-id of record in `docs/DECISIONS.md` on develop (line number given), and whether the claim agrees with it or conflicts with it.
- **Code evidence**: the file and line that makes the claim true or false.
- **Verdict**, judged against what develop's code does in the build profiles in `apps/mobile/eas.json`:
  - **true**: true in every profile.
  - **false**: false in at least one profile that testers receive (`testflight` is build 1, servers off; `preview` is build 2, servers on), or contradicted by a decision of record where no code applies (for example a price). The profile is named.
  - **unverified**: I could not check it from the repository (a business practice, a hosted setting, an App Store Connect setting, or behaviour I did not open).
- Build profiles (`apps/mobile/eas.json`): `EXPO_PUBLIC_SERVER_FEATURES` is on only in `preview` (line 47) and off in `development` (16), e2e (33), `production` (61) and `testflight` (75). `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT` and `EXPO_PUBLIC_ANALYTICS` are off in every profile (lines 17 to 19, 34 to 36, 48 to 50, 62 to 64, 76 to 78). `EXPO_PUBLIC_ENGLISH_ONLY` is on in `preview` (51) and `testflight` (79). `apps/mobile/src/lib/capabilities.ts:141-170` maps these to `signIn`, `sync`, `coParent`, `backup`, `statusReport`, `analytics` and `englishOnly`.
- Cross-cutting fact for every transcription claim: `packages/api/src/keys.ts:19-22` (`TRUSTED_SIGNING_KEYS`) is an empty array with a `TODO(founder)`, so no current build can verify a pack manifest and install a speech model (SYNTHESIS spot-check 17). Claims that depend on words appearing from speech are marked unverified for that reason, even where the engine code supports them.
- Where each surface is shown:
  - `packages/content/src/store.en.ts` is the App Store listing source; `scripts/brand/screenshots.mts:20` reads it. Whether it has been entered in App Store Connect is unverified.
  - `packages/content/src/site.en.ts` is website copy on develop, but `apps/web` exists only on `main`, and `git grep "@scribe/content" origin/main -- apps/web/src` finds nothing. So this file is not what earlyletters.com shows today.
  - The live website copy is `apps/web/src/content/site.ts` on `main`, added here as section 3c because it is the copy the public reads (a deviation from the package spec, stated in the PR). Which of its scenes the live site renders (holding page or full film) is unverified; `apps/web/src/lib/launch.ts` on main keeps prelaunch mode until `NEXT_PUBLIC_APP_STORE_URL` is set.
  - Every file in `docs/legal/` on develop is marked `draft-for-counsel` and most are dated 3 Oct 2026. None is published from this repository as far as I can see. They are inventoried because counsel would read them first.
- Scope of `docs/legal/`: product-fact claims (features, data flows, prices, timelines) in the user-facing drafts and the two counsel-facing files that restate product facts (`compliance-register.md`, `app-store-privacy-labels.md`). Clauses with no product fact to check (liability, warranty, governing law) are left out. Internal specs (`DATA_CLASSIFICATION.md`, `DELETION_AND_EXPORT_SPEC.md`, `ENGINEERING_REQUIREMENTS.md`, `POLICY_VERSIONING.md`, `COUNSEL_PACKET.md`) are out of scope.

## 3. Shipped or source copy

### 3a. App Store listing, `packages/content/src/store.en.ts` (develop)

| # | Claim | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| S1 | "We fix slips of the tongue. Never your words." (:24); "We never rewrite your words." (:42) | D-086 (:566), agrees | Closed edit list `packages/core/src/types.ts:12-19` (`filler`, `false_start`, `repeat`, `stt_fix`, `punctuation`, `agreement`, `paragraph`) | true |
| S2 | "Your words are written down on your phone." (:42) | D-086, agrees | On-device engine exists; no model can install while `packages/api/src/keys.ts:19-22` is empty | unverified |
| S3 | "put any fix back with one tap" (:42) | D-086 (:566), agrees | Review undo UI not opened | unverified |
| S4 | "The original recording stays with each letter, on your phone and in your iPhone's own backup" (:45) | D-085 (:563) said so; D-100 (:647-648) and D-073 (:483) put our backup in v1.0: conflicts | `capabilities.ts:154-157` backup needs `EXPO_PUBLIC_BACKUP`, off in every profile | true |
| S5 | `en.trust.voice`: "We never imitate your voice." (:45, via `strings.en.ts:1226`) | D-061 (:383), agrees | No code check possible for a negative practice | unverified |
| S6 | Read together: "hear the letters you spoke, in your own voice, with the words on the page" (:48) | D-059 (:377), agrees | Screen `apps/mobile/src/app/read-together.tsx` exists; behaviour not opened | unverified |
| S7 | "Invite your co-parent to the same book." (:54); whatsNew "write together with your co-parent" (:87) | D-100 (:647), agrees; header comment :12 still cites D-055 | `capabilities.ts:151-153` co-parent follows the server switch: off in `testflight` (eas.json:75) and `production` (:61), on in `preview` (:47) | false (`testflight`, `production`) |
| S8 | "Speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese." (:57) | D-056 (:374); D-111 item 4 (:739) and D-115 (:785) make the alpha English only: conflicts for the alpha | `capabilities.ts:51-59`; `EXPO_PUBLIC_ENGLISH_ONLY` on in `preview` (eas.json:51) and `testflight` (:79) | false (both alpha profiles) |
| S9 | "A language downloads only when you choose it" (:57) | D-087 (:570), agrees | Downloads blocked by empty `keys.ts:19-22` | unverified |
| S10 | `en.trust.promise`: private; "never sell them, never use them for ads and never use them to train machine learning models" (:60, via `strings.en.ts:1222`); captions :28, :35 | D-061 (:383), agrees | Business practice; no code check possible | unverified |
| S11 | "Only you and the people you invite can read your book." (:60) | D-102 (:659): we hold a recovery key and staff access exists | `site.en.ts:93` says staff "could open them"; `docs/legal/privacy-policy.md:118` says the founder could read letter text | unverified |
| S12 | "You can export everything or delete everything, any time, from Settings." (:60) | D-085 (:562), agrees | Export: `apps/mobile/src/lib/export/pack.ts:39`. With servers off there are no Account or Delete account rows (`capabilities.ts:17-18`); "Erase everything" UI not opened | unverified |
| S13 | "Starting a book is free, and your first two letters are free across every book." (:63, :75) | D-082 (:547), D-083 (:552), agree | `packages/core/src/plan.ts:11-14`; `DEFAULT_FREE_LETTERS = 2` (:53) | true |
| S14 | "Export your memory book any time, for free: your letters, your recordings and a PDF of the book." (:66) | D-082 (:547), agrees | `export` is `FreeForever` (`plan.ts:27-35`); PDF rendering `export/pack.ts:39` | true |
| S15 | "Every letter you keep stays yours to read, play and export, with or without Plus." (:75) | D-082 (:547), agrees | `plan.ts:15-18, 27-35` | true |
| S16 | Plus "works with Family Sharing" (:75) | D-082 (:547), agrees | `apps/mobile/storekit/EarlyLetters.storekit:62, :114` `familyShareable: true`; App Store Connect setting unverified | true |

### 3b. Website copy source, `packages/content/src/site.en.ts` (develop; not rendered by the live site, see section 2)

| # | Claim | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| W1 | "transcription happens on your phone and fixes only small slips ... Every small fix is marked, and you can undo it" (:35, :59, :97) | D-074 (:489), D-086 (:566), agree | Edit list `types.ts:12-19` includes `agreement` for "we was to we were" (:97); model install blocked by `keys.ts:19-22` | unverified |
| W2 | "We never rewrite your words." (:35, :81, :97) | D-086, agrees | `types.ts:12-19` | true |
| W3 | "Invite your co-parent to the same book." (:47); "Today, you and your co-parent write in the same book." (:74) | D-100 (:647), agrees | As S7 | false (`testflight`, `production`) |
| W4 | "Only the people you invite can read what you add to the book." (:80) | D-102 (:659) | As S11; the same file's FAQ (:93) says staff could open letters | unverified |
| W5 | "Your recordings stay on your phone, and in your iPhone's own backup" (:83); "Each recording stays on your phone by default" (:130) | D-085 cited in comment :82; D-100 (:648) amended D-085: conflicts | Backup off in every profile (`capabilities.ts:154-157`) | true |
| W6 | "No ads. We never sell your data or share it with advertisers." (:84) | D-061, agrees | Business practice | unverified |
| W7 | "You can export your book, free, at any time." (:85, :121) | D-082, agrees | As S14 | true |
| W8 | "You can delete your own letters and recordings whenever you like." (:86, :130) | D-085 (:562), agrees | `delete` is `FreeForever` (`plan.ts:35`); device erase `apps/mobile/src/lib/capture/erase.ts:2` | true |
| W9 | "Inviting someone to one book does not open the others." (:87) | D-069 (:399) | Access rules not opened | unverified |
| W10 | "When you sign in, your letters sync to our servers so your co-parent and your next phone can read them." (:93) | D-100 (:647), agrees | `capabilities.ts:143-149`, on in `preview` only. Note: SYNTHESIS spot-check 20 reads :83 and :93 as contradictory; :83 is about recordings and :93 about letter text, so they do not contradict each other today | true |
| W11 | "They are encrypted on the way and on our servers. We hold the keys ... That access is restricted and logged." (:93) | D-102 (:659), agrees on keys | `docs/legal/privacy-policy.md:316` (CN-8): reads through the Supabase dashboard SQL editor are not logged | unverified |
| W12 | "Plus is shared through Apple Family Sharing ... Reading, playing your recordings and export stay free" (:113) | D-082 (:547), agrees | `EarlyLetters.storekit:62`; `plan.ts:27-35` | true |
| W13 | Seven languages (:117) | D-111 item 4 (:739): conflicts for the alpha | As S8 | false (both alpha profiles) |
| W14 | Price "$4.99 a month, with the first month free, or $49.99 a year, with the first 2 months free"; first two letters free; Read together and export never locked (:126) | D-082 (:547), D-083 (:552), agree | `packages/content/src/pricing.ts:8-23`; `plan.ts:14` "Read together has no session limit" | true |
| W15 | "Your letters come with you when you sign in." (:134) | D-100, agrees | Sign-in exists only in `preview` (`capabilities.ts:13-14, 143-145`); the claim is conditional on signing in | true |

### 3c. Live website copy, `apps/web/src/content/site.ts` (main)

| # | Claim | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| M1 | "Private by design. Your letters stay on your phone" (:73); share text "private on your phone" (:79) | D-100 (:647): letters sync once signed in: conflicts | Letter text syncs in `preview` (eas.json:47, `capabilities.ts:146-149`) | false (`preview`) |
| M2 | "Transcription runs on your phone by default and only clears the ums and misheard names." (:140) | D-086 (:566) | `types.ts:12-19` allows seven edit types, not two; model install blocked by `keys.ts:19-22` | unverified |
| M3 | "Both parents write in the same book." (:157) | D-100, agrees | As S7 | false (`testflight`, `production`) |
| M4 | Seven languages "each written in its own script" (:178) | D-111 item 4 (:739): conflicts for the alpha | As S8 | false (both alpha profiles) |
| M5 | "Your letters are never used to train models." (:199); "No ads. We never sell your data." (:198) | D-061, agrees | Business practice | unverified |
| M6 | Plus "backs up every recording" (:207) | D-111 item 6 (:741) and D-104 item 2: backup is free and not a Plus feature: conflicts | No profile turns backup on (`capabilities.ts:154-157`). Note `plan.ts:38,45` does gate `backup_upload`, matching this line and not D-111 | false |
| M7 | Plus "opens Read together after the free sessions" (:207) | D-082 (:548) superseded D-053's session rule; D-083 (:552) "Read together is free": conflicts | `plan.ts:14` "Read together has no session limit" | false |
| M8 | Plus covers every child's book "with the whole family adding letters" (:207) | D-055 (:371), D-099 (:612): two parents only; others later: conflicts | `capabilities.ts:150-153` co-parent only | false |
| M9 | "$4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial" (:207) | D-082 (:547), agrees | `apps/web/src/content/pricing.ts:17-20` (main) | true |
| M10 | "Every letter you have made stays yours to read, play and export, even if you stop." (:207, :200) | D-082, agrees | `plan.ts:15-18` | true |
| M11 | "coming to iPhone in the US" (:212, :243, :259) | D-083 (:553) US storefront only, agrees | App Store Connect territories unverified | unverified |
| M12 | Email list: a welcome email now, one more when ready, unsubscribe link in every email, address never sold (:221, :226) | none (website) | `apps/web/src/lib/notify/provider.ts:2-6` (address only), :59-64 (unsubscribed contacts left alone); `privacy-copy.ts:6-10` maps each claim to code | true |

### 3d. Website privacy page, `apps/web/src/lib/legal/privacy-copy.ts` (main)

| # | Claim | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| P1 | "The Early Letters app is not out yet. It will have its own privacy policy when it launches." (:41) | D-106 (:683) TestFlight alpha with testers | Not on the App Store; whether alpha testers have the build is unverified | unverified |
| P2 | Only the email address is collected for the list; we do not ask for a name (:55) | none | `apps/web/src/lib/notify/provider.ts:6` "Only the address is sent" | true |
| P3 | IP held in memory for up to 10 minutes to block automated requests, "We do not save it." (:57) | none | Logging carries no IP (`apps/web/src/lib/notify/log.ts:24-36`); the 10-minute window is set by callers of `rate-limit.ts:22`, not opened | unverified |
| P4 | "We do not use cookies." (:68) | none | `git grep` finds no `document.cookie`, `localStorage` or `sessionStorage` in `apps/web/src` on main; hosting-layer cookies unverified | true |
| P5 | "We do not use analytics, advertising or tracking tools, and the website loads nothing from other sites." (:69) | none (D-095 covers the app only) | Root layout mounts no analytics (`apps/web/src/app/layout.tsx:47`); `track()` is a no-op unless `NEXT_PUBLIC_ANALYTICS=vercel` (`apps/web/src/lib/analytics/index.ts:23`); CSP `default-src 'self'` (`apps/web/next.config.ts:25-30`). `@vercel/analytics` is a dependency (`apps/web/package.json:21`). The Vercel env value is unverified. Open #309 would change this line | true |
| P6 | Two providers only: Vercel and Resend (:29-32, :79-80) | none | `vercel.json`; `notify/provider.ts`; mail receiving through Resend per comment :15-17, not checked | true |
| P7 | Unsubscribed addresses are kept marked unsubscribed, never emailed again (:88) | none | `notify/provider.ts:59-64` | true |
| P8 | Deletion and access requests by email are honoured (:98-99) | none | A manual process; no request log in the repo (IMP-70) | unverified |

## 4. Legal drafts on develop, `docs/legal/*` (all `draft-for-counsel`)

| # | Claim | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| L1 | privacy-policy.md 1.4.0: "Your recordings stay on your phone. We do not upload, back up or transcribe recordings on our servers." (:23; also :58, :114, :150, :188, :249) | D-100 (:647-648), D-102 (:659): conflicts | Backup server built (`supabase/migrations/20261023000000_backup_server.sql`) but off in every profile (`capabilities.ts:154-157`) | true |
| L2 | privacy-policy.md: "Letter text syncs to our servers once you sign in and agree" (:25, :57) | D-100, agrees | `preview` only (eas.json:47) | true |
| L3 | privacy-policy.md: backup of recordings listed among features "not part of Early Letters today" (:39) | D-100 (:647), D-073 (:483): conflicts | Backup off in every profile | true |
| L4 | privacy-policy.md: PostHog receives app usage after opt-in; analytics switch in Settings (:62, :88, :102, :135, :227, :245-248) | D-095 (:592): no PostHog client and no Settings switch in v1.0: conflicts | `capabilities.ts:45-49, 162-165`; `EXPO_PUBLIC_ANALYTICS` off in every profile | false |
| L5 | privacy-policy.md: "Analytics are off until you say yes" (:26) | D-095 (:592) | Off in every profile; there is no way to say yes in v1.0 | true |
| L6 | privacy-policy.md: "we never see your card or your purchase records" (:27, :61, :174) | D-080 (:524) status report and D-100 (:647) reminder emails: conflicts | Table `subscription_status` exists (`supabase/migrations/20261016001000_subscription_status.sql:96`); `statusReport` off in every profile (`capabilities.ts:158-161`) | true |
| L7 | privacy-policy.md: speech model downloads once; "No audio leaves the phone for this." (:71) | D-097 (:600), agrees | No audio upload path in any profile; model install blocked by `keys.ts:19-22` | unverified |
| L8 | privacy-policy.md: deletion from the live database within 31 days, backups 38, providers 45 (:159); consumer-health-data-notice.md :59 says the same | D-116 (:802, :806) keeps a tombstoned book row with name and dates past 31 days: conflicts | Purge worker live deploy is a founder step (panel 03) | false |
| L9 | privacy-policy.md: "A book where you are the only parent is deleted with everything in it." (:179; also :235) | D-116 (:802, :806): a former member's letters survive the purge: conflicts | Migration `20261023010000_s02_purge_and_consent_guards.sql` (per D-116) | false |
| L10 | privacy-policy.md: seven languages (:211) | D-111 item 4 (:739): conflicts for the alpha | As S8 | false (both alpha profiles) |
| L11 | privacy-policy.md: export is a ZIP with letters, recordings and a PDF, works offline (:223) | D-085, agrees | `export/pack.ts:39` renders the PDF; offline not tested here | true |
| L12 | privacy-policy.md: Recently deleted for 30 days (:159, :225) | D-085 (:562), agrees | `apps/mobile/src/lib/account-deletion/logic.ts:64` `GRACE_DAYS = 30`; `capture/erase.ts:2` | true |
| L13 | privacy-policy.md: names hidden on the lock screen by default (:229) | none found | `apps/mobile/src/lib/reminders/prefs.ts:35` `LOCK_SCREEN_NAMES_DEFAULT = false` | true |
| L14 | privacy-policy.md: requests answered within 45 days (:233); replies within 10 business days (:291) | none | No `privacy_requests` table or request log (panel 03, IMP-70) | unverified |
| L15 | privacy-policy.md: access limited to the founder with two-factor authentication (:190) | none | Hosted account settings | unverified |
| L16 | privacy-policy.md: app offered only in the US App Store (:277) | D-083 (:553), agrees | App Store Connect territories | unverified |
| L17 | subscription-terms.md 1.4.0: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always." (:19) | D-082 (:547): keeping a third letter needs Plus: conflicts | `plan.ts:19-23` (`keep_letter` gated) | false |
| L18 | subscription-terms.md: Plus adds Read together after 3 free sessions per book (:23); after Plus ends, Read together needs Plus again (:76) | D-082 (:548), D-083 (:552): conflicts | `plan.ts:14` | false |
| L19 | subscription-terms.md: Plus adds books for more children; first book free (:24); creating another book needs Plus (:76) | D-083 (:552) one pool, books free: conflicts | `plan.ts:13` "Books are free to start" | false |
| L20 | subscription-terms.md: Plus Monthly US $3.99, Plus Annual US $29.99 (:32-33) | D-082 (:547) $4.99 and $49.99: conflicts | `packages/content/src/pricing.ts:9-10` | false |
| L21 | subscription-terms.md: "we do not receive your purchase records" (:41); "We do not email you about Plus" (:56) | D-080 (:524), D-100 (:647): conflicts | As L6; status report off in every profile | true |
| L22 | subscription-terms.md: in-app reminders before a trial ends, before an annual renewal, once a year (:54) | D-094 (:587) agrees on reminders, but requires the terms to say they can come late or not at all; :54 does not: conflicts | `apps/mobile/src/lib/billing/plan-reminders.logic.ts:73` | true |
| L23 | subscription-terms.md: Family Sharing is on (:64) | D-082, agrees | `EarlyLetters.storekit:62` | true |
| L24 | terms-of-service.md 1.5.0: "Writing ... are free, always." (:25, :217-221) | D-082 (:547): conflicts | `plan.ts:19-23` | false |
| L25 | terms-of-service.md: Read together free sessions and further books need Plus (:232-233, :262) | D-082, D-083: conflicts | `plan.ts:13-14` | false |
| L26 | terms-of-service.md: Plus at US $3.99 and US $29.99 (:237) | D-082 (:547): conflicts | `pricing.ts:9-10` | false |
| L27 | terms-of-service.md: recordings stay on your phone; no separate backup today (:23, :119, :205, :207) | D-100, D-102: conflicts | Backup off in every profile | true |
| L28 | terms-of-service.md: co-parents "Neither can remove the other" (:27, :151) | none on undo | `undo_parent_join` lets the inviting parent remove a joined parent for 72 hours (`supabase/migrations/20261015020000_v1_gate_coparent_invites_undo.sql:40-45`) | false |
| L29 | terms-of-service.md: "Anyone can leave a book at any time." (:137) | D-113 (:768) hides Leave in build 2: conflicts | `apps/mobile/src/lib/family/entry.logic.ts:46` `LEAVE_BOOK_OFFERED = false` | false (`preview`) |
| L30 | terms-of-service.md: "we do not receive your purchase records" (:241) | D-080: conflicts | As L6 | true |
| L31 | terms-of-service.md: export free, with a book PDF, works offline (:209, :304) | D-085, agrees | `export/pack.ts:39` | true |
| L32 | consumer-health-data-notice.md 1.2.0: recordings "None reach us" (:30) | D-100, D-102: conflicts | Backup off in every profile | true |
| L33 | in-app-disclosures.md :94 and the shipped microphone string `packages/content/src/permissions.en.ts:14`: "Your recordings stay on this phone." | D-102 (:659) names the microphone string as changing before release: conflicts once backup is on | Backup off in every profile | true |
| L34 | app-store-privacy-labels.md 1.3.0: PostHog SDK after opt-in; Usage Data and Diagnostics collected for Analytics (:21, :62, :66-67) | D-095 (:592): label stays without analytics: conflicts | `capabilities.ts:45-49` | false |
| L35 | app-store-privacy-labels.md: Audio Data not collected (:53) | D-100, D-102: conflicts once backup is on | Backup off in every profile | true |
| L36 | app-store-privacy-labels.md: Purchase History for Analytics only; no server of ours holds purchases (:61) | D-080 (:524), D-095: conflicts | As L6 and L34 | false |
| L37 | subprocessors.md 1.3.0: PostHog is a subprocessor (:27) | D-095 (:592): conflicts | `capabilities.ts:45-49` | false |
| L38 | subprocessors.md: "no audio leaves the phone" (:20) | D-100: conflicts | Backup off in every profile | true |
| L39 | TESTFLIGHT_TESTERS.md 1.0.1: build 1 has no account, letters stay on this phone (:115, :137) | D-106 (:683), agrees | `testflight` server switch off (eas.json:75) | true |
| L40 | TESTFLIGHT_TESTERS.md: build 2 stores letters on the test server; recordings are not uploaded (:116, :140, :172) | D-106, agrees | `preview` server on, backup off (eas.json:47-48) | true |
| L41 | compliance-register.md: "No audio backup or upload in v1.0" (:36) | D-100 (:647): conflicts | Backup off in every profile | true |
| L42 | compliance-register.md: opt-in PostHog analytics (:39) | D-095: conflicts | `capabilities.ts:45-49` | false |
| L43 | compliance-register.md: Plus $3.99 and $29.99; no purchase records on our servers (:40) | D-082 (:547), D-080 (:524): conflict | `pricing.ts:9-10`; `subscription_status` table (:96) | false |
| L44 | privacy-policy.md: co-parent cannot hear your recording through us (:114) | D-073 (:483) sharing is v1.1, agrees | No recording leaves the phone in any profile | true |

## 5. Code against decision, with no public claim yet

| # | Item | Decision | Code evidence | Verdict |
|---|---|---|---|---|
| K1 | Backup upload is a Plus-gated feature | D-111 item 6 (:741), D-104 item 2 (:669): backup is free and does not gate on Plus | `plan.ts:38, :45` (`backup_upload` in `GatedFeature`); `plan.ts:197-217` offers Plus for a user-initiated backup in a Free book | false (code contradicts decision; no caller checked, per SYNTHESIS spot-check 16) |
| K2 | D-100 says "the release build profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`" | D-100 (:647), with its gate (:649) | `production` profile has it off (eas.json:61); `capabilities.ts:6-10` says store profiles stay off until the R-17 gate | true (consistent with the gate; noted because the decision text alone reads otherwise) |
| K3 | The store and site header comments still cite D-085 as current | D-100 (:648) amended D-085 | `store.en.ts:13`, `site.en.ts:7, :82, :125` (comments, not shown to users) | false |

## 6. Pending in open pull requests (not judged final)

These claims are in open PRs and are not on develop or main. Evidence is listed so reviewers can check them before merge; no verdict is given.

| PR | Base | Claim | Evidence to check against |
|---|---|---|---|
| #163 | develop | privacy-policy.md 2.1.0 :27: recordings are not copied to our servers today; backup, once available, is opt-in and encrypted | Backup off in every profile; D-100, D-102 (:659) |
| #163 | develop | privacy-policy.md 2.1.0 :29 and subscription-terms.md 3.1.0 :38: "Our servers do not receive your purchases" | D-080 (:524); `subscription_status` table (`20261016001000_subscription_status.sql:96`); `statusReport` off in every profile |
| #163 | develop | privacy-policy.md 2.1.0 :35: "The app sends us no usage analytics or crash reports." | D-095 (:592); `capabilities.ts:45-49` |
| #163 | develop | privacy-policy.md 2.1.0 :42: at most two parents per book; the other parent cannot see transcripts, fixes or recordings | D-099 (:612) |
| #163 | develop | privacy-policy.md 2.1.0 :50-60: recording backup "will be free" with an escrowed recovery key, a 7-day device rule, logged use with an email each time | D-102 (:659), D-108 (:702), D-111 item 6 (:741); `plan.ts:38, :45` still gates `backup_upload` (K1) |
| #163 | develop | terms-of-service.md 3.1.0 :57: "After the first 72 hours, neither parent can remove the other." | `20261015020000_v1_gate_coparent_invites_undo.sql:40-45` |
| #163 | develop | terms-of-service.md 3.1.0 :59, :111: "A parent can leave a book at any time" | D-113 (:768); `entry.logic.ts:46` `LEAVE_BOOK_OFFERED = false` |
| #163 | develop | subscription-terms.md 3.1.0 :19, :23: first 2 letters free, counted only when your own, with words, and kept; Read together, a book per child, export and deletion always free | D-082 (:547), D-083 (:552), D-103 (:665); `plan.ts:11-35` |
| #163 | develop | subscription-terms.md 3.1.0 :29-30, terms-of-service.md 3.1.0 :97: US $4.99 and US $49.99 with 1 and 2 free months | D-082 (:547); `pricing.ts:8-17` |
| #163 | develop | subscription-terms.md 3.1.0 :51-53: reminders on the subscribing iPhone, which "can arrive late or not at all" | D-094 (:587) |
| #163 | develop | subscription-terms.md 3.1.0 :32: Plus needs iOS 17 or later | D-098 (:607); `apps/mobile/app.config.ts:44` `IOS_DEPLOYMENT_TARGET = '17.0'` |
| #163 | develop | Removes `docs/legal/consumer-health-data-notice.md` (116 lines deleted) | privacy-policy.md 1.4.0 :45 and :271 link to that notice |
| #310 | develop | `features/auth.en.ts`: "Your letters come with you to a new phone, and {child}'s other parent can write in the same book." | `capabilities.ts:143-153`; shown only when sign-in exists (`preview`) |
| #310 | develop | `features/auth.en.ts`: "Your letters are safe on this phone" (error lines); "Your letters stay on this phone. Sign in again any time." (sign out); "A link and a code arrive by email. No password to remember." | Sign-out outbox rule (comment in the same diff, F16, A-REQ-033); not checked |
| #312 | develop | No new claim text in `packages/content` (the `billing.en.ts` change is a comment). The synced held-letter line "It syncs privately with your account" stays hidden until counsel (C10) per the new comment | `apps/mobile` `plus-gate.logic.ts` `SYNCED_HELD_NOTE_CLEARED` (in the PR) |
| #313 | develop | Recordings card: with backup on it names "our backup and the recovery key"; never "only on this phone"; shown only after counsel (C7). Export stays free and offline. `strings.en.ts` change is a comment | PR body rows S42, S43; D-102 (:659); backup off in every profile |
| #314 | develop | Family tab, invite and join copy; `/invite/leave` still answers coming soon | D-113 (:768); `entry.logic.ts:46` unchanged in the PR |
| #302 | main | Website names the founder's child by first name (D-118). A word-level diff of `apps/web/src/content/site.ts` shows one-word replacements and one comment line; no product claim changes | D-118 (:819); D-111 item 1 (:736) superseded in part. A privacy question, not a product-claim question; held for the founder and counsel per panels 03 and 04 |

Related, not in the package list: #309 (main, open, author `vercel[bot]`) rewrites `privacy-copy.ts` to say the site uses Vercel Web Analytics and inverts the guard test (SYNTHESIS spot-check 21). If it merges, P5 becomes false as written today.

## 7. Not verified

- Anything held in App Store Connect, Vercel, Supabase or Resend settings (store text as submitted, territories, prices, Family Sharing, `NEXT_PUBLIC_ANALYTICS`, logging, two-factor authentication).
- Business-practice negatives (never sold, never used for ads, never used to train models, never imitate a voice). No repository check can prove them.
- UI behaviour I did not open: Review undo, Read together, Erase everything, export offline, access rules between books.
- Which scenes of `apps/web/src/content/site.ts` the live site renders today.
- Whether any build-1 or build-2 caller reaches `decide()` for `backup_upload` (K1).
- Rows L1 to L44 cite `docs/legal` line numbers at 6bfb94a9; #163 rewrites most of these files, so the numbers move if it merges.
