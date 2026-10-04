# Website end-to-end suite: findings

Written 2026-10-04 by QA engineer 3. Suite: `apps/web/e2e/` (Playwright, Chromium). Run: `npm run e2e -w @scribe/web`.
All three bugs found by the first run are fixed; their tests are in the main suite (`e2e/signup-regressions.e2e.ts` and the unsubscribe group).
CI: `.github/workflows/web-e2e.yml` (pull requests that touch the site; uploads traces and the HTML report on failure).

## How the suite works

- Global setup builds the site as the launch-day coming-soon page (`SITE_MODE=coming-soon`, dummy `RESEND_API_KEY` and
  `RESEND_SEGMENT_ID`, test `UNSUBSCRIBE_SECRET`) in its own `.next-e2e` directory, starts `next start` on a free port, and
  starts a mock of the Resend API on another free port. The Resend SDK reads `RESEND_BASE_URL`, so the site's server talks to
  the mock: no request leaves the machine and no email is sent. The mock records every call (contacts, segments, emails) and
  can fail on demand per address, so tests in parallel do not affect each other.
- Every browser request that is not to the site is blocked and fails the test.
- Console errors, uncaught page errors and failed requests fail any test that does not opt out.
- Each test sends its own client address (`X-Forwarded-For`, IPv6 documentation range), so the in-memory sign-up rate limit
  never couples tests.
- axe-core 4.13.0 is a normal dev dependency (the registry was reachable, so nothing is vendored).
- Fixtures use only the fictional family Asha and example.com addresses.

## Bugs

### F-1 One-click unsubscribe from a real mail app got a redirect, not 200 (audit A-U9). FIXED.
- Where: `apps/web/src/lib/notify/unsubscribe-handler.ts`, lines 29 to 41 now (was `isForm` set from the content type alone at line 30).
- A real RFC 8058 request is `POST` with `Content-Type: application/x-www-form-urlencoded` and body `List-Unsubscribe=One-Click`, with the
  token in the query. The handler treated every form-encoded request as the confirm page's form and answered `303`. Mail apps expect 2xx.
  The unit test sent the request without a content type, so it never caught it.
- Fix (8 lines, not payments, auth or Supabase): treat the request as the page form only when the body has a `t` field.
- Tests: `apps/web/test/unsubscribe.test.ts` (new unit test with the real request) and the e2e "unsubscribe API" group.

### F-2 Sign-up with JavaScript off ends on raw JSON (audit A-U2). FIXED. Test: `signup-regressions.e2e.ts` A-U2 and `test/notify.test.ts` (native form post).
- Where: `apps/web/src/lib/notify/handler.ts:77` (`readJsonObject` refuses anything but `application/json`) against
  `apps/web/src/components/cta/NotifyForm.tsx:46` and `:51` (the comment and `method="post" action="/api/notify"` promise a working native submit).
- A native submit posts form-encoded data, gets `400 {"ok":false,"error":"invalid"}` and the visitor sees that JSON on a blank page. The address is not saved.
- Fix: the handler reads a form-encoded body, does the same work, and answers `303` to `/signup/thanks` or `/signup/sorry?e=...` (two small static pages, copy in `site.notify`) instead of JSON. Cross-site posts are still refused by the Origin check.
- Passing tests that cover what does work without JavaScript: the page renders in full, the form is a plain POST, and the address never appears in the page URL.

### F-3 A repeat sign-up sends another welcome email, and an unsubscribed address gets one too (audit A-U8). FIXED (PR 77). Tests: `signup-regressions.e2e.ts` A-U8 (three tests).
- Where: `apps/web/src/lib/notify/handler.ts:126` (`if (outcome === 'ok') await sendWelcome(...)`) and the "already exists" branch of `subscribe` in
  `apps/web/src/lib/notify/provider.ts` (returns `ok` for an existing contact, so it is treated like a new one).
- Effect: the same address entered again (by the person or by someone else typing it) receives another email, up to 5 per 10 minutes per client;
  an address that unsubscribed stays unsubscribed in Resend but is still told it is on the list and still emailed once.
- Fix: sign-up looks the address up first; an existing address gets no second email and an unsubscribed address is left alone, with the same answer for everyone. Resend returned 201 for a duplicate create, so a create cannot tell new from existing.
- Passing tests that cover the rest: same answer for new and existing addresses, one contact only, segment ensured, and an unsubscribed contact is never switched back on.

## Observations (not bugs, not tested as failures)

- The site allows 60 provider calls a minute per server instance (`handler.ts:30`). A burst of real sign-ups beyond that gets the "give it a minute" message. The suite
  stays well under it and waits out a 429 where a sign-up is expected to succeed.
- The success message is a `role="status"` paragraph that appears together with its text (`NotifyForm.tsx:38`). Some screen readers do not announce a live region
  that is inserted already filled. Unverified (no screen reader here); the error message uses a region that is present before its text changes.
- The quiet sign-up field shows focus only as a 1px underline changing colour (`NotifyForm.module.css:124-127`). It is visible and the test passes, but it is thin.
- `sitemap.xml` lists the four legal pages while they are noindex (by design, per the comment in `sitemap.ts`). Search engines may flag the mismatch.
- Sign-up rate limits are per server instance and in memory (the code says so). The Vercel WAF rule that is the real control cannot be tested here.
- Next's route announcer is a second `role="alert"` on the page after a client-side navigation; tests scope to `main`.

## What could not be tested here

- Real delivery of the welcome email, SPF, DKIM and DMARC, and how Gmail or Apple Mail treat the one-click request (mock only).
- What the real Resend API returns for a duplicate contact or a failed send (the mock models the documented shapes).
- Real response headers behind Vercel (HSTS, CDN caching, the WAF rule), the `www` and `.app` redirects on real DNS (tested by Host header against `next start`).
- Other browsers (Firefox, WebKit, Safari on iPhone) and real touch devices; only Chromium 141 ran.
- The film (`SITE_MODE=film`, previews) and the launch-day App Store badge build (`NEXT_PUBLIC_APP_STORE_URL`): the suite covers the production coming-soon build only.
- The open `/lab` pages (`ENABLE_LAB=1`); only their closed state in production.
