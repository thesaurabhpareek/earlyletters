/**
 * The invite token that opened the app, kept in the Keychain before any
 * screen shows (A-REQ-028), so it survives sign-in, consent and an app kill.
 * Deleted after acceptance, after a final error, after "Not now", after an
 * under-18 answer at the gate (F11-REQ-006, lib/age-gate.ts), or after 14
 * days (A-NFR-008). Never in route params, logs or analytics.
 */
import { secureStorage } from '../supabase/secure-storage';
import { createPendingInviteStore } from './pending-invite.store';

const store = createPendingInviteStore(secureStorage);

export const savePendingInvite = store.save;
export const readPendingInvite = store.read;
export const clearPendingInvite = store.clear;
