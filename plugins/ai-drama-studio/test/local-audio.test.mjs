import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { run } from "../src/ffmpeg.mjs";
import { fileHash } from "../src/local-edit.mjs";
import { processLocalAudio, duckExpression } from "../src/local-audio.mjs";
import { prepareAudioEventEvidence } from "../src/audio-event-evidence.mjs";
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
    const ducked = await execute({ operation: "mix", source, dialogue: [{ startSeconds: 0.5, endSeconds: 1.5 }], dialogueEvidence: "synthetic interval", duckDb: -18, nativeGainDb: -12, tracks: [{ source: music, atSeconds: 0, durationSeconds: 2, gainDb: 0, purpose: "music" }] }, "ducked");
    const unducked = await execute({ operation: "mix", source, nativeGainDb: -12, tracks: [{ source: music, atSeconds: 0, durationSeconds: 2, gainDb: 0, purpose: "music" }] }, "unducked");
    const level = async (file, start) => {
      const { stderr } = await mediaCommand("ffmpeg", ["-i", file, "-af", `atrim=start=${start}:duration=0.25,volumedetect`, "-vn", "-f", "null", "-"]);
      return Number(/mean_volume: ([-\d.]+)/.exec(stderr)[1]);
    };
    assert.ok(await level(ducked.output, 0.8) < await level(unducked.output, 0.8) - 8);
    assert.ok(Math.abs(await level(ducked.output, 0) - await level(unducked.output, 0)) < 0.2);
    assert.equal(await packetHash(video), await packetHash(ducked.output));
    const derivePlan = { operation: "derive", source: music, character: "test", acceptanceReference: "test selection", capabilityReference: "test-only limits", sampleRate: "24000", channels: 1, minDurationSeconds: 1, maxDurationSeconds: 3, maxBytes: 200000 };
    const derivative = await execute(derivePlan, "derived");
    const probe = JSON.parse((await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-of", "json", derivative.output])).stdout).streams[0];
    assert.equal(probe.sample_rate, "24000");
    assert.equal(probe.channels, 1);
    assert.equal(await fileHash(tone), music.sha256);
    const normalized = await execute({ operation: "normalize", source: music, targetLufs: -18, truePeakDbtp: -1.5, loudnessRange: 11 }, "normalized");
    assert.equal(normalized.technicalTargetMet, true);
    assert.ok(Math.abs(Number(normalized.measurement.integratedLufs) + 18) < 1);
    assert.equal(normalized.sampleRate, 48000);
    assert.equal(normalized.registeredInProject, false);
    assert.equal(normalized.cost.providerFee, 0);
    assert.equal(normalized.cost.computeCost, null);
    await assert.rejects(execute({ operation: "normalize", source: music }, "normalized"), /EEXIST/);
    await assert.rejects(execute({ operation: "normalize", source: { ...music, sha256: "0".repeat(64) } }, "changed"), /HASH_CHANGED/);
    await assert.rejects(execute({ operation: "denoise", source: music, reductionDb: 60 }, "invalid-reduction"));
    const denoised = await execute({ operation: "denoise", source, reductionDb: 6 }, "denoised");
    assert.equal(denoised.listeningReview, "pending");
    assert.equal(denoised.sampleRate, 48000);
    assert.ok(Math.abs(denoised.durationSeconds - 2) < 0.03);
    assert.equal(await fileHash(video), source.sha256);
    await assert.rejects(execute({ ...derivePlan, minDurationSeconds: 2.5 }, "too-short"), /NO_PADDING/);
    const eventPlan = { source, fps: 24, events: [{ id: "impact", contactFrame: 20, soundFrame: 22, evidenceReference: "synthetic markers" }] };
    await fs.writeFile(planPath, JSON.stringify(eventPlan));
    const events = await prepareAudioEventEvidence({ planPath, outputDirectory: path.join(root, "events") });
    assert.equal(events.events[0].offsetFrames, 2);
    assert.equal(events.events[0].withinDeclaredTolerance, false);
    await fs.access(path.join(root, "events", "impact-waveform.png"));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test("duck envelope handles overlapping utterances without stacking reduction", () => {
  assert.equal(duckExpression([], -12, 0.1), "1");
  assert.match(duckExpression([{ startSeconds: 1, endSeconds: 2 }, { startSeconds: 1.5, endSeconds: 3 }], -12, 0.1), /max\(max/);
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
