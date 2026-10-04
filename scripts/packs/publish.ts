/**
 * Builds and signs packs and public documents (ADR 0016). Never uploads.
 *
 *   export EL_SIGNING_KEY=...  EL_SIGNING_KEY_ID=...     # from your password manager, never committed
 *   npx tsx scripts/packs/publish.ts packs   [--base-url https://packs.earlyletters.com] [--min-app 1.0.0]
 *   npx tsx scripts/packs/publish.ts config  [--kill sync] [--unkill sync]
 *   npx tsx scripts/packs/publish.ts content
 *   npx tsx scripts/packs/publish.ts all
 *
 * packs:   builds every packs/text-rules/<lang>.json except English into
 *          dist/packs/<id>/<version>/<file>, adds the hosted speech models
 *          from apps/mobile/src/lib/models/catalog.ts, signs the manifest.
 * config:  signs scripts/packs/remote-config.json (--kill and --unkill edit
 *          that file first, so git keeps the history: C-NFR-009 audit trail).
 * content: signs the English bundle built from packages/content (prompts,
 *          story cards) plus scripts/packs/content-extra.en.json.
 *
 * Each signed document goes into supabase/functions/<fn>/published.ts with
 * its version one higher than the last published. The script then PRINTS the
 * manual steps: upload new pack files, deploy the functions. It runs none of
 * them.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KILL_SWITCH_KEYS, TRUSTED_SIGNING_KEYS, type PackEntry } from '../../packages/api/src/index';
import { PROMPTS } from '../../packages/content/src/prompts';
import { onboardingStories } from '../../packages/content/src/stories.en';
import { speechPackEntries } from '../../apps/mobile/src/lib/models/catalog';
import {
  buildContentBundle,
  buildManifest,
  buildRemoteConfig,
  buildTextRulesPack,
  configModule,
  contentModule,
  publishedVersion,
  readPublished,
  readSigningKey,
  sign,
  uploadCommands,
  type BuiltFile,
} from './lib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_MODULE = join(ROOT, 'supabase/functions/config/published.ts');
const CONTENT_MODULE = join(ROOT, 'supabase/functions/content/published.ts');
const REMOTE_CONFIG_SOURCE = join(ROOT, 'scripts/packs/remote-config.json');
const CONTENT_EXTRA = join(ROOT, 'scripts/packs/content-extra.en.json');
const TEXT_RULES_DIR = join(ROOT, 'packs/text-rules');
const OUT = join(ROOT, 'dist/packs');
const BUCKET = 'early-letters-packs';

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? (process.argv[i + 1] ?? null) : null;
}
function args(name: string): string[] {
  return process.argv.flatMap((a, i) => (a === `--${name}` && process.argv[i + 1] ? [process.argv[i + 1]] : []));
}

const what = process.argv[2] ?? '';
if (!['packs', 'config', 'content', 'all'].includes(what)) {
  process.stderr.write('usage: npx tsx scripts/packs/publish.ts packs|config|content|all [options]\n');
  process.exit(2);
}

let key: ReturnType<typeof readSigningKey>;
try {
  key = readSigningKey(process.env, TRUSTED_SIGNING_KEYS);
} catch (e) {
  process.stderr.write(`${(e as Error).message}\n`);
  process.exit(1);
}
const now = new Date().toISOString();
const configText = readFileSync(CONFIG_MODULE, 'utf8');
const contentText = readFileSync(CONTENT_MODULE, 'utf8');
let remoteConfigDoc = readPublished(configText, 'REMOTE_CONFIG') as string | null;
let manifestDoc = readPublished(configText, 'PACK_MANIFEST') as string | null;
const bundles = (readPublished(contentText, 'CONTENT_BUNDLES') as Record<string, string> | null) ?? {};
const steps: string[] = [];
const out = (s: string) => process.stdout.write(`${s}\n`);

if (what === 'packs' || what === 'all') {
  const baseUrl = arg('base-url') ?? 'https://packs.earlyletters.com';
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
  const source = JSON.parse(readFileSync(REMOTE_CONFIG_SOURCE, 'utf8')) as { killSwitches: Record<string, boolean> };
  for (const [flag, value] of [...args('kill').map((k) => [k, true] as const), ...args('unkill').map((k) => [k, false] as const)]) {
    if (!(KILL_SWITCH_KEYS as readonly string[]).includes(flag)) throw new Error(`unknown kill switch ${flag}; known: ${KILL_SWITCH_KEYS.join(', ')}`);
    source.killSwitches[flag] = value;
  }
  writeFileSync(REMOTE_CONFIG_SOURCE, `${JSON.stringify(source, null, 2)}\n`);
  const config = buildRemoteConfig(source, publishedVersion(remoteConfigDoc) + 1, now);
  remoteConfigDoc = sign('remote-config', config, key, TRUSTED_SIGNING_KEYS).text;
  out(`remote config v${config.version}`);
}

if (what === 'packs' || what === 'config' || what === 'all') {
  writeFileSync(CONFIG_MODULE, configModule(remoteConfigDoc, manifestDoc));
  steps.push('Deploy the config function:', '  npx supabase functions deploy config --no-verify-jwt --use-api');
}

if (what === 'content' || what === 'all') {
  const extra = existsSync(CONTENT_EXTRA) ? (JSON.parse(readFileSync(CONTENT_EXTRA, 'utf8')) as unknown[]) : [];
  const bundle = buildContentBundle({ prompts: PROMPTS, stories: onboardingStories, extraBlocks: extra }, publishedVersion(bundles.en) + 1, now);
  bundles.en = sign('content-bundle', bundle, key, TRUSTED_SIGNING_KEYS).text;
  writeFileSync(CONTENT_MODULE, contentModule(bundles));
  out(`content bundle en v${bundle.version}: ${bundle.blocks.length} blocks`);
  steps.push('Deploy the content function:', '  npx supabase functions deploy content --no-verify-jwt --use-api');
}

out('\nNothing was uploaded or deployed. Next steps (manual):');
for (const s of steps) out(s);
out('Then commit the changed published.ts and remote-config.json files: git history is the audit log of what was served.');
