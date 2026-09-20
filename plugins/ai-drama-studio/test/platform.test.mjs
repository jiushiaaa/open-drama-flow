import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { platformPaths, hostProfile } from "../src/platform.mjs";
import { keychain } from "../src/keychain.mjs";

test("platform paths preserve Windows credentials and use macOS Application Support", () => {
  assert.deepEqual(platformPaths("win32", { LOCALAPPDATA: "C:\\Users\\a\\AppData\\Local" }, "C:\\Users\\a"), {
    runtimeRoot: "C:\\Users\\a\\AppData\\Local\\OpenDramaFlow", secretDir: "C:\\Users\\a\\AppData\\Local\\AIDramaStudio"
  });
  assert.equal(platformPaths("darwin", { LOCALAPPDATA: "ignored" }, "/Users/用户").runtimeRoot, "/Users/用户/Library/Application Support/OpenDramaFlow");
  assert.equal(platformPaths("win32", {}, "C:\\Users\\a").secretDir, "C:\\Users\\a\\AppData\\Local\\AIDramaStudio");
});
test("host policy preserves Codex and requires API images elsewhere", () => {
  assert.equal(hostProfile({}).imageProvider, "codex-imagegen");
  assert.deepEqual(hostProfile({ AI_DRAMA_AGENT_HOST: "generic" }), { host: "generic", codexImageGen: false, imageProvider: "ark-seedream" });
  assert.throws(() => hostProfile({ AI_DRAMA_AGENT_HOST: "bad" }), /AGENT_HOST_INVALID/);
});
test("Keychain writes secret over stdin, verifies exact bytes, never exposes it in argv", async () => {
  const secret = 'fixture-12345"\\token', calls = [];
  await keychain("protect", "test.key", secret, async (args, input) => {
    calls.push({ args, input });
    return { code: 0, stdout: args[0] === "find-generic-password" ? `${secret}\n` : "" };
  });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].args, ["-i", "-q"]);
  assert.ok(calls[0].input.includes(Buffer.from(secret).toString("hex")));
  assert.ok(calls.every(c => !JSON.stringify(c.args).includes(secret)));
  assert.ok(!calls[0].input.includes(" -A"));
  await assert.rejects(keychain("protect", "test.key", secret, async () => ({ code: 0, stdout: "different" })), /VERIFY_FAILED/);
});
test("Keychain distinguishes missing from locked/denied and rejects command injection", async () => {
  assert.equal(await keychain("exists", "test.key", "", async () => ({ code: 44 })), false);
  assert.equal(await keychain("clear", "test.key", "", async () => ({ code: 44 })), "");
  await assert.rejects(keychain("exists", "test.key", "", async () => ({ code: 36 })), /ACCESS_FAILED/);
  await assert.rejects(keychain("protect", "test.key", "key\nhelp"), /VALUE_INVALID/);
  await assert.rejects(keychain("exists", "test.key;help"), /NAME_INVALID/);
});
test("macOS native Keychain round trip with disposable service only", { skip: process.platform !== "darwin" }, async () => {
  const service = `test-${randomUUID()}`, value = `fixture-${randomUUID()}`;
  try {
    assert.equal(await keychain("exists", service), false);
    await keychain("protect", service, value);
    assert.equal(await keychain("unprotect", service), value);
    await keychain("protect", service, `${value}-updated`);
    assert.equal(await keychain("unprotect", service), `${value}-updated`);
  } finally { await keychain("clear", service); }
  assert.equal(await keychain("exists", service), false);
});
