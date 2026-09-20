import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { resolveEditPlan, fileHash } from "./local-edit.mjs";
import { mediaCommand } from "./media-inspection.mjs";

const derivativeSchema = z.array(z.object({
  sourceSha256: z.string().regex(/^[a-fA-F0-9]{64}$/), inFrame: z.number().int().min(0), outFrame: z.number().int().positive(),
  path: z.string(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/), acceptanceReference: z.string().min(1),
  cleanVideo: z.literal(true)
}).strict());

export async function compareLocalEdits({ previousPlanPath, nextPlanPath, derivativesPath }) {
  for (const file of [previousPlanPath, nextPlanPath, derivativesPath].filter(Boolean)) if (!path.isAbsolute(file)) throw new Error("EDIT_ABSOLUTE_PATHS_REQUIRED");
  const before = resolveEditPlan(JSON.parse(await fs.readFile(previousPlanPath, "utf8")));
  const after = resolveEditPlan(JSON.parse(await fs.readFile(nextPlanPath, "utf8")));
  const derivatives = derivativesPath ? derivativeSchema.parse(JSON.parse(await fs.readFile(derivativesPath, "utf8"))) : [];
  const verified = [];
  for (const item of derivatives) {
    if (!path.isAbsolute(item.path) || await fileHash(item.path) !== item.sha256.toLowerCase()) throw new Error("EDIT_DERIVATIVE_HASH_CHANGED");
    const { stdout } = await mediaCommand("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_streams", "-of", "json", item.path]);
    const v = JSON.parse(stdout).streams[0];
    const [n, d] = String(v?.avg_frame_rate || "0/1").split("/").map(Number);
    if (v?.width !== 3840 || v?.height !== 2160 || Math.abs(n / d - after.fps) > 0.0001 || Number(v.nb_frames) !== item.outFrame - item.inFrame) throw new Error("EDIT_DERIVATIVE_FORMAT_OR_RANGE_MISMATCH");
    verified.push(item);
  }
  const signature = c => JSON.stringify({ sha256: c.sha256.toLowerCase(), inFrame: c.inFrame, outFrame: c.outFrame, audio: c.audio, subtitleState: c.subtitleState, cues: c.cues });
  const intervals = after.clips.map(c => ({
    clipId: c.id, startFrame: c.timelineStartFrame, endFrame: c.timelineStartFrame + c.outFrame - c.inFrame,
    unchangedEdit: before.fps === after.fps && before.width === after.width && before.height === after.height && before.burnSubtitles === after.burnSubtitles && before.clips.some(old => signature(old) === signature(c)),
    reusable4kVideo: verified.find(v => v.sourceSha256.toLowerCase() === c.sha256.toLowerCase() && v.inFrame === c.inFrame && v.outFrame === c.outFrame) || null
  }));
  return { intervals, boundary: "Conservative exact-range reuse only. Derivative provenance/acceptance is supplied evidence; hash/format verification does not prove visual equivalence. Audio and subtitles must be rebuilt from the current plan. No upscaling started." };
}
