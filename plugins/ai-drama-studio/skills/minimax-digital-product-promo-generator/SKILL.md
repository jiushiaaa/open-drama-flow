---
name: minimax-digital-product-promo-generator
description: 把真实网页、前端项目、截图或录屏转成数字产品宣传片；适用于功能发布和界面叙事。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 数字产品宣传片（Codex 适配）

这是对本机 MiniMax Design「数字产品宣传片」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 从真实页面提取布局、文案、品牌和交互事实。
- 先写功能证据—用户价值—结尾 CTA 的镜头合同。
- 屏幕画面优先使用真实截图或录屏，不重造关键文案。

## 质量锁

- 产品名称、数据和 UI 文案准确。
- 功能演示顺序与真实产品一致。
- 不虚构不存在的交互或效果。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
