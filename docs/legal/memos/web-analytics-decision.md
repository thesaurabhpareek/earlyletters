# Memo: should earlyletters.com have analytics at all?

> **Drafting notice.** Drafted by an AI (Claude) as privacy engineer, for the founder and for review by counsel. Not legal advice. Date: 2026-10-28. Evidence marks: **V** = read or run in this pass, **I** = inferred, **U** = could not verify.
> The recommendation in section 7 is the founder's call.

## 1. The question and why it is open now

PR #309 (opened by vercel[bot], still open, V) mounts the existing `WebAnalytics` wrapper in `apps/web/src/app/layout.tsx` and rewrites the website Privacy page so it says analytics is on. PR #308 (closed, not merged, V) tried Vercel Speed Insights, mounted with no gate. The website has run without analytics so far, and the Privacy page says so.

One fact about #309 matters more than the rest. **The PR changes the words, not the switch.** `analyticsEnabled` is true only when `NEXT_PUBLIC_ANALYTICS=vercel` at build time (V, `apps/web/src/lib/analytics/index.ts` on main), and the runbook says that variable is unset by default (V, `docs/ops/WEBSITE_RUNBOOK.md` 3). So if #309 merges and nobody sets the variable and enables Analytics in the Vercel dashboard, the published policy says "we use Vercel Web Analytics" while nothing runs. That is the reverse of the usual mismatch, still a mismatch, and the PR's own test still asserts `analyticsEnabled` is false (V, diff of `legal.test.ts`).

Where the files live: `apps/web` exists on `main` but not on `develop` at the time of writing (V: `git ls-tree` on both). Everything below about the website was read from `origin/main`.

## 2. What the website collects today (V unless marked)

- **Email list.** Address only, held in Resend, used for one welcome email and one launch email. No name. Policy: `apps/web/src/lib/legal/privacy-copy.ts`. Resend open and click tracking is meant to be off (`docs/legal/subprocessors.md`, item 4; whether it is off in the Resend account is U).
- **Contact mail.** Address and message to the contact address, via Resend receiving.
- **Vercel hosting.** The policy says the host "receives your IP address, browser type and the page you asked for". Vercel request logs are therefore already a collection point today. Their retention is U (not checked in this pass).
- **Rate limiter.** IP held in memory up to 10 minutes on join or leave, never stored (policy text; code claim not re-audited here).
- **Browser.** No cookies, no browser storage (policy; enforced by a source-grep test in `apps/web/test/legal.test.ts`, and an e2e test that the cookie jar is empty, `apps/web/e2e/landing.e2e.ts`).
- **Third-party origins.** None. CSP is `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `connect-src 'self'` (V, `apps/web/next.config.ts`); an e2e test fails if any non-`earlyletters` origin appears in the CSP (`apps/web/e2e/http.e2e.ts`).
- **Out of scope here:** `/j`, `/i`, `/auth/*` pages. The code says these carry no analytics (V, `apps/web/src/app/j/page.tsx`, `AuthConfirm.tsx`) and `subprocessors.md` records "No access logs or analytics for `/i/*` and `/auth/*`". If analytics is mounted in the root layout, it will mount on these pages too unless `beforeSend` drops them. **#309 mounts it in the root layout and does not exclude them** (V). This is a real defect to fix under any "on" option.

## 3. The options

### A. No analytics (current state)
Keep `WebAnalytics` unmounted. Close #309. Decide launch success from App Store Connect (impressions, product page views, downloads) and Resend (list size), which need no website script. Apple's campaign links are already wired (`launch.ts`, V). You lose: which scenes people reach, which button gets clicks, which sources send people.

### B. Vercel Web Analytics, gated (the existing wrapper)
What Vercel says it collects: timestamp, URL, dynamic path, referrer, filtered query params, geolocation (country, region, city), device OS, browser, device type. No third-party cookies; visitors identified by a hash made from the incoming request, discarded after 24 hours. [Vercel, Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy) (V, fetched 2026-10-28).
What that page does **not** say: whether IP addresses are used in the hash or kept; any retention period for stored data points; any Do Not Track or Global Privacy Control behaviour (U for all three). The DNT and GPC handling is ours, in `privacySignalOn()` (V). Do not describe it in the policy as a Vercel feature.
Our extra guards (V, code and `apps/web/test/analytics.test.ts`): off unless the env var is set; skipped on DNT or GPC; URLs reduced to path plus three allowed campaign params with plain tokens; events limited to three closed-list types (`cta_click`, `notify_submit`, `scene_reached`). Custom events need Vercel Pro per the runbook (V, repo; not re-checked against Vercel docs).

### C. A privacy-first alternative (Plausible, Fathom, Simple Analytics or similar)
Example: Plausible says it uses no cookies or local storage, counts visitors with a daily-rotating salted hash of domain, IP and user agent, does not store raw IPs, and stores data in the EU. [Plausible data policy](https://plausible.io/data-policy) (V). That page does not mention DNT (U). I did not review Fathom or Simple Analytics (U).
Cost to us: a new subprocessor in `subprocessors.md` and the policy, a new DPA to read, and a CSP change (a script origin in `script-src` and an endpoint in `connect-src`, unless proxied through our own domain; I have not tested a proxy setup, U). That breaks the "no third-party origin" e2e test and the sentence "loads nothing from other sites". Compared with B, C adds a vendor and removes none. B's one advantage is that Vercel is already our host and already listed.

## 4. What each option does to our documents

| | A. None | B. Vercel, gated | C. Other vendor |
|---|---|---|---|
| Website Privacy page | No change | Rewrite "Cookies and tracking" and add a line to "What we collect"; bump date | Same, plus name a third service in "Who we share it with" (today it says "Two companies") |
| CSP | None | None expected. The v2 package takes script and endpoint paths as relative `/<unique-path>/...` from build-time config ([Vercel, package docs](https://vercel.com/docs/analytics/package), V), and the runbook says same-origin `/_vercel/insights/*` (repo, I: "not run against a real Vercel deployment"). **Verify on a preview deploy with the browser console open before launch.** | Add vendor origins, or proxy |
| App Store privacy label | None | None, see below | None, see below |
| `subprocessors.md` | None | Vercel row already exists; add "Web Analytics" to its purpose | New row, DPA |
| Tests | Keep `legal.test.ts` guard | Replace the guard with one tying the copy to the switch (see 5) | Same, plus CSP test change |

**Mismatches in the #309 diff itself (V):**
1. The code comment it adds says nothing loads from another origin "except Vercel's analytics script". That is inconsistent with the CSP, the e2e test and the runbook, all of which say same-origin.
2. It says analytics "collects no personal information". Vercel's own wording is narrower: no identifiers that track across sites, and aggregated statistics. A hash made from a request, plus city-level location, is the kind of thing counsel may still call personal data in some regimes (I). Safer wording: "counts visits without cookies and without following you across sites."
3. It drops the sentence "We do not track you, so a Do Not Track signal changes nothing here" and replaces it with a claim that DNT and GPC turn analytics off. That is true only if the browser exposes the signal where our code looks for it: `navigator.globalPrivacyControl`, `navigator.doNotTrack` or `window.doNotTrack` (V). Safari's and Firefox's exposure of these is U.
4. The "Who we share it with" section still says "Two companies" and lists Vercel as hosting only. Not edited by #309.
5. No `claims-registry.yaml` review, which the runbook requires before enabling (V, runbook 3.1). I did not find that file on main (U; `git ls-tree` showed no match).

### The App Store label
**What I can conclude (V):** `docs/legal/app-store-privacy-labels.md` is scoped to the iOS app, and its data types come from the app and PostHog (opt-in). Apple's label describes data the *app* collects. Website visits are not app collection, so options A, B and C do not add a row to that label (I). The label's privacy policy URL is `https://earlyletters.com/privacy` (V, line 33), which is the page #309 changes.
**What I cannot conclude:** whether Apple or a reviewer treats the linked website policy as part of the app's disclosure, and whether the future app privacy policy and this website policy will be one document or two. The website policy today says the app "will have its own privacy policy" (V). Counsel should confirm that the policy URL given to Apple is the app policy and not this web-only page (U).
Also note: the label doc says "Tracking: No". Neither B nor C changes that if no data is linked to third-party data for ads (I).

## 5. Consent, DNT and GPC

- **Consent.** The app is opt-in (BRIEF decision 12). The website under B would be **opt-out by signal**, not opt-in: it counts unless the browser sends DNT or GPC. That is a different standard from the app, and the founder should choose it knowingly. There is no banner today and B as written adds none. Whether a banner is needed turns on law that is U here: ePrivacy-style cookie rules apply to reading or writing on the device, and the wrapper writes nothing (I), but the script load and the request itself may still need a lawful basis for EU or UK visitors. Counsel to say.
- **DNT.** Honouring it is a voluntary choice here. California's online privacy law (CalOPPA, Bus. & Prof. Code 22575) requires a policy to disclose how the operator responds to DNT signals; the repo's own register lists this as "Unverified, not opened" (`docs/legal/compliance-register.md` CR-013; `docs/legal/privacy-policy.md` end notes). I have not read the statute (U). Either way the policy must say what we do, and today's sentence ("changes nothing here") would become false under B.
- **GPC.** Under California rules GPC is a recognised opt-out signal for sale or sharing, for businesses covered by the CCPA. Honouring it for analytics goes beyond what is probably required of us (I).
- **Test gap.** Tests prove the code reads the signals (V, `analytics.test.ts`). Nothing proves a real browser sets them. A manual check per browser is a cheap addition (not done).

## 6. California residents

- The repo's CCPA analysis says the Act applies to a business over $26,625,000 revenue, or one handling the data of 100,000 or more consumers or households, or earning half its revenue from selling or sharing data (`docs/legal/privacy-policy.md` CN-4, repo-sourced, not re-verified here, U). A pre-launch list is unlikely to reach these (I). Counsel to confirm.
- Even if the CCPA does not apply, **CalOPPA applies to any operator collecting personally identifiable information from California residents through a website** (I; statute unread, U). The email list already triggers that. CalOPPA's DNT disclosure then applies to us today, and under B the disclosure has to be correct. This is the strongest legal reason to treat the policy text as load-bearing rather than cosmetic.
- No sale and no sharing for advertising holds under every option (I), so no "Do Not Sell or Share" link should be needed. Counsel to confirm for B, because the vendor is a service provider only if the contract says so (U: I did not read Vercel's DPA).

## 7. "No analytics" statements that become false (V, from origin/main)

| Where | Text | Under B or C |
|---|---|---|
| `apps/web/src/lib/legal/privacy-copy.ts` | "We do not use analytics, advertising or tracking tools, and the website loads nothing from other sites." | False. #309 rewrites it. |
| same | "We do not track you, so a Do Not Track signal changes nothing here." | False. #309 rewrites it. |
| `apps/web/test/legal.test.ts` | Asserts both sentences and that `WebAnalytics` is not mounted | Must change (#309 does) |
| `apps/web/src/lib/legal/privacy-copy.ts` header comment | "no analytics ... nothing loaded from another origin" | Stale; #309 rewrites it, with the inaccuracy in 4 above |
| `docs/ops/WEBSITE_RUNBOOK.md` 3 and 3.1 | "The Privacy page says the site has no analytics" | Runbook becomes stale |
| `apps/web/next.config.ts` comment | "analytics and the form are same-origin" | Stays true for B |
| `apps/web/src/app/j/page.tsx`, `AuthConfirm.tsx` | "no analytics" on token pages | **False under #309** unless those routes are excluded |
| `docs/analytics/TRACKING_PLAN.md` | Runbook says it has no website analytics at launch (not opened, U) | Probably stale |
| App privacy policy `docs/legal/privacy-policy.md` line 272 | "We do not track you across other sites, so we treat every visitor the same way whether or not the browser sends a Do Not Track signal." | Written for the app; if this text is ever shared with the website policy it would need the same change |

I searched `apps/web`, `docs/web`, `docs/legal`, `packages/content` and `docs/DECISIONS.md` for these phrases. I did not search the marketing copy outside those paths or the scene text in the film, so other claims may exist (U).

## 8. Recommendation (the founder's call)

My recommendation, from the evidence above: **A now, B later if you want numbers.** Reasons: before launch there is little to measure that App Store Connect and Resend do not already tell you; the website's stated promise today is the strongest, simplest one the product has ("nothing loaded, no cookies, no analytics"), and it fits the brand's trust position; #309 as written is unsafe to merge in any case (section 1, section 4, section 2 token pages). If the founder wants numbers, B is the smaller step than C because it adds no new vendor, and the privacy engineer can supply a safe PR.

**What the founder decides:**
1. A, B or C.
2. If B: opt-out by signal (as built) or a banner. And whether DNT should count, or only GPC.
3. Whether the Privacy page should say "no personal information" (not recommended) or the narrower wording.
4. Whether to close #309 and have a privacy-owned PR replace it.

**What counsel checks (if B or C):**
1. Whether the hash-from-request counts as personal data for the EU, UK and California, and what basis is needed for a no-banner script.
2. CalOPPA DNT wording; CCPA applicability.
3. Vercel's DPA and service-provider terms for Web Analytics; the IP and retention questions in section 3B.
4. That the policy URL given to Apple is the app policy.
5. The Privacy page wording line by line.

**Engineering work if B is chosen (not done here; outside my owned path):**
- Exclude `/j`, `/i`, `/auth` and `/a`, `/r` from analytics via `beforeSend` returning null, with a test.
- Replace the `legal.test.ts` guard with one that fails when the copy says analytics is on while the switch is off, or the reverse. Today's #309 test permits that mismatch.
- Preview-deploy check of CSP and network requests; runbook section G.
- Policy copy per section 4, and update the runbook.

## 9. Second question: GitHub Copilot code review on this public repository

**Short answer:** no *new* exposure of repository content, because the repository is already public (V: `gh api repos/thesaurabhpareek/earlyletters` returns `visibility: public`). The real risks are the ones already in CLAUDE.md, and one that is specific to Copilot's data terms.

What Copilot code review reads (V, [GitHub Docs, responsible use of Copilot code review](https://docs.github.com/en/copilot/responsible-use/code-review)): the diff, "other relevant, contextual information", the pull request title and body, and repository custom instructions files. The page does not list what the extra context contains. It does not address retention, public repositories or content exclusion for code review in the part I could read (the first 100,000 characters; the rest was read for retention and had none; U for anything else on the page).

Data policy change (V, [GitHub Blog, Updates to GitHub Copilot interaction data usage policy](https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/)): from 24 April 2026, interaction data (inputs, outputs, code snippets and context) from Copilot **Free, Pro and Pro+** may be used for model training unless the user opts out. Business and Enterprise are excluded. Private repository content "at rest" and issues and discussions are excluded. The post does not address public repositories (U for how it treats them). The post says data may be shared with GitHub affiliates including Microsoft, not with third-party model providers.

What I could not confirm (U): which Copilot plan the account that enables review uses; whether the opt-out is set; whether "code review" interaction counts as interaction data under that policy (the post speaks of Copilot generally); how GitHub treats pull request text in a public repository.

**Against the CLAUDE.md rule** ("Real family details never go in code, tests or fixtures"): the rule is about the repository, which is public, so any real detail in a diff is already exposed to everyone. Copilot adds a second reader but not a first. Two practical points:
- The guard `apps/web/test/no-real-family-data.test.ts` scans tracked files only (V). It does not scan PR titles, PR bodies, review comments or commit messages, which Copilot reads. Its own text says never to write the real names in a PR or comment (V). That rule depends on discipline only; no automated check covers PR text (V: none found in `.github` listing; the workflow contents were not searched, U).
- Content (C) and Sensitive (S) data classes (`DATA_CLASSIFICATION.md`) are not in the repo by design, so Copilot should see none.

**Recommendation (founder's call):** allow it on this repo, on the condition that (1) the founder checks the Copilot plan and turns off training use in the account settings, (2) PR bodies keep the existing rule, and (3) the founder does not enable Copilot on any private repository that holds real family data or Supabase exports without a separate decision. Counsel does not need to review this unless the answers to the unconfirmed items change.

## Sources
- [Vercel, Web Analytics Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy)
- [Vercel, @vercel/analytics package](https://vercel.com/docs/analytics/package)
- [Plausible data policy](https://plausible.io/data-policy)
- [GitHub Docs, Copilot code review responsible use](https://docs.github.com/en/copilot/responsible-use/code-review)
- [GitHub Blog, Copilot interaction data usage policy](https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/)
- Repo: PR #308 and #309 (`gh api .../pulls/{308,309}/files`), `apps/web/next.config.ts`, `apps/web/src/lib/analytics/*`, `apps/web/src/lib/legal/privacy-copy.ts`, `apps/web/test/legal.test.ts`, `docs/ops/WEBSITE_RUNBOOK.md`, `docs/legal/app-store-privacy-labels.md`, `docs/legal/DATA_CLASSIFICATION.md`, `docs/legal/subprocessors.md`, `docs/legal/compliance-register.md`
