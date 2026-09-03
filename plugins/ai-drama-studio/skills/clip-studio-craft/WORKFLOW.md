# 剪辑判断与精修：完整制作工作流

> 本工作流由 OpenDramaFlow 总控调度，默认按 Seedance 2.5 当前适配器执行。

## 运行时合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

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
