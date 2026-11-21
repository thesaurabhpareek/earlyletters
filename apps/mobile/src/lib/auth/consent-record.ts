/**
 * The one builder of a consent act (NS-42-R7, NSC-14; BL-577 app half; docs/tdd/new-scope/12-first-run-2.md 5.2).
 * `consent.ts` is its only caller and `record_policy_act` has no other caller in the app. It returns the RPC's named
 * arguments: the hash of the words as shown, the language of those words, the build and the OS major version.
 *
 * Never in it: an IP address, a user agent, a device id or model, an age, a name (PRIV-R21). The OS is the major number
 * only. Pure, with no import of a native module, so the same file runs under Node in the database contract test; the
 * hash function and the environment come in as arguments.
 */
export interface ConsentEnv {
  /** SHA-256 of a string as lower-case hex (lib/sha256.ts). */
  sha256: (text: string) => string;
  /** EAS build number (iOS CFBundleVersion, Android versionCode), or null when the platform does not say. */
  appBuild: string | null | undefined;
  /** Marketing version. */
  appVersion: string;
  /** `Platform.Version`: "17.4" on iOS, the SDK integer on Android. Only the major leaves this function. */
  osVersion: string | number | null | undefined;
  platform: 'ios' | 'android' | 'web';
}

export interface ConsentActInput {
  document: string;
  version: string;
  action: 'accept' | 'decline' | 'acknowledge' | 'withdraw';
  method: string;
  surface: string;
  /** The words exactly as drawn (packages/content consentShownText). Its hash is recorded; the text is not. */
  shownText: string;
  /** The language of `shownText`, from its content module, never a literal here (FS-22). */
  locale: string;
  clientRecordedAt: string;
  context: Record<string, unknown>;
}

const BUILD = /^[0-9]{1,10}(\.[0-9]{1,10}){0,2}$/;

/** The major OS version, 1 to 999, or null. Never the minor, never the device model (20261108000000). */
export function osMajor(v: string | number | null | undefined): number | null {
  const n = typeof v === 'number' ? Math.trunc(v) : Number.parseInt(String(v ?? ''), 10);
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

export function buildConsentAct(a: ConsentActInput, env: ConsentEnv): Record<string, unknown> {
  if (!a.shownText) throw new Error('consent act without the words shown');
  if (!a.locale) throw new Error('consent act without the language shown');
  const build = env.appBuild && BUILD.test(env.appBuild) ? env.appBuild : null;
  return {
    p_document: a.document,
    p_version: a.version,
    p_action: a.action,
    p_method: a.method,
    p_surface: a.surface,
    p_app_version: env.appVersion.slice(0, 32),
    p_platform: env.platform,
    p_locale: a.locale,
    p_client_recorded_at: a.clientRecordedAt,
    // bytea over PostgREST is the hex string with a "\x" prefix.
    p_rendered_sha256: `\\x${env.sha256(a.shownText)}`,
    p_context: a.context,
    p_app_build: build,
    p_os_major: osMajor(env.osVersion),
  };
}
