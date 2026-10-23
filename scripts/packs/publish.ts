/**
 * Builds, signs, uploads and checks packs and public documents (ADR 0016;
 * founder runbook: docs/ops/PACKS_HOSTING.md).
 *
 *   The signing key, from your password manager, never committed. Either:
 *     export EL_SIGNING_KEY=...  EL_SIGNING_KEY_ID=...
 *   or a file OUTSIDE the repo holding those two lines, passed as --key-file <path>.
 *
 *   npx tsx scripts/packs/publish.ts release [--out dist/release] [--base-url https://packs.earlyletters.app] [--min-app 1.0.0]
 *                                            [--models download|upstream] [--models-dir <dir>] [--include-model <id>]... [--strict-models]
 *   npx tsx scripts/packs/publish.ts upload  [--from dist/release] [--dry-run] [--no-verify]      # PACKS_S3_* in the environment
 *   npx tsx scripts/packs/publish.ts verify  [--base-url https://packs.earlyletters.app]           # what phones will see, no key needed
 *   npx tsx scripts/packs/publish.ts serve   [--dir dist/release] [--port 8787]                    # preview a release locally
 *
 *   Development only (release + upload is the only supported way to publish: these print wrangler
 *   commands that overwrite without upload's checks; deploying the Supabase functions is optional):
 *   npx tsx scripts/packs/publish.ts packs   [--base-url ...] [--min-app 1.0.0]
 *   npx tsx scripts/packs/publish.ts config  [--kill sync] [--unkill sync]
 *   npx tsx scripts/packs/publish.ts content
 *   npx tsx scripts/packs/publish.ts all
 *
 * release: a complete directory any static host can serve (release.ts): the
 *          signed manifest, remote config and content bundle at the exact
 *          paths the app requests under EXPO_PUBLIC_DOCS_BASE_URL, every
 *          text-rules pack from packs/, and the speech models (downloaded
 *          from their pinned upstream URLs and checked against the catalog
 *          hash, or copied from --models-dir), plus release.json. It also
 *          rewrites supabase/functions/*\/published.ts so the version counter
 *          (rollback protection on the phone) has one source: git.
 * upload:  every file of a release to an S3-compatible bucket (s3.ts): packs
 *          first, manifest last, nothing overwritten, nothing deleted; then
 *          `verify` against the public host.
 * packs, config, content, all: the step-by-step path. They write the signed
 *          documents (and, for packs, the text packs) to dist/packs at the
 *          object keys the app requests, and print wrangler upload commands.
 *          `release` + `upload` do the same work in one directory with the
 *          speech models included, and upload it.
 * packs:   builds every packs/text-rules/<lang>.json except English into
 *          dist/packs/<id>/<version>/<file>, adds the hosted speech models
 *          from apps/mobile/src/lib/models/catalog.ts, signs the manifest.
 * config:  signs scripts/packs/remote-config.json (--kill and --unkill edit
 *          that file first, so git keeps the history: C-NFR-009 audit trail).
 * content: signs the English bundle built from packages/content (prompts,
 *          story cards) plus scripts/packs/content-extra.en.json.
 *
 * Each signed document goes into supabase/functions/<fn>/published.ts with
 * its version one higher than the last published. Nothing here prints a
 * secret.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KILL_SWITCH_KEYS, TRUSTED_SIGNING_KEYS, type PackEntry } from '../../packages/api/src/index';
import { PROMPTS } from '../../packages/content/src/prompts';
import { onboardingStories } from '../../packages/content/src/stories.en';
import { PACKS_ORIGIN, speechPackEntries } from '../../apps/mobile/src/lib/models/catalog';
import {
  buildContentBundle,
  buildManifest,
  buildRemoteConfig,
  buildTextRulesPack,
  configModule,
  contentModule,
  documentObjects,
  documentUploadCommands,
  humanBytes,
  killSwitchSteps,
  parseKeyFile,
  publishedVersion,
  readPublished,
  readSigningKey,
  sign,
  uploadCommands,
  type BuiltFile,
  type ModelMode,
  VERCEL_HOBBY_UPLOAD_BYTES,
} from './lib';
import { checkKeyFile } from './key-file';
import { buildRelease, serveRelease, RELEASE_INDEX_FILE } from './release';
import { checkHosted, readReleaseIndex, s3ConfigFromEnv, S3_ENV, uploadRelease } from './s3';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_MODULE = join(ROOT, 'supabase/functions/config/published.ts');
const CONTENT_MODULE = join(ROOT, 'supabase/functions/content/published.ts');
const REMOTE_CONFIG_SOURCE = join(ROOT, 'scripts/packs/remote-config.json');
const CONTENT_EXTRA = join(ROOT, 'scripts/packs/content-extra.en.json');
const TEXT_RULES_DIR = join(ROOT, 'packs/text-rules');
const OUT = join(ROOT, 'dist/packs');
const RELEASE_OUT = join(ROOT, 'dist/release');
const BUCKET = 'early-letters-packs';
const DEFAULT_BASE_URL = PACKS_ORIGIN; // D-097: https://packs.earlyletters.app

const COMMANDS = ['release', 'upload', 'verify', 'serve', 'packs', 'config', 'content', 'all'] as const;
type Command = (typeof COMMANDS)[number];

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? (process.argv[i + 1] ?? null) : null;
}
function args(name: string): string[] {
  return process.argv.flatMap((a, i) => (a === `--${name}` && process.argv[i + 1] ? [process.argv[i + 1]] : []));
}
const flag = (name: string) => process.argv.includes(`--${name}`);
const out = (s: string) => process.stdout.write(`${s}\n`);
const fail = (s: string): never => {
  process.stderr.write(`${s}\n`);
  process.exit(1);
};

const what = (process.argv[2] ?? '') as Command;
if (!COMMANDS.includes(what)) {
  process.stderr.write(`usage: npx tsx scripts/packs/publish.ts ${COMMANDS.join('|')} [options]  (docs/ops/PACKS_HOSTING.md)\n`);
  process.exit(2);
}

/** The signing key from the environment or --key-file (a file outside the repo). Refuses a key the app does not trust. */
function signingKey() {
  const env: Record<string, string | undefined> = { EL_SIGNING_KEY: process.env.EL_SIGNING_KEY, EL_SIGNING_KEY_ID: process.env.EL_SIGNING_KEY_ID };
  const file = arg('key-file');
  if (file) {
    // Real path, every checkout of this repo, its git dir, any other git repo, and letter case where the disk ignores it (key-file.ts).
    const check = checkKeyFile(file, ROOT);
    if (check.problem) fail(check.problem);
    Object.assign(env, parseKeyFile(readFileSync(check.real, 'utf8')));
  }
  try {
    return readSigningKey(env, TRUSTED_SIGNING_KEYS);
  } catch (e) {
    return fail((e as Error).message);
  }
}

/** The document versions committed in supabase/functions/*\/published.ts: what phones may already hold. */
function committedVersions() {
  const config = readFileSync(CONFIG_MODULE, 'utf8');
  const content = (readPublished(readFileSync(CONTENT_MODULE, 'utf8'), 'CONTENT_BUNDLES') as Record<string, string> | null) ?? {};
  return {
    'pack-manifest': publishedVersion(readPublished(config, 'PACK_MANIFEST')),
    'remote-config': publishedVersion(readPublished(config, 'REMOTE_CONFIG')),
    'content-bundle': publishedVersion(content.en),
  };
}

async function main(): Promise<void> {
  // ------------------------------------------------------------------ no key needed
  if (what === 'verify') {
    const base = arg('base-url') ?? DEFAULT_BASE_URL;
    out(`Checking ${base} the way a phone does (trusted key ids: ${TRUSTED_SIGNING_KEYS.map((k) => k.keyId).join(', ') || 'NONE: packages/api/src/keys.ts is empty'})`);
    const r = await checkHosted(base, TRUSTED_SIGNING_KEYS, fetch, committedVersions());
    for (const l of r.lines) out(l);
    out(r.ok ? '\nEvery check passed: a build with this host and these keys will download these packs.' : '\nSomething is wrong above; phones would ignore the manifest or fail a download.');
    process.exit(r.ok ? 0 : 1);
  }
  if (what === 'serve') {
    const dir = resolve(arg('dir') ?? RELEASE_OUT);
    if (!existsSync(join(dir, RELEASE_INDEX_FILE))) fail(`${dir} has no ${RELEASE_INDEX_FILE}: run \`publish.ts release\` first.`);
    const s = await serveRelease(dir, { port: Number(arg('port') ?? 8787) });
    out(`Serving ${dir} at ${s.url} (Ctrl-C to stop). Try: curl -sI ${s.url}/functions/v1/config/v1/packs`);
    await new Promise(() => undefined);
  }
  if (what === 'upload') {
    const dir = resolve(arg('from') ?? RELEASE_OUT);
    if (!existsSync(join(dir, RELEASE_INDEX_FILE))) fail(`${dir} has no ${RELEASE_INDEX_FILE}: run \`publish.ts release\` first.`);
    const index = readReleaseIndex(dir);
    let cfg;
    try {
      cfg = s3ConfigFromEnv(process.env);
    } catch (e) {
      return fail(`${(e as Error).message}\nSet ${Object.values(S3_ENV).join(', ')} (docs/ops/PACKS_HOSTING.md, "Upload").`);
    }
    out(`Uploading ${dir} (manifest v${index.manifestVersion}, ${index.files.length} files) to ${cfg.endpoint}/${cfg.bucket}${flag('dry-run') ? ' [dry run]' : ''}`);
    const s = await uploadRelease(dir, index, cfg, { dryRun: flag('dry-run'), log: out });
    out(`\n${s.uploaded.length} uploaded (${humanBytes(s.bytesSent)}), ${s.skipped.length} already there.`);
    for (const n of index.notIncluded) out(`not uploaded: ${n.id} v${n.version} stays on ${n.url} (${n.reason})`);
    if (flag('dry-run') || flag('no-verify')) return;
    out(`\nChecking ${index.baseUrl} as a phone would:`);
    const r = await checkHosted(index.baseUrl, TRUSTED_SIGNING_KEYS, fetch, committedVersions());
    for (const l of r.lines) out(l);
    out(r.ok ? '\nLive. Commit supabase/functions/*/published.ts and scripts/packs/remote-config.json now: git is the audit log of what was served.' : '\nUploaded, but the public host does not serve it correctly yet (custom domain, cache or key): see docs/ops/PACKS_HOSTING.md, "Verify".');
    process.exit(r.ok ? 0 : 1);
  }

  // ------------------------------------------------------------------ signing commands
  const key = signingKey();
  const now = new Date().toISOString();
  const configText = readFileSync(CONFIG_MODULE, 'utf8');
  const contentText = readFileSync(CONTENT_MODULE, 'utf8');
  let remoteConfigDoc = readPublished(configText, 'REMOTE_CONFIG') as string | null;
  let manifestDoc = readPublished(configText, 'PACK_MANIFEST') as string | null;
  const bundles = (readPublished(contentText, 'CONTENT_BUNDLES') as Record<string, string> | null) ?? {};
  const steps: string[] = [];
  const remoteConfigSource = () => JSON.parse(readFileSync(REMOTE_CONFIG_SOURCE, 'utf8')) as { killSwitches: Record<string, boolean> };
  const extraBlocks = () => (existsSync(CONTENT_EXTRA) ? (JSON.parse(readFileSync(CONTENT_EXTRA, 'utf8')) as unknown[]) : []);

  if (what === 'release') {
    const outDir = resolve(arg('out') ?? RELEASE_OUT);
    const models = (arg('models') ?? 'download') as ModelMode;
    if (models !== 'download' && models !== 'upstream') fail('--models must be download or upstream');
    const built = await buildRelease({
      root: ROOT,
      out: outDir,
      baseUrl: arg('base-url') ?? DEFAULT_BASE_URL,
      minAppVersion: arg('min-app') ?? '1.0.0',
      key,
      trusted: TRUSTED_SIGNING_KEYS,
      models,
      modelsDir: arg('models-dir'),
      includeModels: args('include-model'),
      strictModels: flag('strict-models'),
      previous: { manifest: publishedVersion(manifestDoc), config: publishedVersion(remoteConfigDoc), content: publishedVersion(bundles.en) },
      content: { prompts: PROMPTS, stories: onboardingStories, extraBlocks: extraBlocks() },
      remoteConfigSource: remoteConfigSource(),
      log: out,
    });
    writeFileSync(CONFIG_MODULE, configModule(built.documents['remote-config'], built.documents['pack-manifest']));
    writeFileSync(CONTENT_MODULE, contentModule({ ...bundles, en: built.documents['content-bundle'] }));
    const total = built.index.files.reduce((n, f) => n + f.bytes, 0);
    out(`\nRelease written to ${outDir}: ${built.index.files.length} files, ${humanBytes(total)}; index in ${RELEASE_INDEX_FILE}.`);
    for (const n of built.index.notIncluded) out(`  not included: ${n.id} v${n.version} (${humanBytes(n.bytes)}): ${n.reason}`);
    if (total > VERCEL_HOBBY_UPLOAD_BYTES) out(`  ${humanBytes(total)} is over the 100 MB a Vercel Hobby deployment accepts: for the Vercel fallback, build with --models upstream.`);
    out('\nNothing was uploaded. Next:');
    out(`  1. npx tsx scripts/packs/publish.ts upload --from ${outDir}      # PACKS_S3_* set; packs first, manifest last; then checks the public host`);
    out(`     (or serve the directory as is from any static host, for example: npx vercel deploy ${outDir} --prod; then: npx tsx scripts/packs/publish.ts verify)`);
    out('  2. git add supabase/functions/config/published.ts supabase/functions/content/published.ts scripts/packs/remote-config.json && git commit');
    return;
  }

  if (what === 'packs' || what === 'all') {
    const baseUrl = arg('base-url') ?? DEFAULT_BASE_URL;
    const minAppVersion = arg('min-app') ?? '1.0.0';
    const built: BuiltFile[] = [];
    const sources = existsSync(TEXT_RULES_DIR) ? readdirSync(TEXT_RULES_DIR).filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== 'en.json') : [];
    for (const file of sources.sort()) {
      const b = buildTextRulesPack(file.slice(0, 2), readFileSync(join(TEXT_RULES_DIR, file), 'utf8'), { baseUrl, minAppVersion });
      mkdirSync(dirname(join(OUT, b.objectKey)), { recursive: true });
      writeFileSync(join(OUT, b.objectKey), b.bytes);
      built.push(b);
      out(`built ${b.entry.id} v${b.entry.version} ${b.entry.bytes} bytes sha256 ${b.entry.sha256}`);
    }
    const speech = speechPackEntries(minAppVersion) as PackEntry[];
    const manifest = buildManifest([...built.map((b) => b.entry), ...speech], publishedVersion(manifestDoc) + 1, now);
    manifestDoc = sign('pack-manifest', manifest, key, TRUSTED_SIGNING_KEYS).text;
    out(`manifest v${manifest.version}: ${built.length} text packs, ${speech.length} speech models`);
    if (built.length) steps.push('Upload new pack files (immutable paths; re-uploading the same version is harmless):', ...uploadCommands(built, BUCKET).map((c) => `  ${c}`));
  }

  if (what === 'config' || what === 'all') {
    const source = remoteConfigSource();
    for (const [flagName, value] of [...args('kill').map((k) => [k, true] as const), ...args('unkill').map((k) => [k, false] as const)]) {
      if (!(KILL_SWITCH_KEYS as readonly string[]).includes(flagName)) throw new Error(`unknown kill switch ${flagName}; known: ${KILL_SWITCH_KEYS.join(', ')}`);
      source.killSwitches[flagName] = value;
    }
    writeFileSync(REMOTE_CONFIG_SOURCE, `${JSON.stringify(source, null, 2)}\n`);
    const config = buildRemoteConfig(source, publishedVersion(remoteConfigDoc) + 1, now);
    remoteConfigDoc = sign('remote-config', config, key, TRUSTED_SIGNING_KEYS).text;
    out(`remote config v${config.version}`);
    steps.push(...killSwitchSteps(config.killSwitches));
  }

  if (what === 'packs' || what === 'config' || what === 'all') {
    writeFileSync(CONFIG_MODULE, configModule(remoteConfigDoc, manifestDoc));
    steps.push('Optional, only where a build reads documents from Supabase (no EXPO_PUBLIC_DOCS_BASE_URL): deploy the config function:', '  npx supabase functions deploy config --no-verify-jwt --use-api');
  }

  if (what === 'content' || what === 'all') {
    const bundle = buildContentBundle({ prompts: PROMPTS, stories: onboardingStories, extraBlocks: extraBlocks() }, publishedVersion(bundles.en) + 1, now);
    bundles.en = sign('content-bundle', bundle, key, TRUSTED_SIGNING_KEYS).text;
    writeFileSync(CONTENT_MODULE, contentModule(bundles));
    out(`content bundle en v${bundle.version}: ${bundle.blocks.length} blocks`);
    steps.push('Optional, only where a build reads documents from Supabase (no EXPO_PUBLIC_DOCS_BASE_URL): deploy the content function:', '  npx supabase functions deploy content --no-verify-jwt --use-api');
  }

  // D-097: the builds read signed documents from the pack host, so they go to R2 too.
  const documents = documentObjects({ remoteConfig: remoteConfigDoc, packManifest: manifestDoc, contentEn: bundles.en ?? null });
  for (const d of documents) {
    mkdirSync(dirname(join(OUT, d.objectKey)), { recursive: true });
    writeFileSync(join(OUT, d.objectKey), d.text);
  }
  if (documents.length) {
    const at = steps.findIndex((s) => s.startsWith('Optional'));
    steps.splice(at < 0 ? steps.length : at, 0, 'Upload the signed documents the app reads from https://packs.earlyletters.app (after the pack files, so the manifest never points at a missing file):', ...documentUploadCommands(documents, BUCKET).map((c) => `  ${c}`));
  }

  out('\nNothing was uploaded or deployed. Next steps (manual; `publish.ts release` then `publish.ts upload` does all of it, models included):');
  for (const s of steps) out(s);
  out('Then commit the changed published.ts and remote-config.json files: git history is the audit log of what was served.');
}

main().catch((e: unknown) => fail((e as Error).message));
