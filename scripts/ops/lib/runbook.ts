/**
 * Break-glass discipline (LEGAL-REQ-025, TDD 05 X-07): every script that reads
 * or changes people's data writes exactly one ops.audit_log row first
 * (operator, runbook, reason, ticket, target ids, counts-only detail), then acts.
 * If the audit row cannot be written, the script stops.
 */
import type { ServiceClient } from '../../../supabase/functions/purge-worker/lib/service.ts';
import type { Target } from './target.ts';

export type Runbook = 'incident_scope' | 'verify_deletion' | 'restore_drill' | 'restore_replay';

export interface AuditEntry {
  runbook: Runbook;
  reason: string;
  targetProfile?: string | null;
  targetChild?: string | null;
  detail?: Record<string, string | number | boolean>;
}

export async function auditFirst(client: ServiceClient, target: Target, entry: AuditEntry): Promise<number> {
  const detail = entry.detail ?? {};
  for (const v of Object.values(detail)) {
    if (typeof v === 'string' && !/^[a-z0-9_.:-]{0,40}$/i.test(v)) throw new Error('audit detail holds enums and counts only');
  }
  const id = await client.rpc<number>('ops_audit_write', {
    p_operator: target.operator,
    p_runbook: entry.runbook,
    p_reason_code: entry.reason,
    p_ticket: target.ticket,
    p_target_profile: entry.targetProfile ?? null,
    p_target_child: entry.targetChild ?? null,
    p_target_entry: null,
    p_detail: detail,
  });
  return Number(id);
}
