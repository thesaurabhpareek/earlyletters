/**
 * Consent after sign-in (PRD A F3.4, PRD-REQ-002, LEGAL-REQ-001, -002, -006).
 *
 * The server is the authority: `my_sync_gate()` says whether Terms (with the
 * age attestation) and sensitive-data consent are current, and every content
 * write raises SCCON until they are (migration 20261003000000). The app shows
 * the sheets that are missing and records each answer with
 * `record_policy_act`, an append-only legal record.
 *
 * Age: the 18+ entry gate on this phone already asked (PRD-REQ-019). The Terms
 * sheet carries the line "you confirm you are 18 or older", so its acceptance
 * records `age_attested: true` (TDD 01 3.3: derived from the gate, never a
 * stored age or time).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { errorCode } from '../supabase/errors.logic';
import type { AuthMethod, ConsentStep, SyncGate } from './machine.logic';

type PolicyDocument = 'terms' | 'sensitive-data';

interface GateRow {
  terms_current: boolean;
  age_attested: boolean;
  sensitive_data: boolean;
  content_allowed: boolean;
}

export async function loadSyncGate(sb: SupabaseClient): Promise<{ gate: SyncGate; sensitiveDeclined: boolean }> {
  const { data, error } = await sb.rpc('my_sync_gate');
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as GateRow | undefined;
  if (!row) throw Object.assign(new Error('gate_empty'), { code: 'P0002' });
  const gate: SyncGate = {
    termsCurrent: !!row.terms_current,
    ageAttested: !!row.age_attested,
    sensitiveData: !!row.sensitive_data,
    contentAllowed: !!row.content_allowed,
  };
  let sensitiveDeclined = false;
  if (!gate.sensitiveData) {
    // my_policy_state: the caller's latest act per document (security_invoker view).
    const st = await sb.from('my_policy_state').select('document, action').eq('document', 'sensitive-data').limit(1);
    const action = (st.data?.[0] as { action?: string } | undefined)?.action;
    sensitiveDeclined = action === 'decline' || action === 'withdraw';
  }
  return { gate, sensitiveDeclined };
}

/** The newest version offered to new people right now (what record_policy_act accepts). */
async function currentVersion(sb: SupabaseClient, document: PolicyDocument): Promise<string> {
  if (document === 'terms') {
    const needed = await sb.rpc('policy_actions_needed');
    const row = (needed.data as { document: string; version: string }[] | null)?.find((r) => r.document === 'terms');
    if (row) return row.version;
  }
  const { data, error } = await sb
    .from('policy_versions')
    .select('version, major, minor, patch')
    .eq('document', document)
    .lte('new_users_from', new Date().toISOString())
    .order('major', { ascending: false })
    .order('minor', { ascending: false })
    .order('patch', { ascending: false })
    .limit(1);
  if (error) throw error;
  const v = (data?.[0] as { version?: string } | undefined)?.version;
  // No published version: the founder has not run APPLY.md step 8.2 yet.
  if (!v) throw Object.assign(new Error('policy_version_missing'), { code: 'consent_unavailable' });
  return v;
}

const SURFACE: Record<ConsentStep, string> = {
  terms: 'auth.consent.terms',
  age: 'auth.consent.age',
  sensitive: 'auth.consent.sensitive',
};

function platform(): 'ios' | 'android' | 'web' {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
}

/**
 * Records one answer. Terms and age record a `terms` accept carrying
 * `age_attested: true`; sensitive-data records accept or decline. An under-18
 * answer is never recorded (the server refuses age_attested false); the
 * caller ends the session instead.
 */
export async function recordConsent(
  sb: SupabaseClient,
  step: ConsentStep,
  accepted: boolean,
  method: AuthMethod | null,
): Promise<void> {
  if ((step === 'terms' || step === 'age') && !accepted) return;
  const document: PolicyDocument = step === 'sensitive' ? 'sensitive-data' : 'terms';
  const version = await currentVersion(sb, document);
  const context =
    step === 'sensitive' ? {} : step === 'terms' ? { auth: method ?? 'unknown', age_attested: true } : { age_attested: true };
  const { error } = await sb.rpc('record_policy_act', {
    p_document: document,
    p_version: version,
    p_action: accepted ? 'accept' : 'decline',
    p_method: step === 'sensitive' ? 'consent_sheet' : 'signin_sheet',
    p_surface: SURFACE[step],
    p_app_version: (Constants.expoConfig?.version ?? '0.0.0').slice(0, 32),
    p_platform: platform(),
    // The sheets are in English at v1.0 (BRIEF decision 6).
    p_locale: 'en',
    p_client_recorded_at: new Date().toISOString(),
    p_context: context,
  });
  if (error) throw error;
}

/** True when this error means "consent is missing" (pause and show the sheets, never drop a write). */
export function isConsentMissing(e: unknown): boolean {
  return errorCode(e) === 'SCCON';
}

/** Writes the name Apple shared at first sign-in, once Terms are accepted. */
export async function saveDisplayName(sb: SupabaseClient, userId: string, name: string): Promise<void> {
  const { error } = await sb.from('profiles').update({ display_name: name.slice(0, 60) }).eq('id', userId);
  if (error) throw error;
}

/** "No book here yet" (PRD A F4): the account belongs to no book on the server. */
export async function accountHasBooks(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { count, error } = await sb.from('child_members').select('child_id', { count: 'exact', head: true }).eq('profile_id', userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
