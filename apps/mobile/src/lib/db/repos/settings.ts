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
