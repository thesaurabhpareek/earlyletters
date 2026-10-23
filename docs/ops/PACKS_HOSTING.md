# Packs hosting: language packs, speech models and signed documents

Owner: platform. Written 15 Oct 2026 for the founder. Decision: D-097 (`packs.earlyletters.app` on Cloudflare R2).
Labels: **Measured** (run in this repo on 15 Oct 2026), **Read** (read on the vendor's own documentation on 15 Oct 2026; from this environment the pages could only be read as search excerpts, so check the live page if a number matters), **Assumption**, **Unverified**.

## Why this exists

Every build reads three signed documents from `EXPO_PUBLIC_DOCS_BASE_URL`, which every `eas.json` profile sets to `https://packs.earlyletters.app` (D-097). The pack manifest lists every language pack and speech model the phone may download. Until a manifest signed with a key the app trusts is served there, **spoken letters get no words** and no language pack installs (`docs/release/TESTFLIGHT.md`, "Without this, no words").

You need two things, both done below:
1. two public signing keys in `packages/api/src/keys.ts`, merged **before** `eas build` (the keys are compiled into the app);
2. the signed release on `https://packs.earlyletters.app` (any time; the app fetches it after its first frame and every few hours).

## Before you start

- The repo on `develop`, where these commands are (`main`, the default branch, does not have them yet): `git clone https://github.com/thesaurabhpareek/earlyletters.git && cd earlyletters && git switch develop && git pull`, then `npm ci` at the repo root, with Node 22.5 or later (`node --version`).
- A password manager.
- A Cloudflare account with two-factor, with **`earlyletters.app` already an active zone in it** (D-097, `docs/ops/DOMAINS.md` section 6). If it is not active yet, start that first (see "If earlyletters.app is not on Cloudflare yet"): it is the only slow part.

## The 15 minutes (Cloudflare R2, recommended)

Times are an Assumption (nobody has run these steps on the real accounts yet).

| # | Step | Time (Assumption) |
|---|---|---|
| 1 | Signing keys (a primary and a cold backup) | 5 min |
| 2 | Bucket | 1 min |
| 3 | Custom domain | 2 min, plus activation |
| 4 | API token | 2 min |
| 5 | Upload credentials | 1 min |
| 6 | Build the release | 1 min |
| 7 | Upload and check | 1 min |
| 8 | Commit and open the PR | 3 min |
| 9 | Verify with curl and the preflight | 2 min |

### 1. Signing keys (once: a primary and a cold backup)

Two keys from the first ceremony (F19-REQ-002 Rev, R2 AR-28): every build trusts both, so if the primary is lost you keep publishing with the backup instead of waiting for an app release. In your own terminal (it refuses to print the secret to a pipe, a file or CI), run it twice, the second time with `--backup` so the two keys get different ids (the app and `publish.ts` use only the first key with a given id, and the preflight fails on a repeated one):

```bash
node scripts/packs/keygen.mjs             # the primary, key id el-YYYY-MM; plain Node, writes nothing to disk
node scripts/packs/keygen.mjs --backup    # the cold backup, key id el-YYYY-MM-backup
```

Each run prints:
- a **public** line: paste **both** into `TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts`;
- two **secret** lines (`EL_SIGNING_KEY_ID=...`, `EL_SIGNING_KEY=...`), shown once.

The **backup's** secret lines go in a password manager entry of their own and in an offline copy kept in a different place from the primary; never in a file on the publishing computer. The **primary's** secret lines go in the password manager, **and** in a file outside every git checkout for the scripts:

```bash
mkdir -p ~/.config/early-letters && chmod 700 ~/.config/early-letters
pbpaste > ~/.config/early-letters/signing.env    # or paste with an editor; the two lines only
chmod 600 ~/.config/early-letters/signing.env
pbcopy < /dev/null                               # clear the clipboard (Universal Clipboard would sync it to your other devices)
```

The secret never goes in the repo, CI, EAS, Vercel, Cloudflare or a chat. Three guards back that up:
- `publish.ts` refuses a `--key-file` inside this repo, any of its worktrees, its git directory or any other git repository (real paths, symlinks resolved, letter case ignored where the disk ignores it), and refuses any key that is not in `keys.ts`, so nothing can be published that phones would reject;
- `.gitignore` ignores `signing.env`, `*.signing.env`, `r2.env` and `*.r2.env` at any depth;
- `node scripts/packs/secret-scan.mjs --staged` fails if a staged file holds a signing key or an R2 secret (step 8 runs it), and `npm test` fails if a tracked file does.

Key format: Ed25519, the raw 32-byte seed and public key in standard base64, exactly what `packages/api/src/integrity.ts` verifies. If your home folder or `~/.config` is itself a git repository (a dotfiles repo), keep the file elsewhere or export the two variables from your password manager instead: the script refuses any key file inside a git repository.

Keep the `keys.ts` change in your working tree for step 6, and commit it in step 8.

### 2. Bucket

R2 must be enabled on the account first; Cloudflare asks for a payment method even for the free tier (Assumption: not checked here). Then Cloudflare dashboard > Storage and databases > R2 > Create bucket (Read; menu names may differ in today's dashboard): name **`early-letters-packs`**, location Automatic, default storage class **Standard** (the free tier covers Standard only: Read, R2 pricing). Leave public access through `r2.dev` **off**: it is rate-limited and for development only (Read, R2 public buckets).

### 3. Custom domain

Bucket > Settings > Custom Domains > Connect domain: **`packs.earlyletters.app`**. Cloudflare adds the DNS record itself. Wait for status **Active** (if it stays on Initializing, use Retry connection: Read, R2 public buckets). The domain must be a zone in the same Cloudflare account (Read).

No cache rule is needed for the beta (see "Caching").

### 4. API token for uploads

R2 > Overview > Manage API tokens > Create API token:
- Permission: **Object Read & Write**. This is the least that works: R2 has no write-only object permission, and the upload reads before it writes (to skip identical files and to refuse an overwrite).
- Apply to **specific buckets only**: `early-letters-packs`.
- Copy the **Access Key ID**, the **Secret Access Key** (shown once: password manager) and the S3 endpoint **`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`** (Read, R2 S3 get started).

### 5. Upload credentials (a file, not your shell history)

Typing the secret after `export` would save it in `~/.zsh_history`. Put the four lines in a file next to the signing key instead, with an editor:

```bash
# ~/.config/early-letters/r2.env   (chmod 600)
PACKS_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
PACKS_S3_BUCKET=early-letters-packs
PACKS_S3_ACCESS_KEY_ID=<access key id>
PACKS_S3_SECRET_ACCESS_KEY=<secret access key>
```

Then, in the terminal you will upload from:

```bash
chmod 600 ~/.config/early-letters/r2.env
set -a; . ~/.config/early-letters/r2.env; set +a
```

`PACKS_S3_ENDPOINT` has no bucket and no path. `PACKS_S3_REGION` defaults to `auto` (R2); for AWS S3 add the bucket's region and an `https://s3.<region>.amazonaws.com` endpoint.

### 6. Build the release

```bash
npx tsx scripts/packs/publish.ts release --key-file ~/.config/early-letters/signing.env --models upstream
```

This writes `dist/release/` (git-ignored), checks every signature the way a phone does, and bumps the document versions in `supabase/functions/config/published.ts` and `supabase/functions/content/published.ts` (git is the version counter: see step 8).

**During the alpha, skip item 3 of the printed next steps** (the server kill-switch commands): with every switch off they would turn backup and escrow on, which `supabase/APPLY.md` keeps off until backup is applied and neither alpha build has (`docs/release/TESTFLIGHT.md`).

**Languages: English only unless named** (`--languages`, D-111 item 4). With no flag the release carries no text pack (English is bundled in the app), and its manifest lists only the multilingual speech models; `--languages en,hi` adds Hindi. `upload` takes the same flag and refuses a release that offers a language it does not name.

Measured here, `--models upstream --languages en,hi,es,zh,fr,ar,pt` (an English-only release holds just the three documents):

| Path in the release | Bytes | Cache-Control |
|---|---|---|
| `functions/v1/config/v1/packs` (signed manifest) | 3,325 | `no-cache` |
| `functions/v1/config/v1/remote-config` | 525 | `no-cache` |
| `functions/v1/content/v1/bundle` | 15,049 | `no-cache` |
| `text-rules.ar/1000000/ar.rules.json` | 5,818 | `public, max-age=31536000, immutable` |
| `text-rules.es/1000000/es.rules.json` | 5,331 | same |
| `text-rules.fr/1000000/fr.rules.json` | 5,694 | same |
| `text-rules.hi/1000000/hi.rules.json` | 7,341 | same |
| `text-rules.pt/1000000/pt.rules.json` | 5,083 | same |
| `text-rules.zh/1000000/zh.rules.json` | 62,158 | same |
| **total** | **110,324** | |

The manifest also lists the three hosted speech models at their pinned Hugging Face URLs, with the sizes and SHA-256 from `apps/mobile/src/lib/models/catalog.ts`: Silero VAD 885,098 bytes, Whisper large-v3-turbo q5_0 574,041,195 bytes, Whisper small q5_1 190,085,487 bytes. The phone downloads them from Hugging Face and checks every byte against the signed hash.

**Models on our own host instead** (`--models download`, the default): the script downloads the three files from their pinned upstream URLs (resuming with Range requests), refuses any file whose size or SHA-256 differs from the catalog, and lists our host first with Hugging Face as a mirror. The upload is about 765 MB (Assumption: 5 minutes at 20 Mbit/s up). The first internal TestFlight works either way; do it before external testers (C1), because Hugging Face is best effort and rate-limits per IP (ADR 0016 section 3.1). Moving later needs no app release: the phone downloads from the manifest's URL, not from a URL in the app.

Other options: `--base-url`, `--min-app 1.0.0`, `--out`, `--models-dir <folder>` (use model files you already have; each is hash-checked), `--include-model <id>` (a model we built, such as `speech-model.whisper-hindi-small-q5_1`, only after counsel clears its training data: ADR 0015 section 9), `--strict-models` (fail instead of falling back to upstream).

### 7. Upload and check

In one terminal, with both public keys still in `packages/api/src/keys.ts` in your working tree (`upload`, and `--dry-run` too, refuses documents that do not verify against it) and the four `PACKS_S3_*` values from step 5 loaded:

```bash
set -a; . ~/.config/early-letters/r2.env; set +a
npx tsx scripts/packs/publish.ts upload
```

Plain signed HTTPS requests (AWS Signature Version 4; no SDK and no new dependency). What it guarantees:
- every file is checked against the hash in `release.json` before it is sent;
- pack files first, then the content bundle, the remote config, and **the manifest last**, so a phone never sees a manifest that points at a file not yet uploaded;
- a pack already at its versioned path is skipped when it is the same file (SHA-256 metadata or MD5 ETag) and **refused** when it differs: a versioned path never changes;
- a document the host already serves under the same version with different content, or under a higher version, is **refused** (phones would refuse it too: G-18, rollback protection);
- nothing is ever deleted.

Then it runs `verify` against `https://packs.earlyletters.app`, which accepts each document only the way the app does:
- the signature against `keys.ts`;
- then the document's own parser, as `apps/mobile/src/lib/remote` runs it. A payload the app would drop fails; values the app would ignore or replace, and entries or blocks it would skip, are warned about.
- each live version against the one committed in `published.ts` (a phone refuses an older one);
- every pack URL for size and Range support, every mirror for size, and a download and hash of every pack of 5 MB or less on our host.

`--dry-run` shows what would be sent. `npx tsx scripts/packs/publish.ts verify` runs the check alone, any time, with no key.

### 8. Commit

One short branch, one PR:

```bash
git switch -c chore/packs-signing-key
git add packages/api/src/keys.ts supabase/functions/config/published.ts supabase/functions/content/published.ts scripts/packs/remote-config.json
node scripts/packs/secret-scan.mjs --staged      # must say "no signing key or upload secret"; stop if it names a file
git commit -m "chore(packs): trust the primary and backup signing keys; first signed release"
git push -u origin chore/packs-signing-key
gh pr create --base develop --fill
```

(`remote-config.json` is listed even when unchanged: adding an unchanged file is harmless, and a kill switch you set must be in git, which is the audit log of what was served.)

`published.ts` is the counter the next release adds one to. If it is not committed, the next release reuses a version number with different content, and `upload` stops (phones would refuse it). **You merge this PR yourself**, before `eas build`: it changes the app's trust root and release configuration, which D-107 keeps as founder merges. No `gh`? `brew install gh && gh auth login`, or open the PR on github.com. After merging, start the build from `develop`: Actions > TestFlight > Run workflow, branch `develop`.

### 9. Verify

```bash
curl -sI https://packs.earlyletters.app/functions/v1/config/v1/packs              # 200, content-type application/json, cache-control no-cache
curl -s  https://packs.earlyletters.app/functions/v1/config/v1/packs | head -c 200 # {"kind":"pack-manifest","keyId":"el-YYYY-MM",...
curl -sI -H 'Range: bytes=0-15' https://packs.earlyletters.app/speech-model.silero-vad-v6.2.0/1/ggml-silero-v6.2.0.bin   # 206 when the models are on our host (--models download); verify checks Range upstream otherwise
npx tsx scripts/packs/publish.ts verify                                             # every line "ok"
npm run preflight:testflight -w @scribe/mobile -- --skip-prebuild                   # signing key PASS
```

`eas.json` needs no change: every profile already has the exact line `"EXPO_PUBLIC_DOCS_BASE_URL": "https://packs.earlyletters.app"` under `build.<profile>.env` (D-097, PR #126). If the host ever changes, that line (and `PACKS_ORIGIN` in `apps/mobile/src/lib/models/catalog.ts`) is what changes.

## If earlyletters.app is not on Cloudflare yet

An R2 custom domain must be a zone in the same Cloudflare account (Read). D-097 moves only **`earlyletters.app`** (today a redirect). `earlyletters.com`, the website's records and all email stay at Porkbun, untouched. (`docs/ops/DOMAINS.md` section 6, row A, still describes moving `.com` and `packs.earlyletters.com`; for D-097 follow the steps here instead.)

Do them in this order. The order matters for DNSSEC: a DS record at the registry that does not match the new nameservers makes the domain stop resolving for validating resolvers (Read, Cloudflare DNSSEC).

1. **If Porkbun DNSSEC is on for `earlyletters.app`** (DOMAINS.md section 2 turns it on while DNS is at Porkbun): Porkbun > Domain Management > `earlyletters.app` > Details > DNSSEC, turn it off and remove its DS record. Then wait for the old DS record to expire at the `.app` registry before step 4. Cloudflare says DS TTLs are commonly 24 to 48 hours (Read); `dig +short DS earlyletters.app` printing nothing means it is gone. If DNSSEC was never on, skip this and the wait.
2. **Cloudflare > Add a domain**: `earlyletters.app`, Free plan. Cloudflare imports the records it can see. Make them exactly the `.app` table in DOMAINS.md section 4:
   - the apex A record and the `www` CNAME from Vercel's domain card, **DNS only** (grey cloud: Vercel serves the redirect and its own certificate);
   - MX `@` `0 .`;
   - TXT `@` `v=spf1 -all`;
   - TXT `_dmarc` `v=DMARC1; p=reject; adkim=s; aspf=s`;
   - optionally TXT `*._domainkey` `v=DKIM1; p=`.
   Check them against Porkbun with `dig @<cloudflare-nameserver> earlyletters.app ANY` before going on.
3. **CAA on `earlyletters.app`**, exactly these records, so both Vercel (Let's Encrypt) and Cloudflare (the R2 custom domain's certificate) can issue:
   - `0 issue "letsencrypt.org"` (keep, for Vercel);
   - `0 issue "pki.goog"` (Google Trust Services, Cloudflare);
   - `0 issue "ssl.com"` (Cloudflare);
   - `0 issuewild ";"` (keep: no wildcard certificates).
   Cloudflare says it adds records for the CAs it uses on its own once a zone has any CAA record and Universal SSL is on (Read, Cloudflare "Add CAA records"). Leave any records it adds. If its Universal certificate (which covers `*.earlyletters.app`) stays pending because of `issuewild ";"`, replace that record with `0 issuewild "pki.goog"`. Assumption: Cloudflare's CA list can change, so check its "Certificate authorities" page that day.
4. **Porkbun > Domain Management > `earlyletters.app` > Authoritative nameservers**: replace Porkbun's with the two Cloudflare shows. Wait until Cloudflare marks the zone **Active** (Assumption: usually within an hour, up to a day).
5. **DNSSEC on Cloudflare**: Cloudflare > `earlyletters.app` > DNS > Settings > **Enable DNSSEC** (Read). It shows the DS record: Key Tag, Algorithm (13), Digest Type (2), Digest.
6. **DS record at Porkbun**: Porkbun > Domain Management > `earlyletters.app` > Details > **Registry DNSSEC** (the option for third-party nameservers), dsData: paste Key Tag, Algorithm, Digest Type and Digest exactly (Read, Porkbun "How to install DNSSEC"). Cloudflare shows DNSSEC as active once the registry has it.
7. Check: `dig +short CAA earlyletters.app`, `dig +short DS earlyletters.app` (one record, Cloudflare's), `curl -sI https://earlyletters.app` (still the 308 redirect to `https://earlyletters.com`).

About 10 minutes of work, plus the two waits (the DS expiry in step 1 only if DNSSEC was on, and the nameserver change in step 4). Steps 1 and 2 of the main path can run meanwhile. If the first build cannot wait, use the fallback below and move to R2 later: same hostname, same paths, so the move is a DNS change only.

## Fallback: a static Vercel project

The release directory is a complete static site; `release` also writes a `vercel.json` in it with the same Content-Type and Cache-Control per file (it is never uploaded to the bucket).

Does it fit? The documents and text packs are 110,324 bytes in 9 files (Measured). Vercel accepts up to 100 MB of static files per deployment on Hobby and 1 GB on Pro, and 15,000 files per CLI deployment (Read, vercel.com/docs/limits). The models do not belong there: the 574 MB model is over the Hobby limit, and Fast Data Transfer beyond what a plan includes costs $0.15 per GB (Read, Vercel pricing), against R2's $0 egress. So the fallback is `--models upstream` (models stay on Hugging Face). Also: the Hobby plan is for non-commercial personal use only (Read, Vercel fair use guidelines), so this needs the team on Pro.

1. `npx tsx scripts/packs/publish.ts release --key-file ~/.config/early-letters/signing.env --models upstream`
2. `npx vercel@latest deploy dist/release --prod`: create a **new** project (for example `early-letters-packs`), not the website project; framework Other, no build command.
3. Project > Settings > Domains > add `packs.earlyletters.app`, and add the DNS record Vercel shows at whoever hosts `earlyletters.app` DNS (Porkbun today).
4. `npx tsx scripts/packs/publish.ts verify`, then step 8 above.

Unverified on Vercel: that a header rule can set Content-Type on an extensionless static file (the app does not depend on it; `verify` warns if it is wrong) and that static files answer Range requests (`verify` reports it; text packs and documents are small enough to need none).

Any other static host works the same way: serve the directory at the root of an `https` origin, paths as they are, the query string ignored (`?locale=en`), the headers from `release.json` (`files[].contentType`, `files[].cacheControl`), and a real 404 for a missing file (no rewrite to an index page). `npx tsx scripts/packs/publish.ts serve` previews a release locally.

## Caching

| What | Path | Cache-Control | Why |
|---|---|---|---|
| Pack files | `<id>/<version>/<file>`; files we built: `speech/<name>/<source revision>/<file>` | `public, max-age=31536000, immutable` | A path never changes. New content is a new version, so a new path. |
| Signed documents | `functions/v1/config/v1/packs`, `.../remote-config`, `functions/v1/content/v1/bundle` | `no-cache` | They change in place. Every cache revalidates (ETag, 304). Trust comes from the signature, not the cache (#126). |

Cloudflare without a cache rule (Read, Cloudflare default cache behaviour and R2 cache docs): JSON and extensionless files are not cached at the edge, so every document and text pack request reaches R2 (no egress fee; one read operation each). `.bin` model files are cached at the edge, but only up to **512 MB per file** on Free, Pro and Business, so the 574 MB model is always served from R2 itself. Range requests are passed through. None of this needs changing for the beta. Later, a cache rule making `*.rules.json` "Eligible for cache" (respecting origin headers) would cut reads; the documents should stay revalidated.

Kill switches: a remote-config change reaches open apps within about 5 minutes (Assumption: `no-cache` here, plus the app's 4-minute refresh; LEGAL-REQ-040; not measured on a phone).

## Changing a pack

1. Edit `packs/text-rules/<lang>.json` **and raise its `"version"`** (1.0.0 to 1.0.1). The same version with new content is refused by `upload` (a versioned path never changes).
2. `release`, `upload`, commit `published.ts` (steps 6 to 8).

Speech models: change the entry in `apps/mobile/src/lib/models/catalog.ts` in a PR (new `version`, `url`, `bytes`, `sha256`), then release.

## Rolling back a bad pack

The rule that decides everything: **a phone replaces an installed pack only with a higher version**, and accepts only a manifest **newer** than the one it has (`apps/mobile/src/lib/packs/engine.ts`, `decideDocumentVersion` in `packages/api`). So a rollback is a roll forward:

1. Put the last good content back in `packs/text-rules/<lang>.json` with a **higher** version (bad 1.0.1, good content shipped as 1.0.2).
2. `release`, `upload`, commit. Each phone picks it up at its next manifest check (at most 6 hours while the app is open; text packs are small enough to download on any network).
3. Emergency brake while you prepare it: set `"packDownloads": true` under `killSwitches` in `scripts/packs/remote-config.json`, `release`, `upload`, then commit `scripts/packs/remote-config.json` and both `published.ts` files (step 8). Phones stop starting new downloads within about 5 minutes (Assumption); installed packs keep working. Set it back to `false` the same way, and commit again.
4. **Never delete old versions** from the bucket: phones mid-download, older app versions (`minAppVersion`) and the rollback itself need them. `upload` never deletes; do not delete in the dashboard. Their storage cost is a few kilobytes (text) or a few hundred MB (a model) inside the free tier.
5. Never re-upload an older manifest: phones refuse it, and so does `upload`.

## Signing key custody and rotation

- The primary's secret exists only in the password manager and in `~/.config/early-letters/signing.env` on the publishing computer; the backup's only in its own password manager entry and its offline copy.
- Primary lost: publish with the backup (its two lines in `signing.env`), which every build already trusts; then make a new backup key and add it in the next app release.
- Primary leaked: the same, and remove the leaked key from `keys.ts` in that release. Until phones have that release, documents signed with the leaked key are still accepted (ADR 0016 section 4.2).
- Both lost: generate a new key and ship an app release with it.
- Rotation: add the new public key next to the old one in `keys.ts`, ship an app release, sign with the new key, remove the old key in a later release.
- The R2 token can only touch this one bucket; rotate it in the dashboard at any time (the next `upload` needs the new one).

## Cost (Assumption, from Read prices)

R2 (Read, R2 pricing): Standard storage $0.015 per GB-month, writes (Class A) $4.50 per million, reads (Class B) $0.36 per million, **egress free**; free each month: 10 GB-month, 1 million writes, 10 million reads.

| | Beta (C0, C1: under 100 phones) | 220k monthly active phones (TDD 06 upper bound) |
|---|---|---|
| Storage | 0.8 GB with the models, under 1 MB without: $0 | a few model versions kept, under 10 GB: $0 |
| Writes | about 15 per release: $0 | $0 |
| Document reads | $0 | Assumption: 12 document requests per active phone per day (config every 4 minutes while open, manifest and content every 6 hours) = 79 million a month, about **$25 a month** |
| Model downloads | $0 | 574 MB in 16 MiB Range requests = 35 reads per install; 220k installs = 7.7 million reads, within or near the free 10 million |
| Egress | $0 | $0 |

Below about 25,000 active phones the reads stay inside the free tier (Assumption, same request rate). Hugging Face as the model host for the first build: $0, best effort.

## What is proven, and what is not

Measured here (15 Oct 2026), in `npm test -w @scribe/api` (`scripts/packs/release.test.ts`, `scripts/packs/s3.test.ts`):
- a key from `keygen.mjs` (plain `node:crypto`) signs a manifest that the app's verifier (`packages/api`) accepts; an edited manifest fails with `bad_signature`, a wrong key with `unknown_key`, a relabelled document with `wrong_kind`;
- a release built with a throwaway key and served by a local static server: the app's own `SignedDocumentClient` fetches the manifest from the base URL, verifies it, and resolves every language with its real size (the numbers in the table above); the app's own `PackManager` then downloads a language pack and a speech model in Range chunks, checks each SHA-256 and installs them; a pack changed on the host after signing is deleted after download, never installed;
- model downloads resume from a partial file and refuse wrong bytes;
- the upload, against a local S3 stand-in: SigV4 matches AWS's published worked example; order (manifest last), headers, skip-if-identical, refuse-if-different, refuse same-version and older documents, never delete, dry run;
- `verify` catches an untrusted key, a missing pack, and a pack of the right size with the wrong bytes.

Measured here, in the real app exported for the web (Chromium, `EXPO_PUBLIC_DOCS_BASE_URL=https://127.0.0.1:8443`, a throwaway key trusted for that build only): the app fetched the remote config, the manifest and the content bundle from the static host (HTTP 200 each), applied the signed remote config (a flag visible on the Family tab), and ignored it when the payload was edited after signing or signed by an untrusted key. The web build cannot open Spoken language or Storage, because the pack engine needs the native file system (`appSupportDir`), so the language sizes are proven in the Node test above, not on screen.

Not proven here (needs the founder's accounts or a real iPhone):
- R2, the custom domain and the token: nothing was uploaded to Cloudflare.
- Downloads from Hugging Face: blocked from this environment, so the three model files were not fetched or hashed here; their sizes and hashes are the catalog's, verified on 3 Oct 2026 (ADR 0015 section 7).
- The Vercel fallback.
- On an iPhone: `File.downloadFileAsync` Range downloads over cellular and Wi-Fi, across Hugging Face's redirects; hashing a 574 MB file on the phone (native hash if present, else JS slices on Hermes: time unmeasured); install into Application Support; the Wi-Fi wait for files over 5 MB; then a spoken letter getting its words.

## Troubleshooting (`verify` output)

| Line | Meaning | Fix |
|---|---|---|
| `FAIL pack-manifest: ... HTTP 404` | nothing at that path | step 7 not run, or the custom domain is not Active yet |
| `FAIL pack-manifest: signature check failed (unknown_key)` | the manifest is signed with a key `keys.ts` does not list | the release was signed with another key, or `keys.ts` here differs from the one built into the app |
| `FAIL ... bad_signature` | the file was changed after signing | rebuild and upload; never edit files in the bucket |
| `FAIL <pack>: ... answered HTTP 404` | the manifest lists a file that is not there | upload again (it uploads packs before the manifest) |
| `FAIL <pack>: ... SHA-256 is not the manifest's` | the wrong bytes are served at that path | a stale cache or a hand upload; never reuse a versioned path |
| `WARN ... ignores Range` | downloads work but cannot resume | expected only on some static hosts; R2 supports Range |
| `FAIL remote-config: the payload does not match ...` or `FAIL content-bundle: ...` | signed, but the app would drop it and keep its defaults (kill switches included) | fix `scripts/packs/remote-config.json` or the content source, build and upload a new release |
| `WARN remote-config: the app ignores or replaces ...` | the app keeps its default for those values | fix the named keys; `release` refuses them, so this means the hosted copy came from elsewhere |
| `FAIL ...: the host serves vN, but published.ts says vM` | the live copy is older than what was published (phones that have vM refuse vN) | upload the latest release |
| `FAIL ...: the host serves vN, newer than published.ts` | a release was uploaded but `published.ts` not committed | commit step 8 now |
| `FAIL <document>: Cache-Control is ...` | the document is cached, which delays kill switches | upload it with `publish.ts upload` (it sets `no-cache`); no Cache Everything rule on documents |
| `upload`: `does not verify against packages/api/src/keys.ts` | this working tree's `keys.ts` does not hold the key the release was signed with | keep both public lines in `keys.ts` (step 1), build the release again |
| `upload`: `missing PACKS_S3_...` | the upload values are not in this terminal | `set -a; . ~/.config/early-letters/r2.env; set +a` (step 7) |
| `upload`: `same_version_conflict` | `published.ts` was not committed after an earlier release | pull, commit, build the release again |

## Files

- `scripts/packs/keygen.mjs`: the two keys, once each (terminal only).
- `scripts/packs/publish.ts`: `release`, `upload`, `verify`, `serve`. **`release` then `upload` is the only supported way to publish.** The step-by-step `packs`, `config`, `content`, `all` commands are for development only: they print `wrangler` upload commands that overwrite without the checks `upload` makes (versioned paths, G-18).
- `scripts/packs/release.ts`: the release directory, model downloads, the local static server.
- `scripts/packs/s3.ts`: S3-compatible upload (SigV4) and the hosted check.
- `scripts/packs/key-file.ts`: where the signing key file may live.
- `scripts/packs/secret-scan.mjs`: refuses a signing key or R2 secret in staged or tracked files.
- `scripts/packs/lib.ts`: the pure parts (packs, manifest, signing, paths, headers).

## Sources (read 15 Oct 2026, as search excerpts of these pages)

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 limits: https://developers.cloudflare.com/r2/platform/limits/
- Cloudflare R2 public buckets and custom domains: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Cloudflare R2 with the S3 API (token, endpoint, region `auto`): https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare cache with R2, and default cache behaviour: https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/ , https://developers.cloudflare.com/cache/concepts/default-cache-behavior/
- Vercel limits: https://vercel.com/docs/limits ; Hobby plan: https://vercel.com/docs/plans/hobby ; fair use: https://vercel.com/docs/limits/fair-use-guidelines ; pricing: https://vercel.com/docs/pricing
- AWS Signature Version 4 worked example (the test vector in `s3.test.ts`): AWS General Reference, "Examples of the complete Signature Version 4 signing process"
