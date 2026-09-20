import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveEditPlan, bilingualSrt, fileHash, renderLocalEdit } from "../src/local-edit.mjs";
import { run } from "../src/ffmpeg.mjs";
import { mediaCommand } from "../src/media-inspection.mjs";

const clip = { id: "one", path: path.resolve("source.mp4"), sha256: "a".repeat(64), acceptanceReference: "synthetic test", subtitleState: "clean", inFrame: 24, outFrame: 48, cues: [{ startFrame: 30, endFrame: 40, zh: "你好", en: "Hello." }] };
const plan = { version: 1, revision: "test", fps: 24, width: 320, height: 180, burnSubtitles: true, clips: [clip] };

test("frame edits remap bilingual cues and reject unsafe caption boundaries", () => {
  const resolved = resolveEditPlan(plan);
  assert.equal(resolved.cues[0].startFrame, 6);
  assert.match(bilingualSrt(resolved), /00:00:00,250 --> 00:00:00,667\n你好\nHello\./);
  assert.throws(() => resolveEditPlan({ ...plan, clips: [{ ...clip, inFrame: 35 }] }), /CROSSES_CAPTION/);
  assert.throws(() => resolveEditPlan({ ...plan, clips: [{ ...clip, subtitleState: "burned" }] }), /NOT_CLEAN/);
  assert.throws(() => resolveEditPlan({ ...plan, clips: [clip, clip] }), /DUPLICATE/);
  assert.throws(() => resolveEditPlan({ ...plan, clips: [{ ...clip, cues: [clip.cues[0], clip.cues[0]] }] }), /OVERLAP/);
});

test("real FFmpeg export preserves frame ranges, native audio and protects sources", { timeout: 120000 }, async t => {
  try { await mediaCommand("ffmpeg", ["-version"]); await mediaCommand("ffprobe", ["-version"]); }
  catch { t.skip("FFmpeg/ffprobe unavailable"); return; }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "drama-edit-"));
  try {
    const source = path.join(root, "source ' 中文.mp4");
    await run("ffmpeg", ["-nostdin", "-n", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=24:duration=2", "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2.3", "-c:v", "libx264", "-c:a", "aac", source], root);
    const hash = await fileHash(source);
    const input = { ...plan, clips: [{ ...clip, path: source, sha256: hash }, { ...clip, id: "two", path: source, sha256: hash, inFrame: 0, outFrame: 24, cues: [] }] };
    const planPath = path.join(root, "plan.json"), outputDirectory = path.join(root, "output");
    await fs.writeFile(planPath, JSON.stringify(input));
    await renderLocalEdit({ planPath, outputDirectory, validateOnly: true });
    await assert.rejects(fs.access(outputDirectory));
    const result = await renderLocalEdit({ planPath, outputDirectory });
    assert.equal(result.totalFrames, 48);
    assert.equal(result.evidence.length, 1);
    assert.equal(result.captionEvidence.length, 1);
    assert.equal(result.userAcceptance, "pending");
    assert.equal(await fileHash(source), hash);
    const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_frames", "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", result.output]);
    const frames = JSON.parse(stdout).frames;
    assert.equal(frames.length, 48);
    frames.forEach((f, i) => assert.ok(Math.abs(Number(f.best_effort_timestamp_time) - i / 24) < 0.00001));
    const { stderr } = await mediaCommand("ffmpeg", ["-i", result.output, "-af", "volumedetect", "-vn", "-f", "null", "-"]);
    assert.match(stderr, /max_volume: -[\d.]+ dB/);
    await assert.rejects(renderLocalEdit({ planPath, outputDirectory }), /EEXIST/);
    await fs.writeFile(planPath, JSON.stringify({ ...input, clips: [{ ...input.clips[0], sha256: "0".repeat(64) }] }));
    await assert.rejects(renderLocalEdit({ planPath, outputDirectory: path.join(root, "bad") }), /HASH_CHANGED/);
    await fs.writeFile(planPath, JSON.stringify({ ...input, clips: [{ ...input.clips[0], outFrame: 60 }] }));
    await assert.rejects(renderLocalEdit({ planPath, outputDirectory: path.join(root, "bad") }), /MISSING_FRAMES/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
