/**
 * BL-464. A stand-in for the browser's Origin Private File System, enough for wa-sqlite's AccessHandlePoolVFS:
 * directory and file handles, and sync access handles that are exclusive per file, as in Chromium. Everything is in
 * memory. `endPage(owner)` is a page going away: the browser closes every access handle its worker held. Plain
 * JavaScript because a worker thread loads it (test/helpers/web-sqlite-worker.mjs).
 */
const view = (b) => (b instanceof Uint8Array ? b : new Uint8Array(b.buffer, b.byteOffset, b.byteLength));

class FileHandle {
  kind = 'file';
  data = new Uint8Array(0);
  open = null;
  constructor(fs, name) {
    this.fs = fs;
    this.name = name;
  }
  async createSyncAccessHandle() {
    if (this.open) throw Object.assign(new Error('another open Access Handle'), { name: 'NoModificationAllowedError' });
    const f = this;
    const h = {
      read(b, { at = 0 } = {}) {
        const v = view(b);
        const s = f.data.subarray(at, at + v.length);
        v.fill(0);
        v.set(s);
        return s.length;
      },
      write(b, { at = 0 } = {}) {
        const v = view(b);
        if (at + v.length > f.data.length) {
          const grown = new Uint8Array(at + v.length);
          grown.set(f.data);
          f.data = grown;
        }
        f.data.set(v, at);
        return v.length;
      },
      getSize: () => f.data.length,
      truncate(n) {
        const d = new Uint8Array(n);
        d.set(f.data.subarray(0, n));
        f.data = d;
      },
      flush() {},
      close() {
        if (f.open === h) f.open = null;
      },
    };
    this.open = h;
    this.fs.handles.push({ owner: this.fs.owner, h });
    return h;
  }
}

class DirectoryHandle {
  kind = 'directory';
  entries = new Map();
  constructor(fs) {
    this.fs = fs;
  }
  async getDirectoryHandle(name, { create } = {}) {
    if (!this.entries.has(name)) {
      if (!create) throw Object.assign(new Error('not found'), { name: 'NotFoundError' });
      this.entries.set(name, new DirectoryHandle(this.fs));
    }
    return this.entries.get(name);
  }
  async getFileHandle(name, { create } = {}) {
    if (!this.entries.has(name)) {
      if (!create) throw Object.assign(new Error('not found'), { name: 'NotFoundError' });
      this.fs.beforeCreate();
      this.entries.set(name, new FileHandle(this.fs, name));
    }
    return this.entries.get(name);
  }
  async removeEntry(name) {
    this.entries.delete(name);
  }
  async *[Symbol.asyncIterator]() {
    for (const entry of [...this.entries]) yield entry;
  }
}

export function opfsStandin() {
  const fs = { owner: 'page 1', handles: [], beforeCreate() {} };
  const root = new DirectoryHandle(fs);
  return {
    storage: { getDirectory: async () => root },
    /** Who opens access handles from now on. */
    setOwner(owner) {
      fs.owner = owner;
    },
    /** Called before each new file is made; throwing from it ends the page at that point. */
    setBeforeCreate(fn) {
      fs.beforeCreate = fn;
    },
    endPage(owner) {
      for (const x of fs.handles) if (x.owner === owner) x.h.close();
      fs.handles = fs.handles.filter((x) => x.owner !== owner);
    },
    /** File names in one directory of the stand-in (the pool VFS keeps its files in a directory named after it). */
    files: (dir) => [...(root.entries.get(dir)?.entries.keys() ?? [])],
  };
}
