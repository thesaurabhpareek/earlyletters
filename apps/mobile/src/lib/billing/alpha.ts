/**
 * No letter limit in alpha (founder decision, 1 Nov 2026; proposal PL-1, S1).
 *
 * A `.preview` build cannot load the Plus products (they live on the production App Store record only,
 * docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md "What you are creating"), so in an alpha build a third letter would be
 * held with no way to buy Plus. In alpha the free-letter allowance is therefore raised to the most the plan engine
 * allows (MAX_FREE_LETTERS), through the same allowance path remote config uses (gates.ts
 * setFreeLettersAllowanceSource, then core freeLettersFrom), and every Plus surface says Plus is not part of this
 * test instead of offering it.
 *
 * The switch is the build's app environment and nothing else: `APP_ENV` (build-env.ts) is inlined by Metro from
 * eas.json `EXPO_PUBLIC_APP_ENV` at bundle time. Nothing a person can set (settings, remote config, a deep link, a
 * stored value) reaches it. `development` and `preview` are alpha; `production` (the App Store app) is the store
 * build, whose behaviour this file does not change: there the source is remote config exactly as before.
 * preflight-production.mjs fails if the production profile ever resolves to anything but `production`.
 */
import { billingCopy } from '@scribe/content';
import { MAX_FREE_LETTERS } from '@scribe/core';
import { APP_ENV, type AppEnv } from '../build-env';

/** Is a build of this app environment an alpha (TestFlight or development) build? Only `production` is the store. */
export function isAlphaBuild(env: AppEnv): boolean {
  return env !== 'production';
}

/** This build, decided at bundle time. Not a setting: never read from storage, remote config or a link. */
export const PLUS_ALPHA: boolean = isAlphaBuild(APP_ENV);

/**
 * The free-letter allowance source for a build. Alpha: the engine's cap (MAX_FREE_LETTERS, 100 letters), so in a
 * test the Keep step does not ask for Plus before a tester has kept 100 letters; core plan.ts is not changed, and a
 * truly unbounded alpha would need a founder-reviewed change there. Store: `remote`, unchanged (remote config, which
 * may only raise the reviewed 2).
 */
export function allowanceSourceFor(alpha: boolean, remote: () => unknown): () => unknown {
  return alpha ? () => MAX_FREE_LETTERS : remote;
}

/**
 * A line about Plus outside Apple's sheet (the Welcome footnote, the Settings Plan row): the store build's own words,
 * or in alpha the note that Plus is not part of this test (`billingCopy.alpha.note`).
 */
export function plusLineFor(alpha: boolean, storeLine: string): string {
  return alpha ? billingCopy.alpha.note : storeLine;
}
