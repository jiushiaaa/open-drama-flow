---
name: minimax-3d-director-stage
description: 为 3D 场景进行角色走位、构图、相机和运动设计；适用于可控 3D 预演与镜头审查。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 3D 导演舞台（Codex 适配）

这是对本机 MiniMax Design「3D 导演舞台」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先感知现有场景、角色、相机与坐标系。
- 用可验证 blocking、构图和相机运动描述镜头。
- 无 3D 编辑会话时输出预演合同而不冒充已修改场景。

## 质量锁

- 空间关系和轴线可复现。
- 相机运动不穿模或丢失主体。
- 修改后必须从目标视角复核。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
