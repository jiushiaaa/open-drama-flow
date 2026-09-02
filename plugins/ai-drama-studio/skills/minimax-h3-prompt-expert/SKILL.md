---
name: minimax-h3-prompt-expert
description: 审阅 MiniMax H3 多模态提示词并迁移为 Seedance 2.5/Codex 工作流；适用于旧 H3 Prompt 或参考素材映射。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# H3 提示词迁移专家（Codex 适配）

这是对本机 MiniMax Design「H3 提示词迁移专家」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 识别原 H3 输入模式、主体映射和保留项。
- 将模型专属字段转换为 Seedance 可执行的连续自然语言。
- 保留参考素材职责、关键帧、对白和编辑意图。

## 质量锁

- 不把 H3 私有字段直接发送给 Seedance。
- 明确指出无法等价迁移的能力。
- 输出可审阅提示词后再进入付费审批。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
