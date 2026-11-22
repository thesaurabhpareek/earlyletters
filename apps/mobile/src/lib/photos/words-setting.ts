/**
 * Writing tools on the photo words and place fields (NS-01-R50, R50b; ruling D2, CR-67 AX-1, E41). React Native 0.86 has
 * no prop to turn iOS writing tools (rewrite, proofread) off on a field, and the native setting of ADR 0039 (PROPOSED)
 * is not built. Until it is, the fields are not shown in a `production` profile: the data stays editable only in builds
 * that are not released. Set this to true in the PR that adds the native setting, and the row turns green with it.
 */
import { resolveAppEnv, type AppEnv } from '../build-env';

export const PHOTO_WORDS_WRITING_TOOLS_OFF = false;

export function photoWordsFieldsShown(env: AppEnv | null = resolveAppEnv(process.env.EXPO_PUBLIC_APP_ENV), settingBuilt = PHOTO_WORDS_WRITING_TOOLS_OFF): boolean {
  return (env ?? 'development') !== 'production' || settingBuilt;
}
