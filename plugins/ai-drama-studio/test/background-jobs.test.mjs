import assert from "node:assert/strict";
import test from "node:test";
import { launchBackground, drainBackgroundJobs, stopBackgroundJobs, shutdownSignal, backgroundJobStatus } from "../src/background-jobs.mjs";

test("owned background work records failures, drains and rejects work after shutdown", async () => {
  let finished = false;
  launchBackground(async () => { await Promise.resolve(); finished = true; });
  launchBackground(async () => { throw new Error("ISOLATED_TEST_FAILURE"); });
  await drainBackgroundJobs();
  assert.equal(finished, true);
  assert.equal(backgroundJobStatus().running, 0);
  assert.equal(backgroundJobStatus().failures[0].code, "ISOLATED_TEST_FAILURE");
  launchBackground(() => new Promise(resolve => shutdownSignal.addEventListener("abort", resolve, { once: true })));
  await Promise.resolve();
  stopBackgroundJobs();
  await drainBackgroundJobs();
  assert.equal(backgroundJobStatus().running, 0);
  assert.throws(() => launchBackground(() => {}), /BACKGROUND_SHUTDOWN/);
});
