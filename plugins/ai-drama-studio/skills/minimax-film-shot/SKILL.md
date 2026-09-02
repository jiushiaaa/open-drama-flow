---
name: minimax-film-shot
description: 用专业景别、机位、光影和调度设计影视镜头与角色卡；适用于漫剧分镜和角色一致性。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 电影镜头与角色卡（Codex 适配）

这是对本机 MiniMax Design「电影镜头与角色卡」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 用景别、机位、运镜、光影、情绪和时间六维描述镜头。
- 先锁角色卡再编译跨镜头提示词。
- 将轴线、视线和动作方向写入 shot list。

## 质量锁

- 角色脸型、发型、服装和身形稳定。
- 镜头设计服务剧情而非堆术语。
- 景别与动作在时长内可执行。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
