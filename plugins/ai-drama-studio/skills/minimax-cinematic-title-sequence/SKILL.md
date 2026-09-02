---
name: minimax-cinematic-title-sequence
description: 制作电影/剧集片头、卡司序列或单条影视概念预告；适用于片名、人物行动和悬念收束。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 电影片头与概念预告（Codex 适配）

这是对本机 MiniMax Design「电影片头与概念预告」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先分流片头、卡司序列或叙事概念预告。
- 确认主风格、文字系统、影片事实和参考用途。
- 以人物行动、关系或冲突推进并在片名落版收束。

## 质量锁

- 片名和卡司逐字准确。
- 参考图职责明确且不越权。
- 不把普通图生视频误路由成影视片头。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
