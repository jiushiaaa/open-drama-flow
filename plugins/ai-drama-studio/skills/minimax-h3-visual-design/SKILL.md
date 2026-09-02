---
name: minimax-h3-visual-design
description: 迁移字体/Logo 动态版式、主体追踪和实拍手绘互动等 H3 单点技法到 Seedance 工作流。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 单点动态视觉包装（Codex 适配）

这是对本机 MiniMax Design「单点动态视觉包装」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先识别字体版式、追踪视觉或手绘互动路线。
- 把平台专属 H3 表达转为可见运动与约束。
- 以单点技法增强现有镜头，不接管完整叙事。

## 质量锁

- 技法必须在时间轴中真实运动。
- 文字和 Logo 保持准确。
- 追踪元素与主体运动同步。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
