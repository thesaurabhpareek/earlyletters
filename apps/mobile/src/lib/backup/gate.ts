/**
 * The only way into backup from the rest of the app (F08-REQ-041;
 * WP-F08-B5c). Everything else in `lib/backup` and the native `ScribeKeys`
 * module is loaded on the first call here, and only in a build made with
 * `capabilities.backup` on. With the flag off (every profile today), this file
 * imports nothing but the capabilities switch, the native module is never
 * looked up, no Keychain item is touched and no request is made.
 * `test/backup-gate.test.ts` holds the line: no file outside `lib/backup`
 * imports any backup file but this one, and this one has no static import of
 * them.
 */
import { capabilities } from '../capabilities';

type Runtime = typeof import('./runtime');

let runtime: Runtime | null = null;

/** The runtime, loaded on first use. Null in a build without backup. */
export function loadBackup(): Runtime | null {
  if (!capabilities.backup) return null;
  if (!runtime) runtime = require('./runtime') as Runtime;
  return runtime;
}

/** Whether this build carries backup at all (the Settings row is shown only then). */
export function backupInBuild(): boolean {
  return capabilities.backup;
}

/** Root layout: starts backup once, after the first frame. A no-op without the flag. */
export function startBackup(): void {
  loadBackup()?.startBackupRuntime();
}

/** Tests only: forget the loaded runtime. */
export function resetBackupGateForTests(): void {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (!env?.VITEST) throw new Error('resetBackupGateForTests is for tests only');
  runtime = null;
}
