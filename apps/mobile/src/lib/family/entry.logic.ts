/**
 * Where every co-parent entry point leads. One switch decides (lib/capabilities.ts,
 * `capabilities.coParent`, which follows EXPO_PUBLIC_SERVER_FEATURES):
 *  - on (D-100, drafted as D-089: server features ship in v1.0; the TestFlight alpha of D-106):
 *    each entry opens its real flow: invite and join (leave waits for D-113, below), in an alpha build only,
 *    never in a store build (BL-882; one rule: servers on AND an alpha build);
 *  - off (the kill path, a store build, and every build made before the switch flips): there is
 *    NOTHING to show (founder, 11 Nov 2026: no tab, no tappable row, no coming-soon screen). The entry is absent where it
 *    is a button or row (`familySurfacesShown`, `visibleCoParentDoors`); a route that is still reached (an invite
 *    link, an old bookmark) sends the person to Tonight, and an invite link keeps no token.
 *
 * Pure (no React Native), so the routing is tested in Node (test/coparent-soon.test.ts).
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
  /** https://earlyletters.com/j#t=<token> opened on this phone. */
  'invite_link',
  /** Settings > a child's book > Write this book together. */
  'settings_child',
  /** First run, "I was invited". */
  'onboarding_join',
  /** /invite/leave: leave a shared book. Not offered in build 2 (D-113, LEAVE_BOOK_OFFERED). */
  'invite_leave',
] as const;
export type InviteEntry = (typeof INVITE_ENTRIES)[number];

/** 'coming_soon' is the name of the "no flow in this build" answer; nothing is shown for it (see the header). */
export type InviteDestination = 'coming_soon' | 'flow';

/**
 * D-113 (coordinator's call, 23 Oct 2026; the founder may reverse it): Leave is hidden in build 2.
 * After leaving, sync marks the book left (lib/sync/merge.ts) and the book list hides it
 * (db/repos/children.ts), so the leaver's own letters would stay on the phone with no screen that
 * lists, exports or deletes them. Until left books are listed under "Letters to {child}" with read,
 * export and delete (docs/BACKLOG.md, before build 3), the Family tab has no Leave row and
 * /invite/leave answers coming soon, like every co-parent route whose feature is off. The leave
 * plan (members.logic.ts canLeave, invites.ts leaveBook) and its tests stay.
 */
export const LEAVE_BOOK_OFFERED = false;

/**
 * One rule for all of them: no server features, no flow; a store build (`alpha` false) has no flow (founder ruling, 11 Nov 2026: co-parent is coming soon there, so one rule, servers on AND an alpha build). Leave also waits for D-113 to lift. `alpha` is PLUS_ALPHA (billing/alpha.ts),
 * decided at bundle time; there is deliberately no default, so a caller cannot forget it.
 */
export function inviteDestination(entry: InviteEntry, serverFeatures: boolean, alpha: boolean): InviteDestination {
  if (entry === 'invite_leave' && !LEAVE_BOOK_OFFERED) return 'coming_soon';
  return serverFeatures && alpha ? 'flow' : 'coming_soon';
}

/** The route a button or row pushes for an entry. Where there is no flow the route sends the person to Tonight. */
export function inviteHref(entry: 'settings_child' | 'onboarding_join' | 'family_tab', serverFeatures: boolean, alpha: boolean, childId?: string | null): string {
  if (inviteDestination(entry, serverFeatures, alpha) === 'coming_soon') return childId ? `/invite?childId=${encodeURIComponent(childId)}` : '/invite';
  if (entry === 'onboarding_join') return '/invite';
  return childId ? `/invite/new?childId=${encodeURIComponent(childId)}` : '/invite';
}

/**
 * Doors that would lead nowhere are hidden (D-087, BL-391 rescoped by M14: hide only what the
 * build still lacks). "I was invited" needs an invite only a server can make: shown with the
 * switch on (D-100 amends D-087), hidden with it off. "Family can read" is the family-contributor
 * switch, and contributors are absent from v1.0 whatever the switch (B1, F11 D4): hidden in both.
 * In a store build "I was invited" stays hidden (BL-882, B12-5): a person cannot
 * join in Build 12, and an invite link already lands on the calm page. The invite-link landing stays in every build.
 */
export function visibleCoParentDoors(coParent: boolean, alpha: boolean): { joinButton: boolean; familyCanReadSwitch: boolean } {
  return { joinButton: coParent && alpha, familyCanReadSwitch: false };
}

/**
 * The child Settings row "Write this book together" (D-126, BL-604, BL-890, BL-882). Family is never a tab, so this no
 * longer decides a tab: it decides the one row, which is there only where the real flow is (an alpha build with server
 * features on, never a store build). Everywhere else there is no row,
 * no chevron and no coming-soon screen. Nothing a person can set reaches either input.
 *
 * Not hidden: the invite-link landing (/invite). A link opened from outside still goes somewhere calm (Tonight, D-087),
 * and the link allowlist below sends nothing else there.
 */
export function familySurfacesShown(input: { alpha: boolean; coParent: boolean }): boolean {
  return input.coParent && input.alpha;
}

/**
 * The invite screens and the `/j` join route are blocked only where a flow would otherwise open: servers on, and a build with
 * no co-parent flow (a store build: the one rule above gives it none). With servers off the routes already send the person
 * Home and an invite link keeps no token, so that build is unchanged (NX-38-R5). `surfacesShown` is the join-door rule
 * (`visibleCoParentDoors(...).joinButton`), the one rule, not a second `familySurfacesShown`.
 */
export function inviteScreensBlocked(input: { serverFeatures: boolean; surfacesShown: boolean }): boolean {
  return input.serverFeatures && !input.surfacesShown;
}

/**
 * The join-door rule (B12-5) with the build's answers passed in, so Node tests can drive every combination. Not a second
 * `familySurfacesShown`: it is `visibleCoParentDoors(...).joinButton` and nothing else (lib/family/surfaces.ts reads the build).
 */
export function familySurfacesFrom(input: { coParent: boolean; alpha: boolean }): boolean {
  return visibleCoParentDoors(input.coParent, input.alpha).joinButton;
}

/** True only when servers are on and the co-parent surfaces are not shown (a servers-on store build). */
export function inviteScreensHiddenFrom(input: { serverFeatures: boolean; coParent: boolean; alpha: boolean }): boolean {
  return inviteScreensBlocked({ serverFeatures: input.serverFeatures, surfacesShown: familySurfacesFrom(input) });
}

/**
 * The only paths an outside link may open (D-087, LEGAL-REQ-011). Anything else, including a screen that
 * starts something (listen, review, read-together), a destructive one (delete account, leave a book), a
 * screen that creates something (invite someone) or one that does not exist, opens Tonight. Auth and
 * invite links are classified before this and have their own routes; an invite link only ever opens
 * /invite, which asks before it joins (BL-322).
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
 * Deep links (+native-intent). Unclassified links open an allowlisted route or Tonight (allowedLinkRoute).
 * With server features on in an alpha build (never a store build), an invite link keeps
 * its token in the Keychain (A-REQ-028) and opens /invite; a store build before that opens Tonight and keeps nothing.
 * With them off there is no sign-in and no join: auth links open the app at home and keep nothing; an
 * invite link opens Tonight and its token is dropped (it could never be redeemed
 * by this build, and it expires on its own).
 */
export function planIncomingLink(link: IncomingLink, opts: { serverFeatures: boolean; gateStopped: boolean; alpha: boolean; path: string }): IncomingLinkPlan {
  const none = { keepInviteToken: false, keepAuthLink: false };
  switch (link.kind) {
    case 'auth-link':
      return opts.serverFeatures ? { route: '/sign-in/verify', keepInviteToken: false, keepAuthLink: true } : { route: '/', ...none };
    case 'auth-code':
      return { route: opts.serverFeatures ? '/sign-in/code' : '/', ...none };
    case 'invite':
      if (opts.gateStopped) return { route: '/', ...none };
      // Where the flow is in this build the link opens it and keeps its token (A-REQ-028); anywhere else it opens Tonight and keeps nothing.
      return inviteDestination('invite_link', opts.serverFeatures, opts.alpha) === 'flow'
        ? { route: '/invite', keepInviteToken: true, keepAuthLink: false }
        : { route: '/', ...none };
    case 'provider-redirect':
      return { route: null, ...none };
    default:
      return { route: allowedLinkRoute(opts.path), ...none };
  }
}
