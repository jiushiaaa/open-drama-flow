---
name: minimax-ui-motion
description: 基于真实品牌界面制作 App、SaaS 或网页 UI 动效；适用于状态变化、交互、卡片重组和界面演示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# UI Motion（Codex 适配）

这是对本机 MiniMax Design「UI Motion」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 提取真实 brand profile、界面状态和交互顺序。
- 编写时间码 storyboard 与连续状态转场。
- 超过单条时长时用真实尾帧保持连续。

## 质量锁

- UI 文案、布局和状态逻辑准确。
- 光标行为与界面响应一致。
- 没有真实品牌资料时先补齐而非套模板。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
