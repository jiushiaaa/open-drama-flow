# 单点动态视觉包装：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 `drama_get_state`，正式剧本/角色/镜头写入使用 `drama_update_plan`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

---

# 旧 H3 Visual Design

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
| 品牌、产品卖点或商业叙事主导的广告 | `brand-ad` 或 `ad-tvc` |
| 角色觉醒、战斗、世界观或抽卡活动主导的二次元游戏 PV | `anime-game-pv` |
| 以参考视频证据分析和逐镜复刻为目标 | `video-deconstruct` |
| KOC / UGC 真人种草、测评、开箱或带货 | `koc-video` |
| 纯转写、SRT/ASS、字幕翻译或无动效字幕烧录 | 通用字幕/后期能力 |

判断依据是用户要交付的核心结果，不按单个关键词抢占其它完整品类 Skill。

## 3. 共同执行约束

1. 由 media-agent 直接执行，不创建 Stage Execution Plan，不派 planner 或 executor 重新设计。
2. 只读取所选路线明确要求的 references；路线 reference 是具体问询、Prompt 结构、生成方式和完成条件的真相源。
3. 只使用真实存在的附件、画布节点和用户事实；不得虚构素材路径、品牌、文字、人物身份或参考关系。
4. 保留用户明确指定的模型、时长、画幅、主体、文案和声音要求；只询问会阻塞所选路线的缺失信息。
5. 路线生成最终 Prompt 后，展示内容、派单内容与实际送入 旧 H3 的内容必须一致；不得让下游摘要、翻译或二次改写。
6. 具体路线的硬规则优先于本入口的通用规则；路线未通过自身完成检查时不得交付。
