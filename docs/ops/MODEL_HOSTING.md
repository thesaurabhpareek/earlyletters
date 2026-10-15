# Speech models and language packs: hosting and integrity

Owner: founder (picks the host, D-046), AI engineer. Written 3 Oct 2026. Decisions: brief decision 15 (lean app, everything else on demand), brief decision 16 (server-driven content, signed manifests), D-046 (zero or free egress, never Supabase egress), D-033 (where the model lives on the device).

## What is downloaded, and why it is data

- **Ships in the app:** code, the English text-rules pack, fonts subset to the glyphs we use. Download size budget: under 40 MB, measured on every release build.
- **Downloaded on demand:** speech model files, and the language pack for each language other than English, only when an author picks that language. Picking Portuguese downloads the Portuguese pack and nothing else. Packs can be deleted in Settings.
- **A pack is data.** Versioned JSON (rules, filler and negation tables, punctuation profile, phonetic tables, prompt text) plus a model weights file. A generic engine already compiled into the app interprets it. A pack never contains scripts, expressions, bytecode, native libraries or JavaScript bundles, and the JSON is validated against a schema with no field that can carry code.
- **Why this matters:** App Store Review Guideline 2.5.2 says apps "may not ... download, install, or execute code which introduces or changes features or functionality of the app" (guideline text read 3 Oct 2026 at developer.apple.com/app-store/review/guidelines). Weights and tables interpreted by code that App Review already saw stay on the data side of that line. Anything that would change what the app does belongs in an app release, not a pack. Our reading of how the guideline applies is our own, not Apple's.

## The manifest

The contract is built on `develop` (ADR 0016); this section describes it and does not redefine it. Checked against `develop` at 56ec5b5 on 15 Oct 2026.

- **Shape:** `packages/api/src/pack-manifest.ts`, schema version 1. The payload has `schemaVersion`, `version` (increases with every publish), `generatedAt` and `packs`. Each pack entry has `id` (for example `text-rules.pt`), `kind` (`speech-model`, `text-rules` or `prompts`), `language`, `version`, `url`, up to 3 `mirrors`, `bytes`, `sha256`, `fileName`, `minAppVersion` and `required`. An entry the app does not understand is skipped and counted, never fatal.
- **Signature:** every public document (pack manifest, remote config, content bundle) is a `SignedDocument` envelope (`kind`, `keyId`, `sig`, `payload`), signed with Ed25519 over `early-letters/<kind>/v1` plus the canonical JSON of the payload (`packages/api/src/integrity.ts`, using `@noble/ed25519`). The kind prefix stops a signed config being replayed as a manifest.
- **Keys:** the app trusts only the public keys in `packages/api/src/keys.ts`. That list is empty until the founder runs `scripts/packs/keygen.ts` and pastes the public key; while it is empty the app fails closed (installs no downloaded pack, keeps its bundled config). The private key lives in the founder's password manager and is passed to `scripts/packs/publish.ts` as `EL_SIGNING_KEY` and `EL_SIGNING_KEY_ID`, never in the repo, CI or a server ([SECRETS.md](SECRETS.md)).
- **Publishing:** `scripts/packs/publish.ts` builds and signs; it never uploads. It writes pack files to `dist/packs/<id>/<version>/<file>` and each signed document into `supabase/functions/<fn>/published.ts`, then prints the manual upload and deploy steps.

Rules the built code enforces:

1. **Signed.** The app checks the envelope, the key id and the kinds that key may sign before it reads the payload.
2. **SHA-256 per file.** A pack file is trusted only when its SHA-256 and byte count match its manifest entry. A mismatch deletes the download and tries the next mirror; there is no fallback to an unverified copy (`apps/mobile/src/lib/packs/engine.ts`).
3. **No rollback.** The app refuses a manifest whose `version` is lower than the last one it accepted. The manifest has no expiry field.
4. **Compatible only.** An entry whose `minAppVersion` is newer than the installed app is ignored, not half-loaded.
5. **Immutable, versioned paths.** A file at a path never changes; a fix is a new pack `version` and therefore a new path, so the CDN can cache it forever.
6. **Same machinery for server-driven content** (remote config and content bundles; brief decision 16, D-068): signed, cached on the device, and the app always works from its last good copy.

## Download privacy

A family's chosen language is personal data in our classification (L4 when tied to a person). The request for a pack must not reveal it more than necessary, so:

1. **No language in the path (proposed change).** Built today, pack URLs are `<base>/<id>/<version>/<file>`, so an access log shows `text-rules.pt`. Proposed: have `scripts/packs/publish.ts` publish each file under a hash-named path (`<base>/f/<sha256>`) and put that in the entry's `url`; the app already accepts any https `url`, so no app change is needed. Until that lands, the host can see which language pack was fetched.
2. **No identifiers on pack requests.** No user id, device id, auth token, cookie or per-user query parameter is sent to the pack host. Requests are anonymous `GET`s, identical for every device that picks the same language.
3. **Minimal host logs.** Keep CDN or bucket access logging off, or at the shortest retention the host allows, and never join it with Supabase data. Record the chosen setting in the data map.
4. **The manifest is fetched whole.** The app downloads the full manifest (all languages) and picks locally, so the manifest request reveals nothing.

Limit, stated plainly: the manifest is public, so anyone holding it can map a hash back to a language, and file sizes differ per language. These steps stop readable paths in logs and casual exposure; they do not hide the choice from the host operator itself. That residual is acceptable because the host receives no account identifiers, only IP addresses, and we keep its logs minimal. If this ever needs to be stronger, the option is padding files to common size buckets.

## On the device

- Model and pack files go in Application Support, excluded from device backup (D-033, ARCHITECTURE status box). Recordings are never stored with them.
- Download only on the author's choice of language, on Wi-Fi by default, with progress, resumable. The app never blocks recording while a model downloads: audio is saved first, words follow (ARCHITECTURE R2).
- Deleting a pack in Settings removes its files and its manifest entry from the local cache.

## Hosting options

| Option | What is verified | What is not | Fit |
|---|---|---|---|
| **Apple-hosted Background Assets** (managed asset packs) | Apple offers system-managed asset downloads and optional hosting on Apple servers; you upload asset packs to App Store Connect and they download separately from the app build (Background Assets docs and App Store Connect Help, read 3 Oct 2026). Apple-hosted packs need **iOS 26 or later** (iOS 27 for localized asset packs). Limits: 200 asset packs and 200 GB total per app record. Packs are made with Xcode's packaging tool or Apple's Linux developer tools, and can be tested through TestFlight. | Cost (not stated on the pages read). **Expo feasibility is UNVERIFIED:** the community config plugin `@bacons/apple-targets` lists a `bg-download` (Background Download Extension) target type in its README, but nobody has confirmed an end-to-end path with EAS Build, asset pack upload from our pipeline, and a JavaScript bridge to `AssetPackManager` (which would need our own Expo module). | Attractive for iOS 26+ only. Our minimum is iOS 17 (D-040), so it can never be the only host. Revisit after a spike. |
| **Cloudflare R2** | Egress from R2 is free ("does not incur data transfer (egress) charges"); free tier 10 GB-month storage, 1 million Class A and 10 million Class B operations per month, Standard storage only (Cloudflare R2 pricing page, read 3 Oct 2026). | Paid rates beyond the free tier are not quoted here; read the pricing page before committing. Custom domain and cache settings to be checked during setup. | **Recommended primary host** for packs, models and manifests, behind a custom domain such as `packs.earlyletters.com` (proposed). |
| **Hugging Face** (public model files) | Models already live there (ARCHITECTURE sources). | Rate limits and terms for downloads from a shipped app at scale: **Unverified** (the docs page could not be opened in this session). | Good as the **source of truth** for public model weights: pin an exact revision, mirror the pinned files to R2, record the revision and SHA-256 in the manifest. Do not point the app straight at it until the terms are checked. Each model's licence must allow redistribution. |
| Supabase Storage | | | **No.** D-046: egress cost at scale. |

## Recommendation

1. R2 bucket per environment (or one bucket with `staging/` and `prod/` prefixes), public read through a custom domain, write only by the founder or a protected publish job.
2. Signed documents are served today by Edge Functions (`supabase/functions/config` and `content`, from the `published.ts` files the publish script writes) with an `ETag` and a short cache; pack and model files from the pack host with a long immutable cache (brief decision 17).
3. Public model weights mirrored from a pinned Hugging Face revision; our own pack JSON published only by us.
4. Add the host to the data map and the subprocessor list review: no personal data goes there, but its access logs hold IP addresses. Apply the Download privacy rules above (hash-named paths, no identifiers, minimal logs).
5. Spike Apple-hosted Background Assets later for iOS 26+ devices, with the CDN as the fallback for everyone else. Decide only after the Expo path is proven on a real build.

## Publishing a pack (outline)

1. Build the pack JSON and validate it against the schema (CI test).
2. Compute SHA-256 and byte counts for every file.
3. Upload files to their versioned paths (never overwrite).
4. Write the new manifest with a higher `manifest_version`; sign it on the founder's machine.
5. Publish to staging; install a `preview` build; pick the language; confirm download, verification and transcription.
6. Publish the same files and a production-signed manifest to production.
7. Keep old versions available until no supported app build references them.

Founder decisions still open: the host (D-046), whether staging and production use separate signing keys (recommended), and who holds a backup of the signing key.
