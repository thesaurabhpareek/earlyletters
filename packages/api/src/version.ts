/**
 * Version of the client/server contract in this package (semver).
 *
 * Bump rules. Decide by what an already-shipped app build would see:
 *
 * MAJOR: an old client breaks or misbehaves.
 *   - an RPC is removed or renamed, or its SQL signature changes
 *     (Postgres drops and recreates it; PostgREST then answers "function not found");
 *   - a request parameter is removed, renamed, retyped or becomes required;
 *   - a response field or row column is removed, renamed or retyped;
 *   - an error code is removed, or its meaning, retryable flag or sync
 *     disposition changes (a queue could drop or retry the wrong writes);
 *   - an enum value is removed, or a value is added to an enum the client
 *     sends and the server now rejects the old set.
 * MINOR: additive and safe for old clients.
 *   - a new RPC, a new optional parameter (SQL default), a new readable column
 *     or view, a new error code, a new enum value in a response.
 *   Clients must treat unknown enum values and unknown error codes as
 *   "unexpected" and never crash on them.
 * PATCH: no wire change (comments, doc strings, stricter TS types that match
 *   what the server already does).
 *
 * Every migration that touches a client-visible function, grant, view,
 * column, CHECK list or SQLSTATE must update this package in the same pull
 * request; test/drift.test.ts fails otherwise.
 */
export const API_CONTRACT_VERSION = '0.1.0' as const;

/**
 * The newest migration file this contract was checked against (its
 * timestamp prefix). Informational: the drift test compares content, not
 * this value.
 */
export const CONTRACT_MIGRATIONS_HEAD = '20261003020000' as const;
