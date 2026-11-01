/**
 * Owner: E2 (back-end). POST /api/notify: stores one email address for the launch notice.
 * Logic lives in src/lib/notify/handler.ts. Only POST is exported, so Next answers other methods with 405.
 * No CORS headers are sent on purpose: the form posts from the same origin.
 */
import { handleNotify } from '../../../lib/notify/handler';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  return handleNotify(request);
}
