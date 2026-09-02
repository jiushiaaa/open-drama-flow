---
name: minimax-voice-clone
description: 为有权使用的参考音频规划合规音色克隆与 TTS；适用于短剧角色配音，不代表当前项目已接入克隆供应商。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 合规音色克隆（Codex 适配）

这是对本机 MiniMax Design「合规音色克隆」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先确认声音权利、用途和可撤回性。
- 检查人声纯度、时长、静音、噪声和语种。
- 只有已配置真实供应商时才提交克隆，否则输出接入计划。

## 质量锁

- 不得克隆公众人物或未授权第三方。
- 不生成或保存虚假的 voice_id。
- 试听文本不得包含敏感或误导用途。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
