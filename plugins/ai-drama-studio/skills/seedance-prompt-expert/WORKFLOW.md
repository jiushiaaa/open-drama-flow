# Seedance 多模态提示词专家：完整制作工作流

> 本工作流由 OpenDramaFlow 总控调度，默认按 Seedance 2.5 当前适配器执行。

## 运行时合同

- 总控优先：必须完整阅读[总控执行规则](../ai-drama-producer/references/execution-contract.md)。默认 automatic，在用户目标与冻结上限内自动规划、自检和执行；专业阶段的方案/提示词确认不另设人工关卡，除非用户要求或当前为 manual。只要求提示词时不得启动生成。
- 图片：必须先阅读[图片生成与用户验收入库合同](../ai-drama-producer/references/image-asset-contract.md)。默认 Codex 内置图片工具（image2）生成库外候选，展示并经用户验收后才入库／完成任务；仅内置不可用、失败或用户明确要求时使用项目图片模型。自动执行不等于图片验收，也不等于批准生产记忆。
- 视频：Seedance 2.5 使用 `drama_request_paid_batch` 冻结请求，再用 `drama_authorize_and_start_paid_batch` 按当前策略启动；`drama_resume_paid_batch` 只恢复原有 waiting 任务。automatic 不弹产品审批框，manual 才要求可信确认，宿主权限独立。
- 提示词：必须阅读[Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md)，用当前能力与 ShotSpec 编译请求。参数由当前适配器校验，不继承其他供应商字段或强制节点流程。
- 声音：ASR 与标准音色 TTS 已接入，先查 `drama_get_capabilities`；没有语音 Key 时使用 Seedance 原生声音并实际听音检查。声音克隆、独立音乐生成、3D 编辑器与剪辑软件工程写入尚未接入，不伪造结果。
- 项目与资产：用 `drama_get_state` 读取事实、`drama_update_plan` 保存实际方案；稳定 assetId 与版本不随文件夹路径变化，本地路径不能直接充当供应商 URL。
- 完成：FFmpeg 用于确定性剪辑；生成/下载/探针成功不是交付。按总控检查实际画面、运动、对白、音轨与字幕，记录质量审核后才完成交付。

---

## 目标与启动

把用户的创意、参考素材、关键帧或编辑要求转成可执行的镜头合同。先读取 [Seedance 专业指南](../ai-drama-producer/references/seedance-prompting.md) 和 [核心创作方法](references/core-workflow.md)。
默认按用户语言输出，不强制英文、不设固定长提示词门槛，不把内部规划字段冒充官方 Prompt 格式。只请求提示词时不调用生成。

## 输入决策

| 目标 | 当前模式 | 必读资料 |
| --- | --- | --- |
| 无媒体输入 | `text-to-video` | [纯文本](references/text-to-video.md) |
| 一张实际起始画面 | `image-to-video` | [首帧](references/image-to-video.md) |
| 两张明确的起止画面 | `first-last-frame` | [首尾帧](references/first-last-frame.md) |
| 只有目标尾帧 | 不伪造独立尾帧模式 | [尾帧边界](references/last-frame-boundary.md) |
| 多图、视频或音频参考 | `multimodal-reference` | [多模态](references/modes-all-purpose-reference.md) |
| 接续现有视频 | `video-extend` | [续写](references/video-extend.md) |
| 修改源视频部分内容 | `video-edit` | [编辑与保留](references/editing-preservation.md) |

再按风险选读 [音频与对白](references/audio-dialogue.md)、[文字与版式](references/text-ui-layout.md)、[领域表达](references/pattern-grammars.md)。只有缺项会改变成片时才参考 [必要澄清](references/clarification-routing.md)。

## 1. 理解与素材核验

从目标提取主体、受众、时长/画幅、风格、声音和验收标准；已提供信息不重复问。对每份素材说明能够证明与不能证明的内容。角色图不能冒充场景图，风格图不能改变产品外形，参考视频不能擅自引入原片角色或品牌。

实际查看图片、播放视频并听音。所有绑定是当前素材库中的真实 assetId + 冻结版本；提示词中的编号与发送顺序对应。用户上传“已有”的素材仍需核验，不编造引用。库外生成图片必须先展示并经用户验收后入库，才能成为正式生产参考。

## 2. 规划镜头

一个短镜头优先一个主要动作和一个主要运镜；复杂任务按因果顺序拆成可完成的镜头。保留身份、服装、道具手、空间轴线、初态与终态。用视线、呼吸、接触与停顿表达情绪，而不是堆风格词。

案例节奏可选 10/15 秒，但不是模型上限。当前 2.5 档位参数见总控专业指南，提交时再次校验；不能从其他模型沿用帧率、分辨率或参考数量。

## 3. 编译与执行

输出两层，不能混为一层：

- 镜头合同：`videoInputMode`、`duration`、`mediaReferences: [{assetId, role}]`、`videoParameters: {ratio, resolution}`、显式 `audioMode`，以及按需的 `edit` 或 `continuation`。
- `videoPrompt`：参考职责 → 初态 → 按时间推进的动作和摄影机运动 → 终态/保留项 → 对白与声音。需要静态候选时另写 `imagePrompt`。

普通参考用 reference_image / reference_video / reference_audio；实际首尾帧才用 first_frame / last_frame。声音必须落到 audioMode，不能用一句“静音”代替关音字段。已指定的对白、文字和片长不能擅改。

在用户授权制作范围内自检并写入计划，按总控冻结请求、自动或手动策略启动。当前自动策略不要求用户逐镜点击方案；人工图片验收、可信记忆确认仍保留。不得绕过 Harness 直接调用供应商或编造工具。

## 4. 结果与修订

完整播放、听音，并检查身份、动作、接点、对白、字幕和音轨；首尾帧比较真实结果，编辑对照改动范围和保留范围。ASR 和抽帧是辅助证据，不等于全片审核。

超时先查询原任务，已失败才按剩余上限做有界重试。更改参考、声音、时长或提示词时冻结新请求，生成新版本，不覆写已交付资产。局部编辑不宣称像素锁定，续写不宣称自动无缝。
