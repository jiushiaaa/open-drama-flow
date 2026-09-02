---
name: minimax-dot-matrix-brand-wordmark-motion
description: 把已有 Logo、品牌名或标语制作成点阵/字形动态图形；适用于品牌片头和字标展示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 点阵品牌字形动效（Codex 适配）

这是对本机 MiniMax Design「点阵品牌字形动效」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 只从参考图或用户输入提取权威文字。
- 先生成横版字标锚点，再设计字形拆解与重组。
- 时间线以首字、尾字和标语落版为关键节点。

## 质量锁

- 每个可读字符准确无误。
- 品牌色和背景体系一致。
- 不凭外部知识补全品牌名或 slogan。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
