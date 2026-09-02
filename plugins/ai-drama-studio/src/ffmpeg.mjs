import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-12000); });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`FFMPEG_FAILED_${code}: ${stderr.split("\n").slice(-8).join(" ")}`));
    });
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve(stdout) : reject(new Error(`MEDIA_PROBE_FAILED_${code}: ${stderr.slice(-500)}`)));
  });
}

export async function assertFfmpeg() {
  await run("ffmpeg", ["-version"], process.cwd());
}

export async function createShotVideo(imagePath, outputPath, durationSeconds, index) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const frames = Math.max(48, Math.round(durationSeconds * 24));
  const panX = index % 2 === 0 ? "iw/2-(iw/zoom/2)" : "max(0,iw-iw/zoom)";
  const filter = `scale=780:1387,crop=720:1280:x='(iw-ow)/2':y='(ih-oh)/2',zoompan=z='min(zoom+0.0007,1.055)':x='${panX}':y='ih/2-(ih/zoom/2)':d=${frames}:s=720x1280:fps=24,fade=t=in:st=0:d=0.22,fade=t=out:st=${Math.max(0.5, durationSeconds - 0.25)}:d=0.25,format=yuv420p`;
  await run("ffmpeg", ["-y", "-loop", "1", "-i", imagePath, "-t", String(durationSeconds), "-vf", filter, "-r", "24", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", outputPath], path.dirname(outputPath));
}

export async function normalizeVideoClip(inputPath, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const filter = "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,fps=24,format=yuv420p";
  const hasAudio = (await runCapture("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index", "-of", "csv=p=0", inputPath], path.dirname(inputPath))).trim().length > 0;
  const inputs = hasAudio
    ? ["-i", inputPath]
    : ["-i", inputPath, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  const audioMap = hasAudio ? ["-map", "0:a:0"] : ["-map", "1:a:0"];
  await run("ffmpeg", [
    "-y", ...inputs, "-vf", filter, "-map", "0:v:0", ...audioMap,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart", outputPath
  ], path.dirname(outputPath));
  return outputPath;
}

export async function probeDuration(filePath) {
  const value = await runCapture("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath], path.dirname(filePath));
  const duration = Number.parseFloat(value.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("MEDIA_DURATION_INVALID");
  return duration;
}

export async function renderFinal({ clips, subtitles, outputPath, workingDir }) {
  if (!clips.length) throw new Error("NO_VIDEO_CLIPS");
  await fs.mkdir(workingDir, { recursive: true });
  const concatPath = path.join(workingDir, "concat.txt");
  const concatBody = clips.map(file => `file '${file.replaceAll("'", "'\\''").replaceAll("\\", "/")}'`).join("\n");
  await fs.writeFile(concatPath, `${concatBody}\n`, "utf8");

  const videoOnly = path.join(workingDir, "video-only.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", videoOnly], workingDir);

  const srtPath = path.join(workingDir, "subtitles.srt");
  await fs.writeFile(srtPath, subtitles, "utf8");
  const subtitleFilter = "subtitles=filename='subtitles.srt':charenc=UTF-8:force_style='FontName=Microsoft YaHei,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101010,BorderStyle=1,Outline=2,Shadow=0,MarginV=52,Alignment=2'";
  await run("ffmpeg", [
    "-y", "-i", videoOnly, "-vf", subtitleFilter,
    "-map", "0:v:0", "-map", "0:a:0", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", outputPath
  ], workingDir);
  return outputPath;
}

export function srtTimestamp(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}
