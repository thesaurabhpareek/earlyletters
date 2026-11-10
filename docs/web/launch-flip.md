# Launch flip: earlyletters.com from "Tell me at launch" to the App Store

Status: built, OFF. With `NEXT_PUBLIC_APP_STORE_URL` unset (today) the site is exactly what it was: no QR, no badge, no App Store link, the email form is the one action. This page is the whole procedure for turning the launch on and off. It is T2 (release configuration): two independent reviews on the final head of the PR that flips it.

## The one switch

`NEXT_PUBLIC_APP_STORE_URL` in Vercel (Production). A valid official link turns the launch on; unset turns it off. Everything else below is a precondition that the build now checks for you.

## What must be true first

1. The app is released on the App Store (not only approved) and the link opens the product page on an iPhone. The link looks like `https://apps.apple.com/us/app/<name>/id<digits>`.
2. Apple's official "Download on the App Store" badge artwork is added by the founder after checking Apple's licence wording at developer.apple.com/app-store/marketing/guidelines. It is NOT in the repo. Put it at `apps/web/public/brand/app-store-badge.svg` in the flip PR. Do not scale, fade, angle or animate it (Apple's rules); the site does none of those.
3. Vercel Pro is in place (Hobby is non-commercial; the pricing scene already advertises Plus).
4. Privacy and Terms text for launch is merged (they must stop saying the app is not out; founder wording, D-125 and D-132).
5. Optional but recommended: the Apple provider token (`pt`, digits), from the first campaign link made in App Store Connect.
6. `SITE_MODE=film` for Production. The download action lives in the film; the holding page has none, and the build refuses a launch without it.

## The order

1. Branch `feat/web-launch-<date>` from `develop`.
2. Add the badge file (step 2 above).
3. Make the QR (author time, never at build): `npm run qr:generate -w @scribe/web -- "<store link>" <provider token>`. It checks the link against the `apps.apple.com` allowlist, adds `ct=web-qr`, draws the QR with the pinned devDependency `qrcode-generator@2.0.4` and writes `apps/web/src/lib/qr/qr.generated.ts`. Commit it. Reviewers read the diff: `url` must be the link, and `test/qr.test.ts` re-draws it and fails if the file was edited by hand.
4. Open the PR (T2, two independent reviews on the final head). Merge.
5. Vercel > Settings > Environment Variables, Production only: `NEXT_PUBLIC_APP_STORE_URL` (the bare link, no quotes), `NEXT_PUBLIC_APP_STORE_BADGE=1`, and `NEXT_PUBLIC_APPLE_PROVIDER_TOKEN` if you have it. Leave `LAUNCH_REHEARSAL` unset.
6. Redeploy production without the build cache. Variables are read at build time; editing alone changes nothing.
7. Read the build log. There must be no `[launch] ... ignored` line and no `[launch] The launch switch is on ... but the launch is not ready`. On Vercel production builds (and with `LAUNCH_STRICT=1`) the build stops by itself if the badge file is missing, is not an SVG, is a stand-in, contains script, if `NEXT_PUBLIC_APP_STORE_BADGE` is not 1, if `SITE_MODE` is not film, or if the committed QR is empty or opens a different link than this deployment's `ct=web-qr` link.
8. Checks on the live site: section 9 of `docs/ops/WEBSITE_RUNBOOK.md`; the badge shows on a phone; a laptop shows the QR with "Scan with your iPhone camera." and "Open the App Store"; every App Store link starts with `https://apps.apple.com/`; scan the QR from the laptop screen with an iPhone and the product page opens; tap the badge on a real iPhone.
9. Campaign links: App Store Connect shows a token only after 24 hours or more of data, and only once it has 5 first-time downloads. Tokens: `web-header`, `web-pill`, `web-start`, `web-footer`, `web-qr`, plus `web-hero`, `web-end` and `email-launch` for the helper in `apps/web/src/lib/campaign.ts`.

The CI job "Build (live, launch-day rehearsal)" in `web.yml` builds with a placeholder link and no artwork. It is not a Vercel production build, so there the same findings print as `[launch]` warnings and the build still passes, which keeps proving the App Store branch compiles.

## Checks before the PR: the rehearsal

From `apps/web`: `node scripts/release-check.mjs launch`. It builds with a made-up store link and proves: the build fails without the badge file; the build fails without a QR made for the link and says to run `npm run qr:generate`; with both, the build succeeds; a fine-pointer desktop shows the QR and hides the badge; touch phones (390 and 320 wide) show the badge and hide the QR; no console errors, no sideways scroll, and every request goes to this machine (no QR service, no third party). It restores the committed QR file and removes its stand-in badge when done. `node scripts/release-check.mjs` (no argument) is the ordinary smoke test of the current site.

## Rollback, one step

Unset `NEXT_PUBLIC_APP_STORE_URL` in Vercel and redeploy: the site is prelaunch again. Faster: Vercel Instant Rollback to the last prelaunch deployment (a rollback does not undo variables; each deployment keeps the values it was built with). The badge file and the committed QR can stay in the repo; they do nothing while the variable is unset.

## What this kit does not do

No Android detection, no second email segment, no smart app banner, no popup, no gift page, no `/get` redirect, no analytics, no tracking pixel, no cookie, nothing stored, no third-party QR service. The QR is a static SVG made by hand and committed (CISO ruling, council round 2): `qrcode-generator` is a devDependency pinned exactly, installed with `--ignore-scripts`, imported only by `scripts/gen-store-qr.mjs`, never by the site or the build, and given no environment (the link is an argument).

## Supply chain note for the QR dependency

`qrcode-generator` 2.0.4, MIT licence, lockfile integrity `sha512-mZSiP6RnbHl4xL2Ap5HfkjLnmxfKcPWpWe/c+5XxCuetEenqmNFf1FH/ftXPCtFG5/TDobjsjz6sSNL0Sr8Z9g==`. The CISO read of that version found no network, `process.env` or `eval` use. That is a read of one version, hence the exact pin and the committed output with a re-draw test.
