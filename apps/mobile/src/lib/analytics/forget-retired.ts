/**
 * Forget one retired analytics id on the server (BL-1252 phone half, ER-A04 and ER-A17). This is the `forgetRetiredId`
 * the analytics client asks for when the list of retired ids is over its cap. The id leaves the phone only when this
 * returns true, so every doubt answers false:
 *  - no signed-in session: the function needs a real session, so the id stays and a later call tries again;
 *  - any error, a timeout or a thrown exception: the id stays;
 *  - the answer is not the contract's 202 shape: the id stays.
 *
 * Nothing here is logged, and the id goes nowhere but this one call (contract: packages/api analytics-forget.ts).
 * Pure: the client and the key maker are passed in, so no React Native and no network in tests.
 */
import { ANALYTICS_FORGET_FUNCTION, parseAnalyticsForgetRequest, type AnalyticsForgetRequest } from '@scribe/api';

export interface ForgetClient {
  auth: { getSession(): Promise<{ data: { session: { user?: { is_anonymous?: boolean } } | null } }> };
  functions: {
    invoke(name: string, options: { method: 'POST'; body: AnalyticsForgetRequest; headers: Record<string, string> }): Promise<{ data?: unknown; error?: unknown }>;
  };
}

export interface ForgetRetiredDeps {
  /** The Supabase client, or null when the build has none. */
  client: () => Promise<ForgetClient | null> | ForgetClient | null;
  idempotencyKey: () => string;
}

export function makeForgetRetiredId(deps: ForgetRetiredDeps): (id: string) => Promise<boolean> {
  return async (id) => {
    try {
      const request = parseAnalyticsForgetRequest({ ids: [id], reason: 'retired_id' });
      if (!request) return false;
      const client = await deps.client();
      if (!client) return false;
      const { data } = await client.auth.getSession();
      if (!data.session || data.session.user?.is_anonymous === true) return false;
      const { data: answer, error } = await client.functions.invoke(ANALYTICS_FORGET_FUNCTION, {
        method: 'POST',
        body: request,
        headers: { 'idempotency-key': deps.idempotencyKey() },
      });
      if (error) return false;
      const accepted = (answer as { data?: { accepted?: unknown } } | null)?.data?.accepted;
      return typeof accepted === 'number' && accepted >= 1;
    } catch {
      return false;
    }
  };
}
