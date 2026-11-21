# Q-016: In-app feedback with tracking, from a v1.0 that keeps everything on the phone

Numbering: the request called this Q-015, but PR #89 already holds Q-015 (first run defaults) and Q-013/Q-014 are on PRs #84 to #88. This entry takes the next free number. `docs/agents/DEBATES.md` is not changed.

- **Raised by:** the founder, 4 Oct 2026: "a feedback button that triggers feedback collection and tracking ... who the user is, timestamp, app version, page id, screenshot if applicable auto captured ... agents quality should validate and assign via harness for product to review and engg to fix. Review with legal compliance brand as needed."
- **Status:** Escalated to the founder (it changes the App Store privacy label and the Privacy Policy, both of which say nothing leaves the phone).
- **Date:** 4 Oct 2026. Sources read: `origin/develop` (cfdca3f), `origin/docs/legal-v1-finalize` (PR #81), `origin/docs/development-definitions` (PR #79), `origin/chore/agents-operating-system` (PR #4), `origin/main` (`apps/web` notify), `origin/qa/journey-flows`. Apple pages read 4 Oct (summaries by the fetch tool, not verbatim). Blocked from here, so **unverified**: docs.sentry.io, docs.expo.dev, docs.github.com, vendor sites (Luciq, Shake), EUR-Lex, Apple's App Attest and TestFlight help pages.

## 1. The question

How does a parent tell us something from inside the app, in a form that is traceable (who, when, which build, which screen, optionally a picture), flows into the agent harness, and still honours "your letters never leave your phone"?

## 2. Facts that shape the answer

**Corrections to the brief (found while reading).**
1. **The repo is public** (`gh api repos/...`: `private: false`). A GitHub issue there is public. The harness text says so too ("On this public repo", OPERATING_MODEL 1). Feedback issues therefore need a **separate private repo**, or must hold no free text.
2. **"No backend of ours" is not quite true.** We run a website on Vercel with Resend and a Resend list (`/api/notify`; policy section 3 and `subprocessors.md` already name both). What v1.0 lacks is a server the *app* talks to. Feedback would be the first time it does. That is the label change, not Supabase.
3. **develop's decision log describes a server version** (D-054 sign-in, D-073 encrypted backup, D-080 status reports). The founder's v1.0 call is on-device: `EXPO_PUBLIC_SERVER_FEATURES=off` (c1764f9, #54), `capabilities.ts`. PR #87 (Q-014) records that D-073 was never amended. I treat on-device as binding and server features as v1.1.
4. **The harness is not on develop.** It lives on PR #4 (`chore/agents-operating-system`), stacked under #39. Its agents run on open-weight models through OpenRouter (HARNESS 3). Anything an agent reads in an issue is sent to that model host. This is a data flow in its own right (section 6).

**Apple (read 4 Oct).**
- "Collect" means transmitting data off the device so that we or our partners can access it for longer than needed to service the request in real time. A feedback note we keep is collected. Whether an email the person sends from their own mail app counts is unclear to me: **unverified**, counsel.
- The optional-disclosure exception needs all of: no tracking, no advertising or other purposes, infrequent and optional, **and** "the user's name or account name is prominently displayed alongside other data elements" with the person affirmatively choosing each time. We have no account name. I read this as: the exception does **not** fit us, so a form means "Data Collected".
- Linked: "Personal Information ... as defined under relevant privacy laws are considered linked." An install id plus optional email is linked. Tracking stays No (no third-party data, no ad use).
- Types that would apply: Contact Info > Email Address (optional); User Content > Customer Support (the note) and, for a picture, Photos or Videos or Other User Content (I could not confirm which Apple wants for a screenshot: **unverified**, declare the stricter one); Identifiers > User ID (the install id; Device ID if counsel reads a per-install id as device level); Diagnostics > Other Diagnostic Data (version, OS, model). Purpose for all: App Functionality (support), not Analytics.
- 5.1.1(i): the policy must say what is collected, how, for what, retention and deletion. 5.1.1(ii): consent, easy to withdraw. 5.1.1(x): asking for an email is fine if optional and nothing is conditional on it. **5.1.2(i): sharing personal data with third parties "including with third-party AI" needs a clear disclosure and explicit permission.** 5.1.1(iii): use the out-of-process picker where possible.

**What the code gives us (develop).**
- Settings has a Help row that opens `mailto:` with a fixed subject and no content (`settings/index.tsx`; LEGAL-REQ-014 bans content in "support prefill"). Settings home lists each child's name, so **even the Settings screen is not safe to screenshot**.
- Stable page ids already exist: `ROUTE_MAP` in `packages/analytics/src/routes.ts` (a closed enum, template routes such as `letter/[id]`, never concrete paths). `expo-constants`, `expo-device`, `expo-crypto`, `expo-secure-store`, `expo-network` are already dependencies. `react-native-view-shot` and a mail composer are not.
- The journey ids J01-01 to J20 are test fixtures on `qa/journey-flows` (not merged, #83). They are not runtime ids. I use the route enum at runtime and map J## to a route in the triage table (section 6).
- Analytics is opt-in, L2 only; free text is L4 by default (DATA_CLASSIFICATION 1.1.3). Feedback must not ride on PostHog.
- TestFlight already has Apple-run screenshot feedback. DEVICE_TEST_PLAN TF-07 and TDD 07 OQ-4 record the open risk: that screenshot can capture letter text, and whether it can be disabled is **unanswered**.
- /api/notify (main): per-client in-memory limiter (5 per 10 minutes), honeypot `company`, time on page, same-origin check, 2 KB body cap, content-free logger. Its own comments say the in-memory limiter only slows a determined client and the real control is a Vercel WAF rule. A native app sends **no Origin header**, so the same-origin check passes for anyone and the honeypot only stops dumb form bots.

## 3. Part A: transport options

| | (a) Form to a Vercel endpoint, then email and private issue | (b) Mail composer with prefill | (c) Hosted feedback service | (d) Supabase table |
|---|---|---|---|---|
| Label (Apple) | **Data Collected** (above) | Probably unchanged: the person's mail app sends, our app transmits nothing. Unverified, counsel | Data Collected, plus the vendor is a third party with the data | Data Collected, and the server-features claims in labels 2 go false |
| Who the user is | Install id, optional email | The sender's email address, always (least anonymous) | Vendor's device or user id by default | Install id now, account id from v1.1 |
| Abuse | Open endpoint: rate limit, WAF, daily cap, honeypot, app key; spam lands in our inbox only | None to us (their mail account, our spam filter) | Vendor's controls | Anon insert needs RLS and quotas; migration needs `approve-migration` and red team (D-041) |
| Cost | Vercel and Resend free tiers likely enough for beta (limits **unverified**); GitHub free | Zero | Per seat or per event, unverified | Supabase free tier; screenshots in Storage |
| Build size (D-065) | One small JS module; screenshot adds a native module (size **unverified**, expect well under 1 MB; measure at the next release) | Mail composer native module, size unverified | An SDK, often large and with auto capture | Supabase client (currently not built) |
| Offline queue | Ours: a local outbox, send on next open | The Mail app queues; we cannot see it | SDK queues | Ours, same as (a) |
| Delivery guarantee | At least once with an idempotent id; 200 only after email accepted | None. We cannot know it was sent. Many iPhones have no Mail account configured, so the composer is unavailable (the fallback is plain `mailto:`) | Vendor's | At least once, DB dedupes by id |
| Tracking and harness fit | Full structured record, machine readable | Weakest: free text in an inbox; metadata only as pasted lines | Vendor's inbox or board, then a webhook | Best long term (queryable, deletes with account) |

**(a) in detail.** The app POSTs JSON to `https://earlyletters.com/api/feedback` (new route, same shape as notify). The function validates a closed schema, then (1) emails the full record, including free text and any picture, to a private inbox through Resend (already a provider), and (2) creates a **content-free** issue in a private repo (section 6). Email is the durable record; if the issue call fails the request still succeeds and a content-free log line says so.

**(b)** is what the Help row already is. It is honest and free, and it is the only option that can ship in v1.0 without touching the label, but it cannot carry a screenshot attached by the app in a way we can promise (the composer's attachment support is **unverified**), and it gives us no id, no queue and no assurance.

**(c) Vendors considered (none verified here, none recommended):** Sentry User Feedback, Luciq (formerly Instabug), Shake, PostHog surveys, a hosted idea board (Canny, Featurebase and similar), and Apple's TestFlight feedback. I could not read any vendor's data terms from this environment. General fit: an SDK that captures screens or sessions on its own contradicts section 5; a third party holding screenshots is a new subprocessor under 5.1.2(i); PostHog would put free text into an L2-only pipeline. Only TestFlight is already in use, and only for the beta.

**(d)** is the right home at v1.1 (account deletion erases the rows, Storage holds pictures behind signed URLs). In v1.0 it would mean constructing a Supabase client the build deliberately does not have, so it is rejected for now.

## 4. Part B: the record

One JSON document per note, validated by a strict schema in `packages/api` (or `apps/web` until that package takes feedback), unknown keys rejected, every string length capped.

| Field | Type and source | Class |
|---|---|---|
| `feedback_id` | `FB-<yyyymmdd>-<4 base32>`, made on the phone; the idempotency key and the code shown to the person | L2 |
| `created_at` | device clock (untrusted); server adds `received_at` in UTC | L2 |
| `app_version`, `app_build` | `expo-constants` (`1.0.0`, `12`); `app_env` (`preview` or `production`) | L2 |
| `os`, `device_model` | `ios 26.0`; Apple model identifier such as `iPhone16,1` (shared by every unit of that model) | L2 |
| `locale` | device locale such as `en-US` | L2 |
| `route` | value from `ROUTE_MAP` (new `settings_feedback` and `not_found` added), captured **before** the sheet opens; `surface` optional (`sheet`, `error_boundary`) | L2 |
| `category` | `bug`, `idea`, `praise`, `question`, `privacy` | L2 |
| `text` | free text, 2,000 characters, required for all but praise | **L4** |
| `email` | optional, only if typed for a reply | L3 |
| `screenshot` | optional JPEG, at most 1 MB, phase 2 | **L4** |
| `consent` | `send: true`, `reply_email: bool`, `screenshot: bool`, `notice_version` (Privacy Policy version shown) | L2 |
| `install_id` | random UUID made on the phone | L3 (person identifiers are at least L3) |

**Install id.** Generated with `expo-crypto`, stored in the app's own database (`settings` table), **not** the Keychain: Keychain items can outlive an uninstall, which would make it a de facto device id. It dies with the app, rides in iCloud backup like everything else, is never the PostHog id, and is never joined to it. "Reset my feedback ID" in Settings, Privacy makes a new one. The phone keeps a short local list of past references (code, date, category, never the text) so a person can ask us to delete a note by quoting its code.

**Explicitly not collected:** IDFA, IDFV or any Apple device identifier; the device name; IP address stored (the endpoint sees it to rate limit, in memory only, and Vercel's platform logs hold it as for any website visit, which the policy already says); location; contacts; other apps; battery or memory; carrier; the analytics id; Plus status or any purchase data; letters, transcripts, recordings, child name or birthday, signature, dictionary terms, spoken language (L4 per Q-004); the book's size or letter counts. No analytics event is sent for feedback in either phase.

## 5. Part C: the screenshot

**What the person gets.** A picture is **never** attached silently. The capture is taken at the moment they tap Feedback (so it shows the screen they meant), held in memory or the app cache, and shown in a preview with one plain sentence about what is visible and an equal "Attach" and "Do not attach". It can be removed at any time before Send.

**Default is deny.** Each route has a policy in one file with a test that every `ROUTE_MAP` value has one. A new screen is blocked until someone decides.

| Policy | Routes (proposed) | Behaviour |
|---|---|---|
| `safe` | `settings_plus`, `settings_privacy`, `settings_language`, `settings_reminders`, `settings_appearance`, `settings_export`, `settings_storage`, `onboarding` steps with no name typed yet, `not_found`, the error boundary | Capture and preview |
| `blocked` | `tonight`, `book`, `listen`, `write`, `review`, `letter_detail`, `read_together`, `settings` (home lists children), `settings_child_detail`, `settings_child_new`, `settings_recordings` (titles), `family`, anything unlisted | No capture. The sheet says why, in one line, and offers typing what they see |

**Redaction feasibility (React Native and Expo).**
- `react-native-view-shot` (MIT; `captureRef`, JPEG with quality, temp file or base64; no permission strings documented; supports Expo through `npx expo install`). Its README lists what it cannot capture on iOS: WebView, video, GL and Metal, maps, **system UI and modals**. That is helpful (notifications and the keyboard are not captured) and a hazard (the capture can be partial). Compatibility with Expo SDK 57 and RN 0.86 on the new architecture, the pinned version and the binary size are **unverified**: a spike on a device is task 1 of phase 2.
- **Blank by component:** wrap child names and letter text in a `<Redactable>` that renders a solid block while a module flag is on; set the flag, wait two frames, capture, clear. Feasible, but it flashes for about 100 ms, depends on every sensitive string using the wrapper, and one missed `Text` leaks a name. This is phase 2b and needs a test that renders every `blocked` screen with Asha and asserts the name is absent from the tree. Not recommended as the only defence.
- **Blur regions after capture:** needs text detection on the image (Vision framework, a native module of our own) and still misses handwriting-like and script text. Rejected.
- **System photo picker** (PHPicker, out of process, no library permission; Apple's 5.1.1(iii) prefers it): lets the person attach a picture of their choosing, including of a blocked screen. Adds a dependency (`expo-image-picker`, size unverified). Offer as phase 2c if testers ask; EXIF must be stripped.
- Also dropped: capturing the whole window or any screen "behind" the sheet after it opens, and capturing a scrolling view in full (`snapshotContentContainer`).

**Storage and retention (proposed, counsel to confirm).** The picture travels only as an email attachment through Resend to the private inbox. It is **never** put in a GitHub issue (issue attachments are fetched by URL; whether those URLs stay private is **unverified**, and a public repo is out of the question). The issue says `screenshot: yes, in mailbox, FB id`. Delete screenshots 30 days after the issue closes; text 12 months after closing (or 90 days, see question 6). Encryption: TLS in transit, provider encryption at rest for Resend, the mailbox and GitHub, all **unverified** as provider claims here; I do not recommend a client-side key because the founder would then need a viewer. Resend's retention of sent mail and attachments, and the attachment size limit, are **unverified**: check before phase 2.

## 6. Part D: the harness pipeline

**Rule that follows from sections 2 and 5: text and pictures stay with people; agents work on structure.** The private issue holds the fields in section 4 except `text`, `email` and `screenshot`, plus `text_chars`, `has_email`, `has_screenshot`, `pii_flag` (set on the phone if the text contains a child's name from the local book, and shown to the person so they can edit; the app never rewrites their words) and `mail_ref` (the Resend message id). This avoids three problems: the public repo, GitHub's edit history making deletion incomplete (unverified), and sending family text to an OpenRouter-routed model, which 5.1.2(i) would require us to disclose and ask permission for. A human can release text to agents by pasting a one line summary as a comment (their own words, which agents may read).

**Prompt injection.** Anyone on the internet can POST to the endpoint. Treat every field as hostile data: closed enums, length caps, fenced code blocks in issue bodies, no field is ever passed to an agent as an instruction (OPERATING_MODEL 1 already says non-founder text is information). The issue author must be a **machine identity** (a GitHub App or machine user), never the founder's PAT, or agents would read feedback as the founder's words.

**Flow.**
1. Endpoint creates an issue in `<owner>/earlyletters-feedback` (private, founder creates it, FT task) titled `FB-20261104-K7QD problem settings_plus 1.0.0 (12)`; labels `from:feedback`, `fb:problem|idea|praise|question|privacy`, `route:<route>`, `needs:qa`.
2. **QA agent** (`needs:qa`, one run a day): validates the schema fields; looks for duplicates by route, category and build, and by `feedback_id`; checks the version is a supported build; marks `qa:validated`, `qa:duplicate` (comment links the first) or `qa:needs-info`. It **never contacts the reporter**. If `has_email` and `consent.reply_email` are true it may add `reply:allowed`, and only the founder or support sends a reply. It proposes severity `S0` to `S3` (S0 privacy or data loss, S1 blocks a core flow, S2 wrong or confusing, S3 polish; the beta labels FOUNDER_TASKS line 323 already uses) and an owner label from the table below. Then `needs:product`.
3. **Product agent** reviews `needs:product`: accept (writes a BL task in `docs/BACKLOG.md`, citing the FB id only, never text), decline (comment, label `product:declined`), or merge into an existing BL id. It never edits the feedback repo's text, and `privacy` category and `S0` items are not declinable by agents: they get `needs:founder` and the privacy and legal agents.
4. **Engineering** takes the BL task through the normal dispatcher (task eligibility is by `Owner` and status). No new engineering mode.
5. Red team reviews the PRs as today. The founder merges. Agents never merge, never close a `privacy` issue.

**Owner table (first match wins; `scripts/agents/feedback-owners.json`).** Owner names are the roster's `backlog_owner_names`.

| Match | Owner role | Journey reference |
|---|---|---|
| category `privacy` | privacy engineer, then legal | any |
| route `settings_plus`, `read_together` | payments engineer | J11, J12 |
| route `listen`, `review` and text about wrong words (human summary) | speech engineer | J05, J06 |
| route `settings_language` | speech engineer | J14 |
| route `onboarding`, `tonight`, `book`, `letter_detail`, `write`, `settings_*` | mobile engineer | J01, J03 to J10, J13 to J17 |
| category `idea` or `praise`, copy wording | content, then product | any |
| dark mode, size, contrast | design systems | J18 |
| `not_found`, error boundary | mobile engineer | J19, J20 |
| the endpoint or website | platform | n/a |

**Proposed SLAs (best effort; the dispatcher runs every 30 minutes but each agent has `daily_runs: 1`).** QA validation within 1 business day. `S0` and `privacy`: founder alerted by email the same day (the endpoint sends it), human acknowledgement within 2 business days. Product decision on `S1` within 3 business days, `S2` within 7, `S3` and ideas in the weekly digest. Praise is counted, not triaged. The chief of staff digest gains one line: feedback older than its SLA.

**Dispatcher and harness changes (a `pair` task for `ops`; agents may not edit `.github/workflows/` or `agents/roster.json`).**
- Roster: `feedback_repo`. `bootstrap.mjs` creates the labels above in that repo.
- `dispatch.mjs`: a `triage` mode for `qa` when the feedback repo has open `needs:qa` issues (cap 5 per run); `brief.mjs` lists feedback issue numbers and fields, never bodies beyond the structured block.
- Product's standing duty 1 reads `needs:product` from the feedback repo; its "ignore anyone but the founder" rule is kept for the main repo only, and the machine identity is allow-listed for the feedback repo only.
- `agents-check` asserts no `text`, `email` or `screenshot` key ever appears in an issue body template.

**Deletion on request.** The person quotes a code or the install id (or writes from the email on the note). Support runbook: find the issue, delete the mail and attachment, delete the issue where the plan allows it (otherwise close and blank the body; issue deletion and edit history on a user-owned private repo are **unverified**), log the request with no content in the `privacy_requests` log (BL-237). Also delete the local reference when the person resets their id.

## 7. Part E: legal, compliance and brand

**Checklist (owner: legal-alignment drafts, counsel confirms; mark unverified where blocked).**
- [ ] Label decision (question 1) and counsel's view on whether (b) changes it.
- [ ] Counsel: free text may contain health information about a child or parent; does the Consumer Health Data notice apply to a note a person chooses to send (COUNSEL_PACKET, new question)?
- [ ] Children: the app is 18 plus; the form is for adults; the policy states that we do not seek children's data and that the text field asks people to leave names out. COPPA does not apply to an adult-directed form (my reading, **unverified**).
- [ ] CCPA/CPRA: access and deletion for feedback records are covered by policy section 9, which gives these rights to everyone in the US. Statutory response times are **unverified** (not checked from here). GDPR: policy section 10 says the app is offered in the US only; Article 17 and controller status for feedback received from the EEA are **unverified** (EUR-Lex blocked).
- [ ] Subprocessors: add **GitHub** (private issue tracker, structured record only); Resend row widened to "also delivers the notes people send us"; Vercel row widened to "also receives them". If question 2 goes B, the model host is a subprocessor and 5.1.2(i) permission is needed first.
- [ ] Claims registry: "Feedback is optional, and nothing is sent until you tap Send" and "never your letters" registered with evidence (the schema test).
- [ ] Data map and DATA_CLASSIFICATION rows for every field above, same PR (rule 5).
- [ ] Privacy manifest: `NSPrivacyCollectedDataTypes` lists the declared types when the feature ships; privacy label per labels 3 (a new "if feedback ships" section).

**Exact document changes (drafted on the phase 1 PR, not here).**

| Document | Change |
|---|---|
| `privacy-policy.md` (2.0.0 to 2.1.0) | Short version: add "If you send us feedback, we keep that note, the app version and your phone model." Section 3: replace the Support paragraph with a Feedback paragraph (what is sent, install id, optional email and picture, who holds it). Section 7: retention and deletion by reference code; "Reset my feedback ID". Section 9: how to ask for access or deletion of a note. Section 5 unchanged ("never use to train models") and must stay true |
| `subprocessors.md` | GitHub row; Resend and Vercel rows widened |
| `app-store-privacy-labels.md` | Section 2: the "server" sentence is rewritten; new section for the feedback build; section 6 checklist gains the `EXPO_PUBLIC_FEEDBACK` value |
| `in-app-disclosures.md` | New row: Feedback sheet (what is included, what is not, optional email and picture) |
| `DATA_CLASSIFICATION.md`, claims registry, data map | Rows as above |
| `docs/qa/DEVICE_TEST_PLAN.md` TF-07 | Point testers to the in-app route when they have letters on screen |

**Brand.** The endpoint URL lives in `packages/brand` (`web.feedbackApi`), the support address stays `brand.support.email`, and no string types the product name (D-076). All strings go to `packages/content/src/feedback.en.ts`; the rules test must pass unchanged.

**Proposed strings** (ASCII, no dashes, no exclamation marks, nothing about writing by machine, `{app}` and `{email}` filled at run time):

| Key | Text |
|---|---|
| `row.title`, `row.subtitle` | "Send feedback" / "What worked, what did not, what you wish for." |
| `sheet.title` | "Tell us" |
| `sheet.intro` | "Your note goes to the people who make {app}. Nothing is sent until you tap Send." |
| `category.*` | "Problem", "Idea", "Kind word", "Question", "Privacy" |
| `text.placeholder`, `text.help` | "What would you like us to know?" / "Please leave out names and anything from your letters." |
| `email.label`, `email.help` | "Your email, only if you would like a reply" / "We use it to answer you and for nothing else." |
| `included.summary` | "This note includes the app version, your iPhone model and iOS version, your language setting and the screen you were on. It never includes your letters, recordings or your child's name." |
| `consent` | "By tapping Send you agree that we keep this note and these details to answer you and to improve the app. How we keep it" (link to the policy section) |
| `send` | "Send" |
| `sent.title`, `sent.body` | "Thank you." / "Your note is with us. Reference {code}. Keep it if you ever want us to erase this note." |
| `queued` | "Saved on this phone. It will be sent when you are back online." |
| `failed` | "That did not send. Your note is still here. Try again, or write to {email}." |
| `name.flag` | "Your note seems to include a name from your book. It will be sent as you wrote it. You can change it first." |
| `privacy.followup` | "Thank you for telling us. We will read this first." (a promise: only keep it if the SLA is kept) |
| `shot.title`, `shot.body` | "Add a picture of this screen?" / "This is what we would see. It shows settings only." (blocked screens: "This screen can show your letters, so we cannot take a picture of it. You can describe it instead.") |
| `shot.attach`, `shot.skip`, `shot.remove` | "Attach", "Not now", "Remove" |
| `reset.title`, `reset.body` | "Reset my feedback ID" / "Notes you send from now on use a new random ID. Earlier notes keep their reference codes." |

**Where it lives.** (1) Settings, Help section, directly above "Write to us", row "Send feedback". (2) A quiet text link on the not-found and error-boundary screens (J19, J20): "Something went wrong? Tell us". Nothing on Tonight, Book, Listen, Write, Review or Letter, no floating button, no shake gesture (a shaken phone in a parent's arms would open it by accident), no prompt, no badge, no count. Praise is never routed to a rating prompt from here.

## 8. Recommendation

**Do (b) for the App Store v1.0 submission and build (a) now behind a build switch, shipping it in the first release after the founder accepts the label and counsel signs the text.**
1. v1.0 keeps "Data Not Collected": the Help row stays, TestFlight handles beta feedback, and we add one visible, content-free block (version, build, route) to the mail body so a report is still traceable. No account, no install id, no screenshot.
2. (a) is the right transport: it is the only option that gives a structured, rate-limited, queueable record without a new vendor or a new SDK. It makes the label "Data Collected, Linked, no tracking", which is a real trust cost and the founder's call.
3. Text and pictures stay with people; agents see structure only, until counsel and a verified model host say otherwise.
4. Screenshots: default deny by route, preview with a sentence and Remove, picture goes by email and never into GitHub.
5. Use a private repo with a machine identity. The public repo must never receive feedback.

**Cost.** Phase 1 about 5 to 6 engineer-days (web endpoint 2, mobile sheet, outbox and id 3, legal text and tests 1), phase 2 about 4 (device spike 1, capture and preview 2, policy test 1), harness change 2 (ops, pair). Vercel, Resend and GitHub free tiers are assumed to suffice at beta volume (**unverified**).

**What would change my mind.** If counsel says an email sent from the person's mail app is "collected": (b) already changes the label and (a) loses its only disadvantage. If TestFlight screenshot feedback cannot be turned off and testers send letters through it: ship phase 1 to C1 as a TestFlight-only build. If spam hits the endpoint: add App Attest (**unverified**, needs server verification) before anything else. If the view-shot spike shows partial captures on SDK 57: screenshots wait for the picker route (2c).

## 9. Build plan

**Phase 1: text feedback with route, version and consent (build agent may start after the founder answers 1, 2 and 5).**

*Website (`apps/web`, PR into `main`, then merge `main` into `develop` the same day per DEVELOPMENT).*
- `src/app/api/feedback/route.ts` (POST only), `src/lib/feedback/{handler,schema,deliver-email,deliver-issue,log}.ts`; reuse `createRateLimiter` and `clientKey`. Limits: 3 per hour and 10 per day per client, 60 a minute provider ceiling, 20 KB body in phase 1 (2 MB in phase 2, against Vercel's own request limit, **unverified**), `FEEDBACK_DAILY_CAP`, honeypot `company`, minimum time `t`, `x-el-app` header (a speed bump only: it ships in the app).
- Env vars (Vercel, founder sets): `FEEDBACK_TO_EMAIL`, `FEEDBACK_GITHUB_REPO`, `FEEDBACK_GITHUB_TOKEN` (fine grained, Issues write on that one repo, machine identity), `FEEDBACK_APP_KEY`, `FEEDBACK_DAILY_CAP`; `RESEND_API_KEY` exists. A Vercel WAF rate-limit rule on `/api/feedback` (the real control, as for notify).
- Tests: closed schema (unknown key refused), enum and length caps, honeypot, rate limit, cap, log canary (no text, email or id in any log line), issue body has no `text`, `email` or `screenshot`, idempotent retry.

*Mobile (`apps/mobile`).*
- `src/lib/feedback/{payload.logic.ts,install-id.ts,outbox.ts,send.ts,routes-policy.logic.ts}`; a `settings` migration for the id and a small `feedback_outbox` (3 entries, 14 day expiry, deleted on send). Send on the next foreground when online; no background tasks.
- `src/app/settings/feedback.tsx`, a row in `settings/index.tsx`, a link on the error screens; `settings_feedback` and `not_found` added to `ROUTE_MAP` and the catalogue enum; "Reset my feedback ID" in `settings/privacy.tsx`; `capabilities.feedback` from `EXPO_PUBLIC_FEEDBACK=on`, set per `eas.json` profile (App Review 2.3.1(a): the review notes describe any dormant code).
- `packages/content/src/feedback.en.ts` (strings above), `packages/brand/index.ts` (`web.feedbackApi`).
- Tests: payload keys are a subset of the allowlist; an Asha-fixture property test that no child name, birthday or signature reaches the payload; outbox survives a kill, retries, expires; offline, rate-limited and server-error states; no analytics call; content rules.
- Journeys: J21 feedback (happy, praise, privacy), J21 unhappy (offline, failure, rate limited, name flag), regenerate the journey record.

*Harness and legal (parallel).* Private repo and machine identity (FT task); labels and dispatcher changes (section 6); the document table in section 7; BL ids proposed as a block of ten from BL-436 (unclaimed at 4 Oct; PR #86 uses up to BL-435), assigned by product.

**Phase 2: screenshot with preview and redaction (after phase 1 is live).** Device spike on `react-native-view-shot` (SDK 57, new architecture, size, partial captures, modal and keyboard behaviour); `routes-policy.logic.ts` with the table and its completeness test; capture before the sheet opens; preview step and copy; JPEG, longest side 1170 px, at most 1 MB, no EXIF; email attachment path and the retention runbook; (2b) `<Redactable>` and the render-with-Asha test; (2c) picker only if asked for. Labels move to include the picture type.

## 10. Questions only the founder can answer

1. **v1.0 label.** A: v1.0 stays "Data Not Collected" with the mail-composer route (b); the form ships in the first release after counsel signs. B: ship the form in v1.0 and declare Data Collected (Customer Support, optional Email, User ID, Other Diagnostic Data; Linked, not tracking). (Recommended: A.)
2. **Who reads the words.** A: text and pictures are read by you or a person you name; agents work on structure and your one line summary. B: agents read the text too, after the policy and the consent line say so and a model host with verified terms is chosen. (Recommended: A.)
3. **Screenshots.** A: safe screens only (settings, errors), blank by default everywhere else, preview and Remove. B: also blank the names on Tonight and Book and allow those. (Recommended: A.)
4. **Who the user is.** A: a random install id that can be reset, plus an optional email. B: no install id, only the per-note reference code and the optional email. (Recommended: A; B removes User ID from the label and loses de-duplication and delete-by-id.)
5. **Where issues live.** A: create a private repo with a machine identity (FT task) and keep the public repo free of feedback. B: no GitHub for feedback; email and the backlog only. (Recommended: A.)
6. **Retention.** A: text 90 days after closing, pictures 30. B: text 12 months, pictures 30. (Recommended: A, shorter is easier to defend.)

## 11. Risks, frankly

- The label change is real and visible. "Data Not Collected" is part of the trust story (D-061); (a) ends it for the build that carries it.
- An open endpoint will be found. The in-memory limiter only slows; the WAF rule and the daily cap are the controls. Worst case is inbox spam and a burned free tier, not exposure.
- One missed screen in the allowlist leaks a child's name. Default deny and the completeness test narrow this; they do not remove it. People also paste letter text into the note regardless of what we ask, which is why agents do not read it.
- The founder reading every note is a cost that grows with the beta. The SLAs assume tens a week.
- Prompt injection through any field that reaches an agent; and an issue authored with the founder's token would read as the founder's words.
- `react-native-view-shot` partial capture on iOS is documented by its authors; its fit with SDK 57 is unproven here.
- The harness (PR #4, #39) is not on develop and runs on one daily run per agent; the pipeline depends on it landing and the SLAs are best effort.
- Counsel is not signed (COUNSEL_PACKET); the policy text above is a draft. Policy 2.0.0 says there is no server of ours in the app and `labels 2` says it too; both change in the same release.
- The support mailbox claim `hello@` receiving mail through Resend is unverified here; confirm it receives before the failure string points to it.

## Affected
Founder (label, privacy), legal-alignment and counsel, privacy and security engineers, platform (endpoint), mobile, content, qa, product, red-team, ops (dispatcher), support (runbook).

## Replies
None yet. At most one round from each affected agent.

## Status
Escalated to the founder.
