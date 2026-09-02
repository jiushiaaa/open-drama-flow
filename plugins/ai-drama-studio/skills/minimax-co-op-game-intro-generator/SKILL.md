---
name: minimax-co-op-game-intro-generator
description: 制作双人合作游戏主菜单与开场动画；适用于角色卡、装备配置、加载与进入世界的连续演示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 双人游戏开场（Codex 适配）

这是对本机 MiniMax Design「双人游戏开场」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 锁定两名玩家身份、游戏标题和菜单文案。
- 先生成并确认菜单锚点图，再编译时间线。
- 从角色卡、装备、加载过渡到进入游戏世界。

## 质量锁

- 两名角色不串脸或互换装备。
- 屏幕文字来自用户输入。
- UI 状态变化前后可追踪。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
