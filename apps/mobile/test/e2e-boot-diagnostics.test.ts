/**
 * BL-464. The web e2e `app` fixture installs `installBootDiagnostics` so the next `local_db_migration_failed:1`
 * flake names its cause. MigrationError keeps a code only, so the script watches `Error` being constructed.
 * Run here in a bare sandbox (no browser), the way Playwright runs it in a page.
 */
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { BOOT_DIAG_PREFIX, installBootDiagnostics } from '../e2e-web/support/boot-diagnostics';

type Listener = (ev: unknown) => void;
function page() {
  const logs: string[] = [];
  const errors: string[] = [];
  const listeners: Record<string, Listener> = {};
  const g: Record<string, unknown> = {
    console: { log: (s: string) => logs.push(s), error: (s: string) => errors.push(s) },
    addEventListener: (t: string, fn: Listener) => (listeners[t] = fn),
  };
  g.globalThis = g;
  g.Error = Error;
  const ctx = runInNewContext(`(${installBootDiagnostics.toString()})(); this`, g) as { Error: ErrorConstructor };
  return { logs, errors, listeners, E: (g.Error as ErrorConstructor) ?? ctx.Error };
}

describe('[BL-464] boot diagnostics for the web e2e', () => {
  it('logs a database error built by the sqlite channel, with console.log and the prefix', () => {
    const p = page();
    new p.E('Sync operation timeout');
    new p.E('database is locked');
    new p.E('Error code 14: unable to open database file'); // the OPFS pool had no file for a journal (BL-464)
    expect(p.logs).toEqual([
      `${BOOT_DIAG_PREFIX}Error: Sync operation timeout`,
      `${BOOT_DIAG_PREFIX}Error: database is locked`,
      `${BOOT_DIAG_PREFIX}Error: Error code 14: unable to open database file`,
    ]);
    expect(p.errors).toEqual([]);
  });

  it('stays quiet for every other error and keeps the error working', () => {
    const p = page();
    const e = new p.E('Cannot read properties of undefined');
    expect(p.logs).toEqual([]);
    expect(e).toBeInstanceOf(Error);
    class Mine extends p.E {}
    expect(new Mine('x').message).toBe('x');
  });

  it('cuts a long message and logs error.cause and rejection.cause when a page has them', () => {
    const p = page();
    new p.E('sqlite ' + 'x'.repeat(400));
    expect(p.logs[0].length).toBeLessThanOrEqual(BOOT_DIAG_PREFIX.length + 'Error: '.length + 160);
    p.listeners.error({ error: { cause: new Error('disk I/O error') } });
    p.listeners.unhandledrejection({ reason: { cause: 'no such table: entries' } });
    p.listeners.unhandledrejection({ reason: { message: 'opfs handle busy' } });
    expect(p.logs.slice(1)).toEqual([
      `${BOOT_DIAG_PREFIX}error.cause: disk I/O error`,
      `${BOOT_DIAG_PREFIX}rejection.cause: no such table: entries`,
      `${BOOT_DIAG_PREFIX}rejection: opfs handle busy`,
    ]);
  });

  it('is self-contained: it names no import, so Playwright can serialise it into a page', () => {
    const src = installBootDiagnostics.toString();
    expect(src).not.toMatch(/\brequire\(|\bimport\b|BOOT_DIAG_PREFIX/);
    expect(src).toContain(BOOT_DIAG_PREFIX);
  });
});
