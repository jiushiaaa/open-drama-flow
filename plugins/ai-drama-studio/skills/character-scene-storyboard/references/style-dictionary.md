# 风格词典(6 种预设)

每种风格控制三层视觉语言:**文档底色 × 插图画风 × 分镜格渲染**。

第 1 阶段从这里挑一种,把对应行的 `文档底色 / 角色立绘 / 场景概念 / 分镜格 / 关键词` 五个字段抄到 `references/prompt-template.md` 的 `{STYLE_*}` 占位符。**五项必须配套使用,不得跨风格混搭。**

> 默认风格:S2 写实电影感(用户未指定时使用)

---

## 🎨 S1 复古彩铅速写
> 适合:童话、绘本、温暖回忆、自然题材、文艺片、儿童/少年向

| 层 | 描述 |
|----|------|
| 文档底色 | 暖米白略泛黄 #f5ede0,手绘浅褐线不规则分区,棕褐色手写感标题栏(白字) |
| 角色立绘 | 复古彩铅速写,温暖低饱和配色,可见纸纹与彩铅笔触,线条略带毛糙感 |
| 场景概念 | 彩铅速写风景,淡水彩底色 + 彩铅细节叠加,暖色怀旧,留白多 |
| 分镜格 | 彩铅速写 + 浅彩铅渲染,粗线勾勒主体,局部彩铅笔触表现明暗 |
| 关键词 | vintage colored pencil sketch, hand-drawn pencil texture, warm desaturated palette, paper grain visible, sketchy gesture lines, light watercolor wash underneath, illustrated storybook feel |

---

## 🎬 S2 写实电影感(默认)
> 适合:现代剧情、谍战、悬疑、剧情短片、广告片、电影预告、写实纪录

| 层 | 描述 |
|----|------|
| 文档底色 | 深炭黑 #1a1a1a,极细暖灰金线分区,深棕金属质感标题栏(白字)+ 暗角虚化 |
| 角色立绘 | 照片级写实数字摄影,真实自然光照,浅景深半身肖像,皮肤毛发细节可见,电影色彩分级 |
| 场景概念 | 真实电影帧场景照,电影色彩分级(略偏青/橘对比),35mm 镜头质感,环境光与体积光自然 |
| 分镜格 | 彩色电影截图风,色彩分级 + 浅景深 + 轻微 film grain,接近真实影片定帧画面 |
| 关键词 | cinematic photography, photorealistic, color graded film still, 35mm anamorphic lens, shallow depth of field, natural volumetric lighting, subtle film grain, teal-orange color grade, professional movie production |

---

## ✏️ S3 黑白速写
> 适合:快速分镜提案、动作戏速记、剧情结构分析、手绘草稿、动画师 layout

| 层 | 描述 |
|----|------|
| 文档底色 | 纯白 #ffffff,极细黑色手绘线分区(略带速写抖动感),黑框白底黑字标题栏 |
| 角色立绘 | 黑白速写,gesture lines 主结构 + cross-hatching 局部阴影,边缘随性,有手稿粗糙感 |
| 场景概念 | 透视速写,主结构准但留白多,少量速写阴影线表达体量 |
| 分镜格 | 黑白速写漫画风,gesture lines + cross-hatching 阴影,比纯线稿更有动势 |
| 关键词 | quick black and white sketch, gestural pencil lines, cross-hatching shading, expressive sketchy linework, rough sketchbook feel, no flat color fills, animator layout style |

---

## 🖌️ S4 水墨古风
> 适合:古装、仙侠、武侠、历史、东方美学、神话

| 层 | 描述 |
|----|------|
| 文档底色 | 宣纸米黄 #f5f0e8,淡墨线分区,朱砂红标题栏(红底白字) |
| 角色立绘 | 中国传统工笔线描 + 淡彩水墨晕染,笔触飘逸,留白多 |
| 场景概念 | 山水墨迹风,泼墨大写意,近实远虚,朦胧意境 |
| 分镜格 | 淡墨勾线 + 水墨晕染,笔触可见,东方审美留白 |
| 关键词 | Chinese ink wash painting, gongbi line art, xuan paper texture, red vermillion title bars, ink splatter, negative space |

---

## 💥 S5 欧美动漫
> 适合:超英、暗黑奇幻、西部、美式动作、漫改电影

| 层 | 描述 |
|----|------|
| 文档底色 | 米黄旧纸 #f2ead8,粗黑线框分区,黑红标题栏(红底白字) |
| 角色立绘 | 欧美动漫风格(超英漫画底子),粗轮廓线,强调肌肉体积,夸张透视 |
| 场景概念 | 漫画背景速写,粗笔触,网点纹理,戏剧化透视 |
| 分镜格 | 粗黑边框,半调网点阴影,文字框气泡感,动态线条 |
| 关键词 | American comic book style, bold outlines, halftone dot shading, exaggerated perspective, dynamic action lines, aged paper texture |

---

## 🌸 S6 二次元动漫
> 适合:动画、轻小说、游戏角色、青春故事、校园

| 层 | 描述 |
|----|------|
| 文档底色 | 浅蓝灰 #eef2f7,细蓝色线分区,深蓝标题栏(白字) |
| 角色立绘 | 日系动漫风格,大眼睛,流畅线稿,cel-shading 平涂 |
| 场景概念 | 动漫背景画风,色彩明亮,透视夸张,细节丰富 |
| 分镜格 | 动漫分镜格风,粗边框,速度线,动态感强 |
| 关键词 | anime style, cel-shading, clean Japanese animation linework, expressive eyes, vibrant flat color, manga panel borders |

---

## 风格叠加规则

用户可以在预设风格上叠加修饰词,例如:
- `S2 写实电影感` + `"夜色赛博"` → 在 S2 关键词基础上加 `with neon city lights, rain-slicked streets, cyberpunk color palette`
- `S4 水墨古风` + `"加金粉效果"` → 叠加 `with gold leaf accents, gilded ink details`
- `S6 二次元` + `"暗黑风"` → 叠加 `dark fantasy, muted desaturated palette, heavy shadow`
- `S1 复古彩铅` + `"加梦幻"` → 叠加 `with dreamy soft glow, pastel highlights, surreal atmosphere`

叠加词直接追加到 Prompt 的 DOCUMENT STYLE 段末尾(`{EXTRA_STYLE_MODIFIERS}` 占位符)。
