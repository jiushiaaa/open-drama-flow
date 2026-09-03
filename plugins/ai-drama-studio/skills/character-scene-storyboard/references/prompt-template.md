# 综合设定图 Prompt 模板

第 2 阶段构建综合设定图提示词时使用此模板。所有 `{占位符}` 必须填实，`{STYLE_*}` 字段从 `references/style-dictionary.md` 选定的风格里取。

## 关键填写规则

- **风格字段全部基于第 1 阶段确认的 `{STYLE_NAME}`**,从风格词典对应行抄写
- **`{LAYOUT_INSTRUCTION}` 描述各模块的相对权重**，不写固定坐标，让所选模型按内容排版
- **`{panel_ratio}` 是分镜格内的画面比例**,与文档整体比例无关
- **NEGATIVE 段必须按选定风格调整**——若选中 S6 二次元则不能再写 `color anime style`,若选中 S5 欧美动漫则不能再禁掉 `halftone`,若选中 S2 写实电影感则不能再禁 `photorealistic`
- **`{STYLE_PANEL_RENDER}` 已在每种风格里定义**,storyboard 模块直接用占位符,不要再硬编码 "ink sketch / gray wash"

## 模板正文

```
Generate a single comprehensive pre-production design sheet image.
This must be ONE single image — a professional animation/film concept art document.
Do NOT output separate images.

⚠️ DOCUMENT STYLE — SELECTED VISUAL STYLE: {STYLE_NAME} (highest priority)
Fill in the following from the Style Dictionary based on the user's chosen style:
- Document background: {STYLE_BG_COLOR_DESC}
  e.g. S2→ "deep charcoal black #1a1a1a cinematic" | S1→ "warm yellowed paper #f5ede0" | S4→ "xuan paper ivory #f5f0e8"
- Section divider lines: {STYLE_DIVIDER_DESC}
  e.g. S2→ "fine warm gold lines" | S3→ "hairline black sketch lines" | S6→ "thin blue lines"
- Section title bars: {STYLE_TITLEBAR_DESC}
  e.g. S2→ "dark bronze metallic bar, white text" | S4→ "vermillion red bar, white text" | S5→ "black-red bar, white text"
- Character illustration rendering: {STYLE_CHARACTER_RENDER}
  e.g. S2→ "photorealistic studio portrait, natural lighting, shallow DoF, color graded" | S6→ "anime cel-shading, clean outlines, flat color" | S1→ "vintage colored pencil sketch, warm desaturated palette, paper grain"
- Scene concept rendering: {STYLE_SCENE_RENDER}
  e.g. S2→ "real cinematic film still, color graded, 35mm anamorphic, volumetric lighting" | S4→ "ink splash landscape, ink wash, negative space" | S3→ "perspective sketch with light hatching, no flat color"
- Storyboard panel rendering: {STYLE_PANEL_RENDER}
  e.g. S2→ "color cinematic film still, color grading + shallow DoF + subtle film grain" | S5→ "halftone dot shading, bold outlines, comic panel borders" | S6→ "anime panels with speed lines, vibrant flat color, manga borders" | S3→ "black and white gestural sketch with cross-hatching, no color fills"
- Additional style keywords: {STYLE_KEYWORDS} {EXTRA_STYLE_MODIFIERS}
- The entire document — character drawings, scene art, storyboard panels, backgrounds — must use this single consistent style. No style mixing between modules.
- Document header at very top spanning full width:
  "{PROJECT_TITLE} | 角色设定与分镜设计 CHARACTER & STORYBOARD DESIGN SHEET"

⚠️ LAYOUT — DO NOT use a fixed 4-quadrant grid. Arrange all content modules below
based on their relative size needs. Let the layout emerge from the content:
- {LAYOUT_INSTRUCTION}
  (e.g. "Character sheets for A and B need equal space at the top half;
   scene concept gets a medium region at bottom-left;
   storyboard needs the largest area at bottom-right since it has 12 panels")
- The overall document aspect ratio and exact region boundaries are YOUR choice —
  optimize for readability of each module. Do NOT let any fixed ratio constraint
  appear anywhere in this prompt.

⚠️ REFERENCE IMAGES define character appearances:
- {char_ref_path_A}: {CHARACTER_A_NAME} — {detailed_appearance_description}
- {char_ref_path_B}: {CHARACTER_B_NAME} — {detailed_appearance_description}
All character illustrations throughout the document must match these reference images exactly.

⚠️ STORYBOARD PANELS: Each storyboard panel illustration must be composed for {panel_ratio} frame.

═══ CONTENT MODULE: {CHARACTER_A_NAME} CHARACTER SHEET ═══
Section label bar: "{角色名A} {ROLE_A} · 角色设定 CHARACTER SHEET"

Contents:
1. TOP ROW — Three-view character lineup: FRONT view (正面) | SIDE view (侧面) | BACK view (背面)
   Full body, small scale, rendered per {STYLE_CHARACTER_RENDER}
2. CENTER — Large 3/4 portrait bust (chest-up), detailed face clearly showing {face_features_A}
3. EXPRESSION BADGES — 4 circular expression icons:
   {emotion_1_zh} ({emotion_1_en}) | {emotion_2_zh} | {emotion_3_zh} | {emotion_4_zh}
4. DETAILS SECTION — "拆解细节 / DETAILS": {prop_or_detail_description_A}

CHARACTER A full appearance: {full_appearance_description_A}

═══ CONTENT MODULE: {CHARACTER_B_NAME} CHARACTER SHEET ═══
Section label bar: "{角色名B} {ROLE_B} · 角色设定 CHARACTER SHEET"

[same sub-structure as above, adapted for Character B]

CHARACTER B full appearance: {full_appearance_description_B}

[Repeat MODULE block for each additional character C, D...]

═══ CONTENT MODULE: SCENE CONCEPT ═══
Section label bar: "主场景概念 SCENE CONCEPT · {SCENE_NAME}"

Contents:
1. MAIN ILLUSTRATION (occupies most of this module): {detailed_scene_description}
   Lighting: {lighting_description} | Atmosphere: {mood_description}
   Style: {STYLE_SCENE_RENDER}
2. COLOR PALETTE STRIP (bottom of module): 5 color swatches — {hex1} | {hex2} | {hex3} | {hex4} | {hex5}
3. LIGHTING NOTES (small text): "{lighting_scheme_note}"

═══ CONTENT MODULE: STORYBOARD ═══
Section label bar: "分镜设定板 STORYBOARD · {SCENE_TITLE}"

{ROWS} rows × {COLS} columns grid = {TOTAL} panels. Render every panel using {STYLE_PANEL_RENDER}.
Each panel: shot number label top-left corner | illustration ({panel_ratio} composition) | caption below.

{PANEL_01_through_N_descriptions}

Panel style: {STYLE_PANEL_RENDER}, expressive linework. Each panel clearly bordered. ALL {TOTAL} panels must be present and numbered.

═══ CHARACTER CONSISTENCY (across entire document) ═══
{CHARACTER_A_NAME}: always appears as {appearance_summary_A}
{CHARACTER_B_NAME}: always appears as {appearance_summary_B}

═══ NEGATIVE ═══
Fixed 4-quadrant grid that wastes space, separate multiple images, watermarks,
inconsistent character appearance, missing any content module, illegible text,
missing section title bars, fewer storyboard panels than specified,
{STYLE_NEGATIVE_EXTRA}

(For {STYLE_NEGATIVE_EXTRA} — fill in style-conflicting items: e.g. for S2 写实电影感 add "anime style, hand-drawn sketch, flat color illustration, cartoon"; for S6 二次元 add "muddy realistic rendering, photographic"; for S5 欧美动漫 add "soft pastel tones, photorealistic"; for S3 黑白速写 add "color, photographic, fully rendered painting"; for S1 复古彩铅 add "harsh saturated colors, photorealistic, hard edge"; for S4 水墨古风 add "western style, photorealistic, neon colors".)
```

## 分镜格描述构建规则

每个 `{PANEL_XX_description}` 需包含：
- 镜号(PANEL 01)
- 景别(Wide Shot / Medium Shot / Close-up / Extreme Close-up)
- 画面内容(Who does what, where, how — 主体+动作+方向+位置)
- 情绪标注
- Caption 文字(中文,≤ 15 字)

### 景别速查表

| 中文 | 英文 | 缩写 |
|------|------|------|
| 大远景 | Extreme Wide Shot | EWS |
| 全景 | Wide Shot | WS |
| 中全景 | Medium Wide Shot | MWS |
| 中景 | Medium Shot | MS |
| 中近景 | Medium Close Shot | MCS |
| 近景 | Close-up | CU |
| 特写 | Extreme Close-up | ECU |

### 12 格分镜节奏建议

| 格号 | 建议景别 | 作用 |
|------|---------|------|
| 01 | WS / MWS | 建立空间与人物位置关系 |
| 02-03 | MS | 主角行动开始,交代动机 |
| 04-05 | CU | 关键道具/表情特写,强化情绪 |
| 06-07 | MS | 对手角色反应,心理对比 |
| 08-09 | ECU | 极致情绪特写(眼睛/手/道具) |
| 10-11 | MS / MCS | 冲突升级或转折 |
| 12 | WS | 终镜——空间确认,张力凝固 |
