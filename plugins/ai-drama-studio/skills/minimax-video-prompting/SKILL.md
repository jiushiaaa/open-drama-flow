---
name: minimax-video-prompting
description: 为 Seedance 等指定图像/视频模型撰写或优化提示词；适用于单镜头、参考图、关键帧和编辑指令。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 视频模型提示词（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 先确认目标模型、输入模式、画幅和镜头时长
- 把主体、环境、镜头、动作、声音与连续性写成模型可执行描述
- 对旧 Prompt 做保留项和冲突项审计

## 质量锁

- 不混用其他模型私有参数
- 一个提示词对应一个清晰镜头合同
- 先审阅提示词，再触发真实调用

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 本能力的硬边界

当前可执行生成路线只有 Codex Image Gen 与获批后的 Seedance 2.5。Kling、Veo、Wan 等章节仅可作为比较资料，除非项目以后真实接入对应供应商。

## 专业资料索引

- [references/models/image-models/prompting.md](./references/models/image-models/prompting.md)
- [references/models/kling/prompting.md](./references/models/kling/prompting.md)
- [references/models/official-hilo/prompting.md](./references/models/official-hilo/prompting.md)
- [references/models/veo3/prompting.md](./references/models/veo3/prompting.md)
- [references/models/wan/prompting.md](./references/models/wan/prompting.md)
- [references/workflows/character-sheets.md](./references/workflows/character-sheets.md)
