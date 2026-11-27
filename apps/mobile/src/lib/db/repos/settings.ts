/** Device settings (key/value). Keys in use are listed in src/lib/README.md. */
import type { RepoContext } from './context';

export function getSetting({ db }: RepoContext, key: string): string | null {
  return db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
}

export function setSetting({ db }: RepoContext, key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}

export function deleteSetting({ db }: RepoContext, key: string): void {
  db.run('DELETE FROM settings WHERE key = ?', key);
}

/**
 * Every key that starts with `prefix`, in key order. For a family of per-item keys (typed days, `typedDay.<date>`) that
 * has to be listed or cleared whole. Compares the leading characters exactly: no LIKE, so `_` and `%` in a prefix mean
 * themselves. Keys only, never values.
 */
export function settingKeysWithPrefix({ db }: RepoContext, prefix: string): string[] {
  return db.all<{ key: string }>('SELECT key FROM settings WHERE substr(key, 1, ?) = ? ORDER BY key', prefix.length, prefix).map((r) => r.key);
}
