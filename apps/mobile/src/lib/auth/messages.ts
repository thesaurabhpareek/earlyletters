/**
 * The words for an auth error kind. Cancels have none (A-REQ-031: a cancel
 * shows nothing). `{app}` is filled from packages/brand.
 */
import { brand } from '@scribe/brand';
import { fill } from '../copy';
import { authCopy } from './copy';
import type { AuthErrorKind } from './machine.logic';

export function authErrorMessage(kind: AuthErrorKind | null | undefined): string | null {
  if (!kind || kind === 'cancelled') return null;
  return fill(authCopy.errors[kind], { app: brand.name });
}
