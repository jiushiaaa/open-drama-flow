---
name: minimax-backrooms-dreamcore
description: 把人物、宠物、物体或场景参考转为后室/梦核空间叙事；适用于诡异熟悉感、循环空间与环境氛围创作。 自动适配 AI Drama Studio、Codex Image Gen、Seedance 2.5 与本地 FFmpeg。
---

# 后室梦核（Codex 适配）

这是对本机 MiniMax Design「后室梦核」能力的 Codex 原生重构，不复制 MiniMax 专属工具调用。项目状态以 AI Drama Studio MCP 为准。

## 制作重点

- 从入口、重复、光线和遗留物提炼空间规则。
- 先做空间档案与关键帧，再决定图生视频路径。
- 以环境叙事和微妙异常代替廉价跳吓。

## 质量锁

- 参考主体身份仍可辨认。
- 透视、重复结构和光源逻辑统一。
- 避免无意的恐怖血腥化。

## 接入正式工作流

1. 先用 `drama_get_state` 读取真实项目；需要能力分流时调用 `drama_route_skills`，不要让用户手动安装或选择 Skill。
2. 用 `drama_update_plan` 保存正式剧本、角色和镜头；不创建示例故事、占位素材或假任务。
3. 图片优先走 Codex Image Gen 任务；视频只在真实审批通过后调用 Seedance 2.5；普通剪辑、字幕和音频混合使用本地 FFmpeg。
4. 只有本地文件、供应商任务和最终渲染都有成功证据时，才报告完成。供应商或编辑器尚未接入时，明确停在能力边界。
