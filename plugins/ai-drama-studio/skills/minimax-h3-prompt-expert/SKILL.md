---
name: minimax-h3-prompt-expert
description: 审阅 MiniMax H3 多模态提示词并迁移为 Seedance 2.5/Codex 工作流；适用于旧 H3 Prompt 或参考素材映射。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# H3 提示词迁移专家（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 识别原 H3 输入模式、主体映射和保留项
- 将模型专属字段转换为 Seedance 可执行的连续自然语言
- 保留参考素材职责、关键帧、对白和编辑意图

## 质量锁

- 不把 H3 私有字段直接发送给 Seedance
- 明确指出无法等价迁移的能力
- 输出可审阅提示词后再进入付费审批

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 本能力的硬边界

把 H3 当作待迁移的旧输入语法，不是当前模型。最终交付必须是 Seedance 2.5 可执行的连续自然语言，并重新核验时长、画幅、参考资产和音频约束。

## 专业资料索引

- [references/audio-dialogue.md](./references/audio-dialogue.md)
- [references/clarification-routing.md](./references/clarification-routing.md)
- [references/core-workflow.md](./references/core-workflow.md)
- [references/editing-preservation.md](./references/editing-preservation.md)
- [references/modes-all-purpose-reference.md](./references/modes-all-purpose-reference.md)
- [references/modes-fl2va.md](./references/modes-fl2va.md)
- [references/modes-i2va.md](./references/modes-i2va.md)
- [references/modes-l2va.md](./references/modes-l2va.md)
- [references/modes-t2va.md](./references/modes-t2va.md)
- [references/pattern-grammars.md](./references/pattern-grammars.md)
- [references/text-ui-layout.md](./references/text-ui-layout.md)
