# 点阵品牌字形动效：完整制作工作流

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

# Dot Matrix Brand Wordmark Motion

当用户提供 Logo、品牌名称图或含标语的品牌视觉素材，并希望生成一条可复用的 Logo / 标语驱动品牌动效视频时，使用本 Skill。

重要：为了保持生成质量，执行提示词保留在 `references/chinese-prompts.md` 中。生成 `图片1` 或改写 `prompt1` 时，必须按需读取并原样使用该 reference 中的中文提示词，不要翻译。

## 输入

必需：
- 一张 Logo 或品牌视觉图片，记为 `{{Logo}}`。

可选：
- 用户输入的品牌名称或标语。用户明确输入的标语可以进入 `图片1`、`prompt1` 和最终视频。
- 如果图片和用户输入中都没有标语，禁止自行生成标语。

## STEP 1：生成横版品牌名称图

使用 GPT Image 生成 `图片1`。

固定参数：
- Vendor / model：`gpt-image-2`
- Resolution：`2k`
- Aspect ratio：`16:9`
- Quality：`low`
- Reference image：`{{Logo}}`
- Text context：用户输入的品牌名和标语，如有

执行时原样使用 `references/chinese-prompts.md` 中的 `Image Plate Prompt`。

规则：
- 可读文字只能来自参考图或用户明确输入的品牌名 / 标语。
- 不得发明标语、产品卖点、产品规格、注册符号、品类说明或包装文字。
- 尽量保留原图主题色与可识别设计背景。
- `图片1` 是后续视频阶段唯一视觉参考。
- 如果存在已授权标语，`图片1` 中标语必须排在品牌名称下面；如果没有标语，则不得生成标语文字或标语占位。

## STEP 2：单独生成 `prompt1` 文本

由当前模型读取 `图片1`，结合用户明确输入的标语，先生成独立文本结果 `prompt1`，不要在同一步生成视频。`prompt1` 的最终品牌文字以生成后的 `图片1` 为准，而不是以上传原图为准。

执行时原样使用 `references/chinese-prompts.md` 中的两个部分：
- `Motion Prompt Rewrite Instruction`
- `Source Motion Prompt`

执行规则：
- 必须先读取 `图片1`，提取 `brand_name_from_image_1`、`slogan_from_image_1`、精确大小写、标点、空格和可见字标顺序。如果用户上传原图只显示 `G`，但 `图片1` 生成结果显示 `Google`，则 `prompt1` 必须使用 `Google`。
- 所有动效文字锚点必须由 `图片1` 中提取出的 `brand_name_from_image_1` 计算：`first_character_exact`、`last_character_exact`、`prefix_before_last_character`。不得沿用上传图、上一轮任务、品牌常识或历史生成结果中的首尾字母。
- `prompt1` 必须作为独立文本步骤 / 文本结果输出。
- 仅提示词请求到此交付；制作请求在 automatic 下自检后继续，manual 或用户明确要求阶段审核时才等待确认。
- 必须保留 reference 中的中文改写约束，包括白色圆点开场、最后一个字标锚定、首字到尾字动态变形、干净静态尾帧。
- 除非用户明确要求英文，否则不要把 `prompt1` 翻译成英文。

## STEP 3：生成品牌动效视频

按当前 Seedance 能力生成 `视频1`，不继承旧模型的 2K 或 omni_reference 字段。默认创意时长为 8 秒，实际请求先通过适配器校验：

- `videoInputMode: multimodal-reference`
- `mediaReferences`：将已验收的“图片1”绑定为 `reference_image`
- `duration: 8`；比例默认 16:9，清晰度用当前支持档位，不承诺原生 2K
- `audioMode: provider-native`（用户要求静音时为 none）
- `videoPrompt`：由 prompt1 的设计意图编译为连续自然语言
- 当前模板不需要尾帧约束；若用户明确要求首尾帧，改用合法双帧输入并重新冻结请求。

规则：
- `图片1` 只作为视觉参考和 prompt 文本中的最终尾帧目标；不要使用 first-last-frame 模式或工具级尾帧参数。
- 品牌名称和已授权标语必须准确保留。
- 已授权标语可以来自参考图，也可以来自用户明确输入。
- 除品牌名称和已授权标语外，不得添加产品规格、品类说明、注册符号、包装说明或任何其他可读文字。
- 所有临时圆环、轨道线、黑色圆圈和过渡点必须在最终落版前消失。
- 最后 0.5-1 秒必须在 `prompt1` 文本中明确要求直接匹配 `图片1` 的干净静态尾帧，不通过工具尾帧参数强制。
- 如果用户指定的模型生成失败，最多在原范围、剩余上限与实际失败状态明确后才考虑一次有界重试，仍失败则记录原因并停止该任务；不自动切换模型或增加调用上限。

## 质量检查

生成视频前检查：
- `prompt1` 已作为独立文本结果确认。
- `prompt1` 中的品牌名称与 `图片1` 可见文字一致；`图片1` 覆盖上传原图，作为 prompt 文字锚定依据。
- 标语只来自 `图片1` 或用户明确输入。
- 源 prompt 中的 “M” 对应从 `图片1` 读取出的 `first_character_exact`，“H” 对应 `last_character_exact`，滑出的前序文字必须等于 `prefix_before_last_character`。
- 最后一个字 / 字母保持参考图字标的字体、颜色、样式、位置和大小。
- 第一秒仍是抽象白色圆形 / 圆点，不得变成水滴或品牌具象物。
