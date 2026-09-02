---
name: minimax-minimalist-product-ad-generator
description: 把实体产品图制作成留白、细节特写和高质感节奏的极简广告；适用于电商与新品发布。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 极简产品广告（Codex 适配）

这是对本机 MiniMax Design「极简产品广告」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先核验产品事实、包装、材质和卖点。
- 建立独立产品锚点图与简短可信文案。
- 用留白、微距、材质运动和落版组织节拍。

## 质量锁

- 产品形态与标签不变形。
- 一镜一卖点且文案克制。
- 不以廉价光效掩盖真实材质。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
