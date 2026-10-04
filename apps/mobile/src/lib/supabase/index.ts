export {
  getSupabase,
  getSupabaseOrNull,
  isSupabaseConfigured,
  SESSION_STORAGE_KEY,
  startAutoRefreshWhileActive,
  SupabaseNotConfiguredError,
  type SupabaseLike,
} from './client';
export { errorCode, errorStatus, isNetworkError } from './errors.logic';
export { secureStorage, type KeyValueStorage } from './secure-storage';
