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
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { CONSENT_LOCALE, consentShownText, type ConsentShownId } from '@scribe/content';
import { sha256Hex } from '../sha256';
import { idempotencyKey } from '../supabase/client';
import { errorCode } from '../supabase/errors.logic';
import { heldAnswers } from './consent-key.logic';
import { buildConsentAct, isNoCandidate, withoutNewFields, type ConsentEnv } from './consent-record';
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

/** What each sheet shows, by step (packages/content consent-shown.ts; the manifest hashes the same words). */
const SHOWN: Record<ConsentStep, ConsentShownId> = { terms: 'terms', age: 'age', sensitive: 'sensitive' };

function consentEnv(): ConsentEnv {
  return {
    sha256: sha256Hex,
    appBuild: Application.nativeBuildVersion,
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    osVersion: Platform.Version,
    platform: platform(),
  };
}

/** Answers waiting for the server, each with one key (consent-key.logic.ts; NS-10-R7). */
const answers = heldAnswers(idempotencyKey);

/**
 * Records one answer. Terms and age record a `terms` accept carrying
 * `age_attested: true`; sensitive-data records accept or decline. An under-18
 * answer is never recorded (the server refuses age_attested false); the
 * caller ends the session instead. A retry of an answer the server has not
 * confirmed resends the same key and client time, so it is one row (NS-10-R7).
 */
export async function recordConsent(
  sb: SupabaseClient,
  step: ConsentStep,
  accepted: boolean,
  method: AuthMethod | null,
  userId: string,
): Promise<void> {
  if ((step === 'terms' || step === 'age') && !accepted) return;
  const document: PolicyDocument = step === 'sensitive' ? 'sensitive-data' : 'terms';
  const version = await currentVersion(sb, document);
  const context =
    step === 'sensitive' ? {} : step === 'terms' ? { auth: method ?? 'unknown', age_attested: true } : { age_attested: true };
  // Everything record_policy_act fingerprints that can differ between two taps (ids and enums only, never text).
  const answerId = JSON.stringify([userId, document, version, accepted, step, context]);
  // One person's answers to one document: a new answer ends any earlier hold (consent-key.logic.ts).
  const group = JSON.stringify([userId, document]);
  const held = answers.hold(group, answerId, () => new Date().toISOString());
  const args = buildConsentAct(
    {
      document,
      version,
      action: accepted ? 'accept' : 'decline',
      method: step === 'sensitive' ? 'consent_sheet' : 'signin_sheet',
      surface: SURFACE[step],
      shownText: consentShownText(SHOWN[step]),
      locale: CONSENT_LOCALE,
      clientRecordedAt: held.recordedAt,
      context,
    },
    consentEnv(),
  );
  const send = (a: Record<string, unknown>) => sb.rpc('record_policy_act', a).setHeader(HEADER_IDEMPOTENCY_KEY, held.key);
  let { error } = await send(args);
  // Shipped before 20261108000000 was applied (FS-21): the old function has no p_app_build. Retry once, old form, same key.
  if (error && isNoCandidate(errorCode(error))) ({ error } = await send(withoutNewFields(args)));
  if (error) throw error;
  answers.confirmed(group);
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
