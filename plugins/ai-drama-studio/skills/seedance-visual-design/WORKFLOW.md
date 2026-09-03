# 单点动态视觉包装：完整制作工作流

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

# Seedance 2.5 Visual Design

将本 Skill 作为薄路由入口。主文件只判断视觉技法，不承载任何具体风格配方；确定路线后按需读取对应 reference，由该 reference 完成设置、Prompt、生成和交付规则。

## 1. 路线选择

| 主导意图 | 路线 | 必读 reference |
| --- | --- | --- |
| 给人物、产品、Logo、场景、口播或原片加入动态字体、标题、卡片、图形、字幕或 AE 感包装 | `typography-packaging` | [typography-packaging.md](references/typography-packaging.md) |
| 制作 TD / TouchDesigner / CV 调试视觉、追踪框、拓扑线、数字 ID、局部负片或“AI 看见的世界” | `td-cv-tracking` | [td-cv-tracking.md](references/td-cv-tracking.md) |
| 制作真人生活空间与二维手绘、涂鸦、蜡笔、粉笔动画融合的视频 | `handdrawn-live-action` | [handdrawn-live-action.md](references/handdrawn-live-action.md) |

明确出现 TD/CV 或手绘融合意图时优先进入对应路线；其余动态字体、Logo、口播和素材包装进入 `typography-packaging`。不要因为“炫酷”“特效”“视觉感”这类弱信号猜路线，缺少决定性信息时只询问一次用户想使用哪种表现技法。

一个任务默认只读取一条路线。用户明确要求组合两种技法时，先确定主路线，再只补读另一条相关 reference；不得预读全部路线或把三套规则拼进同一 Prompt。

## 2. 顶层边界

以下意图不进入本 Skill：

| 用户意图 | 去向 |
| --- | --- |
| 音乐、歌词、Rap、Fashion 表演或节拍分镜主导的完整 MV | `cool-music-video` |
| 品牌、产品卖点或商业叙事主导的广告 | `brand-ad` 或 `brand-promo-video-generator` |
| 角色觉醒、战斗、世界观或抽卡活动主导的二次元游戏 PV | `anime-game-pv` |
| 以参考视频证据分析和逐镜复刻为目标 | `video-deconstruct` |
| KOC / UGC 真人种草、测评、开箱或带货 | `koc-video` |
| 纯转写、SRT/ASS、字幕翻译或无动效字幕烧录 | 通用字幕/后期能力 |

判断依据是用户要交付的核心结果，不按单个关键词抢占其它完整品类 Skill。

## 3. 共同执行约束

1. 由 Codex 按总控计划执行，本技能提供视觉设计方法；不依赖其他平台的子 Agent 或固定阶段接口。
2. 只读取所选路线明确要求的 references；路线 reference 是具体问询、Prompt 结构、生成方式和完成条件的真相源。
3. 只使用真实存在的附件、画布节点和用户事实；不得虚构素材路径、品牌、文字、人物身份或参考关系。
4. 保留用户明确指定的模型、时长、画幅、主体、文案和声音要求；只询问会阻塞所选路线的缺失信息。
5. 路线生成最终 Prompt 后，展示内容、派单内容与实际送入 Seedance 2.5 的内容必须一致；不得让下游摘要、翻译或二次改写。
6. 具体路线的硬规则优先于本入口的通用规则；路线未通过自身完成检查时不得交付。
