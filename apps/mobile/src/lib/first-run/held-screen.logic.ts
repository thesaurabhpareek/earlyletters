/**
 * The held screen for an account with consent still to give (BL-922a; NS-10-R0, R4a, R4b; docs/tdd/new-scope/08-keeping.md
 * 3.2). Pure, no React Native, tested in Node (test/held-screen-routes.test.ts). It decides which links the screen offers
 * and where each goes. It reads nothing, sends nothing and records nothing: no network, no storage, no analytics event.
 *
 * Never a dead end (App Review 2.1): Try another way (sign out) and Delete account do not depend on the consent route, and
 * neither the delete page nor the export page asks for Terms (pinned by reading their source in the test). Delete account is
 * shown only where its page opens: the page redirects to Settings with the build switch off (D-129), so a link there would
 * be a button that does nothing.
 */
export const HELD_FINISH_SETUP_ROUTE = '/sign-in/consent';
export const HELD_DELETE_ROUTE = '/settings/delete-account';
export const HELD_EXPORT_ROUTE = '/settings/export';

export interface HeldScreenInput {
  /** `capabilities.accountDeletion`: the build switch behind the Delete account page. */
  accountDeletion: boolean;
  /** The phone lists a book. The held screen is only drawn with none, so a route passes false; kept so the export line is a fact, not a habit. */
  hasLocalBook: boolean;
}

export interface HeldScreenModel {
  /** The primary action: the consent sheet, as Settings > Account > Finish setting up opens it. */
  finishSetup: { route: typeof HELD_FINISH_SETUP_ROUTE };
  /** Quiet: shown only where the page opens. */
  deleteAccount: { route: typeof HELD_DELETE_ROUTE } | null;
  /** Quiet: always shown (R4b). With nothing on this phone, `nothingToCopy` says where the book is. */
  exportCopy: { route: typeof HELD_EXPORT_ROUTE; nothingToCopy: boolean };
}

export function heldScreenModel(input: HeldScreenInput): HeldScreenModel {
  return {
    finishSetup: { route: HELD_FINISH_SETUP_ROUTE },
    deleteAccount: input.accountDeletion ? { route: HELD_DELETE_ROUTE } : null,
    exportCopy: { route: HELD_EXPORT_ROUTE, nothingToCopy: !input.hasLocalBook },
  };
}
