---
name: minimax-ui-motion
description: 基于真实品牌界面制作 App、SaaS 或网页 UI 动效；适用于状态变化、交互、卡片重组和界面演示。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# UI Motion（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 提取真实 brand profile、界面状态和交互顺序
- 编写时间码 storyboard 与连续状态转场
- 超过单条时长时用真实尾帧保持连续

## 质量锁

- UI 文案、布局和状态逻辑准确
- 光标行为与界面响应一致
- 没有真实品牌资料时先补齐而非套模板

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 专业资料索引

- [references/brand-analysis.md](./references/brand-analysis.md)
- [references/common-adaptations.md](./references/common-adaptations.md)
- [references/custom-style.md](./references/custom-style.md)
- [references/long-form.md](./references/long-form.md)
- [references/motion-prompt-writing.md](./references/motion-prompt-writing.md)
- [references/qa-checklist.md](./references/qa-checklist.md)
- [references/storyboard-schema.md](./references/storyboard-schema.md)
- [references/style-matching.md](./references/style-matching.md)
- [references/styles/A.md](./references/styles/A.md)
- [references/styles/B.md](./references/styles/B.md)
- [references/styles/C.md](./references/styles/C.md)
- [references/styles/D.md](./references/styles/D.md)
- [references/styles/E.md](./references/styles/E.md)
- [references/styles/F.md](./references/styles/F.md)
- [references/styles/G.md](./references/styles/G.md)
- [references/styles/H.md](./references/styles/H.md)
