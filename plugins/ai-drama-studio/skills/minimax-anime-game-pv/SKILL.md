---
name: minimax-anime-game-pv
description: 制作 15 秒内二次元漫画、游戏角色、群像或世界观 PV；适用于角色觉醒、战斗、抽卡和活动宣传。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 二次元漫画/游戏 PV（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 用 Panel、Logical Shot 和主时间线统一二维叙事
- 锁定角色立绘、场景、标题和音频来源
- 整条编译角色出场、冲突、高潮和落版

## 质量锁

- 二维媒介与线稿风格不漂移
- 角色身份与技能特征一致
- 不把九宫格预览当成最终视频参考

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 专业资料索引

- [references/audio-direction.md](./references/audio-direction.md)
- [references/prompt-rules.md](./references/prompt-rules.md)
- [references/visual-inputs.md](./references/visual-inputs.md)
