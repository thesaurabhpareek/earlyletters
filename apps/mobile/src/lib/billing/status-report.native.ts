/**
 * The status report wired to the app (WP-F14-15a): StoreKit through modules/scribe-store,
 * our server through the one Supabase client, device settings for what was sent. Loaded
 * only by a dynamic import behind `capabilities.statusReport` (plan-store startPlus and
 * actions presentPlusStore), so a build with the flag off never loads this file or the
 * server contract it uses (packages/api/test/server-features-off.test.ts).
 *
 * Triggers: the start of the app, every plan change (purchase, renewal, cancel seen at the
 * next open, D-080), the app coming to the foreground, and a sign-in (the signed-out queue,
 * F14-REQ-043), counted once the claim screen is settled (reportingUserOf). Each trigger waits a moment so a burst becomes one flush.
 */
import { AppState } from 'react-native';
import type { StatusReport } from '@scribe/api/server';
import { ScribeStore } from '../../../modules/scribe-store';
import { accountClaimPending, getAuthSnapshot, subscribeAuth } from '../auth/auth-store';
import { mayRun } from '../capabilities';
import { getRemoteConfig } from '../remote';
import { getSetting, setSetting, uuidv7 } from '../store';
import { getSupabaseOrNull } from '../supabase';
import { PLUS_PRODUCT_IDS, SUBSCRIPTION_TERMS_DOC_VERSION } from './config';
import { billingCopy } from './copy';
import { subscribePlan } from './plan-store';
import type { PlanDetails } from './plan.logic';
import { createStatusReporter, type SaltAnswer, type StatusReporter, type StoreAnswer } from './status-report';
import {
  errorCodeFromAnswer,
  REPORT_FUNCTION,
  reportingUserOf,
  SALT_FUNCTION,
  saltFromAnswer,
  STATUS_REPORT_STATE_KEY,
  storedFromAnswer,
  termsVersionOf,
} from './status-report.logic';

const DEBOUNCE_MS = 1_500;

/** The envelope inside a supabase-js FunctionsHttpError, or nothing. */
async function errorBody(error: unknown): Promise<unknown> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  try {
    return ctx && typeof ctx.json === 'function' ? await ctx.json() : null;
  } catch {
    return null;
  }
}

async function fetchSalt(): Promise<SaltAnswer> {
  const client = getSupabaseOrNull();
  if (!client) return { ok: false };
  try {
    const { data, error } = await client.functions.invoke(SALT_FUNCTION, { method: 'GET' });
    const salt = error ? null : saltFromAnswer(data);
    return salt ? { ok: true, salt } : { ok: false };
  } catch {
    return { ok: false };
  }
}

async function sendReport(report: StatusReport, idempotencyKey: string): Promise<StoreAnswer> {
  const client = getSupabaseOrNull();
  if (!client) return { ok: false, code: 'unavailable' };
  try {
    const { data, error } = await client.functions.invoke(REPORT_FUNCTION, {
      method: 'POST',
      body: report,
      headers: { 'idempotency-key': idempotencyKey },
    });
    if (error) return { ok: false, code: errorCodeFromAnswer(await errorBody(error)) };
    const stored = storedFromAnswer(data);
    return stored ? { ok: true, ...stored } : { ok: false, code: 'unavailable' };
  } catch {
    return { ok: false, code: 'network' };
  }
}

let reporter: StatusReporter | null = null;

/** The released account for a report (reportingUserOf), or null. */
function reportingUser(): string | null {
  return reportingUserOf(getAuthSnapshot(), accountClaimPending);
}

function reporterNow(): StatusReporter {
  reporter ??= createStatusReporter({
    mayRun: () => mayRun('statusReport', getRemoteConfig()),
    userId: reportingUser,
    readState: () => getSetting(STATUS_REPORT_STATE_KEY),
    writeState: (v) => setSetting(STATUS_REPORT_STATE_KEY, v),
    fetchSalt,
    nativeRefs: async (salt) => (ScribeStore?.statusReportRefs ? ScribeStore.statusReportRefs(salt, [...PLUS_PRODUCT_IDS]) : []),
    sendReport,
    newKey: () => uuidv7(),
    now: () => new Date().toISOString(),
    termsVersion: () => termsVersionOf(SUBSCRIPTION_TERMS_DOC_VERSION, billingCopy.store),
  });
  return reporter;
}

let timer: ReturnType<typeof setTimeout> | null = null;
function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void reporterNow().flush();
  }, DEBOUNCE_MS);
}

/** Starts the report triggers. Returns a stop function. Never throws. */
export function startStatusReport(): () => void {
  const stops: Array<() => void> = [];
  try {
    stops.push(subscribePlan(schedule));
    // subscribeAuth also fires when the claim screen is confirmed, so a report waiting for it goes then.
    let wasReady = reportingUser() !== null;
    stops.push(subscribeAuth(() => {
      const ready = reportingUser() !== null;
      if (ready && !wasReady) schedule();
      wasReady = ready;
    }));
    const fg = AppState.addEventListener('change', (s) => {
      if (s === 'active') schedule();
    });
    stops.push(() => fg.remove());
    schedule();
  } catch {
    // A missing native piece (web preview): nothing to report.
  }
  return () => {
    for (const s of stops) s();
    if (timer) clearTimeout(timer);
    timer = null;
  };
}

/** At a purchase through our store sheet (presentPlusStore): keep the D-081 consent facts for the first report. */
export function recordPurchaseConsent(details: Pick<PlanDetails, 'productId' | 'originalPurchasedAt'>): void {
  try {
    reporterNow().recordPurchase({ productId: details.productId, originalPurchasedAt: details.originalPurchasedAt });
    schedule();
  } catch {
    // Device settings unavailable: no consent facts this time; the status still reports.
  }
}
