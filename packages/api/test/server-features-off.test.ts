/// <reference types="node" />
/**
 * [M14] A build with EXPO_PUBLIC_SERVER_FEATURES=off never loads the
 * server-feature contracts (08 section 8.3 item 1; capabilities.ts).
 *
 * The rule: the contracts for sync, family, the status report, the recovery
 * key and push live behind `@scribe/api/server`; the package root (all an off
 * build needs: signed documents, envelope, standards, remote config) never
 * imports them; and the app's boot path never imports the server entry.
 * Value imports of it are allowed only in modules that run behind
 * `capabilities.*` (the list below grows by PR, with the gate named).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as root from '../src';
import * as server from '../server';

const PKG = fileURLToPath(new URL('..', import.meta.url));
const REPO = resolve(PKG, '../..');

/** Relative imports of a source file, resolved to files. */
function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  const out: string[] = [];
  for (const m of text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s+['"](\.[^'"]+)['"]/g)) {
    const base = resolve(dirname(file), m[1]);
    for (const cand of [base, `${base}.ts`, join(base, 'index.ts')]) {
      try {
        if (statSync(cand).isFile()) {
          out.push(cand);
          break;
        }
      } catch {
        // try the next candidate
      }
    }
  }
  return out;
}

function closure(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (f: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    for (const g of importsOf(f)) walk(g);
  };
  walk(entry);
  return seen;
}

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * App files allowed a value import of `@scribe/api/server`, each with the
 * gate that keeps it from running in an off build. Empty on 15 Oct 2026:
 * S03, S04, S05 and S06 add their modules here when they adopt the contracts.
 */
const GATED_VALUE_IMPORTERS: Record<string, string> = {
  // S06, WP-F14-15a: reached only through import('./status-report.app') in plan-store startPlus and
  // actions presentPlusStore, each behind `capabilities.statusReport` (build flag plus server switch).
  'apps/mobile/src/lib/billing/status-report.logic.ts': 'capabilities.statusReport (dynamic import from lib/billing/plan-store.ts and actions.ts)',
  // S05, backup client: parseEscrowKeys for EXPO_PUBLIC_ESCROW_KEYS. Reached only from lib/backup/runtime.ts, which
  // lib/backup/gate.ts requires behind `capabilities.backup` (build flag plus server features; test/backup-gate.test.ts).
  'apps/mobile/src/lib/backup/escrow-keys.ts': 'capabilities.backup (require of lib/backup/runtime.ts in lib/backup/gate.ts)',
};

describe('[M14] EXPO_PUBLIC_SERVER_FEATURES=off loads no server-feature contract', () => {
  it('the package root exports none of the server contracts', () => {
    const rootNames = new Set(Object.keys(root));
    const leaked = Object.keys(server).filter((k) => rootNames.has(k));
    expect(leaked).toEqual([]);
    for (const k of ['SYNC_API_VERSION', 'inviteErrorKindFor', 'StatusReportSchema', 'SealedBoxSchema', 'PushPayloadSchema']) {
      expect(k in root).toBe(false);
      expect(k in server).toBe(true);
    }
  });

  it('nothing the package root imports reaches src/server', () => {
    const files = closure(join(PKG, 'src/index.ts'));
    const reached = [...files].map((f) => relative(PKG, f)).filter((f) => f.startsWith('src/server'));
    expect(reached).toEqual([]);
  });

  it('the app boot path and the remote client never import @scribe/api/server', () => {
    const boot = [
      'apps/mobile/src/app/_layout.tsx',
      'apps/mobile/src/lib/capabilities.ts',
      ...walkFiles(join(REPO, 'apps/mobile/src/lib/remote')).map((f) => relative(REPO, f)),
    ];
    for (const f of boot) {
      const text = readFileSync(join(REPO, f), 'utf8');
      expect(text, f).not.toMatch(/@scribe\/api\/server/);
    }
  });

  it('app code imports @scribe/api/server by `import type` only, outside the gated list', () => {
    const offenders: string[] = [];
    for (const f of walkFiles(join(REPO, 'apps/mobile/src'))) {
      const rel = relative(REPO, f);
      const text = readFileSync(f, 'utf8');
      for (const m of text.matchAll(/(?:^|\n)\s*(import|export)(\s+type)?\s[^;]*?from\s+['"]@scribe\/api\/server['"]/g)) {
        if (!m[2] && !(rel in GATED_VALUE_IMPORTERS)) offenders.push(rel);
      }
      if (/require\(\s*['"]@scribe\/api\/server['"]\s*\)/.test(text) && !(rel in GATED_VALUE_IMPORTERS)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it('kill switches for M14 features parse as off in an off build (bundled defaults)', () => {
    for (const k of root.M14_KILL_SWITCH_KEYS) expect(root.DEFAULT_REMOTE_CONFIG.killSwitches[k]).toBe(false);
  });
});
