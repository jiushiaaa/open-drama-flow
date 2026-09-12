import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Compares pre-extracted single-video-stream FFmpeg MD5 manifests, not media files.
export function parseFrameMd5(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const header = expression => lines.find(line => expression.test(line))?.match(expression)?.[1];
  const timeBase = header(/^#tb 0:\s*(\d+\/\d+)$/);
  const dimensions = header(/^#dimensions 0:\s*(\d+x\d+)$/);
  if (!lines.includes("#hash: MD5") || !lines.includes("#media_type 0: video") ||
      !timeBase || timeBase.split("/").some(value => Number(value) <= 0) ||
      !dimensions || dimensions.split("x").some(value => Number(value) <= 0)) {
    throw new Error("Expected a single-video-stream FFmpeg MD5 manifest with dimensions and time base");
  }
  const frames = lines.filter(line => !line.startsWith("#")).map(line => {
    const values = line.split(",").map(value => value.trim());
    if (values.length !== 6 || values[0] !== "0" || !/^[a-f\d]{32}$/i.test(values[5])) {
      throw new Error("Malformed or multi-stream frame row");
    }
    const numbers = values.slice(1, 5).map(Number);
    if (values.slice(1, 5).some(value => !/^-?\d+$/.test(value)) ||
        numbers.some(value => !Number.isSafeInteger(value)) || numbers[2] <= 0 || numbers[3] <= 0) {
      throw new Error("Invalid frame timestamp, duration or size");
    }
    return { pts: numbers[1], duration: numbers[2], size: numbers[3], hash: values[5].toLowerCase() };
  });
  if (!frames.length) throw new Error("Empty frame manifest");
  for (let index = 1; index < frames.length; index++) {
    if (frames[index].pts < frames[index - 1].pts + frames[index - 1].duration) {
      throw new Error("Overlapping or non-increasing frame timestamps");
    }
  }
  return { timeBase, dimensions, frames };
}

export function compareFrameMd5(sourceText, targetText, expectedFrames) {
  if (!Number.isSafeInteger(expectedFrames) || expectedFrames < 1) throw new Error("Expected frame count must be a positive integer");
  const source = parseFrameMd5(sourceText);
  const target = parseFrameMd5(targetText);
  if (source.dimensions !== target.dimensions || source.timeBase !== target.timeBase) {
    throw new Error("Resolution/time-base mismatch: cannot assert frame preservation");
  }
  if (source.frames.length !== expectedFrames || target.frames.length !== expectedFrames) {
    throw new Error("Unexpected frame count: manifests may be truncated or use the wrong interval");
  }
  let mismatchCount = 0;
  const firstMismatches = [];
  for (let index = 0; index < expectedFrames; index++) {
    const a = source.frames[index];
    const b = target.frames[index];
    if (a.hash !== b.hash || a.size !== b.size || a.duration !== b.duration ||
        a.pts - source.frames[0].pts !== b.pts - target.frames[0].pts) {
      mismatchCount++;
      if (firstMismatches.length < 10) firstMismatches.push(index);
    }
  }
  return { comparedFrames: expectedFrames, mismatchCount, firstMismatches, passed: mismatchCount === 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [sourcePath, targetPath, count] = process.argv.slice(2);
    if (!sourcePath || !targetPath || !count) throw new Error("Usage: node verify-frame-preservation.mjs source.framemd5 target.framemd5 expectedFrames");
    const [source, target] = await Promise.all([fs.readFile(sourcePath, "utf8"), fs.readFile(targetPath, "utf8")]);
    const result = compareFrameMd5(source, target, Number(count));
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
