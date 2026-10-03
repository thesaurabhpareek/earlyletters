# Speech models and language packs: hosting and integrity

Owner: founder (picks the host, D-046), AI engineer. Written 3 Oct 2026. Decisions: brief decision 15 (lean app, everything else on demand), brief decision 16 (server-driven content, signed manifests), D-046 (zero or free egress, never Supabase egress), D-033 (where the model lives on the device).

## What is downloaded, and why it is data

- **Ships in the app:** code, the English text-rules pack, fonts subset to the glyphs we use. Download size budget: under 40 MB, measured on every release build.
- **Downloaded on demand:** speech model files, and the language pack for each language other than English, only when an author picks that language. Picking Portuguese downloads the Portuguese pack and nothing else. Packs can be deleted in Settings.
- **A pack is data.** Versioned JSON (rules, filler and negation tables, punctuation profile, phonetic tables, prompt text) plus a model weights file. A generic engine already compiled into the app interprets it. A pack never contains scripts, expressions, bytecode, native libraries or JavaScript bundles, and the JSON is validated against a schema with no field that can carry code.
- **Why this matters:** App Store Review Guideline 2.5.2 says apps "may not ... download, install, or execute code which introduces or changes features or functionality of the app" (guideline text read 3 Oct 2026 at developer.apple.com/app-store/review/guidelines). Weights and tables interpreted by code that App Review already saw stay on the data side of that line. Anything that would change what the app does belongs in an app release, not a pack. Our reading of how the guideline applies is our own, not Apple's.

## The manifest

One manifest per environment lists every available pack and model. Proposed shape (to be fixed as a typed contract in `packages/api`, brief decision 17):

```json
{
  "schema": 1,
  "manifest_version": 42,
  "issued_at": "2026-10-03T00:00:00Z",
  "expires_at": "2026-11-03T00:00:00Z",
  "min_app_build": 1,
  "packs": [
    {
      "id": "pt",
      "kind": "language",
      "version": "1.0.0",
      "engine_version": 3,
      "files": [
        { "path": "f/<sha256 of rules.json>", "bytes": 48213, "sha256": "<64 hex>" },
        { "path": "f/<sha256 of model.bin>", "bytes": 190000000, "sha256": "<64 hex>" }
      ]
    }
  ],
  "key_id": "2026a",
  "signature": "<base64 signature over the canonical bytes of everything above>"
}
```

Rules:

1. **Signed.** The manifest is signed with an offline private key held by the founder ([SECRETS.md](SECRETS.md), `MANIFEST_SIGNING_KEY_<keyid>`). The app bundles the public keys for the current and next `key_id`, so a key can be rotated with an app release. Algorithm proposal: Ed25519; the exact library on device must be chosen and its API checked against the installed version (not chosen yet).
2. **SHA-256 per file.** The app hashes each file while it downloads and accepts it only if the hash and byte count match the signed manifest. A mismatch deletes the partial file and retries later; it never falls back to an unverified copy.
3. **No rollback.** The app refuses a manifest whose `manifest_version` is lower than the last one it accepted, or whose `expires_at` has passed (it keeps using what it already has).
4. **Compatible only.** A pack whose `engine_version` or `min_app_build` the installed app does not support is ignored, not half-loaded.
5. **Immutable, content-addressed paths.** Every file is stored at `f/<sha256>`, named by its own hash, never by language or pack id. A file at a path never changes; a fix is a new file and therefore a new path. This lets the CDN cache forever and keeps language names out of request paths (see Download privacy below).
6. **Same manifest machinery for server-driven content** (prompts, tips, remote config blocks; brief decision 16): signed or hashed, cached on device, and the app always works from its last good copy.

## Download privacy

A family's chosen language is personal data in our classification (L4 when tied to a person). The request for a pack must not reveal it more than necessary, so:

1. **No language in the path.** Files are fetched by hash (`f/<sha256>`). Access logs show a hash, not `pt/` or `hi/`.
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
2. Manifests served from the same edge with a short cache and `ETag`; pack and model files with a long immutable cache (brief decision 17).
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
