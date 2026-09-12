import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-rename-contention-"));
process.env.AI_DRAMA_DATA_DIR = root;
const { readState, mutateState } = await import("../src/store.mjs");
const realRename = fs.rename;
after(async () => {
  fs.rename = realRename;
  await fs.rm(root, { recursive: true, force: true });
});

test("a transient Windows read handle longer than the old rename window does not lose a state mutation", async () => {
  await readState();
  let attempts = 0;
  fs.rename = async (from, to) => {
    assert.equal(path.dirname(from), root);
    assert.equal(to, path.join(root, "state.json"));
    if (++attempts <= 9) throw Object.assign(new Error("fixture sharing violation"), { code: "EPERM" });
    return realRename(from, to);
  };
  try {
    await mutateState(state => { state.renameContentionFixture = true; });
    assert.equal(attempts, 10);
    assert.equal((await readState()).renameContentionFixture, true);
  } finally { fs.rename = realRename; }
});

test("a non-transient rename error is not retried and leaves previous state readable", async () => {
  let attempts = 0;
  fs.rename = async () => {
    attempts++;
    throw Object.assign(new Error("fixture invalid target"), { code: "ENOENT" });
  };
  try {
    await assert.rejects(mutateState(state => { state.invalidRenameFixture = true; }), { code: "ENOENT" });
    assert.equal(attempts, 1);
    assert.equal((await readState()).invalidRenameFixture, undefined);
  } finally { fs.rename = realRename; }
});

test("transient lock-file sharing violations are retried without bypassing ownership", async () => {
  const realOpen = fs.open;
  let attempts = 0;
  fs.open = async (file, flags, ...rest) => {
    if (file === path.join(root, "state.lock") && flags === "wx" && ++attempts <= 3) {
      throw Object.assign(new Error("fixture lock sharing violation"), { code: "EPERM" });
    }
    return realOpen(file, flags, ...rest);
  };
  try {
    await mutateState(state => { state.lockContentionFixture = true; });
    assert.equal(attempts, 4);
    assert.equal((await readState()).lockContentionFixture, true);
    await assert.rejects(fs.access(path.join(root, "state.lock")), { code: "ENOENT" });
  } finally { fs.open = realOpen; }
});

test("own lock release retries a temporary Windows sharing violation", async () => {
  const realRm = fs.rm;
  let attempts = 0;
  fs.rm = async (file, options) => {
    if (file === path.join(root, "state.lock") && ++attempts <= 3) {
      throw Object.assign(new Error("fixture release sharing violation"), { code: "EPERM" });
    }
    return realRm(file, options);
  };
  try {
    await mutateState(state => { state.releaseContentionFixture = true; });
    assert.equal(attempts, 4);
    await assert.rejects(fs.access(path.join(root, "state.lock")), { code: "ENOENT" });
    assert.equal((await readState()).releaseContentionFixture, true);
  } finally { fs.rm = realRm; }
});
