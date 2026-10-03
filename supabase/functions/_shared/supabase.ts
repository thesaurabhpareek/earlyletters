/**
 * Service-role access to PostgREST, Storage and Auth admin over plain fetch.
 * No SDK: the same module runs in Edge Functions (Deno), ops scripts (Node 22)
 * and tests (vitest with a fake fetch).
 *
 * Privacy rules this module keeps:
 *  - Person, book and letter ids travel in request bodies (RPC arguments,
 *    Storage list and delete bodies), never in query strings, except the Auth
 *    admin user path, which has no body form (TDD 06 conflict C-1, accepted
 *    pending counsel).
 *  - Errors keep the HTTP status and SQLSTATE only (ServiceError).
 */
import { drain, fetchWithTimeout, httpCode, jsonOf, ServiceError, type FetchFn } from './http.ts';

export interface ServiceConfig {
  /** https://<project>.supabase.co */
  url: string;
  /** Service role key (Edge Function secret SUPABASE_SERVICE_ROLE_KEY). Never sent to a device. */
  serviceKey: string;
  fetch?: FetchFn;
  timeoutMs?: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  /** Identity providers linked to the account, e.g. ['apple'], ['email']. */
  providers: string[];
}

export interface StorageEntry {
  /** Name relative to the listed folder. */
  name: string;
  isFolder: boolean;
}

export interface StorageApi {
  listBuckets(): Promise<string[]>;
  list(bucket: string, folder: string, limit?: number, offset?: number): Promise<StorageEntry[]>;
  /** Every object name under a folder, depth first, stopping at `max`. */
  listAll(bucket: string, folder: string, max?: number): Promise<{ names: string[]; truncated: boolean }>;
  /** Deletes exact object names; returns how many existed. Missing objects are not an error. */
  remove(bucket: string, names: string[]): Promise<number>;
  copy(bucket: string, from: string, to: string): Promise<void>;
  upload(bucket: string, path: string, body: string, contentType: string, upsert?: boolean): Promise<void>;
  download(bucket: string, path: string): Promise<string | null>;
}

export interface AuthAdminApi {
  getUser(id: string): Promise<AuthUser | null>;
  /** 'not_found' when the user is already gone (idempotent). */
  deleteUser(id: string): Promise<'deleted' | 'not_found'>;
  /** The user behind a session token, or null when the token is not valid. */
  userFromToken(accessToken: string): Promise<AuthUser | null>;
}

export interface ServiceClient {
  rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T>;
  select<T>(table: string, query: string): Promise<T[]>;
  insert(table: string, rows: Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }): Promise<void>;
  update(table: string, filter: string, patch: Record<string, unknown>): Promise<void>;
  storage: StorageApi;
  auth: AuthAdminApi;
}

const NAME_RE = /^[a-z_][a-z0-9_]{0,62}$/;

async function postgrestError(res: Response): Promise<ServiceError> {
  let sqlstate: string | undefined;
  try {
    const body = (await res.json()) as { code?: unknown };
    if (typeof body?.code === 'string' && /^[0-9A-Z]{5}$/.test(body.code)) sqlstate = body.code;
  } catch {
    // body is not JSON; keep the status only
  }
  return new ServiceError('postgrest', res.status, sqlstate ? 'sqlstate' : httpCode(res.status), sqlstate);
}

function parseUser(raw: unknown): AuthUser | null {
  const u = raw as {
    id?: unknown;
    email?: unknown;
    identities?: { provider?: unknown }[] | null;
    app_metadata?: { provider?: unknown; providers?: unknown } | null;
  };
  if (!u || typeof u.id !== 'string') return null;
  const providers = new Set<string>();
  for (const i of u.identities ?? []) if (typeof i?.provider === 'string') providers.add(i.provider);
  const meta = u.app_metadata ?? {};
  if (typeof meta.provider === 'string') providers.add(meta.provider);
  if (Array.isArray(meta.providers)) for (const p of meta.providers) if (typeof p === 'string') providers.add(p);
  return { id: u.id, email: typeof u.email === 'string' && u.email.includes('@') ? u.email : null, providers: [...providers].sort() };
}

export function createServiceClient(cfg: ServiceConfig): ServiceClient {
  const base = cfg.url.replace(/\/+$/, '');
  const f: FetchFn = cfg.fetch ?? ((input, init) => fetch(input, init));
  const timeout = cfg.timeoutMs ?? 15_000;
  const headers = (extra: Record<string, string> = {}): Record<string, string> => ({
    apikey: cfg.serviceKey,
    Authorization: `Bearer ${cfg.serviceKey}`,
    ...extra,
  });
  const call = (provider: 'postgrest' | 'storage' | 'auth', path: string, init: RequestInit) =>
    fetchWithTimeout(f, provider, `${base}${path}`, init, timeout);

  const rpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => {
    if (!NAME_RE.test(fn)) throw new ServiceError('postgrest', 0, 'invalid_input');
    const res = await call('postgrest', `/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      body: JSON.stringify(args),
    });
    if (!res.ok) throw await postgrestError(res);
    if (res.status === 204) return null as T;
    const text = await res.text();
    if (!text) return null as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ServiceError('postgrest', res.status, 'bad_response');
    }
  };

  const select = async <T>(table: string, query: string): Promise<T[]> => {
    if (!NAME_RE.test(table)) throw new ServiceError('postgrest', 0, 'invalid_input');
    const res = await call('postgrest', `/rest/v1/${table}?${query}`, { method: 'GET', headers: headers({ Accept: 'application/json' }) });
    if (!res.ok) throw await postgrestError(res);
    return jsonOf<T[]>(res, 'postgrest');
  };

  const insert = async (table: string, rows: Record<string, unknown>[], opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}) => {
    if (!NAME_RE.test(table)) throw new ServiceError('postgrest', 0, 'invalid_input');
    if (!rows.length) return;
    const q = opts.onConflict ? `?on_conflict=${encodeURIComponent(opts.onConflict)}` : '';
    const prefer = ['return=minimal', ...(opts.ignoreDuplicates ? ['resolution=ignore-duplicates'] : [])].join(',');
    const res = await call('postgrest', `/rest/v1/${table}${q}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: prefer }),
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw await postgrestError(res);
    await drain(res);
  };

  const update = async (table: string, filter: string, patch: Record<string, unknown>) => {
    if (!NAME_RE.test(table) || !filter) throw new ServiceError('postgrest', 0, 'invalid_input');
    const res = await call('postgrest', `/rest/v1/${table}?${filter}`, {
      method: 'PATCH',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw await postgrestError(res);
    await drain(res);
  };

  const storageFail = async (res: Response): Promise<never> => {
    await drain(res);
    throw new ServiceError('storage', res.status, httpCode(res.status));
  };
  const enc = (path: string) => path.split('/').map(encodeURIComponent).join('/');

  const storage: StorageApi = {
    async listBuckets() {
      const res = await call('storage', '/storage/v1/bucket', { method: 'GET', headers: headers() });
      if (!res.ok) return storageFail(res);
      const rows = await jsonOf<{ id?: unknown; name?: unknown }[]>(res, 'storage');
      return rows.map((b) => (typeof b.id === 'string' ? b.id : typeof b.name === 'string' ? b.name : '')).filter(Boolean);
    },
    async list(bucket, folder, limit = 100, offset = 0) {
      const res = await call('storage', `/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefix: folder.replace(/\/+$/, ''), limit, offset, sortBy: { column: 'name', order: 'asc' } }),
      });
      if (!res.ok) return storageFail(res);
      const rows = await jsonOf<{ name?: unknown; id?: unknown }[]>(res, 'storage');
      return rows
        .filter((r) => typeof r.name === 'string' && r.name !== '')
        .map((r) => ({ name: r.name as string, isFolder: r.id === null || r.id === undefined }));
    },
    async listAll(bucket, folder, max = 1000) {
      const names: string[] = [];
      const root = folder.replace(/\/+$/, '');
      const walk = async (dir: string, depth: number): Promise<boolean> => {
        for (let offset = 0; ; offset += 100) {
          const page = await storage.list(bucket, dir, 100, offset);
          for (const e of page) {
            const full = dir ? `${dir}/${e.name}` : e.name;
            if (e.isFolder) {
              if (depth >= 6) continue;
              if (!(await walk(full, depth + 1))) return false;
            } else {
              names.push(full);
              if (names.length >= max) return false;
            }
          }
          if (page.length < 100) return true;
        }
      };
      const complete = await walk(root, 0);
      return { names, truncated: !complete };
    },
    async remove(bucket, names) {
      if (!names.length) return 0;
      const res = await call('storage', `/storage/v1/object/${encodeURIComponent(bucket)}`, {
        method: 'DELETE',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefixes: names }),
      });
      if (res.status === 404) {
        await drain(res);
        return 0;
      }
      if (!res.ok) return storageFail(res);
      const rows = await jsonOf<unknown[]>(res, 'storage');
      return Array.isArray(rows) ? rows.length : 0;
    },
    async copy(bucket, from, to) {
      const res = await call('storage', '/storage/v1/object/copy', {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ bucketId: bucket, sourceKey: from, destinationKey: to }),
      });
      if (!res.ok) return storageFail(res);
      await drain(res);
    },
    async upload(bucket, path, body, contentType, upsert = true) {
      const res = await call('storage', `/storage/v1/object/${encodeURIComponent(bucket)}/${enc(path)}`, {
        method: 'POST',
        headers: headers({ 'Content-Type': contentType, 'x-upsert': upsert ? 'true' : 'false' }),
        body,
      });
      if (!res.ok) return storageFail(res);
      await drain(res);
    },
    async download(bucket, path) {
      const res = await call('storage', `/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${enc(path)}`, {
        method: 'GET',
        headers: headers(),
      });
      if (res.status === 404 || res.status === 400) {
        await drain(res);
        return null;
      }
      if (!res.ok) return storageFail(res);
      return res.text();
    },
  };

  const auth: AuthAdminApi = {
    async getUser(id) {
      const res = await call('auth', `/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'GET', headers: headers() });
      if (res.status === 404) {
        await drain(res);
        return null;
      }
      if (!res.ok) {
        await drain(res);
        throw new ServiceError('auth', res.status, httpCode(res.status));
      }
      return parseUser(await jsonOf<unknown>(res, 'auth'));
    },
    async deleteUser(id) {
      const res = await call('auth', `/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ should_soft_delete: false }),
      });
      await drain(res);
      if (res.status === 404) return 'not_found';
      if (!res.ok) throw new ServiceError('auth', res.status, httpCode(res.status));
      return 'deleted';
    },
    async userFromToken(accessToken) {
      if (!accessToken || accessToken.length > 4096) return null;
      const res = await call('auth', '/auth/v1/user', {
        method: 'GET',
        headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        await drain(res);
        return null;
      }
      if (!res.ok) {
        await drain(res);
        throw new ServiceError('auth', res.status, httpCode(res.status));
      }
      return parseUser(await jsonOf<unknown>(res, 'auth'));
    },
  };

  return { rpc, select, insert, update, storage, auth };
}
