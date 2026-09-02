---
name: minimax-h3-visual-design
description: 迁移字体/Logo 动态版式、主体追踪和实拍手绘互动等 H3 单点技法到 Seedance 工作流。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 单点动态视觉包装（OpenDramaFlow 适配版）

这是从本机 MiniMax Design 源 Skill 完整迁移并按本项目运行时重写的制作能力。它保留原工作流的专业决策、质量标准和参考资料，但 MiniMax 私有工具名不构成当前可调用能力。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存经用户确认的剧本、角色和镜头。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 先识别字体版式、追踪视觉或手绘互动路线
- 把平台专属 H3 表达转为可见运动与约束
- 以单点技法增强现有镜头，不接管完整叙事

## 质量锁

- 技法必须在时间轴中真实运动
- 文字和 Logo 保持准确
- 追踪元素与主体运动同步

## OpenDramaFlow 运行合同

- 图片：走 Codex Image Gen 任务领取、生成、目检、回填闭环。
- 视频：只在 `drama_request_paid_batch` 后由用户批准，再以 `drama_resume_paid_batch` 调用 Seedance 2.5；创建任务不等于成功。
- 剪辑：普通拼接、字幕、转码和音频混合用本地 FFmpeg 或 `drama_render_project`，并复核成片。
- 资产：Windows 本地路径不能直接充当供应商 `image_url`；必须使用供应商可访问 URL、可信 Asset ID 或上传桥。
- 完成：只有本地文件、供应商任务状态和最终媒体探针都给出成功证据时才报告完成。

## 本能力的硬边界

保留旧 H3 的视觉设计方法，但执行提示词必须改写给 Seedance 2.5；旧模型的参数、时长、原生音频和参考模式不能直接继承。

## 专业资料索引

- [references/h3-execution-grammar.md](./references/h3-execution-grammar.md)
- [references/handdrawn-live-action.md](./references/handdrawn-live-action.md)
- [references/music-direction-library.md](./references/music-direction-library.md)
- [references/style-cool-art.md](./references/style-cool-art.md)
- [references/style-dark-pop-glitch.md](./references/style-dark-pop-glitch.md)
- [references/style-fresh-cute.md](./references/style-fresh-cute.md)
- [references/style-poster-collage.md](./references/style-poster-collage.md)
- [references/style-tech-particle.md](./references/style-tech-particle.md)
- [references/subject-packaging-system.md](./references/subject-packaging-system.md)
- [references/td-cv-tracking.md](./references/td-cv-tracking.md)
- [references/td-visual-attributes.md](./references/td-visual-attributes.md)
- [references/typography-packaging.md](./references/typography-packaging.md)
- [references/typography-system-library.md](./references/typography-system-library.md)
