# 角色场景分镜板：完整制作工作流

> 来源：MiniMax Design 本机 Skill。以下内容已迁移到 OpenDramaFlow 语义。若原工作流与本页顶部的运行时合同冲突，以运行时合同为准。

## 运行时合同

- 项目事实来自 `drama_get_state`，正式剧本/角色/镜头写入使用 `drama_update_plan`。
- 图片由 Codex Image Gen 任务闭环生成；视频由 Seedance 2.5 付费审批链生成；确定性媒体处理使用本地 FFmpeg。
- MiniMax H3 相关模型描述只作为旧提示词迁移背景，不能作为当前供应商参数或能力声明。
- 未接入的供应商、画布节点 API、音色克隆、TTS、音乐生成、3D 编辑器或剪辑工程写入必须显式停止，不得用占位结果冒充成功。

---

# 角色场景分镜板生成助手

接收角色参考图和剧本，生成一张包含角色设定、场景概念、分镜故事板的专业预制作综合设定图。

## 核心约定

- **推荐生图模型**：优先使用 g-image-2，因为它的文字排版和多参考构图能力适合综合设定图。用户指定其他模型且满足要求时遵循其选择；能力差异会影响结果时，说明差异并让用户决定。
- **输出形式**：默认输出一张综合设定图；内容过密会导致不可读时，先建议拆为两张配套设定图并取得确认。
- **Prompt 语言**：使用最有利于所选模型保持排版和文字质量的语言；画面可见标签使用用户确认的语言。
- **风格基准**：由用户在第 1 阶段从 6 种预设风格中选择（详见 `references/style-dictionary.md`）；未选择时询问，仍不确定则默认「S2 写实电影感」(照片级电影帧)
- **布局原则**：不固定四象限——根据角色数量、分镜多少和场景复杂度灵活排布；由所选模型决定整体比例和分区形状，同时保留全部必要模块
- **分镜格数**：默认 3 行 × 4 列 = 12 格；可按实际镜头数自适应（≤6 格用 2×3；≥16 格拆两张）

## 全局约定

- 每个阶段完成后在对话中展示结果，用户确认后继续
- 用户可在任意阶段要求修改
- Prompt 始终使用英文

## 工作流程

```
输入解析与确认 → 信息提取（角色/场景/分镜）→ 综合设定图生成 → 质量自检 → 交付
```

## 参考资料

按需读取(避免一次性把全部装入上下文)：

| 文件 | 用途 | 何时读 |
|------|------|--------|
| `references/style-dictionary.md` | 6 种预设风格的完整画面规则与关键词 | 第 1 阶段用户确认风格之后 |
| `references/brief-template.md` | brief.md 输出模板 | 第 1 阶段写 brief 时 |
| `references/prompt-template.md` | 综合设定图 prompt 模板 + 景别表 + 12 格节奏建议 | 第 2 阶段构建 prompt 时 |

---

## 第 1 阶段：输入解析 & 确认

### 必需输入

| 输入 | 是否必须 | 说明 |
|------|---------|------|
| 角色参考图 | ✅ 是 | 1-4 张，每张对应一个主要角色；全身/半身均可 |
| 剧本 / 场景描述 | ✅ 是 | 可以是自然语言、镜头列表、台词+动作描述均可 |
| 风格倾向 | 可选 | 如"电影感""古风""彩铅速写"；不提供则从参考图自动推断 |
| 目标画面比例 | 可选 | 分镜格内的画面比例（16:9 / 9:16 / 1:1），默认 16:9 |

### 流程

1. 逐张分析角色参考图，提取每个角色的：
   - 姓名（若用户未提供则命名为"角色A/B/C"）
   - 性别、年龄段、发型发色
   - 面部特征（眼镜/胡须/妆容等）
   - 服装款式与颜色
   - 体型与站姿
   - 表情神态基调

2. 解析剧本，提取：
   - 场景环境（室内/室外、时代背景、光线氛围）
   - 镜头数量与景别（ECU / CU / MS / WS 等）
   - 每个镜头的核心动作与情绪
   - 人物关系和心理冲突核心

3. 使用内置模板把解析结果整理为项目简报。

4. 在对话中向用户确认以下信息（**不得假定，必须确认**）：
   - **整体视觉风格**：从 `references/style-dictionary.md` 列出的 6 种预设中选 1,若用户未指定则列出选项让用户选
   - **分镜格内画面比例**（16:9 横版 / 9:16 竖版 / 1:1 方形），默认 16:9
   - **风格关键词补充**（可选，在预设风格基础上叠加个人偏好描述）
   - **是否需要将场景概念图单独扩展**（默认含在场景模块内）

### 风格选择

6 种预设风格(S1 复古彩铅速写 / S2 写实电影感(默认) / S3 黑白速写 / S4 水墨古风 / S5 欧美动漫 / S6 二次元动漫)的完整画面规则、关键词、叠加用法见 **`references/style-dictionary.md`**。

确认风格后,从该文件抄取对应行的 `文档底色 / 角色立绘 / 场景概念 / 分镜格 / 关键词` 五项,填入 `references/prompt-template.md` 的占位符。

### Brief 文件格式

使用 **`references/brief-template.md`** 整理第 1 阶段提取的项目信息、角色档案、场景档案和分镜列表。

---

## 第 2 阶段：综合设定图生成

### 文档布局策略（自适应，不固定四象限）

布局的核心原则：**内容决定结构，不是结构框死内容。** 根据角色数、镜头数和场景复杂度动态选择分区方式，并在 prompt 中明确内容优先级。

#### 布局决策流程

**Step 1：统计内容模块数量**

| 模块 | 条件 | 占用空间估算 |
|------|------|------------|
| 角色设定区 × N | 每个角色一个区 | 各占 1 份 |
| 场景概念区 | 有场景描述时 | 占 1-1.5 份（场景复杂时给更大） |
| 分镜故事板区 | 始终存在 | 格数多时占 1.5-2 份 |

**Step 2：根据总模块数选择大框架**

| 总模块 | 推荐大框架 | 典型例子 |
|--------|-----------|---------|
| 3 个（1角色+场景+分镜） | 横向三栏 或 L形 | 角色宽栏在左，场景+分镜叠在右 |
| 4 个（2角色+场景+分镜） | 2×2 田字 | 最经典，各占一格 |
| 5 个（3角色+场景+分镜） | 顶部三栏 + 底部两栏 | 三角色横排占顶，场景+分镜占底 |
| 6 个（4角色+场景+分镜） | 顶部四栏 + 底部两栏 | 四角色横排占顶，场景+分镜占底 |
| 分镜 ≥ 16 格 | 角色+场景占上半，分镜独占下半大块 | 分镜区域需要更多竖向空间 |
| 场景极复杂（多场景/多时间线） | 场景区独占一整行 | 场景区横跨全宽，上下各放角色和分镜 |

**Step 3：布局指令写法**

- **不要**在 prompt 里画死格子（❌ "put A in top-left, B in top-right"）
- **要**描述每个模块的相对权重和内容优先级，让模型自己安排（✅ "Character sheets for A, B, C should each have roughly equal space; the storyboard grid needs the most vertical space since it has 15 panels; the scene concept gets a medium-sized area"）
- 明确告知**哪个模块内容最多**，让它获得更大区域

#### 各场景布局参考示例

**1角色 + 简单场景 + ≤8镜：**
```
建议告知模型：角色设定区需要充裕空间展示三视图+立绘+表情；
场景区中等大小；分镜区中等大小。三区可横排或L形排列。
```

**2角色 + 场景 + 12镜（本次甄别室案例）：**
```
建议告知模型：两个角色设定区各占上方左右；
场景概念和分镜各占下方左右；经典田字形。
```

**3角色 + 场景 + 15镜：**
```
建议告知模型：三个角色设定区横排占顶部1/3；
场景概念占底部左侧；分镜占底部右侧且需要更多纵向空间（15格）。
顶部三栏 + 底部两栏的五区布局。
```

**4角色 + 多场景 + 20镜（需拆两张）：**
```
第一张：四个角色设定区 + 场景概念（4+1共五区）
第二张：独立高清分镜故事板（20格，4×5网格）
两张分开生成，告知用户。
```

### 各象限内容规范

#### 角色设定区（每个角色）

每个角色设定区必须包含以下元素：

1. **象限标题栏**（黑底白字）：`{角色名} {ROLE NAME} · 角色设定 CHARACTER SHEET`

2. **三视图**（顶部横排，小尺寸全身）：
   - 正面（FRONT 正面）
   - 侧面（SIDE 侧面）
   - 背面（BACK 背面）
   - 每个视图下标注朝向文字

3. **主立绘**（中心大图，胸部以上 3/4 角度半身像）：
   - 面部特征清晰可见
   - 服装细节可读
   - 表情为角色基础神态

4. **表情差分**（4个圆形图标，竖排或横排）：
   - 根据剧本情绪设计（如冷静/警觉/震惊/愤怒等）
   - 每个图标下方有中文情绪标注

5. **细节区**（道具/特征放大图）：
   - 标注"拆解细节 / DETAILS"
   - 角色专属道具或服装局部特写（如武器/配件/标志性细节）

6. **人物关系标注**（可选，底部小字）：
   - 与其他角色的关系一句话描述

#### 场景概念区（左下）

1. **象限标题栏**（黑底白字）：`主场景概念 SCENE CONCEPT · {场景名称}`

2. **氛围概念插图**（占象限主体）：
   - 按剧本设定的环境绘制
   - 光影处理与整体风格一致
   - 可包含剧本人物的大致剪影位置
   - 尽量展示纵深感和空间张力

3. **色彩参考条**（底部5色条）：
   - 5个色块，每个标注 hex 色值
   - 从左到右由暗到亮排列

4. **光影方案文字说明**（底部小字标注）：
   - 一行描述光源方向、对比度、氛围

#### 分镜故事板区（右下）

1. **象限标题栏**（黑底白字）：`分镜设定板 STORYBOARD · {场景标题}`

2. **分镜格网格**：
   - 每格由上到下：**镜号标签** + **插图** + **说明文字**
   - 镜号标签：左上角白字小标签，格式 `镜01 | 景别 | 时段`
   - 插图：按 {panel_ratio} 比例构图,**渲染方式与第 1 阶段确认的风格一致**(见 `references/style-dictionary.md` 对应行的「分镜格」字段,如 S2 用照片级电影帧、S5 用半调网点、S6 用动漫粗边框、S1 用彩铅速写、S3 用 gesture lines、S4 用淡墨晕染)
   - 说明文字：底部小字描述,字号样式跟随选定风格的标题栏配色

3. **分镜画风要求**(画风具体细节由选定风格决定,这里只规定**通用构图原则**)：
   - 高对比度,阴影/明暗关系清晰
   - 景别变化丰富(全景/中景/特写交替)
   - 关键帧突出心理张力(特写眼神、手部动作、光线反射)
   - **不得擅自改成黑白素描**——若选 S2 写实电影感就用照片级彩色电影帧,选 S6 二次元就用 cel-shading + 鲜艳平涂,选 S5 欧美动漫就用半调网点 + 粗边框,选 S4 水墨古风就用淡墨晕染,选 S1 复古彩铅就用彩铅笔触,只有 S3 才用纯黑白速写

### Prompt 构建模板

完整 prompt 模板、占位符填写规则和按选定风格调整负向约束的注意事项见 **`references/prompt-template.md`**。

构建前必读：
- 风格相关字段(`{STYLE_*}`)从 `references/style-dictionary.md` 选定的那一行抄写,五项必须配套使用,不得跨风格混搭
- 布局指令 `{LAYOUT_INSTRUCTION}` 描述各模块**相对权重**,不写固定坐标
- NEGATIVE 段必须按风格调整(选 S6 二次元时不能再禁 `color anime style`,选 S5 欧美动漫时不能再禁 `halftone`,选 S2 写实电影感时不能再禁 `photorealistic`)
- `{panel_ratio}` 是分镜格内画面比例，与文档整体比例无关；文档比例应服务于可读性

### 分镜格描述构建规则

每个分镜格描述需包含：镜号(PANEL 01)、景别(WS/MS/CU/ECU 等)、画面内容(主体+动作+方向+位置)、情绪标注、Caption 文字(中文,≤ 15 字)。

完整的景别速查表(EWS/WS/MWS/MS/MCS/CU/ECU 中英对照)和 12 格分镜节奏建议见 **`references/prompt-template.md`** 的"分镜格描述构建规则"段。

### 生成

- 使用全部已确认角色参考作为身份锚点；
- 内容保持可读时一次生成完整设定图；
- 只有内容密度确实需要时，经用户确认后拆为两张配套设定图。

### 质量自检

生成后按以下清单检查设定图：

```
Check this comprehensive design sheet for:
1. LAYOUT: Are all expected content modules present and clearly divided with title bars? Is there a document header? Does the layout make efficient use of space (no huge blank areas, no cramped sections)?
2. CHARACTER SHEETS: Does each character module have — three-view lineup, a large portrait bust, 4 expression badges, and a details/props section?
3. CHARACTER CONSISTENCY: Do all character illustrations across the document match the appearance described (hair, glasses, outfit, facial features)?
4. SCENE CONCEPT: Is there an atmospheric scene illustration with a color palette strip and lighting notes?
5. STORYBOARD: Are ALL expected panels present (count them) with shot number labels, illustrations, and caption text? Are panels composed for the specified aspect ratio?
6. STYLE CONSISTENCY: Is the selected visual style ({STYLE_NAME}) applied consistently across ALL modules — character drawings, scene concept, storyboard panels, document background, title bars? Are there any areas where the style feels inconsistent or defaults to a different aesthetic?
7. DOCUMENT STYLE: Does the overall look match a professional pre-production design sheet with the correct background color, title bar colors, and divider style for the chosen style?
8. SPACE EFFICIENCY: Does the storyboard region have enough space for all its panels? Do character regions feel appropriately sized — not too cramped, not wastefully large?
Report any missing elements, style inconsistencies, cramped areas, or quality issues.
```

不满足任一项 → 针对问题调整 prompt 重新生成（最多 2 次）。

### 交付产物

- 包含解析结果的项目简报；
- 作为主输出的综合设定图；
- 只有单图无法保持可读时才提供第二张配套设定图。

---

## 第 3 阶段：交付 & 迭代

### 用户确认

展示设定图后询问：
- 哪个部分需要调整？（角色相似度 / 分镜格内容 / 场景氛围 / 整体风格）
- 是否需要单独扩展某个部分（如独立生成高清角色立绘或场景概念图）

### 常见迭代方向

| 用户反馈 | 处理方式 |
|---------|---------|
| 角色脸不像参考图 | 在 prompt 中加强面部特征描述，增加 `strictly match face from reference image(8).png` 等字样 |
| 分镜格太小看不清 | 使用已确认参考和对应分镜描述，提供指定分镜格的高清版本 |
| 场景氛围不对 | 细化场景 prompt 中的光源方向、色调、建筑元素描述 |
| 表情差分不准确 | 在 prompt 中逐个描述表情（如"eyebrows furrowed, eyes wide, mouth slightly open in shock"） |
| 文字太小/乱码 | 减少每格 caption 字数至 ≤ 10 字，使用更粗字体描述 |
| 想要第4个象限改成别的内容 | 灵活调整：如替换成角色关系图、武器道具一览、色彩参考页等 |

### 延伸能力（用户要求时）

- **生成视频**：以已确认设定图继续进入视频制作流程；
- **高清单格导出**：使用已确认参考放大指定分镜格；
- **角色立绘扩展**：将角色设定区生成为独立高精度立绘。

---

## 完成输出

```
--- 角色分镜综合设定图完成 ---

项目：{project_name}
角色数：{N}
分镜格数：{shot_count} 格
画面比例：{panel_ratio}

主输出：已确认的综合设定图
```

---

## 错误处理

| 错误 | 处理方式 |
|------|---------|
| 推荐模型不可用 | 说明能力差异，让用户选择等待、改用兼容模型或接收完整提示词方案 |
| 角色参考图无法分析 | 请用户提供可读取的导出文件或替代素材 |
| 某个内容模块缺失 | 在 prompt 中逐模块加粗强调，标注"DO NOT omit this section" |
| 中文文字乱码/不可读 | 简化 caption 至纯英文或极短中文（≤ 6 字）；标题改用更大标注 |
| 角色脸与参考图差异大 | 在 prompt 中逐条列出面部关键特征，加入 `must strictly resemble reference` 约束 |
| 分镜格数不足 | 在 prompt 中明确标注 `{N} panels total, numbered 01 to {N}, none can be missing` |
| 某个模块空间太小/被压缩 | 在布局指令里明确指出该模块的优先级和相对权重，如 `the storyboard region must be the largest area` |
| 角色多导致单张塞不下 | 拆两张：第一张放所有角色设定+场景，第二张放完整分镜故事板 |

## 反模式警告

- ❌ 不得输出多张分离图——必须是单张综合文档图（内容实在太多时例外，需告知用户）
- ❌ 不得在没有角色参考图的情况下随意编造角色外貌
- ❌ 不得跳过角色参考分析直接拼 prompt——会丢失关键细节
- ❌ 不得在未确认分镜画面比例的情况下假定比例
- ❌ 不得在用户未指定风格时直接生成——必须先呈现 6 种风格选项让用户选择（或用户已明确描述风格时自动匹配最近的预设）
- ❌ 不得在同一张设定图里混用两种不同的视觉风格——角色区/场景区/分镜区必须使用同一套风格关键词
- ❌ 生成失败时不得静默更换用户已确认的模型
- ❌ 不得把分镜格画幅和整张设定图比例混淆——前者跟随确认的镜头格式，后者服务于文档可读性
- ❌ 不得省略质量自检步骤——缺模块、缺格、角色变形、风格漂移等问题必须通过自检发现并修正
- ❌ 不得在 prompt 里用"put X in top-left / bottom-right"等固定坐标描述布局——应描述各模块的相对权重和内容需求，让模型自行安排
- ❌ 不得为了强塞所有内容进一张图而让某个模块严重压缩到不可读——宁可拆两张，也不要牺牲可读性
