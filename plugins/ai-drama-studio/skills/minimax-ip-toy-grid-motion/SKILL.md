---
name: minimax-ip-toy-grid-motion
description: 把单个 IP 角色转为六宫格静态与动态海报；适用于吉祥物、潮玩和角色宣传。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# IP 潮玩六宫格动态海报（Codex 适配）

这是对本机 MiniMax Design「IP 潮玩六宫格动态海报」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先锁定角色身份、道具和六格布局。
- 以中心/指定格全屏开场后归位，再让其余格进入。
- 稳定阶段只做克制微动。

## 质量锁

- 六格中的角色身份和服装一致。
- 布局、圆角和背景色不漂移。
- 避免动态阶段新增未确认道具。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
