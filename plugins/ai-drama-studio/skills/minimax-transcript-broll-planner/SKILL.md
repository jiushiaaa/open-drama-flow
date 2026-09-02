---
name: minimax-transcript-broll-planner
description: 把逐字稿、配音稿或数据讲稿转为可审片 B-roll 计划；适用于知识、产品和市场分析视频。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 口播 B-roll 规划（Codex 适配）

这是对本机 MiniMax Design「口播 B-roll 规划」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 按语义和时间拆分逐字稿。
- 为每段选择 A-roll、证据、复用素材、动态图文或生成镜头。
- 生成前标明缺失素材、文字语言和连续性要求。

## 质量锁

- 数据和证据镜头忠于来源。
- B-roll 不重复旁白字面而是补充理解。
- 时间码与语速可落地。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
