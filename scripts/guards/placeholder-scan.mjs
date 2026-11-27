#!/usr/bin/env node
// Placeholder scan (BL-2125, from BL-117): a preview or production build must not ship while a publisher
// value in packages/brand still holds `TODO` (today `publisher.legalName`). Development builds are exempt.
//
//   node scripts/guards/placeholder-scan.mjs --profile <eas build profile>   the app env comes from apps/mobile/eas.json
//   node scripts/guards/placeholder-scan.mjs --app-env <development|preview|production>
//   [--brand <module>]  another brand module (tests); default packages/brand/index.ts
//
// There is no default environment: a step that names none fails (exit 2) rather than passing as development.
// Exit 0 clean or exempt, 1 a placeholder in a release build, 2 usage or an unreadable input.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { profileEnv } from '../../.github/scripts/seam-guard.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const APP_ENVS = ['development', 'preview', 'production'];
const PLACEHOLDER = /\bTODO\b/;

/** Each publisher field, nested ones included, whose string value holds a placeholder. */
export function placeholders(publisher, at = 'publisher') {
  const out = [];
  for (const [k, v] of Object.entries(publisher ?? {})) {
    if (typeof v === 'string' && PLACEHOLDER.test(v)) out.push(`${at}.${k}`);
    else if (v && typeof v === 'object') out.push(...placeholders(v, `${at}.${k}`));
  }
  return out;
}

/** The findings for one app env; development is exempt. */
export function scanPublisher(publisher, appEnv) {
  if (!APP_ENVS.includes(appEnv)) throw new Error(`unknown app env "${appEnv}"`);
  return appEnv === 'development' ? [] : placeholders(publisher);
}

/** EXPO_PUBLIC_APP_ENV for an eas.json build profile, following `extends`. Unset counts as development (POPS-02). */
export function appEnvOf(eas, profile) {
  const v = profileEnv(eas, profile).EXPO_PUBLIC_APP_ENV;
  return v === undefined || String(v).trim() === '' ? 'development' : String(v).trim();
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
}

export async function main(argv, log = console.log, err = console.error) {
  const profile = arg(argv, '--profile');
  let appEnv = arg(argv, '--app-env');
  const brandPath = resolve(arg(argv, '--brand') ?? join(REPO, 'packages/brand/index.ts'));
  let found;
  try {
    if (!profile === !appEnv) throw new Error('name exactly one of --profile or --app-env');
    if (profile) appEnv = appEnvOf(JSON.parse(readFileSync(join(REPO, 'apps/mobile/eas.json'), 'utf8')), profile);
    const { brand } = await import(pathToFileURL(brandPath).href);
    if (!brand?.publisher) throw new Error(`${brandPath} exports no brand.publisher`);
    found = scanPublisher(brand.publisher, appEnv);
  } catch (e) {
    err(`placeholder-scan: ${e.message}`);
    return 2;
  }
  const what = profile ? `profile ${profile} (${appEnv})` : appEnv;
  if (found.length) {
    err(`placeholder-scan: ${what} build, but packages/brand still holds TODO in ${found.join(', ')}. Set a real value (never a personal name in code, D-004) before a preview or production build.`);
    return 1;
  }
  log(appEnv === 'development' ? `placeholder-scan: ${what} build, exempt.` : `placeholder-scan: ${what} build, no TODO in the publisher values.`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
