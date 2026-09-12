import assert from "node:assert/strict";
import test from "node:test";
import { compareFrameMd5, parseFrameMd5 } from "../scripts/verify-frame-preservation.mjs";

const hashA = "a".repeat(32);
const hashB = "b".repeat(32);
const manifest = (rows, dimensions = "1920x1080") => `#hash: MD5\n#tb 0: 1/24\n#media_type 0: video\n#dimensions 0: ${dimensions}\n${rows.map(([pts, hash]) => `0, ${pts}, ${pts}, 1, 3110400, ${hash}`).join("\n")}\n`;
const source = manifest([[0, hashA], [1, hashB]]);

test("same frames allow a constant packaging PTS offset", () => {
  assert.equal(compareFrameMd5(source, manifest([[540, hashA], [541, hashB]]), 2).passed, true);
});
test("changed frame, swapped order and timeline gap cannot pass", () => {
  for (const rows of [[[0, hashB], [1, hashB]], [[0, hashB], [1, hashA]], [[0, hashA], [2, hashB]]]) {
    assert.equal(compareFrameMd5(source, manifest(rows), 2).passed, false);
  }
});
test("identically truncated manifests do not pass the expected count", () => {
  assert.throws(() => compareFrameMd5(source, source, 3), /frame count/);
});
test("resolution and time-base mismatch cannot be called preservation", () => {
  assert.throws(() => compareFrameMd5(source, manifest([[0, hashA], [1, hashB]], "3840x2160"), 2), /mismatch/);
  assert.throws(() => compareFrameMd5(source, source.replace("1/24", "1/25"), 2), /mismatch/);
});
test("empty, malformed, multi-stream and overlapping rows are rejected", () => {
  for (const text of [manifest([]), source.replace(hashA, "bad"), source.replace("0, 1,", "1, 1,"), manifest([[0, hashA], [0, hashB]])]) {
    assert.throws(() => parseFrameMd5(text));
  }
});
test("missing or invalid metadata and invalid counts cannot pass", () => {
  assert.throws(() => parseFrameMd5(source.replace("#hash: MD5", "#hash: SHA256")));
  assert.throws(() => parseFrameMd5(source.replace("1/24", "1/0")));
  for (const count of [0, -1, NaN, 1.5]) assert.throws(() => compareFrameMd5(source, source, count));
});
