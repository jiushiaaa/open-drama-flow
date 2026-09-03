import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { shutdownSignal } from "./background-jobs.mjs";

// Inspection evidence, not a semantic quality score. All processes are bounded.
export function mediaCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], signal: shutdownSignal, timeout: 300000 });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-2000000); });
    child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-2000000); });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`MEDIA_COMMAND_FAILED:${command}:${code}`)));
  });
}

export async function inspectMediaFile(localPath) {
  const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", localPath]);
  const data = JSON.parse(stdout);
  const video = data.streams?.find(item => item.codec_type === "video");
  const audio = data.streams?.find(item => item.codec_type === "audio");
  const [n, d = 1] = String(video?.avg_frame_rate || "0/1").split("/").map(Number);
  return { duration: Number(data.format?.duration || video?.duration || audio?.duration || 0),
    video: video ? { width: video.width, height: video.height, fps: d ? n / d : 0, codec: video.codec_name } : null,
    audio: audio ? { codec: audio.codec_name, channels: audio.channels, sampleRate: Number(audio.sample_rate) } : null,
    format: data.format?.format_name || "" };
}

export function parseSignalEvidence(stderr, media) {
  const maxVolume = /max_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr)?.[1];
  const intervals = (startName, endName) => {
    const events = [...stderr.matchAll(new RegExp(`(?:${startName}:\\s*(-?[\\d.]+)|${endName}:\\s*(-?[\\d.]+))`, "g"))];
    let start = null;
    const result = [];
    for (const match of events) {
      if (match[1] !== undefined) start = Number(match[1]);
      else { result.push({ start: start ?? 0, end: Number(match[2]) }); start = null; }
    }
    if (start !== null) result.push({ start, end: media.duration });
    return result;
  };
  return { audio: { present: Boolean(media.audio), peakDb: maxVolume === "-inf" ? null : maxVolume === undefined ? null : Number(maxVolume),
      audible: Boolean(media.audio) && maxVolume !== undefined && maxVolume !== "-inf" && Number(maxVolume) > -50,
      silence: intervals("silence_start", "silence_end") },
    motion: { freezes: intervals("freeze_start", "freeze_end"), black: intervals("black_start", "black_end") },
    boundary: "Signal thresholds only: quiet sound, deliberate stillness and black frames require listening/playback; no identity, speech or motion acceptance is inferred." };
}

export async function scanMediaSignals(localPath, media = null) {
  media ||= await inspectMediaFile(localPath);
  const args = ["-hide_banner", "-nostdin", "-i", localPath];
  if (media.video) args.push("-map", "0:v:0", "-vf", "freezedetect=n=-50dB:d=1,blackdetect=d=0.15:pix_th=0.10");
  if (media.audio) args.push("-map", "0:a:0", "-af", "silencedetect=noise=-50dB:d=0.3,volumedetect");
  args.push("-f", "null", "-");
  const { stderr } = await mediaCommand("ffmpeg", args);
  return parseSignalEvidence(stderr, media);
}

export async function extractLastFrame(input, output) {
  const media = await inspectMediaFile(input);
  const time = Math.max(0, media.duration - 1 / (media.video?.fps || 24) - 0.01);
  await mediaCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-ss", String(time), "-i", input, "-map", "0:v:0", "-frames:v", "1", output]);
  return output;
}

export async function extractReviewAudio(input, output) {
  await mediaCommand("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", input, "-map", "0:a:0", "-vn", "-c:a", "pcm_s16le", "-ar", "24000", output]);
  const bytes = await fs.readFile(output);
  return { path: output, file: path.basename(output), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export function validateReferenceMedia(asset, media, profile) {
  const extension = path.extname(asset.localPath).toLowerCase();
  const allowed = { image: [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".gif"], video: [".mp4", ".mov"], audio: [".mp3", ".wav"] };
  const errors = [];
  if (!allowed[asset.kind]?.includes(extension)) errors.push("REFERENCE_FORMAT_NEEDS_CONVERSION");
  if (Number(asset.size) > ({ image: 30, video: 200, audio: 15 }[asset.kind] || 0) * 1024 * 1024) errors.push("REFERENCE_FILE_TOO_LARGE");
  if (asset.kind === "image") {
    const { width = 0, height = 0 } = media.video || {};
    if (Math.min(width, height) < 300 || Math.max(width, height) > 6000 || width / height < 0.4 || width / height > 2.5) errors.push("REFERENCE_IMAGE_DIMENSIONS_UNSUPPORTED");
  } else {
    if (!Number.isFinite(media.duration) || media.duration < 2 || media.duration > profile.maxReferenceSeconds) errors.push("REFERENCE_DURATION_UNSUPPORTED");
    if (asset.kind === "audio" && !media.audio) errors.push("REFERENCE_AUDIO_STREAM_MISSING");
    if (asset.kind === "video" && (!media.video || media.video.fps < 24 || media.video.fps > 60)) errors.push("REFERENCE_VIDEO_FPS_UNSUPPORTED");
    if (asset.kind === "video") {
      const { width = 0, height = 0 } = media.video || {};
      if (Math.min(width, height) < 300 || Math.max(width, height) > 6000 || width / height < 0.4 || width / height > 2.5 || width * height < 409600 || width * height > 8295044) errors.push("REFERENCE_VIDEO_DIMENSIONS_UNSUPPORTED");
    }
  }
  return errors;
}
