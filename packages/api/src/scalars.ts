/**
 * JSON wire shapes of Postgres types as PostgREST sends and accepts them.
 * Aliases document intent; they are plain strings and numbers at runtime.
 */

/** uuid, lower-case canonical text form. */
export type Uuid = string;
/** A device-generated UUIDv7 (RFC 9562), checked server-side by is_valid_client_uuid7. */
export type ClientUuid7 = Uuid;
/** date, 'YYYY-MM-DD'. */
export type IsoDate = string;
/** timestamptz, ISO 8601 with offset. */
export type IsoTimestamp = string;
/** bytea in Postgres text (hex) form: '\\x' followed by hex digits. */
export type ByteaHex = string;
/** tsvector in Postgres text form (generated; never written by clients). */
export type TsVectorText = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

/** Compile-time check that two key unions are identical. */
export type SameKeys<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export type Assert<T extends true> = T;
