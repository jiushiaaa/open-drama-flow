---
name: minimax-promo-video
description: 从文本、网页、视频或 PPT 资料制作 Hook—Body—CTA 产品宣传视频；适用于多平台发布。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 产品宣传视频（Codex 适配）

这是对本机 MiniMax Design「产品宣传视频」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 提取真实产品事实、受众和发布平台。
- 用 Hook—证据—价值—CTA 编写脚本和分镜。
- 按平台画幅组织图片、视频、旁白和 BGM。

## 质量锁

- 卖点有来源且 CTA 明确。
- 平台安全区和时长符合目标。
- 不把素材缺口用虚构功能补齐。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
