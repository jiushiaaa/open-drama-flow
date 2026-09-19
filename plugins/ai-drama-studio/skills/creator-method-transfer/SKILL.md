---
name: creator-method-transfer
description: 将外部创作资料转化为可检验的动作、表演和运镜方法；用于方法迁移与实验复盘，不替代制作总控。
---

# 创作方法转化与实证

将工作区研究中重写的方法整理为可移植技能。原始博主资料、电影、研究日志和实验视频不随插件分发；参考页中的实验编号仅是历史案例，不是用户项目的运行依赖或已验收结论。

开始前必须完整阅读 [WORKFLOW.md](./WORKFLOW.md)。用 `drama_get_state` 读取当前状态，再通过 `drama_route_skills` 确认主导技能；仅在用户授权修改计划时调用 `drama_update_plan`。只要求学习或比较时不生成视频。

## 按任务读取

- 动作、重心、抓握与白模：[动作与空间](references/action-and-space.md)。
- 事件驱动情绪、对白与声音：[表演与台词](references/performance-and-dialogue.md)。
- 元素机制、材质与环境层次：[风格与特效](references/style-and-effects.md)。
- 来源、反例、阅读与实际验收的区别：[证据与来源](references/evidence-and-provenance.md)。
- 分镜展开、资产与跨镜交接：[分镜与资产转化](references/storyboard-transfer.md)。
- 相机路线、遮挡接镜与音画剪辑：[运镜与转场](references/camera-and-transitions.md)。
- 用户要求完整学习和验证：[完整学习与实践](references/full-study-to-practice.md)。
- 借鉴即梦方法、Shot/Clip、风格卡：[即梦方法转化](references/jimeng-method-transfer.md)。
- 将实验组合成完整作品：[原创短片迭代](references/graduation-film-iteration.md)。

按当前问题选择，不默认加载所有参考，不将一个项目的服装、剧情或审批授予其他项目。

## OpenDramaFlow 运行合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

## 验收边界

每个假设写清输入条件、可观察结果和失败点。保存原片与实际请求；成功输出的后处理失败不重新付费生成。未知任务先查原 ID。静态抽帧、完整观看、听音、Agent 审查与用户接受分别记录；白模只验证相应几何，不代表生成模型掌握了精确动作。
