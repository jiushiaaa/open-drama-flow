import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { renderFinal } from "../src/ffmpeg.mjs";

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve(stdout) : reject(new Error(`${command} failed: ${stderr.slice(-1000)}`)));
  });
}

test("final render preserves audio and burns Chinese subtitles into video", { timeout: 30_000 }, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ai-drama-render-test-"));
  const clip = path.join(tempRoot, "clip.mp4");
  const output = path.join(tempRoot, "final.mp4");
  try {
    await run("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "color=c=#1e293b:s=720x1280:r=24:d=1",
      "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", clip
    ], tempRoot);
    await renderFinal({
      clips: [clip],
      subtitles: "1\n00:00:00,000 --> 00:00:00,900\n雨夜，别回头。\n",
      outputPath: output,
      workingDir: tempRoot
    });
    const streams = JSON.parse(await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type", "-of", "json", output], tempRoot)).streams.map(stream => stream.codec_type);
    assert.deepEqual(streams.sort(), ["audio", "video"]);
    assert.ok((await fs.stat(output)).size > 10_000);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
