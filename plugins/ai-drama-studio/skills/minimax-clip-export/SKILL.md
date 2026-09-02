---
name: minimax-clip-export
description: 把已完成的镜头、音频和字幕时间线导出到可继续精修的剪辑工程；适用于剪映/CapCut 交接。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 剪辑工程导出（Codex 适配）

这是对本机 MiniMax Design「剪辑工程导出」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先验证源素材路径、帧率、画幅和时间线。
- 优先使用项目已有本地素材和 FFmpeg 产物。
- 只有目标格式适配器真实可用时才声明工程已导出。

## 质量锁

- 素材引用不丢失且时间码一致。
- 字幕、音频和视频轨道对齐。
- 不以 JSON 占位文件冒充可打开工程。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
