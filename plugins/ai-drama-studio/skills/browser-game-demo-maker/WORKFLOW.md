# 浏览器游戏 Demo 影像：完整制作工作流

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

# 浏览器游戏 Demo 制作 Skill

当用户要一张看起来像真实桌面浏览器里运行的本地 HTML5 游戏截图，随后再基于同一浏览器框架做成视频时使用本 Skill。它面向浏览器游戏手感测试、本地 demo 页、复古街机界面和截图到视频的连续交付，不适合海报设计、纯 UI Mockup 或泛化动效包装。生成前必须先读取 references/image-prompt.txt 作为生图原文、读取 references/video-prompt.txt 作为生视频原文，并且只使用对应文件的原文作为生成提示词，不得在其前后添加任何解释、标签、概述或改写。

视频默认按总控冻结请求并执行 Seedance 2.5。若用户明确指定其他模型，先检查该模型能力再遵循用户选择；如果生成失败，在原范围、剩余上限与实际失败状态明确后才考虑一次有界重试，仍失败时记录原因并停止，不自动切模型或增加次数。

## STEP 1：锁定截图合同

- 确认参考角色图，并保留角色身份、比例、服装和标志性配件。把 references/image-prompt.txt 当作截图阶段浏览器文字和按键文案的唯一真源，把 references/video-prompt.txt 当作视频阶段动作脚本与浏览器文案的唯一真源。
- 浏览器必须是完整的桌面 Chrome 窗口，而不是悬浮边框或风格化外壳。
- 如果用户已经给出标签页标题、地址栏 URL、导航按钮、书签、扩展、头像和菜单等信息，要原样保留。
- 如果用户已经写明游戏提示文案、按键说明和按钮标签，要保持逐字一致，并且生图阶段必须直接复制 references/image-prompt.txt 的全文，视频阶段必须直接复制 references/video-prompt.txt 的全文。
- 整体要像真实的 localhost Demo 页面，而不是海报、封面图或纯界面拼图。

## STEP 2：生成浏览器截图锚点

- 生成一张单图，让整个画面都被 Chrome 窗口占满。
- 顶部浏览器 UI 要清楚可见，本地 URL 要可读。
- 浏览器工具栏下方放置深色复古街机风的网页游戏画布。
- 角色居中站在细长地面线上，底部摆放虚拟按键。
- 使用参考角色作为身份锚点，并保持前后一致。运行时生图只取 references/image-prompt.txt 原文、视频只取 references/video-prompt.txt 原文，不得意译，不得补写提示结构。
- 不要额外添加可读文字、重复角色、额外按钮，或把画面做成宣传海报。

## STEP 3：视频前先确认锚点

- 如果浏览器文案、按键标签或角色身份还需要确认，先把截图锚点给用户确认。
- 如果截图需要修改，先修正锚点，再进入更高成本的视频生成。
- 这是视频阶段前唯一建议的确认点。

## STEP 4：生成匹配视频

- 复用已确认的截图或同一组参考素材，确保浏览器框架稳定。浏览器文字、UI 文案和动作序列必须与 references/image-prompt.txt / references/video-prompt.txt 完全一致，且不允许添加额外提示语。
- 保持固定机位，只让动作发生在 HTML5 画布内部。
- 按用户要求执行精确的动作序列，并让按钮反馈与画面动作同步。
- 全程保留 Chrome UI、本地 URL、复古游戏画布和同一角色身份。
- 声音保持克制干净，只保留轻微点击、按键下陷和街机式确认音效。

## STEP 5：分别交付

- 截图和视频要作为两个独立最终资产返回。
- 两个输出都要保留浏览器窗口框架感。
- 不要合并成海报、封面图或纯 UI 设计稿。
