# 人物微表情表演：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 `drama_get_state`，正式剧本/角色/镜头写入使用 `drama_update_plan`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

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
3. 写出简洁提示词包并交给用户审阅；只有确认后才继续生成可选表演片段。优先先把旧 旧 H3 意图改写成连续自然语言，再通过审批链调用 Seedance 2.5，因为它能满足本流程所需的图片、音频参考和表演控制能力。用户指定其他模型时，只要满足已确认要求就遵循其选择；如果能力不符，说明差异并让用户选择等效方案。

## 边界

这个 Skill 只负责表演提示词和情绪表演方向，不替代完整编剧、面部绑定、口型编辑或最终合成。
