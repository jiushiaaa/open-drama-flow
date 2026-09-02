---
name: minimax-film-reference-prompt-writer
description: 把电影名称、剧照或截图组转成可执行的图像/视频提示词；适用于摄影、美术和运镜参考迁移。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 电影参考提示词（Codex 适配）

这是对本机 MiniMax Design「电影参考提示词」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 区分可见证据、已核验事实、合理推断和用户新增。
- 拆解构图、光色、镜头、焦点、美术与空气感。
- 把参考语言改写为 Seedance/Codex Image Gen 可执行描述。

## 质量锁

- 不把推断冒充来源事实。
- 避免只写电影名或空泛高级感。
- 提示词包含主体、镜头、环境、运动与避让项。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
