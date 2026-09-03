---
name: film-reference-prompt-writer
description: 把电影名称、剧照或截图组转成可执行的图像/视频提示词；适用于摄影、美术和运镜参考迁移。
---

# 电影参考提示词

本能力按项目运行时执行，保留专业制作决策、质量标准和参考资料。模型与工具以实际能力清单为准；文件完整性由技能清单校验。

## 启动规则

1. 开始制作前，必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。
2. 按 WORKFLOW 中的阶段路由读取相关 `references/`；不要一次性加载无关资料。
3. 先调用 `drama_get_state` 获取真实项目状态；能力重叠时调用 `drama_route_skills`，并由得分最高的专用 Skill 主导。
4. 用 `drama_update_plan` 保存用户目标范围内、自检后的剧本、角色和镜头；仅必要歧义或用户要求时询问。不得创建示例故事、占位资产或虚假任务。

## 制作重点

- 区分可见证据、已核验事实、合理推断和用户新增
- 拆解构图、光色、镜头、焦点、美术与空气感
- 把参考语言改写为 Seedance/Codex Image Gen 可执行描述

## 质量锁

- 不把推断冒充来源事实
- 避免只写电影名或空泛高级感
- 提示词包含主体、镜头、环境、运动与避让项

## OpenDramaFlow 运行合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

## 专业资料索引

- [references/.gitkeep](./references/.gitkeep)
- [references/camera-movement.md](./references/camera-movement.md)
- [references/prompt-and-output.md](./references/prompt-and-output.md)
- [references/visual-analysis.md](./references/visual-analysis.md)

## 脚本与数据

- [.gitkeep](./.gitkeep)
- [agents/.gitkeep](./agents/.gitkeep)
- [agents/openai.yaml](./agents/openai.yaml)
