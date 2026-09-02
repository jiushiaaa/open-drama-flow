---
name: minimax-vox-style-video-generator
description: 把知识主题、文章或研究资料转为混合媒介解释视频；适用于短纪录片、教育视频论文和旁白驱动叙事。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# Vox 风格解释视频（Codex 适配）

这是对本机 MiniMax Design「Vox 风格解释视频」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先建立论点、证据、旁白和章节结构。
- 设计拼贴、撕纸、信息标签和浅层视差的统一视觉语法。
- 先做主视觉与关键帧，再生成静音动画并配音剪辑。

## 质量锁

- 事实、数据与引用保持可追溯。
- 视觉隐喻不篡改论点。
- 旁白、字幕、BGM 和镜头节奏一致。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
