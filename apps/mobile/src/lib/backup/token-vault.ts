/**
 * Upload tokens of the recording backup, in the Keychain (CR-71 B5, B5-6). A token is a resumable-upload capability, a
 * secret until the upload ends (data class L4), so it lives in the Keychain item that is this device only and is never
 * restored onto another phone, and never in the backup state file (the `upload_token` column stays, always null).
 *
 * One item holds every account's tokens as a small map `<profile id>:<entry id>` to token, so Erase everything removes
 * one item and a sign-out removes one account's entries, with no listing of the Keychain (it cannot be listed). Tokens
 * are short lived and few. Reads and writes are serialised so two updates never lose one another.
 *
 * Imports only the app's Keychain wrapper: it works with `capabilities.backup` off (a launch step moves old rows),
 * and nothing in it reaches the backup runtime. Nothing is logged: no token, id or path.
 */
import { secureStorage, type KeyValueStorage } from '../supabase/secure-storage';

export const BACKUP_TOKENS_KEY = 'scribe.backup.uploadTokens';

/** What the upload queue uses for one account. */
export interface TokenStore {
  get(entryId: string): Promise<string | null>;
  set(entryId: string, token: string): Promise<void>;
  remove(entryId: string): Promise<void>;
}

type Book = Record<string, string>;

let chain: Promise<unknown> = Promise.resolve();
/** One Keychain read-modify-write at a time. A failed one does not stop the next. */
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job);
  chain = run.catch(() => undefined);
  return run;
}

/** The map, `{}` when none. A read that FAILS throws (a caller that writes must not overwrite what it could not read). */
async function readBook(storage: KeyValueStorage): Promise<Book> {
  const raw = await storage.getItem(BACKUP_TOKENS_KEY);
  if (raw === null) return {};
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Book) : {};
  } catch {
    return {}; // unreadable content holds no usable token
  }
}

async function writeBook(storage: KeyValueStorage, book: Book): Promise<void> {
  if (Object.keys(book).length === 0) await storage.removeItem(BACKUP_TOKENS_KEY);
  else await storage.setItem(BACKUP_TOKENS_KEY, JSON.stringify(book));
}

const keyOf = (profileId: string, entryId: string) => `${profileId.toLowerCase()}:${entryId}`;

export function createTokenStore(profileId: string, storage: KeyValueStorage = secureStorage): TokenStore {
  return {
    get: (entryId) => serial(async () => (await readBook(storage))[keyOf(profileId, entryId)] ?? null),
    set: (entryId, token) =>
      serial(async () => {
        const book = await readBook(storage);
        book[keyOf(profileId, entryId)] = token;
        await writeBook(storage, book);
      }),
    remove: (entryId) =>
      serial(async () => {
        const book = await readBook(storage);
        if (!(keyOf(profileId, entryId) in book)) return;
        delete book[keyOf(profileId, entryId)];
        await writeBook(storage, book);
      }),
  };
}

/** Many tokens at once (the launch move). Throws if the Keychain cannot be read or written: the caller keeps its rows. */
export function putTokens(profileId: string, entries: { entryId: string; token: string }[], storage: KeyValueStorage = secureStorage): Promise<void> {
  return serial(async () => {
    const book = await readBook(storage);
    for (const e of entries) book[keyOf(profileId, e.entryId)] = e.token;
    await writeBook(storage, book);
  });
}

/** Sign-out: this account's tokens go. Never throws (a left token is removed by the next sign-out or Erase). */
export function removeBackupTokensFor(profileId: string, storage: KeyValueStorage = secureStorage): Promise<void> {
  const prefix = `${profileId.toLowerCase()}:`;
  return serial(async () => {
    const book = await readBook(storage);
    for (const k of Object.keys(book)) if (k.startsWith(prefix)) delete book[k];
    await writeBook(storage, book);
  }).catch(() => undefined);
}

/** Erase everything: the whole item. */
export function removeAllBackupTokens(storage: KeyValueStorage = secureStorage): Promise<void> {
  return serial(() => storage.removeItem(BACKUP_TOKENS_KEY));
}
