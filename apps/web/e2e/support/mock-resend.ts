/**
 * A stand-in for api.resend.com, listening on 127.0.0.1. The site's server reaches it because the Resend SDK
 * reads RESEND_BASE_URL (node_modules/resend: getDefaultBaseUrl), so no request leaves the machine and no email
 * is ever sent. It records every call the site makes and answers like Resend's contact and email endpoints.
 *
 * It is also controllable over HTTP (/__mock/...), because the specs run in other processes than the one that
 * started it. Fictional data only: addresses are on example.com.
 */
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export type Call = { method: string; path: string; body: unknown; authorization: string | undefined; at: number };
/** Behaviour for one address. Keyed by address so tests running in parallel never affect each other. */
export type Mode = {
  /** How POST /contacts answers for this (new) address. */
  contactsCreate: 'ok' | 'server_error' | 'rate_limited';
  /** How POST /emails answers when it is sent to this address. */
  emailsSend: 'ok' | 'error';
  /** How PATCH /contacts/:id answers for this contact. */
  contactsUpdate: 'ok' | 'server_error';
};
export type Contact = { id: string; email: string; unsubscribed: boolean; segments: string[] };

const defaultMode: Mode = { contactsCreate: 'ok', emailsSend: 'ok', contactsUpdate: 'ok' };

export type MockHandle = { url: string; port: number; close: () => Promise<void> };

export async function startMockResend(port = 0): Promise<MockHandle> {
  const calls: Call[] = [];
  const contacts = new Map<string, Contact>();
  const modes = new Map<string, Mode>();
  const modeFor = (email: string | undefined): Mode => ({ ...defaultMode, ...(email ? modes.get(email.toLowerCase()) : undefined) });

  const send = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
    });
  const byIdOrEmail = (key: string) => [...contacts.values()].find((c) => c.id === key || c.email === key.toLowerCase());

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://mock');
    const path = decodeURIComponent(url.pathname);
    const raw = await readBody(req);
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    const method = req.method ?? 'GET';

    // Control surface for the specs.
    if (path.startsWith('/__mock/')) {
      if (path === '/__mock/state') return send(res, 200, { calls, contacts: [...contacts.values()] });
      if (path === '/__mock/reset') {
        calls.length = 0;
        contacts.clear();
        modes.clear();
        return send(res, 200, { ok: true });
      }
      if (path === '/__mock/mode') {
        const { email, ...patch } = body as { email: string } & Partial<Mode>;
        modes.set(email.toLowerCase(), { ...modeFor(email), ...patch });
        return send(res, 200, modeFor(email));
      }
      if (path === '/__mock/seed') {
        const seed = body as { email: string; unsubscribed?: boolean };
        const contact: Contact = { id: randomUUID(), email: seed.email.toLowerCase(), unsubscribed: seed.unsubscribed ?? false, segments: [] };
        contacts.set(contact.email, contact);
        return send(res, 200, contact);
      }
      return send(res, 404, { error: 'unknown control path' });
    }

    calls.push({ method, path, body, authorization: req.headers.authorization, at: Date.now() });

    if (!req.headers.authorization?.startsWith('Bearer re_')) {
      return send(res, 401, { name: 'missing_api_key', statusCode: 401, message: 'Missing API key.' });
    }

    // POST /contacts
    if (method === 'POST' && path === '/contacts') {
      const { email } = body as { email: string };
      const mode = modeFor(email);
      if (mode.contactsCreate === 'server_error') return send(res, 500, { name: 'application_error', statusCode: 500, message: 'Simulated outage.' });
      if (mode.contactsCreate === 'rate_limited') return send(res, 429, { name: 'rate_limit_exceeded', statusCode: 429, message: 'Simulated limit.' });
      if (contacts.has(email)) return send(res, 409, { name: 'validation_error', statusCode: 409, message: 'Contact already exists.' });
      const segments = ((body as { segments?: { id: string }[] }).segments ?? []).map((s) => s.id);
      const contact: Contact = { id: randomUUID(), email, unsubscribed: false, segments };
      contacts.set(email, contact);
      return send(res, 200, { object: 'contact', id: contact.id });
    }

    // POST /contacts/:email/segments/:segmentId
    const seg = /^\/contacts\/([^/]+)\/segments\/([^/]+)$/.exec(path);
    if (method === 'POST' && seg) {
      const contact = byIdOrEmail(seg[1]);
      if (!contact) return send(res, 404, { name: 'not_found', statusCode: 404, message: 'Contact not found.' });
      if (!contact.segments.includes(seg[2])) contact.segments.push(seg[2]);
      return send(res, 200, { object: 'contact_segment', id: seg[2] });
    }

    // GET / PATCH /contacts/:idOrEmail
    const one = /^\/contacts\/([^/]+)$/.exec(path);
    if (one) {
      const contact = byIdOrEmail(one[1]);
      if (!contact) return send(res, 404, { name: 'not_found', statusCode: 404, message: 'Contact not found.' });
      if (method === 'GET') return send(res, 200, { object: 'contact', id: contact.id, email: contact.email, unsubscribed: contact.unsubscribed });
      if (method === 'PATCH') {
        if (modeFor(contact.email).contactsUpdate === 'server_error') return send(res, 500, { name: 'application_error', statusCode: 500, message: 'Simulated outage.' });
        const patch = body as { unsubscribed?: boolean };
        if (typeof patch.unsubscribed === 'boolean') contact.unsubscribed = patch.unsubscribed;
        return send(res, 200, { object: 'contact', id: contact.id });
      }
    }

    // POST /emails
    if (method === 'POST' && path === '/emails') {
      const to = (body as { to?: string[] }).to?.[0];
      if (modeFor(to).emailsSend === 'error') return send(res, 422, { name: 'validation_error', statusCode: 422, message: 'Simulated send failure.' });
      return send(res, 200, { id: randomUUID() });
    }

    return send(res, 404, { name: 'not_found', statusCode: 404, message: `Mock has no ${method} ${path}.` });
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return {
    url: `http://127.0.0.1:${actualPort}`,
    port: actualPort,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
