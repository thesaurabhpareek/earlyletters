# Runbook: serve the speech models from our R2 host before public users

Owner: speech (written for the founder, 8 Nov 2026, at the coordinator's request; pack hosting is ops' lane, so ops reviews). Founder steps only: nothing here has been uploaded, signed or changed on any account. Tags: **V** verified in the repo or on Hugging Face on 8 Nov 2026, **R** read in a repo document, **UNVERIFIED** not checked.

## Why, and when

- Today every phone downloads its speech model from huggingface.co. The live signed manifest v1 (1 Nov 2026) lists the voice detector, Whisper large-v3-turbo q5_0 and Whisper small q5_1 at their pinned Hugging Face URLs, with no mirrors (V: `supabase/functions/config/published.ts`, `PACK_MANIFEST`, `"mirrors":[]`).
- Hugging Face is a best-effort public host that rate-limits per IP (R: ADR 0016 section 3.1). It also sees each phone's IP address and the file it asks for, which the privacy policy discloses (R: `docs/legal/privacy-policy.md` line 101; counsel Q11 and Q12).
- `PACKS_HOSTING.md` step 6 asks for this move "before external testers". Do it before the TestFlight Friends group (Beta App Review) and in any case before the public release. It is the same for English-only build 12 and for every language that unlocks later.

## What changes, and what does not

No app or tool code changes. Everything below already exists (V, 8 Nov 2026):

| Piece | What it already does | Where |
|---|---|---|
| Release tool | `--models download` (the default) fetches each model from its pinned Hugging Face URL, refuses any file whose size or SHA-256 differs from the catalog, and lists **our host as the primary URL with Hugging Face as the mirror** | `scripts/packs/release.ts`; `speechEntry` in `scripts/packs/lib.ts` |
| Manifest contract | `mirrors` is a list of up to 3 https URLs | `packages/api/src/pack-manifest.ts` |
| App | Tries `url`, then each mirror; every file is trusted only after its SHA-256 matches the signed manifest; a host serving wrong bytes costs one download, then the next host is tried | `apps/mobile/src/lib/packs/engine.ts` (`hosts = [entry.url, ...entry.mirrors]`) |
| Phones that already have the model | Keep it. The pack id, version and hash do not change, so nothing downloads again | `engine.ts` `runJob`: installed version at or above the manifest's is used as is |

Primary or mirror: this runbook makes **R2 the primary and Hugging Face the mirror**, which is what the tool does. Putting Hugging Face first with R2 as a fallback would keep the rate limit and the third-party IP log on every download, and would need a code change to the release tool. I do not recommend it. If you want it anyway, it is its own PR with tests, not part of this runbook.

Files and sizes the release uploads (V: Hugging Face API at revision `5359861c` and `9ffd54a1`, matching `apps/mobile/src/lib/models/catalog.ts`):

| Object key on `packs.earlyletters.app` | Bytes | SHA-256 starts |
|---|---|---|
| `speech-model.whisper-large-v3-turbo-q5_0/1/ggml-large-v3-turbo-q5_0.bin` | 574,041,195 | `394221709cd5` |
| `speech-model.whisper-small-q5_1/1/ggml-small-q5_1.bin` | 190,085,487 | `ae85e4a935d7` |
| `speech-model.silero-vad-v6.2.0/1/ggml-silero-v6.2.0.bin` | 885,098 | `2aa269b785ee` |

The other two models in the catalog are not carried: the Hindi model is not hosted and waits for counsel (Q9), and Belle is a candidate. `--languages en` keeps the release English only (D-115 item 3; build 12 is English only).

## Before you start

- Steps 1 to 5 of `docs/ops/PACKS_HOSTING.md` are done: the two signing keys exist (`el-2026-11` and `el-2026-11-backup` in `packages/api/src/keys.ts`, V), the bucket and the custom domain serve the v1 manifest (`docs/release/setup-steps.json` S-11, `ledger.status: "done"`, 2026-11-01, R; `publish.ts verify` run by you today is the live check), and `~/.config/early-letters/r2.env` holds the four `PACKS_S3_*` values with an Object Read & Write token for this one bucket.
- The publishing computer, with the private key file outside every git checkout (`~/.config/early-letters/signing.env`).
- About 1 GB free on disk, and a network that can send about 765 MB (Assumption: about 5 minutes at 20 Mbit/s up, from `PACKS_HOSTING.md`).
- A clean checkout of `develop` with `npm ci` run.

## Steps (about 30 minutes, mostly waiting)

1. **Build the release with the models on our host.** Start with an empty `dist/release` (it is git-ignored; `rm -rf dist/release` if an earlier run left files). The tool refuses a folder holding files this release does not include and stops with `dist/release holds N file(s) this release does not include, left by an earlier run with other --models or --languages: ... Use an empty --out, or delete them.` (V: `release.ts`). In your own terminal:
   ```bash
   npx tsx scripts/packs/publish.ts release --key-file ~/.config/early-letters/signing.env \
     --models download --strict-models --languages en
   ```
   `--strict-models` matters. Without it, a model that fails to download is quietly left on its Hugging Face URL with a `WARN` line (V: `release.ts`, the catch that logs "the manifest lists its upstream URL instead"), and you would publish the same manifest as today under a new version. With it, the command stops instead. The summary line should read `manifest v2: ... (0 on upstream)`. If it shows any model "on upstream", stop and read the `WARN`.

   The release also signs a new remote config and content bundle with the same content and the next version numbers, and bumps both `published.ts` files. For the printed next steps, follow `PACKS_HOSTING.md` step 6 on the server kill-switch commands (item 3): skip them unless the production server plan of the day says otherwise.

2. **Optional: hash the big file yourself.** The release already refused any wrong byte, but:
   ```bash
   shasum -a 256 dist/release/speech-model.whisper-large-v3-turbo-q5_0/1/ggml-large-v3-turbo-q5_0.bin
   ```
   It must print `394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2`.

3. **Dry run, then upload.**
   ```bash
   set -a; . ~/.config/early-letters/r2.env; set +a
   npx tsx scripts/packs/publish.ts upload --languages en --dry-run
   npx tsx scripts/packs/publish.ts upload --languages en
   ```
   The dry run ends with this line (V: `publish.ts`), where `(...)` is a size of about 765 MB:
   ```
   Dry run: nothing was sent. 6 files (...) would be checked against the bucket and put if missing.
   ```
   Six is the three model files and the three signed documents (manifest, remote config, content bundle), and nothing else. If it says any other number, stop and read the lines above it.

   The real upload sends the packs first and the manifest last, so a phone never sees a manifest that points at a file not yet there. It never deletes and never overwrites a versioned path. It ends with:
   ```
   6 uploaded (...), 0 already there.
   ```
   A re-run after an interruption shows fewer uploaded and more "already there"; that is fine. The 574 MB file goes up as a single PUT; that this is within R2's single-upload limit is my reading of Cloudflare's limits page, not rechecked today (UNVERIFIED).

   **When the upload is done, close this terminal window.** `r2.env` was loaded into its environment; closing it is the simplest way to leave the R2 secrets nowhere.

4. **Read the upload's own check; do not repeat it.** Unless you passed `--no-verify`, `upload` finishes by running the same check as `publish.ts verify` against the public host (V: `publish.ts`, the `checkHosted` call after the upload). Its last lines are that check, under `Checking https://packs.earlyletters.app as a phone would:`. For each model you should see a line with `Range supported (packs.earlyletters.app)` and a line with `mirror huggingface.co has <bytes> bytes`. `verify` hashes only files of 5 MB or less, so for the two Whisper files it checks size and Range, and the phone checks the hash. The pass is the final line:
   ```
   Live. Commit supabase/functions/*/published.ts and scripts/packs/remote-config.json now: git is the audit log of what was served.
   ```
   **If the last line is instead `Uploaded, but the public host does not serve it correctly yet (custom domain, cache or key): see docs/ops/PACKS_HOSTING.md, "Verify".`, stop. Do not go on to step 5**, and do not commit `published.ts`; read the `FAIL` lines above it against the `PACKS_HOSTING.md` troubleshooting table (the command exits 1). Once fixed, run `npx tsx scripts/packs/publish.ts verify` alone (no key needed) until it ends `Every check passed: a build with this host and these keys will download these packs.` (exit 0). Then run the commit step.

   One optional hand check of a Range read (a GET, so the host answers like a phone's request; `-o /dev/null -D -` prints the headers only):
   ```bash
   curl -s -o /dev/null -D - -H 'Range: bytes=0-15' https://packs.earlyletters.app/speech-model.whisper-large-v3-turbo-q5_0/1/ggml-large-v3-turbo-q5_0.bin
   ```
   The first line should be `HTTP/2 206`. I did not run it (UNVERIFIED); `verify` already checks Range.

5. **Commit the files the release changed, on this run's own branch.** `PACKS_HOSTING.md` step 8 is written for the first key ceremony (branch `chore/packs-signing-key`, a "first signing key" message, `keys.ts` included). Do not reuse it. `keys.ts` has not changed in this run, so it is not added. This run changes three files: the two `published.ts` counters and the audit log of the served kill-switch state, `scripts/packs/remote-config.json` (listed even if `git diff` shows it unchanged; adding an unchanged file is harmless).
   ```bash
   git switch -c chore/packs-models-on-r2
   git add supabase/functions/config/published.ts supabase/functions/content/published.ts scripts/packs/remote-config.json
   node scripts/packs/secret-scan.mjs --staged
   ```
   The scan must print exactly `secret scan: no signing key or upload secret in the staged files` and exit 0 (V: `secret-scan.mjs`). If it prints `SECRET <file>:<line>: <name>` lines instead, stop, unstage the named file, and do not commit.
   ```bash
   git commit -m "chore(packs): serve the speech models from our host with Hugging Face as the mirror (manifest v2)"
   git push -u origin chore/packs-models-on-r2
   gh pr create --base develop --fill
   ```
   It must merge before the next `eas build`: `published.ts` is the counter the next release adds one to, and if it is not committed the next release reuses a version number with different content and `upload` stops. Merge rules are as in `PACKS_HOSTING.md` step 8 (D-107, D-117). Phones pick up the new manifest at their next check (at most 6 hours while the app is open, R).

6. **On a phone**, one row in the device session (Asha book only): on a test iPhone with no speech model (a fresh install, or Settings > Storage > Remove), choose the download on Wi-Fi and record a short letter. Pass: the model finishes downloading, the letter gets its words, and nothing asks to download again. Fail: any download error, a letter that stays waiting, or a second download; write the screen and the time in the evidence row and open an issue. Optional second row, on a phone that already has the model: nothing downloads. This runbook does not quote the on-screen wording (UNVERIFIED), and neither row has been run.

## If something goes wrong

- **Upload or verify fails partway:** run `upload` again. It skips identical files and refuses different bytes at a used path. Until the manifest is uploaded (last), phones still read v1 and download from Hugging Face as today.
- **Phones fail to download from R2 after the switch:** they fall back to the Hugging Face mirror by themselves. To stop new downloads altogether while you look, use the `packDownloads` kill switch (`PACKS_HOSTING.md`, "Rolling back a bad pack", step 3). Installed models keep working.
- **To go back to Hugging Face as the primary:** build a new release with `--models upstream` (the version goes up again; never re-upload an older manifest), upload, verify, commit. Leave the model objects in the bucket.
- **Never delete** model objects from the bucket: older manifests, phones mid-download and a rollback need them.

## Cost

Within Cloudflare's free tier at beta scale (R: `PACKS_HOSTING.md` cost table): about 0.77 GB of storage against 10 GB free, egress free, and about 35 read operations per turbo install (574 MB in 16 MiB requests; `DEFAULT_CHUNK_BYTES` in `engine.ts`, V) against 10 million free a month. Cloudflare's edge does not cache files over 512 MB, so turbo is always served from R2 itself (R). The Supabase Free plan is not involved: packs, models and the manifest come from R2.

## Privacy text

After the move, Hugging Face sees a phone only when R2 fails. The policy line "Some speech model files are downloaded straight from Hugging Face" (line 101) stays true but describes the fallback, not the normal path. Whether to reword it is for counsel and the legal owner (Q11, Q12); this runbook changes no legal text.

## What an agent did and did not do

Did: read the code paths above and checked the three files' sizes and hashes on the Hugging Face API. Did not: build, sign, upload or verify a release; touch Cloudflare, Hugging Face, Apple or Supabase; read or hold any key or token.
