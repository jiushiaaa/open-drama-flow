---
name: novel-comic-drama-preproduction
description: 把授权小说按卷整理为忠于原著、经审批且可直接进入视频生产的剧本、角色场景资产、导演分镜和 Prompt；适用于长篇与无限流小说改编，不负责实际视频生成。
trigger-words: [小说漫剧, 小说改编漫剧, 按卷改编, 动态漫前期, 开拍前核验, novel adaptation]
---

# 小说漫剧前期制片

当用户要把拥有改编权的小说按卷或按世界制作成漫剧时，使用本能力完成视频生成前的全部前期工作。本能力停在“等待用户批准开拍”的关卡；只要求规划、审计或 Prompt 时，不得启动视频生成。

## 启动规则

1. 开始前必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 只读取当前阶段需要的参考资料：改编前读原著忠实规则，生图前读图片审批规则，声明就绪前读开拍前清单。
3. 先读取真实项目和创作页状态，锁定获授权的原文版本与当前卷范围；不得依赖聊天记忆或混入其他卷资料。
4. 用 `drama_route_skills` 路由当前请求；只有完整的小说改编前期范围才由本能力主导，单独画像、单张分镜板或现有视频剪辑继续使用对应专项能力。
5. 草稿、候选、废稿、未采纳和已被替代版本只留在本地。项目资产只保存明确批准、版本可追溯且可直接复用的内容。
6. 不生成视频，不批准付费视频任务，不绑定未批准素材，不宣称成片完成。只有就绪清单通过且用户明确批准开拍后，才交给视频生产流程。

## 制作重点

- 建立“大项目 → 卷／世界 → 分集创作页”的层级，并保存章节来源关系。
- 完整产出文学剧本、视觉资产需求、导演分镜、可执行 Prompt、声音与字幕意图；不得机械压缩或擅改原著。
- 同类工作批量完成，统一对照原著审计，再把通过版本纳入项目资产。

## 质量锁

- 原著优先于网络资料、类型惯例和模型印象。
- 人物、异兽、道具与场景决定必须能追溯到原文证据，或标明为用户批准的改编决定。
- 同意生成图片不等于接受结果；只有用户验收的具体文件及其哈希才能入库。
- 每个生产镜头都必须有已批准剧本依据、素材绑定计划、机位动作合同、声音意图和验收标准。
- “就绪”只表示可以交给用户决定是否开拍，不表示视频生产已经开始。

## OpenDramaFlow 运行合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

## 专业资料与核验脚本

- [阶段与关卡](./references/phase-gates.md)
- [原著忠实规则](./references/source-fidelity-rules.md)
- [文学剧本与镜头规范](./references/screenplay-and-shot-spec.md)
- [图片审批规则](./references/image-approval-policy.md)
- [项目资产准入规则](./references/asset-admission-policy.md)
- [视频开拍前就绪清单](./references/pre-video-readiness-checklist.md)
- [前期制片清单数据结构](./references/preproduction-manifest-schema.md)
- `scripts/validate-source-coverage.ps1`
- `scripts/audit-project-assets.ps1`
- `scripts/build-readiness-manifest.ps1`
