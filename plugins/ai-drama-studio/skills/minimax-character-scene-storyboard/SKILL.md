---
name: minimax-character-scene-storyboard
description: 把角色参考、场景设定和剧情节点整合为专业角色场景分镜文档；适用于影视与漫剧前期设定。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 角色场景分镜板（Codex 适配）

这是对本机 MiniMax Design「角色场景分镜板」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 建立角色身份锚点、场景空间图和镜头顺序。
- 按需要组织三视图、表情、场景概念和故事板。
- 将最终镜头数据同步到项目 shot list。

## 质量锁

- 人物身份与服装跨格一致。
- 场景轴线和相对位置可用于后续生成。
- 版面是制作证据而非装饰拼贴。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
