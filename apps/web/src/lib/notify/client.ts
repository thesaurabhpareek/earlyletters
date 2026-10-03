/**
 * Owner: E2 (back-end). Client helper for the "tell me when it's ready" form.
 * Contract used by components/cta/NotifyForm.tsx (owned by SC6). Keep this signature.
 */
export type NotifyResult = { ok: true } | { ok: false; error: 'invalid' | 'rate_limited' | 'server' };

export async function submitNotify(email: string, extra?: { company?: string }): Promise<NotifyResult> {
  // Stub until E2 lands the API route at /api/notify.
  void extra;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid' };
  return { ok: false, error: 'server' };
}
