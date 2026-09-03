# 双人游戏开场：完整制作工作流

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

# 双人游戏开场视频生成器

当用户想复用一套“双人合作游戏主菜单 / 开场动画”制作流程时使用本 Skill。流程会收集玩家信息、游戏标题、视觉风格和可选角色参考图；先生成一张确认首图，等待用户批准后，再创建最终 Seedance 2.5 视频提示词与视频方案。

## 平台适配规则

本 Skill 已适配平台发布结构，必须保持以下文件布局：

- `SKILL.md` 是默认英文运行文件。
- `SKILL.cn.md` 是中文镜像文件，语义必须与英文版保持一致。
- `meta.yaml` 保存展示名称、标签、版本、作者、来源和可选封面。
- 运行时提示词模板放在 `references/` 中，必须按路径加载，不要凭记忆重写。
- 不要写死项目输出路径，后续步骤使用生成或剪辑工具返回的文件路径。
- 最终视频生成前必须等待用户确认首图。

## 必需参考文件

以下两个模板是运行时必需输入，不是可选背景资料：

- 在 STEP 3 构建确认首图提示词、STEP 4 生成确认首图时，使用 `references/seedance-confirmation-image-template.md`。
- 在 STEP 6 回填最终视频提示词时，使用 `references/seedance-video-prompt-template.md`。

如果任一模板缺失，停止执行并说明 Skill 包不完整，不要临时改用其他提示词结构。

## STEP 1：收集视觉风格

请用户选择预设风格或输入自定义风格。所选风格具有最高优先级，会控制色彩系统、背景纹理、角色渲染、服装方向、UI 颜色、按钮和图标风格、字体质感与整体氛围。

如果用户不确定风格，先给出简短风格示例，不要直接生成。

## STEP 2：收集玩家和游戏信息

收集：

- PLAYER 1 名称
- PLAYER 2 名称
- 游戏标题
- 可选 PLAYER 1 角色参考图
- 可选 PLAYER 2 角色参考图

当用户上传角色图时，只把它们用于身份映射：可识别脸型轮廓、发型、眼镜、相对五官比例和个人特征。不要继承照片写实感、真实皮肤纹理、现实光线、相机质量或原图风格，除非用户选择的风格明确要求写实。

## STEP 3：构建确认首图提示词

加载并遵循 `references/seedance-confirmation-image-template.md` 作为必需提示词骨架。按顺序填写所有占位字段，并保持固定菜单框架不变。

填充后的提示词必须保留：

1. 16:9 横版游戏主菜单构图。
2. 两位居中的可玩角色。
3. 左上角玩家信息卡。
4. 右侧纵向菜单。
5. Continue 作为主要视觉焦点。
6. 游戏标题使用清晰可读的原创标题处理。
7. UI、图标、按钮、字体和装饰元素都与同一色彩系统联动。
8. 上传角色参考图中的身份锚点。

所选风格可以改变渲染方式、材质、纹理、视觉母题、光影氛围、UI 材料语言和字体外观，但不能改变布局层级与菜单逻辑。

## STEP 4：生成一张确认首图

只根据填充后的模板生成一张确认首图。该图是高成本决策检查点，用于确认风格、布局、身份映射、文字可读性和 UI 方向。

不要在同一步生成最终视频。

## STEP 5：等待批准或修改

等待用户批准首图。如果用户修改风格、名称、游戏标题、身份、布局可读性或画面方向，回到 STEP 3 并重新生成确认首图。

只有在用户明确批准后才能继续。

## STEP 6：回填 Seedance 2.5 视频提示词

用户批准后，加载 `references/seedance-video-prompt-template.md`，并用以下信息回填：

- 确认首图作为 UI / 布局参考。
- PLAYER 1 与 PLAYER 2 名称。
- 游戏标题。
- 已上传的身份参考图，如有。
- 已确认的视觉风格与色彩语言。
- 最终 UI 文案。
- 时间线事件与运动方向。
- 负面约束。

视频提示词必须保留固定事件框架，同时把所有视觉处理改写为用户选择的风格。

## STEP 7：生成最终视频

只有在首图批准后，才生成最终双人游戏开场视频。最终输出必须与确认首图和身份参考保持关联。

## STEP 8：修复常见失败

如果文字不可读，减少屏幕文字并强化字体约束。如果角色身份互换，强化玩家位置、姓名映射、服装锚点和颜色映射。如果脸部漂移，复用上传参考图，并明确保留身份锚点，同时把脸部渲染进所选风格。如果风格变弱，重写 Overall Style、Color Palette、Character Style、Background、Game UI、Buttons、Icons 和 Typography 等风格相关字段，不要改变固定框架。

## 触发测试示例

应触发：

- “Make a co-op game intro with two player names and a menu screen.”
- “帮我做一个双人游戏主菜单开场视频。”
- “Use Seedance 2.5 to create a two-player game menu animation.”

不应触发：

- “Build a playable co-op game prototype.”
- “Create a generic logo-only title sequence.”
- “Design a complex multi-page game settings UI.”
