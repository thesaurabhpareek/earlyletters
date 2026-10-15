/**
 * Wires the letter ledger to the iOS Keychain through the same wrapper the
 * sign-in session uses (lib/supabase/secure-storage.ts, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`).
 * Imported once by lib/billing/index.ts. Kept apart from letter-ledger.ts so that
 * file has no React Native import and can be tested in Node.
 */
import { secureStorage } from '../supabase/secure-storage';
import { configureLedgerStorage } from './letter-ledger';

configureLedgerStorage(secureStorage);
