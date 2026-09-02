---
name: minimax-clip-studio-craft
description: 对现有视频时间线做节奏、剪切、转场、字幕、颜色和速度判断；适用于已经进入剪辑阶段的项目。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 剪辑判断与精修（Codex 适配）

这是对本机 MiniMax Design「剪辑判断与精修」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先观看和理解现有素材，再决定剪切。
- 以叙事、节奏和可读性约束转场、字幕与速度。
- 优先使用本地 FFmpeg；有真实剪辑插件时才写入工程。

## 质量锁

- 转场克制且有叙事理由。
- 字幕不遮挡主体并匹配语音。
- 每次修改后复看受影响时间段。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
