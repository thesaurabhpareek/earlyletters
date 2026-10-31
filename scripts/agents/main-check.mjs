// "Is this module the entry point?" for the CLI scripts. Both sides are resolved with realpath, so a symlink to a script
// still runs it (comparing the unresolved argv[1] to import.meta.url made a symlinked start exit 0 and print nothing).
// Throws when it cannot decide; callers must treat that as a failure, never as "not main".
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function isMain(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  return realpathSync(argv1) === realpathSync(fileURLToPath(metaUrl));
}
