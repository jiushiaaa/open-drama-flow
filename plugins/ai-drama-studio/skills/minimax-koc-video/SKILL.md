---
name: minimax-koc-video
description: 制作产品种草、创作者口播、专家分享、证言、无脸 POV 或手部实测；适用于社交平台转化内容。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# KOC / UGC 视频（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 锁定创作者身份、受众行动与产品事实
- 先写自然连续表达，再拆 0–3 秒 Hook 和证明镜头
- 按平台语气组织 A-roll、手部/POV 和产品证据

## 质量锁

- 口播像真实体验而非品牌公关稿
- 产品主张有实物或资料支持
- 不伪造用户证言

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 专业资料索引

- [references/creator-direction.md](./references/creator-direction.md)
- [references/hook-decision.md](./references/hook-decision.md)
- [references/production.md](./references/production.md)
- [references/script-and-shots.md](./references/script-and-shots.md)
- [references/source-routing.md](./references/source-routing.md)
