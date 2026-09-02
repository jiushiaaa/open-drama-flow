---
name: minimax-image-remix
description: 提取参考图的构图、色彩、光影和氛围并生成内容不同的新图；适用于审美迁移而非复制主体。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 图片灵感重混（Codex 适配）

这是对本机 MiniMax Design「图片灵感重混」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 拆解形式、审美和氛围三层视觉 DNA。
- 明确必须变化的内容与必须保留的视觉关系。
- 用 Codex Image Gen 生成独立新构图。

## 质量锁

- 不复制受保护角色或品牌细节。
- 新内容与参考图有实质差异。
- 构图、色彩与光线迁移可被解释。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
