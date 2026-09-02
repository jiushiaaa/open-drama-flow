---
name: minimax-line-doodle-explainer-generator
description: 把科学、人文或课程内容制作成极简线条涂鸦讲解视频；适用于知识点和教育短视频。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 线条涂鸦科普（Codex 适配）

这是对本机 MiniMax Design「线条涂鸦科普」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先提炼学习目标、核心观点和口播节奏。
- 建立统一线宽、角色符号和图解语法。
- 把抽象概念拆成可逐步显现的视觉步骤。

## 质量锁

- 信息准确且每镜只承载一个重点。
- 图解与旁白时间对齐。
- 不让装饰动画干扰理解。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
