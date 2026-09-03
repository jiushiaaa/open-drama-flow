import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const root = await fs.mkdtemp(path.join(os.tmpdir(), "odf-multimodal-"));
process.env.AI_DRAMA_DATA_DIR = root;
process.env.LOCALAPPDATA = root; // Fake test credential only. Never read the real account key.
process.env.AI_DRAMA_BRIDGE_PORT = "0";
process.env.AI_DRAMA_ASSET_BRIDGE_BASE_URL = "https://references.invalid";
const workflow = await import("../src/workflow.mjs");
const { readState, mutateState } = await import("../src/store.mjs");
const { mediaCommand } = await import("../src/media-inspection.mjs");
const { closeAssetBridge, ensureAssetRemoteUrl, startAssetBridgeServer } = await import("../src/asset-bridge.mjs");
const { saveArkKey } = await import("../src/secrets.mjs");
const realFetch = globalThis.fetch;
const imagePath = path.join(root, "reference.png"), videoPath = path.join(root, "reference.mp4"), audioPath = path.join(root, "reference.wav");
before(async () => {
  await mediaCommand("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=blue:s=640x640:r=24:d=4", "-f", "lavfi", "-i", "sine=frequency=440:duration=4", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", videoPath]);
  await mediaCommand("ffmpeg", ["-v", "error", "-y", "-i", videoPath, "-frames:v", "1", imagePath]);
  await mediaCommand("ffmpeg", ["-v", "error", "-y", "-i", videoPath, "-vn", audioPath]);
});
after(async () => {
  await workflow.drainBackgroundJobs();
  globalThis.fetch = realFetch;
  closeAssetBridge();
  await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});
const plan = (creationId, shots) => ({ creationId, selectedSkills: ["video-prompting"], premise: "Test fixtures", brief: { objective: "验证参考输入", contentType: "广告", audience: "测试", platform: "本地", durationSeconds: shots.reduce((sum, shot) => sum + shot.duration, 0), aspectRatio: "1:1", deliverables: ["MP4"], acceptanceCriteria: ["版本准确"] }, shots });
const shot = (id, mode, refs = [], extra = {}) => ({ id, prompt: "A cube moves smoothly", generationMode: "seedance", duration: 4, audioMode: "none", videoInputMode: mode, mediaReferences: refs, videoParameters: { ratio: "1:1" }, ...extra });

test("real FFmpeg inspection, conversion, provenance and byte-range bridge", async () => {
  const project = await workflow.createProject({ title: "Media fixtures" });
  const video = await workflow.importLocalAsset(project.id, videoPath);
  const inspection = await workflow.inspectAsset(project.id, video.id);
  assert.equal(inspection.seedanceCompatible, true);
  assert.equal(inspection.signals.audio.audible, true);
  assert.ok(inspection.audioPlayback.sha256);
  assert.ok(inspection.frameEvidence.frames.length >= 3);
  const derivative = await workflow.prepareReferenceAsset(project.id, video.id, { kind: "audio", startSeconds: 1, durationSeconds: 2 });
  assert.equal(derivative.inspection.seedanceCompatible, true);
  assert.equal(derivative.asset.derivedFrom.assetId, video.id);
  assert.notEqual(derivative.asset.familyId, video.familyId);
  const url = await ensureAssetRemoteUrl(project.id, video.id);
  assert.equal(await ensureAssetRemoteUrl(project.id, video.id), url, "do not revoke an in-flight reference token");
  const server = await startAssetBridgeServer();
  const response = await realFetch(`http://127.0.0.1:${server.address().port}${new URL(url).pathname}`, { headers: { Range: "bytes=0-15" } });
  assert.equal(response.status, 206);
  assert.equal((await response.arrayBuffer()).byteLength, 16);
  assert.equal(response.headers.get("content-type"), "video/mp4");
});

test("source-grounded memory remains a candidate and cannot leak into production search", async () => {
  const project = await workflow.createProject({ title: "Memory fixtures" });
  const sourcePath = path.join(root, "canon.md");
  await fs.writeFile(sourcePath, "# 角色设定\n李阎使用长剑，不使用短刀。\n");
  const source = await workflow.importLocalAsset(project.id, sourcePath);
  await assert.rejects(workflow.extractMemoryCandidates(project.id, source.id, [{ title: "错误", content: "编造", quote: "源文件没有这句话" }]), /QUOTE_NOT_FOUND/);
  const result = await workflow.extractMemoryCandidates(project.id, source.id, [{ title: "武器", kind: "canon", content: "李阎使用长剑，不使用短刀。", quote: "李阎使用长剑，不使用短刀。" }]);
  assert.equal(result.candidates[0].status, "candidate");
  assert.deepEqual((await workflow.searchProjectMemory(project.id, { query: "李阎武器" })).matches, []);
  await workflow.reviewMemory(project.id, result.candidates[0].id, 1, "approved", "Explicit fixture approval, not production data");
  assert.equal((await workflow.searchProjectMemory(project.id, { query: "李阎武器" })).matches.length, 1);
});

test("full multi-modal batch freezes every input and resumes dependencies without duplicate submission", { skip: process.platform !== "win32", timeout: 60000 }, async () => {
  await saveArkKey("fake-isolated-test-key-not-real");
  const project = await workflow.createProject({ title: "Mock provider six modes" });
  const creation = await workflow.createCreation(project.id, { title: "Mock batch" });
  const image = await workflow.importLocalAsset(project.id, imagePath);
  const video = await workflow.importLocalAsset(project.id, videoPath);
  const audio = await workflow.importLocalAsset(project.id, audioPath);
  const ref = (asset, role) => ({ assetId: asset.id, version: asset.version, role });
  const shots = [
    shot("text", "text-to-video", [], { duration: 30, audioMode: "provider-native", soundPlan: { ambience: "Wind" } }),
    shot("image", "image-to-video", [ref(image, "first_frame")]),
    shot("frames", "first-last-frame", [ref(image, "first_frame"), ref(image, "last_frame")]),
    shot("multi", "multimodal-reference", [ref(image, "reference_image"), ref(video, "reference_video"), ref(audio, "reference_audio")]),
    shot("extend", "video-extend", [], { continuation: { shotId: "multi", source: "video" } }),
    shot("edit", "video-edit", [ref(video, "reference_video")], { edit: { startSeconds: 1, endSeconds: 2, instruction: "make the cube red", preserve: ["camera", "sound"] } }),
    shot("chain", "first-last-frame", [ref(image, "last_frame")], { continuation: { shotId: "edit", source: "last-frame" } })
  ];
  await workflow.updateProjectPlan(project.id, plan(creation.id, shots));
  const approval = await workflow.createApproval(project.id, { creationId: creation.id, maxImageCalls: 0, maxVideoCalls: 7 });
  const payloads = [];
  const fixtureVideo = await fs.readFile(videoPath);
  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.hostname === "result.invalid") return new Response(fixtureVideo, { status: 200 });
    assert.equal(parsed.hostname, "ark.cn-beijing.volces.com", "No unintended outbound request");
    if (options.method === "POST") {
      payloads.push(JSON.parse(options.body));
      return Response.json({ id: `mock-${payloads.length}` });
    }
    return Response.json({ id: parsed.pathname.split("/").at(-1), status: "succeeded", content: { video_url: "https://result.invalid/result.mp4" } });
  };
  try {
    const job = await workflow.authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" }); // Isolated fake provider only.
    await workflow.drainBackgroundJobs();
    const state = await readState();
    assert.equal(state.jobs.find(item => item.id === job.id).status, "succeeded", JSON.stringify(state.jobs.find(item => item.id === job.id)));
    assert.equal(payloads.length, 7);
    assert.equal(payloads[0].duration, 30);
    assert.equal(payloads[0].generate_audio, true);
    assert.equal(payloads[1].generate_audio, false);
    assert.deepEqual(payloads[2].content.slice(1).map(item => item.role), ["first_frame", "last_frame"]);
    assert.deepEqual(payloads[3].content.slice(1).map(item => item.type), ["image_url", "video_url", "audio_url"]);
    assert.equal(payloads[4].content[1].type, "video_url");
    assert.deepEqual(payloads[6].content.slice(1).map(item => item.role), ["first_frame", "last_frame"]);
    assert.ok(state.providerCalls.filter(item => item.jobId === job.id).every(item => item.outputAssetId && item.lastFrameAssetId && item.requestDigest));
    await workflow.authorizeAndStartPipeline(approval.id, { method: "mcp-elicitation", action: "accept" });
    await workflow.drainBackgroundJobs();
    assert.equal(payloads.length, 7, "original authorization cannot be spent twice");
    await workflow.updateProjectPlan(project.id, plan(creation.id, shots.map(item => item.id === "multi" ? { ...item, prompt: "Change motion" } : item)));
    const revised = (await readState()).projects.find(item => item.id === project.id).creations.find(item => item.id === creation.id).plan;
    assert.equal(revised.shots.find(item => item.id === "extend").clipPath, undefined, "dependent output invalidated");
    assert.ok(revised.shots.find(item => item.id === "image").clipPath, "independent output preserved");
  } finally { globalThis.fetch = realFetch; }
});
