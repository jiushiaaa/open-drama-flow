---
name: minimax-skill-creator
description: 把 MiniMax 或其他工作流沉淀为项目内 Codex Skill；适用于新增、迁移或改造可重复创作能力。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# MiniMax Skill 迁移创建（Codex 适配）

这是对本机 MiniMax Design「MiniMax Skill 迁移创建」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 提炼真实触发条件、输入输出和非显然决策。
- 把平台专属工具替换为 AI Drama Studio 可用工具。
- 保持隐式发现并用 quick_validate 校验。

## 质量锁

- 不复制平台私有工具名作为可用能力。
- 描述足够窄以避免误触发。
- 引用文件和脚本必须真实存在。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
