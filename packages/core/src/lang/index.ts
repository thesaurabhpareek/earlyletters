/**
 * Languages (ADR 0014): text-rules packs as data, one generic engine.
 * See types.ts for the pack schema and engine.ts for how it is read.
 */
export * from './types';
export * from './languages';
export { ENGLISH_PACK } from './english';
export { ENGLISH_RULES, LanguageRules, compileRules, normalizeCharsWith, type Capabilities, type CompileOptions } from './engine';
export * from './dictionary';
export * from './script';
export * from './validate';
export * from './punctuation';
export * from './clean';
