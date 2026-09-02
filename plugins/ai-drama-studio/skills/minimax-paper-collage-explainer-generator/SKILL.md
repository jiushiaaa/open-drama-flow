---
name: minimax-paper-collage-explainer-generator
description: 用半调纸拼贴与触感停格表现观点、故事或知识点；适用于口播配画和抽象概念解释。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 纸拼贴讲解动画（Codex 适配）

这是对本机 MiniMax Design「纸拼贴讲解动画」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 从文案提炼一个清晰视觉隐喻。
- 先确认纸张、印刷、色盘和静帧构图。
- 用滑入、弹入、压平、轻敲和摩擦声组织动画。

## 质量锁

- 纸张层级和阴影方向统一。
- 每次运动保留手工停格节奏。
- 默认不加入未要求的复杂字幕系统。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
