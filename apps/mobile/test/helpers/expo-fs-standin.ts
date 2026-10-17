/// <reference types="node" />
/**
 * An in-memory stand-in for expo-file-system 57 (File, Directory, Paths, FileMode), laid out the way
 * the app's data container is on a phone, so tests can drive the code that walks and deletes the
 * app's files (the launch sweep, erase, "Export what is readable") instead of feeding a planner a
 * hand-made list. It keeps to what the native module does where that code depends on it:
 * - a Directory uri ends with '/', a File uri does not; `new Directory(Paths.document, 'ExpoAudio')`
 *   joins like Paths.join;
 * - list() returns the folder's direct children only (iOS contentsOfDirectory), as File and Directory
 *   instances, and throws when the folder does not exist;
 * - a File for a missing path says exists false; delete() of a missing file throws;
 * - a folder in `unreadable` exists but its list() throws, as a read error would on iOS; one in
 *   `listsAsEmpty` lists as empty, as an unreadable folder does on Android.
 *
 * Where expo-audio 57 puts a take (`directory: 'document'`): iOS `<Documents>/ExpoAudio/recording-<UUID>.m4a`
 * (ios/AudioUtils.swift createRecordingUrl), Android `<files>/Audio/recording-<UUID>.m4a`
 * (AudioRecorder.kt createRecordingFilePath). `recorderFor` writes takes there the same way.
 * Fictional data only.
 */
import { randomUUID } from 'node:crypto';

export interface Disk {
  /** Every file, by uri (no trailing slash). */
  files: Map<string, { data: Uint8Array; createdMs: number }>;
  /** Every folder, by uri without the trailing slash. */
  dirs: Set<string>;
  /** This container's Documents (iOS) or files (Android) folder, with a trailing slash. */
  documents: string;
  /** This container's Caches folder, with a trailing slash. */
  caches: string;
  os: 'ios' | 'android';
  /** Folders (uri without the trailing slash) that exist but whose list() fails, as a read error would on iOS. */
  unreadable: Set<string>;
  /**
   * Folders whose list() returns nothing although files are there: expo-file-system on Android
   * (JavaFile.listFilesAsUnified) gives an empty list when java.io.File.listFiles() returns null.
   */
  listsAsEmpty: Set<string>;
}

export interface Container {
  documents: string;
  caches: string;
  os: 'ios' | 'android';
}

/** An iOS app data container. iOS can give the app a new one across updates and reinstalls. */
export function iosContainer(id: string): Container {
  const root = `file:///var/mobile/Containers/Data/Application/${id}`;
  return { documents: `${root}/Documents/`, caches: `${root}/Library/Caches/`, os: 'ios' };
}

/** An Android app data folder. The package name is a neutral stand-in, not the app's (packages/brand owns that). */
export function androidContainer(): Container {
  const root = 'file:///data/user/0/org.example.standin';
  return { documents: `${root}/files/`, caches: `${root}/cache/`, os: 'android' };
}

const strip = (u: string) => u.replace(/\/+$/, '');
const asUri = (u: string) => (u.startsWith('/') ? `file://${u}` : u);
const parentOf = (u: string) => strip(u).slice(0, strip(u).lastIndexOf('/'));

function joinParts(parts: (string | { uri: string })[]): string {
  const [first = '', ...rest] = parts.map((p) => (typeof p === 'string' ? p : p.uri));
  let out = strip(asUri(first));
  for (const r of rest) {
    for (const seg of r.split('/').filter(Boolean)) out += `/${encodeURIComponent(seg)}`;
  }
  return out;
}

export function createDisk(c: Container): Disk {
  const disk: Disk = { files: new Map(), dirs: new Set(), documents: c.documents, caches: c.caches, os: c.os, unreadable: new Set(), listsAsEmpty: new Set() };
  mkdirp(disk, c.documents);
  mkdirp(disk, c.caches);
  return disk;
}

export function mkdirp(disk: Disk, uri: string): void {
  let u = strip(uri);
  while (u.length > 'file://'.length) {
    disk.dirs.add(u);
    u = parentOf(u);
  }
}

/** Puts a file on the disk (its folders too). `bytes` is a length (filled with a pattern) or the data. */
export function put(disk: Disk, uri: string, bytes: number | Uint8Array, createdMs = Date.parse('2026-10-03T08:30:00.000Z')): string {
  const data = typeof bytes === 'number' ? Uint8Array.from({ length: bytes }, (_, i) => (i * 31 + 7) & 0xff) : bytes;
  mkdirp(disk, parentOf(uri));
  disk.files.set(strip(uri), { data, createdMs });
  return strip(uri);
}

/** What a fresh install leaves in Documents besides recordings: the database folder and the speech models folder. */
export function layOutApp(disk: Disk): void {
  put(disk, `${disk.documents}SQLite/scribe.db`, 4096);
  put(disk, `${disk.documents}SQLite/scribe.db-wal`, 512);
  put(disk, `${disk.documents}models/ggml-large-v3-turbo-q5_0.bin`, 2048);
}

/** The folder expo-audio writes takes to, in this container. */
export function recorderDir(disk: Disk): string {
  return `${disk.documents}${disk.os === 'android' ? 'Audio' : 'ExpoAudio'}`;
}

/**
 * iOS moved the app to a new data container (an update or a reinstall): every file keeps its place
 * under the container, and the container's path changes.
 */
export function moveContainer(disk: Disk, to: Container): void {
  const from = strip(disk.documents.replace(/\/Documents\/$|\/files\/$/, ''));
  const dest = strip(to.documents.replace(/\/Documents\/$|\/files\/$/, ''));
  const move = (u: string) => (u === from || u.startsWith(`${from}/`) ? dest + u.slice(from.length) : u);
  disk.files = new Map([...disk.files].map(([u, f]) => [move(u), f]));
  disk.dirs = new Set([...disk.dirs].map(move));
  disk.documents = to.documents;
  disk.caches = to.caches;
  mkdirp(disk, to.documents);
}

/** Names of the files directly in a folder. */
export function namesIn(disk: Disk, dir: string): string[] {
  const d = strip(dir);
  return [...disk.files.keys()].filter((u) => parentOf(u) === d).map((u) => decodeURIComponent(u.slice(d.length + 1))).sort();
}

/**
 * A stand-in for expo-audio's AudioRecorder with the parts lib/capture/recorder.ts calls. Like the
 * native recorder it picks `recording-<UUID><extension>` in the recorder folder and creates the file when
 * it prepares; record() is the microphone writing `bytes` of audio. `extension` is the one the recording
 * options name (`.m4a` today, `.aac` for ADTS, capture/recording-format.ts).
 */
export function recorderFor(disk: Disk, bytes = 48_000, extension = '.m4a') {
  return {
    uri: null as string | null,
    async prepareToRecordAsync() {
      this.uri = `${recorderDir(disk)}/recording-${randomUUID().toUpperCase()}${extension}`;
      put(disk, this.uri, 0);
    },
    record() {
      if (this.uri) put(disk, this.uri, bytes);
    },
    async stop() {},
    getStatus: () => ({ durationMillis: 0 }),
  };
}

export const FileMode = { ReadOnly: 'r', WriteOnly: 'w', ReadWrite: 'rw' } as const;

/** The expo-file-system module, over the disk `current()` returns at each call. */
export function expoFileSystem(current: () => Disk) {
  class File {
    readonly uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = joinParts(parts);
    }
    get name(): string {
      return decodeURIComponent(this.uri.slice(this.uri.lastIndexOf('/') + 1));
    }
    get exists(): boolean {
      return current().files.has(this.uri);
    }
    get size(): number {
      return current().files.get(this.uri)?.data.length ?? 0;
    }
    get creationTime(): number | null {
      return current().files.get(this.uri)?.createdMs ?? null;
    }
    get modificationTime(): number | null {
      return this.creationTime;
    }
    async bytes(): Promise<Uint8Array> {
      const f = current().files.get(this.uri);
      if (!f) throw new Error('ERR_FILE_NOT_FOUND');
      return f.data.slice();
    }
    create(opts: { overwrite?: boolean } = {}): void {
      if (this.exists && !opts.overwrite) throw new Error('ERR_FILE_EXISTS');
      put(current(), this.uri, new Uint8Array(0));
    }
    delete(): void {
      if (!current().files.delete(this.uri)) throw new Error('ERR_FILE_NOT_FOUND');
    }
    open(_mode: string) {
      const uri = this.uri;
      return {
        writeBytes(chunk: Uint8Array) {
          const disk = current();
          const old = disk.files.get(uri);
          if (!old) throw new Error('ERR_FILE_NOT_FOUND');
          const next = new Uint8Array(old.data.length + chunk.length);
          next.set(old.data, 0);
          next.set(chunk, old.data.length);
          disk.files.set(uri, { ...old, data: next });
        },
        close() {},
      };
    }
  }

  class Directory {
    readonly uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = `${joinParts(parts)}/`;
    }
    get name(): string {
      const u = strip(this.uri);
      return decodeURIComponent(u.slice(u.lastIndexOf('/') + 1));
    }
    get exists(): boolean {
      return current().dirs.has(strip(this.uri));
    }
    list(): (File | Directory)[] {
      const disk = current();
      const here = strip(this.uri);
      if (!disk.dirs.has(here)) throw new Error('ERR_DIRECTORY_NOT_FOUND');
      if (disk.unreadable.has(here)) throw new Error('ERR_DIRECTORY_READ');
      if (disk.listsAsEmpty.has(here)) return [];
      const dirs = [...disk.dirs].filter((u) => parentOf(u) === here).map((u) => new Directory(u));
      const files = [...disk.files.keys()].filter((u) => parentOf(u) === here).map((u) => new File(u));
      return [...dirs, ...files];
    }
    create(_opts: { intermediates?: boolean; idempotent?: boolean } = {}): void {
      mkdirp(current(), this.uri);
    }
    delete(): void {
      const disk = current();
      const here = strip(this.uri);
      if (!disk.dirs.has(here)) throw new Error('ERR_DIRECTORY_NOT_FOUND');
      for (const u of [...disk.files.keys()]) if (u.startsWith(`${here}/`)) disk.files.delete(u);
      for (const u of [...disk.dirs]) if (u === here || u.startsWith(`${here}/`)) disk.dirs.delete(u);
    }
  }

  const Paths = {
    get document() {
      return new Directory(current().documents);
    },
    get cache() {
      return new Directory(current().caches);
    },
    availableDiskSpace: 64e9,
  };

  return { File, Directory, Paths, FileMode };
}
