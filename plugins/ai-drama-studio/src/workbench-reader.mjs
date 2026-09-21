import { Worker } from "node:worker_threads";

// One read-only worker shares each file revision; it never participates in writes.
export function createWorkbenchReader() {
  let worker, sequence = 0;
  const pending = new Map();
  function fail(error) {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  }
  return {
    read(kind, filters = {}) {
      if (!worker) {
        const current = new Worker(new URL("./workbench-reader-worker.mjs", import.meta.url), { execArgv: [] });
        worker = current;
        current.on("message", ({ id, result, error }) => {
          const request = pending.get(id);
          if (!request) return;
          pending.delete(id);
          if (error) request.reject(new Error(error)); else request.resolve(result);
          if (!pending.size) current.unref();
        });
        current.on("error", fail);
        current.on("exit", () => { if (worker === current) { worker = null; fail(new Error("WORKBENCH_READER_STOPPED")); } });
      }
      const id = ++sequence;
      worker.ref();
      return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); worker.postMessage({ id, kind, filters }); });
    },
    async close() {
      const current = worker;
      worker = null;
      fail(new Error("WORKBENCH_READER_STOPPED"));
      if (current) await current.terminate();
    }
  };
}
