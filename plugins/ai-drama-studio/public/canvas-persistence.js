// Capture destination IDs at scheduling time. Never resolve an active creation after a delay.
export function createCanvasPersistence(write, reportError, delay = 350) {
  const entries = new Map();
  function schedule(projectId, creationId, canvas) {
    const key = `${projectId}/${creationId}`;
    let entry = entries.get(key);
    if (!entry) { entry = { chain: Promise.resolve(), timer: null, version: 0, pending: null }; entries.set(key, entry); }
    clearTimeout(entry.timer);
    const snapshot = structuredClone(canvas);
    entry.pending = snapshot;
    const version = ++entry.version;
    entry.timer = setTimeout(() => {
      entry.timer = null;
      entry.chain = entry.chain.then(() => write(projectId, creationId, snapshot)).then(() => {
        if (entry.version === version) entry.pending = null;
      }).catch(reportError);
    }, delay);
  }
  return { schedule, pending: (projectId, creationId) => entries.get(`${projectId}/${creationId}`)?.pending };
}
