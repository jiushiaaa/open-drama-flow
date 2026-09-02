---
name: minimax-3d-animation-short-generator
description: 把故事创意制作成连续的风格化 3D 动画短片；适用于角色、场景、镜头和声音需要统一规划的 3D 叙事。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 3D 动画短片（Codex 适配）

这是对本机 MiniMax Design「3D 动画短片」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先锁定 3D 媒介、角色材质、场景尺度与音频方案。
- 用故事—角色—场景—镜头四级连续性表编译分镜。
- 按镜头生成锚定图和视频，再统一声音与剪辑。

## 质量锁

- 角色比例、材质和服装跨镜头一致。
- 镜头衔接保留动作方向与空间关系。
- 不把孤立炫技镜头冒充完整短片。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
