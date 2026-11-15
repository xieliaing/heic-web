/* Seekable OPFS files for the pinned Emscripten FS runtime. Loaded by the worker.
 * Files are opened asynchronously before exec(); all operations during FFmpeg
 * execution are synchronous. Only this job's predeclared files are writable.
 */
(function () {
  'use strict';

  function createVideoDiskFS(FS, files, checkCancelled = () => {}) {
    const E = { IO: 29, INVAL: 28, NOENT: 44, NOSPC: 51, PERM: 63 };
    const CHUNK = 1024 * 1024;
    // OPFS does not accept SharedArrayBuffer views on every browser. This also
    // bounds each I/O call when the multithreaded core supplies its shared heap.
    const buffer = new Uint8Array(CHUNK);
    const stats = { bytesRead: 0, bytesWritten: 0, maxReadPosition: 0, maxWritePosition: 0, maxReadLength: 0, maxWriteLength: 0 };
    let failure = null;
    function fail(code) { throw new FS.ErrnoError(code); }
    function io(fn) {
      try { checkCancelled(); return fn(); }
      catch (err) {
        if (err.code === 'CANCELLED') throw err;
        if (err instanceof FS.ErrnoError) throw err;
        const quota = err && err.name === 'QuotaExceededError';
        failure = { code: quota ? 'STORAGE_FULL' : 'STORAGE_IO', message: String(err.message || err) };
        fail(quota ? E.NOSPC : E.IO);
      }
    }
    function position(value) {
      if (!Number.isSafeInteger(value) || value < 0) fail(E.INVAL);
      return value;
    }
    const nodeOps = {
      getattr(node) {
        const size = node.diskFile ? io(() => node.diskFile.access.getSize()) : 4096;
        return { dev: 1, ino: node.id, mode: node.mode, nlink: 1, uid: 0, gid: 0,
          rdev: 0, size, atime: new Date(node.timestamp), mtime: new Date(node.timestamp),
          ctime: new Date(node.timestamp), blksize: 4096, blocks: Math.ceil(size / 4096) };
      },
      setattr(node, attr) {
        if (attr.size !== undefined) {
          if (!node.diskFile) fail(E.PERM);
          io(() => node.diskFile.access.truncate(position(attr.size)));
        }
        if (attr.mode !== undefined) node.mode = attr.mode;
        if (attr.timestamp !== undefined) node.timestamp = attr.timestamp;
      },
      lookup(parent, name) { return parent.contents[name] || fail(E.NOENT); },
      readdir(node) { return ['.', '..', ...Object.keys(node.contents)]; },
      mknod() { fail(E.PERM); },
      rename() { fail(E.PERM); },
      unlink() { fail(E.PERM); },
      rmdir() { fail(E.PERM); },
      symlink() { fail(E.PERM); },
    };
    const streamOps = {
      llseek(stream, offset, whence) {
        if (![0, 1, 2].includes(whence)) fail(E.INVAL);
        return position(offset + (whence === 1 ? stream.position : whence === 2
          ? io(() => stream.node.diskFile.access.getSize()) : 0));
      },
      read(stream, heap, offset, length, at) {
        position(at);
        return io(() => {
          stats.maxReadLength = Math.max(stats.maxReadLength, length);
          if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > heap.length) {
            throw new Error(`Invalid read buffer: ${offset} + ${length} / ${heap.length}`);
          }
          let total = 0;
          while (total < length) {
            const view = buffer.subarray(0, Math.min(CHUNK, length - total));
            const count = stream.node.diskFile.access.read(view, { at: at + total });
            if (!Number.isSafeInteger(count) || count < 0 || count > view.length) throw new Error(`Invalid disk read result: ${count} / ${view.length}`);
            if (!count) break;
            heap.set(view.subarray(0, count), offset + total);
            total += count;
            stats.bytesRead += count;
            stats.maxReadPosition = Math.max(stats.maxReadPosition, at + total);
          }
          return total;
        });
      },
      write(stream, heap, offset, length, at) {
        position(at);
        return io(() => {
          stats.maxWriteLength = Math.max(stats.maxWriteLength, length);
          if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > heap.length) {
            throw new Error(`Invalid write buffer: ${offset} + ${length} / ${heap.length}, file position ${at}`);
          }
          let total = 0;
          while (total < length) {
            const count = Math.min(CHUNK, length - total);
            buffer.set(heap.subarray(offset + total, offset + total + count));
            const written = stream.node.diskFile.access.write(buffer.subarray(0, count), { at: at + total });
            if (!Number.isSafeInteger(written) || written <= 0 || written > count) throw new Error(`Invalid disk write result: ${written} / ${count} at ${at + total}`);
            total += written;
            stats.bytesWritten += written;
            stats.maxWritePosition = Math.max(stats.maxWritePosition, at + total);
          }
          stream.node.timestamp = Date.now();
          return total;
        });
      },
      fsync(stream) { return io(() => { stream.node.diskFile.access.flush(); return 0; }); },
    };
    return {
      get failure() { return failure; },
      stats,
      mount() {
        const root = FS.createNode(null, '/', 0o40700, 0);
        root.node_ops = nodeOps;
        root.timestamp = Date.now();
        root.contents = Object.create(null);
        for (const [name, diskFile] of files) {
          const node = FS.createNode(root, name, 0o100600, 0);
          node.node_ops = nodeOps;
          node.stream_ops = streamOps;
          node.timestamp = Date.now();
          node.diskFile = diskFile;
          root.contents[name] = node;
        }
        return root;
      },
    };
  }
  self.createVideoDiskFS = createVideoDiskFS;
})();
