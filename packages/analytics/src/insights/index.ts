/**
 * Insights engine for scripts/insights (docs/analytics/INSIGHTS_LOOP.md).
 * Import as `@scribe/analytics/src/insights` from scripts only; it is not
 * exported from the package index, so it never reaches the app bundle.
 */
export * from './types';
export * from './hogql';
export { computeInsights, detectAnomaly, weekStart, pct, type SeriesPoint } from './engine';
export * from './render';
export * from './synthetic';
export * from './sources';
