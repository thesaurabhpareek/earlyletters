/**
 * Registers Settings > Privacy's "Sync and family sharing" row source once, on mount (BL-485 (b), BL-508). It lives
 * in its own file, with no React Native in it, so test/privacy-sensitive-row.test.ts can mount it in Node and check the
 * behaviour instead of the provider's formatting. The session provider calls it at the top of its body; a refactor
 * must keep that call on a path that runs on every mount.
 */
import { useEffect } from 'react';
import { registerSensitiveDataRow } from './sensitive-row';

export function useRegisterSensitiveDataRow(): void {
  useEffect(() => {
    registerSensitiveDataRow();
  }, []);
}
