---
name: minimax-video-deconstruct
description: 把参考视频、关键帧或详细描述拆成可验证镜头证据并编译复刻 Prompt；适用于逐镜反推结构。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 视频拆解与复刻（Codex 适配）

这是对本机 MiniMax Design「视频拆解与复刻」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 区分可见镜头、运动、声音和连续性证据。
- 产出逐镜报告、复刻合同和 Seedance 提示词。
- 新内容仅借鉴风格时转对应品类 Skill。

## 质量锁

- 每项复刻要求都能指向参考证据。
- 不声称像素级复制不可控生成结果。
- 版权或身份敏感内容先确认授权。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
