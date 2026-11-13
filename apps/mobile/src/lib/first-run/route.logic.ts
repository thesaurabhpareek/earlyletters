/**
 * What the onboarding route asks the sign-in-first gate (NX-31 R17, R18, R22), composed here so it is tested in Node
 * (test/first-run-route.test.ts) and not pinned by a pattern in a screen file. The route passes what it has: the auth
 * state, a way to ask whether the phone lists a book, the local-start latch, and the step. It draws what comes back.
 *
 * The one build switch is read here, `serverFeaturesEnabled()`, and in the route hook that wraps it (use-first-run-route.ts,
 * which also reads nothing else with the switch off: test/use-first-run-route.test.ts). With it off every answer
 * is the answer Build 11 gave (Continue shows whenever the join wait lets it), the book list is never read, and nothing
 * else on the route changes. Nothing here stores, sends or logs anything.
 *
 * Scope: the sign-in gate decides only whether "Begin the book" shows on the WELCOME, the one place a person starts a
 * book. On every later step the gate is not asked again. A person who is already typing the child's name must keep
 * Continue when the auth state moves under them (a session lost, a sign-in email link opened): taking it away, with no
 * line to say why, would strand the work in front of them.
 */
import type { AuthState } from '@/lib/auth/machine.logic';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { beginTheBookAllowed, gateInputsFromAuth, hasSessionIn } from './gate.logic';

export interface WelcomeGateArgs {
  authState: AuthState;
  /**
   * Whether the phone lists a book. A function so it is called only when the switch is on: with the switch off the
   * book list is not read at all.
   */
  hasLocalBook: () => boolean;
  /** The person already took the local start on this visit (R18): not pulled back to sign-in. In memory, never stored. */
  localStartChosen: boolean;
}

/** May "Begin the book" show on the Welcome? Always true with the server switch off. */
export function welcomeBeginAllowed(args: WelcomeGateArgs): boolean {
  const serverFeatures = serverFeaturesEnabled();
  return beginTheBookAllowed(
    gateInputsFromAuth({
      serverFeatures,
      authState: args.authState,
      hasLocalBook: serverFeatures && args.hasLocalBook(),
      localStartChosen: args.localStartChosen,
      // The steps only render once the route has decided (the account said "new", or the earlier local start), so the
      // Welcome's own question is not the account question (NX-36-S17 holds that on the route, use-first-run-route.ts).
      newPhone: 'new',
    }),
  );
}

/**
 * Does Continue show? `begin` is the join wait's own answer (a joined book on its way hides it on the Welcome); the gate
 * adds to it on the Welcome only, and never on the child, signs-as, promise or finish step.
 */
export function continueMayShow(args: WelcomeGateArgs & { begin: boolean; onWelcome: boolean }): boolean {
  if (!args.begin) return false;
  if (!args.onWelcome) return true;
  return welcomeBeginAllowed(args);
}

/**
 * "Begin the book" tapped on the Welcome with no session is the local start (R18): the route then latches
 * `localStartChosen`, so a later change of auth state (a sign-in email link opened, the service back) does not take the
 * button away on the way back to the Welcome. With the switch off, or with a session, a tap is just a tap.
 */
export function continueTapIsLocalStart(args: { onWelcome: boolean; authState: AuthState }): boolean {
  return args.onWelcome && serverFeaturesEnabled() && !hasSessionIn(args.authState);
}
