---
name: minimax-handdrawn-live-video-generator
description: 制作手绘角色与实拍空间发生物理互动的短片；适用于触碰、显形、变形与手持追拍。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 手绘实拍融合（Codex 适配）

这是对本机 MiniMax Design「手绘实拍融合」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先定义手、笔尖或实物与手绘层的接触关系。
- 设计连续显形、变形、逃跑和慢半拍追拍。
- 以单场景连续动作优先于多段蒙太奇。

## 质量锁

- 接触点和遮挡关系可信。
- 笔触媒介全程一致。
- 手绘主体转换前后保持身份。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
