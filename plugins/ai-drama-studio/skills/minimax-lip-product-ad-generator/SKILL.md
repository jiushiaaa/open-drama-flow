---
name: minimax-lip-product-ad-generator
description: 制作口红、唇釉、唇泥等唇部产品广告；适用于模特、产品静物和质地特写的组合。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 唇部彩妆广告（Codex 适配）

这是对本机 MiniMax Design「唇部彩妆广告」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先锁模特身份、唇色、包装与产品质地。
- 分别建立模特锚点和产品静物锚点。
- 以人物互动、质地微距和产品落版组织镜头。

## 质量锁

- 包装形态、色号和 Logo 连续。
- 唇妆颜色不在镜头间漂移。
- 不生成不真实的涂抹或吞咽动作。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
