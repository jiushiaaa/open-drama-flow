# 字体、Logo 与口播包装

把用户素材转成“主体、字体、图形、空间、镜头、光影和声音共同编排”的 旧 H3 视频提示词。目标是接近 AE 标题包装和动态海报，不是给原图做推进后放一个词，也不是自动生成品牌广告。

## 最高优先级：Hub builtin 执行与 旧 H3 逐字派单锁

1. 本路线由 media-agent 直接完成素材判断、设置确认和完整提示词工程；不创建 Stage Execution Plan，不把创意写作交给 planner、executor、video agent 或 vendor card。
2. 设置全部确认后生成唯一字符串 `final_h3_prompt`。它必须符合本路线的结构、字符预算和 Reference 规则；展示给用户的代码块内容就是实际送入 旧 H3 的完整字符串。
3. 通过 `task` 交给 video agent 时，只允许逐字传输：

```text
Task type: generation
model: 旧 MiniMax H3
Aspect ratio: <用户确认画幅>
Resolution: 2K
Duration: <用户确认时长>
Prompt handling: VERBATIM COPY ONLY. Do not summarize, shorten, translate, rewrite, reorder, polish, or add text.
Prompt length: HARD LIMIT 7000 characters, including spaces, punctuation and line breaks.

Verbatim prompt (use as-is):
<完整 final_h3_prompt>
```

4. 旧 H3 vendor card / knowledge card 只用于确认模型可用性、合法参数、参考素材槽位、时长、分辨率、音频开关和接口限制；分辨率默认传 `2K`，不得重写、摘要、翻译、润色、重排或替换 `final_h3_prompt`。
5. 展示字符串、task 内的 Verbatim prompt 与 `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）.prompt` 必须字符级一致。调用生成工具时显式传 `vendor_params.resolution="2K"`；若返回的 effective resolution 低于 2K，视为派单未按设置执行。只发送 brief、style summary、composition summary、主体摘要或原始需求让下游继续编写 Prompt，均视为失败。

文案先行硬锁：`text_mode=agent_curated` 时，`FACTS_FOR_COPY → SCENE_PACKAGING_COPY → COPY_TRACE → COPY_DECK → TEXT_WHITELIST` 是不可跳过的顺序。把介绍词当作 music skill 的歌词底稿，先有连续语义再拆屏幕文案；`COPY_DECK` 中任何无法回指介绍词里的事实锚点或概念发散段落，或只有“主体名＋上线/启动/在线”这类包装动作词，均视为文案失败，必须重写后才能派单。

### 口播包装的生成边界

1. 用户选择 `talking_head`，或需求命中口播包装、口播精剪、口播字幕包装、带动效的字幕包装后，最终视觉成片必须调用 `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）`，锁定 `model_id=旧 MiniMax H3`；不得把 `本地字幕格式化与 FFmpeg 烧录流程`、`本地 FFmpeg` 或普通字幕烧录结果当作包装成片交付。
2. 需要准确台词时，可在设置收齐后调用转写工具；转写结果只进入 `speech_facts`、`TEXT_WHITELIST`、重音和时间点，不负责生成视觉样式。
3. `本地字幕格式化与 FFmpeg 烧录流程` 不参与口播包装视觉生成。`本地 FFmpeg` 只能在 旧 H3 已成功生成之后，用于恢复/混合原口播音轨、精确裁切时长或封装容器；不得用它烧录字幕、绘制卡片或替代 旧 H3 生成。
4. 口播包装默认让 旧 H3 同步生成克制触感音效，派单使用 `vendor_params.generate_audio=true`；Prompt 必须要求原对白、口型和房间底噪保持在最前。用户明确“不要新增音效”时才关闭生成音效；需要字符级恢复原对白时，只在 旧 H3 结果之后做确定性音轨处理。

口播视觉硬锁：`CAPTION_TRACK` 必须做“一条一条推进”的基础字幕，单次只呈现一个完整意群/一句话，长句可折成 1–2 行；禁止一次出现多句口播，也禁止全片固定一个底部圆角框。15 秒至少两次 65%–110% `KEYWORD_HERO_TRACK` 关键词包装动画、一次来源明确的素材弹窗/原片 crop/PiP `EVIDENCE_CARD_TRACK`、一次说话人缩到左上/右上角的 `SPEAKER_MINI_HEAD` 小窗版式、两次 2%–3% 合成层轻推近/视差，以及 3–5 个分别绑定关键词、卡片、版式换位的短触感音效。若最终 Prompt 没写出素材来源、卡片证明的台词、停留/退出方式或这些时间点，不得派单。

## 1. 两阶段读取

设置问询前只使用本文件，不预读 Reference。用户完成全部设置后、编写每一条最终 Prompt 之前，用 `读取本地文件或 drama_get_state` 即时读取且只读取一次：

- [h3-execution-grammar.md](h3-execution-grammar.md)：中文派单结构、文案、构图状态、时间轴、全局检查和 7000 字硬上限。
- [subject-packaging-system.md](subject-packaging-system.md)：本次主体、空间模式、口播或原片权限。
- [typography-system-library.md](typography-system-library.md)：字体角色、配色、图形组件、空间关系和动态语法。
- [music-direction-library.md](music-direction-library.md)：所选风格的音乐材料与 cue。
- 仅一份已确认的主风格：
  - 清新可爱风 → [style-fresh-cute.md](style-fresh-cute.md)
  - 科技粒子风 → [style-tech-particle.md](style-tech-particle.md)
  - 炫酷艺术风 → [style-cool-art.md](style-cool-art.md)
  - 暗黑胶片故障风 / dark-pop 故障 / cyber-grunge / 地下音乐杂志 / 黑红 Logo 发布片 → [style-dark-pop-glitch.md](style-dark-pop-glitch.md)
  - 海报大字拼贴风 / 复古拼贴海报 / 拼贴剪纸 → [style-poster-collage.md](style-poster-collage.md)，命中“复古拼贴剪纸”时只启用其中 1A 增强路由
  - 口播包装风 → 使用已读取的 [subject-packaging-system.md](subject-packaging-system.md) 口播分支，不重复读取文件

即使同一 session 早先读过，也不得依赖旧读取结果或记忆摘要；用户改选设置后重新执行这一组读取。不要新增同义 Reference。

## 2. 先建立事实，不替用户做设置

```text
INPUT_FACTS = {
  source_type: video | image | text | mixed,
  source_assets: [真实附件名或素材 ID],
  subject_type: product | person | logo | scene | mixed | unknown,
  logo_layout_type: pure_logo | logo_with_cover_anchor | not_logo | unknown,
  identity_facts: [素材中真实可见、必须保持的轮廓/结构/材质/颜色/脸/字形/空间],
  speech_facts: [准确语句、重音、停顿；无则 none],
  reference_ratio: [只展示，不代替成片画幅],
  has_audio: yes | no | unknown
}

PACKAGING_SETUP = {
  video_use_mode: creative_rework | preserve_original | not_applicable | awaiting,
  subject_mode: product_hero_stage | person_editorial_stage | logo_motion_stage | scene_rebuild_stage | mixed_stage | preserve_original_packaging | awaiting,
  space_mode: preserve_source_space | rebuild_editorial_space | hybrid_local_set | awaiting,
  output_ratio: 16:9 | 4:3 | 1:1 | 3:4 | 9:16 | 21:9 | awaiting,
  resolution: 2K,
  duration: 5s | 10s | 15s | user_value | awaiting,
  style: fresh_cute | tech_particle | cool_art | dark_pop_glitch | poster_collage | talking_head | awaiting,
  text_mode: agent_curated | exact_user_text | awaiting,
  text_language: agent_recommended | Chinese | English | Mixed | awaiting,
  text_whitelist: [准确文字] | awaiting,
  caption_mode: auto_exact_transcript | user_transcript | keyword_only | no_caption | not_applicable,
  music_mode: preserve_original_audio | style_generated_instrumental | user_audio_reference | no_music
}
```

`reference_ratio`、素材气质和文件名都不能自动写入 `output_ratio` 或 `style`。`logo_layout_type` 只由参考图/视频自动判断并回显，不作为问询卡片的新问题。

## 3. 一张前置设置卡收齐项目

缺少设置时显示同一张卡，已确认字段直接回显，不重复问。

进入本路线后，第一次 `question` 调用必须一次携带所有仍为 `awaiting` 的独立设置。设置卡由本路线负责，优先于 media-agent 的通用成片信息问询。禁止先单独询问时长、比例，禁止把时长与比例拼成 `5秒 9:16`、`8秒 16:9` 一类组合选项，也禁止在设置未收齐时调用素材分析、模型能力查询或生成工具。

设置卡前先用一行回显已知事实：

```text
素材=[真实素材]｜视频使用=[二创/锁定/图片输入不适用]｜参考比例=[素材比例，仅供参考，不作为成片比例]｜Logo构图=[纯Logo/Logo+封面锚点/不适用]
```

图片输入直接记录 `video_use_mode=not_applicable`，不把它做成待选问题；检测到视频时，把“视频使用方式”加入同一次 `question` 调用。

问询路由只保留这些规则：无素材也无描述时先让用户选择上传图片、上传视频或输入内容；视频使用方式与空间处理分开判断；锁定原片时强制 `preserve_source_space`；图片仍须确认空间处理，主体类型只调整推荐项顺序；参考比例只回显，不提供“自适应”；`Agent 推荐`仍需用户确认；用户选择必现文字但未提供原文时，下一次只追问准确文字。

### 设置卡固定结构

下面是第一次 `question` 调用的固定骨架。已由用户明确的字段从 `questions` 中移除并在回显行展示；其余字段不得省略。每题单选，推荐项放第一位，用户仍可输入自定义答案。

```json
{
  "questions": [
    {
      "header": "画面处理",
      "question": "画面空间怎么处理？",
      "options": [
        { "label": "保留原环境，只做包装", "description": "保持原构图和空间骨架，只新增多层字体、图形和局部光效。" },
        { "label": "架空重建包装空间", "description": "保留主体身份，重新设计舞台、背景、构图和镜头表现。" },
        { "label": "局部混合", "description": "保留主要环境，只在局部加入纸面、玻璃、光带或字体空间。" }
      ]
    },
    {
      "header": "主体包装",
      "question": "字体和图形主要围绕什么组织？",
      "options": [
        { "label": "产品包装", "description": "锁定产品外形与结构，让字体围绕产品卖点之外的真实特征组织。" },
        { "label": "人物包装", "description": "锁定人物身份，让字体沿脸、肩线、目光、手势或身体轮廓组织。" },
        { "label": "Logo 动效包装", "description": "锁定 Logo/字标几何和可读性；有清晰人物或物件时，将其作为封面锚点与字标共同组织。" },
        { "label": "场景包装", "description": "锁定空间骨架，让字体进入墙面、地面、玻璃、雾或灯带。" }
      ]
    },
    {
      "header": "成片画幅",
      "question": "成片用什么画幅？参考素材比例仅供参考。",
      "options": [
        { "label": "16:9 横屏", "description": "适合横屏内容、电脑和电视展示。" },
        { "label": "4:3 横屏", "description": "主体更集中，适合复古或编辑影像感。" },
        { "label": "1:1 方形", "description": "适合中心主体和四周版式。" },
        { "label": "3:4 竖幅", "description": "适合人物半身、静物和封面式构图。" },
        { "label": "9:16 竖屏", "description": "适合手机全屏和上下纵向排版。" },
        { "label": "21:9 超宽屏", "description": "适合横向运动、空间叙事和跨屏大字。" }
      ]
    },
    {
      "header": "视频时长",
      "question": "这条字体包装视频做多长？",
      "options": [
        { "label": "15 秒", "description": "推荐，足够完成 3–5 个构图状态和完整包装节奏。" },
        { "label": "10 秒", "description": "压缩构图状态，保留主包装段落。" },
        { "label": "5 秒", "description": "适合单一主视觉和短促字体接管。" }
      ]
    },
    {
      "header": "包装风格",
      "question": "选择一套主包装风格。",
      "options": [
        { "label": "Agent 推荐", "description": "根据真实主体和内容推荐一类风格，仍需你确认。" },
        { "label": "清新可爱风", "description": "圆润字、手写、小涂鸦、圆角框和明快配色。" },
        { "label": "科技粒子风", "description": "几何字、粒子聚合、扫描、透明框和冷光。" },
        { "label": "炫酷艺术风", "description": "融合折射塑料、主体变形字、3D 赛事海报和暗黑扫描裂变。" },
        { "label": "暗黑胶片故障风", "description": "黑红高反差、地下音乐杂志、胶片扫描、复印纸故障和 Logo/字标封面定格。" },
        { "label": "海报大字拼贴风", "description": "粗黑或粗宋、纸面、色块、边框、套印和重复字阵。" },
        { "label": "口播包装风", "description": "准确字幕、重音关键词、设计化大字和语义响应动画。" }
      ]
    },
    {
      "header": "文字控制",
      "question": "画面中的可读文字怎么确定？建议优先提供必现文字，Agent 负责拆层级、提关键词和做包装动效。",
      "options": [
        { "label": "输入必现文字", "description": "推荐。由你提供核心标题、短句或关键词，Agent 逐字保留并拆成主标题、次级文案和编辑标签。" },
        { "label": "Agent 自动搭配", "description": "没有现成文案时使用。Agent 会先写一段介绍词，再从中提炼屏幕文字；你可以继续修改。" }
      ]
    },
    {
      "header": "文字语言",
      "question": "屏幕文字使用什么语言？",
      "options": [
        { "label": "Agent 推荐", "description": "根据主体、内容、观看距离和文案可读性推荐语言组合，并在确认时说明推荐理由；不会改写你提供的必现文字。" },
        { "label": "纯中文", "description": "所有新增屏幕文字使用中文，适合需要直接读懂的中文信息。" },
        { "label": "纯英文", "description": "所有新增屏幕文字使用英文，适合明确的英文内容或国际化视觉。" },
        { "label": "中英混排", "description": "中文承担主要信息，英文承担独立的编辑层，不逐条翻译同一句话。" }
      ]
    }
  ]
}
```

检测到视频且 `video_use_mode=awaiting` 时，在数组第一项加入：

```json
{
  "header": "视频使用",
  "question": "原视频在成片中怎么使用？",
  "options": [
    { "label": "根据视频二创", "description": "继承主体、关键动作、语义和声音节奏，允许局部重构。" },
    { "label": "锁定原片，只做包装", "description": "保持原片镜头、剪辑、速度、色彩、光线和声音，只新增包装层。" }
  ]
}
```

主体包装的推荐项根据 `subject_type` 排到第一位，但不能替用户自动确认。文字控制默认推荐“输入必现文字”；用户选择“输入必现文字”后仍未给出文字时，下一次只追问准确文字；不重复整张卡。文字语言仍要确认，但它只决定排版角色：必现文字必须逐字保留，不得为了混排强行翻译、补写或替换。选择“Agent 自动搭配”时，必须先写 `SCENE_PACKAGING_COPY` 再拆 `TEXT_WHITELIST`，并允许用户继续改文字。选择“Agent 推荐”后，先根据主体、观看场景和文案长度给出一句推荐理由，再写入 `text_language`。

设置回显：

```text
已确认设置：素材=[真实素材]｜视频使用=[二创/锁定/不适用]｜画面处理=[保留/重建/局部混合]｜主体包装=[模式]｜画幅=[比例]｜分辨率=2K｜时长=[秒数]｜风格=[风格]｜文字=[自动/必现]｜字幕=[模式]｜音乐=[模式]
```

字段仍为 `awaiting` 时继续同一张卡，不生成派单 Prompt。

## 4. 设置确认后的唯一执行链

1. 按第 1 节即时读取五类 Reference，不使用同一 session 的旧摘要。
2. 按 `h3-execution-grammar.md` 先列 `FACTS_FOR_COPY`，再写 `SCENE_PACKAGING_COPY`（一段连贯、可读懂的产品/场景介绍词），然后用 `COPY_TRACE` 逐条从介绍词拆出 `COPY_DECK / TEXT_WHITELIST`，完成语言检查和字符预算；不能直接从主体名、风格名、字体动作或材质词拼关键词，介绍词也不要求整段全部上屏。
3. 按 `subject-packaging-system.md` 锁定主体身份、空间权限和本次主体最低交付；产品必须建立 `PRODUCT_PROTECTED_LAYER`。
4. 按 `typography-system-library.md` 选择可见字体骨架与 2–4 个动作机制；再套当前风格 Reference 的独有材质、状态和锁定块。
5. 按 `music-direction-library.md` 写音乐模式、声音材料和逐状态 cue。
6. 严格使用 `h3-execution-grammar.md` 的唯一 Prompt 模板和全局检查，再执行当前主体与风格的专属检查。

## 5. 唯一派单

最终只输出一个使用 `working_language`、目标 5600–6200、绝不超过 7000 字符的 `final_h3_prompt`。长度按实际字符串逐字符计数，包含空格、标点、换行和素材标记；超过 7000 或无法可靠计数时禁止展示和派单。自动压缩顺序：先删重复形容词 → 合并重复身份/负面边界 → 合并相邻状态的同义句；保留准确文字、时间点、字体角色、素材来源、空间关系、动作链和必要检查。展示、task 内 Verbatim prompt 与 `drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）.prompt` 必须逐字一致；`drama_request_paid_batch → 用户批准 → drama_resume_paid_batch（Seedance 2.5）` 的 `vendor_params.resolution` 默认传 `2K`，并检查返回值；所有设置未确认、Reference 未即时读取或任一全局/主体/风格检查未通过时，不得派单。
