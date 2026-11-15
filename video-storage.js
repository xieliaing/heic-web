// Local temporary results, shared by conversion jobs in this page. A Web Lock
// leases the session directory until the page closes, including while the
// FFmpeg worker is recycled. Other tabs only remove abandoned sessions.
const ROOT = 'heicquick-video';
const LOCK = 'heicquick-video:';

export async function createVideoStorageSession() {
  // createSyncAccessHandle is only exposed inside dedicated workers. Its
  // availability is checked when prepare opens the job, not on the main thread.
  if (!navigator.storage?.getDirectory) return null;

  const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(ROOT, { create: true });
  const name = 'session-' + crypto.randomUUID();
  let release;
  if (navigator.locks) {
    await new Promise((resolve, reject) => {
      navigator.locks.request(LOCK + name, async () => {
        const held = new Promise(r => { release = r; });
        resolve();
        await held;
      }).catch(reject);
    });
  }
  let directory;
  try {
    directory = await root.getDirectoryHandle(name, { create: true });
    if (navigator.locks) {
      for await (const [oldName, handle] of root.entries()) {
        if (oldName === name || handle.kind !== 'directory' || !/^session-[0-9a-f-]+$/.test(oldName)) continue;
        await navigator.locks.request(LOCK + oldName, { ifAvailable: true }, async lock => {
          if (lock) await root.removeEntry(oldName, { recursive: true }).catch(() => {});
        });
      }
    }
  } catch (err) {
    if (release) release();
    throw err;
  }
  return {
    async createJob() {
      const estimate = await navigator.storage.estimate().catch(() => ({}));
      // Estimates are advisory, not reservations. Still catch quota failures
      // on every actual write; output size cannot be inferred from input size.
      if (estimate.quota && estimate.quota - (estimate.usage || 0) < 64 * 1024 ** 2) {
        throw Object.assign(new Error('Not enough free local storage'), { code: 'STORAGE_FULL' });
      }
      const id = 'job-' + crypto.randomUUID();
      try {
        return { id, directory: await directory.getDirectoryHandle(id, { create: true }) };
      } catch (err) {
        throw Object.assign(new Error(err.message), { code: err.name === 'QuotaExceededError' ? 'STORAGE_FULL' : 'STORAGE_IO' });
      }
    },
    async removeJob(job) {
      // Worker termination releases OPFS locks asynchronously in some browsers.
      for (let attempt = 0; attempt < 5; attempt++) {
        try { await directory.removeEntry(job.id, { recursive: true }); return; }
        catch (err) {
          if (err.name === 'NotFoundError') return;
          if (attempt === 4) throw err;
          await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        }
      }
    },
  };
}
