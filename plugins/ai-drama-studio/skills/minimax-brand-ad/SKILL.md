---
name: minimax-brand-ad
description: 制作 15 秒内由品牌官方或产品主角表达的轻量广告；适用于材质、工艺、Logo 过程和产品 Hero。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 品牌官方广告（Codex 适配）

这是对本机 MiniMax Design「品牌官方广告」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先判断品牌官方表达而非创作者体验。
- 建立品牌方向锁与产品/Logo 真实资产合同。
- 按材质、工艺、产品英雄镜头和落版编译时间线。

## 质量锁

- 品牌事实与资产来源可核验。
- 产品和 Logo 不被生成器改形。
- 超过轻量短片范围时交回总导演拆分。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
