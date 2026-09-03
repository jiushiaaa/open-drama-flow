# 影视风格参考库

> **何时 read**：写影视场景 prompt 时选定调（8 种视觉风格 + 媒介风格锁的详细规范）。
> **配套阅读**：六维镜头 prompt 框架走 `shot-language.md`；角色卡 / 多视图布局走 `character-sheet-formats.md`。

按下表挑选目标风格，把"关键词组合"塞进 prompt 即可。

## 风格速查

### 赛博朋克（Cyberpunk）

- 色板：霓虹粉紫蓝、暗黑底色、高饱和反射
- 构图：街道纵深、上仰天际线、玻璃反射多层信息
- 光影：霓虹招牌做主光、雨后地面反射、烟雾弥漫
- 关键词：`cyberpunk city, neon-lit rainy street, holographic signs, wet asphalt reflections, atmospheric haze, dystopian future`

### 港片夜雨式（霓虹叙事）

- 色板：高饱和品红 + 电青、暖钨丝灯
- 构图：狭窄空间、对称半身、慢门拖影感
- 光影：单一光源、面部一半在阴影、窗格投影
- 关键词：`saturated magenta and cyan palette, claustrophobic interior, slow shutter motion blur feel, single neon light source, smoky atmosphere, longing mood`

### IMAX 史诗式（几何冷调）

- 色板：冷青蓝灰、低饱和、金属感
- 构图：超大尺度、低水平线、几何对称
- 光影：自然光为主、强对比、实用光源真实感
- 关键词：`IMAX scale composition, cool teal-grey palette, practical lighting only, high contrast, geometric architecture, sense of awe`

### 对称糖果色（Wes Anderson Style）

- 色板：粉色、芥末黄、薄荷绿、奶油白
- 构图：完美居中对称、平面化构图、正面平视
- 光影：均匀柔光、低对比、平面感
- 关键词：`Wes Anderson style, perfectly symmetrical composition, pastel candy palette, flat frontal perspective, even soft lighting, miniature dollhouse feel`

### 北欧极简（Nordic Minimal）

- 色板：冷白、灰蓝、原木色、低饱和
- 构图：大量留白、单点构图、极简元素
- 光影：柔和散光、漫反射、阴天感
- 关键词：`Nordic minimalist aesthetic, cool white and grey palette, vast negative space, single subject, soft overcast lighting, tranquil mood`

### 70s 胶片（怀旧颗粒）

- 色板：暖黄橙、褪色感、低对比
- 构图：松散随性、自然抓拍感
- 光影：温暖自然光、镜头眩光、四角失光
- 关键词：`1970s film aesthetic, faded warm tones, heavy 35mm grain, lens flare, vignette, nostalgic candid feel, Kodak Portra look`

### 黑色电影（Film Noir）

- 色板：高对比黑白、深阴影
- 构图：百叶窗投影、半身阴影脸
- 光影：硬光、单光源、戏剧性投影
- 关键词：`film noir, high contrast black and white, venetian blind shadow patterns, hard single light source, smoke-filled room, mysterious mood, 1940s detective scene`

### 自然写实（Naturalistic Drama）

- 色板：自然肤色、土色调、绿植
- 构图：手持感、稍微失稳、近距离观察
- 光影：自然窗光、可见的环境光源、柔和过渡
- 关键词：`naturalistic lighting, handheld feel, intimate close framing, available window light, muted earth tones, documentary-style realism`

## 使用指南

1. **从一种风格出发**：一张图只用一种风格，混合容易崩
2. **关键词数量**：选 4-6 个最有代表性的，不要把整段都塞进去
3. **使用风格参考图**：所选模型支持时，使用已确认的风格参考素材通常比纯文字更稳定
4. **风格 + 内容分开写**：先写"内容场景描述"，再加"风格关键词组"，避免风格词污染主体描述

## 按场景选风格速查

| 场景 | 推荐风格 |
|---|---|
| 城市夜戏 | 赛博朋克 / 港片夜雨 / 黑色电影 |
| 日常生活 | 自然写实 / 北欧极简 / 70s 胶片 |
| 史诗大场面 | IMAX 史诗 |
| 童话 / 复古喜剧 | 对称糖果色 |
| 悬疑 / 罪案 | 黑色电影 / 港片夜雨 |
| 文艺 / 个人叙事 | 70s 胶片 / 自然写实 |

## 反模式

- 写"in the style of [真实导演名]" → 容易被拒；改用风格描述词
- 把多种风格关键词混在一个 prompt → 风格全崩
- 风格描述写在主体描述前 → 模型可能把风格词当成主体而非氛围
- 同一图里同时写"赛博朋克 + 北欧极简" / "黑色电影 + Wes Anderson" 这种相反美学的关键词组 → 风格全崩，模型会输出无定向的灰色画面

---

## 媒介风格锁（在美学风格之前先锁定的更基础一层）

上面的 8 种风格属于"美学风格"（mood / palette / lighting）。但还有更基础的一层是**媒介风格**——画面是写实照片、2D 动漫还是 3D 渲染。**没显式锁定媒介，模型会被镜头语言 / 美学风格关键词牵着鼻子飘到错误的媒介**（例如写"cyberpunk neon street"模型很容易出动漫风而非写实风）。

### 三种媒介

| 媒介 | 何时用 | Prompt 必须显式写 | 同时排除 |
|---|---|---|---|
| **写实摄影 / 实拍** | 真人剧照、写实分镜、电影级视觉 | `Medium: hyper-realistic photography. Photorealistic, live-action film still.` | `NOT anime, NOT cartoon, NOT 2D illustration, NOT 3D render` |
| **2D 动漫 / 插画** | 动画分镜、动漫角色卡、漫画风 | `Medium: 2D anime illustration style. Hand-drawn anime aesthetic.` | `NOT photoreal, NOT live-action, NOT 3D render` |
| **3D 渲染 / CG** | 游戏 CG、Pixar 风、3D 电影概念图 | `Medium: stylized 3D render. CG animation style.` | `NOT photoreal, NOT anime, NOT 2D illustration` |

### 使用规则

1. **每一次生成提示都要写**——不要假设后续生成会自动继承整组媒介
2. **写在 prompt 顶部、紧跟主体描述之后**——位置太靠后会被镜头语言关键词稀释
3. **必须同时写"NOT 排除项"**——单写正向不够，模型常常会"两者兼容"地融合两种媒介，输出半真半画的怪物
4. **整组分镜锁同一种媒介**——别第 1 张写实、第 2 张动漫，跨镜一致性直接崩

### 反例

> 错：`cyberpunk city, neon-lit rainy street, anime girl walking, cinematic` —— "cyberpunk + cinematic" 把模型拉向写实，"anime girl" 拉向动漫，结果是"半真人半动漫"的怪图
>
> 对：`Medium: 2D anime illustration style. Hand-drawn anime aesthetic. NOT photoreal, NOT live-action. Cyberpunk city, neon-lit rainy street, anime girl walking. Cinematic composition, 2.39:1 aspect ratio.`

---

## 配套 references

- **镜头语言（景别 / 机位 / 光影）** → 配合 `shot-language.md` 使用，先选风格 + 媒介定调，再用镜头语言组装具体 prompt
- **角度定义 / 网格规范 / 姿势库** → `character-sheet-formats.md`
