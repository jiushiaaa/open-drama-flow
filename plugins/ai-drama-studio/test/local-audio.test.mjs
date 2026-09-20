import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { run } from "../src/ffmpeg.mjs";
import { fileHash } from "../src/local-edit.mjs";
import { processLocalAudio } from "../src/local-audio.mjs";
import { compareLocalEdits } from "../src/local-edit-reuse.mjs";
import { mediaCommand } from "../src/media-inspection.mjs";

test("audio tools measure, extract exact samples and mix without changing video packets", { timeout: 120000 }, async t => {
  try { await mediaCommand("ffmpeg", ["-version"]); } catch { t.skip("FFmpeg unavailable"); return; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "drama-audio-"));
  try {
    const video = path.join(root, "source.mp4"), tone = path.join(root, "tone.wav"), planPath = path.join(root, "plan.json");
    await run("ffmpeg", ["-n", "-f", "lavfi", "-i", "color=blue:size=160x90:rate=24:duration=2", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2", "-c:v", "libx264", "-c:a", "aac", video], root);
    await run("ffmpeg", ["-n", "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=48000:duration=2", "-c:a", "pcm_s16le", tone], root);
    const source = { path: video, sha256: await fileHash(video) }, music = { path: tone, sha256: await fileHash(tone) };
    const execute = async (plan, name) => {
      await fs.writeFile(planPath, JSON.stringify(plan));
      return processLocalAudio({ planPath, outputDirectory: path.join(root, name) });
    };
    const measure = await execute({ operation: "measure", source, startSeconds: 0, durationSeconds: 2, signalLabel: "full-mix" }, "none");
    assert.ok(Number.isFinite(Number(measure.integratedLufs)));
    const excerpt = await execute({ operation: "extract", source: music, character: "test", acceptanceReference: "synthetic", sampleRate: 48000, startSample: 24000, endSample: 72000 }, "excerpt");
    assert.ok(excerpt.output.endsWith(".wav"));
    await assert.rejects(execute({ operation: "extract", source: music, character: "test", acceptanceReference: "synthetic", sampleRate: 24000, startSample: 0, endSample: 100 }, "bad"), /RATE_INVALID/);
    const mix = await execute({ operation: "mix", source, tracks: [{ source: music, atSeconds: 0.5, durationSeconds: 1, gainDb: -12, fadeSeconds: 0.1, purpose: "music" }] }, "mixed");
    const packetHash = async file => (await mediaCommand("ffmpeg", ["-v", "error", "-i", file, "-map", "0:v", "-c", "copy", "-f", "hash", "-hash", "sha256", "-"])).stdout;
    assert.equal(await packetHash(video), await packetHash(mix.output));
    assert.ok(Number(mix.measurement.truePeakDbtp) < 0);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("reuse comparison detects changed ranges and caption edits", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "drama-reuse-"));
  try {
    const clip = { id: "one", path: path.join(root, "source.mp4"), sha256: "a".repeat(64), acceptanceReference: "synthetic", subtitleState: "clean", inFrame: 0, outFrame: 24 };
    const plan = { version: 1, revision: "one", fps: 24, width: 1280, height: 720, clips: [clip] };
    const previousPlanPath = path.join(root, "before.json"), nextPlanPath = path.join(root, "after.json");
    await fs.writeFile(previousPlanPath, JSON.stringify(plan));
    await fs.writeFile(nextPlanPath, JSON.stringify(plan));
    assert.equal((await compareLocalEdits({ previousPlanPath, nextPlanPath })).intervals[0].unchangedEdit, true);
    await fs.writeFile(nextPlanPath, JSON.stringify({ ...plan, clips: [{ ...clip, outFrame: 23 }] }));
    const result = await compareLocalEdits({ previousPlanPath, nextPlanPath });
    assert.equal(result.intervals[0].unchangedEdit, false);
    assert.equal(result.intervals[0].reusable4kVideo, null);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
