/** Shared setup for the purge-worker tests: config, Apple test key, logger, run helper. */
import { memoryLogger } from '../../_shared/log/log.ts';
import type { WorkerConfig } from '../config.ts';
import { toBase64, wrapAppleToken } from '../lib/apple.ts';
import { createServiceClient } from '../lib/service.ts';
import { runWorker, type Task } from '../worker.ts';
import { FakeWorld, SUPA } from './fake.ts';
import { CANARY } from '../../_shared/log/canary.ts';

export const KEK = toBase64(new Uint8Array(32).map((_, i) => (i * 7 + 3) & 0xff));
export const BUNDLE_ID = 'com.earlyletters.scribe';

export async function appleTestKey(): Promise<{ pem: string; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const b64 = toBase64(der).replace(/(.{64})/g, '$1\n');
  return { pem: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`, publicKey: pair.publicKey };
}

export function testConfig(over: Partial<WorkerConfig> = {}): WorkerConfig {
  return {
    supabaseUrl: SUPA,
    serviceKey: 'service-key-fixture',
    triggerSecret: 'trigger-secret-fixture-0123456789',
    resendApiKey: 're_fixture',
    resendContacts: true,
    mailFrom: 'Early Letters <hello@earlyletters.com>',
    replyTo: 'hello@earlyletters.com',
    alertTo: 'hello@earlyletters.com',
    apple: null,
    tokenKeks: { 1: KEK },
    budgetMs: 110_000,
    version: '1',
    ...over,
  };
}

/** The Asha family: parent (Apple sign-in) deleting their account, co-parent staying. */
export async function ashaWorld(opts: { apple?: boolean; token?: boolean } = {}) {
  const w = new FakeWorld();
  const uid = CANARY.profileId;
  const co = CANARY.coParentId;
  const child = CANARY.childId;
  w.users.set(uid, { email: CANARY.parentEmail, providers: opts.apple === false ? ['email'] : ['apple'] });
  w.users.set(co, { email: CANARY.coParentEmail, providers: ['email'] });
  // Their own photo in the shared book, and the book's child photo they uploaded.
  w.put('entry-photos', `${child}/${uid}/${CANARY.entryId}.jpg`, uid);
  w.put('entry-photos', `${child}/${co}/0192e000-0000-7000-8000-00000000e002.jpg`, co);
  w.buckets.add('child-photos');
  const photo = `${child}/0192e000-0000-7000-8000-0000000000c1.jpg`;
  w.put('child-photos', photo, uid);
  w.childPhotos.set(child, photo);
  if (opts.token !== false && opts.apple !== false) {
    const wrapped = await wrapAppleToken(KEK, 1, uid, CANARY.appleRefreshToken);
    w.appleTokens.set(uid, { ciphertext: wrapped.ciphertext, key_version: 1, client_id: BUNDLE_ID });
  }
  const req = w.addExecuting(CANARY.requestId, uid, { hadSubscription: true });
  w.enqueue('entry-photos', `${child}/${uid}/`, true, req.id);
  return { w, uid, co, child, req, photo };
}

export async function run(w: FakeWorld, config: WorkerConfig, task: Task = 'run') {
  const log = memoryLogger('purge-worker');
  const client = createServiceClient({ url: SUPA, serviceKey: config.serviceKey, fetch: w.fetch });
  let n = 0;
  const summary = await runWorker({ client, fetch: w.fetch, config, log, now: () => w.now, newId: () => `0192e000-0000-7000-8000-${String(++n).padStart(12, 'd')}` }, task);
  return { summary, log };
}

export const advance = (w: FakeWorld, ms: number) => {
  w.now = new Date(w.now.getTime() + ms);
};
