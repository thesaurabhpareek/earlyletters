/**
 * Device ports for signed documents: a small file cache in Application
 * Support/remote (excluded from backup, re-downloadable) and `fetch` with a
 * timeout. No credentials are sent: these documents are public and hold no
 * user data (ADR 0017).
 */
import { File } from 'expo-file-system';
import { appSupportDir } from '../packs/app-support';
import type { DocHttp, DocStorage } from './documents';

const NAME_RE = /^[a-z-]+\.json$/;

export function expoDocStorage(): DocStorage {
  let dirUri: string | null = null;
  const dir = () => (dirUri ??= appSupportDir('remote').dir.uri);
  const file = (name: string) => {
    if (!NAME_RE.test(name)) throw new Error('bad_cache_name');
    return new File(dir(), name);
  };
  return {
    read(name) {
      try {
        const f = file(name);
        return f.exists ? f.textSync() : null;
      } catch {
        return null;
      }
    },
    write(name, text) {
      // Write a temp file, then move it over the old one, so a crash never leaves half a cache.
      const tmp = file(`${name.replace(/\.json$/, '')}-tmp.json`);
      if (!tmp.exists) tmp.create();
      tmp.write(text);
      tmp.moveSync(file(name), { overwrite: true });
    },
    remove(name) {
      try {
        const f = file(name);
        if (f.exists) f.delete();
      } catch {
        // nothing to remove
      }
    },
  };
}

export const fetchDocHttp: DocHttp = {
  async get(url, headers, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: 'GET', headers, signal: ctrl.signal, credentials: 'omit' });
      const etag = res.headers.get('etag');
      const body = res.status === 200 ? await res.text() : null;
      if (res.status !== 200) {
        try {
          await res.text();
        } catch {
          // body discarded
        }
      }
      return { status: res.status, etag, body };
    } finally {
      clearTimeout(timer);
    }
  },
};
