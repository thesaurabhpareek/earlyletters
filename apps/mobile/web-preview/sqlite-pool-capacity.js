// WEB PREVIEW ONLY (BL-464). Native never loads this file.
//
// expo-sqlite 57.0.3's web worker keeps the database in a pool of Origin Private File System files
// (wa-sqlite AccessHandlePoolVFS). Each SQLite file needs one pool file of its own: scribe.db one, and its rollback
// journal another during every write (WAL needs shared memory, which this VFS lacks, so the journal mode stays
// delete). The pool is made on the first ever start, six files one at a time, and upstream adds files only when the
// pool is empty. A page that ends during that first setup (seeded() in the web e2e opens a page and goes straight to
// the next one) leaves one file behind. The next page then opens scribe.db and reads user_version, but the first
// write of migration 1 finds no file for its journal: "unable to open database file", local_db_migration_failed:1.
// This tops the pool up to its full size on every start, so a cut first setup is finished by the next page.
//
// Remove this file, sqlite-access-handle-pool-vfs.js and their metro.config.js rule when an expo-sqlite release tops
// the pool up itself (upstream wa-sqlite: AccessHandlePoolVFS isReady adds DEFAULT_CAPACITY only at capacity 0).

/** wa-sqlite's DEFAULT_CAPACITY: the pool an uncut first setup makes. */
export const POOL_FILES = 6;

/** The upstream pool VFS class, with a create() that brings the pool back to POOL_FILES files. */
export function withFullPool(Upstream) {
  return class AccessHandlePoolVFS extends Upstream {
    static async create(name, module) {
      const vfs = new this(name, module);
      await vfs.isReady();
      const missing = POOL_FILES - vfs.getCapacity();
      if (missing > 0) await vfs.addCapacity(missing);
      return vfs;
    }
  };
}
