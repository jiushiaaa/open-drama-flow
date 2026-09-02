---
name: minimax-cool-music-video
description: 制作 15 秒内复古拼贴、说唱或时尚表演型音乐短片；适用于音乐和人物表演主导的单条 MV。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 复古潮流短 MV（Codex 适配）

这是对本机 MiniMax Design「复古潮流短 MV」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先锁音乐窗口、人物来源和画面形态。
- 规划 8–10 个镜头与连续空间。
- 把表演、动态文字和音乐段落编译为单条时间线。

## 质量锁

- 剪辑点服务真实音乐节拍。
- 人物表演连续且不串脸。
- 超过 15 秒或完整歌曲转长流程。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
