/** Values the specs and the global setup agree on. Dummy credentials only: nothing here can reach a real service. */
export const TEST_ENV = {
  RESEND_API_KEY: 're_e2e_dummy_key',
  RESEND_SEGMENT_ID: 'seg_e2e_dummy',
  UNSUBSCRIBE_SECRET: 'e2e-unsubscribe-secret-not-real',
} as const;

/** Set by global-setup for the workers. */
export function baseUrl(): string {
  const value = process.env.E2E_BASE_URL;
  if (!value) throw new Error('E2E_BASE_URL is not set: run through `npm run e2e -w @scribe/web` so global setup starts the site.');
  return value;
}

export function mockUrl(): string {
  const value = process.env.E2E_MOCK_URL;
  if (!value) throw new Error('E2E_MOCK_URL is not set: run through `npm run e2e -w @scribe/web`.');
  return value;
}
