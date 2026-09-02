---
name: minimax-suspense-title-sequence-generator
description: 制作悬疑、犯罪、黑色电影或间谍风标题序列；适用于片名、卡司和复古节拍动效。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 悬疑电影片头（Codex 适配）

这是对本机 MiniMax Design「悬疑电影片头」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 先锁定片名、类型、剧情钩子、卡司和署名。
- 设计有限人物露出、剪影、拼贴和片名落版。
- 按音乐节拍编译关键帧与文字出现时间。

## 质量锁

- 所有署名逐字准确。
- 人物使用已授权或原创身份。
- 片头是标题序列而非剧情摘要混剪。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
