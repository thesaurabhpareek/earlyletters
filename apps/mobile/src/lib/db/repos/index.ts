/**
 * Repositories for the local store. Engine-neutral (SqlDb), no module state,
 * no React Native. store.ts is the facade screens use; it owns the one
 * connection, resolves defaults (active child, signature) and emits change
 * events. Import repositories directly only from src/lib.
 */
export * as children from './children';
export * as drafts from './drafts';
export * as entries from './entries';
export * as ledger from './ledger';
export * as letters from './letters';
export * as orphans from './orphans';
export * as settings from './settings';
export { changes, type RepoContext, type Table } from './context';
export { createChangeBus, type ChangeBus, type ChangeListener } from './events';
export { uuidv7From, UUIDV7_RE } from './ids';
export * from './types';
