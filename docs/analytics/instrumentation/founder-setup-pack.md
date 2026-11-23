# PostHog founder setup pack: consent wording, legal changes, label, counsel brief, tonight's steps

Status: PROPOSED, 20 Nov 2026. Author: `privacy`. Docs only. Nothing here edits `docs/legal/**`, `supabase/**`, `.github`, `eas.json` or any code; proposed text lives in this file. Read beside `analytics.md` (stack), `data-steward.md` (findings F-1 to F-5, #1037), `00-event-standard.md` and the matrix in PR #1054 (`docs/product/prd/PERMISSIONS-AND-DISCLOSURE-MATRIX.md`, not yet merged).

Tags: [V] read or fetched this session (20 Nov 2026), [U] unverified, FOUNDER = only the founder can do or approve it, COUNSEL = counsel must confirm. I am not a lawyer; every legal reading below is a question for counsel.

Founder decision recorded in the ask (20 Nov): PostHog Cloud free tier. That is a hosted free tier of a commercial product, an exception to the free-and-open-source rule (`analytics.md` section 11). The founder has accepted it by choosing it; I note it here so the written record says so.

## 0. Read this first: what tonight can and cannot prove

Three facts from the code on develop make the verification test (section 5, step 12) impossible tonight unless a small code PR lands first. None is a surprise to the analytics work, but the ask assumed a build could send an event.

1. `posthog-react-native` is not in `apps/mobile/package.json` [V grep]. `createClient` in `apps/mobile/src/lib/analytics/index.ts` is `null`, so even with a key set the app uses the no-op provider.
2. `EXPO_PUBLIC_ANALYTICS` is `off` in every profile of `apps/mobile/eas.json` (development, e2e, preview, production, testflight) [V], and `apps/mobile/test/analytics-off-v1.test.ts` fails the build if any profile says `on`. There is no profile called "staging". The closest are `preview` and `testflight`, which both use the EAS environment `preview`.
3. Expo custom environments (such as `staging`) need a paid or enterprise plan per the Expo page [V manage.md]. So a "staging" EAS environment is not free. Use `preview`.

Plan that keeps tonight to about 15 minutes: tonight is steps 1 to 11 (account, region, token, EAS variable, billing, settings, filter). Step 12 (the build test) and step 13 (the deletion drill) wait for a code PR from `analytics` and `mobile` that does four things: add `posthog-react-native@4`, wire `createClient` (the exact line is in the comment at `index.ts` 59 to 68), add a build profile or flip `EXPO_PUBLIC_ANALYTICS` to `on` in `preview` only with the test updated (the rewrite is already described in `analytics.md` section 1a, step M6), and add the consent-before-send test. That PR needs the founder's go (the `eas.json` change is the founder's per `analytics.md` M6). I have not opened it; it is not my path. Open item for CTO.

Also never run `npx @posthog/wizard` [V PostHog React Native page lists it as guided setup]. It rewrites code and can switch on autocapture and lifecycle events; `packages/analytics/src/posthog.ts` pins those off on purpose.

## 1. Consent sheet wording (FOUNDER-WORDING approval)

Today's text (`packages/content/src/strings.en.ts` line 1084, `analyticsConsent`) [V]:

- body: "Share how you use the app, like which screens you open and when something crashes. Never your letters, recordings, photos or anyone's names."
- detail: "Nothing is shared unless you say yes. Saying no changes nothing else."
- buttons: "Share usage" and "Don't share".

Problems with it: it says "when something crashes", which is untrue today (there is no crash tool; PR #805 already proposes removing the claim); it does not say what turning it off does to what was already sent; it does not list "how fast the app runs", "button taps", or the never list in full (no child name, birthday, location, religion or background). Nothing ships until this wording is approved and the deletion promise in it is proven (section 5, step 13).

What the code actually sends, so the list is true [V `packages/analytics/src/posthog.ts`]: our own typed events only (screens opened, controls tapped, speed buckets, a few events such as a letter saved with no content); the SDK adds only `$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type`. It drops the phone's name, language and time zone. So the founder's "phone model" is not what is sent: it is the iPhone software version and a coarse device type. The default text below says "your iPhone's software version". If the founder wants the exact model, that is a new property and a new decision. Persistence is in memory only, and a random id is made at the yes and thrown away at the no.

### 1.1 Default wording (recommended)

Keys follow the existing `analyticsConsent` shape so `content` can drop it in. `{app}` and `{child}` are filled from brand and the child record; neither is typed literally.

| Key | Text |
|---|---|
| `title` | Help improve {app}? |
| `body` | If you say yes, {app} sends us simple counts about how it is used, so we can fix what is slow or confusing. We see which screens you open, which buttons you tap, how fast the app runs, and your app version and iPhone software version. We never see your words, recordings, photos, {child}'s name or birthday, where you are, or your family's religion or background. |
| `detail` | Nothing is sent unless you tap Share. Until you choose, nothing leaves your phone. |
| `turnOff` | You can turn this off any time in Settings, Privacy. Then nothing more is sent. What we already received is kept for up to 12 months under a random number that is not your name, then deleted. If you delete your account, we ask for it to be deleted sooner, and that can take up to about two months to finish. |
| `yesButton` | Share usage |
| `noButton` | Don't share |

Two buttons, same size, same style, same visual weight; Share is not the filled primary and Don't share is not a text link. Tapping neither is not a choice; dismissing the sheet counts as "ask again later" under the two-offer cap, not as yes.

Why `turnOff` is written this way: data-steward findings, each checked against what the sheet may promise [V `data-steward.md` section 7].

| Finding | What it means for the words |
|---|---|
| F-1 No deletion route without an account | The sheet must not say "turn it off and we delete what we hold". It says what is kept and for how long. The E83 "withdrawal deletes" idea stays a counsel decision (FD-4) and is not promised here |
| F-2 A person profile may not exist, so deleting by id may delete nothing | The "sooner" deletion sentence is conditional on the staging deletion drill passing (section 5, step 13). If the drill fails, remove that sentence |
| F-3 PostHog answers 202 even when a deletion fails | We say "ask for it to be deleted", not "deleted" |
| F-4 Deletion is asynchronous and PostHog's backups roll off later | "Up to about two months". PostHog's deletion page gives about two weeks for event backups and monthly clean-up [V, via data-steward 5]; I did not re-fetch it |
| F-5 The phone keeps at most 20 old ids | Not in the sheet; a person who switched it on and off more than 20 times leaves one period undeletable. Low risk, fix is IN-DS-03 |

Records (PRIV-R21 shape, consent record): Shown = this text with its version and `rendered_sha256`. Records = on the phone `scribe.analytics.consent` and the random id; on the server one `policy_acceptances` row (document `analytics`, version, action, method, surface, hash, `context.usage`). Never = the analytics id in that row, an IP address, a device model, any join to a login session, any collection before the yes. Decline = nothing is sent, every feature works, at most two offers. Source: `data-steward.md` section 6.

Content-rule check by eye (not run): ASCII only, no dash characters, no curly quotes, no ellipsis, no emoji; no fear, guilt or loss language; no gap counting; no sentence says anyone or anything writes for the parent; child is `{child}`. `packages/content/test/rules.test.ts` is the real check and has not been run against this text (disk). `content` must run it. One rule to confirm: the BRAND.md glossary may not allow "random number" or "account" in the sheet. [U]

### 1.2 Alternative wording (shorter body, list behind a tap)

Use this if the founder wants a quieter sheet. The list is one tap away, so the front is shorter. The cost: a parent who does not tap sees fewer specifics, and counsel may want the never list in front.

| Key | Text |
|---|---|
| `title` | Help improve {app}? |
| `body` | Share simple counts about how {app} is used, so we can make it faster and clearer. Never your words, recordings, photos or {child}'s details. |
| `moreLink` | See exactly what is sent |
| `moreBody` | Sent: which screens you open, which buttons you tap, how fast the app runs, your app version and iPhone software version. Never sent: your words, recordings, photos, {child}'s name or birthday, where you are, or your family's religion or background. Off until you say yes. |
| `turnOff` | Same as 1.1. |
| buttons | Same as 1.1 |

Approvals: FOUNDER-WORDING (which of 1.1 or 1.2, and the final words); COUNSEL (the `turnOff` retention and deletion sentences, and whether "random number" is enough of a description). Default if the founder says nothing: 1.1.

## 2. Proposed legal text changes (founder merges `docs/legal/**`; counsel confirms each)

Line numbers are on develop at `5557490`, 20 Nov 2026 [V]. "PR 1054" means the matrix and its section 5 table; I point to those rows and do not repeat them. Rows marked NEW are not in PR 1054.

| # | File | Line | Current text | Proposed text | Why |
|---|---|---|---|---|---|
| L1 | `privacy-policy.md` | 24 | "Analytics. There are none in any build." | "Analytics. Off until you say yes. If you say yes, the app sends us counts about how it is used (which screens you open, which buttons you tap, how fast the app runs, your app version and iPhone software version) under a random number that is not your name or your account. Never your letters, recordings, photos, your child's name or birthday, your location, or your family's religion or background. You can turn it off any time in Settings, Privacy." | Contradicts the product once analytics ships. Same gap as PR 1054 row 12 and section 5 row "Which builds"; this row gives the full replacement text |
| L2 | `privacy-policy.md` | 45 | "In no current build does the app send us usage analytics or crash reports." | "Unless you say yes to usage sharing, the app sends us no usage analytics. We do not collect crash reports." (change the second sentence when and if a crash tool ships) | Same statement, same reason. Crash stays "none" because there is no crash tool [V; PR 805 removes the crash claim from the sheet] |
| L3 | `privacy-policy.md` | 45 | "We do not collect your location ..., contacts, photos, advertising ID or payment details." | PR 1054 row 4 and section 5: replace "photos" with "your photo library. If you add a picture to a letter, we keep that one picture." | Photos statement contradicts the product. Not duplicated here; whether photos sync is [U] in PR 1054 |
| L4 | `privacy-policy.md` | new section (near 2 or 9) | none | "How we measure the app (if you say yes). Provider: PostHog (US cloud, region chosen at set-up). What: the counts above, a random number made when you say yes and discarded when you say no. IP address: discarded on arrival. Kept: 12 months, then deleted. Turning it off stops anything new. What was already sent stays until the 12 months end; if you delete your account we also ask PostHog to delete it. We cannot look you up by name in it, so we cannot send you a copy." | NEW. Retention, deletion limits (F-1 to F-4) and the access limit in `data-steward.md` section 7 (DSR paragraph) need a home. Counsel to confirm that "cannot match to a person" suffices |
| L5 | `app-store-privacy-labels.md` | 62 | Usage Data: "No (changed in 1.4.0) ... No analytics SDK in any current build ..." | See section 3 below for the row values; text of the Notes cell: "Opt-in analytics (PostHog), off until the parent says yes. Product Interaction and Other Usage Data. Not linked to identity (random id, never joined to account). Not used for tracking. Purpose: Analytics." | Label must match the build when the flag turns on |
| L6 | `app-store-privacy-labels.md` | 63 | Diagnostics: "No crash SDK and no analytics in v1.0 ..." | Performance Data: Yes (speed buckets), same terms as L5. Crash Data: No (no crash tool; Apple's own reports are Apple's collection) | Matches `perf` events; crash row stays No unless `ops` adds a tool |
| L7 | `app-store-privacy-labels.md` | 85 and 123 | 85: "A later build with opt-in analytics (v1.1) ... Linked or Not linked question returns"; 123: "No analytics or crash SDK is constructed ... if one is, re-run section 3." | Mark 85 as done by the production release and tick 123 as "SDK constructed only after a yes; section 3 re-run on [date]" | The checklist must say what the build does |
| L8 | `app-store-privacy-labels.md` | 54, 117 and Face ID row 116 | Photos: "No photo feature in v1.0"; "Photos ... Not used"; Face ID "Not used unless the app lock ships" | PR 1054 section 5, rows for `app-store-privacy-labels.md` | Already proposed there. Not repeated |
| L9 | `terms-of-service.md` | after 3.4 (line 54), new 3.5 | none | PR 1054 section 5 proposes the device-access sentence (microphone, notifications, Face ID, photos one at a time). NEW addition for this pack: append "The app can also share simple counts about how it is used, but only if you say yes, and you can turn that off in Settings, Privacy." | The founder wants the device-access line at sign-up; analytics is one of the things the parent should hear about in one place (PR 1054 gap 4) |
| L10 | `terms-of-service.md` | 1.3 (line 34) | "You accept these Terms by using the Service, and again when you create an account." | PR 1054: add "The agreement line you see when you sign in is your acceptance." | Already proposed there |
| L11 | `in-app-disclosures.md` | table 1 | no analytics consent sheet row | Row: Analytics consent sheet, text from section 1 of this pack, version and hash recorded, surface "after first saved letter" | PR 1054 row 12 notes the gap. Needs the final sheet words, so it follows founder approval |
| L12 | `subprocessors.md` | table at lines 17 to 22, and line 31 | No PostHog row. Line 31: "The app has no analytics or crash reporting service." | Add row: "PostHog Cloud (US) / What it does for us: counts how the app is used, only if you say yes / What it handles: a random number and the usage counts listed in the privacy policy; no letters, names or recordings. IP address discarded." Change line 31 to "The app has no crash reporting service." | NEW. Required by PRIV-R12 and `data-steward.md` section 9 |
| L13 | `data-policy.md` | 4.5 line 156; 4.6 line 166 | Row exists: "PostHog, allowlisted events, random analytics id, T, 12 months (proposed; set in project settings), delete_events=true on account deletion"; processor row: bulk delete "at request time ... asynchronously off-peak" | 156: replace "(proposed; set in project settings)" with "12 months (free plan fixed retention is 1 year [PostHog pricing page, 20 Nov]; set and screenshot in the runbook)". Add "Region: US. One project. Free plan, no card." to 166. Add: "Deletion is accepted (HTTP 202), not confirmed; checked by the staging drill (IN-DS-06)" | The data map row exists; it needs region, plan and the honest "accepted not deleted" (F-3) |
| L14 | data map (`docs/legal/data-map.yaml`) | file does not exist [V data-steward section 0] | none | Rows are drafted in `data-steward.md` section 9 (proposed rows `analytics.event.*`, `analytics.screen`, etc.) | Point only; IN-DS-01 owns creating the file |
| L15 | `delete-account-page.md`, `DELETION_AND_EXPORT_SPEC.md` | spec line 89 (14 days) | "complete within 14 days" for processors | Counsel to reconcile with PostHog's asynchronous deletion (about two months at worst) | Already F-4 and drift item 4 in `data-steward.md`; flagged here so it is not lost |

Not in this table because PR 1054 owns it: microphone and Face ID label rows, notification primers, whether photos sync, the sign-up agreement mechanics (Q-D), and the photo-access founder decision. I have no change to PR 1054 gaps 1, 3, 5, 6, 7.

## 3. App Store privacy label change (COUNSEL and FOUNDER click)

The label is edited by the founder in App Store Connect, under App Privacy. I cannot and must not edit it. Changes go live only with the build that turns the flag on; if the label goes first, it is wrong in the other direction.

| Data type (Apple's name) | Category | Collected | Linked to the user | Used to track | Purpose | Status |
|---|---|---|---|---|---|---|
| Usage Data | Product Interaction (screens, taps) | Yes | No (default) | No | Analytics | COUNSEL, FOUNDER click |
| Usage Data | Other Usage Data (app version and OS version, if counsel counts them here) | Yes | No (default) | No | Analytics | COUNSEL, FOUNDER click |
| Diagnostics | Performance Data (speed buckets) | Yes | No (default) | No | Analytics | COUNSEL, FOUNDER click |
| Diagnostics | Crash Data | No, unless `ops` adds a crash tool | n/a | n/a | n/a | Revisit only if a crash tool ships |
| Usage Data | Advertising Data | No | n/a | n/a | n/a | Unchanged |
| Data Used to Track You | none | No | n/a | n/a | n/a | Stays empty: no ads, no ATT prompt, no data broker (PRIV-R13) |

Why "not linked" is only a default: the random id is made at the yes, never joined to an account, user id, device id or email, and thrown away at the no (`consent.ts`) [V data-steward 4]. But `data-steward.md` section 10 and TRACKING_PLAN 10 note that Apple treats data that is personal data under privacy law as linked, and a persistent pseudonym may count. Counsel question Q7 in section 4 decides it. If counsel says Linked, change the third column and nothing else.

Also in the same release (not mine to do, listed so none is forgotten): re-run `PrivacyInfo.xcprivacy` (PRIV-R18, `apps/mobile/src/lib/privacy-manifest.ts` follows the build switches); teach `scripts/release/label-effect.mjs` and its `TRACKING_SDK` list about `posthog-react-native` on purpose, with the label change in the same PR (`analytics.md` section 1a).

## 4. Counsel brief: PostHog Cloud as a new subprocessor

One project, free plan, no card. Each question has a default so the founder can proceed if counsel is slow; defaults are mine, not legal advice.

| # | Question | Default |
|---|---|---|
| Q-PH-1 | US or EU region. PostHog's GDPR page recommends EU Cloud (Frankfurt) for EU data, and for US Cloud "we also recommend you anonymize any EU user data" [V posthog.com/docs/privacy/gdpr-compliance]. Our users, Supabase and the code default (`https://us.i.posthog.com`; deletion function default `https://us.posthog.com`) are US; the app is English only today (`EXPO_PUBLIC_ENGLISH_ONLY` on) [V eas.json] | US, if the first App Store release is US-only. If it is open to EU or UK storefronts, ask counsel; EU needs `EXPO_PUBLIC_POSTHOG_HOST` and the Supabase secret `POSTHOG_HOST` changed. Treat the region as permanent: I did not find a documented way to move a project between regions [U] |
| Q-PH-2 | DPA. PostHog says every Cloud customer, including free, can sign one, self-serve, from the app's legal page (New, Data Processing Agreement), emailed by PandaDoc, already countersigned by PostHog [V posthog.com/docs/privacy]. Is the standard DPA acceptable, and what legal name goes in it? | Counsel reads it first; FOUNDER signs only after. Nothing is sent to production before it is signed |
| Q-PH-3 | International transfer for US Cloud: the page I read does not mention SCCs or the EU-US framework [V]. Do we need either, given a US-only launch? | No action if US-only; ask if EU storefronts open |
| Q-PH-4 | Retention. Free plan retention is 1 year [V posthog.com/pricing.md]. Whether we may set it shorter on the free plan is not documented [U]. data-policy proposes 12 months; COUNSEL_PACKET Q51 owns it | 12 months, the plan's fixed value; the privacy policy says 12 months and the runbook screenshot proves it (DS-R01) |
| Q-PH-5 | Deletion limits. PostHog person deletion answers 202 while failures show in a separate field (F-3); events without a person profile may not be deletable (F-2); deletion runs off-peak and backups roll off later (F-4); no route without an account (F-1). Is the sheet sentence in section 1.1 enough, and may we say "deleted" in the policy? | Say "ask for deletion" and "up to about two months". The drill (step 13) decides whether the sentence stays |
| Q-PH-6 | Is a random per-consent id, with behaviour attached, personal data for us? Does it need a notice beyond the sheet? Access and portability: we cannot look a person up (data-steward 7) | Treat as personal data for deletion and DSR; policy says we cannot match it to a person |
| Q-PH-7 | Linked or not linked (label), see section 3 | Not linked |
| Q-PH-8 | Single project. The free plan has one project [V pricing.md], so test builds and production share it. Test events are marked by a `build_kind` property and filtered out of reports; the drill deletes only test ids | Accept. No second project, no card |
| Q-PH-9 | Free-tier terms can change, and billing limits "lose data forever" when hit [V posthog.com/docs/billing/limits-alerts]. Is losing events at the limit acceptable? | Yes: product data, not content. Expected load is well under the limit (`analytics.md` section 8: about 240k a month at 1k families) |
| Q-PH-10 | The first-run summary event `analytics_opted_in` (TRACKING_PLAN 8) and relationship events (`member_left`, `member_removed`) | Keep gated; relationship events dropped if counsel hesitates (`data-steward.md` FD-5) |

Subprocessor notice: the 30-day notice rule in `subprocessors.md` is for vendors that handle content; PostHog handles none, so per data-steward 10 it does not apply. COUNSEL to confirm.

## 5. Tonight, step by step (Karma on the founder's Mac, founder present)

Founder 15 minutes. Karma does the typing except where marked. Rule for every step: no secret is pasted into chat, a doc, a commit or a log; the founder types his own password and email code himself.

| # | Step | Who | Check |
|---|---|---|---|
| 1 | Open https://posthog.com in the founder's browser and choose Get started free. | Karma drives, FOUNDER present | Page says no credit card |
| 2 | Sign up with the founder's work or personal email; the founder types the password and the emailed code himself. Karma looks away from the screen at those two fields. | FOUNDER only | Account exists. Never add a card |
| 3 | Pick region at the region prompt. Recommendation: US Cloud, for the reasons in Q-PH-1 (US users, US Supabase, code defaults to US). Do this before sending any event; I did not find a documented way to move a project between regions [U]. If the founder wants EU, stop and set `EXPO_PUBLIC_POSTHOG_HOST` and `POSTHOG_HOST` to match | FOUNDER decides | Project URL starts with us.posthog.com |
| 4 | Name the organisation and the one project plainly (for example "Early Letters production"). Skip every product tour, template and "invite team" prompt. Do not install anything from the onboarding wizard. | Karma | One project only |
| 5 | In project settings, copy the Project token (starts with `phc_`) and the numeric Project ID. The token is not a secret: it ships inside the app bundle and Expo says "Everything in client bundles is readable by end users" [V Expo manage.md]. | Karma | Token noted in the Mac's password manager, not in chat |
| 6 | Set the token as an EAS variable. Current command per Expo docs, read 20 Nov [V docs.expo.dev/eas/environment-variables/manage]: `eas env:set --name EXPO_PUBLIC_POSTHOG_KEY --value <the phc_ token> --environment preview --visibility plaintext`, then again with `--environment production`. Verify: `eas env:list --environment preview`. The old `eas secret:create` is not mentioned on the current Expo pages; I could not confirm it is removed, so treat it as legacy and do not use it [UNVERIFIED]. Use `plaintext`, not `secret`: a secret is kept on Expo servers and the Expo pages say secrets are not available during updates and I could not confirm an `EXPO_PUBLIC_` variable can be a secret [UNVERIFIED]. The `EXPO_PUBLIC_ANALYTICS` flag stays `off` tonight; setting the key alone sends nothing (`postHogKeyForBuild` returns no key while the flag is off) [V] | Karma, FOUNDER present | `eas env:list` shows the name; value matches token |
| 7 | Real secrets, different from the token. The deletion function needs a personal API key from PostHog (Settings, Personal API keys) scoped to person write only, plus the project id, as Supabase function secrets `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_HOST` only if EU [V `analytics-forget/handler.ts` lines 85 to 87]. Create the key with the founder typing nothing but approving; paste it only into the terminal command for `supabase secrets set`, never into a file. The insights job key (Query Read only) comes later and is not needed tonight. The exact scope names in the PostHog key form: [UNVERIFIED] | Karma, FOUNDER approves | `supabase secrets list` shows the three names (values hidden) |
| 8 | Billing: do not add a card. Organization, Billing: confirm plan is Free. Billing limit is set per product in Organization, Billing, at the bottom of each product, "Set billing limit", Save [V posthog.com/docs/billing/limits-alerts]. If it is offered without a card, set it to the lowest amount; at the limit PostHog stops ingesting and the extra data is lost. Whether the limit is offered on the free plan without a card: UNVERIFIED. No card means no charge either way | Karma, FOUNDER present | Screenshot of the plan page for the runbook |
| 9 | Project settings to switch off or check (names as PostHog shows them; exact labels and locations are UNVERIFIED unless noted, take a screenshot of each for the runbook): Autocapture (off). Session replay (off). Feature flags (do not create any; the app uses our own remote config and the SDK already disables them) [V posthog.ts]. Exception autocapture / error tracking (off). Surveys (off; the SDK also sets `disableSurveys`). IP capture: Settings, Project, General, "IP data capture configuration" set to discard client IP data [V posthog.com/docs/privacy/data-collection]. GeoIP: PostHog says discarding the IP does not stop location enrichment because transformations run first, so also disable the GeoIP enrichment transformation in the project's transformations [V same page]. Web analytics and heatmaps (off). Data retention: leave at the free plan value, note it | Karma | Nine screenshots, none showing a token |
| 10 | Internal and test users: PostHog can filter internal and test users out of insights. I could not load the PostHog help page for it, so the steps are UNVERIFIED. Default plan: filter on the event property `build_kind` (proposed in `00-event-standard.md` section 6, not yet in `catalog.ts` [UNVERIFIED], so it comes with the code PR) not equal to production, so preview and testflight builds never count; the founder's own phone on a production build is not a separate class and is accepted. Create the filter in Project settings, Filter out internal and test users, or as a saved filter on every insight if the setting is not offered | Karma | A test event from a preview build is hidden in the default insight |
| 11 | Reverse proxy: default NO for now. PostHog recommends one so ad blockers do not block events [V React Native page], but our events are product measurement, not revenue; iPhones rarely run domain blockers, and a proxy adds a host that sees every request (an extra processor row, a Vercel function, a cost). Revisit if reports show a gap between sessions and events. Host stays the code default `https://us.i.posthog.com` | FOUNDER can overrule | Written down in the runbook |
| 12 | Verification test, staging profile. Needs the code PR in section 0 first, so it is not tonight. Outline: build `preview` with `EXPO_PUBLIC_ANALYTICS=on` and the key from step 6, on a throwaway Asha account. (a) Install, open, do things, say nothing to the sheet: a network proxy or the PostHog Live events page shows zero events, and `track()` returns `dropped_no_consent` (`packages/analytics`). (b) Say Don't share: still zero. (c) Reset, say Share: exactly one registered event arrives (for example `screen_view` or the first typed event), with only the allowlisted properties and `$geoip_disable: true`; no `$ip`, no `$device_name`, no `$locale`, no `$timezone`, no `$set`. (d) Withdraw in Settings: zero further events, the id is retired. Pass means all four hold; one leak means stop and send the payload (not the content) to `analytics` | Karma and `qa`; founder watches, FOUNDER taps the sheet | Payload saved without any token |
| 13 | Deletion drill (IN-DS-06), outline for a throwaway session after step 12: send three events under a bootstrapped test id; call `analytics-forget` through the real function with the throwaway account; wait for PostHog's off-peak run; confirm the events are gone (F-2: a person profile may need to exist first; F-3: read the response body for `persons_queued_for_deletion` and `deletion_errors`); record time taken. Repeat after withdrawing and re-consenting to prove the old id is retired and reachable. If any event survives, section 1.1 `turnOff` loses its second sentence and F-2 or F-3 becomes a release blocker. Only test ids are deleted; use `build_kind` to see them | `qa`, Karma, founder not needed | Result in the runbook |

Founder-only in this list: step 2 (password and email code), step 3 (region choice), step 7 approval (key creation), step 8 (any card decision, which is: none), step 11 (can overrule), step 12 (tapping the sheet on his phone), signing the DPA (Q-PH-2, after counsel reads it), clicking the label change in App Store Connect (section 3), and approving the wording in section 1.

Not tonight, and who: the code PR (`analytics`, `mobile`, then CTO review); legal file merges (founder); `eas.json` change (founder); App Store label click (founder); counsel answers (counsel).

## 6. Open items

1. Code PR needed before steps 12 and 13 (section 0). CTO and `analytics`.
2. "Phone model" in the founder's list is not what is sent; default text says software version (section 1). FOUNDER-WORDING.
3. Sheet text and legal rows are all PROPOSED, none approved. Run `rules.test.ts` on the final sheet text.
4. The in-flight `posthog-standard` PR on `docs/instr-posthog-standard` was not on the remote when I looked, so nothing here is checked against it [UNVERIFIED]. Reconcile when it lands.
5. UNVERIFIED items to confirm in the PostHog UI tonight: billing limit without a card, GeoIP transformation location, internal-user filter, personal API key scope names, region change, retention setting.
6. Nothing was run: no test, no build, no network call to PostHog. Disk was tight; the clone was sparse and is deleted after the push.

Signed: privacy
