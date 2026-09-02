---
name: minimax-short-drama-multilingual-dubbing
description: 把短剧对白本地化为目标语言配音与字幕；适用于保留角色音色、情绪、节奏和时长的出海版本。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 短剧多语言配音（Codex 适配）

这是对本机 MiniMax Design「短剧多语言配音」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先从干净人声或字幕建立对白与时间码表。
- 翻译以角色关系、口语自然度和时长为约束。
- 在可用合规音频能力下逐句生成并回混背景声。

## 质量锁

- 未配置语音供应商时只交付计划和可编辑表。
- 不得克隆未授权音色。
- 字幕、口型节奏和句长尽量对齐。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
