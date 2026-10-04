/**
 * Typed wrappers for the service-only database functions the worker calls.
 * SQL: supabase/migrations/20261002020000_data_governance.sql (prepare and
 * finalize), 20261003020000_purge_batching.sql (purge_due, backoff) and
 * 20261004200000_ops_deletion_worker.sql (everything named ops_*).
 * Every id travels in an RPC body, never in a URL.
 */
import type { ServiceClient } from './lib/service.ts';

export type StepStatus = 'pending' | 'done' | 'failed' | 'not_applicable';

export interface StepRow {
  step: string;
  status: StepStatus;
  attempts: number;
  next_attempt_at: string;
  last_error_code: string | null;
}

export interface ExecutingRequest {
  id: string;
  profile_id: string;
  requested_at: string;
  executing_at: string;
  had_active_subscription: boolean | null;
  receipt: Record<string, unknown>;
  steps: StepRow[];
}

export interface NoticeWork {
  request_id: string;
  kind: 'account' | 'book';
  scheduled_for: string;
  attempts: number;
}

export interface EmailWork {
  id: string;
  profile_id: string;
  scheduled_for: string;
  requested_at: string;
  cancelled_at: string | null;
}

export interface DeletionWork {
  executing: ExecutingRequest[];
  notices: NoticeWork[];
  request_emails: EmailWork[];
  cancel_emails: EmailWork[];
}

export interface QueueRow {
  id: number;
  bucket_id: string;
  object_path: string;
  is_prefix: boolean;
  request_id: string | null;
  attempts: number;
}

export interface SlaReport {
  tombstones_overdue: number;
  requests_executing_over_24h: number;
  requests_executing_over_7d: number;
  steps_failed: number;
  steps_retrying: number;
  queue_stuck: number;
  queue_attempts_high: number;
  scheduled_overdue: number;
  holds_past_review: number;
  purge_run_age_minutes: number | null;
}

export interface ResidueRow {
  table_schema: string;
  table_name: string;
  column_name: string;
}

export interface PurgeResult {
  books: number;
  entries: number;
  accounts_due: number;
  more: boolean;
}

export const db = (c: ServiceClient) => ({
  purgeDue: (limit = 500) => c.rpc<PurgeResult>('purge_due', { p_limit: limit }),
  work: (limit = 10) => c.rpc<DeletionWork>('ops_deletion_work', { p_limit: limit }),
  queueDue: (limit: number, requestId: string | null = null) =>
    c.rpc<QueueRow[]>('ops_storage_queue_due', { p_limit: limit, p_request: requestId }),
  recordPurgeAttempt: (id: number, ok: boolean, code: string | null = null) =>
    c.rpc<null>('record_purge_attempt', { p_id: id, p_ok: ok, p_error_code: code }),
  recordStep: (request: string, step: string, status: StepStatus, code: string | null = null) =>
    c.rpc<null>('record_deletion_step', { p_request: request, p_step: step, p_status: status, p_error_code: code }),
  prepare: (request: string) => c.rpc<{ held?: boolean; entries?: number; books?: number }>('prepare_account_purge', { p_request: request }),
  finalize: (request: string, receipt: Record<string, unknown>) =>
    c.rpc<null>('finalize_account_deletion', { p_request: request, p_receipt: receipt }),
  mergeReceipt: (request: string, part: Record<string, unknown>) =>
    c.rpc<Record<string, unknown>>('ops_merge_deletion_receipt', { p_request: request, p_part: part }),
  ownedObjects: (uid: string, limit = 1000) =>
    c.rpc<{ bucket_id: string; name: string }[]>('ops_storage_owned_by', { p_uid: uid, p_limit: limit }),
  storageResidue: (uid: string, limit = 100) =>
    c.rpc<{ bucket_id: string; name: string }[]>('ops_storage_residue', { p_uid: uid, p_limit: limit }),
  residue: (uid: string, phase: 'before_finalize' | 'after_finalize') =>
    c.rpc<ResidueRow[]>('ops_deletion_residue', { p_uid: uid, p_phase: phase }),
  contributors: (request: string) => c.rpc<string[]>('ops_deletion_contributors', { p_request: request }),
  setChildPhotoPath: (child: string, oldPath: string, newPath: string) =>
    c.rpc<boolean>('ops_set_child_photo_path', { p_child: child, p_old: oldPath, p_new: newPath }),
  appleTokenGet: (uid: string) =>
    c.rpc<{ ciphertext: string; key_version: number; client_id: string }[]>('ops_apple_token_get', { p_profile: uid }),
  appleTokenDelete: (uid: string) => c.rpc<boolean>('ops_apple_token_delete', { p_profile: uid }),
  sla: () => c.rpc<SlaReport>('ops_deletion_sla', {}),
  alertClaim: (kind: string, cooldownMinutes: number) =>
    c.rpc<boolean>('ops_alert_claim', { p_kind: kind, p_cooldown_minutes: cooldownMinutes }),
  alertReset: (kind: string) => c.rpc<null>('ops_alert_reset', { p_kind: kind }),
  ledgerSince: (from: string, until: string, limit = 50_000) =>
    c.rpc<{ t: string; id: string; at: string }[]>('ops_ledger_between', { p_from: from, p_until: until, p_limit: limit }),
  retention: () => c.rpc<Record<string, number>>('ops_retention', {}),
});

export type Db = ReturnType<typeof db>;
