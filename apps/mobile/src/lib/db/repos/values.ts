/**
 * Readers for the v6 metadata columns (WP-F04-03). A stored value the app does
 * not know reads as the default, so a damaged or future value never hides a
 * letter or a draft. Writers refuse unknown values instead (see drafts.ts).
 */
import { LANGUAGE_CODES, type LanguageCode } from '@scribe/core';
import type { BaseDirection, DraftKind, OccurredPrecision } from './types';

export const isLanguage = (v: unknown): v is LanguageCode => typeof v === 'string' && (LANGUAGE_CODES as readonly string[]).includes(v);
export const isPrecision = (v: unknown): v is OccurredPrecision => v === 'day' || v === 'month';
export const isDirection = (v: unknown): v is BaseDirection => v === 'ltr' || v === 'rtl';
export const isDraftKind = (v: unknown): v is DraftKind => v === 'note' || v === 'letter';

export const asLanguage = (v: string | null | undefined): LanguageCode | null => (isLanguage(v) ? v : null);
export const asPrecision = (v: string | null | undefined): OccurredPrecision => (v === 'month' ? 'month' : 'day');
export const asDirection = (v: string | null | undefined): BaseDirection => (v === 'rtl' ? 'rtl' : 'ltr');
export const asDraftKind = (v: string | null | undefined): DraftKind => (v === 'note' ? 'note' : 'letter');

/** YYYY-MM-DD with a real month and day (calendar bounds are F04's backdating rules, not the store's). */
export const isIsoDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
