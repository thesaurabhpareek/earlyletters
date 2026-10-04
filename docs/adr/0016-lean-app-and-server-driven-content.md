# ADR 0016: Lean app, on-demand packs, and server-driven content inside native screens

Status: Proposed (implements founder decisions 15 and 16 of 3 Oct 2026; the hosting choice in section 3 needs the founder). Date: 2026-10-03. Owner: platform.
Code: `packages/api` (contracts), `apps/mobile/src/lib/packs`, `apps/mobile/src/lib/remote`, `apps/mobile/src/components/content-blocks`, `apps/mobile/src/app/settings/storage.tsx`, `supabase/functions/config`, `supabase/functions/content`, `scripts/packs`, `scripts/size`.
Related: ADR 0001 and 0012 (speech models), ADR 0014 (text-rules packs, language agent), ADR 0015 (speech catalog, speech agent), ADR 0017 (API standards), D-046 (model host), `docs/ops/APP_SIZE.md`.

Evidence key: **V** = read on the cited page on 3 Oct 2026 (Sources at the end). **V-code** = read in the installed package source in this repo. **U** = unverified. **E** = our arithmetic from V numbers.

## 1. Context

- Decision 15: the App Store download stays under 40 MB. The app ships its code, the English text-rules pack and subset fonts. Speech models and every non-English language pack download only when an author picks that language. Packs are data, never code (App Store Review Guideline 2.5.2 forbids downloading executable code), checked by SHA-256 against a signed manifest. Packs can be deleted in Settings.
- Decision 16: screens and navigation stay native. Prompts, tips, onboarding story cards, announcements, remote config, feature flags, kill switches and pack manifests are server-delivered as typed, schema-validated, signed, cached content blocks rendered by our own components. The app always works from its last good copy. Nothing that changes data collection or the paywall, or that could slip past App Review, is server-driven.
- Existing facts: Expo SDK 57 modules declare iOS 16.4 as their minimum (V-code: `node_modules/expo/Expo.podspec` `:ios => '16.4'`). Speech models are 0.9 MB to 574 MB (ADR 0012, ADR 0015). The Supabase project is in us-west-1 (TDD 02).

## 2. Decision summary

1. **One pack system** (`src/lib/packs`) for every downloadable file: resumable HTTP Range download, SHA-256 against a signed manifest, atomic install into Application Support (excluded from backup), Wi-Fi only for anything over 5 MB unless the person allows mobile data, a remote kill switch, progress, cancel and delete. The speech and language engines ask for packs by id; they never download anything themselves.
2. **One signing scheme** for the pack manifest, remote config and content bundles: Ed25519 over canonical JSON, signed offline on the founder's computer, public keys shipped in the app, fail closed.
3. **Hosting (recommended, founder decides):** pack files on a Cloudflare R2 public bucket behind a Cloudflare custom domain (zero egress fees), with pinned Hugging Face URLs as mirrors for upstream public model weights. The three small signed documents are served by two Supabase Edge Functions (`config`, `content`) with ETag and stale-while-revalidate, ready for a CDN in front. Apple-hosted Background Assets are rejected for v1.0 and revisited when the minimum iOS is 26. On-Demand Resources are rejected (legacy).
4. **Server-driven content is words only:** a closed vocabulary of four block types rendered by native components, with per-slot fallback to the packaged copy in `packages/content`. Full server-driven UI is out of scope (section 5).

## 3. Hosting: research and recommendation

### 3.1 Options

| Option | What it is | Fit for us | Evidence |
|---|---|---|---|
| **Apple-hosted Background Assets (asset packs)** | Packs uploaded to App Store Connect, downloaded by the system. Policies: essential (with the install), prefetch, on-demand. `AssetPackManager.ensureLocalAvailability`, `remove`, `statusUpdates`. 200 GB of Apple hosting and up to 200 packs per app, included in the Developer Program, shared across platforms | **iOS 26 and later only** (managed packs; localized packs iOS 27). We support iOS 16.4 and later, so a second download path is needed anyway. Needs a downloader app extension (`StoreDownloaderExtension`, a few generated lines) and an App Group for app and extension. Each pack version goes through App Review separately; a pack version can ship without an app version, but a fix to a Portuguese filler table would wait for review. Packs stay on device until the app calls `remove` | V: WWDC25 session 325; AssetPackManager docs; App Store Connect "Apple-hosted asset pack size limits", "Overview of Apple-hosted asset packs", "Submit Apple-hosted asset packs" |
| Expo feasibility of the above | A config plugin adds the extension target and App Group; a small local Expo module wraps `AssetPackManager` (a Swift actor) | Feasible: `@bacons/apple-targets` lists a `bg-download` (Background Download Extension) target type. Whether its template can host `StoreDownloaderExtension` instead of the older `BADownloaderExtension`, and the module itself, are **U** (not built). Estimated 2 to 4 days plus device testing | V: expo-apple-targets README (target table); U: everything past the table |
| **On-Demand Resources** | Tagged resources hosted by Apple | Apple: "a legacy technology, and it will be deprecated"; DTS: unwise in a new product | V: WWDC25 325; Apple Developer Forums thread 807744 |
| **Cloudflare R2, public bucket, custom domain** | S3-compatible object store; storage $0.015 per GB-month; Class A $4.50 and Class B $0.36 per million; free tier 10 GB-month, 1M Class A, 10M Class B per month; **egress free** | Lowest cost at scale; Cloudflare cache in front; Range requests standard. The custom domain must be a zone in the same Cloudflare account; a partial (CNAME) setup needs a Business or Enterprise plan, so on the free plan the domain's nameservers move to Cloudflare. `r2.dev` URLs are rate-limited and for development only | V: R2 pricing (updated 1 Oct 2026); R2 public buckets (25 Sep 2026); Cloudflare partial setup (14 Aug 2026) |
| **Hugging Face (public model repos)** | Free public hosting; anonymous downloads rate-limited at 3,000 resolver requests per 5 minutes per IP (each `/resolve/` request counts); public storage "best effort" for free accounts | Good mirror for upstream weights we do not modify (pinned revision, hash known). Not a primary for our own files: no SLA, rate limits can change, and a carrier NAT shares one IP across many phones. Range requests after the CDN redirect work with curl (ADR 0015, checked 3 Oct); through iOS URLSession redirects **U** until a device run | V: HF rate limits, HF storage limits |
| **Supabase Storage** | Pro plan includes 250 GB uncached and 250 GB cached egress; then $0.09 per GB uncached, $0.03 per GB cached (Smart CDN hits) | Fine for the small signed documents; far too expensive for model files at scale (D-046) | V: Supabase egress docs (2 Oct 2026) |

### 3.2 Cost of the speech models at scale (E)

Upper bound from TDD 06 4.2: 220k installs each fetching the 574 MB shared model once = about 126,000 GB (many phones take the 190 MB compact model or Hindi small, so the real figure is lower).

| Host | First wave | Notes |
|---|---|---|
| Supabase Storage, uncached | 126,000 GB x $0.09 = **about $11,300** | V prices |
| Supabase Storage, all CDN hits | 126,000 GB x $0.03 = **about $3,800** | best case |
| Cloudflare R2 | egress $0; 574 MB / 16 MiB = 35 Range requests per download x 220k = 7.7M Class B, inside the 10M free per month, else about $2.80; storage of all models (about 2.5 GB) inside the 10 GB free tier | **about $0 to $3** |
| Hugging Face (mirror) | $0 | best effort |
| Apple-hosted | $0 (inside 200 GB of hosting capacity) | iOS 26+ only |

Text-rules packs are kilobytes to a few megabytes; their cost is noise on any host.

### 3.3 Recommendation

- **Primary pack host: Cloudflare R2**, bucket `early-letters-packs`, public through a custom domain, objects at immutable versioned keys `<id>/<version>/<fileName>` with `Cache-Control: public, max-age=31536000, immutable` (set at upload), plus a Cache Everything rule so every file type is cached (V: "only certain file types are cached" by default).
- **Mirrors:** each manifest entry may list up to three mirrors. Upstream public weights get their pinned Hugging Face URL as a mirror (the speech catalog already pins revisions and hashes, ADR 0015). Our own files (Hindi and Mandarin conversions, text packs) are on R2 only, unless the founder chooses to publish them on Hugging Face too.
- **Domain (founder decides, section 8):** `packs.earlyletters.com` needs earlyletters.com's DNS on Cloudflare (free plan, full setup): Vercel's and Resend's records are recreated there first, then the nameservers change at Porkbun. The lower-risk alternative is to put only earlyletters.app (today a redirect) on Cloudflare and use `packs.earlyletters.app`. The speech catalog uses `models.earlyletters.com/speech`; one bucket can carry both hostnames, but one name for all packs is simpler (request to the speech agent in the report).
- **Signed documents:** the `config` and `content` Edge Functions (section 6). A Cloudflare proxy can be put in front later by setting `EXPO_PUBLIC_DOCS_BASE_URL`; no app logic changes.
- **Integrity does not depend on the host:** every byte is checked against the signed manifest, so a compromised host or mirror can deny service but cannot change what installs.
- **Revisit Apple hosting** when the minimum iOS becomes 26: it would remove a vendor for model files and could prefetch the speech model with the install. It would not replace R2 for text packs we want to fix without a review cycle.
- **Data map:** Cloudflare (and Hugging Face for mirrors) sees the phone's IP address and which pack it downloads; no account, no content (to add to the data map and subprocessor list, D-046).

## 4. The pack system

### 4.1 Contract (`packages/api/src/pack-manifest.ts`, version 1)

`PackManifest = { schemaVersion: 1, version, generatedAt, packs: PackEntry[] }`, served as `SignedDocument<PackManifest>` (kind `pack-manifest`).
`PackEntry = { id, kind: 'speech-model' | 'text-rules' | 'prompts', language (BCP 47 or 'mul'), version (integer), url, mirrors[], bytes, sha256, fileName, minAppVersion, required }`.

- Ids are `<kind>.<name>`: `text-rules.pt`, `prompts.hi`, `speech-model.whisper-large-v3-turbo-q5_0`.
- `required: true` means "this language needs it": downloaded when the language is chosen and kept up to date. Speech models are `required: false` because the right one depends on the language and the phone's memory; the speech engine picks it and asks by id (ADR 0015).
- A manifest may list several versions of one id; the app installs the highest `version` whose `minAppVersion` it meets, so an older app keeps a compatible pack when a newer engine format ships.
- Parsing is strict at the top and lenient per entry: an entry an older app does not understand is skipped, never fatal.

### 4.2 Integrity

- Signed bytes: `early-letters/<kind>/v1\n` + canonical JSON of the payload (sorted keys, no whitespace, JSON.stringify strings and numbers; an RFC 8785 subset exact for our values). The prefix stops a signed config from being replayed as a manifest.
- Ed25519 via `@noble/ed25519` 3.2.0 with synchronous SHA-512 from `@noble/hashes` 2.4.0 (both MIT, pure JS, released Aug 2026; Hermes has no WebCrypto Ed25519). Validation with `valibot` 1.5.0 (MIT, Sep 2026). Bundle cost measured in APP_SIZE.md (valibot is about 105 KB of minified JS because Metro does not tree-shake).
- Keys: `packages/api/src/keys.ts` lists the trusted public keys and which kinds each may sign. It ships **empty**: until the founder runs `scripts/packs/keygen.ts`, the app trusts nothing, installs no downloaded pack, keeps its bundled config defaults and shows the packaged copy (fail closed).
- Rollback protection: the app refuses a document whose `version` is lower than the last one it accepted.
- Rotation: add the new key, release the app, sign with the new key, drop the old key in a later release. Revocation also needs a release, which is why the secret never leaves the founder's password manager and shell (not CI, not EAS, not Supabase).

### 4.3 On the device (`src/lib/packs/engine.ts`, ports in `expo-adapter.ts`)

- Layout under `Library/Application Support/packs` (backup excluded through `ScribeFiles.setExcludedFromBackup`): `installed/<id>/<version>/<file>` plus `pack.json`; `staging/<id>@<version>/<file>.part`.
- Download: Range requests of 16 MiB (`bytes=a-b`) through `File.downloadFileAsync` with a per-request timeout, each chunk appended to the `.part` file; after a kill, cancel or network change the next attempt continues from the `.part` size. A host that ignores Range and sends the whole file is accepted when the size matches. Failed chunks retry with full-jitter backoff (ADR 0017 `pack_file` class) across the URL and its mirrors.
- Verify: SHA-256 of the finished file. Native `Crypto.digest` up to 32 MB; above that, a native streaming hash when the ScribeFiles module offers `sha256File` (requested), else JS slices that yield to the UI between megabytes (slow on Hermes for a 574 MB model, **U** how slow until measured). A mismatch deletes the download and tries the next mirror from the start.
- Install: write `pack.json`, then rename the whole staging directory to `installed/<id>/<version>` (one same-volume rename), then remove the older version. `packPath()` returns the old version until the rename. `load()` at start keeps the newest valid version and deletes anything partial; a test kills the process at every file operation of an update and checks that either the old or the new version survives, never a broken file.
- Policy: one download at a time; anything over 5 MB waits for Wi-Fi unless "Use mobile data" is on (Settings > Storage) or the person taps Download now (`allowCellularOnce`); packs of 5 MB or less download on any network so choosing a language works at once (founder may set the threshold to 0); waiting packs start on their own when Wi-Fi returns; the `packDownloads` kill switch stops new downloads; free space must cover the file plus 1 GB for large packs (recordings come first) or 20 MB for small ones.
- Settings > Storage lists what is installed, its size and the total, shows downloads in progress with Stop and Try again, removes a pack after a confirmation, and holds the mobile data switch. Letters and recordings live elsewhere and are never touched.

### 4.4 Public API for other agents (`@/lib/packs`)

```ts
ensurePack(id: string, opts?: { requireLatest?: boolean; allowCellularOnce?: boolean; signal?: AbortSignal }):
  Promise<{ ok: true; path: string; version: number } | { ok: false; reason: PackFailure }>
packPath(id: string): string | null                // sync, never touches the network
onProgress(listener: (p: PackProgress) => void): () => void
listInstalled(): InstalledPack[]
removePack(id: string): Promise<void>
cancelPack(id: string): void                       // keeps the partial file
ensureLanguage(language: string): Promise<Record<string, EnsureResult>>   // "download when the language is chosen"
addLanguageResolver((language) => string[]): () => void                   // an engine adds its pack ids
setAllowCellular(allow: boolean): void
startPacks(): () => void                           // once, after the first frame
// PackFailure: no_manifest | not_in_manifest | needs_app_update | downloads_paused | waiting_for_wifi
//              | offline | no_space | hash_mismatch | download_failed | cancelled | storage_error
```

## 5. Server-driven content inside native screens

### 5.1 What is delivered

`packages/api/src/content.ts`: `ContentBundle = { schemaVersion: 1, version, generatedAt, locale, blocks }`, signed (kind `content-bundle`). Blocks:

| Type | Fields | Rendered by |
|---|---|---|
| `prompt` | id (stable key), text, band, kind (mirrors `Prompt` in `@scribe/core`) | `PromptCard`, and `usePromptLibrary()` feeds `selectPrompt` |
| `tip` | id, placement (`tonight`, `review`, `book`, `settings`), title?, body | `TipCard`, `useTips(placement)` |
| `story` | id, order, headline, line, visual (closed list of bundled drawings) | `StoryCard`, `useStoryCards()` (applies `introVariant`) |
| `announcement` | id, title, body, startsAt?, endsAt?, dismissible, action? (`route` from a closed list, or `site` path on the brand website) | `AnnouncementCard`, `useAnnouncements()` |

Text is plain; the only placeholders are `{child}`, `{app}`, `{signsAs}`; the cheap content rules (no em or en dashes, curly quotes, ellipsis characters, control characters) are enforced by the schema as well as by the publishing script. Unknown block types and invalid blocks are skipped.

Remote config (`packages/api/src/remote-config.ts`): `minSupportedVersion` (a gentle update card, never a block), `readTogetherFreeSessions` (can only raise the reviewed default of 3, never lower it, so the paywall App Review saw is the strictest it gets), `forceReauthEpoch`, `flags` (`introVariant`, `lockScreenNamesDefault`, `familyTeaser`: `coming_soon` or `quiet`, which can only quiet the Family tab teaser; sign-in, sync and sharing are a build-time switch the server cannot reach, `apps/mobile/src/lib/capabilities.ts`) and `killSwitches` (`sync`, `invites`, `photos`, `packDownloads`, `serverContent`). Every key falls back to its bundled default on a bad value; unknown keys are ignored.

### 5.2 Fallback

Per slot and all or nothing: the server prompt library is used only if it covers every kind and age band the packaged one covers; server story cards only as a complete run 1..n; tips and announcements have no packaged set. The `serverContent` kill switch returns everything to the packaged copy. The publishing script builds the first server bundle from `packages/content`, so server and fallback start identical.

### 5.3 What is never server-driven, by construction

There is no key or block for: turning off recording, typing, saving, reading, playback or export (kill switches only stop server-dependent features); analytics, consent or anything else that changes data collection; paywall layout, prices or copy; layout, navigation or new screens; remote images or code. Flags select between variants App Review has seen.

### 5.4 Why full server-driven UI is out of scope

- **Offline capture:** recording and saving must work with no network and no cache (A-REQ-012, PRD 7.4). A UI described by the server would need a bundled copy of every screen anyway.
- **Accessibility:** VoiceOver order, Dynamic Type to AX5, Reduce Motion and focus handling are tested per native screen (TDD 09); a generic layout interpreter makes each of them a runtime property nobody tested.
- **App Review 2.3.1:** hidden or undocumented features are not allowed; a server that can assemble new screens can show what review never saw. Guideline 2.5.2 also forbids changing features through downloaded code, and a sufficiently expressive layout language edges toward that.
- **Quality bar (decision 2):** premium motion and native components come from Reanimated, Gesture Handler and Apple views, which a JSON layout cannot express without rebuilding them.
- **Cost of ownership:** a layout engine is the custom infrastructure decision 1 asks us not to build.

## 6. Serving and caching

- `GET /functions/v1/config/v1/remote-config`, `GET /functions/v1/config/v1/packs`, `GET /functions/v1/content/v1/bundle?locale=en`. Public, no JWT (`--no-verify-jwt`), no user data in or out; the body is the exact signed JSON from `scripts/packs`.
- Headers: strong ETag (SHA-256 of the body), 304 on `If-None-Match`, `Cache-Control` from `CACHE_POLICY` (config `max-age=60`, manifest 900 s, content 3,600 s, all with `stale-while-revalidate` and `stale-if-error`), `x-request-id`, errors `no-store` in the ADR 0017 envelope. 404 until something is published (the app keeps its defaults).
- App: never at launch; after the first frame, on foreground and once a minute while open, each document no more often than config 4 minutes, manifest and content 6 hours. A kill switch therefore reaches an open app within 5 minutes of the deploy (LEGAL-REQ-040: 60 s cache plus 4 minutes); server-side enforcement in Edge Functions and RPCs stays separate (TDD 02 `kill_switches`).
- Whether Supabase's own CDN caches Edge Function responses was not found in Supabase's docs (**U**); every request may be a billed invocation ($2 per million over 2 million on Pro, V). E: about 5 document requests per active user per day at 220k MAU is about 33M a month, about $60. A Cloudflare proxy in front (section 3.3) removes most of it.

## 7. Publishing (manual, by the founder)

1. Once: `npx tsx scripts/packs/keygen.ts` prints a public key line for `packages/api/src/keys.ts` (commit it, ship an app release) and a secret for the password manager.
2. Each time: load `EL_SIGNING_KEY` and `EL_SIGNING_KEY_ID` into the shell, then `npx tsx scripts/packs/publish.ts packs|config|content|all`. It validates every text pack with `validatePackJson` (ADR 0014), writes them to `dist/packs/`, adds the hosted speech models from the speech catalog, signs the manifest, config and content, checks each signature the way a phone does, and rewrites `supabase/functions/*/published.ts`. It refuses a key the app does not trust. `--kill sync` and `--unkill sync` edit `scripts/packs/remote-config.json` first.
3. The script prints, and never runs: upload commands (`wrangler r2 object put` for files up to 300 MB; `rclone copyto` above that, because Wrangler uploads stop at 315 MB, V) and `npx supabase functions deploy config|content --no-verify-jwt --use-api`.
4. Commit the changed `published.ts` and `remote-config.json`: git history is the audit log of what was served (C-NFR-009).

## 8. Founder decisions needed

| # | Question | Recommendation |
|---|---|---|
| F-1 | Pack host | Cloudflare R2 + custom domain; Hugging Face mirrors for upstream weights |
| F-2 | Domain for packs | `packs.earlyletters.com` if you are happy to move earlyletters.com DNS to Cloudflare (recreate Vercel and Resend records first); else `packs.earlyletters.app` |
| F-3 | Mobile data threshold | Packs of 5 MB or less on any network; larger ones on Wi-Fi unless allowed |
| F-4 | Signing key | Run keygen once; keep the secret only in your password manager |

## 9. Consequences

- The download stays small (APP_SIZE.md); first use of a new language needs a network once, and capture never waits (audio is saved first; transcription waits for the model, ADR 0001).
- Words can change without a release; behaviour, layout and data collection cannot.
- A new vendor (Cloudflare) joins the data map; the key ceremony is a single point of failure, documented above.
- Risks: Hermes JS hashing of the 574 MB model may take tens of seconds (**U**, mitigated by the native hash request); URLSession behaviour on Range across Hugging Face redirects needs one device run; Background Assets may become the better host once iOS 26 is the floor.

## Sources (opened 3 Oct 2026)

- WWDC25 session 325, Discover Apple-Hosted Background Assets: https://developer.apple.com/videos/play/wwdc2025/325
- AssetPackManager (availability iOS 26.0): https://developer.apple.com/documentation/backgroundassets/assetpackmanager
- Apple-hosted asset pack size limits: https://developer.apple.com/help/app-store-connect/reference/apple-hosted-asset-pack-size-limits
- Overview of Apple-hosted asset packs: https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs
- Submit Apple-hosted asset packs: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-apple-hosted-asset-packs
- On Demand Resources as legacy technology (DTS reply): https://developer.apple.com/forums/thread/807744
- expo-apple-targets (target types incl. bg-download): https://github.com/EvanBacon/expo-apple-targets
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 public buckets and custom domains: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare partial (CNAME) setup: https://developers.cloudflare.com/dns/zone-setups/partial-setup/
- Cloudflare R2 upload limits (Wrangler 315 MB): https://developers.cloudflare.com/r2/objects/upload-objects
- Wrangler R2 commands: https://developers.cloudflare.com/workers/wrangler/commands/r2/
- Hugging Face Hub rate limits: https://huggingface.co/docs/hub/rate-limits
- Hugging Face storage limits: https://huggingface.co/docs/hub/en/storage-limits
- Supabase egress: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Supabase Edge Function invocations: https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- Supabase function configuration (verify_jwt): https://supabase.com/docs/guides/functions/function-configuration
- Supabase function routing: https://supabase.com/docs/guides/functions/routing
- npm registry metadata for valibot 1.5.0, @noble/ed25519 3.2.0, @noble/hashes 2.4.0 (licences, release dates)
