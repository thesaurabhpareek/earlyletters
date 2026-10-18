/**
 * The smoke check's only database contact (RA-07-06): one psql process per
 * statement, inside `begin transaction read only` with a 5 second statement
 * timeout. Connection settings travel as PG* variables (never argv), the
 * parent's environment is not passed on, and psql's own messages are never
 * shown: `VERBOSITY=sqlstate` reduces an error to its SQLSTATE, which is all
 * this reads from stderr. A spawn that throws (a bad env value, for example)
 * resolves as an error without its message. Needs the PostgreSQL client (`psql`) on PATH.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import type { SqlOutcome, SqlRunner } from './smoke.ts';
import type { DbTarget } from './target.ts';

const OUT_CAP = 256 * 1024;

export function psqlRunner(db: DbTarget, opts: { timeoutMs?: number; bin?: string } = {}): SqlRunner {
  return (sql: string) =>
    new Promise<SqlOutcome>((resolve) => {
      const args = ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate',
        '-c', 'begin transaction read only', '-c', "set local statement_timeout = '5s'", '-c', sql, '-c', 'rollback'];
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(opts.bin ?? 'psql', args, {
          env: { PATH: process.env.PATH ?? '/usr/bin:/bin', ...db.env, PGCONNECT_TIMEOUT: '10', PGAPPNAME: 'scribe-staging-smoke' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        // spawn throws synchronously on a bad argument or env value, with that value in its message: never shown.
        return resolve({ ok: false, kind: 'error' });
      }
      let out = '';
      let err = '';
      let settled = false;
      const done = (o: SqlOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(o);
      };
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        done({ ok: false, kind: 'timeout' });
      }, opts.timeoutMs ?? 30_000);
      child.stdout!.setEncoding('utf8');
      child.stderr!.setEncoding('utf8');
      child.stdout!.on('data', (s: string) => {
        if (out.length < OUT_CAP) out += s;
      });
      child.stderr!.on('data', (s: string) => {
        if (err.length < 8192) err += s;
      });
      child.on('error', (e: Error & { code?: string }) => done({ ok: false, kind: e.code === 'ENOENT' ? 'no_psql' : 'error' }));
      child.on('close', (code: number | null) => {
        if (code === 0) {
          const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
          return done(lines.length ? { ok: true, text: lines[lines.length - 1] } : { ok: false, kind: 'error' });
        }
        if (code === 2) return done({ ok: false, kind: 'connect' });
        const state = /ERROR:\s+([0-9A-Z]{5})\b/.exec(err)?.[1];
        done(state ? { ok: false, kind: 'sql', sqlstate: state } : { ok: false, kind: 'error' });
      });
    });
}
