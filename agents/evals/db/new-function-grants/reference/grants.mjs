// Model of supabase/tests/grants.mjs: the public functions each API role may execute, as `name(argument types)`.
// The access matrix compares this list with the database in both directions.
export const FUNCTION_GRANTS = {
  anon: [],
  authenticated: ['is_child_member(uuid)', 'child_book_members(uuid)'],
  service_role: [],
};
