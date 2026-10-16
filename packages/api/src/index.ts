/**
 * @scribe/api: the shared contracts between the app, Edge Functions and
 * scripts (founder decision 17: one package, so client and server cannot
 * drift). Pure TypeScript; runs on Hermes, Node and Deno.
 *
 * Contract versions: pack manifest 1, remote config 1, content bundle 1,
 * route major `v1`. A breaking change bumps the schemaVersion and the route
 * major together, and the old route keeps serving until its sunset (ADR 0017).
 */
export * from './semver';
export * from './canonical';
export * from './bytes';
export * from './integrity';
export * from './common';
export * from './pack-manifest';
export * from './remote-config';
export * from './content';
export * from './envelope';
export * from './standards';
export { TRUSTED_SIGNING_KEYS } from './keys';

// The app <-> database contract (founder decision 17): RPCs, readable rows, DB enums, SQLSTATE registry.
export * from './version';
export * from './scalars';
export * from './enums';
export * from './errors';
export * from './rows';
export * from './rpc';
export * from './invite';
