/**
 * Read-back of the backup exclusion at the four moments a file can change under us (BL-1409; NX-39-R42, R43; model P9,
 * P10, G-4): open, replace (a rename over the old file), restore (a device restore brought the file) and rebuild (a
 * derived file written again). Pure over a small port so Node tests plant a wrong flag. A file that reads not excluded
 * is removed and never read. Absent is fine. A throw reads as wrong (fail closed). Nothing here logs a name or contents.
 * The file CLASS (NX-39-R43) is not read here: no native getter exists yet (BL-1408, NSC-01 gate).
 */
import { carriesMetadata, stripJpeg } from '../photos/strip';

export type ReadBackMoment = 'open' | 'replace' | 'restore' | 'rebuild';

export interface FlagPort {
  exists(name: string): boolean;
  isExcluded(name: string): boolean;
  remove(name: string): void;
}

export type FlagVerdict = { ok: true } | { ok: false; moment: ReadBackMoment; removed: boolean };

export function readBackFlag(port: FlagPort, name: string, moment: ReadBackMoment): FlagVerdict {
  try {
    if (!port.exists(name) || port.isExcluded(name) === true) return { ok: true };
  } catch {
    // fall through: a flag we cannot read is a wrong flag
  }
  let removed = false;
  try {
    port.remove(name);
    removed = !port.exists(name);
  } catch {
    removed = false;
  }
  return { ok: false, moment, removed };
}

/**
 * An index that can be made again from its source (R42). After a restore it is never read as it stands: a file whose
 * flag is wrong is removed and `rebuild` runs; a file that reads right is still handed back only through `read`.
 * `restored` true means the phone says this file came with a restore: it is rebuilt even if its flag reads right.
 */
export function indexAfterRestore<T>(
  port: FlagPort,
  name: string,
  x: { restored: boolean; read: () => T; rebuild: () => T },
): { value: T; source: 'read' | 'rebuilt' } {
  const v = readBackFlag(port, name, 'restore');
  if (!v.ok || x.restored) {
    if (v.ok) {
      try {
        port.remove(name);
      } catch {
        // the rebuild writes over it
      }
    }
    return { value: x.rebuild(), source: 'rebuilt' };
  }
  return { value: x.read(), source: 'read' };
}

/** The strip pass again before the first display of a restored picture (R43). Null means do not show it. */
export function stripBeforeDisplay(bytes: Uint8Array): Uint8Array | null {
  const r = stripJpeg(bytes);
  if (!r.ok || carriesMetadata(r.bytes)) return null;
  return r.bytes;
}
