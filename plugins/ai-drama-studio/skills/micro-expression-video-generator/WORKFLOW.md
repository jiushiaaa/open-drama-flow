# 人物微表情表演：完整制作工作流

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

# 人物微表情表演

当用户想让角色的情绪表演更自然、更细腻、更像真实演员时，使用这个 Skill。

## 输入方式

- **图片模式**：给一张角色图，继续设计表演。
- **剧本模式**：给一段剧本、分镜或 prompt，只增强表演层。
- **情绪短语模式**：给一句情绪或关系状态。

## 参考资料库

细节规则都放在这些文件里：

- `references/source-notes.md`
- `references/performance-prototype-library.md`
- `references/emotion-route-library.md`
- `references/muscle-dispatch-library.md`
- `references/video-prompt-guardrails.md`
- `references/tempo-density-guide.md`
- `references/climax-reset-patterns.md`

## 流程

1. 先读用户输入，保留已有角色、场景、台词和运镜。
2. 如果缺少镜头时间，就先问镜头时间；如果缺少表演强度，也先问。
3. 写出简洁提示词包并交给用户审阅；只有确认后才继续生成可选表演片段。优先按总控冻结请求并执行 Seedance 2.5，因为它能满足本流程所需的图片、音频参考和表演控制能力。用户指定其他模型时，只要满足已确认要求就遵循其选择；如果能力不符，说明差异并让用户选择等效方案。

## 边界

这个 Skill 只负责表演提示词和情绪表演方向，不替代完整编剧、面部绑定、口型编辑或最终合成。
