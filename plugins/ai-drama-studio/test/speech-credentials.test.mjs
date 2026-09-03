import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import test, { after } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-speech-vault-"));
process.env.LOCALAPPDATA = root;
process.env.AI_DRAMA_DATA_DIR = path.join(root, "data");
process.env.AI_DRAMA_PORT = "0";
const secrets = await import("../src/secrets.mjs");
const { startHttpServer } = await import("../src/http-server.mjs");
const { server } = await startHttpServer();
const base = `http://127.0.0.1:${server.address().port}`;
after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(root, { recursive: true, force: true }); });

test("speech vault HTTP save/read-status/clear is isolated, encrypted and persistent", async () => {
  const fakeArk = "fake-only-ark-credential";
  const fakeSpeech = "fake-only-speech-credential";
  assert.equal(await secrets.hasSpeechKey(), false);
  await secrets.saveArkKey(fakeArk);
  const saved = await fetch(`${base}/api/secrets/speech`, { method: "PUT", headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify({ apiKey: fakeSpeech }) });
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), { configured: true });
  const encrypted = await fs.readFile(path.join(root, "AIDramaStudio", "doubao-speech.key"), "utf8");
  assert.ok(!encrypted.includes(fakeSpeech));
  const reloaded = await import(`../src/secrets.mjs?reload=${Date.now()}`);
  assert.equal(await reloaded.readSpeechKey(), fakeSpeech);
  assert.equal(await reloaded.readArkKey(), fakeArk);
  const stateText = await (await fetch(`${base}/api/state`)).text();
  assert.ok(!stateText.includes(fakeSpeech));
  assert.ok(!stateText.includes(fakeArk));
  assert.equal(JSON.parse(stateText).speech.strategy, "seedance-plus-speech");
  assert.equal((await fetch(`${base}/api/secrets/speech`)).status, 404);
  assert.equal((await fetch(`${base}/api/secrets/speech`, { method: "DELETE" })).status, 200);
  assert.equal(await secrets.hasSpeechKey(), false);
  assert.equal(await secrets.readArkKey(), fakeArk);
  const state = await (await fetch(`${base}/api/state`)).json();
  assert.equal(state.speech.strategy, "seedance-native");
});

test("cross-origin, DNS rebinding and non-JSON credential writes are rejected", async () => {
  for (const headers of [{ Origin: "https://attacker.example", "Content-Type": "application/json" }, { "Content-Type": "text/plain" }]) {
    const response = await fetch(`${base}/api/secrets/speech`, { method: "PUT", headers, body: JSON.stringify({ apiKey: "fake-only-credential" }) });
    assert.equal(response.status, 403);
  }
  const reboundStatus = await new Promise((resolve, reject) => {
    const request = http.request(`${base}/api/secrets/speech`, { method: "DELETE", headers: { Host: "attacker.example" } }, response => { response.resume(); resolve(response.statusCode); });
    request.on("error", reject); request.end();
  });
  assert.equal(reboundStatus, 403);
  assert.equal(await secrets.hasSpeechKey(), false);
});

test("new speech tools use actual MCP elicitation; decline makes zero provider calls; HTTP cannot approve", async () => {
  await secrets.saveSpeechKey("fake-only-mcp-key");
  let forms = 0;
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.resolve("src/mcp-server.mjs")], env: { ...process.env }, stderr: "pipe" });
  transport.stderr?.resume();
  const client = new Client({ name: "speech-fixture", version: "1" }, { capabilities: { elicitation: { form: {} } } });
  client.setRequestHandler(ElicitRequestSchema, async request => {
    forms++;
    assert.match(request.params.message, /TTS/);
    assert.match(request.params.message, /最多 1 次/);
    assert.ok(!request.params.message.includes("fake-only-mcp-key"));
    return { action: "decline" };
  });
  const value = result => { assert.notEqual(result.isError, true, JSON.stringify(result)); return result.structuredContent || JSON.parse(result.content[0].text); };
  try {
    await client.connect(transport);
    value(await client.callTool({ name: "drama_set_execution_mode", arguments: { mode: "manual" } }));
    const { project } = value(await client.callTool({ name: "drama_create_project", arguments: { title: "Speech MCP fixture" } }));
    const { job } = value(await client.callTool({ name: "drama_request_speech_job", arguments: { projectId: project.id, mode: "tts", text: "测试" } }));
    assert.equal(job.status, "pending");
    const outcome = value(await client.callTool({ name: "drama_authorize_speech_job", arguments: { jobId: job.id } }));
    assert.equal(outcome.job.status, "rejected");
    assert.equal(outcome.job.attempts, 0);
    assert.equal(forms, 1);
    assert.equal((await fetch(`${base}/api/speech/${job.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"confirm":true}' })).status, 404);
    const state = value(await client.callTool({ name: "drama_get_state", arguments: {} }));
    assert.equal(state.providerCalls.length, 0);
  } finally { await client.close(); await transport.close(); await secrets.clearSpeechKey(); }
});
