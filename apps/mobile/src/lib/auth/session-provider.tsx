/**
 * SessionProvider: the account layer the root layout wraps around every route
 * (after the 18+ gate). It owns the auth state machine (machine.logic.ts),
 * talks to Supabase Auth, and publishes the state for non-React code
 * (auth-store.ts).
 *
 * Launch never waits on the network (A-REQ-002, A-REQ-032): the stored
 * session is read from the Keychain, the app renders, and the consent check
 * runs in the background. Recording, reading and export never depend on any
 * of this (C-NFR-004).
 *
 * BL-347 (security review H1, ADR 0023):
 *  - an email link opens only on the phone that asked for it (a Keychain note
 *    of the request time, then PKCE), and never while someone is signed in;
 *  - this phone's letters join an account only after consent and a tap on the
 *    claim screen showing the masked account email (auth-store gates the sync
 *    contract until then; account-claim.logic.ts).
 * BL-330 (H3): after Sign in with Apple, apple.ts sends the authorization code
 * to the `apple-token` function so account deletion can revoke Apple's token.
 */
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { currentUserId, getSetting, listChildren, listEntries, setSetting } from '../store';
import { getSupabaseOrNull, SESSION_STORAGE_KEY, startAutoRefreshWhileActive } from '../supabase/client';
import { errorCode, isNetworkError } from '../supabase/errors.logic';
import { secureStorage } from '../supabase/secure-storage';
import { maskEmail } from './account-claim.logic';
import { appleCredentialRevoked, clearPendingAppleName, forgetAppleUser, signInWithApple, takePendingAppleName } from './apple';
import { accountClaimPending, confirmAccountClaim, publishAuth, onUploadsDrained, pendingUploads, setClaimReaders, subscribeAuth } from './auth-store';
import { loadSyncGate, recordConsent as recordConsentAct, saveDisplayName } from './consent';
import { sendEmailLink as sendEmail, verifyEmailCode as verifyCode, verifyEmailLinkPkce } from './email';
import { openEmailLink } from './email-link.logic';
import { authErrorKind, codeEntryPause } from './errors.logic';
import { signInWithGoogle } from './google';
import type { EmailLinkType } from './links.logic';
import {
  authReducer,
  canSync,
  initialAuthState,
  isSignedIn,
  shouldFinishSignOut,
  type AuthErrorKind,
  type AuthMethod,
  type AuthState,
  type ConsentStep,
} from './machine.logic';
import { signInWithPasskey as passkeySignIn } from './passkey';
import { clearPendingEmailRequest, clearWrongCodes, notePendingEmailRequest, noteWrongCode, readPendingEmailRequest, wrongCodeTimes } from './pending';

export type Outcome = { ok: true } | { ok: false; error: AuthErrorKind };

export interface AccountInfo {
  email: string | null;
  /** "a***@example.com", for the claim screen (F02 6.2 step 6). */
  maskedEmail: string | null;
  provider: 'apple' | 'google' | 'email' | 'other' | null;
}

export interface AuthApi {
  state: AuthState;
  /** False when this build has no Supabase settings: sign-in is hidden, the app is fully local. */
  configured: boolean;
  signedIn: boolean;
  /** Consent complete and no claim pending: server features may run. */
  canSync: boolean;
  /**
   * This phone's letters belong to no account yet and the person has not
   * confirmed this one: show the claim screen (masked email, "Keep them here")
   * before anything syncs (BL-347, F02-REQ-019).
   */
  claimPending: boolean;
  /** "Keep them here": this phone's letters may now join the signed-in account. */
  keepLettersHere(): void;
  /** "Not my account": ends this session on this phone; nothing was claimed or uploaded. */
  notMyAccount(): Promise<void>;
  lastMethod: AuthMethod | null;
  account: AccountInfo;
  signInWithApple(): Promise<Outcome>;
  signInWithGoogle(): Promise<Outcome>;
  signInWithPasskey(): Promise<Outcome>;
  sendEmailLink(email: string): Promise<Outcome>;
  verifyEmailCode(email: string, code: string): Promise<Outcome>;
  verifyEmailLink(tokenHash: string, type: EmailLinkType): Promise<Outcome>;
  recordConsent(step: ConsentStep, accepted: boolean): Promise<Outcome>;
  /**
   * Signed in with sync off because sensitive-data consent was declined:
   * record an accept now (Family, Account) and re-read the gate.
   */
  turnOnSync(): Promise<Outcome>;
  /** Re-reads my_sync_gate (after Settings turns sync on, or on retry). */
  refreshGate(): Promise<void>;
  /** 'waiting' when letters are still uploading; sign-out finishes on its own when they are done. */
  signOut(): Promise<'done' | 'waiting'>;
  signOutOtherDevices(): Promise<Outcome>;
  /** The Supabase client for screens in lib/family and lib/auth; null when not configured. */
  client: SupabaseClient | null;
}

const AuthContext = createContext<AuthApi | null>(null);

const LAST_METHOD_KEY = 'auth.lastMethod';
const GATE_TIMEOUT_MS = 10_000;
const GATE_RECHECK_MS = 30 * 60_000;

function readLastMethod(): AuthMethod | null {
  const v = getSetting(LAST_METHOD_KEY);
  return v === 'apple' || v === 'google' || v === 'email' || v === 'passkey' ? v : null;
}

function accountOf(session: Session | null): AccountInfo {
  if (!session) return { email: null, maskedEmail: null, provider: null };
  const p = session.user.app_metadata?.provider;
  const provider = p === 'apple' || p === 'google' || p === 'email' ? p : 'other';
  const email = session.user.email ?? null;
  return { email, maskedEmail: maskEmail(email), provider };
}

/** Any book or letter on this phone (the claim screen is only for a phone with something to claim). */
function phoneHasLocalData(): boolean {
  return listChildren().length > 0 || listEntries().length > 0;
}

/** The stored session's user id, read from the Keychain without touching the network. */
async function storedUserId(): Promise<string | null> {
  try {
    const raw = await secureStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const id = (JSON.parse(raw) as { user?: { id?: unknown } }).user?.id;
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error('timeout'), { message: 'timed out' })), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

interface Props {
  children: ReactNode;
  /** Called when someone answers No on the age sheet: the root layout closes the 18+ gate (LEGAL-REQ-002). */
  onUnder18?: () => void;
}

export function SessionProvider({ children, onUnder18 }: Props) {
  const sb = useMemo(() => getSupabaseOrNull(), []);
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [lastMethod, setLastMethod] = useState<AuthMethod | null>(readLastMethod);
  const [account, setAccount] = useState<AccountInfo>({ email: null, maskedEmail: null, provider: null });
  const [claimPending, setClaimPending] = useState(false);
  const methodRef = useRef<AuthMethod | null>(null);
  const lastGateCheck = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // BL-347: who owns this phone's letters, and whether there are any, decide whether the claim
  // screen shows. Registered only in a build that can sign in; read only while a session exists.
  useEffect(() => {
    if (!sb) return;
    setClaimReaders({ owner: () => currentUserId(), hasLocalData: phoneHasLocalData });
    const off = subscribeAuth(() => setClaimPending(accountClaimPending()));
    return () => {
      off();
      setClaimReaders(null);
    };
  }, [sb]);
  useEffect(() => publishAuth(state), [state]);

  // Restore from the Keychain, then listen to Supabase Auth.
  useEffect(() => {
    if (!sb) {
      dispatch({ type: 'RESTORED', userId: null });
      return;
    }
    let alive = true;
    void storedUserId().then((id) => alive && dispatch({ type: 'RESTORED', userId: id }));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      // Never call Supabase from inside this callback (supabase-js deadlock note); state only.
      // INITIAL_SESSION arrives with null when the refresh failed for lack of network, while
      // the session stays in the Keychain (auth-js 2.117.2 _emitInitialSession and
      // _callRefreshToken, read 3 Oct 2026), so a null there is not a sign-out. SIGNED_OUT is
      // emitted only when supabase-js really removes the session (_removeSession).
      if (session || event !== 'INITIAL_SESSION') setAccount(accountOf(session));
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        dispatch({ type: 'SIGNED_IN', userId: session.user.id, method: methodRef.current });
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SIGNED_OUT' });
      }
    });
    const stopRefresh = startAutoRefreshWhileActive();
    return () => {
      alive = false;
      data.subscription.unsubscribe();
      stopRefresh();
    };
  }, [sb]);

  const checkGate = useCallback(async () => {
    if (!sb) return;
    lastGateCheck.current = Date.now();
    try {
      const { gate, sensitiveDeclined } = await withTimeout(loadSyncGate(sb), GATE_TIMEOUT_MS);
      dispatch({ type: 'GATE_LOADED', gate, sensitiveDeclined });
    } catch {
      dispatch({ type: 'GATE_UNAVAILABLE' });
    }
  }, [sb]);

  // Consent check whenever a session appears; again on foreground when stale or unknown.
  const checkingUser = state.status === 'checkingConsent' ? state.userId : null;
  useEffect(() => {
    if (checkingUser) void checkGate();
  }, [checkingUser, checkGate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      const cur = stateRef.current;
      if (cur.status === 'ready' && (cur.sync === 'unknown' || Date.now() - lastGateCheck.current > GATE_RECHECK_MS)) void checkGate();
    });
    return () => sub.remove();
  }, [checkGate]);

  // A-REQ-033: Apple sign-in revoked on this Apple ID: sign out once letters are uploaded.
  const signedInUser = isSignedIn(state) ? state.userId : null;
  useEffect(() => {
    if (!signedInUser) return;
    let alive = true;
    void appleCredentialRevoked().then(async (revoked) => {
      if (!alive || !revoked) return;
      dispatch({ type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: await pendingUploads() });
    });
    return () => {
      alive = false;
    };
  }, [signedInUser]);

  // Sign-out: wait for the upload queue, then end the session on this phone only.
  const waiting = state.status === 'signingOut' && state.waitingForUploads;
  useEffect(() => {
    if (!waiting) return;
    const done = () => dispatch({ type: 'UPLOADS_DRAINED' });
    const off = onUploadsDrained(done);
    const poll = setInterval(() => void pendingUploads().then((n) => n === 0 && done()), 10_000);
    return () => {
      off();
      clearInterval(poll);
    };
  }, [waiting]);

  const finishing = shouldFinishSignOut(state);
  useEffect(() => {
    if (!finishing || !sb) return;
    void (async () => {
      try {
        await sb.auth.signOut({ scope: 'local' });
      } catch {
        // Local sign-out clears the Keychain even when the server cannot be reached
        // (auth-js 2.117.2 _signOut removes the session on any error for scope 'local').
      }
      await forgetAppleUser();
      dispatch({ type: 'SIGNED_OUT' });
    })();
  }, [finishing, sb]);

  // An under-18 answer: end the session here and close the 18+ gate.
  const under18 = state.status === 'signedOut' && state.error === 'under_18';
  useEffect(() => {
    if (!under18) return;
    void (async () => {
      try {
        await sb?.auth.signOut({ scope: 'local' });
      } catch {
        // ignore: the gate closes either way
      }
      onUnder18?.();
    })();
  }, [under18, sb, onUnder18]);

  const remember = useCallback((m: AuthMethod) => {
    setSetting(LAST_METHOD_KEY, m);
    setLastMethod(m);
  }, []);

  const providerSignIn = useCallback(
    async (method: AuthMethod, run: (c: SupabaseClient) => Promise<string | 'cancelled'>): Promise<Outcome> => {
      if (!sb) return { ok: false, error: 'not_available' };
      methodRef.current = method;
      dispatch({ type: 'START', method });
      try {
        const res = await run(sb);
        if (res === 'cancelled') {
          dispatch({ type: 'CANCELLED' });
          return { ok: false, error: 'cancelled' };
        }
        remember(method);
        dispatch({ type: 'SIGNED_IN', userId: res, method });
        return { ok: true };
      } catch (e) {
        const error = authErrorKind(e, method === 'passkey' ? 'passkey' : 'provider');
        dispatch({ type: 'FAILED', error });
        return { ok: false, error };
      }
    },
    [sb, remember],
  );

  const api = useMemo<AuthApi>(
    () => ({
      state,
      configured: sb !== null,
      signedIn: isSignedIn(state),
      canSync: canSync(state) && !claimPending,
      claimPending,
      keepLettersHere() {
        const cur = stateRef.current;
        if (isSignedIn(cur)) confirmAccountClaim(cur.userId);
      },
      async notMyAccount() {
        // Nothing was claimed or queued for this account (no owner, no outbox), so nothing to wait for.
        dispatch({ type: 'SIGN_OUT_REQUESTED', reason: 'switch_account', pendingUploads: 0 });
        await clearPendingEmailRequest();
      },
      lastMethod,
      account,
      client: sb,
      signInWithApple: () => providerSignIn('apple', signInWithApple),
      signInWithGoogle: () => providerSignIn('google', signInWithGoogle),
      signInWithPasskey: () => providerSignIn('passkey', passkeySignIn),

      async sendEmailLink(email) {
        if (!sb) return { ok: false, error: 'not_available' };
        methodRef.current = 'email';
        if (stateRef.current.status !== 'awaitingCode') dispatch({ type: 'START', method: 'email' });
        try {
          await sendEmail(sb, email);
          // H1: remember that this phone asked (the time only, never the address).
          await notePendingEmailRequest();
          dispatch({ type: 'EMAIL_SENT', at: Date.now() });
          return { ok: true };
        } catch (e) {
          const error = authErrorKind(e, 'send');
          dispatch({ type: 'FAILED', error });
          return { ok: false, error };
        }
      },

      async verifyEmailCode(email, code) {
        if (!sb) return { ok: false, error: 'not_available' };
        const pause = codeEntryPause(wrongCodeTimes(email), Date.now());
        if (pause.paused) {
          dispatch({ type: 'FAILED', error: 'code_paused' });
          return { ok: false, error: 'code_paused' };
        }
        methodRef.current = 'email';
        try {
          const userId = await verifyCode(sb, email, code);
          clearWrongCodes(email);
          await clearPendingEmailRequest();
          remember('email');
          dispatch({ type: 'SIGNED_IN', userId, method: 'email' });
          return { ok: true };
        } catch (e) {
          const error = authErrorKind(e, 'code');
          if (error === 'wrong_code') noteWrongCode(email, Date.now());
          const now = codeEntryPause(wrongCodeTimes(email), Date.now()).paused ? 'code_paused' : error;
          dispatch({ type: 'FAILED', error: now });
          return { ok: false, error: now };
        }
      },

      async verifyEmailLink(tokenHash, type) {
        if (!sb) return { ok: false, error: 'not_available' };
        // H1 (F02-REQ-018, F02-REQ-020): refused before any request when someone is signed in
        // here or this phone did not ask for an email; otherwise only through PKCE.
        const signedInNow = isSignedIn(stateRef.current);
        let started = false;
        try {
          const r = await openEmailLink(
            { tokenHash, type },
            {
              readPending: () => readPendingEmailRequest(),
              signedIn: () => signedInNow,
              exchange: async (hash, t) => {
                methodRef.current = 'email';
                started = true;
                if (stateRef.current.status !== 'awaitingCode') dispatch({ type: 'START', method: 'email' });
                return verifyEmailLinkPkce(sb, hash, t);
              },
              clearPending: () => clearPendingEmailRequest(),
            },
          );
          if (!r.ok) return r;
          remember('email');
          dispatch({ type: 'SIGNED_IN', userId: r.userId, method: 'email' });
          return { ok: true };
        } catch (e) {
          if (!started) return { ok: false, error: 'unknown' };
          const error = authErrorKind(e, 'link');
          dispatch({ type: 'FAILED', error });
          return { ok: false, error };
        }
      },

      async recordConsent(step, accepted) {
        const cur = stateRef.current;
        if (!sb || cur.status !== 'needsConsent') return { ok: false, error: 'unknown' };
        try {
          await recordConsentAct(sb, step, accepted, cur.method);
          if (step === 'terms' && accepted) {
            // Apple shares the name once; it waits in the Keychain until Terms are accepted.
            const name = await takePendingAppleName();
            if (name) {
              await saveDisplayName(sb, cur.userId, name)
                .then(clearPendingAppleName)
                .catch(() => {});
            }
          }
          dispatch({ type: 'CONSENT_RECORDED', step, accepted });
          return { ok: true };
        } catch (e) {
          const error: AuthErrorKind = isNetworkError(e) ? 'network' : errorCode(e) === '28000' ? 'session_expired' : 'consent_unavailable';
          dispatch({ type: 'CONSENT_FAILED', error });
          return { ok: false, error };
        }
      },

      async turnOnSync() {
        const cur = stateRef.current;
        if (!sb || !isSignedIn(cur)) return { ok: false, error: 'unknown' };
        try {
          await recordConsentAct(sb, 'sensitive', true, null);
          await checkGate();
          return { ok: true };
        } catch (e) {
          return { ok: false, error: isNetworkError(e) ? 'network' : 'consent_unavailable' };
        }
      },

      refreshGate: checkGate,

      async signOut() {
        const syncing = canSync(stateRef.current);
        const pending = await pendingUploads();
        dispatch({ type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: pending });
        return pending > 0 && syncing ? 'waiting' : 'done';
      },

      async signOutOtherDevices() {
        if (!sb) return { ok: false, error: 'not_available' };
        try {
          const { error } = await sb.auth.signOut({ scope: 'others' });
          if (error) throw error;
          return { ok: true };
        } catch (e) {
          return { ok: false, error: authErrorKind(e, 'provider') };
        }
      },
    }),
    [state, sb, lastMethod, account, providerSignIn, remember, checkGate, claimPending],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth outside SessionProvider');
  return v;
}
