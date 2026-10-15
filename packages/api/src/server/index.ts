/**
 * `@scribe/api/server`: contracts for features that need our server (M14):
 * sync, family, subscription status, recovery key, push.
 *
 * Kept out of the package root on purpose. A build with
 * EXPO_PUBLIC_SERVER_FEATURES=off imports only `@scribe/api` (signed
 * documents, envelope, standards, remote config), so these modules are never
 * evaluated in it; `test/server-features-off.test.ts` fails if the root starts
 * re-exporting them or if a boot-path file of the app imports this entry.
 * App code that needs these shapes uses `import type` anywhere, and value
 * imports only in modules that run behind `capabilities.*`.
 */
export * from './sync';
export * from './family';
export * from './subscription-status';
export * from './recovery-key';
export * from './push';
