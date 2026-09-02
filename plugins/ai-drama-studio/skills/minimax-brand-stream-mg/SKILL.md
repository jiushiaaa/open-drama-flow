---
name: minimax-brand-stream-mg
description: 把 Logo 与主题词制作成双色霓虹流线 MG 动效；适用于品牌片头、发布预热和标志动效。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 品牌流线 MG（Codex 适配）

这是对本机 MiniMax Design「品牌流线 MG」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 从品牌色、字形和核心卖点推演流线主角。
- 用能量节点、路径汇聚和 Logo 落版组织时间线。
- 无文字 Logo 不凭空添加品牌字。

## 质量锁

- Logo 轮廓和字形保持准确。
- 流线运动有明确起点、汇聚与收束。
- 不让装饰粒子遮挡品牌识别。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
