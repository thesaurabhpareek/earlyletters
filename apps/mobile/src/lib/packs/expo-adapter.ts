/**
 * Device ports for the pack engine: expo-file-system for files and Range
 * downloads, expo-crypto (native) or a sliced JS hash for SHA-256, and
 * expo-network for Wi-Fi detection. Everything here is thin; the logic and
 * its tests live in engine.ts.
 *
 * Verified against the installed sources (expo-file-system 57.0.7,
 * expo-crypto 57.0.3, expo-network 57.0.2):
 *  - `File.downloadFileAsync(url, file, { headers, idempotent, signal, onProgress })`
 *    rejects on non-2xx (ios/FileSystemDownload.swift) and overwrites with
 *    `idempotent: true`;
 *  - `File.open(FileMode.ReadOnly | FileMode.Append)` returns a FileHandle
 *    with `readBytes`, `writeBytes`, `size`, `close`;
 *  - `Directory.move` to a path that does not exist renames the directory
 *    (FileSystemPath.swift `getMoveOrCopyPath`), one `moveItem` call;
 *  - `Crypto.digest(SHA256, bytes)` hashes in native code but needs the
 *    whole file in memory, so it is used up to 32 MB only.
 */
import { requireOptionalNativeModule } from 'expo';
import * as Crypto from 'expo-crypto';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import { createSha256 } from '@scribe/api';
import type { Connection, NetworkPort, PackFs, PackHttp } from './engine';

const SLICE_BYTES = 1024 * 1024;
const NATIVE_DIGEST_MAX_BYTES = 32 * 1024 * 1024;

/** Optional native streaming hash (requested from the ScribeFiles owner: CryptoKit, about 1 GB/s). Used when present. */
const NativeHash = requireOptionalNativeModule<{ sha256File?: (uri: string) => Promise<string> }>('ScribeFiles');

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function abortError(): Error {
  const e = new Error('aborted');
  e.name = 'AbortError';
  return e;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export class ExpoPackFs implements PackFs {
  constructor(readonly root: string) {}

  join(...parts: string[]): string {
    return parts.map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, ''))).join('/');
  }

  private info(path: string) {
    try {
      return Paths.info(path);
    } catch {
      return { exists: false, isDirectory: null };
    }
  }

  exists(path: string): boolean {
    return this.info(path).exists;
  }

  isDirectory(path: string): boolean {
    const i = this.info(path);
    return i.exists && i.isDirectory === true;
  }

  fileSize(path: string): number | null {
    const i = this.info(path);
    if (!i.exists || i.isDirectory) return null;
    try {
      return new File(path).size;
    } catch {
      return null;
    }
  }

  mkdirp(path: string): void {
    new Directory(path).create({ intermediates: true, idempotent: true });
  }

  remove(path: string): void {
    const i = this.info(path);
    if (!i.exists) return;
    if (i.isDirectory) new Directory(path).delete();
    else new File(path).delete();
  }

  rename(from: string, to: string): void {
    if (this.exists(to)) throw new Error('target_exists');
    if (this.isDirectory(from)) new Directory(from).moveSync(new Directory(to));
    else new File(from).moveSync(new File(to));
  }

  list(dir: string): string[] {
    if (!this.isDirectory(dir)) return [];
    return new Directory(dir)
      .list()
      .map((e) => e.name)
      .sort();
  }

  readText(path: string): string | null {
    if (!this.exists(path)) return null;
    try {
      return new File(path).textSync();
    } catch {
      return null;
    }
  }

  writeText(path: string, text: string): void {
    const f = new File(path);
    if (!f.exists) f.create();
    f.write(text);
  }

  async appendFile(from: string, to: string): Promise<void> {
    const dest = new File(to);
    if (!dest.exists) dest.create();
    const src = new File(from).open(FileMode.ReadOnly);
    const out = dest.open(FileMode.Append);
    try {
      let remaining = src.size ?? 0;
      while (remaining > 0) {
        const bytes = src.readBytes(Math.min(SLICE_BYTES, remaining));
        if (bytes.length === 0) break;
        out.writeBytes(bytes);
        remaining -= bytes.length;
        await tick();
      }
    } finally {
      src.close();
      out.close();
    }
  }

  async sha256(path: string, signal?: AbortSignal): Promise<string> {
    if (NativeHash?.sha256File) return (await NativeHash.sha256File(path)).toLowerCase();
    const file = new File(path);
    const size = file.size;
    if (size <= NATIVE_DIGEST_MAX_BYTES) {
      const bytes = await file.bytes();
      return toHex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
    }
    // Large file without the native hash: slices on the JS thread, yielding between them so the UI stays responsive.
    const hash = createSha256();
    const handle = file.open(FileMode.ReadOnly);
    try {
      let remaining = handle.size ?? 0;
      while (remaining > 0) {
        if (signal?.aborted) throw abortError();
        const bytes = handle.readBytes(Math.min(SLICE_BYTES, remaining));
        if (bytes.length === 0) break;
        hash.update(bytes);
        remaining -= bytes.length;
        await tick();
      }
    } finally {
      handle.close();
    }
    return hash.digestHex();
  }

  freeBytes(): number | null {
    try {
      const n = Paths.availableDiskSpace;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }
}

export const expoPackHttp: PackHttp = {
  async downloadRange(url, dest, start, end, opts) {
    const file = new File(dest);
    // A per-request timeout on top of the caller's cancel signal.
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    opts.signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
    try {
      await File.downloadFileAsync(url, file, {
        headers: { Range: `bytes=${start}-${end}`, 'Accept-Encoding': 'identity' },
        idempotent: true,
        signal: ctrl.signal,
        onProgress: (p) => opts.onBytes?.(p.bytesWritten),
      });
    } catch (e) {
      if (opts.signal.aborted) throw abortError();
      throw e;
    } finally {
      clearTimeout(timer);
      opts.signal.removeEventListener('abort', onAbort);
    }
  },
};

function toConnection(state: Network.NetworkState): Connection {
  if (state.isConnected === false || state.type === Network.NetworkStateType.NONE) return 'none';
  switch (state.type) {
    case Network.NetworkStateType.WIFI:
    case Network.NetworkStateType.ETHERNET:
      return 'wifi';
    case Network.NetworkStateType.CELLULAR:
      return 'cellular';
    default:
      // VPN, Bluetooth, unknown: treated as metered, so large packs wait for a known Wi-Fi network.
      return 'unknown';
  }
}

export const expoNetwork: NetworkPort = {
  async connection() {
    try {
      return toConnection(await Network.getNetworkStateAsync());
    } catch {
      return 'unknown';
    }
  },
  subscribe(listener) {
    try {
      const sub = Network.addNetworkStateListener((s) => listener(toConnection(s)));
      return () => sub.remove();
    } catch {
      return () => undefined;
    }
  },
};
