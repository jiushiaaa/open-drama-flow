const running = new Set();
const failures = [];
const shutdown = new AbortController();
export const shutdownSignal = shutdown.signal;
export function stopBackgroundJobs() { shutdown.abort(new Error("BACKGROUND_SHUTDOWN")); }

// Keep ownership of detached work: callers can drain it before teardown/shutdown.
export function launchBackground(operation) {
  if (shutdownSignal.aborted) throw new Error("BACKGROUND_SHUTDOWN");
  const task = Promise.resolve().then(operation).catch(error => {
    failures.push({ code: String(error?.code || error?.message || "BACKGROUND_TASK_FAILED"), at: new Date().toISOString() });
    if (failures.length > 100) failures.shift();
  }).finally(() => running.delete(task));
  running.add(task);
}

export async function drainBackgroundJobs() {
  while (running.size) await Promise.all([...running]);
}

export function backgroundJobStatus() { return { running: running.size, failures: [...failures] }; }
