---
name: minimax-fpv-tour-video-generator
description: 基于场景参考规划第一人称 FPV 一镜到底飞行；适用于建筑、文旅、室内与空间展示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# FPV 穿越短片（Codex 适配）

这是对本机 MiniMax Design「FPV 穿越短片」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 分析可穿越缝隙、障碍、深度与路线几何。
- 先确认完整飞行轨迹再写连续视频提示词。
- 用擦过、侧倾、俯冲和视差增强空间感。

## 质量锁

- 路线物理可行且不穿模。
- 速度变化有呼吸而非全程冲刺。
- 只有真实支持时才安排贴水或穿缝。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
