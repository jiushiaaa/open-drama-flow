---
name: minimax-micro-expression-video-generator
description: 把角色图、剧本片段或情绪短语转为微表情表演镜头；适用于克制而复杂的情绪变化。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 人物微表情表演（Codex 适配）

这是对本机 MiniMax Design「人物微表情表演」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 保护已确认身份、台词、场景、调度和机位。
- 按时间段组织眼神、呼吸、嘴角、眉眼与身体细节。
- 用表演强度曲线控制变化而非堆叠动作。

## 质量锁

- 情绪转变有触发和余波。
- 避免夸张抽搐或五官漂移。
- 镜头距离足以看清所描述细节。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
