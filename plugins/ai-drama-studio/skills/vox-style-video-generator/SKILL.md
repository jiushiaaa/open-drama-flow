---
name: vox-style-video-generator
description: 把知识主题、文章或研究资料转为混合媒介解释视频；适用于短纪录片、教育视频论文和旁白驱动叙事。
---

# Vox 风格解释视频

本能力按项目运行时执行，保留专业制作决策、质量标准和参考资料。模型与工具以实际能力清单为准；文件完整性由技能清单校验。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存用户目标范围内、自检后的剧本、角色和镜头；仅必要歧义或用户要求时询问。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 先建立论点、证据、旁白和章节结构
- 设计拼贴、撕纸、信息标签和浅层视差的统一视觉语法
- 先做主视觉与关键帧，再生成静音动画并配音剪辑

## 质量锁

- 事实、数据与引用保持可追溯
- 视觉隐喻不篡改论点
- 旁白、字幕、BGM 和镜头节奏一致

## OpenDramaFlow 运行合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

## 专业资料索引

- [references/runtime-tools-contract.md](./references/runtime-tools-contract.md)
- [references/ffmpeg-assembly.md](./references/ffmpeg-assembly.md)
- [references/vox-style-guide.md](./references/vox-style-guide.md)

## 脚本与数据

- [LICENSE](./LICENSE)
- [README.md](./README.md)
