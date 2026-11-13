/**
 * The VoiceOver hint of the Me tab button ("Settings and account", settingsHome.youTabHint). It is true only where the
 * build has sign-in: with server features off the Me tab holds Settings and no account, so nothing extra is said and the
 * servers-off alpha is unchanged (Review B on #738). The tab bar itself names no build rule (store-family-tab.test.ts), so
 * the switch is read here, once, and the layout only asks for the hint.
 */
import { capabilities } from '@/lib/capabilities';
import { copy } from '@/lib/copy';

/** The hint, or nothing when the build has no sign-in. Pure for a given answer; `youTabHint()` reads the build. */
export function youTabHintFor(signIn: boolean): string | undefined {
  return signIn ? copy.settingsHome.youTabHint : undefined;
}

export function youTabHint(): string | undefined {
  return youTabHintFor(capabilities.signIn);
}
