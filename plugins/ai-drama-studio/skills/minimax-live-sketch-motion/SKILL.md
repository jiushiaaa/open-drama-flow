---
name: minimax-live-sketch-motion
description: 把实景照片或文字场景制作成笔尖同步手绘显影视频；适用于彩铅、蜡笔和空间遮挡效果。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 实景手绘显影（Codex 适配）

这是对本机 MiniMax Design「实景手绘显影」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 文字输入先建立真实空间锚点。
- 让笔尖、显影边界和主体动作同步推进。
- 手从画面边缘克制进入并遵守空间遮挡。

## 质量锁

- 背景先自然微动再发生显影。
- 笔尖位置与新增笔触一致。
- 主体显影前中后都保持生命感。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
