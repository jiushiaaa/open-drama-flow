---
name: minimax-anime-game-pv
description: 制作 15 秒内二次元漫画、游戏角色、群像或世界观 PV；适用于角色觉醒、战斗、抽卡和活动宣传。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 二次元漫画/游戏 PV（Codex 适配）

这是对本机 MiniMax Design「二次元漫画/游戏 PV」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 用 Panel、Logical Shot 和主时间线统一二维叙事。
- 锁定角色立绘、场景、标题和音频来源。
- 整条编译角色出场、冲突、高潮和落版。

## 质量锁

- 二维媒介与线稿风格不漂移。
- 角色身份与技能特征一致。
- 不把九宫格预览当成最终视频参考。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
