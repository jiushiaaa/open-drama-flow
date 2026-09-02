---
name: minimax-browser-game-demo-maker
description: 制作真实浏览器窗口与本地 HTML5 游戏 Demo 的截图锚点和连续演示视频；适用于 localhost 游戏展示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 浏览器游戏 Demo 影像（Codex 适配）

这是对本机 MiniMax Design「浏览器游戏 Demo 影像」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先验证本地页面与完整浏览器外壳。
- 锁定一张可复现截图作为视频首帧合同。
- 只让游戏画布内容按操作顺序变化。

## 质量锁

- 地址栏、窗口尺寸和 UI 文案连续。
- 角色与关卡状态和真实 Demo 一致。
- 不生成无法在本地页面复现的功能。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
