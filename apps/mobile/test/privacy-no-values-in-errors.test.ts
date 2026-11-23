/// <reference types="node" />
/**
 * No child name, date or stored value can reach a crash reporter or a log through an error (PRIV-R21,
 * TDD 01 4.2 rule 2). Four places that used to carry one: the export check's problems, the zip reader's
 * message, MigrationError's cause, and a server's `detail` stored as a job's lastError. Fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackupServerError, safeErrorCode, safeErrorDetail, storedLastError } from '../src/lib/backup/contract';
import { createEscrowClient, type FetchLike } from '../src/lib/backup/wire';
import { MigrationError, migrate, type Migration } from '../src/lib/db/migrations';
import { ExportCheckFailedError, PROBLEM_CODES, ZipFormatError, readCentralDirectory, verifyExport, type RandomAccess } from '../src/lib/export/verify';
import type { Manifest } from '../src/lib/export/schema';
import { nodeDb } from './helpers/node-db';

const NAME = 'Asha';
const BIRTHDAY = '2025-04-12';

afterEach(() => vi.restoreAllMocks());

/** Everything an error can show a crash reporter or a logger. */
function everything(e: Error): string {
  return [e.message, e.stack ?? '', JSON.stringify(e, Object.getOwnPropertyNames(e)), String(e), (e as { cause?: unknown }).cause === undefined ? '' : 'HAS_CAUSE'].join('\n');
}

const sha = async (b: Uint8Array) => `h${b.length}`;
const reader = (bytes: Uint8Array): RandomAccess => ({ size: bytes.length, read: (o, n) => bytes.subarray(o, o + n) });
const manifestOf = (files: { path: string; bytes: number; sha256: string }[]) => ({ files: files.map((f) => ({ ...f, media_type: 'text/plain' })) }) as unknown as Manifest;

/** A stored (level 0) zip whose folder is named after the child, as pack.ts writes it. */
function asZip() {
  return zipSync(
    {
      [`${NAME}/letters.txt`]: [new TextEncoder().encode('one'), { level: 0 }],
      [`${NAME}/extra.txt`]: [new TextEncoder().encode('two'), { level: 0 }],
      'manifest.json': [new TextEncoder().encode('{}'), { level: 0 }],
      'manifest.sha256': [new TextEncoder().encode('abc'), { level: 0 }],
    },
    { level: 0 },
  );
}

describe('export check: problems are fixed codes and counts', () => {
  it('never holds a child name, a path or a date, and only codes from the closed list', async () => {
    const manifest = manifestOf([
      { path: `${NAME}/letters.txt`, bytes: 99, sha256: 'wrong' }, // hash
      { path: `${NAME}/gone-${BIRTHDAY}.txt`, bytes: 1, sha256: 'x' }, // missing
    ]);
    const r = await verifyExport(reader(asZip()), manifest, 'abc', sha);
    expect(r.ok).toBe(false);
    expect(r.problems.sort()).toEqual(['extra', 'hash', 'missing']);
    expect(r.problemCounts).toEqual({ hash: 2, extra: 1, missing: 1 }); // hash: the letters file and manifest.json (sha given is not its own)
    for (const p of r.problems) expect(PROBLEM_CODES).toContain(p);
    expect(JSON.stringify(r)).not.toMatch(new RegExp(`${NAME}|${BIRTHDAY}|letters|\\.txt`));
  });

  it('ExportCheckFailedError carries those codes, a fixed message and a stack without the name', async () => {
    const r = await verifyExport(reader(asZip()), manifestOf([{ path: `${NAME}/letters.txt`, bytes: 99, sha256: 'wrong' }]), 'abc', sha);
    const err = new ExportCheckFailedError(r.problems);
    expect(err.message).toBe('export_check_failed');
    expect(err.problems).toEqual(r.problems);
    expect(everything(err)).not.toContain(NAME);
    expect(everything(err)).not.toContain('HAS_CAUSE');
  });

  it('drops anything that is not a known code, whatever a caller passes', () => {
    const err = new ExportCheckFailedError(['hash', `missing:${NAME}/letters.txt`, `${NAME}`, 'format:unreadable']);
    expect(err.problems).toEqual(['hash', 'format:unreadable']);
    expect(everything(err)).not.toContain(NAME);
  });

  it('writes nothing to a logger and does not touch analytics', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const r = await verifyExport(reader(asZip()), manifestOf([{ path: `${NAME}/letters.txt`, bytes: 99, sha256: 'wrong' }]), 'abc', sha);
    void new ExportCheckFailedError(r.problems);
    for (const s of spies) expect(s).not.toHaveBeenCalled();
    // The failing path cannot reach track or a logger: neither module calls one. device.ts reads one
    // analytics constant (a storage key list) and nothing else from it.
    const strip = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(strip('src/lib/export/verify.ts')).not.toMatch(/analytics|\btrack[A-Z(]|console\.|logger|Sentry/);
    const device = strip('src/lib/export/device.ts');
    expect(device).not.toMatch(/\btrack[A-Z(]|console\.|logger|Sentry|lib\/analytics/);
    expect([...device.matchAll(/from '@scribe\/analytics'/g)]).toHaveLength(1);
    expect(device).toMatch(/import \{ STORAGE_KEYS as ANALYTICS_KEYS \} from '@scribe\/analytics'/);
  });
});

describe('export check: the zip reader text is never passed on', () => {
  const leaky = (after: number): RandomAccess => {
    const z = asZip();
    let calls = 0;
    return {
      size: z.length,
      read: (o, n) => {
        if (++calls > after) throw new Error(`ENOENT: no such file ${NAME}/audio.m4a born ${BIRTHDAY}`);
        return z.subarray(o, o + n);
      },
    };
  };

  it('a reader that fails reading the directory becomes format:unreadable', async () => {
    const r = await verifyExport(leaky(0), manifestOf([]), 'abc', sha);
    expect(r).toMatchObject({ ok: false, problems: ['format:unreadable'], problemCounts: { 'format:unreadable': 1 } });
    expect(JSON.stringify(r)).not.toMatch(new RegExp(`${NAME}|${BIRTHDAY}|ENOENT`));
  });

  it('a reader that fails reading one entry becomes format:unreadable, counted, with no path', async () => {
    const r = await verifyExport(leaky(2), manifestOf([]), 'abc', sha);
    expect(r.ok).toBe(false);
    expect(r.problems).toContain('format:unreadable');
    expect(JSON.stringify(r)).not.toMatch(new RegExp(`${NAME}|${BIRTHDAY}|ENOENT`));
  });

  it('a malformed zip still gives its own fixed code', async () => {
    const r = await verifyExport(reader(new Uint8Array(40)), manifestOf([]), 'abc', sha);
    expect(r.problems).toEqual(['format:no_end_record']);
    await expect(readCentralDirectory(reader(new Uint8Array(40)))).rejects.toBeInstanceOf(ZipFormatError);
  });
});

describe('migration failure: a code and a version, no cause', () => {
  it('does not keep or serialise the SQLite error that quoted a value', () => {
    const { db, close } = nodeDb();
    const boom: Migration[] = [
      {
        version: 1,
        name: 'boom',
        up: () => {
          throw new Error(`UNIQUE constraint failed: children.name: ${NAME} ${BIRTHDAY}`);
        },
      },
    ];
    let caught: unknown;
    try {
      migrate(db, { now: '2026-10-03T09:00:00.000Z', newId: () => 'x' }, boom);
    } catch (e) {
      caught = e;
    }
    close();
    expect(caught).toBeInstanceOf(MigrationError);
    const err = caught as MigrationError;
    expect(err.version).toBe(1);
    expect(err.message).toBe('local_db_migration_failed:1');
    expect(err.cause).toBeUndefined();
    expect('cause' in err).toBe(false);
    expect(everything(err)).not.toMatch(new RegExp(`${NAME}|${BIRTHDAY}|UNIQUE`));
  });
});

describe('server detail: only the contract keys are kept', () => {
  const envelope = (error: unknown) => {
    const fetch: FetchLike = async () => ({ ok: false, status: 400, json: async () => ({ ok: false, error }) });
    return createEscrowClient({ baseUrl: 'https://escrow.example.test', accessToken: async () => 't', fetch, idempotency: { header: 'Idempotency-Key', newId: () => 'i' } });
  };
  const DEVICE = '22222222-2222-4222-8222-222222222222';

  it('a free-text detail or code from the server is dropped, not stored in the error', async () => {
    const e = (await envelope({ code: `bad for ${NAME}`, retryable: false, detail: `${NAME} born ${BIRTHDAY}` }).request(DEVICE).catch((x) => x)) as BackupServerError;
    expect(e).toBeInstanceOf(BackupServerError);
    expect(e.detail).toBeNull();
    expect(e.code).toBe('unknown');
    expect(JSON.stringify(e, Object.getOwnPropertyNames(e))).not.toMatch(new RegExp(`${NAME}|${BIRTHDAY}`));
  });

  it('a contract detail is kept', async () => {
    const e = (await envelope({ code: 'reauth_required', retryable: false, detail: 'step_up_required' }).request(DEVICE).catch((x) => x)) as BackupServerError;
    expect([e.code, e.detail]).toEqual(['reauth_required', 'step_up_required']);
  });

  it('storedLastError keeps only codes and details the contract names', () => {
    expect(storedLastError('P0002:object')).toBe('P0002:object');
    expect(storedLastError('22023:size')).toBe('22023:size');
    expect(storedLastError('P0002:none')).toBe('P0002:none');
    expect(storedLastError('HTTP503')).toBe('HTTP503');
    expect(storedLastError('missing')).toBe('missing');
    expect(storedLastError('')).toBe('network');
    expect(storedLastError('P0002:Asha was here')).toBe('P0002');
    expect(storedLastError(`${NAME} ${BIRTHDAY}`)).toBe('unknown');
    expect(storedLastError(`${NAME}:key`)).toBe('unknown:key');
    expect(storedLastError(42)).toBe('error');
    expect(safeErrorDetail(`${NAME}`)).toBeNull();
    expect(safeErrorCode(undefined)).toBe('unknown');
  });
});
