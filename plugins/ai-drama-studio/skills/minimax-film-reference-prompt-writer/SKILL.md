---
name: minimax-film-reference-prompt-writer
description: 把电影名称、剧照或截图组转成可执行的图像/视频提示词；适用于摄影、美术和运镜参考迁移。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 电影参考提示词（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 区分可见证据、已核验事实、合理推断和用户新增
- 拆解构图、光色、镜头、焦点、美术与空气感
- 把参考语言改写为 Seedance/Codex Image Gen 可执行描述

## 质量锁

- 不把推断冒充来源事实
- 避免只写电影名或空泛高级感
- 提示词包含主体、镜头、环境、运动与避让项

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 专业资料索引

- [references/.gitkeep](./references/.gitkeep)
- [references/camera-movement.md](./references/camera-movement.md)
- [references/prompt-and-output.md](./references/prompt-and-output.md)
- [references/visual-analysis.md](./references/visual-analysis.md)

## 脚本与数据

- [.gitkeep](./.gitkeep)
- [agents/.gitkeep](./agents/.gitkeep)
- [agents/openai.yaml](./agents/openai.yaml)
