/**
 * File routes (expo-router segments) to the `route` enum for `screen_view`
 * (TDD 01 3.11.1). Keyed by the route template, never the concrete path, so
 * ids and params can never reach analytics. Verified against expo-router
 * 57.0.24: `useSegments()` returns file segments with group folders such as
 * `(tabs)` and dynamic names such as `[id]` kept literal, and drops a final
 * `index` (build/global-state/getRouteInfoFromState.js).
 *
 * A route that is not listed sends nothing. When a screen is added, add its
 * template here and, if needed, a value to `ROUTE` in catalog.ts.
 */
import type { Catalog } from './catalog';

export type RouteValue = Catalog['screen_view']['props']['route']['values'][number];

/** Template (group folders removed, segments joined by '/') to route enum. */
export const ROUTE_MAP: Readonly<Record<string, RouteValue>> = {
  '': 'tonight',
  book: 'book',
  family: 'family',
  listen: 'listen',
  write: 'write',
  review: 'review',
  'letter/[id]': 'letter_detail',
  onboarding: 'onboarding',
  'read-together': 'read_together',
  'sign-in': 'sign_in',
  'sign-in/email': 'sign_in_email',
  'sign-in/code': 'sign_in_code',
  'sign-in/verify': 'sign_in_verify',
  'sign-in/consent': 'sign_in_consent',
  invite: 'invite',
  'invite/new': 'invite_new',
  settings: 'settings',
  'settings/account': 'settings_account',
  'settings/appearance': 'settings_appearance',
  'settings/reminders': 'settings_reminders',
  'settings/recordings': 'settings_recordings',
  'settings/children/[id]': 'settings_child_detail',
  'settings/children/new': 'settings_child_new',
  'settings/privacy': 'settings_privacy',
  'settings/export': 'settings_export',
  'settings/language': 'settings_language',
  'settings/plus': 'settings_plus',
  'settings/storage': 'settings_storage',
  'settings/delete-account': 'settings_delete_account',
};

/** `['(tabs)', 'book']` to `'book'`; unknown templates to null (nothing is sent). */
export function routeForSegments(segments: readonly string[]): RouteValue | null {
  const template = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')'))).join('/');
  return Object.prototype.hasOwnProperty.call(ROUTE_MAP, template) ? ROUTE_MAP[template] : null;
}
