import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { buildReviewFramePlan, createReviewEvidencePack } from "../src/review-evidence.mjs";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-review-evidence-"));
after(async () => fs.rm(tempRoot, { recursive: true, force: true }));

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function probePayload(duration = 12) {
  return JSON.stringify({
    streams: [
      { codec_type: "video", codec_name: "h264", width: 720, height: 1280, avg_frame_rate: "24/1", pix_fmt: "yuv420p" },
      { codec_type: "audio", codec_name: "aac", sample_rate: "48000", channels: 2 }
    ],
    format: { duration: String(duration), format_name: "mov,mp4,m4a,3gp,3g2,mj2" }
  });
}

function fakeRunner(calls, { duration = 12, failFrame = 0 } = {}) {
  let frame = 0;
  return async (command, args, options) => {
    calls.push({ command, args: [...args], options: { ...options } });
    if (command === "ffprobe") return { stdout: probePayload(duration) };
    assert.equal(command, "ffmpeg");
    frame += 1;
    if (frame === failFrame) throw new Error("SIMULATED_FFMPEG_FAILURE");
    const outputPath = args.at(-1);
    await fs.writeFile(outputPath, `jpeg:${args[args.indexOf("-ss") + 1]}`, "utf8");
    return { stdout: "" };
  };
}

test("buildReviewFramePlan covers global context and both sides of shot boundaries deterministically", () => {
  const shots = [
    { id: "shot-a", duration: 4 },
    { id: "shot-b", duration: 4 },
    { id: "shot-c", duration: 4 }
  ];
  const first = buildReviewFramePlan(12, shots);
  const second = buildReviewFramePlan(12, shots);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map(frame => frame.label), [
    "start", "boundary-before", "boundary-after", "mid", "boundary-before", "boundary-after", "end"
  ]);
  assert.equal(first[0].shotId, "shot-a");
  assert.equal(first.find(frame => frame.label === "mid").shotId, "shot-b");
  assert.equal(first.at(-1).shotId, "shot-c");
  assert.equal(new Set(first.map(frame => frame.timestamp)).size, first.length);
});

test("buildReviewFramePlan stays at 25 unique frames and samples long timelines end to end", () => {
  const shots = Array.from({ length: 40 }, (_, index) => ({ id: `shot-${index + 1}`, duration: 1 }));
  const plan = buildReviewFramePlan(40, shots);
  assert.equal(plan.length, 25);
  assert.equal(plan[0].label, "start");
  assert.equal(plan.at(-1).label, "end");
  assert.equal(new Set(plan.map(frame => frame.timestamp)).size, 25);
  assert.equal(plan.some(frame => frame.timestamp < 2 && frame.label.startsWith("boundary")), true);
  assert.equal(plan.some(frame => frame.timestamp > 38 && frame.label.startsWith("boundary")), true);
});

test("createReviewEvidencePack writes a hashed evidence-only pack and reuses an identical valid run", async () => {
  const caseRoot = path.join(tempRoot, "successful");
  const inputPath = path.join(caseRoot, "input.mp4");
  const outputDir = path.join(caseRoot, "evidence");
  await fs.mkdir(caseRoot, { recursive: true });
  const input = Buffer.from("deterministic fake source");
  await fs.writeFile(inputPath, input);
  const shots = [{ id: "shot-a", duration: 6 }, { id: "shot-b", duration: 6 }];
  const calls = [];
  const runner = fakeRunner(calls);

  const manifest = await createReviewEvidencePack({ inputPath, outputDir, shots, runner });
  assert.equal(manifest.schema, "ai-drama-review-evidence/v1");
  assert.equal(manifest.reviewStatus, "unreviewed");
  assert.equal(manifest.automatedVisualAcceptance, false);
  assert.equal(manifest.source.bytes, input.length);
  assert.equal(manifest.source.sha256, hash(input));
  assert.equal(manifest.media.video.width, 720);
  assert.equal(manifest.frames.length, buildReviewFramePlan(12, shots).length);
  for (const frame of manifest.frames) {
    const bytes = await fs.readFile(frame.path);
    assert.equal(bytes.length, frame.bytes);
    assert.equal(hash(bytes), frame.sha256);
  }
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(outputDir, "review-evidence.json"), "utf8")), manifest);

  const callsAfterFirstRun = calls.length;
  const repeated = await createReviewEvidencePack({ inputPath, outputDir, shots, runner });
  assert.deepEqual(repeated, manifest);
  assert.equal(calls.length, callsAfterFirstRun);
});

test("a failed replacement leaves the previously committed evidence pack intact", async () => {
  const caseRoot = path.join(tempRoot, "atomic-failure");
  const inputPath = path.join(caseRoot, "input.mp4");
  const outputDir = path.join(caseRoot, "evidence");
  await fs.mkdir(caseRoot, { recursive: true });
  await fs.writeFile(inputPath, "first source", "utf8");
  const shots = [{ id: "shot-a", duration: 6 }, { id: "shot-b", duration: 6 }];
  const first = await createReviewEvidencePack({ inputPath, outputDir, shots, runner: fakeRunner([]) });

  await fs.writeFile(inputPath, "changed source", "utf8");
  await assert.rejects(
    createReviewEvidencePack({ inputPath, outputDir, shots, runner: fakeRunner([], { failFrame: 2 }) }),
    /SIMULATED_FFMPEG_FAILURE/
  );
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(outputDir, "review-evidence.json"), "utf8")), first);
  const leftovers = (await fs.readdir(caseRoot)).filter(name => name.startsWith(".evidence.tmp-") || name.startsWith("evidence.backup-"));
  assert.deepEqual(leftovers, []);
});
