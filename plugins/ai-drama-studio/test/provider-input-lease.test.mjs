import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("slow reference bridge preparation is covered by the existing job heartbeat", async () => {
  // Regression guard: ngrok cold start plus three asset probes exceeded the
  // 60-second lease before provider-call reservation. No paid request is made.
  const source = await fs.readFile(new URL("../src/workflow.mjs", import.meta.url), "utf8");
  assert.match(source, /resolvedInputs = await withRealJobHeartbeat\(jobId, runToken, \(\) => resolveProviderInputs\(state, latest\.project, currentShot, approval\)\)/);
  assert.ok(source.indexOf("resolvedInputs = await withRealJobHeartbeat") < source.indexOf("const reservation = await mutateState(next =>", source.indexOf("let resolvedInputs;")));
});
