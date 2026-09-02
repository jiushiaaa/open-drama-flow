---
name: minimax-brand-promo-video-generator
description: 根据已授权品牌、产品、网站或 App 资料制作宣传短片；适用于新品发布、官网展示和社交推广。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 品牌宣传短片（Codex 适配）

这是对本机 MiniMax Design「品牌宣传短片」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 建立品牌事实与素材来源清单。
- 以受众、卖点、证据和 CTA 组织节拍。
- 只对已核验功能和文案做视觉表达。

## 质量锁

- Logo、包装和 UI 不被重绘错字。
- 每个卖点都有可见证据。
- 不得虚构产品功能或品牌背书。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
