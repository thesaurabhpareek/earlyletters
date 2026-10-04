/**
 * Owner: E2 (back-end). POST /api/unsubscribe: the one-click unsubscribe behind every email.
 * Logic lives in src/lib/notify/unsubscribe-handler.ts. Only POST is exported, so GET gets a 405 and a link
 * scanner can never unsubscribe anyone by fetching the link. No CORS headers on purpose.
 */
import { handleUnsubscribe } from '../../../lib/notify/unsubscribe-handler';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  return handleUnsubscribe(request);
}
