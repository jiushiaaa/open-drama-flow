---
name: minimax-video-prompting
description: 为 Seedance 等指定图像/视频模型撰写或优化提示词；适用于单镜头、参考图、关键帧和编辑指令。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 视频模型提示词（Codex 适配）

这是对本机 MiniMax Design「视频模型提示词」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先确认目标模型、输入模式、画幅和镜头时长。
- 把主体、环境、镜头、动作、声音与连续性写成模型可执行描述。
- 对旧 Prompt 做保留项和冲突项审计。

## 质量锁

- 不混用其他模型私有参数。
- 一个提示词对应一个清晰镜头合同。
- 先审阅提示词，再触发真实调用。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
