---
name: minimax-poster-motion-generator
description: 把已有海报锁版为文字可读、版式稳定的动态海报；适用于一镜到底的精致动效。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 海报动态生成（Codex 适配）

这是对本机 MiniMax Design「海报动态生成」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 分析比例、层级、文字、锚点和景深。
- 把上传海报作为不可改写的锁版参考。
- 按时间码设计局部运动、景深和同步音效。

## 质量锁

- 文字、Logo 和版式不漂移。
- 主体运动不破坏原海报阅读顺序。
- 首尾帧都可作为干净海报使用。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
