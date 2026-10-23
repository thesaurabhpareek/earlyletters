/**
 * The D-080 status report sender (WP-F14-15a). No React Native here: every outside call is
 * a dependency, so test/billing-status-report.test.ts runs it in Node with fakes. The real
 * dependencies are assembled in status-report.native.ts, which plan-store and actions load
 * with a dynamic import only when `capabilities.statusReport` is on.
 *
 * One flush:
 *   1. `mayRun()`: the build flag (EXPO_PUBLIC_SERVER_FEATURES and EXPO_PUBLIC_STATUS_REPORT)
 *      and the remote `statusReport` kill switch. Off: nothing is sent and nothing is asked
 *      of the server or StoreKit. Consent facts recorded at a purchase still wait on the
 *      phone, so a purchase made while the switch is on keeps its D-081 facts for the first
 *      report after it clears (the module is loaded only when the build flag is on).
 *   2. A signed-in, ready account that may report for this phone (reportingUserOf). Signed
 *      out: nothing is sent; consent facts recorded at a purchase wait on the phone until
 *      sign-in (F14-REQ-043).
 *   3. This account's salt (GET salt, cached in memory for the session, never stored).
 *   4. The native module turns the salt into a `sub_ref` per own purchase.
 *   5. One POST per purchase whose status changed or whose consent facts wait, each with a
 *      fresh idempotency key. A retry after a retryable failure sends the same body under the
 *      same key while this process runs, so the server answers a duplicate from its stored
 *      result; after a restart the report is planned again under a new key. A refused report
 *      (bad_request) is marked so its status is not resent; a retryable failure stops the
 *      flush until the next trigger, at most once a minute.
 *
 * Nothing is logged: no `sub_ref`, salt, date, plan or account id goes to any log,
 * analytics event or crash report (F14-REQ-014, CLAUDE.md privacy rules).
 */
import type { StatusReport } from '@scribe/api/server';
import {
  addPendingConsent,
  afterStored,
  parseReportState,
  planReports,
  prunePending,
  sanitizeRefs,
  serializeReportState,
  type ReportState,
} from './status-report.logic';

export type SaltAnswer = { ok: true; salt: string } | { ok: false };
export type StoreAnswer =
  | { ok: true; stored: 'created' | 'updated' | 'unchanged' | 'older'; consent: 'recorded' | 'already_recorded' | 'none' }
  | { ok: false; code: string };

export interface ReporterDeps {
  /** Build flag and kill switch (capabilities.mayRun('statusReport', remote config)). */
  mayRun(): boolean;
  /** The account a report goes to: auth state `ready` with the claim settled (status-report.logic reportingUserOf), or null. */
  userId(): string | null;
  /** The account that owns this phone's letters (store currentUserId), or null before the first claim. */
  phoneOwner(): string | null;
  readState(): string | null;
  writeState(value: string): void;
  fetchSalt(): Promise<SaltAnswer>;
  /** Raw answer of the native `statusReportRefs(salt, productIds)`; sanitized here. */
  nativeRefs(salt: string): Promise<unknown>;
  sendReport(report: StatusReport, idempotencyKey: string): Promise<StoreAnswer>;
  newKey(): string;
  now(): string;
  /** The D-081 Subscription Terms version shown in this build (termsVersionOf). */
  termsVersion(): string;
}

export type FlushOutcome = 'off' | 'signed_out' | 'nothing' | 'sent' | 'retry_later' | 'busy';

/** After a retryable failure, the next attempt waits at least this long (ENDPOINTS statusReport: 30 an hour). */
export const RETRY_AFTER_MS = 60_000;

/** Error codes that will never succeed for this body: mark it and move on rather than loop. */
const PERMANENT = new Set(['bad_request', 'payload_too_large', 'idempotency_conflict', 'not_found']);

export interface StatusReporter {
  flush(): Promise<FlushOutcome>;
  /** At a purchase through our store sheet: keep the consent facts until the first report carries them. */
  recordPurchase(purchase: { productId: string | null; originalPurchasedAt: string | null }): void;
}

export function createStatusReporter(deps: ReporterDeps): StatusReporter {
  let inflight: Promise<FlushOutcome> | null = null;
  let salt: { owner: string; value: string } | null = null;
  let notBefore = 0;
  /** The last attempt per purchase that failed retryably: retried with the same body and key. */
  const retries = new Map<string, { owner: string; fingerprint: string; consent: string; report: StatusReport; key: string }>();

  const read = (): ReportState => {
    try {
      return parseReportState(deps.readState());
    } catch {
      return parseReportState(null);
    }
  };
  const write = (s: ReportState) => {
    try {
      deps.writeState(serializeReportState(s));
    } catch {
      // Device settings unavailable: the next flush plans the same reports again.
    }
  };

  async function run(): Promise<FlushOutcome> {
    if (!deps.mayRun()) return 'off';
    const owner = deps.userId();
    if (!owner) return 'signed_out';
    const now = deps.now();
    if (Date.parse(now) < notBefore) return 'retry_later';
    let state = prunePending(read(), now);

    if (!salt || salt.owner !== owner) {
      const answer = await deps.fetchSalt().catch((): SaltAnswer => ({ ok: false }));
      if (!answer.ok) {
        notBefore = Date.parse(now) + RETRY_AFTER_MS;
        return 'retry_later';
      }
      salt = { owner, value: answer.salt };
    }
    const items = sanitizeRefs(await deps.nativeRefs(salt.value).catch(() => []));
    const planned = planReports(items, state, { owner, now });
    if (planned.length === 0) {
      if (state.owner !== owner) write({ ...state, owner, sent: {}, consented: [] });
      return 'nothing';
    }
    for (const planned1 of planned) {
      const consent = JSON.stringify(planned1.report.consent ?? null);
      const prev = retries.get(planned1.key);
      const again = prev && prev.owner === owner && prev.fingerprint === planned1.fingerprint && prev.consent === consent;
      const p = again ? { ...planned1, report: prev.report } : planned1;
      const key = again ? prev.key : deps.newKey();
      retries.delete(planned1.key);
      const answer = await deps.sendReport(p.report, key).catch((): StoreAnswer => ({ ok: false, code: 'network' }));
      if (answer.ok) {
        state = afterStored(state, owner, p, answer.consent);
        write(state);
      } else if (PERMANENT.has(answer.code)) {
        // This body will never be stored: remember the status so it is not resent, keep any consent facts waiting.
        state = afterStored(state, owner, { ...p, report: { ...p.report, consent: undefined } }, 'none');
        write(state);
      } else {
        retries.set(planned1.key, { owner, fingerprint: p.fingerprint, consent, report: p.report, key });
        notBefore = Date.parse(now) + RETRY_AFTER_MS;
        return 'retry_later';
      }
    }
    notBefore = 0;
    return 'sent';
  }

  return {
    flush(): Promise<FlushOutcome> {
      if (inflight) return inflight;
      inflight = run()
        .catch((): FlushOutcome => 'retry_later')
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    recordPurchase(purchase) {
      // Not gated on mayRun(): the facts exist only at this moment and stay on the phone; the
      // kill switch stops sending (flush), never the record of what this phone showed.
      if (!purchase.productId || !purchase.originalPurchasedAt) return;
      const now = deps.now();
      let owner: string | null = null;
      try {
        owner = deps.phoneOwner();
      } catch {
        owner = null;
      }
      write(addPendingConsent(read(), {
        productId: purchase.productId,
        originalPurchasedAt: purchase.originalPurchasedAt,
        termsVersion: deps.termsVersion(),
        shownAt: now,
        queuedAt: now,
        owner,
      }));
    },
  };
}
