# 点阵品牌字形动效：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 `drama_get_state`，正式剧本/角色/镜头写入使用 `drama_update_plan`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

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
- 输出 `prompt1` 后停止，等待用户确认，再进入视频生成。
- 必须保留 reference 中的中文改写约束，包括白色圆点开场、最后一个字标锚定、首字到尾字动态变形、干净静态尾帧。
- 除非用户明确要求英文，否则不要把 `prompt1` 翻译成英文。

## STEP 3：生成品牌动效视频

默认先把旧 旧 H3 意图改写成连续自然语言，再通过审批链调用 Seedance 2.5 生成 `视频1`。如果用户明确指定其他模型，先检查其是否支持参考图、8 秒时长、2K、16:9 与音频生成，再遵循用户选择。以下固定参数用于 旧 MiniMax H3：

固定参数：
- Tool / model intent：`Seedance 2.5 视频生成审批链`
- Mode：`omni_reference`
- Reference image：`图片1`
- Tail frame / last frame / end frame：不要传任何尾帧参数；只使用 `omni_reference` / 全能参考模式
- Duration：`8`
- Resolution：`2K`
- Ratio：`16:9`
- Generate audio：`true`
- Prompt：`prompt1`

规则：
- `图片1` 只作为视觉参考和 prompt 文本中的最终尾帧目标；不要使用 first-last-frame 模式或工具级尾帧参数。
- 品牌名称和已授权标语必须准确保留。
- 已授权标语可以来自参考图，也可以来自用户明确输入。
- 除品牌名称和已授权标语外，不得添加产品规格、品类说明、注册符号、包装说明或任何其他可读文字。
- 所有临时圆环、轨道线、黑色圆圈和过渡点必须在最终落版前消失。
- 最后 0.5-1 秒必须在 `prompt1` 文本中明确要求直接匹配 `图片1` 的干净静态尾帧，不通过工具尾帧参数强制。
- 如果用户指定的模型生成失败，最多针对性重试一次，仍失败则切换 旧 MiniMax H3 或其他可用模型，不要反复重试同一模型。

## 质量检查

生成视频前检查：
- `prompt1` 已作为独立文本结果确认。
- `prompt1` 中的品牌名称与 `图片1` 可见文字一致；`图片1` 覆盖上传原图，作为 prompt 文字锚定依据。
- 标语只来自 `图片1` 或用户明确输入。
- 源 prompt 中的 “M” 对应从 `图片1` 读取出的 `first_character_exact`，“H” 对应 `last_character_exact`，滑出的前序文字必须等于 `prefix_before_last_character`。
- 最后一个字 / 字母保持参考图字标的字体、颜色、样式、位置和大小。
- 第一秒仍是抽象白色圆形 / 圆点，不得变成水滴或品牌具象物。
