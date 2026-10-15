/**
 * Where every co-parent entry point leads (founder decision, 3 Oct 2026).
 * v1.0 ships without server features (lib/capabilities.ts), so sharing a book
 * is "coming soon": every way into an invite shows the same calm presentation
 * (components/family/coparent-soon.tsx), never a dead end, an error or a
 * sign-in sheet. With server features on (v1.1), each entry opens its real flow.
 *
 * Pure (no React Native), so the routing is tested in Node
 * (test/coparent-soon.test.ts).
 */
import type { IncomingLink } from '../auth/links.logic';
import { routePathOf } from '../resilience/not-found.logic';

/** Every place in the app that can start inviting or joining a co-parent. */
export const INVITE_ENTRIES = [
  /** The Family tab itself. */
  'family_tab',
  /** /invite: "I was invited", join a co-parent's book. */
  'invite_join',
  /** /invite/new: invite a co-parent to a book. */
  'invite_new',
  /** https://earlyletters.com/i/<token> opened on this phone. */
  'invite_link',
  /** Settings > a child's book > Write this book together. */
  'settings_child',
  /** First run, "I was invited". */
  'onboarding_join',
] as const;
export type InviteEntry = (typeof INVITE_ENTRIES)[number];

export type InviteDestination = 'coming_soon' | 'flow';

/** One rule for all of them: no server features, no flow. */
export function inviteDestination(_entry: InviteEntry, serverFeatures: boolean): InviteDestination {
  return serverFeatures ? 'flow' : 'coming_soon';
}

/** The route a button or row pushes for an entry. Off: the invite modal, which shows coming soon. */
export function inviteHref(entry: 'settings_child' | 'onboarding_join' | 'family_tab', serverFeatures: boolean, childId?: string | null): string {
  if (inviteDestination(entry, serverFeatures) === 'coming_soon') return childId ? `/invite?childId=${encodeURIComponent(childId)}` : '/invite';
  if (entry === 'onboarding_join') return '/invite';
  return childId ? `/invite/new?childId=${encodeURIComponent(childId)}` : '/invite';
}

/**
 * Doors that can lead nowhere for anyone in v1.0 (D-087): "I was invited" needs an invite that only a
 * server can make, and "Family can read" is a switch that cannot be turned on. Both come back with
 * co-parent sharing, with no new work. The Family tab, the Settings row and the invite-link landing stay.
 */
export function visibleCoParentDoors(coParent: boolean): { joinButton: boolean; familyCanReadSwitch: boolean } {
  return { joinButton: coParent, familyCanReadSwitch: coParent };
}

/**
 * The only paths an outside link may open (D-087, LEGAL-REQ-011). Anything else, including a screen that
 * starts something (listen, review, read-together), a destructive one (delete account) or one that does not
 * exist, opens Tonight. Auth and invite links are classified before this and have their own routes.
 */
export const LINK_ROUTE_ALLOWLIST = ['/', '/invite'] as const;

/** The route an unclassified link may take: itself if allowed (path only, no query), otherwise Tonight. */
export function allowedLinkRoute(path: string): string {
  const p = routePathOf(path);
  return (LINK_ROUTE_ALLOWLIST as readonly string[]).includes(p) ? p : '/';
}

export interface IncomingLinkPlan {
  /** Where Expo Router goes; null leaves the URL alone (Google's own redirect). */
  route: string | null;
  /** Keep the invite token in the Keychain for the join flow. Never when the flow is not in this build. */
  keepInviteToken: boolean;
  /** Keep the sign-in token hash in memory for /sign-in/verify. */
  keepAuthLink: boolean;
}

/**
 * Deep links (+native-intent). Unclassified links open an allowlisted route or Tonight (allowedLinkRoute). With server features off there is no sign-in and
 * no join: auth links open the app at home and keep nothing; an invite link opens
 * the coming-soon presentation and its token is dropped (it could never be
 * redeemed by this build, and it expires on its own).
 */
export function planIncomingLink(link: IncomingLink, opts: { serverFeatures: boolean; gateStopped: boolean; path: string }): IncomingLinkPlan {
  const none = { keepInviteToken: false, keepAuthLink: false };
  switch (link.kind) {
    case 'auth-link':
      return opts.serverFeatures ? { route: '/sign-in/verify', keepInviteToken: false, keepAuthLink: true } : { route: '/', ...none };
    case 'auth-code':
      return { route: opts.serverFeatures ? '/sign-in/code' : '/', ...none };
    case 'invite':
      if (opts.gateStopped) return { route: '/', ...none };
      return { route: '/invite', keepInviteToken: inviteDestination('invite_link', opts.serverFeatures) === 'flow', keepAuthLink: false };
    case 'provider-redirect':
      return { route: null, ...none };
    default:
      return { route: allowedLinkRoute(opts.path), ...none };
  }
}
