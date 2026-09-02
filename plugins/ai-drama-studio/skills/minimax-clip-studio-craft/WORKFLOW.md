# 剪辑判断与精修：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 `drama_get_state`，正式剧本/角色/镜头写入使用 `drama_update_plan`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

---

# Clip Editing Craft — Video Editor plugin

Judgement layer for editing inside this plugin. The method catalog (what each
`project.*` call does) lives in the plugin's method docs; THIS file is about
making the edit good. Apply it when planning; don't recite it to the user.

## Perception before decision

Never make a content decision (where to cut, what the best moment is, whether
a look works) from clip names, durations or assumptions. Look first:

- `project.snapshot` renders the real composite — captions, effects and
  transitions included. Sample a few frames before planning, and re-check the
  exact moments you changed after editing.
- For source-level understanding (speech content, action timing), run the
  host's transcription / media analysis on `media[].path` from
  `project.get view="full"`.
- After any visual change, verify on frames, not on intent: a caption you
  styled might still sit on a face; an effect might crush the shadows. If you
  did not look, you do not know.

## Rhythm and pacing

- **Hook first.** The first 1–3 seconds decide whether anyone keeps watching.
  Open on motion, a face, or the strongest image — not on a slow establishing
  shot unless the user asked for it.
- **Vary shot length.** A wall of same-length clips reads as a slideshow.
  Alternate energy: a few quick cuts, then a held moment. In narrated or
  talking-head footage, avoid shots longer than ~7s without a change
  (cutaway, punch-in, caption beat).
- **Cut on action or breath.** Prefer cutting just after a gesture lands or a
  sentence ends (transcripts give you sentence boundaries — use them). Avoid
  cutting mid-word unless removing filler.
- **Silence is material.** `cut_silences` tightens talking footage, but keep
  natural pauses that carry weight (a beat before a punchline). Default
  thresholds are safe; for fast-paced content lower minSilenceSec to ~0.3.
- **Ends matter.** Close deliberately: a held final image, a caption beat, or
  a hard cut at the last strong moment. Do not let the timeline trail off
  into leftover frames — check the last second with `project.snapshot`.

## Transitions: restraint wins

- The hard cut is the default seam. It is invisible when the rhythm is right.
- Pick ONE accent transition family per piece and use it at meaningful
  boundaries only (scene/topic changes) — not between every clip. A montage
  with a wipe every 2 seconds reads as a template.
- Crossfade means "time passes / mood softens"; dipToBlack is a chapter
  break; wipe/slide/push are stylistic and need a matching energetic look.
  1s default duration is long for fast content — 0.3–0.5s is often better.
- Never stack a transition onto a moment that already has motion energy (a
  whip pan, an action peak): the cut alone is stronger.

## Captions and text

- Scale to the canvas: ~56px is a normal caption on 1080p; scale
  proportionally for other resolutions (a 4K project needs ~112px). Presets
  handle this; raw fontSizePx does not.
- Bottom-centre is the safe default. Never cover a face, a mouth (lip-sync
  content), on-screen UI, or the action the viewer must follow. When footage
  is busy at the bottom, move captions to top.
- One thought per caption clip. If an imported SRT produced 3-line walls,
  the transcription granularity was wrong — re-import rather than restyle.
- Style captions once, as a set (`set_subtitle_style` with a preset), not
  clip-by-clip with ad-hoc values. Mixed caption styles in one piece look
  broken. Verify legibility on a real frame over the busiest background.
- Title/overlay text (`add_text`) earns its place only if it says something
  the footage doesn't. Default 3s duration is a starting point — match it to
  the reading time (~0.06s per character, minimum 1.5s).

## Color and effects

- Grade for consistency first, style second: clips from different sources
  should feel like one piece (match temperature before anything creative).
- Effects have a purpose or they go. Vignette to focus attention, grain for
  texture on clean digital footage, blur only as background treatment. If
  you cannot say what an effect is FOR, remove it.
- Small values. temperature/tint beyond ±30 is a look, not a correction —
  only go there when the user asked for a look. Check before/after with
  `project.snapshot` at the same timestamp.

## Speed

- Speed changes serve rhythm: slow motion emphasizes a peak moment (0.5× on
  the action beat), speed-up compresses boring necessity (2–5× on a walk, a
  process). Do not retime dialogue unless asked.
- `set_speed` changes the clip's timeline duration and does NOT ripple
  neighbours — after retiming, check `project.diagnostics` for the gap or
  overlap it left and close it deliberately.

## Verification discipline

Follow the full [completion and visual verification checklist](references/verification.md)
before reporting an editing task done.
