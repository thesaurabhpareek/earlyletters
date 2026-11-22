/**
 * The gate for the web presentation seam: the same condition as `e2e-seams.ts`, written with literal
 * `process.env.EXPO_PUBLIC_*` reads so Metro inlines both and drops the `require` from every other build.
 * Loaded by `lib/a11y.ts` only. A test evaluates this file per eas.json profile.
 */
export const e2eWebSeam: typeof import('./e2e-web-seam') | null =
  process.env.EXPO_PUBLIC_E2E === '1' && process.env.EXPO_PUBLIC_APP_ENV !== 'preview' && process.env.EXPO_PUBLIC_APP_ENV !== 'production'
    ? (require('./e2e-web-seam') as typeof import('./e2e-web-seam'))
    : null;
