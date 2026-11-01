/**
 * Text-rules packs as the language settings show them: built in (English),
 * on this phone, downloading, waiting, or not yet downloaded, with sizes
 * from the signed manifest. Downloads go through lib/packs (ensurePack),
 * which checks every byte against the manifest; choosing Portuguese fetches
 * the Portuguese pack and nothing else (founder decision 15).
 */
import { resolvePack } from '@scribe/api';
import { textRulesPackId, type LanguageCode } from '@scribe/core';
import { ensurePack, usePacks, type EnsureResult, type PackFailure } from '../packs';
import { APP_VERSION, getPackManifest } from '../remote';

export type TextRulesStatus =
  | { state: 'bundled' }
  | { state: 'installed'; bytes: number }
  | { state: 'downloading'; bytesDone: number; bytesTotal: number }
  | { state: 'waiting'; reason: PackFailure; bytes: number | null }
  | { state: 'absent'; bytes: number | null };

/** The size the manifest lists for this language's pack, or null before the manifest has arrived. */
export function textRulesBytes(code: LanguageCode): number | null {
  if (code === 'en') return 0;
  const manifest = getPackManifest();
  if (!manifest) return null;
  return resolvePack(manifest, textRulesPackId(code), APP_VERSION)?.bytes ?? null;
}

/** Download (if needed) and install a language's text rules. English resolves at once. */
export function ensureTextRules(code: LanguageCode, opts?: { allowCellularOnce?: boolean }): Promise<EnsureResult | { ok: true; path: 'bundled'; version: 0 }> {
  if (code === 'en') return Promise.resolve({ ok: true, path: 'bundled', version: 0 });
  // Never throw synchronously: callers fire and forget, and some platforms
  // (the web preview) throw from the file system before a promise exists.
  try {
    return ensurePack(textRulesPackId(code), opts).catch(() => ({ ok: false, reason: 'storage_error' }) as EnsureResult);
  } catch {
    return Promise.resolve({ ok: false, reason: 'storage_error' } as EnsureResult);
  }
}

/** Live status for each language. */
export function useTextRulesStatus(codes: readonly LanguageCode[]): Record<string, TextRulesStatus> {
  const { installed, progress } = usePacks();
  const out: Record<string, TextRulesStatus> = {};
  for (const code of codes) {
    if (code === 'en') {
      out[code] = { state: 'bundled' };
      continue;
    }
    const id = textRulesPackId(code);
    const p = progress[id];
    const inst = installed.find((x) => x.id === id);
    const bytes = textRulesBytes(code);
    if (p && (p.phase === 'queued' || p.phase === 'downloading' || p.phase === 'verifying' || p.phase === 'installing')) {
      out[code] = { state: 'downloading', bytesDone: p.bytesDone, bytesTotal: p.bytesTotal || bytes || 0 };
    } else if (inst) {
      out[code] = { state: 'installed', bytes: inst.bytes };
    } else if (p && (p.phase === 'failed' || p.phase === 'waiting_for_wifi') && p.failure) {
      out[code] = { state: 'waiting', reason: p.failure, bytes };
    } else if (p && p.phase === 'waiting_for_wifi') {
      out[code] = { state: 'waiting', reason: 'waiting_for_wifi', bytes };
    } else {
      out[code] = { state: 'absent', bytes };
    }
  }
  return out;
}
