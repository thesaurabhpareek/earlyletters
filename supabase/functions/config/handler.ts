/**
 * `config` Edge Function routes (ADR 0016, ADR 0017):
 *   GET /config/v1/remote-config   signed RemoteConfig
 *   GET /config/v1/packs           signed PackManifest
 * Public, read-only, cacheable; no user data in or out.
 */
import { CACHE_POLICY } from '../../../packages/api/src/standards.ts';
import { makeDocumentHandler, type ServeOptions } from './serve.ts';

export interface ConfigDocuments {
  remoteConfig: string | null;
  packManifest: string | null;
}

export function makeConfigHandler(docs: ConfigDocuments, opts: ServeOptions = {}) {
  return makeDocumentHandler(
    'config',
    {
      'v1/remote-config': () => (docs.remoteConfig ? { body: docs.remoteConfig, cacheControl: CACHE_POLICY.remoteConfig } : null),
      'v1/packs': () => (docs.packManifest ? { body: docs.packManifest, cacheControl: CACHE_POLICY.packManifest } : null),
    },
    opts,
  );
}
