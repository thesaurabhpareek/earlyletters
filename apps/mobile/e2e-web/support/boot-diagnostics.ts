/**
 * BL-464. Names the cause of a boot failure the app itself hides.
 *
 * `MigrationError` carries only `local_db_migration_failed:<n>` and drops the error it caught, not even as `cause`
 * (TDD 01 4.2 rule 2: SQLite messages can quote stored values). So `pageerror` for a failed web boot names no cause,
 * and a page-side `error.cause` listener has nothing to read. The error that failed is built by expo-sqlite's web
 * channel (`new Error(<worker message>)`, or `new Error('Sync operation timeout')`) before the app catches it, so this
 * script watches `Error` being constructed and logs the ones that look like a database or storage failure.
 *
 * Test only: it is installed by the `app` fixture in a browser that holds the fictional family "Asha", and nothing
 * under apps/mobile/src loads it. It logs with `console.log`, never `console.error`, so the fixture's own
 * console-error check does not trip on the diagnostic itself. A message is cut at 160 characters.
 *
 * "unable to open database file" is the SQLite text when the OPFS pool has no file left for a journal (the cause
 * BL-464 found; web-preview/sqlite-pool-capacity.js). It names no stored value. The pool VFS's own "cannot create file" is
 * not watched: it is thrown and caught inside the sqlite worker (wa-sqlite AccessHandlePoolVFS jOpen, which returns
 * SQLITE_CANTOPEN), and this script runs in the page only, so that text never reaches an `Error` built here.
 *
 * It must stay self-contained (Playwright serialises the function into the page) and takes no arguments.
 */
export const BOOT_DIAG_PREFIX = '[e2e-boot] ';

export function installBootDiagnostics(): void {
  const prefix = '[e2e-boot] ';
  const g = globalThis as unknown as {
    Error: ErrorConstructor;
    addEventListener?: (type: string, fn: (e: never) => void) => void;
  };
  const watch = /sync operation|unable to open database|database is locked|\blocked\b|sqlite|no such (table|column)|disk i\/o|\bbusy\b|access handle|NoModificationAllowed|QuotaExceeded|opfs|out of memory|wasm/i;
  const say = (kind: string, m: unknown) => console.log(`${prefix}${kind}: ${String(m).slice(0, 160)}`);
  const Native = g.Error;
  g.Error = new Proxy(Native, {
    construct(target, args, newTarget) {
      const e = Reflect.construct(target, args, newTarget);
      const m = String(args[0] ?? '');
      if (watch.test(m)) say('Error', m);
      return e;
    },
  });
  const cause = (c: unknown) => (c && typeof c === 'object' && 'message' in c ? (c as { message: unknown }).message : c);
  g.addEventListener?.('error', ((ev: { error?: { cause?: unknown } }) => {
    if (ev.error?.cause != null) say('error.cause', cause(ev.error.cause));
  }) as never);
  g.addEventListener?.('unhandledrejection', ((ev: { reason?: { cause?: unknown; message?: unknown } }) => {
    if (ev.reason?.cause != null) say('rejection.cause', cause(ev.reason.cause));
    else if (ev.reason?.message != null && watch.test(String(ev.reason.message))) say('rejection', ev.reason.message);
  }) as never);
}
