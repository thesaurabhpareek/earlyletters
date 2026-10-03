# Website runbook: earlyletters.com

Owner: E3 (release). Covers the site in `apps/web` (package `@scribe/web`): Vercel project, environment variables, domains and DNS,
launch day, rollback, Apple universal links and production checks. Written 2026-10-03.

Marks on every non-obvious fact, as TEAM.md asks:
- **Verified**: read in the vendor's documentation, read from the repo, or measured, on 2026-10-03.
- **Inferred**: follows from what was verified, but nobody has run it end to end yet.
- **Opinion**: a recommendation. Change it if you disagree.

Nothing in this file was applied to Vercel, Porkbun or Apple. It is the plan, plus checks to run after each step.

## 1. At a glance

| Item | Value |
|---|---|
| Vercel team | `saurabhrspareek-gmailcoms-projects` (id `team_8RVbBQ3AfedviapbHWLAP3Wx`) |
| Vercel project | `earlyletters-web`, from GitHub `thesaurabhpareek/earlyletters` |
| Root Directory | `apps/web` |
| Primary domain | `earlyletters.com` |
| Redirect domains (308 to the primary) | `www.earlyletters.com`, `earlyletters.app`, `www.earlyletters.app` |
| DNS host | Porkbun (nameservers stay at Porkbun, never move them) |
| Email | Resend on `send.earlyletters.com`; Porkbun forwarding on the apex. Never touch these records (section 5) |
| Install / build | `vercel.json` in `apps/web`: `npm ci --workspace=@scribe/web`, then `next build` |
| Launch switch | `NEXT_PUBLIC_APP_STORE_URL` (build time, so a launch is a redeploy) |

## 2. Vercel project settings

Set these when creating the project (Add New > Project > import the repo), or in Settings afterwards.

| Setting | Value | Why |
|---|---|---|
| Framework Preset | Next.js | Also pinned in `apps/web/vercel.json`. |
| Root Directory | `apps/web` | The site lives there. |
| Include source files outside of the Root Directory | **ON** (Settings > Build and Deployment > Root Directory) | The build needs `packages/brand`, `packages/design-tokens` and the legal Markdown in `docs/legal` (`src/lib/legal/load.ts` reads it at build). With this OFF the build fails or the legal pages are empty. Verified (repo). It is on by default for new projects in the dashboard flow; confirm it. Inferred. |
| Install Command | leave default; `apps/web/vercel.json` sets `npm ci --workspace=@scribe/web --no-audit --no-fund` | Installs the site and the two packages it uses, not the Expo app. Measured: 10 s and 575 MB, against 27 s and 1.4 GB for the whole workspace. Verified (measured in a clean worktree). |
| Build Command | leave default (`next build`, the `build` script of `@scribe/web`) | Measured: 28 s cold, 23 routes. Verified. |
| Output Directory | leave default | Next.js preset. |
| Ignored Build Step | leave empty | No skip rule is set. `vercel.json` had an `ignoreCommand` of 284 characters; Vercel allows at most 256 and rejects the deployment (400), so it was removed on 2026-10-03. Verified (rejected by the Vercel deployment API). |
| Node.js Version | **22.x** (Settings > Build and Deployment) | Tests and CI run on 22. Vercel's default is now 24.x and 20.x is deprecated from 2026-10-01. Verified (Vercel docs). Local and CI runs were on 22 only, so staying on 22 is the tested path. Opinion. |
| Production Branch | `main` | CLAUDE.md: `main` is always releasable. Verified (repo rule). |
| Deployment Protection | Vercel Authentication on previews (default), production public | Previews stay private to the team. Opinion. |
| Plan | **Pro before launch** | Vercel's Hobby plan is for personal, non-commercial use only; a product with a paid tier is commercial. Custom analytics events also need Pro. Verified (Vercel docs). |

**Ignored build step.** None is set, so every push to a branch builds. Pushes that change only `apps/mobile/`, `supabase/` or
`experiments/` still produce a site build; that costs build minutes only. The earlier `ignoreCommand` was removed because it
exceeded Vercel's 256-character limit (Verified: the API answered 400). If a skip rule is wanted again, put the logic in a script
under `apps/web/scripts/` and keep the command short, then run a real Vercel deployment before relying on it. Opinion.

**CI.** `.github/workflows/web.yml` runs typecheck, tests and two builds (prelaunch and a launch rehearsal) on pushes and pull
requests that touch the site's inputs; about 1.5 minutes expected, 5-minute timeout. It is not a required check on purpose
(a path-filtered required check blocks merges that never trigger it). The Vercel preview build is the gate. Inferred (CI
timing is an estimate from local runs; Vercel and GitHub runners were not exercised).

## 3. Environment variables

Set in Vercel: Settings > Environment Variables. Facts about Vercel that matter here (Verified, Vercel docs):
a change applies only to **new** deployments, and `NEXT_PUBLIC_*` values are written into the JavaScript at build time. So
changing any variable below means **Redeploy**, never "it will pick it up".

| Variable | Environments | Type | Read at | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_STORE_URL` | Production only | Plain | build | Empty: prelaunch (notify form). Set to an App Store product link: live (badge). Must be `https://apps.apple.com/.../id<digits>`. Anything else is ignored, the site stays prelaunch and the build log says `[launch] NEXT_PUBLIC_APP_STORE_URL is set but ignored`. Verified (`src/lib/launch.ts`, 13 tests). |
| `NEXT_PUBLIC_APPLE_PROVIDER_TOKEN` | Production only | Plain | build | Optional. Apple's provider token `pt` (digits). With it, App Store links carry `pt` and `ct=web-<placement>` so App Store Connect can count clicks by button. Without it (and without a `pt` already in the URL) links carry no campaign parameters. Not in the original list; the code reads it. |
| `NEXT_PUBLIC_ANALYTICS` | Production only | Plain | build | `vercel` turns Vercel Web Analytics on. Unset (the v1 default) means off: no script, no request, no storage. See section 3.1. |
| `RESEND_API_KEY` | Production (and Preview only if you want previews to subscribe people) | **Sensitive** | runtime | "Tell me when it is ready" form. Missing in production makes `/api/notify` answer `server`, and the form shows its error state. Use a key limited to sending/contacts for this domain. Opinion. |
| `RESEND_SEGMENT_ID` | same as the key | Plain | runtime | Resend segment (audience) that receives the sign-ups. Needed together with the key. |
| `APPLE_TEAM_ID` | Production | Plain | build | 10 characters, A-Z and 0-9. For the apple-app-site-association file. Both this and `IOS_BUNDLE_ID` must be set or the file answers 404. Verified (route code). |
| `IOS_BUNDLE_ID` | Production | Plain | build | The app's real bundle id, exactly as in App Store Connect. Set it explicitly: `packages/brand` still has the placeholder domain `example.com`, so the brand default is wrong. The bundle id cannot change after the first upload to App Store Connect. Verified (repo). |
| `SITE_MODE` | Optional | Plain | build | `coming-soon` shows the holding page, `film` shows the scroll film. Unset: holding page on Production, film on previews and locally (`src/lib/site-mode.ts`, 4 tests). To publish the film on Production set `SITE_MODE=film` and Redeploy. Verified (repo, production-like and preview-like builds). |
| `ENABLE_LAB` | **Preview only**, `1` | Plain | build | Publishes the `/lab/*` scene test pages. Leave unset in Production: they answer 404 there. Verified (`next.config.ts`). |
| `LEGAL_DOCS_DIR` | not set | | build | Test override for the legal loader. Do not set. |

Mark `RESEND_API_KEY` as Sensitive so its value cannot be read back from the dashboard after saving. Inferred (Vercel's
Sensitive environment variable type; availability on your plan and the exact dashboard wording were not checked).

No variable holds entry text, a child name or a person's address. Logs and analytics follow the repo privacy rules.

### 3.1 Analytics decision

**Recommendation (Opinion): ship v1 with analytics off. When you want numbers, turn on Vercel Web Analytics and nothing else.**

- Consistent with `docs/analytics/TRACKING_PLAN.md`, which has no website analytics at launch.
- What Vercel Web Analytics collects: timestamp, path, referrer, query string (filtered by our code), country/region, OS,
  browser, device type. No cookies; the visitor id is a hash of the request, discarded after 24 hours. Verified (Vercel docs).
  So no cookie banner is needed for it. Whether the wording in `docs/legal/privacy-policy.md` ("no tracking SDKs") still reads
  true is a counsel question: before enabling, have the privacy policy and `claims-registry.yaml` reviewed. Opinion.
- Custom events (`cta_click`, `notify_submit`, `scene_reached`) need Pro or Enterprise; on Pro each event may carry 2 properties.
  Ours carry at most 2. Hobby gets page views only. Verified (Vercel docs). Without Pro, page views are still counted.
- Our code (`src/lib/analytics`) adds guards beyond Vercel's: off unless `NEXT_PUBLIC_ANALYTICS=vercel`; silent when the browser
  sends Global Privacy Control or Do Not Track; only values from closed lists can be sent (no free text, never an address or a
  name); query strings are cut down to `ref` and `utm_*` with plain values. Verified (29 tests, and a headless Chromium run:
  off means no request, no cookie, no storage; on means the queue only, no cookie, no storage).
- The script and the event endpoint are same-origin (`/_vercel/insights/...`), which the site's Content-Security-Policy
  (`connect-src 'self'`) allows. Inferred (not run against a real Vercel deployment).

To turn on (after the privacy review): Vercel project > Analytics > Enable; set `NEXT_PUBLIC_ANALYTICS=vercel` in Production;
Redeploy; check in section 9. To turn off: unset the variable and Redeploy.

## 4. Domains and DNS

### 4.1 What Porkbun has today (Verified: public DNS lookups, 2026-10-03)

Both domains use Porkbun nameservers (`curitiba`, `fortaleza`, `maceio`, `salvador` `.ns.porkbun.com`).
Both still carry Porkbun's default parking records:

| Domain | Parking records seen |
|---|---|
| earlyletters.com | apex resolves to Porkbun addresses (an ALIAS to `uixie.porkbun.com`), and every other name, including `www`, answers a CNAME to `uixie.porkbun.com` (a wildcard `*`) |
| earlyletters.app | apex resolves to Porkbun addresses (an ALIAS to `pixie.porkbun.com`), and every other name, including `www`, answers a CNAME to `pixie.porkbun.com` (a wildcard `*`) |

`earlyletters.app` has no email records of any kind. Neither domain has AAAA or CAA records.

### 4.2 Records to add (Vercel documents these values today; Verified, Vercel docs read 2026-10-03)

For **each** of `earlyletters.com` and `earlyletters.app` (same two records on both):

| Type | Host (Porkbun "Host" box) | Answer | TTL |
|---|---|---|---|
| A | blank (the root) | `76.76.21.21` | 300 |
| CNAME | `www` | `cname.vercel-dns-0.com` | 300 |

Rules:
1. **The values Vercel shows in the project's Domains page win.** Vercel's documented values (`76.76.21.21` and
   `cname.vercel-dns-0.com`) are the general ones and keep working. Newer projects may be shown project-specific values instead,
   for example an A record such as `216.198.79.1` and a CNAME such as `<hash>.vercel-dns-017.com`. Copy what the domain card says
   at the moment you add the domain, character for character. Verified (Vercel docs describe both forms).
2. Do not add AAAA records. Vercel does not ask for them. Verified.
3. Do not move nameservers to Vercel. Vercel's DNS would then be authoritative, so every record in section 5 would have to be
   recreated there by hand. Inferred from how DNS delegation works; Opinion that it is not worth the risk.
4. TTL: use the lowest Porkbun accepts (Vercel's docs show 300; if Porkbun refuses it, use 600). Inferred.
5. The apex must be an **A** record, not an ALIAS or CNAME, because the apex also holds MX and TXT records that a CNAME
   there would break. Standard DNS rule. Verified.

### 4.3 Order of work

1. Founder creates `earlyletters-web` and gets one green deployment. Check it on its `*.vercel.app` URL with section 9, parts A and B.
2. **Save a copy of every Porkbun record first** (screenshot, or the command in section 5). Nothing else is optional here.
3. In Vercel: Settings > Domains > Add: `earlyletters.com` (this is the primary and gets Production). Then add
   `www.earlyletters.com`, `earlyletters.app` and `www.earlyletters.app`.
4. In Porkbun (DNS Records, per domain): delete the parking ALIAS on the root and the `*` CNAME (and an explicit `www` CNAME if
   one is listed), then add the two records from 4.2. Porkbun may refuse an A record while an ALIAS or CNAME exists for the same
   host, which is why the parking records go first. Inferred (Porkbun's screens were not opened).
   Delete only the parking records. Every other record stays (section 5).
5. Wait for Vercel's domain card to turn green (valid configuration, certificate issued by Vercel automatically). Usually minutes,
   can be longer. Verified (Vercel issues certificates automatically).
6. Redirects, in Vercel: Settings > Domains > the domain > Edit > Redirect to Another Domain: target `earlyletters.com`, status
   **308 Permanent Redirect**, for all three of `www.earlyletters.com`, `earlyletters.app`, `www.earlyletters.app`.
   Verified (the API allows 301, 302, 307, 308; the dashboard flow is Edit > "Redirect to"). Inferred (exact dashboard labels).
7. Run section 9, parts C and D, and the email-record diff from section 5.

Opinion: after step 7, `*.earlyletters.com` and `*.earlyletters.app` no longer need to resolve to anything. Removing the parking
wildcard (step 4) already does that; do not add a new wildcard.

### 4.4 Optional hardening for earlyletters.app (Opinion)

The `.app` domain sends no email. Two TXT records stop it being used to forge mail: host blank, `v=spf1 -all`; host `_dmarc`,
`v=DMARC1; p=reject;`. Add only after the parking wildcard is gone. Skip if you would rather keep the change small.
Resend shows `earlyletters.app` as `not_started` (Verified, read-only check); leave it that way unless mail is ever sent from it.

### 4.5 HSTS note

The site sends `Strict-Transport-Security: max-age=63072000; includeSubDomains` (two years, no `preload`; Verified, `next.config.ts`).
Once a browser has seen it, every subdomain of `earlyletters.com` must work over HTTPS. Opinion: keep any future subdomain
(status page, docs) on Vercel or another HTTPS host, and do not submit to the preload list until you are sure.
`.app` is an HTTPS-only top-level domain for browsers that ship its preload entry. Inferred (known registry policy, not
re-checked today).

## 5. Records that must not change (email)

Run this before touching DNS, save the output, and run it again after step 7 in 4.3. The two outputs must be identical.

```bash
for n in "MX earlyletters.com" "TXT earlyletters.com" "TXT _dmarc.earlyletters.com" \
         "TXT resend._domainkey.earlyletters.com" "MX send.earlyletters.com" \
         "TXT send.earlyletters.com" "CNAME rsend.earlyletters.com"; do
  echo "== $n"; dig +short $n
done > email-records-$(date +%H%M).txt
```

Seen on 2026-10-03 (Verified, public DNS lookups). **Do not edit, delete or "tidy" any of these:**

| Type | Host | Value | What it is |
|---|---|---|---|
| MX | `@` | `9 inbound-smtp.us-east-1.amazonaws.com` | Inbound mail endpoint (Amazon SES region, matches Resend receiving). Inferred. |
| MX | `@` | `10 fwd1.porkbun.com` and `20 fwd2.porkbun.com` | Porkbun email forwarding. Inferred. |
| TXT | `@` | `v=spf1 include:_spf.porkbun.com ~all` | SPF for the apex. |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@earlyletters.com; adkim=r; aspf=r;` | DMARC. |
| TXT | `resend._domainkey` | `p=MIGfMA0G...` (218 characters; copy from the Resend dashboard, never retype) | Resend DKIM key. |
| MX | `send` | `10 feedback-smtp.us-east-1.amazonses.com` | Resend bounce handling. |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Resend SPF, on the `send` subdomain. |
| CNAME | `rsend` | `send.forge.rmta.net` | Present, owner not identified. Leave it. Inferred that it belongs to the mail setup. |

Resend marks `earlyletters.com` as verified (Verified, read-only check). The Vercel A and CNAME records in 4.2 sit beside
these without conflict because they are on other names (root A, `www`). The apex MX and TXT stay, which is also why the
apex cannot be a CNAME. Verified (DNS rule).

If a record is lost by accident: re-add it from the saved output; for the DKIM key copy from Resend (Domains > earlyletters.com),
then ask Resend to verify the domain again.

## 6. Launch day: flip the site to the App Store badge

Before: the app is released on the App Store (not only approved), and the link opens the product page on an iPhone.

1. Copy the product link from App Store Connect or the live listing: `https://apps.apple.com/<country>/app/<name>/id<digits>`.
2. Optional, for per-button counts in App Store Connect: create a campaign link in App Store Connect (the Analytics area, menu
   names not checked); Apple generates your provider token (`pt`) the first time, it cannot be made by hand. Put the digits in
   `NEXT_PUBLIC_APPLE_PROVIDER_TOKEN`. The campaign token `ct` is set by the site per button (`web-header`, `web-pill`,
   `web-start`, `web-footer`). Verified (Apple's Campaign Links help page). Note: Apple's help page says `ct` may be 30
   characters and its glossary says 40; our values are under 20, so both hold.
3. Vercel > Settings > Environment Variables: set `NEXT_PUBLIC_APP_STORE_URL` for **Production** only. Paste the bare link, no
   spaces or quotes.
4. **Redeploy** production (Deployments > latest production deployment > Redeploy; untick "Use existing build cache" to be
   safe). Editing the variable alone changes nothing. Verified (build-time inlining). Cache advice is Opinion.
5. Read the build log. There must be **no** `[launch] NEXT_PUBLIC_APP_STORE_URL is set but ignored` line. If there is, the link
   failed validation (wrong host, not https, no `/id<digits>`); fix it and redeploy.
6. Check live (command in section 9, part E): the page shows the badge and every App Store link starts with
   `https://apps.apple.com/`.
7. Click the badge on an iPhone. It opens the App Store product page.
8. If analytics is on, click each badge once and look for `cta_click` with `mode=live` in Vercel Analytics (Pro).
9. The sign-up segment in Resend keeps everyone who asked to be told; send the launch message from Resend, not from this site.

Revert the same day if needed: unset `NEXT_PUBLIC_APP_STORE_URL` and Redeploy, or use Rollback (section 7) to the last
prelaunch deployment.

## 7. Rollback

**Site.** Vercel Instant Rollback: Deployments > pick a previous production deployment > menu > Instant Rollback. It repoints the
domains at that deployment at once, with no rebuild. Verified (Vercel docs). The CLI equivalent is `vercel rollback`. Inferred.

- After a rollback Vercel stops auto-assigning production domains, so a later push does **not** go live until you press
  "Undo Rollback" in the dashboard or run `vercel promote <deployment>`. Verified. Say so in the team channel when you roll back.
- On Hobby only the immediately previous deployment can be rolled back; Pro can pick any earlier production deployment. Verified.
- Environment variables are not rolled back: project settings stay as they are, and each deployment keeps the values it was
  built with. So a rollback to a prelaunch build shows the prelaunch page even while `NEXT_PUBLIC_APP_STORE_URL` is set,
  and the AASA file in that build is the one it shipped with. Verified (docs say variables are not rolled back); the rest follows
  from build-time inlining. Inferred.
- Fix the cause on a branch and merge; or press "Undo Rollback" when the original is good again.

**A bad variable.** Edit the variable, Redeploy. A rollback alone will not change what a new deployment builds with.

**DNS.** To undo section 4.3 step 4 put the saved Porkbun records back (parking ALIAS and `*` CNAME). Email records were never
touched, so mail keeps working either way. Opinion: you should not need this; a wrong DNS entry is fixed by correcting it.

**Releases from CI.** `web.yml` never deploys. Vercel deploys from Git; there is nothing to cancel on the GitHub side.

## 8. Apple universal links (apple-app-site-association)

The file is served at `https://earlyletters.com/.well-known/apple-app-site-association` by
`src/app/.well-known/apple-app-site-association/route.ts` (E1). Verified (repo).

- Built at `next build` from `APPLE_TEAM_ID` and `IOS_BUNDLE_ID`. Set both **before** the production build, or Redeploy after
  setting them. With either missing or malformed it answers 404 and logs a warning.
- Content: `appIDs: ["<TEAMID>.<bundle id>"]`; paths `/a`, `/i`, `/j`, `/r`, each bare and with sub-paths. Verified (repo).
- Apple's requirements: HTTPS with a valid certificate, no file extension, JSON content type, **no redirects**. Apple's CDN
  fetches the file and may take up to 24 hours to show a change; devices re-check about weekly. Verified (Apple documentation).
- Every host needs its own entitlement and its own file. Verified (Apple). So the app's Associated Domains entitlement lists
  **only** `applinks:earlyletters.com`. Do not list `www.` or `earlyletters.app`: they answer 308, and Apple does not follow
  redirects for this file. Opinion based on the verified rules.
- For development builds you can add `?mode=developer` to the entitlement (`applinks:earlyletters.com?mode=developer`) and
  enable developer mode on the device; remove it for release. Inferred (Apple feature, not run here).

Verify:

```bash
# 1. Direct: 200, JSON, no redirect (look for "HTTP/2 200", content-type application/json, and no "location" header)
curl -sSI https://earlyletters.com/.well-known/apple-app-site-association

# 2. Content: the app id must read TEAMID.bundle.id exactly as in the Apple Developer account
curl -sS https://earlyletters.com/.well-known/apple-app-site-association | python3 -m json.tool

# 3. What Apple's CDN holds (can lag up to 24 h behind step 2)
curl -sS https://app-site-association.cdn-apple.com/a/v1/earlyletters.com

# 4. The redirect hosts must NOT be listed in the entitlement; this is expected to be 308
curl -sSI https://www.earlyletters.com/.well-known/apple-app-site-association | head -3
```

On an iPhone with the app installed: Notes > type `https://earlyletters.com/j` > long press shows "Open in Early Letters"
(wording depends on the app name) when the link is associated. Inferred.

## 9. Production checks

Run A and B on the `*.vercel.app` URL before DNS, and all of them after. Replace `HOST` with the URL.

**A. Build and pages** (before DNS, on the `*.vercel.app` URL; Deployment Protection may answer curl with 401, so open it in a
browser signed in to Vercel, or just run A to H after DNS)

```bash
HOST=https://earlyletters.com
for p in / /privacy /terms /health-privacy /subprocessors /delete-account /robots.txt /sitemap.xml; do
  printf '%s  ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$HOST$p"
done                                                    # expect 200 for each
curl -s -o /dev/null -w '/lab/s01 %{http_code}\n' $HOST/lab/s01     # expect 404 in Production
curl -s -o /dev/null -w '/nothing-here %{http_code}\n' $HOST/nothing-here   # expect 404 (the site's own page)
```

**B. Security headers**

```bash
curl -sSI $HOST | grep -i -E 'strict-transport|content-security|x-frame|x-content-type|referrer-policy|permissions-policy'
```
Expect all six, HSTS `max-age=63072000; includeSubDomains`, CSP with `default-src 'self'` and no third-party origins.
Verified (`next.config.ts`).

**C. Domains and redirects** (after DNS)

```bash
curl -sSI http://earlyletters.com | head -3                       # expect a redirect to https (308)
for h in www.earlyletters.com earlyletters.app www.earlyletters.app; do
  echo "== $h"; curl -sSI "https://$h/privacy?x=1" | grep -i -E '^HTTP|^location'
done      # expect 308 and location: https://earlyletters.com/privacy?x=1 (path and query kept)
curl -sSI https://earlyletters.com | grep -i -E '^HTTP|^server|x-vercel'     # expect 200 and Vercel headers
dig +short A earlyletters.com ; dig +short CNAME www.earlyletters.com        # the values from the Vercel domain card
```
Redirect behaviour for path and query is Inferred (Vercel's documented behaviour for a domain redirect; confirm with this check).

**D. Email records unchanged:** run the section 5 command again and compare with the saved file. Also open Resend > Domains:
`earlyletters.com` still verified.

**E. Launch state**

```bash
# prelaunch: no apps.apple.com link; launch: only apps.apple.com links
curl -s https://earlyletters.com | grep -o 'https://apps\.apple\.com[^"]*' | sort -u
```
Whether the links are in the first HTML or added by the browser after load depends on the components (Inferred). If the command
prints nothing after launch, open the page in a browser and inspect the badge link instead.

**F. Notify form** (wiring only; it does not create a sign-up)

```bash
curl -s -X POST https://earlyletters.com/api/notify \
  -H 'content-type: application/json' -H 'origin: https://earlyletters.com' -d '{"email":"nope"}'
# expect {"ok":false,"error":"invalid"}
```
End to end: submit the form once in a browser with an address you control; check it appears in the Resend segment; then
remove that contact. Never use a real family address in tests or docs (repo privacy rule; tests use the fictional family "Asha").
If the form answers `server` in Production, `RESEND_API_KEY` or `RESEND_SEGMENT_ID` is missing; set both and Redeploy.

**G. Analytics** (only when enabled)

In a normal browser: DevTools > Network shows `/_vercel/insights/script.js`; Application > Cookies shows **none** for the site;
Local Storage has no analytics keys. With Global Privacy Control on (or a browser that sends it) the script does not load.
Vercel project > Analytics shows the visit within a few minutes. With analytics off, none of this happens: no script request at all.

**H. Universal links:** section 8.

### 9.1 Spam control for the sign-up form (do this before launch)

The function has an in-memory rate limiter, which Vercel's many short-lived instances make only a backstop. The real control is a
Vercel Firewall rate-limit rule (E2's design): Project > Firewall > Custom Rules > New rule:
path equals `/api/notify` and method equals `POST`; rate limit by IP, fixed window; Opinion on the values: 5 requests per 60 seconds,
action "Rate Limit" (answers 429, Inferred; the form already shows a 429 as "try again shortly"). The CLI has the same options
(`vercel firewall rules add --action rate_limit --rate-limit-window 60 --rate-limit-requests 5 --rate-limit-keys ip`).
Verified (Vercel CLI docs: window 10 to 3,600 seconds, algorithms fixed_window and token_bucket). Whether your plan includes
the rule is Inferred; the Firewall page shows it. Check afterwards with six quick POSTs; the sixth must answer 429.

## 10. Routine work

- **Preview deployments** build for every pull request that touches the site, using the same install and build. They have no
  App Store link and no `RESEND_*` keys unless you set them for Preview. To look at the `/lab` pages, set `ENABLE_LAB=1` for
  Preview and Redeploy that preview.
- **Legal text changes** (`docs/legal/*.md`) rebuild the site, because the pages are generated from those files at build.
  `docs/legal` is in the CI path filter for that reason. Verified (repo).
- **Before merging anything that changes `apps/web/vercel.json`:** run in a clean checkout
  `npm ci --workspace=@scribe/web && npm run build -w @scribe/web`. Do not rely on a machine that already has `node_modules`.
- **Dependencies:** `@vercel/analytics` ^2.0.1 (MIT) is a dependency of `@scribe/web`. Updating it is a normal pull request.

## 11. Open items (as of 2026-10-03)

1. Vercel's own build was not run from here; the install and build were run in a clean local worktree (Node 22.22, npm 10.9).
2. The legal loader (`src/lib/legal/load.ts`, E1) makes Turbopack print "Dynamic filesystem access causes tracing of the whole
   project". Harmless so far (notify function trace stays small); worth a look by E1.
3. `IOS_BUNDLE_ID` has no safe default until `packages/brand` gets the real domain (BL-100).
4. Hobby is non-commercial: move to Pro before launch, and before enabling custom analytics events.
5. Privacy policy wording and claims registry need a counsel check before analytics is switched on.
6. `earlyletters.app` has no mail setup; Resend shows it `not_started`.
7. Founder to confirm the Production Branch (`main`) and that "Include source files outside of the Root Directory" is on.
