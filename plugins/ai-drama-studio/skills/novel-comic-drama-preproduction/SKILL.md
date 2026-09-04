---
name: novel-comic-drama-preproduction
description: 把授权小说按卷整理为忠于原著、经审批且可直接进入视频生产的剧本、角色场景资产、导演分镜和 Prompt；适用于长篇与无限流小说改编，不负责实际视频生成。
trigger-words: [小说漫剧, 小说改编漫剧, 按卷改编, 动态漫前期, 开拍前核验, novel adaptation]
---

# 小说漫剧前期制片

Use this skill when an authorized novel must be converted volume by volume into a source-faithful, approved and reusable preproduction package. It stops at the video-start approval gate: planning, auditing or preparing prompts must never start video generation.

## Start rules

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md). Follow it before any project mutation.
2. Load only the references needed for the current stage. Read the source-fidelity rules before adapting prose, the image policy before any image call, and the readiness checklist before declaring the volume ready.
3. Read the live project and creation state first. Work from the exact authorized source version and approved project context, not chat recollection or unrelated volumes.
4. Route the current request with `drama_route_skills`; use this specialist only for the complete novel-adaptation preproduction scope, not for an isolated portrait, storyboard sheet or existing-video edit.
5. Keep drafts, candidates, rejected work and superseded versions outside the project asset library. Project assets contain only explicit, reusable approvals with traceable versions.
6. Do not generate video, authorize paid video work, bind unapproved assets, or mark delivery complete. Handoff occurs only after a pre-video manifest passes and the user explicitly approves starting production.

## Production focus

- Build the project → volume/world → episode hierarchy and preserve chapter provenance.
- Produce full literary scripts, visual asset requirements, director storyboards, executable prompts and sound/subtitle intent without silently compressing or rewriting the source.
- Batch similar work, audit it against the source, then admit only approved versions to the project library.

## Quality locks

- Source text outranks web knowledge, genre convention and model assumptions.
- Character, creature, prop and setting decisions remain traceable to quotations or explicitly approved adaptation choices.
- Image generation permission and image acceptance are separate; only the exact accepted file and hash may enter the library.
- Every production shot has an approved script basis, asset binding plan, camera/action contract, sound intent and acceptance criteria.
- A green readiness result means ready for the user's video-start decision, not that production already started.

## OpenDramaFlow 运行合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

## References and validators

- [Phase gates](./references/phase-gates.md)
- [Source fidelity rules](./references/source-fidelity-rules.md)
- [Screenplay and shot specification](./references/screenplay-and-shot-spec.md)
- [Image approval policy](./references/image-approval-policy.md)
- [Asset admission policy](./references/asset-admission-policy.md)
- [Pre-video readiness checklist](./references/pre-video-readiness-checklist.md)
- [Preproduction manifest schema](./references/preproduction-manifest-schema.md)
- `scripts/validate-source-coverage.ps1`
- `scripts/audit-project-assets.ps1`
- `scripts/build-readiness-manifest.ps1`
