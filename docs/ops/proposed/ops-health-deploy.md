# ops-health: the deploy rules and the entry point (BL-584, CR-209), a proposal for the founder

Status: proposal. Nothing here is applied. The function's code is on `develop` as `supabase/functions/ops-health/handler.ts` (tests: `scripts/ops/test/ops-health.test.ts`). It has no `index.ts` on purpose: the deploy rules in `.github/scripts/functions-deploy.mjs` list every function folder that has one, and its own test (`.github/scripts/functions-deploy.test.mjs`, "a new function fails here until it is named") would go red, and `deploy-functions.yml` would deploy it to staging on the next push. The agent that wrote this cannot edit `.github/`. So the entry point and the three `.github` edits below go in one commit that the founder (or a session he directs) applies, after the migration `20261124120000_ops_cron_health.sql` is applied to the project the function will run on (the function calls it).

Hosted apply and function deploy are the founder's (CR-73, queue row FO-1). This PR applies and deploys nothing.

## 1. The entry point: `supabase/functions/ops-health/index.ts`

```ts
/**
 * ops-health: two numbers for the outside purge watch (BL-584; see handler.ts).
 * Deploy (founder only): npx supabase functions deploy ops-health --no-verify-jwt --use-api
 * Secret the founder sets: OPS_HEALTH_TOKEN (openssl rand -hex 32). SUPABASE_URL and the service key are injected.
 * --no-verify-jwt because the caller (a scheduled GitHub job) holds this token, not a Supabase JWT; the function checks the token itself, first.
 */
import { makeOpsHealthHandler } from './handler.ts';

Deno.serve(makeOpsHealthHandler((name) => Deno.env.get(name)));
```

## 2. `.github/scripts/functions-deploy.mjs`

Add `'ops-health'` to `NO_VERIFY_JWT` (it is a bearer-token caller, not a person's session):

```diff
-export const NO_VERIFY_JWT = ['config', 'content', 'purge-worker', 'new-device-email'];
+export const NO_VERIFY_JWT = ['config', 'content', 'purge-worker', 'new-device-email', 'ops-health'];
```

Do not add it to `SMOKE_HEALTH`: the function has no anonymous route, so there is nothing for the smoke to call.

## 3. `.github/scripts/functions-deploy.test.mjs`

In the test "this repository: every function that takes a person's session keeps the gateway JWT check ...", `BEARER` gains `'ops-health'`, and the sorted deploy list gains `'ops-health'` (between `'new-device-fill'` and `'purge-worker'`):

```diff
-  const BEARER = [...PUBLIC, 'new-device-email'];
+  const BEARER = [...PUBLIC, 'new-device-email', 'ops-health'];
```

and `NO_VERIFY_JWT`'s expected order in the `deepEqual` follows the list in step 2. Run `node --test .github/scripts/functions-deploy.test.mjs`.

## 4. Deploying to staging

`deploy-functions.yml` deploys every listed function to staging on the next push that touches `supabase/functions/`. The function answers 503 there until `OPS_HEALTH_TOKEN` is set and the migration is applied, which is harmless. The production deploy is the founder's, by the command in the entry point's header.
