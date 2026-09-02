---
name: minimax-skill-reviewer
description: 只读审查项目内创作 Skill 的结构、触发描述和工作流质量；适用于发布或安装前验收。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 创作 Skill 审查（Codex 适配）

这是对本机 MiniMax Design「创作 Skill 审查」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 检查 frontmatter、命名、描述和引用完整性。
- 评估触发覆盖、排他边界与渐进披露。
- 输出按优先级排序的只读改进报告。

## 质量锁

- 审查阶段不修改文件。
- 区分结构合规与实际行为质量。
- 不把关键词堆叠当成可靠路由。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
