# 影视镜头语言 prompt 框架

> **何时 read**：影视分镜生图时——按六维度组装 prompt，每张图选 3-5 个维度起作用即可。
> **配套阅读**：视觉风格库 + 媒介风格锁走 `visual-styles.md`；角色卡 / 多视图布局走 `character-sheet-formats.md`。

生成分镜或剧照风格图时，按六维度组装 prompt，每张图选 3-5 个维度起作用即可。

## 六维度槽位

### 1. 景别（Shot Size）

| 中文 | 英文关键词 | 用途 |
|---|---|---|
| 大远景 | extreme wide shot, establishing shot | 交代环境 |
| 远景 | wide shot, full shot | 人物 + 环境 |
| 中景 | medium shot, waist-up | 对话、动作 |
| 近景 | medium close-up, chest-up | 情绪 |
| 特写 | close-up, face fills frame | 细微表情 |
| 大特写 | extreme close-up, eye / detail | 戏剧张力 |

### 2. 机位 / 角度

- 平视 `eye-level shot` —— 中性
- 仰拍 `low angle, looking up` —— 强大、压迫、英雄感
- 俯拍 `high angle, looking down` —— 弱小、孤独、客观感
- 鸟瞰 `bird's eye view, top-down` —— 抽离、命运感
- 荷兰角 `dutch angle, tilted frame` —— 不安、混乱
- 过肩 `over-the-shoulder` —— 对话主观感

### 3. 运镜暗示（静态图怎么表达运镜）

静态图无法真"运镜"，但可暗示运镜后的瞬间：

- 推镜后瞬间 → `intimate close framing, subject fills foreground`
- 摇镜中段 → `motion blur on edges, subject slightly off-center`
- 跟镜 → `subject in motion, camera at same speed, sharp subject + blurred background`
- 升降镜 → `tilted vertical perspective, sense of rising / falling`

### 4. 光影

| 风格 | 关键词 |
|---|---|
| 伦勃朗光 | Rembrandt lighting, triangle of light on cheek |
| 分割光 | split lighting, half face in shadow |
| 边缘光 | rim lighting, backlight outlining subject |
| 顶光 | top lighting, harsh shadow under eyes |
| 实用光源 | practical light, lamp / window / neon as motivated source |
| 体积光 | volumetric light, god rays, atmospheric haze |

### 5. 情绪

- 紧张：`high contrast, low key lighting, claustrophobic framing`
- 抒情：`soft diffused light, pastel palette, slow motion feel`
- 孤独：`negative space dominant, single subject, cool palette`
- 温馨：`warm golden tones, soft window light, family setting`
- 悬疑：`shadows obscuring face, fog / smoke, single light source`
- 史诗：`epic scale, wide composition, dramatic sky, low horizon`

### 6. 时间 / 光线时段

| 时段 | 关键词 |
|---|---|
| 黄金时刻 | golden hour, warm low sun |
| 蓝色时刻 | blue hour, twilight, ambient blue tone |
| 正午 | high noon, harsh overhead sun, short shadows |
| 夜景 | night scene, available light, neon / moon as key |
| 黎明 | dawn, soft pink-orange sky, low contrast |

## Prompt 组装模板

```
<景别>, <机位>, <主体描述>, <场景描述>, <光影>, <情绪>, <时间>, cinematic still, anamorphic lens, 35mm film grain, 2.39:1 aspect ratio
```

示例（紧张/夜戏）：

```
medium close-up, low angle looking up, weary detective lighting a cigarette, rain-soaked alley with neon reflections, rim lighting from neon sign, tense suspenseful mood, night scene, cinematic still, anamorphic lens, film grain, 2.39:1
```

示例（抒情/黄金时刻）：

```
medium shot, eye-level, young couple sitting on a hilltop bench overlooking the valley, golden hour low sun behind them creating rim light, warm soft palette, intimate hopeful mood, golden hour, cinematic still, anamorphic lens, subtle film grain, 2.39:1
```

示例（史诗/远景）：

```
extreme wide shot, low angle, lone warrior on a vast salt flat at twilight, dramatic stormy sky filling 70% of frame, blue hour ambient light, sense of awe and isolation, cinematic still, anamorphic lens, subtle grain, 2.39:1
```

## 通用规范

- 影视感图优先 2.39:1（宽银幕）或 16:9
- 加 `cinematic still / film still / movie scene` 关键词稳定风格
- 想要胶片质感加 `35mm film grain, color graded`
- 不写"真实电影名 + 同款风格"（容易被模型拒绝），改用风格描述词
- **每次生成提示都必须自包含完整角色外貌描述**（脸型 / 发色 / 发型 / 肤色 / 服装）。跨镜一致的系统化做法是 Subject Identity Lock：把固定角色描述卡片逐字复用到每张镜头的提示词里，并使用同一张参考图。
- **媒介风格锁**（写实 / 动漫 / 3D）必须显式写在 prompt 里，避免模型在镜头语言关键词的牵引下飘到错误的媒介——具体写法见 `visual-styles.md` 的"媒介风格锁"节。

## 配套 references

- **影视视觉风格 + 媒介锁** → `visual-styles.md`（赛博朋克 / 港片夜雨 / IMAX 史诗 等 8 种风格关键词组 + 写实/动漫/3D 媒介锁）
- **角度定义 / 网格规范 / 姿势库** → `character-sheet-formats.md`
