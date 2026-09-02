---
name: minimax-papercraft-stop-motion-explainer
description: 用剪纸、纸雕、立体书或微缩纸艺制作知识讲解；适用于科学、教育与泛知识视频。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 纸艺定格科普（Codex 适配）

这是对本机 MiniMax Design「纸艺定格科普」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 提炼学习目标并选择纸艺视觉隐喻。
- 设计纸偶、分层布景、道具和可执行分镜。
- 按镜头规划纸片运动、运镜、转场和声音。

## 质量锁

- 知识内容准确且视觉隐喻不误导。
- 纸材、切边和层级全片一致。
- 避免出现塑料感或普通 2D 矢量质感。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
