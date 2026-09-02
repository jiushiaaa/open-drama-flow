---
name: minimax-education-studio
description: 制作课程、知识讲解、练习、讲义和教学视频；适用于明确的教学、学习或评量目标。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 教育内容工作室（Codex 适配）

这是对本机 MiniMax Design「教育内容工作室」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先建立受众、学习目标、先备知识和评量方式。
- 设计讲解、例题、活动与练习的学习路径。
- 视频镜头以教学动作和旁白合同驱动。

## 质量锁

- 知识准确且难度匹配受众。
- 每个视觉服务一个学习目标。
- 教育题材附件本身不构成自动触发。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
