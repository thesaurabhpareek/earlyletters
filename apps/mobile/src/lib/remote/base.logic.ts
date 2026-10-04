/**
 * Where signed documents (remote config, pack manifest, content bundle) come
 * from (ADR 0016). Pure, so Node tests can check it.
 *
 * 1. `EXPO_PUBLIC_DOCS_BASE_URL` when a CDN fronts the documents (https only).
 * 2. Else the Supabase project URL, but only when the build has server
 *    features on (lib/capabilities.ts). A v1.0 build never calls Supabase.
 * 3. Else null: the app uses its bundled defaults and packaged copy.
 */
export function docsBaseFor(cdnRaw: string | undefined, serverFeatures: boolean, supabaseUrl: string | null): string | null {
  const cdn = (cdnRaw ?? '').trim().replace(/\/+$/, '');
  if (/^https:\/\/[^\s/]+$/.test(cdn)) return cdn;
  return serverFeatures ? supabaseUrl : null;
}
