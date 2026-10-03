/**
 * Local Expo module `ScribeFiles` (iOS). Optional: absent in Expo Go, on web
 * and on Android until an Android implementation lands, so every caller must
 * handle null (src/lib/model-files.ts does).
 */
import { requireOptionalNativeModule } from 'expo';

interface ScribeFilesNative {
  modelsDirectory(): string;
  isExcludedFromBackup(uri: string): boolean;
  setExcludedFromBackup(uri: string, excluded: boolean): void;
}

export const ScribeFiles = requireOptionalNativeModule<ScribeFilesNative>('ScribeFiles');
