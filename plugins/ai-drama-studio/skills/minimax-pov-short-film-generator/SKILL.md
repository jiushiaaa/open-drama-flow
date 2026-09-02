---
name: minimax-pov-short-film-generator
description: 制作悬疑、生存、恋爱、职场等题材的沉浸式第一视角剧情短片；适用于眼睛视角叙事。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 第一视角剧情短片（Codex 适配）

这是对本机 MiniMax Design「第一视角剧情短片」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 将主角身体限制为合理可见的手、脚和反射边界。
- 以所见、所听和身体反应推进剧情。
- 为每镜写明视线方向、动作和环境反馈。

## 质量锁

- 不出现主角正脸或第三人称反打。
- 第一视角相机高度和运动连贯。
- 悬念来自叙事而非无逻辑抖动。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
